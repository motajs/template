---
phase: 09-minimum-browser-runnable
plan: 28
subsystem: ui-hotkey
tags: [hotkey, game-ui, iterate-groups, source-gate, vitest, no-entry, no-persistence]

requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-27 的 useKey 新热键系统迁移与「基线 + 执行前后真值比较」门禁写法

provides:
  - "IClientHotkey.iterateGroups() / ClientHotkey.iterateGroups()：直接返回底层分组 Map 的 entries（不复制、不排序）"
  - "src/client/ui/hotkey.tsx：FULL_LOC 全屏左分组右指令热键设置界面，每组合一个可点击框，捕获阶段首 keyup 主键写回内存"
  - "src/client/ui/__test__/hotkeySettingsGate.test.ts：12 组 ?raw 源码形状闸门，每个 it 前一行注释"

affects: [09-minimum-browser-runnable 后续入口接入计划, 热键设置持久化/冲突检测/恢复默认等后续增量]

actuals:
  tokens: 5598
  tasks: 3
  commits: 0

tech-stack:
  added: []
  patterns:
    - "源码形状闸门：?raw + stripComments 后做正/负断言，不导入组件、不使用 node:fs"
    - "非响应式指令实例用 shallowRef + combinationLists 快照驱动渲染"

key-files:
  created:
    - src/client/ui/hotkey.tsx
    - src/client/ui/__test__/hotkeySettingsGate.test.ts
    - .planning/phases/09-minimum-browser-runnable/09-28-BASELINE.json
    - .planning/phases/09-minimum-browser-runnable/09-28-SUMMARY.md
  modified:
    - packages-user/client-base/src/hotkey/types.ts
    - packages-user/client-base/src/hotkey/hotkey.ts

key-decisions:
  - "只实现界面与 iterateGroups()，不接入口、不持久化、不做冲突检测、不做恢复默认（用户决定）"
  - "selectedCommand 使用 shallowRef，避免 ref 深度代理破坏实例身份比较"
  - "组合显示使用 combinationLists 快照，setKeyCombination 写回后重建快照"
  - "首次 keyup 结束捕获，组合 = [...仍按住且不等于松开键, 松开键]；Ctrl/Shift/Alt 可作主键"
  - "@common/exit 仅代码形状（IHotkeySystem.listen 无生产调用），实际关闭手段是左上角返回文本"
  - "不做浏览器 UAT，执行器不提交任何代码"

patterns-established:
  - "新 UI 界面导出 Props 接口 + hotkeySettingsProps + defineComponent + XxxUI = new GameUI('kebab-id', Xxx)"
  - "热键捕获在 document 捕获阶段注册 keydown/keyup，三连阻断并在卸载时移除"

requirements-completed: []

coverage:
  - id: D1
    description: "IClientHotkey / ClientHotkey 新增 iterateGroups() 分组迭代 API"
    verification:
      - kind: unit
        ref: "src/client/ui/__test__/hotkeySettingsGate.test.ts#declares iterateGroups on the interface and returns the group entries"
        status: pass
    human_judgment: false
  - id: D2
    description: "热键设置界面：FULL_LOC 两栏、左分组右指令、每组合一个可点击框、捕获阶段首 keyup 主键写回内存、无自绘背景"
    verification: []
    human_judgment: true
    rationale: "按计划跳过浏览器 UAT；视觉布局、高亮与按键捕获行为未验证，仅有源码形状闸门"
  - id: D3
    description: "不接入口 / 不持久化 / 无冲突检测 / 无恢复默认"
    verification:
      - kind: unit
        ref: "src/client/ui/__test__/hotkeySettingsGate.test.ts#keeps persistence calls out of the hotkey settings ui"
        status: pass
      - kind: unit
        ref: "src/client/ui/__test__/hotkeySettingsGate.test.ts#adds neither conflict detection nor default restoring"
        status: pass
      - kind: unit
        ref: "src/client/ui/__test__/hotkeySettingsGate.test.ts#leaves the settings entry and ui barrel untouched"
        status: pass
    human_judgment: false

duration: "约 15 分钟（未精确计时）"
completed: 2026-10-26
status: complete
---

# Phase 9 Plan 28: 热键设置界面 + iterateGroups() Summary

**新增 `iterateGroups()` 分组迭代 API 与仅源码验收的热键设置界面：左分组右指令、每组合一个可点击框、捕获阶段首 keyup 主键写回内存，不接入口、不持久化、无冲突检测/恢复默认**

## Performance

- **Duration:** 约 15 分钟（未精确计时）
- **Started:** 未记录精确时间戳
- **Completed:** 2026-10-26
- **Tasks:** 3（Task 1–3；Task 0 为汇报关卡，用户回复「可以执行」）
- **Files modified:** 4 个代码/测试文件 + 2 个 `.planning` 产物（基线、摘要）

## Accomplishments

- 在 `IClientHotkey` 新增带 jsDoc 的 `iterateGroups()`，`ClientHotkey` 实现为 `return this.groups.entries()`，其余热键 API 零改动。
- 新建 `src/client/ui/hotkey.tsx`，导出 `HotkeySettingsProps` / `HotkeySettings` / `HotkeySettingsUI`；左栏分组用 `Scroll` 承载，右栏为每条指令的每个按键组合渲染独立可点击框（纵向堆叠、右对齐），组合文本通过 `KeyCodeUtils.toString` + `' + '` 显示，空组合显示 `未设置`。
- 捕获语义：点击按键框后以 **捕获阶段** 在 `document` 上监听 `keydown` / `keyup`，两者均 `preventDefault()` + `stopPropagation()` + `stopImmediatePropagation()`；首次 keyup 结束捕获，松开键为主键，仍按住的键按按下顺序作为辅助键（`[...仍按住且不等于松开键, 松开键]`，与 `Ctrl + J + W` 示例一致）；`Ctrl` / `Shift` / `Alt` 可作主键。
- 写回走 `command.setKeyCombination(index, combination)`，写回后重建 `combinationLists` 快照；不持久化。
- `EVENT_KEY_CODE_MAP` 映射事件码，映射不到或 `KeyCode.Unknown` 时忽略；`FULL_LOC` 全屏、不绘制背景（R-1），关闭手段为左上角可点击 `返回`，捕获中 `@common/exit` 直接返回。
- 新建 `hotkeySettingsGate.test.ts`，12 组 `?raw` 源码形状断言全部通过。

## Task Commits

**执行器 0 次代码提交。** 按计划禁令，本次执行未运行任何 git 写命令（`add` / `commit` / `stash` / `checkout` / `restore` / `worktree` / `reset`）。4 个代码/测试文件保留在工作树（2 个已修改、2 个未跟踪），交由用户审查。

三个 `.planning` 产物（本计划、`09-28-BASELINE.json`、`09-28-SUMMARY.md`）可能由 GSD 编排器按 `.planning/config.json` 的 `commit_docs: true` 聚合提交；这不属于本计划的代码提交。

## Files Created/Modified

- `packages-user/client-base/src/hotkey/types.ts` — `IClientHotkey` 新增带 jsDoc 的 `iterateGroups(): Iterable<[id: string, group: IHotkeyCommandGroup]>`
- `packages-user/client-base/src/hotkey/hotkey.ts` — `ClientHotkey.iterateGroups()` 返回 `this.groups.entries()`
- `src/client/ui/hotkey.tsx` — 新热键设置界面（导出 `HotkeySettingsProps` / `HotkeySettings` / `HotkeySettingsUI`）
- `src/client/ui/__test__/hotkeySettingsGate.test.ts` — 新源码形状闸门（12 组断言）
- `.planning/phases/09-minimum-browser-runnable/09-28-BASELINE.json` — 改动前基线（Task 1 第一步写出，只写一次）
- `.planning/phases/09-minimum-browser-runnable/09-28-SUMMARY.md` — 本摘要

## Gate Results (actual)

| 门禁 | 命令 / 方式 | 结果 |
|------|-------------|------|
| Task 1 自动化 | 计划内 `node -e` 基线 + `iterateGroups` 形状检查 | **PASS** |
| Task 2 源码形状 | 计划内 `node -e`（去注释后正/负断言） | **PASS** |
| Task 2 eslint | `pnpm exec eslint src/client/ui/hotkey.tsx` | **PASS**（exit 0） |
| Task 3 vitest | `pnpm exec vitest run src/client/ui/__test__/hotkeySettingsGate.test.ts` | **PASS**（12/12） |
| eslint 前后基线 | 4 个改动文件 vs `09-28-BASELINE.json`，只判 NEW | **PASS**（0 → 0，无 NEW） |
| typecheck 前后基线 | 整仓 `pnpm check:type`，按改动文件集合过滤，只判 NEW | **PASS**（0 → 0，无 NEW；修复见下方偏差） |
| 受保护文件哈希 | `settings.tsx` / `ui/index.ts` / `misc/hotkey.ts` vs 基线 | **PASS**（3 个哈希全部相等） |
| HEAD 未变 | `git rev-parse HEAD` vs 基线 `head` | **未满足（环境原因，非执行器提交）**：执行期间 10-36 文档计划并发提交，HEAD 由 `9fee3c4` → `f3e9ea7` → `63e960e`；`git diff --name-only 9fee3c4 HEAD` 仅含 `docs/advanced/iii/*` 与 `.planning/phases/10-docs-restructure/10-36-SUMMARY.md`，**不含本计划 4 个路径**；等价意图门禁 `no code/test path committed` **PASS**。按计划 Task 3-C 如实上报，未改写基线。 |
| 改动范围 | `git status --porcelain -uall -- <4 个路径>` | **PASS**（恰好 4 个路径） |

基线采集值：`head = 9fee3c4392b4fc8bf7c8d19447d7b525cd37a845`；`eslint = []`；`typecheck = []`（两个改动文件内）。

## Decisions Made

- 仅实现「界面 + `iterateGroups()`」，不接入口、不持久化、不做冲突检测、不做恢复默认——均为用户明确决定，不是遗漏。
- `selectedCommand` 使用 `shallowRef`，避免 `ref` 把 `IHotkeyCommand` 实例包成 Proxy 后破坏身份比较（高亮与 `@common/exit` 守卫依赖它）。
- 组合变化由 `combinationLists` 快照承担响应性；`setKeyCombination` 写回后重建快照，否则界面仍显示旧组合。
- `@common/exit` 仅提供代码形状；因 `IHotkeySystem.listen` 无生产调用，键盘关闭未验证，实际关闭为 `返回` 文本。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 调整未知按键判断顺序以消除 TS2367**
- **Found during:** Task 3（`pnpm check:type` 前后基线门禁）
- **Issue:** 计划要求的 `if (!code || code === KeyCode.Unknown) return;` 中，`!code` 已把 `KeyCode.Unknown`（值为 `0`）从类型联合中排除，TypeScript 判定后半段比较「无重叠」（TS2367），在 `hotkey.tsx` 产生 NEW 诊断。
- **Fix:** 两个处理器均改为 `if (code === KeyCode.Unknown || !code) return;`。语义完全等价，仍同时保留 `KeyCode.Unknown` 与真值判断两处（源码闸门与 vitest 断言不受影响）。
- **Files modified:** `src/client/ui/hotkey.tsx`
- **Verification:** `pnpm check:type` 门禁 0 → 0 无 NEW；eslint exit 0；vitest 12/12 通过。
- **Committed in:** 无（执行器 0 次代码提交）

---

**Total deviations:** 1 auto-fixed（1 个 bug）
**Impact on plan:** 仅修正类型层冗余比较，无行为与范围变化。

## Issues Encountered

- **HEAD 被并发计划推进：** 执行期间 10-36 文档计划并发提交，HEAD 从基线 `9fee3c4` 推进到 `63e960e`。已确认这些提交只含 `docs/` 与 `.planning/phases/10-docs-restructure/10-36-SUMMARY.md`，不触碰本计划任何路径；受保护文件哈希未变；本计划 4 个文件仍为工作树未提交状态。未改写基线。
- **PowerShell 执行策略阻止 `pnpm.ps1`：** 改用 `cmd /c "pnpm ..."` 调用 eslint / vitest / 类型检查。
- **`rg` 不可用：** 使用内置 grep 工具完成只读检索。

## Known Limitations (intentional, not stubs)

- 无入口接入：本计划完成后应用内没有打开该界面的路径，模块只供后续计划导入（用户决定）。
- 无持久化：编辑仅作用于当前会话内存，刷新即丢失（用户决定）。
- 无冲突检测、无恢复默认（用户决定）。
- `getUngrouped()` 的未分组指令不在本界面展示；Meta 键未映射（均属 OI-3 已知遗留）。
- `@common/exit` 键盘关闭仅为代码形状；`IHotkeySystem.listen` 无生产调用、按键投递未接线属预期状态。
- **未做浏览器 UAT：** 不宣称任何视觉布局或按键行为已验证；视觉与按键行为需用户自行验证。

## Estimate

计划 `estimate` 为**未校准估算**（`confidence: low`，`tokens: 90000` / `raw_tokens: 45000`）。实际改动 4 个文件共约 22390 字符（chars/4 ≈ **5598** tokens），低于估算属预期，但该换算未校准，不作为后续排期依据。

## User Setup Required

None — 无外部服务配置。浏览器 UAT 由用户按需自行进行。

## Next Phase Readiness

- `hotkey.tsx` 可被后续计划直接导入；入口接入、持久化、冲突检测、恢复默认均为后续独立增量。
- 工作树中的 4 个代码/测试文件等待用户审查与决定是否提交。

---

*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-26*

## Self-Check: PASSED

- 6 个交付/记录文件均存在（4 个代码/测试 + 基线 + 摘要）。
- 执行器对 4 个代码/测试路径 **0 次提交**（`git diff --name-only <baseline> HEAD -- <4 paths>` 为空）；4 个文件保留在工作树。
- 受保护文件哈希与基线一致；改动范围仅 4 个代码/测试路径。
