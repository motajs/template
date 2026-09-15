---
phase: 06-unit-tests
plan: 02
subsystem: testing
tags: [vitest, unit-test, data-state, enemy, damage-calculator, aura, special-registry, map-damage, node]

requires:
  - phase: 06-unit-tests
    provides: "Node Vitest harness pattern (vi.hoisted global stub + dynamic module bag + inline fakes + logger.catch) and the shared 06-TEST-FINDINGS.md sink"
provides:
  - "Top-level combat implementation coverage: MainDamageCalculator (all special branches), MainEnemyFinalEffect, MainEnemyComparer, CommonAura/GuardAura, registerSpecials, and the map-damage views/converter/reducer"
  - "Reusable inline fixture shapes for data-state enemy tests (fake enemy/hero/state/context/view)"
affects: [06-unit-tests, 06-03, 06-08]

actuals:
  tokens: 16356
  tasks: 3
  commits: 4
  plan_head_before: 50d868760aab1f00544424d01b1982978d0aa344

tech-stack:
  added: []
  patterns:
    - "Inline per-file fake IEnemy/IReadonlyEnemy/IReadonlyHeroAttribute/IStateBase/IEnemyContext; data-layer interfaces never mocked"
    - "vi.stubGlobal('core', { flags }) with a mutable handle returned from vi.hoisted for the BetweenDamageView core read (restored per assertion)"
    - "Focused vitest run per task, then pnpm test:ci as the phase gate"

key-files:
  created:
    - packages-user/data-state/src/enemy/calculator.test.ts
    - packages-user/data-state/src/enemy/final.test.ts
    - packages-user/data-state/src/enemy/comparer.test.ts
    - packages-user/data-state/src/enemy/aura.test.ts
    - packages-user/data-state/src/enemy/special.test.ts
    - packages-user/data-state/src/enemy/mapDamage.test.ts
  modified: []

key-decisions:
  - "06-02：enemy 顶层实现以行为单测覆盖，6 个同目录 *.test.ts 全部保持 inline fixture（D-02/D-03），未修改任何生产代码"
  - "06-02：MainDamageCalculator 逐个特殊分支断言精确 { damage, turn }，支援路径额外验证 inGuard 不泄漏（两次顶层计算相等 + 支援怪自身 guard 不被递归）"
  - "06-02：registerSpecials 断言代码 0-27 各注册一次且守卫默认值为空集合；仅对 6/25/1 调用 getSpecialName/getDescription，避免触发 core.values.* 全局读取"
  - "06-02：plan 对 BetweenDamageView 的描述『两个 delta 都为正』与实现不符（实现是排除向左/向上以去重），按实现实际语义断言（右/下命中），属描述措辞而非代码缺陷，未登记 findings"
  - "06-02：未发现疑似 bug，06-TEST-FINDINGS.md 无新增 #06-02-N 条目，无 it.skip/it.todo"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "MainDamageCalculator 行为覆盖：基础伤害/回合、无法破防与无敌、魔攻、连击 4/5、多段、支援递归与告警 137、先攻、破甲、反击、净化、吸血（含 add）、负伤 flag 夹取、固伤、仇恨、取整、攻击/其他属性临界上界"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/enemy/calculator.test.ts#MainDamageCalculator base and defeat branches"
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
    description: "光环与特殊属性注册覆盖：CommonAura 范围选择与加成结算、GuardAura 3x3 范围与守卫定位符添加/自身跳过/缺来源跳过；registerSpecials 代码 0-27 各一次、守卫默认值、名称与描述生成"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/src/enemy/aura.test.ts#CommonAura apply"
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

duration: 9min
completed: 2026-09-14
status: complete
---

# Phase 06 Plan 02: Enemy Top-Level Implementation Unit Tests Summary

**Behavior unit tests for `data-state/src/enemy` — MainDamageCalculator every special branch, final effect, comparer, aura converters, special registry 0-27, and the five map-damage views plus converter/reducer, all green under the fixed `pnpm test:ci` gate**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-14T08:58:34Z
- **Completed:** 2026-09-14T09:07:44Z
- **Tasks:** 3
- **Files modified:** 6 created (all `*.test.ts`), 0 production files touched

## Accomplishments

- `calculator.test.ts` (22 tests) proves exact `{ damage, turn }` for the baseline, the two defeat paths (no break-through / 无敌 without cross), and every special branch: 魔攻, 2/3连击, 多段, 支援 guard recursion + warn 137 + `inGuard` non-leakage, 先攻, 破甲, 反击, 净化, 吸血 (with/without `add`), 负伤 flag clamping, 固伤, 仇恨, flooring, and both `getCriticalLimit` paths (坚固 → Infinity).
- `aura.test.ts` (13 tests) covers `CommonAuraConverter`/`GuardAuraConverter` selection, `FullRange`/`RectRange`/`ManhattanRange` choice and params, buff math, the 3×3 guard range, guard-locator registration, own-locator skip and missing-source no-op.
- `special.test.ts` (6 tests) calls `registerSpecials` on an inline fake manager and asserts codes 0-27 registered exactly once, the `guard` empty-set default, and name/description generation for a serializable special (code 6), the halo (code 25) and a none-property special (code 1).
- `mapDamage.test.ts` (19 tests) drives all five views (`Zone`, `Repulse`, `Laser`, `Between`, `Ambush`), the converter's per-special view order + laser face lookup, and the reducer's sum / max-damage type / catch+repulse union, including the `core.flags.betweenAttackMax` branch.
- `final.test.ts` (5) and `comparer.test.ts` (5) cover the final-effect and comparison contracts.
- Full suite: `pnpm test:ci` → **29 files, 223 passed, 3 skipped** (the 3 skips are the pre-existing `#06-01-N` findings). No new skips.

## Task Commits

Each task was committed atomically:

1. **Task 1: MainDamageCalculator + final effect + comparer** - `5b76cf4` (test)
2. **Task 2: Auras + special registration** - `b36a4ee` (test)
3. **Task 3: Map damage views, converter, reducer** - `7b95670` (test)

**Plan metadata:** metadata docs commit follows this SUMMARY (3 task commits + 1 metadata commit = 4 total from `plan_head_before`).

## Files Created/Modified

- `packages-user/data-state/src/enemy/calculator.test.ts` - MainDamageCalculator branch coverage (22 tests)
- `packages-user/data-state/src/enemy/final.test.ts` - MainEnemyFinalEffect (5 tests)
- `packages-user/data-state/src/enemy/comparer.test.ts` - MainEnemyComparer (5 tests)
- `packages-user/data-state/src/enemy/aura.test.ts` - CommonAura/GuardAura + converters (13 tests)
- `packages-user/data-state/src/enemy/special.test.ts` - registerSpecials registry (6 tests)
- `packages-user/data-state/src/enemy/mapDamage.test.ts` - map damage views/converter/reducer (19 tests)

## Decisions Made

- Kept every fixture inline per file (D-03); no cross-file factory helper was introduced.
- Extended the 06-01 harness shape (`vi.hoisted` global/`Map` polyfill stubs + `beforeAll` dynamic module bag + `logger.catch` for warn 137) and added a mutable `core` stub for the `BetweenDamageView` global read.
- Asserted `BetweenDamageView` by its actual semantics — the right/down adjacent locator qualifies and left/up is excluded (an anti-double-count bias), rather than the plan's parenthetical "both deltas positive".
- No suspected bugs surfaced, so `06-TEST-FINDINGS.md` gains no `#06-02-N` entry and no `it.skip`/`it.todo` was added (D-05 not triggered).

## Deviations from Plan

None - plan executed exactly as written, except for one documentation clarification recorded below (no code change and no test weakening).

### Clarification (not a code deviation)

**BetweenDamageView qualifier wording**
- **Found during:** Task 3 (map damage views)
- **Plan text:** "only the forward-adjacent locator (delta sum 1 and both deltas positive) qualifies".
- **Implementation:** rejects only `deltaX <= 0 && deltaY <= 0`, so the right `(dx=1,dy=0)` and down `(dx=0,dy=1)` neighbours qualify while left/up do not. This deliberate direction bias prevents the mirrored source enemy from double-counting the same pair.
- **Action:** Tests assert the implementation's actual (correct) semantics; no `it.skip` and no findings entry. Recorded here for reviewer awareness.

## Issues Encountered

- Windows/PowerShell surfaces pnpm's Browserslist age notice on stderr as a non-terminating `NativeCommandError`; it does not affect the run. Focused runs and the full `pnpm test:ci` are green.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The `data-state/src/enemy` top-level implementation is behavior-covered and green; later plans (06-03 `data-base/src/enemy`, 06-08 `CoreState` integration) can reuse these inline fixture shapes.
- Open input for the user: confirm the flagged TEST-01 acceptance assumption (D5 above) and triage the `#06-01-N` findings; no core code was modified in this phase.

## Self-Check: PASSED

- Created files verified present: the 6 `data-state/src/enemy/*.test.ts` files and `06-02-SUMMARY.md`.
- Task commits verified in history: `5b76cf4`, `b36a4ee`, `7b95670`.
- `git diff --name-only` from `plan_head_before` lists only the 6 new `*.test.ts` files; no production source changed.
- Focused runs and full `pnpm test:ci` green (29 files, 223 passed, 3 documented pre-existing skips).

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*
