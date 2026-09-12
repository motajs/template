# 怪物系统文件结构重构

**目的：** 使 `IEnemyHandler` 能持有 `IStateBase` 引用而不产生循环引用。

**循环根源：** `enemy/types.ts` 混写了两层接口，`data-base/src/types.ts` 经由 `./enemy` index 引入 `IEnemyManager`，导致无法反向引用。

## 接口归属

**`enemy/types.ts`（Layer 1 — 存档/管理层，保留）**

只保留以下接口，其余全部迁出：

- `IEnemySaveState`、`IEnemyManagerSaveState`、`IEnemyComparer`
- `ISpecial`、`IReadonlyEnemy`、`IEnemy`
- `SpecialCreation`、`IEnemyLegacyBridge`、`IEnemyManager`

只允许引用 `@motajs/common`、`../common`，不得引用 `../types`。

**`enemy/utils.ts`（Layer 0 — 工具层，与实现类并列）**

从 `enemy/types.ts` 迁出以下接口（实现类 `MapLocIndexer` 已在此文件）：

- `IMapLocHelper`、`IMapLocIndexer`

**`combat/types.ts`（Layer 2 — 战斗/上下文层，现为空文件）**

从 `enemy/types.ts` 迁入以下接口：

- `IEnemyHandler`、`IReadonlyEnemyHandler`、`IEnemyView`
- `IEnemySpecialModifier`、`IAuraView`、`IEnemyAuraView`、`IAuraConverter`
- `IEnemySpecialQueryModifier`、`IEnemySpecialQueryEffect`、`IEnemyCommonQueryEffect`、`IEnemyFinalEffect`
- `IMapDamageInfoExtra`、`IMapDamageInfo`、`IMapDamageView`、`IMapDamageConverter`、`IMapDamageReducer`、`IMapDamage`
- `IEnemyDamageInfo`、`IEnemyCritical`、`CriticalableHeroStatus`、`IDamageCalculator`、`IDamageContext`、`IDamageSystem`
- `IEnemyContext`

需引用 `../enemy/types`（Layer 1）、`../enemy/utils`（Layer 0）、`../types`（`IStateBase`，现在无循环）。在 `IEnemyHandler` 和 `IReadonlyEnemyHandler` 中新增 `readonly state: IStateBase<TAttr, THero>`。

## 文件修改清单

| 文件                     | 操作                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `combat/types.ts`        | 迁入所有 Layer 2 接口；新增三条 import（`../enemy/types`、`../enemy/utils`、`../types`）；`IEnemyHandler` 系列加 `state` 字段 |
| `combat/context.ts`      | 从 `enemy/context.ts` **移动**；import 路径改为从 `./types`、`../enemy/types`、`../enemy/utils` 引入                          |
| `combat/damage.ts`       | 从 `enemy/damage.ts` **移动**；import 路径同上                                                                                |
| `combat/mapDamage.ts`    | 从 `enemy/mapDamage.ts` **移动**；import 路径同上                                                                             |
| `combat/index.ts`        | 新建，`export * from './types/context/damage/mapDamage'`                                                                      |
| `enemy/types.ts`         | 删除所有 Layer 2 接口（迁出后仅剩 Layer 1 内容）                                                                              |
| `enemy/utils.ts`         | 新增 `IMapLocHelper`、`IMapLocIndexer` 接口定义                                                                               |
| `enemy/index.ts`         | 删除对 `context`、`damage`、`mapDamage` 的导出                                                                                |
| `data-base/src/index.ts` | 新增 `export * from './combat'`                                                                                               |
| `data-base/src/types.ts` | `import { IEnemyManager }` 改从 `./enemy/types` 直接引入（`enemy/types.ts` 不再引用 `../types`，无循环）                      |
| `enemy/enemy.ts`         | import 路径无需改动（`IEnemy` 等仍在 `./types`）                                                                              |
| `enemy/manager.ts`       | import 路径无需改动（全部 Layer 1 接口仍在 `./types`）                                                                        |
| `enemy/special.ts`       | import 路径无需改动                                                                                                           |
