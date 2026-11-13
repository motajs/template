# Phase 9: 最小浏览器可运行版本 - Context

**Gathered:** 2026-10-08
**Status:** Ready for planning

<domain>
## Phase Boundary

在已完成的数据端（可在 Node 环境独立运行/回放验证）之上完成渲染端框架，产出可在浏览器中运行并验证的最小版本。

本阶段收敛两大任务方向：

1. **依赖拆分收尾**：将 `client-modules` 按依赖关系拆分为 `client-base` 与 `client-modules`。此工作已部分完成，仍可能有未拆分完毕的内容。
2. **实现层 ↔ 架构层对齐**：接口适配性工作。UI 系统已完成重构，但 UI 实现尚未完全对齐，且存在不少 legacy 实现（`@motajs/legacy-ui`），需移植到新接口上。

**执行方式（本阶段关键）：** 本阶段是「伞阶段」，不一次性规划到底。内容杂、量大，且 UI 形态无固定约定，用户无法一次指定全部目标。改为**增量派发**：用户每次派发一个具体小任务，AI 据此在 Phase 9 下创建独立计划并执行，完成后由用户派发下一个。

</domain>

<decisions>
## Implementation Decisions

### 执行方式（本阶段特有，优先级最高）

- **D-01:** Phase 9 采用增量派发执行——用户每次派发一个具体小任务，AI 只针对该任务在 Phase 9 下创建独立计划；不得预先把整个阶段规划到底。
- **D-02 [informational]:** 阶段计划随任务累积，可反复追加/重规划；新任务到来时可新增计划而不必重排既有计划。
- **D-03:** 每个计划执行前，第一个 block 点必须先向用户汇报计划内容（要做什么、为什么、大致怎么做、影响范围）并等待用户明确回复「可以执行」；未收到「可以执行」前不得开始该计划的任何一步，也不得派发执行子代理。
- **D-04:** 新增或修改任何公共、受保护、私有方法/字段等命名前，必须先向用户反馈并获批准。
- **D-05:** 默认不逐阶段验证（本项目为彻底性重构，已完成系统会反复返工，逐阶段验证不现实）；仅当用户对某个具体任务明确要求时才做验证。

### 任务范围界定

- **D-06:** 每个小任务的范围由用户界定；AI 不擅自扩大范围。发现的越界内容只记录、不实施。
- **D-07:** UI 无固定约定。涉及 UI 的任务，其具体目标/期望形态/验收点由用户提供；AI 不自行臆造 UI。

### 两大任务方向（阶段初始范围）

- **D-08[informational]（拆分）:** 收尾 `client-modules` → `client-base` / `client-modules` 的依赖拆分。已有部分完成，需按实际依赖关系盘点剩余未拆内容，再逐任务迁移。（伞阶段方向，由后续派发任务逐次承接，不在本规划单元的单计划层追踪）
- **D-09[informational]（对齐）:** 实现层与架构层接口对齐——含 UI 系统重构后的 UI 实现对齐，以及 `@motajs/legacy-ui` 等 legacy 实现向新接口的移植。（伞阶段方向；本规划单元（任务 1）承接其中的 UI 接口适配子集）

### 任务 1（当前规划单元：UI 接口适配）

> 本节界定**本次规划运行**的范围：仅规划任务 1，不规划 Phase 9 的其余内容；后续任务由用户再派发时追加计划。

- **D-10（目录移动）:** 将 `packages-user/client-modules/src/render/ui/` 移动到 `packages-user/client-modules/src/ui/`（减少包内嵌套），并同步改写所有引用该路径的导入。纯移动 + 引用改写，不改变行为。
- **D-11（接口对齐）:** 将移动后的 UI 实现对齐到新 UI 系统（`packages/system/src/ui`）：组件通过系统提供的「经 props 获取主对象 `IClientBase`」机制获取主对象，不得使用 `client` 单例。把旧的 `client` 相关操作逐一替换为 `IClientBase` 上可用的新接口；**计划必须给出「旧接口 → 新接口」映射表**。凡 `client` 上不存在对应接口的操作，先向用户反馈，不得自造接口。
- **D-12（勇士属性）:** 单独实现一个 `IHeroAttr` 响应式对象，监听勇士属性变化并据此更新（命名待用户批准；注意与既有 `IHeroAttribute` 一族区分）。
- **D-13（flags）:** flags 尚无监听系统，本任务不处理 flags 的更新，仅在代码中标注 `TODO`。
- **D-14（纯适配）:** 本任务不引入 UI 形态/视觉改动；不做 `@motajs/legacy-ui` 移植（属后续任务）。

### 任务 2（当前规划单元：迁移后 UI 修复）

> 本节界定**本次规划运行**的范围：仅规划任务 2，不规划 Phase 9 的其余内容。

- **D-15（prettier 修复）:** 对本次迁移后未格式化的 UI 文件运行 prettier 修复格式：`packages-user/client-modules/src/ui/background.tsx`、`packages-user/client-modules/src/ui/statusBar.tsx`。纯格式改动，不改逻辑。
- **D-16（IUIController 泛型适配）:** `@motajs/system` 的 `IUIController<PB>` / `UIController<PB>` 现为必填泛型；为所有未适配的使用点补上类型实参（`IGameUIPropsBase`）。范围：`client-modules` 侧 `ui/save.tsx`(495/545/569/593)、`ui/settings.tsx`(680/691)、`ui/statistics.tsx`(283)、`ui/viewmap.tsx`(559)、`render/utils/saves.ts`(125)、`render/scene.ts`(3 构造)、`ui/controller.tsx`(4 构造)；`client-base` 侧 `components/choices.tsx`(598/651/710/765)、`components/input.tsx`(547/584)、`components/misc.tsx`(571)。
- **D-17（UI 实现迁移遗留类型错误）:** 修复 `packages-user/client-modules/src/ui/**` 的类型错误：`main.tsx`(56 `p` 未定义；138/184 props 不匹配)、`settings.tsx`(81/86/90/94/371/385/393 `loc` 不存在)、`statusBar.tsx`(521)、`toolbar.tsx`(397/403/409)。**不含** `client-base` 其余错误、渲染系统（`render/`、`client-base/map`）、数据端、legacy。

### 任务 3（当前规划单元：legacy UI 移植）

> 本节界定**本次规划运行**的范围：仅规划任务 3，不规划 Phase 9 的其余内容。**界面形态逐个讨论后确定**（尚未开始）。

- **D-18（范围）:** 将 `packages/legacy-ui` 残余的早期 UI 移植到新接口：`book`（怪物手册，`src/tools/book.tsx` + `src/ui/bookDetail.vue`）、`equipbox`（装备界面，`src/tools/equipbox.tsx` + `src/ui/equipbox.vue`）、`toolbox`（道具栏，`src/tools/toolbox.tsx` + `src/ui/toolbox.vue`）、`shop`（商店界面，`src/ui/shop.vue`）。
- **D-19（排除）:** `fly`（`src/tools/fly.ts` + `src/ui/fly.vue`）与 `settings`（`src/ui/settings.vue` + `src/preset/settings.tsx`）的移植**已完成，不再处理**；`hotkey`（`src/ui/hotkey.vue`）需要重构、**暂不移植**。
- **D-20（视觉）:** 移植后**不要求**与 legacy 显示效果一致；形态需调整。各界面具体形态由用户**逐个讨论确定**（当前未定，属讨论中的待定项）。
- **D-21（计划粒度）:** 每个界面一个计划，共 **4 个计划**（book / equipbox / toolbox / shop）。
- **D-22（流程）:** 逐界面先讨论「长什么样」，再规划；每个计划执行前仍走 Task 0 汇报关卡并等待用户「可以执行」。

### 任务 3 · book 怪物手册（讨论已定）

- **D-23（数据源 / 去重）:** 怪物手册展示**当前地图**的怪物信息，**绑定当前 `EnemyContext`**；列表为**去重**后的怪物（**按 `num` 去重**）；每个怪物的**基础数据取该怪物的 `baseAttribute`**（即不考虑光环的原始状态）。「不考虑光环」不等于「不依赖勇士属性」——依赖勇士属性的派生信息仍显示。
- **D-24（列表字段）:** 列表项显示 图标 + 名称 + 特殊名，数值为 **生命 / 攻击 / 防御 / 金币 / 经验 / 伤害 / 临界 / 减伤 / 「1 防」**。**不使用 `{ratio}防`**：新接口暂无 `ratio` 量，改用「**1 防**」（即 +1 防御对应的减伤）。列表为**滚动式**。
- **D-25（临界定义）:** 临界 = 玩家**再增加 x 点攻击**时，因战斗回合数减少而使玩家**受到的总伤害下降**的最小 x；减伤 = 对应的下降量。直接调用系统**已有的二分法临界表接口**计算（不重复实现）。
- **D-26（详细信息 UI 独立）:** 怪物详细信息是**独立 UI**，**不与怪物手册耦合、可单独运行**（后续需支持「在地图中打开指定 View 的详细信息」）。入参为 **`IEnemy` 或 `IEnemyView`**。若为 `IEnemyView`：可切换「**基础属性 / 计算后属性**」——**计算后 = 含光环等加成的数值**，且**临界表在计算模式下也用计算后属性**。详情**仅显示特殊属性列表**，**不显示光环**。
- **D-27（详情交互）:** 左下角为切换按钮「**切换至计算后属性** | **切换至基础属性**」；右下角为「**返回上一级**」。**打开方式不在本书范围**（后续另行提供「在地图中打开指定 View 详情」的能力）。

### 任务 3 · equipbox 装备界面（讨论已定）

> 参照图：`.planning/images/equipbox.png`（gitignored）。

- **D-28（布局）:** **左列 = 状态区域**（属性列举，**纵向滚动、不显示滚动条**，整列）；**右侧区域自上而下 = 装备描述区域 → 装备槽区域（横向滚动、不显示滚动条） → 拥有装备区域（纵向滚动、不显示滚动条）**。
- **D-29（属性列举）:** 入参提供**属性 id + 中文名列表**，按该列表顺序列举；平时显示**当前属性值**；选中装备时，在该数值**右方（靠右对齐）**显示**增减量**（增加绿、减少红）。
- **D-30（数据源）:** 装备槽来自玩家属性 **`state.equipment.slots`**，按该列表列举；**拥有装备列表按 id `sort()` 排序**（**不做筛选/排序 UI**）。入参除上述外，还包含**勇士状态 `HeroState`**。
- **D-31（对比规则）:** 选中装备时，与「**同类型的第一个槽位**」对比；若该类型槽位为空则**不对比**。点击**已装备**的装备仍算选中，但**仅显示「卸下该装备」导致的属性增减**。
- **D-32（交互）:** 选中后**再次点击** = 穿上（位置与对比装备一致，即 **autoUnload 下的 `equip`**）；**拖拽拥有装备到槽** = 装到指定槽；**拖拽已装备的装备** = 卸下。**打开方式不在本计划范围。**

### 任务 3 · 共享约束

- **D-33（画面尺寸）:** 任务 3 的**四个 UI（book / equipbox / toolbox / shop）均占满整个游戏画面**（**root renderer**），**而非整个 window**。
- **参考图说明（非决策）:** 参考图（如 `.planning/images/equipbox.png`）**仅作布局上的参考**，**不代表必须严格按参考图的比例**。
- **D-37（退出按钮位置）:** 任务 3 的 UI **若不额外说明，退出按钮统一放在右下角**。

### 任务 3 · toolbox 道具栏（讨论已定）

> 参照图：`.planning/images/toolbox.png`（与旧版基本一致）。

- **D-34（布局）:** 三列 —— 左列「**永久道具**」列表、中列「**可消耗道具**」列表、右列自上而下「**道具名称**」与「**道具说明**」（描述在最右，名称位于最右上）。
- **D-35（列表 / 排序）:** 道具分为**永久道具**与**可消耗道具**；各自按**数量从多到少**排序，**数量相同按 id 排序**。
- **D-36（交互 / 入参）:** **单击选中、再次点击使用**；**无丢弃、无拖拽**功能。入参为 **`HeroState`**。

### 任务 4 · shop 商店界面（讨论已定 · 现规划）

> 参照图：`.planning/images/shop.png`（仅布局参考）。**用户已提供数据端 `ShopState` 接口（尚未实现，但可用于 UI 参数与编写）**，故本界面纳入规划。

- **D-38（布局）:** 顶部「**购买选项 | 售出选项**」切换；左「**商店列表**」；右列自上而下 = 「**选中物品名称**」/「**选中物品描述**」/「**购入量选择**」（其**按钮上方**显示 **买价 / 卖价 / 存货 / 拥有 / 总价** 等价格信息）/「**购买按钮**」。占满游戏画面。
- **D-39（模式 / 列表）:** 可在**购入 / 售出**间切换；**售出也用「商店列表」**（商店不卖的，玩家也不能从背包售出）；列表按 **id 排序**；**库存显示在物品最右侧、右对齐**；列表**可滚动、显示滚动条**。
- **D-40（数量语义）:** 数量调整四个按钮 `<<  <  {当前购入/售出量}  >  >>`，步进**同 legacy**（`<<`/`>>` = ±10，`<`/`>` = ±1）；上限 = **购入：商店库存**、**售出：玩家拥有数量**；**数量按物品分别记忆**（切换物品时保存各自数量）；「购买按钮」买**当前选中物品**的数量。
- **D-41（边界 / 依赖）:** 本任务**只负责 UI 编写，不负责消费者如何调用**（**打开方式不管**）。商店数据由一个专门的 **`ShopState`**（数据端）承载；**接口已由用户提供、实现待补**。

### 任务 3 · 数据端接口补充（已由用户提供）

- **book**：`calculateEnemyCritical(...)`（基础属性路径）、`calculateViewCritical(...)`（计算后）、`IDamageSystem.with(hero)`；`@user/data-system` 已在 `client-modules` 声明。**已提供。**（OI-6「1 防」口径经用户确认：`getIsolatedAttribute().add('def',1)` → `with(...).calculateEnemyCritical(...)`，为预期写法。）
- **equipbox**：`compareEquip(uid, -1, slot)` 支持空槽 / 仅卸下。**已提供**；槽位路径确认为 **`heroState.equip.slots`**。
- **toolbox**：`IHeroItems.iterateItems()` 枚举已拥有道具。**已提供。**
- **shop**：`ShopState` 接口**已提供（实现待补）**，可用于 UI 参数与编写。
- **`<icon>`**：其实现为 **legacy**，需后续改造；**当前以它占位**。

### 任务 3 · 复查修正（四个 UI 已完成，现一并处理）

> 用户复查四个 UI 输出后提出的关键要求；待 book/equipbox/toolbox/shop **四个 UI 全部完成后一并修正**（**现在四个 UI 均已完成**），统一适用于这四个 UI（如适用亦可推广到其它 UI）。

- **R-1（不写 UI 背景）:** UI 内**不自行绘制背景**；UI 系统有专门的**背景控制器**，应交由它处理。
- **R-2（长文本必须用 `TextContent`）:** 长文本（如**特殊属性描述**）**必须用 `TextContent` 组件**渲染，**不要用 `text`**——`text` **不支持换行**，只有 `TextContent` 才能**多行渲染并支持换行**以及一些自身控制符。
- **R-3（顶层定义的 jsDoc）:** 为组件**顶层定义的每个变量 / 常量 / 函数**添加 **jsDoc 注释**。
- **R-4（JSX 分段注释）:** 可给组件的 **JSX 部分添加注释**，标明每段负责的内容。
- **R-5（按需导出）:** **不需要导出的类型不要导出**（例如 `IShopItemEntry` 应不导出）。
- **R-6（非空判断约定）:** 非空判断中，**字面量用 `isNil`**、**对象用 `!`**；**不要写 `=== undefined` 或 `=== null`**。
- **R-7（组件顶层无副作用）:** 组件**顶层不得有副作用**；如「打开商店」这类应放到 **`onMounted`**。
- **R-8（IEnemy / IEnemyView 判别，待进一步考虑）:** 区分 `IEnemy` 与 `IEnemyView` 时，**考虑改用 `instanceof EnemyView`** 替代 `'getBaseEnemy' in ...`（用户认为 `in` 不符合其风格；**此项待定**）。

### 任务 5（当前规划单元：legacy 接口只读统计）

> 本节界定**本次规划运行**的范围：仅规划任务 5。后续改造另行规划。

- **D-42（范围）:** 只统计 **`packages-user/client-base`** 与 **`packages-user/client-modules`** 两个包。
- **D-43（统计对象）:** ① 残余的 **legacy 接口**；② **标注 `@deprecated` 的接口**；③ **所有经 `core.*` 调用的接口**。
- **D-44（产出）:** 形成一份**统计文档**（文档路径 / 文件名待 Task 0 批准）。
- **D-45（只读）:** **只读统计**，**不进行任何改造工作**（改造在下一步另行规划）。

### 任务 6（当前规划单元：legacy 接口可替代性统计）

> 本节界定**本次规划运行**的范围：仅规划任务 6。后续改造另行规划。

- **D-46（目标）:** 对 09-11 统计出的 legacy 接口（`09-LEGACY-INTERFACES-AUDIT.md` 的 A / C 条目）**逐项判定**：① 在**所有非 legacy 包**中是否已提供**替代接口**；② 是否有**现成的替代方案**；③ 是否可**无痛替换**（直接替换不会引入问题）。结论用于决定后续改造顺序。
- **D-47（范围）:** 输入 = `09-LEGACY-INTERFACES-AUDIT.md` 的条目；替代方案搜索范围 = **所有非 legacy 包**（排除 `@motajs/legacy-*` 等 legacy 包），包含但不限于 `packages/` 与 `packages-user/`。
- **D-48（产出）:** 产出**判定文档**（路径 / 文件名待 Task 0 批准）。
- **D-49（只读）:** **只读分析**，**不进行任何改造**。

### 任务 7（当前规划单元：第一批改造 —— 「有替代方案」条目）

> 本节界定**本次规划运行**的范围：仅规划任务 7（第一批改造）。其余分类的改造另行规划。

- **D-50（范围）:** 第一批改造 = `09-LEGACY-REPLACEMENT-AUDIT.md` 中判定为 **`有替代方案`**（ALT）的条目（共 **40** 条），按文档给出的替代方案实施改造。
- **D-51（文件清单）:** 计划与执行中**务必准确记录涉及的源文件清单**（改动了哪些文件 / 位置），便于后续审阅。
- **D-52（依据）:** 依据 `09-LEGACY-REPLACEMENT-AUDIT.md` 的 ALT 条目及其替代方案 / `file:line` 锚点；不 invent 替代方案。
- **D-53（其它分类不在本批）:** `可直接替换` / `有替代但需适配` / `无替代` / `待定` 均**不在**第一批。
- **D-54（存档相关适配延后）:** 新存档系统与旧设计**完全不同**、适配难度大，故 **存档相关**的 legacy 适配**暂时忽略 / 延后**——含 `GameStorage`、`SaveSystem`、`localForage` 及 `core.saves` / `core.getSave` / `core.getAllSaves` / `core.setLocalForage` / `core.removeLocalForage` / `core.removeSave` / `core.clearLocalForage` 等**存档条目**（如 `A-1-1` 与 09-15 的存档簇）。后续另行规划。

- **D-55（任务 7 阻断标记）:** `09-14` / `09-15` / `09-16` 标记为**暂时无法执行（BLOCKED）**。共同根因：相关调用点在**模块级文件**（无法经 props 取主对象、且禁 `client` 单例）或依赖**未导出类型 / 主对象缺失接口 / 无等价物 API**。完成情况：仅 `09-13`（回退层去除 + 调用点）已落地；`A-6`（loading）由用户自行处理；存档相关（`A-1-1` + 7 条）按 D-54 延后。**待用户提供/调整注入路径与缺失接口后另行规划。**

### 任务 8（当前规划单元：旧引擎数据迁移）

> 本节界定**本次规划运行**的范围：仅规划任务 8 的**只读盘点**计划；实际迁移在盘点执行后由用户再派发时另行规划。旧数据位于 `public/project`（素材 `materials/*.png`、`animates/*.animate`、`images/`、`tilesets/`、`autotiles/`、`sounds/`、`bgms/`，逻辑数据 `maps.js` 的 `blocksInfo`、`items.js`、`enemys.js`、`events.js`、`functions.js`、`floors/*.js`）；新引擎数据存储落点为 `src/content`（`client.jsonc`/`core.jsonc`/`tile.jsonc`/`enemy.jsonc`/`item.jsonc`/`maps/`/`texture/.list.jsonc`/`animation/.list.jsonc` 及 `defaults/*`）。

- **D-70（落点与接线边界）:** 迁移目标为 `src/content`（jsonc 数据 + 素材文件）。把配置写入 store、把贴图列表写入 `TextureManager` 的**消费接线由用户后续单独提供**，本次不实现接线。
- **D-71（范围）:** 本次迁移覆盖 **图块定义 tile、地图 maps、贴图素材 textures、怪物 enemy、道具 items、NPC** 六类；`animation` 素材**暂不挪**（不处理 `animates/*.animate`）。`images/sounds/bgms/fonts` 不在本次迁移范围。`public/project/autotiles/*.png` 与 `public/project/tilesets/*.png` 归入「贴图素材 textures」维度，**纳入**本次盘点与迁移（2026-10-13 用户裁定）。
- **D-72（合并 / 分图规则）:** ① `npc` 与 `npc48`、`enemy` 与 `enemy48` 均**合并**（不再有 48 变体）；② `terrains`/`items`/`enemy`/`npc` **分别存储**，不得混入同一张图片；③ `animates` **合并入 `terrains`**；④ **不同帧数**的素材不得放入同一张图片；⑤ 单帧素材按 **4×4** 规格拆分，多帧素材按「**帧数列 × 4 行**」拆分。
- **D-73（贴图列表 schema 与命名）:** `texture/.list.jsonc`（及 `animation/.list.jsonc`）的字段结构由 AI 依据 `TextureManager` 的 `addGrid`/`addRowAnimate`/`addAutotile`/`addTileset` 能力反向设计；**新增或修改的任何公共 / 受保护 / 私有方法、字段等命名，必须先向用户报备并获批准后方可使用**（符合 `AGENTS.md`）。
- **D-74（本次规划单元 = 只读盘点）:** 本规划运行只产出**只读盘点**计划，盘点产物文档为 `.planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-AUDIT.md`；**全程只读**——零生产代码改动、零数据文件改动、零 PNG 生成。盘点内容须为后续“迁移计划”提供可直接消费的映射台账（含字段映射候选与待报备命名候选）。实际迁移计划在盘点执行后由用户再派发。
- **D-75（素材生成归属）:** 迁移阶段将由 AI **用脚本生成**符合 D-72 规则的 PNG 素材文件；本盘点阶段**不生成**任何素材。

### 任务 9（当前规划单元：旧引擎数据基础移植）

> 本节界定**本次规划运行**的范围：任务 9 = 旧引擎数据的**基础字段移植**。输入 = `09-DATA-MIGRATION-AUDIT.md`（任务 8 盘点台账）。实际复杂字段（无对应目标字段者）本增量不移植，另行成文档由用户后续补充。

- **D-76（本次规划单元 = 基础移植）:** 任务 9 把**基础字段与数据**从 `public/project` 移植到 `src/content`。**无法对应的字段**（新接口 `ITileRawData`/`ITilePassData`/`IEnemyRawData`/`IItemRawData`/`IMapRawData` **无对应字段**，即盘点文档 §8.1「只记录、不移植」）**本增量不移植**，单独形成一个说明文档（见 D-78），由用户后续补充。
- **D-77（产出形态）:** 写入 `src/content` 的 `tile.jsonc` / `enemy.jsonc` / `item.jsonc` / `maps/*.jsonc`（**替换现有样例**）；按 D-72 生成 PNG 素材到 `src/content/texture/`；写 `src/content/texture/.list.jsonc`。六类（tile/maps/textures/enemy/items/NPC）**基础字段全量**。
- **D-78（无法对应字段说明文档）:** 仅「**新接口无对应字段**（§8.1 只记录、不移植）」的字段进该文档；文档路径/命名**待批准**（提议 `.planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-UNMAPPED.md`，供用户后续补充）。`§8.2 待定`（有目标字段但映射不定）**不**进该文档，本增量亦不移植，保留在盘点文档待后续裁定。
- **D-79（num 分配策略 = A）:** 图块 `num` 采用 **A · 按 `TileType` 分段**（同类型连续编号，唯一约束 `id` ↔ `num` 一致），不沿用旧引擎顺序。
- **D-80（命名批准）:** `src/content/texture/.list.jsonc` 的类型/字段命名照 09-18 §7.1 提议**批准**：`TextureListSource`、`ITextureListGridEntry`、`ITextureListRowAnimateEntry`、`ITextureListAutotileEntry`、`ITextureListTilesetEntry`、`TextureListEntry`、`ITextureListConfig`；字段 `type`/`source`/`map`/`width`/`height`/`identifier`/`autotileType`/`cellWidth`/`cellHeight`/`textures`（autotile 的 `AutotileType` 参数用 `autotileType` 以避开判别字段 `type`）。
- **D-81（素材落点与命名）:** 迁移生成的 PNG 放 `src/content/texture/`，采用盘点候选名：`terrains0..2.png` / `terrainsAnim0..7.png` / `enemy0..20.png` / `npc0..5.png` / `items0..3.png`（以盘点 §2 与 `SPLIT-COUNT` 实测为准）。
- **D-82（地图范围）:** 迁移**全部 5 个楼层**：`empty` / `MT0` / `sample0` / `sample1` / `sample2`。
- **D-83（消费接线与 animates/events 边界）:** 消费接线（把配置写入 store、把 list 写入 `TextureManager`）仍由**用户后续单独提供**，本增量不实现。沿用 D-72③（`animates` 素材并入 `terrains`）与用户指令 2（旧 `events`/`trigger` 等无对应目标字段者不移植）。
- **D-84（贴图布局放宽，修订 D-72⑤）:** 贴图布局**不必严格「单帧 4×4 / 多帧 帧数列×4 行」**；当素材不足以填满时，可**合理裁剪**（例如裁剪为 **3 行或 2 行**）。**列数**仍按「单帧 4 列 / 多帧 = 帧数列」（若用户对列数另有口径，按其指定）。本增量生成贴图与相关门禁须按实际行数（≤4）与裁剪后的尺寸断言，不得硬编码 4 行尺寸。（2026-10-13 用户裁定）

- **D-85（OI-3 裁定 = A · 按尺寸分组；修订 D-81 的 npc 计数）:** **不同尺寸的素材必须用不同图片**——NPC 素材按尺寸分组：32×32 组与 64×48 组**各自成图**，**不放一块、不留白、不重采样**。`npc` = `npc0..6`（**7 张**：32px 组 4×64×128 + 48px 组 3×128×192），`SPLIT-COUNT` = **43**。D-81 中 `npc0..5` / 42 的 **npc 计数部分由本条取代**（enemy 不受影响，仍 `enemy0..20`=21）。禁止以「统一帧尺寸 + 透明留白」的方式把不同尺寸混入同一张图。（2026-10-13 用户裁定）

### 任务 10（当前规划单元：数据端 + 渲染端插件系统）

> 本节界定**本次规划运行**的范围：任务 10 = 实现**数据端插件驱动**，并在**渲染端镜像一套一样的插件系统**并实现。输入 = `packages-user/data-state/src/types.ts`（用户新增的数据端插件类型）。仅引擎侧，**不接入口配置**（用户最后自行接线）。

- **D-86（本次规划单元 = 插件系统）:** 实现数据端插件系统驱动（用户新增的 `IDataPluginDefine` / `IDataPlugin` / `PluginStatus` / `getDataPlugin` / `load()`），并在渲染端镜像一套一样的系统（`IClientPluginDefine` / `IClientPlugin` / `getClientPlugin` / `clientPlugins`）并实现。**仅引擎侧**：不改 `src/` 入口与配置接线（用户最后自行接线）；不动用户其它并发改动（D-56）。
- **D-87（数据端驱动 = 四段式 load）:** `CoreState.load()` 驱动流程 = ① `awake`（同步，主对象创建后、初始化前）→ ② `initialize`（异步、阻塞，加载开始前）→ ③ 执行 loader 加载 → ④ `afterLoad`（异步、阻塞，加载完毕后）。各阶段**按依赖拓扑序**执行；**依赖环**时抛错/告警且环上插件不初始化。`getDataPlugin(id)` 从注册表读取。
- **D-88（渲染端镜像命名与落点）:** 命名用 **`IClient*` 系列**——`IClientPlugin` / `IClientPluginDefine` / `getClientPlugin`，配置字段 **`clientPlugins`**；类型放 **`packages-user/client-modules/src/types.ts`（顶层，与数据端对齐）**；**复用数据端 `PluginStatus`**（不自建枚举）。实现放 `ClientCore`。
- **D-89（生命周期）:** 渲染端 `awake` / `initialize` / `afterLoad` 的时机与语义**与数据端一致**（D-87 的四段式）。
- **D-90（驱动顺序）:** **数据插件先、渲染插件后**，在**统一 `load()`** 中按同一四段式驱动：数据端阶段（L0-L3）先执行，渲染端阶段（L4-L5）后执行。
- **D-91（范围边界）:** 仅实现插件系统机制本身；不改入口/接线；不改 `initializeL0..L3` 等 config 字段口径（用户自行处理）；不新增依赖；遵循 `dev.md`（无循环引用、命名、jsDoc、无副作用模块）。
- **D-92（插件错误处理与日志码，修订 D-87）:** 插件系统用**新错误码**（`packages/common/src/logger.json` error 段新增）：**循环依赖 → 76**；**依赖不存在的插件 → 77**；**重复 id → 78**。**重复 id 不覆盖原插件**（保留先注册者，重复者不注册）。**报错的插件全部不进入加载流程**（`awake`/`initialize`/`afterLoad` 均不执行；其下游依赖者亦不加载）。取代 D-87 中「复用 error 75」的口径；错误消息文本待用户批准。（2026-10-14 用户裁定）

### 任务 11（当前规划单元：构建重构）

> 本节界定**本次规划运行**的范围：任务 11 = 重构构建脚本以适配新引擎（`script/build-game.ts` / `script/build-resource.ts`），删除 `build-packages.ts` 与 `build-lib.ts`。`script/dev.ts` **不在范围**。

- **D-93（范围）:** 重构 `script/build-game.ts` 与 `script/build-resource.ts`；**删除** `script/build-packages.ts` 与 `script/build-lib.ts`（后者为 vite-plugin-dts 遗留，不需要类型声明）；`script/dev.ts` 不在本次范围。
- **D-94（数据端/渲染端分离 + Vite 插件检测）:** 保证**数据端独立包不得引用渲染端**。写一个 **Vite 插件**在构建数据端时扫描其模块图，若含渲染端模块（`@user/client-*`、`@motajs/render*`、`vue` 等）则**报错并终止**构建。**取代**现有按构建体积推断的 `checkClientData` 启发式。
- **D-95（数据端产物）:** 数据端构建为**库模式**、输出 **ESM**（**不用 iife**），入口 `src/data.ts`，产物 `dist/data/data.js`。
- **D-96（content 处理）:** 构建后把 `src/content` 复制到 `dist/content`（去掉 `src` 前缀）；做**简单压缩**——**jsonc** 用 `JSON.parse + JSON.stringify` 压缩（**去掉注释**，**后缀仍保留 `.jsonc`** 以确保加载不出错）；**字体**用 fontmin 压缩；**不做资源分块**（不生成 `resource.<hash>.h5data`），**不做 zip 压缩**。`build-resource` 改为从 `src/content` 读取素材。
- **D-97（删除旧模板内容）:** **不保留** `public/**`（即将整体删除）、`editor.html`、`_server`、`_docs`、`libs`、`logo.png`、`styles.css`、`main.js`、`script/template/启动服务.exe`；**不打包** `source-code.zip`；**不加** `loadList.json`；**保留 `LICENSE`（LGPL v3）**。`index.html` 去掉旧 `<link href='/styles.css'>`，样式改由入口经 JS 打包引入。
- **D-98（脚本与 npm script 调整）:** 删除 `build-packages.ts` / `build-lib.ts` 及 `package.json` 中对应 `build:packages` / `build:lib` script；`build:game` 保留并调整（同时产出渲染端游戏与数据端独立包）。
- **D-99（类型检查前置）:** 构建仍**前置 `vue-tsc --noEmit`**（保留）。
- **D-100（渲染端构建微调）:** 移除 main.js 二次压缩（babel）步骤（`main.js` 不留）；legacy 插件与 `manualChunks` 按新引擎实际情况微调。

### the agent's Discretion

- 无。用户明确未授权 AI 自行决定 UI 形态或任务范围。

</decisions>

<specifics>
## Specific Ideas

- 用户原话（任务方向）：「这一阶段的主要任务有两个：将 client-modules 按照依赖关系拆成 client-base 与 client-modules，这部分工作已经完成了一部分，但仍可能有部分内容尚未拆分完毕。第二个任务是将实现层与架构层对齐，这部分主要是接口适配性的工作，例如目前 UI 系统已经完成了重构，但是 UI 实现尚未完全对齐，且存在不少 legacy 实现（@motajs/legacy-ui），这部分内容都需要移植到新接口上。」
- 用户原话（执行方式）：「这部分的内容比较杂，也比较多，我很难一次性把目标全部指定完毕，尤其是 UI 应该长什么样也没有一个明确约定……所以我打算一步步来，每次给你派发一个小任务，你根据这个小任务创建计划，并执行，执行完毕后我再进行后续任务的派发。」

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目与阶段定义
- `.planning/PROJECT.md` — 项目核心价值与项目级决策
- `.planning/ROADMAP.md` — Phase 9 目标与依赖（Depends on: Phase 8）
- `.planning/REQUIREMENTS.md` — 需求基线
- `dev.md` — 项目开发规范（命名、流程、约束）
- `AGENTS.md` — AI 行为约束（含执行前须获批、命名须先反馈等）

### 代码库地图
- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/CONCERNS.md`
- `.planning/codebase/STACK.md`
- `.planning/codebase/TESTING.md`

### 前序渲染端拆分/对齐产物（Phase 4，直接相关）
- `.planning/phases/04-render-adaptation/04-CONTEXT.md` — Phase 4 决策基线
- `.planning/phases/04-render-adaptation/04-STRUCTURE-MIGRATION-IMPACT.md` — `client-modules` → `client-base` 结构性迁移影响台账
- `.planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md` — 渲染端去单例化清点（单例 → 主类挂载 + 接口继承）
- `.planning/phases/04-render-adaptation/04-UI-ADAPTATION-IMPACT.md` — UI 接口适配影响台账（全局 loading/hook 删除、新加载系统）
- `.planning/phases/04-render-adaptation/04-RENDER-INTERFACE-AUDIT.md` — 渲染端 ↔ 数据端接口对账
- `.planning/phases/04-render-adaptation/04-PATTERNS.md` — 既有模式映射

### 数据端状态（已基本完成，Node 可运行/回放验证）
- `.planning/phases/03-data-completion/03-CONTEXT.md`
- `.planning/phases/08-test-refactor-alignment/08-CONTEXT.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### 相关包（已核实存在）
- `packages-user/client-modules` — 待继续拆分；含 UI 实现与 legacy 接线
- `packages-user/client-base` — 渲染系统层（Phase 4 已迁入 `components/` `elements/` `map/` `layout/`）
- `packages-user/client-system` — 客户端系统层
- `packages/legacy-ui`（`@motajs/legacy-ui`）— legacy UI 实现，待移植到新接口
- `packages/legacy-common` / `packages/legacy-system` — legacy 相关包（相关时再评估）
- 数据端：`packages-user/data-*` 与 `packages/*`（已基本完成，Node 可运行/回放）

### Established Patterns（来自 Phase 4 决策，仍适用）
- **D-69 桶导出硬约束**：barrel 只允许 `export * from './<同目录项>'`；消费者必须直连 `@user/client-base`，不得经 barrel 转发。
- **去单例化**：渲染端单例改为挂载到主类（`ClientCore` / `client`），子系统继承/实现 `IClientBaseExtended`（`client-base/src/types.ts`）或 `ICoreStateExtended`（`data-state/src/types.ts`），镜像数据端模式。
- **双端分离**：数据端无 DOM，可在 Node 独立回放；渲染端不向数据端推送更新。

### Integration Points
- 待定。由每个小任务在规划阶段确定具体接入点与影响范围。

</code_context>

<deferred>
## Deferred Ideas

- 完整 UI 形态规范——本阶段无固定约定，由用户按任务逐个提供。
- 未派发的其余杂项对齐工作——随用户后续增量派发进入 Phase 9 计划，不预先纳入。

### 09-26 覆盖层性能讨论与后续优化（暂不实施）

- **当前排序**：`sortOverlay()` 对「全部静态半透明记录 + 全部活动移动块」做一次全量 `sort`，比较键为 `(layerIndex, y, x, kind)`，复杂度 O(N log N)。
- **可见性**：覆盖层不做可见分块 / 视口裁剪。非可见分块里的半透明图块仍会参与排序、组装并提交，只是被 GPU 裁剪，不产生片元；不透明遍则通过 `getRenderArea()` 只处理可见分块。
- **决策**：先不做优化。等渲染端完成后先做基准测试；只有性能不佳再考虑优化。
- **预期规模**：通常同屏十几个半透明 + 可移动图块，极端情况可能几百个；按此规模，全量排序与组装的成本预计可接受。
- **待评估优化 1：可见性裁剪**。按可见分块 / 屏幕矩形过滤覆盖层条目；复用 `getRenderArea()` 的可见范围并向外扩「最大图块尺寸 / 格子尺寸」的边距，避免大图块锚点在不可见格但像素伸入画面的情况。可在排序 / 组装附近留 TODO 注释。
- **待评估优化 2：桶排序**。可按 `(layerIndex, Math.floor(y))` 分桶，桶内再按 `x`（以及 `kind`）排序，复杂度约 O(N + Σ k_b log k_b)。注意：当前比较器使用精确的小数 y，动态块 y=3.4 / 3.7 会按 y 排序；若改成 floor 分桶且桶内只排 x，会改变同一行内动态块的先后。若必须保留小数 y 的精确顺序，桶内仍需按 `(y, x, kind)` 排序，收益会小一些。
- **其他可选优化**：复用桶数组与条目对象以避免每帧分配；避免每帧 `subarray` 视图；覆盖层上传可用 `bufferSubData` 代替 `bufferData`；大量 `setAlpha` 集中在同一帧时注意 flush 峰值与分块重传。
- **基准测试关注点**：分别测「无半透明且无动态块」「无半透明但有勇者等动态块」「少量静态半透明」「大量静态半透明 + 每帧移动 / 换帧」；记录帧时间、CPU 排序 / 组装耗时、draw call 数与 GC 情况。

</deferred>

---

*Phase: 09-minimum-browser-runnable*
*Context gathered: 2026-10-08*
