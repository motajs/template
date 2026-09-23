---
phase: 04-render-adaptation
plan: 8
subsystem: render-texture
tags: [texture-manager, autotile-processor, block-cls-removal, read-only-impact, d38-d42]
requires:
  - phase: 04-render-adaptation
    provides: 04-01..04-07 前序增量（04-MATERIAL-INTERFACE-IMPACT.md / 04-07-SUMMARY.md 的版式、证据纪律与基线输入）
provides:
  - 04-TEXTURE-INTERFACE-IMPACT.md（`d36ea69` TextureManager 基准在 `packages-user` 消费者面的只读影响台账）
  - A/B/C/D/E/F 六类分列（A13 B8 C8 D9 E7 F8），每行含命中处 + 基准侧双 `file:line` 锚点
  - 旧名零命中机器证据（MaterialManager / renderAnimatedWith / getBlockClsByAlias / getIdentifierByAlias / getAliasByIdentifier）
  - 只读起始基线（porcelain 点对点快照）+ 类型门禁一致性（错误总行数）
affects: [04-render-adaptation]
actuals:
  tokens: 12513
  tasks: 3
  commits: 1
  plan_head_before: d74cc35
tech-stack:
  added: []
  patterns: [只读影响清点（D-40 第一步）, A–F 六类固定列序 + 每行双 file:line 锚点, 符号零命中以 git grep 为机器证据]
key-files:
  created:
    - .planning/phases/04-render-adaptation/04-TEXTURE-INTERFACE-IMPACT.md
  modified: []
key-decisions:
  - "只读清点唯一交付物为 04-TEXTURE-INTERFACE-IMPACT.md；A–F 六类分列，A/B 事实层、C 定位索引、D 待用户反馈、E 归用户加载面、F 待用户裁决"
  - "旧名 MaterialManager / renderAnimatedWith / getIdentifierByAlias / getAliasByIdentifier / getBlockClsByAlias 在 packages-user 源码面引用为 0（git grep 机器证据）"
  - "material/utils.ts 的 BlockCls 依赖归 D 类「用户自有面」（D-42），只登记不规划修改"
  - "texture 归属错误行数 23 与规划日一致；总错误行数由规划日 202 变为当日实测 263（差异源于用户并发数据端改动）"
  - "第二步（TextureManager 新接口适应实施）未规划；未提供任何被删接口的替代方案"
requirements-completed: []
duration: ~45min
completed: 2026-09-23
status: complete
---

# Phase 4 Plan 8: TextureManager 新接口影响范围清点 Summary

**以只读清点交付 `04-TEXTURE-INTERFACE-IMPACT.md`：把 `d36ea69` TextureManager 重构对 `packages-user` 消费者面的影响落成 A13/B8/C8/D9/E7/F8 六类台账（每行含命中处 + 基准侧双 `file:line` 锚点），旧名符号 `git grep` 零命中，六道门禁全绿；零生产代码改动。**

## Performance

- **Duration:** ~45min（含读取上下文；执行计时约 8min）
- **Started:** 2026-09-23
- **Completed:** 2026-09-23
- **Tasks:** 3（Task 0 为只读汇报关卡，用户已回复「可以执行」，不计入工作任务）
- **Files modified:** 1（唯一交付文档 `04-TEXTURE-INTERFACE-IMPACT.md`）

## Accomplishments

- 交付 `.planning/phases/04-render-adaptation/04-TEXTURE-INTERFACE-IMPACT.md`：元信息块 + 11 节（背景 / 方法 / 基准变更（d36ea69）/ 类型门禁实测基线 / A / B / C / D / E / F / 处置），全文 CRLF。
- `## 基准变更（d36ea69）` 定稿三类差异：改名 1 类（`MaterialManager` → `TextureManager`，构造器收紧为 4 参）；移除（`BlockCls` 枚举、`cls`→`tileType`、`IAutotileProcessor` 三方法合一、`renderAnimatedWith`→`renderAnimated`、`getIdentifierByAlias` / `getAliasByIdentifier` / `getBlockCls(ByAlias)` / `clsMap`、`IClientBase.autotile`、`create()` / `createMaterial()` / `createAutotile`）；新增 / 收紧（`tiles` / `autotile` / `tilesetReserve` / `tilesetUnit` / `getFrameCount`、四个 `add*` 参数、`flatten`、`AutotileType`、`IClientCoreConfig` 两必填字段）。同提交相邻变更（`core.ts` config / `entry-client` / `logger.json`）一并登记。
- A–F 六类横向补齐：A13（符号级；旧名 5 个源码面 0 引用 + `BlockCls` 3 import + `cls` 7 处读写 + `AutotileProcessor` 构造 1 处）；B8（签名级，四个 `add*` 调用点全部归 E）；C8（8 个定位文件，逐条交叉引用 A/B/D ID）；D9（被删无替代，每条明写「请用户反馈」）；E7（加载面仅报告 + `packages/` 零命中 + `src/` legacy 声明）；F8（未确定项，只登记不判定）。
- 类型门禁实测：**texture 归属 23 条**（与规划日一致）；总错误行数 **263**（规划日 202；差异 +61 源于用户并发数据端改动）。`## 类型门禁实测基线` 逐行列出全部 23 条 texture 归属错误，并把「加载既有 15」「其余既有 225」单列，明写划分口径须用户确认。
- 六道门禁全绿：只读基线 / 类型门禁一致性 / 类别门禁（A13 B8 C8 D9 E7 F8 + 双锚点 + 关键词 + 交叉引用 + 措辞）/ 符号零命中 / 既有计划保护 + 计划范围（`04-01..04-07-*` 未改写、无 `04-09+`、SUMMARY 落盘）/ CRLF。
- 生产代码零改动：`packages/**` / `packages-user/**` / `src/**` 的 porcelain 相对只读起始基线**零变化**（本 run 未 touch 任何生产文件）。

## Task Commits

1. **Task 1+2+3: TextureManager 新接口影响范围清点（只读）** - `docs(04-08): TextureManager 新接口影响范围清点（只读，D-38/D-40 第一步）` (docs) — 仅含 `04-TEXTURE-INTERFACE-IMPACT.md`、`04-08-PLAN.md`、`04-08-SUMMARY.md` 三个文件

_说明：按 04-08-PLAN 要求，Task 1（tracer）/ Task 2 为同一交付文档骨架与横向补齐的中间态，不单独提交；Task 3 定稿并完成全部门禁后一次原子提交三个规划文件。_

## Files Created/Modified

- `.planning/phases/04-render-adaptation/04-TEXTURE-INTERFACE-IMPACT.md` - 唯一交付文档（11 节 / A13 B8 C8 D9 E7 F8 / 每行双锚点 / CRLF）

## A–F 六类实际行数

| 类别 | 实际行数 | 门禁下限 | 关键结论 |
|---|---|---|---|
| A 符号改名与移除的引用点 | 13 | ≥ 5 | `TextureManager` 新名消费者 2 处；5 个旧名源码面 0 引用（`git grep` 证据）；`BlockCls` 3 处 import + `cls` 7 处读写；`AutotileProcessor` 构造 1 处 |
| B 成员与签名变化的调用点 | 8 | ≥ 4 | `ITextureManager` 新增 5 成员 + `IClientCoreConfig` 2 必填字段；四个 `add*` 调用点全在 `fallback/load.ts`（归 E） |
| C 地图渲染消费者定位索引 | 8 | ≥ 8 | 8 个定位文件，逐条交叉引用 A/B/D ID；未把 E 类或 `material/` 内命中写成 AI 工作项 |
| D 被删且无替代（需用户反馈） | 9 | ≥ 6 | `renderWithoutCheck`（3 调用点）+ `BlockCls` + `manager` + `renderWith`/旧 `render` + `getIdentifierByAlias`/`getAliasByIdentifier` + `getBlockCls(ByAlias)` + `IClientBase.autotile` + `create()`/`createMaterial()` + `material/utils.ts`（用户自有面）；每条含「请用户反馈」 |
| E 加载相关与添加素材（仅报告） | 7 | ≥ 4 | `fallback/load.ts` 9 条 TS2554 逐一列出；`load/loader.ts` 6 条属加载系统重构既有（与 `d36ea69` 无关）；`client.ts:93-96` 接线；`packages/` 零命中；`src/` legacy 声明 |
| F 未能从阅读确定（未猜测） | 8 | ≥ 8 | 8 条未确定项（`renderWithoutCheck` 替代 / `BlockCls` 改用什么 / `hero.ts:167` 的 `tileType` / 自建 vs `ITextureManager.autotile` / `textures`·`tileStore`·`tiles` 边界 / `textures` 写入侧 / 插件面 / `IBlockIdentifier`→`ArrayLike<number>`），只登记不判定 |

## 类型门禁实测基线（当日实测，HEAD `d74cc35`）

- 命令：`pnpm exec vue-tsc --noEmit`；口径：正则 `error TS\d+` 的匹配数
- **错误总行数：263**
- **texture 归属错误行数：23**（= `client-base` 1 条 `material/utils.ts:2` TS2305 + `client-modules` 22 条：`fallback/load.ts` 9 + `hero.ts` 2 + `renderer.ts` 5 + `vertex.ts` 6）
- **与规划日（2026-09-22 / HEAD `d36ea69` / 干净工作树）差异**：规划日总行数 **202** → 当日 **263**，差 **+61**；**texture 归属仍为 23（无变化）**。差异来源 = 用户并发进行中的数据端未提交改动（`packages-user/data-base` / `data-common` / `data-system`）。
- 三分类单列：texture 归属 **23**；加载系统重构既有 **15**（`load/loader.ts` 6 + `render/ui/load.tsx` 9）；其余既有 **225**。该划分为人工归类，**须用户确认**，**不由机器门禁断言**。

## 六道门禁结果（Task 3 终跑）

| 门禁 | 结果 |
|---|---|
| ① 只读门禁（porcelain 逐条一致 + REQUIREMENTS 未改 + REND 仍 Pending） | PASS（entries 0；REND-01/REND-02 still Pending） |
| ② 类型门禁一致性（重跑错误总行数 == 记录值） | PASS（tsc total unchanged 263） |
| ③ 类别门禁（A≥5/B≥4/C≥8/D≥6/E≥4/F≥8 + 双锚点 + 关键词 + 交叉引用 + 措辞） | PASS（A13 B8 C8 D9 E7 F8） |
| ④ 符号零命中复验（5 个旧名） | PASS（OK zero stale symbol references） |
| ⑤ 既有计划保护 + 计划范围（`04-01..04-07-*` 未改、无 `04-09+`、SUMMARY 落盘） | PASS（04-01..04-07 untouched; plans 04-01..04-08） |
| ⑥ CRLF | PASS（OK CRLF lines） |
| （Task 1 附）结构 / 基准关键词 / 类型基线 / A 行双锚点 / CRLF / 只读基线 | 六道全 PASS |

## 人工代码复核（Task 3 步骤 3，逐条打开当日源码）

- A 类 `BlockCls` 三处 import：`renderer.ts:10` = `    BlockCls,`；`hero.ts:15` = `import { BlockCls, IMaterialFramedData } from '@user/client-base';`；`vertex.ts:27` 同形 —— **命中处锚点指向确为该符号的引用**，基准侧 `material/types.ts` 现行导出不含 `BlockCls` —— 通过。
- `hero.ts:167` = `                cls: BlockCls.Unknown,`（`IMaterialFramedData` 对象字面量）—— 通过。
- `vertex.ts:852` = `        const { cls, frames, offset, texture } = block.texture;`（自 `IMaterialFramedData` 解构 `cls`）—— 通过。
- D 类 `renderWithoutCheck` 三处调用：`renderer.ts:1253` = `const renderable = this.autotile.renderWithoutCheck(`；`vertex.ts:461` = `const renderable = autotile.renderWithoutCheck(tile, connection);`；`vertex.ts:874` = `const renderable = this.renderer.autotile.renderWithoutCheck(` —— 均指向被删成员，接口上确无替代 —— 通过。
- `material/utils.ts:2` = `import { BlockCls } from './types';`（用户自有面命中，只登记）—— 通过。
- E 类 `fallback/load.ts` 9 处参数个数错误：`:76`/`:77` `addGrid` 期望 4 得 2；`:80`/`:81`/`:82`/`:83`/`:84` `addRowAnimate` 期望 4 得 3；`:95` `addAutotile` 期望 3 得 2；`:105` `addTileset` 期望 4 得 2 —— 通过。
- 基准侧锚点核对：`manager.ts:37` `TextureManager implements ITextureManager`、`manager.ts:84-89` 构造器 `(state, tiles, tilesetReserve, tilesetUnit)`、`manager.ts:90` `new AutotileProcessor(state)`；`autotile.ts:64` 类 / `autotile.ts:75` 单参构造器 —— 与文档一致 —— 通过。
- **结论：全部通过，未发现偏差，无修正项。**

## 只读基线与并发改动说明（重要）

- 规划日（2026-09-22）`git status --porcelain -- packages packages-user src` 为**空**；当日 0a 起始实测**非空（15 条）**，用户在本 run 期间持续编辑数据端，条目数一度增至 **22** 条，随后用户提交 `7743795 refactor: Hero equipment system` 与 `d74cc35 feat: Adding should replay flag`（均为数据端）后**归零**；门禁终跑时基线为「（无）」，entries **0**。
- 本 run 一律以「门禁当次实测」为只读起始基线（点对点快照），**不回滚 / 不暂存 / 不提交 / 不修改**用户的任何未提交改动；Task 1 / Task 3 门禁断言快照与当次实测**逐条一致**（终跑 entries 0）。
- 用户改动全部位于 `packages-user/data-base` / `data-common` / `data-system`，属数据端进行中的工作，**不在本计划改动范围内**；其提交未触及 texture 基准与本次清点的消费者文件（`git diff --stat e78309b HEAD -- packages-user/client-base/src/material packages-user/client-base/src/types.ts packages-user/client-modules/src/render/map packages-user/client-modules/src/fallback` 无输出），故文档行号在当日实测下有效。
- HEAD 由 0a 的 `e78309b` 前移至 `d74cc35`（仅用户数据端提交），texture 接口基准仍为 `d36ea69`。

## Deviations from Plan

### Auto-fixed / 环境适配 Issues

**1. [Rule 3 - Blocking] 只读基线随用户并发编辑持续增长，改为「点对点快照 + 当次实测」**
- **Found during:** Task 1 门禁（gate6 只读门禁）
- **Issue:** 0a 起始实测 15 条未提交改动；本 run 期间用户持续编辑数据端，实测条目增至 21 / 22 条，随后用户提交 `7743795` / `d74cc35` 后归零，使「porcelain 与起始记录逐条一致」无法稳定成立。这属**外部并发**（用户自己的数据端重构与提交），非本 run 造成。
- **Fix:** 依 plan assumptions「执行日以 Task 1 步骤 (0a) 当日实测为基线」，把只读基线更新为门禁当次的点对点快照（并同步更新文中条数），逐条原样记录；门禁随即转绿。**未改写任何门禁口径、未伪造通过**。
- **Files modified:** `04-TEXTURE-INTERFACE-IMPACT.md`（基线块与条数）
- **Verification:** gate6 / gate398 均 PASS（终跑 entries 0）。
- **Committed in:** 本次 docs 提交

**2. [Rule 3 - Blocking] 类型错误总行数随用户并发编辑变化，同步记录值**
- **Found during:** Task 3 类型门禁
- **Issue:** 记录值 264（Task 1 起始实测）在本 run 期间因用户数据端编辑变为 263；门禁断言「重跑 == 记录值」。
- **Fix:** 重跑 `pnpm exec vue-tsc --noEmit`，以当次实测 **263** 同步文档记录值（texture 归属保持 23 不变），并同步「差 +61 / 其余既有 225」。**texture 归属 23 与规划日一致**，只读证明不受影响。
- **Files modified:** `04-TEXTURE-INTERFACE-IMPACT.md`（类型门禁实测基线数字）
- **Verification:** gate400 PASS（tsc total unchanged 263）。
- **Committed in:** 本次 docs 提交

**3. [Plan-literal] 交叉引用改为完整 ID 形，且在正文中避免以 `` `## 方法` `` / `` `## 处置` `` 形式提前引用标题**
- **Found during:** Task 2 / Task 3 类别门禁
- **Issue:** (a) C 行原用短形 `→ A-06`，而门禁要求完整 `#04-08-A-06`；(b) 元信息块与类型基线正文曾以 `` `## 方法` `` / `` `## 处置` `` 字面引用标题，导致门禁的 `indexOf` 首次命中落在正文而非标题。
- **Fix:** C 行交叉引用统一改为完整 `#04-08-X-NN`；正文引用改为「方法」一节 / 「处置」一节。**不改变任何事实、结构或语义**。
- **Files modified:** `04-TEXTURE-INTERFACE-IMPACT.md`
- **Verification:** gate356 / gate402 PASS（A13 B8 C8 D9 E7 F8）。
- **Committed in:** 本次 docs 提交

**Deviation summary:** 3 项（2 项外部并发导致的基线同步、1 项格式 / 引用的 plan-literal 适配）；均未越出 plan 允许的范围（零生产改动、零方案、零 `04-09+`）。

## Issues Encountered

- 用户**并发手工重构数据端**（`packages-user/data-base` / `data-common` / `data-system`），工作树在清点期间持续变化。本计划已按 D-42 与 assumptions 的并发改动条款处置（只读、点对点快照、原样保留），未把用户的进行中工作当作缺陷登记，也未修复其引入的类型错误。

## 未实现 / 显式延后项

- **第二步（TextureManager 新接口适应实施）未规划**，待用户审阅本文件后另行规划（D-40）。本文件不含修复方案、不含代码改动建议、未产出任何 `04-09+` 或新 `*-PLAN.md`。
- D 类 9 项的替代方案、F 类 8 条的裁决点（`renderWithoutCheck` 替代 / `tileType` 取值 / 自建 processor 是否复用等）一律待用户裁决，**未由 AI 裁定**。
- `packages/` 与 `src/` 命中仅报告（D-33）；`material/` 与「加载相关」按 D-39 / D-41 / D-42 归用户。
- `core.*` legacy 适配（D-12，第五阶段）；移动控制（D-19）；跟随者（D-22）；`HeroRendering` 语义（D-18）。
- 本 run 未新增任何测试、未新增依赖、未改任何 `package.json` / `tsconfig.json`。

## 需求状态

`REND-01` / `REND-02` 在本 run 后仍保持 **Pending**：本计划只交付 TextureManager 新接口影响的**只读清点（D-40 第一步）**，既未实施 texture 接口适应，也未实施移动端 / 桌面端双布局（见 04-08-PLAN 的两条 FLAGGED ASSUMPTION）。`.planning/REQUIREMENTS.md` 未被改动，两需求行仍为 `Pending`。

## 运行时 UAT 不可得声明

本步为**只读清点**，不产生任何运行时行为（不启动渲染、不改代码、不新增测试）。承载体 = 只读门禁（porcelain 逐条一致）+ 类型门禁一致性（错误总行数等于记录值）+ 静态内容门禁（11 节结构 / A–F 行数下限与关键词 / 每行双锚点 / C 交叉引用 / D「请用户反馈」措辞 / E「仅报告」口径）+ 符号零命中复验（`git grep`）+ 既有计划保护与计划范围门禁 + CRLF + 人工代码复核。**除上述命令外不存在可运行门禁，未以任何无法运行的门禁冒充通过。**

## Self-Check

- 交付文档已落盘 `.planning/phases/04-render-adaptation/04-TEXTURE-INTERFACE-IMPACT.md`；11 节齐备；全文 CRLF。
- 六道门禁（Task 1 六道 / Task 3 六道）全部转绿；标志性输出：`OK headings 11`、`OK baseline tokens 23`、`OK tsc total 263 texture 23 listed 25`、`OK A rows 13`、`OK zero stale symbol references (5 names)`、`OK categories A13 B8 C8 D9 E7 F8`、`OK read-only unchanged entries 0; REND-01/REND-02 still Pending`、`OK 04-01..04-07 untouched; plans 04-01,...`、`OK CRLF`。
- 生产源码零改动（porcelain 逐条一致，条目全部为用户并发改动）。
- 提交仅含 `04-TEXTURE-INTERFACE-IMPACT.md` / `04-08-PLAN.md` / `04-08-SUMMARY.md` 三个文件。

---
*Phase: 04-render-adaptation*
*Completed: 2026-09-23*
