---
phase: 10-docs-restructure
plan: 04
subsystem: docs
tags: [vitepress, combat, enemy, aura, query, final-effect, damage-calculator, map-damage, combat-script, status-hooks]

requires:
  - phase: 10-03
    provides: 基础接口组 8 篇与 docs/intermediate 目录
provides:
  - 战斗组 9 篇中级教程（combat-overview + 8 篇子系统）
affects: [10-05, 10-06, 10-docs-restructure]

actuals:
  tokens: 10539
  tasks: 3
  commits: 3
plan_head_before: 678addf2a4367e866cd0de39960fdbb8e119857a

tech-stack:
  added: []
  patterns:
    - VitePress 单 H1 + 相对链接 + mermaid
    - how-to 文档按「接口 → 注册 → 示例 → 注意事项」组织

key-files:
  created:
    - docs/intermediate/combat-overview.md
    - docs/intermediate/enemy-specials.md
    - docs/intermediate/enemy-aura.md
    - docs/intermediate/enemy-query.md
    - docs/intermediate/enemy-final.md
    - docs/intermediate/enemy-calculator.md
    - docs/intermediate/enemy-map-damage.md
    - docs/intermediate/enemy-combat-script.md
    - docs/intermediate/enemy-status-hooks.md
  modified: []

key-decisions:
  - "combat-overview 作为战斗入口，先讲 buildup 四阶段与整体流程，再用表格分流到各子系统"
  - "enemy-query 明确标注为引擎未内置的新增内容，按注册接口与抱团/同化/号角三个示例讲解"
  - "enemy-map-damage 的内置五类表按 mapDamage.ts 当时代码书写，并保留转换器读取 code 与 special.ts 注册码不一致的说明"
  - "组内链接只指向本计划内或已写就页面，不引入其他组的前向链接"

patterns-established:
  - "战斗文档统一从 combat-overview 进入，子系统篇回指流程"
  - "对尚未内置或待补齐的能力按接口与概念讲，不臆造已内置事实"

requirements-completed: []

coverage:
  - id: D1
    description: "combat-overview 含伤害流程 mermaid 与流程步骤对照表"
    verification:
      - kind: other
        ref: "pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "内容正确性与可读性需按 D-09 人工审阅"
  - id: D2
    description: "enemy-specials 含两类定义、自定义步骤、实现位置表与编辑器识别约定"
    verification:
      - kind: other
        ref: "pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "内容正确性与可读性需按 D-09 人工审阅"
  - id: D3
    description: "enemy-aura 先讲优先级，含两个自定义示例与 apply/applySpecial 差别"
    verification:
      - kind: other
        ref: "pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "内容正确性与可读性需按 D-09 人工审阅"
  - id: D4
    description: "enemy-query 标注为未内置，含常规/特殊查询接口与三个示例"
    verification:
      - kind: other
        ref: "pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "内容正确性与可读性需按 D-09 人工审阅"
  - id: D5
    description: "enemy-final 含接口、三方对比与仿攻示例"
    verification:
      - kind: other
        ref: "pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "内容正确性与可读性需按 D-09 人工审阅"
  - id: D6
    description: "enemy-calculator 含公式逐段导读、等差数列示例与临界约定"
    verification:
      - kind: other
        ref: "pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "内容正确性与可读性需按 D-09 人工审阅"
  - id: D7
    description: "enemy-map-damage 含三部分、内置五类表、遮挡激光示例与合并器说明"
    verification:
      - kind: other
        ref: "pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "内容正确性与可读性需按 D-09 人工审阅"
  - id: D8
    description: "enemy-combat-script 含脚本接口、内置脚本、选型表与两个示例"
    verification:
      - kind: other
        ref: "pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "内容正确性与可读性需按 D-09 人工审阅"
  - id: D9
    description: "enemy-status-hooks 含多钩子协同、三类内置状态与下次伤害翻倍示例"
    verification:
      - kind: other
        ref: "pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "内容正确性与可读性需按 D-09 人工审阅"

duration: 30min
completed: 2026-10-17
status: complete
---

# Phase 10 Plan 04: 战斗组文档 Summary

**战斗组 9 篇中级教程：从 buildup 与伤害流程总览，到光环、查询、最终、计算器、地图伤害、脚本与状态钩子的可操作示例**

## Performance

- **Duration:** 约 30 min
- **Started:** 2026-10-17T18:15:00+08:00
- **Completed:** 2026-10-17T18:47:00+08:00
- **Tasks:** 3
- **Files modified:** 9（全部为新增）

## Accomplishments

- 新增 `combat-overview`，用 mermaid 串起「基础数据 → 光环/查询/最终 → 伤害计算 → 战前脚本 → 战斗 → 战后脚本/状态钩子」，并附流程步骤到各文档的对照表。
- 新增 8 篇战斗子系统教程，覆盖特殊属性、光环、查询、最终效果、伤害计算、地图伤害、战斗脚本与状态钩子；每篇均按当前源码接口书写并给出可操作示例。
- `enemy-query` 明确标注为引擎未内置的新增内容，按注册接口讲解并用抱团、同化、号角三个示例覆盖典型用法。
- `enemy-map-damage` 的内置五类表按写作时的 `mapDamage.ts` 核对结果书写，并对转换器读取 code 与 `special.ts` 注册码未对齐的现状留出说明。
- 全部站内链接指向本计划内或已写就页面；9 篇均为 kebab-case、CRLF、单 H1，构建通过。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写 combat-overview、enemy-specials、enemy-aura** — `5528edc` (docs)
2. **Task 2: 编写 enemy-query、enemy-final、enemy-calculator** — `e13ebf7` (docs)
3. **Task 3: 编写 enemy-map-damage、enemy-combat-script、enemy-status-hooks** — `0868650` (docs)

**Plan metadata:** 待本 SUMMARY 提交后记录

## Files Created/Modified

- `docs/intermediate/combat-overview.md` — 战斗总览：伤害概念、buildup 四阶段、mermaid 流程与文档对照表。
- `docs/intermediate/enemy-specials.md` — 特殊属性：数据结构、两类定义、自定义步骤、实现位置表、编辑器识别约定与怪物比较。
- `docs/intermediate/enemy-aura.md` — 光环：优先级、内置三类、`apply`/`applySpecial` 差别、基础光环与特殊光环示例。
- `docs/intermediate/enemy-query.md` — 查询：未内置说明、常规/特殊查询接口、优先级与三个示例。
- `docs/intermediate/enemy-final.md` — 最终效果：接口、三方对比、仿攻示例与优先级说明。
- `docs/intermediate/enemy-calculator.md` — 伤害计算：接口、公式逐段导读、支援怪提示、等差数列示例与临界约定。
- `docs/intermediate/enemy-map-damage.md` — 地图伤害：视图/转换器/合并器、内置五类表、遮挡激光示例与结算说明。
- `docs/intermediate/enemy-combat-script.md` — 战斗脚本：接口、内置脚本、脚本 vs 钩子选型表、战前/战后示例。
- `docs/intermediate/enemy-status-hooks.md` — 状态钩子：多钩子协同、三类内置状态、注册与「下次战斗伤害乘二」示例。

## Decisions Made

- `combat-overview` 作为战斗组入口，先建立整体流程，再把细节分流到子系统文档，避免各篇重复解释上下文。
- `enemy-query` 按「新增内容」写，不假设引擎已注册查询效果；示例中的注册调用明确放在 `initializeEnemy` 的语境里。
- `enemy-map-damage` 不把不一致的 code 写成已对齐事实：表格同时列出转换器读取值、`special.ts` 注册值与差异说明，交给人审与后续实现确认。
- 只链接本计划内或已写就页面，不向尚未编写的「其他」组前向链接。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- 写作前核对 `mapDamage.ts` / `special.ts` / `types.ts` 时确认：转换器读取的 code（15/16/18/24/27）与 `special.ts` 注册码（13/14/16/22/24，且无 27）不一致，且 `MapDamageType` 没有「伏击」项。按计划要求以当时代码为准，在文档中明确留余地，未改生产代码。
- `pnpm docs:build` 通过；仅有 VitePress 既有的 chunk 大小警告（大于 500 kB），与本计划无关。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 战斗组 9 篇已落位并通过构建，`combat-overview` 的对照表目标均存在。
- 后续「其他」组文档可继续按 `10-05` 计划编写；本计划未触碰 `src/`、`packages/` 或 `packages-user/` 生产代码。

## Self-Check: PASSED

- 9 个 `docs/intermediate/*.md` 文件均存在。
- 三个任务提交 `5528edc`、`e13ebf7`、`0868650` 均存在于当前分支。
- Task 1/2/3 的静态验证均输出 `STATIC-OK`。
- `pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build` 构建通过。

---
*Phase: 10-docs-restructure*
*Completed: 2026-10-17*
