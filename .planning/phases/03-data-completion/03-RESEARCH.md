# Phase 3: 数据端完成 - Research

**Researched:** 2026-09-10  
**Domain:** TypeScript data-layer integration, deterministic replay, and Node-only validation  
**Confidence:** MEDIUM — the implementation map and current failures are verified; the latest user decisions resolve the previously open public-contract questions, while implementation details remain subject to the locked checkpoints below

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Latest Locked Clarifications

- **D-18:** Node uses an in-memory save adapter, resets from fixed initial state, and compares the approved key snapshots; this policy is constrained by the later no-options factory clarification.
- **D-19:** Legacy converter and data source access use a centralized internal injected dependency boundary; `CoreState` does not read legacy globals directly.
- **D-20:** The circular gate covers the four data packages internally and at their mutual boundaries, while unrelated render/legacy-only code remains outside the scope.
- **D-21:** Add `pnpm test:data-node`, using `script/test-data-node.ts` or an equivalent Node runner, with fixtures under `packages-user/data-state/test/fixtures/`.
- **D-22:** `ITileRawData.events` and `ITileStore.getEvent(num)` are authoritative; the scalar `trigger` implementation migrates to this contract.
- **D-23:** `createCoreState()` has no options, directly calls `new CoreState()`, and keeps main initialization in the constructor for now.
- **D-24:** Event built-ins cover map set/dynamic-move-static with optional safe/delete, hero sequence/forward/front `onTouch`, and temporary event sequence/id insertion.
- **D-25:** Replay commands are registered in stable order: up, right, down, left, auto-pathfind to point, use item, equip, unequip.
- **D-26:** Final Node replay compares only end-of-playback full hero attributes and every map matrix; per-step hero checks are unit-test diagnostics only.
- **D-27:** Built-ins use `(param, env)` with `IBlockEventEnv`; approved names are the eight event functions in CONTEXT.md, and failure safely skips with `void`.
- **D-28:** `CoreState` is Node-safe without a browser/legacy host: skip legacy loading and IndexedDB, use memory-capable state, and keep the public factory parameterless.

### the agent's Discretion

没有授权 AI 在接口语义或系统边界上自行决策的事项。

### Deferred Ideas (OUT OF SCOPE)

- 完整单元测试覆盖超出数据端回放闭环的部分属于 Phase 6。
- 完整 legacy 系统删除和迁移属于 Phase 5。
- 完整移动端/桌面端渲染集成属于 Phase 4。
- 完整 legacy 事件内建函数目录延期，直到接口和范围被明确决定；Phase 3 只注册最小闭环集合。
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | 数据端（L0–L3）接口实现完成——用户设计的接口全部落地，数据层各系统（地图/角色/敌人/flag/战斗/触发器/存档/回放）可用，并可在 Node 环境独立运行回放验证 | Existing L0–L3 contracts, `CoreState` wiring, replay primitives, current data tests, and the Node/type/circular baselines below provide the implementation map. [VERIFIED: .planning/REQUIREMENTS.md:21-24] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Read `dev.md` before doing project work; the directive is “在开始前，务必认真阅读 [dev.md](./dev.md) 来了解项目基本要求。” [VERIFIED: AGENTS.md:1-2]
- Preserve the one-way dependency direction `src → packages-user → packages`. [VERIFIED: dev.md:3-10]
- Do not add module top-level execution or exported mutable initialization; initialization belongs behind factory functions and top-level assembly. [VERIFIED: dev.md:46-53]
- Keep data-side code Node-runnable and keep render notifications behind `Mota.r()`/hooks. [VERIFIED: dev.md:121-128]
- Do not alter user-owned interfaces to make an ambiguous test pass; this is also an explicit Phase 3 decision. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:18-22,40-44]

## Summary

The four data packages already expose a layered contract: `IDataCommon` owns stores, facing, direction mapping, and save; `IStateBase` adds maps, hero, enemies, flags, and saveable-content registration; `IStateSystem` adds enemy context and events; and `ICoreState` adds loading and save-executor wiring. [VERIFIED: packages-user/data-common/src/types.ts:46-63; packages-user/data-base/src/types.ts:17-41; packages-user/data-system/src/types.ts:6-11; packages-user/data-state/src/types.ts:15-31] The reusable replay primitives already provide binary route storage, command registration, reset-before-playback, sequential async execution, and hooks. [VERIFIED: packages-user/data-common/src/replay/types.ts:14-20,305-353; packages-user/data-common/src/replay/system.ts:50-80; packages-user/data-common/src/replay/sandbox.ts:118-145]

The main Phase 3 risk is not missing isolated systems; it is the missing Node-safe composition boundary. `CoreState` currently constructs every layer directly, installs legacy converters, waits on global loading events, reads legacy globals, and wires a singleton through `ins.ts`. [VERIFIED: packages-user/data-state/src/core.ts:81-115,139-240; packages-user/data-state/src/ins.ts:1-10] A direct Node import currently fails before construction because the common logger evaluates `main` and DOM globals at module load. [VERIFIED: direct `pnpm exec tsx` import probe on 2026-09-10; packages/common/src/logger.ts:24-40] The latest decisions now lock the implementation boundary: `createCoreState()` is no-argument and directly calls `new CoreState()`, the constructor is Node-safe, legacy conversion is reached through an internal injected dependency boundary rather than direct globals, Node uses memory-capable state, replay codes are top-level stable enum values, event built-ins use the eight approved names, and first divergence throws a verifier-local error with index/code/params/reason. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:43-52; latest user clarification]

**Primary recommendation:** keep public `types.ts` files unchanged unless the locked current contract requires an implementation correction; build a factory-first, internally dependency-injected Node composition around existing replay/save/event primitives, with a fixed event-bearing fixture and separate four-package gates. Resolve any newly exposed interface mismatch through D-02/D-17 rather than guessing. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:18-22,40-52]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Explicit data-instance creation and initialization order | Frontend Server (SSR) / API-like runtime entry | Database / Storage | The new Node and render entry points need separate instances, while `CoreState` currently owns final assembly. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:30-35; packages-user/data-state/src/core.ts:81-115] |
| Stores, maps, hero, enemies, flags, and saveable state | Database / Storage | API / Backend | These are Layer 0/1 state objects and implement save/load contracts. [VERIFIED: dev.md:139-147; packages-user/data-base/src/types.ts:17-41] |
| Replay command registry, recording, reset, and sequential playback | API / Backend | Database / Storage | Replay commands invoke state-changing systems, while route bytes and reset data are state fixtures. [VERIFIED: packages-user/data-common/src/replay/types.ts:105-110,316-353; packages-user/data-common/src/replay/system.ts:50-80] |
| Event interpretation and minimal built-ins | API / Backend | Database / Storage | `GameEventSystem` owns the interpreter/executor and dispatches through the state event store. [VERIFIED: packages-user/data-system/src/event/system.ts:7-22; packages-user/data-system/src/event/executor.ts:53-86] |
| Node replay verifier and exact snapshot comparison | Frontend Server (SSR) / runtime entry | API / Backend | D-15 makes this a dedicated Node process boundary; it should create the core, load the fixture, and return a non-zero exit code on failure. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:36-41] |

## Standard Stack

This phase should reuse the existing repository stack; no new package installation is recommended. [ASSUMED]

### Core

| Library / tool | Version | Purpose | Why standard |
|----------------|---------|---------|--------------|
| TypeScript | `6.0.3` | Type checking and implementation | It is the repository's pinned compiler. [VERIFIED: package.json:87-93; `pnpm exec vue-tsc --version` on 2026-09-10] |
| Vitest | `^4.0.18` / installed `4.0.18` | Data-side unit and integration tests | It is the existing test script and configured runner. [VERIFIED: package.json:6-10,97-98; vite.config.ts:1,46-49; `pnpm exec vitest --version` on 2026-09-10] |
| `anon-tokyo` | `0.0.0-alpha.0` | Existing event interpreter used by `GameEventSystem` | The current event implementation constructs `AnonTokyoInterpreter`; do not replace it during this phase. [VERIFIED: package.json:26-35; packages-user/data-system/src/event/system.ts:1-18] |
| Dexie | `^4.4.2` | Existing browser save database implementation | Keep it behind the save boundary; Node replay must not silently require IndexedDB. [VERIFIED: package.json:26-35; packages-user/data-common/src/save/system.ts:42-67] |
| madge | `^8.0.0` / installed `8.0.0` | Circular-dependency gate | It is the current repository command's checker. [VERIFIED: package.json:81-84; `pnpm exec madge --version` on 2026-09-10] |

### Supporting

| Tool | Version | Purpose | When to use |
|------|---------|---------|-------------|
| Node.js | `v22.18.0` | Dedicated replay process | The project requires `^20.0.0 || >=22.0.0`; the current environment meets it. [VERIFIED: dev.md:12-16; Node probe on 2026-09-10] |
| pnpm | `10.15.0` | Workspace scripts and package execution | The project requires pnpm 10 or newer. [VERIFIED: dev.md:12-16; pnpm probe on 2026-09-10] |
| `tsx` | `^4.21.0` / installed `4.21.0` | TypeScript Node validation entry | Use only for the dedicated Node command, not as a substitute for type or circular gates. [VERIFIED: package.json:87-93; `pnpm exec tsx --version` on 2026-09-10] |

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| Existing `ReplayArray` / `ReplaySandbox` | A new JSON or ad-hoc replay runner | Do not hand-roll serialization or playback; the existing interfaces already define route, reset, command, and hook behavior. [VERIFIED: packages-user/data-common/src/replay/types.ts:105-110,189-243,305-353] |
| Explicit factory and injected dependencies | Making the singleton the Node entry | This contradicts D-09 and leaves global legacy initialization on the Node path. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:30-35; packages-user/data-state/src/ins.ts:1-10] |

**Installation:** none proposed; reuse the workspace dependencies above. [ASSUMED]

## Package Legitimacy Audit

No package installation is part of this research recommendation, so the package-legitimacy gate is not applicable. [ASSUMED]

## Architecture Patterns

### System Architecture Diagram

```text
fixed replay fixture
        |
        v
dedicated Node verifier ---> explicit data factory ---> L0 stores/save/replay
        |                              |                         |
        |                              v                         v
        |                       L1 map/hero/enemy/flags ---> L2 event/combat/path
        |                                                        |
        +<--------------- command execution + awaited actions --+
        |
        v
exact state snapshots + non-zero failure exit
```

The diagram follows the locked responsibility split: the runtime entry creates the graph, L0/L1 own persistent state, L2 owns actions, and the verifier owns fixture orchestration and process exit. [VERIFIED: dev.md:141-154; .planning/phases/03-data-completion/03-CONTEXT.md:30-41]

### Recommended Project Structure

The phase filenames used by the plan set are now fixed by the user decisions and existing workspace layout. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:43-52]

```text
packages-user/data-state/src/       # factory and final L0–L3 assembly
packages-user/data-system/src/      # event/combat/path registrations
packages-user/data-common/src/      # replay/save primitives and contracts
script/test-data-node.ts             # dedicated Node verifier entry
packages-user/*/src/**/*.test.ts     # closure tests near the owning package
```

### Pattern 1: Factory-first composition with compatibility singleton

**What:** Add the no-argument `createCoreState()` path that directly calls `new CoreState()`, while retaining `state` only as a compatibility entry where the existing browser host needs it. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:30-35,47-52; packages-user/data-state/src/ins.ts:1-10]

**When to use:** Use the factory for Node replay and render-side creation; do not make the singleton the only construction route. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:30-35]

**Implementation guidance:** Keep the main initialization order in the `CoreState` constructor for this phase, use an internal injected legacy dependency boundary so `CoreState` never reads legacy globals directly, and let subsystems expose registration helpers instead of copying their internals into `CoreState`. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:30-35,43-52; dev.md:46-53]

### Pattern 2: Fake/state fixtures with explicit dependencies

**What:** Construct the smallest state graph required by the behavior under test and inject it into the system under test. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:18-22]

**Existing example:** `eventDispatch.test.ts` creates tile/map/store fixtures, constructs `EventExecutor` with a store reference, and passes a state fixture to the mover. [VERIFIED: packages-user/data-system/src/event/eventDispatch.test.ts:107-181]

**When to use:** Use this for replay commands, event closure tests, and state snapshots; retain global stubs only around legacy bridge imports. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:18-22]

### Pattern 3: Replay as an awaited command pipeline

**What:** Register stable numeric commands once at the top level; each command executes a state action and returns only after the action's complete Promise settles. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:24-29; packages-user/data-common/src/replay/types.ts:14-20]

**Existing behavior:** `ReplaySandbox.step()` reads one route step, looks up its command, awaits `command.execute(next)`, then awaits `onStep` hooks. [VERIFIED: packages-user/data-common/src/replay/sandbox.ts:118-145]

**Locked failure policy:** retain the existing replay boolean command interface; the Node verifier stops at the first false/unknown/throw/mismatch by throwing an implementation-local error and reporting index, top-level stable command code, params, and reason. Do not add a new user-facing error class or alter the replay command interface. [VERIFIED: packages-user/data-common/src/replay/types.ts:14-20; .planning/phases/03-data-completion/03-CONTEXT.md:24-29,49-52; latest user clarification]

### Anti-Patterns to Avoid

- **Singleton-only Node setup:** it exports `state = new CoreState()` and makes fresh-instance replay impossible. [VERIFIED: packages-user/data-state/src/ins.ts:1-10]
- **Importing the browser entry in Node:** `createMota()` writes `window.Mota`, and the render wrapper reads `main`; keep these out of the Node entry. [VERIFIED: packages-user/entry-data/src/mota.ts:108-154]
- **Top-level legacy loading in a factory:** current `CoreState` registers `loading` callbacks that read `core`, `enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80`, and legacy floor data. [VERIFIED: packages-user/data-state/src/core.ts:220-234]
- **Expanding the built-in catalog “for completeness”:** current `GameEventSystem` starts with empty built-in/global lists and the context explicitly limits Phase 3 to the minimum closed-loop set. [VERIFIED: packages-user/data-system/src/event/system.ts:11-18; .planning/phases/03-data-completion/03-CONTEXT.md:30-35,111-119]

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Replay binary encoding | A second JSON/binary route format | `ReplayArray` and `IReplayArray` | The existing route owns command width, parameter encoding, streams, and save/load buffers. [VERIFIED: packages-user/data-common/src/replay/types.ts:113-118,140-187,189-283] |
| Sequential replay control | A second loop or timer-based runner | `ReplaySandbox` | It already stops on unknown command or `false`, awaits commands, and exposes step hooks. [VERIFIED: packages-user/data-common/src/replay/sandbox.ts:61-85,118-145] |
| Event dispatch ordering | A fixture-only event dispatcher | `GameEventSystem` / `EventExecutor` and the existing mover path | The mover already collects point/static/dynamic sources, sorts them, and awaits the executor. [VERIFIED: packages-user/data-state/src/hero/moverImpl.ts:65-135]
| Save-state serialization | A custom snapshot serializer | Existing `ISaveableContent.saveState/loadState` and registered saveables | The save contract explicitly defines state extraction/loading and `CoreState` registers hero, flags, maps, and enemies. [VERIFIED: packages-user/data-common/src/save/types.ts:12-24; packages-user/data-state/src/core.ts:213-224] |
| Global stubbing as architecture | A large `main`/`window` mock in the Node verifier | Injected legacy/render dependencies and a Node-safe data entry | Existing tests need global stubs because imports are not yet Node-safe; D-03 and D-12 require reducing that dependency. [VERIFIED: packages-user/data-system/src/event/eventDispatch.test.ts:19-33; .planning/phases/03-data-completion/03-CONTEXT.md:18-22,30-35] |

**Key insight:** the phase should connect existing primitives rather than create parallel event, replay, or save abstractions; the work is contract-safe composition plus removal/isolation of global evaluation. [ASSUMED]

## Current Baseline and Integration Risks

### Four package contracts and dependency direction

The package manifests encode the intended order: `data-common` depends on `@motajs/common`; `data-base` depends on data-common/common/types/loader; `data-system` depends on common/data-base; and `data-state` depends on common/data-common/data-base/data-system. [VERIFIED: packages-user/data-common/package.json:1-5; packages-user/data-base/package.json:1-8; packages-user/data-system/package.json:1-6; packages-user/data-state/package.json:1-9]

The four public barrels expose common, base, system, and state modules without a separate replay or factory barrel. [VERIFIED: packages-user/data-common/src/index.ts:1-7; packages-user/data-base/src/index.ts:1-8; packages-user/data-system/src/index.ts:1-5; packages-user/data-state/src/index.ts:1-7]

### Type-contract mismatch that must not be guessed

The opened interface source says `ITileRawData` contains `events: Record<number, string>` and `ITileStore.getTrigger(num)` returns `number[]`. [VERIFIED: packages-user/data-common/src/store/types.ts:47-62,74-86]

The implementation source instead returns a scalar `trigger` and reads `data.trigger`; `TileLegacyBridge` also returns `trigger: -1`. [VERIFIED: packages-user/data-common/src/store/tileStore.ts:23-29; packages-user/data-state/src/legacy/tile.ts:96-105]

The current `pnpm check:type` run reports this exact mismatch plus unrelated client/legacy errors. The latest user decision makes the current `ITileRawData.events`/`getEvent()` contract authoritative, so implementation and legacy conversion must migrate to it without editing the user-owned interface or restoring the scalar trigger shape. [VERIFIED: `pnpm check:type` run on 2026-09-10; packages-user/data-common/src/store/types.ts:47-86; packages-user/data-state/src/legacy/tile.ts:96-105; .planning/phases/03-data-completion/03-CONTEXT.md:45-47]

### CoreState and singleton wiring

`CoreState` constructs save, stores, maps, hero, enemy, combat, event, and movement systems in one constructor; the event system is currently created with `new GameEventSystem(this)`. [VERIFIED: packages-user/data-state/src/core.ts:115-240]

The constructor registers the saveable IDs `@system/hero`, `@system/flags`, `@system/maps`, and `@system/enemy`, then initializes the save database from a `core` global during `coreInit`. [VERIFIED: packages-user/data-state/src/core.ts:213-234]

`ICoreState` exposes no replay system, factory method, unified snapshot method, legacy dependency bundle, or Node-specific save backend. [VERIFIED: packages-user/data-state/src/types.ts:15-31; packages-user/data-common/src/types.ts:46-68; packages-user/data-base/src/types.ts:17-41]

### Replay implementation and test gap

`ReplaySystem` owns a command map, rejects duplicate registrations with warning code `163`, records into its route, resets state before creating a sandbox, and retains the active sandbox. [VERIFIED: packages-user/data-common/src/replay/system.ts:20-41,50-80]

`ReplaySandbox` stops on an unknown command or a command returning `false`, but its public API does not expose the failure reason; the current warning includes command code and serialized params but not the required first-divergence contract. [VERIFIED: packages-user/data-common/src/replay/sandbox.ts:118-145; .planning/phases/03-data-completion/03-CONTEXT.md:24-29]

No data-package test currently exercises a complete `ReplaySystem` → top-level state → player action → event/state mutation → exact snapshot → normal end path. The existing ten data-package test files are focused fixtures for map/event/path/core behavior, and the targeted run passed 58 tests. [VERIFIED: glob/read of packages-user/data-{common,base,system,state}/src; targeted `pnpm exec vitest run packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` run on 2026-09-10]

The replay safety decorators are separate from command recording: `shouldReplay` only collects nested method names, while `ReplaySystem.record` is a separate operation; `ignoreReplay` uses module-level mutable state. Audit their lifecycle before applying them to long async actions. [VERIFIED: packages-user/data-common/src/replay/func.ts:27-47,53-96,135-182; packages-user/data-common/src/replay/system.ts:62-67]

### Existing quality-gate results

- `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` passed 10 files and 58 tests. [VERIFIED: command run on 2026-09-10]
- `pnpm check:type` exited non-zero. It reports the `TileStore`/`ITileStore` mismatch and `CoreState`/legacy errors in the data side, plus unrelated render/client/legacy errors. [VERIFIED: command run on 2026-09-10]
- The repository script `pnpm check:circular` is `madge --circular src/main.ts`, and the current run reports 18 cycles. [VERIFIED: package.json:23-24; command run on 2026-09-10]
- A targeted four-entry madge run reports 15 cycles, including the `CoreState → enemy calculator → ins` cycle, the `CoreState → legacy move → data-state index` cycle, and data-common/common transitive cycles through replay/store/common exports. [VERIFIED: targeted `pnpm exec madge --circular ...data-{common,base,system,state}/src/index.ts` run on 2026-09-10; packages-user/data-state/src/enemy/index.ts:1-8; packages-user/data-state/src/legacy/move.ts:3-7]

## Likely Work Breakdown

The following is a planning decomposition, not authorization to change interfaces. [ASSUMED]

### Wave 0 — Locked contract records (blocking execution gates)

Record the already-resolved factory, legacy boundary, replay, diagnostic, event, save/snapshot, Tile, and circular-scope decisions in the phase contract files before implementing their consumers. These checkpoints verify completeness and prevent accidental contract drift; they are not open design questions. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:43-52]

### Wave 1 — Baseline and package gates

Capture the existing type, circular, and data-test outputs; repair only implementation-side errors inside the approved four-package boundary; add a four-package circular command that traverses the approved mutual boundary; and keep unrelated client/render diagnostics outside the Phase 3 gate. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:36-45; current command results above]

### Wave 2 — Node-safe factory and legacy boundary

Keep the no-argument factory and constructor initialization, inject legacy conversion dependencies through an internal boundary rather than direct globals, and ensure importing the Node data entry does not evaluate `window`, `document`, `main`, render hooks, or browser-only loading paths. Preserve the existing singleton only as a compatibility adapter. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:30-35,43-52; packages/common/src/logger.ts:24-40; packages-user/data-base/src/game.ts:24-37,72-93; packages-user/entry-data/src/mota.ts:116-154]

### Wave 3 — Replay registration and state-changing entrances

Instantiate/register the replay system at the approved top level, add only the command implementations needed by the fixture, and audit external state-changing actions for D-05/D-06 coverage. The command implementation must await movement, event chains, and combat promises before returning. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:24-35; packages-user/data-state/src/hero/moverImpl.ts:118-135; packages-user/data-system/src/event/executor.ts:53-86]

### Wave 4 — Minimal event built-ins and fixed closure fixture

Register only the user-approved built-ins, create a deterministic map/event fixture, play at least one player action through the existing event dispatch path, and compare the approved full hero attributes and every map matrix only at normal end. Per-step hero checks may remain focused-test diagnostics; do not infer a complete legacy event catalog. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:24-41,48-52; packages-user/data-system/src/event/system.ts:11-18; packages-user/data-state/src/hero/moverImpl.ts:79-135]

### Wave 5 — Dedicated Node command and final gates

Add the user-approved Node verifier as a separate non-watch command. It must create a fresh instance, load the fixed fixture, stop on the first failure, print the approved diagnostic, and return non-zero. Run it separately from the data Vitest command, then run the approved type and circular gates. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:36-41]

## Concrete Verification Commands

The data suite is the current repository command; the dedicated Node command and scoped gates are fixed by D-16/D-21. [VERIFIED: package.json:6-24; .planning/phases/03-data-completion/03-CONTEXT.md:36-52]

```bash
pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state
pnpm check:type
pnpm check:circular
pnpm exec madge --circular --extensions ts packages-user/data-common/src packages-user/data-base/src packages-user/data-system/src packages-user/data-state/src
pnpm test:data-node
```

- The first command is the current deterministic non-watch data-package test gate and passed 58 tests in this session. [VERIFIED: command run on 2026-09-10; package.json:8-10]
- `pnpm check:type` is necessary but currently includes unrelated packages; the phase gate must assert that no approved `data-common`, `data-base`, `data-system`, or `data-state` diagnostics remain rather than claiming the whole repository is clean. [VERIFIED: package.json:23-24; command output on 2026-09-10]
- `pnpm check:circular` currently starts at `src/main.ts`; the explicit four-package madge invocation is needed to make D-16 observable. Its scope is locked to cycles containing the four data-package nodes, while unrelated common-only dependencies remain outside the phase gate. [VERIFIED: package.json:23-24; targeted command output on 2026-09-10; .planning/phases/03-data-completion/03-CONTEXT.md:39-45]
- `pnpm test:data-node` is fixed by D-21; its fixture path and end-only snapshot/report contract are fixed by D-13 through D-15 and D-26/D-28. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:36-52]

## Code Examples

The existing replay contract explicitly supplies a route and state reseter to a sandbox. [VERIFIED: packages-user/data-common/src/replay/types.ts:305-314]

```typescript
const sandbox = replaySystem.createReplaySandbox({ route, reseter });
const success = await sandbox.step();
```

This example uses only the existing `IReplaySandboxConfig` fields and `IReplaySandbox.step()` contract; it does not define the missing factory or failure-reporting API. [VERIFIED: packages-user/data-common/src/replay/types.ts:79-102,305-314]

The existing mover path builds invocations and awaits the event executor. [VERIFIED: packages-user/data-state/src/hero/moverImpl.ts:118-135; packages-user/data-system/src/event/types.ts:69-76]

```typescript
await executor.execute(invocations, param);
```

Use this existing awaited boundary when a replay command represents a movement/event action; do not record completion before it settles. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:24-29; packages-user/data-state/src/hero/moverImpl.ts:118-135]

## Common Pitfalls

### Pitfall 1: Fixing a user-owned interface by making the implementation compile

**What goes wrong:** The implementation and `types.ts` disagree on tile events/triggers, so a superficial type edit could change the public data model. [VERIFIED: packages-user/data-common/src/store/types.ts:47-86; packages-user/data-common/src/store/tileStore.ts:23-29; packages-user/data-state/src/legacy/tile.ts:96-105]

**How to avoid:** Use the locked `events`/`getEvent()` model and migrate implementation-side consumers; if another interface mismatch appears, stop under D-02/D-17 instead of changing the user-owned contract. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:18-22,45-52]

### Pitfall 2: Making Node tests pass with a permanent browser-global stub

**What goes wrong:** The direct data-state import currently reaches `@motajs/common/logger`, whose module-level code reads `main` and creates a DOM element when not replaying. [VERIFIED: direct import probe on 2026-09-10; packages/common/src/logger.ts:24-40]

**How to avoid:** Keep the Node entry free of render/browser modules and isolate or inject the legacy/render boundary; use global stubs only in focused legacy-bridge tests. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:18-22,30-35]

### Pitfall 3: Treating boolean replay success as sufficient diagnostics

**What goes wrong:** `IReplayCommand.execute` returns only `Promise<boolean>`, and `ReplaySandbox` logs code/params on failure but has no public reason/index result beyond the step object. [VERIFIED: packages-user/data-common/src/replay/types.ts:14-20; packages-user/data-common/src/replay/sandbox.ts:124-141]

**How to avoid:** Ask for the approved first-divergence reporting mechanism before adding a verifier API or changing public types. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:24-29,40-44]

### Pitfall 4: Recording a long action before it completes

**What goes wrong:** Movement and event chains are asynchronous; recording at method entry would permit a replay to advance before state mutation finishes. [VERIFIED: packages-user/data-state/src/hero/moverImpl.ts:65-75,118-135; packages-user/data-system/src/event/executor.ts:53-86]

**How to avoid:** Have the replay command await the complete action Promise, matching D-06. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:24-29]

### Pitfall 5: Circular repair scope expands into the render/legacy migration

**What goes wrong:** Current madge output contains data-common/common cycles and data-state self-cycles, while the phase explicitly excludes full legacy removal and rendering integration. [VERIFIED: targeted madge output on 2026-09-10; .planning/phases/03-data-completion/03-CONTEXT.md:6-11,111-119]

**How to avoid:** Confirm whether the D-16 gate means the four package subgraph only or its transitive `@motajs/common` graph, then limit repairs to the approved boundary. [ASSUMED]

## Runtime State Inventory

This is an integration/refactor phase, so the runtime inventory is required. [VERIFIED: phase boundary includes top-level integration, factory creation, and replay wiring. .planning/phases/03-data-completion/03-CONTEXT.md:6-11]

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Existing saveable content is registered under `@system/hero`, `@system/flags`, `@system/maps`, and `@system/enemy`; `SaveSystem` persists a `Map<string, unknown>`. [VERIFIED: packages-user/data-state/src/core.ts:213-224; packages-user/data-common/src/save/system.ts:132-174] | Use the locked in-memory Node path and fixture reset; do not initialize Dexie/IndexedDB in Node. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:36-52] |
| Live service config | None found in the inspected repository sources; the current phase inputs mention no external service configuration. [ASSUMED] | None unless the user identifies a runtime service. |
| OS-registered state | None found in the inspected repository sources; no task/service registration is part of the current scripts or phase context. [ASSUMED] | None. |
| Secrets/env vars | None found in the inspected Phase 3 data sources; current construction instead reads legacy globals such as `core`. [VERIFIED: packages-user/data-state/src/core.ts:220-234] | Replace global reads with the approved injected dependency boundary; do not introduce environment-variable names without a decision. [ASSUMED] |
| Build artifacts / installed packages | Workspace dependencies are installed and the existing commands resolve `vue-tsc`, Vitest, madge, and tsx in this environment. [VERIFIED: tool probes on 2026-09-10] | No package reinstall required; keep the phase gate focused on source packages. [ASSUMED] |

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Node replay verifier | ✓ | `v22.18.0` | — [VERIFIED: Node probe on 2026-09-10; dev.md:12-16] |
| pnpm | Workspace gates | ✓ | `10.15.0` | — [VERIFIED: pnpm probe on 2026-09-10; dev.md:12-16] |
| Vitest | Data tests | ✓ | `4.0.18` | — [VERIFIED: tool probe on 2026-09-10] |
| vue-tsc | Type gate | ✓ | package range `^2.2.12` (reports TypeScript `6.0.3`) | — [VERIFIED: package.json:97-99; `pnpm exec vue-tsc --version` on 2026-09-10] |
| madge | Circular gate | ✓ | `8.0.0` | — [VERIFIED: tool probe on 2026-09-10] |
| tsx | Dedicated Node entry | ✓ | `4.21.0` | — [VERIFIED: tool probe on 2026-09-10] |
| DOM globals (`window`, `document`) | Must be absent from Node data runtime | ✓ absent | `undefined` / `undefined` | Do not add a DOM shim; isolate browser code. [VERIFIED: Node probe on 2026-09-10; .planning/phases/03-data-completion/03-CONTEXT.md:30-35] |
| `indexedDB` | Dexie-backed browser save initialization | ✓ absent | `undefined` | Confirm an injected/in-memory Node save policy before factory implementation. [VERIFIED: Node probe on 2026-09-10; packages-user/data-common/src/save/system.ts:61-67] |

**Missing dependencies with no fallback:** None for the existing commands. [VERIFIED: tool probes on 2026-09-10]  
**Missing dependencies with fallback:** IndexedDB is absent; the locked fallback is memory-capable state with fixture/explicit loading, not a browser database. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:45-52]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `4.0.18` [VERIFIED: package.json:97-98; tool probe on 2026-09-10] |
| Config file | `vite.config.ts`, `testTimeout: 30000`, `hookTimeout: 30000` [VERIFIED: vite.config.ts:46-49] |
| Quick run command | `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` [VERIFIED: package.json:8-10; command run on 2026-09-10] |
| Full data suite command | `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` [VERIFIED: same current data-package scope and command run on 2026-09-10] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Fresh top-level instance can execute a fixed replay containing a player action and event/state mutation, then match exact snapshots and end normally | integration / Node smoke | `pnpm test:data-node` | ❌ Wave 1 fixture and registry gap [ASSUMED] |
| DATA-01 | Existing data-side closure tests remain green | unit/integration | `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` | ✅ existing tests; replay closure is incomplete [VERIFIED: command run and inspected test files on 2026-09-10] |
| DATA-01 | Enemy creation/attribute or save behavior, Flag set/read/save-load, deterministic combat damage, saveable round trip, trigger/event mutation, and replay ordering/async-stop behavior | focused closure | `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` | ❌ `dataClosure.test.ts` is a planned Phase 3 artifact [ASSUMED] |
| DATA-01 | Four data packages have no TypeScript diagnostics | type gate | `pnpm check:type` plus the approved four-package diagnostic assertion | ❌ dedicated assertion is not present in package scripts [VERIFIED: package.json:6-24] |
| DATA-01 | Four data packages have no approved circular dependencies | static analysis | `pnpm exec madge --circular --extensions ts packages-user/data-common/src packages-user/data-base/src packages-user/data-system/src packages-user/data-state/src` | ❌ current command reports 15 cycles [VERIFIED: targeted command run on 2026-09-10] |

### Sampling Rate

- **Per task commit:** `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` [VERIFIED: package.json:8-10]
- **Per wave merge:** the same data-package suite plus the focused type and circular commands above. [ASSUMED]
- **Phase gate:** dedicated Node replay verifier, exact snapshots, data tests, approved four-package type gate, and approved circular gate all green before verification. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:36-41]

### Locked pre-execution gates

- [x] No-argument factory, constructor initialization, internal legacy dependency boundary, and Node-safe memory path are locked. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:43-52]
- [x] Stable top-level replay enum order and first-divergence thrown diagnostic fields are locked. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:48-52; latest user clarification]
- [x] Eight event built-in names, `(param, env)`, `IBlockEventEnv`, scope, and safe `void` failure are locked. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:47-52]
- [x] End-only full hero/map snapshot comparison, Node command, Tile events contract, and four-package circular boundary are locked. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:36-52]

## Security Domain

Security enforcement is enabled at ASVS level 1 in project configuration. [VERIFIED: .planning/config.json:47-51]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no for this data-only phase | No authentication surface is in the Phase 3 boundary. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:6-11] |
| V3 Session Management | no for this data-only phase | No user session/cookie behavior is in the Phase 3 boundary. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:6-11] |
| V4 Access Control | no for this data-only phase | No authorization boundary is added. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:6-11] |
| V5 Input Validation | yes | Reuse/extend explicit raw map/event validation; `MapState.validateRaw` rejects malformed containers, keys, positions, and IDs before registration. [VERIFIED: packages-user/data-base/src/map/mapState.ts:55-185] |
| V6 Cryptography | no new cryptography | Do not claim replay bytes are tamper-proof; this phase verifies deterministic execution, not authenticity. [VERIFIED: packages-user/data-common/src/replay/types.ts:162-187; .planning/phases/03-data-completion/03-CONTEXT.md:36-41] |

### Known Threat Patterns for TypeScript + legacy data bridges

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Legacy item effects are compiled with `new Function` | Code execution / Tampering | Keep legacy code behind the injected, trusted legacy bridge; do not expose it to arbitrary fixture input or broaden its scope. [VERIFIED: packages-user/data-state/src/legacy/item.ts:38-63] |
| Malformed raw map/event input | Tampering | Use `MapState.validateRaw` before `fromRaw`; add negative tests for any new fixture loader. [VERIFIED: packages-user/data-base/src/map/mapState.ts:55-185] |
| Unknown or false replay command | Tampering / Denial of service | Stop immediately, report the approved index/code/params/reason, and return non-zero from the Node verifier. [VERIFIED: packages-user/data-common/src/replay/sandbox.ts:124-141; .planning/phases/03-data-completion/03-CONTEXT.md:24-29,36-41] |
| Browser globals evaluated in Node | Information/control-flow boundary failure | Keep `window`/DOM/render modules out of the Node import graph and use explicit dependencies. [VERIFIED: packages/common/src/logger.ts:24-40; packages-user/entry-data/src/mota.ts:116-154; .planning/phases/03-data-completion/03-CONTEXT.md:30-35] |

## Resolved Contract Status

The seven questions previously listed as blockers are resolved by the latest CONTEXT decisions and user clarifications. They are recorded here so execution does not reopen them:

1. **Factory and construction:** `createCoreState()` has no options and directly calls `new CoreState()`; main initialization remains in the constructor. The constructor must select a Node-safe memory path when no legacy/browser host exists, while the compatibility singleton remains available for the browser path. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:43-52]
2. **Tile contract:** `ITileRawData.events` and `ITileStore.getEvent(num)` are authoritative; the implementation and legacy conversion migrate away from the scalar `trigger` shape. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:45-47]
3. **Replay ownership:** replay commands are registered at the top level using stable enum values in the locked order: up, right, down, left, auto-pathfind to point, use item, equip, unequip. The initial tracer uses a private direct `ReplaySystem` harness; the final registry is assembled by `CoreState` after the replay contract checkpoint. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:48-50; revised 03-01/03-03 plans]
4. **First-divergence diagnostics:** the Node verifier fails immediately by throwing an implementation-local error and reports index, top-level command code, params, and reason. The public replay boolean interface and a new user-facing error class are not changed. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:49-52; latest user clarification]
5. **Event built-ins:** the approved names are `eventSetBlock`, `eventMoveBlock`, `eventDeleteBlock`, `eventMoveHero`, `eventMoveHeroStep`, `eventTouchFront`, `eventInsertEvents`, and `eventInsertEvent`; all use `(param, env)` with `IBlockEventEnv` and safe `void` failure. Scope is map set/dynamic-move-static with optional safe/delete, hero sequence/forward/front `onTouch`, and temporary sequence/id insertion. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:47-52]
6. **Node save and snapshot:** Node uses memory-capable state and the fixed fixture/reset path; final replay comparison is end-only for full hero attributes and every map matrix. Per-step hero checks remain unit-test diagnostics only. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:36-52]
7. **Circular boundary:** the gate covers the four data packages internally and at their mutual boundaries; unrelated render/legacy-only code is not widened into the gate. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:39-45]

The remaining checkpoints in the plans are implementation-record gates for these locked contracts, not unresolved design questions. If execution exposes a genuinely new interface ambiguity, D-02/D-17 still require pausing for user clarification.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|--------------|
| A1 | The no-argument factory and verifier entry can be added without changing the user-owned Layer 3 interface. | Summary / Work Breakdown | LOW — constrained by D-23/D-28 and the implementation-local Node boundary. |
| A2 | The fixed replay fixture can use existing saveable objects for exact end snapshots. | Runtime State / Validation | LOW — D-26 fixes the compared hero/map outputs; use D-02 if an existing saveable lacks a defined representation. |
| A3 | The Node-safe boundary may require changes to the common logger/import graph while keeping the circular gate scoped to the four data packages. | Work Breakdown / Security | LOW — the change is permitted only where required for Node import safety; unrelated render/legacy-only diagnostics remain outside the gate. |
| A4 | The dedicated command and fixture paths are fixed by D-21. | Verification Commands | LOW — `pnpm test:data-node`, `script/test-data-node.ts`, and `packages-user/data-state/test/fixtures/`. |

## State of the Art

| Old approach in this repository | Current Phase 3 approach | Impact |
|-------------------------------|--------------------------|--------|
| Singleton `state = new CoreState()` as the data entry | Explicit factory first, singleton only for confirmed compatibility | Enables independent Node and render instances. [VERIFIED: packages-user/data-state/src/ins.ts:1-10; .planning/phases/03-data-completion/03-CONTEXT.md:30-35] |
| Global `core`/`window`/`main` access during construction/import | Injected legacy dependencies and a Node-safe import graph | Removes browser-global assumptions from replay verification. [VERIFIED: packages-user/data-state/src/core.ts:220-234; packages/common/src/logger.ts:24-40; .planning/phases/03-data-completion/03-CONTEXT.md:30-35] |
| Isolated event/map tests | Fixed end-to-end replay closure with exact snapshots | Verifies deterministic system integration while leaving broad regression coverage to Phase 6. [VERIFIED: .planning/phases/03-data-completion/03-CONTEXT.md:18-22,36-41,111-119] |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/03-data-completion/03-CONTEXT.md` — locked scope, decisions, deferred ideas, and canonical source files. [VERIFIED: file read on 2026-09-10]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `dev.md` — architecture, DATA-01 boundary, phase ordering, prior quality concerns, and project rules. [VERIFIED: files read on 2026-09-10]
- `packages-user/data-common/src/replay/{types,system,sandbox,func}.ts` — replay contracts and implementation. [VERIFIED: files read on 2026-09-10]
- `packages-user/data-state/src/{core,ins,types}.ts` and `packages-user/data-system/src/event/{system,executor,types}.ts` — current top-level and event wiring. [VERIFIED: files read on 2026-09-10]
- Current `pnpm` command runs — environment, test, type, circular, and direct Node-import baselines. [VERIFIED: commands run on 2026-09-10]

### Secondary (MEDIUM confidence)

- Existing data-package tests — fixture and global-stub patterns, plus current coverage boundary. [VERIFIED: files read on 2026-09-10]

### Tertiary (LOW confidence)

- None used; implementation assumptions are constrained by the resolved contract status and must not reopen locked decisions. [VERIFIED: this artifact]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions and commands were read from repository manifests/config and probed locally. [VERIFIED: package.json:6-24,81-98; vite.config.ts:46-49]
- Architecture: HIGH for current code, MEDIUM for the target because implementation seams still need to be wired, but the factory/replay/snapshot contracts are now locked. [VERIFIED: inspected source files and Resolved Contract Status above]
- Pitfalls: HIGH for observed global/type/circular failures, MEDIUM for remediation scope because D-17 forbids guessing. [VERIFIED: command results and source citations above]

**Research date:** 2026-09-10  
**Valid until:** 2026-09-17 for package/tool details; current-code findings remain valid until source changes. [ASSUMED]
