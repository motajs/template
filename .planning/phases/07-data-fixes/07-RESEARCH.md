# Phase 7: 数据端缺陷修复 - Research

**Researched:** 2026-09-15
**Domain:** 数据端（L0–L3）缺陷修复 / 行为回归（mota-ts，TypeScript + Vitest 4）
**Confidence:** HIGH（全部根因均由本会话直接阅读源码 + 逐条复算确认；无外部依赖引入）

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**修复范围与计划粒度**
- **D-01:** **全部 20 条纳入**本阶段；`#06-09-4` 作废不进，`#06-15-1` 与 `#06-01-4` 同根因合并处理。
- **D-02:** **按系统切多个 PLAN**（combat / enemy / replay / hero / map / flag+common / save / path），系统内**先高后低**排序；便于逐系统汇报、门禁与回滚。

**契约冲突裁决（4 条，接口事实源 = 文档/码表文案）**
- **D-03:** `#06-01-3` **改实现对齐文档**：`ICombatScript.before` 仅当返回 `false` 才停止后续战前脚本并放弃战斗（`combat/types.ts:772` 的 jsdoc 为准）。
- **D-04:** `#06-06-1` **改实现**：越图 `transferToDynamic` 分支改发码 **128**，与 `transferToStatic` 的越界语义一致。
- **D-05:** `#06-09-5` **改实现对齐文案**：码 **178** = 存档中出现但未加载（未注册）的 key，即 `loaded.difference(total)`；并**同步更新既有非 skip 用例** `saveablesRoundTrip.test.ts` 中「缺 key 触发 178」的断言（`:321-334`）。
- **D-06:** `#06-05-3` **保留码 147，生产代码不动、不标记死码**：错误码关注的是语义错误，而非是否可能被触发。对应 `it.skip` 用例（`warns code 147 when no equipment slot is available`）**保留 skip 并加注释**说明「147 为保留错误码，当前不可达，设计如此」，不纳入取消 skip 清单。

**接口/接线缺口**
- **D-07:** `#06-07-1` **由用户自行修改**（`CoreState` → `pathfinding.finder` 注入 `useMapState`/`useMapLayer`/`usePassPredicate`）；**AI 不实现该接线**，计划中标注为用户负责项。用户修复后其 `it.skip` 用例（`plays a teleport step without manual finder wiring`）转绿。
- **D-08:** `#06-03-1` **改实现**：`createEnemy`/`createEnemyById` 接入复用映射（改用 `internalGetPrefab`，或先查 `reuseByCode`/`reuseById` 再取模板），与 `getPrefab` 行为一致。

**修复方式与执行节奏（强约束）**
- **D-09:** **每个计划开始执行前暂停并向用户汇报该计划的修复方案，经用户确认后才执行**；若计划方案修复失败，**不得自行探索其他方案**，必须**退出本次修改、修订修复计划后重新执行**。
- **D-10:** **测试处置**：修复后**仅取消对应 `it.skip` 转绿**，不额外新增用例（Phase 6 已建立正确预期）。
- **D-11:** **文档/注释同步**：契约修正后同步更新受影响的 jsdoc / 码表注释 / 契约文档，使文档与实现一致（尤其 D-03、D-05）。

**验证与提交**
- **D-12:** **门禁沿用 Phase 6 D-44（文件级）**：(a) 改动文件 `eslint --fix` 后 `eslint <文件>` 0 错误；(b) 本计划改动文件 `pnpm exec vue-tsc --noEmit` 输出路径下 0 类型错误；(c) `pnpm test:ci` 全绿。不追求全仓 `check:type`（既有渲染/legacy 错误不在范围）。
- **D-13:** **提交粒度：按缺陷/根因原子提交**（例如 `#06-01-4` + `#06-15-1` 合为一个 fix commit），便于逐条回滚与 windows 结清。
- **D-14:** **WINDOWS.md 收口**：修复转绿且取消 skip 后 `gsd-tools windows fixed <id>`；设计如此（`#06-05-3`）与用户自改（`#06-07-1`）的保留 `open` 并 **waive 注明原因**。

### the agent's Discretion

- 每条缺陷的具体修法（**最小修复 vs 必要的内部重构**）、文件切分、用例命名与 `#region` 划分由实现者在上述约束下决定；但**必须按 D-09 在执行前汇报并获用户确认**。若发现新的接口/设计疑问，立即提问，不自行假设。

### Deferred Ideas (OUT OF SCOPE)

- Phase 6 非数据端覆盖（渲染 / legacy 相关）仍延后到后续阶段，不在本阶段。
- Phase 5（Legacy 移植）若改动数据端接口，本阶段修复与测试需同步调整。
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FIX-01 | 修复数据端单元测试暴露的缺陷（仅数据端，不含渲染端），使正确预期用例转绿 | 本文档 §Per-Finding Analysis 逐条给出 20 条缺陷的 file:line、已确认根因、最小修法与「必须同步改动的既有绿用例」；§Validation Architecture 给出逐系统聚焦命令与阶段门禁；§Common Pitfalls / §Code Examples 提供可直接落地的补丁骨架 |

> `TEST-01`（Phase 6）与渲染端/legacy 覆盖**不在本阶段**；本阶段不新增用例（D-10），只把 Phase 6 已写好的正确预期 `it.skip` 取消 skip。
</phase_requirements>

## Summary

本阶段是 Phase 6「测试 / 修复两环节」中的修复环节：**20 条已登记的数据端疑似缺陷**全部有权威登记（`06-TEST-FINDINGS.md`）、有对应的正确预期 `it.skip` 用例、有明确的契约裁决。研究结论是：**20 条全部为真实缺陷（无一条是测试预期写错）**，其中 18 条可由**单点/双点最小修改**修复，2 条需要「完成半成品设计」（`#06-01-2` 的 `viewStore`/`damageStore` 从未写入；`#06-09-1` 的压缩档读档缺回退基准），另有 1 条（`#06-03-1`）在最小修改下会连带影响既有绿用例。

三条研究期新发现（CONTEXT 未覆盖，**必须在 D-09 预执行汇报中点名**）：

1. **`#06-01-3` 改实现后会直接打破一个既有绿用例。** `combat.test.ts:460` 的 `short-circuits hooks and after scripts when before returns truthy` 断言「返回**真值**短路」——正是 D-03 要推翻的语义。若只按 D-03 改实现并取消 `:483` 的 skip，该既有用例必红。计划必须把该用例**改为互补分支断言**（truthy → 完整执行钩子与 after 脚本），并在汇报时请用户确认这是 D-10「不新增用例」允许的**断言纠正**（与 D-05 授权更新 `saveablesRoundTrip.test.ts:321-334` 同类）。
2. **`#06-01-2` 的根因不止于「deleteEnemy 不清理」**：`viewStore`/`damageStore` **全文件从未被写入**（只有读/删路径），因此 `deleteEnemy`、`removeEnemyAffecting`（局部刷新清理）与 `refreshIndex` 的删除分支**同时失效**。最小「只修 deleteEnemy」的补丁能转绿 skip，但会把半成品的 store 结构永久留成死结构；「补齐 store 写入」是完整解但触及 `refreshEnemy`/`refreshEnemyAndClearCache`/`refreshIndex` 三处。两条路线都必须在预执行汇报中摆给用户选。
3. **`data-common/src/replay/array.ts` 的 4 条缺陷有共同根因**：把**命令索引**与**参数字节偏移**混用（`indexArray[i]` = 参数起始字节）。`delete`/`insert`/`set`（未登记）都踩同一坑，且末步缺少终点哨兵（`indexArray[length]` 恒为 0）。建议计划内以**一个私有范围助手**统一 `[paramStart, paramEnd)`，其中 `paramEnd` 用 `this.paramUsed` 作为末步哨兵。

**Primary recommendation:** 按 D-02 的 8 个系统计划推进；每个计划在 D-09 预执行汇报中同时给出 (1) 逐条 file:line 根因、(2) 最小补丁、(3) **必须同步变动的既有绿用例清单**、(4) 回滚点；先跑「本系统聚焦命令」红→绿，再跑 D-44 文件级门禁与 `pnpm test:ci`，最后按缺陷原子提交并按 D-14 结清/waive WINDOWS.md。

## Architectural Responsibility Map

本项目无浏览器/SSR 分层，对应的是 `dev.md` 的四层数据架构（L0 `data-common` → L1 `data-base` → L2 `data-system` → L3 `data-state`）。修复必须落在**拥有该数据的层**，不得跨层顺手重构。

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 伤害临界点 info 与 nextValue 对齐 | L2 `data-system/src/combat/damage.ts` | — | 二分搜索属系统层计算，不涉存档 |
| 地图伤害来源清理 | L2 `data-system/src/combat/mapDamage.ts` | — | `sourcedDamage`/`enemyStore` 是 L2 运行期索引，不入存档 |
| 战斗脚本 `before` 短路语义 | L2 `data-system/src/combat/combat.ts`；契约事实源 L2 `combat/types.ts` | — | 接口在 L2 `types.ts`，实现在同层 |
| 全量构建视图重置（`buildup`） | L2 `data-system/src/combat/context.ts`（+ 视图 L2 `enemy.ts` 已有 `reset()`） | — | `EnemyView.reset()` 已是既有 API，只需在 `buildup` 补调用 |
| 复用映射接入怪物创建 | L1 `data-base/src/enemy/manager.ts` | — | prefab/reuse 注册表属数据层 |
| 录像参数编解码与编辑索引 | L0 `data-common/src/replay/array.ts` | — | 录像数组是公共层数据结构 |
| 勇士属性 final 同步 | L1 `data-base/src/hero/attribute.ts` | — | 属性/修饰器属数据层 |
| 装备槽空槽判定 | L1 `data-base/src/hero/equipment.ts` | — | 装备槽映射属数据层 |
| 装备存档深拷贝 | L1 `data-base/src/hero/equipment.ts` | 契约 L0 `data-common/src/save/types.ts` | `ISaveableContent.saveState` 的「应深拷贝」契约在 L0 |
| 装备压缩档读档回退 | L1 `data-base/src/hero/equipStore.ts` | — | 原始定义 `item.equip` 与实例状态同在 L1 |
| 动态图块读档恢复 num | L1 `data-base/src/map/dynamicTile.ts` | — | 图块数字属数据层 |
| 越界转换诊断码 | L1 `data-base/src/map/mapLayer.ts` | 码表 L0 `packages/common/src/logger.json` | 码表是权威文案源（L0 公共层） |
| 后退步方向基准 | L0 `data-common/src/common/mover.ts` | 契约 L0 `mover.ts` 的 `IObjectMover.backward` jsdoc | 移动器属公共层 |
| 存档 key 差异诊断（177/178） | L3 `data-state/src/core.ts` | 码表 L0 `logger.json` | saveables 注册与 177/178 判定在顶层容器 |
| 寻路 finder 注入接线 | L3 `data-state/src/core.ts`（**用户负责，D-07**） | L2 `data-system/src/path/finder.ts`；L3 `data-state/src/hero/predicate.ts` | 装配在顶层；L3 谓词依赖 L1 数据 |

## Standard Stack

**本阶段不引入任何新依赖。** 全部修复落在既有 TypeScript 源码内，测试栈沿用 Phase 6 已建立的 Vitest。

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 仓库既有（`pnpm exec vue-tsc --noEmit`） | 类型门禁 | D-12 文件级类型门禁 |
| Vitest | `4.0.18`（`package.json` devDependencies，本会话实测 `vitest 4.0.18`） | 单元测试运行器 | Phase 6 既有；`pnpm test:ci` = `vitest run` |
| ESLint 9 flat config + Prettier 3.8.1 | 仓库既有 | 格式/规范门禁 | D-12(a)；CRLF、4 空格、单引号 |
| lodash-es | 仓库既有 | 既有 `isNil` 等工具 | 修复中沿用既有导入，不新增 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@motajs/common` `logger` | workspace | 警告码上报 + `logger.catch` 断言 | 所有诊断码相关修复（128 / 178 等） |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| 逐条最小补丁 | 重写 `MapDamage` 内部索引结构 | 用户 D-09 要求方案先确认；重写放大回归面，仅在「最小补丁被否」时才作为备选 |
| 新增测试用例验证修复 | 仅取消既有 `it.skip` | D-10 明确禁止新增用例（Phase 6 已建立正确预期） |

**Installation:** 无（`pnpm install` 无需变动）。

## Package Legitimacy Audit

**本阶段不安装任何外部包**，故不触发 Package Legitimacy Gate。全部改动为仓库内既有源码与既有测试文件；`package.json` / `pnpm-lock.yaml` **不得**出现新增依赖（D-10 不引入覆盖率工具，延续 06 D-09）。

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

修复数据流（以一次「缺陷修复 + 取消 skip」循环为单位）：

```
                    06-TEST-FINDINGS.md (权威登记, 只读输入)
                              |
                              v
       07-CONTEXT.md D-01..D-14 (契约裁决 / 门禁 / 提交粒度)
                              |
                              v
     +--------------------------------------------------+
     | 预执行汇报 (D-09, 硬暂停)                          |
     |  - file:line 根因                                  |
     |  - 最小补丁 / 备选补丁                              |
     |  - 必须同步变动的既有绿用例 (本研究的 3 项新发现)     |
     |  - 回滚点 (git commit / 文件清单)                   |
     +--------------------------------------------------+
                              | 用户确认
                              v
     +--------------------------------------------------+
     | 实现: 改 生产源码 (仅数据端)                        |
     |  数据端分层: L0 common -> L1 base -> L2 system -> L3 state
     +--------------------------------------------------+
                              v
     +--------------------------------------------------+
     | 测试: 取消对应 it.skip (仅此一类改动)               |
     |  - 断言不改写 / 不弱化 (D-10)                       |
     +--------------------------------------------------+
                              v
     +--------------------------------------------------+
     | 门禁 (D-44 文件级, 单个计划内)                      |
     |  (a) eslint --fix + eslint <file> 0 error          |
     |  (b) vue-tsc --noEmit -> 本计划文件 0 type error     |
     |  (c) pnpm test:ci 全绿                             |
     +--------------------------------------------------+
                | 失败: 退出本次修改, 修订计划后重跑 (D-09 禁止自行换方案)
                v
     +--------------------------------------------------+
     | 原子提交 (按缺陷/根因, D-13)                        |
     |  + WINDOWS.md 结清/waive (D-14)                    |
     +--------------------------------------------------+
```

### Recommended Project Structure

本阶段**不新建源码目录**。改动文件集中如下（`file:line` 见 §Per-Finding Analysis）：

```
packages-user/
├── data-common/src/
│   ├── replay/array.ts               # #06-04-1..4 (编解码 + 编辑索引)
│   └── common/mover.ts               # #06-08-1 (backward 方向基准)
├── data-base/src/
│   ├── enemy/manager.ts              # #06-03-1 (复用映射)
│   ├── hero/{attribute,equipment,equipStore}.ts   # #06-05-1/2/3, #06-09-1/2
│   └── map/{mapLayer,dynamicTile}.ts # #06-06-1, #06-09-3
├── data-system/src/combat/{damage,mapDamage,combat,context}.ts  # #06-01-1..4, #06-15-1
└── data-state/src/core.ts            # #06-09-5 (AI) / #06-07-1 (用户)
```

### Pattern 1: 「修复 + 取消 skip」原子闭环

**What:** 每个缺陷（或同根因组）形成一个原子提交：生产源码修改 + 对应 `it.skip` → `it` + 必要的既有用例断言纠正。
**When to use:** 本阶段全部条目。
**Example:**
```ts
// 修复前 (packages-user/data-common/src/replay/array.ts:621)
value = low + high * 2147483647;

// 修复后
value = low + high * 2147483648;
```
```ts
// 修复前 (packages-user/data-common/src/replay/array.test.ts:287-291)
it.skip('round-trips int64 values above the int32 range', () => {

// 修复后
it('round-trips int64 values above the int32 range', () => {
```

### Pattern 2: 诊断码修复必须「生产改动 + 码表/文案一致性」成对

**What:** 契约修正（D-03/D-04/D-05）要求实现与码表文案一致，且必须扫描**既有断言该码的其它用例**。
**When to use:** `#06-01-3`、`#06-06-1`、`#06-09-5`。
**Example（本会话已完成的码引用审计）：**
- 码 `131` 的**唯一**既有测试断言在 `gameMap.test.ts:185`（`setEventLayer` 越权路径），**不经过** `mapLayer.transferToDynamic`，故 `#06-06-1` 改发 128 不会打破它（唯一生产写入点见 `mapLayer.ts:441`）。
- 码 `178` 的既有非 skip 断言在 `saveablesRoundTrip.test.ts:322-334`，**会在 D-05 修复后失效**，必须同步改写为「多出的 key」语义。

### Anti-Patterns to Avoid
- **顺手扩大变更面：** Phase 6 的 D-44 门禁按「本计划改动文件」判定；改动越界文件会让门禁判据失效（06-09 曾因此被阻塞）。修 A 时不要顺带重构相邻未登记的代码（如 `array.ts` 的 `set()`、`equipment.ts` 的 `loadState` 数值槽语义）——先登记为待确认问题，由用户在 D-09 汇报中决定是否纳入。
- **弱化断言换取「假绿」：** 06-15 已明确「不弱化断言也不改写为可跑绿假象」。修复失败时按 D-09 退出并修订计划，而不是调整期望值。
- **测试内 `as` 链与 `import type`：** `dev.md` 禁止连续 `as` 与 `import type`（唯一例外见 CONVENTIONS.md）。新增/修改测试代码时沿用现有 `as never` 单层断言写法与普通 import。
- **在测试里 `it.only`：** 会掩盖其它用例；聚焦运行请用命令行文件过滤（见 §Validation Architecture）。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 警告码查询/断言 | 自建码常量表 | `packages/common/src/logger.json` + `logger.catch(fn)` 的 `{ ret, info }` | 码表是权威事实源；D-31 以码表判定 |
| 怪物视图重置 | 手写属性回填 | 既有 `EnemyView.reset()`（`combat/enemy.ts:15`，内部 `computedEnemy.copyFrom(baseEnemy)`） | 已处理特殊属性深拷贝（`Enemy.copyFrom`，`enemy.ts:77`） |
| 复用映射解析 | 重写 code/id 双表 | 既有私有 `EnemyManager.internalGetPrefab`（`manager.ts:131`） | 已同时处理 `reuseByCode`/`reuseById` 与两种键型 |
| 录像参数范围计算 | 各处 `indexArray[i+1] - indexArray[i]` | 计划内私有助手，末步以 `paramUsed` 为哨兵 | 末步 `indexArray[length]` 恒为 0，是 `#06-04-3` 的隐藏缺陷 |
| 边界/码断言测试脚手架 | 新建跨文件 fixture 工厂 | 各测试文件既有内联 fixture（06 D-03 明确禁止跨文件共享 helper） | 避免隐式耦合 |
| 存档深拷贝 | 手写递归拷贝 | `structuredClone` / `new Map(x)` / `[...arr]`（`ISaveableContent` 契约要求深拷贝） | 契约见 `data-common/src/save/types.ts:12-17` |

## Per-Finding Analysis（20 条逐条）

> 每条给出：(a) file:line；(b) **已确认**根因（与 06-TEST-FINDINGS.md「疑似原因」的差异已标注）；(c) 最小修法 + 必须同步改动的既有代码/用例；(d) 既有测试风险；(e) 共享模式。
> 所有源码断言均为本会话 `Read` 所得，按 `<source_hierarchy>` 记 `[VERIFIED: <path>:<line>]` 并附逐字引用。

### 概览表

| # | 系统(计划) | 生产文件:行 | 关联 skip 用例（文件:行） | 修法类型 | 既有用例需同步改动 | Windows id |
|---|-----------|-------------|---------------------------|---------|-------------------|-----------|
| 06-01-1 | combat | `damage.ts:229-234` | `damage.test.ts:579-594` | 单分支改派 | 无 | 19 |
| 06-01-2 | combat | `mapDamage.ts:150-167`（+`49-53/240-256/356-378`） | `mapDamage.test.ts:532-545` | 补齐半成品设计 **或** 单方法重写 | 无 | 20 |
| 06-01-3 | combat | `combat.ts:178-181` | `combat.test.ts:483-501` | 短路条件取反 | **有：`combat.test.ts:460-481` 会红** | 21 |
| 06-01-4 | combat | `context.ts:684-716` | `damage.test.ts:677-718` | 补 `view.reset()` 循环 | 无 | — |
| 06-15-1 | combat | 同上 | `context.test.ts:625-663` | 随 06-01-4 转绿 | 无 | 27 |
| 06-03-1 | enemy | `manager.ts:119-129` | `manager.test.ts:272-279`、`282-345` | 改用 `internalGetPrefab` | 无 | 24 |
| 06-04-1 | replay | `array.ts:621` | `array.test.ts:287-291` | 常量修改 | 无 | 23 |
| 06-04-2 | replay | `array.ts:255-275`、`626-635` | `array.test.ts:278-284`、`294-304` | 编解码重写（4 行） | 无 | 23 |
| 06-04-3 | replay | `array.ts:442-474` | `array.test.ts:211-221`、`511-520` | 起始索引 + 末步哨兵 | 无 | — |
| 06-04-4 | replay | `array.ts:412-440` | `array.test.ts:498-508`、`523-539` | **两处**位移方向 | 无 | — |
| 06-05-1 | hero | `attribute.ts:80-98` | `attribute.test.ts:115-121` | 提前返回分支补写 | 无 | — |
| 06-05-2 | hero | `equipment.ts:134-150`（:141） | `equipment.test.ts:290-303` | 条件取反 | 无 | — |
| 06-05-3 | hero | — | `equipment.test.ts:306-315` | **不改代码**（D-06） | 该用例补中文注释 | 无 |
| 06-06-1 | map | `mapLayer.ts:441` | `mapLayer.test.ts:419-427` | 码 131→128 | 无（131 唯一断言在 `gameMap.test.ts:185`） | — |
| 06-07-1 | path | `core.ts`（用户） | `replayPlayback.test.ts:362-375` | 用户接线（D-07） | 无 | 无 |
| 06-08-1 | flag+common | `mover.ts:492-503` | `mover.test.ts:307-319` | 后退基准改 `faceDirection` | 无（须同步 jsdoc，D-11） | 22 |
| 06-09-1 | hero/save | `equipStore.ts:116-151` | `hero/saveLoad.test.ts:337-341`、`344-348`、`351-366`、`369-381` | 两处循环 + 回退基准 | 无 | 25 |
| 06-09-2 | hero/save | `equipment.ts:329-334` | `hero/saveLoad.test.ts:312-325`、`589-609` | 深拷贝 | 无 | 26 |
| 06-09-3 | map/save | `dynamicTile.ts:118-127` | `map/saveLoad.test.ts:164-173` | 先 `set(save.num)` | 无（`mapLifecycle.test.ts:126-148` 复核为绿） | — |
| 06-09-5 | save | `core.ts:531-537` | `saveablesRoundTrip.test.ts:337-349` | 差集方向取反 | **有：`:322-334` 既有断言失效**（D-05 已授权） | — |

### combat 计划（`data-system/src/combat`）

#### #06-01-1 — `findNextCritical` 的 `targetInfo` 更新在错误分支

(a) `damage.ts:229-234`（返回点 `:238-241`，消费点 `:182-189`）。

(b) **已确认根因**：二分搜索中 `targetInfo` 被写在 `damage >= referenceDamage` 的 `else` 分支——该分支代表「还不是临界点」，因此 `info` 永远停在初始 `upperLimit` 处的计算结果（对 `FakeCalculator` 即 `atk=10 → damage 0`）。逐字：

```
229:            if (middleInfo.damage < referenceDamage) {
230:                right = middle;
231:            } else {
232:                left = middle;
233:                targetInfo = middleInfo;
234:            }
```
[VERIFIED: packages-user/data-system/src/combat/damage.ts:229-234]

本会话对 skip 用例参数（`damage = 100 - atk*10`、`getCriticalLimit = 10`）手工复算：`right` 经 10→5→2→1 收敛，`targetInfo` 未更新，故 `first.info.damage === 0` 而 `nextValue === 1`；期望 `90` / `diff === -10` —— 与登记完全一致。

(c) 最小修法（把赋值移入 `<` 分支，`else` 只留 `left = middle`）：

```ts
if (middleInfo.damage < referenceDamage) {
    right = middle;
    targetInfo = middleInfo;
} else {
    left = middle;
}
```
行号不变的边界性说明：`right` 在循环内最后一次被设置的迭代必然同时更新 `targetInfo`；若后续迭代只移动 `left`，`targetInfo` 仍对应当前 `right`（正是返回值）。`:220-221` 的初始 `targetInfo`（`upperLimit` 处）与 `:238-241` 的 `value: right` 在「从未进入 `<` 分支」时保持一致，无需额外改动。

(d) 既有测试风险：**无**。`damage.test.ts:508-524`（`yields the next critical point with its deltas`）只断言 `baseValue/nextValue/nextDiff/baseInfo.damage`，本会话复算修后仍为 `0/1/1/100` ✓；`yields nothing when the attribute already reaches the limit`（`:527-539`）走 `currentValue >= upperLimit` 早退 ✓；`returns safely when hero, calculator or locator is missing`（`:542-576`）走告警分支 ✓。全仓仅 `damage.test.ts` 与 `enemyCombination.test.ts:419` 调用 `calculateCritical`/`getCriticalLimit`，后者不断言 `info`。

(e) 共享模式：无。这是单点分支错误。

#### #06-01-2 — `MapDamage` 的 `viewStore`/`damageStore` 从未写入

(a) 生产：`mapDamage.ts:49-53`（声明）、`:150-167`（`deleteEnemy`）、`:227-234`（`clearSourceState`）、`:240-256`（`removeEnemyAffecting`）、`:261-299`（`refreshEnemyAndClearCache`）、`:304-333`（`refreshEnemy`）、`:356-378`（`refreshIndex`）。测试：`mapDamage.test.ts:532-545`。

(b) **已确认根因（比登记更完整）**：`06-TEST-FINDINGS.md` 说「`viewStore` 与 `damageStore` 只在读/删路径出现，全文件没有任何 `.set(...)` 写入」。本会话通读全文件 379 行确认成立：`viewStore` 出现于 `:49`（声明）、`:155/161`（`deleteEnemy` 读+删）、`:230`（`clearSourceState`）、`:244/253`（`removeEnemyAffecting` 读+删）、`:367`（`refreshIndex` 读）；`damageStore` 出现于 `:52`（声明）、`:158`（`deleteEnemy` 删）、`:229`（`clearSourceState`）、`:251`（`removeEnemyAffecting` 删）、`:365/370`（`refreshIndex` 读+删）——**无任何写入**。

逐字（`deleteEnemy` 的清理被整体跳过）：

```
150:    deleteEnemy(view: IEnemyView<TEnemy>): void {
151:        const store = this.enemyStore.get(view);
152:        if (!store) return;
153:        const collection = new Set<number>();
154:        for (const viewItem of store) {
155:            const affecting = this.viewStore.get(viewItem);
156:            if (!affecting) continue;
```
[VERIFIED: packages-user/data-system/src/combat/mapDamage.ts:150-156]

连带失效面（登记的「影响面」低估了）：`removeEnemyAffecting`（`:244-245` 同款 `viewStore.get` 守卫 → `refreshEnemyAndClearCache` 的「先清旧再加新」退化为「只加不清」）与 `refreshIndex` 的 `damageStore.get` 删除分支（`:365-370`）同样失效。只有 `point.damages.clear() + 由 affectedBy 重建`（`:372-377`）这条路径不依赖 store，因此仍能工作。

(c) 两条连贯修法，**必须在 D-09 汇报中二选一请用户裁决**（记录于 §Open Questions D）：

- **(A) 补齐 store 写入（完整设计，推荐）**：在 `refreshEnemy`（`:304-333`）与 `refreshEnemyAndClearCache`（`:261-299`）的 `if (damage)` 分支内同步登记：
  ```ts
  point.affectedBy.add(viewItem);
  point.damages.add(damage);
  // 记录伤害来源，供 deleteEnemy / removeEnemyAffecting 反向清理
  this.damageStore.set(damage, { sourceView: viewItem, sourceEnemy: view, index });
  const viewStore = this.viewStore.getOrInsertComputed(viewItem, () => ({
      damages: new Map(),
      enemy: view
  }));
  viewStore.damages.set(index, damage);
  ```
  并同步在 `refreshIndex`（`:356-378`）重建 `point.damages` 后**重新登记**同样的两项（否则下一次 `deleteEnemy` 仍会漏）。依据：`IViewStore.damages` 以索引为键（`:24`）与 `IDamageStore.index`（`:35`）1:1 对应，且 `createInfo` 每次返回**新对象**（`data-state/src/enemy/mapDamage.ts:67-80`），因此 `damage` 对象与索引天然一一对应，登记不会互相覆盖。
  - 边界与收益：`deleteEnemy`、`removeEnemyAffecting`、`refreshIndex` 三处既有实现**无需改动**即变得正确；代价是触及 3 个方法（其中 `refreshEnemy`/`refreshEnemyAndClearCache` 已是近乎重复的代码，可提取一个私有 `registerSourcedDamage(...)`，属 D-09 授权的「必要的内部重构」）。
  - 风险：`refreshIndex` 无既有测试断言 store 语义（仅 `mapDamage.test.ts:442-460` 断言 reducedCache 脏标记），登记逻辑只能靠人工推演；`refreshAll`→`clearSourceState`（`:227-234`）会清空三类 store，与登记不冲突。

- **(B) 只让 `deleteEnemy` 自足（最小）**：不动 store，改写 `deleteEnemy`，用 `viewItem.getRange()/getRangeParam()`（`FakeView` 已实现，`:146-152`）枚举受影响点位，删 `affectedBy` 后就地按剩余来源重算该点：
  ```ts
  for (const viewItem of store) {
      const range = viewItem.getRange();
      const param = viewItem.getRangeParam();
      range.bindHost(this.context);
      for (const index of range.iterateLoc(param)) {
          const point = this.sourcedDamage.get(index);
          if (!point) continue;
          if (!point.affectedBy.delete(viewItem)) continue;
          collection.add(index);
          const locator = this.indexer.indexToLocator(index);
          point.damages.clear();
          point.affectedBy.forEach(v => {
              const damage = v.getDamageWithoutCheck(locator);
              if (damage) point.damages.add(damage);
          });
      }
  }
  ```
  - 收益：改动面最小、skip 即转绿；`removeEnemyAffecting` 可复用同款逻辑（否则 `markEnemyDirty` 仍会累积旧伤害——现有 `mapDamage.test.ts:502-514` 因 `FakeView` 每次返回同值 `7` 而**无法发现**该残留）。
  - 代价：`viewStore`/`damageStore`/`IViewStore`/`IDamageStore` 成为无写入者的死结构。注意 D-06 只针对**错误码**（语义保留），私有字段的处置需用户明确。

(d) 既有测试风险（两方案共同）：**无**。`mapDamage.test.ts:517-529`（`ignores deleting an enemy without sourced damage`）依赖 `enemyStore.get(view)` 未命中即早退 —— 两方案都保留 `if (!store) return;` ✓。`:502-514`（`refreshes sourced damage when a registered enemy is marked dirty`）断言 `converter.calls === 2` 与伤害值 `7`，两方案均不改变转换器调用次数与值 ✓。`:410-440`（`converts sourced damage` / `unions sourceless and sourced`）只读 `getSeparatedDamage`，`refreshEnemy` 的 `enemyStore.set`（`:312`）保持不变 ✓。`:550-572`、`:575-590`、`:593-632`（叠加/混合）不调用 `deleteEnemy` ✓。

(e) 共享模式：**同根因家族**——`MapDamage` 的「来源→点位」反向索引半成品。方案 A 的一个私有登记助手可同时服务 `refreshEnemy` / `refreshEnemyAndClearCache` / `refreshIndex` 三处。

#### #06-01-3 — `CombatFlow` 战前脚本短路语义与文档相反（**含既有绿用例冲突**）

(a) 生产：`combat.ts:178-181`。契约事实源：`types.ts:771-779`。既有绿用例：`combat.test.ts:460-481`。待转绿：`combat.test.ts:483-501`。

(b) **已确认根因**：`if (skip) return damage;` 以**真值**短路。逐字：

```
178:        for (const script of this.scriptList) {
179:            const skip = await script.before(damage, handler);
180:            if (skip) return damage;
181:        }
```
[VERIFIED: packages-user/data-system/src/combat/combat.ts:178-181]

契约逐字（D-03 指定的事实源）：

```
771:    /**
772:     * 战前执行的内容，返回 `false` 会立刻停止后续战前内容的执行，并放弃此次战斗
```
[VERIFIED: packages-user/data-system/src/combat/types.ts:771-772]

(c) 最小修法（同时按 D-11 修正变量名与文档，使语义自解释）：

```ts
for (const script of this.scriptList) {
    const proceed = await script.before(damage, handler);
    if (!proceed) return damage;
}
```

**必须同步改动的既有绿用例（本研究新发现 1，D-09 汇报项）：** `combat.test.ts:460-481` 的 `short-circuits hooks and after scripts when before returns truthy` 用 `new FakeScript(1, 'script', fixture.calls, true)`（第 4 参 `beforeResult` 默认 `false`，见 `combat.test.ts:120-140`）并断言 `fixture.calls` 恰为 `['script.before']`。修后 truthy 不再短路 → 实际会是 `['script.before','hooks.onBeforeCombat','script.after','hooks.onAfterCombat']` → **该用例必红**。

建议处置（请在 D-09 汇报中请用户确认）：把该用例**改为互补分支断言**（保留唯一覆盖价值，不新增用例，符合 D-10）：
- 用例名/注释改为 `runs hooks and after scripts when before returns truthy`；
- 断言改为完整的四步调用顺序；
- `FakeScript` 的成员注释 `/** before 的返回值（真值表示短路） */`（`:120` 附近）与类注释同步改为「假值表示放弃战斗」（D-11）。

(d) 既有测试风险：除上述 `:460` 外无。`combat.test.ts:426-458`（`awaits the before script ...`）用默认真值 `false` → 修后 `!proceed` 为真 → 会在 `script.before` 处短路返回，于是 `:452-455` 的完整四步断言**同样会红**！

> **重要复核**：`FakeScript` 的 `beforeResult` 默认值是 `false`（`combat.test.ts:127`）。因此 `:426-458`（await 顺序用例）与 `:289-312`（优先级/重复用例：`expect(calls).toEqual(['high.before','low.before','high.after','low.after'])`）在修后都会因「第一个 before 返回 false 即放弃」而在 `high.before` 后终止。**这两条既有绿用例也必须同步把 `beforeResult` 显式置为 `true`**（或用 `new FakeScript(pri, label, calls, true)`），否则 `#06-01-3` 的修复会连带打红 3 条既有用例。凡「希望走完整战斗流程」的既有用例都必须显式传 `true`；`combat.test.ts:399-424`（`battles an unregistered computed enemy`）不注册脚本，不受影响。

这条连带影响面（3 条既有用例）是本研究最关键的排期输入：`#06-01-3` 的 PLAN 必须把「显式 `beforeResult=true` 化既有完整流程用例」列为独立任务，并在预执行汇报中一并说明。

(e) 共享模式：无。属契约实现取反。

#### #06-01-4 + #06-15-1 — `buildup()` 未在重建前 `reset()` 视图

(a) 生产：`context.ts:684-716`（基线清空在 `:690-695`）；对照路径 `refreshEnemy` 的 `:784`。测试：`damage.test.ts:677-718`（#06-01-4）、`context.test.ts:625-663`（#06-15-1）。

(b) **已确认根因**：`buildup()` 清空光环拓扑但**从不**调用 `EnemyView.reset()`；`refreshEnemy` 会。逐字：

```
690:        this.needUpdate = false;
691:        this.sortedAura.clear();
692:        this.convertedAura.clear();
693:        this.dirtyEnemy.clear();
694:        this.needTotallyRefresh.clear();
695:        this.requestedCommonContext.clear();
```
[VERIFIED: packages-user/data-system/src/combat/context.ts:690-695]

```
780:    private refreshEnemy(view: EnemyView<TEnemy>): void {
781:        const locator = this.getEnemyLocatorByView(view);
782:        if (!locator) return;
783:
784:        view.reset();
```
[VERIFIED: packages-user/data-system/src/combat/context.ts:780-784]

`EnemyView.reset()` 的实现是 `this.computedEnemy.copyFrom(this.baseEnemy)`（`combat/enemy.ts:15-17`），而 `Enemy.copyFrom`（`data-base/src/enemy/enemy.ts:77-84`）会 `cloneAttributes()` 并重建特殊属性集 —— 因此它正是「回到原始怪物」的既有正确工具。

(c) 最小修法：在 `:695` 之后、各效果阶段之前，对全部视图重置一次（**无条件**，不能挂在 `hasAura || hasSpecialQuery` 之下，因为 `buildupQuery`/`buildupFinal` 也会在上一轮构建的数值上叠加）：

```ts
for (const view of this.enemyViewMap.values()) {
    view.reset();
}
```

一致性验证（本会话逐条复核）：

| 用例 | 模式 | 修后结论 |
|------|------|---------|
| `damage.test.ts:677`（#06-01-4，skip） | buildup → addAura(+10) → buildup，期望 `2+5+10=17` | `reset` 后 computed 回到 base（atk 2，含 special 20），再施加转换器光环 +5 与全局光环 +10 → **17** ✓ |
| `damage.test.ts:612`（绿） | buildup → `setEnemyAt(更强怪)` → buildup，期望 `50` | 第二轮的旧视图已被 `deleteEnemyAt` 移除，新视图本为新克隆；`reset` 为幂等 no-op → `(20+5)*2 = 50` ✓ |
| `context.test.ts:625`（#06-15-1，skip） | `FakeConverter([])` + addAura → buildup → `deleteAura` → buildup，期望回到 `2` | `reset` 后 computed=base（2）；无全局光环、无匹配 special → 无效果施加 → **2** ✓ |
| `context.test.ts:593/666/698`（绿，三种范围） | 单次 buildup | `reset` 对全新/未构建视图为幂等 ✓ |
| `context.test.ts:1026/1067/1101/1138/1199/1271/1388/1420`（绿，告警 97/98/99/100） | 单次 buildup（告警来自 `buildupSpecials` 内部） | `buildupSpecials` 读取的 `view.getComputingEnemy()` 现在是 base 克隆，特殊属性集与 base 一致 → 转换器命中集合不变 ✓ |
| `context.test.ts:1450/1486`（绿，告警 101） | buildup → markDirty → requestRefresh（**无二次 buildup**） | `convertedAura` 在两次 `buildup` 之间保留，`refreshEnemy` 路径不变 ✓ |

(d) 既有测试风险：**低**（上表全量复核）。唯一需要留意的是「跨多次 `buildup` 期望状态累积」的用例——本会话确认**不存在**此类用例（所有多 `buildup` 用例都期望「从原始怪物重算」）。`context.clear()`/`resize()` 会清空 `enemyViewMap`，循环天然安全。

(e) 共享模式：**是**——`refreshEnemy` 的 `reset()` 是范式；修复即把该范式提升为全量构建的公共前置。`#06-15-1` 不另立修法，随本条转绿（D-01）。

### enemy 计划（`data-base/src/enemy`）

#### #06-03-1 — `createEnemy`/`createEnemyById` 未走复用映射

(a) `manager.ts:119-129`；对照正确实现 `internalGetPrefab` `:131-139`、`getPrefab` `:165-168`。测试：`manager.test.ts:272-279`、`282-345`（G-06-03-A 四朝向复用）。

(b) **已确认根因**：两条创建路径直接查 `prefabByCode`/`prefabById`，绕过复用解析。逐字：

```
119:    createEnemy(code: number): IEnemy<TEnemy> | null {
120:        const prefab = this.prefabByCode.get(code);
121:        if (!prefab) return null;
122:        return prefab.clone();
123:    }
124:
125:    createEnemyById(id: string): IEnemy<TEnemy> | null {
126:        const prefab = this.prefabById.get(id);
127:        if (!prefab) return null;
128:        return prefab.clone();
129:    }
```
[VERIFIED: packages-user/data-base/src/enemy/manager.ts:119-129]

```
131:    private internalGetPrefab(code: number | string) {
132:        if (typeof code === 'number') {
133:            const sourceCode = this.reuseByCode.get(code) ?? code;
134:            return this.prefabByCode.get(sourceCode) ?? null;
135:        } else {
136:            const sourceId = this.reuseById.get(code) ?? code;
137:            return this.prefabById.get(sourceId) ?? null;
138:        }
139:    }
```
[VERIFIED: packages-user/data-base/src/enemy/manager.ts:131-139]

(c) 最小修法（D-08 明确允许「改用 `internalGetPrefab`」）：

```ts
createEnemy(code: number): IEnemy<TEnemy> | null {
    const prefab = this.internalGetPrefab(code);
    if (!prefab) return null;
    return prefab.clone();
}

createEnemyById(id: string): IEnemy<TEnemy> | null {
    const prefab = this.internalGetPrefab(id);
    if (!prefab) return null;
    return prefab.clone();
}
```

`internalGetPrefab` 声明在 `:131`（两条方法之后）——类成员提升，无需调整顺序。`getPrefab` 返回 `IReadonlyEnemy`，而 `internalGetPrefab` 返回 `IEnemy | null`，`.clone()` 可用，无需类型断言（`dev.md` 禁 `as` 链）。

(d) 既有测试风险：**无**。对未注册复用映射的 code/id，`internalGetPrefab` 退化为原查找 → 行为完全一致。调用方全量：`data-state/test/dataClosure.test.ts:104`、`enemyCombination.test.ts:214/230`、`manager.test.ts:194/203/205/219/277/307/332`、`manager.test.ts` 的 `saveLoad.test.ts:241-242`（`addPrefab`+`createEnemy(9)` 期望 null ✓）。`deletePrefab`（`:175`）与 `modifyPrefabAttribute`（`:214`）**已在用** `internalGetPrefab`，本次是消除不一致而非引入新语义。

(e) 共享模式：**是**——「所有按 code/id 取模板的公开入口都必须经 `internalGetPrefab`」。计划内可加一行注释说明该不变式（注释须有信息量，符合 `dev.md`）。

### replay 计划（`data-common/src/replay`）

> **共同根因（本研究新发现 3）**：`indexArray[i]` 存的是**第 i 条命令的参数起始字节**，而 `delete`/`insert`/`set` 多处把它当作**命令索引**使用；且末条命令缺少终点哨兵（`indexArray[length]` 恒为 0）。建议在计划内落一个私有助手统一「参数范围」：
> ```ts
> /** 获取指定命令在参数缓冲区中的字节区间 [start, end) */
> private getParamRange(index: number): { start: number; end: number } {
>     const start = this.indexArray[index];
>     const end = index + 1 < this.length ? this.indexArray[index + 1] : this.paramUsed;
>     return { start, end };
> }
> ```
> `paramUsed` 是权威的「已用字节数」（`:63`、`:406`、`:456`、`:495`、`:766` 维护），用作末步终点哨兵可同时修掉「删除末步」路径（当前 `indexArray[length] === 0` 会让 `paramLength = -paramStart`）。

#### #06-04-1 — int64 解码乘数

(a) `array.ts:621`（编码侧 `:369-372`）。测试：`array.test.ts:287-291`。

(b) **已确认根因**：乘数写成 `2^31 - 1`。逐字：

```
616:        } else if (type === 4) {
617:            // 4 - int64
618:            const low = this.paramView.getInt32(startIndex + 1);
619:            const high = this.paramView.getInt32(startIndex + 5);
620:            byte = 9;
621:            value = low + high * 2147483647;
622:        }
```
[VERIFIED: packages-user/data-common/src/replay/array.ts:616-622]

编码侧逐字（`Math.floor(num / 2147483648)` / `num % 2147483648`）：
```
369:                const high = Math.floor(num / 2147483648);
370:                const low = num % 2147483648;
```
[VERIFIED: packages-user/data-common/src/replay/array.ts:369-370]

本会话以 node 复算：`num = 2147483648 → high=1, low=0`；旧解码 `0 + 1*2147483647 = 2147483647`（与登记一致）；新解码 `2147483648` ✓。同法验证 `9007199254740991 (2^53-1)`：旧 `9007199250546688`（错），新 `9007199254740991`（对）。

(c) 最小修法：`:621` → `value = low + high * 2147483648;`

(d) 既有测试风险：**无**。`array.test.ts:259-266`（`round-trips every integer width and float`）的 `paramCases` 最深到 `±2147483648` 边界（type 3 int32），**不含 type 4 用例**（见 `:82-96` 注释「int64 见 #06-04-1 跳过」）✓。`warns code 152`/`151`/`148` 与位宽用例不受影响。

> **相邻潜在缺陷（不属本阶段 20 条，勿自行扩大范围）**：同一编码对**负 int64** 仍不可逆。node 复算：`enc(-2147483649)` 得 `high=-2, low=-1`（`Math.floor(-1.0000000005) = -2`，JS `%` 取被除数符号），新解码 `-1 + (-2)*2^31 = -4294967297 ≠ -2147483649`。修 `#06-04-1` 的常量不会改变这一路径（登记亦未要求）。列入 §Open Questions A。

(e) 共享模式：与 #06-04-2 同属「`decodeParam`/`normalizeParam` 编解码正确性」，但**常量与循环是两个独立补丁**，建议分两个原子提交（D-13）。

#### #06-04-2 — 多字节 bigint 编码/解码

(a) 编码 `array.ts:255-275`（循环 `:264-270`）；解码 `:626-635`。测试：`array.test.ts:278-284`（单条 skip）、`:294-304`（异质混排 skip，依赖本条 + #06-04-1）。

(b) **已确认根因（两处，均在登记范围内）**：

编码逐字：
```
264:            let total = 0n;
265:            for (let i = 0; i < length; i++) {
266:                const base = param - total;
267:                const remain = base % 256n;
268:                total += remain << (BigInt(i) * 8n);
269:                arr[i] = Number(remain);
270:            }
```
[VERIFIED: packages-user/data-common/src/replay/array.ts:264-270]

`total` 只在 i=0 时影响 `base`（`total = remain ≪ 0 = 最低字节`），i≥1 时 `param - total` 仍是原值？——不：`total` 被更新为**最低字节的值**，故 i≥1 时 `base = param - LSB`，`base % 256n` 仍等于 LSB（因为 `param - LSB` 是 256 的倍数）→ `remain` 恒为同一最低字节。**实际效果是与登记一致：除最低字节外全写 0 或重复 LSB**。

解码逐字（有符号读导致 ≥0x80 的字节被符号扩展）：
```
628:            const length = this.paramView.getInt8(startIndex + 1);
629:            let base = 0n;
630:            for (let i = 0; i < length; i++) {
631:                const num = this.paramView.getInt8(startIndex + 2 + i);
632:                base += BigInt(num) << (8n * BigInt(i));
633:            }
```
[VERIFIED: packages-user/data-common/src/replay/array.ts:626-633]

长度前缀由 `setParamArray` 以无符号写入（`this.paramArray[index + 1] = arr.length`，`:378`），但读取用 `getInt8` → 长度 ≥ 128 时读出负数。

(c) 最小修法（4 行）：
```ts
// 编码（替换 :264-270 的 total/base/remain 循环体）
arr[i] = Number((param >> (8n * BigInt(i))) & 0xffn);
```
```ts
// 解码
const length = this.paramView.getUint8(startIndex + 1);          // 原 getInt8
const num = this.paramView.getUint8(startIndex + 2 + i);        // 原 getInt8
```
`byteLength: arr.length + 2`（`:274`）与 `arr.length` 计算（`:261-263`）保持不变。本会话以 node 验证 `0x0102030405060708n` 的 `length = ceil(57/8) = 8`，按位取字节得 `[08,07,06,05,04,03,02,01]`，`getUint8` 累加即还原原值。

(d) 既有测试风险：**无**。绿用例 `round-trips a single byte bigint`（`:269-275`，`100n` → 单字节 `0x64 < 0x80`，`getUint8`/`getInt8` 同值）✓；`warns code 152 for an out-of-range bigint`（`:371-376`，只断言告警码）✓；`round-trips a boolean, integer, string and bigint in one step`（`:335-340`，`100n`）✓。

> **相邻潜在缺陷**：负 bigint（如 `-1n` → `toString(2)` 得 `"-1"`，`length=1`，按位取字节得到 `0xff`，解码得 `255n`）仍不可往返。无既有测试覆盖。列入 §Open Questions B。

(e) 共享模式：与 #06-04-1 同为 `normalizeParam`/`decodeParam` 家族，建议同一 PLAN 内两个原子提交。

#### #06-04-3 — `delete` 的索引回退起点与末步终点

(a) `array.ts:442-474`（起点 `:446-448`、回退循环 `:468-471`）。测试：`array.test.ts:211-221`、`511-520`。

(b) **已确认根因**：回退循环以 `paramStart`（**参数字节偏移**）作为遍历起点，而它应当以 `index`（**命令索引**）为起点。逐字：

```
446:        const paramStart = this.indexArray[index];
447:        const nextParam = this.indexArray[index + 1];
448:        const paramLength = nextParam - paramStart;
```
```
468:        // 最后把后面的索引减少 paramLength
469:        for (let i = paramStart; i < this.length; i++) {
470:            this.indexArray[i] -= paramLength;
471:        }
```
[VERIFIED: packages-user/data-common/src/replay/array.ts:446-448, 468-471]

**为何 `delete(0)` 一直绿**：当 `index === 0` 时 `paramStart === indexArray[0] === 0`，与命令索引 0 巧合相等，循环起点因此正确 —— 这是既有绿用例（`:198-208`、`:484-495`）掩盖缺陷的原因。`delete(1)` 时 `paramStart = indexArray[1] = 2`，循环从 i=2 开始，漏掉索引 1 → 后续步骤读到错误参数（与登记一致）。

**第二个缺陷（登记的建议方向已点到）**：末步删除时 `indexArray[index + 1] === indexArray[length] === 0` → `paramLength = -paramStart`（负数）→ `paramArray.copyWithin(paramStart, 0)` 整段搬家。

(c) 最小修法（两行，含哨兵）：
```ts
const nextParam =
    index + 1 < this.length ? this.indexArray[index + 1] : this.paramUsed;
...
for (let i = index; i < this.length; i++) {
    this.indexArray[i] -= paramLength;
}
```

(d) 既有测试风险：**无**。`delete(0)` 路径修后等价（`i = index = 0` 与修前的 `i = paramStart = 0` 同值）→ `array.test.ts:198-208` 与 `:484-495` 保持绿。`array.test.ts:211-221`（中间步）与 `:511-520`（异质中间步）是 skip 转绿目标。末步哨兵没有既有用例（新增路径，无回归风险）。

(e) 共享模式：**是**——见本节开头的 `getParamRange` 私有助手；`delete` 与 `set`（`:476-513`）共用同一段「取 next 端点」代码，建议一并改（`set` 属未登记缺陷，见 §Open Questions C）。

#### #06-04-4 — `insert` 的位移方向（**两处**）

(a) `array.ts:412-440`（`paramArray` 方向 `:424`、`indexArray` 位移 `:425`、尾段补偿 `:435-437`）。测试：`array.test.ts:498-508`、`523-539`。

(b) **已确认根因（比登记多一处）**：登记只指出 `paramArray.copyWithin` 方向相反；本会话复核发现 `indexArray.copyWithin(index, index + 1)` **同样方向相反**——它把「插入位」的索引覆盖为后一条命令的起始偏移，而插入命令的起始偏移恰好等于移位前 `indexArray[index]`（即不需要改动 `indexArray[index]`）。逐字：

```
422:        const paramStart = this.indexArray[index];
423:        this.commandArray.copyWithin(commandStart + commandSize, commandStart);
424:        this.paramArray.copyWithin(paramStart, paramStart + length);
425:        this.indexArray.copyWithin(index, index + 1);
426:
427:        // 然后进行赋值操作，索引数组因为这一个指令的起始索引其实没变，所以不需要赋值
```
[VERIFIED: packages-user/data-common/src/replay/array.ts:422-427]

关于测试覆盖的精确结论（**必须让用户知道**）：
- `array.test.ts:498-508` 与 `:523-539` 只用 `createReadStream` 顺序读取，读流的 `currParam` 是**顺序累加**（`:727-730`），完全不依赖 `indexArray[i]` 的绝对正确性 → **只修 `:424` 就能转绿**。
- 但 `array.get(i)` 依赖 `indexArray[i]`：只修 `:424` 时，`insert(1, 2, [20])` 后 `indexArray[1]` 会变成 `indexArray[2]`（未初始化 0）→ `get(1)` 读到第 0 步的参数。
- 现有绿用例 `array.test.ts:185-195` 之所以掩盖该缺陷：`add(1,[])` / `add(3,[])` 的参数长度为 0，使 `indexArray[index]` 与 `indexArray[index+1]` 同为 0，两种位移结果**同值**。

(c) 最小修法（两行）：
```ts
this.paramArray.copyWithin(paramStart + length, paramStart);
this.indexArray.copyWithin(index + 1, index);
```
`:435-437` 的尾段补偿循环（`for (let i = index + 1; i < this.length; i++) this.indexArray[i] += length;`，在 `this.length++` 之后执行）在修正后的位移方向上恰好覆盖 `[index+1, newLength-1]`，无需再改 ✓（本会话按 `[0,2]` + `insert(1,…,[20])` 逐位手算：结果 `indexArray = [0,2,4]`，`get(0/1/2)` 分别读到 `[10]`/`[20]`/`[30]`）。

(d) 既有测试风险：**无**。绿用例 `:185-195` 两行都改后仍绿（手算 `indexArray = [0,0,2]`，与修前一致）；`insert` 仅被 `:185`、`:498`、`:523` 三处使用。`insert(index === length)`（末位追加）仍因 `indexArray[length] === 0` 而错（`paramStart = 0`）——无既有用例，属与 #06-04-3 同族的未登记缺口，列入 §Open Questions C。

(e) 共享模式：**是**——同 `getParamRange` 家族；`insert` 的 `paramStart` 也应改为末步感知（`index === this.length` 时取 `paramUsed`）。

### hero 计划（`data-base/src/hero`）

#### #06-05-1 — 无修饰器时 `recalculateAttribute` 提前返回

(a) `attribute.ts:80-98`（提前返回 `:81-82`）。测试：`attribute.test.ts:115-121`。

(b) **已确认根因**：逐字：

```
80:    private recalculateAttribute<K extends keyof THero>(name: K): void {
81:        const modifierList = this.modifier.get(name);
82:        if (!modifierList) return;
```
[VERIFIED: packages-user/data-base/src/hero/attribute.ts:80-82]

`set`/`add`/`mul`/`div`（`:131-149`）全部经 `markDirty`（`:227-229`）落到此处；无修饰器时直接返回，`finalAttribute`（构造时 `structuredClone`，`:62`）永不刷新。

(c) 最小修法：
```ts
const modifierList = this.modifier.get(name);
if (!modifierList) {
    this.finalAttribute[name] = this.attribute[name];
    return;
}
```
引用语义说明（避免误判为「应深拷贝」）：有修饰器时 `let value = baseValue`（`:85`）本身就是同引用起点，且 `isSameReference` 告警分支（`:89-93`）证明「对象属性同引用」是既有约定，因此无修饰器时同引用赋值与既有语义一致。

(d) 既有测试风险：**无**。`attribute.test.ts:96-112`（有修饰器）路径不变；`:124-128`（`returns safe defaults`）不读 final；`:171-186`（`deleteModifierByIndex` 后不再断言 final）不受影响；`:247-259`（`catchCalculateProgress`）**未改动**（该方法另有提前返回 `:101-102`，是生成器且不写 final，保留原样）；`:262-269`（告警 109）走有修饰器分支。

(e) 共享模式：无。可考虑把「无修饰器时 final=base」的不变式以一行注释说明（D-11）。

#### #06-05-2 — `getCouldEquipSlot` 空槽判断写反

(a) `equipment.ts:134-150`（条件 `:141`）。测试：`equipment.test.ts:290-303`。（登记的「模块/接口」写作 `HeroEquipment.equip` 的字符串槽位分支，实际缺陷位于其私有依赖 `getCouldEquipSlot`。）

(b) **已确认根因**：逐字：

```
137:        let empty = -1;
138:        this.slots.forEach((name, index) => {
139:            if (name !== slot) return;
140:            if (first === -1) first = index;
141:            if (empty !== -1 && !this.equips.has(index)) {
142:                empty = index;
143:            }
144:        });
145:        if (empty === -1) {
146:            return first;
147:        } else {
148:            return empty;
149:        }
```
[VERIFIED: packages-user/data-base/src/hero/equipment.ts:137-149]

`empty` 初值 `-1`，`empty !== -1` 在首次命中时恒假 → `empty` 永远是 `-1` → `:146` 恒返回 `first`（第一个匹配槽位），**「占用空槽」分支（`:148`）成为死代码**。与登记一致；同时解释了 `equip`（`:179`）为何总是替换首个匹配槽。

(c) 最小修法（`:141` 条件取反）：
```ts
if (empty === -1 && !this.equips.has(index)) {
```

(d) 既有测试风险：**无**（逐条复核）：
- `equipment.test.ts:173-185`（`equips into an empty slot`，`slots=['weapon']`，槽 0 空）：修后 `first=0, empty=0` → 返回 0 ✓。
- `:186-201`（`replaces the occupant`，单槽已占）：`empty` 保持 -1 → 返回 `first=0` ✓。
- `:202-236`（autoUnload 两例，数字槽）：走 `typeof slot === 'number'` 早退（`:135`）✓。
- `:275-287`（`lists slots in order`，数字槽）：同上 ✓。
- `:143-168`（`classifies equip status`，只调 `canEquipTo`，未改）✓。
- `canEquipTo` 的字符串分支（`:50-72`）自行计算 `hasEmpty`，逻辑本身正确，**不要**顺带重构。

(e) 共享模式：无（与 `#06-05-3` 的 147 分支虽同文件，但按 D-06 不联动，见下）。

#### #06-05-3 — 码 147 保留（**不做生产改动**）

(a) 生产：`equipment.ts:152-197`（147 分支位于 `:180-184`）；测试 `equipment.test.ts:306-315`。

(b) 本会话复核的可达性证明（与登记一致，用于向用户复述）：`canEquipTo(uid, slot)`
- 数字槽：`slots.includes(slot)` 通过后必返回 `CanEquip`/`NeedReplace`，而 `getCouldEquipSlot(number)` 直接返回 `slot`（`:135`）→ 永不为 -1；
- 字符串槽：`hasSlot === false` → `CannotEquip`（`:69`）→ `equip` 在 `:157-159` 提前返回；`hasSlot === true` → `getCouldEquipSlot` 至少命中一次 `name === slot`，`first !== -1`（`:140`）→ 返回 `first`（修 #06-05-2 后可能是 `empty`，同样非 -1）。
故 `available === -1`（`:180`）不可达，147 为保留码。

(c) 处置（D-06，**逐字执行**）：生产代码**不动**、**不标死码**；`:305-315` 的 `it.skip` **保留**并补充中文注释说明「147 为保留错误码，当前不可达，设计如此」，不纳入取消 skip 清单。本会话确认码表文案为 `147: No available equipment slot to equip $1.`（`packages/common/src/logger.json`），语义完整、保留合理。

(d) 既有测试风险：无（无代码改动）。

(e) 共享模式：与 #06-05-2 同文件但**禁止联动**——D-06 明确「什么都不要动」。计划中应显式写明「本任务只改注释」以免执行者顺手补齐 147 诊断。

#### #06-09-1 — `EquipmentState` 读档丢加成（含压缩档无回退基准）

(a) `equipStore.ts:116-126`（`loadNoCompression`）、`:132-151`（`loadDiff`）、`:80-102`（`saveDiff` 对照）。测试：`hero/saveLoad.test.ts:330-334`（绿，NoCompression 百分比）、`:337-341`、`:344-348`、`:351-366`、`:369-381`（4 条 skip）。

(b) **已确认根因（两处）**：

`loadNoCompression` 首个循环遍历了 `state.percentage` 而非 `state.value`。逐字：
```
116:    private loadNoCompression(state: IEquipmentStateSave<THero>): void {
117:        this.value.clear();
118:        this.percentage.clear();
119:        for (const [name, value] of state.percentage) {
120:            this.value.set(name, value);
121:        }
122:        for (const [name, value] of state.percentage) {
123:            this.percentage.set(name, value);
124:        }
125:        this.rebuildModifiers();
126:    }
```
[VERIFIED: packages-user/data-base/src/hero/equipStore.ts:116-126]

`loadDiff` 先 `clear()` 再用**存档差异**重建，且 :135-140 的两个循环同样误用 `state.percentage`；缺的正是「以 `item.equip` 原始定义为基准」。逐字：
```
132:    private loadDiff(state: IEquipmentStateSave<THero>): void {
133:        this.value.clear();
134:        this.percentage.clear();
135:        for (const [name, value] of state.percentage) {
136:            this.value.set(name, value);
137:        }
138:        for (const [name, value] of state.percentage) {
139:            this.percentage.set(name, value);
140:        }
141:
142:        // 差异内容
143:        for (const [name, value] of state.value) {
144:            this.value.set(name, value);
145:        }
146:        for (const [name, value] of state.percentage) {
147:            this.percentage.set(name, value);
148:        }
149:
150:        this.rebuildModifiers();
151:    }
```
[VERIFIED: packages-user/data-base/src/hero/equipStore.ts:132-151]

`saveDiff`（`:80-102`）只写「与 `item.equip` 不同」的条目 → 读档**必须**以 `item.equip` 为基准。逐字基准引用：
```
81:        const { value, percentage } = this.item.equip;
```
[VERIFIED: packages-user/data-base/src/hero/equipStore.ts:81]

(c) 最小修法：
```ts
private loadNoCompression(state: IEquipmentStateSave<THero>): void {
    this.value.clear();
    this.percentage.clear();
    for (const [name, value] of state.value) {
        this.value.set(name, value);
    }
    for (const [name, value] of state.percentage) {
        this.percentage.set(name, value);
    }
    this.rebuildModifiers();
}

private loadDiff(state: IEquipmentStateSave<THero>): void {
    this.value.clear();
    this.percentage.clear();
    // 基准为装备原始定义，再叠加存档中的差异条目
    for (const [name, value] of this.item.equip.value) {
        this.value.set(name, value);
    }
    for (const [name, value] of this.item.equip.percentage) {
        this.percentage.set(name, value);
    }
    for (const [name, value] of state.value) {
        this.value.set(name, value);
    }
    for (const [name, value] of state.percentage) {
        this.percentage.set(name, value);
    }
    this.rebuildModifiers();
}
```

本会话对 5 条相关用例的逐条推演（`modifier.setValue()` **不会**回写 `state.value/percentage` 映射，这是理解这些用例的关键）：

| 用例 | 存档内容 | 修后结果 |
|------|---------|---------|
| `:330-334` NoCompression 百分比（绿） | `value={}`, `percentage={hp:0.5}` | `percentage={hp:0.5}` → 修饰器值 `0.5` ✓（与修前同值，绿保持） |
| `:351-366` NoCompression 数值（skip） | `value={atk:5}`, `percentage={}` | `value={atk:5}` → `5`（期望 5）✓ 修前 `state.percentage` 被误写入 value → 两张表皆空 → `undefined` |
| `:337-341`/`:344-348` 压缩档百分比（skip） | 差异为空（0.5 未变） | 回退 `item.equip.percentage` → `0.5` ✓ |
| `:369-381` 压缩档未修改数值（skip） | 差异为空 | 回退 `item.equip.value` → 修饰器名 `['atk']` ✓ |

(d) 既有测试风险：**低**（已逐条复核）。`hero/saveLoad.test.ts:386-401`（`restores equipment instances and the uid counter across all compressions`）只断言 `uid`/`nextUid`，与修饰器内容无关 ✓；`:510-538`（`HeroState` 属性/修饰器）**不含任何装备**（未调用 `equip`）✓；`:541-558` 只涉及 `IHeroAttribute` 自身的修饰器 ✓；`equipStore.test.ts:222` 只测构造 ✓。

> **相邻语义待确认（不属本阶段，勿自行扩大）**：`HeroEquipment.loadState`（`equipment.ts:336-346`）以 `equip(uid, index)` **数字槽**回装，而 `canEquipTo` 对数字槽要求 `item.equip.slots.includes(index)`（`:39`）。若某装备定义只声明字符串槽（如 `['weapon']`）而存档槽位索引为 0，读档会静默丢弃该装备。现有相关用例的装备定义均为 `slots=[0]`，故未暴露。列入 §Open Questions E。

(e) 共享模式：与 #06-09-2 同属「装备存读档」，可在同一 PLAN 内相邻提交，但**根因不同，须分两个 commit**（D-13）。

#### #06-09-2 — `HeroEquipment.saveState` 未深拷贝

(a) `equipment.ts:329-334`。测试：`hero/saveLoad.test.ts:312-325`（skip）、`:589-609`（skip，容器三档）。

(b) **已确认根因**：逐字：

```
329:    saveState(): IHeroEquipmentSave {
330:        return {
331:            equipped: this.equips,
332:            slots: this.slots
333:        };
334:    }
```
[VERIFIED: packages-user/data-base/src/hero/equipment.ts:329-334]

契约逐字（**这是 D-11 的事实源**）：

```
12:export interface ISaveableContent<T> {
13:    /**
14:     * 保存对象状态，返回的对象应该经过深拷贝（即 `structuedClone`）
15:     * @param compression 压缩级别
16:     */
17:    saveState(compression: SaveCompression): T;
```
[VERIFIED: packages-user/data-common/src/save/types.ts:12-17]

`loadState`（`:336-346`）会 `this.slots.length = 0` 后从 `state.slots` 读回、`this.equips.clear()` 后再装 —— 由于 `state.slots` 与 `this.slots` 同引用，先清空即等于清空存档本身，故 `:312-325` 的失败链路为：`unequip(0)` 污染同一 Map → `loadState` 读到空 → `getEquipped(0)` 为 `undefined`。

(c) 最小修法：
```ts
saveState(): IHeroEquipmentSave {
    return {
        equipped: new Map(this.equips),
        slots: [...this.slots]
    };
}
```
类型兼容：`IHeroEquipmentSave.equipped` 为 `ReadonlyMap<number, number>`（`hero/types.ts:673`）、`slots` 为 `readonly string[]`（`:675`），`Map`/数组均满足，无需 `as`。

(d) 既有测试风险：**无**。`:294-309`（绿）本身就先 `structuredClone(env.equipment.saveState())`，修后照常 ✓；`HeroState.saveState`（`state.ts:169`）仅把返回值放入快照对象（`IHeroStateSave.equip`，`hero/types.ts:800`），未见依赖「同引用」的调用方（全仓 `equip.saveState` 仅此一处）；`HeroEquipment.loadState` 的语义不变 ✓。

(e) 共享模式：与 #06-09-1 同系统，建议相邻提交、分开 commit。

### map 计划（`data-base/src/map`）

#### #06-06-1 — 越图 `transferToDynamic` 发错诊断码

(a) 生产：`mapLayer.ts:435-458`（告警点 `:441`）。对照：`transferToStatic` `:467`、`transferToStaticIfSafe` `:487`。测试：`mapLayer.test.ts:419-427`（skip）、`:408-416`（绿，只断言 null）。

(b) **已确认根因**：逐字：

```
440:        if (!this.inMap(x, y)) {
441:            logger.warn(131, x.toString(), y.toString());
442:            return null;
443:        }
```
[VERIFIED: packages-user/data-base/src/map/mapLayer.ts:440-443]

对照逐字：
```
466:        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
467:            logger.warn(128, x.toString(), y.toString());
```
[VERIFIED: packages-user/data-base/src/map/mapLayer.ts:466-467]

码表文案（L0 权威源）：`131: Cannot set event layer since target map layer does not belongs to current GameMap instance.`、`128: Cannot transfer $1 to $2, since target position $3,$4 out of bounds.` [VERIFIED: packages/common/src/logger.json]（131 的语义是 `setEventLayer` 越权，与越界转换无关。）

(c) 最小修法（D-04）：`:441` → `logger.warn(128, x.toString(), y.toString());`（与两个 `transferToStatic*` 分支**逐字一致**，含参数个数）。

> 可选（需在 D-09 汇报中询问，默认不做）：128 的文案含 4 个占位符，而三个越界分支都只传 2 个参数；`logger.parseInfo` 对缺失参数填充 `'[not delivered]'`（`packages/common/src/logger.ts:101`）。修 `#06-06-1` 会**继承**这一既有小瑕疵（`transferToStatic` 早已如此）。若要顺手补齐（传 `x, y, x, y`），属超出本条范围的改动，应由用户决定。

(d) 既有测试风险：**无**。全仓对码 `131` 的测试断言**唯一**在 `gameMap.test.ts:185`（`setEventLayer` 外部图层路径，`gameMap.ts:149`），与 `mapLayer.transferToDynamic` 无关；生产侧码 131 的写入点全仓仅 `mapLayer.ts:441` 与 `gameMap.ts:149`，本改动只去掉前者。绿用例 `mapLayer.test.ts:408-416` 只断言 `ret === null` 且不断言码集合 ✓。`mapLayer.test.ts:397-406`（告警 127）走 `num === 0` 分支（`:445-447`），不在本次分支 ✓。

(e) 共享模式：无（单点 + 与相邻分支对齐）。

#### #06-09-3 — `DynamicTile.loadState` 不恢复 `num`

(a) `dynamicTile.ts:118-127`；`set` 参照 `:56-66`。测试：`map/saveLoad.test.ts:164-173`（skip）、`:142-161`（绿）。

(b) **已确认根因**：逐字：

```
118:    loadState(save: Readonly<IDynamicBlockSave>): void {
119:        this.restoreDefaultEvents();
120:        if (save.events) {
121:            const eventView = this.tileEvent();
122:            eventView.clear();
123:            for (const [priority, id] of save.events) {
124:                eventView.set(priority, id);
125:            }
126:        }
127:    }
```
[VERIFIED: packages-user/data-base/src/map/dynamicTile.ts:118-127]

存档形状确认（`num` 为必填）：
```
32:export interface IDynamicBlockSave extends IMapBlockSaveBase {
33:    /** 此动态图块的图块数字 */
34:    readonly num: number;
35:}
```
[VERIFIED: packages-user/data-base/src/map/types.ts:32-35]

`MapLayer.loadDynamics`（`mapLayer.ts:841-849`）先 `createDynamic(block.num, x, y)` 再 `tile.loadState(block, …)`，因此**图层路径**掩盖了该缺陷（与登记一致）。

(c) 最小修法（`this.set(num)` 已内含 `restoreDefaultEvents()`，见 `:56-66`）：
```ts
loadState(save: Readonly<IDynamicBlockSave>): void {
    this.set(save.num);
    if (save.events) {
        const eventView = this.tileEvent();
        eventView.clear();
        for (const [priority, id] of save.events) {
            eventView.set(priority, id);
        }
    }
}
```
签名说明：`IDynamicTile extends ISaveableContent<...>`（`map/types.ts:147-152`），契约的 `loadState(state, compression)` 允许实现省略后置未用参数（`dev.md`「未使用的后置参数直接不填」）；`MapTileBase` 的抽象声明同样只有 1 参（`tile.ts:76`）——**不要**为它补 `compression` 参数。

(d) 既有测试风险：**无**（逐条复核）：
- `map/saveLoad.test.ts:142-161`（绿）：`saved.num === 1` 且当前 `tile.num() === 1` → `set(1)` 后事件为默认 `{10:'base-event'}`，再叠加 `{30:'override-event'}` → 断言一致 ✓。
- `mapLifecycle.test.ts:126-132`（绿）：`cleanSave.events` 为 `undefined`，`num = 2`（此前调过 `set(2)`）→ `set(2)` → 事件 `{20:'alternate-event'}`、`dirty() === false` ✓（`restoreDefaultEvents` 末尾 `markPure`）。
- `mapLifecycle.test.ts:134-148`（绿）：`overrideSave.num = 2` → `set(2)` 后清空并写回 `{20, 30}` → `dirty() === true` ✓。
- `MapLayer` 三档往返（`map/saveLoad.test.ts:178-201`）经 `loadDynamics` 的 `createDynamic(num)` + `loadState` 幂等 ✓。

(e) 共享模式：无（与 #06-09-2 同属「读档漏字段」家族，可共用一条检查清单：**逐个 save 字段核对是否被 `loadState` 消费**）。

### flag + common 计划（`data-common/src/common`）

#### #06-08-1 — `ObjectMover.backward(count>1)` 方向摆动

(a) `mover.ts:492-503`（后退分支 `:494-497`）、`getCurrentDirection` `:464-473`、`forward` `:579-587`、`backward` `:589-597`、`start()` 的 `moveDirection` 归一 `:687`。测试：`mover.test.ts:307-319`（skip）、`:292-304`（绿，单步）。

(b) **已确认根因**：逐字：

```
492:            case ObjectMoveType.Special: {
493:                const dir = this.getCurrentDirection();
494:                if (step.direction === ObjectSpecialStep.Backward) {
495:                    const opposite = this.faceHandler.opposite(dir);
496:                    this.moveDirection = opposite;
497:                    this.faceDirection = dir;
498:                } else {
499:                    this.moveDirection = dir;
500:                    this.faceDirection = dir;
501:                }
502:                break;
503:            }
```
[VERIFIED: packages-user/data-common/src/common/mover.ts:492-503]

```
467:    private getCurrentDirection(): FaceDirection {
468:        if (this.moveDirection !== FaceDirection.Unknown) {
469:            return this.moveDirection;
470:        } else {
471:            return this.faceDirection;
472:        }
473:    }
```
[VERIFIED: packages-user/data-common/src/common/mover.ts:467-473]

`start()` 在循环前把 `moveDirection` 置为 `Unknown`（`:687`），故第 1 步基准取 `faceDirection`；但第 1 步把 `moveDirection` 写成 `opposite(dir)`，第 2 步的基准随即变成该反方向并再取反 → 净位移为 0、朝向被翻转（与登记一致）。测试的 `onStepEnd` 对 Special 步按 `this.moveDirection` 计算落点（`mover.test.ts:138-140`），因此该字段必须是**本步实际移动方向**。

(c) 推荐最小修法（后退基准取 `faceDirection`，前进保持既有语义）：

```ts
case ObjectMoveType.Special: {
    if (step.direction === ObjectSpecialStep.Backward) {
        const dir = this.faceDirection;
        this.moveDirection = this.faceHandler.opposite(dir);
        this.faceDirection = dir;
    } else {
        const dir = this.getCurrentDirection();
        this.moveDirection = dir;
        this.faceDirection = dir;
    }
    break;
}
```

本会话手算修后序列（朝向 `Down`、`backward(2)`）：步 1 `dir=Down → moveDirection=Up → y:-1`；步 2 `dir=faceDirection=Down → moveDirection=Up → y:-2` → 断言 `y=-2`、`faceDirection=Down`、`moveDirection=Up` ✓；单步用例 `:292-304` 同样满足 ✓。

**契约/文档冲突（D-11 必办，须在 D-09 汇报）**：`IObjectMover.backward` 的 jsdoc 逐字为：

```
309:    /**
310:     * 追加若干个后退步，沿当前移动方向的反方向移动
311:     * @param count 追加次数，默认 1
312:     */
313:    backward(count?: number): this;
```
[VERIFIED: packages-user/data-common/src/common/mover.ts:309-313]

修后后退基准是**朝向**而非「当前移动方向」（在 `stepFace(move≠face)` 之后两者会分歧）。按 D-11 必须把该 jsdoc 改为「沿当前朝向的反方向后退」并说明多步后退保持同轴；同时 `getCurrentDirection` 的注释（`:464-466`）与 `prepareStep` 的注释（`:475-478`）应同步措辞。**备选修法**：保留「沿当前移动方向」的字面契约，另设一个私有「相对基准方向」字段（在 `start()` 中初始化为 `Unknown`，后退分支读取它而不读取被改写后的 `moveDirection`），代价是新增私有状态。两条路线在 D-09 汇报中二选一并请用户裁决。

(d) 既有测试风险：**无**。
- `mover.test.ts:278-289`（`forward(2)`）：走 `else` 分支，未改动 → `y=2`、`face=Down` ✓。
- `:292-304`（`backward(1)`）：修后 `dir=faceDirection=Down`（修前 `getCurrentDirection()` 也返回 `Down`，因 `moveDirection` 为 `Unknown`）→ 结果完全一致 ✓。
- `:149-209`（坐标回写四例，含 Teleport/Dir/斜向）不涉 Special ✓；`:322-332`（speed）、`:335-345`（face）、`:348-357`（animDir）、`:360-375`（push/Tp 顺序）、`:378-387`（clear）、`:389+`（moving 复位）均不涉后退 ✓。
- `data-base/src/hero/mover.test.ts`、`map/mover.test.ts` 不调用 `backward`（全仓检索 `backward(` 仅命中 `mover.ts` 与 `mover.test.ts`）。

(e) 共享模式：**是（弱）**——`forward`/`backward` 的「基准方向」推导是同一处状态机；修复须保持 `else` 分支不变以隔离风险。

### save 计划（`data-state/src/core.ts`）

#### #06-09-5 — 码 178 判定与文案相反

(a) 生产：`core.ts:518-538`（判定 `:531-537`）。测试：`saveablesRoundTrip.test.ts:337-349`（skip）、`:307-319`（绿，177）、**`:322-334`（绿，178 — D-05 授权改写）**。

(b) **已确认根因**：逐字：

```
531:        const loaded = new Set<string>(state.keys());
532:        const total = new Set(this.saveables.keys());
533:        const remain = total.difference(loaded);
534:        if (remain.size > 0) {
535:            const ids = [...remain].join(' | ');
536:            logger.warn(178, ids);
537:        }
```
[VERIFIED: packages-user/data-state/src/core.ts:531-537]

`total.difference(loaded)` = 「已注册但存档中缺失」的 key —— 正是 177 的语义（`:524-526`）；而 178 的文案逐字为 `178: Save data with keys of '$1' are saved but not be loaded, is there some issue for it?` [VERIFIED: packages/common/src/logger.json]，即「存档中出现但未被加载」= `new Set(state.keys()).difference(new Set(this.saveables.keys()))`。因此「缺 key」同时触发 177 与 178、而「多出 key」不告警（与登记一致）。

(c) 最小修法（D-05 采用「改实现对齐文案」）：
```ts
const loaded = new Set<string>(state.keys());
const total = new Set(this.saveables.keys());
const remain = loaded.difference(total);
if (remain.size > 0) {
    const ids = [...remain].join(' | ');
    logger.warn(178, ids);
}
```
集合语义：`Set.prototype.difference`（`:533` 已在用）在 Node 22 + 本仓库既有 `Map.getOrInsertComputed` polyfill 环境下可用（`saveablesRoundTrip.test.ts:322-334` 当前就依赖它执行）✓。

**必须同步改动的既有绿用例（D-05 已授权，但需在汇报中复述）：** `saveablesRoundTrip.test.ts:322-334` 的 `warns code 178 when the save data misses a saveable key` 断言「删除 `@system/flags` 后仍观测到 178」。修后 `loaded ⊆ total`（缺 key 而非多 key）→ 178 **不再触发** → 该用例必红。建议改写为**多 key 语义**（保留其覆盖价值，不新增用例）：
```ts
// 验证存档含未注册 key 时经 logger.catch 观测到警告码 178
it('warns code 178 when the save data has keys that are not loaded', () => {
    const state = createCoreState();
    const snapshot = new Map(state.saveState(SaveCompression.NoCompression));
    snapshot.set('@system/extra', null);

    const result = logger.catch(() =>
        state.loadState(snapshot, SaveCompression.NoCompression)
    );

    expect(result.info.map(info => info.code)).toContain(178);
});
```
注意：改写后它与 `:337-349` 的 skip 用例**完全重复**（同名同体）。因此**推荐方案是把 `:322-334` 的用例体替换为多 key 版本并让 `:337-349` 的 `it.skip` 成为被取消 skip 的那一条**——即实际动作是：(1) 删除/改写 `:322-334`（去重），(2) `:337-349` 取消 skip。两者都在 D-05 授权范围内，但**去重动作必须在 D-09 汇报中单独点名**（D-10 的「不额外新增用例」不禁止去重，但用户应知情）。

(d) 既有测试风险：**有且仅有两处**（均按 D-05 处理）：`:322-334` 必红（须改写/去重）；`:307-319`（177）不受影响（`:524-526` 未改）✓。`hero/saveLoad` 等经 `CoreState` 的容器往返（`:222-258`、`:354+`）不走多/缺 key 分支 ✓。

(e) 共享模式：无（但属「诊断码语义与码表文案对齐」家族，与 #06-06-1、#06-01-3 同类）。建议计划内加一条自检步骤：**改动任一码的触发条件前，先 grep 全仓该码的测试断言与生产写入点**（本会话已建立该审计规则，见 §Common Pitfalls P1）。

### path 计划（`data-system/src/path`）— **用户负责，AI 不实现（D-07）**

#### #06-07-1 — `CoreState` 未向 `finder` 注入 maps/layer/predicate

(a) 生产缺口：`core.ts:262-264`（仅 `useMover`）；注入 API 存在于 `path/finder.ts:117-131`；顶层装配点 `core.ts:248-256`（`loading.once('loaded')` → `initMapState`，`:252`）。测试：`replayPlayback.test.ts:362-375`（skip）。

(b) **已确认根因**：`PathfindingSystem` 构造时 `new PathfindingFinder(state)`（`path/system.ts:31-33`），`CoreState` 只调用 `pathfinding.useMover(this.hero.location.mover)`（`core.ts:263`），从未调用 `finder.useMapState/useMapLayer/usePassPredicate`；`PathfindingFinder.find` 在 `maps` 或 `layer` 为 `null` 时 `logger.warn(173)` 并返回 `[]`（`finder.ts:209-215`），于是 `teleportTo` 返回 `null`，录像瞬移指令必发 `2005`。

(c) 用户修改所需事实（**计划只写验证任务，不写实现任务**）——测试内的等价注入逐字：

```
108:    if (wireFinder) {
109:        state.pathfinding.finder.useMapState(state.maps);
110:        state.pathfinding.finder.useMapLayer(map.eventLayer);
111:        state.pathfinding.finder.usePassPredicate(
112:            new DefaultPassPredicateImpl(state.maps)
113:        );
114:    }
```
[VERIFIED: packages-user/data-state/test/replayPlayback.test.ts:108-114]

要点供用户参考（不作为 AI 实现范围）：
- 注入时机须在地图可用之后（`initMapState` 之后，或 `loaded` 钩子内）；`DefaultPassPredicateImpl` 位于 L3 `data-state/src/hero/predicate.ts`（测试以 `import { DefaultPassPredicateImpl } from '../src/hero/predicate'` 引入），因此接线属 L3 顶层装配，与依赖方向一致。
- `useMapLayer` 传入的是某个 `IGameMap.eventLayer`（`mapState.test.ts:366-374` 已验证「活跃楼层 → 事件层」的数据供给方式）；**楼层切换时事件层会变**（`gameMap.ts:146/152`），若注入是「一次性」的，用户需自行决定是否在切层时重新注入（属用户设计范畴，研究不预设）。
- AI 的职责：用户完成接线后，取消 `replayPlayback.test.ts:362-375` 的 skip 并跑 `pnpm exec vitest run packages-user/data-state/test/replayPlayback.test.ts` 验证转绿；不通过则按 D-09 退出并汇报，不自行改 `core.ts`。

(d) 既有测试风险：不适用（AI 不改生产代码）。若用户接线后 `pnpm test:ci` 出现回归，属用户接线范围，本计划的验证任务需如实记录并暂停。

(e) 共享模式：无。

### WINDOWS.md 收口映射（D-14，含一处需澄清）

本会话逐条核对 `WINDOWS.md` 的 open `skipped-test` 条目（id 19–27）与实际登记，映射如下：

| Windows id | 文件 | 关闭它的修复 | 备注 |
|-----------|------|-------------|------|
| 19 | `combat/damage.test.ts` | #06-01-1 | 取消 skip 后 `windows fixed 19` |
| 20 | `combat/mapDamage.test.ts` | #06-01-2 | |
| 21 | `combat/combat.test.ts` | #06-01-3 | 依赖既有用例纠偏（`:426`/`:460`/`:289`） |
| 22 | `common/mover.test.ts` | #06-08-1 | |
| 23 | `replay/array.test.ts` | #06-04-1 + #06-04-2 | 两个 commit 后一次性 fixed |
| 24 | `enemy/manager.test.ts` | #06-03-1 | 含两条 skip |
| 25 | `hero/saveLoad.test.ts` | #06-09-1 | |
| 26 | `hero/saveLoad.test.ts` | #06-09-2 | |
| 27 | `combat/context.test.ts` | #06-15-1（随 #06-01-4） | |

**需在 D-09 汇报中澄清（D-14 的执行事实与账本不符）：**
1. `#06-05-3`（设计如此）与 `#06-07-1`（用户自改）在 `WINDOWS.md` 中**没有对应条目**（19–27 的 9 条已全部映射到上表）。因此 D-14 所述「保留 open 并 waive 注明原因」**没有可 waive 的对象**。
2. 其余已登记缺陷（#06-01-4、#06-04-3/4、#06-05-1/2、#06-06-1、#06-09-3、#06-09-5）同样**不在账本内**，修复后无 `fixed` 可打。
3. 建议（待用户确认）：**不为 Phase 6 的 finding 新建账本条目**（新增会抬高 `workflow.windows_enforce` 的 `open_count` 门禁），改为在 Phase 7 的 SUMMARY/VERIFICATION 中登记完整对照表；`windows fixed 19..27` 一次执行。修完 19–27 后 `open_count` 由 19 降至 10（余下为 id 2/3/6/10/12/13/15/16/17/18，均非本阶段范围）。

### 跨条目共享模式（供计划切分参考）

| 模式 | 涉及条目 | 计划动作 |
|------|---------|---------|
| 命令索引 ↔ 参数字节偏移混用 | #06-04-3、#06-04-4（+ 未登记的 `set`/末位 `insert`） | replay 计划内落一个私有参数范围助手（末步用 `paramUsed` 哨兵），删除/插入/覆盖共用 |
| 「读档漏字段」清单 | #06-09-2（equipped/slots）、#06-09-3（num）、#06-09-1（value/percentage 基准） | hero 与 map 计划各按「save 字段 ↔ loadState 消费」清单自检 |
| 诊断码与码表文案对齐 | #06-01-3、#06-06-1、#06-09-5 | 每处修复前先 grep 该码的全仓测试断言与生产写入点（见 P1） |
| 「重置再重算」范式 | #06-01-4/#06-15-1 | 复用既有 `EnemyView.reset()`；不新造重置逻辑 |
| 「统一入口不变式」 | #06-03-1 | 所有按 code/id 取模板的公共入口必须经 `internalGetPrefab` |

## Runtime State Inventory

> 本阶段**不是** rename/refactor，但 `#06-09-1/2/3` 改变了**存档语义**（压缩档读档回退、深拷贝、字段恢复），且 `#06-09-5` 改变了诊断码语义。因此按五类逐条回答「仓库之内存量状态是否需要迁移」。

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data（持久化数据） | **无生产存档数据**：`SaveSystem` 依赖 IndexedDB，数据端在 Node 下不落库（06 D-10 明确未引入 `fake-indexeddb`）；`data-state/src/core.ts:243-245` 的 `saveSystem.init` 仅在 `coreInit` 事件触发（Node 测试路径不触发）。仓库内不存在需要迁移的 `.save`/Dexie 数据文件 | 无。修复使**新存档**更正确；旧（错误语义下产生的）存档若存在，读档结果只会更完整（Low/High 由「丢加成」变为「回退原始定义」），不需要迁移脚本 |
| Live service config（外部服务配置） | 无（本仓库无外部服务、无 n8n/Datadog 等运行时配置） | 无 |
| OS-registered state（OS 注册状态） | 无（无计划任务/服务/launchd 等） | 无 |
| Secrets/env vars（密钥/环境变量） | 无改动：本阶段不改任何 env / 密钥 / CI 变量；`data-state/src/core.ts:244` 的 `` `@game/${core.firstData.name}` `` 数据库名不在本次范围 | 无 |
| Build artifacts（构建产物） | 无构建产物参与判定：测试经 Vitest 实时 transform（无 `dist/` 依赖）；`vitest` **无配置文件**（`TESTING.md` 记录），Phase 2 的 `testTimeout` 设置在 `.planning` 记录中而非 `vitest.config`（本会话确认仓库根无 `vitest.config.*`） | 无（无需重装/重建以生效） |

**Nothing found in category:** Live service config / OS-registered state / Secrets-env vars / Build artifacts —— 均「无」，依据：本阶段只改仓库内 `.ts` 源码与 `*.test.ts`，不触网、不落盘、不注册任何 OS/外部状态。

## Common Pitfalls

### Pitfall 1: 改诊断码/短路语义前未审计全仓断言（本阶段最高危）
**What goes wrong:** 把「契约修正」当成单文件改动，改完取消 skip 后**既有绿用例反而变红**，`pnpm test:ci` 门禁失败，甚至误判为「修复方案失败」而按 D-09 退出重做。
**Why it happens:** Phase 6 的 skip 用例与既有绿用例可能对**同一行为**持相反预期（既有绿用例固化了错误语义）。本阶段已实证 3 处：#06-01-3 影响 `combat.test.ts:426`/`:460`/`:289` 三条；#06-09-5 影响 `saveablesRoundTrip.test.ts:322-334` 一条；#06-04-4 的 `indexArray` 位移缺陷被「参数长度为 0」的绿用例掩盖。
**How to avoid:** 每个契约类修复前执行固定审计：(1) `grep` 目标码 / 目标方法在**全部** `*.test.ts` 中的断言；(2) `grep` 该码在**全部**生产文件中的 `logger.warn(<code>` 写入点，确认改动不影响他处语义；(3) 对每个断言判明「它是正确预期还是固化错误」。
**Warning signs:** 取消 skip 后出现「原本绿的新红」；同文件出现两条互相矛盾的用例。

### Pitfall 2: 把「推测根因」当成已确认根因落地
**What goes wrong:** 按登记的「疑似原因」直接打补丁，修完 skip 仍红（因为还有第二个原因），或修出了「测试假绿但语义仍错」。
**Why it happens:** 06-TEST-FINDINGS.md 是**测试期推测**，若干条不完整。本会话已确认 3 处更完整的根因：#06-04-4 的 `indexArray.copyWithin(index, index+1)` 方向同样反了（只修登记点出的 `paramArray` 一行，`get()` 语义仍错，但三个 skip 恰好因只用读流而转绿）；#06-01-2 的 `removeEnemyAffecting`/`refreshIndex` 与 `deleteEnemy` 一同失效；#06-05-2 的实际缺陷位置在 `getCouldEquipSlot` 而非登记所写的 `equip` 字符串槽分支。
**How to avoid:** 计划中为每条给出「根因复核」任务（读源码 + 逐位手算/复算），并明确「最小修法」与「完整修法」的差异与取舍；凡「测试会绿但语义仍不完整」的路径必须写明（如 #06-04-4 的读流 vs `get`）。
**Warning signs:** 修复后 skip 转绿但同族的 `get()` / 局部刷新路径无人验证；修法说明里出现「疑似」「应该」。

### Pitfall 3: 在数据端顺手修「相邻但未登记」的缺陷
**What goes wrong:** 变更面扩大 → D-44 文件级门禁的「本计划改动文件」清单膨胀 → 回滚粒度变粗 → 甚至改出新的红。
**Why it happens:** 本会话确实发现多条相邻潜在缺陷（int64 负数、负 bigint、`ReplayArray.set` 的索引回退、末位 `insert`、`HeroEquipment.loadState` 数值槽语义、`logger` 128 占位符不足）。
**How to avoid:** 一律**不改**，登记到 §Open Questions 并在 D-09 汇报中询问用户是否纳入。用户 D-06 已表态「错误码关注语义、不要动」，D-09 强调方案失败即退出重议 —— 该纪律同样适用于「未登记的相邻代码」。
**Warning signs:** 计划的文件清单出现 `06-TEST-FINDINGS.md` 未提到的源文件/方法。

### Pitfall 4: 忘记文件级类型门禁的判定方式
**What goes wrong:** 以为 `pnpm check:type` 必须全绿而误判门禁失败（仓库存在既有渲染/legacy 类型错误，不属本阶段）。
**Why it happens:** D-12 沿用 06 D-44：**文件级**判定 —— 对**本计划改动文件**运行 `pnpm exec vue-tsc --noEmit`，按输出路径过滤，只要求这些路径 0 错误。
**How to avoid:** 命令与判定方式固定为：`pnpm exec vue-tsc --noEmit 2>&1 | Select-String -Pattern "<改动文件相对路径>"`（Windows/PowerShell）确认无命中；不要用「退出码非 0」当作失败。
**Warning signs:** 报告里写「`check:type` 失败故不提交」——正确做法是过滤到本计划文件。

### Pitfall 5: 测试经 esbuild 剥类型导致的「假通过」
**What goes wrong:** 类型/格式错误不会让 Vitest 失败（`TESTING.md` 记录 vitest 用 esbuild），若跳过 D-44(a)(b)，会把类型错误带进提交。
**How to avoid:** 严格按 D-44 三步（eslint → vue-tsc 文件级 → test:ci）串行执行，任一不过不提交。
**Warning signs:** 只跑了 `pnpm test:ci` 就提交。

### Pitfall 6: CRLF / Prettier 反复触发 lint 失败
**What goes wrong:** 新增/修改的文件用 LF 写入，Prettier 报 `endOfLine: crlf` 错误（`WINDOWS.md` id 13/17 记录过同类历史问题）。
**How to avoid:** 修改后先 `pnpm exec eslint --fix <file>`（D-12(a) 的第一步），再跑 `pnpm exec eslint <file>` 确认 0 错误；不要手工调整换行。
**Warning signs:** eslint 报大量 `Delete ␍` / `Insert ␍`。

### Pitfall 7: Windows 环境下 Vitest 命令形态
**What goes wrong:** 用 `pnpm vitest run ...` 之外的形态（例如 `npx vitest`）可能解析到不同版本；本会话实测 `pnpm exec vitest run <path>` 可用（单文件约 1–2s），且 `--reporter=basic` **不可用**（此版本 reporter 名单见 §Validation Architecture，无 `basic`）。
**How to avoid:** 固定使用 `pnpm exec vitest run <path>`（可选 `-t "<用例名片段>"`）；全量门禁用 `pnpm test:ci`。
**Warning signs:** 报 `ERR_LOAD_URL` / `loadCustomReporterModule` 失败 —— 是 reporter 名不合法，不是代码问题。

## Code Examples

以下为本阶段 19 处生产改动的**补丁骨架**（行号基于本会话所读版本；`#06-05-3`/`#06-07-1` 无生产改动）。所有片段均为 `[VERIFIED]` 源码的修订形式。

### combat

```ts
// packages-user/data-system/src/combat/damage.ts  (#06-01-1, 替换 :229-234)
if (middleInfo.damage < referenceDamage) {
    right = middle;
    targetInfo = middleInfo;
} else {
    left = middle;
}
```

```ts
// packages-user/data-system/src/combat/combat.ts  (#06-01-3, 替换 :178-181)
for (const script of this.scriptList) {
    const proceed = await script.before(damage, handler);
    if (!proceed) return damage;
}
```

```ts
// packages-user/data-system/src/combat/context.ts  (#06-01-4 / #06-15-1, 在 :695 之后插入)
for (const view of this.enemyViewMap.values()) {
    view.reset();
}
```

```ts
// packages-user/data-system/src/combat/mapDamage.ts  (#06-01-2 方案 A, 在 refreshEnemy 与
// refreshEnemyAndClearCache 的 if (damage) 分支内; refreshIndex 重算后同样登记)
point.affectedBy.add(viewItem);
point.damages.add(damage);
// 记录伤害来源，供 deleteEnemy / removeEnemyAffecting 反向清理
this.damageStore.set(damage, { sourceView: viewItem, sourceEnemy: view, index });
const viewStore = this.viewStore.getOrInsertComputed(viewItem, () => ({
    damages: new Map(),
    enemy: view
}));
viewStore.damages.set(index, damage);
```

### enemy

```ts
// packages-user/data-base/src/enemy/manager.ts  (#06-03-1, 替换 :119-129)
createEnemy(code: number): IEnemy<TEnemy> | null {
    const prefab = this.internalGetPrefab(code);
    if (!prefab) return null;
    return prefab.clone();
}

createEnemyById(id: string): IEnemy<TEnemy> | null {
    const prefab = this.internalGetPrefab(id);
    if (!prefab) return null;
    return prefab.clone();
}
```

### replay

```ts
// packages-user/data-common/src/replay/array.ts  (#06-04-1, :621)
value = low + high * 2147483648;

// packages-user/data-common/src/replay/array.ts  (#06-04-2, 替换 :264-270 的循环体)
arr[i] = Number((param >> (8n * BigInt(i))) & 0xffn);

// packages-user/data-common/src/replay/array.ts  (#06-04-2, :628 / :631)
const length = this.paramView.getUint8(startIndex + 1);
const num = this.paramView.getUint8(startIndex + 2 + i);

// packages-user/data-common/src/replay/array.ts  (#06-04-3, :447 / :469)
const nextParam =
    index + 1 < this.length ? this.indexArray[index + 1] : this.paramUsed;
for (let i = index; i < this.length; i++) {
    this.indexArray[i] -= paramLength;
}

// packages-user/data-common/src/replay/array.ts  (#06-04-4, :424 / :425)
this.paramArray.copyWithin(paramStart + length, paramStart);
this.indexArray.copyWithin(index + 1, index);
```

### hero / flag+common

```ts
// packages-user/data-base/src/hero/attribute.ts  (#06-05-1, 替换 :81-82)
const modifierList = this.modifier.get(name);
if (!modifierList) {
    this.finalAttribute[name] = this.attribute[name];
    return;
}

// packages-user/data-base/src/hero/equipment.ts  (#06-05-2, :141)
if (empty === -1 && !this.equips.has(index)) {

// packages-user/data-base/src/hero/equipment.ts  (#06-09-2, 替换 :330-333)
return {
    equipped: new Map(this.equips),
    slots: [...this.slots]
};

// packages-user/data-base/src/hero/equipStore.ts  (#06-09-1, loadNoCompression :119 / loadDiff :135-140)
for (const [name, value] of state.value) {
    this.value.set(name, value);
}
// loadDiff：先以 item.equip 原始定义为基准，再叠加 state.value / state.percentage 差异

// packages-user/data-common/src/common/mover.ts  (#06-08-1, 替换 :492-503 的 Special 分支)
case ObjectMoveType.Special: {
    if (step.direction === ObjectSpecialStep.Backward) {
        const dir = this.faceDirection;
        this.moveDirection = this.faceHandler.opposite(dir);
        this.faceDirection = dir;
    } else {
        const dir = this.getCurrentDirection();
        this.moveDirection = dir;
        this.faceDirection = dir;
    }
    break;
}
```

### map / save

```ts
// packages-user/data-base/src/map/mapLayer.ts  (#06-06-1, :441)
logger.warn(128, x.toString(), y.toString());

// packages-user/data-base/src/map/dynamicTile.ts  (#06-09-3, 替换 :118-127 首行)
loadState(save: Readonly<IDynamicBlockSave>): void {
    this.set(save.num);
    if (save.events) { /* 原事件恢复逻辑不变 */ }
}

// packages-user/data-state/src/core.ts  (#06-09-5, :533)
const remain = loaded.difference(total);
```

## State of the Art

本阶段不引入技术选型变化；仅记录与本阶段直接相关的仓库现状。

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 各计划自带测试/修复混杂 | 测试与修复严格分两环节（Phase 6 → Phase 7） | 06-CONTEXT D-05 / 07-CONTEXT D-01 | 本阶段**只取消 skip**，不新增用例 |
| `ReplayArray` 可存档（含 `saveState`/`loadState`、`IReplayArraySave`） | 由 `ReplaySystem`（`IReplaySystemSave`）承担存档 | 提交 `c08f3f8` | 使 `#06-09-4` 作废：本会话确认 `replay/types.ts` 已**无** `IReplayArraySave`，`ReplayArray` 已无 `saveState`/`loadState`（仅 `system.ts:97/106` 有） |
| 全仓 `pnpm check:type` 作为提交门禁 | **文件级** `vue-tsc` 门禁（仅判本计划改动文件路径） | 06-CONTEXT D-44 | 本阶段沿用（07 D-12）；既有渲染/legacy 错误不阻塞 |

**Deprecated/outdated:**
- `#06-09-4`（`ReplayArray` 存档往返）：**已作废**，不在本阶段（07 D-01）。本会话复核依据：`packages-user/data-common/src/replay/types.ts` 中已无 `IReplayArraySave`；`array.ts` 无 `saveState`/`loadState`；`replay/saveLoad.test.ts` 只测 `ReplaySystem.saveState/loadState`。
- `06-TEST-FINDINGS.md` 的「疑似原因」：作为**输入线索**使用，不作为根因结论（见 Pitfall 2）。

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `#06-01-2` 的方案选择（补齐 store 写入 vs 只修 `deleteEnemy`）应由用户在 D-09 裁决 | Per-Finding #06-01-2 | 若 AI 自行选定而被用户否决，须按 D-09 退出重议；可能浪费一个计划周期 |
| A2 | `#06-05-3`（147）在 `WINDOWS.md` 中无条目，故 D-14 的「waive」无对象 | WINDOWS 收口映射 | 若用户原意是新增条目再 waive，则会抬高 `open_count` 门禁；需澄清 |
| A3 | 对 `#06-01-3` 连带变红的 3 条既有用例（`combat.test.ts:289/426/460`），用户接受「显式 `beforeResult=true` + 断言纠偏」而非「放弃 D-03」 | Per-Finding #06-01-3 | 若不接受，D-03 无法落地，需回到契约裁决 |
| A4 | 对 `#06-09-5` 的 `:322-334` 与 `:337-349` 去重（保留其一为多 key 语义）符合 D-10「不额外新增用例」 | Per-Finding #06-09-5 | 若用户要求保留两条，则 `:322-334` 需改为「缺 key 不再触发 178」的负向断言（属断言纠偏） |
| A5 | `#06-08-1` 采用「后退基准取 `faceDirection`」并同步修改 `IObjectMover.backward` 的 jsdoc（D-11） | Per-Finding #06-08-1 | 若用户坚持 jsdoc 字面语义（当前移动方向），须改用「独立基准方向字段」的备选修法 |
| A6 | `#06-04-4` 同时修 `:424` 与 `:425`（`indexArray` 位移方向）虽超出登记的建议方向，仍属同一根因的完整修复 | Per-Finding #06-04-4 | 若用户要求严格最小化（只改 `:424`），三个 skip 仍会转绿，但 `get()` 的插入语义仍错——需在报告中如实标注 |
| A7 | 本阶段不引入任何新依赖、不新建测试文件、不改动渲染端与 legacy 文件 | Summary / Package Legitimacy Audit | 违反则 D-10/D-12 与需求边界（FIX-01「仅数据端」）失效 |

## Open Questions

1. **A. `#06-04-1` 相邻的负 int64 不可逆是否纳入本阶段？**
   - What we know: 本会话以 node 复算证明 `-2147483649` 经编码/新解码得 `-4294967297`（错误）；根因是 `Math.floor` + JS `%` 的符号语义配合 `getInt32`。
   - What's unclear: 录像参数是否会出现小于 `-2147483648` 的整数（例如坐标/伤害中间值）。
   - Recommendation: **不纳入**（登记未要求、无既有测试、修法会触及编码布局）；在计划中登记为已知限制，请用户在 D-09 决定是否另立条目。

2. **B. 负 bigint 参数不可往返是否纳入本阶段？**
   - What we know: `(-1n).toString(2) === '-1'` 使长度计算与按位取字节均不适用于负数；现有 bigint 用例全为正数。
   - Recommendation: 同上，**不纳入**；若纳入需重新定义 bigint 的编码约定（属接口/契约问题，超出「修缺陷」范围）。

3. **C. `ReplayArray.set` 与末位 `insert` 的同族索引缺陷是否纳入？**
   - What we know: `set`（`array.ts:476-513`）的 `nextParam = indexArray[index+1]`（末步为 0）与回退循环起点 `paramStart + 1`（`:508`）同属「命令索引/字节偏移混用」；`insert(index === length)` 取 `paramStart = indexArray[length] = 0` 会导致覆写缓冲区首部。现有绿用例 `:224-234`（`set`）参数长度相等（`deltaLength = 0`）恰好掩盖之。
   - Recommendation: **不纳入**（未登记、D-10 不新增用例）。建议在 replay 计划中加一条「已知同族缺口」中文注释或在 SUMMARY 记录，避免后续再度踩坑；是否登记由用户决定。

4. **D. `#06-01-2` 的两条修法路线如何裁决？**（详见该条 (c) 的 A/B 方案）
   - What we know: A 是完整设计（三处 store 写入 + `refreshIndex` 重登记），B 是最小自足（只改 `deleteEnemy`，可复用至 `removeEnemyAffecting`）。
   - Recommendation: 若用户接受「必要的内部重构」（07 Discretion 已授权），倾向 **A**（消除 `viewStore`/`damageStore` 死结构，且顺带修正局部刷新的陈旧伤害累积）；若用户要求最小变更，选 **B**。**必须在 D-09 汇报中二选一。**

5. **E. `HeroEquipment.loadState` 用数字槽回装 + `canEquipTo` 要求 `item.equip.slots.includes(index)` 的语义缺口是否登记？**
   - What we know: 现有全部相关用例的装备定义均为 `slots=[0]`，故 #06-09-2 转绿不受影响；但只声明字符串槽的装备在容器三档往返时可能被静默丢弃。
   - Recommendation: **本阶段不改**；在 hero 计划或 SUMMARY 中记录为已知语义缺口，请用户决定是否另立条目（涉及 `canEquipTo` 契约，属用户设计范畴）。

6. **F. `#06-06-1` 是否顺手补齐码 128 的占位符参数？**
   - What we know: `128` 文案含 `$1..$4`，三个越界分支均只传 2 个参数，缺失项渲染为 `[not delivered]`（`logger.ts:101`）。
   - Recommendation: **不补**（与两个既有兄弟分支保持一致，避免扩大变更面）；由用户在 D-09 决定。

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 全部测试与工具 | ✓ | 见 `dev.md` 要求 `^20 || >=22`（本会话 vitest 与 node 均可用） | — |
| pnpm | 包管理/脚本 | ✓ | `dev.md` 要求 `>=10.0.0`；`pnpm exec vitest` / `pnpm test:ci` 实测可用 | — |
| vitest | 测试运行 | ✓ | `4.0.18`（`package.json` devDependencies；`pnpm exec vitest run <file>` 实测 1–2s/文件） | 无（必需） |
| vue-tsc（`pnpm exec`） | D-12(b) 文件级类型门禁 | ✓ | 仓库既有依赖（`check:type` = `vue-tsc --noEmit`） | 无（D-12 要求） |
| eslint 9（`pnpm exec`） | D-12(a) 格式门禁 | ✓ | 仓库既有 flat config | 无 |
| IndexedDB / 浏览器环境 | `SaveSystem` 生产路径 | ✗（Node 无） | — | 本阶段不测、不依赖（06 D-10）；存档修复只在内存对象层验证 |
| `gsd-tools.cjs`（`windows fixed/waive`） | D-14 账本结清 | ✓ | `@opengsd/gsd-core` 1.13.0（本会话 `runtime-identity` 验证） | 无 |
| 知识图谱 `.planning/graphs/graph.json` | 可选上下文 | ✓ 但**陈旧** | 构建于 2026-09-07T02:50:35Z（`stale: true`，`age_hours: 195`，`built_at_commit: 7eeab32`） | 直接 `Read` 源码（本研究的做法） |

**Missing dependencies with no fallback:** 无（本阶段无外部依赖阻塞）。
**Missing dependencies with fallback:** IndexedDB（不影响本阶段）；陈旧知识图谱（改用直接读源码；本会话两次 `graphify query`（`ReplayArray` / `buildup`）只返回符号节点，未提供跨文档新信息，且图谱早于 Phase 6 测试文件，故不作为本阶段依据）。

## Validation Architecture

`workflow.nyquist_validation` 在 `.planning/config.json` 中为 `true`，故本节启用。

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `4.0.18`（`package.json` devDependencies） |
| Config file | `vite.config.ts`（`defineConfig` 来自 `vitest/config`，`test: { testTimeout: 30000, hookTimeout: 30000 }` 位于 `:46-49`）[VERIFIED: vite.config.ts:1, 46-49] |
| Quick run command | `pnpm exec vitest run <测试文件或目录>`（实测：单文件 1–2s；可用 `-t "<用例名片段>"` 进一步收窄） |
| Full suite command | `pnpm test:ci`（= `vitest run`，非 watch） |

**Reporter 说明（本会话实测）：** `--reporter=basic` 在 vitest 4.0.18 下会报 `ERR_LOAD_URL`（不是代码问题）；可用 reporter 为 `default, agent, minimal, blob, verbose, dot, json, tap, tap-flat, junit, tree, hanging-process, github-actions`（[CITED: https://vitest.dev/guide/cli.html]）。默认 reporter 即可。

**逐系统聚焦命令（D-02 的 8 个计划各对应一行）：**

| 计划 | 聚焦命令 |
|------|---------|
| combat | `pnpm exec vitest run packages-user/data-system/src/combat` |
| enemy | `pnpm exec vitest run packages-user/data-base/src/enemy` |
| replay | `pnpm exec vitest run packages-user/data-common/src/replay` |
| hero | `pnpm exec vitest run packages-user/data-base/src/hero` |
| map | `pnpm exec vitest run packages-user/data-base/src/map` |
| flag+common | `pnpm exec vitest run packages-user/data-common/src/common packages-user/data-base/src/flag` |
| save | `pnpm exec vitest run packages-user/data-state/test/saveablesRoundTrip.test.ts` |
| path（用户负责） | `pnpm exec vitest run packages-user/data-state/test/replayPlayback.test.ts` |

### Phase Requirements → Test Map

要求 `FIX-01` 的每一个可判定行为 = 「对应 `it.skip` 取消 skip 后转绿」。所有测试文件**均已存在**（Phase 6 产出），故 Wave 0 无新增测试文件；✅ = 已有文件，修复后取消 skip 即回归。

| Req | Behavior（取消 skip 后必须转绿的用例） | Test Type | Automated Command | File Exists? |
|-----|--------------------------------------|-----------|-------------------|-------------|
| FIX-01 / #06-01-1 | `damage.test.ts` · `reports the damage info matching the yielded critical value` | unit | `pnpm exec vitest run packages-user/data-system/src/combat/damage.test.ts -t "damage info matching the yielded critical value"` | ✅ |
| FIX-01 / #06-01-2 | `mapDamage.test.ts` · `removes enemy-sourced damage when the enemy is deleted` | unit | `pnpm exec vitest run packages-user/data-system/src/combat/mapDamage.test.ts -t "removes enemy-sourced damage"` | ✅ |
| FIX-01 / #06-01-3 | `combat.test.ts` · `abandons the battle when the before script returns false`（+ 纠偏 `:289/:426/:460`） | unit | `pnpm exec vitest run packages-user/data-system/src/combat/combat.test.ts` | ✅ |
| FIX-01 / #06-01-4 | `damage.test.ts` · `recomputes a repeat buildup from the base enemy without compounding` | unit | `pnpm exec vitest run packages-user/data-system/src/combat/damage.test.ts -t "repeat buildup"` | ✅ |
| FIX-01 / #06-15-1 | `context.test.ts` · `applies a global aura after addAura and stops applying it after deleteAura` | unit | `pnpm exec vitest run packages-user/data-system/src/combat/context.test.ts -t "after addAura and stops applying"` | ✅ |
| FIX-01 / #06-03-1 | `manager.test.ts` · `creates enemies for reused codes and ids…` + `creates four independent enemies…` | unit | `pnpm exec vitest run packages-user/data-base/src/enemy/manager.test.ts -t "reuse"` | ✅ |
| FIX-01 / #06-04-1 | `array.test.ts` · `round-trips int64 values above the int32 range` | unit | `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts -t "int64"` | ✅ |
| FIX-01 / #06-04-2 | `array.test.ts` · `round-trips a multi-byte bigint` + `…mixing a multi-byte bigint and an int64 value` | unit | `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts -t "bigint"` | ✅ |
| FIX-01 / #06-04-3 | `array.test.ts` · `deletes a middle step…` + `reads the new order after deleting a middle step…` | unit | `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts -t "delet"` | ✅ |
| FIX-01 / #06-04-4 | `array.test.ts` · `reads the new order after inserting a step` + `…into a heterogeneous route` | unit | `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts -t "insert"` | ✅ |
| FIX-01 / #06-05-1 | `attribute.test.ts` · `reflects base-only changes without any modifier` | unit | `pnpm exec vitest run packages-user/data-base/src/hero/attribute.test.ts -t "base-only"` | ✅ |
| FIX-01 / #06-05-2 | `equipment.test.ts` · `uses the first empty named slot instead of replacing an occupant` | unit | `pnpm exec vitest run packages-user/data-base/src/hero/equipment.test.ts -t "first empty named slot"` | ✅ |
| FIX-01 / #06-05-3 | **不转绿**：`warns code 147…` 保留 `it.skip` + 注释（D-06） | 静态审查 | `Select-String -Path packages-user/data-base/src/hero/equipment.test.ts -Pattern "保留错误码"` | ✅ |
| FIX-01 / #06-06-1 | `mapLayer.test.ts` · `warns code 128 for an out-of-map transferToDynamic` | unit | `pnpm exec vitest run packages-user/data-base/src/map/mapLayer.test.ts -t "code 128 for an out-of-map"` | ✅ |
| FIX-01 / #06-07-1 | `replayPlayback.test.ts` · `plays a teleport step without manual finder wiring`（**用户接线后**由 AI 取消 skip 验证） | integration | `pnpm exec vitest run packages-user/data-state/test/replayPlayback.test.ts -t "without manual finder wiring"` | ✅ |
| FIX-01 / #06-08-1 | `mover.test.ts` · `keeps retreating along the same axis across multiple backward steps` | unit | `pnpm exec vitest run packages-user/data-common/src/common/mover.test.ts -t "retreating"` | ✅ |
| FIX-01 / #06-09-1 | `hero/saveLoad.test.ts` · `restores a value modifier on the same instance` + `restores a percentage modifier … LowCompression` + `… HighCompression` + `keeps unchanged value modifiers for compressed snapshots` | unit | `pnpm exec vitest run packages-user/data-base/src/hero/saveLoad.test.ts -t "modifier"` | ✅ |
| FIX-01 / #06-09-2 | `hero/saveLoad.test.ts` · `returns an equipment snapshot independent from the live state` + `restores the equipped mapping through the container across all compressions` | unit | `pnpm exec vitest run packages-user/data-base/src/hero/saveLoad.test.ts -t "equipment snapshot"` | ✅ |
| FIX-01 / #06-09-3 | `map/saveLoad.test.ts` · `restores the tile num on the same instance` | unit | `pnpm exec vitest run packages-user/data-base/src/map/saveLoad.test.ts -t "tile num"` | ✅ |
| FIX-01 / #06-09-5 | `saveablesRoundTrip.test.ts` · `warns code 178 when the save data has keys that are not loaded`（+ 纠偏 `:322-334`） | unit | `pnpm exec vitest run packages-user/data-state/test/saveablesRoundTrip.test.ts -t "178"` | ✅ |

**逐条修复后必须复核的「既有绿用例不回归」集合**（本研究标注的连带风险点）：

| 修复 | 必须额外确认仍绿 | 命令 |
|------|-----------------|------|
| #06-01-3 | `combat.test.ts:289`（优先级顺序）、`:426`（await 顺序）、`:460`（truthy 分支，需纠偏后绿） | `pnpm exec vitest run packages-user/data-system/src/combat/combat.test.ts` |
| #06-09-5 | `saveablesRoundTrip.test.ts:307-319`（177 不得受影响） | `pnpm exec vitest run packages-user/data-state/test/saveablesRoundTrip.test.ts` |
| #06-06-1 | `gameMap.test.ts:173-192`（码 131 的唯一断言不得受影响） | `pnpm exec vitest run packages-user/data-base/src/map/gameMap.test.ts` |
| #06-04-3/4 | `array.test.ts` 全文件（含 `delete(0)`、`insert` 零参数、`set`、位宽切换、扩容） | `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts` |
| #06-09-3 | `mapLifecycle.test.ts:102-148`（`loadState` 幂等与 `dirty` 语义） | `pnpm exec vitest run packages-user/data-base/src/map/mapLifecycle.test.ts` |
| #06-01-4/#06-15-1 | `context.test.ts` 全文件（告警 97/98/99/100/101 与阶段顺序） | `pnpm exec vitest run packages-user/data-system/src/combat/context.test.ts` |
| #06-09-1/#06-09-2 | `hero/saveLoad.test.ts` 与 `equipStore.test.ts` 全文件 | `pnpm exec vitest run packages-user/data-base/src/hero` |

### Sampling Rate
- **Per task commit:** 本系统聚焦命令（上表）→ 全绿后执行 D-44 门禁三步：
  1. `pnpm exec eslint --fix <改动文件>` 然后 `pnpm exec eslint <改动文件>`（0 错误）
  2. `pnpm exec vue-tsc --noEmit`（按**本计划改动文件路径**过滤输出，0 类型错误）
  3. `pnpm test:ci`（全绿）
- **Per wave merge:** `pnpm test:ci` 全绿（每完成一个系统计划后即跑；避免跨系统问题累积）。
- **Phase gate:** 全部计划完成后 `pnpm test:ci` 全绿 + `WINDOWS.md` 的 19–27 已结清（D-14），再进入 `/gsd-verify-work`。

### Wave 0 Gaps
**None** — 现有测试基础设施覆盖本阶段全部要求：
- 20 条正确预期用例（`it.skip`）**均已存在**（Phase 6 / gap-fill 06-10..06-15 产出）；
- 无新增测试文件、无新增 fixture、无框架安装需求（D-10 明确不新增用例）；
- 唯一需在 Wave 0 阶段确认的是**执行前置**：(i) D-09 的逐计划方案汇报与用户确认；(ii) `#06-07-1` 属于用户，需在 path 计划开始前确认用户是否已完成 `core.ts` 接线（未完成则 path 计划的「取消 skip 验证」无法执行，须等待）。

## Security Domain

`workflow.security_enforcement` 为 `true`（`.planning/config.json`），ASVS 等级 1；本节按需最小化。

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 数据端无认证（无网络/无用户体系） |
| V3 Session Management | no | 无会话概念 |
| V4 Access Control | no | 无权限模型；`mapLayer`/`gameMap` 的「越权」仅是**同实例归属**校验，非安全边界 |
| V5 Input Validation | yes | 编解码/存档输入的边界校验：`ReplayArray.decodeParam` 依长度前缀推进（`array.ts:663-677`）、`Set.difference` 差异诊断（`core.ts:531-537`）、`IDynamicBlockSave.num` 等存档字段的形状校验；本阶段的修复**增强**了该面向（bigint 长度改为无符号读取、越界分支诊断码与语义对齐） |
| V6 Cryptography | no | 无加密/签名；不得引入自研加密（本阶段不引入任何依赖） |

**Security-relevant notes:**
- 本阶段**不新增攻击面**：不改网络/文件/DB 访问，不改权限或认证路径，不新增第三方依赖（`package.json` 不变）。
- `#06-04-2` 的 `getUint8` 修正顺带消除了「长度前缀 ≥128 时被当作负数」的**静默错读**，属健壮性提升（负数长度会使解码循环不执行并返回 `0n`，非越界读，但会产生错误的录像参数）。该论断的依据是本会话对 `decodeParam` 全路径（`array.ts:586-656`）与 `rebuildIndexArray`（`:749-767`）的直接阅读：所有缓冲区访问都以 `DataView`/`TypedArray` 的既有边界语义为界，未新增索引算式。

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 录放数据被篡改导致参数错读（影响回放一致性与诊断） | Tampering | 长度前缀约束的定长解码（既有）+ 本阶段修正的无符号读取；不一致通过码 `151/152/154/155` 与首分歧诊断上报 |
| 存档被注入未注册 key（版本不一致/手工篡改） | Tampering / Repudiation | 码 `177`（缺 key，继续加载）+ `178`（多出 key，告警）——本阶段修正 178 使其恢复独立诊断意义（D-05） |
| 越界坐标触发图块转换（地图数据异常） | Tampering | `inMap` 守卫 + 越界诊断码 `128`（本阶段使 `transferToDynamic` 与 `transferToStatic*` 一致） |
| 未绑定协作者导致 `null` 解引用（如 `state.replaySystem`） | DoS | 既有 `logger.warn(139/141/104…)` + 早退；本阶段不改变该模式 |
| 自研加密 / 自签校验 | — | **禁止**：本阶段无密码学需求（V6 不适用） |

## Sources

### Primary (HIGH confidence)

**源码直读（`[VERIFIED: <path>:<line>]`，本会话 `Read` 所得）：**
- `packages-user/data-system/src/combat/damage.ts:206-242`（`findNextCritical`）
- `packages-user/data-system/src/combat/combat.ts:178-194`；`types.ts:771-779`
- `packages-user/data-system/src/combat/context.ts:684-716, 780-891`；`enemy.ts:15-17`
- `packages-user/data-system/src/combat/mapDamage.ts`（全文 379 行，重点 `49-53/150-167/227-256/261-333/356-378`）
- `packages-user/data-base/src/enemy/manager.ts:119-139, 165-196`；`enemy.ts:77-84`
- `packages-user/data-common/src/replay/array.ts`（全文 815 行，重点 `216-300/347-513/586-656/749-794`）
- `packages-user/data-base/src/hero/attribute.ts:80-98`；`equipment.ts:32-72, 134-197, 329-346`；`equipStore.ts:80-162`
- `packages-user/data-base/src/map/mapLayer.ts:435-496, 820-849`；`dynamicTile.ts:56-66, 118-127`；`map/types.ts:25-35`
- `packages-user/data-common/src/common/mover.ts:309-313, 464-503, 579-597, 680-721`
- `packages-user/data-state/src/core.ts:100-270, 465-545`；`packages-user/data-system/src/path/finder.ts:98-131, 205-233`
- `packages-user/data-common/src/save/types.ts:12-25`；`packages/common/src/logger.ts:72-101`；`packages/common/src/logger.json`（码 127/128/131/147/177/178）
- 测试文件：`combat.test.ts`、`damage.test.ts`、`mapDamage.test.ts`、`context.test.ts`、`manager.test.ts`、`array.test.ts`、`attribute.test.ts`、`equipment.test.ts`、`hero/saveLoad.test.ts`、`map/saveLoad.test.ts`、`mapLifecycle.test.ts`、`mover.test.ts`、`saveablesRoundTrip.test.ts`、`gameMap.test.ts`、`replayPlayback.test.ts`
- 规划输入（逐字）：`.planning/phases/07-data-fixes/07-CONTEXT.md`、`06-TEST-FINDINGS.md`、`06-CONTEXT.md`、`.planning/WINDOWS.md`、`dev.md`、`.planning/codebase/CONVENTIONS.md`、`.planning/codebase/TESTING.md`

**运行时实测（本会话）：**
- `node -e` 复算 int64 编解码（`2147483648`、`-2147483649`、`4294967297`、`9007199254740991`）→ 确认乘数缺陷与负数路径缺陷。
- `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts` → 42 tests / 35 passed / **7 skipped**（跳过数与本阶段 replay 条目数吻合）；`-t "<multi-byte bigint>"` 收窄可跑通（该用例为 skip 故整文件 42 skipped）。
- `pnpm exec vitest run <file>` 形态与 `--reporter=basic` 失败均实测确认。

### Secondary (MEDIUM confidence)
- [CITED: https://vitest.dev/guide/cli.html] — `vitest run` 单次运行语义、`-t/--testNamePattern` 按完整用例名匹配、`<file>:<line>` 定位、Reporter 合法名单与默认超时值。
- `.planning/STATE.md` / `ROADMAP.md` — 阶段状态、Phase 6 完成情况、测试基线（649 passed / 28 skipped 等历史数值，仅作参照，不作为本阶段判据）。

### Tertiary (LOW confidence)
- WebSearch 摘要（研究计划 seam 指派的 `websearch` 查询：JS int64/BigInt 字节提取注意点）——**未直接采信**；相关结论全部以本会话 `node -e` 复算与源码直读替代验证。

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — 本阶段不引入依赖；测试栈与门禁命令均由 `package.json` / `vite.config.ts` / `dev.md` 直读并实测。
- Architecture: **HIGH** — 20 条缺陷的 file:line、根因与调用链全部由本会话直读源码 + 全仓 grep 交叉确认；不存在需要外部文档推断的接口。
- Pitfalls: **HIGH** — 三条「既有绿用例连带风险」均由逐行阅读测试源码得出（#06-01-3 的 3 条、#06-09-5 的 1 条、#06-04-4 的掩盖机制），并已给出复核命令。
- 修法建议: **MEDIUM** — 每条的最小修法已按源码推演并手算验证；但 `#06-01-2`（A/B 路线）、`#06-08-1`（基准方向 vs 独立字段）、`#06-01-3`/`#06-09-5`（既有用例纠偏）属需用户裁决项，已全部列入 Assumptions Log 与 Open Questions。

**Research date:** 2026-09-15
**Valid until:** 2026-10-15（30 天；本阶段为仓库内自洽修复，无外部 API/版本漂移风险；若 Phase 5（Legacy 移植）先行改动数据端接口，本研究的 file:line 需重新校准——见 CONTEXT Deferred Ideas）
