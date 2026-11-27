# 08-04 SUMMARY — data-base hero 对齐

**执行日期:** 2026-10-04
**计划:** `08-04-PLAN.md`
**状态:** 完成（聚焦 11 文件 / 114 passed + 1 skipped；eslint 0；已提交）

## Task 0 裁决与执行期追加裁决（用户）

- **Q1 = B**：生产实现 `HeroLocation.setFloor` 改收 `IGameMap | null`，`null` 清空楼层。
- **Q2**：录像桩 `ReplayRouteStub`/`route` → `ReplayArrayStub`/`array`（同步注释）。
- **Q3**：`HeroItems.getItem` 已删，改用 `addItem`。
- **P1（更正后）**：`EquipmentState` 同实例读档失败属**测试用法过时**（生产 `HeroEquipsStore.loadState` 始终读入新实例）；改为「读档到新实例」对齐，**不改生产**。
- **P2（生产修复）**：`HeroEquipment.loadState` 补 `replay.disable()`/`replay.revert()` 包裹重新装备循环（WR-06 回归，`7743795` 丢失）。
- **P3 = A**：容器 `IHeroState` 已移除 `rendering`/`followers`（归渲染端）；测试移除相应引用与容器覆盖。

## 生产改动（2 处，均经批准）

| 文件 | 改动 |
|------|------|
| `hero/location.ts` | `setFloor(map: IGameMap \| null)`；`null` 时 `floorId=undefined`、`map=null`、通知 `onSetFloor(null)`（Q1=B） |
| `hero/equipment.ts` | `loadState` 的重新装备循环用 `replay.disable()`/`replay.revert()` 包裹，避免读档写录像（P2） |

## 测试对齐改动（11 test + 1 perf 声明文件）

- 录像桩 `route`→`array`：`equipment`/`items`/`follower`/`mover`/`saveLoad`。
- 删全部 `addHook(...).load()`：`follower`(8)/`location`(1)/`rendering`(2，含 `controller.load()`)/`state`(2)。
- `new ItemStore(tileStore)`：9 处（`ItemStore` 现需 `tileStore` 入参）。
- `attribute.test.ts`：`BaseHeroModifier` 改自 `../modifier` 导入（原误从 `../attribute`）。
- `items`：`getItem`→`addItem`；`equip.value/percentage` 由 `new Map` → `Object.fromEntries`（shipped 为 `Record`）。
- `equipStore`/`equipment`/`saveLoad`：`item.equip.value/percentage` 同上。
- `setFloor('<string>')` → 真实 `IGameMap`（`MapState.createMap`）：`location`/`state`/`saveLoad`。
- `setFloor(undefined)` → `setFloor(null)`（`location.test.ts`），并补覆盖 `[floor, null]`。

## 同引用相关歧义（已按用户既有裁决对齐，供知悉）

| 位置 | 现状 | 处置 |
|------|------|------|
| `equipStore` #06-17-4 同引用保留 | 被用户 `7743795`（2026-09-23）改为 clear+重建 | 测试改为「读档重建实例、值恢复」 |
| `flag` #06-17-5 同引用保留 | 被用户 `d74cc35`（2026-09-23）改为 clear+新建 | （08-03 已同向对齐） |
| `HeroState` 容器 `equipment` 读档 | 随 equipStore 重建 | 测试改为「重建实例、值恢复」 |
| `HeroState` 容器 `followers` 读档 | 容器已不含 `followers` | 移除该 describe（覆盖已在 `follower.test.ts` 的 `restoreFollowers` 用例） |
| `HeroState` 容器 `rendering` | 容器已不含 `rendering` | 移除引用 |
| `HeroState` `attribute` 读档 | 属性**保持同引用**（07-09 设计，仍生效） | 相关 `#06-17-1` 用例保持通过 |

## 门禁证据

- `pnpm exec vitest run packages-user/data-base/src/hero/__test__` → **11 passed / 114 passed + 1 skipped**（唯一 skip = `equipment.test.ts` 码 147，D-04 保留）。
- `pnpm exec eslint --fix` 后 **0 报错**。
- 非测试生产改动仅 `hero/location.ts`、`hero/equipment.ts`（均经批准）。
- 仓库级 skipped 仍为 1。

## 并发保护（D-08）

- 未触碰、未暂存、未提交任何用户并发改动。
