---
phase: 10-docs-restructure
plan: 10
subsystem: docs
tags: [vitepress, markdown, tutorial, beginner-friendly, guided-writing]

requires:
  - phase: 10-docs-restructure
    provides: 10-07 建立的「state 从哪来」口径与 data-state-overview / hero-attribute 引导式写法；10-02/10-03 写就的基础接口组原始版本
provides:
  - 基础接口组 6 篇（hero-items / hero-equipment / hero-location / map-structure / map-tiles / flags）的引导式、入门友好重写
affects: [docs/intermediate 基础接口组, 后续 D-09 人工复审]

actuals:
  tokens: 1338
  tasks: 3
  commits: 3
  plan_head_before: ef8cd06

tech-stack:
  added: []
  patterns:
    - "引导式文档：先给使用场景与直觉，再引出接口清单与示例（Vue 文档风格）"

key-files:
  created: []
  modified:
    - docs/intermediate/hero-items.md
    - docs/intermediate/hero-equipment.md
    - docs/intermediate/hero-location.md
    - docs/intermediate/map-structure.md
    - docs/intermediate/map-tiles.md
    - docs/intermediate/flags.md

key-decisions:
  - "只改讲法、不缩减 D-27..D-32 的内容范围：接口、字段与示例全部保留，仅补入引导式开篇与过渡"
  - "hero-items 用「背包里能放哪些东西」引导并突出四类道具的差别；hero-equipment 用「装备是特殊的道具」引导并区分装备槽与实例仓库"
  - "hero-location 用「很多逻辑要知道勇士站在哪」引导且只讲获取；map-structure 用「地图不是一张大图而是分层的」引导并强调事件层本质是图层"
  - "map-tiles 用「摆一格/擦一格/整片读写该找谁」引导；flags 用「跨事件跨楼层还要跟存档走的状态放哪」引导"
  - "未越界：hero-equipment 不讲排序器；hero-location 不展开移动/切层；map-tiles 的 getLocationData 仅一句带过留高级"

patterns-established:
  - "基础接口组引导式开篇：每篇以一句读者视角的场景问句起头，再进入接口清单"

requirements-completed: []

coverage:
  - id: D1
    description: "hero-items / hero-equipment 两篇引导式重写，保留四类道具、常用接口、autoUnload 与实例仓库，不讲排序器"
    verification:
      - kind: automated_ui
        ref: "pnpm docs:build — build complete"
        status: pass
      - kind: other
        ref: "static check: hero-items 含 Consumable、hero-equipment 含 autoUnload、CRLF、单 H1"
        status: pass
    human_judgment: true
    rationale: "文档为人工审阅产物（D-09），引导式是否达标、内容是否齐全需人眼判断"
  - id: D2
    description: "hero-location / map-structure 两篇引导式重写，保留只讲获取与三层结构（事件层归本篇）"
    verification:
      - kind: automated_ui
        ref: "pnpm docs:build — build complete"
        status: pass
      - kind: other
        ref: "static check: hero-location 含 floorId、map-structure 含 eventLayer、CRLF、单 H1"
        status: pass
    human_judgment: true
    rationale: "同上，引导式写作质量需人工复审"
  - id: D3
    description: "map-tiles / flags 两篇引导式重写，保留六接口（getLocationData 留高级）与 flags 全部接口含 occupied"
    verification:
      - kind: automated_ui
        ref: "pnpm docs:build — build complete"
        status: pass
      - kind: other
        ref: "static check: map-tiles 含 iterateBlocks、flags 含 getOrInsertComputed 与 occupied、CRLF、单 H1"
        status: pass
    human_judgment: true
    rationale: "同上，引导式写作质量需人工复审"

duration: 18min
completed: 2026-10-17
status: complete
---

# Phase 10 Plan 10: 基础接口组引导式重写 Summary

**基础接口组 6 篇（hero-items / hero-equipment / hero-location / map-structure / map-tiles / flags）由接口罗列改为「先给场景、再给接口」的引导式书写，锁定要点与示例全部保留，构建通过、无 dead link。**

## Performance

- **Duration:** 18 min
- **Started:** 2026-10-17T00:00:00Z
- **Completed:** 2026-10-17T00:18:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- 6 篇基础接口组统一改为引导式：每篇以读者视角的场景问句起头，再引出接口清单、字段与示例（finding 5）。
- D-27..D-32 锁定内容零缩减：四类道具、`addItem`/`useItem`/`iterateItems` 等；装备槽 + 实例仓库 + `compareEquip`；位置与楼层获取；三层地图结构（事件层归本篇）；图块六接口；Flag 全部接口含 `occupied`。
- 越界项均守住：装备排序器不讲、位置移动/切层不展开、`getLocationData` 仅一句带过留高级。
- `pnpm docs:build` 通过（build complete in 13.37s），无 dead link、无 import 错误。

## Task Commits

Each task was committed atomically:

1. **Task 1: 引导式重写 hero-items 与 hero-equipment** - `b4d1202` (docs)
2. **Task 2: 引导式重写 hero-location 与 map-structure** - `3836afe` (docs)
3. **Task 3: 引导式重写 map-tiles 与 flags** - `5be78db` (docs)

**Plan metadata:** (pending — SUMMARY commit)

## Files Created/Modified

- `docs/intermediate/hero-items.md` - 背包场景引导 + 四类道具 + 常用接口 + 迭代 + 效果属内容层
- `docs/intermediate/hero-equipment.md` - 装备槽 vs 实例仓库引导 + 加成（修饰器）+ `compareEquip`（不讲排序器）
- `docs/intermediate/hero-location.md` - 只讲获取坐标/朝向/楼层（`floorId`/`map`）
- `docs/intermediate/map-structure.md` - 楼层集合 → 楼层 → 图层三层引导（事件层归本篇）
- `docs/intermediate/map-tiles.md` - 单点/批量/迭代六接口（`getLocationData` 留高级）
- `docs/intermediate/flags.md` - 跨事件跨楼层可存档变量引导 + 全部接口含 `occupied`

## Decisions Made

- 只改讲法、不改接口事实与内容范围：接口名/字段名逐一核对 `packages-user/data-base` 与 `data-common` 源码（`ItemCategory`、`IItemEffect`、`IHeroEquipment`、`IHeroEquipsStore`、`IHeroLocation`、`IMapState`/`IGameMap`/`IMapLayer`/`ILayerStatic`、`IFlagSystem`）。
- 引导式开篇按每篇主题定制场景问句（背包 / 装备 / 站位 / 分层 / 摆格 / 存档状态），避免同质化模板。
- 跳转链接控制在 2–5 处/篇，仅指向已存在的中级页（`hero-equipment`、`hero-attribute`、`hero-items`、`map-structure`、`map-tiles`、`hero-location`、`data-state-overview`、`hooks`）。

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 基础接口组引导式重写完成，构建转绿；D-09 人工复审可覆盖本组 6 篇。
- 本计划仅改 `docs/intermediate/*.md` 六个文件，未触碰 `config.ts` 与生产代码。

---
*Phase: 10-docs-restructure*
*Completed: 2026-10-17*

## Self-Check: PASSED

- FOUND: docs/intermediate/hero-items.md
- FOUND: docs/intermediate/hero-equipment.md
- FOUND: docs/intermediate/hero-location.md
- FOUND: docs/intermediate/map-structure.md
- FOUND: docs/intermediate/map-tiles.md
- FOUND: docs/intermediate/flags.md
- FOUND: .planning/phases/10-docs-restructure/10-10-SUMMARY.md
- FOUND: b4d1202
- FOUND: 3836afe
- FOUND: 5be78db
