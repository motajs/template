# Phase 1: 事件系统 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 1-事件系统
**Areas discussed:** 触发绑定机制, 执行流模型

---

## 触发绑定机制

| Option | Description | Selected |
|--------|-------------|----------|
| 对象绑定为主 | 事件挂在对象上，地图格本身无事件 | |
| 地图格绑定为主 | 事件挂在地图格上，踩上/站在格上触发 | |
| 对象+地图格混合 | 对象与地图格都可绑定事件，视场景而定 | ✓ |

**User's choice:** 对象 + 地图格混合绑定。

**Notes:** 用户随后给出完整的 8 点设计说明（触发器 EventTrigger 枚举 / Anon Tokyo 类型 / 执行 param+env / 事件返回 / eventStore 存储 / 点事件与图块事件 / 执行顺序优先级 / dirty 存档标记），并明确接口设计由其主导。

---

## 执行流模型

**User's choice:** 通过自由阐述 + 追问确定，关键结论：

- before 类触发器（OnBeforeBattle/OnBeforeOpenDoor/OnBeforeChangeFloor）的返回值处理：抽象一个专门对象负责事件执行
- 长事件（对话）直接用 `await`，不需要序列化执行状态；现阶段不聚焦解释执行细节
- 图块默认事件（怪物→战斗、道具→捡拾）也走 eventStore，可被自定义覆盖
- 旧 `ITrigger` 体系在本次阶段一并删除

**Notes:** Anon Tokyo 解释器（`anon-tokyo@0.0.0-alpha.0`）为领域专用解释器，`compile(Statement[])` → `AnonTokyoExecutable`，执行 `execute(param, env)`。

---

## the agent's Discretion

无——接口设计由用户主导（PROJECT.md 协作模型）；AI 仅在已设计接口上实现、不自行设计接口。

## Deferred Ideas

None——讨论保持在阶段范围内，未提出跨阶段新增能力。
