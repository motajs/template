# 按键与快捷键

UI 里经常需要「按 Esc 关闭」「按 Enter 确认」「按方向键切换选中项」。不需要自己监听键盘：按键系统负责按键匹配、作用域与优先级，也负责让玩家在设置界面里改键。

下面按「在哪里写」「组件里怎么接」「什么时候需要额外参数」展开。

## 按键与元素事件

元素事件来自画布上的指针：先做命中测试，找到指针下的元素，再沿容器捕获与冒泡，关心的是「点在哪里」。

按键事件来自键盘：直接匹配指令，不经过画布命中，关心的是「按了什么」。

两条路径互相独立：按 Enter 不会触发按钮的 `onClick`，点按钮也不会触发绑定在 Enter 上的指令。两者可以同时存在，但没有统一的先后顺序；需要协同时，用一个共享的 `ref` 记录状态，让两边都读写同一份状态。

## 指令与分组

指令和分组都注册在 `src/client/misc/hotkey.ts` 的 `initializeHotkey` 里。UI 组件里出现 `system.addCommand(...)` 或 `hotkey.setGroup(...)` 都是错误写法。

`hotkey.setGroup(groupId, name, commands)` 的第三个参数是指令数组，直接在数组里调用 `system.addCommand(...)`：

```ts
// src/client/misc/hotkey.ts
import { HotkeyEmitMode, KeyCode } from '@motajs/system';
import { IClientCore } from '@user/client-modules';

export function initializeHotkey(state: IClientCore) {
    const hotkey = state.hotkey;
    const system = hotkey.system;

    hotkey.setGroup('@my-ui', '我的界面', [
        system.addCommand('@my-ui/refresh', '刷新面板', {
            defaults: [[KeyCode.KeyR]]
        }),
        system.addCommand('@my-ui/save', '保存', {
            defaults: [[KeyCode.Ctrl, KeyCode.KeyS]],
            mode: HotkeyEmitMode.Once
        })
    ]);
}
```

`addCommand(command, name, init)` 的 `command` 是全局指令 id。已有指令用命名空间前缀区分，例如 `@common/exit`、`@ui/book`、`@game/undo`；新增时用类似 `@my-ui/refresh` 的前缀，避免和已有 id 冲突。

`defaults` 是默认按键组合。

分组只影响设置界面里的显示，不影响按键是否生效。不分组也能用，只是不会出现在设置界面里。重复注册同一个 id 不会创建第二条指令，只会返回已有指令并给出警告。

`props.state.hotkey` 是客户端按键门面（`IClientHotkey`），`system` 是底层 `IHotkeySystem`：`addCommand` / `deleteCommand` 在 `system` 上，`setGroup` 在门面上。

### 触发方式

| 取值                        | 含义             | 默认 |
| --------------------------- | ---------------- | ---- |
| `HotkeyEmitMode.KeyUp`      | 按键抬起时触发   | 是   |
| `HotkeyEmitMode.Once`       | 按下时只触发一次 | 否   |
| `HotkeyEmitMode.Continuous` | 按住后持续触发   | 否   |

`mode` 不写时是抬起触发。菜单里的「按一下执行一次」用默认抬起；需要按住连发才用持续触发。持续触发可以用 `timeout`、`interval`、`dt` 控制首次延迟与后续间隔，单位都是毫秒；这些是最小间隔，实际间隔只会不小于设定值，不能当作精确计时器。

### 优先级与阻断

`priority` 越高越先执行，目前只对抬起触发的指令生效。`block` 为 `true` 时，会阻断优先级比它更低的指令；同优先级的指令会全部执行，不会互相阻断。这两个属性同样在 `hotkey.ts` 的 `addCommand` 里设置。

它们比较的是同一次按键匹配到的多条指令，不是两个界面之间的优先级。两个界面谁生效由作用域栈决定，见[按键与 UI 栈](#按键与-ui-栈)。

## 组件中的实现

组件只做一件事：把当前界面的作用域接到指令回调上。

`useKey` 从 `@user/client-base` 引入，必须在 `setup` 中同步调用，才能拿到当前组件实例与作用域。它返回 `IHotkeyUsing | null`，组件内必定有实例，直接用非空断言 `!`：

```tsx
// setup
import { useKey } from '@user/client-base';

const key = useKey(props.state.hotkey.system)!;

key.implement('@common/exit', () => {
    props.controller.close(props.instance);
});

key.implement('@common/confirm', () => {
    props.controller.close(props.instance);
});
```

回调通常写成无参的 `() =>`：一般情况下只关心触发了哪个指令，不需要 `info`。只有确实需要触发元信息时才接收 `info`，不要用它判断语义，见[辅助按键与按键组合](#辅助按键与按键组合)。

`useKey` 返回的对象只有 `implement()`、`scope()`、`when()`，它不是按键系统，也不是 `system`。不要在它上面调用 `addCommand`、`setGroup`、`deleteCommand`；需要这些方法时，单独取 `props.state.hotkey.system` 或 `props.state.hotkey`。

`implement` 把指令接到当前作用域，可以连续调用。同一次挂载里对同一指令重复 `implement` 会覆盖前一个回调，并给出警告。指令 id 拼错、或指令还没注册就 `implement`，不会抛异常，只会记录一条警告；「按了没反应」时先核对 id，再确认当前界面是否在栈顶。

### 启用条件：when

`when(() => boolean)` 给当前 `useKey` 的作用域设置启用条件：返回 `false` 时，这个界面的指令不会触发。适合临时禁用当前界面的快捷键。

```tsx
// setup
const key = useKey(props.state.hotkey.system)!;
const enabled = ref(true);

key.when(() => enabled.value);
key.implement('@common/exit', () => { ... });
```

条件在按键按下时判断一次；不要依赖「按下时 `false`、抬起时 `true` 就能触发」，按下时条件不成立，这次按键就不会生效。条件函数里直接读响应式值即可。

`when` 作用于当前 `useKey` 的作用域，不是全局系统。不要在其他作用域上调用它来改当前界面。

### 作用域与生命周期

`useKey` 在组件挂载时进入一个新作用域，组件卸载时自动离开，不需要手动清理。

第二个参数 `clearImpl` 默认是 `true`，新作用域不继承下层界面的实现。传 `false` 时，下层已经实现的指令会复制到新作用域里继续生效，适合「面板打开时全局快捷键仍然可用」的场景；当前面板重新实现的指令会覆盖下层版本。

### 子组件

普通子组件没有 `props.state`：把父级面板的 `props.state.hotkey.system` 作为普通 prop 传下来（类型 `IHotkeySystem` 从 `@motajs/system` 导入），在子组件 `setup` 里 `useKey(system)!`。也可以把按键处理留在能拿到 `props.state` 的父级面板，子组件只 emit。

## 辅助按键与按键组合

`defaults` 是二维数组：每一项是一组按键组合，组内最后一个键是主按键，前面的键是辅助键。`[[KeyCode.Ctrl, KeyCode.KeyS]]` 表示按住 Ctrl 再按 S；单按 S 不会匹配。

辅助键要先于主键按下。抬起触发时，只有在辅助键和主键都按下后松开主键才触发。同一条指令可以写多组组合；同时能匹配多组时，只会触发辅助键精确匹配的那一组。

一般不要判断具体按键，包括 `info.keys` 和 `info.context`。玩家可以在设置界面里改键，按键和组合会变，按当前键位分支会得到错误的语义。

同一语义、只是默认组合不同时，在一条指令里写多个 `defaults`，组件里只 `implement` 一次，不需要 `info`：

```ts
// src/client/misc/hotkey.ts
hotkey.setGroup('@my-ui', '我的界面', [
    system.addCommand('@my-ui/refresh', '刷新面板', {
        defaults: [
            [KeyCode.KeyR], // R
            [KeyCode.Shift, KeyCode.KeyR] // Shift + R
        ]
    })
]);
```

不同语义就拆成不同指令，各自注册、各自 `implement`：

```ts
// src/client/misc/hotkey.ts
hotkey.setGroup('@my-ui', '我的界面', [
    system.addCommand('@my-ui/save', '保存', {
        defaults: [[KeyCode.Ctrl, KeyCode.KeyS]]
    }),
    system.addCommand('@my-ui/quick-save', '快速保存', {
        defaults: [[KeyCode.KeyS]]
    })
]);
```

```tsx
// setup
import { useKey } from '@user/client-base';

const key = useKey(props.state.hotkey.system)!;

key.implement('@my-ui/save', save);
key.implement('@my-ui/quick-save', quickSave);
```

`info` 一般不需要；确实需要触发元信息时才接收，不要用它判断语义。

确实需要 `info` 时，通常是「一条指令有多个语义槽位」：槽位由 `defaults` 里的组合顺序稳定决定，组件只按 `info.index` 取槽位。

例如快速切换装备，`Alt+1` 到 `Alt+0` 依次对应槽位 0 到 9：

```ts
// src/client/misc/hotkey.ts
import { KeyCode } from '@motajs/system';

hotkey.setGroup('@my-ui', '我的界面', [
    system.addCommand('@my-ui/quick-equip', '快速切换装备', {
        defaults: [
            [KeyCode.Alt, KeyCode.Digit1], // 槽位 0
            [KeyCode.Alt, KeyCode.Digit2], // 槽位 1
            [KeyCode.Alt, KeyCode.Digit3], // 槽位 2
            [KeyCode.Alt, KeyCode.Digit4], // 槽位 3
            [KeyCode.Alt, KeyCode.Digit5], // 槽位 4
            [KeyCode.Alt, KeyCode.Digit6], // 槽位 5
            [KeyCode.Alt, KeyCode.Digit7], // 槽位 6
            [KeyCode.Alt, KeyCode.Digit8], // 槽位 7
            [KeyCode.Alt, KeyCode.Digit9], // 槽位 8
            [KeyCode.Alt, KeyCode.Digit0] // 槽位 9
        ]
    })
]);
```

```tsx
// setup
import { useKey } from '@user/client-base';
import { IHotkeyEmitInfo } from '@motajs/system';

const key = useKey(props.state.hotkey.system)!;

// info.index 是触发组合在 defaults 里的下标，正好对应装备槽位
const quickEquip = (info: IHotkeyEmitInfo) => {
    const slot = info.index;
    // 使用 slot 切换装备
};
key.implement('@my-ui/quick-equip', quickEquip);
```

这里需要 `info`，是因为一条指令有多个语义槽位，槽位由组合顺序稳定决定。不要判断 `info.keys` 或具体的数字键：玩家改键后按键会变，但 `info.index` 仍对应槽位。

## 按键与 UI 栈

按键作用域是一条全局栈，不按控制器分开。最后挂载并调用 `useKey` 的面板在栈顶，只有栈顶作用域里的实现会执行：

- 面板 A 打开，A 在栈顶，A 的 Esc 生效。
- 面板 B 打开，B 在栈顶，A 的 Esc 暂时不生效，背景界面也不会同时响应。
- 面板 B 关闭并卸载，B 的作用域移除，A 重新成为栈顶，A 的 Esc 恢复。

这里的「关闭」指组件卸载。只是把面板 `hidden` 起来，组件还在，作用域也还在，它仍然占着栈里的位置。用 `showAll` 让多个面板同时显示时，按键仍然只落到最后挂载的那个面板，不会因为都可见就都响应。

## 默认按键

默认值只是起点，玩家可以在设置界面里改：

| 指令                | 默认按键          | 说明        |
| ------------------- | ----------------- | ----------- |
| `@common/confirm`   | Enter / Space / C | 确认        |
| `@common/exit`      | Escape / X        | 取消 / 返回 |
| `@ui/menu`          | Escape            | 游戏菜单    |
| `@ui/toolbox`       | T                 | 道具界面    |
| `@ui/command`       | Q                 | 装备界面    |
| `@ui/save`          | S                 | 存档界面    |
| `@ui/load`          | D                 | 读档界面    |
| `@ui/book`          | X                 | 怪物手册    |
| `@ui/input-confirm` | Enter             | 输入框确认  |
| `@ui/view-map`      | PageDown / PageUp | 浏览地图    |

表中只列出常用的 UI 指令；游戏按键与系统按键在 `hotkey.ts` 里另有分组。

## 边界与注意

- 按键与元素事件是两条独立路径。不要用元素事件去等按键，也不要用按键去模拟点击。
- 指令和分组只在 `src/client/misc/hotkey.ts` 的 `initializeHotkey` 里注册，UI 组件里不调用 `addCommand` / `setGroup`。
- `useKey` 必须在 `setup` 中同步调用，返回可能为 `null`；组件内用非空断言 `!`。
- `useKey` 返回的对象只有 `implement()`、`scope()`、`when()`，不是 `system`，不要在它上面调用按键系统方法。
- 不要按具体按键、`info.keys` 或 `info.context` 判断行为。玩家可以改键，按键和组合会变，按当前键位分支会得到错误的语义；语义不同就拆成不同指令。
- 按键回调保持短小。不要在里面写长时间的异步任务，需要等待的操作另起流程。
- 一条指令确定不再被任何界面使用时，才在 `hotkey.ts` 里用 `system.deleteCommand` 删除；作用域卸载只清理实现，不会删除指令。
