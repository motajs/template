# 自绘元素与自定义容器

`<custom>` 与 `<container-custom>` 用来处理现成元素无法直接表达的绘制与子元素控制：前者在元素内部直接用 Canvas 2D 画内容，后者接管子元素的绘制与事件传递。普通布局仍然优先用 `<container>` 与现成元素；只有确实需要直接操作画布或控制子元素时才用这两个标签。

## 前置知识

阅读本篇前，建议先读完：

- [容器与坐标](./container-and-coordinates.md)
- [基础图形](./basic-shapes.md)

## custom

`<custom>` 是叶子元素，没有子元素。它的尺寸与位置由 `loc` 决定，`loc` 之外不参与布局。

`render` 接收 `MotaOffscreenCanvas2D`，在元素局部坐标里直接用 `canvas.ctx` 绘制。局部坐标的原点在元素左上角，宽高就是 `loc` 的宽高。

系统在调用 `render` 前后已经保存并恢复了画布状态，函数里不需要在开头和结尾习惯性地写 `save` / `restore`。只有在函数内部临时改变状态、之后还要恢复并继续绘制时，才需要自己保存和恢复。

`bindings` 接收依赖值数组。把 `render` 读取的响应式值放进数组，例如 `bindings={[angle.value]}`，不需要传 `ref` 对象。读取 `.value` 发生在父组件 render 中，和 `loc={[x.value, ...]}` 一样会被 Vue 追踪；值变化后父组件重渲染，`bindings` prop 更新，`<custom>` 重绘。`render` 函数本身不需要认识 Vue、`Ref` 或 `watch`，它只读取普通值。`Ref` 等响应式基础见[《响应式》](../advanced/reactivity.md)。

::: warning
不要在 `render` 里修改用于 `bindings` 的响应式值（例如渲染时递增 `angle.value`），这会让渲染与状态更新互相触发。一般不会遇到这种情况，确实需要时会在高级 III 中进一步讲解。
:::

`<custom>` 默认开启缓存。内容频繁变化、缓存没有收益时，可以加 `nocache`。

需要直接使用 Canvas 2D 的路径、渐变、裁剪等能力，而现成元素组合不出来时，用 `<custom>` 自绘。能用 `g-*` 图形、`image` 与 `text` 拼出来的内容，继续用现成元素。

```tsx
import { ref } from 'vue';

// 把 angle.value 放进 bindings；角度变化时 <custom> 会重绘
const angle = ref(0);
const ringColors = ['#2f6fed', '#7aa7ff', '#f2b84b'];

// render 在元素局部坐标里绘制内容
const render = canvas => {
    const ctx = canvas.ctx;
    const cx = 100;
    const cy = 100;

    // 径向渐变与同心圆环直接走 Canvas 2D
    const gradient = ctx.createRadialGradient(cx, cy, 12, cx, cy, 88);
    gradient.addColorStop(0, '#2f6fed');
    gradient.addColorStop(1, '#141a22');
    ctx.beginPath();
    ctx.arc(cx, cy, 88, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ringColors.forEach((color, index) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 70 - index * 16, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
    });

    // 指针从圆心出发，按 angle 旋转；坐标都相对元素左上角
    ctx.translate(cx, cy);
    ctx.rotate(angle.value);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -64);
    ctx.strokeStyle = '#e8f0ff';
    ctx.lineWidth = 4;
    ctx.stroke();
};

<custom loc={[40, 40, 200, 200]} bindings={[angle.value]} render={render} />;
```

下面的 live 用 `<custom>` 绘制同心圆环、径向渐变与旋转指针，角度值通过 `bindings` 触发重绘。

<ClientOnly>
  <RenderDemo :loader="customDemoLoader" :width="480" :height="320" />
</ClientOnly>

## container-custom

`<container-custom>` 是带子元素的容器，区别只在绘制方式：`render` 接管子元素的绘制。

`render(canvas, children, transform)` 拿到画布、排好序的子元素列表与当前变换。子元素不会自动出现，必须自己遍历 `children`，对每个子元素调用 `renderContent`；不调用就不会绘制。`children` 已经按 `zIndex` 排好序，遍历顺序就是绘制顺序；`hidden` 的子元素应当跳过。

因为绘制的是子元素本身，`render` 里可以先逐个修改子元素的属性，再调用 `renderContent`。下面的例子给每个子元素设置依次递增的模糊：

```tsx
// render 接管子元素绘制：按顺序给每个子元素设置递增的模糊，再逐个绘制
const render = (canvas, children, transform) => {
    children.forEach((child, index) => {
        if (child.hidden) return;
        child.setFilter(`blur(${index * 2}px)`);
        child.renderContent(canvas, transform);
    });
};

<container-custom loc={[40, 40, 240, 160]} render={render}>
    <g-rect loc={[16, 16, 208, 40]} fillStyle="#2f6fed" />
    <g-rect loc={[16, 64, 208, 40]} fillStyle="#2f6fed" />
    <g-rect loc={[16, 112, 208, 40]} fillStyle="#2f6fed" />
</container-custom>;
```

和 `custom` 一样，系统在调用 `render` 前后已经保存并恢复了画布状态，这个例子不需要写 `save` / `restore`。

`propagate` 接管事件传递，参数依次是事件类型、当前进度、事件对象、当前容器和「按默认规则继续传递」的回调。不写 `propagate` 就沿用默认。只有需要修改事件坐标或改变传递路径时才写，日常自定义绘制不需要它。

`<container-custom>` 常用于内置组件内部；需要自己控制子元素绘制或事件传递时也可以使用。普通布局继续用 `<container>`。

它默认开启缓存。内容频繁变化、缓存没有收益时，可以加 `nocache`。

普通 `<container>` 默认也会开启缓存：子元素先画到容器的缓存画布上，超出缓存画布的内容会被裁掉。给容器加 `nocache` 后子元素直接画到上层画布，超出容器的内容才不再被裁。不过这是缓存实现带来的特性，后续可能变化，不要依赖它来做布局或裁剪。

下面的 live 用同一组子元素对比：左侧普通 `<container>` 原样绘制，右侧 `<container-custom>` 在 `render` 里给子元素依次设置递增的模糊。

<ClientOnly>
  <RenderDemo :loader="containerCustomDemoLoader" :width="480" :height="320" />
</ClientOnly>

## 选择方式

| 需求                 | 用法                                |
| -------------------- | ----------------------------------- |
| 只画内容、没有子元素 | `<custom>`                          |
| 要控制子元素怎么画   | `<container-custom>` 的 `render`    |
| 要控制事件怎么传递   | `<container-custom>` 的 `propagate` |
| 普通布局             | `<container>` 与现成元素            |

能用现成元素组合出来的内容，优先用现成元素；`<custom>` 与 `<container-custom>` 留给 Canvas 2D 直接绘制或子元素控制。

## 边界与注意

- `<custom>` 没有子元素，尺寸与位置由 `loc` 决定。
- `<container-custom>` 的 `render` 必须遍历并调用子元素的 `renderContent`，否则子元素不会绘制。
- `propagate` 不写就沿用默认；不需要改变事件传递时不要写。
- `<custom>` 与 `<container-custom>` 默认缓存；内容频繁变化时再加 `nocache`。
- 普通布局与能用现成元素表达的内容，继续用 `<container>` 与现成元素。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const customDemoLoader = () =>
    import('../../.vitepress/components/demos/ui/custom-demo.tsx');
const containerCustomDemoLoader = () =>
    import('../../.vitepress/components/demos/ui/container-custom-demo.tsx');
</script>
