# 动画曲线

曲线把时间进度映射成数据取值：时间完成度从 `0` 走到 `1`，曲线返回一个数，动画系统再用它让数值从起始值逐步走到目标值。本篇是曲线的完整参考：先讲类型与四种模式，再按基础、缓动、双曲三组逐条列出内置曲线，每条曲线都配一个实时曲线图，带参数的曲线还可以在图上调整参数，最后汇总把曲线组合、变换、拼接与多维合并的计算函数。内置形状曲线与分组对照图的纵轴固定为 `0` 到 `1`；运算与变换的实时图按来源与结果的实际输出自适应纵轴范围，不裁剪曲线。高层用法与形状示例见[动画](../advanced/animation.md)；单个数值的连续渐变见[渐变执行器](./animation-transition.md)。

## 前置知识

阅读本篇前，建议先读完：

- [动画](../advanced/animation.md)
- [响应式](../advanced/reactivity.md)

## 曲线与数据映射

曲线的类型是 `ExcitationCurve`，它只接收一个时间完成度，返回一个数：

```ts
export type ExcitationCurve = (progress: number) => number;
```

- 输入是时间完成度，范围是 `0` 到 `1`；下面公式里记作 `x`。类型声明里的参数名是 `progress`，两者指同一个值。
- 输出没有范围限制。动画系统不会把它裁剪到 `0` 到 `1`。
- 曲线本身不知道起始值与目标值；它只回答「进度到这里时，映射结果是多少」。把结果用于计算当前值的动作由动画接口或执行器完成。

```ts
import { linear } from '@motajs/animate';

// 匀速曲线：x 为 0.5 时返回 0.5
const curve = linear();
console.log(curve(0.5));
```

## 曲线模式

同一条曲线，换一个模式就会得到不同的快慢分布；先认识这四个模式，后面带 `mode` 参数的曲线才有共同的参照。

`CurveMode` 是曲线的模式枚举，默认值是 `CurveMode.EaseIn`：

```ts
export const enum CurveMode {
    /** 缓进快出 */
    EaseIn,
    /** 快进缓出 */
    EaseOut,
    /** 缓进缓出，中间快 */
    EaseInOut,
    /** 快进快出，中间缓 */
    EaseCenter
}
```

| 模式                   | 含义             | 形状                           |
| ---------------------- | ---------------- | ------------------------------ |
| `CurveMode.EaseIn`     | 缓进快出         | 从起点慢慢加速，越接近终点越快 |
| `CurveMode.EaseOut`    | 快进缓出         | 起步快，接近终点逐渐减速       |
| `CurveMode.EaseInOut`  | 缓进缓出，中间快 | 两端慢、中段最快               |
| `CurveMode.EaseCenter` | 快进快出，中间缓 | 两端快、中段最慢               |

### 模式换算

已经有一条按「缓进快出」写好的曲线时，不必为四种模式各写一份；`applyCurveMode` 能在它外面套一层换算，得到新的形状。`applyCurveMode(func, mode)` 接收一条「缓进快出」曲线 $f(x)$，返回套用模式后的新曲线 $g(x)$：

| 模式         | 换算                                                                                 |
| ------------ | ------------------------------------------------------------------------------------ |
| `EaseIn`     | $g(x) = f(x)$                                                                        |
| `EaseOut`    | $g(x) = 1 - f(1 - x)$                                                                |
| `EaseInOut`  | $x < 0.5$ 时 $g(x) = \frac{f(2x)}{2}$；否则 $g(x) = 1 - \frac{f(2 - 2x)}{2}$         |
| `EaseCenter` | $x < 0.5$ 时 $g(x) = \frac{1 - f(1 - 2x)}{2}$；否则 $g(x) = \frac{1 + f(2x - 1)}{2}$ |

```ts
import { applyCurveMode, CurveMode } from '@motajs/animate';

// 把一条缓进快出曲线 f(x) = x^2 换成快进缓出
const easeOut = applyCurveMode((x: number) => x * x, CurveMode.EaseOut);
```

## 基础曲线

基础曲线不接收 `mode` 参数，形状只由自身参数决定。下面每个 live 都使用 `0` 到 `1` 的纵轴。

### 线性曲线 linear()

没有参数，把输入 `x` 原样输出：

$$
f(x) = x,\quad x\in[0,1]
$$

输出始终在 `0` 到 `1`。下面的 live 没有控件，曲线固定为一条直线。

<ClientOnly>
  <RenderDemo :loader="linearCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 阶梯曲线 step(k)

参数 `k` 是分段数，取正整数。进度每走 `1/k`，输出跳变一次：

$$
f(x) = \frac{\lfloor x k \rfloor}{k},\quad x\in[0,1]
$$

live 把 `k` 限制在 `2` 到 `12`；`k` 越大，阶梯越细，输出仍在 `0` 到 `1`。

<ClientOnly>
  <RenderDemo :loader="stepCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 常数曲线 constant(k)

参数 `k` 是常数值，输出不随进度变化：

$$
f(x) = k,\quad x\in[0,1]
$$

输出始终等于 `k`，可以落在 `0` 到 `1` 之外。live 为了让曲线留在纵轴内，把 `k` 限制在 `0` 到 `1`；调整时看到的仍是同一条水平线。

<ClientOnly>
  <RenderDemo :loader="constantCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 缓动曲线

缓动曲线以「缓进快出」为基准，接收可选的 `mode`，不传时默认 `CurveMode.EaseIn`。下面给出的是基准形状公式；切换模式后，曲线按上一节的换算改变快慢分布。

### 正弦曲线 sin(mode?)

参数 `mode` 可选，默认 `CurveMode.EaseIn`：

$$
f(x) = 1 - \cos\left(\frac{x\pi}{2}\right),\quad x\in[0,1]
$$

基准形状从 `0` 走到 `1`。live 用四个按钮切换 `CurveMode`，曲线连续变化，可以直接看出快慢分布。

<ClientOnly>
  <RenderDemo :loader="sinCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 正切曲线 tan(mode?)

参数 `mode` 可选，默认 `CurveMode.EaseIn`：

$$
f(x) = \tan\left(\frac{x\pi}{4}\right),\quad x\in[0,1]
$$

<ClientOnly>
  <RenderDemo :loader="tanCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 正割曲线 sec(mode?)

参数 `mode` 可选，默认 `CurveMode.EaseIn`：

$$
f(x) = \sec\left(\frac{x\pi}{3}\right) - 1,\quad x\in[0,1]
$$

<ClientOnly>
  <RenderDemo :loader="secCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 幂曲线 pow(exp, mode?)

`exp` 是指数，必需；`mode` 可选，默认 `CurveMode.EaseIn`。下面公式里把 `exp` 记作 `n`：

$$
f(x) = x^{n},\quad x\in[0,1]
$$

live 把 `exp` 限制在 `0.5` 到 `4`；`exp > 0` 时输出仍在 `0` 到 `1`。

<ClientOnly>
  <RenderDemo :loader="powCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 双曲曲线

三条双曲曲线同样接收可选的 `mode`，默认 `CurveMode.EaseIn`。`k` 是比例参数。

### 双曲余弦曲线 cosh(k = 2, mode?)

`k` 默认 `2`；`mode` 可选，默认 `CurveMode.EaseIn`：

$$
f(x) = \frac{\cosh(xk) - 1}{\cosh(k) - 1},\quad x\in[0,1]
$$

<ClientOnly>
  <RenderDemo :loader="coshCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 双曲正切曲线 tanh(k = 2, mode?)

`k` 默认 `2`；`mode` 可选，默认 `CurveMode.EaseIn`：

$$
f(x) = 1 + \frac{\tanh((x - 1)k)}{\tanh(k)},\quad x\in[0,1]
$$

<ClientOnly>
  <RenderDemo :loader="tanhCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 双曲正割曲线 sech(k = 1, mode?)

`k` 默认 `1`；`mode` 可选，默认 `CurveMode.EaseIn`：

$$
f(x) = \frac{1 - \operatorname{sech}(xk)}{1 - \operatorname{sech}(k)},\quad x\in[0,1]
$$

<ClientOnly>
  <RenderDemo :loader="sechCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 曲线运算

现成曲线不够用时，不必从零写函数：先拿两条曲线做逐点运算，就能拼出叠加、衰减或复合后的形状。这一组函数把两条曲线逐点做运算，返回一条新曲线。下面的实时图里，蓝色与黄色是两条来源曲线，绿色是结果；纵轴按来源与结果的实际输出自适应，超出 `0` 到 `1` 的结果也会完整画出，函数本身不裁剪。

| 函数                       | 结果                       |
| -------------------------- | -------------------------- |
| `addCurve(curve1, curve2)` | $h(x) = f(x) + g(x)$       |
| `subCurve(curve1, curve2)` | $h(x) = f(x) - g(x)$       |
| `mulCurve(curve1, curve2)` | $h(x) = f(x) \cdot g(x)$   |
| `divCurve(curve1, curve2)` | $h(x) = \frac{f(x)}{g(x)}$ |
| `powCurve(curve1, curve2)` | $h(x) = f(x)^{g(x)}$       |
| `compositeCurve(c1, c2)`   | $h(x) = c_1(c_2(x))$       |

`compositeCurve` 是函数复合，`curve1` 是外层、`curve2` 是内层。其余五个函数都按同一进度逐点取值。

```ts
import { addCurve, constant, mulCurve, sin } from '@motajs/animate';

// 在正弦曲线上叠加一个固定偏移，再整体放大
const lifted = addCurve(sin(), constant(0.2));
const doubled = mulCurve(lifted, constant(2));
```

### 相加 addCurve

两条来源曲线逐点相加。结果可能超过 `1`，图中会按实际范围完整显示。

<ClientOnly>
  <RenderDemo :loader="addCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 相减 subCurve

第一条曲线减第二条曲线。结果可能低于 `0`，图中同样按实际范围完整显示。

<ClientOnly>
  <RenderDemo :loader="subCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 相乘 mulCurve

两条来源曲线逐点相乘。两条来源都落在 `0` 到 `1` 时，结果也落在 `0` 到 `1`。

<ClientOnly>
  <RenderDemo :loader="mulCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 相除 divCurve

第一条曲线除以第二条曲线。分母必须避开 `0`，示例用常数 `0.5` 作分母；结果超过 `1` 时按实际范围完整显示。

<ClientOnly>
  <RenderDemo :loader="divCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 取幂 powCurve

第一条曲线作底数，第二条曲线作指数。底数保持非负时结果才有实数意义；示例用 `linear()` 作底、常数 `2` 作指数。

<ClientOnly>
  <RenderDemo :loader="powCalcLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 复合 compositeCurve

`compositeCurve(curve1, curve2)` 让外层 `curve1` 接收内层 `curve2` 的输出。示例的外层是 `sin()`，内层是 `pow(2)`。

<ClientOnly>
  <RenderDemo :loader="compositeCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 曲线变换

想保留曲线的基本形状，只把它整体抬高、翻转或压扁时，用这些变换，比重新写一条曲线省事。这一组函数改变一条曲线的整体位置、方向或尺度。下面的实时图按来源与结果的实际输出自适应纵轴范围，不裁剪曲线：

| 函数                                | 结果                        |
| ----------------------------------- | --------------------------- |
| `moveCurve(curve, move = 0)`        | $g(x) = f(x) + move$        |
| `oppositeCurve(curve, move = 0)`    | $g(x) = move - f(x)$        |
| `scaleCurve(curve, scale = 1)`      | $g(x) = f(x) \cdot scale$   |
| `reciprocalCurve(curve, scale = 1)` | $g(x) = \frac{scale}{f(x)}$ |

此外，`normalize(curve)` 把曲线两端的值对齐到 `0` 与 `1`：

$$
g(x) =
\begin{cases}
\dfrac{f(x) - f(1)}{f(0) - f(1)}, & f(0) > f(1),\\[6pt]
\dfrac{f(x) - f(0)}{f(1) - f(0)}, & f(0) < f(1),\\[6pt]
f(x), & f(0) = f(1).
\end{cases}
$$

它只读 `curve(0)` 与 `curve(1)` 来选择参考端点，假定曲线单调，但不会检查或拒绝非单调曲线。非单调曲线仍按这两个端点归一化，中间取值可能落在 `[0, 1]` 之外；两端相等时原样返回。

### 平移 moveCurve

给来源曲线加一个纵向偏移。结果超过 `1` 时按实际范围完整显示。

<ClientOnly>
  <RenderDemo :loader="moveCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 取反 oppositeCurve

以 `move` 为基准翻转来源曲线。`move` 为 `1` 时得到上下翻转、重新落回 `0` 到 `1` 的曲线。

<ClientOnly>
  <RenderDemo :loader="oppositeCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 缩放 scaleCurve

纵向缩放来源曲线。`scale` 小于 `1` 时整体压低，结果仍在 `0` 到 `1`。

<ClientOnly>
  <RenderDemo :loader="scaleCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 倒数 reciprocalCurve

先取来源曲线的倒数，再乘缩放。来源取值在 `0.5` 到 `1`，避开分母过零；结果落在 `0.5` 到 `1`。

<ClientOnly>
  <RenderDemo :loader="reciprocalCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 归一化 normalize

来源取 `0.2` 到 `0.8`，归一化后两端对齐到 `0` 与 `1`。它只用两端值决定方向，假定曲线单调，不会拒绝非单调曲线。

<ClientOnly>
  <RenderDemo :loader="normalizeLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 曲线拼接

一段动画如果前半段和后半段要用不同节奏，单条曲线表达不了；`sequenceCurve` 能把几条现成曲线按时间比例接起来。`sequenceCurve(seq, duration, scale, move)` 把多条曲线按顺序拼成一条：

- `seq`：曲线数组，按顺序执行。
- `duration`：每段占用的时间比例，范围在 `0` 到 `1` 之间；各段之和通常应设为 `1`。
- `scale`：每段输出在拼接时的缩放比例。
- `move`：每段输出在拼接时的纵向偏移。

```ts
import { linear, sequenceCurve, sin } from '@motajs/animate';

// 参数依次是曲线序列、每段时长占比、每段缩放与每段偏移
const curve = sequenceCurve([linear(), sin()], [0.5, 0.5], [1, 1], [0, 0]);
```

来源段各自都是完整的 `0` 到 `1` 形状，结果按 `duration` 分配的时间段依次取用。进度正好为 `0` 时，拼接结果取第一段曲线在 `0` 处的输出；第一段从 `0` 起步时，起点看起来仍是 `0`。下面的实时图把两条来源段都画成完整曲线，绿色结果是两段各占一半时长的拼接结果。

<ClientOnly>
  <RenderDemo :loader="sequenceCurveLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

序列过长（超过约 100 段）可能影响性能；需要很多段时，先确认是否可以用公式直接表达。`duration` 之和不为 `1` 时的具体行为不在本篇的保证范围内，需要拼接时按总和 `1` 分配。

## 多维曲线

当一条曲线要同时给出多个分量（例如路径上的横纵坐标），或想把几组一维曲线当成一个整体传递时，就需要多维曲线。多维曲线本质是参数方程：同一个时间完成度同时输出多个值。相关类型有 `ExcitationCurve2D`、`ExcitationCurve3D` 与 `GeneralExcitationCurve`。

拆分把一条多维曲线变成多条一维曲线：

| 函数                  | 结果                       |
| --------------------- | -------------------------- |
| `splitCurve2D(curve)` | $[c_1(x), c_2(x)]$         |
| `splitCurve3D(curve)` | $[c_1(x), c_2(x), c_3(x)]$ |
| `splitCurve(curve)`   | 按维数拆成一维曲线数组     |

合并把多条一维曲线组成一条多维曲线：

| 函数                                   | 结果                                 |
| -------------------------------------- | ------------------------------------ |
| `stackCurve2D(curve1, curve2)`         | $x \mapsto [c_1(x), c_2(x)]$         |
| `stackCurve3D(curve1, curve2, curve3)` | $x \mapsto [c_1(x), c_2(x), c_3(x)]$ |
| `stackCurve(curves)`                   | 任意维数的曲线；维数取数组长度       |

```ts
import {
    linear,
    sin,
    splitCurve,
    splitCurve2D,
    stackCurve2D
} from '@motajs/animate';

// 把一条二维曲线拆成两条一维曲线，再重新合成另一条二维曲线
const [x, y] = splitCurve2D(stackCurve2D(linear(), sin()));
const [backX, backY] = splitCurve(stackCurve2D(x, y));
console.log(backX(0.5), backY(0.5));
```

多维曲线是参数曲线：同一个时间完成度同时给出多个分量，不是一个输入对应一个输出，所以不能画成单张「时间为横轴、单个取值为纵轴」的曲线图。`splitCurve3D` 与 `stackCurve3D` 只是多一维、多一列，`splitCurve` 与 `stackCurve` 则按任意维数处理。

## 边界与注意

- 输出不受 `0` 到 `1` 限制；不要为了「看起来正常」而把结果夹到区间内，否则过冲与回弹会失效。
- `normalize` 只用两端值决定方向，假定曲线单调，但不会检查或拒绝非单调曲线；非单调曲线归一化后，中间取值可能超出 `[0, 1]`。
- `divCurve` 与 `reciprocalCurve` 在分母为 `0` 的位置会产生 `Infinity` 或 `NaN`，组合时要确认除数不会过零。
- `sequenceCurve` 的各段 `duration` 之和通常应设为 `1`；不要依赖总和不为 `1` 时的具体行为。
- `sequenceCurve` 在进度 `0` 处取第一段曲线在 `0` 处的输出；第一段从 `0` 起步时，起点仍是 `0`，否则结果从第一段的起点值开始。
- 曲线函数应当是纯函数；不要在曲线里读写外部状态，它会在每一帧被反复调用。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const linearCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-linear.tsx');
const stepCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-step.tsx');
const constantCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-constant.tsx');
const sinCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-sin.tsx');
const tanCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-tan.tsx');
const secCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-sec.tsx');
const powCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-pow.tsx');
const coshCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-cosh.tsx');
const tanhCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-tanh.tsx');
const sechCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-sech.tsx');
const addCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-add.tsx');
const subCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-sub.tsx');
const mulCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-mul.tsx');
const divCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-div.tsx');
const powCalcLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-pow.tsx');
const compositeCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-composite.tsx');
const moveCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-move.tsx');
const oppositeCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-opposite.tsx');
const scaleCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-scale.tsx');
const reciprocalCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-reciprocal.tsx');
const normalizeLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-normalize.tsx');
const sequenceCurveLoader = () =>
    import('../../.vitepress/components/demos/ui/animation-curve-calc-sequence.tsx');
</script>
