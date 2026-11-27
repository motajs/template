---
phase: 10-docs-restructure
plan: 46
subsystem: docs
tags: [vitepress, tsx, ui, builtin-components, ui-stack, performance]

requires:
  - phase: 10-docs-restructure
    provides: 10-45 的 props / 组件 / slots 四篇正文、4 个 live demo、侧边栏「组件化」分组
provides:
  - Part 4 五篇（内置组件文本/输入、内置组件列表/容器、UIController 与 UI 栈、修改/替换内置 UI、UI 系统性能）
  - 5 个 live demo 与侧边栏「内置组件与 UI 系统」分组
  - 第 6 / 16 篇对第 17 篇的跨页链接回填
affects: [10-47, 10-48]

actuals:
  tokens: 29000
  tasks: 5
  commits: 0

tech-stack:
  added: []
  patterns:
    - 内置组件按公开契约使用，属性名保持 camelCase
    - v-model:value / v-model:selected 双向绑定口径与第 13 篇一致
    - 四层 UI 模型、栈与背景、lastOnly / showAll / showCustom
    - keep 防闪烁，safelyUnload 只在栈空时关背景
    - hidden 优先、缓存只给稳定子树、createPropsBase 不做重活

key-files:
  created:
    - docs/advanced/ii/ui/builtin-text-and-input.md
    - docs/advanced/ii/ui/builtin-list-and-containers.md
    - docs/advanced/ii/ui/ui-controller-and-stack.md
    - docs/advanced/ii/ui/replace-builtin-ui.md
    - docs/advanced/ii/ui/ui-performance.md
    - docs/.vitepress/components/demos/ui/builtin-text-demo.tsx
    - docs/.vitepress/components/demos/ui/builtin-list-demo.tsx
    - docs/.vitepress/components/demos/ui/controller-demo.tsx
    - docs/.vitepress/components/demos/ui/strategy-demo.tsx
    - docs/.vitepress/components/demos/ui/perf-demo.tsx
  modified:
    - docs/.vitepress/config.ts
    - docs/advanced/ii/ui/text.md
    - docs/advanced/ii/ui/slots-and-attrs.md
    - .planning/phases/10-docs-restructure/10-CUSTOM-UI-NOTES.md

key-decisions:
  - "内置组件篇用「示例为主 + 常用项表」，但 TextContent 的 width 必填、autoHeight、Input 的 v-model:value、List 的 v-model:selected、Scroll 只对直接子元素生效写全"
  - "第 20 篇只讲打开处替换 / 包装组件 / 显示策略与背景三种改法，不复制源码"
  - "Choices 正文标题用 Choices（选项框），并注明 ChoicesBox 是俗称、源码导出名是 Choices / ChoicesUI"
  - "文档站无法 import client-base 内置组件时，正文保留真实代码块，live 用等价元素演示并明确说明"

requirements-completed: []

coverage:
  - id: D1
    description: "内置组件：文本与输入篇 + builtin-text live"
    verification:
      - kind: automated_ui
        ref: "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "打字机、立即显示全部与输入框交互需要人工目视"
  - id: D2
    description: "内置组件：列表与容器篇 + builtin-list live"
    verification:
      - kind: automated_ui
        ref: "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "List / Page / Scroll / Selection 的交互与平铺要求需要人工确认"
  - id: D3
    description: "UIController 与 UI 栈篇 + controller live"
    verification:
      - kind: automated_ui
        ref: "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "打开 / 关闭、栈长度与 active 状态需要人工操作确认"
  - id: D4
    description: "修改 / 替换内置 UI 篇 + strategy live"
    verification:
      - kind: automated_ui
        ref: "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "lastOnly 与 showAll 的叠放差别需要人工目视"
  - id: D5
    description: "UI 系统性能与注意事项篇 + perf live"
    verification:
      - kind: automated_ui
        ref: "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"
        status: pass
    human_judgment: true
    rationale: "hidden / cache 切换与 active / showBack 状态显示需要人工确认"
  - id: D6
    description: "第 6 / 16 篇跨页链接回填与侧边栏 5 条"
    verification:
      - kind: automated_ui
        ref: "静态断言：5 篇单 H1 / 边界节 / 无被禁写法 / 21 条链接 / 回填链接"
        status: pass
    human_judgment: true
    rationale: "链接位置与侧边栏显示名需要人工抽查"

duration: 24min
completed: 2026-10-31
status: complete
---

# Phase 10 Plan 46: 内置组件与 UI 系统 Summary

**Part 4 五篇与五个 live 落地：内置组件按公开契约讲、UI 栈讲清四层模型与 keep、替换只走三种应用层改法、性能篇收口 hidden 口径**

## Performance

- **Duration:** 24 min
- **Started:** 2026-10-31 18:28（本地时间）
- **Completed:** 2026-10-31 18:52（本地时间）
- **Tasks:** 5（Task 0 记录 + Task 1..4；Task 5 live 人工验证按用户要求留待最终审阅）
- **Files modified:** 14

## Accomplishments

- 新增 `builtin-text-and-input.md`：`TextContent` / `Textbox` / `Input` / `InputBox`，含打字机、`v-model:value`、`getInput` / `getInputNumber`。
- 新增 `builtin-list-and-containers.md`：`List` / `ListPage` / `Page` / `Scroll` / `Selection` / `Choices` / `ConfirmBox`，讲明 `Scroll` 只对直接子元素生效与 `ChoicesBox` 别名。
- 新增 `ui-controller-and-stack.md`：四层模型、栈与背景、`lastOnly` / `showAll` / `showCustom`、`keep`、场景 UI 与主 UI、基础 props 注入。
- 新增 `replace-builtin-ui.md`：内置 UI 定义、打开处替换 / 包装组件 / 显示策略与背景三种改法，明确没有全局替换接口。
- 新增 `ui-performance.md`：`hidden` 优先、缓存、HD / 抗锯齿、列表、组件粒度、UI 栈、`createPropsBase` 与排查表。
- 侧边栏新增「内置组件与 UI 系统」5 条；第 6 / 16 篇对第 17 篇的纯文本前瞻引用回填为链接。
- 六类门禁全绿：prettier、ESLint、docs 类型、静态断言、全量构建。

## Files Created/Modified

- `docs/advanced/ii/ui/builtin-text-and-input.md` - 文本、输入、Textbox、InputBox
- `docs/advanced/ii/ui/builtin-list-and-containers.md` - 列表、分页、滚动、选中框、一次性选择框
- `docs/advanced/ii/ui/ui-controller-and-stack.md` - UIController 四层模型与 UI 栈
- `docs/advanced/ii/ui/replace-builtin-ui.md` - 修改 / 替换内置 UI 的三种做法
- `docs/advanced/ii/ui/ui-performance.md` - UI 系统性能与注意事项
- `docs/.vitepress/components/demos/ui/*.tsx` - 5 个 live demo（builtin-text / builtin-list / controller / strategy / perf）
- `docs/.vitepress/config.ts` - 「内置组件与 UI 系统」新增 5 条
- `docs/advanced/ii/ui/text.md` - 第 17 篇链接回填
- `docs/advanced/ii/ui/slots-and-attrs.md` - 第 17 篇链接回填
- `.planning/phases/10-docs-restructure/10-CUSTOM-UI-NOTES.md` - 10-46 命名确认、哈希复核、门禁与待审记录

## Decisions Made

- 契约写法采用「示例为主 + 常用项表」，关键约束（`width`、`autoHeight`、`v-model:value`、`v-model:selected`、`Scroll` 直接子元素）全部写全。
- 第 20 篇不复制内置源码，只讲打开处替换 / 包装 / 显示策略与背景。
- `Choices` 按接口讲，正文标题用 `Choices（选项框）`，并注明 `ChoicesBox` 只是俗称。
- 文档站无法 import `client-base` 内置组件时，正文保留真实代码块，live 用等价元素演示并在「运行效果」说明。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 内置组件无法在文档站静态 import，live 改为等价元素演示**
- **Found during:** Task 1
- **Issue:** 导入 `@user/client-base` 触发 `Could not resolve "../renderer" from "packages-user/client-base/src/elements/index.ts"`；`packages-user/client-base/src/renderer` 在当前工作树不存在（`elements/index.ts` 与 `components/misc.tsx` 的 `../renderer` 引用未解析，属既有中间态，非本轮引入）。
- **Fix:** 正文保留真实内置组件代码块；`builtin-text-demo.tsx` / `builtin-list-demo.tsx` 用等价渲染元素演示交互，并在正文「运行效果」写明「文档站缺少完整客户端环境，示例用等价元素演示」。
- **Files modified:** `docs/.vitepress/components/demos/ui/builtin-text-demo.tsx`、`docs/.vitepress/components/demos/ui/builtin-list-demo.tsx`、两篇正文的「运行效果」段。
- **Commit:** 无（按用户要求不 commit）。

### Execution Environment Adaptation

- PowerShell 5.1 会把 `node -e` 的内嵌引号剥离，计划里的 `<automated>` 片段不能原样执行；改为把同一段 JS 提取到临时文件后运行，断言内容未变。
- PowerShell 把构建的标准错误输出当作终止错误；按退出码、`build complete` 与 dead link 判定，构建结果为 green。

## Issues Encountered

- `packages-user/client-base/src/renderer` 缺失导致内置组件无法进入文档站点构建；未修改任何源码，按计划允许的 fallback 处理。
- 既有引擎类型报错 11 条（`packages/common/src/logger.ts` 缺 `main` 3 条、`packages/render/src/core/types.ts` 缺 `CanvasStyle` 8 条），非本轮引入，保持不动。

## Gates

| 门禁 | 结果 |
|------|------|
| prettier `--write` / `--check` | 通过，`All matched files use Prettier code style!` |
| ESLint | 0 error / 0 warning |
| `vue-tsc -p docs/tsconfig.json` | `docs/` 路径 0 报错；既有引擎报错 11 条（非本轮引入） |
| 静态断言 | `STATIC-OK`（5 篇 + 5 demo + 21 条侧边栏 + 回填链接 + hidden 一致） |
| 全量构建 | green，`build complete in 22.06s.`，无 dead link |

## Known Stubs

- `builtin-text-demo.tsx` / `builtin-list-demo.tsx` 用等价元素而不是真实内置组件（原因见上）。正文已说明；真实组件需在完整客户端环境验证，留待 10-48 读者/用户审阅。

## Pending

- Task 5 live 目视与正文抽查：`live 人工验证（10-46）：待最终人工审阅`。本轮未写「用户人工验证：通过」。

## Next Phase Readiness

- 10-47 可以直接复用本批的内置组件契约、UI 栈口径与性能结论。
- 10-48 审阅时需重点确认：内置组件 live 的等价演示是否可接受、`Choices` 别名说明是否清楚、第 19 / 20 篇「没有全局入口」是否一致。

## Self-Check: PASSED

- 5 篇正文存在，单 H1、`## 边界与注意`、CRLF。
- 5 个 demo 存在，默认导出、无 DOM 属性。
- 侧边栏 5 条与前三批 16 条齐全。
- 门禁全绿；本轮未 commit。
