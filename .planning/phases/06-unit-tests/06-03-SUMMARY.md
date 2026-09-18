---
phase: 06-unit-tests
plan: 03
subsystem: testing
tags: [vitest, data-base, enemy, enemy-manager, special, dirty-tracking, unit-test]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 06-01/06-02 combat + top-level enemy behavior tests; D-43/D-44 staged execution conventions
provides:
  - Enemy attribute units (get/set/add/cloneAttributes)
  - Enemy special CRUD composition + clone/copyFrom independence (warn 96)
  - CommonSerializableSpecial / NonePropertySpecial unit + clone/deepEqualsTo
  - EnemyManager registry/prefab/reuse/modify/comparer dirty lifecycle (error 53, warn 117/118)
  - 06-COVERAGE-MAP 06-03 section (codes 53/96/117/118)
affects: [06-09-save-load, verify-work, audit-milestone]

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
actuals:
  tokens: 7026
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "动态 import + vi.hoisted 全局 stub harness，经 logger.catch 断言 warn/error 码"
    - "EnemyManager 脏集合经 Reflect.get 白盒观测，避免触碰 D-32 的 saveState/loadState"
    - "疑似缺陷按正确预期写 it.skip 并锚定 #06-03-N"

key-files:
  created:
    - packages-user/data-base/src/enemy/enemy.test.ts
    - packages-user/data-base/src/enemy/special.test.ts
    - packages-user/data-base/src/enemy/manager.test.ts
  modified:
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md
    - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md

key-decisions:
  - "06-03：enemy 数据模型按 D-43 三阶段（构件 → 组合/流水线 → 完整/集成）执行，每阶段聚焦跑绿并过 D-44 门禁后再进入下一阶段"
  - "06-03：manager 脏集合用 Reflect.get(manager, 'dirtySet') 观测，不调用 saveState/loadState，严格遵守 D-32"
  - "06-03：registerSpecial 覆盖语义只能经被排除的 legacy 转换路径观测，故只覆盖注册/重复注册不报错的最小正常用例（D-30 优先）"
  - "06-03：createEnemy/createEnemyById 未走复用映射，按 D-05 写 it.skip 正确预期并登记 #06-03-1，不修改核心代码"

patterns-established:
  - "阶段门禁：每阶段 <verify> 聚焦跑 + eslint + vue-tsc 文件级 + pnpm test:ci 全绿后才提交"
  - "D-30 边界：legacy 命名接口/方法仅作协作对象，不纳入断言"
  - "D-32 边界：存读档不测，脏跟踪经内部集合观测而非 saveState"

requirements-completed: [TEST-01]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Enemy 属性单元（getAttribute/setAttribute/addAttribute 单键独立、cloneAttributes 深拷贝非别名）"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/enemy/enemy.test.ts#Enemy attribute units"
        status: pass
    human_judgment: false
  - id: D2
    description: "Enemy special CRUD 组合与 clone/copyFrom 独立性（含重复 code 告警 96）"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/enemy/enemy.test.ts#Enemy special composition"
        status: pass
    human_judgment: false
  - id: D3
    description: "CommonSerializableSpecial / NonePropertySpecial 单方法单元、clone 独立性与 deepEqualsTo 判定"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/enemy/special.test.ts#CommonSerializableSpecial units, NonePropertySpecial units, Special clone and deep equality"
        status: pass
    human_judgment: false
  - id: D4
    description: "EnemyManager 注册表/prefab/reuse/modify/comparer 脏跟踪（error 53、warn 117/118）"
    requirement: TEST-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/enemy/manager.test.ts#EnemyManager registry and attribute defaults, prefab CRUD, reuse mapping, modifyPrefabAttribute, comparer and dirty tracking"
        status: pass
    human_judgment: false
  - id: D5
    description: "复用映射经 createEnemy/createEnemyById 解析到来源模板（疑似缺陷 #06-03-1，it.skip）"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/enemy/manager.test.ts#creates enemies for reused codes and ids through the reuse mapping (skipped)"
        status: unknown
    human_judgment: true
    rationale: "实现未走复用映射并返回 null，属疑似缺陷；按 D-05 只记录不修复，需人工确认修复方向后再转回归用例"

# Metrics
duration: 13min
completed: 2026-09-14
status: complete
---

# Phase 06 Plan 03: enemy 数据模型单测 Summary

**enemy 数据模型三层行为单测：`Enemy` 属性/special CRUD 与 clone/copyFrom、`CommonSerializableSpecial`/`NonePropertySpecial` 单元与深比较、`EnemyManager` 注册表/prefab/reuse/modify/comparer 脏跟踪（覆盖 error 53、warn 96/117/118），并登记 1 处疑似缺陷 #06-03-1**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-14T06:27:23Z
- **Completed:** 2026-09-14T06:40:30Z
- **Tasks:** 3 (three D-43 stages)
- **Files modified:** 5 (3 new test files + 2 shared planning docs)

## Accomplishments

- 阶段 1（构件级）：`enemy.test.ts` 属性单元 + `special.test.ts` 单方法单元，4 + 5 用例跑绿。
- 阶段 2（组合/流水线）：special CRUD 组合、warn 96、clone/copyFrom 独立性、`deepEqualsTo` 判定，9 + 8 用例跑绿。
- 阶段 3（完整/集成）：`EnemyManager` 注册表/prefab/reuse/modify/comparer 脏跟踪，17 通过 + 1 跳过。
- 三阶段全部通过 D-44 门禁（eslint 0 错误、vue-tsc 文件级 0 类型错误、`pnpm test:ci` 全绿）。
- 以 create-or-append 写入 `06-COVERAGE-MAP.md` 06-03 小节（code 53/96/117/118）并登记 `06-TEST-FINDINGS.md` #06-03。

## Task Commits

Each stage was committed atomically (normal hooks enabled, no `--no-verify`):

1. **阶段 1（构件级）** - `965868c` (test)
2. **阶段 2（组合/流水线）** - `ff75271` (test)
3. **阶段 3（完整/集成）** - `7012aa4` (test)

**Plan metadata:** final `docs(06-03): complete enemy data model unit test plan` commit (see STATE.md).

## Files Created/Modified

- `packages-user/data-base/src/enemy/enemy.test.ts` - Enemy 属性单元 + special CRUD/clone/copyFrom（9 用例）
- `packages-user/data-base/src/enemy/special.test.ts` - CommonSerializableSpecial/NonePropertySpecial 单元 + clone/deepEqualsTo（8 用例）
- `packages-user/data-base/src/enemy/manager.test.ts` - EnemyManager 注册表/prefab/reuse/modify/脏跟踪（17 通过 + 1 skip）
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` - 06-03 code→模块→用例小节（53/96/117/118）
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` - #06-03 疑似缺陷登记

## Decisions Made

- D-43 三阶段顺序执行，每阶段聚焦跑绿 + D-44 门禁后才进入下一阶段；三阶段均无阻断性 bug。
- D-32：`EnemyManager` 脏集合改经 `Reflect.get(manager, 'dirtySet')` 观测，完全避开 `saveState`/`loadState`（119/120 归 06-09）。
- D-30：`registerSpecial` 的覆盖语义只能经被排除的 legacy 转换路径观测，改为覆盖「注册/重复注册不报错」的最小正常用例；假 `IEnemyLegacyBridge` 仅作构造必需协作对象。
- D-05：`createEnemy`/`createEnemyById` 未走复用映射，按正确预期写 `it.skip` 并登记 `#06-03-1`，不修改核心代码。

## Deviations from Plan

1. **阶段 3 `registerSpecial` 覆盖语义未断言（约束冲突，无代码改动）**
   - **Found during:** 阶段 3（EnemyManager 注册表）
   - **Issue:** 计划 action 要求断言「同 code 后注册者胜」，但该注册表唯一消费方是被 D-30 排除的 legacy 转换路径（`fromLegacyEnemy`/`addPrefabFromLegacy`），无可观测的公开路径。
   - **Resolution:** 按 D-30 优先，改为断言「注册与重复注册均不产生告警/报错」的最小正常用例，并在 FINDINGS 与 COVERAGE-MAP 注明。
   - **Impact:** 无功能风险；`registerSpecial` 的覆盖语义留待 legacy 路径解禁或获得只读取值接口后补测。

其余无偏差——三个测试文件与计划列出的人工 fixture 符号（`createEnemy`、`createSpecial`、`makeConfig`、`bridge`、`createPrefab`、`createManager`）一致；未新增/修改任何 `packages-user/*/src` 生产文件。

## Issues Encountered

- 一次临时验证 `#06-03-1` 时误用 PowerShell `Set-Content -NoNewline` 重写 `manager.test.ts`，导致中文注释编码损坏；已用 `Write` 工具整文件重写恢复，随后改用 `Edit` 工具临时取消/恢复 `it.skip`。最终文件编码与格式经 eslint/prettier 门禁确认无碍。
- 疑似缺陷 `#06-03-1`：`createEnemy(100)` / `createEnemyById('slime-reuse')` 在注册复用映射后返回 `null`（`getPrefab`/`getPrefabById` 能正确解析）。临时取消 skip 运行确认为真实行为后恢复 skip；详见 `06-TEST-FINDINGS.md`。

## D-44 Gate Evidence

- 阶段 1-3：`pnpm exec eslint --fix` 后 `pnpm exec eslint <改动文件>` 均 0 错误。
- 阶段 1-3：`pnpm exec vue-tsc --noEmit` 输出按文件路径过滤 `data-base/src/enemy/{enemy,special,manager}.test.ts` 均 0 类型错误（仓库全局既有无关错误不在范围）。
- 聚焦运行：阶段 1 `2 files / 9 passed`；阶段 2 `2 files / 17 passed`；阶段 3 `1 file / 17 passed + 1 skipped`。
- `pnpm test:ci`：基线 29 文件 / 257 通过 / 4 跳过 → 最终 32 文件 / 291 通过 / 5 跳过（新增 34 通过 + 1 计划 skip）。

## Next Phase Readiness

- 06-03 三阶段全部完成，`data-base/src/enemy`（除 legacy 与存读档）公开接口已覆盖。
- 存读档相关（`saveState`/`loadState`、code 119/120）集中留给 06-09。
- `#06-03-1` 待人工确认后修复并取消 skip，转为回归用例。

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*
