---
phase: 06-unit-tests
plan: "10"
subsystem: testing
tags: [vitest, combat, map-damage, aura, enemy-combination, gap-fill]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 06-01 combat L2 (EnemyContext/MapDamage) and 06-02/06-07 enemy top-level (MainDamageCalculator/CommonAura/GuardAura/MainEnemyFinalEffect)
provides:
  - G-06-01-A four effect kinds together with final attribute assertions
  - G-06-01-B cross-enemy nested aura with range-boundary assertions
  - G-06-01-C same-point multi-source map damage stacking
  - G-06-07-A maximum-pipeline single-monster exact {damage, turn}
affects: [06-verify, milestone-v1.0]

actuals:
  tokens: 5054
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "inline semantic map-damage reducer + typed fake view (damage sum / max type / extra union)"
    - "inline fake IAuraConverter/IAuraView assembly for cross-enemy nested auras (D-21)"
    - "real CoreState + real MainDamageCalculator maximum-pipeline integration with per-branch derivation comments"

key-files:
  created: []
  modified:
    - packages-user/data-system/src/combat/mapDamage.test.ts
    - packages-user/data-system/src/combat/context.test.ts
    - packages-user/data-state/test/enemyCombination.test.ts
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md

key-decisions:
  - "G-06-01-C 以文件内联语义 reducer 断言「伤害求和 / 类型取最大 / 额外标记并集」，不导入顶层 MainMapDamageReducer"
  - "G-06-01-A/B 全程用内联 FakeAura/FakeConverter 驱动，不引用顶层真实实现（D-21）"
  - "G-06-07-A 用真实 CoreState + 真实 MainDamageCalculator；对照用例去掉支援怪证明支援流水线确实生效"
  - "本计划不引入任何新码，06-COVERAGE-MAP.md 只追加 06-10 映射小节（create-or-append）"

patterns-established:
  - "缺口补测计划按 D-43 三阶段执行，每阶段聚焦跑绿 + D-44 门禁后才提交"
  - "复杂最大组合的精确值在注释中逐项推导（基础伤害 + 各 special + 光环/支援 + final）"

requirements-completed: [TEST-01]

coverage:
  - id: G-06-01-A
    description: "四类效果（光环基础 + 常规查询 + 特殊查询 + final）同时生效的四阶段顺序与最终 atk/def/hp/special"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/context.test.ts"
        status: pass
    human_judgment: false
  - id: G-06-01-B
    description: "m1 产生 A1 → 施加 m2 → m2 生成 A2 → 反向施加全体的跨怪嵌套光环与范围边界"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/context.test.ts"
        status: pass
    human_judgment: false
  - id: G-06-01-C
    description: "同点多来源地图伤害叠加（有来源+有来源 / 无来源+无来源 / 混合多来源）的 separated/reduced"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-system/src/combat/mapDamage.test.ts"
        status: pass
    human_judgment: false
  - id: G-06-07-A
    description: "最大流水线组合单怪经真实计算器的唯一精确 {damage,turn} 与去支援对照"
    requirement: "TEST-01"
    verification:
      - kind: integration
        ref: "packages-user/data-state/test/enemyCombination.test.ts"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-09-15
status: complete
plan_head_before: 714b791
---

# Phase [06]: [unit-tests] Plan [10] Summary

**按 D-43 三阶段补齐 06-01/06-07 覆盖缺口：同点多来源地图伤害叠加、四类效果同时生效的最终属性、多怪跨施加嵌套光环，以及最大流水线组合单怪的精确最终伤害**

## Performance

- **Duration:** 15 min
- **Tasks:** 3 (3 阶段任务)
- **Files modified:** 4 (3 既有测试文件 + 1 规划产物)

## Accomplishments

- **阶段 1（构件级）G-06-01-C** `mapDamage.test.ts`：新增内联 `createTypedInfo` / `FakeTypedView` / `SemanticReducer`，覆盖三种同点叠加组合 —— 有来源+有来源（separated 2、reduced.damage 11）、无来源+无来源（separated 2、reduced.damage 8）、混合多来源（separated 4、damage 16、type 取最大 2、catch/repulse 并集）。
- **阶段 2（组合/流水线）G-06-01-A/B** `context.test.ts`：G-06-01-A 让一只怪同时受光环基础 + 常规查询 + 特殊查询 + final 效果，断言四阶段顺序（`special < base < query < final`）与最终 `atk 7 / def 2 / hp 14 / special 21`；G-06-01-B 构造 m1→A1→m2→A2→全体，断言三只怪最终 `atk 5/107/9`、m2 独占 special 21、A1 矩形范围边界可观测（m1/m3 不受 A1 加成）。
- **阶段 3（完整/集成）G-06-07-A** `enemyCombination.test.ts`：一只怪同时携带 10 个顶层 special（先攻/魔攻/坚固/2连击/多段/破甲/反击/吸血/仇恨/固伤）+ 真实光环 25 + 真实支援 26 + 常规查询 + 特殊查询 + 自定义 final + 真实 `MainEnemyFinalEffect`，经真实 `MainDamageCalculator` 断言唯一精确 `{damage: 3059, turn: 37}` 且仅含 damage/turn 两字段；对照用例去掉支援怪得到不同的 `{2882, 35}`。
- 写入 `06-COVERAGE-MAP.md` 的 06-10 小节（create-or-append，列出 G-06-01-A/B/C、G-06-07-A → 用例映射，注明无新增码）。

## Task Commits

Each task was committed atomically:

1. **Task 1: 阶段 1 G-06-01-C 地图伤害叠加** - `fcba44c` (test)
2. **Task 2: 阶段 2 G-06-01-A/B 四类效果 + 跨怪嵌套光环** - `ef95cc7` (test)
3. **Task 3: 阶段 3 G-06-07-A 最大流水线组合 + 06-10 覆盖表** - `f01c23e` (test)

**Plan metadata:** 见最终 docs 提交（本 SUMMARY + STATE.md + ROADMAP.md + 06-TEST-FINDINGS.md）

## Files Created/Modified

- `packages-user/data-system/src/combat/mapDamage.test.ts` — 新增内联类型化伤害信息/视图/语义 reducer 与 3 条叠加用例（14 通过 / 1 跳过）
- `packages-user/data-system/src/combat/context.test.ts` — 新增 G-06-01-A、G-06-01-B 两条用例（39 通过，阶段 2 后）
- `packages-user/data-state/test/enemyCombination.test.ts` — 新增最大流水线组合与去支援对照两条用例（14 通过）
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` — 追加 `## 06-10` 小节（无新增码）

## Decisions Made

- G-06-01-C 的语义 reducer 按计划内联实现「伤害求和 / 类型取最大 / 额外标记并集」，只经 `getSeparatedDamage` / `getReducedDamage` 公开方法断言，不读取内部缓冲、不导入顶层 `MainMapDamageReducer`。
- G-06-01-A/B 全部经文件内联 `FakeAura` / `FakeConverter` 手动装配驱动，明确切开系统层与顶层真实实现边界（D-21）。
- G-06-07-A 的数值在注释中逐项推导；推导中确认「光环 25 为全局范围、会同时加成相邻支援怪」，故支援递归按支援怪 `atk 18`（含光环 +4 与自定义 final +6）计算。

## Deviations from Plan

None - plan executed exactly as written.

> 说明（非缺陷）：阶段 1 计划措辞将叠加语义描述为「type 取最大」，与顶层 `MainMapDamageReducer`「取最大伤害项的 type」不同；本计划按 plan 措辞以文件内联语义 reducer 实现并断言（reduced.type === 最大 type），未改动任何生产代码。

## Issues Encountered

- 首次运行阶段 3 最大组合断言得 `{3059, 37}` 而非手算 `{3055, 37}`：复核为推导遗漏「光环 25 全局加成相邻支援怪」，按实现语义修正期望值并在注释中补全推导；非生产缺陷、非测试弱化。
- 无 `it.skip`/`it.todo`：本计划未发现疑似缺陷，`06-TEST-FINDINGS.md` 无 `#06-10-N` 条目。

## Quality Gate (D-44)

每个阶段提交前均执行并全部通过：

- (a) `pnpm exec eslint --fix` 后 `pnpm exec eslint <改动文件>`：0 错误
- (b) `pnpm exec vue-tsc --noEmit` 按改动测试文件路径过滤：0 类型错误
- (c) `pnpm test:ci` 全绿：阶段 1 后 632 通过 / 20 跳过；阶段 2 后 634 通过 / 20 跳过；阶段 3 后 **636 通过 / 20 跳过**（66 文件）

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 06-01/06-07 的人工评审覆盖缺口 G-06-01-A/B/C、G-06-07-A 已补齐并跑绿；无生产代码改动。
- 剩余缺口计划（06-11 map、06-12/06-13）不受本计划影响。

---

*Phase: 06-unit-tests*
*Completed: 2026-09-15*

## Self-Check: PASSED

- FOUND: packages-user/data-system/src/combat/mapDamage.test.ts
- FOUND: packages-user/data-system/src/combat/context.test.ts
- FOUND: packages-user/data-state/test/enemyCombination.test.ts
- FOUND: .planning/phases/06-unit-tests/06-10-SUMMARY.md
- COMMIT FOUND: fcba44c (stage 1)
- COMMIT FOUND: ef95cc7 (stage 2)
- COMMIT FOUND: f01c23e (stage 3)
