---
phase: 09-minimum-browser-runnable
plan: 1
subsystem: ui
tags: [ui, client-modules, migration, d-10, barrel, refactor, no-runtime]

# Dependency graph
requires:
  - phase: 04-render-adaptation
    provides: "D-69 barrel 硬约束、渲染端去单例化台账、IClientBase / IGameUIPropsBase 接口基准"
provides:
  - "D-10 叶子 / 基础 UI 模块迁移：render/ui/{save,statistics,viewmap,controller}.tsx → src/ui/，旧文件已删（无双份）"
  - "src/ui/index.ts 桶骨架：7 条 ./ 同目录导出（D-69 合规）"
  - "去重后的 controller.tsx（仅 mainUIController + createMainController）"
  - "background.tsx 独占 MainBackground / MainBackgroundUI / MainBackgroundProps"
  - "load.tsx / title.tsx props 基类型修正为 IUIPropsBase；render 能力导入直连叶子 ../render/use"
affects: [09-02, 09-03]

# Actuals (#2632) — 与计划 estimate 配对。tokens = chars/4 over 本次实际改动的 src/ui 文件集。
actuals:
  tokens: 17398
  tasks: 4
  commits: 3
  plan_head_before: 5bda40f08319eb859572a30f38950bcc3f44ebe7

tech-stack:
  added: []
  patterns:
    - "D-69：barrel 只允许 export * from './<同目录项>'"
    - "从 src/ui/** 引用 render 能力时直连叶子模块（../render/use），不经 render/index.tsx 桶，避免循环引用"
    - "组件 props 基类型统一为本地 IUIPropsBase（携带 props.state），不再引用不存在的 IUIDefaultPropsBase"

key-files:
  created:
    - packages-user/client-modules/src/ui/save.tsx
    - packages-user/client-modules/src/ui/statistics.tsx
    - packages-user/client-modules/src/ui/viewmap.tsx
    - packages-user/client-modules/src/ui/controller.tsx
  modified:
    - packages-user/client-modules/src/ui/background.tsx
    - packages-user/client-modules/src/ui/load.tsx
    - packages-user/client-modules/src/ui/title.tsx
    - packages-user/client-modules/src/ui/index.ts
  deleted:
    - packages-user/client-modules/src/render/ui/save.tsx
    - packages-user/client-modules/src/render/ui/statistics.tsx
    - packages-user/client-modules/src/render/ui/viewmap.tsx
    - packages-user/client-modules/src/render/ui/controller.tsx

key-decisions:
  - "Task 0 记为 completed-by-prior-user-approval：用户在父会话已明确回复「可以执行」，不再重复询问"
  - "controller/background 去重采用计划默认方案：MainBackground* 归 background.tsx，controller.tsx 减为 mainUIController + createMainController"
  - "render 能力（useKey/transitioned 等）导入一律直连叶子模块 ../render/use，不经 render/index.tsx 桶（避免 render/index.tsx ↔ src/ui 循环引用，dev.md:53）"
  - "load/title 的 props 基类型统一为本地 IUIPropsBase（src/ui/types.ts:4），移除对不存在符号 IUIDefaultPropsBase 的引用"
  - "本计划仅做 D-10 纯移动 + 引用改写，未触碰 D-11（client/单例消除）、D-12（IHeroAttr）、D-13（flags TODO）"

patterns-established:
  - "迁移 = 逐字拷贝 + 仅改写计划点名的相对说明符行；既有 jsDoc/注释零改动"
  - "模块级单例（mainUIController / sceneController / using）存废属 Phase 4 遗留未决项，不在本计划处理"

requirements-completed: []

coverage:
  - id: D1
    description: "Task 1（tracer）：render/ui/save.tsx 端到端迁移为 src/ui/save.tsx，三处相对说明符改写，旧文件删除，title.tsx 的 ./save 断链闭合"
    verification:
      - kind: other
        ref: "node static gate: packages-user/client-modules/src/ui/save.tsx migrated, specifiers rewritten, old deleted"
        status: pass
    human_judgment: false
  - id: D2
    description: "Task 2：render/ui/{statistics,viewmap}.tsx 迁移；statistics 纯拷贝，viewmap 说明符改写；旧文件删除"
    verification:
      - kind: other
        ref: "node static gate: OK statistics + viewmap migrated"
        status: pass
    human_judgment: false
  - id: D3
    description: "Task 3：controller.tsx 去重迁移 + background.tsx 接管 MainBackgroundProps 且不再引用 ../render"
    verification:
      - kind: other
        ref: "node static gate: OK controller dedup + background import fixed"
        status: pass
    human_judgment: false
  - id: D4
    description: "Task 3：load.tsx / title.tsx props 基类型修正为 IUIPropsBase，render 能力导入改指 ../render/use"
    verification:
      - kind: other
        ref: "node static gate: OK load/title props base = IUIPropsBase + render/use leaf import"
        status: pass
    human_judgment: false
  - id: D5
    description: "Task 3：src/ui/index.ts barrel 收口为 7 条 ./ 同目录导出（D-69 合规）"
    verification:
      - kind: other
        ref: "node static gate: OK barrel same-dir exports only"
        status: pass
    human_judgment: false

duration: ~12min
completed: 2026-10-09
status: complete
---

# Phase 9 Plan 1: UI 接口适配 · D-10 叶子/基础模块迁移 Summary

**D-10 纯移动落地：`render/ui/{save,statistics,viewmap,controller}.tsx` 迁入 `src/ui/`（旧文件全删），相对说明符与 props 基类型断链闭合，`src/ui/index.ts` 建立 7 条 D-69 合规同目录导出**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-10-09T07:46:00Z (approx.)
- **Completed:** 2026-10-09T07:58:03Z
- **Tasks:** 4 (Task 0 汇报关卡 + Task 1 tracer + Task 2 + Task 3)
- **Files modified:** 8 (4 created, 4 modified); 4 deleted

## Accomplishments

- `save.tsx` 端到端迁移（tracer）：`'../use'`→`'../render/use'`、`'../utils'`→`'../render/utils'`、`'../../shared'`→`'../shared'`；旧文件删除；`src/ui/title.tsx` 的 `import { saveLoad } from './save'` 断链闭合。
- `statistics.tsx` 逐字拷贝迁移（无仓内相对导入，含既有 `@ts-expect-error` 与 `ItemState` legacy 导入原样保留）；`viewmap.tsx` 迁移并改写说明符；两者旧文件删除。
- `controller.tsx` 与 `background.tsx` 去重：`MainBackground` / `MainBackgroundUI` / `MainBackgroundProps` 唯一归属 `background.tsx`；`controller.tsx` 仅保留 `mainUIController` + `createMainController`，从 `./background` 取 `MainBackgroundUI`。
- `load.tsx` / `title.tsx` props 基类型断链修正：`IUIDefaultPropsBase` → `IUIPropsBase`；`render` 能力导入由 `'../render'` 桶改指 `'../render/use'` 叶子模块（消除潜在循环引用）。
- `src/ui/index.ts` barrel 从 1 条扩到 7 条 `./` 同目录导出（`types` / `save` / `statistics` / `viewmap` / `controller` / `background` / `func`）。

## Task Commits

Each task was committed atomically:

1. **Task 0: 预执行汇报关卡** — 无提交（只读汇报；经父会话用户「可以执行」批准后放行）
2. **Task 1 (tracer): 迁移 save.tsx** — `3f5c323` (feat)
3. **Task 2: 迁移 statistics.tsx + viewmap.tsx** — `24ee08c` (feat)
4. **Task 3: controller 去重 + background/load/title 修正 + barrel 收口** — `b637d3b` (feat)

**Plan metadata:** 见最终 docs 提交

## Files Created/Modified

- `packages-user/client-modules/src/ui/save.tsx` - 迁移后存读档 UI（叶子模块）
- `packages-user/client-modules/src/ui/statistics.tsx` - 迁移后数据统计 UI（纯拷贝）
- `packages-user/client-modules/src/ui/viewmap.tsx` - 迁移后浏览地图 UI（说明符改写）
- `packages-user/client-modules/src/ui/controller.tsx` - 去重后主 UI 控制器
- `packages-user/client-modules/src/ui/background.tsx` - `MainBackgroundProps` 归属迁入 + `../render` 断链修正
- `packages-user/client-modules/src/ui/load.tsx` - props 基类型改 `IUIPropsBase` + `../render/use`
- `packages-user/client-modules/src/ui/title.tsx` - props 基类型改 `IUIPropsBase` + `../render/use`
- `packages-user/client-modules/src/ui/index.ts` - 7 条 D-69 同目录导出

## Decisions Made

- **Task 0 已由父会话用户批准：** 用户在讨论中已明确回复「可以执行」四个字，故 Task 0 关卡记为 completed-by-prior-user-approval，不再停机重问。
- **去重方案采用计划默认值：** `MainBackground*` 归 `background.tsx`，`controller.tsx` 减为 `mainUIController` + `createMainController`（用户在 Task 0 未提出否决）。
- **render 能力导入直连叶子模块：** 所有迁移/修正文件的 `render` 能力导入使用 `'../render/use'`，不经 `src/render/index.tsx` 桶，避免 `render/index.tsx ↔ src/ui` 循环引用（`dev.md:53`）。
- **不越界：** 未新增 `createUI` 导出，未添加 `./main` / `./settings` / `./statusBar` / `./toolbar` 桶条目（归 09-02）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] PowerShell 无法直接解析含内嵌双引号的 `node -e` 验证脚本**
- **Found during:** Task 3（三个 `<automated>` 验证命令）
- **Issue:** 计划 Task 3 的三个 `<automated>` 脚本含内嵌双引号（`"new UIController('main-ui')"`、`"from '../render/use'"`），在 Windows PowerShell（本执行环境 shell）下 `node -e "…"` 会因引号解析歧义而无法直接执行。
- **Fix:** 将三个脚本的 JS 原样写入临时 `.cjs` 文件（`%TEMP%\opencode\gsd-verify-09-01-t3{a,b,c}.cjs`）后以 `node <file>` 执行——断言逻辑与计划逐字一致，仅执行方式等价替换。Task 1/2 的无冲突脚本仍按 `node -e` 原地执行。
- **Files modified:** 仅临时目录（仓外）；无生产文件受影响
- **Verification:** 三个脚本均输出 OK 且 `exit=0`
- **Committed in:** 不涉及（临时文件在仓外，不提交）

**2. [Rule 3 - Blocking] Write 工具生成的新文件为 LF，需规范化为 CRLF**
- **Found during:** Task 3（新建 `src/ui/controller.tsx`）
- **Issue:** `dev.md:116` 要求 CRLF；Write 工具新建的 `controller.tsx` 初写为 LF（`bareLF=8`）。
- **Fix:** 以 node 将该文件 `\n` 规范化为 `\r\n`（内容不变）。
- **Files modified:** `packages-user/client-modules/src/ui/controller.tsx`
- **Verification:** `CRLF=8 bareLF=0`
- **Committed in:** `b637d3b` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** 两者均为执行环境/工具适配，未改变任何断言、范围或行为；生产改动与计划 `files_modified` / `files_deleted` 完全一致。

## Issues Encountered

- **计划行号漂移（预期内）：** 规划日锚点与执行日实测基本吻合；`title.tsx` 的 `../render` 导入实测位于 `:25-30`（与计划一致）。未发现需记录的实质差异。
- **临时验证脚本执行方式：** 见 Deviations 第 1 条。

## Known Stubs

无本计划引入的 stub。计划范围外、由 09-02 承接的暂态断链（非本计划引入、非缺陷）见下。

## Threat Flags

None — 无新增网络端点、鉴权路径、文件访问或信任边界改动；仅包内文件位移与相对说明符/类型基类改写。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **09-02 就绪项：** `src/ui/` 目标骨架已成形（叶子/基础 4 模块 + 7 条 barrel）。09-02 可继续迁移 `render/ui/{main,settings,statusBar,toolbar,title,load,index}` 剩余部分、改写跨目录引用（`render/index.tsx` / `client.ts` / `render/action.ts`）并收口 `createUI` 与新桶。
- **暂态断链（计划既定，非缺陷）：** `src/ui/title.tsx:30` 仍 `import { MainSceneUI } from './main'`——`./main` 迁移归 09-02；同理 `src/render/ui/` 下仍留有 7 个待迁移文件。这是分阶段迁移的预期中间态，不属于本计划范围，也未经用户确认为问题，故不登记为缺陷。
- **单例归属（待用户裁定）：** `mainUIController` / `sceneController` / `using` 模块级单例的存废仍属 Phase 4 遗留未决项，09-03 处理 `client`/`state` 单例消除时需一并呈报。
- **验证口径：** 本计划为静态门禁 + 人工复核，无运行时要求（Phase 4 D-68）；渲染端 `pnpm test:ci` 回归门禁落在 09-02 收口。

## Self-Check: PASSED

- 创建文件存在：`src/ui/{save,statistics,viewmap,controller}.tsx` ✓
- 旧文件删除：`render/ui/{save,statistics,viewmap,controller}.tsx` 均不存在 ✓
- 提交存在：`3f5c323` / `24ee08c` / `b637d3b` ✓
- 范围门禁：`git status --porcelain -- packages packages-user src` 仅剩用户并发改动 ` M packages-user/data-base/src/enemy/types.ts`（未触碰、未暂存）✓
- 计划级 `<verification>` 综合门禁：displacement + specifier + dedup + propsbase + barrel(D-69) 全部通过 ✓

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-09*
