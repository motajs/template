---
phase: 09-minimum-browser-runnable
plan: 23
subsystem: input
tags: [hotkey, keyboard, excitation, typescript, vitest]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-21 / 09-22 的构建与渲染端边界（新实现不接线 user 代码，仅提供 packages/system 内可用对象）
provides:
  - "packages/system/src/hotkey/command.ts：HotkeyCommand（IHotkeyCommand 实现）+ isAuxiliaryKey"
  - "packages/system/src/hotkey/system.ts：HotkeySystem（IHotkeySystem + IExcitable<number> 实现）"
  - "hotkey/index.ts 新增 command / system 导出；packages/system 新增 @motajs/animate workspace 依赖"
  - "logger.json warn 201–205 文案"
  - "command.test.ts / system.test.ts 共 60 条用例"
affects: [packages-user/client-base 的 IClientHotkey 接线（后续计划）, 键盘输入相关后续阶段]

# Actuals（与计划 estimate 同一把尺：chars/4 的已实现 diff，非 harness token 数）
actuals:
  tokens: 15236
  tasks: 2
  commits: 0
  plan_head_before: 7409a470370882a2eb18cceb638f22f6452a42e4

# Tech tracking
tech-stack:
  added:
    - "@motajs/animate（workspace:*，packages/system 依赖，用于 IExcitable / IExcitation）"
  patterns:
    - "组合匹配：KeyUp 走「辅助键 + 至多一个常规键」规则，KeyDown 类模式走 holding 子集规则"
    - "时序去定时器：全部时间来自 excited(payload)，待触发项在 flushPending 中按 payload 判定"
    - "延时触发不保存 context 快照：触发时用当前 holding 重新 createContext"
    - "作用域栈只让栈顶生效；enterScope / leaveScope / up 时统一 dropPending"

key-files:
  created:
    - packages/system/src/hotkey/command.ts
    - packages/system/src/hotkey/system.ts
    - packages/system/src/hotkey/__test__/command.test.ts
    - packages/system/src/hotkey/__test__/system.test.ts
  modified:
    - packages/system/src/hotkey/index.ts
    - packages/system/package.json
    - pnpm-lock.yaml
    - packages/common/src/logger.json

key-decisions:
  - "Task 0 汇报关卡由用户回复「可以执行」闭环；OI-1 / OI-2 / OI-3 / OI-4 / OI-5 按计划提议默认执行（命名未改动）"
  - "type.ts 核验后零改动（IHotkeySystem 已无 emit 成员）；hotkey.ts / keyboard.ts / keyCodes.ts 零改动"
  - "IExcitable<number> 只加在 HotkeySystem 类上，IHotkeySystem 接口不新增 excited 成员"
  - "Meta 映射只在 listen 内做本地 91 / 92 / 224 → KeyCode.Meta，keyCodes.ts 不改"
  - "delayed pending 不保存 context，flushPending 用触发时刻的 holding 重建"
  - "logger.json 只追加 warn 201–205 五行（逐字 OI-5），200 / 1001 及其它条目未动"
  - "master 计划 estimate.tokens=95000 为未校准估算（confidence: low）；实际 diff 约 15236 tokens"

patterns-established:
  - "addCommand 重复 id：warn 204 + 返回已有对象，不覆盖"
  - "block 只按当前作用域内已实现且实际触发的指令记录，匹配但无实现不阻断"
  - "KeyUp 非法组合只在 setKeyCombination（当前 KeyUp 模式）与 keyUp() 两个时机各发一次 203"

requirements-completed: []

coverage:
  - id: D1
    description: "HotkeyCommand 实现按键组合管理、四个模式方法与 203 告警"
    verification:
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/command.test.ts (12 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "HotkeySystem 实现指令注册表、作用域栈、KeyUp / KeyDown 派发与优先级 / block"
    verification:
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/system.test.ts (KeyUp / 作用域 / 优先级用例)"
        status: pass
    human_judgment: false
  - id: D3
    description: "激励驱动的 timeout / interval / dt 时序与待触发生命周期"
    verification:
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/system.test.ts (Once / Continuous / Throttle 用例)"
        status: pass
    human_judgment: false
  - id: D4
    description: "listen 映射（含 Meta 91/92/224）、repeat 跳过、preventDefault 与解绑"
    verification:
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/system.test.ts (listen 用例)"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-10-22
status: complete
---

# Phase 09 Plan 23: 新按键系统实现 Summary

**HotkeyCommand 与 HotkeySystem 落地：KeyUp / Once / Continuous / Throttle 四模式、作用域栈、优先级与 block、激励驱动的 timeout / interval / dt，以及 201–205 告警与 Meta 映射**

## Performance

- **Duration:** 约 12 min（含 Task 1 tracer + Task 2 扩展与本机门禁）
- **Started:** 2026-10-22T18:15:00+08:00
- **Completed:** 2026-10-22T18:27:00+08:00
- **Tasks:** 2（Task 0 为 blocking-human 关卡，已由用户「可以执行」闭环）
- **Files modified:** 8（4 新建实现/测试 + 4 修改）

## Accomplishments

- `HotkeyCommand`：组合数组深拷贝、`setKeys` 扩缩容、`setKeyCombination` / `getKeyCombination` / `iterateKeyCombinations`、四个模式方法；KeyUp 非法组合在两个时机各发一次 203。
- `HotkeySystem`：注册表（204 / 202 / 201）、作用域栈（201 / 205、仅栈顶生效）、`holding` 与上下文推导、KeyUp 四条规则、KeyDown 子集匹配、优先级降序与 block、`down` / `up` 布尔返回。
- 时序完全由 `excited(payload)` 驱动：`timeout` / `interval` / `dt` 无任何 `setTimeout` / `Date.now`；延时项在松键、作用域退出、模式切换时丢弃，并在触发时刻重算 context。
- `listen` 本地映射 91 / 92 / 224 → `KeyCode.Meta`、跳过 `repeat`、按返回值 `preventDefault`、`listen(null)` 解绑、同元素重复监听为空操作。
- `logger.json` warn 201–205 逐字落地；`packages/system` 声明 `@motajs/animate` 且 lockfile 由 pnpm 更新。
- 测试 60 条全绿（command 12 + system 48），每个 `it` 前均有说明注释。

## Files Created/Modified

- `packages/system/src/hotkey/command.ts`（新建）— `HotkeyCommand` 与 `isAuxiliaryKey`
- `packages/system/src/hotkey/system.ts`（新建）— `HotkeySystem` 与内部作用域 / 待触发结构
- `packages/system/src/hotkey/index.ts`（修改）— 追加 `./command` 与 `./system` 导出
- `packages/system/package.json`（修改）— 增加 `"@motajs/animate": "workspace:*"`
- `pnpm-lock.yaml`（修改）— `packages/system` 导入器新增 animate 链接（仅由 pnpm 生成）
- `packages/common/src/logger.json`（修改）— warn 段 `"200"` 与 `"1001"` 之间追加 201–205
- `packages/system/src/hotkey/__test__/command.test.ts`（新建）— 12 条指令对象用例
- `packages/system/src/hotkey/__test__/system.test.ts`（新建）— 48 条系统用例

## Decisions Made

- 按计划的 OI 提议默认执行：测试路径 `__test__/command.test.ts` / `system.test.ts`、辅助函数名 `isAuxiliaryKey`、内部命名清单（`IHotkeyScope` / `IHotkeyMatch` / `IHotkeyPending`、`HotkeyHandler` / `HotkeyListener`、私有 `command` / `combinations` 等）均未改动。
- OI-4 四条按提议落地：松键取消 KeyDown 类待触发项、同一事件同一指令取最小索引触发一次、空栈无参 `leaveScope()` 发 205、延时项 context 按触发时刻重算。
- OI-5 五条文案逐字写入 `logger.json`，既有条目（含 200 / 1001）一字未动。
- `type.ts` 核验后确认 `IHotkeySystem` 无 `emit` 成员，保持零改动；`IExcitable<number>` 仅加在类上。
- 旧实现 `hotkey.ts` / `keyboard.ts` 与 `keyCodes.ts` 零改动，由 LEGACY / SCOPE 闸门验证。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 测试伪事件的类型定义无法直接继承 KeyboardEvent**
- **Found during:** Task 1（类型闸门）
- **Issue:** `interface FakeKeyEvent extends KeyboardEvent` 把 `preventDefault` 收窄为 `Mock`，导致 TS2430，并让 `dispatch` 的参数不兼容。
- **Fix:** 将 `FakeKeyEvent` 改为仅含 `keyCode` / `repeat` / `preventDefault` 的独立接口，`FakeElement.dispatch` 在调用监听器时单次断言为 `KeyboardEvent`。
- **Files modified:** `packages/system/src/hotkey/__test__/system.test.ts`
- **Verification:** 类型闸门与 vitest 全绿。
- **Committed in:** 未提交（按执行指令保留在工作树）

---

**Total deviations:** 1 auto-fixed（Rule 1）
**Impact on plan:** 仅为测试伪事件类型修正，未改变实现语义与对外接口。

## Verification

- `cmd /c "pnpm exec vitest run .../command.test.ts .../system.test.ts"` → 2 files / 60 tests passed。
- `cmd /c "pnpm exec eslint <5 个 TS 文件>"`（Task 1）与 `eslint system.ts system.test.ts`（Task 2）→ 无输出、exit 0。
- STRUCTURE GATE → `OK structure: classes/exports/dependency/logger-201-205/tests`。
- MODE GATE → `OK mode gate: three KeyDown modes wired, excitation-driven timing, 48 system test cases`。
- TYPECHECK GATE（Task 1 / Task 2）→ hotkey 新文件无错误；`vue-tsc` exit 2，仅 `hotkey.ts` / `keyboard.ts` 各 1 条既有 legacy 诊断（基线 2 条）。
- LEGACY GATE → `hotkey.ts` / `keyboard.ts` / `type.ts` 相对 HEAD 零改动。
- SCOPE GATE（Task 1 后与 Task 2 末尾）→ 所有改动均命中 `files_modified`（9 项，用户既有 WIP 豁免）。
- prettier 仅作用于 5 个 TS 文件；`logger.json` / `package.json` / `pnpm-lock.yaml` 未传给 prettier。

## Known Boundaries

- 未接线 `packages-user/client-base/src/hotkey` 的 `IClientHotkey`（本计划只提供实现）。
- 未端到端运行 `build:game` / `build:packages`（渲染端仍有用户 WIP 的 stale import，沿用 09-21 / 09-22 记录）。
- `hotkey.ts` / `keyboard.ts` 的 2 条 legacy 类型错误保持原状，未修复。
- 未提供存档序列化（`type.ts` 第 4 行 TODO 保留）。
- 未新增 vitest 配置；`listen` 使用 Node 环境下的最小 fake 元素。
- **估算说明：** 计划 `estimate.tokens=95000` 为未校准估算（`confidence: low`）；本计划实际 diff 约 15236 tokens（chars/4），未按估算反推调整。

## Issues Encountered

- 无阻塞问题；仅有一次测试伪事件类型不兼容，已按 Rule 1 修正。

## Next Phase Readiness

- 新按键系统实现与测试已就绪，可从 `hotkey/index.ts` 取用 `HotkeyCommand` / `HotkeySystem`。
- 后续需要单独计划把 `IClientHotkey.system` 接到 `HotkeySystem` 实例，并补浏览器端集成验证。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-22*
