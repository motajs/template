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

## #06-05 勇士全部（packages-user/data-base/src/hero）

本计划按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）执行，10 个测试文件全部跑绿；
`pnpm test:ci` 全绿（46 文件 / 412 通过 / 12 跳过）。D-32：不测任何 `saveState`/`loadState`，
equipStore 专属码 58/59 归 06-09。D-30：排除名称含 legacy 的接口/方法。
发现 3 处疑似缺陷（`#06-05-1..3`），按 D-05 以正确预期的 `it.skip` 用例登记；
其中 `#06-05-3` 反映「码 147 在当前实现不可达」，故本计划 147 无法以正常触发断言覆盖，
覆盖表该行标注为跳过用例（见 `06-COVERAGE-MAP.md` 06-05 小节）。

| 模块/接口 | 现象 | 最小复现 | 疑似原因 | 影响面 | 建议修复方向 | 关联 skip 用例 | 严重度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `attribute.ts` `HeroAttribute.recalculateAttribute` | 属性没有任何修饰器时，基础属性变化不会反映到最终属性 | `new HeroAttribute({ hp: 100 })` → `set('hp', 40)` → `add('hp', 5)`；`getBaseAttribute('hp')` 为 45，但 `getFinalAttribute('hp')` 仍为构造时的 100 | `recalculateAttribute` 在 `const modifierList = this.modifier.get(name); if (!modifierList) return;` 处提前返回，未在该分支把基础值写回 `finalAttribute` | 所有尚无修饰器的属性（基础数值、升级/金币/经验等）在 `set`/`add`/`mul`/`div` 后读取最终属性会得到旧值；只有挂上修饰器后才会刷新 | 在无 `modifierList` 时同样执行 `this.finalAttribute[name] = baseValue`（或初始化时同步），保证 final 与 base 在没有加成时一致 | `attribute.test.ts` `reflects base-only changes without any modifier`（#06-05-1） | 中 |
| `equipment.ts` `HeroEquipment.equip`（字符串槽位分支） | 存在空的同名装备槽时仍替换第一个匹配槽位，而不是占用空槽 | `slots = ['weapon', 'weapon']`；先将 A 装备到 `'weapon'`，再装备 B 到 `'weapon'`；实际 B 替换了 slot 0 的 A，slot 1 仍为空（正确预期 A 在 slot 0、B 在 slot 1） | 空槽判断条件写反：`if (empty !== -1 && !this.equips.has(index))` 应为 `empty === -1`；因 `empty` 初值即 -1，条件恒假，`empty` 永远保持 -1，`empty !== -1` 的「占用空槽」分支成为死代码 | 多同名槽位（如双武器槽）时装错位置，可能覆盖已装备道具；同时 `equip` 的空槽直装分支永不执行 | 将条件改为 `empty === -1 && !this.equips.has(index)`，恢复「优先占用空槽、无空槽才替换」的语义 | `equipment.test.ts` `uses the first empty named slot instead of replacing an occupant`（#06-05-2） | 中 |
| `equipment.ts` `HeroEquipment.equip` 码 147 | 无可用装备槽告警（147）在当前实现下不可达 | `slots = []`、装备支持名称槽 `'weapon'` 时调用 `equip(uid, 'weapon')`：`canEquipTo` 因 `hasSlot === false` 先返回 `CannotEquip`，`equip` 提前返回，永远不会进入 `first === -1` 的 147 分支 | `canEquipTo` 的名称槽校验（`hasSlot`）与 `equip` 的 `first === -1` 判定使用同一条件，前者已拦截所有会使后者成立的情形；叠加 `#06-05-2` 的 `empty` 死值，空槽分支同样不可达 | 码 147 属死码，D-31 的 code 全覆盖无法通过触发断言满足；非法名称槽只能得到静默 `undefined` 而无诊断 | 明确 147 的触发语义：或在 `canEquipTo` 放行后由 `equip` 补齐诊断，或在码表中标注该码保留未用并移除死分支 | `equipment.test.ts` `warns code 147 when no equipment slot is available`（#06-05-3） | 低 |

## #06-06 地图全部（packages-user/data-base/src/map）

本计划按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）执行，8 个测试文件全部跑绿
（阶段 1：26 通过；阶段 2：63 通过 / 1 跳过；阶段 3：6 通过）；`pnpm test:ci` 全绿
（53 文件 / 505 通过 / 13 跳过，其中 1 条为本计划新增 skip）。
D-32：不测任何 `saveState`/`loadState`，55/122/124 与存读档往返归 06-09。
D-30：排除名称含 legacy 的接口/方法；两处**计划措辞与实现不符**（非代码缺陷，不登记为 bug）：

- `IMapState` 并没有 `canPass`/`shouldHit`；通行谓词实现在 `data-state/src/hero/predicate.ts`
  （`DefaultPassPredicateImpl`，消费 `IMapState` 的活跃/普通楼层与事件层）。故 `mapState.test.ts`
  只覆盖谓词所依赖的「活跃楼层 → 事件层」数据供给，不测试并不存在的 MapState 谓词方法。
- 计划中的「`createLayerState` 告警 121」实为 `MapState.createMap` 的重复楼层注册告警
  （码 121 的文案沿用了旧名 `MapStore.createLayerState`），测试按真实接口 `createMap` 覆盖。

发现 1 处疑似缺陷（`#06-06-1`），按 D-05 以正确预期的 `it.skip` 用例登记。

| 模块/接口 | 现象 | 最小复现 | 疑似原因 | 影响面 | 建议修复方向 | 关联 skip 用例 | 严重度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mapLayer.ts` `MapLayer.transferToDynamic`（越图分支） | 越图转换发出的诊断码与语义不符：发的是 setEventLayer 专属码 131，且返回 null | 2x2 图层上调用 `layer.transferToDynamic(9, 9)`；`logger.catch` 捕获到码 131（`Cannot set event layer since target map layer does not belongs to current GameMap instance.`），返回 null | `if (!this.inMap(x, y))` 分支写成 `logger.warn(131, x, y)`；对照同文件 `transferToStatic`/`transferToStaticIfSafe` 的越界分支发码 128（`Cannot transfer ... out of bounds.`），此处应为 128 | 越界转换的诊断码错误，人工/回放诊断可能误判为事件层绑定问题；行为（返回 null、不产生动态图块）本身正确 | 将该分支改发 128，与 `transferToStatic` 的越界语义保持一致 | `mapLayer.test.ts` `warns code 128 for an out-of-map transferToDynamic`（#06-06-1） | 低 |

## #06-08 flag + common（packages-user/data-base/src/flag、packages-user/data-common/src/common）

本计划按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）执行，6 个测试文件（`utils` / `indexer`
/ `faceManager` / `face` / `flag/system` / `mover`）全部跑绿；`pnpm test:ci` 全绿
（58 文件 / 563 通过 / 14 跳过，其中 1 条为本计划新增 skip）。D-32：不测任何 `saveState`/`loadState`，
flag 的存读档往返归 06-09。D-30：排除名称含 legacy 的接口/方法。
发现 1 处疑似缺陷（`#06-08-1`），按 D-05 以正确预期的 `it.skip` 用例登记。

| 模块/接口 | 现象 | 最小复现 | 疑似原因 | 影响面 | 建议修复方向 | 关联 skip 用例 | 严重度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mover.ts` `ObjectMover.backward`（`Special` 步的移动方向推导） | 连续后退多个步骤时方向来回摆动，净位移为零且朝向被翻转 | 朝向 `Down` 的 mover 调用 `backward(2)` → `start()` → `await controller.onEnd`，最终坐标为 `(0, 0)` 而非 `(0, -2)`，`faceDirection` 变为 `Up` | `prepareStep` 的后退分支把 `moveDirection` 设为 `opposite(dir)`，而 `getCurrentDirection` 又优先读取非 `Unknown` 的 `moveDirection`；下一步据此再次取反，形成交替 | 多步后退（`backward(count>1)`）无法沿同一轴连续移动，并把 `faceDirection` 翻转；单步后退正常 | 后退步的基准方向应取当前朝向 `faceDirection` 而非被翻转后的 `moveDirection`，或在 `getCurrentDirection` 中区分「停顿时的移动方向」与「本步刚设置的临时移动方向」 | `mover.test.ts` `keeps retreating along the same axis across multiple backward steps`（#06-08-1） | 低 |

## #06-09 存档（独立系统）

本计划按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）执行，6 个测试文件全部跑绿
（阶段 1：enemy 7 通过；hero 16 通过 / 3 跳过；阶段 2：map 9 通过 / 1 跳过、replay 4 通过 / 1 跳过、
flag 3 通过；阶段 3：CoreState 顶层 7 通过 / 1 跳过）。
D-45：公开 `CoreState.saveState(compression)` / `loadState(state, compression)` 对 5 个 saveable
（`@system/hero`/`flags`/`maps`/`enemy`/`replay`）× 3 档压缩整体往返通过；D-10 未触碰 IndexedDB。
本计划可达码 55/58/59/112/113/119/120/122/124/177/178 均已有触发断言（见 `06-COVERAGE-MAP.md` 06-09 小节）。
发现 5 处疑似缺陷（`#06-09-1..5`），按 D-05 以正确预期的 `it.skip` 用例登记（6 条 skip，
经临时取消 skip 验证确为真实失败），详细如下。

| 模块/接口 | 现象 | 最小复现 | 疑似原因 | 影响面 | 建议修复方向 | 关联 skip 用例 | 严重度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `hero/equipStore.ts` `EquipmentState.loadState` | 数值加成读档丢失；`NoCompression` 下百分比表被误写入数值表 | 装备定义 `value={atk:5}`；`saveState(NoCompression)` → 修改修饰器 → `loadState` → `getModifiers()` 中再无该数值修饰器；`LowCompression` 往返后未修改的基础加成也丢失 | `loadNoCompression` 两次遍历 `state.percentage`（第一处应为 `state.value`）；`loadDiff` 先 `clear()` 且仅用存档差异重建，未回退到 `item.equip` 原始定义 | 装备数值加成无法经存档恢复；Low/High 下所有未修改的装备加成丢失，读档后属性偏低 | `loadNoCompression` 第一循环改遍历 `state.value`；`loadDiff` 以 `item.equip.value/percentage` 为基准再叠加 `state.value` 差异 | `hero/saveLoad.test.ts` `restores a value modifier on the same instance`、`keeps unchanged value modifiers for compressed snapshots` | 高 |
| `hero/equipment.ts` `HeroEquipment.saveState` | 存档未深拷贝，`equipped`/`slots` 直接暴露内部引用；随后修改活对象会污染已取出的存档 | `equip(uid,0)` → `saved=equipment.saveState()` → `equipment.unequip(0)` → `equipment.loadState(saved)`：`getEquipped(0)` 为 undefined、`slots` 变为空 | `saveState()` 返回 `{ equipped: this.equips, slots: this.slots }` 未拷贝；`loadState` 又 `this.slots.length=0` 后从同一数组读回 | 内存中直接持有 saveState 结果再继续操作装备的调用方（自动存档栈）会拿到被污染的存档 | `saveState` 返回 `new Map(this.equips)` 与 `[...this.slots]` | `hero/saveLoad.test.ts` `returns an equipment snapshot independent from the live state` | 中 |
| `map/dynamicTile.ts` `DynamicTile.loadState` | 读档不恢复存档中的图块数字，仅恢复事件 | `tile=layer.createDynamic(1,1,0)` → `saved=tile.saveState()` → `tile.set(2)` → `tile.loadState(saved)`：`tile.num()` 仍为 2 | `loadState` 只 `restoreDefaultEvents()` 并覆盖事件，未处理 `save.num` | 同实例读档时图块数字不回到存档点；`MapLayer.loadDynamics` 因先 `createDynamic(block.num)` 掩盖该问题 | `loadState` 按 `save.num` 调用 `set()`（或写入 `tileNum` 并同步 raw） | `map/saveLoad.test.ts` `restores the tile num on the same instance` | 中 |
| `replay/array.ts` `ReplayArray.saveState` / `loadState` | `loadState` 不恢复录像长度与索引，往返后 `length` 仍为修改后的值 | `array.add(1,[10])` → `saved=array.saveState()` → `array.add(2,[20])` → `array.loadState(saved)`：`array.length` 为 2（正确 1） | `loadState` 只替换命令/参数缓冲区与位宽，未设置 `length`/`paramUsed`、未 `rebuildIndexArray`；`IReplayArraySave` 本身不含 length | 直接用 `ReplayArray` 存读档的调用方读档后仍看到修改后的录像；`ReplaySystem.loadState` 走 `setReplayArray` 不受影响 | 存档补上 `length`（或由缓冲区推导），`loadState` 设置 `length` 并 `rebuildIndexArray` | `replay/saveLoad.test.ts` `restores the recorded length on the same instance` | 中 |
| `data-state/src/core.ts` `CoreState.loadState` 码 178 | 码 178 判定与文案相反：缺失 saveable key 同时触发 177/178，存档含「多出的 key」时不告警 | `snapshot.set('@system/extra', null)` → `loadState` 无码 178；`snapshot.delete('@system/flags')` → 同时观测到 177 与 178 | `remain = total.difference(loaded)` 取的是「saveables 中缺失于存档」的键（=177 语义），而非「存档中出现但未加载」的键 | 178 失去独立诊断意义，冗余并可能掩盖真正的版本不一致问题 | 改为 `new Set(state.keys()).difference(new Set(this.saveables.keys()))`，或修正文案 | `data-state/test/saveablesRoundTrip.test.ts` `warns code 178 when the save data has keys that are not loaded` | 低 |

### 阻断项（非 06-09 可达码，超出本计划范围）

**现象**：`pnpm test:ci` 存在**先于本计划、与存读档无关**的既有失败：6 个测试文件失败 / 15 个用例失败
（`data-base/src/hero/equipment.test.ts`、`follower.test.ts`、`items.test.ts`、`mover.test.ts`，
以及因未处理 rejection 计为文件失败的 `data-state/test/dataClosure.test.ts`、`nodeTracer.test.ts`）。

**根因**：用户提交 `cee8439`（feat: 录像记录 & CoreState 存储接口）在
`data-base/src/hero/equipment.ts`、`items.ts`、`mover.ts` 中接入了
`this.state.replaySystem.route.add(...)` 录像记录，但这些既有测试的假 `IDataCommon`
不含 `replaySystem`，导致 `Cannot read properties of undefined (reading 'route')`。
该提交同步更新了 `data-state` 的两个测试文件，但未更新上述 `data-base` 测试。

**影响**：D-44(c)「`pnpm test:ci` 全绿」在 06-09 执行时无法达成；本计划在**不改动这些越界文件**
（硬约束：仅允许新增 6 个 `*.test.ts` 与规划产物）的前提下即**无法修复**。经复核：本计划新增的
6 个文件 41 通过 / 6 跳过，**未新增任何失败**，失败集合与改动前完全一致。

**建议修复方向**：由用户在该提交归属的计划中补齐上述 4 个 `data-base` 测试的假 `replaySystem`
（或为生产侧 `this.state.replaySystem` 增加空值守卫），随后重跑 `pnpm test:ci` 应可全绿。
**严重度**：高（阻塞 06-09 的 D-44(c) 提交门禁与后续完整里程碑验证）。

## #06-07 顶层集成（伤害组合 + 录像完整播放 + 二次录制比对）

本计划按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）执行：阶段 1 真实 API 单特殊属性/单光环
基线；阶段 2 顶层多特殊属性伤害组合 + 系统层光环/效果组合（含 final-effect 阶段顺序、同/跨优先级
顺序与属性→伤害联动）；阶段 3 真实小地图录像播放 + 二次录制逐条比对 + 176 + 2001–2008。
2 个测试文件共 **24 通过 / 1 跳过**（skip 为本计划新增 `#06-07-1`），`pnpm test:ci` 全绿
（66 文件 / 629 通过 / 20 跳过）。此前 `#06-09` 记录的既有 test:ci 回归已由后续提交
（`2ff422a` / `c08f3f8`）修复，D-44(c) 现可全绿。
发现 1 处疑似缺陷（`#06-07-1`），按 D-05 以正确预期的 `it.skip` 用例登记。

| 模块/接口 | 现象 | 最小复现 | 疑似原因 | 影响面 | 建议修复方向 | 关联 skip 用例 | 严重度 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `data-system/src/path/system.ts` `PathfindingSystem` / `PathfindingFinder` | 顶层 `CoreState` 上 `pathfinding.teleportTo` 恒返回 `null` 并告警 173，录像瞬移指令因此必发错误 2005 | `createCoreState()` → 构造小地图场景（不手工注入 finder）→ `state.pathfinding.teleportTo({ x: 1, y: 0 })` 返回 `null`；`logger` 先观测到 173，随后 `ReplayTeleportCommand` 发 2005，二次录像中的瞬移步无法播放 | `CoreState` 构造 `new PathfindingSystem(this)` 后仅调用 `useMover`，从未向 `finder` 注入 `useMapState`/`useMapLayer`/`usePassPredicate`；`PathfindingFinder.find` 在 `maps` 或 `layer` 为 `null` 时告警 173 并返回空数组 | 顶层录像中的瞬移指令无法播放（必失败）；未手工注入 finder 时真实寻路入口不可用 | 在地图/事件层可用后（如 `initMapState` 或 `loaded` 钩子）为 `pathfinding.finder` 注入 `maps`、`eventLayer` 与 `DefaultPassPredicateImpl`；若设计上由客户端层注入，则应在契约中明确，避免录像瞬移静默失败 | `replayPlayback.test.ts` `plays a teleport step without manual finder wiring`（`it.skip`，修复后取消 skip） | 中 |

> 说明：本计划的录像播放用例为覆盖「真实寻路瞬移播放」路径，在**测试内**通过公开的
> `state.pathfinding.finder.useMapState/useMapLayer/usePassPredicate` 完成注入；生产 `CoreState`
> 目前不做该注入，故另立 `#06-07-1` 记录该接线缺口。

## #06-10 战斗系统 / 顶层组合缺口补测（D-46）

本计划按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）补齐 G-06-01-A/B/C、G-06-07-A，
只新增/扩展 `*.test.ts`，未改动任何生产/核心源码；三个测试文件聚焦运行通过，
`pnpm test:ci` 全绿（66 文件 / **636 通过** / 20 跳过）。

- 阶段 1 构件级（`mapDamage.test.ts`）：G-06-01-C 同点多来源叠加 —— 有来源+有来源、
  无来源+无来源、混合多来源；断言 `getSeparatedDamage` 条数与 `getReducedDamage` 的
  damage/type/extra。
- 阶段 2 组合/流水线（`context.test.ts`）：G-06-01-A 四类效果同时生效（四阶段顺序 + 最终
  atk/def/hp/special）；G-06-01-B 多怪跨施加嵌套光环（三只怪最终 atk + A1 范围边界）。
- 阶段 3 完整/集成（`enemyCombination.test.ts`）：G-06-07-A 最大流水线组合单怪的唯一精确
  `{damage: 3059, turn: 37}` + 去支援对照 `{2882, 35}`。

**本计划未发现疑似 bug**，无 `it.skip` / `it.todo`，无 `#06-10-N` 条目。

非缺陷说明：阶段 1 计划措辞「type 取最大」与顶层 `MainMapDamageReducer`「取最大伤害项的
type」语义不同；本计划按 plan 措辞以文件内联语义 reducer 断言，未改动生产代码。

## #06-12 录像与 enemy 模型缺口补测（D-46）

本计划按 D-43 三阶段（构件 → 组合 → 完整）补齐 G-06-04-B、G-06-04-A、G-06-03-A，
只新增/扩展 `*.test.ts`，未改动任何生产/核心源码；两个测试文件聚焦运行通过，
`pnpm test:ci` 全绿（66 文件 / **644 通过** / **21 跳过**）。

- 阶段 1 构件级（`replay/array.test.ts`）：G-06-04-B 可跑绿——6 条参数个数与类型各异的命令
  （单 int、boolean + 短 string、空参数、单字节 bigint、多 int、长 string + float）经
  `createReadStream` 与 `get` 逐条读回一致（读流 `index = position + 1`、`get` 的 `index = i`，
  故只比较 `command`/`params`），并覆盖加宽到 uint16 后的读回与**删除首步**后的读回。
- 阶段 2 组合（`replay/array.test.ts`）：G-06-04-A——新增一条正确预期 `it.skip`
  `round-trips a heterogeneous step mixing a multi-byte bigint and an int64 value`，
  锚定既有 `#06-04-1`/`#06-04-2`；既有两条同锚点 skip 保持不变，未取消 skip。
- 阶段 3 完整（`enemy/manager.test.ts`）：G-06-03-A——新增一条正确预期 `it.skip`
  `creates four independent enemies from one prefab reused by four facing codes`，
  覆盖「4 个朝向 code/id 复用同一 prefab → 分别 `createEnemy`/`createEnemyById` 得到 4 个
  互相独立且与模板独立的怪」的完整链路，锚定既有 `#06-03-1`；既有同锚点 skip 不变。

**本计划未发现新疑似 bug**，无新增 `#06-12-N` 条目；受阻塞缺口复用既有
`#06-04-1`/`#06-04-2`/`#06-03-1` 锚点（详见上文 `## #06-04` 与 `## #06-03` 小节）。
