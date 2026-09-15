---
phase: 06-unit-tests
plan: 04
subsystem: testing
tags: [replay, vitest, data-common, ReplayArray, ReplaySystem, ReplaySandbox, logger-codes]

# Dependency graph
requires:
  - phase: 03-data-completion
    provides: Replay 指令注册/顺序契约与首分歧诊断契约（03-REPLAY-CONTRACT / 03-REPLAY-DIAGNOSTICS）
provides:
  - ReplayArray 全公开操作与多类型编解码的行为单测
  - ReplaySystem 注册/录制/沙箱生命周期单测
  - ReplaySandbox 播放器（step/play/pause/resume/stop）单测
  - 播放安全收集装饰器（func.ts）生命周期单测
  - 06-COVERAGE-MAP 06-04 小节（code 148–163、175）
  - 06-TEST-FINDINGS #06-04-1..4（int64 解码、多字节 bigint 编码、delete/insert 索引缺陷）
affects: [06-07 (完整播放/二次录制), 06-09 (存读档)]

# Actuals (#2632)
actuals:
  tokens: 10000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "录像编解码经公开 IReplayArray 表面断言，构造与 system.ts 一致的极小容量"
    - "数组扩容/读流/位宽切换经真实缓冲区断言，告警码经 logger.catch / vi.spyOn(logger,'warn') 观测"
    - "沙箱手动步进 cast 到 IManualReplaySandbox，真实计时器 + 有界 waitForEnded"
    - "疑似 bug 按正确预期编写 it.skip 并锚定 06-TEST-FINDINGS #06-04-N"

key-files:
  created:
    - packages-user/data-common/src/replay/array.test.ts
    - packages-user/data-common/src/replay/func.test.ts
    - packages-user/data-common/src/replay/system.test.ts
    - packages-user/data-common/src/replay/sandbox.test.ts
  modified:
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md
    - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md

key-decisions:
  - "按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）顺序执行，每阶段聚焦跑绿并过 D-44 才进入下一阶段"
  - "int64 / 多字节 bigint / delete 中间步 / insert 带参数组合 4 处编解码与编辑缺陷按 D-05 写正确预期 it.skip，只记录不修改核心代码"
  - "D-32 不测 ReplayArray.saveState/loadState；D-40 不做完整播放/二次录制，error 2001–2008 未触及"
  - "沙箱播放控制用真实计时器 + 有界 waitForEnded，所有循环有界以满足 T-06-04-02"

patterns-established:
  - "ReplayArray 单类型编解码矩阵：boolean/int8/int16/int32/float/bigint/短串/长串/多参数"
  - "Sandbox 手动 stepping harness：cast IManualReplaySandbox + 可兑现 deferred 驱动 play/pause/resume/stop"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "ReplayArray 全公开操作（add/insert/delete/set/get/createReadStream/rebuildIndexArray/setReplayArray/getCommandArray/getParamArray/setCommandWidth）与多类型编解码行为正确"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "读流/缓冲区组合、位宽切换与扩容行为正确，并观测告警码 149/150/154/155"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "ReplaySystem 注册/重复注册告警 163/record+onRecordCommand/沙箱创建与释放/实例独立性"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/system.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "ReplaySandbox 步进、失败即停、收尾与播放控制（step/play/pause/resume/stop），观测告警码 156/157/158/175"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/sandbox.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "播放安全收集装饰器生命周期（begin/嵌套/end/详情）与告警码 159/160/161/162"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/func.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "4 处疑似缺陷（#06-04-1..4）仅按 D-05 记录为正确预期 it.skip，未修复核心代码，需人工确认"
    requirement: "TEST-01"
    verification: []
    human_judgment: true
    rationale: "按阶段约束 D-07/D-05，缺陷只分析只登记、不得擅自修改核心代码；是否修复与修复方式需用户确认。"

duration: 26min
completed: 2026-09-14
status: complete
---

# Phase 06 Plan 04: 录像系统单测 Summary

**ReplayArray 全操作与多类型编解码、ReplaySystem 注册/录制、ReplaySandbox 播放器与播放安全装饰器的行为单测，覆盖 17 个告警码（148–163、175）并登记 4 处经 skip 锚定的核心编解码/编辑缺陷**

## Performance

- **Duration:** 26min
- **Started:** 2026-09-14T14:56:00Z
- **Completed:** 2026-09-14T15:22:00Z
- **Tasks:** 3（阶段 1 / 2 / 3）
- **Files modified:** 6（4 个测试文件 + 2 个规划文件）

## Accomplishments

- 新增 4 个同目录行为测试文件：`array.test.ts` / `func.test.ts` / `system.test.ts` / `sandbox.test.ts`，合计 **56 passed / 4 skipped**。
- `ReplayArray` 全公开操作与编解码覆盖：`add`/`insert`/`delete`/`set`/`get`/`createReadStream`/`rebuildIndexArray`/`setReplayArray`/`getCommandArray`/`getParamArray`/`setCommandWidth`；boolean、各整数位宽 + 浮点、bigint、string、多参数往返。
- `ReplaySystem`（注册/`getCommand`/`record`+hook/沙箱创建与释放/实例独立性）与 `ReplaySandbox`（`step`/`play`/`pause`/`resume`/`stop`/`finalizeLast`、失败即停）覆盖。
- 告警码覆盖 148–163、175 共 17 个，全部经 `logger.catch` / `vi.spyOn(logger,'warn')` 观测，写入 `06-COVERAGE-MAP.md` 06-04 小节。
- 登记 4 处疑似缺陷并关联正确预期 `it.skip`：`#06-04-1`（int64 解码乘数）、`#06-04-2`（多字节 bigint 编码）、`#06-04-3`（`delete` 索引回退）、`#06-04-4`（`insert` 参数位移方向）。
- 未修改任何生产/核心源码；仅新增 `*.test.ts` 与两个共享规划文件。

## Task Commits

Each task was committed atomically:

1. **阶段 1（构件级）：单类型编解码 + 单数组操作** - `dfe14b1` (test)
2. **阶段 2（组合/流水线）：读流/扩容 + 安全装饰器** - `8832159` (test)
3. **阶段 3（完整/集成）：ReplaySystem + ReplaySandbox** - `cb9c90a` (test)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `packages-user/data-common/src/replay/array.test.ts` — `ReplayArray` 单操作、编解码、读流/缓冲组合、扩容与位宽告警
- `packages-user/data-common/src/replay/func.test.ts` — 播放安全收集装饰器生命周期（159/160/161/162）
- `packages-user/data-common/src/replay/system.test.ts` — `ReplaySystem` 注册/录制/沙箱生命周期（163）
- `packages-user/data-common/src/replay/sandbox.test.ts` — `ReplaySandbox` 步进/收尾/播放控制（156/157/158/175）
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` — 追加 06-04 小节（148–163、175）
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` — 追加 `#06-04-1..4`

## Decisions Made

- 按 D-43 三阶段执行，阶段 1 的编解码缺陷不阻断阶段 2/3，故继续推进并逐条登记。
- 发现 4 处核心缺陷均只记录、不修复（D-05/D-07），测试按正确预期写 `it.skip`。
- 沙箱异步播放用真实计时器 + 有界 `waitForEnded`（1000 次 `setTimeout(0)`），满足威胁约束 T-06-04-02。

## Deviations from Plan

None - 计划按三阶段执行；除按约束将疑似缺陷写成 `it.skip` 外无偏离。

## Issues Encountered

执行中发现 4 处核心源码疑似缺陷（不属本计划修复范围，已登记）：

- `#06-04-1` `ReplayArray.get` int64 解码乘数误用 `2147483647`（应为 `2^31`）——`add(0,[2147483648])` 读回 `2147483647`。
- `#06-04-2` `normalizeParam` bigint 编码循环缺少按字节右移——多字节 bigint 只保留最低字节（`0x0102030405060708n` 读回 `8n`）。
- `#06-04-3` `ReplayArray.delete` 索引回退循环以参数字节偏移 `paramStart` 当作命令索引起点——`delete(1)` 后 `get(1).params` 得到 `[false]` 而非 `[30]`。
- `#06-04-4` `ReplayArray.insert` 的参数缓冲区 `copyWithin` 方向相反——带参数插入后后续步骤参数错位。

四条均不阻断后续阶段，故按阶段门禁规则继续；详见 `06-TEST-FINDINGS.md`。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 06-04 录像数组/系统/沙箱/安全装饰器行为单测就绪；06-07 可在其上做完整播放与二次录制比对（含 error 2001–2008）。
- 4 处编解码/编辑缺陷待用户确认是否修复；修复后取消对应 `it.skip` 转为回归用例。
- D-32：`ReplayArray`/录像存读档往返仍归 06-09。

## Self-Check: PASSED

- 4 个测试文件与 SUMMARY.md 均存在于磁盘。
- 3 个任务提交 `dfe14b1` / `8832159` / `cb9c90a` 均存在。

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*
