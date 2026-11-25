# 层级、变换与性能

元素摆好位置之后，还会遇到三类问题：层级怎么沿树生效、怎么缩放旋转与混合、什么时候该缓存。这三件事都写在元素属性上，不需要额外的图层对象。理解它们的前提是渲染树：层级、变换与缓存都沿着父子关系生效，不是全局开关。

<div id="渲染树层级与绘制顺序"></div>

## 前置知识

阅读本篇前，建议先读完：

- [容器与坐标](./container-and-coordinates.md)
- [通用参数](./common-props.md)

## 渲染树、层级与绘制顺序

元素组成一棵渲染树：子元素相对父元素定位，绘制顺序、变换与缓存都沿父子关系生效。同一父级下的兄弟按 `zIndex` 从小到大绘制，命中顺序相反；`zIndex` 只在兄弟之间比较，父级的 `zIndex` 带着整棵子树参与父级兄弟的排序。`zIndex` 与 `hidden` 的完整语义见[通用参数页](./common-props.md#zindex)。

UI 栈也遵循同一套规则。控制器把每个打开的面板当作 UI 容器下的兄弟，按栈顺序分配递增的 `zIndex`；面板之间的遮挡由打开顺序与显示策略决定，面板内部的 `zIndex` 只影响这棵子树内部。先看面板在哪个栈、哪个位置，再看面板内部的兄弟顺序。

## 变换：scale、rotate 与 transform

`scale` 是 `[x, y]` 数组，分别表示横向与纵向缩放比例；`rotate` 的单位是弧度，不是角度。两者都作用在元素自己的坐标系里，锚点就是变换中心：缩放与旋转都绕锚点进行。矩形与容器的默认锚点在左上角，圆与椭圆的默认锚点在中心；用 `anc` 改成 `[0.5, 0.5]` 后，矩形与容器也会绕中心变换，元素的视觉位置与扩展方向都会跟着改变。

`scale` 与 `rotate` 是底层 `transform` 的简写：`transform` 属性可以直接接收一个 `Transform` 对象，用来表达更一般的矩阵与平移。日常写界面用 `scale` / `rotate` 就够了；需要直接替换整个变换矩阵时再传 `transform`，本篇不展开构造方式。

```tsx
// scale 写 [x, y]；rotate 写弧度。两者都是 transform 的简写属性
<g-rect loc={[40, 40, 120, 80]} fillStyle="#2f6fed" scale={[1.2, 0.8]} />
<g-rect loc={[220, 40, 120, 80]} fillStyle="#f2b84b" rotate={Math.PI / 12} />

// 同一个变换换锚点：anc 决定绕哪个点缩放 / 旋转
<g-rect
    loc={[40, 180, 120, 80]}
    fillStyle="#2f6fed"
    scale={[1.2, 0.8]}
    anc={[0.5, 0.5]}
/>
<g-rect
    loc={[220, 180, 120, 80]}
    fillStyle="#f2b84b"
    rotate={Math.PI / 12}
    anc={[0.5, 0.5]}
/>
```

`scale` 必须是 `[x, y]` 数组；只写一个数字会报错，也不会生效。需要等比缩放时写 `scale={[1.2, 1.2]}`，需要压扁时分别给两个值。`rotate` 想转 30 度要写 `Math.PI / 6`；写成 `30` 会转很多圈。

`container` 默认开启缓存。对默认缓存的容器做 `scale` 或 `rotate` 时，引擎会先画出缓存图，再对这张图做变换；缓存图被缩放或旋转后会重新采样，边缘可能发糊。需要清晰变换时，给做变换的容器加 `nocache`，让子元素按变换直接绘制。

下面四组对比同一个 `scale` 或 `rotate` 在 `anc={[0, 0]}` 与 `anc={[0.5, 0.5]}` 下的差异。每组锚点位置的白点就是变换中心：`anc={[0, 0]}` 以左上角为基准，缩放向右下方展开、旋转绕左上角扫过；`anc={[0.5, 0.5]}` 以中心为基准，缩放向四周展开、旋转绕中心转动，两者的视觉位置也不同。

<ClientOnly>
  <RenderDemo :loader="layerTransformLoader" :width="480" :height="320" />
</ClientOnly>

## 变换沿树传递

父级的平移、缩放、旋转会复合到子级。父级移动，子级跟着移动；父级放大，子级的坐标与尺寸都按放大后的比例理解；父级旋转，子级的局部坐标轴也跟着旋转。子元素不需要知道父级做了哪些变换，它只按自己的局部坐标描述内容。

```tsx
// 父容器放大 1.5 倍；加 nocache 让子元素按变换直接绘制，避免缓存图被重采样
<container loc={[80, 40, 140, 100]} scale={[1.5, 1.5]} nocache>
    <g-rect loc={[0, 0, 140, 100]} fill fillStyle="#2f6fed" />
    <text loc={[12, 12]} text="局部坐标 140×100" fillStyle="#e8f0ff" />
</container>
```

子矩形的 `loc` 仍是 `[0, 0, 140, 100]`，但父级放大后，它在画布上占 210×150。文字也一起放大，包括字形。给子元素写一个 0.667 的 `scale` 可以把内容尺寸抵消回原大小，但子元素的位置仍按父级缩放后的坐标计算，整体位置不会回到未缩放状态。要把尺寸和位置都恢复，正确做法是把需要独立缩放的内容移出这个父级，放到另一个不被缩放的容器里。

嵌套变换不要用「把每层坐标累加成屏幕坐标」的心算。按树逐层理解：先看元素在父容器里的局部坐标，再看父容器在它自己父级里的位置与变换。需要跨元素比较位置时，用事件里的 `absoluteX` / `absoluteY`（画布坐标），不要自己把若干层的 `x` / `y` 相加。

下面左侧的父容器放大了 1.5 倍，子元素仍按局部坐标写；右侧是同一棵子树未缩放的参考。

<ClientOnly>
  <RenderDemo :loader="layerTransformTreeLoader" :width="480" :height="320" />
</ClientOnly>

## 缓存：cache 与 nocache {#缓存与脏更新}

默认值只作判断起点：`container` 默认缓存；`text`、`image` 与全部 `g-*` 图形默认不缓存。

- 什么时候开：结构复杂、内容稳定、重复绘制成本高的子树。
- 什么时候不开：内容频繁变化、子树很小，或者缓存的维护成本超过收益。

`cache` 用于打开缓存，`nocache` 用于关闭缓存。两者都可以在运行时随 props 修改，`nocache` 为 `true` 时优先于 `cache`；但每次切换都会启用或清理整块缓存，代价较高，不要频繁反复切换。

```tsx
// 静态复杂子树：内容不变、绘制成本高，开缓存
<container loc={[40, 40, 240, 160]} cache>
    <g-rect loc={[0, 0, 240, 160]} fillStyle="#1b2433" />
    <g-rect loc={[16, 16, 208, 40]} fillStyle="#2f6fed" />
    <g-circle circle={[48, 96, 24]} fillStyle="#f2b84b" />
    <text loc={[96, 84]} text="静态标题" fillStyle="#e8f0ff" />
</container>

// 频繁变化的子树：文字随时会被改写，不开缓存
<container loc={[40, 40, 240, 160]} nocache>
    <text loc={[0, 0]} text={String(clock.value)} fillStyle="#e8f0ff" />
</container>
```

## composite

`composite` 默认 `source-over`。值取 `GlobalCompositeOperation`（见 [MDN 的 composite 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation)），例如 `multiply`、`screen`、`overlay`、`lighter`。它影响当前绘制结果与已绘制内容的混合方式，不改变布局与命中区域。

```tsx
// composite 默认 source-over；这里用 multiply 让上层与已绘制内容混合
<g-rect loc={[40, 40, 120, 120]} fillStyle="#2f6fed" />
<g-rect loc={[100, 80, 120, 120]} fillStyle="#f2b84b" composite="multiply" />
```

下面三组是相同的重叠图形，分别使用 `source-over`、`multiply` 与 `screen`。

<ClientOnly>
  <RenderDemo :loader="layerCompositeLoader" :width="480" :height="320" />
</ClientOnly>

## 性能：缓存的代价

缓存用离屏画布换绘制次数：每帧少画一遍子树，代价是多占一份画布内存，内容变化时还要重画整块缓存。嵌套缓存会叠加内存占用，只在绘制成本确实高的地方开。没有确认有性能问题之前，先不开缓存。

## 边界与注意

- `scale` 必须是 `[x, y]` 数组。写成数字会报错，也不会生效。
- `rotate` 的单位是弧度。想转 30 度要写 `Math.PI / 6`，不是 `30`。
- 锚点是变换中心：缩放与旋转都绕锚点进行，改锚点会连同变换一起改变视觉位置。
- 父级变换会作用在整棵子树上；子元素用自己的 `scale` 只能抵消内容尺寸，抵消不了父级缩放带来的位置偏移，需要整体独立时把内容移出该父级。
- `cache` / `nocache` 可以随 props 修改，`nocache` 为 `true` 时优先于 `cache`；切换会重建整块缓存，不要频繁反复切换。
- `composite` 影响绘制结果的混合方式，不改变布局与命中区域。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const layerTransformLoader = () =>
    import('../../.vitepress/components/demos/ui/layer-transform.tsx');
const layerTransformTreeLoader = () =>
    import('../../.vitepress/components/demos/ui/layer-transform-tree.tsx');
const layerCompositeLoader = () =>
    import('../../.vitepress/components/demos/ui/layer-composite.tsx');
</script>
