# Phase 6: 单元测试 - 阶段级 code → 模块 → 用例 覆盖表

> 本文件为**共享 create-or-append**文件（幂等、顺序无关）：各计划只追加/更新自己的小节，
> 绝不重写他节。表头固定为 `| code | 模块 | 用例 | 计划 |`，因此任何 wave 1 计划的执行顺序
> 都不影响最终结果。码表权威来源为 `packages/common/src/logger.json`。

| code | 模块 | 用例 | 计划 |
| --- | --- | --- | --- |
| 97 | combat/context.ts | `warns 97 when multiple converters match the same special` | 06-01 |
| 98 | combat/context.ts | `warns 98 when deleting an aura of the current priority`、`warns 98 when modifying an aura of the current priority` | 06-01 |
| 99 | combat/context.ts | `warns 99 and skips a higher-priority nested aura` | 06-01 |
| 100 | combat/context.ts | `warns 100 when both add and delete are non-empty` | 06-01 |
| 101 | combat/context.ts | `warns 101 when a local refresh removes a converted special`、`warns 101 when a local refresh adds a converted special` | 06-01 |
| 110 | combat/context.ts | `warns 110 and skips buildup without a bound hero` | 06-01 |
| 106 | combat/damage.ts | `warns 106 when the calculator is missing` | 06-01 |
| 107 | combat/damage.ts | `warns 107 when hero status is missing` | 06-01 |
| 102 | combat/mapDamage.ts | `warns 102 when the converter is missing during a full refresh` | 06-01 |
| 103 | combat/mapDamage.ts | `warns 103 when the reducer is missing` | 06-01 |
| 104 | combat/mapDamage.ts | `warns 104 when marking an unregistered enemy dirty` | 06-01 |
| 138 | combat/combat.ts | `warns 138 for collaborators bound to a foreign state` | 06-01 |
| 139 | combat/combat.ts | `warns 139 when a required collaborator is missing` | 06-01 |
| 140 | combat/combat.ts | `sorts scripts by descending priority and rejects duplicates` | 06-01 |
| 141 | combat/combat.ts | `warns 141 when the damage context cannot produce damage info` | 06-01 |
| 137 | enemy/calculator.ts | `warns 137 when a guard locator has no enemy` | 06-02 |

## 06-01 战斗系统（packages-user/data-system/src/combat）

模块归属：97 / 98 / 99 / 100 / 101 / 110 → `combat/context.ts`（`EnemyContext` 光环流水线）；
106 / 107 → `combat/damage.ts`（`DamageContext` / `DamageSystem`）；
102 / 103 / 104 → `combat/mapDamage.ts`（`MapDamage`）；
138 / 139 / 140 / 141 → `combat/combat.ts`（`CombatFlow`）。105 在当前实现不可达，排除。

阶段 1（构件级）不产生 warn/error 码断言。阶段 2（组合/流水线）已完成 97/98/99/100/101/110；
阶段 3（完整/集成）已完成 106/107/102/103/104/138/139/140/141。105 在当前实现不可达，排除。
`#06-01-1..4` 为疑似缺陷的 `it.skip` 正确预期用例，详见 `06-TEST-FINDINGS.md`。

## 06-02 顶层战斗实现（packages-user/data-state/src/enemy）

模块归属：137 → `enemy/calculator.ts`（`MainDamageCalculator.calculate` 的支援怪缺失守卫路径）。

阶段 1（构件级）完成 `calculator` / `final` / `comparer` 单分支单元；
阶段 2（组合/流水线）完成 `CommonAura`/`GuardAura` 转换器 → 施加流水线与 `registerSpecials` 注册；
阶段 3（完整/集成）完成 mapDamage 五视图 + `MainMapDamageConverter` + `MainMapDamageReducer`。
本计划只覆盖顶层实现**基本功能**（D-35），跨特殊属性/光环的组合语义见 06-07；
无 `it.skip`/`it.todo`，`06-TEST-FINDINGS.md` 无 `#06-02-N` 条目。
