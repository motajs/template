# Phase 6: 单元测试 - Context

**Gathered:** 2026-09-14
**Status:** Ready for planning

<domain>
## Phase Boundary

为数据端核心系统补齐**行为单元测试**：怪物战斗系统、录像系统、勇士系统、地图系统、存读档系统，以及 flag 与 common 辅助模块。**单测与核心代码修复分两个环节**：先用测试验证接口能否正常运行；发现问题只分析、只汇报，经用户确认后才修复，**不得擅自修改核心代码**。

本次只做 Phase 6 的**数据端切片**。ROADMAP 中 Phase 6 的非数据端部分（渲染/legacy 相关覆盖）延后；Phase 5（Legacy 移植）未完成，若后续改动数据端接口，本阶段测试可能需要同步调整。

系统与模块清单（用户指定）：

**五个重点系统**
1. 怪物战斗：`data-system/src/combat` + `data-state/src/enemy` 顶层实现；另 `data-base/src/enemy` 验证怪物数据
2. 录像：`data-common/src/replay`（录像数组读写、录像系统本身）
3. 勇士：`data-base/src/hero`（每个勇士系统能否正确运行）
4. 地图：`data-base/src/map`（现有测试不全面，需更全面覆盖）
5. 存读档：验证 `CoreState` 的存档/读档状态恢复（非 Dexie SaveSystem 本身）

**两个简单模块**
6. 全局 flag：`data-base/src/flag`
7. 通用接口：`data-common/src/common`（预计会被上述主要测试部分覆盖）

</domain>

<decisions>
## Implementation Decisions

### 测试层级与 fixture
- **D-01:** 采用**混合测试形态**：纯逻辑/数据模块直接单测（fake / 显式依赖注入，延续 Phase 3 D-03）；涉及多系统协作的（战斗、存读档、录像）经 `CoreState` 集成测试。战斗与存读档也要有经 `CoreState` 的集成路径。
- **D-02:** 测试数据使用**最小合成 fixture**（手写小地图、小怪物属性、小录像数组），必要时才引用现有 `packages-user/data-state/test/fixtures/closed-loop.ts`。不读取真实游戏数据。
- **D-03:** fixture 代码**每个测试文件内联构造**，不建立跨文件共享 fixture/factory helper，避免隐式耦合（符合 `dev.md` 无副作用原则）。
- **D-04:** 涉及异步动作（mover / 寻路 / 事件链 / 战斗长动作）的测试使用**真实计时器 + `await` 控制器 `onEnd`**；纯计算同步断言。不使用 fake timers。

### 问题记录与门禁
- **D-05:** 单测暴露疑似 bug 时，测试按**正确预期**编写，但标记 `it.skip` / `it.todo` 并附中文注释指向 `06-TEST-FINDINGS.md`；`pnpm test:ci` **保持全绿**。修复后取消 skip，转为回归用例。
- **D-06:** 问题记录写入阶段目录的 `06-TEST-FINDINGS.md`，每条包含：模块/接口、现象、最小复现、疑似原因、影响面、建议修复方向、关联 skip 用例、严重度。
- **D-07:** **逐个系统**完成测试后向用户汇报该系统的发现；经用户确认后才进入修复环节。**不得擅自修改核心代码**（延续 Phase 3 D-02 / D-17：接口行为未定义或实现与接口不一致时暂停提问，不擅自扩展或猜测）。
- **D-08:** 测试使用现有固定非 watch 命令 `pnpm test:ci` 验证，数据端测试必须全部通过（延续 Phase 3 D-04）。
- **D-09:** 覆盖率仅作参考，**不作判定标准**；以行为测试为主。本次不引入覆盖率工具（不安装 `@vitest/coverage-*`）。

### 存读档等价判定
- **D-10:** 存读档测试**只做 saveables 层往返，不改动任何接口**。（设计发现：`CoreState` 无公开 `save`/`load`，`saveables` 为 private，`saveSystem.init` 仅在 `loading.once('coreInit')` 时调用，Node 无 IndexedDB；因此不做 CoreState 端到端存档，也不引入 `fake-indexeddb` 等后端。）
- **D-11:** 覆盖 `CoreState` 已注册的 **4 个 saveable**：`@system/hero`、`@system/flags`、`@system/maps`、`@system/enemy`，每种 saveable × **全部压缩档**（`NoCompression` / `LowCompression` / `HighCompression`）。
- **D-12:** 往返形式为**同实例恢复**：对可存档对象调用 `saveState` → 继续修改状态 → `loadState` → 验证状态回到存档点。
- **D-13:** “状态相同”采用**关键字段显式断言**：测试先把关键状态改为已知值，再断言这些字段恢复；**不**比较派生字段、缓存或序列化容器结构，也不做整个 `saveState` 的深度相等。

### 怪物数据验证
- **D-14:** `data-base/src/enemy` 验证**数据模型全量**：`Enemy` 的属性/特殊属性增删改查 + `saveState`/`loadState` + dirty 追踪；`EnemyManager` 的注册表（special/attribute）、模板（prefab by code/id）、复用映射、`compareWith`/比较器逻辑。

### 测试范围要点（用户指定）
- **D-15:** 怪物战斗需确保 `data-system/src/combat` 与 `data-state/src/enemy` 的**内置战斗实现可以正常运行**（伤害计算等）。
- **D-16:** 录像系统验证**录像数组读写**与**录像系统本身**；对照既有契约（`03-REPLAY-CONTRACT.md`、`03-REPLAY-DIAGNOSTICS.md`），首分歧应停止并报告命令索引/码/参数（Phase 3 D-07）。
- **D-17:** 勇士系统验证 `data-base/src/hero` 下**每个子系统**（attribute、equipment、equipStore、follower、items、location、modifier、mover、state 等）能否正确运行。
- **D-18:** 地图系统在现有测试（`eventPath`/`eventView`/`mapLifecycle`）基础上做**更全面覆盖**（含矩阵、点事件、图层、脏标记、resize/crop 等）。
- **D-19:** flag 系统接口较多但逻辑简单，覆盖其公开接口行为。
- **D-20:** `data-common/src/common` 由主要测试自然覆盖；无需单独穷举，但若主要测试未触及则补最小直接单测。

### the agent's Discretion
- 各系统内部具体测哪些函数/边界用例、用例命名与文件切分，由实现者在上述约束下决定；发现接口/设计疑问时按 D-07 立即提问，不自行假设。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目与阶段约束
- `.planning/PROJECT.md` — 项目架构、数据/渲染分离、AI 仅实现与测试的边界
- `.planning/REQUIREMENTS.md` — `TEST-01` 与 Phase 3/Phase 6 边界
- `.planning/ROADMAP.md` — Phase 6 goal、成功标准、依赖顺序；Phase 4/5 相邻范围
- `.planning/STATE.md` — 既有决策、质量门禁、当前仓库状态
- `.planning/phases/03-data-completion/03-CONTEXT.md` — D-02/D-03/D-04/D-17、S-01~S-05 等上游约束
- `.planning/codebase/TESTING.md` — 现有测试框架与模式（Vitest、`logger.catch` 断言、无覆盖率工具）
- `dev.md` — 四层数据架构、Node 独立性、依赖方向、注释与代码规范

### 数据端系统与契约锚点
- `packages-user/data-system/src/combat/` — 战斗系统（combat/context/damage/enemy/mapDamage）
- `packages-user/data-state/src/enemy/` — 顶层战斗实现（calculator/aura/final/mapDamage/special/comparer）
- `packages-user/data-base/src/enemy/` — 怪物数据模型（Enemy/EnemyManager/special）
- `packages-user/data-common/src/replay/` — 录像数组、系统、沙箱、修饰器（`types.ts`/`system.ts`/`sandbox.ts`/`func.ts`/`array.ts`）
- `packages-user/data-base/src/hero/` — 勇士系统各模块
- `packages-user/data-base/src/map/` — 地图系统（gameMap/mapLayer/mapState/tile/eventView）
- `packages-user/data-common/src/save/types.ts` — `ISaveableContent` / `ISaveSystem` 契约
- `packages-user/data-state/src/core.ts` — saveables 注册（`@system/hero`/`flags`/`maps`/`enemy`）
- `packages-user/data-base/src/flag/` — flag 系统
- `packages-user/data-common/src/common/` — 通用接口（face/indexer/mover/utils）
- `.planning/phases/03-data-completion/03-REPLAY-CONTRACT.md` — 录像指令注册与顺序契约
- `.planning/phases/03-data-completion/03-REPLAY-DIAGNOSTICS.md` — 首分歧诊断契约
- `.planning/phases/03-data-completion/03-EVENT-CONTRACT.md` — 事件内建契约（七个内建）
- `packages-user/data-state/test/fixtures/closed-loop.ts` — 现有闭环回放 fixture（按需复用）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 现有 18 个测试文件（`data-common` 3、`data-base` 3、`data-system` 4、`data-state` 8，含 `test/` 下的 Node 验收）—— 数据端 fixture 与全局 stub 的既有模式
- `packages-user/data-state/test/fixtures/closed-loop.ts` — 顶层初始化、固定录像、状态快照（hero + 地图矩阵）
- `logger.catch(fn)`（`packages/common/src/logger.ts`）—— 断言错误/警告路径的既有机制（返回 `{ ret, info }`），避免直接期待抛异常
- `CoreState` 的 saveables 注册点与 `getSaveableContent(id)` —— saveables 往返测试的入口

### Established Patterns
- 依赖方向 `src → packages-user → packages`；数据层 `data-common → data-base → data-system → data-state`
- 数据端 DOM-free，可在 Node 独立运行；`pnpm test:ci` 为固定非 watch 门禁
- 测试文件与源码同级 `*.test.ts`（也允许 `data-state/test/` 聚合目录）
- 玩家属性可在每步断言；最终对比勇士全属性 + 地图矩阵（Phase 3 D-26）

### Integration Points
- `packages-user/data-state/src/core.ts` — 顶层装配、saveables 注册、事件/战斗/录像接线
- `packages-user/data-common/src/replay/system.ts` / `sandbox.ts` — 录像注册与顺序执行/首分歧停止
- `packages-user/data-system/src/combat/` ↔ `packages-user/data-state/src/enemy/` — 战斗接口与顶层实现
- 四个数据包的类型与 barrel 边界 —— 测试经由公开接口驱动，不 mock 数据层接口本身

</code_context>

<specifics>
## Specific Ideas

- 用户把本次明确定义为**数据端单测切片**，并要求「单测 / 修复」严格分两环节：先写测试验证接口能否运行，发现问题只分析、汇报，确认后才修。
- 若对系统内某些设计有疑问，**立刻提问**，不得自行假设或绕过（延续 D-02/D-17）。
- 战斗、寻路、触发器、事件是 Phase 6 成功标准点名的关键行为；本切片聚焦其中的战斗、事件、录像、地图、勇士、存读档。

</specifics>

<deferred>
## Deferred Ideas

- Phase 6 非数据端覆盖（渲染 / legacy 相关）延后到后续阶段。
- 存读档的 CoreState 端到端（需要公开 save/load 入口或可注入后端）未纳入本次；如后续决定引入，需先由用户设计接口。
- Phase 5（Legacy 移植）若改动数据端接口，本阶段测试需同步调整。
- 执行过程中若出现新的接口/设计问题，按 D-07 暂停并向用户提问。

</deferred>

---

*Phase: 6-单元测试*
*Context gathered: 2026-09-14*
