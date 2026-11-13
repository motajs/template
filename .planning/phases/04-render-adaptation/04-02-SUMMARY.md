---
phase: 04-render-adaptation
plan: 02
subsystem: render-adaptation / interface-exploration
tags: [audit, hero-mover, render, data-layer, interface-reconciliation, readonly, crlf, d-17]

requires:
  - phase: 04-render-adaptation
    provides: 04-RENDER-INTERFACE-AUDIT.md 的勇士移动失配登记（#04-01-M-01..05）与「未能从阅读确定」中的移动钩子候选
provides:
  - 勇士移动子系统只读接口探索账本（8 段骨架：背景 / 方法 / 数据端现行接口 / 渲染端现状 / 逐成员对账 / 缺失接口候选 / 未能从阅读确定 / 处置）
  - 逐成员三态对账 12 条（#04-02-R-01..12），每条同行含渲染端与数据端两侧 file:line 锚点
  - 缺失接口候选 2 条（#04-02-G-01..02，移动语义钩子族 / HeroKeyMover 的 oneStep 与控制器队列）+ 固定结论行
  - 数据端现行接口面 + 渲染端现状面成员级清单（含 barrel 实际导出核对、@ts-expect-error 全量清单）
affects: [REND-01, REND-02, phase-04 remaining plans, 勇士移动适配 04-03+]

actuals:
  tokens: 7400
  tasks: 4
  commits: 3
plan_head_before: 35a5973cbeada7e464d56f17340d4c7bbf43d1bb

tech-stack:
  added: []
  patterns:
    - 只读接口探索：逐成员三态对账（匹配 / 渲染端需改 / 数据端缺失），每条两侧 file:line，静态不可定论者进「未能从阅读确定」
    - 缺失接口候选独立成节、只记录不设计（D-13）；节末结论行 N 等于候选条数

key-files:
  created:
    - .planning/phases/04-render-adaptation/04-HERO-MOVER-INTERFACE.md
  modified: []

key-decisions:
  - "带 `// @ts-expect-error 需要重构` 的 import（HeroMover/IMoveController、HeroAnimateDirection、IHeroMoveController(Hooks)）一律归「渲染端需改」，不归「数据端缺失」。"
  - "勇士移动语义钩子族（onMoveHero / onJumpHero / onTurnHero / onStartMove / onEndMove）与 HeroKeyMover 依赖的 oneStep / 控制器 queue 登记为 2 条缺失接口候选；只记录、不设计、不修复，未经用户裁决不视为最终缺失清单（D-13）。"
  - "HeroRendering 渲染状态（IHeroRendering / 贴图别名 / alpha 钩子，D-18）与 legacy core.*（D-12）为显式排除项：不产生对账行或候选，仅在「处置」与范围排除说明中登记；勇士移动契约与移动钩子仍在范围内照常登记。"
  - "REND-01/REND-02 保持 Pending：本 run 只交付只读探索账本，未实施适配、未实施双布局。"
  - "被查渲染端两包相对记录在「## 方法」的扫描前基线零变化（porcelain 条目逐条一致 + 基线摘要 sha256 未变），用户既有 client-base/src/load/** 改动未被回滚/暂存/提交；交付文档全文 CRLF。"

patterns-established:
  - "勇士移动接口差异钉到成员级：三态对账 + 双侧 file:line，作为后续适配计划的输入"
  - "排除边界的机器可判定化：对账行 / 缺失候选 / 未确定节不得出现 D-18 禁用词"

requirements-completed: []

coverage:
  - id: D1
    description: "只读接口探索账本 04-HERO-MOVER-INTERFACE.md：8 段骨架、12 条三态对账（两侧 file:line）、2 条缺失接口候选、7 条未确定项、处置（零生产代码改动）"
    requirement: REND-01
    verification:
      - kind: other
        ref: "node gates: 8 headings / recRows 12 each two-sided / gapCandidates 2 with 渲染端需求+数据端现状+待确认 + conclusion N=2 / undetermined non-empty / CRLF 207 lines / baseline sha256 unchanged / plan scope 04-01,04-02"
        status: pass
    human_judgment: true
    rationale: "对账定性（是否漏报/错报、缺失候选是否成立、排除边界是否得当）须由用户审阅裁决，非机器门禁可证"

duration: 23min
completed: 2026-09-18
status: complete
---

# Phase 4 Plan 02: 勇士移动子系统只读接口探索 Summary

**勇士移动子系统的只读接口探索账本：12 条逐成员三态对账（匹配 / 渲染端需改 / 数据端缺失，每条两侧 `file:line`）+ 2 条缺失接口候选（移动语义钩子族、oneStep/控制器队列）+ 7 条未确定项，零生产代码改动、全文 CRLF**

## Performance

- **Duration:** 23 min
- **Started:** 2026-09-18T12:24:00+08:00（approx）
- **Completed:** 2026-09-18T12:47:00+08:00（approx）
- **Tasks:** 4（Task 0 汇报关卡已由用户「可以执行」放行；Task 1–3 执行并各自提交）
- **Files modified:** 1（新建探索文档；零生产代码改动）

## Accomplishments

- 新建 `.planning/phases/04-render-adaptation/04-HERO-MOVER-INTERFACE.md`，含 8 个二级标题（背景 / 方法 / 数据端现行接口 / 渲染端现状 / 逐成员对账（匹配 / 渲染端需改 / 数据端缺失） / 缺失接口候选 / 未能从阅读确定（未猜测） / 处置），全文 CRLF。
- `## 方法` 记录**扫描前基线**（逐行原样抄录 `git status --porcelain -- packages-user/client-base packages-user/client-modules` 的两条用户既有改动：`client-base/src/load/loader.ts`、`types.ts`）与 `基线摘要 sha256=749738446936…`；只读门禁断言相对基线零变化。
- **逐成员三态对账 12 条**（`#04-02-R-01..12`）：钩子族、`HeroMover`/`IMoveController` import 源与类型名、`HeroAnimateDirection`、`IHeroMoveController`、`hero.x/y`、`hero.direction`、`hero.addHook`、跟随者增删钩子、`HeroKeyMover` 单步启动期望、`controller.queue`、`controller.onEnd/stop/stepEnd`、`heroMap` 键类型；其中 2 条判为**匹配**（`hero.x/y`、`hero.addHook`），其余判为**渲染端需改**，每条同行含两侧 `file:line`。
- **缺失接口候选 2 条**（`#04-02-G-01` 移动语义钩子族、`#04-02-G-02` oneStep 与控制器队列），每条含 `渲染端需求` / `数据端现状` / `待确认`，数据端现状引用最接近的现行成员 `file:line`；节末固定结论行 N=2；只记录、不设计、不修复（D-13）。
- 数据端现行接口面与渲染端现状面成员级落位（数据端 26 个 `data-*` 锚点、渲染端 50 个 `client-*` 锚点），含各包 `index.ts` barrel 实际导出核对与 `// @ts-expect-error 需要重构` 全量清单。
- 门禁全绿：8 标题 / recRows 12 / gapCandidates 2（结论 N=2）/ undetermined 7 条 / CRLF 207 行 / 基线条目与摘要未变 / 计划文件仅 04-01、04-02。

## Task Commits

Each task was committed atomically:

1. **Task 1（tracer）: 骨架 + R-01 端到端切片** - `5f27436` (docs)
2. **Task 2: 数据端现行接口 + 渲染端现状两侧清单** - `77e2ad5` (docs)
3. **Task 3: 逐成员三态对账 + 缺失候选 + 未确定/处置定稿 + 门禁** - `d4fe24c` (docs)

**Plan metadata:** pending final metadata commit (SUMMARY / STATE / ROADMAP)

## Files Created/Modified

- `.planning/phases/04-render-adaptation/04-HERO-MOVER-INTERFACE.md` — 勇士移动子系统只读接口探索账本（本 run 唯一新增文件）

## Decisions Made

- 既有重构标记的归类：带 `// @ts-expect-error 需要重构` 的 import 属渲染端需局部重构，归「渲染端需改」，不归「数据端缺失」。
- 缺失候选只登记不设计：移动语义钩子族与 `oneStep`/控制器 `queue` 各一条候选，数据端现状引用最接近成员，待用户裁决（D-13）。
- 显式排除：`HeroRendering` 渲染状态（D-18）与 legacy `core.*`（D-12）不产生对账行/候选；勇士移动契约与移动钩子仍在范围内。
- 需求状态：REND-01/REND-02 保持 Pending —— 本 run 只交付探索账本，未实施适配/双布局。

## Deviations from Plan

None - plan executed exactly as written.

> 说明：计划 Task 1/2 提及按 D-09 委派只读子代理做重型整文件读取；本执行环境不提供子代理派发能力，执行者改为**直接只读**（Read / Grep / 目标切片）完成同等工作，未修改任何生产文件。覆盖面与门禁不变，属执行手段的等价替换，非计划偏离。

## Issues Encountered

- 无。数据端 `HeroAnimateDirection` / `IHeroMoveController` / `IHeroMoveControllerHooks` 经跨包检索确认无定义（对账定性为「渲染端需改」的依据）；基线两条用户改动在执行期间内容未变，只读门禁通过。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 探索账本已就绪，供用户裁决 2 条缺失接口候选并据此规划**勇士移动适配（04-03+）**。
- **待用户裁决**：`#04-02-G-01`（移动语义钩子由数据端补齐 vs 渲染端改接数据对象钩子）、`#04-02-G-02`（`oneStep`/`queue` 由数据端补齐 vs 渲染端改用 `step`+`push`）。
- **待用户补齐**：REND-01、REND-02 的验收边界（沿 04-01 的 specless fallback flagged assumption）。
- **排除项提醒**：`HeroRendering` 渲染状态（D-18）待用户先改数据端后再处理；legacy `core.*`（D-12）属第五阶段。

---
*Phase: 04-render-adaptation*
*Completed: 2026-09-18*

## Self-Check: PASSED

- FOUND: `.planning/phases/04-render-adaptation/04-HERO-MOVER-INTERFACE.md`
- FOUND: `.planning/phases/04-render-adaptation/04-02-SUMMARY.md`
- FOUND commit: `5f27436` (Task 1)
- FOUND commit: `77e2ad5` (Task 2)
- FOUND commit: `d4fe24c` (Task 3)
