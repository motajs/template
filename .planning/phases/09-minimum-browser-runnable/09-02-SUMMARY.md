---
phase: 09-minimum-browser-runnable
plan: 2
subsystem: ui
tags: [ui, client-modules, migration, d-10, d-69, barrel, cycle-prevention, refactor, test-ci]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-01 D-10 叶子/基础模块迁移（save/statistics/viewmap/controller）+ src/ui/index.ts 桶骨架 + render 能力直连叶子模块范式"
provides:
  - "D-10 收口：render/ui/{main,settings,statusBar,toolbar} 迁入 src/ui/，旧文件删除（render/ui/ 整目录不存在，无双份）"
  - "src/ui/index.ts 完整 barrel：11 条 ./ 同目录导出 + createUI()"
  - "三处跨目录消费者改写：render/index.tsx（'../ui' / '../ui/load'，删 :39 的 ./ui 转发）、render/action.ts（'../ui'）、client.ts（'./ui/load'）"
  - "包公共面承接：client-modules/src/index.ts 新增 export * from './ui'，承接被删的 render/index.tsx 转发"
affects: [09-03, 09-04]

# Actuals (#2632) — 与计划 estimate 配对。tokens = chars/4 over 本计划实际改动的非删除文件集。
actuals:
  tokens: 17884
  tasks: 3
  commits: 2
  plan_head_before: 6a3812252b330cd09c418705c14d9d9a49f2a314

tech-stack:
  added: []
  patterns:
    - "D-69：barrel 只允许 export * from './<同目录项>'；跨目录转发改由包根直连承接"
    - "从 src/ui/** 引用 render 能力时直连叶子模块（../render/use / ../render/renderer / ../render/utils），绝不 import '../render' 桶，消解 render/index.tsx ↔ src/ui 循环（dev.md:53）"
    - "迁移 = 逐字拷贝 + 仅改写计划点名的相对说明符行；既有 jsDoc/注释/legacy/core.* 零改动（D-14）"

key-files:
  created:
    - packages-user/client-modules/src/ui/main.tsx
    - packages-user/client-modules/src/ui/settings.tsx
    - packages-user/client-modules/src/ui/statusBar.tsx
    - packages-user/client-modules/src/ui/toolbar.tsx
  modified:
    - packages-user/client-modules/src/ui/index.ts
    - packages-user/client-modules/src/render/index.tsx
    - packages-user/client-modules/src/render/action.ts
    - packages-user/client-modules/src/client.ts
    - packages-user/client-modules/src/index.ts
  deleted:
    - packages-user/client-modules/src/render/ui/main.tsx
    - packages-user/client-modules/src/render/ui/settings.tsx
    - packages-user/client-modules/src/render/ui/statusBar.tsx
    - packages-user/client-modules/src/render/ui/toolbar.tsx
    - packages-user/client-modules/src/render/ui/title.tsx
    - packages-user/client-modules/src/render/ui/load.tsx
    - packages-user/client-modules/src/render/ui/index.ts

key-decisions:
  - "Task 0 记为 completed-by-prior-user-approval：用户在父会话已明确回复「可以执行」，不再重复停机询问"
  - "迁移严格「只改说明符」：main.tsx 用 ../render/renderer、settings/toolbar 用 ../render/use、四个文件用 ../shared 与 ../core；client/state/core.*/legacy 与全部注释逐字保留（未做 D-11）"
  - "render/index.tsx:39 的 export * from './ui' 删除（迁移后死链 + 违反 D-69），UI 公共面改由 client-modules/src/index.ts 的 export * from './ui' 承接"
  - "pnpm check:circular 报告 16 个循环（既有基线为 18），均非 render/index.tsx ↔ src/ui 直接循环；记录不阻塞"
  - "pnpm test:ci 的 61 个失败全部可归因于用户既有提交 8fb16a1「删除 setAttributeDefaults 接口」，非本计划改动；如实记录、不阻塞、不修改用户文件"

patterns-established:
  - "迁移收口后必须删除源目录 render/ui/**（含 title/load/index），不得留双份"
  - "跨目录公共面承接：被删的中间 barrel 转发改由包根同目录 export * 承接，保持公共面不缩水"

requirements-completed: []

coverage:
  - id: D1
    description: "Task 1：render/ui/{main,settings,statusBar,toolbar}.tsx 迁入 src/ui/，仅改写相对说明符（叶子模块），旧文件删除"
    verification:
      - kind: other
        ref: "node static gate: OK 4 modules migrated, specifiers rewritten to leaf modules"
        status: pass
    human_judgment: false
  - id: D2
    description: "Task 1：src/ui/index.ts 补齐 ./main ./settings ./statusBar ./toolbar + createUI()"
    verification:
      - kind: other
        ref: "node static gate: OK barrel complete + createUI"
        status: pass
    human_judgment: false
  - id: D3
    description: "Task 2：render/index.tsx / render/action.ts / client.ts 跨目录引用改写 + 包根新增 ./ui + render/ui/ 整目录删除"
    verification:
      - kind: other
        ref: "node static gate: OK consumers rewired, render/ui deleted, root ./ui added"
        status: pass
    human_judgment: false
  - id: D4
    description: "Task 2：D-69 桶门禁（三 barrel 全 ./ 前缀）+ 循环引用门禁（src/ui/** 无 from '../render' 桶导入）"
    verification:
      - kind: other
        ref: "node static gate: OK D-69 + OK no src/ui file imports the render barrel"
        status: pass
    human_judgment: false
  - id: D5
    description: "Task 2：pnpm check:circular 运行并判定是否出现 render/index.tsx ↔ src/ui 循环"
    verification:
      - kind: other
        ref: "pnpm check:circular: 16 cycles reported (documented baseline was 18); none is the direct render/index.tsx ↔ src/ui cycle"
        status: pass
    human_judgment: false
  - id: D6
    description: "Task 2：pnpm test:ci 回归门禁与失败归因"
    verification: []
    human_judgment: true
    rationale: "test:ci 报 61 failed / 654 passed / 1 skipped（10 文件），全部为数据端（data-state/data-base）且由用户既有提交 8fb16a1 删除 setAttributeDefaults 接口导致，与本计划（纯 client-modules 渲染端文件位移）无因果关系；归因判断需人工/用户确认，故不作自动通过。"

duration: ~18min
completed: 2026-10-09
status: complete
---

# Phase 9 Plan 2: D-10 收口 · UI 目录移动（剩余 4 模块 + 跨目录引用改写 + 删尽旧目录 + D-69 桶收口）Summary

**D-10 收口完成：render/ui/{main,settings,statusBar,toolbar}.tsx 迁入 src/ui/（旧文件全删、render/ui/ 整目录不存在），三处跨目录消费者改写，包根 `export * from './ui'` 承接被删的 render 桶转发，D-69 与循环引用门禁通过**

## Performance

- **Duration:** ~18 min (approx.)
- **Started:** 2026-10-09T08:46:00Z (approx.)
- **Completed:** 2026-10-09T09:04:59Z
- **Tasks:** 3 (Task 0 汇报关卡 + Task 1 + Task 2)
- **Files modified:** 5 (4 created + 1 modified in Task 1; 4 modified + 3 deleted in Task 2); 7 deleted total

## Accomplishments

- **Task 0**：预执行汇报关卡记为 completed-by-prior-user-approval（用户已在父会话回复「可以执行」），只读汇报内容完整覆盖问题、D-10/D-14/D-69、7 项源→目标映射、范围硬边界、验证方式（含 `pnpm test:ci`）与关卡性质。
- **Task 1（迁移 + 补桶）**：`main` / `settings` / `statusBar` / `toolbar` 四个模块逐字迁移，仅改写计划点名说明符（`'../../shared'`→`'../shared'`、`'../renderer'`→`'../render/renderer'`、`'../utils'`→`'../render/utils'`、`'../use'`→`'../render/use'`、`'../../core'`→`'../core'`）；经逐行 diff 核验为「除说明符行外逐字一致」。`src/ui/index.ts` 补齐 4 条同目录导出并定义 `createUI()`（调 `createMainController()`）。
- **Task 2（跨目录改写 + 删尽旧目录 + D-69 收口）**：`render/index.tsx` 改指 `'../ui'` / `'../ui/load'` 并删除 `:39` 的 `export * from './ui'`（死链 + 违反 D-69）；`render/action.ts` 改指 `'../ui'`；`client.ts` 改指 `'./ui/load'`；`src/index.ts` 新增 `export * from './ui'`；删除 `render/ui/{title,load,index}` 并移除空目录——`render/ui/` 目录不存在、无 tracked 残留。
- **门禁**：Task 1 两条静态门禁 + Task 2 三条静态门禁全部 PASS；`pnpm check:circular` 报告 16 个既有循环（历史文档基线为 18），无 `render/index.tsx ↔ src/ui` 直接循环；`pnpm test:ci` 的失败全部可归因于用户既有数据端提交，非本计划。

## Task Commits

Each task was committed atomically:

1. **Task 0: 预执行汇报关卡** — 无提交（只读汇报；经父会话用户「可以执行」批准后放行）
2. **Task 1: 迁移 main/settings/statusBar/toolbar + 补全 barrel** — `964f479` (feat)
3. **Task 2: 跨目录消费者改写 + 包根 ./ui + 删尽 render/ui + 门禁** — `2ed6046` (feat)

**Plan metadata:** 见最终 docs 提交

## Files Created/Modified

- `packages-user/client-modules/src/ui/main.tsx` - 迁移后主场景 UI（`MainSceneUI`）；render 能力经 `../render/renderer`
- `packages-user/client-modules/src/ui/settings.tsx` - 迁移后设置菜单 UI 群；`../render/utils` + `../render/use`
- `packages-user/client-modules/src/ui/statusBar.tsx` - 迁移后状态栏 UI；`../shared` + `../core`
- `packages-user/client-modules/src/ui/toolbar.tsx` - 迁移后工具栏 UI；`../render/use` + `../shared` + `../core`
- `packages-user/client-modules/src/ui/index.ts` - 完整 barrel（11 条同目录导出）+ `createUI()`
- `packages-user/client-modules/src/render/index.tsx` - 改指 `../ui` / `../ui/load`，删 `./ui` 转发
- `packages-user/client-modules/src/render/action.ts` - 改指 `../ui`
- `packages-user/client-modules/src/client.ts` - `LoadSceneUI` 改指 `./ui/load`
- `packages-user/client-modules/src/index.ts` - 新增 `export * from './ui'`（公共面承接）
- 删除：`packages-user/client-modules/src/render/ui/**`（main/settings/statusBar/toolbar/title/load/index，7 文件 + 目录）

## Decisions Made

- **Task 0 已由父会话用户批准：** 用户在父会话明确回复「可以执行」四个字，故 Task 0 关卡记为 completed-by-prior-user-approval，不再停机重问。
- **迁移严格「只改说明符」：** 未触碰 `client` / `state` / `core.*` / legacy 用法与任何既有注释、jsDoc；D-11（单例消除）归 09-03。
- **D-69 公共面承接方式：** 删除 `render/index.tsx:39` 的 `./ui` 转发（迁移后成死链且违反 D-69），改由 `client-modules/src/index.ts`（包根、同目录）`export * from './ui'` 承接，保持 `@user/client-modules` UI 符号不缩水。
- **循环引用防线：** `src/ui/**` 内 render 能力一律直连叶子模块（`../render/use` / `../render/renderer` / `../render/utils`），门禁断言无 `from '../render'` 桶导入，从而消解 `render/index.tsx ↔ src/ui` 循环（`dev.md:53`）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] PowerShell 执行策略禁止 `pnpm.ps1`，改用 `cmd /c "pnpm …"`**
- **Found during:** Task 2（`pnpm check:circular` / `pnpm test:ci`）
- **Issue:** 本执行环境为 Windows PowerShell，默认执行策略禁止运行 `D:\nvm\v24.21.0\pnpm.ps1`（`UnauthorizedAccess`）。
- **Fix:** 经 `cmd /c "pnpm check:circular"` / `cmd /c "pnpm test:ci"` 调用同一 pnpm 命令（命令与门禁语义不变，仅换壳层调用方式）。
- **Files modified:** 无生产文件（仅调用方式）
- **Verification:** 两条命令均实际执行并产出完整输出
- **Committed in:** 不涉及

**2. [Rule 3 - Blocking] 计划内联 `node -e` 验证脚本受 PowerShell 引号解析影响，改写入临时 `.cjs` 执行**
- **Found during:** Task 1 / Task 2（各 `<automated>` 静态门禁）
- **Issue:** 计划中的 `node -e "…"` 脚本含大量内嵌双引号，在 Windows PowerShell 下 `node -e "…"` 会因引号解析歧义而无法直接执行（与 09-01 同类问题）。
- **Fix:** 将各脚本 JS 原样写入 `%TEMP%\opencode\gsd-09-02-*.cjs` 后以 `node <file>` 执行——断言逻辑与计划逐字一致，仅执行方式等价替换。
- **Files modified:** 仅仓外临时目录（不提交）
- **Verification:** 5 个静态门禁脚本均输出 OK 且 `exit=0`
- **Committed in:** 不涉及

**3. [Rule 3 - Blocking] Write 工具生成的新 `src/ui/index.ts` 为 LF，规范化为 CRLF**
- **Found during:** Task 1（重建 src/ui/index.ts）
- **Issue:** `dev.md:116` 要求 CRLF；Write 工具新建文件初写为 LF。
- **Fix:** 以 node 将 `\n` 规范化为 `\r\n`（内容不变）。
- **Files modified:** `packages-user/client-modules/src/ui/index.ts`
- **Verification:** `CRLF=17 bareLF=0`
- **Committed in:** `964f479` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking；均为执行环境/工具适配)
**Impact on plan:** 三个偏差均不改变任何断言、范围或行为；生产改动与计划 `files_modified` / `files_deleted` 完全一致，零范围外改动（用户并发文件 `packages-user/data-base/src/enemy/types.ts` 未触碰、未暂存）。

## Issues Encountered

- **`pnpm check:circular` 报告 16 个循环（非本计划引入）：** 其中包含 `client.ts > render/index.tsx > render/action.ts > ui/index.ts > ui/main.tsx > core.ts` 的既有链路。判定：非 `render/index.tsx ↔ src/ui` 直接循环——Task 2 门禁已证明 `src/ui/**` 无 `from '../render'` 桶导入（`ui → render/index.tsx` 边不存在），故计划 threat T-09-02-06 描述的「双向互指」不成立；该链路经 `action.ts`/`core.ts`/`client.ts` 的既有结构，迁移前经 `render/ui` 同样存在。历史文档（Phase 01/02）记录基线为 18 个循环，本次 16 个（不增反减）。按计划规则：记录、不阻塞。
- **`pnpm test:ci` 报 61 failed / 654 passed / 1 skipped（10 文件，65 文件总数）：** 全部失败文件均为数据端（`packages-user/data-state/**`、`packages-user/data-base/src/enemy/__test__/manager.test.ts`），错误统一为 `manager.setAttributeDefaults is not a function`（`data-state/src/enemy/special.ts:51` ← `new CoreState` `data-state/src/core.ts:152`）。经 `git log -S setAttributeDefaults` 定位：用户既有提交 `8fb16a1 refactor: 删除 setAttributeDefaults 接口`（2026-10-08，`unanmed`，HEAD 的祖先）删除了该接口，但 `special.ts:51` 与相关测试仍引用它。该失败与 Plan 09-02（纯 `client-modules` 渲染端文件位移）无因果关系，**非本计划门禁失败**；如实记录、未修改任何用户文件。本计划改动文件不在任何失败文件或失败链路上。

## Known Stubs

无本计划引入的 stub。计划范围外、由 09-03 承接的 `client` / `state` / 模块单例（`mainUIController` / `sceneController` / `using`）消除属 D-11，非缺陷。

## Threat Flags

None — 无新增网络端点、鉴权路径、文件访问或信任边界改动；仅包内文件位移与相对说明符/barrel 转发来源迁移。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **D-10 收口完成：** `render/ui/` 整目录删除（0 tracked 残留），`src/ui/` 为唯一 UI 来源；三处跨目录消费者改写到位；`@user/client-modules` UI 公共面经包根 `./ui` 承接。
- **09-03 就绪项：** `src/ui/**` 内 `client` / `state` 单例的消除（D-11）与模块级单例归属裁定可在唯一来源上继续。
- **待用户裁定/知悉（非本计划缺陷）：** ① `pnpm test:ci` 的 61 个数据端失败源于用户既有提交 `8fb16a1`，需由用户决定数据端修复归属；② `pnpm check:circular` 的 16 个既有循环维持基线（历史 18）。
- **验证口径：** 本计划门禁为静态 + 一次 `pnpm check:circular` + 一次 `pnpm test:ci`；未以 TS 诊断数 / `check:type` / `build` 为门禁（Phase 4 D-68）。

## Self-Check: PASSED

- 创建文件存在：`src/ui/{main,settings,statusBar,toolbar}.tsx` ✓
- 旧目录删除：`packages-user/client-modules/src/render/ui/` 目录不存在，`git ls-files` 在该路径下为空 ✓
- 提交存在：`964f479` / `2ed6046` ✓（`git log --oneline` 确认）
- 静态门禁：Task 1（2 条）+ Task 2（3 条）全部 PASS ✓
- 范围门禁：`git status --porcelain -- packages packages-user src` 仅剩用户并发改动 ` M packages-user/data-base/src/enemy/types.ts`（未触碰、未暂存）✓
- 回归/循环门禁：`pnpm check:circular`（16 既有循环，无直接 `render/index.tsx ↔ src/ui`）与 `pnpm test:ci`（61 数据端既有失败，归因用户提交 `8fb16a1`）均已运行并记录 ✓

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-09*
