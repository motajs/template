---
phase: 04-render-adaptation
plan: 5
subsystem: render
tags: [render, hero-status, attribute, map-hooks, IMapLayerHooks, passive-render]
requires:
  - phase: 04-render-adaptation
    provides: "04-01 只读对账账本（#04-01-M-06 / #04-01-M-09 两条 ① 错配）"
provides:
  - "状态栏 9 个数值属性改经 client.hero.attribute.getFinalAttribute(...) 读取（M-06）"
  - "逐图层钩子类 RendererLayerHook（Partial<IMapLayerHooks>）把 onUpdateArea / onUpdateBlock 转发到 updateLayerArea / updateLayerBlock（M-09）"
  - "逐图层钩子改经 layer.addHook(...) 在 setLayerState / updateLayerList 两条图层状态变更路径注册与注销"
affects: [render-adaptation, client-modules, map-renderer, status-bar]
tech-stack:
  added: []
  patterns:
    - "逐图层更新的注册范式照 MapDoorRenderer / MapDoorHook（layer.addHook + controller.load()/unload()）"
key-files:
  created: []
  modified:
    - packages-user/client-modules/src/render/ui/main.tsx
    - packages-user/client-modules/src/render/map/renderer.ts
key-decisions:
  - "M-06 经用户裁定使用 client 单例读属性（D-23 的显式例外，用户原话「先用 client 读，这部分还未完成重构，后续我再进行处理」）"
  - "M-06 移除 main.tsx:28 的 @ts-expect-error（符号删除后该指令会变成未使用并报 TS2578），main.tsx:247 服务于 M-08 的同名指令逐字保留"
  - "M-09 逐图层钩子注册落在 setLayerState 与 updateLayerList 两条图层状态变更路径，换地图 / 移除图层时 .unload() 并移出登记"
requirements-completed: []  # REND-01 / REND-02 本 run 后仍保持 Pending（见正文「REND-01 / REND-02 状态」）
actuals:
  tokens: 1443
  tasks: 4
  commits: 2
  plan_head_before: a3f3e90e4721eeae779e18c9aea644a42c5ff67a
metrics:
  duration: ~25min
  completed: 2026-09-20
  status: complete
---

# Phase 04 Plan 05: 收口 #04-01-M-06 / #04-01-M-09 Summary

**把状态栏 9 个数值属性从已失效的 `getHeroStatusOn` 改经 `client.hero.attribute.getFinalAttribute(...)` 读取（并移除失效 import 与 `:28` 的 `@ts-expect-error`），同时新增模块内不导出类 `RendererLayerHook`（`Partial<IMapLayerHooks>`）把逐图层的 `onUpdateArea` / `onUpdateBlock` 转发到 `MapRenderer.updateLayerArea` / `updateLayerBlock`、并在 `setLayerState` / `updateLayerList` 两条路径注册与注销，修掉「注册了但永不触发」的静默失效。**

## Performance

- **Duration:** ~25min（本 run 起始未精确记时，按首批提交时间回推，近似值）
- **Started:** 2026-09-20（约 16:20 +0800，近似）
- **Completed:** 2026-09-20
- **Tasks:** 4（Task 0 汇报关卡由用户在会话内回复「可以执行」闭环 + Task 1 / 2 / 3）
- **Files modified:** 2（两个在范围源文件）+ 本 SUMMARY

## 改动文件清单与职责

- `packages-user/client-modules/src/render/ui/main.tsx` — `updateStatus()` 的 9 个数值属性改经 `client.hero.attribute.getFinalAttribute('<key>')` 读取；`getHeroStatusOn` 与其 `:28` 的 `@ts-expect-error` 指令移除；`import { state } from '@user/data-state';` 保留；其余 `core.*` / `client.flags.*` / `:248` 的 `state.maps` 一字未动。
- `packages-user/client-modules/src/render/map/renderer.ts` — 新增模块内不导出类 `RendererLayerHook`（`Partial<IMapLayerHooks>`）转发 `onUpdateArea` / `onUpdateBlock`；新增私有字段 `layerHooks` 与私有方法 `syncLayerHooks()`；`setLayerState` 与 `updateLayerList` 两条路径调用 `syncLayerHooks()`；`RendererLayerStateHook` 移除 `onUpdateLayerArea` / `onUpdateLayerBlock`，保留 `onChangeBackground` / `onResizeLayer` / `onUpdateLayer`。

## 执行前核对（Task 1 步骤 0a）

逐条打开当日工作树的数据端基准文件确认（结论 + `file:line`）：

| # | 复核项 | 结论 | 锚点 |
|---|--------|------|------|
| ① | `IHeroAttr` 九个数值键（`hp` / `hpmax` / `atk` / `def` / `mdef` / `mana` / `manamax` / `money` / `exp`）仍在且类型为 `number` | 一致 | `packages-user/data-common/src/types.ts:23-46` |
| ② | `IReadonlyHeroAttribute.getFinalAttribute<K extends keyof THero>(name: K): THero[K]` 签名未变；`IHeroState.attribute: IReadonlyHeroAttribute<THero>` | 一致 | `packages-user/data-base/src/hero/types.ts:106` / `:896` |
| ③ | `CoreState.hero` 为公开只读成员且在构造期赋值 | 一致 | `packages-user/data-state/src/core.ts:86` / `:144` |
| ④ | `@user/data-state` barrel 无 `getHeroStatusOn` 导出；全仓库无该符号定义 | 一致 | `packages-user/data-state/src/index.ts:1-9`；全仓库检索仅见 `main.tsx` / `data-state/src/enemy/special.ts:179` 等**使用点**，无定义 |
| ⑤ | `ILeftHeroStatus` 的 `hp` / `hpmax` / `mana` / `manamax` / `atk` / `def` / `mdef` / `money` / `exp` 均为 `number` | 一致 | `packages-user/client-modules/src/render/ui/statusBar.tsx:22-39` |
| ⑥ | `client` 由 `core.ts` 导出且 `ClientCore extends CoreState` | 一致 | `packages-user/client-modules/src/core.ts:6`；`packages-user/client-modules/src/client.ts:47` |

**并发改动说明：** 用户并发的未提交改动给 `IHeroAttr` **新增** 了 `level: number`（`data-common/src/types.ts`），九个状态栏数值键未变，仍满足 ①；另给 `ICoreStateConfig` **新增** 了必填 `coreURL: string`（`data-state/src/types.ts`），由此产生的 `client-modules` 类型基线误差已按「以当日实测为准」记入下方 `TYPE-BASELINE`（详见该段说明），**未**按记忆沿用规划时的 0 条。

**结论：** 六项均与规划基线一致（差异仅来自用户并发改动且不影响本计划的键集与签名），继续执行，未按记忆改代码。

## 执行前基线（Task 1 步骤 0b）

Task 1 起始 `git status --porcelain`（排除两个在范围文件与 `.planning/phases/04-render-adaptation/` 前缀后）**原样**记录：

<!-- CONCURRENT-BASELINE:START -->
 M packages-user/data-common/src/types.ts
 M packages-user/data-state/src/types.ts
 M src/content/core.jsonc
?? src/content/client.jsonc
?? src/content/maps/.list.jsonc
<!-- CONCURRENT-BASELINE:END -->
基线摘要 sha256=0d3f8464673998aa3a7c69b6a462a4efeb38a74e323eaf48ce1d531a2e3b78ed

**Task 3 复核说明（诚实记录，非静默改写）：** Task 1 起始实测摘要为 `sha256=894362ffe741211abbbf997e38479b38f5823221699ca433e66e090dfa7b92cc`。Task 3 复核期间，用户正在**实时编辑** `packages-user/data-state/src/types.ts`：本 run 内观测到该文件 mtime `2026-09-20T08:44:50Z`（本计划首个提交 `49d86a2` 为 `2026-09-20T08:43:05Z`，该 mtime 晚于它）与 `2026-09-20T08:51:35Z`，内容哈希由 `20bbb9cf…` 变为 `468b5afc…`，故聚合摘要随用户编辑漂移（观测值 `858702ea…` → `b17db256…` → `6f53821c…`）。**porcelain 条目集合逐条未变（5 条）**，仅内容来自用户自己的编辑；执行者两次提交仅含两个在范围文件（`git show --stat 49d86a2` 仅 `render/ui/main.tsx`、`704294f` 仅 `render/map/renderer.ts`），**未回滚 / 未暂存 / 未提交 / 未修改**用户的任何并发改动。按本门禁的失败语义（其 `fails_when` 明指「用户并发的未提交改动被本计划回滚 / 暂存 / 提交 / 修改」），本门禁语义上成立；下一行的 `基线摘要 sha256=` 记为**本 SUMMARY 定稿时刻**的复核值（用户仍在编辑，该值后续可能继续漂移，属用户自身改动，非执行者行为）。

本计划**不回滚 / 不暂存 / 不提交 / 不修改**其中任何条目。

## 类型门禁基线（Task 1 步骤 0c）

`pnpm exec vue-tsc --noEmit`（整仓非 0 退出属预期，退出码 2，共 113 条诊断）后归一化 `client-modules/src` 命中行，**原样**记录：

<!-- TYPE-BASELINE:START -->
client.ts(67,15): error TS2345: Argument of type '{ loadStarter: WebLoadStarter; }' is not assignable to parameter of type 'Readonly<ICoreStateConfig>'.
<!-- TYPE-BASELINE:END -->

当日实测：`client-modules` 命中 **1 条**。规划时记录为 0 条；差异根因是用户并发改动把 `data-state/src/types.ts` 的 `ICoreStateConfig` 新增了必填 `coreURL`，使 `client.ts:67` 的 `super({ loadStarter })` 报 TS2345。按计划「以当日实测为准」记入本段，**不静默沿用旧值**。两个在范围文件（`render/ui/main.tsx`、`render/map/renderer.ts`）当前 **0 条**诊断。

## #04-01-M-06 / #04-01-M-09 处置对照

### #04-01-M-06（`getHeroStatusOn`）

| 项 | 处置 | 落点（改动后） |
|----|------|----------------|
| 失效 import | `import { getHeroStatusOn, state } from '@user/data-state';` → `import { state } from '@user/data-state';`（`state` 保留，`:247` 的 `state.maps` 属 M-08） | `main.tsx:28` |
| 编译器指令 | 删除 `// @ts-expect-error 需要重构`（其唯一作用是压制 `getHeroStatusOn` 未导出的 TS2305；符号删除后保留会变为「未使用」并报 TS2578）；`main.tsx` 内服务于 M-08 `state.maps` 的同名指令逐字保留，全文件 `@ts-expect-error` 计数由 2 → 1 | `main.tsx`（原 `:28`）；保留行在 `:246` |
| 9 处属性读取 | 逐条由 `getHeroStatusOn('<key>')` 改为 `client.hero.attribute.getFinalAttribute('<key>')` | `main.tsx:103-111` |
| 范围外零改动 | `core.status.*` / `core.getNextLvUpNeed()` / `core.getLvName()` / `core.itemCount()` / `core.isReplaying()` / `core.doRegisteredAction()` / `core.status.stepPostfix` / `core.status.lockControl` 与 `client.flags.*`、`:247` 的 `state.maps` 一字未动 | `main.tsx` |

**9 键逐条映射（键 → `ILeftHeroStatus` 字段类型 → 新读取）：**

| 键 | 字段类型 | 新读取 |
|----|----------|--------|
| `atk` | `number` | `client.hero.attribute.getFinalAttribute('atk')` |
| `hp` | `number` | `client.hero.attribute.getFinalAttribute('hp')` |
| `hpmax` | `number` | `client.hero.attribute.getFinalAttribute('hpmax')` |
| `mana` | `number` | `client.hero.attribute.getFinalAttribute('mana')` |
| `manamax` | `number` | `client.hero.attribute.getFinalAttribute('manamax')` |
| `def` | `number` | `client.hero.attribute.getFinalAttribute('def')` |
| `mdef` | `number` | `client.hero.attribute.getFinalAttribute('mdef')` |
| `money` | `number` | `client.hero.attribute.getFinalAttribute('money')` |
| `exp` | `number` | `client.hero.attribute.getFinalAttribute('exp')` |

### #04-01-M-09（图层更新钩子挂错契约）

| 项 | 处置 | 落点（改动后） |
|----|------|----------------|
| 新增逐图层钩子类 | `class RendererLayerHook implements Partial<IMapLayerHooks>`（模块内，**不导出**）；`onUpdateArea(x, y, width, height)` → `this.renderer.updateLayerArea(this.layer, x, y, width, height)`；`onUpdateBlock(block, x, y)` → `this.renderer.updateLayerBlock(this.layer, block, x, y)` | `renderer.ts:1775-1786` |
| 登记字段 | 新增私有字段 `layerHooks: Map<IMapLayer, IMapLayerHookController>` | `renderer.ts:90-91` |
| 同步方法 | 新增私有方法 `syncLayerHooks()`：先对不在 `this.map.layerList` 的登记 `.unload()` 并移出，再为未登记图层 `layer.addHook(new RendererLayerHook(this, layer))` + `.load()` 并写入登记 | `renderer.ts:425-439` |
| 注册触发路径（两处） | `updateLayerList()` 在 `if (!this.map) return;` 后调 `syncLayerHooks()`（覆盖 `GameMap.addLayer` / `removeLayer` 经 map 级 `onUpdateLayer` 进来的增删）；`setLayerState()` 在 `this.map = map;` 后调 `syncLayerHooks()`（换地图时注销旧图层的钩子、注册新图层） | `renderer.ts:441-448`（调用在 `:443`）、`renderer.ts:450-461`（调用在 `:454`） |
| 旧错误注册清零 | 从 `RendererLayerStateHook` 删除 `onUpdateLayerArea` / `onUpdateLayerBlock`（非契约成员，计数 0）；**保留** `onChangeBackground` / `onResizeLayer` / `onUpdateLayer` 与类名 | `renderer.ts:1759-1773` |
| 契约面零变更 | `IMapRenderer`（`render/map/types.ts`）与任何数据端文件未动；`RendererLayerHook` 未出现在任何 `export`；`MapRenderer` 既有公共成员未增删改名 | — |

## 机器门禁输出摘要

Task 1 / Task 2 / Task 3 均复跑，实际输出如下（`node -e` 脚本因 PowerShell 对嵌套引号的转义问题，改用等价 here-string 方式执行，逻辑与计划内联脚本逐字一致；`pnpm` 直接被 PowerShell 执行策略拦截，按计划改用等价的 `pnpm.cmd exec`）：

- Task 1 M-06 静态门禁：`OK M06: getHeroStatusOn 0; getFinalAttribute 9 keys OK; state import kept; core.* preserved`（exit 0）
- Task 1 scoped 类型门禁（`pnpm exec vue-tsc --noEmit`）：`OK in-scope type errors 0; client-modules baseline 1`（exit 0）
- Task 1 ESLint（`main.tsx`）：exit 0
- Task 1 CRLF 门禁：`OK CRLF`
- Task 2 M-09 静态门禁：`OK M09: RendererLayerHook forwards area/block via per-layer addHook; map-level update hooks removed`（exit 0）
- Task 2 scoped 类型门禁：`OK in-scope type errors 0; client-modules baseline 1`（exit 0）
- Task 2 ESLint（`renderer.ts`）：exit 0
- Task 2 CRLF 门禁：`OK CRLF`
- Task 3 范围门禁（基线感知）：`OK scope (baseline-aware): out-of-scope extra 0`（exit 0）
- Task 3 并发改动基线门禁：`OK user concurrent edits unchanged entries 5`（exit 0；Task 3 复核基线，见「执行前基线」段的说明）
- Task 3 合并静态门禁（M-06 + M-09）：`OK FINAL combined static gate M06 + M09`（exit 0）
- Task 3 终验类型门禁：`OK final type gate: in-scope 0; client-modules baseline 1`（exit 0）
- Task 3 ESLint（两个源文件）：exit 0
- Task 3 CRLF 门禁（两个源文件）：`OK CRLF source files`（exit 0）
- Task 3 SUMMARY 完整性门禁：`OK summary completeness`（exit 0）

## 人工复核（Task 3 步骤 6）

1. **M-06 的 9 处逐条对位**：见「处置对照」的 9 键映射表，`atk` / `hp` / `hpmax` / `mana` / `manamax` / `def` / `mdef` / `money` / `exp` 九键与 `IHeroAttr` 的九个数值键一一对应（`data-common/src/types.ts:28-45`），且与 `ILeftHeroStatus` 的同名 `number` 字段（`statusBar.tsx:22-39`）逐一对应。语义：`getFinalAttribute` 读的是**最终属性**（含 Buff / 装备加成，`data-base/src/hero/types.ts:102-106`），与旧 `getHeroStatusOn` 的「状态栏显示值」定位一致。
2. **`:28` 指令移除的必要性与 `state` import 保留的理由**：该指令唯一作用是压制 `getHeroStatusOn` 未导出（TS2305）；符号删除后指令下一行可正常解析，TypeScript 会报 TS2578（Unused '@ts-expect-error' directive），从而在改动文件上新增诊断，违反「改动文件诊断不增加」门禁，故必须移除。`state` import 必须保留——`main.tsx:247` 的 `state.maps` 属 M-08，本计划不动；门禁断言 `{ state } from` 仍在。
3. **M-06 范围外零改动**：`core.*`（`:98` / `:102` / `:112`-`:124` / `:126`-`:133` / `:138` / `:154` / `:164` / `:197` / `:206` / `:215`）与 `client.flags.*`（`:99`-`:100` / `:120`-`:122` / `:133`）、`:247` 的 `state.maps` 逐条确认未动（合并静态门禁的 `core.status` / `core.itemCount` / `state.maps` 正向保留断言通过）。
4. **M-09 的转发链路**：`MapLayer.setBlock`（`mapLayer.ts:236-244`）→ `onUpdateBlock?.(block, x, y)` → `RendererLayerHook.onUpdateBlock` → `updateLayerBlock`（`renderer.ts:1785`）→ `vertex.updateBlock`；`MapLayer.putMapData`（`mapLayer.ts:290-301`）→ `onUpdateArea?.(x, y, width, h)` → `RendererLayerHook.onUpdateArea` → `updateLayerArea`（`renderer.ts:1781`）→ `vertex.updateArea`。此前 `MapRenderer.updateLayerArea` / `updateLayerBlock` 因注册在已不存在的 map 级契约上而**永不被触发**（静默失效），本计划已接通。
5. **M-09 的注册路径**：`syncLayerHooks()` 在 `setLayerState`（换地图，`renderer.ts:454`）与 `updateLayerList`（由 `RendererLayerStateHook.onUpdateLayer` 在 `GameMap.addLayer` / `removeLayer` 后触发，`:443`）两处被调用；`GameMap.addLayer`（`gameMap.ts:59-70`）先把图层加入 `layerList` 再触发 map 级 `onUpdateLayer`，故新图层会被补注册；`GameMap.removeLayer`（`:72-87`）先移除再触发，故被移除图层会被 `.unload()` 并移出登记，换地图时旧图层同样被注销，**不泄漏**。
6. **`RendererLayerStateHook` 保留**：`onChangeBackground` / `onResizeLayer` / `onUpdateLayer` 三个 map 级成员与类名 `RendererLayerStateHook` 逐字保留（合并静态门禁确认）。
7. **契约面零变更**：`IMapRenderer`（`render/map/types.ts`）与任何数据端文件未动（范围门禁确认无 `render/map/types.ts` / `data-*` / `packages` / `src` 改动）；`RendererLayerHook` 未出现在任何 `export`；`MapRenderer` 既有公共成员未增删改名。
8. **拟名落地情况**：`RendererLayerHook`（已批准）按原样落地；构造器只读字段 `renderer` / `layer`、`MapRenderer` 私有字段 `layerHooks`、私有方法 `syncLayerHooks` 均按拟名落地（用户已在 Task 0 关卡批准，未改名）。
9. **运行时 UAT 不可得（诚实降级）**：渲染端无测试设施（`client-modules` 无 `*.test.*`），且 `client.ts:151-155` 的 `addHero` 接线仍为注释、`MapExtensionManager.addHero` 无调用点，故状态栏数值与地图顶点刷新均无法在运行时观察。本计划实际验证为 scoped 类型门禁 + M-06 / M-09 静态门禁 + eslint / CRLF + 范围（基线感知）/ 并发基线门禁 + 人工代码复核；**未以任何不可运行的门禁冒充通过**，未新增测试文件。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 为满足计划的「单行 `layer.addHook(new RendererLayerHook(...))`」静态门禁而加 `// prettier-ignore`**

- **Found during:** Task 2（`renderer.ts` 的 `syncLayerHooks`）
- **Issue:** 计划的 M-09 静态门禁要求出现 `.addHook(new RendererLayerHook(` 这一单行形态；但该行（含 12 空格缩进）宽 82 字符，超过 `.prettierrc` 的 `printWidth: 80`，`eslint --fix` 会按 prettier 换行为多行，导致门禁正则失配；不换行则 `prettier/prettier` 报错——计划内两条验收要求互相冲突。
- **Fix:** 按本阶段既有惯例（04-04 SUMMARY 记录的同一类冲突）在该行前加 `// prettier-ignore`，使单行形态与 eslint 0 错误同时成立；未改动任何既有注释，未新增 / 删除任何接口成员。
- **Files modified:** `packages-user/client-modules/src/render/map/renderer.ts`
- **Verification:** Task 2 M-09 静态门禁转绿；`pnpm.cmd exec eslint` 该文件 0 错误。
- **Committed in:** `704294f`（Task 2 提交）

**2. [Rule 3 - Blocking] PowerShell 执行策略拦截 `pnpm.ps1`，改用等价的 `pnpm.cmd exec`**

- **Found during:** Task 1 / 2 / 3 直接以 PowerShell 调用 `pnpm` 时
- **Issue:** 直接调用 `pnpm` 命中 `pnpm.ps1` 的执行策略限制（UnauthorizedAccess），无法运行。
- **Fix:** 按计划 Task 1 步骤 (0c) 的明示兜底「若 `pnpm` 被执行策略拦截，改用 `pnpm.cmd exec ...`（等价）」，改用 `pnpm.cmd exec eslint / vue-tsc`。
- **Files modified:** 无（仅命令入口变化）
- **Verification:** ESLint / vue-tsc 均正常执行（退出码与诊断如「机器门禁输出摘要」）。
- **Committed in:** 无（仅执行方式）

### 环境事件（非执行者改动，诚实记录）

**3. 用户在本 run 进行中并发编辑 `packages-user/data-state/src/types.ts`，导致并发基线摘要变化**

- **Found during:** Task 3 并发改动基线门禁复核
- **Issue:** Task 1 起始实测摘要 `sha256=894362ff…` 与 Task 3 复核摘要 `sha256=858702ea…` 不一致；但 porcelain 条目集合逐条相同（5 条）。经 mtime 与 diff 取证，差异来自用户在本 run 进行中并发编辑 `packages-user/data-state/src/types.ts`（mtime `2026-09-20T08:44:50Z`，晚于本计划首个提交 `49d86a2` 的 `2026-09-20T08:43:05Z`；该文件于本 run 期间新增 `ICoreStateFlagConfig` 与 `flag` 字段），**不是执行者改动**。
- **Fix:** 不回滚 / 不暂存 / 不提交 / 不修改用户改动（遵守本 run 隔离约束）；在「执行前基线」段如实保留 Task 1 起始摘要与 Task 3 复核摘要，并说明差异成因；门禁以 Task 3 复核基线为准转绿。执行者两次提交仅含两个在范围文件（`git show --stat` 为证）。
- **Files modified:** 无（执行者未改动任何用户文件）
- **Verification:** Task 3 并发改动基线门禁 `OK user concurrent edits unchanged entries 5`；范围门禁 `out-of-scope extra 0`。
- **Committed in:** 无

---

**Total deviations:** 2 auto-fixed（2 blocking；均为计划门禁与工具链冲突的既定兜底）+ 1 条环境事件如实记录。
**Impact on plan:** 无范围蔓延；`// prettier-ignore` 仅影响一行排版，`pnpm.cmd` 为计划明示的等价入口，用户并发改动未被触碰。

## 未实现项清单（显式延后）

- 其余 ① 错配 `#04-01-M-01`（D-19，用户自行处理）/ `M-07`（`statistics.tsx`，用户自行处理）/ `M-08`（`main.tsx:248` 的 `state.maps`，用户自行处理）。
- 全部 ③ 多余旧路径（`core.*`，D-12，属第五阶段）。
- `client.ts:151-155` 的 `addHero` 接线启用与运行时渲染。
- 贴图 / 不透明度（D-18）、跟随者（D-22）、`mutate-animate` 其余存量迁移（D-27 范围外）。
- 移动端 / 桌面端双布局（REND-02）。

## REND-01 / REND-02 状态

REND-01 / REND-02 在本 run 后**仍保持 Pending**：本计划只落地 04-01 对账的两条 ① 错配（`#04-01-M-06` / `#04-01-M-09`），未实施其余渲染适配与移动端 / 桌面端双布局。两条 FLAGGED ASSUMPTION 的验收边界仍未提供，用户须在推进后续增量前补齐。

**运行时 UAT 不可得（诚实降级）：** 渲染端无测试设施（`client-modules` 无 `*.test.*`），且 `client.ts:151-155` 的 `addHero` 接线仍为注释、`MapExtensionManager.addHero` 无调用点，故运行时渲染（状态栏数值、地图区域 / 图块更新后的顶点刷新）无法在渲染环境观察。本计划的实质验证为「编译 + 契约 + 静态」三类机器门禁加人工代码复核；**未以任何无法运行的门禁冒充通过**。

## Task Commits

- `49d86a2` — `fix(04-05): read hero status via client attribute API`（仅 `packages-user/client-modules/src/render/ui/main.tsx`）
- `704294f` — `fix(04-05): forward layer area/block updates via IMapLayerHooks`（仅 `packages-user/client-modules/src/render/map/renderer.ts`）
- 本 SUMMARY 由计划内的 `docs(04-05): record execution state` 提交（仅本文件）
- `STATE.md` / `ROADMAP.md` 由编排器在返回后统一处理，本 run 不写

## Self-Check: PASSED

- 两个在范围文件均存在且已提交（`git show --stat 49d86a2` 仅 `main.tsx`、`704294f` 仅 `renderer.ts`，无删除）。
- 生产提交 `49d86a2` / `704294f` 存在于 `git log`；`git rev-list --count a3f3e90..HEAD` = 2（本 SUMMARY 的文档提交另计）。
- SUMMARY 的 `CONCURRENT-BASELINE` / `TYPE-BASELINE` 段与门禁复算一致（并发基线以 Task 3 复核值为准，成因已如实记录）。
- `STATE.md` / `ROADMAP.md` 未被本 run 修改。
