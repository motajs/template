---
phase: 02-pathfinding
plan: 01
subsystem: pathfinding
tags: [pathfinding, interface-draft, dijkstra, mover, zero-dependency, user-decision-gate]

# Dependency graph
requires:
  - phase: 01-event-system
    provides: source-aware 事件派发（IGameEventInvocation / IBlockEventEnv）、HeroMover + DefaultHeroMoveTopImpl 移动链路、IMapLayer 点事件生命周期
provides:
  - 寻路系统接口草案 02-INTERFACE-DRAFT.md（六节齐备 + 六项拍板记录，02-02/02-03 的执行依据）
  - 用户拍板结论：types.ts user-owned、P1 修复 go、D-08 触发语义、打断时序选项 1、4 向图
  - L0 mover.ts:651 坐标回写缺陷回归测试脚手架（4 个 skip 用例，02-02 翻绿）
affects: [02-02, 02-03, phase-04-rendering]

# Actuals (#2632)
actuals:
  tokens: 5622          # chars/4 over realized diff (packages-user + draft + planning docs)
  tasks: 3
  commits: 3            # MEASURED: git rev-list --count gsd-plan-head-before-02-01..HEAD at SUMMARY write

# Tech tracking
tech-stack:
  added: []             # 零新依赖（D-07 / T-02-SC：无安装对象）
  patterns:
    - "D-07 明锁：AI 起草 → 用户逐项拍板 → 才实现（接口事实源由用户持有）"
    - "回归脚手架先行：缺陷修复前以 it.skip 提交用例，修复后翻绿"

key-files:
  created:
    - .planning/phases/02-pathfinding/02-INTERFACE-DRAFT.md
    - packages-user/data-common/src/common/mover.test.ts
  modified: []

key-decisions:
  - "types.ts（packages-user/data-system/src/pathfinding/）由用户亲自编写，为接口事实源；02-02/02-03 不得创建或重写"
  - "文件归属按草案原样：L2 data-system/src/pathfinding/（graph/system/index）+ L3 data-state/src/pathfinding/heroPathfinding.ts，types.ts 除外"
  - "P1 修复 go：mover.ts:651 条件 && → || 授权 02-02 执行并翻绿 4 个回归用例"
  - "D-08 触发语义（用户原话）：掩码（CannotIn/CannotOut）允许到达且目标为 no-pass 才触发 hit/OnTouch；掩码不可达一律不触发；实现机制须与该语义一致"
  - "打断时序：选项 1 —— stop() 后 await 兑现，再查新位置起新寻路（无竞态，最多延迟一步）"
  - "图方向性：仅 4 正交向（与 PassBit 四位掩码一致，不含斜向）"

patterns-established:
  - "user-owned 接口文件模式：接口事实源文件由用户编写，AI 实现计划只消费不创建"
  - "skip-first 回归脚手架：缺陷确认后先铺 skip 用例，修复任务负责翻绿"

requirements-completed: []  # PATH-01/PATH-02 为 02-02/02-03 共享声明，按 shared-ID 门延迟至实现计划完成

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: 寻路系统接口草案 02-INTERFACE-DRAFT.md（签名清单、文件归属、D-08 两方案、P1 调查、打断时序、图方向性六节 + 拍板记录）
    requirement: PATH-01
    verification: []
    human_judgment: true
    rationale: 草案质量与签名取舍由用户在 checkpoint 逐项拍板验收——六项明确结论（含原话）已忠实记录于草案「拍板记录」节，即为人工验收凭证
  - id: D2
    description: 六项用户拍板记录（接口签名 types.ts user-owned、文件归属、P1 go、D-08 触发语义、打断选项 1、4 向图）逐字落档
    verification: []
    human_judgment: true
    rationale: 拍板本身就是人类判断，无法自动化验证；用户决策原话已记录并同步标注至草案各节（0 处「待拍板」残留）
  - id: D3
    description: L0 mover 坐标回写回归测试脚手架（4 个 it.skip 用例：x 正交 / y 正交 / 斜向 / 传送步）
    requirement: PATH-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/common/mover.test.ts (pnpm exec vitest run — 4 skipped, 0 failed)"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-09-09
status: complete
---

# Phase 02 Plan 01: 接口草案与拍板关卡 Summary

**寻路系统接口草案（六节）产出并经用户六项逐字拍板落档，P1 mover.ts:651 坐标回写缺陷获 go 授权，4 用例回归脚手架以 skip 状态通过 vitest——02-02/02-03 的执行依据齐备**

## Performance

- **Duration:** 25 min（Task 1 提交 07:30 UTC 起算至 SUMMARY 落档）
- **Started:** 2026-09-09T07:30:19Z（Task 1 commit）
- **Completed:** 2026-09-09T07:55Z 左右
- **Tasks:** 3（Task 1 / Task 2 / Task 3 checkpoint 拍板）
- **Files modified:** 2（+STATE/ROADMAP/SUMMARY 元数据）

## Accomplishments

- 02-INTERFACE-DRAFT.md：六节齐备（接口签名草案、文件归属提案、D-08 两方案并列、P1 缺陷调查、打断时序两选项、图方向性两选项）+ 边界守卫要求（T-02-01/T-02-02）+ 拍板记录
- 用户六项拍板逐字落档：types.ts 由用户亲自编写（02-02/02-03 不得创建/重写）；文件归属按草案原样；P1 修复 **go**（mover.ts:651 `&&`→`||`）；D-08 触发语义 = 掩码允许到达且目标 no-pass 才触发（掩码不可达一律不触发）；打断时序选项 1；图方向性仅 4 正交向
- 草案全文 0 处「待拍板」残留，各节已同步标注拍板结论
- mover.test.ts：4 个 it.skip 回归用例（x 正交 / y 正交 / 斜向 / 传送步坐标回写），vitest 0 failed，生产代码零改动

## Task Commits

Each task was committed atomically:

1. **Task 1: 起草寻路系统接口草案与决策问题清单** - `a9b1ba1` (docs)
2. **Task 2: 铺设 L0 mover 坐标回写回归测试脚手架（skip 状态）** - `9477b2c` (test)
3. **Task 3: 用户拍板接口草案与全部待决选项（D-07 关卡）** - `5a1b12e` (docs)

**Plan metadata:** (本提交 — docs(02-01): complete)

## Files Created/Modified

- `.planning/phases/02-pathfinding/02-INTERFACE-DRAFT.md` - 接口草案 + 拍板记录（接口事实源声明：types.ts user-owned）
- `packages-user/data-common/src/common/mover.test.ts` - L0 坐标回写回归脚手架（4 skip 用例，02-02 翻绿）

## Decisions Made

见 frontmatter `key-decisions` —— 全部为用户 checkpoint 拍板结论，原话忠实记录于草案「拍板记录」节。

## Deviations from Plan

None - plan executed exactly as written.（Task 3 checkpoint 由用户逐项拍板后正常恢复，属计划内流程。）

## Issues Encountered

- PATH-01/PATH-02 同时被 02-02/02-03 声明，按 shared-ID 门（#2388）本计划不标记 requirements 完成——待实现计划完成 SUMMARY 后由其触发 `requirements.mark-complete`。

## Known Stubs

| 文件 | 位置 | 原因 |
| ---- | ---- | ---- |
| `packages-user/data-common/src/common/mover.test.ts` | 4 个 `it.skip` 用例 | 刻意脚手架（02-01 不修生产代码，D-07）：待 02-02 执行已获 go 授权的 mover.ts:651 `&&`→`||` 修复后翻绿 |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 02-02（L2 graph/system + P1 修复 + 用例翻绿）与 02-03（L3 hero 接线）可依拍板结果开工；**开工前先等待用户提交其编写的 `packages-user/data-system/src/pathfinding/types.ts`**（接口事实源，02-02/02-03 不得代写）
- D-08 实现机制须与用户指定触发语义（掩码允许到达 + 目标 no-pass）一致；打断时序按选项 1；图仅 4 正交向

---
*Phase: 02-pathfinding*
*Completed: 2026-09-09*

## Self-Check: PASSED

- SUMMARY.md 存在；Task 1/2/3 提交（`a9b1ba1`、`9477b2c`、`5a1b12e`）均在 git log 中确认
- 草案验证命令通过（拍板记录 / go/no-go / 方案 A|B 均命中，0 处「待拍板」残留）
- mover.test.ts skip 脚手架已登记 broken-windows 台账（entry #4, skipped-test, open）
