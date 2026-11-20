# Phase 10 · 高级 II 子分组「自定义 UI 与渲染」调研

**调研日期：** 2026-10-30
**调研对象：** 27 篇 UI / 渲染文档（高级 II 新增子分组）
**调研方式：** 只读源码 + 现有文档结构 + Git 历史；未修改 docs / 代码 / 测试 / 计划 / ROADMAP / STATE；未 commit。
**基线：** `b94b4c3b41da8184312bc9f264654dc9a54adf69`（2026-10-29 21:19:59 +0800）

<user_constraints>
## User Constraints（本次派发锁定决策，已按 2026-10-30 修订）

1. **目标读者**：完全没写过 UI、连 canvas 都不知道是什么的作者；**不假设会 Vue**，但只讲写 UI 必需的 Vue 概念（响应式、props、条件、循环、组件、slots、attrs），不讲 `createApp` 等作者不需要调用的东西。
2. **示例写法**：UI 示例全部用 **TSX**；**不用 SFC**；**没有 `v-if` / `v-for`**；条件用 `hidden` 或三元，循环用 `.map()`。`key` 只在列表会重排/插入/删除且需要保留身份时加（`dev.md:122`），不是每个 `.map()` 都必须加。
3. **`hidden` 优先**：`hidden` = **不显示、不交互**；保留元素与状态，跳过绘制与命中。性能篇必须明确“优先用 `hidden`”；三元会创建/销毁并重置状态，只在“必须真正不存在 / 需要重置状态或生命周期 / 子树很重且长期不需要”时使用。
4. **TS 写法**：只讲元素层接口（如 `appendChild`）在 UI 组件内的用法；**不引入 `MotaRenderer` / 渲染器架构 / 初始化**。live 不需要为 TS 专门适配——live 用 TSX 组件展示，代码块里给 TS 写法即可。
5. **忽略 `core.*`**：当它不存在；文档不引用、不 mock、不解释；依赖它的组件照常写对外用法；live 跑不起来也保留内容。
6. **不含 Thumbnail / Tip**；`icon` / `winskin` / `map-render` 只作占位，不展开内部。
7. **参考文件**：其他工作树中未完善/未提交的 UI 组件（如 `src/client/ui/book.tsx`、`bookDetail.tsx`、`equipbox.tsx`、`hotkey.tsx`、`toolbox.tsx` 等）仍排除。`src/client/ui/choices.tsx` 例外：**仅允许读取 props / emits / 函数签名**，不引用实现细节。文档写作过程中若这些文件变化，必须停下向用户确认。
8. **旧文档**：git 历史里有旧版渲染系统文档，讲得不好、接口有差距，不作为依据；其中**旧性能优化文档**仍可参考。已定位为 `docs/guide/ui/perf.md`（`6bf3217` 新增、`e3d61ee` 删除）；`sprite` → `custom` 的映射保留。
9. **按键系统**：只写 UI 编写会用到的接口与概念，1 篇；不要展开 `saveState` / `loadState` / `listen` / `preventDefault` / 内部实现。
10. **落位**：先写到高级 II（新增子分组），写完后再评估局部合并/拆分；不预先锁死。
11. **live**：不要求一定能跑；按内容需要放，跑不起来也保留。live 用现有 `RenderDemo` + TSX demo 组件，不展示源码。
12. **不汇报** 引擎内部语法/类型报错，也不汇报“实现与注释不符”的内容。
13. **完整示例**：背包/装备面板；6 篇分步写，每步只加一小段代码 + 一个 live 检查点，不一次性贴几百行。
14. **作者入口**：用 `ClientCore.sceneController`。不需要验证实际能否显示/运行；文档按代码要求的写法写，不因“现在没做完、跑不起来”删内容或改成占位。Toolkit 不存在也没关系，按 `sceneController` 的写法讲。
15. **Props 类型**：每个 UI 的 Props 必须继承 `IGameUIPropsBase`（不是 `IUIPropsBase`），并继承 `DefaultProps`。
16. **内置 UI 定义**：指 `src/client/ui` 里的 UI（设置、存档、工具栏等），不是泛指内置组件。
17. **特殊组件**：`InputBox` / `ConfirmBox` / `Choices`（用户或称 ChoicesBox）都属于特殊组件；`Choices` 必须写，只按接口讲，不参考实现细节。
18. **emits**：`update:selected` 这类 emits 是为了支持 `v-model:selected` 双向绑定；不要教读者手动监听 `onUpdate:selected`。
19. **useKey**：组件内典型写法是 `useKey(...)!` 非空断言；不要加多余的类型守卫。
20. **容器标签**：统一用 `container-custom`（不是 `custom-container`）。

</user_constraints>

## Page Plan（27 篇，按此顺序调研；文件名待 Task 0 确认）

**Part 0 起步（2）**

1. UI 通用模板（TSX）
2. 同一 UI 的 TS 直调写法

**Part 1 元素与布局（6）**

3. 容器与坐标
4. 基础图形（g-rect / g-circle / g-ellipse / g-line）
5. 曲线与路径（g-bezier / g-quad / g-path / g-rectr）
6. 文字
7. 图片与最小纹理
8. 层级、变换与性能（zIndex / scale / rotate / alpha / hidden / cache / nocache / HD / anti；hidden 优先）

**Part 2 交互与数据（4）**

9. 响应式（ref / reactive / computed / watch，从零讲）
10. 事件与交互
11. 按键与快捷键（UI 中用到的部分，1 篇）
12. 条件渲染与循环渲染（hidden 优先 vs 三元；`.map` + key）

**Part 3 组件化（4）**

13. props
14. 组件（TSX）
15. 组件（TS 直调）
16. slots 与 attrs

**Part 4 内置组件与 UI 系统（5）**

17. 内置组件（文本/输入）：TextContent / Textbox / Input / InputBox
18. 内置组件（列表/容器）：List / Page / Scroll / Selection / Choices
19. UIController 与 UI 栈
20. 修改/替换内置 UI
21. UI 系统性能与注意事项

**Part 5 完整示例（6）**

22. 示例（一）目标与骨架
23. 示例（二）道具网格
24. 示例（三）详情区
25. 示例（四）滚动与列表
26. 示例（五）交互与状态
27. 示例（六）动画、拆分与注册

## Summary

这一批 27 篇的目标，是把“作者第一次写 UI”到“能拆组件、能接 UI 栈、能做背包面板”的路径铺出来。作者写 TSX：Vue 负责组件与响应式，元素层负责画布与交互。文档必须把 **camelCase 属性名、标签名、事件名** 写准，否则不会报错但也不会生效。

作者入口统一讲 `ClientCore.sceneController`：`client.sceneController.open(MyUI, {})`。不需要验证当前是否真的能显示/运行，也不因为 Toolkit 不存在而把入口写成占位；文档按 `sceneController` 的代码写法讲。主场景内的主 UI 栈使用 `mainUIController.render()`（`src/client/ui/main.tsx`），作者不需要了解渲染器初始化。

UI 的 Props 统一继承 `IGameUIPropsBase` 与 `DefaultProps`（不是 `IUIPropsBase`）。`hidden` = 不显示、不交互；`key` 只在需要身份时加；容器标签统一写 `container-custom`；特殊组件 `InputBox` / `ConfirmBox` / `Choices` 都要写，`Choices` 只按接口讲。

**Primary recommendation：** 先按 `docs/advanced/ii/ui/` 建 27 篇、6 个子分组；第 1 篇用 `ClientCore.sceneController` + `IGameUIPropsBase, DefaultProps` 的模板；所有示例只用 TSX，属性名只用 camelCase，不写 SFC / `v-if` / `v-for`。

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| UI 画面与布局 | Vue 组件（TSX） | 元素层（`container` / `g-*`） | 作者用 TSX 描述结构，元素层负责画布绘制 |
| 单个图形 / 文字 / 图片 | 元素层（`RenderItem`） | Vue 组件（可选包装） | 元素本身不依赖 Vue；TSX 只是创建方式之一 |
| 交互事件 | 元素层事件 | Vue 组件（`onXxx`） | 命中测试与冒泡在元素层完成，Vue 只负责监听回调 |
| 响应式状态 | Vue 响应式 | 元素属性 | `ref` / `computed` 驱动 TSX 重渲染，再经 `patchProp` 落到元素 |
| UI 打开 / 关闭 / 栈 | `UIController` / `UIInstance` | `GameUI` / `UIContainer` | 控制器管栈与背景，容器负责把栈映射为组件树 |
| 按键 | `HotkeySystem` / `useKey` | UI 组件生命周期 | 按键作用域跟随组件挂载/卸载 |
| 内置组件 | `@user/client-base` 组件 | 元素层 | 组件封装了常用 UI 结构与交互 |
| 特殊组件 | `InputBox` / `ConfirmBox` / `Choices` | UI 栈 | 单次调用型 UI，内部用 `controller.open` |
| 内置 UI | `src/client/ui` 的 UI | `GameUI` | 设置、存档、工具栏等应用层 UI |
| 文档 live | `RenderDemo` + TSX demo | 元素层 / 内置组件 | POC 已证明可嵌入 VitePress |
| 作者入口 | `ClientCore.sceneController` | `mainUIController` | 场景 UI / 主 UI 各有一个控制器 |

## Standard Stack

本批不新增依赖。与写作相关的现有版本（`package.json`）：

| Package | Version | Purpose |
|---------|---------|---------|
| `vue` | `^3.5.29` | 组件与响应式 |
| `@vitejs/plugin-vue-jsx` | `^5.1.4` | TSX 编译 |
| `vitepress` | `^1.6.4` | 文档站与 live 容器 |
| `prettier` | `^3.8.1` | 文档格式化（D-45） |
| `typescript` | `6.0.3` | 类型检查 |

**Package Legitimacy Audit：** 本批不安装任何新包；只使用仓库已存在的依赖，因此无需新增合法性审计。若后续为 live 引入新包，必须重新跑 `package-legitimacy check`。

## Author Entry

### 作者入口：`ClientCore.sceneController`

作者入口统一讲 **`ClientCore.sceneController`**。UI 本身仍然是 **Vue 组件 + `GameUI` + `UIController.open`**；`GameUI` 只是 `{ name, component }` 的容器：

```ts
// packages/system/src/ui/ui.ts:3-12（逐字）
export class GameUI<C extends UIComponent> implements IGameUI<C> {
    // TODO: 这个静态成员是否可以考虑删除？

    /** 当前的所有已声明 UI，用于全局性获取 */
    static list: Map<string, GameUI<UIComponent>> = new Map();

    constructor(
        public readonly name: string,
        public readonly component: C
    ) {}
```

`UIController.open` 返回 `IUIInstance`，把实例放进栈并交给显示策略：

```ts
// packages/system/src/ui/controller.ts:121-132（逐字）
    open<C extends UIComponent>(
        ui: IGameUI<C>,
        vBind: UIRawProps<C, PB>,
        alwaysShow: boolean = false
    ): IUIInstance<C, PB> {
        const ins = new UIInstance(ui, vBind, alwaysShow);
        this.strategy.open(ins, this.stack);
        this.sysShowBack.value = true;
        this.active.value = true;

        return ins;
    }
```

主 UI 的挂载写法在 `src/client/ui/main.tsx`：由一个 `container` 包住 `mainUIController.render()`，并根据 `active` 决定是否隐藏：

```tsx
// src/client/ui/main.tsx:149-155（逐字）
            <container
                loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
                hidden={!props.state.mainUIController.active.value}
                zIndex={200}
            >
                {props.state.mainUIController.render()}
            </container>
```

作者打开 UI 用 `client.sceneController.open(...)`；这是本批文档的主入口：

```ts
// src/bootstrap.ts:12-16（逐字）
const client = createClientCore(new WebLoadStarter());

// 游戏副作用启动
window.mainClient = client;
client.sceneController.open(LoadSceneUI, {});
```

主场景内的主 UI 栈（设置、存档等）由 `mainUIController.render()` 放进主场景 `container`（`src/client/ui/main.tsx:149-155`）。这是现有应用层用法；作者写 UI 时不需要了解渲染器初始化，也不需要自己创建 renderer。

### 最小 TSX 模板（第 1 篇可直接给作者）

```tsx
import { defineComponent } from 'vue';
import { GameUI, SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';
import { IGameUIPropsBase } from '@user/client-base';

interface MyPanelProps extends IGameUIPropsBase, DefaultProps {}

const myPanelProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<MyPanelProps>;

const MyPanel = defineComponent<MyPanelProps>(props => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fill fillStyle="#1d2b45" />
            <text loc={[24, 24]} text="我的第一个 UI" fillStyle="#e8f0ff" />
        </container>
    );
}, myPanelProps);

export const MyPanelUI = new GameUI('my-panel', MyPanel);
```

打开与关闭：

```tsx
// 主入口：场景控制器
client.sceneController.open(MyPanelUI, {});

// 在另一个 UI 内打开
props.controller.open(MyPanelUI, {});

// 关闭自己
props.controller.close(props.instance);

// 主场景内的主 UI 栈
props.state.mainUIController.open(MyPanelUI, {});
```

**只改哪几行：**

| 要改的地方 | 说明 |
|------------|------|
| 文件名 / 组件名 / `GameUI` 名称 | 建议 `my-panel.tsx` / `MyPanel` / `'my-panel'` |
| `container loc` | 画布大小，示例 `[0, 0, 480, 320]` |
| 里面的元素 | 先只留 `<g-rect>` + `<text>`，确认能显示 |
| Props 基类 | 必须 `extends IGameUIPropsBase, DefaultProps`；不要用 `IUIPropsBase` |
| `props` 列表 | 必须包含 `controller`、`instance`、`state`；少一个就拿不到 |
| 打开处 | 主入口 `client.sceneController.open`；UI 内 `props.controller.open`；主 UI 栈 `props.state.mainUIController.open` |

### 同一 UI 的 TS 写法（元素层，第 2 篇对照）

应用层 TS 写法只讲**元素层接口**在 UI 组件内的用法，不引入 `MotaRenderer`、`createElement`、`registerElement` 或渲染器初始化。做法是先用 `ref` 拿到 TSX 里的 `container`，再在 `onMounted` 里 `new` 元素并 `appendChild`。以下片段位于组件的 `setup` 内，最终文档要给完整组件片段（D-62）：

```tsx
import { Container, Rect, Text } from '@motajs/render';
import { onMounted, ref } from 'vue';

const host = ref<Container>();

onMounted(() => {
    const rect = new Rect();
    rect.size(120, 48);
    rect.setFillStyle('#2f6fed');

    const label = new Text('TS 写法');
    label.pos(12, 12);

    host.value!.appendChild(rect, label);
});

return () => <container ref={host} loc={[0, 0, 240, 120]} />;
```

要点：

- `Container` / `Rect` / `Text` 都是元素层类；`appendChild` 是 `Container` 的方法。
- `ref` 要等挂载后才拿到实例，所以放在 `onMounted`；`host.value!` 是组件内必定存在的非空断言。
- TS 写法不参与 Vue 响应式；改属性用 `size` / `pos` / `setFillStyle` / `setText` 等 setter。
- 按标签字符串创建元素（`createElement`）属于渲染器内部，不在应用层文档展开；第 15 篇只讲元素类 + `appendChild`，不讲自定义标签注册。

### 入口说明

本批文档不依赖 Toolkit，也不把入口写成占位。第 1 篇直接按 `client.sceneController.open(...)` 讲；显示由现有应用入口负责，作者不需要验证“现在能不能跑起来”。

## Render Elements

### 标签注册表（内部核对，不写进正文）

元素层内置标签如下（源码内部注册，供写作核对；文档不展开渲染器）：

```ts
// packages/render/src/core/render.ts:237-254（逐字）
    private registerIntrinsicTags() {
        this.registerElement('container', Container);
        this.registerElement('custom', CustomRenderItem);
        this.registerElement('text', Text);
        this.registerElement('image', Image);
        this.registerElement('shader', Shader);
        this.registerElement('comment', Comment);
        this.registerElement('template', Container);
        this.registerElement('custom-container', CustomContainer);
        this.registerElement('g-rect', Rect);
        this.registerElement('g-circle', Circle);
        this.registerElement('g-ellipse', Ellipse);
        this.registerElement('g-line', Line);
        this.registerElement('g-bezier', BezierCurve);
        this.registerElement('g-quad', QuadraticCurve);
        this.registerElement('g-path', Path);
        this.registerElement('g-rectr', RectR);
    }
```

**文档统一口径：** 容器自定义标签写 `container-custom`（JSX 类型声明与 `Scroll` 内部用法都是这个名）。源码 `render.ts` / `tag.ts` 的内部注册名仅供核对，不写进正文，也不作为读者需要理解的概念。

TSX 侧还有三个应用层标签：`icon`、`winskin`、`map-render`（`packages-user/client-base/src/elements/index.ts:8-44`）。按锁定决策 6，这三者只作占位，不展开内部。

| 标签 | 对应类 | TSX 默认缓存 | 主要用途 |
|------|--------|--------------|----------|
| `container` | `Container` | 开 | 容器、布局、分组、事件捕获 |
| `custom` | `CustomRenderItem` | 开 | 自定义 canvas 绘制 |
| `text` | `Text` | 关（`nocache` 默认 true） | 单行文字 |
| `image` | `Image` | 关 | 贴图 |
| `shader` | `Shader` | 无参数 | WebGL 着色器（本批不展开） |
| `comment` | `Comment` | 无参数 | 注释 / 占位节点 |
| `template` | `Container` | 关 | 模板容器 |
| `container-custom` | `CustomContainer` | 开 | 自定义渲染 + 自定义事件传递（文档统一名） |
| `g-rect` | `Rect` | 关 | 矩形 |
| `g-circle` | `Circle` | 关 | 圆 |
| `g-ellipse` | `Ellipse` | 关 | 椭圆 |
| `g-line` | `Line` | 关 | 直线 |
| `g-bezier` | `BezierCurve` | 关 | 三次贝塞尔 |
| `g-quad` | `QuadraticCurve` | 关 | 二次贝塞尔 |
| `g-path` | `Path` | 关 | `Path2D` 路径 |
| `g-rectr` | `RectR` | 关 | 圆角矩形 |

缓存默认值来自 `tag.ts`：标准元素用 `createStandardElement(默认是否缓存, 类)`，传入 `nocache` 时 `cache && !nocache` 强制为假：

```ts
// packages/render-vue/src/tag.ts:103-115（逐字）
    createStandardElement(
        cache: boolean,
        Cons: new (enableCache?: boolean) => IRenderItem
    ): TagCreateFunction {
        const enable = cache;
        return props => {
            if (!props) {
                return this.renderer.createElement(Cons, enable);
            }
            const { nocache = !enable, cache = enable } = props;
            return this.renderer.createElement(Cons, cache && !nocache);
        };
    }
```

### 所有元素共有的属性

`RenderItem` 的默认值（节选，逐字）：

```ts
// packages/render/src/core/item.ts:49-85（逐字节选）
    /** 元素纵深，表示了遮挡关系 */
    zIndex: number = 0;
    /** 元素横坐标 */
    x: number = 0;
    /** 元素纵坐标 */
    y: number = 0;
    /** 元素宽度 */
    width: number = 200;
    /** 元素高度 */
    height: number = 200;
    /** 该元素的变换矩阵 */
    transform: Transform = new Transform();
    /** 渲染锚点，(0,0)表示左上角，(1,1)表示右下角 */
    anchorX: number = 0;
    /** 渲染锚点，(0,0)表示左上角，(1,1)表示右下角 */
    anchorY: number = 0;
    /** 渲染定位模式 */
    position: RenderPosition = RenderPosition.Absolute;
    /** 是否是高清画布 */
    highResolution: boolean = true;
    /** 是否抗锯齿 */
    antiAliasing: boolean = true;
    /** 是否被隐藏 */
    hidden: boolean = false;
    /** 滤镜 */
    filter: string = 'none';
    /** 混合方式 */
    composite: GlobalCompositeOperation = 'source-over';
    /** 不透明度 */
    alpha: number = 1;
    /** 缩放比 */
    scale: number = 1;
    /** 鼠标覆盖在此元素上时的光标样式 */
    cursor: string = 'inherit';

    /** 该元素是否忽略交互事件 */
    noEvent: boolean = false;
```

TSX 侧 `BaseProps` 还提供简写属性：

```ts
// packages/render-vue/src/props.ts:24-81（逐字节选）
export interface BaseProps {
    x?: number;
    y?: number;
    anchorX?: number;
    anchorY?: number;
    zIndex?: number;
    width?: number;
    height?: number;
    filter?: string;
    hd?: boolean;
    anti?: boolean;
    noanti?: boolean;
    hidden?: boolean;
    transform?: Transform;
    type?: RenderPosition;
    cache?: boolean;
    nocache?: boolean;
    fall?: boolean;
    id?: string;
    alpha?: number;
    composite?: GlobalCompositeOperation;
    cursor?: string;
    loc?: ElementLocator;
    anc?: ElementAnchor;
    scale?: ElementScale;
    rotate?: number;
    noevent?: boolean;
}
```

`loc` 的顺序是 `[x, y, width, height, anchorX, anchorY]`：

```ts
// packages/render/src/core/types.ts:37-44（逐字）
export type ElementLocator = [
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    anchorX?: number,
    anchorY?: number
];
```

**属性名必须是 camelCase。** `patchProp` 的 `switch` 只识别这些键；`anchor-x`、`z-index` 之类的 kebab-case 不会命中，也不会报错：

`patchProp` 的 `switch` 支持的键（`packages/render/src/core/item.ts:975-1110`）：`x`、`y`、`anchorX`、`anchorY`、`zIndex`、`width`、`height`、`filter`、`hd`、`anti`、`noanti`、`hidden`、`transform`、`type`、`id`、`alpha`、`composite`、`loc`、`anc`、`cursor`、`scale`、`rotate`、`noevent`。除此之外的键会走 `parseEvent`，再不行就静默忽略。

事件属性走 `parseEvent`：`on` + 大写字母转小写，例如 `onClick` → `click`、`onClickCapture` → `clickCapture`、`onUpdate:value` → `update:value`：

```ts
// packages/render/src/core/item.ts:934-942（逐字）
    protected parseEvent(key: string): string {
        if (key.startsWith('on')) {
            const code = key.charCodeAt(2);
            if (code >= 65 && code <= 90) {
                return key[2].toLowerCase() + key.slice(3);
            }
        }
        return '';
    }
```

### 各元素的专属属性

| 标签 | 专属属性（TSX） | 默认值 / 语义 | 源码 |
|------|------------------|----------------|------|
| `text` | `text`、`fillStyle`、`strokeStyle`、`font`、`strokeWidth` | `fillStyle='#fff'`；`font=new Font()`（Verdana 16）；`strokeWidth=1`；文字尺寸自动计算 | `packages/render/src/core/misc.ts:10-147` |
| `image` | `image` | `ITexture \| null`；按元素 `width/height` 拉伸绘制 | `packages/render/src/core/misc.ts:150-192` |
| `g-rect` | `fill`、`stroke`、`strokeAndFill`、`fillRule`、`fillStyle`、`strokeStyle`、`lineWidth`、`lineDash`、`lineDashOffset`、`lineJoin`、`lineCap`、`miterLimit`、`actionStroke` | 默认填充；`fillStyle='#ddd'`；`lineWidth=2`；`fillRule='nonzero'` | `packages/render/src/core/graphics.ts:32-298` |
| `g-circle` | 上述图形属性 + `radius`、`start`、`end`、`circle` | `radius=10`；`start=0`；`end=2π`；锚点默认 0.5 | `packages/render/src/core/graphics.ts:318-390` |
| `g-ellipse` | 上述图形属性 + `radiusX`、`radiusY`、`start`、`end`、`ellipse` | `radiusX=radiusY=10`；锚点默认 0.5 | `packages/render/src/core/graphics.ts:393-480` |
| `g-line` | 上述图形属性 + `x1`、`y1`、`x2`、`y2`、`line` | 默认描边；自动按两点计算位置与大小 | `packages/render/src/core/graphics.ts:483-561` |
| `g-bezier` | 上述图形属性 + `sx/sy/cp1x/cp1y/cp2x/cp2y/ex/ey`、`curve` | 默认描边；`curve` 为 8 元数组 | `packages/render/src/core/graphics.ts:564-694` |
| `g-quad` | 上述图形属性 + `sx/sy/cpx/cpy/ex/ey`、`curve` | 默认描边；`curve` 为 6 元数组 | `packages/render/src/core/graphics.ts:697-816` |
| `g-path` | 上述图形属性 + `path` | `path: Path2D`；默认填充 | `packages/render/src/core/graphics.ts:819-862` |
| `g-rectr` | 上述图形属性 + `circle`、`ellipse` | 圆角半径数组；`circle` 1–4 项，`ellipse` 2/4/6/8 项 | `packages/render/src/core/graphics.ts:865-1014` |
| `custom` | `render`、`bindings` | `render(canvas)`；`bindings: Ref<any>[]` 变化时自动 `update` | `packages/render/src/core/custom.ts:6-59` |
| `container-custom` | `render`、`propagate` | 自定义容器渲染 / 事件传递（文档统一名） | `packages/render/src/core/container.ts:126-189` |

### 事件

可监听的事件名（TSX 用 `onXxx`）：

```ts
// packages/render/src/core/event.ts:109-134（逐字）
export interface ERenderItemActionEvent {
    /** 当这个元素被点击时的捕获阶段触发 */
    clickCapture: [ev: Readonly<IActionEvent>];
    /** 当这个元素被点击时的冒泡阶段触发 */
    click: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上按下的捕获阶段触发 */
    downCapture: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上按下的冒泡阶段触发 */
    down: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上移动的捕获阶段触发 */
    moveCapture: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上移动的冒泡阶段触发 */
    move: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上抬起的捕获阶段触发 */
    upCapture: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指在该元素上抬起的冒泡阶段触发 */
    up: [ev: Readonly<IActionEvent>];
    /** 当鼠标或手指进入该元素时触发 */
    enter: [ev: Readonly<IActionEventBase>];
    /** 当鼠标或手指离开该元素时触发 */
    leave: [ev: Readonly<IActionEventBase>];
    /** 当鼠标滚轮时的捕获阶段触发 */
    wheelCapture: [ev: Readonly<IWheelEvent>];
    /** 当鼠标滚轮时的冒泡阶段触发 */
    wheel: [ev: Readonly<IWheelEvent>];
}
```

`IActionEvent` 的字段（`offsetX/offsetY` 相对元素、`absoluteX/absoluteY` 相对画布、`identifier`、`type`、`buttons`、修饰键、`stopPropagation`）见 `packages/render/src/core/event.ts:52-107`。

### 占位 / 重构点（不要写死）

| 项 | 现状 | 写作建议 |
|----|------|----------|
| `fall` | `BaseProps` 声明了 `fall?: boolean`，但 `patchProp` 没有处理 | 不写，或标“占位，暂未接入” |
| `type` | `RenderPosition` 只有一个值 `Absolute` | 只写“目前只有绝对定位”，不展开 |
| `container-custom` | 文档统一使用该名；JSX 类型声明与 `Scroll` 用法一致 | 只按 `container-custom` 写，不解释内部注册 |
| `icon` / `winskin` / `map-render` | 应用层标签，依赖素材 / 地图 | 只作占位，不展开内部 |
| `core.*` | 部分内置组件依赖 | 按锁定决策 5 忽略，不引用、不 mock、不解释 |

## Vue / TSX Integration

### TSX 与元素层

作者只需要知道三件事：

1. TSX 标签必须是已注册的元素标签；标签名按本文件“标签注册表”的文档口径写。
2. 属性名必须是 camelCase；TSX 的 `onXxx` 会变成元素事件。
3. 在 UI 组件里需要命令式创建元素时，用 `ref` 拿 `container`，再 `appendChild`（第 2 篇）；不引入渲染器、`createElement`、`registerElement`。

标签注册、渲染器初始化、node ops 都属于渲染器内部，本批应用层文档不展开。研究文件中保留 `render.ts` / `render-vue` 的引用只用于核对元素行为（见 Reference Manifest A/B），不写进正文。

### 原生文本节点

TSX 里直接写裸文本不会被当作文字元素；空白会变成 `Comment`，非空白会警告并生成 `Text`：

```ts
// packages/render-vue/src/renderer.ts:67-74（逐字）
        createText: function (text: string): IRenderItem {
            if (/^\s*$/.test(text)) {
                return new Comment();
            } else {
                logger.warn(38);
            }
            return new Text(text);
        },
```

因此文档示例统一写 `<text text="..." />`，不写 `<container>文字</container>`。

### `hidden` 与三元的差异（源码核对）

源码中 `hidden` 同时跳过渲染与捕获：

```ts
// packages/render/src/core/container.ts:24-27（逐字）
        this.sortedChildren.forEach(v => {
            if (v.hidden) return;
            v.renderContent(canvas);
        });
```

```ts
// packages/render/src/core/container.ts:99-107（逐字）
        if (progress === EventProgress.Capture) {
            let success = false;
            for (let i = len - 1; i >= 0; i--) {
                const child = this.sortedChildren[i];
                if (child.hidden) continue;
                if (child.captureEvent(type, event)) {
                    success = true;
                    break;
                }
            }
```

`RenderItem.renderContent` 也直接 `return`：

```ts
// packages/render/src/core/item.ts:196-198（逐字）
    renderContent(canvas: MotaOffscreenCanvas2D) {
        if (this.hidden) return;
```

**结论（已确认）：** `hidden` 就是 **不显示、不交互**：不绘制、不参与捕获命中，但保留元素、组件实例与状态。文档统一按这个口径写；`noevent` 是另一件事，用于“元素可见但不想接收交互”的场景，不要把它写成 `hidden` 的配套防御。

三元表达式会真正移除节点：Vue 的 diff 调用 `remove(el)` → `el.destroy()`（`packages/render-vue/src/renderer.ts:49-51`）。因此：

- `hidden`：保留组件实例、保留状态、保留生命周期；适合频繁切换。
- 三元：卸载组件、重置状态、释放子树；适合“必须不存在 / 必须重置 / 子树很重且长期不用”。
- 不要为了规避“重新挂载”问题而加 `key`；`dev.md:122-123` 明确要求按“元素可以正常重新挂载”假设写代码。

### 列表与 `key`

Vue 的 TSX 循环就是 `.map()`：

```tsx
{items.value.map(item => (
    <ItemCell key={item.id} item={item} />
))}
```

`key` 的作用是保留元素身份；`dev.md:122` 规定：

> `key` 仅在列表会重排、插入、删除且需要保留元素身份（尤其是有状态组件）时使用；无状态、顺序固定的列表不要添加 `key`。

文档统一写“用 `.map()`；`key` 只在会重排/增删且需要保留身份时加”。不要写成“每个 `.map()` 都必须加 key”。

### `noevent`、冒泡与捕获

- `noevent` 让 `processEvent` 直接返回 `null`，事件下穿，`cursor` 也失效（`packages/render/src/core/item.ts:757`、`1106-1109`）。
- `Container.propagateEvent` 捕获阶段从 `sortedChildren` 末尾向前遍历（高 `zIndex` 优先）；子元素捕获成功则停止，否则父元素冒泡（`packages/render/src/core/container.ts:93-116`）。
- `stopPropagation()` 在捕获阶段阻止继续捕获，在冒泡阶段阻止继续冒泡；不阻止同一元素的其他监听器（`packages/render/src/core/event.ts:90-95`）。
- `enter` / `leave` 由根节点的 hover 集合统一触发（`packages/render/src/core/render.ts:671-719`），不是普通冒泡事件。

## UI System

### 模型

UI 系统分四层：

| 层 | 对象 | 职责 |
|----|------|------|
| 声明 | `GameUI` | 把名字和 Vue 组件绑在一起，供 `open` 使用 |
| 控制 | `UIController` | 管栈、背景、显示策略、`active` / `showBack` |
| 实例 | `UIInstance` | 一次打开产生的实例：`key`、`vBind`、`hidden`、`alwaysShow` |
| 显示 | `UIContainer` | 把背景 + 栈映射为组件树，设置 `hidden` 与 `zIndex` |

`IGameUI` 只有两个成员：

```ts
// packages/system/src/ui/types.ts:34-39（逐字）
export interface IGameUI<C extends UIComponent = UIComponent> {
    /** 这个 UI 的名称 */
    readonly name: string;
    /** 这个 UI 的 vue 组件对象 */
    readonly component: C;
}
```

`UIController` 的关键成员：

```ts
// packages/system/src/ui/controller.ts:29-35（逐字）
    readonly stack: IUIInstance<UIComponent, PB>[] = shallowReactive([]);
    readonly backIns: ShallowRef<IUIInstance<UIComponent, PB> | null>;

    background: IGameUI | null = null;
    active: Ref<boolean> = ref(false);

    readonly showBack: Ref<boolean>;
```

`UIInstance` 把 `vBind` 包成 `reactive`，并保存 `hidden`：

```ts
// packages/system/src/ui/instance.ts:13-40（逐字）
export class UIInstance<
    C extends UIComponent,
    PB extends IUIDefaultPropsBase<C>
> implements IUIInstance<C, PB> {
    readonly key: number = counter++;
    readonly ui: IGameUI<C>;
    readonly hidden: Ref<boolean> = ref(false);
    readonly vBind: Reactive<UIRawProps<C, PB>>;
    readonly alwaysShow: boolean;

    constructor(
        ui: IGameUI<C>,
        vBind: UIRawProps<C, PB>,
        alwaysShow: boolean = false
    ) {
        this.ui = ui;
        this.vBind = reactive(vBind);
        this.alwaysShow = alwaysShow;
    }

    hide(): void {
        if (!this.alwaysShow) this.hidden.value = true;
    }

    show(): void {
        this.hidden.value = false;
    }
}
```

`UIContainer` 的渲染规则：背景 `zIndex=0`；栈中第 `i` 个实例 `zIndex=i*5`；`hidden` 直接传给组件：

```tsx
// packages/system/src/ui/container.tsx:14-47（逐字）
export const UIContainer = defineComponent<IUIContainerProps>(props => {
    const data = props.controller;
    const back = data.backIns;
    return (): VNode[] => {
        const elements: VNode[] = [];
        const b = back.value;
        if (data.showBack.value && b && !b.hidden) {
            elements.push(
                <b.ui.component
                    {...b.vBind}
                    controller={data}
                    instance={b}
                    key={b.key}
                    hidden={b.hidden && !b.alwaysShow}
                    zIndex={0}
                ></b.ui.component>
            );
        }
        return elements.concat(
            data.stack.map((v, i) => {
                const pb = data.createPropsBase(v);
                return (
                    <v.ui.component
                        {...v.vBind}
                        {...pb}
                        key={v.key}
                        hidden={v.hidden.value}
                        zIndex={i * 5}
                    ></v.ui.component>
                );
            })
        );
    };
}, containerConfig);
```

### 打开 / 关闭 / 栈

| 方法 | 行为 | 源码 |
|------|------|------|
| `open(ui, vBind, alwaysShow?)` | 新建实例、入栈、`active=true`、`showBack=true` | `controller.ts:121-132` |
| `close(instance)` | 按策略关闭；栈空且未 `keep` 时 `active=false`、`showBack=false` | `controller.ts:134-144` |
| `closeAll(ui?)` | 关闭全部或某类全部 | `controller.ts:146-154` |
| `hide(instance)` / `show(instance)` | 只改实例 `hidden`，不改变栈 | `controller.ts:156-166` |
| `lastOnly(stack?)` | 只显示最后一个；默认栈模式 | `controller.ts:168-170`、`182-225` |
| `showAll(stack?)` | 显示所有；默认非栈模式 | `controller.ts:172-174`、`227-264` |
| `showCustom(strategy)` | 自定义显示策略 | `controller.ts:176-179` |
| `render()` | 返回 `h(UIContainer, { controller })` | `controller.ts:101-103` |

**栈模式差异：** `UILastOnlyStrategy.close` 在 `stack=true` 时 `stack.splice(index)`，即关闭某个 UI 会把它之后打开的 UI 一起移除；`stack=false` 时只删自己。`showAll` 默认 `stack=false`。这是“关闭后是否连带关闭上层”的关键。

### 背景与 `keep`

`setBackground(ui, vBind)` 创建一个 `alwaysShow=true` 的背景实例，放在 `backIns`；`showBack` 由用户显示与系统显示同时决定：

```ts
// packages/system/src/ui/controller.ts:73-99（逐字节选）
    setBackground<C extends UIComponent>(
        background: IGameUI<C> | null,
        vBind: UIRawProps<C, PB>
    ): IUIInstance<C, PB> | null {
        if (!background) {
            this.background = null;
            this.backIns.value = null;
            return null;
        } else {
            this.background = background;
            const ins = new UIInstance(background, vBind, true);
            this.backIns.value = ins;
            return ins;
        }
    }

    hideBackground() {
        this.userShowBack.value = false;
    }

    showBackground() {
        this.userShowBack.value = true;
    }

    showingBack(): boolean {
        return this.showBack.value;
    }
```

`keep()` 用于防闪烁：在关闭当前 UI、打开下一个 UI 的间隙保持背景：

```ts
// packages/system/src/ui/controller.ts:105-119（逐字）
    keep(): IKeepController {
        this.keepBack = true;

        return {
            safelyUnload: () => {
                if (this.stack.length > 0) return;
                this.sysShowBack.value = false;
                this.keepBack = false;
            },
            unload: () => {
                this.sysShowBack.value = false;
                this.keepBack = false;
            }
        };
    }
```

用法：`const keep = controller.keep(); controller.close(a); controller.open(b, {}); keep.safelyUnload();`。`safelyUnload` 只在栈空时关背景；`unload` 无条件关。

### 基础 Props 注入

`UIController` 不直接知道 `state`；通过 `setPropsBaseCreator` 注入：

```ts
// packages-user/client-modules/src/ui/func.ts:14-26（逐字）
export function createUIPropsBase(
    state: IClientBase
): UIPropsBaseCreator<IGameUIPropsBase> {
    return (
        instance: IUIInstance<UIComponent, IGameUIPropsBase>,
        controller: IUIController<IGameUIPropsBase>
    ): IGameUIPropsBase => {
        return {
            instance,
            controller,
            state: markRaw(state)
        };
    };
}
```

`ClientCore` 构造时给两个控制器都设置：

```ts
// packages-user/client-modules/src/client.ts:101-105（逐字）
        this.sceneController = new UIController<IGameUIPropsBase>();
        this.mainUIController = new UIController<IGameUIPropsBase>();
        const pbCreator = createUIPropsBase(this);
        this.sceneController.setPropsBaseCreator(pbCreator);
        this.mainUIController.setPropsBaseCreator(pbCreator);
```

因此作者的 UI Props 类型必须 `extends IGameUIPropsBase, DefaultProps`，运行时 `props` 数组至少列出 `controller`、`instance`、`state`。不要用 `IUIPropsBase`。

### 场景 UI 与主 UI

| 控制器 | 用途 | 打开位置 | 渲染位置 |
|--------|------|----------|----------|
| `sceneController` | 场景级 UI（加载、标题、主场景） | `client.sceneController.open(...)`（`src/bootstrap.ts:16`） | 由 `ClientCore.sceneController` 管理；作者不需要关心渲染位置 |
| `mainUIController` | 游戏内主 UI 栈（背包、存档、设置等） | `props.state.mainUIController.open(...)` | 由主场景 `container` 包住 `render()`（`src/client/ui/main.tsx:149-155`） |

`MainSceneUI` 自己也是场景 UI：`title.tsx` 在开始/读档后 `props.controller.open(MainSceneUI, {})`（`src/client/ui/title.tsx:214`、`233`）。主 UI 打开后由 `MainScene` 的 `container` 显示。

### `GameUI` 的全局表（重要注意）

`GameUI.list` 与 `GameUI.get` 存在，但构造函数没有把实例写入 `list`：

```ts
// packages/system/src/ui/ui.ts:3-22（逐字）
export class GameUI<C extends UIComponent> implements IGameUI<C> {
    // TODO: 这个静态成员是否可以考虑删除？

    /** 当前的所有已声明 UI，用于全局性获取 */
    static list: Map<string, GameUI<UIComponent>> = new Map();

    constructor(
        public readonly name: string,
        public readonly component: C
    ) {}

    /**
     * 根据 ui 名称获取 ui 实例
     * @param id ui 的名称
     */
    static get<T extends UIComponent>(id: string): GameUI<T> | null {
        const ui = this.list.get(id) as GameUI<T>;
        return ui ?? null;
    }
}
```

因此第 19 / 20 篇不要写“用 `GameUI.get('xxx')` 覆盖内置 UI”；当前实现没有自动注册/覆盖入口。替换应写在打开处，或用 `showCustom` / `setBackground`。

## Built-in Components

> 本节的 props / emits / expose 只列公开契约；`core.*` 依赖按锁定决策 5 处理。

| 组件 | 是否依赖 `core.*` | 说明 |
|------|-------------------|------|
| `TextContent` | 纯文字否；图标/表达式是 | `textboxTyper.ts` 的图标节点用 `texture`，表达式用 `core.calValue` |
| `Textbox` | 图标/皮肤是 | `icon` 走 `texture`，`winskin` 走皮肤标签 |
| `Input` | 否 | 只用 DOM input 与 `TextContent` |
| `InputBox` | 是（特殊组件） | 依赖 `state`、`Background` 的 `winskin`、`useKey` |
| `List` / `ListPage` | 仅 `winskin` 时是 | `winskin` 经 `Selection` 走 `core.material` |
| `Page` | 否 | 自绘页码与箭头 |
| `Scroll` | 否 | 只用渲染元素与 `transitioned` |
| `Selection` | 仅 `winskin` 时是 | `winskin` 走 `core.material.images` |
| `ConfirmBox` / `Choices` | 仅 `winskin` 时是 | 特殊组件；`winskin` 走皮肤/背景 |

### TextContent / Textbox

`TextContentProps`：

```ts
// packages-user/client-base/src/components/textbox.tsx:40-52（逐字）
export interface TextContentProps
    extends DefaultProps, Partial<ITextContentConfig> {
    /** 显示的文字 */
    text?: string;
    /** 是否填充 */
    fill?: boolean;
    /** 是否描边 */
    stroke?: boolean;
    /** 是否自适应高度，即组件内部计算 height 的值，而非指定，可与滚动条结合 */
    autoHeight?: boolean;
    /** 文字的最大宽度 */
    width: number;
}
```

`ITextContentConfig` 提供 `font` / `keepLast` / `interval` / `lineHeight` / `wordBreak` / `textAlign` / `ignoreLineStart` / `ignoreLineEnd` / `breakChars` / `fillStyle` / `strokeStyle` / `strokeWidth` / `width`（`textboxTyper.ts:39-66`）。`TextContent` 事件与暴露：

```ts
// packages-user/client-base/src/components/textbox.tsx:54-87（逐字）
export type TextContentEmits = {
    /**
     * 当打字机结束时触发
     */
    typeEnd: () => void;

    /**
     * 当打字机开始打字时触发
     */
    typeStart: () => void;

    /**
     * 当文字发生变动，组件内部重新计算文字高度时触发
     * @param height 更新后的高度
     */
    updateHeight: (height: number) => void;
};

export interface TextContentExpose {
    /**
     * 重新开始打字
     */
    retype(): void;

    /**
     * 立刻显示所有文字
     */
    showAll(): void;

    /**
     * 获取这段 TextContent 的总高度
     */
    getHeight(): number;
}
```

`TextboxProps` 在 `TextContentProps` 上增加背景、标题、图标：

```ts
// packages-user/client-base/src/components/textbox.tsx:238-259（逐字）
export interface TextboxProps extends TextContentProps, DefaultProps {
    /** 背景颜色 */
    backColor?: CanvasStyle;
    /** 背景 winskin */
    winskin?: ImageIds;
    /** 边框与文字间的距离，默认为8 */
    padding?: number;
    /** 标题 */
    title?: string;
    /** 标题字体 */
    titleFont?: Font;
    /** 标题填充样式 */
    titleFill?: CanvasStyle;
    /** 标题描边样式 */
    titleStroke?: CanvasStyle;
    /** 标题文字与边框间的距离，默认为4 */
    titlePadding?: number;
    /** 图标 */
    icon?: AllIdsWithNone;
    /** 最大宽度 */
    width: number;
}
```

`Textbox` 暴露 `show` / `hide` / `retype` / `showAll`（`textbox.tsx:261-281`），并提供 `TextboxStore`：

- `TextboxStore.get(id)` 取已挂载的文本框控制器；
- `TextboxStore.use(id, props, emits)` 由组件内部调用，作者一般不用；
- `store.setText` / `store.show` / `store.hide` / `store.modify` / `store.endType` 可在组件外更新文本（`textbox.tsx:579-672`）。

**注意：** `Textbox` 的 `icon` / `winskin` 会走 `core` 素材；文档只写“可填图标/皮肤名”，不解释素材来源。`TextContent` / `Textbox` 的 `width` 是必填，`autoHeight` 决定高度是否自动算。

### Input

`InputProps`：

```ts
// packages-user/client-base/src/components/input.tsx:19-50（逐字）
export interface InputProps extends DefaultProps, Partial<TextContentProps> {
    /** 输入框的提示内容 */
    placeholder?: string;
    /** 输入框的值 */
    value?: string;
    /** 是否是多行输入，多行输入时，允许换行 */
    multiline?: boolean;
    /** 边框颜色 */
    border?: string;
    /** 边框圆角 */
    circle?: RectRCircleParams;
    /** 边框宽度 */
    borderWidth?: number;
    /** 内边距 */
    pad?: number;
}

export type InputEmits = {
    /**
     * 当输入框的值被确认时触发，例如失焦时
     * @param value 输入框的值
     */
    change: (value: string) => void;

    /**
     * 当输入框的值发生改变时触发，例如输入了一个字符，或者删除了一个字母
     * @param value 输入框的值
     */
    input: (value: string) => void;

    'update:value': (value: string) => void;
};
```

`Input` 点击时在 `document.body` 上创建一个真实的 `<input>` / `<textarea>`，用 `matrix(...)` 对齐画布；失焦后移除（`input.tsx:136-211`）。文档统一教 `v-model:value`：

```tsx
const value = ref('');
<Input v-model:value={value.value} placeholder="请输入" />
```

`update:value` 是给 `v-model:value` 用的；不要教读者手动写 `onUpdate:value`。

### 特殊组件（InputBox / ConfirmBox / Choices）

这三个都是**单次调用型特殊组件**，不是普通内置组件；都通过 `controller.open` 打开（或调用封装函数），按接口讲，不展开实现细节。

**`InputBox`**（`src/client/ui/inputBox.tsx`，干净）：

- Props：`IGameUIPropsBase + TextContentProps`，另有 `loc`、`input?: InputProps`、`winskin?`、`color?`、`border?`、`pad?`、`inputHeight?`、`text?`、`yesText?`、`noText?`、`selFont?`、`selFill?`。
- Emits：`confirm(value)`、`cancel(value)`，并继承 `InputEmits`。
- 封装函数：`getInput(controller, text, loc, width, props?)` → `Promise<string>`；`getInputNumber(...)` → `Promise<number>`。
- 导出 `InputBoxUI = new GameUI('input-box', InputBox)`。

**`ConfirmBox`**（`src/client/ui/choices.tsx`，仅接口参考）：

```ts
// src/client/ui/choices.tsx:17-49（逐字，仅接口）
export interface ConfirmBoxProps extends IGameUIPropsBase, TextContentProps {
    /** 确认框的提示文本内容 */
    text: string;
    /** 确认框对话框的宽度 */
    width: number;
    /** 确认框对话框的位置 */
    loc: ElementLocator;
    /** 确认/取消按钮的字体样式 */
    selFont?: Font;
    /** 确认/取消按钮的文本颜色 */
    selFill?: CanvasStyle;
    /** 对话框内部所有元素的内边距 */
    pad?: number;
    /** 确认按钮的显示文本，默认为"确认" */
    yesText?: string;
    /** 取消按钮的显示文本，默认为"取消" */
    noText?: string;
    /** 窗口皮肤图片ID，用于对话框背景绘制 */
    winskin?: ImageIds;
    /** 是否默认选中确认按钮 */
    defaultYes?: boolean;
    /** 对话框背景颜色，当未设置 winskin 时生效 */
    color?: CanvasStyle;
    /** 对话框边框颜色，当未设置 winskin 时生效 */
    border?: CanvasStyle;
    /** 是否使用全新的按键作用域，此时选择框的按键作用域不会包含原本的按键指令实现，默认会使用全新作用域 */
    freshScope?: boolean;
}

export type ConfirmBoxEmits = {
    yes: () => void;
    no: () => void;
};
```

- 封装函数：`getConfirm(controller, text, loc, width, props?)` → `Promise<boolean>`。
- 导出 `ConfirmBoxUI = new GameUI('confirm-box', ConfirmBox)`。

**`Choices`**（用户或称 `ChoicesBox`；`src/client/ui/choices.tsx`，仅接口参考）：

```ts
// src/client/ui/choices.tsx:216-261（逐字，仅接口）
export type ChoiceKey = string | number;
export type ChoiceItem<T extends ChoiceKey = ChoiceKey> = [
    key: T,
    text: string
];

export interface ChoicesProps extends IGameUIPropsBase, TextContentProps {
    /** 选项数组 */
    choices: ChoiceItem[];
    /** 选择框对话框的位置 */
    loc: ElementLocator;
    /** 选择框对话框的宽度 */
    width: number;
    /** 选择框的最大高度，超过时将分页显示 */
    maxHeight?: number;
    /** 选择框的提示文本内容 */
    text?: string;
    /** 选择框的标题文本 */
    title?: string;
    /** 窗口皮肤图片ID，用于对话框背景绘制 */
    winskin?: ImageIds;
    /** 对话框背景颜色，当未设置 winskin 时生效 */
    color?: CanvasStyle;
    /** 对话框边框颜色，当未设置 winskin 时生效 */
    border?: CanvasStyle;
    /** 选项文本的字体样式 */
    selFont?: Font;
    /** 选项文本的颜色 */
    selFill?: CanvasStyle;
    /** 标题文本的字体样式 */
    titleFont?: Font;
    /** 标题文本的颜色 */
    titleFill?: CanvasStyle;
    /** 对话框内部所有元素的内边距 */
    pad?: number;
    /** 选项之间的垂直间隔 */
    interval?: number;
    /** 默认选中的选项索引 */
    selected?: number;
    /** 是否使用全新的按键作用域，此时选择框的按键作用域不会包含原本的按键指令实现，默认会使用全新作用域 */
    freshScope?: boolean;
}

export type ChoicesEmits = {
    choose: (key: ChoiceKey) => void;
};
```

- 封装函数：`getChoice(controller, choices, loc, width, props?)` → `Promise<T>`。
- 导出 `ChoicesUI = new GameUI('choices', Choices)`。
- `Choices` 没有额外 expose；用 `choose` 事件或 `getChoice` 拿结果。
- 不引用 `choices.tsx` 的实现细节；`winskin` / `icon` 仍只作占位。

### List / ListPage

```ts
// packages-user/client-base/src/components/list.tsx:8-37（逐字）
export interface ListProps extends DefaultProps {
    /** 列表内容，第一项表示 id，第二项表示显示的内容 */
    list: [string, string][];
    /** 当前选中的项 */
    selected: string;
    /** 定位 */
    loc: ElementLocator;
    /** 每行的高度，默认 18 */
    lineHeight?: number;
    /** 字体 */
    font?: Font;
    /** 使用 winskin 作为光标 */
    winskin?: ImageIds;
    /** 使用指定样式作为光标背景 */
    color?: CanvasStyle;
    /** 使用指定样式作为光标边框 */
    border?: CanvasStyle;
    /** 选择图标的不透明度范围 */
    alphaRange?: [number, number];
}

export type ListEmits = {
    /**
     * 当用户选中某一项时触发
     * @param key 选中的项的 id
     */
    update: (key: string) => void;

    'update:selected': (value: string) => void;
};
```

`List` 内部用 `Scroll` 包住每一行，选中的行渲染 `Selection`；选择变化通过 `update` / `update:selected` 传出（`list.tsx:54-112`）。文档统一教 `v-model:selected` 双向绑定：

```tsx
const selected = ref('first');
<List list={list} v-model:selected={selected.value} loc={[0, 0, 200, 200]} />
```

`update:selected` 是 `v-model:selected` 的实现细节，不要教读者手动写 `onUpdate:selected`。初始选中项以列表第一项为准（当前组件行为）；不要承诺 `selected` prop 能控制初始选中。

`ListPage` 在 `List` 基础上加 `basis`（默认 `0.3`）、`right`、`close`、`closeLoc`，并用动态 slots 按选中 key 渲染内容：

```ts
// packages-user/client-base/src/components/list.tsx:114-135（逐字）
export interface ListPageProps extends ListProps {
    /** 组件定位 */
    loc: ElementLocator;
    /** 列表所占比例 */
    basis?: number;
    /** 列表是否排列在右侧 */
    right?: boolean;
    /** 是否显示关闭按钮 */
    close?: boolean;
    /** 关闭按钮的位置，相对于组件定位 */
    closeLoc?: ElementLocator;
}

export type ListPageEmits = {
    close: () => void;
} & ListEmits;

export type ListPageSlots = SlotsType<{
    default: (key: string) => VNode | VNode[];
    [x: string]: (key: string) => VNode | VNode[];
}>;
```

### Page

```ts
// packages-user/client-base/src/components/page.tsx:19-36（逐字）
export interface PageProps extends DefaultProps {
    /** 共有多少页 */
    pages: number;
    /** 页码组件的定位 */
    loc: ElementLocator;
    /** 当前页码 */
    page?: number;
    /** 页码的字体 */
    font?: Font;
    /** 只有一页的时候，是否隐藏页码 */
    hideIfSingle?: boolean;
}

export type PageEmits = {
    pageChange: (page: number) => void;
    'update:page': (page: number) => void;
};
```

`PageExpose`：`changePage(page)` / `movePage(delta)` / `now()`（`page.tsx:38-55`）。默认 slot 接收页码索引（0 开始）；`hideIfSingle` 在只有一页时隐藏页码条；页码是手绘的 `g-rectr` + `g-path` + `text`，不依赖 `core`（`page.tsx:239-352`），适合 live。

### Scroll

```ts
// packages-user/client-base/src/components/scroll.tsx:41-65（逐字）
export interface ScrollExpose {
    /**
     * 控制滚动条滚动至目标位置
     * @param y 滚动至的目标位置
     * @param time 滚动的动画时长，默认为无动画
     */
    scrollTo(y: number, time?: number): void;

    /**
     * 获取这个滚动条组件最多可以滚动多长
     */
    getScrollLength(): number;
}

export interface ScrollProps extends DefaultProps {
    loc: ElementLocator;
    hor?: boolean;
    /** 是否不允许滚动 */
    noscroll?: boolean;
    /**
     * 滚动到最下方（最右方）时的填充大小，如果默认的高度计算方式有误，
     * 那么可以调整此参数来修复错误
     */
    padEnd?: number;
}
```

`Scroll` 的虚拟滚动只渲染视口附近的直接子元素；源码注释明确建议平铺，不要用一个 `container` 包住全部内容：

````tsx
// packages-user/client-base/src/components/scroll.tsx:90-107（逐字）
 * **推荐写法**：
 * ```tsx
 * <Scroll>
 *   <item />
 *   <item />
 *   ...其他元素
 *   <item />
 *   <item />
 * </Scroll>
 * ```
 * **不推荐**使用这种写法：
 * ```tsx
 * <Scroll>
 *   <container>
 *     <item />
 *   </container>
 * <Scroll>
 * ```
````

`Scroll` 内部使用 `<container-custom>`（`scroll.tsx:556`）；文档统一用 `container-custom`，不展开内部注册，只讲 `Scroll` 的对外用法。

### Selection

```ts
// packages-user/client-base/src/components/misc.tsx:280-287（逐字）
export interface SelectionProps extends DefaultProps {
    loc: ElementLocator;
    color?: CanvasStyle;
    border?: CanvasStyle;
    winskin?: ImageIds;
    /** 选择图标的不透明度范围 */
    alphaRange?: [number, number];
}
```

`Selection` 是不接收事件的视觉光标；`winskin` 路径依赖 `core.material.images`（`misc.tsx:311-314`），按锁定决策只作占位。无 `winskin` 时用 `g-rectr`，可 live。

### Choices / ConfirmBox（特殊组件）

`Choices` / `ConfirmBox` / `getConfirm` / `getChoice` 位于 `src/client/ui/choices.tsx`。该文件按锁定决策 7 **仅作接口参考**（props / emits / 函数签名），不引用实现细节。完整 props / emits / 函数签名见上文“特殊组件（InputBox / ConfirmBox / Choices）”；第 18 篇必须写 `Choices`，不要删掉。

## Hotkey

### 作者会用到的接口

- `state.hotkey.system`：`IHotkeySystem`；
- `useKey(system, clearImpl?)`：在组件 `setup` 中创建当前组件作用域的按键实现对象，类型为 `IHotkeyUsing | null`；组件内必定有实例，直接用 `!` 断言。
- `IHotkeyUsing.implement(command, func)`：把指令接到当前作用域；
- `IHotkeyUsing.scope()`：拿当前作用域 `symbol`（一般不用）；
- `system.addCommand(command, name, init)`：注册新指令；
- `hotkey.setGroup(group, name, commands)`：把指令分组，供设置界面显示。

```ts
// packages-user/client-base/src/use/hotkey.ts:58-71（逐字）
export function useKey(
    system: IHotkeySystem,
    clearImpl: boolean = true
): IHotkeyUsing | null {
    const instance = getCurrentInstance();
    if (!instance) return null;
    return new HotkeyUsing(system, clearImpl);
}
```

```ts
// packages-user/client-base/src/use/hotkey.ts:6-55（逐字节选）
class HotkeyUsing implements IHotkeyUsing {
    ...
    constructor(readonly system: IHotkeySystem, clearImpl: boolean) {
        ...
        onBeforeMount(() => {
            this.mounted = true;
            const scope = system.enterScope(clearImpl);
            this.keyScope = scope;
            resolve(scope);
            for (const [command, func] of this.impl) {
                system.implement(command, func);
            }
            this.impl.clear();
        });

        onUnmounted(() => {
            if (this.keyScope) {
                system.leaveScope(this.keyScope);
            } else {
                logger.warn(211);
            }
        });
    }
```

典型写法：

```tsx
const key = useKey(props.state.hotkey.system)!;

key.implement('@common/exit', () => props.controller.close(props.instance));
key.implement('@ui/book', () => {
    // 打开怪物手册
});
```

### 触发方式与优先级

```ts
// packages/system/src/hotkey/types.ts:9-16（逐字）
export const enum HotkeyEmitMode {
    /** 按键抬起时触发 */
    KeyUp,
    /** 按下时只会触发一次 */
    Once,
    /** 按下后依据激励源进行触发 */
    Continuous
}
```

`IHotkeyCommandInit` 的关键字段：

```ts
// packages/system/src/hotkey/types.ts:55-77（逐字节选）
    readonly defaults: KeyCode[][];
    /** 按键指令优先级，目前仅对抬起触发的按键生效，默认为 0 */
    readonly priority?: number;
    /** 是否阻断优先级精确比此按键指令更低的指令的执行，同优先级的会全部执行，并不会阻断，默认不阻断 */
    readonly block?: boolean;
    /** 按键触发方式，默认为抬起时触发 */
    readonly mode?: HotkeyEmitMode;
    /** 从指定按键组合被触发，至指令首次被真正执行期间，最少经过的时间 */
    readonly timeout?: number;
    /** 在按下的持续触发模式或节流触发模式下，首次指令被触发，至第二次指令被触发，最少经过的时间 */
    readonly interval?: number;
    /** 在按下的节流触发模式下，两次指令触发要经过的最少时间 */
    readonly dt?: number;
```

`IHotkeyEmitInfo` 给回调：`mode`、`command`、`index`、`keys`、`context`（`holding` / `ctrl` / `shift` / `alt` / `meta`）。`context.holding` 是“匹配时刻”按下的键，不是回调执行时刻（`types.ts:18-53`）。

### 默认按键与分组

`src/client/misc/hotkey.ts` 注册了通用、游戏、UI、系统等分组。UI 文档只需列常见项：

| 分组 / 指令 | 默认按键 | 说明 |
|-------------|----------|------|
| `@common/confirm` | Enter / Space / C | 确认 |
| `@common/exit` | Escape / X | 取消 / 返回 |
| `@ui/book` | X | 怪物手册 |
| `@ui/save` | S | 存档 |
| `@ui/load` | D | 读档 |
| `@ui/menu` | Escape | 游戏菜单 |
| `@ui/view-map` | PageDown / PageUp | 浏览地图 |
| `@ui/toolbox` | T | 道具界面 |
| `@ui/command` | Q | 装备界面 |
| `@ui/input-confirm` | Enter | 输入框确认 |

**不要展开** `saveState` / `loadState` / `listen` / `preventDefault` / 内部匹配；只写“指令注册、分组、`useKey` 实现、模式与优先级/阻断、作用域跟随组件生命周期”。

## Performance

### 缓存

- 默认缓存：`container`、`custom`、`container-custom`；
- 默认不缓存：`text`、`image`、`template`、`g-*`、`icon`、`winskin`、`map-render`；
- `nocache` 优先级高于 `cache`（`tag.ts:112-113`）。

`Text` 的默认缓存是 `false`，但 `text` 标签的 `createTag` 允许 `cache` 打开；简单文字不要开缓存，复杂长文本可试 `cache`。

### 脏更新

渲染器只在 `cacheDirty` 时重绘：

```ts
// packages/render/src/core/render.ts:182-186（逐字）
    protected refresh(): void {
        if (!this.cacheDirty) return;
        this.target.clear();
        this.renderContent(this.target);
    }
```

`RenderItem.update` 会把脏标记向父级冒泡；父级已经脏时提前返回，避免重复：

```ts
// packages/render/src/core/item.ts:229-244（逐字节选）
    update(item: IRenderItem = this): void {
        if (import.meta.env.DEV) {
            if (this.forbidUpdate) {
                logger.warn(61, this.constructor.name, this.uid.toString());
            }
        }
        if (this.parent) {
            if (this.cacheDirty && this.parent.cacheDirty) return;
            this.cacheDirty = true;
            if (this.hidden) return;
            this.parent.update(item);
        } else {
            if (this.cacheDirty) return;
            this.cacheDirty = true;
        }
    }
```

### HD / 抗锯齿 / 缩放

- `highResolution` 默认 `true`；`antiAliasing` 默认 `true`（`item.ts:67-70`）。
- `hd={false}` 关闭高清缓存；`noanti` 关闭抗锯齿，优先级高于 `anti`（`props.ts:41-46`、`item.ts:1016-1030`）。
- TSX 的 `scale={[x, y]}` 是元素变换矩阵的缩放，不要写成数字；画布缩放不属于 UI 作者需要了解的内容，本批不展开。
- 像素图建议 `noanti hd={false}`（旧性能文档的建议仍适用）。
- 自定义元素需要离屏画布时，用 `RenderItem.requireCanvas` / `deleteCanvas` 复用；源码注释明确不建议在自定义渲染元素里直接 `new MotaOffscreenCanvas2D`（`canvas2d.ts:25-30`）。

### `hidden`、列表与组件粒度

- 频繁切换用 `hidden`；只有必须卸载/重置/释放时才用三元。`hidden` = 不显示、不交互，保留元素/状态；三元会创建/销毁并重置状态。
- 列表用 `.map()`；`key` 只在会重排/增删且需要保留身份时加（`dev.md:122`）。
- 分组用 `container`，把高频更新与低频更新隔开；但不要嵌套过深（旧性能文档 `docs/guide/ui/perf.md` 的建议，仍适用）。
- 大量列表优先 `Scroll`；复杂分页优先 `Page`；`Scroll` 的虚拟滚动只对直接子元素生效。
- UI 系统：`keep` 防背景闪烁；`setBackground` 把稳定背景移出 UI 栈；避免频繁 `open`/`close`，能用 `hidden`/`show`/`hide` 就不重建组件；栈越深，`UIContainer` 的映射与隐藏切换越多。
- `UIContainer` 每次渲染都会调用 `createPropsBase(v)`（`container.tsx:34`）；`createUIPropsBase` 返回 `markRaw(state)`，但作者自定义的 creator 不要在这里做重活。

### 旧性能优化文档（用户指定可参考）

| 项 | 值 |
|----|-----|
| 路径 | `docs/guide/ui/perf.md` |
| 首次出现 commit | `6bf3217`（`init: 2.B`） |
| 删除 commit | `e3d61ee`（`docs(10-01): clear legacy docs and decouple API sidebar from build`） |
| 可用内容 | 避免平铺、用 `Scroll`/`Page`、避免元素自我更新、`cache`/`nocache`、像素图关 HD/抗锯齿、优先 `hidden` |
| 需替换的旧名 | `sprite` → `custom`；`container-custom` 保持同名；旧 `layer`/`animation` 等本批不涉及 |

根目录 `perf.md` 是另一份性能说明，讲 `Map.getOrInsert` / `Map.getOrInsertComputed`，不是 UI 性能文档，不要混用。

## Docs Placement / Conventions

### 现有位置

- 高级 II 正文在 `docs/advanced/ii/`，导览是 `docs/advanced/ii/index.md`。
- 侧边栏在 `docs/.vitepress/config.ts` 的 `'/advanced/'` 下；高级 II 目前是一个扁平分组（`config.ts:215-257`）。
- 高级 II 导览目前明确写“这里仍然只写数据端”（`docs/advanced/ii/index.md:15`），并把“渲染端与编辑器”列为不覆盖（`:79-81`）。新增 UI 子分组后，这两处必须同步修改，否则导览与正文矛盾。
- 高级总导览也写着“渲染端尚未完工，本层当前只收录数据端内容”（`docs/advanced/index.md:38`），同样需要更新。
- 高级 III 导览把“性能”列在 III 的主题中（`docs/advanced/index.md:13`）；第 21 篇是 **UI 系统性能**（缓存、`hidden`、列表、`keep`），不是引擎级性能。更新导览时应写清这条边界，避免与高级 III 重叠。

### 建议目录与文件名

建议新建 `docs/advanced/ii/ui/`，27 篇全部放在该目录。文件名按 `dev.md:67-68` 的“Markdown 文档文件名使用连字符命名法”生成：

| 序 | 建议文件名 | 建议侧边栏名 |
|----|------------|--------------|
| 1 | `ui-template.md` | UI 通用模板（TSX） |
| 2 | `ui-template-ts.md` | 同一 UI 的 TS 直调写法 |
| 3 | `container-and-coordinates.md` | 容器与坐标 |
| 4 | `basic-shapes.md` | 基础图形 |
| 5 | `curves-and-paths.md` | 曲线与路径 |
| 6 | `text.md` | 文字 |
| 7 | `image-and-texture.md` | 图片与最小纹理 |
| 8 | `layer-transform-performance.md` | 层级、变换与性能 |
| 9 | `reactivity.md` | 响应式 |
| 10 | `events.md` | 事件与交互 |
| 11 | `hotkey-in-ui.md` | 按键与快捷键 |
| 12 | `conditional-and-list-rendering.md` | 条件渲染与循环渲染 |
| 13 | `props.md` | props |
| 14 | `component-tsx.md` | 组件（TSX） |
| 15 | `component-ts.md` | 组件（TS 直调） |
| 16 | `slots-and-attrs.md` | slots 与 attrs |
| 17 | `builtin-text-and-input.md` | 内置组件：文本与输入 |
| 18 | `builtin-list-and-containers.md` | 内置组件：列表与容器 |
| 19 | `ui-controller-and-stack.md` | UIController 与 UI 栈 |
| 20 | `replace-builtin-ui.md` | 修改/替换内置 UI |
| 21 | `ui-performance.md` | UI 系统性能与注意事项 |
| 22 | `inventory-example-1-skeleton.md` | 示例（一）目标与骨架 |
| 23 | `inventory-example-2-grid.md` | 示例（二）道具网格 |
| 24 | `inventory-example-3-detail.md` | 示例（三）详情区 |
| 25 | `inventory-example-4-scroll.md` | 示例（四）滚动与列表 |
| 26 | `inventory-example-5-state.md` | 示例（五）交互与状态 |
| 27 | `inventory-example-6-animation-and-register.md` | 示例（六）动画、拆分与注册 |

### 侧边栏注册建议

在 `/advanced/` 的高级 II 分组内部新增一个嵌套子分组；不要新建顶层导航。示意：

```ts
{
    text: '高级 II · 深入定制',
    collapsed: false,
    items: [
        // ...现有 10 篇
        {
            text: '自定义 UI 与渲染',
            collapsed: false,
            items: [
                {
                    text: '起步',
                    collapsed: false,
                    items: [
                        { text: 'UI 通用模板（TSX）', link: '/advanced/ii/ui/ui-template' },
                        { text: '同一 UI 的 TS 直调写法', link: '/advanced/ii/ui/ui-template-ts' }
                    ]
                },
                // ...元素与布局 / 交互与数据 / 组件化 / 内置组件与 UI 系统 / 完整示例
            ]
        }
    ]
}
```

如果 VitePress 的嵌套层级实际渲染不理想，再退化为“高级 II 分组下追加一个扁平子分组”，27 条平铺。**Task 0 必须让用户确认目录、文件名、侧边栏层级。**

### live 组件位置

现有 POC 在 `docs/.vitepress/components/demos/` 下用 `.vue` 写 demo；锁定决策 11 要求 live 用 TSX demo 组件。建议新增：

```text
docs/.vitepress/components/demos/
├── basicRender.vue          # 现有 POC，保留
├── uiSystem.vue             # 现有 POC，保留
└── ui/
    ├── template-demo.tsx
    ├── shapes-demo.tsx
    ├── text-demo.tsx
    ├── events-demo.tsx
    ├── component-demo.tsx
    ├── controller-demo.tsx
    └── inventory-demo.tsx
```

`RenderDemo` 只要求 loader 返回 `{ default: Component }`（`docs/.vitepress/components/renderDemo.vue:10-16`、`51-77`），所以 `.tsx` 默认导出组件即可。**不要**在文档里展示 demo 源码；只给正文代码块。

### 写作规范（本批必须遵守）

| 规范 | 要求 |
|------|------|
| D-59 | 高级教程按一般库文档写：示例 + 注释解释，不写中级六步实操，不把读者当什么都不懂 |
| D-60 | 简洁优先；能删就删；不重复中级/高级 I/II 已讲内容 |
| D-61 | 主干只讲核心；边界/特殊情况放文末“边界与注意” |
| D-62 / D-70 | 代码块必须是完整、结构正确的类/函数/文件级片段，不贴脱离上下文的成员 |
| D-65 | 示例必须加解释性注释，越多越好 |
| D-72 | 注释与实现不一致时以注释为准，但只在对话中报告，不写进正文 |
| D-73 | 假定编辑器已完成；编辑器 / `.jsonc` 只写占位 |
| D-74 | 引用其他文档的具体章节用 `./xxx.md#标题` |
| D-77 | 按内容性质决定重心：现成内容讲怎么用，扩展内容讲怎么改 |
| D-80 | 不写“源码怎么怎么样”的源码叙述 |
| D-81 | 不把用户问题或“为了解决该问题所以这样写”写进正文 |
| D-82 | 先讲系统模型（概念、组成、数据流），再讲接口与用法 |
| D-83 | 高级教程不写“模板”“[需改]”等模板标记；示例用注释说明 |
| D-52 | 加粗内容不要以标点开头/结尾；提交前按 CommonMark flanking 规则自检 |
| D-84 | 按读者理解顺序组织：问题/场景 → 系统模型 → 机制与理由 → 接口/用法 → 完整示例 → 边界 |
| D-85 | 写前理解样板的设计思路、调用链、生命周期，不能只读被讲的一段 |
| D-86 | 每节只回答一个问题；认知跳跃处用 1–2 句过渡 |
| D-87 | 示例完整、与正文概念对应；优先完整类/函数；编辑器产出的内容不手写 |
| D-88 | 篇幅由内容决定；原理讲透，不堆接口表 |
| D-89 | 正确性由写作者与用户负责；独立读者只读文档、按前置顺序提问 |
| D-90 | 修订循环中不逐轮提交；用户确认后统一提交 |
| D-09 | 验收 = 用户人工审阅 + 链接全部有效 + 构建通过 |
| D-45 | 写完后必须跑 prettier；命令：`node node_modules/prettier/bin/prettier.cjs --write "docs/advanced/ii/ui/*.md"` |
| dev.md:116 | 换行使用 `CRLF`；`.prettierrc` 的 `endOfLine` 也是 `crlf` |
| dev.md:122 | `key` 仅在列表会重排/插入/删除且需要保留身份时使用 |

## Reference Manifest

> 哈希为 `git rev-parse HEAD:<path>`；`WT=HEAD` 表示工作树与 HEAD 相同。基线 `b94b4c3`。后续写作前建议用 `git hash-object -- <path>` 再核对一次；若变化，停下向用户确认。

> A / B 两节只用于核对元素行为与 TSX 属性；**正文不得出现 `MotaRenderer`、渲染器初始化或 node ops**。应用层读者只需要元素标签、属性、事件与 `appendChild`。

### A. 渲染引擎（内部参考）

| Path | HEAD hash | 用途 |
|------|-----------|------|
| `packages/render/src/core/render.ts` | `f471440478f090497fbdb3f1b62e1caad61ebea2` | `MotaRenderer`、标签注册、`createElement`、事件监听、缩放 |
| `packages/render/src/core/types.ts` | `31d9120f43d34757aa5936731bc16ebb0ff39cd3` | `IRenderItem`、`ElementLocator`、`IRenderItemParameterMap` |
| `packages/render/src/core/item.ts` | `1acd9193d1b0e3121af1dd74ccef25f3dcc7124f` | 属性默认值、`patchProp`、事件、`hidden`、`update` |
| `packages/render/src/core/container.ts` | `e01b5122fc2d3685648c28db6932919c554c98d6` | `container` / `container-custom`、排序、捕获（内部参考） |
| `packages/render/src/core/custom.ts` | `440163608dec8818f0e2320d0b415a62e2061242` | `custom`、`bindings` |
| `packages/render/src/core/graphics.ts` | `eebc2f659f2fda05e60cb48e6473ef05f134a5da` | `g-*` 图形、路径、命中测试 |
| `packages/render/src/core/misc.ts` | `3c19fd4d464df04a562a2951120df72ec6adbd2a` | `Text` / `Image` / `Comment` |
| `packages/render/src/core/event.ts` | `6a0999e6f4b7f3bf3084195a97411d87c884d98f` | 事件类型与字段 |
| `packages/render/src/core/transform.ts` | `c3f38c52843027ff49373da20c707fcf0091f25f` | `scale` / `translate` / `rotate` |
| `packages/render/src/core/canvas2d.ts` | `a9c80670c03866b95689413eaf7ed40781176c1d` | HD / 抗锯齿 / 画布尺寸 |
| `packages/render/src/assets/texture.ts` | `545e2ca46494a99f2c93e33b4d0c1c84d5b4d8fa` | `Texture` |
| `packages/render/src/style/font.ts` | `0e4541e22555140dd4afcf34fb88fbd91f2edb37` | `Font` 默认值与构造 |

### B. Vue / TSX 桥接（内部参考）

| Path | HEAD hash | 用途 |
|------|-----------|------|
| `packages/render-vue/src/tag.ts` | `7b0265a276dcbdc36c01eac709e4a35cbc7a13f0` | 标签注册、缓存默认值 |
| `packages/render-vue/src/elements.ts` | `39e0c20c93f3c0b84ad7148688eceac4ed89813b` | JSX `IntrinsicElements` |
| `packages/render-vue/src/props.ts` | `27e0f9f3bb2fa63bf2d9d358af87078eebe56053` | `BaseProps` 与各标签 props |
| `packages/render-vue/src/renderer.ts` | `ffdfe947546833e2c130f43ab5c42e144429ab23` | 自定义渲染器 node ops |
| `packages/render-vue/src/types.ts` | `a90549e8c3bf07e5069107c414086edde65270b0` | `DefaultProps`、`RendererUsing` |
| `packages/render-vue/src/use.ts` | `b23674c3b3c143c22cfb6683ff9d2c47fff7ee2b` | `onExcited` / `listenEvent` / `useAnimater` |

### C. UI 系统（权威）

| Path | HEAD hash | 用途 |
|------|-----------|------|
| `packages/system/src/ui/controller.ts` | `25c3ea6f2bb3877989c65f25d3fc6dc3288ead7a` | `UIController`、栈策略、`keep` |
| `packages/system/src/ui/types.ts` | `2a24550a6a3f8dade44524f7be2564f7d7957551` | `IGameUI` / `IUIController` / `IUIInstance` |
| `packages/system/src/ui/instance.ts` | `11a6ce881e5f1de32f232fd07c7bbc09a9e56203` | `UIInstance` |
| `packages/system/src/ui/container.tsx` | `8eeddcad33bb5e3e70e4c66ad33b41dbece83e3d` | `UIContainer` 映射 |
| `packages/system/src/ui/ui.ts` | `04b98c0ce7ce04c24c97906f5dd7261b1f53907a` | `GameUI` |

### D. 内置组件（公开契约）

| Path | HEAD hash | 用途 |
|------|-----------|------|
| `packages-user/client-base/src/components/textbox.tsx` | `5b58de65007189314553be0aca48209bd9e25981` | `TextContent` / `Textbox` / `TextboxStore` |
| `packages-user/client-base/src/components/list.tsx` | `a6723454788b8fff22389bc5d19883c90a4eb5b5` | `List` / `ListPage` |
| `packages-user/client-base/src/components/page.tsx` | `b18520460dd335385be901e535f222eedcb9941e` | `Page` |
| `packages-user/client-base/src/components/scroll.tsx` | `809af86b816bdad643292afce85e106886dd5a99` | `Scroll` |
| `packages-user/client-base/src/components/input.tsx` | `bfe65b06b9600f80a4d74f6ef222e55d13d09134` | `Input` |
| `packages-user/client-base/src/components/misc.tsx` | `365e826610678276599e71f4f69ff42e30daef7f` | `Progress` / `Arrow` / `ScrollText` / `Selection` |
| `packages-user/client-base/src/components/textboxTyper.ts` | `39196f0cf3acd09268d3d4c7558b27ce5f033c09` | `ITextContentConfig` / 打字机内部；文档不展开 |
| `packages-user/client-base/src/elements/index.ts` | `c18812a599aed5fb27106a273f77e56ba2d8a19a` | `createElements`、`icon` / `winskin` / `map-render` |
| `packages-user/client-base/src/elements/props.ts` | `c029aa9db4b2b30c68be18f07e0902ffd1041a36` | 应用层标签 props |
| `packages-user/client-base/src/elements/types.ts` | `3b2fa25721099bf4a25334a1e61e537a2b1885bb` | `IMotaIcon` / `IMotaWinskin` |
| `packages-user/client-base/src/elements/cache.ts` | `e81b3c8667284619cfdeb46a77ee7de1809f24a3` | `texture`（依赖 `core`；仅背景） |

### E. 按键（权威）

| Path | HEAD hash | 用途 |
|------|-----------|------|
| `packages/system/src/hotkey/types.ts` | `600432021f3f253730d3421fd1a5fb80fafd92e1` | `HotkeyEmitMode` / `IHotkeySystem` |
| `packages/system/src/hotkey/command.ts` | `8d99e6a364943f34c962e7b6461a97f6d23e75ca` | `HotkeyCommand` |
| `packages/system/src/hotkey/system.ts` | `da87e18a7e6c8ae951f73bfaf7daf22a7a53e0c5` | 作用域、实现、匹配 |
| `packages-user/client-base/src/hotkey/hotkey.ts` | `9344fabb5d902ad18482ede6277513998c5db2b1` | `ClientHotkey`、分组 |
| `packages-user/client-base/src/hotkey/types.ts` | `d1cdf0c25530950a46bce801df63ed975665b451` | `IClientHotkey` |
| `packages-user/client-base/src/use/hotkey.ts` | `75e7f716a7655301d969285e22388414db1eb3c3` | `useKey` |
| `packages-user/client-base/src/use/types.ts` | `b92eb619e50341b7516f55b07040f45c70f0718d` | `IHotkeyUsing` |

### F. 应用层 / 入口（干净，结构参考）

| Path | HEAD hash | 用途 | 注意 |
|------|-----------|------|------|
| `packages-user/client-base/src/types.ts` | `cdf7224dc39118665b00a9697c31e6f5ae7c4f84` | `IGameUIPropsBase` / `IClientBase` / `IClientBaseExtended` | 干净 |
| `packages-user/client-modules/src/client.ts` | `3156c76b4a6fc6262f353259955bd06b6220da60` | `ClientCore` 创建两个 `UIController` | 干净 |
| `packages-user/client-modules/src/ui/func.ts` | `bd7386412bc5e1c40e2cc06325a8f26809ad76` | `createUIPropsBase` | 干净 |
| `packages-user/client-modules/src/render/renderer.ts` | `7f102c343d7d38ea83778205154e3d0ce6a815da` | `mainRenderer` / `createRendererFor` | 干净 |
| `packages-user/client-modules/src/render/use.ts` | `81d764410093a9baa5ad073dc6002ff2942d2d5f` | `transitioned` / `transitionedColor` | 干净 |
| `src/bootstrap.ts` | `e0f678e8103ccdbf0e02b071af18f000d6f64214` | 场景 UI 打开 | 干净 |
| `src/client/ui/main.tsx` | `3dc4f096cd1750707ba5bf56ea5597903235da11` | `mainUIController.render()` 挂载 | 干净；含 `core.*`，只参考结构 |
| `src/client/ui/load.tsx` | `b41ec3ddc145beae79424234f51198d2d78b7fd8` | `GameUI` + `custom` + `bindings` + `transitioned` | 干净 |
| `src/client/ui/inputBox.tsx` | `3eb246200ae3300f9f221a8e0e9142e5a612a696` | `InputBox` / `getInput` / `getInputNumber` | 干净；特殊组件 |
| `src/client/ui/title.tsx` | `9658447b77dc4c0a1bbd13a4266402f3a2d2b773` | `GameUI` + `transitioned` + `open` | 干净；含 `core.*`，只参考结构 |
| `src/client/ui/statusBar.tsx` | `1f3a351a5ba1783f67dbd32c41da39b34e4c2dda` | `GameUI` + 状态栏结构 | 干净；含 `core.*` |

未列入主参考的干净 `src/client/ui/*.tsx`：`background.tsx`、`save.tsx`、`settings.tsx`、`statistics.tsx`、`viewmap.tsx`、`waitBox.tsx`。其中 `settings.tsx` 与未提交的 `setting.tsx` 可能重复，使用前需确认；本批不依赖它们。

### G. 文档 / live 基础设施（干净）

| Path | HEAD hash | 用途 |
|------|-----------|------|
| `docs/.vitepress/components/renderDemo.vue` | `8ed38a889ceb66ac06f2742f185e176adc010f35` | live 包装器 |
| `docs/.vitepress/components/demos/basicRender.vue` | `1577085892cf6d6d4c77a0b45fe35bb5b612381e` | POC 基础渲染 |
| `docs/.vitepress/components/demos/uiSystem.vue` | `6cf03bcd72e100d28e43622ee0a1a1724cfd7639` | POC UIController |
| `docs/.vitepress/config.ts` | `4d66cfc87aee8cea8e7e2a9f523fbc677d5fce37` | 侧边栏、custom elements、Vue JSX |
| `docs/advanced/ii/index.md` | `df5bdfd3f228d7a5ea5380a9556f75d9c5b81871` | 高级 II 导览（需更新） |
| `docs/advanced/index.md` | `13a29d69669acba40a3cdf9b248d02ce7e1f35d4` | 高级总导览（需更新） |

### H. 旧文档（不作为依据）

| Path | Commit | 用途 |
|------|--------|------|
| `docs/guide/ui/perf.md` | 6bf3217 新增；e3d61ee 删除 | **旧性能优化文档，仍可参考**（见 Performance） |
| `docs/guide/implements/new-ui.md` | 6bf3217 新增；e3d61ee 删除 | 旧版 UI 入口；接口已过时，不作依据 |
| `docs/guide/implements/hotkey.md` | 6bf3217 新增；e3d61ee 删除 | 旧版按键；`useKey` 返回数组等已过时 |
| `docs/guide/implements/choice.md` | 6bf3217 新增；e3d61ee 删除 | 旧版确认/选择框；不作依据 |
| `docs/guide/ui/*`（`component.md` / `elements.md` / `system.md` / `ui.md` 等） | 6bf3217 新增；e3d61ee 删除 | 旧渲染文档，接口差距大，不作依据 |

### I. 明确排除（本次不参考）

**接口参考例外：** `src/client/ui/choices.tsx`（HEAD `1fbd21d16a0e30f0c10d0a94132268ee08f1ad76`，WT `d6f13d798e89b15079497194bdb459505b5834ea`）只允许读取 props / emits / 函数签名（`ConfirmBox` / `Choices` / `getConfirm` / `getChoice`），用于第 17 / 18 篇的特殊组件；不引用实现细节。

| Path | HEAD hash | WT hash | 原因 |
|------|-----------|---------|------|
| `src/client/ui/book.tsx` | `6d4800bd40c6c445a05f050d3dd24d8d72c9e3ef` | `cd4f13bb4480e93136931af06295b969fa6bf48a` | 工作树已改，用户明确排除 |
| `src/client/ui/bookDetail.tsx` | `c99dcf232208428d692b71ce3a435f349f90683e` | `c0c803dfbb75e0d27dac7693f92547889f98be5d` | 工作树已改，用户明确排除 |
| `src/client/ui/equipbox.tsx` | `edbb291e1d5f98f493f8079581e9d1b352f5203e` | `497e94132f96baaf8bbe5a5828a3a8c9ffbc7c68` | 工作树已改，用户明确排除 |
| `src/client/ui/hotkey.tsx` | `1392ced6f0acf72b4139ae1fc4f7528ae0cabc7b` | `db394bb619e14db8aa7e6496af552615ee3dfee7` | 工作树已改，用户明确排除 |
| `src/client/ui/toolbar.tsx` | `1ea2872fad3667b7ba1f5999e9d6683112991a13` | `e1fa9af16b19ed82f11a93ae18e65a8934aa07ef` | 工作树已改，用户明确排除 |
| `src/client/ui/setting.tsx` | —（未跟踪） | `b6519a1b855413a1c26e490bd1f073e4ea25b1f7` | 未提交，排除 |
| `src/client/ui/toolbox.tsx` | `26e5c217009c33cb98bb966674b13e964a762a1a` | `26e5c217009c33cb98bb966674b13e964a762a1a` | Git 干净，但用户点名为“未完善”，按排除处理 |
| `packages-user/client-base/src/components/thumbnail.tsx` | `cd76315b008fe119846c798a2bb259ed384e162d` | 同 HEAD | 锁定决策 6 明确不含 |
| `packages-user/client-base/src/components/tip.tsx` | `403f0ba5c5edc40469ff56251bd875e1d654f58b` | 同 HEAD | 锁定决策 6 明确不含 |
| `packages-user/client-base/src/map/*` | 多文件 dirty | 不同 | 地图渲染不属于本批 |
| `packages-user/client-base/src/setting/*` | 新增/未提交 | — | 设置系统不属于本批 |
| `src/client/ui/__test__/settingPageGate.test.ts` | —（未跟踪） | — | 测试文件，非文档参考 |
| `src/client/ui/__test__/uiContainerGate.test.ts` | —（未跟踪） | — | 测试文件，非文档参考 |

## Per-page Notes

> 每篇给“讲什么 / 关键接口 / 示例 / live / 注意 / 待确认”。示例只写正文代码块；live 用 `RenderDemo` + TSX demo 组件，不展示源码。live demo 可以只保留渲染部分（不声明 `controller/instance/state`）；需要 `controller` / `state` 的 UI 以代码块为主，或像 `uiSystem.vue` 那样在 demo 内自建最小控制器。

### 第 1 篇 · `ui-template.md` — UI 通用模板（TSX）

- **讲什么：** UI / canvas 一句话；作者写的文件在哪；最小 UI 模板；只改哪几行；用 `client.sceneController.open(...)` 打开；第一个 live。
- **关键接口：** `defineComponent`、`SetupComponentOptions`、`GameUI`、`IGameUIPropsBase`、`DefaultProps`、`controller.open`、`controller.close`、`sceneController.open`。
- **示例：** 上面“最小 TSX 模板”；`interface MyPanelProps extends IGameUIPropsBase, DefaultProps {}`；`props` 数组必须含 `controller`、`instance`、`state`；`GameUI('my-panel', MyPanel)`。
- **live：** `RenderDemo` + 一个 480×320 的 `container` + `g-rect` + `text`；不依赖 `core`；不要求一定跑，跑不起来保留内容。
- **注意：** 组件若不声明 `controller/instance/state`，`open` 传来的 props 不会成为组件 props；Props 基类必须是 `IGameUIPropsBase, DefaultProps`。
- **待确认：** 无（作者入口用 `ClientCore.sceneController`）。

### 第 2 篇 · `ui-template-ts.md` — 同一 UI 的 TS 写法（元素层）

- **讲什么：** 在 UI 组件内用元素层接口：`ref` 拿 `container`，`onMounted` 里 `new Rect()` / `new Text()` 并 `appendChild`；与第 1 篇 TSX 对照。不引入 `MotaRenderer` / `createElement` / 渲染器初始化。
- **关键接口：** `Container`、`Rect`、`Text`、`ref`、`onMounted`、`appendChild`、`size`、`pos`、`setFillStyle`、`setText`。
- **示例：** 上面的 TS 元素层模板；`host.value!.appendChild(rect, label)`。
- **live：** 用独立 TSX demo 组件展示同一画面（只保留渲染部分，不声明 `controller/instance/state`）；TS 代码只放代码块（锁定决策 4）。
- **注意：** TS 写法没有 Vue 响应式；改属性要调用 setter；`host.value!` 是组件内必定存在的非空断言；不要提渲染器、`createElement`、`registerElement`。
- **待确认：** 无（已找到不涉及 renderer 的应用层 TS 路径）。

### 第 3 篇 · `container-and-coordinates.md` — 容器与坐标

- **讲什么：** canvas 坐标与元素坐标；`container` 是布局与分组的基本单位；`loc` 六元组；锚点；应用层原点为什么是左上角。
- **关键接口：** `container`、`loc` / `anc`、`x/y/width/height/anchorX/anchorY`、`appendChild`、`removeChild`、`getBoundingRect`、`zIndex`。
- **示例：** 一个 480×320 根容器，里面两个 `container`（不同 `loc` / `anc`），再放 `g-rect` 标出边界。
- **live：** 嵌套容器 + 半透明矩形；可加 `text` 标注坐标。
- **注意：** 默认 `width/height=200`、`anchorX/anchorY=0`；`g-circle` / `g-ellipse` 默认锚点 0.5；应用层按“根容器左上角为原点、子元素相对父容器左上角”讲，不解释渲染器如何实现这个原点。
- **待确认：** 无。

### 第 4 篇 · `basic-shapes.md` — 基础图形

- **讲什么：** `g-rect` / `g-circle` / `g-ellipse` / `g-line` 的最小用法；填充 vs 描边；线宽、虚线、端点；命中区域。
- **关键接口：** `fill` / `stroke` / `strokeAndFill`、`fillStyle` / `strokeStyle`、`lineWidth` / `lineDash` / `lineJoin` / `lineCap`、`radius` / `radiusX` / `radiusY`、`x1/y1/x2/y2`、`line`、`circle`、`ellipse`、`actionStroke`。
- **示例：** 四个图形各一个；`g-rect` 用 `fill`，`g-line` 用 `stroke`；`g-circle` 用 `loc` 定位。
- **live：** 四个图形 + 点击变色（顺带引出第 10 篇）。
- **注意：** `fill` / `stroke` 是布尔模式，`fillStyle` / `strokeStyle` 才是样式；`g-line` 会自动按两点计算位置与大小；`g-rect` 默认填充、`g-line` 默认描边。
- **待确认：** 无。

### 第 5 篇 · `curves-and-paths.md` — 曲线与路径

- **讲什么：** `g-bezier` / `g-quad` 的控制点；`g-path` 的 `Path2D`；`g-rectr` 的圆角数组；路径命中。
- **关键接口：** `sx/sy/cp1x/cp1y/cp2x/cp2y/ex/ey`、`curve`、`sx/sy/cpx/cpy/ex/ey`、`path`、`circle` / `ellipse`、`Path2D`。
- **示例：** 一条三次贝塞尔、一条二次贝塞尔、一个 `Path2D` 折线、一个圆角矩形；用 `stroke` / `fill` 区分。
- **live：** 曲线 + 圆角矩形；可加 `actionStroke` 演示只点描边。
- **注意：** `g-bezier` / `g-quad` 默认描边；`g-path` / `g-rectr` 默认填充；`g-rectr` 的 `circle` 1–4 项、`ellipse` 2/4/6/8 项；`g-path` 的 `path` 必须是 `Path2D`。
- **待确认：** 无。

### 第 6 篇 · `text.md` — 文字

- **讲什么：** 单行文字；`Font`；填充/描边；文字尺寸自动计算；什么时候该用 `TextContent`（换行/打字机）。
- **关键接口：** `text`、`fillStyle`、`strokeStyle`、`strokeWidth`、`font`、`Font` 构造、`Font.defaults`、`Font.clone`。
- **示例：** 三种字号/颜色；带描边标题；`loc` 用锚点居中。
- **live：** 文字样式对照；可加一个 `Font.defaults({ size: 32, weight: 700 })`。
- **注意：** `Text` 不自动换行；`text` 标签默认 `nocache`；`fillStyle` 默认 `#fff`；`strokeWidth` 默认 1；不要给 `text` 设 `width/height` 期望裁剪（尺寸由文字测量决定）。
- **待确认：** 无。

### 第 7 篇 · `image-and-texture.md` — 图片与最小纹理

- **讲什么：** `image` 元素；`ITexture` / `Texture`；最小纹理怎么造；像素图设置；`icon` / `winskin` 只作占位。
- **关键接口：** `image` prop、`Texture` 构造、`ITexture.render()`、`noanti`、`hd={false}`。
- **示例：** 用 `document.createElement('canvas')` 画一个棋盘/色块，`new Texture(canvas)`，再 `<image image={texture} loc={[0,0,128,128]} noanti hd={false} />`。
- **live：** 动态生成纹理并显示；不依赖 `core`。
- **注意：** `Texture` 接受 `SizedCanvasImageSource`（`HTMLCanvasElement` / `ImageBitmap` / `HTMLImageElement` 等，排除 `VideoFrame` / `SVGElement`）；`Image` 按元素 `width/height` 拉伸；`icon` / `winskin` / `map-render` 只提及、不展开。
- **待确认：** 是否允许在文档里出现 `document.createElement('canvas')`（浏览器 API）作为“最小纹理”示例（Q2）。

### 第 8 篇 · `layer-transform-performance.md` — 层级、变换与性能

- **讲什么：** `zIndex` 遮挡；`scale` / `rotate` / `alpha`；`hidden`；`cache` / `nocache`；HD / 抗锯齿；`noevent`。
- **关键接口：** `zIndex`、`scale={[x,y]}`、`rotate`（弧度）、`alpha`、`hidden`、`cache` / `nocache`、`hd` / `anti` / `noanti`、`noevent`、`filter`、`composite`。
- **示例：** 两个重叠矩形用 `zIndex` 排序；一个矩形 `scale` / `rotate` / `alpha`；一个 `hidden` 切换；一个 `nocache` 对比。
- **live：** 按钮切换 `hidden` / `alpha` / `scale`；观察缓存与不缓存。
- **注意：** `scale` prop 是 `[x,y]` 数组，不要写成数字；`hidden` 优先，保留元素/状态，跳过绘制与命中；三元会创建/销毁并重置状态，只在必须真正不存在/重置/长期不用的重子树时使用；`fall` / `type` 是占位，不在正文展开。
- **待确认：** 无。

### 第 9 篇 · `reactivity.md` — 响应式

- **讲什么：** 从零讲 `ref` / `reactive` / `computed` / `watch`；TSX 里为什么要 `.value`；什么时候用 `shallowRef` / `markRaw`。
- **关键接口：** `ref`、`reactive`、`computed`、`watch`、`shallowRef`、`markRaw`、`nextTick`（可选）。
- **示例：** `const count = ref(0)`；`const doubled = computed(() => count.value * 2)`；按钮 `onClick` 改 `count.value`；`watch(count, ...)`。
- **live：** 计数器 + 计算属性 + 监听日志（用 `text` 显示）。
- **注意：** `reactive` 不能替换整个对象、解构会丢响应式；`ref` 在 TSX 中要 `.value`；组件 `props` 不要直接解构；Vue 官方文档可作延伸阅读（`vuejs.org/guide/essentials/reactivity-fundamentals`）。
- **待确认：** 无。

### 第 10 篇 · `events.md` — 事件与交互

- **讲什么：** 点击、按下、抬起、移动、进入、离开、滚轮；捕获与冒泡；`stopPropagation`；`noevent`；`cursor`；命中测试。
- **关键接口：** `onClick` / `onDown` / `onUp` / `onMove` / `onEnter` / `onLeave` / `onWheel`、`onClickCapture` 等；`IActionEvent` 的 `offsetX/offsetY`、`absoluteX/absoluteY`、`identifier`、`type`、`buttons`、修饰键、`stopPropagation`；`noevent`；`cursor`；`actionStroke`。
- **示例：** 点击矩形变色；`onEnter` 改 `cursor`；`onWheel` 改文字；一个 `noevent` 遮罩让事件下穿。
- **live：** 点击 / 悬停 / 滚轮；用 `text` 显示事件字段。
- **注意：** 事件名是 `onXxx`，不是 `@click`；`hidden` = 不显示、不交互；`noevent` 用于“可见但不接收交互”，会让 `cursor` 也无效；`enter/leave` 由根 hover 触发，不冒泡。
- **待确认：** 无。

### 第 11 篇 · `hotkey-in-ui.md` — 按键与快捷键

- **讲什么：** UI 作者会用到的按键接口；`useKey` 的作用域；`implement`；注册新指令与分组；`HotkeyEmitMode`；优先级 / 阻断；默认按键表。
- **关键接口：** `props.state.hotkey.system`、`useKey`、`IHotkeyUsing.implement` / `scope`、`system.addCommand`、`hotkey.setGroup`、`HotkeyEmitMode`、`priority` / `block` / `interval` / `timeout`、`IHotkeyEmitInfo`。
- **示例：** UI 内 `const key = useKey(props.state.hotkey.system)!; key.implement('@common/exit', () => props.controller.close(props.instance));`；再注册一个自定义指令并分组。
- **live：** 建议不配真实按键 live（docs 环境没有游戏 `HotkeySystem`）；可配一个“按 Esc 关闭”的说明性 demo，但不要伪装成真实系统。若用户要求，可用 DOM `keydown` 演示，但需标注“仅演示，不是引擎按键”。
- **注意：** `useKey` 必须在 `setup` 中调用；组件卸载自动离开作用域；组件内直接用 `useKey(...)!`，不加类型守卫；不要展开 `saveState` / `loadState` / `listen` / `preventDefault` / 内部匹配。
- **待确认：** 无（默认表只列 UI 相关项）。

### 第 12 篇 · `conditional-and-list-rendering.md` — 条件渲染与循环渲染

- **讲什么：** TSX 没有 `v-if` / `v-for`；条件用 `hidden` 或三元；循环用 `.map()`；`key` 什么时候要加。
- **关键接口：** `hidden`、三元表达式、`.map()`、`key`、`noevent`。
- **示例：** `hidden={!open.value}` 切换面板；`{items.value.map(item => <ItemCell key={item.id} item={item} />)}`（列表会增删/重排时加 `key`；固定顺序可省略）；对比三元卸载。
- **live：** 一个开关切换 `hidden`；一个列表增删；观察状态是否保留。
- **注意：** `hidden` 保留元素/状态，跳过绘制与命中；三元卸载并重置状态；`dev.md:122` 的 `key` 规则；不要为规避重挂载问题加 `key`（`dev.md:123`）。
- **待确认：** 无（按 `dev.md:122` 的 key 规则写）。

### 第 13 篇 · `props.md` — props

- **讲什么：** 组件参数怎么声明；`SetupComponentOptions` 的 `props` 数组；camelCase；默认值；props 是响应式对象；不要解构；emits。
- **关键接口：** `defineComponent<Props>`、`SetupComponentOptions`、`props` 数组、`emits`、`emit`、`withDefaults`（本项目不用，改用 `??`）。
- **示例：** `ItemCell` 接收 `item: Item`、`selected: boolean`、`onSelect`；`props: ['item', 'selected']`。
- **live：** 两个 `ItemCell` 传不同 props；点击回调。
- **注意：** `props` 数组必须列全；属性名 camelCase；`props` 解构会失去响应式（Vue 官方）；默认值用 `props.x ?? 默认`；`update:xxx` 这类 emits 用 `v-model:xxx` 消费，不教手动 `onUpdate:xxx`。
- **待确认：** 无。

### 第 14 篇 · `component-tsx.md` — 组件（TSX）

- **讲什么：** 一个完整 TSX 组件的结构；`defineComponent` + `SetupComponentOptions`；`setup` 返回 render 函数；生命周期；`emit` / `expose`；组件与 UI 的区别。
- **关键接口：** `defineComponent`、`SetupComponentOptions`、`onMounted` / `onUnmounted`、`ref`、`computed`、`emit`、`expose`、`slots`。
- **示例：** `Progress` 或 `ItemCell` 完整组件；`props` + `computed` + `return () => (...)`。
- **live：** 一个可复用 `ItemCell` 或 `Progress`；不依赖 `core`。
- **注意：** 组件不声明 `controller/instance/state` 就不是 UI，不能直接 `new GameUI` 打开；UI 组件必须 `extends IGameUIPropsBase, DefaultProps`；`defineComponent` 的第二个参数是 `SetupComponentOptions`。
- **待确认：** 无（建议把“组件 vs UI”用一小节讲清）。

### 第 15 篇 · `component-ts.md` — 组件（TS 直调）

- **讲什么：** 不用 Vue，直接写一个元素层类；`extends Container` / `extends RenderItem`；`render(canvas, transform)`；`appendChild`；`update`；`requireCanvas`；`CustomRenderItem`。
- **关键接口：** `Container`、`RenderItem`、`render`、`appendChild`、`update`、`requireCanvas` / `deleteCanvas`、`CustomRenderItem.setRenderFn`。
- **示例：** 一个 `class Badge extends Container`，在 `render` 里画圆/文字；在 UI 组件里 `host.value!.appendChild(new Badge())`。不写 `registerElement` / `createElement` / `renderer`。
- **live：** 用 TSX 等价组件展示同一画面；TS 类只放代码块。
- **注意：** TS 直调是“元素层级”，不是“UI 级”；`UIController` 要的是 Vue 组件（`IGameUI.component`），TS 类不能直接 `new GameUI` 打开。自定义标签注册属于渲染器内部，不在应用层文档展开；本批只讲 `appendChild` 挂载。
- **待确认：** 无（第 15 篇只讲类 + `appendChild`）。

### 第 16 篇 · `slots-and-attrs.md` — slots 与 attrs

- **讲什么：** TSX 中默认 slot / 具名 slot / 作用域 slot；`attrs` 透传；`inheritAttrs`；什么时候用 slot，什么时候用 props。
- **关键接口：** `slots.default?.()`、`slots.title?.(data)`、`SlotsType`、`attrs`、`inheritAttrs`、`SetupComponentOptions`。
- **示例：** `Panel` 组件：`slots.title?.()` + `slots.default?.()`；`Field` 组件：`<TextContent {...attrs} />` 透传。
- **live：** 一个带标题 slot 与默认 slot 的面板。
- **注意：** Vue JSX 的 slot 是函数；具名 slot 用对象；`attrs` 在自定义渲染器里仍走 `patchProp`，所以属性名必须 camelCase；`Input` / `Textbox` 都用了 `{...attrs}` 透传 TextContent 参数（`input.tsx:261-270`、`textbox.tsx:539-548`）。
- **待确认：** 无。

### 第 17 篇 · `builtin-text-and-input.md` — 内置组件（文本/输入）

- **讲什么：** `TextContent`、`Textbox`、`Input` 的稳定 props / events / expose；打字机；标题/背景；输入框；`InputBox` 作为特殊组件。
- **关键接口：** `TextContentProps` / `TextContentEmits` / `TextContentExpose`；`TextboxProps` / `TextboxExpose` / `TextboxStore`；`InputProps` / `InputEmits`；`InputBoxProps` / `getInput` / `getInputNumber`。
- **示例：** `TextContent` 打字机；`Textbox` 带标题；`Input` 用 `v-model:value`；`getInput` 异步弹窗。
- **live：** 不要求一定能跑；`TextContent` / `Textbox` / `Input` 可按需放，跑不起来保留代码块；`InputBox` 依赖 `state`，以代码块为主。
- **注意：** `TextContent` 的 `width` 必填；`Textbox` 的 `icon` / `winskin` 依赖 `core`，只作占位；`Input` 的 `update:value` 用 `v-model:value` 消费，不教手动 `onUpdate:value`。
- **待确认：** 无。

### 第 18 篇 · `builtin-list-and-containers.md` — 内置组件（列表/容器）

- **讲什么：** `List` / `ListPage` / `Page` / `Scroll` / `Selection` 的稳定用法；`ConfirmBox` / `Choices` 作为特殊组件（必须写）。
- **关键接口：** `ListProps` / `ListEmits`；`ListPageProps` / `ListPageSlots`；`PageProps` / `PageEmits` / `PageExpose`；`ScrollProps` / `ScrollExpose`；`SelectionProps`；`ChoicesProps` / `ChoicesEmits`；`ConfirmBoxProps` / `ConfirmBoxEmits`；`getChoice` / `getConfirm`。
- **示例：** `List` 的 `v-model:selected`；`ListPage` 的动态 slot；`Page` 的分页 slot；`Scroll` 的平铺列表；`Selection` 的无事件光标；`getChoice` 单次选择。
- **live：** 不要求一定能跑；`Page` / `Scroll` / `Selection` 可按需放，跑不起来保留代码块；`Choices` 以代码块为主。
- **注意：** `List` 用 `v-model:selected`，不要教手动 `onUpdate:selected`；`Scroll` 只对直接子元素做虚拟滚动；容器标签统一 `container-custom`；`Choices` 只按接口讲，不引用实现。
- **待确认：** 无。

### 第 19 篇 · `ui-controller-and-stack.md` — UIController 与 UI 栈

- **讲什么：** UI 系统的模型；`GameUI` / `UIController` / `UIInstance` / `UIContainer`；栈、背景、`active` / `showBack`；`open` / `close` / `closeAll`；`lastOnly` / `showAll` / `showCustom`；`keep`；场景 UI vs 主 UI。
- **关键接口：** `open`、`close`、`closeAll`、`hide` / `show`、`stack`、`background`、`backIns`、`active`、`showBack`、`setBackground`、`hideBackground` / `showBackground` / `showingBack`、`keep`、`lastOnly` / `showAll` / `showCustom`、`render`、`setPropsBaseCreator`。
- **示例：** 用 `client.sceneController` 打开一个面板；关闭自己；`keep` 防闪烁；`showAll` 叠加；`setBackground`。
- **live：** 复用 `uiSystem.vue` 的模式：一个 `UIController` + 一个最小 `GameUI` + 打开/关闭按钮；不需要 `core`。
- **注意：** `close` 在栈模式下会连带关闭上层；`alwaysShow` 不会被 `hide`；UI Props 用 `IGameUIPropsBase, DefaultProps`；不需要解释渲染器。
- **待确认：** 无。

### 第 20 篇 · `replace-builtin-ui.md` — 修改/替换内置 UI

- **讲什么：** “内置 UI”指 `src/client/ui` 里的 UI（设置、存档、工具栏等），不是泛指内置组件。三种改法：改打开处、包装组件、替换显示策略/背景；不要直接改 `packages`。
- **关键接口：** `client.sceneController.open(YourUI, ...)` / `props.controller.open(...)`、组件包装（转发 props / slots / emits）、`showCustom` / `lastOnly` / `showAll`、`setBackground`、`keep`。
- **示例：** 用 `MySaveUI` 替换 `SaveUI` 的打开处；用 `MyTextbox` 包装 `Textbox` 并加默认标题；用 `showAll` 让设置面板叠加。
- **live：** 两个显示策略的对比（`lastOnly` vs `showAll`）。
- **注意：** 当前没有全局 UI 注册/覆盖入口；替换发生在打开处或包装组件。保持 props / emits 契约，避免调用方改一堆代码。
- **待确认：** 无（按“打开处替换 / 包装 / 显示策略”写）。

### 第 21 篇 · `ui-performance.md` — UI 系统性能与注意事项

- **讲什么：** UI 系统的性能关注点：缓存、脏更新、HD/抗锯齿、`hidden` vs 三元、列表 `key`、组件粒度、`Scroll` / `Page`、`keep` / `background`、`createPropsBase`。
- **关键接口：** `cache` / `nocache`、`hd` / `anti` / `noanti`、`hidden`、`key`、`Scroll`、`Page`、`keep`、`setBackground`、`active`、`showBack`。
- **示例：** 一个高频更新的小面板 + 一个稳定背景；对比 `hidden` 与三元；对比缓存/不缓存。
- **live：** 切换 `hidden` / `cache`；显示 `active` / `showBack` 状态。
- **注意：** 旧性能文档的 `sprite` 已改名 `custom`；容器标签统一 `container-custom`；`hidden` = 不显示、不交互，保留元素/状态；`createPropsBase` 每次渲染都会调用（`container.tsx:34`），不要在 creator 里做重活。
- **待确认：** 无。

### 第 22 篇 · `inventory-example-1-skeleton.md` — 示例（一）目标与骨架

- **讲什么：** 完整示例的目标：背包/装备面板；先给最终效果与文件拆分；只写骨架：根容器、背景、标题、关闭按钮、内容区占位。
- **关键接口：** `GameUI`、`defineComponent`、`SetupComponentOptions`、`IGameUIPropsBase`、`DefaultProps`、`container`、`g-rectr`、`text`、`controller.open` / `close`、`sceneController.open`。
- **示例：** 720×480 根容器；`interface InventoryPanelProps extends IGameUIPropsBase, DefaultProps {}`；`g-rectr` 背景；标题；`ItemGrid` / `ItemDetail` 占位；`export const InventoryUI = new GameUI('inventory-panel', InventoryPanel)`。
- **live：** 只显示骨架与关闭按钮；点击关闭调用 `props.controller.close(props.instance)`。
- **注意：** 不引入 `core` / 真实素材；所有图标用 `g-rect` / `g-rectr` + `text` 假数据；组件拆分从第一天就定好，后面只填内容；Props 基类用 `IGameUIPropsBase, DefaultProps`。
- **待确认：** 6 篇是 6 个文件还是同一文件 6 节（Q3）；示例文件名（Q3）。

### 第 23 篇 · `inventory-example-2-grid.md` — 示例（二）道具网格

- **讲什么：** 道具数据模型；网格布局；`ItemCell` 子组件；选中态；`.map()` 渲染；`key` 规则。
- **关键接口：** `ref`、`computed`、`Item` 接口、`ItemCell` props、`g-rectr` / `text`、`onClick`、`hidden` / `alpha`、`key`。
- **示例：** `items: Item[]`；5 列网格；`ItemCell` 显示名字/数量；选中项边框变色；`selectedId` 用 `ref`。
- **live：** 点击格子选中；选中态切换。
- **注意：** 列表顺序固定、无状态时可先不加 `key`；只有后续会增删/重排时再加（`dev.md:122`）；不要用 `v-for`。
- **待确认：** 无。

### 第 24 篇 · `inventory-example-3-detail.md` — 示例（三）详情区

- **讲什么：** 详情区布局；`computed` 取当前道具；条件显示；名称/描述/数量；用 `TextContent` 处理长描述。
- **关键接口：** `computed`、`hidden` / 三元、`TextContent`、`text`、`loc`、`autoHeight`、`width`。
- **示例：** 右侧详情面板；`selectedItem = computed(() => items.value.find(...))`；`hidden={!selectedItem.value}`；描述用 `TextContent` 自动换行。
- **live：** 选中不同格子，详情区更新；无选中时显示“请选择道具”。
- **注意：** `TextContent` 的 `width` 必填；长文本不要用 `text`（不换行）；`hidden` 保留状态，适合频繁切换。
- **待确认：** 无。

### 第 25 篇 · `inventory-example-4-scroll.md` — 示例（四）滚动与列表

- **讲什么：** 道具很多时用 `Scroll` / `Page` / `ListPage`；平铺 vs 虚拟滚动；`Scroll` 的直接子元素要求；`ListPage` 的左右分栏。
- **关键接口：** `Scroll`、`Page`、`ListPage`、`ScrollExpose.scrollTo`、`PageExpose.changePage`、`ListPageSlots`。
- **示例：** 把网格换成 `Scroll` 的平铺 `ItemCell`；或 `ListPage` 左列表右详情；用 `ref` 拿 `ScrollExpose` / `PageExpose`。
- **live：** 20–50 个假道具滚动；点击滚动条或滚轮。
- **注意：** `Scroll` 只对直接子元素做虚拟滚动，不要把全部内容包在一个 `container` 里；容器标签统一 `container-custom`；`Page` 适合分页，`Scroll` 适合连续滚动。
- **待确认：** 无。

### 第 26 篇 · `inventory-example-5-state.md` — 示例（五）交互与状态

- **讲什么：** 装备/使用按钮；数量变化；`computed` 派生状态；`watch` 副作用；`useKey` 关闭/确认；`noevent` 遮罩；`cursor`。
- **关键接口：** `ref`、`computed`、`watch`、`useKey`、`emit`、`noevent`、`cursor`、`hidden`、`disabled` 视觉。
- **示例：** “装备”按钮改 `equippedId`；“使用”按钮减数量；`watch` 打印/提示；`useKey` 绑定 `@common/exit`；背景遮罩 `noevent`。
- **live：** 点击装备/使用；数量变化；按键关闭（若 live 不可用，只做按钮）。
- **注意：** 不要展开 `core`；`useKey` 需要 `props.state.hotkey.system`，组件内用 `useKey(...)!`；`noevent` 让事件下穿；按钮禁用用 `alpha` / `hidden` 表达。
- **待确认：** 无。

### 第 27 篇 · `inventory-example-6-animation-and-register.md` — 示例（六）动画、拆分与注册

- **讲什么：** 简单动画（`transitioned`）；把大组件拆成 `InventoryPanel` / `ItemGrid` / `ItemCell` / `ItemDetail` / `ActionBar`；注册 `GameUI`；打开/关闭；`keep` 防闪烁；最终 live。
- **关键接口：** `transitioned` / `transitionedColor`、`onMounted` / `onUnmounted`、`GameUI`、`controller.open` / `close`、`keep`、`hidden`、`alpha`。
- **示例：** 选中格子的 `alpha` / `scale` 渐变；详情区淡入；拆分后的文件结构；`InventoryUI` 注册；打开处替换。
- **live：** 完整背包面板：网格、详情、滚动、装备/使用、关闭、动画。
- **注意：** `transitioned` 必须在组件内使用（依赖 `getCurrentInstance`）；`onUnmounted` 清理；最终 live 不展示源码。
- **待确认：** Q3、Q4。

## Common Pitfalls

| 坑 | 后果 | 规避 |
|----|------|------|
| 属性写成 kebab-case（`anchor-x` / `z-index`） | `patchProp` 不命中，静默无效 | 只用 camelCase；文档示例统一 camelCase |
| 容器标签写成 `custom-container` | 文档口径错误，示例与类型不一致 | 统一写 `container-custom` |
| 在 `container` 里直接写文字 | 空白变 `Comment`，非空白警告并生成 `Text` | 一律 `<text text="..." />` |
| 用 `key` 规避重挂载问题 | 违反 `dev.md:123`，掩盖真实行为 | 按“可正常重挂载”假设写；`key` 只用于身份 |
| 用 `GameUI.get` 覆盖内置 UI | 没有注册表支撑 | 在打开处替换，或包装组件 |
| 在文档示例里引用 `core.*` | 违反锁定决策 5，且 live 不可复现 | 用 `g-rect` / `text` / 假数据 |
| `scale` 写成数字 | TSX 的 `scale` 是 `[x,y]` 数组 | 元素用 `scale={[x,y]}` |
| `TextContent` 不传 `width` | 类型/运行都要求宽度 | 文档示例必须给 `width` |
| 用 `v-model` 绑 `Input` | 组件声明的是 `value` / `update:value` | 用 `v-model:value` |

## Don't Hand-Roll

| 问题 | 不要自己写 | 用现成的 | 原因 |
|------|------------|----------|------|
| 长列表 / 虚拟滚动 | 手写可视区域裁剪 | `Scroll` | 已经处理 transform、滚轮、拖动、滚动条 |
| 分页 | 手写页码与左右箭头 | `Page` | 已处理页码、边界、slot |
| 左列表右详情 | 手写选中与分栏 | `ListPage` | 已处理 `basis` / `right` / slot |
| 文本换行 / 打字机 | 手写逐字定时器 | `TextContent` / `Textbox` | 已处理分词、行高、图标、等待 |
| 输入框 | 手写 DOM input 对齐 | `Input` | 已处理矩阵对齐、多行、失焦 |
| UI 栈 / 背景 / 防闪烁 | 手写 `open` 数组 | `UIController` + `keep` | 已处理栈策略、`alwaysShow`、背景 |
| 按键作用域 | 手写 `keydown` + 清理 | `useKey` | 已处理作用域、组件卸载、优先级 |
| 选择光标 | 手写闪烁矩形 | `Selection` | 已处理动画与颜色/皮肤 |
| 缓存策略 | 手写脏标记 | `cache` / `nocache` / `update` | 元素层已有脏更新与缓存 |

## Open Questions (RESOLVED — 已落到 10-43..10-50 各批 Task 0 裁决) / Need User Confirmation

> 只保留真正未决、且会影响写作/落位的问题。已被用户确认的入口、`hidden`、`container-custom`、`key`、特殊组件、内置 UI 定义、Props 基类、emits、useKey、renderer 边界、旧性能文档定位，都不再列为问题。
>
> **状态（10-43..10-50 计划修订时更新）：** Q1–Q6 均已落到对应批次 Task 0 由用户逐项裁决——Q1（目录/文件名/侧边栏层级）与 Q3（完整示例拆分）→ 10-43 Task 0 命名清单；Q2（第 7 篇纹理造法）→ 10-44 Task 0；Q4（导览更新时机）→ 10-43 Task 1；Q5（第 20 篇力度）→ 10-46 Task 0；Q6（`Choices` 命名）→ 10-46 Task 0。**本批计划不再把它们当作未决项**；若用户在对应 Task 0 改判，以用户当轮裁决为准。

### Q1. 目录 / 文件名 / 侧边栏层级

- **建议：** `docs/advanced/ii/ui/` + 上文 27 个文件名；侧边栏嵌套 6 个子分组。
- **需确认：** 是否接受 `ui/` 子目录；是否接受 `inventory-example-*` 前缀；侧边栏是嵌套还是 27 条平铺。

### Q2. 第 7 篇最小纹理是否用 `document.createElement('canvas')`

- **已知：** `Texture` 接受 `SizedCanvasImageSource`；用 canvas 造纹理最直观。
- **需确认：** 面向“连 canvas 都不知道”的读者，是否允许出现 `document.createElement('canvas')` 作为最小示例；若不允许，改用 `ImageBitmap` / 现成图片占位。

### Q3. 完整示例 6 篇的文件拆分与 demo 位置

- **建议：** 6 个文件（每篇一个）；示例组件放 `docs/.vitepress/components/demos/ui/inventory/`；正文只引用 live。
- **需确认：** 是否接受该拆分；demo 目录/命名是否用 `docs/.vitepress/components/demos/ui/*.tsx`。

### Q4. 高级 II 导览 / 高级总导览的更新时机

- **已知：** 两处都写“只写数据端 / 渲染端未完工”，新增 UI 子分组后会矛盾。
- **建议：** 在 Task 0（或第一批 UI 文档落地时）同步更新导览，不要等到 27 篇写完；只改措辞并加 UI 阅读路径。
- **需确认：** 是否在 Task 0 一并改，还是等第一批 UI 文档落地时改。

### Q5. 第 20 篇替换内置 UI 的示例力度

- **已知：** 内置 UI 指 `src/client/ui`；没有全局替换 API；当前写法是“打开处替换 / 包装组件 / 显示策略/背景”。
- **需确认：** 第 20 篇是否还需要“复制内置 UI 源码再改”的完整示例；还是只讲打开处替换、包装与显示策略。

### Q6. `Choices` 的文档名用 `Choices` 还是 `ChoicesBox`

- **已知：** 源码导出 `Choices` / `ChoicesUI`；用户称 `ChoicesBox`。
- **建议：** 正文标题用“Choices（选项框）”，代码用 `Choices` / `ChoicesUI`，必要时注明 `ChoicesBox` 是同一组件的称呼。
- **需确认：** 是否保留 `ChoicesBox` 作为别名，还是统一只用源码名。

## Assumptions Log

| # | 假设 | 章节 | 如果错了的影响 |
|---|------|------|----------------|
| A1 | 27 个文件名与 `ui/` 目录可接受 | Docs Placement / Q1 | 侧边栏与链接全要改 |
| A2 | 第 7 篇可用 `document.createElement('canvas')` 造最小纹理 | Q2 | 改用 ImageBitmap / 图片占位 |
| A3 | 完整示例拆 6 个文件、demo 放 `demos/ui/inventory/` | Q3 | 示例与 live 路径要改 |
| A4 | 高级 II / 总导览在 Task 0 或第一批落地时更新 | Q4 | 导览与正文暂时矛盾 |
| A5 | 第 20 篇只讲打开处替换/包装/显示策略 | Q5 | 需要补“复制源码”示例 |
| A6 | `Choices` 正文用源码名，`ChoicesBox` 仅作别名 | Q6 | 标题与代码命名要改 |
| A7 | Vue 3 的 `ref/reactive/computed/watch` 行为按官方文档 | 第 9 篇 | 低风险；官方文档已核对 |
| A8 | 旧性能文档的 `sprite` 可映射为 `custom` | Performance | 第 21 篇旧文引用要改 |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 全流程 | ✓ | `v24.21.0` | — |
| VitePress | live / build | ✓ | `node_modules/vitepress` | — |
| Prettier | D-45 | ✓ | `node_modules/prettier` | — |
| TypeScript / vue-tsc | 类型检查 | ✓ | `typescript 6.0.3` | — |
| pnpm CLI | 项目脚本 | ✗（PowerShell 执行策略阻止 `.ps1`） | — | 用 `node node_modules/...` 直接跑；或 `pnpm.cmd` |
| 浏览器 | live 目视检查 | 需人工 | — | 无自动化替代 |

**Missing dependencies with no fallback：** 无（pnpm 是 shell 策略问题，不是缺包）。

**Missing dependencies with fallback：** pnpm CLI 在当前 PowerShell 会话被阻止；文档写作可用 `node node_modules/prettier/bin/prettier.cjs`、`node node_modules/vitepress/bin/vitepress.js` 直接执行。

## Validation Architecture

> 本批是文档改写，不是代码功能；验证以构建、格式、链接与人工阅读为主。`workflow.nyquist_validation` 为 `true`，但无 REQ ID 提供。

### Test Framework

| Property | Value |
|----------|-------|
| Framework | 无单元测试框架用于文档；VitePress build + Prettier |
| Config file | `docs/.vitepress/config.ts`、`.prettierrc` |
| Quick run command | `node node_modules/prettier/bin/prettier.cjs --check "docs/advanced/ii/ui/*.md"` |
| Full suite command | `node node_modules/vitepress/bin/vitepress.js build docs` |

### Phase Requirements → Test Map

| 行为 | Test Type | Command | File Exists? |
|------|-----------|---------|--------------|
| 文档格式符合 Prettier | 格式 | `node node_modules/prettier/bin/prettier.cjs --check "docs/advanced/ii/ui/*.md"` | ❌ 目录待建 |
| 站点构建通过 / 死链 | 构建 | `node node_modules/vitepress/bin/vitepress.js build docs` | ✅ 现有站点 |
| live 示例可渲染 | 人工 | 浏览器打开文档页 | ❌ demo 待建 |
| 读者可理解 | 人工 | 用户主导修订循环（D-46 / D-89） | — |

### Sampling Rate

- **每篇写完：** Prettier check。
- **每组合并：** 构建一次。
- **阶段收口：** 全站构建 + 用户人工审阅 + live 目视。

### Wave 0 Gaps

- [ ] `docs/advanced/ii/ui/` 目录与 27 个 `.md`。
- [ ] `docs/.vitepress/components/demos/ui/*.tsx` live demo。
- [ ] `docs/.vitepress/config.ts` 侧边栏注册。
- [ ] `docs/advanced/ii/index.md` / `docs/advanced/index.md` 措辞更新。
- [ ] 用户确认 Q1–Q6 中影响落位的项（至少 Q1/Q3）。

## Security Domain

> `security_enforcement` 为 true，但本批是静态文档改写，没有认证、会话、访问控制、加密或用户输入处理。

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | 文档无运行时输入；live 只接收本地组件 |
| V6 Cryptography | no | — |

**Known threat patterns：** 无新增。文档代码块不执行远程脚本；`RenderDemo` 只 import 仓库内组件；`Input` 的 live 若使用，只创建本地 DOM input，不写存储、不发请求。

## Sources

### Primary (HIGH confidence)

- 仓库源码（逐文件哈希见 Reference Manifest）：`packages/render/src/core/*`、`packages/render-vue/src/*`、`packages/system/src/ui/*`、`packages/system/src/hotkey/*`、`packages-user/client-base/src/components/*`、`packages-user/client-modules/src/*`、`src/client/ui/main.tsx`、`src/client/ui/load.tsx`、`src/bootstrap.ts`。
- Vue 官方文档：`https://vuejs.org/guide/essentials/reactivity-fundamentals.html`（2026-10-30 读取）。
- Vue 官方文档：`https://vuejs.org/guide/extras/render-function.html#jsx-tsx`（2026-10-30 读取）。

### Secondary (MEDIUM confidence)

- 旧性能文档 `docs/guide/ui/perf.md`（6bf3217 新增，e3d61ee 删除）：内容仍可参考，但旧标签名需映射。
- 旧 UI / 按键 / 选择框文档（`docs/guide/implements/new-ui.md`、`hotkey.md`、`choice.md`）：只用于了解历史，不作为接口依据。

### Tertiary (LOW confidence)

- 第 17/18 篇内置组件 live 的构建可行性：未实际运行构建（只读调研）；live 不要求一定跑，跑不起来保留代码块。

## Metadata

**Confidence breakdown：**

- **Standard stack：HIGH** — `package.json` 与现有文档站结构已核对。
- **Render engine / Vue bridge：HIGH** — 逐文件阅读源码，关键值已引用行号。
- **UI system / Hotkey：HIGH** — 逐文件阅读源码；未运行行为测试。
- **Built-in components：HIGH（公开 props）/ MEDIUM（行为）** — props/emits/expose 来自源码；`core` 相关行为未展开。
- **Docs placement：HIGH（现有结构）/ MEDIUM（建议命名）** — 现有侧边栏已核对；新目录/文件名待用户确认。
- **Performance：MEDIUM** — 源码机制已核对；旧性能文档的建议需要按新标签名改写。
- **Author entry：HIGH** — 用户确认用 `ClientCore.sceneController`；`bootstrap.ts` 已有调用示例。
- **Legacy docs：MEDIUM** — 旧性能文档可参考；其余旧文档明确不作为依据。

**Research date：** 2026-10-30
**Valid until：** 2026-11-29（30 天；若 `src/client/ui` 的 dirty 文件或 `packages-user/client-base` 的入口变化，需重新核对）

---

*Phase: 10-docs-restructure · 高级 II 子分组「自定义 UI 与渲染」· 只读调研*

## 编号变更（2026-11-01）

本文件提到的 `10-43..10-50` 与旧 10-49 / 10-50 分工已因计划重排而改变；本文件正文保持原样，读到时按下列映射理解：

- 旧 10-49（独立读者审阅）→ `10-53-PLAN.md`（读者循环 Round 2/3；Round 1 记录保留在 `10-49-READER-REVIEW.md`）。
- 旧 10-50（用户修订与收尾）→ `10-54-PLAN.md`。
- 新增 `10-49`..`10-52` 为 Part 0–1 / 2–3 / 4 / 5 的深度扩写（D-93）；`10-48` 仍为 pre-review 修复。
- 旧 `10-49-PLAN.md` / `10-50-PLAN.md` 已被新计划替换。
