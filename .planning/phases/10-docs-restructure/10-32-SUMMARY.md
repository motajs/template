---
phase: 10-docs-restructure
plan: 32
subsystem: docs
tags: [vitepress, markdown, advanced-i, mover, face-handler, user-review, usage-first]

requires:
    - phase: 10-docs-restructure
      provides: 10-31 已消除独立读者阻断问题的 docs/advanced/mover.md 与 docs/advanced/face-handler.md
provides:
    - 两篇补写内容改为「用法优先」结构：先讲系统模型，再讲怎么拿、怎么用，自定义压到末尾
    - 用户主导修订循环三轮收敛（D-77、D-79..D-82、D-83），最终确认「通过」
    - .planning/phases/10-docs-restructure/10-32-USER-REVIEW.md：逐轮用户意见、落点、处置、最终确认与收尾记录
affects: [10 phase close-out]

actuals:
    tokens: 25764
    tasks: 5
    commits: 3
    plan_head_before: 73d1a04fbe02ba25cbfc6ec1e70377282074534e

tech-stack:
    added: []
    patterns:
        - 教程正文「用法优先」：能做什么 → 怎么拿到 → 怎么用 → 用在哪里 → 自定义（末尾一两节）
        - 系统类文档先给「系统模型」再给接口与用法（D-82），模型节只讲有哪些角色与两条数据流
        - 正文不写使用概率元信息、源码路径、实现与注释差异、也不写「用户问过什么」（D-79 / D-80 / D-81）
        - 教程不出现「模板」「[需改]」标记；提示只写成注释说明下一行做什么（D-83）

key-files:
    created:
        - .planning/phases/10-docs-restructure/10-32-USER-REVIEW.md
        - .planning/phases/10-docs-restructure/10-32-SUMMARY.md
    modified:
        - docs/advanced/mover.md
        - docs/advanced/face-handler.md
        - docs/advanced/index.md
        - docs/advanced/ii/adding-enemy-attribute.md
        - docs/advanced/ii/adding-hero-attribute.md
        - docs/advanced/hooks-in-depth.md
        - docs/advanced/plugin-system.md
        - docs/advanced/declarative-vs-imperative.md
        - docs/advanced/replay-consistency.md
        - docs/advanced/saveable-content.md
        - docs/advanced/data-stores.md

key-decisions:
    - 文档重心是「怎么用」：`mover.md` 把「拿到现成的移动器」提到第 2 节，自定义压到末尾 2 节；`face-handler.md` 同理压到 1 节（D-77）
    - 两篇先讲系统模型再讲接口（D-82）：`移动器模型` 与 `朝向模型` 各占首节，只讲角色与数据流，不展开实现
    - 朝向组的自定义示例改为六边形布局（六个邻接方向），因为需要自定义的真实场合是「坐标系不是方格」，而非「斜向归并不同」
    - 删除正文中的使用概率、源码路径、实现 / 注释差异与「用户问题」框架（D-79..D-82）；这些差异只留在审阅记录与对话里
    - 高级教程移除「模板」「[需改]」标记，但保留游戏领域术语「怪物模板 / 原始模板 / 默认模板」（D-83）

patterns-established:
    - 用户修订循环的记录结构：轮次 → 用户意见 → 条目表（落点 / 处置 / 状态）→ 执行记录 → 验证
    - 收尾只认独占一行的 `用户最终确认：通过`，且条目级 `状态：待处理` 必须为 0

requirements-completed: []

coverage:
    - id: D1
      description: 两篇补写内容按用法优先重构，正文约一半是高概率用法章节，自定义仅末尾一两节
      verification:
          - kind: other
            ref: '10-32-USER-REVIEW.md 第 1 轮执行记录（章节顺序与行数变化）与 D-77 / D-78 自评'
            status: pass
      human_judgment: false
    - id: D2
      description: 两篇先讲系统模型；正文无使用概率、源码路径、实现差异与用户问题框架；模板 / 需改标记清除
      verification:
          - kind: other
            ref: '10-32-USER-REVIEW.md 第 2 / 3 轮条目表（M1、M2、F1、F2、F3 与全量标记清理）'
            status: pass
      human_judgment: false
    - id: D3
      description: 最终产物可构建、可预览、无死链、结构正确，用户明确确认通过
      verification:
          - kind: other
            ref: 'pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build（build complete in 14.31s，无 dead link）＋ prettier --check ＋ 用户最终确认：通过'
            status: pass
      human_judgment: true
      rationale: 「通过」是用户对本领域内容的判断，按 D-46 第 2 阶段只能由用户给出；自动化只能保证构建、格式、结构与链接

duration: 约 60 分钟（跨三轮循环）
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 32: 高级 I 补写（Mover / FaceHandler）用户修订循环 Summary

**把两篇补写内容从「怎么自定义」翻成「怎么用」：`mover.md` 先把移动器模型与「拿到现成移动器」前置（775 → 533 行）、`face-handler.md` 先讲朝向模型与取用（447 → 356 行），自定义压到末尾一两节；三轮用户意见收敛，用户最终确认「通过」。**

## Performance

- **Duration:** 约 60 分钟（三轮用户意见 + 收尾）
- **Started:** 2026-10-24（本会话首轮）
- **Completed:** 2026-10-26（收尾）
- **Tasks:** 5/5（Task 0 / Task 1 / Task 3 的汇报与确认关卡均已获用户明确回复）
- **Files modified:** 两篇主体 + 导览 + 高级 I / II 共 8 篇标记清理 + 审阅记录 + 本 SUMMARY

## Accomplishments

- **第 1 轮 · 用法优先重构（D-77）**：用户指出重心应是「怎么使用」而不是「怎么自定义」——游戏里需要自定义移动器 / 朝向组的概率几乎为 0。
  - `mover.md`（775 → 525 行）：新顺序为 能做什么 → 拿到移动器（勇士 `state.hero.location.mover`、动态图块 `tile.mover`、如何取到动态图块）→ 排计划 → 开始与等待（`start` → `IMoverController` → `onEnd`）→ 执行中控制 → 勇士配置 → 钩子 → 读取与设置状态 → 自定义（2 节）→ 边界 → 验证；删掉独立的「内部执行流程」整节与三段装配示例。
  - `face-handler.md`（447 → 350 行）：新顺序为 三个概念 → 拿到处理器（`get` / `getById` + 判空）→ 常用方法 → 用在哪里（移动器 / 寻路、图块朝向、`roleFace` 映射）→ 内置 Dir4 / Dir8 → 自定义（1 节）→ 边界 → 验证。
- **第 2 轮 · 系统模型与元信息清理（D-79..D-82）**：先讲系统模型再讲接口；删除正文中的使用概率、源码叙述、实现 / 注释差异与「用户问题」框架。
  - `mover.md` 新增首节「移动器模型」（可移动对象、移动计划、执行与控制器、面朝 / 移动两个方向，接口分工表并入）。
  - `face-handler.md` 首节改为「朝向模型」，补齐 `IFaceDescriptor` 与 `IRoleFaceBinder`，先讲移动与显示两条数据流。
  - 自定义示例改为六边形布局 `HexFaceHandler`（六个邻接方向、字符串 id `hex`），理由是需要自定义的真实场合是坐标系不是方格。
- **第 3 轮 · 模板 / 需改标记移除（D-83）**：清除全部 `[需改]` 与「模板」措辞，提示改为注释说明下一行做什么；保留游戏领域术语「怪物模板 / 原始模板 / 默认模板」。
- **收尾**：用户确认「可以，整体没有问题」→ 记录 `用户最终确认：通过`；两篇 prettier `unchanged`，最终构建 `build complete in 14.31s`、无 dead link；侧边栏高级 I 仍 9 个目标。

## Task Commits

1. **第 1 轮：重构 Mover / FaceHandler 为用法优先（D-77）** - `c0b3e58`（docs）
2. **第 2 轮：补系统模型并清理元信息（D-79..D-82）** - `f4edda6`（docs）
3. **第 3 轮：移除高级教程模板 / 需改标记（D-83）** - `6846c21`（docs）

**Plan metadata:** 收尾提交 `docs(10-31..10-32): 收尾高级 I 补写（Mover + FaceHandler）`（含本 SUMMARY、10-31-SUMMARY 与两份审阅记录的最终确认）

## Files Created/Modified

- `docs/advanced/mover.md` — 用法优先重排（533 行）、移动器模型、拿到移动器的三种来源、执行中控制、勇士配置与钩子用法、自定义压到末尾两节
- `docs/advanced/face-handler.md` — 用法优先重排（356 行）、朝向模型（五个组件 + 两条链路）、取用与八个常用方法、用在哪里、六边形自定义示例
- `docs/advanced/index.md` — 「高级 I · 扩展基础」主要主题补入「移动 Mover、FaceHandler 系列」，与九篇清单一致
- `docs/advanced/hooks-in-depth.md`、`plugin-system.md`、`declarative-vs-imperative.md`、`replay-consistency.md`、`saveable-content.md`、`data-stores.md` — 模板措辞清理（D-83）
- `docs/advanced/ii/adding-enemy-attribute.md`、`ii/adding-hero-attribute.md` — `[需改]` 标记移除（D-83）
- `.planning/phases/10-docs-restructure/10-32-USER-REVIEW.md` — 三轮用户意见、处置表、执行记录、最终确认与收尾记录
- `.planning/phases/10-docs-restructure/10-32-SUMMARY.md` — 本执行总结

## 三轮用户循环的处置摘要

| 轮次 | 用户意见 | 落点 | 处置 |
| --- | --- | --- | --- |
| 1 | 重心应是「怎么用」，自定义概率几乎为 0 | 两篇整体结构 | 用法优先重排；自定义压到 `mover.md` 末尾 2 节、`face-handler.md` 末尾 1 节 |
| 2 | 先讲系统模型再讲接口；删使用概率 / 源码叙述 / 用户问题框架；朝向示例改六边形 | 两篇首节 + 全文 + 自定义节 | M1 / M2 / F1 / F2 / F3 全部 `状态：已处理` |
| 3 | 高级教程不写「模板」「[需改]」 | 高级 I / II 共 8 篇 | 全部标记清除；游戏领域术语保留 |

## Decisions Made

- **D-77 / D-78**：文档重心是「怎么用」；写作与审阅都要自问每个章节的使用概率，通篇低概率说明文档不好。
- **D-79 / D-80 / D-81**：正文不写「使用概率很低」这类元信息、不写源码路径与实现差异、不把「用户问过什么」写进文档；差异只留在审阅记录与对话。
- **D-82**：讲一个系统时先讲系统模型（有哪些角色、怎么组成、两条链路），再讲接口与用法。
- **D-83**：高级教程不出现「模板」「[需改]」标记或模板章节，提示只写成注释；游戏领域术语不在此列。
- 收尾只认独占一行的 `用户最终确认：通过`；AI 未自行宣布完成。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - 缺失关键内容] `mover.md` 补「勇士排好计划也不一定真走」的用法提示**
- **Found during:** 第 1 轮重排
- **Issue:** 通行失败时 `HeroMover` 会调用 `controller.stop()`，重排后若只讲 `start` / `onEnd`，读者会以为 `onEnd` 一定对应「走到了」。
- **Fix:** 在用法区补一句：通行失败时移动由 `HeroMover` 提前 `stop` 收尾，`onEnd` 只表示整次结束。
- **Files modified:** `docs/advanced/mover.md`
- **Verification:** 构建 green、无死链；用户第 2 轮未再就此提问
- **Committed in:** `c0b3e58`

**2. [Rule 2 - 缺失关键内容] 导览主要主题与九篇清单对齐**
- **Found during:** 10-31 复审
- **Issue:** 导览分层表「高级 I · 扩展基础」的主要主题漏了新增两篇。
- **Fix:** 主要主题补入「移动 Mover、FaceHandler 系列」。
- **Files modified:** `docs/advanced/index.md`
- **Verification:** 与「高级 I 包含什么」篇目表一致；构建 green
- **Committed in:** `73d1a04`（10-31）

---

**Total deviations:** 2 auto-fixed（均属内容正确性，Rule 2）
**Impact on plan:** 只补说明与对齐，未改结构、未扩大章节、未触碰 `config.ts` 与渲染端内容。

## Issues Encountered

- 第 3 轮按 D-83 清理标记时波及的篇目多于本计划 `files_modified` 的字面范围（`hooks-in-depth.md`、`plugin-system.md`、`declarative-vs-imperative.md`、`replay-consistency.md`、`saveable-content.md`、`data-stores.md` 与两篇属性篇），均为用户在同一条意见中点名的「高级教程」范围，已在审阅记录里逐篇列出。
- 第 1 轮记录的标题保留为「（2026-10-24，待执行）」，其末尾保留原有一处 `\*\*`；均为历史文本，未改动。
- 工作区有与本计划无关的既有改动（`packages-user/*`、`src/client/*`、`.planning/.../09-*` 与 `10-CONTEXT.md`），收尾提交未暂存它们。

## User Setup Required

None - 无外部服务配置。

## Next Phase Readiness

- 高级 I 九篇在站点上可浏览、可预览，两篇新页从导览篇目表、继续阅读与侧边栏三处进入。
- D-09 的人工验收依据齐备：审阅记录 + 最终确认 + 构建产物。
- 无待处理项；遗留的只有用户明确不实施的越界内容与按 D-75 保留的低概率示例。

---

_Phase: 10-docs-restructure_
_Completed: 2026-10-26_

## Self-Check: PASSED

- 文件存在：`docs/advanced/mover.md`、`docs/advanced/face-handler.md`、`docs/advanced/index.md`、`.planning/phases/10-docs-restructure/10-32-USER-REVIEW.md`、`.planning/phases/10-docs-restructure/10-32-SUMMARY.md`
- 提交存在：`c0b3e58`（第 1 轮）、`f4edda6`（第 2 轮）、`6846c21`（第 3 轮）
- 门禁存在：`用户最终确认：通过`、无 `状态：待处理`、prettier unchanged、`build complete`、无 dead link、侧边栏 9 个目标
