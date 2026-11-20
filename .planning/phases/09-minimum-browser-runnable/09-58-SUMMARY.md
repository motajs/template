---
phase: 09-minimum-browser-runnable
plan: 58
subsystem: map-text
tags:
    - map-text
    - render-vue
    - custom-element
    - self-transform
    - incremental
requires:
    - 09-57 render-anim parse logger 去参数化与 logger.json error 82..96
    - 既有 map/extension 文字领域模型（IMapTextArea / IMapTextRenderable）
provides:
    - IMapTextManager（6 个管理成员 + getRenderables）
    - IMapTextProps（extends DefaultProps，manager / renderer）
    - MapText 组件（单 custom + selfTransform + 地图坐标绘制）
    - map/index.ts 一行 `export * from './mapText';`
affects:
    - packages-user/client-base/src/map/mapText.tsx
    - packages-user/client-base/src/map/index.ts
actuals:
    tokens: 1214
    tasks: 3
    commits: 0
tech-stack:
    patterns:
        - 单个 <custom> 开启 selfTransform，盒子取 renderer.renderWidth / renderHeight
        - 回调内按未变换的地图坐标直接绘制，不手动套用任何矩阵
        - 可见分块 → 格子 → 文字区域 → 可渲染对象 的四级枚举
key-files:
    created:
        - packages-user/client-base/src/map/mapText.tsx
    modified:
        - packages-user/client-base/src/map/index.ts
        - .planning/phases/09-minimum-browser-runnable/09-58-SUMMARY.md
key-decisions:
    - IMapTextManager / IMapTextProps / MapText 三样同置 map/mapText.tsx，遵循用户位置指令，偏离 dev.md L101
    - 更新机制不接线，仅保留一条 TODO，依赖 <custom> 自身缓存
    - 盒子固定为地图渲染尺寸且不施加 transform，变换由 selfTransform 在元素内部应用到内容
duration: 约 10 分钟
completed: 2026-11-10T20:33:19+08:00
status: complete
---

# Phase 09 Plan 58: 地图文字组件 MapText Summary

新增自包含的 `map/mapText.tsx`，用单个带 `selfTransform` 的 `<custom>` 按地图坐标绘制 `IMapTextManager` 提供的文字，并在 `map/index.ts` 追加一行导出，为后续接入地图渲染元素准备好管理接口、props 契约与绘制组件。

## 本计划范围

`files_modified` 共 3 个路径，实际只写这 3 个：

- `packages-user/client-base/src/map/mapText.tsx`（新建）
- `packages-user/client-base/src/map/index.ts`（一行导出）
- `.planning/phases/09-minimum-browser-runnable/09-58-SUMMARY.md`（本摘要）

本计划编号为 09-58（09-01..09-57 已占用），`wave: 7`，`depends_on: []`。Task 0 汇报关卡已由用户「可以执行」通过，本摘要记录 Task 1–2 的执行结果。只写上述路径；不跑游戏 / 浏览器 / dev server / `pnpm install`；不执行 git 写命令，**0 次提交**。

## 文件清单

| 文件 | 变更 |
|------|------|
| `packages-user/client-base/src/map/mapText.tsx` | 新建，含 `IMapTextManager`、`IMapTextProps`、`MapText` 三个导出与非导出常量 `mapTextProps` |
| `packages-user/client-base/src/map/index.ts` | 在 `./element` 与 `./moving` 之间插入一行 `export * from './mapText';`，导出由 10 行变为 11 行 |
| `.planning/phases/09-minimum-browser-runnable/09-58-SUMMARY.md` | 本摘要 |

## 新增命名

- 新增公开接口 `IMapTextManager`（含 `getRenderables`）。
- 新增公开接口 `IMapTextProps`（`extends DefaultProps`）。
- 新增公开组件 `MapText`。
- 新增非导出模块常量 `mapTextProps`（仅本文件可见，对齐 `thumbnailProps` / `progressProps` 既有写法）。
- 除以上四项外无其它导出，未新增 `MapTextProps` 等别名；未新增测试。

## 接口与 props

`IMapTextManager` 共 7 个成员：`requireBlockArea(x, y)`、`getBlockByLoc(x, y)`、`getBlockByIndex(index)`、`getRenderables(area)`、`needUpdate()`、`clear()`、`destroy()`。其中 `getRenderables(area: Readonly<IMapTextArea>): Iterable<IMapTextRenderable>` 为本次新增，是组件枚举文字的唯一入口；接口不含画布尺寸与整体渲染成员，签名与旧 `IOnMapTextRenderer` 的管理部分保持一致。

`IMapTextProps extends DefaultProps`，成员为 `manager: IMapTextManager` 与 `renderer: IMapRenderer`；`mapTextProps` 的 `props` 列表为 `['manager', 'renderer']`，与两个必填成员一一对应。

## 组件做法

- 只输出一个 `<custom>`，写成裸布尔 `selfTransform`；只给 `loc={[0, 0, renderWidth, renderHeight]}`，尺寸取自 `props.renderer`，即与地图渲染器同尺寸；盒子不施加 `transform` 属性。
- 回调内按地图坐标直接绘制，**不手动套用任何变换**：文件中没有 `ctx.transform(` / `ctx.setTransform(` / `ctx.translate(` / `ctx.rotate(` / `ctx.scale(`，也没有 `scale(1, -1)` / `scale(-1, 1)`。变换由 `selfTransform` 在元素内部应用到自定义缓存。
- 坐标口径为左上角 `(0, 0)`、x 右、y 下：`baseX = area.mapX * renderer.cellWidth`、`baseY = area.mapY * renderer.cellHeight`、`x = baseX + (renderable.px ?? 0)`、`y = baseY + (renderable.py ?? 0)`。
- 空格子用 `if (area) { ... }` 正向分支跳过，不使用 `if (!area)` 早退；先画 `stroke` 再画 `fill`，`font` / `textAlign` / `textBaseline` / `strokeStyle` / `fillStyle` 语义与旧实现一致；`ctx.lineWidth = 2`。
- 枚举路径：`renderer.viewport.getRenderArea().blockList` → `renderer.vertex.block.iterateElementsOfChunkIndex(chunk.index)` → `manager.getBlockByLoc(cell.x, cell.y)` → `manager.getRenderables(area)`；不新增任何迭代方法。
- 不写 `clearRect`（画布由渲染系统在渲染前清空），不传 `noanti`（文字需要抗锯齿）。

## 挂载前置条件

文字只有作为地图渲染元素 `MapRenderItem`（`packages-user/client-base/src/map/element.ts`）的子级挂载时才会跟随地图变换——父级负责提供地图变换，`selfTransform` 只负责「盒子不变换、内容变换」。本计划**不接线**，因此该前置条件当前不成立，也无从做视觉验证。

## dev.md 偏离

`IMapTextManager` 与 `IMapTextProps` 放在 `map/mapText.tsx`，偏离 `dev.md` §类型规范 L101（需要向外暴露的接口类型都放到 `types.ts` 中）。依据是用户明确要求三样东西（`IMapTextManager` / `IMapTextProps` / `MapText`）同置 `map/mapText.tsx`；本计划遵循用户的位置指令，此处显式记录该偏离，未静默略过。

## 明确未接线项

- 更新机制未接线：文件中只有一条 `// TODO:` 说明管理器内容与变换矩阵的更新尚未接线、当前依赖 `<custom>` 元素自身的缓存；不存在 `watch` / ticker / 定时器 / 事件订阅。
- 组件未接入任何位置：除 barrel 的一行导出外，仓库中没有任何文件引用 `MapText`；不改 UI、元素、视口、旧拓展。
- `map/extension` 下 6 个文件与 `components/index.ts` 一字未改；旧文字拓展保持原样；`map/viewport.ts`、`map/element.ts`、`map/renderer.ts`、`map/types.ts`、`elements/index.ts`、`src/client/ui/main.tsx` 均未改。
- 未新增依赖、未加测试、未运行游戏 / 浏览器 / dev server / `pnpm install`、未执行 git 写命令（0 次提交）。

## 门禁结果

- `prettier --check`（`mapText.tsx` / `index.ts`）：`All matched files use Prettier code style!`。
- `eslint`（`mapText.tsx` / `index.ts`）：退出码 0，0 error 0 warning。
- 静态内容闸门（`mapText.tsx`）：`OK: mapText.tsx matches spec (manager + props + component, no matrix calls)`，三个导出、6 个管理成员 + `getRenderables`、`IMapTextProps extends DefaultProps`、`selfTransform`、地图尺寸盒子、两条坐标公式、四条枚举路径、`if (area)` 正向分支、恰好 1 个 `<custom>` 与 1 条 `// TODO:`，且无任何矩阵变换调用 / `watch` / `resize` / `setInterval`。
- barrel 闸门（`map/index.ts`）：`OK: map/index.ts has 11 exports, mapText at index 4`，原有 10 个导出齐全。
- 只读哈希闸门：13 个只读文件（`map/extension` 全部 6 个 + `map/element.ts` / `map/viewport.ts` / `map/renderer.ts` / `map/types.ts` / `components/index.ts` / `elements/index.ts` / `src/client/ui/main.tsx`）哈希与基线一致，`OK: 13 read-only files unchanged since baseline`。
- `HEAD` 闸门：`OK: HEAD unchanged ed693feb4012533b62ddb329da7f1af081b82ce4 | ed693fe fix: 自我变换模式下的交互坐标问题`，0 次提交。
- 未跟踪差分闸门：`OK: only the 2 allowed paths may be newly untracked (baseline has 121 entries); no deletions; added=packages-user/client-base/src/map/mapText.tsx`；未断言整棵工作树干净。
- `git diff --check -- map/index.ts`：退出码 0，diff 仅 1 行新增。
- SUMMARY 自检（写后复核）：纯 CRLF、无 BOM、无 tab，文件名与关键内容由计划门禁校验。

## 偏差

无。计划命令均按原样执行；源码写入仅落在 `files_modified` 的 3 个路径内，未发现计划命令缺陷，未触发行为或代码歧义。

## 未校准估算

`confidence: low`、`tokens: 22000`（3 个任务 / 22k 仅为 advisory 建议值，不作为拆分或阻断依据）。`actuals.tokens` 为两个源码文件改动的粗略 chars/4 估算（约 1214），非精确计量。

## 可见跳过

spec-less probe fallback skipped: phase has no requirement IDs to probe (visible skip)。

## Self-Check: PASSED

- 已确认 `packages-user/client-base/src/map/mapText.tsx` 存在，并包含 `IMapTextManager` / `IMapTextProps` / `MapText`。
- 已确认 `packages-user/client-base/src/map/index.ts` 为 11 行导出，`mapText` 位于索引 4。
- 已确认本 `09-58-SUMMARY.md` 通过内容 / CRLF / 无 BOM / 无 tab 门禁。
- 已确认 0 次提交，`HEAD` 保持 `ed693feb4012533b62ddb329da7f1af081b82ce4`。
