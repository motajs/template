# 示例（六）动画、拆分与注册

前面五步已经把网格、详情、滚动与交互拼起来了。最后一步补三件事：让选中态与提示动起来、把代码落回五个文件、把面板注册成 `GameUI` 并从打开处接入。

## 前置知识

阅读本篇前，建议先读完：

- [示例（五）交互与状态](./inventory-example-5-state.md)
- [自定义组件](./custom-components.md)
- [UI 系统](./ui-system.md)

## 最后一步要收什么

收尾不是「再加一个功能」，而是把前面五步已经写下的东西固定下来：

```text
src/client/ui/
├─ inventory/
│  ├─ inventory-panel.tsx   InventoryPanel：根容器、标题、关闭、共享状态
│  ├─ item-grid.tsx         ItemGrid：行容器数组、行列计算、选中/装备比较
│  ├─ item-cell.tsx         ItemCell：单个格子的背景、名称、数量与描边
│  ├─ item-detail.tsx       ItemDetail：详情、描述与未选中提示
│  └─ action-bar.tsx        ActionBar：装备 / 使用 / 关闭按钮
└─ index.ts                 导出 InventoryUI，供打开处引用
```

每个文件的职责在示例（一）就定好了，这里只是把它们落到真实路径。下面依次说明动画挂在哪、最终组装怎么核对、注册与打开怎么写、以及一份可以逐项验证的清单。

## 动画作用在树的哪一层

动画只驱动响应式值，不重建组件。本篇只做两处：

- **面板呼吸描边**：面板主体之后加一个同样大小的描边矩形，只改它的 `alpha`。
- **提示淡出**：底部提示文字只改 `alpha`，文字内容仍由 `hint` 决定。

```tsx
import { onMounted, onUnmounted, ref, watch } from 'vue';

const pulse = ref(0.4);
const hintAlpha = ref(1);
// 上一次提示变化的时间，用来算淡出进度
let lastHintAt = 0;
let raf = 0;

const tick = (now: number) => {
    // 0～1 之间来回变化，只驱动描边的 alpha
    const phase = (now % 1600) / 1600;
    pulse.value = 0.35 + Math.sin(phase * Math.PI * 2) * 0.3;

    // 提示变化后 1.2 秒内淡到 0.4，之后保持
    const since = now - lastHintAt;
    hintAlpha.value = since < 1200 ? 1 - (since / 1200) * 0.6 : 0.4;

    raf = requestAnimationFrame(tick);
};

// 提示一变就重新计时，动画不参与提示内容的计算
watch(hint, () => {
    lastHintAt = performance.now();
    hintAlpha.value = 1;
});

onMounted(() => {
    raf = requestAnimationFrame(tick);
});

onUnmounted(() => {
    // 组件卸载后必须停掉，否则回调会继续访问已销毁的组件
    cancelAnimationFrame(raf);
});
```

两个动画节点都挂在面板根容器下：

```tsx
{
    /* 呼吸描边：只改 alpha，不重建组件；noevent 不拦截点击 */
}
<g-rectr
    loc={[30, 30, 660, 420]}
    circle={[18]}
    stroke
    strokeStyle="#f2b84b"
    alpha={pulse.value * 0.6}
    noevent
/>;

{
    /* 提示：内容来自 hint，只有透明度在动 */
}
<text
    loc={[54, 432]}
    text={hint.value}
    fillStyle="#8fb6ff"
    alpha={hintAlpha.value}
/>;
```

描边与提示都是面板的兄弟节点，不进入 `ItemGrid` 或 `ItemDetail` 的 props 链，所以动画不会改变数据流：`items` 仍由面板持有，`selectedId` 仍由点击驱动，格子的描边仍由 `selected` / `equipped` 决定。`noevent` 让描边只负责好看，不参与命中；不加它，整块面板的点击都会被这层描边接走。

`pulse` 每帧只写一个数字，元素属性跟着变；组件本身不会重新创建。停止动画放在 `onUnmounted`，否则页面切走后回调仍在跑。仓库里另有 `transitioned` / `transitionedColor` 渐变工具，返回值是 `ITransitionedController<...> | null`，使用前必须判空；本篇不依赖它，避免把可空值带进每一帧。

## 最终组装与契约核对

六篇共用的系列契约逐条对照最终代码：

| 契约 | 内容                | 最终写法                                                                                        |
| ---- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 1    | `items` 的形态      | `InventoryPanel` 里 `const items = ref<Item[]>(...)`；子组件收 `items.value`，派生用 `computed` |
| 2    | `Item` 来源         | 只在示例（二）定义一次，后续文件 `import` 同一份类型                                            |
| 3    | `selectedId` 空值   | `ref<string \| null>(null)`；未选中显示「请选择道具」；「取消选择」写回 `null`                  |
| 4    | 关闭归属            | 面板调用 `props.controller.close(props.instance)`；子组件只 `emit('close')`                     |
| 5    | 左侧最终方案        | `Scroll`；示例（二）的普通网格是阶段性实现，示例（四）已替换                                    |
| 6    | 布局坐标（layout）  | 左侧 `[54, 100, 400, 280]`、右侧 `[470, 100, 196, 280]`、操作条 `[54, 392, 304, 32]`            |
| 7    | 组件拆分与 props 链 | `InventoryPanel → ItemGrid → ItemCell`；`ItemDetail` 与 `ActionBar` 平级接收结果                |
| 8    | key                 | 格子 `key={item.id}`；行容器 `key={row}`，因为行只表示位置                                      |
| 9    | 事件流              | `ItemCell → ItemGrid → InventoryPanel`；操作条 `emit` 后由面板决定动作                          |

最终组装的骨架（省略内部细节）：

```tsx
<container loc={[0, 0, 720, 480]}>
    <g-rect loc={[0, 0, 720, 480]} fill fillStyle="#0e141b" />
    <g-rect
        loc={[0, 0, 720, 480]}
        fill
        fillStyle="#000000"
        alpha={0.35}
        noevent
    />

    <container loc={[0, 0, 720, 480]}>
        <g-rectr
            loc={[30, 30, 660, 420]}
            circle={[18]}
            fill
            fillStyle="#1d2b45"
        />
        <g-rectr
            loc={[30, 30, 660, 420]}
            circle={[18]}
            stroke
            strokeStyle="#f2b84b"
            alpha={pulse.value * 0.6}
            noevent
        />

        <text loc={[54, 52]} text="背包" fillStyle="#e8f0ff" />
        <container loc={[626, 50, 56, 32]} onClick={close}>
            …
        </container>

        <container loc={[54, 100, 400, 280]}>
            <Scroll ref={scroll} loc={[0, 0, 372, 244]} padEnd={16}>
                <ItemGrid
                    items={items.value}
                    selectedId={selectedId.value}
                    equippedId={equippedId.value}
                    columns={5}
                    cellSize={66}
                    gap={8}
                    onSelect={id => (selectedId.value = id)}
                />
            </Scroll>
        </container>

        <container loc={[470, 100, 196, 280]}>
            <ItemDetail
                item={selectedItem.value}
                onClear={() => (selectedId.value = null)}
            />
        </container>

        <container loc={[54, 392, 304, 32]}>
            <ActionBar
                canEquip={canEquip.value}
                canUse={canUse.value}
                equipped={isEquipped.value}
                onEquip={equip}
                onUse={use}
                onClose={close}
            />
        </container>

        <text
            loc={[54, 432]}
            text={hint.value}
            fillStyle="#8fb6ff"
            alpha={hintAlpha.value}
        />
    </container>
</container>
```

如果前面某一页的写法与本表冲突，以本表为准：左侧只有 `Scroll` 一个方案，`selectedId` 只有 `null` 一种空值，关闭只有面板一个入口。前面页面已经写过的坐标若与这里不同，按这里替换；本篇不再给第二个方案。

本表与最终骨架里的坐标都相对 720×480 根容器：面板主体矩形自己画在 `[30, 30, 660, 420]`，标题 `[54, 52]` 直接相对根容器，不要再套一层 `[30, 30]` 的容器；否则标题会被再加一次偏移。

最终骨架里那层同尺寸的 `container [0, 0, 720, 480]` 是面板根：外层是画布根，里层是面板根（实际代码用 `hidden` 控制开合）。新内容加到面板根这一层，不要加到画布根上；两层的 `loc` 相同，所以坐标写法不变，但层级职责分开。

## 注册与打开

`InventoryPanel` 与 `GameUI` 在同一个文件里导出：

```tsx
// inventory-panel.tsx：把名字与组件绑成一个对象
import { GameUI } from '@motajs/system';

export const InventoryUI = new GameUI('inventory-panel', InventoryPanel);
```

`src/client/ui/index.ts` 再统一导出，打开处只认这个对象：

```ts
// src/client/ui/index.ts
export { InventoryUI } from './inventory/inventory-panel';
```

打开时把对象交给控制器，返回值就是这次打开的实例：

```tsx
// 从主 UI 栈打开
const instance = props.state.mainUIController.open(InventoryUI, {});

// 关闭时把同一个实例交回去（面板内部用 props.instance 拿到它）
props.state.mainUIController.close(instance);
```

打开时传的是 `GameUI` 对象本身，名字不参与查找；构造与命名的规则见[第 1 篇「UI 通用模板」](../basics/ui-template.md#gameui-是一个对象不是名字)。

关闭当前面板、马上打开另一个面板时，用 `props.controller.keep()` 包住切换，用完调用 `safelyUnload()`，避免背景闪一下；用法见[「UI 系统」的「keep」](./ui-system.md#keep)。

## 最终验证清单

按下面的顺序点一遍，每一项都对应一条事件路径或一处树位置：

| 验证项   | 操作                    | 预期                                     | 对应路径                                       |
| -------- | ----------------------- | ---------------------------------------- | ---------------------------------------------- |
| 打开     | 从主 UI 栈 `open`       | 720×480 面板出现，右侧显示「请选择道具」 | 控制器创建实例 → `props` 注入 → 根容器挂载     |
| 选中     | 点一个格子              | 格子高亮，右侧显示名称、数量、描述       | `ItemCell → ItemGrid → InventoryPanel`         |
| 取消选择 | 点详情底部「取消选择」  | 高亮消失，右侧回到「请选择道具」         | `ItemDetail` 发 `clear` → 面板写 `null`        |
| 滚动     | 滚轮 / 滚动条 / 按钮    | 行整体上下移动，滚动条位置同步           | `Scroll` 内部处理，格子坐标不变                |
| 装备     | 选中后点「装备」        | 按钮变「已装备」，该格子描边变绿         | `ActionBar` 发 `equip` → 面板写 `equippedId`   |
| 使用     | 点「使用」              | 数量减一，提示刷新，数量为 0 时按钮变淡  | `ActionBar` 发 `use` → 面板改 `items` / `hint` |
| 关闭     | 点标题栏关闭 / 底部关闭 | 面板卸载，背景恢复                       | 面板 `close()` → `controller.close(instance)`  |
| 再次打开 | 再 `open` 一次          | 回到初始状态：未选中、滚动在顶部         | 新实例 → 新状态                                |

关闭后动画必须停：如果 `cancelAnimationFrame` 漏了，再次打开会看到两个循环同时在改 `pulse`，边框呼吸会变得忽快忽慢。这也是清单里「再次打开」要单独验证的原因。

清单里的「再次打开」按 `close` 写：`close` 会卸载实例，再 `open` 得到新实例，所以未选中、滚动在顶部。如果你改用 `hide` 隐藏面板，实例与滚动位置都会保留，这一行的预期要相应改成「回到隐藏前的位置」；两种语义的区别见[第 7 篇「显示开关」](../basics/layer-transform-performance.md)与[「UI 系统」的「隐藏与显示」](./ui-system.md#隐藏与显示)。

## 运行效果

下面是完整面板的 live：网格、详情、滚动、装备 / 使用、关闭与动画都在。关闭后可以用「重新打开」按钮回到面板。

<ClientOnly>
  <RenderDemo :loader="fullLoader" :width="720" :height="480" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const fullLoader = () =>
    import('../../.vitepress/components/demos/ui/inventory-6-full.tsx');
</script>

## 边界与注意

- 动画在卸载后必须停。`onUnmounted` 里调用 `cancelAnimationFrame`，不要只停一次。
- 动画节点不要进入子组件的 props 链。只改面板自己节点的 `alpha`，数据流保持单向。
- 拆分后 Props 要逐层传。不要用全局变量绕过父子关系，否则读者无法从文件结构看出数据流。
- 注册只是把名字和组件绑成一个对象，不写入名字查找表。不要按名字取 UI，也不要做全局注册表。
- 最终 live 如果跑不起来，保留代码与说明，不要删内容；先确认真实客户端环境与依赖是否齐全。
- 性能建议先测再改。`hidden`、`Scroll`、`key` 与组件粒度是四条固定口径，不要为了「看起来更快」额外加缓存。
