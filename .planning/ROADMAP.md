# Roadmap: 魔塔游戏引擎（mota-ts）

## Overview

引擎从旧 mota-js 运行时逐步重构，渲染端已重构完成，数据端接口设计中。本路线图沿「事件系统 → 寻路 → 数据端完成 → 渲染适配 → legacy 移植 → 单元测试」的依赖顺序推进：先补齐剧情事件、自动寻路两大玩法系统，再完成数据端 L0–L3 接口落地，随后把新数据层与已重构渲染端打通并支持双布局，接着清理被新接口覆盖的 legacy，最后以单元测试兜底，使引擎能完整跑通一部魔塔。接口/架构设计由用户主导，AI 负责实现与测试；验证通过后 AI 可自行创建 git commit。

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: 事件系统** - blockly 式低代码事件定义，驱动简单场景事件流程
- [ ] **Phase 2: 寻路系统** - 自动寻路与移动端点击地图触发移动
- [ ] **Phase 3: 数据端完成** - 数据端 L0–L3 接口全部落地，可在 Node 环境独立跑回放验证
- [ ] **Phase 4: 渲染适配与双布局** - 新数据层 ↔ 已重构渲染端对接，支持移动端与桌面端双布局
- [ ] **Phase 5: Legacy 移植** - 删除被新接口覆盖的旧系统，迁移仍需要的内容
- [ ] **Phase 6: 单元测试** - 为核心系统补齐单元测试

## Phase Details

### Phase 1: 事件系统

**Goal**: 引擎能以 blockly 式低代码定义事件，并驱动简单场景的事件流程
**Depends on**: Nothing (first phase)
**Requirements**: EVT-01, EVT-02, EVT-03
**Success Criteria** (what must be TRUE):

  1. 开发者能通过数据/序列化接口定义事件（blockly 式低代码可序列化为引擎事件数据，编辑器在外部项目）
  2. 引擎能执行踩踏触发事件（角色踩上地板触发对应事件）
  3. 引擎能执行踩踏触发事件驱动的事件执行链路（对话/开门依赖 A2 内建函数清单，延后到收尾工作）
  4. 事件系统保持面向初学者的简单抽象，未引入复杂场景的通用表达能力

**Plans**: 6/10 plans executed
Plans:

- [x] 01-04-PLAN.md
- [x] 01-05-PLAN.md
- [x] 01-06-PLAN.md
- [ ] 01-07-PLAN.md
- [ ] 01-08-PLAN.md
- [ ] 01-09-PLAN.md
- [ ] 01-10-PLAN.md

**Wave 1**

- [x] 01-01-PLAN.md — L0/L1 事件数据契约落地 + 图块/点位事件视图 + 存读档迁移

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — 执行器接口用户确认（checkpoint）+ 执行器实现 + 删除旧 ITrigger（D-13）+ CoreState 装配

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — moverImpl 踩踏触发重写为事件执行 + 阶段验收

### Phase 2: 寻路系统

**Goal**: 引擎支持自动寻路，移动端点击地图即可触发移动
**Depends on**: Phase 1
**Requirements**: PATH-01, PATH-02
**Success Criteria** (what must be TRUE):

  1. 角色能在地图上自动寻路移动到指定格
  2. 移动端点击地图上的可达格时，角色自动寻路移动到该格
  3. 寻路正确避开不可通行格（碰撞/障碍/墙体）

**Plans**: TBD
**UI hint**: yes

### Phase 3: 数据端完成

**Goal**: 数据端 L0–L3 接口实现完成，数据层各系统可用并可在 Node 环境独立运行回放验证
**Depends on**: Phase 2
**Requirements**: DATA-01
**Success Criteria** (what must be TRUE):

  1. 用户设计的 L0–L3 数据层接口全部落地，地图/角色/敌人/flag/战斗/触发器/存档/回放各系统可用
  2. 数据端可在 Node 环境独立运行回放验证，无 DOM 依赖
  3. 数据端与渲染端保持双端分离，渲染相关代码经 `r()`/`rf()` 门控或走 hook，渲染端不向数据端推送更新
  4. 接口设计由用户主导，AI 仅负责实现

**Plans**: TBD

### Phase 4: 渲染适配与双布局

**Goal**: 渲染端通过新数据层接口驱动，并同时支持移动端与桌面端布局
**Depends on**: Phase 3
**Requirements**: REND-01, REND-02
**Success Criteria** (what must be TRUE):

  1. 用新数据层接口加载一张地图后，已重构的渲染端能正确渲染该地图场景
  2. 桌面端布局下，地图、角色、界面元素正常显示并可操作
  3. 移动端（窄屏）布局下，同一场景正常显示且可操作
  4. 数据端与渲染端保持双端分离——数据端无 DOM，仍可在 Node 环境跑回放验证

**Plans**: TBD
**UI hint**: yes

### Phase 5: Legacy 移植

**Goal**: 删除被新接口覆盖的 legacy 系统，迁移仍需要的内容
**Depends on**: Phases 1-4
**Requirements**: LEGACY-01, LEGACY-02
**Success Criteria** (what must be TRUE):

  1. 被新接口覆盖的 legacy 系统已删除，代码中无残留引用
  2. 仍需要的 legacy 内容已迁移到新接口
  3. 仅当无新接口覆盖时才新增接口，且接口设计经用户 review
  4. 移植后引擎仍能完整跑通一部魔塔，无功能回归

**Plans**: TBD

### Phase 6: 单元测试

**Goal**: 为核心系统（数据层等）补齐单元测试
**Depends on**: Phases 1-5
**Requirements**: TEST-01
**Success Criteria** (what must be TRUE):

  1. 核心数据层系统有单元测试覆盖
  2. 测试覆盖关键行为（战斗伤害、触发器、寻路、事件等）
  3. 测试在本地可运行且全部通过
   4. 测试由 AI 编写并运行，通过验证后可提交

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 事件系统 | 6/10 | In Progress|  |
| 2. 寻路系统 | 0/TBD | Not started | - |
| 3. 数据端完成 | 0/TBD | Not started | - |
| 4. 渲染适配与双布局 | 0/TBD | Not started | - |
| 5. Legacy 移植 | 0/TBD | Not started | - |
| 6. 单元测试 | 0/TBD | Not started | - |
