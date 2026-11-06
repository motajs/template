---
phase: 04-render-adaptation
plan: 12
subsystem: render-structure
tags: [barrel-boundary, consumer-direct-import, shared-single-file, d69-d70, refactor]
requires:
  - phase: 04-render-adaptation
    provides: 用户裁定 D-69（桶导出边界原则）/ D-70（对 04-11 落地的 6 条修正）与当日工作树 04-11 落地产物
  - phase: 04-render-adaptation
    provides: 04-11 的 39 文件下沉产物与 04-10 只读影响台账（#04-10-B-01 / B-05 / B-06 / C-01 / C-06 / D-01）
provides:
  - client-base/src/shared.ts 单文件（由 shared/{shared.ts,index.ts} 逐字折成），shared/ 目录删除；index.ts 的 ./shared 与 map/* 的 4 处说明符零改动
  - render/utils/index.ts 去 ./layout 越界转发及其标注，仅剩 ./saves / ./use
  - render/utils/saves.ts 的 getConfirm / waitbox 直连 @user/client-base，断链标注删除
  - render/ui/save.tsx 拆分 ../utils 导入（adjustGrid / IGridLayoutData → @user/client-base；getSave / SaveData → ../utils）
  - render/ui/title.tsx 的 adjustCover 直连 @user/client-base
  - 8 个 in-scope barrel 的桶边界门禁 + F5 8 处架构标注逐字保留 + 静态收口证据（无运行时验证）
affects: [04-render-adaptation]
actuals:
  tokens: 5281
  tasks: 5
  commits: 1
  plan_head_before: 79b87687e27754aba427b5996bb5e852fb344b10
tech-stack:
  added: []
  patterns:
    - "barrel 只导出同目录项（D-69）：export * 说明符一律 ./ 前缀，零越界 / 零转发"
    - "消费者直连包名（@user/client-base），不得经 barrel 转发已移入系统层的内容"
    - "目录→单文件折叠：逐字搬内容 + 删除旧两文件 + 移除空目录，相对说明符零改动即可解析"
key-files:
  created:
    - packages-user/client-base/src/shared.ts
    - .planning/phases/04-render-adaptation/04-12-SUMMARY.md
  modified:
    - packages-user/client-modules/src/render/utils/index.ts
    - packages-user/client-modules/src/render/utils/saves.ts
    - packages-user/client-modules/src/render/ui/save.tsx
    - packages-user/client-modules/src/render/ui/title.tsx
  deleted:
    - packages-user/client-base/src/shared/shared.ts
    - packages-user/client-base/src/shared/index.ts
key-decisions:
  - "F4 采用字节复制折叠：Copy-Item 保证 shared.ts 与 shared/shared.ts 逐字一致且 CRLF 不变，再删旧两文件与空目录"
  - "F2/F2' 采用最小改动：save.tsx 原 ../utils 一条拆为两条同位置语句，title.tsx 只替换说明符文本，不合并既有 @user/client-base 导入"
  - "计划 Task 4 范围门禁的 .planning/.../04-CONTEXT.md「未提交改动仍在」子断言在执行日前提失效（用户已于 79b8768 提交该改动），按 Rule 3 忠实改写为「本计划零触碰 + HEAD 内 D-69/D-70 仍在」，其余门禁口径不变（见 Deviations）"
  - "计划 Task 4 桶边界门禁脚本因 PowerShell 5.1 的 \\\" 转义不可直跑，按原样语义改由临时脚本执行，判据不变（见 Deviations）"
requirements-completed: []
duration: ~20min
completed: 2026-09-25
status: complete
---

# Phase 4 Plan 12: 渲染端 04-11 落地修正·桶导出边界 + 消费者直连 + shared 单文件 Summary

**按 D-69 / D-70 修正 04-11 落地形态：`client-base/src/shared/{shared.ts,index.ts}` 折成单文件 `shared.ts`（逐字搬、说明符零改动）、`render/utils/index.ts` 去掉越界 `./layout` 转发与 `@ts-expect-error`、`render/utils/saves.ts` 的 `getConfirm` / `waitbox` 及 `render/ui/{save,title}.tsx` 的 `adjustGrid` / `IGridLayoutData` / `adjustCover` 一律直连 `@user/client-base`；8 处架构耦合标注逐字保留、零新增转发导出，8 个 in-scope barrel 全部 `./` 前缀；全部门禁为静态，`material/` / legacy / `packages/` / `src/` / 用户并发改动零触碰。**

## Performance

- **Duration:** ~20min
- **Started:** 2026-09-25
- **Completed:** 2026-09-25
- **Tasks:** 5（Task 0 blocking-human 汇报关卡 — 用户已回复「可以执行」；Task 1 tracer；Task 2；Task 3；Task 4 收口）
- **Files:** 1 新增（`shared.ts`）+ 4 修改（实现层）+ 2 删除 + 本 SUMMARY；`shared/` 空目录移除

## 只读起始基线（Task 1 步骤 0a）

- **只读起始基线（packages / packages-user / src）：**
  - ` M packages-user/client-modules/src/render/index.tsx`
- **起始 HEAD：** `79b87687e27754aba427b5996bb5e852fb344b10`
- **起始分支：** `refine/data-client`
- 说明：规划日（2026-09-24）实测基线同为 **1** 条（`render/index.tsx` 的用户并发未提交改动，D-70 第 6 条所述「用户已删除越界两行」，全程未触碰）。**差异**：规划日另记为未提交的 `.planning/phases/04-render-adaptation/04-CONTEXT.md` 在执行日**已不存在未提交改动**——用户已于提交 `79b8768`（`docs: 更新 GSD Phase 4 上下文文档`，+35 行）将其提交，故当日不在 porcelain 集合内（详见 Deviations）。

## Accomplishments

- **F4 `shared` 单文件化（Task 1 tracer）**：`packages-user/client-base/src/shared.ts` 由 `shared/shared.ts` **字节复制**（10 常量 + `//#region 地图` / `//#endregion` + 逐字注释 + `:1` 的 `@motajs/render` 导入行），`shared/shared.ts` 与 `shared/index.ts` 已删除、`shared/` 目录不再存在；`client-base/src/index.ts:7` 的 `export * from './shared'` 与 `map/{element,renderer,vertex}.ts` / `map/extension/door.ts` 的 4 处相对说明符**一字未改**。
- **F1 桶去转发（Task 2）**：`render/utils/index.ts` 删去 `@ts-expect-error` 与 `export * from './layout'` 两行，仅余 `./saves` / `./use`（原文与顺序不变），文件内零标注、零 `./layout` 说明符。
- **F3 直连去标注（Task 2）**：`render/utils/saves.ts` 的 `getConfirm` / `waitbox` 说明符由 `../components` 改为 `'@user/client-base'`（符号列表与调用点零改动），其上方 `@ts-expect-error` 已删；文件内零标注、零 `../components`。
- **F2 / F2' 消费者直连（Task 3）**：`render/ui/save.tsx` 的唯一 `../utils` 导入拆成两条（`adjustGrid` / `IGridLayoutData` ← `@user/client-base`；`getSave` / `SaveData` ← `../utils`，同位置），`:16` 既有 `@user/client-base` 导入与全部调用点零改动；`render/ui/title.tsx` 的 `adjustCover` 改自 `@user/client-base`，`adjustCover(...)` 调用点零改动。
- **F5 逐字保留（Task 4）**：`client-base/src/{components/{choices,input,misc,scroll,textboxTyper,tip}.tsx,elements/index.ts}` 内引用 `render/use.ts` / `render/renderer` 的 8 处架构标注逐字在场、均带非空原因（这 7 文件 `@ts-expect-error` 总数 9，含 `textboxTyper.ts:332` 既有 `无法推导`），对应文件 `git status --porcelain` 零命中。
- **F6 零新增转发（Task 4）**：8 个 in-scope barrel 共 **47** 条 `export *` 说明符全部 `./` 前缀；`render/index.tsx` 7 条 `export *`（`:45-51`）全为同目录、零改动。

## Task Commits

1. **Task 0（blocking-human 汇报关卡）** — 用户已回复「可以执行」，无文件改动、无提交
2. **Task 1（tracer）** — `shared/`→`shared.ts` 折叠 + 删旧两文件 + 空目录移除（门禁全绿）
3. **Task 2** — `render/utils/index.ts` 去 `./layout` 转发及标注；`render/utils/saves.ts` 直连 `@user/client-base` 并去标注
4. **Task 3** — `render/ui/save.tsx` 拆分导入；`render/ui/title.tsx` 改指 `@user/client-base`
5. **Task 4** — 桶边界 / F5 / F1..F4 / 范围 / CRLF 门禁 + 人工复核 + 本 SUMMARY + 白名单提交

**Plan metadata:** 单一白名单提交（见下方「提交记录」）。计划 Task 1/2/3 的 action 均未定义独立提交步骤，Task 4 步骤 (8) 明示单次白名单提交（与 04-11 的单一提交口径一致）。

## 提交记录

- `refactor(04-12): 桶导出边界修正——shared 单文件化 + 消费者直连 @user/client-base（D-69/D-70）` —— 单次白名单提交，仅含本计划 `files_modified` / `files_deleted` 条目 + 本 SUMMARY（提交 hash 见 orchestrator 回报 / `git log`）。

## 当日实测与规划日数值对照

| 项 | 规划日（2026-09-24） | 当日实测（HEAD `79b8768`） | 差异 |
|---|---|---|---|
| porcelain 基线（packages / packages-user / src） | 1 条（` M render/index.tsx`） | **1** 条（同左） | 一致 |
| `04-CONTEXT.md` 未提交改动 | 有（` M`） | **无（已被用户于 `79b8768` 提交）** | **有差异** → 门禁子断言按 Rule 3 忠实改写，见 Deviations |
| 起始分支 | `refine/data-client` | `refine/data-client` | 一致 |
| `shared` 常量数 | 10 | **10** | 一致 |
| F5 架构耦合标注 | 8（7 文件共 9） | **8（7 文件共 9）** | 一致 |
| in-scope barrel `export *` 越界数 | 0（目标） | **0（47 条全 `./`）** | 一致 |
| `client-base/src/index.ts` 改动 | 无（预期） | **无** | 一致 |
| 行号漂移 | 规划日锚点 | 与规划日一致（`saves.ts` 去 1 行、`save.tsx` 加 1 行） | 无实质漂移 |

## F1..F6 落点表（D-69 / D-70 逐条）

| 面 | 文件 | 实际形态 |
|---|---|---|
| **F1** | `packages-user/client-modules/src/render/utils/index.ts` | 删去 `// @ts-expect-error ...` 与 `export * from './layout';`；仅余 `export * from './saves';` / `export * from './use';`；文件内零标注 |
| **F2** | `packages-user/client-modules/src/render/ui/save.tsx` | `:31` 原单条 `../utils` 拆为两条：`import { adjustGrid, IGridLayoutData } from '@user/client-base';` + `import { getSave, SaveData } from '../utils';`；`:16` 既有 `@user/client-base` 导入不动 |
| **F2'** | `packages-user/client-modules/src/render/ui/title.tsx` | `:35` `import { adjustCover } from '@user/client-base';`（`../utils` 已零残留） |
| **F3** | `packages-user/client-modules/src/render/utils/saves.ts` | `:2` 标注删除；`import { getConfirm, waitbox } from '@user/client-base';`；其余导入（`lz-string` / `@motajs/system` / `@motajs/client-base` / `../../shared`）不动 |
| **F4** | `packages-user/client-base/src/shared/` | 折成单文件 `client-base/src/shared.ts`（逐字）；`shared/shared.ts` + `shared/index.ts` 删除、空目录移除；`index.ts:7` 与 `map/*` 4 处说明符一字未改 |
| **F5** | 7 个标注文件 | 8 处架构耦合标注逐字保留（`misc.tsx:10,15` + `choices:8` / `input:14` / `scroll:31` / `textboxTyper:6` / `tip:4` / `elements/index:3`），7 文件共 9 处，porcelain 零命中 |
| **F6** | 全部 barrel | 零新增转发；`render/index.tsx` 7 条 `export *` 全 `./`，维持现状 |

## 门禁实测结果（全部静态 — D-68 的延续）

| # | 门禁 | 结果（OK 行） |
|---|---|---|
| T1-1 | `shared.ts` 在场 + 10 常量 + `shared/` 目录不存在 | ✅ `OK shared.ts single file, 10 consts, shared/ dir gone` |
| T1-2 | `shared/shared.ts` + `shared/index.ts` 已删 | ✅ `OK shared/shared.ts + shared/index.ts deleted` |
| T1-3 | `shared.ts` 与 HEAD 原件逐字一致 + `index.ts` 与 `map/*` 4 说明符未改 | ✅ `OK shared.ts verbatim; barrel + 4 map specifiers unchanged` |
| T1-4 | `material/` / `load/` / `packages/` / `src/` porcelain 空 | ✅ `OK forbidden paths clean` |
| T1-5 | `shared.ts` CRLF | ✅ `OK CRLF shared.ts` |
| T2-1 | `render/utils/index.ts` 无标注 / 无 `./layout` / 保留 `./saves` `./use` | ✅ `OK render/utils barrel: no layout forward, no annotation, saves+use kept` |
| T2-2 | `saves.ts` 无标注 / 无 `../components` / 直连 `@user/client-base` / 调用点不变 | ✅ `OK saves.ts rewired to user client-base; annotation removed; call sites intact` |
| T2-3 | `render/utils/use.ts` 未动 | ✅ `OK render/utils/use.ts untouched` |
| T2-4 | 两文件 CRLF | ✅ `OK CRLF 2 files` |
| T3-1 | `save.tsx` 拆分正确 + 无 `import type` | ✅ `OK save.tsx split: adjustGrid/IGridLayoutData <- user client-base; getSave/SaveData <- utils` |
| T3-2 | `title.tsx` `adjustCover` 改指 + 调用点不变 + 无新标注 | ✅ `OK title.tsx adjustCover <- user client-base` |
| T3-3 | `render/ui` 仅 in-scope 文件改动 | ✅ `OK render/ui: only in-scope ui files touched (2 rows)` |
| T3-4 | 两文件 CRLF | ✅ `OK CRLF 2 files` |
| T4-1 | 8 个 in-scope barrel 全 `./` 前缀（覆盖 F6） | ✅ `OK barrel boundary: 8 barrels, 47 export * lines, all own-folder` |
| T4-2 | F5 的 8 处耦合标注逐字在场（7 文件共 9，均带原因） | ✅ `OK F5: 8 render-coupled annotations (of 9 in these files), all with reasons` |
| T4-3 | F5 7 文件 porcelain 零命中 | ✅ `OK F5: 8 annotation-bearing files untouched (porcelain clean)` |
| T4-4 | F1..F4 收口自检 | ✅ `OK F1..F4 closure self-check` |
| T4-5 | 范围与用户改动门禁（**忠实改写版**，见 Deviations） | ✅ `OK scope: forbidden paths clean; REQUIREMENTS.md clean; CONTEXT.md untouched with D-69/D-70 in HEAD; user render/index.tsx edit preserved; baseline drift within plan scope` |
| T4-6 | 5 个生产文件 CRLF | ✅ `OK CRLF 5 changed production files` |
| T4-7 | `04-12-SUMMARY.md` 落盘且含关键标识 | ✅ `OK 04-12-SUMMARY.md present and keyed` |

**门禁时刻 porcelain（`packages packages-user src`）：** 8 条，全部在本计划白名单内 —— 2 ` D`（`client-base/src/shared/{shared,index}.ts`）+ 5 ` M`（`render/utils/{index,saves}.ts`、`render/ui/{save,title}.tsx`、以及用户既有的 `render/index.tsx`）+ 1 `??`（`client-base/src/shared.ts`）；**无白名单外条目**。用户的 `render/index.tsx` 未提交改动仍在且全程未触碰。

## 人工复核结论

逐条打开当日源码核对，**全部通过，无偏差**：

- `client-base/src/shared.ts` 与 `git show HEAD:packages-user/client-base/src/shared/shared.ts` 逐字一致（字节复制），`shared/` 目录已消失；`client-base/src/index.ts:7` 的 `./shared` 与 `map/{element.ts:5,renderer.ts:53,vertex.ts:25}` 的 `'../shared'`、`map/extension/door.ts:9` 的 `'../../shared'` 原样。
- `render/utils/index.ts` 终态 2 行（`./saves` / `./use`），零标注。
- `render/utils/saves.ts:2` 为 `import { getConfirm, waitbox } from '@user/client-base';`，无标注；`getConfirm(` 5 处调用未动。
- `render/ui/save.tsx:31-32` 两条导入各自归位；`:16` 既有 `@user/client-base` 导入未动。
- `render/ui/title.tsx:35` `adjustCover` 自 `@user/client-base`；`:71` 调用未动。
- `git diff` 显示 4 个实现层文件仅含授权的导入 / 标注行改动，无格式化 / 重排。
- `render/index.tsx` 7 条 `export *` 全为同目录，零改动。

## Decisions Made

- **F4 字节复制折叠**：以 `Copy-Item` 从 `shared/shared.ts` 字节复制生成 `shared.ts`，天然满足「逐字一致 + CRLF 不变」，再删旧两文件与空目录。
- **F2 最小拆分**：`save.tsx` 两条语句置于原 `../utils` 导入位置，不重排其它导入、不合并既有 `@user/client-base` 导入（`title.tsx` 同理仅替换说明符文本）。
- **单一白名单提交**：沿用 04-11 口径，Task 1/2/3 不独立提交，Task 4 步骤 (8) 单次提交，仅暂存本计划 `files_modified` / `files_deleted` + 本 SUMMARY。
- **未写其它 `.planning/` 文件**：除本 SUMMARY 外未写 `STATE.md` / `ROADMAP.md` / `WINDOWS.md` / `REQUIREMENTS.md`（`REND-01` / `REND-02` 保持 Pending）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 范围门禁的 `04-CONTEXT.md`「未提交改动仍在」子断言前提失效**

- **Found during:** Task 4 步骤 (4)（范围与用户改动门禁）
- **Issue:** 计划 Task 4 的范围门禁脚本断言 `.planning/phases/04-render-adaptation/04-CONTEXT.md` 的 `git status --porcelain` **非空**（规划日实测 ` M`，视为须保留的用户并发改动）。执行日实测该文件**已被用户提交**：提交 `79b8768`（`docs: 更新 GSD Phase 4 上下文文档`，+35 行）将其纳入 HEAD，工作树对它是干净的。因此该子断言的「未提交改动」前提在本执行日不存在，脚本按原样运行必然报 `USER CONTEXT EDIT MISSING`。**无法通过实现修复**——制造一个未提交改动会违反 D-56「不得触碰 / 修改用户改动」。
- **Fix:** 按**忠实意图**改写该单一子断言（不改变其余判据）：把「CONTEXT.md 的未提交改动仍在」替换为「**本计划零触碰 CONTEXT.md**（其 porcelain 为空）**且该用户的 D-69 / D-70 裁定仍存在于 HEAD 内容中**」。这精确等价于门禁的目的（用户改动不被回滚 / 暂存 / 提交），且不触碰该文件。`render/index.tsx` 的「未提交改动仍在」子断言**原样保留**并通过。其余门禁（禁用路径 / REQUIREMENTS.md / baseline 漂移 / CRLF）口径完全不变。改写后的脚本另增补 Task 4 步骤 (4) 明示的**基线漂移比对**（既有条目不消失、仅新增计划内条目），与 04-11 门禁的加强口径一致。
- **Files modified:** 无生产文件（仅临时门禁脚本 `%TEMP%\opencode\04-12-scope-gate.cjs`）
- **Commit:** 不适用（临时工装）

**2. [Rule 1 - Tooling] 桶边界门禁脚本在 PowerShell 5.1 下不可直跑**

- **Found during:** Task 4 步骤 (1)（桶边界门禁）
- **Issue:** 计划门禁以 `node -e "..."` 内嵌双引号正则 `/export\s+\*\s+from\s+['\"]([^'\"]+)['\"]/`；本环境 shell 为 Windows PowerShell 5.1，其双引号字符串不把 `\"` 视为转义，导致引号提前闭合、node 收到被截断的脚本（`Missing type name after '['`）。
- **Fix:** 将门禁脚本按**逐字语义**落到临时文件 `%TEMP%\opencode\04-12-barrel-gate.cjs` 后执行 `node <file>`；判据（8 个 barrel、每条 `export *` 说明符 `./` 前缀、`render/utils/index.ts` 不再转发 `./layout`）与计划完全一致，结果 `OK barrel boundary: 8 barrels, 47 export * lines, all own-folder`。
- **Files modified:** 无生产文件（临时工装，位于仓库外）
- **Commit:** 不适用

---

**Total deviations:** 2（1 Rule 3 门禁前提改写、1 Rule 1 门禁执行方式）——**均不涉及生产代码，所有实质判据（桶边界 / F1..F5 / 范围 / CRLF / 用户改动保留）全部通过**。

## Known Stubs (只报告不处置)

| # | 余留 | 位置 | 说明 |
|---|---|---|---|
| 1 | 8 处架构耦合标注待用户收尾 | `client-base/src/{components/{choices,input,misc,scroll,textboxTyper,tip}.tsx,elements/index.ts}` | 属 D-59 / D-67，本计划逐字保留、零改动 |
| 2 | 旁注（仅报告）：一处越界星导出在 `packages/` | `packages/client/src/index.ts:1` `export * from '@motajs/client-base'` | 违反 D-69，但在 `packages/`（D-33 只报告、不改） |
| 3 | D-69 预期导出面收窄 | `render/utils` 桶不再透出 `adjustGrid` / `IGridLayoutData` / `adjustCover` | 这是 D-69 的**预期结果**，消费者已由 D-70 第 2 条直连 `@user/client-base`；非缺陷 |

> 依计划 prohibitions，未写入 `.planning/WINDOWS.md`（本步仅允许写 `files_modified` / `files_deleted` / 本 SUMMARY）。

## Issues Encountered

- 见「Deviations from Plan」的 2 处（1 处范围门禁前提失效 + 1 处门禁脚本 shell 兼容性），均已按规则处置，无生产代码影响。

## 无运行时验证声明（D-68 的延续）

- 本步**没有「保证能运行」的要求**：**未运行** `pnpm check:type` / `pnpm build`，**未使用** TS 诊断数（全仓或范围内）作为任何门禁或验收项。
- 证明方式全部为**静态**：文件存在 / 内容逐字 / 说明符形态 / 目录不存在 / `git status --porcelain` / CRLF，辅以人工代码复核。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **D-69 完全成立**：8 个 in-scope barrel 内零越界 / 转发 `export *`；`render/utils/index.ts` 不再转发 `./layout`；`render/index.tsx` 维持现状。
- **D-70 六条全部落地**：F1（桶去转发 + 删标注）/ F2 + F2'（两 `render/ui` 消费者直连）/ F3（`saves.ts` 直连 + 删标注）/ F4（`shared` 单文件化）/ F5（8 处标注逐字保留）/ F6（零新增转发）。
- 用户可据本表逐条核对，并接手 3 条范围外已知余留（8 处耦合标注 / `packages/` 旁注 / `render/utils` 导出面收窄）。
- `REND-01` / `REND-02` 仍为 **Pending**（本步只做 04-11 落地形态的结构修正，未实施接口适配与双布局）；`.planning/REQUIREMENTS.md` 零改动。
- 约束提醒：`client-base/src/index.ts`、`client-base/src/{components,elements,map,layout}/**`、`render/index.tsx`、`render/utils/use.ts`、`render/{renderer.ts,use.ts}`、`client-base/src/{material,load}/**`、`packages/**`、`src/**` 均未触碰。

---
*Phase: 04-render-adaptation*
*Completed: 2026-09-25*

## Self-Check: PASSED

- `packages-user/client-base/src/shared.ts`: FOUND（逐字 == HEAD 的 `shared/shared.ts`）
- `packages-user/client-base/src/shared/shared.ts` + `shared/index.ts`: GONE；`shared/` 目录 GONE
- `render/utils/index.ts`（去转发）/ `saves.ts`（直连）/ `ui/save.tsx`（拆分）/ `ui/title.tsx`（改指）: FOUND，门禁全绿
- `04-12-SUMMARY.md`: FOUND
- 用户并发改动 `render/index.tsx`: PRESERVED（未提交、未触碰）；`04-CONTEXT.md`: 用户已于 `79b8768` 提交，本计划零触碰
- commits measured from ledger (`79b8768..HEAD`): 1
