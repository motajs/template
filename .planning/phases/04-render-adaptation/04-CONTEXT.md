# Phase 4: 渲染适配与双布局 - Context

**Gathered:** 2026-09-18
**Status:** Ready for planning (incremental — 本次仅锁定第一步)

<domain>
## Phase Boundary

阶段 4 的最终目标（ROADMAP）：渲染端通过新数据层接口驱动，并同时支持移动端与桌面端布局（REND-01、REND-02）。

**重要：本阶段无法一次规划完毕。** 用户明确要求增量规划，本次讨论只规划**第一步**：

> 收集当前所有与数据端接口不匹配的渲染端实现（含依赖数据端的渲染行为），形成对账文档，作为后续计划如何拆分实施的依据。数据端未提供而渲染端需要的接口、双方错配等，单独成节写入该文档，便于后续处理。

第一步是**只读清点**，不修改任何代码。后续步骤待第一手对账结果出来后另行规划。

</domain>

<decisions>
## Implementation Decisions

### 增量规划方式
- **D-01:** 阶段 4 采用增量规划，不一次性产出完整计划；本 CONTEXT 仅锁定第一步（对账），后续步骤待对账结果出来后再规划。
- **D-02:** 第一步交付物为对账文档 `.planning/phases/04-render-adaptation/04-RENDER-INTERFACE-AUDIT.md`；该步为只读清点，不改任何代码。

### 对账范围与基准
- **D-03:** 被查对象限定 `packages-user` 下的 `client-base` 与 `client-modules` 两个渲染端包。`packages` 偏向第三方库、本身不影响渲染端与数据端，不查；其余 packages-user 子包（`entry-client`、`legacy-plugin-client`、`legacy-plugin-data`、`data-fallback`）不纳入本次第一步。
- **D-04:** 数据端 `data-common` / `data-base` / `data-system` / `data-state` 不作为被查对象，仅作为接口基准（契约源为各自 `types.ts`、`core.ts`、`ins.ts` 等）。
- **D-05:** 用户会同步修改数据端**实现**，但接口签名不变；对账一律以「接口」为准，不受实现变动影响。

### 问题分类与记录粒度
- **D-06:** 问题按三类划分：① 错配（渲染端按旧形状/旧签名调用，数据端接口已变）；② 数据端缺失（渲染端需要而数据端未提供的接口）；③ 多余旧路径（渲染端仍在走已被新接口取代的 legacy/旧路径）。
- **D-07:** 每条记录精确到接口名，并包含其所属文件、问题描述、影响等内容。
- **D-08:** 采用单文档分节组织；「数据端缺失接口」独立成节，便于后续单独处理。

### 执行方式
- **D-09:** 允许派子代理进行只读扫描（不得修改任何文件）。

### 设计补充（用户裁定，2026-09-18；仅记录，暂不执行）
- **D-10:** `HeroRendering` 删除；渲染端相关的数据存储放到渲染端，渲染端自身也可以继承 `ISaveableContent`。
- **D-11:** 诸如 `getHeroStatusOn` 这种裸函数，除非它是功能性函数，或者属于某些已明确的函数（如 replay 的那些修饰器裸函数），否则大多是将要删除的。
- **D-12:** 所有调用 `core.*` 或 `client.*` 的地方大多需要删除。现行接口设计倾向**无全局单例**：所有内容全部挂到主类上，主类允许多例。其中 `core.*` 属旧引擎适配，应属于**第五阶段**，暂时可忽略；`client.*` 属于**本阶段**需要处理的内容。
- **D-13:** 数据端缺失接口可能较多，等到开始改的时候再逐步确认（本阶段不从对账清单一次性定死缺失接口）。
- **D-14:** 全局 `hook` 和 `loading` 也是 legacy 内容，需要删除。
- **D-15:** 存档系统的 UI 目前还未接入新的存档系统。
- **D-16:** 渲染端还需要进行结构化重构：将渲染端拆为类似数据端的 common-base-system-state 结构，但只需拆为三层——`base-system-client`（不再需要 common）。

### 下一步聚焦（用户裁定，2026-09-18；待规划）
- **D-17:** 由对账结果看，主要失配点在**勇士移动**部分。下一步规划：把**勇士移动适配到新接口**——先进行**接口探索**（并找出缺失的接口），再进行**适配工作**。
- **D-18:** `HeroRendering` 相关暂不处理：用户先修改数据端，之后再处理。

### 设计补充二（用户裁定，2026-09-18；仅记录）
- **D-19:** 移动控制（`startMove` / `oneStep` / `IMoveController` 队列等，即探索文档 `#04-02-G-02`）由用户**手动修改**，AI 暂不处理。
- **D-20:** 勇士渲染为**完全被动渲染**：不得提供允许渲染状态被外部修改的公共接口；旧版 `startMove` 等接口应**删除**，渲染端只需**绑定对应的勇士位置对象**即可。只有渲染端自身有需要的内容（如不透明度、贴图等），才允许在渲染端修改（与 D-10「`HeroRendering` 删除、渲染状态存储放渲染端」一致）。
- **D-21:** 探索文档 `#04-02-G-01`（移动语义钩子）裁决：**按用户新增的 `IObjectMoverHooks.onStepStart` / `onStepEnd` 等现有数据端钩子走**，渲染端改为接入这些已有钩子，**不新增数据端公共接口**（与 D-20 被动渲染一致）。
- **D-22:** **跟随者暂缓**（`IHeroFollower` / `IHeroFollowersController` 及其 hooks）：用户尚未确定「跟随者的位置/动画由数据端驱动还是渲染端计算」以及 `onRemoveAllFollowers` 的处置，需再考虑。本次**不纳入** 04-03，也**不单列**计划；待用户想清楚后再规划。
- **D-23:** **不使用 `client` / `state` 全局单例**（`client-modules/src/core.ts` 的 `client`、`data-state/src/ins.ts` 的 `state`）。若有必须调用它们的地方，**停止执行并告知用户**，由用户决定解决方案；不得自行选择绕过方案。**适用范围：新增/后续改动**；存量单例使用由用户**自己逐步整改**，AI 不主动清除、不据此阻塞当前工作。

### 04-03 人工审查修改要求（用户裁定，2026-09-18；仅记录，待规划）
- **D-24:** 勇士渲染中仍在用的已弃用工具（`@user/data-common` 的 `getFaceMovement` / `degradeFace` / `nextFaceDirection`，见 `data-common/src/common/utils.ts`）**全部改为 `IFaceHandler` 对应接口**（`packages/common/src/utils/types.ts:152`：`degrade` / `movement` / `move` / `opposite` / `next` / `mapDirection` / `mapMovement`）。因不得使用 `state`，**直接在 `MapHeroRenderer` 构造器参数中要求传入 `IFaceHandler`**（`IFaceHandler<FaceDirection>`）；后续用户会按实际情况再调整。
- **D-25:** `IHeroLocationHooks` 与 `IObjectMoverHooks` 的钩子实现**拆成两个类**（两个接口存在重复钩子，合在一个类会重复调用）。且 **`onSetPos` 直接设置，不再判断是否移动中**——渲染必须完全客观地描述数据端正在发生的事情，否则渲染与数据会偏差。
- **D-26:** 补上 **`AnimDir` 的设置**（`ObjectMoveType.AnimDir` 分支不再跳过）。
- **D-27:** **不使用 `mutate-animate`**，改用功能更全的 `@motajs/animate`（前者能实现的后者都能实现）。**本次范围仅限删除勇士（`render/map/extension/hero.ts`）对 `mutate-animate` 的调用并改用 `@motajs/animate`**；其余存量使用由用户自己逐步处理。
- **D-28:** **存量 `state` 使用暂不处理**（含 `hero.ts` 的 `state.roleFace.getFaceOf`）：这涉及引擎整体的底层架构，由用户后续统一整改。本阶段**不因「不得使用单例」而清除存量**；改动只约束新增/后续代码。
- **D-29:** **`degrade` 与 `next` 均用 `Dir4FaceHandler`**（贴图只有四向；与移动 (Dir8) 失配，需单独处理）。因构造器参数已多，**`MapHeroRenderer` 构造器改为直接传入 `IFaceManager`**（`data-common/src/common/faceManager.ts:13`；`core.ts:117-120` 注册 `FaceGroup.Dir4`/`Dir8`）：`degrade` / `next` 经 `faceManager.get(FaceGroup.Dir4)` 取四向处理器；移动相关的 `movement` 仍取勇士自身 `mover.faceHandler`（Dir8）。**注入路径走 B**：`IMapExtensionManager.addHero(state, layer, faceManager)` 新增 `faceManager: IFaceManager` 参数（**改 `types.ts` 接口**），`manager.ts` 转发给构造器；未来接线处再传。后续用户再进一步改进。

### 下一个目标：material 接口适应（用户裁定，2026-09-21；待规划）
- **D-30:** 下一个任务 = **完成 material 相关的接口适应**。用户已自行修改接口 `packages-user/client-base/src/types.ts`（提交 `4e305e3 refactor(type): material types.`，涉及 `material/types.ts`、`types.ts`、多个消费者的同步改名）并改完受影响的一部分内容；剩余未适应的实现与消费者由本任务处理。
- **D-31:** 本次改动的根因：用户**重写了 Texture 的底层管理器，删除 `big-image` 概念**（旧样板概念，新引擎不再需要；旧兼容可**无痛丢弃**）。`4e305e3` 已从接口删除 `IBigImageReturn` / `isBigImage` / `getBigImage` / `getIfBigImage` / `getBigImageByAlias` / `setBigImage` / `bigImageStore`，并把 `IMaterialManager`→`ITextureManager`、`IMaterialGetter`→`ITextureGetter`、`IMaterialAliasGetter`→`ITextureAliasGetter`，新增 `textures` 与 `ICoreStateExtended` 约束。**影响面可能很大。**
- **D-32:** 计划分**两步**：**第一步**收集影响范围（只读清点）；**第二步**进行修改。第二步骤第一步结果与用户审阅后再规划。
  - **边界确认（2026-09-21）：** 范围限 `packages-user`；`packages` 不纳入（理应不受本改动影响）。**以 `packages-user/client-base/src/types.ts`（及 `material/types.ts`）为基准**。**若发现其余 big-image 残留，必须在清点文档中报告。** `src/` 或 `packages/` 内若命中，仅报告、不修改。第一步产出 `.planning/phases/04-render-adaptation/04-MATERIAL-INTERFACE-IMPACT.md`（只读，允许派只读子代理）；第二步待用户审阅第一步结果后再规划。
- **D-33:** **范围外一律不改**；**不追求解决全部类型错误**（整仓 199 条中大量为既有/无关），**只修复与本次 material 接口适应相关的项**。第二步实施时严格按此约束。
- **D-34:** （第二步·实施裁决 2026-09-21）清点文档 **A 类**（已移除的 big-image 符号引用）——**跟 big-image 有关的全部删除**；若有方法/函数依赖它，则做**合理修改或删除**。
- **D-35:** （C 类）**补充实现**——`ITextureManager.textures` 与 `ICoreStateExtended`（`state: ICoreState`）在 `MaterialManager` / `AutotileProcessor` / `AssetBuilder` / `TrackedAssetData` 上的实现；**`state` 统一通过构造器传入**。
- **D-36:** （D 类）**全部删除**——`MaterialManager` 的 big-image 实现残留（`bigImageStore`/`bigImageData`/`bigImageId` 等）与 `render/elements/cache.ts` 的 legacy big-image 路径。
- **D-37:** （E 类）**补充依赖声明**——为 `packages-user/client-base/package.json` 补上 `@user/data-state` 依赖（其源码已 import 该包）。

### the agent's Discretion
- D-07 的「影响」字段具体写法、「多余旧路径」是否需要进一步细分，交由 AI 在对账执行时按实际情况把握，但不得据此扩大范围。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and phase requirements
- `.planning/PROJECT.md` — 项目架构、双端分离、AI 实现边界与质量约束
- `.planning/REQUIREMENTS.md` — REND-01 / REND-02 需求
- `.planning/ROADMAP.md` — Phase 4 目标、成功标准与相邻阶段边界（Phase Details → Phase 4）
- `.planning/STATE.md` — 当前仓库状态与既有决策
- `dev.md` — 项目结构与开发原则；「双端分离」章节定义 `@user/client-base`（系统层）与 `@user/client-modules`（实现层）

### Data-side interface baselines (基准，不是被查对象)
- `packages-user/data-common/src/types.ts` — L0 `IDataCommon` 契约
- `packages-user/data-base/src/types.ts` — L1 `IStateBase` 契约
- `packages-user/data-system/src/types.ts` — L2 `IStateSystem` 契约
- `packages-user/data-state/src/types.ts` — L3 `ICoreState` 契约
- `packages-user/data-state/src/core.ts` — 顶层装配与 legacy 初始化路径
- `packages-user/data-state/src/ins.ts` — 既有单例入口
- `packages-user/data-common/src/replay/types.ts` — 录像命令/沙箱/状态契约
- `packages-user/data-common/src/store/types.ts` — Tile raw-data 与事件访问契约
- `packages-user/entry-data/src/mota.ts` — `Mota` 注册表与 `r()`/`rf()` 渲染调用门控
- `packages-user/data-base/src/game.ts` — `hook` / `gameListener` 渲染通知机制

### Render side under audit (被查对象)
- `packages-user/client-base/src/index.ts` — 渲染系统层入口
- `packages-user/client-modules/src/index.ts` — 渲染实现层入口

### Prior phase context
- `.planning/phases/03-data-completion/03-CONTEXT.md` — 数据端完成阶段的接口边界与已锁定决策（D-01..D-28、S-01..S-05）

</canonical_refs>

<code_context>
## Existing Code Insights

> 本次未对渲染端代码做实际扫描（用户要求讨论阶段不由 AI 先行探索）。以下来自既有 `.planning/codebase/` 分析文档，仅作方向参考；对账执行时以实际代码为准。

### Reusable Assets
- `@user/client-base`（`packages-user/client-base/src/`）— 渲染端系统层，负责渲染核心系统（`load/`、`material/`）
- `@user/client-modules`（`packages-user/client-modules/src/`）— 渲染端实现层，依赖系统层实现渲染与用户交互（`render/`、`action/`、`fallback/`）
- `hook` / `gameListener`（`packages-user/data-base/src/game.ts`）— 数据端向渲染端发布通知的既有机制
- `Mota.r()` / `Mota.rf()`（`packages-user/entry-data/src/mota.ts`）— 数据端调用渲染端代码的唯一受控入口

### Established Patterns
- 依赖方向单向：`src → packages-user → packages`；数据端分层 `data-common → data-base → data-system → data-state`
- 双端分离：渲染端只向数据端发消息，不向数据端推送更新；数据端无 DOM
- 公共契约以 `types.ts` + barrel 导出表达，接口设计归用户，AI 不得自行发明公共接口行为

### Integration Points
- 渲染端读取游戏状态的耦合点即对账重点：需判定其读取的是新数据层接口还是 legacy 全局
- `packages-user/entry-client/src/create.ts` 为渲染端组合根（本次不在被查范围，但对账时可作为理解接线方式的参考）

</code_context>

<specifics>
## Specific Ideas

- 「收集当前所有与数据端接口不匹配的渲染端实现」——不止显式调用，依赖数据端的渲染**行为**也可能不匹配，需一并清点。
- 数据端缺失接口与错配项要单独成节，便于用户后续处理（用户会自行决定其在数据端或渲染端解决）。
- 对账以接口为准，不受用户并行修改数据端实现的影响。

</specifics>

<deferred>
## Deferred Ideas

- 阶段 4 的后续步骤（实际适配实施、移动端/桌面端双布局实现）——待第一步对账结果出来后另行规划。
- 已确认不在本次第一步范围：`packages` 全部、`entry-client`、`legacy-plugin-client`、`legacy-plugin-data`、`data-fallback`。

</deferred>

---

*Phase: 4-渲染适配与双布局*
*Context gathered: 2026-09-18*
