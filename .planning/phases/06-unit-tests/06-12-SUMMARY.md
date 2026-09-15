---
phase: 06-unit-tests
plan: 12
subsystem: testing
tags: [vitest, replay, replay-array, enemy-manager, coverage-gap, it-skip]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 06-03 enemy 数据模型单测（EnemyManager reuse mapping）与 06-04 录像系统单测（ReplayArray 编解码/读流）
provides:
  - G-06-04-B 可跑绿：6 条异质录像命令（参数个数与类型各异）经 createReadStream 与 get 逐条读回一致，含 uint16 加宽与删除首步
  - G-06-04-A 受阻塞的正确预期 it.skip：多字节 bigint + 超 int32 int64 混合步骤（锚定 #06-04-1/#06-04-2）
  - G-06-03-A 受阻塞的正确预期 it.skip：4 朝向 code/id 复用同一 prefab 生成 4 个独立怪物（锚定 #06-03-1）
  - 06-COVERAGE-MAP.md 06-12 小节（缺口 → 用例 → 文件 → 计划 映射）
affects: [06-verify-work, 06-unit-tests 缺口收口]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 2240
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "受阻塞缺口：按正确预期编写 + it.skip + 中文注释锚定 06-TEST-FINDINGS.md 既有条目，保持 pnpm test:ci 全绿（D-05/D-46）"
    - "读流与按索引读回的索引语义差异（index = position + 1 vs index = i）用 toMatchObject 只比较 command/params"

key-files:
  created: []
  modified:
    - packages-user/data-common/src/replay/array.test.ts
    - packages-user/data-base/src/enemy/manager.test.ts
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md

key-decisions:
  - "G-06-04-B 只比较 command/params（不整体 toEqual），规避读流 index = position + 1 与 get index = i 的 ±1 差异"
  - "G-06-04-A / G-06-03-A 复用既有 #06-04-1/#06-04-2/#06-03-1 锚点，不新建 #06-12-N 条目（无新疑似 bug）"
  - "删除首步（delete(0)）为当前可用路径（#06-04-3 仅阻塞中间删除），据此覆盖异质序列删除后的读回"

patterns-established:
  - "异质序列读回：内联 heterogeneousSteps 期望表 + 文件内 expectHeterogeneousRead 复用同一份期望"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "G-06-04-B：异质多命令序列读回（6 条命令、参数个数与类型各异，含 uint16 加宽与删除首步）可跑绿"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads back a heterogeneous command sequence through both the stream and get"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads back the heterogeneous sequence after widening to uint16"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads back a heterogeneous sequence after deleting its first step"
        status: pass
    human_judgment: false
  - id: D2
    description: "G-06-04-A：多字节 bigint 与超 int32 int64 混合步骤的正确预期已登记，但受 #06-04-1/#06-04-2 阻塞只能 it.skip"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#round-trips a heterogeneous step mixing a multi-byte bigint and an int64 value (it.skip)"
        status: unknown
    human_judgment: true
    rationale: "受阻塞缺陷 #06-04-1/#06-04-2 未修复，用例为正确预期 it.skip，跳过不代表通过；需人工确认是否进入修复批次。"
  - id: D3
    description: "G-06-03-A：4 朝向复用同一 prefab 生成 4 个独立怪物的正确预期已登记，但受 #06-03-1 阻塞只能 it.skip"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/enemy/manager.test.ts#creates four independent enemies from one prefab reused by four facing codes (it.skip)"
        status: unknown
    human_judgment: true
    rationale: "受阻塞缺陷 #06-03-1（createEnemy/createEnemyById 未走复用映射）未修复，用例为正确预期 it.skip，跳过不代表通过；需人工确认是否进入修复批次。"

duration: 13min
completed: 2026-09-15
status: complete
---

# Phase 06 Plan 12: 录像与 enemy 模型覆盖缺口补测 Summary

**按 D-43 三阶段补齐 G-06-04-B（异质多命令序列读回，可跑绿）、G-06-04-A（多字节 bigint/int64 正确预期 it.skip）、G-06-03-A（四朝向复用同一 prefab 生成独立怪物正确预期 it.skip），仅改测试与覆盖表，无生产代码改动。**

## Performance

- **Duration:** 13min
- **Started:** 2026-09-15T02:30:00Z
- **Completed:** 2026-09-15T02:44:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- **G-06-04-B（可跑绿）**：`array.test.ts` 新增 6 条参数个数与类型各异的录像命令（单 int、boolean + 短 string、空参数、单字节 bigint、多 int、长 string + float），经 `createReadStream` 与 `get` 逐条读回一致，并覆盖加宽到 `Uint16` 后的读回与**删除首步**后的读回。
- **G-06-04-A（正确预期 skip）**：新增 `it.skip` 覆盖「多字节 bigint + 超 int32 int64 + boolean + string 混在同一步」，锚定既有 `#06-04-1`/`#06-04-2`；既有两条同锚点 skip 保持不变（未取消 skip、未弱化为通过）。
- **G-06-03-A（正确预期 skip）**：`manager.test.ts` 新增 `it.skip` 覆盖「4 个朝向 code（100..103）/id 复用同一 prefab → `createEnemy`/`createEnemyById` 各生成 4 个互相独立且与模板独立的怪，改一只不影响其余三者与模板」，锚定既有 `#06-03-1`；既有同锚点 skip 不变。
- `06-COVERAGE-MAP.md` 以 create-or-append 方式追加 06-12 小节（缺口 → 用例 → 文件 → 计划），未重写他节。

## Task Commits

Each task was committed atomically:

1. **Task 1: 阶段 1（构件级）G-06-04-B 异质录像序列读回** - `0a7f253` (test)
2. **Task 2: 阶段 2（组合）G-06-04-A 正确预期 skip** - `5734025` (test)
3. **Task 3: 阶段 3（完整）G-06-03-A 正确预期 skip + 覆盖表** - `e2c1638` (test)

**Plan metadata:** _(docs: complete 06-12 plan — 见最终提交)_

## Files Created/Modified

- `packages-user/data-common/src/replay/array.test.ts` - 新增 `heterogeneousSteps` 期望表与文件内 `expectHeterogeneousRead`；新增 3 条可跑绿用例（异质序列读回、uint16 加宽读回、删除首步读回）+ 1 条组合正确预期 `it.skip`
- `packages-user/data-base/src/enemy/manager.test.ts` - reuse mapping 分区新增 1 条四朝向复用生成独立怪物的正确预期 `it.skip`
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` - create-or-append 06-12 小节

## Decisions Made

- **只比较 `command`/`params`**：`createReadStream` 读回的 `index` 为位置 + 1，而 `get(i)` 的 `index === i`，故用 `toMatchObject({ command, params })`，避免整体 `toEqual` 的 ±1 差异（plan 明确要求）。
- **删除首步可用**：`delete(0)` 是当前可用路径（`#06-04-3` 仅阻塞中间删除），据此覆盖异质序列删除后的读回，未触碰既有 `it.skip`。
- **复用既有 finding 锚点**：本计划未发现新疑似 bug，不新建 `#06-12-N` 条目；两个受阻塞缺口锚定既有 `#06-04-1`/`#06-04-2`/`#06-03-1`。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. 三阶段均先跑绿再进入下一阶段，未出现阻断后续阶段的 bug。

## Verification Evidence

- **阶段 1 聚焦运行**：`pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts` → 1 file passed / 32 passed / 4 skipped。
- **阶段 2 聚焦运行**：同文件 → 32 passed / 5 skipped（新增 1 条 skip，既有 4 条 skip 锚点不变）。
- **阶段 3 聚焦运行**：`pnpm exec vitest run packages-user/data-base/src/enemy/manager.test.ts` → 1 file passed / 17 passed / 2 skipped（新增 1 条 skip）。
- **D-44 门禁（每次提交前）**：
  - `pnpm exec eslint --fix <改动文件>` 后 `pnpm exec eslint <改动文件>` → exit 0（3 次均 0 错误）。
  - `pnpm exec vue-tsc --noEmit` 输出按改动测试文件路径过滤 → 0 匹配（`replay/array.test.ts`、`enemy/manager.test.ts`）；全局既有无关错误 27 条不在本门禁范围。
  - `pnpm test:ci` → 全绿：执行前 66 文件 / 641 通过 / 20 跳过；阶段 1 后 644 通过 / 20 跳过；阶段 2 后 644 通过 / 21 跳过；阶段 3 后 **644 通过 / 22 跳过**（新增 3 通过 + 2 skip，无失败）。
- **变更范围**：`git status` 仅显示两个 `*.test.ts` 与 `06-COVERAGE-MAP.md`；无生产/核心源码改动。

## Known Stubs

None - 无桩代码；两条 `it.skip` 为受阻塞缺口的正确预期登记（D-05/D-46），已登记于 `06-TEST-FINDINGS.md` 既有条目 `#06-04-1`/`#06-04-2`/`#06-03-1`。

## Next Phase Readiness

- 06-04（录像）与 06-03（enemy 数据模型）人工评审发现的覆盖缺口（G-06-04-A/B、G-06-03-A）已全部收口。
- 后续若修复 `#06-04-1`/`#06-04-2`/`#06-03-1`，需取消对应 `it.skip` 并转为可跑绿回归用例（D-05）。

## Self-Check: PASSED

- FOUND: .planning/phases/06-unit-tests/06-12-SUMMARY.md
- FOUND: 0a7f253 (Task 1)
- FOUND: 5734025 (Task 2)
- FOUND: e2c1638 (Task 3)

---
*Phase: 06-unit-tests*
*Completed: 2026-09-15*
