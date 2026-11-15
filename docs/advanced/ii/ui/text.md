# 文字

文字元素只画一行。它的宽高由字体测量结果决定，不能自动换行，也没有行高与对齐属性；字号、字重、斜体这些信息由 `Font` 描述，`<text>` 负责把内容画出来。这一篇先讲 `Font`，再讲文字元素怎么用、尺寸与锚点怎么定。

## 字体：Font

`Font` 是描述字体的值对象，不负责绘制。它只有五项配置：

| 属性       | 默认值      | 说明                                           |
| ---------- | ----------- | ---------------------------------------------- |
| `family`   | `'Verdana'` | 字体族名称                                     |
| `size`     | `16`        | 字号数值                                       |
| `sizeUnit` | `'px'`      | 字号单位，通常用 `px`                          |
| `weight`   | `400`       | 字重，`0`–`1000`，可写数字或 `FontWeight` 枚举 |
| `italic`   | `false`     | 是否斜体                                       |

`weight` 除了直接写数字，也可以用 `FontWeight` 枚举。`FontWeight` 从 `@motajs/render` 导入，提供三个常用档位：`FontWeight.Light = 300`、`FontWeight.Normal = 400`、`FontWeight.Bold = 700`。枚举值本身就是数字，两种写法等价。

构造函数按位置传参：`Font(family, size, sizeUnit, weight, italic)`。省略的项用上面的默认值。例如在 TSX 里直接内联：

```tsx
// 24px 粗体：字重可以用 FontWeight 枚举，也可以直接写数字
<text
    text="标题"
    font={new Font('Verdana', 24, 'px', FontWeight.Bold)}
    fillStyle="#ffffff"
/>
```

`Font` 与 `FontWeight` 都从 `@motajs/render` 导入。`font` 只接受 `Font` 实例，不接收 CSS 字符串；不写 `font` 时使用默认 `Font`，也就是 Verdana、16px、400、非斜体。

五项配置在构造后是只读的：要换字号或字重，就再构造一个 `Font`。修改 `Font.defaultFamily` 这类默认值只影响之后创建的实例，已经创建的 `Font` 保留构造时的值。

需要基于默认值或已有字体做局部修改时，用静态方法：

- `Font.defaults()` 返回一个默认 `Font`；也可以传配置对象，例如 `Font.defaults({ size: 20 })`，没传的项仍用默认值。
- `Font.clone(base, patch)` 复制一份字体，用 `patch` 覆盖部分字段，例如 `Font.clone(font, { weight: FontWeight.Bold })`。
- `Font.setDefaults(font)` 一次性写入五项默认值；之后的 `new Font()` 都从它开始。
- `addFallback(...fonts)` 给字体加后备字体；主字体不可用时按添加顺序尝试。后备字体也可以再加后备，但不要形成循环。

`Font` 没有行高、字距、下划线、对齐这些属性；它们不属于字体，文字元素也不提供行高或对齐属性。斜体只有 `italic` 一个开关。

<ClientOnly>
  <RenderDemo :loader="fontTextLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

同一个字符串换成不同字号、字重与斜体后的效果。

## 文字元素用法

`container` 里不能直接写裸文字：空白文字会变成注释节点，非空白文字会创建文字元素并告警。文字内容一律放在 `text` 属性里：

```tsx
// 一行文字：内容只写在 text 属性
<text loc={[40, 40]} text="一行文字" fillStyle="#ffffff" />
```

<ClientOnly>
  <RenderDemo :loader="basicTextLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

最基本的一行文字：内容写在 `text`，位置由 `loc` 决定。

`text` 只支持单行；字符串里的换行符不会产生第二行。需要多行、折行或输入时，用内置的文本组件。

### 文字属性

文字元素自己的属性不多，全部列在下面：

| 属性          | 默认值      | 作用                     |
| ------------- | ----------- | ------------------------ |
| `text`        | `''`        | 要显示的内容，只支持单行 |
| `font`        | 默认 `Font` | 字体，必须是 `Font` 实例 |
| `fillStyle`   | `'#fff'`    | 填充颜色                 |
| `strokeStyle` | 无          | 描边颜色，设置后才描边   |
| `strokeWidth` | `1`         | 描边宽度，参与尺寸测量   |

- `fillStyle` 默认白色，且不从父容器继承：父容器设了 `fillStyle`，文字也不会跟着变色。需要统一颜色时，在每个文字上显式写，或把同一个颜色变量传给每个文字。
- `strokeStyle` 没有默认值。不写就不描边；写了之后才按这个颜色描边。
- `strokeWidth` 默认 `1`，只在有描边时看得出效果。描边宽度会参与尺寸测量，改大之后文字占用的矩形也会变大。
- 绘制时先画描边、再画填充，填充会盖住描边靠内的一半，所以描边看起来是沿字形外沿的一条边。
- `text` 只支持单行，换行符不会生效。

<ClientOnly>
  <RenderDemo :loader="styleTextLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

填充、描边颜色与描边宽度的对照。

### 尺寸、锚点与对齐

文字没有固定宽度。宽高由字体测量结果决定：内容、字号、字重、斜体、描边宽度一变，尺寸就重新计算。给 `<text>` 写 `width` / `height` 不会裁剪文字，只会暂时改变元素的定位框；下一次测量会把它覆盖回去。需要固定占位或裁剪时，在外面包一个容器。

默认锚点是 `anc={[0, 0]}`，`loc` 的 x / y 是测量矩形的左上角。锚点用 `anc={[ax, ay]}` 表示，两个值分别是横向、纵向的锚点比例：`anc={[0.5, 0.5]}` 同时把横纵锚点设成中心，`anc={[1, 0]}` 让 x 落在右边缘、y 仍落在顶边，`anc={[1, 1]}` 则是右下角。

```tsx
// 锚点居中：loc 的 x / y 落在文字中心
<text loc={[240, 160]} anc={[0.5, 0.5]} text="居中文字" fillStyle="#ffffff" />
```

本篇统一用 `loc` + `anc` 写位置和锚点。`loc` 只写 `[x, y]`，锚点统一用 `anc`。`loc` 的完整形式还能在坐标后写宽高与锚点（`[x, y, width, height, ax, ay]`），但文字尺寸由测量决定，宽高会被覆盖，所以文字页不采用；锚点也不塞进 `loc`。`anchorX` / `anchorY` 是 `anc` 的等价独立属性写法，例如 `anc={[0.5, 0.5]}` 等价于 `anchorX={0.5} anchorY={0.5}`；同一处只选一种写法，不要混用。

右对齐数值时用 `anc={[1, 0]}`，让文字的右边缘落在 x 上，y 仍是顶边：

```tsx
// 锚点 [1, 0]：x 是文字右边缘，适合数量、金币这类右对齐数字
<text loc={[440, 24]} anc={[1, 0]} text="128" fillStyle="#f2b84b" />
```

这段文字无论内容多长，右边缘都固定在 `(440, 24)`，左侧按测量宽度向左延伸。做数值列时，把这一列都设成同一个 x 与 `anc={[1, 0]}`，数字就会沿右边缘对齐。

<ClientOnly>
  <RenderDemo :loader="anchorTextLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

三行文字分别用不同的锚点，白点标出 `loc` 的位置。

文字没有 `textAlign`、`textBaseline`、`lineHeight` 这些属性。对齐只能靠锚点；单行文字基线固定，垂直居中按实际字形的上下沿算，不按行高；也不会自动换行。

## 文字在界面里的常见用法

- 标题：用较大字号与较粗字重，与正文拉开层级。
- 标签：小字号、浅色，做说明，不抢主内容的视觉重心。
- 按钮文字：放在按钮底容器里，点击由按钮底统一处理。
- 数值显示：用 `anc={[1, 0]}` 右对齐；不要用 `width` 裁剪，长度变化靠锚点对齐。

## 换行、打字机与输入

文字元素只画一行，`text` 里的换行符不会生效，长文本也不会按宽度折行。多行说明、按宽度折行与打字机效果不要用多个 `<text>` 硬拼；用[内置组件：文本](./builtin-text.md)里的 `TextContent`。

<script setup>
import RenderDemo from '../../../.vitepress/components/renderDemo.vue';

const basicTextLoader = () =>
    import('../../../.vitepress/components/demos/ui/text-basic.tsx');
const fontTextLoader = () =>
    import('../../../.vitepress/components/demos/ui/text-font.tsx');
const styleTextLoader = () =>
    import('../../../.vitepress/components/demos/ui/text-style.tsx');
const anchorTextLoader = () =>
    import('../../../.vitepress/components/demos/ui/text-anchor.tsx');
</script>

## 边界与注意

- `fillStyle` 默认是白色。浅色背景上直接写字要显式改色。
- `strokeWidth` 默认是 `1`，描边会计入尺寸；给 `strokeStyle` 时记得一起考虑宽度，靠边摆放要留出空间。
- 给文字设 `width` / `height` 不会截断内容，下一次测量还会覆盖它们。需要固定占位或裁剪时，用外层容器。
- 长文本不要用文字元素硬排。它只适合标题、标签、数值这类单行内容。
- 本篇统一用 `loc` + `anc`；`anchorX` / `anchorY` 是等价写法，同一处只写一种。
