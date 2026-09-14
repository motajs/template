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

## 06-01 战斗系统（packages-user/data-system/src/combat）

模块归属：97 / 98 / 99 / 100 / 101 / 110 → `combat/context.ts`（`EnemyContext` 光环流水线）；
106 / 107 → `combat/damage.ts`（`DamageContext` / `DamageSystem`）；
102 / 103 / 104 → `combat/mapDamage.ts`（`MapDamage`）；
138 / 139 / 140 / 141 → `combat/combat.ts`（`CombatFlow`）。105 在当前实现不可达，排除。

阶段 1（构件级）不产生 warn/error 码断言。阶段 2（组合/流水线）已完成 97/98/99/100/101/110；
106/107/102/103/104/138/139/140/141 对应的具体用例名将在阶段 3 完成后补全。
