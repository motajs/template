---
phase: 07-data-fixes
plan: 04
subsystem: hero
tags: [hero, equipment, attribute, save-load, compression, deep-copy, vitest, data-base]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 登记的 hero 正确预期 it.skip 用例群（saveLoad 6 + attribute 1 + equipment 2）与 06-TEST-FINDINGS.md #06-05-1/2/3、#06-09-1/2 事实源
  - phase: 07-data-fixes
    plan: 03
    provides: 上一计划已入库（D-09 逐步确认与 D-12c 全量门禁的串行约束）
provides:
  - EquipmentState 读档分表恢复：loadNoCompression 按 value/percentage 各取各表（#06-09-1）
  - EquipmentState 压缩档读档以 item.equip 原始定义为基准再叠加差异条目（#06-09-1）
  - HeroEquipment.saveState 返回深拷贝快照 new Map(...) / [...slots]，满足 ISaveableContent 契约（#06-09-2）
  - 无修饰器时 recalculateAttribute 将 base 写入 finalAttribute（#06-05-1）
  - getCouldEquipSlot 恢复「优先首个空命名槽、无空槽才回退首个匹配槽」语义（#06-05-2）
  - 码 147 保留错误的静态见证注释（#06-05-3，D-06 零生产改动）
affects: [07-verify-work, hero, equipment, save-load]

actuals:
  tokens: 3168
  tasks: 5
  commits: 5
  plan_head_before: 76a62918d7ac7511784953597c8eb2dee41ec572

tech-stack:
  added: []
  patterns:
    - "压缩存档读档的不变式：基准 = 装备原始定义（item.equip），其上叠加存档差异条目，再 rebuildModifiers()"
    - "无修饰器分支与有修饰器分支共享同一引用语义：finalAttribute[name] = this.attribute[name]（非深拷贝）"
    - "存档快照以 new Map(...) / [...arr] 与活对象解耦，避免 loadState 的 clear() 污染已生成快照"

key-files:
  created: []
  modified:
    - packages-user/data-base/src/hero/equipStore.ts
    - packages-user/data-base/src/hero/equipment.ts
    - packages-user/data-base/src/hero/attribute.ts
    - packages-user/data-base/src/hero/saveLoad.test.ts
    - packages-user/data-base/src/hero/attribute.test.ts
    - packages-user/data-base/src/hero/equipment.test.ts
    - .planning/WINDOWS.md

key-decisions:
  - "Task 0（D-09 预执行汇报，checkpoint:decision / gate=blocking-human）用户回复 approve：五条按计划执行、147 只改注释、数字槽回装缺口只登记不修、不为 #06-05-3 新建账本条目"
  - "#06-05-3 严格按 D-06 处置：生产代码零改动、不标记死码、equipment.test.ts:306 的 it.skip 保留并加中文注释；处置只记入本 SUMMARY，不新建 WINDOWS.md 条目（避免抬高 open_count 门禁）"
  - "压缩档 loadDiff 的修法以 this.item.equip 为基准（研究已复核该基准即 saveDiff 事实源），而非以空表起步"
  - "attribute.ts 无修饰器分支保留同引用语义，不改写为深拷贝；catchCalculateProgress 的同类早退（:106）明确不动（生成器且不写 final）"
  - "D-11 注释同步只覆盖本计划触及的注释；saveLoad.test.ts 中 24 行既有乱码注释（历史遗留）不做重写，仅在 SUMMARY 登记"

patterns-established:
  - "读档分表：存档的 value 表只写 this.value，percentage 表只写 this.percentage，禁止交叉写入"
  - "保留错误码的静态见证：不可达分支不下架、不标死码，保留 skip 用例并以中性中文注释说明设计意图"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "#06-09-1（高）：EquipmentState 读档分表恢复 + 压缩档以 item.equip 为回退基准，Low/High 百分比与压缩档未修改数值修饰器不丢失"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores a percentage modifier on the same instance in LowCompression"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores a percentage modifier on the same instance in HighCompression"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores a value modifier on the same instance"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#keeps unchanged value modifiers for compressed snapshots"
        status: pass
    human_judgment: false
  - id: D2
    description: "#06-09-2：HeroEquipment.saveState 返回深拷贝（equipped/slots），快照与活对象解耦，经 HeroState 容器三档往返均恢复装备映射"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#returns an equipment snapshot independent from the live state"
        status: pass
      - kind: unit
        ref: "packages-user/data-base/src/hero/saveLoad.test.ts#restores the equipped mapping through the container across all compressions"
        status: pass
    human_judgment: false
  - id: D3
    description: "#06-05-1：无修饰器时 recalculateAttribute 将 base 写入 finalAttribute，不再提前返回导致陈旧 final"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/attribute.test.ts#reflects base-only changes without any modifier"
        status: pass
    human_judgment: false
  - id: D4
    description: "#06-05-2：getCouldEquipSlot 空槽条件修正为 empty === -1，字符串槽位优先占用首个空槽而非替换占用者"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-base/src/hero/equipment.test.ts#uses the first empty named slot instead of replacing an occupant"
        status: pass
    human_judgment: false
  - id: D5
    description: "#06-05-3：码 147 保留为设计如此——生产代码零改动，equipment.test.ts 的对应用例保持 it.skip 并带中文说明注释"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "Select-String -Path packages-user/data-base/src/hero/equipment.test.ts -Pattern \"保留错误码\" → 命中 :305"
        status: pass
      - kind: other
        ref: "hero 测试目录 it.skip 总数 = 1（仅 147 用例），未新增任何 skip"
        status: pass
    human_judgment: true
    rationale: "147 为「保留错误码、当前不可达」属设计判断，无可执行断言可验（用例按 D-06 保留 skip）；该处置已由用户在 Task 0 checkpoint（approve）确认"
  - id: D6
    description: "相邻语义缺口登记：HeroEquipment.loadState 数字槽回装与 canEquipTo 的 item.equip.slots.includes(index) 要求不一致（只声明字符串槽的装备在容器往返时可能被静默丢弃）——只登记不修"
    requirement: FIX-01
    verification:
      - kind: manual_procedural
        ref: "本 SUMMARY 「已知语义缺口登记」小节"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-09-15
status: complete
---

# Phase 07 Plan 04: 勇士数据模型缺陷修复 Summary

**修复 `@user/data-base` L1 勇士装备/属性四条缺陷（含全阶段唯一「高」严重度的读档丢加成），8 条正确预期 skip 用例转绿，码 147 按 D-06 保留为不可达设计并加注释，WINDOWS.md 25/26 结清**

## Performance

- **Duration:** 约 15 分钟
- **Started:** 2026-09-15T12:21:00Z (20:21 +08:00)
- **Completed:** 2026-09-15T12:35:00Z (20:35 +08:00)
- **Tasks:** 5 个执行任务（Task 0 为 D-09 预执行汇报 checkpoint，已由用户 approve，不计入 auto 任务数）
- **Files modified:** 7（3 个生产源码 + 3 个测试 + WINDOWS.md）

## Accomplishments

- **`#06-09-1`（阶段唯一「高」严重度）**：`loadNoCompression` 首个循环原先从 `state.percentage` 读取值并写入 `this.value`（数值表恒空），`loadDiff` 则完全缺少「以 `item.equip` 原始定义为基准」的回退——两处均修，压缩档不再静默丢失未修改的加成。T-7-01 缓解落地。
- **`#06-09-2`**：`saveState` 由返回活引用改为 `new Map(this.equips)` / `[...this.slots]` 深拷贝，`loadState` 的 `slots.length = 0` / `equips.clear()` 不再清空已生成快照本身。T-7-09 缓解落地。
- **`#06-05-1`**：无修饰器时 `recalculateAttribute` 不再提前返回，`finalAttribute` 与 base 保持同值，消除陈旧 final 导致的上层数值误判。T-7-10 缓解落地。
- **`#06-05-2`**：`getCouldEquipSlot` 条件 `empty !== -1`（恒假，`:148` 为死代码）改为 `empty === -1`，字符串槽位恢复「优先空槽」语义。
- **`#06-05-3`（D-06）**：生产代码一行未动、未标记死码；147 用例保留 `it.skip` 并补中性中文注释。
- 8 条 D-10 正确预期用例全部取消 skip 并转绿；本计划**未新增任何 `it.skip`**（hero 测试目录 `it.skip` 总数 = 1，即保留的 147 用例）。
- WINDOWS.md id 25/26 置为 `fixed`（`open_count` 13 → 11），**未新建账本条目**。

## Task Commits

每个任务原子提交（D-13）：

1. **Task 1: `#06-09-1` 读档分表恢复与压缩档回退基准** - `e7f3410` (fix)
2. **Task 2: `#06-09-2` saveState 深拷贝** - `0278604` (fix)
3. **Task 3: `#06-05-1` 无修饰器时同步 final 属性** - `0494341` (fix)
4. **Task 4: `#06-05-2` 优先占用首个空命名槽** - `2452711` (fix)
5. **Task 5: `#06-05-3` 注释保留 + 门禁 + WINDOWS.md 25/26 结清** - `2d2855c` (chore)

**Plan metadata:** 本 SUMMARY 的提交（docs）

_注：Task 0 为 `checkpoint:decision`（`gate="blocking-human"`），只在执行前汇报，不产生代码提交。_

## Files Created/Modified

- `packages-user/data-base/src/hero/equipStore.ts` — `loadNoCompression` 按 `state.value`/`state.percentage` 分表恢复；`loadDiff` 先以 `this.item.equip.value`/`.percentage` 为基准装载再叠加差异
- `packages-user/data-base/src/hero/equipment.ts` — `saveState` 返回深拷贝；`getCouldEquipSlot` 空槽条件修正为 `empty === -1`
- `packages-user/data-base/src/hero/attribute.ts` — `recalculateAttribute` 无修饰器分支写入 `finalAttribute[name]`
- `packages-user/data-base/src/hero/saveLoad.test.ts` — 6 条 skip 取消（`#06-09-1` 4 条 + `#06-09-2` 2 条）
- `packages-user/data-base/src/hero/attribute.test.ts` — 1 条 skip 取消（`#06-05-1`）
- `packages-user/data-base/src/hero/equipment.test.ts` — 1 条 skip 取消（`#06-05-2`）+ 147 用例保留 skip 并加注释（`#06-05-3`）
- `.planning/WINDOWS.md` — id 25/26 → `fixed`（未新建条目）

## Decisions Made

- **Task 0 用户裁决（approve）**：hero 五条按计划执行；`#06-05-3` 只改注释、不新建账本条目；数字槽回装语义缺口只登记不修。
- `#06-05-3` 的处置**只记入本 SUMMARY**（D-14 的 waive 在 WINDOWS.md 中无对象可作用，新建条目会抬高 `open_count` 并可能阻塞 `/gsd-ship` 的 windows 门禁）。
- `loadDiff` 以 `this.item.equip` 为基准的修法获用户确认（与 `saveDiff` 的写入基准互为逆运算）。
- `catchCalculateProgress`（`attribute.ts:106`）的同型提前返回**明确不动**——它是生成器且不写 `finalAttribute`，改它会改变 yield 语义并超出本计划边界。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Documentation] 重写被触及注释中的既有乱码（D-11）**
- **Found during:** Task 1 / Task 2
- **Issue:** 本计划需要「同步 it 前的中文注释」（Task 1/2/3/4）与补写 147 注释（Task 5），但 `saveLoad.test.ts` 中这些注释在 HEAD 中已是乱码（字面 U+FFFD 替换字符，如 `// 疑似 bug�E�Low 压缩档读档未回退到...`），无法原样保留。
- **Fix:** 把本计划触及的 8 处注释（`saveLoad.test.ts` 6 处 + `attribute.test.ts` 1 处 + `equipment.test.ts` 1 处）重写为**合法 UTF-8 中文**，并按 D-10 改为描述已修复行为的中性措辞（不再写「疑似 bug」）；147 用例注释改为「静态见证：147 为保留错误码，当前不可达，设计如此，生产代码不修改（#06-05-3）」。
- **Files modified:** `saveLoad.test.ts`、`attribute.test.ts`、`equipment.test.ts`
- **Verification:** 逐字节校验 3 个测试文件 U+FFFD 计数：`attribute.test.ts` = 0、`equipment.test.ts` = 0、被触及的 6 行注释 = 0；`Select-String` 命中「保留错误码」；eslint 0 错误。
- **Committed in:** `e7f3410`、`0278604`、`0494341`、`2452711`、`2d2855c`

**2. [Rule 3 - Blocking] 生产文件的 `if (!modifierList) return;` 有两处同名匹配**
- **Found during:** Task 3
- **Issue:** `attribute.ts` 中 `recalculateAttribute`（`:82`）与 `catchCalculateProgress`（`:102`）的提前返回语句逐字相同，按最小片段替换会误改生成器。
- **Fix:** 以包含方法签名的更大上下文定位，仅改 `recalculateAttribute`；改后复核 `catchCalculateProgress` 仍为 `if (!modifierList) return;`。
- **Files modified:** `packages-user/data-base/src/hero/attribute.ts`
- **Verification:** 改后 `attribute.test.ts` 全绿（12 passed），含 `iterates calculation progress without touching the final value`（生成器用例不回归）。
- **Committed in:** `0494341`

---

**Total deviations:** 2 auto-fixed（1 documentation、1 blocking）
**Impact on plan:** 两项均为完成计划内工作所必需，未扩大范围；未改断言、未新增用例、未引入依赖、未新建文件。

## 门禁结果（D-12 / D-44 文件级，逐步执行）

| 任务 | `eslint --fix` + `eslint`（改动文件） | `vue-tsc --noEmit` 按改动文件路径过滤 | 聚焦测试 |
| ---- | ---- | ---- | ---- |
| Task 1 | 0 错误 | 0 命中 | `saveLoad.test.ts`：18 passed / 2 skipped |
| Task 2 | 0 错误 | 0 命中 | `saveLoad.test.ts`：20 passed / 0 skipped |
| Task 3 | 0 错误 | 0 命中 | `attribute.test.ts`：12 passed；hero 目录 87 passed / 2 skipped |
| Task 4 | 0 错误 | 0 命中 | `equipment.test.ts`：13 passed / 1 skipped |
| Task 5 | 6 文件 0 错误 | 0 命中 | 全量：**66 files passed / 675 passed / 6 skipped，exit 0** |

`pnpm test:ci` 最终结果为全绿（exit 0）；`vue-tsc` 以 6 个改动文件的相对路径过滤输出 0 类型错误（未以整仓退出码判定，符合 D-12b）。

## `#06-05-3` 处置记录（D-06）

- **生产代码：零改动。** 147 分支（`equipment.ts:180-184`）与 `getCouldEquipSlot` 的数字槽早退未被触碰；`git diff <plan-head>..HEAD` 对 3 个生产文件的输出中 `147` 出现 **0 次**。
- **不标记死码：** 未添加 `@ts-ignore`/注释性死码标记，未删除分支。
- **测试：** `equipment.test.ts:306` 的 `it.skip('warns code 147 when no equipment slot is available')` **保留**，`:305` 增加中文单行注释「静态见证：147 为保留错误码，当前不可达，设计如此，生产代码不修改（#06-05-3）」；该用例**不计入**取消 skip 的 8 条。
- **账本：** 按用户指示**未**为 `#06-05-3` 新建 WINDOWS.md 条目（原 D-14 所述 waive 在账本中无对应对象）；处置仅记于此 SUMMARY。
- **可达性依据：** 数字槽经 `slots.includes` 后必返回 `CanEquip`/`NeedReplace`，`getCouldEquipSlot(number)` 直接返回 `slot`（恒非 -1）；字符串槽在 `hasSlot === false` 时 `canEquipTo` 提前返回 `CannotEquip`，否则至少命中一次 `name === slot` 使 `first !== -1`。故 `available === -1` 不可达。

## 已知语义缺口登记（只登记不修）

1. **`HeroEquipment.loadState` 数字槽回装与 `canEquipTo` 的契约不一致**（Task 0 用户确认「只登记不修」）：
   `loadState`（`equipment.ts:343-345`）以 `this.equip(uid, index)` 的**数字槽**回装，而 `canEquipTo` 对数字槽要求 `item.equip.slots.includes(index)`（`:39`）。只声明**字符串槽**（如 `slots: ['weapon']`）的装备，若存档槽位索引为 0，读档时 `canEquipTo` 返回 `CannotEquip`，`equip` 提前返回 `void 0`，该装备被**静默丢弃**。现有相关用例的装备定义均为 `slots=[0]`（或 `['weapon','armor']` 且经字符串槽装备），故未暴露；本计划按边界不修。
2. **待用户注意的同类早退**：`catchCalculateProgress`（`attribute.ts:106`）保留 `if (!modifierList) return;`。与 `#06-05-1` 同型但**不是缺陷**——它是生成器且不写 `finalAttribute`，本计划明确不改。
3. **`saveLoad.test.ts` 中 24 行历史遗留乱码注释（未触及）**：累计 117 个 U+FFFD 替换字符，位于本计划未触及的 `it` 之前（如 `:1`、`:57`、`:226`、`:385` 等）。这些注释在 HEAD 中已损坏，属**先于本计划存在**的文档缺陷；按 executor 范围边界（不修改非本任务引入的既有问题）未做重写，仅在此登记，供后续文档修复计划处理。
4. **`HeroEquipsStore.loadState` 的码 58 早退**：见 `equipStore.ts`（`maxUid` 缺失时报 58 后 `return`，`nextUid` 不更新）。属既有设计，本计划未触碰。

## Threat Surface Scan

未发现计划 `<threat_model>` 之外的新增安全面：无新增网络端点、无鉴权路径、无 schema 变更、无新依赖或新文件。`T-7-01`/`T-7-09`/`T-7-10` 的 `mitigate` 处置均已在对应任务落地；`T-7-SC`（包管理器）成立——`package.json` / `pnpm-lock.yaml` 未变更。

## Known Stubs

无。本计划未新增 stub、未新增 `it.skip`、未留下未运行的 `<verify>`。

## Issues Encountered

- **PowerShell 传参**：`pnpm exec eslint $files`（数组变量）被折叠为单个参数导致 "No files matching the pattern"；改用 `& pnpm exec eslint @files`（splat）后正常。仅影响执行方式，不涉及仓库内容。
- **工作树脏文件**：`.gsd/dispatch-isolation-sentinel.json` 在本计划开始前即处于 modified 状态（执行框架自身写入），非本计划产物，**未纳入任何提交**。
- **无失败修复**：全程未出现 D-09 意义上的「方案修复失败」，5 个执行任务一次通过，无探索替代方案。

## User Setup Required

None - 无外部服务配置需求（纯数据端测试修复）。

## Next Phase Readiness

- FIX-01 的 data-base/hero 四条缺陷已修复并入库，WINDOWS.md 25/26 结清；wave 4 的 07-04 可交由 `/gsd-verify-work` 验证。
- 遗留：上述「已知语义缺口登记」1 与 3 需在后续计划或用户侧处理；本计划未静默忽略。
- 门禁：`pnpm test:ci` 全绿；`.planning/STATE.md` 与 `.planning/ROADMAP.md` 由 orchestrator 统一更新（本 executor 未改动）。

---

*Phase: 07-data-fixes*
*Completed: 2026-09-15*

## Self-Check: PASSED

- FOUND: .planning/phases/07-data-fixes/07-04-SUMMARY.md
- FOUND: packages-user/data-base/src/hero/equipStore.ts
- FOUND: packages-user/data-base/src/hero/equipment.ts
- FOUND: packages-user/data-base/src/hero/attribute.ts
- FOUND: packages-user/data-base/src/hero/saveLoad.test.ts
- FOUND: packages-user/data-base/src/hero/attribute.test.ts
- FOUND: packages-user/data-base/src/hero/equipment.test.ts
- FOUND: .planning/WINDOWS.md
- FOUND: e7f3410
- FOUND: 0278604
- FOUND: 0494341
- FOUND: 2452711
- FOUND: 2d2855c
