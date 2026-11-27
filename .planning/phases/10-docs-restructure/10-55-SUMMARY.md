---
phase: 10-docs-restructure
plan: 55
subsystem: docs
tags: [docs, vitepress, render-guide, migration, bookkeeping]
requires:
  - 10-54
provides:
  - "docs/render-guide/ 两级结构（basics 10 / advanced 17，不建 internals）"
  - "27 篇画屏幕 / 写 UI 文档迁移与逐篇 ## 前置知识"
affects:
  - docs/.vitepress/config.ts
  - docs/advanced/ii/index.md
  - docs/advanced/index.md
tech-stack:
  added: []
  patterns:
    - "两级文档指南：渲染基础 / 渲染进阶"
key-files:
  created:
    - docs/render-guide/index.md
    - docs/render-guide/basics/*.md（10 篇）
    - docs/render-guide/advanced/*.md（17 篇）
  modified:
    - docs/.vitepress/config.ts
    - docs/advanced/ii/index.md
    - docs/advanced/index.md
    - .planning/phases/10-docs-restructure/10-55-INVENTORY.md
    - .planning/phases/10-docs-restructure/10-CUSTOM-UI-NOTES.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
decisions:
  - "指南只收画屏幕 / 写 UI 的 27 篇；数据端 / 存档 / 插件 / 编辑器等系统文档留在中级 / 高级教程"
  - "两分区为 basics / advanced；UI 系统与 UI 性能归 advanced；不建 internals"
  - "示例 1–6 与 ui-basics / first-static-ui 保持待审阅"
metrics:
  duration: "N/A（Task 6 只做记账）"
  completed: "2026-11-16"
status: complete
actuals:
  tokens: 66088
  tasks: 5
  commits: 0
---

# Phase 10 Plan 55: 渲染指南迁移 Summary

按 D-112 把画屏幕 / 写 UI 的 27 篇自定义 UI 文档从高级 II 子分组独立为「渲染指南」，用两级结构组织并逐篇补基于真实依赖的前置知识，最后完成结构 / 链接审阅与记账。

## 问题

画屏幕与写 UI 的内容原先挤在高级 II 的「自定义 UI 与渲染」子分组里，既不方便按深度分层阅读，也让普通中级 / 高级教程承担了本应独立的界面原理讲解。D-112 要求把这类内容独立成指南，并按渲染基础 / 渲染进阶两层组织；与绘制屏幕关系不紧密的系统仍留在普通教程。

## 方案

新建 `docs/render-guide/`，只收画屏幕 / 写 UI 的 27 篇 UI 文档：

- `basics/`（渲染基础）10 篇；
- `advanced/`（渲染进阶）17 篇，其中 UI 系统（`ui-system`）与 UI 性能（`ui-performance`）归入 advanced；
- 不创建 `internals/`，不设渲染底层。

同时新增指南导览页 `docs/render-guide/index.md`，迁移全部内部链接、demo 导入、顶部导航、侧边栏与两份导览，并给 27 篇逐篇补 `## 前置知识`。系统文档（数据端、存档与录像、插件系统、编辑器等）不迁入、不新增。

## 迁移结果

- 页面：27 篇全部迁入，`docs/render-guide/` 共 28 个 `.md`（27 篇 + `index.md`）；旧目录 `docs/advanced/ii/ui/` 已删除。
- 分区计数：basics 10 / advanced 17 / internals 0（有效分区 2）。
- 链接：46 处文内相对链接按新分区重算（同区保留 `./`，跨区改 `../<分区>/`），锚点原样保留。
- 导入：89 处（demo 65 + `renderDemo.vue` 24）前缀由 `../../../.vitepress` 改为 `../../.vitepress`；demo 未移动、未改名、未修改。
- 导航：`config.ts` 新增顶部导航「渲染指南」与 `/render-guide/` 侧边栏两组（渲染基础 10 条 / 渲染进阶 17 条）；旧「自定义 UI 与渲染」分组移除；高级 II 数据端、高级 III 与中级条目保留。
- 导览：`docs/advanced/ii/index.md` 与 `docs/advanced/index.md` 的旧子分组 / 旧性能表述改为指向渲染指南，其余内容保留。

## 前置知识

27 篇各有且仅有一个 `## 前置知识`。依据来自真实依赖：原阅读顺序 / 起步顺序、正文实际引用、现有交叉链接；每条依据都记在 `10-55-INVENTORY.md` 的 `## 前置知识依据`。`ui-system` 的前置只保留「事件与交互」，不以前置 `custom-components` 为前提。导览页「页面目录」的前置列与正文一致。

## 门禁与验证

- 结构：`docs/render-guide/` 仅 `basics/`、`advanced/` 两个目录，共 28 个 `.md`；无 `internals/`、无系统文档；旧目录与旧链接清零。通过。
- 导航：侧边栏 27 条与磁盘 27 篇双向一致，无死链、无孤儿页。通过。
- 导入与 live：全部导入为 `../../.vitepress/...`；demo 文件 67、被正文引用 65、带 live 24，与基线一致；demo 目录无改动。通过。
- 文档结构：27 篇前置节各一；示例 1–6 与 `ui-basics` / `first-static-ui` 保持待审阅；`10-54-SUMMARY.md`、`10-54-USER-REVIEW.md`、`docs/poc/render-demo.md` 未改；剥离前置节 / 链接行 / 导入行后正文与 HEAD 逐字一致。通过。
- 格式：prettier `--check` 通过。通过。
- 构建：`pnpm docs:build` green、0 dead link、HTML = 27 + 1。通过。
- 类型：`docs/` 路径存在 1 条既有报错（未在本计划修改的 demo 文件 + 工作树中无关包改动所致），已记入 `10-55-DEFERRED-ITEMS.md`，未修改、未绕过；本计划未引入该报错。其余报错位于 `packages/` 与 `packages-user/`，不属于本计划范围。
- 收尾验证：Task 6 验证脚本输出 `CLOSEOUT-OK`，通过。

## 用户结构审阅

Task 5 结构 / 链接审阅已由用户确认通过，用户原话「可以收尾」。本轮无新增改动项；`10-55-USER-REVIEW.md` 未单独落盘，本轮也未新增审阅轮次记录。示例 1–6 正文不在审阅范围内。

## 计数口径与审阅谱系

- 页面基线固定为 27；10-54 记录的 25 篇 / 24 demo 只是历史记录值，不采用、未改写。
- 审阅谱系：19 篇继承 10-54 的已审阅状态（含改名继承）+ 6 篇示例待审阅 + 2 篇新增待审阅 = 27。
- 新增页面审阅状态：`ui-basics` = 待审阅；`first-static-ui` = 待审阅。依据：10-54 的 25 篇清单无对应 slug，用户未确认其已审阅，按默认保持待审阅。
- 示例 1–6 全部保持待审阅，本轮未审阅、未改写。

## 未做事项

- 未重写任何文档正文、代码块或 demo；
- 未移动、改名或修改 demo；
- 未审阅示例 1–6 的正文；
- 未做普通教程中渲染相关内容的收敛改写（本计划只盘点，另开计划）；
- 未改 `packages/`、`packages-user/`、`src/`、POC 页与配置以外的文件；
- 未 commit、未 push。

## D-112 后续项

- 普通中级 / 高级教程只讲主要逻辑的收敛改写仍待另开计划；盘点清单见 `10-55-INVENTORY.md` 的 `## 普通教程渲染端内容盘点（只盘点、不改写）`。
- `docs/poc/render-demo.md` 按 Task 0 裁决保留不动；正式指南落地后的处置仍由用户决定。
- 示例 1–6 与 `ui-basics` / `first-static-ui` 的正文审阅仍待后续计划。

## 未提交与 HEAD

CURRENT-HEAD: 2a4b3220ed9ecc01b2f92eabd375185eb686a01a
PLAN-FILES-COMMITTED: none
BASE-HEAD: 2a4b3220ed9ecc01b2f92eabd375185eb686a01a