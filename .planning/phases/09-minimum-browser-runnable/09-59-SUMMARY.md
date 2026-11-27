---
phase: 09-minimum-browser-runnable
plan: 59
subsystem: map-text
tags:
    - map-text
    - manager
    - block-attach
    - incremental
requires:
    - 09-58 map/mapText.tsx 的 IMapTextManager / IMapTextProps / MapText
    - 既有 map/extension/types.ts 的 IMapTextArea / IMapTextRenderable
    - 既有 map/types.ts 的 IBlockSplitter / IChunkData / IMapVertexBlock / IMapRenderer
provides:
    - MapTextManager（公开类，implements IMapTextManager，7 个公开成员）
    - MapTextArea（私有类，implements IMapTextArea，不导出）
affects:
    - packages-user/client-base/src/map/mapText.tsx
actuals:
    tokens: 2600
    tasks: 3
    commits: 0
tech-stack:
    patterns:
        - 管理器只持有 renderer.vertex.block，用 renderer.mapWidth 做索引换算
        - 分块附着数据用私有 Symbol 标识，值类型为 Map<number, MapTextArea>
        - 区域变更通过构造器注入的私有回调标脏，markDirty 不对外
key-files:
    modified:
        - packages-user/client-base/src/map/mapText.tsx
        - .planning/phases/09-minimum-browser-runnable/09-59-SUMMARY.md
key-decisions:
    - MapTextManager 与私有 MapTextArea 同置 map/mapText.tsx，插在 IMapTextManager 之后、IMapTextProps 之前
    - 只移植管理逻辑，画布 / 上下文 / 变换 / 尺寸 / 整体渲染职责全部移除
    - 判定与返回按 dev.md L120 / L124 改写：对象 truthy、数字 !isNil、结果变量 + 末尾单一 return
duration: 约 15 分钟
completed: 2026-11-10T21:23:27+08:00
status: complete
---

# Phase 09 Plan 59: 地图文字管理器 MapTextManager Summary

在 09-58 新建的 `map/mapText.tsx` 内补上管理器的实现：公开类 `MapTextManager implements IMapTextManager` 与私有类 `MapTextArea implements IMapTextArea`，只保留分块附着、索引换算、脏标记与清空等管理逻辑，与旧 `OnMapTextRenderer` 零依赖，不接线、0 提交。

## 本计划范围

`files_modified` 共 2 个路径，实际只写这 2 个：

- `packages-user/client-base/src/map/mapText.tsx`（整段替换 import 块 + 插入两个类）
- `.planning/phases/09-minimum-browser-runnable/09-59-SUMMARY.md`（本摘要）

本计划编号 09-59（09-01..09-58 已占用），`wave: 8`，`depends_on: 09-58`。Task 0 汇报关卡已由用户「可以执行」通过，本摘要记录 Task 1–2 的执行结果。不跑游戏 / 浏览器 / dev server，不执行 `pnpm install`，不执行 git 写命令，**0 次提交**。

## 要解决的问题

09-58 只落了 `IMapTextManager` 接口、`IMapTextProps` 与 `MapText` 组件，**没有任何实现**。仓库里唯一能提供这些管理方法的仍是旧的 `OnMapTextRenderer`——它同时持有画布、自己做 `resize` 与 `render`，是「数据管理 + 整屏画布渲染」的混合体，正是要放弃的对象。本计划按新接口独立写一个管理器，与旧实现零依赖；旧实现保持原样。

## 文件清单

| 文件 | 变更 |
|------|------|
| `packages-user/client-base/src/map/mapText.tsx` | import 块由 6 行整段替换为 13 行（新增 `logger` / `isNil` / 3 个分块类型）；在 `IMapTextManager` 之后、`IMapTextProps` 之前插入 `MapTextManager` 与私有 `MapTextArea`；113 行 → 317 行 |
| `.planning/phases/09-minimum-browser-runnable/09-59-SUMMARY.md` | 本摘要 |

## 新增命名

- 新增公开类 `MapTextManager`（`implements IMapTextManager`），是唯一新增公开 API。
- 新增私有类 `MapTextArea`（`implements IMapTextArea`，无 `export`），仅管理器内部使用。
- 新增私有成员（管理器）：`attachSymbol`、`dirty`、`block`、`markDirty()`、`getAttachedMap()`。
- 新增私有成员（区域）：`markDirty`、`renderableSet`、`renderableMap`、`reverseMap`、`nextRenderableIndex`。
- 新增 import：`isNil`（`lodash-es`）与 `IBlockSplitter` / `IChunkData` / `IMapVertexBlock`（均为 `./types` 既有导出）。
- 复用既有错误码 `logger.error(47)`，未新增错误码。
- 除 `MapTextManager` 外无新增公开 API；文件仅 4 条 `export`（`IMapTextManager` / `MapTextManager` / `IMapTextProps` / `MapText`）。

## 管理逻辑映射

- `requireBlockArea(x, y)`：与旧实现一致，`index = y * renderer.mapWidth + x`，用 `block.getChunkByElementIndex(index)` 找分块；命中时取 `getAttachedMap`，已有区域直接复用，否则 `new MapTextArea(index, x, y, () => this.markDirty())` 附着后标脏；分块缺失走 `logger.error(47)` 且结果保持 `null`。
- `getBlockByLoc(x, y)` / `getBlockByIndex(index)`：同样的索引换算与分块查找，从分块附着数据取 `Map<number, MapTextArea>`，取不到返回 `null`。
- `getRenderables(area)`：按 `area.index` 从分块附着数据取回具体私有区域，再返回其 `getRenderables()`；任一层缺失时返回空数组 `[]`。
- `needUpdate()` / `clear()` / `destroy()`：`needUpdate` 读 `dirty`；`clear` 遍历所有分块，清空各区域并 `deleteAttachedData(this.attachSymbol)`，最后标脏；`destroy` 仅调用 `clear`（旧实现里额外的 `transform.unbind` 已随变换职责移除）。
- `MapTextArea`：`index` / `mapX` / `mapY` 为只读字段；`addTextRenderable` / `removeTextRenderable` / `removeTextRenderableByIndex` / `clear` 每次实际变更后通过构造器拿到的私有回调 `markDirty()` 触发管理器标脏；`getRenderables()` 返回 `renderableSet`。

## 移除的渲染职责

新插入的两个类里**没有**画布、Canvas2D 上下文、变换矩阵、尺寸管理与整体渲染：不存在 `canvas` / `ctx` / `resize` / `render(` / `updateTransform` / `needResize`，也没有 `watch` / ticker / 定时器 / 事件订阅。新管理器只产出文字数据。

## dev.md 合规

- **L120（非空判断）**：对象用 `if (blockData)` / `if (map)` / `if (exist)` / `if (target)` / `if (obj)` / `if (!map)` 等 truthy 判断；数字用 `if (!isNil(idx))`；源码内不出现 `!== void 0` / `=== void 0`，并从 `lodash-es` 引入 `isNil`。
- **L124（条件与返回）**：所有方法都用「结果变量 + 末尾单一 `return`」，`if` 内只赋值 / 调用、不提前 `return`；`getAttachedMap` 用 `let map = ...; if (!map) { ... } return map;`；静态闸门确认管理器与区域区间内不存在缩进 ≥ 12 的 `return`。
- **L115（对象解构）**：未新增单字段对象解构；文件内仅保留 09-58 既有的两处多字段解构 `const { manager, renderer } = props;` 与 `const { renderWidth, renderHeight } = props.renderer;`，均不换行。

## 未改项

15 个只读路径逐一纳入哈希基线并断言路径集合完全相等、哈希未变：

1. `packages-user/client-base/src/map/index.ts`
2. `packages-user/client-base/src/map/extension/types.ts`
3. `packages-user/client-base/src/map/extension/text.ts`
4. `packages-user/client-base/src/map/extension/manager.ts`
5. `packages-user/client-base/src/map/extension/index.ts`
6. `packages-user/client-base/src/map/extension/door.ts`
7. `packages-user/client-base/src/map/extension/hero.ts`
8. `packages-user/client-base/src/map/element.ts`
9. `packages-user/client-base/src/map/viewport.ts`
10. `packages-user/client-base/src/map/renderer.ts`
11. `packages-user/client-base/src/map/types.ts`
12. `packages-user/client-base/src/components/index.ts`
13. `packages-user/client-base/src/elements/index.ts`
14. `src/client/ui/main.tsx`
15. `packages-user/client-modules/src/client.ts`

09-58 落在 `mapText.tsx` 内的 `IMapTextManager` / `IMapTextProps` / `mapTextProps` / `MapText` 与其中的注释、`// TODO:` 逐字未改。新管理器未接入任何 UI / 场景 / 元素（未接线），旧 `OnMapTextRenderer` 未删除。

## 门禁真实输出

- `prettier --check packages-user/client-base/src/map/mapText.tsx`：`All matched files use Prettier code style!`。
- `eslint packages-user/client-base/src/map/mapText.tsx`：退出码 0，无输出（0 error 0 warning）。
- 结构闸门：`OK: manager + private area present; 4 exports; no public markDirty; no void 0`（含 `!isNil(idx)` 与 `import { isNil } from 'lodash-es';`）。
- 提前返回 / 无渲染职责闸门：`OK: manager + area region has no early return and no rendering responsibilities`。
- 只读哈希闸门：`OK: 15 read-only paths match baseline exactly and are unchanged`（路径集合完全相等）。
- `HEAD` 闸门：`OK: HEAD unchanged 6c81872040059661a3225019101018fbf20d5362 | 6c81872 feat: 可动画贴图`，0 次提交。
- `git diff --check`（已跟踪树）：`OK: git diff --check reports no issue in mapText.tsx (status 0, 0 finding(s) elsewhere)`。
- `git diff --no-index --check -- /dev/null packages-user/client-base/src/map/mapText.tsx`（未跟踪文件实检）：无 `trailing whitespace` / `space before tab` / `leftover conflict marker`，输出 `OK`；该命令已用含行尾空白的探针文件验证确实生效（探针报 `trailing whitespace`）。
- CRLF / 无 tab / 无 BOM：`OK: mapText.tsx is CRLF, no tab, no BOM (317 lines)`。
- 未跟踪差分闸门：基线之外新增未跟踪路径仅 `09-59-SUMMARY.md`，无删除条目（基线 126 条，不断言整棵工作树干净）。
- SUMMARY 内容闸门：`OK: SUMMARY content, CRLF, no tab, no BOM`。

## 偏差

无。计划命令均按原样执行；源码写入仅落在 `files_modified` 的 2 个路径内；未触发行为或代码歧义，未发现计划命令缺陷。

## 未校准估算

`confidence: low`、`tokens: 28000`（3 个任务 / 28k 仅为 advisory 建议值，不作为拆分或阻断依据）。`actuals.tokens` 为 `mapText.tsx` 改动的粗略 chars/4 估算（约 2600），非精确计量。

## 可见跳过

spec-less probe fallback skipped: phase has no requirement IDs to probe (visible skip)。

## Self-Check: PASSED

- 已确认 `packages-user/client-base/src/map/mapText.tsx` 存在，含 `MapTextManager`（公开）与 `MapTextArea`（私有），恰好 4 条 `export`。
- 已确认管理器区域内无画布 / 上下文 / `resize` / `render(` / `updateTransform` / `needResize`，无缩进 ≥ 12 的 `return`。
- 已确认 15 个只读路径哈希与基线一致且路径集合完全相等。
- 已确认本 `09-59-SUMMARY.md` 通过内容 / CRLF / 无 BOM / 无 tab 门禁。
- 已确认 0 次提交，`HEAD` 保持 `6c81872040059661a3225019101018fbf20d5362`。
