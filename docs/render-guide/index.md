# 渲染指南

本指南只讲画屏幕 / 写 UI：怎样用 TSX 画出界面、摆好位置、处理交互、拆成组件，以及 UI 系统与性能的取舍。数据端、存档与录像、插件系统、编辑器等与绘制屏幕关系不紧密的系统不在这里讲，仍见中级 / 高级教程；普通教程只保留主要的渲染逻辑，具体写法集中到本指南。

本指南只收现有 32 篇自定义 UI 文档，内容分为渲染基础、渲染进阶与渲染底层三层；不新增系统文档，也不增设系统页面。

## 三级结构

| 分区     | 定位                                           | 页面数 |
| -------- | ---------------------------------------------- | ------ |
| 渲染基础 | 模板、元素、坐标、图形、文字与元素属性         | 10     |
| 渲染进阶 | 响应式、事件、动画、组件化、UI 系统/性能与示例 | 18     |
| 渲染底层 | 动画曲线、动画激励、执行器与渐变的内部实现     | 4      |

分层是深度标签，不是领域分类：同一层里可能既有元素，也有组件或示例；读到哪一层取决于你要解决的问题，不必按层读完全部页面。

## 适合谁

- **完全没写过 UI**：从 [UI 通用模板（TSX）](./basics/ui-template.md) 起步，先拿模板跑起来，再用 [UI 入门](./basics/ui-basics.md) 认识标签、组件与渲染树。
- **写过基础界面，想加交互与组件**：从[响应式](./advanced/reactivity.md)接手，把状态、事件与条件渲染接进已有界面。
- **想了解 UI 系统与性能**：从 [UI 系统](./advanced/ui-system.md)读起，再看 [UI 性能](./advanced/ui-performance.md)的日常优化习惯。
- **想让界面元素平滑变化**：从[动画](./advanced/animation.md)入手，用 `transitioned`、`transitionedColor` 与 `cycledTransition` 做数值、颜色和循环渐变。
- **想弄清动画曲线与底层怎么推进**：先读[动画曲线](./internals/animation-curves.md)，再看[动画激励](./internals/animation-excitation.md)、[动画执行器](./internals/animation-runner.md)与[渐变执行器](./internals/animation-transition.md)。

## 阅读路径

- **从基础顺读**：[UI 通用模板（TSX）](./basics/ui-template.md) → [UI 入门](./basics/ui-basics.md) → [第一个静态界面](./basics/first-static-ui.md) → [容器与坐标](./basics/container-and-coordinates.md) → [基础图形](./basics/basic-shapes.md) → [文字](./basics/text.md) → [图片与纹理](./basics/image-and-texture.md) → [通用参数](./basics/common-props.md) → [层级、变换与性能](./basics/layer-transform-performance.md)。适合第一次写界面，先把静态部分画稳。
- **从静态到交互**：[响应式](./advanced/reactivity.md) → [事件与交互](./advanced/events.md) → [条件渲染与循环渲染](./advanced/conditional-and-list-rendering.md) → [按键与快捷键](./advanced/hotkey-in-ui.md) → [什么是组件](./advanced/what-is-component.md) → [自定义组件](./advanced/custom-components.md)。适合界面已经画出来、要接数据和操作的时候。
- **做一个完整面板**：[示例（一）目标与骨架](./advanced/inventory-example-1-skeleton.md) → [示例（二）道具网格](./advanced/inventory-example-2-grid.md) → [示例（三）详情区](./advanced/inventory-example-3-detail.md) → [示例（四）滚动与列表](./advanced/inventory-example-4-scroll.md) → [示例（五）交互与状态](./advanced/inventory-example-5-state.md) → [示例（六）动画、拆分与注册](./advanced/inventory-example-6-animation-and-register.md)。适合把零件装成背包 / 装备面板。
- **改内置 UI 或做性能取舍**：[什么是组件](./advanced/what-is-component.md) → [内置组件：基础](./advanced/builtin-basic.md) → [内置组件：布局](./advanced/builtin-layout.md) → [内置组件：文本](./advanced/builtin-text.md) → [自定义组件](./advanced/custom-components.md) → [UI 系统](./advanced/ui-system.md) → [UI 性能](./advanced/ui-performance.md)。适合替换现成控件或处理缓存与列表开销。
- **让数值与颜色动起来**：[响应式](./advanced/reactivity.md) → [动画](./advanced/animation.md) → 需要更深时读[动画曲线](./internals/animation-curves.md) → [动画激励](./internals/animation-excitation.md) → [动画执行器](./internals/animation-runner.md) / [渐变执行器](./internals/animation-transition.md)。适合给界面加过渡、循环闪烁或颜色变化。

五条路径都建议先读 [UI 通用模板（TSX）](./basics/ui-template.md)；模板是后面所有页面的起点。

## 页面目录

### 渲染基础

| 篇目                                                            | 一句话说明                                                  | 前置                                                                                      |
| --------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [UI 通用模板（TSX）](./basics/ui-template.md)                   | 写 UI 时从这段模板开始：复制、改名、在 `container` 里写内容 | 无                                                                                        |
| [UI 入门](./basics/ui-basics.md)                                | 怎样打开 UI、TSX 的标签与组件怎么写、渲染树是什么样         | 无                                                                                        |
| [第一个静态界面](./basics/first-static-ui.md)                   | 从头拼一个静态界面：深色底、标题、图标、图形、分隔线与层级  | [UI 入门](./basics/ui-basics.md)                                                          |
| [容器与坐标](./basics/container-and-coordinates.md)             | 坐标从哪里算起、`loc` 与锚点怎么配合、嵌套后子元素怎么算    | [第一个静态界面](./basics/first-static-ui.md)                                             |
| [基础图形](./basics/basic-shapes.md)                            | 八种图形元素的几何参数，以及共用的填充、描边与颜色规则      | [容器与坐标](./basics/container-and-coordinates.md)                                       |
| [文字](./basics/text.md)                                        | `Font` 与文字元素：单行绘制、尺寸测量与锚点对齐             | [容器与坐标](./basics/container-and-coordinates.md)、[基础图形](./basics/basic-shapes.md) |
| [图片与纹理](./basics/image-and-texture.md)                     | 从贴图管理器按别名或索引取纹理，按 `loc` 显示并处理比例     | [容器与坐标](./basics/container-and-coordinates.md)                                       |
| [自绘元素与自定义容器](./basics/custom-and-container-custom.md) | 用 Canvas 2D 自绘内容，或接管子元素的绘制与事件传递         | [容器与坐标](./basics/container-and-coordinates.md)、[基础图形](./basics/basic-shapes.md) |
| [通用参数](./basics/common-props.md)                            | 大多数元素都能写的一组属性，以及它们在什么条件下有意义      | [容器与坐标](./basics/container-and-coordinates.md)、[基础图形](./basics/basic-shapes.md) |
| [层级、变换与性能](./basics/layer-transform-performance.md)     | 渲染树的层级与绘制顺序、缩放旋转，以及缓存的取舍            | [容器与坐标](./basics/container-and-coordinates.md)、[通用参数](./basics/common-props.md) |

### 渲染进阶

| 篇目                                                                                   | 一句话说明                                                                                       | 前置                                                                                                                                               |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| [响应式](./advanced/reactivity.md)                                                     | 数据变化如何自动推到画布元素，以及渲染函数读到什么才算依赖                                       | [UI 入门](./basics/ui-basics.md)、[第一个静态界面](./basics/first-static-ui.md)                                                                    |
| [事件与交互](./advanced/events.md)                                                     | 点击、按下、抬起、移动、悬停与滚轮的捕获与冒泡                                                   | [容器与坐标](./basics/container-and-coordinates.md)、[响应式](./advanced/reactivity.md)                                                            |
| [条件渲染与循环渲染](./advanced/conditional-and-list-rendering.md)                     | 用 `hidden` 或三元做条件、用 `.map()` 做循环                                                     | [响应式](./advanced/reactivity.md)、[事件与交互](./advanced/events.md)                                                                             |
| [按键与快捷键](./advanced/hotkey-in-ui.md)                                             | 按键指令、分组、作用域，以及组件里怎么接                                                         | [响应式](./advanced/reactivity.md)、[事件与交互](./advanced/events.md)                                                                             |
| [什么是组件](./advanced/what-is-component.md)                                          | 组件最基本的形态、props 的传法，以及组件与 `GameUI` 的关系                                       | [UI 入门](./basics/ui-basics.md)                                                                                                                   |
| [内置组件：基础](./advanced/builtin-basic.md)                                          | `Input`、`Icons`、`Arrow`、`Selection`、`Progress`、`Background` 与 `Slider`                     | [什么是组件](./advanced/what-is-component.md)                                                                                                      |
| [内置组件：布局](./advanced/builtin-layout.md)                                         | `Scroll`、`Page`、`List` 与 `ListPage` 的区域与列表用法                                          | [什么是组件](./advanced/what-is-component.md)、[内置组件：基础](./advanced/builtin-basic.md)                                                       |
| [内置组件：文本](./advanced/builtin-text.md)                                           | `TextContent` 的折行与打字机、`ScrollText` 的自动滚动                                            | [什么是组件](./advanced/what-is-component.md)、[内置组件：基础](./advanced/builtin-basic.md)                                                       |
| [自定义组件](./advanced/custom-components.md)                                          | 怎么接收参数、发事件、留出内容位置与透传属性                                                     | [什么是组件](./advanced/what-is-component.md)、[内置组件：基础](./advanced/builtin-basic.md)                                                       |
| [动画](./advanced/animation.md)                                                        | 用曲线驱动 `transitioned`、`transitionedColor` 与 `cycledTransition`，让数值、颜色平滑变化或循环 | [响应式](./advanced/reactivity.md)、[UI 入门](./basics/ui-basics.md)                                                                               |
| [UI 系统](./advanced/ui-system.md)                                                     | 控制器、实例与栈：打开关闭、隐藏显示与显示策略                                                   | [事件与交互](./advanced/events.md)                                                                                                                 |
| [UI 性能](./advanced/ui-performance.md)                                                | 一组日常习惯，用来减少不必要的绘制与内存占用                                                     | [层级、变换与性能](./basics/layer-transform-performance.md)、[UI 系统](./advanced/ui-system.md)                                                    |
| [示例（一）目标与骨架](./advanced/inventory-example-1-skeleton.md)                     | 定下背包 / 装备面板的目标、组件拆分与骨架                                                        | [第一个静态界面](./basics/first-static-ui.md)、[容器与坐标](./basics/container-and-coordinates.md)                                                 |
| [示例（二）道具网格](./advanced/inventory-example-2-grid.md)                           | 把道具数据、`ItemCell` 与 `ItemGrid` 填进左侧，让网格能显示与选中                                | [示例（一）目标与骨架](./advanced/inventory-example-1-skeleton.md)、[基础图形](./basics/basic-shapes.md)                                           |
| [示例（三）详情区](./advanced/inventory-example-3-detail.md)                           | 用 `ItemDetail` 填右侧：名称、数量、描述与空选中提示                                             | [示例（二）道具网格](./advanced/inventory-example-2-grid.md)、[文字](./basics/text.md)、[通用参数](./basics/common-props.md)                       |
| [示例（四）滚动与列表](./advanced/inventory-example-4-scroll.md)                       | 把普通网格换成 `Scroll`，并说明渲染树、事件与数据流的变化                                        | [示例（三）详情区](./advanced/inventory-example-3-detail.md)、[内置组件：布局](./advanced/builtin-layout.md)                                       |
| [示例（五）交互与状态](./advanced/inventory-example-5-state.md)                        | 加 `ActionBar`：装备、使用、关闭，并把状态收口到面板                                             | [示例（四）滚动与列表](./advanced/inventory-example-4-scroll.md)、[响应式](./advanced/reactivity.md)、[事件与交互](./advanced/events.md)           |
| [示例（六）动画、拆分与注册](./advanced/inventory-example-6-animation-and-register.md) | 让选中态与提示动起来，把代码落回文件并注册成 `GameUI`                                            | [示例（五）交互与状态](./advanced/inventory-example-5-state.md)、[自定义组件](./advanced/custom-components.md)、[UI 系统](./advanced/ui-system.md) |

### 渲染底层

| 篇目                                              | 一句话说明                                                | 前置                                                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [动画曲线](./internals/animation-curves.md)       | `ExcitationCurve`、`CurveMode`、内置曲线与曲线计算函数    | [动画](./advanced/animation.md)、[响应式](./advanced/reactivity.md)                                                  |
| [动画激励](./internals/animation-excitation.md)   | 激励源怎样驱动受激励对象，以及变速器与分频器如何接入      | [动画](./advanced/animation.md)、[响应式](./advanced/reactivity.md)                                                  |
| [动画执行器](./internals/animation-runner.md)     | `Animater` 把多个对象的多个步骤组织成计划组并按时执行     | [动画激励](./internals/animation-excitation.md)、[动画](./advanced/animation.md)、[响应式](./advanced/reactivity.md) |
| [渐变执行器](./internals/animation-transition.md) | `Transition` 让单个数值平滑靠近目标值，处理曲线与结尾参考 | [动画激励](./internals/animation-excitation.md)、[动画](./advanced/animation.md)、[响应式](./advanced/reactivity.md) |

## 边界与注意

- 本指南只讲绘制屏幕与编写 UI；数据端、存档与录像、插件系统、编辑器等内容见中级 / 高级教程，这里不重复。
- 元素坐标相对父容器，不是屏幕绝对坐标；需要跨元素比较位置时，用事件里的画布坐标。
- 示例里的预览是文档站内固定尺寸的演示，与真实画布的尺寸、缩放和素材都不同；实际效果以接入后的画布为准。
- 文字元素只画一行，不自动换行；长文本用内置的文本组件。
- 缓存的默认值与开关只是当前实现的取舍，超出容器的绘制不要依赖缓存行为。
