# UI 通用模板

写 UI 时从这段模板开始。

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
        <container loc={FULL_LOC}>{/* 在这里编写自己的 UI 内容 */}</container>
    );
}, myPanelProps);

export const MyPanelUI = new GameUI('my-panel', MyPanel);
```

## 前置知识

无——只要掌握基础 TS/JS，并按本指南的阅读路径阅读即可。

## 模板用法

1. 复制到 `src/client/ui/` 下新建的 `.tsx` 文件（例如 `my-panel.tsx`）。
2. 把 `MyPanel`、`myPanelProps`、`MyPanelUI` 换成自己的名字。
3. 在 `<container>` 里写 UI 内容。
4. 在 `src/client/ui/index.ts` 中导出 `MyPanelUI`。

## 后续阅读

- 先读 [UI 入门](./ui-basics.md)
- 摆放元素：[容器与坐标](./container-and-coordinates.md)
- 画图形：[基础图形](./basic-shapes.md)
- 写字与图片：[文字](./text.md)、[图片与纹理](./image-and-texture.md)
- 让 UI 动起来：[响应式](../advanced/reactivity.md)、[事件与交互](../advanced/events.md)
- 拆组件：[自定义组件](../advanced/custom-components.md)
- 接 UI 系统：[UI 系统](../advanced/ui-system.md)
- 完整示例：[示例（一）目标与骨架](../advanced/inventory-example-1-skeleton.md)
