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
