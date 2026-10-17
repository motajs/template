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


