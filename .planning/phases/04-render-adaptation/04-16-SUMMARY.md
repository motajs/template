---
phase: 04-render-adaptation
plan: 16
subsystem: render-desingleton-mount
tags: [desingletonization, step-2, mount-to-clientcore, option-b, staged, tracer, no-runtime]
requires:
  - phase: 04-render-adaptation
    provides: 04-15 只读台账 04-RENDER-SINGLETON-AUDIT.md（30 条单例 A-01..A-30）
  - phase: 04-render-adaptation
    provides: 用户 2026-10-01 去单例化裁定 + 固定 option B 设计 + F-01..F-07 / DEFAULT_FONT 锁定
provides:
  - IClientCore 新增 using / sceneController / mainUIController 三个只读字段（client-modules/src/types.ts）
  - ClientCore 新增三个只读字段并在构造器内构造（client-modules/src/client.ts；F-02）
  - 模块级 staged 站点保留 + this.state 扫描 0 处 + 逐符号站点对账（权威 6 + staged 6 = 12）
  - 静态门禁证据 + 人工复核结论（无运行时验证，D-68 的延续）
affects: [04-render-adaptation]
actuals:
  tokens: 3579
  tasks: 5
  commits: 1
  plan_head_before: 6cff48741a784f7b7ed8f71c320fcb667cd1e3e9
tech-stack:
  added: []
  patterns:
    - "option B 镜像数据端：单一具体类 ClientCore 实现整条接口链（IClientBase → IClientSystem → IClientCore）；字段按层声明在最上层 IClientCore"
    - "staged 迁移：模块级站点与导出保留，与 ClientCore 权威实例并存，待消费者迁移后收敛"
key-files:
  created:
    - .planning/phases/04-render-adaptation/04-16-SUMMARY.md
  modified:
    - packages-user/client-modules/src/types.ts
    - packages-user/client-modules/src/client.ts
  deleted: []
key-decisions:
  - "设计 option B（镜像数据端）：单一具体类实现整链；IClientBase 不加字段；忽略 client-system；顶层类不加 state"
  - "新增命名 using / sceneController / mainUIController（Task 0 获批，类型 IRendererUsing / UIController）；无 state"
  - "本轮 staged：模块级站点与消费者保留；不创建转发别名；不新增 import { client }"
  - "F-03：ClientCore 实例权威；模块级 rafExcitation / excitationDivider / mainRenderer 重复 staged 不删"
  - "F-01 / F-04 / F-07 / DEFAULT_FONT：texture / DEFAULT_FONT / 全部 GameUI 实例保持原样"
  - "单一白名单提交（沿用 04-11..04-15 口径）"
  - "门禁脚本在 PowerShell 5.1 下 node -e \"...\" 转义不可直跑，按原样语义改由仓库外临时脚本执行（见 Deviations）"
requirements-completed: []
duration: ~13min
completed: 2026-10-01
status: complete
---

# Phase 4 Plan 16: 渲染端去单例化·第二步（挂载到主类）Summary

**按用户 2026-10-01 裁定的 option B（镜像数据端）把三个外部包子系统单例挂到渲染端主类：`IClientCore` 与 `ClientCore` 新增 `using`（`IRendererUsing`，`@motajs/render-vue`）/ `sceneController` / `mainUIController`（`UIController`，`@motajs/system`）三个只读字段，并在 `ClientCore` 构造器内构造；模块级 staged 站点与全部消费者保持不动，`this.state` 扫描 0 处可转换，逐符号站点对账 12（权威 6 + staged 6）；只改 `client-modules/src/types.ts` 与 `client.ts`，无运行时验证（D-68 的延续）。**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-10-01T10:58:03Z
- **Completed:** 2026-10-01T11:11:09Z
- **Tasks:** 5（Task 0 blocking-human 汇报关卡 — 用户已回复「可以执行」；Task 1 tracer；Task 2；Task 3；Task 4 收口）
- **Files:** 2 修改（生产）+ 本 SUMMARY；删除文件 0；`files_modified` 之外零改动

## 只读起始基线（Task 1 步骤 0a）

- **只读起始基线（packages / packages-user / src）：**
  - ` M packages-user/data-system/src/combat/context.ts`
- **起始 HEAD：** `6cff48741a784f7b7ed8f71c320fcb667cd1e3e9`（short `6cff487`）
- **起始分支：** `refine/data-client`
- **用户并发改动哈希标记：** `<!-- 04-16-baseline-hash-combat-context: 15dc298aa0dfae778ac18d221ed77641c8fa8163 -->`（`git hash-object -- packages-user/data-system/src/combat/context.ts` 于执行日起始）
- **说明：** 规划日的 `b4c4bcd698fab7d30d602b7cf6e84eb211740ad2` 与执行日实测不同（执行日以当日实测为准）；本 run 对该用户文件零触碰、零暂存、零提交（D-56）。

## 要解决的问题

`04-15` 只读台账（`.planning/phases/04-render-adaptation/04-RENDER-SINGLETON-AUDIT.md`）清点出渲染端两个包内 **30** 条单例（模块顶层实例化对象 `export const x = new X()`）：`packages-user/client-modules` 24 条 + `packages-user/client-base` 6 条。用户 2026-10-01 裁定渲染端不得再有单例，须全部挂到主类 `ClientCore` / `client`，并镜像数据端的「单一具体类 + 分层接口」结构。本计划 = **第二步（挂载到主类）**。

## 设计 option B（镜像数据端）与 F 裁定

数据端结构：`IDataCommon` → `IStateBase extends IDataCommon` → `IStateSystem extends IStateBase` → `ICoreState extends IStateSystem,...`，每层接口只声明该层 `readonly` 字段，单一具体类 `CoreState implements ICoreState`（`data-state/src/core.ts:77`）实现整链；不存在 `DataCommon` / `StateBase` / `StateSystem` 类。

渲染端镜像：单一具体类 `ClientCore implements IClientCore` 实现整链（`IClientBase` → `IClientSystem` → `IClientCore`）。client-modules 层字段加在 `IClientCore` 并在 `ClientCore` 构造器构造；client-base 层当前无在步单例可挂（`texture` F-01 保留、5 个 `GameUI` F-04 / F-07 保留），故 `IClientBase` 不加任何字段、`client-base` 本轮零改动；忽略 `IClientSystem` / `client-system` 包；不给顶层类加 `state`。

| 裁定 | 内容 | 落点 |
|---|---|---|
| **F-01 `texture`** | 整套接口稍后另行重构 → 不触碰 | `client-base/src/elements/cache.ts:280`（不改） |
| **F-02 外部包单例** | 仍挂主类，且在 `ClientCore` 构造器内构造 / 挂载：`using`、`sceneController`、`mainUIController` | `client.ts` 构造器 |
| **F-03 重复实例（staged）** | 权威实例恒为 `ClientCore` 上的那一份；`render/renderer.ts` 模块级 `rafExcitation` / `excitationDivider` / `mainRenderer` 保留为 staged，不删 | 「ClientCore 权威」声明 + staged 登记 |
| **F-04** | `GameUI` 实例不挂载；`UIController` 实例必须挂载（`sceneController`、`mainUIController`） | `ClientCore` 字段 |
| **F-05 接口选择按包** | 本轮无新增实现（无子系统需要回指；顶层类不加 `state`） | —（显式声明） |
| **F-06** | 已解决 / moot | — |
| **F-07** | 全部 UI 保留、不触碰 | 各 `*UI`（不改） |
| **`DEFAULT_FONT`** | `client-modules/src/shared.ts:105` 不触碰 | 不改 |

## 编辑集

| # | 文件 | 实际形态 |
|---|---|---|
| 1 | `packages-user/client-modules/src/types.ts` | import 追加 `IRendererUsing`（`@motajs/render-vue`）与 `UIController`（`@motajs/system`）；`IClientCore`（`extends IClientSystem` 不变）新增 `readonly using: IRendererUsing;` / `readonly sceneController: UIController;` / `readonly mainUIController: UIController;` 三个只读字段（含新增 jsDoc）；无 `state`、无 `IClientBaseExtended`；未改动既有字段与注释 |
| 2 | `packages-user/client-modules/src/client.ts` | import 追加 `IRendererUsing, RendererUsing`（`@motajs/render-vue`）与 `UIController`（`@motajs/system`）；`ClientCore` 新增三个只读字段声明；构造器在 `this.renderer = new MotaRenderer({...})` 之后 `this.using = new RendererUsing(this.renderer);`，并在 `this.mainMapExtension` 之后 `this.sceneController = new UIController('main-scene');` / `this.mainUIController = new UIController('main-ui');`；既有 `rafExcitation` / `excitationDivider` / `renderer` 保持权威（F-03） |

**新增标识符（Task 0 获批）：** 仅 `using` / `sceneController` / `mainUIController` 三个公共只读字段（落 `IClientCore` + `ClientCore`）；无 `state`；无其它新增 / 改名 / 删除公共成员。

## 源 → 目标映射（含 staged 保留项）

| 定义 file:line | 符号 | 处置 |
|---|---|---|
| `render/renderer.ts:43` | `using` | 挂载到 `ClientCore.using`（构造器 `new RendererUsing(this.renderer)`）；模块级站点 staged 保留 |
| `render/scene.ts:3` | `sceneController` | 挂载到 `ClientCore.sceneController`（构造器 `new UIController('main-scene')`）；模块级站点 staged 保留 |
| `render/ui/controller.tsx:11` | `mainUIController` | 挂载到 `ClientCore.mainUIController`（构造器 `new UIController('main-ui')`）；模块级站点 staged 保留 |
| `render/renderer.ts:18,20,35` | `rafExcitation` / `excitationDivider` / `mainRenderer` | F-03：`ClientCore` 实例权威；模块级重复 staged 保留 |
| 其余 24 条单例 | `client` / `texture` / `DEFAULT_FONT` / 全部 `GameUI` 实例 | F-01 / F-04 / F-07：保持原样（不挂载、不触碰） |

## this.state 扫描结论（Task 1 / 2 / 3）

- `git grep -n -E "this\.state" -- packages-user/client-modules/src packages-user/client-base/src` → **无输出**（0 条）。
- 消费 `using` 的站点：`client-base/src/components/misc.tsx:16,227,340`、`client-base/src/components/textboxTyper.ts:7,313`、`client-modules/src/render/ui/main.tsx:31,155` —— 均为函数 / Vue 组件上下文，非「暴露 `this.state` 且类型链声明被挂字段的类」。
- 消费 `sceneController` 的站点：`render/index.tsx:8,17,25`；消费 `mainUIController` 的站点：`render/action.ts:5,17-36`、`render/ui/{controller.tsx:32,main.tsx:29,281,284,statusBar.tsx:7,380,toolbar.tsx:23,94-195}` —— 均为函数 / Vue 组件，非此类。
- 仓内唯一带 `state` 的类在 `client-base/src/material/{autotile.ts:75,builder.ts:30,117,manager.ts:85}`，其 `state: ICoreState` 不含被挂字段。
- **结论：0 处可转换，全部保持原样；未改写任何消费者。**

## F-03 staged 校验（Task 3）

- 权威在 `ClientCore`：构造器内 `const rafExcitation = new RafExcitation();` / `const excitationDivider = new ExcitationDivider<number>();` / `this.renderer = new MotaRenderer({...})`，并赋给 `this.rafExcitation` / `this.excitationDivider` / `this.renderer`。
- 模块级重复 `render/renderer.ts:18,20,35` 仍在（staged）；其消费者非 `this.state` 可转换，且移除会牵连 `createApp` 来源（又不许 alias / `import { client }`），故删除推迟到消费者迁移步骤。
- **结论：F-03 本轮以「ClientCore 权威」声明 + staged 登记实现，未删重复。**

## 逐符号站点对账（修正正则，Task 3 / 4）

- `git grep -n -E "new (RafExcitation|ExcitationDivider|MotaRenderer|RendererUsing)[<(]"` → `RafExcitation` 2 / `ExcitationDivider` 2 / `MotaRenderer` 2 / `RendererUsing` 2。
- `git grep -n -E "new UIController\("` → 4（`client.ts` 2 + `render/scene.ts` 1 + `render/ui/controller.tsx` 1）。
- 合计 12（权威 6 + staged 6）。注意 `new ExcitationDivider<number>()` 的泛型 `<` 由 `[<(]` 捕获。

## Task Commits

1. **Task 0（blocking-human 汇报关卡）** — 用户已回复「可以执行」，无文件改动、无提交
2. **Task 1（tracer）** — `using` 声明于 `IClientCore` + `ClientCore` 构造器构造；staged 站点保持；无独立提交
3. **Task 2** — `sceneController` + `mainUIController` 挂载；staged 站点保持；无独立提交
4. **Task 3** — `this.state` 扫描 + F-03 staged 校验 + 逐符号站点对账；无独立提交
5. **Task 4** — 全量静态门禁 + 范围 / 用户改动基线 + 既有产物保护 + CRLF + 人工复核 + 本 SUMMARY + 白名单提交

**Plan metadata:** 单一白名单提交（见「提交记录」）。

## 提交记录

- `refactor(04-16): 渲染端去单例化第二步（挂载到主类）` —— 单次白名单提交，仅含本计划 `files_modified` 的两个生产文件 + 本 `04-16-SUMMARY.md`（提交 hash 见 orchestrator 回报 / `git log`）。

## 门禁实测结果（全部静态 — D-68 的延续）

| # | 门禁 | 结果（OK 行） |
|---|---|---|
| T1-1 | `using` 挂载 + staged 站点保留 + 无 `state` | ✅ `OK using mounted, staged site kept, no state field` |
| T1-2 | 无转发别名 | ✅ `OK no forwarding aliases introduced` |
| T1-3 | staged 站点 / 消费者零改动 | ✅ `OK staged sites + consumers untouched` |
| T1-4 | D-56 用户改动基线（在场 + 哈希一致） | ✅ `OK user edit present + hash matches baseline` |
| T1-5 | tracer 文件 CRLF | ✅ `OK CRLF tracer files` |
| T2-1 | 两个 `UIController` 挂载 + staged / GameUI 保留 + 无 `state` | ✅ `OK sceneController + mainUIController mounted, staged sites + GameUI kept` |
| T2-2 | 无转发别名 | ✅ `OK no forwarding aliases` |
| T2-3 | `client-modules/render` + `client-base` 零改动 | ✅ `OK client-modules/render + client-base untouched` |
| T2-4 | `client-system` / `packages/` / `src/` porcelain 空 | ✅ `OK client-system/packages/src clean` |
| T2-5 | UI-mount 文件 CRLF | ✅ `OK CRLF UI-mount files` |
| T3-1 | 逐符号站点对账（修正正则） | ✅ `OK reconciled sites: RafExcitation=2 ExcitationDivider=2 MotaRenderer=2 RendererUsing=2 UIController=4 (total 12; client.ts authoritative 6 + modules staged 6)` |
| T3-2 | staged 站点保留 + 无 alias | ✅ `OK staged sites present, no aliases` |
| T3-3 | `render/**` + `client-base` + `client-system` 零改动 | ✅ `OK render/** + client-base + client-system untouched` |
| T3-4 | SUMMARY 记录 `this.state` / F-03 / staged / 0 处 + CRLF | ✅ `OK SUMMARY records this.state scan + F-03 staged + CRLF` |
| T4-1 | 全量内容门禁 | ✅ `OK FINAL CONTENT: 3 fields + ctor new + staged sites + held items + no state/Extended/import type` |
| T4-2 | 逐符号站点对账 | ✅ `OK reconciled: 4 cluster symbols x2 + UIController x4 (authoritative 6 + staged 6 = 12)` |
| T4-3 | 范围 + D-56 + barrel + REQUIREMENTS 门禁 | ✅ `OK scope: client-base/client-system/packages/src clean; REQUIREMENTS+barrels clean; user edit present + hash matches` |
| T4-4 | 既有产物保护（04-01..04-15 零改动；无 04-17+） | ⚠️ 原样门禁因**既有未跟踪文件** `04-15-PLAN.md`（上一 run 未提交，非本 run 触碰）误报 `EXISTING ARTIFACT DIRTY`；按修正后语义（新增未跟踪白名单，保留全部真实断言）✅ `OK existing 04-01..04-15 tracked artifacts untouched (no tracked mods); no 04-17+ plan; untracked = pre-existing 04-15-PLAN.md + expected 04-16 PLAN/SUMMARY`（详见 Deviations 2） |
| T4-5 | ROADMAP 登记（`04-16-PLAN.md` + `Wave 15`） | ✅ `OK ROADMAP has 04-16-PLAN.md / Wave 15 registration` |
| T4-6 | 收口（文件 + SUMMARY 在场、CRLF、关键标识、无 `import type`） | ✅ `OK closure: files + SUMMARY present, CRLF, keyed, no import type` |

## 人工复核结论（Task 4 步骤 (4)）

逐条打开当日源码核对，**全部通过，无偏差**：① 三个字段仅在 `IClientCore`（`types.ts:22-27`）与 `ClientCore`（`client.ts:53,56,57`）上新增，`IClientBase` / `IClientSystem` / `client-system` 未动（porcelain 为空）；② `this.using = new RendererUsing(this.renderer)`（`client.ts:120`）位于 `this.renderer = new MotaRenderer({...})`（`:113-119`）之后；③ `this.sceneController = new UIController('main-scene')` / `this.mainUIController = new UIController('main-ui')`（`client.ts:123,124`）的 id 字符串与旧站点（`render/scene.ts:3` / `render/ui/controller.tsx:11`）逐字一致；④ staged 站点（`render/renderer.ts:18,20,35,43`、`render/scene.ts:3`、`render/ui/controller.tsx:11`）逐字未动、无 alias、无新 `import { client }`（alias 门禁零命中；本计划两文件未引入 `client`）；⑤ `texture`（`cache.ts:280`）/ `DEFAULT_FONT`（`shared.ts:105`）/ 全部 `GameUI` 实例（含 `MainBackgroundUI`，`controller.tsx:29`）与 `core.ts:6` 唯一 `new ClientCore` 均未被触碰/挂载；⑥ 两文件无 `import type`；⑦ `client-base/src/components/{misc,textboxTyper}.tsx` 的 `'../renderer'` 反向耦合（`@ts-expect-error`）逐字未动。

**静态不可证项（如实声明）**：① `IClientCore` 一个 `IRendererUsing` + 两个 `UIController` 字段的类型可满足性（含 `client.ts` 外部类 import 可解析性）；② `ClientCore` 构造器新增 `new` 的 ES 模块求值顺序；③ staged 并存实例的运行时收敛（含 `UIController` 同 id 二次构造告警不影响功能）；④ 无循环引用仅由人工阅读确认。

## Decisions Made

- **设计 option B（镜像数据端）**：单一具体类 `ClientCore` 实现整链；字段按层声明在最上层 `IClientCore`；`IClientBase` / `client-system` 零改动；顶层类不加 `state`（用户 2026-10-01 固定）。
- **新增命名**：`using` / `sceneController` / `mainUIController`（Task 0 获批）。
- **单一白名单提交**：沿用 04-11..04-15 口径，Task 1/2/3 不独立提交，Task 4 单次提交，仅暂存两个生产文件 + 本 SUMMARY。
- **未写其它 `.planning/` 文件**：除本 SUMMARY 外未写 `STATE.md` / `ROADMAP.md` / `WINDOWS.md` / `REQUIREMENTS.md`（`REND-01` / `REND-02` 保持 Pending）。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Tooling] 门禁脚本在 PowerShell 5.1 下 `node -e "..."` 转义不可直跑**

- **Found during:** Task 1 / 2 / 3 / 4 门禁执行
- **Issue:** 计划门禁以 `node -e "..."` 内嵌双引号、`$`、反斜杠与 CJK 字符；本环境 shell 为 Windows PowerShell 5.1，内嵌引号会被 shell 破坏，node 收到被 mangle 的脚本。
- **Fix:** 按计划的 `## Verification Runnability` 指引，把每条门禁的**逐字语义**落到仓库外临时 `.cjs`（`%TEMP%\opencode\04-16-*.cjs`）后执行 `node <file>`；判据与对应 `<fails_when>` 一字不变。
- **Files modified:** 无生产文件（临时工装，位于仓库外）
- **Commit:** 不适用

**2. [Rule 1 - Bug] 既有产物保护门禁对「既有未跟踪文件」误报**

- **Found during:** Task 4 门禁 T4-4
- **Issue:** 原样门禁以 `git status --porcelain -- .planning/phases/04-render-adaptation` 的 `??` 行参与 `04-(0[1-9]|1[0-5])-(PLAN|SUMMARY)` 过滤，把**上一 run 遗留的未跟踪文件** `.planning/phases/04-render-adaptation/04-15-PLAN.md`（`git ls-files` 无此文件；`04-15` 两个提交仅含 `04-15-SUMMARY.md` 与 `04-RENDER-SINGLETON-AUDIT.md`；mtime `2026-10-01 15:56:23`，早于本 run 起始 `10:58:03Z`）判为 `EXISTING ARTIFACT DIRTY`。该文件非本 run 创建 / 修改 / 暂存 / 提交，且门禁 `<fails_when>` 的语义是「改写 / 覆盖了既有产物」——未跟踪文件不存在被「改写」的基线，故属门禁逻辑误报。
- **Fix:** 按门禁**既有语义**（检测既有产物被改写 / 覆盖 + 检测 `04-17+` 新计划）运行修正后的判定：`existing` 过滤排除 `??` 行（保留对已跟踪产物的 ` M`/` D` 等改动检测），`newPlan` 检测不变（未跟踪亦计），并新增未跟踪白名单（仅允许既有 `04-15-PLAN.md` 与本 run 的 `04-16-PLAN.md` / `04-16-SUMMARY.md`）。**未削弱任何实质断言**（更精确，且额外新增白名单断言）。
- **Files modified:** 无生产文件（临时工装，位于仓库外）
- **Commit:** 不适用

---

**Total deviations:** 2（门禁执行方式 1 + 门禁误报修正 1）——**均不涉及生产代码；所有实质判据全部通过**。

## Known Stubs / 开点（只报告不处置）

| # | 余留 | 位置 | 说明 |
|---|---|---|---|
| 1 | staged 并存实例 | `render/renderer.ts:43` / `render/scene.ts:3` / `render/ui/controller.tsx:11` | `ClientCore` 权威实例与模块级 staged 实例并存；`UIController` 静态注册表以 id 去重，二次 `new UIController('main-scene')` / `('main-ui')` 会触发 `logger.warn(57, id)` 且不覆盖注册项。是本轮 staged 迁移的已知后果，待消费者迁移后收敛 |
| 2 | F-03 重复未删 | `render/renderer.ts:18,20,35` | 模块级 `rafExcitation` / `excitationDivider` / `mainRenderer` 保留为 staged；其消费者非 `this.state` 可转换，删除推迟到消费者迁移步骤 |
| 3 | 消费者待迁移 | `render/index.tsx` / `render/ui/*` / `render/action.ts` / `client-base/src/components/*` | 仍消费模块级导出；本轮按用户规则「不能通过 `this.state` 调用的先不管」保持原样 |
| 4 | 静态不可证项 | — | ① `IClientCore` 三字段类型可满足性（含外部类 import 可解析性）；② `ClientCore` 构造器新增 `new` 的 ES 模块求值顺序；③ staged 并存实例的运行时收敛（含同 id 二次构造告警不影响功能）；④ 无循环引用仅由人工阅读确认 |

> 依计划 prohibitions，未写入 `.planning/WINDOWS.md` / `STATE.md` / `ROADMAP.md`（本步仅允许写 `files_modified` 与 `04-16-SUMMARY.md`）。

## Issues Encountered

- 见「Deviations from Plan」的 2 处（门禁脚本 shell 兼容性、既有产物门禁对未跟踪文件误报），均已按规则处置，无生产代码影响。

## 无运行时验证声明（D-68 的延续）

- 本步**没有「保证能运行」的要求**：**未运行** `pnpm check:type` / `pnpm build`，**未使用** TS 诊断数（全仓或范围内）作为任何门禁或验收项。
- 证明方式全部为**静态**：文件内容断言 / staged 站点保留断言 / 逐符号站点反查 / `git status --porcelain` 范围断言 / D-56 用户改动基线 / 既有产物保护 / CRLF，辅以人工代码复核。
- **静态不可证项**：类型可满足性、构造器 `new` 的模块求值顺序、staged 并存实例的运行时收敛，均如实声明为不可静态证明。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **挂载落地**：`using` / `sceneController` / `mainUIController` 已声明于 `IClientCore` 并由 `ClientCore` 构造器构造；`IClientBase` / `client-system` / `render/**` 模块级站点 / 全部消费者零改动（staged）。
- **范围零外溢**：`client-base` 全包（含 `IClientBase` / `material/**`）、`client-system`、数据端（含用户未提交 `combat/context.ts`）、其它 `packages-user/*`、`packages/**`、`src/**`、任何测试 / legacy 面、任何 `package.json` / lockfile、任何 barrel 全部零触碰；无依赖变更、未执行 `pnpm i`、未使用 `import type`。
- **后续增量**：消费者迁移（`this.state` 可转换者改写）、`texture` 后续接口重构、移动端与桌面端双布局、`REND-01` 余下部分；`REND-01` / `REND-02` 仍为 **Pending**，`.planning/REQUIREMENTS.md` 零改动。

---
*Phase: 04-render-adaptation*
*Completed: 2026-10-01*

## Self-Check: PASSED

- `packages-user/client-modules/src/types.ts`: FOUND（`IClientCore` 三字段，门禁 T4-1 全绿）
- `packages-user/client-modules/src/client.ts`: FOUND（三字段 + 构造器三处 `new`，门禁 T4-1 全绿）
- `04-16-SUMMARY.md`: FOUND（CRLF、含关键标识，门禁 T4-6 全绿）
- 用户并发改动 `packages-user/data-system/src/combat/context.ts`: PRESERVED（` M` 仍在场、`git hash-object` = `15dc298aa0dfae778ac18d221ed77641c8fa8163` 与 SUMMARY 标记一致、未暂存、未提交）
- staged 站点（`render/renderer.ts` / `render/scene.ts` / `render/ui/controller.tsx`）与全部消费者: 零改动
- `04-01`..`04-15` 既有产物: 零触碰（无已跟踪改动）；无 `04-17+` 计划文件
- `client-base` / `client-system` / `packages/` / `src/` / barrel / `REQUIREMENTS.md`: 零改动
- commits measured from ledger (`6cff4874..HEAD`): 1
