# Phase 6: 单元测试 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-14
**Phase:** 6-单元测试
**Areas discussed:** 测试层级与 fixture 策略, 问题记录与门禁策略, 存读档等价判定, 怪物数据验证含义

---

## 测试层级与 fixture 策略

| Option | Description | Selected |
|--------|-------------|----------|
| 混合（推荐） | 纯逻辑模块直接单测 + 跨系统经 CoreState 集成 | ✓ |
| 尽量 CoreState 端到端 | 能走 CoreState 就走，setup 慢、定位难 | |
| 尽量直接单测 | fake 接依赖，CoreState 仅用于存读档 | |

**User's choice:** 混合
**Notes:** 战斗与存读档也要有 CoreState 集成路径。

| Option | Description | Selected |
|--------|-------------|----------|
| 最小合成 fixture（推荐） | 手写小地图/小怪物/小录像数组 | ✓ |
| 复用现有 fixture | 复用 closed-loop.ts | |
| 真实游戏数据 | 读 public/ 数据 | |

**User's choice:** 最小合成 fixture

| Option | Description | Selected |
|--------|-------------|----------|
| 内联构造（推荐） | 每个测试文件内联 | ✓ |
| 建共享 factory | 跨文件 helper | |
| 扩展 closed-loop | 统一入口 | |

**User's choice:** 内联构造

| Option | Description | Selected |
|--------|-------------|----------|
| 真实计时器 + await（推荐） | await 控制器 onEnd | ✓ |
| fake timers | vi.useFakeTimers 加速 | |
| 按文件自定 | 不统一 | |

**User's choice:** 真实计时器 + await

---

## 问题记录与门禁策略

| Option | Description | Selected |
|--------|-------------|----------|
| skip + findings 文档（推荐） | it.skip/it.todo + 指向 findings，test:ci 全绿 | ✓ |
| 单独 probe 文件 | 从 test:ci 排除 | |
| 直接红灯 | 保留失败用例 | |

**User's choice:** skip + findings 文档

| Option | Description | Selected |
|--------|-------------|----------|
| 06-TEST-FINDINGS.md（推荐） | 结构化记录 | ✓ |
| 不落文件 | 口头汇报 | |
| 写 STATE.md | Blockers 区 | |

**User's choice:** 06-TEST-FINDINGS.md

| Option | Description | Selected |
|--------|-------------|----------|
| 全部测完统一汇报（推荐） | 整体确认 | |
| 逐个系统汇报 | 每系统汇报后确认 | ✓ |
| 不中途汇报 | | |

**User's choice:** 逐个系统汇报
**Notes:** 核心代码不得擅自修复；发现问题只分析、汇报，经确认后才改。

---

## 存读档等价判定

**设计发现：** `CoreState` 无公开 `save`/`load`，`saveables` 为 private，`saveSystem.init` 仅在 `coreInit` 时调用，Node 无 IndexedDB。

| Option | Description | Selected |
|--------|-------------|----------|
| 你设计公开入口 | 由用户设计 CoreState.save/load | |
| 复用 legacy 调用链 | 沿旧 core.save/load | |
| 只测 saveables 往返 | 不改接口，非端到端 | ✓ |
| 注入测试后端 | fake-indexeddb / 内存 ISaveSystem | |

**User's choice:** 只测 saveables 往返

| Option | Description | Selected |
|--------|-------------|----------|
| 4 个全部 × 全压缩档（推荐） | hero/flags/maps/enemy × None/Low/High | ✓ |
| 默认压缩为主 | | |
| 实现时定 | | |

**User's choice:** 4 个全部 × 全压缩档

| Option | Description | Selected |
|--------|-------------|----------|
| 跨实例恢复（推荐） | A 存档 → 新建 B 读档 → 对比 | |
| 同实例恢复 | save→改→load→回存档点 | ✓ |
| 两种都做 | | |

**User's choice:** 同实例恢复

| Option | Description | Selected |
|--------|-------------|----------|
| saveState 快照 + live 断言（推荐） | 深度相等 + 活状态断言 | |
| 仅 saveState 深度相等 | 纯契约级 | |
| 关键字段显式断言 | 只比对已知关键字段 | ✓ |

**User's choice:** 关键字段显式断言（不比较派生/缓存/序列化容器结构）

---

## 怪物数据验证含义

| Option | Description | Selected |
|--------|-------------|----------|
| 数据模型全量（推荐） | Enemy 属性/特殊属性增删改查 + save/load + dirty；Manager 注册表/模板/复用/比较 | ✓ |
| 只验注册/查询 | prefab/默认值/special 注册 | |
| legacy 导入路径 | fromLegacyEnemy / legacyIdToCode | |

**User's choice:** 数据模型全量

---

## the agent's Discretion

- 各系统内部具体测哪些函数/边界、用例命名与文件切分。

## Deferred Ideas

- Phase 6 非数据端覆盖（渲染/legacy）延后。
- CoreState 端到端存读档（需公开入口或可注入后端）未纳入本次。
- Phase 5 若改动数据端接口，本阶段测试需同步调整。
