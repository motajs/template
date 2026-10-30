---
phase: 10-docs-restructure
plan: 03
subsystem: docs
tags: [vitepress, markdown, intermediate-tutorial, interface-manual]

# Dependency graph
requires:
  - phase: 10-docs-restructure
    provides: "10-01 删除旧内容并注册 intermediate 侧边栏；10-02 写就概念与导航组 4 篇（含 hooks.md，本篇回指目标）"
provides:
  - "基础接口组 8 篇中级教程：data-state-overview / hero-attribute / hero-items / hero-equipment / hero-location / map-structure / map-tiles / flags"
affects: [10-docs-restructure]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 3362
  tasks: 3
  commits: 3
  plan_head_before: 0348c30893d067b0b03859fd818f6d6d348cb81c

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "VitePress 页面：单 H1 + 引言 + ## 小节 + ts 代码块 + 表格"
    - "markdown 文件名 kebab-case + CRLF 换行"

key-files:
  created:
    - docs/intermediate/data-state-overview.md
    - docs/intermediate/hero-attribute.md
    - docs/intermediate/hero-items.md
    - docs/intermediate/hero-equipment.md
    - docs/intermediate/hero-location.md
    - docs/intermediate/map-structure.md
    - docs/intermediate/map-tiles.md
    - docs/intermediate/flags.md
  modified: []

key-decisions:
  - "接口名/字段名一律按当前源码 file:line 逐字核对（RESEARCH Pitfall 5）：如 IMapState.maps 实为 ReadonlyArray<string>（楼层 id 列表），hero.location 朝向经 getCurrentFaceDirection() / getLocation().direction 获取"
  - "组内互链 + 回指已写就的 ./hooks.md，不链接尚未写就的战斗/其他组页面，保证构建期无 dead link"
  - "map-tiles 按 D-31『只讲六个常用接口』，getLocationData 不展开（不在正文提及），避免 D-16 元叙述"
  - "无外链（T-10-08）、无内联 HTML/script（T-10-07）、仅用源码已公开接口（T-10-09）"

patterns-established:
  - "基础接口手册骨架：接口清单（表格/列表）+ how-to 代码块 + 回指相关篇目"
  - "装备加成 = 属性修饰器（ValueModifier/PercentageModifier）的同一机制表述"

requirements-completed: []

coverage:
  - id: D1
    description: "data-state-overview：state 入口、常用对象表与 L0–L3 轻量分层标注"
    requirement: ""
    verification: []
    human_judgment: true
    rationale: "内容正确性需用户人工审阅（D-09）；自动化仅覆盖构建与结构（CRLF/单 H1/关键词）"
  - id: D2
    description: "hero-attribute：基础/最终属性、修饰器、save 语义、只读与试算，回指 hooks"
    requirement: ""
    verification: []
    human_judgment: true
    rationale: "内容正确性需用户人工审阅（D-09）"
  - id: D3
    description: "hero-items：四种类别区分与 addItem/useItem/iterateItems/itemCount 等接口"
    requirement: ""
    verification: []
    human_judgment: true
    rationale: "内容正确性需用户人工审阅（D-09）"
  - id: D4
    description: "hero-equipment：装备槽与实例仓库、装备加成即修饰器、compareEquip"
    requirement: ""
    verification: []
    human_judgment: true
    rationale: "内容正确性需用户人工审阅（D-09）"
  - id: D5
    description: "hero-location：坐标、朝向与楼层的获取"
    requirement: ""
    verification: []
    human_judgment: true
    rationale: "内容正确性需用户人工审阅（D-09）"
  - id: D6
    description: "map-structure：楼层集合、楼层激活、楼层与图层（含事件层）"
    requirement: ""
    verification: []
    human_judgment: true
    rationale: "内容正确性需用户人工审阅（D-09）"
  - id: D7
    description: "map-tiles：getBlock/setBlock/removeBlock/putMapData/getMapData/iterateBlocks"
    requirement: ""
    verification: []
    human_judgment: true
    rationale: "内容正确性需用户人工审阅（D-09）"
  - id: D8
    description: "flags：全部接口（含 occupied/getOrInsertComputed）与使用建议"
    requirement: ""
    verification: []
    human_judgment: true
    rationale: "内容正确性需用户人工审阅（D-09）"

duration: 3min
completed: 2026-10-17
status: complete
---

# Phase 10 Plan 03: 基础接口组 8 篇 Summary

**中级教程「基础接口」组 8 篇落位：以 state 为入口的顶层接口手册（勇士属性/道具/装备/位置、地图结构/图块、Flag），接口名逐字对齐当前源码，站点构建通过且无 dead link。**

## Performance

- **Duration:** ~3min（以本计划首个到末个提交计）
- **Started:** 2026-10-17T10:00:04Z
- **Completed:** 2026-10-17T10:03:17Z
- **Tasks:** 3
- **Files modified:** 8（全部新增）

## Accomplishments

- 新增 `docs/intermediate/` 下基础接口组 8 篇：`data-state-overview`、`hero-attribute`、`hero-items`、`hero-equipment`、`hero-location`、`map-structure`、`map-tiles`、`flags`。
- `data-state-overview` 以表列常用对象与获取方式（含 `getDataPlugin(id)`、`emitTip(...)`），并按 L0–L3 轻量分组标注，置于本组最前。
- `hero-attribute` 讲基础/最终属性、`ValueModifier`/`PercentageModifier`、`addModifier`/`deleteModifier`、`save` 语义（用 `:::warning` 表达读档一致性），并回指 `./hooks.md`。
- `map-structure` 含楼层激活与事件层（`eventLayer` 本质即图层）；`map-tiles` 只讲六个常用接口；`flags` 覆盖全部接口（含 `occupied`、`getOrInsertComputed`）。
- 计划级构建门禁通过：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → `build complete`，exit 0，无 dead-link 报错。

## Task Commits

Each task was committed atomically:

1. **Task 1: data-state-overview、hero-attribute、hero-items** - `627a40b` (docs)
2. **Task 2: hero-equipment、hero-location、map-structure** - `0d14d32` (docs)
3. **Task 3: map-tiles 与 flags** - `a3f5511` (docs)

**Plan metadata:** 本 SUMMARY 提交（docs: complete plan）

## Files Created/Modified

- `docs/intermediate/data-state-overview.md` - state 入口、常用对象表、L0–L3 分层标注
- `docs/intermediate/hero-attribute.md` - 基础/最终属性、修饰器、save 语义、只读与试算
- `docs/intermediate/hero-items.md` - 四种类别区分与背包接口、道具效果属内容层
- `docs/intermediate/hero-equipment.md` - 装备槽与实例仓库、装备加成即修饰器、compareEquip
- `docs/intermediate/hero-location.md` - 坐标、朝向、楼层的获取
- `docs/intermediate/map-structure.md` - 楼层集合、楼层激活、楼层与图层（含事件层）
- `docs/intermediate/map-tiles.md` - 图块读取/写入/批量/迭代
- `docs/intermediate/flags.md` - Flag 全部接口与使用建议

## Decisions Made

- 接口名/字段名一律按当前源码 `file:line` 逐字核对：例如 `IMapState.maps` 实为 `ReadonlyArray<string>`（楼层 id 有序数组），而非对象映射；`hero.location` 的朝向经 `getCurrentFaceDirection()` / `hero.getLocation().direction` 获取（`IHeroLocation` 本身无 `direction` 属性）。
- 仅做组内互链 + 回指已写就的 `./hooks.md`，不链接尚未写就的战斗/其他组页面，确保构建期无 dead link。
- `map-tiles` 依 D-31「只讲六个常用接口」，`getLocationData` 不展开且不在正文提及，避免 D-16 元叙述。
- 装备加成按源码表述为属性修饰器（`getValue`/`setValue` 即维护 `ValueModifier`/`PercentageModifier`）。

## Deviations from Plan

None - plan executed exactly as written.

（说明：三段任务在 PLAN 中标注 `tdd="true"`，但本计划为纯文档产出——无生产代码、无测试，RED/GREEN/REFACTOR 循环不适用；此处记录以澄清，非行为偏离。）

## Issues Encountered

None. 构建门禁一次通过；无 dead link、无格式门禁拦截。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 基础接口组 8 篇已就绪，可作为战斗组（9 篇）与其他组（3 篇）回指的「已写就页面」。
- 战斗组/其他组尚未写就前，本组不得链接它们（已遵守）。
- 待用户在后续派发中执行战斗组/其他组写作时，`docs/intermediate/` 侧边栏条目已在 10-01 注册，链接可解析。

---
*Phase: 10-docs-restructure*
*Completed: 2026-10-17*

## Self-Check: PASSED

- 8 篇 `docs/intermediate/*.md` 与 `10-03-SUMMARY.md` 均存在。
- 提交 `627a40b`、`0d14d32`、`a3f5511` 均存在。
