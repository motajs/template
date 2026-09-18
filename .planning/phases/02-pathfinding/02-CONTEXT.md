# Phase 2: 寻路系统 - Context

**Gathered:** 2026-09-09
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段交付**数据端寻路系统**：在两点间寻找损失最小的路径并驱动移动对象移动（逐步寻路 / 瞬移两种方式），支持自定义损失函数、有向图寻路、仅获取路径的 API。玩家点击交互（点击地图触发寻路）属于渲染端内容，本阶段不做接线——数据端只提供供渲染端后续调用的移动入口（PATH-02 的点击接线在 Phase 4 渲染适配时完成）。
</domain>

<decisions>
## Implementation Decisions

### 算法与接口

- **D-01:** 寻路目标是两点之间**损失最小**的路径；系统允许调用方自定义损失函数，默认实现为每格损失 1
- **D-02:** 算法流程：(1) 将地图转换为**有向图**——仅包含从当前位置可以到达的位置，由于存在单向通行位置，图必须是有向的；(2) 对图中每个图块用自定义损失函数计算损失；(3) 用算法找出损失最少的路径并返回
- **D-03:** 寻路系统具备足够扩展性，允许绑定 `IMapLayer`（地图）与 `IObjectMovable`（移动对象）两类对象
- **D-04:** 系统提供**两种移动方式**：逐步寻路至目标点；瞬移至目标点。瞬移前经回退策略判定，判定需要回退则自动退为逐步寻路
- **D-05:** 提供**回退决策接口**：接收一个策略函数，函数入参为寻路路径及每步会到达的位置，由该函数决策是否回退移动方式。默认策略实现为"路径上存在事件即回退"（事件可能改变状态，瞬移会跳过副作用）
- **D-06:** 提供**仅获取寻路路径**的方法（不移动，只返回路径）
- **D-07:** 接口设计流程：AI 先按现有接口设计理念起草接口草案，**经用户修改拍板后才进入实现**——planner 必须内置该 review 关卡（接口经用户确认前不得开始实现任务）

### 不可达目标语义

- **D-08:** 寻路至不可达位置时分两种情况：(1) 目标本身是 no-pass 类图块且四周有坐标可以到达——移动到该相邻格，触发目标位置的 **OnTouch** 触发器（走 Phase 1 事件链路），勇士面朝目标位置；(2) 其他情况——忽略本次寻路移动，路径为空数组

### 移动执行

- **D-09:** 逐步寻路的执行**复用现有 hero mover**（`DefaultHeroMoveTopImpl`），每步走 enter/leave/hit hooks，途经事件自然触发（与 Phase 1 source-aware 事件派发一致）
- **D-10:** 自动寻路途中**可被玩家输入打断**：新的方向键输入或新的点击立即打断并接管（魔塔惯例）

### 范围收窄

- **D-11:** 本阶段仅关注数据端系统；玩家点击交互是渲染端内容，PATH-02 的点击触发接线延迟到 Phase 4 渲染适配

### the agent's Discretion

- 图的构建时机与缓存策略（每次寻路动态构建 vs 缓存）——数据端状态可变（敌人/门/道具），默认建议动态构建
- 具体算法选型（满足"最小损失 + 有向图"语义即可，AI 决定）
- 接口命名、签名与文件归属层的细节——在**接口草案**中提出，最终由用户拍板

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 寻路相关现有接口

- `packages-user/data-common/src/common/mover.ts` — `IObjectMovable` 接口与 mover 抽象（寻路绑定对象之一）
- `packages-user/data-state/src/hero/moverImpl.ts` — 现有 hero 移动实现（`DefaultHeroMoveTopImpl`；Phase 1 已重写为事件驱动，enter/leave/hit hooks）
- `packages-user/data-base/src/map/mapLayer.ts` — `IMapLayer`（寻路绑定对象之一，图构建的数据来源）

### 事件系统（OnTouch 链路）

- `packages-user/data-common/src/event/types.ts` — `EventTrigger` 枚举（OnTouch 等）+ `IGameEvent` 接口
- `packages-user/data-common/src/store/eventStore.ts` — `GameEventStore`（id → event）

### 规划与约束文档

- `dev.md` — 项目开发规范（模块原则、类型规则、禁 `as`、logger 错误码、禁循环依赖）
- `.planning/ROADMAP.md` — Phase 2 目标与成功标准
- `.planning/REQUIREMENTS.md` — PATH-01 / PATH-02
- `.planning/PROJECT.md` — 协作模型（接口设计用户主导）与双端约束
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `IObjectMovable`（`data-common/common/mover.ts`）：移动对象抽象，寻路系统直接绑定
- `DefaultHeroMoveTopImpl`（`data-state/hero/moverImpl.ts`）：现有逐步移动执行器，Phase 1 已接入 source-aware 事件派发，逐步寻路复用它
- `IMapLayer` / `MapLayer`（`data-base/map/`）：地图层数据，含碰撞/图块信息，是图的构建来源
- `hook` 事件（`data-base/game.ts`）：`moveOneStep` 等生命周期事件，逐步移动的每步钩子

### Established Patterns

- 数据端分层：L0（data-common）放公共接口，L1（data-base）放可存档数据，L2（data-system）放游戏逻辑动作（不存档）——寻路算法/系统按此分层归属（草案中定位，用户拍板）
- 接口前缀 `I`、禁 `as` 断言、logger 数字错误码、禁循环依赖、模块无顶层副作用（`createXxx()` 工厂模式）
- 双端分离：数据端无 DOM，寻路逻辑必须在数据端，Node 回放可验证

### Integration Points

- 渲染端 action（`client-modules/src/action/`）在 Phase 4 将点击意图发到数据端寻路入口
- hero enter/leave/hit hooks（Phase 1）在逐步移动经过图块时派发 OnEnter/OnLeave/OnTouch 事件
</code_context>

<specifics>
## Specific Ideas

用户明确阐述的算法流程（两点最小损失路径、有向图、逐格自定义损失、最小损失算法求解）见 D-01/D-02；瞬移回退策略、不可达目标双语义（相邻格 + OnTouch / 空数组）见 D-05/D-08。无外部参考文档。
</specifics>

<deferred>
## Deferred Ideas

- 移动端点击地图触发寻路的**渲染端接线**（点击拾取、不可达格点击反馈等 UI 行为）——属 Phase 4 渲染适配
</deferred>

---

*Phase: 2-寻路系统*
*Context gathered: 2026-09-09*
