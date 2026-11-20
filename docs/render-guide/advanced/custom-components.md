# 自定义组件

前面的页面已经能用容器、文字、图形与内置组件拼出整块 UI。当同一段 UI 要在多处出现时，把这块 UI 拆成一个自定义组件，声明一次，在各处调用。

这一篇只讲怎么用：怎么接收参数、怎么发事件、怎么留出内容位置，以及怎么把属性透传给内部元素。

## 前置知识

阅读本篇前，建议先读完：

- [什么是组件](./what-is-component.md)
- [内置组件：基础](./builtin-basic.md)

## props

组件的外部参数叫 props。父组件把值写在组件标签的属性上，子组件通过 `props.x` 读取。声明分三步：

1. 定义 Props 接口，普通组件继承 `DefaultProps`；
2. 在 `SetupComponentOptions` 的 `props` 数组里列出用到的键；
3. 用 `defineComponent<Props>(setup, options)` 声明组件。

```tsx
import { computed, defineComponent } from 'vue';

// setup
interface ItemCardProps extends DefaultProps {
    label: string;
    color?: string;
}

const itemCardProps = {
    props: ['label', 'color']
} satisfies SetupComponentOptions<ItemCardProps>;

const ItemCard = defineComponent<ItemCardProps>(props => {
    // 组件内容
    const color = computed(() => props.color ?? '#f2b84b');

    return () => (
        <container loc={[0, 0, 220, 64]}>
            <g-rect loc={[0, 0, 220, 64]} fillStyle={color.value} />
            <text loc={[16, 22]} text={props.label} fillStyle="#ffffff" />
        </container>
    );
}, itemCardProps);
```

父组件把值写在标签上；不传 `color` 时使用默认颜色：

```tsx
<ItemCard label="卡片 A" color="#2f6fed" />
```

## emits

props 负责把数据从父组件传下来，emits 负责把子组件里「发生了什么」报告上去。两者方向相反：父组件通过 props 给子组件输入，子组件通过 emits 通知父组件某个动作已经发生，例如点击、选中、内容变化。父组件收到事件后，用 `on事件名` 挂上处理函数。

事件需要先声明。做法和 props 一致：先定义 Emits 类型，再把事件名写进 `SetupComponentOptions` 的 `emits` 数组，最后让 `defineComponent` 的第二个泛型对应 Emits、第三个泛型对应事件名的联合类型。事件名既出现在类型里，也出现在 `emits` 数组里，两处保持一致。

子组件只通过 `emit` 发事件，不直接改父组件的数据。父组件自己的状态由父组件修改，子组件只负责把「用户点了哪张卡片」这类信息报告出去。

先声明类型与选项：

```tsx
// setup
interface ItemCardProps extends DefaultProps {
    label: string;
}

type ItemCardEmits = {
    pick: (label: string) => void;
};

const itemCardProps = {
    props: ['label'],
    emits: ['pick']
} satisfies SetupComponentOptions<
    ItemCardProps,
    ItemCardEmits,
    keyof ItemCardEmits
>;
```

组件内部用 `emit('pick', ...)` 发出事件：

```tsx
const ItemCard = defineComponent<
    ItemCardProps,
    ItemCardEmits,
    keyof ItemCardEmits
>((props, { emit }) => {
    // 组件内容
    const handleClick = () => {
        emit('pick', props.label);
    };

    return () => (
        <container loc={[0, 0, 220, 64]} onClick={handleClick}>
            <g-rect loc={[0, 0, 220, 64]} fillStyle="#26364d" />
            <text loc={[16, 22]} text={props.label} fillStyle="#ffffff" />
        </container>
    );
}, itemCardProps);
```

父组件在标签上写 `on事件名`，事件的参数会传进处理函数：

```tsx
const handlePick = (label: string) => console.log(label);

<ItemCard label="卡片 A" onPick={handlePick} />;
```

需要双向绑定时，把事件声明为 `update:prop`，子组件发出新值，父组件用 `v-model:prop` 绑定，读值与写回写在同一个绑定里。适合输入框、开关这类「父组件给值、子组件改值」的场景。

## slots

slot 是父组件向子组件内部「插入 UI」的出口。子组件决定插槽放在哪个位置，父组件决定往里面放什么内容。它传的是结构，不是数据：数据仍然走 props，slot 只负责把一段 UI 放进子组件预留的位置。

在 TSX 里，slot 是函数。子组件用 `slots.default?.()` 调用默认 slot，用 `slots.title?.(...)` 调用具名 slot；调用时传的参数会进入父组件的 slot 函数。父组件用标签内容传默认 slot，用对象传具名 slot。

`?.` 不能省略：父组件可能没有传这个 slot，未传时值是 `undefined`，先判断再调用才不会出错。具名 slot 使用对象写法时，默认 slot 也要写在对象里的 `default` 键上，不要同时在标签之间混写普通子元素，否则两处内容会冲突。

如果希望父组件传入的 slot 也有类型检查，可以用 `SlotsType` 声明 slot 的形状，并把它放在 `defineComponent` 的第四个泛型位置。不声明时 slot 是宽松类型，先跑通再补类型也可以。

子组件这一侧先声明参数与选项：

```tsx
// setup
interface PanelProps extends DefaultProps {
    width: number;
    height: number;
}

const panelProps = {
    props: ['width', 'height']
} satisfies SetupComponentOptions<PanelProps>;
```

然后在组件里调用两种 slot：

```tsx
const Panel = defineComponent<PanelProps>((props, { slots }) => {
    // 组件内容
    return () => (
        <container loc={[0, 0, props.width, props.height]}>
            <g-rect
                loc={[0, 0, props.width, props.height]}
                fillStyle="#26364d"
            />
            {slots.title?.('背包')}
            {slots.default?.()}
        </container>
    );
}, panelProps);
```

### 默认 slot

默认 slot 的内容直接写在组件标签之间。父组件放什么，子组件就在 `slots.default?.()` 的位置显示什么：

```tsx
<Panel width={240} height={160}>
    <text loc={[12, 48]} text="面板内容" fillStyle="#ffffff" />
</Panel>
```

### 具名 slot

具名 slot 用一个对象传入，键名就是 slot 名。父组件可以在对象里同时写 `title` 与 `default`；`title` 对应的函数会收到子组件调用 `slots.title?.('背包')` 时传入的参数：

```tsx
<Panel width={240} height={160}>
    {{
        title: (title: string) => (
            <text loc={[12, 12]} text={title} fillStyle="#f2b84b" />
        ),
        default: () => (
            <text loc={[12, 48]} text="面板内容" fillStyle="#ffffff" />
        )
    }}
</Panel>
```

只要用了具名 slot 的对象写法，默认 slot 也写进同一个对象；不要一部分用对象、一部分用标签之间的普通子元素。

## attrs

attrs 是父组件写在标签上、但子组件既没有声明为 props、也没有被 emits 消费的属性。它们没有被组件当成参数，适合用来把底层元素的属性原样透传下去，例如文字的颜色、位置或图片的填充方式。

默认情况下，未声明的属性会自动落到组件的根元素上。如果子组件的根元素不是最终要接收这些属性的元素，就在选项里写 `inheritAttrs: false`，让自动透传停止，再在内部指定的元素上手动展开 `{...attrs}`。

透传时属性名保持 camelCase，和平时写元素属性一致，例如 `fillStyle` 而不是 `fill-style`。

下面把 `text` 与 `fillStyle` 透传给内部的 `text`：

```tsx
// setup
interface FieldProps extends DefaultProps {}

const fieldProps = {
    props: [],
    inheritAttrs: false
} satisfies SetupComponentOptions<FieldProps>;

const Field = defineComponent<FieldProps>((_props, { attrs }) => {
    // 组件内容
    return () => <text {...attrs} />;
}, fieldProps);
```

父组件直接写内部元素要用的属性：

```tsx
<Field loc={[40, 120]} text="属性透传" fillStyle="#7ee787" />
```

`Field` 没有声明 `loc`、`text`、`fillStyle`，它们全部进入 `attrs`，再被展开到内部的 `text` 上。不要同时保留自动透传又手动展开：要么让默认行为把属性落到根元素，要么写 `inheritAttrs: false` 后自己决定落点。

## 组件的调用

下面的模板把「自定义组件 + props + 事件 + 默认 slot」放进一个标准 UI。`ItemCard` 负责卡片本身，内容由调用方的默认 slot 填入；`MyPanel` 用 `ref` 保存选中项，再把 `active` 与 `onPick` 传给卡片。最后用 `new GameUI` 注册成 UI 入口。

```tsx
import { computed, defineComponent, ref } from 'vue';
import { GameUI, SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';
import { IGameUIPropsBase } from '@user/client-base';
import { FULL_LOC } from '@/client';

// 自定义组件：显示一张可选的卡片，底部内容由默认 slot 决定
interface ItemCardProps extends DefaultProps {
    label: string;
    active?: boolean;
}

type ItemCardEmits = {
    pick: (label: string) => void;
};

const itemCardProps = {
    props: ['label', 'active'],
    emits: ['pick']
} satisfies SetupComponentOptions<
    ItemCardProps,
    ItemCardEmits,
    keyof ItemCardEmits
>;

const ItemCard = defineComponent<
    ItemCardProps,
    ItemCardEmits,
    keyof ItemCardEmits
>((props, { emit, slots }) => {
    const fill = computed(() => (props.active ? '#2f6fed' : '#26364d'));
    const handleClick = () => {
        emit('pick', props.label);
    };

    return () => (
        <container loc={[0, 0, 200, 96]} onClick={handleClick}>
            <g-rect loc={[0, 0, 200, 96]} fillStyle={fill.value} />
            <text loc={[12, 12]} text={props.label} fillStyle="#ffffff" />
            {slots.default?.()}
        </container>
    );
}, itemCardProps);

// UI 组件：把卡片放进整屏容器，并管理选中项
interface MyPanelProps extends IGameUIPropsBase, DefaultProps {}

const myPanelProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<MyPanelProps>;

const MyPanel = defineComponent<MyPanelProps>(props => {
    const selected = ref('甲');
    const handlePick = (label: string) => {
        selected.value = label;
    };

    return () => (
        <container loc={FULL_LOC}>
            <ItemCard
                label="甲"
                active={selected.value === '甲'}
                onPick={handlePick}
            >
                <text loc={[12, 60]} text="点我选择" fillStyle="#cfe0ff" />
            </ItemCard>
        </container>
    );
}, myPanelProps);

export const MyPanelUI = new GameUI('my-panel', MyPanel);
```

把这个文件放到 `src/client/ui/` 下，在 `src/client/ui/index.ts` 导出 `MyPanelUI`，就可以用 `props.controller.open(MyPanelUI, {})` 打开。

## 运行效果

下面用两个 `ItemCard` 演示 props、事件与默认 slot：点击卡片会切换选中态，卡片底部的内容由默认 slot 传入。

<ClientOnly>
  <RenderDemo :loader="customComponentsLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const customComponentsLoader = () =>
    import('../../.vitepress/components/demos/ui/custom-components-demo.tsx');
</script>
