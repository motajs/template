# 内置组件：布局

这一篇讲四个负责区域与列表的组件：`Scroll`、`Page`、`List`、`ListPage`。它们都先说要解决什么，再给最小写法，常用参数跟着讲，最后接一个 live。

## 前置知识

阅读本篇前，建议先读完：

- [什么是组件](./what-is-component.md)
- [内置组件：基础](./builtin-basic.md)

## Scroll

内容超过视口时，用 `Scroll` 给一块区域加滚动。

`loc` 是视口的位置与大小。总长度按**直接子元素**的包围盒计算，所以每一行都要直接挂在 `Scroll` 下面，不要先用一个大容器把所有内容包起来。

```tsx
import { Scroll } from '@user/client-base';

// setup
const rows = Array.from({ length: 12 }, (_, index) => `第 ${index + 1} 行`);

// 组件内容
<Scroll loc={[40, 40, 300, 220]}>
    {rows.map((row, index) => (
        <container key={row} loc={[0, index * 32, 280, 32]}>
            <text loc={[8, 8]} text={row} fillStyle="#e8f0ff" />
        </container>
    ))}
</Scroll>;
```

每一行的高度与顺序由子元素自己的 `loc` 决定。

想横向滚动，加 `hor`，子元素改为从左往右排：

```tsx
<Scroll loc={[40, 40, 300, 120]} hor>
    {rows.map((row, index) => (
        <container key={row} loc={[index * 120, 0, 120, 100]}>
            <text loc={[8, 8]} text={row} fillStyle="#e8f0ff" />
        </container>
    ))}
</Scroll>
```

滚动条默认可以手动滚；不想显示滚动条时，加 `noscroll`，滚轮与拖拽滚动仍然可用。

滚到末尾想多留一点空白，用 `padEnd` 给额外长度，默认 `0`。

参数汇总：

| 属性       | 作用                     | 默认或常用值 |
| ---------- | ------------------------ | ------------ |
| `loc`      | 视口的位置与大小         | 必填         |
| `hor`      | 改为横向滚动             | `false`      |
| `noscroll` | 隐藏滚动条               | `false`      |
| `padEnd`   | 滚到末尾时额外填充的长度 | `0`          |

<ClientOnly>
  <RenderDemo :loader="scrollLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

直接子元素从上往下排，右侧是滚动条。

## Page

内容分页用 `Page`。

`pages` 是总页数，`loc` 决定内容与页码条的位置和大小；当前页用 `v-model:page` 绑定。默认 slot 收到当前页索引，从 `0` 开始，按索引渲染对应内容。

```tsx
import { ref } from 'vue';
import { Page } from '@user/client-base';

// setup
const page = ref(0);
const pages = ['第一页内容', '第二页内容', '第三页内容'];

// 组件内容
<Page pages={3} v-model:page={page.value} loc={[40, 40, 300, 200]}>
    {(index: number) => (
        <text loc={[8, 8]} text={pages[index] ?? ''} fillStyle="#e8f0ff" />
    )}
</Page>;
```

页码条占 `loc` 的底部，内容只能放在剩下的高度里。

只有一页时页码条没有意义，加 `hideIfSingle` 隐藏它：

```tsx
<Page pages={1} hideIfSingle loc={[40, 40, 300, 200]}>
    {() => <text loc={[8, 8]} text="只有一页" fillStyle="#e8f0ff" />}
</Page>
```

参数汇总：

| 属性           | 作用                     | 默认或常用值 |
| -------------- | ------------------------ | ------------ |
| `pages`        | 总页数                   | 必填         |
| `loc`          | 内容与页码条的位置和大小 | 必填         |
| `page`         | 当前页索引，从 `0` 开始  | `0`          |
| `font`         | 页码字体                 | 默认字体     |
| `hideIfSingle` | 只有一页时隐藏页码条     | `false`      |

页码变化时触发 `pageChange`，同时用 `update:page` 同步 `v-model:page`。

<ClientOnly>
  <RenderDemo :loader="pageLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

点底部的页码或两侧箭头切换三页内容。

## List

要显示一列可选择项，用 `List`。

`list` 是 `[id, 文本]` 数组，每项第一项是 id、第二项是列表里显示的文字。`loc` 是列表视口的位置与大小，内容超出时由内部的 `Scroll` 滚动。`selected` / `v-model:selected` 是当前选中项的 id，初值取列表第一项。`List` 自身没有默认 slot，行文字完全来自 `list`。

`lineHeight` 是每行的固定高度，默认 `24`，**不会随字体自动调整**；改了 `font` 的字号后必须同时设置合适的 `lineHeight`，否则行与文字可能重叠。

`font` 控制行文字；`winskin`、`color`、`border`、`alphaRange` 控制选中光标，分别指定光标图片、填充色、边框色与闪烁的不透明度范围。

```tsx
import { ref } from 'vue';
import { List } from '@user/client-base';

// setup
const items: [string, string][] = [
    ['basic', '基础设置'],
    ['sound', '声音'],
    ['key', '按键']
];
const selected = ref(items[0][0]);

// 组件内容
<List
    loc={[40, 40, 300, 160]}
    list={items}
    lineHeight={32}
    v-model:selected={selected.value}
/>;
```

选中某一行时触发 `update` 与 `update:selected`，参数都是该行的 id。

参数汇总：

| 属性         | 作用                                      | 默认或常用值   |
| ------------ | ----------------------------------------- | -------------- |
| `list`       | `[id, 文本][]`，id 用于选中，文本用于显示 | 必填           |
| `loc`        | 列表视口的位置与大小                      | 必填           |
| `selected`   | 当前选中项的 id，支持 `v-model:selected`  | 第一项 id      |
| `lineHeight` | 每行固定高度，不随字号自动调整            | `24`           |
| `font`       | 行文字字体                                | 默认字体       |
| `winskin`    | 用作选中光标的图片                        | 无             |
| `color`      | 选中光标的填充色                          | 默认填充       |
| `border`     | 选中光标的边框色                          | 默认描边       |
| `alphaRange` | 选中光标闪烁的不透明度范围                | `[0.25, 0.55]` |

<ClientOnly>
  <RenderDemo :loader="listLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

四项列表，选中项高亮，点击任意一行切换。

## ListPage

左边列表、右边详情，用 `ListPage`。

`list` 是 `[id, 文本]` 数组，每项第一项是 id、第二项是列表里显示的文字；`loc` 是整个组件的位置与大小。当前选中项用 `v-model:selected` 绑定，默认 slot 收到选中的 id，按 id 渲染右侧内容。

```tsx
import { ref } from 'vue';
import { ListPage } from '@user/client-base';

// setup
const items: [string, string][] = [
    ['basic', '基础设置'],
    ['sound', '声音'],
    ['key', '按键']
];
const detail: Record<string, string> = {
    basic: '这里放基础设置的说明。',
    sound: '这里放音量与音效的说明。',
    key: '这里放按键改绑的说明。'
};
const selected = ref(items[0][0]);

// 组件内容
<ListPage
    loc={[40, 40, 400, 240]}
    list={items}
    v-model:selected={selected.value}
>
    {(key: string) => (
        <text
            loc={[16, 16]}
            text={detail[key] ?? '没有内容'}
            fillStyle="#e8f0ff"
        />
    )}
</ListPage>;
```

`selected` 的初值取列表第一项的 id，左侧高亮和右侧内容才会从同一项开始。

左侧列表默认占整宽的 `0.3`；想改比例用 `basis`：

```tsx
<ListPage
    loc={[40, 40, 400, 240]}
    list={items}
    basis={0.4}
    v-model:selected={selected.value}
>
    {(key: string) => (
        <text
            loc={[16, 16]}
            text={detail[key] ?? '没有内容'}
            fillStyle="#e8f0ff"
        />
    )}
</ListPage>
```

想把列表放到右侧，加 `right`。需要关闭按钮时加 `close`，按钮位置用 `closeLoc` 给，相对于 `loc`：

```tsx
<ListPage
    loc={[40, 40, 400, 240]}
    list={items}
    right
    close
    closeLoc={[360, 8]}
    v-model:selected={selected.value}
>
    {(key: string) => (
        <text
            loc={[16, 16]}
            text={detail[key] ?? '没有内容'}
            fillStyle="#e8f0ff"
        />
    )}
</ListPage>
```

`ListPage` 复用 `List` 的全部参数，并额外提供列表比例、排列方向与关闭按钮：

| 属性         | 作用                                          | 默认或常用值   |
| ------------ | --------------------------------------------- | -------------- |
| `list`       | `[id, 文本][]`，id 用于选中，文本用于列表显示 | 必填           |
| `loc`        | 整个组件的位置与大小                          | 必填           |
| `selected`   | 当前选中项的 id，支持 `v-model:selected`      | 第一项 id      |
| `lineHeight` | 每行固定高度，不随字号自动调整                | `24`           |
| `font`       | 列表与关闭按钮的字体                          | 默认字体       |
| `winskin`    | 用作选中光标的图片                            | 无             |
| `color`      | 选中光标的填充色                              | 默认填充       |
| `border`     | 选中光标的边框色                              | 默认描边       |
| `alphaRange` | 选中光标闪烁的不透明度范围                    | `[0.25, 0.55]` |
| `basis`      | 列表占整宽的比例                              | `0.3`          |
| `right`      | 列表排在右侧                                  | `false`        |
| `close`      | 显示关闭按钮                                  | `false`        |
| `closeLoc`   | 关闭按钮位置，相对于 `loc`                    | 无             |

列表项点击同样触发 `update` 与 `update:selected`；点关闭按钮触发 `close`。默认 slot 收到选中项 id，也可以按 id 写具名 slot，选中哪项就优先用哪项的 slot。

<ClientOnly>
  <RenderDemo :loader="listPageLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

左侧是三项列表，选中项高亮，右侧显示对应说明。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const scrollLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-scroll-demo.tsx');
const pageLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-page-demo.tsx');
const listLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-list-demo.tsx');
const listPageLoader = () =>
    import('../../.vitepress/components/demos/ui/builtin-listpage-demo.tsx');
</script>
