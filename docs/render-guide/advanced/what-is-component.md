# 什么是组件

组件可以看成 UI 的函数：调用时接收 props，返回一棵 UI 树。同一个组件声明一次，就能在不同位置反复使用；每次传入不同的 props，得到不同的画面。

本篇只讲组件最基本的形态、props 的传法，以及组件与 GameUI 的关系。

## 前置知识

阅读本篇前，建议先读完：

- [UI 入门](../basics/ui-basics.md)

## 用 props 接收数据

组件通过 props 接收父组件给的数据。写法固定为三步：

1. 定义 Props 接口，普通组件继承 `DefaultProps`；
2. 在 `SetupComponentOptions` 的 `props` 数组里列出组件用到的键；
3. 用 `defineComponent<Props>(props => ...)` 声明组件。

只有列在 `props` 数组里的键，才能在子组件里通过 `props` 读到。父组件把值写在组件标签的属性上，子组件通过 `props.x` 读取；某个 props 可以不传时，默认值用 `computed` 派生，props 变化时会重新计算。

## 普通组件：ItemCard

`ItemCard` 接收 `position`、`label`、`color` 三个 props，返回容器、矩形和文字：

```tsx
import { computed, defineComponent } from 'vue';
import { SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';

// 普通组件的 Props 只需要继承 DefaultProps
interface ItemCardProps extends DefaultProps {
    // 卡片相对父容器的横纵坐标
    position: [number, number];
    label: string;
    color?: string;
}

// props 数组列出用到的键，父组件传的值才会进入 props
const itemCardProps = {
    props: ['position', 'label', 'color']
} satisfies SetupComponentOptions<ItemCardProps>;

const ItemCard = defineComponent<ItemCardProps>(props => {
    // 没有传 color 时使用默认颜色
    const color = computed(() => props.color ?? '#f2b84b');

    return () => (
        // 根容器放在 props.position 指定的位置，卡片尺寸由组件自己决定
        <container loc={props.position}>
            <g-rect loc={[0, 0, 220, 64]} fillStyle={color.value} />
            <text loc={[16, 22]} text={props.label} fillStyle="#ffffff" />
        </container>
    );
}, itemCardProps);

export { ItemCard };
```

父组件写 `<ItemCard position={[40, 64]} label="卡片 A" color="#2f6fed" />` 时，`position` 决定卡片位置，`label` 决定文字，`color` 决定矩形颜色；不写 `color` 的卡片使用默认颜色。

## UI 组件：MyPanel

GameUI 也是先声明成一个组件，再用 `new GameUI('id', MyPanel)` 定义为 UI。它和普通组件的区别在参数来源：GameUI 是特殊组件，能接收 UI 参数 `controller`、`instance`、`state`（来自 `IGameUIPropsBase`），由 UI 系统 / 控制器打开。

普通组件更自由，不受 GameUI 约束：它不需要这些 UI 参数，可以嵌套在任意 UI 树里；它不是 UI 入口，只负责画自己那块内容。

下面是一份完整的标准 UI 模板，里面用了两次 `ItemCard`：

```tsx
import { defineComponent } from 'vue';
import { GameUI, SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';
import { IGameUIPropsBase } from '@user/client-base';
import { FULL_LOC } from '@/client';
import { ItemCard } from './item-card';

// UI 组件的 Props 同时继承 IGameUIPropsBase 与 DefaultProps
interface MyPanelProps extends IGameUIPropsBase, DefaultProps {}

// controller、instance、state 来自 IGameUIPropsBase
const myPanelProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<MyPanelProps>;

const MyPanel = defineComponent<MyPanelProps>(props => {
    return () => (
        <container loc={FULL_LOC}>
            {/* 同一个组件用两次，不同的 props 得到不同的卡片 */}
            <ItemCard position={[40, 64]} label="卡片 A" color="#2f6fed" />
            <ItemCard position={[40, 152]} label="卡片 B" />
        </container>
    );
}, myPanelProps);

// 声明成 UI：第一个参数是唯一 id，第二个参数是上面声明的组件
export const MyPanelUI = new GameUI('my-panel', MyPanel);
```

下面用父容器放三张 `ItemCard`，只改 `label` 与 `color`。

<ClientOnly>
  <RenderDemo :loader="componentBasicLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const componentBasicLoader = () =>
    import('../../.vitepress/components/demos/ui/component-basic-demo.tsx');
</script>
