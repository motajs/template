---
phase: 06-unit-tests
plan: 05
subsystem: testing
tags: [vitest, data-base, hero, attribute, modifier, equipment, follower, mover, rendering, node]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 06-PATTERNS C 节 hero 模式、06-CONTEXT D-28/D-30/D-31/D-32/D-43/D-44 规则
provides:
  - packages-user/data-base/src/hero 下 10 个行为测试文件（attribute/modifier/location/state/equipment/equipStore/items/follower/mover/rendering）
  - 码 108/109/116/142/144/146 的可达触发断言与 147 的不可达证据
  - 06-COVERAGE-MAP.md 06-05 小节（code → 模块 → 用例）
  - 06-TEST-FINDINGS.md #06-05-1..3 疑似缺陷登记
affects: [06-09 存档（equipStore 58/59 与全部 save/load 归其负责）, 06-07 顶层集成（hero 子系统组合语义）]

actuals:
  tokens: 18082
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 同目录 `*.test.ts` + `vi.hoisted` 全局 stub + `Map.getOrInsert`/`getOrInsertComputed` 运行时 polyfill
    - inline fake `IDataCommon`（真实 `TileStore`/`ItemStore` + `as never`）+ 内联 `IHeroMoveTopImpl` fake
    - 异步路径真实计时器 + `await controller.onEnd`，无 fake timers
    - 疑似 bug 按正确预期写 `it.skip` 并锚定 `#06-05-N`

key-files:
  created:
    - packages-user/data-base/src/hero/attribute.test.ts
    - packages-user/data-base/src/hero/modifier.test.ts
    - packages-user/data-base/src/hero/location.test.ts
    - packages-user/data-base/src/hero/state.test.ts
    - packages-user/data-base/src/hero/equipment.test.ts
    - packages-user/data-base/src/hero/equipStore.test.ts
    - packages-user/data-base/src/hero/items.test.ts
    - packages-user/data-base/src/hero/follower.test.ts
    - packages-user/data-base/src/hero/mover.test.ts
    - packages-user/data-base/src/hero/rendering.test.ts
  modified:
    - .planning/phases/06-unit-tests/06-COVERAGE-MAP.md
    - .planning/phases/06-unit-tests/06-TEST-FINDINGS.md

key-decisions:
  - "阶段 1 起即发现 `HeroAttribute.recalculateAttribute` 在无修饰器时提前返回，按 D-05 以正确预期 it.skip 登记 #06-05-1，不修改核心代码"
  - "`HeroMover` 测试复用真实 `HeroLocation` 作为移动宿主（tile），以覆盖真实 setPos/楼层路径，替代计划中的自定义 TestTile"
  - "`HeroEquipment` 字符串槽位空槽判断写反（#06-05-2），导致码 147 不可达（#06-05-3）；147 以 it.skip 登记，覆盖表该行标注跳过"
  - "`HeroState`/`HeroEquipment` 等经接口类型调用 `registerModifier`，避免类实现泛型签名在测试侧难以满足"
  - "不测任何 saveState/loadState（D-32），equipStore 58/59 归 06-09"

patterns-established:
  - "Hero 子系统单测：同目录 + 全局 stub + 内联 fake 公共层 + 内联顶层移动实现"
  - "警告断言统一经 `logger.catch(fn).info.map(i => i.code)` 或 `vi.spyOn(logger, ...)`"
  - "正确预期 + it.skip + `#06-05-N` 中文注释锚定的缺陷登记流程"

requirements-completed: [TEST-01]

coverage:
  - id: D1
    description: "HeroAttribute 基础/最终属性、修饰器优先级与增删、存盘开关、克隆与 108/109"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/attribute.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "ValueModifier/PercentageModifier 公式、默认优先级与绑定重算"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/modifier.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "HeroLocation 定位/楼层 getter-setter 与 onSetPos/onSetFloor 钩子"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/location.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "HeroState 子系统装配、属性视图、修饰器注册（116）与 changeFloor 钩子顺序"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/state.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "HeroEquipment 槽位判定、装备/替换/卸下、compareEquip 与码 146"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/equipment.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "HeroEquipsStore 实例增删计数与按 uid/排序器排序、EquipmentState 修饰器生成"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/equipStore.test.ts"
        status: pass
    human_judgment: false
  - id: D7
    description: "HeroItems 常量/消耗计数、装备路由、拾取效果与 useItem 分类行为"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/items.test.ts"
        status: pass
    human_judgment: false
  - id: D8
    description: "HeroFollowersController 增删/链接、同步与异步 gather、码 142"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/follower.test.ts"
        status: pass
    human_judgment: false
  - id: D9
    description: "HeroMover 配置往返、Step/CannotMove/Hit、越界、地形忽略、enter/leave 顺序与码 144"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/mover.test.ts"
        status: pass
    human_judgment: false
  - id: D10
    description: "HeroRendering alpha 默认值、setAlpha 与 onSetAlpha 钩子注册/解除"
    requirement: "TEST-01"
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/rendering.test.ts"
        status: pass
    human_judgment: false
  - id: D11
    description: "码 147（无可用装备槽）触发断言 — 当前实现不可达，无法以正常用例覆盖"
    verification: []
    human_judgment: true
    rationale: "`HeroEquipment.equip` 的 147 分支与 `canEquipTo` 的名称槽校验互斥，无法经公开接口触发；已以 it.skip 正确预期用例登记 #06-05-3，需人工决定修复方向或标记该码保留未用。"

duration: 22min
completed: 2026-09-14
status: complete
---

# Phase 06 Plan 05: 勇士全部子系统单元测试 Summary

**以 10 个同目录行为测试覆盖 `data-base/src/hero` 全部勇士子系统（属性/修饰器/位置/装配/装备/实例仓/道具/跟随者/异步移动/渲染），三阶段逐层跑绿并触发码 108/109/116/142/144/146**

## Performance

- **Duration:** 22 min
- **Started:** 2026-09-14T07:35:00Z (约)
- **Completed:** 2026-09-14T07:55:08Z
- **Tasks:** 3 / 3（阶段 1 → 阶段 2 → 阶段 3）
- **Files modified:** 10 个测试文件（新增，+2247 行）

## Accomplishments

- 阶段 1（构件级）：`HeroAttribute`（base/final、优先级排序、增删、存盘开关、克隆、`catchCalculateProgress`）与 `ValueModifier`/`PercentageModifier` 公式，观测码 108/109。
- 阶段 2（组合/流水线）：`HeroLocation` 钩子、`HeroState` 装配与属性视图/修饰器注册（码 116）、`HeroEquipment` 装备/替换/卸下/`compareEquip`（码 146）、`HeroEquipsStore` 实例排序、`HeroItems` 路由与 `useItem`、`HeroFollowersController` 增删/链接/同步与异步 gather（码 142）。
- 阶段 3（完整/集成）：`HeroMover` 真实计时器异步移动（`Step`/`CannotMove`/`Hit`/越界/地形忽略/`enter`-`leave` 顺序/码 144）与 `HeroRendering` alpha + 钩子。
- 聚焦运行与全量门禁：每阶段聚焦 vitest 全绿，`pnpm test:ci` 由 36 文件 / 347 通过 / 9 跳过 提升到 46 文件 / 412 通过 / 12 跳过。
- 以 create-or-append 写入 `06-COVERAGE-MAP.md` 06-05 小节（7 个码），并在 `06-TEST-FINDINGS.md` 登记 `#06-05-1..3`。

## Task Commits

Each task was committed atomically:

1. **阶段 1（构件级）** - `c1781b8` (test)
2. **阶段 2（组合/流水线）** - `6d5081a` (test)
3. **阶段 3（完整/集成）** - `3511114` (test)

**Plan metadata:** 见末尾 docs 提交（SUMMARY / STATE / ROADMAP / COVERAGE-MAP / TEST-FINDINGS）

## Files Created/Modified

- `packages-user/data-base/src/hero/attribute.test.ts` - HeroAttribute 构件与码 108/109
- `packages-user/data-base/src/hero/modifier.test.ts` - 数值/百分比修饰器公式与绑定重算
- `packages-user/data-base/src/hero/location.test.ts` - 位置/楼层/朝向与钩子
- `packages-user/data-base/src/hero/state.test.ts` - 子系统装配、属性视图、码 116、changeFloor 顺序
- `packages-user/data-base/src/hero/equipment.test.ts` - 槽位判定、装备/替换/卸下、compareEquip、码 146/147
- `packages-user/data-base/src/hero/equipStore.test.ts` - 实例增删计数与排序、EquipmentState 修饰器
- `packages-user/data-base/src/hero/items.test.ts` - 常量/消耗计数、装备路由、拾取效果、useItem
- `packages-user/data-base/src/hero/follower.test.ts` - 增删/链接、同步与异步 gather、码 142
- `packages-user/data-base/src/hero/mover.test.ts` - 异步移动码、越界、地形忽略、码 144
- `packages-user/data-base/src/hero/rendering.test.ts` - alpha 与 onSetAlpha 钩子
- `.planning/phases/06-unit-tests/06-COVERAGE-MAP.md` - 追加 06-05 小节与 7 行码映射
- `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md` - 追加 `#06-05` 小节（3 条疑似缺陷）

## Decisions Made

- `HeroMover` 测试复用真实 `HeroLocation` 作为移动宿主（计划原本列出自定义 `TestTile`），保留真实 `setPos`/`floorId` 路径且无需实现庞大接口。
- 有测试价值的旧式断言（`modifier.modify` 参数个数）按具体类签名调用，避免与基类抽象签名混淆。
- `HeroState`/`HeroEquipment` 经接口类型变量调用泛型注册方法，规避类实现的泛型签名约束。
- 无修饰器时 final 属性陈旧（`#06-05-1`）不阻断后续阶段：装备路径经 `addModifier` 触发重算，故阶段 2/3 可继续。

## Deviations from Plan

### Auto-fixed / Plan Adjustments

**1. [Rule 2 - 修正计划措辞] `attribute.test.ts` 基础属性断言改为在存在修饰器时进行**
- **Found during:** 阶段 1
- **Issue:** 计划要求「base 经 set/add/mul/div 变化，final 反映已注册 modifier」，但无修饰器时 final 不刷新（实现缺陷）。
- **Fix:** 保留通过用例改为「挂零值修饰器后 base/final 同步」，并把无修饰器的正确预期单列为 `it.skip`（`#06-05-1`），符合 D-05。
- **Files modified:** `attribute.test.ts`
- **Committed in:** `c1781b8`

**2. [Rule 3 - 修正计划措辞] `mover.test.ts` 用真实 `HeroLocation` 代替 `TestTile`**
- **Found during:** 阶段 3
- **Issue:** 计划列出 `TestTile` 助手，但 `IHeroLocation` 接口庞大，定制假实现代价高且会偏离真实写回路径。
- **Fix:** 使用真实 `HeroLocation` 作为 tile（其自带 `HeroMover`），内联 `FakeTopImpl` 注入顶层实现。
- **Files modified:** `mover.test.ts`
- **Committed in:** `3511114`

**3. [D-05 缺陷登记] 码 147 不可达，无法按计划以触发断言覆盖**
- **Found during:** 阶段 2
- **Issue:** 147 分支与 `canEquipTo` 的名称槽校验互斥，公开接口不可达；计划要求「147 各至少一条触发断言」。
- **Fix:** 以正确预期 `it.skip` 登记 `#06-05-3`，覆盖表该行标注跳过；不修改核心代码。
- **Files modified:** `equipment.test.ts`、`06-COVERAGE-MAP.md`、`06-TEST-FINDINGS.md`
- **Committed in:** `6d5081a` + 元数据提交

---

**Total deviations:** 3（2 处计划措辞调整、1 处代码不可达的 D-05 登记）
**Impact on plan:** 无范围蔓延；仅测试文件与阶段规划产物，未触碰任何生产/核心源码。

## Issues Encountered

- `Map.prototype.getOrInsert` 在 Node 22.18 不存在，`HeroAttribute.addModifier` 依赖它：在每个 hero 测试文件的 `vi.hoisted` 中与 `getOrInsertComputed` 一并 polyfill。
- `vue-tsc` 曾报测试文件类型错误（`ItemStore` 泛型参数、`IEquipmentSorter` 误从 data-common 导入），已按 D-44 门禁修正为零错误。

## Known Stubs

None — 本计划仅新增测试，无桩实现；`it.skip` 用例均为 `06-TEST-FINDINGS.md` 登记的正确预期用例（`#06-05-1..3`）。

## Threat Flags

None — 仅新增仓库内 Node Vitest 测试，无运行时输入面、网络或文件写入（与原计划 threat model 一致）。

## Next Phase Readiness

- 勇士子系统行为覆盖完成，码 108/109/116/142/144/146 已触发；147 待人工决策修复方向。
- 06-09 可在此之上补 equipStore 码 58/59 与全部 `saveState`/`loadState` 往返。
- 三条疑似缺陷（`#06-05-1..3`）已按 D-05 只记录不修复，等待用户确认修复环节。

---
*Phase: 06-unit-tests*
*Completed: 2026-09-14*

## Self-Check: PASSED

- 10 个 hero `*.test.ts` 全部存在
- 3 个阶段提交 `c1781b8`、`6d5081a`、`3511114` 均存在
- `06-05-SUMMARY.md` 已写入

