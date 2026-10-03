# 渲染端结构性重构影响范围清点（只读）

**日期:** 2026-09-24
**范围:** 被查对象 = 移植集合 39 文件（D-52）与其全部 importer（`packages-user/client-modules` 内 `render/{ui,fx,weather,index.tsx,renderer.ts,scene.ts,use.ts,action.ts,utils}` 与 `client.ts` / `types.ts` / `fallback`，以及其它 monorepo 包 `entry-client` / `entry-data` / `packages/legacy-ui` 经 `@user/client-modules` 公共面的间接依赖）；`packages/` 与 `src/` 命中仅报告、不修改（D-33 沿用）
**性质:** 只读清点（D-51 / D-57 第一步），未修改任何生产代码、未引入任何命名变更
**移植集合:** D-52 的 `render/components` + `render/elements` + `render/map` 三文件夹 + `render/utils/layout.ts`（当日实测 39 文件）
**目标布局:** D-53 的 `client-base/src/{components,elements,map}/` 与 `client-base/src/layout/`（**不新建 `client-base/src/render/` 目录**）
**基准:** 当日 HEAD `47e71b5`（分支 `refine/data-client`）工作树 + `dev.md` 单向依赖 / 双端分离规则
**下一步:** 第二步（移植实施）未规划，待用户审阅本文件后另行规划（D-57）

## 背景

本文件是 Phase 4 第十个增量（用户裁定 2026-09-23 · D-51..D-57 **第一步**）的交付物：对「`packages-user/client-modules/src/render/` 下的通用渲染内容下沉到 `packages-user/client-base/src/`」这一结构性重构的**只读影响清点**。

- **D-51**：目标 = 把 `packages-user/client-modules/src/render/` 下的**通用内容**迁移到 `packages-user/client-base/src/`（渲染**系统层**）下，以纠正分层——通用渲染资产应属 `client-base`，`client-modules` 只保留实现层 / 交互层内容。
- **D-52**：**移植集合（明确）** = `render/components`、`render/elements`、`render/map` 三个文件夹；外加 `render/utils/layout.ts`。当日实测共 **39** 文件。
- **D-53**：**目标布局**：**不新建 `render` 目录**，三个文件夹直接放到 `client-base/src/` 下（`client-base/src/{components,elements,map}/`）；`layout.ts` **单独开 `layout/` 文件夹**存放（`client-base/src/layout/`）。
- **D-54**：**不移植** `render/utils/` 的其余内容（`index.ts` / `saves.ts` / `use.ts`）。`ui` / `fx` / `weather` 三个文件夹与 `render` 顶层文件（`action.ts` / `index.tsx` / `renderer.ts` / `scene.ts` / `use.ts`）**均不在本次移植集合**。
- **D-55**：**不考虑任何 Legacy 内容**——legacy 相关报错一律不管、不修、不登记为待办；AI 只负责**移植范围内**的报错清零，范围外（含 legacy）一律只报告。
- **D-56**：用户会**同步进行其他修改**：AI 不得触碰、不得提交用户的并发改动。
- **D-57（第一步交付物）**：第一步为**只读影响清点**，产出影响台账文档，至少覆盖：被移文件清单（`components` / `elements` / `map` / `layout.ts`）、三者内部交叉引用、**外部导入点**（`client-modules` 内 `ui` / `fx` / `weather` / `render` 顶层文件 / `action` / `fallback` 等，以及其它 monorepo 包）、barrel 导出现状、`package.json` 依赖现状、**分层 / 循环依赖风险**（`client-base` 不得反向依赖 `client-modules`）、legacy 命中（只报告）、未确定项。生产代码零改动；第二步待用户审阅后另行规划。

**本步性质（原样声明）：** 本文件**只清点、不修改、不规划第二步、零命名变更**。不含移植方案、不含 import 重写方案、不含任何代码改动建议、不产出任何新 `*-PLAN.md`；`client-base/src/{components,elements,map,layout}` 下的**文件名与 barrel 名一律进 F 类，须先向用户反馈并获同意后才可使用**（AGENTS.md）。

## 方法

**枚举面（两侧）：**

- **（a）被移面**：移植集合 39 文件（D-52）——`render/components/` 13、`render/elements/` 5、`render/map/` 20、`render/utils/layout.ts` 1。
- **（b）命中面**：移出集合之外的**全部 importer**（`packages-user/client-modules/src` 全量）与其它 monorepo 包（`entry-client` / `entry-data` / `packages/legacy-ui` 经 `@user/client-modules` 公共面的间接依赖）；另对 `packages/` 与 `src/` 做**对照扫描**（只登记、不修改）。

**判定口径固定为六类（一条记录只归一类，跨类拆条并互相引用）：**

| 类别 | 含义 | 归属规则 |
|---|---|---|
| A | **被移集合内部交叉引用** | 移植集合**内部**的互相 import（`components → elements`、`elements → map`、`map/extension/* → map/types`），以及移植集合 → **留在 `client-modules` 的**模块（`client-modules/src/shared.ts`、`render/renderer`、`render/use.ts`、`@user/client-base` 自包引用） |
| B | **外部导入点** | 移出集合**之外**的每一处 importer：`client-modules/src/{client.ts,types.ts}`、`render/index.tsx`、`render/ui/*`、`render/utils/{saves.ts,index.ts}`、`fallback/ui.ts`，以及其它 monorepo 包经 `@user/client-modules` 公共面的间接依赖（`entry-client` / `entry-data` / `packages/legacy-ui`） |
| C | **barrel 与导出面** | `render/{components,elements,map}/index.ts`、`render/index.tsx`、`render/utils/index.ts`、`client-modules/src/index.ts`、`client-base/src/index.ts` 的现行导出集合与「移出后是否断链」判定（**不得裁定是否新增 barrel / 如何补位**，属 F 类） |
| D | **分层与循环依赖风险** | 移入后 `client-base` → `client-modules` 的反向依赖候选、`@user/client-base` 自包引用、`client-base/package.json` 依赖缺口、`?raw` shader 构建链、`dev.md` 规则对照；**只登记风险与机器证据，不得自拟解耦方案** |
| E | **legacy 命中（仅报告）** | 被移集合内的 `core.*` / 全局 `loading` / `hook` / `Mota.require('@user/data-base')`（D-55：不考虑、不修、不登记为待办）；`packages/` 与 `src/` 对照扫描 |
| F | **未能从阅读确定** | 目标文件名与命名、barrel 扩张 / 断链补位、反向依赖解耦方式、`render/utils/index.ts` 归属、依赖缺口补齐、`?raw` 可行性、legacy 插件面、`createElements()` 注册点接线；只登记，不得写成错配 / 缺失 / 残留 / 待办 |

**分列规则（写死，防止类别互相冒充）：** A 记「集合内部互相 import + 集合 → 留在 `client-modules` 的模块（`shared.ts` / `render/renderer` / `render/use.ts` / `@user/client-base` 自包引用）」；B 记「集合之外的 importer（含其它 monorepo 包的间接依赖）」；C 记「barrel / 导出集合现状与移出后是否断链（**不裁定是否新增 barrel**）」；D 记「分层与循环依赖风险 + `package.json` 依赖现状（**只登记，不自拟解耦方案**）」；E 记「`core.*` / `loading` / `hook` / `Mota.require` 等 legacy 耦合（D-55 只报告）」；F 记「静态阅读不能定论（含全部命名问题）」。**一条记录只归一类，跨类拆条并互相引用。**

**证据纪律（行类型感知的锚点规则）：** 每行含 `文件/符号 + 命中处 file:line + 目标锚点 file:line + 问题描述 + 影响 + 置信`。**事实行 / 基准行**每行 **≥2 个完整 `文件:行` 锚点**（必须写全文件名，续行 `:NN` 简写不计；识别正则接受 `.(tsx?|frag|vert|json|md):\d+`，因此 `packages-user/client-base/package.json:5`、`dev.md:10`、`04-CONTEXT.md:42` 这类基准锚点同样计数）；**证据行**（仅限 `#04-10-A-09` / `#04-10-B-09` / `#04-10-E-01` / `#04-10-E-04` / `#04-10-E-05` 五条零命中 / 对照扫描行）在其 ID 单元格后带 `[证据行]` 标记，必须携带 `git grep` 命令与原样结果、有真实锚点时至少 1 个，**豁免 ≥2 计数**；**非上述五条的行带 `[证据行]` 标记即违规**。静态阅读不能定论者一律进 F 类，**不得写成错配 / 缺失 / 残留 / 待办**。

**只读子代理（D-09）：** 重型整文件读取可派**只读**子代理（只回传事实表「文件 + `file:line` + 形态或签名」，**不得写文件、不得贴大段源码**），最终由主执行者按 `file:line` 切片复核。

**只读起始基线（packages / packages-user / src）**：Task 1 起始执行 `git status --porcelain -- packages packages-user src`，当日实测输出（原样逐行记录，为空）：

```
（无）
```

**基线说明（重要）：** 规划日（2026-09-24）该输出为**单条** ` M packages-user/data-base/src/enemy/types.ts`（用户正在并发修改数据端，D-56）；当日 0a 起始实测为**空**——用户在规划与执行之间提交了 `47e71b5 refactor: EnemyManager`（数据端），其并发改动已随提交落地。本 run 一律**不回滚 / 不暂存 / 不提交 / 不修改**用户的任何改动，并以其为只读起始基线（点对点快照）；Task 1 / Task 3 门禁断言其后**逐条一致**（不新增、不消失、状态码不变）。另断言 `.planning/phases/04-render-adaptation/04-CONTEXT.md` 的既有未提交改动仍在（该路径不在集合内，故不计入 porcelain 基线）。

**基准提交核对：** 当日 0a 起始 HEAD = `47e71b5`（分支 `refine/data-client`）；规划日 HEAD 为 `3bc37b5`。`47e71b5` 仅触及数据端 `packages-user/data-base`，未触及本次清点的被移集合与 importer 文件，故文档行号在当日实测下有效。

## 被移集合清单（39 文件）

依据 D-52 / D-53。目标路径写法：`components` / `elements` / `map` 三个文件夹内的文件按同名相对路径映射到 `packages-user/client-base/src/{components,elements,map}/…`；`layout.ts` 映射为 `packages-user/client-base/src/layout/…`（**具体文件名是否仍为 `layout.ts` 属 F 类，须写「命名待用户裁定」，不得拍板**）。**本步不移动、不复制、不预建任何目标文件；不新建 `client-base/src/render/` 目录。**

### components（13）

| 现路径 | 目标路径（按 D-53） | 职责（一句话） | 备注 |
|---|---|---|---|
| packages-user/client-modules/src/render/components/choices.tsx | packages-user/client-base/src/components/choices.tsx | 选项框 / 确认框组件（`getConfirm` 等） | 含 legacy `core.*` 命中（E-02） |
| packages-user/client-modules/src/render/components/floorSelect.tsx | packages-user/client-base/src/components/floorSelect.tsx | 楼层选择器组件（`FloorSelector`） | 含 legacy `core.*` 命中（E-02） |
| packages-user/client-modules/src/render/components/icons.tsx | packages-user/client-base/src/components/icons.tsx | 图标组件集（`SoundVolume` / `Fullscreen` / `ExitFullscreen` 等） | — |
| packages-user/client-modules/src/render/components/index.ts | packages-user/client-base/src/components/index.ts | barrel（12 条 `export *`） | 见 C-02；barrel 名是否沿用属 F-01 |
| packages-user/client-modules/src/render/components/input.tsx | packages-user/client-base/src/components/input.tsx | 输入框组件（`getInput`） | — |
| packages-user/client-modules/src/render/components/list.tsx | packages-user/client-base/src/components/list.tsx | 列表页组件（`ListPage`） | — |
| packages-user/client-modules/src/render/components/misc.tsx | packages-user/client-base/src/components/misc.tsx | 杂项组件（`Progress` / `waitbox` / `TextContent` 等） | 含 legacy `core.*` 命中（E-02） |
| packages-user/client-modules/src/render/components/page.tsx | packages-user/client-base/src/components/page.tsx | 分页组件（`Page` / `PageExpose`） | — |
| packages-user/client-modules/src/render/components/scroll.tsx | packages-user/client-base/src/components/scroll.tsx | 滚动组件 | — |
| packages-user/client-modules/src/render/components/textbox.tsx | packages-user/client-base/src/components/textbox.tsx | 文本框组件（`TextContent` / `Textbox` / `TextboxProps`） | — |
| packages-user/client-modules/src/render/components/textboxTyper.ts | packages-user/client-base/src/components/textboxTyper.ts | 文本框打字机渲染 | 含 legacy `core.*` 命中（E-02） |
| packages-user/client-modules/src/render/components/thumbnail.tsx | packages-user/client-base/src/components/thumbnail.tsx | 缩略图组件（`Thumbnail`） | 含 legacy `core.*` 命中（E-02） |
| packages-user/client-modules/src/render/components/tip.tsx | packages-user/client-base/src/components/tip.tsx | 提示组件（`Tip` / `TipExpose` / `TipStore`） | 含 legacy `core.*` 命中（E-02） |

### elements（5）

| 现路径 | 目标路径（按 D-53） | 职责（一句话） | 备注 |
|---|---|---|---|
| packages-user/client-modules/src/render/elements/cache.ts | packages-user/client-base/src/elements/cache.ts | 贴图缓存（`texture` / `RenderableData` / `AutotileRenderable`） | 含 legacy `core.*` 与 `loading` / `Mota.require` 命中（E-02 / E-03 / E-06） |
| packages-user/client-modules/src/render/elements/index.ts | packages-user/client-base/src/elements/index.ts | barrel + `createElements()` 注册函数 | 见 A-03 / A-04 / C-03；注册点接线属 F-09 |
| packages-user/client-modules/src/render/elements/misc.ts | packages-user/client-base/src/elements/misc.ts | 渲染元素（`Icon` / `Winskin`） | 含 legacy `core.*` 与 `loading` / `Mota.require` 命中（E-02 / E-03） |
| packages-user/client-modules/src/render/elements/props.ts | packages-user/client-base/src/elements/props.ts | 元素 props 类型（`IconProps` 等） | 见 A-03 |
| packages-user/client-modules/src/render/elements/types.ts | packages-user/client-base/src/elements/types.ts | 元素类型面（`IMotaIcon` 等） | — |

### map（20）

| 现路径 | 目标路径（按 D-53） | 职责（一句话） | 备注 |
|---|---|---|---|
| packages-user/client-modules/src/render/map/block.ts | packages-user/client-base/src/map/block.ts | 图块分割器 | — |
| packages-user/client-modules/src/render/map/constant.ts | packages-user/client-base/src/map/constant.ts | 地图渲染常量 | — |
| packages-user/client-modules/src/render/map/element.ts | packages-user/client-base/src/map/element.ts | 地图渲染元素（`MapRenderItem`） | 见 A-06 |
| packages-user/client-modules/src/render/map/index.ts | packages-user/client-base/src/map/index.ts | barrel（`extension` + 9 条 `export *`） | 见 C-04 |
| packages-user/client-modules/src/render/map/moving.ts | packages-user/client-base/src/map/moving.ts | 移动图块 | 见 A-07 |
| packages-user/client-modules/src/render/map/renderer.ts | packages-user/client-base/src/map/renderer.ts | 地图渲染器（`MapRenderer` / 顶点生成主逻辑） | 见 A-06 / A-07 / D-09 |
| packages-user/client-modules/src/render/map/status.ts | packages-user/client-base/src/map/status.ts | 地图渲染状态 | — |
| packages-user/client-modules/src/render/map/types.ts | packages-user/client-base/src/map/types.ts | 地图渲染类型面（`IMapRenderer` 等） | 见 A-07 |
| packages-user/client-modules/src/render/map/vertex.ts | packages-user/client-base/src/map/vertex.ts | 地图顶点生成器 | 见 A-06 / A-07 |
| packages-user/client-modules/src/render/map/viewport.ts | packages-user/client-base/src/map/viewport.ts | 地图视口 | — |
| packages-user/client-modules/src/render/map/extension/door.ts | packages-user/client-base/src/map/extension/door.ts | 门渲染扩展 | 见 A-06 / A-08 |
| packages-user/client-modules/src/render/map/extension/hero.ts | packages-user/client-base/src/map/extension/hero.ts | 勇士渲染扩展 | 见 A-07 / A-08 |
| packages-user/client-modules/src/render/map/extension/index.ts | packages-user/client-base/src/map/extension/index.ts | 扩展 barrel（`hero` / `manager` / `types`） | 见 C-04 |
| packages-user/client-modules/src/render/map/extension/manager.ts | packages-user/client-base/src/map/extension/manager.ts | 地图扩展管理器（`MapExtensionManager`） | 见 A-08 |
| packages-user/client-modules/src/render/map/extension/text.ts | packages-user/client-base/src/map/extension/text.ts | 地图文字渲染（`OnMapTextRenderer`） | 见 A-08 |
| packages-user/client-modules/src/render/map/extension/types.ts | packages-user/client-base/src/map/extension/types.ts | 扩展类型（`IMapExtensionManager`） | 见 A-08 |
| packages-user/client-modules/src/render/map/shader/back.frag | packages-user/client-base/src/map/shader/back.frag | 背景着色器片元 | 见 D-09 |
| packages-user/client-modules/src/render/map/shader/back.vert | packages-user/client-base/src/map/shader/back.vert | 背景着色器顶点 | 见 D-09 |
| packages-user/client-modules/src/render/map/shader/map.frag | packages-user/client-base/src/map/shader/map.frag | 地图着色器片元 | 见 D-09 |
| packages-user/client-modules/src/render/map/shader/map.vert | packages-user/client-base/src/map/shader/map.vert | 地图着色器顶点 | 见 D-09 |

### utils（1）

| 现路径 | 目标路径（按 D-53） | 职责（一句话） | 备注 |
|---|---|---|---|
| packages-user/client-modules/src/render/utils/layout.ts | packages-user/client-base/src/layout/（**命名待用户裁定**） | 网格布局工具（`adjustGrid` / `adjustCover` / `IGridLayoutData`） | 端到端切片对象；见 A-01 / B-01 / C-01 / D-01 / E-01 / F-01 |

**合计：13 + 5 + 20 + 1 = 39 文件。**

## A 被移集合内部交叉引用

列序固定：`ID | 文件/符号 | 命中处（源） | 目标锚点 | 问题描述 | 影响 | 置信`。本节登记移植集合**内部**的互相 import，以及移植集合 → **留在 `client-modules` 的**模块（`shared.ts` / `render/renderer` / `render/use.ts` / `@user/client-base` 自包引用）。**行内不含任何移植方案、import 重写写法或「应改为 X」。**

| ID | 文件/符号 | 命中处（源） | 目标锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-10-A-01 | `render/utils/layout.ts`（集合内部引用面） | packages-user/client-modules/src/render/utils/index.ts:1 | packages-user/client-modules/src/render/utils/layout.ts:1, packages-user/client-modules/src/render/utils/layout.ts:28 | 集合内部**无**对 `layout.ts` 的 import。机器证据：`git grep -n -F "./layout" -- packages-user/client-modules/src` 仅命中 `render/utils/index.ts:1`（即集合**之外**） | 集合内部无断链；`layout.ts` 的唯一入口在集合之外的 `render/utils/index.ts:1`（见 B-01 / C-01） | 高 |
| #04-10-A-02 | `texture` / `RenderableData` / `AutotileRenderable`（`components → elements`） | packages-user/client-modules/src/render/components/tip.tsx:7, packages-user/client-modules/src/render/components/textbox.tsx:33, packages-user/client-modules/src/render/components/textboxTyper.ts:5 | packages-user/client-modules/src/render/elements/cache.ts:280, packages-user/client-modules/src/render/elements/cache.ts:38, packages-user/client-modules/src/render/elements/cache.ts:43 | 三个组件从 `../elements` import `texture`（`tip.tsx:7` / `textbox.tsx:33`）与 `RenderableData` / `AutotileRenderable` / `texture`（`textboxTyper.ts:5`）；符号声明均在 `elements/cache.ts`，经 `elements/index.ts:45` 的 `export * from './cache'` 暴露 | 集合内部引用，随集合整体移动、相对路径不变 ⇒ **无断链风险** | 高 |
| #04-10-A-03 | `MapRenderItem` / `IMapExtensionManager` / `IMapRenderer`（`elements → map`） | packages-user/client-modules/src/render/elements/index.ts:2, packages-user/client-modules/src/render/elements/props.ts:4 | packages-user/client-modules/src/render/map/element.ts:8, packages-user/client-modules/src/render/map/types.ts:327, packages-user/client-modules/src/render/map/extension/types.ts:6 | `elements/index.ts:2` 从 `../map` import `MapRenderItem`；`elements/props.ts:4` 从 `../map` import `IMapExtensionManager` / `IMapRenderer`；符号声明见 `map/element.ts:8`（`MapRenderItem`）、`map/types.ts:327`（`IMapRenderer`）、`map/extension/types.ts:6`（`IMapExtensionManager`），经 `map/index.ts:1-9` 暴露 | 集合内部引用，随集合整体移动、相对路径不变 ⇒ **无断链风险** | 高 |
| #04-10-A-04 | `mainRenderer` / `tagManager` / `using`（被移集合 → 留在 `render/` 的 `renderer`） | packages-user/client-modules/src/render/elements/index.ts:3, packages-user/client-modules/src/render/components/textboxTyper.ts:6, packages-user/client-modules/src/render/components/misc.tsx:14 | packages-user/client-modules/src/render/renderer.ts:35, packages-user/client-modules/src/render/renderer.ts:43, packages-user/client-modules/src/render/renderer.ts:45 | `elements/index.ts:3` 从 `../renderer` import `mainRenderer` / `tagManager`；`components/textboxTyper.ts:6` 与 `components/misc.tsx:14` 从 `../renderer` import `using`；声明见 `render/renderer.ts:35`（`mainRenderer`）、`renderer.ts:43`（`using`）、`renderer.ts:45`（`tagManager`） | **该方向移入后即成为 `client-base` → `client-modules` 反向依赖候选**（`render/renderer.ts` 按 D-54 留在实现层）；交叉引用 D-03 | 高 |
| #04-10-A-05 | `useKey` / `transitioned` / `transitionedColor`（被移集合 → 留在 `render/` 的 `use.ts`） | packages-user/client-modules/src/render/components/choices.tsx:8, packages-user/client-modules/src/render/components/tip.tsx:4, packages-user/client-modules/src/render/components/scroll.tsx:31, packages-user/client-modules/src/render/components/input.tsx:14, packages-user/client-modules/src/render/components/misc.tsx:10 | packages-user/client-modules/src/render/use.ts:87, packages-user/client-modules/src/render/use.ts:343, packages-user/client-modules/src/render/use.ts:367 | `choices.tsx:8` / `input.tsx:14` 从 `../use` import `useKey`（另 `input.tsx:14` 取 `transitionedColor`）；`tip.tsx:4` / `scroll.tsx:31` / `misc.tsx:10` 从 `../use` import `transitioned`；声明见 `render/use.ts:87`（`useKey`）、`use.ts:343`（`transitioned`）、`use.ts:367`（`transitionedColor`） | **反向依赖候选**（`render/use.ts` 按 D-54 留在实现层）；交叉引用 D-04。`render/use.ts` 自身**无**相对导入（实测只 import 外部包与 `@user/data-base` 的 `loading`）；`../weather` 的导入处在 `render/utils/use.ts:2`（非本次移植集合），须一并登记（交叉引用 D-04） | 高 |
| #04-10-A-06 | `shared.ts` 常量（被移集合 → `client-modules/src/shared.ts`） | packages-user/client-modules/src/render/map/vertex.ts:25, packages-user/client-modules/src/render/map/element.ts:5, packages-user/client-modules/src/render/map/renderer.ts:53, packages-user/client-modules/src/render/map/extension/door.ts:9 | packages-user/client-modules/src/shared.ts:27, packages-user/client-modules/src/shared.ts:37, packages-user/client-modules/src/shared.ts:55 | `map/vertex.ts:25` / `map/element.ts:5` / `map/renderer.ts:53` 从 `../../shared` import（`MAP_*` / `CELL_*` / `DYNAMIC_RESERVE` 等）；`map/extension/door.ts:9` 从 `../../../shared` import `DOOR_ANIMATE_INTERVAL`；声明见 `shared.ts:27`（`CELL_WIDTH`）、`shared.ts:37`（`MAP_WIDTH`）、`shared.ts:55`（`DOOR_ANIMATE_INTERVAL`） | **D 类反向依赖最硬的一条**（连包内常量都反向）；交叉引用 D-02 | 高 |
| #04-10-A-07 | `IMaterialFramedData` / `ITextureManager`（被移集合 → `@user/client-base` 自包引用） | packages-user/client-modules/src/render/map/extension/hero.ts:16, packages-user/client-modules/src/render/map/moving.ts:3, packages-user/client-modules/src/render/map/renderer.ts:13, packages-user/client-modules/src/render/map/types.ts:12, packages-user/client-modules/src/render/map/vertex.ts:28 | packages-user/client-base/src/material/types.ts:75, packages-user/client-base/src/material/types.ts:217, packages-user/client-base/src/index.ts:2 | 5 处从 `@user/client-base` import：`hero.ts:16` / `vertex.ts:28` 取 `IMaterialFramedData`；`moving.ts:3` 取 `IMaterialFramedData` / `ITextureManager`；`renderer.ts:13` / `types.ts:12` 取多符号（含 `IMaterialFramedData` / `ITextureManager` / `ITrackedAssetData` / `IAutotileProcessor`）；声明见 `material/types.ts:75`（`IMaterialFramedData`）、`material/types.ts:217`（`ITextureManager`），经 `client-base/src/index.ts:2` 的 `export * from './material'` 暴露 | **移入后成为包内自引**，改写方式属 F 类（F-05）；交叉引用 D-06 | 高 |
| #04-10-A-08 | `IMapRenderer` / `IMapRendererTicker` / `IMovingBlock` / `IMapRenderResult`（`map/extension/* → map/types`） | packages-user/client-modules/src/render/map/extension/door.ts:7, packages-user/client-modules/src/render/map/extension/hero.ts:13, packages-user/client-modules/src/render/map/extension/manager.ts:8, packages-user/client-modules/src/render/map/extension/types.ts:4, packages-user/client-modules/src/render/map/extension/text.ts:8 | packages-user/client-modules/src/render/map/types.ts:327, packages-user/client-modules/src/render/map/types.ts:273 | 5 处从 `../types` import：`door.ts:7` / `manager.ts:8` 取 `IMapRenderer`；`hero.ts:13` 取 `IMapRenderer` / `IMapRendererTicker` / `IMovingBlock`；`extension/types.ts:4` 取 `IMapRenderResult`；`text.ts:8` 取多符号；声明见 `map/types.ts:327`（`IMapRenderer`）、`map/types.ts:273`（`IMapRendererTicker`） | 集合内部引用，随集合整体移动、相对路径不变 ⇒ **无断链风险** | 高 |
| #04-10-A-09 [证据行] | 被移集合对 `ui` / `fx` / `weather` 的 import（零命中证据） | 引用点 0 处（核对命令 `git grep -n -F "../ui"` / `-F "../fx"` / `-F "../weather"`，同限 `packages-user/client-modules/src/render/components`、`render/elements`、`render/map`、`render/utils/layout.ts`，三条均无输出、退出码 1） | packages-user/client-modules/src/render/components/index.ts:1 | 三条独立检索均无输出 ⇒ 被移集合内对 `ui` / `fx` / `weather` **零引用**；只登记命令与输出，不判定其含义 | 机器证据，供分层基线门禁复验 | 高 |

**A 类小结：** 覆盖 8 个方向——`components→elements`（A-02）、`elements→map`（A-03）、→`render/renderer`（A-04）、→`render/use.ts`（A-05）、→`client-modules/src/shared.ts`（A-06）、→`@user/client-base` 自包引用（A-07）、`map/extension/*→map/types`（A-08）与零命中证据（A-09）；另含 `layout.ts` 端到端切片（A-01）。**行内无修复建议。**

## B 外部导入点

列序固定：`ID | 文件/符号 | 命中处（源） | 目标锚点 | 问题描述 | 影响 | 置信`。本节登记移出集合**之外**的每一处 importer（含其它 monorepo 包的间接依赖）。**行内不含任何移植方案或重写写法。**

| ID | 文件/符号 | 命中处（源） | 目标锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-10-B-01 | `render/utils/index.ts` 对 `layout.ts` 的再导出 | packages-user/client-modules/src/render/utils/index.ts:1 | packages-user/client-modules/src/render/utils/layout.ts:28, packages-user/client-modules/src/render/utils/layout.ts:69 | `render/utils/index.ts:1` 的 `export * from './layout'` 是 `layout.ts` 的**唯一**外部入口（`adjustGrid` 声明 `layout.ts:28`、`adjustCover` 声明 `layout.ts:69`） | 移出后该 barrel 断链；`render/ui/save.tsx:31` / `render/ui/settings.tsx:20` / `render/ui/title.tsx:35` 经 `../utils` 间接依赖它（见 C-06）；交叉引用 C-01 / D-05 | 高 |
| #04-10-B-02 | `IMapExtensionManager` / `IMapRenderer` / `MapRenderer` / `MapExtensionManager` | packages-user/client-modules/src/types.ts:2, packages-user/client-modules/src/client.ts:25 | packages-user/client-modules/src/render/map/index.ts:1, packages-user/client-modules/src/render/map/types.ts:327 | `types.ts:2` 从 `./render/map` import `IMapExtensionManager` / `IMapRenderer`；`client.ts:25` 从 `./render/map` import 多符号（`IMapRenderer` / `IMapExtensionManager` / `MapRenderer` / `MapExtensionManager`）；目标 barrel 见 `map/index.ts:1`，`IMapRenderer` 声明见 `map/types.ts:327` | `./render/map` 路径需改指（第二步）；交叉引用 C-04 | 高 |
| #04-10-B-03 | `createElements` / `components` / `elements` 的再导出 | packages-user/client-modules/src/render/index.tsx:5, packages-user/client-modules/src/render/index.tsx:45, packages-user/client-modules/src/render/index.tsx:46 | packages-user/client-modules/src/render/elements/index.ts:7, packages-user/client-modules/src/render/components/index.ts:1, packages-user/client-modules/src/render/elements/index.ts:45 | `index.tsx:5` import `createElements`（声明 `elements/index.ts:7`）；`index.tsx:45` 的 `export * from './components'` 与 `:46` 的 `export * from './elements'` 是集合对外再导出点 | `:45` / `:46` 移出后断链（交叉引用 C-05）；公共面收窄（交叉引用 B-08） | 高 |
| #04-10-B-04 | `render/ui/` 8 文件 11 处 `../components` 导入 | packages-user/client-modules/src/render/ui/main.tsx:9, packages-user/client-modules/src/render/ui/save.tsx:16, packages-user/client-modules/src/render/ui/settings.tsx:16, packages-user/client-modules/src/render/ui/settings.tsx:21, packages-user/client-modules/src/render/ui/statistics.tsx:8, packages-user/client-modules/src/render/ui/statusBar.tsx:3, packages-user/client-modules/src/render/ui/title.tsx:31, packages-user/client-modules/src/render/ui/viewmap.tsx:26, packages-user/client-modules/src/render/ui/viewmap.tsx:29, packages-user/client-modules/src/render/ui/toolbar.tsx:13, packages-user/client-modules/src/render/ui/toolbar.tsx:19 | packages-user/client-modules/src/render/components/textbox.tsx:311, packages-user/client-modules/src/render/components/misc.tsx:44, packages-user/client-modules/src/render/components/tip.tsx:147 | `main.tsx:9`（`Textbox` / `TextboxProps` / `Tip`）、`save.tsx:16`（`getConfirm` / `Page` / `PageExpose` / `Thumbnail`）、`settings.tsx:16`（多符号）与 `:21`（`getInput`）、`statistics.tsx:8`（`waitbox` / `ListPage` / `TextContent`）、`statusBar.tsx:3`（`TextContent`）、`title.tsx:31`（`ExitFullscreen` / `Fullscreen` / `SoundVolume`）、`viewmap.tsx:26`（`FloorSelector`）与 `:29`（`Tip` / `TipExpose`）、`toolbar.tsx:13`（`../components/icons`）与 `:19`（`../components/misc` 的 `Progress`，声明 `misc.tsx:44`） | **深层导入须单列标注**：`toolbar.tsx:13`（`../components/icons`）与 `toolbar.tsx:19`（`../components/misc`）——浅层 barrel 改指覆盖不到深层路径 | 高 |
| #04-10-B-05 | `getConfirm` / `waitbox`（`render/utils/saves.ts`） | packages-user/client-modules/src/render/utils/saves.ts:2 | packages-user/client-modules/src/render/components/choices.tsx:596, packages-user/client-modules/src/render/components/misc.tsx:568 | `render/utils/saves.ts:2` 从 `../components` import `getConfirm`（声明 `choices.tsx:596`）/ `waitbox`（声明 `misc.tsx:568`） | 该文件按 D-54 **不移植**但依赖被移集合 ⇒ **第二步必改点**（单列标注） | 高 |
| #04-10-B-06 | `render/utils/index.ts` 对 `layout.ts` 的再导出（交叉引用索引） | packages-user/client-modules/src/render/utils/index.ts:1 | packages-user/client-modules/src/render/utils/layout.ts:28 | 本条与 `#04-10-B-01` 为**同一事实**，只做交叉引用索引、不新增独立事实、不重复计数 | 见 `#04-10-B-01` 与 `#04-10-C-01` / `#04-10-C-06` | 高 |
| #04-10-B-07 | `TipStore`（`fallback/ui.ts` 深层导入） | packages-user/client-modules/src/fallback/ui.ts:2 | packages-user/client-modules/src/render/components/tip.tsx:147 | `fallback/ui.ts:2` 深层导入 `../render/components/tip` 的 `TipStore`（声明 `tip.tsx:147`） | 深层导入；该文件按 D-54 **不移植**（`fallback` 属实现层）⇒ **第二步必改点**（单列标注） | 高 |
| #04-10-B-08 | 其它 monorepo 包经 `@user/client-modules` 公共面的间接依赖 | packages-user/entry-client/src/create.ts:10, packages-user/entry-client/src/create.ts:27, packages-user/entry-data/src/mota.ts:11, packages-user/entry-data/src/mota.ts:32, packages/legacy-ui/src/preset/ui.ts:86, packages/legacy-ui/src/preset/ui.ts:96, packages/legacy-ui/src/preset/ui.ts:105 | packages-user/client-modules/src/index.ts:15, packages-user/client-modules/src/render/index.tsx:45 | `entry-client/src/create.ts:10`（`import * as ClientModules`）与 `:27`（`Mota.register('@user/client-modules', ClientModules)`）；`entry-data/src/mota.ts:11`（`import type * as ClientModules`）与 `:32`（类型映射）；`packages/legacy-ui/src/preset/ui.ts:86` / `:96`（`Mota.require('@user/client-modules').mainRenderer.setScale(...)`）/ `:105`（`Mota.require('@user/client-modules').client`）；再导出链顶层见 `client-modules/src/index.ts:15` 与 `render/index.tsx:45` | 这些包不直接 import 被移集合，但经 `render` 的再导出链**间接暴露**被移集合的公共符号；移出后该再导出链必须补位，否则**公共面收窄**（是否属破坏、如何补位属 F 类 / 用户裁定） | 高 |
| #04-10-B-09 [证据行] | `packages/` 与 `src/` 的对照扫描（机器证据） | `packages/` 与 `src/` 对 `render/components` / `render/elements` / `render/map` **零命中**（核对命令 `git grep -n -F "render/components"`、`-F "render/elements"`、`-F "render/map"`，同限 `packages` 与 `src`，三条均无输出、退出码 1）；`packages-user` 内唯一命中为 `packages-user/client-modules/src/fallback/ui.ts:2` | packages-user/client-modules/src/fallback/ui.ts:2 | 三条独立检索在 `packages/` 与 `src/` 均无输出 ⇒ 对**被移集合源文件**零直接命中；只登记输出与结论，**不得为 `packages/` 与 `src/` 提修改建议** | 机器证据，供对照扫描门禁复验 | 高 |

**B 类小结：** 覆盖 `client.ts:25` / `types.ts:2`（B-02）、`render/index.tsx:5,45,46`（B-03）、`render/ui` 8 文件 11 处（B-04，含 `toolbar.tsx` 深层导入）、`render/utils/saves.ts:2`（B-05）、`render/utils/index.ts:1`（B-01 / B-06）、`fallback/ui.ts:2`（B-07）、其它 monorepo 包（B-08）与对照扫描机器证据（B-09）。深层导入（B-04 / B-07）与「不移植但被引用」的第二步必改点（B-05 / B-07）均已单列标注。

## C barrel 与导出面

列序固定：`ID | 文件/符号 | 命中处（源） | 目标锚点 | 问题描述 | 影响 | 置信`。本节登记各 barrel 的**现状导出集合**与「移出后是否断链」判定；**只判定断链与否，不裁定如何补位、不裁定是否新增 barrel（属 F 类）。**

| ID | 文件/符号 | 命中处（源） | 目标锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-10-C-01 | `render/utils/index.ts`（`layout.ts` 切片 barrel 节点） | packages-user/client-modules/src/render/utils/index.ts:1 | packages-user/client-modules/src/render/utils/layout.ts:28 | `render/utils/index.ts:1`（`export * from './layout'`）嵌在 `render/utils/index.ts:1-3`（另两条 `./saves` / `./use` 留在原地）中；现状 = 该 barrel 同时导出**被移**（`./layout`）与**非被移**内容 | 判定 = **移出即断链**，第二步必须改指（具体写法属 F 类）；与 B-01 交叉引用、不重复计数 | 高 |
| #04-10-C-02 | `render/components/index.ts`（12 条 `export *`） | packages-user/client-modules/src/render/components/index.ts:1, packages-user/client-modules/src/render/components/index.ts:12 | packages-user/client-modules/src/render/components/choices.tsx:596, packages-user/client-modules/src/render/components/tip.tsx:147 | 12 条 `export *`（`./choices` `./floorSelect` `./icons` `./input` `./list` `./misc` `./page` `./scroll` `./textbox` `./textboxTyper` `./thumbnail` `./tip`）；现状导出集合 = 上述 12 个子模块 | 判定 = **随集合整体移动**、集合内相对路径不变 ⇒ 自身不断链；但 `render/index.tsx:45` 与 `render/ui/*` 的 `../components` 路径需改指（属第二步） | 高 |
| #04-10-C-03 | `render/elements/index.ts`（`createElements()` + 3 条 `export *`） | packages-user/client-modules/src/render/elements/index.ts:1, packages-user/client-modules/src/render/elements/index.ts:2, packages-user/client-modules/src/render/elements/index.ts:3 | packages-user/client-modules/src/render/elements/index.ts:7, packages-user/client-modules/src/render/map/index.ts:1, packages-user/client-modules/src/render/renderer.ts:35 | `:1` import `@motajs/common`；`:2` import `../map`；`:3` import `../renderer`；`:4` / `:5` 本地 import；`createElements()` 声明 `:7`；`:45-47` 三条 `export *`（`./cache` / `./misc` / `./props`） | 判定 = 移出后 `:2` 变为集合内引用（**不断链**）、`:3` 变为 `client-base` → `client-modules` **反向依赖**（交叉引用 A-04 与 D-03）；`createElements()` 的注册点接线属 F 类（F-09） | 高 |
| #04-10-C-04 | `render/map/index.ts`（`extension` + 9 条 `export *`） | packages-user/client-modules/src/render/map/index.ts:1, packages-user/client-modules/src/render/map/index.ts:10 | packages-user/client-modules/src/render/map/types.ts:327, packages-user/client-modules/src/render/map/extension/index.ts:1 | `map/index.ts:1` 的 `export * from './extension'` + `:3-11` 的 `./block` / `./constant` / `./element` / `./moving` / `./renderer` / `./status` / `./types` / `./vertex` / `./viewport`；`extension/index.ts:1-3` 导出 `./hero` / `./manager` / `./types` | 判定 = **随集合整体移动、自身不断链**；`client.ts:25` 与 `types.ts:2` 的 `./render/map` 需改指（交叉引用 B-02） | 高 |
| #04-10-C-05 | `render/index.tsx`（集合对外再导出点） | packages-user/client-modules/src/render/index.tsx:45, packages-user/client-modules/src/render/index.tsx:46, packages-user/client-modules/src/render/index.tsx:51 | packages-user/client-modules/src/render/components/index.ts:1, packages-user/client-modules/src/render/elements/index.ts:1 | `index.tsx:45`（`export * from './components'`）、`:46`（`export * from './elements'`）、`:51`（`export * from './renderer'`）；目标 barrel 见 `components/index.ts:1` 与 `elements/index.ts:1` | 判定 = **移出后 `:45` / `:46` 断链**（`:51` 的 `./renderer` 留原地不断链），必须补位，否则 `@user/client-modules` 公共面收窄（交叉引用 B-08） | 高 |
| #04-10-C-06 | `render/utils/index.ts`（完整 barrel） | packages-user/client-modules/src/render/utils/index.ts:1, packages-user/client-modules/src/render/utils/index.ts:2, packages-user/client-modules/src/render/utils/index.ts:3 | packages-user/client-modules/src/render/utils/layout.ts:28, packages-user/client-modules/src/render/utils/saves.ts:19 | `:1-3` 的 `export * from './layout'` / `./saves` / `./use`；`layout.ts` 移出而该 barrel 按 D-54 **不移植** | 判定 = **`:1` 移出即断链**；`render/ui/save.tsx:31` / `render/ui/settings.tsx:20` / `render/ui/title.tsx:35` 经 `../utils` 间接消费该导出 | 高 |
| #04-10-C-07 | `client-modules/src/index.ts`（再导出链顶层出口） | packages-user/client-modules/src/index.ts:3, packages-user/client-modules/src/index.ts:15 | packages-user/client-modules/src/render/index.tsx:45, packages-user/client-modules/src/render/index.tsx:46 | `index.ts:3`（`import { createGameRenderer, createRender } from './render'`）与 `index.ts:15`（`export * from './render'`） | 判定 = 再导出链的**顶层出口**，公共面收窄的最终承担点（交叉引用 C-05 / B-08） | 高 |
| #04-10-C-08 | `client-base/src/index.ts`（目标侧 barrel 现状） | packages-user/client-base/src/index.ts:1, packages-user/client-base/src/index.ts:2, packages-user/client-base/src/index.ts:3 | packages-user/client-base/src/load/index.ts:1, packages-user/client-base/src/material/index.ts:1 | 现行 `export * from './load'` / `./material` / `./save` / `./types`；被导出文件见 `load/index.ts:1`、`material/index.ts:1` | 判定 = 目标侧 barrel **现状不含** `components` / `elements` / `map` / `layout`；**是否新增导出属 F 类，不得裁定** | 高 |

**导出面链条小结（不新增独立事实，只把上面的链条串起来）：** `render/components/index.ts` + `render/elements/index.ts` + `render/map/index.ts` → `render/index.tsx:45,46,51` → `client-modules/src/index.ts:3,15` → `@user/client-modules` 消费者（`entry-client/src/create.ts:10,27` / `entry-data/src/mota.ts:11,32` / `packages/legacy-ui/src/preset/ui.ts:86,96,105`），供第二步据以补位。**未裁定「是否新增 barrel / 如何补位」。**

## D 分层与循环依赖风险

列序固定：`ID | 文件/符号 | 命中处（源） | 目标锚点 | 问题描述 | 影响 | 置信`。本节登记移入后 `client-base` → `client-modules` 的反向依赖候选、`@user/client-base` 自包引用、`client-base/package.json` 依赖缺口、`?raw` shader 构建链与 `dev.md` 规则对照。**只登记风险与机器证据，不得自拟解耦方案**（不得写「应下沉 / 应抽类型 / 应保留跨包依赖 / 应改用 X」）。

| ID | 文件/符号 | 命中处（源） | 目标锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-10-D-01 | `layout.ts` 依赖面（切片基准行） | packages-user/client-modules/src/render/utils/layout.ts:1 | packages-user/client-base/package.json:5, packages-user/client-modules/src/render/utils/layout.ts:28 | `layout.ts:1` 只依赖 `@motajs/render`（`ElementLocator`）；`client-base/package.json:5` 已声明 `@motajs/render` ⇒ **本文件不引入新的依赖缺口**。另：若 `render/utils/index.ts` 为保持导出面而反向 import `@user/client-base`，则该方向为 `client-modules → client-base`（与本节其它条目的反向风险相反，属合法方向） | 登记事实；解耦方式由用户裁定（F-02 / F-04） | 高 |
| #04-10-D-02 | `client-modules/src/shared.ts`（常量 / 工具面反向依赖） | packages-user/client-modules/src/render/map/vertex.ts:25, packages-user/client-modules/src/render/map/element.ts:5, packages-user/client-modules/src/render/map/renderer.ts:53, packages-user/client-modules/src/render/map/extension/door.ts:9 | packages-user/client-modules/src/shared.ts:27, dev.md:10 | 移入后 `client-base` → `client-modules` **反向依赖**（连包内常量都反向）：4 处 `../../shared` / `../../../shared` 引用 `shared.ts` 的 `CELL_*` / `MAP_*` / `DOOR_ANIMATE_INTERVAL` 等 | 违反 `dev.md:10` 的单向依赖 `src → packages-user → packages`（跨包单向）；交叉引用 A-06；解耦方式由用户裁定 | 高 |
| #04-10-D-03 | `render/renderer.ts`（渲染器面反向依赖） | packages-user/client-modules/src/render/elements/index.ts:3, packages-user/client-modules/src/render/components/textboxTyper.ts:6, packages-user/client-modules/src/render/components/misc.tsx:14 | packages-user/client-modules/src/render/renderer.ts:35, dev.md:10 | 同向：3 处从 `../renderer` 引用 `mainRenderer` / `tagManager` / `using`；`render/renderer.ts` 按 D-54 留在实现层 | 违反 `dev.md:10` 单向依赖；交叉引用 A-04；解耦方式由用户裁定 | 高 |
| #04-10-D-04 | `render/use.ts`（hooks 面反向依赖） | packages-user/client-modules/src/render/components/choices.tsx:8, packages-user/client-modules/src/render/components/tip.tsx:4, packages-user/client-modules/src/render/components/scroll.tsx:31, packages-user/client-modules/src/render/components/input.tsx:14, packages-user/client-modules/src/render/components/misc.tsx:10 | packages-user/client-modules/src/render/use.ts:87, packages-user/client-modules/src/render/utils/use.ts:2 | 同向：5 处从 `../use` 引用 `useKey` / `transitioned` / `transitionedColor`。**`render/use.ts` 自身无相对导入**（实测只 import 外部包与 `@user/data-base` 的 `loading`），故本方向不牵出 `ui` / `fx` / `weather`；`../weather` 的实际导入处在 `render/utils/use.ts:2`（非本次移植集合），与 `render/use.ts` 无关 | 违反 `dev.md:10` 单向依赖；是否必然成环静态阅读不能判定 ⇒ 交叉引用 F-04；交叉引用 A-05 | 中 |
| #04-10-D-05 | `render/utils/index.ts`（barrel 面反向依赖） | packages-user/client-modules/src/render/utils/index.ts:1 | packages-user/client-modules/src/render/utils/layout.ts:28, dev.md:10 | 同向：`render/utils/index.ts:1` 引用被移的 `layout.ts`；该 barrel 按 D-54 不移植，若为保持导出面而反向 import `client-base` 即形成反向依赖 | 违反 `dev.md:10` 单向依赖（潜在）；交叉引用 C-01 / C-06；解耦方式由用户裁定 | 中 |
| #04-10-D-06 | `@user/client-base`（自包引用） | packages-user/client-modules/src/render/map/extension/hero.ts:16, packages-user/client-modules/src/render/map/moving.ts:3, packages-user/client-modules/src/render/map/renderer.ts:13, packages-user/client-modules/src/render/map/types.ts:12, packages-user/client-modules/src/render/map/vertex.ts:28 | packages-user/client-base/src/index.ts:2, packages-user/client-base/package.json:3 | 移入 `client-base` 后，5 处对 `@user/client-base` 的 import 变为**包内自引**（`IMaterialFramedData` / `ITextureManager` / `ITrackedAssetData` / `IAutotileProcessor`） | 改写方式属 F 类（F-05）；交叉引用 A-07 | 高 |
| #04-10-D-07 | `packages-user/client-base/package.json` 依赖缺口 | packages-user/client-base/package.json:3, packages-user/client-base/package.json:9 | packages-user/client-modules/package.json:4, packages-user/client-modules/package.json:17 | `client-base/package.json:3-9` 现行只声明 `@motajs/audio` / `@motajs/render` / `@motajs/client-base` / `@user/data-base` / `@user/data-state`；被移集合还用到 `@motajs/render-vue`（12 个组件 + `elements/props.ts:1`）、`@motajs/system`（`choices.tsx:7` 等）、`@motajs/common`（`elements/index.ts:1`）、`@user/data-common`（`map/renderer.ts:38` / `map/vertex.ts:2` / `map/extension/hero.ts:11` / `map/extension/manager.ts:1` / `map/extension/types.ts:2`）；这些依赖当前都在 `client-modules/package.json:4-17` 声明 | **只登记缺口事实，不得提出补声明、安装或改配置的建议**（是否第二步补齐属 F-06） | 高 |
| #04-10-D-08 | 反向依赖现状的机器证据 | packages-user/client-modules/src/client.ts:19, packages-user/client-modules/src/fallback/load.ts:6 | packages-user/client-base/package.json:3, packages-user/client-modules/src/render/map/vertex.ts:28 | 执行 `git grep -n -F "client-modules" -- packages-user/client-base` **无输出、退出码 1** ⇒ 该风险由本次移植**引入**、非既有（`client-base/package.json:3` 的 deps 内无 `@user/client-modules`）。另 `git grep -n -F "from '@user/client-base'" -- packages-user/client-modules/src` 命中 **7** 条（5 条在被移集合内，另 2 条为 `client.ts:19` / `fallback/load.ts:6`） | 机器证据，供分层基线门禁复验 | 高 |
| #04-10-D-09 | shader `?raw` 构建链 | packages-user/client-modules/src/render/map/renderer.ts:43, packages-user/client-modules/src/render/map/renderer.ts:46 | packages-user/client-base/package.json:1, packages-user/client-modules/package.json:1 | `render/map/renderer.ts:43-46` 的 `./shader/{map,back}.{vert,frag}?raw` 导入 4 个 shader（随集合移动，**相对路径不变**）；`?raw` 由构建链处理 | 换包后是否仍被构建链处理属 F 类（F-07）；只登记事实 | 中 |
| #04-10-D-10 | `dev.md` 规则基准对照 | dev.md:10, dev.md:53, dev.md:138 | dev.md:139, packages-user/client-base/src/index.ts:1 | 逐条对照：`dev.md:10`「依赖方向单向 `src → packages-user → packages`」——D-02 / D-03 / D-04 / D-05 的反向方向与其冲突；`dev.md:53`「不允许出现循环引用」——反向依赖是否成环见 F-04；`dev.md:138`-`dev.md:139`「双端分离：`@user/client-base` 系统层 / `@user/client-modules` 实现层」——本案目标即把通用内容移回系统层，方向与规则一致 | **只对照，不裁定处置** | 高 |

**D 类小结：** 覆盖反向依赖候选 4 族（`shared.ts` 4 处 / `render/renderer` 3 处 / `render/use.ts` 5 处 / `render/utils` 1 处，共 13 处）、`@user/client-base` 自包引用 5 处、`client-base/package.json` 依赖缺口、反向依赖现状机器证据（规划日零命中）、shader `?raw` 4 处、`dev.md` 规则对照与 `layout.ts` 切片基准行。**无任何自拟解耦方案。**

## E legacy 命中（仅报告）

**本节仅报告：按 D-55 不考虑任何 legacy 内容，legacy 相关报错一律不管、不修、不登记为待办。** 本节的每一条都只是**事实登记**，不构成 AI 工作项；`packages/` 与 `src/` 的命中亦只报告、不提修改建议。

| ID | 文件/符号 | 命中处（源） | 目标锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-10-E-01 [证据行] | `render/utils/layout.ts` 内的 legacy 命中（零命中证据） | 0 处（核对命令 `git grep -n -F "core."` / `-F "hook"` / `-F "loading"` / `-F "Mota.require"`，同限 `packages-user/client-modules/src/render/utils/layout.ts`，四条均无输出、退出码 1） | packages-user/client-modules/src/render/utils/layout.ts:1 | 四条独立检索均无输出 ⇒ `layout.ts` 内 legacy 命中为 **0**；只报告（D-55），不判定其含义 | 只报告；`layout.ts` 的 legacy 面为空 | 高 |
| #04-10-E-02 | `core.*` 命中逐文件汇总 | packages-user/client-modules/src/render/components/choices.tsx:675, packages-user/client-modules/src/render/components/floorSelect.tsx:62, packages-user/client-modules/src/render/components/misc.tsx:312, packages-user/client-modules/src/render/components/textboxTyper.ts:906, packages-user/client-modules/src/render/components/thumbnail.tsx:75, packages-user/client-modules/src/render/components/tip.tsx:103, packages-user/client-modules/src/render/elements/cache.ts:11, packages-user/client-modules/src/render/elements/misc.ts:221 | 04-CONTEXT.md:42, 04-CONTEXT.md:44 | 当日实测 `core.*` 命中 **30** 处：`choices.tsx` 13（`:675,715,717,718,719,728,733,770,772,773,774,783,789`）、`floorSelect.tsx` 2（`:62,181`）、`misc.tsx` 1（`:312`）、`textboxTyper.ts` 1（`:906`）、`thumbnail.tsx` 1（`:75`）、`tip.tsx` 1（`:103`）、`elements/cache.ts` 9（`:11,87,89,131,151,202,206,393,469`）、`elements/misc.ts` 2（`:221,228`）；核对命令 `git grep -n -F "core." -- <被移集合四个路径>`。基准见 `04-CONTEXT.md:42`（D-12：`core.*` 属旧引擎适配，归第五阶段） | **只报告**（D-55）；不修、不登记为待办 | 高 |
| #04-10-E-03 | 全局 `loading` + `Mota.require('@user/data-base')` | packages-user/client-modules/src/render/elements/cache.ts:491, packages-user/client-modules/src/render/elements/cache.ts:492, packages-user/client-modules/src/render/elements/misc.ts:89, packages-user/client-modules/src/render/elements/misc.ts:219 | 04-CONTEXT.md:44, packages-user/client-modules/src/render/elements/misc.ts:94 | `render/elements/cache.ts:491-492`（`const { loading } = Mota.require('@user/data-base'); loading.once('loaded', ...)`）与 `render/elements/misc.ts:89-94` / `:219-225`（同形）；基准见 `04-CONTEXT.md:44`（D-14：全局 `hook` / `loading` 属 legacy） | **只报告**（D-55）；不修、不登记为待办 | 高 |
| #04-10-E-04 [证据行] | `client.*` 在移出集合内的命中（零命中证据） | 0 处（核对命令 `git grep -n -F "client."`，同限 `packages-user/client-modules/src/render/components`、`render/elements`、`render/map`、`render/utils/layout.ts`，无输出、退出码 1） | 04-CONTEXT.md:42, 04-CONTEXT.md:57 | `client.*` 在被移集合内 **0** 命中；基准见 `04-CONTEXT.md:42`（D-12：`client.*` 属本阶段需处理内容）与 `04-CONTEXT.md:57`（D-23：不使用 `client` / `state` 全局单例，适用新增/后续改动）；本步零代码改动 | **只报告**；不得由此提出 `client.*` 的清退方案 | 高 |
| #04-10-E-05 [证据行] | `packages/` 与 `src/` 的对照扫描 | `packages/` 与 `src/` 对 `render/components` / `render/elements` / `render/map` **零命中**（核对命令 `git grep -n -F "render/components"` / `-F "render/elements"` / `-F "render/map"`，同限 `packages` 与 `src`，三条均无输出、退出码 1）；`packages-user` 内唯一命中为 `packages-user/client-modules/src/fallback/ui.ts:2` | packages-user/client-modules/src/fallback/ui.ts:2, 04-CONTEXT.md:72 | 对照扫描结论：`packages/` 与 `src/` 零命中；基准见 `04-CONTEXT.md:72`（D-33：范围外一律不改） | **只报告**，不提修改建议 | 高 |
| #04-10-E-06 | `render/elements/cache.ts` 的 legacy 贴图路径现状 | packages-user/client-modules/src/render/elements/cache.ts:11, packages-user/client-modules/src/render/elements/cache.ts:87, packages-user/client-modules/src/render/elements/cache.ts:89, packages-user/client-modules/src/render/elements/cache.ts:151, packages-user/client-modules/src/render/elements/cache.ts:202, packages-user/client-modules/src/render/elements/cache.ts:393, packages-user/client-modules/src/render/elements/cache.ts:469 | 04-CONTEXT.md:75, .planning/phases/04-render-adaptation/04-07-SUMMARY.md:174 | `cache.ts` 残存的 legacy 贴图访问点（`core.material.images...` 形态，均属 `core.*` 命中面）：`:11`（`core.material.images[img]`）、`:87`（`core.material.images.tilesets`）、`:89`（`core.material.images.images`）、`:151` / `:202`（`core.material.images[...]`）、`:393` / `:469`（`core.material.images.autotile`）；实测**无** `bigImage` / `big-image` 残留（对照 04-06 / 04-07 的 big-image 清退面）。基准见 `04-CONTEXT.md:75`（D-36）与 `04-07-SUMMARY.md:174`（big-image 清退的运行时影响记录） | **只报告，不登记为待办**（D-55） | 高 |

**E 类小结：** 覆盖 `core.*` 逐文件汇总（30 处，E-02）、全局 `loading` + `Mota.require('@user/data-base')`（E-03）、`client.*` 0 命中机器证据（E-04）、`packages/` 与 `src/` 对照扫描（E-05）、`elements/cache.ts` legacy 贴图路径现状（E-06）与 `layout.ts` 零命中证据（E-01）。全节**只报告**，无任何修复性措辞。

## F 未能从阅读确定（未猜测）

本节逐条登记静态阅读**无法定论**项，只登记、不判定。**不得把本节任何一条写成错配、缺失、残留或待办。**

- **#04-10-F-01**：目标文件名未确定。现象：D-53 只定「`layout.ts` 单独开 `layout/` 文件夹」，未定文件是 `client-base/src/layout/layout.ts` 还是 `client-base/src/layout/index.ts`；同样 `client-base/src/{components,elements,map}/index.ts` 是否沿用同名 barrel 亦未定。为什么读不出来：命名属设计裁定，非代码事实。需要用户裁决的点：**命名须先向用户反馈并获同意后才可使用**（AGENTS.md）。
- **#04-10-F-02**：`render/utils/index.ts` 在 `layout.ts` 移出后的归属。现象：D-54 明示 `utils/index.ts` **不移植**，但其 `export * from './layout'`（`render/utils/index.ts:1`）在 `layout.ts` 移出后即成断链。为什么读不出来：该 barrel 的保留 / 改指 / 删除属第二步方案。需要用户裁决的点：断链处置。
- **#04-10-F-03**：`client-base/src/index.ts` 是否新增 `export * from './{components,elements,map,layout}'`，以及 `render/index.tsx:45,46` 的断链如何补位。现象：目标侧 barrel 现状（`client-base/src/index.ts:1-3`）不含被移目录；`render/index.tsx:45` / `:46` 移出后断链。为什么读不出来：导出面是否扩张 / 收窄的裁定权在用户。需要用户裁决的点：是否新增导出与补位方式。
- **#04-10-F-04**：被移集合对留在 `client-modules` 的 `shared.ts` / `render/renderer` / `render/use.ts` / `render/utils` 的依赖如何解耦。现象：D-02..D-05 已登记 13 处反向依赖候选。为什么读不出来：解耦方式（下沉 / 抽类型 / 保留跨包依赖等）属设计裁定，本步禁止自拟方案。需要用户裁决的点：解耦方向；是否必然成环静态阅读不能判定。
- **#04-10-F-05**：`@user/client-base` 自包引用的改写方式。现象：D-06 登记 5 处；移入后成为包内自引。为什么读不出来：改写属第二步 import 重写方案。需要用户裁决的点：改写目标路径。
- **#04-10-F-06**：`client-base/package.json` 的依赖缺口是否在第二步补齐。现象：D-07 登记缺口（缺 `@motajs/render-vue` / `@motajs/system` / `@motajs/common` / `@user/data-common`）。为什么读不出来：D-37 有先例但本步不裁定。需要用户裁决的点：是否补齐及如何补齐。
- **#04-10-F-07**：shader `?raw` 在 `client-base` 构建链下是否仍可用。现象：D-09 登记 `render/map/renderer.ts:43-46` 的 4 个 `?raw` 导入。为什么读不出来：`?raw` 由构建链处理，换包后是否仍被处理属构建配置事实。需要用户裁决的点：构建链是否需调整。
- **#04-10-F-08**：`packages/legacy-ui` 经 `Mota.require('@user/client-modules')` 运行时取 `mainRenderer` / `client` 的插件面影响。现象：B-08 登记 `packages/legacy-ui/src/preset/ui.ts:96` / `:105`。为什么读不出来：legacy 插件面按 D-55 / D-49 只登记、不考虑。需要用户裁决的点：是否纳入考虑（legacy，只登记）。
- **#04-10-F-09**：`render/elements/index.ts` 的 `createElements()` 注册点（`mainRenderer.registerElement(...)` / `tagManager.registerTag(...)`）在 `client-base` 无渲染器实例时如何接线。现象：`createElements()`（`elements/index.ts:7`）依赖 `render/renderer.ts:35` 的 `mainRenderer` 与 `renderer.ts:45` 的 `tagManager`（交叉引用 A-04 / C-03）。为什么读不出来：接线方式属第二步方案。需要用户裁决的点：注册时序与实例来源。
- **#04-10-F-10**：`render/index.tsx` 的装配链（`createRender()` 调用 `createElements()` / `createUI()` / `createAction()` / `createWeather()`）在移植后归 `client-modules` 还是 `client-base` 未裁定。现象：`render/index.tsx:31-43` 为装配点，其中 `createElements()`（`index.tsx:32`）来自被移集合。为什么读不出来：装配点归属属设计裁定。需要用户裁决的点：装配链归属与调用时序。

## 处置

- 本文件是渲染端结构性重构（D-51 / D-57）**第一步（只读清点）**的交付物。本步**未修改任何生产代码、未引入任何命名变更**，`files_modified` 仅本文件；相对 `## 方法` 记录的只读起始基线**零变化**（当日实测为空）。
- **第二步（移植实施）未规划**，待用户审阅本文件后另行规划（D-57）。本文件不含移植方案、不含 import 重写方案、不产出任何新 `*-PLAN.md`。
- 被查范围 = 移植集合 **39** 文件与其全部 importer（含其它 monorepo 包的间接依赖）；`packages/` 与 `src/` 仅报告（D-33）。
- **A / B 是事实层**（内部交叉引用 / 外部导入点）；**C 是 barrel 与导出面事实 + 断链判定**；**D 是风险登记（解耦方案由用户裁定）**；**E 类按 D-55 只报告、不修、不登记为待办**；**F 类须用户裁决**。
- **全部命名问题归用户**（AGENTS.md）——`client-base/src/{components,elements,map,layout}` 下的文件名与 barrel 名一律进 F 类，须先向用户反馈并获同意后才可使用。
- 第二步的候选工作集 = B 类外部导入点 + C 类的断链点 + D 类的解耦面 + F 类的裁决项（最终纳入范围由用户裁定）。
- `REND-01` / `REND-02` 保持 **Pending**——本步只清点结构性重构（分层纠正）的影响面，既未实施移植，也未实施渲染端接口适配与移动端 / 桌面端双布局。
- **与规划日数值的差异说明：** 被移集合当日实测 **39** 文件（`components` 13 / `elements` 5 / `map` 20 / `utils/layout.ts` 1），与规划日一致；A 类 **9** 行（含 8 方向 + `layout.ts` 切片 + 零命中证据行，覆盖 8 个方向）、B 类 **9** 行（含 8 个外部导入点文件族 + 3 个间接依赖包 + 对照扫描证据行）、C 类 **8** 行（7 个 barrel 节点 + `layout.ts` 切片节点）、D 类 **10** 行、E 类 **6** 行、F 类 **10** 条。规划日实测口径（A 8 方向 / B 8 文件族 + 3 包 / C 7 节点 / D 9 条 / E 8 文件 / F ≥9）与当日实测在**事实集合**上一致；行数差异源于本文件把 `layout.ts` 端到端切片与五条证据行单列成行（规划日表为汇总口径），非新增或缺失事实。规划日 porcelain 基线为单条 ` M packages-user/data-base/src/enemy/types.ts`，当日实测为空——用户在规划与执行之间提交了 `47e71b5 refactor: EnemyManager`（数据端），其并发改动已落地；本 run 未触碰用户任何改动。

