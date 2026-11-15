# 示例（二）道具网格

上一篇的左侧只有一块占位。本篇把道具数据、`ItemCell` 与 `ItemGrid` 填进去，让网格能显示、能选中。

## 从占位到网格

本步只替换左侧占位区，右侧详情与底部操作条仍然是占位：

```text
container [54, 100, 400, 280]     左侧区域
├─ g-rect                          区背景
└─ ItemGrid                        本步新增的组件
   ├─ ItemCell                    第 1 个道具
   ├─ ItemCell                    第 2 个道具
   └─ ...                         按行列排开
```

网格挂在左侧区域里，坐标相对左侧容器，不再相对根容器。这样后面换滚动容器、调整左侧区域大小时，网格跟着区域走，不用改每个格子的绝对坐标。

## 数据模型：Item 只定义一次

背包里的道具用一个最小模型表示。这个 `Item` 只在示例（二）定义一次，示例（三）到（六）都直接引用它，不各自重写：

```tsx
// 道具模型：id 用于选中与装备状态，其余字段用于显示
interface Item {
    id: string;
    name: string;
    count: number;
    desc: string;
}
```

`id` 用来判断选中与装备状态，必须是稳定且唯一的值。不要用数组下标代替：下标会随着删除、排序变化，同一个道具换到另一个位置后就变成了另一个身份。

示例把这个 `interface Item` 与 `ItemGrid` 放在 `item-grid.tsx` 里并 `export`；使用它的文件写 `import type { Item } from './item-grid'`。类型导入编译后会被擦除，不会引入运行时循环依赖。

假数据只在写作示范里用，读者可以替换成自己的存档数据：

```tsx
const items = ref<Item[]>([
    { id: 'potion-red', name: '红药水', count: 3, desc: '恢复少量生命。' },
    { id: 'potion-blue', name: '蓝药水', count: 1, desc: '恢复少量魔力。' },
    { id: 'key-yellow', name: '黄钥匙', count: 5, desc: '打开黄色的门。' },
    { id: 'key-blue', name: '蓝钥匙', count: 2, desc: '打开蓝色的门。' },
    { id: 'sword-wood', name: '木剑', count: 1, desc: '最基础的武器。' },
    { id: 'shield-wood', name: '木盾', count: 1, desc: '最基础的防具。' },
    { id: 'gem-red', name: '红宝石', count: 4, desc: '镶嵌用的素材。' },
    { id: 'gem-blue', name: '蓝宝石', count: 2, desc: '镶嵌用的素材。' },
    { id: 'scroll', name: '回城卷轴', count: 1, desc: '回到起点。' },
    { id: 'bread', name: '面包', count: 6, desc: '恢复少量生命。' }
]);
```

`items` 是 `ref<Item[]>`，由 `InventoryPanel` 持有。用 `ref` 而不是普通数组，是因为后面使用道具会改数量、面板关闭后可能重新打开，数组需要在多次渲染之间保持同一份响应式数据。子组件不在自己的闭包里引用 `items`，只通过 props 拿到解包后的数组。

## 网格的树结构

网格是两层：`ItemGrid` 是容器，负责算位置；`ItemCell` 是叶子，负责画一个格子。一个格子在外层包一个定位容器，把「第几行第几列」换算成坐标，`ItemCell` 自己的根元素仍然固定在 `[0, 0]`，内部只按尺寸画。

5 列示例的坐标来源：

- 列宽 `cellSize = 66`，间距 `gap = 8`，所以列与列之间隔 74。
- 第 `index` 个道具的列是 `index % 5`，行是 `Math.floor(index / 5)`。
- 横坐标 `x = col * (66 + 8)`，纵坐标 `y = row * (66 + 8)`。
- 5 列总宽 `5 * 66 + 4 * 8 = 362`，放在 400 宽的左侧区域里还剩 38 像素。

格子是并列的兄弟节点，绘制与命中按同一父级下的顺序进行；每格的位置互不重叠，所以点击落在哪个矩形里就由哪个格子接收。

## ItemCell：一个格子

格子只需知道「显示哪个道具」「是否选中」「多大」，点击时把 id 交回父组件。写法沿用[自定义组件的 props](./custom-components.md#props)：

```tsx
import { defineComponent } from 'vue';
import { SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';

interface ItemCellProps extends DefaultProps {
    item: Item;
    selected?: boolean;
    size?: number;
}

interface ItemCellEmits {
    select: (id: string) => void;
}

const itemCellProps = {
    props: ['item', 'selected', 'size'],
    emits: ['select']
} satisfies SetupComponentOptions<
    ItemCellProps,
    ItemCellEmits,
    keyof ItemCellEmits
>;

const ItemCell = defineComponent<
    ItemCellProps,
    ItemCellEmits,
    keyof ItemCellEmits
>((props, { emit }) => {
    // 格子不保存状态，只根据 item 与 selected 渲染
    // 尺寸在面板生命周期内不变，读一次即可；若尺寸会随窗口变化，再改成 computed
    const size = props.size ?? 66;

    return () => (
        <container
            loc={[0, 0, size, size]}
            onClick={() => emit('select', props.item.id)}
        >
            <g-rectr
                loc={[0, 0, size, size]}
                circle={[10]}
                fill
                fillStyle={props.selected ? '#2f6fed' : '#26364d'}
            />
            {/* 选中时加一圈描边；未选中时用暗色边框保持尺寸一致 */}
            <g-rectr
                loc={[1, 1, size - 2, size - 2]}
                circle={[9]}
                stroke
                strokeStyle={props.selected ? '#f2b84b' : '#33465f'}
            />
            {/* 名称在左上角，数量固定在左下角 */}
            <text loc={[8, 10]} text={props.item.name} fillStyle="#ffffff" />
            <text
                loc={[8, size - 24]}
                text={`× ${props.item.count}`}
                fillStyle="#cfe0ff"
            />
        </container>
    );
}, itemCellProps);

export { ItemCell };
```

在渲染树上，`ItemCell` 的根是一个带尺寸的容器，背景、描边、名称、数量都是它的子元素。它没有内部状态，`selected` 由父级传入：父级改变 `selectedId` 后，每个格子重新计算自己该不该高亮，不会出现「一个格子还亮着」的残留。这也是为什么点击不自己改状态，而是 `emit('select', props.item.id)` 交回父级。

## ItemGrid：按行列排列

`ItemGrid` 不写死每个格子的坐标，而是用列数、格子尺寸与间距算出位置：

```tsx
import { computed, defineComponent } from 'vue';
import { SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';

interface ItemGridProps extends DefaultProps {
    items: Item[];
    selectedId: string | null;
    columns?: number;
    cellSize?: number;
    gap?: number;
}

interface ItemGridEmits {
    select: (id: string) => void;
}

const itemGridProps = {
    props: ['items', 'selectedId', 'columns', 'cellSize', 'gap'],
    emits: ['select']
} satisfies SetupComponentOptions<
    ItemGridProps,
    ItemGridEmits,
    keyof ItemGridEmits
>;

const ItemGrid = defineComponent<
    ItemGridProps,
    ItemGridEmits,
    keyof ItemGridEmits
>((props, { emit }) => {
    // 列数、尺寸、间距都可能来自 props，用 computed 派生，变化时重算
    const columns = computed(() => props.columns ?? 5);
    const cellSize = computed(() => props.cellSize ?? 66);
    const gap = computed(() => props.gap ?? 8);

    return () => (
        // 网格根容器与左侧区域同尺寸，只做分组与定位，不裁切内容
        <container loc={[0, 0, 400, 280]}>
            {props.items.map((item, index) => {
                // 每行放 columns 个，超出后换到下一行
                const col = index % columns.value;
                const row = Math.floor(index / columns.value);
                const x = col * (cellSize.value + gap.value);
                const y = row * (cellSize.value + gap.value);
                return (
                    // 定位容器与格子同尺寸，避免默认尺寸盖住邻居
                    <container
                        key={item.id}
                        loc={[x, y, cellSize.value, cellSize.value]}
                    >
                        <ItemCell
                            item={item}
                            selected={item.id === props.selectedId}
                            size={cellSize.value}
                            onSelect={id => emit('select', id)}
                        />
                    </container>
                );
            })}
        </container>
    );
}, itemGridProps);

export { ItemGrid };
```

这里用 `.map()` 把数组映射成一组元素，没有写循环指令。定位容器与格子同尺寸，不会出现「容器默认 200×200 盖住邻格」的问题；容器本身没有点击监听，点击命中的是格子，再沿父链交给 `ItemGrid`。

`key` 用 `item.id`：格子身份跟道具走，不跟位置走。现在列表顺序固定、看起来用下标也能跑，但示例（五）会减数量、以后可能删除道具，一旦增删，下标会把「第 3 个位置」错当成「同一个道具」。从一开始就按 id 绑定，后面不用返工。

## 数据如何进入网格

数据只有一条路：`InventoryPanel` 持有 `items`，把解包后的数组传给 `ItemGrid`；`ItemGrid` 把它映射成若干 `ItemCell`；`ItemCell` 只接收 `item` 与 `selected`，不直接读父级闭包。

```tsx
import { computed, ref } from 'vue';

// 面板持有 items，子组件只接收解包后的数组
const items = ref<Item[]>([
    /* 上面的假数据 */
]);
// 未选中用 null，不用 undefined 或空字符串
const selectedId = ref<string | null>(null);

// 选中项由 items 与 selectedId 派生，详情与按钮共用同一份数据
const selectedItem = computed(
    () => items.value.find(item => item.id === selectedId.value) ?? null
);

<container loc={[54, 100, 400, 280]}>
    <g-rect loc={[0, 0, 400, 280]} fill fillStyle="#101820" />
    {/* 网格只上报点击，选中值仍由父组件保存 */}
    <ItemGrid
        items={items.value}
        selectedId={selectedId.value}
        columns={5}
        cellSize={66}
        gap={8}
        onSelect={id => (selectedId.value = id)}
    />
</container>;
```

`items` 作为 prop 传的是 `items.value`，也就是数组本身；`ItemGrid` 内部收到的是普通数组，不需要再解包。派生数据 `selectedItem` 也放在面板：详情与操作按钮都要用它，放在父级只有一份，不会出现网格与详情各算一遍、结果不一致。

## 点击如何上报

一次点击经过三层，每层只做自己的事：

```text
点击 ItemCell
  → ItemCell 的 onClick 发出 emit('select', item.id)
  → ItemGrid 的 onSelect 收到 id，再 emit('select', id)
  → InventoryPanel 的 onSelect 把 selectedId 写成这个 id
  → 重新渲染：选中格子高亮，selectedItem 重算
```

- `ItemCell` 知道「自己被点了」，但不知道该选谁，所以只上报自己的 `item.id`。
- `ItemGrid` 知道「网格里有一个 id 被选中」，但它不持有选中状态，继续上报。
- `InventoryPanel` 是唯一持有 `selectedId` 的地方，写值后由响应式系统把新状态推回子树。

这条链也是后面示例（四）滚动、示例（五）操作条继续沿用的路径：子组件上报，面板决定。

## 这一步的边界

本步的网格是普通容器平铺，不滚动。道具多到超出一屏时，超出的格子仍然会被渲染，只是画在区域外；`Scroll` 要等到示例（四）才引入，它会把「平铺 + 只渲染视口附近」接在这棵子树上。

所以不要把本步的普通网格当成最终方案。示例（四）会明确替换关系：左侧换成 `Scroll`，`ItemGrid` 的 props 与事件链不变，只把根容器换成滚动容器；示例（五）（六）不会再回到普通网格或 `ListPage`。

## 运行效果

下面的 live 在骨架上加了网格与选中态。点击任意格子，右侧占位区会显示当前选中的道具。

<ClientOnly>
  <RenderDemo :loader="gridLoader" :width="720" :height="480" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../../.vitepress/components/renderDemo.vue';

const gridLoader = () =>
    import('../../../.vitepress/components/demos/ui/inventory-2-grid.tsx');
</script>

## 边界与注意

- 列宽与间距用常量算，不要手写每格坐标。格子数量变化时只改 `columns` 或 `cellSize`。
- 选中态只由 `selectedId` 决定，不要在格子里各存一份。否则父组件切换选中时会出现不同步。
- `.map()` 返回的每一项结构必须一致。定位容器与格子同尺寸，不要用默认尺寸的容器去套小格子。
- `id` 用稳定且唯一的值，`key` 也用 `item.id`；不要用数组下标代替。
- 网格区域尺寸变化时重新算列数，不要让最后一列溢出到详情区；本篇 5 列总宽 362，左侧区域宽 400。
