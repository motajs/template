# Phase 6: 单元测试 - 阶段级 code → 模块 → 用例 覆盖表

> 本文件为**共享 create-or-append**文件（幂等、顺序无关）：各计划只追加/更新自己的小节，
> 绝不重写他节。表头固定为 `| code | 模块 | 用例 | 计划 |`，因此任何 wave 1 计划的执行顺序
> 都不影响最终结果。码表权威来源为 `packages/common/src/logger.json`。

| code | 模块 | 用例 | 计划 |
| --- | --- | --- | --- |

## 06-01 战斗系统（packages-user/data-system/src/combat）

模块归属：97 / 98 / 99 / 100 / 101 / 110 → `combat/context.ts`（`EnemyContext` 光环流水线）；
106 / 107 → `combat/damage.ts`（`DamageContext` / `DamageSystem`）；
102 / 103 / 104 → `combat/mapDamage.ts`（`MapDamage`）；
138 / 139 / 140 / 141 → `combat/combat.ts`（`CombatFlow`）。105 在当前实现不可达，排除。

阶段 1（构件级）不产生 warn/error 码断言。上表各 code 对应的具体用例名将在阶段 2/3 完成后补全。
