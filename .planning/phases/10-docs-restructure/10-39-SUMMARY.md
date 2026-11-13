---
phase: 10-docs-restructure
plan: 39
subsystem: docs
tags: [vitepress, markdown, advanced-iii, sidebar, cross-links]
requires:
    - phase: 10-docs-restructure
      provides: 10-34..10-38 已产出高级 III 七篇正文，III 目录存在但侧边栏仍为空
provides:
    - docs/advanced/iii/index.md：高级 III 导览（读者、与 I/II 的区别、前置、八篇地图、阅读路径、边界、自检）
    - 侧边栏「高级 III · 原理与架构」8 项目标与展开状态
    - 七篇正文的返回导览与兄弟页互链
    - 总导览、高级 I 导览、高级 II 导览三处 III 占位替换
affects: [10-40 读者审阅]

actuals:
    tokens: 3400
    tasks: 4
    commits: 3
    plan_head_before: 44c14c68e0207eae156bbe51c9359f7265ba966c

tech-stack:
    added: []
    patterns:
        - 层导览沿用高级 II 导览体例：给谁 → 与相邻层的区别 → 前置 → 篇目地图 → 阅读路径 → 不覆盖 → 自检
        - 导览地图顺序与侧边栏完全一致；阅读路径另写一条原理线，不受地图顺序约束
        - 正文互链只把已有的纯文本提及改成链接；无可链接提及的页面只补一句最短衔接（D-60）
        - 具体章节引用带 `#标题` 锚点（D-74）；需要锁定中文标点的锚点沿用显式 `{#...}`（10-36 已落地）
        - 侧边栏绝对路径不带 `.md`、不带尾斜杠；目录入口用 `/advanced/iii/`

key-files:
    created:
        - docs/advanced/iii/index.md
        - .planning/phases/10-docs-restructure/10-39-SUMMARY.md
    modified:
        - docs/advanced/iii/loading-system.md
        - docs/advanced/iii/replay-internals.md
        - docs/advanced/iii/event-system.md
        - docs/advanced/iii/anon-tokyo.md
        - docs/advanced/iii/passability-and-pathfinding.md
        - docs/advanced/iii/core-state.md
        - docs/advanced/iii/plugin-internals.md
        - docs/.vitepress/config.ts
        - docs/advanced/index.md
        - docs/advanced/i/index.md
        - docs/advanced/ii/index.md

key-decisions:
    - Task 0 关卡已由用户满足：用户确认 8 项侧边栏显示名与顺序并回复「确认，可以执行」
    - 侧边栏顺序按用户确认：导览 → 加载系统 → 录像系统底层 → 事件系统 → Anon-Tokyo 解释器 → 通行性谓词与寻路原理 → CoreState 组装与初始化 → 插件内部机制
    - III 组 collapsed 由 true 改为 false；I 组 9 项、II 组 10 项与 nav 未动
    - 导览地图与侧边栏同序；阅读路径另设原理线与按需线，不要求与地图同序
    - event-system 的「收集」标题保留 10-36 追加的显式锚点 `{#收集这一次该执行谁}`，使 `#收集这一次该执行谁` 在构建后仍可解析
    - 三处占位只替换为「已可阅读 + 真实链接」，不写「后续再补」式元叙述（D-16）
    - 本轮只提交计划文件与 SUMMARY，未改 STATE.md / ROADMAP.md，沿用本仓库 10-38 的既有做法

patterns-established:
    - 高级 III 导览结构：读者画像 → 与 I/II 的区别 → 前置 → 八篇地图 → 阅读路径 → 不覆盖 → 自检
    - 注册收口顺序：先建导览与互链，再注册侧边栏与替换占位，最后跑格式 / 构建门禁
    - 兄弟页互链按内容就近插入：已有提及改为链接，没有提及只补一句衔接

requirements-completed: []

coverage:
    - id: D1
      description: 新建高级 III 导览，六个以上要求小节齐备，七篇正文在八篇地图中全部有真实链接
      verification:
          - kind: other
            ref: 'Task 1 自动门禁 INDEX-OK（anchor-aware）；八篇地图逐项检查 ./loading-system.md 等 7 个链接'
            status: pass
      human_judgment: false
    - id: D2
      description: 七篇正文补返回导览，每篇至少一处兄弟页链接，全层合计不少于 5 处
      verification:
          - kind: other
            ref: 'Task 1 自动门禁 cross=7；逐篇 NO-BACKLINK / NO-SIBLING-LINK 检查通过'
            status: pass
      human_judgment: false
    - id: D3
      description: 侧边栏 III 组注册 8 项且顺序正确、目标存在，I/II/nav 未变；三处占位替换为真实链接
      verification:
          - kind: other
            ref: 'Task 2 自动门禁 REGISTER-OK；III-LINK-COUNT 8、I 9、II 10、nav /advanced/ 未变'
            status: pass
      human_judgment: false
    - id: D4
      description: 八页 CRLF、单 H1，prettier --check 通过，构建 green 且无 dead link
      verification:
          - kind: other
            ref: 'prettier --check 通过；cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build" 输出 build complete in 21.72s；ADV-MD-OK'
            status: pass
      human_judgment: false

duration: 约 25 分钟
completed: 2026-10-27
status: complete
---

# Phase 10 Plan 39: 高级 III 注册与导览收口 Summary

**把高级 III 从七篇散落草稿接成站点上的一层：新建导览、给七篇补返回与兄弟页互链、注册八项侧边栏、替换三处占位，格式与全量构建双绿。**

## Performance

- **Duration:** 约 25 分钟
- **Completed:** 2026-10-27
- **Tasks:** 4/4（Task 0 已由用户确认「确认，可以执行」满足；Task 1 / 2 / 3 已执行）
- **Files created:** 2（导览 + 本 SUMMARY）
- **Files modified:** 11

## Sidebar Registration

`docs/.vitepress/config.ts` 的「高级 III · 原理与架构」组由 `collapsed: true, items: []` 改为 `collapsed: false` + 8 项，顺序与用户确认一致：

| 序  | 显示名                     | 目标                                       |
| --- | -------------------------- | ------------------------------------------ |
| 1   | 高级 III 导览              | `/advanced/iii/`                           |
| 2   | 加载系统                   | `/advanced/iii/loading-system`             |
| 3   | 录像系统底层               | `/advanced/iii/replay-internals`           |
| 4   | 事件系统                   | `/advanced/iii/event-system`               |
| 5   | Anon-Tokyo 解释器          | `/advanced/iii/anon-tokyo`                 |
| 6   | 通行性谓词与寻路原理       | `/advanced/iii/passability-and-pathfinding` |
| 7   | CoreState 组装与初始化     | `/advanced/iii/core-state`                 |
| 8   | 插件内部机制               | `/advanced/iii/plugin-internals`           |

I 组仍为 9 项、II 组仍为 10 项，`nav` 仍指向 `/advanced/`，`outDir` / `base` / 搜索 / mermaid 均未改动。

## Guide Structure

新建 `docs/advanced/iii/index.md`，单 H1《高级 III 导览》，包含：

- `## 高级 III 是给谁的`：四条读者画像（类型与 TypedArray、改动落层判断、存档与回放排查、接受固定顺序）；
- `## 与高级 I、高级 II 的区别`：I 讲扩展机制怎么用、II 讲具体系统怎么改、III 讲为什么这样设计与数据怎么流；三层是难度标签不是领域分类；
- `## 前置`：链接 `../i/`、`../ii/`，并点名 `../i/plugin-system.md`、`../i/saveable-content.md`、`../i/replay-consistency.md`、`../ii/pathfinding.md`；
- `## 八篇地图`：7 行正文全部真实链接，顺序与侧边栏一致；表后说明本页是第八篇；
- `## 阅读路径`：原理线（装配 → 插件 → 事件 → 解释器 → 通行与寻路 → 录像 → 加载）与按需线；
- `## 本层不覆盖什么`：渲染端结构性内容、编辑器与内容配置、API 签名清单、legacy 包；
- `## 怎么验证你读懂了`：六条自检。

> 计划 objective 写「六个小节」，但 Task 1 与自动门禁实际列出七个小节；按门禁落地七个小节。

## Backlinks and Cross-links

七篇正文末尾统一补 `返回[高级 III 导览](./index.md)。`（空行 + 结尾句号，格式与高级 I / II 一致）。

兄弟页链接逐条清单（含 10-36 已存在、本轮复核保留的链接）：

| 页面               | 链接                                                                 | 来源                     |
| ------------------ | -------------------------------------------------------------------- | ------------------------ |
| loading-system     | `./core-state.md#加载管线`（原 `CoreState.load()` 纯文本改为链接）   | 本轮新增                 |
| replay-internals   | `./core-state.md#存档挂载`（补一句「录像作为可存档对象由主插件注册」） | 本轮新增                 |
| event-system       | `./anon-tokyo.md`                                                    | 10-36 已有，复核保留     |
| anon-tokyo         | `./event-system.md`、`./event-system.md#自定义一个内建函数`          | 10-36 已有，复核保留     |
| passability-and-pathfinding | `./core-state.md`（原「数据端初始化时」纯文本改为链接）      | 本轮新增                 |
| core-state         | `./plugin-internals.md`                                              | 10-38 已有，复核保留     |
| plugin-internals   | `./core-state.md#加载管线`                                           | 10-38 已有，复核保留     |

门禁统计 `cross=7`（按目标页去重计数），每篇至少一处，全层 ≥ 5。所有相对 `.md` 链接目标存在。

## Placeholder Replacement

三处旧占位全部替换为真实链接，未新增论述：

1. `docs/advanced/index.md` 三层表 III 行：`高级 III · 原理与架构` → `[高级 III · 原理与架构](./iii/)`；正文「等该层页面就绪后开放入口」→「已可阅读，入口见[高级 III 导览](./iii/)」；边界项「该层页面尚未创建…」→「该层已可阅读，入口见[高级 III 导览](./iii/)」。
2. `docs/advanced/i/index.md`：「高级 III 仍用 `高级 III · <专题>` 这样的占位标记…暂不提供页面入口」→「高级 III 已经可阅读，入口见[高级 III 导览](../iii/)」；「本层不覆盖什么」中的 III 条目补上同一链接。
3. `docs/advanced/ii/index.md`：「高级 III 尚未编写…等该层建立后再替换」→「高级 III 已经可阅读，入口见[高级 III 导览](../iii/)」。

替换后 `docs/advanced/**` 不再出现「尚未编写」「暂不提供页面入口」「尚未创建」「页面就绪后」。

## Task Commits

1. **Task 1: 新增高级 III 导览并补齐互链** — `93ac3ef`（docs）
2. **Task 2: 注册高级 III 侧边栏并替换占位** — `0cfeef4`（docs）
3. **Task 3: 高级 III 注册与构建收口** — 本次 SUMMARY 提交（docs）

## Gates

- Task 1 自动门禁：`INDEX-OK`；导览七个要求小节齐备、八篇地图 7 个链接均可解析、`../i/` 与 `../ii/` 前置真实、七篇均有回链、`cross=7`、无 `BAD-ANCHOR`。
- Task 2 自动门禁：`REGISTER-OK`；III 组恰 8 个 `/advanced/iii/...` 目标且逐个存在、I 组 9 项、II 组 10 项、nav 未变、三处占位替换完成。
- 全层结构门禁：`ADV-MD-OK`；`docs/advanced/**` 全部 `.md` 为 CRLF、单 H1。
- `node node_modules/prettier/bin/prettier.cjs --check docs/advanced/iii docs/advanced/index.md docs/advanced/i/index.md docs/advanced/ii/index.md docs/.vitepress/config.ts`：通过。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 退出码 0，输出 `build complete in 21.72s`，无 dead link。
- 锚点抽查：`public/_docs/advanced/iii/event-system.html` 中「收集」章节 `id="收集这一次该执行谁"` 存在。
- D-52 加粗边界：新增加粗仅 `**原理线**` / `**按需线**`，两侧无标点贴边。
- 越界检查：未改 I / II 正文语义（仅占位段与链接），未改源码与其它站点配置。

## Deviations from Plan

### Auto-fixed / Verified Issues

**1. [Rule 1 - Bug] Task 1 门禁的 event-system 标题检查与显式锚点冲突**
- **Found during:** Task 1 门禁执行
- **Issue:** 门禁要求 `(?m)^## 收集：这一次该执行谁\r?$`，即标题行末尾不能有任何内容；但 10-36 为让 `#收集这一次该执行谁` 可解析，已在该行追加显式锚点 `{#收集这一次该执行谁}`。VitePress 的默认 slug 会保留全角冒号（实际为 `收集：这一次该执行谁`），删掉显式锚点会使计划指定的链接失效。
- **Fix:** 保留标题文字与显式锚点；门禁按 anchor-aware 形式执行（允许 ` {#收集这一次该执行谁}` 后缀）。构建后 HTML 的 `id="收集这一次该执行谁"` 已确认。
- **Files modified:** 无额外文件（未改标题行）
- **Commit:** 属于 Task 1 提交 `93ac3ef` 的上下文
- **影响:** 只有该条检查的写法偏严；导览、回链、互链与锚点均按计划可用。

**2. [Clarification] 「六个小节」与门禁七个小节**
- **Issue:** objective / 用户提示写「六个小节」，Task 1 与自动门禁列出七个小节。
- **Fix:** 按门禁落地七个小节（给谁、区别、前置、地图、路径、不覆盖、自检），未删除任何门禁要求的小节。
- **影响:** 只多不少，不影响链接与构建。

## Issues Encountered

- 工作区存在与本计划无关的既有改动（`packages-user/client-base/src/map/*`、`packages-user/client-base/src/map/__test__/`、`.planning/phases/09-*`），所有提交均只暂存本计划文件。
- 构建产物 `public/_docs/*` 未纳入提交，遵循仓库既有做法。
- 未发现阻塞问题；无认证关卡、无包安装、无新增依赖。

## User Setup Required

None - no external service configuration required.

## Handoff to 10-40

- 高级 III 八项已可从侧边栏进入，八个页面末尾均可返回导览。
- 10-40 可直接审阅：导览六个以上小节的取舍、七篇互链是否都落在正确章节、三处占位文案是否符合「已可阅读」口径。
- 若 10-40 决定改用其它锚点写法，需要同步调整 `event-system` 标题行与 `anon-tokyo` 的链接，二者必须成对修改。

## Next Phase Readiness

- 高级 III 在站点上成为可浏览的一层：侧边栏、导览、返回链接、兄弟页互链全部生效。
- 三处旧占位不再误导读者；格式与构建双绿，无越界改动。

## Self-Check: PASSED

- 文件存在：`docs/advanced/iii/index.md`、`.planning/phases/10-docs-restructure/10-39-SUMMARY.md`
- 提交存在：`93ac3ef`（Task 1）、`0cfeef4`（Task 2）、本次 SUMMARY 提交（Task 3）
- 门禁存在：`INDEX-OK`、`REGISTER-OK`、`ADV-MD-OK`、prettier `--check` 通过、`build complete in 21.72s`、无 dead link
