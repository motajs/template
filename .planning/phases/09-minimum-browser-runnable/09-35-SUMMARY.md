---
phase: 09-minimum-browser-runnable
plan: 35
subsystem: rendering
tags: [overlay, map-vertex, class-hierarchy, priority, instanceof, typescript]

# Dependency graph
requires: []
provides:
  - "普通类 `OverlayBlock` 基类（`layer` / `x` / `y` / `readonly priority`）与 `IOverlayBlock` / `IOverlayStaticBlock` 接口"
  - "`StaticOverlayBlock` 静态覆盖块类（`mapIndex`，优先级 0）"
  - "`DynamicBlockStatus extends OverlayBlock`（优先级 1），`MovingBlock` 经由继承成为覆盖块"
  - "`vertex.ts` 以 `IOverlayBlock[]` 缓存并用 `instanceof` 判别两种覆盖块，移除私有联合类型与种类枚举"
affects: [09-minimum-browser-runnable, map-renderer, overlay-ordering]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# 说明：本计划全程 0 次代码提交，下面 `tokens` 由 `git diff` 的 `+` / `-` 行字符数 / 4 实测（4722），
# 该 diff 相对 HEAD，包含执行前就已存在的未提交改动（上一版「接口 + 种类枚举」实现），并非纯本次增量。
actuals:
  tokens: 4722
  tasks: 2
  commits: 0

tech-stack:
  added: []
  patterns:
    - "覆盖块抽象：普通类基类 + 只读 priority + instanceof 判别（取代种类枚举与联合类型）"
    - "静态覆盖块每次排序时新建 `StaticOverlayBlock` 实例，动态覆盖块直接复用 `MovingBlock` 实例"

key-files:
  created: []
  modified:
    - packages-user/client-base/src/map/types.ts
    - packages-user/client-base/src/map/status.ts
    - packages-user/client-base/src/map/moving.ts
    - packages-user/client-base/src/map/vertex.ts
    - packages-user/client-base/src/map/__test__/rendererGate.test.ts

key-decisions:
  - "`OverlayBlock` 为具体普通类（非接口、非抽象类），`DynamicBlockStatus` 继承它并以 `super(layer, 1)` 固定动态优先级"
  - "静态覆盖块优先级 0、动态 1，与旧 `OverlayBlockKind` 的 `Static = 0` / `Dynamic = 1` 数值与语义一致"
  - "`vertex.ts` 用 `instanceof MovingBlock` / `else if (block instanceof StaticOverlayBlock)` 收窄，取代 `block.kind`"
  - "不修改 `sortOverlay()` 既有 jsDoc 与函数内两行注释（仍写 kind / 种类），按 AGENTS.md 报备为 OI-3"
  - "类型闸门精确豁免用户自有的 `types.ts(14,10) TS2305 TimingFn` 一条并打印原文，不修复、不扩大豁免"

patterns-established:
  - "覆盖块实现类必须 `implements` 对应接口（dev.md 类先接口后 implements）"

requirements-completed: []

coverage:
  - id: D1
    description: "types.ts 删除 OverlayBlockKind，新增 IOverlayBlock.priority 与 IOverlayStaticBlock.mapIndex，IMovingBlock 无 kind"
    verification:
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/rendererGate.test.ts#declares the overlay block interfaces with a priority"
        status: pass
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/rendererGate.test.ts#makes the moving block an overlay block"
        status: pass
    human_judgment: false
  - id: D2
    description: "status.ts 新增普通类 OverlayBlock 与 StaticOverlayBlock，DynamicBlockStatus 继承 OverlayBlock（优先级 1 / 0）"
    verification:
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/rendererGate.test.ts#declares the overlay block as a concrete class with a priority"
        status: pass
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/rendererGate.test.ts#makes the dynamic block status an overlay block of priority one"
        status: pass
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/rendererGate.test.ts#declares the static overlay block of priority zero"
        status: pass
    human_judgment: false
  - id: D3
    description: "moving.ts 去掉 kind / 重复 layer / x / y 与 this.layer 赋值，保留 index 身份与用户曲线类型改写"
    verification:
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/rendererGate.test.ts#removes the moving block kind in favour of inheritance"
        status: pass
    human_judgment: false
  - id: D4
    description: "vertex.ts 用 IOverlayBlock[] 缓存、StaticOverlayBlock 实例入列、a.priority 比较器与 instanceof 两分支组装"
    verification:
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/rendererGate.test.ts#pushes static overlay blocks and dynamic blocks themselves"
        status: pass
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/rendererGate.test.ts#sorts by layer, y, x and priority and always reassembles afterwards"
        status: pass
      - kind: unit
        ref: "packages-user/client-base/src/map/__test__/rendererGate.test.ts#narrows the assembled blocks by class"
        status: pass
    human_judgment: false
  - id: D5
    description: "渲染运行期行为（实际绘制顺序、混合、深度、覆盖层视觉结果）"
    verification: []
    human_judgment: true
    rationale: "游戏当前不可运行，本计划明确不做浏览器 UAT、无 WebGL E2E；源码形状闸门通过不等于渲染结果已验证"

# Metrics
duration: 11min
completed: 2026-11-01
status: complete
---

# Phase 9 Plan 35: 覆盖块普通类体系与 priority 排序 Summary

**把覆盖块改成「`OverlayBlock` 普通类基类 + `StaticOverlayBlock` 静态块类 + 动态块状态继承」，用只读 `priority`（静态 0 / 动态 1）取代种类枚举，并让 `vertex.ts` 用 `instanceof` 判别两种覆盖块；渲染行为不变，0 次代码提交。**

## Performance

- **Duration:** 约 11 min
- **Started:** 2026-11-01T21:41:05+08:00
- **Completed:** 2026-11-01T21:52:00+08:00（本地时间，UTC+8）
- **Tasks:** 2 个执行任务（Task 1 / Task 2）；Task 0 为汇报关卡，用户已回复「可以执行」
- **Files modified:** 5 个代码 / 测试文件 + 本 SUMMARY（`09-35-PLAN.md` 未改动）

## Accomplishments

- `types.ts`：整体删除 `OverlayBlockKind` 枚举；`IOverlayBlock` 只剩 `readonly layer` / `x` / `y` / `readonly priority`；新增 `IOverlayStaticBlock extends IOverlayBlock`（`readonly mapIndex`）；`IMovingBlock` 保持 `extends IBlockStatus, IOverlayBlock` 且删除 `kind`。
- `status.ts`：新增具体普通类 `OverlayBlock implements IOverlayBlock`（`layer` / `x = 0` / `y = 0` / `readonly priority`，构造器 `(layer, priority)`）；`DynamicBlockStatus extends OverlayBlock implements IBlockStatus`，构造器首句 `super(layer, 1)`；新增 `StaticOverlayBlock extends OverlayBlock implements IOverlayStaticBlock`（`mapIndex`，构造器 `(layer, mapIndex, x, y)` 首句 `super(layer, 0)`）；`StaticBlockStatus` 与其 `setAlpha` 参数顺序逐字未动。
- `moving.ts`：删除 `OverlayBlockKind` 引入、`readonly kind`、重复的 `readonly layer` / `x` / `y` 声明与 `this.layer = layer;`；`index` 身份、全部动画逻辑与用户既有的 `ExcitationCurve` / `ExcitationCurve2D` 改写逐字保留。
- `vertex.ts`：删除私有 `IOverlayStaticBlock` 与 `type OverlayBlock`；`overlayOrdered: IOverlayBlock[]`；静态分支 `new StaticOverlayBlock(...)`、动态分支 `ordered.push(moving)` 本对象；比较器末位 `a.priority - b.priority`；组装改为 `if (block instanceof MovingBlock)` / `else if (block instanceof StaticOverlayBlock)` 两分支；16 float 拷贝、rect 覆盖、计数与脏标记逐字不变；新增 `./moving` / `./status` 普通引入（无循环引用：`vertex → moving → status → types`）。
- `rendererGate.test.ts`：删除全部种类枚举 / `kind` / 私有联合类型断言，新增类层次、`priority`、`instanceof` 与三状态类断言；保留既有 `alphaMap`（4 条）与 `getLayerIndex(a.layer)`（1 条）对齐。

## Files Created/Modified

- `packages-user/client-base/src/map/types.ts` — 删除 `OverlayBlockKind`；`IOverlayBlock` 加 `priority`、去 `readonly x/y`；新增 `IOverlayStaticBlock`；`IMovingBlock` 去 `kind`。
- `packages-user/client-base/src/map/status.ts` — 新增 `OverlayBlock` / `StaticOverlayBlock`；`DynamicBlockStatus` 继承基类并 `super(layer, 1)`；`StaticBlockStatus` 未改。
- `packages-user/client-base/src/map/moving.ts` — 去掉种类与重复成员，完全继承 `DynamicBlockStatus` / `OverlayBlock`；曲线类型改写保留。
- `packages-user/client-base/src/map/vertex.ts` — 私有联合类型删除；`overlayOrdered: IOverlayBlock[]`；`sortOverlay()` / `assembleOverlay()` 改用类实例与 `instanceof`。
- `packages-user/client-base/src/map/__test__/rendererGate.test.ts` — 种类断言改写为类 / 优先级 / `instanceof` 断言，新增 `statusSource` 的 `?raw` 引入，新增 3 条状态类用例；`it` 说明注释随范围同步改写。
- `.planning/phases/09-minimum-browser-runnable/09-35-SUMMARY.md` — 本执行摘要（LF）。

## 未改动清单（逐条确认）

`StaticBlockStatus`（含用户已改好的 `setAlpha(this.layer, this.x, this.y, alpha)` 参数顺序）；`flushPendingAlpha()` 整段；`setStaticAlpha` / `getStaticAlpha` / 静态帧数方法 / `setDynamicAlpha` / `setDynamicFrame` / `getDynamicAlpha` / `getDynamicFrame`；`alphaMap` / `overlayStatic` / `overlayOrderDirty` / `overlayValueDirty` / `overlayInstancedArray` / `overlayCount`；`getVertexArray()` 的 flush 落点；`getOverlayArray()` 的 flush → sort → assemble 顺序；`getOverlayCount()` 契约；`checkRebuild` / `setBlockSize` / `updateMoving` / `deleteMoving` 的脏标记；`IOverlayStaticRecord` 与记录读写方法；`MovingBlock.index` 身份与 `movingIndexMap`；`renderer.ts`（两遍式、`depthMask`、`blendFuncSeparate`、FBO / 深度附件 / ping-pong、postEffect、覆盖层上传与绘制、`needUpdate`）；`shader/map.frag` 的 `0.004`；分块张量 `[chunk][layer][row][col]`；`viewport.ts` / `block.ts` / `element.ts` / `constant.ts`；其它包与依赖 / 配置；09-01..09-34 的计划与摘要、`09-CONTEXT.md`。

哈希闸门实测（Task 1 采集、Task 2 逐字比较，两者一致）：

```
renderer.ts a8c4b435c90705be0e9c290492ef39efbb9990ac
shader/map.frag 5d14944bfc6e20d83df5543b22dcc3b0e24978ae
```

## 五类门禁真实结果

| # | 门禁 | 命令要点 | 结果 |
|---|------|----------|------|
| 1 | 源码形状闸门（vitest） | `node node_modules/vitest/vitest.mjs run packages-user/client-base/src/map/__test__/rendererGate.test.ts` | **40 passed / 40**（1 文件通过，约 7ms 用例耗时） |
| 2 | eslint | 对 5 个代码 / 测试文件直连 `node node_modules/eslint/bin/eslint.js` | **0 error / 0 warning**，退出码 0 |
| 3 | 类型闸门（本计划 4 个源码文件） | `node -e` 包裹 `vue-tsc --noEmit`（含完成性守卫） | `status 2 scoped 1 exempt 1 unexpected 0`，退出码 0 |
| 4 | 范围闸门 | `git status --porcelain -uall -- packages-user/client-base/src/map`（无 `.trim()`） | 恰好 7 条既有状态，退出码 0 |
| 5 | 哈希闸门 | 读取 `%TEMP%\gsd-09-35-hashes.txt`（2 行，UTF-8 无 BOM）逐字比较 | `renderer.ts` / `shader/map.frag` 哈希一致，退出码 0 |

类型闸门豁免原文（唯一一条，已打印、未修复）：

```
EXEMPT: packages-user/client-base/src/map/types.ts(14,10): error TS2305: Module '"@motajs/animate"' has no exported member 'TimingFn'.
```

说明：`vue-tsc` 退出码为 2 是因为上述用户自有基线诊断；闸门的完成性守卫确认它真正跑完（非 `r.error` / 非 `r.signal` / `status` 非 `null` / 非 0 退出且输出含 `error TS`），`scoped` 只取 `packages-user/client-base/src/map/` 下 4 个文件，`extension/hero.ts` 与 `renderer.ts` 的 `getLayerByAlias` 诊断由过滤自然排除，未参与判定。

范围闸门实测输出（前导空格完整）：

```
 M packages-user/client-base/src/map/moving.ts
 M packages-user/client-base/src/map/renderer.ts
 M packages-user/client-base/src/map/shader/map.frag
 M packages-user/client-base/src/map/status.ts
 M packages-user/client-base/src/map/types.ts
 M packages-user/client-base/src/map/vertex.ts
?? packages-user/client-base/src/map/__test__/rendererGate.test.ts
```

## 用例条数与增减

- 执行前：37 条用例（上一版含 6 条种类相关用例）。
- 执行后：**40 条**（改写 6 条为类 / 优先级 / `instanceof` 断言，新增 3 条状态类用例，其余保留）。
- 保留并对齐的既有测试侧漂移：4 条 `pendingAlpha` → `alphaMap`（`makes setStaticAlpha fully lazy` / `reads pending alpha before the instance array` / `covers pending, order and value in the overlay dirty flag` / `clears overlay members when the arrays are rebuilt`）、1 条 `a.layerIndex` → `getLayerIndex(a.layer)`。均为测试断言与源码对齐，无行为变化。

## Decisions Made

- 覆盖块优先级取值锁定静态 0、动态 1，与旧 `OverlayBlockKind` 的 `Static = 0` / `Dynamic = 1` 数值一致；比较器 `a.priority - b.priority` 的比较结果与旧 `a.kind - b.kind` 逐条相同。
- `vertex.ts` 的静态覆盖块每次排序新建 `StaticOverlayBlock` 实例（与旧对象字面量成本同阶），动态覆盖块直接复用 `MovingBlock` 实例，保证 `instanceof` 成立且仍指向同一 `index` 槽位。
- `sortOverlay()` 的既有 jsDoc 与函数内两行注释仍写 `kind` / `种类`；按 AGENTS.md「不得擅自修改既有注释」保持原文，记为 OI-3，待用户决定是否另行修订。
- 测试文件的 `it` 说明注释随用例改名 / 范围变化同步改写（AGENTS.md 豁免测试文件；dev.md 要求同步更新）。

## Deviations from Plan

### 1. [计划内闸门缺陷 - 子串碰撞] Task 1 形状闸门的 `no duplicate x/y` 判定误报

- **Found during:** Task 1 的 `<verify>` 源码形状闸门。
- **Issue:** 闸门用 `!m.includes('x: number = 0;') && !m.includes('y: number = 0;')` 判断 `moving.ts` 是否已删除重复的 `x` / `y` 字段；但 `moving.ts` 必须逐字保留的动画字段 `private dx: number = 0;` / `private dy: number = 0;` 含有子串 `x: number = 0;` / `y: number = 0;`，导致该判定在代码正确时恒为假（首轮 `shape checks 31 failed 1`）。
- **Fix:** 未改动任何源码来迁就闸门（`dx` / `dy` 必须保留）。用语义等价且更严格的「行锚定」判定替代该单条谓词（`/^[ \t]*x: number = 0;$/m` / `y` 同样），其余 30 条断言逐字不变，重跑 **`shape checks 31 failed 0`**。未删除、未放宽任何其它断言。
- **Files modified:** 无（仅临时脚本 `%TEMP%\gsd-09-35-task1-shape-anchored.cjs`）。
- **Verification:** 行锚定检查实测 `x/y` 字段声明已不存在；`private dx/dy` 仍在。

### 2. [Rule 3 - 阻塞] `status.ts` 需要 prettier 重排

- **Found during:** Task 1 完成后的 `prettier --check`。
- **Issue:** 新增的 `StaticOverlayBlock` 类声明 85 列，超过 `printWidth: 80`，prettier 要求折行。
- **Fix:** 对 `status.ts` 运行 `node node_modules/prettier/bin/prettier.cjs --write`（计划允许，仅排版）。结果为 `export class StaticOverlayBlock` / `extends OverlayBlock` / `implements IOverlayStaticBlock` 三行、`{` 独占一行，未加 `// prettier-ignore`。
- **Files modified:** `packages-user/client-base/src/map/status.ts`（仅格式）。
- **Verification:** 4 个源码文件与测试文件 `prettier --check` 全部通过；eslint 0 报错。

**Total deviations:** 1 计划闸门缺陷（以等价且更严格的锚定判定处理并如实报告）+ 1 格式重排（计划允许）。**Impact on plan:** 无行为变化、无范围扩大、无断言放宽。

## Issues Encountered

- `pnpm` 在本树已损坏（`packages-user/client-modules/package.json` 引用已删除的 `@motajs/legacy-ui`），所有门禁按计划直连 `node_modules` 二进制，未执行任何安装命令。
- 未修改 `STATE.md` / `ROADMAP.md`（用户指令），未运行任何 git 写命令（0 次提交），所有改动留在工作树供审查。

## 已知限制 / 未验证项

- **不做浏览器 UAT、无 WebGL E2E**：游戏当前不可运行，排序 / 组装 / 混合的视觉结果未验证；源码形状闸门通过 ≠ 渲染结果已验证。
- `types.ts(14,10) TS2305 TimingFn`（用户自有，不在修复范围）仍在；`extension/hero.ts` 的 `TS2305 state` 由类型闸门过滤排除。
- OI-3：`sortOverlay()` 旧注释仍写 `kind` / `种类`，按 AGENTS.md 未改。
- 估算未校准（`estimate.confidence: low`）；本次 `actuals.tokens` 为 diff 字符 / 4 的实测值，且该 diff 相对 HEAD，含执行前既有的未提交改动，不能直接当作纯增量的 token 成本。
- 计划编号 09-35 的原因：派发方给出的 09-27 / 波次 22 已被既有已执行计划占用（09-27..09-34），本计划改用下一个空闲编号 09-35 / 波次 30，未删除任何既有计划与摘要。

## Self-Check

- 5 个代码 / 测试文件全部存在且 CRLF 完整（bare LF = 0、无 BOM）。
- 五类门禁均实跑并记录真实数字；40/40 用例通过；类型闸门 `unexpected 0`。
- 未执行 git 写命令；工作树范围恰好为执行前既有 7 条状态。
- SUMMARY 已写入并仅使用 LF。

## Self-Check: PASSED
