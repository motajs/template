# Phase 6: 单元测试 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-14
**Phase:** 6-单元测试
**Areas discussed:** 测试层级与 fixture 策略, 问题记录与门禁策略, 存读档等价判定, 怪物数据验证含义, 光环测试形态, 光环覆盖深度, 系统层效果组合, EnemyContext 覆盖判据

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

## 补充讨论（2026-09-14）：战斗系统覆盖深化（仅 06-01）

> 范围严格限定在战斗系统本身（`data-system/src/combat`）；顶层实现（`data-state` 的 calculator / CommonAura / GuardAura / 特殊属性语义 / 支援递归）不纳入本讨论。

### 光环测试形态

| Option | Description | Selected |
|--------|-------------|----------|
| 系统测试在 data-system，顶层实现验证在 data-state | 明确系统功能与顶层实现分工 | ✓（顶层部分经用户后续校正后移出本讨论） |
| data-system/combat 内 | 真实 EnemyContext + 真实 converter，用假 Enemy | |
| 两处分工 | 类单测留 data-state，集成放 data-system | |

**User's choice:** 系统功能测试归 `data-system`；顶层验证归 `data-state`（顶层内容不属本次讨论）
**Notes:** 后续校正：本次仅讨论 06-01 战斗系统问题，顶层实现无关内容不纳入。

| Option | Description | Selected |
|--------|-------------|----------|
| 手动装配（推荐） | new EnemyContext + registerAuraConverter + setEnemyAt | ✓ |
| 经 CoreState | 集成度高但重 | |
| 两者都要 | 核心手动 + CoreState 烟雾 | |

**User's choice:** 手动装配

| Option | Description | Selected |
|--------|-------------|----------|
| 保留并新增（推荐） | 类单测 + 新增集成测试，互补 | ✓ |
| 迁移合并 | 改写为集成用例 | |
| 只要嵌套集成 | | |

**User's choice:** 保留并新增
**Notes:** 校正后该 data-state 类单测改动不属本次讨论范围；战斗系统内沿用「保留并新增」原则。

| Option | Description | Selected |
|--------|-------------|----------|
| 复用 06-01 harness（推荐） | vi.hoisted 全局 stub + 动态 import 包 | ✓ |
| 真实顶层 import | 直接 import @user/data-state | |

**User's choice:** 复用 06-01 harness

### 光环覆盖深度

| Option | Description | Selected |
|--------|-------------|----------|
| 三种范围 + 范围外（推荐） | Full / Rect / Manhattan + 范围外不生效 | ✓ |
| 只覆盖一种 | | |
| 你决定 | | |

**User's choice:** 三种范围 + 范围外

| Option | Description | Selected |
|--------|-------------|----------|
| 一层 + 两层（推荐） | 光环→特殊属性；光环→特殊属性→再转换出光环 | |
| 仅一层 | | |
| 两层 + 优先级边界 | | ✓ |

**User's choice:** 两层 + 优先级边界

| Option | Description | Selected |
|--------|-------------|----------|
| 全部警告码（推荐） | 97/98/99/100/101 | ✓ |
| 只 98/99 | | |
| 不专门覆盖 | | |

**User's choice:** 全部警告码 97/98/99/100/101

| Option | Description | Selected |
|--------|-------------|----------|
| 纳入（推荐） | 支援怪吃到位置光环加成 + 递归累加 | ✓ |
| 不纳入 | | |
| 只补交叉点 | | |

**User's choice:** 纳入
**Notes:** 后续校正：支援/guard 的验证归属顶层（`data-state`），不属 06-01 战斗系统，本次排除。

### 系统层效果组合与边界

| Option | Description | Selected |
|--------|-------------|----------|
| 光环↔常规查询 | query 读到光环改过的属性 | ✓ |
| 光环特殊↔特殊查询 | 同优先级链上的 add/delete/modify 相互影响 | ✓ |
| final-effect 阶段顺序 | final 最后执行、不能查询上下文 | ✓ |
| 优先级/阶段顺序 | 同优先级内顺序、跨优先级传播 | ✓ |

**User's choice:** 四类全纳入

| Option | Description | Selected |
|--------|-------------|----------|
| 明确切开（推荐） | data-system 只用 fake 效果/光环驱动，不重测顶层语义 | ✓ |
| 允许少量交叉 | | |
| 你决定 | | |

**User's choice:** 明确切开

| Option | Description | Selected |
|--------|-------------|----------|
| 断言顺序 + 可见性（推荐） | 四阶段顺序 + 阶段间可见性 | ✓ |
| 只断言结果 | | |
| 只断言关键顺序 | | |

**User's choice:** 断言顺序 + 可见性

| Option | Description | Selected |
|--------|-------------|----------|
| 纳入系统伤害流程（推荐） | 属性→伤害联动，注入 fake 计算器 | ✓ |
| 不纳入 | | |
| 只加烟雾 | | |

**User's choice:** 纳入系统伤害流程

### EnemyContext 覆盖判据

| Option | Description | Selected |
|--------|-------------|----------|
| 全接口 + 按需边界（推荐） | 每个公开方法≥1 正常用例 | ✓ |
| 全接口 + 全边界 | 最严 | |
| 只关键接口 | | |

**User's choice:** 全接口 + 按需边界

| Option | Description | Selected |
|--------|-------------|----------|
| 警告码 | 97/98/99/100/101/110 | ✓ |
| 未知/空输入 | null 或 no-op | ✓ |
| 生命周期清空 | resize/clear/destroy | ✓ |
| 脏标记守卫 | markDirty/requestRefresh 守卫 | |

**User's choice:** 警告码、未知/空输入、生命周期清空

| Option | Description | Selected |
|--------|-------------|----------|
| 写入 must_haves（推荐） | 作为阶段完成判据 | ✓ |
| 只进验收标准 | | |

**User's choice:** 写入 must_haves

| Option | Description | Selected |
|--------|-------------|----------|
| 两条都要（推荐） | 全量 buildup + 局部 requestRefresh | ✓ |
| 只全量 | | |
| 只局部 | | |

**User's choice:** 两条都要

---

## 补充讨论（2026-09-14）：全计划覆盖规则与计划重构

### 结构 / 交叉规则

| 决策 | 选择 |
|------|------|
| 06-06 并入 06-05 后编号 | 重排（06-05 勇士全部 / 06-06 地图 / 06-07 集成 / 06-08 flag+common / 06-09 存档） |
| 接口全覆盖判定 | 公开方法 ≥1 正常 |
| warn/error code 全覆盖 | 模块可达 + 阶段级 `06-COVERAGE-MAP.md` 映射表 |
| legacy 边界 | 名称含 legacy 的接口/方法一律排除 |
| 执行节奏 | 执行前先确认；执行后暂停，中文分条汇报；详情写共用 `06-TEST-FINDINGS.md` |
| findings 文件 | 共用一本 |
| 已执行 06-01/06-02 返工 | supersede 后同号重跑 |

### 各计划范围

| 计划 | 用户决策 |
|------|----------|
| 06-02 | 只测顶层实现基本功能；组合后移至 06-07；范围确认 |
| 06-03 | 除 legacy 外全部公开接口；确认 |
| 06-04 | 存档相关内容全部移到最后的存档计划；编解码覆盖 boolean/整数/bigint/string/数组；error 2001–2008 归 06-07 |
| 06-05 | 含 rendering，全部勇士文件 |
| 06-06 | 全地图接口 + 重点（静态图块/动态转换/静态数组） |
| 06-07 | 顶层+系统组合都纳入；录像重置允许最小使用存档；真实 API 构造小地图；二次录制逐条完全相等 |
| 06-08 | common 含 utils/indexer/faceManager+face/mover |
| 06-09 | 全部可存档类 + CoreState；用 CoreState.getSaveableContent；需先加公开接口；排除字段由实现推导 |

### 执行前确认范围
- 用户最终裁定：**每个计划执行前都先确认**。

### 关键边界补充
- **存读档独立系统**：所有 `saveState`/`loadState` 测试集中到 06-09；其他计划不得测存读档（06-07 录象重置除外，且为最小使用）。
- **06-09 阻塞**：用户可能再调整 CoreState 的可存档内容（例如录像存档目前未计入但应计入），且需先加公开 save/load 入口——执行前必须确认。
- **06-07 阻塞**：目前尚未在具体操作中接通录像记录，需用户先改代码——执行前必须确认。

---

## 补充讨论（2026-09-14）：阶段化测试（D-43）

**背景（用户指出）**：战斗系统写完后从未测过，直接端到端大概率整链跑不通，应先分阶段测再完整测。

| 决策 | 选择 |
|------|------|
| 06-01 阶段划分 | 三阶段：构件 → 流水线 → 完整 |
| 适用范围 | 全部 9 个计划 |
| 阶段间阻断性 bug | 暂停并向用户汇报、等确认（D-05/D-07） |
| tracer-first | 取消 |

---

## 补充讨论（2026-09-14）：lint/类型门禁（D-44）

**背景（用户指出）**：测试文件存在格式化错误与类型错误；执行器未检查就提交。vitest 用 esbuild 剥类型，类型错误不会让测试失败。

| 决策 | 选择 |
|------|------|
| 现有文件处理 | 立刻清理（已完成，提交 `136a984`） |
| 门禁粒度 | 文件级 `eslint` + `vue-tsc` 类型检查 + `pnpm test:ci` 全绿才提交 |
| 类型判定 | 全局 `check:type` 已有既有无关错误，故按「改动测试文件」过滤判定 |

---

## the agent's Discretion

- 各系统内部具体测哪些函数/边界、用例命名与文件切分。

## Deferred Ideas

- Phase 6 非数据端覆盖（渲染/legacy）延后。
- CoreState 端到端存读档（需公开入口或可注入后端）未纳入本次。
- Phase 5 若改动数据端接口，本阶段测试需同步调整。
- 顶层实现（`data-state` 的 calculator / CommonAura / GuardAura / 特殊属性语义 / 支援递归）与 data-state 现有测试改动不属 06-01 战斗系统深化讨论。
