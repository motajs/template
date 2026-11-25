# 动画

动画就是一系列数据按照指定方式变化：位置、透明度、颜色与进度条长度，都可以随时间连续改变。曲线决定「时间从起点走到终点时，数据按什么方式变化」；把数据与曲线交给动画系统，值就会平滑过渡，而不是瞬间跳过去。

本篇先讲曲线如何把时间映射成数据，再按基础、缓动与双曲三组介绍内置曲线的参数与形状，最后讲三个高层接口 `transitioned`、`transitionedColor` 与 `cycledTransition`。更底层的执行器与激励源见渲染底层。

## 前置知识

阅读本篇前，建议先读完：

- [响应式](./reactivity.md)
- [UI 入门](../basics/ui-basics.md)

## 动画的本质与曲线

一个动画由两部分组成：一份要变化的数据，和一条把时间进度映射成数据取值的曲线。时间进度通常叫 `progress`，从 `0`（开始）走到 `1`（结束）。曲线接收 `progress`，返回一个数；动画系统按这个返回值，在起始值与目标值之间取出当前值。

```ts
type ExcitationCurve = (progress: number) => number;
```

`progress` 在 `0` 到 `1` 之间，曲线的输出不要求也落在 `0` 到 `1`：输出可以超出这个范围，所以过程中可以低于起始值或高于目标值，也可以多次起伏。曲线只决定过渡过程，不决定动画最终落在哪个值；最终落点由使用曲线的动画接口给出。

内置曲线都从 `@motajs/animate` 导入。不带 `mode` 参数的曲线直接返回一条固定形状的曲线；带 `mode` 参数的曲线会在内部套用下面的曲线模式。

## 曲线模式

曲线本身只保证「缓进快出」这一种基本形状。给它套一个 `CurveMode`，就能改变快慢分布。`CurveMode` 是曲线的模式枚举，默认 `CurveMode.EaseIn`。

| 模式                   | 含义             | 形状                           |
| ---------------------- | ---------------- | ------------------------------ |
| `CurveMode.EaseIn`     | 缓进快出         | 从起点慢慢加速，越接近终点越快 |
| `CurveMode.EaseOut`    | 快进缓出         | 起步快，接近终点逐渐减速       |
| `CurveMode.EaseInOut`  | 缓进缓出，中间快 | 两端慢、中段最快               |
| `CurveMode.EaseCenter` | 快进快出，中间缓 | 两端快、中段最慢               |

这四种模式都从 `0` 开始、到 `1` 结束，区别只在过程中的快慢分布：`EaseIn` 越走越快，`EaseOut` 越走越慢，`EaseInOut` 两端慢、中段快，`EaseCenter` 两端快、中段慢。`CurveMode` 只改变形状，不改变时长与起止值；同一个曲线换模式只是让过程中快慢不同。各模式如何由一条缓进快出曲线换算得到，见[动画曲线](../internals/animation-curves.md#曲线模式)。

下面的演示用同一条正弦曲线，点四个按钮在四种模式之间切换。曲线连续变化，可以直观看出快慢分布。

<ClientOnly>
  <RenderDemo :loader="curveModesLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 内置曲线

下面按基础、缓动与双曲三组列出参数与形状；同一组的多条曲线画在一张图里，便于对照。

### 基础曲线

三条基础曲线不接收 `mode` 参数，形状直接由参数决定。

| 曲线          | 参数                  |
| ------------- | --------------------- |
| `linear()`    | 无                    |
| `step(k)`     | `k`：阶梯数，取正整数 |
| `constant(k)` | `k`：常数输出值       |

<ClientOnly>
  <RenderDemo :loader="basicCurvesLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 缓动曲线

四条曲线都以「缓进快出」为基准，并接收可选的 `mode`；不传时默认 `CurveMode.EaseIn`。它们从 `0` 上升到 `1`，上升速度不同。

| 曲线              | 参数                                 |
| ----------------- | ------------------------------------ |
| `sin(mode?)`      | `mode` 可选，默认 `CurveMode.EaseIn` |
| `tan(mode?)`      | `mode` 可选，默认 `CurveMode.EaseIn` |
| `sec(mode?)`      | `mode` 可选，默认 `CurveMode.EaseIn` |
| `pow(exp, mode?)` | `exp` 必需，指数；`mode` 可选        |

<ClientOnly>
  <RenderDemo :loader="easingCurvesLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 双曲曲线

三条双曲曲线同样接收可选的 `mode`，默认 `CurveMode.EaseIn`。`k` 是比例参数。

| 曲线                 | 参数                                         |
| -------------------- | -------------------------------------------- |
| `cosh(k = 2, mode?)` | `k` 默认 `2`；`mode` 默认 `CurveMode.EaseIn` |
| `tanh(k = 2, mode?)` | `k` 默认 `2`；`mode` 默认 `CurveMode.EaseIn` |
| `sech(k = 1, mode?)` | `k` 默认 `1`；`mode` 默认 `CurveMode.EaseIn` |

<ClientOnly>
  <RenderDemo :loader="specialCurvesLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

曲线公式、模式换算与单条曲线的行为见[动画曲线](../internals/animation-curves.md)。

## 数值渐变

界面里经常需要让一个数值在两次状态之间平滑变化，例如透明度从 `0.25` 到 `1`、圆点从左边移到右边。自己管理执行器、选择对象、绑定激励源会很啰嗦；`transitioned` 把这些收进一个控制器：你只需要告诉它「现在去哪个值」，它负责在当前值与目标值之间平滑推进。

### 获取控制器

先创建控制器，并给它一个初始值、一次变化默认用多久，以及过程中用哪条曲线：

```tsx
// setup
import { transitioned } from '@motajs/render-vue';
import { CurveMode, sin } from '@motajs/animate';

// 初始值 0.25，默认 600ms，曲线用 sin()
const alpha = transitioned(0.25, 600, sin(CurveMode.EaseOut))!;
```

`transitioned(value, time, curve)` 返回一个数值渐变控制器，类型是 `ITransitionedController<number> | null`：`value` 是初始值，`time` 是默认时长（毫秒），`curve` 是速率曲线。它只在组件 `setup` 中调用；在 `setup` 中返回值一定非空，所以这里用 `!` 收窄类型。返回的控制器带一个响应式引用 `ref`（类型 `Readonly<Ref<number>>`），渲染时读 `alpha.ref.value` 就能拿到当前值。

### 执行渐变动画

控制器拿到后，当前值就是初始值。要让数值走向新目标，调用 `set(value, time?)`；省略 `time` 时使用控制器的默认时长：

```tsx
// setup
const expand = () => {
    // 从当前值走向 1，使用创建时的 600ms
    alpha.set(1);
};

// 组件内容
<g-rect
    loc={[40, 92, 120, 88]}
    fillStyle="#2f6fed"
    alpha={alpha.ref.value}
    onClick={expand}
/>;
```

调用 `set(1)` 后，控制器从调用时的当前值出发，在 600ms 内走向 1；渲染函数读 `alpha.ref.value`，所以矩形的透明度会跟着变化。动画进行中再次 `set`，会从当时的当前值转向新目标；`time` 为 `0` 时直接落到目标值。

### 设置渐变参数

如果某一次变化想用不同节奏，或者之后都换一条曲线、一个时长，可以在下一次 `set` 前调用 `mode(curve)` 或 `setTime(time)`：

```tsx
// setup
import { linear } from '@motajs/animate';

// 这一次改用 300ms
alpha.set(0.4, 300);

// 之后的 set 都改用线性曲线与 1200ms
alpha.mode(linear());
alpha.setTime(1200);
```

`mode(curve)` 替换后续 `set` 使用的速率曲线；`setTime(time)` 替换后续 `set` 的默认时长。两者只影响之后的调用，不会重设当前正在进行的渐变。

把三步连起来，就是一次完整的数值渐变。下面的示例同时驱动透明度、位置与进度条：

```tsx
// setup
import { transitioned } from '@motajs/render-vue';
import { CurveMode, linear, sin } from '@motajs/animate';

const alpha = transitioned(0.25, 600, sin(CurveMode.EaseOut))!;
const slide = transitioned(0, 600, sin(CurveMode.EaseOut))!;
const bar = transitioned(0.3, 600, sin(CurveMode.EaseOut))!;

const expand = () => {
    alpha.set(1);
    slide.set(1, 300);
    bar.set(1);
};

bar.mode(linear());
bar.setTime(1200);

// 组件内容
<g-rect loc={[40, 92, 120, 88]} fillStyle="#2f6fed" alpha={alpha.ref.value} />
<g-circle
    circle={[204 + slide.ref.value * 192, 140, 12]}
    fillStyle="#f2b84b"
/>
<g-rect
    loc={[40, 234, 280 * bar.ref.value, 12]}
    fillStyle="#7ee787"
/>
```

下面的 live 用三组元素展示 `alpha`、位置与进度条的渐变。

<ClientOnly>
  <RenderDemo :loader="alphaLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 颜色渐变

颜色字符串不能直接做数值加减；自己拆成红、绿、蓝、透明四个通道再分别推进，也很麻烦。`transitionedColor` 把颜色当作一个整体：它内部拆通道、同步推进，最后再拼回颜色字符串。

### 获取颜色控制器

```tsx
// setup
import { transitionedColor } from '@motajs/render-vue';
import { CurveMode, sin } from '@motajs/animate';

const fill = transitionedColor('#2f6fed', 600, sin(CurveMode.EaseOut))!;
```

`transitionedColor(color, time, curve)` 返回一个颜色渐变控制器，类型是 `ITransitionedController<string> | null`。`color` 是初始颜色，`time` 是默认时长，`curve` 是速率曲线。它返回的控制器与数值渐变同形，但 `ref.value` 是当前颜色字符串，可以直接交给 `fillStyle`、`strokeStyle`。

支持的颜色写法有十六进制 `#rgb`、`#rgba`、`#rrggbb`、`#rrggbbaa`，以及 `rgb(r, g, b)` 与 `rgba(r, g, b, a)`。只支持这些写法；其他格式不会按预期渐变。

### 执行颜色渐变

```tsx
// setup
const warm = () => {
    fill.set('#f2b84b');
};

// 组件内容
<g-rect loc={[40, 80, 180, 140]} fillStyle={fill.ref.value} onClick={warm} />;
```

调用 `set` 后，控制器从当前颜色走向目标颜色；渲染函数读 `fill.ref.value` 得到中间颜色。`set`、`mode`、`setTime` 的用法与数值渐变一致。

### 设置颜色渐变参数

```tsx
// setup
import { linear } from '@motajs/animate';

// 这一次改用 300ms
fill.set('#7ee787', 300);

// 之后的 set 都改用线性曲线与 1200ms
fill.mode(linear());
fill.setTime(1200);
```

`set` 的第二个参数只覆盖这一次的时长；`mode` 与 `setTime` 改的是之后的调用。

把填充色与描边色放进同一个示例：

```tsx
// setup
import { transitionedColor } from '@motajs/render-vue';
import { CurveMode, sin } from '@motajs/animate';

const fill = transitionedColor('#2f6fed', 600, sin(CurveMode.EaseOut))!;
const stroke = transitionedColor(
    'rgba(242, 184, 75, 0.9)',
    600,
    sin(CurveMode.EaseOut)
)!;

fill.set('#f2b84b');
stroke.set('#7ee787');

// 组件内容
<g-rect loc={[40, 80, 180, 140]} fillStyle={fill.ref.value} />
<g-circle
    circle={[320, 150, 56]}
    stroke
    strokeStyle={stroke.ref.value}
    lineWidth={10}
/>
```

下面的 live 同时渐变填充色与描边色。

<ClientOnly>
  <RenderDemo :loader="colorLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 循环渐变

呼吸灯、闪烁这类效果需要数值在两个端点之间反复往返。每次到端点都手动重设目标，很容易接不上；`cycledTransition` 把往返过程包成一个自动循环的控制器。

### 获取循环控制器

```tsx
// setup
import { cycledTransition } from '@motajs/render-vue';
import { CurveMode, sin } from '@motajs/animate';

// 在 0.25 与 1 之间往返，单程 900ms
const glow = cycledTransition(0.25, 1, 900, sin(CurveMode.EaseOut))!;
```

`cycledTransition(min, max, time, curve, maxStart = false)` 返回一个循环渐变控制器，类型是 `ICycledTransitionController | null`。`min` 与 `max` 是循环的两个端点，`time` 是单程耗时（毫秒），`curve` 是单程使用的速率曲线；`maxStart` 为 `true` 时从 `max` 开始，否则从 `min` 开始。控制器创建后不会立刻开始，组件挂载并绑定到根渲染器的激励源后才开始循环，组件卸载时停止，不需要手动清理。

### 读取循环值

循环已经自动开始，渲染时读 `glow.ref.value` 就能拿到当前值：

```tsx
// 组件内容
<g-circle circle={[180, 150, 80]} fillStyle="#2f6fed" alpha={glow.ref.value} />
```

这个圆形的透明度会在 0.25 与 1 之间反复变化。到端点后控制器会自动把目标切到另一端，不需要再调用 `set`。

### 设置循环参数

```tsx
// setup
import { linear } from '@motajs/animate';

const narrow = () => {
    glow.setRange(0.5, 1);
};

glow.mode(linear());
glow.setTime(1200);

// 组件内容
<g-circle
    circle={[180, 150, 80]}
    fillStyle="#2f6fed"
    alpha={glow.ref.value}
    onClick={narrow}
/>;
```

`setRange(min, max)` 修改循环的两个端点，并立即按新区间重新确定这一次的目标；`mode(curve)` 与 `setTime(time)` 修改后续单程使用的曲线与时长。

把两个循环放进同一个示例：

```tsx
// setup
import { cycledTransition } from '@motajs/render-vue';
import { CurveMode, linear, sin } from '@motajs/animate';

const glow = cycledTransition(0.25, 1, 900, sin(CurveMode.EaseOut))!;
const core = cycledTransition(0.5, 1, 900, linear(), true)!;

const widen = () => {
    glow.setRange(0.5, 1);
};

// 组件内容
<g-circle circle={[180, 150, 80]} fillStyle="#2f6fed" alpha={glow.ref.value} />
<g-circle circle={[180, 150, 38]} fillStyle="#f2b84b" alpha={core.ref.value} />
```

下面的 live 用两个滑动条分别调整循环的起点与终点，轨道上的圆点显示当前值。

<ClientOnly>
  <RenderDemo :loader="cycleLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

需要编排多对象、控制激励源或直接操作单个数值渐变时，继续读[动画曲线](../internals/animation-curves.md)、[动画激励](../internals/animation-excitation.md)、[动画执行器](../internals/animation-runner.md)与[渐变执行器](../internals/animation-transition.md)。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const curveModesLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-modes.tsx');
const basicCurvesLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curves-basic.tsx');
const easingCurvesLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curves-easing.tsx');
const specialCurvesLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curves-special.tsx');
const alphaLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-alpha.tsx');
const colorLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-color.tsx');
const cycleLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-cycle.tsx');
</script>
