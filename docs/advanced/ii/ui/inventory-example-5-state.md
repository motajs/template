# 示例（五）交互与状态

网格、详情与滚动都齐了，但面板还只能看不能动。本篇加 `ActionBar`：装备、使用、关闭，并把状态与副作用收口到 `InventoryPanel`。

## 这一步把交互接起来

三类操作各自改变一件事：

| 操作 | 改变什么                     | 状态归谁                 |
| ---- | ---------------------------- | ------------------------ |
| 装备 | 记录「当前选中的道具已装备」 | 面板的 `equippedId`      |
| 使用 | 减少道具数量，刷新提示       | 面板的 `items` 与 `hint` |
| 关闭 | 卸载当前面板实例             | 面板调用控制器的 `close` |

面板持有 `items`、`selectedId`、`equippedId` 与 `hint`；`ItemGrid`、`ItemCell`、`ItemDetail`、`ActionBar` 都只接收结果、上报动作。子组件不保存业务状态，也不直接操作控制器——那是面板的职责。

## 操作条的树与事件流

`ActionBar` 是底部区域里的一个容器，内部三个按钮是它的子节点：

```text
container [54, 392, 304, 32]       底部区域（与左侧区域不重叠）
└─ ActionBar
   └─ container [0, 0, 304, 32]
      ├─ 按钮 [0, 0, 96, 32]       装备 / 已装备
      ├─ 按钮 [104, 0, 96, 32]     使用
      └─ 按钮 [208, 0, 96, 32]     关闭
```

事件从按钮出发，只向上走一层：

```tsx
import { defineComponent } from 'vue';
import { SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';

interface ActionBarProps extends DefaultProps {
    canEquip: boolean;
    canUse: boolean;
    equipped: boolean;
}

interface ActionBarEmits {
    equip: () => void;
    use: () => void;
    close: () => void;
}

const actionBarProps = {
    props: ['canEquip', 'canUse', 'equipped'],
    emits: ['equip', 'use', 'close']
} satisfies SetupComponentOptions<
    ActionBarProps,
    ActionBarEmits,
    keyof ActionBarEmits
>;

const ActionBar = defineComponent<
    ActionBarProps,
    ActionBarEmits,
    keyof ActionBarEmits
>((props, { emit }) => {
    // 按钮禁用时只做视觉弱化，并在点击回调里早返回
    // 三个按钮共用 makeButton，装备、使用、关闭各自发出事件
    const makeButton = (
        x: number,
        label: string,
        enabled: boolean,
        onClick: () => void
    ) => (
        <container
            loc={[x, 0, 96, 32]}
            onClick={() => {
                if (!enabled) return;
                onClick();
            }}
        >
            <g-rectr
                loc={[0, 0, 96, 32]}
                circle={[8]}
                fill
                fillStyle={enabled ? '#2f6fed' : '#26364d'}
                alpha={enabled ? 1 : 0.5}
            />
            <text loc={[12, 8]} text={label} fillStyle="#ffffff" />
        </container>
    );

    return () => (
        // 三个事件都交回父组件处理，操作条本身不决定装备或关闭
        <container loc={[0, 0, 304, 32]}>
            {makeButton(
                0,
                props.equipped ? '已装备' : '装备',
                props.canEquip,
                () => emit('equip')
            )}
            {makeButton(104, '使用', props.canUse, () => emit('use'))}
            {makeButton(208, '关闭', true, () => emit('close'))}
        </container>
    );
}, actionBarProps);

export { ActionBar };
```

`alpha` 只是把按钮画淡，真正的「不能用」由 `if (!enabled) return` 保证。不要用 `hidden` 把按钮藏起来当禁用——那样读者会以为按钮不存在。按钮上的点击先命中最上层的按钮容器，再由 `emit` 交给面板；`ActionBar` 没有 `stopPropagation` 的需求，因为按钮之外没有另一个处理同一事件的父级。

`equipped` 的含义是「**当前选中的道具是否已经装备**」，不是「面板里有没有装备」。所以面板传的是派生值 `isEquipped`，不是 `!!equippedId`；否则选中一把没装备的武器时，按钮会错误显示「已装备」。

## 状态放在 InventoryPanel

```tsx
import { computed, ref, watch } from 'vue';

const items = ref<Item[]>([
    { id: 'potion-red', name: '红药水', count: 3, desc: '恢复少量生命。' },
    { id: 'potion-blue', name: '蓝药水', count: 1, desc: '恢复少量魔力。' }
    // 其余道具...
]);

const selectedId = ref<string | null>(null);
const equippedId = ref<string | null>(null);
const hint = ref('选择道具后可以装备或使用');

// 选中项、可装备、可使用、是否已装备都是派生值
const selectedItem = computed(
    () => items.value.find(item => item.id === selectedId.value) ?? null
);
const canEquip = computed(() => selectedItem.value !== null);
const canUse = computed(
    () => selectedItem.value !== null && selectedItem.value.count > 0
);
const isEquipped = computed(
    () => selectedId.value !== null && equippedId.value === selectedId.value
);

const equip = () => {
    if (selectedItem.value === null) return;
    equippedId.value = selectedItem.value.id;
    hint.value = `已装备：${selectedItem.value.name}`;
};

// 数量减到 0 时，按钮通过 canUse 自动失效
const use = () => {
    const item = selectedItem.value;
    if (item === null || item.count <= 0) return;
    item.count -= 1;
};

// 数量变化是副作用：更新一行提示；「能不能用」是派生值，交给 computed
watch(
    () => selectedItem.value?.count ?? 0,
    (next, prev) => {
        hint.value = `数量：${prev} → ${next}`;
    }
);
```

`computed` 只负责算值，`watch` 只在需要「变化后做一件事」时使用。这里「能不能装备 / 使用」「是否已装备」都是派生值，用 `computed`；「数量变化时更新提示」是副作用，用 `watch`。不要在 `watch` 里再改回被监听的状态，否则会形成循环。

`items` 是 `ref<Item[]>`，内部对象也是响应式的，所以 `item.count -= 1` 会触发重渲染。不要用 `shallowRef` 装这组数据——那样改对象字段不会通知视图。

## 状态变化如何反映到画面

三条路径各自对应树上的一处：

```text
装备 → equippedId 变 → isEquipped 变 → ItemGrid 的 equippedId 变
     → 对应的 ItemCell 收到 equipped=true → 描边变绿
使用 → items 里的 count 变 → ItemCell 的数量文本变
     → canUse 重算 → ActionBar 的使用按钮变淡或恢复
提示 → hint 变 → 面板底部 text 的 text 属性变
```

不要直接改子组件内部状态来「假装」更新：`ItemCell` 没有内部状态，`ActionBar` 也没有；它们收到的 props 变了，画面自然变。反过来，如果在格子里存一份「已装备」并在点击时自己改，父组件切换装备后那份副本不会跟着变，就会出现两个格子同时显示已装备。

`watch` 的来源是 `selectedItem.value?.count`：切换选中时 `selectedItem` 换了对象，count 也可能变化，提示会跟着刷新。这是预期行为，不需要额外判断「是不是同一个道具」。如果只想在同一个道具数量变化时提示，把来源改成 `selectedId` 加 `count` 的组合，再在回调里判断 id 是否相同。

## 关闭的完整路径

关闭有三个入口，最终都走同一条路径：

```text
标题栏关闭按钮 → 面板 close() ─┐
ActionBar 的「关闭」→ emit('close') → 面板 onClose ─┤
Esc / X（@common/exit）→ 面板 close() ─────────────┘
                                    ↓
                    props.controller.close(props.instance)
                                    ↓
                          控制器卸载实例，子树销毁
```

面板里的关闭方法就是骨架篇写的那个：

```tsx
const close = () => {
    props.controller.close(props.instance);
};
```

操作条只发出 `close` 事件，面板在组装处把它接到 `close`：

```tsx
<ActionBar
    canEquip={canEquip.value}
    canUse={canUse.value}
    equipped={isEquipped.value}
    onEquip={equip}
    onUse={use}
    onClose={close}
/>
```

**不要**把 `onClose` 写成只改一行提示。那样按钮看起来在，面板却不会退出，读者会以为关闭功能坏了。子组件也不直接调用 `controller.close`：它拿不到「自己是哪个实例」，硬写会把关闭逻辑复制到每个子组件。

如果以后要做「关闭前确认」，确认框走 UI 栈：面板先打开一个确认 UI，确认后再调用 `close`。不要在面板里手写一个遮罩 + 两个按钮的临时弹窗，那会绕开栈的顺序、背景与按键作用域。

## 已装备的格子：三处一起改

给格子加装备态时，接口、`props` 数组、渲染三处必须同时改。只加接口字段，`props.equipped` 会永远是 `undefined`：

```tsx
interface ItemCellProps extends DefaultProps {
    item: Item;
    selected?: boolean;
    equipped?: boolean;
    size?: number;
}

const itemCellProps = {
    // equipped 必须出现在 props 数组里，否则父级传了也收不到
    props: ['item', 'selected', 'equipped', 'size'],
    emits: ['select']
} satisfies SetupComponentOptions<
    ItemCellProps,
    ItemCellEmits,
    keyof ItemCellEmits
>;

// 描边优先级：已装备 > 选中 > 普通
<g-rectr
    loc={[1, 1, size - 2, size - 2]}
    circle={[9]}
    stroke
    strokeStyle={
        props.equipped ? '#7ee787' : props.selected ? '#f2b84b' : '#33465f'
    }
/>;
```

`ItemGrid` 也要同步加一个 `equippedId`，并把它换算成每个格子的布尔值：

```tsx
interface ItemGridProps extends DefaultProps {
    items: Item[];
    selectedId: string | null;
    equippedId: string | null;
    columns?: number;
    cellSize?: number;
    gap?: number;
}

const itemGridProps = {
    props: ['items', 'selectedId', 'equippedId', 'columns', 'cellSize', 'gap'],
    emits: ['select']
} satisfies SetupComponentOptions<
    ItemGridProps,
    ItemGridEmits,
    keyof ItemGridEmits
>;

<ItemCell
    item={item}
    selected={item.id === props.selectedId}
    equipped={item.id === props.equippedId}
    size={cellSize.value}
    onSelect={id => emit('select', id)}
/>;
```

`equippedId` 是单个 id，不是每格一份布尔值；网格按 id 比较后把结果传给格子。这样装备切换时只有相关格子重渲染，也不需要维护第二份状态。

## 键盘收口

按键只在组件的 `setup` 里接一次，组件卸载时作用域自动离开：

```tsx
// 按键只在 setup 里接一次，组件卸载时作用域自动离开
import { useKey } from '@user/client-base';

const key = useKey(props.state.hotkey.system)!;

key.implement('@common/exit', () => {
    props.controller.close(props.instance);
});
```

`useKey` 必须在 `setup` 中调用，不能放进事件回调。`@common/exit` 默认对应 Esc / X，玩家可以在设置界面改键。按键与按钮走同一条关闭路径：都是面板调用 `props.controller.close(props.instance)`，不存在「按 Esc 只关一半」的分叉。

文档站没有游戏的按键系统，下面的 live 用关闭按钮代替，按键写法以代码块为准。

## 遮罩与 noevent

面板背后常常要压一层遮罩，让下面的画面变暗，但又不挡住点击。给遮罩加 `noevent`：

```tsx
{
    /* 可见但不接收交互，事件会下穿到后面的元素 */
}
<g-rect loc={[0, 0, 720, 480]} fill fillStyle="#000000" alpha={0.35} noevent />;
```

遮罩放在根容器的第一个子节点、面板主体之前：它在树上先绘制，所以面板会盖在它上面；`zIndex` 不需要额外设置。`noevent` 与 `hidden` 是两件事：`hidden` 连绘制一起跳过，元素不显示也不交互；`noevent` 仍然绘制，只是不参与命中。要压暗画面又不想拦截点击时用 `noevent`。

## 组装

把操作条放到底部，状态与回调从根组件传入：

```tsx
// 状态与回调都从根组件传入，子组件不持有业务状态
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
<text loc={[54, 432]} text={hint.value} fillStyle="#8fb6ff" />;
```

操作条与提示都在左侧区域下边界 `380` 之下：操作条 `392` 到 `424`，提示在 `432`，不压住网格，也不超出面板底边 `450`。

## 运行效果

下面的 live 可以装备、使用与关闭：点格子选中道具，再点底部按钮。使用后数量会减一，数量为 0 时按钮变淡且点击不再生效。

<ClientOnly>
  <RenderDemo :loader="stateLoader" :width="720" :height="480" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../../.vitepress/components/renderDemo.vue';

const stateLoader = () =>
    import('../../../.vitepress/components/demos/ui/inventory-5-state.tsx');
</script>

## 边界与注意

- 不要在 `watch` 里改同一个状态造成循环。回调只更新提示这类外部结果。
- 按钮禁用只是视觉弱化加早返回。不要用 `hidden` 把按钮藏起来当禁用。
- `useKey` 只在 `setup` 里调用。组件卸载后作用域会自动离开，不需要手动清理。
- 遮罩层注意 `zIndex`。遮罩要盖在画面之上、面板之下，并且用 `noevent` 放行点击。
- 装备状态只保存 id，不要在每个格子里各存一份；接口、`props` 数组、渲染三处要一起改。
- 操作条的 `equipped` 是「当前选中是否已装备」，不是「面板里有没有装备」。
