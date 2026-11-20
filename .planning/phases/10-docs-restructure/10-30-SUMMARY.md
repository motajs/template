---
phase: 10-docs-restructure
plan: 30
subsystem: docs
tags: [vitepress, markdown, sidebar, advanced-i, mover, face-handler, interlinks]

requires:
    - phase: 10-docs-restructure
      provides: docs/advanced/mover.md（10-28）与 docs/advanced/face-handler.md（10-29），以及高级 I 既有六篇的「返回导览」结尾与相对链接约定
provides:
    - docs/advanced/index.md：高级 I 由七篇改为九篇，篇目表新增「移动 Mover」「FaceHandler 系列」两行与两个继续阅读链接
    - docs/.vitepress/config.ts：`sidebar['/advanced/']` 高级 I 组由 7 个目标变为 9 个，新页可从侧边栏进入
    - 两篇新文档之间的互引由代码 span 收口为真实相对链接，并各自补齐「返回高级 I 导览」结尾
affects: [10-31 reader review]

actuals:
    tokens: 14708
    tasks: 3
    commits: 2
    plan_head_before: 9f27f43f8f51217b18e3947ec2b5d0436f2ac108

tech-stack:
    added: []
    patterns:
        - 侧边栏顺序与导览篇目表同序：钩子深入之后才是移动 Mover 与 FaceHandler 系列（不重排既有顺序）
        - 并行计划里用代码 span 占位的文档互引，统一在注册计划里换成真实相对链接
        - 引用具体章节时带 `#标题` 锚点（D-74），不指整篇

key-files:
    created:
        - .planning/phases/10-docs-restructure/10-30-SUMMARY.md
    modified:
        - docs/advanced/index.md
        - docs/.vitepress/config.ts
        - docs/advanced/mover.md
        - docs/advanced/face-handler.md

key-decisions:
    - 两个侧边栏显示名沿用 10-28 / 10-29 的篇名：「移动 Mover」「FaceHandler 系列」；侧边栏与导览共用同一套用名
    - face-handler 指向移动器的那处互引带锚点 `./mover.md#实现自己的移动器`，落在「构造移动器时把处理器传进去」对应的章节（D-74）
    - mover 指向朝向处理器的那处互引用整篇链接 `./face-handler.md`，因为处理器接口与自定义方式分属该篇多个章节（D-74 的「引用具体章节」不适用）
    - 导览里「后四篇都建立在插件系统的扩展位置上」改为点名四篇，避免新增两篇后「后四篇」变成失准的计数

patterns-established:
    - 注册计划的收尾顺序：先改导览与侧边栏并跑注册门禁，再收口互引、补返回导览，最后 prettier + 全量构建

requirements-completed: []

coverage:
    - id: D1
      description: 导览由七篇改为九篇，篇目表补两行、继续阅读补两个链接，侧边栏高级 I 组 9 个目标且顺序与导览一致
      verification:
          - kind: other
            ref: 'Task 1 注册门禁（REGISTER-OK）：9 个 /advanced/ 目标集合完全匹配、高级 II 仍 10 个、nav 与其它配置未动'
            status: pass
      human_judgment: false
    - id: D2
      description: 两篇新文档互引为真实相对链接、各有返回导览结尾；prettier 通过、构建 green、dead link = 0
      verification:
          - kind: other
            ref: 'pnpm docs:build（build complete，无 dead link）与 prettier --check 三篇 markdown'
            status: pass
      human_judgment: true
      rationale: 站点上的可读性、篇目顺序是否符合读者预期，需要按 D-46 / D-57 的用户主导修订循环在 10-31 审阅；自动化只能验证结构、链接与构建

duration: 15min
completed: 2026-10-24
status: complete
---

# Phase 10 Plan 30: 高级 I 注册与互引收口 Summary

**把 10-28 / 10-29 的两篇新文档接进站点：导览七篇 → 九篇、侧边栏高级 I 组 7 → 9、两篇互引换成真实相对链接并补「返回高级 I 导览」结尾，构建 green、无死链。**

## Performance

- **Duration:** 约 15 分钟
- **Started:** 2026-10-24（本会话）
- **Completed:** 2026-10-24
- **Tasks:** 3/3（Task 0 汇报关卡已在派发时预先获准「可以执行」）
- **Files modified:** 4 个（导览、站点配置、两篇新文档）＋ SUMMARY 1 个

## Accomplishments

- `docs/advanced/index.md` 的高级 I 从「一共七篇，包含本导览与六篇正文」改为「一共九篇，包含本导览与八篇正文」，篇目表补第 8 / 9 行，推荐阅读顺序补一句「两篇偏参考性质，可等用到时再读」，「继续阅读」补两个真实链接。
- `docs/.vitepress/config.ts` 的 `sidebar['/advanced/']` 高级 I 组追加两项，7 个目标变 9 个；高级 II 组、nav、`base` / `outDir` / 搜索 / mermaid 均未动。
- 两篇新文档之间的互引由代码 span 换成真实相对链接，并各自补上与其余六篇一致的「返回[高级 I 导览](./index.md)。」结尾。
- 三篇 markdown 通过 prettier `--check`（`--write` 后三篇均 unchanged，说明新增内容本就符合格式）；全量构建 `build complete`、dead link = 0。

## 侧边栏高级 I 的 9 个目标（与导览同序）

1. `/advanced/`（高级 I 导览）
2. `/advanced/declarative-vs-imperative`（声明式 vs 命令式接口）
3. `/advanced/plugin-system`（插件系统）
4. `/advanced/saveable-content`（可存档内容）
5. `/advanced/replay-consistency`（录像一致性）
6. `/advanced/data-stores`（data-common 的 Store）
7. `/advanced/hooks-in-depth`（钩子深入）
8. `/advanced/mover`（移动 Mover）— 本次新增
9. `/advanced/face-handler`（FaceHandler 系列）— 本次新增

## 导览的具体改动点

| 位置 | 改动 |
| ---- | ---- |
| 「高级 I 包含什么」开头 | 七篇 → 九篇，六篇正文 → 八篇正文 |
| 篇目表 | 追加第 8 行「移动 Mover」（能排出一次移动、等它走完，并在需要时自己实现移动器）与第 9 行「FaceHandler 系列」（能选对朝向处理器、算出目标格与反方向，并把朝向映射到图块数字） |
| 推荐阅读顺序 | 原有六篇顺序不变，补一句「移动 Mover 与 FaceHandler 系列偏参考性质，可等用到时再读」 |
| 紧随其后的一段 | 「后四篇都建立在它提供的扩展位置上」点名成「可存档内容、录像一致性、data-common 的 Store 与钩子深入」，避免新增两篇后计数失准 |
| 继续阅读 / 高级 I 正文 | 追加 `[移动 Mover](./mover.md)` 与 `[FaceHandler 系列](./face-handler.md)` |

导览其余段落（分层表、阅读路径、优先用插件、不覆盖什么、读完能做什么）未改。

## 互引收口点

- `docs/advanced/mover.md`：「`FaceHandler 系列` 的接口与自定义方式由另一篇承担」改为「朝向处理器本身的接口与自定义方式见[FaceHandler 系列](./face-handler.md)」。整篇链接，因为接口语义、内置实现与自定义模板分属该篇多个章节，不存在单一切口。
- `docs/advanced/face-handler.md`：「构造移动器时把处理器传进去（见 `移动 Mover`）」改为带锚点的 `[移动 Mover](./mover.md#实现自己的移动器)`；锚点指向讲构造参数 `faceHandler` 的那一节（D-74）。
- 两篇末尾各补一行「返回[高级 I 导览](./index.md)。」，写法与既有六篇逐字一致。
- 两篇里指向既有篇目的链接（`./hooks-in-depth.md`、`./hooks-in-depth.md#异步钩子`、`./replay-consistency.md`、`./ii/pathfinding.md`、`./ii/custom-range.md`、`../intermediate/hero-location.md`、`./ii/static-vs-dynamic-tiles.md`）原本已是真实链接，未改。

## 格式、链接与构建结论

- prettier：`node node_modules/prettier/bin/prettier.cjs --write docs/advanced/index.md docs/advanced/mover.md docs/advanced/face-handler.md` 三篇均 `unchanged`；随后 `--check` 三篇通过。
- 构建：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 退出码 0，输出 `build complete in 17.60s`，无 dead link 报告。
- 产物：`public/_docs/advanced/mover.html` 与 `public/_docs/advanced/face-handler.html` 均存在；`public/_docs/advanced/` 下共 9 个 html，与侧边栏 9 个目标一一对应。
- 结构门禁：两篇仍为 kebab-case、CRLF、单 H1；无 `src/client`、无渲染端内容；加粗仍走 `<strong>`，无 `**` 贴标点问题；相对 `.md` 目标全部存在。
- 注册门禁：9 个 `/advanced/` 目标集合与期望完全匹配，高级 II 仍 10 个目标，`nav` 与其它配置未动。

## Task Commits

1. **Task 1: 更新导览并在侧边栏注册两篇** - `c5fca9e`（docs）
2. **Task 2: 两篇互引收口、格式与全量构建（含本 SUMMARY）** - 与 Plan metadata 同一提交（docs）

**Plan metadata:** 与 Task 2 合并为一次提交（依赖 SUMMARY 的门禁需在提交前运行，构建也已在提交前完成）。

## Files Created/Modified

- `docs/advanced/index.md` — 高级 I 九篇、篇目表两行、继续阅读两个链接
- `docs/.vitepress/config.ts` — 侧边栏高级 I 组新增 `mover` / `face-handler` 两项
- `docs/advanced/mover.md` — 指向 FaceHandler 系列的互引改为真实链接，补返回导览结尾
- `docs/advanced/face-handler.md` — 指向移动器的互引改为带锚点链接，补返回导览结尾
- `.planning/phases/10-docs-restructure/10-30-SUMMARY.md` — 本执行总结

## Decisions Made

- 两个显示名沿用篇名「移动 Mover」「FaceHandler 系列」，侧边栏与导览共用同一套用名，排序固定在「钩子深入」之后，既有六篇顺序不重排。
- face-handler → mover 的互引带锚点；mover → face-handler 的互引用整篇链接（理由见「互引收口点」）。
- 导览里原句「后四篇都建立在插件系统提供的扩展位置上」改为点名四篇。新增两篇后该计数会指向六篇，属于计划允许的「提到篇数或范围时一并微调」。
- 只改计划列出的四个文件；未改生产代码、渲染端内容、高级 II 分组与其它站点配置。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 修复 `mover.md` 两处加粗不渲染（CommonMark flanking 边界）**
- **Found during:** Task 2（跑 BOLD-FLANK 门禁）
- **Issue:** `docs/advanced/mover.md` 第 197 行原写 `**面朝朝向（`faceDirection`）**指…` 与 `**移动朝向（`moveDirection`）**指…`。加粗内容以全角右括号 `）` 结尾，`**` 左侧是标点、右侧是汉字，不满足右界定（right-flanking）条件，实际渲染成字面量 `**`。构建产物 `/advanced/mover.html` 里 `**面朝` 仍是字面字符串、`<strong>面朝朝向…</strong>` 计数为 0，可确认未渲染（D-52）。
- **Fix:** 两处改用 `<strong>…</strong>`（D-52 允许的替代写法，也是高级 I 其余篇目在正文中加粗的既有写法），加粗覆盖的文字不变。
- **Files modified:** `docs/advanced/mover.md`
- **Verification:** 重新构建后产物中出现 `<strong>面朝朝向（<code>faceDirection</code>）</strong>`，字面 `**` 消失；BOLD-FLANK 门禁通过；prettier `--check` 仍为 unchanged。
- **Committed in:** Task 2 提交（与互引收口同一提交）

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** 只影响已有正文的加粗渲染，不改变语义、不涉及新增内容；不修复则本计划 BOLD-FLANK 门禁无法通过。

其余按计划执行。Task 0 为汇报关卡，已在派发时预先获准「可以执行」，未重复阻塞。

## Issues Encountered

- 构建产物路径不是 `docs/.vitepress/dist` 而是 `public/_docs`（`config.ts` 的 `outDir`），页面存在性检查按实际产物目录进行。
- `docs/advanced/ii/static-vs-dynamic-tiles.md` 第 149 行仍以代码 span 写「见 `高级 I · 移动 Mover`」，第 151 行有 `<!-- TODO(advanced-I): 移动 Mover -->` 标记。该文件不在本计划 `files_modified` 内，本次未改动；是否需要把这两处收口成 `/advanced/mover` 的真实链接，请你确认后再另行安排。
- 工作区里有与本计划无关的既有改动（`packages-user/*`、`src/client/*` 等）以及新出现的 `.planning/phases/09-minimum-browser-runnable/09-26-PLAN.md`，均未暂存、未提交。

## User Setup Required

None - 无外部服务配置。

## Next Phase Readiness

- 高级 I 在站点上已是可浏览的九篇，两篇新页可从导览的篇目表、继续阅读与侧边栏三处进入。
- 10-31 的读者审阅对象是这两篇新页；站点构建与链接已由本计划保证，剩下的判断交给用户主导的审阅循环（D-46 / D-57）。
- 遗留待确认项只有上面 `static-vs-dynamic-tiles.md` 的代码 span 与 TODO 标记，不影响构建与链接。

---

_Phase: 10-docs-restructure_
_Completed: 2026-10-24_

## Self-Check: PASSED

- 文件存在：`docs/advanced/index.md`、`docs/.vitepress/config.ts`、`docs/advanced/mover.md`、`docs/advanced/face-handler.md`、`.planning/phases/10-docs-restructure/10-30-SUMMARY.md`
- 提交存在：`c5fca9e`（导览与侧边栏注册）、本提交（互引收口与 SUMMARY）
- 门禁存在：REGISTER-OK（侧边栏 9 个目标）、STATIC-OK（结构 / 链接 / flanking）、PRETTIER-OK、BUILD-COMPLETE-OK、NO-DEAD-LINK
