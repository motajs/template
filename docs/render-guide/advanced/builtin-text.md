# 内置组件：文本

文字元素只画一行，不会自动换行，也没有行高与对齐。要让长文字按宽度折行、逐字显示，或者在一块固定区域里自动向上滚动，就用内置的文本组件。这一篇讲 `TextContent` 与 `ScrollText`：先说它们解决什么问题，再给能直接运行的最小写法，并在每个知识点旁边配上 live。

## 前置知识

阅读本篇前，建议先读完：

- [什么是组件](./what-is-component.md)
- [内置组件：基础](./builtin-basic.md)

## TextContent

`TextContent` 用来显示一段会按宽度折行的文字。它自己负责排版、量高和逐字显示，默认样式已经能直接使用；要改字体、颜色、行高或逐字间隔时，再配置它的 `typer`。

### 基本用法

`text` 放内容，`loc` 的四个值依次是 `x`、`y`、折行宽度、高度。折行宽度决定文字在哪里换行，高度决定组件占用的区域；两个值都要写。`width` 与 `height` 是等价的独立属性，同时写时以 `loc` 的第三、四项为准。

```tsx
import { TextContent } from '@user/client-base';

// 组件内容
<TextContent
    loc={[40, 40, 360, 140]}
    text="这段文字会按 loc 第三项的宽度折行，超出宽度的部分换到下一行。"
/>;
```

这段示例演示最小写法：位置、折行宽度、高度与文字都写在组件上。示例里的文字在 360 像素宽、140 像素高的区域里排版。

<ClientOnly>
  <RenderDemo :loader="textContentBasicLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

live 只保留文本组件本身：长句按 `loc` 第三项的宽度折行。

### 高度

不写 `autoHeight` 时，组件高度固定为 `loc` 第四项；文字超过高度时，超出部分不显示。写 `autoHeight` 后，第四项只作为初始高度，排版完成后组件按实际内容重新计算高度。

```tsx
<TextContent
    loc={[40, 40, 360, 72]}
    autoHeight
    text="这段文字的高度会跟着内容变化，不再固定在 loc 的第四项。"
/>
```

这段示例演示高度自适应：宽度仍然来自 `loc` 第三项，高度交给 `TextContent` 自己算。每次重新排版后，组件会重新计算高度，并通过 `onUpdateHeight` 把新高度报出来。

<ClientOnly>
  <RenderDemo :loader="textContentHeightLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

左侧固定高度只保留前几行，右侧开启 `autoHeight` 后按内容长高。

### 填充与描边

`fill` 控制填充，默认开启；`stroke` 控制描边，默认关闭。只写 `stroke` 时文字仍然会填充；要只描边，写 `fill={false} stroke`。填充色、描边色与描边线宽不在 `TextContent` 上，而在 `typer` 的配置里。

```tsx
import { markRaw } from 'vue';
import { TextContent, TextContentTyper } from '@user/client-base';

const outlined = markRaw(
    new TextContentTyper({
        fillStyle: '#58c4dd',
        strokeStyle: '#e8f0ff',
        strokeWidth: 3
    })
);

// 组件内容
<TextContent
    loc={[40, 40, 360, 140]}
    autoHeight
    fill
    stroke
    typer={outlined}
    text="这段文字同时有填充和描边。"
/>;
```

这段示例演示填充与描边同时开启：`fill` 与 `stroke` 是模式开关，颜色和线宽由 `typer` 提供。`TextContentTyper` 是一个大对象，交给组件时用 `markRaw` 包一层，避免 Vue 为它建立响应式代理；这和 typer 的配置项无关。

<ClientOnly>
  <RenderDemo :loader="textContentStyleLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

三行文字分别只填充、只描边、填充加描边；只描边那一行写了 `fill={false}`。

### 文字标记

`TextContent` 会在文字里解析一组标记，用来在同一个段落中改颜色、改字号或插入图标。标记在排版前被解析掉，不参与宽度测量。

| 标记                | 行为                                                     |
| ------------------- | -------------------------------------------------------- |
| `[c=颜色]...[/c]`   | 成对改颜色；嵌套时关闭内层会恢复外层颜色                 |
| `[s=字号]...[/s]`   | 成对改字号；嵌套时关闭内层会恢复外层字号                 |
| `[f=字体名]...[/f]` | 成对改字体族；嵌套时关闭内层会恢复外层字体               |
| `[b]`               | 在常规与粗体之间切换，没有 `[/b]` 闭合标记，写一次切一次 |
| `[i]`               | 在常规与斜体之间切换，没有 `[/i]` 闭合标记，写一次切一次 |
| `\n`                | 手动换行                                                 |
| `[[`                | 输出一个普通的 `[`                                       |
| `]]`                | 输出一个普通的 `]`                                       |
| `[w=字数]`          | 等待若干个字的时间                                       |
| `[icon=编号或别名]` | 插入一个图标                                             |

`[c]`、`[s]`、`[f]` 没有参数时不会按标记处理，会原样显示。要显示 `[[` 和 `]]` 本身，源文本里写成 `[[[[` 和 `]]]]`。`[b]` 与 `[i]` 是切换标记，没有 `[/b]`、`[/i]` 这样的闭合写法；要切回常规，再写一次 `[b]` 或 `[i]` 即可。

`[icon=编号或别名]` 的图标来自 `materials` 提供的素材管理器：数字按图块编号查找，字符串按别名查找。把 `materials` 交给 `TextContent` 就能使用其中的图标；不写 `materials` 时，使用默认的主素材来源。下面的 live 里，图标由示例在本地提供。

嵌套关系可以这样写：

```tsx
<TextContent
    loc={[40, 40, 380, 160]}
    autoHeight
    text={
        '[c=#f2b84b]外层黄色 [c=#7ee787]内层绿色[/c] 回到外层黄色[/c]\n' +
        '[f=Georgia]Georgia [f=Verdana]Verdana 内层[/f] 回到 Georgia[/f]\n' +
        '[s=22]大字号[/s] 普通字号，[b]粗体[b] 回到常规，[i]斜体[i] 回到常规\n' +
        '[[[[方括号]]]] 与 [[ 单个方括号 ]]'
    }
/>
```

这段示例演示三种成对标记的嵌套与切换标记：内层 `[c]`、`[f]`、`[s]` 关闭后，后面的文字恢复成外层值；`[b]` 与 `[i]` 没有闭合标记，再写一次就切回常规。

<ClientOnly>
  <RenderDemo :loader="textContentLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

live 中的文字同时使用嵌套颜色、嵌套字体、字号、粗体、斜体、手动换行、方括号字面量与图标；图标使用的素材由示例在本地提供。

### 实例方法

需要重播打字、立刻显示全文或读取总高度时，用 `ref` 拿到组件实例。实例暴露三个方法：

- `retype()`：从头开始重新打字；
- `showAll()`：立刻显示全部文字；
- `getHeight()`：返回当前排版结果的总高度。

```tsx
import { markRaw, ref } from 'vue';
import {
    TextContent,
    TextContentExpose,
    TextContentTyper
} from '@user/client-base';

const content = ref<TextContentExpose>();
const typer = markRaw(new TextContentTyper({ interval: 50 }));

// 某个事件里立刻显示全文
const reveal = () => content.value?.showAll();

// 组件内容
<TextContent
    ref={content}
    loc={[40, 40, 360, 140]}
    autoHeight
    typer={typer}
    text="这段文字会逐字显示，也可以立刻显示全文。"
/>;
```

这段示例演示通过实例方法控制打字：`ref` 保存组件实例，`showAll()` 跳过剩余间隔，直接显示全部文字；`retype()` 从头开始；`getHeight()` 读取总高度。

<ClientOnly>
  <RenderDemo :loader="textContentMethodsLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

live 中的按钮分别调用 `retype()`、`showAll()` 与 `getHeight()`，并显示高度读数。

### 参数

| 属性             | 作用                                        | 默认或常用值              |
| ---------------- | ------------------------------------------- | ------------------------- |
| `text`           | 显示的文字                                  | `''`                      |
| `loc`            | 位置与大小，四项依次是 x、y、折行宽度、高度 | 常用 `[40, 40, 360, 140]` |
| `width`          | 折行宽度，与 `loc` 第三项同义               | 写 `loc` 时不用再写       |
| `height`         | 固定高度，与 `loc` 第四项同义               | 写 `loc` 时不用再写       |
| `autoHeight`     | 按内容计算高度                              | `false`                   |
| `fill`           | 是否填充文字                                | `true`                    |
| `stroke`         | 是否描边文字                                | `false`                   |
| `typer`          | 文本排版与打字配置                          | 默认配置的 typer          |
| `materials`      | 图标素材管理器，可省略                      | 默认素材管理器            |
| `onTypeStart`    | 开始打字时触发                              | 无                        |
| `onTypeEnd`      | 打字结束时触发                              | 无                        |
| `onUpdateHeight` | 高度重算后触发，参数为新高度                | 无                        |

## TextContentTyper

默认 typer 已经能显示文字。要改字体、行高、文字颜色、对齐、断词规则或逐字间隔时，才需要自己构造一个 `TextContentTyper`，再通过 `TextContent` 的 `typer` 属性传进去。typer 是一个大对象，交给组件时用 `markRaw` 包一层，避免 Vue 为它建立响应式代理。

```tsx
import { Font } from '@motajs/render';
import { markRaw } from 'vue';
import {
    TextContent,
    TextContentTyper,
    TextAlign,
    WordBreak
} from '@user/client-base';

const typer = markRaw(
    new TextContentTyper({
        font: new Font('Verdana', 18),
        lineHeight: 8,
        interval: 30,
        textAlign: TextAlign.Left,
        wordBreak: WordBreak.Space,
        fillStyle: '#e8f0ff'
    })
);

// 组件内容
<TextContent
    loc={[40, 40, 360, 140]}
    autoHeight
    typer={typer}
    text="这段文字使用自定义的字体、行高、对齐与颜色。"
/>;
```

这段示例演示 typer 的常见配置：18px 字体、8 像素额外行距、逐字间隔 30 毫秒、左对齐、按空格与 CJK 字符折行、浅色填充。一个 typer 保存着当前文字与打字进度，只交给一个 `TextContent` 使用。

### 配置字段

| 字段              | 作用                                           | 默认或常用值      |
| ----------------- | ---------------------------------------------- | ----------------- |
| `font`            | 字体，使用 `Font` 实例                         | 默认 `Font`       |
| `interval`        | 每个字之间的间隔，单位毫秒；`0` 表示一次显示完 | `0`               |
| `lineHeight`      | 行与行之间的额外间距                           | `0`               |
| `textAlign`       | 每行在折行宽度内的对齐方式                     | `TextAlign.Left`  |
| `wordBreak`       | 断词规则                                       | `WordBreak.Space` |
| `breakChars`      | 额外参与分词的字符                             | `''`              |
| `ignoreLineStart` | 额外不放在行首的字符                           | `''`              |
| `ignoreLineEnd`   | 额外不放在行尾的字符                           | `''`              |
| `fillStyle`       | 文字填充色                                     | `'#fff'`          |
| `strokeStyle`     | 文字描边色                                     | `'#000'`          |
| `strokeWidth`     | 文字描边线宽                                   | `2`               |
| `materials`       | 图标素材管理器，可省略                         | 默认素材管理器    |

`width` 不在这里设置：`TextContent` 每次重新排版时，会把组件自己的折行宽度写进 typer；typer 里写了也会被覆盖。`materials` 通常不用自己传，`TextContent` 会把可用的素材管理器交给它。

<ClientOnly>
  <RenderDemo :loader="textContentTyperConfigLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

三列文字使用不同的字体、字号、行高、对齐与填充色，对照 typer 的配置效果。

### 折行规则

`wordBreak` 决定文字可以在哪里断开：

| 取值              | 行为                                                 |
| ----------------- | ---------------------------------------------------- |
| `WordBreak.None`  | 不折行，内容一行到底                                 |
| `WordBreak.Space` | 在空格、连字符等位置折行，CJK 字符可以单独折行，默认 |
| `WordBreak.All`   | 任意字符都可以折行                                   |

`breakChars` 在默认分词字符之外再补充可断开的字符；`ignoreLineStart` 与 `ignoreLineEnd` 在默认标点集合之外，再补充不允许出现在行首或行尾的字符。例如中文标点不应该落在行首时，可以把它加进 `ignoreLineStart`。

只控制不折行时，构造一个 typer：

```tsx
import { Font } from '@motajs/render';
import { markRaw } from 'vue';
import { TextContent, TextContentTyper, WordBreak } from '@user/client-base';

const noWrap = markRaw(
    new TextContentTyper({
        font: new Font('Verdana', 14),
        wordBreak: WordBreak.None
    })
);

// 组件内容
<TextContent
    loc={[40, 40, 140, 120]}
    autoHeight
    typer={noWrap}
    text="这一行不会按宽度折行，超出的部分会被裁掉。"
/>;
```

这段示例演示 `WordBreak.None`：宽度仍然来自 `loc` 第三项，但 typer 禁止在宽度处换行。折行只受宽度影响，宽度来自 `TextContent` 的 `loc` 第三项或 `width` 属性，与 typer 无关。

<ClientOnly>
  <RenderDemo :loader="textContentTyperWrappingLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

三列使用同一段英文，`None` 一行到底，`Space` 在空格处折行，`All` 连长单词内部也可以折行。

### 打字行为

`interval` 大于 `0` 时，文字从第一个字开始逐个出现，每两个字之间隔 `interval` 毫秒；`interval` 为 `0` 时，所有文字一次显示完。开始与结束分别触发 `onTypeStart` 与 `onTypeEnd`。

打字过程中调用 `showAll()` 会立刻补齐剩余文字；调用 `retype()` 则清空当前进度，从第一个字重新开始。需要控制逐字出现的节奏时，改 `interval`；需要改字体、颜色或行高时，改同一个 typer 的其他配置。

下面的示例用按钮显式开始，不在页面打开时自动打完：

```tsx
import { markRaw, nextTick, ref } from 'vue';
import {
    TextContent,
    TextContentExpose,
    TextContentTyper
} from '@user/client-base';

const content = ref<TextContentExpose>();
const started = ref(false);
const typer = markRaw(new TextContentTyper({ interval: 80 }));

const start = async () => {
    if (!started.value) {
        started.value = true;
        await nextTick();
    }
    content.value?.retype();
};

// 组件内容
<TextContent
    ref={content}
    loc={[40, 40, 360, 140]}
    autoHeight
    typer={typer}
    text={started.value ? '点击开始后逐字显示。' : ''}
/>;
```

这段示例演示可控的打字节奏：初始文字为空，点击按钮后才写入文字并调用 `retype()`；下次点击同一个按钮会从第一个字重播。

<ClientOnly>
  <RenderDemo :loader="textContentTyperTypingLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

live 初始停在「等待开始」，点击「开始 / 重播」后才逐字显示；`[w=8]` 会在中途多等八个字的打字时间，「立即显示」会跳过剩余文字。

## ScrollText

`ScrollText` 用来让一段较长的文字在固定区域里自动向上滚动。它把 `TextContent` 放进一个滚动视口，按每秒多少像素把内容向上推；滚到末尾时触发 `scrollEnd`，随后停在底部。

### 基本用法

`loc` 是滚动视口的位置与大小，四个值依次是 `x`、`y`、视口宽度、视口高度；`width` 是文字的折行宽度，通常与视口宽度一致；`speed` 是每秒滚动的像素数，`text` 放内容。

```tsx
import { ScrollText } from '@user/client-base';

// setup
const notice = '这是一条会自己向上滚动的公告。'.repeat(8);

// 组件内容
<ScrollText loc={[40, 40, 400, 170]} width={400} speed={50} text={notice} />;
```

这段示例演示最基本的滚动：内容在 400×170 的视口里从下往上移动，超出的部分不显示。

文字正式开始进入视口之前，想先留一点空白，用 `pad` 给预留的像素数，默认 16：

```tsx
<ScrollText
    loc={[40, 40, 400, 170]}
    width={400}
    speed={50}
    pad={32}
    text={notice}
/>
```

这段示例演示 `pad`：文字先停在视口下方 32 像素处，再开始向上滚动。`pad` 只留垂直方向的空白，不是左右内边距。

<ClientOnly>
  <RenderDemo :loader="scrollTextLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

live 中的公告在固定视口里持续向上滚动，滚到底后停顿片刻再从头开始。

### 文本样式

`ScrollText` 接收 `TextContent` 的文本参数：`text`、`fill`、`stroke`、`typer` 与 `materials` 都可以直接传给 `ScrollText`，再由它交给内部的 `TextContent`。字体、颜色、行高、对齐等仍然属于 `typer` 的配置，不要写成 `ScrollText` 的直接属性。只描边时同样写 `fill={false} stroke`。

```tsx
import { Font } from '@motajs/render';
import { markRaw } from 'vue';
import { ScrollText, TextContentTyper } from '@user/client-base';

const typer = markRaw(
    new TextContentTyper({
        font: new Font('Verdana', 18),
        lineHeight: 10,
        fillStyle: '#e8f0ff',
        strokeStyle: '#58c4dd',
        strokeWidth: 2
    })
);

// 组件内容
<ScrollText
    loc={[40, 40, 400, 190]}
    width={400}
    speed={50}
    pad={32}
    fill
    stroke
    typer={typer}
    text={notice}
/>;
```

这段示例演示滚动文字的样式：字体、行距、填充与描边都来自同一个 typer；`width` 与视口宽度同为 400，文字在整块视口里排版，`pad` 让文字先从视口下方进入。

<ClientOnly>
  <RenderDemo :loader="scrollTextStyleLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

live 演示字体、行距、填充与描边；`pad` 让文字先从视口下方进入。

### 实例方法

需要中途控制滚动时，用 `ref` 拿到组件实例。实例暴露四个方法：

- `pause()`：暂停滚动；
- `resume()`：继续滚动；
- `setSpeed(speed)`：修改每秒滚动的像素数；
- `rescroll()`：立刻回到起点，重新滚动。

滚动到底时还会触发一次 `onScrollEnd`；之后组件会停在底部，需要重播时调用 `rescroll()`，再调用 `resume()`。

```tsx
import { ref } from 'vue';
import { ScrollText, ScrollTextExpose } from '@user/client-base';

const scroll = ref<ScrollTextExpose>();

// setup
const pause = () => scroll.value?.pause();
const resume = () => scroll.value?.resume();
const faster = () => scroll.value?.setSpeed(120);

// 回到起点后要继续滚动，必须再调用 resume
const restart = () => {
    scroll.value?.rescroll();
    scroll.value?.resume();
};

// 组件内容
<ScrollText
    ref={scroll}
    loc={[40, 40, 400, 170]}
    width={400}
    speed={50}
    text={notice}
    onScrollEnd={() => {
        // 已经停在底部，等待重新开始
    }}
/>;
```

这段示例演示滚动控制：`pause()` 与 `resume()` 只改暂停状态，`setSpeed()` 只影响之后的滚动，`rescroll()` 把位置拉回起点但不会自动继续。

<ClientOnly>
  <RenderDemo :loader="scrollTextMethodsLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

live 的四个按钮分别暂停、继续、在 70 与 140 像素每秒之间切换、回到起点并继续滚动；状态行显示当前状态与速度。

### 参数

| 属性          | 作用                           | 默认或常用值              |
| ------------- | ------------------------------ | ------------------------- |
| `loc`         | 滚动视口的位置与大小，四项都写 | 常用 `[40, 40, 400, 170]` |
| `width`       | 文字的折行宽度                 | 必填                      |
| `speed`       | 每秒滚动的像素数               | 必填                      |
| `pad`         | 文字进入视口前预留的垂直空白   | `16`                      |
| `text`        | 滚动文字                       | `''`                      |
| `typer`       | 文本排版与打字配置             | 默认配置的 typer          |
| `fill`        | 是否填充文字                   | `true`                    |
| `stroke`      | 是否描边文字                   | `false`                   |
| `materials`   | 图标素材管理器，可省略         | 默认素材管理器            |
| `onScrollEnd` | 滚动到底时触发一次             | 无                        |

## 边界与注意

- `loc` 统一写四个值。折行宽度和高度分别来自第三、四项；把 `loc` 写成三项会少掉高度。
- `lineHeight` 是行与行之间的额外间距，不是整行高度；默认 `0` 时多行会贴得比较紧。
- `fill` 与 `stroke` 只是模式开关；填充色、描边色与线宽属于 `typer`，不要直接写在 `TextContent` 或 `ScrollText` 上。只描边要写 `fill={false} stroke`。
- 一个 `typer` 实例只交给一个文本组件使用；多个组件共用会互相覆盖当前文字与打字进度。
- 不写 `autoHeight` 时，`TextContent` 的高度固定为 `loc` 第四项，不会随内容变长；超出高度的部分不显示。
- `ScrollText` 的 `width` 是文字折行宽度，通常与 `loc` 第三项写成一样。`pad` 是垂直方向的预留空白，不影响折行宽度。
- `ScrollText` 滚到末尾后会暂停；需要重播时先 `rescroll()` 再 `resume()`，只调用其中一个不会从头开始。
- `TextContentTyper` 是大对象，传给 `typer` 时用 `markRaw` 包一层，避免 Vue 建立响应式代理。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const textContentBasicLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-textcontent-basic-demo.tsx');
const textContentHeightLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-textcontent-height-demo.tsx');
const textContentStyleLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-textcontent-style-demo.tsx');
const textContentLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-textcontent-demo.tsx');
const textContentMethodsLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-textcontent-methods-demo.tsx');
const textContentTyperConfigLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-textcontenttyper-config-demo.tsx');
const textContentTyperWrappingLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-textcontenttyper-wrapping-demo.tsx');
const textContentTyperTypingLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-textcontenttyper-typing-demo.tsx');
const scrollTextLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-scrolltext-demo.tsx');
const scrollTextStyleLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-scrolltext-style-demo.tsx');
const scrollTextMethodsLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-scrolltext-methods-demo.tsx');
</script>
