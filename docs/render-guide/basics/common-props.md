# 通用参数

这些属性大多数元素都能写。它们有的只在特定条件下有意义：`hd` 只对开启缓存的元素有效；`anti` / `noanti` 影响绘制内容在缩放时的插值；`cursor`、`hidden` 要鼠标经过或隐藏时才能看出差别。下面会说明每个参数在什么条件下有意义；场景只是由属性语义推出的适用条件，不是限定用途。

## 前置知识

阅读本篇前，建议先读完：

- [容器与坐标](./container-and-coordinates.md)
- [基础图形](./basic-shapes.md)

## hd

`hd` 默认 `true`。它控制元素的缓存画布是否按设备像素比（DPR）使用高清分辨率：为 `true` 时缓存画布按 DPR 放大，为 `false` 时按 1x 绘制。它只对开启缓存的元素有效；没有缓存的元素写 `hd` 看不到可见变化。

是否要高清缓存由缓存内容决定。缓存的是文字、矢量图形这类需要清晰边缘的内容时，在高 DPR 屏幕上按 DPR 绘制，放大后边缘才不会糊，默认的 `true` 适合这类内容。反过来，如果缓存内容本身就是 1x 的像素数据，按 DPR 放大并不会多出信息；或者更在意缓存的显存与内存开销而不是 DPR 下的清晰度，就可以写 `hd={false}`。

```tsx
// hd 只对开启缓存的元素有效；container 默认开启缓存，这里让它按 1x 绘制缓存
<container loc={[40, 40, 240, 160]} hd={false}>
    <text loc={[8, 8]} text="缓存内容" fillStyle="#ffffff" />
</container>
```

## anti / noanti

`anti` 默认 `true`，`noanti` 默认 `false`。两者控制同一个抗锯齿开关：`anti` 为 `false` 关闭抗锯齿，`noanti` 为 `true` 也关闭抗锯齿。`noanti` 的优先级更高，`noanti` 为 `true` 等价于关闭 `anti`；不要同时依赖两个开关。

抗锯齿影响的是图片等绘制内容在缩放时的插值方式。连续色调的图片与渐变在缩放时，平滑插值能减少锯齿和色块，默认的 `anti` 适合这类内容。像素图相反：它的边缘本来就是硬边，抗锯齿会把硬边插值成半透明过渡，放大后像素边缘会发虚。因此像素图放大时应写 `noanti`，并尽量按整数倍放大，减少额外的重采样。这个结论是从「像素图需要硬边」推出来的适用条件，不是对 `noanti` 用途的限定。

```tsx
// noanti 关闭图片缩放时的插值，让像素边缘保持硬边
<image image={texture} noanti loc={[40, 40, 160, 160]} />
```

下面把同一张 16×16 纹理放大到 160×160：左边用默认绘制，右边写了 `noanti`，对照边缘是平滑还是方块。

<ClientOnly>
  <RenderDemo :loader="propsAntiLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## hidden

`hidden` 默认 `false`。为 `true` 时元素不绘制，也不参与交互。它不改变元素的尺寸与坐标，改回 `false` 后原样恢复。需要保留元素实例、只是临时不绘制或不交互时用它；改回 `false` 就能恢复，不需要反复创建和销毁元素。

```tsx
// hidden 为 true 时不绘制，也不参与交互
<g-rect loc={[40, 40, 120, 80]} hidden fillStyle="#2f6fed" />
```

## id

`id` 默认空字符串，一般情况下不会用到。只有需要从渲染器按 id 直接查找元素时才写，例如调试、测试或命令式访问；日常写 UI 不需要给元素命名。

空 id 不会被登记；同一个渲染器内 id 应当唯一，重复会告警。给元素写 `id` 后，可以用渲染器的 `getElementById(id)` 查找它。它不是 DOM id，不影响显示与布局。

```tsx
// 需要按 id 查找时才写，之后可以用渲染器的 getElementById 取回
<g-rect id="target" loc={FULL_LOC} fillStyle="#141a22" />
```

## alpha

`alpha` 默认 `1`，范围 `0`–`1`。它不是继承属性，不会自动写到每个子元素各自的绘制上。子元素是否一起变透明，取决于当前元素有没有开启缓存：开启缓存的父级会把子元素先画进缓存图，再对整张缓存结果应用 `alpha`，子元素会一起变透明；未开启缓存时，`alpha` 只影响当前元素自身的绘制，子元素按自己的 `alpha` 绘制。单个元素需要淡入淡出时，改自己的 `alpha` 即可。

```tsx
// 只影响这个矩形自身的透明度
<g-rect loc={[40, 40, 120, 80]} fillStyle="#4f8cff" alpha={0.5} />
```

下面三个同尺寸矩形分别使用 `alpha` 为 `1`、`0.6` 与 `0.25`。

<ClientOnly>
  <RenderDemo :loader="propsAlphaLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## cursor

`cursor` 默认 `inherit`。值是一个 CSS cursor 字符串，例如 `pointer`、`text`、`default`，按 CSS 中这些值的语义选择需要的形状。它只改变鼠标悬停时的光标，不负责点击：点击由元素的事件处理，光标只是提示。鼠标悬停在元素上时才生效，所以元素本身要参与交互；不参与交互的元素不会改变光标。

```tsx
// 悬停在这个矩形上时，光标变成手型
<g-rect loc={[40, 40, 200, 80]} fillStyle="#2f6fed" cursor="pointer" />
```

下面这块区域写了 `cursor="pointer"`，鼠标移上去后光标会变成手型。

<ClientOnly>
  <RenderDemo :loader="propsCursorLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## filter

`filter` 默认 `none`。值可以是任何合法的 CSS filter 字符串，例如 `blur(3px)`、`grayscale(1) brightness(0.7)`、`drop-shadow(0 4px 6px #000)`；完整的函数列表见 [MDN 的 filter 文档](https://developer.mozilla.org/zh-CN/docs/Web/CSS/filter)。可以组合多个函数，用空格分隔，按书写顺序依次应用。

`filter` 不是继承属性，不会自动套到每个子元素各自的绘制上。子元素是否被过滤，取决于当前元素有没有开启缓存：开启缓存时，子元素先画进当前元素的缓存图，`filter` 作用在整张缓存结果上，子元素会一起被过滤；未开启缓存时，子元素按自己的 `filter` 绘制，当前元素的 `filter` 只影响自身绘制。如果当前元素没有自己的绘制（例如未开启缓存的容器），`filter` 就不会作用到子元素。它也不影响布局。

```tsx
// 多个 filter 函数按书写顺序依次应用
<g-rect
    loc={[40, 40, 160, 100]}
    fillStyle="#4f8cff"
    filter="blur(3px) brightness(0.8)"
/>
```

下面三张相同的图分别是正常、模糊与灰度加亮度。

<ClientOnly>
  <RenderDemo :loader="propsFilterLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## zIndex

`zIndex` 默认 `0`。它只在同一父元素下的兄弟之间比较：值越大越后画、越靠上。不同父级的元素不直接比较，它们跟随各自父级在树中的叠放关系绘制。`zIndex` 可以是负数，值越小越先画、越靠下。相同值不要依赖先后顺序。

```tsx
// 只影响同一父元素下的兄弟：zIndex 较大的后画，盖住默认的 0
<g-rect loc={[40, 40, 160, 110]} fillStyle="#f0b428" zIndex={1} />
<g-rect loc={[100, 80, 160, 110]} fillStyle="#2f6fed" />
```

需要强制决定同一父级下兄弟的叠放顺序时，用 `zIndex`。下面两个矩形互相重叠，蓝色写了更高的 `zIndex`，即使先写也盖在黄色上面。

<ClientOnly>
  <RenderDemo :loader="propsZIndexLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const propsAntiLoader = () =>
    import('../../.vitepress/components/demos/ui/props-anti.tsx');
const propsAlphaLoader = () =>
    import('../../.vitepress/components/demos/ui/props-alpha.tsx');
const propsCursorLoader = () =>
    import('../../.vitepress/components/demos/ui/props-cursor.tsx');
const propsFilterLoader = () =>
    import('../../.vitepress/components/demos/ui/props-filter.tsx');
const propsZIndexLoader = () =>
    import('../../.vitepress/components/demos/ui/props-zindex.tsx');
</script>
