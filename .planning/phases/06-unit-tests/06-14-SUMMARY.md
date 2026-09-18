---
phase: 06-unit-tests
plan: 14
subsystem: testing
tags: [vitest, replay, read-stream, data-common, gap-fill, g-06-04-c]

# Dependency graph
requires:
  - phase: 06-unit-tests (06-04)
    provides: ReplayArray 读流/编解码行为单测与 #06-04-1..4 缺陷锚点
  - phase: 06-unit-tests (06-12)
    provides: 异质命令序列读回基线（G-06-04-B）与 #06-04-3/#06-04-4 既有 skip
provides:
  - G-06-04-C/A —— 仅经 createReadStream 的 7 命令复杂序列逐条类型/值/索引验证（含中间起始索引）
  - G-06-04-C/B —— expectHeterogeneousRead 强化（每参数 typeof+值、流索引 i+1、末尾 null 与 index===length）
  - 序列变更后既有读流 expired===true + 告警码 155 + 新建读流按新次序类型化读回
  - 2 条受阻塞的正确预期 it.skip（异质序列 delete 中间步 #06-04-3、insert 后新次序 #06-04-4）
  - 06-COVERAGE-MAP.md 06-14 小节（G-06-04-C/A、B 与两条 skip 的缺口→用例→文件→计划映射）
affects: [06-verify-work, phase 6 gap-fill batch, replay read-stream future fixes for #06-04-3/#06-04-4]

# Actuals (#2632) — same scale as the plan `estimate` (chars/4 over the realized diff).
actuals:
  tokens: 3142
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 文件内联 expectParamTyped/expectStepTyped 做 typeof + toBe 双重断言（避免 toMatchObject 宽松比较掩盖类型混淆）
    - 文件内联 expectRouteStream 仅经读取流逐条验证异质序列（不含 get 对照）
    - 读流索引语义 = position + 1；get 索引语义 = i；两者只按 command/params 对应，不整体 toEqual

key-files:
  created: []
  modified:
    - packages-user/data-common/src/replay/array.test.ts
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md

key-decisions:
  - "严格区分读流与 get 的索引语义：read() 的 index = position + 1、get(i) 的 index = i，仅按 command/params 对应，不对整体对象做 toEqual/toEqual 比较"
  - "可跑绿用例只使用当前可正确编解码的参数（bigint 限单字节 0..127、整数限 int32），多字节 bigint 与超 int32 的 int64 一律 it.skip（锚定 #06-04-1/#06-04-2）"
  - "A 用例体内不出现 array.get(...)，把读取流提升为一等验证对象（用户明确「录像系统应重点验证读取流」）"
  - "强化既有 expectHeterogeneousRead 而非新增并行 helper，使 3 条既有复用用例一并受益"
  - "受阻塞的增删次序（#06-04-3/#06-04-4）复用既有锚点、不新建 #06-14-N 条目（本计划未发现新缺陷）"

patterns-established:
  - "读取流类型化读回：expectStepTyped(step, command, params, index) 逐参数 typeof+值 + 索引断言"
  - "变更后过期语义：add/insert/delete/set/setCommandWidth 后旧读流 expired===true，读过期流告警 155，新建流按新次序读回"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "G-06-04-C/A —— 7 条异质命令（参数个数 1/2/0/1/4/2/3）仅经 createReadStream 逐条读回，逐参数断言类型与值、流索引 1..7 递进、末尾 null，并覆盖中间起始索引读取"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads a heterogeneous route exclusively through a read stream"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#starts a complex route read stream at a middle index"
        status: pass
    human_judgment: false
  - id: D2
    description: "G-06-04-C/B —— 既有流断言强化（expectHeterogeneousRead 每参数类型+值、流索引 i+1、末尾 null 与 index===length；两条既有流用例补每参数 typeof 与 stream.index 递进）"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads back a heterogeneous command sequence through both the stream and get"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads a sequence of steps through a read stream"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#expands buffers and still reads every step back"
        status: pass
    human_judgment: false
  - id: D3
    description: "G-06-04-C/B —— 复杂序列 add 变更后既有读流 expired===true 且读过期流告警 155，新建读流按新次序 7 步类型化读回"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#expires a read stream after the heterogeneous route is mutated"
        status: pass
    human_judgment: false
  - id: D4
    description: "G-06-04-C 附带 —— 异质序列 delete 中间步 / insert 后的流读次序以正确预期 it.skip 登记（锚定 #06-04-3/#06-04-4），既有 5 条 skip 不变"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads the new order after deleting a middle step from a heterogeneous route (it.skip)"
        status: unknown
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads the new order after inserting a step into a heterogeneous route (it.skip)"
        status: unknown
    human_judgment: true
    rationale: "两条用例为受生产缺陷 #06-04-3/#06-04-4 阻塞的正确预期 it.skip，修复前无法自动跑绿；取消 skip 的时机需人工确认修复批次后再定"

duration: 12min
completed: 2026-09-15
status: complete
---

# Phase 6 Plan 14: 录像读取流专项验证补齐（G-06-04-C）Summary

**把 ReplayArray 读取流提升为一等验证对象：仅经 createReadStream 逐条断言 7 命令异质序列的每参数类型/值与索引递进，并覆盖变更后过期（告警 155），受代码缺陷阻塞的增删次序以正确预期 `it.skip` 登记**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-15T11:38:52Z
- **Completed:** 2026-09-15T11:50:53Z
- **Tasks:** 3/3
- **Files modified:** 2

## Accomplishments

- **阶段 1（构件级，G-06-04-C/A）**：新增 2 条可跑绿用例。`reads a heterogeneous route exclusively through a read stream` 内联构造 7 条命令（参数个数 1/2/0/1/4/2/3；int8 / boolean+短 string / 无参 / 单字节 bigint / int8+int32+int8+float / 长 string type 7 + boolean / 空 string type 7 + int8 边界），**仅经 `createReadStream(0)`** 逐条读回，逐参数 `typeof`+`toBe`、流索引 `1..7` 递进、末尾 `null` 且 `stream.index === 7`；`starts a complex route read stream at a middle index` 覆盖 `createReadStream(3)`（原第 4..7 步、索引 4..7）与 `createReadStream(6)`（末步、索引 7）。用例体内**无 `array.get(...)`**。
- **阶段 2（组合，G-06-04-C/B）**：文件内新增 `expectParamTyped`/`expectStepTyped`；重写 `expectHeterogeneousRead`（3 条既有用例共享受益）为每参数类型+值、流索引 `i+1`、末尾 `stream.index === expectedSteps.length` 与 `null`；`reads a sequence of steps through a read stream` 与 `expands buffers and still reads every step back` 补每参数 `typeof`/值 与 `stream.index` 递进；新增 `expires a read stream after the heterogeneous route is mutated`（`add` 变更后旧流 `expired === true`、读过期流告警 **155**、新建读流按 7 步新次序类型化读回）。
- **阶段 3（完整/收口）**：新增 2 条**正确预期 `it.skip`**（异质序列 `delete(1)` 后剩余 5 步 / `insert(2, 9, [true, 5])` 后新次序 7 步；锚定既有 `#06-04-3`/`#06-04-4`），`it.skip` 由 5 条增至 7 条，既有 5 条的数量/锚点/体不变；`06-COVERAGE-MAP.md` 以 create-or-append 追加 06-14 小节。

## Task Commits

Each task was committed atomically:

1. **阶段 1（构件级）：G-06-04-C/A 仅经读取流的复杂序列验证** - `8ae4588` (test)
2. **阶段 2（组合）：G-06-04-C/B 强化既有流断言 + 变更后 expired** - `2cffe3e` (test)
3. **阶段 3（完整/收口）：增删后异质序列流读次序 skip + 06-14 覆盖表小节** - `83dc4fd` (test)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified

- `packages-user/data-common/src/replay/array.test.ts` — 新增文件内 helper `expectParamTyped`/`expectStepTyped`/`expectRouteStream` 与 `complexRouteSteps`/`createComplexArray`；新增 3 条可跑绿用例 + 2 条正确预期 `it.skip`；强化 `expectHeterogeneousRead` 与 2 条既有流用例（+184/-9）
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` — create-or-append 追加 06-14 小节（+16）

## Decisions Made

- 读流与 `get` 的索引语义严格区分：`read()` 的 `index = position + 1`、`get(i)` 的 `index = i`；两者之间只按 `command`/`params` 对应，不对整体对象做相等比较。
- 可跑绿用例限定在当前可正确编解码的参数范围（bigint 限单字节 0..127、整数限 int32）；多字节 bigint 与超 int32 的 int64 仍 `it.skip`（`#06-04-1`/`#06-04-2`），不把受阻塞缺口伪装成失败用例。
- 强化既有 `expectHeterogeneousRead` 而非新增并行 helper，使 3 条复用它的既有用例一并获得断言语义提升，且不改动这些用例的覆盖目标。
- 受阻塞增删次序复用既有锚点（`#06-04-3`/`#06-04-4`），本计划**不新建** `#06-14-N` finding 条目。

## Deviations from Plan

None — plan executed exactly as written.

（实现期唯一修正：`expectStepTyped` 的入参类型初版漏写 `index`，导致 `vue-tsc` 在该文件报 `TS2339`；随即补上 `index: number` 字段，属阶段 1 内的即时自纠，未改变计划语义，未产生额外提交。）

## Issues Encountered

- 计划推断的 5 个既有 `it.skip` 锚点与文件实际完全一致（`#06-04-3`/`#06-04-4`/`#06-04-2`/`#06-04-1` ×2），无需调整。
- `#06-04-3`/`#06-04-4` 对应的生产缺陷（`delete` 回退循环用 `paramStart` 当命令索引、`insert` 参数位移方向相反）在 `array.ts` 中仍然存在，故两条新 skip 保持 skip 状态（未发现已被后续修复批次解决）。

## D-44 Quality Gate Results

| 阶段 | `eslint --fix` | `eslint <改动文件>` | `vue-tsc`（按文件路径过滤） | 聚焦运行 | `pnpm test:ci` |
| --- | --- | --- | --- | --- | --- |
| 1 | exit 0 | 0 错误 | 0 类型错误（全局既有无关错误 27 条不变） | 34 passed / 5 skipped | 66 文件 / **648 passed** / 25 skipped |
| 2 | exit 0 | 0 错误 | 0 类型错误（27） | 35 passed / 5 skipped | 66 文件 / **649 passed** / 25 skipped |
| 3 | exit 0 | 0 错误 | 0 类型错误（27） | 35 passed / 7 skipped | 66 文件 / **649 passed** / **27 skipped** |

`git status` 仅含 `packages-user/data-common/src/replay/array.test.ts` 与 `06-COVERAGE-MAP.md`；无生产/核心源码改动，无 06-01..06-13 计划改动。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- G-06-04-C（A + B）补齐完成；`06-COVERAGE-MAP.md` 06-14 小节已落地。
- `#06-04-3`/`#06-04-4` 修复批次可取消对应 2 条 skip 转为回归用例（修复后剩余 5 条 `it.skip` 不变）。
- `06-TEST-FINDINGS.md` 无新增 `#06-14-N` 条目（本计划未发现新疑似缺陷）。

---
*Phase: 06-unit-tests*
*Completed: 2026-09-15*

## Self-Check: PASSED

- FOUND: `.planning/phases/06-unit-tests/06-14-SUMMARY.md`
- FOUND: `packages-user/data-common/src/replay/array.test.ts`
- FOUND: commit `8ae4588`（阶段 1）
- FOUND: commit `2cffe3e`（阶段 2）
- FOUND: commit `83dc4fd`（阶段 3）
