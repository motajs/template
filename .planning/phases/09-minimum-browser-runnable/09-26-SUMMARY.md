---
phase: 09-minimum-browser-runnable
plan: 26
subsystem: rendering
tags: [webgl2, transparency, overlay, instancing, post-effect, vitest, source-gate]

requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-25 的两遍式渲染、覆盖层草稿、postEffect 修正与渲染源码闸门基线

provides:
  - "覆盖层的状态、私有类型、阈值判定与 flush / sort / assemble 全部收敛进 vertex.ts，不新增导出类型或类"
  - "完全惰性的 setStaticAlpha：只写 pendingAlpha、标值脏、requestUpdate；实例与成员变化集中在取顶点数组时 flush"
  - "数值 / 对象键（Map<IMapLayer, Map<number, ...>>）；动态成员每次排序从 renderer.getMovingBlock() 现取"
  - "排序后必然重新组装的不变式：sortOverlay() 置 overlayValueDirty，deleteMoving() 同时置两个脏标记"
  - "renderer.ts 按新契约在脏时先取数组再取数量，并补齐两遍式 / 混合 / FBO / ping-pong 的解释性注释"
  - "types.ts 的 getOverlayCount() 补充「脏时需先取 getOverlayArray()」的契约说明"

affects: [地图渲染后续计划, 半透明 / 后处理相关计划, Phase 10 文档]

actuals:
  tokens: 11729
  tasks: 5
  commits: 0

tech-stack:
  added: []
  patterns:
    - "覆盖层唯一实现处：pendingAlpha / overlayStatic / 两个脏标记 / overlayOrdered / 暂存数组全部在 MapVertexGenerator 内"
    - "setStaticAlpha 惰性写 pending；getVertexArray() 在 checkRebuild() 之后 flush，是不透明遍上传前的唯一落地点"
    - "getOverlayArray() 顺序为 flush →（顺序脏则）sort →（值脏或顺序脏则）assemble；isOverlayDirty() 同时覆盖 pending / 顺序 / 值"
    - "排序键 (layerIndex, y, x, kind)，x 只作 CPU 侧稳定次级键，不进入 z / 深度；静态先于动态"
    - "不重排分块张量与动态数组；覆盖层组装只拷贝 16 float 并覆盖前四个 rect 浮点"

key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-26-BASELINE.json
  modified:
    - packages-user/client-base/src/map/vertex.ts
    - packages-user/client-base/src/map/renderer.ts
    - packages-user/client-base/src/map/types.ts
    - packages-user/client-base/src/map/__test__/rendererGate.test.ts
  deleted:
    - packages-user/client-base/src/map/overlay.ts
    - packages-user/client-base/src/map/__test__/overlay.test.ts

key-decisions:
  - "删除 overlay.ts 与 overlay.test.ts（两者均未被 git 跟踪，删除后 git status 不会出现 D 行），能力全部并入 vertex.ts"
  - "setStaticAlpha 完全惰性；getStaticAlpha 先读 pendingAlpha，保持 IBlockStatus.getAlpha() 的即时语义"
  - "flushPendingAlpha() 放在 getVertexArray() 的 checkRebuild() 之后，保证不透明遍上传前矩形已就位并已 markRenderDirty()"
  - "sortOverlay() 清顺序脏后立即置 overlayValueDirty = true；deleteMoving() 同时置两个脏标记，杜绝已删除动态块的残影"
  - "动态成员不设登记表，每次排序从 renderer.getMovingBlock() 现取 index / x / y / layer"
  - "已知类型基线 renderer.ts TS2339 getLayerByAlias / IGameMap 按用户裁定不修；类型闸门精确豁免恰好一条并打印原文"
  - "按用户要求不运行任何 git 写命令，不更新 STATE.md / ROADMAP.md；代码改动全部留在工作树"
  - "不做浏览器 UAT、不宣称 WebGL E2E；游戏当前不可运行，SUMMARY 记为 status: partial"

patterns-established:
  - "待应用 alpha：Map<IMapLayer, Map<number, number>>，键为图层对象与地图索引，不拼接 static:/dynamic: 字符串"
  - "静态记录：Map<IMapLayer, Map<number, IOverlayStaticRecord>>，进入覆盖层时保存原 rect 并把实例 rect 置零"
  - "成员刷新：updateTileVertex 的 Position 路径刷新记录后再次置零；updateVertexArray 的空图块路径把记录 rect 置零"
  - "重建清理：checkRebuild / setBlockSize 清空 overlayStatic 与 pendingAlpha，清空排序缓存并把两个脏标记置真"
  - "覆盖层组装只读分块图层数组与 dynamicInstancedArray，从不修改分块张量"

requirements-completed: []

coverage:
  - id: D1
    description: "覆盖层实现收敛进 vertex.ts（无独立模块、无字符串键、数值嵌套 Map）"
    verification:
      - kind: unit
        ref: "rendererGate.test.ts#keeps the overlay implementation inside the vertex generator"
        status: pass
      - kind: unit
        ref: "rendererGate.test.ts#stores overlay keys as numeric nested maps"
        status: pass
    human_judgment: false
  - id: D2
    description: "惰性 setStaticAlpha、pending 优先读取与 flush 落点"
    verification:
      - kind: unit
        ref: "rendererGate.test.ts#makes setStaticAlpha fully lazy"
        status: pass
      - kind: unit
        ref: "rendererGate.test.ts#flushes pending alpha when the vertex array is taken"
        status: pass
    human_judgment: false
  - id: D3
    description: "顺序 → 组装不变式（sortOverlay 置值脏、deleteMoving 置两个脏标记）"
    verification:
      - kind: unit
        ref: "rendererGate.test.ts#sorts by layer, y, x and kind and always reassembles afterwards"
        status: pass
      - kind: unit
        ref: "rendererGate.test.ts#takes moving members live and dirties both flags on deletion"
        status: pass
    human_judgment: false
  - id: D4
    description: "两遍式 / 动态尾部裁剪 / blendFuncSeparate / 深度附件 / ping-pong 配对 / 0-1-2+ 链路 / 缩放与销毁 / map.frag 阈值 / OI-1 (A) 保留"
    verification:
      - kind: unit
        ref: "rendererGate.test.ts 的两遍式、混合、深度附件、配对、效果链路、裁剪与 dataX/dataY 用例"
        status: pass
    human_judgment: true
    rationale: "仅验证源码形状；WebGL 实际渲染结果未在浏览器验证，游戏当前不可运行"
  - id: D5
    description: "浏览器人工 UAT（静态半透明叠加、动态块遮挡与混合、26×13 跨分块、0/1/2+ 后处理、画布缩放）"
    verification: []
    human_judgment: true
    rationale: "用户明确不做浏览器 UAT；无 WebGL E2E 自动化。源码闸门通过不等于渲染结果已验证"

duration: 未精确记录
completed: 2026-10-24
status: partial
---

# Phase 09: minimum-browser-runnable — Plan 26 Summary

**覆盖层实现全部收敛进 vertex.ts，setStaticAlpha 完全惰性、flush 落在取顶点数组时；未提交代码，浏览器 UAT 因游戏不可运行而跳过**

## Accomplishments

- 删除 `overlay.ts` 与 `__test__/overlay.test.ts`；覆盖层的状态、私有接口、私有序枚举、阈值常量与判定函数、flush / sort / assemble 全部写在 `vertex.ts` 的 `MapVertexGenerator` 内，不新增导出类型或类。
- `setStaticAlpha` 改为完全惰性：只写 `pendingAlpha`、置 `overlayValueDirty`、调用 `renderer.requestUpdate()`，不做实例查找、rect 改写、成员增删或排序。
- `getStaticAlpha` 在读实例数组前优先返回 `pendingAlpha` 中的待应用值，保持 `IBlockStatus.getAlpha()` 的即时语义。
- `getVertexArray()` 在 `checkRebuild()` 之后调用 `flushPendingAlpha()`；flush 写实例 alpha，跨阈值时保存 / 恢复 rect、增删 `overlayStatic` 记录，并对 rect 变化调用 `markRenderDirty()`。
- `getOverlayArray()` 固定为 flush → sort → assemble；`isOverlayDirty()` 覆盖 pending / 顺序 / 值三类脏；`getOverlayCount()` 的「脏时需先取数组」契约写入 jsDoc，renderer 按该契约先取数组再取数量。
- `sortOverlay()` 结尾置 `overlayValueDirty = true`；`deleteMoving()` 同时置 `overlayOrderDirty` 与 `overlayValueDirty`，保证「排序 / 成员变化后必然重新组装」，已删除的动态块不会残留。
- 键改为 `Map<IMapLayer, Map<number, ...>>`；动态成员每次排序从 `renderer.getMovingBlock()` 现取，不保留任何登记表。
- `renderer.ts` 补齐两遍式、动态尾部裁剪、分离式混合、FBO 深度附件、ping-pong 配对与效果链的解释性注释；`types.ts` 补充 `getOverlayCount()` 契约说明。

## 保留项清单（逐项保留，未回退）

- 两遍式与 `depthMask(true)` / `depthMask(false)` / 收尾 `depthMask(true)` —— 保留。
- 不透明遍按 `Math.min(v.endIndex, dynamicStart)` 裁掉动态尾部 —— 保留。
- `blendFuncSeparate(SRC_ALPHA, ONE_MINUS_SRC_ALPHA, ONE, ONE_MINUS_SRC_ALPHA)` —— 保留，未改回 `blendFunc`。
- ping / pong 各自绑定自己的颜色纹理并挂 `DEPTH_COMPONENT24` 深度 renderbuffer —— 保留。
- 0 / 1 / 2+ 效果链路（≥1 进 ping、最后一个效果写 `null`）—— 保留。
- `setCanvasSize` 同时重设两个深度缓冲、`destroy` 删除两个 FBO / 两个纹理 / 两个深度 renderbuffer / `overlayBuffer` —— 保留。
- `map.frag` 的 `0.004` —— 保留。
- OI-1 (A) 的 `block.dataX` / `block.dataY` —— 保留。

## Task Commits

**无。** 按用户要求，本次执行未运行任何 git 写命令（无 `git add` / `commit` / `stash` / `checkout` / `switch` / `worktree` / `reset` / `restore`）；所有代码改动保留在工作树，供用户自行审查。也未更新 `STATE.md` / `ROADMAP.md`。

## Verification

| 门禁 | 命令 | 结果 |
|------|------|------|
| 单测 / 源码闸门 | `pnpm exec vitest run packages-user/client-base/src/map/__test__` | 1 个测试文件、30 条用例全部通过 |
| 代码风格 | `pnpm exec eslint vertex.ts renderer.ts types.ts rendererGate.test.ts` | 0 error / 0 warning |
| 类型（按文件过滤） | `node -e` 包裹 `pnpm exec vue-tsc --noEmit`，仅取 `packages-user/client-base/src/map/` 诊断 | 仓库共 229 条诊断；`map/` 下恰好豁免 1 条基线，其余 0 条。豁免原文：`packages-user/client-base/src/map/renderer.ts(484,25): error TS2339: Property 'getLayerByAlias' does not exist on type 'IGameMap'.` |
| 范围 | `node -e` + `git status --porcelain -uall -- packages-user/client-base/src/map` | 变更集恰好等于 6 条允许状态（5 个 ` M` + `?? __test__/rendererGate.test.ts`）；`overlay.ts` / `__test__/overlay.test.ts` 均不存在（未跟踪文件删除后没有 `D` 行） |
| 哈希基线 | `node -e` 读 `09-26-BASELINE.json` + `git hash-object` / `git rev-parse HEAD` | HEAD 与 7 个受保护文件的当前哈希与 Task 0 基线逐字相等，且基线恰好 7 项 |

说明：

- 类型闸门只对 `packages-user/client-base/src/map/` 负责，不覆盖全仓，也不修复已知的 `getLayerByAlias` 基线。
- 范围闸门使用「6 条显式期望状态 + 两个 overlay 文件不存在」，因为两个 overlay 文件都是未跟踪文件，删除后不会有 `D` 行。
- 哈希闸门使用「当前 `git hash-object` 值与 `09-26-BASELINE.json` 基线值的真值比较」，不是「哈希字符串出现在 SUMMARY」这类弱检查；SUMMARY 里的哈希只是审计痕迹。
- `status.ts` 与 `shader/map.frag` 的 ` M` 是执行前既有状态（前者为用户自己的参数顺序修改、后者为 09-25 的阈值修改），允许存在，并由哈希闸门证明本计划未改动。

## Deviations from Plan

### 1. [Rule 1 - 计数] 源码闸门为 30 条用例而不是计划所列的 29 条

- **Found during:** Task 3
- **Issue:** 计划把「效果链路」合并为一条断言组，实现时把「最后一个效果写 `null`」与「第一个效果读 ping」拆成两条独立 `it`，以便失败时定位更精确。
- **Fix:** 保留拆分；没有删除或放宽任何断言，`vitest` 30 条全部通过，用例数下限（≥26）满足。
- **Files modified:** `packages-user/client-base/src/map/__test__/rendererGate.test.ts`
- **Committed in:** 未提交（按用户要求）

### 2. [Rule 1 - 格式] 新建的 `rendererGate.test.ts` 需要 prettier 统一为 CRLF

- **Found during:** Task 3
- **Issue:** 新建文件写入时为 LF，仓库要求 CRLF，`eslint` 报 356 条 `Insert ␍` 格式错误。
- **Fix:** 对测试文件运行 `pnpm exec prettier --write`；仅换行与格式，语义与断言未变。
- **Files modified:** `packages-user/client-base/src/map/__test__/rendererGate.test.ts`
- **Committed in:** 未提交（按用户要求）

**Total deviations:** 2（1 计数、1 格式）
**Impact on plan:** 均为实现细节，不改变设计、不扩大豁免、不删除用例。

## Issues Encountered

- **无浏览器 UAT**：游戏当前不可运行，用户明确不做 UAT；半透明叠加、动态块遮挡与混合、26×13 跨分块、0/1/2+ 后处理、画布缩放的视觉结果均未验证，**无 WebGL E2E**。
- **同深度重叠的既定限制**：同一图层同行的不透明图块与覆盖层图块 z 相同，`depthFunc(LESS)` 的严格比较让先绘制者胜出；本计划不引入浮点深度编码去消解。
- **地图重建丢失静态 alpha**：`checkRebuild` / `setBlockSize` 重新分配实例数组后 alpha 复位为 1；本计划只清空 `overlayStatic` 与 `pendingAlpha` 并标脏，不改变既有语义。
- **pending 找不到实例时被丢弃**：目标图层不在当前渲染器或坐标越界时，`getIndexInBlock` 返回 `null`，该条 pending 被丢弃（不报错、不缓存）。
- **动态块移动期间每帧重排**：动态成员每次排序现取，移动期间排序键变化会导致每帧重排；正确性优先，未做增量排序优化。
- **`addPostEffect` 当前无调用方**：后处理链路只有源码闸门验证，未在真实效果链上运行。

## Known Stubs

无。

## User Setup Required

待游戏可运行后补浏览器 UAT：

- 静态半透明图块叠加与恢复（`setAlpha` 跨 1 的往返）。
- 动态块（勇士 / 动画）的遮挡与混合顺序。
- 26×13 跨分块地图的定位与置零（`dataX` / `dataY`）。
- 0 / 1 / 2+ 后处理效果链路。
- 画布缩放后的深度缓冲与覆盖层绘制。

## Hash Evidence（未被触碰的文件与 HEAD）

以下数值逐字来自 Task 0 写下的 `09-26-BASELINE.json`，执行结束时重新计算并逐项相等：

- HEAD: `c5fca9e777d1750daeaea78ef0152bba31dd8c18`
- `status.ts`: `9236bc34330d0709a0c26884f967ef77f41c053b`
- `moving.ts`: `a61aa951771e0c4d103dbf04b789b380354c8767`
- `viewport.ts`: `3c8f224937f2a9743689f0ffba51cbfb3e07b2f3`
- `block.ts`: `629099e1970ec38ab93e4e29e4949d424f3e9d93`
- `element.ts`: `bc9e9d9d01d889cf275ea9a5336454072438af69`
- `constant.ts`: `d29a817717f668f615ddf4b3d195ee5d64f77df1`
- `shader/map.frag`: `d8f3df3705d8c999a6ea033bd45039e5d91e6fea`

与 Task 0 基线逐字相等、HEAD 未变；未改依赖、配置、其它包、09-01..09-25 的计划与 SUMMARY、`09-CONTEXT.md`。

## 估算说明

`estimate.tokens = 80000`（`raw_tokens` 同为 80000，`tasks = 5`，`confidence: low`）为**未校准估算**；本计划按用户要求保持单计划、不拆分。09-25 的 160000 超预算声明本计划不再沿用。`actuals.tokens = 11729` 是按工作树 diff（3 个源码文件 + 新测试文件）字符数 / 4 的粗略值，同样未校准。

## Next Phase Readiness

- 覆盖层已无独立文件，状态与逻辑唯一收敛在 `vertex.ts`；惰性 setter、flush 落点、排序后必然组装、数值嵌套键与动态现取均已由源码闸门覆盖。
- 尚未完成的验证：浏览器 UAT 与任何 WebGL E2E。**源码闸门通过不等于渲染结果已验证**。
- 代码未提交，`STATE.md` / `ROADMAP.md` 未更新（按用户要求）。

---

*Phase: 09-minimum-browser-runnable*
*Plan: 26*
*Completed: 2026-10-24（代码任务 1–4；UAT 跳过，status: partial）*

## Self-Check: PASSED

- `overlay.ts` / `__test__/overlay.test.ts` 均不存在：PASSED
- `09-26-BASELINE.json` 存在且恰好 7 个哈希 + HEAD：PASSED
- `09-26-SUMMARY.md` 存在且包含全部必需声明：PASSED
- `map/` 变更集恰好等于 6 条允许状态：PASSED
- HEAD 与基线一致、7 个受保护文件哈希逐字相等：PASSED
- 全程未运行任何 git 写命令，代码全部保留在工作树：PASSED
- 按用户要求未创建任何提交，因此无提交哈希可核对：N/A
