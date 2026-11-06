---
phase: 04-render-adaptation
plan: 01
subsystem: render-adaptation / audit
tags: [audit, render, data-layer, interface-mismatch, legacy-path, readonly, crlf, d-01]

requires:
  - phase: 03-data-completion
    provides: 完成的数据端 L0–L3 接口契约与 CoreState 单例（本次对账的接口基准）
provides:
  - 渲染端 ↔ 数据端接口对账账本（8 段骨架 + ①/②/③ 三分类互斥登记）
  - 9 条 ① 错配（#04-01-M-01..09）与 42 条 ③ 多余旧路径（#04-01-L-01..42），每条含 `file:line` 锚点且 ① 条引用数据端基准
  - 数据端缺失候选与「未能从阅读确定」清单（供用户裁决 REND-01/REND-02 后续拆分）
  - 双布局既有资产登记（`render/use.ts` 的 Orientation/onOrientationChange、`shared.ts` 布局常量）
affects: [REND-01, REND-02, phase-04 remaining plans, Phase 5 legacy 移植]

actuals:
  tokens: 6568
  tasks: 3
  commits: 3
plan_head_before: 7225bdd4372c46ef97512e67c6758f12aec5a97c

tech-stack:
  added: []
  patterns:
    - 只读对账：以数据端接口签名为基准（D-04/D-05），不改任何生产代码
    - 三分类互斥登记（① 错配 / ② 数据端缺失独立成节 / ③ 多余旧路径），每条精确到接口名 + `file:line`

key-files:
  created:
    - .planning/phases/04-render-adaptation/04-RENDER-INTERFACE-AUDIT.md
  modified: []

key-decisions:
  - "按用户分类规则，带 `// @ts-expect-error 需要重构` 的 import（HeroMover/IMoveController、HeroAnimateDirection、IHeroMoveController(Hooks)、getHeroStatusOn、ItemState、state.maps layerState）一律归 ① 错配（渲染侧适配项），不归 ②。"
  - "② 数据端缺失节本步未确认任何缺失项：候选（core.firstData 工程元数据、勇士渲染粒度钩子）无法仅凭静态阅读定性，按要求转入「未能从阅读确定（未猜测）」而非臆造缺失接口。"
  - "素材/工具/行为命令类 core.* 读取（core.material.*/core.icons.*/formatBigNumber 等）归「判定为匹配的同类边界」，不误报为数据端错配。"
  - "REND-01/REND-02 不标记完成：本 run 只交付差异账本，适配实施与双布局未规划、未实施，需求保持 Pending。"
  - "被查两包零改动；审计文档全文 CRLF（dev.md「换行使用 CRLF 格式」）。"

patterns-established:
  - "渲染接口对账以「接口签名」为准，不受用户并行修改数据端实现的影响（D-04/D-05）"
  - "区分「数据端状态读取」与「渲染侧素材/工具/行为命令」的判定口径（A3 判据）"

requirements-completed: []

coverage:
  - id: D1
    description: "只读接口对账账本 04-RENDER-INTERFACE-AUDIT.md：8 段骨架、三分类记录、匹配边界、未确定段、处置（零生产代码改动）"
    requirement: REND-01
    verification:
      - kind: other
        ref: "node gates: 8 headings / 51 finding rows (9 M + 42 L) each with file:line / CRLF / `git status --porcelain -- packages-user/client-base packages-user/client-modules` empty"
        status: pass
    human_judgment: true
    rationale: "对账账本的完整性/定性正确性（是否漏报、错报、候选定性）须由用户审阅裁决，非机器门禁可证"

duration: 11min
completed: 2026-09-18
status: complete
---

# Phase 4 Plan 01: 渲染适配与双布局（第一步·只读接口对账）Summary

**纯只读的渲染端 ↔ 数据端接口对账账本：9 条 ① 错配 + 42 条 ③ 多余旧路径 + 独立 ② 缺失节（本步未确认缺失），每条带 `file:line` 锚点，被查两包零改动**

## Performance

- **Duration:** 11 min
- **Started:** 2026-09-18T10:40:00+08:00（approx）
- **Completed:** 2026-09-18T10:51:00+08:00（approx）
- **Tasks:** 3
- **Files modified:** 1（新建审计文档；零生产代码改动）

## Accomplishments

- 新建 `.planning/phases/04-render-adaptation/04-RENDER-INTERFACE-AUDIT.md`，含 8 个二级标题（背景 / 方法 / 发现 / ② 数据端缺失接口 / 触发序列（举例） / 判定为「匹配」的同类边界 / 未能从阅读确定（未猜测） / 处置），全文 CRLF。
- ① 错配全量清点 9 条（`#04-01-M-01..09`）：HeroMover/IMoveController、HeroAnimateDirection、IHeroMoveController(Hooks)、成员形状、getHeroStatusOn、ItemState、`state.maps` layerState、IGameMapHooks.onUpdateLayerArea/onUpdateLayerBlock；每条引用数据端基准 `file:line`（D-05）。
- ③ 多余旧路径全量清点 42 条（`#04-01-L-01..42`），覆盖 main/statistics/viewmap/settings/save/toolbar/statusBar/choices/floorSelect/saves/fallback 等 legacy `core.*` 数据端状态读取，按 A3 判据排除 `core.material.*` 素材族等误报。
- 「匹配边界」段给出素材族判据与 A1/A2/A4/A5/A7 解析一致结论；「未能从阅读确定」段逐条登记 15 类无法静态定论项（含 `core.firstData` 元数据、无对位旧状态读、旧存档内部态等）。
- 门禁全绿：8 标题 / 51 行记录（9 M + 42 L）均含 `file:line` / CRLF / 锚点可追溯（20 条 client 路径全部 tracked）/ `git status --porcelain -- packages-user/client-base packages-user/client-modules` 为空 / 无 04-01 以外计划文件。

## Task Commits

Each task was committed atomically:

1. **Task 1: 审计文档骨架端到端贯通** — `05b9af7` (docs)
2. **Task 2: ① 错配全量清点** — `c0b44c1` (docs)
3. **Task 3: ③ 多余旧路径全量清点 + ② 收口 + 门禁** — `4327e67` (docs)

**Plan metadata:** pending final metadata commit

## Files Created/Modified

- `.planning/phases/04-render-adaptation/04-RENDER-INTERFACE-AUDIT.md` — 只读接口对账账本（本 run 唯一新增文件）

## Decisions Made

- **既有重构标记的归类**：按用户规则，带 `// @ts-expect-error 需要重构` 的 import 属渲染端需局部重构，归 ① 错配，不归 ②。
- **② 节零确认**：不臆造数据端缺失项；候选（`core.firstData` 工程元数据、勇士渲染粒度钩子）转入「未能从阅读确定（未猜测）」。
- **需求状态**：REND-01/REND-02 保持 Pending —— 本 run 只交付清点账本，未实施适配/双布局。
- **零生产改动**：只写审计文档，被查两包保持零改动。

## Deviations from Plan

None - plan executed exactly as written.

> 说明：计划 Task 2/3 要求派 D-09 只读子代理完成重型整文件扫描；本 run 由编排方预先完成该委派并交付三份只读事实表（`gsd-04-scan-1..3.md`），执行者据事实表定性并逐条复核锚点，未额外派子代理、未整文件读取被委派文件。审计覆盖面（A1..A7）与门禁不变，属执行手段的等价替换，非计划偏离。

## Issues Encountered

- 无。三份事实表与实测锚点逐条核对一致；`data-state`/`data-base` 的 `HeroMover`/`IMoveController`/`HeroAnimateDirection` 确无导出（对账定性为 ① 的依据）。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 对账账本已就绪，供用户决定阶段 4 剩余工作（适配实施 + 移动端/桌面端双布局）如何拆分。
- **待用户补齐**：REND-01、REND-02 的验收边界（当前为 specless fallback flagged assumption，见 04-01-PLAN）。
- **已知后续起点**：双布局既有资产 `render/use.ts`（Orientation/onOrientationChange）与 `shared.ts` 布局常量仅在「处置」段登记，未展开实施。
- **风险提示**：`#04-01-M-04`（IHeroMoveControllerHooks）与「② 候选·勇士渲染粒度钩子」可能重叠，拆分实施时需一并裁定。

---
*Phase: 04-render-adaptation*
*Completed: 2026-09-18*

## Self-Check: PASSED

- FOUND: `.planning/phases/04-render-adaptation/04-RENDER-INTERFACE-AUDIT.md`
- FOUND: `.planning/phases/04-render-adaptation/04-01-SUMMARY.md`
- FOUND commit: `05b9af7` (Task 1)
- FOUND commit: `c0b44c1` (Task 2)
- FOUND commit: `4327e67` (Task 3)
