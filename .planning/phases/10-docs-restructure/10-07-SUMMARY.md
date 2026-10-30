---
phase: 10-docs-restructure
plan: 07
subsystem: documentation
tags: [vitepress, docs, markdown, intermediate-tutorial, gap-closure]

requires:
  - phase: 10-docs-restructure
    provides: 24 篇中级教程初稿与 D-09 人工复审结论（10-06 Task 2 未通过）
provides:
  - data-state-overview 用平实语言讲清 state 是什么及三类获取方式
  - data-vs-render / enemy-map-damage 清除 legacy 痕迹
  - hero-attribute 修饰器定位纠正为「临时与永久皆可」
  - 全 24 篇 legacy 扫描结论
affects: [10-08, 10-09, 10-10]

actuals:
  tokens: 1184
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "state 获取方式的统一口径：参数传入 / handler.state / this.state，示例默认 state 已在作用域"

key-files:
  created: []
  modified:
    - docs/intermediate/data-state-overview.md
    - docs/intermediate/data-vs-render.md
    - docs/intermediate/enemy-map-damage.md
    - docs/intermediate/hero-attribute.md

key-decisions:
  - "state 获取方式统一口径（三类：框架参数传入 / handler.state / 自行保存 this.state），后续 10-08/10-09/10-10 引导式重写须沿用"
  - "data-vs-render 的 legacy :::info 整块移除并改写为不含 legacy 接口名的平实句，保留 D-21（不提反向推送）"
  - "enemy-map-damage 仅以全局 flag 名 betweenAttackMax 描述，去掉旧主对象全局前缀 core.（不改述 D-39 语义）"
  - "hero-attribute 修饰器不再框定为「临时」；临时效果靠不再需要时 deleteModifier 移除实现"

patterns-established:
  - "文档修正以目标 finding 为界，越界命中只记录不实施（D-14）"

requirements-completed: []

coverage:
  - id: D1
    description: "data-state-overview 解释主对象 state 是什么，并列出三类获取方式（框架参数传入含 useEffect/插件/env.state、handler.state、this.state）"
    verification:
      - kind: automated_ui
        ref: "docs/intermediate/data-state-overview.md#state 从哪来 (静态门禁 STATIC-OK: handler.state/this.state/env.state 命中, 单 H1, CRLF)"
        status: pass
    human_judgment: true
    rationale: "D-09 验收标准要求用户人工审阅文档；静态门禁只证明符号存在，不判定表达是否真正讲清。"
  - id: D2
    description: "legacy 泄漏清除：data-vs-render 无 Mota.r，enemy-map-damage 无 core.flags 前缀，全 24 篇扫描无其它 legacy 命中"
    verification:
      - kind: automated_ui
        ref: "docs/intermediate/data-vs-render.md / enemy-map-damage.md (静态门禁 STATIC-OK: 无 LEGACY-MOTA/LEGACY-COREFLAGS, 保留 betweenAttackMax)"
        status: pass
    human_judgment: true
    rationale: "D-09 要求人工审阅；扫描结论需用户确认越界命中处理（D-14）。"
  - id: D3
    description: "hero-attribute 不再把修饰器框定为「临时」：标题与正文改为临时/永久皆可，新增移除式临时用法说明"
    verification:
      - kind: automated_ui
        ref: "docs/intermediate/hero-attribute.md (静态门禁 STATIC-OK: 无 BAD-MODIFIER-HEADING/BAD-TEMP-FRAMING, ValueModifier/PercentageModifier/addModifier/deleteModifier 命中)"
        status: pass
    human_judgment: true
    rationale: "D-09 要求人工审阅文档表述。"
  - id: D4
    description: "构建通过且 0 dead link；4 篇保持 kebab-case、CRLF、单 H1"
    verification:
      - kind: integration
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> exit 0, \"build complete in 13.54s\", 无 dead link / import 失败"
        status: pass
    human_judgment: false

duration: ~15 min
completed: 2026-10-17
status: complete
plan_head_before: 49ecbfb89e1b7df1f82169cd29355b1f987ccc00
---

# Phase 10 Plan 07: 修正 D-09 复审第 1/3/4 条 Summary

**讲清数据端 `state` 的三类获取方式、清除 2 处 legacy 泄漏（全 24 篇扫描）、把 `hero-attribute` 修饰器定位从「临时」纠正为「临时/永久皆可」；构建转绿。**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-10-17
- **Completed:** 2026-10-17
- **Tasks:** 3（Task 0 为已获批准的 checkpoint，未计入本轮执行）
- **Files modified:** 4

## Accomplishments

- `data-state-overview` 新增「state 从哪来」小节：以「总目录」比喻解释主对象 `state`，列出三类获取方式——① 框架作为参数传入（道具 `useEffect(item, state)`、插件 `awake/initialize/afterLoad(state, ...)`、事件 `env.state`）；② 从处理对象取 `handler.state`；③ 存到自己的对象 `this.state`；并说明后续示例默认 `state` 已在作用域中。
- 清除 2 处 legacy 泄漏：`data-vs-render` 移除含 legacy 全局包裹接口 `Mota.r(() => {})` 的 `:::info`（改写为不含接口名的平实句，保留 D-21）；`enemy-map-damage` 去掉旧主对象全局前缀 `core.flags.`，仅保留全局 flag 名 `betweenAttackMax`。
- 全 24 篇 legacy 扫描：除上述两处外无其它 legacy 全局包裹接口或旧主对象全局前缀对象访问；`ICoreState`（当前类型名）与 `core.jsonc`（文件名）按计划明确不计入。
- `hero-attribute` 修饰器定位纠正：标题改为「修饰器：数值与百分比加成」，正文明确「修饰器既可用于永久、也可用于临时，是否临时取决于何时移除」，新增「先 `addModifier`、不再需要时 `deleteModifier` 移除」的临时用法说明；保留永久示例与 `save` 语义。
- 构建通过、0 dead link；4 篇保持 kebab-case、CRLF、单 H1。

## Task Commits

Each task was committed atomically:

1. **Task 1: 讲清 state 获取方式（data-state-overview）** - `b30140d` (docs)
2. **Task 2: 清除 legacy 泄漏（data-vs-render、enemy-map-damage）+ 全批扫描** - `488c108` (docs)
3. **Task 3: 纠正修饰器定位（hero-attribute）** - `27050e9` (docs)

**Plan metadata:** `10-07-SUMMARY.md` follows this run.

## Files Created/Modified

- `docs/intermediate/data-state-overview.md` - 新增「state 从哪来」（三类获取方式），总目录比喻；保留对象表与 L0–L3 标注
- `docs/intermediate/data-vs-render.md` - 移除含 `Mota.r` 的 legacy `:::info`，改写为不含 legacy 接口名的平实句
- `docs/intermediate/enemy-map-damage.md` - `core.flags.betweenAttackMax` → 全局 flag `betweenAttackMax`
- `docs/intermediate/hero-attribute.md` - 修饰器标题与表述纠正为临时/永久皆可；新增移除式临时用法说明

## Decisions Made

- **`state` 获取方式统一口径**：三类（框架参数传入 / `handler.state` / 自行保存 `this.state`），后续 10-08/10-09/10-10 引导式重写须沿用，不得与之冲突（PLAN key_links）。
- **legacy `:::info` 整块移除 + 平实改写**：避免出现任何 legacy 接口名，同时满足 D-21（不提「渲染端不能反向推送」）。
- **`enemy-map-damage` 仅保留 flag 名**：源码实为 legacy 全局 `core.flags.betweenAttackMax`（`src/data/enemy/mapDamage.ts:238`），按计划以不含前缀的「全局 flag `betweenAttackMax`」描述，不改述 D-39 语义、不臆造 `state.flags` 访问。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `write` 工具写入的 `data-state-overview.md` 初为 LF，已用 PowerShell 归一化为 CRLF；其余三篇经 `edit` 编辑后本就保持 CRLF。Opencode 运行环境下 `rg` 不可用，legacy 扫描改用内置 grep 工具完成。

## Out-of-Scope Findings (D-14, 记录不实施)

- 全 24 篇扫描仅发现两处计划内 legacy 命中（已修正）。其余 `core` 相关出现均为**非 legacy**：`ICoreState` 类型名（`data-plugins.md:50`、`data-state-overview.md:7`、`enemy-status-hooks.md:79,83`）与文件名 `core.jsonc`（`src-tour.md:30`），按计划不计入，仅记录。

## Known Stubs

None（本计划改动的 4 篇不含 stub / 占位 / TODO）。

## Threat Flags

None - 无新增对外指向面；4 篇仅含文本、代码块与表格，未引入原始 HTML/`<script>`，未新增外链（唯一获批外链仍只在 `code-basics`），示例仅用源码已公开的接口。对应 T-10-19 / T-10-20 / T-10-21 均按 mitigate 处置。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- D-09 复审 finding 1、3、4 已落实，10-06 Task 2 的阻断项解除；`state` 获取口径可供 10-08/10-09/10-10 沿用。
- 构建门禁 `tsx docs/.vitepress/init.ts && pnpm docs:build` 转绿（`build complete`、0 dead link）。
- 无越界改动：未触碰 `docs/.vitepress/config.ts`、侧边栏或任何 `src/`、`packages/`、`packages-user/` 生产代码。

---
*Phase: 10-docs-restructure*
*Completed: 2026-10-17*

## Self-Check: PASSED

