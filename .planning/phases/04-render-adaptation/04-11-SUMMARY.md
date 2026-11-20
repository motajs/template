---
phase: 04-render-adaptation
plan: 11
subsystem: render-structure
tags: [structure-migration, client-base, client-modules, move, d58-d68, ts-expect-error, barrels]
requires:
  - phase: 04-render-adaptation
    provides: 用户裁定 D-58..D-68（04-CONTEXT.md）与移植集合 / 目标布局 / 引用调整清单
  - phase: 04-render-adaptation
    provides: 04-10 第一步只读影响台账 04-STRUCTURE-MIGRATION-IMPACT.md（A9/B9/C8/D10/E6/F10）与 04-01..04-10 既有产物
provides:
  - 39 个通用渲染文件由 client-modules/src/render/ 移入 client-base/src/（components 13 / elements 5 / map 20 / layout.ts 1），原件删除（MOVE）
  - client-base/src/layout/{layout,index}.ts 与 client-base/src/shared/{shared,index}.ts 新增（D-58 / D-61）
  - client-base/src/index.ts 新增 5 条桶导出；14 个实现层消费者改指 @user/client-base（D-63）
  - client-base/package.json 新增 5 条 workspace:* 依赖 + 根 pnpm i（lockfile importer 同步，D-66）
  - 10 处带原因的 // @ts-expect-error（R2 3 + R3 5 + R9 2），既有 7 条逐字保留
  - 12 道静态门禁 + 计划文件范围门禁 + 人工复核结论
affects: [04-render-adaptation]
actuals:
  tokens: 228273
  tasks: 5
  commits: 1
  plan_head_before: bfc69b20b516036bb6da12a569f0e091a6e3627a
tech-stack:
  added:
    - "@motajs/animate, @motajs/common, @motajs/render-vue, @motajs/system, @user/data-common（client-base 依赖，均 workspace:*）"
  patterns: [MOVE 语义移植（复制后删除原件）, 允许差异多重集比对, 架构耦合以带原因 @ts-expect-error 暂记（不反向引用 / 不解耦）, 桶导出 + 消费者说明符改指]
key-files:
  created:
    - packages-user/client-base/src/components/**（13）
    - packages-user/client-base/src/elements/**（5）
    - packages-user/client-base/src/map/**（20，含 extension/ 6 + shader/ 4）
    - packages-user/client-base/src/layout/layout.ts
    - packages-user/client-base/src/layout/index.ts
    - packages-user/client-base/src/shared/shared.ts
    - packages-user/client-base/src/shared/index.ts
    - .planning/phases/04-render-adaptation/04-11-SUMMARY.md
  modified:
    - packages-user/client-base/src/index.ts
    - packages-user/client-base/package.json
    - pnpm-lock.yaml
    - packages-user/client-modules/src/client.ts
    - packages-user/client-modules/src/types.ts
    - packages-user/client-modules/src/render/index.tsx
    - packages-user/client-modules/src/render/ui/{main,save,settings,statistics,statusBar,title,toolbar,viewmap}.tsx
    - packages-user/client-modules/src/render/utils/index.ts
    - packages-user/client-modules/src/render/utils/saves.ts
    - packages-user/client-modules/src/fallback/ui.ts
  deleted:
    - packages-user/client-modules/src/render/components/**（13）
    - packages-user/client-modules/src/render/elements/**（5）
    - packages-user/client-modules/src/render/map/**（20）
    - packages-user/client-modules/src/render/utils/layout.ts
key-decisions:
  - "移植按 MOVE 落地：39 个文件复制到 client-base/src/ 后删除 client-modules/src/render/ 下的原件（用户已接受此解读）"
  - "D-58：client-base/src/shared/ 采用 shared/shared.ts（10 常量纯摘取）+ shared/index.ts 两文件形态；client-modules/src/shared.ts 保留给实现层消费者"
  - "D-59 / D-68：render/renderer 3 处 + render/use.ts 5 处耦合不反向引用、不解耦，只加带原因 @ts-expect-error"
  - "D-60：render/utils/index.ts:1 与 saves.ts:2 的断链以带原因 @ts-expect-error 暂记，不改指 @user/client-base"
  - "D-62：全部文件名 / 目录名与原先一致，本步不引入任何新命名"
  - "D-64：shader ?raw 相对路径不动；D-65：legacy 一律不管；R4：5 处 @user/client-base 自包引用只搬不改、不加标注"
  - "计划门禁脚本的 4 处实现缺陷按 Rule 1 修复（计数 off-by-one / 缺 fs require / ALLOW 漏 '../../../shared' / 移动文件计数 39→38），门禁口径未变"
requirements-completed: []
duration: ~40min
completed: 2026-09-24
status: complete
---

# Phase 4 Plan 11: 渲染端结构性重构·第二步·移植实施 Summary

**把 39 个通用渲染文件（`components` 13 / `elements` 5 / `map` 20 / `utils/layout.ts` 1）按 D-53 / D-61 从 `client-modules/src/render/` MOVE 到 `client-base/src/{components,elements,map,layout}/` 并删除原件，新建 `shared/`（D-58），`client-base/src/index.ts` 新增 5 条桶导出、14 个实现层消费者改指 `@user/client-base`（D-63），`client-base/package.json` 补 5 条依赖并执行 `pnpm i`（D-66），架构耦合共 10 处以带原因 `// @ts-expect-error` 暂记（D-59 / D-60 / D-68）；12 道静态门禁 + 计划文件范围门禁全绿，`material/` / legacy / `packages/` / `src/` / 用户并发改动零触碰。**

## Performance

- **Duration:** ~40min
- **Started:** 2026-09-24
- **Completed:** 2026-09-24
- **Tasks:** 5（Task 0 为 `blocking-human` 汇报关卡，用户已回复「可以执行」，不计入工作任务；Task 1 tracer + Task 2/3 横向铺开 + Task 4 收口）
- **Files:** 42 新增（13 + 5 + 20 + `layout/{layout,index}.ts` + `shared/{shared,index}.ts`）/ 39 删除 / 14 实现层消费者改动 + `client-base/src/index.ts` + `client-base/package.json` + `pnpm-lock.yaml` + 本 SUMMARY

## 只读起始基线（Task 1 步骤 0a）

- **只读起始基线（packages / packages-user / src）**：（无）
- **起始 HEAD：** `bfc69b20b516036bb6da12a569f0e091a6e3627a`
- **起始分支：** `refine/data-client`
- 说明：规划日（2026-09-24）实测基线亦为空；唯一既有未提交改动为 `.planning/phases/04-render-adaptation/04-CONTEXT.md`（不在 `packages` / `packages-user` / `src` 内，故不计入 porcelain 基线），全程未触碰。

## Accomplishments

- **MOVE 完成（39 文件）**：`client-modules/src/render/{components,elements,map}` 三目录递归零文件、`render/utils/layout.ts` 不存在；`client-base/src/{components,elements,map,layout,shared}/` 42 个目标文件全部落位；`client-base/src/render/` 未创建。`client-modules/src/shared.ts` 与 `render/utils/{index,saves,use}.ts`、`render/{renderer.ts,use.ts,index.tsx}` 保留。
- **D-58 shared**：`client-base/src/shared/shared.ts` 为 `client-modules/src/shared.ts` 的纯摘取（10 常量 + 传递依赖 + 逐字注释 + `//#region 地图`），每非空行逐字出现在原件中；`shared/index.ts` = `export * from './shared';`；原文件保留。
- **D-61 layout**：`client-base/src/layout/layout.ts` 为 `render/utils/layout.ts` 的逐字副本；新增 `layout/index.ts`。
- **D-63 桶 + 消费者**：`client-base/src/index.ts` 9 条说明符（原 4 + 新 `./components` / `./elements` / `./map` / `./layout` / `./shared`）；14 个消费者说明符改指 `@user/client-base`（`render/ui` 8 文件 11 处含 `toolbar.tsx` 两处深层导入、`fallback/ui.ts:2`、`render/index.tsx:5,45,46`、`client.ts:25`、`types.ts:2`）；改指后 `@user/client-base` 在 `client-modules/src` 内计 **22** 处。
- **D-58 shared 说明符改指（4 处）**：`map/{element,renderer,vertex}.ts` 的 `'../../shared'` → `'../shared'`；`map/extension/door.ts` 的 `'../../../shared'` → `'../../shared'`。`?raw` 4 条与 5 处自包引用逐字未动。
- **D-66 依赖**：`client-base/package.json` 追加 5 条 `workspace:*`（原 5 条保留）；根 `pnpm i` 退出码 0（`Already up to date`），`pnpm-lock.yaml` 的 `packages-user/client-base` importer 块同步 5 条；lockfile 规范化回 CRLF（13127 CRLF，0 stray LF）。
- **D-59 / D-60 / D-68 标注**：新增 10 处带原因 `// @ts-expect-error`（R2 3 + R3 5 + R9 2）；被移文件既有 7 条逐字保留；`client-base/src` 内标注总数 24（9 `load/loader.ts` 既有 + 7 被移既有 + 8 新增），全部带非空原因、无裸标注。
- **12 道静态门禁 + 计划文件范围门禁**全部转绿（详见下节）；人工复核无偏差。

## Task Commits

1. **Task 0（blocking-human 汇报关卡）** — 用户已回复「可以执行」，无文件改动、无提交
2. **Task 1（tracer）** — `layout` + `shared` 端到端切片 + 两条桶 + 5 条依赖 + `pnpm i` + D-60 标注 + 删除 `layout.ts`
3. **Task 2** — `components` 13 + `elements` 5 移入 + 8 处标注 + 2 条桶 + 11 处消费者改指 + 删除 18 原件
4. **Task 3** — `map` 20 移入 + 4 处 shared 改指 + 最后 1 条桶 + 3 个深层消费者改指 + `saves.ts` 标注 + 删除 20 原件
5. **Task 4** — 全量允许差异比对 + 12 道门禁终跑 + 人工复核 + 本 SUMMARY + 白名单提交

**Plan metadata:** 单一 `refactor(04-11)` 提交（Task 1/2/3 无独立提交——Task 4 的允许差异门禁需以 `git show HEAD:<原路径>` 比对全部 39 原件，故移植期间 HEAD 必须保持在起始提交；本计划 Task 1/2/3 的 action 亦未定义提交步骤，Task 4 步骤 (4) 明示单次白名单提交）。

## 当日实测与规划日数值对照

| 项 | 规划日（2026-09-24，HEAD `bfc69b2`） | 当日实测（HEAD `bfc69b2`） | 差异 |
|---|---|---|---|
| 被移集合 | 39 文件（13 / 5 / 20 / 1） | **39** 文件（13 / 5 / 20 / 1） | 一致 |
| porcelain 基线 | 空 | **空** | 一致 |
| 起始分支 | `refine/data-client` | `refine/data-client` | 一致 |
| shared 所需常量 | 10（含传递依赖） | **10** | 一致 |
| 新增依赖 | 5 条 | **5** 条 | 一致 |
| 新增标注 | 10 处 | **10** 处 | 一致 |
| 消费者改指 | 14 文件（ui 11 + fallback 1 + index.tsx 3 + client/types 2） | 一致 | 一致 |

> 说明：执行日行号与规划日一致（无漂移）；用户并发改动仍为 `04-CONTEXT.md` 单条，未变。

## D-58..D-68 逐条落点表

| 裁定 | 实际文件 / 行号 | 实际形态 |
|---|---|---|
| D-58 shared | 新建 `client-base/src/shared/shared.ts`（32 行）+ `shared/index.ts`；`map/element.ts:5`、`map/renderer.ts:53`、`map/vertex.ts:25` → `'../shared'`；`map/extension/door.ts:9` → `'../../shared'` | 10 常量纯摘取、注释逐字；`client-modules/src/shared.ts` 保留未动 |
| D-59 renderer/using | `components/textboxTyper.ts:6`、`components/misc.tsx:15`、`elements/index.ts:3` 的 `'../renderer'` import 保留原文 + 上一行带原因标注 | 不反向引用、不解耦 |
| D-60 utils | `render/utils/index.ts:1`、`render/utils/saves.ts:2` 保留原文 + 上一行带原因标注 | 不改指 `@user/client-base`；`render/utils/use.ts` 零改动 |
| D-61 layout | `client-base/src/layout/layout.ts`（86 行逐字副本）+ `layout/index.ts` | 与原件逐字相同 |
| D-62 命名 | 全部 39 文件名 / 目录名 + 5 新建桶文件不变 | 零重命名、零大小写 / 扩展名变更 |
| D-63 桶与消费者 | `client-base/src/index.ts:6-10` 新增 5 条；14 个消费者说明符改指 | `render/index.tsx:45,46` 成为两行同源 `export * from '@user/client-base';`（保留，D-68） |
| D-64 ?raw | `map/renderer.ts:43-46` 4 条 `?raw` 逐字未动 | 未处理 |
| D-65 legacy | 被移文件内 `core.*` / `loading` / `Mota.require` 随文件原样搬运 | 未修、未登记为待办 |
| D-66 依赖 | `client-base/package.json:9-13` 新增 5 条；`pnpm-lock.yaml` importer 同步 | `pnpm i` 退出码 0 |
| D-67 标签注册 | `elements/index.ts:3` 标注；`createElements()` 3×`registerElement` + 3×`registerTag` 逐字未变 | 只移植不接线 |
| D-68 本步性质 | 全部门禁为静态；未运行 `check:type` / `build` / TS 诊断数 | 不要求可运行 / 不要求零类型错误 |

## 10 处新增 `@ts-expect-error` 实际行号与原因

| # | 文件:行 | 说明符 | 原因（标注原文摘要） |
|---|---|---|---|
| R2-1 | `client-base/src/elements/index.ts:3` | `'../renderer'` | render/renderer 按 D-54 留在实现层…按 D-67 暂以标注记录标签注册耦合，不反向引用、不解耦 |
| R2-2 | `client-base/src/components/textboxTyper.ts:6` | `'../renderer'` | …按 D-59 暂以标注记录，不反向引用、不解耦 |
| R2-3 | `client-base/src/components/misc.tsx:15` | `'../renderer'` | 同上 |
| R3-1 | `client-base/src/components/misc.tsx:10` | `'../use'` | render/use.ts 按 D-54 留在实现层…按 D-68 暂以标注记录，不反向引用、不解耦 |
| R3-2 | `client-base/src/components/choices.tsx:8` | `'../use'` | 同上 |
| R3-3 | `client-base/src/components/input.tsx:14` | `'../use'` | 同上 |
| R3-4 | `client-base/src/components/scroll.tsx:31` | `'../use'` | 同上 |
| R3-5 | `client-base/src/components/tip.tsx:4` | `'../use'` | 同上 |
| R9-1 | `client-modules/src/render/utils/index.ts:1` | `'./layout'`（导出） | layout.ts 已按 D-58..D-68 移植到 @user/client-base，本桶按 D-60 暂以标注记录断链 |
| R9-2 | `client-modules/src/render/utils/saves.ts:2` | `'../components'` | components 已按 D-58..D-68 移植到 @user/client-base，本文件按 D-60 暂以标注记录断链 |

既有 7 条逐字保留：`components/textbox.tsx:620`、`components/textboxTyper.ts:332`、`elements/cache.ts:81/84/153/208`、`map/extension/hero.ts:122`。

## 5 条新增依赖（`client-base/package.json`）

追加于 `@user/data-state` 之后（保留原 5 条 `@motajs/audio` / `@motajs/render` / `@motajs/client-base` / `@user/data-base` / `@user/data-state`）：`@motajs/animate` / `@motajs/common` / `@motajs/render-vue` / `@motajs/system` / `@user/data-common`（均 `workspace:*`）。根级已声明的第三方包（`vue` / `lodash-es` / `eventemitter3` / `mutate-animate`）未写入。

**`pnpm i` 实测：** 仓库根执行，退出码 0，输出 `Scope: all 25 workspace projects` / `Already up to date` / `Done in 8.6s using pnpm v12.5.1`；lockfile 被 pnpm 以 LF 重写后按计划规范化回 CRLF（内容不变）。

## 12 道静态门禁实测结果

| # | 门禁 | 结果 |
|---|---|---|
| ① | 目标落位（42 文件 + 无 `client-base/src/render/`） | ✅ `OK 42 new paths exist, 39 originals gone, kept files present` |
| ② | 移动已发生（39 原件不存在 + 三目录递归零文件 + 应保留文件在场） | ✅ 同上（含 `render/map/` 递归零文件、`shared.ts` / `render/utils/{index,saves,use}.ts` / `render/{renderer.ts,use.ts,index.tsx}` 在场） |
| ③ | 桶导出（9 条） | ✅ `OK barrel 9 specifiers; deps 5+5; lockfile synced` |
| ④ | 依赖与 lockfile（5 + 5，importer 同步） | ✅ 同上 |
| ⑤ | 消费者改指（`'./render/map'` 0 / `'./components'` 0 / `'./elements'` 0 / `'./layout'` 1 / `'../components'` 1 / 深层导入 0；`render/index.tsx` 2 条同源星导出；`@user/client-base` ≥19） | ✅ `OK deep consumers rewired (22 @user/client-base refs)` |
| ⑥ | 反向引用零命中（`@user/client-modules` / `client-modules` 于 `client-base`） | ✅ `OK 15+2 annotations with reasons; no reverse dep; no import type` |
| ⑦ | `@ts-expect-error` 落点（`client-base/src` 24 = 9 既有 load + 7 被移既有 + 8 新增；`render/utils/{index,saves}.ts` 各 1；全部带原因） | ✅ 同上 |
| ⑧ | 允许差异（39 文件仅授权面；`layout.ts` 逐字；`shared/shared.ts` 纯摘取） | ✅ `OK 39 move diffs limited to authorized lines; layout verbatim; shared pure extraction` |
| ⑨ | 实现层差异（14 消费者仅 import/export/标注行；非消费者零改动） | ✅ `OK 14 consumers import-only diffs; non-consumers untouched` |
| ⑩ | 范围与用户改动（禁用路径零改动 + `04-CONTEXT.md` 未提交改动仍在 + porcelain 白名单 + 11 个 PLAN + 前序产物零改写 + SUMMARY 落盘） | ✅ `OK scope: forbidden paths clean, D-56 edit present, whitelist respected, 11 plans, prior artifacts intact` |
| ⑪ | 无 `import type` | ✅（并入 ⑥ 门禁） |
| ⑫ | CRLF（全部新增 / 修改文件含 `pnpm-lock.yaml`） | ✅ `OK CRLF 76 files` |
| + | 计划文件范围门禁 | ✅ 并入 ⑩（`04-01`..`04-11` 恰 11 个 PLAN、前序产物 porcelain 为空） |

**门禁时刻 porcelain 实测（`packages packages-user src`）：** 51 条，全部落在本计划白名单内（2 M `client-base` + 12 M 消费者 + 39 D 原件 + 5 组 `??` 新增目录）；**未出现白名单外条目，故未启用 `GSD_ALLOW_USER_DIRTY`**。`04-CONTEXT.md` 未提交改动仍在（`M`）。

## 人工复核结论

逐条打开当日源码确认，**全部通过，无偏差**：

- 台账 A 类：`client-base/src/components/tip.tsx:4-5`（`'../use'` + 标注）、`client-base/src/elements/index.ts:2-4`（`'../map'` + `'../renderer'` + 标注）指向正确。
- 台账 B 类：`render/ui/toolbar.tsx:13` 与 `:19` 两处深层导入已改指 `@user/client-base`；`fallback/ui.ts:2` `import { TipStore } from '@user/client-base';`。
- 台账 C 类：`render/index.tsx:45,46` 成为两行同源 `export * from '@user/client-base';`；`render/utils/index.ts:1` 标注就位。
- 台账 D 类：`client-base/src/shared/shared.ts` 10 常量（`CELL_WIDTH` / `CELL_HEIGHT` / `CELL_SIZE` / `MAP_BLOCK_WIDTH` / `MAP_BLOCK_HEIGHT` / `MAP_WIDTH` / `MAP_HEIGHT` / `DYNAMIC_RESERVE` / `MOVING_TOLERANCE` / `DOOR_ANIMATE_INTERVAL`）值与注释与 `client-modules/src/shared.ts` 逐字一致；`map/renderer.ts:43-46` 4 条 `?raw` 与 `map/*` 5 处自包引用（`hero.ts:16` / `moving.ts:3` / `renderer.ts:13` / `types.ts:12` / `vertex.ts:28`）逐字未动。
- `elements/index.ts` 的 `createElements()` 与 3×`registerElement` + 3×`registerTag` 调用形态逐字未变（D-67）。
- `client-base/src/index.ts` 终态 9 条说明符；`client-base/package.json` 终态 5 + 5 条依赖。

## Decisions Made

- 采用单一白名单提交（Task 4 步骤 (4)）：移植期间 HEAD 必须保持在起始提交，Task 4 的允许差异门禁才能以 `git show HEAD:<原路径>` 比对全部 39 原件；计划 Task 1/2/3 亦未定义提交步骤。
- 计划门禁脚本的 4 处实现缺陷按 Rule 1 修复（见 Deviations），门禁口径不变、所有实质判据均通过。
- 未写 `.planning/STATE.md` / `.planning/WINDOWS.md` / `.planning/ROADMAP.md`：计划 prohibitions 明示「除 `files_modified` / `files_deleted`、`04-11-SUMMARY.md` 与 ROADMAP 登记外不得写任何其它文件」，且 ROADMAP 的 04-11 登记已在计划阶段提交（无本次登记改动）；`REND-01` / `REND-02` 保持 Pending（未改 `REQUIREMENTS.md`）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 门禁脚本匹配计数 off-by-one（L519 / L596）**
- **Found during:** Task 2 / Task 3 门禁
- **Issue:** 门禁用 `o.split(/\r?\n/).length` 统计 `git grep` 命中行数，但 `git grep` 输出带结尾换行，导致「1 命中」被计为 2，期望值 1 恒不通过（L596 另有 `ReferenceError: fs is not defined`，缺 `require('fs')`）。
- **Fix:** 改为在去除结尾空白后的字符串上计数（`const c=o.replace(/\s+$/,''); c.length>0?c.split(/\r?\n/).length:0`），并为 L596 补 `const fs=require('fs')`。
- **Files modified:** 无生产文件（仅临时门禁脚本）
- **Commit:** 不适用（临时工装）

**2. [Rule 1 - Bug] 允许差异门禁 ALLOW 正则漏掉 door.ts 原件说明符（L598 / L662）**
- **Found during:** Task 3 / Task 4 门禁
- **Issue:** ALLOW 正则 `/@ts-expect-error|'\.\.\/(\.\.\/)?shared'/` 不匹配被移除的旧行 `'../../../shared'`，而 R1 明确授权 `map/extension/door.ts` 由 `'../../../shared'` 改为 `'../../shared'`。
- **Fix:** ALLOW 追加 `|'\.\.\/\.\.\/\.\.\/shared'`，使授权改写的新旧两行均被允许。
- **Files modified:** 无生产文件（仅临时门禁脚本）

**3. [Rule 1 - Bug] 标注总数期望值漏算 `load/loader.ts` 既有 9 条（L602 / L666）**
- **Found during:** Task 3 / Task 4 门禁
- **Issue:** 门禁期望 `client-base/src` 内 `@ts-expect-error` 总数为 15，但该目录下 `load/loader.ts`（D-42/D-39 加载面，禁改）本就有 9 条既有标注；正确总数应为 24（9 + 被移集合 15 = 7 既有 + 8 新增）。
- **Fix:** 期望值改为 24；per-file 计数、全部带原因、无裸标注等实质判据不变。
- **Files modified:** 无生产文件（仅临时门禁脚本）

**4. [Rule 1 - Bug] 全量允许差异门禁移动文件计数 39→38（L662）**
- **Found during:** Task 4 门禁
- **Issue:** 门禁循环仅遍历 `components` + `elements` + `map`（38 文件）却断言 39；第 39 个 `layout/layout.ts` 由同门禁的「layout verbatim」检查单独覆盖。
- **Fix:** 循环断言改为 38，与「39 文件全量比对 = 38 循环 + layout 单独」一致。
- **Files modified:** 无生产文件（仅临时门禁脚本）

> 以上 4 处均为**计划门禁脚本的实现缺陷**（计数 / 正则 / 常量 / require），非门禁口径变更；修复后所有实质判据（目标落位 / 移动已发生 / 桶 / 依赖 / 消费者改指 / 反向引用零命中 / 标注落点 / 允许差异 / 实现层差异 / 范围 / 无类型导入 / CRLF）全部通过。

## Known Stubs（范围外已知余留，只报告不处置）

| # | 余留 | 位置 | 说明 |
|---|---|---|---|
| 1 | legacy 耦合随文件原样搬运、未修（D-55 / D-65） | 被移文件内 `core.*` 约 30 处、`loading` + `Mota.require('@user/data-base')` 3 处 | 台账 E 类；一律不管、不登记为待办 |
| 2 | 两行同源星导出 | `render/index.tsx:45,46` 均为 `export * from '@user/client-base';` | D-68 保留未合并；是否合并由用户后续裁定 |
| 3 | 5 处 `@user/client-base` 自包引用未验证 | `map/{extension/hero,moving,renderer,types,vertex}.ts` | 只搬不改、未加标注；包内解析 / 构建下是否成立未验证（D-68 不要求可运行） |
| 4 | D-60 断链仅标注 | `render/utils/index.ts:1`、`render/utils/saves.ts:2` | 未接线、未改指 |
| 5 | 8 处反向耦合未接线 | `render/renderer` 3 处 + `render/use.ts` 5 处 | 以带原因标注暂记，待用户收尾 |

> 依计划 prohibitions，未写入 `.planning/WINDOWS.md`（本步仅允许写 `files_modified` / `files_deleted` / `04-11-SUMMARY.md` / ROADMAP 登记）。

## Issues Encountered

- 见「Deviations from Plan」的 4 处门禁脚本缺陷（已按 Rule 1 修复，无生产代码影响）。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 用户可据上表逐条核对 D-58..D-68 是否落地，并接手 5 条范围外已知余留（legacy 面 / 两行同源星导出 / 自包引用 / D-60 断链 / 8 处反向耦合接线）。
- `REND-01` / `REND-02` 仍为 **Pending**（本步只纠正分层，未实施接口适配与双布局）；`.planning/REQUIREMENTS.md` 零改动。
- 约束提醒：`material/`、`load/`、`packages/`、`src/`、`entry-client`、`entry-data` 均未触碰；用户并发改动（`04-CONTEXT.md` 未提交改动）未触碰、未提交。

---
*Phase: 04-render-adaptation*
*Completed: 2026-09-24*

## Self-Check: PASSED

- 42 new paths under `packages-user/client-base/src/{components,elements,map,layout,shared}/`: FOUND
- 39 originals deleted under `packages-user/client-modules/src/render/`: GONE
- summary `04-11-SUMMARY.md`: FOUND
- commits measured from ledger (`bfc69b2..HEAD`): 1
