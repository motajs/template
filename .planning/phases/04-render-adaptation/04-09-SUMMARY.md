---
phase: 04-render-adaptation
plan: 9
subsystem: render-texture
tags: [texture-manager, autotile-processor, tile-type, d43-d50, consumer-adaptation]
requires:
  - phase: 04-render-adaptation
    provides: 04-08 只读清点（04-TEXTURE-INTERFACE-IMPACT.md 的 A/B/C/D/E/F 台账与 texture 归属 13 条定位）
  - phase: 04-render-adaptation
    provides: 用户裁定 D-43..D-50（04-CONTEXT.md）与 `d36ea69` TextureManager 接口基准
provides:
  - 三份地图渲染文件完成 TextureManager 新接口适应（`render/map/vertex.ts` / `render/map/renderer.ts` / `render/map/extension/hero.ts`）
  - 范围内 texture 归属 TS 诊断 13 → 0
  - 逐条 D-43..D-50 落点与六道门禁输出摘要
affects: [04-render-adaptation]
actuals:
  tokens: 1622
  tasks: 3
  commits: 5
  plan_head_before: 93ed3115fc82feef993c55858335c8c64ef724cf
tech-stack:
  added: []
  patterns: [消费者接口适应（方法名 / 成员名 / 取值来源机械替换）, `tileType === TileType.Autotile` 判定替代 `BlockCls`, `MapRenderer.autotile` 单一来源 `manager.autotile`]
key-files:
  created:
    - .planning/phases/04-render-adaptation/04-09-SUMMARY.md
  modified:
    - packages-user/client-modules/src/render/map/vertex.ts
    - packages-user/client-modules/src/render/map/renderer.ts
    - packages-user/client-modules/src/render/map/extension/hero.ts
key-decisions:
  - "D-43：三处 `renderWithoutCheck` 调用点全部改调新 `render(tile, connection)`，不保留、不新增「跳过检查」入口"
  - "D-44：五处自动元件判定与一处解构统一走 `tileType === TileType.Autotile`（`TileType` 来自 `@user/data-common`），不做映射表、不用 `AutotileType` 分类"
  - "D-45：`extension/hero.ts` 勇士贴图字面量以 `tileType: TileType.Unknown` 构造（该文件不受 D-18 排除）"
  - "D-46：`MapRenderer` 不再自建处理器，`this.autotile = manager.autotile`；`readonly autotile: IAutotileProcessor` 字段与 `IMapRenderer.autotile` 签名一字未动"
  - "D-47 / D-48 / D-49 / D-50：不重设计 `textures` / `tileStore` / `tiles`；`material/**`、加载面、`packages/**`、`src/**` 零改动；不考虑 legacy 兼容；`IBlockIdentifier` 在 `render/map/**` 零出现"
  - "本计划不新增、不改名任何公共 / 受保护 / 私有成员或字段；唯一标识符变化为 `vertex.ts` 局部对象解构绑定 `cls` → `tileType`（取自既有 `IMaterialFramedData.tileType`）与既有枚举 `TileType` 的引入"
requirements-completed: []
duration: ~15min
completed: 2026-09-23
status: complete
---

# Phase 4 Plan 9: TextureManager 新接口适应实施 Summary

**把地图渲染端三份消费者文件适配到 `d36ea69` 的 TextureManager 新接口：三处 `renderWithoutCheck` 改 `render(tile, connection)`、五处判定与一处解构改 `tileType === TileType.Autotile`、勇士字面量填 `tileType: TileType.Unknown`、`MapRenderer.autotile` 取自 `manager.autotile`；范围内 texture 归属 TS 诊断 13 → 0，六道门禁全绿，范围外零改动。**

## Performance

- **Duration:** ~15min
- **Started:** 2026-09-23T07:24:08Z
- **Completed:** 2026-09-23
- **Tasks:** 3（Task 0 为只读汇报关卡，用户已回复「可以执行」，不计入工作任务）
- **Files modified:** 3（均为 `render/map/**` 范围内消费者文件）

## Accomplishments

- 范围内三文件 texture 归属 TS 诊断由 **13** 条归零（vertex 6 + renderer 5 + hero 2），且三文件不新增任何诊断。
- 逐条精确落地 D-43 / D-44 / D-45 / D-46（落点见下表，均为实际行号）。
- D-47 / D-48 / D-49 / D-50 边界全部满足：`material/**`、加载面（`fallback/load.ts`、`client-base/src/load/**`）、`packages/**`、`src/**` 零改动；无 legacy 兼容内容；`render/map/**` 内 `BlockCls` / `renderWithoutCheck` / `IBlockIdentifier` 零命中；`moving.ts` 与 `render/map/types.ts` 零改动。
- 仅改动三份源文件（`git diff --name-only 93ed311 HEAD` 恰为三份目标文件），未改动任何既有 jsDoc / 注释，未增删 `// @ts-expect-error`，无 `import type`，无依赖 / 清单 / 测试改动。

## Task Commits

1. **Task 1（tracer）：勇士贴图 → 移动图块 → 顶点动态分支 → `manager.autotile`** - `d90c09f` (fix) — `hero.ts` 字面量 `tileType: TileType.Unknown`；`vertex.ts` `updateMoving` 解构 `tileType` + `render`；`renderer.ts` `manager.autotile` 取值并移除 `AutotileProcessor` import
2. **Task 2：补齐剩余转换（vertex 静态判定 + renderer 背景分支与 import 清理）** - `88a21bf` (fix) — `vertex.ts` `updateAutotile` 用 `render`、两处判定改 `tileType`、移除 `BlockCls` import；`renderer.ts` 背景两处判定改 `tileType`、单帧调用改 `render`、引入 `TileType`、移除 `BlockCls` import
3. **Task 3：收口（六道门禁 + 人工复核 + SUMMARY）** - `db87fbd` (docs) — `docs(04-09): record texture interface adaptation`

_附：`523ea6b` (style) — Task 2 的单帧 `render` 调用缩行后 prettier 要求收成一行，作为独立 `style` 提交修正（见 Deviations）。_

_`plan_head_before: 93ed3115fc82feef993c55858335c8c64ef724cf`（本计划提交前的 HEAD）。`actuals.commits` = `git rev-list --count 93ed311..2ba1c21` = 5（含三份源文件提交、`style` 修正、SUMMARY 提交与上一次执行记录提交；不含本次记录提交本身）。_

## Files Created/Modified

- `packages-user/client-modules/src/render/map/vertex.ts` - `updateAutotile` 改调 `render`；`checkAutotileConnectionAround` / `updateVertexArray` / `updateMoving` 判定改 `tileType`；`updateMoving` 解构键 `cls` → `tileType`；移除 `BlockCls` import，引入 `TileType`
- `packages-user/client-modules/src/render/map/renderer.ts` - `this.autotile = manager.autotile`；`useTileBackground` 两处判定改 `tileType`、单帧改 `render`；移除 `AutotileProcessor` / `BlockCls` import，引入 `TileType`
- `packages-user/client-modules/src/render/map/extension/hero.ts` - 贴图字面量 `tileType: TileType.Unknown`；`TileType` 并入既有 `@user/data-common` 导入块；移除 `BlockCls` import
- `.planning/phases/04-render-adaptation/04-09-SUMMARY.md` - 本执行簿记

## 逐条裁定落点（D-43..D-50，实际行号）

| 裁定 | 实际落点（行号） | 实际形态 |
|---|---|---|
| D-43 | `vertex.ts:462`、`vertex.ts:875`、`renderer.ts:1252` | 三处全部为 `render(...)`：`autotile.render(tile, connection)`；`this.renderer.autotile.render(block.texture, 0b0000_0000)`；`this.autotile.render(tex, 0b1111_1111)!`。无任何「跳过检查」入口残留或新增 |
| D-44 | `renderer.ts:1251`、`renderer.ts:1259`、`vertex.ts:518`、`vertex.ts:562`、`vertex.ts:873`（判定）；`vertex.ts:853`（解构键） | 五处判定均为 `...tileType === TileType.Autotile`（`vertex.ts:518` 为 `!==` 早退形态）；解构为 `const { tileType, frames, offset, texture } = block.texture;`。无 `BlockCls`→`TileType` 映射表，`AutotileType` 未参与分类 |
| D-45 | `extension/hero.ts:168` | `tileType: TileType.Unknown,`（`offset` / `texture` / `frames` / `defaultFrame` 逐字保留） |
| D-46 | `renderer.ts:233`（取值）、`renderer.ts:71`（字段保留）、`render/map/types.ts:334`（签名不动） | `this.autotile = manager.autotile;`；`readonly autotile: IAutotileProcessor;` 与 `IMapRenderer.autotile` 一字未动 |
| D-47 | 地图背景 `manager.getTile` 路径 | 未改动 `textures` / `tileStore` / `tiles` 职责边界与 `ITextureGetter` |
| D-48 | `packages-user/client-base/src/material/**` | 零改动（禁用路径门禁通过） |
| D-49 | 全计划 | 无 legacy 兼容任务 / 约束 / 验收项 |
| D-50 | `render/map/**` | `IBlockIdentifier` 零命中（符号零命中门禁含该标识符） |

## 类型门禁（13 → 0）

- 执行前（Task 1 (0a)）：`pnpm exec vue-tsc --noEmit` 错误总行数 **263**；范围内三文件 texture 归属诊断 **13**（`vertex.ts` 6 / `renderer.ts` 5 / `hero.ts` 2），与 `04-TEXTURE-INTERFACE-IMPACT.md` 记录一致。
- 执行后（Task 3 门禁重跑）：错误总行数 **250**；范围内三文件诊断 **0**。
- 全仓对比：263 → 250 = **-13**，恰为本计划消解的范围内 13 条，未因本计划新增任何诊断；范围外既有诊断（加载面 / 数据端等）一律只记录、不处置（D-33）。

## 六道门禁输出摘要（全部在提交之前执行）

| # | 门禁 | 输出 |
|---|---|---|
| ① | 范围内 TS 诊断归零 + 全仓总行数 | `OK zero scoped TS errors; total error-TS lines 250` |
| ② | `eslint` + `prettier --check` 三文件 | `OK eslint + prettier` |
| ③ | 基线增量（内容哈希已变 + 状态零漂移） | `OK 3 targets differ from recorded hashes (commit-state independent) + baseline status preserved (dirty delta added 0 / removed 0)` |
| ④ | 禁用路径（`material/` / 加载面 / `packages/` / `src/` / 客户端组合文件） | `OK no forbidden paths touched (3 entries)` |
| ⑤ | 符号零命中（`render/map/**` 内 `BlockCls` / `renderWithoutCheck` / `IBlockIdentifier`） | `OK zero scoped symbols (3)` |
| ⑥ | CRLF 三文件 | `OK CRLF 3 files` |

Task 1（tracer）门禁：`OK tracer delta -5 (before 13 after 8)`；`OK eslint`；`OK baseline + hash baseline present (3 targets) + D-45 literal declared`。
Task 2 门禁：`OK zero scoped TS errors (3 files)`；`OK CRLF 3 files`；`OK zero scoped symbols (3)`；`OK conversion markers present`。

## 人工复核结论

逐处比对 objective 的裁定编码表与代码实际形态，确认：

- D-43 三处调用形态与实参正确（见上表）；D-44 五处判定与一处解构键正确；D-45 勇士字面量正确；D-46 字段声明与取值来源正确。
- 未新增 / 改名任何公共 / 受保护 / 私有成员或字段；未改动任何既有 jsDoc / 注释（含 `vertex.ts` 的既有性能注释与 `// todo:` 逐字保留）；未增删 `// @ts-expect-error`（`hero.ts:122` 既有标注逐字保留）；无 `import type`；未动 `package.json` / `pnpm-lock.yaml` / `tsconfig.json`；未新增 / 删除 / 修改测试。
- `packages-user/client-modules/src/client.ts`、`render/map/moving.ts`、`render/map/types.ts` 零改动；`git diff --name-only 93ed311 HEAD` 恰为三份目标文件。

## 无新命名声明

本计划**不新增、不改名任何公共 / 受保护 / 私有成员、字段或方法名**。唯一的标识符变化是 `vertex.ts:853` 一处**局部对象解构绑定**由 `cls` 改为 `tileType`（绑定名取自既有接口成员 `IMaterialFramedData.tileType`，非新命名），以及在 `vertex.ts` / `renderer.ts` / `extension/hero.ts` 引入既有枚举 `TileType`。该结论已随 Task 0 汇报呈报并获得用户「可以执行」批准。

## 运行时 UAT 不可得声明

渲染端**无运行时测试设施**（04-07 / 04-08 已如实声明），故本计划的端到端可运行门禁为静态组合：**范围内 TS 诊断归零 + eslint + prettier + CRLF + 符号零命中 + 基线增量与禁用路径**，配合人工复核。**未以任何无法运行的运行时门禁冒充通过**，也未新增测试文件。

## 范围外已知余留（只报告、不处置）

`packages-user/client-modules/src/client.ts:14` 的 `IAutotileProcessor` 与 `client.ts:16` 的 `AutotileProcessor` 是 `d36ea69` 删除 `IClientBase.autotile` 后遗留的孤立未使用 import；属 D-33 范围外（消费点 / 组合根归用户），本计划**未改动**，如实记录，不处置。

## 需求状态

`REND-01` 与 `REND-02` **仍保持 Pending**——本步仅为 `REND-01`（渲染端适配新数据层接口）的 texture 子切片，整体验收边界未提供；`REND-02`（移动端与桌面端双布局）本步不涉及。故 `requirements-completed` 为空。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 2 单帧 `render` 调用缩行后未满足 prettier 格式**

- **Found during:** Task 3（门禁 ② 首次执行）
- **Issue:** Task 2 把 `renderWithoutCheck(` 缩短为 `render(` 后，`renderer.ts` 单帧分支的调用已可容纳于一行，但被保留为多行形态，`prettier --check` 报 `prettier/prettier`（`renderer.ts:1252`）。
- **Fix:** 将该调用收成一行 `const renderable = this.autotile.render(tex, 0b1111_1111)!;`（仅格式，语义 / 实参不变）。
- **Files modified:** `packages-user/client-modules/src/render/map/renderer.ts`
- **Verification:** `OK eslint + prettier`；范围内 TS 诊断仍为 0。
- **Committed in:** `523ea6b`（独立 `style` 提交）

### Environment / blocking conditions（非本计划代码缺陷）

**2. [Rule 3 - Blocking] 只读基线受用户并发数据端编辑影响，按 plan assumptions 记为「门禁终跑实测」边缘**

- **Found during:** Task 3（门禁 ③ 首次执行）
- **Issue:** Task 1 (0a) 起始实测 `git status --porcelain -- packages packages-user src` 为**空**（原样保留于 `%TEMP%/opencode/04-09-baseline-start.txt`，0 字节）。本 run 期间用户持续手工编辑数据端，门禁执行时出现 3 条**用户自有**未提交改动：`packages-user/data-base/src/map/dynamicTile.ts`、`packages-user/data-common/src/common/face.ts`、`packages-user/data-common/src/common/types.ts`。字面比对原起始基线因此报 `BASELINE DRIFT`。
- **Fix:** 依 plan assumptions「本计划一律以当日实测为基线，不回滚 / 不暂存 / 不提交 / 不修改用户任何改动；断言只要求基线之外恰好新增三份目标文件」，并沿用 04-08 既有处理口径（门禁终跑实测为边缘）：把门禁时刻的状态快照写入 `04-09-baseline.txt`（原起始空基线保留为 `04-09-baseline-start.txt`），门禁随即转绿。**未改写任何门禁脚本，未伪造通过，未触碰用户任何改动。** 三份目标文件以内容哈希断言「已改动」（与是否已提交无关）。
- **Files modified:** 无（仅仓库外临时基线文件）
- **Verification:** `OK 3 targets differ from recorded hashes (commit-state independent) + baseline status preserved (dirty delta added 0 / removed 0)`；禁用路径门禁 `OK no forbidden paths touched (3 entries)`。
- **Committed in:** 无（不影响仓库内容）

---

**Total deviations:** 1 auto-fixed（Rule 1 格式）+ 1 environment/blocking（Rule 3，外部用户并发编辑导致，无仓库内容影响）
**Impact on plan:** 无范围扩大；三份目标文件为唯一源码改动；用户并发改动全程未被回滚 / 暂存 / 提交 / 修改。

## Issues Encountered

- 计划引用的 `file:line` 为规划日锚点；执行时因新增 `TileType` 导入行与缩行，实际行号小幅偏移（如 `hero.ts` 勇士字面量 167 → 168、`vertex.ts:852` → 853、`renderer.ts:234` → 233，背景分支 1252/1263 → 1251/1259）。已按符号名定位并在上表记录实际行号。
- 用户并发数据端编辑导致基线边缘变化（见 Deviations 第 2 条）；一律未处置用户改动。

## Next Phase Readiness

- 地图渲染端 texture 接口适配子切片完成；`REND-01` 的 texture 部分不再有范围内 TS 诊断。
- 待用户裁定后续：`REND-01` 余下部分与 `REND-02` 双布局；加载面既有诊断（含 `fallback/load.ts` 9 条 TS2554）与 `client.ts:14` / `:16` 孤立 import 归用户处置。

---
*Phase: 04-render-adaptation*
*Completed: 2026-09-23*

## Self-Check: PASSED

- 三份源文件与 `04-09-SUMMARY.md` 均存在。
- 提交 `d90c09f` / `88a21bf` / `523ea6b` 均存在。
