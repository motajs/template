---
phase: 04-render-adaptation
plan: 6
subsystem: render
tags: [material, ITextureManager, ITextureGetter, big-image, read-only-audit, interface-impact, client-base, client-modules]
requires:
  - phase: 04-render-adaptation
    provides: "04-01 只读对账账本 / 04-02 勇士移动接口探索 / 04-03、04-04 增量 / 04-05 收口；本计划基线为 `4e305e3 refactor(type): material types.` 的 material 接口改动（D-30/D-31/D-32 第一步）"
provides:
  - "material 接口（`4e305e3` 基准）在 `packages-user` 全量的只读影响台帐 `04-MATERIAL-INTERFACE-IMPACT.md`（11 节 / A–F 六类 / 每行双 file:line 锚点）"
  - "A 类：7 个已移除符号的引用点（`getIfBigImage` 7 处 + `bigImageStore` 1 处 + `getBigImage` 1 处 + `IBigImageReturn` import 1 处；`setBigImage`/`isBigImage`/`getBigImageByAlias` 消费者侧 0 处）"
  - "B 类：三个旧接口名源码面 0 命的机器证据"
  - "C 类：5 项新增/收紧约束未实现（`textures` + 四个实现类缺 `state`），带当日实测错误码"
  - "D 类：`MaterialManager` big-image 实现残留 10 项 + `cache.ts` legacy 概念路径"
affects: [material-adaptation, client-base, client-modules, phase-5-legacy]
tech-stack:
  added: []
  patterns:
    - "只读清点台账范式：固定列序 `ID | 接口/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信` + 每行 ≥2 个 file:line 锚点 + A（消费者调用点）/ D（实现残留与 legacy 概念路径）分列互引 + F 类只登记不判定"
key-files:
  created:
    - .planning/phases/04-render-adaptation/04-MATERIAL-INTERFACE-IMPACT.md
  modified: []
key-decisions:
  - "唯一交付物为只读清点文档；生产源码零改动（`packages`/`packages-user`/`src` 的 porcelain 自空基线起逐条一致），不触碰用户并发未提交改动（`04-CONTEXT.md`）"
  - "A/D 分列写死：A 记消费者调用点（`client-modules` + `manager.ts:20` import），D 记 `client-base` 内已不属接口的实现残留与走 legacy 全局的 `cache.ts` 概念路径；同一成员两侧互引"
  - "`state` 的注入方式、`textures` 的承担者、`getIfBigImage` 的替代一律进 F 类，不作裁定（D-23 亦约束新增代码不得取全局单例）"
  - "第二步（material 接口适应实施）未规划，待用户审阅本文件后另行规划（D-32）；不产出任何 `04-07+` 计划"
  - "`cache.ts` 的 legacy bigImage 路径归属（本 material 增量 vs Phase 5 legacy 清退）进 F 类，不提清退计划（D-12 边界）"
requirements-completed: []  # REND-01 / REND-02 本 run 后仍保持 Pending（只清点、未实施适配/双布局）
actuals:
  tokens: 10847
  tasks: 4
  commits: 1
  plan_head_before: 58a8e6806eb9e33334d30dce4e6e367804d4eb51
metrics:
  duration: ~60min
  completed: 2026-09-22
  status: complete
---

# Phase 04 Plan 06: material 接口影响范围清点（只读）Summary

**在 `4e305e3` 的 material 接口基准下，对 `packages-user` 全量做只读影响清点：产出 11 节 / A–F 六类的 `04-MATERIAL-INTERFACE-IMPACT.md`（7 个已移除符号的引用点、3 个改名接口的 0 命中证据、5 项新增/收紧约束未实现、`MaterialManager` 与 `cache.ts` 的 big-image 残留、范围外仅报告、未确定项只登记），生产源码零改动。**

## Performance

- **Duration:** ~60min
- **Started:** 2026-09-22
- **Completed:** 2026-09-22
- **Tasks:** 4（Task 0 汇报关卡由用户在会话内回复「可以执行」闭环 + Task 1（tracer）/ 2 / 3）
- **Files modified:** 1 交付文档（`04-MATERIAL-INTERFACE-IMPACT.md`）+ 本 SUMMARY；生产源码 0

## 执行前核对（Task 1 步骤 0a/0b 前置）

逐条打开当日工作树核对（结论 + `file:line`）：

| # | 复核项 | 结论 | 锚点 |
|---|--------|------|------|
| ① | 7 个已移除符号确不在 `material/types.ts` 现行导出/成员集合中 | 一致（`IBigImageReturn` 无定义；`ITextureGetter` 无 `isBigImage`/`getBigImage`/`getIfBigImage`；`ITextureAliasGetter` 无 `getBigImageByAlias`；`ITextureManager` 无 `setBigImage`/`bigImageStore`） | packages-user/client-base/src/material/types.ts:196,228,260 |
| ② | 改名后名称与新增约束的现行位置 | 一致（`ITextureManager` `:260`、`ITextureGetter` `:196`、`ITextureAliasGetter` `:228`、`readonly textures` `:262-263`、四处 `extends ICoreStateExtended` `:104`/`:260-261`/`:430`/`:462-463`） | packages-user/client-base/src/material/types.ts |
| ③ | `ICoreStateExtended` 定义源 | 一致 | packages-user/data-state/src/types.ts:45-49 |
| ④ | 四个实现类缺 `state`、`MaterialManager` 缺 `textures` | 一致 | packages-user/client-base/src/material/{manager.ts:38-43, autotile.ts:42, builder.ts:12, builder.ts:99} |
| ⑤ | `client-modules` 侧 9 处调用点当日行号 | 一致（`door.ts:36,46`；`hero.ts:239,364,428`；`renderer.ts:652,653,1250`；`vertex.ts:546`） | packages-user/client-modules/src/render/map/{extension/door.ts, extension/hero.ts, renderer.ts, vertex.ts} |
| ⑥ | `cache.ts` 与 `src/types/declaration/*` 命中行号 | 一致（`cache.ts:36,48,144,153,157,159-160,190,215,243,276`；`enemy.d.ts:65`/`core.d.ts:1286`/`map.d.ts:354,1443`/`status.d.ts:391`） | 见清点文档 D / E 类 |
| ⑦ | `packages/` 零命中 | 一致（`git grep -n -i bigImage -- packages` 无输出，退出码 1） | — |
| ⑧ | `pnpm exec vue-tsc --noEmit` 当日总数与 material 子集 | 一致（**199 / 19**，与规划日相同） | 见「类型门禁实测基线」 |

**结论：** 八项均与规划基线一致，可继续执行。

## 执行前基线（Task 1 步骤 0a/0b）

初始只读基线（`git status --porcelain -- packages packages-user src`）**原样**记录：

<!-- READONLY-BASELINE:START -->
（无）
<!-- READONLY-BASELINE:END -->

当日工作树内唯一的未提交改动为 `.planning/phases/04-render-adaptation/04-CONTEXT.md`（不在该路径集合内），属用户既有改动。**未回滚 / 未暂存 / 未提交 / 未修改**任何用户改动。

## 类型门禁实测基线（Task 1 步骤 0b）

`pnpm exec vue-tsc --noEmit`（整仓非 0 退出属预期）；统计口径 = 输出中正则 `error TS\d+` 的匹配数：

- **错误总行数**：199
- **material 相关错误行数**：19

**与规划日一致**（规划日 199 / 19）。19 = `client-base` 7 条（`material/autotile.ts:42` TS2420、`material/builder.ts:12` TS2420、`material/builder.ts:91` TS2741、`material/builder.ts:99` TS2420、`material/manager.ts:20` TS2305、`material/manager.ts:38` TS2420、`material/manager.ts:86` TS2741）+ `client-modules` 12 条（`client.ts:84` TS2739、`client.ts:85` TS2741、`render/map/extension/door.ts:36,46` TS2339、`hero.ts:239,364,428` TS2339、`render/map/renderer.ts:234` TS2741、`render/map/renderer.ts:652,653` TS2551、`render/map/renderer.ts:1250` TS2339、`render/map/vertex.ts:546` TS2339）。非 material 180 条（含加载系统重构 16 条：`client-base/src/load/loader.ts` 6 + `client-modules/src/core.ts:6` 1 + `render/ui/load.tsx` 9）与本次改动无关，已在文档中单列。

**口径说明：** 「material / 非 material」的划分为**规划日人工归类**，须用户审阅时确认；门禁只覆盖**错误总行数**。

## 交付文档 A–F 实际行数与核对结论

| 类别 | 实际数量 | 核对结论 |
|---|---|---|
| `## 基准变更（4e305e3）` | 移除 **7** 符号 / 改名 **3** 接口 / 新增 `textures` + **4** 处 `ICoreStateExtended` | 逐条覆盖，含现行基准侧锚点与定义源 `data-state/src/types.ts:45-49` |
| A（已移除符号引用） | **12** 行（7 符号全覆盖） | `getIfBigImage` 7 处调用点 + `bigImageStore` 1 + `getBigImage` 1 + `IBigImageReturn` import 1；`setBigImage`/`isBigImage`/`getBigImageByAlias` 显式登记「调用点 0 处」 |
| B（改名剩余引用） | 源码面 **0** 命中 | 三个旧名逐个给 0 命中结论 + 原样核对命令；`.planning/graphs/*` 过期标签单列 |
| C（约束未实现） | **5** 行 | `textures` 1 + 四个实现类缺 `state` 4；带基准侧/实现侧锚点与实测错误码 |
| D（big-image 残留） | **12** 行 | `MaterialManager` 10 项 + `cache.ts` legacy 概念路径 2 条记录；A/D 互引；`cache.ts` 标注「不走 `ITextureManager`、不导致 material 类型错误」 |
| E（范围外仅报告） | **8** 行 | 5 处 `src/types/declaration/*` + `packages/` 零命中 + `.planning/graphs/*` 过期标签 + `client-base/package.json` 未声明 `@user/data-state` |
| F（未从阅读确定） | **6** 条 | 覆盖 `getIfBigImage` 替代 / `textures` 承担者 / `state` 注入 / `cache.ts` 归属 / `setDefaultFrame` 耦合 / `graphs` 重建；均只登记不判定 |

## 机器门禁输出摘要（六道门禁全部转绿）

以等价脚本执行计划内联门禁（逻辑与计划内联脚本逐字一致；PowerShell 对嵌套引号转义有困难，故落为等价脚本，同 04-05 既有惯例）：

- **只读门禁**（`git status --porcelain -- packages packages-user src` 与 `## 方法` 记录逐条一致）：`OK read-only baseline verbatim entries 0`（exit 0）
- **类型门禁一致性**（重跑 `pnpm exec vue-tsc --noEmit` 断言错误总行数等于记录值）：`OK tsc total unchanged 199 material 19`（exit 0）
- **类别门禁**（A/C/D/E 行数下限 + 每行双锚点 + 关键词 + B 三个旧名 + F ≥5 + `## 处置`）：`OK category gate: A=12 C=5 D=12 E=8 F=6`（exit 0）
- **B 类 0 命中复验**：`OK zero stale material names in source (git grep status 1)`（exit 0）
- **既有计划保护 + 计划范围门禁**：`04-05-PLAN.md` / `04-05-SUMMARY.md` porcelain 为空；phase 目录 `-PLAN.md` 仅 `04-01..04-06`；`04-06-SUMMARY.md` 已落盘（exit 0）
- **CRLF 门禁**：`OK CRLF lines`（交付文档 `\n` 总数 = `\r\n` 总数，无孤立 LF）
- **静态结构门禁（Task 1）**：11 个二级标题齐备、`只读起始基线` 已记录、`4e305e3` 已登记、基准关键词 15 个齐备、A 行双锚点齐备 —— 全绿

## 人工代码复核（Task 3 步骤 3）

抽查并逐条打开当日源码确认「命中处锚点指向的确实是该成员的引用」「基准侧锚点指向的确实是该接口的现行行」：

1. A 类 `hero.ts` 三处：`hero.ts:239`（`getIfBigImage(nextTile?.identifier ?? block.tile)`）、`:364`（`getIfBigImage(faced?.face ?? image)`）、`:428`（`getIfBigImage(nextFace.identifier)`）—— 均为 `this.renderer.manager.getIfBigImage(...)` 调用，`manager` 类型为 `ITextureManager`（`renderer.ts:217`），基准 `ITextureGetter`（`types.ts:196-226`）确无该成员。**通过**。
2. A 类 `vertex.ts:546`：`const tile = this.renderer.manager.getIfBigImage(num);` —— 确为引用点。**通过**。
3. D 类 `manager.ts:552-593` 五个方法：`setBigImage`（`:552-573`）/ `isBigImage`（`:575-577`）/ `getBigImage`（`:579-581`）/ `getBigImageByAlias`（`:583-587`）/ `getIfBigImage`（`:589-593`）逐条确认实现形态与文档锚点一致，且均不在现行 `ITextureManager` 上。**通过**。
4. D 类 `cache.ts:159-160`：`if (bigImage) { const image = core.material.images.images[bigImage]; ... }` —— 确为经 `core.*` legacy 全局读取，**不走 `ITextureManager`**、不产生 material 类型错误。**通过**。

**复核结论：通过**，未发现偏差，无需修正。

## Deviations from Plan

### Auto-fixed / 执行取舍

**1. [执行取舍 - 非计划偏差] 类型基线两条数字的「机器比对形式」补一行**

- **Found during:** Task 1（`## 类型门禁实测基线` 落笔后跑门禁）
- **Issue:** 计划 Task 1 步骤 (0b) 要求 bullet **逐字**写 `- **错误总行数**：<N>`，但同一任务的 `<automated>` 门禁正则 `错误总行数：(\d+)` 要求 `错误总行数` 与 `：` **连续**（Markdown 粗体 `**` 会打断匹配）——两者对同一行的形态要求冲突。这不是生产代码问题，属文档排版与门禁正则的形态冲突。
- **Fix:** **保留**逐字 bullet（`- **错误总行数**：199` / `- **material 相关错误行数**：19`），并**追加一行**「机器比对形式」`错误总行数：199；material 相关错误行数：19`，使门禁正则取得同日实测值。未改动门禁口径、未伪造数字。
- **Files modified:** `.planning/phases/04-render-adaptation/04-MATERIAL-INTERFACE-IMPACT.md`
- **Verification:** Task 1 / Task 3 类型基线门禁均转绿（`OK tsc total 199 material 19`）。
- **Committed in:** 本计划提交（单次 `docs(04-06): ...`）

**2. [环境 - 非执行者改动] PowerShell 对嵌套引号转义困难，门禁以内联等价脚本执行**

- **Found during:** Task 1 / 3 执行计划内联 `node -e "..."` 门禁时
- **Issue:** 计划内联脚本含大量嵌套引号 / 正则，直接在 PowerShell 中调用易被错误解析（04-05 已记录同类困难）。
- **Fix:** 将计划内联脚本逻辑**逐字**落为等价 `.js` 脚本执行（逻辑一致，`node -e` 与脚本文件等价）。未改门禁口径。
- **Files modified:** 无（仅执行方式；脚本置于工作区外临时目录，未纳入提交）
- **Verification:** 六道门禁输出与计划 `<fails_when>` 语义一致。
- **Committed in:** 无

---

**Total deviations:** 1 执行取舍（文档排版与门禁正则冲突，已双形态兼容）+ 1 环境事项（等价执行入口）。**无计划偏差、无范围蔓延。**

## Issues Encountered

- 无功能性问题。唯一需要处理的是类型基线两条数字的形态冲突（见上）。
- **运行时不可得（诚实降级）：** 本步为只读清点，**无任何运行时行为可观察**（不启动渲染、不改代码、不新增测试）。承载验证为「只读门禁 + 类型门禁一致性 + 静态内容门禁 + B 类 0 命中复验 + 既有计划保护/计划范围门禁 + CRLF 门禁 + 人工代码复核」。**未以任何无法运行的门禁冒充通过。**

## 与规划日的差异说明

- 类型错误总行数与 material 子集：当日 **199 / 19**，规划日 **199 / 19**，**无差异**。
- 只读起始基线：当日 `packages` / `packages-user` / `src` 的 porcelain 为**空**，与规划日（「（无）」）一致，**无差异**。
- 工作树 HEAD 为 `58a8e68`（规划日基准提交为 `4e305e3`）；`4e305e3` 之后仅有 `.planning/` 计划簿记提交，**生产源码未再改动**，故所有行号锚点与规划日一致。已在清点文档元信息块与 `## 基准变更（4e305e3）` 如实记录。

## Files Created/Modified

- `.planning/phases/04-render-adaptation/04-MATERIAL-INTERFACE-IMPACT.md` — 唯一交付物：material 接口影响只读台账（11 节 / A–F 六类）
- `.planning/phases/04-render-adaptation/04-06-SUMMARY.md` — 本文件（执行簿记）
- 生产源码：**0 改动**（`packages/**`、`packages-user/**`、`src/**` 与用户并发改动一律未触碰）

## Task Commits

- 本计划按 PLAN 规定以**单次**提交落盘（文档 + 本 SUMMARY）：`docs(04-06): material 接口影响范围清点（只读，D-30/D-31/D-32）`
- `04-05-PLAN.md` / `04-05-SUMMARY.md` 未被改写 / 覆盖 / 改号
- `STATE.md` / `ROADMAP.md` 由编排器在返回后统一处理，本 run 不写（与 04-05 惯例一致；PLAN 亦限定只写三份 `04-06` / 交付文档）

## 未实现项清单（显式延后）

- 第二步 **material 接口适应实施**（A / C / D 三类待处置项的修复）——**未规划**，待用户审阅本清点文件后另行规划（D-32）。
- F 类 6 项待用户裁决（`getIfBigImage` 替代 / `textures` 承担者 / `state` 注入 / `cache.ts` 归属 / `setDefaultFrame` 耦合 / `graphs` 重建）。
- `core.*` legacy 适配（D-12，第五阶段）、移动控制（D-19）、跟随者（D-22）、`HeroRendering` 语义（D-18）。
- 移动端 / 桌面端双布局（REND-02）。

## REND-01 / REND-02 状态

REND-01 / REND-02 在本 run 后**仍保持 Pending**：本计划只清点 material 接口的影响面，既未实施 material 适应，也未实施移动端 / 桌面端双布局。两条 FLAGGED ASSUMPTION 的验收边界仍未提供，用户须在推进第二步与其余渲染适配前补齐。

## Next Phase Readiness

- material 接口的一手影响台账已就绪，用户可据此审阅 A / C / D 三类待处置项与 F 类待裁决项，并规划第二步 material 接口适应。
- 阻塞项：第二步的规划取决于用户对 F 类 6 项的裁决（尤其 `state` 的注入方式与 `textures` 的承担者）。

## Self-Check

- 交付文档存在（`.planning/phases/04-render-adaptation/04-MATERIAL-INTERFACE-IMPACT.md`），11 个二级标题齐备，全文 CRLF。
- 生产源码零改动（`git status --porcelain -- packages packages-user src` = 空，与起始基线逐条一致）。
- 本 SUMMARY 与清点文档已随本计划提交落盘。

---

*Phase: 04-render-adaptation*
*Completed: 2026-09-22*
