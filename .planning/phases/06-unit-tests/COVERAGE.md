# Phase 6: 单元测试 - API Coverage 声明

本阶段不涉及任何外部 API 集成：只新增仓库内的 Vitest 行为测试，被测对象是仅在 Node 环境运行的数据端（`@user/data-common` / `@user/data-base` / `@user/data-system` / `@user/data-state`）。本阶段不新增也不调用任何外部 SDK、HTTP 客户端或 CLI 客户端，因此不存在需要额外声明的外部接口覆盖。

计划 06-01 的 api-coverage 贡献为：`packages-user/data-system/src/combat` 的 Layer-2 战斗契约（`DamageContext` / `DamageSystem` / `MapDamage` / `EnemyContext` / `CombatFlow`）行为覆盖，全部经由项目自身的模块路径与 `@user/data-base` / `@user/data-common` / `@motajs/common` barrel 导入，不 mock 数据层接口本身。
