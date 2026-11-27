---
phase: 09-minimum-browser-runnable
plan: 11
subsystem: docs
tags: [legacy, core, deprecated, audit, read-only, ast, tsx, client-base, client-modules]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "任务 5 · legacy 接口只读统计的范围界定（D-42..D-45）与既有两包源码现状"
provides:
  - ".planning/phases/09-minimum-browser-runnable/09-LEGACY-INTERFACES-AUDIT.md —— 只读统计台账（§0 口径 + A 残余 legacy 接口 + B @deprecated + C core.* 调用点 + 汇总）"
  - "A-COUNT=32 / B-COUNT=0 / C-COUNT=228（去重成员 M=67，覆盖 29 文件）"
affects: [09, legacy-migration, render-ui]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 12795
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "代码级 core.<member> 统计用 TypeScript 编译器 API（createSourceFile + AST PropertyAccessExpression 首成员），天然排除注释 / 字符串 / 模板字面量"
    - "只读审计：唯一写入为统计文档 + SUMMARY，源码零改动（scope 守卫）"

key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-LEGACY-INTERFACES-AUDIT.md
    - .planning/phases/09-minimum-browser-runnable/09-11-SUMMARY.md
  modified: []

key-decisions:
  - "Task 0（blocking-human）已闭环：用户回复「可以执行」并批准产出路径 09-LEGACY-INTERFACES-AUDIT.md（采纳默认处置 OI-1..OI-5）"
  - "OI-2：分类口径 A-1..A-7 按默认采用（跨包依赖 / 全局 core / 单例 client / patch 机制 / UI 运行时符号 / Mota 全局 / 回退层）"
  - "OI-3：两包内未检索到 data-fallback 同名符号；据默认归 A-7（fallback/** 及 Mota.require('@user/data-base')）"
  - "OI-4：B 类实测 0 条，显式报告「0 条」并写明扫描范围与匹配方式"
  - "OI-5：C 类给出「去重成员清单 + 按文件 file:line 调用点 + 每文件计数」三者，并另给去重成员数 M=67"
  - "C-COUNT=228 = 代码级 core.<member> 访问点总条数（AST 精确识别）；B-COUNT=0；A-COUNT=32 = A-1..A-7 各表行数之和"
  - "任务 2 的门禁 READONLY 断言对全 packages-user 过宽，改为对两在范围内包（client-base / client-modules）的等价 scope 守卫"

patterns-established:
  - "只读审计口径：范围显式化（两包）、分类口径显式化（A-1..A-7）、每条 file:line 锚点须指向真实文件且在范围内（反臆造门禁）"

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "只读统计文档 09-LEGACY-INTERFACES-AUDIT.md（§0 口径 + A 残余 legacy 接口 + B @deprecated + C core.* 调用点 + 汇总 + A/B/C 机器可读计数）"
    verification: []
    human_judgment: true
    rationale: "纯文档产物，无自动化测试；其正确性（口径合理性、条目不臆造、锚点有效）需人工复核"

# Metrics
duration: ~30min
completed: 2026-10-11
status: complete
---

# Phase 9 Plan 11: legacy 接口只读统计 Summary

**产出只读统计台账 `09-LEGACY-INTERFACES-AUDIT.md`：在 `packages-user/client-base` 与 `packages-user/client-modules` 两包内枚举 A 残余 legacy 接口 32 条（A-1..A-7）、B `@deprecated` 0 条（显式报告）、C 代码级 `core.*` 调用点 228 条（去重成员 67 个、覆盖 29 文件），全程只读、源码零改动**

## Performance

- **Duration:** ~30 min（含 Task 0 汇报关卡）
- **Completed:** 2026-10-11
- **Tasks:** 3（Task 0 汇报关卡 + Task 1 + Task 2）
- **Files modified:** 2（均为新增 `.md`；源码零改动）

> **actuals 计量口径：** `tokens: 12795` = (审计文档 43298 + SUMMARY 7881) / 4 = 51179 / 4，即本次实际改动文件的 `chars/4`；计划估算 `52000`（低置信度），实际偏低。源码未改动，故 realized diff 仅含两份 `.md`。

## Task 0（预执行汇报关卡 · `blocking-human`）

- **状态：已闭环（satisfied）。** 用户明确回复「可以执行」并批准产出路径 `.planning/phases/09-minimum-browser-runnable/09-LEGACY-INTERFACES-AUDIT.md`；采纳默认处置 OI-1..OI-5。
- 关卡未执行任何写操作；未修改任何文件。
- **预执行状态门禁（计划 Task 0 `<verify><automated>`）运行通过：** `OK pre-execution state intact (audit doc absent; both packages present; legacy import + client singleton present)`。

## Accomplishments

- **§0 统计口径与范围：** 显式界定范围（恰好两包、`.ts`/`.tsx`、排除 `node_modules`/`dist`）、`legacy` 判定基准、A-1..A-7 子类定义、扫描方法论（AST）、只读声明与计数粒度。
- **§A 残余 legacy 接口（A-COUNT: 32）：**
  - A-1 跨包 legacy 依赖 10 条（`hotkey.ts:3`、`fallback/{audio,ui,weather}.ts`、`ui/{settings,title,toolbar}.tsx` ↔ `@motajs/legacy-ui|common|system`）。
  - A-2 legacy 全局 `core` 声明引用（`src/types/declaration/core.d.ts`，交叉引用 §C）。
  - A-3 legacy 单例 `client` 3 条（定义 `core.ts:6`；使用 `fallback/audio.ts:5,11`；并显式排除 `loader/hook.ts:7` 的**局部** `client`）。
  - A-4 legacy patch 机制 3 条（`new Patch(PatchClass.*)`，含 `.add(...)`）。
  - A-5 legacy UI 运行时符号 7 条（`mainUi`/`mainSetting`/`getVitualKeyOnce`/`triggerFullscreen` 使用点）。
  - A-6 legacy `Mota` 全局 3 条（`elements/{cache.ts:491,misc.ts:89,219}` 的 `Mota.require('@user/data-base')`）。
  - A-7 legacy 兼容 / 回退层 5 个文件（`fallback/**`）。
- **§B `@deprecated`（B-COUNT: 0）：** 两包内实测 0 条，显式报告并写明扫描范围与匹配方式（`@deprecated` 字面量）。
- **§C 经 `core.*` 调用的接口（C-COUNT: 228）：** 去重成员清单 67 个（C-1）、按文件 228 条 `file:line` 调用点（C-2，29 个文件）、每文件计数（C-3）。**仅计代码**——两包 `shared.ts` 注释中的 `core.js` 未计入。
- **§汇总：** A/B/C 三类汇总表 + 三行机器可读计数 `A-COUNT:` / `B-COUNT:` / `C-COUNT:`。

## Task Commits

Each task was committed atomically:

1. **Task 1: 文档骨架 + §0 口径 + §A + §B** - `1c5afe4` (docs)
2. **Task 2: §C + 汇总 + SUMMARY** - 见本次提交 (docs)

**Plan metadata / SUMMARY：** 见 Task 2 提交（**未修改 STATE.md / ROADMAP.md** —— 由 orchestrator 负责）。

## Files Created/Modified

- `.planning/phases/09-minimum-browser-runnable/09-LEGACY-INTERFACES-AUDIT.md`（新增）— 只读统计台账（§0 + A + B + C + 汇总 + 机器可读计数）。
- `.planning/phases/09-minimum-browser-runnable/09-11-SUMMARY.md`（新增）— 本执行摘要。

## Decisions Made

- 按用户批准的默认处置落地 OI-1..OI-5（见 frontmatter `key-decisions`）。
- **C 类排除注释 / 字符串：** 使用 TypeScript 6.0.3 AST（`PropertyAccessExpression` 首成员）精确识别，避免把 `shared.ts` 注释中的 `core.js` 误计（用户明确要求）。
- **A-3 边界：** `loader/hook.ts:7` 的 `client` 为 `loader.getConfig('client')` 局部变量，**非** legacy 单例，已在文档中显式标注排除。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 1 / Task 2 的 `READONLY` 守卫对全 `packages-user` 过宽，命中了用户范围内（out-of-scope）的并发改动**
- **Found during:** Task 1 与 Task 2（只读守卫）
- **Issue:** 计划的门禁 `filter(l=>/packages-user\/.*\.(ts|tsx)\s*$/.test(l))` 会匹配**任意** `packages-user` 下的 `.ts`/`.tsx` 改动。本机存在**用户在 `packages-user/data-state/**` 的并发改动**（D-56：` M calculator.ts`、` D legacy.ts`、` M special.ts`），该包按 D-42 **不在统计范围内**，也不是本计划改动的文件。该守卫因此恒为 RED，与「本计划是否触碰源码」无关。
- **Fix:** 未改动这些用户文件（永不暂存 / 提交）。运行**等价的范围内守卫**——`git status --porcelain -- packages-user/client-base packages-user/client-modules` → **无输出**，证明两个**在统计范围内**的包零改动；源码只读保证成立。
- **Files modified:** 无（仅执行守卫，未改任何源码 / 计划文件）。
- **Verification:** 范围内守卫 `OK scoped read-only: client-base + client-modules untouched`；`git status --porcelain` 仅含本计划两份 `.md`（审计文档 / SUMMARY）与用户既有 `data-state` 改动。
- **Committed in:** 无（守卫本身不产生提交）。

---

**Total deviations:** 1 auto-fixed (1 blocking，属**计划门禁过宽 + 用户并发改动**的环境性偏差，非源码问题)。
**Impact on plan:** 无范围外溢。两包内零源码改动；唯一写入为本计划两份 `.md`。是否认定该门禁断言需回改 `09-11-PLAN.md`，请用户裁定（按 AGENTS.md，未擅自记录为「问题」）。

## Issues Encountered

- 无源码层问题。Task 0 预执行门禁与 Task 1/2 的 AUDIT-AB / AUDIT-C 门禁均首次运行即通过。唯一偏差为上述只读守卫过宽（见上）。

## Known Stubs

None — 本计划为纯只读文档产物，未引入任何 stub / 占位 / TODO。

## Threat Flags

None — 未引入任何源码改动；产出仅为 `.planning` 下两份 `.md`，未触及网络端点 / 鉴权路径 / 文件访问或数据模式。

## User Setup Required

None — 无外部服务配置。

## Next Phase Readiness

- 台账已就绪，可作为后续「legacy 移植 / 去 legacy」改造的**只读依据**（每条 `file:line` 锚点均已按执行日实测校验有效）。
- 待用户裁定：本计划只读守卫「全 packages-user → 两在范围内包」的口径是否需要回改至 `09-11-PLAN.md`（本次未改计划文件）。
- **未修改 STATE.md 与 ROADMAP.md**（按派发指令，由 orchestrator 负责）。

---

*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-11*

## Self-Check: PASSED

- FOUND: `.planning/phases/09-minimum-browser-runnable/09-LEGACY-INTERFACES-AUDIT.md`
- FOUND: `.planning/phases/09-minimum-browser-runnable/09-11-SUMMARY.md`
- FOUND: `1c5afe4` (Task 1 commit)
- 未修改 STATE.md / ROADMAP.md（由 orchestrator 负责）
