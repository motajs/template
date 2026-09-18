---
phase: 06-unit-tests
plan: 18
subsystem: testing
tags: [vitest, performance, perf-lane, performance-mark, performance-measure, record-only, real-map-fixture, merged-map, monster-prefab, aura, map-damage, critical, data-state, data-system, data-base]

# Dependency graph
requires:
  - phase: 06-unit-tests (06-16)
    provides: 独立 perf 通道（`vitest.perf.config.ts` + `pnpm test:perf`）与 `measureCase` 口径（预热 3 不计时 + 采样 20 取中位数/min/p95）
  - phase: 06-unit-tests (06-17)
    provides: 真实 13×13 地图夹具 `packages-user/data-state/test/fixtures/floors.json`（13 个条目、编号 `1..6`、怪物格 204）与真实地图 perf 文件的夹具形态
provides:
  - packages-user/data-state/test/mapScenario.perf.ts —— 真实大地图战斗场景（合并大图 1/5/13 × 3 测量项：怪物上下文构建 / 地图伤害构建 / 全图怪物单次临界计算），12 个真实模板 + mulberry32 固定种子 + 内联 mark/measure 助手 + 临界汇总第二表
  - 6 个 `*.perf.ts` 的计时统一升级为 `performance.mark` + `performance.measure`（输出列 / 预热 / 采样 / 统计口径 / 零断言完全不变）
  - 本 SUMMARY 的 54 行主表（45 既有 + 9 新增）与 3 行临界汇总表
affects: [06-verify-work（Phase 6 收口）, 后续战斗层性能回归对比（大地图场景）, 光环/地图伤害/临界三条路径的优化选型]

# Actuals (#2632) — same scale as the plan `estimate` (chars/4 over the realized diff).
actuals:
  tokens: 7435
  tasks: 3
  commits: 3
  plan_head_before: 0da0117cd44a9dcb0d5d714fab4b2c440d51ba72

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "计时源升级：`globalThis.performance.now()` 首尾差 → `performance.mark(startTag)` → `run()` → `performance.mark(endTag)` → `performance.measure(measureName, startTag, endTag).duration` → 逐样本 `clearMarks`/`clearMeasures`；三个名字按 `'perf:' + caseName + ':' + scale + ...` 拼出，故跨 case、跨规模唯一"
    - "标记清理是正确性前提而非卫生习惯：`measure` 对不存在的标记会抛错（实测错误码 `12`），而清理写在循环外会让同名标记被解析成**首次**标记位置、`duration` 变成累计值"
    - "单一合并大图夹具：13 张真实 13×13 地图按 `ceil(sqrt(n))` 列网格拼接，每张放在 `(col*13, row*13)`、空位补 `0`，从而在不新增数据文件的前提下把真实地图规模从 13×13 放大到 52×52"
    - "确定性怪物分配：`mulberry32(PERF_SEED + mapCount)` 按行主序对每个编号 `4` 的格子取样映射到 12 个真实模板，同一规模两次运行分布逐项一致（实测）"
    - "真实顶层链路装配：`createCoreState()` 自带 `registerSpecials` 与真实计算器/转换器/合并器/最终效果，夹具只覆盖 `resize(合并尺寸)`，不手工 `new` 战斗对象"
    - "perf 夹具的非空转自查：一次性临时探针打印合并尺寸/怪物数/模板分布，确认后删除，仓库不保留探针"

key-files:
  created:
    - packages-user/data-state/test/mapScenario.perf.ts
  modified:
    - packages-user/data-system/src/combat/context.perf.ts
    - packages-user/data-system/src/combat/damage.perf.ts
    - packages-user/data-base/src/hero/attribute.perf.ts
    - packages-user/data-state/test/saveables.perf.ts
    - packages-user/data-state/test/saveablesReal.perf.ts

key-decisions:
  - "测量方式按用户裁决落地为标准标记：6 个 perf 文件全部改为 `performance.mark` + `performance.measure` + 逐样本清理；输出列 `case`/`scale`/`median ms`/`min ms`/`p95 ms`、预热 3 + 采样 20、下中位数/`min`/`p95`、`toFixed(3)`、零断言一字未变"
  - "计时口径变更会作废既有表述：06-16/06-17 SUMMARY 里的 45 行数字是 `performance.now()` 改造**之前**的口径，**不可与本次 9 行直接对比**；按 06-16/06-17 的禁令不修改那两个 SUMMARY，也不重录那 45 行，只在本 SUMMARY 记录本次全 lane 的实测结果"
  - "合并规则取 `ceil(sqrt(n))` 列：`1/5/13` → `13×13` / `39×26` / `52×52`，怪物 **11 / 79 / 204**（5 这一档有 1 个空格位、13 这一档有 3 个，补 `0` 后仍是矩形，满足 `map.length % width === 0`）"
  - "12 个真实模板（`100..111`）：4 个带真实光环 = `CommonAura` 的 Full/Manhattan/Rect 三种范围各 1 + `GuardAura` 1；其余覆盖 `15/16/18/24/27` 五种地图伤害视图与 `1/2/3/4/6/7/8/9/11/17/22` 伤害分支；刻意排除 `20 无敌`（伤害恒为 `Infinity`）、`10 模仿`（覆盖攻防抹平多样性）、`12/13/14/19/21/23`（不在本次三条路径上生效）"
  - "场景装配只用真实实现：`createCoreState()` + `resize(合并尺寸)` + `registerTiles` + `addPrefab`×12 + 真实勇士属性（零修饰器）+ `fromRaw` 注入 + 逐格 `setEnemyAt` + 首轮不计时 `buildup()`；**不手工 new** `EnemyContext`/`DamageSystem`/`MapDamage`"
  - "① 的样本如实包含 `bindHero` 的副作用：`bindHero` 会顺带执行 `damageSystem.bindHeroStatus`（清伤害缓存）与 `mapDamage.refreshAll()`（全量地图伤害重建），故 ① **不是**裸 `buildup()`；采用它是为了与 06-16 ① 同构（`bindHero` 是公开且最省的 `needUpdate` 触发器）"
  - "`MainEnemyComparer` 在本场景中**未被触达**（它只在 `EnemyManager.compareWith` 的 `updateDirty`/`refreshDirty` 里被调用，本计划不做存读档、不建参考基线）；按「未覆盖 + 原因」如实记录，不为此补 `compareWith`"
  - "模板特殊属性为**内联 `createSpecial` 构造**（镜像既有集成测试 `enemyCombination.test.ts`），`registerSpecials(enemyManager)` 的**注册**确实由 `CoreState` 构造函数完成，但本计划**未**走 `fromLegacyEnemy` 的 legacy 转换路径"
  - "零断言为硬约定：6 个文件 0 个 `expect(`、无 `it.skip`/`it.todo`、无 fake timers/hrtime；唯一 `throw` 是夹具完整性自检（模板缺失），耗时只进 `console.table` 与 SUMMARY，不落盘基线 JSON、不新增耗时门禁"
  - "`13`（52×52 / 204 怪）未逼近 `testTimeout`：最慢新 case 为 `全图怪物单次临界计算 13/204`（median `4.026ms` / p95 `7.022ms`），`mapScenario.perf.ts` 9 个 case 合计 `792ms`，故未触发 D-07 的暂停汇报分支，规模与超时原样保留"

patterns-established:
  - "计时标记的命名与清理契约：`'perf:' + caseName + ':' + scale + ':start' | ':end' | ''`，每样本后立即 `clearMarks(startTag)` / `clearMarks(endTag)` / `clearMeasures(measureName)`"
  - "把「真实数据的规模」与「真实实现的装配」分开：夹具负责把 13 张真实地图拼成一张大图并注入真实 `CoreState`，测量项只负责调用真实链路"

requirements-completed: [TEST-01]

# Metrics
duration: 20min
completed: 2026-09-16
status: complete
---

# Phase 6 Plan 18: 真实大地图场景性能补充与 mark/measure 计时迁移 Summary

**把整条 perf lane 的计时统一升级为 `performance.mark` + `performance.measure`（6 个文件、输出列与统计口径零变化），并新增真实大地图战斗场景 `mapScenario.perf.ts`：13 张真实 13×13 地图网格拼接成 `13×13` / `39×26` / `52×52`（怪物 11 / 79 / 204）、12 个真实模板（4 个光环）、mulberry32 固定种子分配，测出三个真实路径的耗时（最慢 `4.183ms`），`pnpm test:perf` 由 5 文件 / 45 行变为 **6 文件 / 54 行 + 3 行临界汇总表**，运行期零 `WARNING`/`ERROR` 码，`pnpm test:ci` 保持 66 文件 / 690 passed / 1 skipped**

## Performance

- **Duration:** ~20 min（2026-09-16 20:22:13 → 20:41:48 +08:00）
- **Tasks:** 3/3
- **Files modified:** 1 created + 5 modified
- **Plan head before:** `0da0117`（ledger `0da0117cd44a9dcb0d5d714fab4b2c440d51ba72`）；**commits in range:** `3`（实测 `git rev-list --count 0da0117..HEAD`，即本计划的 3 个任务提交，metadata 提交另计）

## 测量参数（6 个 perf 文件逐字一致）

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| 预热 | `WARMUP_RUNS = 3` | 不计时，`measureCase` 内先跑完再进入采样 |
| 采样 | `SAMPLE_RUNS = 20` | 每样本一对标记 + 一次测量 |
| **计时源** | **`globalThis.performance.mark` / `measure`** | 起始标记 → `run()` → 结束标记 → `measure(name, start, end).duration` |
| 标记命名 | `'perf:' + caseName + ':' + scale + ':start'` / `...:end'` / `'perf:' + caseName + ':' + scale` | 由 case 与规模拼出，**跨 case、跨规模唯一**，不同 `it` 之间不会互相覆盖 |
| 标记清理 | 每样本后 `clearMarks(startTag)` / `clearMarks(endTag)` / `clearMeasures(measureName)` | **必须写在循环体内**：写在循环外会让同名标记被解析成首次标记位置，`duration` 变成累计值 |
| 顺序约束 | **先 `mark` 再 `measure`** | 对不存在的标记做 `measure` 会抛错（本机 Node `v22.18.0` 实测错误码 `12`） |
| 中位 | `samples[10]` | 升序排序后取**下中位数**（20 个样本的第 11 个） |
| 最小 | `samples[0]` | 升序排序后首元素 |
| p95 | `samples[Math.ceil(20 * 0.95) - 1] = samples[18]` | 升序排序后第 19 个 |
| 取整 | `Number(v.toFixed(3))` | 三个数值统一 3 位小数 |
| 断言 | **无** | 6 个文件合计 0 个 `expect(`；耗时永不导致用例失败（用户裁决） |
| 超时 | `testTimeout`/`hookTimeout` = 30000ms | 与 `vite.config.ts` 一致 |

**运行环境：** Node `v22.18.0`（win32 / x64），CPU `12th Gen Intel(R) Core(TM) i5-12500H`（16 逻辑核），`pnpm 10.15.0`，vitest `4.0.18`（`devDependencies` 记 `^4.0.18`，以实际运行为准）。

## 测量方式变更声明（硬声明，不得含糊）

- 本计划把**全部 6 个** perf 文件的计时改为 `performance.mark` + `performance.measure` + 逐样本清理；**输出列、预热 3 + 采样 20、下中位数 / `min` / `p95`、`toFixed(3)`、零断言、`afterAll` 的 `console.table` 全部未变**。
- **06-16 / 06-17 SUMMARY 里的 45 行数字是本次改造之前（`globalThis.performance.now()`）的口径，不能与本次的 9 行直接对比。** 本计划**未修改**那两个 SUMMARY，也**未重录**那 45 行；它们对改造后的 lane 不再是当前口径。
- 为免「改造后无可比数字」，下表同时给出**本次全 lane 运行**的 54 行实测值（45 既有 case 在 mark/measure 下的读数 + 9 行新增），供后续回归取用。
- 量级自检（防「累计耗时」型改造缺陷）：改造前后 `怪物上下文构建 50` 的 median 为 `0.385ms` → `0.401ms`（首轮对比运行），数量级一致、未出现随样本数单调放大的累计值，说明清理顺序正确。

## 9 行新增耗时数值表（`mapScenario.perf.ts`）

> 来自真实 `pnpm test:perf` 运行：`Test Files 6 passed (6)` / `Tests 54 passed (54)`，返回码 0；`packages-user/data-state/test/mapScenario.perf.ts (9 tests) 792ms`；整轮 `Duration 9.13s`。`scale` = `地图张数/怪物数`。

| case | scale | median ms | min ms | p95 ms |
| --- | --- | --- | --- | --- |
| 怪物上下文构建 | 1/11 | 0.198 | 0.184 | 0.252 |
| 地图伤害构建 | 1/11 | 0.089 | 0.047 | 0.125 |
| 全图怪物单次临界计算 | 1/11 | 0.819 | 0.204 | 1.09 |
| 怪物上下文构建 | 5/79 | 1.27 | 0.887 | 2.689 |
| 地图伤害构建 | 5/79 | 0.235 | 0.203 | 0.343 |
| 全图怪物单次临界计算 | 5/79 | 1.562 | 1.497 | 1.937 |
| 怪物上下文构建 | 13/204 | 4.183 | 3.239 | 5.179 |
| 地图伤害构建 | 13/204 | 1.154 | 1.035 | 1.7 |
| 全图怪物单次临界计算 | 13/204 | 4.026 | 3.401 | 7.022 |

## 3 行临界汇总第二表

> 与主表来自**同一次** `measureCase` 返回值（不改测量助手）。列 `case`/`scale`/`monsters`/`total ms`/`avg ms`。

| case | scale | monsters | total ms | avg ms |
| --- | --- | --- | --- | --- |
| 全图怪物单次临界计算 | 1/11 | 11 | 0.819 | 0.074 |
| 全图怪物单次临界计算 | 5/79 | 79 | 1.562 | 0.02 |
| 全图怪物单次临界计算 | 13/204 | 204 | 4.026 | 0.02 |

**汇总口径（无歧义）：** `total ms` = 该规模「全图扫一遍」的**采样中位数**（即主表的 `median ms`）；`avg ms` = `Number((total ms / monsters).toFixed(3))`。因同规模内怪物数是常量，「中位总量 / 怪物数」恰好等于「每采样单怪平均耗时」的中位数。逐行核对：`0.819 / 11 = 0.0745 → 0.074`；`1.562 / 79 = 0.0198 → 0.02`；`4.026 / 204 = 0.0197 → 0.02`。

## 本次全 lane 运行实测（45 行既有 case，mark/measure 口径）

> 与上表同一次运行（`Test Files 6 passed (6)` / `Tests 54 passed (54)`）。**这 45 行是改造后的重新读数，不等于 06-16/06-17 SUMMARY 里的历史数字**（后者为 `performance.now()` 口径）。

| case | scale | median ms | min ms | p95 ms |
| --- | --- | --- | --- | --- |
| 怪物上下文构建 | 50 | 0.385 | 0.246 | 0.667 |
| 怪物上下文构建 | 200 | 0.617 | 0.495 | 1.108 |
| 怪物上下文构建 | 1000 | 2.871 | 2.426 | 4.574 |
| 存读档 | 10/NoCompression | 0.04 | 0.028 | 0.196 |
| 存读档 | 10/LowCompression | 0.032 | 0.029 | 0.039 |
| 存读档 | 10/HighCompression | 0.034 | 0.029 | 0.047 |
| 存读档 | 100/NoCompression | 0.173 | 0.125 | 0.354 |
| 存读档 | 100/LowCompression | 0.152 | 0.133 | 0.183 |
| 存读档 | 100/HighCompression | 0.207 | 0.073 | 0.267 |
| 存读档 | 1000/NoCompression | 0.927 | 0.652 | 2.117 |
| 存读档 | 1000/LowCompression | 0.466 | 0.441 | 2.311 |
| 存读档 | 1000/HighCompression | 0.828 | 0.671 | 1.735 |
| 存档 | 1/NoCompression | 0.124 | 0.092 | 0.22 |
| 读档 | 1/NoCompression | 0.196 | 0.156 | 0.711 |
| 往返 | 1/NoCompression | 0.402 | 0.257 | 0.646 |
| 存档 | 1/LowCompression | 0.054 | 0.051 | 0.081 |
| 读档 | 1/LowCompression | 0.19 | 0.146 | 0.645 |
| 往返 | 1/LowCompression | 0.267 | 0.224 | 0.416 |
| 存档 | 1/HighCompression | 0.062 | 0.05 | 0.214 |
| 读档 | 1/HighCompression | 0.15 | 0.136 | 0.212 |
| 往返 | 1/HighCompression | 0.219 | 0.21 | 0.274 |
| 存档 | 5/NoCompression | 0.069 | 0.063 | 0.159 |
| 读档 | 5/NoCompression | 0.173 | 0.136 | 0.247 |
| 往返 | 5/NoCompression | 0.409 | 0.34 | 1.319 |
| 存档 | 5/LowCompression | 0.116 | 0.108 | 0.153 |
| 读档 | 5/LowCompression | 0.144 | 0.132 | 0.383 |
| 往返 | 5/LowCompression | 0.387 | 0.326 | 0.72 |
| 存档 | 5/HighCompression | 0.077 | 0.075 | 0.082 |
| 读档 | 5/HighCompression | 0.139 | 0.134 | 0.364 |
| 往返 | 5/HighCompression | 0.392 | 0.339 | 0.714 |
| 存档 | 13/NoCompression | 0.224 | 0.145 | 0.248 |
| 读档 | 13/NoCompression | 0.148 | 0.139 | 0.201 |
| 往返 | 13/NoCompression | 0.589 | 0.563 | 1.135 |
| 存档 | 13/LowCompression | 0.12 | 0.114 | 0.147 |
| 读档 | 13/LowCompression | 0.141 | 0.136 | 0.18 |
| 往返 | 13/LowCompression | 0.633 | 0.591 | 1.559 |
| 存档 | 13/HighCompression | 0.14 | 0.137 | 0.183 |
| 读档 | 13/HighCompression | 0.159 | 0.154 | 0.217 |
| 往返 | 13/HighCompression | 0.618 | 0.589 | 1.23 |
| 勇士属性计算 | 10 | 0.868 | 0.851 | 1.67 |
| 勇士属性计算 | 100 | 7.748 | 7.298 | 11.326 |
| 勇士属性计算 | 1000 | 78.691 | 73.422 | 94.907 |
| 临界计算 | 1000 | 4.785 | 4.489 | 6.966 |
| 临界计算 | 10000 | 50.395 | 47.146 | 62.856 |
| 临界计算 | 50000 | 230.041 | 226.92 | 235.476 |

## 场景构成（`mapScenario.perf.ts`）

### 合并规则与三档规模

| 项 | 取值 |
| --- | --- |
| 数据来源 | `packages-user/data-state/test/fixtures/floors.json`（**只读**；13 个条目、全部 13×13、编号 `1..6`、怪物格合计 204） |
| 合并公式 | 列数 `Math.ceil(Math.sqrt(n))`、行数 `Math.ceil(n / 列数)`、每张按 `(列 * 13, 行 * 13)` 放置、末尾空位补 `0` |
| 规模档 | `MAP_SCALES = [1, 5, 13]`（取数据集**前 N 张**，JSON 声明顺序即稳定顺序） |
| 实测尺寸 | `1` → **13×13**；`5` → **39×26**（3×2 网格，1 个空格位）；`13` → **52×52**（4×4 网格，3 个空格位） |
| 实测怪物数 | **11 / 79 / 204** |
| 图块注册集合 | 恒为 **`1..6`**（遍历全部 13 个条目收集非零编号后升序去重，**与规模无关**；每编号只注册一次） |
| 地图注入 | `floorId` 固定 `'perf-scenario-merged'`、`layerAlias: { 0: 'bg' }`、`events: { 0: {} }`、`map` 为**扁平**数组；实时内容保持**原始编号**（不套 06-17 的清除规则） |
| 怪物图块编号 | `MONSTER_TILE_CODE = 4` |
| 随机种子 | `PERF_SEED = 20260916`，实际使用 `PERF_SEED + mapCount`（规模进种子，令各档分配互不影响） |

### 12 个真实模板（编号 `100..111`）

| # | id | code | hp / atk / def | money / exp / point | 特殊属性 | 覆盖点 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `perf-aura-full` | 100 | 120 / 12 / 3 | 5 / 7 / 1 | `25 {haloRange:0, haloSquare:false, atkBuff:30}` | **FullRange 光环** |
| 2 | `perf-aura-manhattan` | 101 | 90 / 9 / 2 | 4 / 6 / 1 | `25 {haloRange:3, haloSquare:false, hpBuff:20}` | **ManhattanRange 光环** |
| 3 | `perf-aura-rect` | 102 | 150 / 15 / 5 | 8 / 12 / 2 | `25 {haloRange:2, haloSquare:true, defBuff:25}`、`7 破甲 100` | **RectRange 光环** |
| 4 | `perf-guard` | 103 | 200 / 18 / 6 | 12 / 20 / 3 | `26 支援` | **GuardAura**（写邻居 `guard` 集合 → 伤害/临界走真实支援递归） |
| 5 | `perf-zone-cross` | 104 | 60 / 6 / 1 | 2 / 3 / 1 | `15 {zone:5, zoneSquare:false, range:2}` | `15` 十字领域视图 |
| 6 | `perf-zone-square` | 105 | 70 / 7 / 2 | 3 / 4 / 1 | `15 {zone:8, zoneSquare:true, range:1}`、`2 魔攻` | `15` 九宫格领域视图 + 魔攻 |
| 7 | `perf-repulse` | 106 | 80 / 8 / 2 | 3 / 5 / 1 | `18 3`、`22 固伤 7`、`9 净化 2` | `18` 阻击视图 + 固伤/净化分支 |
| 8 | `perf-laser` | 107 | 55 / 5 / 1 | 2 / 3 / 1 | `24 4`、`4 二连击` | `24` 激光视图（RayRange） |
| 9 | `perf-ambush` | 108 | 65 / 6 / 1 | 3 / 4 / 1 | `27 捕捉`、`1 先攻` | `27` 捕捉视图 + 先攻 |
| 10 | `perf-between` | 109 | 45 / 4 / 0 | 1 / 2 / 1 | `16 夹击`、`6 n连击 2` | `16` 夹击视图 + n 连击 |
| 11 | `perf-vampire` | 110 | 110 / 11 / 3 | 5 / 8 / 1 | `11 {vampire:10, add:true}`、`8 反击 50` | 吸血 + 反击 |
| 12 | `perf-sturdy` | 111 | 140 / 13 / 4 | 6 / 9 / 1 | `3 坚固`、`17 仇恨` | 坚固（`getCriticalLimit` → `Infinity`）+ 仇恨 |

**刻意排除并注明理由：** `20 无敌`（伤害恒为 `Infinity`、临界无意义）、`10 模仿`（会覆盖攻防、抹平阵容多样性）、`12/13/14/19/21/23`（不在本次三条测量路径上生效）。

**同模板内特殊属性代码两两不重复**，且 `25` 只被 `CommonAuraConverter` 命中、`26` 只被 `GuardAuraConverter` 命中，故运行期未出现 `warn(96/97)`。

### 确定性分配（实测，一次性探针，运行后已删除，仓库无残留）

| 规模 | 怪物数 | 模板分布（`code:数量`） |
| --- | --- | --- |
| 1 | 11 | `100:1, 101:1, 104:1, 105:2, 108:2, 109:1, 110:1, 111:2` |
| 5 | 79 | `100:12, 101:4, 102:6, 103:8, 104:2, 105:10, 106:4, 107:5, 108:8, 109:8, 110:6, 111:6` |
| 13 | 204 | `100:16, 101:17, 102:15, 103:15, 104:18, 105:16, 106:18, 107:25, 108:15, 109:21, 110:14, 111:14` |

同一规模**两次夹具构建**的分布逐项一致（同一次运行内两个 `it` 各建一次夹具），证明分配不依赖时间/随机源。`13` 档 12 个模板全部出现（含 4 个光环）。

### 勇士与装配

- **勇士属性**（`HERO_ATTRIBUTE_VALUES`）：`hp 1000` / `hpmax 1000` / `atk 10` / `def 5` / `mdef 3` / `mana 0` / `manamax 0` / `money 0` / `exp 0`。攻击 `10` 高于全部模板 `def`（0–6），保证 `heroPerDamage > 0`、伤害有限、临界枚举非空（`3 坚固` 经最终效果把 `def` 抬到 `9`，`heroPerDamage = 1` 仍有界）。
- **零修饰器**：不给勇士挂任何 `ValueModifier`、不建装备/道具侧负载（本计划只测怪物侧三条路径）。
- **装配次序**（`createScenarioFixture`）：`buildMergedMap(n)` → `createCoreState()` → **`enemyContext.resize(width, height)`**（必须早于放怪，覆盖 CoreState 默认的 `resize(13,13)`）→ `registerTiles` → `registerPrefabs`（`addPrefab`×12）→ `seedHero` → `injectMergedMap`（`maps.fromRaw`）→ `placeMonsters`（逐格 `setEnemyAt`）→ **首轮 `buildup()`（不计时）**。
- 三个管理器（`mapDamage` / `damageSystem`）与勇士属性在工厂里解析一次并随夹具返回，避免样本内做属性查找。

## ①②③ 三个样本的精确组成

| 项 | 单样本内容 | 关键说明 |
| --- | --- | --- |
| ① 怪物上下文构建 | `enemyContext.bindHero(fixture.hero)` + `enemyContext.buildup()` | **不是裸 `buildup()`**：`bindHero` 会顺带执行 `damageSystem.bindHeroStatus(hero)`（清伤害缓存）与 `mapDamage.refreshAll()`（全量地图伤害重建）。故 ① 实际是「光环拓扑重建 + 光环施加 + 最终效果 + 伤害缓存清空 + 一次地图伤害重建 + 第二次地图伤害重建（`buildup` 末尾）」。每样本必须先 `bindHero`，否则 `buildup()` 在 `needUpdate === false` 时直接早退、样本退化成空转（采用 `bindHero` 是为与 06-16 ① 同构） |
| ② 地图伤害构建 | `mapDamage.refreshAll()` + 对**每个怪物坐标** `getSeparatedDamage(locator)` 与 `getReducedDamage(locator)` | `refreshAll()` 会 `clearSourceState()` + 清 `reducedCache`，故每个样本都是**完整重建**而非缓存命中；`getReducedDamage` 走真实 `MainMapDamageReducer` 合并路径 |
| ③ 全图怪物单次临界计算 | 对合并地图里**每只怪**一次 `damageSystem.calculateCritical(view, 'atk')` 并**完整消费生成器** | 只取生成器不迭代会测不到二分枚举的真实开销；`getDamageInfo` **未单独计时**（`calculateCritical` 内部即 `calculator.calculate(handler)`），与本项意图一致 |

夹具的 `setEnemyAt` 逐格调用会各自触发一次 `markEnemyDirty` → 对新视图走 `refreshAll()`，故**夹具构建**成本约为 O(N²) 的点级刷新（N=204 时约 2 万次）；这部分全部发生在**预热循环之前**，**不计入任何耗时**，实测 9 个 case 合计仅 `792ms`。

## D-07 超时判据

**没有任何 case 逼近 `testTimeout`（30000ms）。**

- 全 lane 最慢 case 为既有的 `临界计算 50000`：median `230.041ms`、p95 `235.476ms`，占超时预算约 **0.78%**。
- 新增文件中较慢的 case 为 `怪物上下文构建 13/204`（median `4.183ms` / p95 `5.179ms`）与 `全图怪物单次临界计算 13/204`（median `4.026ms` / p95 `7.022ms`），占超时预算约 **0.023%**。
- `mapScenario.perf.ts` 单文件 9 个 case 合计 `792ms`；整轮 `pnpm test:perf`（6 文件 / 54 case）`9.13s`。
- 因此**未触发** D-07 的「暂停汇报」分支；`13`（52×52 / 204 怪）的规模与 `testTimeout` 均按用户裁决**原样保留**，未做任何私下调小规模或调大超时的动作。

## 实现解释口径（必须如实，不得美化）

### `registerSpecials` 与内联特殊属性

`registerSpecials(enemyManager)` 由 **`CoreState` 构造函数**调用（`core.ts` L199）——**注册确实发生**（`0..27` 全部登记、`guard` 属性默认值被设置）。但本计划的 12 个模板，其特殊属性实例是**内联 `createSpecial` 构造**的（形态镜像既有集成测试 `enemyCombination.test.ts` L55–74），**未走** `fromLegacyEnemy` 的 legacy 转换路径（仓库内无先例、legacy `Enemy` 类型字段繁多）。**不得**表述为「经 legacy 转换注册」。

真实被驱动的实现是：`CommonAuraConverter`、`GuardAuraConverter`、`MainEnemyFinalEffect`、`MainDamageCalculator`、`MainMapDamageConverter`、`MainMapDamageReducer`（均由 `CoreState` 构造函数装配，见 `core.ts` L206–219）。

### `MainEnemyComparer` 未覆盖（如实记录）

**`MainEnemyComparer` 在本场景中未被触达。** 它只在 `EnemyManager.compareWith` 的 `updateDirty` / `refreshDirty` 里被调用（`manager.ts` L237–243 / L294–311），而本计划**不建存档基线**（不调用 `compareWith`），故 `hasReference` 为假时 `updateDirty` 直接返回。相应后果：`warn(117)` 不会出现、怪物也不会进入存档 dirty 集合。**未覆盖的原因**是「本计划不做存读档」，而非被遗漏；若后续需要覆盖，需在夹具里对 `state.enemyManager` 调用一次 `compareWith(参考模板表)`，代价是引入与本计划无关的存档 dirty 语义（CoreState 已 `attachEnemyComparer`，首次调用不告警）。

### 全局 `core` stub

`BetweenDamageView`（`src/enemy/mapDamage.ts` L237）读取**无 import 的全局** `core.flags.betweenAttackMax`。数据端在 Node 下不存在该全局对象，未注入会直接抛 `TypeError`。故本文件在 `vi.hoisted` 里 `vi.stubGlobal('core', { flags: { betweenAttackMax: false } })`（与 `src/enemy/mapDamage.test.ts` L21 同构），并采用 `false` 分支（`half = hero hp / 2`）。**如实含义：该分支在 Node 下必须由外部注入 `core`。**

### 其它口径

- **`3 坚固` 会把克隆勇士攻击短暂设为 `Infinity`**：`MainDamageCalculator.getCriticalLimit` 对 `3 坚固` 返回 `Infinity` → `upperLimit = Math.floor(Infinity) = Infinity` → 临界流程先把 `hero.set('atk', Infinity)`（`findNextCritical` 的 `right`）以二分探测；由于伤害随攻击单调不减、探测值 `>= referenceDamage`，`findNextCritical` 立即返回 `null` 并结束。该 `set` 作用在 `calculateCritical` L152 每次新取的 `getModifiableClone()` 克隆体上，**不污染真实勇士属性**（本文件亦不给勇士挂任何修饰器，避免 `Infinity` 与修饰器叠加出无意义噪声）。
- **图块注册动机**是夹具真实性（真实游戏里 `1..6` 都有定义），而非消除某条既有告警；注册集合与地图数量无关。
- **`fromRaw` 硬约束**：`events` 必须有图层键、`map.length % width === 0`；每个 `it` 都新建 `CoreState`，故固定 `floorId` 不会触发 `warn(121)`；`layerAlias` 用 `'bg'`（不用 `'event'`），不模拟触发器。

## 实现风险记录（report-only，未改任何生产代码）

| 风险 | 分类 | 说明 |
| --- | --- | --- |
| `BetweenDamageView` 依赖全局 `core` | **已规避** | 在 `vi.hoisted` 里 stub `core.flags.betweenAttackMax = false`；运行期零 `TypeError`、零告警码 |
| `setEnemyAt` 的 O(N²) 夹具构建成本 | **已规避** | N=204 时约 2 万次点级刷新；全部发生在预热之前（不计时），9 个 case 合计 `792ms`，远未逼近超时 |
| `bindHero` 副作用被计入 ① | **仅记录（口径已披露）** | 样本 = `bindHero` + `buildup()`，含 `bindHeroStatus` 清缓存与一次 `refreshAll`；SUMMARY 已明确标注 ① **不是**裸 `buildup()` |
| `buildup()` 早退导致空转 | **已规避** | 每样本先 `bindHero` 置 `needUpdate`；夹具末尾的首轮 `buildup()` 把脏标记清掉，避免把全量构建算进采样 |
| `requestRefresh` 反向触发全量构建被算进采样 | **已规避** | 夹具在预热前已跑过一次 `buildup()`，故采样内首次取计算后怪物不会触发整轮构建 |
| `calculateCritical` 对 `3 坚固` 会短暂把克隆勇士攻击设成 `Infinity` | **仅记录（已实测终止）** | 靠伤害函数的单调性与 `findNextCritical` 的 `targetInfo.damage >= referenceDamage → null` 终止，`maxIterations = clamp(precision,4,64)` 另有一层上界；204 怪含 `3 坚固` 模板，实测 `4.026ms` 正常返回、无超时、无告警。**不是已确认缺陷**（`getCriticalLimit` 返回 `Infinity` 是「坚固不可一击」的有意语义），故不登记 `06-TEST-FINDINGS.md` |
| `getDamageInfo` 未单独计时 | **仅记录** | `calculateCritical` 内部即 `calculator.calculate(handler)`；若需单独测 `getDamageInfo`，需用户另行裁决 |
| `MainEnemyComparer` 未被触达 | **仅记录（未覆盖 + 原因）** | 见上文「实现解释口径」 |
| 45 行既有数字不可直接对比 | **仅记录（口径已披露）** | 见「测量方式变更声明」；本次已附改造后的 45 行重新读数 |
| 模板特殊属性为内联构造 | **仅记录（口径已披露）** | `registerSpecials` 确实完成注册，但未走 legacy 转换路径 |

### 疑似缺陷

**按代码阅读与运行期观测，本计划未发现新的疑似缺陷，故 `06-TEST-FINDINGS.md` 无新增条目（`#06-18-N` 一条都没有）。** 运行期 `[WARNING Code` / `[ERROR Code` 出现次数均为 **0**。

## D-44 Quality Gate Results

**开工前现场记录的基线（本次执行开始即测，不沿用 06-17 的旧数字）：**

| 项 | 基线（开工前） | 说明 |
| --- | --- | --- |
| `pnpm test:ci` | **66 文件 / 690 passed / 1 skipped** | 06-17 收口时为 680 passed，Phase 7 之后已变化，故以本次现场基线为准 |
| `pnpm exec vitest list --filesOnly` | 66 文件、`.perf.ts` 匹配 **0** | 证明 `test:ci` 通道不收集 perf 文件 |
| `pnpm test:perf` | 5 文件 / 45 passed / 0 warn+error | 改造前（`performance.now()`） |

**每个阶段的门禁结果：**

| 阶段 | 提交 | `eslint --fix` | `eslint <改动文件>` | `vue-tsc`（按文件路径过滤） | `pnpm test:perf` | `pnpm test:ci` |
| --- | --- | --- | --- | --- | --- | --- |
| 1（构件级） | `6c4d370` | exit 0 | **0 错误**（5 warn：`no-console`） | 5 个改动文件命中 **0** 条 | 5 文件 / **45 passed** / 45 行表 / 0 warn+error | 66 文件 / **690 passed** / 1 skipped |
| 2（组合级） | `c193c4e` | exit 0 | **0 错误**（1 warn：`no-console`） | `mapScenario.perf.ts` 命中 **0** 条 | 6 文件 / **51 passed** / 51 行表 / 0 warn+error | 66 文件 / **690 passed** / 1 skipped |
| 3（完整级） | `5317b2f` | exit 0 | **0 错误**（新文件 2 warn：`no-console`） | 6 个文件命中 **0** 条 | 6 文件 / **54 passed** / **54 行主表 + 3 行第二表** / 0 warn+error | 66 文件 / **690 passed** / **1 skipped** |

- `pnpm exec vue-tsc --noEmit` 全仓共 **27** 条既有错误，全部位于 `packages-user/client-modules`（7 文件）、`packages-user/legacy-plugin-data`、`packages/legacy-ui` —— D-44 明确排除范围；按 6 个 perf 文件路径过滤命中 **0** 条。（阶段 1 与阶段 3 的两次全量 `vue-tsc` 均为 27 条，未见新增。）
- `pnpm exec vitest list --filesOnly`（默认配置）在阶段 2、3 各复核一次，输出仍**不含** `.perf.ts`（66 文件、匹配 0）；`vitest.perf.config.ts`、`package.json`、`vite.config.ts`、`tsconfig*.json` **一字未改**（第 6 个 perf 文件由既有 `test.include: ['**/*.perf.ts']` 自动收集）。
- **`test:ci` 基线对照：** 阶段 1 / 2 / 3 各复核一次，均为 66 文件 / 690 passed / 1 skipped，与开工前基线**逐项一致**。
- **`git status`** 最终仅含本计划的产物：6 个 `*.perf.ts`（5 改 1 增）+ 本 SUMMARY；无生产/核心源码改动、无配置改动、无新依赖、无夹具数据改动（`floors.json` 只读复用）、无基线 JSON 落盘、无临时探针残留（`PERF_PROBE` 与 `console.log` 匹配数均为 0）。
- **零断言复核（6 个文件）：** `expect(` 匹配数 **0**、`import type` **0**、`globalThis.performance.now()` **0**、`it.skip`/`it.todo`/fake timers/`hrtime` **0**；每个文件均为 `mark`×2 / `clearMarks`×2 / `clearMeasures`×1，且 6 个文件全部为 CRLF（LF-only 计数 0）。

## Task Commits

Each task was committed atomically:

1. **阶段 1（构件级）：5 个既有 `*.perf.ts` 的计时改为 `performance.mark` + `performance.measure`** - `6c4d370` (test)
2. **阶段 2（组合级）：新建 `mapScenario.perf.ts` —— 合并大图 + 12 个真实模板 + ① 上下文构建 / ② 地图伤害构建** - `c193c4e` (test)
3. **阶段 3（完整级）：补 ③ 全图怪物单次临界计算与 total/avg 汇总第二表** - `5317b2f` (test)

**Plan metadata:** （本次提交，含本 SUMMARY）(docs)

## Files Created/Modified

- `packages-user/data-state/test/mapScenario.perf.ts`（**新增**，689 行）—— `vi.hoisted` 三处 stub（`main`/`location`/**`core`**）+ `Map.prototype` 补丁；静态 JSON 导入 + 内联 `IFloorEntry`/`IFloorDataset`/`FLOOR_DATA`/`TILE_CODES`/`IMonsterAttrs`/`IMonsterPrefab`/`MONSTER_PORTFOLIO`（12 模板）/`PerfRecord`/`CriticalRecord`/`IScenarioFixture` + `collectTileCodes`/`toFlat`/`buildMergedMap`/`createRandom`(mulberry32)/`createSpecial`/`createPrefab`/`registerTiles`/`registerPrefabs`/`seedHero`/`injectMergedMap`/`placeMonsters`/`measureCase`/`createScenarioFixture` + 9 个 `it` + `afterAll` 两张表
- `packages-user/data-system/src/combat/context.perf.ts`（改 19 增 / 3 删）—— `measureCase` 计时改 mark/measure + 逐样本清理
- `packages-user/data-system/src/combat/damage.perf.ts`（改 19 增 / 3 删）—— 同上
- `packages-user/data-base/src/hero/attribute.perf.ts`（改 19 增 / 3 删）—— 同上
- `packages-user/data-state/test/saveables.perf.ts`（改 19 增 / 3 删）—— 同上
- `packages-user/data-state/test/saveablesReal.perf.ts`（改 19 增 / 3 删）—— 同上（fixture 部分一字未动）
- `packages-user/data-state/test/fixtures/floors.json`（**只读复用，未改动**）

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 新建文件必须转换成 CRLF，否则违反 `dev.md` 换行规范**

- **Found during:** Task 2（阶段 2）首次写入 `mapScenario.perf.ts` 之后
- **Issue:** 写入工具产出 LF 换行（实测 `CRLF=0 LF_ONLY=630`），而 `dev.md`（L115）与 `.prettierrc`（`endOfLine: crlf`）均要求 **CRLF**；既有 5 个 perf 文件全部为 CRLF。eslint/prettier 未把该差异报为错误，故不会自动发现。
- **Fix:** 先 `\r\n → \n` 归一、再 `\n → \r\n`，写回无 BOM 的 UTF-8；此后每次编辑都复核 CRLF 计数（最终 689 行 / CRLF 689 / LF-only 0）。
- **Files modified:** `packages-user/data-state/test/mapScenario.perf.ts`
- **Verification:** 6 个文件的 CRLF 计数均等于行数、LF-only 均为 0。
- **Committed in:** `c193c4e`（阶段 2）

**2. [Rule 1 - Bug] 夹具完整性自检的消息必须带模板编号**

- **Found during:** Task 2（阶段 2）实现 `placeMonsters` 时
- **Issue:** 首版把 `MONSTER_PORTFOLIO[index].code` 直接内联进 `createEnemy(...)`，导致自检 `throw new Error('性能夹具：找不到怪物模板')` 无法指出是哪个编号缺失，违背计划「与 `enemyCombination.test.ts` L214–215 同构」的可诊断性意图。
- **Fix:** 先取出 `const entry = MONSTER_PORTFOLIO[index];`，再 `createEnemy(entry.code)`，自检消息拼接 `entry.code.toString()`。
- **Files modified:** `packages-user/data-state/test/mapScenario.perf.ts`
- **Verification:** 自检路径本身未触发（12 个模板全部命中，`createEnemy` 从未返回 `null`）；`eslint` 0 错误。
- **Committed in:** `c193c4e`（阶段 2）

---

**Total deviations:** 2 auto-fixed（均为新建文件内的实现细节，范围仅限 `mapScenario.perf.ts`）。
**Impact on plan:** 两处都是「让新文件满足项目换行规范 / 让自检可诊断」的必需修正，无范围蔓延、无接口变更、无行为弱化、无断言新增、无告警放宽。

## Issues Encountered

- **运行期告警/错误码：0 次。** 三个阶段的 `pnpm test:perf` 运行中 `[WARNING Code` / `[ERROR Code` 出现次数均为 0；`vitest.perf.config.ts` 未改动、`.perf.ts` 未被默认配置收集（`vitest list --filesOnly` 匹配 0）。
- **无阻断性问题**：未出现 `testTimeout` 失败、未出现 `warn 96/97/102/103/104/110/121/123/133/134/137`、未出现 `error 60/61`、未出现 `TypeError`。
- **子进程中文 stdout 在 PowerShell 下显示为乱码**（06-16/06-17 已记录同一现象）：以管道方式捕获的 `console.table` 中文 `case` 列会变成替换字符，**数值列不受影响**。本 SUMMARY 的表格改用 `cmd /c` 重定向（绕开 PowerShell 的解码）后按 UTF-8 解析，故中文列名完整。表中 54 行按 `it` 的确定性声明顺序对齐，与预期 `scale` 序列完全一致。
- **`git diff "$before..HEAD"` 在 PowerShell 下必须加引号**：不加引号时 `$before..HEAD` 会被解析为 PowerShell 的区间运算符而报 `usage: git diff`。仅影响本机命令行取证，不影响仓库状态。

## Known Stubs

**None.** 6 个 perf 文件均无硬编码空值、无占位文案、无 `TODO`/`FIXME`、无未接线数据源；唯一的 `throw` 是夹具完整性自检，不构成 stub。

**Broken-windows ledger：** 本计划**无** stub / skipped-test / unrun-verify / deviation 需要登记（两处 deviation 均为新建文件内的实现细节修正，且已在本 SUMMARY 记录；`WINDOWS.md` 未追加条目）。

## Threat Flags

**None.** 本计划只新增/修改仓库内的 Node Vitest 性能测量文件（`*.perf.ts`）与一份规划产物；无运行时输入面、无网络、无 DOM、无写盘（结果只进 `console.table` 与本 SUMMARY）、无新依赖、无新增数据文件。`threat_model` 的 6 条 mitigate 项（`T-06-18-01`..`T-06-18-06`）全部按计划落实：清理顺序正确（改造前后量级一致）、`.perf.ts` 未被 `test:ci` 收集、三条测量项均非空转（怪物数 11/79/204 为证）、无 case 逼近超时、`floors.json` 只读、未改任何生产源码/配置/既有测试。

## Next Phase Readiness

- **真实大地图战斗场景性能数据已固定**：9 行主表 + 3 行临界汇总表可直接作为后续战斗层优化的对比基线（**未落盘为基线 JSON**，对比需人工取用本表数字）。
- **计时口径已统一为可被外部工具读取的标准标记**：全部 6 个 perf 文件使用 `performance.mark`/`measure`，标记名含 case 与规模、逐样本清理，可被 DevTools/性能剖析工具直接采集。
- **通道零变化且可扩展**：新增 `*.perf.ts` 仍被 `vitest.perf.config.ts` 自动收集；`pnpm test:ci` 的语义、收集文件数与结果与现场基线一字不变（66 / 690 / 1）。
- **规模可安全放大**：52×52 / 204 怪的最慢新 case 为 `4.183ms`（p95 `5.179ms`），离 `testTimeout` 有三个数量级余量；O(N²) 夹具构建实测仅占单文件 `792ms` 的一部分，若要继续放大规模无需担心超时。
- **待用户裁决**：本计划 `mainEnemyComparer` 未覆盖（本计划不做存读档）；若需要该路径的耗时数据，需单独立项并在夹具里调用一次 `enemyManager.compareWith(参考模板表)`。

---

*Phase: 06-unit-tests*
*Completed: 2026-09-16*

## Self-Check: PASSED

- FOUND: `packages-user/data-state/test/mapScenario.perf.ts`（689 行，CRLF）
- FOUND: `packages-user/data-system/src/combat/context.perf.ts`（mark/measure 已落地）
- FOUND: `packages-user/data-system/src/combat/damage.perf.ts`（mark/measure 已落地）
- FOUND: `packages-user/data-base/src/hero/attribute.perf.ts`（mark/measure 已落地）
- FOUND: `packages-user/data-state/test/saveables.perf.ts`（mark/measure 已落地）
- FOUND: `packages-user/data-state/test/saveablesReal.perf.ts`（mark/measure 已落地，fixture 未动）
- FOUND: commit `6c4d370`（阶段 1）
- FOUND: commit `c193c4e`（阶段 2）
- FOUND: commit `5317b2f`（阶段 3）
- FOUND: `.planning/phases/06-unit-tests/06-18-SUMMARY.md`（本文件）
- VERIFIED: `pnpm test:perf` 6 文件 / 54 passed / 54 行主表 + 3 行第二表 / 0 warn+error
- VERIFIED: `pnpm test:ci` 66 文件 / 690 passed / 1 skipped（与开工前现场基线逐项一致）
- VERIFIED: 默认配置 `vitest list --filesOnly` 中 `.perf.ts` 匹配数为 0（66 文件）
- VERIFIED: `eslint` 0 错误（6 个改动文件）；`vue-tsc` 按 6 个文件路径过滤 0 条
- VERIFIED: 6 个文件合计 0 个断言调用、0 个 `import type`、0 个 `performance.now()`、无 `it.skip`/`it.todo`/fake timers
- VERIFIED: 合并尺寸 13×13 / 39×26 / 52×52，怪物 11 / 79 / 204，模板分配确定性（一次性探针，已删除，无残留）
