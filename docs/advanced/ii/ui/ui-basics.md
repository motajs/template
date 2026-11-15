# UI 入门

这篇讲三件事：怎样打开一个 UI、TSX 里的标签和组件怎么写、渲染树是什么样。看完你能在模板里写出文字和矩形。

## UI 的打开

每个 UI 是一个 `GameUI` 对象。在已有 UI 里，可以用 `props.controller` 打开另一个 UI，返回值是这次打开的实例：

```tsx
// 打开 MyPanelUI，空对象是传给它的参数
const instance = props.controller.open(MyPanelUI, {});

// 关闭这次打开的实例
props.controller.close(instance);
```

每次 `open` 都会得到独立实例，同一个 `GameUI` 也可以被打开多次。参数、栈顺序与 `alwaysShow` 的细节见 [UI 系统](./ui-system.md)。

## TSX 里的标签和组件

这里的 TSX 不是 DOM 的 JSX。它看起来像 HTML，但会被渲染系统解释成画布元素。记住下面几条就能开始写。

### 标签

`container`、`g-rect`、`text` 都是渲染元素，不是 HTML 标签。元素名一律小写，没有子元素时用自闭合写法：

```tsx
<g-rect loc={[0, 0, 120, 80]} fillStyle="#2f6fed" />
```

有子元素时成对写，例如 `<container>...</container>`。

### 属性

属性写在标签上，名字用 camelCase：

```tsx
<text loc={[24, 24]} text="你好，UI" fillStyle="#e8f0ff" />
```

`loc` 的值是数组，所以写成 `loc={[...]}`；`text` 的值是字符串，直接写引号即可。

### 表达式与注释

`{}` 里可以写 JavaScript 表达式，表达式的结果会作为属性值，例如：

```tsx
<text text={'分数：' + score} />
```

`{/* ... */}` 是 TSX 注释，不会显示出来。

### 嵌套

标签里可以放子标签，子标签就是它的内容。下面容器里有一个文字和一个矩形：

```tsx
<container loc={[0, 0, 240, 120]}>
    <text loc={[12, 12]} text="标题" fillStyle="#ffffff" />
    <g-rect loc={[12, 44, 120, 48]} fillStyle="#2f6fed" />
</container>
```

### 组件

大写开头的名字（如 `MyPanel`）是组件，可以像标签一样使用：

```tsx
<container loc={FULL_LOC}>
    <MyPanel />
</container>
```

`FULL_LOC` 来自标准模板的 import。

组件本身不额外产生节点，它的根元素挂在使用位置。组件内部写什么，由组件自己决定。

条件与循环这里先不展开，用到时再看[条件渲染与循环渲染](./conditional-and-list-rendering.md)。

## 渲染树的基本模型

模板里的 UI 都是这样一个容器：

```tsx
<container loc={FULL_LOC}>{/* UI 内容 */}</container>
```

- `container` 是整块 UI 的容器，负责位置和大小；
- 里面的 `text`、`g-rect` 等元素负责具体内容；
- 元素放在哪个容器里，就跟着哪个容器移动；子元素的位置相对它所在的容器；
- `MyPanel` 组件本身不额外产生节点，它的根 `container` 就是整块 UI 的根。

所以写 UI 时，先把模板里的 `container` 当成画布，再往里面按顺序放元素。

## 一行文字

在模板的 `container` 里加一行：

```tsx
<text loc={[24, 24]} text="你好，UI" fillStyle="#e8f0ff" />
```

- `text` 是元素名，表示一行文字；
- `loc` 的前两个数 `24, 24` 是文字左上角相对容器的位置；
- `text="你好，UI"` 是要显示的文字；
- `fillStyle="#e8f0ff"` 是文字颜色。

坐标以容器左上角为原点：第一个数是向右的距离，第二个数是向下的距离。文字的大小由字号决定，所以 `loc` 只写两个数就够了。

## 一个矩形

再加一个矩形：

```tsx
<g-rect loc={[24, 64, 160, 80]} fillStyle="#2f6fed" />
```

- `g-rect` 是绘制矩形用的标签；
- `loc` 的前两个数 `24, 64` 是矩形左上角的位置，后两个数 `160, 80` 是宽和高；
- 矩形默认填充，`fillStyle="#2f6fed"` 是填充颜色。

和文字不同，矩形必须给出宽高，所以 `loc` 写了四个数。

## 组合

两段放进同一个 `container`，就是完整的 UI：

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
    return () => (
        <container loc={FULL_LOC}>
            <text loc={[24, 24]} text="你好，UI" fillStyle="#e8f0ff" />
            <g-rect loc={[24, 64, 160, 80]} fillStyle="#2f6fed" />
        </container>
    );
}, myPanelProps);

export const MyPanelUI = new GameUI('my-panel', MyPanel);
```

在已有 UI 中使用 `props.controller.open(MyPanelUI, {})` 打开后，效果就是下面这样。同一个容器里的元素按书写先后顺序叠放，后写的画在上面。

## 运行效果

<ClientOnly>
  <RenderDemo :loader="basicsLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../../.vitepress/components/renderDemo.vue';

const basicsLoader = () =>
    import('../../../.vitepress/components/demos/ui/basics-demo.tsx');
</script>

## 后续

- 摆位置：[容器与坐标](./container-and-coordinates.md)
- 画更多图形：[基础图形](./basic-shapes.md)
- 写字：[文字](./text.md)
- 处理交互：[事件与交互](./events.md)
- 拆组件：[自定义组件](./custom-components.md)
- 接 UI 系统：[UI 系统](./ui-system.md)
