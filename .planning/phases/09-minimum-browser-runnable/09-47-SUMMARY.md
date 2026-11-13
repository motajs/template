---
phase: 09-minimum-browser-runnable
plan: 47
subsystem: parity-audit
tags: [ui, input, parity, documentation]
depends_on: [09-44, 09-45]
requires: []
provides:
  - "04-UI-INPUT.md 重写为 114 行三值对照"
  - "旧侧面板、状态栏、工具栏、输入与文本交互基线"
affects: [09-PARITY]
tech-stack:
  added: []
  patterns: ["六列人读对照表", "三值判定", "旧侧单一来源"]
key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-47-SUMMARY.md
  modified:
    - .planning/phases/09-minimum-browser-runnable/09-PARITY/04-UI-INPUT.md
status: complete
duration: 2026-11-04 13:52 至 2026-11-04 14:06（UTC+8）
completed: 2026-11-04
---

# Phase 09 Plan 47: UI 与输入对照重写 Summary

把 `04-UI-INPUT.md` 从五值审计版重写为 114 行旧侧条目的三值人读对照表：删除新侧热键分组表与影响等级，统一六列表头，用现有 Vue 组件与热键接口重新判定旧面板与输入能力。

## 计数

- 当前特性表行数：125
- 移除新引擎独有行：11
- 基线行数：114
- 新文档行数：114

## 三值统计

- 支持：46
- 部分支持：63
- 不支持：5

分节统计：面板与事件标识 29（8 / 19 / 2）、状态栏项 13（7 / 5 / 1）、工具栏按钮 14（2 / 12 / 0）、输入动作 12（9 / 3 / 0）、设置与存读档面板 12（5 / 6 / 1）、图鉴与装备栏与道具箱与商店与地图查看与飞行 7（1 / 6 / 0）、文本与选择与输入与等待 10（10 / 0 / 0）、疑似缺口专项 17（4 / 12 / 1）。

## 移除的新侧新增行

`## 4.2` 新热键分组表整表移除，共 11 行：common、game、ui、system、start、book、fly、plane-fly、save、view-map、input。旧按键模型与 12 个输入动作保留，改为 `## 4` 的短段落加逐条对照。

## 合并与拆分

- 三条回放读档状态在 `## 5` 合并为第 80 条，在 `## 8` 仍拆为第 107 至 109 条专项记录。
- 手机按钮 1 至 7 合并为第 53 条，手机按钮 8 单列为第 54 条。
- 其余条目逐项对应，没有额外合并或拆分。

## 判定口径调整

- 只保留「支持」「部分支持」「不支持」三值；删除影响等级、五值枚举、证据等级与新侧新增说明。
- 旧画布面板只要能由现有组件简单组合，就判支持或部分支持，不再机械判为不支持；需要整块缺失系统或复杂算法的仍判不支持（事件执行态、存档笔记、技能项）。
- 仅调用旧全局门面的行不判支持；实现列只写新包内组件、接口与标签，旧调用只出现在差异列。

## 双记录

`## 1.2` 保留 7 个 `project/functions.js` 覆写符号的双锚点：`onKeyUp`、`onStatusBarClick`、`getToolboxItems`、`drawStatusBar`、`drawStatistics`、`drawAbout`、`updateStatusBar`。正文相关行在差异列引用对应覆写。

## 门禁输出

- Task 1：`raw=125`，清单文件存在且含基线 114，通过。
- Task 2：`rows=114 bad=0`，通过。
- Task 3：`rows=114`，禁用词扫描为空，六列表头 8 张全部一致，通过。
- Task 4：`UI GATES OK`，旧锚点 313 个、新锚点 174 个，长行 0、代码围栏 0，三值统计相加 114，范围与基线一致，目标哈希已变化。

## 范围证明

- 只写目标文档与摘要两份 Markdown，均在 `.planning/phases/09-minimum-browser-runnable/` 下。
- 未改 `00-INDEX.md`、`01-DATA.md`、`02-GAMEPLAY.md`、`03-RENDER.md`、05 运行时分册、`09-42-PLAN.md`、任何源码、配置、内容、`STATE.md`、`ROADMAP.md` 或既有计划与摘要。
- 源码范围状态与基线完全一致（`src`、`packages`、`packages-user`、`public`、`package.json`、`pnpm-lock.yaml`、`STATE.md`、`ROADMAP.md`）。
- 未执行任何 git 写命令，两份文档保持未提交；未安装依赖，未调用 `pnpm` 与 `opencode`。

## Deviations

**1. 门禁词表误伤旧标识**
- 发现于 Task 3 自检。
- 问题：禁用词表包含 `info` 与 `UNCERTAIN`，前者会命中旧面板标识 `gameInfo`，后者会命中 05 分册文件名。
- 处理：按 00-INDEX 的写作要求改用可观察能力命名（游戏信息菜单）与「05 运行时分册」，不放宽门禁、不删除条目。
- 影响：无条目丢失，判定与计数不变。

**2. Task 2 与 Task 3 的执行顺序**
- 判定矩阵由目标文档草稿派生，保证 114 行逐项一致；Task 2 门禁在文档定稿前运行，Task 4 复跑全部门禁。
- 影响：无，最终三值统计与文档一致。

## Self-Check

- 目标文档存在且 114 行，六列表头 8 张一致。
- 旧锚点 313 个、新锚点 174 个，均高于门限。
- 目标文档哈希相对基线已变化；两份文件未提交。
- 源码与配置范围与基线一致。

## Self-Check: PASSED
