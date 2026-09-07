# 魔塔游戏引擎（mota-ts）

## What This Is

一个完整的、数据驱动的、可复用的魔塔（Mota / Tower of the Sorcerer）游戏引擎。引擎在 `mota-ts` pnpm monorepo 中从旧引擎逐步重构而来，当前仍在建设中。它由运行时核心（数据驱动）+ 渲染表现层组成，能够驱动一部魔塔作品从开局到结局完整可玩；配套的可视化编辑器（blockly 式低代码）位于独立项目，不在本仓库。

## Core Value

引擎能完整跑通一部魔塔——开局到结局，存档、战斗、地图、事件、剧情全链路可玩。

## Requirements

### Validated

- ✓ 分层架构：`src → packages-user → packages` 单向依赖 — 现有
- ✓ `Mota` 模块注册表（运行时 DI 容器）— 现有
- ✓ 数据端 / 渲染端双端分离（数据端可在 Node 中独立跑回放验证）— 现有
- ✓ 渲染引擎（WebGL2 + 自定义 Vue renderer）— 已重构完成
- ✓ 数据层 L0–L3（data-common / data-base / data-system / data-state）— 接口设计进行中
- ✓ `SaveSystem`（Dexie）/ `ReplaySystem`（回放验证）— 现有
- ✓ 战斗伤害系统 + 触发器注册表 — 现有
- ✓ audio / animate / loader / system（热键与 UI）— 现有

### Active

- [ ] 事件系统：低代码（blockly 式）目标，面向初学者，仅覆盖简单场景，不为复杂场景过度设计
- [ ] 寻路系统：自动寻路，移动端点击地图触发移动
- [ ] 渲染端适配：新数据层 ↔ 已重构的渲染端对接
- [ ] 移动端 + 桌面端双布局：渲染端支持两种布局
- [ ] legacy 内容移植：删除被新接口覆盖的旧系统，迁移相关内容；无覆盖才新增接口
- [ ] 单元测试：为重构后的引擎补齐单测（由 AI 完成）
- [ ] 收尾工作：系统完成后随测试逐步发现的零碎项，不提前规划

### Out of Scope

- 可视化编辑器 — 位于独立项目，不在本仓库
- 复杂场景的通用事件表达能力 — 事件系统定位为初学者抽象，避免为提高表达力走偏

## Context

- **技术栈**：TypeScript 6 + Vue 3 + 自研 WebGL2 渲染器 + Vite 7 + pnpm 10 monorepo；数据端独立打包为 IIFE 供 Node 回放验证。
- **重构背景**：从旧 mota-js 运行时（`public/`）逐步重构，通过 `Patch` 桥接 legacy 全局变量。渲染端先完成重构，数据端接口设计中。
- **双端约束**：数据端无 DOM；渲染相关代码必须用 `r()`/`rf()` 门控或走 `hook` 事件，渲染端被动、不向数据端推送更新。
- **协作模型**：接口/架构设计由用户主导；AI 负责接口实现与单元测试；所有 git 提交必须经用户 review，不得擅自提交。

## Constraints

- **技术栈**：TypeScript + Vue 3 + WebGL2 + Vite + pnpm（固定，重构延续）
- **协作分工**：AI 不做接口设计，仅做实现与测试
- **代码质量**：strict 模式、禁用 `as` 断言、logger 数字错误码、禁止循环依赖与模块顶层副作用
- **Git**：提交须经 review，AI 不擅自提交

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 数据层接口设计由用户完成，AI 仅实现 | 保证接口设计质量 | — Pending |
| 渲染层先于数据层完成重构 | 从旧引擎逐步重构的既定顺序 | — Pending |
| 事件系统采用 blockly 式低代码，仅覆盖简单场景 | 面向初学者，避免过度设计 | — Pending |
| 引擎含编辑器，但编辑器在独立项目 | 职责边界清晰 | — Pending |
| Git 提交必须经用户 review | 保证代码质量在线 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-07 after initialization*
