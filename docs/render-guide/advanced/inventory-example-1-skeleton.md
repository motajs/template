# 示例（一）目标与骨架

前面五批讲的是零件：模板、元素、响应式、事件、组件、内置组件与 UI 栈。这一批把它们装成同一个能用的面板——一个背包 / 装备界面。六篇按「每一步只加一小段」推进，本篇先定目标、拆分与骨架。

## 前置知识

阅读本篇前，建议先读完：

- [第一个静态界面](../basics/first-static-ui.md)
- [容器与坐标](../basics/container-and-coordinates.md)

## 这一步要解决什么

最终面板是一块 720×480 的区域：

- 顶部是标题与关闭按钮。
- 左侧是 5 列的道具网格，格子显示名称与数量。
- 右侧是选中道具的详情，没有选中时显示提示。
- 底部是装备 / 使用 / 关闭按钮。
- 道具变多后，左侧网格可以滚动。

本篇只做外框、标题、关闭按钮与左右两个占位区。网格、详情、滚动、交互与动画留到后面五篇，每一步都在这份骨架上继续填，不另起一套实现。

先搭骨架、后填数据，是因为骨架决定了每个后续节点「挂在哪里」：左侧区域有多大，网格就知道自己的行列要按什么尺寸排；右侧区域在哪，详情就知道自己该占多少文字宽度；底部操作条从哪开始，滚动区才不会压到按钮上。如果先写数据再回头调坐标，读者每加一步都要重新算一遍布局，最后也很难说清某一行代码到底属于树上的哪一层。

## 骨架在渲染树里的位置

先把最终面板的节点定下来，后面每一步都往这棵树里加东西。根 `container` 下依次是画布底色、面板主体、标题、关闭按钮、左侧占位与右侧占位，它们都是兄弟节点；树形规则本身见[第 2 篇「容器与坐标」](../basics/container-and-coordinates.md#渲染树根容器与子元素)。

三个区域是根容器的子容器，彼此是兄弟关系。它们的坐标都相对根容器的左上角：

- 面板主体在 `[30, 30]`，尺寸 `660×420`，所以内容可用范围是 `x` 从 30 到 690、`y` 从 30 到 450。
- 左侧区域 `[54, 100, 400, 280]`，右边界 454；右侧区域 `[470, 100, 196, 280]`，两者之间留 16 像素空隙。
- 底部操作条在示例（五）加到 `[54, 392, 304, 32]`：左侧区域的下边界是 `100 + 280 = 380`，操作条从 392 开始，`380 < 392`，两者不重叠。

720×480 是 UI 的逻辑尺寸，不是浏览器窗口尺寸。UI 被缩放显示时会按逻辑坐标整体变换，所以坐标只需要按 720×480 算一次，不必为不同窗口大小写几套。

它和第 2 篇说的「画布设计尺寸」是同一件事的两层：`props.state.renderer.width` / `height` 是客户端配置的画布尺寸（示例站点是 480×320），面板根容器再在这个画布上按自己的 `loc` 定位。面板根占多大、是否铺满，由你写的 `loc` 决定；示例写 `[0, 0, 720, 480]`，所以它相对 UI 容器从左上角开始。画布比面板小时，超出的部分不会自动缩小或居中；需要适配不同窗口时，读 `renderer.width` / `height` 自己算位置。

分工可以记成一句：面板内部坐标一律相对面板根（示例按 720×480 设计），画布尺寸只决定面板根放在哪、最终如何缩放。先把面板当成固定设计稿写坐标，再在打开处按画布适配。

跑起来的方式不在本系列重复，见仓库根目录的 `dev.md`。示例站画布是 480×320，720×480 的面板超出画布的部分不会自动缩放，只会不可见；先按画布尺寸调面板根，或整体缩放。

第一次在示例站（480×320）验证时，不用重排内部坐标：给面板根加 `scale={[2 / 3, 2 / 3]}`（比例取 `min(480 / 720, 320 / 480)`），`loc` 仍写 `[0, 0, 720, 480]`，整棵树会按同一比例缩小并完整落在 480×320 里。确认画面之后，如果要正式适配不同窗口，再按 `renderer.width` / `height` 改根 `loc` 并重排内部区域；不要同时改内部坐标和加缩放，否则会缩两次。

同一父级下的遮挡按 `zIndex` 与加入顺序决定：关闭按钮画在面板主体之后，因此会盖在主体上，点击落在按钮矩形里就由它接收。完整层级规则见[第 7 篇「层级、变换与性能」](../basics/layer-transform-performance.md#渲染树层级与绘制顺序)。

## 组件与文件怎么分

组件拆分在骨架阶段就定下来，后面只往对应文件里填内容，不再改结构：

| 文件                  | 导出             | 职责                                       | 主要 props                                         |
| --------------------- | ---------------- | ------------------------------------------ | -------------------------------------------------- |
| `inventory-panel.tsx` | `InventoryPanel` | 根容器、标题、关闭按钮、左右分栏与共享状态 | `controller` / `instance` / `state`                |
| `item-grid.tsx`       | `ItemGrid`       | 按行列排出道具网格，把点击事件交回父组件   | `items` / `selectedId` / `equippedId` / `onSelect` |
| `item-cell.tsx`       | `ItemCell`       | 单个道具格子：背景、名称、数量、选中态     | `item` / `selected` / `equipped` / `size`          |
| `item-detail.tsx`     | `ItemDetail`     | 右侧详情：名称、数量、描述与未选中提示     | `item` / `onClear`                                 |
| `action-bar.tsx`      | `ActionBar`      | 底部按钮：装备 / 使用 / 关闭               | `canEquip` / `canUse` / `equipped` / 三个回调      |

表里列的是最终 props；`equipped` / `equippedId` 在示例（五）加入，前面几篇的格子先只有 `selected`。`InventoryPanel` 是唯一被 `GameUI` 注册的组件；另外四个都是普通子组件，由它按需组合。这样拆分的好处是：每个文件的职责固定，读者可以按文件名找到对应代码，而不用在一个大文件里翻找。

表里的「三个回调」「`onSelect`」「`onClear`」是父级写给子组件的监听器名；子组件内部用 `emits: ['select']` 或 `emits: ['clear']` 声明，再 `emit('select', id)` 触发，父级仍写 `onSelect={...}`。所以照表里的 props 名写父级用法即可，子组件内部则按 `emits` 声明。

本篇只落地 `inventory-panel.tsx`。左侧与右侧先写成两个带背景的 `container` 占位，不 import 后四个文件——这样每一步都能单独编译，等示例（二）（三）再把占位换成真正的 `ItemGrid` 与 `ItemDetail`，替换时只改子树，不动坐标。

## 打开、状态与关闭归谁

面板由控制器打开，打开时创建实例；关闭时把实例交回同一个控制器：

```tsx
import { GameUI } from '@motajs/system';

// 构造只是把名字与组件绑成一个对象
export const InventoryUI = new GameUI('inventory-panel', InventoryPanel);

// 从游戏主 UI 栈打开，返回值就是这次打开的实例
const instance = props.state.mainUIController.open(InventoryUI, {});

// 关闭时把同一个实例交回去
props.state.mainUIController.close(instance);
```

面板内部拿到的 `props.instance` 就是打开时创建的那个实例，`props.controller` 是打开它的控制器。所以面板自己关闭自己时，写的是 `props.controller.close(props.instance)`，不需要记住是哪个控制器打开的。

**关闭归 `InventoryPanel`**。标题栏的关闭按钮调用这个方法；后面加进来的 `ActionBar` 只发出 `close` 事件，由面板决定是否关闭。子组件不直接拿 `controller` 去关面板，否则同一件事会出现两个入口，按键关闭和按钮关闭的行为也会分叉。

**状态归 `InventoryPanel`**。`items` 与 `selectedId` 由面板持有，网格只负责显示与上报点击，详情只接收派生结果。本篇先把关闭按钮接通，`items` 与 `selectedId` 从示例（二）开始填。

## 骨架代码

`inventory-panel.tsx` 先给外框、标题、关闭按钮与两个占位区：

```tsx
import { defineComponent } from 'vue';
import { GameUI, SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';
import { IGameUIPropsBase } from '@user/client-base';

// UI 的 Props 必须同时继承基础 Props 与默认 Props
interface InventoryPanelProps extends IGameUIPropsBase, DefaultProps {}

const inventoryPanelProps = {
    // 三个键少一个，组件里就拿不到对应的值
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<InventoryPanelProps>;

const InventoryPanel = defineComponent<InventoryPanelProps>(props => {
    // 关闭归面板：把当前实例交回打开它的控制器
    const close = () => {
        props.controller.close(props.instance);
    };

    return () => (
        <container loc={[0, 0, 720, 480]}>
            {/* 画布底色 */}
            <g-rect loc={[0, 0, 720, 480]} fill fillStyle="#0e141b" />

            {/* 面板主体 */}
            <g-rectr
                loc={[30, 30, 660, 420]}
                circle={[18]}
                fill
                fillStyle="#1d2b45"
                stroke
                strokeStyle="#2f6fed"
            />

            <text loc={[54, 52]} text="背包" fillStyle="#e8f0ff" />

            {/* 关闭按钮必须在骨架阶段就能用，否则后面每加一块内容都无法验证退出 */}
            <container loc={[626, 50, 56, 32]} onClick={close}>
                <g-rectr
                    loc={[0, 0, 56, 32]}
                    circle={[8]}
                    fill
                    fillStyle="#7a3d3d"
                />
                <text loc={[14, 8]} text="关闭" fillStyle="#ffe9e9" />
            </container>

            {/* 左侧网格占位：示例（二）换成 ItemGrid */}
            <container loc={[54, 100, 400, 280]}>
                <g-rect loc={[0, 0, 400, 280]} fill fillStyle="#101820" />
                <text loc={[16, 16]} text="道具网格占位" fillStyle="#8fb6ff" />
            </container>

            {/* 右侧详情占位：示例（三）换成 ItemDetail */}
            <container loc={[470, 100, 196, 280]}>
                <g-rect loc={[0, 0, 196, 280]} fill fillStyle="#101820" />
                <text loc={[16, 16]} text="详情占位" fillStyle="#8fb6ff" />
            </container>
        </container>
    );
}, inventoryPanelProps);

export const InventoryUI = new GameUI('inventory-panel', InventoryPanel);
```

这段代码只做三件事：画出 720×480 的面板、放好标题与关闭按钮、用两个占位容器标出后续网格与详情的位置。

在渲染树上，根 `container` 是这次 UI 的入口，面板主体、标题、关闭按钮与两个占位区都是它的直接子元素。关闭按钮自己又是一个小容器，内部只有底板与文字：点击命中按钮区域后，事件交给带 `onClick` 的容器，调用 `close`，再由控制器卸载实例。两个占位容器不是装饰，它们先把区域尺寸写进树里，后面换 `ItemGrid` 与 `ItemDetail` 时只需要替换子节点，坐标不用重算。

`props` 数组必须同时列出 `controller`、`instance`、`state`，少一个组件里就拿不到对应的值。`InventoryPanel` 被 `GameUI` 注册后，这三个值由 UI 栈在创建实例时注入，作者不需要手动传。

## 打开它

骨架写完后，从三个常见位置打开：

```tsx
// 场景 UI：由客户端核心的场景控制器打开
props.state.sceneController.open(InventoryUI, {});

// 在另一个 UI 内打开：沿用当前 UI 的控制器
props.controller.open(InventoryUI, {});

// 游戏内的背包通常从主 UI 栈打开
props.state.mainUIController.open(InventoryUI, {});
```

三者的区别只在「由哪个控制器管理这次打开的实例」：`mainUIController` 管主界面栈，`sceneController` 管场景层，`props.controller` 是当前 UI 的控制器。具体差别见[「UI 系统」](./ui-system.md)。本篇先把打开入口跑通；从示例（六）开始统一用主 UI 栈打开，并在那里说明注册与栈的关系。

## 运行效果

下面是骨架的 live。它只包含面板本身；关闭按钮在 live 里只显示一行提示——文档站没有真实的 UI 栈，无法真的关闭面板。

<ClientOnly>
  <RenderDemo :loader="skeletonLoader" :width="720" :height="480" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const skeletonLoader = () =>
    import('../../.vitepress/components/demos/ui/inventory-1-skeleton.tsx');
</script>

## 边界与注意

- 组件拆分在骨架阶段就定下来，后面只填内容。中途换结构会让读者无法把前几篇和后几篇对上。
- 不用真实素材。图标一律用 `g-rect` / `g-rectr` 加 `text` 画出来，读者不需要准备图片。
- 关闭按钮必须在骨架阶段就能用。否则后面每加一块内容，都无法验证「面板能不能正常退出」。
- 不要把网格、详情、按钮全塞进 `InventoryPanel`。根组件只负责布局与共享状态，具体区域交给子组件。
- Props 只能用 `IGameUIPropsBase` 配 `DefaultProps`，`props` 数组至少包含 `controller`、`instance`、`state`。
- 两个占位区按最终布局给足尺寸：左侧 `[54, 100, 400, 280]`、右侧 `[470, 100, 196, 280]`。示例（五）的操作条从 `y = 392` 开始，和左侧区域的下边界 380 之间留了 12 像素，不会压住网格。
