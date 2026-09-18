# Phase 4: 渲染适配与双布局 - Context

**Gathered:** 2026-09-18
**Status:** Ready for planning (incremental — 本次仅锁定第一步)

<domain>
## Phase Boundary

阶段 4 的最终目标（ROADMAP）：渲染端通过新数据层接口驱动，并同时支持移动端与桌面端布局（REND-01、REND-02）。

**重要：本阶段无法一次规划完毕。** 用户明确要求增量规划，本次讨论只规划**第一步**：

> 收集当前所有与数据端接口不匹配的渲染端实现（含依赖数据端的渲染行为），形成对账文档，作为后续计划如何拆分实施的依据。数据端未提供而渲染端需要的接口、双方错配等，单独成节写入该文档，便于后续处理。

第一步是**只读清点**，不修改任何代码。后续步骤待第一手对账结果出来后另行规划。

</domain>

<decisions>
## Implementation Decisions

### 增量规划方式
- **D-01:** 阶段 4 采用增量规划，不一次性产出完整计划；本 CONTEXT 仅锁定第一步（对账），后续步骤待对账结果出来后再规划。
- **D-02:** 第一步交付物为对账文档 `.planning/phases/04-render-adaptation/04-RENDER-INTERFACE-AUDIT.md`；该步为只读清点，不改任何代码。

### 对账范围与基准
- **D-03:** 被查对象限定 `packages-user` 下的 `client-base` 与 `client-modules` 两个渲染端包。`packages` 偏向第三方库、本身不影响渲染端与数据端，不查；其余 packages-user 子包（`entry-client`、`legacy-plugin-client`、`legacy-plugin-data`、`data-fallback`）不纳入本次第一步。
- **D-04:** 数据端 `data-common` / `data-base` / `data-system` / `data-state` 不作为被查对象，仅作为接口基准（契约源为各自 `types.ts`、`core.ts`、`ins.ts` 等）。
- **D-05:** 用户会同步修改数据端**实现**，但接口签名不变；对账一律以「接口」为准，不受实现变动影响。

### 问题分类与记录粒度
- **D-06:** 问题按三类划分：① 错配（渲染端按旧形状/旧签名调用，数据端接口已变）；② 数据端缺失（渲染端需要而数据端未提供的接口）；③ 多余旧路径（渲染端仍在走已被新接口取代的 legacy/旧路径）。
- **D-07:** 每条记录精确到接口名，并包含其所属文件、问题描述、影响等内容。
- **D-08:** 采用单文档分节组织；「数据端缺失接口」独立成节，便于后续单独处理。

### 执行方式
- **D-09:** 允许派子代理进行只读扫描（不得修改任何文件）。

### the agent's Discretion
- D-07 的「影响」字段具体写法、「多余旧路径」是否需要进一步细分，交由 AI 在对账执行时按实际情况把握，但不得据此扩大范围。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and phase requirements
- `.planning/PROJECT.md` — 项目架构、双端分离、AI 实现边界与质量约束
- `.planning/REQUIREMENTS.md` — REND-01 / REND-02 需求
- `.planning/ROADMAP.md` — Phase 4 目标、成功标准与相邻阶段边界（Phase Details → Phase 4）
- `.planning/STATE.md` — 当前仓库状态与既有决策
- `dev.md` — 项目结构与开发原则；「双端分离」章节定义 `@user/client-base`（系统层）与 `@user/client-modules`（实现层）

### Data-side interface baselines (基准，不是被查对象)
- `packages-user/data-common/src/types.ts` — L0 `IDataCommon` 契约
- `packages-user/data-base/src/types.ts` — L1 `IStateBase` 契约
- `packages-user/data-system/src/types.ts` — L2 `IStateSystem` 契约
- `packages-user/data-state/src/types.ts` — L3 `ICoreState` 契约
- `packages-user/data-state/src/core.ts` — 顶层装配与 legacy 初始化路径
- `packages-user/data-state/src/ins.ts` — 既有单例入口
- `packages-user/data-common/src/replay/types.ts` — 录像命令/沙箱/状态契约
- `packages-user/data-common/src/store/types.ts` — Tile raw-data 与事件访问契约
- `packages-user/entry-data/src/mota.ts` — `Mota` 注册表与 `r()`/`rf()` 渲染调用门控
- `packages-user/data-base/src/game.ts` — `hook` / `gameListener` 渲染通知机制

### Render side under audit (被查对象)
- `packages-user/client-base/src/index.ts` — 渲染系统层入口
- `packages-user/client-modules/src/index.ts` — 渲染实现层入口

### Prior phase context
- `.planning/phases/03-data-completion/03-CONTEXT.md` — 数据端完成阶段的接口边界与已锁定决策（D-01..D-28、S-01..S-05）

</canonical_refs>

<code_context>
## Existing Code Insights

> 本次未对渲染端代码做实际扫描（用户要求讨论阶段不由 AI 先行探索）。以下来自既有 `.planning/codebase/` 分析文档，仅作方向参考；对账执行时以实际代码为准。

### Reusable Assets
- `@user/client-base`（`packages-user/client-base/src/`）— 渲染端系统层，负责渲染核心系统（`load/`、`material/`）
- `@user/client-modules`（`packages-user/client-modules/src/`）— 渲染端实现层，依赖系统层实现渲染与用户交互（`render/`、`action/`、`fallback/`）
- `hook` / `gameListener`（`packages-user/data-base/src/game.ts`）— 数据端向渲染端发布通知的既有机制
- `Mota.r()` / `Mota.rf()`（`packages-user/entry-data/src/mota.ts`）— 数据端调用渲染端代码的唯一受控入口

### Established Patterns
- 依赖方向单向：`src → packages-user → packages`；数据端分层 `data-common → data-base → data-system → data-state`
- 双端分离：渲染端只向数据端发消息，不向数据端推送更新；数据端无 DOM
- 公共契约以 `types.ts` + barrel 导出表达，接口设计归用户，AI 不得自行发明公共接口行为

### Integration Points
- 渲染端读取游戏状态的耦合点即对账重点：需判定其读取的是新数据层接口还是 legacy 全局
- `packages-user/entry-client/src/create.ts` 为渲染端组合根（本次不在被查范围，但对账时可作为理解接线方式的参考）

</code_context>

<specifics>
## Specific Ideas

- 「收集当前所有与数据端接口不匹配的渲染端实现」——不止显式调用，依赖数据端的渲染**行为**也可能不匹配，需一并清点。
- 数据端缺失接口与错配项要单独成节，便于用户后续处理（用户会自行决定其在数据端或渲染端解决）。
- 对账以接口为准，不受用户并行修改数据端实现的影响。

</specifics>

<deferred>
## Deferred Ideas

- 阶段 4 的后续步骤（实际适配实施、移动端/桌面端双布局实现）——待第一步对账结果出来后另行规划。
- 已确认不在本次第一步范围：`packages` 全部、`entry-client`、`legacy-plugin-client`、`legacy-plugin-data`、`data-fallback`。

</deferred>

---

*Phase: 4-渲染适配与双布局*
*Context gathered: 2026-09-18*
