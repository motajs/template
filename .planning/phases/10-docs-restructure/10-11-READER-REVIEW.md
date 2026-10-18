# Phase 10 · 10-11 读者视角审阅记录

> 用户要求的「读者视角审阅」机制：派发独立子代理，以「不懂代码的游戏作者」人格通读 24 篇中级教程，产出理解性问题清单，再据此迭代修正（上限 3 轮）。

## Persona 提示词（逐字）

> 假设你是一个不懂代码的游戏作者，你正在阅读这个样板的使用文档，现在看到了中级教程，你了解魔塔游戏的基本概念。

## 阻断性判定口径

读者据此**无法完成操作**，或会对**概念产生实质误解**。

---

## 第 1 轮 · 首轮问题清单（重写后 24 篇）

### 阻断性（13）

| # | 问题 | 定位 |
|---|------|------|
| B-01 | `@user/...`、`@motajs/...` 包名从未解释，示例里的 `import` 无法照抄 | `hero-attribute.md`、`enemy-aura.md`、`enemy-query.md`、`enemy-final.md`、`enemy-calculator.md`、`enemy-map-damage.md`、`enemy-status-hooks.md`、`events.md`、`data-plugins.md` 等 |
| B-02 | 示例里凭空出现的 `map`（`map.set(3, ...)`），未说明是什么、从哪来 | `enemy-specials.md`「两类定义」「自定义一个新特殊属性」 |
| B-03 | 特殊属性 `code` 无统一编号表，且文档自承地图伤害编号未对齐，读者不知该用哪个号、内置能否用 | `enemy-specials.md`、`enemy-final.md`、`enemy-map-damage.md` |
| B-04 | `enemy-map-damage.md` 通篇「功能没做完」，读者无法确认五类地图伤害是否生效 | `enemy-map-damage.md` |
| B-05 | `packages-user` 从未介绍，却要求在 `packages-user` 下新增录像指令 | `replay-commands.md`「新增自定义录像指令」 |
| B-06 | 装饰器 `@shouldReplay` / `@ignoreReplay` 完全没铺垫 | `replay-commands.md`「录像安全检测」 |
| B-07 | `图块数字`（tile number）反复使用但从未定义，也不知道去哪查 | `hero-items.md`、`map-tiles.md` 全篇 |
| B-08 | `putMapData(array, x, y, width)` 只给宽度、没给高度，照做会卡 | `map-tiles.md`「批量读写」 |
| B-09 | `ILayerStatic`「图层的静态部分」概念未解释 | `map-tiles.md` 开头 |
| B-10 | 自定义事件写的「类」该放哪个文件没说 | `events.md`「参数接口」「注册事件」 |
| B-11 | 钩子归属自相矛盾：`onSetFloor` 在 `hooks.md` 归 `IHeroStateHooks`，在 `enemy-status-hooks.md` 却挂到 `state.hero.location` | `hooks.md`、`enemy-status-hooks.md` |
| B-12 | `dependencies` 是 id 数组还是对象，前后不一 | `data-plugins.md`「插件定义」「时机次序」 |
| B-13 | 查询上下文 `ctx` 的方法（`ctx.scanRange`/`ctx.indexer.index`/`ctx.iterateEnemy`）凭空使用，未介绍 `ctx` | `enemy-query.md`「示例」 |

### 非阻断（18）

| # | 问题 | 定位 |
|---|------|------|
| N-01 | 「最小语法」未覆盖正文出现的 `?.`、`?? 0`、泛型、`Map` 等写法 | 多处 |
| N-02 | 访问勇士属性前后不一致（`state.hero.attribute.*` vs `state.hero.getModifiableAttribute()`） | `data-state-overview.md`、`hero-attribute.md` |
| N-03 | `IItemEffect` 与示例 `ItemEffect` 名字对不上 | `hero-items.md` |
| N-04 | `uid`、`setSlots(slots)` 的 `slots` 来源未解释 | `hero-equipment.md` |
| N-05 | 属性名只给「常用」，无完整清单 | `hero-attribute.md` |
| N-06 | `flags` 接口偏多且重叠，日常该用哪个不清楚 | `flags.md` |
| N-07 | 流程图把「伤害计算」排在「战前脚本」前，但脚本可放弃战斗，读起来别扭 | `combat-overview.md` |
| N-08 | 「四个阶段」与「为什么分四步」措辞重复 | `combat-overview.md` |
| N-09 | `markDirty(view)` 的 `view` 未说明 | `enemy-specials.md` |
| N-10 | 临界整节抽象；内置公式术语未与 `code` 编号对照 | `enemy-calculator.md` |
| N-11 | 接口写 `func: (parameters, env)`，正文/示例用 `param` | `events.md` |
| N-12 | 插件示例为占位，读者看不到完整插件 | `data-plugins.md` |
| N-13 | `iterateActiveMaps()`/`iterateInactiveMaps()` 未列在上一节接口清单 | `map-structure.md` |
| N-14 | `IFacedTileLocator`、`FaceDirection` 类型名未解释 | `hero-location.md` |
| N-15 | `.jsonc` 与 JSON 的差别、`src/package.json` 术语未展开 | `src-tour.md` |
| N-16 | `node` 环境、`DOM` 未解释 | `data-vs-render.md` |
| N-17 | 开篇承诺与正文难度落差大 | `code-basics.md` |
| N-18 | 各示例自定义 `code` 编号互不相同，未说明是否会冲突 | 多处 |

---

## 迭代记录

（Task 2 / Task 3 每轮追加）

## 第 1 轮迭代记录（Task 2 · round 1）

**本轮目标：** 消除首轮清单中的 13 条阻断性理解问题（B-01..B-13）。非阻断项（N-*）不修，仅留档供用户判断（D-14）。

### 逐条处置

| # | 处置 | 改动文件 |
|---|------|----------|
| B-01 | `src-tour.md` 新增「包从哪来：src、packages-user 与 packages」小节，讲清 `@motajs/*`（核心引擎 `packages/`）、`@user/*`（用户工程 `packages-user/`）、`src`（游戏本体）三层与单向依赖 `src → packages-user → packages`；并在用到包名 `import` 的篇目各加一句交叉引用 | `src-tour.md`（新增）、`hero-attribute.md`、`enemy-aura.md`、`enemy-final.md`、`enemy-calculator.md`、`enemy-status-hooks.md`、`enemy-query.md`、`events.md`、`data-plugins.md`、`enemy-combat-script.md`、`enemy-map-damage.md` |
| B-02 | `enemy-specials.md`「两类定义」说明 `map` 就是 `createSpecials(state)` 创建、最终返回注册的那张属性表（`map.set(code, ...)` 即登记一条）；`enemy-map-damage.md` 同处补一句 | `enemy-specials.md`、`enemy-map-damage.md` |
| B-03 | `enemy-specials.md` 顶部说明内置 `code` 由 `special.ts` 的 `map.set` 注册（当前 0–26），示例中 30 及以上的 `code` 都是示例自选的未占用编号；`enemy-final.md` 示例补注内置最终效果仅坚固 3 / 模仿 8 | `enemy-specials.md`、`enemy-final.md` |
| B-04 | `enemy-map-damage.md` 的 warning 改写为「今日可用 vs 待补齐」：系统三部件已可用，编号对齐与实际结算待补齐，并给出可操作做法 | `enemy-map-damage.md` |
| B-05 | `replay-commands.md` 要求改 `packages-user` 处，补指向「包从哪来」的说明 | `replay-commands.md` |
| B-06 | `replay-commands.md` 在 `@shouldReplay` / `@ignoreReplay` 前补装饰器简介并链到 `code-basics.md`；`code-basics.md` 新增「装饰器」小节 | `replay-commands.md`、`code-basics.md` |
| B-07 | `map-tiles.md` 定义「图块数字」= 内容层 `tile.jsonc` 条目的 `num`，并给出 `state.tileStore.num/id` 换算；`hero-items.md` 交叉引用 | `map-tiles.md`、`hero-items.md` |
| B-08 | `map-tiles.md` 说明 `putMapData` 数组按行排列、高度 = `array.length / width`（非整除会告警） | `map-tiles.md` |
| B-09 | `map-tiles.md` 开头解释 `ILayerStatic`（静态图块那半）与 `ILayerDynamic`（动态图块那半）的区别 | `map-tiles.md` |
| B-10 | `events.md` 说明自定义事件的类放在 `src/data/event/` 下的文件（可新建或并入相关文件），再由 `registrations.ts` 引入注册 | `events.md` |
| B-11 | 统一 `onSetFloor` 归属：`enemy-status-hooks.md` 与 `hooks.md` 均明确它属 `IHeroLocationHooks`（挂 `state.hero.location`），与 `IHeroStateHooks` 的 `onBeforeChangeFloor` / `onAfterChangeFloor`（挂 `state.hero`）不同族 | `enemy-status-hooks.md`、`hooks.md` |
| B-12 | `data-plugins.md` 区分两处 `dependencies`：定义时是 id 字符串数组，三个时机方法收到的是解析后的 `IDataPlugin[]` 对象 | `data-plugins.md` |
| B-13 | `enemy-query.md` 新增「查询上下文 ctx」小节，介绍 `IEnemyContext` 及示例用到的 `scanRange` / `iterateEnemy` / `indexer.index`，并说明 `IEnemyView.getComputedEnemy()` | `enemy-query.md` |

### 校验

- 源码核对：`src/data/enemy/special.ts`、`src/data/enemy/mapDamage.ts`（转换器读取 15/16/18/24/27）、`packages-user/data-state/src/types.ts`（`IDataPluginDefine.dependencies: string[]`）、`packages-user/data-base/src/map/types.ts` 与 `mapLayer.ts`（`putMapData` 高度推导）、`packages-user/data-common/src/store/types.ts`（`ITileRawData.num`）、`packages-user/data-base/src/hero/types.ts`（`IHeroLocationHooks.onSetFloor`）、`packages-user/data-system/src/combat/types.ts`（`IEnemyContext` / `IEnemyCommonQueryEffect` / `IEnemySpecialQueryEffect`）、`src/data/event/`。
- 结构门禁：24 篇仍 CRLF、单 H1（`STRUCT-OK`）。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → **green**，输出 `build complete`，dead link = 0。
- 非阻断项（N-01..N-18）：本轮不修，留待用户判断。

---

## 第 2 轮 · 复审问题清单（round 2 recheck）

**复审结果：** 首轮 13 条阻断性问题中 **12 条已消除**；`B-03` 仍阻断，另有 6 个新的可操作困惑点。

### 仍阻断（1）

| # | 问题 | 定位 |
|---|------|------|
| B-03 | 特殊属性 `code` 仍无统一编号表，读者不知哪个号对应哪种机制；且同一数字在不同页面含义不同（18 在 `enemy-combat-script.md` 作「无敌」，在 `enemy-map-damage.md` 作「阻击」），内置属性无法据此配置 | `enemy-specials.md`、`enemy-map-damage.md`、`enemy-combat-script.md` |

### 新的可操作困惑点（6）

| # | 问题 | 定位 |
|---|------|------|
| R2-01 | `@motajs/anon-tokyo`（`BuiltInFunction` 的来源）从未解释 | `events.md` |
| R2-02 | 内置光环 code 23 经 `setValue({...})` 使用的字段（`range/square/hpBuff/atkBuff/defBuff`）未定义 | `enemy-aura.md` |
| R2-03 | `initializeEnemy` 被战斗各篇反复引用却从未介绍 | `enemy-specials.md`、`enemy-aura.md`、`enemy-map-damage.md` |
| R2-04 | 参数接口该放哪（`src/data/event/types.ts`）与内联示例混淆 | `events.md` |
| R2-05 | `compareEquip` 在正文使用，却未列入 `IHeroEquipment` 接口清单 | `hero-equipment.md` |
| R2-06 | code-43 示例中 `FaceGroup.Dir4` / `IFaceHandler` / `dir.mapMovement()` / `MapDamageType.Layer` 未作注解 | `enemy-map-damage.md` |

### 记录但不修（供用户判断）

- N-4：`data-plugins.md` 的示例仍为占位（已知，待用户提供「较简单插件」，D-44）。

## 第 2 轮迭代记录（Task 2 · round 2）

**本轮目标：** 消除仍阻断的 `B-03`，并处理 6 个新的可操作困惑点（`R2-01..R2-06`）。

### 逐条处置

| # | 处置 | 改动文件 |
|---|------|----------|
| B-03 | `enemy-specials.md` 新增「内置属性编号表」小节：从**当前** `src/data/enemy/special.ts` 的 `map.set(code, ...)` 逐条抄录 `0..26` 的 code→名称（0 空 / 1 先攻 / 2 魔攻 / 3 坚固 / 4 n连击 / 5 破甲 / 6 反击 / 7 净化 / 8 模仿 / 9 吸血 / 10 中毒 / 11 衰弱 / 12 诅咒 / 13 领域 / 14 夹击 / 15 仇恨 / 16 阻击 / 17 自爆 / 18 无敌 / 19 退化 / 20 固伤 / 21 重生 / 22 激光 / 23 光环 / 24 支援 / 25 捕捉 / 26 特殊光环），并附各 code 的参数形态。表下以 warning 说明地图伤害转换器读取的编号与内置表**不一致**，不臆造「已对齐」的编号。核心信息按用户口径落定：以 `special.ts` 注册的编号为**权威**，转换器偏差标注为「编号未对齐 / 待补齐」。 | `enemy-specials.md` |
| B-03 | `enemy-map-damage.md` 的「编号未对齐」warning 明确点出 18 号的双重含义（`special.ts` 定义 18 = 无敌，转换器却读作阻击），并说明 16、24 同样不一致；保留「改用转换器真正读取的 code，或改转换器使其对齐」的可操作二选一。 | `enemy-map-damage.md` |
| B-03 | `enemy-combat-script.md` 的 code 18 示例注明「18 = 无敌」（链到编号表），并说明地图伤害转换器把 18 读作阻击是转换器自身未对齐，与本篇判定无关——两处不再在无提示的情况下给出同一数字的两种含义。 | `enemy-combat-script.md` |
| R2-01 | `events.md` 的 `BuiltInFunction` 注明来自 `@motajs/anon-tokyo`（负责解释执行事件脚本的包）；`src-tour.md`「包从哪来」把 `@motajs/anon-tokyo` 补为该层示例。 | `events.md`、`src-tour.md` |
| R2-02 | `enemy-aura.md` 内置光环表下补 `ISpecial23Value` 字段说明表（`range` / `square` / `hpBuff` / `atkBuff` / `defBuff`，已核对 `special.ts`）。 | `enemy-aura.md` |
| R2-03 | `enemy-specials.md`、`enemy-aura.md` 补 `initializeEnemy` 一句介绍（`src/data/enemy/initialize.ts` 中集中注册内置怪物功能的入口函数），并说明内置与自定义走同一注册流程。 | `enemy-specials.md`、`enemy-aura.md` |
| R2-04 | `events.md` 两处示例注明：参数接口实际应放入 `src/data/event/types.ts`，示例为紧凑才内联书写。 | `events.md` |
| R2-05 | `hero-equipment.md` 的 `IHeroEquipment` 接口清单补入 `compareEquip(equipA, equipB, slot)`。 | `hero-equipment.md` |
| R2-06 | `enemy-map-damage.md` code-43 示例补 `FaceGroup.Dir4` / `dir.mapMovement()` / `IFaceHandler` / `IFaceDescriptor` / `MapDamageType.Layer` 各一句简短注解。 | `enemy-map-damage.md` |

### 校验

- 源码核对：`src/data/enemy/special.ts`（`map.set` 0..26）、`src/data/enemy/mapDamage.ts`（转换器读取 15/16/18/24/27）、`src/data/enemy/types.ts`（`MapDamageType`：`Unknown/Zone/Layer/Repulse/Between`）、`src/data/enemy/initialize.ts`（`initializeEnemy` 集中注册）。
- 结构门禁：本轮被改的 7 篇（`enemy-specials`、`enemy-map-damage`、`enemy-combat-script`、`src-tour`、`events`、`enemy-aura`、`hero-equipment`）均 CRLF、单 H1。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → **green**，输出 `build complete`，dead link = 0。
- 非阻断项（N-01..N-18）：本轮仍不修，留待用户判断；N-4 已知、待用户提供示例后处理。

---

## 第 3 轮 · 复审问题清单（round 3 recheck）

**触发：** 用户已在 `src/data/enemy/` 对齐特殊属性编号（提交 `2494629 fix: 属性编号问题`），第 2 轮记录的「编号未对齐 / 待补齐」状态解除。据此复核第 2 轮的遗留项，并处理读者新提出的 4 个困惑点。

### 原阻断项复核

| # | 结论 | 说明 |
|---|------|------|
| B-03 | 已消除 | `special.ts` 注册的 0–26 与 `mapDamage.ts` 转换器读取的编号现已一致，文档可直接给出权威编号表。 |

### 新的可操作困惑点（4）

| # | 问题 | 定位 |
|---|------|------|
| R3-01 | 旧文残留「15 双重含义」的冲突叙述，读者仍会以为 15 既可能是仇恨又可能是领域 | `enemy-map-damage.md` |
| R3-02 | 旧文仍写「27 / 伏击」，而现行内置特殊属性是 25 / 捕捉 | `enemy-map-damage.md`、`enemy-specials.md` |
| R3-03 | `registerCommonQueryEffect(code, effect)` 与 `registerSpecialQueryEffect(effect)` 签名不对称，未解释原因 | `enemy-query.md` |
| R3-04 | 「同化」的文字描述（范围内、非数值取索引最小）与示例逻辑（遍历全场、数值加算）不符 | `enemy-query.md` |

## 第 3 轮迭代记录（Task 2 · round 3）

**本轮目标：** 按已对齐的源码修正地图伤害编号与命名，并消除 R3-01..R3-04。本轮为迭代上限内的最后一轮。

### 逐条处置

| # | 处置 | 改动文件 |
|---|------|----------|
| B-03 / R3-01 | 删除两列「转换器读取的 code vs `special.ts` code」对照表与「编号未对齐」warning，改为单列权威表：领域 13、夹击 14、阻击 16、激光 22、捕捉 25；明确「挂上对应内置属性即可生效」；删去 15/16/18/24/27 的全部偏差叙述，15 现在只表示仇恨。 | `enemy-map-damage.md` |
| B-03 | `enemy-specials.md` 的「转换器编号未对齐」warning 替换为一句对齐说明（转换器读取同一组 13/14/16/22/25）。 | `enemy-specials.md` |
| B-03 | `enemy-combat-script.md` 的 code 18 注解改为「18 = 无敌，地图伤害使用同一套编号（阻击是 16），无编号冲突」。 | `enemy-combat-script.md` |
| R3-02 | 全文「伏击」改为「捕捉」（code 25）：表项、开篇枚举、实现位置表；并注明视图类名沿用 `AmbushDamageView`（历史命名）。 | `enemy-map-damage.md`、`enemy-specials.md` |
| R3-02 | 明确捕捉伤害恒为 0、类型为 `MapDamageType.Unknown`、只产生 `extra.catch`，这是设计如此，不是未补齐的功能。 | `enemy-map-damage.md` |
| R3-02 | 删去「实际结算仍在补齐」：`hook.ts` 的 `handleMapDamage` 已接通扣血、阻击后退与捕捉强制战斗。 | `enemy-map-damage.md` |
| R3-03 | 补充一句签名差异的原因：常规查询绑定在单个 code 上，引擎需按 code 找到触发它的属性；特殊查询面向整只怪物、由 `shouldQuery` 自行筛选，可一次改动多个属性，故不绑定 code。 | `enemy-query.md` |
| R3-04 | 重写「同化」描述以匹配示例：用 `ctx.iterateEnemy()` 遍历全场（如需范围改用 `ctx.scanRange`）；自己没有的属性按位置索引从小到大照抄，已有的数值型属性与场上其他怪物加算叠加；开篇「附近怪物」改为「其他怪物」。 | `enemy-query.md` |

### 校验

- 源码核对：`src/data/enemy/special.ts`（`map.set` 0..26，13 领域 / 14 夹击 / 15 仇恨 / 16 阻击 / 18 无敌 / 20 固伤 / 22 激光 / 25 捕捉）、`src/data/enemy/mapDamage.ts`（转换器读取 13/14/16/22/25；`BetweenDamageView` 对侧 `hasSpecial(14)`；`AmbushDamageView` 读取 25 并返回 0 伤害 + `extra.catch`）、`src/data/enemy/calculator.ts`（18 无敌、20 固伤）、`src/data/enemy/hook.ts`（`handleMapDamage` 已结算）、`packages-user/data-system/src/combat/types.ts`（`registerCommonQueryEffect(code, effect)` / `registerSpecialQueryEffect(effect)`）。
- 结构门禁：24 篇全部 CRLF、单 H1（`STRUCT-DONE`，无 `LF-ONLY` / `H1-COUNT`）。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → **green**，输出 `build complete`，dead link = 0。
- 结论：第 2 轮遗留的 B-03 与 R3-01..R3-04 全部消除；本轮为第 3 轮（上限），未发现新的阻断性理解问题。

---

## 第 3 轮 · 复审结果（Task 3 收尾复议）

**触发：** 第 3 轮修正 + prettier 格式化（提交 `4f4090d style(10-11): prettier 格式化中级教程文档`）之后，再次派发一个**独立 persona 子代理**（同一人格设定，逐字同 Task 1：「假设你是一个不懂代码的游戏作者，你正在阅读这个样板的使用文档，现在看到了中级教程，你了解魔塔游戏的基本概念」），让它重新通读全部 24 篇并回答「现在还有哪些看不懂的地方？」。

**复审结论：阻断性问题 = 0，审阅通过。**

### 逐条复核（首轮 B-01..B-13 · 第 2 轮 R2-01..R2-06 · 第 3 轮 R3-01..R3-04）

| # | 结论 | 说明 |
|---|------|------|
| B-01 | 已消除 | `src-tour.md`「包从哪来」讲清 `@motajs/*` / `@user/*` / `src` 三层与单向依赖，各处 `import` 有据可循。 |
| B-02 | 已消除 | `enemy-specials.md` / `enemy-map-damage.md` 说明 `map` 即 `createSpecials(state)` 返回的、最终注册的那张属性表。 |
| B-03 | 已消除 | 内置编号以 `special.ts` 为准给出 0–26 权威表；地图伤害（13 领域 / 14 夹击 / 16 阻击 / 22 激光 / 25 捕捉）在 `enemy-specials.md` 与 `enemy-map-damage.md` 两处一致，并写明「挂上对应内置属性即可生效」。 |
| B-04 | 已消除 | `enemy-map-damage.md` 的 warning 改为「今日可用 vs 待补齐」，五类地图伤害可用性明确。 |
| B-05 | 已消除 | `replay-commands.md` 补指向「包从哪来」，`packages-user` 有解释。 |
| B-06 | 已消除 | 装饰器 `@shouldReplay` / `@ignoreReplay` 前有铺垫并链到 `code-basics.md` 的「装饰器」小节。 |
| B-07 | 已消除 | `map-tiles.md` 定义「图块数字」= 内容层 `tile.jsonc` 的 `num`，并给 `state.tileStore.num/id` 换算。 |
| B-08 | 已消除 | `putMapData` 数组按行排列、高度 = `array.length / width` 已说明。 |
| B-09 | 已消除 | `ILayerStatic`（静态那半）与 `ILayerDynamic`（动态那半）已在开头解释。 |
| B-10 | 已消除 | `events.md` 说明自定义事件的类放 `src/data/event/` 下并由 `registrations.ts` 引入注册。 |
| B-11 | 已消除 | `onSetFloor` 归属统一为 `IHeroLocationHooks`，与 `IHeroStateHooks` 分族。 |
| B-12 | 已消除 | `data-plugins.md` 区分定义时的 id 数组与时机方法收到的 `IDataPlugin[]` 对象。 |
| B-13 | 已消除 | `enemy-query.md` 新增「查询上下文 ctx」小节。 |
| R2-01 | 已消除 | `BuiltInFunction` 来源 `@motajs/anon-tokyo` 已注明。 |
| R2-02 | 已消除 | 内置光环 code 23 的 `ISpecial23Value` 字段（`range`/`square`/`hpBuff`/`atkBuff`/`defBuff`）已给表。 |
| R2-03 | 已消除 | `initializeEnemy` 已在 `enemy-specials.md` / `enemy-aura.md` 介绍。 |
| R2-04 | 已消除 | `events.md` 注明参数接口应放 `src/data/event/types.ts`。 |
| R2-05 | 已消除 | `compareEquip` 已列入 `IHeroEquipment` 接口清单。 |
| R2-06 | 已消除 | code-43 示例中的 `FaceGroup.Dir4` / `dir.mapMovement()` / `IFaceHandler` / `MapDamageType.Layer` 均有注解。 |
| R3-01 | 已消除 | 删除「15 双重含义」冲突叙述，15 现在只表示仇恨。 |
| R3-02 | 已消除 | 「27 / 伏击」统一为「25 / 捕捉」。 |
| R3-03 | 已消除 | `registerCommonQueryEffect(code, effect)` 与 `registerSpecialQueryEffect(effect)` 的签名差异已解释。 |
| R3-04 | 已消除 | 「同化」描述与示例逻辑（遍历全场、数值加算）已对齐。 |

### 非阻断 residual（仅记录，不在本计划修正）

以下为第 3 次复议后仍存在的**非阻断**残项，均属内容层 / 编辑层或命名措辞范畴，不影响读者按文档完成操作，记录供用户判断（D-14）：

| # | 残项 | 定位 / 性质 |
|---|------|-------------|
| a | 这 24 篇内没有 `enemy.jsonc` 中「一条特殊属性条目带值长什么样」的示例 | 内容层 / 编辑器范畴，超出中级教程定位 |
| b | 查询示例的 code（40/41/42）没有像光环 / 最终效果页那样给出 `map.set` 定义 | 示例完整性 |
| c | 「最终效果 / 脚本」与「光环 / 查询」两处的优先级作用范围未完全区分 | 描述精度 |
| d | 「普通光环 / 特殊光环」命名过载（阶段名 vs code 23/26） | 命名措辞 |
| e | `data-plugins.md` 表格里的 `awake` 签名与占位示例不一致 | 占位示例 |
| f | `IEnemyDamageInfo` 与 `IEnemyDamageInfoBase` 命名漂移 | 命名措辞 |
| g | 措辞「30 及以上是示例编号」可能被读成 27–29 已被占用 | 措辞 |

### 校验

- 结构门禁：24 篇全部 CRLF、单 H1（`STRUCT-OK`）。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → **green**，输出 `build complete`，dead link = 0。
- 结论：阻断性理解问题 = 0，审阅通过；非阻断残项（a）–（g）仅记录，留待用户判断（D-14）。

---

## 用户修订循环 · 第 1 轮（用户主导，领域视角）

> 规则见 `10-CONTEXT.md` D-46：子代理自审后，必须再经用户主导的修订循环（用户提问题 → AI 派子代理修改 → 回报 → 继续），经用户确认后才可收尾。

| # | 用户意见 | 主要落点 |
|---|----------|----------|
| U-01 | `content` 文件夹主要是在编辑器内修改的，对应**初级教程**，需明确说明 | `src-tour.md` |
| U-02 | 为什么有些地方获得的 `state` 主对象不包含所有层级？需解释 | `data-state-overview.md` |
| U-03 | 图块数字与图块 id 的区别、为何要区分；**新增一篇基础接口文档**简述 `TileStore` 基本概念与 `id()` / `num()` 接口 | 新文档 + `map-tiles.md` / `hero-items.md` |
| U-04 | 怎么**获取地图的指定图层**？目前只讲遍历所有图层 | `map-structure.md` |
| U-05 | 地图批量接口怎么用？说明**高级教程会详细解释** | `map-tiles.md` |
| U-06 | Flag 的**字段与字段值**区别；如何选择用哪个 | `flags.md` |
| U-07 | 怪物上下文重建**何时调用**、是否需要手动；说明样板已内置处理大部分情况，一般不需要手动重建（**不写「代码未实装」**） | 战斗各篇 |
| U-08 | 为什么不提供「既依赖外部环境、又修改外部环境」的能力——会引入**循环依赖**（依赖修改前还是修改后的环境？），要提 | `enemy-aura` / `enemy-query` / `enemy-final` |
| U-09 | `getSpecial<T>()` 的 `T` 是什么、怎么填、可否不填 | 战斗各篇 |
| U-10 | 特殊属性定义示例代码逐行是什么意思；`name` 为何可填字符串也可填函数（代码基础衔接） | `enemy-specials.md` |
| U-11 | 光环运作方式：作者能否理解转换器/视图；需说明「每个特殊属性可对应不同的转换器」 | `enemy-aura.md` |
| U-12 | 转换器/视图代码逐行注释；哪些是模板可直接照抄、哪些需自己改 | 战斗各篇 |
| U-13 | 注册上下文：给出 `initializeEnemy` 函数体（无关内容可注释省略），说明代码放哪 | 战斗各篇 |
| U-14 | 常规查询能否用 `handler.context` 替代 `query`？必须用 `query`，否则上下文认为未查询 → 后续计算不一致（严重） | `enemy-query.md` |
| U-15 | 查询上下文是 `IReadonlyEnemyContext`（只读），文档写成 `IEnemyContext` | `enemy-query.md` |
| U-16 | 其他示例也有 U-12 的问题，全部要改 | 战斗各篇 |
| U-17 | 中级应主要教**改内置代码**而非自创新类；说明直接改内置 vs 自己写的区别；仅必须自定义的（光环/查询）说明模板 vs 自己写；钩子建议直接改 `hook/` 下内置 | 战斗各篇 + `hooks.md` |
| U-18 | 「受地形遮挡的激光」示例过复杂，换成更简单的**八方向激光** | `enemy-map-damage.md` |
| U-19 | 计算器**必须无副作用**（临界/显示/手册会多次调用）；「下次战斗伤害乘二」实现错误，需修正 | `enemy-calculator.md` + `enemy-status-hooks.md` |
| U-20 | 内置事件将扩展到约 100 个（发布前完成）；以**已完成视角**编写，只说明新增需要改什么 | `events.md` |
| U-21 | 录像指令会在**高级教程细讲**，要说明 | `replay-commands.md` |
| U-22 | 所有会在高级教程再细讲的内容都要说明，并**预留链接**，方便后续直接链接 | 全部 |

---

## 用户循环 · batch 1 记录（战斗概念）

**范围：** 用户修订循环第 1 轮 batch 1（U-07、U-08、U-09、U-10、U-11、U-14、U-15）。

### 逐条处置

| # | 处置 | 改动文件 |
|---|------|----------|
| U-07 | 新增「什么时候重建」小节：重建由 `enemyContext` 惰性处理，`buildup()` 为全量入口、`markDirty(view)` 为局部标记；放置/移除怪物、注册效果、绑定勇士会自动标记更新，读取计算后怪物时自动重算，一般**无需手动重建**；仅绕开正常流程直接改怪物对象时才需手动 `markDirty(view)`。**不写**「代码未实装」。同步改写 `enemy-specials.md` 自定义步骤第 5 步。 | `combat-overview.md`、`enemy-specials.md` |
| U-08 | 在三方对比后新增「为什么没有『既依赖外部、又修改外部』的能力」：说明该组合会引入**循环依赖**（无法确定结果基于改动前还是改动后的环境），故刻意不提供；`enemy-aura.md` / `enemy-query.md` 各加一句点出归类并交叉引用。 | `enemy-final.md`、`enemy-aura.md`、`enemy-query.md` |
| U-09 | 详释 `getSpecial<T>(code)`：`T` 即该特殊属性 `value` 的类型（数字如连击 4、对象如光环 23 的 `ISpecial23Value`），给出 `getSpecial<number>(4)` 与 `getSpecial<ISpecial23Value>(23)`；说明可省略，但省略后 `value` 退化为取不到具体类型的宽泛类型（需自行断言），故建议显式写 `<T>`；链到 `code-basics` 的泛型。 | `enemy-specials.md` |
| U-10 | 为特殊属性定义示例补逐行注释（无参坚固 / 有参连击 / 对象参数吸血），并解释 `name` / `desc` / `color` 为何可写字符串或函数（函数收到该特殊属性、可用其 `value` 拼出动态文字），链到 `code-basics` 的函数一节。 | `enemy-specials.md` |
| U-11 | 在「运作方式」用大白话讲清转换器（分诊台）与视图（操作说明）的分工，并明确**每条特殊属性可对应不同转换器**、多个 code 也可共用一个转换器；内置三条光环各有转换器。 | `enemy-aura.md` |
| U-14 | 将「建议」改为**必须**调用 `query()`：直接读 `handler.context` 不会登记「查询过外部状态」，环境变化时上下文会视其为未查询、不重算，导致后续伤害等结果不一致甚至出错（严重）。 | `enemy-query.md` |
| U-15 | 查询上下文类型由 `IEnemyContext` 更正为 `IReadonlyEnemyContext`，并说明其只读是有意为之（避免查询效果依赖可变外部上下文）。 | `enemy-query.md` |

### 校验

- 源码核对：`packages-user/data-base/src/enemy/types.ts`（`getSpecial<T>(code): ISpecial<T> | null`、`IEnemy.getModifiableEnemy`）、`packages-user/data-base/src/enemy/special.ts`（`ICommonSpecialConfig<T>` 的 `name`/`desc`/`color: string | (special) => string`）、`packages-user/data-system/src/combat/types.ts`（`IAuraConverter` / `IAuraView` / `IEnemyAuraView`；`query: () => IEnemyContext` / `for(ctx: IEnemyContext)`；`IReadonlyEnemyContext` / `IEnemyContext`）、`packages-user/data-system/src/combat/context.ts`（`buildup()` 惰性早退、`markDirty(view)`、`requestRefresh`、`buildupQuery` 对 `queried` 的登记）。
- 结构门禁：被改的 5 篇（`combat-overview`、`enemy-specials`、`enemy-aura`、`enemy-query`、`enemy-final`）均 CRLF、单 H1。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → **green**，输出 `build complete`，dead link = 0。
- 备注（待用户确认）：`combat/types.ts` 当前 `query: () => IEnemyContext` / `for(ctx: IEnemyContext)` 的签名仍为可写 `IEnemyContext`；U-15 已按用户口径把**文档**改为只读 `IReadonlyEnemyContext`。若需源码同步为只读，请另行派发。

