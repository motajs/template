---
phase: 10-docs-restructure
plan: 47
subsystem: docs
tags:
  - docs
  - vitepress
  - ui
  - inventory-example
requires:
  - 10-46
provides:
  - advanced-ii-ui-part5
  - inventory-example-pages
  - inventory-demos
affects:
  - docs/advanced/ii/ui
  - docs/.vitepress/config.ts
tech-stack:
  added: []
  patterns:
    - client-only-live-demo
    - progressive-incremental-example
key-files:
  created:
    - docs/advanced/ii/ui/inventory-example-1-skeleton.md
    - docs/advanced/ii/ui/inventory-example-2-grid.md
    - docs/advanced/ii/ui/inventory-example-3-detail.md
    - docs/advanced/ii/ui/inventory-example-4-scroll.md
    - docs/advanced/ii/ui/inventory-example-5-state.md
    - docs/advanced/ii/ui/inventory-example-6-animation-and-register.md
    - docs/.vitepress/components/demos/ui/inventory-1-skeleton.tsx
    - docs/.vitepress/components/demos/ui/inventory-2-grid.tsx
    - docs/.vitepress/components/demos/ui/inventory-3-detail.tsx
    - docs/.vitepress/components/demos/ui/inventory-4-scroll.tsx
    - docs/.vitepress/components/demos/ui/inventory-5-state.tsx
    - docs/.vitepress/components/demos/ui/inventory-6-full.tsx
  modified:
    - docs/.vitepress/config.ts
    - .planning/phases/10-docs-restructure/10-CUSTOM-UI-NOTES.md
decisions:
  - 六篇按「上一步 + 一小段增量」推进，配六个独立递增的 live，而不是同一个 demo 改六次。
  - 组件拆分从第 22 篇定死为 InventoryPanel / ItemGrid / ItemCell / ItemDetail / ActionBar，第 27 篇只回顾不改结构。
  - 面板尺寸 720×480，假数据 10–40 个道具，只用 g-rect / g-rectr / text 绘制。
  - 第 25 篇以 Scroll 平铺为主，ListPage 作左列表右详情对比，并给 Scroll / ListPage / Page 判定表。
  - 第 27 篇动画在 live 中用 requestAnimationFrame + onUnmounted 取消，不依赖可空的渐变控制器；正文提及 transitioned 时要求判空。
  - 文档站缺少 client-base 渲染器时，live 用元素层等价画面，正文代码块保留 TextContent / Scroll / ListPage 的真实写法。
metrics:
  duration: ~16m
  completed: 2026-10-31
status: complete
human_verification: deferred-to-10-49
actuals:
  tokens: 23000
  tasks: 5
  commits: 0
  plan_head_before: b94b4c3b41da8184312bc9f264654dc9a54adf69
---

# Phase 10 Plan 47: 完整示例（背包 / 装备面板） Summary

用六篇递增文档与六个逐级 live，把完整的背包 / 装备面板从骨架写到动画、拆分与注册；侧边栏新增「完整示例」分组，六类门禁全绿。

## What Was Built

- **第 22 篇「示例（一）目标与骨架」**：最终效果、五文件拆分、720×480 骨架、标题与关闭按钮、ItemGrid / ItemDetail 占位、Props 基类与 `GameUI('inventory-panel', InventoryPanel)` 注册、两种打开方式。
- **第 23 篇「示例（二）道具网格」**：`Item` 数据模型与 10 个假道具、`ItemCell` 的 props / emits、`ItemGrid` 的 `.map()` 与行列计算、`selectedId` 提升到父组件、`key` 取舍说明。
- **第 24 篇「示例（三）详情区」**：`computed` 派生选中项、`ItemDetail` 的名称 / 数量 / 描述、`hidden` 优先的未选中提示、`TextContent` 的 `width` 与 `autoHeight`、live 与正文代码块差异说明。
- **第 25 篇「示例（四）滚动与列表」**：`Scroll` 平铺（直接子元素、`padEnd`、`scrollTo` / `getScrollLength`）、`ListPage` 左列表右详情（`basis` / `right` / `close` / slot）、`Scroll` / `ListPage` / `Page` 判定表。
- **第 26 篇「示例（五）交互与状态」**：`ActionBar`、`equippedId`、`ref` / `computed` / `watch`、使用后数量减一、`useKey(...)!` 接 `@common/exit`、`noevent` 遮罩。
- **第 27 篇「示例（六）动画、拆分与注册」**：`requestAnimationFrame` + `onUnmounted` 动画、`transitioned` 可空说明、最终文件结构、`GameUI` 注册与主 UI 栈 / 场景 UI 打开、`keep` 提示、性能自查表、完整面板 live。
- **六个 demo**：从 `inventory-1-skeleton` 到 `inventory-6-full`，每一步只增加上一篇的内容；第 6 个含网格、详情、滚动、装备 / 使用、关闭与动画。
- **侧边栏**：`docs/.vitepress/config.ts` 的「自定义 UI 与渲染」内新增「完整示例」分组 6 条，原有 21 条与高级 III 均保留。

## Verification

| 门禁 | 结果 |
|------|------|
| prettier `--write` / `--check` | exit 0；`All matched files use Prettier code style!` |
| ESLint | 0 error / 0 warning |
| `vue-tsc --noEmit -p docs/tsconfig.json` | `docs/` 路径类型报错 0；既有引擎报错 11 条（非本轮引入） |
| 静态断言 | `STATIC-OK`；27 条侧边栏链接各出现一次、无重复；6 篇单 H1 / 边界节 / CRLF / live；6 个 demo 默认导出、无 DOM 属性、只 import vue |
| `pnpm docs:build` | green，`build complete in 24.63s.`，无 dead link |
| 全批交叉核对 | 27 篇齐全；六个 Part 顺序一致；`hidden`、`v-model:xxx`、第 22/27 拆分、被禁写法六项均通过 |

## Deviations from Plan

### Process / Checkpoint

**1. Task 5（live 人工验证）按调度指令跳过并顺延**
- **Found during:** 执行上下文
- **Issue:** 10-47 末尾的 `checkpoint:human-verify` 要求用户目视 6 个 live；调度指令要求在 10-48 独立读者审阅与 10-49 用户修订前停下。
- **Fix:** 未写「用户人工验证（10-47）：通过」，NOTES 记录「live 人工验证（10-47）：待最终人工审阅」。Task 5 未执行。
- **Files modified:** `.planning/phases/10-docs-restructure/10-CUSTOM-UI-NOTES.md`

**2. 正文 / demo 采用内联执行，而非派发子代理**
- **Found during:** Task 1 开始前
- **Issue:** 本执行环境未提供子代理派发工具；计划约定正文 / demo 由子代理执行。
- **Fix:** 按调度器可直接编辑的能力内联落盘，并在执行开始时声明「内联执行」；未调用 `opencode` 命令。
- **Files modified:** 本计划全部产物

**3. 未执行 git add / commit / push / stash / 分支切换**
- **Found during:** 全流程
- **Issue:** 标准执行器流程要求逐任务提交与最终元数据提交；本次调度指令明确不提交。
- **Fix:** 所有改动保留在工作树；SUMMARY 中 `commits: 0`，未改 STATE / ROADMAP。
- **Files modified:** 无

## Known Limitations

- 文档站缺少 `packages-user/client-base/src/renderer`，无法静态 import 内置组件。第 24 / 25 篇 live 用元素层等价画面（`text`、`alpha`、尺寸与滚动窗口）演示，正文代码块保留 `TextContent` / `Scroll` / `ListPage` 的真实写法；两篇正文均已写明「live 与正文代码块不是同一份代码」。这是 10-46 已记录的既有中间态，不是本计划引入的缺陷。

## Threat Flags

None — 六个 demo 只 import `vue` 与本框架元素标签，使用本地假数据，不读写存储、不发请求、不引入新依赖。

## Self-Check: PASSED

- [x] 6 篇正文与 6 个 demo 全部存在
- [x] 侧边栏共 27 条 `/advanced/ii/ui/` 链接，27 个唯一值，无重复
- [x] prettier / ESLint / docs 类型 / 静态断言 / 构建全部通过
- [x] NOTES 含 10-47 确认、参考哈希、门禁记录与全批交叉核对
- [x] 未执行 10-48 / 10-49；未提交 git；未改 `packages/` / `packages-user/` / `src/`

## 编号变更（2026-11-01）

本文件中的 `deferred-to-10-49` 与「10-49 用户修订前停止」是写作期编号；重排后：

- 读者审阅 → `10-53-PLAN.md`（Round 2/3；Round 1 记录保留在 `10-49-READER-REVIEW.md`）。
- 用户修订与收尾 → `10-54-PLAN.md`。
- 新增 `10-49`..`10-52` 为 25 篇的 Part 0–1 / 2–3 / 4 / 5 深度扩写（D-93）；`10-48` 仍为 pre-review 修复。
- 本文件的 live 复验仍由 `10-54` Task 4 的全站 live 统一覆盖；历史正文不改写。
