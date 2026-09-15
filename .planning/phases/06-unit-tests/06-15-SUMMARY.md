---
phase: 06-unit-tests
plan: 15
subsystem: testing
tags: [vitest, data-system, combat, enemy-context, delete-aura, gap-fill, g-06-01-d, it-skip]

# Dependency graph
requires:
  - phase: 06-unit-tests (06-01)
    provides: EnemyContext 光环流水线行为单测与既有缺陷锚点 #06-01-4（重复全量构建未从原始怪物重算）
provides:
  - G-06-01-D —— `EnemyContext.deleteAura` 的正常用例（`addAura` 生效 `atk 2 → 5` → `deleteAura` 同一实例 → 再次 `buildup` 期望回到 `2`）
  - 新增缺陷锚点 #06-15-1（与既有 #06-01-4 同根因：`buildup()` 未在重建前 `reset()` 各视图）
  - 06-COVERAGE-MAP.md 06-15 小节（G-06-01-D 缺口 → 用例 → 文件 → 计划映射）
affects: [06-verify-work, phase 6 gap-fill batch, future fix batch for #06-01-4/#06-15-1]

# Actuals (#2632) — same scale as the plan `estimate` (chars/4 over the realized diff).
actuals:
  tokens: 1323
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "删除全局光环的判定必须传入同一光环实例、经再次全量构建（`buildup`）观测，并先注册 `FakeConverter([])` 打开光环流水线（否则 `buildupBase` 不执行，用例假绿）"
    - "受实现缺陷阻塞的缺口按 D-05 写正确预期 `it.skip`，并交叉引用同根因的既有锚点，不另立独立缺陷编号"

key-files:
  created: []
  modified:
    - packages-user/data-system/src/combat/context.test.ts
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md
    - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md

key-decisions:
  - "G-06-01-D 用例按 D-05 以正确预期编写并标记 `it.skip`：临时取消 skip 实测 `addAura` 生效断言通过（`atk = 5`），但 `deleteAura` + 再次 `buildup` 后仍为 `5`（`AssertionError: expected 5 to be 2`），故不弱化断言、不改为可跑绿假象"
  - "#06-15-1 与既有 #06-01-4 同根因（`buildup()` 未在重建前对各视图 `reset()`），已在 06-TEST-FINDINGS.md 交叉引用 #06-01-4；修复 #06-01-4 后本用例可直接取消 skip"
  - "只新增 1 条 `it.skip`；`context.test.ts` 既有用例与断言零变化，既有 skip 数量不变"
  - "不引入任何新码、不新增依赖、不测 saveState/loadState（D-09/D-32）；不修改任何生产/核心源码（D-46）"

patterns-established:
  - "同实例删除语义验证：`addAura(aura)` 与 `deleteAura(aura)` 必须传同一 `FakeAura` 实例（`Set` 身份比较），不得两次 `new FakeAura(...)`"
  - "同根因缺口复用既有锚点：受阻塞的补测用例把根因指向既有 finding（本次 #06-01-4），避免同一缺陷被登记成多个编号"

requirements-completed: [TEST-01]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "G-06-01-D —— `EnemyContext.deleteAura` 正常用例：注册转换器 → `addAura` → `buildup` 断言 `atk 2 → 5` → `deleteAura`（同一实例）→ 再次 `buildup` 断言回到 `2`"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/context.test.ts#applies a global aura after addAura and stops applying it after deleteAura (it.skip)"
        status: unknown
    human_judgment: true
    rationale: "用例为受生产缺陷 #06-15-1（与 #06-01-4 同根因：`buildup()` 未在重建前 `reset()` 各视图）阻塞的正确预期 `it.skip`，当前无法跑绿；是否修复核心代码（本批次硬约束禁止）或长期保留 skip，需用户确认后决定"
  - id: D2
    description: "06-COVERAGE-MAP.md create-or-append 06-15 小节，登记 G-06-01-D → 用例 → 文件 → 计划 映射并注明无新增码"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: ".planning/phases/06-unit-tests/06-COVERAGE-MAP.md#06-15 战斗系统接口覆盖补齐（D-46 / G-06-01-D）"
        status: pass
      - kind: integration
        ref: "pnpm test:ci (66 files / 649 passed / 28 skipped)"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-09-15
status: complete
---

# Phase 6 Plan 15: 战斗系统接口覆盖补齐（G-06-01-D）Summary

**为 `EnemyContext.deleteAura` 补上唯一缺失的公开方法正常用例（`addAura` 生效 `atk 2 → 5` → `deleteAura` 同一实例 → 再次 `buildup` 期望回到 `2`）；该用例实测暴露与既有 `#06-01-4` 同根因的 `buildup` 未重置缺陷，按 D-05 以正确预期 `it.skip` 登记为 `#06-15-1`，本批次不修改任何生产代码**

> **⚠️ 未达成的成功判据（需用户确认）**：计划 `<success_criteria>` 要求该用例「可跑绿」。
> 实测不可跑绿——`addAura` 生效的前两条断言通过（`atk = 5`），但 `deleteAura` + 再次
> `buildup` 后 `atk` 仍为 `5` 而非回到基础值 `2`。按计划 D-05 的明文约定
> （「不得弱化断言——写正确预期 + `it.skip` 并登记 `#06-15-N`」）执行，
> 未把受阻塞缺口伪装成失败用例或假绿用例。详见下节与 `06-TEST-FINDINGS.md` `#06-15-1`。

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-15T05:07:12Z
- **Completed:** 2026-09-15T05:19:06Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- **阶段 1（构件级，G-06-01-D）**：在 `EnemyContext single aura ranges` 分区新增 1 条用例
  `applies a global aura after addAura and stops applying it after deleteAura`，
  与既有 `applies a full-range aura to every enemy` 同构（同 `FullRange` +
  `onApply: handler => handler.enemy.addAttribute('atk', 3)`），仅增加 `deleteAura` 后的
  第二次 `buildup` 与回退断言。三条断言齐备：baseline `2` → 光环生效 `5` → 回退 `2`；
  复用文件内既有 `createContextFixture`/`createEnemy`/`FakeAura`/`FakeConverter`，无新增 helper、
  无跨文件共享（D-02/D-03）、无新导入。
- **首次实测（临时取消 skip 验证）**：`atk 2 → 5` 两条断言通过，
  `deleteAura` 后回退断言失败（`AssertionError: expected 5 to be 2`）——
  证明该用例不是空转，而是真实暴露了实现行为。
- **缺陷登记**：按 D-05 保留正确预期并标记 `it.skip`，在 `06-TEST-FINDINGS.md` 追加
  `## #06-15` 小节与 `#06-15-1` 条目，交叉引用既有 `#06-01-4`（同根因），
  并附最小复现、影响面与建议修复方向；不引入新 warn/error 码。
- **阶段 2（收口）**：以 create-or-append 方式追加 `06-COVERAGE-MAP.md` 06-15 小节，
  登记 G-06-01-D → 用例 → 文件 → 计划 映射并注明本计划无新增码；既有小节与 code 表行逐字未变
  （`git diff` 仅新增行）。
- **全仓库检索变化**：`deleteAura` 由「仅命中 2 个生产文件」变为「测试文件也命中」
  （`context.test.ts:625`、`context.test.ts:654`）；`addAura` 在 `context.test.ts` 的命中由 8 增至 10，
  既有覆盖无减少。

## Task Commits

Each task was committed atomically:

1. **阶段 1（构件级）：G-06-01-D 补 `deleteAura` 正确预期用例 + 登记 `#06-15-1`** - `65251f5` (test)
2. **阶段 2（收口）：写入 `06-COVERAGE-MAP.md` 06-15 小节并复核门禁** - `d3eb4d2` (docs)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified

- `packages-user/data-system/src/combat/context.test.ts` — 新增 1 条正确预期 `it.skip` 用例
  `applies a global aura after addAura and stops applying it after deleteAura`（+41，纯新增；
  既有用例、断言与既有 skip 零变化）
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` — create-or-append 追加 06-15 小节（+23，纯新增）
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` — 追加 `## #06-15` 小节与 `#06-15-1` 条目（+32，纯新增）

## Decisions Made

- G-06-01-D 用例按 **D-05** 以正确预期编写并标记 `it.skip`：临时取消 skip 已实测确为真实失败
  （`atk = 5`，期望 `2`），因此不弱化断言、不改写成「删除不报错」式的空转断言、
  也不改为只断言「新怪不受影响」以绕过缺陷。
- `#06-15-1` 与既有 `#06-01-4` **同根因**（`buildup()` 只清空光环拓扑，未像 `refreshEnemy`
  那样先 `view.reset()` 把计算后怪物恢复至原始怪物），故在 findings 中交叉引用 `#06-01-4`
  而非包装成两个独立缺陷；修复 `#06-01-4` 后本用例可直接取消 skip 转为回归用例。
- `addAura`/`deleteAura` 使用**同一** `FakeAura` 实例（`globalAuraList` 为 `Set`，按身份比较），
  避免用例假绿。
- 必须注册 `new FakeConverter([])`：`buildup()` 仅在 `auraConverter.size > 0 || specialQueryEffects.size > 0`
  时才执行 `buildupSpecials()`/`buildupBase()`，否则光环基础效果不会被施加。
- 本计划不引入任何新码、不新增依赖、不测 `saveState`/`loadState`（D-09/D-32），
  不修改任何生产/核心源码（D-46）。

## Deviations from Plan

### Plan-sanctioned deviation（非 auto-fix，属计划 D-05 明文路径）

**1. [Plan D-05 / D-43] 用例由「可跑绿」变为「正确预期 `it.skip`」**
- **Found during:** Task 1（阶段 1 构件级）
- **Issue:** 计划 `<success_criteria>` 与硬约束要求该用例可跑绿并断言 `deleteAura` 后 `atk` 回到 `2`。
  实测（临时取消 skip）为 `5`：`buildup()` 不在重建前 `reset()` 各视图，
  删除光环后此前已叠加到计算后怪物上的 `+3` 不被撤销。
- **Fix:** 按计划 `<action>` 的明文约定——「若该用例在正确预期下无法跑绿（例如 `deleteAura`
  后光环仍生效），**不得弱化断言**——按 D-05 写正确预期 + `it.skip` 并登记
  `06-TEST-FINDINGS.md` 的 `#06-15-N`」——保留三条正确预期断言并标记 `it.skip`，
  追加 `06-TEST-FINDINGS.md` `#06-15-1`（交叉引用 `#06-01-4`）。
- **Files modified:** `packages-user/data-system/src/combat/context.test.ts`（`it.skip` 与注释）、
  `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md`（`#06-15-1`）
- **Verification:** 聚焦运行 `pnpm exec vitest run packages-user/data-system/src/combat/context.test.ts`
  → 39 passed / 1 skipped；`pnpm test:ci` → 66 文件 / 649 passed / 28 skipped 全绿
- **Committed in:** `65251f5`（阶段 1）
- **说明：** 计划 `<files_modified>` frontmatter 只列了 `context.test.ts` 与 `06-COVERAGE-MAP.md`，
  但计划 `<output>` 与 D-05/D-06 明确要求发现缺陷时登记 `06-TEST-FINDINGS.md`，
  故将 `06-TEST-FINDINGS.md` 一并纳入阶段 1 提交。

**未执行的可选加强项：** 计划 `<action>` 中「可选加强」建议在步骤 4 之后再次
`addAura(aura)` + `buildup()` 断言 `atk` 又回到 `5`。因同一根因下该断言同样不可跑绿
（实际会得到 `8` = 5 + 3），且它只是同一缺陷的第三次观测，故未加入，以保持用例最小、
断言最聚焦。

---

**Total deviations:** 1（计划 D-05 明文路径，非 auto-fix；无 Rule 1-4 auto-fix）
**Impact on plan:** G-06-01-D 用例本身落地且真实可判定，但**未能按计划预期跑绿**；
`EnemyContext.deleteAura` 的接口判据仍未由一条可跑绿用例满足，缺口状态从
「0 测试引用」变为「有正确预期 `it.skip` + 已登记缺陷锚点」。**需用户确认后续处置**
（修复 `#06-01-4`/`#06-15-1` 后取消 skip，或长期保留 skip）。无范围蔓延，无生产代码改动。

## Issues Encountered

- **阻断性实现缺陷（计划已预判的失败分支）**：`deleteAura` 后再次 `buildup()` 不会把计算后怪物
  恢复至原始怪物，属性停留在旧值 `5`。根因与既有 `#06-01-4` 完全一致——`buildup()` 内只清空
  `sortedAura`/`convertedAura` 等拓扑集合，未对每个视图调用 `reset()`；
  只有局部刷新路径 `refreshEnemy()`（`context.ts:784`）会 `view.reset()`。
  已按 D-05 记录、未修改核心代码。
- 首次聚焦运行即为红灯，验证了该用例不是「删了不报错」式空转——正是计划 `<verification>`
  的 `fails_when` 中「未断言属性回到基础值 `2`」之外的更强信号：断言存在且真实失败。

## D-44 Quality Gate Results

| 阶段 | `eslint --fix` | `eslint <改动文件>` | `vue-tsc`（按文件路径过滤） | 聚焦运行 | `pnpm test:ci` |
| --- | --- | --- | --- | --- | --- |
| 1 | exit 0 | 0 错误 | 0 类型错误（全局既有无关错误 28 条不变） | 39 passed / 1 skipped | 66 文件 / **649 passed** / 28 skipped |
| 2 | n/a（`06-COVERAGE-MAP.md` 非 JS，eslint 无匹配配置 → 0 错误） | 0 错误 | 0 类型错误（28 条不变） | — | 66 文件 / **649 passed** / **28 skipped** |

- `vue-tsc --noEmit` 过滤 `combat/context.test.ts` 命中 0 条；28 条既有无关错误全部位于
  `client-modules` / `legacy-plugin-data` / `legacy-ui`（D-44 明确排除范围）。
- `git status` 最终仅含本计划三个规划/测试文件；无生产/核心源码改动，
  无 06-01..06-14 计划改动。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **06-15 小节已落地**：`06-COVERAGE-MAP.md` 06-15 小节登记 G-06-01-D 映射并注明无新增码；
  既有小节与 code 表行逐字未变。
- **`#06-15-1` 待用户裁决**：与 `#06-01-4` 同根因。处置选项：
  1. 在后续修复批次修复 `buildup()` 的视图重置（推荐）→ 同时解 `#06-01-4` 与本条 2 条 skip；
  2. 与用户确认后把 `deleteAura` 从 D-30「每公开方法 ≥1 正常用例」判据中排除。
- **接口判据状态**：D-27/D-30 的「每公开方法至少一条正常用例」在 `context.test.ts` 侧
  仍差 `deleteAura` 一条**可跑绿**用例（现为受阻塞的正确预期 skip）；
  该缺口已在覆盖表与 findings 中显式登记，不再是无记录的漏测。
- `pnpm test:ci` 全绿（66 文件 / 649 passed / 28 skipped），D-44 三项文件级门禁全部通过。

---
*Phase: 06-unit-tests*
*Completed: 2026-09-15*

## Self-Check: PASSED

- FOUND: `.planning/phases/06-unit-tests/06-15-SUMMARY.md`
- FOUND: `packages-user/data-system/src/combat/context.test.ts`
- FOUND: `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md`
- FOUND: `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md`
- FOUND: commit `65251f5`（阶段 1）
- FOUND: commit `d3eb4d2`（阶段 2）
