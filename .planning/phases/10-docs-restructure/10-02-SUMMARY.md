---
phase: 10-docs-restructure
plan: 02
subsystem: docs
tags: [vitepress, markdown, docs, mermaid, intermediate-tutorial]

# Dependency graph
requires:
  - phase: 10-docs-restructure
    plan: 01
    provides: "清空旧文档 + 在 docs/.vitepress/config.ts 注册 nav 与 sidebar['/intermediate/']（24 条链接）"
provides:
  - "docs/intermediate/data-vs-render.md — 数据端/渲染端分工与录像验证（含 mermaid）"
  - "docs/intermediate/src-tour.md — src/data、src/client、src/content、src/constant.ts 导览 + 该不该改表"
  - "docs/intermediate/code-basics.md — 简明语法 / 模块与引入 / 类型入门（唯一获批外链）"
  - "docs/intermediate/hooks.md — 钩子机制、常用钩子族、需求→钩子对照表、addHook/removeHook"
affects: [10-docs-restructure 基础接口组、战斗组、其他组（本组为其前置阅读）]

# Actuals (#2632) — same estimateTokens scale as the plan's estimate.
actuals:
  tokens: 2304        # chars/4 over the 4 files actually changed (9217 chars)
  tasks: 2
  commits: 2          # measured: git rev-list --count ebc61e62..HEAD
plan_head_before: ebc61e620a1fd867d6215056d51119d81a078264

tech-stack:
  added: []
  patterns:
    - "VitePress 单 H1 页面骨架（# 主标题 + ##/### 小节）"
    - "mermaid ```mermaid 代码块（数据端/渲染端分离图）"
    - "markdown 对照表（该不该改表、需求→钩子表）"
    - "CRLF + kebab-case 文件名"

key-files:
  created:
    - docs/intermediate/data-vs-render.md
    - docs/intermediate/src-tour.md
    - docs/intermediate/code-basics.md
    - docs/intermediate/hooks.md
  modified: []

key-decisions:
  - "页面 H1 采用 config.ts 已注册的显示名（数据端与渲染端 / src 导览 / 代码基础 / 钩子）"
  - "组内 4 篇互链，但不向尚未写就的后续分组页面加 markdown 链接（hooks 对照表引用后续页用代码 span）"
  - "code-basics 仅保留 D-23 指定外链 https://h5mota.com/bbs/thread/?tid=1018&p=3#p41"

requirements-completed: []

coverage:
  - id: D1
    description: "data-vs-render.md：数据端负责算/渲染端负责画、棋局账本比喻、分别位于 src/data 与 src/client、重点录像验证（只跑数据端）、含 mermaid 图"
    verification:
      - kind: other
        ref: "static check: CRLF + 单 H1 + 含 mermaid（plan Task 1 <verify>）"
        status: pass
      - kind: integration
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" → build complete, public/_docs/intermediate/data-vs-render.html"
        status: pass
    human_judgment: true
    rationale: "D-09 验收 = 用户人工审阅；内容可读性与无元叙述（D-16）无法由自动化断言"
  - id: D2
    description: "src-tour.md：详讲 src/data、src/client、src/content、src/constant.ts；一句带过 bootstrap.ts/data.ts/package.json/styles.less；不含 main.ts/App.vue/types/；含该不该改表"
    verification:
      - kind: other
        ref: "static check: CRLF + 单 H1（plan Task 1 <verify>）"
        status: pass
      - kind: integration
        ref: "docs:build → public/_docs/intermediate/src-tour.html"
        status: pass
    human_judgment: true
    rationale: "D-09 用户人工审阅；接口名/路径是否与源码逐字一致需人工核对（RESEARCH Pitfall 5）"
  - id: D3
    description: "code-basics.md：三段式（简明语法 / 模块与引入 / 类型入门）；泛型比作类型的函数；interface→implements 建议但非强制；结尾给出 D-23 唯一获批外链"
    verification:
      - kind: other
        ref: "static check: CRLF + 单 H1 + 含 https://h5mota.com/bbs/thread/?tid=1018（plan Task 2 <verify>）"
        status: pass
      - kind: integration
        ref: "docs:build → public/_docs/intermediate/code-basics.html"
        status: pass
    human_judgment: true
    rationale: "D-09 用户人工审阅；教学表述质量无法自动化判定"
  - id: D4
    description: "hooks.md：钩子是什么、常用钩子族一览、需求→钩子对照表、addHook/removeHook、hook/initialize.ts 一笔带过、标注 async 钩子、钩子可能被非本对象触发"
    verification:
      - kind: other
        ref: "static check: CRLF + 单 H1 + 含 addHook（plan Task 2 <verify>）"
        status: pass
      - kind: integration
        ref: "docs:build → public/_docs/intermediate/hooks.html"
        status: pass
    human_judgment: true
    rationale: "D-09 用户人工审阅；钩子族/方法名与源码一致性需人工核对"

duration: 4min
completed: 2026-10-17
status: complete
---

# Phase 10 Plan 02: 概念与导航组（4 篇） Summary

**中级教程「概念与导航」组 4 篇落位（data-vs-render / src-tour / code-basics / hooks），为后续分组建立数据端·渲染端分工、src 目录导航、代码与类型基础、钩子机制四项共同前提**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-17T17:47:17Z
- **Completed:** 2026-10-17T17:50:52Z
- **Tasks:** 2
- **Files modified:** 4 (all created)

## Accomplishments

- 新增 `docs/intermediate/data-vs-render.md`：确立「数据端算 / 渲染端画」心智模型，棋局账本比喻，含双端分离 mermaid 图，重点讲录像验证只跑数据端。
- 新增 `docs/intermediate/src-tour.md`：逐目录导览 `src/data`、`src/client`、`src/content`、`src/constant.ts`，结束于一张「该不该改」表；不含已弃用的 `main.ts`/`App.vue`/`types/`。
- 新增 `docs/intermediate/code-basics.md`：三段式语法/模块/类型教学，泛型比作「类型的函数」，给出 D-23 唯一获批外链。
- 新增 `docs/intermediate/hooks.md`：钩子机制、常用钩子族一览、需求→钩子对照表（核心）、`addHook`/`removeHook` 用法、async 钩子清单。
- 计划级构建门禁通过：`tsx docs/.vitepress/init.ts && pnpm docs:build` → `build complete`，4 个页面均产出 HTML，无 dead link / import 错误。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写 data-vs-render 与 src-tour** - `2ea8cb3` (docs)
2. **Task 2: 编写 code-basics 与 hooks** - `c47aa52` (docs)

_本批次（10-02）由编排器统一提交 SUMMARY/STATE/ROADMAP，故此处不单列计划元数据提交。_

## Files Created/Modified

- `docs/intermediate/data-vs-render.md` - 数据端与渲染端分工、录像验证、mermaid 图
- `docs/intermediate/src-tour.md` - src 目录导览 + 该不该改表
- `docs/intermediate/code-basics.md` - 简明语法 / 模块与引入 / 类型入门
- `docs/intermediate/hooks.md` - 钩子机制与需求→钩子对照表

## Decisions Made

- 页面 H1 采用 `config.ts` 已注册的显示名（数据端与渲染端 / src 导览 / 代码基础 / 钩子），与侧边栏一致。
- 组内 4 篇互相以 markdown 相对链接引用；不向本计划未写就的后续分组页面加链接（`hooks.md` 对照表引用 `hero-attribute`、`enemy-status-hooks` 时用代码 span，不加链接），避免 dead link。
- `code-basics.md` 仅保留 D-23 指定外链，未新增任何其它外链。

## Deviations from Plan

None - plan executed exactly as written.

（说明：本计划任务标注 `tdd="true"`，但产物为纯 markdown、仓库无适用于文档的测试框架。以计划自带的结构化 `<verify>` 静态断言 + 计划级 `docs:build` 作为等价的完成门禁，未另造 RED 用例。）

## Issues Encountered

None。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 本组 4 篇已可构建、已注册进 nav/sidebar，作为后续「基础接口」「战斗」「其他」各组的入口阅读。
- 未改动任何生产代码与既有文档；旧内容删除与 nav/sidebar 注册由 10-01 完成。
- 待用户人工审阅（D-09）；后续分组计划可继续复用本组建立的心智模型。

## Self-Check

- 4 个文件存在：PASSED
- 提交存在（`2ea8cb3`、`c47aa52`）：PASSED
- 构建产出 4 个 HTML：PASSED
