# 第一个静态界面

这一篇从头拼一个静态界面：深色底、标题、一个图标、一个矩形、一个圆、一条分隔线，最后用两块重叠的矩形看层级。整屏 UI 用引擎给出的 `FULL_LOC`。每一步只加一种东西，最后得到一份可以直接运行的静态界面。

## 容器

界面从容器开始。容器决定这块 UI 占多大，也决定子元素的坐标从哪里算：

```tsx
<container loc={FULL_LOC}>
    <g-rect loc={FULL_LOC} fillStyle="#141a22" />
</container>
```

- `FULL_LOC` 是引擎给出的整屏位置；
- 子元素的坐标相对这个容器的左上角，而不是相对整块画布；
- `container` 本身不画颜色，深色底用一块和它一样大的 `g-rect` 铺出来；
- 图形默认填充，`fillStyle` 是填充颜色。

现在得到一块铺满整屏的深色区域，后面的元素都放进这个 `container`。

## 文字

在容器里加标题：

```tsx
<text loc={[24, 24]} text="背包" fillStyle="#e8f0ff" />
```

- `text` 是文字内容，写在属性里，不要写成标签之间的裸文字；
- `loc` 只写两个数：文字左上角相对容器左上角的位置；
- `fillStyle` 是文字颜色。

## 矩形与圆

矩形用 `g-rect`，位置和大小都由 `loc` 给出：

```tsx
<g-rect loc={[24, 64, 160, 64]} fillStyle="#2f6fed" />
```

前两个数是左上角，后两个数是宽和高。

圆用 `g-circle`，写成 `circle={[圆心x, 圆心y, 半径]}`：

```tsx
<g-circle circle={[280, 96, 32]} fillStyle="#58c4dd" />
```

圆默认填充，`fillStyle` 给颜色。

## 直线

分隔线用 `g-line`，给出两个端点即可：

```tsx
<g-line line={[24, 168, 456, 168]} strokeStyle="#7aa7ff" />
```

- `line` 的四个数是起点 `x` / `y` 和终点 `x` / `y`；
- 线默认描边，`strokeStyle` 是颜色。

这条线从 `(24, 168)` 画到 `(456, 168)`，横在面板中间。

## 素材管理器中的图片

图片从素材管理器按别名取：

```tsx
const icon = props.state.materials.getImageByAlias('bg.jpg');

<image image={icon} loc={[24, 184, 64, 64]} />;
```

- `props.state.materials` 是 ClientCore 提供的素材管理器，素材和别名由它统一维护；
- `getImageByAlias('bg.jpg')` 按别名取一张已经登记好的图，返回纹理或 `null`；
- 取到的纹理直接交给 `image` 的 `image` 属性，`loc` 决定画在哪里、画多大。

## 相对坐标与层级

前面所有元素的坐标都相对根容器。把一组元素放进子容器时，坐标改成相对这个子容器：

```tsx
<container loc={[240, 200, 216, 88]}>
    <g-rect loc={[0, 0, 216, 88]} fillStyle="#1d2733" />
    <text loc={[12, 12]} text="状态" fillStyle="#9fb6d1" />
</container>
```

子容器的 `loc` 是它在根容器里的位置；里面 `g-rect` 的 `[0, 0]` 是子容器的左上角，不是面板的左上角。移动子容器时，里面的元素整体跟着走。

同一父级里的兄弟按 `zIndex` 决定谁在上面：值大的画在上面。第二个矩形后写，但给第一个写 `zIndex={2}`，重叠处就是第一个在上面：

```tsx
<g-rect loc={[320, 120, 120, 72]} fillStyle="#f2b84b" zIndex={2} />
<g-rect loc={[368, 152, 120, 72]} fillStyle="#58c4dd" />
```

`zIndex` 只在同一个父级的兄弟之间比较；不写时按书写顺序叠放。缓存与命中的细节不在本篇展开。

## 完整模板

把上面的内容按顺序放进标准模板：

```tsx
import { defineComponent } from 'vue';
import { GameUI, SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';
import { IGameUIPropsBase } from '@user/client-base';
import { FULL_LOC } from '@/client';

// 这里填写自定义的 UI 参数
interface MyPanelProps extends IGameUIPropsBase, DefaultProps {}

const myPanelProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<MyPanelProps>;

const MyPanel = defineComponent<MyPanelProps>(props => {
    // 图片从素材管理器按别名取
    const icon = props.state.materials.getImageByAlias('bg.jpg');

    return () => (
        <container loc={FULL_LOC}>
            <g-rect loc={FULL_LOC} fillStyle="#141a22" />
            <text loc={[24, 24]} text="背包" fillStyle="#e8f0ff" />
            <g-rect loc={[24, 64, 160, 64]} fillStyle="#2f6fed" />
            <g-circle circle={[280, 96, 32]} fillStyle="#58c4dd" />
            <g-line line={[24, 168, 456, 168]} strokeStyle="#7aa7ff" />
            <image image={icon} loc={[24, 184, 64, 64]} />
            <container loc={[240, 200, 216, 88]}>
                <g-rect loc={[0, 0, 216, 88]} fillStyle="#1d2733" />
                <text loc={[12, 12]} text="状态" fillStyle="#9fb6d1" />
            </container>
            <g-rect loc={[320, 120, 120, 72]} fillStyle="#f2b84b" zIndex={2} />
            <g-rect loc={[368, 152, 120, 72]} fillStyle="#58c4dd" />
        </container>
    );
}, myPanelProps);

export const MyPanelUI = new GameUI('my-panel', MyPanel);
```

`FULL_LOC` 是整块画布的位置；在已有 UI 中使用 `props.controller.open(MyPanelUI, {})` 打开后，看到的就是这块面板。

## 运行效果

<ClientOnly>
  <RenderDemo :loader="staticUiLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../../.vitepress/components/renderDemo.vue';

const staticUiLoader = () =>
    import('../../../.vitepress/components/demos/ui/static-ui-demo.tsx');
</script>

## 后续

- 坐标、锚点与嵌套：[容器与坐标](./container-and-coordinates.md)
- 更多图形：[基础图形](./basic-shapes.md)
- 文字样式：[文字](./text.md)
- 纹理与素材：[图片与纹理](./image-and-texture.md)
- 层级、变换与缓存：[层级、变换与性能](./layer-transform-performance.md)
- 让界面响应点击：[事件与交互](./events.md)
