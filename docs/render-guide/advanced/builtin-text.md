# 内置组件：文本

文字元素只画一行。要让长文字按宽度折行、逐字显示或自动向上滚动时，用内置的文本组件。这一篇讲 `TextContent` 和 `ScrollText`，每个都先说它解决什么问题，再给最小写法，最后接一个 live。

## 前置知识

阅读本篇前，建议先读完：

- [什么是组件](./what-is-component.md)
- [内置组件：基础](./builtin-basic.md)

## TextContent

要让长文字按宽度自动折行，用 `TextContent`。

第一步：必须给 `width`，排版只按这个宽度折行；`text` 放内容，`loc` 前两项决定位置。

```tsx
import { TextContent } from '@user/client-base';

// 组件内容
<TextContent
    loc={[40, 40]}
    width={360}
    text="这段文字会按 width 折行，超出的部分换到下一行。"
/>;
```

高度默认由 `loc` 的第四项决定；不想自己算高度时加 `autoHeight`，组件按内容算高度。

想让文字逐字显示，加 `interval`，单位是毫秒，`0` 表示一次显示完：

```tsx
<TextContent
    loc={[40, 40]}
    width={360}
    autoHeight
    interval={30}
    text="这段文字会按 width 折行，并逐字显示。"
/>
```

打字结束时要做点什么，用 `onTypeEnd`。

```tsx
<TextContent
    loc={[40, 40]}
    width={360}
    autoHeight
    interval={30}
    text="打完这段文字后会触发回调。"
    onTypeEnd={() => {
        // 打字结束时执行
    }}
/>
```

全部参数：

| 属性                        | 作用                                        | 默认或常用值        |
| --------------------------- | ------------------------------------------- | ------------------- |
| `text`                      | 显示的文字                                  | `''`                |
| `width`                     | 折行宽度                                    | 必填                |
| `loc`                       | 位置与高度                                  | `[]`（即 `[0, 0]`） |
| `autoHeight`                | 按内容计算高度                              | `false`             |
| `interval`                  | 逐字间隔，单位毫秒                          | `0`                 |
| `font`                      | 文字字体                                    | `new Font()`        |
| `lineHeight`                | 行与行之间的额外间距                        | `0`                 |
| `fill` / `stroke`           | 填充 / 描边文字                             | `true` / `false`    |
| `fillStyle` / `strokeStyle` | 填充 / 描边颜色                             | `#fff` / `#000`     |
| `strokeWidth`               | 描边线宽                                    | `2`                 |
| `textAlign`                 | 多行文字左对齐 / 居中 / 右对齐              | `TextAlign.Left`    |
| `wordBreak`                 | 断词规则：不换行 / 空格与 CJK 处 / 任意字符 | `WordBreak.Space`   |
| `breakChars`                | 额外参与分词的字符                          | `''`                |
| `ignoreLineStart`           | 不放在行首的字符                            | `''`                |
| `ignoreLineEnd`             | 不放在行尾的字符                            | `''`                |
| `onTypeStart` / `onTypeEnd` | 开始 / 结束打字时触发                       | 无                  |
| `onUpdateHeight`            | 高度重算后触发，参数为新高度                | 无                  |

多行文字时，`lineHeight` 默认为 `0`，行与行会贴得比较紧；通常设成 `8` 左右阅读起来更舒展。

需要重播或立刻显示全文时，组件实例还暴露 `retype()`、`showAll()` 和 `getHeight()`。

### 文本标记

要在文本里改颜色，写 `[c=颜色]...[/c]`：

```tsx
<TextContent loc={[40, 40]} width={360} text="[c=#f2b84b]这一段是黄色[/c]" />
```

要改字号，写 `[s=字号]...[/s]`：

```tsx
<TextContent loc={[40, 40]} width={360} text="[s=20]这一段字更大[/s]" />
```

要换行，写 `\n`；在 TSX 里用模板字符串或字符串拼接：

```tsx
<TextContent loc={[40, 40]} width={360} text={'第一行\n第二行'} />
```

`[[` 输出一个普通的 `[`，`]]` 输出一个普通的 `]`。要显示 `[[` 和 `]]` 本身，源文本里写成 `[[[[` 和 `]]]]`：

```tsx
<TextContent loc={[40, 40]} width={360} text="这里显示 [[[[方括号]]]] 本身" />
```

`[c=...]` 与 `[s=...]` 要成对闭合，可以嵌套，例如 `[c=#f2b84b][s=20]标题[/s][/c]`。只写 `[c]` 没有颜色参数，不会按标记处理，会原样显示。

需要粗体、斜体、换字体、等待或图标时，再用这些标记：

| 标记                | 作用               |
| ------------------- | ------------------ |
| `[b]`               | 切换粗体           |
| `[i]`               | 切换斜体           |
| `[f=字体名]...[/f]` | 改字体族           |
| `[w=字数]`          | 等待若干个字的时间 |
| `[icon=图标名]`     | 插入图标           |

`[b]` 和 `[i]` 是切换，不是成对闭合：写一次切换一次。标记可以组合使用，也可以跨行书写。

把颜色、字号、换行与方括号放在一起：

```tsx
<TextContent
    loc={[40, 40]}
    width={360}
    autoHeight
    lineHeight={8}
    text={
        '[c=#f2b84b][s=20]标题[/s][/c]\n' +
        '[c=#7ee787]正文里的 [[[[方括号]]]] 会原样显示[/c]\n' +
        '[c=#8aa0b8][s=13]小字注释[/s][/c]'
    }
/>
```

<ClientOnly>
  <RenderDemo :loader="textContentLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

同一段文字里混用了颜色、字号、手动换行与方括号字面量，长句会按 `width` 折行。

## ScrollText

要让文字自动向上滚动，用 `ScrollText`。

基本写法里，`width` 是文字的最大宽度，`speed` 是每秒滚动的像素数，`text` 放内容，`loc` 是滚动区域的视口。

```tsx
import { ScrollText } from '@user/client-base';

// setup
const notice = '这是一条会自己向上滚动的公告。'.repeat(8);

// 组件内容
<ScrollText
    loc={[40, 40, 400, 160]}
    width={400}
    speed={50}
    text={notice}
    fillStyle="#e8f0ff"
/>;
```

文字从下往上滚过视口，超出视口的部分不显示。

开始滚动前想先留一点空白，用 `pad` 给预留的像素数，默认 `16`：

```tsx
<ScrollText
    loc={[40, 40, 400, 160]}
    width={400}
    speed={50}
    pad={32}
    text={notice}
/>
```

排版参数与 `TextContent` 相同，`fillStyle`、`font`、`lineHeight` 照常写。`width` 是滚动区宽度，文字实际按 `width - 16` 折行；`loc` 的第四项是视口高度，省略时取 `width`。

全部参数：

| 属性                        | 作用                                        | 默认或常用值      |
| --------------------------- | ------------------------------------------- | ----------------- |
| `loc`                       | 滚动视口的位置与大小                        | 必填              |
| `width`                     | 滚动区宽度                                  | 必填              |
| `speed`                     | 每秒滚动像素数                              | 必填              |
| `pad`                       | 开始滚动前预留的像素                        | `16`              |
| `text`                      | 滚动文字                                    | `''`              |
| `font`                      | 文字字体                                    | `new Font()`      |
| `fillStyle` / `strokeStyle` | 填充 / 描边颜色                             | `#fff` / `#000`   |
| `fill` / `stroke`           | 填充 / 描边文字                             | `true` / `false`  |
| `strokeWidth`               | 描边线宽                                    | `2`               |
| `lineHeight`                | 行与行之间的额外间距                        | `0`               |
| `textAlign`                 | 多行文字左对齐 / 居中 / 右对齐              | `TextAlign.Left`  |
| `wordBreak`                 | 断词规则：不换行 / 空格与 CJK 处 / 任意字符 | `WordBreak.Space` |
| `onScrollEnd`               | 滚动到底时触发一次，随后停止                | 无                |

需要中途控制滚动时，组件实例还暴露 `pause()`、`resume()`、`setSpeed(speed)` 和 `rescroll()`。

<ClientOnly>
  <RenderDemo :loader="scrollTextLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

公告在固定视口里持续向上滚动。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const textContentLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-textcontent-demo.tsx');
const scrollTextLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-scrolltext-demo.tsx');
</script>
