# Phase 4: 渲染适配与双布局 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-18
**Phase:** 4-渲染适配与双布局
**Areas discussed:** 第一步范围（对账）、被查子包、文档组织、交付路径

---

## 讨论主导权

用户明确要求：讨论阶段由用户主导，不由 AI 先行探索代码，也不由 AI 自行分析需求并提问。AI 在用户说明计划前不得开启子代理扫描项目。

**Notes:** 用户指出「先别开子代理看项目，我还没说这阶段要干啥」。

---

## 第一步范围（对账）

用户提出的第一步计划：收集当前所有与数据端接口不匹配的渲染端实现（含依赖数据端的渲染行为）；数据端未提供而渲染端需要的接口、双方错配等单独写到文档中，便于后续处理。这一步只读清点、不改代码，作为后续计划拆分实施的依据。

---

## 被查子包

| Option | Description | Selected |
|--------|-------------|----------|
| client-base | 渲染系统层 | ✓ |
| client-modules | 渲染实现层 | ✓ |
| entry-client | 渲染端组合根 | |
| legacy-plugin-client / legacy-plugin-data | legacy 插件 | |
| data-fallback | legacy 全局桥接兼容层 | |

**User's choice:** 仅 client-base、client-modules。
**Notes:** 用户另说明：范围「仅 packages-user」，`packages` 偏向第三方库、本身不影响渲染端与数据端，不查。

---

## 文档组织

| Option | Description | Selected |
|--------|-------------|----------|
| 单文档分节 | 04-RENDER-INTERFACE-AUDIT.md 内分「错配 / 数据端缺失接口 / 多余旧路径」，缺失项独立小节 | ✓ |
| 两份文档 | 对账清单 + 缺失接口登记各一份 | |

**User's choice:** 单文档分节。

---

## 交付路径

| Option | Description | Selected |
|--------|-------------|----------|
| 是，按 GSD 走 | discuss → /gsd-plan-phase 4（04-01 = 该对账）→ execute 产出文档，全程只读 | ✓ |
| 否，先停在这 | 暂不进入 plan | |

**User's choice:** 是，按 GSD 走。
**Notes:** 用户强调「严格按 GSD 流程走」。

---

## 命名确认

| 对象 | 命名 | 确认 |
|------|------|------|
| 阶段目录 | `04-render-adaptation` | ✓ |
| 对账文档 | `04-RENDER-INTERFACE-AUDIT.md` | ✓ |

---

## the agent's Discretion

- 「影响」字段的具体写法、「多余旧路径」是否进一步细分，由 AI 在执行对账时按实际情况把握，但不得据此扩大范围。

## Deferred Ideas

- 阶段 4 后续步骤（实际适配实施、双布局实现）——待对账结果出来后规划。
- 明确不纳入本次第一步：`packages` 全部、`entry-client`、`legacy-plugin-*`、`data-fallback`。
