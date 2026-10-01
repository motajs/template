---
phase: 04-render-adaptation
plan: 15
subsystem: render-de-singletonization
tags: [read-only, singleton-audit, de-singletonization, client-modules, client-base, IClientBaseExtended, ICoreStateExtended, d69-barrel]
requires:
  - phase: 04-render-adaptation
    provides: 用户 2026-10-01 去单例化裁定（渲染端不得再有单例、全部挂主类 `ClientCore` / `client`、子系统继承 / 实现 `IClientBaseExtended` / `ICoreStateExtended`、镜像数据端模式、两步走）
  - phase: 04-render-adaptation
    provides: 既有只读台账 04-UI-ADAPTATION-IMPACT.md / 04-STRUCTURE-MIGRATION-IMPACT.md（版式与证据纪律模板）
provides:
  - .planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md（渲染端去单例化·第一步只读清点台账；元信息块 + 12 小节 + A–F 六类 + 单例→目标映射汇总 + 处置）
  - 供第二步（04-16：挂载 + 接口继承重构）消费的单例→目标映射汇总（含 undetermined 标注）
affects: [04-render-adaptation]
actuals:
  tokens: 15145
  tasks: 5
  commits: 1
  plan_head_before: 2d3287804d90bf3cde1d6299ac71815fd677a7eb
tech-stack:
  added: []
  patterns:
    - "只读单例清点台账：元信息块 + 只读起始基线 + 12 小节 + A–F 六类固定列序表 + 单例→目标映射汇总 + 处置"
    - "证据纪律：事实行每行 ≥2 个 file:line 锚点；证据行带 [证据行] 标记 + git grep 核对命令与原样结果"
    - "只登记不判定：静态阅读不能定论者一律进 F 类（未猜测），不得写成错配 / 缺失 / 残留 / 待办"
    - "目标模式：挂主类 `ClientCore` / `client` + `IClientBaseExtended` / `ICoreStateExtended` 之一 + 先例 file:line"
key-files:
  created:
    - .planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md
    - .planning/phases/04-render-adaptation/04-15-SUMMARY.md
  modified: []
  deleted: []
key-decisions:
  - "本 run 为纯只读收集（用户 2026-10-01 去单例化第一步）：生产源码改动 0，files_modified 仅台账；Task 1/2/3 不独立提交，Task 4 单次白名单提交"
  - "A–E 分类行统一覆盖：A 30 个对象（+ 1 条 [证据行] 完整性反查）/ B 8 / C 6 / D 4 / E 7；F 7 条；单例→目标映射汇总 41 行"
  - "目标接口一律给候选 `IClientBaseExtended` / `ICoreStateExtended` 或 undetermined，不裁定取舍、不给挂载写法（命名先获批）"
  - "renderer 实例簇与 ClientCore 构造器内自建对象重复（client.ts:90,91,108）／外部框架级全局（mainRenderer / using / tagManager / gameKey）／GameUI 实例是否纳入 一律进 F 类，不臆测"
  - "Task 1/2/3 的门禁按原样语义落到仓库外 %TEMP%\\opencode\\04-15-gates-pre.cjs 执行，判据不变（PowerShell 5.1 引号 / $ / CJK 兼容）"
requirements-completed: []
duration: ~40min
completed: 2026-10-01
status: complete
---

# Phase 4 Plan 15: 渲染端去单例化·第一步（只读收集）Summary

**对 `packages-user/client-modules` 与 `packages-user/client-base` 两个包内全部单例做只读清点：枚举 30 个模块级实例化对象 + 8 项可变模块级状态与全局注册表 + 6 项全局访问器与框架级全局引用 + 4 项顶层副作用模块，逐一给出定义 / 消费者 `file:line`、与 `ClientCore` / `client` 的关系、目标接口候选（`IClientBaseExtended` / `ICoreStateExtended` + 先例）或 undetermined，产出 `04-RENDER-SINGLETON-AUDIT.md`；生产代码零改动、未引入任何命名变更、无运行时验证（D-68 的延续），REND-01 / REND-02 保持 Pending。**

## Performance

- **Duration:** ~40min
- **Started:** 2026-10-01
- **Completed:** 2026-10-01
- **Tasks:** 5（Task 0 blocking-human 汇报关卡 — 用户已回复「可以执行」；Task 1 tracer；Task 2；Task 3；Task 4 收口）
- **Files:** 1 新增（`04-RENDER-SINGLETON-AUDIT.md`）+ 本 SUMMARY；生产源码改动 **0**

## 只读起始基线（Task 1 步骤 0a）

- **只读起始基线（packages / packages-user / src）：**
  - ` M packages-user/data-system/src/combat/context.ts`
- **起始 HEAD：** `2d3287804d90bf3cde1d6299ac71815fd677a7eb`（short `2d32878`）
- **起始分支：** `refine/data-client`
- **用户并发改动：** `packages-user/data-system/src/combat/context.ts` 的既有未提交改动仍在（porcelain ` M`，内容哈希 `9982509d3d8ec4c58d5c71f37f1a576a13c3337f`）；本 run 未回滚 / 暂存 / 提交 / 修改（D-56 精神）。
- **机读标记：** 台账含 `<!-- baseline-hash-combat-context: 9982509d3d8ec4c58d5c71f37f1a576a13c3337f -->`，Task 1/2/3/4 生产树门禁均正向确认该哈希一致。

## Accomplishments

**唯一交付物：** `.planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md`（只读）。

| 节 | 落点 | 条目数 |
|---|---|---|
| 元信息块 + 只读起始基线 + 背景 + 方法 + 枚举口径 | 6 行元信息块；porcelain 原样（含用户 WIP）；用户 2026-10-01 裁定要点；六类判定口径表；证据纪律 | — |
| **A 模块级实例化对象** | `texture` / `client` / renderer 实例簇（`rafExcitation` / `excitationDivider` / `mainRenderer` / `using` / `tagManager`）/ `sceneController` / `mainUIController` / `MainBackgroundUI` / 20 个 `GameUI` 实例 / `DEFAULT_FONT` + 1 条 `[证据行]` 完整性反查 | **30 对象 + 1 证据行** |
| **B 可变模块级状态与全局注册表** | `nowOrientation` / `orientationHooks` / `transitionMap` / `mainScope`（`Symbol.for`）/ `static extern` / `static weathers` / `RenderColorTransition.key` / `textboxTyper` 模块级 `Set` + 1 条 `[证据行]` | **8 + 1 证据行** |
| **C 全局访问器与框架级全局引用** | `Mota.require`（`cache.ts:491` / `misc.ts:89,219`；legacy 只报告）/ `window.*`（`use.ts` 与 UI）/ `core.*`（legacy 只报告）/ 外部包全局 `gameKey` / `tagManager` / `mainRenderer` / 数据端单例 `state` 引用 + 1 条 `[证据行]` | **6 + 1 证据行** |
| **D 顶层副作用模块** | `gameKey` 顶层注册链 / `keyStorage` 存储读写与事件 / `window.addEventListener` / `renderer.ts` 顶层 `bindExcitation` / `setDivider` + 1 条 `[证据行]` | **4 + 1 证据行** |
| **E 主类关系与目标挂载面映射** | `client`（目标主类本身）/ `texture` / renderer 实例簇 / UI 控制器与 `GameUI` 簇 / `use.ts` 可变状态 + `hotkey` 符号 / weather 静态注册表 / client-base `GameUI` + `Mota.require` | **7** |
| **F 未能从阅读确定（未猜测）** | F-01 外部框架级全局归属 / F-02 重复单例权威归属 / F-03 `GameUI` 实例是否纳入 / F-04 `window` 副作用与无 DOM 约束 / F-05 目标接口取舍 / F-06 `IClientBaseExtended` 实现情况 / F-07 无消费者的状态栏 UI | **7** |
| **单例→目标映射汇总（供 04-16 消费）** | 41 行固定列表（定义 file:line / 符号 / 类型 / 目标或 undetermined / 先例 / 归属包 / 置信）+ 两个包内单例总数说明 | **41** |
| **处置** | 只读完成；第二步（04-16）未规划、待用户审阅；REND-01 / REND-02 保持 Pending | — |

**A–E 分类行：** A 32 / B 9 / C 7 / D 5 / E 7 = **60** 条表行（门禁实测一致）；F **7** 条。**两个包内单例对象合计 48 个单例点**（A 30 + B 8 + C 6 + D 4）。

## Task Commits

1. **Task 0（blocking-human 汇报关卡）** — 用户已回复「可以执行」，无文件改动、无提交
2. **Task 1（tracer）** — 台账骨架 + 12 小节 + `texture` 一条线端到端（`#04-15-A-01`；门禁全绿，无独立提交）
3. **Task 2** — client-modules 单例横向铺开（主单例 / renderer 簇 / scene / UI 控制器与 `GameUI` / `use.ts` 可变状态 / weather 静态注册表 / hotkey 符号与顶层副作用；门禁全绿，无独立提交）
4. **Task 3** — client-base 单例横向铺开 + A–E 分类收口 + `## 单例→目标映射汇总` 定稿 + D-69 barrel 检查（门禁全绿，无独立提交）
5. **Task 4** — 收口门禁 + 人工复核 + 本 SUMMARY + 白名单提交

**Plan metadata:** 单一白名单提交（见「提交记录」）。Task 1/2/3 的 action 未定义独立提交步骤；Task 4 步骤 (10) 明示单次白名单提交（与 04-10 / 04-13 的单一提交口径一致）。

## 提交记录

- `docs(04-15): 渲染端去单例化只读清点（第一步）` —— 单次白名单提交，仅含 `04-RENDER-SINGLETON-AUDIT.md` + 本 `04-15-SUMMARY.md`（未暂存用户 `combat/context.ts` 或任何其它文件；提交 hash 见 orchestrator 回报 / `git log`）。

## A–F 落点表（关键锚点）

| 面 | 条目 | 关键 `file:line` 锚点 |
|---|---|---|
| **A 模块级实例化对象** | `texture`（tracer） | `packages-user/client-base/src/elements/cache.ts:280` ↔ `packages-user/client-base/src/elements/cache.ts:48` / `packages-user/client-base/src/components/textbox.tsx:399` / `packages-user/client-base/src/elements/misc.ts:87` |
| | renderer 实例簇 | `packages-user/client-modules/src/render/renderer.ts:18,20,35,43,45` ↔ `packages-user/client-modules/src/client.ts:48,90,108` |
| | 主单例 / scene / UI 控制器 | `packages-user/client-modules/src/core.ts:6` / `packages-user/client-modules/src/render/scene.ts:3` / `packages-user/client-modules/src/render/ui/controller.tsx:11,29` |
| | `GameUI` 实例簇 | `packages-user/client-modules/src/render/ui/load.tsx:161` / `main.tsx:312` / `save.tsx:462` / `settings.tsx:663,665,667,669,671,673,678` / `statistics.tsx:302` / `statusBar.tsx:488,489` / `title.tsx:484` / `viewmap.tsx:556`；`packages-user/client-base/src/components/choices.tsx:796,798` / `input.tsx:602` / `misc.tsx:591,592` |
| **B 可变状态 / 注册表** | use.ts + hotkey + weather | `packages-user/client-modules/src/render/use.ts:34,35,287` / `packages-user/client-modules/src/action/hotkey.ts:5` / `packages-user/client-modules/src/render/weather/controller.ts:15,17` |
| **C 全局访问器 / 框架级全局** | Mota / window / core / 外部包 | `packages-user/client-base/src/elements/cache.ts:491` / `packages-user/client-base/src/elements/misc.ts:89,219` / `packages-user/client-modules/src/render/use.ts:40,48,51,60` / `packages-user/client-modules/src/action/hotkey.ts:2` |
| **D 顶层副作用** | hotkey / use / renderer | `packages-user/client-modules/src/action/hotkey.ts:9,470,471,523,526` / `packages-user/client-modules/src/render/use.ts:51` / `packages-user/client-modules/src/render/renderer.ts:22,26,32` |
| **E 目标映射** | 目标接口 / 先例 | `IClientBaseExtended`（`packages-user/client-base/src/types.ts:27`）/ `ICoreStateExtended`（`packages-user/data-state/src/types.ts:45`）/ 先例 `packages-user/client-base/src/material/types.ts:94,218,406,439` / `packages-user/data-state/src/ins.ts:11` |
| **F undetermined** | F-01..F-07 | 见台账 `## F 未能从阅读确定（未猜测）` 一节 |

## 门禁实测结果（全部静态 — D-68 的延续）

门禁按计划 `## Verification Runnability` 的指示，将每条 `<automated>` 的原样语义落到仓库外 `C:\Users\book\AppData\Local\Temp\opencode\04-15-gates-pre.cjs` 执行 `node <file>`（PowerShell 5.1 引号 / `$` / CJK 兼容；判据与 `<fails_when>` 一字不变）。

| # | 门禁 | 结果（OK 行） |
|---|---|---|
| T1-1 | 台账骨架 + 12 小节 + tracer 行 `#04-15-A-01` | ✅ `OK structure + keys present` |
| T1-2 | A–E 事实行 ≥2 锚点（≥1 行） | ✅ `OK anchor discipline: 60 table rows, 7 F entries` |
| T1-3 | 生产树正向基线（` M` 行在场 + 无其它条目 + `git hash-object` 与台账标记一致） | ✅ `OK read-only baseline confirmed (user edit present, hash matches, no other changes)` |
| T1-4 | CRLF | ✅ `OK CRLF .planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md` |
| T2-1 | client-modules 铺开（主单例 / renderer / scene / UI 控制器 / use.ts / weather / hotkey / F / 映射汇总） | ✅ `OK structure + keys present` |
| T2-2 | 锚点纪律（行 ≥12）+ F ≥4 | ✅ `OK anchor discipline: 60 table rows, 7 F entries` |
| T2-3 | 生产树正向基线 | ✅ `OK read-only baseline confirmed (user edit present, hash matches, no other changes)` |
| T2-4 | CRLF | ✅ `OK CRLF ...` |
| T3-1 | client-base 单例 + 两个目标接口 + 数据端先例 + 映射汇总 + 处置 | ✅ `OK structure + keys present` |
| T3-2 | 最终纪律（行 ≥18 + F ≥5 + 映射汇总表头） | ✅ `OK anchor discipline: 60 table rows, 7 F entries` |
| T3-3 | 范围门禁（`REQUIREMENTS.md` 零改动 + 用户 `combat/context.ts` 正向基线） | ✅ `OK scope: read-only, REQUIREMENTS untouched, user edit present + hash matches` |
| T3-4 | CRLF | ✅ `OK CRLF ...` |
| T4-1 | 台账结构 / 内容 / 全量关键锚点 | ✅ `OK structure + keys present` |
| T4-2 | 最终纪律（F ≥5） | ✅ `OK anchor discipline: 60 table rows, 7 F entries` |
| T4-3 | 范围门禁（`material/` / `packages/` / `src/` 空；`REQUIREMENTS.md` 零改动；用户改动保留 + 哈希一致） | ✅ `OK scope: material/packages/src clean; REQUIREMENTS untouched; user edit present + hash matches` |
| T4-4 | 既有产物保护（`04-01`..`04-14` porcelain 空；无 `04-16+`） | ✅ `OK existing 04-01..04-14 artifacts untouched; no 04-16+ plan` |
| T4-5 | ROADMAP 登记（Phase 4 段含 `04-15` / `Wave 14`） | ✅ `OK ROADMAP Phase 4 has 04-15 / Wave 14 registration` |
| T4-6 | 台账 + SUMMARY CRLF 且 SUMMARY 在场 | ✅（见 Self-Check） |
| T4-7 | `04-15-SUMMARY.md` 落盘且含 `04-15` / `去单例化` / `只读` / `Pending` / `04-16` | ✅（见 Self-Check） |

**门禁时刻 porcelain（`packages packages-user src`）：** 仅用户既有 ` M packages-user/data-system/src/combat/context.ts` 一条（本计划只读，生产树零改动）；该用户改动全程未触碰。

## 人工复核结论（Task 4 步骤 8）

逐条打开当日源码核对，**全部通过，无偏差**：

- A 类锚点均指向真实声明：`texture`（`packages-user/client-base/src/elements/cache.ts:280` / 类 `:48`）、renderer 簇（`packages-user/client-modules/src/render/renderer.ts:18,20,35,43,45`）、`sceneController`（`packages-user/client-modules/src/render/scene.ts:3`）、UI 控制器（`packages-user/client-modules/src/render/ui/controller.tsx:11,29`）、全部 `GameUI` 实例定义行与组件定义行实读确认。
- A-32 `[证据行]` 完整性反查命令 `git grep -n -E "export const [A-Za-z0-9_]+ = new "` 原样输出与 A-01..A-31 逐条对齐，**无遗漏**。
- B 类锚点指向真实可变状态：`packages-user/client-modules/src/render/use.ts:34,35,287`、`packages-user/client-modules/src/action/hotkey.ts:5`、`packages-user/client-modules/src/render/weather/controller.ts:15,17`；B-09 `[证据行]` 复验 `client-base/src/elements` 面模块级 `let` 零命中。
- C 类锚点指向真实全局访问 / 引用：`Mota.require`（`packages-user/client-base/src/elements/cache.ts:491` / `misc.ts:89,219`）、`window.*`、`core.*`（计数与 `git grep -c` 一致）；C 类全节明写「legacy 只报告，不修、不登记为待办」；C-07 `[证据行]` 复验 `client-base` 运行时 `window.*` 仅注释命中。
- D 类锚点指向真实顶层语句：`packages-user/client-modules/src/action/hotkey.ts:9,470,471,523,526`、`packages-user/client-modules/src/render/use.ts:51`、`packages-user/client-modules/src/render/renderer.ts:22,26,32`；D-05 `[证据行]` 复验 `client-base/src/elements` 面顶层监听 / 定时器零命中。
- E 类目标接口证据锚点指向真实声明：`packages-user/client-base/src/types.ts:27`（`IClientBaseExtended`）、`packages-user/data-state/src/types.ts:45`（`ICoreStateExtended`）、`packages-user/client-base/src/material/types.ts:94,218,406,439`（四处 `extends ICoreStateExtended`）、`packages-user/data-state/src/ins.ts:11`（数据端单例）实读确认。
- F 类 7 条均未越过「只登记不判定」边界，逐条为「现象 + 为什么读不出来 + 需要用户裁决的点」，无「错配 / 缺失 / 残留 / 待办」措辞。
- `packages-user/client-base/src/index.ts:1-9` / `packages-user/client-modules/src/index.ts:9-16` 及各子 barrel（`elements/index.ts:46-48` / `components/index.ts:1-12` / `render/index.tsx:38-44` / `render/ui/index.ts:7-14`）导出面实读确认，D-69 判定与事实一致。

## Decisions Made

- **只读收集小切片（用户 2026-10-01 去单例化第一步）**：唯一交付物为台账 + 本 SUMMARY；生产源码改动 0，`files_modified` 仅台账。
- **单一白名单提交**：Task 1/2/3 不独立提交；Task 4 步骤 (10) 单次提交，仅暂存台账 + SUMMARY。
- **undetermined 纪律**：目标接口取舍 / 外部框架级全局归属 / renderer 重复单例权威 / `GameUI` 实例是否纳入 一律进 F 类，不臆测、不裁定、不给挂载写法（新增命名须先获批）。
- **未写其它 `.planning/` 文件**：按 orchestrator 指示与计划 prohibitions，除本 SUMMARY 外未写 `STATE.md` / `ROADMAP.md` / `WINDOWS.md` / `REQUIREMENTS.md`（`REND-01` / `REND-02` 保持 Pending；ROADMAP 的 `04-15` / `Wave 14` 登记由编排器在计划阶段完成）。

## Deviations from Plan

None - plan executed exactly as written（无 Rule 1–4 偏差）。

说明：Task 1/2/3/4 每条 `<automated>` 均按计划 `## Verification Runnability` 的指示，将原样语义落到仓库外临时 `.cjs` 后 `node <file>` 执行（判据与 `<fails_when>` 一字不变）；这是计划明示的既定做法（先例 04-12 / 04-14），**不构成偏差**。

## Known Stubs (只报告不处置)

| # | 余留 | 位置 | 说明 |
|---|---|---|---|
| 1 | 目标接口取舍未定 | `texture` / client-base `GameUI` / 模块级状态 | F-05 交用户裁决（`IClientBaseExtended` vs `ICoreStateExtended`） |
| 2 | 外部框架级全局能否挂主类未定 | `mainRenderer` / `using` / `tagManager` / `gameKey` / `sceneController` / `mainUIController` | F-01 交用户裁决 |
| 3 | renderer 重复单例权威归属未定 | `packages-user/client-modules/src/render/renderer.ts:18,20,35` ↔ `packages-user/client-modules/src/client.ts:90,91,108` | F-02 交用户裁决 |
| 4 | `GameUI` / `UIController` 实例是否纳入未定 | 20 个 `GameUI` 实例 | F-03 交用户裁决 |
| 5 | `window` 顶层副作用与无 DOM 约束关系未定 | `packages-user/client-modules/src/render/use.ts:51` | F-04 交用户裁决 |
| 6 | `IClientBaseExtended` 现行实现情况未知 | `packages-user/client-base/src/types.ts:27` | F-06 交用户裁决 |
| 7 | 状态栏 UI 无消费者 | `packages-user/client-modules/src/render/ui/statusBar.tsx:488,489` | F-07 交用户裁决 |

> 依 orchestrator 指示与计划 Task 4 步骤 (11)，未写入 `.planning/WINDOWS.md` / `STATE.md` / `ROADMAP.md`（本步仅允许写台账与 SUMMARY）。

## Issues Encountered

- 无。全部门禁一次通过；无 Rule 1–4 偏差。

## 无运行时验证声明（D-68 的延续）

- 本步**没有「保证能运行」的要求**：**未运行** `pnpm check:type` / `pnpm build`，**未使用** TS 诊断数（全仓或范围内）作为任何门禁或验收项。
- 证明方式全部为**静态**：`git status --porcelain` 正向基线（含用户 `combat/context.ts` 行在场 + 无其它条目 + `git hash-object` 与台账标记一致）/ 台账结构与全量关键锚点 / 分类关键词 / 禁用路径 porcelain / 既有产物保护 / ROADMAP 登记 / CRLF，辅以人工代码复核。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **第一步（只读收集）完成**：A 30 对象 / B 8 / C 6 / D 4 / E 7 条 + F 7 条 + 单例→目标映射汇总 41 行；可确定目标（如 `client` 即主类本身）与 undetermined 项（外部框架级全局 / 重复单例 / 接口取舍 / `GameUI` 实例）分离清晰。
- **第二步（04-16：挂载 + 接口继承重构）未规划**，待用户审阅 `04-RENDER-SINGLETON-AUDIT.md` 后另行规划；本步不产出任何新 `*-PLAN.md`，第二步如确需新增命名（挂载字段 / 接口名）须先获用户批准（AGENTS.md）。
- **D-69 与 legacy 边界遵守**：D 类 barrel 涉及只登记；C 类 `core.*` / `Mota.require` / `window.*` 一律只报告、不修、不登记为待办。
- **范围零外溢**：`packages-user/client-base/src/material/**`（D-42 / D-48）、`packages/**`、`src/**`、测试文件全部零触碰；用户 `packages-user/data-system/src/combat/context.ts` 并发改动保留且未被提交。
- `REND-01` / `REND-02` 仍为 **Pending**；`.planning/REQUIREMENTS.md` 零改动。

---
*Phase: 04-render-adaptation*
*Completed: 2026-10-01*

## Self-Check: PASSED

- `.planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md`: FOUND（12 小节 + A–E 60 行 + F 7 条 + 单例→目标映射汇总 41 行 + 处置）
- `.planning/phases/04-render-adaptation/04-15-SUMMARY.md`: FOUND
- 生产源码改动: 0（`git status --porcelain -- packages packages-user src` 仅用户既有 ` M packages-user/data-system/src/combat/context.ts`）；`material/` / `packages/` / `src/` 零触碰
- 用户并发改动 `packages-user/data-system/src/combat/context.ts`: PRESERVED（未提交、未触碰，哈希 `9982509d3d8ec4c58d5c71f37f1a576a13c3337f`）
- `04-01`..`04-14` 既有产物: 零触碰；无 `04-16+`
- commits measured from ledger (`2d32878..HEAD`): 1（白名单提交）
