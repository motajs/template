# Requirements: 魔塔游戏引擎（mota-ts）

**Defined:** 2026-09-07
**Core Value:** 引擎能完整跑通一部魔塔——开局到结局，存档、战斗、地图、事件、剧情全链路可玩。

## v1 Requirements

Requirements for the engine's completion. Each maps to roadmap phases.

### 事件系统（Event）

- [ ] **EVT-01**: 引擎提供事件系统的数据/序列化接口，支持 blockly 式低代码定义（编辑器在外部项目）
- [ ] **EVT-02**: 事件系统能驱动简单场景的事件流程（如踩踏触发、对话、开门）
- [ ] **EVT-03**: 事件系统定位为初学者抽象，仅覆盖简单场景，不为复杂场景追求通用表达

### 寻路（Pathfinding）

- [ ] **PATH-01**: 引擎支持自动寻路
- [ ] **PATH-02**: 移动端通过点击地图触发自动寻路移动

### 渲染适配与双布局（Render）

- [ ] **REND-01**: 渲染端适配新数据层接口
- [ ] **REND-02**: 渲染端同时支持移动端与桌面端布局

### Legacy 移植（Legacy）

- [ ] **LEGACY-01**: 删除被新接口覆盖的 legacy 系统
- [ ] **LEGACY-02**: 将仍需要的 legacy 内容迁移到新接口；无新接口覆盖时才新增接口（设计由用户把控）

### 测试（Testing）

- [ ] **TEST-01**: 为核心系统（数据层等）补齐单元测试

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| 可视化编辑器（blockly UI） | 位于独立项目，不在本仓库 |
| 复杂场景的通用事件表达能力 | 事件系统定位为初学者抽象，避免为表达力过度设计 |
| 收尾工作的提前规划 | 随测试逐步发现，执行期处理 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EVT-01 | — | Pending |
| EVT-02 | — | Pending |
| EVT-03 | — | Pending |
| PATH-01 | — | Pending |
| PATH-02 | — | Pending |
| REND-01 | — | Pending |
| REND-02 | — | Pending |
| LEGACY-01 | — | Pending |
| LEGACY-02 | — | Pending |
| TEST-01 | — | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10 ⚠️

---
*Requirements defined: 2026-09-07*
*Last updated: 2026-09-07 after initial definition*
