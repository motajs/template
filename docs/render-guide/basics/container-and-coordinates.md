# 容器与坐标

上一篇[《第一个静态界面》](./first-static-ui.md)已经用容器、文字和几个简单图形拼出了一块静态界面：`container` 圈出范围，文字和图形按 `loc` 摆进去。这一篇只讲怎么把元素放到想要的位置：坐标从哪里算起、`loc` 与锚点怎么配合、容器嵌套后子元素的坐标怎么变。事件、变换、缓存和层级都留到后面的篇章。

## 前置知识

阅读本篇前，建议先读完：

- [第一个静态界面](./first-static-ui.md)

## 坐标来源

根容器的左上角是原点，向右是正 `x`，向下是正 `y`。子元素的坐标相对父容器的左上角，不是相对整块画布；容器嵌套时，每一层都把坐标系重新平移一次。

```tsx
<container loc={FULL_LOC}>
    <text loc={[24, 24]} text="左上角是原点" fillStyle="#e8f0ff" />
    <g-rect loc={[24, 64, 120, 60]} fillStyle="#2f6fed" />
</container>
```

这段代码里，文字和矩形的 `x` / `y` 都从根容器的左上角量起。

## loc 与锚点

`loc` 是一个六元组，顺序固定：`x`、`y`、`width`、`height`、`anchorX`、`anchorY`。

```tsx
// x、y、width、height、anchorX、anchorY
<g-rect loc={[40, 40, 120, 80, 0, 0]} fillStyle="#2f6fed" />
```

六个值也可以拆成同名属性分别写：

```tsx
<g-rect
    x={40}
    y={40}
    width={120}
    height={80}
    anchorX={0}
    anchorY={0}
    fillStyle="#2f6fed"
/>
```

`anchorX` 与 `anchorY` 还可以合并成 `anc`：

```tsx
<container loc={[240, 160, 160, 120]} anc={[0.5, 0.5]} />
```

`loc` 里每一对（`x` / `y`、`width` / `height`、`anchorX` / `anchorY`）要么都写，要么整对省略。只写 `[x, y]` 是合法的；宽高省略时沿用默认的 200×200。

锚点回答的是「元素自己的哪一个点落在 `x` / `y` 上」。矩形与容器的默认锚点是 `0`，也就是左上角；圆与椭圆的默认锚点是 `0.5`，也就是中心。锚点不是把元素整体平移，而是换一个点去对齐坐标：同一个 `x` / `y` 配不同锚点，元素落下的位置会明显不同。

矩形代表容器，圆点标出 `(x, y)` 所在的位置。下面四个例子用的是同一个局部坐标 `(110, 70)`，只是锚点和尺寸不同：

<ClientOnly>
  <RenderDemo :loader="anchorLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

四个例子的坐标点相同：锚点为 `0, 0` 时矩形从圆点向右下展开，锚点为 `0.5, 0.5` 时圆点是矩形中心，锚点为 `1, 1` 时矩形从圆点向左上展开。最后一个仍是中心锚点，只是宽高更大，所以向四周展开得更多。

## 嵌套：局部坐标系

把一组元素放进子容器后，子元素的坐标就相对这个子容器，而不是相对根容器。移动父容器时，里面的子容器和元素跟着移动，子元素自己的 `x` / `y` 不需要改。

```tsx
<container loc={FULL_LOC}>
    {/* 父容器：在根容器里的 (80, 60)，尺寸 240×160 */}
    <container loc={[80, 60, 240, 160]}>
        {/* 子容器：在父容器里的 (20, 20)，尺寸 160×100 */}
        <container loc={[20, 20, 160, 100]}>
            {/* 圆点在子容器的 (0, 0)，也就是子容器的左上角 */}
            <g-circle circle={[0, 0, 6]} fillStyle="#58c4dd" />
        </container>
    </container>
</container>
```

子容器不需要知道自己在屏幕上的绝对位置，只需要知道自己在父容器里的位置。下面的 live 用两种颜色区分父容器和子容器，两个圆点分别是它们的左上角：

<ClientOnly>
  <RenderDemo :loader="containerLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

子容器的 `(0, 0)` 是它在父容器内的位置，不是画布原点；父容器移动时，子容器和里面的元素一起移动。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const anchorLoader = () =>
    import('../../.vitepress/components/demos/ui/anchor-demo.tsx');
const containerLoader = () =>
    import('../../.vitepress/components/demos/ui/container-demo.tsx');
</script>

## 边界与注意

- 不写宽高时，元素的默认尺寸是 200×200。
- 锚点改变的是「元素自己的哪一个点」落在 `x` / `y` 上，不是把元素整体平移。
- 子元素的坐标相对父容器，不是相对画布；移动父容器时，子元素跟着移动。
- 容器外的内容默认不可见；需要显示的内容要放在容器矩形内。
- `nocache` 可能让超出容器的内容显示，但这是渲染实现的特性，后续可能变动，不要依赖。

下一篇[《基础图形》](./basic-shapes.md)开始讲矩形、圆、线这些元素本身：它们的几何参数、填充与描边怎么用。
