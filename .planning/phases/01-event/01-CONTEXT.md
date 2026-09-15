# Phase 1: 事件系统 - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

## Phase Boundary

本阶段交付 blockly 式低代码事件系统：引擎能通过数据/序列化接口定义事件（blockly 由外部编辑器生成序列化数据），并驱动踩踏触发、对话、开门等简单场景事件流程。事件系统定位为初学者抽象，仅覆盖简单场景，不为复杂场景追求通用表达。

## Implementation Decisions

### 触发绑定

- **D-01:** 事件绑定粒度：对象 + 地图格混合，两者都可绑定事件
- **D-02:** 触发方式使用 `EventTrigger` 枚举（11 种内置 + 可自行扩展），定义于 `packages-user/data-common/src/event/types.ts`
- **D-03:** 绑定对象分两类：点事件（不随脚下图块移动）与图块事件（随图块移动）
- **D-04:** 对象上存储的是 eventStore 的 id，而非事件本身
- **D-05:** 图块默认事件（怪物→战斗、道具→捡拾、可自定义）也走 eventStore（id 引用），可被自定义事件覆盖
- **D-06:** 执行顺序：先点事件、后图块事件，各自按优先级从高到低执行

### 执行流

- **D-07:** 事件内容 = Anon Tokyo 的 `Statement[]`，`interpreter.compile()` 编译为 `AnonTokyoExecutable`
- **D-08:** 执行 = `execute(param, env)`，`param` 为本次执行参数、`env` 为本次执行的环境对象
- **D-09:** 长事件（如对话）直接用 `await` 等待，不需要序列化执行状态；现阶段不聚焦解释执行的细节
- **D-10:** before 类触发器（OnBeforeBattle/OnBeforeOpenDoor/OnBeforeChangeFloor）的返回值处理：抽象一个专门对象负责事件执行（含 before 返回值的语义）
- **D-11:** 事件存储 `GameEventStore`（id → event），不进存档；代码生成的事件生成后立即执行、不落存档
- **D-12:** 点/图块事件的存档采用 dirty 标记：初始化时 dirty=false，后续变动且与原始数据不同则标记为 true
- **D-13:** 旧的 `ITrigger` 体系在本次阶段一并删除

### the agent's Discretion

接口设计由用户主导（PROJECT.md 协作模型）；AI 仅在已设计接口上实现、不自行设计接口。

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 事件系统

- `packages-user/data-common/src/event/types.ts` — `EventTrigger` 枚举 + `IGameEvent` / `IReadonlyGameEvent` 接口定义
- `packages-user/data-common/src/store/eventStore.ts` — `GameEventStore`（id → event）
- `node_modules/anon-tokyo/dist/index.d.ts` — Anon Tokyo 解释器类型（`Statement` / `AnonTokyoInterpreter` / `AnonTokyoExecutable`）

### 待删除的旧体系

- `packages-user/data-system/src/trigger/` — 旧 `ITrigger` 体系（registry/collector/collection/base）
- `packages-user/data-state/src/content/triggers.ts` — `ChangeFloorTrigger`
- `packages-user/data-state/src/hero/moverImpl.ts` — 使用 `ITriggerCollector` 的部分
- `packages-user/data-state/src/core.ts` — `triggerRegistry` / `triggerCollector` 引用

### 规划文档

- `.planning/ROADMAP.md` — Phase 1 目标与成功标准
- `.planning/REQUIREMENTS.md` — EVT-01 / EVT-02 / EVT-03
- `.planning/PROJECT.md` — 协作模型与约束

## Existing Code Insights

### Reusable Assets

- `GameEventStore`（`eventStore.ts`）：id → `IReadonlyGameEvent` 的 Map，已实现 `addEvent` / `getEvent`
- `EventTrigger` 枚举 + `IGameEvent` / `IReadonlyGameEvent` 接口（`types.ts`）：已定义 `compile` / `execute` / `setTrigger` / `setRaw`
- Anon Tokyo 解释器（`anon-tokyo@0.0.0-alpha.0`，node_modules 中，尚未在源码引用）

### Established Patterns

- 事件执行：`interpreter.compile(Statement[])` → `AnonTokyoExecutable`，`execute(param, env)` 异步返回
- 数据端分层：事件类型在 L0（data-common），存储用 store（Map）

### Integration Points

- 旧 trigger 体系在 data-system（`TriggerRegistry` / `TriggerCollector`）与 data-state（`core.ts` 的 registry/collector、`moverImpl.ts`、`content/triggers.ts`）——本次删除
- 新事件系统通过 `eventStore` 暴露给上层（数据层 / 渲染层），事件经 `execute` 驱动游戏状态

## Specific Ideas

无特定外部引用——接口与格式由用户主导，已在 decisions 中锁定。

## Deferred Ideas

None — 讨论保持在阶段范围内，未提出跨阶段新增能力。

---

*Phase: 1-事件系统*
*Context gathered: 2026-09-07*
