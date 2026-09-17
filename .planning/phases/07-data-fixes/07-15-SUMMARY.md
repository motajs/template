---
phase: 07-data-fixes
plan: 15
subsystem: data-layer
tags: [review-recheck, gap-closure, cr-01, wr-01, wr-02, wr-03, q1-a, q2-a, q3-a, q4-a, hero-equipment, hero-attribute, replay-array, d-09, d-12, d-13, d-14, phase-07-reopen]

requires:
  - phase: 07-data-fixes
    provides: "07-14 phase-closure baseline (66 files / 737 passed / 0 failed / 1 skipped) and D-06's retained code-147 skip"
  - phase: 07-data-fixes
    provides: "07-REVIEW-recheck.md's CR-01 / WR-01 / WR-02 / WR-03 findings and 07-VERIFICATION.md's `### Review-Recheck Gaps` section (recorded 2026-09-17) that reopened Phase 7 for plan 07-15"
  - phase: 06-unit-tests
    provides: "D-44 file-level three-step gate (eslint / file-filtered vue-tsc / pnpm test:ci)"
provides:
  - "CR-01 closed per Q1=A: compareEquip clones each compared modifier before adding it to the comparison clone and deletes the same clone objects afterwards, so a currently-equipped compared item contributes (contract -7 / +7) and no warning 108 fires; the live attribute's bound modifiers are never added to the clone and never unbound"
  - "WR-01 closed per Q2=A: normalizeParam returns null for an unencodable param, matching its own jsDoc and normalizeParamList's documented discard semantics; the command's param count, the bytes actually written and the param cursor stay consistent so later commands keep their byte offsets; warning 148 still fires"
  - "WR-02 closed per Q3=A: both expand-multiplier checks tighten from < 1 to <= 1, matching warning 149's own text; an exact multiplier of 1 warns twice and falls back to the existing factor 2, so expansion always terminates"
  - "WR-03 closed per Q4=A: clone() restores the addModifier bookkeeping (bindAttribute + modifierName + source save-flag mirroring + recalculateAttribute), making cloned attributes enumerable, indexable, persistable and self-notifying"
  - "5 new correct-expectation it cases (CR-01 x1, WR-01 x1, WR-02 x1, WR-03 x2); no assertion weakened, no it.skip added, no existing jsDoc/comment modified"
  - "BLOCKER (user-owned, escalated): equipment.test.ts's replay stub still models the pre-`a2a8e6e` API (`route` instead of `array`), so 13 of its cases already fail at baseline and the new CR-01 case cannot run green until that stub is aligned; this plan deliberately did not touch it (hard rule 2/5)"
affects: [07-data-fixes, phase-07-verification, packages-user/data-base, packages-user/data-common]

actuals:
  tokens: 2990
  tasks: 5
  commits: 4
  plan_head_before: 19ad1ea91ab7a69b0b65020d49bbe65ab30ec301

tech-stack:
  added: []
  patterns:
    - "A derivation clone must own its own copies: never re-add another registry's live-bound objects to it, and delete exactly the objects that were added"
    - "A fallback branch must obey the method's own jsDoc and the sibling path's documented semantics (discard) rather than inventing a record that the writer and the cursor-advance path disagree about"
    - "A validator's accepted range must match the operator-facing text of its own warning code"
    - "A cloned aggregate must restore the same bookkeeping its insertion path establishes, otherwise every consumer that reads that bookkeeping (enumerate / index / persist / notify) silently degrades"
    - "A regression case is trusted only after reverse-verification: run it against the pre-fix source (must fail), then against the fix (must pass)"

key-files:
  created: []
  modified:
    - packages-user/data-base/src/hero/equipment.ts
    - packages-user/data-base/src/hero/equipment.test.ts
    - packages-user/data-common/src/replay/array.ts
    - packages-user/data-common/src/replay/array.test.ts
    - packages-user/data-base/src/hero/attribute.ts
    - packages-user/data-base/src/hero/attribute.test.ts

key-decisions:
  - "Task 0 Q1 = A (CR-01, user 2026-09-17): clone-then-add with same-clone deletion in compareEquip; the live attribute's already-bound modifiers never enter the comparison clone and are never unbound (option B's 'temporarily unbound' window is excluded); return type, both 146 early-returns and the equipped-slot removal block are byte-preserved"
  - "Task 0 Q2 = A (WR-01): the unencodable-param fallback returns null (discard) — consistent with the method's own jsDoc and with normalizeParamList's 'discarded items leave no placeholder' note; a type-0 placeholder (option B) was excluded because it would require rewriting two existing comments and would decode an unknown type as `false`"
  - "Task 0 Q3 = A (WR-02): both multipliers validate `<= 1`; the unconfirmed degenerate configs other than an exact multiplier of 1 are explicitly NOT registered and NOT fixed"
  - "Task 0 Q4 = A (WR-03): all four bookkeeping items restored, including mirroring the source save flag; `cloneModifier: false` keeps its existing early-return semantics"
  - "Zero new production symbols: no public/protected/private method or field was added; only the local variables `copy` / `addedA` / `modifiersA` and the 5 case titles were pre-approved (AGENTS.md naming rule)"
  - "No WINDOWS.md entry is created and no fixed/waive is performed (D-14): none of the four review-recheck findings has a ledger id"
  - "The four Info findings (IN-01..IN-04) were fixed by the user directly (34ba9e8 / 219ac49 / 3a3a6ac / a2a8e6e); this plan touched none of their files"

patterns-established:
  - "Per-defect reverse-verification recorded in the SUMMARY, so a later verifier can see each new case fail before the fix and pass after it"
  - "A blocked witness is reported as an escalation with the root cause and the one-line remedy, never absorbed by weakening an assertion or by silently fixing the user's own file"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "CR-01 — a compared item that is currently equipped contributes to the diff: compareEquip(sword, axe, 0).atk === -7 and the symmetric call === +7, with no warning 108 and the live attribute's modifier index still non-negative and its final value unchanged"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/equipment.test.ts > diffs the final attributes when one compared item is currently equipped (commit 53f067a); reverse-verified against the pre-fix source"
        status: pass
      - kind: other
        ref: "the same case was run green once with the user's `a2a8e6e` stub drift aligned locally (not committed); with the committed harness it stays red because `ReplaySystemStub` has no `array` member — user-owned blocker, see Deviations"
        status: fail
    human_judgment: false
  - id: D2
    description: "WR-01 — an unencodable param is discarded consistently: warning 148 still fires, the command's param count is 0, get(0).params is [], the later command keeps its bytes, and the read stream returns [] then [20] with index 1 then 2"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts > drops the unencodable param and keeps the later commands aligned (commit a7c9f97); reverse-verified (count 1 before the fix)"
        status: pass
    human_judgment: false
  - id: D3
    description: "WR-02 — an exact expand multiplier of 1 is rejected: two code 149 warnings, fallback to factor 2, 15 appended steps complete and read back in order with stream index 15"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts > warns code 149 and still expands when an expand multiplier is exactly 1 (commit 49116c0); reverse-verified (no 149 emitted before the fix)"
        status: pass
    human_judgment: false
  - id: D4
    description: "WR-03 — a cloned attribute keeps its modifier bookkeeping: iterateModifiers enumerates, getModifierIndex locates, a cloned modifier's setValue recomputes the clone (109) without touching the source (105), saveState lists both names; and a source-unsavable modifier stays unsavable on the clone (saveState.modifiers length 0)"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/attribute.test.ts > keeps the modifier bookkeeping of cloned attributes / keeps the save-ability of cloned modifiers (commit bb19865); reverse-verified ([] and true before the fix)"
        status: pass
    human_judgment: false
  - id: D5
    description: "D-12/D-44 gates: eslint 0 errors on the six declared files; vue-tsc filtered by their relative paths 0 hits; only the six declared files appear in 19ad1ea..HEAD; no it.skip added; no existing jsDoc/comment line removed"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "pnpm exec eslint <6 files> exit 0; pnpm exec vue-tsc --noEmit filtered by hero/equipment|replay/array|hero/attribute = 0 hits; git diff --name-status 19ad1ea..HEAD = the 6 declared paths only; git grep -c it.skip = 1 occurrence (equipment.test.ts, D-06)"
        status: pass
    human_judgment: false

duration: ~29min
completed: 2026-09-17
status: complete
---

# Phase 7 Plan 15: Review-Recheck Defect Batch (CR-01 / WR-01 / WR-02 / WR-03) Summary

**`07-REVIEW-recheck.md` 的 1 Critical + 3 Warning 逐条按 Task 0 裁决（Q1=A / Q2=A / Q3=A / Q4=A）闭合：`compareEquip` 改为「先克隆再加入、按同一批克隆删除」（现役装备参与比较时差值回到契约的 `-7` / `+7` 且不再告警 108）、`normalizeParam` 的不可编码回落改为 `return null`（与自身 jsDoc 及 `normalizeParamList` 的丢弃语义一致）、两处扩容乘数校验收紧为 `<= 1`（与码 149 文案一致）、`clone()` 恢复 `addModifier` 的四项簿记；新增 5 条正确预期用例（各经「修复前失败 / 修复后通过」反向验证）。**

## Scope

- **计划:** `07-15`（Phase 7 第 15 个计划，`depends_on: []`，Wave 15；`autonomous: false`，Task 0 为 D-09 裁决关卡，已裁决并锁入 `<record>`）。
- **缺陷来源:** `07-VERIFICATION.md` 的 `### Review-Recheck Gaps`（CR-01 / WR-01 / WR-02 / WR-03）＝ `07-REVIEW-recheck.md` 在第二批修复（07-09..07-13）上新增的发现。
- **产出:** 6 个既有文件的既有方法体内改动 + 5 条新用例；**零新增文件、零新增符号、零新增依赖、零告警码改动**。

## Review Mapping（D-14：发现 ID → 缺陷 → 裁决分支 → 修复提交 → 闭合状态）

| 发现 ID | 缺陷（`07-REVIEW-recheck.md` 标题） | 裁决分支 | 修复提交 | 闭合状态 |
| --- | --- | --- | --- | --- |
| **CR-01** | `compareEquip()` 在被比较的装备恰为现役装备时返回错误的差值（`equipment.ts:297-317`） | **Q1 = A**（先 `clone()` 再加入、删除同一批克隆；活属性零扰动） | `53f067a` | **已闭合**（生产修复 + 用例；见 D1） |
| **WR-01** | `normalizeParam()` 对不支持类型报 `byteLength: 0` 而 `setParamArray()` 写 2 字节 → 编解码失步（`array.ts:310-315`） | **Q2 = A**（回落分支 `return null`，由既有丢弃语义接管） | `a7c9f97` | **已闭合** |
| **WR-02** | 扩容乘数恰为 `1` 时 `checkBufferExpand()` 以相同实参无限递归（`array.ts:158-211`） | **Q3 = A**（两处校验 `<= 1`，告警 149 + 回退倍率 2） | `49116c0` | **已闭合** |
| **WR-03** | `HeroAttribute.clone()` 绕过 `modifierName`/绑定，克隆体静默丢失修饰器（`attribute.ts:296-314`） | **Q4 = A**（恢复 `bindAttribute` / `modifierName` / 存档开关 / `recalculateAttribute` 四项簿记） | `bb19865` | **已闭合** |

**判据（逐条）：** 四条均有「修复前失败、修复后通过」的正确预期用例；未采纳任何【未选】分支；未改动任何既有断言、未新增 `it.skip`、未弱化任何断言。

**Info（不在本计划范围，由用户直接提交修完，本计划零触碰）：** IN-01 `34ba9e8`（`onRecordCommand` 钩子参数）、IN-02 `219ac49`（`FlagSystem.loadState` 签名）、IN-03 `3a3a6ac`（`refreshEnemy` 与 `refreshEnemyAndClearCache` 合并）、IN-04 `a2a8e6e`（`ReplaySystem.route` → `ReplaySystem.array` 与 `setReplayArray` 的 `disabled` 清零）。对应文件（`replay/system.ts`、`flag/**`、`combat/mapDamage.ts`）在本计划提交区间内**为空**。

## Task Commits

`actuals.commits = 4`（`plan_head_before = 19ad1ea91ab7a69b0b65020d49bbe65ab30ec301`；`git rev-list --count 19ad1ea..HEAD` 实测 = 4；**本 SUMMARY 的提交本身不在此计数内**，orchestrator 的跟踪同步提交亦然）。四条均为**普通提交、钩子生效**，未使用 `--no-verify`、未 amend 任何提交：

1. **Task 1（CR-01）** — `53f067a` (fix) — `fix(07-15): compare equipment without rebinding the equipped modifiers`（`equipment.ts` +10/−5，`equipment.test.ts` +29/−1；无删除文件）
2. **Task 2（WR-01）** — `a7c9f97` (fix) — `fix(07-15): drop unencodable replay params instead of a zero-length record`（`array.ts` +6/−7，`array.test.ts` +20/−1）
3. **Task 3（WR-02）** — `49116c0` (fix) — `fix(07-15): reject an expand multiplier of exactly one`（`array.ts` +3/−3，`array.test.ts` +29/−1）
4. **Task 4（WR-03）** — `bb19865` (fix) — `fix(07-15): restore modifier bookkeeping when cloning an attribute`（`attribute.ts` +9/−1，`attribute.test.ts` +40/−1）

Task 2 与 Task 3 触及同两个文件，按 D-13 **先后串行、分别门禁、分别提交**，未合并为一次提交。

## Gate Results（Task 5 — D-12 / D-44 文件级三步 + 全量套件）

| 门禁 | 命令 | 结果 |
| --- | --- | --- |
| ESLint（6 个声明文件，先 `--fix` 再校验） | `pnpm exec eslint --fix <6 files>` → `pnpm exec eslint <6 files>` | **exit 0，无输出**（0 错误） |
| 类型（文件级，按改动文件相对路径过滤） | `pnpm exec vue-tsc --noEmit` → 过滤 `hero/equipment` / `replay/array` / `hero/attribute` | **0 命中**（未以整仓退出码判定，按 06-RESEARCH Pitfall 4） |
| 计划内测试（3 个可运行文件） | `pnpm exec vitest run replay/array.test.ts hero/attribute.test.ts hero/state.test.ts` | **`Test Files 3 passed (3)` / `Tests 92 passed (92)`**（0 失败） |
| 计划内测试（`equipment.test.ts`，**用户侧阻塞**） | `pnpm exec vitest run hero/equipment.test.ts` | `18 tests | 14 failed | 1 skipped`（13 条为基线既存的用户侧失败 + 本计划新增的 CR-01 用例；见 Deviations） |
| 全量套件（当日复录） | `pnpm test:ci` | **`Test Files 13 failed | 52 passed (65)`** / **`Tests 63 failed | 677 passed | 1 skipped (741)`** / `Errors 6` |
| 跳过项 | `git grep -c "it.skip" -- "*.test.ts"` | 仓库恰 **1 处**：`equipment.test.ts`（码 147，D-06）；**未新增** |
| 改动面（区间） | `git diff --name-status 19ad1ea..HEAD` | **仅 6 条声明路径**（`hero/equipment.ts` / `hero/equipment.test.ts` / `replay/array.ts` / `replay/array.test.ts` / `hero/attribute.ts` / `hero/attribute.test.ts`） |
| 删除文件 | `git diff --diff-filter=D --name-only 19ad1ea..HEAD` | **空** |

### 基线与增量（rule 2：只对本计划声明的路径负责）

| 时点 | 文件 | 通过 | 失败 | 跳过 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 计划期参照（`07-14` 收口） | 66 | 737 | 0 | 1 | **未经本次规划运行复测**；当前 HEAD 已因用户并行工作失效 |
| 本计划执行前（`19ad1ea`，实测） | 65 | 611 | 113 | 1 | 用户在并行重构（`path/**`、`data-state/**`、`logger.json` 等未暂存改动），且 `a2a8e6e` 的 `route`→`array` 改名打破了 `equipment.test.ts` 的桩 |
| 本计划执行后（实测） | 65 | 677 | 63 | 1 | 失败数由 113 → 63 **下降**（用户在并发修复其自身 WIP）；未新增文件；总用例 725 → 741（本计划 +5，其余为用户并发新增） |

**增量归因：** 本计划新增 5 条用例 → 其中 **4 条通过**（WR-01 / WR-02 / WR-03 ×2，见上表 92 passed 的 3 文件），**1 条（CR-01）因用户侧桩漂移无法转绿**。`677 = 611 + 4 + 62`（62 为用户并发修复/新增带来的净变化）。失败与跳过项均**不因本计划改动而新增**，且**未通过删改用例或放宽断言来对齐数字**。

## Per-Defect Evidence（反向验证：修复前失败 → 修复后通过）

| 缺陷 | 修复前 | 修复后 |
| --- | --- | --- |
| **CR-01** | 现役剑参与比较时 `compareEquip(sword, axe, 0)` 的差值应为 `-7`（修复前 `-12`），且每个方向各触发一次告警 108 | `-7` / 对称 `+7`、键集合 `['atk']`、**不含 108**、活属性修饰器索引 `>= 0`、活属性 final 仍 `22` |
| **WR-01** | `array.getCommandArray()[0]` 的参数计数为 **1**（回落记录被计入并写入 2 字节而游标推进 0） | 计数为 **0**、`get(0).params` 为 `[]`、`get(1).params` 为 `[20]`、读流两步 `1/[]` 与 `2/[20]`、流索引 `2`；告警 148 仍触发 |
| **WR-02** | 乘数为 1 时**无 149 告警**（配置被静默接受，随后首次扩容以相同实参自递归） | `info.map(code)` 为 `[149, 149]`、15 步全部入册并按原顺序读回、流索引 `15` |
| **WR-03** | `clone.iterateModifiers()` 为空 → `saveState().modifiers` 为 `[]`；克隆修饰器存档开关为 `true` | 遍历得 `['atk','hp']`、`getModifierIndex` 为 `0`、克隆修饰器 `setValue(9)` 使克隆重算为 `109` 且源属性仍 `105`、`saveState().modifiers` 名称为 `['atk','hp']`；源上不可存档的修饰器在克隆上仍为 `false` 且不进入克隆体存档 |

**A6 复算（既有 `compareEquip` 两条用例）：** 在「用户桩临时对齐」的一次性验证运行中（未提交）16 条可运行用例通过，其中 `diffs the final attributes of two equipment instances`（`atk 5` / `def -3`）与 `keeps foreign modifiers when the equipped instance was rebuilt`（`atk 12` / `def -3`）**数值与 A6 逐条一致**，未出现回归。

**A10（CR-01 的隐含前提）已由守卫断言覆盖：** 新增用例的「不含 108」断言即「被比较修饰器的 `clone()` 返回 `owner` 为 `null` 的新对象」这一前提的守卫；临时对齐运行中该断言通过。

**WR-02 全仓影响面复核（执行期实测）：** `git grep -n "warn(149"` 仅 `array.ts:115` / `:123` 两处写入点；码 149 的断言仅 `array.test.ts`（既有「乘数 0」用例 + 本条新增「乘数 1」用例）；`*ExpandMultiplier` 的赋值点仅 `system.ts:37-38`（`1.2`）、`array.test.ts` 夹具默认值 `2`、既有用例的 `0` 与本条新增的 `1` —— **无任何既有配置或用例使用乘数 1**，收紧不破坏既有绿用例。

**WR-03 的对外可观测序列化面变化（预期正确化，T-7-52）：** 克隆属性的 `saveState().modifiers` 由**恒为空数组**变为**真实列出可存档的克隆修饰器**；`iterateModifiers()`、`getModifierIndex()`、克隆修饰器的 `setValue` 通知同时由退化行为变为正确行为。这是 `types.ts:117`「深拷贝此勇士属性对象」的应有语义；两个下游消费点（`equipment.ts` 的比较克隆、`combat/damage.ts` 的会心搜索克隆）不读取克隆的存档面，故为纯补齐。

## Deviations from Plan

### 1. [用户侧阻塞 - CR-01 见证无法转绿] `equipment.test.ts` 的录像桩仍停留在 `a2a8e6e` 之前的 API

- **Found during:** Task 1 的聚焦验证（并按需在 Task 5 复核）
- **Issue:** 提交 `a2a8e6e`（用户自行修 IN-04）把 `ReplaySystem.route` 改名为 `ReplaySystem.array`，并同步更新了 19 个文件——**唯独漏了 `packages-user/data-base/src/hero/equipment.test.ts`**：其 `ReplaySystemStub` 只有 `route` 成员，而 `equipment.ts:195` / `:212` 已经调用 `replay.array.add(...)`。于是任何经过 `equip()` / `unequip()` 的用例都会以 `TypeError: Cannot read properties of undefined (reading 'add')` 失败：**该文件 18 条用例中 13 条在执行本计划之前就已失败**（计划期参照的「737 通过 / 0 失败」在当前 HEAD 已不成立）。
- **后果:** (a) 计划 Task 1 的 `<verify>`（`equipment.test.ts` + `state.test.ts`）与 Task 5 的 `pnpm test:ci` 0 失败门槛在当前 HEAD 无法满足；(b) 本计划新增的 CR-01 用例（`diffs the final attributes when one compared item is currently equipped`）同样在 `env.equipment.equip(sword, 0)` 处失败——**与生产修复无关**。
- **处置（未修、已升级）:** 按硬规则 2（用户 2026-09-17：只对本计划声明路径负责；用户并行改动导致的失败**不调查、不修复、不放宽断言、仅作为观察登记**）与硬规则 5（计划外缺陷不自行修复、只上报），**未改动该桩**；且按 AGENTS.md 的命名规则，把 `route` 改名/新增 `array` 成员属需要用户预先批准的命名改动，本计划未获授权。**生产修复本身已独立取得证据**：把该桩**临时**补上 `array` 别名（不提交、随后 `git checkout` 完全还原）后运行，该文件 18 条用例如下——16 通过 / 1 跳过 / **1 失败**，其中**新增的 CR-01 用例通过**，A6 的两条既有用例数值亦保持不变。
- **建议的修复（一行，供用户定夺）:** 在 `equipment.test.ts` 的 `ReplaySystemStub` 中把录像桩同时暴露为 `array`（与 `route` 指向同一对象），或按 `a2a8e6e` 的口径把该桩与断言整体改名为 `array`；改完后本计划的 CR-01 用例应即转绿。
- **Files affected:** **零**（本计划的 6 个文件已提交内容与该桩无关）
- **Committed in:** 无（属用户所有；未暂存、未提交）

### 2. [用户侧观察 - 另一条既存失败用例] `suppresses replay recording while loading the equipment state`

- **Found during:** 上述一次性临时对齐运行
- **Issue:** 临时对齐后，`equipment.test.ts:386` 的该用例仍失败（`expected [ [ 6, [ 0 ] ] ] to deeply equal []`）：`loadState()` 期间的 `Equip` 指令未被抑制。这与 `a2a8e6e`/`data-state` 侧的读到改动（`core.ts` 亦在用户未暂存改动中）相关，**属用户并行工作**，不在本计划范围。
- **处置:** **不调查、不修复、不作为本计划发现登记**（硬规则 2/5）；仅作为观察上报 orchestrator。
- **Files affected:** 零

### 3. [无其它偏差]

- **规则 1–3 自动修复:** 无（四次改动均按裁决原样落笔，未发现需自动修复的 bug / 缺失关键功能 / 阻塞项）。
- **规则 4 架构变更:** 无（零新增符号、零新依赖、零新表/服务）。
- **未确认观察（仍不登记）:** Task 0 context 中标注「未确认、不登记」的其它退化扩容配置（乘数恰为 1 之外者，如初始容量为 0）**未**登记为缺陷、**未**在 Q3 一并封口，与 `<record>` 一致。
- **注释门槛核对:** 本计划提交区间内被删除的行**仅**为代码行与三个测试文件 `:1` 文件头覆盖说明的**追加改写**；`// @ts-expect-error 泛型无法推导`（`equipment.ts`）、`:282-285` 现役删除块注释、`:319`「第二次没必要再删除」注释、`normalizeParamList` 的「丢弃的项不保留占位」注释均**逐字保留**；无任何既有 jsDoc 被修改或删除；新增注释仅为「各 `it` 前的单行中文注释」。

**Total deviations:** 2 recorded（1 项用户侧阻塞 + 1 项用户侧观察），均为**用户并行工作的直接后果**，非本计划 auto-fix。

## Observed-Only User-Owned Failures（仅上报，未修复）

| 现象 | 归属 | 依据 | 本计划动作 |
| --- | --- | --- | --- |
| `equipment.test.ts` 13 条基線失败（`replay.array` 未定义） | 用户提交 `a2a8e6e` 漏改该测试桩 | `git show a2a8e6e --stat` 不含 `hero/equipment.test.ts` | 不触碰；上报（Deviations 1） |
| `equipment.test.ts` 第 14 条（本计划新增的 CR-01 用例）同样失败 | 同一桩漂移 | 同上（临时对齐后即通过） | 保留正确断言；上报 |
| `pnpm test:ci` 的 63 失败 / 6 unhandled errors | 用户并行未暂存改动（`path/**`、`data-state/**`、`hero/mover.ts`、`hero/types.ts`、`logger.json` 等） | 与本计划 6 条路径无交集 | 不调查；仅记录实测值 |
| `.planning/STATE.md`、`.planning/state.json`、`.planning/milestone.lock` 等未暂存/未跟踪条目 | 用户 & orchestrator | — | 未暂存、未提交 |

## WINDOWS.md

**未新建条目、未 `fixed` / 未 `waive`（D-14）**：CR-01 / WR-01 / WR-02 / WR-03 **本来就没有账本 id**。实测 `Select-String .planning/WINDOWS.md -Pattern "CR-01|WR-01|WR-02|WR-03|recheck"` 无命中；`git status --short -- .planning/WINDOWS.md` 为空；台账仍为 **11 open / 0 waived / 17 fixed / 28 total**。

> 说明：若 CR-01 的见证在用户修好桩之前一直被记为「未运行」，按执行协议它本可入账；但本计划受 D-14 与硬规则 7 约束**不得改动 `WINDOWS.md`**，故以本节明写代替入账，并由 orchestrator 在收尾时决定是否需要另行登记。

## Phase 7 验证失效与重跑要求

**`07-VERIFICATION.md`（`_Verified: 2026-09-17T10:42:49Z_`）已失效**：该结论成文于 `a2a8e6e` 之前，既不覆盖用户后续的并行改动，也不覆盖本批 4 条缺陷的闭合。本计划执行完毕后**必须重跑 `/gsd-verify-work`（或 `gsd-verify-work 7`）**重新出具验证结论，并复核 `### Review-Recheck Gaps` 四条的实际关闭状态。

## Tracking Sync（本计划**零触碰**，属 orchestrator 收尾）

- `.planning/ROADMAP.md`（Phase 7 段的 Plans 计数 + `07-15-PLAN.md` 行 + Wave 15 段）与 `.planning/STATE.md` / `.planning/state.json` 的同步是**本计划之外的 orchestrator 收尾步骤**：本计划**未编辑、未暂存、未提交**这两个路径。
- 证据：`git diff --name-status 19ad1ea..HEAD` **不含** `.planning/ROADMAP.md` 与 `.planning/STATE.md`；工作树中这两个路径的改动（若有）归用户/orchestrator 所有。
- 同步方式：对既有计划行与说明段做**定点追加**，不得重排/删除/改写既有内容（与 07-10/07-12/07-13/07-14 先例一致）。

## Assumption Delta

- **noun:** N/A
- **decision:** `no-change`（本计划不新增、不重命名任何领域概念；假设-增量检测器此前唯一命中的信号来自包名 `packages-user/data-fallback` 的字面量 `fallback`，属假阳性）

## A8 — `FIX-01` 的探针未决假设（**保留在册，不得视为已解决**）

本阶段无 SPEC，故 specless 探针回退运行；该探针对 `FIX-01` 只返回一行 `unclassified — review manually`（`coverage.unresolved = 1`），**未**给出可判定的边界/禁止项分类，也**不得**用任何回填（backstop）自动消化。本计划以「4 条缺陷各自的正确预期回归用例 + 文件级三步门禁 + `pnpm test:ci` 实测」作为 `FIX-01` 在本轮的唯一可操作验证面；**该未决分类状态保留在册**。

## Issues Encountered

1. **CR-01 的自动化见证被用户侧桩漂移阻塞**（见 Deviations 1）——已通过一次性临时对齐取得「修复有效」的证据，但**提交状态下的该用例仍为红**，需用户先对齐 `equipment.test.ts` 的录像桩。
2. **工作树存在大量并发用户 WIP**（`path/**`、`data-state/**`、`hero/mover.ts`、`hero/types.ts`、`logger.json`、`.planning/STATE.md`、`.planning/state.json`、未跟踪的 `.planning/milestone.lock` 等）：全部**未暂存、未提交**；每次提交前后均以 `git status --short` 核对，暂存区只含本计划当次声明的文件；未使用 `git add -A` / `git add .` / `git commit -a` / `git stash` / `git clean` / `git reset --hard`。
3. **无其它阻塞**：eslint 与文件级 `vue-tsc` 一次性通过；4 次提交均有钩子生效、无重试循环。

## User Setup Required

None —— 本计划无外部服务、无环境变量、无仪表盘配置。

## Known Stubs

None —— 本计划未引入任何硬编码空值、占位文案、未接线数据源或新增 `TODO`/`FIXME`/`it.skip`。**CR-01 的见证当前为红**并非 stub，而是**用户侧测试桩漂移**导致的未运行见证，已在 Deviations 1 与 Observed-Only 表中登记，并**未**写入 `WINDOWS.md`（D-14 + 硬规则 7）。

## Threat Model Disposition

| Threat ID | 计划处置 | 实际处置 | 依据 |
| --- | --- | --- | --- |
| T-7-48 `compareEquip` 复用活绑定修饰器（high / mitigate） | Task 1 按 Q1=A 修复 | **已缓解** | 加入端 `clone()`、删除端按同一批克隆删除；用例断言双向差值、不含 108、活属性索引非负 |
| T-7-49 `normalizeParam` 的零长度回落记录（high / mitigate） | Task 2 按 Q2=A 修复 | **已缓解** | `return null` + 计数/字节/游标三者自洽的回归用例 |
| T-7-50 乘数 1 的自递归 DoS（high / mitigate） | Task 3 按 Q3=A 修复 | **已缓解** | `<= 1` 校验 + `[149,149]` 与 15 步读回用例 |
| T-7-51 `clone()` 绕过簿记（medium / mitigate） | Task 4 按 Q4=A 修复 | **已缓解** | 四项簿记 + 遍历/定位/通知/存档用例 |
| T-7-52 克隆属性 `saveState().modifiers` 由空变实（low / accept） | accept + 在 SUMMARY 明写 | **accept（已明写）** | 本 SUMMARY「Per-Defect Evidence」段 |
| T-7-53 `logger.catch` 可能掩盖真实告警（low / mitigate） | 四条用例显式断言告警码 | **已缓解** | 断言 148 触发 / 不含 108 / `[149,149]` |
| T-7-SC 依赖安装（high / mitigate） | 不新增依赖 | **未新增** | `package.json` / `pnpm-lock.yaml` 零改动（不在提交区间内） |

## Next Phase Readiness

- **待办（非本计划）：** ① 用户对齐 `equipment.test.ts` 的 `ReplaySystemStub`（`route` → `array` 或双成员）后，CR-01 用例应即转绿；② 重跑 `/gsd-verify-work 7` 重新出具 Phase 7 验证结论（现结论已失效）；③ orchestrator 定点追加 Phase 7 计划计数与 Wave 15 行。
- **未修复且经裁定保留：** Task 0 的「未确认退化扩容配置」观察；`07-REVIEW.md` 的既有裁决不变。

---

## Self-Check: PASSED

- FOUND: `53f067a`（Task 1 / CR-01；2 files，+39/−6，无删除）
- FOUND: `a7c9f97`（Task 2 / WR-01；2 files，+20/−6）
- FOUND: `49116c0`（Task 3 / WR-02；2 files，+30/−3）
- FOUND: `bb19865`（Task 4 / WR-03；2 files，+49/−2）
- VERIFIED: `git diff --name-status 19ad1ea..HEAD` = 本计划 6 条声明路径，**无第 7 条**；`git diff --diff-filter=D` 为空
- VERIFIED: `.planning/ROADMAP.md` 与 `.planning/STATE.md` 在本计划提交区间内**为空**；`WINDOWS.md` 零改动（`git status` 无该文件；无 `CR-01|WR-01|WR-02|WR-03|recheck` 命中）
- VERIFIED: `pnpm exec eslint <6 files>` exit 0；`vue-tsc --noEmit` 过滤 `hero/equipment|replay/array|hero/attribute` = **0 命中**
- VERIFIED: 计划内 3 个可运行测试文件 = `Test Files 3 passed (3)` / `Tests 92 passed (92)`
- VERIFIED: `it.skip` 恰 1 处（`equipment.test.ts`，D-06），未新增；被删除的行中无任何 `expect(` 断言；无既有 jsDoc 被修改
- VERIFIED: `pnpm test:ci` = `Test Files 13 failed | 52 passed (65)` / `Tests 63 failed | 677 passed | 1 skipped (741)`（全量基线受用户并行工作影响，已按 rule 2 归因）
- VERIFIED: CR-01 用例在「用户桩临时对齐」的一次性运行中通过（该临时改动已 `git checkout` 完全还原，未提交）
- VERIFIED: 每次提交前后 `git status --short` 只含本计划当次声明文件；未暂存任何用户 WIP

---

*Phase: 07-data-fixes*
*Completed: 2026-09-17*
