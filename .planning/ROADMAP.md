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

**Plans**: 1/1 plans executed（第一步·只读对账；本阶段增量规划，后续适配实施与双布局待对账结果出来后另行规划 — 04-CONTEXT D-01/D-02）

Plans:

- [x] 04-01-PLAN.md — 渲染端 ↔ 数据端接口对账（只读清点，产出 `04-RENDER-INTERFACE-AUDIT.md`；按 ① 错配 / ② 数据端缺失 / ③ 多余旧路径 三类登记）

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

**Plans**: 16 plans — 07-01..07-15 已执行（07-15 完成 4 条复审缺口修复）；**07-16 暂缓（DEFERRED）**：寻路重构后的测试对齐批次，待用户完成数据端手工修改后再执行（按 D-02 一系统一计划；每个计划以 D-09 预执行汇报关卡开头，`autonomous: false`）

> **阶段重开（2026-09-16）**：`07-LOADSTATE-AUDIT.md` 登记的同引用审计条目 `#06-17-1`（A）与 `#06-17-2`（B）在本阶段收口后追加为计划 `07-09`，Phase 7 因此由 `Complete` 回到未完成；执行 07-09 后 `07-VERIFICATION.md`（2026-09-16 结论仅覆盖 8/8 计划的工作树）**失效，必须重跑 `/gsd-verify-work`** 重新出具验证结论。

> **阶段二次追加（2026-09-16）**：`07-LOADSTATE-AUDIT.md` 的同引用审计条目 **C–H**（`#06-17-3..8`）、`07-REVIEW.md` 的 **CR-01 / CR-02** 与 4 条相关警告（WR-01/02/03/07、WR-04/05/06）、以及 `06-TEST-FINDINGS.md` 中此前「只登记不修」的部分，经用户裁定**由「登记」转为「修复」**，追加为计划 `07-10`（replay 编解码与索引编辑）、`07-11`（容器同引用存读档）、`07-12`（装备/属性存档正确性）、`07-13`（地图失效边界）、`07-14`（legacy hero 代理）。07-09 的范围守卫（「C–H 只登记不修」）据此**解除**。
> 每个计划以 `checkpoint:decision`（`gate="blocking-human"`）关卡开头，逐条列出需用户裁决的契约点（`set()` 语义、录像格式版本、溢出处置、诊断码、逐子系统同引用保留、读档禁录、失效契约等）；**契约未裁决前不得执行**。执行完毕后 `07-VERIFICATION.md` 必须重跑。

> **阶段三次追加（2026-09-17）**：Phase 7 关闭后的增量代码复审 `07-REVIEW-recheck.md` 报出 8 条发现（1 Critical + 3 Warning + 4 Info）。其中 4 条 Info 由用户自行修复并提交（`34ba9e8`/`219ac49`/`3a3a6ac`/`a2a8e6e`）；剩余 **CR-01 / WR-01 / WR-02 / WR-03** 追加为计划 `07-15`，**已执行完毕**（`53f067a`/`a7c9f97`/`49116c0`/`bb19865` + `07-15-SUMMARY.md`）。共同成因：第二轮批次仅以「让目标用例转绿」为目标，未按设计语言把契约、簿记与边界条件一次做对。

> **阶段四次追加（2026-09-17）**：用户完成寻路系统重构（`4aaea68`）后，数据端 **17 个测试文件 / 73 用例**因接口变动与形状变化失败（接口族：寻路 `useMapState`/`useDirGroup` 变更、录像 `route`→`array` 与 `onRecordCommand` 0-based 索引、`HeroLocation.setFloor(IGameMap)`、`CoreState.initMapState` 删除；另含 5 个疑似行为变化的文件）。经用户要求追加计划 `07-16`（**只改测试、不改生产代码**），已完成规划并登记缺口（`07-VERIFICATION.md` 的 `### Post-Refactor Test Breakage`）。
> **该计划暂缓（DEFERRED）**：用户观察到数据端仍需大量手工修改、并将继续导致测试报错，故等数据端全部改完后再执行。恢复时该缺口清单（2026-09-17 快照）与 `07-16-PLAN.md` **须先重新核对（很可能需要重规划）**，再走 `/gsd-execute-phase 7 --gaps-only`；随后 `/gsd-verify-work 7` 重出验证。

Plans:

- [ ] 07-16-PLAN.md — **暂缓（DEFERRED）**：寻路重构后的测试对齐批次——把 17 个测试文件对齐到已发布接口（只改测试、不改生产代码），含 5 个疑似行为变化文件待用户 Task 0 逐行裁决。**待用户完成数据端手工修改后再执行**（恢复前须重新核对缺口清单与计划）
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

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 事件系统 | 13/13 | In Progress|  |
| 2. 寻路系统 | 5/5 | In Progress|  |
| 3. 数据端完成 | 19/19 | Complete    | 2026-09-12 |
| 4. 渲染适配与双布局 | 1/1 | In Progress|  |
| 5. Legacy 移植 | 0/TBD | Not started | - |
| 6. 单元测试 | 18/18 | In Progress|  |
| 7. 数据端缺陷修复 | 15/16 | 暂缓 (Deferred) | - |
