---
phase: 07-data-fixes
plan: 07
subsystem: data
tags: [save, state-container, diagnostics, logger-codes, vitest]

# Dependency graph
requires:
  - phase: 07-data-fixes
    provides: "07-06 flag/common mover 缺陷修复（串行执行基线）"
provides:
  - "CoreState.loadState 码 178 = 存档中出现但未加载（未注册）的 key，与 logger.json 文案一致（D-05）"
  - "saveablesRoundTrip.test.ts 中 177/178 两条诊断码各自独立的回归见证（缺 key 负向 + 多出 key 正向）"
affects: [state, save, verify-work]

actuals:
  tokens: 590
  tasks: 3
  commits: 1
  plan_head_before: 115d835b56257b884dbeec89d744fc1812bd75ec

tech-stack:
  added: []
  patterns:
    - "诊断码语义以码表文案为事实源：差集方向 = 文案主语（存档 keys）减已注册 keys"
    - "同一诊断码的两条回归见证分工：负向（缺 key 不误报）+ 正向（多出 key 必报），互不重复"

key-files:
  created: []
  modified:
    - packages-user/data-state/src/core.ts
    - packages-user/data-state/test/saveablesRoundTrip.test.ts

key-decisions:
  - "Task 0 用户裁决 negative-guard：:322-334 改写为负向见证并更名，:337-349 取消 skip 承担正向见证；不采用 dedupe"
  - "码 178 判定改为 loaded.difference(total)，与 logger.json 文案「saved but not be loaded」一致（D-05）"
  - "177 分支（:522-527）、saveState、saveables 注册与 :307-319 的 177 绿用例一律未动"
  - "不新增用例、不弱化断言、不新增 it.skip（D-10）"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "码 178 判定 = 存档中出现但未加载（未注册）的 key，与码表文案一致；缺 key 路径不再误报 178"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/saveablesRoundTrip.test.ts#warns code 178 when the save data has keys that are not loaded"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/test/saveablesRoundTrip.test.ts#warns code 177 but not 178 when the save data misses a saveable key"
        status: pass
    human_judgment: false
  - id: D2
    description: "既有 177 用例与容器往返用例不回归；全量套件无新增 skip"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/saveablesRoundTrip.test.ts#warns code 177 when the save data misses a saveable key"
        status: pass
      - kind: unit
        ref: "pnpm test:ci"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-09-15
status: complete
---

# Phase 07 Plan 07: save 数据端缺陷修复（码 178 语义对齐）Summary

**`CoreState.loadState` 的码 178 差集方向由 `total.difference(loaded)` 改为 `loaded.difference(total)`，178 恢复为「存档中出现但未加载（未注册）的 key」；一条负向见证改写 + 一条 skip 取消，177/178 语义互斥且各自独立可观测**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-15T21:09:00Z
- **Completed:** 2026-09-15T21:17:00Z
- **Tasks:** 3 (Task 0 checkpoint:decision 用户已裁决 negative-guard + Task 1 修复 + Task 2 门禁/对照)
- **Files modified:** 2

## Accomplishments

- **`#06-09-5` 根因修复**：`core.ts:533` 原为 `const remain = total.difference(loaded);`，得到「已注册但存档缺失」——恰是 177 分支（`:522-527`）的语义；于是「缺 key」同时触发 177 与 178，「多出 key」静默通过。按 D-05 改为 `const remain = loaded.difference(total);`，与 `logger.json` 码 178 文案 `Save data with keys of '$1' are saved but not be loaded` 一致，其余判空、`join(' | ')` 与 `logger.warn(178, ids)` 结构一字未动。
- **负向见证（D-05 授权纠偏，Task 0 裁决 negative-guard）**：`saveablesRoundTrip.test.ts` 原 `:322-334`（`warns code 178 when the save data misses a saveable key`）固化了错误语义，改写为 `warns code 177 but not 178 when the save data misses a saveable key`，断言 `toContain(177)` 与 `not.toContain(178)` 同时成立——保住其独立见证价值，且不与正向用例重复。
- **正向见证（取消 skip）**：原 `:337-349` 的 `it.skip('warns code 178 when the save data has keys that are not loaded')` 改为 `it(...)`，断言一字未改（构造 `@system/extra` 未注册 key → `toContain(178)`）。
- **177 用例不回归**：`:307-319`（`warns code 177 when the save data misses a saveable key`）与 `:354-386` 容器往返用例保持绿。
- **账本对照**：`#06-09-5` 在 `WINDOWS.md` 中**无对应条目**，本计划**不新建条目**（Task 0 已确认），改为本章「Findings ↔ 账本对照」登记；`WINDOWS.md` 文件未被修改。

## Task Commits

Each task was committed atomically (D-13, 本计划一个缺陷一个原子提交):

1. **Task 0: D-09 预执行汇报（checkpoint:decision）** - 无提交；用户回复 `negative-guard`（记录：`:322-334` 改写为负向见证并更名；`:337-349` 取消 skip 承担正向见证；码 178 判定改为 `loaded.difference(total)`）
2. **Task 1: #06-09-5 码 178 差集方向修正 + 用例纠偏/取消 skip** - `95ea660` (fix)
3. **Task 2: D-44 门禁 + 全量套件 + findings↔账本对照** - 无源码改动（仅验证与对照登记，并入本 SUMMARY 元数据提交）

**Plan metadata:** 本 SUMMARY 的 docs 提交

**Commits measured at SUMMARY write（#3968）：** `git rev-list --count 115d835b56257b884dbeec89d744fc1812bd75ec..HEAD` = **1**（Task 1 的代码提交；本 SUMMARY 的 docs 提交为紧随其后的第 2 个提交）。

## Files Created/Modified

- `packages-user/data-state/src/core.ts` - `loadState` 的 178 差集方向取反（`:533` `total.difference(loaded)` → `loaded.difference(total)`）；177 分支、`saveState`、saveables 注册、`bindSaveableExecuter` 与 112/113 分支未动
- `packages-user/data-state/test/saveablesRoundTrip.test.ts` - `:322-334` 改写为负向见证并更名、注释同步；`:337-349` 取消 `it.skip` 并同步注释；`:307-319` 与 `:354-386` 未动

### 生产改动（逐字）

```ts
// packages-user/data-state/src/core.ts — loadState 尾部（:531-537）
const loaded = new Set<string>(state.keys());
const total = new Set(this.saveables.keys());
const remain = loaded.difference(total);
if (remain.size > 0) {
    const ids = [...remain].join(' | ');
    logger.warn(178, ids);
}
```

### 测试改动（逐字）

```ts
// packages-user/data-state/test/saveablesRoundTrip.test.ts — 负向见证（原 :322-334）
// 验证存档缺失 saveable key 时只触发警告码 177，不再误报 178（177/178 语义互斥）
it('warns code 177 but not 178 when the save data misses a saveable key', () => {
    const state = createCoreState();
    const snapshot = new Map(
        state.saveState(SaveCompression.NoCompression)
    );
    snapshot.delete('@system/flags');

    const result = logger.catch(() =>
        state.loadState(snapshot, SaveCompression.NoCompression)
    );

    const codes = result.info.map(info => info.code);
    expect(codes).toContain(177);
    expect(codes).not.toContain(178);
});

// packages-user/data-state/test/saveablesRoundTrip.test.ts — 正向见证（原 :337-349 取消 skip）
// 验证存档含未注册（未加载）key 时经 logger.catch 观测到警告码 178（#06-09-5）
it('warns code 178 when the save data has keys that are not loaded', () => {
    const state = createCoreState();
    const snapshot = new Map(
        state.saveState(SaveCompression.NoCompression)
    );
    snapshot.set('@system/extra', null);

    const result = logger.catch(() =>
        state.loadState(snapshot, SaveCompression.NoCompression)
    );

    expect(result.info.map(info => info.code)).toContain(178);
});
```

## 177/178 语义切分说明

| 码 | 码表文案（`packages/common/src/logger.json`） | 判定式 | 触发场景 |
|----|---------------------------------------------|--------|----------|
| 177 | `Save data for saveable content $1 is needed, but there's no data in save data.` | 逐 key `!state.has(key)`（`:524-526`） | 已注册 saveable 在存档中**缺失** |
| 178 | `Save data with keys of '$1' are saved but not be loaded` | `loaded.difference(total)`（`:533`） | 存档中出现**未注册（未加载）**的 key |

修前 `178 = total.difference(loaded)` 与 177 完全重叠，导致「缺 key」重复告警（177+178）、「多出 key」静默；修后两条诊断码互斥且各自唯一。

## Findings ↔ 账本对照

| Finding | 生产写入点 | 取消 skip 用例 | 账本状态 | 处置 |
|---------|-----------|---------------|---------|------|
| `#06-09-5` | `core.ts:533` `loadState` 的 178 差集方向 | `saveablesRoundTrip.test.ts#warns code 178 when the save data has keys that are not loaded`（原 `:337-349`） | WINDOWS.md **无对应条目** | **不新建条目**（Task 0 确认）；本章记录对照，`WINDOWS.md` 未改动 |

> `#06-09-5` 未在 Phase 6 登记为 `skipped-test` 账本条目（其在 06-TEST-FINDINGS.md 中登记），故修复后无 `fixed <id>` 可打——与研究建议一致。

## Deviations from Plan

None - plan executed exactly as written（按用户 Task 0 裁决的 `negative-guard` 执行；未出现方案失败，故未触发 D-09 的「退出并修订计划」路径）。

## Issues Encountered

- 无。本计划改动面收敛于两个声明文件，未触碰任何其它源码；`vnpm`/依赖与 lockfile 未变。

## Verification Results

| 门禁 | 命令 | 结果 |
|------|------|------|
| Task 1 目标/回归 | `pnpm exec vitest run packages-user/data-state/test/saveablesRoundTrip.test.ts` | 1 file passed，**9 passed | 0 skipped**（修前 8 passed + 1 skipped） |
| D-44(a) eslint | `pnpm exec eslint --fix` → `pnpm exec eslint`（2 文件） | 0 errors（两次均 exit 0；`--fix` 未产生新改动） |
| D-44(b) 类型 | `pnpm exec vue-tsc --noEmit` 按 2 文件相对路径过滤 | **0 命中**；整仓 exit=2 的 28 行诊断全部为既有渲染/legacy 错误（D-12 明确排除，不以整仓退出码判定） |
| D-44(c) 全量 | `pnpm test:ci` | **66 files passed，679 passed | 2 skipped（681）**，exit 0 |
| 全量计数变化 | 对比 07-06 基线（678 passed | 3 skipped） | **+1 passed、-1 skipped**（负向见证改写保持用例数；取消 1 条 skip），无回归 |
| 新增 skip | `git grep -n "it\.skip"` | 本计划新增 **0**；`#06-09-5` 的 skip 已取消；余下 2 条为既有（D-06 码 147、D-07 用户接线） |
| 账本 | `git status .planning/WINDOWS.md` | 无变化（本计划**未新增条目**，`#06-09-5` 无对应 id） |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `#06-09-5` 已修复；177/178 语义独立、与码表文案一致，无新增 `it.skip`、无新增 WINDOWS.md 条目。
- 07-07 为 Phase 7 第 7 个计划；remaining：07-08（path 用户负责项 `#06-07-1`）。

---

*Phase: 07-data-fixes*
*Completed: 2026-09-15*

## Self-Check: PASSED

- Declared `files_modified` 均存在且已修改：`packages-user/data-state/src/core.ts`、`packages-user/data-state/test/saveablesRoundTrip.test.ts`。
- Task 1 提交 `95ea660` 存在（`git log --oneline` 命中 `fix(07-07): #06-09-5 warn code 178 for unloaded save keys`）。
- `core.ts` 含 `const remain = loaded.difference(total);`，不再含 `total.difference(loaded)`。
- 无新增 `it.skip`；`WINDOWS.md` 未改动、无新增条目。
