# 10-55 渲染指南迁移清单

## 指南范围

只收画屏幕 / 写 UI 的 27 篇自定义 UI 文档；数据端、存档与录像、插件系统、编辑器等与绘制屏幕关系不紧密的系统仍留在中级/高级教程，**不迁入本指南、不新增系统文档**。本节为后续映射与门禁的范围依据。

## 用户裁决（Task 0）

用户已确认修正后的计划（名称 / 范围更正）：指南名为「渲染指南」（不是「渲染端指南」），只收画屏幕 / 写 UI 的材料，无关系统留在中级 / 高级教程。逐项裁决如下，均按默认：

1. **路径**：`docs/render-guide/`（用户批准按默认）。
2. **顶部导航名**：`渲染指南`，追加在「中级教程」「高级教程」之后，链接 `/render-guide/`（用户批准按默认；用户特别确认名称为「渲染指南」）。
3. **两分区**：目录 `basics/`、`advanced/`，侧边栏显示名 `渲染基础`、`渲染进阶`（用户批准按默认；后经用户结构修正为两分区）。
4. **页面映射**：27 行映射按 <context> 全表执行，basics 10 / advanced 17；分区归属、侧边栏顺序与审阅状态均按默认（用户批准按默认；后经用户结构修正，`ui-system` / `ui-performance` 归入 advanced）。
5. **示例待审阅口径**：`inventory-example-1..6` 保持「待审阅」，本计划只迁移、补前置知识，不审阅、不改写正文；不把待审阅状态写进文档正文（D-97）（用户批准按默认）。
6. **基线计数与审阅谱系**：页面基线固定 27（25 只是 10-54 历史记录值，不采用）；19 篇继承 10-54 的已审阅状态（含改名继承，由用户确认）；`ui-basics`、`first-static-ui` 默认 `待审阅`；6 篇示例待审阅（用户批准按默认；用户确认新增两页仍为待审阅）。
7. **普通教程渲染端内容**：本计划只盘点，不改写正文；收敛改写另开计划（用户批准按默认）。
8. **demo 位置与收尾**：demo 保留在 `docs/.vitepress/components/demos/ui/`，不移动；本计划不 commit；修改方式为派发子代理执行（用户批准按默认）。
9. **POC 页处置**：`docs/poc/render-demo.md` 保留不动（用户批准按默认）。

用户未提出路径、导航名、分区归属、侧边栏顺序或审阅状态的修改要求。

## 基线

- BASE-HEAD：2a4b3220ed9ecc01b2f92eabd375185eb686a01a
- 页面基线：27
- 页面实测：27 篇（`basic-shapes.md`、`builtin-basic.md`、`builtin-layout.md`、`builtin-text.md`、`common-props.md`、`conditional-and-list-rendering.md`、`container-and-coordinates.md`、`custom-and-container-custom.md`、`custom-components.md`、`events.md`、`first-static-ui.md`、`hotkey-in-ui.md`、`image-and-texture.md`、`inventory-example-1-skeleton.md`、`inventory-example-2-grid.md`、`inventory-example-3-detail.md`、`inventory-example-4-scroll.md`、`inventory-example-5-state.md`、`inventory-example-6-animation-and-register.md`、`layer-transform-performance.md`、`reactivity.md`、`text.md`、`ui-basics.md`、`ui-performance.md`、`ui-system.md`、`ui-template.md`、`what-is-component.md`）
- 10-54 记录值：25 篇（19 已审阅 + 6 待审阅）/ 24 demo
- 新增页面审阅状态：ui-basics=待审阅；first-static-ui=待审阅
- 用户确认新增页面为已审阅：否
- POC 处置：保留不动
- 指南范围：仅画屏幕 / 写 UI（27 篇）；数据端 / 存档 / 插件 / 编辑器等系统文档不迁入、不新增
- demo 基线：文件 67；被正文引用 65；带 live（renderDemo.vue） 24
- demo 目录：docs/.vitepress/components/demos/ui/
- docs 快照哈希：363b822c90b84761eff38b4ca518837eae609d0a1c6d8f1b7d5f62f38cb6c853
- 配置快照哈希：212dc5960e3a9ff5d04b0f08e9616cf0dfae268856e92a8654022930ef6bcbbe
- 停止点：10-55 只做迁移 / 前置知识 / 结构门禁；不重写正文、不移动 demo、不审阅示例、不 commit

快照哈希口径：27 篇按相对路径排序，逐文件 SHA-256 后拼 `相对路径:hash`，以 LF 连接，再取 SHA-256。

## 页面映射

本表是链接迁移与侧边栏生成的唯一事实来源。

| 序  | 源路径                                                            | 目标路径                                                                 | 分区     | 侧边栏标题                 | 审阅状态 | demo 引用数 | 内部链接数 |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ | -------- | -------------------------- | -------- | ----------- | ---------- |
| 1   | docs/advanced/ii/ui/ui-template.md                                | docs/render-guide/basics/ui-template.md                                  | basics   | UI 通用模板（TSX）         | 已审阅   | 0           | 10         |
| 2   | docs/advanced/ii/ui/ui-basics.md                                  | docs/render-guide/basics/ui-basics.md                                    | basics   | UI 入门                    | 待审阅   | 1           | 8          |
| 3   | docs/advanced/ii/ui/first-static-ui.md                            | docs/render-guide/basics/first-static-ui.md                              | basics   | 第一个静态界面             | 待审阅   | 1           | 6          |
| 4   | docs/advanced/ii/ui/container-and-coordinates.md                  | docs/render-guide/basics/container-and-coordinates.md                    | basics   | 容器与坐标                 | 已审阅   | 2           | 2          |
| 5   | docs/advanced/ii/ui/basic-shapes.md                               | docs/render-guide/basics/basic-shapes.md                                 | basics   | 基础图形                   | 已审阅   | 11          | 2          |
| 6   | docs/advanced/ii/ui/text.md                                       | docs/render-guide/basics/text.md                                         | basics   | 文字                       | 已审阅   | 4           | 1          |
| 7   | docs/advanced/ii/ui/image-and-texture.md                          | docs/render-guide/basics/image-and-texture.md                            | basics   | 图片与纹理                 | 已审阅   | 2           | 0          |
| 8   | docs/advanced/ii/ui/custom-and-container-custom.md                | docs/render-guide/basics/custom-and-container-custom.md                  | basics   | 自绘元素与自定义容器       | 已审阅   | 2           | 1          |
| 9   | docs/advanced/ii/ui/common-props.md                               | docs/render-guide/basics/common-props.md                                 | basics   | 通用参数                   | 已审阅   | 5           | 0          |
| 10  | docs/advanced/ii/ui/layer-transform-performance.md                | docs/render-guide/basics/layer-transform-performance.md                  | basics   | 层级、变换与性能           | 已审阅   | 3           | 1          |
| 11  | docs/advanced/ii/ui/reactivity.md                                 | docs/render-guide/advanced/reactivity.md                                 | advanced | 响应式                     | 已审阅   | 4           | 2          |
| 12  | docs/advanced/ii/ui/events.md                                     | docs/render-guide/advanced/events.md                                     | advanced | 事件与交互                 | 已审阅   | 4           | 1          |
| 13  | docs/advanced/ii/ui/conditional-and-list-rendering.md             | docs/render-guide/advanced/conditional-and-list-rendering.md             | advanced | 条件渲染与循环渲染         | 已审阅   | 3           | 0          |
| 14  | docs/advanced/ii/ui/hotkey-in-ui.md                               | docs/render-guide/advanced/hotkey-in-ui.md                               | advanced | 按键与快捷键               | 已审阅   | 0           | 0          |
| 15  | docs/advanced/ii/ui/what-is-component.md                          | docs/render-guide/advanced/what-is-component.md                          | advanced | 什么是组件                 | 已审阅   | 1           | 0          |
| 16  | docs/advanced/ii/ui/builtin-basic.md                              | docs/render-guide/advanced/builtin-basic.md                              | advanced | 内置组件：基础             | 已审阅   | 7           | 0          |
| 17  | docs/advanced/ii/ui/builtin-layout.md                             | docs/render-guide/advanced/builtin-layout.md                             | advanced | 内置组件：布局             | 已审阅   | 4           | 0          |
| 18  | docs/advanced/ii/ui/builtin-text.md                               | docs/render-guide/advanced/builtin-text.md                               | advanced | 内置组件：文本             | 已审阅   | 2           | 0          |
| 19  | docs/advanced/ii/ui/custom-components.md                          | docs/render-guide/advanced/custom-components.md                          | advanced | 自定义组件                 | 已审阅   | 1           | 0          |
| 20  | docs/advanced/ii/ui/inventory-example-1-skeleton.md               | docs/render-guide/advanced/inventory-example-1-skeleton.md               | advanced | 示例（一）目标与骨架       | 待审阅   | 1           | 3          |
| 21  | docs/advanced/ii/ui/inventory-example-2-grid.md                   | docs/render-guide/advanced/inventory-example-2-grid.md                   | advanced | 示例（二）道具网格         | 待审阅   | 1           | 1          |
| 22  | docs/advanced/ii/ui/inventory-example-3-detail.md                 | docs/render-guide/advanced/inventory-example-3-detail.md                 | advanced | 示例（三）详情区           | 待审阅   | 1           | 0          |
| 23  | docs/advanced/ii/ui/inventory-example-4-scroll.md                 | docs/render-guide/advanced/inventory-example-4-scroll.md                 | advanced | 示例（四）滚动与列表       | 待审阅   | 1           | 0          |
| 24  | docs/advanced/ii/ui/inventory-example-5-state.md                  | docs/render-guide/advanced/inventory-example-5-state.md                  | advanced | 示例（五）交互与状态       | 待审阅   | 1           | 0          |
| 25  | docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | docs/render-guide/advanced/inventory-example-6-animation-and-register.md | advanced | 示例（六）动画、拆分与注册 | 待审阅   | 1           | 4          |
| 26  | docs/advanced/ii/ui/ui-system.md                                  | docs/render-guide/advanced/ui-system.md                                  | advanced | UI 系统                    | 已审阅   | 2           | 0          |
| 27  | docs/advanced/ii/ui/ui-performance.md                             | docs/render-guide/advanced/ui-performance.md                             | advanced | UI 性能                    | 已审阅   | 0           | 4          |

分区计数：basics 10 / advanced 17 / internals 0（有效分区 2）。demo 引用合计 65，内部链接合计 46，与基线实测一致。

## 页面谱系与审阅状态

10-54 的 25 篇清单来自旧页集，`5db2cef` 之后的页面集已改名或合并；旧稿从未入库，git 无法独立证明逐篇谱系，因此下面 19 篇的「已审阅」以用户在 Task 0 的确认（含改名继承）为准。

### 同名继承（11 篇）

- `ui-template.md` → 10-54 `ui-template.md`（同名）→ 已审阅
- `container-and-coordinates.md` → 10-54 `container-and-coordinates.md`（同名）→ 已审阅
- `basic-shapes.md` → 10-54 `basic-shapes.md`（同名）→ 已审阅
- `text.md` → 10-54 `text.md`（同名）→ 已审阅
- `image-and-texture.md` → 10-54 `image-and-texture.md`（同名）→ 已审阅
- `layer-transform-performance.md` → 10-54 `layer-transform-performance.md`（同名）→ 已审阅
- `reactivity.md` → 10-54 `reactivity.md`（同名）→ 已审阅
- `events.md` → 10-54 `events.md`（同名）→ 已审阅
- `hotkey-in-ui.md` → 10-54 `hotkey-in-ui.md`（同名）→ 已审阅
- `conditional-and-list-rendering.md` → 10-54 `conditional-and-list-rendering.md`（同名）→ 已审阅
- `ui-performance.md` → 10-54 `ui-performance.md`（同名；10-53 已按「日常优化习惯」重写）→ 已审阅

### 改名 / 合并继承（8 篇）

- `common-props.md` → 10-54 `props.md`（改名）→ 已审阅
- `what-is-component.md` → 10-54 `component-tsx.md`（改名）→ 已审阅
- `custom-components.md` → 10-54 `component-tsx.md` / `slots-and-attrs.md`（合并改名）→ 已审阅
- `builtin-basic.md` → 10-54 `builtin-text-and-input.md`（拆分继承）→ 已审阅
- `builtin-layout.md` → 10-54 `builtin-list-and-containers.md`（拆分改名）→ 已审阅
- `builtin-text.md` → 10-54 `builtin-text-and-input.md`（拆分继承）→ 已审阅
- `ui-system.md` → 10-54 `ui-controller-and-stack.md`（改名）→ 已审阅
- `custom-and-container-custom.md` → 10-54 `replace-builtin-ui.md`（改名）→ 已审阅

### 新增页（2 篇）

- `ui-basics.md` → 10-54 无对应（`5db2cef` 后新增）→ 待审阅
- `first-static-ui.md` → 10-54 无对应（`5db2cef` 后新增）→ 待审阅

### 示例（6 篇）

- `inventory-example-1-skeleton.md` → 待审阅
- `inventory-example-2-grid.md` → 待审阅
- `inventory-example-3-detail.md` → 待审阅
- `inventory-example-4-scroll.md` → 待审阅
- `inventory-example-5-state.md` → 待审阅
- `inventory-example-6-animation-and-register.md` → 待审阅

计数：已审阅 19 + 新增待审阅 2 + 示例待审阅 6 = 27。

## 链接迁移清单

### 内部 Markdown 链接

规划时实测 46 处，逐条如下；目标规则为同分区保持 `./x.md`、跨分区改为 `../<目标分区>/x.md`，链接文字与锚点不变。

| 源文件                                                            | 原链接                                                | 迁移后链接                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- |
| docs/advanced/ii/ui/basic-shapes.md                               | ./container-and-coordinates.md                        | ./container-and-coordinates.md                                |
| docs/advanced/ii/ui/basic-shapes.md                               | ./text.md                                             | ./text.md                                                     |
| docs/advanced/ii/ui/container-and-coordinates.md                  | ./first-static-ui.md                                  | ./first-static-ui.md                                          |
| docs/advanced/ii/ui/container-and-coordinates.md                  | ./basic-shapes.md                                     | ./basic-shapes.md                                             |
| docs/advanced/ii/ui/custom-and-container-custom.md                | ./reactivity.md                                       | ../advanced/reactivity.md                                     |
| docs/advanced/ii/ui/events.md                                     | ./basic-shapes.md                                     | ../basics/basic-shapes.md                                     |
| docs/advanced/ii/ui/first-static-ui.md                            | ./container-and-coordinates.md                        | ./container-and-coordinates.md                                |
| docs/advanced/ii/ui/first-static-ui.md                            | ./basic-shapes.md                                     | ./basic-shapes.md                                             |
| docs/advanced/ii/ui/first-static-ui.md                            | ./text.md                                             | ./text.md                                                     |
| docs/advanced/ii/ui/first-static-ui.md                            | ./image-and-texture.md                                | ./image-and-texture.md                                        |
| docs/advanced/ii/ui/first-static-ui.md                            | ./layer-transform-performance.md                      | ./layer-transform-performance.md                              |
| docs/advanced/ii/ui/first-static-ui.md                            | ./events.md                                           | ../advanced/events.md                                         |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md               | ./container-and-coordinates.md#渲染树根容器与子元素   | ../basics/container-and-coordinates.md#渲染树根容器与子元素   |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md               | ./layer-transform-performance.md#渲染树层级与绘制顺序 | ../basics/layer-transform-performance.md#渲染树层级与绘制顺序 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md               | ./ui-system.md                                        | ./ui-system.md                                                |
| docs/advanced/ii/ui/inventory-example-2-grid.md                   | ./custom-components.md#props                          | ./custom-components.md#props                                  |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | ./ui-template.md#gameui-是一个对象不是名字            | ../basics/ui-template.md#gameui-是一个对象不是名字            |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | ./ui-system.md#keep                                   | ./ui-system.md#keep                                           |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | ./layer-transform-performance.md                      | ../basics/layer-transform-performance.md                      |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | ./ui-system.md#隐藏与显示                             | ./ui-system.md#隐藏与显示                                     |
| docs/advanced/ii/ui/layer-transform-performance.md                | ./common-props.md#zindex                              | ./common-props.md#zindex                                      |
| docs/advanced/ii/ui/reactivity.md                                 | ./events.md                                           | ./events.md                                                   |
| docs/advanced/ii/ui/reactivity.md                                 | ./custom-components.md#props                          | ./custom-components.md#props                                  |
| docs/advanced/ii/ui/text.md                                       | ./builtin-text.md                                     | ../advanced/builtin-text.md                                   |
| docs/advanced/ii/ui/ui-basics.md                                  | ./ui-system.md                                        | ../advanced/ui-system.md                                      |
| docs/advanced/ii/ui/ui-basics.md                                  | ./conditional-and-list-rendering.md                   | ../advanced/conditional-and-list-rendering.md                 |
| docs/advanced/ii/ui/ui-basics.md                                  | ./container-and-coordinates.md                        | ./container-and-coordinates.md                                |
| docs/advanced/ii/ui/ui-basics.md                                  | ./basic-shapes.md                                     | ./basic-shapes.md                                             |
| docs/advanced/ii/ui/ui-basics.md                                  | ./text.md                                             | ./text.md                                                     |
| docs/advanced/ii/ui/ui-basics.md                                  | ./events.md                                           | ../advanced/events.md                                         |
| docs/advanced/ii/ui/ui-basics.md                                  | ./custom-components.md                                | ../advanced/custom-components.md                              |
| docs/advanced/ii/ui/ui-basics.md                                  | ./ui-system.md（第二处）                              | ../advanced/ui-system.md                                      |
| docs/advanced/ii/ui/ui-performance.md                             | ./builtin-layout.md                                   | ./builtin-layout.md                                           |
| docs/advanced/ii/ui/ui-performance.md                             | ./layer-transform-performance.md#缓存与脏更新         | ../basics/layer-transform-performance.md#缓存与脏更新         |
| docs/advanced/ii/ui/ui-performance.md                             | ./common-props.md                                     | ../basics/common-props.md                                     |
| docs/advanced/ii/ui/ui-performance.md                             | ./conditional-and-list-rendering.md                   | ./conditional-and-list-rendering.md                           |
| docs/advanced/ii/ui/ui-template.md                                | ./ui-basics.md                                        | ./ui-basics.md                                                |
| docs/advanced/ii/ui/ui-template.md                                | ./container-and-coordinates.md                        | ./container-and-coordinates.md                                |
| docs/advanced/ii/ui/ui-template.md                                | ./basic-shapes.md                                     | ./basic-shapes.md                                             |
| docs/advanced/ii/ui/ui-template.md                                | ./text.md                                             | ./text.md                                                     |
| docs/advanced/ii/ui/ui-template.md                                | ./image-and-texture.md                                | ./image-and-texture.md                                        |
| docs/advanced/ii/ui/ui-template.md                                | ./reactivity.md                                       | ../advanced/reactivity.md                                     |
| docs/advanced/ii/ui/ui-template.md                                | ./events.md                                           | ../advanced/events.md                                         |
| docs/advanced/ii/ui/ui-template.md                                | ./custom-components.md                                | ../advanced/custom-components.md                              |
| docs/advanced/ii/ui/ui-template.md                                | ./ui-system.md                                        | ../advanced/ui-system.md                                      |
| docs/advanced/ii/ui/ui-template.md                                | ./inventory-example-1-skeleton.md                     | ../advanced/inventory-example-1-skeleton.md                   |

合计 46 处，与实测一致；无跨出 `docs/advanced/ii/ui/` 的外部链接（27 篇内 `](../...)` 形式为 0）。

### demo 导入

27 篇中所有 `.vitepress/components` 导入均为 `../../../.vitepress/...`（相对 `docs/advanced/ii/ui/`），迁移后统一改为 `../../.vitepress/...`。逐篇条数（demo + RenderDemo）：

| 目标页                                                 | demo 导入 | renderDemo 导入 |
| ------------------------------------------------------ | --------- | --------------- |
| basics/ui-template.md                                  | 0         | 0               |
| basics/ui-basics.md                                    | 1         | 1               |
| basics/first-static-ui.md                              | 1         | 1               |
| basics/container-and-coordinates.md                    | 2         | 1               |
| basics/basic-shapes.md                                 | 11        | 1               |
| basics/text.md                                         | 4         | 1               |
| basics/image-and-texture.md                            | 2         | 1               |
| basics/custom-and-container-custom.md                  | 2         | 1               |
| basics/common-props.md                                 | 5         | 1               |
| basics/layer-transform-performance.md                  | 3         | 1               |
| advanced/reactivity.md                                 | 4         | 1               |
| advanced/events.md                                     | 4         | 1               |
| advanced/conditional-and-list-rendering.md             | 3         | 1               |
| advanced/hotkey-in-ui.md                               | 0         | 0               |
| advanced/what-is-component.md                          | 1         | 1               |
| advanced/builtin-basic.md                              | 7         | 1               |
| advanced/builtin-layout.md                             | 4         | 1               |
| advanced/builtin-text.md                               | 2         | 1               |
| advanced/custom-components.md                          | 1         | 1               |
| advanced/inventory-example-1-skeleton.md               | 1         | 1               |
| advanced/inventory-example-2-grid.md                   | 1         | 1               |
| advanced/inventory-example-3-detail.md                 | 1         | 1               |
| advanced/inventory-example-4-scroll.md                 | 1         | 1               |
| advanced/inventory-example-5-state.md                  | 1         | 1               |
| advanced/inventory-example-6-animation-and-register.md | 1         | 1               |
| advanced/ui-system.md                                  | 2         | 1               |
| advanced/ui-performance.md                             | 0         | 0               |

合计 demo 65 + renderDemo 24 = 89 处。demo 文件本身不移动、不改名、不修改。

### 导航 / 导览

- `docs/.vitepress/config.ts`：移除 `sidebar['/advanced/']` 中整个「自定义 UI 与渲染」分组（27 条 `/advanced/ii/ui/` 链接）；`nav` 追加 `{ text: '渲染指南', link: '/render-guide/' }`；新增 `sidebar['/render-guide/']`（渲染基础 10 条 / 渲染进阶 17 条）。高级 II 数据端 9 条正文链接 + 导览 1 条保留，高级 III 分组与 `/intermediate/` 逐字保留。
- `docs/advanced/ii/index.md`：
    - L15「这一层的主体是数据端；另有自定义 UI 与渲染子分组（见侧边栏），面向要在画布上写界面的作者。」→ 指向 `../../render-guide/`。
    - L52「本层一共十篇……另有「自定义 UI 与渲染」子分组 27 篇（见侧边栏）。」→ 改为指向渲染指南。
    - L54 整段（原含 3 处 `./ui/...` 链接）→ 改为「渲染端的阅读入口与三级路径见[渲染指南](../../render-guide/)；本层不再重复。」
    - L81「界面绘制与 UI 系统见子分组「自定义 UI 与渲染」。」→ 指向 `../../render-guide/`。
    - L82「高级 II 的《UI 性能》……」→ 改为链接 `../../render-guide/advanced/ui-performance`。
- `docs/advanced/index.md`：
    - L38「高级 II 已收录「自定义 UI 与渲染」子分组……」→ 指向 `../render-guide/`（保留编辑器占位句）。
    - L39「高级 II 的《UI 性能》……」→ 改为链接 `../render-guide/advanced/ui-performance`。
    - 「三层结构」表不新增「自定义 UI 与渲染」短语。

## 普通教程渲染端内容盘点（只盘点、不改写）

只记录现状，不提出改写方案、不改文件；这些系统文档不迁入本指南，也不新增到 `docs/render-guide/`。

| 篇目                                      | 涉及内容                                                                           | 是否应在后续收敛为指引链接                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| docs/intermediate/data-vs-render.md       | 全文讲「数据端算 / 渲染端画」分工、渲染端只负责画与转达操作（L1–L20 起）           | 否。这是双端分工的总前提，不属于绘制方法。                           |
| docs/intermediate/src-tour.md             | `## src/client：渲染端`（约 L29–L40）列出渲染端入口、初始化、插件目录              | 部分。可补指向渲染指南的入口句，但目录本身属于工程导览。             |
| docs/intermediate/data-state-overview.md  | `emitTip` 一行「通知渲染端提示」（L78）                                            | 否。只是一条接口归属说明。                                           |
| docs/intermediate/hooks.md                | `onTip` 一行「通知渲染端进行一次提示」（L69）                                      | 否。同上。                                                           |
| docs/advanced/i/index.md                  | L15 与 L75「渲染端尚未完工，当前只写数据端内容，渲染端部分只用占位标记指出归属」   | 是。渲染指南落地后应把这段占位改成指向渲染指南的入口（本计划不改）。 |
| docs/advanced/i/face-handler.md           | L7「本篇只讲数据端……由渲染端读取后完成」；`<!-- TODO(renderer): 朝向图块绘制 -->`  | 部分。渲染端消费侧可指向指南，但本篇是数据端接口文档。               |
| docs/advanced/i/mover.md                  | L5「画面上的位移、动画与速度表现由渲染端读取这些状态后完成」；L101 起 tp/jump 语义 | 否。位移状态属于数据端。                                             |
| docs/advanced/i/plugin-system.md          | 渲染端插件接口、目录与注册（L5、L26–L86）                                          | 否。插件系统不是绘制方法。                                           |
| docs/advanced/i/replay-consistency.md     | L57 / L117 强调标记只在数据端、渲染端不参与回放                                    | 否。录像一致性属于数据端约束。                                       |
| docs/advanced/i/saveable-content.md       | L24「临时动画、提示、界面状态」不存                                                | 否。存档取舍。                                                       |
| docs/advanced/ii/index.md                 | L15 / L52 / L54 / L81 / L82 旧「自定义 UI 与渲染」子分组表述与 3 处 `./ui/` 链接   | 是。本计划在 Task 2 改写为渲染指南入口。                             |
| docs/advanced/ii/adding-hero-attribute.md | L15「显示 / 编辑器与渲染端」、L392「渲染端 · 状态栏」占位                          | 否。属性接入的占位项。                                               |
| docs/advanced/ii/custom-replay-command.md | L133「渲染端的播放表现按渲染端教程处理」与 `<!-- TODO(renderer): ... -->`          | 部分。可把「渲染端教程」改为渲染指南链接，但属正文改写，本计划不改。 |
| docs/advanced/ii/pathfinding.md           | L319「渲染端如何表现寻路移动不在本篇范围内」+ TODO                                 | 部分。同上。                                                         |
| docs/advanced/iii/index.md                | L92「渲染端的结构、动画与输入处理；这里只讲数据端」                                | 是。可在渲染指南落地后补入口句（本计划不改）。                       |
| docs/advanced/iii/core-state.md           | L158 表格「纯展示、输入或动画 → 渲染端，不在数据端四层」                           | 否。分层原则说明。                                                   |
| docs/advanced/iii/loading-system.md       | L273–L283 加载进度由界面读取、渲染端可复用加载器                                   | 否。加载系统文档。                                                   |
| docs/advanced/ii/ui/\*（27 篇）           | 全部画屏幕 / 写 UI 内容                                                            | 本计划迁入渲染指南，不在普通教程保留副本。                           |

## 待确认项

无。Task 0 的 9 项裁决、路径、导航名、两分区、27 篇基线、审阅谱系、示例口径与 POC 处置均已确认，可进入 Task 2。

## 前置知识依据

| 目标页                                                                   | 实际写入的前置                                                                                                                                    | 依据（阅读顺序 / 正文引用 / 交叉链接）                                                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| docs/render-guide/basics/ui-template.md                                  | 无                                                                                                                                                | 本页是模板入口，正文只要求基础 TS/JS，无更早的 UI 页可前置                                                               |
| docs/render-guide/basics/ui-basics.md                                    | 无                                                                                                                                                | 本页是起步第一篇，正文自带打开方式与 TSX 基础，无更早的 UI 页可前置                                                      |
| docs/render-guide/basics/first-static-ui.md                              | docs/render-guide/basics/ui-basics.md                                                                                                             | 阅读顺序：原 `docs/advanced/ii/index.md` 起步段规定「先看 UI 入门，再看第一个静态界面」                                  |
| docs/render-guide/basics/container-and-coordinates.md                    | docs/render-guide/basics/first-static-ui.md                                                                                                       | 交叉链接：正文开头「上一篇《第一个静态界面》」                                                                           |
| docs/render-guide/basics/basic-shapes.md                                 | docs/render-guide/basics/container-and-coordinates.md                                                                                             | 交叉链接：正文开头「上一篇《容器与坐标》」                                                                               |
| docs/render-guide/basics/text.md                                         | docs/render-guide/basics/container-and-coordinates.md、docs/render-guide/basics/basic-shapes.md                                                   | 阅读顺序：容器与坐标 → 基础图形 → 文字（基础图形篇末「下一篇《文字》」衔接）；正文以图形的填充/描边规则作对照            |
| docs/render-guide/basics/image-and-texture.md                            | docs/render-guide/basics/container-and-coordinates.md                                                                                             | 阅读顺序：元素与布局组内位于容器与坐标之后；正文用 `loc` 与容器坐标定位                                                  |
| docs/render-guide/basics/custom-and-container-custom.md                  | docs/render-guide/basics/container-and-coordinates.md、docs/render-guide/basics/basic-shapes.md                                                   | 正文引用：用 `loc`、`container`、`g-rect` 说明自绘尺寸与子元素；正文直接链到《响应式》解释 `bindings`                    |
| docs/render-guide/basics/common-props.md                                 | docs/render-guide/basics/container-and-coordinates.md、docs/render-guide/basics/basic-shapes.md                                                   | 正文引用：以 `loc`、`container`、`g-rect`、`hidden` 为例说明通用属性                                                     |
| docs/render-guide/basics/layer-transform-performance.md                  | docs/render-guide/basics/container-and-coordinates.md、docs/render-guide/basics/common-props.md                                                   | 交叉链接：正文链到 `./common-props.md#zindex`；正文以渲染树父子坐标为变换与缓存的前提                                    |
| docs/render-guide/advanced/reactivity.md                                 | docs/render-guide/basics/ui-basics.md、docs/render-guide/basics/first-static-ui.md                                                                | 阅读顺序：交互与数据位于起步之后；正文使用起步页的模板与 `container` 结构                                                |
| docs/render-guide/advanced/events.md                                     | docs/render-guide/basics/container-and-coordinates.md、docs/render-guide/advanced/reactivity.md                                                   | 正文引用：用 `container`、`g-rect`、`loc` 搭按钮，并用 `ref` 收集交互日志；响应式篇明示「后面事件与交互会专门讲」        |
| docs/render-guide/advanced/conditional-and-list-rendering.md             | docs/render-guide/advanced/reactivity.md、docs/render-guide/advanced/events.md                                                                    | 正文引用：条件与循环都靠 `ref` 状态与 `onClick` 切换                                                                     |
| docs/render-guide/advanced/hotkey-in-ui.md                               | docs/render-guide/advanced/reactivity.md、docs/render-guide/advanced/events.md                                                                    | 正文引用：以「按键与元素事件」对照元素事件，并用共享 `ref` 与 `onClick` 协同                                             |
| docs/render-guide/advanced/what-is-component.md                          | docs/render-guide/basics/ui-basics.md                                                                                                             | 正文引用：本页讲组件与 props；UI 入门已讲组件作为标签的使用方式                                                          |
| docs/render-guide/advanced/builtin-basic.md                              | docs/render-guide/advanced/what-is-component.md                                                                                                   | 正文引用：内置组件按组件与 props 写法使用（如 `v-model:value`）                                                          |
| docs/render-guide/advanced/builtin-layout.md                             | docs/render-guide/advanced/what-is-component.md、docs/render-guide/advanced/builtin-basic.md                                                      | 正文引用：以组件与 `ref` / `v-model` 使用区域组件；阅读顺序：组件化组内基础先于布局                                      |
| docs/render-guide/advanced/builtin-text.md                               | docs/render-guide/advanced/what-is-component.md、docs/render-guide/advanced/builtin-basic.md                                                      | 正文引用：以组件与 props 使用文本组件；阅读顺序：组件化组内基础先于文本                                                  |
| docs/render-guide/advanced/custom-components.md                          | docs/render-guide/advanced/what-is-component.md、docs/render-guide/advanced/builtin-basic.md                                                      | 正文引用：开头「前面的页面已经能用容器、文字、图形与内置组件拼出整块 UI」，并重复 props 三步声明                         |
| docs/render-guide/advanced/inventory-example-1-skeleton.md               | docs/render-guide/basics/first-static-ui.md、docs/render-guide/basics/container-and-coordinates.md                                                | 阅读顺序：示例是起步与零件篇之后的一批；正文链到容器与层级页说明骨架坐标与层级                                           |
| docs/render-guide/advanced/inventory-example-2-grid.md                   | docs/render-guide/advanced/inventory-example-1-skeleton.md、docs/render-guide/basics/basic-shapes.md                                              | 交叉链接：正文「上一篇的左侧只有一块占位」；正文用 `g-rect` 与 `loc` 排网格                                              |
| docs/render-guide/advanced/inventory-example-3-detail.md                 | docs/render-guide/advanced/inventory-example-2-grid.md、docs/render-guide/basics/text.md、docs/render-guide/basics/common-props.md                | 交叉链接：正文链到 `../basics/common-props.md` 并用 `hidden`；阅读顺序：承接上一篇网格                                   |
| docs/render-guide/advanced/inventory-example-4-scroll.md                 | docs/render-guide/advanced/inventory-example-3-detail.md、docs/render-guide/advanced/builtin-layout.md                                            | 正文引用：把示例（二）的普通网格换成 `Scroll`，`Scroll` 由内置组件：布局讲解                                             |
| docs/render-guide/advanced/inventory-example-5-state.md                  | docs/render-guide/advanced/inventory-example-4-scroll.md、docs/render-guide/advanced/reactivity.md、docs/render-guide/advanced/events.md          | 阅读顺序：承接前五步；正文用 `ref`、`emit` 与 `onClick` 接交互与状态                                                     |
| docs/render-guide/advanced/inventory-example-6-animation-and-register.md | docs/render-guide/advanced/inventory-example-5-state.md、docs/render-guide/advanced/custom-components.md、docs/render-guide/advanced/ui-system.md | 交叉链接：正文链到 `./ui-system.md#keep` 与 `../basics/ui-template.md`；正文讲组件拆分与 `GameUI` 注册                   |
| docs/render-guide/advanced/ui-system.md                                  | docs/render-guide/advanced/events.md                                                                                                              | 阅读顺序：旧侧边栏交互与数据 → UI 系统；正文以组件状态与按键作用域为操作对象；用户结构修正后不再前置 `custom-components` |
| docs/render-guide/advanced/ui-performance.md                             | docs/render-guide/basics/layer-transform-performance.md、docs/render-guide/advanced/ui-system.md                                                  | 交叉链接：正文链到 `./layer-transform-performance.md#缓存与脏更新` 等四页；阅读顺序：旧侧边栏性能在 UI 系统之后          |

未调整任何拟写前置：27 行均能在 10-55-PLAN 拟写表与上述依据之间对应，无需删除或改写条目。
