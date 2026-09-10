# Phase 3: 数据端完成 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-10
**Phase:** 3-数据端完成
**Areas discussed:** 单元测试边界, 录像修饰器与回放, 顶层整合与注册, Node 验收与质量门禁

---

## 单元测试边界

| Decision | Alternatives considered | Selected |
|----------|-------------------------|----------|
| 阶段边界 | 只做闭环必需覆盖；本阶段全部补齐；只做冒烟测试 | 闭环必需覆盖 ✓ |
| 接口歧义 | 停下等待接口决定；按现有实现补齐；局部推断后实现 | 停下等待接口决定 ✓ |
| 测试隔离 | 新测试优先注入依赖；统一沿用全局 stub；先彻底移除 bridge | 新测试优先注入依赖 ✓ |
| 测试门禁 | 数据端全套通过；仓库全套通过；按系统逐批通过 | 数据端全套通过 ✓ |

**User's choice:** 阶段 3 做数据端闭环必需测试，阶段 6 再补完整覆盖；接口不明确时必须停下提问。
**Notes:** 新测试使用显式依赖和 fixture，只有 bridge 测试保留必要的 legacy 全局 stub。

---

## 录像修饰器与回放

| Decision | Alternatives considered | Selected |
|----------|-------------------------|----------|
| 修饰范围 | 外部可调用状态入口；所有状态写入函数；只修饰顶层命令 | 外部可调用状态入口 ✓ |
| 异步语义 | 等待完整动作；只包同步调用；调用/完成拆分 | 等待完整动作 ✓ |
| 回放失败 | 首个分歧立即失败；记录后继续；仅安全检查警告 | 首个分歧立即失败 ✓ |
| 命令注册 | 顶层统一注册；各系统自注册；保留旧协议优先 | 顶层统一注册 ✓ |

**User's choice:** 录像修饰器只加在外部可调用状态入口；异步动作必须等待结束；回放首个分歧立即失败并报告；命令码由顶层统一注册。
**Notes:** 纯查询、纯计算和内部辅助函数不应制造重复录像语义。

---

## 顶层整合与注册

| Decision | Alternatives considered | Selected |
|----------|-------------------------|----------|
| 顶层初始化 | 工厂创建为主；保留 singleton；双入口并行维护 | 工厂创建为主 ✓ |
| 事件内建函数 | 最小闭环清单；一次补齐 legacy 清单；只注册扩展机制 | 最小闭环清单 ✓ |
| 装配职责 | 顶层编排、模块提供默认项；全部写在 CoreState；各系统自行初始化 | 顶层编排、模块提供默认项 ✓ |
| Node 隔离 | Node 默认无渲染依赖；沿用完整 legacy 环境；阶段 3 先不接 bridge | Node 默认无渲染依赖 ✓ |

**User's choice:** 工厂入口是主路径，顶层控制顺序，各模块提供默认注册项；事件只注册当前闭环需要且接口明确的最小清单。
**Notes:** legacy 数据转换允许作为可注入依赖，Node 无 DOM/渲染全局；渲染通知仍只能走 `r()`/`rf()` 或 hook。

---

## Node 验收与质量门禁

| Decision | Alternatives considered | Selected |
|----------|-------------------------|----------|
| 最终录像 | 固定端到端录像；复用现有游戏录像；系统级最小录像集 | 固定端到端录像 ✓ |
| 验收断言 | 状态快照精确一致；命令全部成功；最终结果一致 | 状态快照精确一致 ✓ |
| 质量范围 | 四层数据包全清零；仓库全清零；仅本阶段改动清零 | 四层数据包全清零 ✓ |
| Node 入口 | 专用 Node 验证命令；Vitest Node 测试；构建后运行产物 | 专用 Node 验证命令 ✓ |

**User's choice:** 使用固定端到端录像和精确状态快照，专用 Node 命令失败返回非零；四个数据层包的类型错误与循环引用全部清零。
**Notes:** 最终录像应覆盖顶层初始化、玩家动作、事件或状态变化和正常结束，并承担 Phase 1 验证目标。

### Follow-up decisions

| Decision | Selected |
|----------|----------|
| Node 存档 | 内存适配器；从固定初始状态 reset，并比较关键状态快照 ✓ |
| Legacy 注入 | 通过集中依赖对象注入 converter/data source，CoreState 不读取 legacy 全局 ✓ |
| 循环门禁 | 四个 data 包内部及其边界；允许无环的 `@motajs/common` 基础依赖 ✓ |
| Node 命令 | `pnpm test:data-node`，使用 `script/test-data-node.ts` 或等价 runner，fixture 位于 `packages-user/data-state/test/fixtures/` ✓ |

### Tile contract clarification

用户已调整工作区接口设计，规划以当前 `packages-user/data-common/src/store/types.ts` 为准：`ITileRawData.events` 保存默认事件映射，`ITileStore.getEvent(num)` 返回事件映射。旧的 `trigger` 标量实现不再是候选契约。

---

## the agent's Discretion

None. The user explicitly requires clarification before any uncertain interface, system-boundary, dependency, or implementation-path decision.

## Deferred Ideas

- Full core-system test coverage remains in Phase 6 after the Phase 3 replay closure.
- Full legacy migration remains in Phase 5.
- Full rendering integration remains in Phase 4.
- The complete legacy event built-in catalog remains deferred until its interfaces and scope are explicitly decided.
