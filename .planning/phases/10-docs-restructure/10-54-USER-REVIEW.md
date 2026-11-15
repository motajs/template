# UI 通用模板页用户修订记录

## 第 1 轮（2026-11-02，已执行）

**用户意见（核心）：** `docs/advanced/ii/ui/ui-template.md` 定位是**纯模板页**：只告诉读者每次写 UI 时复制模板、直接在 `container` 里写内容；不要把 import、props、`open`、`GameUI`、TS 写法、改哪几行、运行效果、边界等讲解塞进这一页。

| #    | 用户意见                                                                                                                             | 落点                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| U-01 | 删除「安装、启动、文档站与别名规则不在本篇重复，见仓库根目录的 `dev.md` 与中级『源码导览』」这句话；不重复讲，也不要提醒「之前讲过」 | `ui-template.md` 全文 |
| U-02 | 改为纯模板页：只保留一句使用说明 + 下方模板代码；删除所有讲解、TS 对照、只改哪几行、运行效果、边界等内容                             | `ui-template.md` 全文 |

**状态：已执行（2026-11-02）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-template.md`；未改代码、配置、状态文件，未写 SUMMARY。
- U-01：全文已无「不在本篇重复 / 见 `dev.md` 与源码导览」一类句子。
- U-02：页面重写为单 H1「UI 通用模板」+ 一句使用说明「写 UI 时，复制下面的模板，直接在 `container` 里写内容即可。」+ 用户给定的模板代码（逐字保留行内注释）。删除「一个最小 UI」「渲染树」「事件」「组件、元素与打开方式」「两条写法怎么选」「只改哪几行」「打开与关闭」「运行效果」「边界与注意」等全部讲解段、TS 对照代码、demo 与表格。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 2 轮（2026-11-02，已执行）

**用户意见（核心）：** 上一版按 U-02 重写时误删了「模板放哪、UI 在哪写、怎么复制」的说明；本页应是描述性文档，不是纯代码块，也不是完整教程。

| #    | 用户意见                                                                                                                                                                                                                                                                              | 落点                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| U-03 | 保留纯模板，但补回最小描述性说明：模板放到 `src/client/ui/` 下的 `.tsx` 文件、把组件/参数/UI 导出名换成自己的名字、UI 内容写在 `<container>` 里、写完后在 `src/client/ui/index.ts` 导出；不要重新加 import / props / `open` / `GameUI` / TS 对照 / 只改哪几行 / 运行效果 / 边界等内容 | `ui-template.md` 全文 |

**状态：已执行（2026-11-02）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-template.md`；未改代码、配置、状态文件，未写 SUMMARY，未 commit。
- U-03：页面保持单 H1「UI 通用模板」+ 一段最小说明（复制到 `src/client/ui/` 下的 `.tsx` 文件、改 `MyPanel` / `myPanelProps` / `MyPanelUI` 名字、UI 内容写进 `<container>`、在 `src/client/ui/index.ts` 导出）+ 用户给定的模板代码（逐字使用，保留行内注释）；未重新加入 import / props / `open` / `GameUI` / TS 对照 / 只改哪几行 / 运行效果 / 边界等讲解。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 3 轮（2026-11-02，已执行）

**用户意见（核心）：** 不是只要一个代码块；模板后要有独立章节说明怎么用，并链接后续文档形成小目录。

| #    | 用户意见                                                                                                                                         | 落点                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| U-04 | 模板后单独开「怎么用这个模板」一节讲必要步骤，并加「接着读」小目录链接后续文档；不要加 import / props / `open` / `GameUI` / TS 对照 / 边界等解释 | `ui-template.md` 全文 |

**状态：已执行（2026-11-02）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-template.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改代码、配置、状态文件，未写 SUMMARY，未 commit。
- U-04：保留单 H1「UI 通用模板」+ 一句「写 UI 时从这段模板开始。」+ 用户给定的模板代码（逐字使用，保留行内注释）；新增 `## 怎么用这个模板`（复制到 `src/client/ui/` 下的 `.tsx` 文件、改 `MyPanel` / `myPanelProps` / `MyPanelUI` 名字、在 `<container>` 里写 UI 内容、在 `src/client/ui/index.ts` 导出 `MyPanelUI`）与 `## 接着读` 小目录，链接到容器与坐标、基础图形、曲线与路径、文字、图片与最小纹理、响应式、事件与交互、props、组件（TSX）、UIController 与 UI 栈、示例（一）目标与骨架；未加入 import / props / `open` / `GameUI` / TS 对照 / 只改哪几行 / 运行效果 / 边界等解释。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 4 轮（2026-11-02，已执行）

**用户意见（核心）：** 在细讲元素前，先简单讲如何打开 UI、TSX 基本写法、渲染树基本模型；不必长篇大论，讲到能大致理解即可。

| #    | 用户意见                                                                                 | 落点                                                                                 |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| U-05 | 在 `ui-template.md` 之后、元素篇之前新增 UI 入门（打开、TSX 与渲染树），接入侧边栏与导览 | 新增 `docs/advanced/ii/ui/ui-basics.md`；`ui-template.md`、`ii/index.md`、侧边栏配置 |

**状态：已执行（2026-11-02）**

### 执行记录

- 新增 `docs/advanced/ii/ui/ui-basics.md`：单 H1，含「打开 UI」「TSX 基本写法」「渲染树的基本模型」「接下来」四节；约 80 行，含一张 `flowchart TD` 渲染树图。
- 侧边栏在 `UI 通用模板（TSX）` 之后新增 `UI 入门：打开、TSX 与渲染树` → `/advanced/ii/ui/ui-basics`。
- `ui-template.md` 的「接着读」第一项改为「先读 [UI 入门：打开、TSX 与渲染树](./ui-basics.md)」，其余链接保留。
- `docs/advanced/ii/index.md` 的子分组计数由 25 篇改为 26 篇，并在入口句中补上 UI 入门链接；`docs/advanced/index.md` 无计数，未改。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。
- 仅修改上述文档与侧边栏配置；未改代码、未 commit。

## 第 5 轮（2026-11-02，已执行）

**用户意见（核心）：** 现有 UI 入门页内容太少、没有示例和 live，也没有分步教学；TSX 部分不要提前讲循环与条件；渲染树不要画图和提容器抽象 / `zIndex`，要用模板示例讲清楚 `container` 与子元素的分工；自定义 UI 分组默认折叠，避免几十篇文档占目录。

| #    | 用户意见                                                                                                                                                                                                                   | 落点                                                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| U-06 | 重写 `ui-basics.md` 为教学向、带分步示例与 live demo；TSX 只讲标签 / 属性 / 表达式 / 嵌套 / 组件，循环与条件链接到后续；用模板讲渲染树，不画图、不提 `zIndex`；逐步教 `text` 与 `g-rect`；「自定义 UI 与渲染」分组默认折叠 | `docs/advanced/ii/ui/ui-basics.md`、新增 `docs/.vitepress/components/demos/ui/basics-demo.tsx`、`docs/.vitepress/config.ts` |

**状态：已执行（2026-11-02）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-basics.md`、新增 `docs/.vitepress/components/demos/ui/basics-demo.tsx`、`docs/.vitepress/config.ts` 的「自定义 UI 与渲染」分组与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `ui-basics.md` 重写为单 H1 + 八节：打开 UI（保留原有最小说明）、TSX 里的标签和组件（只讲标签 / 属性 / 表达式 / 嵌套 / 组件，条件与循环仅给后续链接）、渲染树的基本模型（用 `<container loc={FULL_LOC}>` 模板讲 `container` 与子元素分工，无 mermaid、无 `zIndex`）、先写一行字、再画一个矩形、合起来、运行效果、接下来；全文不使用条件 / 循环代码。
- 新增 `basics-demo.tsx`：480×320 `container` 内放 `text`（`loc={[24, 24]}`、`text="你好，UI"`、`fillStyle="#e8f0ff"`）与 `g-rect`（`loc={[24, 64, 160, 80]}`、`fillStyle="#2f6fed"`），只加两处说明性注释。
- 文档与 demo 的矩形都补了 `fill`：渲染元素默认是描边模式，只写 `fillStyle` 不会显示填充色；补 `fill` 后才能看到蓝色矩形，与「画矩形」的教学目标一致。
- 侧边栏「自定义 UI 与渲染」分组 `collapsed` 由 `false` 改为 `true`，其内部 Part 未动。
- 计数变化：文档篇数不变（26 篇）；新增 1 个 demo，demo 总数由 24 变为 25。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 6 轮（2026-11-02，已执行）

**用户意见（核心）：** `ui-basics.md` 的「合起来」不能写普通 Vue 的 `defineComponent(() => ...)`，必须使用与 `ui-template.md` 一致的标准 UI 模板；live 前要说明用 `props.controller.open(MyPanelUI, {})` 打开后的效果。

| #    | 用户意见                                                                                                                                                                                                                                  | 落点           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| U-07 | 「合起来」代码块替换为标准 UI 模板（imports、`MyPanelProps`、`myPanelProps`、`defineComponent<MyPanelProps>(props => ..., myPanelProps)`、`new GameUI`）；代码块后、live 前补一句 `props.controller.open(MyPanelUI, {})` 打开后的效果说明 | `ui-basics.md` |

**状态：已执行（2026-11-02）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-basics.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它文件，未 commit。
- U-07：「合起来」代码块逐字替换为与 `ui-template.md` 一致的标准模板，`container` 内保留「先写一行字 / 再画矩形」两段内容；删除「这段代码就是下面 live demo 的完整内容」表述，改为「在已有 UI 中使用 `props.controller.open(MyPanelUI, {})` 打开后，效果就是下面这样」，并保留元素叠放顺序说明。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 7 轮（2026-11-02，已执行）

**用户意见（核心）：** 从「起步」到后面元素篇跨度过大，需要一篇过渡文档，教容器、文字、图片、几个简单图形与简单相对坐标 / 层级，最终能写一个简单静态界面。

| #    | 用户意见                                                                                                                                                                                                                   | 落点                                                                                                                                |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| U-08 | 在「起步」新增基础渲染元素教学页，逐步教容器、文字、图片（从 `props.state.materials` 取，不要现场 `new Texture`）、简单图形、简单相对坐标 / 层级，最后用标准 UI 模板拼出一个静态界面；新增 live demo，接入侧边栏与导览计数 | 新增 `docs/advanced/ii/ui/first-static-ui.md`、`docs/.vitepress/components/demos/ui/static-ui-demo.tsx`；`config.ts`、`ii/index.md` |

**状态：已执行（2026-11-02）**

### 执行记录

- 新增 `docs/advanced/ii/ui/first-static-ui.md`：单 H1「写一个静态界面：容器、文字、图片与图形」，含「先放容器」「加文字」「加矩形和圆」「加一条线」「从素材管理器取图片」「相对坐标与层级」「完整模板」「运行效果」「接下来」九节；以 480×320 小面板（深色底、标题、图标、矩形、圆、分隔线、角标）为目标，逐步添加元素。
- 图片统一使用 `const icon = props.state.materials.getImageByAlias('potion-red');` 与 `<image image={icon} loc={[24, 184, 64, 64]} />`；明确「不要在现场 `new Texture`」、取不到为 `null` 时 `image` 不画，不展开素材系统。
- 「完整模板」使用与 `ui-template.md` 一致的标准模板（imports、`MyPanelProps`、`myPanelProps`、`defineComponent<MyPanelProps>(props => ..., myPanelProps)`、`new GameUI`），`container` 内包含上述全部元素与角标 `zIndex`。
- 新增 `static-ui-demo.tsx`：容器、背景 `g-rect`、标题 `text`、`g-rect`、`g-circle`、`g-line` 与角标 `g-rect` / `text`（`zIndex` 2 / 3），不含图片，含少量说明性注释。
- 侧边栏在「起步」分组 `UI 入门：打开、TSX 与渲染树` 之后新增 `第一个静态界面：容器、文字、图片与图形` → `/advanced/ii/ui/first-static-ui`。
- 计数变化：文档篇数由 26 变为 27；新增 1 个 demo，demo 总数由 25 变为 26。`docs/advanced/index.md` 无计数，未改。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。
- 仅修改上述文档、demo、侧边栏配置与本记录；未改其它正文 / demo / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。

## 第 8 轮（2026-11-02，已执行）

**用户意见（核心）：** `UI 入门：打开、TSX 与渲染树` 和 `第一个静态界面：容器、文字、图片与图形` 在目录一行显示不下，缩到 12 字以内。

| #    | 用户意见                                                                                             | 落点                                                                               |
| ---- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| U-09 | 两个新页标题过长，目录一行显示不下；缩短为 `UI 入门`、`第一个静态界面`，并同步侧边栏、导览与链接文字 | `ui-basics.md`、`first-static-ui.md`、`config.ts`、`ui-template.md`、`ii/index.md` |

**状态：已执行（2026-11-02）**

### 执行记录

- 标题改为 `# UI 入门`（原 `# UI 入门：打开、TSX 与渲染树`）、`# 第一个静态界面`（原 `# 写一个静态界面：容器、文字、图片与图形`），均为 4 字 / 7 字，满足 12 字以内。
- 同步 `docs/.vitepress/config.ts` 侧边栏两条 `text`、`docs/advanced/ii/ui/ui-template.md` 的「接着读」链接文字、`docs/advanced/ii/index.md` 导览中的两处链接文字。
- 文件路径不变（`ui-basics.md` / `first-static-ui.md`），页面 slug 与正文语义未改；全文检索确认标题与链接文字无旧长标题残留。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。
- 仅修改上述文档、侧边栏配置与本记录；未改其它正文 / demo / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。

## 第 10 轮（2026-11-02，已执行）

**用户意见（核心）：** 整屏 UI 必须用引擎的 `FULL_LOC`，480×320 只是文档 live 预览的尺寸，不是游戏画布；`ui-basics.md`、`first-static-ui.md` 里用 480×320 写整屏容器/背景的地方要改掉。

| #    | 用户意见                                                                                                                               | 落点                                         |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| U-10 | 整屏容器/背景改用 `FULL_LOC`；live 的 480×320 标注为预览尺寸，不是游戏画布；`ui-template.md` 已是 `FULL_LOC`，不动；其余未审阅文档不改 | `ui-basics.md`、`first-static-ui.md`；本记录 |

**状态：已执行（2026-11-02）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-basics.md`、`docs/advanced/ii/ui/first-static-ui.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 `ui-template.md`、其它未审阅页面、demo 尺寸、代码、配置、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `ui-basics.md`：「组件」示例的顶层 `container` 由 `loc={[0, 0, 480, 320]}` 改为 `loc={FULL_LOC}`，并只加一句「`FULL_LOC` 来自标准模板的 import」；live 前补一句「下面 live 的 480×320 是预览尺寸，不是游戏画布」。
- `first-static-ui.md`：开篇改为「从头拼一个静态界面」，并说明整屏 UI 用引擎给出的 `FULL_LOC`、不需要自己写 480×320；「先放容器」的 `container` 与背景 `g-rect` 的 `loc` 改为 `FULL_LOC`，对应说明改为「`FULL_LOC` 是引擎给出的整屏位置」「现在得到一块铺满整屏的深色区域」；「完整模板」的背景 `g-rect` 改为 `loc={FULL_LOC}`；「`FULL_LOC` 是整块画布……这一篇按 480×320 的画布举例」改为「live 的 480×320 只是预览，实际画布由 `FULL_LOC` 决定」；live 段首明确「live 的 480×320 是预览尺寸，不是游戏画布尺寸」。
- demo 仍按 480×320 预览，未改 demo 文件。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 11 轮（2026-11-02，已执行）

**用户意见（核心）：** `g-rect` / `g-circle` 默认就是填充、`g-line` 默认就是描边，文档不要再多写 `fill` / `stroke`；`g-circle` 用简写 `circle={[x, y, radius]}`；图片统一用带后缀的 `bg.jpg`；删除「不要现场 new Texture」「文档站没有素材所以不画图」等修复说明与元叙述；`zIndex` 在 live 中用重叠矩形做对比，删掉运行效果下方那段「live 480×320……图片……不画图」的说明（D-97：文档不写修复说明/元叙述）。

| #    | 用户意见                                                                                                                                                                                               | 落点                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| U-11 | `g-rect` / `g-circle` 删除 `fill`，`g-line` 删除 `stroke`，只保留必要参数；`g-circle` 改 `circle={[x, y, radius]}`；图片用 `bg.jpg`；删除修复说明与元叙述；`zIndex` 改用两块重叠矩形对比并删掉末段说明 | `ui-basics.md`、`first-static-ui.md`、`static-ui-demo.tsx` |

**状态：已执行（2026-11-02）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-basics.md`、`docs/advanced/ii/ui/first-static-ui.md`、`docs/.vitepress/components/demos/ui/static-ui-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `ui-basics.md`：4 处 `g-rect` 删除 `fill`；「`fill` 表示填充这个矩形 / `fillStyle` 是填充颜色」合并为「矩形默认填充，`fillStyle` 是填充颜色」。本篇无图片、无 `g-circle`、无 `zIndex`，其余未动。
- `first-static-ui.md`：开头与「先放容器」删除「不需要自己写 480×320」类元叙述，保留 `FULL_LOC` 标准说明；所有 `g-rect` 删除 `fill`，背景矩形用 `FULL_LOC`；`g-circle` 改为 `circle={[280, 96, 32]}`，说明改为「圆用 `circle={[圆心x, 圆心y, 半径]}`；默认填充，`fillStyle` 给颜色」；`g-line` 删除 `stroke`，说明改为「线默认描边，`strokeStyle` 是颜色」；图片改为 `getImageByAlias('bg.jpg')`，删除「图标不要自己加载图片文件 / 不要现场 `new Texture` / 不要拿 `null` 自己造图」等元叙述，只保留标准取法与 `image` 用法；`zIndex` 段改为两块重叠矩形（第一个 `zIndex={2}`、第二个默认），并说明「第二个后写，但重叠处第一个在上面」；完整模板同步以上全部改动；删除运行效果下方「live 的 480×320 是预览尺寸……图片需要 `props.state.materials`……所以这里不画图」整段。
- `static-ui-demo.tsx`：删除 `fill` / `stroke`；`g-circle` 改 `circle={[280, 96, 32]}`；角标替换为同一组重叠矩形（含 `zIndex`），注释改为层级说明，live 可直接看出叠放关系。
- 已核对源码默认行为：`GraphicItemBase` 默认 `mode = Fill`，`Line` 默认 `mode = Stroke`，`Circle.handleProps` 支持 `circle` 简写。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 12 轮（2026-11-02，已执行）

**用户意见（核心）：** live 只展示效果，不需要和真实画布一一对应；删除已审阅文档中所有「live 的 480×320 是预览 / 不是游戏画布」一类说明。

| #    | 用户意见                                                                                                  | 落点                                         |
| ---- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| U-12 | 删除「live 的 480×320 是预览尺寸，不是游戏画布」等说明；live 只展示效果；只改已审阅文档，不解释 live 尺寸 | `ui-basics.md`、`first-static-ui.md`；本记录 |

**状态：已执行（2026-11-02）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-basics.md`、`docs/advanced/ii/ui/first-static-ui.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 `ui-template.md`、其它未审阅页面、demo、代码、配置、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `ui-basics.md`：删除「下面 live 的 480×320 是预览尺寸，不是游戏画布。」整句；live 的 `ClientOnly` / `RenderDemo` 保留，正文不再解释 live 尺寸。
- `first-static-ui.md`：「完整模板」后的说明改为「`FULL_LOC` 是整块画布的位置；在已有 UI 中使用 `props.controller.open(MyPanelUI, {})` 打开后，看到的就是这块面板。」，不再提 live 尺寸。
- 全文检索已审阅三页，确认不再出现「live 的 480 / 预览尺寸 / 不是游戏画布」一类说明；`RenderDemo :width` / `:height` 保留，正文不解释。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 13 轮（2026-11-02，已执行）

**用户意见（核心）：** `container-and-coordinates.md` 文档之间没有过渡，开头没有说明上一篇讲了什么、这一篇拓展什么；内容分配不合理，从上往下读难懂，需要重新分配章节。

| #    | 用户意见                                                                                                                                 | 落点                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| U-13 | 增加与上一篇《第一个静态界面》之间的过渡段；重排章节，让坐标、`loc` / 锚点、嵌套、渲染树、画布、变换、事件、生命周期、层级的阅读顺序连贯 | `container-and-coordinates.md`、`container-demo.tsx`；本记录 |

**状态：已执行（2026-11-02）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/container-and-coordinates.md`、`docs/.vitepress/components/demos/ui/container-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- 开头新增过渡段：说明上一篇《第一个静态界面》已用容器、文字与图形拼出静态界面，本篇展开坐标原点、`loc` 与锚点、嵌套后的相对坐标、父级变换、事件路径、画布尺寸与层级；读完能判断元素为什么在当前位置、容器怎么套。
- 章节重排为：`坐标从哪里来` → `loc 与锚点` → `嵌套：局部坐标系` → `容器在渲染树里的位置` → `画布的设计尺寸` → `父级的变换如何传递` → `事件在嵌套容器中的路径` → `生命周期与缓存` → `层级` → `运行效果` → `边界与注意`。原先散落在「坐标与变换如何沿树传递」「坐标基准与画布」「一个嵌套示例」中的锚点、默认尺寸、画布说明已按主题合并，后文不再重复。
- 渲染树从原第一位置移到嵌套示例之后，保留一张 `flowchart TD`（画布根 → UI 容器 → 面板根容器 `FULL_LOC` → 区域 → 元素），说明容器三个职责与 TSX 嵌套 / `appendChild` 两种父子建立方式；删除「唯一权威」等元叙述。
- 嵌套示例的整屏根容器与根背景由 `[0, 0, 480, 320]` 改为 `FULL_LOC`；元素层只保留一个 `appendChild` 片段，不再 `new` 根容器，明确 `root` 由渲染器或上层提供。
- 删除「本篇示例画布是 480×320」等表述；`画布的设计尺寸` 一节说明画布由 `props.state.renderer.width` / `height` 决定，并注明示例中的 480 / 320 是面板自身设计尺寸，不是画布尺寸。
- 按 U-11 规则删除 `g-rect` 上不必要的 `fill`；需要描边的边界矩形保留 `stroke`；`container-demo.tsx` 同步删除 `fill`，仍以 480×320 作 live 预览，正文不解释 live 尺寸。
- 不写修复说明与元叙述，未新增 live 尺寸说明。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 14 轮（2026-11-03，已执行）

**用户意见（核心）：** 当前 `container-and-coordinates.md` 不是给刚看完起步三篇的人看的：讲了太多后面才该讲的概念，该讲的一笔带过；live 太少；`FULL_LOC` 来源不该讲；「画布设计尺寸」「渲染树位置」看不懂；TS 代码不应突然出现、不应教接口 / `appendChild`；变换没讲就讲传递；事件 / 生命周期 / 缓存太早；层级后的 live 不知道对应什么。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                               | 落点                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| U-14 | 按 U-14 重写 `container-and-coordinates.md`：只讲坐标与容器，加文档过渡，为 `loc` / 锚点和嵌套各加 live；删除画布尺寸、渲染树、父级变换、事件、生命周期 / 缓存、层级和 TS 代码；同步 demo 与 `10-54-USER-REVIEW.md`。开头说明上一篇已拼出静态界面、这一篇只讲坐标原点、`loc` 与锚点、嵌套相对坐标；`FULL_LOC` 直接用、不解释来源；TS 只保留 TSX 片段。 | `container-and-coordinates.md`、`anchor-demo.tsx`、`container-demo.tsx`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/container-and-coordinates.md`、新增 `docs/.vitepress/components/demos/ui/anchor-demo.tsx`、改写 `docs/.vitepress/components/demos/ui/container-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `container-and-coordinates.md` 重写为四节：开头过渡段说明上一篇《第一个静态界面》已用容器、文字与图形拼出静态界面，本篇只讲坐标原点、`loc` 与锚点、嵌套后的相对坐标，事件 / 变换 / 缓存 / 层级留到后面；`## 坐标从哪里来` 用根容器左上角为原点、子元素坐标相对父容器、嵌套逐层平移，配一个 `container + text + g-rect` 的最小 TSX 片段；`## loc 与锚点` 讲六元组顺序、拆成同名属性、`anc` 简写、默认 200×200、锚点含义、矩形 / 容器默认 0 与圆 / 椭圆默认 0.5、每对整对省略，并加 live 1（同一局部坐标 `(110, 70)` 下 4 个矩形对比锚点 `0, 0`、`0.5, 0.5`、`1, 1` 与更大尺寸）；`## 嵌套：局部坐标系` 讲父容器 / 子容器、子元素坐标相对父容器、移动父容器子元素跟随，配短 TSX 片段，并加 live 2（父容器 / 子容器 + 两个原点圆点）；`## 边界与注意` 只保留默认 200×200、锚点不是整体平移、坐标相对父容器、0×0 / 过小容器可能看得见但点不到四条；结尾过渡到《基础图形》。
- 删除「容器在渲染树里的位置」「画布的设计尺寸」「父级的变换如何传递」「事件在嵌套容器中的路径」「生命周期与缓存」「层级」整节，以及全部 `new Container` / `appendChild` / TS 接口代码；整屏容器直接用 `loc={FULL_LOC}`，不解释 `FULL_LOC` 来源；未写 live 尺寸说明与修复说明。
- `anchor-demo.tsx`：4 个矩形分别用同一局部坐标 `(110, 70)`、锚点 `0, 0` / `0.5, 0.5` / `1, 1` 与更大尺寸，配 `text` 标签与 `g-circle circle={[110, 70, 6]}` 锚点圆点；图形默认填充，未写多余 `fill`。
- `container-demo.tsx`：父容器内含子容器，两个 `g-circle circle={[0, 0, 6]}` 原点圆点分别标出父 / 子容器左上角，用蓝 / 黄两色与「父容器原点」「子容器原点」文字区分；图形默认填充，未写多余 `fill`。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 15 轮（2026-11-03，已执行）

**用户意见（核心）：** 容器外的内容默认不可见；除非容器标记 `nocache`，那是渲染实现的特性，后续可能变动，不要依赖。当前「0×0 或过小容器可能让子元素看得见却点不到」是事实错误。

| #    | 用户意见                                                                                                                                                                                                 | 落点                                                      |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| U-15 | 删除「0×0 或过小的容器可能让子元素看得见、却点不到」；改为「容器外的内容默认不可见，需要显示的内容放在容器矩形内」与「`nocache` 可能让超出容器的内容显示，但这是渲染实现的特性，后续可能变动，不要依赖」 | `container-and-coordinates.md` 的 `## 边界与注意`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/container-and-coordinates.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面、demo、代码、配置、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 删除「0×0 或过小的容器可能让子元素看得见、却点不到」一条；`## 边界与注意` 改为「容器外的内容默认不可见；需要显示的内容要放在容器矩形内。」与「`nocache` 可能让超出容器的内容显示，但这是渲染实现的特性，后续可能变动，不要依赖。」两条。
- 全文检索 `container-and-coordinates.md`，确认不再出现「容器不裁剪 / 超出仍可见 / 0×0 / 看得见却点不到」一类说法；其它页面本次不改。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 16 轮（2026-11-03，已执行）

**用户意见（核心）：** 基础图形不要拆成两篇；`basic-shapes.md` 与 `curves-and-paths.md` 合并为一篇，讲全部 8 种图形；只讲用法、不给实现；重点讲简写，普通写法一笔带过；每个图形一个 live，最后一个全图形合放 live。

| #    | 用户意见                                                                                                                              | 落点                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| U-16 | 合并两篇为基础图形一篇；讲全部 8 种图形；只讲用法、不给实现；重点讲简写；每个图形一个 live；最后全图形合放 live；收口侧边栏/链接/计数 | `basic-shapes.md`、9 个新 demo、`curves-and-paths.md` 删除、`config.ts`、`ui-template.md`、`ii/index.md` |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/basic-shapes.md`、`docs/advanced/ii/ui/ui-template.md`、`docs/advanced/ii/index.md`、`docs/.vitepress/config.ts`、新增 9 个 demo、删除 `docs/advanced/ii/ui/curves-and-paths.md` 与旧 `shapes-demo.tsx` / `curves-demo.tsx`、追加本记录；未改其它正文 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `basic-shapes.md` 重写为单 H1 教学页：开头承接《容器与坐标》；按矩形、圆、椭圆、直线、三次贝塞尔、二次贝塞尔、路径、圆角矩形八节，每节先给数组简写、普通写法一句带过，再给 live；最后一节把 8 种图形放进 `container loc={FULL_LOC}` 并给完整 TSX；`默认值与注意` 只写默认填充 / 描边、默认色、`fill` 不是颜色、圆 / 椭圆锚点、`Path2D` 不能进存档、`curve` 数组长度、`g-rect` 无圆角；结尾过渡到《文字》。全文只讲用法，未写命中测试 / `actionStroke` / 缓存 / 渲染树 / 元素层 TS，未写 live 尺寸说明或修复说明。
- 新增 9 个 demo：`shapes-rect.tsx`、`shapes-circle.tsx`、`shapes-ellipse.tsx`、`shapes-line.tsx`、`shapes-bezier.tsx`、`shapes-quad.tsx`、`shapes-path.tsx`、`shapes-rectr.tsx`、`shapes-all.tsx`；均为 480×320 预览容器 + 深色背景 + 图形 + 简短标签，使用简写参数，默认模式不写多余 `fill` / `stroke`，`g-path` 在 setup 中 `new Path2D()`，`shapes-all` 放全部 8 种。
- 删除 `curves-and-paths.md` 及其侧边栏项；`ui-template.md` 的「接着读」只保留[基础图形](./basic-shapes.md)；`docs/advanced/ii/index.md` 的子分组计数由 27 篇改为 26 篇；全站检索确认无 `curves-and-paths` / `curves-demo` / `shapes-demo` 残留引用。
- 验证：`pnpm exec prettier --check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/shapes-*.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link，产物 `public/_docs/advanced/ii/ui` 下 26 个 HTML，无 `curves-and-paths.html`。

## 第 17 轮（2026-11-03，已执行）

**用户意见（核心）：** 一种图形只放一个图，读者看不出改参数后的差别；前面的单图形 live 要放好几组同种图形做对比，最后的整合图每种图形放一个就够。

| #    | 用户意见                                                                                                                                                      | 落点                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| U-17 | 8 个单图形 live 各放多组同种图形对比参数（3–4 组，圆另加两个同半径、不同圆心的圆），标签写关键参数；`shapes-all` 保持每种一个；每节 live 下补一句说明对比内容 | 8 个 demo、`basic-shapes.md`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 8 个单图形 demo（`shapes-rect.tsx`、`shapes-circle.tsx`、`shapes-ellipse.tsx`、`shapes-line.tsx`、`shapes-bezier.tsx`、`shapes-quad.tsx`、`shapes-path.tsx`、`shapes-rectr.tsx`）、`docs/advanced/ii/ui/basic-shapes.md` 每节 live 描述与本记录；未改 `shapes-all.tsx`、其它正文 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `shapes-rect.tsx`：四个矩形对比 `loc` 的位置与宽高（小、宽、高、大），标签写 `70×55` 等尺寸。
- `shapes-circle.tsx`：三个半径 `r=30` / `r=55` / `r=80` 的圆，加两个同半径、不同圆心的圆；标签写 `r=...` 与圆心坐标。
- `shapes-ellipse.tsx`：四个椭圆对比扁、宽、竖与较大，标签写 `rx` / `ry`。
- `shapes-line.tsx`：四条线对比细、粗、虚线与斜线，标签写 `lineWidth`、`lineDash`、端点与颜色差异。
- `shapes-bezier.tsx`：四条三次贝塞尔对比控制点靠近、拉远、左右交换与 S 形。
- `shapes-quad.tsx`：四条二次贝塞尔对比控制点在上、下、左、右。
- `shapes-path.tsx`：三个路径对比折线、闭合填充与圆弧；折线与圆弧用 `stroke`，闭合路径用默认填充。
- `shapes-rectr.tsx`：四个圆角矩形对比 `circle={[r]}`、`circle={[tl, tr, br, bl]}`、`ellipse={[...]}` 与大半径，标签写「1 项 / 4 项 / ellipse / 大半径」。
- `basic-shapes.md`：八个图形节的 live 下各补一句「这个 live 里放了……组参数，分别对比……」，只写对比内容，不写 live 尺寸或实现；`shapes-all` 一节与图形数量不变。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 8 个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 18 轮（2026-11-03，已执行）

**用户意见（核心）：** 贝塞尔应显示控制点小圆；开头先讲 `fill` / `stroke` / `fillStyle` / `strokeStyle`；元素讲太浅，要讲虚线、线宽、线接方式等通用属性；`g-path` live 文字重叠。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                 | 落点                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| U-18 | `basic-shapes.md` 开头先讲 `fill` / `stroke` / `fillStyle` / `strokeStyle` 规则，再讲元素；加深元素用法，补 `lineWidth` / `lineDash` / `lineDashOffset` / `lineCap` / `lineJoin` / `miterLimit` 等通用描边属性，并加一个描边对比 live；`g-bezier` 与 `g-quad` live 用白色小圆点标出控制点；修 `shapes-path.tsx` 文字重叠 | `basic-shapes.md`、新增 `shapes-stroke.tsx`、`shapes-bezier.tsx`、`shapes-quad.tsx`、`shapes-path.tsx`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/basic-shapes.md`、新增 `docs/.vitepress/components/demos/ui/shapes-stroke.tsx`、修改 `docs/.vitepress/components/demos/ui/shapes-bezier.tsx`、`shapes-quad.tsx`、`shapes-path.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 页面 / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `basic-shapes.md` 开头过渡后新增 `## 先讲通用规则：填充、描边与颜色`：说明 `fill` / `stroke` / `strokeAndFill` 是模式开关而不是颜色，颜色写在 `fillStyle` / `strokeStyle`；给出八种图形的默认填充 / 描边表；说明 `fill` + `stroke` 先填充后描边、`strokeAndFill` 优先级最高、`fillRule` 只对填充路径有意义、默认色 `#ddd`。
- 新增 `### 描边细节`：讲 `lineWidth`（默认 2）、`lineDash`（奇偶交替，例 `[18, 10]` / `[16, 6, 2, 6]`）、`lineDashOffset`、`lineCap`（只影响端点）、`lineJoin`（只影响拐角）、`miterLimit`（尖角限制），给组合代码与矩形虚线描边示例；新增 live `shapes-stroke.tsx`，四组对比线宽、虚线、端点与拐角；说明这些属性对所有描边图形通用。
- 新增 `## 所有图形通用的属性`：`alpha`、`zIndex`、`hidden`、`noevent`、`rotate`、`scale` 简表，不展开实现。
- 八节图形保留简写与对比 live，补充用法：`g-rect` 的六值 `loc` 锚点写法与无圆角；`g-circle` / `g-ellipse` 的 `[x, y, r, start, end]` 圆弧 / 部分椭圆与弧度说明；`g-line` 的虚线 / 端点示例；`g-bezier` / `g-quad` 的控制点影响；`g-path` 的开放描边、闭合填充、`fillRule`、复用与不可序列化；`g-rectr` 的 `circle` 1–4 项与 `ellipse` 2/4/6/8 项映射表和半径限制。
- `shapes-stroke.tsx`：480×320 深色背景，四组对比线宽 2/6/12、虚线 `[8,6]` / `[2,6]` / `[16,6,2,6]`、端点 butt/round/square、拐角用三条 V 形 `Path2D` + `lineJoin` miter/round/bevel；每组短标签，位置避开图形与其它文字。
- `shapes-bezier.tsx`：标题改为「三次贝塞尔：小圆点 = 控制点」，四条曲线各自的起点 / 终点之外的 8 个控制点用 `circle={[x, y, 4]}` 白色小圆标出；为避免控制点与标题重叠，第二条曲线的第一个控制点由 `(250, 30)` 调整为 `(250, 65)`；标签保持不重叠。
- `shapes-quad.tsx`：标题改为「二次贝塞尔：小圆点 = 控制点」，四条曲线各自的 4 个控制点用白色小圆标出；右侧「控制点在下」标签左移到 `(250, 155)`，避开控制点小圆。
- `shapes-path.tsx`：标签改为「折线」「闭合填充」「圆弧」，下移到 `y=285` 并拉开横向间距，避免与图形及其它文字重叠。
- 页面 `script setup` 增加 `strokeLoader`，描边 live 用 `RenderDemo` 渲染。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 相关 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 19 轮（2026-11-03，已执行）

**用户意见（核心）：** 有些 live 内容重叠（描边对比图）；圆要展示 `start` / `end`；贝塞尔示例要改，控制点显示出来太远；开头 `fill` / `stroke` / `strokeAndFill` 要有 live。

| #    | 用户意见                                                                                                                                                                                                                                                                          | 落点                                                                                                                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-19 | 开头 `fill` / `stroke` / `strokeAndFill` 增加 live；修 `shapes-stroke.tsx` 文字 / 图形重叠；圆元素 live 展示 `start` / `end`，椭圆也补 `start` / `end` 示例；贝塞尔曲线控制点用白色小圆 + 虚线引导线，控制点不要离曲线太远，二次贝塞尔同样；逐个检查 8 个元素 live 的文字重叠并修 | `basic-shapes.md`、新增 `shapes-modes.tsx`、`shapes-stroke.tsx`、`shapes-circle.tsx`、`shapes-ellipse.tsx`、`shapes-bezier.tsx`、`shapes-quad.tsx`、`shapes-line.tsx`、`shapes-rectr.tsx`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/basic-shapes.md`、新增 `docs/.vitepress/components/demos/ui/shapes-modes.tsx`、修改 `shapes-stroke.tsx`、`shapes-circle.tsx`、`shapes-ellipse.tsx`、`shapes-bezier.tsx`、`shapes-quad.tsx`、`shapes-line.tsx`、`shapes-rectr.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 页面 / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- 新增 `shapes-modes.tsx`：480×320 深色背景，四个同样大小的矩形分别使用 `fill`、`stroke`、`fill + stroke` 与 `strokeAndFill`；前两个用不同填充 / 描边颜色区分，后两个用相同颜色与线宽，对照描边和填充的先后顺序；标签放在矩形上方，不压图形。
- `basic-shapes.md`：通用规则代码后新增 `modesLoader` 的 `RenderDemo`，并补一句「同一个矩形分别用四种模式，对照看边框和填充。」；`script setup` 增加 `modesLoader`。
- `shapes-stroke.tsx`：线宽组线终点改到 `200`、标签移到 `x=214`，保留 `2` / `6` / `12`；虚线组标签移到 `x=240`、线起点改到 `340`、终点 `456`，`16,6,2,6` 标签与线之间留出明显间隔；端点组线起点改到 `105`、终点 `210`，标签仍在 `x=30`，`square` 端点不碰标签；拐角组保持 V 形与 `miter` / `round` / `bevel` 标签分离。
- `shapes-circle.tsx`：上排三个整圆对比 `r=30` / `55` / `80`；下排三个圆弧用 `circle={[x, y, r, start, end]}` + `stroke` 展示 `0→π`、`-π/2→π/2`、`0→1.5π`，标签写清 `start` / `end`；标签与圆 / 弧不重叠。
- `shapes-ellipse.tsx`：上排三个整椭圆对比 `rx` / `ry`；下排两个部分椭圆用 `ellipse={[x, y, rx, ry, start, end]}` + `stroke` 展示 `0→π` 与 `π→2π`，标签写清 `start` / `end`；标签不压形状。
- `shapes-bezier.tsx`：改为 2×2 四组曲线，控制点靠近曲线；每组用白色小圆标出 `cp1` / `cp2`，用细虚线 `g-line` 连起点 → `cp1` → `cp2` → 终点，曲线保持实线；标题写明「白点 = 控制点，虚线 = 控制多边形」，标签放在每组下方。
- `shapes-quad.tsx`：同样用白色小圆标出控制点，用细虚线 `g-line` 连起点 → 控制点 → 终点；控制点靠近曲线，标签分别写「控制点在上 / 下 / 左 / 右」且不重叠。
- 逐个检查 8 个元素 live：`shapes-rect.tsx` 与 `shapes-path.tsx` 无文字压图形或文字互相重叠，未改；`shapes-line.tsx` 斜线标签下移到 `y=254`；`shapes-rectr.tsx` 两排圆角矩形改为 `y=60` / `y=192`，标签改为 `y=163` / `y=294`，与图形留出间距。
- `basic-shapes.md` 的圆、椭圆、三次贝塞尔、二次贝塞尔 live 描述同步改为说明整圆 / 圆弧、整椭圆 / 部分椭圆、`start` / `end`、白点控制点与虚线控制多边形；不写实现与 live 尺寸。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 相关 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 20 轮（2026-11-03，已执行）

**用户意见（核心）：** 圆和椭圆调了 `start` / `end` 也可以写 `fill`，不要只给 `stroke` 示例；`start` / `end` 下面的文字看不懂，不如直接写多少度，并说明要按弧度算。

| #    | 用户意见                                                                                                                             | 落点                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| U-20 | 圆 / 椭圆 `start` / `end` 示例同时给默认填充与只描边两种写法；live 标签直接写度数；正文说明 `start` / `end` 单位是弧度并给出度数换算 | `basic-shapes.md`、`shapes-circle.tsx`、`shapes-ellipse.tsx`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/basic-shapes.md`、`docs/.vitepress/components/demos/ui/shapes-circle.tsx`、`docs/.vitepress/components/demos/ui/shapes-ellipse.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 页面 / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `shapes-circle.tsx`：下排三个圆弧改为默认填充，去掉 `stroke` / `strokeStyle` / `lineWidth`，只写 `fillStyle="#58c4dd"`；角度改为 `0 → π`、`π/2 → 1.5π`、`0 → 1.5π`，标签改为 `0° → 180°` / `90° → 270°` / `0° → 270°`。
- `shapes-ellipse.tsx`：下排两个部分椭圆改为默认填充，去掉 `stroke` / `strokeStyle` / `lineWidth`，只写 `fillStyle="#c58af9"`；标签改为 `0° → 180°` / `180° → 360°`。
- `basic-shapes.md`：圆与椭圆两节说明 `start` / `end` 的单位是弧度、`0` 指向右侧、角度增大沿顺时针方向，live 标签用度数只为好读；圆一节给出度数对照表（`0° = 0`、`90° = π/2`、`180° = π`、`270° = 1.5π`、`360° = 2π`）；说明默认填充时圆弧与两端连线围成的区域会被填充、只想看弧线时才写 `stroke`；两节代码示例同时给默认填充与只描边两种写法。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/shapes-circle.tsx docs/.vitepress/components/demos/ui/shapes-ellipse.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 21 轮（2026-11-03，已执行）

**用户意见（核心）：** 圆 / 椭圆的 `start` / `end` live 不要全 fill，也不要全 stroke；要 fill、stroke、fill+stroke 三种并存，正文同步说明三者。用户原话：“不要全 stroke，也没让你全换成 fill；不要要么 1 要么 0，九成要的是 0.5。” 按 D-99：默认保留原写法并加入新写法，给混合示例，不全量替换。

| #    | 用户意见                                                                                                                                                             | 落点                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| U-21 | 圆 / 椭圆 `start` / `end` live 改为 fill、stroke、fill+stroke 三种模式并存；正文并列说明默认填充、只描边、两者都要三种写法，代码示例给三种；不改其它 demo，不 commit | `basic-shapes.md`、`shapes-circle.tsx`、`shapes-ellipse.tsx`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/basic-shapes.md`、`docs/.vitepress/components/demos/ui/shapes-circle.tsx`、`docs/.vitepress/components/demos/ui/shapes-ellipse.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 页面 / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `shapes-circle.tsx`：下排三个圆弧改为三种模式并存：第 1 个只写 `fillStyle`（默认 fill），`0°→180°`；第 2 个只写 `stroke` / `strokeStyle` / `lineWidth`，`90°→270°`；第 3 个同时写 `fill` + `stroke` 并分别给 `fillStyle` / `strokeStyle` 两种颜色，`0°→270°`。仍用 `circle={[x,y,r,start,end]}`；标签放在 `y=298`，分别写 `fill 0°→180°`、`stroke 90°→270°`、`fill+stroke 0°→270°`，三者不重叠。
- `shapes-ellipse.tsx`：下排改为三个部分椭圆，`rx=60`、`ry=35`，圆心 x 为 90 / 240 / 390、y 为 230：fill `0°→180°`、stroke `180°→360°`、fill+stroke `0°→180°`；标签分别写 `fill 0°→180°`、`stroke 180°→360°`、`fill+stroke 0°→180°`，不重叠。
- `basic-shapes.md`：圆 / 椭圆两节把原「只想看弧线时才写 `stroke`」改为并列说明——默认填充；只描边写 `stroke`、颜色用 `strokeStyle`；两者都要就同时写 `fill` 和 `stroke`，`fillStyle` 与 `strokeStyle` 分别给色。两节代码示例改为 fill、stroke、fill+stroke 三种写法。live 描述改为下排三个圆弧 / 部分椭圆分别用 fill、stroke、fill+stroke 三种模式，`start` / `end` 只控制角度。保留弧度与度数换算说明。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/shapes-circle.tsx docs/.vitepress/components/demos/ui/shapes-ellipse.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 22 轮（2026-11-03，已执行）

**用户意见（核心）：** 要提一句 `fill` + `stroke` 和 `strokeAndFill` 的区别：前者的描边会覆盖 fill，而后者的 fill 会覆盖描边。`g-rectr` 的 `circle` / `ellipse` 参数不要用表格，直接说一个参数时怎么画、两个参数时怎么画，写成 ul。

| #    | 用户意见                                                                                                                                                    | 落点                      |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| U-22 | 明确 `fill` + `stroke` 与 `strokeAndFill` 的覆盖关系；`g-rectr` 的 `circle` / `ellipse` 项数说明由表格改成 ul，按项数 / 组数直接说明每个角怎么画；不 commit | `basic-shapes.md`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/basic-shapes.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 页面 / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `basic-shapes.md` 通用规则：说明 `fill` + `stroke` 先填充后描边、**描边会覆盖 fill**、边框完整画在填充之上；`strokeAndFill` 先描边后填充、**fill 会覆盖描边**、描边内半边被填充盖住看起来更细，且优先级最高会忽略 `fill` 与 `stroke`。
- 代码注释同步：`fill` + `stroke` 示例注释改为「先填充后描边，描边盖住 fill」，`strokeAndFill` 示例注释改为「先描边后填充：fill 盖住描边，strokeAndFill 优先级最高」；modes live 下方补「重点对照 `fill` + `stroke` 与 `strokeAndFill` 的覆盖关系」。
- `g-rectr`：删除 `circle` 与 `ellipse` 的两张参数映射表，改成 ul。`circle` 按 1 / 2 / 3 / 4 项说明每个角用哪个半径；`ellipse` 每两个值为一组，按 2 / 4 / 6 / 8 项说明每个角用哪一组。保留「不需要的角写 0」与现有代码 / live。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 23 轮（2026-11-03，已执行）

**用户意见（核心）：** 文字页要先讲 `Font` 字体类，再讲怎么用；元素层 TS 对照辅助理解的效果不好，全部删掉、后面也不要写；补齐文字尺寸、锚点与所有文字属性的说明。

| #    | 用户意见                                                                                                                                                                                                       | 落点                               |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| U-23 | 先讲 `Font` 再讲 `<text>`；删除全部独立元素层 TS 示例（`ts` 代码块、`new Text()`、元素层导入、`Font` 静态调用代码块），后续只保留 TSX 用法、live 与说明；说明尺寸、锚点、对齐，并把文字属性全部讲清；同步 demo | `text.md`、`text-demo.tsx`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/text.md`、`docs/.vitepress/components/demos/ui/text-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `text.md` 重写为「先讲字体：Font → 文字元素怎么用 → 文字在界面里的常见用法 → 换行、打字机与输入 → 运行效果 → 边界与注意」。
- `Font` 一节先说明它是描述字体的值对象、不负责绘制，用表格列出 `family` / `size` / `sizeUnit` / `weight` / `italic` 五项及默认值；说明构造顺序、省略项用默认值、`font` 只接受 `Font` 实例、不写时用默认 `Font`、五项配置构造后只读、修改默认值不影响已创建实例；列出 `Font.defaults()` / `Font.clone(base, patch)` / `Font.setDefaults(font)` / `addFallback(...fonts)` 的用法与后备字体不要循环；明确 `Font` 没有行高、字距、下划线、对齐属性，文字元素也不提供行高与对齐。
- 删除全文所有独立 `ts` 代码块、`new Text()`、`import { Text, Font }`、`const titleFont` / `Font.clone` / `Font.setDefaults` 代码块；需要构造 `Font` 的地方改为 TSX 内联 `font={new Font(...)}`，其余用文字说明。
- 文字属性表覆盖 `text` / `font` / `fillStyle` / `strokeStyle` / `strokeWidth`，并说明 `fillStyle` 默认白色且不继承、`strokeStyle` 无默认、`strokeWidth` 默认 `1` 且计入尺寸、描边先画填充后画并盖住内半边、`text` 只支持单行。
- 尺寸、锚点与对齐一节说明宽高由字体测量决定、`width` / `height` 不裁剪且会被下一次测量覆盖、固定占位用外层容器；默认锚点 `(0, 0)`、`0.5` 居中、`1` 右 / 下对齐、`anc` 简写、`loc` 后两项与锚点属性只写一种；给出居中与 `anchorX={1}` 右对齐示例；明确没有 `textAlign` / `textBaseline` / `lineHeight`，垂直居中按实际字形上下沿、不按行高，也不会自动换行。
- 通用属性表列出 `alpha` / `zIndex` / `hidden` / `noevent` / `rotate` / `scale`；缓存说明默认关闭，静态文字写 `cache` 并把 `nocache` 显式设为 `false`，频繁变化不要开。
- `text-demo.tsx` 改为展示 14px 常规、20px 粗体、24px 斜体、填充加描边、居中锚点与右对齐数值六组内容，行距与位置避开重叠。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/text-demo.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 24 轮（2026-11-03，已执行）

**用户意见（核心）：** 文字一般用坐标和锚点，所以最好讲成 `loc={[x, y]}` 和 `anc={[ax, ay]}` 的形式；`Font` 有专门的 `FontWeight` 枚举，要讲；`alpha` 这类通用属性先不讲，统一放到后面。

| #    | 用户意见                                                                                                                                                                                 | 落点                                                  |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| U-24 | `text.md` 统一用 `loc={[x, y]}` + `anc={[ax, ay]}`，不再以 `anchorX` / `anchorY` 为主；补讲 `FontWeight` 枚举；删除文字页与基础图形页的通用属性（`alpha` 等），留到后面集中讲；同步 demo | `text.md`、`text-demo.tsx`、`basic-shapes.md`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/text.md`、`docs/.vitepress/components/demos/ui/text-demo.tsx`、`docs/advanced/ii/ui/basic-shapes.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `text.md`：`Font` 一节补 `FontWeight` 枚举——`FontWeight.Light = 300`、`FontWeight.Normal = 400`、`FontWeight.Bold = 700`，`weight` 可写数字或枚举，`Font` 与 `FontWeight` 都从 `@motajs/render` 导入；内联 TSX 示例与 `Font.clone` 示例改用 `FontWeight.Bold`。
- `text.md` 尺寸、锚点与对齐一节改为以 `loc={[x, y]}` + `anc={[ax, ay]}` 为主：默认 `anc={[0, 0]}`、`loc` 的 x / y 是测量矩形左上角；`anc={[0.5, 0.5]}` 居中、`anc={[1, 0]}` 右对齐且 y 为顶边、`anc={[1, 1]}` 右下角；示例改为 `loc={[240, 160]} anc={[0.5, 0.5]}` 与 `loc={[440, 24]} anc={[1, 0]}`；说明 `anchorX` / `anchorY` 是等价写法，`loc` 后两项也能写锚点，但本篇统一拆成 `loc` + `anc`。
- `text.md` 删除整个 `### 通用属性` 小节（`alpha` / `zIndex` / `hidden` / `noevent` / `rotate` / `scale` / 缓存），删除正文中对 `noevent`、`cache`、`nocache` 的引用；按钮文字条目只保留「放在按钮底容器里，点击由按钮底统一处理」。保留 `width` / `height` 不裁剪、`textAlign` / `textBaseline` / `lineHeight` 不存在、不换行与五项文字属性。
- `text-demo.tsx`：引入 `FontWeight`，用 `FontWeight.Normal` / `FontWeight.Bold` 构造字体；`anchorX` / `anchorY` 改为 `anc={[0.5, 0.5]}`，右对齐改为 `anc={[1, 0]}`。
- `basic-shapes.md`：删除 `## 所有图形通用的属性` 整节（`alpha` / `zIndex` / `hidden` / `noevent` / `rotate` / `scale`），保留填充、描边细节等图形自身内容；全文检索确认不再引用该节。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/text-demo.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 25 轮（2026-11-03，已执行）

**用户意见（核心）：** live 要跟着文档内容走，哪一段讲完就在旁边放对应的 live，不要只在文末放一个大杂烩 live；此要求对后续所有文档生效。

| #    | 用户意见                                                                                                                       | 落点                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| U-25 | 文字页把 live 拆到对应知识点旁边：基本用法、`Font`、文字属性、锚点各一个；删除文末综合 live；此要求对后续所有文档生效（D-102） | `text.md`、新增 4 个 demo、删除 `text-demo.tsx`；本记录 |

**状态：已执行（2026-11-03）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/text.md`、新增 `docs/.vitepress/components/demos/ui/text-basic.tsx` / `text-font.tsx` / `text-style.tsx` / `text-anchor.tsx`、删除 `docs/.vitepress/components/demos/ui/text-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `text.md`：「文字元素怎么用」的基础 TSX 示例后插入 `basicTextLoader` live，说明「最基本的一行文字：内容写在 `text`，位置由 `loc` 决定」；`Font` 小节结束后插入 `fontTextLoader` live，说明「同一个字符串换成不同字号、字重与斜体后的效果」；「文字属性」列表后插入 `styleTextLoader` live，说明「填充、描边颜色与描边宽度的对照」；「尺寸、锚点与对齐」右对齐示例后插入 `anchorTextLoader` live，说明「三行文字分别用不同的锚点，白点标出 `loc` 的位置」。
- 删除文末 `## 运行效果` 整节与 `textLoader`，`<script setup>` 保留并改为四个 loader；未写 live 尺寸或实现说明。
- `text-basic.tsx`：两行基本文字，内容只写在 `text`，位置由 `loc` 决定；`text-font.tsx`：14px 常规、20px 粗体、24px 斜体、32px 粗体标题，用 `FontWeight`；`text-style.tsx`：白色填充、蓝色填充、填充 + 描边 2、填充 + 描边 6 对照；`text-anchor.tsx`：三行文字分别用 `anc={[0, 0]}` / `anc={[0.5, 0.5]}` / `anc={[1, 0]}`，并在各自 `loc` 位置画白色小圆点。
- 四个 demo 均为 480×320、深色背景，内容不重叠；删除旧 `text-demo.tsx` 前已确认除 `text.md` 外无其它引用。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 四个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 26 轮（2026-11-04，已执行）

**用户意见（核心）：** 图片与纹理：只讲如何从贴图管理器获取贴图，不要讲其他方式。不讲 `hd`、`anti` 等参数，这些属于后面一块讲的；`noevent` 等等也是。

| #    | 用户意见                                                                                                                                                                                                                           | 落点                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| U-26 | 只讲从 `props.state.materials` 取已登记贴图再交给 `<image>`；不讲 `new Texture`、手动加载、画布、URL、`Texture` 类等其它来源；不讲 `hd` / `anti` / `noanti` / `noevent` / `alpha` 等属性，留到后面；live 就近放在对应小节（D-103） | `image-and-texture.md`、新增 `image-basic.tsx` / `image-sizes.tsx`、删除 `texture-demo.tsx`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/image-and-texture.md`、新增 `docs/.vitepress/components/demos/ui/image-basic.tsx` / `image-sizes.tsx`、删除 `docs/.vitepress/components/demos/ui/texture-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `image-and-texture.md` 重写为 `图片与纹理`：开头只说明 `<image>` 负责把一张纹理铺到元素矩形、纹理来自贴图管理器且不在 UI 里现场生成；`## 从贴图管理器取纹理` 讲 `props.state.materials` 是 `ITextureManager`、`getImageByAlias(alias)` / `getImage(index)` 返回 `ITexture | null`、别名可能带后缀（如 `bg.jpg`）且不是文件路径、取不到时走占位分支、取到后直接传给 `<image>`、子组件通过 prop 接收 `ITexture`；`## 图片尺寸` 讲 `loc` 决定显示矩形、纹理拉伸铺满、比例不一致会变形、同一张纹理不同尺寸、默认 200×200；`## 图片在界面里的常见用法` 只列图标 / 背景图 / 按钮图标；`## 边界与注意` 只保留取图与尺寸注意事项。
- live 就近放置：`## 从贴图管理器取纹理` 后放 `imageBasicLoader`，`## 图片尺寸` 后放 `imageSizesLoader`；删除文末 `## 运行效果` 与 `textureLoader`，`<script setup>` 改为两个 loader。
- 新增 `image-basic.tsx`：480×320、深色背景，单张图片 `loc={[40, 64, 128, 128]}`，标题与坐标标签不重叠；新增 `image-sizes.tsx`：同一张纹理按 64×64 / 96×96 / 128×128 三档显示，标签分别在图片下方且不重叠。演示纹理只在 demo 内部生成，正文不展示生成方式。
- 删除 `texture-demo.tsx` 前确认除 `image-and-texture.md` 外无其它引用；全文检索确认页面不再出现 `new Texture`、`Texture` 导入、`loadTexture`、`Image`、`noanti`、`anti`、`hd`、`noevent`、`alpha`、`cache`。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/image-basic.tsx docs/.vitepress/components/demos/ui/image-sizes.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 27 轮（2026-11-04，已执行）

**用户意见（核心）：** 不要专门讲「取不到返回 `null` 要先占位」的 null 分支；`<image>` 的 `image` 属性本来就接受 `ITexture | null`，管理器返回什么就直接传什么。

| #    | 用户意见                                                                                                                                                                                                                          | 落点                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| U-27 | 删除「取不到返回 `null`，不要拿 `null` 去画，先走占位分支」的段落与条件渲染示例；改为说明 `image` 接受 `ITexture \| null`、取到什么直接传什么；子组件 prop 改为 `ITexture \| null` 且不做条件分支；删除「边界与注意」中的同名条目 | `image-and-texture.md`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/image-and-texture.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo、其它页面、代码、配置、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 删除「别名或索引对不上时返回 `null`，不要拿 `null` 去画，先走占位分支」整段及其 `icon ? <image> : <g-rect>` 条件渲染示例。
- 改为一句：`<image>` 的 `image` 属性接受 `ITexture | null`，从管理器取到什么就直接传什么，不需要额外判断，也不用先准备占位。
- 子组件示例的 prop 类型改为 `{ icon: ITexture | null }`，直接 `return () => <Icon icon={icon} />`，不再写 `icon ? ... : null`；保留「把图作为 prop 传下去、不在子组件里读 `props.state`」的说明。
- `## 边界与注意` 删除「取不到返回 `null`，先用占位分支」条目；保留别名 / 索引来自素材配置、同一张纹理取一次、不现场造纹理、按原图比例给尺寸等条目。
- 保留 `getImageByAlias` / `getImage` 返回类型说明、直接传给 `<image>`、图片尺寸与两处 live。
- 验证：`pnpm exec prettier --check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 28 轮（2026-11-04，已执行）

**用户意见（核心）：** 图片页只讲图片元素自身功能。从管理器取到的纹理直接传给 `<image>` 的 `image` 属性，不要再包一层；也不要讲子组件如何传图、不要在子组件里读 `props.state`。删除「图片在界面里的常见用法」等应用场景扩展，不假设任何应用场景（D-105）。

| #    | 用户意见                                                                                                                                                                                                                                                                    | 落点                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| U-28 | 删除「取到的纹理直接传给 `<image>`……子组件需要图时……不要在子组件里读 `props.state`」整段与 `Icon` / `defineComponent` 示例；删除「图片在界面里的常见用法」整节；保留从管理器取图、`image` 元素、`loc` 尺寸、拉伸 / 比例、两处 live 与必要边界注意；不新增应用场景或工程封装 | `image-and-texture.md`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/image-and-texture.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo、其它页面、代码、配置、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 删除「取到的纹理直接传给 `<image>` 的 `image` 属性，不要再包一层。子组件需要图时，把 `ITexture | null` 作为 prop 传下去，不要在子组件里读 `props.state`」整段及随后的 `Icon` / `defineComponent` 示例。
- 删除 `## 图片在界面里的常见用法` 整节（图标 / 背景图 / 按钮图标）。
- 开头改为只描述 `<image>` 显示纹理的职责与纹理来源，不再列图标、贴图、像素画等用途。
- 保留 `props.state.materials` 取图、`getImageByAlias` / `getImage`、`image` 接受 `ITexture | null`、`loc` 尺寸、拉伸与比例、两处 live、`## 边界与注意`。
- 全文检索确认不再出现「子组件」「Icon」「按钮图标」「背景图」「图标」等应用场景 / 扩展内容。
- 验证：`pnpm exec prettier --check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 29 轮（2026-11-04，已执行）

**用户意见（核心）：** 现在的 live 画布全部靠左，右边有黑边，需要居中。

| #    | 用户意见                                         | 落点                                                |
| ---- | ------------------------------------------------ | --------------------------------------------------- |
| U-29 | 所有 live 画布在容器内水平居中，消除右侧多余黑边 | `docs/.vitepress/components/renderDemo.vue`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/.vitepress/components/renderDemo.vue` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo 内容、尺寸 / scale 逻辑、其它页面 / 代码 / 配置 / 计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `renderDemo.vue` 外层 `div` 的 `style` 增加 `display: 'flex'` 与 `justifyContent: 'center'`，让 `canvas` 在容器内水平居中。
- `canvas` 增加 `display: 'block'` 与 `flex: 'none'`，避免被 flex 布局压缩或按行内元素留出额外基线间距。
- 验证：`pnpm exec prettier --check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 30 轮（2026-11-04，已执行）

**用户意见（核心）：** 新增一篇讲简单通用参数的页面，只讲 `hd`、`anti` / `noanti`、`hidden`、`id`、`alpha`、`cursor`、`filter`、`zIndex` 这些参数本身，不假设应用场景；需要看效果的小节旁边配 live；接入侧边栏并更新 UI 子分组计数。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                               | 落点                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| U-30 | 新建 `common-props.md`，只讲这八个简单通用参数；`hd` 只说明缓存画布分辨率，不展开缓存；`anti` / `noanti` 说明同一开关与优先级；`hidden`、`id` 给短 TSX 示例；`alpha`、`cursor`、`filter`、`zIndex` 配 live；新增 5 个 demo 并就近放置 live；侧边栏在「图片与纹理」之后加「通用参数」；UI 子分组计数 26 → 27；不写 `cache`、`noevent`、`composite` 等未列参数与应用场景 | `docs/advanced/ii/ui/common-props.md`、5 个新 demo、`config.ts`、`ii/index.md`、本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 新增 `docs/advanced/ii/ui/common-props.md`：单 H1「通用参数」，开头说明这些属性大多数元素可写、有的只影响特定条件；按 `hd`、`anti / noanti`、`hidden`、`id`、`alpha`、`cursor`、`filter`、`zIndex` 八节讲参数本身，不涉及应用场景。
- `hd`：默认 `true`，控制缓存画布是否按 DPR 使用高清分辨率，只对开启缓存的元素有效，`hd={false}` 按 1x 绘制；不展开缓存参数。
- `anti / noanti`：`anti` 默认 `true`、`noanti` 默认 `false`，两者控制同一个抗锯齿开关，`noanti` 优先级更高，不要同时依赖；配 `props-anti` live（同一张 16×16 纹理放大到 160×160，默认与 `noanti` 对照）。
- `hidden`：默认 `false`，为 `true` 时不绘制、不参与交互，不改变尺寸与坐标；给短 TSX 示例，无 live。
- `id`：默认空字符串，空 id 不登记，同一渲染器内唯一、重复告警，可用渲染器的 `getElementById(id)` 查找，不影响显示与布局；给短 TSX 示例，无 live。
- `alpha`：默认 `1`，范围 `0`–`1`，只作用于当前元素自身的绘制、不自动叠加到子元素；配 `props-alpha` live（三个矩形 `alpha` 1 / 0.6 / 0.25）。
- `cursor`：默认 `inherit`，值是 CSS cursor 字符串，悬停生效、元素不参与交互时不生效；配 `props-cursor` live（带 `cursor="pointer"` 的区域与提示文字）。
- `filter`：默认 `none`，值是 CSS filter 字符串、可组合，只作用于当前元素自身的绘制；配 `props-filter` live（正常、`blur(3px)`、`grayscale(1) brightness(0.7)` 三组）。
- `zIndex`：默认 `0`，只在同一父元素的兄弟间比较，值越大越后画、越靠上，跨父级不直接比较，相同值不依赖顺序；配 `props-zindex` live（两个重叠矩形不同 `zIndex`）。
- 新增 5 个 demo：`props-anti.tsx`、`props-alpha.tsx`、`props-cursor.tsx`、`props-filter.tsx`、`props-zindex.tsx`；均为 480×320、深色背景、内容不重叠，live 分别放在对应小节之后，文末无综合 live。
- 侧边栏 `docs/.vitepress/config.ts` 在「图片与纹理」之后新增「通用参数」→ `/advanced/ii/ui/common-props`；`docs/advanced/ii/index.md` 的 UI 子分组计数由 26 篇改为 27 篇。
- 核对源码：`packages/render-vue/src/props.ts` 的 `BaseProps` 定义这些属性；`packages/render/src/core/item.ts` 的 `renderContent` 处理 `hidden` / `filter` / `alpha`，`setHD` / `setAntiAliasing` / `setZIndex` / `setCursor` 及 `handleProps` 的 `anti` / `noanti` 映射；`packages/render/src/core/container.ts` 的 `sortChildren` 按 `zIndex` 升序排序；`packages/render/src/core/render.ts` 的 `getElementById` 与 `hoverElement` 处理 id 查找与光标。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 5 个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。
- 仅新增上述页面与 demo、修改 `config.ts`、`ii/index.md` 与本记录；未改其它页面、代码、计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。

## 第 31 轮（2026-11-04，已执行）

**用户意见（核心）：** `common-props.md` 内容太少，需要整体丰富；`filter` 要说明允许所有合法 CSS filter 字符串并链接 MDN；`id` 说明一般情况下不会用到；`hd` / `anti` / `noanti` 写应用场景，但场景必须由属性语义与限制推导，不能假设「只用于 / 常用于」；像素图不适合抗锯齿，所以像素图场景应使用 `noanti`。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                          | 落点                      |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| U-31 | 扩写 `common-props.md`：开头说明每个参数在什么条件下有意义、场景只是推导出的适用条件；`hd` 补高清缓存的原因与 `hd={false}` 的适用条件；`anti` / `noanti` 补连续色调与像素图两类由语义推导的场景；`hidden` 补保留实例的原因；`id` 明确一般情况下不会用到；`alpha`、`cursor`、`filter`、`zIndex` 补使用后果与语义边界；`filter` 链接 MDN；保持 8 节与现有 live 位置 | `common-props.md`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/common-props.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo、其它页面、代码、配置、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 开头改为说明这些属性只在特定条件下有意义，并补「下面会说明每个参数在什么条件下有意义；场景只是由属性语义推出的适用条件，不是限定用途」。
- `hd`：保留默认 `true`、缓存画布按 DPR 绘制、`hd={false}` 按 1x、只对开启缓存的元素有效；补充高 DPR 屏幕上文字 / 矢量缓存需要按 DPR 绘制才不糊，以及缓存内容本身是 1x 像素数据或更在意缓存开销时可 `hd={false}`；未展开 `cache` 参数，也未写「只用于像素图」。
- `anti / noanti`：保留默认值、同一开关与 `noanti` 优先级；补充连续色调图片 / 渐变缩放时平滑插值减少锯齿，像素图放大时抗锯齿会把硬边插值成半透明过渡，因此应写 `noanti` 并尽量按整数倍放大；明确这是由「像素图需要硬边」推导出的场景，不是限定用途；`props-anti` live 位置不变。
- `hidden`：补充需要保留元素实例、临时不绘制 / 不交互、改回 `false` 恢复的原因；保留不改变尺寸与坐标的说明与短 TSX 示例。
- `id`：明确「一般情况下不会用到」，只有需要从渲染器按 id 直接查找元素（调试、测试或命令式访问）时才写；保留空 id 不登记、重复告警、不是 DOM id、不影响显示与布局；示例保持中性 `id="target"`。
- `alpha`：补充单个元素淡入淡出的用法，以及 `alpha` 不会写到子元素上、子元素要单独设的后果；`props-alpha` live 位置不变。
- `cursor`：补充它只改变悬停光标、不负责点击，元素要参与交互，`pointer` / `text` 等按 CSS 语义选择；`props-cursor` live 位置不变。
- `filter`：补充接受所有合法 CSS filter 字符串、可组合多个函数并按书写顺序应用、三个示例与 [MDN 的 filter 文档](https://developer.mozilla.org/zh-CN/docs/Web/CSS/filter) 链接；保留只作用于当前元素自身绘制、不传给子元素、不影响布局；`props-filter` live 位置不变。
- `zIndex`：补充只在兄弟间比较、跨父级不比较、负数也可以用、相同值不要依赖顺序，以及兄弟重叠需要强制顺序的场景；`props-zindex` live 位置不变。
- 未新增应用场景式组件封装、子组件传参等内容；未写 `cache`、`noevent`、`composite` 等未列参数。
- 核对源码：`packages/render-vue/src/props.ts` 的 `BaseProps`；`packages/render/src/core/item.ts` 的 `renderContent`（`filter` / `alpha`）、`setHD`、`setAntiAliasing`、`setZIndex`、`hide` / `show` 与 `handleProps` 的 `anti` / `noanti` 映射；`packages/render/src/core/container.ts` 的 `sortChildren`；`packages/render/src/core/render.ts` 的 `getElementById` 与 `hoverElement`。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 32 轮（2026-11-04，已执行）

**用户意见（核心）：** `common-props.md` 每个小节都要有 TSX 代码示例；示例要紧扣属性语义，`hd` 用默认会缓存的 `container` 演示，`anti` / `noanti` 用 `image` 演示，其余参数各给一个最小示例；不新增应用场景。

| #    | 用户意见                                                                                                                                                                                                                                                                              | 落点                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| U-32 | 为 `common-props.md` 的 8 个 `##` 小节各补至少一个 TSX 代码示例；`hd` 用 `container` 演示 `hd={false}` 并注明只对缓存元素有效；`anti` / `noanti` 用 `<image ... noanti>`；`hidden`、`id` 保留现有示例；`alpha`、`cursor`、`filter`、`zIndex` 各补最小示例；保持 8 节与 5 个 live 不变 | `common-props.md`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/common-props.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo、其它页面、代码、配置、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 核对源码（D-104）：`packages/render-vue/src/props.ts` 的 `BaseProps` 定义 `hd` / `anti` / `noanti` / `alpha` / `cursor` / `filter` / `zIndex` / `hidden` / `id`；`packages/render/src/core/item.ts` 的 `setHD` 只在 `enableCache` 时作用于缓存，`setAntiAliasing` 同时设置元素与其缓存，`handleProps` 中 `noanti` 映射为 `setAntiAliasing(!value)`；`Container` 继承 `RenderItem` 默认开启缓存，`Text` / `Image` / `GraphicItemBase` 构造函数默认 `enableCache = false`；`sortChildren` 按 `zIndex` 升序排序。
- `hd`：新增 `container` + `text` 示例，`hd={false}`，注释说明 `hd` 只对开启缓存的元素有效、`container` 默认开启缓存。
- `anti / noanti`：新增 `<image image={texture} noanti loc={[40, 40, 160, 160]} />`，注释说明 `noanti` 关闭图片缩放时的插值。
- `hidden`、`id`：保留原有 TSX 示例，内容未改。
- `alpha`：新增 `<g-rect loc={[40, 40, 120, 80]} fillStyle="#4f8cff" alpha={0.5} />`，注释说明只影响自身透明度。
- `cursor`：新增 `<g-rect loc={[40, 40, 200, 80]} fillStyle="#2f6fed" cursor="pointer" />`，注释说明悬停时变为手型。
- `filter`：新增 `<g-rect loc={[40, 40, 160, 100]} fillStyle="#4f8cff" filter="blur(3px) brightness(0.8)" />`，注释说明多个函数按书写顺序应用。
- `zIndex`：新增两个重叠 `g-rect`，第一个写 `zIndex={1}`、第二个默认，注释说明只影响同一父元素下的兄弟、值较大者后画。
- 保持 8 个 `##` 小节与 5 个 `ClientOnly` live 不变；未新增应用场景，未写 `cache` / `noevent` / `composite` 等未列参数。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 33 轮（2026-11-04，已执行）

**用户意见（核心）：** `filter` 不作用于子元素不等于子元素不生效：`filter` / `alpha` 是否影响子元素取决于当前元素是否开启缓存，文档要写准确。

| #    | 用户意见                                                                                                                                                                                                                                                                                      | 落点                      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| U-33 | 修正 `common-props.md` 中 `filter` 的事实错误：`filter` 不是继承属性，但开启缓存时子元素会随整张缓存一起被过滤、未开启缓存时子元素按自己的 `filter` 绘制；当前元素无自身绘制（如未缓存容器）时 `filter` 不作用到子元素。`alpha` 按同一缓存条件同步写准确。不展开 `cache` 用法，只作为条件说明 | `common-props.md`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/common-props.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo、其它页面、代码、配置、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 核对源码：`packages/render/src/core/item.ts` 的 `renderContent` 在当前绘制上下文设置 `ctx.filter = this.filter`、`ctx.globalAlpha = this.alpha`；开启缓存时先 `this.render(this.cache, tran)` 把自身与子元素画进缓存，再对整张缓存 `drawImage`，`filter` / `alpha` 因此作用于含子元素的整张缓存结果；未开启缓存时直接 `this.render(canvas, tran)`，子元素在各自的 `renderContent` 中设置自己的 `filter` / `alpha`。
- `filter`：删除「只作用于当前元素自身的绘制，不会写到子元素上」这种笼统说法，改为说明 `filter` 不是继承属性、不会自动套到每个子元素的绘制上；开启缓存时子元素先画进缓存图、`filter` 作用在整张缓存结果上、子元素会一起被过滤；未开启缓存时子元素按自己的 `filter` 绘制、当前元素的 `filter` 只影响自身绘制；当前元素没有自己的绘制（如未缓存容器）时 `filter` 不作用到子元素；不影响布局。
- `alpha`：同步说明 `alpha` 不是继承属性；开启缓存的父级把子元素画进缓存图后整体应用 `alpha`，子元素一起变透明；未开启缓存时只影响当前元素自身绘制，子元素按自己的 `alpha` 绘制；保留单个元素淡入淡出的说明。
- 不展开 `cache` 用法，只把「是否开启缓存」作为条件说明；示例与 live 不变。
- 验证：`pnpm exec prettier --check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 34 轮（2026-11-04，已执行）

**用户意见（核心）：** 改造 `layer-transform-performance.md`：只讲剩下的 `scale` / `rotate` / `transform`、`cache` / `nocache`、`composite` 与缓存 / 性能取舍；`zIndex` / `hidden` / `alpha` / `filter` 已在通用参数页讲过，本篇不重复细节，只保留必要的层级上下文；不讲 `noevent` / `type` / `fall`；live 就近放置，不要文末综合 live。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                               | 落点                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| U-34 | 重写 `layer-transform-performance.md`：保留 H1 与「渲染树、层级与绘制顺序」锚点，压缩层级内容并链接通用参数页；新增「变换：scale、rotate 与 transform」「变换沿树传递」「缓存：cache 与 nocache」「composite」「性能：缓存取舍」；删除 zIndex / hidden / noevent / filter 的完整小节；新增 `layer-transform`、`layer-transform-tree`、`layer-composite` 三个就近 live，删除旧 `layer-demo.tsx` 与文末综合 live；全文不出现 `noevent` / `type` / `fall` | `layer-transform-performance.md`；3 个新 demo；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/layer-transform-performance.md`、新增 `docs/.vitepress/components/demos/ui/layer-transform.tsx` / `layer-transform-tree.tsx` / `layer-composite.tsx`、删除 `docs/.vitepress/components/demos/ui/layer-demo.tsx`、追加本记录；未改其它页面、代码、配置、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 核对源码（D-104）：`packages/render-vue/src/props.ts` 的 `BaseProps` 定义 `transform`（第 50 行）、`cache` / `nocache`（第 54–56 行）、`composite`（第 64 行）、`scale` / `rotate`（第 76–78 行），并注明 `scale` / `rotate` 是 `transform` 的简写属性；`packages/render/src/core/item.ts` 的 `renderContent`（第 196–227 行）在当前绘制上下文设置 `filter` / `alpha` / `composite`，缓存分支先 `this.render(this.cache, tran)` 再对整张缓存 `drawImage`，未缓存分支直接 `this.render(canvas, tran)`；`update`（第 229–244 行）沿父链标脏；`handleProps` 的 `transform`（第 1037–1042 行）、`scale`（第 1092–1099 行，调用 `transform.setScale`）、`rotate`（第 1101–1105 行，调用 `transform.setRotate`）；`packages/render/src/core/container.ts` 的 `render`（第 16–28 行）逐个调用子元素 `renderContent`，`sortChildren`（第 87–91 行）按 `zIndex` 升序排序；`packages/render-vue/src/tag.ts` 的 `createStandardElement`（第 103–115 行）在创建时用 `cache && !nocache` 决定是否缓存，`container` / `custom` / `custom-container` 默认开启，`text` / `image` / `template` / `g-*` 默认关闭；`packages/render/src/core/transform.ts` 的 `setScale`（第 102–109 行）、`setRotate`（第 126–132 行）提供非叠加的设置语义。
- 层级：保留 `## 渲染树、层级与绘制顺序` 标题，并在标题前加 `#渲染树层级与绘制顺序` 锚点，兼容 `inventory-example-1-skeleton.md` 的现有链接；内容压缩为「层级沿父子关系生效、兄弟按 `zIndex` 排序、父级带着子树参与排序」，`zIndex` / `hidden` 的完整语义链接到 `common-props.md#zindex`；UI 栈只保留必要上下文。
- 变换：`scale` 为 `[x, y]`、`rotate` 单位为弧度、锚点是变换中心；说明 `scale` / `rotate` 是 `transform` 的简写，`transform` 可直接接收 `Transform` 对象但不展开构造；补 TSX 示例与 `layer-transform` live（原始 / scale / rotate 三组）。
- 变换沿树传递：保留父子变换复合、局部坐标、不能靠子元素反向缩放抵消、事件坐标用 `absoluteX` / `absoluteY` 的说明；补 TSX 示例与 `layer-transform-tree` live（父级 scale 1.5 倍，右侧为未缩放参考）。
- 缓存：默认缓存 `container` / `custom` / `container-custom`，默认不缓存 `text` / `image` / `template` / 全部 `g-*`；`cache` / `nocache` 在创建时决定、`nocache` 优先级更高；说明缓存父级的 `alpha` / `filter` / `composite` 作用于整张缓存结果、未缓存父级不传给子元素；保留 mermaid 脏更新流程图与静态 / 动态对照代码，代码中只出现 `cache` / `nocache`；保留 `custom` 自绘改外部数据需手动触发更新的说明。
- composite：默认 `source-over`，值取 `GlobalCompositeOperation`（`multiply` / `screen` / `overlay` / `lighter` 等），影响当前绘制结果、不改变布局与命中；缓存父级的 `composite` 作用在整张缓存图上；补 TSX 示例与 `layer-composite` live（source-over / multiply / screen 三组重叠图形）。
- 性能：保留静态复杂子树适合缓存、频繁变化子树不要缓存、脏更新沿父链标记、嵌套缓存叠加内存、缓存不是运行时开关等取舍；删除 `hd` / `anti` / `noanti` / `noevent` / `type` / `fall` 的说明。
- 边界与注意：只保留变换 / 缓存 / composite 相关条目，删除 `zIndex` / `hidden` / `noevent` / `filter` 的重复条目。
- 三个 demo 均为 480×320、深色背景、内容不重叠；live 分别放在对应小节之后，文末无综合 live；页面 `<script setup>` 改为三个 loader，删除 `layerLoader`。
- 全文检索确认 `noevent`、`type`、`fall` 出现次数均为 0；未保留 `hd` / `anti` / `noanti` 章节。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 3 个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 35 轮（2026-11-04，已执行）

**用户意见（核心）：** 变换的 live 看起来发糊，需要检查写法是否有问题。

| #    | 用户意见                                                                              | 落点                                                                                        |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| U-35 | 变换 live 发糊；缩放 / 旋转的变换容器加 `nocache`，并说明缓存结果再变换会重采样的原因 | `layer-transform.tsx`、`layer-transform-tree.tsx`、`layer-transform-performance.md`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/.vitepress/components/demos/ui/layer-transform.tsx`、`docs/.vitepress/components/demos/ui/layer-transform-tree.tsx`、`docs/advanced/ii/ui/layer-transform-performance.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `layer-transform.tsx`：做 `scale` 与 `rotate` 的两个容器加 `nocache`；原始对照保持原样。
- `layer-transform-tree.tsx`：做 `scale={[1.5, 1.5]}` 的父容器加 `nocache`；未缩放参考保持原样。
- `layer-transform-performance.md`：变换节补一段说明——`container` 默认开启缓存，对缓存容器做缩放或旋转会先画缓存图再变换，缓存图会重新采样、边缘可能发糊；需要清晰变换时给容器加 `nocache`，让子元素按变换直接绘制。「变换沿树传递」的代码示例同步给父容器加 `nocache` 并更新注释。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/layer-transform.tsx docs/.vitepress/components/demos/ui/layer-transform-tree.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 36 轮（2026-11-04，已执行）

**用户意见（核心）：** 变换 live 要画出锚点，并展示不同 `anc` 下缩放 / 旋转的差异。

| #    | 用户意见                                                                                                                                                                                                                                  | 落点                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| U-36 | 变换 live 中画出锚点（白色小圆点），并在标题区写「白点 = 锚点」；改为 2×2 四组，分别对比 `scale` / `rotate` 在 `anc={[0, 0]}` 与 `anc={[0.5, 0.5]}` 下的差异，同一组使用相同 `loc` / 尺寸；文档说明两种锚点绕的点、视觉位置与扩展方向不同 | `layer-transform.tsx`、`layer-transform-performance.md`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/.vitepress/components/demos/ui/layer-transform.tsx`、`docs/advanced/ii/ui/layer-transform-performance.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `layer-transform.tsx` 重做为 480×320 的 2×2 四组：上排 `scale` 对比 `anc={[0, 0]}` 与 `anc={[0.5, 0.5]}`，下排 `rotate` 对比两种锚点；每组使用相同的 `loc={[84, 58, 76, 42]}` 与尺寸，`scale` 用 `[1.35, 0.7]`、`rotate` 用 `Math.PI / 12`，做变换的 `container` 均加 `nocache`。
- 每组锚点位置画白色小圆点 `g-circle circle={[84, 58, 5]}`（画在变换容器之后，保证可见）；标题区写「白点 = 锚点：分别对比绕左上角与绕中心」；每组左上角加简短标签（如 `scale · anc [0, 0]`），标签与图形、锚点不重叠。
- `layer-transform-performance.md` 变换节说明：同一变换在 `anc={[0, 0]}` 与 `anc={[0.5, 0.5]}` 下围绕的点不同（左上角 vs 中心），视觉位置与扩展方向不同；live 说明由「三组原始 / 缩放 / 旋转」改为「四组同一变换在不同锚点下的对比」；代码示例补了两个 `anc={[0.5, 0.5]}` 的对照矩形，未写实现细节。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/layer-transform.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 37 轮（2026-11-04，已执行）

**用户意见（核心）：** `composite` 补 MDN 链接；`cache` / `nocache` 的具体运作机理不用讲，只说什么情况下需要开、什么情况下不需要开，并给出代码示例。

| #    | 用户意见                                                                                                                                                                                                                                                 | 落点                                     |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| U-37 | `composite` 的 `GlobalCompositeOperation` 后补 MDN 链接；缓存节删除脏更新说明、`custom` 自绘手动更新、缓存父级 `alpha` / `filter` / `composite` 影响与 mermaid 流程图，只保留默认值提示、开 / 不开的判断和两段代码示例；压缩「性能」节避免与缓存判断重复 | `layer-transform-performance.md`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/layer-transform-performance.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo、其它页面、配置、计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `composite`：在 `GlobalCompositeOperation` 后补 `[MDN 的 composite 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation)`；删除「缓存父级的 `composite` 作用在整张缓存图上」一句。
- 缓存节：删除脏更新沿父链上冒的说明、`custom` / `container-custom` / `template` 的定义与自绘手动更新、缓存父级 `alpha` / `filter` / `composite` 的影响、mermaid 流程图，以及静态 / 动态的两段旧示例；只保留一句默认值提示（`container` 默认缓存；`text`、`image` 与全部 `g-*` 默认不缓存）、开 / 不开两条判断，和静态复杂子树用 `cache`、频繁变化子树用 `nocache` 的两段代码示例；保留「`cache` / `nocache` 在元素创建时决定，不要运行时反复切换」的使用约束。
- 性能节：`## 性能：缓存取舍` 压缩为 `## 性能：缓存的代价` 三句，只讲离屏画布换绘制次数、内存与嵌套缓存成本、未确认性能问题先不开；H1「层级、变换与性能」与节标题都保留「性能」，不与缓存节的判断重复。
- `## 边界与注意`：删除「缓存父级 `alpha` / `filter` / `composite` 作用在整张缓存结果上」与「正常属性变化会自动标脏并沿父链上冒」两条；保留 `cache` / `nocache` 创建时决定与 `composite` 两条。
- 全文检索确认不再出现 `脏更新`、`mermaid`、`自定义绘制改了外部数据`、`缓存父级`、`脏标记`、`custom`、`container-custom`、`template`。
- 本页缓存节原有的显式锚点 `#缓存与脏更新` 随标题一并移除；`ui-performance.md` 中指向该锚点的链接不在本次修改范围内，未调整。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 38 轮（2026-11-04，已执行）

**用户意见（核心）：** 新增独立页面讲 `custom` 与 `container-custom`，放在「图片与纹理」之后、「通用参数」之前。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                        | 落点                                                                                                                                                                                                                                           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-38 | 新建 `custom-and-container-custom.md`：`custom` 讲叶子元素、局部坐标直接绘制、`bindings` 触发重绘、默认缓存与 `nocache`；`container-custom` 讲 `render` 接管子元素绘制并必须遍历调用 `renderContent`、`propagate` 接管事件传递、默认缓存与 `nocache`；末尾给出「怎么选」。配 `custom-demo` 与 `container-custom-demo` 两个 live，均为 480×320、深色背景、内容不重叠。侧边栏插在「图片与纹理」之后、「通用参数」之前，UI 子分组计数由 27 改为 28 | `docs/advanced/ii/ui/custom-and-container-custom.md`、`docs/.vitepress/components/demos/ui/custom-demo.tsx`、`docs/.vitepress/components/demos/ui/container-custom-demo.tsx`、`docs/.vitepress/config.ts`、`docs/advanced/ii/index.md`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅新增 `docs/advanced/ii/ui/custom-and-container-custom.md`、`docs/.vitepress/components/demos/ui/custom-demo.tsx`、`docs/.vitepress/components/demos/ui/container-custom-demo.tsx`，并修改 `docs/.vitepress/config.ts`、`docs/advanced/ii/index.md` 与本记录；未改其它页面 / demo / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- 源码依据（D-104）：`packages/render/src/core/custom.ts:6-28` 的 `CustomRenderItem` 与 `render`（调用 `renderFn(canvas)`），`:30-59` 的 `render` / `bindings` 属性处理；`packages/render/src/core/container.ts:126-189` 的 `CustomContainer`，`:130-139` 的 `render` 接管子元素绘制，`:141-153` 的 `propagate` 接管事件传递，`:159-169` 的两个 setter；`packages/render-vue/src/props.ts:83-88` 的 `CustomProps`（`render` / `bindings`），`:92-97` 的 `ConatinerCustomProps`（`render` / `propagate`）；`packages/render/src/core/types.ts:589` 的 `CustomRenderFunction`，`:602-606` 的 `CustomContainerRenderFn`，`:614-620` 的 `CustomContainerPropagateFn`；`packages/render/src/core/item.ts:196-227` 的 `renderContent` 负责设置变换、透明度与缓存后再进入 `render`；`packages/render-vue/src/tag.ts:48-51` 注册 `custom`、`:67-70` 以内部名 `custom-container` 注册 `CustomContainer`，JSX 声明在 `packages/render-vue/src/elements.ts:45-48` 与 `:53` 使用文档写法 `container-custom` / `custom`。
- 页面以 `custom` 的局部坐标自绘与 `bindings` 为主线，`container-custom` 以 `render` 遍历 `children` 调用 `renderContent` 为主线；`propagate` 只说明用途与默认回退，不展开参数名；`nocache` 只作为缓存提示出现。
- `custom-demo.tsx` 用 `requestAnimationFrame` 更新角度并放入 `bindings`，绘制径向渐变、同心圆环与旋转指针；`container-custom-demo.tsx` 用同一组子元素对比普通 `container` 与 `container-custom` 的裁剪效果，未写 `propagate`。
- 侧边栏在「图片与纹理」之后插入「自绘元素与自定义容器」→ `/advanced/ii/ui/custom-and-container-custom`；`docs/advanced/ii/index.md` 的 UI 子分组计数由 27 改为 28。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 两个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 39 轮（2026-11-04，已执行）

**用户意见（核心）：** `custom` / `container-custom` 的渲染函数不要内联，统一抽成独立的 `const render`；修复 `container-custom` live 空白。

| #    | 用户意见                                                                                                                                                                                                                               | 落点                                                                                                                                                                                                                   |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-39 | `custom` / `container-custom` 的渲染函数统一抽成独立的 `const render = ...`，文档示例与 demo 都改；修复 `container-custom` live 空白：`tag.ts` 注册名是 `custom-container`，而项目 / JSX / 文档使用 `container-custom`，创建元素时抛错 | `docs/advanced/ii/ui/custom-and-container-custom.md`、`docs/.vitepress/components/demos/ui/custom-demo.tsx`、`docs/.vitepress/components/demos/ui/container-custom-demo.tsx`、`packages/render-vue/src/tag.ts`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 文档两个示例改为先定义 `const render = ...`，再在 JSX 中使用 `render={render}`；讲解内容与 live 尺寸未改。
- `custom-demo.tsx` 与 `container-custom-demo.tsx` 把内联 `render={...}` 抽成组件内的 `const render = ...`，JSX 改用 `render={render}`；demo 中的 `render` 分别用 `CustomRenderFunction` / `CustomContainerRenderFn` 标注类型，避免严格模式下隐式 `any`。
- 源码依据（D-104）：`packages/render-vue/src/renderer.ts:53-65` 的 `createElement` 直接用 JSX 标签名调用 `tagManager.getTag(type)`，取不到就抛 `Cannot create element '${type}'`；`packages/render-vue/src/tag.ts:67-70` 原先把 `CustomContainer` 注册为 `custom-container`，与 `packages/render-vue/src/elements.ts:45-48` 的 JSX 声明 `'container-custom'` 以及项目内 `<container-custom>` 用法不一致，因此 live 空白；现改为注册 `container-custom`。
- 元素层不受影响：`packages/render/src/core/render.ts:245` 仍以内部名 `custom-container` 注册 `CustomContainer`，该字符串注册只服务于 `IRenderTreeRoot.createElement(string)` 重载；`packages/render-vue/src/tag.ts:103-115` 的 `createStandardElement` 直接传构造函数给 `renderer.createElement(Cons, ...)`，不经过元素层字符串注册。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 两个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link；源码确认 `getTag('container-custom')` 可命中。

## 第 40 轮（2026-11-04，已执行）

**用户意见（核心）：** 渲染函数不要习惯性写 `save` / `restore`，系统已经在调用前后保存并恢复了画布状态；`custom` 的 live 加 `nocache`，避免默认缓存路径带来的显示问题。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                      | 落点                                                                                                                                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| U-40 | `custom` 示例删除指针绘制前后的 `save` / `restore`，并说明系统已在 `render` 前后保存 / 恢复画布状态、只在函数内部临时改变状态且之后还要继续绘制时才写；`container-custom` 示例保留 `save` / `restore` 并说明这里因为裁剪后还要画不受裁剪的边框而必须写；`custom-demo` 加 `nocache`、删除指针绘制前后的 `save` / `restore`；`container-custom-demo` 的 `save` / `restore` 保留并补一句必要说明 | `docs/advanced/ii/ui/custom-and-container-custom.md`、`docs/.vitepress/components/demos/ui/custom-demo.tsx`、`docs/.vitepress/components/demos/ui/container-custom-demo.tsx`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- `custom-and-container-custom.md`：`custom` 示例删除指针绘制前后的 `ctx.save()` / `ctx.restore()`；在 `render` 说明后补充「系统在调用 `render` 前后已经保存并恢复了画布状态，函数里不需要在开头和结尾习惯性地写 `save` / `restore`。只有在函数内部临时改变状态、之后还要恢复并继续绘制时，才需要自己保存和恢复。」；`container-custom` 示例保留 `save` / `restore`，补注释说明裁剪会持续生效、收尾还要画不受裁剪的边框，并在 `restore` 后补上边框绘制，使该说明与实际示例一致。
- `custom-demo.tsx`：删除指针绘制前后的 `ctx.save()` / `ctx.restore()`，保留动画与 `bindings` 逻辑；`<custom>` 增加 `nocache`。
- `container-custom-demo.tsx`：确认 `save` / `restore` 是必要用法（裁剪后还要画边框），保留并在 `save` 前补一句说明注释。
- 未改元素层 TS，未写 live 尺寸说明。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 两个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 41 轮（2026-11-04，已执行）

**用户意见（核心）：** `custom` 的 `bindings` 要讲清 `Ref` 并链接《响应式》；live 改为用按钮调整角度并展示重绘，同时提醒不要在 `render` 里自己更新 binding；`container-custom` 不再用「普通 container 不裁剪」的错误示例，改为逐个给子元素设置递增 blur，并说明缓存画布的裁剪只是实现特性。

| #    | 用户意见                                                                                                                                                                                                                                       | 落点                                                                                                                                                                                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| U-41 | `bindings` 讲清 `Ref` 并链接《响应式》；custom live 加两个按钮调整角度展示重绘；用 `::: warning` 提醒不要在 `render` 里自己更新 binding；`container-custom` 改为逐个给子元素设置递增 blur，说明普通 container 的缓存裁剪只是实现特性、不要依赖 | `docs/advanced/ii/ui/custom-and-container-custom.md`、`docs/.vitepress/components/demos/ui/custom-demo.tsx`、`docs/.vitepress/components/demos/ui/container-custom-demo.tsx`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/custom-and-container-custom.md`、`docs/.vitepress/components/demos/ui/custom-demo.tsx`、`docs/.vitepress/components/demos/ui/container-custom-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `custom-and-container-custom.md`：`bindings` 段补充 `Ref` 是 Vue 的响应式引用、可先理解为「值变化会通知界面重新渲染」的包装，并链接[《响应式》](./reactivity.md)；新增 `::: warning`，提醒不要在 `render` 里直接修改 `bindings` 中的 ref，一般不会遇到，确实需要时在高级 III 讲解。
- `custom-and-container-custom.md` 的 `container-custom` 节：删除用 `save` / `restore` 裁剪子元素并画边框的示例与「普通 container 不裁剪」的对比描述；改为遍历 `children`、按 `index` 调用 `child.setFilter('blur(...)')` 后 `child.renderContent(canvas, transform)` 的递增模糊示例，并说明系统已在 `render` 前后保存 / 恢复画布状态、此示例不需要 `save` / `restore`；补充普通 `container` 开启缓存时子元素会先画到缓存画布、超出部分被裁，`nocache` 才不裁，但这是缓存实现特性、不要依赖。保留「必须遍历并绘制子元素」「`propagate` 可选」「多用于内置组件内部」。
- `custom-demo.tsx`：移除 `requestAnimationFrame` 自动动画与 `onMounted` / `onUnmounted`；保留 `angle = ref(0)`，在 gauge 下方放「−15°」「+15°」两个按钮，按钮由 `container` + `g-rect` + `text` + `onClick` 组成，点击时分别把 `angle.value` 减少 / 增加 `Math.PI / 12`；`<custom>` 保持 `bindings={[angle]}` 与默认缓存；按钮下方写「angle 放进 bindings，点击按钮会重绘」。
- `container-custom-demo.tsx`：移除裁剪 `render` 与 `save` / `restore`；左右两侧使用同一组三行子元素，左侧普通 `container` 原样绘制，右侧 `container-custom` 的 `render` 遍历 `children`，按 `index` 设置 `blur(0 / 2 / 4px)` 后再 `renderContent`；标签说明「container-custom：递增 blur」。
- 未写元素层 TS，未写 live 尺寸说明。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 两个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 42 轮（2026-11-04，已执行）

**用户意见（核心）：** `custom` 的 `bindings` 改为接收依赖值数组：不再传 `ref` 对象、不再写 `Ref[]`；文档与 live 都改成 `bindings={[angle.value]}`，由父组件 render 读取 `.value`，按钮点击应触发重绘。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                   | 落点                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| U-42 | `bindings` 改成依赖值数组，不再传 `ref` 对象、不写 `Ref[]`；示例改成 `bindings={[angle.value]}`；说明读取 `.value` 发生在父组件 render 中、由 Vue 追踪，变化后父组件重渲染并 patch，`render` 包不需要认识 Vue / `Ref` / `watch`；warning 改为不要修改用于 `bindings` 的响应式值；demo 同步改 `bindings={[angle.value]}`，按钮改 `angle` 应能触发 live 重绘 | `docs/advanced/ii/ui/custom-and-container-custom.md`、`docs/.vitepress/components/demos/ui/custom-demo.tsx`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/custom-and-container-custom.md`、`docs/.vitepress/components/demos/ui/custom-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改系统 / 其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `custom-and-container-custom.md`：`bindings` 段改为接收依赖值数组，把 `render` 读取的响应式值本身放进数组（`bindings={[angle.value]}`），不再传 `ref` 对象；说明读取 `.value` 发生在父组件 render 中，和 `loc={[x.value, ...]}` 一样被 Vue 追踪，值变化后父组件重渲染、`bindings` prop 更新、`<custom>` 重绘；说明 `render` 函数本身不需要认识 Vue、`Ref` 或 `watch`；保留对[《响应式》](./reactivity.md)的链接，删除 `Ref[]` 写法。
- `custom-and-container-custom.md`：`::: warning` 改为不要在 `render` 里修改用于 `bindings` 的响应式值（例如渲染时递增 `angle.value`），并保留「一般不会遇到、高级 III 再讲」。
- `custom-and-container-custom.md`：示例注释与 JSX 改为 `bindings={[angle.value]}`；live 说明改为「角度值通过 `bindings` 触发重绘」。
- `custom-demo.tsx`：`<custom>` 改为 `bindings={[angle.value]}`；保留「−15°」「+15°」两个按钮改 `angle`，父组件 render 读取 `angle.value` 后，按钮应能触发重绘；注释与底部说明同步为 `angle.value`。
- 全文检索确认不再出现 `Ref[]` 与 `bindings={[angle]}`，使用 `bindings={[angle.value]}`。
- 未写元素层 TS，未写 live 尺寸说明。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 43 轮（2026-11-04，已执行）

**用户意见（核心）：** 补 `basic-shapes.md` 的填充 / 描边细节：默认填充的元素只写 `stroke` 会变成只描边、不再填充；默认填充只在没写 `stroke`（也没写 `strokeAndFill`）时生效；要同时填充和描边必须显式写 `fill` + `stroke`，或用 `strokeAndFill`；配一个短 TSX 示例和在「默认值与注意」里的同义提醒。

| #    | 用户意见                                                                                                                                                                                                                                                                                                     | 落点                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| U-43 | 在默认模式说明后补：默认填充的图形只写 `stroke` 会切成只描边、不再填充；默认填充只在没写 `stroke`（也没写 `strokeAndFill`）时生效；同时填充和描边必须显式写 `fill` + `stroke` 或用 `strokeAndFill`；补短 TSX 示例（默认填充的 `g-rect` 只写 `stroke`，注释「只画边框，不填充」）；「默认值与注意」补同义提醒 | `docs/advanced/ii/ui/basic-shapes.md`；本记录 |

**状态：已执行（2026-11-04）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/basic-shapes.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `basic-shapes.md`「先讲通用规则」：在默认模式说明段后补一段——默认填充的图形只要写了 `stroke`、又没写过 `fill`，模式就会切换成只描边、原来的填充不再生效；默认填充只在「没写 `stroke`、也没写 `strokeAndFill`」时成立；同时填充和描边必须显式写 `fill` + `stroke`，或直接用 `strokeAndFill`。
- `basic-shapes.md`：补一个短 TSX 示例，第一个 `g-rect` 是默认填充但只写 `stroke`，注释写明「只画边框，不填充」；第二个对照示例显式写 `fill` + `stroke`。
- `basic-shapes.md`「默认值与注意」：补一条同义提醒，说明默认填充只在没写 `stroke` 时生效、要两者都有就显式写 `fill` + `stroke`。
- 未写元素层 TS，未写 live 尺寸说明。
- 验证：`pnpm exec prettier --check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 44 轮（2026-11-05，已执行）

**用户意见（核心）：** `reactivity.md` 不要提 VNode / VNode 树 / 新旧 VNode，改用「渲染函数重新执行」和「渲染器比较新旧结果并 patch 变化属性」表达；第一个示例使用与 `ui-template.md` 一致的完整标准模板并用计数器展示 `count.value`；后续示例简化为 `// setup` 与 `// 组件内容`，容器统一 `FULL_LOC`；live 就近放在对应小节，删除文末综合 live；新增 4 个 demo 并删除旧 `reactivity-demo.tsx`。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                       | 落点                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| U-44 | 改写 `reactivity.md`：去掉 VNode 表述；首个示例用完整标准模板（`GameUI` / `SetupComponentOptions` / `DefaultProps` / `IGameUIPropsBase` / `FULL_LOC` / `myPanelProps` / `MyPanel` / `MyPanelUI`）并展示计数器；后续示例只写 `// setup` 与 `// 组件内容`，容器用 `FULL_LOC`；counter / reactive / computed / watch 四个 live 分别就近放在对应节后，删除文末 `## 运行效果`；新增 4 个 480×320 demo，删除旧 `reactivity-demo.tsx` | `docs/advanced/ii/ui/reactivity.md`、4 个新 demo、删除 `reactivity-demo.tsx`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/reactivity.md`、新增 `docs/.vitepress/components/demos/ui/reactivity-counter-demo.tsx` / `reactivity-reactive-demo.tsx` / `reactivity-computed-demo.tsx` / `reactivity-watch-demo.tsx`、删除 `docs/.vitepress/components/demos/ui/reactivity-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `reactivity.md`：删除「VNode」「VNode 树」「新旧 VNode」表述，链路改为「数据 → 组件渲染函数 → 重新执行得到新的渲染结果 → 渲染器比较新旧结果并只 patch 变化属性 → 标记重绘」，mermaid 的节点同步改为「新的渲染结果」；父组件重渲染段落改为子组件渲染函数重新执行、比较 props 与 slots。
- 第一个示例改为与 `ui-template.md` 一致的完整标准模板，`MyPanel` 内用 `count = ref(0)` 与按钮展示 `count.value`；后面 `ref`、`ref` 包对象、`reactive`、`computed`、`nextTick`、两种 `ref`、`watch` 示例统一简化为 `// setup`（上半）与 `// 组件内容`（下半），不再重复 imports 与完整模板；所有示例容器改用 `FULL_LOC`。
- 删除 `## 运行效果` 整节；live 就近放置：第一个示例后 `counterLoader`，`reactive` 节后 `reactiveLoader`，`computed` 节后 `computedLoader`，`watch` 节后 `watchLoader`，每个 live 下各一句说明；`<script setup>` 改为四个 loader。
- 新增 4 个 demo：`reactivity-counter-demo.tsx`（计数）、`reactivity-reactive-demo.tsx`（开关 / 标题）、`reactivity-computed-demo.tsx`（count / doubled）、`reactivity-watch-demo.tsx`（count / log）；均为 480×320、深色背景、内容不重叠。
- 删除旧 `reactivity-demo.tsx` 前确认除 `reactivity.md` 外无其它引用；全文检索确认页面不再出现 VNode。
- 未写元素层 TS，未写 live 尺寸说明。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 四个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 45 轮（2026-11-05，已执行）

**用户意见（核心）：** 删除 `reactivity.md` 的「响应式与元素生命周期的边界」「响应式作为界面零件」两节及只服务这两节的孤立内容；第一次出现 `onClick` 处补说明并链接事件篇；把「数据变化如何走到渲染树」简化到只保留一条结论与三节点流程图；其余响应式内容与四个就地 live 不动。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 落点                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| U-45 | 删除整节 `## 响应式与元素生命周期的边界` 和 `## 响应式作为界面零件`，同时删除只服务这两节的孤立内容与边界条目（重渲染不重置元素、`ref(0)` 与 `ref={box}` 对照）；第一次出现 `onClick` 的地方加说明并链接 `./events.md`（交互事件后面讲，这里只当作改变数据的方式）；简化 `## 数据变化如何走到渲染树`，删掉 5 步列表和过细的 patch / 组件级 / 元素级解释，只保留「响应式值变化 → 读取过它的组件重新执行渲染函数 → 元素属性 / 子组件更新；没读取的组件不因这次变化更新」，可保留三节点 mermaid，不提 VNode；保留其余响应式内容与四个就地 live | `docs/advanced/ii/ui/reactivity.md`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/reactivity.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `reactivity.md`：删除 `## 响应式与元素生命周期的边界` 与 `## 响应式作为界面零件` 两节，包括 `hidden` / 三元 / `key` 的生命周期说明、`ref(0)` 与 `ref={box}` 对照示例与状态归属表。
- `## 边界与注意` 删除「粒度是组件不是元素」「重渲染不会重置元素」「`ref(0)` 与 `ref={box}`」三条，保留 `reactive` 整体替换、解构丢响应式、`ref` 忘写 `.value`、渲染函数不做副作用四条。
- 「数据变化如何走到渲染树」改为一段结论句「响应式值变化后，读取过它的组件会重新执行渲染函数，对应元素的属性或子组件随之更新；没有读取它的组件不会因为这次变化而更新。」加三节点 mermaid（响应式值变化 → 读取过它的组件重新执行渲染函数 → 元素属性 / 子组件更新）；删除 5 步列表、粒度说明、父子组件 props / slots 比较段与「第二次渲染 container / g-rect 不会重建」段；未提 VNode。
- 首次出现 `onClick` 的模板前补一句「示例里的 `onClick` 是交互事件，后面[事件与交互](./events.md)会专门讲；这里只把它当作改变数据的方式。」
- 四个 live 数量与位置不变（counter / reactive / computed / watch 各就地保留）；未写元素层 TS、未写 live 尺寸说明。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 46 轮（2026-11-05，已执行）

**用户意见（核心）：** `events.md` 的开头不应先讲命中测试，应先讲冒泡 / 捕获方向；内置事件、事件对象、`stopPropagation` 各配一个就近 live；详细触发模型放到最后；删除文末综合 live，拆成四个 demo。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 落点                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| U-46 | 重写 `events.md`：开头只讲冒泡 / 捕获方向；先讲内置事件与 click 语义，再讲事件对象与 `stopPropagation`；最后讲命中测试、完整捕获 / 冒泡顺序、`enter` / `leave` 悬停集合、坐标变换与 `noevent` / `cursor` / `actionStroke`；四个 live 分别就近放在内置事件、事件对象、`stopPropagation`、`enter` / `leave` 后；首个示例用标准模板，后续示例用 `// setup` + `// 组件内容`；删除文末综合 live 与 `eventsLoader`，新增 `events-basic-demo` / `events-coordinates-demo` / `events-propagate-demo` / `events-hover-demo`，删除旧 `events-demo.tsx`；不提 VNode，不写元素层 TS 与 live 尺寸说明 | `docs/advanced/ii/ui/events.md`、4 个新 demo、删除 `events-demo.tsx`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/events.md`、新增 `docs/.vitepress/components/demos/ui/events-basic-demo.tsx` / `events-coordinates-demo.tsx` / `events-propagate-demo.tsx` / `events-hover-demo.tsx`、删除 `docs/.vitepress/components/demos/ui/events-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `events.md` 开头只说明冒泡是里面先生效、捕获是外面先生效，并说明点按钮应先由按钮自己处理，所以默认事件走冒泡；命中测试与完整模型移到文末。
- `## 内置事件及用法`：给冒泡 / 捕获事件名与触发时机表；说明 click 是同一元素上的 down + up、up 先于 click、移出后在元素外抬起不产生 click；首个示例使用与 `ui-template.md` 一致的完整标准模板（`GameUI` / `SetupComponentOptions` / `DefaultProps` / `IGameUIPropsBase` / `FULL_LOC` / `myPanelProps` / `MyPanel` / `MyPanelUI`），后续示例只写 `// setup` 与 `// 组件内容`；内置事件后放 `events-basic` live。
- `## 事件对象`：覆盖 `target` / `touch` / `type` / `buttons` / `identifier` / 修饰键 / `offsetX` / `offsetY` / `absoluteX` / `absoluteY` / `stopPropagation()`，滚轮补 `wheelX` / `wheelY` / `wheelZ` / `wheelType`；说明 `type` 与 `buttons` 的区别、`MouseType` / `WheelType` 从 `@motajs/render` 导入；事件对象后放 `events-coordinates` live。
- `## stopPropagation：停止传播`：说明捕获阶段截断内层捕获与整段冒泡、冒泡阶段截断外层冒泡、不阻止同一元素同事件名的其它监听器、不阻止浏览器默认行为；保留三层调用位置与日志结果表；放 `events-propagate` live（嵌套容器 + 可切换 stop）。
- `## 事件的完整触发模型` 放在最后：命中测试按从根开始、`zIndex` 大优先、同层后加入优先、`hidden` / `noevent`、图形按几何、`actionStroke`、命中即停说明；捕获 / 冒泡完整顺序配 `sequenceDiagram` 与三层代码；`enter` / `leave` 用悬停集合差集模型说明并放 `events-hover` live（enter / leave / wheel / cursor）；坐标与变换说明 `offset` 局部坐标、`absolute` 画布坐标；`noevent`、`cursor`、`actionStroke` 统一放在模型内。
- 删除文末 `## 运行效果`、`eventsLoader` 与旧 `events-demo.tsx`；新增四个 demo，均为 480×320、深色背景、内容不重叠，并在会遮挡交互的说明文字上使用 `noevent`，保证点击与悬停落到目标元素。
- 未写 VNode、元素层 TS、live 尺寸说明；不假设应用场景。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 四个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 47 轮（2026-11-05，已执行）

**用户意见（核心）：** 修正 click 语义；事件页所有 TSX 示例补清晰注释；事件对象改为多个小章节并补充信息；`stopPropagation` live 每次点击只显示本次事件；`noevent` / `cursor` / `actionStroke` 独立成节并前置；简化完整触发模型，删除命中明细与三层代码，不写 VNode。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 落点                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| U-47 | 修正 click 说明：指针移出后在元素外抬起，只触发另一个元素的 `onUp`，当前元素不触发 `onClick`；事件页所有 TSX 示例补注释，解释意图 / 顺序 / 坐标；事件对象删除表格，改为 `target`、`type` 与 `buttons`、标识符与触摸、修饰键、坐标、滚轮、`stopPropagation` 小章节；`events-propagate-demo` 每次点击由外层捕获清空日志，只显示本次交互，并补「只显示本次点击」；`noevent` / `cursor` / `actionStroke` 从完整模型移出并前置；完整模型只讲命中、捕获、冒泡与 `enter` / `leave` 悬停集合，保留一张 mermaid，删除 6 步命中明细与三层代码 | `docs/advanced/ii/ui/events.md`、`docs/.vitepress/components/demos/ui/events-propagate-demo.tsx`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/events.md`、`docs/.vitepress/components/demos/ui/events-propagate-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `events.md`：click 段改为「按下后把指针移出元素、在元素外抬起，只会触发另一个元素的 `onUp`，当前元素不会触发 `onClick`」，不再写成容易误解的「只会触发 onUp」。
- `events.md`：内置事件的标准模板、事件对象的 `target` / `type` 与 `buttons` / 标识符与触摸 / 修饰键 / 坐标 / 滚轮示例全部补注释，注释说明意图、触发顺序或坐标基准；不再出现无注释的 TSX 代码块。
- `events.md`：删除事件对象表格，改为 `### target`、`### 按键：type 与 buttons`、`### 标识符与触摸`、`### 修饰键`、`### 坐标`、`### 滚轮`、`### stopPropagation` 七个小组；补充 `target` 是处理元素自己、`type` 是本次触发键而 `buttons` 是当前按住键、抬起 / 点击时 `buttons` 不含刚抬起的键、`identifier` 串起多指、修饰键含义、局部 / 画布坐标与变换反算、`wheelX` / `wheelY` / `wheelZ` 与 `wheelType` 单位。
- `events.md`：`noevent`、`cursor` 与 `actionStroke` 移出完整模型，改为 `## noevent、cursor 与 actionStroke` 并放在 `## 事件的完整触发模型` 之前；保留原内容，只压缩命中宽度的底层展开。
- `events.md`：`## 事件的完整触发模型` 只保留「先找最上层命中元素 → 从根到目标捕获 → 从目标到根冒泡」的大致流程与一张 `sequenceDiagram`，删除原 6 步命中明细、三层代码和过深解释；`enter` / `leave` 改为悬停集合差集说明并保留 `events-hover` live；全文不出现 VNode。
- 四个 live 的就近位置保持不变：内置事件后 `events-basic`、事件对象坐标后 `events-coordinates`、`stopPropagation` 节后 `events-propagate`、`enter` / `leave` 节后 `events-hover`；未新增文末综合 live。
- `events-propagate-demo.tsx`：删除累积与 `slice(-6)`，改为每次点击由外层捕获执行 `log.value = ['外层捕获']`，后续事件用 `push` 追加；保留 stop 开关与按钮冒泡处的 `stopPropagation`；右侧新增「只显示本次点击」说明文字。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/events-propagate-demo.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 48 轮（2026-11-05，已执行）

**用户意见（核心）：** 事件回调统一写成命名函数；`events.md` 补一条回调写法说明；所有 TSX 示例与四个事件 demo 的内联回调改成命名函数，只有需要额外参数时才保留内联包装。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | 落点                                                   |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| U-48 | 事件回调建议单独声明，例如 `const handleClick = (ev) => {...}`，然后 `onClick={handleClick}`；只有需要额外参数时才内联 `onClick={() => handleClick(param)}`；只使用事件对象时直接传函数。把 `events.md` 所有 TSX 示例与 `events-basic-demo` / `events-coordinates-demo` / `events-propagate-demo` / `events-hover-demo` 的内联事件回调改成命名函数，需要事件对象时声明带参数函数并可从 `@motajs/render` 引入 `IActionEvent` / `IWheelEvent`；不改变页面结构、live 位置与事件语义 | `docs/advanced/ii/ui/events.md`、4 个事件 demo；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/events.md`、`docs/.vitepress/components/demos/ui/events-basic-demo.tsx` / `events-coordinates-demo.tsx` / `events-propagate-demo.tsx` / `events-hover-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `events.md`：在「内置事件及用法」的属性说明之后补一条回调写法风格说明：先声明 `const handleClick = (ev) => {...}`，再写 `onClick={handleClick}`；只有需要额外参数时才内联 `onClick={() => handleClick(param)}`；只用到事件对象时直接传函数；需要类型时可从 `@motajs/render` 引入 `IActionEvent` / `IWheelEvent`。
- `events.md`：标准模板与 `target`、`type` / `buttons`、`identifier` / `touch`、修饰键、坐标、滚轮六个示例的内联事件回调全部改为命名函数；需要事件对象的函数补 `IActionEvent` / `IWheelEvent` 参数类型，不需要事件对象的声明无参函数；原有意图注释保留。
- `events-basic-demo.tsx`：按下 / 抬起 / 点击 / 进入 / 离开改为无参命名函数，移动 / 滚轮改为带 `IActionEvent` / `IWheelEvent` 参数的命名函数。
- `events-coordinates-demo.tsx`：外层移动与点击复用 `handleOuterPoint`，内层移动与点击复用 `handleInnerPoint`，离开改为无参 `handleInnerLeave`；坐标计算逻辑与更新目标不变。
- `events-propagate-demo.tsx`：stop 开关、外层捕获 / 冒泡、内层捕获 / 冒泡、按钮捕获改为无参命名函数；按钮冒泡改为带 `IActionEvent` 参数的 `handleButtonBubble`，`stopPropagation` 行为不变。
- `events-hover-demo.tsx`：外层 / 内层 enter、leave 改为无参命名函数，外层滚轮改为带 `IWheelEvent` 参数的 `handleOuterWheel`；cursor 与状态更新不变。
- 页面结构、四个 live 的就近位置、事件语义均未改变；只在需要事件对象或额外参数时改变回调声明方式。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 四个事件 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 49 轮（2026-11-05，已执行）

**用户意见（核心）：** 明确按键指令与分组定义在 `src/client/misc/hotkey.ts` 的 `initializeHotkey`，不要在 UI 组件里注册；组件只通过 `useKey().implement()` 接回调；`useKey` 返回对象只有 `implement()` / `scope()`，不是 `system`；补充辅助按键匹配与回调判断；压缩内部实现细节，删除组件内注册示例。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 落点                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| U-49 | 重写 `hotkey-in-ui.md`：明确指令 / 分组定义在 `src/client/misc/hotkey.ts` 的 `initializeHotkey`，组件里 `system.addCommand` / `hotkey.setGroup` 是错误写法，删除现有组件内注册示例并改成 `hotkey.ts` 注册示例；讲清指令全局命名 / 默认按键 / `addCommand`、作用域跟组件生命周期与栈顶规则、组件只 `useKey(...).implement()`、分组只在 `hotkey.ts` 用 `setGroup` 且只影响设置界面；说明 `useKey` 返回对象只含 `implement()` / `scope()`，需要 `addCommand` / `setGroup` 时单独取 `props.state.hotkey.system` / `props.state.hotkey`；补 `defaults` 二维数组、辅助键先于主键、`[[Ctrl, S]]` 单按 S 不匹配、多组组合、`info.context` / `info.keys` / `info.index` 与 `hotkey.ts` + 组件回调示例；保留 `HotkeyEmitMode`、优先级 / 阻断、UI 栈、`clearImpl`，不展开内部实现；删除指令改成最后一句带过；`useKey` 必须 `setup` 同步调用、可能为 `null`、组件内非空断言；不写 VNode、元素层 TS、不假设应用场景，保留两条路径与默认按键 | `docs/advanced/ii/ui/hotkey-in-ui.md`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/hotkey-in-ui.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `hotkey-in-ui.md`：新增「指令与分组定义在 src/client/misc/hotkey.ts」，明确 `system.addCommand` / `hotkey.setGroup` 只在 `initializeHotkey` 里调用，组件里调用是错误写法；给出 `hotkey.ts` 的注册示例；说明指令 id 命名、默认按键、重复注册行为与门面 / `system` 的分工。
- `hotkey-in-ui.md`：`useKey` 一节明确必须在 `setup` 同步调用、返回可能为 `null`、组件内用非空断言；说明返回对象只含 `implement()` / `scope()`，不是 `system`，需要 `addCommand` / `setGroup` 时单独取 `props.state.hotkey.system` / `props.state.hotkey`；保留挂载进入 / 卸载离开、栈顶生效、`hidden` 不离开与 `clearImpl`。
- `hotkey-in-ui.md`：组件示例只保留 `useKey(...).implement(command, callback)`；删除组件内 `addCommand` / `setGroup` / `onUnmounted` 删除指令等示例；注销 / 删除指令压缩为文末最后一句。
- `hotkey-in-ui.md`：新增「辅助按键：一条指令匹配多组组合」，说明 `defaults` 二维数组、组内最后一个键为主键、辅助键先于主键按下、`[[KeyCode.Ctrl, KeyCode.KeyS]]` 单按 S 不匹配、多组组合精确匹配；给出 `hotkey.ts` 定义与组件回调用 `info.context` / `info.index` / `info.keys` 判断的简短示例。
- `hotkey-in-ui.md`：保留 `HotkeyEmitMode` 表、优先级 / 阻断、按键与 UI 栈关系、默认按键表与两条路径说明；删除激励源与逐帧累计等内部实现细节；未写 VNode、元素层 TS，未假设具体应用场景。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 50 轮（2026-11-05，已执行）

**用户意见（核心）：** `hotkey-in-ui.md` 的标题只用名词短语，不用句子或祈使句；同步旧锚点引用。

| #    | 用户意见                                                                                                                                                                                                                                                                                            | 落点                                                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| U-50 | `hotkey-in-ui.md` 六个标题改为名词短语：`按键与元素事件`、`指令与分组`、`useKey 与组件作用域`、`implement：指令实现`、`辅助按键与按键组合`、`按键与 UI 栈`；其他句子 / 祈使句标题同样改为名词短语；正文不改；同步 `replace-builtin-ui.md` 与 `ui-controller-and-stack.md` 的 `#按键与-ui-栈` 旧锚点 | `docs/advanced/ii/ui/hotkey-in-ui.md`、`replace-builtin-ui.md`、`ui-controller-and-stack.md`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/hotkey-in-ui.md`、`docs/advanced/ii/ui/replace-builtin-ui.md`、`docs/advanced/ii/ui/ui-controller-and-stack.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `hotkey-in-ui.md`：六个标题依次改为 `## 按键与元素事件`、`## 指令与分组`、`## useKey 与组件作用域`、`## implement：指令实现`、`## 辅助按键与按键组合`、`## 按键与 UI 栈`；`## 触发方式：HotkeyEmitMode`、`## 优先级与阻断`、`## 默认按键`、`## 边界与注意` 已是名词短语，未改；正文未改。
- `replace-builtin-ui.md` 第 148 行与 `ui-controller-and-stack.md` 第 271 行的锚点 `#按键与-ui-栈的关系` 同步改为 `#按键与-ui-栈`。
- 验证：`pnpm exec prettier --check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 51 轮（2026-11-05，已执行）

**用户意见（核心）：** 按 U-51 重新整理 `hotkey-in-ui.md`：重点讲应用，减少原理和来回跳；分组示例改成项目已有写法；重排章节，让每节只讲自己的内容；明确一般情况下不需要 `info`。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 落点                                          |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| U-51 | 重新整理 `hotkey-in-ui.md`：分组示例改为在 `hotkey.setGroup` 的数组里直接 `system.addCommand(...)`，不要先 `const refresh` 再传数组；章节重排为 `按键与元素事件`（只保留两条路径的简短区别）、`指令与分组`（hotkey.ts 注册、分组、指令 id、默认键，子标题 `触发方式`、`优先级与阻断`）、`组件中的实现`（合并 useKey、implement、作用域生命周期；明确 useKey 只返回 implement / scope、不是 system；setup 同步调用、非空断言、clearImpl、子组件传 system）、`辅助按键与按键组合`（defaults 主键 / 辅助键，info.context / keys / index，只在这里讲 info）、`按键与 UI 栈`、`默认按键`、`边界与注意`；明确一般情况下不需要 `info`，回调写 `() =>` 即可，只有需要区分辅助键、具体组合或触发方式时才接收 `info`；减少底层原理和重复解释，重点写怎么用、在哪里写、什么时候需要额外参数；保留 `#按键与-ui-栈` 锚点；不写 VNode、元素层 TS，不假设应用场景 | `docs/advanced/ii/ui/hotkey-in-ui.md`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/hotkey-in-ui.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- 分组示例改为 `hotkey.setGroup('@my-ui', '我的界面', [system.addCommand(...), system.addCommand(...)])`，不再先声明 `const refresh` 再传数组；示例同时展示 `defaults` 与 `mode`。
- 章节重排为 `## 按键与元素事件`（只保留两条路径的简短区别）、`## 指令与分组`（注册、分组、指令 id、默认键，子标题 `### 触发方式`、`### 优先级与阻断`）、`## 组件中的实现`（合并 useKey、implement、作用域生命周期，含 `### 作用域与生命周期`、`### 子组件`）、`## 辅助按键与按键组合`（defaults 主副键与 `info`）、`## 按键与 UI 栈`、`## 默认按键`、`## 边界与注意`。
- `## 组件中的实现` 明确 `useKey` 只返回 `implement()` / `scope()`，不是 `system`；必须在 `setup` 中同步调用、返回可能为 `null`、组件内用非空断言；说明 `clearImpl` 与子组件传 `props.state.hotkey.system`。
- `info` 只在 `## 辅助按键与按键组合` 讲：`context` / `keys` / `index` / `mode`；同时明确一般情况下不需要 `info`，回调写 `() =>` 即可，只有需要区分辅助键、具体组合或触发方式时才接收。
- 保留 `## 按键与 UI 栈` 标题与 `#按键与-ui-栈` 锚点，`replace-builtin-ui.md` 与 `ui-controller-and-stack.md` 的既有引用无需同步修改；未写 VNode、元素层 TS，未假设应用场景。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 52 轮（2026-11-05，已执行）

**用户意见（核心）：** 在 `hotkey-in-ui.md` 补充 `useKey().when()`：返回对象补上 `when()`；新增「启用条件：when」说明作用域级启用条件、按下时判断、临时禁用与示例；同步边界与注意。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                      | 落点                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| U-52 | `hotkey-in-ui.md` 的 `useKey` 返回对象由「只有 `implement()` 和 `scope()`」改为「只有 `implement()`、`scope()`、`when()`」，保留不是 `system` 的说明；在 `## 组件中的实现` 下新增 `### 启用条件：when`，说明 `when(() => boolean)` 给当前作用域设置启用条件、返回 `false` 时指令不触发、条件在按下时判断、适合临时禁用、条件里读响应式值，并给简短示例；说明 `when` 作用于当前 `useKey` 的作用域而非全局系统；同步 `## 边界与注意` 的对应条目 | `docs/advanced/ii/ui/hotkey-in-ui.md`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/hotkey-in-ui.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `hotkey-in-ui.md`：`## 组件中的实现` 与 `## 边界与注意` 中「`useKey` 返回的对象只有 `implement()` 和 `scope()`」均改为「只有 `implement()`、`scope()`、`when()`」，保留「不是按键系统 / 不是 `system`」及不要在其上调用按键系统方法的说明。
- `hotkey-in-ui.md`：在 `## 组件中的实现` 下新增 `### 启用条件：when`，说明 `when(() => boolean)` 给当前 `useKey` 的作用域设置启用条件、返回 `false` 时该界面的指令不触发、适合临时禁用当前界面的快捷键；说明条件在按键按下时判断一次，不能依赖「按下时 `false`、抬起时 `true`」触发；给出 `ref` 响应式值 + `when` + `implement` 的简短示例；说明 `when` 作用于当前 `useKey` 的作用域而非全局系统，不要在其他作用域上调用它来改当前界面。
- 未改变其它章节结构，未写内部实现，未写 VNode。
- 验证：`pnpm exec prettier --check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 53 轮（2026-11-05，已执行）

**用户意见（核心）：** `hotkey-in-ui.md` 的辅助按键部分不要教读者按具体按键分支；玩家可以改键，按键和组合会变，应按语义拆成不同指令。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 落点                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| U-53 | 明确一般不要判断具体按键（包括 `info.keys`、`info.context`）；同一语义、多种默认组合用一条指令的多个 `defaults`，组件只 `implement` 一次、不需要 `info`；不同语义拆成不同指令，各自注册、各自 `implement`；把原来一条 `@my-ui/save` 含 Ctrl+S / Shift+S / S 再按 `info.context` 分支的示例改成 `@my-ui/save`（Ctrl+S）与 `@my-ui/quick-save`（S）两条指令；删除 `info.context` 区分示例与「优先看 `info.context`」；`info` 只保留「一般不需要，确实需要触发元信息时才接收，不要用它判断语义」；边界补一条不要按具体按键 / `info.keys` 判断行为 | `docs/advanced/ii/ui/hotkey-in-ui.md`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/hotkey-in-ui.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `hotkey-in-ui.md` 的 `## 辅助按键与按键组合`：新增「一般不要判断具体按键，包括 `info.keys` 和 `info.context`」及原因（玩家可以改键，按键和组合会变，按当前键位分支会得到错误的语义）。
- 同一语义、多种默认组合：用 `@my-ui/refresh` 的 `defaults: [[KeyCode.KeyR], [KeyCode.Shift, KeyCode.KeyR]]` 说明一条指令写多个组合、组件只 `implement` 一次、不需要 `info`。
- 不同语义：把原 `@my-ui/save` 的 Ctrl+S / Shift+S / S 三组示例改为 `@my-ui/save`（Ctrl+S）与 `@my-ui/quick-save`（S）两条指令，各自 `system.addCommand`；组件示例改为分别 `key.implement('@my-ui/save', save)` 与 `key.implement('@my-ui/quick-save', quickSave)`。
- 删除 `info.context` 分支示例、`info` 的 `context` / `keys` / `index` / `mode` 列表与「判断时优先看 `info.context`」指导；`info` 只保留一句「一般不需要；确实需要触发元信息时才接收，不要用它判断语义」。
- `## 组件中的实现` 中「只有需要区分辅助键、具体组合或触发方式时，才接收 `info`」同步改为「只有确实需要触发元信息时才接收 `info`，不要用它判断语义」，避免与辅助按键部分冲突。
- `## 边界与注意` 补一条：不要按具体按键、`info.keys` 或 `info.context` 判断行为；玩家可以改键，按键和组合会变，按当前键位分支会得到错误的语义；语义不同就拆成不同指令。
- 未改变其它章节结构，未写内部实现，未写 VNode。
- 验证：`cmd /c "pnpm exec prettier --check docs/advanced/ii/ui/hotkey-in-ui.md .planning/phases/10-docs-restructure/10-54-USER-REVIEW.md"` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 54 轮（2026-11-05，已执行）

**用户意见（核心）：** `hotkey-in-ui.md` 的辅助按键部分补一个确实需要 `info` 的例子：一条指令用 `defaults` 的组合顺序表示多个语义槽位，回调按 `info.index` 取槽位，不判断具体按键。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                             | 落点                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| U-54 | 在 `## 辅助按键与按键组合` 的 `info` 说明之后补「快速切换装备」示例：`hotkey.ts` 注册一条 `@my-ui/quick-equip`，`defaults` 按槽位顺序写 `Alt+1` 到 `Alt+0` 十组；组件回调接收 `info`，用 `info.index` 作为装备槽位（0–9）；说明一条指令有多个语义槽位、槽位由组合顺序稳定决定，不要判断 `info.keys` 或具体数字键（玩家改键后按键会变，`info.index` 仍对应槽位）；代码沿用 `setGroup` 数组内直接 `system.addCommand` 的写法并加必要注释；不改其它章节 | `docs/advanced/ii/ui/hotkey-in-ui.md`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/hotkey-in-ui.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它页面 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `hotkey-in-ui.md` 的 `## 辅助按键与按键组合` 末尾、`info` 说明之后新增一段：确实需要 `info` 时，通常是一条指令有多个语义槽位，槽位由 `defaults` 里的组合顺序稳定决定，组件只按 `info.index` 取槽位。
- 新增 `hotkey.ts` 示例：在 `hotkey.setGroup('@my-ui', '我的界面', [...])` 的数组里直接 `system.addCommand('@my-ui/quick-equip', '快速切换装备', { defaults: [...] })`，`defaults` 依次为 `[KeyCode.Alt, KeyCode.Digit1]` 到 `[KeyCode.Alt, KeyCode.Digit0]`，每组注释标出槽位 0–9，保持数组顺序与槽位对应。
- 新增组件示例：`const quickEquip = (info: IHotkeyEmitInfo) => { const slot = info.index; ... }`，随后 `key.implement('@my-ui/quick-equip', quickEquip)`；`IHotkeyEmitInfo` 从 `@motajs/system` 导入，注释说明 `info.index` 是触发组合在 `defaults` 里的下标、正好对应装备槽位。
- 补说明：这里需要 `info` 是因为一条指令有多个语义槽位，槽位由组合顺序稳定决定；不要判断 `info.keys` 或具体的数字键，玩家改键后按键会变，但 `info.index` 仍对应槽位。
- 未改动该节其它内容与其它章节；未写内部实现、未写 VNode。
- 验证：`cmd /c "pnpm exec prettier --write docs/advanced/ii/ui/hotkey-in-ui.md .planning/phases/10-docs-restructure/10-54-USER-REVIEW.md"` 后 `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 55 轮（2026-11-05，已执行）

**用户意见（核心）：** 条件渲染页明确推荐 `hidden`；三元只保留简短说明与一个简单示例；不要在属性里内联三元，改在 `setup` 里用 `computed`；事件回调改用命名函数；`hidden`、三元、`key` 三节后各放一个就近 live，删除文末综合 live 与旧 demo；侧边栏把「条件渲染与循环渲染」放到「按键与快捷键」之前。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 落点                                                                                                                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-55 | 侧边栏顺序改为 响应式 → 事件与交互 → 条件渲染与循环渲染 → 按键与快捷键。三元只保留简短说明和一个简单示例：三元会卸载 / 重建、状态重置，只在必须不存在或需要重置时用；删除过长的三类场景与重复解释。明确推荐绝大多数情况用 `hidden`，它占一点内存但一般影响很小，TSX 更平整、少一层缩进。不要在属性里内联三元（如 `fillStyle={row.id === selectedId.value ? ... : ...}`），改为在 `setup` 里写 `computed`，在组件内容里读取，并替换现有内联三元示例。事件回调继续用命名函数，示例中已有的内联 `onClick` 改成命名函数。`hidden` 节后加 `conditional-hidden` live（面板隐藏 / 显示，内部计数保留）；三元节后加 `conditional-ternary` live（面板三元切换，内部计数重置）；`key` 节后加 `conditional-key` live（`key=id` 与 `key=index` 重排对照，本地状态分别跟随 id 或位置）。删除文末综合 live、`conditionalLoader` 与旧 `conditional-demo.tsx`；新建 3 个 480×320、深色背景、不重叠的 demo。保留循环、`key`、数据更新、列表事件等有用内容；不改无关章节；不写 VNode；不写元素层 TS。 | `docs/advanced/ii/ui/conditional-and-list-rendering.md`、`conditional-hidden-demo.tsx`、`conditional-ternary-demo.tsx`、`conditional-key-demo.tsx`、删除 `conditional-demo.tsx`、`docs/.vitepress/config.ts`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/conditional-and-list-rendering.md`、新增 `docs/.vitepress/components/demos/ui/conditional-hidden-demo.tsx` / `conditional-ternary-demo.tsx` / `conditional-key-demo.tsx`、删除 `docs/.vitepress/components/demos/ui/conditional-demo.tsx`、修改 `docs/.vitepress/config.ts` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 页面 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- 侧边栏「交互与数据」顺序改为「响应式」→「事件与交互」→「条件渲染与循环渲染」→「按键与快捷键」，只移动条目，未改链接与文字。
- `conditional-and-list-rendering.md` 开头改为明确推荐 `hidden`：绝大多数情况更划算，只占一点内存、一般影响很小，TSX 更平整、少一层缩进；「条件渲染」一节改名为「条件渲染：优先用 hidden」，保留 `hidden` 不绘制、不命中、保留状态与不影响兄弟坐标的说明。
- 三元一节压缩为「三元：只在必须不存在或需要重置时用」：只保留三元卸载 / 重建、状态重置与使用条件的一句说明和一个简单示例；删除原「三类场景」列表与随后重复的事件监听 / 内存解释。
- 两个示例的内联 `onClick` 改为命名函数：`hidden` 与三元示例用 `togglePanel`，列表与树形示例用 `selectRow`；列表项颜色不再在 `fillStyle` 里内联三元，改为 `setup` 中的 `computed` Map（`fillById`），属性里只读 `fillById.value.get(row.id)`。
- 删除「运行效果」综合 live、`conditionalLoader` 与旧 `conditional-demo.tsx`；在 `hidden`、三元、`key` 三节后分别插入 `conditionalHiddenLoader` / `conditionalTernaryLoader` / `conditionalKeyLoader` 的 `ClientOnly` + `RenderDemo`，并各补一句 live 说明。
- 新增 3 个 demo：`conditional-hidden-demo.tsx`（开关面板，面板内部计数保留）、`conditional-ternary-demo.tsx`（子组件计数随三元卸载重建归零）、`conditional-key-demo.tsx`（左右两份列表用 `key=id` 与 `key=index`，点行内计数后轮换顺序对照状态跟随 id 或位置）；均为 480×320、深色背景、内容不重叠。
- 保留循环、`key`、数据更新表与排查步骤、列表项事件与删除选中态、树形示意与写法选择表；删除 `key` 边界中「也就是列表项这个 VNode 上」的 VNode 表述；未写元素层 TS。
- 验证：`cmd /c "pnpm exec prettier --write docs/advanced/ii/ui/conditional-and-list-rendering.md docs/.vitepress/components/demos/ui/conditional-hidden-demo.tsx docs/.vitepress/components/demos/ui/conditional-ternary-demo.tsx docs/.vitepress/components/demos/ui/conditional-key-demo.tsx docs/.vitepress/config.ts"` 后 `--check` 通过；`cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui/conditional-hidden-demo.tsx docs/.vitepress/components/demos/ui/conditional-ternary-demo.tsx docs/.vitepress/components/demos/ui/conditional-key-demo.tsx"` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 56 轮（2026-11-05，已执行）

**用户意见（核心）：** 按 D-108，已审阅渲染系统文档的 H2/H3 标题统一为名词短语，不用句子、祈使句或问句；未审阅文档不改；被改标题的旧锚点引用同步更新。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 落点                                                                   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| U-56 | 只改已审阅文档标题：`ui-template.md`（模板用法、后续阅读）、`ui-basics.md`（UI 的打开、一行文字、一个矩形、组合、后续）、`first-static-ui.md`（容器、文字、矩形与圆、直线、素材管理器中的图片、后续）、`container-and-coordinates.md`（坐标来源）、`basic-shapes.md`（通用规则：填充、描边与颜色、所有图形的组合）、`text.md`（字体：Font、文字元素用法）、`image-and-texture.md`（贴图管理器中的纹理）、`custom-and-container-custom.md`（选择方式）、`reactivity.md`（数据到渲染、重渲染的触发条件、shallowRef 与 markRaw 的适用场景、props 与解构）、`events.md`（stopPropagation：传播控制、命中目标，保留显式锚点）、`conditional-and-list-rendering.md`（条件渲染与 hidden、三元与节点卸载、循环与 map、key 与元素身份、列表数据的更新、三种写法的选择）；正文不改；同步 `ui-performance.md` 的旧锚点 | `docs/advanced/ii/ui/` 下 11 篇已审阅文档、`ui-performance.md`；本记录 |

**状态：已执行（2026-11-05）**

### 执行记录

- 仅修改上述 11 篇已审阅文档、`docs/advanced/ii/ui/ui-performance.md` 的一处旧锚点引用与本记录；未改正文、demo、配置、计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `ui-template.md`：`## 怎么用这个模板` → `## 模板用法`；`## 接着读` → `## 后续阅读`。
- `ui-basics.md`：`## 打开 UI` → `## UI 的打开`；`## 先写一行字` → `## 一行文字`；`## 再画一个矩形` → `## 一个矩形`；`## 合起来` → `## 组合`；`## 接下来` → `## 后续`。
- `first-static-ui.md`：`## 先放容器` → `## 容器`；`## 加文字` → `## 文字`；`## 加矩形和圆` → `## 矩形与圆`；`## 加一条线` → `## 直线`；`## 从素材管理器取图片` → `## 素材管理器中的图片`；`## 接下来` → `## 后续`。
- `container-and-coordinates.md`：`## 坐标从哪里来` → `## 坐标来源`。
- `basic-shapes.md`：`## 先讲通用规则：填充、描边与颜色` → `## 通用规则：填充、描边与颜色`；`## 所有图形放一起` → `## 所有图形的组合`。
- `text.md`：`## 先讲字体：Font` → `## 字体：Font`；`## 文字元素怎么用` → `## 文字元素用法`。
- `image-and-texture.md`：`## 从贴图管理器取纹理` → `## 贴图管理器中的纹理`。
- `custom-and-container-custom.md`：`## 怎么选` → `## 选择方式`。
- `reactivity.md`：`## 数据变化如何走到渲染树` → `## 数据到渲染`；`## 什么时候会重渲染、什么时候不会` → `## 重渲染的触发条件`；`## 什么时候用 shallowRef 与 markRaw` → `## shallowRef 与 markRaw 的适用场景`；`## props 不要解构` → `## props 与解构`。
- `events.md`：`## stopPropagation：停止传播 {#stop-propagation}` → `## stopPropagation：传播控制 {#stop-propagation}`；`### 命中：先找最上层 {#命中测试事件先找最上层元素}` → `### 命中目标 {#命中测试事件先找最上层元素}`；显式锚点保持不变，第 284 行的 `#stop-propagation` 链接继续有效。
- `conditional-and-list-rendering.md`：`## 条件渲染：优先用 hidden` → `## 条件渲染与 hidden`；`## 三元：只在必须不存在或需要重置时用` → `## 三元与节点卸载`；`## 循环：用 map 生成元素` → `## 循环与 map`；`## key：只在需要保留身份时加` → `## key 与元素身份`；`## 数据怎么变才会更新列表` → `## 列表数据的更新`；`## 三种写法怎么选` → `## 三种写法的选择`。
- `ui-performance.md` 第 60 行的旧锚点 `#key只在需要保留身份时加` 同步改为 `#key-与元素身份`；全站检索确认没有其它引用这批旧锚点的链接。
- 未审阅文档（`props`、`component-tsx`、`slots-and-attrs`、`builtin-*`、`ui-controller-and-stack`、`replace-builtin-ui`、`ui-performance`、`inventory-example-*` 等）的标题未改。
- 验证：`pnpm exec prettier --check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 57 轮（2026-11-10，已执行）

**用户意见（核心）：** `conditional-and-list-rendering.md` 的「列表数据的更新」不要大表格与排查清单，只讲应用写法：`ref` 列表与 `.value`、`shallowRef` / `reactive` / 普通数组的差异、`computed` 派生列表。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                       | 落点                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| U-57 | 删除「数据形式 / 修改方式 / 是否触发更新」大表格与 5 条排查清单；改为只讲应用：`ref` 保存列表、渲染读 `rows.value`，`push` / `splice` / 改某项字段 / 整体替换都会自动更新，并给短示例；`shallowRef` 只认整体替换、普通数组不触发、`reactive` 可 `push` / `splice` 但不要整体替换变量；过滤 / 排序用 `computed` 派生、渲染读 `computed.value` 并给短示例；改了没更新时只保留一句「确认渲染读的是响应式变量本身 / `.value`，不是普通数组或副本」 | `docs/advanced/ii/ui/conditional-and-list-rendering.md`；本记录 |

**状态：已执行（2026-11-10）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/conditional-and-list-rendering.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它章节、demo、配置、计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `## 列表数据的更新` 删除 7 行数据形式 / 修改方式表格与 5 条排查清单；保留本节标题与原有 `computed` 主题，未展开 Vue 原理、未写 VNode。
- 新增 `ref<Row[]>` 短示例：`setup` 定义 `rows`，组件内容读 `rows.value.map(...)`；正文说明 `push`、`splice`、改某一项字段、整体替换 `rows.value` 都会自动更新。
- 用一段说明 `shallowRef` 只认整体替换、普通数组不触发、`reactive` 可用 `push` / `splice` 但不要整体替换变量；`computed` 示例补充「组件内容读 `visibleRows.value`」，正文说明过滤 / 排序用 `computed` 派生；末尾只保留一句排查方向，不再列清单。
- 验证：`cmd /c "pnpm exec prettier --check docs/advanced/ii/ui/conditional-and-list-rendering.md .planning/phases/10-docs-restructure/10-54-USER-REVIEW.md"` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 58 轮（2026-11-10，已执行）

**用户意见（核心）：** `conditional-and-list-rendering.md` 要把「推荐 `hidden`、三元不作默认」讲清楚；`key` 只留实用规则；列表项一节改成「点击与选中」并聚焦用途；删掉树形示意与三元大示例；写法选择表标出推荐 / 不推荐。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 落点                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| U-58 | `## 条件渲染与 hidden` 明确「大多数情况推荐 `hidden`，不推荐三元」，即使占一点内存一般影响很小、TSX 也更平整；`## 三元与节点卸载` 明确「三元不推荐作为默认方案」，只在必须不存在或需要重置时用；`## key 与元素身份` 删除「几条边界」整个列表，只留实用规则（会增删 / 重排用稳定 `row.id`、不要用会变化的数组下标、静态固定列表可不用 `key`）；`## 列表项的事件与状态` 改为 `## 列表项的点击与选中`，开头说明用途（点击更新选中态、回调带当前行 id、删除 / 重排后仍指向正确项），保留一个短示例（`computed` 算颜色、命名函数处理点击、用 `row.id`），删除事件监听自动销毁与嵌套 `key` 等边界内容，删除选中项后同步选中态保留一句 + 短代码；删除整个 `## 条件/列表的树形示意` 节（含三元示例与长代码）；保留 `## 三种写法的选择`，`hidden` 行写「推荐」、三元行写「不推荐作为默认」；不改其它章节、不写 VNode | `docs/advanced/ii/ui/conditional-and-list-rendering.md`；本记录 |

**状态：已执行（2026-11-10）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/conditional-and-list-rendering.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它章节、demo、配置、计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `## 条件渲染与 hidden` 开头新增一句：大多数情况推荐 `hidden`，不推荐三元；它只多占一点内存、一般影响很小，TSX 也更平整。
- `## 三元与节点卸载` 开头改为「三元不推荐作为默认方案」，保留三元卸载 / 重建、状态重置与使用条件说明。
- `## key 与元素身份` 删除「几条边界」整段列表，替换为「实用规则」三条：会增删 / 重排的列表用稳定的 `row.id` 作为 `key`；不要用会变化的数组下标当身份；静态固定列表可以不用 `key`。
- `## 列表项的事件与状态` 改名为 `## 列表项的点击与选中`；开头说明用途（点击更新选中态、回调带当前行 id、删除 / 重排后仍指向正确项）；保留 `computed` 算每行颜色、命名函数处理点击、用 `row.id` 的短示例；删除「事件监听自动销毁」与「嵌套列表 `key` 作用域」两段边界内容；删除选中项后同步选中态保留一句 + 短代码。
- 删除整个 `## 条件/列表的树形示意` 节（含三元示例、长代码与更新说明）。
- `## 三种写法的选择` 表格保留，`hidden` 行结果改为「推荐：……」，三元行结果改为「不推荐作为默认：……」；其它两行不变。
- 未写 VNode；未改 `## 循环与 map`、`## 列表数据的更新`、`## 边界与注意` 等其它章节。
- 验证：`cmd /c "pnpm exec prettier --check docs/advanced/ii/ui/conditional-and-list-rendering.md .planning/phases/10-docs-restructure/10-54-USER-REVIEW.md"` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 59 轮（2026-11-10，已执行）

**用户意见（核心）：** 恢复 `conditional-and-list-rendering.md` 的「条件/列表的树形示意」，但删除三元，并使用完整标准模板。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 落点                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| U-59 | 在 `## 列表项的点击与选中` 之后、`## 三种写法的选择` 之前恢复 `## 条件/列表的树形示意`；示例改为完整标准 UI 模板（imports、`MyPanelProps`、`myPanelProps`、`defineComponent<MyPanelProps>(props => ..., myPanelProps)`、`new GameUI`）；面板开关用 `hidden={!open.value}`；列表用 `rows.value.map` + `key={row.id}`，点击用命名函数 / 必要的 `() => selectRow(row.id)`；选中颜色用 setup 的 `computed`；右侧详情用 `hidden={selected.value === null}`，不要三元、不要条件表达式、不要 `tab` 状态；说明开关只改 hidden、点列表项改 selectedId、列表颜色与详情更新、全程无卸载 / 重建；不恢复旧三元内容、不改其它章节 | `docs/advanced/ii/ui/conditional-and-list-rendering.md`；本记录 |

**状态：已执行（2026-11-10）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/conditional-and-list-rendering.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它章节、demo、配置、计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- 在 `## 列表项的点击与选中` 之后、`## 三种写法的选择` 之前新增 `## 条件/列表的树形示意`；示例为完整标准模板，包含 `computed` / `defineComponent` / `ref` imports、`GameUI` / `SetupComponentOptions`、`DefaultProps`、`IGameUIPropsBase`、`FULL_LOC`、`MyPanelProps`、`myPanelProps`、`defineComponent<MyPanelProps>(props => ..., myPanelProps)` 与 `new GameUI('my-panel', MyPanel)`。
- 面板开关用 `hidden={!open.value}`；列表用 `rows.value.map((row, index) => ...)` + `key={row.id}`、点击 `() => selectRow(row.id)`；选中颜色由 setup 的 `fillById` computed 提供；右侧详情用 `hidden={selected.value === null}`，全段无三元、无 `tab` 状态。
- 代码后补一段树形说明：开关只改 `hidden`；点列表项改 `selectedId`，列表颜色与详情显示更新；全程没有卸载 / 重建。
- 未恢复旧三元内容，未改其它章节，未写 VNode。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 60 轮（2026-11-10，已执行）

**用户意见（核心）：** 按 D-110，`conditional-and-list-rendering.md` 的 UI 示例不能再用 `export default defineComponent(() => ...)` 包装，统一改为 `// setup` + `// 组件内容` 的简化标准形式。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                         | 落点                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| U-60 | 把 `## 条件渲染与 hidden`、`## 三元与节点卸载`、`## key 与元素身份`、`## 列表数据的更新` 四处 `export default defineComponent(() => { ... })` 示例改为 `// setup` + `// 组件内容` 形式，根容器用 `FULL_LOC`；保留现有逻辑、注释与事件命名函数；删除 `defineComponent` 与不必要的 imports，只有第一个示例保留 `import { ref } from 'vue'`；`## 条件/列表的树形示意` 的完整标准模板与其它章节不动，全文件不再出现 `export default defineComponent` | `docs/advanced/ii/ui/conditional-and-list-rendering.md`；本记录 |

**状态：已执行（2026-11-10）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/conditional-and-list-rendering.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它章节、demo、配置、计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `## 条件渲染与 hidden`：删除 `defineComponent` 包装与 `defineComponent` import，保留 `import { ref } from 'vue'`；改为 `// setup`（`open`、命名函数 `togglePanel`）+ `// 组件内容`（`<container loc={FULL_LOC}>`）。
- `## 三元与节点卸载`：删除 `defineComponent` 包装与 imports，保留三元这一个简单示例；改为 `// setup` + `// 组件内容`，根容器用 `FULL_LOC`。
- `## key 与元素身份`：删除 `defineComponent` 包装与 imports，保留 `interface Row` 与 `ref<Row[]>`；改为 `// setup` + `// 组件内容`，根容器用 `FULL_LOC`。
- `## 列表数据的更新`：删除 `defineComponent` 包装与 imports，保留 `interface Row` 与 `ref<Row[]>`；改为 `// setup` + `// 组件内容`，根容器用 `FULL_LOC`；`computed` 示例原本已是该形式，未动。
- `## 条件/列表的树形示意` 的完整标准模板未改；全文件检索确认不再出现 `export default defineComponent`。
- 未写 VNode、未写元素层 TS；未改 `## 循环与 map`、`## 列表项的点击与选中`、`## 三种写法的选择`、`## 边界与注意` 等其它章节。
- 验证：`cmd /c "pnpm exec prettier --write docs/advanced/ii/ui/conditional-and-list-rendering.md .planning/phases/10-docs-restructure/10-54-USER-REVIEW.md"` 后 `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 61 轮（2026-11-10，已执行）

**用户意见（核心）：** 删除 `conditional-and-list-rendering.md` 的 `## 列表项的点击与选中` 整节，保留其后的 `## 条件/列表的树形示意`。

| #    | 用户意见                                                                                                                                                                                                       | 落点                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| U-61 | 删除 `## 列表项的点击与选中` 整节（含 `computed` 颜色示例、命名函数点击示例、删除后同步选中态说明与短代码）；从该标题删到下一个 `## 条件/列表的树形示意` 之前；不影响 `## 列表数据的更新` 与树形示意及其它章节 | `docs/advanced/ii/ui/conditional-and-list-rendering.md`；本记录 |

**状态：已执行（2026-11-10）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/conditional-and-list-rendering.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它章节、demo、配置、计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- 删除 `## 列表项的点击与选中` 整节（44 行）：`computed` 计算每行颜色的示例、命名函数 `selectRow` 示例、删除一项时同步选中态的说明与 `remove` 短代码全部移除；`## 列表数据的更新` 末段与 `## 条件/列表的树形示意` 原样保留。
- 验证：`pnpm exec prettier --check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 62 轮（2026-11-10，已执行）

**用户意见（核心）：** 在「组件化」分组新增首篇《什么是组件》，放在 `props` 之前；只讲组件基本原理与基本 props，配普通组件与标准 UI 模板两个示例及一个 live。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 落点                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| U-62 | 新增 `docs/advanced/ii/ui/what-is-component.md`，放在 `props` 之前：标题《什么是组件》，用名词短语作标题、不讲生命周期；只讲「组件相当于 UI 的函数、接收 props 返回 UI 树、声明一次可重复使用」「GameUI 也是先声明成组件再用 `new GameUI('id', MyPanel)` 定义为 UI」「GameUI 是特殊组件，接收 `controller`、`instance`、`state`，由 UI 系统/控制器打开」「普通组件更自由、可嵌套在任意 UI 树、不是 UI 入口」；只讲基本 props（Props 接口继承 `DefaultProps`、`props` 数组、`defineComponent<Props>`、父传子读、默认值用 `??`），不讲 emits / slots / attrs / 生命周期 / 响应式；给 `ItemCard` 与完整标准模板 `MyPanel` 两个代码示例；新增 `component-basic-demo.tsx` live（480×320、三张卡片不重叠）；侧边栏「组件化」首项改为「什么是组件」，`props` 顺延第二；`ii/index.md` UI 子分组计数 28 改为 29；不改现有 `props` 页 | `what-is-component.md`、`component-basic-demo.tsx`、`config.ts`、`ii/index.md`；本记录 |

**状态：已执行（2026-11-10）**

### 执行记录

- 仅新增 `docs/advanced/ii/ui/what-is-component.md` 与 `docs/.vitepress/components/demos/ui/component-basic-demo.tsx`，修改 `docs/.vitepress/config.ts`、`docs/advanced/ii/index.md` 与本记录；未改 `props` 页及其它正文 / demo / 代码 / 计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `what-is-component.md`：单 H1「什么是组件」；开头用「UI 的函数」说明组件接收 props、返回 UI 树、声明一次可重复使用；`## 用 props 接收数据` 只讲 Props 接口继承 `DefaultProps`、`SetupComponentOptions` 的 `props` 数组、`defineComponent<Props>(props => ...)`、父组件写属性与子组件读 `props.x`、默认值用 `??`；`## 普通组件：ItemCard` 给出接收 `loc`、`label`、`color` 并返回容器 + 矩形 + 文字的示例；`## UI 组件：MyPanel` 说明 GameUI 先声明为组件再 `new GameUI('my-panel', MyPanel)`，能接收来自 `IGameUIPropsBase` 的 `controller`、`instance`、`state`，并说明普通组件可嵌套在任意 UI 树、不是 UI 入口；随后给出完整标准模板，使用两次 `ItemCard`；未写 emits、slots、attrs、生命周期、响应式、VNode。
- 新增 `component-basic-demo.tsx`：父容器 480×320 深色背景，三张 `ItemCard` 分别位于 `[40, 56]`、`[40, 144]`、`[40, 232]`，前两张传 `color`，第三张使用默认颜色，文字与颜色均不同且不重叠；代码含必要说明性注释。
- 侧边栏「组件化」分组首项新增「什么是组件」→ `/advanced/ii/ui/what-is-component`，`props` 顺延为第二项；`docs/advanced/ii/index.md` 的 UI 子分组计数由 28 篇改为 29 篇；其它页面对 `props` 的链接未改。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/component-basic-demo.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 63 轮（2026-11-10，已执行）

**用户意见（核心）：** 普通组件 Props 已继承 `DefaultProps`，再声明 `loc: [number, number]` 会与 `DefaultProps` 自带的 `loc` 类型冲突；示例不应这样写，定位 prop 要换个名字。

| #    | 用户意见                                                                                                                                                                                                                                                                                            | 落点                                                       |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| U-63 | `ItemCard` 的定位 prop 由 `loc` 改名为 `position: [number, number]`，props 数组改为 `['position', 'label', 'color']`；组件根容器仍写 `loc={props.position}`；父模板示例改用 `position={[...]}`；`component-basic-demo.tsx` 同步；仍只讲基本 props，不讲 emits / slots / attrs / 生命周期；不 commit | `what-is-component.md`、`component-basic-demo.tsx`；本记录 |

**状态：已执行（2026-11-10）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/what-is-component.md`、`docs/.vitepress/components/demos/ui/component-basic-demo.tsx` 与本记录；未改 `props` 页及其它正文 / demo / 代码 / 配置 / 计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `what-is-component.md`：`ItemCardProps` 的定位字段由 `loc: [number, number]` 改为 `position: [number, number]`（仍继承 `DefaultProps`）；`itemCardProps.props` 改为 `['position', 'label', 'color']`；组件根容器保留 `loc={props.position}`（`loc` 是渲染元素的定位属性，`position` 是组件自己的 prop）；父模板两处 `ItemCard` 与正文说明的 `loc` 全部改为 `position`。
- `component-basic-demo.tsx`：`ItemCardProps` 与 `itemCardOptions.props` 同步改为 `position`；根容器写 `loc={props.position}`；父组件三处 `<ItemCard>` 改用 `position={[...]}`。
- 保持只讲基本 props（继承 `DefaultProps`、`props` 数组、`defineComponent<Props>`、父传子读、默认值 `??`），未新增 emits / slots / attrs / 生命周期内容。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/component-basic-demo.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 64 轮（2026-11-10，已执行）

**用户意见（核心）：** 按 U-64 拆分内置组件文档，做一个初版；按基础、布局、文本三篇重写，只讲用法，不保留旧两篇未审阅内容。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 落点                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| U-64 | 新建 `builtin-basic.md`（Input、Icons、Arrow、Selection、Progress、Background、Slider）、`builtin-layout.md`（Scroll、Page、ListPage）、`builtin-text.md`（TextContent、ScrollText），只讲怎么用；删除旧 `builtin-text-and-input.md`、`builtin-list-and-containers.md` 与旧 demo；侧边栏在「组件化」的 `slots-and-attrs` 后加三篇，旧「内置组件与 UI 系统」改为「UI 系统」并只保留三篇；`ii/index.md` UI 子分组计数 29 改为 30；更新 `text.md`、`slots-and-attrs.md` 旧链接；新增 3 个 demo（480×320、深色、不重叠）；不 commit | 3 篇新文档、3 个新 demo、`config.ts`、`ii/index.md`、`text.md`、`slots-and-attrs.md`；本记录 |

**状态：已执行（2026-11-10）**

### 执行记录

- 新增 `docs/advanced/ii/ui/builtin-basic.md`、`builtin-layout.md`、`builtin-text.md`；删除 `builtin-text-and-input.md`、`builtin-list-and-containers.md` 与旧 `builtin-text-demo.tsx`、`builtin-list-demo.tsx`。
- 基础篇按 Input、Icons、Arrow、Selection、Progress、Background、Slider 分节，覆盖各组件关键 props；代码统一用 `// setup` + `// 组件内容` 的简化标准形式，组件从 `@user/client-base` 导入，不写 `export default defineComponent` 包装。
- 布局篇覆盖 Scroll 的直接子元素、Page 的 `pages` / `v-model:page` / `hideIfSingle`、ListPage 的 `list` / `v-model:selected` / `basis` / slot；文本篇覆盖 TextContent 的 `width` / `autoHeight` / `interval` / `typeEnd` 与 ScrollText 的 `width` / `speed` / `text`。
- 新增 `builtin-basic-demo.tsx`、`builtin-layout-demo.tsx`、`builtin-text-demo.tsx`，均为 480×320、深色背景、内容不重叠；基础 live 组合背景、进度、箭头、选中框、滑动条与一个图标，布局 live 组合 Page 与平铺滚动列表，文本 live 组合逐字显示与滚动提示。文档站无法直接打包 `@user/client-base` 的整套组件，因此 live 中可安全导入的 `Slider`、`Page`、`PlayIcon` 使用真实组件，其余用等价元素绘制；代码块仍按真实组件写法。
- 侧边栏「组件化」在 `slots-and-attrs` 后新增「内置组件：基础」「内置组件：布局」「内置组件：文本」；「内置组件与 UI 系统」改名为「UI 系统」，只保留「UIController 与 UI 栈」「修改 / 替换内置 UI」「UI 系统性能与注意事项」。
- `docs/advanced/ii/index.md` 的 UI 子分组计数由 29 篇改为 30 篇；`text.md` 与 `slots-and-attrs.md` 的旧页链接改为 `builtin-text.md`，`text.md` 只链接 `TextContent` 所在的文本篇。
- 未写 VNode、未写元素层 TS、未假设应用场景；未改源码、其它正文、计划 / ROADMAP / STATE；未 commit。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 三个新 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 65 轮（2026-11-11，已执行）

**用户意见（核心）：** 按 U-65 完善三篇内置组件初版：`v-model:value` 改 `v-model`；每个组件一个独立 live；补参数表；Selection 用真实组件说明闪烁；保持「怎么用」风格。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 落点                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| U-65 | 文档与 demo 中 `v-model:value` 改为 `v-model`；基础 7 个、布局 3 个、文本 2 个组件各一个独立 live，放在对应小节后，删除三个旧组合 demo；每个组件补「属性 / 作用 / 默认或常用值」参数表（Input、Icons、Arrow、Selection、Progress、Background、Slider、Scroll、Page、ListPage、TextContent、ScrollText）；Icons 列出全部 17 个内置图标名；Input / Selection 优先用真实组件；保持「怎么用」风格，不写 VNode、不假设应用场景；prettier、ESLint、`docs:build` 通过；不 commit | 三篇内置组件文档、12 个新 demo、删除 3 个旧 demo；本记录 |

**状态：已执行（2026-11-11）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/builtin-basic.md`、`builtin-layout.md`、`builtin-text.md`，新增 12 个 demo，删除 `builtin-basic-demo.tsx`、`builtin-layout-demo.tsx`、`builtin-text-demo.tsx` 与本记录；未改源码、配置、其它正文、计划 / ROADMAP / STATE，未 commit。
- 每个组件一个独立 live，紧跟对应小节：基础篇 `builtin-input-demo.tsx`、`builtin-icons-demo.tsx`、`builtin-arrow-demo.tsx`、`builtin-selection-demo.tsx`、`builtin-progress-demo.tsx`、`builtin-background-demo.tsx`、`builtin-slider-demo.tsx`；布局篇 `builtin-scroll-demo.tsx`、`builtin-page-demo.tsx`、`builtin-listpage-demo.tsx`；文本篇 `builtin-textcontent-demo.tsx`、`builtin-scrolltext-demo.tsx`。均为 480×320、深色背景、内容不重叠。
- 参数表统一表头「属性 / 作用 / 默认或常用值」，只列常用参数：Input 10 项、Arrow 3 项、Selection 5 项、Progress 5 项、Background 4 项、Slider 13 项、Scroll 4 项、Page 5 项、ListPage 7 项、TextContent 10 项、ScrollText 5 项；Icons 用表格列出全部 17 个图标组件名，live 展示其中 9 个，正文说明图标样式按 API 列表查。
- Input 的绑定写法由 `v-model:value` 改为 `v-model`，并保留 `value` 配 `onUpdate:value` 的备选写法说明；Slider 保持原有的 `value` 配 `onUpdate:value`（原有写法，demo 可交互）。
- 文档站打包范围实测：`Slider`、`Page`、`Icons` 可直接导入；`Input`、`Selection`、`Arrow`、`Progress`、`Background`、`Scroll`、`ListPage`、`TextContent`、`ScrollText` 所在文件仍引用已移走的 `../renderer` 与 `../use`，Rollup 报 `Could not resolve "../renderer"`（以 `Input` 做过一次构建探针，确认后删除了探针文件），因此这些 live 用基础图形还原外观、未导入真实组件，demo 文件头注释已注明；代码块仍按真实组件写法。
- `Selection` 的闪烁由渲染激励源驱动（`RendererUsing` 绑定的 `RafExcitation`），文档站没有这个激励源，因此即使能打包也不会闪。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 12 个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link，产物 `public/_docs/advanced/ii/ui` 下三篇 HTML 均生成。

## 第 66 轮（2026-11-11，已执行）

**用户意见（核心）：** 按 U-66 完善 `builtin-text.md` 的 `TextContent` 文本标记说明，并更新对应 live。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 落点                                                      |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| U-66 | 在 `## TextContent` 参数表后新增 `### 文本标记`：用表格列出 `[c=颜色]...[/c]`（可嵌套）、`[s=字号]...[/s]`、`[f=字体名]...[/f]`、`[b]` / `[i]`（切换而非成对闭合）、`[w=字数]`、`[icon=图标名]`、`\n`、`[[` / `]]`；说明 `[c]` 实际写 `[c=#f2b84b]...[/c]`，没有颜色参数不会按标签处理；标记可组合、可跨行，换行用 `\n` 不写 `<br>`，TSX 用模板字符串或字符串拼接；给包含颜色、字号、换行与 `[[` / `]]` 的完整 `text={...}` 示例；更新 `builtin-textcontent-demo.tsx` 展示多色、不同字号、手动换行与方括号字面量，保持 480×320、不重叠；不写内部解析原理与 VNode；不 commit | `builtin-text.md`、`builtin-textcontent-demo.tsx`；本记录 |

**状态：已执行（2026-11-11）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/builtin-text.md`、`docs/.vitepress/components/demos/ui/builtin-textcontent-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 配置 / 计划 / ROADMAP / STATE / 源码，未写 SUMMARY，未 commit。
- `builtin-text.md`：在 `## TextContent` 参数表之后新增 `### 文本标记`，给出常用标记表、`[b]` / `[i]` 切换说明、`[c]` 必须带颜色参数、标记组合与 `\n` 换行、TSX 写法，以及包含颜色、字号、换行与 `[[` / `]]` 的完整 `text={...}` 示例；未写解析原理与 VNode。
- `builtin-textcontent-demo.tsx`：保留「文档站无法打包 TextContent 所在的模块，这里用基础图形还原它的样子」说明；用 24px / 16px / 13px 三档字号与黄、绿、灰、浅蓝多色展示标记效果，加入 `[[` / `]]` 方括号字面量对照与两行手动换行；仍为 480×320，内容不重叠。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/builtin-textcontent-demo.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 67 轮（2026-11-11，已执行）

**用户意见（核心）：** 三篇内置组件文档不要上来只列表格 / 参数 / 概念；从「要实现什么」出发，一步步教怎么用。常用配置用段落加示例讲细（先说用途、再说第一步怎么写、给示例、再说「如果需要 X 就加 Y」、再给示例），低频参数才放表格且表格放后；每个组件保留一个 live 并跟着对应讲解；`v-model` 继续用、不写 `v-model:value`；不写内部实现、VNode 与生命周期。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 落点                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| U-67 | 按「要实现什么 → 第一步 → 需要 X 加 Y」重写三篇：`builtin-basic.md` 的 Input（`v-model` 起步、`multiline`、常用参数 `loc` / `placeholder` / `border` / `borderWidth` / `circle` / `pad` 与低频表）、Icons（导入即用、17 个图标名、live、样式查 API）、Arrow（`arrow` 起步、`head` / `color`）、Selection（只画框、点击放外层、`loc` / `color` / `border` / `alphaRange`）、Progress（`progress` 0–1、`success` / `background`）、Background（`winskin` 与颜色二选一）、Slider（`min` / `max` / `step`、`showValue`、移动端增减按钮、低频表）；`builtin-layout.md` 的 Scroll（直接子元素、`hor` / `noscroll` / `padEnd`）、Page（`pages` / `v-model:page` / slot 页码 / `hideIfSingle`）、ListPage（`list` / `v-model:selected` / slot id / `basis` / `right` / `close` / `closeLoc`）；`builtin-text.md` 的 TextContent（`width` 起步、`autoHeight` / `interval`、标记逐条讲 `[c]` / `[s]` / `\n` / `[[ ]]`，其余标记用表、综合示例接 live）、ScrollText（`width` / `speed` / `text` / `loc` 基本写法、`pad`，排版参数同 TextContent）。表格只列低频参数；标题保持名词短语；不 commit | 三篇内置组件文档；本记录 |

**状态：已执行（2026-11-11）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/builtin-basic.md`、`builtin-layout.md`、`builtin-text.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo、配置、源码、其它正文、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `builtin-basic.md`：七个组件全部改为「要做什么 → 第一步写法 → 需要 X 就加 Y」的段落式讲解，每个组件的 live 放在该组件讲解末尾。Input 以 `v-model` 起步，再补 `placeholder` 与 `multiline`，常用参数（`loc` / `placeholder` / `border` / `borderWidth` / `circle` / `pad`）写成段落，低频参数（`font` / `fillStyle` / `onInput` / `onChange`）入表；Icons 先给导入示例，再按行列出 17 个图标名，样式查 API 的说明放在 live 前；Arrow 从 `arrow` 起步再讲 `head` / `color`；Selection 先讲「只画框、点击放外层」并给外层容器示例，再讲 `loc` / `color` / `border` / `alphaRange`，`winskin` 用一句话带过；Progress 先讲 `progress` 的 0–1 含义，再讲 `success` / `background`；Background 先给颜色写法，再讲 `winskin` 与颜色二选一；Slider 从 `value` 配 `onUpdate:value` 起步，再讲 `min` / `max` / `step`、`showValue` 与移动端增减按钮，低频参数入表。
- `builtin-layout.md`：Scroll 先讲「内容超过视口」与「直接子元素」的约束并给示例，再讲 `hor` / `noscroll` / `padEnd`；Page 先讲 `pages` / `v-model:page` / slot 收到页码并给示例，再讲 `hideIfSingle`；ListPage 先讲 `list` / `v-model:selected` / slot 收到 id 并给示例，再讲 `basis` / `right` / `close` / `closeLoc`；三节均把 live 放在讲解末尾，不再保留参数表。
- `builtin-text.md`：TextContent 先讲「必须给 `width`」并给示例，再讲 `autoHeight`、`interval` 与 `onTypeEnd`；`### 文本标记` 改为逐条教学（改颜色 `[c=颜色]...[/c]`、改字号 `[s=字号]...[/s]`、换行 `\n`、普通方括号 `[[` / `]]`，各配示例），粗体 / 斜体 / 字体 / 等待 / 图标才用表格，最后给综合 `text` 示例并接 live；低频参数（`font` / `lineHeight` / `fill` / `stroke` / `fillStyle` / `strokeStyle` / `textAlign` / `wordBreak`）入表。ScrollText 先讲 `width` / `speed` / `text` / `loc` 的基本写法并给示例，再讲 `pad`，并说明排版参数与 TextContent 相同；live 放在讲解末尾。
- 三篇的标题保持名词短语；未写内部实现、VNode 与生命周期；未出现 `v-model:value`。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 68 轮（2026-11-11，已执行）

**用户意见（核心）：** `value` 的双向绑定统一写成 `v-model`，不再出现 `value` 配 `onUpdate:value` 的写法；`v-model:page`、`v-model:selected` 保留。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 落点                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| U-68 | `builtin-basic.md` 的 Slider 所有示例删除 `value={volume.value}` + `onUpdate:value={...}`，改成 `v-model={volume.value}`；正文「拖动时通过 `onUpdate:value` 写回」改为「拖动时用 `v-model` 双向绑定」；Input 说明删掉「也可以写 `value` 配 `onUpdate:value`」的建议，只保留 `v-model` 主写法与 `onInput` / `onChange`；`builtin-slider-demo.tsx` 同步改 `v-model`；全文不再出现 `onUpdate:value` 或 `v-model:value`，`v-model:page`、`v-model:selected` 保留；不 commit | `builtin-basic.md`、`builtin-slider-demo.tsx`；本记录 |

**状态：已执行（2026-11-11）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/builtin-basic.md`、`docs/.vitepress/components/demos/ui/builtin-slider-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它正文 / demo / 配置 / 源码、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `builtin-basic.md` 的 Slider：起步示例合并为一行 `<Slider loc={[40, 80, 240, 24]} v-model={volume.value} />;`，`min` / `max` / `step`、`showValue={false}` 与移动端增减按钮三处示例均改为 `v-model={volume.value}`，删除全部 `value={volume.value}` 与 `onUpdate:value={(value: number) => (volume.value = value)}`；正文说明改为「拖动时用 `v-model` 双向绑定」。
- `builtin-basic.md` 的 Input：删除「需要自己处理更新时，也可以写 `value` 配 `onUpdate:value`」一句，保留 `value` 即 `v-model` 绑定值与 `onInput` / `onChange` 监听说明。
- `builtin-slider-demo.tsx`：`<Slider>` 的 `value` + `onUpdate:value` 改为 `v-model={volume.value}`，其余布局与增减按钮未动。
- 全文检索 `docs/` 确认不再出现 `onUpdate:value` 与 `v-model:value`；`builtin-layout.md` 的 `v-model:page` / `v-model:selected` 与 `props.md` 中的 `v-model:selected` 说明原样保留。
- 验证：`pnpm exec prettier --check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/builtin-slider-demo.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 69 轮（2026-11-11，已执行）

**用户意见（核心）：** `value` 的双向绑定改回 `v-model:value`；`v-model:page`、`v-model:selected` 等非 value 的双向绑定保持 `v-model:prop`。

| #    | 用户意见                                                                                                                                                                                                                                                                                               | 落点                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| U-69 | `builtin-basic.md` 的 Input、Slider 全部 `v-model` 改为 `v-model:value`，正文「用 `v-model` 绑定」改为「用 `v-model:value` 绑定」；`builtin-slider-demo.tsx` 使用 `v-model:value`（已有则保留）；`v-model:page`、`v-model:selected` 保持不变；全站 docs 不再出现 value 组件使用裸 `v-model`；不 commit | `builtin-basic.md`、`builtin-slider-demo.tsx`；本记录 |

**状态：已执行（2026-11-11）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/builtin-basic.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；`builtin-slider-demo.tsx` 已是 `v-model:value={volume.value}`，原样保留；未改其它正文 / demo / 配置 / 源码、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `builtin-basic.md` 的 Input：3 处 `v-model={...}` 改为 `v-model:value={...}`；正文「第一步：用 `v-model` 绑定」与「`value` 就是 `v-model` 绑定的那个值」改为 `v-model:value`。
- `builtin-basic.md` 的 Slider：4 处 `v-model={volume.value}` 改为 `v-model:value={volume.value}`；正文「拖动时用 `v-model` 双向绑定」改为「拖动时用 `v-model:value` 双向绑定」。
- 全站检索 `docs/` 确认不再出现 value 组件的裸 `v-model`；`builtin-layout.md` 的 `v-model:page` / `v-model:selected`、`props.md` 与 `props-demo.tsx` 中的 `v-model:selected` 原样保留。
- 验证：`pnpm exec prettier --check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/builtin-slider-demo.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 第 70 轮（2026-11-11，已执行）

**用户意见（核心）：** 把 12 个内置组件 live 全部改成真实组件，不再用等价元素模拟；文档站构建失败可以接受，等重构后自然恢复。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                 | 落点                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| U-70 | 12 个 demo 全部直接导入并使用真实内置组件：Input、Icons、Arrow、Selection、Progress、Background、Slider、Scroll、Page、ListPage、TextContent、ScrollText；删除「文档站无法打包 / 等价元素 / 还原外观」注释与模拟逻辑；导入路径沿用现有 demo 的相对路径；Background 从 `src/client/ui/background` 导入；页面文字不解释构建失败；不 commit | 12 个 demo、`builtin-basic.md` / `builtin-text.md` 的 live 描述；本记录 |

**状态：已执行（2026-11-11）**

### 执行记录

- `builtin-input-demo.tsx`：导入真实 `Input`，用 `v-model:value` 绑定，分别展示单行占位、单行已填内容与 `multiline` 多行输入。
- `builtin-arrow-demo.tsx`：删除手写 `Path2D` 模拟，改为三个真实 `Arrow`，分别设置 `head={8}` / `18` / `30` 与不同 `color`。
- `builtin-selection-demo.tsx`：删除 `g-rectr` 模拟，改为两组真实 `Selection`（`color` / `border`），第二组用 `alphaRange={[0.4, 0.8]}`，第三行保留无选中框的对照。
- `builtin-progress-demo.tsx`：删除 `g-line` 模拟，改为三个真实 `Progress`，`progress` 分别取 `0.3` / `0.6` / `1`，并指定 `success` / `background`。
- `builtin-background-demo.tsx`：改为真实 `Background`，从 `../../../../../src/client/ui/background` 导入，两组 `color` / `border`。
- `builtin-scroll-demo.tsx`：删除模拟滚动条，改为真实 `Scroll`，12 行内容作为直接子元素挂在 `Scroll` 下。
- `builtin-listpage-demo.tsx`：删除模拟高亮与详情，改为真实 `ListPage`，传入 `list`、`v-model:selected` 与默认 slot。
- `builtin-textcontent-demo.tsx`：删除 `Font` 与 `text` 元素模拟，改为真实 `TextContent`，同一段 `text` 展示折行、`[c=]`、`[s=]`、`\n` 与 `[[ ]]`。
- `builtin-scrolltext-demo.tsx`：删除 `setInterval` 手动滚动，改为真实 `ScrollText`，用 `width` / `speed` / `text` / `fillStyle` 滚动公告。
- `builtin-icons-demo.tsx`、`builtin-slider-demo.tsx`、`builtin-page-demo.tsx` 原本已是真实组件（`Slider` 保持 `v-model:value` + 增减按钮，`Page` 保持 `v-model:page`），本轮原样保留。
- `builtin-basic.md` 的 Selection live 描述补上第二组用 `alphaRange` 调大闪烁深浅；`builtin-text.md` 的 TextContent live 描述补上长句按 `width` 折行；页面正文不解释构建失败。
- 全文检索 12 个 demo，确认不再出现「无法打包 / 等价 / 还原 / 模拟」一类注释与模拟逻辑。
- 未改源码、配置、其它 demo、其它正文、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint` 12 个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 按预期失败：Rollup 首先报 `Could not resolve "@/client" from "src/client/ui/background.tsx"`（文档站没有应用层 `@/` 别名），已知的 `../renderer` / `../use` 也仍未解析；按用户要求记录为预期失败，未改源码或配置绕过。

## 71 轮（2026-11-11，已执行）

**用户意见（核心）：** 按 U-71 调整侧边栏「组件化」分组顺序。

| #    | 用户意见                                                                                                                                                                                                                                                                                        | 落点                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| U-71 | 「组件化」分组顺序改为：什么是组件 → 内置组件：基础 → 内置组件：布局 → 内置组件：文本 → props → 组件（TSX）→ slots 与 attrs；只改顺序，不改标题 / 链接 / 文件；《什么是组件》末尾若有「下一篇」链接可同步指向 `builtin-basic.md`，没有就不加；prettier `--check`、`docs:build` green；不 commit | `config.ts`；本记录 |

**状态：已执行（2026-11-11）**

### 执行记录

- `docs/.vitepress/config.ts`：「组件化」分组 7 条按 U-71 顺序重排，标题与链接均未改动。
- `docs/advanced/ii/ui/what-is-component.md`：末尾没有「下一篇」链接，按用户要求不新增。
- 未改其它正文、demo、源码、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 验证：`pnpm exec prettier --check docs/.vitepress/config.ts .planning/phases/10-docs-restructure/10-54-USER-REVIEW.md` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 失败，报错与 U-70 记录一致：`Could not resolve "@/client" from "src/client/ui/background.tsx"`。该文件在 HEAD 未改动且当前工作区亦未改动，`docs/.vitepress/config.ts` 的 vite alias 只有 `@motajs/*`，属既有问题，非本次顺序调整引入；按范围约束未改源码或配置绕过，故本轮 `docs:build` 未 green。

## 72 轮（2026-11-13，已执行）

**用户意见（核心）：** 把 `props.md`、`component-tsx.md`、`slots-and-attrs.md` 合并成一篇 `custom-components.md`《自定义组件》，只讲怎么用，不重复组件原理与内部实现。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 落点                                                                                                                                                                                                                                                                                                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-72 | 新建 `custom-components.md`：开场说明前面的页面已经会写 UI，组件是把一部分 UI 拆出来复用；`## props` 只讲 Props 接口、`SetupComponentOptions` 的 props 数组、`defineComponent`、父组件传值、`props.x` 与 `??` 默认值；`## emits` 讲声明 emits、`emit` 与 `on事件`，双向绑定用 `v-model:prop` + `update:prop` 一句带过；`## slots` 讲默认 / 具名 slot 与 `slots.default?.()` / `slots.title?.(...)`；`## attrs` 讲未声明属性进入 attrs、`{...attrs}` 与 `inheritAttrs: false`；`## 组件的调用` 给完整标准 UI 模板；最后放一个 live。删除三篇旧页与三个专属 demo；侧边栏三项合并为一项 `自定义组件`；`ii/index.md` 计数 30 → 28；更新 `ui-template.md`、`ui-basics.md`、`inventory-example-2-grid.md`、`reactivity.md` 的旧链接；不写生命周期 / VNode / 内部实现，不假设应用场景，标题用名词短语；不 commit | `docs/advanced/ii/ui/custom-components.md`、`custom-components-demo.tsx`、删除 `props.md` / `component-tsx.md` / `slots-and-attrs.md` 与 `props-demo.tsx` / `component-demo.tsx` / `slots-demo.tsx`、`config.ts`、`docs/advanced/ii/index.md`、`ui-template.md`、`ui-basics.md`、`inventory-example-2-grid.md`、`reactivity.md`；本记录 |

**状态：已执行（2026-11-13）**

### 执行记录

- 新增 `docs/advanced/ii/ui/custom-components.md`：单 H1「自定义组件」+ `props` / `emits` / `slots` / `attrs` / `组件的调用` / `运行效果` 六节；示例统一用 `// setup` + `// 组件内容` 简化形式，调用示例给完整标准 UI 模板（`MyPanel` + `ItemCard` + `new GameUI`）；未写生命周期、VNode 或内部实现，未假设应用场景。
- 新增 `docs/.vitepress/components/demos/ui/custom-components-demo.tsx`：480×320，两个 `ItemCard` 演示 props（`label` / `active`）、`pick` 事件与默认 slot，点击切换选中态，文字与卡片不重叠。
- 删除 `docs/advanced/ii/ui/props.md`、`component-tsx.md`、`slots-and-attrs.md` 与 `docs/.vitepress/components/demos/ui/props-demo.tsx`、`component-demo.tsx`、`slots-demo.tsx`；全站检索确认无残留引用。
- `docs/.vitepress/config.ts`：「组件化」分组的 `props` / `组件（TSX）` / `slots 与 attrs` 三项替换为一项 `自定义组件` → `/advanced/ii/ui/custom-components`，放在三篇内置组件之后。
- `docs/advanced/ii/index.md`：UI 子分组计数由 30 篇改为 28 篇。
- 链接：`ui-template.md` 与 `ui-basics.md` 的「拆组件」改为 [自定义组件](./custom-components.md)；`inventory-example-2-grid.md` 指向 `custom-components.md#props`；`reactivity.md` 的 props 说明改为指向 `custom-components.md#props`。
- 验证：`pnpm exec prettier --write` / `--check` 通过；`pnpm exec eslint docs/.vitepress/components/demos/ui/custom-components-demo.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 仍因既有环境问题失败：`Rollup failed to resolve import "@/client" from "src/client/ui/background.tsx"`，与 U-70 / U-71 记录一致，非本次改动引入；按范围约束未改源码或配置绕过。
- 未改其它正文、demo、源码、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。

## 73 轮（2026-11-13，已执行）

**用户意见（核心）：** 按事件命名函数风格修正 `custom-components.md` 的内联事件回调，回调先声明成命名函数，再传给 `onClick` / `onPick`。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                         | 落点                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| U-73 | `emits` 示例的子组件把 `onClick={() => emit('pick', props.label)}` 抽成 `handleClick` 命名函数，父组件示例把内联箭头改成先声明 `handlePick` 再传 `onPick={handlePick}`；`## 组件的调用` 标准模板里 `ItemCard` 的 `onClick` 同样抽成命名函数，`MyPanel` 的 `onPick` 改为命名函数 `handlePick`；其它逻辑、结构、示例内容不变；prettier `--check`；`docs:build` 记录已知内置组件环境失败；不 commit | `custom-components.md`；本记录 |

**状态：已执行（2026-11-13）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/custom-components.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo、配置、源码、其它正文、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `emits` 示例：子组件在 `// 组件内容` 后新增 `const handleClick = () => { emit('pick', props.label); };`，`container` 改为 `onClick={handleClick}`；父组件示例改为先声明 `const handlePick = (label: string) => console.log(label);`，再用 `<ItemCard label="卡片 A" onPick={handlePick} />`。
- `## 组件的调用` 模板：`ItemCard` 在取 `fill` 之后新增同名 `handleClick` 命名函数，`container` 改为 `onClick={handleClick}`；`MyPanel` 在 `selected` 之后新增 `const handlePick = (label: string) => { selected.value = label; };`，`ItemCard` 改传 `onPick={handlePick}`。
- 其余 props / emits / slots / attrs 讲解、示例结构与 live 未动。
- 验证：`pnpm exec prettier --check docs/advanced/ii/ui/custom-components.md .planning/phases/10-docs-restructure/10-54-USER-REVIEW.md` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 仍因既有内置组件环境问题失败，与 U-70 / U-71 / U-72 记录一致，非本次改动引入。

## 74 轮（2026-11-13，已执行）

**用户意见（核心）：** 重写 `custom-components.md` 的 `emits`、`slots`、`attrs` 三节，先讲概念与标准定义，再给拆短的示例，避免「几行文字 + 几十行代码」。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 落点                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| U-74 | `emits` 先讲它是子组件向父组件报告「发生了什么」的出口、props 向下传数据而 emits 向上传事件、父组件用 `on事件名` 接收；再讲声明 Emits 类型、事件名写进 `emits`、`defineComponent` 第二 / 第三泛型对应 Emits 与事件名联合、子组件只通过 `emit` 发事件；示例拆成子组件声明与 `emit`、父组件 `onPick` 调用；补双向绑定 `update:prop` + `v-model:prop` 的用途。`slots` 先讲它是父组件向子组件内部插入 UI 的出口、子组件决定位置而父组件决定内容、slot 是结构不是数据；再讲 TSX 里 slot 是函数、`slots.default?.()` / `slots.title?.(...)`、需要类型时用 `SlotsType`、父组件用标签内容传默认 slot、用对象传具名 slot；默认与具名各配一个短示例，讲清 `?.` 与不要混用对象 / 普通子元素。`attrs` 先讲父组件写了但既没声明为 props 也没被 emits 消费的属性、适合透传底层元素属性；再讲默认落到根元素、`inheritAttrs: false` + `{...attrs}`、属性名保持 camelCase；给 Field 透传 `text` / `fillStyle` 的短示例，并说明不要同时自动透传又手动展开；每节至少 2–4 段解释文字再给示例；`props`、`组件的调用` 与 live 不改；不写生命周期、VNode、内部实现；prettier `--write` + `--check`；`docs:build` 若仍因真实内置组件环境失败则记录；不 commit | `custom-components.md`；本记录 |

**状态：已执行（2026-11-13）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/custom-components.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo、配置、源码、其它正文、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `## emits`：先补三节概念与标准定义（props 向下、emits 向上、`on事件名` 接收；Emits 类型、`emits` 数组、`defineComponent` 第二 / 第三泛型；只发事件不改父组件数据），再把原 40 行示例拆成「类型与选项」「组件内 `emit`」「父组件 `onPick`」三个短代码块，末尾说明 `update:prop` + `v-model:prop` 的双向绑定用途。
- `## slots`：先补三节概念与标准定义（插入 UI 的出口、子组件决定位置 / 父组件决定内容、slot 是结构不是数据；TSX 中 slot 是函数、默认 / 具名调用、`SlotsType` 与第四泛型；`?.` 与对象 / 普通子元素不要混用），再把 Panel 声明与 slot 调用拆成两个短代码块；新增 `### 默认 slot` 与 `### 具名 slot` 两个小段，各配一个父组件短示例。
- `## attrs`：先补三节概念与标准定义（未声明为 props 且未被 emits 消费、适合透传；默认落根元素、`inheritAttrs: false` + `{...attrs}`；属性名保持 camelCase），保留 Field 透传 `text` / `fillStyle` 的短示例，末尾补「不要同时自动透传又手动展开」。
- `props`、`## 组件的调用` 与 live 未改；未写生命周期、VNode、内部实现。
- 验证：`pnpm.cmd exec prettier --write docs/advanced/ii/ui/custom-components.md .planning/phases/10-docs-restructure/10-54-USER-REVIEW.md` 后 `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 仍因既有内置组件环境问题失败：`Rollup failed to resolve import "@/client" from "src/client/ui/background.tsx"`，与 U-70 / U-71 / U-72 / U-73 记录一致，非本次改动引入。

## 75 轮（2026-11-13，已执行）

**用户意见（核心）：** `what-is-component.md`、`custom-components.md` 里的 props 派生值只在 setup 时计算一次，props 变化后不会重新计算；默认值应改用 `computed` 派生并读取 `.value`，同时删掉 `??` 只对 `null` / `undefined` 生效的基础语法讲解，代码中仍可用 `??`。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 落点                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| U-75 | `what-is-component.md` 的 `const color = props.color ?? '#f2b84b';` 改为 `const color = computed(() => props.color ?? '#f2b84b');`，JSX 读 `color.value`，补 `computed` import；删除「用 `??` 在组件内给默认值」的讲解，改为「默认值用 `computed` 派生，props 变化时会重新计算」。`custom-components.md` 的 props 示例同样用 `computed` 派生 `color`、JSX 读 `color.value` 并补 import；删除 `??` 只对 `null` / `undefined` 生效的整段基础语法解释；`## 组件的调用` 的 `const fill = props.active ? ...` 改为 `const fill = computed(() => props.active ? ...)`，JSX 读 `fill.value`；全文不再解释 `??` 语法细节，代码中仍可使用 `??`。两个 demo 的 `color` / `fill` 同步改为 `computed`。不改其它逻辑；prettier `--write` + `--check`；ESLint demos；`docs:build`（已知环境失败可记录）；不 commit。 | 两篇文档、两个 demo、本记录 |

**状态：已执行（2026-11-13）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/what-is-component.md`、`docs/advanced/ii/ui/custom-components.md`、`docs/.vitepress/components/demos/ui/component-basic-demo.tsx`、`docs/.vitepress/components/demos/ui/custom-components-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改配置、源码、其它正文、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `what-is-component.md`：`ItemCard` 的 `color` 改为 `computed(() => props.color ?? '#f2b84b')`，矩形 `fillStyle` 读 `color.value`，import 补 `computed`；「某个 props 可以不传时」一句改为「默认值用 `computed` 派生，props 变化时会重新计算」，删除用 `??` 给默认值的讲解。
- `custom-components.md`：props 示例的 `color` 改为 `computed` 派生、`fillStyle` 读 `color.value`，import 补 `computed`；删除 `??` 只对 `null` / `undefined` 生效的语法解释；`## 组件的调用` 的 `fill` 改为 `computed(() => (props.active ? '#2f6fed' : '#26364d'))`，`fillStyle` 读 `fill.value`；全文只保留代码中的 `??` 用法，不再解释其语法。
- `component-basic-demo.tsx`：`ItemCard` 的 `color` 改为 `computed` 派生，`fillStyle` 读 `color.value`；`custom-components-demo.tsx`：`ItemCard` 的 `fill` 改为 `computed` 派生，`fillStyle` 读 `fill.value`；其它结构、props、事件与 slot 未动。
- 验证：`pnpm.cmd exec prettier --write` 两篇文档 + 两个 demo 后 `--check` 通过；`pnpm.cmd exec eslint docs/.vitepress/components/demos/ui/component-basic-demo.tsx docs/.vitepress/components/demos/ui/custom-components-demo.tsx` 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 仍因既有内置组件环境问题失败：`Rollup failed to resolve import "@/client" from "src/client/ui/background.tsx"`，与 U-70 / U-71 / U-72 / U-73 / U-74 记录一致，非本次改动引入。

## 76 轮（2026-11-13，已执行）

**用户意见（核心）：** UI 系统整理成一篇，性能独立成一篇。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | 落点                                                                                                                                                                                                                                                                                                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-76 | 新建 `ui-system.md`《UI 系统》，合并 `ui-controller-and-stack.md` 与 `replace-builtin-ui.md` 的主要内容：开头讲控制器 + 实例 + 栈；`## 打开与关闭`、`## 隐藏与显示`、`## 控制器状态`、`## 背景`、`## 显示策略`、`## 场景 UI 与主 UI`、`## 替换内置 UI`、`## 其他接口`、`## 边界与注意`；每个接口先说什么时候用再给短示例，多用段落。`controller-demo.tsx` 放「打开与关闭」后，`strategy-demo.tsx` 放「显示策略」后，不放大段综合 live。删除两篇旧页；`ui-performance.md` 标题改为《UI 性能》，去掉「属于 UI 系统」的说法。侧边栏「UI 系统」分组只留《UI 系统》，新开「性能」分组放《UI 性能》。`docs/advanced/ii/index.md` 计数 28 → 27；全站旧链接改到 `ui-system.md`。不写 VNode、生命周期底层、内部实现，不假设应用场景，标题用名词短语；prettier `--write` + `--check`，`docs:build` 若仍因真实内置组件环境失败则记录；不 commit。 | 新增 `docs/advanced/ii/ui/ui-system.md`；删除 `ui-controller-and-stack.md` / `replace-builtin-ui.md`；`ui-performance.md`、`config.ts`、`docs/advanced/ii/index.md`、`docs/advanced/index.md`、`ui-basics.md`、`ui-template.md`、`inventory-example-1-skeleton.md`、`inventory-example-6-animation-and-register.md`；本记录 |

**状态：已执行（2026-11-13）**

### 执行记录

- 新增 `docs/advanced/ii/ui/ui-system.md`：单 H1《UI 系统》，开头说明控制器、实例与栈的关系；按 U-76 顺序设 `打开与关闭`、`隐藏与显示`、`控制器状态`、`背景`、`显示策略`、`场景 UI 与主 UI`、`替换内置 UI`、`其他接口`、`边界与注意` 九节。每个接口先说明使用场景，再给短示例；讲清 `open` / `close` / `closeAll`、`hide` / `show`、`active` / `showBack` 的 `.value` 读法、`setBackground` 与背景四个名字、`lastOnly` / `showAll` / `showCustom` 与栈模式、两个控制器的分工与 `mainUIController.render()` 接入、两种替换方式与必须保留的 `controller` / `instance` / `state` / `loc` 与返回路径、`keep` / `setPropsBaseCreator` 等。`controller-demo.tsx` 放在「打开与关闭」后，`strategy-demo.tsx` 放在「显示策略」后，两段 live 共用一个 `<script setup>`。未写 VNode、生命周期底层与内部实现，未写 live 尺寸说明或修复说明，标题均为名词短语。
- 删除 `docs/advanced/ii/ui/ui-controller-and-stack.md`、`docs/advanced/ii/ui/replace-builtin-ui.md`；`strategy-demo.tsx` 与 `controller-demo.tsx` 文件保留，只在新页引用。
- `ui-performance.md`：标题由《UI 系统性能与注意事项》改为《UI 性能》；开头「它讨论的是 **UI 系统**的性能」改为「它讨论的是 UI 的性能」；`setPropsBaseCreator` 注入链链接由旧 controller 页改为 `ui-system.md#其他接口`。其余正文未重写。
- `docs/.vitepress/config.ts`：「UI 系统」分组只保留一项《UI 系统》→ `/advanced/ii/ui/ui-system`；新开「性能」分组，放《UI 性能》→ `/advanced/ii/ui/ui-performance`，与 UI 系统分组平级。
- `docs/advanced/ii/index.md`：UI 子分组计数 28 → 27；性能说明段去掉「UI 系统的缓存与显示策略」，改为「《UI 性能》讲缓存与显示策略的取舍」。
- 旧链接更新：`ui-basics.md`、`ui-template.md`、`inventory-example-1-skeleton.md`、`inventory-example-6-animation-and-register.md` 指向 `ui-system.md`；需要具体小节时使用 `#替换内置-ui`、`#其他接口`、`#隐藏与显示` 锚点。`docs/advanced/index.md` 的性能说明同步去掉「UI 系统」措辞。
- 验证：`pnpm.cmd exec prettier --write` 上述文档 + `config.ts` 后 `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 仍因既有内置组件环境问题失败：`Rollup failed to resolve import "@/client" from "src/client/ui/background.tsx"`，与 U-70 / U-71 / U-72 / U-73 / U-74 / U-75 记录一致，非本次改动引入。
- 仅修改上述文档、侧边栏配置与本记录；未改源码、demo、其它正文、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。

## 77 轮（2026-11-13，已执行）

**用户意见（核心）：** 按 U-77 收缩 `ui-system.md`：删除场景 / 主 UI 与替换内置两节，背景改为接口说明，`keep` 提前，清掉内部接口；同步性能页与示例链接。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 落点                                                                                         |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| U-77 | `ui-system.md` 删除 `## 场景 UI 与主 UI`、`## 替换内置 UI`；`## 控制器状态` 只保留一句；重写 `## 背景`，先说明背景是控制器单独管理的一层、不占栈，再逐个说明 `setBackground` / `showBackground` / `hideBackground` / `showBack` / `showingBack`；`keep` 单独成节并说明 `IKeepController` 的 `safelyUnload()` / `unload()`；删除 `setPropsBaseCreator` / `stack` / `background` / `backIns` / `createPropsBase` 与其他接口节；`showCustom` 说明参数是 `IUICustomStrategy`；清理边界条目。`ui-performance.md` 删除注入链段落；`inventory-example-6` 去掉替换内置链接并把 `#其他接口` 改为 `#keep`；prettier、docs:build（已知失败可记录）；不 commit | `ui-system.md`、`ui-performance.md`、`inventory-example-6-animation-and-register.md`；本记录 |

**状态：已执行（2026-11-13）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-system.md`、`docs/advanced/ii/ui/ui-performance.md`、`docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改源码、demo、配置、其它正文、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `ui-system.md`：删除 `## 场景 UI 与主 UI` 与 `## 替换内置 UI` 两节；`## 控制器状态` 缩为一句「`active` 与 `showBack` 是控制器的状态引用，主要给主场景容器用，普通 UI 组件一般不需要读。」；新增 `## keep` 并放在 `## 隐藏与显示` 之后，说明 `keep()` 返回 `IKeepController`，`safelyUnload()` 在栈里还有 UI 时保留背景、栈空才关闭，`unload()` 立即关闭；重写 `## 背景`，先说明背景是控制器单独管理的一层、不占栈，再逐个说明 `setBackground(ui, vBind)`、`showBackground()`、`hideBackground()`、只读 `Ref<boolean>` 的 `showBack` 与函数形式的 `showingBack()`；`showCustom(strategy)` 说明参数是 `IUICustomStrategy` 对象、负责决定实例显示 / 隐藏、只有内置策略不够时才用；删除 `## 其他接口` 整节，全篇不再出现 `setPropsBaseCreator` / `createPropsBase` / `stack` / `background` / `backIns`。
- `ui-performance.md`：开头「组件、栈与替换」改为「组件与栈」；删除 `## 基础 props` 整节与 `setPropsBaseCreator` / `createPropsBase` 注入链链接。
- `inventory-example-6-animation-and-register.md`：删除「替换内置 UI」整句与链接；`keep` 链接由 `ui-system.md#其他接口` 改为 `ui-system.md#keep`；`#隐藏与显示` 链接保留。
- 全站检索确认没有 `ui-system.md#其他接口`、`ui-system.md#替换内置-ui` 或用户文档中的 `setPropsBaseCreator` / `createPropsBase` 残留。
- 未写 VNode、生命周期底层或内部实现；标题保持名词短语。
- 验证：`pnpm.cmd exec prettier --write` 三篇文档后 `--check` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 仍因既有内置组件环境问题失败：`Rollup failed to resolve import "@/client" from "src/client/ui/background.tsx"`，与 U-70 至 U-76 记录一致，非本次改动引入。

## 78 轮（2026-11-13，已执行）

**用户意见（核心）：** live 中覆盖在可点击 `g-rect` 上的文字标签会拦截点击，需要给这些标签加 `noevent`；只改有问题的 4 个响应式 demo。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                             | 落点                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| U-78 | 给位于可点击 `g-rect` 上方的文字标签加 `noevent`：`reactivity-counter-demo.tsx` 的「点我 +1」、`reactivity-computed-demo.tsx` 的「点我 +1」、`reactivity-reactive-demo.tsx` 的「切换」、`reactivity-watch-demo.tsx` 的「点我 +1」；不加到有自己事件处理的文字上；其它 demo 不改；prettier `--check`、ESLint 4 个 demo、`docs:build`（已知环境失败可记录）；不 commit | 4 个响应式 demo；本记录 |

**状态：已执行（2026-11-13）**

### 执行记录

- 仅修改 `docs/.vitepress/components/demos/ui/reactivity-counter-demo.tsx`、`reactivity-computed-demo.tsx`、`reactivity-reactive-demo.tsx`、`reactivity-watch-demo.tsx` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改其它 demo、正文、配置、源码、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 4 个可点击 `g-rect` 上方的文字标签加 `noevent`：counter / computed / watch 的「点我 +1」、reactive 的「切换」；未加到自身有事件处理的文字上，其它 demo 不改。
- 验证：`pnpm.cmd exec prettier --check` 4 个 demo 通过；`pnpm.cmd exec eslint` 4 个 demo 无报错；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green（`build complete in 25.99s`），无 dead link。

## 79 轮（2026-11-15，已执行）

**用户意见（核心）：** `ui-performance.md` 的写法方向错了：当前页是「先定位在哪一层 → 症状表 → profiling 流程 → 症状排查」的性能调试教程，而历史 `docs/guide/ui/perf.md` 的论点才对——多数简单 UI 不需要特别优化，懒更新与缓存通常够用，优化只是一组日常习惯。要求删掉定位 / 症状表 / profiling / 排查框架，改成短而实用的习惯页。

| #    | 用户意见                                                                                                                                                                                                                                                                                                                                                                                  | 落点                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| U-79 | 按历史页重写 `ui-performance.md`：开头说明多数 UI 不需要特别优化、默认懒更新与缓存通常足够；只保留避免平铺、长列表用 `Scroll` / `Page`、避免渲染函数内自我更新、`cache` / `nocache`、像素风关闭抗锯齿 / 高清、`hidden` 显隐六类习惯；删除六层定位表、观测与验证、症状与排查、组件粒度、UI 栈等调试向章节；不写症状表与 profiling 步骤；同步删除不再使用的 live 段；代码示例不使用行内注释 | `docs/advanced/ii/ui/ui-performance.md`；本记录 |

**状态：已执行（2026-11-15）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-performance.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改 demo、配置、源码、其它正文、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- 按历史页论点重写全文：开头说明多数简单 UI 不需要特别优化，默认懒更新与缓存通常足够，下面的习惯是可选的改进；正文只保留「元素平铺与分组」「长列表：Scroll 与 Page」「渲染函数中的自我更新」「cache 与 nocache」「像素风：抗锯齿与高清」「显隐：hidden 与条件渲染」六节。删除原「性能问题先定位在哪一层」「观测与验证」「症状与排查」「组件粒度」「UI 栈」「边界与注意」及六层定位表、症状表、profiling 步骤。
- 按源码核对事实：`packages/render/src/core/item.ts` 的 `update` 沿父链标脏、`hide` / `show` 保留元素并跳过绘制、`renderContent` 在 `hidden` 时直接返回；`packages/render/src/core/container.ts` 的 `Container.getDefaultCache` 返回 `true`，`CustomContainer` 继承；`packages/render/src/core/custom.ts` 的 `CustomRenderItem.getDefaultCache` 返回 `true`；`packages/render/src/core/misc.ts` 的 `Text` / `Image` / `Animated` 与 `packages/render/src/core/graphics.ts` 的图形默认不缓存；`packages/render/src/core/item.ts` 的 `setHD` 只在开启缓存时作用于缓存，`setAntiAliasing` 同时作用于元素与缓存，`noanti` 映射为关闭抗锯齿。
- 对照 `packages-user/client-base/src/components/scroll.tsx`：`Scroll` 只按直接子元素计算可滚动总长度，并用 `hide` / `show` 视口外子元素；对照 `page.tsx`：`Page` 的默认 slot 只按当前页索引渲染。
- 删除原「运行效果」live 段与 `perfLoader` import；`docs/.vitepress/components/demos/ui/perf-demo.tsx` 未删除，保留为未引用文件。
- 代码示例改为用正文说明「不推荐 / 推荐」，不新增行内注释。
- 验证：`pnpm exec prettier --check docs/advanced/ii/ui/ui-performance.md .planning/phases/10-docs-restructure/10-54-USER-REVIEW.md` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green（`build complete in 24.64s`），无 dead link。

## 80 轮（2026-11-15，已执行）

**用户意见（核心）：** `ui-performance.md` 有两处事实错误：`cache` / `nocache` 不是创建时决定、运行期不可改；像素图也不要求按整数倍放大。要求改为按 props 动态切换缓存，并删除整数倍缩放要求，保留其余「日常习惯」结构。

| #    | 用户意见                                                                                                                                                                                                                                                     | 落点                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| U-80 | `cache` / `nocache` 改为可随 props 动态修改，切换时按新状态启用 / 清理缓存，只提醒不要无意义地每帧反复切换；像素风删除「并尽量按整数倍放大」及整数缩放暗示，保留 `noanti` 与 `hd={false}` 缓存取舍；不改其它章节结构，不恢复排查 / profiling / 症状表 / live | `docs/advanced/ii/ui/ui-performance.md`；本记录 |

**状态：已执行（2026-11-15）**

### 执行记录

- 仅修改 `docs/advanced/ii/ui/ui-performance.md` 与 `.planning/phases/10-docs-restructure/10-54-USER-REVIEW.md`；未改源码、demo、配置、其它正文、计划 / ROADMAP / STATE，未写 SUMMARY，未 commit。
- `## cache 与 nocache`：删除「两者在元素创建时决定，不要把它当成运行时反复切换的开关」，改为「`nocache` 优先于 `cache`；两者都可以随 props 动态修改，切换时会按新状态启用或清理缓存。没有必要每帧反复切换，但不要把它们当成创建后不可改的固定值。」
- `## 像素风：抗锯齿与高清`：删除「并尽量按整数倍放大」，保留像素图使用 `noanti` 的建议与 `hd={false}` 的缓存取舍；未加入整数缩放要求或暗示。
- 源码核对（D-104）：`packages/render/src/core/item.ts` 的 `patchProp` 在 `cache` / `nocache` 分支写入 `cacheProp` / `nocacheProp` 并调用 `setCacheEnabled`（约 976–995 行）；`setCacheEnabled` 在开启时调用 `requireCanvas` 并建立缓存，关闭时清空缓存并置空（约 347–359 行）；构造函数按 `getDefaultCache()` 初始化（约 183–185 行）。`Container` 与 `CustomRenderItem` 的 `getDefaultCache()` 返回 `true`，`Text`、`Image`、`Animated` 与 `GraphicItemBase` 返回 `false`，既有默认缓存事实保留。
- 验证：`pnpm.cmd exec prettier --check docs/advanced/ii/ui/ui-performance.md .planning/phases/10-docs-restructure/10-54-USER-REVIEW.md` 通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建 green、无 dead link。

## 81 轮（2026-11-15，审阅收尾）

**用户意见（核心）：** 非示例文档已基本审阅完成；示例部分先保留，标记为待审阅，先不审阅它；文档审阅计划标记为已完成，当前计划收尾。

**用户原文：** 「这部分文档算是差不多全看完了。示例部分先保留，标记为待审阅，先不审阅它。你把文档审阅计划标记为已完成，把当前计划收尾。」

| #    | 用户意见                                                     | 落点                                                                                       |
| ---- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| U-81 | 文档审阅完成；示例 1-6 暂不审阅、标记待审阅；当前计划收尾 | 10-54-USER-REVIEW.md、10-54-SUMMARY.md、10-CUSTOM-UI-NOTES.md、ROADMAP / STATE |

**状态：已完成（带待审阅项）**

### 执行记录

- 非示例文档审阅完成；示例 inventory-example-1-skeleton、inventory-example-2-grid、inventory-example-3-detail、inventory-example-4-scroll、inventory-example-5-state、inventory-example-6-animation-and-register 保留现状，标记为待审阅。
- 25 篇 UI 文档中，19 篇非示例文档已审阅，6 篇示例待审阅；未把示例计入已完成。
- 文档审阅计划收尾；未改源码、demo、配置或其它正文；未 commit。