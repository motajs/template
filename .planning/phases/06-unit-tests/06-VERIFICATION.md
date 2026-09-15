---
phase: 06-unit-tests
verified: 2026-09-15T04:15:43Z
status: gaps_found
score: 11/15 must-haves verified
covered_files:
  - .planning/ROADMAP.md
  - .planning/REQUIREMENTS.md
  - .planning/phases/06-unit-tests/06-01-PLAN.md
  - .planning/phases/06-unit-tests/06-01-SUMMARY-superseded.md
  - .planning/phases/06-unit-tests/06-01-SUMMARY.md
  - .planning/phases/06-unit-tests/06-02-PLAN.md
  - .planning/phases/06-unit-tests/06-02-SUMMARY-superseded.md
  - .planning/phases/06-unit-tests/06-02-SUMMARY.md
  - .planning/phases/06-unit-tests/06-03-PLAN.md
  - .planning/phases/06-unit-tests/06-03-SUMMARY.md
  - .planning/phases/06-unit-tests/06-04-PLAN.md
  - .planning/phases/06-unit-tests/06-04-SUMMARY.md
  - .planning/phases/06-unit-tests/06-05-PLAN.md
  - .planning/phases/06-unit-tests/06-05-SUMMARY.md
  - .planning/phases/06-unit-tests/06-06-PLAN.md
  - .planning/phases/06-unit-tests/06-06-SUMMARY.md
  - .planning/phases/06-unit-tests/06-07-PLAN.md
  - .planning/phases/06-unit-tests/06-07-SUMMARY.md
  - .planning/phases/06-unit-tests/06-08-PLAN.md
  - .planning/phases/06-unit-tests/06-08-SUMMARY.md
  - .planning/phases/06-unit-tests/06-09-PLAN.md
  - .planning/phases/06-unit-tests/06-09-SUMMARY.md
  - .planning/phases/06-unit-tests/06-10-PLAN.md
  - .planning/phases/06-unit-tests/06-10-SUMMARY.md
  - .planning/phases/06-unit-tests/06-11-PLAN.md
  - .planning/phases/06-unit-tests/06-11-SUMMARY.md
  - .planning/phases/06-unit-tests/06-12-PLAN.md
  - .planning/phases/06-unit-tests/06-12-SUMMARY.md
  - .planning/phases/06-unit-tests/06-13-PLAN.md
  - .planning/phases/06-unit-tests/06-13-SUMMARY.md
  - .planning/phases/06-unit-tests/06-14-PLAN.md
  - .planning/phases/06-unit-tests/06-14-SUMMARY.md
  - .planning/phases/06-unit-tests/06-CONTEXT.md
  - .planning/phases/06-unit-tests/06-COVERAGE-GAPS.md
  - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md
  - .planning/phases/06-unit-tests/06-DISCUSSION-LOG.md
  - .planning/phases/06-unit-tests/06-PATTERNS.md
  - .planning/phases/06-unit-tests/06-SAVE-EXCLUSIONS.md
  - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md
  - .planning/phases/06-unit-tests/COVERAGE.md
  - packages-user/data-base/src/enemy/enemy.test.ts
  - packages-user/data-base/src/enemy/manager.test.ts
  - packages-user/data-base/src/enemy/saveLoad.test.ts
  - packages-user/data-base/src/enemy/special.test.ts
  - packages-user/data-base/src/flag/saveLoad.test.ts
  - packages-user/data-base/src/flag/system.test.ts
  - packages-user/data-base/src/hero/attribute.test.ts
  - packages-user/data-base/src/hero/equipment.test.ts
  - packages-user/data-base/src/hero/equipStore.test.ts
  - packages-user/data-base/src/hero/follower.test.ts
  - packages-user/data-base/src/hero/items.test.ts
  - packages-user/data-base/src/hero/location.test.ts
  - packages-user/data-base/src/hero/modifier.test.ts
  - packages-user/data-base/src/hero/mover.test.ts
  - packages-user/data-base/src/hero/rendering.test.ts
  - packages-user/data-base/src/hero/saveLoad.test.ts
  - packages-user/data-base/src/hero/state.test.ts
  - packages-user/data-base/src/map/dynamicTile.test.ts
  - packages-user/data-base/src/map/eventView.test.ts
  - packages-user/data-base/src/map/gameMap.test.ts
  - packages-user/data-base/src/map/mapLayer.test.ts
  - packages-user/data-base/src/map/mapState.test.ts
  - packages-user/data-base/src/map/mover.test.ts
  - packages-user/data-base/src/map/saveLoad.test.ts
  - packages-user/data-base/src/map/staticTile.test.ts
  - packages-user/data-base/src/map/tile.test.ts
  - packages-user/data-common/src/common/face.test.ts
  - packages-user/data-common/src/common/faceManager.test.ts
  - packages-user/data-common/src/common/indexer.test.ts
  - packages-user/data-common/src/common/mover.test.ts
  - packages-user/data-common/src/common/utils.test.ts
  - packages-user/data-common/src/replay/array.test.ts
  - packages-user/data-common/src/replay/func.test.ts
  - packages-user/data-common/src/replay/sandbox.test.ts
  - packages-user/data-common/src/replay/saveLoad.test.ts
  - packages-user/data-common/src/replay/system.test.ts
  - packages-user/data-state/src/enemy/aura.test.ts
  - packages-user/data-state/src/enemy/calculator.test.ts
  - packages-user/data-state/src/enemy/comparer.test.ts
  - packages-user/data-state/src/enemy/final.test.ts
  - packages-user/data-state/src/enemy/mapDamage.test.ts
  - packages-user/data-state/src/enemy/special.test.ts
  - packages-user/data-state/src/replay/commands.test.ts
  - packages-user/data-state/test/enemyCombination.test.ts
  - packages-user/data-state/test/replayPlayback.test.ts
  - packages-user/data-state/test/saveablesRoundTrip.test.ts
  - packages-user/data-system/src/combat/combat.test.ts
  - packages-user/data-system/src/combat/context.test.ts
  - packages-user/data-system/src/combat/damage.test.ts
  - packages-user/data-system/src/combat/mapDamage.test.ts
covered_digest: "v1:sha256:aece51a8b817cdd58f8f079e906b9324bb3e01f540bc21f960923f7c0f54c23d"
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "阶段目标「为核心系统（数据层等）补齐单元测试」/ TEST-01 的完整广度：渲染端等**非数据端**核心系统有单元测试覆盖"
    status: failed
    reason: "本阶段实际只交付了数据端切片。仓库 66 个测试文件全部位于 packages-user/{data-common,data-base,data-system,data-state}，packages/render、packages/render-vue、packages/client、packages/client-base、packages/system、packages/animate、packages/audio、packages/loader、packages/legacy-*，以及 packages-user/{client-base,client-modules,entry-client,legacy-plugin-client,legacy-plugin-data,data-fallback,entry-data} 与 src/ 下**零个**测试文件。06-CONTEXT.md 已明确把「渲染 / legacy 相关覆盖」延后，但 ROADMAP 中 Phase 6 是最后一个阶段，其后无任何阶段承接该覆盖，故该缺口无法被后续阶段吸收。"
    artifacts:
      - path: "packages/render/"
        issue: "零测试文件；渲染端核心渲染逻辑无单元测试"
      - path: "packages/render-vue/"
        issue: "零测试文件；Vue 渲染适配层无单元测试"
      - path: "packages/system/"
        issue: "零测试文件"
      - path: "packages-user/client-modules/"
        issue: "零测试文件；且是 vue-tsc 既有 28 条类型错误的来源之一（D-44 排除范围，从未被验证）"
      - path: "packages-user/legacy-plugin-data/"
        issue: "零测试文件；legacy 覆盖未做"
    missing:
      - "渲染端（packages/render、packages/render-vue、packages/client、packages/system 等）行为单元测试"
      - "legacy 侧（packages/legacy-*、packages-user/legacy-plugin-*）覆盖，或一份经用户确认的『legacy 不测』书面排除清单"
      - "明确 Phase 6 的收尾方式：补齐渲染端覆盖，或把该缺口拆分为 ROADMAP 新阶段（当前 ROADMAP 无承接阶段）"
  - truth: "接口全覆盖：除名称含 legacy 的接口/方法外，每个公开方法至少一条正常用例（06-CONTEXT D-27 / D-30，全部 14 个计划共享的 must_have）"
    status: failed
    reason: "`EnemyContext.deleteAura` 是 `IEnemyContext` 的公开接口方法（接口声明 `packages-user/data-system/src/combat/types.ts:689`，实现 `packages-user/data-system/src/combat/context.ts:347`），且被 06-01-PLAN must_haves.truths 逐字点名（『`addAura`/`deleteAura`』）。全仓库检索 `deleteAura` 仅命中上述两个生产文件，**没有任何测试引用**。同一清单中的 `addAura`（12 处）、`resize`/`clear`/`destroy`、`attachDamageSystem`/`attachMapDamage`、`getBindedHero`/`getDamageSystem`/`getMapDamage`、全部 `register*/unregister*` 与 `getEnemyByLoc*`/`getViewByComputed` 均已覆盖，仅 `deleteAura` 一条缺失。"
    artifacts:
      - path: "packages-user/data-system/src/combat/context.test.ts"
        issue: "缺少 `EnemyContext.deleteAura` 的正常用例（删除已注册光环后其效果不再生效）"
    missing:
      - "为 `EnemyContext.deleteAura` 补一条正常用例（registerAuraConverter→setEnemyAt→addAura→buildup 生效→deleteAura→buildup 后加成消失），并同步 06-COVERAGE-MAP.md 06-01 小节"
  - truth: "疑似缺陷记录与实际代码中的 `it.skip` 锚点一一对应，无失实条目（06-CONTEXT D-05/D-06；全部计划共享的 must_have）"
    status: failed
    reason: "06-TEST-FINDINGS.md `#06-09-4`（`replay/array.ts` `ReplayArray.saveState`/`loadState` 不恢复 length）登记的关联 skip 为 `replay/saveLoad.test.ts` `restores the recorded length on the same instance`，该用例**已不存在**：用户提交 `c08f3f8`（fix(replay): enable recording guard; update tests for replay refactor）从 `replay/saveLoad.test.ts` 删除了整个 `ReplayArray save and load round trips` describe 块（含该 `it.skip` 与其配套的跑绿用例），但未同步更新 `06-TEST-FINDINGS.md` / `06-COVERAGE-MAP.md` / `06-09-SUMMARY.md`。因此 06-09-SUMMARY 的 `D2 ... replay/saveLoad.test.ts#all status: pass` 与『ReplayArray/ReplaySystem 同实例往返』不再成立。补充事实：`ReplayArray` 生产类现**已无** `saveState`/`loadState`（`array.ts` 检索 0 命中，`class ReplayArray implements IReplayArray`），故该 must_have 项已变为空悬，`06-COVERAGE-MAP.md` 06-07 小节『`ReplayArray` 不可存档（无 saveState/loadState），已由用例断言』的表述与现状一致。"
    artifacts:
      - path: ".planning/phases/06-unit-tests/06-TEST-FINDINGS.md"
        issue: "`#06-09-4` 条目失实：关联 skip 用例已被 commit c08f3f8 删除"
      - path: ".planning/phases/06-unit-tests/06-09-SUMMARY.md"
        issue: "D2 coverage 声称覆盖 `ReplayArray` 存读档并把该文件标为 pass，与磁盘现状不符"
      - path: ".planning/phases/06-unit-tests/06-COVERAGE-MAP.md"
        issue: "06-09 小节按『所有 saveState/loadState 类』表述，未记录 ReplayArray 已移除存读档接口"
    missing:
      - "更新 06-TEST-FINDINGS.md `#06-09-4`（标注为已被用户重构废弃 / 或改为 ReplaySystem 语义）"
      - "更新 06-09-SUMMARY.md 与 06-COVERAGE-MAP.md 06-09 小节，明确 ReplayArray 现无存读档接口，不再属覆盖目标"
  - truth: "本阶段交付的测试覆盖的行为在运行时被验证（27 条 `it.skip` 对应的行为当前未被验证）"
    status: partial
    reason: "`pnpm test:ci` 27 skipped 全部是 D-05 授权的『正确预期』缺陷标记，覆盖 9 处生产缺陷（`#06-01-1..4`、`#06-03-1`、`#06-04-1..4`、`#06-05-1..3`、`#06-06-1`、`#06-07-1`、`#06-08-1`、`#06-09-1..5`，共 17 个 finding 条目）。协议本身符合 D-05/D-06（test:ci 全绿、逐条登记、锚点齐全），但这些行为**确实未被验证**，且 06-COVERAGE-GAPS.md 中三个缺口（`G-06-03-A`、`G-06-04-A`、`G-06-09-B` 的受阻塞档位）以同一原因挂起。严重度：中（生产缺陷未修复前不可关闭）。"
    artifacts:
      - path: "packages-user/data-common/src/replay/array.test.ts"
        issue: "7 条 skip（#06-04-1/-2/-3/-4 及 06-12/06-14 补充）"
      - path: "packages-user/data-base/src/hero/saveLoad.test.ts"
        issue: "6 条 skip（#06-09-1 ×4、#06-09-2 ×2）"
      - path: "packages-user/data-system/src/combat/context.test.ts"
        issue: "间接：`deleteAura` 未覆盖（见上一条 gap）"
      - path: "packages-user/data-system/src/combat/damage.test.ts"
        issue: "2 条 skip（#06-01-1、#06-01-4）"
      - path: "packages-user/data-base/src/enemy/manager.test.ts"
        issue: "2 条 skip（#06-03-1）"
      - path: "packages-user/data-base/src/hero/equipment.test.ts"
        issue: "2 条 skip（#06-05-2、#06-05-3 码 147 死码）"
      - path: "packages-user/data-base/src/map/mapLayer.test.ts"
        issue: "1 条 skip（#06-06-1）"
    missing:
      - "用户裁决是否为 `#06-01-1..4`、`#06-03-1`、`#06-04-1..4`、`#06-05-1..3`、`#06-06-1`、`#06-07-1`、`#06-08-1`、`#06-09-1..5` 开一个修复批次；修复后按 D-05 取消对应 skip 转为回归用例"
      - "码 147（`HeroEquipment` 不可达告警）需用户裁定：补齐触发语义，或在码表中标注保留未用并移除死分支"
---

# Phase 6: 单元测试 Verification Report

**Phase Goal:** 为核心系统（数据层等）补齐单元测试
**Verified:** 2026-09-15T04:15:43Z
**Status:** gaps_found — **Phase 6 未完成，不得视为通过**
**Re-verification:** No — initial verification（此前无 VERIFICATION.md）

> **范围声明（与本次验证请求一致）**：本轮验证只覆盖 **数据端（数据层）测试切片**。**渲染端单元测试尚未编写**，
> 属于本报告的显式 NOT-DONE 项（见 Truth #5 与 Gaps G-01）。Phase 6 **不得**标记 complete，
> 也不要运行/暗示 `phase.complete` 或 ROADMAP 收尾。

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | ROADMAP SC1：核心**数据层**系统有单元测试覆盖 | ✓ VERIFIED | 66 个测试文件中 50 个由本阶段提交（`git log --grep="06-" -- "*.test.ts"`），覆盖 `data-system/src/combat`、`data-state/src/enemy`（顶层）、`data-base/src/enemy`、`data-common/src/replay`、`data-base/src/hero`（含 `rendering`/异步 `mover`）、`data-base/src/map`、`data-base/src/flag`、`data-common/src/common`，全部文件存在且为 3KB–55KB 的实质测试 |
| 2 | ROADMAP SC2：覆盖关键行为（战斗伤害、触发器、寻路、事件等） | ✓ VERIFIED | 战斗伤害：`data-system/src/combat/damage.test.ts`（含 `{damage,turn}` 精确断言）、`data-state/test/enemyCombination.test.ts` 的最大流水线单怪 `{damage:3059,turn:37}`（已核对用例存在）。触发器/寻路/事件：`data-system/src/event/eventDispatch.test.ts`、`data-system/src/path/{graph,system,performance}.test.ts`、`data-state/src/event/event.test.ts` 存量存在且全绿（属 Phase 1–3 存量，非本阶段新增） |
| 3 | ROADMAP SC3：测试在本地可运行且全部通过（固定非 watch 命令 `pnpm test:ci`，D-08） | ✓ VERIFIED | 实跑 `pnpm test:ci` → exit 0：**Test Files 66 passed (66) / Tests 649 passed \| 27 skipped (676)** |
| 4 | ROADMAP SC4：测试由 AI 编写并运行，通过验证后可提交 | ✓ VERIFIED | 本阶段 73 个 `06-*` 提交；`git status --short` 为空（工作树干净） |
| 5 | 阶段目标「数据层**等**」+ TEST-01 完整广度：**渲染端等非数据端**核心系统有单测 | ✗ FAILED | `packages/render`、`packages/render-vue`、`packages/client`、`packages/system`、`packages/legacy-*`、`packages-user/client-modules`、`entry-client` 等**零**测试文件；全仓库 66 个测试文件 100% 位于 `packages-user/{data-*}` |
| 6 | 接口全覆盖：每公开方法 ≥1 正常用例，legacy 除外（D-27 / D-30） | ✗ FAILED | `EnemyContext.deleteAura`（`types.ts:689` 公开接口 / `context.ts:347` 实现）全仓库 0 测试引用；其余逐方法抽查（28 个生产文件 × 公开方法 × 全测试文本）仅此 1 条缺失（`addPrefabFromLegacy`=D-30 legacy 排除；`logCollection`=模块私有函数；`GameMap.onResize` 经 `resizeLayer`→`onResizeLayer` 钩子间接覆盖） |
| 7 | code 全覆盖：本阶段可达 warn/error 码各 ≥1 触发断言 + 产出 `06-COVERAGE-MAP.md`（D-31） | ✓ VERIFIED | 机器比对：9 个在范围内源码目录共 **77** 个 `logger.warn/error(<code>)` 码，`06-COVERAGE-MAP.md` 中 **77/77** 全部成行（缺 0）；覆盖表 132 个用例名，118 个逐字命中，13 个为 `mapState.test.ts` 的 `it.each(cases)` 表驱动（`name + code` 数据行已核对），1 个为小节散文；码 105/147 不可达已在表中显式标注 |
| 8 | 战斗系统深化 D-21..D-27（Full/Rect/Manhattan 三范围、嵌套光环、优先级边界、四阶段顺序与阶段间可见性、属性→伤害联动） | ✓ VERIFIED | `context.test.ts` 实测含 `FullRange`/`RectRange`/`ManhattanRange` 用例；四阶段顺序断言与最终属性/伤害断言存在（06-10 补测 `applies all four effect kinds together and asserts the final attributes`、`propagates a cross-enemy nested aura with observable range boundaries`）；`damage.test.ts` 含 `getDamageInfo`/`markDirty`/`deleteEnemy`/`with(hero)`/`markAllDirty`/`useCalculator`/`bindHeroStatus` 与临界点路径 |
| 9 | 存读档 D-42 / D-45：各含 `saveState`/`loadState` 类同实例往返 + `CoreState` 5 saveable × 3 压缩档 + 排除清单 | ✓ VERIFIED | `enemy/hero/map/replay/flag/saveLoad.test.ts` 与 `saveablesRoundTrip.test.ts` 存在；`saveablesRoundTrip.test.ts` 新增 `round-trips every registered saveable across all compressions`（每类 saveable 全关键状态逐一严格断言 + 录像 10 步多样化逐条 exact）；`06-SAVE-EXCLUSIONS.md`（93 行，逐类排除依据）存在。**Caveat（见 Gap G-03）**：`ReplayArray` 现无 `saveState`/`loadState`（被用户提交 `c08f3f8` 移除），原 must_have 项空悬，`#06-09-4` 记录失实 |
| 10 | 疑似缺陷 → 正确预期 `it.skip` + 登记 `06-TEST-FINDINGS.md` + `pnpm test:ci` 保持全绿（D-05/D-06） | ✓ VERIFIED | 27 条 `it.skip`（13 个文件）逐条带锚点；`it.todo`/`xit`/`xdescribe` 为 0；`06-TEST-FINDINGS.md` 含 `#06-01`..`#06-09` 共 17 条 finding；`git log 94ab2dd~1..HEAD` 证明补测批次仅改 `*.test.ts` 与规划产物 |
| 11 | 质量门禁 D-44：`eslint <改动文件>` 0 错误 + `vue-tsc`（按文件路径过滤）0 类型错误 + `pnpm test:ci` 全绿 | ? UNCERTAIN | `test:ci` ✓（Truth #3）；`vue-tsc` ✓（实跑 28 行错误全部落在 `client-modules`/`legacy-plugin-data`/`legacy-ui`，**0 行**落在 `*.test.ts`）；`eslint` ✗：`npx eslint packages-user/data-state/src/enemy/comparer.test.ts packages-user/data-state/src/enemy/special.test.ts` → **323 errors**（全为 `prettier/prettier` 的 `Insert ␍`）。判定不确定的原因见 WARNING W-01 |
| 12 | 不创建或修改任何生产/核心源码（全部计划 prohibitions；补测批次 D-46 尤甚） | ✓ VERIFIED | `git log --name-only 94ab2dd~1..HEAD` 仅出现 `*.test.ts`、`06-COVERAGE-MAP.md`、`06-TEST-FINDINGS.md`、PLAN/SUMMARY/ROADMAP/STATE 等规划产物；0 个生产源码路径 |
| 13 | 不使用 `vi.useFakeTimers()`、不引入 `fake-indexeddb`、不安装覆盖率工具（D-04/D-09/D-10） | ✓ VERIFIED | 全 66 个测试文件 grep：`useFakeTimers` 0 命中、`fake-indexeddb` 0 命中；`package.json` 无 `@vitest/coverage-*` 依赖，`test:ci` = `vitest run` |
| 14 | 补测批次 D-46 补齐指定缺口（G-06-01-A/B/C、G-06-05-A、G-06-06-A/B/C、G-06-07-A、G-06-09-A/B；受阻塞缺口以正确预期 skip） | ✓ VERIFIED | 逐条用例实存（13 个补测用例名全部在磁盘命中）：06-10 三缺口（含 `stacks two sourced damages at the same point` 等 3 条 mapDamage + 2 条 context + 2 条 enemyCombination）；06-11 四缺口（`merges the final attributes of two equipped slots`、`generates and reads content on a map created by createMap`、`keeps layers of different z-index coexisting with independent data`、`keeps/drops the moved dynamic events across a full static round trip`）；06-12/06-14 录像读流（`reads a heterogeneous route exclusively through a read stream` 仅经文法 `createReadStream`、无 `array.get`，与声明一致）；06-13 存档全关键状态与三档 |
| 15 | findings 记录与代码中 `it.skip` 锚点一一对应，无失实条目 | ✗ FAILED | `06-TEST-FINDINGS.md` `#06-09-4` 的关联 skip（`replay/saveLoad.test.ts` `restores the recorded length on the same instance`）在磁盘/历史之外——已被用户提交 `c08f3f8` 删除该 describe 块；已删除的还有同块的跑绿用例 `restores the command width and reads back the first step on the same instance` |

**Score:** 11/15 truths verified（3 FAILED、1 UNCERTAIN、0 present-but-behavior-unverified）

### Required Artifacts

三个层级（存在 / 实质 / 接线）全部核对；无 MISSING、无 STUB、无 ORPHANED。

| Artifact（按计划分组） | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages-user/data-system/src/combat/{combat,context,damage,mapDamage}.test.ts` | 06-01 战斗系统层（含 D-27 全接口/全码） | ✓ VERIFIED | 4 文件，17–55KB，实质；2026-09-14 提交 `59b709e`/`484da2d`/`6c8f85a` |
| `packages-user/data-state/src/enemy/{calculator,comparer,final,aura,special,mapDamage}.test.ts` | 06-02 顶层基础功能 + 码 137 | ✓ VERIFIED | 6 文件；`aura.test.ts` 覆盖三范围与转换器（`FullRange`/`RectRange`/`ManhattanRange` 实存） |
| `packages-user/data-base/src/enemy/{enemy,special,manager,saveLoad}.test.ts` | 06-03 数据模型 + 06-09 存读档（53/96/117/118/119/120） | ✓ VERIFIED | 4 文件，7–17KB |
| `packages-user/data-common/src/replay/{array,func,sandbox,system,saveLoad}.test.ts` | 06-04 录像 + 06-09 存读档（148–163/175） | ✓ VERIFIED（含 Caveat） | `array.test.ts` 28KB；`saveLoad.test.ts` 仅 66 行、只覆盖 `ReplaySystem`（见 Gap G-03） |
| `packages-user/data-base/src/hero/*.test.ts`（11 文件） | 06-05 全部子系统（attribute/equipment/equipStore/follower/items/location/modifier/mover/rendering/state + 06-09 saveLoad） | ✓ VERIFIED | `saveLoad.test.ts` 23KB，含三档循环与容器覆盖 |
| `packages-user/data-base/src/map/*.test.ts`（10 文件） | 06-06 全地图接口 + 06-09 存读档（55/122/124） | ✓ VERIFIED | `mapLayer.test.ts` 25KB |
| `packages-user/data-base/src/flag/{system,saveLoad}.test.ts`、`packages-user/data-common/src/common/{utils,indexer,faceManager,face,mover}.test.ts` | 06-08 flag 全接口 + common（43/44/111） | ✓ VERIFIED | 7 文件 |
| `packages-user/data-state/test/{enemyCombination,replayPlayback,saveablesRoundTrip}.test.ts` | 06-07/06-09/06-10 顶层集成（176/2001–2008/112/113/177/178 + 最大流水线） | ✓ VERIFIED | 18KB/14KB/28KB |
| `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` | 阶段级 code→模块→用例 映射（D-31） | ✓ VERIFIED | 354 行；77/77 可达码齐全；含 06-10..06-14 补测小节 |
| `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` | 共享问题记录（D-06） | ⚠️ PARTIAL | 238 行、17 条 finding；`#06-09-4` 失实（Gap G-03） |
| `.planning/phases/06-unit-tests/06-SAVE-EXCLUSIONS.md` | 存读档排除清单（D-42） | ✓ VERIFIED | 93 行，含通用 + 逐类排除 |
| `packages-user/data-base/src/map/eventView.test.ts`、`packages-user/data-state/src/replay/commands.test.ts` | 存量文件、被本阶段提交触及 | ✓ VERIFIED | 属 50 个「本阶段触及的测试文件」集合 |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| 50 个测试文件 | 真实生产模块 | `@user/*` / `@motajs/common` barrel 与同目录模块导入 | ✓ WIRED | 测试驱动真实实现；仅按 D-01/D-21 注入 fake **协作者**（`IAuraConverter`/`IAuraView`/`IDamageCalculator`/fake `IDataCommon`），不 mock 被测数据层接口本身 |
| 06-01 覆盖率判据 | `EnemyContext` 每个公开方法 | context.test.ts 调用 | ✗ NOT_WIRED | `deleteAura` 0 引用（Gap G-02） |
| `06-COVERAGE-MAP.md` code 行 | 各码的触发用例 | 用例名 ↔ 测试文件 | ✓ WIRED | 77/77 可达码成行；132 用例名核对通过 |
| `06-TEST-FINDINGS.md` `#06-01..` 锚点 | 27 条 `it.skip` | 用例名 | ✓ WIRED（26/27） | `#06-09-4` 例外（Gap G-03） |
| `CoreState.saveState/loadState`（公开入口，D-45） | `@system/{hero,flags,maps,enemy,replay}` 5 saveable | `saveablesRoundTrip.test.ts` 三档往返 | ✓ WIRED | 每 saveable 关键状态逐一断言；录像 10 步逐条 exact |
| `package.json` `test:ci` | `vitest run`（非 watch） | 实跑 | ✓ WIRED | 66/649/27，exit 0 |

### Data-Flow Trace (Level 4)

测试类阶段的「数据流」= 断言值是否来自真实被测实现（而非自证/循环）。

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `combat/context.test.ts` | 计算后怪物 atk/def/hp/special | 真实 `EnemyContext.buildup`（fake 的**输入**转换器） | Yes | ✓ FLOWING |
| `combat/damage.test.ts` | `{damage,turn}` | 真实 `DamageContext`/`DamageSystem` | Yes | ✓ FLOWING |
| `enemyCombination.test.ts` | `{damage:3059,turn:37}` | 真实 `CoreState` + `MainDamageCalculator` | Yes | ✓ FLOWING（精确值断言，非 `toBeDefined`） |
| `replay/array.test.ts` | 逐参数 `typeof`+值、`index` 递进、末尾 `null` | 真实 `ReplayArray.createReadStream` | Yes | ✓ FLOWING（`expectParamTyped`/`expectStepTyped` 已核对实现） |
| `saveablesRoundTrip.test.ts` | 5 saveable 关键字段 | 真实 `CoreState.saveState/loadState` | Yes | ✓ FLOWING |
| `replay/saveLoad.test.ts`（`ReplayArray` 链） | —— | `ReplayArray.saveState/loadState` **已不存在** | No | ✗ DISCONNECTED（must_have 空悬，见 G-03；`ReplaySystem` 链正常） |

**循环测试检测：** 无。全部测试文件 grep `writeFileSync|writeFile|fs.write|openSync(` → 0 命中；仓库内无 `*capture*`/`*baseline*`/`*generate*` 期望值生成脚本。期望值均为手写合成 fixture 常量（D-02）。

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| 全套件门禁全绿 | `pnpm test:ci` | `Test Files 66 passed (66)` / `Tests 649 passed \| 27 skipped (676)`，exit 0 | ✓ PASS |
| 跳过项数量与代表含义 | 逐文件 grep `it.skip\|it.todo` | 27 条（13 文件），全部为「正确预期」缺陷标记；`it.todo`=0 | ✓ PASS |
| 本阶段改动文件类型级门禁 | `pnpm exec vue-tsc --noEmit` | 28 行错误，0 行落在 `*.test.ts`（全部为 `client-modules`/`legacy-plugin-data`/`legacy-ui`，D-44 显式排除） | ✓ PASS |
| 本阶段改动文件 eslint 门禁 | `npx eslint <50 个文件>` | **323 errors**，集中于 `data-state/src/enemy/comparer.test.ts`、`special.test.ts`（`Insert ␍`） | ✗ FAIL |
| 禁用 API 扫描 | grep `useFakeTimers` / `fake-indexeddb` | 0 / 0 命中 | ✓ PASS |
| 债务标记门禁 | grep `TBD\|FIXME\|XXX` on 50 文件 | 0 命中 | ✓ PASS |
| 接口覆盖缺口 | grep `deleteAura`（全仓库，非 node_modules） | 仅 `types.ts:689`、`context.ts:347`（生产），测试 0 命中 | ✗ FAIL |

### Probe Execution

N/A — 本阶段未声明任何 probe，仓库内不存在 `scripts/**/tests/probe-*.sh`（`scripts/` 目录亦不存在），PLAN/SUMMARY 中无 `probe-` 引用。

### Test Quality Audit

| Test File（代表） | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `data-system/src/combat/*.test.ts` | TEST-01 | 大量 | 4 | No | Value / Behavioral | OK（4 条 skip 为 `#06-01-N`） |
| `data-state/src/enemy/*.test.ts` | TEST-01 | 大量 | 0 | No | Value | OK |
| `data-state/test/enemyCombination.test.ts` | TEST-01 | 24+ | 0 | No | Value（精确 `{3059,37}`） | OK |
| `data-common/src/replay/array.test.ts` | TEST-01 | 大量 | 7 | No | Value + Type（逐参数 typeof） | OK（7 条 skip 锚定 `#06-04-N`） |
| `data-base/src/hero/saveLoad.test.ts` | TEST-01 | 14+ | 6 | No | Value（三档循环） | OK（6 条 skip 锚定 `#06-09-1/-2`） |
| `data-state/test/saveablesRoundTrip.test.ts` | TEST-01 | 8 | 1 | No | Value（10 步逐条 exact） | OK（1 条 skip 锚定 `#06-09-5`） |
| `data-base/src/map/mapState.test.ts` | TEST-01 | 表驱动 | 0 | No | Value + Status（code 断言） | OK |

- **Disabled tests on requirements:** 27 条，均非「某需求唯一证明」。TEST-01 由 **649 条跑绿用例**证明，故按 verifier 规则为 ⚠️ WARNING（非 BLOCKER）。逐条 skip 对应的**具体生产行为**确实未被验证（Gap G-04）。
- **Circular patterns detected:** 0。
- **Insufficient assertions:** 0（抽查为值级/行为级精确断言）。

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts.（`verification` 决策覆盖门禁：**45/45 honored，0 not_honored，non-blocking**）

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| TEST-01 | 06-01..06-14（全部 14 个 PLAN 的 `requirements`） | 为核心系统（**数据层等**）补齐单元测试 | ⚠️ **PARTIAL / 不满足完整范围** | 数据层部分 **满足**且 `pnpm test:ci` 全绿；**渲染端/legacy 等非数据端部分未交付**（Truth #5）。**注意：`REQUIREMENTS.md` 第 37 行已把 TEST-01 标为 `[x]`、Traceability 第 65 行标为 `Complete`——该勾选早于本验证，属过早完成声明，应以本报告为准回退或补充范围说明** |
| （ORPHANED） | — | 无：Phase 6 在 REQUIREMENTS.md 中只映射 TEST-01，且 14 个 PLAN 全部声明该 ID | — | 无孤立需求 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `packages-user/data-state/src/enemy/comparer.test.ts`、`special.test.ts` | 全文 | `prettier/prettier` `Insert ␍`（工作树 LF ↔ `.prettierrc endOfLine: crlf` 不一致） | ⚠️ WARNING | 见 W-01：`eslint <改动文件>` 323 errors，D-44(a) 在本工作树不可复现通过；**很可能是 EOL/环境产物**而非提交内容缺陷 |
| `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` | 130（`#06-09-4`） | 记录指向不存在的 skip 用例 | ⚠️ WARNING | findings 记录失实（Truth #15 FAILED，Gap G-03） |
| 27 × `it.skip`（13 文件） | 各处 | 禁用用例 | ℹ️ Info | D-05 **授权**的正确预期缺陷标记，协议合规；对应 17 个 `#06-NN-N` finding |
| 50 文件 | 各处 | `() => {}` 空实现 | ℹ️ Info | 全为 fixture 内的 fake 协作者（D-01/D-21）或 `vi.spyOn(...).mockImplementation(() => {})` 的 console/logger 抑制，非被测系统桩 |
| 50 文件 | — | `TBD`/`FIXME`/`XXX` | ✓ 无 | 债务标记门禁通过 |

#### W-01 详述（eslint / D-44(a) UNCERTAIN 的判定依据）

- **复现**：`npx eslint packages-user/data-state/src/enemy/comparer.test.ts packages-user/data-state/src/enemy/special.test.ts` → `323 problems (323 errors, 0 warnings)`，全部 `Insert ␍`。其余 48 个本阶段测试文件同批运行 **0 错误**。
- **为何不定为 BLOCKER**：`git ls-files --eol` 显示全部相关文件的**索引版本均为 `i/lf`**（含通过用例的文件），`core.autocrlf=true` 且 `.prettierrc` 要求 `crlf`，因此新检出时索引 LF 会被转换为工作树 CRLF；这 2 个文件当前是 `i/lf w/lf`（未被检出转换），其余是 `i/lf w/crlf`。即**提交内容与其余文件规范一致**，失败源于本工作树的 EOL 状态，`git checkout -- <两个文件>` 即可归位。
- **为何仍要报告**：D-44(c) 是硬门禁且与 06-02 的交付文件精确重合；`06-02-SUMMARY.md` **完全未记录** eslint/vue-tsc 门禁结果（与其 `must_haves.truths` 中的「质量门禁（D-44）」要求不符），因此该 gate 在本阶段缺少可审计证据。建议：归一化这两个文件的 EOL，并在 06-02 的收尾产物中补记门禁结果。

## Human Decision Required（Escalation Gate）

以下 3 项自动化无法裁决，需用户拍板（**不**改变 `status: gaps_found`，也不阻塞本报告归档）：

1. **Phase 6 收尾方式**：渲染端/非数据端覆盖是本阶段补齐，还是拆为一个新的 ROADMAP 阶段？ROADMAP 当前 Phase 6 之后无任何阶段，缺口不会被后续阶段自动吸收（Gap G-01）。
2. **缺陷修复批次**：是否为 `#06-01-1..4`、`#06-03-1`、`#06-04-1..4`、`#06-05-1..3`、`#06-06-1`、`#06-07-1`、`#06-08-1`、`#06-09-1..5`（17 条 finding / 27 条 skip）开修复批次；修复后按 D-05 取消 skip 转回归用例。其中码 147 需裁定「补触发语义」还是「标注保留未用」（Gap G-04）。
3. **`deleteAura` 处理**：补一条正常用例（推荐，成本低），或经用户确认把该方法从 D-30 全接口覆盖判据中排除（Gap G-02）。

## Gaps Summary

本阶段**数据端切片交付质量高**：50 个测试文件、649 条跑绿用例、27 条合规的缺陷 skip、77/77 可达码覆盖、顶层集成（伤害组合 + 录像完整播放 + 二次录制逐条比对）与存读档全链路均已落地，且**未触碰任何生产代码**、未破坏 D-44 的 `vue-tsc` 文件级门禁。

但 Phase 6 **未完成**，不能标记通过，原因有四：

1. **范围未闭环（主因）**：阶段目标是「数据层**等**」、TEST-01 的完整广度包含渲染端；现状是**渲染端/legacy 等非数据端核心系统零测试**，且 ROADMAP 其后无承接阶段。这是本次验证要求显式记录的 NOT-DONE 项。
2. **接口全覆盖出现 1 处漏测**：`EnemyContext.deleteAura` 是公开接口方法且被 06-01 的 must_have 逐字点名，全仓库无任何测试引用。
3. **记录一致性失范 1 处**：`#06-09-4` 指向已被用户提交 `c08f3f8` 删除的 skip；连带 `06-09-SUMMARY.md` 的 `ReplayArray` 存读档 pass 声明与 `06-COVERAGE-MAP.md` 06-09 小节表述需订正。`ReplayArray` 现已无 `saveState`/`loadState`，该项 must_have 空悬而非「漏测」。
4. **存在未验证行为集合**：27 条 skip 覆盖 9 处生产缺陷，行为在修复前无法被验证（D-05 协议合规，但需用户开修复批次）。

另需修正：`REQUIREMENTS.md` 已把 TEST-01 标为完成、Traceability 标为 `Complete`，与上述范围事实不符。

---

_Verified: 2026-09-15T04:15:43Z_
_Verifier: the agent (gsd-verifier)_
