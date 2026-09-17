---
phase: 07-data-fixes
plan: 12
subsystem: data-layer
tags: [equip-store, hero-attribute, modifier-bookkeeping, replay-isolation, compare-equip, index-mismatch, in-02, design-as-is, regression]

requires:
  - phase: 07-data-fixes
    provides: "07-11 container same-reference load (HeroEquipsStore.loadState reuses the instance and rebuilds modifiers on it)"
  - phase: 07-data-fixes
    provides: "07-09 same-reference principle for HeroAttribute (#06-17-1) and its in-place loadState pattern"
  - phase: 06-unit-tests
    provides: "D-44 file-level three-step gate and the existing hero attribute/equipment/saveLoad suites"
provides:
  - "HeroAttribute.deleteModifierByIndex delegates to deleteModifier (single bookkeeping implementation), returns the removed modifier, and deletes nothing on -1/out-of-range (WR-05 closed, Q2=C)"
  - "Out-of-range/negative index is now deterministic 'delete nothing' instead of the old splice index semantics that silently removed the tail modifier (A6 new boundary semantics)"
  - "HeroEquipment.loadState wraps the re-equip loop in the existing replay.disable()/replay.revert() channel with try/finally, so loading equipment state no longer emits Equip/Unequip replay commands (WR-06 closed, Q3=A)"
  - "compareEquip locates the deletion target on the clone by object (the clone's own same-slot modifier) and deletes nothing when the base-attribute index is -1 or the clone slot is out of range (Q4 (i) closed)"
  - "IEquipmentStateSave / IEquipmentState carry a non-behavioral contract note: the equipment's own value/percentage tables are the single source of truth, the save persists those two tables, loadState rebuilds the equipment modifiers from them, and runtime changes must go through the equipment rather than its modifiers (WR-04 ruled design-as-is, Q1=C)"
  - "saveLoad.test.ts IN-02 case aligned to the ba60ef9 contract: an empty save resets the uid counter to 0 (observable as the next add() returning 0) and emits no code 58; the remaining reachability of code 58 is documented in-case (IN-02 closed, test-only)"
affects: [07-data-fixes, data-base-hero, data-state, replay-routing, render-side-holders]

actuals:
  tokens: 4074
  tasks: 5
  commits: 5
  plan_head_before: 7c04ed4a582151855c64df6dd891bd744e81bd57

tech-stack:
  added: []
  patterns:
    - "One deletion path per operation: the index-based API delegates to the reference-based API so bookkeeping (unbind + modifierName/modifierNosave cleanup + dirty recompute) has exactly one implementation"
    - "Boundary indices are explicit no-ops: -1 / out-of-range returns null and mutates nothing, replacing the old splice(index, 1) tail-deletion semantics"
    - "Read-only operations open a replay-disable window around any code path that would otherwise record: loadState reuses the same disable()/revert() channel as equip(), guarded by try/finally"
    - "Clone-side mutation resolves its target by object on the clone itself (never by an index computed on the source), because clone() rebuilds modifier arrays in source order but with new objects and without modifierName"
    - "Regression fixtures for suppression must model the gating semantics of the collaborator: a plain vi.fn() route cannot observe a disabled window, so the replay stub replicates the disabled counter and records only commands that actually land"

key-files:
  created: []
  modified:
    - packages-user/data-base/src/hero/attribute.ts
    - packages-user/data-base/src/hero/types.ts
    - packages-user/data-base/src/hero/equipment.ts
    - packages-user/data-base/src/hero/attribute.test.ts
    - packages-user/data-base/src/hero/equipment.test.ts
    - packages-user/data-base/src/hero/saveLoad.test.ts

key-decisions:
  - "Task 0 Q1=C (user adjudication 2026-09-17): WR-04 is design-as-is, not a defect — modifiers are a passive derived view, the equipment's own value/percentage are the source of truth; no production change, no assertion flip, the only landing is a non-behavioral contract note in types.ts"
  - "Task 0 Q2=C: deleteModifierByIndex takes the modifier out by index, delegates to deleteModifier(name, modifier) and returns the removed modifier; nothing changes on -1/out-of-range"
  - "Task 0 Q3=A: loadState reuses the existing replay.disable()/revert() channel with try/finally rather than extracting a recording-free helper"
  - "Task 0 Q4=B: only (i) the compareEquip index mismatch is fixed; (ii) EquipmentState.getModifiers() is not a defect (declared return type is Iterable) — not changed and not registered anywhere, not even as 'registered'"
  - "Without the outer disable window, a hero-only load (or a save without @system/replay) would append Equip/Unequip commands to the live replay — today only masked by the CoreState saveable order"

patterns-established:
  - "Delegating index-based APIs to their reference-based twin, with the removed object captured before delegation because the delegate returns void"

requirements-completed: [FIX-01]

coverage:
  - id: C1
    description: "WR-05 (Q2=C): deleteModifierByIndex delegates to deleteModifier and returns the removed modifier; after deletion iterateModifiers() no longer yields it, getModifierIndex() returns -1, getFinalAttribute() is recomputed, the modifier can be re-attached without code 108, its modifierNosave entry is cleared, and -1/out-of-range returns null while deleting nothing"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/attribute.test.ts#HeroAttribute modifier management (removes a modifier by index from the iterator and the final attribute / allows an index-deleted modifier to be attached again / keeps every modifier when the index is out of range / clears the save flag of an index-deleted modifier); existing 'removes modifiers by reference and by index' kept verbatim"
        status: pass
    human_judgment: false
  - id: C2
    description: "WR-06 (Q3=A): HeroEquipment.loadState emits no replay command, disable/revert calls are balanced (pairing), the equipped mapping and bonus are restored from the save point, and normal equip/unequip recording still works after a load"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/equipment.test.ts#HeroEquipment replay isolation on load (suppresses replay recording while loading the equipment state / keeps recording equip and unequip after loading)"
        status: pass
    human_judgment: false
  - id: C3
    description: "Q4 (i): compareEquip resolves the deletion target on the clone by object and deletes nothing when the base-attribute index is -1; the rebuilt-modifier path (index -1, two same-name modifiers) is constructed explicitly and its trigger mechanism is asserted"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/equipment.test.ts#HeroEquipment compare and guards (keeps foreign modifiers when the equipped instance was rebuilt); existing 'diffs the final attributes of two equipment instances' kept verbatim"
        status: pass
    human_judgment: false
  - id: C4
    description: "IN-02 (test-only): loading { equipments: [] } resets the uid counter (the following add() returns 0) and does not emit code 58 — the contract of ba60ef9 is anchored by test"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#HeroEquipsStore save and load round trips (resets the uid counter when the save has no equipment)"
        status: pass
    human_judgment: false
  - id: C5
    description: "WR-04 (Q1=C, design-as-is): the source-of-truth contract is documented at the IEquipmentStateSave / IEquipmentState interface source; no behavior change, no assertion flip"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#EquipmentState save and load round trips (three compression cases + value modifier cases) unchanged and passing; repo-wide pnpm test:ci 0 failed"
        status: pass
    human_judgment: false

# Metrics
duration: 18min
completed: 2026-09-17
status: complete
---

# Phase 7 Plan 12: Equipment/attribute save correctness (WR-05 / WR-06 / compareEquip index + IN-02 test alignment) Summary

**修饰器删除收敛为单一簿记（`deleteModifierByIndex` 委托 `deleteModifier` + 越界不删除）、英雄装备读档不再向活录像追加 `Equip`/`Unequip`（既有 `disable`/`revert` 通道 + `try/finally`）、`compareEquip` 不再跨对象拼接索引删除克隆侧修饰器，并把 IN-02（空存档重置 `nextUid`）以测试对齐 `ba60ef9` 的新契约；`WR-04` 经用户裁决为「设计如此」，全程零生产改动、零断言翻转（仅 `types.ts` 一条非行为性契约注释），`EquipmentState.getModifiers()` 经裁决为非缺陷、不修且不登记。**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-09-17T07:51Z（本地 15:51，执行前基线重录）
- **Completed:** 2026-09-17T08:09Z（本地 16:09）
- **Tasks:** 5 个执行任务（Task 0 已由用户于 2026-09-17 裁决并写入 `<record>`，执行者核对后直接进入 Task 1，未重复询问）
- **Files modified:** 6（生产 3 + 测试 3；无新建文件、无新依赖、无删除文件）
- **Diff size:** +235 / −16（`git diff --numstat 7c04ed4..HEAD`）；实测 `actuals.tokens = 4074`（diff 字符数 / 4），相对 `estimate.tokens = 56000` 偏低 13.7×（与 07-11 的 62000 → 7837 同量级的估计偏高，供后续校准）

## Task Commits

`git rev-list --count 7c04ed4..HEAD` = **5**（5 个任务提交 + 本 SUMMARY 的元数据提交；`plan_head_before` = `7c04ed4a582151855c64df6dd891bd744e81bd57`）。全部为**普通提交、钩子生效**，未使用 `--no-verify`：

1. **Task 1: IN-02 测试契约对齐（测试专用）** — `b99d040` (test)
2. **Task 2a: WR-04 非行为性契约注释（零行为变更）** — `762bf2e` (docs)
3. **Task 2b: WR-05 `deleteModifierByIndex` 委托 `deleteModifier`** — `ab18aa3` (fix)
4. **Task 3: WR-06 `loadState` 的 disable/revert 包裹** — `d8fb6f0` (fix)
5. **Task 4: compareEquip 克隆侧按对象定位删除目标（Q4 仅 (i)）** — `3e68880` (fix)
6. **Plan metadata:** 本 SUMMARY 的 `docs(07-12): …` 提交 (docs)

**原子提交口径（D-13）**：Task 2 拆为「WR-04 契约注释 `docs` 提交」+「WR-05 `fix` 提交」两条（两者都改 `types.ts`：先落纯注释的 `docs` 提交，再补 `deleteModifierByIndex` 的 jsDoc 同步与 WR-05 实现）。IN-02 的测试对齐单独 `test(...)` 提交，不与任何根因混提。

提交清单（`git log --name-only 7c04ed4..HEAD`）：6 个文件全部落在 frontmatter `files_modified` 内，**零计划外文件**。`packages-user/client-base/src/types.ts`、`packages-user/client-modules/src/types.ts` 的并发 WIP 未被触碰、未被暂存、未被提交（见 Issues 2）。

## Files Created/Modified

- `packages-user/data-base/src/hero/attribute.ts` — `deleteModifierByIndex` 方法体改为「`arr[index]` 取出 → 为 `undefined` 返回 `null` → 委托 `this.deleteModifier(name, modifier)` → 返回该修饰器」；`addModifier`/`deleteModifier`/`clone()`/`iterateModifiers`/`getModifierIndex`/`markDirty` **逐字未改**（+6/−3）
- `packages-user/data-base/src/hero/types.ts` — (a) `deleteModifierByIndex` 的 jsDoc 写明「与 `deleteModifier` 共用同一份簿记、修饰器被解绑、越界/为负返回 `null` 且不删除任何修饰器」；(b) `IEquipmentStateSave` / `IEquipmentState` 的接口 jsDoc 补写 WR-04 的事实源契约（纯注释，零行为变更）（+12/−1）
- `packages-user/data-base/src/hero/equipment.ts` — (a) `loadState` 用 `replay.disable()` + `try { 重新装备循环 } finally { replay.revert() }` 包裹；(b) `compareEquip` 的克隆准备循环改为「原属性索引为负 → `continue`；否则取 `[...clone.getModifiers(name)][index]`，为 `undefined` → `continue`；最后 `clone.deleteModifier(name, cloned)`」（+16/−3）
- `packages-user/data-base/src/hero/attribute.test.ts` — WR-05 新增 4 条：按索引删除后的迭代器/索引/final 一致性、被删修饰器可重新挂载（不触发码 108）、越界与负索引返回 `null` 且不删除、`modifierNosave` 清理（+54/−0；既有「按引用与按索引删除」用例逐字保留）
- `packages-user/data-base/src/hero/equipment.test.ts` — 夹具：`TestEnv` 增加 `replaySystem`，新增 `ReplayRouteStub`/`ReplaySystemStub` 接口与 `createReplaySystem()`（按禁用计数复现录像数组的丢弃语义），引入 `ReplayCode` 与 `SaveCompression`、`ValueModifier`；新增 3 条：读档不写录像 + `disable`/`revert` 配对平衡、读档后仍记录 `Unequip`/`Equip`、`compareEquip` 重建路径不误删同名旁的修饰器（+140/−6；既有对差用例与 `it.skip`（码 147）逐字未动）
- `packages-user/data-base/src/hero/saveLoad.test.ts` — IN-02 用例由「空存档 → 出现码 58」改写为「空存档 → 随后 `add(10)` 返回 0 且不出现码 58」，并补夹具与码 58 覆盖变化的单行注释；**WR-04 相关断言（`:229-245`、`:350-403`）逐字未改**（+7/−3）

## Decisions Made

Task 0 的四条用户裁决（`07-12-PLAN.md` 的 `<record>`，提交 `7c04ed4`）逐条落地，无自行改选：

| 裁决 | 落地位置 | 可观测证据 |
| --- | --- | --- |
| **Q1=C 设计如此（WR-04 不修）** | `types.ts` 的 `IEquipmentStateSave` / `IEquipmentState` 契约注释（`762bf2e`）；**无生产代码改动** | `saveLoad.test.ts:229-245`、`:350-403` 逐字未改且通过；`git diff 7c04ed4..HEAD` 中不存在任何 WR-04 相关断言的改动 |
| **Q2=C 委托 `deleteModifier`** | `attribute.ts` 的 `deleteModifierByIndex`（`ab18aa3`） | `attribute.test.ts` 4 条新断言（迭代器/索引/final/重挂/越过界/存盘开关） |
| **Q3=A 复用 `disable`/`revert`** | `equipment.ts` 的 `loadState`（`d8fb6f0`），`try/finally` 保证 `revert` 必达 | `equipment.test.ts` 2 条（读档期录像指令为空 + 配对平衡；读档后记录仍在） |
| **Q4=B 仅修 (i)** | `equipment.ts` 的 `compareEquip`（`3e68880`）；**(ii) `getModifiers()` 未改、未登记** | `equipment.test.ts` 的重建路径回归（含 `getModifierIndex(rebuilt) === -1` 的触发机制断言） |

## Findings ↔ Ledger / Registry 对照（缺口登记，Task 5(3)）

| 条目 | 结论（引用裁决） | 锚点 |
| --- | --- | --- |
| **WR-04** 装备存档源（活修饰器值 vs 定义差异） | **设计如此 / 非缺陷（Q1=C，2026-09-17）**：修饰器是**被动的派生视图**，装备自身属性（`value`/`percentage`）是**事实源**；存档持久化的正是这两个表（无压缩档全量、压缩档只存与定义的差异），`loadState` 由它们 `rebuildModifiers()` 重建修饰器；**跨读档丢失修饰器引用属预期**；运行时若要改变装备加成必须**经装备自身**，不得通过修改它的修饰器。**本计划未修改任何代码、未翻转任何断言**；唯一落笔是 `types.ts` 的非行为性契约注释 | `762bf2e`（docs） |
| **WR-05** `deleteModifierByIndex` 簿记不全 | **已闭合（Q2=C 委托）**：删除簿记只有一份实现（解绑 + `modifierName`/`modifierNosave` 清理 + `markDirty`）；返回被删修饰器 | `ab18aa3` |
| **WR-06** `loadState` 经 `equip()` 追加录像指令 | **已闭合（Q3=A `disable`/`revert` 包裹）**：读档期 `route.add` 未被调用、配对平衡、正常记录能力不变 | `d8fb6f0` |
| **compareEquip 索引错配（Q4 (i)）** | **已修（Q4 仅修 (i)）**：删除目标在克隆属性上按对象取得；原属性索引为 `-1` / 槽位越界时不删除任何修饰器 | `3e68880` |
| **`EquipmentState.getModifiers()` 返回内部数组（Q4 (ii)）** | **非缺陷（Q4 裁决）：不修，且不登记**——其声明返回类型为 `Iterable<[...]>`（`types.ts:663`），调用方无法经该类型转成数组或改动内部数组。**本计划未修改它，也未把它写入任何 known-issues / 登记列表（连「已登记」都不写）** | 不适用 |
| **IN-02** 空存档不重置 `nextUid` | **已闭合（测试专用）**：测试契约对齐用户生产修复 `ba60ef9`，**生产逻辑零改动** | `b99d040` |
| **IN-04 / IN-05** | **保留在册，本轮不修**（不在本轮清单，只登记不修） | 未修 |
| `A6` 越界/负索引语义 | **新增边界语义**（非既有断言改写）：`arr[index]` 取代 `arr.splice(index, 1)` 后，越界/为负返回 `null` 且不删除任何修饰器（旧实现会静默删掉该属性的末尾修饰器） | `ab18aa3` + `attribute.test.ts` 新用例 |

`WINDOWS.md`：WR-05 / WR-06 / compareEquip 均无入账 id，按 D-14 **只登记对照、不新建条目、不执行 `fixed`/`waive`**；实测 `git status --short -- .planning/WINDOWS.md .planning/ROADMAP.md` 为空。

### 断言变更清单（A5 唯一授权；逐条「旧 → 新 → 理由」）

| 文件/用例 | 旧断言 | 新断言 | 理由 |
| --- | --- | --- | --- |
| `saveLoad.test.ts:446-458`（`warns code 58 when the max equipment uid cannot be found` → `resets the uid counter when the save has no equipment`） | 夹具为空环境；`logger.catch(loadState({ equipments: [] }))` 后 `expect(result.info.map(i => i.code)).toContain(58)` | 夹具注册 `createEquipItem(10, …)`；断言 `expect(env.store.add(10)).toBe(0)` **且** `expect(...codes).not.toContain(58)` | 生产已在 `ba60ef9` 修复（空存档 → `nextUid = 0`，不再发码 58），旧用例编码的是被修复前的契约且**当前为 RED**；`add` 返回 0 是「计数器重置」的唯一可观测后果 |

- **本轮无 WR-04 断言翻转**：`saveLoad.test.ts:229-245`（`roundTripPercentageModifier`）与 `:350-403`（三档压缩下修改后读回定义值）**逐字未改**（`git diff 7c04ed4..HEAD -- packages-user/data-base/src/hero/saveLoad.test.ts` 仅含上述 IN-02 块）。
- **A6 的越界断言属新增**（`attribute.test.ts` 的 `keeps every modifier when the index is out of range`），不是对既有断言的改写；既有 `attribute.test.ts:189-204` 的按引用/按索引删除用例逐字保留并通过。
- **未新增任何 `it.skip`**（`git diff 7c04ed4..HEAD | Select-String "^\+.*it\.skip|^\+.*test\.skip"` 为空）；跳过项仍仅 `equipment.test.ts:306`（码 147，D-06）一条。
- **无既有用例被删除**：`git diff --diff-filter=D --name-only 7c04ed4..HEAD` 为空。

### 契约 / 覆盖变化（IN-02 的副产物）

`logger.error(58)` 分支（`equipStore.ts:300-309`）现在只剩「**非空** `state.equipments` 但 `maxBy` 仍返回 `undefined`（畸形/含无效条目）」的防御路径可达；**空存档不再触发码 58**。该结论已在使用例内注释登记（并写明该分支属 `equipStore.ts` 的现有实现、保持原样，防止后续被误当死代码删除），本 SUMMARY 复述同一结论。

**Phase 7 验证已失效**：`07-VERIFICATION.md`（`2026-09-16T06:04:11Z`）已因 07-09 与本轮 07-10..07-14 失效。本计划执行完毕后**必须重跑 `/gsd-verify-work`（或 `gsd-verify-work 7`）**重新出具验证结论。

## Deviations from Plan

### Auto-fixed / 计划口径落地偏差

**1. [Rule 2 - 计划示例与 dev.md 冲突] `equipment.test.ts` 的录像桩改用接口声明**

- **Found during:** Task 3(2)
- **Issue:** 计划 `<action>`(2) 给出 `TestEnv.replaySystem` 的**内联对象类型**示例（`replaySystem: { route: { add: … }; disable: …; revert: … }`）。`dev.md:97` 明确「当任何时候必须出现对象类型的时候，单独声明一个 `interface`，不得出现直接的对象类型」（AGENTS.md 要求遵循 dev.md，优先于计划示例）。
- **Fix:** 声明 `ReplayRouteStub` / `ReplaySystemStub` 两个接口，`TestEnv.replaySystem: ReplaySystemStub`；`createEnv` 的 `as never` 单次断言写法与其余夹具未变。
- **Files modified:** `packages-user/data-base/src/hero/equipment.test.ts`
- **Committed in:** `d8fb6f0`

**2. [Rule 1 - 计划测试配方不可观测] WR-06 的「`route.add` 一次也没被调用」改为「有效录像指令为空」+ 桩复现禁用语义**

- **Found during:** Task 3(3)(a) 首轮用例
- **Issue:** 计划要求断言 `expect(env.replaySystem.route.add).not.toHaveBeenCalled()`。但 `route.add` 是 `vi.fn()`，`vi` 的调用记录**不区分**调用是否被生产侧抑制；真正的抑制发生在 `ReplayArray` 内部（`disabled > 0` 时 `add` 提前返回，`array.ts:890-897`）。因此 `vi.fn()` 桩**无法观测**「读档不写录像」——按原配方首轮实测该断言失败（`expected "vi.fn()" to not be called at all, but actually been called 1 times`），而生产行为其实是正确的（禁用窗口生效，指令被真实录像丢弃）。
- **Fix:** 让桩复现协作者的抑制语义——`createReplaySystem()` 维护 `disabled` 计数，`route.add` 只在 `disabled === 0` 时把指令记入 `route.commands`；断言改为 `expect(env.replaySystem.route.commands).toEqual([])` 并保留 `disable`/`revert` 调用次数相等的配对断言。
- **Verification:** 反向验证有效（见 Reverse-Verification 第 1 行）：把 `equipment.ts` 回退到 `7c04ed4` 后该用例确定性失败，泄漏指令为 `[[6, [0]]]`（`ReplayCode.Equip`）；修复后通过。
- **Files modified:** `packages-user/data-base/src/hero/equipment.test.ts`
- **Committed in:** `d8fb6f0`

**3. [Rule 1 - 计划断言不可达] Task 4 的回归改为锚定「触发机制 + 裁定后的差值契约」，不采用「与未经重建时一致」**

- **Found during:** Task 4(4) 推导与反向验证
- **Issue:** 计划 `<action>`(4) 要求「断言逐属性对差值与**未**经重建时一致」。按 Q4 的裁定（原属性索引为 `-1` 时**不删除任何修饰器**），两者**必然不同且都正确**：未经重建时现役装备的修饰器可在原属性上定位并被删除（差值 = 斧加成 − 现役剑加成 = **7**），经重建后无法定位因而不删除（差值 = 斧加成 = **12**，现役加成同时存在于克隆基线与活值基线中相互抵消）。"一致" 在该裁定下不可达，属计划 `<action>` 的推导错误（`<record>` 的裁定与 `<verify>` 的门槛不受影响）。
- **Fix:** 回归用例显式构造「≥2 个同名修饰器（英雄侧 `ValueModifier(7, -1)` + 现役装备同名加成）」并使现役装备经一次 `store.loadState` 往返触发 `rebuildModifiers()`；用例断言三件事：(a) **触发机制证据**——重建后的修饰器对象 `env.attribute.getModifierIndex(rebuilt) === -1`；(b) **未经重建时的既有契约**——`compareEquip(...).atk === 7`（现役加成被正确扣除）；(c) **裁定后的契约**——重建路径 `diff.atk === 12`、`diff.def === -3`（不删除任何修饰器）。用例注释写明触发机制。
- **Verification:** 反向验证（见 Reverse-Verification 第 2 行）确定该用例在旧实现下失败（`expected 5 to be 12`）。
- **Files modified:** `packages-user/data-base/src/hero/equipment.test.ts`
- **Committed in:** `3e68880`

**4. [如实登记 - 非偏差但需说明] Q4 (i) 在 A6 落地后属防御性显式化**

- **Found during:** Task 4 反向验证（单独回退 Task 4 改动时用例仍通过）
- **Issue:** WR-05 的 A6 语义（`deleteModifierByIndex` 越界不删除）先于 Task 4 落地后，旧的 `clone.deleteModifierByIndex(name, -1)` 已**不会**再误删（退化为 no-op），故 Q4 (i) 在本轮**不再有独立的行为可观测差异**；其价值是「不依赖 A6 语义的显式契约」——删除目标在克隆属性上按对象取得，`-1`/越界时明确不删除。
- **处置:** 仍按 Q4=B 裁定落地实现（`3e68880`）；回归用例锚定触发前置条件与裁定后的差值契约，并在 Reverse-Verification 中给出「同时回退 A6 + Task 4」时的确定性失败证据（`expected 5 to be 12`）。**未**因此删弱任何断言。
- **Files modified:** `packages-user/data-base/src/hero/equipment.ts`、`equipment.test.ts`

### 计划未落地的声明项

- **`ROADMAP.md` / `STATE.md` 未由本计划更新**：本次执行上下文明确「orchestrator owns those」。
- **`WINDOWS.md` 未改动**（D-14 + Task 5 验收项：不新建、不 `fixed`/`waive`）。
- **未新增依赖、未新建源码文件、未使用 `import type`、未出现连续 `as` 断言**（新增行仅 1 处单次 `as IHeroModifier<THero[K]> | undefined`，沿用旧实现的断言写法）。
- **`hero/equipStore.ts` 零改动**（IN-02 的生产逻辑保持 `ba60ef9` 基线；WR-04 与 `getModifiers()` 按裁决不修）。

## Issues Encountered

**1. `pnpm test:ci` 基线与计划记载不一致（D-12 要求重录）**

| 时点 | 文件 | 通过 | 失败 | 跳过 |
| --- | --- | --- | --- | --- |
| 执行前实测（本会话重录） | 66 | **721** | **1**（IN-02，`saveLoad.test.ts:447-457`） | 1 |
| 执行后（本计划完成态） | 66 | **729** | **0** | 1 |
| `07-12-PLAN.md` 记载（2026-09-16） | 66 | 690 | 0 | 1 |

- 计划 `<objective>` 记载的「当日全量基线」为 689 通过 / 1 失败 / 1 跳过；实测 **721 通过 / 1 失败 / 1 跳过**（通过数多 32，属 07-11 落地后的累积增长；**失败条目一致**，正是 Task 1 的预期输入）。
- 执行后 **0 失败**、通过数 **+8**：其中 1 条为 IN-02 由红转绿，7 条为本轮新增用例（Task 2: 4、Task 3: 2、Task 4: 1 —— Task 1 为改写，条数不变）。跳过项仍仅 `equipment.test.ts:306`（码 147）。

**2. 用户并发 WIP 在同一工作树继续演进（本计划零触碰）**

- 执行期间工作树中始终存在 `packages-user/client-base/src/types.ts`、`packages-user/client-modules/src/types.ts` 的未暂存改动（属「存档系统挪至渲染端」的在制品）。本计划 5 个提交的 `git log --name-only` 中**不含**这两个文件；`git status --short` 在每个提交后仅剩这两个文件为 ` M`。
- `vue-tsc --noEmit` 整仓 27 条错误全部来自该并发 WIP / legacy 渲染端，与本计划 6 个改动文件无关（文件级过滤 **0 命中**，见 D-44 表）。

**3. 执行中发现、未修（out of scope，不在任何登记列表）：`saveLoad.test.ts` 存在既有编码损坏**

- **现象:** `packages-user/data-base/src/hero/saveLoad.test.ts` 在 HEAD（`7c04ed4`）即含 **117 个 U+FFFD 替换字符**（`EF BF BD` 字节），集中在中文注释中（如 `// 验证存档不含任何裁…` 处）；同目录其余文件均为 0 个。`git status` 对该文件在执行前为 clean，故该损坏**已提交、非本计划引入**。
- **处置:** 本计划的改动仅涉及 IN-02 用例块，改写后的注释为干净的 UTF-8；为守住范围边界**未**批量修复其余损坏注释（属既有缺陷、不在 15 项清单与 `files_modified` 语义内）。**未**将其写入 `WINDOWS.md` 或任何登记列表（避免超出 D-14 的登记口径）。建议后续单开一个清理计划处理该文件的注释编码。

**4. 嵌套的 disable/revert 计数（设计一致，非缺陷）**

- `HeroEquipment.loadState` 的包裹窗口内会再调用 `equip()`，后者自身也有 `disable()`/`revert()` 配对，故读档一次的 `disable`/`revert` 调用数为 2/2（外层 1 + 内层 1）。`ReplayArray` 以计数（`disabled++` / `disabled--`）实现，嵌套配对平衡，且内层 `revert` 后 `route.add(Equip)` 仍处于外层禁用窗口内被丢弃——这正是 Q3=A 期望的效果。回归用例按计划断言「次数**相等**」而非固定值 1。

## User Setup Required

None - no external service configuration required.

## D-44 文件级门禁结果

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| ESLint（6 个改动文件） | `pnpm exec eslint --fix <file>` → `pnpm exec eslint <file>`（逐个执行，Task 1/2/3/4 后各一次，Task 5 复跑全部） | **0 errors**（6/6 文件 `--fix` 与检查退出码均为 0；`--fix` 后工作树无新增改动，说明提交版本即已合规） |
| 类型（文件级） | `pnpm exec vue-tsc --noEmit` → 过滤 6 个改动文件路径（**未**以整仓退出码判定，按 06-RESEARCH Pitfall 4） | **0 命中**（整仓 27 条错误全部属并发 WIP 的 `client-*` / legacy 渲染端） |
| 全量套件 | `pnpm test:ci`（执行前 + 执行后） | 66 文件；**721 → 729 通过**（+8）、**1 → 0 失败**、跳过仍 **1**（`equipment.test.ts:306` 码 147） |
| 聚焦套件 | `pnpm exec vitest run packages-user/data-base/src/hero/` | **113 通过 / 1 跳过**（11 文件；`saveLoad.test.ts` 单文件 27/27、`equipment.test.ts` 16 通过 + 1 跳过、`attribute.test.ts` 全通过） |

一处执行期修正：Task 4 首版在 `clone.deleteModifier(name, cloned)` 上加了 `// @ts-expect-error 泛型无法推导`，`vue-tsc` 报 `TS2578 Unused '@ts-expect-error' directive`（该调用实际可正常推导）——已删除该指令，复跑类型门禁 0 命中。

## Reverse-Verification（用例有效性证据）

把生产实现临时回退到 `7c04ed4` 的对应文件，实验后从临时副本 / `git checkout -- <file>` 精确恢复（工作树复原已验证：`git status --short` 仅剩并发 WIP 两个 `client-*` 文件）：

| 反向实验 | 期望 | 实测 |
| --- | --- | --- |
| 回退 `hero/equipment.ts` 的 `loadState`（保留 Task 4 之后无、即 `7c04ed4` 版本） | WR-06 用例失败 | **1 failed**：`expected [ [ 6, [ +0 ] ] ] to deeply equal []`（泄漏一条 `ReplayCode.Equip`），其余 14 通过 |
| 同时回退 `hero/attribute.ts` 的 `deleteModifierByIndex`（恢复 `splice`）与 `hero/equipment.ts` 的 `compareEquip`（恢复 `deleteModifierByIndex`） | Task 2 与 Task 4 的用例失败 | **1 failed**：`expected 5 to be 12`（`git diff --name-only 7c04ed4..HEAD` 的原有断言与新用例均复现原始缺陷组合），`attribute.test.ts` 的 4 条新用例在同轮中一并转红 |

恢复后：`pnpm exec vitest run packages-user/data-base/src/hero/` = **113 通过 / 1 跳过**；`pnpm test:ci` = **729 通过 / 0 失败 / 1 跳过**。**未**执行任何 `--no-verify`、未使用 `git add -A/-a`、未使用 `git stash`/`git clean`/`git reset --hard`；`git checkout -- <file>` 仅用于上述两个临时反向实验的显式恢复。

## Known Stubs

None —— 本计划未引入硬编码空值、占位文案或未接线的数据源；`git diff 7c04ed4..HEAD` 中零新增 `TODO`/`FIXME`/`it.skip`。

## Threat Model Disposition

无新增威胁面（无新端点、无鉴权路径、无文件访问、无依赖安装）。计划 `<threat_model>` 的缓解项逐条落地：

| Threat ID | 缓解落地 | 证据 |
| --- | --- | --- |
| T-7-31 `EquipmentState` 存档源 / `getModifiers()`（low / accept） | **Q1 裁决：设计如此，非缺陷**——`types.ts` 仅补非行为性契约注释 | `762bf2e`；`equipStore.ts` 与 `getModifiers()` 零改动 |
| T-7-32 `deleteModifierByIndex` 簿记（medium / mitigate） | Q2=C 委托 `deleteModifier`（单一簿记）+ 越界/负索引不删除 | `ab18aa3`；`attribute.test.ts` 4 条新用例 |
| T-7-33 `compareEquip` 索引错配（medium / mitigate） | Q4 (i)：克隆侧按对象定位；`-1`/越界不删除；回归显式构造重建后的 `-1` 路径 | `3e68880`；`equipment.test.ts` 的 `keeps foreign modifiers when the equipped instance was rebuilt` |
| T-7-34 `loadState` 经 `equip()` 追加指令（medium / mitigate） | Q3=A：`disable()`/`revert()` 包裹 + `try/finally`；断言读档期录像指令为空 | `d8fb6f0`；`equipment.test.ts` 2 条 |
| T-7-35 `disable`/`revert` 配对失衡（low / mitigate） | `try/finally` 保证 `revert` 必达；用例断言两计数相等 | `equipment.ts:337-354`；`disableCount === revertCount` 断言 |
| T-7-36 空存档 uid 计数器契约（low / mitigate） | Task 1（测试专用）锚定「空存档 → 随后 `add` 发号 0」且不产生码 58；码 58 剩余可达条件已在用例注释与 SUMMARY 登记 | `b99d040`；`equipStore.ts` 零改动 |
| T-7-SC 依赖安装（high / mitigate） | 未新增依赖、未改 `package.json`/`pnpm-lock.yaml` | `git status --short -- package.json pnpm-lock.yaml` 为空 |

## Next Phase Readiness

- 装备/属性子系统的三条存档正确性缺口（WR-05 / WR-06 / compareEquip 索引）已闭合，WR-04 按裁决登记为「设计如此」；`IN-02` 以测试对齐消红。`hero/equipStore.ts` 与 `packages-user/data-common` 本轮零改动。
- **待办（非本计划）：** ① 重跑 `/gsd-verify-work 7` 重新出具 Phase 7 验证结论（现结论已失效）；② orchestrator 同步 `ROADMAP.md` 的 Phase 7 计划数/Wave 列表与 `STATE.md`；③ `IN-04`/`IN-05` 保留在册，未修；④ `saveLoad.test.ts` 的既有注释编码损坏（117 个 U+FFFD）建议单开清理计划。

---

## Self-Check: PASSED

- FOUND: `b99d040`、`762bf2e`、`ab18aa3`、`d8fb6f0`、`3e68880`（`git log --oneline 7c04ed4..HEAD`；`git rev-list --count 7c04ed4..HEAD` = 5）
- FOUND: 6 个改动文件（`git log --name-only 7c04ed4..HEAD`），全部在 frontmatter `files_modified` 内
- VERIFIED: `pnpm test:ci` = 66 文件 / **729 通过 / 0 失败 / 1 跳过**（仅 `equipment.test.ts:306` 码 147）
- VERIFIED: `pnpm exec eslint` 6 文件 0 错误；`vue-tsc --noEmit` 对 6 文件 0 命中
- VERIFIED: `git status --short -- packages-user/data-base/src/hero/equipStore.ts packages-user/data-common .planning/WINDOWS.md .planning/ROADMAP.md .planning/STATE.md` 为空
- VERIFIED: `git diff --diff-filter=D --name-only 7c04ed4..HEAD` 为空；`git diff 7c04ed4..HEAD` 中零新增 `it.skip`
- VERIFIED: 反向验证两条（WR-06 泄漏 `[[6,[0]]]`；WR-05+Q4 组合 `expected 5 to be 12`），恢复后全绿

---

*Phase: 07-data-fixes*
*Completed: 2026-09-17*
