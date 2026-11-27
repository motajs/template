# 示例（三）详情区

上一篇左侧已经能选道具，右侧还是占位。本篇把 `ItemDetail` 填上：名称、数量、描述，以及没有选中时的提示。

## 前置知识

阅读本篇前，建议先读完：

- [示例（二）道具网格](./inventory-example-2-grid.md)
- [文字](../basics/text.md)
- [通用参数](../basics/common-props.md)

## 详情区接的是哪个状态

详情不自己保存状态，它只接收一个「选中项」。选中项在 `InventoryPanel` 里用 `computed` 从 `items` 与 `selectedId` 算出来：

```tsx
import { computed, ref } from 'vue';

// 面板持有选中 id；未选中用 null，不用 undefined 或空字符串
const selectedId = ref<string | null>(null);

// 选中项由 items 与 selectedId 派生；找不到时统一变成 null
const selectedItem = computed(
    () => items.value.find(item => item.id === selectedId.value) ?? null
);
```

`selectedId` 的类型是 `ref<string | null>`，初始值 `null`，表示「什么都没选」。用 `null` 而不是 `undefined` 或空字符串，是因为三种「没有值」的写法会在不同地方产生不同行为：`undefined` 容易被当成「还没传」而被默认值替换，空字符串会被当成一个合法 id 去查列表。`null` 在类型上明确表示「有值，但值是空」。

`find` 找不到时返回 `undefined`，这里用 `?? null` 收口，让 `selectedItem` 的类型固定为 `Item | null`。这样详情组件只需要判断「有没有 item」，不用区分 `undefined` 与 `null` 两种空值。

## 详情区的树结构

详情区在面板右侧，最终布局是 `[470, 100, 196, 280]`。`ItemDetail` 的根容器与区域同尺寸，内部再分四块：

```text
container [0, 0, 196, 280]        详情组件根
├─ g-rect                          区背景
├─ text [16, 16]                   小标题「详情」
├─ container hidden={有选中}        未选中提示
│  └─ text [16, 52]                「请选择道具」
├─ container hidden={没选中}        详情内容
│  ├─ text [16, 52]                名称
│  ├─ text [16, 84]                数量
│  └─ TextContent [16, 120]        描述，按宽度折行
└─ container [16, 236, 164, 28]    取消选择按钮
```

名称、数量、描述都是详情容器的子节点，位置相对详情根容器。描述没有用 `text` 元素硬排：`text` 只画一行，不会自动换行；`TextContent` 按 `width` 折行，`autoHeight` 让高度跟着内容走。`width` 可以省略，省略时使用组件默认宽度。描述从 `y = 120` 开始，到取消选择按钮上方 `236` 为止，大约能放四到五行；更长的说明要么缩短文案，要么在详情内部再套一个 `Scroll`，不要让它盖住按钮。

`hidden` 的两块是兄弟节点，同一时刻只有一块参与绘制与命中：未选中时提示可见，选中时详情内容可见。`hidden` 不显示、不交互，但元素与状态仍在，不会因为频繁切换选中而反复创建、销毁子树。

## ItemDetail：右侧面板

```tsx
import { defineComponent } from 'vue';
import { SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';
import { TextContent } from '@user/client-base';

interface ItemDetailProps extends DefaultProps {
    // 没有选中时是 null，组件必须允许空值
    item: Item | null;
}

interface ItemDetailEmits {
    clear: () => void;
}

const itemDetailProps = {
    props: ['item'],
    emits: ['clear']
} satisfies SetupComponentOptions<
    ItemDetailProps,
    ItemDetailEmits,
    keyof ItemDetailEmits
>;

const ItemDetail = defineComponent<
    ItemDetailProps,
    ItemDetailEmits,
    keyof ItemDetailEmits
>((props, { emit }) => {
    return () => (
        <container loc={[0, 0, 196, 280]}>
            <g-rect loc={[0, 0, 196, 280]} fill fillStyle="#101820" />
            <text loc={[16, 16]} text="详情" fillStyle="#8fb6ff" />

            {/* 没有选中：显示提示 */}
            <container hidden={props.item !== null}>
                <text loc={[16, 52]} text="请选择道具" fillStyle="#4f6d94" />
            </container>

            {/* 有选中：显示名称、数量与描述。两块都渲染，用 hidden 切换 */}
            <container hidden={props.item === null}>
                <text
                    loc={[16, 52]}
                    text={props.item?.name ?? ''}
                    fillStyle="#e8f0ff"
                />
                <text
                    loc={[16, 84]}
                    text={`数量：${props.item?.count ?? 0}`}
                    fillStyle="#cfe0ff"
                />
                {/* 长描述用 TextContent；width 决定折行宽度，autoHeight 让高度跟着内容走 */}
                <TextContent
                    loc={[16, 120]}
                    width={164}
                    text={props.item?.desc ?? ''}
                    autoHeight
                    fill
                    fillStyle="#8fb6ff"
                />
            </container>

            {/* 回到未选中：详情只上报，不自己改父级状态 */}
            <container loc={[16, 236, 164, 28]} onClick={() => emit('clear')}>
                <g-rectr
                    loc={[0, 0, 164, 28]}
                    circle={[6]}
                    fill
                    fillStyle="#33465f"
                />
                <text loc={[12, 6]} text="取消选择" fillStyle="#e8f0ff" />
            </container>
        </container>
    );
}, itemDetailProps);

export { ItemDetail };
```

在渲染树上，`ItemDetail` 的根是右侧区域的整块容器，背景是第一个子节点，保证后面所有文字都画在背景之上；取消选择按钮是最后一个子节点，因此盖在其他内容之上，不会被描述文字挡住。按钮只发出 `clear` 事件，不碰 `selectedId`——选中状态归面板，详情没有写权限。

这里用 `hidden` 而不是三元，是因为选中切换很频繁，两块内容都很轻，保留元素后不需要反复创建与销毁。等读者真的需要「每次切换都重置」时，再换成三元。

## 选中态如何流到详情

面板把派生的 `selectedItem` 直接传给详情，详情不再查一遍列表：

```tsx
// 面板的右侧区域：坐标与最终布局一致
<container loc={[470, 100, 196, 280]}>
    <ItemDetail
        item={selectedItem.value}
        onClear={() => (selectedId.value = null)}
    />
</container>
```

这条链与上一篇的点击上报是同一个方向的两端：

```text
点击 ItemCell → ItemGrid → 面板写 selectedId
  → selectedItem 重算 → ItemDetail 收到新的 item
点击「取消选择」→ ItemDetail 发 clear → 面板把 selectedId 写回 null
  → selectedItem 变成 null → 详情显示「请选择道具」
```

详情不要在组件内部再 `items.find(...)`：那会让列表出现两份查询逻辑，一份用 `selectedId`，一份用内部状态，两边一旦不同步，就会出现「左侧高亮 A、右侧显示 B」。派生只做一次，放在持有源状态的面板里。

## 空态与边界

三种情况都要给出显示与恢复方式：

| 情况         | 详情显示                               | 如何恢复                       |
| ------------ | -------------------------------------- | ------------------------------ |
| 未选中       | 「请选择道具」                         | 点任意格子，或初始状态就是空   |
| 选中项被删除 | `find` 返回 `undefined`，收口成 `null` | 点其他格子；不要留着旧 id 高亮 |
| `items` 为空 | 与未选中相同                           | 先获得道具，再打开面板         |

未选中不是错误状态，而是面板的初始状态。示例（二）里 `selectedId` 的初始值是 `null`，所以第一次打开面板时右侧就显示提示；点击格子后才第一次出现详情。

「选中项被删除」要在面板层处理：删除道具时同时检查 `selectedId.value === 被删的 id`，如果是就把 `selectedId` 写回 `null`。只在详情里判空、不清理面板的 id，会让 `selectedId` 指向一个不存在的道具，之后任何按 id 比较的逻辑都会失效。

## 运行效果

下面的 live 选中不同格子，右侧详情随之更新；点「取消选择」可以看到没有选中时的提示。live 用元素层的 `text` 等价展示多行说明，正文代码块才给出 `TextContent` 的真实写法——两者不是同一段代码。

<ClientOnly>
  <RenderDemo :loader="detailLoader" :width="720" :height="480" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const detailLoader = () =>
    import('../../.vitepress/components/demos/ui/inventory-3-detail.tsx');
</script>

## 边界与注意

- `computed` 里不要写副作用。它只负责算值，需要「变化后做一件事」时用 `watch`。
- `find` 找不到时返回 `undefined`，用 `?? null` 收口；详情组件的 `item` 要允许为 `null`。
- `TextContent` 的 `width` 可选；不传时使用默认宽度。需要指定折行宽度时再显式传入。
- 两块都渲染时注意 `zIndex` 与遮挡。提示层不要盖住真正的详情，也不要在有选中时仍然拦截点击。
- 选中态放在父组件，详情只接收结果。子组件不要自己再存一份 `selectedId`，也不要在详情里重复查列表。
