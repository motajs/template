# Phase 7: 数据端缺陷修复 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-15
**Phase:** 7-数据端缺陷修复
**Areas discussed:** 修复范围与优先级, 契约冲突裁决, 接口/接线缺口边界, 验证与提交节奏, 修复方式

---

## 修复范围与优先级

| Option | Description | Selected |
|--------|-------------|----------|
| 全部 20 条纳入 | 含低危死码/文案类，一次清完、WINDOWS.md 全绿 | ✓ |
| 仅高/中严重度 | 低危延后到独立小阶段 | |
| 分两批：先阻塞后其余 | 第一批修阻塞/高，第二批修其余 | |

**User's choice:** 全部 20 条纳入
**Notes:** 先更正了条数——登记为 20 条（不是 26），`#06-09-4` 已作废，`#06-15-1` 与 `#06-01-4` 同根因。

| Option | Description | Selected |
|--------|-------------|----------|
| 按系统切多个 PLAN | combat/enemy/replay/hero/map/flag+common/save/path，系统内先高后低 | ✓ |
| 单 PLAN 一次修完 | 一次审查面大、出问题难定位 | |
| 按根因依赖排序 | 先根因后严重度 | |

**User's choice:** 按系统切多个 PLAN

---

## 契约冲突裁决

| Option | Description | Selected |
|--------|-------------|----------|
| #06-01-3 改实现对齐文档 | `before` 返回 false 才放弃战斗 | ✓ |
| #06-05-3 补全 147 诊断 | 让 147 可达 | |
| #06-06-1 改发 128 | 越图分支发 128 | ✓ |
| #06-09-5 对齐 178 语义 | 178=多出的 key | （先澄清） |

**User's choice:** #06-01-3 改实现对齐文档；#06-06-1 改发 128；对 178 提出「按照我的理解应该没有问题」。
**Notes:** 已核实 core.ts:531-536 的方向反了；177（缺 key）与 178（多 key）当前重复，且既有 `:322` 用例把错误行为固化。

| Option | Description | Selected |
|--------|-------------|----------|
| 按文案改实现（178=多出的 key） | `loaded.difference(total)`，并更新 `:322` 用例 | ✓ |
| 保持实现，调整文案/合并 | 视为缺 key 语义 | |
| 我先说我的理解 | — | |

**User's choice:** 按文案改实现（178=多出的 key）

| Option | Description | Selected |
|--------|-------------|----------|
| 补全 147 触发路径 | 让 147 可达 | |
| 移除死分支 + 标注保留 | 标为保留未用码 | |
| 保持现状（登记已知死码） | 不改代码 | ✓ |

**User's choice:** 「不可能触发不等于这个错误码没用，错误码关注的是语义错误，而不是有没有可能被触发，因此保留，什么都不要动，也不要标记死码」

| Option | Description | Selected |
|--------|-------------|----------|
| 保留 skip + 注释 | 147 为保留错误码、设计如此 | ✓ |
| 删除该用例 | 不再把 147 当可达码目标 | |
| 改为当前行为断言 | 断言 canEquipTo 返回 CannotEquip | |

**User's choice:** 保留 skip + 注释

---

## 接口/接线缺口边界

| Option | Description | Selected |
|--------|-------------|----------|
| 本阶段接线（CoreState 注入） | AI 在 CoreState 注入 finder | |
| 客户端层注入，仅明确契约 | 不改 CoreState | |
| 我先给注入方案 | — | |

**User's choice:**「我自己改这个」
**Notes:** `#06-07-1` 由用户亲自修改；AI 不实现该接线。

| Option | Description | Selected |
|--------|-------------|----------|
| 改实现：接入复用映射 | createEnemy 走 internalGetPrefab | ✓ |
| 保持现状（设计如此） | createEnemy 只认真实 code/id | |

**User's choice:** 改实现：接入复用映射

---

## 验证与提交节奏

| Option | Description | Selected |
|--------|-------------|----------|
| 沿用 D-44 文件级 | eslint 0 错误 + 文件级 vue-tsc 0 错误 + test:ci 全绿 | ✓ |
| 加严到数据端整包 | 额外要求四包 check:type/check:circular 全绿 | |

**User's choice:** 沿用 D-44 文件级

| Option | Description | Selected |
|--------|-------------|----------|
| 按缺陷/根因原子提交 | 同根因合一个 commit | ✓ |
| 按系统提交 | 系统内多条一起 | |
| 单 commit | 整个 Phase 7 一个提交 | |

**User's choice:** 按缺陷/根因原子提交

| Option | Description | Selected |
|--------|-------------|----------|
| 修复结清 + 其余 waive | windows fixed；设计如此/用户自改的 waive | ✓ |
| 全部清零 | 不留 open | |
| 暂不结清 | 由后续 ship 处理 | |

**User's choice:** 修复结清 + 其余 waive

---

## 修复方式

| Option | Description | Selected |
|--------|-------------|----------|
| 最小修复，不扩大变更面 | 只改缺陷相关实现 | |
| 允许必要内部重构 | 调整内部结构以真正修好 | |

**User's choice:** 「每个计划开始执行前暂停并向我汇报修复方案，我确认后执行，若计划方案修复失败，不应自行探索其他方案，应退出本次修改并修订修复计划后重新执行」
**Notes:** 用户以**执行节奏强约束**替代了单纯的最小/重构选择；具体修法留待逐计划汇报确认。

| Option | Description | Selected |
|--------|-------------|----------|
| 仅取消 skip 转绿 | 不额外新增用例 | ✓ |
| 取消 skip + 补边界用例 | 补组合/边界回归 | |

**User's choice:** 仅取消 skip 转绿

| Option | Description | Selected |
|--------|-------------|----------|
| 同步更新文档与注释 | jsdoc/码表/契约文档与实现一致 | ✓ |
| 仅改代码 | 文档保持现状 | |

**User's choice:** 同步更新文档与注释

---

## the agent's Discretion

- 每条缺陷的具体修法（最小修复 vs 必要内部重构）、文件切分、用例命名、`#region` 划分由实现者决定，但必须按 D-09 在执行前汇报并获用户确认。

## Deferred Ideas

- Phase 6 非数据端覆盖（渲染 / legacy）仍延后。
- Phase 5（Legacy 移植）若改动数据端接口，本阶段需同步调整。
