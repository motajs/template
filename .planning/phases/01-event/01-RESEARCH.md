# Phase 1: 事件系统 - Research

**Researched:** 2026-09-07
**Domain:** 数据驱动游戏引擎的脚本事件系统（blockly 式低代码 → 序列化 `Statement[]` → 解释执行）
**Confidence:** HIGH

## Summary

本阶段将旧的 `ITrigger` 触发器体系（数字类型 + 工厂注册 + 收集器 + 四条件方法）整体替换为事件驱动体系：事件内容是 Anon Tokyo 解释器的 `Statement[]`，经 `interpreter.compile()` 编译为 `AnonTokyoExecutable`，执行时调用 `execute(param, env)`。事件绑定粒度是「对象 + 地图格」混合，对象/图块上只存 `eventStore` 的 id（优先级 → id 的 Map），不存事件本体。

关键发现：**接口层已被用户设计完成**（符合 PROJECT.md「接口设计由用户主导」的协作模型），实现层落后于接口层。具体地，`EventTrigger` 枚举、`IGameEvent`/`IReadonlyGameEvent`、`GameEvent`、`IGameEventStore`/`GameEventStore`、`IBlockEvent`/`IBlockEventParam`/`IBlockEventEnv`、`ITileBase.events`、`IMapBlockSaveBase.events` 均已定义；但实现侧 `MapTileBase`/`StaticTile`/`DynamicTile` 仍使用旧的 `triggers: Set<number>`，`CoreState` 未实例化 `eventStore`（`IDataCommon` 已声明该成员），`store/index.ts` 桶导出缺失 `eventStore`/`mapStore`。本阶段的实现工作就是把这些已设计的接口落地，删除旧 `ITrigger` 体系，并把英雄移动流程从「收集触发器」改为「收集并执行事件」。

**Primary recommendation:** 以「已设计接口落地 + 旧体系删除」为主线组织计划：先补齐 L0 存储与桶导出、实例化 `eventStore`，再实现 L1 图块/点位的事件绑定与存档（`events` Map + dirty 标记），然后在 L2 实现事件执行器（专门对象，含 before 类触发器的返回值语义），最后重写 `moverImpl` 的踩踏触发并删除旧 `ITrigger` 体系。

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EVT-01 | 引擎提供事件系统的数据/序列化接口，支持 blockly 式低代码定义（编辑器在外部项目） | 已设计：`EventTrigger` 枚举 + `IGameEvent`（`Statement[]` → `compile()` → `AnonTokyoExecutable`）+ `IGameEventStore`；Anon Tokyo 解释器在 node_modules 中。需落地实现与桶导出 |
| EVT-02 | 事件系统能驱动简单场景的事件流程（踩踏触发、对话、开门） | 英雄移动流程 `moverImpl.ts` 的 enter/leave/hit/cannotEnter 需从旧 collector 重写为事件执行；对话/开门对应 `Statement` 内建函数调用与 `openDoor`/对话钩子 |
| EVT-03 | 事件系统定位为初学者抽象，仅覆盖简单场景，不为复杂场景追求通用表达 | `EventTrigger` 11 种内置枚举固定；长事件直接 `await`（D-09）；不引入通用脚本表达式（Anon Tokyo 已提供控制流但无需扩展） |

</phase_requirements>

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 事件绑定粒度：对象 + 地图格混合，两者都可绑定事件
- **D-02:** 触发方式使用 `EventTrigger` 枚举（11 种内置 + 可自行扩展），定义于 `packages-user/data-common/src/event/types.ts`
- **D-03:** 绑定对象分两类：点事件（不随脚下图块移动）与图块事件（随图块移动）
- **D-04:** 对象上存储的是 eventStore 的 id，而非事件本身
- **D-05:** 图块默认事件（怪物→战斗、道具→捡拾、可自定义）也走 eventStore（id 引用），可被自定义事件覆盖
- **D-06:** 执行顺序：先点事件、后图块事件，各自按优先级从高到低执行
- **D-07:** 事件内容 = Anon Tokyo 的 `Statement[]`，`interpreter.compile()` 编译为 `AnonTokyoExecutable`
- **D-08:** 执行 = `execute(param, env)`，`param` 为本次执行参数、`env` 为本次执行的环境对象
- **D-09:** 长事件（如对话）直接用 `await` 等待，不需要序列化执行状态；现阶段不聚焦解释执行的细节
- **D-10:** before 类触发器（OnBeforeBattle/OnBeforeOpenDoor/OnBeforeChangeFloor）的返回值处理：抽象一个专门对象负责事件执行（含 before 返回值的语义）
- **D-11:** 事件存储 `GameEventStore`（id → event），不进存档；代码生成的事件生成后立即执行、不落存档
- **D-12:** 点/图块事件的存档采用 dirty 标记：初始化时 dirty=false，后续变动且与原始数据不同则标记为 true
- **D-13:** 旧的 `ITrigger` 体系在本次阶段一并删除

### the agent's Discretion
接口设计由用户主导（PROJECT.md 协作模型）；AI 仅在已设计接口上实现、不自行设计接口。

### Deferred Ideas (OUT OF SCOPE)
None — 讨论保持在阶段范围内，未提出跨阶段新增能力。
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 事件数据类型（`EventTrigger`/`IGameEvent`/`IReadonlyGameEvent`） | L0 `@user/data-common` | — | 无依赖的序列化契约；blockly 编辑器生成的 `Statement[]` 直接落入此层 |
| 事件存储 `GameEventStore`（id → event） | L0 `@user/data-common` | — | 纯 Map，不进存档（D-11），可被任意高层引用 |
| 事件绑定到图块（`ITileBase.events`） | L1 `@user/data-base` | — | 属于可存档地图数据，随静态/动态图块存读档 |
| 事件绑定到点位（`IMapPointRawData`） | L1 `@user/data-base` | L0 | 点事件不随图块移动（D-03），存于地图原始点位数据 |
| 事件执行器（专门对象，before 返回值语义） | L2 `@user/data-system` | — | 依赖 `IStateBase`（L1）驱动战斗/开门/楼层切换；D-10 |
| Anon Tokyo 解释器 + 内建函数（对话/开门/道具等） | L2 `@user/data-system` | L3 `@user/data-state` | 内建函数是游戏动作，需访问 L1/L2 状态；解释器按 `LanguageFeature` 注册 |
| 英雄移动踩踏触发集成 | L3 `@user/data-state`（`moverImpl`） | L2 | `moverImpl` 是 `IHeroMoveTopImpl` 的默认实现，重写 enter/leave/hit/cannotEnter |
| 核心装配（`eventStore` 实例化） | L3 `@user/data-state`（`core.ts`） | L0 | `CoreState` 构造器统一装配 L0→L3 |

## Standard Stack

本阶段**不新增外部依赖**。技术栈固定（PROJECT.md Constraints），事件系统的「库」是既有 in-repo 模块 + 已安装的 Anon Tokyo 解释器。

### Core
| Library / Module | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `anon-tokyo` | 0.0.0-alpha.0 | blockly 式低代码 `Statement[]` 的解释执行（`compile`/`exec`） | 已在 `package.json` 锁定，D-07/D-08 指定的解释器，用户选型 |
| `@user/data-common`（`event/types.ts` + `store/eventStore.ts`） | in-repo | `EventTrigger`/`IGameEvent`/`GameEventStore` | 用户已设计的 L0 事件契约 |
| `@user/data-base`（`map/types.ts`） | in-repo | `IBlockEvent*`、`ITileBase.events` | 用户已设计的 L1 图块事件绑定接口 |

### Supporting
| Library / Module | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@user/data-system` | in-repo | 事件执行器（专门对象）+ 内建函数注册 | L2 层新建模块，替代旧 `trigger/` |
| `@user/data-state`（`core.ts`/`moverImpl.ts`） | in-repo | 装配与移动触发集成 | 替换旧 `triggerRegistry`/`triggerCollector` |
| `vitest` | 4.0.18 | 单测框架 | 已配置 `pnpm test`，Phase 6 才正式补单测，本阶段可选冒烟 |
| `vue-tsc` / `madge` / `eslint` | — | 类型 / 循环依赖 / lint 门禁 | `pnpm check:type` / `check:circular` / `lint:user` 为项目既定验证手段 |

**Installation:** 无新依赖安装。`anon-tokyo` 已在 `node_modules`（`.pnpm/anon-tokyo@0.0.0-alpha.0`），无需重新安装。

**Version verification:** `anon-tokyo` 版本经 `node_modules/anon-tokyo/package.json` 确认为 `0.0.0-alpha.0`，发布日期 2024-05-31（npm registry），发布者仓库 `github.com/tocque/AnonTokyo.git`。`vitest` 4.0.18 经根 `package.json` devDependencies 确认。

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| anon-tokyo | npm | ~2.3 yrs (pub 2024-05-31) | 7/wk | github.com/tocque/AnonTokyo.git | SUS | 已锁定依赖（非本阶段新装），无需 checkpoint；flag 供用户知悉 |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `anon-tokyo` — 低下载量（7/wk），但它是用户本人的领域解释器（`tocque` 仓库），已作为 `dependencies` 写入根 `package.json` 并安装于 `node_modules`。本阶段不安装新包，故无 `checkpoint:human-verify` 安装门槛；该依赖是 D-07 锁定的解释器，仅提示其为预发布 `alpha` 版本，`Statement` 类型签名以 `.d.ts` 为准。

*`anon-tokyo` 非通过 WebSearch/训练数据发现的新包——它已存在于 `package.json` 与 `node_modules`，且类型经直接读取 `node_modules/.pnpm/anon-tokyo@0.0.0-alpha.0/node_modules/anon-tokyo/dist/index.d.ts` 验证，故不适用「WebSearch 发现包必须 tag `[ASSUMED]`」规则。*

## Architecture Patterns

### System Architecture Diagram

```
        [外部 blockly 编辑器]  (不在本仓库)
                 │  生成序列化事件数据: Statement[]
                 ▼
  ┌───────────────────────────────────────────────┐
  │  GameEventStore (L0, id → IReadonlyGameEvent) │  ← 不进存档 (D-11)
  │  addEvent(id, event) / getEvent(id)           │
  └───────────────────────────────────────────────┘
        ▲ 对象/图块/点位仅存 eventStore id (D-04)          │ getEvent(id)
        │                                                  ▼
  ┌───────────────┐   ┌──────────────────────────────┐  ┌─────────────────┐
  │ ITileBase     │   │ IMapPointRawData (blockData)  │  │ IGameEvent      │
  │ .events       │   │ 点位事件 (不随图块移动, D-03)  │  │  trigger        │
  │ Map<pri,id>   │   └──────────────────────────────┘  │  rawEvent       │
  │ (随图块移动)   │                                     │  compile()      │
  └───────────────┘                                     │  execute(p,e)   │
        │                                               └────────┬────────┘
        ▼                                                        │
  英雄移动 moverImpl (L3)                                        │
  enter/leave/hit/cannotEnter ──收集──▶ 事件执行器(专门对象,L2) ◀─┘
                                          │  先点事件、后图块事件 (D-06)
                                          │  各自按 priority 降序
                                          │  before 触发器解析返回值 R (D-10)
                                          ▼
                        ┌─────────────────────────────────┐
                        │ AnonTokyoInterpreter (内建函数)   │
                        │ compile(Statement[])→Executable  │
                        │ exec(param, env) → Promise<R>    │
                        └─────────────────────────────────┘
                                          │
                    ┌─────────────────────┼──────────────────────┐
                    ▼                     ▼                      ▼
              对话(await)           开门 openDoor          战斗/楼层切换
           (长事件, D-09)         (OnBeforeOpenDoor        (OnBeforeBattle/
                                   返回是否可开门)          OnBeforeChangeFloor)
```

### Recommended Project Structure
```
packages-user/
├── data-common/src/
│   ├── event/
│   │   ├── types.ts        # EventTrigger + IGameEvent/IReadonlyGameEvent ✅已定义
│   │   ├── event.ts        # GameEvent 实现 ✅已定义（compile 缓存待修）
│   │   └── index.ts        # 导出 ✅已定义
│   └── store/
│       ├── eventStore.ts   # GameEventStore ✅已定义（桶导出缺失）
│       ├── types.ts        # IGameEventStore ✅已定义
│       └── index.ts        # ❌ 缺失 eventStore / mapStore 导出
├── data-base/src/map/
│   ├── types.ts            # IBlockEvent* + ITileBase.events ✅已定义
│   ├── tile.ts             # MapTileBase ❌ 仍用 triggers，待改 events
│   ├── staticTile.ts       # ❌ 存档仍用 triggers
│   └── dynamicTile.ts      # ❌ 存档仍用 triggers
├── data-system/src/
│   ├── trigger/            # ❌ 旧 ITrigger 体系，本阶段删除 (D-13)
│   └── event/              # ➕ 新建：事件执行器（专门对象）+ 内建函数
└── data-state/src/
    ├── core.ts             # ❌ 删除 triggerRegistry/triggerCollector，实例化 eventStore
    ├── content/triggers.ts # ❌ 删除 ChangeFloorTrigger
    └── hero/moverImpl.ts   # ❌ 重写为事件执行
```

### Pattern 1: 事件执行器（专门对象，D-10）
**What:** L2 层一个专门对象封装「收集事件 → 排序 → 执行 → before 返回值解析」。执行顺序先点事件后图块事件，各自按 `events` Map 的 key（priority）降序（D-06）。对 `OnBeforeBattle`/`OnBeforeOpenDoor`/`OnBeforeChangeFloor` 三类 before 触发器，其 `execute` 返回的 `R` 语义为「是否继续执行对应动作」，由该对象解析后决定是否调用战斗/开门/楼层切换。
**When to use:** 英雄移动踩踏、战斗前、开门前、楼层切换前等一切事件派发入口统一走此对象，避免各调用点重复实现排序与 before 语义。
**Example（接口层已就绪，实现为规划目标）:**
```typescript
// 已定义接口（VERIFIED）—— map/types.ts
export interface IReadonlyBlockEvent<R = void> extends IReadonlyGameEvent<
    IBlockEventParam,
    IBlockEventEnv,
    R
> {}
// IReadonlyGameEvent<P,E,R>.execute(param: P, env: E): Promise<R>
// before 类事件: R 为「是否继续」，如 OnBeforeOpenDoor 返回 false 则不开门
```

### Pattern 2: 图块事件绑定 = 优先级 Map
**What:** 图块/点位上存 `ReadonlyMap<number, string>`，key 为优先级（数值，越大越优先），value 为 `eventStore` 中的 id（D-04）。已设计在 `ITileBase.events`，实现侧需把 `MapTileBase.triggers: Set<number>` 替换为 `events: Map<number, string>`。
**When to use:** 所有静态/动态图块与点位的事件绑定；存档序列化时写入 `IMapBlockSaveBase.events`。
**Example:**
```typescript
// map/types.ts（VERIFIED）
export interface IMapBlockSaveBase {
    /** 当前图块的事件，键表示优先级，值表示事件在 `IGameEventStore` 中的 id */
    readonly events: ReadonlyMap<number, string>;
}
// ITileBase 已有 setEvent(priority, eventId) / deleteEvent(priority) / clearEvent()
```

### Anti-Patterns to Avoid
- **事件本体存进图块/点位：** 违反 D-04/D-11，会导致事件重复序列化进存档，且无法统一覆盖默认事件（D-05）。图块上只能存 id。
- **把事件执行逻辑散落在 moverImpl 各处：** 违反 D-06/D-10，排序与 before 返回值语义应集中在专门执行器对象，moverImpl 只负责「收集 → 委托执行器」。
- **为解释执行细节过度设计：** 违反 D-09/EVT-03，长事件直接 `await`，不要引入执行状态序列化/挂起恢复。
- **残留旧 `ITrigger` 引用：** D-13 要求一并删除，`core.ts` 的 `triggerRegistry`/`triggerCollector` 与 `data-system/trigger/` 必须清空，否则 `check:type`/`check:circular` 会失败。
- **手写解释器/表达式求值：** Anon Tokyo 已提供 `compile`/`exec`，不要自造。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| blockly 脚本的解释执行 | 自定义 AST 解释器 | `anon-tokyo`（`AnonTokyoInterpreter.compile` → `exec`） | 用户锁定的领域解释器，含控制流（if/loop/switch）与异步调用语义 |
| 事件存储 | 自定义事件注册表 | `GameEventStore`（`store/eventStore.ts`，id → event Map） | 已实现 `addEvent`/`getEvent`，D-11 明确不进存档 |
| 图块/点位事件绑定 | 自定义绑定结构 | `ReadonlyMap<number, string>`（priority → id） | 已设计在 `ITileBase.events`/`IMapBlockSaveBase.events` |
| 优先级排序 | 手写排序 + 冲突去重 | 执行器内按 Map key 降序遍历 | D-06 指定顺序，逻辑集中在专门对象 |
| 事件 id 生成 | 手写唯一 id | 沿用 `@user/` 既有的字符串 id 约定（图块/道具/地图均用字符串 id） | 与 eventStore 的 `id → event` 键类型一致 |

**Key insight:** 本阶段的「库」几乎全部是 in-repo 已设计接口与已安装的 Anon Tokyo。唯一需要「新建」的是 L2 的事件执行器对象（D-10 专门对象）与内建函数注册表——这是把「已设计接口」与「游戏动作」粘合的最小胶水层，不应扩展出额外的自定义框架。

## Runtime State Inventory

> 本阶段属 refactor（删除旧 `ITrigger` 体系，替换为事件体系）。旧触发器体系为纯内存代码，无外部运行时状态承载。

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — 旧 `ITrigger` 仅存于代码/地图图块 `triggers: Set<number>`（内存，随存档序列化但无独立存储服务） | code edit（存档格式 `ITrigger` → `events` Map） |
| Live service config | None — 无外部 UI/DB 配置承载触发器类型 | 无 |
| OS-registered state | None — 无 Task Scheduler / 服务注册 | 无 |
| Secrets/env vars | None — 触发器不涉及密钥 | 无 |
| Build artifacts | None — `pnpm build:lib` 产物随源码重建，无带旧名的持久产物 | 无 |

**Nothing found in category（各分类均已显式核对）：** 旧触发器体系是纯 TypeScript 代码 + 地图图块的 `triggers` 集合（经 `grep` 确认仅存在于 `data-system/src/trigger/`、`data-base/src/map/*`、`data-state/src/{core.ts,content/triggers.ts,hero/moverImpl.ts}`，无数据库/服务/OS/密钥/构建产物承载）。删除是纯代码编辑，不涉及数据迁移。

## Common Pitfalls

### Pitfall 1: 实现层仍引用旧 `triggers` 集合，与已设计的 `events` Map 脱节
**What goes wrong:** 接口 `ITileBase.events: ReadonlyMap<number, string>` 已设计，但 `MapTileBase`/`StaticTile`/`DynamicTile` 仍用 `triggers: Set<number>` 与 `addTrigger`/`clearTrigger`，导致 `check:type` 报 `implements` 不匹配，或存档仍写旧格式。
**Why it happens:** 用户先提交了接口层（types.ts），实现层未同步。
**How to avoid:** 计划中显式列出 `tile.ts`/`staticTile.ts`/`dynamicTile.ts` 的 `triggers` → `events` 改造项，含 `saveState`/`loadState`/`syncStaticTrigger` 的存档路径。
**Warning signs:** `vue-tsc --noEmit` 报 `MapTileBase` 缺少 `events`/`setEvent` 等成员；存档 JSON 中仍出现 `triggers` 字段。

### Pitfall 2: `eventStore` 声明了但未实例化，`CoreState` 类型不完整
**What goes wrong:** `IDataCommon` 已声明 `readonly eventStore: IGameEventStore`（`data-common/src/types.ts`），但 `CoreState` 构造器未创建 `GameEventStore`，`CoreState implements ICoreState` 缺成员。
**Why it happens:** 接口先行，实现滞后。
**How to avoid:** 计划中明确「`core.ts` 实例化 `GameEventStore` 并赋值 `this.eventStore`」；同时补 `store/index.ts` 导出 `eventStore`（当前桶导出缺 `eventStore`/`mapStore`，`core.ts` 甚至用相对路径 `'../../data-common/src/store/mapStore'` 绕过桶导出）。
**Warning signs:** `vue-tsc` 报 `CoreState` 缺少属性 `eventStore`；`import { GameEventStore } from '@user/data-common'` 解析失败。

### Pitfall 3: before 触发器的返回值语义散落各处
**What goes wrong:** `OnBeforeBattle`/`OnBeforeOpenDoor`/`OnBeforeChangeFloor` 的 `execute` 返回 `R`（是否继续），若由各调用点自行解析，会导致「是否开门/是否战斗/是否换层」的判定重复且不一致。
**Why it happens:** D-10 要求抽象专门对象，但实现时容易图快在各入口内联。
**How to avoid:** 事件执行器对象统一解析 before 返回值，战斗/开门/楼层切换入口只消费执行器的布尔结论。
**Warning signs:** 出现多处 `if (result === false) return` 分散在 `moverImpl`/战斗/开门代码中。

### Pitfall 4: `GameEvent.compile()` 未缓存导致重复编译
**What goes wrong:** `GameEvent.compile()` 返回 `interpreter.compile(this.rawEvent)` 但未写回 `this.compiled`，`execute()` 每次走 `compile` 分支，`compiled` 成员形同虚设（`setRaw` 里置 null 也无从触发缓存命中）。
**Why it happens:** 已实现但未完成缓存回写。
**How to avoid:** 计划中列入 `GameEvent.compile()` 缓存回写（`this.compiled = interpreter.compile(...)`），或由执行器持有 `AnonTokyoExecutable`。
**Warning signs:** 每次事件执行都重新 compile（性能与语义一致性问题）。

## Code Examples

### 事件定义与执行（已定义接口，VERIFIED）
```typescript
// Source: packages-user/data-common/src/event/types.ts（直接读取）
export const enum EventTrigger {
    None,                 // 无触发器，事件需要手动执行
    OnTouch,              // 当玩家触碰指定图块时触发，如果直接走入则不触发
    OnEnter,              // 当玩家进入指定图块时触发
    OnLeave,              // 当玩家离开指定图块时触发
    OnBeforeBattle,       // 与怪物战斗前触发，返回值表示是否与怪物战斗
    OnAfterBattle,        // 与怪物战斗后触发
    OnBeforeOpenDoor,     // 开启门之前触发，返回值表示是否能够成功开启门
    OnAfterOpenDoor,      // 开启门之后触发
    OnAfterGetItem,       // 成功拾取指定道具时触发
    OnBeforeChangeFloor,  // 楼层切换前触发，返回值表示是否执行切换操作
    OnAfterChangeFloor   // 楼层切换后触发
}
// IReadonlyGameEvent<P, E, R>:
//   readonly interpreter: AnonTokyoInterpreter;
//   readonly trigger: EventTrigger;
//   readonly rawEvent: Statement[];
//   readonly compiled: AnonTokyoExecutable | null;
//   compile(): AnonTokyoExecutable | null;
//   execute(param: P, env: E): Promise<R>;
```

### 解释器执行语义（VERIFIED，来自 .d.ts）
```typescript
// Source: node_modules/.pnpm/anon-tokyo@0.0.0-alpha.0/node_modules/anon-tokyo/dist/index.d.ts
// class AnonTokyoInterpreter {
//   constructor(lang: LanguageFeature);
//   compile(script: Statement[]): AnonTokyoExecutable;
//   exec(script: Statement[], parameters, env): Promise<unknown>;
// }
// class AnonTokyoExecutable {
//   exec(parameters: Record<string, any>, env: Record<string, any>): Promise<unknown>;
// }
// interface LanguageFeature {
//   builtInFunctions: BuiltInFunction[];   // { name, func(parameters, env) }
//   globalFunctions: [name: string, Block][];
// }
```

### 事件存储（已实现，VERIFIED）
```typescript
// Source: packages-user/data-common/src/store/eventStore.ts（直接读取）
export class GameEventStore implements IGameEventStore {
    private readonly store: Map<string, IReadonlyGameEvent<...>> = new Map();
    addEvent(id, event): void { /* 重复 id 时 logger.warn(170, id) 后覆盖 */ }
    getEvent<P, E, R>(id): IReadonlyGameEvent<P, E, R> | null { ... }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ITrigger` 四条件方法（`onEnter`/`onLeave`/`onHit`/`onCannotEnter`）+ 数字类型工厂注册 | `EventTrigger` 11 枚举 + 事件 `Statement[]` 解释执行 | 本阶段（D-13 删除旧体系） | 触发语义从「方法」变为「数据」，blockly 编辑器可直接序列化 |
| 触发器类型存为 `number[]`（`ITileRawData.trigger`） | 图块/点位存 `eventStore` id（`Map<number,string>`） | 本阶段 | 默认事件可被自定义覆盖（D-05），事件内容与图块解耦 |
| 触发器实例随收集即时创建（`TriggerCollector.collect`） | 事件预编译为 `AnonTokyoExecutable`，执行时 `execute(param, env)` | 本阶段 | 编译与执行分离，长事件可 `await`（D-09） |

**Deprecated/outdated:**
- `@user/data-system/trigger/`（`ITrigger`/`ITriggerRegistry`/`ITriggerCollector`/`ITriggerCollection`）：本阶段删除。
- `@user/data-state/src/content/triggers.ts`（`ChangeFloorTrigger`）：本阶段删除，楼层切换改由 `OnBeforeChangeFloor`/`OnAfterChangeFloor` 事件承载。
- `ITileRawData.trigger: number[]` / `MapTileBase.triggers`：将被 `events: Map<number,string>` 取代。

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 点事件绑定落在 `IMapPointRawData`（`blockData`），与图块事件 `ITileBase.events` 分离（D-03「不随图块移动」语义） | Architecture | 若点事件应另建存储结构，`blockData` 改造范围需调整；已设计接口里 `IMapPointRawData` 目前仅有 `trigger?: number[]`/`changeFloor`，需用户确认点事件的承载字段 |
| A2 | Anon Tokyo 内建函数集（对话、开门、道具、战斗等 blockly 块对应的 `BuiltInFunction`）的清单与命名由用户主导，AI 只实现已定函数 | Standard Stack / Architecture | 若内建函数清单未定，执行器与 `LanguageFeature` 组装无法落地；这是 EVT-02（对话/开门）的关键前提，需用户提供 |
| A3 | 事件执行器（D-10 专门对象）归属 L2 `@user/data-system`，并在此新建模块（`data-system/src/event/`） | Architecture | 若用户期望执行器在 data-state（L3），模块位置与依赖方向需调整 |
| A4 | 英雄移动四个钩子（enter/leave/hit/cannotEnter）与 `EventTrigger` 的映射：enter→`OnEnter`、hit（`eventPass=false` 撞击）→`OnTouch`、leave→`OnLeave`；`cannotEnter` 无对应事件 | Architecture | 旧 `TriggerType` 四条件与新 `EventTrigger` 枚举并非一一对应，`cannotEnter` 是否保留、`OnTouch` 与 `OnEnter` 的边界需用户确认 |
| A5 | `GameEvent.compile()` 缓存回写与 `compiled` 成员语义需在实现时修正 | Pitfalls | 若不修正，事件重复编译，虽功能可用但浪费；若用户有更明确语义需遵循 |
| A6 | 本阶段无新增外部依赖，`anon-tokyo` 作为既有依赖直接使用 | Package Legitimacy | 若需升级/替换 `anon-tokyo` 版本，`Statement` 类型签名可能变化 |

**Note:** A1/A2/A4 是「接口设计由用户主导」下 AI 无法自行拍板的点，应在计划阶段前由用户确认或明确标注为待定。它们不阻塞「删除旧体系 + 落地已设计接口」的骨架工作，但阻塞 EVT-02 对话/开门的端到端验证。

## Open Questions

1. **点事件的承载字段（A1）**
   - What we know: D-03 区分点事件（不随图块移动）与图块事件；图块事件已设计在 `ITileBase.events`；`IMapPointRawData` 目前仅有 `trigger?: number[]` 与 `changeFloor`。
   - What's unclear: 点事件的优先级 → eventStore id 应挂在 `IMapPointRawData` 的哪个字段（新增 `events`？），以及点事件的存档 dirty 标记如何与图层 dirty 协同。
   - Recommendation: 计划中把「点事件字段」标为用户待定项，先落地图块事件路径，点事件按用户后续接口定义接入。

2. **Anon Tokyo 内建函数清单（A2）**
   - What we know: `LanguageFeature.builtInFunctions: BuiltInFunction[]`，`BuiltInFunction.func(parameters, env)`；对话/开门/道具/战斗是 EVT-02 必需动作。
   - What's unclear: 具体块名（如「对话」「开门」「给道具」「战斗」）与参数结构，由 blockly 编辑器与引擎约定。
   - Recommendation: 请用户提供内建函数清单；在清单未定前，先实现「执行器 + eventStore + 图块绑定」骨架，内建函数注册表留空或仅含最小集（`openDoor`）。

3. **`EventTrigger` 与旧移动条件的映射（A4）**
   - What we know: 旧 `TriggerType` = Enter/Leave/Hit/CannotEnter；新 `EventTrigger` = None/OnTouch/OnEnter/OnLeave/OnBeforeBattle/OnAfterBattle/OnBeforeOpenDoor/OnAfterOpenDoor/OnAfterGetItem/OnBeforeChangeFloor/OnAfterChangeFloor。
   - What's unclear: 撞击（`eventPass=false`）映射到 `OnTouch` 还是 `OnEnter`；`cannotEnter`（地形阻挡）在新体系中是否有对应触发。
   - Recommendation: 请用户确认移动四钩子与 `EventTrigger` 的映射；`OnTouch` 注释「触碰指定图块，直接走入则不触发」暗示撞击即 `OnTouch`，需确认。

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 构建/运行 | ✓ | v22.18.0 | —（满足 `^20 || >=22`） |
| pnpm | 依赖管理 | ✓ | 10.15.0 | —（满足 `>=10`） |
| anon-tokyo | 事件解释执行 | ✓ | 0.0.0-alpha.0 | —（已安装） |
| vitest | 单测 | ✓ | 4.0.18 | —（`pnpm test` 可用） |
| vue-tsc | 类型门禁 | ✓ | 2.2.12 | — |
| madge | 循环依赖检查 | ✓ | 8.0.0 | — |
| eslint | lint 门禁 | ✓ | 9.39.4 | — |

**Missing dependencies with no fallback:** none
**Missing dependencies with fallback:** none

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | none — 根 `package.json` 有 `"test": "vitest"`，无 `vitest.config.*` |
| Quick run command | `pnpm check:type`（< 30s，类型门禁） |
| Full suite command | `pnpm test`（当前无测试文件） |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EVT-01 | `EventTrigger`/`IGameEvent`/`GameEventStore` 定义可序列化、`compile`/`execute` 可用 | unit（可选） | `pnpm test` 或 `pnpm check:type` | ❌ Wave 0 |
| EVT-02 | 踩踏触发（enter/hit）驱动事件执行；对话 await、开门 openDoor 链路 | integration / manual | `pnpm check:type` + 手动验证 | ❌ Wave 0 |
| EVT-03 | 抽象简单（无复杂通用表达式），旧 ITrigger 无残留引用 | static（grep + type） | `pnpm check:type` + `pnpm check:circular` | ✅ 门禁已存在 |

### Sampling Rate
- **Per task commit:** `pnpm check:type`（本项目既定门禁，类型缺失会立即暴露接口/实现脱节）
- **Per wave merge:** `pnpm check:circular`（循环依赖门禁）+ `pnpm lint:user`
- **Phase gate:** `pnpm check:type` 全绿 + 旧 `ITrigger` 引用清零（`grep -r "ITrigger\|TriggerCollector\|TriggerRegistry" packages-user` 无匹配）

### Wave 0 Gaps
- [ ] `packages-user/data-common/src/event/event.test.ts`（或等价）— 覆盖 `GameEvent` 的 `compile`/`execute`/缓存回写（可选，TEST-01 在 Phase 6）
- [ ] `packages-user/data-common/src/store/eventStore.test.ts` — 覆盖 `addEvent`/`getEvent`（可选）
- [ ] 内建函数冒烟测试（对话/开门）— 依赖 A2 清单，清单未定前搁置

*(说明：TEST-01 单测补齐为 Phase 6；本阶段按项目惯例以 `check:type`/`check:circular`/`lint:user` 为主要验证门禁，行为验证（EVT-02 端到端）在清单确定后补可选 vitest 冒烟。)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 引擎无账号体系 |
| V3 Session Management | no | 无会话概念（存档由 SaveSystem/Dexie 管理，不涉本阶段） |
| V4 Access Control | no | 无用户权限边界 |
| V5 Input Validation | yes（弱） | 事件 `Statement[]` 来自外部编辑器序列化数据，执行前须容忍非法块名/非法参数（Anon Tokyo 内建函数应校验参数、缺省时 `logger.warn` 而非抛异常） |
| V6 Cryptography | no | 不涉密钥 |

### Known Threat Patterns for {Anon Tokyo 脚本事件}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 恶意/损坏的 `Statement[]` 引用未注册的内建函数名 | DoS / Tampering | `AnonTokyoInterpreter` 对未注册函数调用应安全失败；内建函数用白名单注册，未知名 `logger.warn` 后跳过 |
| 事件参数类型越界（如负数坐标、非法图块 id） | Tampering | 内建函数内部用 `isNil`/边界校验（沿用 `logger` 数字错误码惯例），不抛异常中断游戏 |
| 事件执行无限循环/长任务阻塞主循环 | DoS | D-09 已限定长事件 `await`、不序列化状态；Anon Tokyo 解释器自身控制流语义，超出本阶段范围 |

**Note:** 本阶段不处理用户输入的身份/授权，安全面集中在「外部编辑器生成的事件数据」这一不受信输入边界——事件数据与事件内建函数调用应视为不可信输入，遵循项目既有的 `logger` 数字错误码 + 非异常中断的处理惯例。

## Sources

### Primary (HIGH confidence) — 直接读取源码文件
- `packages-user/data-common/src/event/types.ts:7-74` — `EventTrigger` 枚举（11 值）+ `IGameEvent`/`IReadonlyGameEvent`（`[VERIFIED]`）
- `packages-user/data-common/src/event/event.ts:8-53` — `GameEvent` 实现（`[VERIFIED]`）
- `packages-user/data-common/src/store/eventStore.ts:5-28` + `store/types.ts:338-360` — `GameEventStore`/`IGameEventStore`（`[VERIFIED]`）
- `packages-user/data-common/src/types.ts:46-61` — `IDataCommon.eventStore` 声明（`[VERIFIED]`）
- `packages-user/data-common/src/store/index.ts:1-3` — 桶导出缺失 `eventStore`/`mapStore`（`[VERIFIED]`）
- `packages-user/data-base/src/map/types.ts:26-54,58-68,79-127` — `IBlockEvent*`、`IMapBlockSaveBase.events`、`ITileBase.events`/`setEvent`/`deleteEvent`/`clearEvent`（`[VERIFIED]`）
- `packages-user/data-base/src/map/tile.ts:18,47-65` + `staticTile.ts` + `dynamicTile.ts` — 实现侧仍用 `triggers`（`[VERIFIED]`）
- `packages-user/data-system/src/trigger/*` — 旧 `ITrigger` 体系待删除（`[VERIFIED]`）
- `packages-user/data-state/src/core.ts:97-99,202-207` — `triggerRegistry`/`triggerCollector` 引用待删（`[VERIFIED]`）
- `packages-user/data-state/src/content/triggers.ts:26-29` — 旧 `TriggerType.ChangeFloor`（`[VERIFIED]`）
- `packages-user/data-state/src/hero/moverImpl.ts:141-184` — 移动钩子旧 collector 集成（`[VERIFIED]`）
- `node_modules/.pnpm/anon-tokyo@0.0.0-alpha.0/node_modules/anon-tokyo/dist/index.d.ts` — `AnonTokyoInterpreter`/`AnonTokyoExecutable`/`Statement`/`LanguageFeature`（`[VERIFIED]`）
- `node_modules/anon-tokyo/package.json` — 版本 0.0.0-alpha.0（`[VERIFIED]`）

### Secondary (MEDIUM confidence)
- `docs/dev/map/trigger.md`、`trigger-impl.md`、`system/trigger-refactor.md` — 旧 ITrigger 体系的历史设计文档（已确认其描述的是**待删除**的旧体系，非新事件系统）
- `.planning/phases/01-event/01-CONTEXT.md` + `01-DISCUSSION-LOG.md` — 用户决策 D-01..D-13 与讨论轨迹

### Tertiary (LOW confidence)
- 无 WebSearch 依赖——本阶段为内部代码重构，所有关键事实均来自直接读取源码，未引入外部检索结论。

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 全部 in-repo 模块 + `anon-tokyo` 均经直接读取源码/`.d.ts`/`package.json` 验证
- Architecture: HIGH — 接口层已设计，实现层差距经逐文件核对；D-01..D-13 决策直接引用
- Pitfalls: HIGH — 四个陷阱均来自「接口已设计/实现滞后」的具体代码事实（`check:type` 可复现）

**Research date:** 2026-09-07
**Valid until:** 2026-09-21（接口设计由用户主导，若用户补充点事件字段/内建函数清单，A1/A2/A4 相关结论需刷新）
