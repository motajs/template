---
phase: 09-minimum-browser-runnable
plan: 12
subsystem: legacy-migration-audit
tags: [read-only, legacy-replacement, core-members, audit, documentation]
requires:
  - 09-LEGACY-INTERFACES-AUDIT.md
provides:
  - 09-LEGACY-REPLACEMENT-AUDIT.md
affects:
  - legacy 去 legacy 改造定序（后续计划）
tech-stack:
  added: []
  patterns: [read-only audit, baseline-diff read-only guard, grounded file:line anchors]
key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-LEGACY-REPLACEMENT-AUDIT.md
    - .planning/phases/09-minimum-browser-runnable/09-12-SUMMARY.md
  modified: []
decisions:
  - "判定文档命名 adopt OI-1 default: 09-LEGACY-REPLACEMENT-AUDIT.md"
  - "五类分类 adopt OI-2 default: 可直接替换 / 有替代但需适配 / 有替代方案 / 无替代 / 待定"
  - "条目粒度 adopt OI-3 default: A-1..A-7 逐行 32 条 + C 去重 67 成员 = 99 条"
  - "只读守卫 adopt OI-4 default: 执行前基线对比（仅新增 .ts/.tsx 判红）"
  - "搜索范围 adopt OI-5 default: packages/** + packages-user/**（排除 @motajs/legacy-*），src/ 仅参考"
  - "可直接替换判据 adopt OI-6 strict: 语义等价 + 无行为变化 + 无能力缺失 + 无契约破坏"
metrics:
  duration: "~35m"
  tasks: 3
  files: 2
  completed: 2026-10-11
actuals:
  tokens: 7282
  tasks: 2
  commits: 2
status: complete
---

# Phase 9 Plan 12: legacy 接口可替代性统计 Summary

**One-liner:** 只读判定文档——对 09-11 台账的 32 条残余 legacy 接口与 67 个 `core.*` 去重成员逐项判定可替代性（0 可直接替换 / 25 有替代但需适配 / 40 有替代方案 / 8 无替代 / 26 待定），并给出五批改造顺序建议。

## What Was Built

- **`09-LEGACY-REPLACEMENT-AUDIT.md`（新增，唯一判定产物）：**
  - **§0 判定口径与范围**：输入（A 条目 32 + C 去重成员 67）、替代搜索范围（所有非 legacy 包；排除 `@motajs/legacy-*`）、D-46 三问判定口径、五类分类定义（OI-2）、统一 per-entry schema、六项机器可读计数键、只读声明。
  - **§A 残余 legacy 接口的可替代性（32 条）**：A-1 跨包依赖 10 / A-2 全局 `core` 1 / A-3 单例 `client` 3 / A-4 patch 3 / A-5 UI 运行时符号 7 / A-6 `Mota` 全局 3 / A-7 回退层 5。
  - **§C 经 `core.*` 调用的接口的可替代性（67 成员）**：逐成员一行，附调用点 `file:line`，替代依据全部取自非 legacy 包真实代码。
  - **§汇总** 五类分类表 + A/C 分布小计 + 六项机器可读计数。
  - **§改造顺序建议** 五批分组（有替代方案批量 → 按主题的有替代但需适配 → UI/素材批量 → 无替代补设计 → 待定待裁定）。
- **`09-12-SUMMARY.md`（本文件）。**

## Inputs & Scope

- **输入台账：** `.planning/phases/09-minimum-browser-runnable/09-LEGACY-INTERFACES-AUDIT.md`（A-COUNT=32；C-COUNT=228；去重成员 M=67）。
- **替代搜索范围：** `packages/**`（`@motajs/system`、`@motajs/client-base`、`@motajs/audio`、`@motajs/common`、`@motajs/render` 等）与 `packages-user/**`（`@user/data-state`、`@user/data-base`、`@user/data-common`、`@user/client-base`、`@user/client-modules` 等）；`src/` 仅作参考。**排除** `@motajs/legacy-ui` / `@motajs/legacy-common` / `@motajs/legacy-system` 及其它 `@motajs/legacy-*`。

## Judgement Criteria (D-46 three questions)

对每条判定：① 是否已提供替代接口；② 是否有现成替代方案；③ 是否可无痛替换。分类取五类之一。

## Five-Class Counts

| 分类 | 计数 | A 节 | C 节 |
| --- | --- | --- | --- |
| `可直接替换` | 0 | 0 | 0 |
| `有替代但需适配` | 25 | 4 | 21 |
| `有替代方案` | 40 | 21 | 19 |
| `无替代` | 8 | 1 | 7 |
| `待定` | 26 | 6 | 20 |
| **合计 (ENTRY-COUNT)** | **99** | **32** | **67** |

机器可读键：`ENTRY-COUNT: 99`、`DIRECT-COUNT: 0`、`ADAPT-COUNT: 25`、`ALT-COUNT: 40`、`NONE-COUNT: 8`、`TBD-COUNT: 26`（五类之和 = 99，自洽）。

## Output Path

- `.planning/phases/09-minimum-browser-runnable/09-LEGACY-REPLACEMENT-AUDIT.md`

## Read-only Confirmation (D-49)

- 本计划唯一写入：`09-LEGACY-REPLACEMENT-AUDIT.md` 与 `09-12-SUMMARY.md`（+ 仓库外临时基线 `%TEMP%/opencode/gsd-09-12-baseline.txt`）。
- **零** `.ts` / `.tsx` 改动：基线（执行前 3 项既有用户并发改动）对比后无**新增**源码改动；未改任何既有注释、未改 `files_modified` 外文件。
- 用户的并发改动（`packages-user/data-state/**`、`09-CONTEXT.md`）未被暂存 / 提交。

## Task 0 Ruling (blocking-human already satisfied)

Task 0（`checkpoint:decision` `gate="blocking-human"`）由用户回复「可以执行」并采纳默认处置，已闭环。**OI-1..OI-6 最终裁定（全部采纳默认）：**

| 开放项 | 裁定 |
| --- | --- |
| OI-1 产出文档命名 / 路径 | 采纳默认：`09-LEGACY-REPLACEMENT-AUDIT.md`（连字符命名法） |
| OI-2 分类类别口径 | 采纳默认五类：可直接替换 / 有替代但需适配 / 有替代方案 / 无替代 / 待定 |
| OI-3 条目粒度 | 采纳默认：A 逐行 32 条 + C 去重成员 67 条 = 99 条基线 |
| OI-4 只读守卫机制 | 采纳默认：执行前基线对比（仅新增 `.ts`/`.tsx` 改动判红） |
| OI-5 搜索范围边界 | 采纳默认：`packages/**` + `packages-user/**`（排除 legacy），`src/` 仅参考 |
| OI-6 `可直接替换` 判据严格度 | 采纳默认（严格）：语义等价 + 无行为变化 + 无能力缺失 + 无契约破坏 |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- **Task 1 门禁：** 只读基线采集 OK（3 项既有改动）；`REPLACE-A GATE` OK（§0 + §A + 五类定义 + 锚点有效）；`READONLY` OK（无新增 `.ts`/`.tsx`）。
- **Task 2 门禁：** `REPLACE-C GATE` OK（§C + §汇总 + §改造顺序建议 + 全部 67 成员 + 六项计数自洽 + `client-base`/`client-modules`/`packages/` 锚点 + 锚点文件存在且行号在范围内）；`READONLY` 最终 OK。
- 未使用 `pnpm check:type` / `pnpm build` / 全仓 TS 诊断数门禁。

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- 文档存在且含 §0 / §A / §C / §汇总 / §改造顺序建议。
- 99 条目、六项计数自洽（99 = 0+25+40+8+26）。
- 全部 `file:line` 锚点指向真实存在且行号在范围内的文件。
