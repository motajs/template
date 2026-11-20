---
phase: 09-minimum-browser-runnable
plan: 51
subsystem: map-rendering
tags: [typescript, webgl2, map-renderer, overlay-block, static-layer]
requires: []
provides:
  - "地图渲染收敛为「静态层 + 唯一 OverlayBlock 覆盖层」两层模型"
  - "IOverlayBlock 增加 readonly index / toStatic / 显式 setAlpha"
  - "静态 alpha < 1 自动提升、覆盖层 alpha 1 不降级、toStatic 写回静态格"
  - "moving.ts 退化为注释参考，渲染器删除全部移动图块公开面"
affects: [09-minimum-browser-runnable, client-base/map]
actuals:
  # chars/4 上限值（含本计划执行前工作树中已存在的用户改动，未做提交因而无可分离的基线快照）
  tokens: 27949
  tasks: 2
  commits: 0
tech-stack:
  added: []
  patterns:
    - "静态图块半透明时提升为覆盖层槽位，覆盖层回到不透明也不降级"
    - "覆盖层集合 + 索引映射 + 索引池统一管理覆盖块生命周期"
    - "toStatic 先写回静态实例再释放覆盖层索引"
key-files:
  created: []
  modified:
    - packages-user/client-base/src/map/types.ts
    - packages-user/client-base/src/map/status.ts
    - packages-user/client-base/src/map/moving.ts
    - packages-user/client-base/src/map/vertex.ts
    - packages-user/client-base/src/map/renderer.ts
    - packages-user/client-base/src/map/__test__/rendererGate.test.ts
key-decisions:
  - "覆盖层只保留一个具体类 OverlayBlock，删除 DynamicBlockStatus / StaticOverlayBlock"
  - "静态 alpha 严格小于 1 自动提升；覆盖层 alpha 恰好为 1 不降级"
  - "toStatic 忠实拷贝 16 个浮点，地图数据由调用方维护"
patterns-established:
  - "提升表 promotedBlocks 与渲染器覆盖层集合是两套结构，删除覆盖块时同步清理"
requirements-completed: []
duration: 14min
completed: 2026-11-06
status: complete
---

# Phase 9 Plan 51: 地图渲染收敛为静态层与唯一 OverlayBlock 覆盖层

**删除静态 / 动态 / 移动三套历史抽象，把覆盖层收敛为唯一的 `OverlayBlock`；静态 alpha 小于 1 自动提升、覆盖层 alpha 为 1 不降级、`toStatic` 先写回静态格再释放覆盖槽位。**

## Performance

- **Duration:** 约 14 min
- **Started:** 2026-11-06T17:52:48Z
- **Completed:** 2026-11-06T18:06:57Z
- **Tasks:** 2 个执行任务（Task 0 为已获「可以执行」的汇报关卡）
- **Files modified:** 6（5 个源码 + 1 个测试），另有本 SUMMARY

## Accomplishments

- `OverlayBlock` 成为唯一覆盖层具体类；`IOverlayBlock` 增加 `readonly index` 与 `toStatic` 并显式重声明不降级的 `setAlpha`。
- 静态图块 `alpha < 1` 自动提升：申请覆盖层索引、拷贝 16 浮点、清零静态矩形、登记提升表；`alpha >= 1` 只写静态槽位；已提升块无论 alpha 都只写覆盖层槽位，没有自动降级。
- `toStatic` 把覆盖层槽位写回目标静态实例、按目标格重算矩形位置与 z，最后删除覆盖块并释放索引。
- `moving.ts` 退化为纯注释参考，`renderer.ts` 用覆盖层集合 / 索引映射 / 索引池取代移动图块机制，`tick` 不再步进图块。

## 逐文件前后形态

| 文件 | 执行前 | 执行后 |
|------|--------|--------|
| `types.ts` | `IOverlayBlock` 无 `index` / `toStatic`；存在 `IOverlayStaticBlock`；`IMapRenderer` 无 `createOverlayBlock`；`IMapVertexGenerator` 无低层 `toStatic` | `IOverlayBlock` 增 `readonly index` / `toStatic` / 显式 `setAlpha`；删除 `IOverlayStaticBlock`；`IRenderBlockMover` 原样保留；`IMapRenderer.createOverlayBlock`；`IMapVertexGenerator.toStatic` |
| `status.ts` | `StaticBlockStatus` + `DynamicBlockStatus` + `OverlayBlock` + `StaticOverlayBlock` | 仅 `StaticBlockStatus`（逐字不动）+ 唯一 `OverlayBlock implements IOverlayBlock`（`layer` / `priority` / `index` / `renderer` / `texture` / `tile` / `x` / `y`；alpha 与帧数走动态槽位；`destroy` / `toStatic` 委托渲染器） |
| `moving.ts` | `IMovingRenderer` / `MovingBlock` 可执行声明，引用已删除的 `IMovingBlock` | 全文件逐行 `//` 注释；无可执行 `import` / `export` / 类声明；五个移动方法原样保留 |
| `renderer.ts` | 移动图块集合 / `addMovingBlock` / `deleteMoving` / `hasMoving`；`tick` 步进移动 | 覆盖层集合 / 映射 / 池；五个公开覆盖层方法 + `createOverlayBlock`；删除全部移动公开面；`tick` 保留背景帧 / 地图帧 / tickers |
| `vertex.ts` | `alphaMap` 延迟 flush + `overlayStatic` 静态记录；排序 / 组装含静态-动态 `instanceof` 分支 | 单表排序 / 组装；`promotedBlocks` 提升表；提升 / 写静态 alpha / 帧数转发 / 低层 `toStatic`；静态更新刷新提升槽位、空格删除提升块 |
| `rendererGate.test.ts` | 断言旧符号（`MovingBlock` / `DynamicBlockStatus` / `StaticOverlayBlock` / `alphaMap` / `overlayStatic` 等） | 断言单类覆盖层、提升 / 不降级 / `toStatic`、覆盖层集合与索引池、`tick` 无步进、`moving.ts` 无可执行导出，保留全部渲染管线守护 |

### 整体删除的符号

`DynamicBlockStatus`、`StaticOverlayBlock`、`IOverlayStaticBlock`、`IMovingBlock`、`IMovingRenderer`、`MovingBlock`、`IOverlayStaticRecord`、`OVERLAY_ALPHA_THRESHOLD`、`isOverlayAlpha`、`alphaMap`、`overlayStatic`、`flushPendingAlpha`、`getOverlayStaticRecord`、`deleteOverlayStaticRecord`、`addMovingBlock`、`deleteMoving`、`hasMoving`、`expandMoving` / `reduceMoving` / `requireMovingIndex` / `returnMovingIndex`（改为覆盖层同名风格）。

### 新增的符号

`IOverlayBlock.index`、`IOverlayBlock.toStatic`、`IOverlayBlock.setAlpha`（重声明）、`IMapRenderer.createOverlayBlock`、`IMapVertexGenerator.toStatic`、`OverlayBlock` 的 `index` / `tile` / `toStatic`、`MapRenderer.createOverlayBlock` / `addOverlayBlock` / `getOverlayBlocks` / `getOverlayBlockByIndex` / `deleteOverlayBlock` / `deleteOverlayBlockByIndex`、`expandOverlay` / `reduceOverlay` / `requireOverlayIndex` / `returnOverlayIndex`、`promotedBlocks` / `getPromotedBlock` / `setPromotedBlock` / `deletePromotedBlock` / `deletePromotedBlockByValue` / `promoteStaticBlock` / `writeStaticAlpha` / `toStatic`。

## 提升 / 不降级 / `toStatic` 的最终语义与生命周期

- **提升（未提升格，`alpha < 1`）**：`createOverlayBlock(layer, 0, tile, num)` 分配覆盖层索引 → `setPos` → 把静态实例 16 个浮点整体拷入覆盖层槽位 → 覆盖第 10 个浮点为 alpha → 把静态实例前 4 个矩形浮点清零 → 标脏分块 → 登记提升表 → 置 `dynamicRenderDirty` / `overlayOrderDirty` / `overlayValueDirty` 并 `requestUpdate`。
- **不提升（未提升格，`alpha >= 1`）**：`writeStaticAlpha` 只写静态实例第 10 个浮点并标脏分块。
- **不降级（已提升格，任意 alpha）**：只调用 `promoted.setAlpha(alpha)` 写覆盖层槽位；不删除覆盖块、不恢复静态矩形。
- **静态格后续更新**：`updateTileVertex` 在三个掩码块写完后按同一掩码把位置 / z、纹理 / 帧数同步到覆盖层槽位并再次清零静态矩形，**不触碰 alpha**；源格被更新为空图块时由 `updateVertexArray` 删除提升块并释放槽位。
- **`toStatic`**：`getIndexInBlock` 定位目标静态实例 → 拷贝 16 浮点 → 按归一化位移平移矩形位置 → 按静态公式重算 z → 标脏分块 → `deleteOverlayBlock(block)` 释放索引并移除提升登记；目标格不存在时直接返回。地图图块数据由调用方维护（external owns map data）。

## 未改动清单

渲染管线（两遍式绘制、深度掩码、`blendFuncSeparate`、FBO / 深度附件 / ping-pong / postEffect、覆盖层缓冲上传与绘制）、分块张量 `[chunk][layer][tile]` 与 `mallocVertexArray`、`getBlockStatus` / `StaticBlockStatus`、`viewport.ts` 的动态尾部合并、`chunk.ts`、`shader/map.frag` 的 `0.004`、`element.ts`、`index.ts`、`constant.ts`、`extension/*`、依赖与配置均未改动。

## 门禁真实结果

1. **vitest**：`node node_modules/vitest/vitest.mjs run packages-user/client-base/src/map/__test__/rendererGate.test.ts` → `Test Files 1 passed (1)`，`Tests 42 passed (42)`，退出码 0。
2. **eslint**：对 6 个文件运行 `node node_modules/eslint/bin/eslint.js ...` → 无任何输出，`exit=0`（0 error / 0 warning）。
3. **类型闸门**：`vue-tsc --noEmit` 真正完成（status 2 且有 `error TS` 输出，完成性守卫生效）→ `status 2 scoped 2 allowed 2 unexpected 0 forbidden 0`。两条既有豁免原文：
   - `ALLOWED: packages-user/client-base/src/map/renderer.ts TS2724 '"./types"' has no exported member named 'IMapRendererTicker'. Did you mean 'IMapRenderer'?`
   - `ALLOWED: packages-user/client-base/src/map/renderer.ts TS2339 Property 'getLayerByAlias' does not exist on type 'IGameMap'.`
   `types.ts` / `status.ts` / `moving.ts` / `vertex.ts` 均 0 条；`extension/*` / `element.ts` 由文件过滤排除。
4. **范围闸门**：`want 12 got 12`，与 Task 1 采集的 `git status --porcelain -uall -- packages-user/client-base/src/map` 集合逐条相等（未使用 `.trim()`）。
5. **哈希闸门**：9 个范围外文件与 Task 1 采集值逐字相等（`chunk.ts 783e7b9…`、`viewport.ts e2a74c5…`、`shader/map.frag 5d14944…`、`extension/hero.ts 091ea23…`、`extension/door.ts fc93e17…`、`extension/text.ts 6e669dd…`、`index.ts 25c1602…`、`element.ts bc9e9d9…`、`constant.ts d29a817…`），退出码 0。
6. **CRLF 闸门**：6 个代码 / 测试文件全为 CRLF。

**实际用例条数：42**（全部通过，未删除用例凑数）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `toStatic` 只平移位置浮点，未平移尺寸浮点**
- **Found during:** Task 1（`vertex.ts`）
- **Issue:** 计划文字为「平移前 4 个矩形浮点」，但 `map.vert` 中 `a_tilePos.xy` 是位置、`a_tilePos.zw` 是尺寸；平移目标格只能移动 `.xy`，同时移动 `.zw` 会改变图块大小。
- **Fix:** 只对索引 0 加 `dx`、索引 1 减 `dy`，索引 2 / 3 保持原尺寸。
- **Verification:** 类型闸门通过；`toStatic` 形状断言通过。
- **Committed in:** 未提交（按用户要求留在工作树）

**2. [Rule 3 - Blocking] 提升槽位刷新改用分块查找标脏**
- **Found during:** Task 1 类型闸门
- **Issue:** `updateTileVertex` 的参数类型 `IndexedBlockMapPos` 不含 `block`，直接 `index.block.data.markRenderDirty()` 报 `TS2339`。
- **Fix:** 通过 `this.block.getChunkByElementLoc(index.mapX, index.mapY)` 取得分块后 `data.markRenderDirty()`。
- **Verification:** 类型闸门 `unexpected 0`；形状断言通过。
- **Committed in:** 未提交

**3. [Rule 1 - Bug] 覆盖层日志不再读取 `tile`**
- **Found during:** Task 1 类型闸门
- **Issue:** `IOverlayBlock` 不声明 `tile`（按计划 `tile` 只是 `OverlayBlock` 成员），`logger.error(40, block.tile.toString())` 报 `TS2339`。
- **Fix:** 改为 `logger.error(40, block.index.toString())`。
- **Verification:** 类型闸门通过。
- **Committed in:** 未提交

**4. [Rule 1 - Bug] 随删除代码一并删除的既有注释**
- **Found during:** Task 1
- **Issue:** `tick` 的「图块移动」段与其注释、`getStaticAlpha` 的 flush 注释、`flushPendingAlpha` / 静态记录类等注释都属于被整体删除的实现。
- **Fix:** 随对应代码一并删除；其余既有注释逐字保留。
- **Verification:** 见 OI-3。
- **Committed in:** 未提交

---

**Total deviations:** 3 auto-fixed（Rule 1 ×2、Rule 3 ×1），另有 1 项注释随删除代码处理。
**Impact on plan:** 均为编译正确性或渲染正确性所必需，无范围扩大；未触碰任何范围外文件。

## Open Items（沿用计划编号）

- **OI-1 最终命名**：`IMapRenderer.createOverlayBlock(layer, priority, texture, tile)`、`IMapVertexGenerator.toStatic(block, layer, x, y)`、`OverlayBlock(layer, priority, index, texture, tile, renderer)`、渲染器私有 `overlayBlocks` / `overlayIndexMap` / `overlayIndexPool` / `overlayCount` / `expandOverlay` / `reduceOverlay` / `requireOverlayIndex` / `returnOverlayIndex`、私有 `promoteStaticBlock` / `writeStaticAlpha` / `getPromotedBlock` / `setPromotedBlock` / `deletePromotedBlock` / `deletePromotedBlockByValue`。`tile` 仅作为 `OverlayBlock` 类成员。
- **OI-2 语义边界**：`toStatic` 忠实拷贝 alpha；若写回后仍小于 1，调用方需自行再提升或先置 1。`toStatic` 不修改地图数据。`checkRebuild` / `setBlockSize` 只清空提升表，渲染器覆盖块集合保持不变。
- **OI-3 旧注释未改**：`sortOverlay` 的 `kind` 措辞、`assembleOverlay` 的静态矩形描述、`expandOverlay` / `reduceOverlay` 的「移动图块」措辞、`status.ts` 的「覆盖层图块」分区标题、`sortOverlay` 内静态 / 动态内联注释、`tick` 的「移动数组」注释均逐字保留。
- **OI-4 范围外类型错误保留**：`extension/hero.ts`、`extension/door.ts`、`element.ts` 仍引用已删除的移动图块 API 与缺失接口；本计划不修，类型闸门按文件过滤。
- **OI-5 `setPos` TODO 保留**：`OverlayBlock.setPos` 内的 `// TODO: 通知更新` 原样保留。

## 声明

- **不做浏览器 UAT、不宣称任何 WebGL E2E**；源码形状、编译与静态闸门通过不等于渲染结果已验证，当前游戏不可运行。
- **估算未校准**（计划 `confidence: low`），`actuals.tokens` 为 chars/4 上限值，包含执行前工作树中已存在的用户改动。
- **0 次代码提交**：未运行任何 `git add` / `commit` / `stash` / `checkout` / `restore` / `worktree` / `reset`；6 个文件改动全部留在主工作树供审查。
- **未更新 `STATE.md` / `ROADMAP.md`**（按用户要求）。
- **编号说明**：`09-27`..`09-50` 的计划与摘要已占用编号，本计划使用 `09-51` / 波次 31，不删除、不覆盖任何既有记录。
- **范围外错误不修**：`extension/hero.ts` / `extension/door.ts` / `element.ts` 的报错保持现状。

## Task Commits

None — 用户明确要求不提交任何代码，改动全部留在工作树（0 commits）。

## Self-Check: PASSED

- 6 个计划文件均存在并已改写。
- 五类自动化门禁均以真实输出通过：vitest 42/42、eslint 0、类型闸门仅 2 条既有豁免、范围 12/12、哈希 9/9、CRLF 全通过。
- 未提交任何代码，未更新 `STATE.md` / `ROADMAP.md`。
