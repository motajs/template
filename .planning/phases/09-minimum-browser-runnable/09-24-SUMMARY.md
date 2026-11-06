---
phase: 09-minimum-browser-runnable
plan: 24
subsystem: input
tags: [hotkey, keyboard, excitation, typescript, vitest]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-23 的按键系统实现（command.ts / system.ts）与旧设计测试，作为本次修正的基线（3fd339f）
provides:
  - "system.ts：matchKeyUp 解构修正、无参 leaveScope 提前 return、pending 在匹配时刻捕获条件、excited 首次触发比较符修正"
  - "command.ts：setKeys(0) 合法化（仅负数与非整数告警 207）"
  - "system.test.ts：50 条用例（注册表 / 作用域 / KeyUp / holding / 优先级 / listen / 条件 / 时序）"
  - "command.test.ts：18 条用例（构造缺省 / 拷贝 / 206 / 207 / 203 / 读取与迭代 / 模式方法）"
affects: [packages-user/client-base 的 IClientHotkey 接线（后续计划）, 键盘输入相关后续阶段]

# Actuals（与计划 estimate 同一把尺：chars/4 的已实现 diff，非 harness token 数）
actuals:
  tokens: 15782
  tasks: 3
  commits: 0
  plan_head_before: 51bbc047c140cde1ab94d054ae49e47d96a73ef4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "条件（when）在按键组合匹配时刻求值并随 pending 保存，触发时刻只读捕获值，不再重新求值"
    - "条件为假不阻止建立待触发项；拦截只发生在 emit 首行与 up 的 block 循环两处"
    - "KeyUp 的 context.holding 是活引用（createContext 未改动），只有四个修饰键布尔量是匹配时刻快照"
    - "时序仍全部来自 excited(payload)：timeout 首次触发用 payload - start >= timeout，interval / dt 沿用既有分支"

key-files:
  created: []
  modified:
    - packages/system/src/hotkey/system.ts
    - packages/system/src/hotkey/command.ts
    - packages/system/src/hotkey/__test__/system.test.ts
    - packages/system/src/hotkey/__test__/command.test.ts

key-decisions:
  - "OI-1 采用计划提议的成员名 matchedWhen（IHotkeyCommandPending 私有成员，不导出、不进入 type.ts）；OI-2 测试 helper 命名按提议落定"
  - "OI-3（Continuous + timeout > 0 在 timeout 到期前就被激励触发）只提问、未确认为问题，本计划不修、不写断言，excited 的 Continuous 分支形态保持原样"
  - "when 的捕获点严格等于既有 createContext() 的三处：addPending、down 的再匹配分支、up 的换组合分支；不新增私有方法（condition?.() 恰好 3 处）"
  - "条件为假不阻止建立 pending（down 无条件建立、无任何条件闸口），因此 down / up 返回值与修正前逐字一致"
  - "setKeys(0) 判定改为 count < 0；logger.json 的 207 文案保持原样（用户裁定沿用现有措辞）"
  - "测试按重写后的设计整体重写，只从 ../command / ../system 导入，绝不从 ../index 导入（hotkey.ts 顶层 document 副作用）"
  - "全部代码与测试改动按执行指令保留在工作树，未提交"

patterns-established:
  - "条件闸口 ①：emit 第一行 if (!pending.matchedWhen) return; —— 立即触发、KeyUp 触发、waitTimeout 到期、Continuous 触发统一经此拦截，且不写 emitted / lastEmit"
  - "条件闸口 ②：up 的 toEmit 循环在 priority < blocking 的 break 之后插入 if (!pending.matchedWhen) continue; —— 条件为假的指令既不触发也不抬高 blocking"
  - "KeyUp 模式抬起时不重新求值：匹配时假则抬起与延时都不触发且不进入 waitTimeout（不补发），匹配时真则到期前转假仍按捕获值触发一次"
  - "KeyDown（Once / Continuous）按下为假则不触发，只有新按键匹配才重新求值并可能触发（由激励源推进）"

requirements-completed: []

coverage:
  - id: D1
    description: "KeyUp 组合按「辅助键 + 至多一个常规键」规则触发（matchKeyUp 解构修正）"
    verification:
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/system.test.ts#triggers a KeyUp combination while auxiliary keys are held"
        status: pass
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/system.test.ts#does not trigger when an auxiliary key was released first"
        status: pass
    human_judgment: false
  - id: D2
    description: "无参 leaveScope 只弹一级且不误发 205"
    verification:
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/system.test.ts#pops exactly one scope on no-arg leaveScope without warning"
        status: pass
    human_judgment: false
  - id: D3
    description: "setKeys(0) 合法、负数与非整数仍告警 207、构造器 defaults: [] 不再误报"
    verification:
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/command.test.ts#shrinks to zero combinations with setKeys(0)"
        status: pass
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/command.test.ts#warns 207 for negative and non-integer counts in setKeys"
        status: pass
    human_judgment: false
  - id: D4
    description: "when 在匹配时刻求值并随 pending 保存，条件为假不触发也不阻断低优先级"
    verification:
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/system.test.ts#keeps blocking based only on commands that really fire"
        status: pass
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/system.test.ts#fires a delayed KeyUp pending with the captured condition"
        status: pass
    human_judgment: false
  - id: D5
    description: "excited 首次触发在 timeout 到期的那次激励才发生（dt >= timeout）"
    verification:
      - kind: unit
        ref: "packages/system/src/hotkey/__test__/system.test.ts#waits for the Once timeout before the first emit"
        status: pass
    human_judgment: false
  - id: D6
    description: "两个测试文件成为与新设计一致的回归基线（68 条用例全绿）"
    verification:
      - kind: unit
        ref: "cmd /c \"pnpm exec vitest run packages/system/src/hotkey/__test__/command.test.ts packages/system/src/hotkey/__test__/system.test.ts\" (2 files / 68 tests passed)"
        status: pass
    human_judgment: false

# Metrics
duration: 14min
completed: 2026-10-23
status: complete
---

# Phase 09 Plan 24: 按键系统修正 + 测试适配 Summary

**修正用户重写后按键系统的 5 处已确认缺陷（KeyUp 解构、无参 leaveScope、when 匹配时刻求值、excited 首次触发比较符、setKeys(0)），并把两个测试文件按重写后的设计整体重写为 68 条全绿回归基线**

## Performance

- **Duration:** 约 14 min（Task 1 tracer + Task 2 + Task 3 与本机全部门禁）
- **Started:** 2026-10-23T14:36:00+08:00
- **Completed:** 2026-10-23T14:50:00+08:00
- **Tasks:** 3（Task 0 为 `blocking-human` 汇报关卡，已由用户「修订完直接执行」预先闭环，未再询问）
- **Files modified:** 4（2 个实现文件 + 2 个测试文件）

## Accomplishments

### 5 处修正的最终落点

1. **`system.ts` · `matchKeyUp`（修正 1）**
   - 改前：`const [main, auxiliary] = matchArray(keys, v => isAuxiliaryKey(v));`
   - 改后：`const [auxiliary, main] = matchArray(keys, v => isAuxiliaryKey(v));`
   - `matchArray` 返回 `[match, unmatch]`，谓词为真者是辅助键；改前把两者拿反，导致 `[Ctrl, KeyS]` 抬 S 时 `main[0]` 是 `Ctrl` 而永不触发。方法内其余行与既有注释逐字未动。
2. **`system.ts` · `leaveScope`（修正 3）**
   - 在 `if (!sym)` 分支的 `this.scopes.pop();` / `this.holdingCmds.clear();` / `this.waitTimeout.clear();` 之后补 `return;`。
   - 改前缺 `return` 会继续 `findIndex(v => v.symbol === undefined)`（符号永不相等）→ 误发 205。空栈无参仍发 205；有参未知仍发 205；有参命中仍 `splice(index + 1)`。
3. **`system.ts` · `when` 匹配时刻捕获（修正 2）**
   - `IHotkeyCommandPending` 在 `context` 之后新增 `matchedWhen: boolean`（一行 jsDoc：「按键组合匹配时刻的条件判定结果」），既有成员注释未动。
   - 求值表达式统一为 `this.getScope()?.condition?.() ?? true`，恰好 3 处捕获点（与 `createContext()` 同一次匹配、同一时机）：`addPending` 的对象字面量、`down` 中既有 pending 被新按键再次匹配的分支、`up` 中非 KeyUp 指令换到另一组匹配组合的分支。
   - 触发闸口恰好 2 处：`emit` 第一行 `if (!pending.matchedWhen) return;`；`up` 的 `toEmit` 循环中 `priority < blocking` 的 `break` 之后、`block` 赋值之前 `if (!pending.matchedWhen) continue;`。
   - `down` 内无任何条件判断（条件为假也照常建立 / 更新 pending），未新增任何私有方法。
4. **`system.ts` · `excited`（修正 4）**
   - 改前：`if (pending.emitted === 0 && dt < command.timeout)`
   - 改后：`if (pending.emitted === 0 && dt >= command.timeout)`
   - 只改这一个比较符；`waitTimeout` 循环与 `Continuous` 的 `emitted === 1` → `interval` / 否则 `dt` 分支未动（OI-3）。
5. **`command.ts` · `setKeys`（修正 5）**
   - 改前：`if (count <= 0) { logger.warn(207, 'negative integer'); return; }`
   - 改后：`if (count < 0) { logger.warn(207, 'negative integer'); return; }`
   - `count === 0` 因此合法（缩容到空、`length = 0`、无 207）；非整数分支（`'float'`）与扩缩容逻辑未动；`logger.json` 文案一字未改。附带效果：构造器对 `defaults: []` 调用 `setKeys(0)` 不再产生 207 噪声（Task 1 期间该噪声在 stderr 出现过，Task 2 修正后消失）。

### `when` 的最终语义

- **求值时机**：只在按键组合被匹配的那一刻求值一次（三处捕获点），并写入该 pending 的 `matchedWhen`。
- **触发时刻不重新求值**：`emit` 只读 `pending.matchedWhen`；`matchKeyUp` 与 `toEmit` 收集都不调用条件函数。
- **条件为假不阻止跟踪**：`down` 仍建立 / 更新 pending（`up` 依赖它做 KeyUp 匹配与 `waitTimeout` 转移），`down` / `up` 返回值与修正前逐字一致（`holdingCmds.size > 0 || waitTimeout.size > 0`）。
- **KeyUp 模式**：匹配时为假 → 抬起不触发，且该项在 `toEmit` 循环里被 `continue` 跳过、**不进入 `waitTimeout`**（带 `timeout` 也不补发）；匹配时为真 → 即便到期前条件转假，仍按捕获值触发一次。
- **KeyDown 模式（`Once` / `Continuous`）**：按下为假 → 不触发；只有新按键被匹配（`down` 的再匹配分支 / `up` 的换组合分支）才重新求值并可能触发，没有新匹配就永不触发（该键已在 `holdingSet` 中时的早退分支不求值）。
- **`block` / 优先级**：条件为假的指令既不触发也不抬高 `blocking`，因此不会把本应触发的低优先级指令 `break` 掉；`break` 仍是「严格更低才终止」。
- **延时路径**：`matchedWhen` 为假时 `emit` 被跳过，`waitTimeout` 项按既有代码出队（不补发）。

### 按用户裁定保持现状的六项（未改动、测试按现状断言）

1. `down` / `up` 返回值仍是「调用后是否仍有待触发项」（KeyUp 在 `up` 立即触发后返回 `false`，`down` 返回 `true`）。
2. `context` 不是整体快照：`createContext()` 的 `holding: this.holding` 是**活引用**（逐字保留），只有 `ctrl` / `shift` / `alt` / `meta` 四个布尔量是匹配时刻快照；`up` 先 `splice` 再 `emit`，故 KeyUp 触发时 `holding` 不含被抬起的主键（`[Ctrl, KeyS]` 抬 S → `[Ctrl]`；`[KeyS]` 抬 S → `[]`）。
3. `priority` / `block` 仅对抬起触发（KeyUp）批次生效。
4. `waitTimeout` 的到期判定基于 `pending.start`（`addPending` 时刻）。
5. 未实现的指令仍会建立待触发项（`block` 在匹配层计算）。
6. `excited` 的三段时序结构（先 `waitTimeout`、再 `holdingCmds`、`Continuous` 内 `emitted === 1` 走 `interval`、否则走 `dt`）不改。

### 测试重写与旧用例的对应关系

- `command.test.ts` 18 条：`isAuxiliaryKey` 四真 / 四假、构造缺省（`priority` / `block` / `mode` / 三个时间参数 / `length`）、`defaults` 内层数组拷贝、`defaults: []` 不告警、`setKeys(0)` 合法、`setKeys(-1)` + `setKeys(1.5)` 各一次 207（断言 code 序列，不断言参数字符串）、扩缩容、`setKeyCombination` 非整数 / 负数 / 越界各一次 206（不断言参数字符串，实现里有一处拼写 `negetive` 未改）、写入副本、KeyUp 两常规键 203、1 常规 + 辅助 / 2 辅助 / 空组合不告警、非 KeyUp 模式不校验 203、`getKeyCombination` 越界空数组与每次新副本、`iterateKeyCombinations` 索引升序与每次新副本、`keyUp(120)` / `once(15)`、`continuous(30, 60, 90)` 与 `continuous()` 归零、`command` id。
- `system.test.ts` 50 条：Task 1 交付 30 条（重复注册 204、`getCommand`、`deleteCommand` 清理待触发项、`iterateCommands` 顺序、`enterScope`、无参 `leaveScope` 不告警、空栈 205、`leaveScope(sym)` 保留命中、未知 sym 205 且栈顶仍生效、无作用域 201、未知指令 202、KeyUp 六条（含 203 与空组合）、holding 顺序与去重、KeyDown 子集、`down` / `up` 返回值、优先级降序 / 严格更低阻断 / 同优先级全触发、`listen` 六条（映射 65→`KeyA`、91/92/224→`Meta`、无映射跳过、`preventDefault` 只在 down 为真时、`listen(null)`、同元素不重复注册与换元素）；Task 3 追加 20 条（条件为假仍建立 pending、无新匹配永不触发、新匹配重新求值后触发、松键重按不补发、KeyUp 抬起不重新求值、KeyUp 新匹配后抬起触发、`block` 只统计会触发的指令、`up` 换组合重新求值、`Once + timeout` 的 99 / 100 / 150、`Continuous + timeout 0` 的 interval / dt、interval 与 dt 都为 0、松键后停止、未触发的 `Once` 松键转入 `waitTimeout` 后 `excite(200)` 触发一次、KeyUp 延时项 `context.holding` 为 `[]`、KeyUp 带 `timeout` 匹配时假不补发 / 真按捕获值触发、`excitedBy` 单源切换、`excitedBy(null)`、未绑定激励源不触发、`info.command` 为对象且 `info` 字段完整）。
- 与旧用例的对应：`HotkeyEmitType` / `HotkeyEmitMode.Throttle` / `command.throttle(...)` / `context.type` / `context.key` / 字符串 `info.command` 的断言全部删除；「延时项在触发时刻重建 context」改为「`holding` 是活引用，按派发时刻内容断言」；「松键取消 `Once`」改为「松键转入 `waitTimeout`，到期仍触发一次」；「匹配但未实现的 block 指令不阻断」未保留（按用户裁定该行为不改，不写断言）。

### 疑似问题 OI-3（只提问、未确认为问题、本计划不修）

- **提问内容**：`excited` 的 `Continuous` 分支是 `if (pending.emitted === 1) {...} else { if (dt2 >= command.dt) emit }`；首次触发前 `emitted === 0` 且 `lastEmit === -Infinity`，`dt2 = payload - (-Infinity) = Infinity` 恒 `>= dt`，因此 `continuous` 且 `timeout > 0` 的指令会在 timeout 到期前的那次激励就被触发（例如 `timeout: 100` 时 `excite(99)` 即触发），且这次触发来自 `else` 分支，修正 4 的 `dt >= timeout` 闸口管不住它。
- **处置**：用户指示「修订完直接执行」，未就该点作出「确认为问题」的表态。本计划**未修改**该分支、**未写**任何 `Continuous + timeout > 0` 的断言，`FINAL GATE` 以分支形态守护（要求 `if (pending.emitted === 1) {` 与 `if (dt2 >= command.dt)` 存在、禁止 `emitted > 1`），未获批准改动即失败。

## Task Commits

**未提交**（按执行指令：代码与测试改动全部保留在工作树，由用户自行决定提交范围）。`actuals.commits: 0`，`plan_head_before: 51bbc047`。

## Files Created/Modified

- `packages/system/src/hotkey/system.ts` — 修正 1 / 2 / 3 / 4（`matchKeyUp` 解构、`leaveScope` 提前 return、`matchedWhen` 三处捕获 + 两处闸口、`excited` 比较符）
- `packages/system/src/hotkey/command.ts` — 修正 5（`setKeys` 的 `count <= 0` → `count < 0`）
- `packages/system/src/hotkey/__test__/system.test.ts` — 整体重写，50 条用例
- `packages/system/src/hotkey/__test__/command.test.ts` — 整体重写，18 条用例

## Decisions Made

- OI-1 采用 `matchedWhen`；OI-2 的测试 helper 命名（`createInit` / `FakeElement` / `FakeKeyEvent` / `createKeyEvent` / `createExcitation`）按提议落定，均为测试文件内部声明、不导出。
- 修正 2 采用「匹配时刻求值 + 随 pending 保存 + 两处闸口」，不做触发时刻现算、不新增私有方法（`condition?.()` 在 `system.ts` 中恰好 3 处）。
- 条件相关的测试一律用顺序化条件函数来区分同一次 `down` 内两条指令的捕获值，并在用例注释中说明该手段依赖 `commands` 的插入顺序。
- 「新匹配后重新求值」一律用 `Once` 加假激励源断言；`Continuous` 在 `emitted` 由 0 变 1 的同一次激励里会继续走 `interval` / `dt` 分支（与 OI-3 同一段既有结构），不在本计划断言范围内。
- 按用户裁定保留 `down` / `up` 返回值口径与 `context` 的活引用语义，未为了断言「好看」改 `createContext` 或复制 `holding`。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 三个条件为假的用例里 `let ok = false` 从未被重新赋值，被 eslint 报 `prefer-const`**
- **Found during:** Task 3（eslint 门禁）
- **Issue:** 「条件为假仍建立 pending」「无新匹配永不触发」「KeyUp 匹配时假不补发」三个用例只读取 `ok`，`let` 触发 `prefer-const` 错误。
- **Fix:** 这三处改为 `const ok = false;`（`when(() => ok)` 的返回值仍为 `boolean`），语义不变。
- **Files modified:** `packages/system/src/hotkey/__test__/system.test.ts`
- **Verification:** eslint exit 0；68 条用例仍全绿；类型闸门 0 条本计划文件诊断。
- **Committed in:** 未提交（保留在工作树）

---

**Total deviations:** 1 auto-fixed（Rule 1）
**Impact on plan:** 仅测试文件内的变量声明方式，未改变任何实现语义、测试覆盖或断言强度。

## Verification

- `cmd /c "pnpm exec vitest run packages/system/src/hotkey/__test__/command.test.ts packages/system/src/hotkey/__test__/system.test.ts"` → **2 files / 68 tests passed**（command 18 + system 50）。修正前基线为 2 files failed / 18 failed / 42 passed。
- `cmd /c "pnpm exec eslint packages/system/src/hotkey/system.ts packages/system/src/hotkey/__test__/system.test.ts"`（Task 1、Task 3）与 `... command.ts .../command.test.ts`（Task 2）→ 无输出、exit 0。
- `TRACER GATE`（Task 1）→ `OK tracer gate: matchKeyUp fixed, leaveScope returns, 30 system cases`。
- `COMMAND GATE`（Task 2）→ `OK command gate: setKeys(0) legal, 18 command cases`。
- `LEGACY GATE`（Task 1 / Task 2）→ `OK protected files unchanged vs HEAD`（`type.ts` / `hotkey.ts` / `keyboard.ts` / `keyCodes.ts` / `index.ts` / `logger.json` / `package.json` / `pnpm-lock.yaml`）。
- `FINAL GATE`（Task 3）→ `OK final gate: when captured at 3 match-time sites, emit/block honour it, timeout comparison fixed, 50 system cases, SUMMARY present`。
- 类型闸门（Task 3 结束时）→ `OK hotkey implementation and tests type-check clean (vue-tsc exit 2); 2 pre-existing legacy errors are out of scope`（本计划文件 0 条诊断；`hotkey.ts` / `keyboard.ts` 各 1 条 legacy 诊断作为「输出完整」的基线证据）。**最终工作树中出现 1 条新诊断**，原因见下「执行期间出现的并发用户改动」。
- `SCOPE GATE`（Task 3 结束时）→ `OK scope gate: every change matches files_modified (5 entries)`；**最终工作树中失败**，原因见下「执行期间出现的并发用户改动」。
- prettier 只作用于 4 个 TS 文件，且行尾为 CRLF；未把 `logger.json` 之类文件传给 prettier。

## 执行期间出现的并发用户改动（不属于本计划）

执行 Task 3 期间，以下三个文件被**用户并发修改**（非本执行器写入，且都在 `files_modified` 白名单之外，按硬约束未触碰）：

- `packages/system/src/hotkey/type.ts` — `IHotkeyCommandInit.priority` 改为可选（`readonly priority?: number`，注释追加「默认为 0」），并调整了成员顺序。
- `packages-user/client-base/src/hotkey/types.ts` — `IClientHotkey.setGroup` 增加 `name` 参数。
- `src/client/misc/hotkey.ts` — 接线 `system.excitedBy(state.rafExcitation)`、分组 id 与名称，并新增 `@game/moveUp` / `@game/moveDown`（`Continuous`）。

因此最终工作树的闸门状态与 Task 3 当时不同：

- `SCOPE GATE` 现在报 `out-of-scope change: packages-user/client-base/src/hotkey/types.ts` / `packages/system/src/hotkey/type.ts` / `src/client/misc/hotkey.ts`（均为上述用户改动，非本计划写入）。
- `LEGACY GATE`（Task 1 / Task 2 当时均通过）现在同样会因 `type.ts` 被判为改动而失败。
- 类型闸门多出 1 条本计划文件诊断：`packages/system/src/hotkey/command.ts(35,9): error TS2322: Type 'number | undefined' is not assignable to type 'number'.` —— 由 `priority` 改为可选引起。按硬约束（只落 5 处修正、不改 `type.ts`）与 AGENTS.md（改动须先获批），**未自行补默认值**；如需在 `command.ts` 构造器补 `this.priority = init.priority ?? 0;`，请明确批准后再改。
- 另有 `packages-user/client-base/src/hotkey/hotkey.ts(16,5) TS2416` 来自 `setGroup` 签名改动，同样属用户 WIP。
- vitest 仍为 **2 files / 68 tests passed**（运行时不受该类型改动影响：测试里的 `createInit` 始终显式给出 `priority`）。

## Known Boundaries

- 未做浏览器 E2E：`listen` 用 Node 环境下的最小 fake 元素与伪事件验证。
- 未接线 `packages-user/**` 的 `IClientHotkey`（本计划只改 `packages/system` 内的实现与测试）。
- 未跑 `build:game` / `build:packages`，不做全仓类型修复；`hotkey.ts` / `keyboard.ts` 的 2 条 legacy 类型错误保持原状。
- 本计划的写入只覆盖 4 个文件；`type.ts`（权威设计）、`keyCodes.ts`、`index.ts`、`logger.json`、`package.json`、`pnpm-lock.yaml` 与其它包**未经本执行器改动**（`type.ts` 当前的工作树改动来自用户并发编辑，见上节）。
- `Continuous + timeout > 0` 的时序仍按 OI-3 留在现状，既未修也未写断言；不得据此认为「timeout 行为已全部修正」。
- **估算说明：** 计划 `estimate.tokens=70000` 为**未校准估算**（`confidence: low`），修订前基线是已提交的 09-23 实现（`3fd339f`）；本计划实际 diff 约 15782 tokens（chars/4），未按估算反推调整。

## Known Stubs

无。两个测试文件与两个实现文件都不含占位文案、硬编码空值流向 UI 或无数据源的组件。

## Issues Encountered

- 除上述 `prefer-const` 外无阻塞问题；Task 1 阶段 stderr 出现的 207 噪声正是修正 5 要解决的问题，Task 2 落地后消失。

## User Setup Required

None — 无外部服务或环境变量配置。

## Next Phase Readiness

- 按键系统（`command.ts` / `system.ts`）的 5 处缺陷已修正，两个测试文件重新成为可信回归基线（68 条用例）。
- 后续计划可把 `IClientHotkey.system` 接到 `HotkeySystem` 实例，并补浏览器端集成验证；`when` 的匹配时刻语义可直接对外使用。
- 若用户确认 OI-3 需要修复，需先修订计划（改为 `else if (pending.emitted > 1)` 或等价结构）并补 `Continuous + timeout > 0` 的时序用例。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-23*
