---
phase: 10-docs-restructure
plan: 21
subsystem: docs
tags: [vitepress, documentation, advanced-ii, range, map-tiles, events]

# Dependency graph
requires: []
provides:
  - "docs/advanced/ii/custom-range.md: IRange/IRangeHost/BaseRange 职责、内置范围参数、可复用 RingRange 自定义范围、上下文与地图伤害接入、验证与边界"
  - "docs/advanced/ii/static-vs-dynamic-tiles.md: IStaticTile/IDynamicTile 分工、创建获取、双向转换与 keepEvent、点事件/图块事件对照、ILayerEventView、失败条件与验证"
  - "高级 II 其余篇目可直接引用的范围与图块事件公共说明"
affects:
  - 10-22 .. 10-25（装备、录像、寻路、属性与怪物上下文篇目引用范围/图块事件）
  - 10-26 / 10-27（读者审阅与用户主导修订）

# Actuals (#2632) — chars/4 over the realized diff.
actuals:
  tokens: 5274
  tasks: 2
  commits: 2
  plan_head_before: f04919a

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "高级 II 文档按库文档写：先问题与概念，再完整可运行示例，最后接入点、验证与边界"
    - "范围示例同时给出接口参数与完整类实现，并用同一套判定保证 iterateLoc / inRange 一致"

key-files:
  created:
    - docs/advanced/ii/custom-range.md
    - docs/advanced/ii/static-vs-dynamic-tiles.md
  modified: []

key-decisions:
  - "自定义范围示例选用曼哈顿距离恰好等于 radius 的 RingRange，便于对照内置 ManhattanRange 的包含关系"
  - "图块篇把点事件与图块事件单独成节，并用对照表固定「点事件属于坐标、图块事件属于实例」的归属"
  - "keepEvent 按源码语义写明：默认 true 时复制源实例的图块事件，false 时目标按图块定义重建默认事件"
  - "只写数据端；渲染端、编辑器与状态栏不进入正文，高级 III 内容只用文字占位"
  - "未修改 docs/.vitepress/config.ts，侧边栏注册留给 10-25"

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "custom-range.md 讲清 IRange / IRangeHost / BaseRange 职责、内置范围与参数、完整 RingRange 自定义范围、绑定到怪物上下文与地图伤害的方式、验证与边界"
    verification:
      - kind: other
        ref: "Task 1 static gate -> RANGE-OK; cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete, no dead link"
        status: pass
    human_judgment: true
    rationale: "D-09 要求用户人工审阅；示例是否可读、范围语义是否符合预期无法完全自动化"
  - id: D2
    description: "static-vs-dynamic-tiles.md 讲清静态/动态图块分工、创建获取、双向转换与 keepEvent、点事件与图块事件归属、事件视图接口、转换失败条件、验证与边界"
    verification:
      - kind: other
        ref: "Task 2 static gate -> TILE-OK; cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete, no dead link"
        status: pass
    human_judgment: true
    rationale: "D-09 要求用户人工审阅；事件归属与转换语义的表述需要人工对照源码确认"

# Metrics
duration: 15min
completed: 2026-10-21
status: complete
---

# Phase 10 Plan 21: 高级 II 基础篇（范围与图块）Summary

**新增 `custom-range.md` 与 `static-vs-dynamic-tiles.md` 两篇高级 II 基础文档：范围篇给出可复用的环形范围完整实现并接入怪物上下文与地图伤害，图块篇讲清静态/动态双向转换、`keepEvent` 语义，并单独成节区分点事件与图块事件。**

## Performance

- **Duration:** 约 15 min
- **Completed:** 2026-10-21
- **Tasks:** 2（Task 0 审批门禁已由用户「直接批准执行所有计划」预先通过）
- **Files created:** 2
- **Build gate:** `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → `build complete`，无 dead link

## Accomplishments

- 新建 `docs/advanced/ii/custom-range.md`：说明 `IRange` 解决什么问题、`IRangeHost` 只提供宽高、`bindHost` / `inBound` 的边界职责、`iterateLoc` / `inRange` / `scan` / `iterate` / `autoDetect` 的分工与复杂度选型。
- 范围篇列出 `FullRange`、`RectRange`、`ManhattanRange`、`RayRange`、`NoneRange` 及各自参数，并给出完整 `IRingRangeParam` + `RingRange` 类；注释解释 `estimatePointCount` 只服务选型、`iterateLoc` 必须与 `inRange` 同源。
- 范围篇给出 `state.enemyContext.scanRange(...)` 的完整调用示例与 `bindHost` 显式注入宿主的 `collectRing` 函数，并说明地图伤害/光环由系统绑定宿主，不重复中级教程。
- 新建 `docs/advanced/ii/static-vs-dynamic-tiles.md`：讲清静态图块是图层数组的一格、动态图块是带 `mover` 的独立实例，以及 `num()` / `raw()` / `locator` / `layer` 的共同点。
- 图块篇覆盖 `getTile`、`createDynamic`、`transferToDynamic`、`iterateDynamicTiles`、`getDynamicTilesAt`，以及 `toDynamic` / `toStatic` / `toStaticIfSafe` / `moveBlock` 与 `keepEvent` 的默认值和语义。
- 图块篇单独成节说明点事件与图块事件的归属、获取方式、是否跟随图块移动与典型用途，并给出 `IReadonlyEventView` / `ILayerEventView` 的 `get` / `ref` / `dirty` / `set` / `delete` / `reset` / `clear` / `markPure` 说明。
- 两篇均包含「怎么验证」段，给出可执行调用、预期现象与边界注意事项；全部代码块为完整类或函数。

## Task Commits

Each task was committed atomically:

1. **Task 1: 编写自定义范围对象 custom-range.md** - `44dccc8` (docs)
2. **Task 2: 编写静态图块与动态图块 static-vs-dynamic-tiles.md** - `84e56d7` (docs)

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified

- `docs/advanced/ii/custom-range.md` - 范围对象职责、宿主、内置范围、RingRange 自定义范围、系统接入、验证与边界
- `docs/advanced/ii/static-vs-dynamic-tiles.md` - 静态/动态图块分工、创建获取、双向转换、点事件/图块事件、事件视图、失败条件、验证与边界

## Decisions Made

- 自定义范围示例采用「曼哈顿距离恰好等于半径」的环形，与内置 `ManhattanRange` 的「距离不超过半径」形成直接对照，便于读者理解 `inRange` 的边界写法。
- `RingRange` 的 `radius` 统一取绝对值，并明确 `radius: 0` 退化为中心单点，使 `estimatePointCount`、`iterateLoc`、`inRange` 三处行为一致。
- 图块事件与点事件单独成节，用对照表固定归属；`tile.pointEvent()` 被说明为「按当前 locator 取坐标事件」，避免读者误以为动态图块会带走点事件。
- `keepEvent` 按源码语义写明默认 `true`、复制源事件、源位置事件清空，以及 `false` 时目标回到图块默认事件；不把默认事件回退描述成事件丢失。
- 严格限定数据端内容，未写入 `src/client` 路径、渲染端实现或编辑器/状态栏细节；未修改 `docs/.vitepress/config.ts`。

## Deviations from Plan

### Process Notes

**1. 修改方式由「派发子代理」调整为「内联执行」**
- **Found during:** 执行开始
- **Issue:** 计划 Task 0 声明本计划的修改方式为派发子代理，但当前执行器环境没有可供本执行器调用的子代理派发工具。
- **Fix:** 由执行器内联创建两篇新文档；范围仍严格限定为 `files_modified` 列出的两篇，不修改配置、生产代码或既有注释。
- **Verification:** `git show --stat 44dccc8` 与 `git show --stat 84e56d7` 均只包含目标文档。
- **Impact:** 无内容或范围影响；仅执行载体不同。

**2. Task 0 审批门禁按用户批量批准处理**
- **Found during:** 执行开始
- **Issue:** 计划要求先汇报九篇文件名、侧边栏分组名与读者人格并等待「可以执行」。
- **Fix:** 用户已明确「直接批准执行所有计划」，并批准了批量文件名、侧边栏分组名「高级 II · 深入定制」与 D-68 读者人格，故未重复停机。
- **Verification:** 执行上下文 `<approval_gate_cleared>` 明确记录该批准。
- **Impact:** 无；Task 0 的命名基线保持不变。

## Issues Encountered

None.

- 源码核对时确认 `transferToDynamic` 的 `keepEvent` 默认值为 `true`，`transferToStatic` / `toStaticIfSafe` 同样默认 `true`；文档按此写明，未沿用「默认不保留」的常见误解。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 高级 II 的范围与图块两篇基础文档已就位，10-22 起的装备、录像、寻路、属性与怪物上下文篇目可以直接引用。
- 两篇尚未接入侧边栏，`docs/.vitepress/config.ts` 保持原样；10-25 负责导览与侧边栏注册。
- 构建已通过且无死链；内容可读性与语义仍需 10-26 读者审阅、10-27 用户主导修订确认。
- 按本次任务要求，未更新 `STATE.md` 与 `ROADMAP.md`。

---

*Phase: 10-docs-restructure*
*Completed: 2026-10-21*

## Self-Check: PASSED

- `docs/advanced/ii/custom-range.md` — FOUND
- `docs/advanced/ii/static-vs-dynamic-tiles.md` — FOUND
- Commit `44dccc8` — FOUND
- Commit `84e56d7` — FOUND
- Task 1 gate `RANGE-OK` — PASSED
- Task 2 gate `TILE-OK` — PASSED
- Build `build complete`, dead link = 0 — PASSED
- Commits measured: `git rev-list --count f04919a..HEAD` = 2
