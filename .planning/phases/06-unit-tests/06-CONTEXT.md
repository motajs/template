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

### 战斗系统覆盖深化（仅针对 06-01，`data-system/src/combat`）
> 本节由 2026-09-14 的补充讨论得出，深化 D-15。**范围严格限定在战斗系统本身**；凡属顶层实现（`data-state` 的 `calculator` / `CommonAura` / `GuardAura` / 特殊属性语义 / 支援递归）的内容一律不纳入本讨论，由 Phase 6 其它计划负责。

- **D-21:** 光环集成测试形态：用**测试用 fake `IAuraConverter` / `IAuraView`** 在 `data-system` 内驱动 `EnemyContext` 的光环流水线；**手动装配**（`new EnemyContext()` + `registerAuraConverter` + `setEnemyAt`）；复用 06-01 已建立的 `vi.hoisted` 全局 stub + dynamic-import harness。**不引用、不重测顶层真实实现**，明确切开系统与顶层边界。
- **D-22:** 常规光环覆盖：`Full`（`haloRange<=0`）/ `Rect`（`haloSquare`）/ `Manhattan` 三种范围**全部覆盖**，并断言**光环范围外的怪物不被加成**。
- **D-23:** 嵌套光环覆盖：**一层**（光环施加特殊属性）与**两层**（光环→特殊属性→再经转换器产生新光环→再施加效果）都要覆盖，并含**优先级边界**（新增光环只能影响更低优先级阶段；同/跨优先级传播）。
- **D-24:** 优先级链与 DEV 警告码**全部覆盖**：`97`（重复 converter 匹配）、`98`（删除同级/更高优先级光环）、`99`（新增高优先级光环）、`100`（add 与 delete 同时非空）、`101`（局部刷新期间产生/移除已转换光环）。
- **D-25:** 系统层效果组合覆盖：**光环基础效果 ↔ 常规查询效果**、**光环特殊效果 ↔ 特殊查询效果**、**final-effect 阶段顺序**、**同/跨优先级顺序**四类组合全部纳入；**显式断言四阶段顺序**（`buildupSpecials` → `buildupBase` → `buildupQuery` → `buildupFinal`）与**阶段间可见性**（前阶段修改被后阶段看到，后阶段不能反向影响前阶段）。
- **D-26:** 「属性流水线结果 → 伤害系统」联动：`final-effect` / 光环改完属性后，验证 `DamageContext` 缓存与脏标记随之更新，`getDamageInfo` / `markDirty` / `deleteEnemy` / `with(hero)` 行为正确（注入 fake `IDamageCalculator`）。
- **D-27:** `EnemyContext` 覆盖判据：**每个公开方法至少一个正常用例**；边界按需覆盖**警告码、未知/空输入（返回 null 或 no-op）、`resize`/`clear`/`destroy` 生命周期清空与附件解绑**；**`buildup`（全量）与 `requestRefresh`（局部）两条刷新路径都要覆盖**；上述「全接口覆盖」写入 `must_haves.truths` 作为阶段完成判据。

### 阶段级覆盖规则与计划重构（2026-09-14 第二轮补充讨论）
> 由用户对全部计划的逐条补充得出。**这些规则对 06-03..06-09 全部生效，并回溯要求 06-01/06-02 返工。**

- **D-28:** 计划重排 —— 重排编号为：
  - 06-01 战斗系统（系统层，`data-system/src/combat`，见 D-21..D-27）
  - 06-02 enemy 顶层实现（`data-state/src/enemy`，只做基本功能）
  - 06-03 enemy 数据模型（`data-base/src/enemy`）
  - 06-04 录像（`data-common/src/replay`，**不含存读档**）
  - 06-05 勇士全部（原 06-05 + 06-06 合并，含 `rendering`、`mover` 异步）
  - 06-06 地图全部（原 06-07）
  - 06-07 顶层集成（伤害组合 + 录像完整播放 + 二次录制比对）
  - 06-08 flag + common
  - 06-09 存档（独立系统，所有 saveState/loadState + CoreState 顶层验证）
  原 06-06 合并进 06-05；原 06-08 的 saveables 往返部分移到 06-09。
- **D-29:** 返工 —— 已执行的 06-01、06-02 标记为 **superseded**（SUMMARY 改名保留），重规划后按同号重跑，确保「接口 + warn/error code 全覆盖」落到原计划。
- **D-30:** 接口全覆盖 —— 除名称含 legacy 的接口/方法（`fromLegacy`、`*LegacyBridge`、`*LegacyConverter` 等）外，**每个公开方法至少一条正常用例**。
- **D-31:** warn/error 全覆盖 —— 以 `packages/common/src/logger.json` 为权威码表；范围 = 本计划模块**可达**的 code（排除其他层如渲染/音频，及 legacy 路径）；每个 code 至少一条触发断言（经 `logger.catch`）；产出**阶段级 `06-COVERAGE-MAP.md`**（code → 模块 → 用例）映射表。
- **D-32:** 存读档集中 —— 所有 `saveState`/`loadState` 测试从各计划移出，集中到 06-09。唯一例外：06-07 的录像播放所需状态重置可**最小使用**存档数据，但不测存读档本身。
- **D-33:** 执行节奏 —— **每个计划执行前先向用户确认**；执行完暂停，用中文**分条简要汇报**本计划验证结果；详细结果写入共用的 `06-TEST-FINDINGS.md`。
- **D-43:** 阶段化测试（**应用于全部 06-01..06-09**）—— 先做**构件级**测试（单个类/函数/单个光环/单个 effect 等最小单元），再做**组合/流水线**测试，最后做**完整/集成**测试。**取消 tracer-first**；每阶段跑绿后再进入下一阶段。某阶段发现**阻断性 bug**（导致后续阶段无法运行）时，**暂停并向用户汇报、等确认**（D-05/D-07），不得跳过或弱化为通过。原因：这些系统在本次之前从未被测过，直接端到端很可能整链失败且无法定位，必须先分阶段定位。
- **D-44:** 质量门禁（lint + 类型，**文件级**，应用于全部计划）—— 每个计划执行后、提交前必须：(a) 对改动文件运行 `eslint --fix`，并确保 `eslint <改动文件>` **0 错误**；(b) 对**本计划改动的测试文件**运行 `pnpm exec vue-tsc --noEmit`，并确保其输出中**这些文件路径下 0 类型错误**（按输出文件路径过滤判定；因全局 `pnpm check:type` 已有既有无关错误，故按文件级判定）；(c) `pnpm test:ci` 全绿。任一不通过则**不得提交**。既有无关错误（`client-modules`/`legacy-plugin-data` 等，属 Phase 4/legacy）不在本门禁范围。原因：vitest 用 esbuild 剥类型，类型/格式错误不会让测试失败，故必须显式门禁。
- **D-45:** CoreState 顶层存档入口（D-42 落地，2026-09-14）—— `ICoreState extends IStateSystem, ISaveableContent<ReadonlyMap<string, unknown>>`，`CoreState.saveState(compression)` / `loadState(state, compression)` 为**公开入口**；06-09 顶层验证经此入口进行（`getSaveableContent(id)` 作为辅助逐 id 校验）。saveables **预期 5 个**：`@system/hero` / `@system/flags` / `@system/maps` / `@system/enemy` + **`@system/replay`**（录像存档由用户补注册；执行前 Task 1 门禁确认）。`CoreState.loadState` 新增可达码 **177**（存档缺 saveable key）与 **178**（存档含未加载的 key），纳入 06-09 码覆盖。录像相关新码 **176**（只能加 up/right/down/left 移动步）归 06-07。

### 各计划边界
- **D-35:** 06-02 只测顶层实现**基本功能**（单分支、按预期输出）；属性/加成**组合**后移至 06-07。范围：`MainDamageCalculator` / `MainEnemyFinalEffect` / `MainEnemyComparer` / `CommonAura(+Converter)` / `GuardAura(+Converter)` / `registerSpecials` / mapDamage 五视图 + converter + reducer。
- **D-36:** 06-03 除 legacy 外**全部公开接口**：`Enemy` 全量 / `CommonSerializableSpecial` / `NonePropertySpecial` / `EnemyManager`（注册表、prefab、reuse、modify、comparer dirty）。排除 `IEnemyLegacyBridge`/`fromLegacyEnemy`。可达 code 含 53/96/117/118/119/120。
- **D-37:** 06-04 重点**录像数组**：`ReplayArray` 全部公开操作（`add/insert/delete/set/setCommandWidth/get/createReadStream/rebuildIndexArray/setReplayArray/getCommandArray/getParamArray`，**不含 save/load**）；编解码覆盖 **boolean / 整数（各位宽）/ bigint / string / 数组参数**；`ReplaySystem` 注册/record；`ReplaySandbox` 播放器（`step/play/pause/resume/stop/finalizeLast` + safety 装饰器）。**完整录像播放 → 06-07**。
- **D-38:** 06-05 验证**每个勇士相关文件**：attribute / modifier / location / state / equipment / equipStore / items / follower / mover（异步，真实计时器）/ **rendering**。save/load 移出至 06-09。
- **D-39:** 06-06 **全地图接口**（mapState / gameMap / mapLayer / tile / staticTile / dynamicTile / eventView / mover），**重点**：静态图块、动态图块转换、静态数组设置。save/load 移出至 06-09。
- **D-40:** 06-07 **顶层集成**：① 伤害系统的**属性组合/加成组合**（顶层多特殊属性组合 + 系统层光环/各效果组合，见 D-25/D-26）；② 用**真实 API 构造小地图场景**（合成数据，延续 D-02）+ 一段录像步，验证录像正常播放；③ **二次录制验证**：首次播放完毕后录像系统记录一遍录像步，判定二次录像与原录像**逐条完全相等**（步数与每步 code + 各 param 的 type/value），并再次播放检验。`error 2001–2008`（Replay 执行错误）归属本计划。**执行前必须先向用户确认**（依赖用户先接通录像记录）。
- **D-41:** 06-08 **flag 全接口** + **common 工具**（`utils` / `indexer` / `faceManager` + `face` / `mover`）。save/load 移出至 06-09。
- **D-42:** 06-09 **存档（独立系统）**：所有含 `saveState`/`loadState` 的类逐类往返（同实例）**+ CoreState 顶层完整验证**；仅断言**关键状态字段**，排除存档无关/元数据字段（如最后存档时间、dirty、缓存）——由实现推导**排除清单**并写入计划；压缩档全覆盖。**执行前必须先向用户确认**（依赖用户调整 CoreState 可存档内容并新增公开 save/load 入口，例如录像存档目前未计入但应计入）。

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

### 覆盖与码表锚点（2026-09-14 补充）
- `packages/common/src/logger.json` — warn/error code 权威码表（warn 1–175 + 1001；error 1–65 + 2001–2008）；「code 全覆盖」据此判定
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` — 阶段级 `code → 模块 → 用例` 映射表（规划/执行产出）
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` — 全部计划共用的验证结果与疑似缺陷记录

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
- **边界（2026-09-14 补充）**：06-01 的覆盖深化**只针对战斗系统本身**（`data-system/src/combat`）。顶层实现（`data-state` 的 calculator / CommonAura / GuardAura / 特殊属性语义 / 支援递归）与战斗系统无关，不纳入 06-01。

</specifics>

<deferred>
## Deferred Ideas

- Phase 6 非数据端覆盖（渲染 / legacy 相关）延后到后续阶段。
- 存读档的 CoreState 端到端（需要公开 save/load 入口或可注入后端）未纳入本次；如后续决定引入，需先由用户设计接口。
- Phase 5（Legacy 移植）若改动数据端接口，本阶段测试需同步调整。
- 执行过程中若出现新的接口/设计问题，按 D-07 暂停并向用户提问。
- **顶层实现（`data-state`）的光环转换器语义、特殊属性加成、伤害计算器分支、支援/guard 递归、数据-State 现有测试的改动** —— 均不属 06-01 战斗系统深化范围，由 Phase 6 其它计划负责。

</deferred>

---

*Phase: 6-单元测试*
*Context gathered: 2026-09-14*
