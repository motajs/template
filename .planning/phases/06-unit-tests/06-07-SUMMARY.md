---
phase: 06-unit-tests
plan: "07"
subsystem: testing
tags: [vitest, replay, damage-calculation, aura, integration, top-level]

# Dependency graph
requires:
  - phase: 03-data-completion
    provides: replay command contract (ReplayCommandCode 0-7, error 2001-2008) and first-divergence diagnostics
  - phase: 06-unit-tests
    provides: 06-02 enemy top-level basics, 06-04 replay array/system/sandbox, 06-05 hero subsystems, 06-06 map interfaces, 06-09 CoreState save/load
provides:
  - top-level damage combination coverage (multi-special + system-layer aura/effect pipelines)
  - real small-map replay playback with second-recording exact comparison
  - warn 176 + replay error 2001-2008 code coverage
affects: [06-verify, milestone-v1.0]

actuals:
  tokens: 11300
  tasks: 4
  commits: 3

tech-stack:
  added: []
  patterns:
    - "real-API top-level integration tests via createCoreState (no production code changes)"
    - "inline synthetic fixtures with real Enemy/EnemyContext/MainDamageCalculator/ReplaySystem"
    - "replay recording suppression woven with replaySystem.disable()/revert() (nesting counter)"
    - "bounded async waiting (waitForEnded iteration cap) with real timers only"

key-files:
  created:
    - packages-user/data-state/test/enemyCombination.test.ts
    - packages-user/data-state/test/replayPlayback.test.ts
  modified:
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md
    - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md

key-decisions:
  - "阶段 1/2 的伤害与光环组合用真实 Enemy/EnemyContext/CommonAura/GuardAura/final effect 驱动，仅 hero 属性使用内联合成对象"
  - "录像播放期间用 replaySystem.disable()/revert() 抑制录制，避免英雄操作回写 route 使读流过期"
  - "二次录制用 ReplaySystem.saveState()/loadState()（IReplaySystemSave）做最小录像重置，ReplayArray 明确不再可存档"
  - "瞬移播放需在测试内注入 finder 的 maps/layer/predicate；CoreState 缺该注入，登记为疑似缺陷 #06-07-1"

patterns-established:
  - "录像逐条比对：快照为 {code, params:[{type,value}]}，步数 + code + 各 param type/value 全等"
  - "被跳过 / 未执行的验证都必须有 #06-07-N 锚点并登记 06-TEST-FINDINGS.md"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "顶层伤害组合：多特殊属性 + 系统层光环/效果组合、阶段顺序与属性→伤害联动"
    requirement: "TEST-01"
    verification:
      - kind: integration
        ref: "packages-user/data-state/test/enemyCombination.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "真实小地图录像播放 + 重置后二次录制逐条完全相等 + 二次播放完成"
    requirement: "TEST-01"
    verification:
      - kind: integration
        ref: "packages-user/data-state/test/replayPlayback.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "录像记录新码 176 与执行错误 2001-2008 全覆盖触发断言"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/replayPlayback.test.ts"
        status: pass
    human_judgment: false

duration: 40min
completed: 2026-09-14
status: complete
---

# Phase [06]: [unit-tests] Plan [07] Summary

**真实 API 顶层集成：顶层多特殊属性伤害组合与系统层光环/效果流水线，加上真实小地图录像完整播放、二次录制逐条完全相等，以及 176 与 error 2001–2008 全覆盖**

## Performance

- **Duration:** 40 min
- **Started:** 2026-09-14T12:30:00Z
- **Completed:** 2026-09-14T13:10:00Z
- **Tasks:** 4 (1 前置确认门禁 + 3 阶段任务)
- **Files modified:** 4 (2 新增测试文件 + 2 规划产物)

## Accomplishments
- `enemyCombination.test.ts`：阶段 1 真实 API 单特殊属性/单光环基线；阶段 2 顶层多特殊属性伤害组合、真实支援递归、光环基础 ↔ 常规查询、光环特殊 ↔ 特殊查询、final-effect 阶段顺序、同/跨优先级顺序、属性流水线 → 缓存伤害系统联动（`markDirty`/`deleteEnemy`/`with`）。
- `replayPlayback.test.ts`：真实小地图场景下经真实勇士移动器录制、完整播放、重置录像（`ReplaySystem.saveState()`/`loadState()`）后二次录制并按「步数 + 每步 code + 各 param 的 type/value」逐条断言完全相等，随后二次播放完成。
- code 覆盖：warn **176** 与 error **2001/2002/2003/2004/2005/2006/2007/2008** 各至少一条触发断言（`logger.warn`/`logger.error` spy）。
- 澄清 D-32/录像属主：`ReplaySystem` 为可存档属主（`IReplaySystemSave`），`ReplayArray` 无 `saveState`/`loadState`（用例显式断言）。
- 登记疑似缺陷 `#06-07-1`（顶层寻路 finder 未接线）为 `it.skip` 正确预期用例。

## Task Commits

Each task was committed atomically:

1. **Task 1: 执行前门禁 — 用户已确认录像记录接通（checkpoint, pre-cleared）** - 无代码提交（用户此前已完成 `17d7c8f` 录像记录改造）
2. **Task 2: 阶段 1（构件级）真实 API 单分支基线** - `bdeafd5` (test)
3. **Task 3: 阶段 2（组合/流水线）多 special + 光环/效果组合** - `edd4de3` (test)
4. **Task 4: 阶段 3（完整/集成）小地图播放 + 二次录制比对 + 176 + 2001–2008** - `9f9dd11` (test)

**Plan metadata:** 见最终 docs 提交（本 SUMMARY + STATE.md + ROADMAP.md）

## Files Created/Modified
- `packages-user/data-state/test/enemyCombination.test.ts` — 真实 Enemy/EnemyContext/计算器驱动的伤害组合与光环/效果流水线（12 通过）
- `packages-user/data-state/test/replayPlayback.test.ts` — 录制/播放/二次录制逐条比对，176 与 2001–2008（12 通过 / 1 跳过）
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` — 追加 06-07 小节与 176、2001–2008 行
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` — 追加 `#06-07` 小节与 `#06-07-1`

## Decisions Made
- 阶段 1/2 伤害与光环组合沿用真实顶层实现（`Enemy`、`EnemyContext`、`CommonAura`/`GuardAura`、`MainEnemyFinalEffect`、`MainDamageCalculator`），hero 属性用内联合成对象以保证数值确定；fixture 全部内联（D-02/D-03）。
- 录像播放期间以 `replaySystem.disable()`/`revert()` 抑制录制：真实英雄操作内部会经 `replay.route.add(...)` 回写，若不抑制会使读流过期、播放提前停止。
- 二次录制前用 `ReplaySystem.saveState()`/`loadState()`（`IReplaySystemSave`）做最小录像重置；明确不测存读档本身（D-32），并断言 `ReplayArray` 不可存档。
- 瞬移（2005）播放需在测试内以公开的 `finder.useMapState/useMapLayer/usePassPredicate` 注入；生产 `CoreState` 未接线，按 D-05 登记 `#06-07-1` 并加 `it.skip` 正确预期用例。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 测试断言误用 `toEqual` 造成 vitest 序列化 OOM**
- **Found during:** Task 3（阶段 2 属性→伤害联动）
- **Issue:** `DamageSystem.getDamageInfo*` 返回 `{ handler, ...info }`，其中 `handler.context`/`handler.state` 指向巨大且循环的对象图；用 `toEqual` 整对象断言失败时 vitest 打印 diff 会序列化该图，导致 heap OOM。
- **Fix:** 改为对标量断言（`info?.damage`/`info?.turn`），避免整对象 diff。
- **Files modified:** `packages-user/data-state/test/enemyCombination.test.ts`
- **Verification:** 聚焦运行由 OOM 变为 12 通过。
- **Committed in:** `edd4de3`

**2. [Rule 1 - Bug] 顶层录像瞬移在真实 `CoreState` 恒返回 2005**
- **Found during:** Task 4（阶段 3 小地图播放）
- **Issue:** `CoreState` 构造 `PathfindingSystem` 后只 `useMover`，未向 `finder` 注入 maps/layer/predicate，`teleportTo` 告警 173 并返回 `null`，播放中的瞬移步失败使沙箱不结束。
- **Fix:** 不改生产代码；在测试场景内以公开 `finder.useMapState/useMapLayer/usePassPredicate` 完成注入，使「真实瞬移播放」路径可测；缺口登记为 `#06-07-1`（`it.skip` 正确预期用例）。
- **Files modified:** `packages-user/data-state/test/replayPlayback.test.ts`、`06-TEST-FINDINGS.md`
- **Verification:** 播放用例由「沙箱不结束」变为正常结束；`#06-07-1` 用例 skip 待修复。
- **Committed in:** `9f9dd11`

---

**Total deviations:** 2 auto-fixed（均为测试侧 Rule 1）
**Impact on plan:** 未修改任何生产/核心源码；测试仅新增 2 个 `*.test.ts`。`#06-07-1` 为记录型缺口，不阻塞本计划完成。

## Issues Encountered
- `pnpm test:ci` 的既有回归（`#06-09` 阻断项，commit `cee8439`）已由后续 `2ff422a`/`c08f3f8` 修复；本次 D-44(c) 全绿（66 文件 / 629 通过 / 20 跳过）。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 顶层集成测试落地，Phase 6 数据端切片补齐；`#06-07-1` 待用户确认是否由 CoreState 或客户端层接线寻路 finder。
- 16 个计划可达 code 覆盖已在 `06-COVERAGE-MAP.md` 06-07 小节登记。

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*

## Self-Check: PASSED

- FOUND: packages-user/data-state/test/enemyCombination.test.ts
- FOUND: packages-user/data-state/test/replayPlayback.test.ts
- FOUND: .planning/phases/06-unit-tests/06-07-SUMMARY.md
- COMMIT FOUND: bdeafd5 (stage 1)
- COMMIT FOUND: edd4de3 (stage 2)
- COMMIT FOUND: 9f9dd11 (stage 3 + docs)
