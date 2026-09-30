---
phase: 04-render-adaptation
plan: 13
subsystem: render-ui-interface-adaptation
tags: [read-only, impact-ledger, d71-d72, global-loading-hook, loader-refactor, d69-barrel]
requires:
  - phase: 04-render-adaptation
    provides: 用户裁定 D-71 / D-72 / D-73（部分 UI 进一步接口适配·第一步只读收集）写入 04-CONTEXT.md
  - phase: 04-render-adaptation
    provides: 基准提交 d8fa4b8（删除全局 loading / hook 与旧加载系统）；既有台账 04-TEXTURE-INTERFACE-IMPACT.md / 04-STRUCTURE-MIGRATION-IMPACT.md（格式模板）
provides:
  - .planning/phases/04-render-adaptation/04-UI-ADAPTATION-IMPACT.md（部分 UI 进一步接口适配·第一步只读影响台账；A–F 六类 + 修改点汇总）
  - 供第二步（D-72 适配实施）消费的修改点汇总（沿用 / undetermined 标注）
affects: [04-render-adaptation]
actuals:
  tokens: 21000
  tasks: 5
  commits: 1
  plan_head_before: faba3d3c11a6ca1f5c0a900ce7c73131c2a5cc8e
tech-stack:
  added: []
  patterns:
    - "只读影响台账：元信息块 + 12 小节 + A–F 六类固定列序表 + 修改点汇总 + 处置"
    - "证据纪律：事实行每行 ≥2 个 file:line 锚点；证据行带 [证据行] 标记 + 核对命令"
    - "只登记不判定：静态阅读不能定论者一律进 F 类（未猜测），不得写成错配 / 缺失 / 残留 / 待办"
key-files:
  created:
    - .planning/phases/04-render-adaptation/04-UI-ADAPTATION-IMPACT.md
    - .planning/phases/04-render-adaptation/04-13-SUMMARY.md
  modified: []
  deleted: []
key-decisions:
  - "本 run 为纯只读收集（D-71 / D-72 第一步）：生产源码改动 0，files_modified 仅台账；Task 1/2/3 不独立提交，Task 4 单次白名单提交"
  - "A–E 事实行统一覆盖：A 7 条（UI 4 + 边界非 UI 3）/ B 5 条 / C 2 条 / D 5 条 / E 4 条；F 5 条；修改点汇总 8 行"
  - "statusBarUpdate（多对象聚合）/ restart（无新发射者）/ load.tsx progress 迭代等价写法 / 边界面是否纳入 一律进 F 类 undetermined，不臆测"
  - "Task 4 门禁脚本 #2（E legacy 命中 计数）在 PowerShell 5.1 下 `\\b` 转义不可直跑，按原样语义改由临时脚本执行，判据不变（见 Deviations）"
requirements-completed: []
duration: ~25min
completed: 2026-09-30
status: complete
---

# Phase 4 Plan 13: 部分 UI 进一步接口适配·第一步（只读收集）Summary

**对数据端 `d8fa4b8 refactor: Delete global loading & hook object` 后渲染端「部分 UI」仍依赖已删全局 `loading` / `hook` 与旧加载系统的使用点做只读清点，产出影响台账 `04-UI-ADAPTATION-IMPACT.md`（元信息块 + 12 小节 + A–F 六类固定列序表 + 修改点汇总 + 处置）；A / B / C / D / E 事实行均带 `file:line` 锚点，未确定者一律进 F 类「只登记不判定」；生产代码零改动、未引入任何命名变更、无运行时验证（D-68 的延续）。**

## Performance

- **Duration:** ~25min
- **Started:** 2026-09-30
- **Completed:** 2026-09-30
- **Tasks:** 5（Task 0 blocking-human 汇报关卡 — 用户已回复「可以执行」；Task 1 tracer；Task 2；Task 3；Task 4 收口）
- **Files:** 1 新增（`04-UI-ADAPTATION-IMPACT.md`）+ 本 SUMMARY；生产源码改动 **0**

## 只读起始基线（Task 1 步骤 0a）

- **只读起始基线（packages / packages-user / src）：** `（无）`
- **起始 HEAD：** `faba3d3c11a6ca1f5c0a900ce7c73131c2a5cc8e`（short `faba3d3`）
- **起始分支：** `refine/data-client`
- **基准提交：** `d8fa4b8`；`git merge-base --is-ancestor d8fa4b8 HEAD` 退出码 0；`packages-user/client-base/src/load/` 目录不存在（`Test-Path` → `False`）。
- **用户并发改动：** `.planning/phases/04-render-adaptation/04-CONTEXT.md` 的既有未提交改动仍在（porcelain ` M`）；本 run 未回滚 / 暂存 / 提交 / 修改（D-56）。

## Accomplishments

**唯一交付物：** `.planning/phases/04-render-adaptation/04-UI-ADAPTATION-IMPACT.md`（只读）。

| 节 | 落点 | 条目数 |
|---|---|---|
| 元信息块 + 只读起始基线 + 背景 + 方法 + 基准变更（d8fa4b8） | 6 行元信息块；porcelain 原样（空）；D-71 / D-72 / D-73 要点；A–F 判定口径表；`d8fa4b8` 删除 16 文件（旧加载系统 4 + `data-base/game.ts` 273 行 + 13 文件用法改注释） | — |
| **A 全局 loading / hook 使用点（UI 面）** | `load.tsx` 旧加载接口（A-01）、装配链不可达（A-02）、`main.tsx` `statusBarUpdate`（A-03）、`render/index.tsx` `restart`（A-04）；边界非 UI（A-05 `client.ts` / A-06 `client-modules/index.ts` / A-07 `entry-client/create.ts`）只报告 | **7** |
| **B 目标对象与钩子 API 证据** | A-01 → `IMotaDataLoader` / `ILoadManager`（可确定）；A-02 / A-03 / A-04 / A-05..A-07 → **undetermined**（交叉引用 F 类） | **5** |
| **C 旧加载 UI 清单与新加载系统** | 旧侧 `LoadScene` / `LoadSceneUI` + 装配链 + 已删 `client-base/src/load/**` / `IMotaAssetsLoader` / `use.ts:onLoaded`；新侧 `@motajs/loader` + `data-state/src/loader/**` + `CoreState.loader` / `loadManager` | **2** |
| **D 分层与 barrel（D-69）检查** | `render/ui/index.ts`（无 `./load` 导出）/ `render/index.tsx:43-49` / `client-modules/src/index.ts:9-16` / `client-base/src/index.ts:1-8` 均**不违反 D-69**；`packages/client/src/index.ts:1` 跨包转发违反 D-69（`packages/` 只报告） | **5** |
| **E legacy 命中（仅报告）** | `core.*`（E-01）、`client` / `state` 单例（E-02）、legacy-ui 经 `Mota.require` 取已删 `hook` / `loading`（E-03）、`[证据行]` `render/ui` 内 `Mota.require` 零命中（E-04） | **4** |
| **F 未能从阅读确定（未猜测）** | F-01 旧加载 UI 进度数据来源 / F-02 `progress` 迭代等价写法 / F-03 `statusBarUpdate` 精确对象集合 / F-04 `restart` 无新发射者 / F-05 边界面是否纳入 | **5** |
| **修改点汇总（供后续执行计划消费）** | 8 行固定列表（文件 file:line / 现状 / 应改对象或 undetermined / 归属 / 置信） | **8** |

**A–E 表列数：** A 7 / B 5 / C 2 / D 5 / E 4 = **23** 条分类行（门禁实测一致）。

## Task Commits

1. **Task 0（blocking-human 汇报关卡）** — 用户已回复「可以执行」，无文件改动、无提交
2. **Task 1（tracer）** — 台账骨架 + 12 小节 + tracer 行（A-01 / A-02 等；门禁全绿，无独立提交）
3. **Task 2** — A 类剩余 UI 面 + 边界非 UI 面 + B 类证据铺开 + F-03..F-05（门禁全绿，无独立提交）
4. **Task 3** — C / D / E / F 铺开与 `## 修改点汇总` 定稿（门禁全绿，无独立提交）
5. **Task 4** — 收口门禁 + 人工复核 + 本 SUMMARY + 白名单提交

**Plan metadata:** 单一白名单提交（见「提交记录」）。计划 Task 1/2/3 的 action 未定义独立提交步骤；Task 4 步骤 (10) 明示单次白名单提交（与 04-11 / 04-12 的单一提交口径一致）。

## 提交记录

- `docs(04-13): 部分 UI 进一步接口适配只读影响台账（D-71/D-72 第一步）` —— 单次白名单提交，仅含 `files_modified`（`04-UI-ADAPTATION-IMPACT.md`）+ 本 `04-13-SUMMARY.md`（提交 hash 见 orchestrator 回报 / `git log`）。

## A–F 落点表（关键锚点）

| 面 | 条目 | 关键 `file:line` 锚点 |
|---|---|---|
| **A 全局对象使用点** | A-01：`load.tsx` 旧加载接口 | `packages-user/client-modules/src/render/ui/load.tsx:36,71,72,76-79,91-92,118-119,139` ↔ `packages-user/data-state/src/types.ts:29` / `packages-user/data-state/src/loader/types.ts:19-72` |
| | A-02：装配链不可达 | `packages-user/client-modules/src/render/index.tsx:11,25`；`createGameRenderer` 定义 `:13`（`git grep` 无调用者） |
| | A-03：`statusBarUpdate` | `packages-user/client-modules/src/render/ui/main.tsx:140-143` + `:145-152` ↔ `packages-user/data-base/src/hero/types.ts:277-295` |
| | A-04：`restart` | `packages-user/client-modules/src/render/index.tsx:35-38` ↔ `packages-user/client-modules/src/action/hotkey.ts:507` / `packages-user/client-modules/src/render/ui/settings.tsx:112` |
| | A-05..A-07：边界非 UI（只报告） | `packages-user/client-modules/src/client.ts:88-92,124-127` / `packages-user/client-modules/src/index.ts:1-8` / `packages-user/entry-client/src/create.ts:16,31,34-41` |
| **B 目标对象证据** | B-01 可确定 | `packages/loader/src/types.ts:288-335` / `packages/loader/src/manager.ts:10-112` / `packages-user/data-state/src/loader/loader.ts:18-151` |
| | B-02..B-05 undetermined | `packages-user/data-state/src/core.ts:205-208` / `packages-user/data-state/src/loader/types.ts:4-17` |
| **C 旧 / 新加载系统** | C-01 旧侧 | `packages-user/client-modules/src/render/ui/load.tsx:35,165` / `packages-user/client-modules/src/render/use.ts:1-19` |
| | C-02 新侧 | `packages/loader/src/index.ts:1-5` / `packages-user/data-state/src/loader/index.ts:1-4` / `packages-user/data-state/src/core.ts:205-208` |
| **D barrel（D-69）** | D-01..D-04 合规 | `packages-user/client-modules/src/render/ui/index.ts:1-14` / `packages-user/client-modules/src/index.ts:9-16` / `packages-user/client-base/src/index.ts:1-8` |
| | D-05 只报告 | `packages/client/src/index.ts:1` |
| **E legacy（仅报告）** | E-01..E-04 | `packages-user/client-modules/src/render/ui/main.tsx:97` / `packages/legacy-ui/src/preset/ui.ts:13,222` / `packages-user/data-base/src/index.ts:1-2` |
| **F undetermined** | F-01..F-05 | 见台账 `## F` 一节 |

## 门禁实测结果（全部静态 — D-68 的延续）

| # | 门禁 | 结果（OK 行） |
|---|---|---|
| T1-1 | 台账骨架 + 12 小节 + tracer 行 `#04-13-A-01` | ✅ `OK ledger skeleton + tracer row` |
| T1-2 | A–E 事实行 ≥2 锚点 | ✅ `OK anchor discipline: 23 classed rows` |
| T1-3 | 生产树零改动 | ✅ `OK no production changes (read-only)` |
| T1-4 | CRLF | ✅ `OK CRLF ledger` |
| T2-1 | A/B/F 铺开（`main.tsx` / `render/index.tsx` / 边界面 + F-03..F-05） | ✅ `OK A/B/F expansion` |
| T2-2 | 锚点纪律 + F ≥5 | ✅ `OK anchor discipline: 23 table rows, 5 F entries` |
| T2-3 | 生产树零改动 | ✅ `OK no production changes (read-only)` |
| T3-1 | C / D / E + 修改点汇总覆盖 | ✅ `OK C/D/E + summary coverage` |
| T3-2 | E 小节在场（`ui core/Mota hits today = 150`） | ✅ `OK E section present; ui core/Mota hits today = 150`（临时脚本，见 Deviations） |
| T3-3 | 最终纪律（锚点 + F ≥5 + 汇总表头） | ✅ `OK final: 23 table rows, 5 F entries, summary present` |
| T3-4 | 范围门禁（`REQUIREMENTS.md` 零改动 + 用户 `CONTEXT.md` 改动仍在） | ✅ `OK scope: read-only, REQUIREMENTS untouched, user CONTEXT edit preserved` |
| T3-5 | CRLF | ✅ `OK CRLF ledger` |
| T4-1 | 只读基线一致（当日基线为空） | ✅ `OK read-only baseline consistent (today entries = 0)` |
| T4-2 | 台账结构 / 内容 / tracer / 新加载系统 / D / E 关键锚点 | ✅ `OK ledger structure + tracer + expansion content` |
| T4-3 | 最终纪律（锚点 + F ≥5） | ✅ `OK final discipline: 23 rows, 5 F entries` |
| T4-4 | 范围门禁（`material/` / `packages/` / `src/` 空；`REQUIREMENTS.md` 零改动；用户 `CONTEXT.md` 保留） | ✅ `OK scope: material/packages/src clean; REQUIREMENTS untouched; user CONTEXT preserved` |
| T4-5 | 既有产物保护（`04-01`..`04-12` porcelain 空；无 `04-14+`） | ✅ `OK existing 04-01..04-12 artifacts untouched; no 04-14+ plan` |
| T4-6 | 台账 + SUMMARY CRLF + SUMMARY 在场 | ✅ `OK CRLF ledger + SUMMARY present` |
| T4-7 | `04-13-SUMMARY.md` 落盘且含 `04-13` / `D-71` / `D-72` / `只读` / `Pending` | ✅ `OK 04-13-SUMMARY.md present and keyed` |

**门禁时刻 porcelain（`packages packages-user src`）：** **0** 条（本计划为只读，生产树零改动）；用户 `04-CONTEXT.md` 的未提交改动（工作树内 ` M`）全程未触碰。

## 人工复核结论（Task 4 步骤 8）

逐条打开当日源码核对，**全部通过，无偏差**：

- A 类每条锚点指向真实存在的旧接口调用 / 被注释监听点：`load.tsx:36,71,72,76-79,91-92,118-119,139`（旧加载接口）、`main.tsx:140-143`（手工调用）/`:145-152`（被注释 `hook.on`）、`render/index.tsx:35-38`（被注释 `hook.on('restart')`）、`client.ts:88-92,124-127`、`entry-client/src/create.ts:16,31,34-41` 均实读确认。
- B 类目标对象证据锚点指向真实声明：`packages-user/data-state/src/loader/types.ts:19-72`（`IMotaDataLoader`）、`packages/loader/src/types.ts:288-335`（`ILoadManager`）、`packages-user/data-state/src/core.ts:205-208`（装配）、各 hero / map / replay hooks 接口行均实读确认。
- C 类旧侧「已删除」由当日 `git grep` 复验：`git grep -n "IMotaAssetsLoader" -- packages-user packages src` 零命中；`initSystemLoadTask` 仅剩 `load.tsx:71` 无效调用点；`packages-user/client-base/src/load/` 目录不存在。
- `createGameRenderer` 无调用者由 `git grep -n "createGameRenderer" -- packages-user packages src` 复验（仅 `render/index.tsx:13` 定义行）。
- D 类 barrel 导出集合与 D-69 判定一致（4 个渲染端 barrel 全同目录 `export *`；`render/ui/index.ts` 确无 `./load`）。
- E 类 legacy 命中与 `git grep` 输出一致（`render/ui` 内 `core.*` 150 行；`Mota.require` 零命中）；E 全节无修复 / 待办措辞。
- F 类 5 条均未越过「只登记不判定」边界，无「错配 / 缺失 / 残留 / 待办」措辞。

## Decisions Made

- **只读收集小切片（D-71 / D-72 第一步）**：唯一交付物为台账 + 本 SUMMARY；生产源码改动 0，`files_modified` 仅台账。
- **单一白名单提交**：Task 1/2/3 不独立提交；Task 4 步骤 (10) 单次提交，仅暂存台账 + SUMMARY。
- **undetermined 纪律**：`statusBarUpdate`（多对象聚合）/ `restart`（无新发射者）/ `load.tsx` progress 迭代等价写法 / 边界面是否纳入 一律进 F 类，不臆测目标对象。
- **未写其它 `.planning/` 文件**：除本 SUMMARY 外未写 `STATE.md` / `ROADMAP.md` / `WINDOWS.md` / `REQUIREMENTS.md`（`REND-01` / `REND-02` 保持 Pending）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Tooling] Task 4 门禁 #2（E 小节计数）在 PowerShell 5.1 下不可直跑**

- **Found during:** Task 3 门禁执行（`E legacy 命中（仅报告）` 计数门禁）
- **Issue:** 计划门禁以 `node -e "..."` 内嵌 `git grep -E "\\bcore\\.|\\bMota\\.require\\b"`；本环境 shell 为 Windows PowerShell 5.1，反斜杠与双引号转义组合被 shell 吞并 / 截断（`CommandNotFoundException`），node 收到破损脚本。
- **Fix:** 将门禁脚本按**逐字语义**落到仓库外临时文件 `C:\Users\13194\AppData\Local\Temp\opencode\gate-e.js` 后执行 `node <file>`；判据（台账含 `E legacy 命中（仅报告）` + 输出 `ui core/Mota hits today` 计数）与计划完全一致，结果 `OK E section present; ui core/Mota hits today = 150`。
- **Files modified:** 无生产文件（临时工装，位于仓库外）
- **Commit:** 不适用

**2. [Rule 3 - Doc] Task 3 门禁要求精确子串 `legacy-ui/src/preset/ui.ts:13,222`**

- **Found during:** Task 3 门禁执行（C/D/E 覆盖门禁）
- **Issue:** 初稿 E-03 命中处写作 `packages/legacy-ui/src/preset/ui.ts:13, packages/legacy-ui/src/preset/ui.ts:222`，门禁要求的紧凑形式 `ui.ts:13,222` 不存在。
- **Fix:** 将 E-03 命中处改为 `packages/legacy-ui/src/preset/ui.ts:13,222, packages/legacy-ui/src/preset/ui.ts:222`，判据满足且事实不变。
- **Files modified:** 台账（本计划 `files_modified` 内）
- **Commit:** 含于 Task 4 单次白名单提交

---

**Total deviations:** 2（1 门禁执行方式、1 台账措辞）——**均不涉及生产代码，所有实质判据全部通过**。

## Known Stubs (只报告不处置)

| # | 余留 | 位置 | 说明 |
|---|---|---|---|
| 1 | `statusBarUpdate` 目标对象未定 | `packages-user/client-modules/src/render/ui/main.tsx:145-152` | 多对象聚合（含不可 hook 的 `client.hero.attribute`）；F 类 F-03 交用户裁决 |
| 2 | `restart` 无新发射者 | `packages-user/client-modules/src/render/index.tsx:35-38` | F 类 F-04 交用户裁决 |
| 3 | 旧加载 UI `progress` 迭代等价写法未定 | `packages-user/client-modules/src/render/ui/load.tsx:76-79` | F 类 F-01 / F-02 交用户裁决 |
| 4 | 边界非 UI 面是否纳入适配范围未定 | `client.ts` / `client-modules/src/index.ts` / `entry-client/src/create.ts` | F 类 F-05 交用户裁决 |
| 5 | `createGameRenderer` 无调用者（旧加载 UI 当前不可达） | `packages-user/client-modules/src/render/index.tsx:13` | 事实登记（A-02）；是否纳入由用户裁定 |

> 依计划 prohibitions 与 Task 4 步骤 (11)，未写入 `.planning/WINDOWS.md` / `STATE.md` / `ROADMAP.md`（本步仅允许写台账与 SUMMARY）。

## Issues Encountered

- 见「Deviations from Plan」的 2 处（1 门禁脚本 shell 兼容性 + 1 台账措辞），均已按规则处置，无生产代码影响。

## 无运行时验证声明（D-68 的延续）

- 本步**没有「保证能运行」的要求**：**未运行** `pnpm check:type` / `pnpm build`，**未使用** TS 诊断数（全仓或范围内）作为任何门禁或验收项。
- 证明方式全部为**静态**：`git status --porcelain` 基线一致 / 台账结构与锚点 / 分类关键词 / 禁用路径 porcelain / CRLF / 既有产物保护，辅以人工代码复核。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **第一步（只读收集）完成**：A 7 / B 5 / C 2 / D 5 / E 4 / F 5 条 + 修改点汇总 8 行；可确定目标对象（`load.tsx` 旧加载接口 → `IMotaDataLoader` / `ILoadManager`）与 undetermined 项分离清晰。
- **第二步（适配实施）未规划**，待用户审阅 `04-UI-ADAPTATION-IMPACT.md` 后另行规划（D-72）；本步不产出任何新 `*-PLAN.md`。
- **D-69 与 legacy 边界遵守**：D 类 4 个渲染端 barrel 均合规、`packages/` 旁注只报告；E 类 legacy 一律只报告、不修、不登记为待办。
- **范围零外溢**：`packages-user/client-base/src/material/**`（D-42 / D-48）、`packages/**`、`src/**`、测试文件全部零触碰；用户 `04-CONTEXT.md` 并发改动保留且未被提交。
- `REND-01` / `REND-02` 仍为 **Pending**；`.planning/REQUIREMENTS.md` 零改动。

---
*Phase: 04-render-adaptation*
*Completed: 2026-09-30*

## Self-Check: PASSED

- `.planning/phases/04-render-adaptation/04-UI-ADAPTATION-IMPACT.md`: FOUND（含 12 小节 + A–E 23 行 + F 5 条 + 修改点汇总 8 行）
- `.planning/phases/04-render-adaptation/04-13-SUMMARY.md`: FOUND
- 生产源码改动: 0（`git status --porcelain -- packages packages-user src` 为空）；`material/` / `packages/` / `src/` 零触碰
- 用户并发改动 `04-CONTEXT.md`: PRESERVED（未提交、未触碰）
- `04-01`..`04-12` 既有产物: 零触碰；无 `04-14+`
- commits measured from ledger (`faba3d3c..HEAD`): 1
