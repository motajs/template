---
gsd_state_version: "1.0"
milestone: v1.0
current_phase: 06
current_phase_name: unit-tests
status: executing
stopped_at: Completed 06-08-PLAN.md
last_updated: "2026-09-14T09:03:12.315Z"
last_activity: 2026-09-14
last_activity_desc: Phase 06 execution started
state_head: 6699df9eeed82f39879d68aa58ee1f978b442ab0
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 46
  completed_plans: 44
milestone_name: milestone
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-10)

**Core value:** 引擎能完整跑通一部魔塔——开局到结局，存档、战斗、地图、事件、剧情全链路可玩。
**Current focus:** Phase 06 — unit-tests

## Current Position

Phase: 06 (unit-tests) — EXECUTING
Plan: 9 of 9
Status: Ready to execute
Last activity: 2026-09-14 — Phase 06 execution started

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**

- Total plans completed: 19
- Average duration: N/A
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 03 | 19 | - | - |

**Recent Trend:**

- Last 5 plans: N/A
- Trend: N/A

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P04 | 7min | 3 tasks | 2 files |
| Phase 01 P05 | 17min | 2 tasks | 4 files |
| Phase 01 P06 | 20min | 2 tasks | 4 files |
| Phase 01 P10 | 25min | 2 tasks | 5 files |
| Phase 01 P07 | 25min | 2 tasks | 5 files |
| Phase 01 P08 | 3min | 1 tasks | 1 files |
| Phase 01 P09 | 8min | 2 tasks | 2 files |
| Phase 01 P11 | 13min | 2 tasks | 3 files |
| Phase 01 P12 | 20min | 2 tasks | 6 files |
| Phase 01 P13 | 30 | 3 tasks | 11 files |
| Phase 02 P01 | 25min | 3 tasks | 2 files |
| Phase 02 P02 | 29min | 3 tasks | 10 files |
| Phase 02 P03 | 30 min | 4 tasks | 9 files |
| Phase 02 P04 | 10 min | 2 tasks | 7 files |
| Phase 02 P05 | 5min | 2 tasks | 2 files |
| Phase 03 P18 | 14min | 3 tasks | 8 files |
| Phase 03 P19 | 8min | 2 tasks | 6 files |
| Phase 06 P01 | 9min | 3 tasks | 6 files |
| Phase 06 P02 | 9min | 3 tasks | 6 files |
| Phase 06 P01 | 13min | 3 tasks | 6 files |
| Phase 06 P02 | 8min | 3 tasks | 6 files |
| Phase 06 P03 | 13min | 3 tasks | 5 files |
| Phase 06 P04 | 26min | 3 tasks | 6 files |
| Phase 06 P05 | 22min | 3 tasks | 10 files |
| Phase 06 P06 | 24min | 3 tasks | 8 files |
| Phase 06 P08 | 21min | 3 tasks | 6 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 接口/架构设计由用户主导；AI 仅做实现与测试
- 渲染层先于数据层完成重构（既有顺序延续）
- 阶段顺序调整为玩法优先：事件 + 寻路 → 数据端完成 → 渲染适配 → legacy 移植 → 单元测试
- AI 可在验证通过后自行创建 git commit，无需用户逐次审批；验证未通过不得提交
- [Phase 01]: Serialized event registration and map event-id binding remain deferred; CoreState retains only a TODO and no new public registration API is added.
- [Phase 01]: Source-aware dispatch uses IGameEventInvocation { id: string; env: IBlockEventEnv } and one full-sequence execute call.
- [Phase 01]: IMapLayerSave.pointEvents uses index -> priority -> eventId, independent from map-matrix dirty, with pure-baseline overlay loading and crop/clear resize semantics.
- [Phase 01]: Phase 01 Plan 05 preserves rawEvent as public Statement[] with constructor/setRaw aliasing, generic Promise<R>, and current as Promise<R> adapters; no defensive-copy, unknown, or cache-safety changes.
- [Phase 01]: Phase 01 Plan 05 defers eventStore circular dependencies, preserving current imports and behavior and recording the exact check:circular paths as the phase baseline.
- [Phase 01]: Plan 01-06 validates raw map event containers before registration and binds coordinate events to the event layer.
- [Phase 01]: Plan 01-10 restores raw tile defaults and implements the approved coordinate point-event lifecycle; map-level aggregation and registration remain deferred.
- [Phase 01]: Plan 01-07 dispatches one approved source-aware point/static/dynamic invocation sequence with trigger filtering before cut/reduce.
- [Phase 01]: Plans 01-08 and 01-09 remain unexecuted; their revised scope preserves rawEvent/Promise<R>/as adapters/cycles, tests only eventStore behavior, and isolates GameMap point-event aggregation without production registration.
- [Phase 01]: Plan 01-08 regression-tests GameEventStore through the public barrel and preserves rawEvent, Promise, and eventStore-cycle deferrals.
- [Phase 01]: Plan 01-09 preserves non-empty pointEvents as valid GameMap layer save content for LowCompression and HighCompression.
- [Phase 01]: Plan 01-09 validates point-event aggregation without production registration, map-id binding, rawEvent changes, or eventStore cycle repair.
- [Phase 01]: Phase 01 Plan 11 wires each legacy event alias layer to GameMap.eventLayer without adding serialized registration or map-id binding.
- [Phase 01]: Phase 01 Plan 11 preserves source-aware invocation, point-event persistence, rawEvent/cache/Promise/as, and eventStore-cycle deferrals.
- [Phase 01]: Gap-closure plan 01-12 repairs only the missing IBlockEventEnv import, focused fixture typing, and reported CRLF/Prettier errors; it preserves all locked deferrals and public contracts.
- [Phase 01]: Gap-closure Plan 01-12 imports IBlockEventEnv and types only the focused event/map fixtures without changing runtime behavior or public contracts.
- [Phase 01]: Gap-closure Plan 01-12 preserves serialized registration/map-id binding, rawEvent/cache/Promise/as, and eventStore-cycle deferrals.
- [Phase 01]: Plan 01-13: LayerEventView owns point-event refs with O(1) dirty state; MapLayer uses flat index storage and ref-first overlays; MapTileBase centralizes default restoration.
- [Phase 01]: Plan 01-13 preserves the approved save shape, resize semantics, locked deferrals, and leaves types.ts and executor.ts user edits untouched.
- [Phase 02]: [Phase 02] 02-01 拍板：pathfinding/types.ts 由用户亲自编写（接口事实源），02-02/02-03 不得创建或重写该文件
- [Phase 02]: [Phase 02] 02-01 拍板：mover.ts:651 坐标回写缺陷 go——授权 02-02 改为 || 并翻绿 4 个回归用例
- [Phase 02]: [Phase 02] 02-01 拍板：D-08 触发语义=通行掩码允许到达且目标 no-pass 才触发 hit/OnTouch，掩码不可达一律不触发；实现机制须与该语义一致
- [Phase 02]: [Phase 02] 02-01 拍板：打断时序选选项 1（stop 后 await 兑现再起新寻路）；图方向性仅 4 正交向；文件归属按草案原样（types.ts 除外）
- [Phase 02]: [Phase 02]: 02-02 floorId 解析经 iterateAllMaps 引用匹配（fromRaw 楼层默认 inactive，激活层迭代会使真实谓词拿不到 floorId）
- [Phase 02]: [Phase 02]: 02-02 L2 经结构化守卫 hasMover 取移动器（零 as），mover.start() 返回 null 即已有移动进行中契约检测点
- [Phase 02]: [Phase 02]: 02-02 终端节点（canPass 且 shouldHit）在搜索层约束：可作终点不可穿越；D-08 情形 1 由 02-03 直接 find() 判定相邻格
- [Phase 02]: [Phase 02]: 02-02 moveTo 恒逐步，回退策略仅作用于 teleportTo 且 null 默认必定逐步（与用户 types.ts jsdoc 逐字对齐）
- [Phase 02]: L3 HeroPathfinding 注入 DefaultHeroMoveTopImpl 的 IPassPredicate，L2 图搜索与 hero mover 共享同一通行性语义。
- [Phase 02]: D-08 no-pass 目标采用可达相邻格 + 面朝目标 + source-aware OnTouch 直派；无相邻可达格返回空路径。
- [Phase 02]: 同步寻路接口通过 queued controller 实现 stop 后 await，再从最新坐标重算并启动新路径。
- [Phase 02]: D-07 remains authoritative: path/types.ts matches the user baseline except for the two authorized nullable returns; graph helper contracts stay implementation-owned.
- [Phase 02]: The concrete useMover bridge remains in PathfindingSystem so HeroPathfinding can bind IObjectMover without expanding the user-authored interface.
- [Phase 02]: D-11 remains intact: this plan modifies no client click adapter or Phase 1 file.
- [Phase 02]: Phase 02 Plan 05 sets Vitest testTimeout and hookTimeout to 30 seconds to cover full-suite beforeAll import cost.
- [Phase 02]: Phase 02 Plan 05 adds deterministic pnpm test:ci while preserving interactive pnpm test.
- [Phase 02]: Phase 02 Plan 05 preserves D-11 by modifying no client click adapter or Phase 1 file.
- [Phase 02]: 2026-09-10 用户结构审查修正：graph 类型及注释归回 path/types.ts；删除未授权的 HeroPathfinding L3 封装及其接线。
- [Phase 02]: 2026-09-10 用户结构审查修正：DirectionMapper 由 IDataCommon 主对象共享注入；通行性谓词提取为 predicate.ts 的 DefaultPassPredicate。
- [Phase 02]: 2026-09-10 直接执行摘要 02-06：旧的 L3 HeroPathfinding 相关验证记录仅代表历史实现，必须按修正后的 L2 范围重新验证。
- [Phase 03]: 数据端通过独立 Node replay、19 个数据测试文件和四包 type/circular 门禁验证。
- [Phase 03]: IFacedTileLocator 移入 @user/data-common，移除 @motajs/common → data-common 循环依赖。
- [Phase 03]: 序列化事件注册、null-safe built-ins 与 production replay-safety wiring 通过 gap closure 验证。
- [Phase 03]: Plan 03-18: event/index.ts and data-state/src/index.ts are export-only; eight explicit class-owned registrations assemble in event/registrations.ts with hero-owned eventTouchFront.
- [Phase 03]: Plan 03-18 preserves the approved eight-name order, awaited event semantics, direct Statement[] insertion, safe missing-target behavior, and legacy/save/decorator boundaries.
- [Phase 03]: Plan 03-19: script/check-touched-jsdoc.ts derives its inventory from the passed files (top-level functions plus class methods) and enumerates constructors as explicit exemptions.
- [Phase 03]: Plan 03-19: multiline JSDoc requires the opener alone on its line and the closing marker on its own line; the cleanup is scoped to replay/event correction files only.
- [quick 260913-qtq]: 内建函数名改用短名（setBlock/moveBlock/... ），删除 EventBuiltinName 枚举；类内使用字面量名称。
- [quick 260913-qtq]: anon-tokyo 以内嵌 workspace 包 @motajs/anon-tokyo 为唯一来源，全仓统一引用并声明 workspace 依赖。
- [quick 260913-qtq]: 事件注册收口为单一 createEventRegistrations()，不做分类包装；共享工具放 event/utils.ts 且不经 index 导出。
- [Phase 06]: 06-01：combat Layer-2 以行为单测覆盖（DamageContext/DamageSystem/MapDamage/EnemyContext/CombatFlow），三处疑似 bug 只记录不修复，按 D-05 写成 it.skip 正确预期用例并登记 06-TEST-FINDINGS.md #06-01-1..3
- [Phase 06]: 06-01：Node 测试须同时 polyfill Map.getOrInsert 与 getOrInsertComputed（EnemyContext 使用前者）
- [Phase 06]: 06-02：enemy 顶层实现以 6 个同目录行为单测覆盖（calculator/final/comparer/aura/special/mapDamage），fixture 全部 inline，未修改任何生产代码
- [Phase 06]: 06-02：未发现疑似 bug，06-TEST-FINDINGS.md 无新增 #06-02-N；BetweenDamageView 方向去重语义与 plan 措辞不符但实现正确，仅记录澄清
- [Phase 06]: 06-01：战斗系统 Layer-2 按 D-43 三阶段重跑（构件→流水线→集成），EnemyContext 全公开方法 + 三范围光环 + 四阶段顺序 + 两条刷新路径 + 15 个可达 code 全覆盖；D-26 属性→伤害联动经真实 EnemyContext + fake calculator 验证。
- [Phase 06]: 06-01：新增疑似缺陷 #06-01-4（重复 buildup 未重置计算后怪物导致属性累加），按 D-05 写成正确预期 it.skip 并登记 06-TEST-FINDINGS.md；连同既有 #06-01-1..3 共 4 条只记录不修复。
- [Phase 06]: 06-02（重跑）：按 D-43 三阶段复核，补齐 GuardAuraConverter.convert 与 GuardAura 能力/applySpecial 正常用例以满足 D-30 公开方法全覆盖；三阶段聚焦运行与 pnpm test:ci 全绿（257 passed / 4 skipped）
- [Phase 06]: 06-03：enemy 数据模型按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）执行，每阶段聚焦跑绿并过 D-44 门禁后再进入下一阶段
- [Phase 06]: 06-03：manager 脏集合用 Reflect.get(manager, 'dirtySet') 观测，不调用 saveState/loadState，严格遵守 D-32
- [Phase 06]: 06-03：registerSpecial 覆盖语义只能经被排除的 legacy 转换路径观测，故只覆盖注册/重复注册不报错的最小正常用例（D-30 优先）
- [Phase 06]: 06-03：createEnemy/createEnemyById 未走复用映射，按 D-05 写 it.skip 正确预期并登记 #06-03-1，不修改核心代码
- [Phase 06]: 06-04：录像系统按 D-43 三阶段（构件→组合/流水线→完整/集成）执行，array/func/system/sandbox 四文件共 56 passed / 4 skipped，覆盖 code 148–163、175
- [Phase 06]: 06-04：发现 4 处核心编解码/编辑缺陷（#06-04-1 int64 解码乘数、#06-04-2 多字节 bigint 编码、#06-04-3 delete 索引回退、#06-04-4 insert 参数位移方向），按 D-05 写正确预期 it.skip 只记录不修复
- [Phase 06]: 06-04：D-32 不测 ReplayArray.saveState/loadState（归 06-09）；D-40 不做完整播放/二次录制，error 2001–2008 归 06-07
- [Phase 06]: 06-05：勇士全部子系统按 D-43 三阶段（构件→组合/流水线→完整/集成）以 10 个同目录测试覆盖，每阶段聚焦跑绿并过 D-44 门禁后提交
- [Phase 06]: 06-05：HeroAttribute 无修饰器时 final 属性陈旧（#06-05-1）、HeroEquipment 字符串槽位空槽判断写反（#06-05-2）与码 147 不可达（#06-05-3），按 D-05 写正确预期 it.skip 只记录不修复
- [Phase 06]: 06-05：D-32 不测任何 saveState/loadState，equipStore 专属码 58/59 归 06-09；mover 异步用真实计时器 + await controller.onEnd
- [Phase 06]: 06-06：地图全部按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）以 8 个同目录测试覆盖，每阶段聚焦跑绿并过 D-44 门禁后提交
- [Phase 06]: 06-06：transferToDynamic 越图实际发码 131（setEventLayer 专属）而 transferToStatic 发 128，按 D-05 以正确预期 it.skip 登记 #06-06-1 待用户确认；131 正常覆盖由 gameMap.setEventLayer 越权路径承担
- [Phase 06]: 06-06：IMapState 并无 canPass/shouldHit（实现在 data-state/src/hero/predicate.ts），mapState.test 只覆盖谓词侧依赖的「活跃楼层 → 事件层」数据供给；计划中的 createLayerState 码 121 实为 MapState.createMap 重复注册告警
- [Phase 06]: 06-06：D-32 不测任何 saveState/loadState（55/122/124 归 06-09）；MapTileBase 抽象类经 StaticTile/DynamicTile 具体子类覆盖，mover protected 回调为 no-op 故经公开钩子观测生命周期
- [Phase 06]: 06-08：flag + common 按 D-43 三阶段（构件→组合/流水线→完整/集成）以 6 个行为单测覆盖，每阶段聚焦跑绿并过 D-44 门禁后提交
- [Phase 06]: 06-08：FlagSystem 全公开表面（码 111）、FaceManager + Dir4/Dir8 handler、RoleFaceBinder（码 43/44）、utils 朝向纯函数、MapLocIndexer、ObjectMover 全公开方法均覆盖；D-32 不测 saveState/loadState（flag 往返归 06-09）
- [Phase 06]: 06-08：疑似缺陷 #06-08-1（ObjectMover.backward(count>1) 因 Special 步翻转 moveDirection 而方向摆动、净位移为零），按 D-05 以正确预期 it.skip 登记，不修改核心代码

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4 渲染适配尚未开始，需在数据端 Phase 3 完成后对接新数据层接口
- 01-08 rawEvent cache-safety and no-as implementation assumptions are explicitly removed from the revised executable scope; the 01-05 current contract remains unchanged.
- eventStore circular paths are explicitly preserved as the Phase 01 baseline; the revised 01-08 regression does not require those paths to disappear.
- Plan 01-12 leaves the repository-wide type gate blocked only by pre-existing diagnostics outside the plan-owned files; these are recorded in the phase deferred-items ledger.
- Plan 01-13 records the same repository-wide type gate diagnostics outside its implementation and test files in the phase deferred-items ledger.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260913-qtq | event built-ins refactor and anon-tokyo import rename | 2026-09-13 | f0fd2f5 | [260913-qtq-event-built-ins-refactor-and-anon-tokyo-](./quick/260913-qtq-event-built-ins-refactor-and-anon-tokyo-/) |

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| quality gate | Pre-existing TypeScript diagnostics outside Plan 01-12 files | deferred | 2026-09-09 | v1.0 |
| quality gate | Pre-existing TypeScript diagnostics outside Plan 01-13 files | deferred | 2026-09-09 | v1.0 |

## Session Continuity

Last session: 2026-09-14T09:03:12.081Z
Stopped at: Completed 06-08-PLAN.md
Resume file: None
