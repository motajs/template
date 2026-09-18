---
phase: 07-data-fixes
plan: 11
subsystem: data-layer
tags: [loadstate-audit, identity-preservation, equip-store, flag-system, followers, save-wins, regression]

requires:
  - phase: 07-data-fixes
    provides: "07-09 same-reference principle for HeroAttribute (#06-17-1) and its in-place loadState pattern"
  - phase: 07-data-fixes
    provides: "07-LOADSTATE-AUDIT.md rows D/E/F (#06-17-4/5/6) with their trigger sequences"
  - phase: 06-unit-tests
    provides: "D-44 file-level three-step gate and the existing container/saveLoad regression suites"
provides:
  - "HeroEquipsStore.loadState merges per uid and calls the existing instance's loadState, so externally held IEquipmentState references stay valid across load (audit D / #06-17-4 closed)"
  - "FlagSystem.loadState merges per key and calls fromStructured on the existing field, so externally held IFlagCommonField references stay valid across load (audit E / #06-17-5 closed)"
  - "HeroFollowersController.restoreFollowers keeps index-aligned followers in place (same index + same num) and fires the existing onRemoveFollower/onAddFollower only when a slot is replaced or the length changes (audit F / #06-17-6 closed)"
  - "Save wins: equipment instances / flag fields / followers absent from the snapshot are deleted silently (Q3=A, Q4=C) — zero diagnostics, logger.json untouched"
  - "IHeroEquipsStore.loadState / IFlagSystem.loadState / IHeroFollowersController.restoreFollowers jsDoc state the same-reference and deletion contract at the interface source"
affects: [07-data-fixes, data-base-hero, data-base-flag, data-state, render-side-holders, legacy-plugin-data]

actuals:
  tokens: 7837
  tasks: 4
  commits: 5
  plan_head_before: 94ceb50cfeec6b66ab2f97badbbf6eef4399496b

tech-stack:
  added: []
  patterns:
    - "Container loadState is a per-item merge, never a whole-table replace: look up by identity (uid / key / index+num), reuse the instance, mutate it in place"
    - "Save wins on absence: keys not in the snapshot are deleted — observably equivalent to the old clear(), minus detaching the items that ARE in the snapshot"
    - "Hook semantics preserved: onRemoveFollower/onAddFollower fire only when an instance is actually removed / created, never on an in-place restore"
    - "Synchronous restore: the merge runs inside the sync HeroState.loadState; removeAllFollowers is no longer on the load path"

key-files:
  created: []
  modified:
    - packages-user/data-base/src/hero/equipStore.ts
    - packages-user/data-base/src/flag/system.ts
    - packages-user/data-base/src/hero/state.ts
    - packages-user/data-base/src/hero/follower.ts
    - packages-user/data-base/src/hero/types.ts
    - packages-user/data-base/src/flag/types.ts
    - packages-user/data-base/src/hero/equipStore.test.ts
    - packages-user/data-base/src/hero/follower.test.ts
    - packages-user/data-base/src/hero/saveLoad.test.ts
    - packages-user/data-base/src/flag/system.test.ts
    - packages-user/data-base/src/flag/saveLoad.test.ts
    - packages-user/data-state/test/saveablesRoundTrip.test.ts

key-decisions:
  - "Q1=A: all three containers preserve instances (equipStore / flag / followers) — per-item merge instead of whole-table replace"
  - "Q2=A: followers align by index; same index + same num restores in place without hooks; different num / different length replaces the slot and fires the existing onRemoveFollower/onAddFollower; IHeroFollower.num stays readonly"
  - "Q3=A: save wins — items / fields / followers absent from the snapshot are deleted (equivalent to the old clear(), just without detaching the restored items)"
  - "Q4=C: no diagnostics when extra items are dropped; no new codes; logger.json untouched"
  - "Same uid but a different item.num cannot reuse the instance (item is construct-time readonly) — that slot is replaced instead (T-7-25 mitigation)"

patterns-established:
  - "Identity-keyed merge in every container loadState (uid / PropertyKey / index+num), with the deletion pass derived from the snapshot's own key set"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "#06-17-4 / audit D: a same-uid EquipmentState survives loadState as the same instance with its value back at the save point in all three compressions; a same-uid/different-num snapshot replaces the slot; instances absent from the snapshot are deleted"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/equipStore.test.ts#HeroEquipsStore same-reference load (#06-17-4); packages-user/data-base/src/hero/saveLoad.test.ts#HeroState same-reference equipment load (#06-17-4)"
        status: pass
    human_judgment: false
  - id: D2
    description: "#06-17-5 / audit E: a same-key FlagCommonField survives loadState as the same instance (number and structured values), getOrInsert returns the held instance, fields absent from the snapshot are deleted"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/flag/system.test.ts#FlagSystem same-reference load (#06-17-5); packages-user/data-base/src/flag/saveLoad.test.ts#keeps field objects on loadState"
        status: pass
    human_judgment: false
  - id: D3
    description: "#06-17-6 / audit F: HeroState.loadState no longer calls removeAllFollowers; same-index/same-num followers restore in place without hooks, replaced slots fire remove+add, trailing extras are deleted, missing entries are appended"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/follower.test.ts#HeroFollowersController same-reference restore (#06-17-6); packages-user/data-base/src/hero/saveLoad.test.ts#HeroState same-reference follower load (#06-17-6)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Top level: a CoreState save/load round trip keeps the equipment instance, the flag field and the follower instance identical while their values/positions equal the save point, in all three compressions"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/saveablesRoundTrip.test.ts#CoreState container same-reference load (#06-17-4/5/6)"
        status: pass
    human_judgment: false

# Metrics
duration: 30min
completed: 2026-09-17
status: complete
---

# Phase 7 Plan 11: Container same-reference save/load (equipStore / flag / followers) Summary

**把 07-09 在 `HeroAttribute` 上确立的「同引用原则」推广到三个容器型 saveable：`HeroEquipsStore.loadState` 按 uid 复用实例、`FlagSystem.loadState` 按 key 复用字段、`HeroState.loadState` 的 followers 段改为索引对齐原地恢复（新增 `restoreFollowers`），三者都以「存档为准」删除快照中不存在的项且不打任何诊断（Q1=A / Q2=A / Q3=A / Q4=C），使外部持有的 `IEquipmentState` / `IFlagCommonField` / `IHeroFollower` 引用跨读档仍然有效。**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-09-17T05:38Z（本地 13:38，执行前基线重录）
- **Completed:** 2026-09-17T06:03Z（本地 14:03）
- **Tasks:** 4（Task 0 已由用户裁决，提交 `8943453`，本次未重复询问）
- **Files modified:** 12（生产 5 + 测试 7；无新建文件、无新依赖）

## Task Commits

Each task was committed atomically; `git rev-list --count 94ceb50..HEAD` = **5**（4 个任务提交 + 本 SUMMARY 的元数据提交；`plan_head_before` = `94ceb50cfeec6b66ab2f97badbbf6eef4399496b`）：

1. **Task 1: `#06-17-4` equipStore 保留实例** — `153f4a4` (fix)
2. **Task 2: `#06-17-5` flag 保留字段实例** — `9964326` (fix)
3. **Task 3: `#06-17-6` followers 保留式恢复** — `78f6796` (fix)
4. **Task 4: 顶层同引用集成断言** — `e4d3923` (fix)
5. **Plan metadata:** 本 SUMMARY 的 `docs(07-11): …` 提交 (docs)

提交清单（`git log --name-only 94ceb50..HEAD`）：12 个文件全部落在 frontmatter `files_modified` 内，**外加 2 个计划遗漏但计划正文明确要求的文件**（见 Deviations 1/2）。零 `client-*`、零 `data-state/src/core.ts`、零 `packages/common/src/logger.json`、零 `.planning/{WINDOWS,STATE,ROADMAP}.md`。

## Files Created/Modified

- `packages-user/data-base/src/hero/equipStore.ts` — `HeroEquipsStore.loadState` 由 `instanceMap.clear()` + 全量 `new EquipmentState(...)` 改为逐条合并：`existing && existing.item.num === save.num` → `existing.loadState(save, compression)`；否则新建并覆盖该 uid；收集 `savedUids` 后删除快照外的实例；`nextUid` 段（含 58 分支）逐字未动
- `packages-user/data-base/src/flag/system.ts` — `FlagSystem.loadState` 由 `fieldMap.clear()` + 全量 `new FlagCommonField(...)` 改为按 key 复用 + `fromStructured`，并删除快照外的 key
- `packages-user/data-base/src/hero/state.ts` — followers 段由 `void removeAllFollowers()` + `addFollower` 循环改为 `this.followers.restoreFollowers(state.followers, compression)`（方法体仍同步）
- `packages-user/data-base/src/hero/follower.ts` — 抽出私有 `createFollower(num)`（`addFollower` 复用之，行为不变）；新增公开 `restoreFollowers(saves, compression)`：先删末尾多余项（按原索引发 `onRemoveFollower`），再逐索引对齐（同 num 原地 `loadState` 不发钩子；不同 num 时 `onRemoveFollower` → `createFollower` → `loadState` → `onAddFollower`）
- `packages-user/data-base/src/hero/types.ts` — `IHeroEquipsStore.loadState` 与 `IHeroFollowersController.restoreFollowers` 补声明与中文 jsDoc（同引用契约、替换边界、删除语义、钩子触发条件）；新增 `SaveCompression` 引入
- `packages-user/data-base/src/flag/types.ts` — `IFlagSystem.loadState` 补声明与中文 jsDoc（同引用契约 + 快照外字段删除）
- `packages-user/data-base/src/hero/equipStore.test.ts` — 新增 `HeroEquipsStore same-reference load (#06-17-4)` 3 条：同实例 + 数值回档（三档）、删除快照外实例、同 uid 不同 num 替换实例；新增 `createValueSave` 夹具
- `packages-user/data-base/src/hero/follower.test.ts` — 新增 `HeroFollowersController same-reference restore (#06-17-6)` 4 条：同索引同 num 保留且不发钩子、num 不同替换并发 remove/add、末尾多余删除、缺失补齐
- `packages-user/data-base/src/hero/saveLoad.test.ts` — 新增 `#06-17-4` 2 条（容器级同实例 + 删除多余）与 `#06-17-6` 2 条（容器级同实例 + 位置/渲染回档、删除多余）；新增 `createFollowerHero` 夹具
- `packages-user/data-base/src/flag/system.test.ts` — 新增 `FlagSystem same-reference load (#06-17-5)` 4 条：同实例 + 数值回档、`getOrInsert` 复用、结构化值原地恢复、删除快照外字段
- `packages-user/data-base/src/flag/saveLoad.test.ts` — 既有「`loadState` 会重建字段对象」用例按 Q1=A 裁决改为「同实例原地恢复」（见 Deviations 2）
- `packages-user/data-state/test/saveablesRoundTrip.test.ts` — 新增 `CoreState container same-reference load (#06-17-4/5/6)` 1 条（三档）+ `registerIdentityEquipment` 夹具；既有 `seedState`/`mutateState`/`assertRestored` 与 9 条既有用例未改动

## Decisions Made

Task 0 的四条用户裁决（`07-11-PLAN.md` 的 `<record>`，提交 `8943453`）逐条落地，无自行改选：

| 裁决 | 落地位置 | 可观测证据 |
| --- | --- | --- |
| Q1=A 三子系统全部保留实例 | `equipStore.ts:267-302`（按 uid 复用）、`flag/system.ts:65-86`（按 key 复用）、`state.ts:147`（`restoreFollowers`） | 三处 `toBe(实例)` 断言 + 顶层集成断言 |
| Q2=A followers 索引对齐 + 既有钩子语义 | `follower.ts` 的 `restoreFollowers`（同 num 原地不发钩子；替换/增删发 `onRemoveFollower`/`onAddFollower`）；`IHeroFollower.num` 仍 `readonly` | `follower.test.ts` 4 条（含 `added/removed` 序列断言） |
| Q3=A 以存档为准删除多余项 | `equipStore.ts` 的 `savedUids` 删除趟、`flag/system.ts` 的 `state.fields.has` 删除趟、`follower.ts` 的末尾 `splice` | 三处「删除快照外实例/字段/跟随者」用例 |
| Q4=C 无诊断、不改码表 | 三处删除趟均无 `logger` 调用；`git diff 94ceb50..HEAD -- packages/common/src/logger.json` 为空 | 删除用例不带任何 `logger.catch` 断言；`logger.json` 零改动 |

## Findings ↔ Ledger / Registry 对照（缺口登记）

| 条目 | 来源 | 结论 | 锚点 |
| --- | --- | --- | --- |
| 审计 D（`#06-17-4`）装备实例整表重建、外部引用脱钩 | `07-LOADSTATE-AUDIT.md` D 行 | **已修 / 关闭** | `153f4a4` |
| 审计 E（`#06-17-5`）flag 字段整表重建、保留字段写入丢失 | `07-LOADSTATE-AUDIT.md` E 行 | **已修 / 关闭** | `9964326` |
| 审计 F（`#06-17-6`）followers 全量 replace、缓存 `IHeroFollower` 脱钩 | `07-LOADSTATE-AUDIT.md` F 行 | **已修 / 关闭** | `78f6796` |
| 审计「未确定项 2」渲染端/legacy 是否跨读档保留 D/E/F 实例 | `07-LOADSTATE-AUDIT.md:51` | **数据端已封口**：三个容器的外部引用跨读档证据由 `e4d3923` 在顶层 `CoreState` 出具；渲染端是否利用该引用不在本计划范围 | `e4d3923` |
| `IN-02` 空存档不重置 `nextUid` | `07-REVIEW.md` | **本轮不修，保留在册**（A5 / 计划禁令：`nextUid` 段逐字未动，`equipment` 空档仍走既有 58 分支） | 未修 |
| 装备修饰器 `IHeroModifier.setValue()` 不被 `saveState` 持久化 | 本计划执行中发现（见 Issues 3） | **新登记（不在本计划范围，未修）**：`EquipmentState` 只序列化 `value`/`percentage` 两张表，修饰器值由 `rebuildModifiers` 派生；审计 D/E/F 与本计划禁令均未覆盖 | 未修 |

`WINDOWS.md`：三条（D/E/F）均无入账 id（实测 `Select-String -Pattern "06-17-4|06-17-5|06-17-6" .planning/WINDOWS.md` 无命中），按 D-14 **只登记对照、不新建条目、不执行 `fixed`/`waive`**；`git diff 94ceb50..HEAD -- .planning/WINDOWS.md` 为空。

**Phase 7 验证已失效**：`07-VERIFICATION.md`（`2026-09-16T06:04:11Z`，覆盖 8/8 计划）在 07-09 执行前即已过期，本轮又追加 07-10/07-11（07-12..07-14 尚未执行）。本计划执行完毕后**必须重跑 `/gsd-verify-work`（或 `gsd-verify-work 7`）**重新出具验证结论；`ROADMAP.md` 的 Phase 7 计划数与 Wave 列表由 orchestrator 同步（见 Deviations 4）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - 计划遗漏的必需文件] `packages-user/data-base/src/flag/types.ts` 的接口 jsDoc**
- **Found during:** Task 2
- **Issue:** Task 2 的 `<action>`(3) 与 D-11 明确要求「在 `IFlagSystem.loadState` 的 jsDoc（`flag/types.ts`）补写同引用契约与多余字段处置」，但 frontmatter `files_modified` 未列入该文件（`hero/types.ts` 在列、`flag/types.ts` 漏列）。`loadState` 原由 `ISaveableContent` 继承而来，不重声明就无法在接口源头写 jsDoc，且 Task 2 验收项「`IFlagSystem.loadState` 的 jsDoc 与最终语义一致」会失败。
- **Fix:** 按计划正文（权威）在 `IFlagSystem` 上重声明 `loadState(state, compression)` 并补中文 jsDoc；签名取 2 参以保持 `state.flags.loadState(saved, compression)`（`IFlagSystem` 类型持有者）的既有调用签名不变；新增 `SaveCompression` 引入。`FlagSystem` 类实现仍为 1 参（dev.md:113「未使用的后置参数直接不填」）。
- **Files modified:** `packages-user/data-base/src/flag/types.ts`
- **Verification:** `vue-tsc --noEmit` 对 flag 三文件 0 命中；`flag/system.test.ts` + `flag/saveLoad.test.ts` 全通过。
- **Committed in:** `9964326`

**2. [Rule 1 - 编码旧契约的既有测试] `flag/saveLoad.test.ts` 的「重建字段对象」断言按 Q1=A 改写**
- **Found during:** Task 2（前置扫描既有断言）
- **Issue:** `packages-user/data-base/src/flag/saveLoad.test.ts:68-77` 的用例断言 `expect(system.getField('score')).not.toBe(before)` —— 逐字编码的正是本计划要消除的「整表替换」契约；Q1=A 下它必然失败。该文件同样未被 `files_modified` 列入（Task 2 的 `<action>`(d) 甚至预期它「保持通过（不改写）」）。
- **Fix:** 按 `must_haves.truths` 的括号例外「既有用例不改写（Task 0 裁决要求调整的除外）」与 A1，把该用例改为 `toBe(before)` 并更新单行注释与用例名（`keeps field objects on loadState`，附 `#06-17-5` 锚点）；同文件另两条用例未动。
- **Files modified:** `packages-user/data-base/src/flag/saveLoad.test.ts`（净 +3/-3 行）
- **Verification:** 重新实现验证——临时把 `flag/system.ts` 回退到 `94ceb50` 后该文件与 `system.test.ts` 共 4 条确定性失败（见 Reverse-Verification）；恢复后全通过。全仓仅此 1 条既有断言被改写（`git diff 94ceb50..HEAD -- *.test.ts` 中无其他 `not.toBe` 断言被删）。
- **Committed in:** `9964326`

**3. [Rule 1 - 测试配方不可用] Task 1/3 的回归配方改为「自定义存档建立存档点」**
- **Found during:** Task 1 首轮用例（`expected 5 to be 9`）
- **Issue:** 计划 Task 1(a)/Task 3(a) 的配方是「改活实例（如修饰器 `setValue`）→ save → 再改 → load」，但 `EquipmentState.saveState` 只序列化 `value`/`percentage` 两张表，`IHeroModifier.setValue()` **不进入存档**（既有 `#06-09-1` 用例 `roundTripPercentageModifier` 正是此语义：`setValue(0.9)` 后读回 0.5）。按原配方写的断言在**修复后的实现下也**必然失败，属配方缺陷而非实现缺陷。
- **Fix:** 装备侧改为「用一份自定义存档把活实例改到 9 作为存档点 → `store.saveState()` → 再改到 1 → `store.loadState()` → 断言同实例且值为 9」；新增 `createValueSave`（`equipStore.test.ts`）与内联构造（`saveLoad.test.ts` / `saveablesRoundTrip.test.ts`）。followers 侧配方按计划可用（`location.setPos` 可观测），未改。
- **Files modified:** `hero/equipStore.test.ts`、`hero/saveLoad.test.ts`、`data-state/test/saveablesRoundTrip.test.ts`（均在本计划声明文件内）
- **Verification:** 三档压缩下均通过；反向验证在旧实现下确定性失败（见 Reverse-Verification）。副产物「`setValue` 不持久化」已按 Out-of-scope 登记（见 Registry 表），**未修复**。
- **Committed in:** `153f4a4`（Task 1 部分）、`78f6796`（Task 3 部分）、`e4d3923`（顶层部分）

### 结裁导致的既有改动的逐条说明（A1 要求）

- **既有断言仅 1 条被改写**（Deviations 2 的 `flag/saveLoad.test.ts`），且为 Q1=A 裁决**强制**的结果；其余改写均为**新增用例**或**文件头/夹具新增**。
- **未新增任何 `it.skip`**：`git diff 94ceb50..HEAD | Select-String "^\+.*it\.skip|^\+.*test\.skip"` 为空；跳过项仍仅 `equipment.test.ts:306`（码 147，D-06，设计如此）。
- **既有用例零删除**：`git diff --diff-filter=D --name-only 94ceb50..HEAD` 为空。
- **既有「按 uid 重取」类断言未削弱**：`hero/saveLoad.test.ts:399-414`（equipment uid 续接）、`:417-449`（码 58/59）、`hero/state.test.ts`、`hero/equipment.test.ts`、`flag/saveLoad.test.ts` 另两条均逐字保留并通过。

### 计划未落地的声明项

- **`ROADMAP.md` / `STATE.md` 未由本计划更新**：本次执行上下文明确「orchestrator owns those」，覆盖 Task 4(5) 的 `ROADMAP.md` 同步项。
- **`WINDOWS.md` 未改动**（D-14 + Task 4 验收项）。
- **未新增依赖、未新建源码文件、未使用 `import type`、未出现连续 `as` 断言**（`git diff 94ceb50..HEAD` 中新增行零 `import type`、零 `as unknown as`）。

## Issues Encountered

**1. `pnpm test:ci` 当日基线与计划记载不一致（非本计划引入，D-12 要求重录）**

| 时点 | 文件 | 通过 | 失败 | 跳过 |
| --- | --- | --- | --- | --- |
| 执行前实测（本会话重录） | 66 | **706** | 0 | 1 |
| 执行后（本计划完成态） | 66 | **722** | 0 | 1 |
| `07-11-PLAN.md` 记载（2026-09-16） | 66 | 690 | 0 | 1 |

- 计划 `<objective>` 记载「66 文件 / 690 通过 / 1 跳过」，实测为 **706 通过 / 1 跳过**（+16），失败仍为 0；执行上下文给出的基线（706）与实测一致。
- 执行前后**失败集合均为空**，**通过数 +16**，恰等于本计划新增用例数（Task 1: 3+2、Task 2: 4、Task 3: 4+2、Task 4: 1 = 16），**零新增失败、零新增跳过**。

**2. 用户并发 WIP 在同一工作树继续演进（本计划零触碰）**

执行期间工作树中出现 `packages-user/client-base/src/types.ts`、`packages-user/client-modules/src/types.ts` 的改动（属「存档系统挪至渲染端」的在制品，`LastWriteTime` 13:42–13:43，与本次执行同时段）。本计划 4 个提交仅包含上述 12 个文件；`git diff --name-only 94ceb50..HEAD -- packages-user/client-base packages-user/client-modules` 为空。`vue-tsc --noEmit` 的 27 条既有渲染端/legacy 类型错误全部来自该并发 WIP，与本计划改动文件无关（文件级过滤 0 命中）。

**3. 执行中发现、未修（out of scope）：装备修饰器值不进入存档**

`EquipmentState.saveState` 只输出 `value`/`percentage` 两张表，`IHeroModifier.setValue()` 的修改在 `loadState` 后必然被 `rebuildModifiers()` 覆盖回表值。审计 D/E/F 与 `07-REVIEW.md` 均未登记该项，且 `07-11-PLAN.md` 的禁令要求不扩张范围，故**仅登记不修**（见 Registry 表末行），未新增用例断言该语义、未改动任何相关实现。

## User Setup Required

None - no external service configuration required.

## D-44 文件级门禁结果

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| ESLint（改动文件） | `pnpm exec eslint --fix <12 files>` → `pnpm exec eslint <12 files>` | 0 errors（Task 1/2/3 后各跑一次，Task 4 后对全部 12 文件复跑） |
| 类型（文件级） | `pnpm exec vue-tsc --noEmit` → 过滤改动文件路径（**未**以整仓退出码判定） | 0 命中（整仓 27 条错误全部属并发 WIP 的 `client-*` / `legacy-plugin-data` / `legacy-ui`） |
| 全量套件 | `pnpm test:ci`（执行前 + 执行后） | 66 文件；706 → **722 通过**（+16）、0 失败、跳过仍 1（`equipment.test.ts:306` 码 147） |
| 聚焦套件 | `pnpm exec vitest run` 5 个声明测试文件 | 70/70 通过（含 `flag/saveLoad.test.ts` 后为 73/73） |

## Reverse-Verification（用例有效性证据）

把生产实现临时回退到 `94ceb50`（`git checkout 94ceb50 -- <file>`，实验后 `git checkout HEAD -- <file>` 恢复，工作树复原已验证）：

| 反向实验 | 期望 | 实测 |
| --- | --- | --- |
| 回退 `hero/equipStore.ts` | `#06-17-4` 用例失败 | **2 failed**（`equipStore.test.ts`：同实例保真 + 删除快照外实例） |
| 回退 `flag/system.ts` | `#06-17-5` 用例失败 | **4 failed**（`system.test.ts`：同实例、getOrInsert 复用、结构化值、删除快照外字段） |
| 回退 `hero/{state,follower,types}.ts` | `#06-17-6` 用例失败 | **6 failed**（`follower.test.ts` 4 条 + `saveLoad.test.ts` 2 条） |
| 回退状态下 `data-state` 顶层套件 | 集成断言失败 | **结论不确定**：该轮次因回退 `hero/types.ts` 导致收集期未处理错误而中止（未出现 pass/fail 计数），已记录为「未取得反向证据」；恢复后该文件 10/10 通过 |

恢复后 6 个声明测试文件复跑 **73/73 通过**；`git status --short` 对 12 个改动文件为空（仅剩并发 WIP 的两个 `client-*` 文件）。**未**执行任何 `--no-verify`、未使用 `git add -A/-a`、未使用 `git stash`/`git clean`/`git reset --hard`。

## Known Stubs

None —— 本计划未引入硬编码空值、占位文案或未接线的数据源；`git diff 94ceb50..HEAD` 中零新增 `TODO`/`FIXME`。

## Threat Model Disposition

无新增威胁面（无新端点、无鉴权路径、无文件访问、无依赖安装）。计划 `<threat_model>` 的缓解项逐条落地：

| Threat ID | 缓解落地 | 证据 |
| --- | --- | --- |
| T-7-25 equipStore 整表替换（medium/mitigate） | 按 uid 复用 + `item.num` 比对后替换 | `equipStore.test.ts` 3 条 |
| T-7-26 flag 整表替换（medium/mitigate） | 按 key 复用 + `fromStructured` | `system.test.ts` 4 条 |
| T-7-27 followers 全量重建（medium/mitigate） | `restoreFollowers` 索引对齐 | `follower.test.ts` 4 条 |
| T-7-28 丢弃实例无诊断（low/mitigate） | Q4=C：jsDoc + SUMMARY 明写「静默删除」 | 三处删除趟零 `logger` 调用；本 SUMMARY Registry 表 |
| T-7-29 合并语义残留旧状态（medium/mitigate） | Q3=A 取「以存档为准删除」，读档仍等价于回到存档点 | 三处「删除快照外项」用例 + 顶层集成断言 |
| T-7-30 `loadState` 异步化（low/mitigate） | `HeroState.loadState` 仍为同步；`removeAllFollowers` 移出读档路径 | `state.ts:147` 为同步调用；`follower.test.ts` 的 `restoreFollowers` 为 `void` 同步方法 |
| T-7-SC 依赖安装（high/mitigate） | 未新增依赖、未改 `package.json` | `git diff 94ceb50..HEAD -- package.json pnpm-lock.yaml` 为空 |

## Next Phase Readiness

- 审计 D/E/F（`#06-17-4/5/6`）三容器部分全部关闭；连同 07-09 的 A/B，数据端的属性/装备/flag/follower 四类容器现在共享同一套「同引用 + 以存档为准」读档契约，容器层不再绕过属性层的修复。
- **待办（非本计划）：** ① 重跑 `/gsd-verify-work 7` 重新出具 Phase 7 验证结论（现结论已失效）；② orchestrator 同步 `ROADMAP.md` 的 Phase 7 计划数/Wave 列表与 `STATE.md`；③ `IN-02`（空存档不重置 `nextUid`）与本次新登记的「装备修饰器值不进入存档」保留在册，未修；④ 渲染端/legacy 是否实际利用跨读档引用（审计未确定项 2）需在渲染侧确认，数据端已封口。

---

## Self-Check: PASSED

- FOUND: `153f4a4`、`9964326`、`78f6796`、`e4d3923`（`git log --oneline 94ceb50..HEAD`，`git rev-list --count 94ceb50..HEAD` = 5，含本 SUMMARY 的元数据提交）
- FOUND: 12 个改动文件（`git log --name-only 94ceb50..HEAD`）
- VERIFIED: `pnpm test:ci` = 66 文件 / 722 通过 / 0 失败 / 1 跳过（仅 `equipment.test.ts:306` 码 147）
- VERIFIED: `pnpm exec eslint` 12 文件 0 错误；`vue-tsc --noEmit` 对 12 文件 0 命中
- VERIFIED: `git diff --name-only 94ceb50..HEAD -- .planning/WINDOWS.md .planning/STATE.md .planning/ROADMAP.md packages-user/data-state/src/core.ts packages/common/src/logger.json packages-user/client-base packages-user/client-modules` 为空

---

*Phase: 07-data-fixes*
*Completed: 2026-09-17*
