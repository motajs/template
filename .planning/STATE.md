---
gsd_state_version: "1.0"
milestone: v1.0
current_phase: 04
current_phase_name: 渲染适配与双布局
status: executing
stopped_at: Completed 04-04-PLAN.md（勇士渲染修正：注入 IFaceManager、拆钩子类、补 AnimDir、换 @motajs/animate，三文件机器门禁全绿；REND-01/REND-02 保持 Pending）
last_updated: "2026-09-21T15:16:11.920Z"
last_activity: 2026-09-21
last_activity_desc: Phase 04 execution started
state_head: 3fadf34fff51c15c9f105806a278e6a8478fb6af
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 77
  completed_plans: 74
milestone_name: milestone
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-17)

**Core value:** 引擎能完整跑通一部魔塔——开局到结局，存档、战斗、地图、事件、剧情全链路可玩。
**Current focus:** Phase 04 — 渲染适配与双布局

## Current Position

Phase: 04 (渲染适配与双布局) — READY TO EXECUTE
Plan: 5 of 6
Status: Ready to execute
Last activity: 2026-09-21 — Completed quick task 260921-lwa: Upgrade toolchain to pnpm 12.5.1 and Node 24

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**

- Total plans completed: 33
- Average duration: N/A
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 03 | 19 | - | - |
| 07 | 14 | - | - |

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
| Phase 06 P09 | 42min | 3 tasks | 9 files |
| Phase 06 P07 | 40min | 4 tasks | 4 files |
| Phase 06 P10 | 15min | 3 tasks | 4 files |
| Phase 06 P11 | 10min | 3 tasks | 5 files |
| Phase 06 P12 | 13min | 3 tasks | 3 files |
| Phase 06 P13 | 14min | 3 tasks | 4 files |
| Phase 06 P14 | 12min | 3 tasks | 2 files |
| Phase 06 P15 | 12min | 2 tasks | 3 files |
| Phase 07-data-fixes P13 | 56min | 5 tasks | 5 files |
| Phase 07 P14 | 3min | 3 tasks | 1 files |
| Phase 04 P01 | 11min | 3 tasks | 1 files |
| Phase 04 P2 | 23min | 4 tasks | 1 files |
| Phase 04 P3 | 40min | 4 tasks | 3 files |
| Phase 04 P4 | ~45min | 4 tasks | 3 files |

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
- [Phase 06]: 06-09：存读档独立系统按 D-43 三阶段执行，6 个测试文件 41 通过 / 6 跳过；11 个可达码 55/58/59/112/113/119/120/122/124/177/178 全部触发；CoreState 顶层经公开 saveState/loadState 对 5 saveable × 3 压缩档整体往返
- [Phase 06]: 06-09：按 D-05 登记 5 处疑似缺陷 #06-09-1..5（EquipmentState 数值表读档错误 / HeroEquipment 存档未深拷贝 / DynamicTile 不恢复 num / ReplayArray 不恢复 length / 码 178 语义与文案相反），并以正确预期 it.skip 记录；另记录既有 test:ci 回归阻断项（commit cee8439）
- [Phase 06]: 06-07：顶层集成按 D-43 三阶段执行，2 个测试文件 24 通过 / 1 跳过；伤害/光环组合用真实 Enemy/EnemyContext/CommonAura/GuardAura/final effect 驱动，hero 属性用内联合成对象
- [Phase 06]: 06-07：录像播放期间用 replaySystem.disable()/revert() 抑制录制，二次录制经 ReplaySystem.saveState()/loadState()（IReplaySystemSave）最小重置；ReplayArray 不可存档已由用例断言
- [Phase 06]: 06-07：真实 code 覆盖 176 + 2001–2008；发现 #06-07-1（CoreState 未向寻路 finder 注入 maps/layer/predicate，顶层录像瞬移恒返回 2005），按 D-05 以 it.skip 正确预期用例登记
- [Phase 06]: 06-10：缺口补测按 D-43 三阶段（构件→组合/流水线→完整/集成）执行，只扩展 mapDamage.test.ts/context.test.ts/enemyCombination.test.ts，未改动任何生产代码
- [Phase 06]: 06-10：G-06-01-C 用文件内联语义 reducer（伤害求和/类型取最大/额外标记并集）断言，不导入顶层 MainMapDamageReducer；G-06-01-A/B 用内联 FakeAura/FakeConverter 驱动（D-21）
- [Phase 06]: 06-10：G-06-07-A 最大组合经真实 CoreState + MainDamageCalculator 得唯一精确 {3059,37}，去支援对照 {2882,35}；推导确认光环 25 为全局范围会同时加成相邻支援怪
- [Phase 06]: 06-10：本计划无新增码、无疑似 bug、无 it.skip；06-COVERAGE-MAP.md 追加 06-10 小节（create-or-append）
- [Phase 06]: 06-11：G-06-06-A 的 keepEvent=false 按写回块 num 重推默认事件（[[10,'base-event']]，非目标格原块 2 的 [[20,'alternate-event']]），两分支仅以 30:'moved-event' 是否保留区分
- [Phase 06]: 06-11：G-06-06-A 共同前置须在 transferToDynamic 前 layer.getTile(0,0) 物化源格静态图块，否则归零后惰性构造的 StaticTile 读不到默认事件
- [Phase 06]: 06-11：G-06-06-C 的 compareWith 参考数组必须等于各图层当前内容（含非零格），全零参考会把 low/mid 判脏；缺口补测按 D-43 三阶段执行，无新增码、无疑似 bug、无 it.skip
- [Phase 06]: 06-12：G-06-04-B 异质多命令序列读回只比较 command/params（读流 index = position + 1、get index = i），不整体 toEqual
- [Phase 06]: 06-12：G-06-04-A/G-06-03-A 复用既有 #06-04-1/#06-04-2/#06-03-1 锚点，按 D-05 写正确预期 it.skip，不新建 #06-12-N 条目（无新疑似 bug）
- [Phase 06]: 06-13：G-06-09-A 顶层全关键状态严格一致 + 录像 10 步多样化（8 类命令 + number/boolean/string 参数）逐条 exact；G-06-09-B 接受 compression 的类三档循环、无参类经 HeroState/CoreState 容器三档确认
- [Phase 06]: 06-13：EquipmentState 百分比 Low/High 命中既有 #06-09-1、HeroEquipment 经容器三档命中既有 #06-09-2，按 D-05 拆成正确预期 it.skip（经临时取消 skip 验证真实失败），既有 #06-09-1..5 skip 保持原样
- [Phase 06]: 06-13：flags/replay 的 saveState 不接受 compression 参数，按 plan 经 CoreState.saveState(compression)/loadState(snapshot, compression) 容器三档确认；本计划无新增码、无新增 finding 条目
- [Phase 06]: 06-14：读流与 get 的索引语义严格区分（read() 的 index = position + 1、get(i) 的 index = i），两者只按 command/params 对应，不对整体对象做相等比较
- [Phase 06]: 06-14：G-06-04-C/A 新增仅经 createReadStream 的 7 命令复杂序列验证（用例体内无 array.get），逐参数 typeof+值、流索引 1..7 递进、末尾 null，并覆盖中间起始索引 createReadStream(3)/(6)
- [Phase 06]: 06-14：G-06-04-C/B 强化既有 expectHeterogeneousRead（使 3 条复用用例受益）+ 两条既有流用例补每参数 typeof 与 stream.index 递进，并新增 add 变更后 expired===true + 告警 155 + 新建流按新次序类型化读回
- [Phase 06]: 06-14：受阻塞增删次序复用既有 #06-04-3/#06-04-4 锚点写正确预期 it.skip（5→7 条），不新建 #06-14-N 条目；可跑绿参数限定单字节 bigint 0..127 与 int32 整数
- [Phase 06]: 06-15：G-06-01-D（`EnemyContext.deleteAura`）补测首次实测即为红灯——`addAura` 生效（atk 2→5）断言通过，但 `deleteAura`（同一 `FakeAura` 实例）+ 再次 `buildup` 后 atk 仍为 5（期望回到基础值 2），故按 D-05 保留正确预期并标记 `it.skip`，不弱化断言也不改写为可跑绿假象
- [Phase 06]: 06-15：#06-15-1 与既有 #06-01-4 同根因（`buildup()` 只清空光环拓扑、未像 `refreshEnemy()` 那样先 `view.reset()`），findings 中交叉引用 #06-01-4 而非另立独立缺陷编号；修复 #06-01-4 后本用例可直接取消 skip
- [Phase 06]: 06-15：删除全局光环判定必须传同一光环实例（`globalAuraList` 为 Set 身份比较）且必须注册 `FakeConverter([])` 打开光环流水线（否则 `buildupBase()` 不执行导致假绿）；本计划无新增码、无新增依赖、不测 saveState/loadState、不改动任何生产/核心源码
- [Phase 07]: [Phase 07] 07-13 Q1=A：MapDamage 移除端逐个 markDirtyIndex + 空视图集 enemyStore.set（空 Set 为真值，不新增分支，A5）
- [Phase 07]: [Phase 07] 07-13 Q2=A：setMapRef/getMapRef 保留「标旧对象 expired + 整对象替换」现契约，零代码、零 jsDoc 改动（契约文本落在 <record> 与 07-13-SUMMARY）
- [Phase 07]: [Phase 07] 07-13 Q3=A1：MapLayer.loadState 入口 clearDynamics 全清既有动态块（复用 deleteDynamic 语义、触发 onDeleteDynamic、不等待，A6）
- [Phase 07]: [Phase 07] 07-13 Q4=A：IN-01 两处清理（deleteEnemy 剪除 affectedBy/damages；deleteMapDamage 空点移除为无公开可观测差异的簿记修复，A7；sourcedDamage 空点不删）
- [Phase 07]: [Phase 07] 07-14 Q1..Q4 = 不改动（用户，2026-09-17，原话「关于旧引擎的兼容部分不动，很快就要删除了，没必要改。」）：`packages-user/data-fallback` 旧引擎兼容层即将删除，代理不修、`get` 口径不变、不建 `hero.test.ts`、`patchFlags` 不处理
- [Phase 07]: [Phase 07] 07-14 `#06-17-7`（审计 C）判为 WONTFIX／经用户裁定不修复，属本阶段成功标准第 1 条「修复或经用户裁定改契约/不修复」的合法闭合；该计划零代码、零测试、零依赖，`WINDOWS.md` 不新建条目（D-14）
- [Phase 07]: [Phase 07] 07-14 收口基线维持 66 文件 / 737 通过 / 0 失败 / 1 跳过（无新增测试文件，计划原预期的 66→67 被裁决取代）；`07-VERIFICATION.md` 已失效，需重跑 `/gsd-verify-work 7`
- [Phase 04]: 04-01：只读接口对账交付 04-RENDER-INTERFACE-AUDIT.md（8 段骨架 + ① 9 条 / ③ 42 条 / ② 本步未确认），被查两包零改动。
- [Phase 04]: 04-01：带 // @ts-expect-error 需要重构 的 import（HeroMover/IMoveController、HeroAnimateDirection、IHeroMoveController(Hooks)、getHeroStatusOn、ItemState、state.maps layerState）一律归 ① 错配（渲染侧适配项），不归 ②。
- [Phase 04]: 04-01：② 数据端缺失节零确认——候选（core.firstData 工程元数据、勇士渲染粒度钩子）转入「未能从阅读确定（未猜测）」，不臆造缺失接口。
- [Phase 04]: 04-01：REND-01/REND-02 保持 Pending，本 run 只交付差异账本，适配实施与双布局未规划/未实施。
- [Phase 04]: 04-02：勇士移动只读接口探索交付 04-HERO-MOVER-INTERFACE.md（8 段骨架 + 12 条三态对账 #04-02-R-01..12 + 2 条缺失候选 + 7 条未确定），被查两包相对基线零变化、零生产代码改动。
- [Phase 04]: 04-02：缺失接口候选 2 条——移动语义钩子族（#04-02-G-01）与 HeroKeyMover 依赖的 oneStep/控制器 queue（#04-02-G-02）——只记录不设计不修复，待用户裁决（D-13）。
- [Phase 04]: 04-02：HeroRendering 渲染状态（D-18）与 legacy core.*（D-12）为显式排除项；REND-01/REND-02 保持 Pending（本 run 只探索未实施）。
- [Phase 04]: [Phase 04]: 04-03：渲染端勇士本体绑定 IHeroLocation，经 hero.addHook / hero.mover.addHook 订阅数据端现有钩子（D-21），不新增数据端接口、不改数据端文件
- [Phase 04]: [Phase 04]: 04-03：IMapHeroRenderer 按 D-20 删除 8 个外部驱动成员声明，勇士渲染改为完全被动；对应类内实现方法保留并只由钩子回调调用
- [Phase 04]: [Phase 04]: 04-03：D-18 贴图别名 hero.image 只做最小编译桥接（读取收敛为一处 + 既有 // @ts-expect-error 惯用法标注），不重设贴图来源；D-18 / D-22 成员逐字保留
- [Phase 04]: [Phase 04]: 04-04：MapHeroRenderer 注入 IFaceManager（faceManager 字段 + 派生 dir4），degrade/next 走 Dir4FaceHandler（FaceGroup.Dir4），movement 走 hero.mover.faceHandler（Dir8）；IMapExtensionManager.addHero 新增 faceManager 形参并由 manager.ts 转发（D-24/D-29）
- [Phase 04]: [Phase 04]: 04-04：MapHeroHook 拆为 MapHeroLocationHook（onSetPos 无条件、只出现一次，承载 D-18/D-22 多余方法）与 MapHeroMoverHook（onMoveStart/onMoveEnd/onStepEnd/onSetFaceDir），各自注册各自 controller；onStepEnd 的 AnimDir 分支按 step.dir 设置动画方向（D-25/D-26）
- [Phase 04]: [Phase 04]: 04-04：hero.ts 弃用 mutate-animate 的 TimingFn<2>，改用 @motajs/animate 的 ExcitationCurve2D；D-28 存量 state.roleFace.getFaceOf 三处与 import 逐字保留；types.ts 单行 addHero 签名与 manager.ts 单行构造调用按仓库惯例加 // prettier-ignore 以同时满足计划的单行静态门禁与 prettier

### Roadmap Evolution

- Phase 7 added: 数据端缺陷修复（仅数据端；修复 Phase 6 单元测试暴露的疑似缺陷，使正确预期用例转绿，不含渲染端）

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4 渲染适配尚未开始，需在数据端 Phase 3 完成后对接新数据层接口
- 01-08 rawEvent cache-safety and no-as implementation assumptions are explicitly removed from the revised executable scope; the 01-05 current contract remains unchanged.
- eventStore circular paths are explicitly preserved as the Phase 01 baseline; the revised 01-08 regression does not require those paths to disappear.
- Plan 01-12 leaves the repository-wide type gate blocked only by pre-existing diagnostics outside the plan-owned files; these are recorded in the phase deferred-items ledger.
- Plan 01-13 records the same repository-wide type gate diagnostics outside its implementation and test files in the phase deferred-items ledger.

- **Phase 07 暂缓（2026-09-17）**：用户在并发手工重构数据端，接口/形状仍在变，测试会持续报错——这不是缺陷，是进行中的工作。**07-16（寻路重构后的测试对齐）已暂缓**，等数据端全部改完再启动；届时先重新核对 `07-VERIFICATION.md` 的 `### Post-Refactor Test Breakage` 缺口清单（2026-09-17 快照很可能已过期）与 `07-16-PLAN.md`（很可能需重规划），再 `/gsd-execute-phase 7 --gaps-only`，最后 `/gsd-verify-work 7`。期间**不要**把用户并发改动引入的类型错误/测试失败当作缺陷登记或修复。

- 07-REVIEW-recheck.md（2026-09-17，增量复审）新增 8 条未经裁决的发现（1 Critical：`HeroEquipment.compareEquip` 对已装备项取差值错误；3 Warning：`normalizeParam` 字节长度 0、`checkBufferExpand` 倍数为 1 时无限递归、`HeroAttribute.clone` 丢修饰器名/绑定；4 Info）。**未纳入 Phase 7 登记范围，也未经用户确认为问题**；是否开修复计划待用户裁决。

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260913-qtq | event built-ins refactor and anon-tokyo import rename | 2026-09-13 | f0fd2f5 | [260913-qtq-event-built-ins-refactor-and-anon-tokyo-](./quick/260913-qtq-event-built-ins-refactor-and-anon-tokyo-/) |
| 260921-lwa | Upgrade toolchain to pnpm 12.5.1 and Node 24 (workspace config, lockfile, docs) | 2026-09-21 | 1dd3ad4 | [260921-lwa-pnpm-12-5-1](./quick/260921-lwa-pnpm-12-5-1/) |

## Deferred Items

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| quality gate | Pre-existing TypeScript diagnostics outside Plan 01-12 files | deferred | 2026-09-09 | v1.0 |
| quality gate | Pre-existing TypeScript diagnostics outside Plan 01-13 files | deferred | 2026-09-09 | v1.0 |
| test alignment | Plan 07-16 (post-refactor test alignment, 17 files / 73 failures snapshot) — DEFERRED by the user until the data-layer manual rework finishes; the gap inventory in `07-VERIFICATION.md` (`### Post-Refactor Test Breakage`) and `07-16-PLAN.md` MUST be re-checked (likely re-planned) before executing | deferred | 2026-09-17 | v1.0 |

## Session Continuity

Last session: 2026-09-19T08:59:26.713Z
Stopped at: Completed 04-04-PLAN.md（勇士渲染修正：注入 IFaceManager、拆钩子类、补 AnimDir、换 @motajs/animate，三文件机器门禁全绿；REND-01/REND-02 保持 Pending）
Resume file: None
