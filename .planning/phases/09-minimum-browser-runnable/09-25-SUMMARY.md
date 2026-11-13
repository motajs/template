---
phase: 09-minimum-browser-runnable
plan: 25
subsystem: rendering
tags: [webgl2, transparency, instancing, post-effect, vitest]

requires:
  - phase: 09-minimum-browser-runnable
    provides: 现有地图渲染器（renderer.ts / vertex.ts / types.ts）与 09-24 的测试基线

provides:
  - "两遍式地图渲染：不透明遍保持分块批量实例化绘制，透明覆盖层最后绘制并关闭深度写入"
  - "DOM-free 的覆盖层排序 / 成员状态机（overlay.ts）与 40 条单测 / 源码闸门"
  - "静态半透明图块的退化 rect 提取与恢复、动态块登记 / 注销 / 组装"
  - "值脏 / 顺序脏分离与 render 内惰性排序；动态 layerIndex 在组装前重新推导"
  - "postEffect：ping/pong 颜色纹理配对、DEPTH_COMPONENT24 深度附件、0/1/2+ 效果链路、缩放与销毁"
  - "OI-1 (A)：getIndexInBlock 改用 dataX / dataY 计算块内偏移"

affects: [地图渲染后续计划, 半透明 / 后处理相关计划, Phase 10 文档]

actuals:
  tokens: 10416
  tasks: 5
  commits: 0

tech-stack:
  added: []
  patterns:
    - "覆盖层独立 staging 实例数组 + 独立 GPU 缓冲；不重排分块张量与动态数组"
    - "静态键 = static:${layerIndex}:${mapX}:${mapY}，动态键 = dynamic:${movingIndex}；同一格不同图层互不覆盖"
    - "值脏只重传、顺序脏才重排；排序在 MapRenderer.render() 内惰性执行"
    - "不透明遍裁剪 dynamicStart 之后的动态尾部；覆盖层用 depthMask(false) + 深度测试完成遮挡"
    - "postEffect 使用 0 个效果 → 默认帧缓冲、≥1 个效果 → ping，最后一个效果写 null"

key-files:
  created:
    - packages-user/client-base/src/map/overlay.ts
    - packages-user/client-base/src/map/__test__/overlay.test.ts
    - packages-user/client-base/src/map/__test__/rendererGate.test.ts
  modified:
    - packages-user/client-base/src/map/renderer.ts
    - packages-user/client-base/src/map/vertex.ts
    - packages-user/client-base/src/map/types.ts
    - packages-user/client-base/src/map/shader/map.frag

key-decisions:
  - "OI-1 采用 (A)：getIndexInBlock 的块内偏移改用 block.dataX / block.dataY，并加源码闸门"
  - "OI-2 采用计划提议的主命名（overlay.ts / MapOverlayOrder / IMapOverlayEntry / overlayBuffer / pingDepthBuffer / pongDepthBuffer 等）"
  - "已知类型基线 renderer.ts(484,25) TS2339 getLayerByAlias / IGameMap 按用户裁定不修、不动数据端接口；类型闸门精确豁免恰好一条并打印原文"
  - "按用户要求不提交任何代码；Task 6 的浏览器 UAT 因游戏当前无法运行而跳过，SUMMARY 记为 halted"
  - "status.ts 的 StaticBlockStatus.setAlpha 参数顺序疑似写反；用户明确表示自行修改，本计划未触碰该文件"

patterns-established:
  - "覆盖层身份键：静态包含 layerIndex + mapX + mapY，动态只含 movingIndex；动态坐标与 layerIndex 在组装时从活动 IMovingBlock 重新推导"
  - "setStaticAlpha 跨阈值时保存原 rect 并把实例 rect 置 0；恢复时写回并注销记录"
  - "updateTileVertex 的 Position 更新会刷新已登记静态记录的 rect 并再次置 0；Texture-only 更新不覆盖已保存的 rect"
  - "覆盖层组装只拷贝实例数据并覆盖 rect 前四个 float；不动分块数组"

requirements-completed: []

coverage:
  - id: D1
    description: "覆盖层排序 / 成员状态机（排序键、静态先于动态、同格不同图层、脏标记、缓存顺序）"
    verification:
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/overlay.test.ts#orders entries by layer index, then y, then x"
        status: pass
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/overlay.test.ts#marks only the value as dirty when the sort keys are unchanged"
        status: pass
    human_judgment: false
  - id: D2
    description: "两遍式半透明渲染与静态提取 / 恢复（不透明遍 depthMask(true)、覆盖层 depthMask(false)、独立 staging 缓冲）"
    verification:
      - kind: other
        ref: "TRACER GATE（node 源码闸门，OK tracer gate）"
        status: pass
    human_judgment: true
    rationale: "WebGL 实际混合与遮挡未在浏览器验证；游戏当前无法运行，UAT 未执行"
  - id: D3
    description: "动态块并入覆盖层，保留 MovingBlock.index / movingIndexMap / 扩缩容身份"
    verification:
      - kind: other
        ref: "DYNAMIC GATE（node 源码闸门，OK dynamic gate）"
        status: pass
    human_judgment: true
    rationale: "动态块视觉顺序未在浏览器验证；UAT 未执行"
  - id: D4
    description: "postEffect：ping/pong 实际附着配对、DEPTH_COMPONENT24 深度附件、0/1/2+ 链路、缩放与销毁"
    verification:
      - kind: other
        ref: "POST GATE（node 源码闸门，OK post gate）"
        status: pass
    human_judgment: true
    rationale: "addPostEffect 当前无调用方，后处理视觉结果未在浏览器验证"
  - id: D5
    description: "OI-1 (A)：getIndexInBlock 使用 dataX / dataY 定位跨分块实例"
    verification:
      - kind: other
        ref: "rendererGate.test.ts#locates instances with data coordinates inside a chunk"
        status: pass
    human_judgment: false
  - id: D6
    description: "浏览器人工 UAT（半透明叠加、动态块、26×13 跨分块、后处理链路）"
    verification: []
    human_judgment: true
    rationale: "用户明确表示当前游戏无法运行、不做 UAT；无 WebGL E2E 自动化"

duration: 未精确记录
completed: 2026-10-23
status: halted
---

# Phase 09: minimum-browser-runnable — Plan 25 Summary

**两遍式半透明覆盖层、值脏 / 顺序脏惰性排序、postEffect 深度附件与 ping/pong 配对已落到源码；未提交代码，浏览器 UAT 因游戏无法运行而跳过**

## Performance

- **Duration:** 未精确记录（执行器未返回时间戳）
- **Tasks:** 5 / 7（Task 0 已由用户批准；Task 6 的 UAT 与 SUMMARY 由本文件替代）
- **Files modified:** 7（4 修改 + 3 新增）
- **Actuals:** 约 10416 tokens（chars/4 的已实现 diff，未校准）

## Accomplishments

- 新增 `overlay.ts`：覆盖层排序 / 成员状态机，静态键含 layerIndex + mapX + mapY，动态键只含 movingIndex。
- `renderer.ts`：不透明遍显式 `depthMask(true)` 并裁掉 `dynamicStart` 之后的动态尾部；覆盖层最后绘制，`depthMask(false)`、深度测试保留；`blendFuncSeparate`；独立 `overlayBuffer`；`needUpdate()` 纳入覆盖层脏标记。
- `vertex.ts`：静态半透明提取 / 恢复、动态块登记 / 注销、值脏 / 顺序脏、组装前重新推导动态 `layerIndex`；OI-1 (A) 的 `dataX` / `dataY` 修正。
- `renderer.ts`：ping/pong 各自配对颜色纹理并挂 `DEPTH_COMPONENT24` 深度 renderbuffer；0 个效果走默认帧缓冲、≥1 个效果进 ping、最后一个效果写 `null`；`setCanvasSize` 重设深度缓冲；`destroy` 删除新增对象。
- `map.frag`：discard 阈值 `0.1 → 0.004`（既有注释未改）。
- 新增 40 条单测 / 源码闸门（`overlay.test.ts` 24 条 + `rendererGate.test.ts` 16 条），全部通过。

## Task Commits

**无。** 按用户要求，本次执行未运行任何 git 写命令；所有代码改动保留在工作树，供用户自行审查。

## Files Created/Modified

- `packages-user/client-base/src/map/overlay.ts` — 覆盖层排序 / 成员状态机（新增）
- `packages-user/client-base/src/map/__test__/overlay.test.ts` — 排序与成员状态机单测（新增，24 条）
- `packages-user/client-base/src/map/__test__/rendererGate.test.ts` — 渲染源码静态闸门（新增，16 条）
- `packages-user/client-base/src/map/renderer.ts` — 两遍式绘制、覆盖层缓冲、postEffect 修正
- `packages-user/client-base/src/map/vertex.ts` — 静态提取 / 恢复、动态块登记、脏标记与组装、OI-1 (A)
- `packages-user/client-base/src/map/types.ts` — `IContextData` 新字段与 `IMapVertexGenerator` 方法声明
- `packages-user/client-base/src/map/shader/map.frag` — discard 阈值下调

## Decisions Made

- OI-1 (A)：`getIndexInBlock` 的 `dx` / `dy` 改用 `block.dataX` / `block.dataY`；单分块无差异，26×13 第二列分块修正。
- OI-2：采用计划提议的主命名，未改名。
- 已知类型基线 `renderer.ts(484,25) TS2339: Property 'getLayerByAlias' does not exist on type 'IGameMap'.` 不修、不动数据端接口；类型闸门精确豁免恰好一条并打印原文（行号因插入代码从 463 下移到 484）。
- Task 6 的浏览器 UAT 因游戏当前无法运行而跳过；用户明确不做 UAT。
- `status.ts` 的 `StaticBlockStatus.setAlpha` 参数顺序疑似写反，用户表示自行修改；本计划未触碰 `status.ts`。
- 代码一律不提交；仅提交本 SUMMARY 作为非代码产物。

## Deviations from Plan

### 1. [Rule 3 - Blocking] `rendererGate.test.ts` 使用 `?raw` 导入源码

- **Found during:** Task 5（源码闸门 / 类型闸门）
- **Issue:** 仓库 TS program 未包含 `@types/node`，`node:fs` / `node:path` / `process` 会产生 3 条新诊断；修复需改 `tsconfig.json`，而计划禁止改配置。
- **Fix:** 改用 Vite 的 `*?raw` 导入（`../renderer.ts?raw` 等），只读取源码文本，不导入 WebGL / DOM；路径不再依赖 cwd。
- **Files modified:** `packages-user/client-base/src/map/__test__/rendererGate.test.ts`
- **Verification:** 该文件 16 条用例全部通过；其余源码闸门脚本未改、未放宽断言。
- **Committed in:** 未提交（按用户要求）

### 2. [Rule 1 - Formatting] `vertex.ts` 既有 import 被 prettier 折叠

- **Found during:** Task 1 / Task 5
- **Issue:** 计划强制 `prettier --write`；`vertex.ts` 既有 `import { ... } from '../shared'` 从多行折叠为单行（78 字符）。
- **Fix:** 保留 prettier 结果；仅格式，语义不变，既有注释 / jsDoc 未改。
- **Files modified:** `packages-user/client-base/src/map/vertex.ts`
- **Verification:** eslint / vitest / 类型闸门通过。
- **Committed in:** 未提交（按用户要求）

### 3. [Rule 3 - Blocking] `SCOPE GATE` 未通过

- **Found during:** Task 5
- **Issue:** (a) 执行期间工作树存在用户并发改动（components 迁移、hotkey/use、10-CONTEXT 等），不在计划白名单内；(b) `git status --porcelain` 把新目录折叠成 `?? .../map/__test__/`，与白名单的两个文件路径不匹配。
- **Fix:** 未改闸门、未用 `git add -N` / `-uall` 规避；受保护文件（`moving.ts` / `viewport.ts` / `element.ts` / `block.ts` / `constant.ts` / `status.ts` / 顶点着色器 / `map/index.ts` / 依赖配置）零改动。
- **Files modified:** 无（仅记录）
- **Verification:** `protected file modified` 未触发；`map/__test__/` 内实测只有两个预期文件。
- **Committed in:** 未提交

---

**Total deviations:** 3（1 格式、2 阻塞/环境）
**Impact on plan:** `?raw` 与 prettier 折叠不改变语义；`SCOPE GATE` 需在用户并发改动收敛后、或以文件粒度列出 `__test__/` 后重跑。

## Issues Encountered

- **`status.ts` 疑似参数顺序错误**：`StaticBlockStatus.setAlpha` 调用 `this.vertex.setStaticAlpha(this.layer, alpha, this.x, this.y)`，而签名是 `(layer, x, y, alpha)`。这会让经 `getBlockStatus(...).setAlpha(...)` 的静态半透明写错槽位。用户已确认自行修改，本计划不改、不记录为已确认缺陷。
- **无浏览器 UAT**：游戏当前无法运行，用户明确不做 UAT；半透明混合、动态块遮挡、26×13 跨分块与后处理链路没有浏览器级验证，也无 WebGL E2E 自动化。
- **`addPostEffect` 当前无调用方**：后处理路径只有源码闸门验证，未在真实效果链上跑过。

## Known Stubs

无。

## User Setup Required

- 用户自行修正 `packages-user/client-base/src/map/status.ts` 的 `setStaticAlpha` 参数顺序（若确认为问题）。
- 待游戏可运行后补浏览器 UAT：静态半透明叠加、动态块遮挡、26×13 跨分块、0 / 1 / 2+ 后处理链路、画布缩放。
- 待并发改动收敛后重跑 `SCOPE GATE`（或以文件粒度处理 `map/__test__/` 的未跟踪目录）。

## Next Phase Readiness

- 两遍式覆盖层与 postEffect 修正已落到源码，单测 / eslint / 源码闸门 / 类型闸门（精确基线豁免）通过。
- 尚未完成的验证：浏览器 UAT、`SCOPE GATE`、`status.ts` 的静态 alpha 调用路径。
- 计划 `estimate.tokens=160000` / 7 tasks 为**未校准估算**（`confidence: low`）；实际 diff 约 10416 tokens，按用户要求保持单计划、未拆分。
- 浏览器行为未验证，**无 WebGL E2E**；不得把本 SUMMARY 视为半透明渲染已完成验收。

---

*Phase: 09-minimum-browser-runnable*
*Plan: 25*
*Completed: 2026-10-23（代码任务 1–5；UAT 跳过，status: halted）*
