---
phase: 06-unit-tests
plan: 02
subsystem: testing
tags: [vitest, unit-test, data-state, enemy, damage-calculator, aura, special-registry, map-damage, node]

requires:
  - phase: 06-unit-tests
    provides: "Node Vitest harness pattern (vi.hoisted global stub + dynamic module bag + inline fakes + logger.catch) and the shared 06-TEST-FINDINGS.md / 06-COVERAGE-MAP.md sinks"
provides:
  - "Top-level combat implementation coverage: MainDamageCalculator (all special branches), MainEnemyFinalEffect, MainEnemyComparer, CommonAura/GuardAura (+converters), registerSpecials, and the five map-damage views + converter + reducer"
  - "Reusable inline fixture shapes for data-state enemy tests (fake enemy/hero/state/context/view/face)"
  - "06-COVERAGE-MAP.md 06-02 section: warn code 137 -> enemy/calculator.ts"
affects: [06-unit-tests, 06-03, 06-07, 06-08]

actuals:
  tokens: 578
  tasks: 3
  commits: 2
  plan_head_before: 06bf4996eeae574fe6af629dba27a479fd156d81

tech-stack:
  added: []
  patterns:
    - "Inline per-file fake IEnemy/IReadonlyEnemy/IReadonlyHeroAttribute/IStateBase/IEnemyContext/IEnemyHandler; data-layer interfaces never mocked (D-03)"
    - "vi.stubGlobal('core', { flags }) with a mutable handle returned from vi.hoisted for the BetweenDamageView global read (restored per assertion)"
    - "Focused stage run per D-43 stage, then pnpm test:ci as the phase gate (D-08)"

key-files:
  created:
    - packages-user/data-state/src/enemy/calculator.test.ts
    - packages-user/data-state/src/enemy/final.test.ts
    - packages-user/data-state/src/enemy/comparer.test.ts
    - packages-user/data-state/src/enemy/aura.test.ts
    - packages-user/data-state/src/enemy/special.test.ts
    - packages-user/data-state/src/enemy/mapDamage.test.ts
  modified:
    - packages-user/data-state/src/enemy/aura.test.ts

key-decisions:
  - "06-02（重跑）：按 D-43 三阶段复核，补齐 GuardAuraConverter.convert 与 GuardAura 能力/applySpecial 正常用例以满足 D-30 公开方法全覆盖；三阶段聚焦运行与 pnpm test:ci 全绿（257 passed / 4 skipped）"
  - "06-02：enemy 顶层实现以 6 个同目录行为单测覆盖（calculator/final/comparer/aura/special/mapDamage），fixture 全部 inline，未修改任何生产代码"
  - "06-02：MainDamageCalculator 逐个特殊分支断言精确 { damage, turn }，支援路径额外验证 inGuard 不泄漏（两次顶层计算相等）；warn 137 经 logger.catch 观测"
  - "06-02：plan 对 BetweenDamageView 的描述『两个 delta 都为正』与实现不符（实现是排除向左/向上以去重），按实现实际语义断言（右/下命中），属描述措辞而非代码缺陷，未登记 findings"
  - "06-02：未发现疑似 bug，06-TEST-FINDINGS.md 无新增 #06-02-N 条目，无 it.skip/it.todo"

patterns-established:
  - "Per-file inline fake handler factories extended from the dataClosure.test.ts shape"
  - "Stage-gated commit cadence (component -> pipeline -> integration) per D-43"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "MainDamageCalculator 行为覆盖：基础伤害/回合、无法破防与无敌、魔攻、连击 4/5、多段、支援递归与告警 137、先攻、破甲、反击、净化、吸血（含 add）、负伤 flag 夹取、固伤、仇恨、取整、攻击/其他属性临界上界"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/enemy/calculator.test.ts#MainDamageCalculator base and defeat branches"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/enemy/calculator.test.ts#warns 137 when a guard locator has no enemy"
        status: pass
    human_judgment: false
  - id: D2
    description: "MainEnemyFinalEffect 与 MainEnemyComparer 行为覆盖：坚固下限提升、模仿复制、无属性不变、优先级 0；基础属性与特殊属性数量/代码/数值深比较"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/enemy/final.test.ts#MainEnemyFinalEffect"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/enemy/comparer.test.ts#MainEnemyComparer"
        status: pass
    human_judgment: false
  - id: D3
    description: "光环与特殊属性注册覆盖：CommonAura 范围选择与加成结算、GuardAura 3x3 范围与守卫定位符添加/自身跳过/缺来源跳过、两个转换器 shouldConvert/convert、优先级与能力声明；registerSpecials 代码 0-27 各一次、守卫默认值、名称与描述生成"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/enemy/aura.test.ts#CommonAura apply"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/enemy/aura.test.ts#converts a code 26 special into a guard aura"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/src/enemy/special.test.ts#registerSpecials"
        status: pass
    human_judgment: false
  - id: D4
    description: "地图伤害覆盖：领域/阻击/激光/夹击/捕捉五种视图的范围参数与伤害信息、转换器按特殊属性顺序组装视图与激光朝向查找、合并器求和/最大伤害类型/额外信息并集"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/enemy/mapDamage.test.ts#MainMapDamageReducer"
        status: pass
    human_judgment: false
  - id: D5
    description: "FLAGGED ASSUMPTION：TEST-01 是否由 `pnpm test:ci` 门禁下的行为单测满足，需用户确认（ROADMAP 侧无边界 verifier 解析该规格）"
    requirement: TEST-01
    verification: []
    human_judgment: true
    rationale: "计划 frontmatter 明确将该假设标为 unverified；只有用户能确认该验收口径，自动化测试无法自证需求定义。"

duration: 8min
completed: 2026-09-14
status: complete
---

# Phase 06 Plan 02: Enemy Top-Level Implementation Unit Tests Summary

**Behavior unit tests for `data-state/src/enemy` — MainDamageCalculator every special branch, final effect, comparer, aura converters, special registry 0-27, and the five map-damage views plus converter/reducer, all green under the fixed `pnpm test:ci` gate**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-14T13:29:00Z
- **Completed:** 2026-09-14T13:37:36Z
- **Tasks:** 3
- **Files modified:** 6 (`*.test.ts` only), 0 production files touched

## Accomplishments

- Re-executed plan 06-02 under the restaged D-43 organization (构件 → 组合/流水线 → 完整/集成). The three stage test files were already committed by the prior (now superseded, D-29) run and were re-verified green unchanged; this run closes the one D-30 per-public-method gap and lands the shared phase artifacts.
- **Stage 1 (构件级)** — `calculator.test.ts` (22) proves exact `{ damage, turn }` for the baseline, the two defeat paths (no break-through / 无敌 without cross), and every special branch: 魔攻, 2/3连击, 多段, 支援 guard recursion + warn **137** + `inGuard` non-leakage, 先攻, 破甲, 反击, 净化, 吸血 (with/without `add`), 负伤 flag clamping, 固伤, 仇恨, flooring, and both `getCriticalLimit` paths (坚固 → Infinity). `final.test.ts` (5) and `comparer.test.ts` (5) cover the final-effect (priority 0, 坚固, 模仿, untouched) and comparison contracts.
- **Stage 2 (组合/流水线)** — `aura.test.ts` (15) covers `CommonAuraConverter`/`GuardAuraConverter` selection **and conversion**, `FullRange`/`RectRange`/`ManhattanRange` choice and params, buff math, the 3×3 guard range, guard-locator registration, own-locator skip, missing-source no-op, and both auras' priority/capabilities/`applySpecial`. `special.test.ts` (6) asserts `registerSpecials` registers codes 0-27 exactly once, sets the `guard` empty-set default, and builds names/descriptions for a serializable special (6), the halo (25) and a none-property special (1).
- **Stage 3 (完整/集成)** — `mapDamage.test.ts` (19) drives all five views (`Zone`, `Repulse`, `Laser`, `Between`, `Ambush`), the converter's per-special view order + laser face lookup, and the reducer's sum / max-damage type / catch+repulse union, including the `core.flags.betweenAttackMax` branch.
- Full suite: `pnpm test:ci` → **29 files, 257 passed, 4 skipped** (the 4 skips are the pre-existing `#06-01-N` findings). No new skips.

## Task Commits

Each task was committed atomically. Stages 1 and 3 produced no diff in this re-run because their artifacts were already committed and verified unchanged; stage 2 gained the D-30 gap-closure test.

1. **Stage 1 (构件级): MainDamageCalculator + final effect + comparer** - `5b76cf4` (test, pre-existing / re-verified)
2. **Stage 2 (组合/流水线): auras + special registration** - `b36a4ee` (test, pre-existing) + `e72231d` (test, gap closure — this run)
3. **Stage 3 (完整/集成): map damage views, converter, reducer** - `7b95670` (test, pre-existing / re-verified)

**Plan metadata:** metadata docs commit follows this SUMMARY (stage runs + metadata = 2 commits from `plan_head_before: 06bf499`).

## Files Created/Modified

- `packages-user/data-state/src/enemy/calculator.test.ts` - MainDamageCalculator branch coverage + warn 137 (22 tests)
- `packages-user/data-state/src/enemy/final.test.ts` - MainEnemyFinalEffect (5 tests)
- `packages-user/data-state/src/enemy/comparer.test.ts` - MainEnemyComparer (5 tests)
- `packages-user/data-state/src/enemy/aura.test.ts` - CommonAura/GuardAura + converters (15 tests; +2 in this run)
- `packages-user/data-state/src/enemy/special.test.ts` - registerSpecials registry (6 tests)
- `packages-user/data-state/src/enemy/mapDamage.test.ts` - map damage views/converter/reducer (19 tests)

## Decisions Made

- Kept every fixture inline per file (D-03); no cross-file factory helper was introduced.
- Extended the 06-01 harness shape (`vi.hoisted` global/`Map` polyfill stubs + `beforeAll` dynamic module bag + `logger.catch` for warn 137) and added a mutable `core` stub for the `BetweenDamageView` global read.
- Asserted `BetweenDamageView` by its actual semantics — the right/down adjacent locator qualifies and left/up is excluded (an anti-double-count bias), rather than the plan's parenthetical "both deltas positive".
- Closed the D-30 gap by adding a normal case for `GuardAuraConverter.convert` and capability assertions for `GuardAura` (`priority`/`couldApplyBase`/`couldApplySpecial`/`range`/`applySpecial`), mirroring the existing `CommonAura` capability test.
- No suspected bugs surfaced, so `06-TEST-FINDINGS.md` gains no `#06-02-N` entry and no `it.skip`/`it.todo` was added (D-05 not triggered).

## Deviations from Plan

None - the plan's `<action>` blocks were executed exactly as written, with one D-30-driven coverage addition documented below (no code change and no test weakening).

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Closed D-30 per-public-method coverage gap for GuardAura**
- **Found during:** Stage 2 (组合/流水线)
- **Issue:** `GuardAuraConverter.convert` and `GuardAura.applySpecial` (plus `priority`/`couldApplyBase`/`couldApplySpecial`/`range`) had no normal-case test, while their `CommonAura` counterparts did — violating the plan's must_have "接口全覆盖 ... 每个公开方法至少一条正常用例" (D-30).
- **Fix:** Added a `GuardAuraConverter.convert` normal case (code 26 → `GuardAura`, fields bound) and a `GuardAura` capability/`applySpecial` test mirroring the `CommonAura` one.
- **Files modified:** `packages-user/data-state/src/enemy/aura.test.ts`
- **Verification:** `pnpm exec vitest run .../aura.test.ts .../special.test.ts` green (21 tests); full `pnpm test:ci` green.
- **Committed in:** `e72231d` (stage 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Strict D-30 compliance; no production code touched, no test weakened, no scope creep.

### Clarification (not a code deviation)

**BetweenDamageView qualifier wording**
- **Found during:** Stage 3 (map damage views)
- **Plan text:** "只对前向相邻格（两个 delta 都为正）命中".
- **Implementation:** rejects only `deltaX <= 0 && deltaY <= 0`, so the right `(dx=1,dy=0)` and down `(dx=0,dy=1)` neighbours qualify while left/up do not. This deliberate direction bias prevents the mirrored source enemy from double-counting the same pair.
- **Action:** Tests assert the implementation's actual (correct) semantics; no `it.skip` and no findings entry. Recorded in `06-TEST-FINDINGS.md` and here for reviewer awareness.

## Issues Encountered

- Windows/PowerShell surfaces pnpm's Browserslist age notice on stderr as a non-terminating `NativeCommandError`; it does not affect the run. Focused stage runs and the full `pnpm test:ci` are green.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The `data-state/src/enemy` top-level implementation is behavior-covered and green; later plans (06-03 `data-base/src/enemy`, 06-07 top-level integration) can reuse these inline fixture shapes.
- Open input for the user: confirm the flagged TEST-01 acceptance assumption (D5 above) and triage the `#06-01-N` findings; no core code was modified in this plan.

## Self-Check: PASSED

- Created/verified files present: the 6 `data-state/src/enemy/*.test.ts` files and `06-02-SUMMARY.md`.
- Stage commits verified in history: `5b76cf4`, `b36a4ee`, `7b95670`, `e72231d`.
- `git diff --name-only` from `plan_head_before` lists only `data-state/src/enemy/aura.test.ts` plus planning artifacts; no production source changed.
- Focused stage runs and full `pnpm test:ci` green (29 files, 257 passed, 4 documented pre-existing skips).

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*
