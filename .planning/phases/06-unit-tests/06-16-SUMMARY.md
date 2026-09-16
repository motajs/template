---
phase: 06-unit-tests
plan: 16
subsystem: testing
tags: [vitest, performance, perf-lane, console-table, record-only, data-system, data-base, data-state, damage, enemy-context, hero-attribute, save-load]

# Dependency graph
requires:
  - phase: 06-unit-tests (06-01..06-15)
    provides: 数据端四条热点路径（光环全量构建 / 临界枚举 / 属性修饰器重算 / CoreState 整体存读档）的行为单测与文件内联合成 fixture 模式（vi.hoisted stub + beforeAll 动态 import）
provides:
  - vitest.perf.config.ts —— 与 `pnpm test:ci` 完全隔离的 perf 通道（`include` 仅 `['**/*.perf.ts']`、`testTimeout`/`hookTimeout` 30000、镜像 `vite.config.ts` 的 `@motajs/*`/`@user/*` alias）
  - package.json 的 `test:perf` 脚本（`vitest run --config vitest.perf.config.ts`；`test`/`test:ci` 逐字未变）
  - 4 个 `*.perf.ts` 与 18 个耗时 case（① 3 + ② 3 + ③ 3 + ④ 9）
  - 本 SUMMARY 的 18 行耗时数值表（measure-all 口径：预热 3 不计时 + 采样 20 取中位数）
affects: [06-verify-work（Phase 6 收口）, 后续性能回归对比批次, 未来对四条热点路径的任何优化]

# Actuals (#2632) — same scale as the plan `estimate` (chars/4 over the realized diff).
actuals:
  tokens: 7366
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "独立 perf 通道：新 config 的 `test.include` 与 vitest 默认 include 不重叠，因此 `*.perf.ts` 永不进入 `test:ci`；`test`/`test:ci` 脚本一字不改即可实现收集隔离"
    - "record-only 性能测量：`measureCase(caseName, scale, run)` 先预热 3 次不计时、再采样 20 次，输出 `console.table` 的 `case`/`scale`/`median ms`/`min ms`/`p95 ms`；全文件零 `expect`，耗时永不导致用例失败"
    - "文件内联测量助手与 fixture（D-02/D-03）：4 个 perf 文件各自内联最小助手与合成夹具，不建跨文件共享文件"
    - "perf 夹具必须无告警噪声：① 用 `couldApplySpecial: false` + 优先级互不相同的全局光环 + 1:1 命中的转换器（按代码缓存同一光环实例）避免 97/98/99/100；④ 先建 `maps.compareWith`/`enemyManager.compareWith` 基线避免 `error 55`"
    - "perf config 必须逐字镜像 `vite.config.ts` 的 `glob.sync` alias 计算：`node_modules` 下没有 `@user/*`/`@motajs/*`，`tsconfig.json` 的 `paths` 只服务 `vue-tsc`，不服务 vitest 运行时"

key-files:
  created:
    - vitest.perf.config.ts
    - packages-user/data-system/src/combat/damage.perf.ts
    - packages-user/data-system/src/combat/context.perf.ts
    - packages-user/data-base/src/hero/attribute.perf.ts
    - packages-user/data-state/test/saveables.perf.ts
  modified:
    - package.json

key-decisions:
  - "收集隔离靠 `test.include` 交集为空，而非新增 `test.exclude`：vitest 4.0.18 默认 include 为 `**/*.{test,spec}.?(c|m)[jt]s?(x)`，`*.perf.ts` 天然不匹配，故既有 CI 通道的语义、收集文件数（66）与结果（680 passed / 1 skipped）零变化，`test` 与 CI 两个脚本一字未改"
  - "零断言为硬约定（用户裁决）：perf 文件不得出现 `expect(`，耗时只进 `console.table` 与 SUMMARY；结果不落盘基线 JSON、不新增任何耗时门禁"
  - "① 的转换器按代码缓存同一光环实例（`Map<number, PerfAura>`），把光环拓扑固定在 10 + 5 = 15 个，避免随 N 增长出现 O(N²) 使 `testTimeout` 失效（T-06-16-04）"
  - "① 的每个样本先 `bindHero(hero)`：`buildup()` 在 `needUpdate === false` 时直接返回（见 `context.ts` 的 `buildup` 早退分支），`bindHero` 是公开且最省的 `needUpdate = true` 触发器，确保每个样本都真正执行全量构建（T-06-16-03）"
  - "③ 用公开 `markModifierDirty(modifier)` 触发重算：`recalculateAttribute` 在 `attribute.ts` 中为 private，`markModifierDirty` 走同一条重算路径；读取用公开 `getFinalAttribute`"
  - "② 必须完整消费 `calculateCritical` 生成器（`for (const _ of ...)`），否则测不到临界二分枚举的真实开销"
  - "④ 单样本 = `saveState` + `loadState` 整体往返（5 个 saveable，D-45）；夹具按 `addTile` → `itemStore.addItem` → `equipment.add` / `addItem` 的严格顺序注册，合成 1000 件装备 + 1000 条消耗品使 `@system/hero` 负载随件数线性增长"
  - "不修改 `vite.config.ts`、`tsconfig*.json`、任何生产/核心源码与既有 `*.test.ts`；不安装任何依赖"

patterns-established:
  - "perf 文件与行为测试同构：`vi.hoisted` stub（`main`/`location`/`Map.getOrInsert*`）+ 与对应 `*.test.ts` 相同的 import harness（`context`/`damage` 用 `beforeAll` 动态 import，`attribute` 用静态 import），只在测量协议上分叉"
  - "一个规模/压缩档一个 `it`（④ 由双层循环生成 9 个 `it`）：超时归因清晰，个别慢 case 不会拖垮同文件其它 case 的判定"
  - "测量助手参数固定：`WARMUP_RUNS = 3`、`SAMPLE_RUNS = 20`、下中位数 `samples[10]`、`p95 = samples[Math.ceil(20 * 0.95) - 1] = samples[18]`、`min = samples[0]`，三者统一 `Number(v.toFixed(3))` 消除浮点噪声"

requirements-completed: [TEST-01]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "独立 perf 通道：`vitest.perf.config.ts`（`include` 仅 `*.perf.ts`、30s 超时、镜像 alias）+ `package.json` 的 `test:perf` 脚本；`test`/`test:ci` 未改"
    requirement: "TEST-01"
    verification:
      - kind: integration
        ref: "pnpm test:perf (collected 4 files / 18 tests passed)"
        status: pass
      - kind: integration
        ref: "pnpm exec vitest list --filesOnly (default config: 66 files, 0 matches for *.perf.ts)"
        status: pass
      - kind: integration
        ref: "pnpm test:ci (66 files / 680 passed / 1 skipped — unchanged from baseline)"
        status: pass
    human_judgment: false
  - id: D2
    description: "② 临界计算 perf：`damage.perf.ts`，3 个 case（1000/10000/50000 次完整临界枚举），固定 atk 0 与固定伤害区间 100→0"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "pnpm test:perf — packages-user/data-system/src/combat/damage.perf.ts (3 tests passed, 3 console.table rows)"
        status: pass
    human_judgment: false
  - id: D3
    description: "① 怪物上下文构建 perf：`context.perf.ts`，3 个 case（N = 50/200/1000 的单次 `buildup()`），固定 10 个全局光环 + 5 个特殊属性代码"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "pnpm test:perf — packages-user/data-system/src/combat/context.perf.ts (3 tests passed, 3 console.table rows, 0 warn/error code)"
        status: pass
    human_judgment: false
  - id: D4
    description: "③ 勇士属性计算 perf：`attribute.perf.ts`，3 个 case（M = 10/100/1000 修饰器分布 10 属性，每样本 1000 轮重算 + 读 10 个最终属性）"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "pnpm test:perf — packages-user/data-base/src/hero/attribute.perf.ts (3 tests passed, 3 console.table rows)"
        status: pass
    human_judgment: false
  - id: D5
    description: "④ 存读档 perf：`saveables.perf.ts`，9 个 case（件数 10/100/1000 × NoCompression/LowCompression/HighCompression 的 CoreState 5-saveable 整体往返）"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "pnpm test:perf — packages-user/data-state/test/saveables.perf.ts (9 tests passed, 9 console.table rows, 0 warn/error code)"
        status: pass
    human_judgment: false
  - id: D6
    description: "本 SUMMARY 的 18 行耗时数值表 + 测量参数说明 + 「不落盘基线 JSON、不做耗时断言」说明；findings 注明无新增条目"
    requirement: "TEST-01"
    verification:
      - kind: other
        ref: ".planning/phases/06-unit-tests/06-16-SUMMARY.md#18 行耗时数值表"
        status: pass
    human_judgment: true
    rationale: "数值本身只记录不断言（用户裁决），是否逼近 `testTimeout`（D-07 暂停判据）、量级是否符合预期、是否值得后续回归对比，均需人工判读；且 D-33 要求本计划执行后暂停并当面向用户汇报耗时结果"

# Metrics
duration: 27min
completed: 2026-09-16
status: complete
---

# Phase 6 Plan 16: 性能测试补充（perf 通道 + 四条热点路径）Summary

**新增一条与 `pnpm test:ci` 完全隔离的 perf 测量通道（`vitest.perf.config.ts` + `test:perf`），为数据端四条热点路径落地 18 个 case 的真实耗时表：① 光环全量构建 1000 怪中位 3.705ms、② 临界完整枚举 50000 次中位 184.492ms、③ 修饰器重算 1000 修饰器中位 99.093ms、④ 万件存读档中位 0.941ms；零断言、零生产代码改动、零新依赖、`test:ci` 的 66 文件 / 680 passed / 1 skipped 逐字不变**

## Performance

- **Duration:** ~27 min
- **Started:** 2026-09-16T06:45:00Z
- **Completed:** 2026-09-16T07:12:00Z
- **Tasks:** 3/3
- **Files modified:** 6（5 新建 + 1 改 1 行）

## 测量参数（4 个 perf 文件完全一致）

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| 预热 | `WARMUP_RUNS = 3` | 不计时，`measureCase` 内先跑完再进入采样 |
| 采样 | `SAMPLE_RUNS = 20` | 每样本用 `globalThis.performance.now()` 取首尾差 |
| 中位 | `samples[10]` | 升序排序后取**下中位数**（20 个样本的第 11 个） |
| 最小 | `samples[0]` | 升序排序后首元素 |
| p95 | `samples[Math.ceil(20 * 0.95) - 1] = samples[18]` | 升序排序后第 19 个 |
| 取整 | `Number(v.toFixed(3))` | 三个数值统一 3 位小数，消除浮点噪声 |
| 断言 | **无** | 全文件 0 个 `expect(`；耗时永不导致用例失败（用户裁决） |
| 计时源 | `globalThis.performance.now()` | 不使用 fake timers、不使用其它计时源 |
| 超时 | `testTimeout`/`hookTimeout` = 30000ms | 与 `vite.config.ts` 一致 |

**运行环境：** Node `v22.18.0`（win32 / x64），CPU `12th Gen Intel(R) Core(TM) i5-12500H`，vitest `4.0.18`，单次 `pnpm test:perf` 顺序采样、无并发干扰（4 个文件由 vitest 默认并行调度，耗时表为各文件自身 `console.table` 输出）。

## 18 行耗时数值表

> 来自真实 `pnpm test:perf` 运行（Test Files **4 passed** / Tests **18 passed**，Duration 8.29s）。**每一行都是独立 `it`**；表中数字为该 case 20 次采样的统计量。

| case | scale | median ms | min ms | p95 ms |
| --- | --- | --- | --- | --- |
| 临界计算 | 1000 | 4.755 | 3.458 | 7.519 |
| 临界计算 | 10000 | 46.871 | 36.3 | 76.329 |
| 临界计算 | 50000 | 184.492 | 172.761 | 252.614 |
| 怪物上下文构建 | 50 | 0.397 | 0.247 | 0.745 |
| 怪物上下文构建 | 200 | 0.868 | 0.504 | 1.904 |
| 怪物上下文构建 | 1000 | 3.705 | 2.485 | 5.447 |
| 勇士属性计算 | 10 | 0.895 | 0.855 | 1.103 |
| 勇士属性计算 | 100 | 8.222 | 7.543 | 14.043 |
| 勇士属性计算 | 1000 | 99.093 | 78.134 | 135.936 |
| 存读档 | 10/NoCompression | 0.036 | 0.026 | 0.113 |
| 存读档 | 10/LowCompression | 0.032 | 0.027 | 0.039 |
| 存读档 | 10/HighCompression | 0.031 | 0.027 | 0.045 |
| 存读档 | 100/NoCompression | 0.164 | 0.134 | 0.223 |
| 存读档 | 100/LowCompression | 0.16 | 0.127 | 0.199 |
| 存读档 | 100/HighCompression | 0.178 | 0.126 | 0.227 |
| 存读档 | 1000/NoCompression | 0.591 | 0.502 | 1.614 |
| 存读档 | 1000/LowCompression | 0.884 | 0.521 | 2.176 |
| 存读档 | 1000/HighCompression | 0.941 | 0.831 | 1.901 |

**单位均为毫秒。**

### 规模趋势（median）

| 路径 | 三档 median | 观察 |
| --- | --- | --- |
| ② 临界计算（1000 → 10000 → 50000 次） | 4.755 → 46.871 → 184.492 | 随枚举次数近似线性（10x 次数量级对应 ~9.8x → ~3.9x 耗时）；50000 次仍在 200ms 内 |
| ① 怪物上下文构建（50 → 200 → 1000 怪） | 0.397 → 0.868 → 3.705 | 近似线性（4x → 5x 怪数对应 ~2.2x → ~4.3x 耗时）；拓扑固定为 15 个光环，未见 O(N²) |
| ③ 勇士属性计算（10 → 100 → 1000 修饰器） | 0.895 → 8.222 → 99.093 | 严格线性：每轮只重算被 `markModifierDirty` 命中的那一个属性（M/10 个修饰器），符合预期 |
| ④ 存读档（10 → 100 → 1000 件 × 三档压缩） | 见上表 | 件数线性增长；Low/High 压缩在本夹具尺寸下仅比 NoCompression 慢 ~1.1x–1.6x（压缩对象为 2×2 地图块，非件数负载） |

### D-07 超时判据

**没有任何 case 逼近 `testTimeout`（30000ms）。** 最慢 case 为 ② `50000`，median `184.492ms`、p95 `252.614ms`，仅占超时预算的 ~0.8%；单次 `pnpm test:perf` 整轮 8.29s（含 4 文件并行）。因此**未触发** D-07 的「暂停汇报」分支，规模与超时均按用户裁决原样保留，未做任何调整。

## Accomplishments

- **阶段 1（构件级）**：新建 `vitest.perf.config.ts`——`test.include` 仅为 `['**/*.perf.ts']`、`testTimeout`/`hookTimeout` 30000、逐字镜像 `vite.config.ts` L13–27 的两段 `glob.sync` alias 计算（硬前提：`node_modules` 下无 `@user/*`/`@motajs/*`）；`package.json` 在 `test:ci` 之后新增一行 `test:perf`，`test`/`test:ci` 逐字未变；落地 `damage.perf.ts`（3 个 case）。
- **阶段 2（组合级）**：落地 `context.perf.ts`（3 个 case：N = 50/200/1000 的单次全量 `buildup()`，固定 10 个全局光环 + 5 个特殊属性代码，转换器按代码缓存同一光环实例把拓扑固定在 15 个）与 `attribute.perf.ts`（3 个 case：M = 10/100/1000 修饰器分布 10 属性，每样本 1000 轮 `markModifierDirty` + 读 10 个 `getFinalAttribute`）。
- **阶段 3（完整级）**：落地 `saveables.perf.ts`（9 个 case：件数 10/100/1000 × No/Low/High 压缩的 `CoreState` 5-saveable 整体往返），夹具先建 `maps.compareWith` / `enemyManager.compareWith` 合成基线，再按 `addTile` → `itemStore.addItem` → `equipment.add` / `addItem` 顺序注册 1000 件装备 + 1000 条消耗品。
- **运行零告警噪声**：`pnpm test:perf` 输出中 `WARNING` 与 `ERROR` 出现次数均为 **0**，即 ① 未触发 97/98/99/100/110，④ 未触发 `error 55`，说明 fixture 严格有效（未通过放宽告警来换绿）。
- **收集隔离已验证**：默认配置下 `pnpm exec vitest list --filesOnly` 输出 **0** 条 `*.perf.ts`（共 66 个测试文件），`pnpm test:ci` 全绿且收集文件数与基线一致。

## Task Commits

Each task was committed atomically:

1. **阶段 1（构件级）：perf 通道 + ② 临界计算** - `37bf89b` (test)
2. **阶段 2（组合级）：① 怪物上下文构建 + ③ 勇士属性计算** - `3c59f31` (test)
3. **阶段 3（完整级）：④ 存读档（18 行表收齐）** - `374274a` (test)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified

- `vitest.perf.config.ts`（新建，1004 字符）— 独立 perf 通道：`include: ['**/*.perf.ts']`、`testTimeout`/`hookTimeout` 30000、镜像 `vite.config.ts` 的 `@motajs/*`/`@user/*` alias；不加载 vue 插件、不改 `test.exclude`、不设 `environment`（默认 `node`）
- `package.json`（改 1 行）— 在 `"test:ci"` 之后新增 `"test:perf": "vitest run --config vitest.perf.config.ts"`；`test`/`test:ci` 与其它字段逐字未变
- `packages-user/data-system/src/combat/damage.perf.ts`（新建，8411 字符）— ② 临界计算 3 个 case（1000/10000/50000 次完整枚举）
- `packages-user/data-system/src/combat/context.perf.ts`（新建，8022 字符）— ① 怪物上下文构建 3 个 case（50/200/1000 怪，单次 `buildup()`）
- `packages-user/data-base/src/hero/attribute.perf.ts`（新建，6503 字符）— ③ 勇士属性计算 3 个 case（10/100/1000 修饰器，每样本 1000 轮重算）
- `packages-user/data-state/test/saveables.perf.ts`（新建，5985 字符）— ④ 存读档 9 个 case（10/100/1000 件 × 三档压缩）

## Decisions Made

- **收集隔离靠 include 交集为空**：vitest 4.0.18 的默认 include 是 `**/*.{test,spec}.?(c|m)[jt]s?(x)`，`*.perf.ts` 天然不匹配；因此只需新 config 限定 `include`，**不需要**改 `test`/`test:ci`，也不需要新增 `test.exclude`。
- **零断言 + 不落盘基线 JSON**：perf 文件全文件 0 个 `expect(`；耗时只进 `console.table` 与 SUMMARY，不写入任何门禁脚本、不新增基线文件（用户裁决）。
- **① 的拓扑必须与 N 解耦**：转换器按 `special.code` 缓存同一个 `PerfAura` 实例，单次 `buildup()` 的光环拓扑恒为 `10 + 5 = 15`，使耗时可预期地随 N 线性增长；配合 `couldApplySpecial: false` 与优先级互不相同，避开 97/98/99/100 全部告警路径。
- **① 每样本先 `bindHero`**：`buildup()` 在 `needUpdate === false` 时直接返回，`bindHero`（`context.ts:193`）是公开且最省的 `needUpdate = true` 触发器；夹具不 attach `damageSystem`/`mapDamage`，故无额外副作用。
- **③ 走公开入口**：`recalculateAttribute` 是 private，故用公开 `markModifierDirty(modifier)` 触发同一重算路径，读取用公开 `getFinalAttribute`；每个修饰器独立新实例以避免 108。
- **④ 严格注册顺序**：`HeroEquipsStore.add` 依赖 `tileStore.num` + `itemStore.getData`，未注册返回 `-1`，故必须先 `addTile` 再 `itemStore.addItem` 最后 `equipment.add`；并先建 `maps.compareWith` / `enemyManager.compareWith` 基线（`mapState.ts:409` 在 Low/High 且 `!compared` 时走 `error 55`）。
- **不做任何生产代码改动、不新增依赖**：vitest 4.0.18 已在 devDependencies；不安装覆盖率/基准工具。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `context.perf.ts` 的 `SPECIAL_CODES` 类型收窄导致 vue-tsc 报 TS2345**
- **Found during:** Task 2（阶段 2）的 D-44 门禁
- **Issue:** 常量写作 `const SPECIAL_CODES = [20, 21, 22, 23, 24] as const;`，元素类型被收窄为 `20 | 21 | 22 | 23 | 24`，使 `SPECIAL_CODES.includes(special.code)` 报
  `error TS2345: Argument of type 'number' is not assignable to parameter of type '22 | 23 | 24 | 21 | 20'`（`context.perf.ts(198,39)`）。
- **Fix:** 显式标注为 `const SPECIAL_CODES: readonly number[] = [20, 21, 22, 23, 24];`，保留「5 个固定代码」语义同时恢复 `number` 入参兼容。
- **Files modified:** `packages-user/data-system/src/combat/context.perf.ts`
- **Verification:** `pnpm exec vue-tsc --noEmit` 按路径过滤 `*.perf.ts` 命中 0 条；`pnpm test:perf` 仍 3 passed、0 warn/error code。
- **Committed in:** `3c59f31`（Task 2 提交）

**2. [Rule 1 - Bug] 未使用导入触发 `@typescript-eslint/no-unused-vars`**
- **Found during:** Task 1/2 的 D-44 `eslint` 门禁
- **Issue:** `damage.perf.ts` 的 `type IEnemy`、`context.perf.ts` 的 `type IReadonlyEnemy` 在最终实现中未被引用，eslint 报 0-error 门禁不通过。
- **Fix:** 从 import 列表中移除这两个未使用的类型导入（不新增 `// eslint-disable`，不放宽规则）。
- **Files modified:** `packages-user/data-system/src/combat/damage.perf.ts`、`packages-user/data-system/src/combat/context.perf.ts`
- **Verification:** `eslint <改动文件>` 0 错误（仅剩 `console.table` 的 `no-console` warn）。
- **Committed in:** `37bf89b` / `3c59f31`

---

**Total deviations:** 2 auto-fixed（均为 Rule 1，只影响新建的 perf 文件本身，不涉及生产代码或计划范围）
**Impact on plan:** 两处均为「让新建文件通过 D-44 文件级门禁」的必需修正，无范围蔓延、无接口变更、无行为弱化。

## Issues Encountered

- **无阻断性实现缺陷**：本计划为纯新增测量，不修改任何生产/核心源码，因此未暴露新缺陷，`06-TEST-FINDINGS.md` **无新增条目**（仍是既有 `#06-01-*`..`#06-15-*`）。
- **目标文件中文以 UTF-8 正确落盘**：中间曾用 PowerShell 5.1 的 `Get-Content -Raw`/`Set-Content` 做行尾归一，其默认 ANSI 读取把中文注释读坏；已改为用写入工具重写文件、并统一由 `eslint --fix`（prettier `endOfLine: crlf`）完成 CRLF 归一。最终 4 个 `*.perf.ts` + `vitest.perf.config.ts` 均已按码点核验：注释与 `measureCase` 名称（`临界计算` / `怪物上下文构建` / `勇士属性计算` / `存读档`）全部正确，CRLF 达标。
- **`pnpm test:perf` 的控制台中文在部分终端下显示为乱码**：这是 PowerShell 控制台对子进程 stdout 的解码问题，不影响文件内容（已按码点核验），也不影响 `console.table` 的数值列。

## D-44 Quality Gate Results

| 阶段 | `eslint --fix` | `eslint <改动文件>` | `vue-tsc`（按文件路径过滤） | `pnpm test:perf` | `pnpm test:ci` |
| --- | --- | --- | --- | --- | --- |
| 1（`37bf89b`） | exit 0 | 0 错误（1 warn：`no-console`） | 0 类型错误（全局既有无关错误 28 条） | 1 文件 / 3 passed / 3 行表 | 66 文件 / 680 passed / 1 skipped |
| 2（`3c59f31`） | exit 0 | 0 错误（2 warn：`no-console`） | 0 类型错误（28 条不变） | 3 文件 / 9 passed / 9 行表 / 0 warn+error code | 66 文件 / 680 passed / 1 skipped |
| 3（`374274a`） | exit 0 | 0 错误（1 warn：`no-console`） | 0 类型错误（28 条不变） | 4 文件 / **18 passed** / **18 行表** / 0 warn+error code | 66 文件 / **680 passed** / **1 skipped** |

- `vue-tsc --noEmit` 过滤 `*.perf.ts` / `vitest.perf.config.ts` 命中 **0** 条；28 条既有无关错误全部位于 `client-modules` / `legacy-plugin-data` / `legacy-ui`（D-44 明确排除范围，本计划未触及）。
- `package.json` 为 JSON，eslint 无匹配配置（仅 "File ignored" 提示，非错误）；其格式由 `.prettierrc` 的 4 空格缩进手工保证，`git diff` 显示**仅新增 1 行**（`test`/`test:ci` 逐字未变）。
- `vitest.perf.config.ts` 不在任何 tsconfig project（`tsconfig.node.json` 只含 `./vite.config.ts`），其门禁 = `eslint` 0 错误 + 配置能被 vitest 实际加载（`pnpm test:perf` 成功收集 4 个文件即为证明）；本计划未改任何 `tsconfig*.json`。
- `git status` 最终仅含本计划的 6 个文件（SUMMARY 提交前）+ 规划产物；无生产/核心源码改动、无新依赖、无基线 JSON 落盘、无 06-01..06-15 产物改动。
- **`test:ci` 基线对照**：改动前 66 文件 / 680 passed / 1 skipped（23.27s），改动后三次复核均为 66 文件 / 680 passed / 1 skipped（24.10s / 21.99s），且默认 `vitest list` 中 `*.perf.ts` 匹配数为 0。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **性能数据已固定**：四条热点路径的三档规模耗时表已写入本 SUMMARY，可直接作为后续优化的对比基线（但**未落盘为基线 JSON**，对比需人工取用本表数字）。
- **通道可复用**：`pnpm test:perf` 为独立通道，后续新增 `*.perf.ts` 会被自动收集；`pnpm test:ci` 行为不变，CI 语义与耗时不受影响。
- **无阻断项**：无 case 逼近 `testTimeout`，无告警/错误码噪声，`06-TEST-FINDINGS.md` 无新增条目。
- **待用户裁决**：Phase 6 收口时是否把 perf 通道纳入常规回归（当前为用户可选的本地通道，不进门禁）。

---

*Phase: 06-unit-tests*
*Completed: 2026-09-16*

## Self-Check: PASSED

- FOUND: `.planning/phases/06-unit-tests/06-16-SUMMARY.md`
- FOUND: `vitest.perf.config.ts`
- FOUND: `packages-user/data-system/src/combat/damage.perf.ts`
- FOUND: `packages-user/data-system/src/combat/context.perf.ts`
- FOUND: `packages-user/data-base/src/hero/attribute.perf.ts`
- FOUND: `packages-user/data-state/test/saveables.perf.ts`
- FOUND: commit `37bf89b`（阶段 1）
- FOUND: commit `3c59f31`（阶段 2）
- FOUND: commit `374274a`（阶段 3）
