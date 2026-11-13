# Phase 8: 测试重构与接口对齐 - Context

**Gathered:** 2026-10-04
**Status:** Ready for planning

<domain>
## Phase Boundary

将数据端（`packages-user/data-{common,base,system,state}`）的全部单元测试（`*.test.ts` / `*.perf.ts`）迁移到各源码目录下的 `__test__/`，并按数据端「系统性收尾」后的当前接口重对齐、修复重构遗漏导致的失效；以 `logger.json` 为准补齐**数据端错误码**与**公共接口**覆盖。验收 = `pnpm test:ci` 与 `pnpm test:perf` 全绿（既有不可达码的 `it.skip` 保留）。

**范围**

- 纳入：`packages-user/data-common`、`data-base`、`data-system`、`data-state` 的全部测试（65 `.test.ts` + 6 `.perf.ts`）。
- 排除：`script/check-data-circular.test.ts`（脚本，暂不纳入）；渲染端 `@user/client-*`；legacy。

**迁移目标**

- 同目录测试 → 同目录 `__test__/`（例：`src/hero/__test__/`）。
- 集成测试目录 `data-state/test/` → `data-state/__test__/`（`fixtures/` 随迁）。

**基线（2026-10-04 侦察，HEAD `109fad3`，分支 `refine/data-client`）**

- `pnpm test:ci`：66 文件 / 45 failed, 21 passed；用例 339 failed / 367 passed / 1 skipped；6 unhandled rejection；~186s。
- 唯一 skip：`data-base/src/hero/equipment.test.ts:353`（code 147，不可达，维持）。
- 失败族：A 夹具引用已删/改名导出；B `CoreState` 加载配置形状（`loadStarter`）；C 录像桩缺 `replay.array`；D Hook/控制器接口变化（`addHook(...).load`）；E 测试引用已移动/删除模块；F 公共接口改名/签名；G 断言随语义漂移。
- 配置：`vite.config.ts` 无 `test.include`（用默认 glob）、`vitest.perf.config.ts` include `**/*.perf.ts`、`tsconfig.json` include `packages-user/**/*.ts` → 迁移**无需改配置**。

</domain>

<decisions>
## Implementation Decisions

### 范围与口径

- **D-01:** 范围 = 四包 `packages-user/data-{common,base,system,state}` 全部单测；`script/` 暂不纳入。
- **D-02:** 迁移到同目录 `__test__/`；`data-state/test/` → `data-state/__test__/`（`fixtures/` 随迁）。
- **D-03:** 错误码覆盖以 `packages/common/src/logger.json` 为准。
- **D-04:** 「全绿」= 所有测试通过；既有表示**不可达错误码**的 `it.skip` 保留（当前仅 code 147 一条）。
- **D-05:** 接口设计不再变更；本阶段只做「对齐」（接口语义变化 + 接口设计变化），不新增接口。

### 计划组织

- **D-06:** **迁移方式 (a)**：先出独立「目录迁移」计划（全量移动 + 修相对导入，测试仍红但位置正确、可独立验证），后续按子系统对齐。
- **D-07:** **覆盖侧单列计划**：先盘点数据端错误码（从 `packages-user/data-*` 的 `logger.error/warn` 调用点反推）与公共接口清单及现有覆盖缺口，再补测。

### 并发与执行纪律（用户 2026-10-04）

- **D-08:** 用户并发进行渲染端收尾，可能触及数据端内容，但**不改接口设计、不影响测试**；AI **不得提交用户改动的文件**；若 AI 正在进行的行动与用户改动冲突，**先暂停并向用户汇报**。
- **D-09:** 每个计划执行前按项目规则设 **Task 0 汇报关卡**（`autonomous: false`），用户确认后方可执行。
- **D-10:** 测试面零生产改动；仅当某失效确由数据端重构遗漏导致、且用户确认后，才可做最小生产修复（否则退出并汇报）。

### the agent's Discretion

- 迁移计划的具体移动方式（脚本/逐文件）、对齐计划的子系统切分与顺序、覆盖补测的范围与用例设计，由实现者在上述约束下决定；发现新的接口/设计疑问立即提问，不自行假设。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目与阶段约束

- `.planning/PROJECT.md` — 数据/渲染分离、接口设计由用户主导
- `.planning/REQUIREMENTS.md` — `TEST-02`
- `.planning/ROADMAP.md` — Phase 8 goal、成功标准
- `.planning/STATE.md` — 既有决策、门禁、仓库状态
- `dev.md` — 四层数据架构、依赖方向、注释与代码规范（CRLF、无副作用、无循环引用）
- `AGENTS.md` — 审批与执行纪律

### 输入

- `.planning/phases/07-data-fixes/07-VERIFICATION.md` — `### Post-Refactor Test Breakage`（2026-09-17 旧快照，须重测后使用）
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` — `code → 模块 → 用例` 映射
- `packages/common/src/logger.json` — 错误码权威码表

### 受影响源码与测试

- `packages-user/data-common/src/{common,replay,store}/`
- `packages-user/data-base/src/{enemy,flag,hero,map}/`
- `packages-user/data-system/src/{combat,event,path}/`
- `packages-user/data-state/src/`（`coreEventLayer`、`enemy/`、`event/`、`replay/`）与 `packages-user/data-state/test/`

### 配置与工具

- `vite.config.ts`、`vitest.perf.config.ts`、`tsconfig.json`
- `.planning/codebase/TESTING.md`、`.planning/codebase/CONVENTIONS.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Phase 6 已建立的测试夹具与断言模式（inline fixture、`vi.hoisted` stub、dynamic import harness）
- `logger.catch(fn)` 断言警告码机制（`packages/common/src/logger.ts`）

### Established Patterns

- 依赖方向 `data-common → data-base → data-system → data-state`；数据端 DOM-free、Node 可跑
- 错误经 `logger.error/warn(code)` 上报，码唯一、不复用
- Phase 6/7 的文件级门禁：`eslint` + `vue-tsc` 过滤 + `pnpm test:ci`

### Integration Points

- `data-state/src/core.ts` `createCoreState` / loader 配置形状
- Hook 控制器（`addHook(...)` 返回对象）接口变化
- 录像桩 `replay.array`
- `setFloor(IGameMap)`、path finder/builder 注入面

</code_context>

<specifics>
## Specific Ideas

- 迁移与对齐分离（D-06），迁移计划须验证「采集文件数与迁移前一致」且 `test:ci`/`test:perf` 仍可发现文件。
- 覆盖盘点方法：从源码 `logger.error/warn` 调用点反推数据端码清单，与测试逐码对照。
- 用户明确「问题修复不会很复杂，顶多是某些内容重构时有细节没有注意到」。

</specifics>

<deferred>
## Deferred Ideas

- `script/check-data-circular.test.ts`。
- 渲染端 / legacy 测试（后续阶段）。
- `pnpm check:type` 全仓（既有渲染端诊断不在本阶段范围）。

</deferred>

---

*Phase: 8-测试重构与接口对齐*
*Context gathered: 2026-10-04*
