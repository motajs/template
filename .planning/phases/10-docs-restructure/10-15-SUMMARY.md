---
phase: 10-docs-restructure
plan: 15
subsystem: docs
tags: [vitepress, documentation, saveable, structured-clone, save-compression, data-engine]

# Dependency graph
requires:
  - phase: 10-docs-restructure
    provides: "10-14 的插件系统与 awake 注册约定、中级教程的 Flag 变量与数据插件基础"
provides:
  - "docs/advanced/saveable-content.md（高级 I 第三篇）"
affects: ["10-16"]

actuals:
  tokens: 4449
  tasks: 2
  commits: 2
  plan_head_before: 8c1e5cf8400f7ae46763742eb8a1dd6e735172fb

tech-stack:
  added: []
  patterns:
    - "先讲存档一致性（该存/不该存），再讲接口、约束、注册、压缩与顺序"
    - "通用模板单独成节，计数器只作插件示例，不作为模板"
    - "执行器时机按源码描述：对象 loadState 后立即运行，不等待全部对象"
    - "跨对象引用给三种策略，并按注册顺序说明各自适用场景"
    - "加粗改用 HTML strong，规避 D-52 flanking 问题"

key-files:
  created:
    - docs/advanced/saveable-content.md
  modified: []

key-decisions:
  - "存档一致性以「读档后能否从别处算回来」为唯一判断标准，缓存/派生数据与 L2 系统不进存档"
  - "saveState 必须返回 structuredClone 后的数据；类实例读档时重新 new，不直接使用普通对象"
  - "三级压缩只改变存储方式，不改变结果；三档都必须能被自己的 loadState 读回"
  - "执行器在该对象 loadState 后立即运行，且不被录像禁用包裹；插件 afterLoad 只跑初次加载一次"
  - "跨对象引用存 id/键，按注册顺序、执行器延后或惰性解析；不存活对象引用"
  - "高级 II/III 内容用代码 span 占位，不产生真实链接"
  - "明确「不懂代码优先改内置的 saveState / loadState」，并给出 D-49.3 原句"

patterns-established:
  - "可存档实操：模板骨架 + 插件计数器示例 + 六项验证"
  - "存档顺序：注册顺序即遍历顺序，引用者放在被引用者之后"
  - "structuredClone 支持/不支持类型分表，类实例丢原型单独强调"

requirements-completed: []

coverage:
  - id: D1
    description: "高级 I 第三篇：可存档内容（一致性、ISaveableContent、三级压缩、注册、存档顺序与执行器、跨对象引用、structuredClone 约束、模板与示例）"
    verification:
      - kind: other
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete, dead link = 0"
        status: pass
    human_judgment: true
    rationale: "文档质量需用户人工审阅（D-46 第 2 阶段），自动化只能验证构建与链接"
---

# Phase 10 Plan 15: 可存档内容 Summary

**高级 I 第三篇落地：从存档一致性讲到 `ISaveableContent`、三级压缩、注册与去重、存档顺序与执行器时机、跨对象引用与 structuredClone 约束，并给出可复制骨架、插件计数器示例与六项验证**

## Performance

- **Duration:** ~23 min
- **Started:** 2026-10-20T05:12:00Z
- **Completed:** 2026-10-20T05:35:00Z
- **Tasks:** 2
- **Files modified:** 1 created

## Accomplishments

- 新建 `docs/advanced/saveable-content.md`（单 H1、CRLF、数据端 only），承接 10-14 的插件 `awake` 注册约定与中级 `flags.md`。
- 把存档一致性讲成可操作规范：以「读档后能否从别处算回来」判断该不该存，列出必须存与不该存的状态，并说明漏存/多存各自的表现。
- 按 `data-common` 源码讲 `ISaveableContent<T>` 与 `SaveCompression`：`T` 是存档形状，`saveState` 必须返回 `structuredClone` 后的数据，`loadState` 清空并重建。
- 分表列出 structuredClone 支持与不支持的类型，明确类实例会丢原型与方法、活对象引用不能进存档。
- 讲清注册：`addSaveableContent`、id 唯一性、重复 id 告警 `112` 且后一个被忽略、`getSaveableContent` 返回 `null`，并列出五个内置存档 id。
- 三级压缩以地图图层为例说明 No/Low/High 各自存什么，强调三档都必须能被自己的 `loadState` 读回且不改变语义。
- 按 `CoreState` 源码讲存档顺序与执行器：注册顺序即遍历顺序；缺键 `177`、多键 `178`；执行器在对象 `loadState` 后立即运行，且不被录像禁用包裹。
- 用表格区分插件 `afterLoad` 与执行器 `afterLoad`，明确插件 `afterLoad` 不能替代读档钩子。
- 跨对象引用给出三种策略（先注册被引用者、执行器延后解析、惰性解析），并解释为什么直接存对象会丢身份。
- 独立「模板：一个可存档对象的最小骨架」小节（`[模板]` / `[需改]`）；插件计数器示例使用获批的 `@plugin/example-counter`、`add` / `get`、`values`。
- 明确「不懂代码建议直接改内置，而不是自己写新的类」，并给出六项可操作的验证步骤与常见错误清单。
- prettier 通过；`pnpm docs:build` 输出 `build complete`，无 dead link。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写 saveable-content.md 正文** - `bf18d4b` (docs)
2. **Task 2: 源码核对、格式与构建收口** - `c1589ec` (docs)

**Plan metadata:** `docs(10-15): complete saveable-content plan`（本 SUMMARY 的提交）

## Files Created/Modified

- `docs/advanced/saveable-content.md` - 可存档内容高级教程：一致性、接口、structuredClone、注册、三级压缩、顺序与执行器、跨对象引用、模板与示例

## Decisions Made

- 一致性判断用「能否算回来」而不是「重不重要」，避免读者把缓存也当成需要保存的状态。
- 明确「注册顺序即遍历顺序」，并把跨对象引用的三种策略与注册顺序绑定，避免执行器被误当成全局读档完成钩子。
- 执行器时机的表述严格按源码：在该对象 `loadState` 后立即运行，不等待其余对象；录像禁用只包裹 `loadState`。
- 三级压缩用图层「完整矩阵 / 参考数组 / 行差分」解释，同时声明自定义对象三档同实现也可接受。
- 模板与示例严格分开：模板是 Map 字段的最小骨架，计数器只演示插件注册与恢复。
- 注册时机改为「awake 最早、最可控」，不声称晚注册无法生效，避免与源码不符。

## Deviations from Plan

None - plan executed exactly as written.

（Task 2 源码核对时补充了读档开始清理录像禁用标记的细节，并修正注册时机表述；两处均在 Task 2 提交前完成，未产生计划外提交。）

## Issues Encountered

- 构建仅出现 Vite 的 chunk 体积警告，不影响 `build complete`；无 dead link。
- 仓库中 `pnpm-lock.yaml` 在本次执行前已有未提交修改，未纳入本计划的任何提交。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 10-16（录像一致性）可直接引用本篇的「读档期间录像被临时禁用、执行器不被包裹」。
- 可存档内容与插件系统的交叉引用已打通，读者可从 `data-plugins.md` → `plugin-system.md` → 本篇连续阅读。
- 待用户按 D-46 第 2 阶段做人工审阅。

## Self-Check: PASSED

- `docs/advanced/saveable-content.md` exists.
- `bf18d4b`, `c1589ec` exist in git history.
- Static gate: `STATIC-OK`; build gate: `build complete`, dead link = 0.

---

_Phase: 10-docs-restructure_
_Completed: 2026-10-20_
