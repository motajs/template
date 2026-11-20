---
phase: 09-minimum-browser-runnable
plan: 45
subsystem: gameplay-parity
tags: [parity, gameplay, documentation]
status: complete
key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-45-SUMMARY.md
  modified:
    - .planning/phases/09-minimum-browser-runnable/09-PARITY/02-GAMEPLAY.md
metrics:
  completed: 2026-11-03 21:55 +08:00
---

# Phase 09 Plan 45: 玩法对照重写 Summary

把 `09-PARITY/02-GAMEPLAY.md` 重写为旧样板视角的六列人读对照表：只保留旧引擎玩法条目，按现有域拆分保留 272 行，统一三值判定。旧引擎是唯一清单来源，新样板只作实现依据。

## 行数与统计

- 当前特性表行数：283
- 移除新引擎独有行：11
- 基线行数：272
- 新文档行数：272
- 支持：55
- 部分支持：45
- 不支持：172

三值相加 55 + 45 + 172 = 272。
- not planned：33（标号 21、23、24、187、197、207、209、212；248–272）；maybe：3（204、205、220）

移除的 11 行：光环附录 1 行（特殊光环）、7.13(c) 内建函数与新语句种类 2 行、11.2 新回放指令 8 行。

## 域拆分

| 域 | 行数 |
| --- | --- |
| 伤害管线 | 18 |
| 临界算法 | 9 |
| 光环与支援 | 8 |
| 地图伤害 | 9 |
| 减益与状态 | 8 |
| 事件语句 | 129 |
| 预编译与系统触发器 | 26 |
| 事件值表达式 | 5 |
| 寻路、移动与楼层 | 9 |
| 商店、升级与统计 | 11 |
| 回放命令与路线编码 | 40 |

## 覆盖

- 旧事件语句 129 / 129，按文本、地图、动画、移动、图像、门与商店、音频、值、交互、状态栏、存读档、绘制分组。
- 预编译 18 / 18；系统触发器 8 / 8；回放动作 15 / 15；路线字母 24 / 24；兜底形式 1 / 1。
- 旧锚点 488 个，新锚点 277 个。
- 25 张功能表全部使用同一六列表头。

## 合并与拆分记录

- 合并：旧连击码 4、5、6 在新引擎合并为新码 4，按旧三个语句的各一行保留，差异写在说明列。
- 合并：旧坚固与模仿共用临界短路，新只对坚固短路，仍按旧分支逐行保留。
- 合并：旧支援回合不并入、新直接相加，差异写在伤害第 13 行与支援第 6 行。
- 拆分：旧 `move` 回放动作在新拆成四个方向指令，仍按一个旧动作计数。
- 拆分：24 个路线字母逐个保留，不当作独立能力重复计数。

## 门禁结果

- Task 1：通过，`raw=283`，清单含 129 语句、18 预编译、8 触发器、15 回放动作、24 字母，基线 272。
- Task 2：通过，`rows=272 bad=0`。
- Task 3 / Task 4 原文门禁：在 `05-RUNTIME-UNCERTAIN.md` 文件名处命中 `UNCERTAIN`，命令以非零退出。这是计划禁止词表与必需分册文件名的冲突，属误报（见下方偏差）。
- Task 3 / Task 4 掩码复核：把该文件名临时替换后，`forbidden=0`、`rows=272`、`badV=0`、`badS=0`、`headers=25 exact=25`、`oldAnchors=488`、`newAnchors=277`、`longLines=0`、`fences=0`，其余条件全部满足。
- 范围：`extra=0`，`scopeEqual=True`，`hashChanged=True`。

## 偏差

- **事件判定**：按用户要求把 53–181 的 129 条事件语句全部改为“不支持”。
- **回放判定**：247 的 `no` 改为“不支持”（用于移动到楼层转换图块而不触发）；12.2/12.3 全部标为 `not planned`。

- **门禁误报**：`05-RUNTIME-UNCERTAIN.md` 是 00-INDEX.md 指定的必需分册文件名，文件名本身含计划禁止词 `UNCERTAIN`。按本次执行要求保留该路径，并在此记录门禁缺陷；掩码复核证明除该文件名外全部门禁通过。
- **生成方式**：目标文档由 Node 从与判定清单相同的数据源生成，避免 272 行手工复制漂移；分节、六列表头与三值判定均按计划执行，两个目标文件仍为未提交的 Markdown。

## 范围证明

- 只写 `.planning/phases/09-minimum-browser-runnable/09-PARITY/02-GAMEPLAY.md` 与 `.planning/phases/09-minimum-browser-runnable/09-45-SUMMARY.md`。
- 未改 `00-INDEX.md`、`01-DATA.md`、`03-RENDER.md` 至 `05-RUNTIME-UNCERTAIN.md`、任何计划、源码、配置、STATE、ROADMAP。
- 相对基线只多出目标文档的修改与本 SUMMARY。
- 零代码改动，零提交，两个 Markdown 文件保持未提交。
- 快照：旧样板 `3efb548e407ad2b8007b498cb98401e2012a0b55`（工作树 0 行）；新样板 `5af3ab378b4d65dc5cf1fbcb621fd9a776608dd7`（工作树 161 行，采样时）；采样时间 2026-11-03 21:54（UTC+8）。

## Self-Check: PASSED

- 目标文档存在，272 行，六列表头 25 张全部一致。
- SUMMARY 存在，三值合计 55 + 45 + 172 = 272。
- 范围无目标外路径；源码、配置、STATE、ROADMAP 与基线一致；无提交。
- 唯一未通过项是必需文件名触发的禁止词误报，已在偏差中记录。
