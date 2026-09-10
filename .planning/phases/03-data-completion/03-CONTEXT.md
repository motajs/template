# Phase 3: 数据端完成 - Context

**Gathered:** 2026-09-10
**Status:** Ready for planning

<domain>
## Phase Boundary

完成 `data-common`、`data-base`、`data-system`、`data-state` 四层数据端的系统整合，使数据端可以在 Node 环境独立创建、执行必要的数据操作并自行播放固定录像。阶段交付包括数据端闭环所需的单元测试、录像修饰与命令注册、顶层模块装配、事件内建函数最小清单、专用 Node 验证入口，以及四层数据包的类型错误和循环引用清零。

渲染端适配、完整 legacy 迁移和阶段 6 的全部核心单测不属于本阶段。接口语义和系统边界由用户主导；AI 负责实现和测试，不得自行发明未确认的公共接口行为。

</domain>

<decisions>
## Implementation Decisions

### 单元测试边界
- **D-01:** 阶段 3 覆盖每个数据端系统的闭环必需路径、录像播放依赖和当前尚未覆盖的关键模块；阶段 6 再补充完整边界与回归覆盖。
- **D-02:** 如果单测暴露接口行为未定义或接口与实现不一致，必须暂停并向用户提问，不能由 AI 擅自扩展或猜测公共接口。
- **D-03:** 新测试优先使用 fake/state fixture 和显式依赖注入；只有验证 legacy bridge 时才保留必要的全局 stub。
- **D-04:** 数据端已有和新增测试全部通过，使用固定的非 watch 测试命令；不把无关渲染端测试作为阶段 3 门禁。

### 录像修饰器与回放
- **D-05:** 录像修饰器只覆盖外部可调用、会改变可存档游戏状态且可能由录像重放触发的状态入口；纯查询、纯计算和内部辅助函数不重复修饰。
- **D-06:** 被修饰的异步动作必须等待完整 Promise 动作结束后再完成其录像语义，适用于移动、事件链和战斗等长动作。
- **D-07:** Node 回放遇到命令无法执行、结果不一致或状态校验失败时立即停止，并报告首个分歧的命令索引、命令码、参数和失败原因。
- **D-08:** 录像命令码由顶层统一注册并保持稳定；各子系统提供命令实现或默认注册项，避免模块间编号冲突。

### 顶层整合与注册
- **D-09:** 以显式工厂入口创建数据端实例为主，供 Node 和渲染端分别创建；当前 singleton 仅在确有兼容需求时保留，不作为 Node 唯一入口。
- **D-10:** 顶层负责初始化顺序和最终装配，各系统模块负责提供自己的默认注册函数或注册项，避免把实现细节复制到 `CoreState`。
- **D-11:** 事件系统只注册 Node 回放和当前闭环实际需要、且接口已明确的最小内建函数清单；不擅自补齐尚未确定的完整 legacy 事件函数清单。
- **D-12:** Node 数据端默认不依赖 DOM 或渲染全局。legacy 数据转换通过可注入依赖处理，渲染通知只能经 `r()`/`rf()` 或 hook，缺少渲染宿主时必须安全跳过。

### Node 验收与质量门禁
- **D-13:** 使用固定、可重复的端到端录像 fixture，覆盖顶层初始化、至少一个玩家动作、事件或状态变化以及正常播放结束。
- **D-14:** 验收不仅要求每条命令成功和录像正常结束，还要将关键数据端状态与预期快照精确比较，保证播放结果可重复。
- **D-15:** 提供专用 Node 验证命令，直接创建顶层实例、加载录像并在失败时返回非零状态；它与数据端单测门禁分开执行。
- **D-16:** `data-common`、`data-base`、`data-system`、`data-state` 四层的 TypeScript 错误全部清零，并针对这四层检查循环引用。渲染端或 legacy-only 的无关问题不扩大为本阶段范围。
- **D-17:** 本阶段系统级任务较多，遇到任何接口语义、系统边界、依赖关系或实现路径上的不确定问题，都必须暂停并提问确认，不得擅自选择“看起来合理”的方案绕过问题。
- **D-18:** 顶层工厂采用 `createCoreState(options?)` 作为主入口；Node 使用内存存档适配器，从固定初始状态 reset，并比较关键状态快照。
- **D-19:** legacy converter 和数据源通过集中依赖对象注入，`CoreState` 不直接读取 legacy 全局。
- **D-20:** 循环依赖门禁覆盖四个数据包内部及其相互边界，允许依赖无环的 `@motajs/common` 基础包。
- **D-21:** 新增专用 `pnpm test:data-node` 命令，使用 `script/test-data-node.ts` 或等价 Node runner，固定 fixture 放在 `packages-user/data-state/test/fixtures/`。
- **D-22:** Tile 以工作区当前用户接口为准：`ITileRawData.events` 保存默认事件映射，`ITileStore.getEvent(num)` 返回事件映射；旧的 `trigger` 标量实现必须迁移到此契约。
- **D-23:** 当前阶段暂不设计 `options`；`createCoreState()` 直接执行 `new CoreState()`，主要初始化逻辑先保留在 constructor，后续再按实际需要拆分注入项。
- **D-24:** 阶段 3 的事件内建函数先覆盖三组常用控制：地图设置图块/转动态后移动再转静态（可选 safe 判定）/删除图块；玩家按移动序列移动/向前一步/触发面前 `onTouch`；事件临时插入指定序列或指定 id。具体签名以 `packages-user/data-state/src/event/types.ts` 和其中示例为准，新增语义不得自行发明。
- **D-25:** 阶段 3 的 replay 指令按稳定顺序注册：上、右、下、左移动；自动寻路至指定点；使用道具；穿上装备；卸下装备。当前只测试这些指令，后续可调整。
- **D-26:** 最终 Node 回放只在播放完毕时比较勇士全部属性和所有地图矩阵；单测可在每步后检查勇士属性作为较快的定位手段，不要求最终验证逐步比较地图矩阵。

### the agent's Discretion
没有授权 AI 在接口语义或系统边界上自行决策的事项。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and phase requirements
- `.planning/PROJECT.md` — project architecture, data/render separation, AI implementation boundary, and quality constraints
- `.planning/REQUIREMENTS.md` — DATA-01 requirement and explicit Phase 3 / Phase 6 boundaries
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, dependency order, and out-of-scope neighboring phases
- `.planning/STATE.md` — prior phase decisions, existing quality-gate concerns, and current repository state
- `dev.md` — four-layer data architecture, Node replay requirement, dependency direction, and coding rules

### Existing data-side contracts and implementation anchors
- `packages-user/data-common/src/types.ts` — `IDataCommon` public Layer 0 contract
- `packages-user/data-base/src/types.ts` — `IStateBase` Layer 1 contract
- `packages-user/data-system/src/types.ts` — `IStateSystem` Layer 2 contract
- `packages-user/data-state/src/types.ts` — `ICoreState` Layer 3 contract
- `packages-user/data-common/src/replay/types.ts` — replay command, sandbox, route, and state reset contracts
- `packages-user/data-common/src/replay/system.ts` — replay command registration and route recording implementation
- `packages-user/data-common/src/replay/sandbox.ts` — sequential replay execution and failure behavior
- `packages-user/data-common/src/replay/func.ts` — existing replay safety decorators
- `packages-user/data-common/src/store/types.ts` — current user-authored Tile raw-data and event accessor contract
- `packages-user/data-system/src/event/system.ts` — event interpreter and built-in function registration point
- `packages-user/data-system/src/event/executor.ts` — event invocation and reduction behavior
- `packages-user/data-state/src/core.ts` — current top-level four-layer construction and legacy initialization path
- `packages-user/data-state/src/ins.ts` — current singleton entry point and its transition note
- `packages-user/data-state/src/event/types.ts` — user-provided event parameter example and the initial event-control grouping
- `packages-user/data-state/src/event/map.ts` — existing map-control event example to enrich without inventing a new event model

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ReplaySystem`, `ReplaySandbox`, `ReplayArray`, and `IReplaySystem` — existing recording, command registration, sequential playback, and route storage primitives
- `shouldReplay` and `ignoreReplay` in `packages-user/data-common/src/replay/func.ts` — existing replay-safety decorator mechanism to audit before extending
- `CoreState` — current L0-L3 construction, saveable registration, combat/event wiring, and legacy data loading integration point
- `GameEventSystem` and `EventExecutor` — existing event interpreter and invocation dispatch path; `GameEventSystem` currently initializes with an empty built-in function list
- Existing Vitest tests in `data-common`, `data-base`, `data-system`, and `data-state` — patterns for data-side fixtures and current global stubs

### Established Patterns
- Dependency direction is `src -> packages-user -> packages`; data layers are `data-common -> data-base -> data-system -> data-state`.
- Public contracts are expressed through `types.ts` and barrel exports; user-owned interface decisions must not be inferred by implementation agents.
- Data-side code must remain DOM-free. Rendering communication is gated through `r()`/`rf()` or hooks.
- `pnpm test:ci` is the existing deterministic non-watch test command; Phase 3 needs a dedicated Node replay command in addition to the data-side test gate.
- The current top-level path still exports `state = new CoreState()` and uses legacy globals for initial data loading, so factory creation and injectable legacy conversion require careful compatibility handling.
- The workspace now contains a user adjustment to `ITileRawData.events` and `ITileStore.getEvent()`; implementation must follow that contract rather than restore the previous `trigger` shape.
- `packages-user/data-state/src/event/hero.ts` and `event.ts` are currently empty, while `event/types.ts` contains the initial parameter example; these are the planned extension points for the three event-control groups.

### Integration Points
- `packages-user/data-state/src/core.ts` is the top-level orchestration point for system construction, default registration, saveable content, replay commands, and event built-ins.
- `packages-user/data-state/src/ins.ts` is the compatibility boundary for the existing singleton entry point.
- `packages-user/data-system/src/event/system.ts` is the event built-in registration boundary.
- `packages-user/data-common/src/replay/system.ts` is the replay command registry and recording boundary.
- The four package indexes and their `types.ts` files are the public export and contract boundaries that the Node entry must consume without introducing cycles.

</code_context>

<specifics>
## Specific Ideas

- The user defined the phase as a system-level integration effort: data-side systems must be unit-tested, necessary methods must participate in replay debugging, top-level registration must be completed, and the final validation must make Node play a recording independently.
- The final validation is also intended to cover the Phase 1 verification target, so the fixed replay fixture must exercise the event path rather than only testing isolated data structures.
- Any uncertainty must be surfaced to the user before implementation; no silent assumptions are allowed for this phase.

</specifics>

<deferred>
## Deferred Ideas

- Complete unit-test coverage beyond the data-side replay closure belongs to Phase 6.
- Full legacy system removal and migration belongs to Phase 5.
- Full mobile/desktop rendering integration belongs to Phase 4.
- A complete legacy event built-in catalog remains deferred until its interfaces and scope are explicitly decided; Phase 3 registers only the minimum closed-loop set.
- Exact factory option fields, replay fixture actions, event built-in names/signatures, and snapshot field list remain user-owned details that must be confirmed before implementation if the planner cannot derive them without guessing.
- The current `event/map.ts` example references `env.heroFloor`, which is not present in the current `IBlockEventEnv` contract; this specific mismatch requires user confirmation before implementation.

</deferred>

---

*Phase: 3-数据端完成*
*Context gathered: 2026-09-10*
