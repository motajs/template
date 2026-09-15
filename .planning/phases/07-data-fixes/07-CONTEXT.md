# Phase 7: 数据端缺陷修复 - Context

**Gathered:** 2026-09-15
**Status:** Ready for planning

<domain>
## Phase Boundary

修复 Phase 6 单元测试暴露、登记在 `06-TEST-FINDINGS.md` 的**数据端疑似缺陷（20 条）**，使对应的「正确预期 `it.skip`」用例取消 skip 并通过。改动**仅限数据端**（`packages` 与 `packages-user/data-*`），**不含渲染端**（`@user/client-*`）与 legacy 渲染接线。

本阶段不新增功能、不扩展接口（除已裁决的契约修正）；不以「提升覆盖率」为目标，而是让 Phase 6 已写好的正确预期断言真实通过。

**修复清单（20 条，按系统）**

| 系统 | 条目 | 严重度 | 处置 |
|------|------|--------|------|
| combat `data-system/src/combat` | #06-01-1 `damage.ts` 临界点 info 与 nextValue 不匹配 | 中 | 修复 |
| combat | #06-01-2 `mapDamage.ts` `deleteEnemy` 残留来源伤害 | 中 | 修复 |
| combat | #06-01-3 `combat.ts` `before` 短路语义反 | 中 | 改实现对齐文档（D-03） |
| combat | #06-01-4 `context.ts` 重复 `buildup` 属性累加 | 中 | 修复 |
| combat | #06-15-1 `deleteAura` 后 `buildup` 不回退（与 #06-01-4 同根因） | 中 | 随 #06-01-4 转绿 |
| enemy `data-base/src/enemy` | #06-03-1 `createEnemy`/`createEnemyById` 未走复用映射 | 中 | 改实现接入复用（D-08） |
| replay `data-common/src/replay` | #06-04-1 `array.ts` int64 解码乘数 | 中 | 修复 |
| replay | #06-04-2 `array.ts` 多字节 bigint 编码 | 中 | 修复 |
| replay | #06-04-3 `array.ts` `delete` 索引回退 | 中 | 修复 |
| replay | #06-04-4 `array.ts` `insert` 位移方向 | 中 | 修复 |
| hero `data-base/src/hero` | #06-05-1 `attribute.ts` 无修饰器 final 陈旧 | 中 | 修复 |
| hero | #06-05-2 `equipment.ts` 空槽判断写反 | 中 | 修复 |
| hero | #06-05-3 `equipment.ts` 码 147 不可达 | 低 | 设计如此（D-06） |
| map `data-base/src/map` | #06-06-1 `mapLayer.ts` 越图 `transferToDynamic` 发 131 | 低 | 改发 128（D-04） |
| path `data-system/src/path` | #06-07-1 `CoreState` 未向 finder 注入 maps/layer/predicate | 中 | 用户自行修改（D-07） |
| flag/common `data-common/src/common` | #06-08-1 `mover.ts` `backward(count>1)` 方向摆动 | 低 | 修复 |
| save | #06-09-1 `EquipmentState.loadState` 数值/百分比加成丢失 | 高 | 修复 |
| save | #06-09-2 `HeroEquipment.saveState` 未深拷贝 | 中 | 修复 |
| save | #06-09-3 `DynamicTile.loadState` 不恢复 num | 中 | 修复 |
| save | #06-09-5 `CoreState` 码 178 语义反向 | 低 | 改实现对齐文案（D-05） |

> `#06-09-4`（ReplayArray 存档）已因 c08f3f8 重构作废，不在本阶段。

</domain>

<decisions>
## Implementation Decisions

### 修复范围与计划粒度
- **D-01:** **全部 20 条纳入**本阶段；`#06-09-4` 作废不进，`#06-15-1` 与 `#06-01-4` 同根因合并处理。
- **D-02:** **按系统切多个 PLAN**（combat / enemy / replay / hero / map / flag+common / save / path），系统内**先高后低**排序；便于逐系统汇报、门禁与回滚。

### 契约冲突裁决（4 条，接口事实源 = 文档/码表文案）
- **D-03:** `#06-01-3` **改实现对齐文档**：`ICombatScript.before` 仅当返回 `false` 才停止后续战前脚本并放弃战斗（`combat/types.ts:772` 的 jsdoc 为准）。
- **D-04:** `#06-06-1` **改实现**：越图 `transferToDynamic` 分支改发码 **128**，与 `transferToStatic` 的越界语义一致。
- **D-05:** `#06-09-5` **改实现对齐文案**：码 **178** = 存档中出现但未加载（未注册）的 key，即 `loaded.difference(total)`；并**同步更新既有非 skip 用例** `saveablesRoundTrip.test.ts` 中「缺 key 触发 178」的断言（`:321-334`）。
- **D-06:** `#06-05-3` **保留码 147，生产代码不动、不标记死码**：错误码关注的是语义错误，而非是否可能被触发。对应 `it.skip` 用例（`warns code 147 when no equipment slot is available`）**保留 skip 并加注释**说明「147 为保留错误码，当前不可达，设计如此」，不纳入取消 skip 清单。

### 接口/接线缺口
- **D-07:** `#06-07-1` **由用户自行修改**（`CoreState` → `pathfinding.finder` 注入 `useMapState`/`useMapLayer`/`usePassPredicate`）；**AI 不实现该接线**，计划中标注为用户负责项。用户修复后其 `it.skip` 用例（`plays a teleport step without manual finder wiring`）转绿。
- **D-08:** `#06-03-1` **改实现**：`createEnemy`/`createEnemyById` 接入复用映射（改用 `internalGetPrefab`，或先查 `reuseByCode`/`reuseById` 再取模板），与 `getPrefab` 行为一致。

### 修复方式与执行节奏（强约束）
- **D-09:** **每个计划开始执行前暂停并向用户汇报该计划的修复方案，经用户确认后才执行**；若计划方案修复失败，**不得自行探索其他方案**，必须**退出本次修改、修订修复计划后重新执行**。
- **D-10:** **测试处置**：修复后**仅取消对应 `it.skip` 转绿**，不额外新增用例（Phase 6 已建立正确预期）。
- **D-11:** **文档/注释同步**：契约修正后同步更新受影响的 jsdoc / 码表注释 / 契约文档，使文档与实现一致（尤其 D-03、D-05）。

### 验证与提交
- **D-12:** **门禁沿用 Phase 6 D-44（文件级）**：(a) 改动文件 `eslint --fix` 后 `eslint <文件>` 0 错误；(b) 本计划改动文件 `pnpm exec vue-tsc --noEmit` 输出路径下 0 类型错误；(c) `pnpm test:ci` 全绿。不追求全仓 `check:type`（既有渲染/legacy 错误不在范围）。
- **D-13:** **提交粒度：按缺陷/根因原子提交**（例如 `#06-01-4` + `#06-15-1` 合为一个 fix commit），便于逐条回滚与 windows 结清。
- **D-14:** **WINDOWS.md 收口**：修复转绿且取消 skip 后 `gsd-tools windows fixed <id>`；设计如此（`#06-05-3`）与用户自改（`#06-07-1`）的保留 `open` 并 **waive 注明原因**。

### the agent's Discretion
- 每条缺陷的具体修法（**最小修复 vs 必要的内部重构**）、文件切分、用例命名与 `#region` 划分由实现者在上述约束下决定；但**必须按 D-09 在执行前汇报并获用户确认**。若发现新的接口/设计疑问，立即提问，不自行假设。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目与阶段约束
- `.planning/PROJECT.md` — 数据/渲染分离、协作分工（接口设计由用户主导，AI 仅实现与测试）
- `.planning/REQUIREMENTS.md` — `FIX-01` 与 `TEST-01` 边界
- `.planning/ROADMAP.md` — Phase 7 goal、成功标准、依赖 Phase 6
- `.planning/STATE.md` — 既有决策、质量门禁、当前仓库状态
- `.planning/WINDOWS.md` — Broken Windows 账本（open `skipped-test` 条目 id 19–27 的收口依据）
- `dev.md` — 四层数据架构、Node 独立性、依赖方向、注释与代码规范（CRLF、无副作用、无循环引用）

### 缺陷与覆盖锚点（本阶段的输入）
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` — **20 条疑似缺陷的权威登记**（现象、复现、疑似原因、影响面、建议方向、关联 skip 用例、严重度）
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` — `code → 模块 → 用例` 映射（受影响可达码）
- `.planning/phases/06-unit-tests/06-CONTEXT.md` — D-05（skip=正确预期）、D-07/D-33（修复需用户确认）、D-43（阶段化）、D-44（文件级门禁）、D-30/D-31（legacy 排除与 code 覆盖）

### 受影响源码（按系统）
- `packages-user/data-system/src/combat/` — `damage.ts` / `mapDamage.ts` / `combat.ts` / `context.ts` / `types.ts`
- `packages-user/data-base/src/enemy/` — `manager.ts`（复用映射）
- `packages-user/data-common/src/replay/` — `array.ts`（编解码 + 编辑索引）
- `packages-user/data-base/src/hero/` — `attribute.ts` / `equipment.ts` / `equipStore.ts`
- `packages-user/data-base/src/map/` — `mapLayer.ts` / `dynamicTile.ts`
- `packages-user/data-common/src/common/` — `mover.ts`
- `packages-user/data-system/src/path/` — `system.ts`（D-07 用户负责）
- `packages-user/data-state/src/core.ts` — 码 177/178（D-05）

### 码表与测试约定
- `packages/common/src/logger.json` — warn code 权威码表（127/128/131、147、176/177/178 等文案）
- `.planning/codebase/TESTING.md` — Vitest、`logger.catch` 断言模式、无覆盖率工具、`pnpm test:ci`
- `.planning/codebase/CONVENTIONS.md` — 命名、注释、类型、模块原则

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 6 已建立的「正确预期 `it.skip`」用例：修复后取消 skip 即为回归覆盖，无需重复设计断言
- `logger.catch(fn)`（`packages/common/src/logger.ts`）—— 断言警告码的既有机制（`{ ret, info }`）
- Phase 6 的 inline fixture / `vi.hoisted` stub + dynamic-import harness —— 各系统测试已就绪

### Established Patterns
- 依赖方向 `data-common → data-base → data-system → data-state`；数据端 DOM-free、Node 可跑
- 错误经 `logger.warn/error(code)` 上报，不抛异常；码唯一、不复用
- `pnpm test:ci` 为非 watch 门禁；测试文件与源码同级 `*.test.ts`（`data-state/test/` 为聚合目录）

### Integration Points
- `data-state/src/core.ts` `loadState` —— 码 177/178 判定
- `data-system/src/combat/context.ts` `buildup` / `refreshEnemy` —— 视图 `reset()` 与重复构建
- `data-common/src/replay/array.ts` —— 参数编解码与索引数组 `indexArray`/`paramArray`
- `data-base/src/hero/{equipStore,equipment}.ts` —— 存档深拷贝与压缩档回退到原始定义
- `data-base/src/map/mapLayer.ts` —— 越界转换诊断码与事件层绑定

</code_context>

<specifics>
## Specific Ideas

- 用户明确定义本阶段为 Phase 6「测试 / 修复严格分两环节」中的**修复环节**；Phase 6 只分析、只汇报、不擅自改核心代码。
- **执行节奏强约束（D-09）**：逐计划暂停汇报方案 → 用户确认 → 执行；方案失败即退出并修订计划，**禁止**自行另辟他法。
- 契约裁决以**文档/码表文案为事实源**（D-03/D-04/D-05）；唯一例外 `#06-05-3` 判为设计如此（D-06）。
- `#06-07-1` 的接线由用户亲自完成（D-07），AI 只在其后验证并取消 skip。

</specifics>

<deferred>
## Deferred Ideas

- Phase 6 非数据端覆盖（渲染 / legacy 相关）仍延后到后续阶段，不在本阶段。
- Phase 5（Legacy 移植）若改动数据端接口，本阶段修复与测试需同步调整。

</deferred>

---

*Phase: 7-数据端缺陷修复*
*Context gathered: 2026-09-15*
