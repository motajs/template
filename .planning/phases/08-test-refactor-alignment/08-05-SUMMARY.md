---
phase: 08-test-refactor-alignment
plan: 05
subsystem: data-base/map
tags: [test-alignment, map, d10-production-fix]
status: complete
requires:
  - 08-01
provides:
  - "data-base/map 子系统 11 个测试文件对齐 shipped 接口，聚焦 108/108 通过"
affects:
  - packages-user/data-base/src/map
tech-stack:
  added: []
  patterns:
    - "MapLayer.getMapData 子区域按请求宽高返回、越界补零"
    - "LayerEventView.reset 恢复参考基准并置纯"
    - "MapLayer.resize/resize2 同步 indexer 宽度并重索引点事件"
key-files:
  created:
    - .planning/phases/08-test-refactor-alignment/08-05-SUMMARY.md
  modified:
    - packages-user/data-base/src/map/mapLayer.ts
    - packages-user/data-base/src/map/eventView.ts
    - packages-user/data-base/src/map/tile.ts
    - packages-user/data-base/src/map/types.ts
    - packages-user/data-base/src/map/__test__/gameMap.test.ts
    - packages-user/data-base/src/map/__test__/mapState.test.ts
    - packages-user/data-base/src/map/__test__/mapLayer.test.ts
    - packages-user/data-base/src/map/__test__/mapLifecycle.test.ts
    - packages-user/data-base/src/map/__test__/eventPath.test.ts
    - packages-user/data-base/src/map/__test__/dynamicTile.test.ts
    - packages-user/data-base/src/map/__test__/tile.test.ts
    - packages-user/data-base/src/map/__test__/staticTile.test.ts
    - packages-user/data-base/src/map/__test__/saveLoad.test.ts
    - packages-user/data-base/src/map/__test__/mover.test.ts
decisions:
  - "Q1=A：陈旧码 62/63/64/84/130/125 按 shipped 改写/忽略，不补测、不改生产"
  - "Q2：addLayer(alias) 别名仅为名字，事件层须显式 setEventLayer"
  - "D-10 生产修复（经用户确认）：getMapData 子区域、toStatic 默认事件（公开 restoreDefaultEvents）、reset 纯度、resize2 清点事件、cropPointEvents 重索引、indexer 宽度同步"
completed: 2026-10-05
---

# 08-05 — data-base/map 测试对齐 Summary

**一句话：** 将 `packages-user/data-base` 的 `map` 子系统 11 个测试文件对齐 shipped 接口/形状，并按用户确认的 D-10 例外修复 `mapLayer.ts`/`eventView.ts` 生产回归、在 `tile.ts`/`types.ts` 公开 `MapTileBase.restoreDefaultEvents`，聚焦 **108/108 通过、eslint 0**。

## Task 0 裁决

- **Q1 = A**：62/63/64/84/130/125 当前源码无 emit 点，按 shipped 改写/忽略，不补测、不新增生产修复。
- **Q2**：`addLayer(alias)` 别名仅为名字，与事件层无关；事件层须显式 `setEventLayer(layer)`。
- **Q3**：无需夹具改动（`DYNAMIC_MOVER_FACE = FaceGroup.Dir8`，夹具已注册）。

## 生产改动（D-10 经用户确认；`mapLayer.ts`、`eventView.ts`、`tile.ts`、`types.ts`）

| 文件 | 位置 | 修复 |
|------|------|------|
| `map/tile.ts` | `restoreDefaultEvents()` | 可见性由 `protected` 改为 public，供外部调用者恢复默认事件 |
| `map/types.ts` | `ITileBase` | 新增 `restoreDefaultEvents(): void;` 声明（含 jsDoc） |
| `map/mapLayer.ts` | `getMapData(x,y,width,height)` | 结束下标 `lineStart + nw`（原用绝对 `nr`）；结果缓冲改回 `width * height`（原裁剪为 `nw*nh`），越界行补零。修复子区域取值与码 81 语义 |
| `map/mapLayer.ts` | `toStatic(tile, keepEvent)` | `keepEvent === false` 时对复用的静态图块调用新公开的 `restoreDefaultEvents()`，回退默认事件并建立干净基准；`keepEvent === true` 仍 `syncTileEvent` |
| `map/mapLayer.ts` | `cropPointEvents(oldWidth,width,height)` | 按旧宽解码旧索引、按新宽 `y*width+x` 重建；超出新范围者丢弃 |
| `map/mapLayer.ts` | `resize(width,height)` | 变更后 `this.indexer.setWidth(width)`，并以 `beforeWidth` 调 `cropPointEvents` |
| `map/mapLayer.ts` | `resize2(width,height)` | 尺寸不变提前 return 分支补 `this.pointEvents.clear()`；变更分支补 `this.indexer.setWidth(width)` |
| `map/mapLayer.ts` | `indexer` 字段 | 类型收敛为 `ILocationIndexer`（构造处一次 `as`），以在层内同步共享索引器步长；索引器类型改动收敛在层内，不改公开接口 |
| `map/eventView.ts` | `reset()` | 回填参考基准后置 `this.dirtyEntries = 0`，使 `dirty()` 恢复为 `false` |

> 生产改动为 `mapLayer.ts`、`eventView.ts`、`tile.ts`、`types.ts` 四个文件；其中 `tile.ts`/`types.ts` 仅将 `restoreDefaultEvents` 公开并声明到 `ITileBase`（`git status` 佐证）。

## 测试对齐改动（10 个文件）

- **通用**：删夹具 `DirectionMapper` 注入与 `@motajs/common` 导入；`new MapState(tileStore, state)` → `new MapState(state)`；`map.addLayer()` → `map.addLayer('<alias>')`、删 `setLayerAlias` 并把别名并入 `addLayer`，事件层仍 `setEventLayer`；删 `addHook({...}).load()` 的 `.load()`。
- **计划外按 shipped 一并对齐**：`IGameMap.getLayerByAlias`/`getLayerAlias`（亦随 `bbdea04` 删除）→ 改用 `IGameMap.layerList` + `IMapLayer.alias`（`gameMap.test.ts` 用 `GameMap.aliasLayerMap`）；`GameMap` 构造去掉 `tileStore` 形参；`layer.setDynamicDirection(tile,d)`（已删，原为薄包装）→ `tile.setFaceDirection(d)`。
- **陈旧码处置台账（Q1=A）**：

  | 码 | 处置 |
  |----|------|
  | 62/63/64 | `mapState.test.ts` 的 `it.each` 仅保留 shipped 的 60/61；`eventPath.test.ts` malformed 块改写为「非对象事件位容器 / 非字符串事件 id 被宽松接受」两用例（不新增 `it`） |
  | 84 | `gameMap.test.ts` 重写为「别名随加层绑定、可由 `aliasLayerMap` 取回」，删 84 断言 |
  | 130 | `mapLayer.test.ts` 重写为「重复删除非本层图块不告警」，断言 `.not.toContain(130)` |
  | 125 | map 测试无该断言，无操作 |

- **用户裁决的测试对齐**：`transferToDynamic(keepEvent=false)` 动态图块保留默认事件（`mapLayer.test.ts` 断言改为 `Map{10:'base-event'}`）；`setMapList` 不去重（`mapState.test.ts` 断言改为原样 `['A','B','A','C']`）。
- **本轮新暴露用例的测试对齐**：`mapLifecycle.test.ts` 在直接 `transferToDynamic(1,0)` 前补 `layer.getTile(1,0)`（与 `StaticTile.toDynamic` 及 `mapLayer.test.ts` 既有用法一致，先物化静态图块），使 keepEvent=true 往返保留默认事件；**未改生产**。
- 未新增 `it.skip`；每个 `it` 保留一行中文注释；未删用例、未弱化其它断言。

## 门禁证据

- **聚焦运行**：`pnpm exec vitest run packages-user/data-base/src/map/__test__` → **Test Files 11 passed（11）；Tests 108 passed（108）**（0 failed）。
- **eslint**：`pnpm exec eslint --fix` + `pnpm exec eslint`（`mapLayer.ts`、`eventView.ts`、`tile.ts`、`types.ts`、`map/__test__`）→ **0 报错**。
- **生产改动范围**：`git status` 下 `map/**` 仅 `eventView.ts`、`mapLayer.ts`、`tile.ts`、`types.ts` 四个生产文件 + 10 个 `__test__/*.ts`；此外无其它生产改动。
- **skip 计数**：未新增 skip；仓库唯一 skip 仍为 `hero/equipment.test.ts` 码 147。

## 备注（供知悉）

- `transferToDynamic` 在直接调用且该格静态图块尚未物化时，因实现先 `setBlock(0)` 再 `getTile`，动态图块会以空事件被同步（默认事件被覆盖）；经用户 Q3 风格确认「不改该生产方法」，本次以测试补 `getTile` 前置物化对齐。如需改为「无论是否物化均保留默认事件」，可另行授权最小生产修复。

## Deviations from Plan

- **D-10 生产修复（经用户确认）**：`getMapData`/`toStatic`/`cropPointEvents`/`resize`/`resize2`/eventView `reset`，并将 `MapTileBase.restoreDefaultEvents` 公开并声明到 `ITileBase`（`toStatic` 改用它而非 `loadState({})`）——超出「零生产改动」默认，属用户逐条授权的例外。
- **计划外一并对齐（Rule 1/F）**：`getLayerByAlias`/`getLayerAlias` 删除、`GameMap` 构造签名、`setDynamicDirection` 删除——均随同一轮重构发生，按「对齐 shipped」处理。
- **新暴露用例**：`mapLifecycle` 的 `transferToDynamic(1,0)` 断言原被前排失败遮蔽；按「不改 transferToDynamic 生产」以测试前置物化对齐。
