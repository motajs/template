# Phase 6: 单元测试 - 问题记录

> 本文件为**共享追加式**问题记录。各计划只追加自己的 `#06-XX` 小节，绝不重写其它小节。
> 单测暴露疑似 bug 时，测试按**正确预期**编写并标记 `it.skip` / `it.todo`，同时在此登记
> 对应条目；`pnpm test:ci` 必须保持全绿（06-CONTEXT D-05 / D-06）。

每条记录包含以下字段：

| 字段 | 含义 |
| --- | --- |
| 模块/接口 | 出问题的模块与具体接口 |
| 现象 | 观察到的行为 |
| 最小复现 | 触发条件与输入 |
| 疑似原因 | 当前对根因的判断 |
| 影响面 | 受影响的调用方/功能 |
| 建议修复方向 | 建议的修法（本阶段不修改核心代码） |
| 关联 skip 用例 | 指向对应 `it.skip` / `it.todo` 的用例名 |
| 严重度 | 高 / 中 / 低 |

---

## #06-01 战斗系统（data-system/src/combat）

| 模块/接口 | 现象 | 最小复现 | 疑似原因 | 影响面 | 建议修复方向 | 关联 skip 用例 | 严重度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `damage.ts` `DamageContext.calculateCritical` / `findNextCritical` | 产出的临界点 `info` 与 `nextValue` 不对应 | 假计算器 `damage = 100 - atk * 10`、`getCriticalLimit = 10`、当前 `atk = 0`；首个临界点 `nextValue = 1`（正确伤害应为 90），但 `info.damage = 0`、`damageDiff = -100` | `findNextCritical` 在 `middleInfo.damage < referenceDamage` 分支只更新 `right`，从不更新 `targetInfo`，`targetInfo` 一直停留在初始 `upperLimit` 处的计算结果 | 临界点查询（数值提示、战斗模拟）展示的伤害与对应属性值不匹配 | 在 `middleInfo.damage < referenceDamage` 分支同步 `targetInfo = middleInfo`，或二分结束后按最终 `right` 重新计算一次 | `damage.test.ts` `reports the damage info matching the yielded critical value`（#06-01-1） | 中 |
| `mapDamage.ts` `MapDamage.deleteEnemy` | 删除怪物后，该怪物产生的有来源地图伤害仍然存在 | 注册一个怪物视图并转换出伤害（假视图伤害 7）→ `getSeparatedDamage` 有 1 条 → `deleteEnemy(view)` → `getSeparatedDamage` 仍有 1 条（正确应为 0） | `viewStore` 与 `damageStore` 只在读/删路径出现，全文件没有任何 `.set(...)` 写入，因此 `deleteEnemy` / `removeEnemyAffecting` 中 `viewStore.get(viewItem)` 恒为 `undefined`，清理循环被整体跳过；`sourcedDamage` 点位与 `affectedBy` 都不会被移除 | 怪物死亡/离场后地图伤害不消失，`getSeparatedDamage` / `getReducedDamage` 继续返回幽灵伤害，并会污染后续 `refreshIndex` 的重新聚合 | 在 `refreshEnemy` / `refreshEnemyAndClearCache` 建立 sourced 伤害时同步写入 `viewStore.set(viewItem, { damages, enemy })` 与 `damageStore.set(damage, { sourceView, sourceEnemy, index })`，或改为在 `deleteEnemy` 中直接遍历 `sourcedDamage` 的 `affectedBy` 反向清理 | `mapDamage.test.ts` `removes enemy-sourced damage when the enemy is deleted`（#06-01-2） | 中 |
