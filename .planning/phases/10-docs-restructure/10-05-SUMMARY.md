---
phase: 10-docs-restructure
plan: 05
subsystem: docs
tags: [vitepress, markdown, intermediate-tutorial, events, replay, data-plugins]

# Dependency graph
requires:
  - phase: 10-docs-restructure
    provides: [10-01 legacy cleanup + intermediate registration, 10-02/03/04 written intermediate pages]
provides:
  - "docs/intermediate/events.md (自定义事件)"
  - "docs/intermediate/replay-commands.md (录像指令)"
  - "docs/intermediate/data-plugins.md (数据插件)"
affects: [10-verify-work, advanced tutorial (plugin internals), future replay-command tutorials]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 1780
  tasks: 1
  commits: 1

# Tech tracking
tech-stack:
  added: []
  patterns: ["VitePress 单 H1 + H2 页面骨架", "how-to 代码块 + // [!code ++] 标注新增行", ":::info / :::warning 提示容器", "A（自动）校验 kebab-case / CRLF / 单 H1 / 关键符号"]

key-files:
  created:
    - docs/intermediate/events.md
    - docs/intermediate/replay-commands.md
    - docs/intermediate/data-plugins.md
  modified: []

key-decisions:
  - "events 仅讲自定义内建函数；内置事件只作少量导读，不列全量；编辑器识别方式按 N-6 留余地"
  - "replay-commands 依 D-43 只讲核心原则与主动/被动录像、@shouldReplay/@ignoreReplay，不给任何示例"
  - "data-plugins 依 D-44/D-19/N-4 将示例写为「占位 / 待提供」，不使用商店插件作示例"
  - "三篇仅回指已写就的 intermediate 页面，不链接任何尚未写就的页面"

patterns-established:
  - "概念/说明型页面（replay-commands）不写代码块，只写原则与接口说明"
  - "占位示例用 :::info 容器明确标注「占位 / 待提供」"

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "docs/intermediate/events.md：自定义事件内建函数（BuiltInFunction/IBlockEventEnv/参数接口/createEventRegistrations）+ setFlag、healHero 两个示例 + 编辑器识别留余地"
    verification:
      - kind: other
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" (build complete in 11.26s)"
        status: pass
    human_judgment: true
    rationale: "D-09 验收 = 用户人工审阅；D-42 要点齐全度、留余地处措辞需人判断"
  - id: D2
    description: "docs/intermediate/replay-commands.md：核心原则、主动/被动录像、自定义指令三步、@shouldReplay/@ignoreReplay 与 begin/end 区间；不给示例"
    verification:
      - kind: other
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" (build complete in 11.26s)"
        status: pass
    human_judgment: true
    rationale: "D-09 人工审阅；D-43「不给示例」与措辞需人判断"
  - id: D3
    description: "docs/intermediate/data-plugins.md：IDataPluginDefine、awake→initialize→afterLoad 时机次序、dataPlugins 注册、addSaveableContent、占位示例"
    verification:
      - kind: other
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" (build complete in 11.26s)"
        status: pass
    human_judgment: true
    rationale: "D-09 人工审阅；D-44/N-4 占位示例与留余地措辞需人判断"

# Metrics
duration: ~15min
completed: 2026-10-17
status: complete
---

# Phase 10 Plan 05: 其他组文档（events / replay-commands / data-plugins） Summary

**新增中级教程「其他」组 3 篇：自定义事件、录像指令、数据插件，均按 D-42..D-44 落笔、符号逐字核对当时代码，且构建通过。**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-10-17T18:45:00Z
- **Completed:** 2026-10-17T18:59:57Z
- **Tasks:** 1（另 Task 0 为已获批准的汇报关卡，非实现任务）
- **Files modified:** 3（全部为新增）

## Accomplishments

- `docs/intermediate/events.md`：讲清如何自定义事件内建函数——`BuiltInFunction`（`name` + `func(param, env)`）、`IBlockEventEnv` 常用字段表、参数接口在 `types.ts`、注册入口 `createEventRegistrations()`（现有 7 个内置事件的少量导读），并给出「设置 Flag」「勇士回血」两个自定义示例；编辑器识别方式按 N-6 留余地。
- `docs/intermediate/replay-commands.md`：讲清录像系统用途与**核心原则**「玩家直接产生、会影响最终成绩的行为必须计入录像」，主动/被动录像（`ReplayCommandType.Active`/`Passive`），自定义录像需改 `packages-user` 下引擎内容的三步，以及 `@shouldReplay`/`@ignoreReplay` 与 begin/end 区间检测——**不给示例**（D-43）。
- `docs/intermediate/data-plugins.md`：讲清插件是强拓展系统、`IDataPluginDefine`（`id`/`dependencies`/`awake`/`initialize`/`afterLoad`）、时机次序 `awake`（装配）→ `initialize`（加载前）→ `afterLoad`（加载后）、`src/data/plugin/list.ts` 的 `dataPlugins` 注册、`state.addSaveableContent`；示例按 N-4 写为**占位 / 待提供**，未使用商店插件。
- 三篇均 kebab-case、CRLF、单 H1、无外链、无禁止的元叙述；跳转链接只回指已写就的 intermediate 页面。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写 events、replay-commands、data-plugins** - `2266c15` (docs)

**Plan metadata:** (final docs commit, orchestrator/executor metadata)

_Note: Task 1 标记 tdd="true"，实际以计划内 `<verify>` 自动化门禁作为 RED/GREEN 判据（先无文件 → `STATIC-OK` 通过）。_

## Files Created/Modified

- `docs/intermediate/events.md` - 自定义事件：BuiltInFunction、IBlockEventEnv、参数接口、注册、两个自定义示例、编辑器识别留余地
- `docs/intermediate/replay-commands.md` - 录像指令：核心原则、主动/被动录像、新增指令三步、@shouldReplay/@ignoreReplay（无示例）
- `docs/intermediate/data-plugins.md` - 数据插件：IDataPluginDefine、时机次序、注册、可存档内容、占位示例

## Decisions Made

- `events` 内置事件仅作「少量导读」（列 `map.ts`/`hero.ts`/`event.ts` 三组各举特征），不列全量；编辑器识别按 N-6 明确「尚未最终确定」，不写死规则。
- `replay-commands` 严格遵守 D-43：整篇不含任何代码示例（概念/说明型页面），`@shouldReplay` 以正文明文出现以满足门禁与要点。
- `data-plugins` 依 D-44/D-19/N-4：示例章节写为「占位 / 待提供」，并写明「是否纳入本篇取决于示例难度」；参考实现（商店插件）只作内部核对，不作示例。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. 自动化门禁 `STATIC-OK` 通过；计划级构建 `pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build` 通过（build complete in 11.26s，无死链报错）。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 「其他」组 3 篇落位，中级教程第一批 24 篇全部写就。
- 待办（已在 CONTEXT `deferred` 记录）：`data-plugins` 的简单插件示例待用户提供（N-4）；编辑器事件识别方式确定后需回填 `events` 留余地处（N-6）。
- 验收随 D-09：需用户人工审阅 + 链接有效（构建已过）+ 构建通过。

---
*Phase: 10-docs-restructure*
*Completed: 2026-10-17*

## Self-Check: PASSED

- FOUND: docs/intermediate/events.md
- FOUND: docs/intermediate/replay-commands.md
- FOUND: docs/intermediate/data-plugins.md
- FOUND: .planning/phases/10-docs-restructure/10-05-SUMMARY.md
- FOUND: 2266c15 (Task 1 commit)
