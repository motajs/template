---
phase: 10-docs-restructure
plan: 33
subsystem: docs
tags: [vitepress, markdown, sidebar, advanced-i, advanced-iii, restructure, interlinks]

requires:
    - phase: 10-docs-restructure
      provides: 高级 I 九篇（10-28 / 10-29 / 10-30 收尾）与高级 II 十篇（10-24..10-27），以及 docs/.vitepress/config.ts 现有的 sidebar / nav 结构

provides:
    - docs/advanced/i/：高级 I 导览与八篇正文的新位置（九个文件均由 git mv 移入）
    - docs/advanced/index.md：高级教程总导览，说明 I / II / III 三层并给出 I / II 的真实入口，III 暂不提供链接
    - docs/.vitepress/config.ts：`sidebar['/advanced/']` 新增总导览项，I 组九项改指 `/advanced/i/...`；II 组与 III 组未变
    - 高级 I 与高级 II 页面的跨层相对链接全部改指新目录，站点在本计划边界处无死链

affects: [10-34 advanced-iii-loading, 10-39 advanced-iii-registration]

actuals:
    tokens: 8700
    tasks: 3
    commits: 2
    plan_head_before: 64eef3107571a2acb643a5719e5aa51b056c54ca

tech-stack:
    added: []
    patterns:
        - 目录重构在单个任务内原子完成：移动 + 新总导览 + config 改写 + 互链修正一起提交，避免中间态死链
        - III 层页面未创建前，总导览与侧边栏都只留层名、不放链接，由 10-39 在页面齐备后统一注册
        - 链接修正只替换行内路径文本、不重写整行，保住九个 I 页的 CRLF 与单 H1

key-files:
    created:
        - docs/advanced/index.md（新建的高级教程总导览）
        - docs/advanced/i/index.md（由根目录 git mv 移入的高级 I 导览）
        - .planning/phases/10-docs-restructure/10-33-SUMMARY.md
    modified:
        - docs/advanced/i/declarative-vs-imperative.md
        - docs/advanced/i/plugin-system.md
        - docs/advanced/i/saveable-content.md
        - docs/advanced/i/replay-consistency.md
        - docs/advanced/i/data-stores.md
        - docs/advanced/i/hooks-in-depth.md
        - docs/advanced/i/mover.md
        - docs/advanced/i/face-handler.md
        - docs/.vitepress/config.ts
        - docs/advanced/ii/index.md
        - docs/advanced/ii/custom-replay-command.md
        - docs/advanced/ii/static-vs-dynamic-tiles.md

key-decisions:
    - 高级 I 的导览与八篇正文全部移入 `docs/advanced/i/`，`docs/advanced/` 根目录只保留重建后的总导览
    - 总导览三层表中 I / II 使用真实相对链接（`./i/`、`./ii/`），III 只写层名与主题、不放链接
    - 侧边栏在 I / II / III 三组之前新增「高级教程总导览」项，指向 `/advanced/`；I 组九项改指 `/advanced/i/...`
    - 高级 III 组保持 `collapsed: true` 与 `items: []`，III 的注册与总导览入口留给 10-39
    - 本计划不新建 `docs/advanced/iii/` 目录：计划任务未要求此时建目录，III 由后续计划落位

patterns-established:
    - 分层重构的提交顺序：先 `git mv` 保历史与 CRLF，再新总导览与 config，再修全部入链，最后统一 prettier 与构建

requirements-completed: []

coverage:
    - id: D1
      description: 九个高级 I 页面位于 `docs/advanced/i/`、根目录无旧文件；总导览为单 H1、三层表 I/II 有链接、III 无链接
      verification:
          - kind: other
            ref: 'Task 1 门禁（RESTRUCTURE-OK）：目录、旧文件缺席、I 导览标题、根导览标题、CRLF、单 H1、相对链接与目录链接全部通过'
            status: pass
      human_judgment: false
    - id: D2
      description: config 的 I 组九个 `/advanced/i/...` 目标 + 一条 `/advanced/` 总导览项；II 组十项与 III 组 `items: []` 未变
      verification:
          - kind: other
            ref: 'Task 1 门禁：I-LINK-COUNT=9、NO-ROOT-ENTRY 未触发、II-LINKS-CHANGED 未触发、NO-III-GROUP 未触发'
            status: pass
      human_judgment: false
    - id: D3
      description: prettier `--check` 全通过；全量构建 `build complete`、退出码 0、无 dead link
      verification:
          - kind: other
            ref: 'prettier --check 六个目标（组）exit 0；pnpm docs:build exit 0，build complete in 19.87s，无 Dead link'
            status: pass
      human_judgment: false
    - id: D4
      description: 站点上 `/advanced/` 为总导览、`/advanced/i/` 为高级 I 导览、九篇 I 页与十篇 II 页均可从侧边栏进入
      verification:
          - kind: manual
            ref: '产物检查：public/_docs/advanced/index.html 含「高级教程总导览」，i/ 下 9 个 html，ii/ 下 10 个 html，ii/index.html 指向 advanced/i/'
            status: pass
      human_judgment: true
      rationale: 版式与阅读体验仍需按 D-09 由用户人工审阅确认；自动化只覆盖结构、链接与构建

duration: 12min
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 33: 高级 I 分层落位与高级教程总导览 Summary

**用 `git mv` 把高级 I 的导览与八篇正文移入 `docs/advanced/i/`，把 `docs/advanced/index.md` 重建为「高级教程总导览」，侧边栏 I 组九项改指新目录并新增总导览入口，修完全部跨层相对链接后构建 green、无死链。**

## Performance

- **Duration:** 约 12 分钟
- **Completed:** 2026-10-26
- **Tasks:** 3/3
- **Files modified:** 9 个 `git mv`（其中 8 篇正文仅改链接路径）+ 1 个新建总导览 + 1 个站点配置 + 3 个高级 II 文件的链接路径 + 本 SUMMARY

## Task 0 审批记录

本计划的 Task 0 为「向用户汇报并等待『可以执行』」的 `checkpoint:human-verify`。执行前用户已明确预批准：

> 「这些都是文档编写工作，不涉及代码本身，直接批准执行 10-33 至 10-37」

因此 Task 0 视为已满足，未再次阻塞；执行范围严格限定在计划 `files_modified` 与本 SUMMARY。

## Accomplishments

- 九个高级 I 页面从 `docs/advanced/` 根目录整体移入 `docs/advanced/i/`：`index.md` 与 `declarative-vs-imperative` / `plugin-system` / `saveable-content` / `replay-consistency` / `data-stores` / `hooks-in-depth` / `mover` / `face-handler` 八篇正文。
- `docs/advanced/index.md` 重建为「高级教程总导览」：单 H1，按难度说明 I / II / III 三层，I 与 II 使用真实相对链接，III 只写层名与主题。
- `docs/.vitepress/config.ts` 的 `sidebar['/advanced/']` 新增首项「高级教程总导览」→ `/advanced/`，I 组九项全部改指 `/advanced/i/...`；II 组十项、III 组 `items: []`、`nav` 均未动。
- 跨层相对链接全部修正：高级 I 内页 16 处 `../intermediate/` → `../../intermediate/`、7 处 `./ii/` → `../ii/`；高级 II 共 10 处入链改指 `../i/...`（含 `ii/index.md` 的返回导览）。
- prettier `--check` 全通过；全量构建退出码 0，输出 `build complete in 19.87s`，无 dead link。

## 移动清单（9 条，均为 `git mv`）

| 原路径 | 新路径 | 内容变化 |
| ------ | ------ | -------- |
| `docs/advanced/index.md` | `docs/advanced/i/index.md` | 仅链接路径（`./ii/` → `../ii/`、`../intermediate/` → `../../intermediate/`）；prettier 因路径长度变化重排表格列宽 |
| `docs/advanced/declarative-vs-imperative.md` | `docs/advanced/i/declarative-vs-imperative.md` | 仅链接路径 |
| `docs/advanced/plugin-system.md` | `docs/advanced/i/plugin-system.md` | 仅链接路径 |
| `docs/advanced/saveable-content.md` | `docs/advanced/i/saveable-content.md` | 仅链接路径 |
| `docs/advanced/replay-consistency.md` | `docs/advanced/i/replay-consistency.md` | 仅链接路径 |
| `docs/advanced/data-stores.md` | `docs/advanced/i/data-stores.md` | 仅链接路径 |
| `docs/advanced/hooks-in-depth.md` | `docs/advanced/i/hooks-in-depth.md` | 仅链接路径 |
| `docs/advanced/mover.md` | `docs/advanced/i/mover.md` | 仅链接路径 |
| `docs/advanced/face-handler.md` | `docs/advanced/i/face-handler.md` | 仅链接路径 |

> 说明：九次 `git mv` 均已执行。提交时 git 的相似度启发式把 `i/index.md` 显示为新增、根 `index.md` 显示为修改（因为新旧两篇 index 仍高度相似），不影响移动事实与内容保真。

## 链接修正分类与实测数量

| 类别 | 位置 | 数量 | 改法 |
| ---- | ---- | ---- | ---- |
| 高级 I → 中级 | `docs/advanced/i/*.md` | 16 | `](../intermediate/` → `](../../intermediate/` |
| 高级 I → 高级 II | `docs/advanced/i/*.md` | 7 | `](./ii/` → `](../ii/` |
| 高级 II → 高级 I（前置篇目） | `docs/advanced/ii/index.md` | 6 | `](../<篇名>.md)` → `](../i/<篇名>.md)` |
| 高级 II 返回导览 | `docs/advanced/ii/index.md` | 1 | `](../index.md)` → `](../i/index.md)` |
| 高级 II → 高级 I（录像一致性） | `docs/advanced/ii/custom-replay-command.md` | 2 | `](../replay-consistency.md)` → `](../i/replay-consistency.md)` |
| 高级 II → 高级 I（移动 Mover） | `docs/advanced/ii/static-vs-dynamic-tiles.md` | 1 | `](../mover.md)` → `](../i/mover.md)` |

高级 I 八篇正文末尾的「返回[高级 I 导览](./index.md)。」为同层链接，保持原样未改。

## 总导览结构

- `# 高级教程总导览`
- 引言：高级教程面向有高度定制需求、需要理解引擎设计的作者；I / II / III 是难度分层，不是领域分类。
- `## 三层结构`：表格给出三层定位与主题；I 行链接 `./i/`，II 行链接 `./ii/`，III 行只写「高级 III · 原理与架构」与主题，**不含任何链接**。
- `## 怎么选阅读路径`：给出「先 I 后 II、III 按需」与「按目标跳读」两条路径。
- `## 前置`：链接中级三篇（`../intermediate/data-vs-render.md`、`code-basics.md`、`data-plugins.md`）。
- `## 与中级教程的分工`：中级讲「怎么用」，高级讲「怎么扩展」。
- `## 边界与注意`：置于文末，写渲染端与编辑器内容为占位、不重复中级已讲内容、III 入口随页面就绪开放。
- 全文不含「模板」「[需改]」「src/client」或源码行号叙述。

## config 改动点

- `nav`：保持 `{ text: '高级教程', link: '/advanced/' }` 未动。
- `sidebar['/advanced/']` 首项新增：`{ text: '高级教程总导览', link: '/advanced/' }`。
- 高级 I 组九个目标（与导览同序）：
  1. `/advanced/i/`（高级 I 导览）
  2. `/advanced/i/declarative-vs-imperative`
  3. `/advanced/i/plugin-system`
  4. `/advanced/i/saveable-content`
  5. `/advanced/i/replay-consistency`
  6. `/advanced/i/data-stores`
  7. `/advanced/i/hooks-in-depth`
  8. `/advanced/i/mover`
  9. `/advanced/i/face-handler`
- 高级 II 组：10 个 `/advanced/ii/...` 目标逐字未变。
- 高级 III 组：`collapsed: true` 与 `items: []` 未变。

## 格式、构建与产物结论

- **prettier：** `node node_modules/prettier/bin/prettier.cjs --check docs/advanced/index.md docs/advanced/i docs/advanced/ii/index.md docs/advanced/ii/custom-replay-command.md docs/advanced/ii/static-vs-dynamic-tiles.md docs/.vitepress/config.ts` → 全部通过，退出码 0。
- **构建：** `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → 退出码 0，`build complete in 19.87s`，输出无 `Dead link` / `dead link`。
- **产物：** `public/_docs/advanced/index.html` 为总导览并含「高级教程总导览」；`public/_docs/advanced/i/` 下 9 个 html；`public/_docs/advanced/ii/` 下 10 个 html；`ii/index.html` 的返回导览指向 `advanced/i/`。
- **结构：** 九个 I 页与总导览均为 CRLF、单 H1、kebab-case 文件名；`docs/advanced/` 根目录不再有九个旧文件。

## Task Commits

1. **Task 1: 移动九页、重建总导览、改写 config 与全部互链** — `aee8627`（docs）
2. **Task 2: 格式检查、全量构建与 SUMMARY** — 本提交（docs）

## Files Created/Modified

- `docs/advanced/i/`（9 个文件，`git mv` 自根目录）
- `docs/advanced/index.md`（新建总导览）
- `docs/.vitepress/config.ts`（总导览项 + I 组改指）
- `docs/advanced/ii/index.md`、`docs/advanced/ii/custom-replay-command.md`、`docs/advanced/ii/static-vs-dynamic-tiles.md`（仅链接路径）
- `.planning/phases/10-docs-restructure/10-33-SUMMARY.md`（本文件）

## Decisions Made

- 总导览三层表的 III 行刻意不写链接：该层页面尚未创建，任何链接都会成为死链；入口统一由 10-39 在页面齐备后开放。
- 侧边栏保留三组结构，只在组前加一条总导览项；I 组内部顺序与 10-30 保持一致，不重排。
- 本计划没有创建 `docs/advanced/iii/`：计划任务只要求移动 I 与重建总导览，III 目录与页面由后续计划负责。
- 高级 II 只改链接路径，未改任何正文语义或措辞。

## Deviations from Plan

None — 计划按原样执行。prettier 对 `docs/advanced/i/index.md` 的表格列宽重排是链接路径变长后的格式化结果，属于计划步骤 (6) 要求的格式化，不是内容改动。

## Issues Encountered

- 工作区存在与本计划无关的既有改动（`packages-user/client-base/*`、`src/data/plugin/index.ts`、`.planning/phases/09-minimum-browser-runnable/09-28-PLAN.md` 与 `packages-user/client-base/src/map/__test__/`），均未暂存、未提交。
- 提交时 git 的 rename 检测把 `index.md` 的移动显示为「根 index 修改 + i/index 新增」，原因是新旧 index 内容仍高度相似；九个文件的 `git mv` 操作本身均已执行，其余八个显示为 rename。

## User Setup Required

None - 无外部服务配置。

## Next Phase Readiness

- 高级教程在站点上有了独立的总入口，高级 I 完整落在 `docs/advanced/i/`，高级 II 未受影响。
- 10-34 起的高级 III 页面可以直接落在 `docs/advanced/iii/`，并统一使用 `../i/...` 引用高级 I。
- III 的侧边栏注册、总导览 III 行入口与跨页回链留给 10-39，一次性接入即可，本计划边界处无死链。

---

_Phase: 10-docs-restructure_
_Completed: 2026-10-26_

## Self-Check: PASSED

- 文件存在：`docs/advanced/index.md`、`docs/advanced/i/` 下 9 个 md、`docs/.vitepress/config.ts`、本 SUMMARY
- 提交存在：`aee8627`（移动、总导览、config 与互链）、本提交（格式、构建与 SUMMARY）
- 门禁存在：RESTRUCTURE-OK、PRETTIER-OK、BUILD-COMPLETE（19.87s）、NO-DEAD-LINK
