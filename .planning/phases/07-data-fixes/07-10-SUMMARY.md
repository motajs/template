---
phase: 07-data-fixes
plan: 10
subsystem: data-layer
tags: [replay, replay-array, index-maintenance, codec, bigint, read-stream, logger-code-table, loadstate-audit]

requires:
  - phase: 07-data-fixes
    provides: "07-03 delete() fix + the two 'registered-not-fixed' replay items (set(), insert(index === length)) taken over by this plan"
  - phase: 07-data-fixes
    provides: "07-REVIEW.md CR-01/WR-01/WR-02/WR-03/WR-07/IN-03 and 07-LOADSTATE-AUDIT.md row H (#06-17-3)"
  - phase: 06-unit-tests
    provides: "replay array/stream/saveLoad regression suites and D-44 file-level three-step gate"
provides:
  - "ReplayArray.set() uses getParamRange(index) (last-step end = paramUsed) and shifts indexArray from command index `index + 1`, same contract as delete() (CR-01 closed)"
  - "insert/delete/set validate index before touching any buffer; out-of-range is a no-op plus warn 179 (operation/index/length)"
  - "insert(index === length) is a legal append with add() semantics; insert legal range is the closed interval [0, length]"
  - "setReplayArray() calls expireStreams(), so an active ReplaySandbox reader is expired by ReplaySystem.loadState (#06-17-3 / audit H closed)"
  - "normalizeParam rejects |bigint| >= 2^2040 with warn 152 and drops that param; normalizeParamList filters it so counts stay honest"
  - "add/insert/set write the truncated (normalized.length) param count, matching normalizeParamList's 255 cap (WR-02 closed)"
  - "Param type codes are an append-only format: new semantics must take new codes, never reuse; 5/6/7/8 + short-string base reallocation recorded as a one-time pre-release break"
affects: [07-data-fixes, data-common-replay, data-state-replay, replay-verification]

actuals:
  tokens: 4456
  tasks: 5
  commits: 6
  plan_head_before: b299d348a7c0541f33869b53ae0e3e860dcef9b9

tech-stack:
  added: []
  patterns:
    - "Single index-maintenance contract: insert/delete/set all derive the param range from indexArray[index] + (indexArray[index + 1] | paramUsed)"
    - "Out-of-range edit = observable no-op: guard before any buffer read/write, warn with operation/index/length, buffers byte-identical"
    - "Representability guard at encode time: values that do not fit the wire field are dropped before any count is computed"
    - "Append-only wire format convention (no version field) for a pre-release project"

key-files:
  created: []
  modified:
    - packages-user/data-common/src/replay/array.ts
    - packages-user/data-common/src/replay/types.ts
    - packages-user/data-common/src/replay/array.test.ts
    - packages-user/data-common/src/replay/saveLoad.test.ts
    - packages/common/src/logger.json

key-decisions:
  - "Q1=A: set() supports param-length changes via getParamRange(index); the last-step end is paramUsed, so negative paramLength / giant deltaLength can no longer occur"
  - "Q2=A: insert(index === length) is a legal append written with add() semantics (paramStart = paramUsed, indexArray[length] = paramUsed); insert legal range is [0, length]"
  - "Q3=B: new replay-specific warn code 179 in logger.json (first free code after the max warn 178), carrying operation name / index / current length"
  - "Q4=A: a command with >255 params writes the truncated count (normalized.length); overflow params stay ignored via the existing warn 153"
  - "Q5=A+reject: |bigint| >= 2^2040 is unrepresentable in a one-byte length field -> warn 152 and drop that param (command kept, param count reduced)"
  - "Q6=B: no format-version field on IReplaySystemSave; instead an append-only 'type codes are only added, never changed' convention plus the recorded one-time 5/6/7/8 + short-string-base reallocation"

patterns-established:
  - "One param-range helper (getParamRange) is the only source of param byte ranges for all three mutating methods"
  - "Boundary diagnostics carry structural integers only (operation/index/length), never recording content"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "CR-01: set() keeps indexArray consistent with the param bytes for growing, shrinking and last-step edits (with get() and read-stream traversal agreeing)"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#ReplayArray set index maintenance"
        status: pass
    human_judgment: false
  - id: D2
    description: "WR-07 / Q2 / Q3: out-of-range insert/delete/set change nothing and warn code 179; insert(index === length) appends"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#ReplayArray index bounds"
        status: pass
    human_judgment: false
  - id: D3
    description: "#06-17-3 / audit H: an active sandbox read stream is expired by ReplaySystem.loadState and warns code 156 instead of decoding at stale offsets"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/saveLoad.test.ts#expires an active sandbox read stream when a snapshot is loaded"
        status: pass
    human_judgment: false
  - id: D4
    description: "WR-01 / Q5: |bigint| >= 2^2040 warns 152 and is dropped; 2^2040 - 1 still round-trips with length byte 255 and no downstream desync"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#round-trips the largest bigint that fits the length byte; #drops the unrepresentable bigint param and keeps the rest of the command; #keeps the read stream aligned after dropping an unrepresentable bigint"
        status: pass
    human_judgment: false
  - id: D5
    description: "WR-02 / Q4: add/insert/set write the truncated param count (255 for 256/300 params) so multi-command read streams stay aligned"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#writes the truncated param count when a command exceeds 255 params; #writes the truncated param count through insert and set"
        status: pass
    human_judgment: false
  - id: D6
    description: "WR-03 / Q6=B: the param type-code table is documented as append-only (never reuse a code) with the historical reallocation recorded, and no format-version field is added"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#ReplayArray param type table"
        status: pass
    human_judgment: true
    rationale: "The mapping is anchored by a test, but the convention wording itself (array.ts table comment + IReplaySystemSave.paramArray / getParamArray jsDoc) can only be confirmed by a human reading it against the Q6=B ruling."

# Metrics
duration: 28min
completed: 2026-09-17
status: complete
---

# Phase 7 Plan 10: ReplayArray index/stream/codec fixes Summary

**`ReplayArray` 的三类缺陷一次收口：`set()` 与 `delete()` 共用同一套索引维护口径（CR-01）、越界编辑变为可观测无操作（warn 179）且 `insert(length)` 合法追加、活跃读流由 `setReplayArray` 主动过期（`#06-17-3`/审计 H），并把 bigint 长度字节与参数计数收敛到实际写出的字节（WR-01/WR-02）、把类型码表冻结为只增不改的追加式格式（WR-03）。**

## Performance

- **Duration:** ~28 min
- **Started:** 2026-09-17T04:33Z（本地 12:33）
- **Completed:** 2026-09-17T05:01Z（本地 13:01）
- **Tasks:** 5（Task 0 已由用户裁决，见 `<record>`；实际执行 Task 1–5）
- **Files modified:** 5（`system.ts` 因 Q6=B 无需改动，未提交）

## Task Commits

Each task was committed atomically (measuring `git rev-list --count b299d34..HEAD` = **6**，含本 SUMMARY 的元数据提交):

1. **Task 1: CR-01 `set()` 索引数组损坏修复** — `9ae28c6` (fix)
2. **Task 2: 写入路径边界校验 + `insert(index === length)` 追加 + `setReplayArray` 补 `expireStreams()`** — `1f9fb18` (fix)
3. **Task 3: bigint 长度字节守卫（WR-01）+ 参数计数取截断后长度（WR-02）** — `35d4ad6` (fix)
4. **Task 4: WR-03 追加式类型码约定（Q6=B）** — `5b26539` (docs)
5. **Task 1 补强: 末步 `set` 用例改为断言 `paramUsed` 的外部可观测偏移** — `0c6812f` (test)
6. **Plan metadata:** 本 SUMMARY 的 `docs(07-10): …` 提交 (docs)

提交清单（`git log --name-only b299d34..HEAD`）：仅触及 frontmatter `files_modified` 中的 5 个文件，零 `client-*`、零 `replay/system.ts`、零 `data-common/src/save/*`、零 `.planning/WINDOWS.md`。

## Files Created/Modified

- `packages-user/data-common/src/replay/array.ts` — `set()` 改用 `getParamRange(index)` 且回退起点改为 `index + 1`；`insert/delete/set` 前置 `index` 校验（越界告警 179 无操作）；`insert(index === length)` 走追加分支；`setReplayArray()` 补 `expireStreams()`；`normalizeParam` 的 bigint 分支改为 2^2040 守卫并返回 `null`，`normalizeParamList` 过滤被丢弃项；`add/insert/set` 的 `setCommandArray` 计数改用 `normalized.length`；类型码表注释补只增不改约定
- `packages-user/data-common/src/replay/types.ts` — `insert`/`delete`/`set` 的合法区间、越界契约与 `set()` 长度变化语义写入 jsDoc；`getParamArray` 与 `IReplaySystemSave.paramArray` 补追加式约定与「不承诺读回旧格式录像」
- `packages-user/data-common/src/replay/array.test.ts` — 新增 18 条用例：`set` 索引维护 6 条、`index` 边界 5 条、bigint 边界与丢弃 3 条、截断计数 2 条、读流对齐/类型码锚定 2 条；并加 `expectArrayUnchanged` 不变量辅助函数
- `packages-user/data-common/src/replay/saveLoad.test.ts` — 新增 `#06-17-3` 回归（活跃沙箱读流跨 `loadState` 过期 → 告警 156）
- `packages/common/src/logger.json` — 新增 warn 179；warn 152 文案对齐到真实可表示范围（见 Deviations 1）

## Decisions Made

Task 0 的六条用户裁决（`07-10-PLAN.md` 的 `<record>`，提交 `b299d34`）逐条落地，无自行改选：

| 裁决 | 落地位置 | 可观测证据 |
| --- | --- | --- |
| Q1=A `set()` 支持长度变化、末步终点 `paramUsed`、回退起点 `index` | `array.ts:545-585`（关键 `:553-556` 取 `getParamRange`，`:583-585` 从 `index + 1` 起平移） | `array.test.ts`「ReplayArray set index maintenance」6 条（增长/缩短/末步×2/读流×2） |
| Q2=A `insert(index === length)` 合法追加、区间 `[0, length]` | `array.ts:467-478`（追加分支）、`types.ts:202` | 「appends when the insert index equals the current length」 |
| Q3=B 新增 warn 179（操作名/索引/长度） | `logger.json` warn 179；`array.ts:452-457`（insert）/ `:504-509`（delete）/ `:548`（set） | 5 条边界用例断言 `toContain(179)` 且缓冲区逐字节不变 |
| Q4=A 写入截断后计数 | `array.ts:438`、`:469`、`:487`、`:566` | 「writes the truncated param count …」2 条（256 与 300 参数） |
| Q5=A 拒绝该参数 | `array.ts:276-280`（守卫）、`:328-333`（过滤） | 「drops the unrepresentable bigint param …」+「… read stream aligned …」 |
| Q6=B 不加版本字段 + 只增不改约定 | `array.ts:26-29`、`types.ts:265`/`:358` | 「ReplayArray param type table」锚定 5/6/7/8/9/短字符串基址 |

## Findings ↔ Ledger / Registry 对照（缺口登记）

| 条目 | 来源 | 结论 | 锚点 |
| --- | --- | --- | --- |
| `ReplayArray.set` 「只登记不修」 | `07-03-PLAN.md` | **已关闭** | `9ae28c6` + `0c6812f` |
| `insert(index === length)` 「只登记不修」 | `07-03-PLAN.md` | **已关闭**（判为合法追加，Q2=A） | `1f9fb18` |
| CR-01 `set()` 损坏索引数组 | `07-REVIEW.md:64-96` | **已修** | `9ae28c6` |
| WR-01 bigint 长度字节溢出 | `07-REVIEW.md:136-154` | **已修**（2^2040 守卫 + 丢弃参数） | `35d4ad6` |
| WR-02 命令参数计数取未截断长度 | `07-REVIEW.md:156-175` | **已修** | `35d4ad6` |
| WR-03 类型码重编号且存档无版本标记 | `07-REVIEW.md:177-182` | **已修**（取方向 (a)：追加式约定；不加版本） | `5b26539` |
| WR-07 `insert`/`delete`/`set` 不校验 `index` | `07-REVIEW.md:232-237` | **已修** | `1f9fb18` |
| IN-03 `set()` 用例无法发现 CR-01 | `07-REVIEW.md:253-257` | **已修**（增长/缩短/末步/读流 6 条新用例） | `9ae28c6` + `0c6812f` |
| 审计 H（`#06-17-3`）`setReplayArray` 漏 `expireStreams()` | `07-LOADSTATE-AUDIT.md` H 行 | **已修 / 关闭** | `1f9fb18` |

`WINDOWS.md`：本计划 6 项均无入账 id（`07-03` 的 id 23 已 fixed；review/审计条目未入账），按 D-14 **只登记对照、不新建条目、不执行 `fixed`/`waive`**；`git diff b299d34..HEAD -- .planning/WINDOWS.md` 为空。

**Phase 7 验证已失效**：`07-VERIFICATION.md`（`2026-09-16T06:04:11Z`，覆盖 8/8 计划）在 07-09 执行前即已过期，本轮又追加 07-10..07-14。本计划执行完毕后**必须重跑 `/gsd-verify-work`（或 `gsd-verify-work 7`）**重新出具验证结论；`ROADMAP.md` 的 Phase 7 计划数与 Wave 列表由 orchestrator 同步（见 Deviations 5）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - 缺失的关键正确性] `logger.json` warn 152 文案与真实可表示范围对齐**
- **Found during:** Task 3（WR-01 修复）
- **Issue:** 原文案为 `min for -(2n ** 2047n), and max for 2n ** 2047n - 1n`，而修复后 |值| ≥ 2^2040 即被拒绝并告警 152 —— 若保留原文案，落在 [2^2040, 2^2047) 的合法值会发出**自相矛盾**的诊断（「未超限」的告警）。
- **Fix:** 文案改为 `Bigint replay param out of representable range, min for -(2n ** 2040n - 1n), and max for 2n ** 2040n - 1n. The overflowed param will be ignored.`，同时写明「溢出参数会被忽略」（Q5 裁决的处置）。
- **Files modified:** `packages/common/src/logger.json`（本就在 `files_modified` 内；未新增码、未改码号）
- **Verification:** 无任何测试断言 152 文案；`array.test.ts:431-436` 既有 152 用例（`2n ** 2048n`）语义不变且通过。
- **Committed in:** `35d4ad6`

**2. [Rule 2 - 测试可观测性] 末步 `set` 用例补参数缓冲区原始字节断言（额外 `test` 提交）**
- **Found during:** Task 1 自检（对末步子缺陷做反向验证）
- **Issue:** 计划要求「对末步 set 前后 `get(last)` 与 `length`、`paramUsed` 断言」，但 `paramUsed` 是私有成员；反向验证（临时把 `nextParam` 换回 `indexArray[index + 1]`）显示：仅断言 `get(i)`/`length`/读流时，末步子缺陷**不会**让用例失败（`copyWithin(target>source)` 只右移，`indexArray` 仍自洽，仅 `paramUsed` 被污染）。
- **Fix:** 两条末步用例补断言「后续 `add` 的参数落在正确偏移」（`paramBytes[8]/[9]` 与 `paramBytes[4]/[5]`），使 `paramUsed` 的正确性成为外部可观测不变量。反向验证后两条用例在未修复时**确定性失败**（`expected 1 to be 30`）。
- **Files modified:** `packages-user/data-common/src/replay/array.test.ts`
- **Verification:** 反向验证（临时回退末步终点）→ 2 failed；恢复后 66/66 通过。
- **Committed in:** `0c6812f`（独立 `test(07-10)` 提交；未回改 `9ae28c6`，避免重写已提交历史）

### 结裁导致的既有改动的逐条说明（A1 要求）

- **既有断言无一条被削弱或删除**（`git diff b299d34..HEAD -- *.test.ts` 的删除行仅 1 行）：
  - `saveLoad.test.ts:1` 的文件头注释由「ReplaySystem 同实例往返与多类型参数读回」改为「…、多类型参数读回与活跃读流跨读档过期」——`dev.md:85` 要求测试范围变化时同步更新注释。
  - `array.test.ts:431-436`（152）、`:439-449`（153）两条用例**逐字保留**，语义不变且通过。
  - 未新增任何 `it.skip`（`git diff b299d34..HEAD | Select-String "^\+.*it\.skip"` 为空），跳过项仍仅 `equipment.test.ts:306`（码 147，D-06 设计如此）。
- **`logger.json` 152 文案**：见 Deviations 1（用户未否决码表改动；Q3=B 已授权本计划改动该文件）。

### 计划未落地的声明项

- **`packages-user/data-common/src/replay/system.ts` 未修改、未提交**：Q6=B 不加版本字段，故 `saveState`/`loadState` 无改动（`files_modified` 允许此情形不提交）。`data-common/src/save/system.ts` 亦未被本计划改动。
- **`ROADMAP.md` / `STATE.md` 未由本计划更新**：本次执行上下文明确「orchestrator owns those」，覆盖 `07-10-PLAN.md` Task 5(4) 的 `docs(phase-07)` 同步项；Phase 7 计划数与 Wave 列表待 orchestrator 处理。
- **`WINDOWS.md` 未改动**（D-14 + Task 5 验收项）。

## Issues Encountered

**1. `pnpm test:ci` 当日基线与计划记载的基线不一致（非本计划引入）**

| 时点 | 文件 | 用例 | 失败 | 跳过 |
| --- | --- | --- | --- | --- |
| 执行前实测（本会话重录） | 66（1 failed / 65 passed） | 689 | 2 | 1 |
| 执行后（冻结态，Task 5 重跑） | 66（1 failed / 65 passed） | 707 | 2 | 1 |
| `07-10-PLAN.md` 记载（2026-09-16） | 66 | 691 | 0 | 1 |

- 计划记载为「66 文件 / 690 通过 / 1 跳过」，但**执行前实测即为 686 通过 / 2 失败**（总数 689）。两条失败均在 `packages-user/data-state/src/replay/commands.test.ts`：`assembles an independent command set per CoreState` 与 `keeps registration direct and the command module self-contained`，原因是测试仍期望旧类名 `ReplayMoveCommand` 等，而生产代码已被用户提交 `49aacb0`（`refactor: 调整录像命名`）重命名 —— 属**本计划之前就存在、与 `ReplayArray` 无关**的失败。
- 该 2 条失败**也不是**用户 `client-*` 并发 WIP 导致的（文件属 `data-state`），故按约束「不得以跳过换取全绿」如实登记，未修复、未抑制。
- 执行前后**失败集合完全相同**（同样 2 条、同一文件），**通过数 +18**，恰等于本计划新增用例数（Task1 6 + Task2 6 + Task3 5 + Task4 1 = 18），零新增失败、零新增跳过。

**2. 用户并发 WIP 在工作树中继续演进（本计划零触碰）**

执行期间工作树中出现了 `packages-user/client-base/`、`packages-user/client-modules/` 的改动，以及 `packages-user/data-common/src/save/{index,types}.ts` 的修改与 `save/system.ts` 的**删除**（属用户把存档系统迁往渲染层的在制品）。本计划所有提交仅包含 frontmatter `files_modified` 的 5 个文件；`git diff --name-only b299d34..HEAD` 对这些路径为空。

## User Setup Required

None - no external service configuration required.

## D-44 文件级门禁结果

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| ESLint（改动文件） | `pnpm exec eslint --fix <files>` → `pnpm exec eslint <files>` | 0 errors（`logger.json` 报「File ignored because no matching configuration」为 JSON 无 eslint 配置的既有提示，非错误） |
| 类型（文件级） | `pnpm exec vue-tsc --noEmit` 过滤改动文件路径 | 0 命中（**未**以整仓退出码判定；`array.test.ts` 首轮曾出现 1 处 `(number \| undefined)[]` 类型错误，已在 `1f9fb18` 内修正） |
| 全量套件 | `pnpm test:ci`（执行前 + Task 5 重跑） | 失败集合不变（同 2 条既有失败）、通过 +18、跳过仍 1（`equipment.test.ts:306` 码 147） |
| 聚焦套件 | `pnpm exec vitest run …/array.test.ts …/saveLoad.test.ts` | 66/66 通过 |

## Reverse-Verification（用例有效性证据）

| 反向实验 | 期望 | 实测 |
| --- | --- | --- |
| 临时注释 `setReplayArray` 的 `expireStreams()` | `#06-17-3` 用例失败 | **失败**：`expected [] to include 156`（无 156） |
| 临时把 `nextParam` 换回 `indexArray[index + 1]` | 两条末步用例失败 | **失败**：2 failed（`expected 1 to be 30`） |
| 临时放宽 `delete`/`set` 越界守卫 | 越界用例失败 | **失败**：3 failed（`index bounds` 组内） |

## Next Phase Readiness

- `07-03` 遗留的两条「只登记不修」与 `#06-17-3` 均已关闭；`ReplayArray` 的三条写路径（`insert`/`delete`/`set`）现在共用同一套索引维护与边界契约，`add` 与 `insert(length)` 共用同一套追加语义。
- **待办（非本计划）：** ① 重跑 `/gsd-verify-work 7` 重新出具 Phase 7 验证结论（现结论已失效）；② orchestrator 同步 `ROADMAP.md` 的 Phase 7 计划数/Wave 列表与 `STATE.md`；③ `data-state/src/replay/commands.test.ts` 的两条既有失败（类名重命名遗留）需另立修复项，本计划未纳入范围。
- 本计划未新增依赖、未新建源码文件、未引入 `import type`、未使用连续 `as` 断言。

---

## Self-Check: PASSED

- FOUND: `9ae28c6`、`1f9fb18`、`35d4ad6`、`5b26539`、`0c6812f`（`git log --oneline b299d34..HEAD`）
- FOUND: `packages-user/data-common/src/replay/array.ts`、`types.ts`、`array.test.ts`、`saveLoad.test.ts`、`packages/common/src/logger.json`
- VERIFIED: 仅声明文件被提交；`replay/system.ts`、`data-common/src/save/*`、`.planning/{WINDOWS,STATE,ROADMAP}.md`、`packages-user/client-*` 在本计划提交范围内零改动

---

*Phase: 07-data-fixes*
*Completed: 2026-09-17*
