---
phase: 06-unit-tests
plan: 17
subsystem: testing
tags: [vitest, performance, perf-lane, console-table, record-only, real-map-fixture, save-load, compression, low-vs-high, data-state, data-base]

# Dependency graph
requires:
  - phase: 06-unit-tests (06-16)
    provides: 独立 perf 通道（`vitest.perf.config.ts` + `pnpm test:perf`）与 `measureCase` 口径（预热 3 不计时 + 采样 20 取中位数/min/p95）
provides:
  - packages-user/data-state/test/fixtures/floors.json —— 13 张真实魔塔地图夹具（13×13，由仓库根 `floors.json` 原样移入，根副本已删除）
  - packages-user/data-state/test/saveablesReal.perf.ts —— 27 个真实地图存读档 case（3 地图数量 × 3 压缩档 × 3 计时项），零断言
  - 本 SUMMARY 的 27 行耗时数值表（含 Low/High 分支差异的如实说明与夹具非空转证据）
  - 06-TEST-FINDINGS.md 的 `#06-17-1`（HeroEquipment 持有被替换 attribute 引用，读档丢失装备加成）
affects: [06-verify-work（Phase 6 收口）, 后续地图层/存档层性能回归对比, 装备存读档缺陷修复]

# Actuals (#2632) — same scale as the plan `estimate` (chars/4 over the realized diff).
actuals:
  tokens: 9602
  tasks: 3
  commits: 3
  plan_head_before: 92bddd6c747b03abdfc68745f6a6df29e9b8813d

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "真实数据夹具：把用户提供的 `floors.json` 原样移入 `test/fixtures/` 并用静态 `import`（`resolveJsonModule: true`）读入，把「真实地图内容」作为可追溯的固定输入，而不是把矩阵抄进 `.ts`"
    - "JSON 进类型的无 `as` 写法：声明内联 `IFloorEntry` / `IFloorDataset` 接口后 `const dataset: IFloorDataset = floorDataset`，再逐字段复制进 `Record<string, IFloorEntry>`；JSON 模块的匿名对象类型带隐式索引签名，故无需断言"
    - "live = 清除矩阵、参考 = 原始矩阵：`fromRaw(清除后)` 作实时内容 + `compareWith(原始)` 作一次性参考，让 HighCompression 真正走 `diffRows` 行差异路径（探针实测 13 张图共 140 个差异行）"
    - "perf 夹具必须在任何计时之前完成：只建 N 张地图后**一次性** `compareWith`（`MapState.compareWith` 有一次性守卫），读档快照也在预热循环前取一次"
    - "perf 夹具的非空转自查：用一次性临时探针打印 floors / fullMap 单元格 / diff 行 / 修饰器数 / 装备实例数 / 录像长度，确认后删除，仓库不保留探针"

key-files:
  created:
    - packages-user/data-state/test/fixtures/floors.json
    - packages-user/data-state/test/saveablesReal.perf.ts
  modified:
    - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md
    - .planning/WINDOWS.md
  deleted:
    - floors.json（仓库根，未跟踪副本）

key-decisions:
  - "阶段 1 的夹具必须至少注册并添加 1 件装备实例：`HeroEquipsStore.loadState` 在存档装备列表为空时 `logger.error(58)`，而 `CoreState.loadState` 必然加载 `@system/hero`，故「阶段 1 完全无侧负载」与「运行期零 error 码」不可兼得；按「调整夹具、不放宽告警」的原则补最小装备实例（WINDOWS #28 已登记）"
  - "diff 存储语义按用户裁决落地为 live = 清除矩阵（`2/3/4/6` → `0`，保留 `0/1/5`）、参考 = 原始矩阵；`compareWith` 只在全部地图建完后调用一次"
  - "Low/High 分支差异据实记录：High 走 `diffRows` 行差异（实测 140 行 / 13 张图），**Low 回落为整图 `fullMap`**（实测 2197 单元格 = 13×169），因 `saveLowCompression` 没有行差异分支；不得把 Low 描述成行差异"
  - "零断言为硬约定：全文件 0 个 `expect(`、无 `it.skip`/`it.todo`、无 fake timers；耗时只进 `console.table` 与 SUMMARY，不落盘基线 JSON、不新增耗时门禁"
  - "图块注册（`1..6`）的动机是夹具真实性（原始参考矩阵含 `2/3/4/5/6`）与编号集合与地图数量无关，而不是消除某条既有告警（`StaticTile.raw()` 对未注册编号返回 `null` 且不告警）"
  - "`HeroEquipment` 持有构造期 attribute 引用的风险按 D-06 登记为 `#06-17-1`（高）：临时探针实测三档压缩读档后 `atk` 由 `5` 变 `0`，故本计划只记录、不加任何读档后断言、不改生产代码"

patterns-established:
  - "同一份真实数据的「实时值 / 参考值」双视图夹具：清除规则只作用于 live，参考保持原始，从而在不改数据文件的前提下驱动行差异路径"
  - "规模不敏感的固定侧负载：把 flags / 道具 / 装备 / 修饰器 / 录像 / 怪物固定成常量，使 27 个 case 的唯一变量是地图数量与压缩档"

requirements-completed: [TEST-01]

# Metrics
duration: 31min
completed: 2026-09-16
status: complete
---

# Phase 6 Plan 17: 真实地图存读档性能补充 Summary

**把 13 张真实 13×13 魔塔地图落为测试夹具，新增 27 个零断言存读档 case（地图数量 1/5/13 × No/Low/High 压缩 × 存档/读档/往返）：最慢的 p95 仅 2.356ms（13/HighCompression 往返），远未逼近 30000ms 超时；`pnpm test:perf` 由 4 文件 / 18 行变为 5 文件 / 45 行，运行期零 `WARNING`/`ERROR` 码，`pnpm test:ci` 保持 66 文件 / 680 passed / 1 skipped**

## Performance

- **Duration:** ~31 min（15:49:53 → 16:20:43 +08:00）
- **Tasks:** 3/3
- **Files modified:** 2 created + 1 deleted + 2 planning artifacts
- **Plan head before:** `92bddd6`；**commits in range:** 3（实测 `git rev-list --count 92bddd6..HEAD`）

## 测量参数（与 06-16 逐字一致）

| 参数 | 取值 | 说明 |
| --- | --- | --- |
| 预热 | `WARMUP_RUNS = 3` | 不计时，`measureCase` 内先跑完再进入采样 |
| 采样 | `SAMPLE_RUNS = 20` | 每样本用 `globalThis.performance.now()` 取首尾差 |
| 中位 | `samples[10]` | 升序排序后取**下中位数**（20 个样本的第 11 个） |
| 最小 | `samples[0]` | 升序排序后首元素 |
| p95 | `samples[Math.ceil(20 * 0.95) - 1] = samples[18]` | 升序排序后第 19 个 |
| 取整 | `Number(v.toFixed(3))` | 三个数值统一 3 位小数 |
| 断言 | **无** | 全文件 0 个 `expect(`；耗时永不导致用例失败（用户裁决） |
| 计时源 | `globalThis.performance.now()` | 不使用 fake timers、不使用其它计时源 |
| 超时 | `testTimeout`/`hookTimeout` = 30000ms | 与 `vite.config.ts` 一致 |

**运行环境：** Node `v22.18.0`（win32 / x64），CPU `12th Gen Intel(R) Core(TM) i5-12500H`，`pnpm 10.15.0`，vitest `4.0.18`。

## 27 行耗时数值表

> 来自真实 `pnpm test:perf` 运行：**Test Files 5 passed (5)** / **Tests 45 passed (45)**（06-16 的 18 + 本计划新增 27），返回码 0；`packages-user/data-state/test/saveablesReal.perf.ts (27 tests) 379ms`。**每一行都是独立 `it`**；表中数字为该 case 20 次采样的统计量，单位毫秒。

| case | scale | median ms | min ms | p95 ms |
| --- | --- | --- | --- | --- |
| 存档 | 1/NoCompression | 0.18 | 0.141 | 0.276 |
| 读档 | 1/NoCompression | 0.527 | 0.376 | 1.124 |
| 往返 | 1/NoCompression | 0.939 | 0.514 | 1.305 |
| 存档 | 1/LowCompression | 0.087 | 0.052 | 0.125 |
| 读档 | 1/LowCompression | 0.407 | 0.235 | 0.676 |
| 往返 | 1/LowCompression | 0.696 | 0.317 | 1.19 |
| 存档 | 1/HighCompression | 0.048 | 0.045 | 0.078 |
| 读档 | 1/HighCompression | 0.552 | 0.416 | 0.767 |
| 往返 | 1/HighCompression | 0.89 | 0.298 | 1.076 |
| 存档 | 5/NoCompression | 0.138 | 0.062 | 0.238 |
| 读档 | 5/NoCompression | 0.377 | 0.234 | 0.637 |
| 往返 | 5/NoCompression | 0.653 | 0.436 | 1.323 |
| 存档 | 5/LowCompression | 0.067 | 0.064 | 0.076 |
| 读档 | 5/LowCompression | 0.354 | 0.186 | 0.424 |
| 往返 | 5/LowCompression | 0.55 | 0.383 | 1.376 |
| 存档 | 5/HighCompression | 0.078 | 0.075 | 0.092 |
| 读档 | 5/HighCompression | 0.488 | 0.269 | 0.702 |
| 往返 | 5/HighCompression | 0.792 | 0.416 | 1.419 |
| 存档 | 13/NoCompression | 0.116 | 0.11 | 0.129 |
| 读档 | 13/NoCompression | 0.333 | 0.205 | 0.557 |
| 往返 | 13/NoCompression | 1.242 | 0.722 | 2.047 |
| 存档 | 13/LowCompression | 0.142 | 0.118 | 0.332 |
| 读档 | 13/LowCompression | 0.342 | 0.214 | 0.416 |
| 往返 | 13/LowCompression | 1.229 | 0.757 | 2.025 |
| 存档 | 13/HighCompression | 0.207 | 0.135 | 0.269 |
| 读档 | 13/HighCompression | 0.673 | 0.299 | 0.948 |
| 往返 | 13/HighCompression | 0.881 | 0.703 | 2.356 |

### 观察（据实记录，不做美化）

- **耗时与地图数量几乎无关**：`存档` 的 median 在 1/5/13 张时分别为 `0.18 / 0.138 / 0.116`（NoCompression）；`读档` 为 `0.527 / 0.377 / 0.333`。三档压缩下都没出现随地图数量单调上升的趋势。原因可解释：13 张地图的矩阵负载只有 `13 × 169 = 2197` 个 `Uint32`（约 9KB），在本夹具的固定侧负载（50 flags + 20 种道具 + 4 件装备 + 20 个修饰器 + 1000 步录像 + 英雄/位置/渲染存档）面前可以忽略。**本表无法分辨「单张地图的边际存读档成本」**，只能给出「真实地图内容 + 固定侧负载」的整体量级。
- **`往返` ≈ `存档` + `读档`**：如 `13/NoCompression` 为 `0.116 + 0.333 = 0.449` 对应实测 `1.242`；`13/HighCompression` 为 `0.207 + 0.673 = 0.88` 对应实测 `0.881`。数量级自洽，未出现超线性现象。
- **`存档` 在本夹具下比 `读档` 便宜**（NoCompression 三档均为 `0.1–0.2ms` vs `0.3–0.5ms`），与 06-16 的合成 2×2 夹具不同：真实地图的存档路径只做 `Uint32Array` 拷贝与静态块扫描，而读档要重建图层数组并叠加参考。
- **亚毫秒噪声不可忽略**：`存档 1/NoCompression = 0.18` 反而高于 `存档 13/NoCompression = 0.116`，这是采样噪声而非「地图越多越快」；解读时只应看数量级。

### D-07 超时判据

**没有任何 case 逼近 `testTimeout`（30000ms）。** 全局最慢 case 为 `13/HighCompression` 的 `往返`，median `0.881ms`、p95 `2.356ms`，占超时预算约 **0.008%**；单文件 27 个 case 合计 `379ms`，整轮 `pnpm test:perf`（5 文件）`8.41s`。因此**未触发** D-07 的「暂停汇报」分支，规模与超时均按用户裁决原样保留。

## 三行语义

| case | 单样本内容 | 快照时机 |
| --- | --- | --- |
| `存档` | 仅 `state.saveState(compression)` | 无快照 |
| `读档` | 仅 `state.loadState(snapshot, compression)` | 快照在**预热循环之前**取一次（各 `loadState` 实现只读取存档对象、不回写，故同一快照可跨样本复用） |
| `往返` | 同一压缩档下 `saveState` + `loadState` | 每样本各取一次 |

夹具构建（注册图块 → 侧负载 → 建 N 张地图 → 一次性 `compareWith`）全部发生在**预热循环之前**，不计入耗时。

## 固定真实侧负载（27 个 case 逐字相同）

| 项 | 数量 | 实现 |
| --- | --- | --- |
| flag 条目 | **50** | `state.flags.setFieldValue('perf-flag-' + i, i)` |
| 道具种类 | **20**（3 种装备 `3000..3002` + 17 种消耗品 `3020..3036`） | `registerItem`：先 `tileStore.addTile` 再 `itemStore.addItem`（顺序不可颠倒） |
| 装备实例 | **4 件**（编号 `3000/3001/3002/3000`，3 种） | `hero.items.equipment.add(num)` → `hero.equip.equip(uid, slot)`，槽位 `[0,1,2,3]` 互不重复才能同时装备 |
| 勇士修饰器 | **20**（4 件装备各贡献 1 个 + 16 个手写 `ValueModifier(5)`） | 装备的 `equip.value` 每件恰好 1 个条目；手写在 9 个数值属性间轮转，每次都用新实例避免 `warn 108` |
| 消耗品件数 | `1 + (i % 5)`，各不相同 | 模拟真实背包 |
| 录像 | **1000 步**混合（`code = i % 8`：移动/瞬移/用道具/装备/卸下） | `replaySystem.record(...)` 最后写入；加上 4 次 `equip()` 内部记录，实测存档长度为 **1004** |
| 怪物 | 只建与参考一致的基线，**不模拟任何改动** | `addPrefab` + `compareWith`，故 `dirtySet` 为空、存档里没有怪物条目 |
| 地图点事件 | 空（`events: { 0: {} }`） | 不模拟触发器 |

**非空转证据（一次性临时探针，运行后已删除，仓库无残留）：** 13 张地图全部 active 且全部进入存档；NoCompression 的 `fullMap` 单元格合计 **2197**（= 13×169）；HighCompression 的差异行合计 **140**，且 **13/13** 张地图都有差异行；`hero` 存档修饰器数 **20**；装备实例 **4**；录像长度 **1004**。

## 压缩档分支差异（据实说明）

| 压缩档 | `MapLayer` 分支 | 本夹具实测行为 |
| --- | --- | --- |
| `NoCompression` | `saveNoCompression` | 始终写整图 `fullMap`（13 张图共 2197 个单元格） |
| `LowCompression` | `saveLowCompression` | `layerDirty && (!refArray \|\| !isEqualToRef())` 为真 → **回落为整图 `fullMap`**（实测同为 2197 个单元格）。**`saveLowCompression` 没有行差异分支**，本夹具下 Low **不是**行差异存储 |
| `HighCompression` | `saveHighCompression` | `layerDirty && refArray` 为真 → 走 `diffRows` 行差异（实测 140 行 / 13 张图） |

**diff 存储语义：** live 矩阵 = 清除后（`2` 普通门 / `3` 资源 / `4` 怪物 / `6` 机关门 → `0`，保留 `0` 空地 / `1` 墙壁 / `5` 入口）；`compareWith` 参考 = **原始**真实矩阵（含 `2/3/4/6`）。因此图层保持脏、只有含被清除编号的行进入 High 的差异行集合，读档时又必须叠加参考基准才能还原 —— 这正是真实游戏主读档负载的形态。

**说明：** 本计划只测「真实地图内容下三档压缩的存档/读档/往返耗时」，不对 Low 回落整图这一实现细节做优化或断言；Low 档读数偏快/偏慢都只作记录。

## 实现风险记录（report-only，未改任何生产代码）

**`HeroState.loadState` 替换 attribute 后 `HeroEquipment` 仍持有旧引用** —— 已用一次性临时探针实测确认，并按 D-06 登记为 `06-TEST-FINDINGS.md` 的 **`#06-17-1`**（严重度：高）：

- **现象与最小复现：** 注册 1 件 `atk + 5` 的装备并装备后，`hero.getModifiableAttribute().getFinalAttribute('atk')` 为 `5`；`hero.saveState(compression)` → `hero.loadState(saved, compression)` 之后，**三个压缩档均实测为 `0`**（期望仍为 `5`），同一次探针中 `getModifiableAttribute()` 与旧 attribute 的同一性为 `false`（属性对象确实被替换）。
- **疑似原因：** `hero/state.ts:71` 构造 `HeroEquipment(this.items.equipment, this.attribute)` 时按值保存 attribute 引用，而该成员在 `hero/equipment.ts:21-26` 为 `private readonly`、无法被重新指向；`HeroState.loadState`（`state.ts:177-189`）替换 `this.attribute` 时没有同步给 `equipment`，随后 `equipment.loadState` → `equip()` → `loadEquipEffect`（`equipment.ts:80-85`）把装备修饰器加到了旧对象上。
- **影响面：** 任何经 `hero.loadState` 的路径（读档、自动存档回滚、回放重置）都会丢失全部装备加成，直到属性对象被重新赋值且装备被重新挂载；此后 `HeroEquipment.equip` / `compareEquip` 也继续作用于旧属性；旧属性对象被 `HeroEquipment` 长期引用，重复读档会在其上持续累积未被卸载的装备修饰器（`equips.clear()` 不触发 `unloadEquipEffect`）。
- **建议方向：** 让 `HeroEquipment` 持有 `IHeroState`/取值函数而非 attribute 实例，或在 `HeroState.loadState` 中按 `attachAttribute` 语义把新属性同步给 `equipment`（并在替换前先卸载旧属性上的装备修饰器）；修复前补一条「读档后最终属性仍含装备加成」的回归用例。
- **为什么本计划只记录：** 用户裁决与 D-05/D-07 一致 —— 只报告、等用户裁决，不得据此修改任何生产代码。因此「20 个修饰器」只是**夹具构建期**的数量不变量，本计划**不对读档后的修饰器数量做任何断言**（零断言）。
- **既有测试为何没覆盖：** `hero/saveLoad.test.ts` 与 `hero/state.test.ts` 只断言装备映射/槽位与 `attachAttribute` 自身的引用替换，从未断言「读档后装备加成仍留在最终属性里」。本条不是 skip 用例产生的新缺口，而是既有覆盖盲区。

## D-44 Quality Gate Results

| 阶段 | 提交 | `eslint --fix` | `eslint <改动文件>` | `vue-tsc`（按文件路径过滤） | `pnpm test:perf` | `pnpm test:ci` |
| --- | --- | --- | --- | --- | --- | --- |
| 1（构件级） | `63485e9` | exit 0 | 0 错误（1 warn：`no-console`） | `saveablesReal.perf.ts` 命中 0 条 | 5 文件 / **21 passed** / 21 行表 / 0 warn+error code | 66 文件 / 680 passed / 1 skipped |
| 2（组合级） | `4476e19` | exit 0 | 0 错误（1 warn：`no-console`） | 命中 0 条 | 5 文件 / **27 passed** / 27 行表 / 0 warn+error code | 66 文件 / 680 passed / 1 skipped |
| 3（完整级） | `a44c5d8` | exit 0 | 0 错误（1 warn：`no-console`） | 命中 0 条 | 5 文件 / **45 passed** / **45 行表** / 0 warn+error code | 66 文件 / **680 passed** / **1 skipped** |

- `pnpm exec vue-tsc --noEmit` 全仓共 27 条既有错误，全部位于 `packages-user/client-modules`（5 文件）、`packages-user/legacy-plugin-data`、`packages/legacy-ui` —— D-44 明确排除范围；按 `saveablesReal.perf.ts` 过滤命中 **0** 条。
- `pnpm exec vitest list --filesOnly`（默认配置）输出中 `.perf.ts` 匹配数为 **0**（共 66 个测试文件），证明 `test:ci` 通道未被污染；`test`/`test:ci` 脚本、`vitest.perf.config.ts`、`package.json`、`vite.config.ts`、`tsconfig*.json` 与 06-16 的 `saveables.perf.ts` **一字未改**。
- **`test:ci` 基线对照：** 66 文件 / 680 passed / 1 skipped（阶段 1、2、3 各复核一次，均一致）。
- `git status` 最终仅含本计划的产物：夹具（新增）、perf 文件（新增）、本 SUMMARY、`06-TEST-FINDINGS.md` 的 `#06-17-1` 与 `WINDOWS.md` 的 deviation 条目；根 `floors.json` 原为未跟踪文件，其删除不出现在提交 diff 中；无生产/核心源码改动、无配置改动、无新依赖、无基线 JSON 落盘、无临时探针残留。

## Task Commits

Each task was committed atomically:

1. **阶段 1（构件级）：真实地图夹具 + 单张地图 × NoCompression 三行** - `63485e9` (test)
2. **阶段 2（组合级）：固定真实侧负载 + 地图数量 1/5/13（9 行）** - `4476e19` (test)
3. **阶段 3（完整级）：补 Low/High 压缩跑满 27 行** - `a44c5d8` (test)

**Plan metadata:** （本次提交，含本 SUMMARY + `06-TEST-FINDINGS.md` + `WINDOWS.md`）(docs)

## Files Created/Modified

- `packages-user/data-state/test/fixtures/floors.json`（新增，17,292 字节、CRLF、13 个 13×13 条目）—— 由仓库根 `floors.json` 原样移入（SHA256 前后一致：`93BD1087…83967E`），根副本已删除；仅作为测试夹具使用，无脚本引用
- `packages-user/data-state/test/saveablesReal.perf.ts`（新增，452 行）—— `vi.hoisted` stub + 静态 JSON 导入 + 内联 `IFloorEntry`/`IFloorDataset`/`FLOOR_DATA`/`TILE_CODES`/`toFlat`/`clearCodes`/`registerTiles`/`createItemRaw`/`registerItem`/`createEnemy`/`recordReplayStep`/`seedSideLoad`/`createRealMapFixture`/`measureCase` + 27 个 `it` + `afterAll(console.table)`
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md`（追加 `## #06-17` 小节与 `#06-17-1` 行）
- `.planning/WINDOWS.md`（追加 entry #28：阶段 1 装备实例 deviation）
- `floors.json`（仓库根，删除；原为未跟踪文件）

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] 阶段 1 必须补最小装备实例，否则 `CoreState.loadState` 必然报 `[ERROR Code 58]`**

- **Found during:** Task 1（阶段 1）的首次 `pnpm test:perf`
- **Issue:** 计划要求阶段 1「不做任何侧负载（flags / 勇士 / 装备 / 道具 / 录像 / 怪物全部留空）」，但 `CoreState.loadState` 必然加载 `@system/hero`，而 `HeroEquipsStore.loadState`（`equipStore.ts:282-286`）在存档装备列表为空时 `logger.error(58)`。实测 3 次预热 + 20 次采样各触发一次，`[ERROR Code 58]` 共出现 46 次，与同计划 `execution_rules`「运行输出里出现 `[WARNING Code` / `[ERROR Code` 即说明夹具有问题——**调整夹具，不要放宽**」和阶段 1 `<verify><automated>`「输出中不出现 `[ERROR Code`」直接冲突（计划 `key_links` L46 也已写明「固定侧负载必须始终至少含 1 件装备实例」）。
- **Fix:** 按「调整夹具、不放宽告警」的原则，在阶段 1 夹具中注册并添加 **1 件**装备实例（`createItemRaw` + `registerItem` + `hero.items.equipment.add`），保持「只测地图链路」的意图不变；阶段 2 该处被完整的 `seedSideLoad`（4 件实例）取代。未放宽任何告警、未改规模、未改超时。
- **Files modified:** `packages-user/data-state/test/saveablesReal.perf.ts`
- **Verification:** 阶段 1 之后所有 `pnpm test:perf` 运行 `[WARNING Code` / `[ERROR Code` 计数均为 **0**；`pnpm test:ci` 全绿。
- **Committed in:** `63485e9`（并在 `4476e19` 被完整侧负载取代）
- **Ledger:** `WINDOWS.md` entry **#28**（kind: `deviation`, status: `open`）

**2. [Rule 1 - Bug] `IFloorDataset.datasetId` 类型写错导致 `TS2322`**

- **Found during:** Task 1（阶段 1）的 D-44 `vue-tsc` 门禁
- **Issue:** 数据集文件里的 `datasetId` 是**数字**（`741343341178`），内联接口先写成了 `readonly datasetId: string`，`const dataset: IFloorDataset = floorDataset` 报
  `error TS2322: Type '{ datasetId: number; data: { … }; … }' is not assignable to type 'IFloorDataset'`（`saveablesReal.perf.ts(78,7)`）。
- **Fix:** 把 `datasetId` 改为 `readonly datasetId: number`（不引入任何 `as` 断言）。
- **Files modified:** `packages-user/data-state/test/saveablesReal.perf.ts`
- **Verification:** 按路径过滤 `saveablesReal.perf.ts` 命中 **0** 条；全仓既有错误由 28 条（含本文件 1 条）降为 27 条。
- **Committed in:** `63485e9`

**3. [Rule 2 - D-06 产物] 追加 `06-TEST-FINDINGS.md` 的 `#06-17-1` 与 `WINDOWS.md` 的 deviation 条目**

- **Found during:** Task 3（阶段 3）的 SUMMARY 汇总
- **Issue:** 计划（authoritative）要求执行者按代码阅读确认 `HeroState.loadState` / `HeroEquipment` 引用不一致后，按 D-06 追加 `06-TEST-FINDINGS.md` 条目并在 SUMMARY 中标注；执行期用一次性临时探针**实测确认**（三档压缩 `atk` 5 → 0），故须登记。
- **Fix:** 追加 `## #06-17` 小节 + `#06-17-1` 行（现象 / 最小复现 / 疑似原因 / 影响面 / 建议方向 / 关联 skip 用例 / 严重度 = 高），并把阶段 1 的装备实例 deviation 登记为 `WINDOWS.md` #28。**不改任何生产代码**。
- **Files modified:** `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md`、`.planning/WINDOWS.md`
- **Verification:** 两个文件均为规划产物、不参与任何测试收集；`pnpm test:ci` 与 `pnpm test:perf` 结果不受影响。
- **Committed in:** 本计划的 metadata 提交

---

**Total deviations:** 3 auto-fixed（1 处夹具调整 + 1 处类型修正 + 1 处 D-06 产物），范围仅限新建的 perf 文件与本计划的规划产物。
**Impact on plan:** 两处代码内修正是「让阶段 1 满足自身 `verify`、让新文件通过 D-44 类型门禁」的必需修正，无范围蔓延、无接口变更、无行为弱化、无告警放宽。

## Issues Encountered

- **运行期告警/错误码：0 次。** 三个阶段的 `pnpm test:perf` 运行中 `[WARNING Code` / `[ERROR Code` 出现次数均为 0（阶段 1 首次运行出现的 `error 58` 已按 deviation 1 调整夹具消除，未进入任何提交）。因此**没有**由运行期告警触发的 `#06-17-N`；`06-TEST-FINDINGS.md` 的 `#06-17-1` 是按计划「实现风险」条目经实测确认后登记的（非告警触发）。
- **子进程中文 stdout 在 PowerShell 下显示为乱码**（06-16 已记录同一现象）：`console.table` 的中文 `case` 列在终端里显示异常，但**数值列与顺序不受影响**；本 SUMMARY 的 27 行按 `it` 的确定性声明顺序（地图数量 → 压缩档 → 存档/读档/往返）逐行对齐，且 27 条 `scale` 与预期序列完全一致。
- **无阻断性问题**：未出现 `testTimeout` 失败、未出现 `warn 123/124`/`error 55`、未出现 `.perf.ts` 被 `test:ci` 收集。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **真实地图性能数据已固定**：27 行数值表可直接作为后续地图层/存档层优化的对比基线（**未落盘为基线 JSON**，对比需人工取用本表数字）。
- **通道零变化且可扩展**：新增 `*.perf.ts` 仍被 `vitest.perf.config.ts` 自动收集；`pnpm test:ci` 的语义、收集文件数与结果与基线一字不变。
- **待用户裁决（重要）**：`#06-17-1`（读档丢失装备加成）严重度为**高**，属真实玩家可见缺陷；本计划按 D-05/D-07 只报告不修复。建议在 Phase 6 收口前决定是否单独立项修复，并补一条「读档后最终属性仍含装备加成」的回归用例。
- **规模可安全放大**：本夹具下地图数量从 1 到 13 仅让最慢 case 到 `0.881ms`（p95 `2.356ms`），离 `testTimeout` 有三个数量级余量；若后续要测更大规模或更多压缩组合，无需担心超时。

---

*Phase: 06-unit-tests*
*Completed: 2026-09-16*

## Self-Check: PASSED

- FOUND: `packages-user/data-state/test/fixtures/floors.json`（17,292 字节，与根副本 SHA256 一致）
- FOUND: `packages-user/data-state/test/saveablesReal.perf.ts`
- FOUND: `.planning/phases/06-unit-tests/06-17-SUMMARY.md`
- DELETED: `floors.json`（仓库根）
- FOUND: commit `63485e9`（阶段 1）
- FOUND: commit `4476e19`（阶段 2）
- FOUND: commit `a44c5d8`（阶段 3）
- VERIFIED: `pnpm test:perf` 5 文件 / 45 passed / 0 warn+error code
- VERIFIED: `pnpm test:ci` 66 文件 / 680 passed / 1 skipped（与基线一致）
- VERIFIED: 默认配置 `vitest list --filesOnly` 中 `.perf.ts` 匹配数为 0
- VERIFIED: 全文件 0 个断言调用、无 `it.skip`/`it.todo`、无 fake timers
