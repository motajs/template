---
phase: 10-docs-restructure
plan: 31
subsystem: docs
tags: [vitepress, markdown, advanced-i, mover, face-handler, reader-review, persona]

requires:
    - phase: 10-docs-restructure
      provides: 10-30 已接入导览与侧边栏的 docs/advanced/mover.md 与 docs/advanced/face-handler.md
    - phase: 10-docs-restructure
      provides: 10-19 已获用户确认的高级 I 读者人格提示词（D-57，逐字沿用）
provides:
    - 两篇补写内容经独立读者审阅收敛：首轮 4 个阻断问题全部消除，复审无遗留阻断项
    - .planning/phases/10-docs-restructure/10-31-READER-REVIEW.md：人格、首轮清单、两轮修复与复审、收敛结论与结束标记
    - 两篇文档在阻断问题处的实质补写（start 返回 null 的等待入口、勇士顶层实现契约、Dir4 的 dirOf 口径）
affects: [10-32 user revision loop]

actuals:
    tokens: 10306
    tasks: 4
    commits: 2
    plan_head_before: f317446aa7d3532c4d8a87e73c8c0afd8765fab1

tech-stack:
    added: []
    patterns:
        - 补写内容走「独立读者子代理 → 问题清单 → 迭代 → 复审」的固定链路（D-46 第 1 阶段 / D-57）
        - 阻断性口径：读者据此无法完成操作，或会对执行时序、状态归属、两层朝向模型产生实质误解
        - 实现与注释不一致时以注释语义为准（D-72），差异只报告、不写进正文（D-80）

key-files:
    created:
        - .planning/phases/10-docs-restructure/10-31-READER-REVIEW.md
        - .planning/phases/10-docs-restructure/10-31-SUMMARY.md
    modified:
        - docs/advanced/mover.md
        - docs/advanced/face-handler.md
        - docs/advanced/index.md

key-decisions:
    - B-03 / B-04 按注释与接口语义改写正文，源码与注释的差异按 D-72 只在对话中报告，不写进正文
    - 首轮 13 个非阻断项中与「照做会不会卡住」直接相关的（异常路径、`config` / `speed` / `animDir` 持久性、`push` 形状差异、`mapMovement` 的 `Unknown` 零偏移）全部落到正文，其余只记录
    - 迭代两轮即收敛（第 1 轮修 4 个阻断 + 13 个非阻断，第 2 轮复审再修 9 个非阻断），未触及 3 轮上限
    - 复审人格逐字沿用 10-19 已确认提示词，未复用 `10-11-READER-REVIEW.md` 的中级教程人格

patterns-established:
    - 读者审阅记录的结构：人格逐字 → 首轮清单（阻断 / 非阻断分类 + 文件章节定位）→ 每轮修复表 → 复审对照 → 结束标记 → 构建结论
    - 审阅对象包含「两篇在导览与侧边栏中的接入方式」，不只正文

requirements-completed: []

coverage:
    - id: D1
      description: 两篇补写内容完成独立读者审阅，首轮 4 个阻断问题全部消除，复审无遗留阻断项
      verification:
          - kind: other
            ref: '10-31-READER-REVIEW.md 的「复审收敛结论」表与结束标记「阻断性问题 = 0，审阅通过」'
            status: pass
      human_judgment: false
    - id: D2
      description: 两篇与导览仍可构建、无死链、CRLF 单 H1 无渲染端内容，D-75 要求的内容未被读者提问削掉
      verification:
          - kind: other
            ref: 'pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build（build complete in 14.31s，无 dead link）与 prettier --check'
            status: pass
      human_judgment: false
    - id: D3
      description: 目标读者「照着文档能排出一次移动、换一个朝向处理器、取到朝向图块」的可操作性
      verification: []
      human_judgment: true
      rationale: 可读性与「照做能否成功」是判断，只能由目标读者与用户主导的修订循环确认；自动化只能保证结构、链接与构建

duration: 约 35 分钟（跨两次会话）
completed: 2026-10-24
status: complete
---

# Phase 10 Plan 31: 高级 I 补写（Mover / FaceHandler）读者审阅 Summary

**用 10-19 已确认的高级 I 人格对 `mover.md` / `face-handler.md` 做独立读者审阅：首轮 4 个阻断问题（`start` 返回 `null` 的等待入口、勇士顶层实现契约、`setFaceDirection` 降级语义、`dirOf` 八方向特例）全部消除，复审再收 9 个非阻断项，最终阻断性问题 = 0。**

## Performance

- **Duration:** 约 35 分钟（跨两次会话：首轮修复 + 复审）
- **Started:** 2026-10-24（本会话）
- **Completed:** 2026-10-24
- **Tasks:** 4/4（Task 0 汇报关卡已获用户「可以执行」）
- **Files modified:** 3 篇文档 + 1 份审阅记录 + 本 SUMMARY

## Accomplishments

- 派发独立读者子代理（不与执行者共享上下文），逐字沿用 10-19 已确认的高级 I 人格提示词，通读两篇及其在导览 / 侧边栏中的接入方式，产出 4 个阻断 + 13 个非阻断问题清单，逐条定位到文件与章节。
- 4 个阻断问题全部在正文落地解决：
  - `start()` 返回 `null` 时没有新控制器，只能用上一次 `start()` 保存的 `controller` 等 `onEnd` 或 `stop()`，并写明 `IHeroMover` 没有 `stop()`。
  - 新增「勇士的顶层实现」：`IHeroMoveTopImpl` 六方法、`IHeroMoveTopHandler` 字段、与 `DefaultHeroMoveTopImpl` 的关系，以及包装默认实现的完整类。
  - `setFaceDirection` 按方法注释口径描述降级语义，并报告与实现的差异。
  - 正文不再断言 `Dir4` 只返回上下左右，`dirOf` 收敛为「实现特例，不能用于四方向判定」。
- 复审（第 2 轮）另提 9 个非阻断项并全部处理：`predicate()` / `IPassPredicate` 独立成节、`start()` 返回 `null` 时队列仍留在移动器、异常后无恢复路径、`prepareStep` 与受保护成员边界、自定义分组的键与 `const enum`、`dirOf` 内置特例统一口径、`cannotEnter(handler)` 签名、`@shouldReplay` 标记位置、导览主要主题补两篇。
- 结论记录为「阻断性问题 = 0，审阅通过」，并保留「未复用中级人格」标记与 D-72 三项源码 / 注释差异（只在对话中报告）。

## Task Commits

1. **Task 1 + Task 2（首轮）：记录读者问题清单并修复 4 个阻断项 + 13 个非阻断项** - `b243c51`（docs）
2. **Task 3（复审）：修复复审提出的 9 个非阻断项** - `73d1a04`（docs）

**Plan metadata:** 由 10-32 收尾提交统一带走（本 SUMMARY 与 10-32-SUMMARY 同一次提交）。

## Files Created/Modified

- `.planning/phases/10-docs-restructure/10-31-READER-REVIEW.md` — 人格逐字、首轮清单、两轮修复表、复审收敛结论、结束标记、构建结论
- `docs/advanced/mover.md` — 移动器模型细化、拿到移动器的三种来源、`predicate()` 与 `IPassPredicate`、异常路径与恢复边界、勇士顶层实现契约与示例、验证改为四步计划
- `docs/advanced/face-handler.md` — 朝向模型、`get` 泛型与分组键、`dirOf` 口径收敛、重复 `malloc` 与 `mapMovement` 的 `Unknown` 零偏移、六边形自定义示例的前置
- `docs/advanced/index.md` — 「目标双端覆盖、当前只写数据端」的统一表述，阅读路径与「读完这一层」补入两篇
- `.planning/phases/10-docs-restructure/10-31-SUMMARY.md` — 本执行总结

## Decisions Made

- **D-72 差异只报告不落正文**：`setFaceDirection` 降级分支未写回图块、`Dir4FaceHandler.dirOf` 遍历八方向表、`Dir8FaceHandler.degrade(999)` 返回 `999` 三处，按注释语义写正文，差异在审阅记录与对话中报告（后经 D-80 进一步要求正文不写实现差异）。
- **阻断性判定口径**：读者据此无法完成操作，或会对执行时序、状态归属、两层朝向模型产生实质误解；「最大非阻断缺口」（自定义 mover / handler 接进插件与真实对象的生命周期）留在非阻断组，不擅自扩为正文主题。
- **迭代未用满上限**：两轮收敛，第 1 轮修阻断、第 2 轮复审只余非阻断，未出现「阻断性问题余项：已交用户」的分支。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - 缺失关键说明] 复审时补 `predicate()` / `IPassPredicate` 独立一节**
- **Found during:** Task 3（复审）
- **Issue:** 原文只在顶层实现示例里顺带出现 `canPass` / `shouldHit`，读者不知道判定顺序、字段名与「寻路要单独注入谓词」。
- **Fix:** 新增「改通行规则：`predicate()` 与 `IPassPredicate`」，讲职责、`IPassCheckHandler` 字段、判定顺序、`ignoreTerrain` 的副作用与谓词实例稳定性。
- **Files modified:** `docs/advanced/mover.md`
- **Verification:** 构建 green、无死链；复审记录第 2 轮表格第 1 条
- **Committed in:** `73d1a04`

**2. [Rule 2 - 缺失关键说明] 异常路径与「无恢复入口」写进边界**
- **Found during:** Task 2 / Task 3
- **Issue:** 钩子或步进方法抛错后 `onEnd` 不兑现、`moving` 恒真、后续 `start()` 恒 `null`，读者会把「已经卡死」误当成「正在移动」。
- **Fix:** 「边界与注意」写明成因、后果与唯一处置（重建数据端），并建议把预期失败转成结果码。
- **Files modified:** `docs/advanced/mover.md`
- **Verification:** 复审记录第 2 轮表格第 3 条；构建 green
- **Committed in:** `73d1a04`

---

**Total deviations:** 2 auto-fixed（均属读者「照做会卡住」类，Rule 2）
**Impact on plan:** 都属于计划允许的「消除阻断 / 高危非阻断问题」，未扩大章节范围，未触碰 `config.ts` 与其它正文。

## Issues Encountered

- 本计划两次提交的区间内，`docs/advanced/ii/static-vs-dynamic-tiles.md` 有一笔链接改动（来自 10-30 的收口提交），不属于本计划的审阅对象。
- 工作区有与本计划无关的既有改动（`packages-user/*`、`src/client/*`、`.planning/.../09-*` 等），全程未暂存、未提交。

## User Setup Required

None - 无外部服务配置。

## Next Phase Readiness

- 阻断问题清零，10-32 可以进入用户主导的修订循环（D-46 第 2 阶段），不需要先回头补文档。
- 非阻断残项已在记录中保留，是否处理交给 10-32 的用户循环决定。
- 两篇在审阅后仍 kebab-case、CRLF、单 H1，构建 green、dead link = 0。

---

_Phase: 10-docs-restructure_
_Completed: 2026-10-24_

## Self-Check: PASSED

- 文件存在：`.planning/phases/10-docs-restructure/10-31-READER-REVIEW.md`、`docs/advanced/mover.md`、`docs/advanced/face-handler.md`、`docs/advanced/index.md`、`.planning/phases/10-docs-restructure/10-31-SUMMARY.md`
- 提交存在：`b243c51`（首轮修复）、`73d1a04`（复审修复）
- 门禁存在：REVIEW-OK（人格逐字 + 未复用中级人格）、阻断性问题 = 0、prettier unchanged、`build complete`、无 dead link
