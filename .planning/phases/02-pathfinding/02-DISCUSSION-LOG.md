# Phase 2: 寻路系统 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-09
**Phase:** 2-寻路系统
**Areas discussed:** 用户设计阐述, 算法与接口细节, 不可达目标语义, 范围收窄

---

## 用户设计阐述（free-form）

用户先完整阐述寻路系统设计想法，替代逐项选择题：

- 目标：两点之间损失最小的路径；系统允许自定义损失函数
- 流程：地图 → 有向图（仅当前位置可达位置，含单向通行）→ 逐图块自定义损失 → 最小损失路径算法求解
- 扩展性：可绑定 `IMapLayer`（地图）与 `IObjectMovable`（移动对象）
- 两种移动方式：逐步寻路 / 瞬移；瞬移路径上有事件、道具等则回退为逐步
- 额外提供仅获取路径的方法
- 协作方式：AI 自行设计接口（参考现有接口理念），**经用户修改拍板后再实现**

---

## 算法与接口细节

| Option | Description | Selected |
|--------|-------------|----------|
| 每格 1（推荐） | 默认每移动一格损失 1，可被自定义函数覆盖 | ✓ |
| 无默认，强制传入 | 无损失函数时需显式传入才能寻路 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 存在事件即回退（推荐） | 路径上任一格存在点事件或图块事件即回退逐步 | ✓ |
| 仅点事件 | 只有点事件触发回退 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 复用现有 mover（推荐） | 复用 DefaultHeroMoveTopImpl 逐格移动，每步走 enter/leave/hit hooks | ✓ |
| 自建执行 | 寻路系统自建步进执行 | |

| Option | Description | Selected |
|--------|-------------|----------|
| 可打断（推荐） | 新方向键/点击输入立即打断并接管 | ✓ |
| 不可打断 | 走完为止 | |

**User's choice:** 全部选择推荐项
**Notes:** 用户补充：应提供接口用于决策是否回退移动方式——接收一个函数，入参为寻路路径及每步会到达的位置（即 D-05 的策略函数注入设计）

---

## 不可达目标语义

| Option | Description | Selected |
|--------|-------------|----------|
| 不移动（针对点击不可达格） | 角色停在原地 | （语义被后续补充取代） |
| 走近到最近可达格 | 寻路到最近可达格停下 | （语义被后续补充取代） |

**User's choice:** 用户后续补充更精确的双语义：目标为 no-pass 图块且四周有可达坐标 → 移到相邻格并触发目标位置 OnTouch 触发器、勇士面朝目标；其他情况 → 忽略本次移动，路径为空数组
**Notes:** 该补充取代了最初的简单选项

---

## 范围收窄

**User's choice:** 玩家交互先不完成，这部分是渲染端的内容；本次任务仅关注数据端系统
**Notes:** PATH-02 点击触发接线延迟到 Phase 4 渲染适配

---

## the agent's Discretion

- 图构建时机与缓存策略（默认建议动态构建）
- 具体算法选型（满足最小损失 + 有向图语义即可）
- 接口命名、签名、文件归属层细节——草案中提出，用户拍板

## Deferred Ideas

- 移动端点击地图触发寻路的渲染端接线 → Phase 4 渲染适配

---

## 执行修正（2026-09-10）

本次执行直接处理用户对 Phase 2 产物的结构审查意见，跳过新的 Plan 阶段；以下四项为本次执行的约束与验收依据：

1. `IPathGraphEdge`、`IPathGraphNode`、`IPathGraph`、`IPathfindingGraphBuilder` 的类型声明与注释必须位于 `data-system/src/path/types.ts`，不得放在 `graph.ts`。
2. 删除未获用户要求的 `data-state/src/path/heroPathfinding.ts` 及其测试、barrel 和 `CoreState` 接线；Phase 2 不交付勇士专用 L3 寻路封装。
3. `DirectionMapper` 必须作为 `IDataCommon` 的共享依赖由主对象挂载，`PathfindingGraphBuilder` 不得自行构造。
4. 通行性谓词不得命名或实现为勇士专属对象；提取到独立 `predicate.ts`，接口命名为 `DefaultPassPredicate`。

本记录作为本次直接执行的范围来源；执行结果写入 `02-06-SUMMARY.md`，验证以修改后的 L2 代码和现有测试为准。
