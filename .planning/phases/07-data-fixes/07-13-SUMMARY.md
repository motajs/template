---
phase: 07-data-fixes
plan: 13
subsystem: data-layer
tags: [map-damage, ghost-damage, cache-invalidation, dirty-index, empty-view-set, point-residue, load-state, dynamic-tiles, cr-02, in-01, 06-17-8, regression]

requires:
  - phase: 07-data-fixes
    provides: "07-12 equipment/attribute save correctness (WR-05 / WR-06 / compareEquip + IN-02 test alignment) and its D-44 file-level gate baseline (66 files / 729 passed / 0 failed / 1 skipped)"
  - phase: 07-data-fixes
    provides: "07-11 container same-reference load and 07-09's same-reference principle (in-place loadState)"
  - phase: 06-unit-tests
    provides: "D-44 file-level three-step gate, the mapDamage/mapLayer/saveLoad suites, and D-06's retained code-147 skip"
provides:
  - "CR-02 closed (Q1=A): removeEnemyAffecting collects every removed coordinate index and calls markDirtyIndex for each, so BOTH the source-disappeared and the range-shrunk paths invalidate through the existing refreshIndex; refreshEnemyAndClearCache and refreshEnemy register an empty Set instead of early-returning, so a later markEnemyDirty stays on the local path rather than falling back to refreshAll()"
  - "IN-01 closed (Q4=A): deleteEnemy prunes the removed view from point.affectedBy and drops its point.damages entry (no longer relying on refreshIndex's viewStore lazy skip); deleteMapDamage removes the sourcelessDamage IPointInfo once both damages and affectedBy are empty, keeping markDirtyIndex"
  - "#06-17-8 closed (Q3=A1): MapLayer.loadState clears every existing dynamic tile before dispatching the three compression tiers, reusing deleteDynamic semantics (syncStaticEvent(tile,false) + removeTile + onDeleteDynamic) without awaiting the hook; a load never accumulates tiles and never reuses old instances"
  - "Q2 = A registered: setMapRef/getMapRef keep the existing 'expire the old mapData object + whole-object replacement' contract with ZERO code change and ZERO jsDoc change; the contract text lives in the Task 0 <record> and this SUMMARY"
  - "sourcedDamage empty point entries remain by decision (Q4=A non-goal) — registered as a known lazy residue that produces no wrong results"
affects: [07-data-fixes, data-system-combat, data-base-map, render-side-holders, phase-07-verification]

actuals:
  tokens: 3502
  tasks: 5
  commits: 6
  plan_head_before: b37c218f2d4c4ac2158d478795e2738d4edfbd69

tech-stack:
  added: []
  patterns:
    - "Removal-side invalidation ownership: the operation that removes a contribution owns marking its coordinate indexes dirty, and the re-registration path clears only the indexes it re-registers — indexes that fell out of range keep the dirty flag and are re-aggregated by refreshIndex"
    - "An empty Set is a registered value, not an absence: enemyStore.set(view, emptySet) keeps a later markEnemyDirty on the local path instead of falling back to refreshAll(); no early-return branch is added for the empty case (A5)"
    - "Prune on delete instead of relying on a lazy skip: deleteEnemy removes the deleted view from point.affectedBy so refreshIndex never calls getDamageWithoutCheck on a dead view"
    - "Read-time cleanup at the entry point: clearDynamics runs as the first line of loadState (not inside loadDynamics) so the three compression tiers AND the missing-dynamicBlocks case start from a clean slate by construction"
    - "Snapshot-then-mutate iteration: [...iterateDynamicTiles()] snapshots the managed tiles before posTileMap is mutated during cleanup"
    - "Fire-and-forget cleanup hooks: loadState is synchronous while onDeleteDynamic returns Promise<void>, so the read-time cleanup calls forEachHook without awaiting (the same call shape transferToStatic uses)"
    - "Mutation-only code paths in the data layer carry no new comments: the plan authorized exactly one jsDoc (the new private method), and the pruning mirrors removeEnemyAffecting's existing shape"

key-files:
  created: []
  modified:
    - packages-user/data-system/src/combat/mapDamage.ts
    - packages-user/data-system/src/combat/mapDamage.test.ts
    - packages-user/data-base/src/map/mapLayer.ts
    - packages-user/data-base/src/map/mapLayer.test.ts
    - packages-user/data-base/src/map/saveLoad.test.ts

key-decisions:
  - "Task 0 Q1=A (user, 2026-09-17): mark every removed index dirty AND register the empty view set; no early-return branch is added for the empty case (A5)"
  - "Task 0 Q2=A: setMapRef/getMapRef keep the existing 'expire old object + replace' contract — zero code change and zero jsDoc change (user long-term rule: never touch jsDoc unprompted); the contract text lives in the <record> and this SUMMARY"
  - "Task 0 Q3=A1: fully clear existing dynamic tiles before loading, reusing deleteDynamic semantics and FIRING onDeleteDynamic; non-awaited because loadState is synchronous (A6)"
  - "Task 0 Q4=A: include IN-01 in this plan (two cleanups); sourcedDamage empty point entries are explicitly a non-goal (A4)"
  - "deleteMapDamage's empty-point removal has NO publicly observable difference (A7) — registered honestly; no private-field reflection or chained as-assertion witness was manufactured"
  - "Only one jsDoc was authored in this plan: the new private clearDynamics (dev.md:73 requires a jsDoc; dev.md:118 requires private methods before their caller). Task 1 additionally added three plain // why-comments inside mapDamage.ts (AGENTS.md permits new comments; dev.md:83 requires a why, not a what) — so the plan wording 'no jsDoc/comment change' holds as 'no jsDoc added beyond clearDynamics and no existing comment/jsDoc modified'"

patterns-established:
  - "Empty set is truthy: markEnemyDirty/deleteEnemy need no new branch for a registered empty view set"
  - "Delete-time pruning with a getDamageWithoutCheck spy as the dead-view witness"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "CR-02 (Q1=A): a source enemy's aura/special disappearing or its range shrinking no longer leaves ghost map damage; the empty view set is registered so a later markEnemyDirty stays local"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/mapDamage.test.ts#MapDamage sourced conversion and reduction (drops ghost damage when the enemy view set becomes empty / drops stale damage on indexes that fall out of a shrunken range / keeps refreshing locally after an empty view set is registered / registers an empty view set through refreshAll as well); existing deleteEnemy and code-102/103/104 and multi-source cases kept verbatim"
        status: pass
    human_judgment: false
  - id: D2
    description: "IN-01 (Q4=A) deleteEnemy: the deleted view is pruned from point.affectedBy and its point.damages entry is dropped, so the lazy refreshIndex never calls getDamageWithoutCheck on a dead view"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/mapDamage.test.ts#MapDamage sourced conversion and reduction (does not rebuild damage from a deleted view after pruning); reverse-verified: reverting the pruning fails the case with getDamageWithoutCheck called once"
        status: pass
    human_judgment: false
  - id: D3
    description: "#06-17-8 (Q3=A1): loadState never accumulates dynamic tiles — the loaded set equals the save, repeated loads do not grow it, old instances stop being managed, and the cleanup fires onDeleteDynamic synchronously"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/map/mapLayer.test.ts#MapLayer dynamic conversion (clears existing dynamic tiles before loading); packages-user/data-base/src/map/saveLoad.test.ts#MapLayer save and load round trips (does not accumulate dynamic tiles when loading fewer than present); reverse-verified: disabling the clearDynamics() call fails them with 5-vs-2 and 4-vs-1"
        status: pass
    human_judgment: false
  - id: D4
    description: "Q2 = A registered: setMapRef/getMapRef keep 'expire the old mapData object + whole-object replacement' with zero code change and zero jsDoc change"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "git diff 674b325..HEAD -- packages-user/data-base/src/map/mapLayer.ts packages-user/data-system/src/combat/types.ts => mapLayer.ts +14/-0 with no setMapRef/getMapRef/resize/resize2/expired line; combat/types.ts empty"
        status: pass
    human_judgment: false
  - id: D5
    description: "IN-01 (Q4=A) deleteMapDamage: the sourcelessDamage IPointInfo is removed once both damages and affectedBy are empty (bookkeeping/memory only)"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/mapDamage.test.ts#MapDamage sourceless damage (prunes the sourceless point once every damage is deleted) — public contract only"
        status: pass
    human_judgment: true
    rationale: "A7: this branch has NO publicly observable difference — getReducedDamage/getSeparatedDamage return identical values before and after the fix. Its landing is confirmed by line-by-line conformance to the Task 0 <record> plus the public-contract regression above; a private-field-reflection or chained-as witness was explicitly forbidden and was not manufactured. Accepting the bookkeeping fix therefore requires reading the code/record comparison, not a test signal."

# Metrics
duration: 56min
completed: 2026-09-17
status: complete
---

# Phase 7 Plan 13: Map invalidation boundaries (CR-02 ghost damage / IN-01 post-delete residue / `#06-17-8` dynamic-tile accumulation) Summary

**`MapDamage` 的幽灵伤害（CR-02）与删除后点残留（IN-01）闭合、`MapLayer.loadState` 读档前全清既有动态块（`#06-17-8`）；`setMapRef`/`getMapRef` 按用户裁决保持「标旧对象 `expired` + 整对象替换」的现契约，**零代码改动、零 jsDoc 改动**；新增 4 条公开可观测回归（2 条 CR-02 之外的 IN-01 + 2 条读档不累积），全量套件 66 文件 / 737 通过 / 0 失败 / 1 跳过。**

## Performance

- **Duration:** ~56 min plan-level（本地 16:36 → 17:32）；本次接力会话（Tasks 2–4）约 **14 min**（本地 17:18 → 17:32）
- **Started:** 2026-09-17T08:36:49Z（本地 16:36:49，裁决锁提交 `b37c218`）
- **Completed:** 2026-09-17T09:32Z（本地 17:32）
- **Tasks:** 5（Task 0 已由用户于 2026-09-17 裁决并写入 `<record>`；Task 1 由上一会话完成并提交 `cff4291`；本会话完成 Task 2/3/4）
- **Files modified:** 5（生产 2 + 测试 3；无新建文件、无新依赖、无删除文件）
- **Diff size:** +199 / −3（`git diff --numstat b37c218..HEAD` 五个文件）；实测 `actuals.tokens = 3502`（diff 字符数 14007 / 4），相对 `estimate.tokens = 54000` 偏低 15.4×（与 07-11、07-12 同量级偏高，供后续校准）

## Task Commits

`git rev-list --count b37c218..HEAD` = **6**（Task 1/2/3 三条任务提交 + 本 SUMMARY 的元数据提交 + 2 条非本计划产出的提交：合并提交 `3da7863` 及其带入的 `954c3fc`）；`plan_head_before` = `b37c218f2d4c4ac2158d478795e2738d4edfbd69`。全部为**普通提交、钩子生效**，未使用 `--no-verify`、未 amend 任何已推送提交：

1. **Task 1: CR-02（Q1=A）移除端标脏 + 空视图集登记** — `cff4291` (fix)〔上一会话完成，本会话未改动其任何内容〕
2. **Task 2: IN-01（Q4=A）删除后点残留清理** — `c1df1e0` (fix)
3. **Task 3: `#06-17-8`（Q3=A1）读档前全清既有动态块** — `13234b7` (fix)
4. **Plan metadata:** 本 SUMMARY 的 `docs(07-13): …` 提交 (docs)

两条非任务提交的来历（如实登记，不影响计划产出）：`3da7863` 是上一会话为同步 origin 而做的合并；`954c3fc` 是该合并从 origin 带入的 07-12 重复完成提交（与主线 `4917baa` 同内容）。二者均未触碰本计划五个文件（下方「Issues Encountered 3」）。

**提交文件清单**（`git log --name-only`）：三条任务提交共 5 个文件全部落在 frontmatter `files_modified` 内，**零计划外文件**；`git log --name-only b37c218..HEAD` 中不含 `packages-user/client-base/**`、`packages-user/client-modules/**`、`AGENTS.md`（并发 WIP 未被暂存、未被提交）。

## Files Created/Modified

- `packages-user/data-system/src/combat/mapDamage.ts` — (Task 1) `removeEnemyAffecting` 收集被移除贡献的坐标索引并在遍历结束后统一 `markDirtyIndex`；`refreshEnemyAndClearCache`/`refreshEnemy` 换序为「先 `enemyStore.set(view, set)` 再 `if (set.size === 0) return;`」，并各加一条 why-comment（Task 1 落笔）。(Task 2) `deleteEnemy` 内层循环补「取 `point` → `point.affectedBy.delete(viewItem)` + `point.damages.delete(dam)`」；`deleteMapDamage` 在 `damages`/`affectedBy` 皆空时移除该 `sourcelessDamage` 条目。全计划 +17 / −2
- `packages-user/data-system/src/combat/mapDamage.test.ts` — Task 1 新增 4 条（空视图集来源消失 / 范围收缩 / 空集后局部刷新 / `refreshAll` 同样登记空集）；Task 2 新增 2 条（`deleteEnemy` 死视图见证 / `deleteMapDamage` 两条臂）；文件头覆盖说明按 A1 追加「CR-02 空视图集/范围收缩、IN-01 删除后点残留」。既有用例逐字保留。全计划 +125 / −1
- `packages-user/data-base/src/map/mapLayer.ts` — 新增私有方法 `clearDynamics()`（置于 `loadDynamics` 之后、其调用者 `loadState` 之前；本计划**唯一授权**的 jsDoc 落笔），`loadState` 首行调用它；`setMapRef`/`getMapRef`/`resize`/`resize2`/`loadDynamics` 逐字未改。+14 / −0
- `packages-user/data-base/src/map/mapLayer.test.ts` — 新增 1 条实例级回归（清空 + 钩子触发 + 旧实例不再被管理），新增 `SaveCompression` 导入（既有导出，无新依赖）。+25 / −0
- `packages-user/data-base/src/map/saveLoad.test.ts` — 新增 1 条三档往返回归（动态块多于存档 → 读档后等于存档；连续两次读档不累积），放在 `MapLayer save and load round trips` describe 内。+18 / −0

## Decisions Made

Task 0 的四条用户裁决（`07-13-PLAN.md` 的 `<record>`，锁于 `b37c218`）逐条落地，无自行改选：

| 裁决 | 落地位置 | 可观测证据 |
| --- | --- | --- |
| **Q1=A 标脏 + 空集登记** | `mapDamage.ts` 的 `removeEnemyAffecting` / `refreshEnemyAndClearCache` / `refreshEnemy`（`cff4291`） | `mapDamage.test.ts` 的 4 条 CR-02 用例（含 `iterateEnemy` 未被调用 + `converter.calls` 恰增 1 的双重断言） |
| **Q2=A 保留替换 + `expired`，零代码零 jsDoc** | **无改动**（`cff4291`/`c1df1e0`/`13234b7` 均未触碰） | `git diff 674b325..HEAD -- mapLayer.ts combat/types.ts`：`mapLayer.ts` +14/−0 且无 `setMapRef`/`getMapRef`/`resize`/`resize2`/`expired` 行；`combat/types.ts` 输出为空 |
| **Q3=A1 读档前全清 + 触发钩子** | `mapLayer.ts` 的 `clearDynamics` + `loadState` 首行（`13234b7`） | `mapLayer.test.ts` 的钩子触发与旧实例断言；`saveLoad.test.ts` 三档重复读档块数恒等于存档 |
| **Q4=A 一并修 IN-01** | `mapDamage.ts` 的 `deleteEnemy` 剪除 + `deleteMapDamage` 空点移除（`c1df1e0`） | `deleteEnemy` 有自动化见证（死视图不再被 `refreshIndex` 触达）；`deleteMapDamage` 为簿记修复（A7，见下） |

**「空集不是未登记」口径（A5）**：`markEnemyDirty`（`if (!store)`）与 `deleteEnemy`（`if (!store) return`）**未新增任何分支**——空 `Set` 为真值，已登记的空集合天然走局部路径；该口径由 `keeps refreshing locally after an empty view set is registered` 与 `registers an empty view set through refreshAll as well` 两条用例固定。

**「触发式、不等待」口径（A6）**：`clearDynamics` 为同步方法（`loadState` 与 `MapState.loadState` 均同步），`onDeleteDynamic` 返回 `Promise<void>`，故按 `forEachHook(hook => hook.onDeleteDynamic?.(tile))` 触发而**不** `await`（与 `transferToStatic` 的调用形状一致，与可等待的 `deleteDynamic` 有意区分）。

## Findings ↔ Ledger / Registry 对照（缺口登记，Task 4(4)）

| 条目 | 结论（引用裁决） | 锚点 |
| --- | --- | --- |
| **CR-02** `MapDamage` 幽灵伤害（来源消失 / 范围收缩后缓存残留） | **已闭合（Q1=A）**：移除端逐个 `markDirtyIndex`，两条路径都经既有 `refreshIndex` 按剩余贡献重新聚合；空视图集登记后 `markEnemyDirty` 保持局部刷新（`refreshAll()` 不再被级联触发）。反向验证：Task 1 用例在当前工作树为绿，且 07-12 基线中它们不存在 | `cff4291` |
| **IN-01** 删除后的点残留 | **已闭合（Q4=A，两处清理）**：`deleteEnemy` 剪除 `point.affectedBy` 与 `point.damages`（**有自动化见证**：删除后惰性 `refreshIndex` 时 `spy(getDamageWithoutCheck)` 计数为 0；反向验证关闭剪除后该用例确定性失败，「Number of calls: 1」）；`deleteMapDamage` 在两集合皆空时移除该 `sourcelessDamage` 条目。**如实登记**：`deleteMapDamage` 的空点移除为**簿记/内存修复，无公开可观测差异**（`getReducedDamage`/`getSeparatedDamage` 前后一致），其见证仅为公开契约回归 + 与 `<record>` 的逐行对照，**未**伪造私有字段反射 / 连续 `as` 见证（A7） | `c1df1e0` |
| **`#06-17-8`** 读档旧动态块累积（审计 G） | **已闭合（Q3=A1）**：`loadState` 首行 `clearDynamics()` 全清本层既有动态块（逐块 `syncStaticEvent(tile,false)` + `removeTile` + **触发** `onDeleteDynamic`，不等待），三档与「存档不含 `dynamicBlocks`」情形**按构造**一致；反向验证：关闭该调用后两条新用例确定性失败（5-vs-2、4-vs-1） | `13234b7` |
| **Q2** `setMapRef` 失效契约 | **保留现契约、无代码改动、无 jsDoc 改动**：`setMapRef`（标旧 `mapData` `expired = true` + 整对象替换）与 `getMapRef` 逐字保留，与 `resize`/`resize2` 的 `:625`/`:668` 口径一致。契约文本按用户长期规则**不进源码注释**，改由 Task 0 `<record>` 与本 SUMMARY 承载（T-7-41 仍为 accept / low） | 无提交（零改动） |
| **`sourcedDamage` 空点条目** | **已知惰性残留（Q4=A 非目标）**：本计划**不删除** `sourcedDamage` 中的空 `IPointInfo`；该残留不产生错误结果（`refreshIndex` 对无 `viewStore` 的视图不再重建），登记为设计边界 | 未修（按裁决） |
| **IN-04 / IN-05** | **保留在册，本轮不修**（`07-REVIEW.md` 的 Info 级条目：`DamageContext.getDamageInfo` 冗余判空、`EnemyManager.reusePrefab` 未注册来源静默 no-op）——不在本轮清单，只登记不修 | 未修 |
| `WINDOWS.md` | **未被本计划改动、不新建条目、未执行 `fixed`/`waive`**（D-14：CR-02 / IN-01 / `#06-17-8` 均无入账 id）；实测 `git status --short -- .planning/WINDOWS.md` 为空，文件仍为 11 open / 0 waived / 17 fixed / 28 total | 无 |

### jsDoc / 注释审计（用户长期规则）

| 项 | 结论 | 证据 |
| --- | --- | --- |
| 新增 jsDoc | **恰好 1 处**：`clearDynamics`（本计划唯一授权落笔） | `git diff 674b325..HEAD -- "*.ts" \| Select-String "^\+.*/\*\*"` 仅 1 命中，位于 `mapLayer.ts` |
| 既有 jsDoc / 注释被修改 | **0 处**（生产文件） | `git diff 674b325..HEAD -- "*.ts" \| Select-String "^-\s*(//\|/\*\|\*)"` 唯一命中是 `mapDamage.test.ts:1` 的**测试文件头**——按 A1 与 dev.md:85 的既定要求授权同步（只追加、不删除信息） |
| 非 jsDoc 新增注释 | Task 1 在 `mapDamage.ts` 新增 3 条单行 why-comment（`收集被移除贡献的坐标索引…`、`空集也需要登记…` ×2）：AGENTS.md 明许「新增注释随便新增」且 dev.md:83 要求注释说明「为什么」；Task 1 的验收口径为「零 jsDoc 改动」，已满足。**Task 2/3 未新增任何注释**（含 jsDoc） | `git diff 674b325..HEAD -- mapDamage.ts` 的注释行均为 Task 1 的 `+` 行 |
| 计划 Task 4 表述校准 | `<objective>` 第 6 条「无任何 jsDoc/注释改动」按「除 `clearDynamics` 的 jsDoc 外无**新增 jsDoc**、且无**既有** jsDoc/注释被修改」成立；Task 1 的 3 条非 jsDoc 注释不违禁令 | 见上两行 |

### 断言变更清单（A1 唯一授权；逐条说明）

- **既有断言无一条被改写**：`git diff 674b325..HEAD` 中被删除的断言行仅为 `mapDamage.test.ts:1` 的文件头注释；`mapDamage.test.ts` 的既有 CR-02 之外的用例、102/103/104、`deleteEnemy`/`markEnemyDirty`、多来源叠加用例，以及 `map/saveLoad.test.ts` 的三档往返与码 124 用例**逐字保留且全部通过**。
- **未新增 `it.skip` / `test.skip`**（`git diff 674b325..HEAD -- "*.test.ts" | Select-String "^\+.*(it|test)\.skip"` 为空）；跳过项仍仅 1 条（码 147，D-06）。
- **无既有用例被删除**：`git diff --diff-filter=D --name-only 674b325..HEAD` 为空。

## D-44 文件级门禁结果

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| ESLint（5 个改动文件） | `pnpm exec eslint --fix <file>` → `pnpm exec eslint <file>`（Task 2/3 后各一次） | **0 errors**（5/5 文件 `--fix` 与检查退出码均为 0；`--fix` 后工作树无新增改动，说明提交版本即已合规） |
| 类型（文件级） | `pnpm exec vue-tsc --noEmit` → 过滤 5 个改动文件相对路径（**未**以整仓退出码判定，按 06-RESEARCH Pitfall 4） | **0 命中**（整仓 27 条诊断全部属并发 WIP 的 `client-*` / legacy 渲染端，与 5 个改动文件无关；`TSC_EXIT=2` 不作为判据） |
| 全量套件 | `pnpm test:ci` | 66 文件；**737 通过 / 0 失败 / 1 跳过** |
| 聚焦套件 | `pnpm exec vitest run packages-user/data-system/src/combat/mapDamage.test.ts` | **21 通过 / 0 失败** |
| 聚焦套件 | `pnpm exec vitest run packages-user/data-base/src/map/` | **125 通过 / 0 失败**（11 文件，含 `mapLayer.test.ts` 36、`saveLoad.test.ts` 10） |
| Q2 零改动 | `git diff 674b325..HEAD -- packages-user/data-base/src/map/mapLayer.ts packages-user/data-system/src/combat/types.ts` | `mapLayer.ts` **+14/−0** 且**无** `setMapRef`/`getMapRef`/`resize`/`resize2`/`expired` 相关行；`combat/types.ts` **输出为空**（以 `b37c218..HEAD` 复核结果相同） |

**跳过项实测位置**：`packages-user/data-base/src/hero/equipment.test.ts:353`（`it.skip('warns code 147 when no equipment slot is available', …)`，码 147，D-06）。计划与接力说明记载的「`:306`」为**陈旧行号**（文件未被本计划触碰，`git diff` 输出为空）；**跳过数与码均未变化**（全仓 `it.skip` 计数 = 1），性质不受影响。

## Reverse-Verification（用例有效性证据）

本次接力会话对 Task 2/3 的新用例各做一次反向实验，实验后均精确恢复（`git diff` 复核改动与提交版本逐字一致）：

| 反向实验 | 期望 | 实测 |
| --- | --- | --- |
| 临时移除 `deleteEnemy` 内的 `point.affectedBy.delete` / `point.damages.delete`（Task 2 剪除） | `does not rebuild damage from a deleted view after pruning` 失败 | **1 failed**：`expect(spy).not.toHaveBeenCalled()` 失败，`getDamageWithoutCheck` 被调用 1 次（`{x:1,y:0}`） |
| 临时移除 `loadState` 首行的 `this.clearDynamics();`（Task 3 入口清理） | 两条 `#06-17-8` 用例失败 | **`mapLayer.test.ts` 1 failed**：`expected […] to have a length of 2 but got 5`；**`saveLoad.test.ts` 1 failed**：`expected […] to have a length of 1 but got 4` |

恢复后：`pnpm exec vitest run packages-user/data-base/src/map/` = **125 通过**；`pnpm test:ci` = **737 通过 / 0 失败 / 1 跳过**。**未**执行任何 `--no-verify`、未使用 `git add -A/-a`、未使用 `git stash`/`git clean`/`git reset --hard`。

## Deviations from Plan

### 计划口径落地偏差

**1. [如实登记 - 计划表述校准] Task 4 的「无任何 jsDoc/注释改动」按「无新增 jsDoc（除授权项）+ 无既有注释被修改」口径成立**

- **Found during:** Task 4 的 jsDoc 审计
- **Issue:** 计划 `<objective>` 第 6 条与 `<action>`(3) 的表述措辞为「本计划无任何 jsDoc/注释改动」。实测 `git diff 674b325..HEAD` 显示 Task 1 在 `mapDamage.ts` 新增了 3 条**非 jsDoc** 的单行 `//` why-comment（空集登记说明与移除端收集说明）。AGENTS.md 明许「新增注释随便新增」（且 dev.md:83 要求注释说明「为什么」），Task 1 的验收口径亦仅为「零 jsDoc 改动」；故这不构成禁令违反，但使计划那句总括表述不严谨。
- **处置:** Task 1 已提交且按硬约束**不得回改**，故不改代码、不改注释；在 SUMMARY 的「jsDoc / 注释审计」表中如实列明，并把门禁判据明确为「新增 jsDoc 仅 `clearDynamics` 1 处、既有 jsDoc/注释 0 处被修改」。Task 2/3 未新增任何注释（含 jsDoc），本计划的唯一授权 jsDoc 落笔保持唯一。
- **Files affected:** 表述面（SUMMARY）；**未修改任何源码/注释**
- **Committed in:** 本 SUMMARY

### 计划未落地的声明项

- **`WINDOWS.md` 未改动**（D-14 + Task 4 验收项：不新建、不 `fixed`/`waive`）。
- **未新增依赖、未新建源码文件、未使用 `import type`、未使用连续 `as` 断言**；Task 3 仅新增一个既有导出 `SaveCompression` 到测试文件的普通导入。
- **`combat/types.ts`、`mapDamage.ts` 之外的 `context.ts`、`gameMap.ts`、`mapState.ts`、`dynamicTile.ts` 零改动**（范围守卫 A4）。
- **`sourcedDamage` 空条目按裁决保留**（非目标）。

## Issues Encountered

**1. 全量套件基线重录（D-12 要求）**

| 时点 | 文件 | 通过 | 失败 | 跳过 |
| --- | --- | --- | --- | --- |
| 07-12 收尾（计划 objective 记载） | 66 | 729 | 0 | 1 |
| 07-13 Task 1 收尾（接力说明记载） | 66 | 733 | 0 | 1 |
| 本次接力会话执行前（起点） | — | 733 | 0 | 1 |
| 本次接力会话执行后（本计划完成态） | 66 | **737** | **0** | **1** |

- 通过数 +4 = 本轮新增 4 条用例（Task 2 计 2、Task 3 计 2；Task 1 的 4 条已在 733 内）；**失败数 0 不变**，跳过仍 1 条（`equipment.test.ts` 码 147）。

**2. 计划/接力说明记载的跳过行号 `equipment.test.ts:306` 已陈旧**

- **现象:** 实测唯一 `it.skip` 位于 `packages-user/data-base/src/hero/equipment.test.ts:353`（码 147，`warns code 147 when no equipment slot is available`），全仓 `it.skip` 计数 = 1。
- **处置:** 该文件不在本计划 `files_modified` 内、`git diff` 为空，故不改动；按范围守卫只作**事实登记**（非缺陷、非本计划引入），门禁判据「跳过项恰 1 条且为码 147」已满足。**未**将其写入 `WINDOWS.md` 或任何登记列表。

**3. 计划头与 HEAD 之间存在一条合并提交与其带入的重复 07-12 完成提交**

- **现象:** `git rev-list --count b37c218..HEAD` = 6，其中 `3da7863`（上一会话同步 origin 的合并）与 `954c3fc`（该合并带入的 07-12 重复完成提交，与主线 `4917baa` 同内容）不是本计划产出；三条任务提交 + 本 SUMMARY 的元数据提交 = 4。
- **处置:** 按 #3968 以 `plan_head_before`（`b37c218`）**实测**计数并如实登记构成（见「Task Commits」）；两条非任务提交未触碰本计划 5 个文件（`git log --name-only` 复核）。**未**回退/改写任何提交（`refactor/data` 已推送，禁止 amend）。

**4. 上一会话遗留的未跟踪接力文件**

- `.planning/phases/07-data-fixes/.continue-here.md` 与 `.planning/milestone.lock` 为未跟踪文件，非本计划 `files_modified` 声明项，故**未**暂存、**未**提交（避免超出计划声明的提交范围）；如需入库请由编排器统一处置。

## User Setup Required

None - no external service configuration required.

## Known Stubs

None —— 本计划未引入硬编码空值、占位文案、未接线数据源或新增 `TODO`/`FIXME`/`it.skip`（`git diff 674b325..HEAD` 复核）。唯一「无公开可观测差异」的簿记改动（`deleteMapDamage` 空点移除）已按 A7 以 coverage 条目 D5（`human_judgment: true`）如实登记，不为它制造伪见证。

## Threat Model Disposition

无新增威胁面（无新端点、无鉴权路径、无文件访问、无依赖安装）。计划 `<threat_model>` 的缓解项逐条落地：

| Threat ID | 处置 | 缓解落地 | 证据 |
| --- | --- | --- | --- |
| T-7-37 `removeEnemyAffecting` 不标脏（high / mitigate） | Q1=A | 收集被移除索引并逐个 `markDirtyIndex`，旧坐标经 `refreshIndex` 重新聚合 | `cff4291`；CR-02 两条路径用例 |
| T-7-38 空视图集早退（high / mitigate） | Q1=A | 两处均改为「先 `enemyStore.set(view, set)` 再 `if (set.size === 0) return;`」，避免缓存残留与 `refreshAll()` 级联 | `cff4291`；两入口各 `iterateEnemy` spy + `converter.calls` 断言 |
| T-7-39 空集被误读为未登记（low / mitigate） | A5 | **不新增分支**（空 `Set` 为真值），以两条用例固定口径 | `cff4291`；`keeps refreshing locally…` / `registers an empty view set through refreshAll as well` |
| T-7-40 `loadDynamics` 不清旧动态块（medium / mitigate） | Q3=A1 | `loadState` 入口全清（`clearDynamics`，复用 `deleteDynamic` 语义），三档与缺字段按构造一致 | `13234b7`；重复读档 / 旧实例不再被管理断言 + 反向验证 |
| T-7-41 `expired` 契约无源码文本（low / accept） | Q2=A | **保留现契约、零代码、零 jsDoc**；契约文本落在 `<record>` 与 SUMMARY | 无提交；`git diff` 证明零改动 |
| T-7-42 读档全清触发大量钩子（low / mitigate） | A6 | 钩子**触发式、不等待**，读档不被渲染端异步钩子阻塞；`syncStaticEvent(tile,false)` 的写入随后被矩阵读档覆盖 | `13234b7`；`loadState` 保持同步 |
| T-7-43 删除后 `affectedBy`/`damages` 残留（low / mitigate） | Q4=A | `deleteEnemy` 剪除死视图与其伤害（有 `getDamageWithoutCheck` 不被调用的见证）；`deleteMapDamage` 在两集合皆空时移除该点 | `c1df1e0`；反向验证「Number of calls: 1」 |
| T-7-SC 依赖安装（high / mitigate） | — | 未新增依赖、未改 `package.json`/`pnpm-lock.yaml` | `git status --short -- package.json pnpm-lock.yaml` 为空 |

## Phase 7 验证失效与重跑要求

**`07-VERIFICATION.md`（`verified: 2026-09-16T06:04:11Z`，`status: passed`，`score: 15/15`）已失效**：其结论不覆盖 07-09 之后追加的 07-10..07-13（以及尚未执行的 07-14）。本计划执行完毕后**必须重跑 `/gsd-verify-work`（或 `gsd-verify-work 7`）**重新出具验证结论，方可评估 Phase 7 收口。`ROADMAP.md` 的 Phase 7 计划计数与 Wave 列表已按 SUMMARY 数同步（07-13 完成后为 13/14）。

## Next Phase Readiness

- 地图侧三条失效边界缺陷（CR-02 幽灵伤害 / IN-01 删除后点残留 / `#06-17-8` 读档动态块累积）已闭合；`setMapRef` 按用户裁决零改动，契约文本登记完毕。`combat/types.ts` 与本计划范围外的 map 文件零改动。
- **待办（非本计划）：** ① 重跑 `/gsd-verify-work 7` 重新出具 Phase 7 验证结论（现结论已失效）；② 执行最后一个计划 **07-14**（`data-fallback` hero 代理跟随活属性 / `#06-17-7`）；③ `IN-04`/`IN-05` 保留在册、未修；④ `sourcedDamage` 空点条目为已知惰性残留（Q4=A 非目标）；⑤ 计划/接力说明中 `equipment.test.ts:306` 的陈旧行号可在后续文档维护中更新为 `:353`。

---

## Self-Check: PASSED

- FOUND: `cff4291`（Task 1，上一会话，未改动）、`c1df1e0`（Task 2）、`13234b7`（Task 3）（`git log --oneline b37c218..HEAD`；`git rev-list --count b37c218..HEAD` = 6）
- FOUND: 5 个改动文件（`git diff --name-only b37c218..HEAD`），全部在 frontmatter `files_modified` 内；三条任务提交零计划外文件
- VERIFIED: `pnpm test:ci` = 66 文件 / **737 通过 / 0 失败 / 1 跳过**（仅 `equipment.test.ts:353` 码 147，D-06）
- VERIFIED: `pnpm exec eslint` 5 文件 0 错误；`vue-tsc --noEmit` 对 5 文件 0 命中（整仓 27 条均属并发 WIP）
- VERIFIED: Q2 零改动——`git diff 674b325..HEAD -- mapLayer.ts combat/types.ts`：`mapLayer.ts` +14/−0 且无 `setMapRef`/`getMapRef`/`resize`/`resize2`/`expired` 行，`combat/types.ts` 空
- VERIFIED: 新增 jsDoc 仅 `clearDynamics` 1 处；既有 jsDoc/注释 0 处被修改；未新增 `it.skip`；`git diff --diff-filter=D --name-only 674b325..HEAD` 为空
- VERIFIED: `git log --name-only b37c218..HEAD` 不含 `client-base`/`client-modules`/`AGENTS.md` WIP；`WINDOWS.md` 未改动（git status 为空）
- VERIFIED: 反向验证两条（Task 2 死视图见证「Number of calls: 1」；Task 3 关闭清理 5-vs-2 与 4-vs-1），恢复后全绿

---

*Phase: 07-data-fixes*
*Completed: 2026-09-17*
