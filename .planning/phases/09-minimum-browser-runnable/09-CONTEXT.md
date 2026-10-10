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

</deferred>

---

*Phase: 09-minimum-browser-runnable*
*Context gathered: 2026-10-08*
