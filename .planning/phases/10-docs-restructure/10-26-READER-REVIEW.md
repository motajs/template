# 高级 II 读者审阅

## 读者人格（D-68，逐字）

> 你已经理解了绝大多数常用语法；认真阅读本样板后，你能把一部分简单系统和中等复杂度的系统读明白。你正在读高级 II，想做更深入的定制，但对具体系统实现还不熟悉。

**明确未复用高级 I / 中级人格。**

## 第 1 轮 · 问题清单

### 阻断性（12）

| #    | 问题                                                                                                                                                   | 定位                                                                                   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| B-01 | 验证预期写成「只输出与勇士曼哈顿距离恰好为 2 的格子，最多 8 格」，但 `scanRange` 只返回范围内的怪物视图；照此无法复现，并会误解 `scanRange` 为枚举空格 | `custom-range.md`「怎么验证」                                                          |
| B-02 | 「静态转动态」称无论是否保留、源静态图块的图块事件都会被清空；`keepEvent=false` 时实际不清空，之后 `setBlock` 可能继承旧事件                           | `static-vs-dynamic-tiles.md`「双向转换」                                               |
| B-03 | 验证代码顺序是 equip → unequip → save → load，注释却写「存档 → 卸下 → 读档」并预期加成恢复；按代码读档后不会有加成                                     | `equipment-system.md`「怎么验证」                                                      |
| B-04 | 建议用 `onChangeModifier` 做「穿上后触发」；它不是穿戴钩子（强化/改值也触发，无修饰器时穿上不触发）                                                    | `equipment-system.md`「装备事件」                                                      |
| B-05 | 被动录像只说「调用 `next(status)`」，未说明它是 `getPassive()` 返回的 `IReplayPassiveHandler` 上的方法，也未给出被动步的记录/排入链路                  | `custom-replay-command.md`「主动/被动」「边界」                                        |
| B-06 | 「新的寻路调用也可以接管当前移动」与「上一次移动未结束时返回 null」矛盾；实际需先等 `onEnd` 或 `interrupt()`                                           | `pathfinding.md`「两种移动方式」「边界」                                               |
| B-07 | `Dir4FaceHandler` 从 `@motajs/common` 导入，实际应来自 `@user/data-common`；示例无法编译                                                               | `pathfinding.md`「完整流程 → 绑定」                                                    |
| B-08 | 护甲插入点未说清；片段放在 `damage = (turn-1)*enemyPerDamage` 之后，却称保留吸血/支援/先攻/破甲/魔防等分支；照抄会丢分支，顺序也不确定                 | `adding-hero-attribute.md`「接入伤害计算」                                             |
| B-09 | 无来源全局光环写成 `implements IEnemyAuraView<...>`；`IEnemyAuraView` 还要求 `enemy`/`special`/`locator`，应实现 `IAuraView`（需核对源码）             | `adding-enemy-attribute.md`「接入光环」、`enemy-context-and-combat.md`「完整收束示例」 |
| B-10 | 称 `setFloor` 会把上下文标记为需要更新；实际只改 `floor`、不置 `needUpdate`，切层后只调 `setFloor` 不会重建                                            | `enemy-context-and-combat.md`「上下文是什么」                                          |
| B-11 | 优先级语义不符：常规查询按特殊属性 code 逐个执行、优先级只在同一 code 内排序；删除同/更高优先级光环的实际表现也不是「被拒绝」                          | `enemy-context-and-combat.md`「优先级的边界」                                          |
| B-12 | 旧存档缺新键只说「使用前给默认值」，未给补键位置或迁移入口；内容配置不会与默认值合并，照做可能读到 `undefined`                                         | `adding-hero-attribute.md` / `adding-enemy-attribute.md`「边界与注意」                 |

### 非阻断（19）

- `static-vs-dynamic-tiles`：`layer.getPointEvent` 返回只读 Map 而非可写视图；`toStatic` 移动中返回 `null` 需先判 `mover.moving`。
- `custom-replay-command`：`finalize?()` 返回值未写；`reseter.reset(save)` 的 `save` 来源；指令对象跨回放残留状态；指令码切 `Uint16` 的入口与兼容。
- `pathfinding`：`finder.find(...)` 与 `pathfinding.getPath(...)` 关系未说明；瞬移钩子的注册调用位置；`onAfterTeleportTo` 参数个数。
- `equipment-system`：`instancesOf`/`count` 参数是 num 还是 id；多件装备百分比是相加还是相乘。
- `adding-hero-attribute`：`HERO_DEFAULT_ATTRIBUTE` 注释与实际生效时机矛盾；`IItemEquipData.value/percentage` 的 `Record` 字面量可能类型不通过。
- `adding-enemy-attribute`：查询示例未说明如何让怪物拥有该 code；验证中「把 armor 设为 50」缺少 `setAttribute` + `markDirty/requestRefresh`。
- `enemy-context-and-combat`：`clear()` 会清空 `globalAuraList`；`buildupSpecials` 无光环时提前返回导致只注册查询也不执行；基础光环范围包含自身时会改自己。
- `index.md`：高级 III 占位表述；「优先插件，必要时改内置包」与本层多篇直接改 `packages-user` 的张力。
- `custom-range`：`radius` 需为整数，否则 `iterateLoc` 产生非整数索引。

## 第 2 轮 · 问题清单

### 阻断性（2）

| #    | 问题                                                                                            | 定位                                            |
| ---- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| B-13 | 护甲验证预期方向写反：护甲 50→0 时回合数减半，总伤害应大致减半，而非翻倍                        | `adding-enemy-attribute.md`「怎么验证」         |
| B-14 | 装备对比建议「比较对象应放在目标槽之外」与「别的槽会重复计入」自相矛盾；`-1` 的基线语义也未说清 | `equipment-system.md`「装备对比」「边界与注意」 |

### 非阻断（7）

- `custom-replay-command`：主动步调用 `next(Success)` 后读取流何时推进、`execute` 应返回什么；`next(Failed)` 是否会中止播放。
- `enemy-context-and-combat`：`refreshEnemy` 是否重跑特殊光环的 `applySpecial` 与特殊属性。
- `equipment-system`：`getModifiers()` 懒构建与 `add` 时构建的关系；`equip` 是否会触发懒构建。
- `adding-hero-attribute`：统一「默认值只保证类型完整、运行时只来自 core.jsonc」的表述。
- `adding-enemy-attribute`：默认模板何时被使用；内容条目不与模板合并。
- `adding-hero-attribute`：自爆并非完全不受护甲影响。
- `pathfinding`：`InvalidInput` 的原因补充「缺少方向处理器」。

## 迭代记录

### 第 1 轮修复（2026-10-21）

对照当前源码逐条修复，构建通过。

**阻断性**

- B-01 `custom-range.md`：明确 `scanRange` 只筛选上下文中已存在的怪物视图，不枚举空格；验证改为在中心、距离 `1`、距离 `2` 摆测试怪，并补充 `iterateLoc` 检查范围格子。
- B-02 `static-vs-dynamic-tiles.md`：改为只有 `keepEvent=true` 才清空源静态图块的图块事件；`false` 时源实例保留旧事件。补充 `layer.setBlock` 不重置事件、`StaticTile.set` 才重置。
- B-03 `equipment-system.md`：验证顺序改为 equip → save → unequip → load，注释与预期同步。
- B-04 同篇：说明 `onChangeModifier` 不是穿戴钩子，也不保证在 `equip` 时触发；给出在 `equip` / `unequip` 入口统一处理的写法。
- B-05 `custom-replay-command.md`：补充 `IReplayPassiveHandler.next(status)` 的归属、record → `getPassive()` → `next()` 链路，以及被动指令类。
- B-06 `pathfinding.md`：改为移动中 `moveTo` / `teleportTo` 返回 `null`，不会接管；需 `await controller.onEnd` 或 `state.pathfinding.interrupt()`。
- B-07 同篇：`Dir4FaceHandler` 改从 `@user/data-common` 导入。
- B-08 `adding-hero-attribute.md`：换成保留吸血、支援、先攻、破甲、反击、净化、魔防、固伤、仇恨、自爆的完整计算器；说明攻速插入点与护甲相对 mdef / 固伤 / 仇恨 / 自爆的顺序。
- B-09 `adding-enemy-attribute.md`、`enemy-context-and-combat.md`：无来源全局光环改为实现 `IAuraView`；说明 `IEnemyAuraView` 额外要求 `enemy` / `special` / `locator`。
- B-10 `enemy-context-and-combat.md`：改为 `setFloor` 只改 `floor`、不置 `needUpdate`；补充切层必须配合 `resize` 或 `bindHero` 等置脏动作。
- B-11 同篇：区分特殊光环 / 特殊查询的全局优先级与常规查询的同 code 排序；更正删除语义为「特殊属性先删，光环可能留到本轮」。
- B-12 `adding-hero-attribute.md`、`adding-enemy-attribute.md`：增加在 `state.loadState` 前迁移 `@system/hero` / `@system/enemy` 的入口；强调内容配置不与默认值合并。

**非阻断**

- `static-vs-dynamic-tiles.md`：`getPointEvent` 返回只读 Map 而非可写视图；`toStatic` 移动检查的现状与使用建议。
- `custom-replay-command.md`：`finalize` 返回类型、`reset(save)` 的 `save` 来源、指令对象跨回放残留状态、`setCommandWidth` 入口与兼容。
- `pathfinding.md`：`finder.find` 与 `getPath` 的区别、钩子注册位置、`onAfterTeleportTo` 第二参数。
- `equipment-system.md`：`instancesOf` / `count` 接受图块数字或 id；多件装备百分比为相加。
- `adding-hero-attribute.md`：`HERO_DEFAULT_ATTRIBUTE` 的实际语义；`Record` 字面量的类型限制。
- `adding-enemy-attribute.md`：怪物如何拥有查询 code；验证中的 `setAttribute` + `markDirty` + `requestRefresh`。
- `enemy-context-and-combat.md`：`clear()` 清空 `globalAuraList`；`buildupSpecials` 无光环时提前返回；光环可命中自身。
- `index.md`：高级 III 占位表述；优先插件与本层直接改 `packages-user` 的边界。
- `custom-range.md`：`radius` 必须为整数，示例统一截断。

**验证**：prettier 格式化通过；`pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build` 通过（仅 VitePress chunk 体积警告）。

### 第 2 轮修复（2026-10-21）

对照当前源码逐条修复，构建通过。

**阻断性**

- B-13 `adding-enemy-attribute.md`：验证预期改为 `armor` 50→0 后勇士每回合伤害翻倍、回合数大致减半、总伤害大致减半，并给出 `damage = (turn - 1) * enemyPerDamage` 的依据。
- B-14 `equipment-system.md`：重写「装备对比」。明确模拟基线是「当前属性减去目标槽现役装备」；A/B 只能是目标槽上的现役装备或完全未装备，不能穿在别的槽上（否则会重复计入）。补充 `compareEquip` 的逐键回退规则与 `-1` 的实际语义。
    - **与审阅建议的差异**：审阅建议称目标槽有装备时传 `-1` 得到「相对空槽」。核对 `HeroEquipment.compareEquip` 源码后，缺失的一侧在差值阶段回退到 `this.attribute.getFinalAttribute(key)`，即当前真实最终属性（含目标槽现役装备）；因此文中按源码写为「相对现役装备」。现有测试 `compareEquip(axe, bow, 0).atk === 7`（axe +12、sword +5 现役）也验证了这一点。

**非阻断**

- `custom-replay-command.md`：说明 `next(Success)` / `next(Ignored)` 在调用时即推进读取流并触发 `onStep`；`next(Failed)` 不推进也不自行中止；主动步 `execute` 的返回值才决定回放是否继续，`next` 返回 `void` 无法传递失败。
- `enemy-context-and-combat.md`：明确 `refreshEnemy` 会重跑命中该怪物的特殊光环 `applySpecial`、特殊查询与常规查询，但不重建 `sortedAura` / `convertedAura` 拓扑；新增或删除特殊属性产生的光环只告警（code 101），不会进入本轮排序表。
- `equipment-system.md`：`add` 与 `loadState` 都会立即 `buildModifiers()`，正常实例的 `getModifiers()` 不会再次构建，`equip` 也不会触发懒构建；只有直接 `new EquipmentState(...)` 才可能触发兜底构建。
- `adding-hero-attribute.md`：统一为 `HERO_DEFAULT_ATTRIBUTE` 只保证类型完整，运行时初始值仅来自 `core.jsonc`，它不是兜底；同步修正验证与边界表述。
- `adding-enemy-attribute.md`：说明默认模板只以 `enemy-default` 配置供编辑器/校验使用，运行时 `enemyStore` 只读内容条目，不会与模板合并。
- `adding-hero-attribute.md`：更正自爆与护甲的关系：护甲先缩放，自爆只把低于 `hp - 1` 的结果抬到下限，下限本身不缩放。
- `pathfinding.md`：`InvalidInput` 的原因补充「缺少方向处理器」。

**验证**：prettier 格式化通过；`pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build` 通过。

### 第 3 轮复查（2026-10-21）

复查第 3 轮提出的 5 个非阻断项，全部对照源码修正，构建通过。

**非阻断**

- `pathfinding.md`：`block.static` 原先写成「空格为 `null`」与 `ILayerLocation` / `IMapLayer.getLocationData` 不符——只要坐标在地图内就返回缓存的 `IStaticTile`，空格时 `num()` 为 `0`。改为说明 `static` 非 `null`、判断空格用 `block.tile === 0`，与 `static-vs-dynamic-tiles.md` 对齐。
- `custom-replay-command.md`：被动示例使用 `ReplayCode.SkillEffect`，但指令码枚举只列了 `UseSkill`，复制后无法编译。在枚举末尾补 `SkillEffect`，并说明它对应紧随其后的被动步、两个码都要注册。
- `equipment-system.md`：`compareEquip` 的逐键回退原先只有三条文字列表。改为 3 行表格（两侧都提供 / 仅 A 提供 / 仅 B 提供），并在表下给出「空槽模拟」与 `this.attribute.getFinalAttribute(key)` 回退的来源。
- `static-vs-dynamic-tiles.md`：「刚读出来的图块默认是干净的」不成立：`StaticTile.loadState` 先 `restoreDefaultEvents()`，再按存档 `clear()` + `set()`，后者不调用 `markPure()`；带自定义事件的存档读回后 `dirty()` 仍为 `true`。改为区分「新建」与「读档」。
- `adding-hero-attribute.md` / `adding-enemy-attribute.md`：护甲边界改为「夹紧后 `≥ 100`」——此时最终伤害为 `0`（勇士侧）或勇士每回合伤害为 `0`、怪物无法被击败（怪物侧），负值夹到 `0`；不再表述为「大于 100 会变成治疗」。

**验证**：prettier 格式化通过；`pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build` 通过。
