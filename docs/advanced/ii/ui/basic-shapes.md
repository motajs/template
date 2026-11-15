# 基础图形

上一篇[《容器与坐标》](./container-and-coordinates.md)讲的是怎么把元素摆到位置上：坐标从哪里来、`loc` 与锚点怎么配合、容器嵌套后子元素怎么算。位置有了，这一篇开始画东西。界面里的图形元素一共八种：矩形 `g-rect`、圆 `g-circle`、椭圆 `g-ellipse`、直线 `g-line`、三次贝塞尔 `g-bezier`、二次贝塞尔 `g-quad`、路径 `g-path` 和圆角矩形 `g-rectr`。

在逐个看图形之前，先弄清所有图形共用的填充、描边与颜色规则，后面每种图形的用法都建立在这套规则上。每种图形都有一个用数组传参的简写，日常写 UI 用简写最省事；逐个属性写的普通写法只在需要拆分或复用单个值时再用，下面每节只提一句。每种图形配一个 live，最后再把八种放在一起。

## 通用规则：填充、描边与颜色

图形有两种绘制模式：填充和描边。`fill`、`stroke`、`strokeAndFill` 是模式开关，值都是布尔值，不是颜色；颜色分别写在 `fillStyle` 与 `strokeStyle` 里。写 `fill="#f00"` 不会把图形变成红色，要写 `fill fillStyle="#f00"`；默认填充的图形本来就不用写 `fill`。

每种图形有自己的默认模式：

| 图形                                                       | 默认模式 |
| ---------------------------------------------------------- | -------- |
| `g-rect` / `g-circle` / `g-ellipse` / `g-rectr` / `g-path` | 填充     |
| `g-line` / `g-bezier` / `g-quad`                           | 描边     |

默认填充的图形只写 `fillStyle`；默认描边的图形只写 `strokeStyle`。需要同时填充和描边时，写 `fill` 与 `stroke`：渲染时先填充、后描边，所以**描边会覆盖 fill**，边框完整地画在填充之上。`strokeAndFill` 是另一套顺序——先描边、后填充，**fill 会覆盖描边**，描边的内半边被填充盖住，边框看起来更细；`strokeAndFill` 优先级最高，写它会忽略 `fill` 与 `stroke`。

这里有个容易踩的地方：默认填充的图形只要写了 `stroke`、又没写过 `fill`，模式就会切换成只描边，原来的填充不再生效。也就是说，默认填充只在「没写 `stroke`、也没写 `strokeAndFill`」时成立。想同时填充和描边，必须显式写 `fill` + `stroke`，或者直接用 `strokeAndFill`。

```tsx
// 默认填充的矩形只写 stroke：只画边框，不填充
<g-rect loc={[40, 40, 160, 100]} stroke strokeStyle="#58c4dd" lineWidth={4} />

// 想同时填充和描边：必须显式写 fill + stroke
<g-rect
    loc={[240, 40, 160, 100]}
    fill
    stroke
    fillStyle="#2f6fed"
    strokeStyle="#e8f0ff"
    lineWidth={4}
/>
```

这四种模式放在一起对照：

```tsx
// 默认填充：颜色用 fillStyle
<g-rect loc={[40, 40, 120, 80]} fillStyle="#2f6fed" />

// 默认描边：颜色用 strokeStyle
<g-line line={[40, 160, 200, 160]} strokeStyle="#7ee787" />

// 同时填充与描边：先填充后描边，描边盖住 fill
<g-circle
    circle={[300, 100, 50]}
    fill
    stroke
    fillStyle="#58c4dd"
    strokeStyle="#e8f0ff"
    lineWidth={4}
/>

// 先描边后填充：fill 盖住描边，strokeAndFill 优先级最高
<g-rect
    loc={[260, 180, 120, 80]}
    strokeAndFill
    fillStyle="#f2b84b"
    strokeStyle="#141a22"
    lineWidth={6}
/>
```

<ClientOnly>
  <RenderDemo :loader="modesLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

同一个矩形分别用四种模式，对照看边框和填充；重点对照 `fill` + `stroke` 与 `strokeAndFill` 的覆盖关系。

`fillRule` 只在填充路径时起作用，可选 `nonzero` 与 `evenodd`，具体在后面的路径一节展开。所有图形的默认颜色都是浅灰 `#ddd`；示例里通常显式写 `fillStyle` 或 `strokeStyle`。

### 描边细节

默认描边的图形，以及任何写了 `stroke` 的图形，都可以用下面这些属性控制描边：

| 属性             | 作用                                       | 常见值                      |
| ---------------- | ------------------------------------------ | --------------------------- |
| `lineWidth`      | 线宽，默认 `2`                             | `2` / `6` / `12`            |
| `lineDash`       | 虚线样式，数组按「实线长度、空白长度」交替 | `[18, 10]`                  |
| `lineDashOffset` | 虚线起始偏移，改变虚线从哪里开始           | `0` / `12`                  |
| `lineCap`        | 端点样式，只影响线段两端                   | `butt` / `round` / `square` |
| `lineJoin`       | 拐角样式，只影响线段连接处                 | `miter` / `round` / `bevel` |
| `miterLimit`     | 尖角限制，`miter` 拐角过长时会被截断       | 默认 `10`                   |

`lineDash` 的数组会按「画一段、空一段」交替；写 `[18, 10]` 就是画 18、空 10。超过两项时继续交替，例如 `[16, 6, 2, 6]` 是长线、空白、短线、空白，常用来画点划线。`lineDashOffset` 把整个虚线图案向后平移，可以做流动的虚线。

`lineCap` 只改变两个端点，`lineJoin` 只改变拐角，两者互不影响。`miterLimit` 只在 `lineJoin="miter"` 时有意义，尖角被拉得太长时会被切成斜角。

```tsx
<g-line
    line={[80, 80, 400, 80]}
    strokeStyle="#7ee787"
    lineWidth={6}
    lineDash={[18, 10]}
    lineDashOffset={4}
    lineCap="round"
/>

<g-path
    path={arrow}
    stroke
    strokeStyle="#58c4dd"
    lineWidth={6}
    lineJoin="miter"
    miterLimit={8}
/>
```

<ClientOnly>
  <RenderDemo :loader="strokeLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

这个 live 分四组对比：线宽、虚线、端点与拐角。

这些属性对所有描边图形通用：默认描边的直线、贝塞尔曲线能直接用，矩形、圆、椭圆、路径写了 `stroke` 之后也能用。例如给矩形加虚线描边：

```tsx
<g-rect
    loc={[40, 40, 180, 100]}
    stroke
    strokeStyle="#58c4dd"
    lineWidth={6}
    lineDash={[12, 8]}
/>
```

## 矩形 g-rect

矩形用 `loc` 简写，四个值依次是左上角 `x`、左上角 `y`、宽度、高度。矩形默认填充，颜色用 `fillStyle`。也可以把四个值拆成 `x`、`y`、`width`、`height` 分别写，效果一样。

```tsx
<g-rect loc={[80, 80, 240, 140]} fillStyle="#2f6fed" />
```

<ClientOnly>
  <RenderDemo :loader="rectLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

这个 live 里放了四组参数，分别对比 `loc` 不同时的位置与宽高。

矩形默认锚点在左上角，所以前两个值是左上角的位置。想改锚点时，可以把 `loc` 写成六个值，最后两项是 `anchorX`、`anchorY`；也可以单独写 `anchorX` / `anchorY`。例如把锚点改成 `0.5` 后，前两个值就变成矩形中心。

```tsx
// 锚点在中心：前两个值是矩形中心坐标
<g-rect loc={[240, 160, 120, 80, 0.5, 0.5]} fillStyle="#2f6fed" />
```

`g-rect` 本身没有圆角参数，需要圆角时用后面的 `g-rectr`。

## 圆 g-circle

圆用 `circle` 简写，三个值依次是圆心 `x`、圆心 `y`、半径。圆默认填充，颜色用 `fillStyle`。也可以写 `x`、`y`、`radius`，效果一样。

```tsx
<g-circle circle={[240, 170, 80]} fillStyle="#58c4dd" />
```

<ClientOnly>
  <RenderDemo :loader="circleLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

这个 live 上排放三个整圆对比半径，下排三个圆弧分别用 fill、stroke、fill+stroke 三种模式，`start` / `end` 只控制角度；标签上写的是度数，代码里按弧度写。

`circle` 还能写五个值：`[圆心 x, 圆心 y, 半径, 起始角度, 终止角度]`，这时画的是从起始角到终止角的圆弧。`start` / `end` 的单位是**弧度**，不是度数；`0` 指向右侧，角度增大沿顺时针方向。live 标签用度数只是为了好读，代码里仍要换算成弧度：

| 度数   | 弧度    |
| ------ | ------- |
| `0°`   | `0`     |
| `90°`  | `π / 2` |
| `180°` | `π`     |
| `270°` | `1.5π`  |
| `360°` | `2π`    |

圆弧也按填充 / 描边两种模式画：默认填充，`start` 与 `end` 之间的圆弧和两端连线围成的区域会被填满，颜色用 `fillStyle`；只想看弧线时写 `stroke`，颜色改用 `strokeStyle`；两者都要就同时写 `fill` 和 `stroke`，`fillStyle` 与 `strokeStyle` 分别给色。

```tsx
// 完整圆
<g-circle circle={[120, 100, 60]} fillStyle="#58c4dd" />

// 圆弧 0° → 180°：默认填充，弧与两端连线围成的区域被填满
<g-circle circle={[320, 100, 60, 0, Math.PI]} fillStyle="#58c4dd" />

// 同一个圆弧只描边：写 stroke，颜色改用 strokeStyle
<g-circle
    circle={[320, 100, 60, 0, Math.PI]}
    stroke
    strokeStyle="#58c4dd"
    lineWidth={4}
/>

// 填充与描边都要：同时写 fill 和 stroke，两种颜色分别给
<g-circle
    circle={[320, 100, 60, 0, Math.PI]}
    fill
    stroke
    fillStyle="#58c4dd"
    strokeStyle="#e8f0ff"
    lineWidth={3}
/>
```

## 椭圆 g-ellipse

椭圆用 `ellipse` 简写，四个值依次是圆心 `x`、圆心 `y`、横向半径 `rx`、纵向半径 `ry`。椭圆默认填充。也可以写 `x`、`y`、`radiusX`、`radiusY`。

```tsx
<g-ellipse ellipse={[240, 170, 130, 70]} fillStyle="#c58af9" />
```

<ClientOnly>
  <RenderDemo :loader="ellipseLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

这个 live 上排放三个整椭圆对比 `rx` / `ry`，下排三个部分椭圆分别用 fill、stroke、fill+stroke 三种模式，`start` / `end` 只控制角度；标签上写的是度数，代码里按弧度写。

`ellipse` 还能写六个值：`[圆心 x, 圆心 y, 横向半径, 纵向半径, 起始角度, 终止角度]`，用来画部分椭圆。角度规则与圆相同：`start` / `end` 用弧度，不是度数，`0` 指向右侧，角度增大沿顺时针方向；换算见上面的度数对照表。部分椭圆也按填充 / 描边两种模式画：默认填充，圆弧与两端连线围成的区域会被填满，颜色用 `fillStyle`；只想看弧线时写 `stroke`，颜色改用 `strokeStyle`；两者都要就同时写 `fill` 和 `stroke`，`fillStyle` 与 `strokeStyle` 分别给色。

```tsx
// 完整椭圆
<g-ellipse ellipse={[120, 100, 70, 40]} fillStyle="#c58af9" />

// 部分椭圆 180° → 360°：默认填充
<g-ellipse
    ellipse={[330, 100, 80, 45, Math.PI, Math.PI * 2]}
    fillStyle="#c58af9"
/>

// 同一个部分椭圆只描边：写 stroke，颜色改用 strokeStyle
<g-ellipse
    ellipse={[330, 100, 80, 45, Math.PI, Math.PI * 2]}
    stroke
    strokeStyle="#c58af9"
    lineWidth={4}
/>

// 填充与描边都要：同时写 fill 和 stroke，两种颜色分别给
<g-ellipse
    ellipse={[330, 100, 80, 45, Math.PI, Math.PI * 2]}
    fill
    stroke
    fillStyle="#c58af9"
    strokeStyle="#e8f0ff"
    lineWidth={3}
/>
```

## 直线 g-line

直线用 `line` 简写，四个值依次是两个端点 `x1`、`y1`、`x2`、`y2`。直线默认描边，`strokeStyle` 给颜色，`lineWidth` 给线宽。也可以逐个写 `x1`、`y1`、`x2`、`y2`。

```tsx
<g-line line={[80, 240, 400, 100]} strokeStyle="#7ee787" lineWidth={6} />
```

<ClientOnly>
  <RenderDemo :loader="lineLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

这个 live 里放了四组参数，分别对比端点、`lineWidth`、`lineDash` 与颜色。

直线是最简单的描边图形，描边细节一节讲的 `lineDash`、`lineDashOffset`、`lineCap` 都能直接写在 `g-line` 上。`lineCap` 只改变两个端点，虚线则从起点开始按 `lineDash` 交替。

```tsx
<g-line
    line={[80, 200, 400, 200]}
    strokeStyle="#f2b84b"
    lineWidth={10}
    lineDash={[18, 10]}
    lineCap="round"
/>
```

## 三次贝塞尔 g-bezier

三次贝塞尔用 `curve` 简写，八个值依次是起点 `sx`、`sy`，第一个控制点 `cp1x`、`cp1y`，第二个控制点 `cp2x`、`cp2y`，终点 `ex`、`ey`。曲线默认描边，`strokeStyle` 与 `lineWidth` 控制颜色和粗细。也可以逐个写这八个属性。

```tsx
<g-bezier
    curve={[80, 240, 140, 70, 340, 250, 400, 100]}
    strokeStyle="#f2b84b"
    lineWidth={4}
/>
```

<ClientOnly>
  <RenderDemo :loader="bezierLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

这个 live 里放了四组曲线，分别对比控制点靠近、拉远、交叉与 S 形；白点是控制点，虚线是起点 → `cp1` → `cp2` → 终点的控制多边形。

起点与终点决定曲线两端，两个控制点决定中间的弯曲：第一个控制点主要拉住起点附近的走向，第二个控制点主要拉住终点附近的走向。控制点离端点越远，曲线被拉得越开；两个控制点分居曲线两侧时会出现 S 形。

## 二次贝塞尔 g-quad

二次贝塞尔用 `curve` 简写，六个值依次是起点 `sx`、`sy`，控制点 `cpx`、`cpy`，终点 `ex`、`ey`。曲线默认描边。也可以逐个写这六个属性。

```tsx
<g-quad
    curve={[90, 230, 240, 80, 390, 230]}
    strokeStyle="#58c4dd"
    lineWidth={4}
/>
```

<ClientOnly>
  <RenderDemo :loader="quadLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

这个 live 里放了四组曲线，分别对比控制点在上、下、左、右；白点是控制点，虚线是起点 → 控制点 → 终点的控制多边形。

二次曲线只有一个控制点，它同时影响起点与终点两侧的走向，曲线在控制点方向达到最大弯曲。控制点离两个端点越远，弧线越鼓；做简单的弧线或装饰够用。

## 路径 g-path

路径用 `path` 属性，值是一个 `Path2D`。`Path2D` 是浏览器自带的全局构造器，直接 `new Path2D()` 即可，不需要 import。路径默认填充；只想画线时写 `stroke`。路径坐标相对元素自身，元素默认在父容器的原点，所以不写 `x` / `y` 时，坐标看起来就是从父容器原点开始。

```tsx
// Path2D 是浏览器全局对象，直接 new
const badge = new Path2D();
badge.moveTo(240, 80);
badge.lineTo(340, 140);
badge.lineTo(315, 255);
badge.lineTo(165, 255);
badge.lineTo(140, 140);
badge.closePath();

// 默认填充：给颜色即可
<g-path path={badge} fillStyle="#7ee787" />;

// 只想画轮廓：写 stroke
<g-path path={badge} stroke strokeStyle="#7ee787" lineWidth={3} />;

// 自交或多段重叠时，用 fillRule 指定填充规则
<g-path path={badge} fillStyle="#7ee787" fillRule="evenodd" />;
```

<ClientOnly>
  <RenderDemo :loader="pathLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

这个 live 里放了三个路径，分别对比折线、闭合填充与圆弧。

`moveTo` 决定从哪里开始，`lineTo` 连到下一个点，`closePath` 把最后一点连回起点。路径可以有多段；`arc` 画圆弧，`bezierCurveTo` 画三次贝塞尔。开放路径通常写 `stroke`，闭合路径适合填充；有自交或多段重叠时，用 `fillRule` 决定哪些区域算内部：`nonzero` 按环绕方向，`evenodd` 按奇偶，默认是 `nonzero`。

同一个 `Path2D` 可以交给多个 `g-path` 复用；但 `Path2D` 不能序列化，不能直接放进存档。需要保存路径时，保存构造它用到的点或参数，读档后重新构造。

## 圆角矩形 g-rectr

圆角矩形用 `g-rectr`。`g-rect` 没有圆角参数，需要圆角时换用 `g-rectr`。圆角用 `circle` 或 `ellipse` 简写：`circle` 给圆形圆角，`ellipse` 给椭圆圆角。

`circle` 可以写 1 到 4 项，按项数决定每个角用哪个半径：

- 1 项 `[r1]`：四个角都用 `r1`。
- 2 项 `[r1, r2]`：左上、右下用 `r1`，右上、左下用 `r2`。
- 3 项 `[r1, r2, r3]`：左上用 `r1`，右上和左下用 `r2`，右下用 `r3`。
- 4 项 `[r1, r2, r3, r4]`：依次对应左上、右上、右下、左下。

`ellipse` 每两个值为一组（横向半径、纵向半径），按组数决定每个角用哪一组：

- 2 项 `[rx1, ry1]`：四个角都用这一组。
- 4 项 `[rx1, ry1, rx2, ry2]`：左上、右下用第 1 组，右上、左下用第 2 组。
- 6 项 `[rx1, ry1, rx2, ry2, rx3, ry3]`：左上用第 1 组，右上和左下用第 2 组，右下用第 3 组。
- 8 项 `[rx1, ry1, rx2, ry2, rx3, ry3, rx4, ry4]`：依次对应左上、右上、右下、左下，每组两个值。

只想让某几个角是圆角时，把不需要的角写成 0。

```tsx
// 四个角同样圆
<g-rectr loc={[30, 70, 120, 90]} circle={[24]} fillStyle="#2f6fed" />

// 依次左上、右上、右下、左下
<g-rectr
    loc={[180, 70, 120, 90]}
    circle={[36, 0, 36, 0]}
    fillStyle="#58c4dd"
/>

// 椭圆圆角：横向与纵向半径不同
<g-rectr
    loc={[330, 70, 120, 90]}
    ellipse={[48, 24]}
    fillStyle="#c58af9"
/>
```

<ClientOnly>
  <RenderDemo :loader="rectrLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

这个 live 里放了四组圆角参数，分别对比一项半径、四项半径、椭圆圆角与大半径。

圆角矩形默认填充；圆角半径超过宽高一半时会被限制在宽高的一半以内，不会画到矩形外面。

## 所有图形的组合

把八种图形放进同一个标准 `container`，用 `FULL_LOC` 铺满整块 UI。下面是一段完整 TSX；路径先构造一次 `Path2D`，再交给 `g-path`。

```tsx
const badge = new Path2D();
badge.moveTo(300, 205);
badge.lineTo(345, 230);
badge.lineTo(333, 280);
badge.lineTo(267, 280);
badge.lineTo(255, 230);
badge.closePath();

<container loc={FULL_LOC}>
    <g-rect loc={FULL_LOC} fillStyle="#141a22" />
    <text loc={[24, 14]} text="八种图形" fillStyle="#e8f0ff" />

    {/* 上排：矩形、圆、椭圆、直线 */}
    <g-rect loc={[20, 72, 80, 62]} fillStyle="#2f6fed" />
    <g-circle circle={[180, 103, 34]} fillStyle="#58c4dd" />
    <g-ellipse ellipse={[300, 103, 50, 32]} fillStyle="#c58af9" />
    <g-line line={[370, 133, 460, 75]} strokeStyle="#7ee787" lineWidth={4} />

    {/* 下排：三次贝塞尔、二次贝塞尔、路径、圆角矩形 */}
    <g-bezier
        curve={[20, 275, 45, 205, 80, 280, 105, 212]}
        strokeStyle="#f2b84b"
        lineWidth={4}
    />
    <g-quad
        curve={[140, 270, 180, 205, 220, 270]}
        strokeStyle="#58c4dd"
        lineWidth={4}
    />
    <g-path path={badge} fillStyle="#7ee787" />
    <g-rectr loc={[370, 215, 80, 62]} circle={[24]} fillStyle="#f2b84b" />

    {/* 每个图形的短标签 */}
    <text loc={[44, 146]} text="矩形" fillStyle="#cfe0ff" />
    <text loc={[170, 146]} text="圆" fillStyle="#cfe0ff" />
    <text loc={[285, 146]} text="椭圆" fillStyle="#cfe0ff" />
    <text loc={[405, 146]} text="直线" fillStyle="#cfe0ff" />
    <text loc={[20, 292]} text="三次贝塞尔" fillStyle="#cfe0ff" />
    <text loc={[140, 292]} text="二次贝塞尔" fillStyle="#cfe0ff" />
    <text loc={[290, 292]} text="路径" fillStyle="#cfe0ff" />
    <text loc={[380, 292]} text="圆角矩形" fillStyle="#cfe0ff" />
</container>;
```

<ClientOnly>
  <RenderDemo :loader="allLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

这段代码里每种图形只出现一次，位置按 4×2 排开；换成自己的布局时，改各自的 `loc`、圆心或端点即可。

<script setup>
import RenderDemo from '../../../.vitepress/components/renderDemo.vue';

const modesLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-modes.tsx');
const strokeLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-stroke.tsx');
const rectLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-rect.tsx');
const circleLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-circle.tsx');
const ellipseLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-ellipse.tsx');
const lineLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-line.tsx');
const bezierLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-bezier.tsx');
const quadLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-quad.tsx');
const pathLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-path.tsx');
const rectrLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-rectr.tsx');
const allLoader = () =>
    import('../../../.vitepress/components/demos/ui/shapes-all.tsx');
</script>

## 默认值与注意

- 圆与椭圆的默认锚点是 `0.5`，`x` / `y` 指圆心；矩形与容器的默认锚点是 `0`，`x` / `y` 指左上角。
- `curve` 数组长度写错不会报错，只会画出错误形状：三次贝塞尔要 8 个值，二次贝塞尔要 6 个值。
- `lineDash` 建议写偶数项；写奇数项时浏览器会自动复制一份再交替，容易看不出规律。
- 默认填充只在没写 `stroke` 时生效：给默认填充的图形加 `stroke` 会变成只描边，要同时填充和描边就显式写 `fill` + `stroke`。

下一篇[《文字》](./text.md)讲怎么在图形旁边写字：内容、字体、颜色与简单排版。
