# 内置组件：基础

`@user/client-base` 里已经有一批常用的基础组件。它们和普通组件一样，在 TSX 里按名字使用，属性名写成 camelCase。下面每个组件都先说它解决什么问题，再给最小写法，常用参数跟着讲，最后接一个 live。

## 前置知识

阅读本篇前，建议先读完：

- [什么是组件](./what-is-component.md)

## Input

要接收用户文字输入，用 `Input`。

第一步：用 `v-model:value` 绑定一个字符串拿到输入内容，`loc` 给位置与大小，宽度决定输入区的宽度。

```tsx
import { ref } from 'vue';
import { Input } from '@user/client-base';

// setup
const name = ref('');

// 组件内容
<Input loc={[40, 56, 240, 32]} v-model:value={name.value} />;
```

输入框还没有内容时，想给一句提示，加 `placeholder`：

```tsx
<Input
    loc={[40, 56, 240, 32]}
    v-model:value={name.value}
    placeholder="输入名字"
/>
```

需要多行编辑就加 `multiline`，这时输入框允许换行，高度由 `loc` 的第四项决定：

```tsx
const note = ref('');

<Input
    loc={[40, 104, 320, 80]}
    v-model:value={note.value}
    multiline
    placeholder="多行备注"
/>;
```

常用参数都在 `loc` 与外观上：`loc` 给位置和大小，宽度决定输入区宽度；`placeholder` 是空内容时的提示；`border` 是边框颜色，默认 `'#ddd'`；`borderWidth` 是边框宽度，默认 `1`；`circle` 是边框圆角，写法与 `g-rectr` 一致，例如 `[4]`；`pad` 是文字与边框之间的内边距，默认 `4`。

`value` 就是 `v-model:value` 绑定的那个值。想知道每次输入的内容加 `onInput`，想只在确认时取值加 `onChange`，两者都收到当前字符串。

全部参数：

| 属性          | 作用                                     | 默认或常用值 |
| ------------- | ---------------------------------------- | ------------ |
| `loc`         | 位置与大小，宽度决定输入区宽度           | 必填         |
| `value`       | 输入内容，配合 `v-model:value` 双向绑定  | `''`         |
| `placeholder` | 空内容时的提示文字                       | 无           |
| `multiline`   | 多行输入，高度由 `loc` 的第四项决定      | `false`      |
| `border`      | 边框颜色                                 | `'#ddd'`     |
| `borderWidth` | 边框宽度                                 | `1`          |
| `circle`      | 边框圆角，写法同 `g-rectr`               | 无           |
| `pad`         | 文字与边框之间的内边距                   | `4`          |
| `font`        | 输入文字的字体，排版参数同 `TextContent` | 默认字体     |
| `fillStyle`   | 文字颜色                                 | 白色         |
| `onInput`     | 每次输入都触发，收到当前字符串           | 无           |
| `onChange`    | 确认输入时触发，收到当前字符串           | 无           |

<ClientOnly>
  <RenderDemo :loader="inputLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

单行占位、填入内容与多行输入三种状态。

## Icons

要显示现成的图标，直接导入图标组件，按名字用，不用自己画。

每个图标只接受 `loc`：前两项是位置，后两项是宽高。

| 属性  | 作用             | 默认或常用值 |
| ----- | ---------------- | ------------ |
| `loc` | 图标的位置与大小 | 必填         |

```tsx
import { PlayIcon, PauseIcon, RollbackIcon } from '@user/client-base';

// 组件内容
<container loc={FULL_LOC}>
    <PlayIcon loc={[40, 40, 32, 32]} />
    <PauseIcon loc={[88, 40, 32, 32]} />
    <RollbackIcon loc={[136, 40, 32, 32]} />
</container>;
```

内置图标共 17 个，都从 `@user/client-base` 导入：

`RollbackIcon`、`RetweetIcon`、`ViewMapIcon`、`DanmakuIcon`、`ReplayIcon`、
`NumpadIcon`、`PlayIcon`、`PauseIcon`、`DoubleArrow`、`StepForward`、
`SoundVolume`、`Fullscreen`、`ExitFullscreen`、`ArrowLeftTailless`、
`ArrowRightTailless`、`ArrowUpTailless`、`ArrowDownTailless`。

图标内部的线条样式不在组件参数里展开，需要改的时候按 API 列表里的参数查找。

<ClientOnly>
  <RenderDemo :loader="iconsLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

九个图标按 `loc` 排在网格里，名字写在图标下方。

## Arrow

要画一条带箭头的线，用 `Arrow`。

`arrow` 依次是起点 `x1`、`y1` 和终点 `x2`、`y2`；不用写 `loc`，位置由两端决定。

```tsx
import { Arrow } from '@user/client-base';

// 组件内容
<Arrow arrow={[40, 40, 400, 120]} />;
```

箭头头部想大一点，改 `head`，默认 `8`：

```tsx
<Arrow arrow={[40, 40, 400, 120]} head={18} />
```

想改线条和箭头的颜色，加 `color`：

```tsx
<Arrow arrow={[40, 40, 400, 120]} head={18} color="#f2b84b" />
```

| 属性    | 作用                                      | 默认或常用值 |
| ------- | ----------------------------------------- | ------------ |
| `arrow` | 起点与终点，依次是 `x1`、`y1`、`x2`、`y2` | 必填         |
| `head`  | 箭头头部的大小                            | `8`          |
| `color` | 线条与箭头的颜色                          | 描边默认色   |

<ClientOnly>
  <RenderDemo :loader="arrowLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

三条箭头分别把 `head` 改成 `8`、`18`、`30`，颜色也各不相同。

## Selection

要画一个选中框，用 `Selection`。

`Selection` 只负责画框，不处理点击；点击和选中状态放在外层容器上自己维护。

```tsx
import { ref } from 'vue';
import { Selection } from '@user/client-base';

// setup
const selected = ref(0);

// 组件内容
<container loc={[40, 40, 220, 32]} onClick={() => (selected.value = 1)}>
    <Selection loc={[0, 0, 220, 32]} color="#2f6fed" border="#7aa2ff" />
    <text loc={[12, 8]} text="被选中的项" fillStyle="#ffffff" />
</container>;
```

`loc` 是框的位置与大小，通常和外层容器一样大；`color` 是框内填充色，`border` 是边框颜色。框会自己闪烁，想改闪烁的深浅用 `alphaRange`，先低后高，默认 `[0.25, 0.55]`。

```tsx
<Selection
    loc={[0, 0, 220, 32]}
    color="#2f6fed"
    border="#7aa2ff"
    alphaRange={[0.4, 0.8]}
/>
```

需要现成的选中素材时，改用 `winskin`，不再写颜色。

| 属性         | 作用                         | 默认或常用值   |
| ------------ | ---------------------------- | -------------- |
| `loc`        | 框的位置与大小               | 必填           |
| `color`      | 框内填充色                   | 无             |
| `border`     | 边框颜色                     | 无             |
| `winskin`    | 换成现成的选中素材           | 无             |
| `alphaRange` | 闪烁的不透明度范围，先低后高 | `[0.25, 0.55]` |

<ClientOnly>
  <RenderDemo :loader="selectionLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

两组 `color` 与 `border` 画出的选中框，第二组用 `alphaRange` 调大了闪烁深浅，最后一行没有选中框。

## Progress

要显示进度，用 `Progress`。

`loc` 前两项是位置，第三项是进度条长度；`progress` 是完成比例，`0` 是空、`1` 是满。

```tsx
import { ref } from 'vue';
import { Progress } from '@user/client-base';

// setup
const progress = ref(0.6);

// 组件内容
<Progress loc={[40, 40, 300, 10]} progress={progress.value} />;
```

默认已完成部分是绿色、未完成部分是灰色；想换颜色，用 `success` 给已完成部分、`background` 给未完成部分：

```tsx
<Progress
    loc={[40, 40, 300, 10]}
    progress={progress.value}
    success="#7ee787"
    background="#26364d"
/>
```

| 属性         | 作用                         | 默认或常用值 |
| ------------ | ---------------------------- | ------------ |
| `loc`        | 进度条的位置与宽度           | 必填         |
| `progress`   | 完成比例，`0` 是空，`1` 是满 | 必填         |
| `success`    | 已完成部分的颜色             | `green`      |
| `background` | 未完成部分的颜色             | `gray`       |
| `lineWidth`  | 线条宽度                     | `2`          |

<ClientOnly>
  <RenderDemo :loader="progressLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

`progress` 分别取 `0.3`、`0.6` 与 `1`。

## Background

要画一块背景框，用 `Background`。

`loc` 给位置与大小，`color` 是填充色，`border` 是边框颜色。

```tsx
import { Background } from '@user/client-base';

// 组件内容
<Background loc={[24, 24, 432, 272]} color="#1d2b45" border="#3a5a8c" />;
```

想用现成的背景素材，就只写 `winskin`，不再写 `color` / `border`：给了 `winskin` 就画素材，否则按颜色画圆角矩形。

```tsx
<Background loc={[24, 24, 432, 272]} winskin="winskin.png" />
```

| 属性      | 作用               | 默认或常用值 |
| --------- | ------------------ | ------------ |
| `loc`     | 背景的位置与大小   | 必填         |
| `color`   | 填充色             | 无           |
| `border`  | 边框颜色           | 无           |
| `winskin` | 换成现成的背景素材 | 无           |

<ClientOnly>
  <RenderDemo :loader="backgroundLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

同一块背景换两组 `color` 与 `border`。

## Slider

要让用户拖拽调数值，用 `Slider`。

`loc` 给位置与大小，`value` 是当前值；拖动时用 `v-model:value` 双向绑定。

```tsx
import { ref } from 'vue';
import { Slider } from '@user/client-base';

// setup
const volume = ref(40);

// 组件内容
<Slider loc={[40, 80, 240, 24]} v-model:value={volume.value} />;
```

`min` / `max` 给范围，`step` 给每次变化的最小差值：

```tsx
<Slider
    loc={[40, 80, 240, 24]}
    v-model:value={volume.value}
    min={0}
    max={100}
    step={5}
/>
```

右侧默认显示当前值；不想显示就写 `showValue={false}`：

```tsx
<Slider
    loc={[40, 80, 240, 24]}
    v-model:value={volume.value}
    min={0}
    max={100}
    step={5}
    showValue={false}
/>
```

移动端拖动滑动条不方便，建议在它旁边再放两个按钮，分别增减数值：

```tsx
const decrease = () => (volume.value = Math.max(0, volume.value - 5));
const increase = () => (volume.value = Math.min(100, volume.value + 5));

// 组件内容
<container loc={FULL_LOC}>
    <Slider
        loc={[40, 80, 240, 24]}
        v-model:value={volume.value}
        min={0}
        max={100}
        step={5}
    />
    <container loc={[40, 120, 64, 28]} onClick={decrease}>
        <g-rectr loc={[0, 0, 64, 28]} circle={[4]} fillStyle="#2f6fed" />
        <text loc={[32, 14]} anc={[0.5, 0.5]} text="-" fillStyle="#ffffff" />
    </container>
    <container loc={[116, 120, 64, 28]} onClick={increase}>
        <g-rectr loc={[0, 0, 64, 28]} circle={[4]} fillStyle="#3a2f5f" />
        <text loc={[32, 14]} anc={[0.5, 0.5]} text="+" fillStyle="#ffffff" />
    </container>
</container>;
```

全部参数：

| 属性          | 作用                                  | 默认或常用值    |
| ------------- | ------------------------------------- | --------------- |
| `loc`         | 位置与大小                            | 必填            |
| `value`       | 当前值，配合 `v-model:value` 双向绑定 | `min`           |
| `min`         | 最小值                                | `0`             |
| `max`         | 最大值                                | `0`             |
| `step`        | 每次变化的最小差值                    | `1`             |
| `showValue`   | 右侧是否显示当前值                    | `true`          |
| `valueWidth`  | 右侧数值区域的宽度                    | `40`            |
| `font`        | 右侧数值的字体                        | `12` 号默认字体 |
| `lineWidth`   | 滑动条的线宽                          | `2`             |
| `padding`     | 线两端距容器边缘的距离                | `4`             |
| `filledStyle` | 控制点左侧（已选部分）的颜色          | `'#0ff'`        |
| `emptyStyle`  | 控制点右侧（未选部分）与描边的颜色    | `'#888'`        |
| `radius`      | 控制点的半径                          | `4`             |

<ClientOnly>
  <RenderDemo :loader="sliderLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

拖动滑动条或点两侧按钮，右侧数值会跟着变。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const inputLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-input-demo.tsx');
const iconsLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-icons-demo.tsx');
const arrowLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-arrow-demo.tsx');
const selectionLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-selection-demo.tsx');
const progressLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-progress-demo.tsx');
const backgroundLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-background-demo.tsx');
const sliderLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-slider-demo.tsx');
</script>
