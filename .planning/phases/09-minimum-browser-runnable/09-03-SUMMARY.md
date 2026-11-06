---
phase: 09-minimum-browser-runnable
plan: 3
subsystem: ui
tags: [ui, client-modules, d-11, d-13, props-state, interface-alignment, refactor, nested-threading]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-02 D-10 收口：src/ui/ 为唯一 UI 来源，render/ui/ 删除，main/settings/statusBar/toolbar 仍从 ../core 取 client 单例"
provides:
  - "D-11：src/ui/{main,settings,statusBar,toolbar}.tsx 消除 client 单例，主对象改经 props.state: IClientBase 获取"
  - "旧→新映射表 6 项替换全部落地（materials / flags / hero.attribute.getFinalAttribute x9 / hero.attribute.addHook / mainMapRenderer / mainMapExtension）"
  - "props 基类型统一：MainSettingsProps/MainSceneProps/StatusBarProps/ToolbarProps/ReplayingProps 均携带 IUIPropsBase 且 props 数组含 'state'"
  - "嵌套 state 透传：MainScene -> LeftStatusBar/RightStatusBar；LeftStatusBar -> MixedToolbar；MixedToolbar -> Numpad/Replaying/PlayingToolbar"
  - "D-13：flags 读取点以 // TODO: 占位（main x3，settings x2），无监听代码"
affects: [09-04]

# Actuals (#2632) — 与计划 estimate 配对。tokens = chars/4 over 本计划实际改动文件集的 git diff。
actuals:
  tokens: 3128
  tasks: 3
  commits: 2
  plan_head_before: 804844e5b5f969092b73e4558c100be202b99ca1

tech-stack:
  added: []
  patterns:
    - "D-11：src/ui 组件经 props.state（容器注入 + 嵌套 prop 透传）取 IClientBase，禁止 import { client }"
    - "顶层 UI 用 defineComponent<TProps>(props => ..., tProps) 且 props 数组含 'controller','instance','state'"
    - "嵌套组件（状态栏/工具栏群）不经容器注入，由上层以 state={...} 逐级透传，props 基类型挂 IUIPropsBase"
    - "D-13：flags 无监听系统时仅就近 // TODO:（dev.md:78 格式），不加订阅"

key-files:
  created: []
  modified:
    - packages-user/client-modules/src/ui/settings.tsx
    - packages-user/client-modules/src/ui/main.tsx
    - packages-user/client-modules/src/ui/statusBar.tsx
    - packages-user/client-modules/src/ui/toolbar.tsx

key-decisions:
  - "Task 0 记为 completed-by-prior-user-approval：用户在父会话已回复「可以执行」并确认两项默认机制（嵌套 state 经 prop 透传；新接口名 MainSceneProps），不再停机重问"
  - "mainMapRenderer/mainMapExtension 采用成员访问 props.state.mainMapRenderer / props.state.mainMapExtension（而非解构），以同时满足计划 verify 门禁的文本断言与 orchestrator 的 client.* -> props.state.* 口径"
  - "statusBar/toolbar 的 props 基类型在保留 DefaultProps 的基础上追加 IUIPropsBase（与已迁移 title.tsx/load.tsx 的既有范式一致），避免删除仍在使用的 DefaultProps 引入项"
  - "阻断项（state(data-state) / using / mainUIController / sceneController）一律保持原读取不动，仅登记待用户裁定"

patterns-established:
  - "4 项阻断项与 props.state 同名字段非同实例：本 run 不替换，保持语义不变"
  - "对齐改动若使某行超过 printWidth(80)，须以仓库 prettier 归范，保持 dev.md 无格式报错"

requirements-completed: []

coverage:
  - id: D1
    description: "Task 0：预执行汇报关卡（D-11 映射表 / 阻断项 / 嵌套透传机制 / D-13 / 范围 / 验证方式），等待用户「可以执行」"
    verification: []
    human_judgment: true
    rationale: "关卡性质为 blocking-human；用户已在父会话明确回复「可以执行」并确认嵌套 state 经 prop 透传、接受新接口名 MainSceneProps。系人工确认，非自动可判。"
  - id: D2
    description: "Task 1（tracer）：settings.tsx 顶层 UI 经 props 机制取主对象，client.flags -> props.state.flags，props 基类型 -> IUIPropsBase + 'state'，D-13 TODO x2"
    verification:
      - kind: other
        ref: "node static gate: OK settings.tsx client eliminated, props.state.flags + TODO"
        status: pass
    human_judgment: false
  - id: D3
    description: "Task 2：main.tsx（MainSceneProps + props 声明 + 6 类 client.* 替换 + 2 处嵌套 state 透传 + TODO x3）+ statusBar.tsx / toolbar.tsx（materials 替换 + props 基类型 + state 透传）"
    verification:
      - kind: other
        ref: "node static gate: OK no client singleton in src/ui; OK main/statusBar/toolbar aligned to props.state"
        status: pass
    human_judgment: false
  - id: D4
    description: "Task 2：阻断项保持（state(data-state)/using/mainUIController/sceneController 读取不动）+ CRLF + prettier 归范"
    verification:
      - kind: other
        ref: "node static gate: OK blocked items (state/using/mainUIController) untouched; prettier --check All matched files use Prettier code style; CRLF verified (bareLF=0)"
        status: pass
    human_judgment: false

duration: ~7min
completed: 2026-10-09
status: complete
---

# Phase 9 Plan 3: D-11 UI 对齐（client 单例 -> props.state）+ D-13 flags TODO Summary

**src/ui 四个 UI 文件彻底消除 client 单例：6 项旧接口全部改经 props.state: IClientBase，顶层经容器注入、嵌套经 prop 透传 state，flags 读取以 TODO 占位，4 项阻断项如实保留**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-10-09T17:10:59Z
- **Completed:** 2026-10-09T17:18:09Z
- **Tasks:** 3 (Task 0 汇报关卡 + Task 1 tracer + Task 2)
- **Files modified:** 4

## Accomplishments

- **Task 0（汇报关卡，已满足）：** 用户在父会话回复「可以执行」，并明确确认两项默认机制——嵌套组件经 prop 透传 `state`（不采用 provide/inject）；新接口名 `MainSceneProps` 被接受。记为 completed-by-prior-user-approval，未重复停机。
- **Task 1（tracer，settings.tsx）：** `MainSettingsProps` 基类型 `IUIDefaultPropsBase` -> `IUIPropsBase`（自 `./types` 引入），`mainSettingsProps.props` 增 `'state'`；两处 `client.flags` -> `props.state.flags`；两处 `__seed__` 读取点各加 `// TODO:`（D-13）；删除 `import { client } from '../core'`。
- **Task 2（main.tsx / statusBar.tsx / toolbar.tsx）：**
  - `main.tsx`：新增 `interface MainSceneProps extends IUIPropsBase {}` 与 `mainSceneProps = { props: ['controller','instance','state'] }`；`defineComponent<MainSceneProps>(props => ..., mainSceneProps)`；`const mainMapRenderer = props.state.mainMapRenderer;` / `mainMapExtension` 同；`client.flags` -> `props.state.flags`；9 处 `getFinalAttribute` 与 1 处 `addHook` 全部 `props.state.hero.attribute.*`；渲染树向 `<LeftStatusBar>` / `<RightStatusBar>` 各加 `state={props.state}`；3 处 flags TODO；`state`(data-state) / `using` / `mainUIController` 保持不动。
  - `statusBar.tsx`：`StatusBarProps<T>` 追加 `IUIPropsBase`，props 数组增 `'state'`；`client.materials` -> `p.state.materials`；向 `<MixedToolbar>` 透传 `state={p.state}`；`openViewMap(mainUIController, ...)` 保持。
  - `toolbar.tsx`：`ToolbarProps` 追加 `IUIPropsBase`，`toolbarProps.props` 增 `'state'`；`ReplayingProps extends ToolbarProps` 自动携带，`replayingProps.props` 增 `'state'`；两处 `client.materials` -> `props.state.materials`；向 `<NumpadToolbar>` / `<ReplayingToolbar>` / `<PlayingToolbar>` 透传 `state={props.state}`；所有 `mainUIController` 用法保持。

## Task Commits

Each task was committed atomically:

1. **Task 1（tracer）: settings.tsx 对齐** — `d1f167c` (refactor)
2. **Task 2: main/statusBar/toolbar 对齐** — `699b0b0` (refactor)

**Plan metadata:** SUMMARY 见最终 docs 提交（或跳过，见下）

_注：Task 0 为只读汇报关卡，无提交。_

## Files Created/Modified

- `packages-user/client-modules/src/ui/settings.tsx` - `props.state.flags`（2）；基类型 `IUIPropsBase` + `'state'`；TODO x2；删 client 导入
- `packages-user/client-modules/src/ui/main.tsx` - `MainSceneProps` + props 声明；6 类 `client.*` -> `props.state.*`；嵌套 state 透传 x2；TODO x3
- `packages-user/client-modules/src/ui/statusBar.tsx` - `p.state.materials`；基类型 + `'state'`；向 MixedToolbar 透传
- `packages-user/client-modules/src/ui/toolbar.tsx` - `props.state.materials`（2）；基类型 + `'state'`；向三个子工具栏透传

## Decisions Made

- **Task 0 已由父会话用户批准：** 用户在父会话明确回复「可以执行」并确认「嵌套 `state` 经 prop 透传」与「新接口名 `MainSceneProps`」，Task 0 记为 completed-by-prior-user-approval。
- **mainMapRenderer/mainMapExtension 走成员访问：** 计划 action 写 `const { ... } = props.state;`（解构），但计划 verify 门禁断言字面量 `props.state.mainMapRenderer` / `props.state.mainMapExtension`，orchestrator 口径亦为 `client.*` -> `props.state.*`。以 verify 门禁为准，改为两条成员访问读取（行为不变、变量名保留，JSX 未动）。
- **statusBar/toolbar 保留 `DefaultProps` 并追加 `IUIPropsBase`：** 与已迁移 `title.tsx`/`load.tsx` 的既有范式（`extends DefaultProps, IUIPropsBase`）一致，同时避免删除仍在使用的 `DefaultProps` 引入项。
- **阻断项零变更：** `state`(data-state，`state.maps`)、`using`（`../render/renderer`）、`mainUIController`（`./controller`）均保持原读取，登记待用户裁定。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 计划 action 与 verify 门禁冲突：mainMapRenderer/mainMapExtension 解构 vs 成员访问**
- **Found during:** Task 2（主场景重接线）
- **Issue:** action 要求 `const { mainMapRenderer, mainMapExtension } = props.state;`，但 `verify` 门禁断言源文本包含 `props.state.mainMapRenderer` / `props.state.mainMapExtension`；两者无法同时成立。
- **Fix:** 采用成员访问 `const mainMapRenderer = props.state.mainMapRenderer;` + `const mainMapExtension = props.state.mainMapExtension;`（满足门禁；行为保持；JSX 不变），符合 orchestrator 的 `client.*` -> `props.state.*` 口径。
- **Files modified:** `packages-user/client-modules/src/ui/main.tsx`
- **Verification:** Task 2 gate "OK main/statusBar/toolbar aligned to props.state"
- **Committed in:** `699b0b0`

**2. [Rule 3 - Blocking] 替换后行宽超 printWidth(80)，以仓库 prettier 归范 4 文件**
- **Found during:** Task 1 / Task 2（提交前）
- **Issue:** `props.state` 比 `client` 长，`main.tsx` 3 条 `getFinalAttribute` 行与 `settings.tsx` 的 interface 头超出 80；仓库 `.prettierrc` 为 printWidth 80。逐字替换会使文件不符合 dev.md「无 eslint 报错」。
- **Fix:** 用仓库 prettier 3.8.1 对 4 个文件 `--write`（仅格式：main 折行 3 处、settings interface 收为单行；statusBar/toolbar 无变化）。断言逻辑与替换语义不变。
- **Files modified:** `settings.tsx`, `main.tsx`
- **Verification:** `prettier --check` -> All matched files use Prettier code style；四条静态门禁重跑全 PASS
- **Committed in:** `d1f167c`（settings，Task 1 commit 已 amend 折入）、`699b0b0`（main）

**3. [Rule 3 - Blocking] settings.tsx 基类型切换后 `IUIDefaultPropsBase` 引入项变为未使用**
- **Found during:** Task 1
- **Issue:** 把 `MainSettingsProps` 基类型由 `IUIDefaultPropsBase` 改为 `IUIPropsBase` 后，`@motajs/system` 的 `IUIDefaultPropsBase` 引入项不再被使用（eslint 报错）。计划门禁亦要求 `IUIDefaultPropsBase` 不得残留。
- **Fix:** 从 `@motajs/system` 引入中移除 `IUIDefaultPropsBase`（并收为单行 import）；新增 `import { IUIPropsBase } from './types';`。
- **Files modified:** `packages-user/client-modules/src/ui/settings.tsx`
- **Verification:** settings gate "OK settings.tsx client eliminated, props.state.flags + TODO"
- **Committed in:** `d1f167c`

**4. [Rule 3 - Blocking] PowerShell 引号解析使内联 `node -e` 门禁脚本无法直接执行**
- **Found during:** Task 1 / Task 2（各静态门禁）
- **Issue:** 计划的 `node -e "…"` 内含大量单双引号，Windows PowerShell 下引号解析歧义（与 09-01/09-02 同类）。
- **Fix:** 将各脚本 JS 原样写入 `%TEMP%\opencode\gsd-09-03-*.cjs` 后 `node <file>` 执行（断言逐字一致，仅执行壳层等价替换）。
- **Files modified:** 仅仓外临时目录（不提交）
- **Verification:** 4 条脚本均输出 OK 且 exit=0
- **Committed in:** 不涉及

---

**Total deviations:** 4 auto-fixed (1 bug/计划内部不一致，3 blocking)
**Impact on plan:** 均为接口对齐的必要收口；替换语义、阻断项、范围边界与既有注释均未变。生产改动严格限于计划 4 个 `files_modified`，零范围外改动。

## Issues Encountered

- **计划内部不一致（action vs verify）：** 见 Deviation 1，已按 verify 门禁（GSD 流程验收工具）解决并记录。

## Known Stubs

- `main.tsx`（3 处）与 `settings.tsx`（2 处）的 `// TODO: flags 更新未接（当前无监听系统）` —— **非缺陷**，系锁定裁定 D-13 明确要求：flags 尚无监听系统，本任务只标注、不实现订阅。计划 goal 不因此受阻；后续由 flags 监听系统任务承接。

## Threat Flags

None — 无新增网络端点、鉴权路径、文件访问或信任边界改动；仅包内 UI 组件由 client 单例改经 props.state 获取同一 `IClientBase`（注入 + 透传），阻断项读取保持。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **D-11 核心达成：** `packages-user/client-modules/src/ui/**` 内零 `client`（`src/core`）导入与零 `client.*` 用法；主对象经 props 机制获取（顶层注入 + 嵌套透传）。
- **旧 -> 新映射表 6 项替换全部落地：** `materials` / `flags` / `hero.attribute.getFinalAttribute`(x9) / `hero.attribute.addHook` / `mainMapRenderer` / `mainMapExtension`。
- **待用户裁定（登记，非本计划缺陷）：** 4 项阻断项——`state`(data-state，`state.maps`)、`using`（模块单例）、`mainUIController`（模块单例）、`sceneController`（模块单例）——与 `props.state` 同名字段非同实例，本 run 保持原读取；是否替换待后续裁定。
- **09-04 就绪项：** D-12 的独立响应式 `IHeroAttr` 对象抽取（`main.tsx` 的 `hero.attribute` 读取本计划只做来源替换）。
- **验证口径：** 本计划门禁全为静态（零 client / 映射 / props / 阻断项 / D-13）+ CRLF + prettier；未以 TS 诊断数 / `check:type` / `build` 为门禁。

## Self-Check: PASSED

- 创建/修改文件存在：`src/ui/{main,settings,statusBar,toolbar}.tsx` 均 FOUND ✓
- 提交存在：`d1f167c` / `699b0b0`（`git log --oneline` 确认）✓
- 静态门禁：Task 1（1 条）+ Task 2（3 条）全部 PASS ✓
- 范围门禁：`git status --porcelain -- packages packages-user src` 仅 ` M packages-user/data-base/src/enemy/types.ts`（用户并发改动，未触碰、未暂存）✓
- CRLF：4 文件 bareLF=0 ✓；prettier --check 全绿 ✓
- 提交计数（测量）：`git rev-list --count 804844e..HEAD` = 2 ✓

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-09*
