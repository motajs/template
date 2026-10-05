# Roadmap: 魔塔游戏引擎（mota-ts）

## Overview

引擎从旧 mota-js 运行时逐步重构，渲染端已重构完成，数据端接口设计中。本路线图沿「事件系统 → 寻路 → 数据端完成 → 渲染适配 → legacy 移植 → 单元测试」的依赖顺序推进：先补齐剧情事件、自动寻路两大玩法系统，再完成数据端 L0–L3 接口落地，随后把新数据层与已重构渲染端打通并支持双布局，接着清理被新接口覆盖的 legacy，最后以单元测试兜底，使引擎能完整跑通一部魔塔。接口/架构设计由用户主导，AI 负责实现与测试；验证通过后 AI 可自行创建 git commit。

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: 事件系统** - blockly 式低代码事件定义，驱动简单场景事件流程（验证已通过，待完成阶段收尾）
- [ ] **Phase 2: 寻路系统** - 自动寻路与移动端点击地图触发移动
- [x] **Phase 3: 数据端完成** - 数据端 L0–L3 接口全部落地，可在 Node 环境独立跑回放验证 (completed 2026-09-10)
- [ ] **Phase 4: 渲染适配与双布局** - 新数据层 ↔ 已重构渲染端对接，支持移动端与桌面端双布局
- [ ] **Phase 5: Legacy 移植** - 删除被新接口覆盖的旧系统，迁移仍需要的内容
- [ ] **Phase 6: 单元测试** - 为核心系统补齐单元测试

## Phase Details

### Phase 1: 事件系统

**Goal**: 引擎能以 blockly 式低代码定义事件，并驱动简单场景的事件流程
**Depends on**: Nothing (first phase)
**Requirements**: EVT-01, EVT-02, EVT-03
**Success Criteria** (what must be TRUE):

  1. 开发者能通过数据/序列化接口定义事件（blockly 式低代码可序列化为引擎事件数据，编辑器在外部项目）
  2. 引擎能执行踩踏触发事件（角色踩上地板触发对应事件）
  3. 引擎能执行踩踏触发事件驱动的事件执行链路（对话/开门依赖 A2 内建函数清单，延后到收尾工作）
  4. 事件系统保持面向初学者的简单抽象，未引入复杂场景的通用表达能力

**Plans**: 13/13 plans executed
Plans:

- [x] 01-13-PLAN.md

- [x] 01-04-PLAN.md
- [x] 01-05-PLAN.md
- [x] 01-06-PLAN.md
- [x] 01-07-PLAN.md
- [x] 01-08-PLAN.md — GameEventStore add/get/duplicate-warning regression; rawEvent and cycle baselines preserved
- [x] 01-09-PLAN.md — GameMap point-event-only save aggregation; production registration deferred
- [x] 01-10-PLAN.md
- [x] 01-11-PLAN.md — CoreState legacy map initialization selects eventLayer; existing source-aware movement path remains reachable
- [x] 01-12-PLAN.md — Close phase-owned type diagnostics and CRLF/Prettier quality-gate gaps without behavior changes

**Wave 1**

- [x] 01-01-PLAN.md — L0/L1 事件数据契约落地 + 图块/点位事件视图 + 存读档迁移

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — 执行器接口用户确认（checkpoint）+ 执行器实现 + 删除旧 ITrigger（D-13）+ CoreState 装配

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — moverImpl 踩踏触发重写为事件执行 + 阶段验收

**Wave 8** *(blocked on completed event ingestion, dispatch, and persistence gap plans)*

- [x] 01-11-PLAN.md — CoreState legacy map initialization selects eventLayer; existing source-aware dispatch remains reachable

**Wave 9** *(blocked on Wave 8 completion)*

- [x] 01-12-PLAN.md — Phase-owned type and CRLF/Prettier gap closure

### Phase 2: 寻路系统

**Goal**: 引擎支持自动寻路，移动端点击地图即可触发移动
**Depends on**: Phase 1
**Requirements**: PATH-01, PATH-02
**Success Criteria** (what must be TRUE):

  1. 角色能在地图上自动寻路移动到指定格
  2. 移动端点击地图上的可达格时，角色自动寻路移动到该格
  3. 寻路正确避开不可通行格（碰撞/障碍/墙体）

**Plans**: 5/5 plans executed

**Scope correction (2026-09-10):** 用户审查确认本阶段不交付未授权的 `HeroPathfinding` L3 勇士封装；当前阶段保留 L2 寻路核心、共享通行性谓词与 DataCommon 方向映射依赖，勇士或渲染侧接线不作为本阶段实现内容。
**UI hint**: yes
Plans:

- [x] 02-01-PLAN.md — 接口草案 + mover.ts:651 缺陷调查 + 回归脚手架 + D-07 用户拍板关卡（checkpoint）
- [x] 02-02-PLAN.md — L0 坐标回写缺陷修复 + L2 寻路核心（有向图 + 最小损失 + 仅取路径 + 回退策略槽位）
- [x] 02-03-PLAN.md — L3 接线（逐步/瞬移/回退默认策略/D-08 双语义/打断接管）+ barrel/logger 装配 + 阶段门禁

- [x] 02-04-PLAN.md — 恢复用户授权的 path/types.ts 契约并收口 moverImpl TS18047
- [x] 02-05-PLAN.md — 稳定全量 Vitest 门禁并提供非 watch 测试命令

**Wave 1**

- [x] 02-01-PLAN.md — 接口草案与拍板关卡（autonomous: false）

**Wave 2** *(blocked on Wave 1 用户拍板)*

- [x] 02-02-PLAN.md — L0 修复 + L2 寻路核心

**Wave 3** *(blocked on Wave 2)*

- [x] 02-03-PLAN.md — L3 接线与阶段门禁

### Wave 4 *(gap closure; blocked on Wave 3 completion)*

- [x] 02-04-PLAN.md — 用户契约范围与阶段类型错误收口
- [x] 02-05-PLAN.md — 全套件超时与跳过测试门禁收口

### Phase 3: 数据端完成

**Goal**: 数据端 L0–L3 接口实现完成，数据层各系统可用并可在 Node 环境独立运行回放验证
**Depends on**: Phase 2
**Requirements**: DATA-01
**Success Criteria** (what must be TRUE):

  1. 用户设计的 L0–L3 数据层接口全部落地，地图/角色/敌人/flag/战斗/触发器/存档/回放各系统可用
  2. 数据端可在 Node 环境独立运行回放验证，无 DOM 依赖
  3. 数据端与渲染端保持双端分离，渲染相关代码经 `r()`/`rf()` 门控或走 hook，渲染端不向数据端推送更新
  4. 接口设计由用户主导，AI 仅负责实现

**Plans**: 19/19 plans executed
Plans:

- [x] 03-17-PLAN.md
- [x] 03-18-PLAN.md
- [x] 03-19-PLAN.md

- [x] 03-10-PLAN.md
- [x] 03-11-PLAN.md
- [x] 03-12-PLAN.md
- [x] 03-13-PLAN.md
- [x] 03-14-PLAN.md
- [x] 03-15-PLAN.md
- [x] 03-16-PLAN.md

- [x] 03-07-PLAN.md
- [x] 03-08-PLAN.md
- [x] 03-09-PLAN.md

- [x] 03-01-PLAN.md — Node-safe CoreState、内部 legacy 依赖边界与最小 replay tracer
- [x] 03-02-PLAN.md — 八个事件内建函数契约 checkpoint 与最小注册实现
- [x] 03-03-PLAN.md — 稳定 replay enum、异步 command 与 top-level 注册
- [x] 03-04-PLAN.md — 固定 Node 回放 fixture、首分歧 thrown diagnostic 与最终快照
- [x] 03-05-PLAN.md — DATA-01 focused closure 与四包 type/circular 最终门禁
- [x] 03-06-PLAN.md — Tile events contract 与 legacy conversion 收口

**Wave 1**

- [x] 03-01-PLAN.md — Node-safe CoreState、内部 legacy 依赖边界与最小 replay tracer

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — 八个事件内建函数契约 checkpoint 与最小注册实现
- [x] 03-06-PLAN.md — Tile events contract 与 legacy conversion 收口

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — 稳定 replay enum、异步 command 与 top-level 注册

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 03-04-PLAN.md — 固定 Node 回放 fixture、首分歧 thrown diagnostic 与最终快照

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 03-05-PLAN.md — DATA-01 focused closure 与四包 type/circular 最终门禁

### Phase 4: 渲染适配与双布局

**Goal**: 渲染端通过新数据层接口驱动，并同时支持移动端与桌面端布局
**Depends on**: Phase 3
**Requirements**: REND-01, REND-02
**Success Criteria** (what must be TRUE):

  1. 用新数据层接口加载一张地图后，已重构的渲染端能正确渲染该地图场景
  2. 桌面端布局下，地图、角色、界面元素正常显示并可操作
  3. 移动端（窄屏）布局下，同一场景正常显示且可操作
  4. 数据端与渲染端保持双端分离——数据端无 DOM，仍可在 Node 环境跑回放验证

**Plans**: 15 已执行 + 1 已规划待执行（04-16） — 04-01..04-07 已执行（04-06 = material 接口影响范围清点·只读；04-07 = material 接口适应实施·第二步）；04-08（TextureManager 新接口影响范围清点·只读，D-38/D-39/D-40/D-41/D-42 第一步）已执行；04-09（TextureManager 新接口适应实施·第二步·代码改动，D-43..D-50）已执行；04-10（渲染端结构性重构影响范围清点·只读，D-51..D-57 第一步）已执行；04-11（渲染端结构性重构·第二步·移植实施·代码改动，D-58..D-68）已执行；04-12（04-11 落地修正·桶导出边界 + 消费者直连 + shared 单文件·代码改动，D-69/D-70）已执行（异地执行，commit 81e4e98；`8b114c7 docs(04-12): sync tracking`）；**04-13（部分 UI 的进一步接口适配·第一步·只读收集，D-71/D-72/D-73）已执行**（交付 `04-UI-ADAPTATION-IMPACT.md`；A7/B5/C2/D5/E4/F5 + 8 行修改点汇总）；**04-14（部分 UI 的进一步接口适配·第二步·适配实施，D-74..D-78）已执行**；**04-15（渲染端去单例化·第一步·只读收集，用户 2026-10-01 裁定）已执行**（交付 `04-RENDER-SINGLETON-AUDIT.md`，commit 6cff487）；**04-16（渲染端去单例化·第二步·挂载 + 接口继承重构，用户 2026-10-01 裁定，F-01..F-07 已裁定）已规划待执行**（执行前须 Task 0 汇报关卡等待用户「可以执行」）；渲染适配与移动端/桌面端双布局（REND-01/REND-02）整体仍未完成
**Plan register note (2026-09-21):** 第五个增量 `04-05`（收口 `#04-01-M-06` / `#04-01-M-09`：状态栏 9 个数值属性改经 `client.hero.attribute.getFinalAttribute(...)` 读取 + 逐图层钩子类 `RendererLayerHook`，2026-09-20 执行）此前未登记进本路线图，本次一并补登；第六个增量 `04-06` = material 接口适应（D-30/D-31/D-32）**第一步·只读影响清点**，产出 `04-MATERIAL-INTERFACE-IMPACT.md`，第二步（实施）待用户审阅后另行规划。第七个增量 `04-07` = material 接口适应实施（**第二步·代码改动**，D-33..D-37），2026-09-22 已执行（10 文件原子提交）。**第八个增量 `04-08` = TextureManager 新接口适应（D-38..D-42）第一步·只读影响清点**，产出 `04-TEXTURE-INTERFACE-IMPACT.md`；第二步（实施）待用户审阅后另行规划。
**Plan register note (2026-09-24):** 第十个增量 `04-10` = 渲染端结构性重构（用户裁定 2026-09-23 · D-51..D-57）**第一步·只读影响清点**：把 `packages-user/client-modules/src/render/` 下的通用内容（`render/components`、`render/elements`、`render/map` 三文件夹 + `render/utils/layout.ts`，规划日实测 **39** 文件）迁往渲染系统层 `packages-user/client-base/src/`（D-51/D-52；目标布局按 D-53：`client-base/src/{components,elements,map}/` + `client-base/src/layout/`，**不新建 `render/` 目录**）；不移植 `render/utils/` 其余（`index.ts`/`saves.ts`/`use.ts`）与 `ui`/`fx`/`weather`/`render` 顶层文件（D-54）；legacy 一律只报告（D-55）；用户并发改动零触碰（D-56）。台账按 A 被移集合内部交叉引用 / B 外部导入点（含 `entry-client` / `entry-data` / `packages/legacy-ui` 经 `@user/client-modules` 公共面的间接依赖）/ C barrel 与导出面 / D 分层与循环依赖风险（`client-base` 不得反向依赖 `client-modules`，含 `package.json` 依赖现状）/ E legacy 命中（仅报告）/ F 未确定 六类分组，每行精确到文件或符号 + `file:line` 且 ≥2 锚点；产出 `04-STRUCTURE-MIGRATION-IMPACT.md`，生产代码零改动且**零命名变更**；**已规划待执行**，执行前须 Task 0 汇报关卡等待用户「可以执行」；第二步（移植实施）待用户审阅后另行规划；`REND-01` / `REND-02` 仍 Pending。
**Plan register note (2026-09-24 · 04-11 第二步):** 第十一个增量 `04-11` = 渲染端结构性重构**第二步·移植实施（代码改动）**（用户裁定 2026-09-24 · D-58..D-68）。**移植按 MOVE 落地**：把 D-52 的 **39** 文件（`render/components` 13 / `render/elements` 5 / `render/map` 20 / `render/utils/layout.ts` 1）按 D-53 放进 `packages-user/client-base/src/{components,elements,map}/` 与 `client-base/src/layout/layout.ts`（并新增 `layout/index.ts`，D-61），**并删除 `client-modules/src/render/` 下的原件**；D-58 另新建 `client-base/src/shared/`（从 `client-modules/src/shared.ts` 摘取被移 `map` 文件所需的 10 个常量，原文件保留）；D-63 `client-base/src/index.ts` 新增 `./components` / `./elements` / `./map` / `./layout` / `./shared` 五条桶导出，实现层消费者（`render/ui` 8 文件 11 处含 `toolbar.tsx` 两处深层导入、`fallback/ui.ts:2`、`render/index.tsx:5,45,46`、`client.ts:25`、`types.ts:2`）改指 `@user/client-base`；被移 `map` 文件的 shared 说明符改指 4 处（D-58）；D-59 / D-68 的架构耦合（`render/renderer` 3 处 + `render/use.ts` 5 处）与 D-60 的 `render/utils/` 断链（`index.ts:1` / `saves.ts:2`）共 **10** 处以带原因的 `// @ts-expect-error` 暂记，**不反向引用、不解耦**；D-66 `client-base/package.json` 新增 5 条 `workspace:*` 依赖（`@motajs/animate` / `@motajs/common` / `@motajs/render-vue` / `@motajs/system` / `@user/data-common`）并执行 `pnpm i`；D-64 `?raw` 不处理、D-65 legacy 一律不管、D-62 命名一律不变；门禁 = 目标落位 / 移动已发生 / 桶导出 / 依赖与 lockfile / 消费者改指 / 反向引用零命中 / `@ts-expect-error` 落点（10 处新增 + 既有 7 条保留）/ 39 文件允许差异 / 实现层差异 / 范围与用户改动 / 无 `import type` / CRLF 共 12 道 + 计划文件范围门禁 + 人工复核（**D-68 明示不要求可运行、不要求零类型错误，故不设 `check:type` / `build` / TS 诊断数类门禁**）；`autonomous: false`（Task 0 汇报关卡）；第二步的后续余留（自包引用未验证 / 两行同源星导出 / 8 处反向耦合接线 / D-60 断链）由用户接手；`REND-01` / `REND-02` 仍 Pending。
**Plan register note (2026-09-24 · 04-12 落地修正):** 第十二个增量 `04-12` = **04-11 落地修正·桶导出边界 + 消费者直连 + `shared` 单文件（代码改动）**（用户裁定 2026-09-24 · **D-69 / D-70**）。**D-69（桶导出边界原则，硬约束）**：一个 barrel（`index.ts` / `index.tsx`）**只允许 `export * from './<同目录下的文件或子文件夹>'`**、不得导出本文件夹之外的任何内容；反过来，任何需要被移内容的**消费端必须直接 `import ... from '@user/client-base'`**、**不得经任何 barrel 转发导出**。**D-70 的 6 条修正**：① `client-modules/src/render/utils/index.ts` **删除**指向 `./layout` 的越界转发 `export *` 及其 `@ts-expect-error`（保留 `./saves` / `./use`）；② `render/ui/save.tsx` **拆分** `../utils` 导入（`adjustGrid` / `IGridLayoutData` → `@user/client-base`，`getSave` / `SaveData` 仍留 `../utils`）、`render/ui/title.tsx` 的 `adjustCover` → `@user/client-base`；③ `render/utils/saves.ts` 的 `getConfirm` / `waitbox` → `@user/client-base` 并**删除**其 `@ts-expect-error`；④ `client-base/src/shared/{shared.ts,index.ts}` **折成单文件** `client-base/src/shared.ts` 并删除 `shared/` 目录（`client-base/src/index.ts` 的 `export * from './shared'` 与 `map/*` 的 `'../shared'` / `'../../shared'` 说明符**不受影响**，无需改动）；⑤ **逐字保留** `client-base/src/{components/{choices,input,misc,scroll,textboxTyper,tip}.tsx,elements/index.ts}` 内 **8** 处引用 `render/use.ts` / `render/renderer` 的架构耦合 `@ts-expect-error`（属 D-59 / D-67，留待用户收尾；`textboxTyper.ts` 另有 1 处既有 `无法推导` 标注同属保留，故这 7 文件合计 9 处）；⑥ **不得**新增任何转发导出，`client-modules/src/render/index.tsx` **维持现状**（用户已删除越界两行，现合规）。旁注（仅报告）：`packages/client/src/index.ts:1` 的 `export * from '@motajs/client-base'` 亦违反 D-69，但在 `packages/`（D-33 只报告）。改动面 = `client-base/src/shared.ts` + `client-modules/src/render/{utils/index.ts,utils/saves.ts,ui/save.tsx,ui/title.tsx}` 五个生产文件 + `files_deleted` 的 `client-base/src/shared/{shared.ts,index.ts}`；门禁 = 桶边界（8 个 in-scope barrel 的 `export * from` 全为 `./` 前缀 + `render/utils/index.ts` 不再转发 `./layout`）/ F1..F4 收口自检 / F5 的 8 处标注逐字保留 + porcelain 零命中 / 范围与用户改动 / CRLF + 人工复核（**不设 `check:type` / `build` / TS 诊断数类门禁**，D-68 的延续）；`autonomous: false`（Task 0 汇报关卡等待用户「可以执行」）；无依赖变更、不执行 `pnpm i`；本步不引入任何新命名；`REND-01` / `REND-02` 仍 Pending。
**Plan register note (2026-09-30 · 04-13 第一步):** 第十三个增量 `04-13` = **部分 UI 的进一步接口适配·第一步·只读收集需要修改的点（只读）**（用户裁定 2026-09-25 · **D-71 / D-72 / D-73**）。**要解决的问题**：数据端经 `d8fa4b8 refactor: Delete global loading & hook object` 与加载系统重构后，渲染端部分 UI 仍以旧接口编写——① 全局 `loading` / `hook` 对象已删除，组件不得再依赖它们监听全局钩子、**必须在对应对象上监听**（残留：`render/ui/main.tsx:146-151` 的 `hook.on('statusBarUpdate', ...)`、`render/index.tsx:35-38` 的 `hook.on('restart', ...)`，及 `main.tsx:140-143` 的手工单次调用）；② 加载系统重构，旧加载 UI（`render/ui/load.tsx` 的 `LoadScene` / `LoadSceneUI`）已不能用，仍调用 `loader.initSystemLoadTask()` / `loader.load()` / `loader.progress`（`:71,72,76-79,91-92,118-119,139`），须重新适配新加载系统（`@motajs/loader` 的 `LoadManager` + `packages-user/data-state/src/loader/**` 的 `MotaDataLoader` / `IMotaDataLoader`）。**D-72**：本目标至少两个计划——第一个只读收集（生产代码零改动），第二个及后续才执行；第一个计划的产出是后续执行计划的输入。**D-73**：沿用 D-33 / D-42 / D-48 / D-49 / D-55 / D-65 / D-56 / D-68，**D-69 桶导出边界继续适用**。**交付物** = `.planning/phases/04-render-adaptation/04-UI-ADAPTATION-IMPACT.md`（只读影响台账）：元信息块 + `只读起始基线` / `背景` / `方法` / `基准变更（d8fa4b8）` / A 全局 loading / hook 使用点（UI 面）/ B 目标对象与钩子 API 证据 / C 旧加载 UI 清单与新加载系统 / D 分层与 barrel（D-69）检查 / E legacy 命中（仅报告）/ F 未能从阅读确定（未猜测）/ 修改点汇总（供后续执行计划消费）/ 处置；A–E 固定列序表 `| ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信 |`，事实行每行 ≥2 个 `file:line` 锚点、证据行带 `[证据行]` 标记；每个 A 点给出「应改监听 / 使用的对象」+ 现行源码证据，或显式 undetermined（进 F 类）。**边界**：被查 = 渲染端部分 UI（`client-modules/src/render/ui/**` + `render/index.tsx`）；`client.ts` / `client-modules/src/index.ts` / `entry-client/src/create.ts` 的 `loading` / `hook` 使用点**只报告**（非 UI，是否纳入由用户裁定）；`packages/` 与 `src/` 仅报告（D-33）。**门禁**：只读基线逐条一致 + 台账结构 / 内容 / 证据纪律（≥2 锚点）+ 范围与用户改动 + 既有 `04-01`..`04-12` 产物保护 + CRLF + 人工复核（**不设 `check:type` / `build` / TS 诊断数类门禁**，D-68 的延续）；`autonomous: false`（Task 0 汇报关卡等待用户「可以执行」）；**本步为只读、不引入任何命名变更**；`REND-01` / `REND-02` 仍 Pending。
**Plan register note (2026-09-30 · 04-14 第二步):** 第十四个增量 `04-14` = **部分 UI 的进一步接口适配·第二步·适配实施（代码改动）**（用户裁定 2026-09-30 · **D-74 / D-75 / D-76 / D-77 / D-78**）。**要解决的问题**：`04-13` 只读台账确认，数据端 `d8fa4b8 refactor: Delete global loading & hook object` 与加载系统重构后，渲染端部分 UI 仍以已删全局 `loading` / `hook` 与旧加载接口编写。**D-74..D-78 逐条落地**：① **D-78（tracer）** `render/ui/main.tsx` 删除全局 `hook` 状态栏监听残留（`:145-152`）与手工单次调用垫片（`:140-143`），改为在**勇士属性对象** `client.hero.attribute` 上 `addHook({ onUpdateAttribute })` 并在 `onUnmounted` 注销（接口 `packages-user/data-base/src/hero/types.ts:95-106`；触发点 `packages-user/data-base/src/hero/attribute.ts:89`），新增局部常量 `attributeHook`；② **D-74 / D-75** `render/ui/load.tsx` 以 `client.loader.start()`（`AsyncIterable`）取代旧「系统加载任务初始化 + 加载 + `progress` 迭代」三件套，进度 / 字节 / 任务读数一律取自 `client.loader.manager`（`ILoadManager`）的 `getLoadedTasks` / `getAddedTasks` / `getTotalByte` / `getLoadedByte` / `getByteRatio`，并移除 `:75` 失效 `@ts-expect-error`；③ **D-76** 删除 `render/index.tsx:35-38` 被注释 `restart` 监听块；④ **D-77** 删除 `client.ts:88-92,124-127` 两段被注释兼容层（含「兼容层」标签）与 `entry-client/src/create.ts:16,31,34-41` 被注释接线及模块创建函数块（`client-modules/src/index.ts` 经 `git grep` 实证**零残留、不编辑**）。**沿用约束** D-33 / D-42 / D-48 / D-49 / D-55 / D-56 / D-65 / D-68 / **D-69（本步零新增转发、不改任何 barrel）**。**开点（未裁定、默认不处置）**：旧加载 UI 的装配 / 可达性 —— `createGameRenderer`（`render/index.tsx:13`）无调用者、`LoadSceneUI` 仅在 `:25` 被 `sceneController.open`，本计划默认**不重新接线**，须用户另行裁定。**命名**：仅新增局部常量 `attributeHook`（Task 0 获批）；不新增 / 改名任何公共 / 受保护 / 私有成员。**门禁**：编辑集最终形状 + 残留清零 + 范围（`material/` / `packages/` / `src/` / 数据端 / `packages/common` 零改动）+ 用户改动保留（`packages/common/src/{hook.ts,types.ts}` 与 `04-CONTEXT.md`，D-56）+ 白名单提交 + 既有 `04-01`..`04-13` 产物保护 + CRLF + 人工复核（**不设 `check:type` / `build` / TS 诊断数类门禁**，D-68 的延续）；`autonomous: false`（Task 0 汇报关卡等待用户「可以执行」）；无依赖变更、不执行 `pnpm i`；`REND-01` / `REND-02` 仍 Pending。
**Plan register note (2026-10-01 · 04-15 第一步):** 第十五个增量 `04-15` = **渲染端去单例化·第一步·只读收集（只读，用户 2026-10-01 裁定）**。**用户裁定**：渲染端（`packages-user/client-modules` 与 `packages-user/client-base`）**不得再保留单例**；现行一切单例须改为**挂载在主类上**（`ClientCore` / `client`），且各子系统须**继承 / 实现 `IClientBaseExtended`（`client-base/src/types.ts:27`）或 `ICoreStateExtended`（`data-state/src/types.ts:45`）**，镜像数据端模式（数据端单例 `data-state/src/ins.ts:11`；既有先例 `client-base/src/material/types.ts:94,218,406,439`）。**两步走**：第一步（本计划）= 只读清点全部单例（枚举 / 分类 / 消费者 / 目标映射；生产代码零改动、不引入任何命名变更）；第二步（后续 04-16）= 挂载 + 接口继承重构。**交付物** = `04-RENDER-SINGLETON-AUDIT.md`（元信息块 + `只读起始基线` / `背景` / `方法` / `枚举口径` / A 模块级实例化对象 / B 可变模块级状态与全局注册表 / C 全局访问器与框架级全局引用 / D 顶层副作用模块 / E 主类关系与目标挂载面映射 / F 未能从阅读确定（未猜测）/ 单例→目标映射汇总 / 处置；事实行每行 ≥2 个 `file:line` 锚点，证据行 `[证据行]` 标记）。**沿用约束** D-33 / D-42 / D-48 / D-49 / D-55 / D-56 / D-65 / D-68 / D-69。**门禁** = 只读基线一致（含用户未提交 `data-system/src/combat/context.ts` 的正面对照 + 哈希）+ 台账结构 / 内容 / 证据纪律 + 范围与用户改动 + 既有 `04-01`..`04-14` 产物保护 + CRLF + 人工复核（**不设 `check:type` / `build` / TS 诊断数类门禁**，D-68 的延续）；`autonomous: false`（Task 0 汇报关卡等待用户「可以执行」）；**本步为只读、不引入任何命名变更**；`REND-01` / `REND-02` 仍 Pending。

**Plan register note (2026-09-23):** 第九个增量 `04-09` = TextureManager 新接口适应**第二步（实施·代码改动）**（用户裁定 D-43..D-50：`renderWithoutCheck` 三处调用点改新 `render(tile, connection)`；`BlockCls` / `cls` 判定改为 `tileType === TileType.Autotile`、不做映射表；`extension/hero.ts` 勇士字面量填 `tileType: TileType.Unknown`；`MapRenderer` 不再自建 `AutotileProcessor` 而取 `manager.autotile`、保留 `readonly autotile` 字段与 `IMapRenderer` 签名；不改 `material/**` 与加载面；不考虑 legacy 兼容）。对象 = `packages-user/client-modules/src/render/map/{vertex.ts,renderer.ts,extension/hero.ts}` 的 **13 条** texture 归属 TS 诊断（vertex 6 / renderer 5 / hero 2），目标归零；`moving.ts` 与 `render/map/types.ts` 经核实无需改动。**已规划待执行**，执行前须 Task 0 汇报关卡等待用户「可以执行」；`REND-01` / `REND-02` 仍 Pending（本步仅为 REND-01 的 texture 子切片）。

Plans:
**Wave 1**

- [x] 04-01-PLAN.md — 渲染端 ↔ 数据端接口对账（只读清点，产出 `04-RENDER-INTERFACE-AUDIT.md`；按 ① 错配 / ② 数据端缺失 / ③ 多余旧路径 三类登记）

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — 勇士移动接口探索（只读，D-17）：产出 `04-HERO-MOVER-INTERFACE.md`（数据端现行接口 / 渲染端现状 / 逐成员三态对账 / 缺失接口候选 / 未确定 / 处置；排除 `HeroRendering`（D-18）与 `core.*`（D-12）；不改任何代码，适配（04-03+）未规划）

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03-PLAN.md — 勇士本体适配（渲染端被动重接）：`render/map/extension/{hero,types,manager}.ts` 绑定 `IHeroLocation` / `IHeroMover`，改接现有钩子 `IHeroLocationHooks` / `IObjectMoverHooks`（D-21），按 D-20 裁剪 `IMapHeroRenderer` 的外部驱动成员；排除贴图/不透明度（D-18）、跟随者（D-22）、移动控制（D-19）、`core.*`（D-12）与裸函数（D-11），不新增数据端接口

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 04-04-PLAN.md — 勇士渲染修正（04-03 人工审查反馈 D-24..D-29）：`render/map/extension/{hero,types,manager}.ts` 注入 `IFaceManager`（`faceManager`；`degrade`/`next` 走 `Dir4FaceHandler`、`movement` 走勇士 `mover.faceHandler`（Dir8）——D-24/D-29）并替换三个弃用 helper；`IMapExtensionManager.addHero(state, layer, faceManager)` 新增参数（D-29，改 `types.ts` 接口签名）；拆分 `MapHeroLocationHook` / `MapHeroMoverHook` 且 `onSetPos` 无条件（D-25）、补 `AnimDir`（D-26）、改 `@motajs/animate` 的 `ExcitationCurve2D`（D-27）、保留存量 `state` 用法（D-28）；不新增数据端接口，排除 D-18/D-19/D-22

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 04-05-PLAN.md — 收口 `#04-01-M-06` / `#04-01-M-09`：状态栏 9 个数值属性从失效的 `getHeroStatusOn` 改经 `client.hero.attribute.getFinalAttribute(...)` 读取（并移除 `main.tsx:28` 失效的 `@ts-expect-error`）；新增模块内不导出类 `RendererLayerHook`（`Partial<IMapLayerHooks>`）把逐图层 `onUpdateArea` / `onUpdateBlock` 转发到 `MapRenderer.updateLayerArea` / `updateLayerBlock`，并在 `setLayerState` / `updateLayerList` 两条路径注册与注销（M-06 使用 `client` 单例经用户裁定为 D-23 的显式例外）— **2026-09-20 已执行**（本次补登）
- [x] 04-06-PLAN.md — material 接口影响范围清点（**只读**，D-30/D-31/D-32 第一步）：以 `4e305e3` 后的 `client-base/src/{types.ts,material/types.ts}` 为基准，清点 `packages-user` 内对已移除 7 符号（`IBigImageReturn` / `isBigImage` / `getBigImage` / `getIfBigImage` / `getBigImageByAlias` / `setBigImage` / `bigImageStore`）、3 个改名接口、新增 `textures` 与 4 处 `ICoreStateExtended` 约束未实现、以及所有 big-image 残留（含 `material/manager.ts` 与 `render/elements/cache.ts`）的引用，按 A 已移除 / B 改名 / C 约束未实现 / D big-image 残留 / E 范围外命中（`src/`、`packages/` 仅报告）/ F 未确定 六类分组，每行精确到符号 + `file:line`；产出 `04-MATERIAL-INTERFACE-IMPACT.md`，生产代码零改动，第二步实施待用户审阅后另行规划

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 04-07-PLAN.md — material 接口适应实施（**第二步·代码改动**，D-30/D-31/D-32 第二步 + D-33..D-37）：按 04-06 清点的 A/C/D/E 四类落地——A 类（D-34）删除全部 big-image 引用并把 `getIfBigImage` 的 7 处消费者（`door.ts` 2 / `hero.ts` 3 / `renderer.ts` 1 / `vertex.ts` 1）改为行为等价的 `getTile`、删除 `renderer.ts` `getOffsetPool` 的 big-image 偏移收集；C 类（D-35）为 `MaterialManager` 补 `textures`、为 `MaterialManager` / `AutotileProcessor` / `AssetBuilder` / `TrackedAssetData` 补构造器注入的 `state`（不取全局单例，D-23；`renderer.ts` 从 `manager.state` 取值）；D 类（D-36）删除 `MaterialManager` 的 big-image 实现残留（`bigImageStore` / `bigImageData` / `bigImageId` / 五个方法 / `setDefaultFrame` 耦合）与 `render/elements/cache.ts` 的 legacy big-image 路径；E 类（D-37）为 `client-base/package.json` 补 `@user/data-state` 声明（不安装、不同步 lockfile）。10 个文件原子提交；门禁 = material 归属诊断归零 + 在范围文件零诊断 + 总行数不增加（规划日 199 / 19 → ≤ 180）+ `packages-user` 内 big-image 记号归零 + eslint / CRLF / 范围（基线感知）/ 并发基线；运行时 UAT 不可得（渲染端无测试设施）如实声明

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 04-08-PLAN.md — TextureManager 新接口影响范围清点（**只读**，D-38/D-39/D-40/D-41/D-42 第一步）：以 `d36ea69`（`refactor: 贴图存储方式`）后的 `client-base/src/{types.ts,material/types.ts,material/manager.ts,material/autotile.ts,material/index.ts}` 为基准，清点 `packages-user` 消费者面对改名（`MaterialManager`→`TextureManager` 与构造器）、移除（`BlockCls` 枚举 / `IMaterialFramedData.cls`→`tileType` / `IAutotileProcessor` 三方法合一 / `renderAnimatedWith`→`renderAnimated` / `getIdentifierByAlias` / `getAliasByIdentifier` / `getBlockCls(ByAlias)` / `IClientBase.autotile` / `create()` 与 `createMaterial()`）与新增收紧（`tiles` / `autotile` / `tilesetReserve` / `tilesetUnit` / `getFrameCount` / 四个 `add*` 参数 / `flatten` / `AutotileType` / `IClientCoreConfig` 两个必填字段）的引用，按 A 符号改名与移除 / B 成员与签名变化 / C 地图渲染消费者定位索引 / D 被删且无替代（需用户反馈）/ E 加载相关与添加素材（仅报告，D-39/D-41）/ F 未确定 六类分组，每行精确到符号 + `file:line` 且 ≥2 锚点；产出 `04-TEXTURE-INTERFACE-IMPACT.md`，生产代码零改动（`material/` 按 D-42 只登记），第二步实施待用户审阅后另行规划

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 04-09-PLAN.md — TextureManager 新接口适应实施（**第二步·代码改动**，D-43..D-50）：`renderWithoutCheck` 的三处调用点（`render/map/vertex.ts:461`、`render/map/vertex.ts:874`、`render/map/renderer.ts:1253`）改新 `render(tile, connection)` 且不保留跳过检查入口（D-43）；自动元件判定与解构（`render/map/renderer.ts:1252` / `:1263`、`render/map/vertex.ts:517` / `:561` / `:872` 与 `:852`）改 `tileType === TileType.Autotile`，不做映射表、不用 `AutotileType` 分类（D-44）；`render/map/extension/hero.ts:167` 填 `tileType: TileType.Unknown`（D-45，D-18 不排除该文件）；`MapRenderer` 保留 `readonly autotile: IAutotileProcessor` 字段与 `IMapRenderer` 签名、构造器改取 `manager.autotile`、不再自建 `AutotileProcessor`（D-46）；只做接口适应不重设计 `textures` / `tileStore` / `tiles`（D-47）、`material/**` 零改动（D-48）、不考虑 legacy 兼容（D-49）、`IBlockIdentifier` 零出现（D-50）；`moving.ts` 与 `render/map/types.ts` 无需改动；门禁 = 三文件 texture 归属诊断 13→0 + eslint / prettier / CRLF / 符号零命中 / 基线与禁用路径；`autonomous: false`（Task 0 汇报关卡）；`REND-01` / `REND-02` 仍 Pending

**Wave 9** *(blocked on Wave 8 completion)*

- [x] 04-10-PLAN.md — 渲染端结构性重构影响范围清点（**只读**，D-51..D-57 第一步）：把 `packages-user/client-modules/src/render/` 的通用内容（`render/components`、`render/elements`、`render/map` 三文件夹 + `render/utils/layout.ts`，规划日实测 **39** 文件）迁往渲染系统层 `packages-user/client-base/src/`（D-51/D-52），目标布局按 D-53（`client-base/src/{components,elements,map}/` + `client-base/src/layout/`，不新建 `render/`）；不移植 `render/utils/` 其余（`index.ts`/`saves.ts`/`use.ts`）与 `ui`/`fx`/`weather`/`render` 顶层文件（D-54）；legacy 只报告（D-55）、用户并发改动零触碰（D-56）。台账按 A 被移集合内部交叉引用（8 方向：`components→elements`、`elements→map`、→ `render/renderer`、→ `render/use.ts`、→ `client-modules/src/shared.ts`、→ `@user/client-base` 自包引用、`map/extension/*→map/types`、零命中机器证据）/ B 外部导入点（`client-modules/src/{client.ts,types.ts}`、`render/index.tsx`、`render/ui` 8 文件 11 处含深层导入、`render/utils/{saves.ts,index.ts}`、`fallback/ui.ts`，以及 `entry-client` / `entry-data` / `packages/legacy-ui` 经公共面的间接依赖）/ C barrel 与导出面（7 节点 + 断链判定）/ D 分层与循环依赖风险（`client-base` 不得反向依赖 `client-modules`；`client-base/package.json` 依赖缺口；`?raw` shader；`dev.md` 规则对照）/ E legacy 命中（仅报告）/ F 未确定 六类分组，每行 ≥2 个 `file:line` 锚点；产出 `04-STRUCTURE-MIGRATION-IMPACT.md`，生产代码零改动且零命名变更；门禁 = 只读基线逐条一致 + 10 节结构 / 39 文件清单 / 类别行数与双锚点 / 两处零命中机器证据 / CRLF / 既有产物保护与计划范围 + 人工复核；`autonomous: false`（Task 0 汇报关卡）；第二步（移植实施）待用户审阅后另行规划；`REND-01` / `REND-02` 仍 Pending

**Wave 10** *(blocked on Wave 9 completion)*

- [x] 04-11-PLAN.md — 渲染端结构性重构·**第二步·移植实施（代码改动）**（D-58..D-68）：把 D-52 的 **39** 文件（`render/components` 13 / `render/elements` 5 / `render/map` 20 / `render/utils/layout.ts` 1）按 D-53 放进 `packages-user/client-base/src/{components,elements,map}/` 与 `client-base/src/layout/layout.ts`（新增 `layout/index.ts`，D-61）并**删除 `client-modules/src/render/` 下的原件**（MOVE）；D-58 新建 `client-base/src/shared/`（摘取被移 `map` 文件所需的 10 个常量，`client-modules/src/shared.ts` 保留）并把被移 `map` 文件的 shared 说明符改指 4 处（`'../shared'` × 3 / `'../../shared'` × 1）；D-63 `client-base/src/index.ts` 新增 `./components` / `./elements` / `./map` / `./layout` / `./shared` 五条桶导出，实现层消费者（`render/ui` 8 文件 11 处含 `toolbar.tsx` 两处深层导入、`fallback/ui.ts:2`、`render/index.tsx:5,45,46`、`client.ts:25`、`types.ts:2`）改指 `@user/client-base`；D-59 / D-68 的 `render/renderer`（3 处）与 `render/use.ts`（5 处）耦合、D-60 的 `render/utils/`（`index.ts:1` / `saves.ts:2`）断链共 **10** 处加带原因 `// @ts-expect-error`，**不反向引用、不解耦**；D-66 `client-base/package.json` 新增 5 条 `workspace:*` 依赖（`@motajs/animate` / `@motajs/common` / `@motajs/render-vue` / `@motajs/system` / `@user/data-common`）并执行 `pnpm i`；D-64 `?raw` 不处理、D-65 legacy 一律不管、D-62 命名一律不变；门禁 = 目标落位 / 移动已发生 / 桶导出 / 依赖与 lockfile / 消费者改指 / 反向引用零命中（`@user/client-modules` 于 `client-base`）/ `@ts-expect-error` 落点（10 新增 + 7 既有）/ 39 文件允许差异 / 实现层差异 / 范围与用户改动 / 无 `import type` / CRLF 共 12 道 + 计划文件范围门禁 + 人工复核（**不设 `check:type` / `build` / TS 诊断数类门禁**，D-68）；`autonomous: false`（Task 0 汇报关卡等待用户「可以执行」）；`REND-01` / `REND-02` 仍 Pending

**Wave 11** *(blocked on Wave 10 completion)*

- [x] 04-12-PLAN.md — 04-11 落地修正·**桶导出边界 + 消费者直连 + `shared` 单文件（代码改动）**（D-69 / D-70）：按 **D-69（硬约束：barrel 只允许 `export * from './<同目录项>'`，消费者必须直连 `@user/client-base`、不得经 barrel 转发）** 落地 D-70 的 6 条修正——① `client-modules/src/render/utils/index.ts` **删除**指向 `./layout` 的越界转发 `export *` 与其 `@ts-expect-error`（保留 `./saves` / `./use`）；② `render/ui/save.tsx` 拆分 `../utils` 导入（`adjustGrid` / `IGridLayoutData` → `@user/client-base`，`getSave` / `SaveData` 仍留 `../utils`）、`render/ui/title.tsx` 的 `adjustCover` → `@user/client-base`；③ `render/utils/saves.ts` 的 `getConfirm` / `waitbox` → `@user/client-base` 并删除其 `@ts-expect-error`；④ `client-base/src/shared/{shared.ts,index.ts}` 折成单文件 `client-base/src/shared.ts` 并删除 `shared/` 目录（`client-base/src/index.ts` 的 `./shared` 与 `map/*` 的 4 处相对说明符**一字不改**、仍解析）；⑤ **逐字保留** `client-base/src/{components/{choices,input,misc,scroll,textboxTyper,tip}.tsx,elements/index.ts}` 内 **8** 处引用 `render/use.ts` / `render/renderer` 的架构耦合 `@ts-expect-error`（D-59 / D-67，留待用户收尾；`textboxTyper.ts` 另有 1 处既有 `无法推导` 标注同属保留，故这 7 文件合计 9 处）；⑥ **零新增转发导出**、`client-modules/src/render/index.tsx` 维持现状；门禁 = 桶边界（8 个 in-scope barrel 的 `export * from` 全为 `./` 前缀 + `render/utils/index.ts` 不再转发 `./layout`）/ F1..F4 收口自检 / F5 的 8 处标注逐字保留 + porcelain 零命中 / 范围与用户改动 / CRLF + 人工复核（**不设 `check:type` / `build` / TS 诊断数类门禁**，D-68 的延续）；`autonomous: false`（Task 0 汇报关卡等待用户「可以执行」）；无依赖变更、不执行 `pnpm i`；本步不引入任何新命名；`REND-01` / `REND-02` 仍 Pending

**Wave 12** *(blocked on Wave 11 completion)*

- [x] 04-13-PLAN.md — 部分 UI 的进一步接口适配·**第一步·只读收集需要修改的点（只读，D-71 / D-72 / D-73）**：以 `d8fa4b8 refactor: Delete global loading & hook object` 后的工作树为基准，收集渲染端**部分 UI** 对已删全局 `loading` / `hook` 与旧加载系统的使用点，产出 `04-UI-ADAPTATION-IMPACT.md`（元信息块 + `只读起始基线` / `背景` / `方法` / `基准变更（d8fa4b8）` / A 全局 loading / hook 使用点（UI 面）/ B 目标对象与钩子 API 证据 / C 旧加载 UI 清单与新加载系统 / D 分层与 barrel（D-69）检查 / E legacy 命中（仅报告）/ F 未能从阅读确定（未猜测）/ 修改点汇总 / 处置；A 类 = `render/ui/load.tsx` 旧加载接口（`:71,72,76-79,91-92,118-119,139`）+ `render/ui/main.tsx` `statusBarUpdate`（`:140-143,146-151`）+ `render/index.tsx` `restart`（`:35-38`），边界非 UI 面（`client.ts:88-92,124-127` / `client-modules/src/index.ts` / `entry-client/src/create.ts:16,31,34-41`）只报告；B 类逐处给目标对象证据（`IMotaDataLoader` / `ILoadManager` / 数据端可 hook 对象接口）或 undetermined；C 类登记旧 `LoadScene` / `LoadSceneUI` 与已删 `client-base/src/load/**` + 新 `@motajs/loader` / `data-state/src/loader/**` / `CoreState.loader` / `loadManager`；D 类 4 个 barrel 节点（只报告）；E 类 legacy 只报告；F 类 ≥ 5 条未确定项；事实行每行 ≥2 个 `file:line` 锚点），**本步生产代码零改动、不引入任何命名变更**；门禁 = 只读基线一致 + 台账结构 / 内容 / 证据纪律 + 范围与用户改动 + 既有 `04-01`..`04-12` 产物保护 + CRLF + 人工复核（**不设 `check:type` / `build` / TS 诊断数类门禁**，D-68 的延续）；`autonomous: false`（Task 0 汇报关卡等待用户「可以执行」）；第二步（适配实施）待用户审阅后另行规划（D-72）；`REND-01` / `REND-02` 仍 Pending

**Wave 13** *(blocked on Wave 12 completion)*

- [x] 04-14-PLAN.md — 部分 UI 的进一步接口适配·**第二步·适配实施（代码改动，D-74 / D-75 / D-76 / D-77 / D-78）**：`render/ui/main.tsx` 状态栏改在勇士属性对象 `client.hero.attribute` 上注册 `onUpdateAttribute` 钩子（tracer，删除全局 `hook` 残留与手工调用垫片，新增局部 `attributeHook`）；`render/ui/load.tsx` 改依 `client.loader.start()` + `client.loader.manager.get*`；删除 `render/index.tsx:35-38` 的 `restart` 注释块与 `client.ts:88-92,124-127` / `entry-client/src/create.ts:16,31,34-41` 的非 UI 残留（`client-modules/src/index.ts` 零残留不编辑）；默认不重新接线旧加载 UI 装配点（开点，待用户裁定）；`autonomous: false`（Task 0 汇报关卡等待用户「可以执行」）；门禁全静态（不设 `check:type` / `build` / TS 诊断数类门禁，D-68 的延续）；`REND-01` / `REND-02` 仍 Pending

**Wave 14** *(blocked on Wave 13 completion)*

- [x] 04-15-PLAN.md — 渲染端去单例化·**第一步·只读收集（只读，用户 2026-10-01 裁定）**：收集 `packages-user/client-modules` 与 `packages-user/client-base` 内**全部单例**（模块级实例化对象 / 可变模块级状态 / 全局注册表 / 全局访问器 / 框架级全局引用 / 顶层副作用模块），产出 `04-RENDER-SINGLETON-AUDIT.md`（元信息块 + `只读起始基线` / `背景` / `方法` / `枚举口径` / A 模块级实例化对象 / B 可变模块级状态与全局注册表 / C 全局访问器与框架级全局引用 / D 顶层副作用模块 / E 主类关系与目标挂载面映射 / F 未能从阅读确定（未猜测）/ 单例→目标映射汇总 / 处置；每个单例映射到「挂主类 `ClientCore` / `client` + `IClientBaseExtended`（`client-base/src/types.ts:27`）/ `ICoreStateExtended`（`data-state/src/types.ts:45`）之一 + 既有先例证据」，无法确定者进 F 类；事实行每行 ≥2 个 `file:line` 锚点）；**本步只读、生产代码零改动、不引入任何命名变更**；门禁 = 只读基线一致（含用户未提交 `data-system/src/combat/context.ts` 的正面对照 + 哈希）+ 台账结构 / 内容 / 证据纪律 + 范围与用户改动 + 既有 `04-01`..`04-14` 产物保护 + CRLF + 人工复核（**不设 `check:type` / `build` / TS 诊断数类门禁**，D-68 的延续）；`autonomous: false`（Task 0 汇报关卡等待用户「可以执行」）；第二步（04-16：挂载 + 接口继承重构）待用户审阅后另行规划；`REND-01` / `REND-02` 仍 Pending

**Wave 15** *(blocked on Wave 14 completion)*

- [ ] 04-16-PLAN.md — 渲染端去单例化·**第二步·挂载 + 接口继承重构（代码改动，用户 2026-10-01 裁定，F-01..F-07 已裁定）**：镜像数据端分层（单一 `ClientCore implements IClientCore extends IClientSystem extends IClientBase`；字段声明在层接口）：把 client-modules 的 `using` / `sceneController` / `mainUIController` 在 `ClientCore` 构造器中实例化并挂为 `IClientCore` 字段（F-02）；重复实例以 `ClientCore` 为准（F-03）；`GameUI` 不挂、`UIController` 挂（F-04）；`texture`（F-01）/ `DEFAULT_FONT` / 所有 `GameUI` 保留不动（F-04/F-07）；client-base 层与 `client-system` 不改；`this.state` 可调用处迁移、其余先不管；不新增全局 `client` 引用（D-23）、不建转发别名（dev.md）；门禁全静态（不设 `check:type` / `build` / TS 诊断数类门禁，D-68 的延续）；`autonomous: false`（Task 0 汇报关卡等待用户「可以执行」）；`REND-01` / `REND-02` 仍 Pending

**UI hint**: yes

### Phase 5: Legacy 移植

**Goal**: 删除被新接口覆盖的 legacy 系统，迁移仍需要的内容
**Depends on**: Phases 1-4
**Requirements**: LEGACY-01, LEGACY-02
**Success Criteria** (what must be TRUE):

  1. 被新接口覆盖的 legacy 系统已删除，代码中无残留引用
  2. 仍需要的 legacy 内容已迁移到新接口
  3. 仅当无新接口覆盖时才新增接口，且接口设计经用户 review
  4. 移植后引擎仍能完整跑通一部魔塔，无功能回归

**Plans**: TBD

### Phase 6: 单元测试

**Goal**: 为核心系统（数据层等）补齐单元测试
**Depends on**: Phases 1-5
**Requirements**: TEST-01
**Success Criteria** (what must be TRUE):

  1. 核心数据层系统有单元测试覆盖
  2. 测试覆盖关键行为（战斗伤害、触发器、寻路、事件等）
  3. 测试在本地可运行且全部通过
   4. 测试由 AI 编写并运行，通过验证后可提交

**Plans**: 9/9 原计划 executed replanned (D-28；旧 06-01/06-02 执行结果标记 superseded，按同号重跑；数据端切片，非数据 render/legacy 覆盖延后) + gap-fill 06-10..06-15 (D-46；人工评审缺口补测，只补测试不改生产代码；15/15 executed) + perf 06-16 (性能测试补充；只加测试与配置，不改生产代码) + perf 06-17 (真实地图存读档性能补充；移入 13 张真实地图夹具，只加测试与夹具) + perf 06-18 (真实大地图场景性能补充；整条 lane 计时改为 `performance.mark`/`measure` + 新增 `mapScenario.perf.ts`，只加测试不改生产代码)

Plans:

- [x] 06-01-PLAN.md — Combat L2 (data-system/src/combat) + EnemyContext aura pipeline / effect combos / full interface & code coverage (D-21..D-27)
- [x] 06-02-PLAN.md — enemy top-level BASIC functionality only (data-state/src/enemy；单分支，无组合，无 save/load)
- [x] 06-03-PLAN.md — Enemy data model full public surface except legacy (data-base/src/enemy；无 save/load)
- [x] 06-04-PLAN.md — Replay focus ReplayArray ops + encode/decode + system/sandbox/decorators (data-common/src/replay；无 save/load，完整播放→06-07)
- [x] 06-05-PLAN.md — Hero ALL files incl. rendering + async mover (data-base/src/hero；无 save/load)
- [x] 06-06-PLAN.md — Map ALL interfaces, emphasis static/dynamic tiles + static arrays (data-base/src/map；无 save/load)
- [x] 06-07-PLAN.md — Top-level integration: damage combos + map+replay play + second-play re-record equality; error 2001–2008 (user confirmed replay recording wired)
- [x] 06-08-PLAN.md — Flag full surface + common (utils/indexer/faceManager+face/mover) (无 save/load)
- [x] 06-09-PLAN.md — Save/load independent system: every saveState/loadState class + CoreState top-level (BLOCKED: pre-execution user confirmation)

**Wave 1** *(independent test-writing plans; no shared production edits)*

- [x] 06-01-PLAN.md
- [x] 06-02-PLAN.md
- [x] 06-03-PLAN.md
- [x] 06-04-PLAN.md
- [x] 06-05-PLAN.md
- [x] 06-06-PLAN.md
- [x] 06-08-PLAN.md

**Wave 2** *(blocked on Wave 1 + user confirmation)*

- [x] 06-07-PLAN.md — depends on 06-02/06-04/06-06; replay recording wired by user (17d7c8f), SUMMARY complete
- [x] 06-09-PLAN.md — depends on 06-03/06-05/06-06/06-08; requires user to adjust CoreState saveables + add public save/load entry

**Wave 3** *(gap-fill batch, D-46; extends existing `*.test.ts`, no production edits)*

- [x] 06-10-PLAN.md — combat/enemy combination gaps: G-06-01-A/B/C + G-06-07-A
- [x] 06-11-PLAN.md — hero/map gaps: G-06-05-A + G-06-06-A/B/C
- [x] 06-12-PLAN.md — replay/enemy gaps: G-06-04-B (runnable) + G-06-04-A/G-06-03-A (correct-expectation skip)
- [x] 06-13-PLAN.md — save/load gaps: G-06-09-A/B (only plan testing saveState/loadState, D-32)

**Wave 4** *(G-06-04-C follow-up gap-fill, D-46; serialized after 06-12 because it shares `array.test.ts`)*

- [x] 06-14-PLAN.md — replay read-stream gaps: G-06-04-C/A (stream-only complex route + middle start index) + G-06-04-C/B (per-param typed assertions, index progression, expired-after-mutation); blocked `#06-04-3`/`#06-04-4` as correct-expectation `it.skip`

**Wave 5** *(G-06-01-D interface-coverage gap-fill, D-46; serialized after 06-14)*

- [x] 06-15-PLAN.md — combat interface gap: G-06-01-D (`EnemyContext.deleteAura` normal case — `addAura` applies `atk 2→5` → `deleteAura` same instance → `buildup` expects `2`); blocked `#06-15-1` (same root cause as `#06-01-4`) as correct-expectation `it.skip`, pending user decision

**Wave 6** *(performance-test supplement, user-authorized; appended after 06-15; isolated `test:perf` lane + new `*.perf.ts` files, no production edits, no new dependencies)*

- [x] 06-16-PLAN.md — perf supplement: `vitest.perf.config.ts` + `test:perf` script (isolated from `pnpm test:ci`); 18 cases = ② critical calc (`1000/10000/50000`) + ① enemy-context `buildup` (N = `50/200/1000`) + ③ hero attribute recalc (M = `10/100/1000`) + ④ CoreState save/load round trip (`10/100/1000` items × `NoCompression`/`LowCompression`/`HighCompression`); warmup 3 + 20 samples → median/min/p95 via `console.table`, **zero assertions**, results recorded in `06-16-SUMMARY.md`

**Wave 7** *(realistic map save/load perf supplement, user-authorized; appended after 06-16; reuses the same isolated `test:perf` lane; one fixture move + one new `*.perf.ts`, no production edits, no new dependencies)*

- [x] 06-17-PLAN.md — realistic map save/load perf: move the root `floors.json` (13 real 13×13 maps) into `packages-user/data-state/test/fixtures/`; new `packages-user/data-state/test/saveablesReal.perf.ts` measuring `存档`/`读档`/`往返` (save-only / load-only / round trip) for map scale `1/5/13` × `NoCompression`/`LowCompression`/`HighCompression` (27 rows) with a fixed realistic side load (50 flags, 20 hero modifiers incl. 4 from equipped items, 4 equipped instances, 20 item kinds, 1000 replay steps); cleared live map (`2/3/4/6` → `0`) vs original `compareWith` reference so `HighCompression` stores changed rows; warmup 3 + 20 samples → median/min/p95 via `console.table`, **zero assertions**, results recorded in `06-17-SUMMARY.md`

**Wave 8** *(realistic large-map combat scenario perf supplement + lane-wide timing-method upgrade, user-authorized; appended after 06-17; reuses the same isolated `test:perf` lane; timing helper switch in 5 existing files + one new `*.perf.ts`, no production edits, no new dependencies)*

- [x] 06-18-PLAN.md — timing method upgrade + realistic large-map combat scenario perf: switch the inlined `measureCase` in **all** `*.perf.ts` from `globalThis.performance.now()` to `performance.mark` + `performance.measure` (unique per-case tags, per-sample `clearMarks`/`clearMeasures`; same `case`/`scale`/`median ms`/`min ms`/`p95 ms` columns, warmup 3 + 20 samples, record-only); new `packages-user/data-state/test/mapScenario.perf.ts` merging the 13 real 13×13 maps into ONE grid-tiled map (`ceil(sqrt(n))` columns, placed at `(col*13, row*13)`) for scale `1/5/13` → `13×13`/`39×26`/`52×52` with 11/79/204 monster tiles, 12 real `Enemy` prefabs (4 carrying real auras: `CommonAura` Full/Manhattan/Rect + `GuardAura`), `mulberry32`-seeded assignment, `createCoreState()` real wiring + `resize` + `addPrefab` + `fromRaw` + per-tile `setEnemyAt`; measures ① `enemyContext.buildup()` ② `mapDamage.refreshAll()` + per-monster `getSeparatedDamage`/`getReducedDamage` ③ one real `calculateCritical(view, 'atk')` per monster (plus a second table reporting `monsters`/`total ms`/`avg ms`); results recorded in `06-18-SUMMARY.md`

### Phase 7: 数据端缺陷修复

**Goal**: 修复 Phase 6 单元测试暴露的数据端疑似缺陷，使正确预期用例转绿，且仅限数据端、不涉及渲染端
**Depends on**: Phase 6
**Requirements**: FIX-01
**Success Criteria** (what must be TRUE):

  1. 06-TEST-FINDINGS.md 登记的数据端疑似缺陷全部处置完毕（修复或经用户裁定改契约/不修复）：#06-01-1..4、#06-03-1、#06-04-1..4、#06-05-1..3、#06-06-1、#06-07-1、#06-08-1、#06-09-1/2/3/5，以及同根因的 #06-15-1（#06-09-4 已作废）
  2. 对应的正确预期 it.skip 用例在修复后取消 skip 并通过；无法修复的缺陷经用户确认后同步修正接口文档/契约
  3. pnpm test:ci 全绿且不新增跳过用例，数据范围 check:type / check:circular 门禁通过
  4. 改动仅限数据端（packages 与 packages-user/data-*），不改动渲染端 @user/client-* 与 legacy 渲染接线，双端分离约束保持

**Plans**: 16 plans — 07-01..07-15 已执行（07-15 完成 4 条复审缺口修复）；**07-16 标记为 SUPERSEDED（2026-10-04）**：寻路重构后的测试对齐批次不再执行，其缺口清单转为 Phase 8 的对齐输入（按 D-02 一系统一计划；每个计划以 D-09 预执行汇报关卡开头，`autonomous: false`）

> **阶段重开（2026-09-16）**：`07-LOADSTATE-AUDIT.md` 登记的同引用审计条目 `#06-17-1`（A）与 `#06-17-2`（B）在本阶段收口后追加为计划 `07-09`，Phase 7 因此由 `Complete` 回到未完成；执行 07-09 后 `07-VERIFICATION.md`（2026-09-16 结论仅覆盖 8/8 计划的工作树）**失效，必须重跑 `/gsd-verify-work`** 重新出具验证结论。

> **阶段二次追加（2026-09-16）**：`07-LOADSTATE-AUDIT.md` 的同引用审计条目 **C–H**（`#06-17-3..8`）、`07-REVIEW.md` 的 **CR-01 / CR-02** 与 4 条相关警告（WR-01/02/03/07、WR-04/05/06）、以及 `06-TEST-FINDINGS.md` 中此前「只登记不修」的部分，经用户裁定**由「登记」转为「修复」**，追加为计划 `07-10`（replay 编解码与索引编辑）、`07-11`（容器同引用存读档）、`07-12`（装备/属性存档正确性）、`07-13`（地图失效边界）、`07-14`（legacy hero 代理）。07-09 的范围守卫（「C–H 只登记不修」）据此**解除**。
> 每个计划以 `checkpoint:decision`（`gate="blocking-human"`）关卡开头，逐条列出需用户裁决的契约点（`set()` 语义、录像格式版本、溢出处置、诊断码、逐子系统同引用保留、读档禁录、失效契约等）；**契约未裁决前不得执行**。执行完毕后 `07-VERIFICATION.md` 必须重跑。

> **阶段三次追加（2026-09-17）**：Phase 7 关闭后的增量代码复审 `07-REVIEW-recheck.md` 报出 8 条发现（1 Critical + 3 Warning + 4 Info）。其中 4 条 Info 由用户自行修复并提交（`34ba9e8`/`219ac49`/`3a3a6ac`/`a2a8e6e`）；剩余 **CR-01 / WR-01 / WR-02 / WR-03** 追加为计划 `07-15`，**已执行完毕**（`53f067a`/`a7c9f97`/`49116c0`/`bb19865` + `07-15-SUMMARY.md`）。共同成因：第二轮批次仅以「让目标用例转绿」为目标，未按设计语言把契约、簿记与边界条件一次做对。

> **阶段四次追加（2026-09-17）**：用户完成寻路系统重构（`4aaea68`）后，数据端 **17 个测试文件 / 73 用例**因接口变动与形状变化失败（接口族：寻路 `useMapState`/`useDirGroup` 变更、录像 `route`→`array` 与 `onRecordCommand` 0-based 索引、`HeroLocation.setFloor(IGameMap)`、`CoreState.initMapState` 删除；另含 5 个疑似行为变化的文件）。经用户要求追加计划 `07-16`（**只改测试、不改生产代码**），已完成规划并登记缺口（`07-VERIFICATION.md` 的 `### Post-Refactor Test Breakage`）。
> **该计划暂缓（DEFERRED）**：用户观察到数据端仍需大量手工修改、并将继续导致测试报错，故等数据端全部改完后再执行。恢复时该缺口清单（2026-09-17 快照）与 `07-16-PLAN.md` **须先重新核对（很可能需要重规划）**，再走 `/gsd-execute-phase 7 --gaps-only`；随后 `/gsd-verify-work 7` 重出验证。
> **该计划 SUPERSEDED（2026-10-04）**：用户已完成数据端「系统性收尾」，接口再次变动，17 行快照与 `07-16-PLAN.md` 均已过期；该计划退役、不再执行，测试文件迁移与接口对齐整体转由 **Phase 8** 承接，`07-VERIFICATION.md` 的 `### Post-Refactor Test Breakage` 作为 Phase 8 的对齐输入。

Plans:

- [x] 07-16-PLAN.md — **SUPERSEDED（2026-10-04）**：寻路重构后的测试对齐批次——原计划把 17 个测试文件对齐到 2026-09-17 快照的接口（只改测试、不改生产代码），含 5 个疑似行为变化文件待用户 Task 0 逐行裁决。因数据端「系统性收尾」再次变动接口，该快照与计划均已过期，**转由 Phase 8 承接**（缺口清单作为 Phase 8 输入）
- [x] 07-15-PLAN.md — 复审缺陷批次：CR-01（`HeroEquipment.compareEquip` 对已装备项漏算）/ WR-01（`normalizeParam` 回退口径致字节偏移错位）/ WR-02（`checkBufferExpand` 乘数为 1 时自我递归）/ WR-03（`HeroAttribute.clone()` 绕过簿记）——**已执行**（`07-15-SUMMARY.md`）
- [x] 07-10-PLAN.md — replay：CR-01（`set()` 索引数组损坏，与 `delete()` 对齐）/ 审计 H `#06-17-3`（`setReplayArray` 漏 `expireStreams`）/ WR-01（bigint 长度字节溢出）/ WR-02（参数计数用未截断长度）/ WR-03（编解码格式版本）/ WR-07（`insert`/`delete`/`set` 越界校验）
- [x] 07-11-PLAN.md — 容器同引用：`#06-17-4`（`equipStore` 重建实例脱钩）/ `#06-17-5`（`flag/system` 字段脱钩）/ `#06-17-6`（followers 重建脱钩）
- [x] 07-12-PLAN.md — 装备/属性存档正确性：WR-04（装备修饰器活值未持久化）/ WR-05（`deleteModifierByIndex` 簿记残留）/ WR-06（`HeroEquipment.loadState` 读档写录像）
- [x] 07-13-PLAN.md — 地图：CR-02（`MapDamage` 幽灵伤害：来源消失/范围收缩后缓存残留）/ `#06-17-8`（`MapLayer.setMapRef` 失效契约 + 读档旧动态块累积）
- [x] 07-14-PLAN.md — legacy：`#06-17-7`（`data-fallback` `core.status.hero` 代理闭包持有读档前属性）——**经用户裁定 WONTFIX（不修复）**：兼容层即将删除，Q1..Q4 一律不改动；零代码改动、零新增测试（`07-14-SUMMARY.md`）
- [x] 07-09-PLAN.md — hero：`#06-17-1` / `#06-17-2` 同引用修复（`HeroAttribute` 自身实现 `ISaveableContent`，属性存读档在自身实例上原地完成；`IHeroStateSave` 形状变更 + 装备修饰器不入属性存档）
- [x] 07-01-PLAN.md — combat：`#06-01-1` / `#06-01-2` / `#06-01-3` / `#06-01-4`（含 `#06-15-1`）
- [x] 07-02-PLAN.md — enemy：`#06-03-1` 创建入口接入复用映射
- [x] 07-03-PLAN.md — replay：`#06-04-1` / `#06-04-2` / `#06-04-3` / `#06-04-4`
- [x] 07-04-PLAN.md — hero：`#06-09-1`（高）/ `#06-09-2` / `#06-05-1` / `#06-05-2` / `#06-05-3`（D-06 保留）
- [x] 07-05-PLAN.md — map：`#06-06-1`（D-04 改发 128）/ `#06-09-3`
- [x] 07-06-PLAN.md — flag+common：`#06-08-1` 后退基准修正
- [x] 07-07-PLAN.md — save：`#06-09-5`（D-05 差集方向取反 + 既有用例纠偏）
- [x] 07-08-PLAN.md — path：`#06-07-1`（D-07 用户接线后取消 skip 验证）

**Wave 1**

- [x] 07-01-PLAN.md — combat 四条根因（含既有 3 条绿用例纠偏）

**Wave 2** *(blocked on Wave 1)*

- [x] 07-02-PLAN.md — enemy 复用映射

**Wave 3** *(blocked on Wave 2)*

- [x] 07-03-PLAN.md — replay 编解码与索引编辑

**Wave 4** *(blocked on Wave 3)*

- [x] 07-04-PLAN.md — hero 存读档与属性/槽位

**Wave 5** *(blocked on Wave 4)*

- [x] 07-05-PLAN.md — map 诊断码与动态图块读档

**Wave 6** *(blocked on Wave 5)*

- [x] 07-06-PLAN.md — flag+common 后退基准与契约注释

**Wave 7** *(blocked on Wave 6)*

- [x] 07-07-PLAN.md — save 码 178 语义与既有用例纠偏

**Wave 8** *(blocked on Wave 7 + 用户完成 D-07 接线)*

- [x] 07-08-PLAN.md — path 顶层录像瞬移验证（用户负责接线，AI 仅取消 skip）

**Wave 9** *(blocked on Wave 8)*

- [x] 07-09-PLAN.md — hero 属性同引用存读档（`#06-17-1` / `#06-17-2`；`HeroAttribute` 实现 `ISaveableContent`）

**Wave 10** *(blocked on Wave 9；用户裁决 Task 0 契约后执行)*

- [x] 07-10-PLAN.md — replay 编解码与索引编辑（CR-01 / `#06-17-3` / WR-01 / WR-02 / WR-03 / WR-07）

**Wave 11** *(blocked on Wave 10)*

- [x] 07-11-PLAN.md — 容器同引用存读档（`#06-17-4` / `#06-17-5` / `#06-17-6`）

**Wave 12** *(blocked on Wave 11)*

- [x] 07-12-PLAN.md — 装备/属性存档正确性（WR-04 / WR-05 / WR-06）

**Wave 13** *(blocked on Wave 12)*

- [x] 07-13-PLAN.md — 地图失效边界与动态块（CR-02 / `#06-17-8`）

**Wave 14** *(blocked on Wave 13)*

- [x] 07-14-PLAN.md — legacy hero 代理：经用户裁定 **WONTFIX**（`#06-17-7`；兼容层即将删除，零代码、零测试；计划原定的该包首个测试文件按裁决不产出）

### Phase 8: 测试重构与接口对齐

**Goal**: 将全部测试文件（`.test.ts` / `.perf.ts`）迁入 `__test__` 目录，并按数据端「系统性收尾」后的当前接口重对齐测试、修复重构遗漏的细节问题，使 `pnpm test:ci` / `test:perf` 重新全绿
**Depends on**: Phase 7（数据端缺陷修复）
**Requirements**: TEST-02
**Success Criteria** (what must be TRUE):

  1. 全部 `.test.ts` 与 `.perf.ts` 均位于各自源码目录下的 `__test__` 文件夹内，测试命令仍能发现并运行它们
  2. 因数据端接口变动而失效的测试全部对齐到当前 shipped 接口，`pnpm test:ci` 0 失败
  3. 重构遗漏的细节问题已修复（测试面或经用户确认的数据端细节），不弱化既有断言
  4. `pnpm test:perf` 仍可运行；不新增跳过用例

**Plans**: 6/11 plans executedned（08-01..08-11；规划 2026-10-04，`gsd-plan-checker` 判 PASS / 0 blocker / 3 非阻塞 warning）——迁移 `08-01`（独立先行）→ 子系统对齐 `08-02..08-09` → 错误码与接口覆盖 `08-10` → 收口 `08-11`；每个计划 `autonomous: false`，以 blocking-human Task 0 汇报关卡开头

Plans:

- [x] 08-01-PLAN.md — 全量目录迁移到 `__test__/`（Rule A/B 分流改相对导入 + `script/test-data-node.ts:67,122` 硬编码路径；门禁=文件数守恒 66/6、零配置/零生产改动）
- [x] 08-02-PLAN.md — data-common 对齐（`utils.test.ts` 退役、`DirectionMapper` 删除、`addHook().load()` 移除、158/175→72；含经确认的 sandbox 首步预读生产修复）
- [x] 08-03-PLAN.md — data-base enemy+flag 对齐（真实 `TileStore` + 注册图块、删 legacy bridge、`getPrefab` 签名 `number|string` 类型修正、flag 读档重建语义对齐）
- [x] 08-04-PLAN.md — data-base hero 对齐（录像桩 `array`、删 `.load()`、真实 `TileStore`/`ItemStore(tileStore)`、`setFloor(IGameMap|null)`、`getItem`→`addItem`；含经确认的 `equipment.loadState` 读档禁录修复）
- [x] 08-05-PLAN.md — data-base map 对齐（`addLayer(alias)`、`MapState(state)`；陈旧码 62/63/64/84/130/125 裁决；含 D-10 生产修复，map 聚焦 108/108 通过）
- [x] 08-06-PLAN.md — data-system combat+event 对齐（`CombatFlow` 构造、`.load()` 移除、DEV 守卫码）
- [ ] 08-07-PLAN.md — data-system path 对齐（`useMapState` 删除、`useFaceHandler` 注入）
- [ ] 08-08-PLAN.md — data-state src 对齐（`createCoreState` 删除→`CoreState({loadStarter,coreURL})`；`coreEventLayer` A1/A2）
- [ ] 08-09-PLAN.md — data-state 集成对齐（共享夹具 `closed-loop.ts`、`tileLegacy` 去留、寻路注入）
- [ ] 08-10-PLAN.md — 错误码 21 缺口 + loader 公共接口覆盖盘点与补测
- [ ] 08-11-PLAN.md — 收口（`test:ci`+`test:perf` 全绿、skipped=1、零生产改动终审、阶段 SUMMARY）

**Scope note (2026-10-04)**: 由原 `07-16`（寻路重构后的测试对齐，已 SUPERSEDED）转来并扩展，加入「测试文件迁入 `__test__`」的组织重构要求。用户并发进行渲染端收尾，可能触及数据端内容但不改接口设计、不影响测试；AI 不得提交用户改动的文件，发生冲突须暂停汇报。
**Input (2026-10-04)**: `07-VERIFICATION.md` 的 `### Post-Refactor Test Breakage`（2026-09-17 的 17 行快照）作为对齐起点，但**必须先重测当日失败清单**，不得直接沿用旧快照。

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 事件系统 | 13/13 | In Progress|  |
| 2. 寻路系统 | 5/5 | In Progress|  |
| 3. 数据端完成 | 19/19 | Complete    | 2026-09-12 |
| 4. 渲染适配与双布局 | 15/16 | In Progress|  |
| 5. Legacy 移植 | 0/TBD | Not started | - |
| 6. 单元测试 | 18/18 | In Progress|  |
| 7. 数据端缺陷修复 | 15/16 | Complete（07-16 superseded） | - |
| 8. 测试重构与接口对齐 | 6/11 | In Progress|  |
