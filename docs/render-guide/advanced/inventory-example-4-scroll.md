# 示例（四）滚动与列表

道具少的时候，网格一次就能排下。道具变多后，左侧区域放不下，需要滚动。本篇把示例（二）的普通网格换成 `Scroll`，并说明这次替换在渲染树、事件与数据流上各自改了什么。

## 前置知识

阅读本篇前，建议先读完：

- [示例（三）详情区](./inventory-example-3-detail.md)
- [内置组件：布局](./builtin-layout.md)

## 为什么要换滚动

普通容器只是按坐标把子元素画出来：区域外的格子照样绘制，超出的部分被窗口裁掉，但节点仍然在树上。道具只有十件时感觉不到问题；四十件时，左侧区域外的格子会越画越多，滚轮也没有任何反应。

`Scroll` 负责的是「视口」这一层：

- 它给内容一个固定大小的窗口，窗口外的行被隐藏（逻辑裁剪），不会继续绘制。
- 它自己处理滚轮、拖动与右侧滚动条，不需要作者再写 `onWheel`。
- 它按子元素的包围盒计算可滚动总长度，末尾用 `padEnd` 补一段空白。

代价是限制：`Scroll` 只检查它的**直接子元素**，所以内容不能先包一个大容器再放进去。一个把全部格子包住的 `ItemGrid` 根容器会让虚拟滚动退化成「一整块内容」，只能整体显示或整体隐藏。

组件本身不是节点（第 13 篇）：`ItemGrid` 返回的是行数组，这些行会平铺成父级 `Scroll` 的直接子元素，而不是躲在组件内部；所以行容器能被 `Scroll` 直接读到，虚拟滚动成立。

**本步明确替换示例（二）的普通网格**：左侧最终方案是 `Scroll`，示例（五）（六）不会再回到普通网格或 `ListPage`。

## Scroll 在渲染树里的位置

替换后，左侧区域的树是这样：

```text
container [54, 100, 400, 280]        左侧区域（坐标与最终布局一致）
├─ g-rect                             区背景
├─ Scroll [0, 0, 372, 244]            视口：宽 372、高 244
│  ├─ 行容器 [0, 0, 362, 66]          第 1 行，Scroll 的直接子元素
│  │  ├─ ItemCell                     第 1 个格子
│  │  └─ ...                          同一行其余 4 个
│  ├─ 行容器 [0, 74, 362, 66]         第 2 行
│  └─ ...                             按 74 的行距继续
├─ 按钮 [0, 252, 90, 28]              「回到顶部」
└─ 按钮 [100, 252, 90, 28]            「滚到底部」
```

`Scroll` 的根是左侧区域里的一个子容器，`loc` 的第三、四项就是视口大小。视口宽 372，左侧区域宽 400，右边留出的 28 像素是滚动条与内边距的位置；高度 244，下面从 252 开始放两个按钮，`244 < 252`，按钮不会被内容盖住。

滚动条是 `Scroll` 内部的一个 `custom` 节点，固定画在视口右侧、层级高于内容。作者不需要手动创建它，只需要把可点击的元素避开右侧滚动条区域。

未滚动时，`Scroll` 的内容容器从 `[0, 0]` 开始；滚动后，内容整体向上平移，但每个行容器在树上的 `loc` 不变。这就是为什么行坐标可以按「从内容顶部往下累计」来算：`0, 74, 148, ...`，而不用关心当前滚到了哪里。

`Scroll` 通过 `ref` 暴露两个方法：`scrollTo(y, time?)` 滚到指定位置，`getScrollLength()` 返回还能滚多长。`ref<ScrollExpose>()` 拿到的就是这个接口，只有在需要「回到顶部 / 滚到底部 / 滚到某一行」时才用它。

## 数据与选中态如何穿过滚动层

`Scroll` 只负责视口，不持有道具数据，也不持有选中状态：

- `items` 仍然是 `InventoryPanel` 里的 `ref<Item[]>`，由面板传给 `ItemGrid`。
- `selectedId` 仍然是面板的 `ref<string | null>`，由 `ItemGrid` 继续按 id 比较。
- `ItemGrid` 的 props 链不变：`items` / `selectedId` / `onSelect`（示例（五）再加 `equippedId`）。

唯一要改的是 `ItemGrid` 的根节点：示例（二）里它返回一个 `container`，现在改成返回「行容器数组」，让每一行直接成为 `Scroll` 的直接子元素。组件本身仍然是一个组件，只是它的子树从「一个容器」变成了「一组并列容器」：

```tsx
// item-grid.tsx：根节点从单个 container 改成行容器数组
const ItemGrid = defineComponent<
    ItemGridProps,
    ItemGridEmits,
    keyof ItemGridEmits
>((props, { emit }) => {
    const columns = computed(() => props.columns ?? 5);
    const cellSize = computed(() => props.cellSize ?? 66);
    const gap = computed(() => props.gap ?? 8);

    return () => {
        const pitch = cellSize.value + gap.value;
        const rowCount = Math.ceil(props.items.length / columns.value);
        const rows = [];

        for (let row = 0; row < rowCount; row++) {
            const start = row * columns.value;
            const cells = props.items.slice(start, start + columns.value);

            rows.push(
                // 一行是 Scroll 的一个直接子元素，行距由 loc 的 y 决定
                <container
                    key={row}
                    loc={[0, row * pitch, 362, cellSize.value]}
                >
                    {cells.map((item, col) => (
                        <container
                            key={item.id}
                            loc={[
                                col * pitch,
                                0,
                                cellSize.value,
                                cellSize.value
                            ]}
                        >
                            <ItemCell
                                item={item}
                                selected={item.id === props.selectedId}
                                size={cellSize.value}
                                onSelect={id => emit('select', id)}
                            />
                        </container>
                    ))}
                </container>
            );
        }

        return rows;
    };
}, itemGridProps);
```

行容器的 `key` 用行号，是因为行本身没有业务身份，只表示「第几行」；行内的格子 `key` 仍然用 `item.id`，身份跟道具走。滚动时 `Scroll` 按行容器的包围盒决定整行显示还是隐藏，所以一行的高度必须包住这一行的格子，不能只给格子高度却让行容器用默认 200×200。

## 面板里怎么接

面板把 `ItemGrid` 放进 `Scroll`，其余状态不变：

```tsx
import { ref } from 'vue';
import { Scroll, ScrollExpose } from '@user/client-base';

// 面板里：滚动容器只包住网格，选中态仍由面板持有
const scroll = ref<ScrollExpose>();

// 回到顶部：scrollTo(目标位置, 动画时长)
const backToTop = () => {
    scroll.value?.scrollTo(0, 200);
};

// 滚到底部：先取总长度，再滚过去
const toBottom = () => {
    scroll.value?.scrollTo(scroll.value.getScrollLength(), 200);
};

<container loc={[54, 100, 400, 280]}>
    <g-rect loc={[0, 0, 400, 280]} fill fillStyle="#101820" />

    <Scroll ref={scroll} loc={[0, 0, 372, 244]} padEnd={16}>
        <ItemGrid
            items={items.value}
            selectedId={selectedId.value}
            columns={5}
            cellSize={66}
            gap={8}
            onSelect={id => (selectedId.value = id)}
        />
    </Scroll>

    <container loc={[0, 252, 90, 28]} onClick={backToTop}>
        <g-rectr loc={[0, 0, 90, 28]} circle={[6]} fill fillStyle="#2f6fed" />
        <text loc={[10, 6]} text="回到顶部" fillStyle="#ffffff" />
    </container>
    <container loc={[100, 252, 90, 28]} onClick={toBottom}>
        <g-rectr loc={[0, 0, 90, 28]} circle={[6]} fill fillStyle="#33465f" />
        <text loc={[10, 6]} text="滚到底部" fillStyle="#e8f0ff" />
    </container>
</container>;
```

`padEnd` 给内容末尾多留 16 像素，避免最后一行贴着视口底边时滚动条位置看起来不对。`getScrollLength()` 返回的是「内容总长减视口高度」，也就是最大可滚动距离；直接把它交给 `scrollTo` 就滚到底。

单位补在这里：`scrollTo(y, time)` 的 `time` 是毫秒，默认 `0` 表示立即跳转；`padEnd` 是像素，追加在内容总长度之后。

滚动位置保存在 `Scroll` 组件自己的状态里。面板被真正卸载（关闭）后，组件销毁，下次打开回到顶部；如果只是用 `hide` 暂时隐藏实例，位置会保留。两种行为都是合理的，取决于你要「每次都从头看」还是「回到上次的位置」。

## 滚动与事件

滚轮不需要作者处理：`Scroll` 在根容器上监听 `onWheel`，把滚动量换算成目标位置，再带动画滚过去。子元素上的点击仍然按渲染树命中：先落到格子，再沿父链交给 `ItemGrid` 与面板。

滚动容器在捕获阶段会给事件坐标补上当前滚动偏移，所以格子拿到的是自己在内容里的局部坐标，不会因为「已经滚了 300 像素」而算错点击位置。这一点对拖动与点击都成立。

拖动内容与点击格子共用同一套按下 / 移动 / 抬起事件。`Scroll` 在按下时记录内容位置，移动超过阈值才视为拖动；没有移动的按下与抬起仍然是一次点击，会正常上报选中。作者的注意事项只有两条：

- 不要在内容上再套一层自己的滚动手势，两套手势会互相抢事件。
- 可点击元素避开通往滚动条的右侧区域，滚动条本身会先接住那里的按下事件。

`noevent` 与 `actionStroke` 在这里都不是必需的：`Scroll` 已经处理了手势，格子按自身矩形命中即可。

## 为什么不用 ListPage 作为最终方案

`ListPage` 适合「左边一列文本、右边详情」的内置页面，它把左侧列表、选中 key 与关闭按钮都封装好了。但本系列的左侧是 5 列带选中态的网格，`ListPage` 的单列文本列表装不下这个结构；用它就得放弃网格，或者把网格塞进它的一行里，反而更绕。

所以最终方案只保留 `Scroll`。`ListPage` 与本篇的关系是「知道它存在、知道它不适用」，不是让读者在两个方案之间二选一。示例（五）（六）都沿本篇的 `Scroll` 继续。

## 运行效果

下面的 live 用 40 个假道具演示滚动效果：滚轮、右侧滚动条与「回到顶部 / 滚到底部」按钮都能用。live 用元素层等价画面实现滚动，正文代码块给出 `Scroll` 的真实写法；两者不是同一段代码。

<ClientOnly>
  <RenderDemo :loader="scrollLoader" :width="720" :height="480" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const scrollLoader = () =>
    import('../../.vitepress/components/demos/ui/inventory-4-scroll.tsx');
</script>

## 边界与注意

- `Scroll` 里再包一层容器会让虚拟滚动失效。每一行都必须是 `Scroll` 的直接子元素。
- 行容器的高度要包住整行格子；用默认 200×200 会让相邻行互相遮挡。
- `padEnd` 按行高调整。最后一行底部过紧或滚动条偏长时，先检查它。
- 滚动条占右侧一段宽度，可点击元素不要压到 `x = 372` 附近。
- 一维长列表用 `Scroll`；左右分栏的文本列表才考虑 `ListPage`，固定页数才用 `Page`。不要用几十个隐藏容器模拟分页。
