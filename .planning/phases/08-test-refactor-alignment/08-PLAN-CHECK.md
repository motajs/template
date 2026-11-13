# Phase 8 计划预执行核查报告（08-PLAN-CHECK）

**核查对象**: `08-01-PLAN.md` .. `08-11-PLAN.md`（11 份）
**阶段目标（ROADMAP.md:443）**: 将全部 `.test.ts` / `.perf.ts` 迁入 `__test__`，按数据端「系统性收尾」后 shipped 接口重对齐、修复重构遗漏，使 `pnpm test:ci` / `test:perf` 重新全绿
**需求**: `TEST-02`（唯一映射；`TEST-01` 不在本阶段范围）
**核查方式**: goal-backward 静态核查 + `git ls-files` 实测 + 配置只读核对
**核查时间**: 2026-10-04
**总体结论**: **PASS（无 BLOCKER）**，含 3 项 WARNING + 8 项 INFO；warning 建议在执行前/执行中处理，不阻塞。

---

## 0. 实测事实基线（已核）

| 事实 | 实测结果 | 与计划声明 |
|------|----------|------------|
| 数据端 `.test.ts`（四包 + `data-state/test`） | 65（`git ls-files`） | 与 PATTERNS/08-01 一致 |
| 数据端 `.perf.ts` | 6 | 一致 |
| `data-state/test/` tracked 文件 | 14（8 test + 3 perf + `replayVerifier.ts` + `fixtures/closed-loop.ts` + `fixtures/floors.json`） | 一致 |
| 现存 `__test__/` 目录 | 0 | 与 PATTERNS 一致（greenfield） |
| `script/test-data-node.ts` 硬编码旧路径 | 第 67、122 行命中 `data-state/test/...` | 08-01 定位正确 |
| `vite.config.ts` `test.include` | 无（默认 glob） | 零配置改动成立 |
| `vitest.perf.config.ts` | `include: ['**/*.perf.ts']` | 成立 |
| `tsconfig.json` include | `packages-user/**/*.ts` | 成立 |
| `.prettierrc` | `endOfLine: "crlf"`；`prettier` 为 devDependency | 08-11 CRLF 口径成立 |
| `eslint.config.js` ignores | 仅 `node_modules`/`dist`/`public`（测试文件纳入 lint） | 成立 |
| 11 份计划 `autonomous:` | 全部 `false`，且各恰 1 个 `blocking-human` Task 0 | 约束成立 |
| estimate 预算 | 全部 < 100000（08-10 最大 75000，ratio 0.7），无 over_budget | 成立 |

**跨源覆盖审计**：`ROADMAP.md:448-451` 四条成功标准 ↔ 计划映射完整（迁移→08-01；对齐→08-02..08-09；覆盖→08-10；全绿→08-11）。`REQUIREMENTS.md:38` `TEST-02` 由 `08-01..08-11` 全部 `requirements` 字段认领。`08-CONTEXT.md` D-01..D-10 全部有落点。Deferred（`script/check-data-circular.test.ts`、渲染端/legacy、全仓 `check:type`）未被任何计划引入。

---

## 1. 逐维度判定

| # | 维度 | 判定 | 说明 |
|---|------|------|------|
| 1 | Requirement Coverage | **PASS** | `TEST-02` 被全部计划认领；无 PROJECT.md 相关需求被静默丢弃 |
| 2 | Task Completeness | **PASS** | 11 计划均有 `checkpoint:decision gate="blocking-human"` Task 0；auto/tracer 任务含 files/action/verify/done |
| 3 | Dependency Correctness | **PASS** | 无环；`08-01 → (08-02..08-08) → 08-09 → 08-10 → 08-11`；无前向引用 |
| 3b | Undeclared/Temporal Coupling | **PASS** | 同波（wave 2）计划文件集互斥（按包/子系统切分），无共享可变资源；08-08→08-09 的 `loadStarter` 契约已由 `depends_on` 声明 |
| 4 | Key Links Planned | **PASS** | 迁移-脚本、Hook/朝向/录像桩/注入面等 wiring 均在 `key_links` 显式 |
| 5 | Scope Sanity | **PASS**（见 I1） | 见下方 I1；estimate 未超预算，D-06 锁定单一迁移计划 |
| 6 | Verification Derivation | **PASS** | must_haves.truths 可观测（文件数守恒、全绿、skipped=1） |
| 7 | Context Compliance | **PASS** | D-01..D-10 全覆盖；无 Deferred 项被纳入 |
| 7b | Scope Reduction Detection | **PASS** | 未发现「v1/静态/placeholder/未接线」等缩减语；覆盖计划覆盖全部 21 码 |
| 7c | Architectural Tier Compliance | **PASS** | 与 RESEARCH `## Architectural Responsibility Map` 一致：测试落位归各数据包目录，对齐归测试面，只读对照源码 |
| 8 | Nyquist Compliance | **WARNING**（W1/W3） | 见 W1、W3 |
| 9 | Cross-Plan Data Contracts | **PASS** | 共享夹具 `closed-loop.ts` 与其消费者同在 08-09；08-10 依赖全部前序计划后再触碰同批文件，串行无冲突 |
| 10 | AGENTS.md Compliance | **PASS** | Task 0 汇报关卡、命名先批准、不改既有 jsDoc、test-only 默认、每日重测纪律均落实 |
| 11 | Research Resolution | **INFO**（I3） | `## Open Questions（需用户决策）` 未带 `(RESOLVED)`，但 8 项 OQ 全部落为 Task 0 裁决项 |
| 12 | Pattern Compliance | **PASS** | 计划引用 PATTERNS `M1/M2/M3`、`P1..P8`、`S1..S5`，Analog 与 File Classification 对齐 |
| — | Verify Command Format Sanity | **PASS** | 无 `2>/dev/null || echo`、无 `\| grep -E '^pkg'`、无 `\|\| true` 喂比较 |
| — | Verify Command Path Resolvability | **WARNING**（W2） | 见 W2 |

---

## 2. 具体问题清单（file -> plan -> problem）

### Warnings（建议执行前修正）

**W1 — [nyquist] 08-11 的 CRLF/prettier 门禁未进入 `<automated>`**
- 文件: `.planning/phases/08-test-refactor-alignment/08-11-PLAN.md`（plan 08-11）
- 问题: `must_haves.truths` 与 `<verification>` 均要求 `pnpm exec prettier --check` 无格式差异（CRLF），但 Task 1 的 `<verify><automated>` 仅为 `pnpm test:ci; pnpm test:perf; pnpm exec eslint ...`，**不含 prettier**。CRLF（`dev.md:116`、`.prettierrc endOfLine:"crlf"`）这一硬性属性没有自动化检查兜底；批量改导入若写成 LF 不会被该门禁判失败。
- required_property: 阶段验收所声明的格式/CRLF 属性必须由一个可失败的自动化命令判定。
- 示例修正（非绑定）: 在 08-11 Task 1 的 `<automated>` 追加 `pnpm exec prettier --check <本次改动文件>`（或 `pnpm exec prettier --check "packages-user/**/__test__"`）。

**W2 — [verify_path_resolvability] 08-10 Task 2 验证命令含条件路径，可能误判失败**
- 文件: `.planning/phases/08-test-refactor-alignment/08-10-PLAN.md`（plan 08-10, Task 2）
- 问题: `<automated>` 无条件包含 `packages-user/data-state/src/loader/__test__`，但该目录**仅在 Task 0 Q3 批准新建 loader 测试时**才存在（`files_modified` 未声明该文件，artifacts 标注「条件」）。若 Q3=否，`pnpm exec vitest run` 会因「No test files found」非零退出，与 Q3 分支矛盾。
- required_property: 每个 `<verify>` 命令在 Task 0 任一决策分支下都能正确判定通过/失败。
- 示例修正（非绑定）: 将 loader 路径从主命令拆出，仅在 Q3 批准时作为第二条条件命令执行；或 Q3=否时把 66/67/68/69 明确落到已存在的 test 文件。

**W3 — [nyquist] 08-04 / 08-06 的聚焦命令不会采集 `*.perf.ts`，与所声称的「含 perf 0 失败」不符**
- 文件: `.planning/phases/08-test-refactor-alignment/08-04-PLAN.md`（Task 2）、`08-06-PLAN.md`（Task 1）
- 问题: 两处 `must_haves.truths` 声称「…+N perf … 聚焦运行 0 失败」，但 `<automated>` 用 `pnpm exec vitest run <dir>` 走默认 `vite.config.ts`（**无 `test.include`**，默认 glob 为 `**/*.{test,spec}.?(c|m)[jt]s?(x)`，**不匹配 `*.perf.ts`**）。因此 `attribute.perf.ts`、`context.perf.ts`、`damage.perf.ts` 的完成状态不由这两条命令判定。（缓解：`08-09` Task 2 与 `08-11` Task 1 会运行 `pnpm test:perf`（6 文件），全局仍有兜底。）
- required_property: 每个任务对制定文件的完成判定必须由其 `<verify>` 命令真实覆盖。
- 示例修正（非绑定）: 聚焦命令改用 `pnpm exec vitest run --config vitest.perf.config.ts <perf 路径>`，或在 truth 中明示 perf 由 `pnpm test:perf` 在 08-09/08-11 统一判定。

### Advisories（INFO）

**I1 — [scope_sanity] 08-01 单计划触达 75 个文件（远超 15 建议上限）**
- `.planning/phases/08-test-refactor-alignment/08-01-PLAN.md`：`files_modified` 74 目标 + `script/test-data-node.ts`，`files_deleted` 74。
- 判定为 INFO 而非 BLOCKER/WARNING 的依据：(a) `08-CONTEXT.md` **D-06 锁定「独立目录迁移计划」单数**，拆分将抵触锁定决策；(b) 本 plan estimate 70000 tokens、ratio 0.7 < budget 100000、`over_budget=false`；(c) 迁移为机械 `git mv` + specifier 改写，且有「文件数守恒（66/6）」硬门禁。故不建议拆分，仅提示执行时注意上下文。

**I2 — [requirement_coverage] `script/check-data-circular.test.ts` 在 66-全绿门禁内但被声明为范围外**
- `08-11-PLAN.md` 要求 `test:ci` 66 文件全绿（含该脚本测试），而 `08-CONTEXT.md`/Deferred 将其排除、无计划处理它。
- 实测参考：`07-VERIFICATION.md` 的 17-失败文件快照未含该文件，且其被测对象为独立脚本分类函数，不受数据端接口变动影响——判定其当前为绿。若执行日实测该文件为红，则阶段目标不可达，需回退汇报。

**I3 — [research_resolution] RESEARCH 的 `## Open Questions` 未标 `(RESOLVED)`**
- `.planning/phases/08-test-refactor-alignment/08-RESEARCH.md:526` 标题为 `## Open Questions（需用户决策）`。按维度 11 字面应 FAIL，但 8 项 OQ **全部**已成为 Task 0 裁决项：OQ1→08-08 Q1/08-09 Q2；OQ2→08-02 Q1；OQ3→08-09 Q1；OQ4→08-08 Q2；OQ5→08-02 Q2；OQ6→08-05 Q1；OQ7→08-04 Q1；OQ8→08-10 Q3。属设计使然（D-09 全程 Task-0 门控），故记 INFO。

**I4 — [task_completeness] 08-01 Task 1 与 Task 2 对 group 5（flag）处理重叠**
- `08-01-PLAN.md` Task 1 用 tracer 先迁 `flag/{saveLoad,system}.test.ts`；Task 2 又声明「组 1-14」迁移（含 group 5）。执行者可能对已迁文件重复 `git mv`。建议 Task 2 显式「跳过已由 Task 1 完成的 flag 组」。

**I5 — [task_completeness] 部分对齐计划未复述「每个 it 前中文单行注释」不变量**
- `08-04`、`08-06`、`08-07`、`08-08`、`08-09` 的 truths/action 未逐字重述；依赖 `08-PATTERNS.md` `S1` 与 `dev.md:86`（均在各计划 context 中）。建议对齐计划统一在约束中保留该句。

**I6 — [verification_derivation] 08-01 的「文件数守恒」不校验导入重写正确性（设计使然）**
- import specifier 写错时文件仍被 glob 采集（计数仍 66），仅表现为该文件 failed；08-01 显式接受「仍红」。导入正确性实际由 08-02..08-09 的「聚焦 0 失败」兜底。此为 D-06 既定分层，记 INFO。

**I7 — [task_completeness] 08-10 条件新建的 loader 测试文件未列入 `files_modified`**
- `08-10-PLAN.md` artifacts 含 `packages-user/data-state/src/loader/__test__/loader.test.ts`（条件），但 frontmatter `files_modified` 未含。若批准新建，执行期 wave 文件重叠检查无法覆盖该新文件。

**I8 — [verification_derivation] 基线「当日重测」在执行序列中发生于迁移之后**
- `ROADMAP.md:456` 要求先重测当日失败清单。计划未设独立的 pre-alignment 基线 run；但 `08-01` Task 2/3 的 `pnpm test:ci` 会输出当前完整失败清单（迁移不改测试成败），事实上完成重测。记 INFO。

---

## 3. 结论与最小修订需求

- **无 BLOCKER**：需求覆盖、任务完整性、依赖图、上下文合规、`autonomous:false`+Task 0、路径 tracked、配置零改动、21 码覆盖、66/6 全绿与 skipped=1 验收均成立。计划集合**能够**达成 Phase 8 目标。
- **建议（不阻塞）的最小修订**：
  1. W1：在 `08-11` Task 1 的 `<automated>` 补 `pnpm exec prettier --check`。
  2. W2：`08-10` Task 2 将条件 loader 路径改为分支命令。
  3. W3：`08-04`/`08-06` 的 perf 覆盖改由 `vitest.perf.config.ts` 聚焦运行，或在 truth 明示由 `pnpm test:perf` 全局判定。
- 其余 INFO 为可选的清晰度改进。

**Verdict: PASS（0 BLOCKER / 3 WARNING / 8 INFO）—— 可由 planner 按需吸收 warning，或直接进入执行（执行前须经各计划 Task 0 用户「可以执行」关卡）。**
