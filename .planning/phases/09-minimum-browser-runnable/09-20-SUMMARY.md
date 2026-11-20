---
phase: 09-minimum-browser-runnable
plan: 20
subsystem: data-state + client-modules (engine-side plugin system)
tags: [plugin-system, dependency-topology, cycle-detection, logger-codes, runtime-guard]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "用户 WIP 新增的数据端插件类型（PluginStatus / IDataPlugin / IDataPluginDefine / ICoreState.getDataPlugin / ICoreState.load / ICoreStateConfig.plugins）与 core.ts 空壳"
provides:
  - "packages-user/data-state/src/plugin.ts：orderPlugins（依赖拓扑排序 + 环检测 + 依赖不存在检测）+ IPluginDepends / IPluginHolder / IPluginOrderResult"
  - "CoreState 插件驱动：plugins 注册表（config.plugins ?? [] 守卫 + 重复 id 报 78 且不覆盖）+ 四段式 awake/initialize/afterLoad（protected）+ load() 编排 + getDataPlugin"
  - "渲染端镜像：IClientPlugin / IClientPluginDefine / clientPlugins / getClientPlugin + ClientCore 对齐实现（orderPlugins 自 @user/data-state 复用）"
  - "logger.json error 段新增 76（循环依赖）/ 77（依赖不存在）/ 78（重复 id）"
affects: [09-21, 入口/配置接线（用户后续）]

# Actuals (#2632) — pairs with the plan's estimate to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 6274
  tasks: 2
  commits: 0

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "共享纯函数 orderPlugins 作为数据端与渲染端唯一的拓扑/环/缺失检测实现"
    - "依赖拓扑序驱动的四段式插件生命周期（awake 同步 → initialize 异步阻塞 → loader 加载 → afterLoad 异步阻塞）"
    - "构造器注册表以 ?? [] 运行时守卫建立，兼容未接线插件配置的既有调用点"
    - "插件错误码集中：环 → 76 / 依赖不存在 → 77 / 重复 id → 78（且不覆盖）"

key-files:
  created:
    - packages-user/data-state/src/plugin.ts
    - packages-user/data-state/src/__test__/plugin.test.ts
  modified:
    - packages-user/data-state/src/core.ts
    - packages-user/data-state/src/index.ts
    - packages-user/client-modules/src/types.ts
    - packages-user/client-modules/src/client.ts
    - packages/common/src/logger.json

key-decisions:
  - "共享纯函数 orderPlugins 计算可初始化拓扑序、环上插件（cyclic）与直接缺失依赖（missing）；被排除集合 = 环上 ∪ 缺失 ∪ 其下游；下游仅缺席于 order，不单独报码"
  - "插件错误处置（D-92）：循环依赖 → logger.error(76, ...)；依赖不存在 → 逐条 logger.error(77, pluginId, missingDepId)；重复 id → logger.error(78, id) 且保留先注册者不覆盖；报错插件及下游全部不进入加载流程（status 保持 NotAwakened）"
  - "运行时守卫（D-91/D-56）：CoreState 用 config.plugins ?? []、ClientCore 用 config.clientPlugins ?? []，未接线插件配置的既有调用点不改动且不崩溃"
  - "渲染端复用数据端 PluginStatus（自 @user/data-state 导入，未自建）；orderPlugins 亦自 @user/data-state 导入"
  - "CoreState.awake/initialize/afterLoad 由 private 改 protected，供 ClientCore 以 super.<stage>() 先驱动数据端、再驱动渲染端（数据端先、渲染端后）"
  - "渲染插件 state 参数类型默认 ICClientCore（OI-5）"

patterns-established:
  - "插件排序: 单文件零 import 的纯函数，数据端与渲染端复用"
  - "生命周期: 单一公开入口 load() 编排四段，子类覆写 protected 阶段实现同阶段横向插入"

requirements-completed: []

coverage:
  - id: D1
    description: "数据端插件驱动：CoreState 注册表（守卫 + 重复 id 不覆盖）+ 四段式拓扑序驱动 + 状态推进 + 环/依赖不存在（含下游）排除"
    verification:
      - kind: other
        ref: "structural gate (data plugin) — orderPlugins/config.plugins ?? []/this.plugins.has/logger.error(76,77,78)/protected phases/loader.start() — PASS"
        status: pass
    human_judgment: true
    rationale: "运行期 vitest 门禁（plugin.test.ts）因用户并发 WIP 删除 ./enemy 与 ./event 目录而无法解析 ../core，属已知阻断；需用户接线后运行期复核"
  - id: D2
    description: "渲染端镜像：IClientPlugin / IClientPluginDefine / clientPlugins / getClientPlugin + ClientCore 三阶段覆写（super 先、渲染端后）+ 与数据端一致的 76/77/78 处置"
    verification:
      - kind: other
        ref: "structural gate (render plugin) + barrel/logger gate — PASS"
        status: pass
    human_judgment: true
    rationale: "ClientCore 依赖 canvas/DOM，无法在 Node 下运行期验证，仅结构断言；行为正确性需人工复核"

# Metrics
duration: ~35min
completed: 2026-10-14
status: complete
---

# Phase 09 Plan 20: 数据端插件驱动 + 渲染端插件系统镜像 Summary

**在 CoreState 实现以 `config.plugins ?? []` 守卫注册表、`orderPlugins` 拓扑序驱动的四段式插件生命周期（环报 76 / 依赖不存在报 77 / 重复 id 报 78 且不覆盖），并在 ClientCore 镜像同一套渲染端插件系统（数据端先、渲染端后）；仅引擎侧、不接入口配置。**

## Performance

- **Duration:** ~35min
- **Started:** 2026-10-14T11:12:00Z (approx)
- **Completed:** 2026-10-14T11:48:31Z
- **Tasks:** 2 (Task 1 tracer + Task 2 auto)
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments

- `orderPlugins`（`packages-user/data-state/src/plugin.ts`）：零 import、零副作用的共享纯函数，一次计算可初始化拓扑序、环上插件集合、直接缺失依赖映射；被排除集合（环上 ∪ 缺失 ∪ 其下游）不会进入拓扑序。
- `CoreState` 插件驱动（`core.ts`）：`plugins` 注册表由 `config.plugins ?? []` 守卫建立（重复 id `logger.error(78,...)` 且不覆盖）；`protected awake/initialize/afterLoad` 按拓扑序驱动并通过 `PluginStatus` 推进；`load()` 编排四段（第三段 `for await (const progress of this.loader.start()) { void progress; }` 非空循环体）；`awake` 阶段报 76（`[...cyclic].join(', ')`）与 77（逐条 `pluginId, missingDepId`）。
- 桶导出（`index.ts`）：追加 `export * from './plugin';`，使渲染端可自 `@user/data-state` 导入 `orderPlugins`。
- 渲染端镜像（`client-modules/src/types.ts` + `client.ts`）：顶层新增 `IClientPlugin` / `IClientPluginDefine` / `IClientCoreConfig.clientPlugins` / `IClientCore.getClientPlugin`，复用数据端 `PluginStatus`；`ClientCore` 以 `config.clientPlugins ?? []` 建注册表、复用自 `@user/data-state` 的 `orderPlugins`，以 `protected` 覆写三阶段（`super.<stage>()` 先）实现「数据端先、渲染端后」。
- `logger.json` error 段新增 76/77/78（保留既有 75 不动）。

## Task Commits

**未提交** —— 按执行指令（不要 `git add` / `git commit`），全部改动保留在工作树。

## Files Created/Modified

- `packages-user/data-state/src/plugin.ts`（新）— `orderPlugins` + `IPluginDepends` / `IPluginHolder` / `IPluginOrderResult`
- `packages-user/data-state/src/__test__/plugin.test.ts`（新）— `orderPlugins` 与 `CoreState` 四段驱动的运行期单测（拓扑序 / 环 / 依赖不存在（含下游）/ 重复 id / 运行时守卫）
- `packages-user/data-state/src/core.ts`（改）— `orderPlugins` 导入、`plugins` 注册表、构造器守卫建表、四段式 `load()` 与 `protected` 三阶段、76/77/78 处置
- `packages-user/data-state/src/index.ts`（改）— 追加 `export * from './plugin';`
- `packages-user/client-modules/src/types.ts`（改）— 渲染端插件类型 + `clientPlugins` + `getClientPlugin`；导入 `PluginStatus`
- `packages-user/client-modules/src/client.ts`（改）— `clientPlugins` 注册表（守卫）、`getClientPlugin`、三阶段 `protected` 覆写（`super.` 先）
- `packages/common/src/logger.json`（改）— error 段追加 76/77/78

### logger.json error 段新增文本（原样）

- `"76": "Plugin dependency cycle detected: $1. Cyclic plugins will not be initialized."`
- `"77": "Plugin $1 depends on a non-existent plugin: $2. Related plugins will not be initialized."`
- `"78": "Duplicate plugin id: $1. The duplicate will not be registered."`

既有 `"75": "Plugin $1 error, related plugins will not be initialized. Error info: $2."` 原样保留。

## Decisions Made

- 采用 D-92 裁定：76=环 / 77=依赖不存在 / 78=重复 id 且不覆盖；报错插件及其下游全部不进入加载流程（`status` 保持 `NotAwakened`）。
- 三阶段私有辅助逻辑内联在各自方法内（不新增未获批的私有方法名），复用 `orderPlugins` 与已批准命名。
- `awake`/`initialize`/`afterLoad` 由 `private` 改 `protected`（OI-4），供 `ClientCore` 覆写；`ClientCore` 覆写不传 `config` 给 `super(...)`（OI-9 默认）。
- 渲染插件 `state` 参数类型采用 `IClientCore`（OI-5 默认）。

## Deviations from Plan

None - plan executed as written（仅按执行指令将「运行期 vitest 门禁」记录为已知阻断、并将范围门禁按用户 WIP 放宽，见下）。

## Known Blockers

- **运行期 vitest 门禁（Task 1 `<verify>` 首项）无法执行 —— 已知阻断，未伪造通过。** `plugin.test.ts` 导入 `../core`，而 `core.ts` 依赖用户并发 WIP 删除的 `packages-user/data-state/src/enemy/` 与 `src/event/` 目录（`./enemy` / `./event` 导入已解析失败）；`src/index.ts` 亦引用已删除的 `./enemy` / `./event` / `./replay`。按用户指令**不修复**用户 WIP 的破损导入、不运行该门禁。该阻断为**前置条件性质**（用户接线时统一处理），非本计划实现缺陷。
- 影响：数据端驱动的**运行期**行为（拓扑序 / 状态推进 / 排除语义）未在本机运行验证；已由 `plugin.ts` / `core.ts` 的**结构断言**与算法设计覆盖。`plugin.test.ts` 已按计划撰写，待用户 WIP 修复后可运行。

## Issues Encountered

- **范围门禁需放宽**：计划 Task 2 的 `SCOPE GATE` 以 `git status` 判定，用户并发 WIP 的移动/删除（`data-state` 的 `enemy`/`event`/`hero`/`replay`/`loader` 目录、多处 test 与 `src/**` 新增）不在其白名单内，故原样门禁失败。按执行指令放宽为「允许上述**预先存在**的 WIP 变更，仅断言本次新增变更 ⊆ `files_modified`」——已通过（见下）。
- **无全仓门禁**：未运行 `pnpm check:type` / `pnpm build` / `pnpm test:ci`（用户 WIP 存在历史类型错误）。

## Structural Gates (run)

| Gate | Source | Result |
|------|--------|--------|
| 数据端插件结构门禁（gate 3） | Task 1 `<verify>` | **PASS** — `orderPlugins` 导出、三接口含 `missing`、零 import；`logger.json` 76/77/78 且 75 原样；`core.ts` `plugins: Map<string, IDataPlugin...`、`config.plugins ?? []`、`this.plugins.has(`、`logger.error(78`、三阶段 `protected`、`loader.start()`、76/77、无 75；`index.ts` `./plugin` |
| 方向/环门禁（gate 4） | Task 1 `<verify>` | **PASS** — `data-state/src/**` 无 `@user/client-*` 反向导入 |
| 渲染端插件结构门禁（gate 5） | Task 2 `<verify>` | **PASS** — `types.ts` 四命名 + `PluginStatus` 复用（未自建）；`client.ts` `clientPlugins` 注册表 + `config.clientPlugins ?? []` + `this.clientPlugins.has(` + `logger.error(78` + `getClientPlugin` + 三阶段 `protected` + `super.<stage>()` + 76/77 + `orderPlugins` 自 `@user/data-state` |
| 桶路由 / logger 门禁（gate 7） | Task 2 `<verify>` | **PASS** — `client-modules/src/index.ts` 仍导出 `./types`；`logger.json` 76/77/78 且 75 原样 |
| 范围门禁（gate 6，**放宽后**） | Task 2 `<verify>` | **PASS（放宽）** — 本次新增变更严格 ⊆ `files_modified`；其余变更均为预先存在的用户 WIP |
| 运行期 vitest 门禁（gate 2） | Task 1 `<verify>` 首项 | **BLOCKED（未运行）** — 见「Known Blockers」 |

## User Setup Required

None - 引擎侧实现，不接入口/配置，无外部服务。用户后续接线：`ins.ts` 传入 `plugins`，`client-modules/src/core.ts` / `src/client/entry.ts` 传入 `clientPlugins`（及 `heroFace` / `events` 等 `ICoreStateConfig` 必填字段）。接线前「数据端先、渲染端后」为空转（注册表为空、无插件可驱动）——已知后果（D-91）。

## Write Boundary

- 仅写入 `files_modified` 所列路径（7 个文件 + 本 SUMMARY）。
- **未**触碰：`src/**`（入口/接线）、`index.html`、`packages-user/data-base/hero/*`、`data-state/src/types.ts`、`ins.ts` 与任何既有 test/fixture 调用点、`initializeEnemy/initializeSave/initializeReplay` 及其注释、任何既有注释/jsDoc、`client-modules/src/index.ts`、`package.json` / lockfile。
- `logger.json` **仅追加** 76/77/78；未改动/未删除/未重排既有条目。
- 用户并发 WIP 的既有改动**全部保留**（编辑均在现有内容之上追加/补全）；**未修复**用户 WIP 的 `./enemy` / `./event` 破损导入。
- 未新增依赖；未运行 `git add` / `git commit`（改动留在工作树）。

## Next Phase Readiness

- 数据端与渲染端插件系统机制就位，结构门禁全绿；`plugin.test.ts` 已就绪待用户 WIP 修复后运行。
- 待用户接线：数据端 `plugins`、渲染端 `clientPlugins` 注入各调用点，并统一核对 `ICoreStateConfig` 必填字段造成的既有类型不匹配（用户 WIP）。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-14*
