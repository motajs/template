---
phase: 10-docs-restructure
plan: 18
subsystem: docs-site
tags:
  - vitepress
  - markdown
  - sidebar
  - navigation
  - advanced-tutorial

requires:
  - phase: 10-docs-restructure
    plan: 13
    provides: 高级 I 声明式 vs 命令式篇
  - phase: 10-docs-restructure
    plan: 14
    provides: 高级 I 插件系统篇
  - phase: 10-docs-restructure
    plan: 15
    provides: 高级 I 可存档内容篇
  - phase: 10-docs-restructure
    plan: 16
    provides: 高级 I 录像一致性与 Store 篇
  - phase: 10-docs-restructure
    plan: 17
    provides: 高级 I 钩子深入篇

provides:
  - docs/advanced/index.md 高级 I 导览（分层、阅读路径、取舍原则、边界、自检清单）
  - 站点「高级教程」导航与 /advanced/ 侧边栏（高级 I 七篇可见）
  - 高级 I 六篇之间的真实相对链接与返回导览入口
  - 七篇通过 prettier 与 VitePress 全量构建验证

affects:
  - 10-19 读者人格审阅
  - 后续高级 II / III 的页面注册

actuals:
  tokens: 3586
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 侧边栏手写数组，链接使用不带 .md 的绝对路径
    - 高级 II / III 只保留空分组，不产生指向不存在页面的链接
    - 高级 I 内部引用使用相对 .md 链接，页尾统一返回导览

key-files:
  created:
    - docs/advanced/index.md
  modified:
    - docs/.vitepress/config.ts
    - docs/advanced/declarative-vs-imperative.md
    - docs/advanced/plugin-system.md
    - docs/advanced/saveable-content.md
    - docs/advanced/replay-consistency.md
    - docs/advanced/data-stores.md
    - docs/advanced/hooks-in-depth.md

key-decisions:
  - 导航显示名采用「高级教程」，侧边栏分组采用「高级 I · 扩展基础」「高级 II · 系统实现」「高级 III · 原理与架构」，导览标题为「高级 I 导览」（用户已批准）
  - 高级 II / III 只保留 collapsed 空分组，正文中的占位标记保持不变
  - config.ts 仅修改 nav 与 sidebar，未触碰其他站点配置
  - 高级 I 的 TODO 占位注释在对应页面已存在后移除，改为真实相对链接

patterns-established:
  - 导览页承担分层、阅读路径与「优先插件」原则，正文篇目只负责各自主题
  - 高级页面之间统一用 ./<page>.md 互链，页尾返回 ./index.md

requirements-completed: []

coverage:
  - id: D1
    description: 高级 I 导览页，含 I/II/III 分层、七篇表与阅读顺序、两条阅读路径、前置、优先插件原则、边界与自检清单
    verification:
      - kind: other
        ref: "PowerShell static check on docs/advanced/index.md (STATIC-OK); prettier --check"
        status: pass
    human_judgment: true
    rationale: 分层表述、阅读路径与取舍原则是否符合读者预期，需要按 D-46 由用户审阅确认
  - id: D2
    description: 站点注册「高级教程」导航与 /advanced/ 侧边栏，高级 I 组恰好挂 7 个目标，高级 II/III 为空分组
    verification:
      - kind: other
        ref: "PowerShell config check (CONFIG-OK)"
        status: pass
    human_judgment: false
  - id: D3
    description: 高级 I 七篇互链可解析，并通过 prettier 与 VitePress 全量构建
    verification:
      - kind: integration
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete in 14.53s"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-10-20
status: complete
---

# Phase 10 Plan 18: 高级 I 导览与站点注册 Summary

**高级 I 导览、nav/sidebar 注册与七篇互链收口，七页全部构建且无死链**

## Performance

- **Duration:** ~20min
- **Started:** 2026-10-20（具体时刻未记录）
- **Completed:** 2026-10-20T15:00:12Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- 新增 `docs/advanced/index.md`，讲清高级教程的三层、高级 I 七篇与推荐顺序、两条阅读路径、前置、D-55 的「优先插件」原则与取舍表、本层边界和自检清单。
- 在 `docs/.vitepress/config.ts` 注册「高级教程」导航与 `'/advanced/'` 侧边栏；高级 I 组挂 7 个目标，高级 II / III 只留空分组。
- 把六篇中指向已存在页面的代码 span 占位改为真实相对链接，移除对应的 `TODO(advanced-I)` 注释，并在每篇页尾加入「返回高级 I 导览」。
- 七篇通过 prettier 检查；`pnpm docs:build` 构建 successful，`public/_docs/advanced/` 生成全部 7 个 HTML，无 dead link。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写 docs/advanced/index.md 导览** - `4dcac2f` (docs)
2. **Task 2: 在 config.ts 注册高级教程导航与侧边栏** - `9644e2d` (docs)
3. **Task 3: 六篇互链收口、格式与全量构建** - `5a6c389` (docs)

**Plan metadata:** 本次 SUMMARY 提交（docs: complete plan）

## Files Created/Modified

- `docs/advanced/index.md` - 高级 I 导览；分层、阅读路径、优先插件原则、边界与自检
- `docs/.vitepress/config.ts` - 新增「高级教程」导航与 `/advanced/` 侧边栏三组
- `docs/advanced/declarative-vs-imperative.md` - 三处占位改为插件 / 存档 / 录像链接，移除两个 advanced-I TODO，页尾返回导览
- `docs/advanced/plugin-system.md` - 存档占位改为链接，移除 advanced-I TODO，页尾返回导览
- `docs/advanced/saveable-content.md` - 录像占位改为链接，页尾返回导览
- `docs/advanced/replay-consistency.md` - 页尾返回导览
- `docs/advanced/data-stores.md` - 页尾返回导览
- `docs/advanced/hooks-in-depth.md` - 页尾返回导览

## Decisions Made

- 采用用户批准的显示名：导航「高级教程」，分组「高级 I · 扩展基础」「高级 II · 系统实现」「高级 III · 原理与架构」，导览标题「高级 I 导览」。
- 高级 II / III 只用 `collapsed: true` 的空分组占位，避免指向不存在页面的死链（D-47）。
- 保留高级 II / III 的代码 span 与 HTML 注释占位；只移除已由真实页面兑现的 advanced-I 占位。
- 侧边栏沿用现有 `/intermediate/` 的写法：绝对路径、不带 `.md`。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- VitePress 构建输出一条 chunk 大于 500 kB 的既有警告，与本次文档改动无关，未处理。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 高级 I 七篇已在站点上可见、可导航、可互相跳转，可作为 10-19 读者人格审阅的对象。
- 高级 II / III 的页面入口待对应内容成稿后再注册；当前空分组不会产生死链。

---

*Phase: 10-docs-restructure*
*Completed: 2026-10-20*

## Self-Check: PASSED

- 8 个源文件与 SUMMARY 均存在
- 三个任务提交均可在 git 历史中查到
- 构建产物包含全部 7 个高级 I HTML 页面
