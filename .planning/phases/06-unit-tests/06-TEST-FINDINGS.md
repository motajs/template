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
| `combat.ts` `CombatFlow.combatFlow` / `ICombatScript.before` | 实现与接口文档语义相反：接口声明返回 `false` 放弃战斗，实现却在返回**真值**时短路 | 加载一个 `onBeforeCombat` 钩子，脚本 `before` 返回 `false`；`battle()` 仍会执行该钩子（正确实现应直接返回并放弃） | `const skip = await script.before(...); if (skip) return damage;` 以真值短路，与文档「返回 false 会立刻停止并放弃此次战斗」相反；文档或实现其一有误 | 所有战斗脚本的短路约定：按接口文档编写的脚本会得到相反效果，可能漏战或误战 | 先与接口设计者确认语义，再二选一统一：以 `true` 短路为准则修正接口注释，以文档为准则改为 `if (!skip) return damage;` | `combat.test.ts` `abandons the battle when the before script returns false`（#06-01-3） | 中 |
| `context.ts` `EnemyContext.buildup` | 重复调用 `buildup()` 会重复累加光环效果，而非从原始怪物重新计算 | 绑定勇士 → 放置基础 `atk = 2` 且带特殊属性的怪物（假转换器产出 `atk + 5` 的光环）→ `buildup()`（计算后 `atk = 7`）→ `addAura`（全局光环 `atk + 10`）→ `buildup()`；正确应为 `2 + 5 + 10 = 17`，实际为 `22`（`+5` 又被叠加一次） | `buildup` 只清空光环拓扑（`sortedAura` / `convertedAura` 等），未像 `refreshEnemy` 那样对每个视图调用 `reset()` 把计算后怪物恢复至原始怪物，导致 `buildupBase` / `buildupQuery` / `buildupFinal` 在既有计算结果上继续叠加 | 任何在已有怪物视图上再次触发的全量构建（重新绑定勇士、注册/注销光环转换器或效果后再构建）都会放大怪物属性 | 在 `buildup` 进入各效果阶段前对每个视图调用 `reset()`，或在重建开始时重建全部计算后怪物 | `damage.test.ts` `recomputes a repeat buildup from the base enemy without compounding`（#06-01-4） | 中 |

## #06-02 顶层战斗实现（data-state/src/enemy）

本计划未发现疑似 bug，无 `it.skip` / `it.todo`，`pnpm test:ci` 全绿（29 文件 / 223 通过 / 3 跳过）。

仅有一处**计划措辞与实现不符**（非代码缺陷，不登记为 bug）：`mapDamage.ts` 的 `BetweenDamageView.getDamageWithoutCheck` 计划描述为「两个 delta 都为正才命中」，实现实际是排除 `deltaX <= 0 && deltaY <= 0`，即向右/向下相邻格命中、向左/向上不命中。该方向偏置使相邻两只怪中只有一只的视图产出伤害，从而避免同一对怪被重复计算，属实现的有意去重。测试按实现实际语义断言（`packages-user/data-state/src/enemy/mapDamage.test.ts`），无跳过用例。

| 模块/接口 | 现象 | 最小复现 | 疑似原因 | 影响面 | 建议修复方向 | 关联 skip 用例 | 严重度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| （无） | — | — | — | — | — | — | — |

## #06-03 怪物数据模型（data-base/src/enemy）

本计划按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）执行，发现 1 处疑似 bug（`#06-03-1`），
按 D-05 以 `it.skip` 的正确预期用例登记；`pnpm test:ci` 全绿（32 文件 / 291 通过 / 5 跳过，
其中 1 条为本计划新增 skip）。D-32：不测 `saveState`/`loadState`，119/120 归 06-09。
D-30：`registerSpecial` 的覆盖语义只能经被排除的 legacy 转换路径观测，故仅覆盖
「注册/重复注册不报错」的最小正常用例。

| 模块/接口 | 现象 | 最小复现 | 疑似原因 | 影响面 | 建议修复方向 | 关联 skip 用例 | 严重度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `manager.ts` `EnemyManager.createEnemy` / `createEnemyById` | 注册复用映射后，按复用 code/id 创建怪物返回 `null` | `addPrefab(code=1, id='slime')` → `reusePrefab(1, 100, 'slime-reuse')` → `createEnemy(100)` 返回 `null`，而 `getPrefab(100)` 能解析到来源模板 | `createEnemy`/`createEnemyById` 直接 `prefabByCode.get(code)`/`prefabById.get(id)`，未像 `getPrefab`/`getPrefabById`/`internalGetPrefab` 那样先经 `reuseByCode`/`reuseById` 解析 | 复用映射（面朝方向图块复用同一模板）对应的 code/id 无法生成怪物；当前生产代码尚无调用方，属潜在功能缺口 | 在 `createEnemy`/`createEnemyById` 中改用 `internalGetPrefab`（或先查复用映射再取模板） | `manager.test.ts` `creates enemies for reused codes and ids through the reuse mapping`（#06-03-1） | 中 |

## #06-04 录像系统（packages-user/data-common/src/replay）

本计划按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）执行，发现 4 处疑似 bug
（`#06-04-1..4`），均按 D-05 以正确预期的 `it.skip` 用例登记；`pnpm test:ci` 全绿
（36 文件 / 347 通过 / 9 跳过，其中 4 条为本计划新增 skip）。D-32：不测存读档；
D-40：不做完整播放/二次录制（归 06-07），`error 2001–2008` 未触及。

| 模块/接口 | 现象 | 最小复现 | 疑似原因 | 影响面 | 建议修复方向 | 关联 skip 用例 | 严重度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `array.ts` `ReplayArray.get`（int64 解码） | int64 参数写入后读回值与写入值不同 | `array.add(0, [2147483648])` → `array.get(0).params` 得到 `[2147483647]`，应为 `[2147483648]` | `decodeParam` 的 type 4 分支为 `value = low + high * 2147483647`，乘数应为 `2^31 = 2147483648` | 所有超出 int32 范围（int64 位宽）的录像参数读回值偏移 `high`；二次录制比对会误判不一致 | 将乘数改为 `2147483648` | `array.test.ts` `round-trips int64 values above the int32 range`（#06-04-1） | 中 |
| `array.ts` `ReplayArray`（bigint 编码） | 多字节 bigint 编码只保留最低字节，其余写 0，读回值远小于写入值 | `array.add(0, [0x0102030405060708n])` → `array.get(0).params` 得到 `[8n]`，应为 `[0x0102030405060708n]` | `normalizeParam` 编码循环 `base = param - total; remain = base % 256n` 未按字节右移，`total` 仅累积低位，导致 i≥1 时 `remain` 恒为 0；解码又用 `getInt8` 读无符号字节 | 任何需要 >1 字节的 bigint 参数无法正确往返 | 编码改为按位取字节（如 `(param >> (8n * BigInt(i))) % 256n`），解码改用无符号字节 | `array.test.ts` `round-trips a multi-byte bigint`（#06-04-2） | 中 |
| `array.ts` `ReplayArray.delete` | 删除中间步骤后索引数组未按删除位置回退，后续步骤读到错误参数 | `add(1,[10])`、`add(2,[20])`、`add(3,[30])` → `delete(1)` → `get(1).params` 期望 `[30]`，实际 `[false]` | 回退循环 `for (let i = paramStart; i < this.length; i++) this.indexArray[i] -= paramLength` 以 `paramStart`（参数字节偏移）当作命令索引起点，应从 `index` 起；且 `indexArray[index+1]` 对末步取到未初始化 0 | 删除任意非首步都会破坏其后步骤的参数读取；录像编辑不可靠 | 回退从 `index` 起（`for (let i = index; i < this.length; i++)`），并以 `paramUsed` 或哨兵替代 `indexArray[length]` 表示末步参数终点 | `array.test.ts` `deletes a middle step and shifts later param indexes`（#06-04-3） | 中 |
| `array.ts` `ReplayArray.insert` | 已有参数时插入步骤会丢失插入点之后的参数 | `add(1,[10])`、`add(3,[30])` → `insert(1, 2, [20])` → 读流第三条参数期望 `[30]`，实际 `[false]` | `this.paramArray.copyWithin(paramStart, paramStart + length)` 位移方向相反，应把 `[paramStart, …)` 移到 `paramStart + length` | 带参数的录像插入功能不可用，后续步骤参数错位 | 改为 `this.paramArray.copyWithin(paramStart + length, paramStart)` | `array.test.ts` `reads the new order after inserting a step`（#06-04-4） | 中 |
