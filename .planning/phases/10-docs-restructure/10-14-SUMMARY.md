---
phase: 10-docs-restructure
plan: 14
subsystem: docs
tags: [vitepress, documentation, plugin-system, lifecycle, dependencies, data-engine]

# Dependency graph
requires:
  - phase: 10-docs-restructure
    provides: "中级教程的插件基础用法、数据端总览，以及 10-13 的「声明规则、引擎在合适时机执行」模型"
provides:
  - "docs/advanced/plugin-system.md（高级 I 第二篇）"
affects: ["10-15", "10-16", "10-17"]

actuals:
  tokens: 3800
  tasks: 2
  commits: 2
  plan_head_before: eb14b4daee24b09d392af12ce75fdbc4758c0239

tech-stack:
  added: []
  patterns:
    - "先讲问题与最小插件，再展开生命周期、依赖排序与失败语义"
    - "通用模板单独成节，现有插件只当示例逐段导读"
    - "插件 id 与可存档 id 分表对照，强调两套命名"
    - "失败语义按源码事实描述：循环依赖 76、缺失依赖 77、重复 id 78"

key-files:
  created:
    - docs/advanced/plugin-system.md
  modified: []

key-decisions:
  - "按 CoreState 实际执行顺序讲三个时机：构造期 awake、load() 前 initialize、加载后 afterLoad"
  - "排序只承诺「被依赖者先完成」，不把登记顺序写成绝对契约"
  - "商店插件作为示例逐段导读，不作为通用模板；模板另立小节"
  - "高级 I/II 内容用代码 span 与 HTML 注释占位，不写真实链接"
  - "加粗改用 HTML strong，避免 D-52 flanking 问题"

patterns-established:
  - "插件实操：目录形状 + list.ts 注册 + [模板]/[需改] 骨架 + 四项验证"
  - "插件互调：优先依赖参数，其次 getDataPlugin 并判空、查 status"

requirements-completed: []

coverage:
  - id: D1
    description: "高级 I 第二篇：插件系统（自定义插件、生命周期、依赖排序与失败语义、插件互调、id 稳定性与迁移）"
    verification:
      - kind: other
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete, dead link = 0"
        status: pass
    human_judgment: true
    rationale: "文档质量需用户人工审阅（D-46 第 2 阶段），自动化只能验证构建与链接"
---

# Phase 10 Plan 14: 插件系统 Summary

**高级 I 第二篇落地：从最小插件讲到三个生命周期时机、`dependencies` 拓扑排序与阻断语义、插件互调、插件 id 与存档 id 分离，并给出可复制骨架与现有插件逐段导读**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-10-20T04:15:00Z
- **Completed:** 2026-10-20T04:42:00Z
- **Tasks:** 2
- **Files modified:** 1 created

## Accomplishments

- 新建 `docs/advanced/plugin-system.md`（单 H1、CRLF、数据端 only），承接 10-13 的声明式模型与中级 `data-plugins.md`。
- 用 `CoreState` 的真实流程讲清三个时机：构造期同步 `awake`、`load()` 前 `initialize`、加载后 `afterLoad`，并说明两个异步阶段的阻塞效果。
- 按 `orderPlugins` 的真实返回讲排序与失败语义：`order` / `cyclic` / `missing`，循环依赖（76）与缺失依赖（77）连同下游一起被排除；重复 id 报 78。
- 区分 `dependencies` 的两种形态（声明是 id 数组、方法参数是插件对象数组），并给出依赖直调与 `getDataPlugin` 两种互调写法。
- 分表讲清插件 id（`data-shop-plugin`）与可存档 id（`@plugin/shop`）是两套命名，给出四条最小迁移做法。
- 独立「模板：一个插件的最小骨架」小节（`[模板]` / `[需改]`），示例只用于说明；`DataShopPlugin` 与 `MainDataPlugin` 逐段对照真实源码。
- 明确「不懂代码优先改内置」，并给出四项可操作的验证步骤。
- prettier 通过；`pnpm docs:build` 输出 `build complete`，无 dead link。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写 plugin-system.md 正文** - `1b92ee4` (docs)
2. **Task 2: 源码核对、格式与构建收口** - `876529b` (docs)

**Plan metadata:** `docs(10-14): complete plugin-system plan`（本 SUMMARY 的提交）

## Files Created/Modified

- `docs/advanced/plugin-system.md` - 插件系统高级教程：最小插件、生命周期、依赖排序、互调、id 稳定性、模板与示例

## Decisions Made

- 排序表述以源码为准：只保证「被依赖者先完成同一阶段」；无依赖关系时按登记顺序扫描，但明确写成不可依赖的契约。
- `awake` 用「引擎不会等待返回值」解释，避免读者写成 `async awake` 后误以为会被等待。
- 生命周期状态用 `PluginStatus` 四态表呈现，并说明依赖的状态会随阶段推进。
- 迁移章节把插件 id 与存档 id 分开：改名插件 id 断依赖链，改存档 id 断旧存档。
- 在「注册与目录」补充 `entry.ts` 的数组拼装（主插件在前、`dataPlugins` 展开在后），说明日常只改 `list.ts`。

## Deviations from Plan

None - plan executed exactly as written.

（Task 1 验证阶段的加粗 flanking 自检与 Task 2 的 `entry.ts` 补句，都在对应任务的提交前完成，未产生计划外提交。）

## Issues Encountered

- `pnpm exec tsx docs/.vitepress/init.ts` 触发了 workspace 安装并改写了 `pnpm-lock.yaml`（删除已不再引用的 `@user/entry-client` / `@user/entry-data` 链接）。这属于本计划范围外的既有不一致，已用 `git checkout -- pnpm-lock.yaml` 还原，未纳入提交。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 10-15（可存档内容）可直接引用本篇的「在 `awake` 里注册可存档内容」与插件 id / 存档 id 的区分。
- 10-16、10-17 可把本篇作为「插件承载钩子与录像行为」的前置。
- 待用户按 D-46 第 2 阶段做人工审阅。

## Self-Check: PASSED

- `docs/advanced/plugin-system.md` exists.
- `1b92ee4`, `876529b` exist in git history.
- Static gate: `STATIC-OK`; build gate: `GATE-OK` (build complete, dead link = 0).

---

_Phase: 10-docs-restructure_
_Completed: 2026-10-20_
