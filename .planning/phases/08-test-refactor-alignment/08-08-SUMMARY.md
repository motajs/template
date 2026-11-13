---
phase: 08-test-refactor-alignment
plan: 08
subsystem: data-state/testing
tags:
    [
        test-alignment,
        data-state,
        replay,
        CoreState,
        MapState.fromRaw,
        ReplayCommandResult,
        vitest,
        D-10
    ]
status: complete
requires:
    - phase: 08-test-refactor-alignment/08-01
      provides: 测试文件迁入 __test__ 目录的基线
provides:
    - "data-state src 直属 9 个测试文件对齐 shipped 接口/形状（coreEventLayer 1 + enemy 6 + event 1 + replay 1）；聚焦 9 files / 98 passed / 0 failed、eslint 0"
    - "统一 CoreState 装配约定：new CoreState({ loadStarter: new WebLoadStarter(), coreURL: 'placeholder' })"
    - "coreEventLayer.test.ts 重定向到 MapState.fromRaw（真实事件层装配），保留原断言意图"
    - "commands.test.ts 期望值对齐 ReplayCommandResult（Success/Failed），并随 Task 1 提交用户已修复的 commands.ts 命令断言生产改动"
affects:
    - packages-user/data-state/src
tech-stack:
    added: []
    patterns:
        - "CoreState 测试装配：new CoreState({ loadStarter: new WebLoadStarter(), coreURL: 'placeholder' })，loadStarter 来源 @motajs/loader"
        - "失效的 createCoreState 工厂 / initMapState 已删；事件层装配经 MapState.fromRaw(raw) 真实验证，不用 Object.create/as never 伪造"
        - "录像命令结果断言使用 ReplayCommandResult.Success/Failed（enum），不再用布尔"
        - "单步沙箱经 shipped step() 惰性预读首步，不再手动置 playing=true/pausing=false"
key-files:
    created: []
    modified:
        - packages-user/data-state/src/__test__/coreEventLayer.test.ts
        - packages-user/data-state/src/event/__test__/event.test.ts
        - packages-user/data-state/src/replay/__test__/commands.test.ts
        - packages-user/data-state/src/replay/commands.ts
decisions:
    - "Q1=(a)：loadStarter 夹具用 new WebLoadStarter()（@motajs/loader），对齐 ins.ts:11-14 参考实例，零新依赖、零新命名"
    - "Q2=A1：coreEventLayer.test.ts 重定向到 MapState.fromRaw，保留「事件层被选为事件层、其余层序/zIndex 不变、静态矩阵与参考基准一致」的原断言意图，不退役该文件"
    - "Q3：event.test.ts 采用 CoreState 带 config 构造 + addLayer('<alias>') + setFloor(真实 IGameMap)；并加 Map.getOrInsert/getOrInsertComputed polyfill"
    - "Q4：删除 vi.mock('../legacy', ...) / vi.mock('../enemy', ...) 及失效的 Object.create(FakeMapState) 骨架"
    - "D1：Task 2 零改动——6 个 enemy 测试不构造 CoreState，已绿且 eslint 干净"
    - "生产漂移（用户已自行修复）：commands.ts 的 assertParameter 返回布尔 true/false、ReplayEquip.paramTypes[2]='boolean'；随 Task 1 提交"
    - "期望值改写（用户授权）：commands.test.ts 期望由 true/false 改为 ReplayCommandResult.Success/Failed，对齐 shipped IReplayCommand.execute 契约"
    - "commands.ts 既有 // Parameter: 注释经用户明确授权改为 JS typeof 语义（int8/int16→number、bool→boolean），不涉逻辑"
requirements-completed: [TEST-02]
actuals:
    tokens: 5516
    tasks: 2
    commits: 2
    plan_head_before: 46cad94aff8fa7f3004930b9eee14db7033423d4
coverage:
    - id: D1
      description: "data-state src 直属 9 个测试文件对齐 shipped 接口/形状，聚焦 0 失败、eslint 0"
      requirement: TEST-02
      verification:
          - kind: unit
            ref: "pnpm exec vitest run packages-user/data-state/src/__test__ packages-user/data-state/src/enemy/__test__ packages-user/data-state/src/event/__test__ packages-user/data-state/src/replay/__test__ — 9 files / 98 passed / 0 failed"
            status: pass
          - kind: other
            ref: "pnpm exec eslint packages-user/data-state/src/__test__ packages-user/data-state/src/enemy/__test__ packages-user/data-state/src/event/__test__ packages-user/data-state/src/replay/__test__ — 0 errors"
            status: pass
      human_judgment: false
    - id: D2
      description: "CoreState 装配约定统一（loadStarter=WebLoadStarter + coreURL）+ commands 结果对齐 ReplayCommandResult"
      requirement: TEST-02
      verification:
          - kind: unit
            ref: "coreEventLayer/event/commands 三文件聚焦 3 files / 26 passed / 0 failed"
            status: pass
      human_judgment: false
duration: 30min
completed: 2026-10-07
---

# 08-08 — data-state src 测试对齐（CoreState 装配约定）Summary

**一句话：** 将 `packages-user/data-state` 的 `src/` 直属 9 个测试文件对齐 shipped 接口/形状——统一 `new CoreState({ loadStarter: new WebLoadStarter(), coreURL: 'placeholder' })` 装配、`coreEventLayer.test.ts` 重定向到真实 `MapState.fromRaw`、`event.test.ts` 改 `addLayer('event')`/`setFloor(真实地图)`、`commands.test.ts` 期望对齐 `ReplayCommandResult`——并随 Task 1 提交用户已自行修复的 `commands.ts` 命令断言生产改动；聚焦 **9 files / 98 passed / 0 failed**、eslint **0 报错**。

## Task 0 裁决（Q1–Q4 + D1，已 RESOLVED）

- **Q1=(a)**：`loadStarter` 夹具形态用 `new WebLoadStarter()`（`@motajs/loader`），对齐 `core.ts` 的 `ICoreStateConfig` 与 `ins.ts:11-14` 参考实例；零新依赖、零新命名。
- **Q2=A1**：`coreEventLayer.test.ts` **重定向**到 `MapState.fromRaw(raw)`（单参 raw 对象），保留原「选择 event alias 图层、五层序/zIndex 0/10/20/30/40 不变、静态矩阵与 `compareWith` 参考基准一致」的断言意图；**不退役**该文件。
- **Q3**：`event.test.ts` 采用 `CoreState` 带 config 构造、`map.addLayer('event')`（替代无参 `addLayer()`）、`state.hero.location.setFloor(map)`（传真实 `IGameMap`，替代 `setFloor('F1')` 字符串）；并加 `Map.prototype.getOrInsert`/`getOrInsertComputed` polyfill（Node 环境缺失）。
- **Q4**：删除 `vi.mock('../legacy', ...)`、`vi.mock('../enemy', ...)` 及失效的 `Object.create(FakeMapState)` 假骨架（`legacy/` 模块已不存在、`initMapState` 已删）。
- **D1**：Task 2 为零改动——6 个 `enemy/__test__` 文件不构造 `CoreState`，已全绿且 eslint 干净。

## 生产漂移关卡（已 RESOLVED，用户自行修复）

用户在并发工作中已修复 `packages-user/data-state/src/replay/commands.ts` 的两处回归，并指示随 Task 1 提交：

- `BaseReplayCommand.assertParameter` 由返回 `ReplayCommandResult` 枚举改为返回布尔 `true`/`false`（旧写法的 `Success=0` 为假值导致 `!assertParameter(...)` 恒真、校验结果反转）。
- `ReplayEquip.paramTypes` 第 3 项由 `'ReplayCommandResult'` 改为 `'boolean'`（参数类型按 JS `typeof` 动态判定）。
- 命令测试期望值随之对齐 `ReplayCommandResult.Success`/`Failed`（见台账），**未**断言旧/反转的枚举行为，亦未弱化断言或删用例。

## 期望值改写台账

| 文件 | 旧 → 新 | 依据 |
| --- | --- | --- |
| `commands.test.ts` | 命令 `execute`/`finalize` 结果 `true` → `ReplayCommandResult.Success`；`false` → `ReplayCommandResult.Failed`（含 `Promise.all(invalid)` 8 项） | shipped `IReplayCommand.execute(): Promise<ReplayCommandResult>`（`data-common/src/replay/types.ts:71`）；`Success=0`/`Failed=1` |
| `commands.test.ts` | `let result: boolean \| undefined` → `ReplayCommandResult \| undefined`（2 处） | 同上 |
| `commands.test.ts` | 沙箱单步用例删除 `as IManualReplaySandbox` + `sandbox.playing=true`/`pausing=false` 手动置位 | shipped `step()` 在 `!playing && !ended` 时惰性预读首步（`sandbox.ts:297-304`），手动置 `playing=true` 会跳过预读致 `appendingStep=null` |
| `commands.ts` | `// Parameter:` 注释 `int16`/`int8` → `number`、`bool` → `boolean`（4 处；`:93` 空参不变） | 参数类型经 JS `typeof` 动态判定，非存储层硬编码类型 |

## 门禁证据

- **聚焦运行（Task 2 全量）**：`pnpm exec vitest run packages-user/data-state/src/__test__ packages-user/data-state/src/enemy/__test__ packages-user/data-state/src/event/__test__ packages-user/data-state/src/replay/__test__` → **Test Files 9 passed（9）；Tests 98 passed（98）**（0 failed）。
- **Task 1 子集**：`…/__test__ …/event/__test__ …/replay/__test__` → **3 files / 26 passed / 0 failed**。
- **eslint**：对四个测试目录（含 `enemy/__test__`）→ **0 报错**（`coreEventLayer.test.ts` 首轮的 LF/折行 prettier 违例已由 `eslint --fix` 修净并转为 CRLF）。
- **生产改动范围**：仅 `packages-user/data-state/src/replay/commands.ts`（用户已修复的布尔断言 + 用户授权的 4 处 `// Parameter:` 注释）；其余生产文件零改动。
- **skip 计数**：未新增/未删除任何 `it`；`data-state/src` 测试内 `.skip`/`.todo` 计数为 0；仓库级 skipped 仍为 1（基线未变）。

## 并发保护（D-08）

未触碰、未暂存、未提交任何用户并发改动（`packages-user/client-*`、`packages/system/src/ui/*` 等）。每个任务仅以显式路径 `git add` 声明文件；从未使用 `git add -A` / `git add .`。

## Task Commits

1. **Task 1: coreEventLayer + event + commands 对齐** - `1ef95cd` (test)
   - 含生产 `commands.ts`（用户已修复的布尔断言 + 授权注释）与 3 个测试文件对齐。
2. **Task 2: data-state src/enemy 6 文件对齐 + 提交前门禁** - 无提交（零改动；仅运行门禁并通过）。

**Plan metadata:** 见下方「Metadata commit」。

## Files Created/Modified

- `packages-user/data-state/src/__test__/coreEventLayer.test.ts` — 重定向到 `MapState.fromRaw` 真实验证事件层装配；删除失效 mock/`Object.create` 骨架。
- `packages-user/data-state/src/event/__test__/event.test.ts` — `CoreState` 带 config 构造、`addLayer('event')`、`setFloor(map)`；`Map` polyfill。
- `packages-user/data-state/src/replay/__test__/commands.test.ts` — `CoreState` 带 config 构造；期望值对齐 `ReplayCommandResult`；沙箱单步用例改用 shipped `step()` 预读。
- `packages-user/data-state/src/replay/commands.ts` — 用户已修复的 `assertParameter` 布尔返回 + `paramTypes[2]='boolean'`；4 处 `// Parameter:` 注释改为 JS `typeof` 语义。

## Decisions Made

见 frontmatter `decisions`（Q1–Q4 + D1 + 生产漂移 + 期望值改写台账）。

## Deviations from Plan

### 1. [用户授权 · 生产提交] 随 Task 1 提交用户已修复的 `commands.ts`

- **Found during:** Task 1（commands 对齐）。
- **Issue:** 计划 must_haves 写「零生产改动」，但 `commands.ts` 的两处回归（`assertParameter` 返回枚举致校验反转、`ReplayEquip.paramTypes[2]` 为 `'ReplayCommandResult'` 致始终类型不符）使 `commands.test.ts` 无法转绿；用户已自行修复并明确授权随 Task 1 提交。
- **Fix:** 以显式路径暂存 `packages-user/data-state/src/replay/commands.ts`（含用户修复）与对齐后的 `commands.test.ts` 一并提交。
- **Files modified:** `packages-user/data-state/src/replay/commands.ts`
- **Committed in:** `1ef95cd`（Task 1）。

### 2. [用户授权] 改写既有 `// Parameter:` 注释为 JS `typeof` 语义

- **Found during:** Task 1（commands 注释核对）。
- **Issue:** 既有注释写 `int16`/`int8`/`bool`（存储层类型），而 `assertParameter` 实际以 JS `typeof` 判定，注释与实现语义不符。
- **Fix（用户明确授权）:** `:132` `[number x, number y]`、`:157` `[number item]`、`:184` `[number uid, number slot, boolean autoUnload]`、`:213` `[number slot]`；`:93` 空参不变。
- **Files modified:** `packages-user/data-state/src/replay/commands.ts`
- **Committed in:** `1ef95cd`（Task 1）。

### 3. [用户授权] 命令结果期望由布尔改为 `ReplayCommandResult`

- **Found during:** Task 1（commands 执行用例红灯）。
- **Issue:** 测试期望 `execute/finalize` 返回布尔 `true`/`false`，但 shipped 契约返回 `ReplayCommandResult`（`Success=0`/`Failed=1`）；用户修复布尔 `assertParameter` 后仍因返回类型不符而红灯。
- **Fix（用户授权）:** 期望值对齐 `ReplayCommandResult.Success`/`Failed`；**未**编码旧/反转枚举行为，**未**弱化断言、未删用例。
- **Files modified:** `packages-user/data-state/src/replay/__test__/commands.test.ts`
- **Committed in:** `1ef95cd`（Task 1）。

### 4. [Rule 1 - Bug] 沙箱单步用例跳过 shipped 首步预读

- **Found during:** Task 1（commands 沙箱用例红灯）。
- **Issue:** 用例手动置 `sandbox.playing=true/pausing=false`，使 shipped `step()` 的惰性预读分支（`!playing && !ended`）被跳过，`appendingStep` 恒为 `null`，`replayStep` 误判为「已播完」恒返回 false。
- **Fix:** 删除手动置位与不再需要的 `IManualReplaySandbox` 接口/断言类型转换，改用 shipped `step()` 自然预读。
- **Files modified:** `packages-user/data-state/src/replay/__test__/commands.test.ts`
- **Committed in:** `1ef95cd`（Task 1）。

### 5. [Rule 3 - Formatting] prettier 行尾/折行修正

- **Found during:** Task 1（提交前 eslint）。
- **Issue:** 上一轮工作树留下的 `coreEventLayer.test.ts` 为 LF 行尾且有一处折行违例，prettier（`.prettierrc` `endOfLine: crlf`）报 112 项。
- **Fix:** `eslint --fix` 将该文件转为 CRLF 并修正折行，纯格式、无语义变化。
- **Files modified:** `packages-user/data-state/src/__test__/coreEventLayer.test.ts`
- **Committed in:** `1ef95cd`（Task 1）。

---

**Total deviations:** 3 用户授权（生产提交、注释改写、期望值改写）+ 1 自动 bug 修复 + 1 自动格式修复。
**Impact on plan:** 生产改动严格限于 `commands.ts`（用户已修复 + 授权注释）；测试改动限于 3 个声明文件；enemy 6 文件零改动；未弱化断言、未删用例、零新增依赖、零新增 skip。

## Issues Encountered

- `commands.test.ts` 期望值与 shipped `ReplayCommandResult` 契约不符是本次主因；经用户授权后按枚举对齐，未改生产返回值。
- 沙箱单步用例的红灯根因是测试手动置位绕过 shipped 预读，属测试侧适配（Rule 1），非生产缺陷。

## Known Stubs

None。

## Threat Flags

None——未引入新的网络/鉴权/文件访问/信任边界表面；`T-08-08-01..04/SC` 缓解均满足（A1 用真实 `fromRaw` 而非伪造、未删用例/未新增 skip、无未获批新命名、未提交用户并发改动、未安装任何包）。

## Metadata commit

`docs(08-08): complete data-state src alignment plan`（记录 SUMMARY/STATE/ROADMAP/REQUIREMENTS）。

## Next Phase Readiness

- `data-state` src 直属 9 文件对齐完成（98/98），统一了 `CoreState` 装配约定与 `ReplayCommandResult` 契约，为 08-09 的 `replayPlayback`/perf 等集成文件与后续计划复用铺路。
- 无阻塞。

---

*Phase: 08-test-refactor-alignment*
*Completed: 2026-10-07*

## Self-Check: PASSED

- FOUND: .planning/phases/08-test-refactor-alignment/08-08-SUMMARY.md
- FOUND: 1ef95cd (Task 1)
- N/A: Task 2 零改动，无提交
