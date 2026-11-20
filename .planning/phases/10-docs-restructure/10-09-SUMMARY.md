---
phase: 10-docs-restructure
plan: 09
subsystem: docs
tags: [vitepress, markdown, tutorial, beginner-friendly, guided-writing]

requires:
  - phase: 10-docs-restructure
    provides: 10-07 建立的 state 获取口径；10-02 写就的概念组三篇原始版本；10-05 写就的「其他」组三篇原始版本
provides:
  - 概念组三篇（src-tour / code-basics / hooks）与「其他」组三篇（events / replay-commands / data-plugins）的引导式、入门友好重写
affects: [docs/intermediate 概念与导航组, docs/intermediate 其他组, 后续 D-09 人工复审]

actuals:
  tokens: 1086
  tasks: 3
  commits: 3
  plan_head_before: 5ed2df4

tech-stack:
  added: []
  patterns:
    - "引导式文档：先给场景与直觉，再引出接口、示例与表格（Vue 文档风格）"

key-files:
  created: []
  modified:
    - docs/intermediate/src-tour.md
    - docs/intermediate/code-basics.md
    - docs/intermediate/hooks.md
    - docs/intermediate/events.md
    - docs/intermediate/replay-commands.md
    - docs/intermediate/data-plugins.md

key-decisions:
  - "只改讲法，不改接口事实与 D-22..D-24 / D-42..D-44 的内容范围"
  - "src-tour 用「该改哪个文件」引导，hooks 用「动作发生时想插一手」引导，events 用「内建动作 + 也能自己加」引导"
  - "replay-commands 用「重放要先记全」引出核心原则且仍不给示例；data-plugins 用「一组功能打包按时初始化」引导并保留占位示例（N-4）"

requirements-completed: []

coverage:
  - id: D1
    description: "src-tour 与 code-basics 改为引导式书写，保留该不该改表、constant.ts、三段式与 D-23 唯一外链"
    verification:
      - kind: other
        ref: "pnpm docs:build (build complete in 13.84s, NO-DEAD-LINK); static CRLF/H1/constant.ts/no-main.ts/D-23-link checks"
        status: pass
    human_judgment: true
    rationale: "引导式讲法与新手可读性是否到位需 D-09 人工复审"
  - id: D2
    description: "hooks 与 events 改为引导式书写，保留需求→钩子对照表、addHook/removeHook、BuiltInFunction、env、注册与两示例"
    verification:
      - kind: other
        ref: "pnpm docs:build; static CRLF/H1/addHook/需求/createEventRegistrations checks"
        status: pass
    human_judgment: true
    rationale: "概念引导是否自然、示例导读是否易懂需人工审阅"
  - id: D3
    description: "replay-commands 与 data-plugins 改为引导式书写，replay 保留核心原则与装饰器且不给示例，data-plugins 保留时机次序与占位示例"
    verification:
      - kind: other
        ref: "pnpm docs:build; static CRLF/H1/@shouldReplay/核心原则/afterLoad/占位 checks"
        status: pass
    human_judgment: true
    rationale: "核心原则的解释与插件时机的讲法是否清晰需人工审阅"

duration: 10min
completed: 2026-10-17
status: complete
---

# Phase 10 Plan 09: 概念组与「其他」组引导式重写 Summary

**概念组三篇（src-tour / code-basics / hooks）与「其他」组三篇（events / replay-commands / data-plugins）改为「先建立场景与直觉、再引出接口与示例」的引导式写法，完整保留 D-22..D-24 / D-42..D-44 的锁定要点与示例。**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-17T13:09:00Z
- **Completed:** 2026-10-17T13:19:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- `src-tour` 以「我该改哪个文件」的场景开篇，逐目录引导认识 `src/data`（数据端）、`src/client`（渲染端）、`src/content`（内容层）、`src/constant.ts`（常量），其余文件一句带过，收束于「该不该改」表；不含已弃用项。
- `code-basics` 保持三段式（简明语法 / 模块与引入 / 类型入门）与引导口吻（声明「只懂一点也能读懂」），泛型仍比作「类型的函数」，`interface` → `implements` 仍标注「建议但非强制」，结尾保留 D-23 唯一外链。
- `hooks` 从「某个动作发生时想插一手」切入，再引出「钩子对象 = 一组按时机命名的方法」；保留常用钩子族一览、**需求 → 钩子对照表**、`addHook` / `removeHook`（含控制器 `unload`）、`hook/initialize.ts` 一笔带过、异步钩子清单与「钩子可能被非本对象触发」一段。
- `events` 从「地图事件能调用一批内建动作，你也能照着加自己的动作」切入；保留 `BuiltInFunction`（`name` + `func(param, env)`）、`env` 常用字段表（含 `state`）、`createEventRegistrations()` 注册、内置事件导读、两个自定义示例（设置 flag / 勇士回血）与编辑器识别留余地。
- `replay-commands` 从「重放要能对上结果，前提是把该记的都记下来」引出核心原则；保留主动/被动录像、新增自定义指令三步、`@shouldReplay` / `@ignoreReplay` 的 begin/end 区间检测与 `:::warning`；**仍不给示例**。
- `data-plugins` 从「一组相关功能想打包挂到数据端并按时初始化」切入；保留 `IDataPluginDefine`（`id` / `dependencies` / `awake` / `initialize` / `afterLoad`）、时机次序、注册在 `src/data/plugin/list.ts`、`state.addSaveableContent`、占位/待提供示例（N-4）并写明「是否纳入本篇取决于示例难度」。
- 6 篇均保持 kebab-case、CRLF、单 H1、无元叙述；`state` 口径与 10-07 一致；站内相对链接全部有效；`pnpm docs:build` 通过。

## Task Commits

Each task was committed atomically:

1. **Task 1: 引导式重写 src-tour、code-basics** - `ea8e6f2` (docs)
2. **Task 2: 引导式重写 hooks、events** - `d882668` (docs)
3. **Task 3: 引导式重写 replay-commands、data-plugins** - `1deb860` (docs)

**Plan metadata:** SUMMARY 单独提交（本文件）。

_Note: 本计划为文档改写，无 TDD 任务。_

## Files Created/Modified

- `docs/intermediate/src-tour.md` - 引导式开篇与逐目录引导；保留该不该改表、`constant.ts`，不含已弃用项
- `docs/intermediate/code-basics.md` - 引导口吻加强；保留三段式、泛型比喻、`interface`→`implements` 非强制约定与 D-23 唯一外链
- `docs/intermediate/hooks.md` - 场景式开篇；保留钩子族一览、需求→钩子对照表、`addHook`/`removeHook`、异步清单与提醒段
- `docs/intermediate/events.md` - 场景式开篇；保留 `BuiltInFunction`、`env` 表、注册、两个自定义示例与编辑器识别留余地
- `docs/intermediate/replay-commands.md` - 以结果一致性引出核心原则；保留主动/被动、三步新增、装饰器与 `:::warning`，不给示例
- `docs/intermediate/data-plugins.md` - 以「打包 + 按时初始化」开篇；保留接口、时机次序、注册、可存档内容与占位示例（N-4）

## Decisions Made

- **只改讲法，不改事实。** 接口名、字段名、示例与 D-22..D-24 / D-42..D-44 的内容范围全部保留，写作沿用 10-02 / 10-05 已核对源码的口径。
- **逐篇选一个「读者的处境」作引子。** `src-tour` 用「该改哪个文件」、`hooks` 用「动作发生时想插一手」、`events` 用「内建动作之外也能自己加」、`replay-commands` 用「重放要能对上结果」、`data-plugins` 用「一组功能打包按时初始化」。
- **`code-basics` 的模块示例文件名由 `main.ts` 改为 `app.ts`**，避免与 `src` 中已弃用的 `main.ts` 产生字面混淆（示例语义不变，无外链变化）。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `pnpm docs:build` 输出 chunk 体积警告（>500 kB），为既有构建提示，不影响 `build complete` 与 dead-link 检查。
- 工作树存在若干**执行前既有**的 `.planning/phases/10-docs-restructure/*.md` 未提交修改（10-01..10-06-PLAN、CONTEXT、PATTERNS、RESEARCH、VALIDATION）；非本计划改动，未触碰、未提交，留待 orchestrator 处理。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 概念组与「其他」组 6 篇已完成引导式重写，构建与静态门禁通过。
- 内容可读性、动机解释是否到位仍待 D-09 人工复审。
- STATE.md / ROADMAP.md 由 orchestrator 统一更新，本计划未触碰。

## Self-Check: PASSED

- 6 个目标文件均存在，均为 CRLF、单 H1。
- 三个任务提交存在且各自只包含对应文件：`ea8e6f2`、`d882668`、`1deb860`。
- `pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build` 通过，输出 `build complete in 13.84s.`，无 dead link、无 import 失败。
- 全 `docs/intermediate/` 外链扫描：唯一外链仍为 `code-basics` 的 D-23 链接。
- 元叙述扫描：6 篇无「后续再讲 / 留到高级 / 届时」等表述。
- 越界检查：除执行前既有的 `.planning/*` 修改外，无其它工作树改动；未触碰 `config.ts` 与任何生产代码。
