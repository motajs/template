---
phase: 10-docs-restructure
plan: 17
subsystem: docs
tags: [vitepress, documentation, hooks, identity, map-layer, async, data-engine]

# Dependency graph
requires:
  - phase: 10-docs-restructure
    provides: "中级教程的钩子基础与地图结构，以及 10-13 的「声明规则、引擎在合适时机执行」模型"
provides:
  - "docs/advanced/hooks-in-depth.md（高级 I 第六篇）"
affects: ["10-18"]

actuals:
  tokens: 4277
  tasks: 2
  commits: 2
  plan_head_before: bd46e5c2f4845dde6dfd42b19ca129d12abbe649

tech-stack:
  added: []
  patterns:
    - "身份校验按钩子族分两类：无身份参数用每对象实例，有身份参数用共享实例 + === 比较"
    - "注册/移除按源码事实讲：addHook 返回控制器、removeHook 按引用、awake 在 loadedList 之前"
    - "异步钩子按实际调用路径描述 Promise.all，不把「声明为异步」写成「所有路径都等待」"
    - "通用模板单独成节，地图与图层各给一个短示例"

key-files:
  created:
    - docs/advanced/hooks-in-depth.md
  modified: []

key-decisions:
  - "图层钩子没有 layer 参数，身份由「实例注册在哪个图层上」固定；不做回调内比较"
  - "地图级 onResizeLayer 共享实例时用 targetLayer 引用比较，明确不用 alias 判断身份"
  - "同一实例重复 addHook 写成行为事实与应避免的用法，不写成引擎缺陷"
  - "异步清单只列已核对源码的钩子族，并补充 toStatic 的 onDeleteDynamic 不等待返回值"
  - "高级 II/III 内容用代码 span 与 HTML 注释占位，不写真实链接"

patterns-established:
  - "钩子身份：做法 A 每对象一个实例（readonly layer），做法 B 共享实例（targetLayer + ===）"
  - "钩子实操六步：模板与示例分开，示例含注册、触发验证与移除验证"
  - "源码核对优先：forEachHook 顺序、addHook 去重行为、异步等待方式均按当前实现描述"

requirements-completed: []

coverage:
  - id: D1
    description: "高级 I 第六篇：钩子深入（多对象身份、两种身份校验、跨对象复用、注册移除、异步时序、模板与两个示例）"
    verification:
      - kind: other
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete, dead link = 0"
        status: pass
    human_judgment: true
    rationale: "文档质量需用户人工审阅（D-46 第 2 阶段），自动化只能验证构建与链接"
---

# Phase 10 Plan 17: 钩子深入 Summary

**高级 I 第六篇落地：从「钩子挂在实例上」讲到多对象身份校验的两种做法、跨对象复用、注册/移除与重复注册，以及异步钩子的 Promise.all 并发等待，并给出可复制模板与地图/图层两个示例**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-10-20T04:43:00Z
- **Completed:** 2026-10-20T05:08:00Z
- **Tasks:** 2
- **Files modified:** 1 created

## Accomplishments

- 新建 `docs/advanced/hooks-in-depth.md`（单 H1、CRLF、数据端 only），承接中级 `hooks.md` 与 `map-structure.md`。
- 讲清钩子挂在实例上而不是类上：同一类可以 `new` 出多个实例，地图、图层、移动器各有独立钩子列表。
- 用一张表列出各钩子族能拿到的身份：`IMapLayerHooks` 多数方法没有 layer 参数，`IGameMapHooks.onResizeLayer` 回传 layer，`IObjectMoverHooks` 回传 tile 与 mover，`IHeroLocationHooks.onSetFloor` 回传 map。
- 给出两种身份校验做法：每层一个实例并保存 `readonly layer`；共享实例并在回调里比较 `targetLayer` / `map` / `tile` / `info.target`。明确 `IMapLayerHooks` 的 `onResize`、`onUpdateBlock` 等不能用共享比较。
- 讲清共享 vs 每对象实例的边界，并提醒共享实例不要保存「当前对象」，否则异步交错会覆盖。
- 按源码讲注册与移除：`addHook` 返回控制器、`awake` 在加入已加载列表之前、`removeHook` 需要原实例、`controller.unload()`、`destroy` 在移除时调用、`forEachHook` 顺序不保证、同一实例重复注册会被多次调用且旧控制器残留。
- 按源码列出异步钩子族与 `Promise.all` 等待方式，明确完成顺序不等于注册顺序；补充 `toStatic` 触发的 `onDeleteDynamic` 不等待返回值。
- 独立「模板：一个带身份校验的钩子」小节；「只处理指定图层」与「地图级钩子里筛图层」两个示例均含注册、触发验证与移除验证。
- 明确「不懂代码优先改内置」，并把新系统引向插件；给出七条常见错误与四项验证步骤。
- prettier 通过；`pnpm docs:build` 输出 `build complete`，无 dead link。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写 hooks-in-depth.md 正文** - `e074c73` (docs)
2. **Task 2: 源码核对、格式与构建收口** - `5109d32` (docs)

**Plan metadata:** `docs(10-17): complete hooks-in-depth plan`（本 SUMMARY 的提交）

## Files Created/Modified

- `docs/advanced/hooks-in-depth.md` - 高级 I 第六篇：钩子身份校验、跨对象复用、注册移除与异步时序

## Decisions Made

- 身份校验分两类：没有身份参数的钩子必须每对象一个实例；有身份参数的钩子才共享实例并用 `===` 比较。
- 地图级 `onResizeLayer` 用 `targetLayer` 引用比较；不用 `alias`，因为 alias 只是查找名，可能重名或被覆盖。
- 重复 `addHook` 按行为事实描述：不去重、会多次调用、旧控制器留在内部映射；不写成引擎缺陷。
- 异步钩子只列已核对源码的家族，并按实际调用路径说明 `Promise.all`；`toStatic` 的 `onDeleteDynamic` 不等待这一点单独注明。
- 高级 II/III 的内容用代码 span 与 HTML 注释占位，不写真实链接。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 修正了计划模板里不存在的 layer 参数比较**

- **Found during:** Task 1（编写正文）
- **Issue:** 计划建议在 `IMapLayerHooks` 的回调开头写 `if (layer !== this.layer) return`，但 `onResize` / `onUpdateBlock` 等方法并不接收 layer 参数，照写会引用不存在的变量。
- **Fix:** 模板改为「每层一个实例，身份由注册对象固定」；只在会回传 `tile` 的动态图块方法里用 `tile.layer !== this.layer` 做额外校验。
- **Files modified:** `docs/advanced/hooks-in-depth.md`
- **Verification:** 静态结构检查通过；构建通过。
- **Committed in:** `e074c73`（Task 1 提交）

---

**Total deviations:** 1 auto-fixed (1 bug)

**Impact on plan:** 修正的是计划文本中的错误示例，未扩大范围；文档其余内容按计划执行。

## Issues Encountered

- 构建门禁运行 `pnpm exec` 时，pnpm 自动改写了 `pnpm-lock.yaml`（移除了 `@user/entry-client` / `@user/entry-data` 的 importer 链接）。该文件与本计划无关，已用 `git checkout -- pnpm-lock.yaml` 还原，未纳入提交。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `docs/advanced/hooks-in-depth.md` 已完成，可作为 10-18 及后续高级 II/III 钩子内容的入口。
- 高级 II/III 的占位仍保留为代码 span 与 HTML 注释，待相应文档落地后再替换为真实链接。
- 用户主导的修订循环（D-46 第 2 阶段 / D-57）尚未开始，文档质量仍需用户审阅。

---

*Phase: 10-docs-restructure*
*Completed: 2026-10-20*

## Self-Check: PASSED

- `docs/advanced/hooks-in-depth.md` 存在。
- `.planning/phases/10-docs-restructure/10-17-SUMMARY.md` 存在。
- Task 提交 `e074c73`、`5109d32` 均存在。
