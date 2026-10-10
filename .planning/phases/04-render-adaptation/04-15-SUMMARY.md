---
phase: 04-render-adaptation
plan: 15
subsystem: render-singleton-audit
tags: [read-only, singleton-audit, de-singletonization, d68, d56, two-step]
requires:
  - phase: 04-render-adaptation
    provides: 用户裁定 2026-10-01（渲染端不得再有单例、全部挂 ClientCore / client、子系统继承 / 实现 IClientBaseExtended / ICoreStateExtended、镜像数据端模式、两步走、仅限「模块顶层 export const x = new X()」单例）
  - phase: 04-render-adaptation
    provides: 既有台账 04-UI-ADAPTATION-IMPACT.md（格式模板）与 04-STRUCTURE-MIGRATION-IMPACT.md（证据纪律模板）
provides:
  - .planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md（渲染端去单例化第一步·只读单例清点台账；A / E / F 三类 + 单例→目标映射汇总）
  - 供第二步（04-16 挂载 + 接口继承重构）消费的单例清单与目标映射汇总
affects: [04-render-adaptation]
actuals:
  tokens: 13919
  tasks: 4
  commits: 1
  plan_head_before: 015a1993e8e95ab5fd80b5f8002f196beb2913c2
tech-stack:
  added: []
  patterns:
    - "只读单例台账：元信息块 + 只读起始基线 + 背景 / 方法 / 枚举口径 + A / E / F 三类 + 单例→目标映射汇总 + 处置"
    - "证据纪律：A 事实行每行 ≥2 个 file:line 锚点；零命中 / 对照扫描行带 [证据行] 标记 + 核对命令与原样结果；完整性由 git grep 反查"
    - "只登记不判定：静态阅读不能定论者一律进 F 类（未猜测），不得写成错配 / 缺失 / 残留 / 待办"
key-files:
  created:
    - .planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md
    - .planning/phases/04-render-adaptation/04-15-SUMMARY.md
  modified: []
  deleted: []
key-decisions:
  - "本 run 为纯只读单例清点（去单例化第一步）：生产源码改动 0，files_modified 仅台账；Task 1/2/3 不独立提交，Task 4 单次白名单提交"
  - "范围仅限单例：仅登记模块顶层实例化对象 export const x = new X()（30 条：client-modules 24 + client-base 6）；可变模块级状态 / 全局注册表 / 全局访问器 / 顶层副作用 / 非 new 导出一律 OUT"
  - "A 表 30 条事实行 + 1 条完整性反查 [证据行]；F 类 7 条（仅单例相关，只登记不判定）；目标接口取舍一律 undetermined（IClientBaseExtended vs ICoreStateExtended 交用户裁决）"
  - "Task 0 blocking-human 汇报关卡已由用户回复「可以执行」闭环；本 run 覆盖先前错误范围（6 类）产物，重写为仅单例范围"
requirements-completed: []
duration: ~35min
completed: 2026-10-01
status: complete
---

# Phase 4 Plan 15: 渲染端去单例化·第一步（只读收集单例）Summary

**对 `packages-user/client-modules` 与 `packages-user/client-base` 两个包内的全部单例（严格定义：模块顶层实例化对象 `export const x = new X()`，共 30 条）做只读清点，产出 `04-RENDER-SINGLETON-AUDIT.md`（A / E / F 三类 + 单例→目标映射汇总）；每个单例带 `file:line` 锚点与目标接口候选 / 先例，未定者进 F 类「只登记不判定」；生产代码零改动、未引入任何命名变更、无运行时验证（D-68 的延续）。**

## Performance

- **Duration:** ~35min
- **Started:** 2026-10-01T08:01:42Z
- **Completed:** 2026-10-01
- **Tasks:** 4（Task 0 blocking-human 汇报关卡 — 用户已回复「可以执行」；Task 1 tracer；Task 2；Task 3；Task 4 收口）
- **Files:** 1 重写（`04-RENDER-SINGLETON-AUDIT.md`）+ 本 SUMMARY；生产源码改动 **0**

## 只读起始基线（Task 1 步骤 0a）

- **只读起始基线（packages / packages-user / src）：**
  ` M packages-user/data-system/src/combat/context.ts`
- **起始 HEAD：** `015a1993e8e95ab5fd80b5f8002f196beb2913c2`
- **起始分支：** `refine/data-client`
- **用户并发改动：** ` M packages-user/data-system/src/combat/context.ts`（未提交，**原样保留**，本 run 未回滚 / 未暂存 / 未提交 / 未修改；D-56）
- **机读标记：** `<!-- baseline-hash-combat-context: 9982509d3d8ec4c58d5c71f37f1a576a13c3337f -->`
- **第二个 block 点：** Task 0 的 `blocking-human` 汇报关卡已由用户明确回复「可以执行」闭环。

## Accomplishments

**唯一交付物：** `.planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md`（只读；重写先前错误范围产物）。

| 节 | 落点 | 条目数 |
|---|---|---|
| 元信息块 + 只读起始基线 + 背景 + 方法 + 枚举口径 | 6 行元信息块；porcelain 原样（含用户 `combat/context.ts`）+ 哈希标记；用户 2026-10-01 裁定要点；枚举面 / 核对手法 / 证据纪律；单例定义 + 显式排除清单 | — |
| **A 模块级实例化对象** | 30 条单例事实行（`#04-15-A-01`..`#04-15-A-30`）+ 1 条完整性反查 `[证据行]`（`#04-15-A-31`）：client-modules 24 / client-base 6 | **31**（30 单例 + 1 证据行） |
| **E 主类关系与目标挂载面映射** | 8 条（`#04-15-E-01`..`#04-15-E-08`）：逐簇给出当前归属 / 与 `ClientCore` 关系 / 目标接口候选与先例 / undetermined | **8** |
| **F 未能从阅读确定（未猜测）** | 7 条（`#04-15-F-01`..`#04-15-F-07`）：texture / (a) 外部包单例 / (b) 重复 renderer 实例 / (c) `GameUI` 实例是否纳入 / (d) 目标接口取舍 / (e) `IClientBaseExtended` 无实现类 / (f) 无消费者 UI | **7** |
| **单例→目标映射汇总（供 04-16 消费）** | 30 行（每单例一行）+ 单例总数声明（24 + 6 = 30） | **30** |
| **处置** | 只读完成 + 仅登记单例 + 第二步待规划 + `REND-01` / `REND-02` Pending + 单例总数 | — |

**单例总数（当日 `git grep` 实测，与规划日一致）：** 客户端（`packages-user/client-modules`）**24** + 系统层（`packages-user/client-base`）**6** = **30**。

**单例清单（A 表 `#04-15-A-01`..`#04-15-A-30`）：** `texture`；`client`；`rafExcitation` / `excitationDivider` / `mainRenderer` / `using`；`sceneController`；`mainUIController` / `MainBackgroundUI`；`LoadSceneUI` / `MainSceneUI` / `SaveUI` / `MainSettingsUI` / `ReplaySettingsUI` / `GameInfoUI` / `SyncSaveUI` / `SyncSaveSelectUI` / `DownloadSaveSelectUI` / `ClearSaveSelectUI` / `StatisticsUI` / `leftStatusBarUI` / `rightStatusBarUI` / `GameTitleUI` / `ViewMapUI`；`DEFAULT_FONT`；`ConfirmBoxUI` / `ChoicesUI` / `InputBoxUI` / `WaitBoxUI` / `BackgroundUI`。

## Task Commits

1. **Task 0（blocking-human 汇报关卡）** — 用户已回复「可以执行」，无文件改动、无提交
2. **Task 1（tracer）** — 台账骨架 + 9 小节 + tracer `texture` 行（`#04-15-A-01`）+ 基线哈希标记（门禁全绿，无独立提交）
3. **Task 2** — client-modules 单例铺开（`#04-15-A-02`..`#04-15-A-25`）+ E-02..E-07 + F-02..F-04 + 映射汇总（门禁全绿，无独立提交）
4. **Task 3** — client-base 单例铺开（`#04-15-A-26`..`#04-15-A-30`）+ 完整性反查 `[证据行]`（`#04-15-A-31`）+ E-08 + F-05..F-07 + 映射汇总定稿 + 处置定稿（门禁全绿，无独立提交）
5. **Task 4** — 收口门禁 + 人工复核 + 本 SUMMARY + 白名单提交

**Plan metadata:** 单一白名单提交（见「提交记录」）。Task 1/2/3 的 action 未定义独立提交步骤；Task 4 步骤 (10) 明示单次白名单提交（与 04-13 的单一提交口径一致）。

## 提交记录

- `docs(04-15): 渲染端去单例化只读清点（仅单例）` —— 单次白名单提交，仅含 `files_modified`（`04-RENDER-SINGLETON-AUDIT.md`）+ 本 `04-15-SUMMARY.md`（提交 hash 见 orchestrator 回报 / `git log`）。

## A / E / F 落点表（关键锚点）

| 面 | 条目 | 关键 `file:line` 锚点 |
|---|---|---|
| **A 单例（client-base）** | A-01 `texture` | `packages-user/client-base/src/elements/cache.ts:280`（类 `:48`）↔ `textbox.tsx:33` / `textboxTyper.ts:5` / `tip.tsx:8` / `elements/misc.ts:9` |
| **A 单例（client-base 组件）** | A-26..A-30 | `choices.tsx:796,798` / `input.tsx:602` / `misc.tsx:591,592` ↔ `choices.tsx:606,659,722,777` / `input.tsx:555` / `misc.tsx:578` |
| **A 单例（client-modules）** | A-02 `client` | `packages-user/client-modules/src/core.ts:6`（类 `client.ts:41`）↔ 7 处消费者（`load.tsx:27` 等） |
| | A-03..A-06 renderer 簇 | `render/renderer.ts:18,20,35,43` ↔ `render/index.tsx:5,22,23,26` / `client-base/components/misc.tsx:16` |
| | A-07 `sceneController` | `render/scene.ts:3` ↔ `render/index.tsx:8,17,25` |
| | A-08/A-09 控制器 | `render/ui/controller.tsx:11,29` ↔ `render/ui/main.tsx:29,284` / `controller.tsx:32` |
| | A-10..A-22/A-24/A-25 GameUI 簇 | `render/ui/{load,main,save,settings,statistics,statusBar,title,viewmap}.tsx` 各定义行 |
| | A-23 `DEFAULT_FONT` | `shared.ts:105` ↔ `render/index.tsx:3,35` |
| | A-31 完整性反查 `[证据行]` | `git grep -n -E "export const [A-Za-z0-9_]+ = new "` → 30 条，与 A-01..A-30 对齐 |
| **E 目标映射** | E-01..E-08 | `IClientBaseExtended`（`client-base/src/types.ts:27`）/ `ICoreStateExtended`（`data-state/src/types.ts:45`）；先例 `client-base/src/material/types.ts:94,218,406,439`、`data-state/src/ins.ts:11` |
| **F undetermined** | F-01..F-07 | 见台账 `## F` 一节 |

## 门禁实测结果（全部静态 — D-68 的延续）

| # | 门禁 | 结果（OK 行） |
|---|---|---|
| T1-1 | 台账骨架（9 小节 A/E/F）+ tracer 行 `#04-15-A-01` + 哈希标记 | ✅ `OK ledger skeleton (A/E/F) + tracer row + hash marker` |
| T1-2 | A 事实行 ≥2 锚点 | ✅ `OK anchor discipline: 1 A rows` |
| T1-3 | 只读基线（用户 `combat/context.ts` 在场 + 哈希一致 + 无其它条目） | ✅ `OK read-only baseline confirmed (user edit present, hash matches, no other changes)` |
| T1-4 | CRLF 台账 | ✅ `OK CRLF ledger` |
| T2-1 | client-modules A 铺开 + F + 映射汇总在场 | ✅ `OK client-modules A expansion` |
| T2-2 | 锚点纪律（A ≥10、F ≥3） | ✅ `OK anchor discipline: 25 A rows, 4 F entries` |
| T2-3 | 只读基线 | ✅ `OK read-only baseline confirmed (user edit present, hash matches, no other changes)` |
| T2-4 | CRLF | ✅ `OK CRLF ledger` |
| T3-1 | client-base 单例 + 两目标接口 + 先例 + 映射汇总 + 处置 | ✅ `OK client-base + mapping coverage` |
| T3-2 | 最终纪律（A ≥15、F ≥5、映射汇总表头） | ✅ `OK final: 31 A rows, 7 F entries, summary present` |
| T3-3 | 范围门禁（`REQUIREMENTS.md` 零改动 + 用户改动正向基线） | ✅ `OK scope: read-only, REQUIREMENTS untouched, user edit present + hash matches` |
| T3-4 | `git grep` 完整性反查（A 行 ≥ grep 条数） | ✅ `OK reverse-check: A rows=31 >= grep new-exports=30` |
| T3-5 | CRLF | ✅ `OK CRLF ledger` |
| T4-1 | 台账结构 / 内容 / 单例锚点（无 B/C/D） | ✅ `OK ledger structure + all singleton anchors` |
| T4-2 | 最终纪律（A ≥15、F ≥5） | ✅ `OK final discipline: 31 A rows, 7 F entries` |
| T4-3 | 范围门禁（`material/` / `packages/` / `src/` 空；`REQUIREMENTS.md` 零改动；用户改动正向基线） | ✅ `OK scope: material/packages/src clean; REQUIREMENTS untouched; user edit present + hash matches` |
| T4-4 | 既有产物保护（`04-01`..`04-14` porcelain 空；无 `04-16+`） | ✅ `OK existing 04-01..04-14 artifacts untouched; no 04-16+ plan` |
| T4-5 | ROADMAP 登记（`04-15` / `Wave 14`） | ✅ `OK ROADMAP has 04-15 / Wave 14 registration` |
| T4-6 | 台账 + SUMMARY CRLF 且在场 | ✅ `OK CRLF ledger + SUMMARY present` |
| T4-7 | `04-15-SUMMARY.md` 落盘且含 `04-15` / `去单例化` / `只读` / `Pending` / `04-16` | ✅ `OK 04-15-SUMMARY.md present and keyed` |

**门禁时刻生产树 porcelain（`packages packages-user src`）：** **1** 条 —— ` M packages-user/data-system/src/combat/context.ts`（用户并发改动，原样保留）；台账 / SUMMARY 位于 `.planning/`，不属生产树。

## 人工复核结论（Task 4 步骤 8）

逐条打开当日源码核对，**全部通过，无偏差**：

- A 类每条锚点指向真实存在的 `export const x = new X()` 及其消费者：`cache.ts:280`（类 `:48`）、`core.ts:6`（类 `client.ts:41`）、`render/renderer.ts:18,20,35,43`、`render/scene.ts:3`、`render/ui/controller.tsx:11,29`、各 `render/ui/*.tsx` 定义行、`shared.ts:105`、`client-base/components/{choices,input,misc}.tsx` 各定义行 —— 均实读 / `git grep` 确认。
- A-31 `[证据行]` 的 `git grep -n -E "export const [A-Za-z0-9_]+ = new "` 原样结果 **30** 条，与 A-01..A-30 逐条对齐、**无遗漏、无多登**；`render/renderer.ts:45` 的解构导出 `createApp` / `render` / `tagManager` **未登记**（非 `new`）。
- `[证据行]` 标记仅出现在 A-24 / A-25 / A-30（零消费者）与 A-31（完整性反查）四条；其余 A 事实行均 ≥2 个 `file:line` 锚点，无标记误用。
- E 类目标接口证据的 `file:line` 指向真实声明：`IClientBaseExtended`（`client-base/src/types.ts:27`）、`ICoreStateExtended`（`data-state/src/types.ts:45`）、先例 `material/types.ts:94,218,406,439`、数据端 `ins.ts:11` 均实读确认。
- F 类 7 条均未越过「只登记不判定」边界，**无**「错配 / 缺失 / 残留 / 待办」措辞；**无一条**涉及非单例（`window` / `core` / `Mota.require` / 静态注册表 / 顶层副作用）。
- 台账**无** `## B` / `## C` / `## D` 小节；`## A` / `## E` 为固定列序表。

## Decisions Made

- **只读单例清点小切片（用户 2026-10-01 裁定第一步）**：唯一交付物为台账 + 本 SUMMARY；生产源码改动 0，`files_modified` 仅台账。
- **范围仅限单例**：只登记模块顶层实例化对象 `export const x = new X()`（30 条）；可变模块级状态 / 全局注册表 / 全局访问器 / 顶层副作用 / 非 `new` 导出一律 OUT（不设门禁、不写入台账）。
- **单一白名单提交**：Task 1/2/3 不独立提交；Task 4 步骤 (10) 单次提交，仅暂存台账 + SUMMARY。
- **undetermined 纪律**：所有单例的目标接口取舍一律 `undetermined`（`IClientBaseExtended` vs `ICoreStateExtended` 交用户裁决，F-05）；外部包单例 / 重复 renderer 实例 / `GameUI` 实例是否纳入 / 无消费者 UI 一律进 F 类，不臆测。
- **覆盖先前错误范围产物**：先前 6 类范围（含 B/C/D）的台账与 SUMMARY 被本 run 重写为「仅单例」范围；同一白名单文件路径，单次提交覆盖。
- **未写其它 `.planning/` 文件**：除本 SUMMARY 外未写 `STATE.md` / `ROADMAP.md` / `WINDOWS.md` / `REQUIREMENTS.md`（`REND-01` / `REND-02` 保持 Pending）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Tooling] Task 1/2/3/4 内联 `node -e` 门禁在 PowerShell 5.1 下不可直跑**

- **Found during:** Task 1 起（每条 `<automated>` 门禁）
- **Issue:** 计划门禁为内联 `node -e "..."`，Windows PowerShell 5.1 会破坏其中的内嵌引号 / `$`（正则尾锚）/ CJK / `→`，使命令被 mangle 而非按语义失败。
- **Fix:** 按计划 `<Verification Runnability>` 的强制要求，把每条门禁的**原样语义**落到仓库外临时 `.cjs` 文件（`%TEMP%\opencode\04-15-*.cjs`）后执行 `node <file>`；判据与 `<fails_when>` 一字不变，全部 18 条门禁实测通过。
- **Files modified:** 无生产文件（临时工装，位于仓库外）
- **Commit:** 不适用

---

**Total deviations:** 1（门禁执行方式，非判据放宽）——**均不涉及生产代码，所有实质判据全部通过**。

## Known Stubs (只报告不处置)

| # | 余留 | 位置 | 说明 |
|---|---|---|---|
| 1 | 目标接口取舍未定（全部 30 单例） | 台账 A / E / 映射汇总 | `IClientBaseExtended` vs `ICoreStateExtended` 交用户裁决（F-05） |
| 2 | 外部包 A 单例能否挂主类未定 | `render/renderer.ts:35,43`、`render/scene.ts:3`、`render/ui/controller.tsx:11` | `@motajs/render` / `@motajs/render-vue` / `@motajs/system`（F-02） |
| 3 | 重复 renderer 实例权威归属未定 | `render/renderer.ts:18,20,35` ↔ `client.ts:90,91,108` | F-03 |
| 4 | `GameUI` / `UIController` 实例是否纳入未定 | `render/ui/*.tsx`、`client-base/components/*.tsx` | F-04 |
| 5 | `IClientBaseExtended` 无实现类 | `client-base/src/types.ts:27` | F-06 |
| 6 | 无消费者 UI 单例 | `statusBar.tsx:488,489`、`misc.tsx:592` | F-07 |

> 依计划 prohibitions 与 Task 4 步骤 (11)，未写入 `.planning/WINDOWS.md` / `STATE.md` / `ROADMAP.md`（本步仅允许写台账与 SUMMARY）。

## Issues Encountered

- 见「Deviations from Plan」的 1 处（门禁脚本 shell 兼容性），已按计划 `<Verification Runnability>` 的强制做法处置，无生产代码影响。

## 无运行时验证声明（D-68 的延续）

- 本步**没有「保证能运行」的要求**：**未运行** `pnpm check:type` / `pnpm build`，**未使用** TS 诊断数（全仓或范围内）作为任何门禁或验收项。
- 证明方式全部为**静态**：`git status --porcelain` 正向基线（用户 `combat/context.ts` 在场 + `git hash-object` 与台账标记一致 + 无其它条目）/ 台账结构与 `[证据行]` 纪律 / `git grep` 完整性反查 / 禁用路径 porcelain / CRLF / 既有产物保护 / ROADMAP 登记，辅以人工代码复核。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **第一步（只读收集）完成**：A 30 单例（+1 完整性反查证据行）/ E 8 / F 7 / 映射汇总 30 行；`client` 主单例与其余单例、重复 renderer 实例、外部包单例、`GameUI` 实例簇均已定位，目标接口候选与先例齐备，undetermined 项分离清晰。
- **第二步（04-16 挂载 + 接口继承重构）未规划**，待用户审阅 `04-RENDER-SINGLETON-AUDIT.md` 后另行规划；本步不产出任何新 `*-PLAN.md`。
- **命名零变更**：未新增 / 改名 / 删除任何公共、受保护、私有成员、方法、字段、文件或目录。
- **范围零外溢**：数据端（含用户未提交 `combat/context.ts`）/ `packages/` / `src/` / 其它 `package.json` / 测试文件全部零触碰；用户改动被保留且未被提交。
- `REND-01` / `REND-02` 仍为 **Pending**；`.planning/REQUIREMENTS.md` 零改动。

---
*Phase: 04-render-adaptation*
*Completed: 2026-10-01*

## Self-Check: PASSED

- `.planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md`: FOUND（A 30 单例 + 1 证据行 / E 8 / F 7 / 映射汇总 30 行；无 B/C/D）
- `.planning/phases/04-render-adaptation/04-15-SUMMARY.md`: FOUND
- 生产源码改动: 0（`git status --porcelain -- packages packages-user src` 仅用户既有 ` M .../combat/context.ts`）；`material/` / `packages/` / `src/` 零触碰
- 用户并发改动 `combat/context.ts`: PRESERVED（未提交、未触碰、哈希一致）
- `04-01`..`04-14` 既有产物: 零触碰；无 `04-16+`
- commits measured from ledger (`015a1993..HEAD`): 1
