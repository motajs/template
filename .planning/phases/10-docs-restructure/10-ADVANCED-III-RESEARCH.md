# Phase 10: 高级 III「原理与架构」数据端文档 - Research

**Researched:** 2026-10-26
**Domain:** 数据端加载、录像、事件、通行性/寻路、CoreState 组装、插件内部机制（纯文档产出）
**Confidence:** HIGH（源码逐文件阅读；页面切分与渲染端稳定性判断为 MEDIUM）

<user_constraints>
## User Constraints (from CONTEXT.md)

> 本批只涉及 D-53..D-83 中与高级 III 数据端文档相关的决策。D-01..D-52 仍然有效，但不在此重复；本文件所有写作建议均须同时满足它们（尤其 D-45 prettier、D-46 两阶段修订、D-59 库文档风格、D-60 简洁优先、D-61 边界单列、D-62/D-70 代码块完整、D-65 注释充分、D-69 内部实现章节后置、D-72 注释优先、D-73 假定编辑器已完成、D-74 章节锚点、D-80 不写源码叙述、D-81 不把用户问题写进文档）。

### Locked Decisions

- **D-53:** 高级教程分层。高级教程本身按**难度/深度**（而非领域）分为 **I / II / III** 三层（避免与顶层「初级/中级/高级教程」撞名）：
  - **I（基础扩展）**：较低门槛，核心为插件系统与基本扩展机制；
  - **II（深入定制）**：中等门槛，需要理解并修改引擎的特定系统（主题不固定，可能落数据端也可能落渲染端）；
  - **III（原理与架构）**：最高门槛，系统性讲解设计原理与架构。
  由于渲染端尚未完工，**当前只规划/编写数据端内容**。分层是**难度标签，不是领域分类**；具体主题可能在层间调整。
- **D-54:** 高级教程定位。文档面向**使用者**（不是引擎编写者）：在适度解析的同时，必须告诉读者**怎么用、怎么改、怎么自定义**；仍沿用 D-48（实操六步）、D-49（改内置优先/类示例）、D-50（通用模板单独成节）、D-51（落点/副作用/接口讲解方式）、D-52（加粗边界）等规范。
- **D-55:** 优先插件。明确建议：**新增系统优先通过插件系统实现**；只有不得不修改内置系统时才去改内部。理由：版本迁移时 `src` 基本不会改，但内置包（`packages` / `packages-user`）有可能会改，改内置会增加升级时的维护成本。
- **D-56:** 高级 I 内容，7 篇。
  1. **高级 I 导览**：I/II/III 分层、阅读路径与前置、D-55 原则；
  2. **声明式 vs 命令式接口**：旧样板命令式（写一行即生效）vs 新样板声明式（告诉系统要做什么，系统在合适时机执行）；必须讲透，作为后续基础；
  3. **插件系统**：自定义新插件、插件间调用、`dependencies` 依赖与排序、生命周期进阶、插件 id 稳定性与版本迁移；
  4. **可存档内容（`ISaveableContent`）**：存档一致性、三级压缩、注册存档对象、存档顺序 / `afterLoad` / `bindSaveableExecuter`、跨对象引用、结构化约束（structured-cloneable：Object/Array/number/string/boolean/null/Map/Set/TypedArray/ArrayBuffer 等）、必须返回经 `structuredClone` 的对象；
  5. **录像一致性**：`@shouldReplay` / `@ignoreReplay` 该写在什么方法/函数上、能保证什么、不能保证什么；自定义录像行为 → II，深层原理 → III；
  6. **data-common 的 Store**：讲清各 Store 存了什么，明确是**内容层原始数据**、运行时一般**只读**，修改很可能绕过存档/录像/一致性而引发问题；
  7. **钩子深入**：多对象场景（地图与图层）、如何判断「触发者是不是我关心的 map/layer」（身份校验）、同一钩子被多个对象复用、注册/移除与异步钩子。
  每篇仍保留「怎么验证」。
- **D-57:** 高级 I 读者修订循环。高级 I 完成后，**必须**再走用户主导的修订循环（D-46 第 2 阶段）；且这次的读者人格**不能复用中级教程的「不懂代码的游戏作者」**——应面向**对代码有一定了解、了解基本语法（变量/函数/类/import 等），但代码能力一般、不熟悉引擎内部架构**的作者（既不是完全不懂代码，也不预设过高的代码水平；代码能力一般的作者同样需要高级定制内容）。**高级 I 用较低标准，高级 II / III 可适当提高标准。**具体人格在计划中明确，并经用户确认。
- **D-58:** **D-49/D-50 的「改内置还是自己新增」取舍与「必须提供通用模板章节」只适用于中级教程。** 高级教程**不强制**提供模板章节：是否提供视文档内容而定（有些可以加，有些不用加）。高级教程的取舍原则仍是 D-55（优先插件、必要时才改内置）；不要求逐字写「不懂代码就改内置」这类中级提示。
- **D-59:** **高级教程写作风格（修订 D-48 在高级教程中的适用）：** 高级教程按**一般库文档**的方式写（但读者门槛略低于一般库文档，需要多解释概念），**不再使用中级教程的「复制什么 / 改什么」六步实操**，也不要把读者当成什么都不懂。
  - 提供**示例代码 + 注释解释**即可：先说明要做什么，再给出完整示例（含解释性注释），最后说明如何在需要的地方加载/接入（注释标明写在哪里）。
  - 保留必要的概念解释与验证，但用叙述方式，不要步骤化说教。
  - 不写「如果你不怎么懂代码」这类提示（与 D-58 一致）。
  - 适用于高级 I / II / III。
- **D-60（简洁优先，长期规范）：** **文档不是讲得越多越好。** 所有文档的核心目的是让读者知道「怎么用接口」；理解原理也只是为了更好地用。判断标准：
  - 能删的就删，避免面面俱到；
  - 不重复其他教程（如中级已讲过的内容）已经讲清的内容；
  - 对「几乎不可能需要自定义」的内容（如 Store），只讲内置接口怎么用，不展开「自己写」与验证；
  - 高级教程尤其要克制：按库文档方式，只保留读者真正需要的说明与示例。
  适用于后续所有文档写作。
- **D-61（主干与边界分离，长期规范）：** 文档的**主干只讲最核心的内容**；**边界情况、特殊情况不要混入主干**，应在文末**单独开一节**（如「边界与注意」）集中说明。适用于后续所有文档写作。
- **D-62（代码块结构完整，长期规范）：** 文档中的代码块必须是**完整、结构正确的片段**（完整的类 / 函数 / 文件级片段），能让语法高亮正常解析；**不要单独写某个类成员或脱离上下文的片段**。必要时用注释省略无关部分，但仍需保留结构完整。适用于后续所有文档写作。
- **D-63（模板的组织顺序，长期规范）：** 模板**不要放在文档最开头**。正确顺序是：先讲**理念/概念**（要解决什么问题、可以做哪些扩展）→ 再给引导语（「如果想……，可参考下述模板」）→ 模板代码 → 解释模板做了什么、声明了什么类、实现了什么接口、需要自己改什么。适用于后续所有文档写作。
- **D-64（模板 vs 纯接口，长期规范）：** 只有**需要读者自己实现接口或注册内容**时，才提供完整模板；**纯接口使用**（如 Store）只给示例，不给模板。适用于后续所有文档写作。
- **D-65（示例注释，长期规范）：** 示例代码**必须加解释性注释**；注释**越多越好**，以降低读者的理解难度。适用于后续所有文档写作。
- **D-66（杂类功能的示例分开写，长期规范）：** 对内容较杂的功能（如多个 Store 并列），**示例必须按功能分开写**，一个功能一段示例，**不要合并成一大块**；示例应与它所讲的功能**直接对应**。适用于后续所有教程文档的编写。
- **D-67（高级 II 内容，暂定）：** 高级 II 定位为「**深入定制**」（难度层，非领域分类）。**本规划为暂定**，后续可能调整（例如发现高级 I 仍有遗漏内容时），当前先完成高级 II。高级 II 也需要一篇**导览**。拟含 8 个主题 + 导览：
  1. **高级 II 导览**：本层难度定位、前置（高级 I + 中级相关篇目）、阅读路径；
  2. **自定义范围对象**：`IRange` / 范围参数 / 绑定宿主；被光环、地图伤害等复用；
  3. **静态图块与动态图块**：两者区别与转换；**专门讲点事件与图块事件**；
  4. **勇士的装备系统**：装备实例仓、修饰器、排序器、`compareEquip`、装备事件；
  5. **自定义录像指令**：指令码、`IReplayCommand`、主动/被动、注册与沙盒播放；
  6. **自动寻路**：只讲流程（构建图 → Dijkstra 求路径 → 交给移动器），不讲算法细节；
  7. **新增勇士属性**：修改 `IHeroAttr`；示例用**攻速**（每回合造成 `atkSpeed%` 伤害）与**护甲**（战斗百分比减伤）；接入修饰器/伤害计算器；编辑器新增项、状态栏显示等按 D-47 **留空**；
  8. **新增怪物属性**：修改 `IEnemyAttr`；同样用攻速/护甲举例；接入战斗/光环/查询；编辑器新增项、怪物手册（图鉴）修改按 D-47 **留空**；
  9. **怪物上下文与战斗深入**：buildup 管线、优先级、缓存/脏标记、伤害系统与光环/查询/最终的交互。
  推荐顺序：导览 → 范围对象 → 图块（含点事件/图块事件）→ 装备 → 录像指令 → 寻路 → 勇士属性 → 怪物属性 → 怪物上下文与战斗。仍以数据端为主；渲染端与编辑器内容按 D-47 占位。
- **D-68（高级 II 读者水平）：** 不要给高级 II 读者预设过高的代码水平。目标读者应设定为：**已经理解了绝大多数常用语法；认真阅读样板后，能把一部分简单系统和中等复杂度的系统读明白**。审阅人格与文档难度均按此标准，而不是按「资深引擎开发者」预设。
- **D-69（纯内部实现章节，长期规范）：** 讲解**纯内部实现**的章节，开头必须写明「此章节讲解一下 XXX 的内部实现」；这类章节应放在文档**靠后**位置，文档前面以「如何使用」为主。适用于后续所有文档写作。
- **D-70（代码块完整类上下文，长期规范）：** 代码块必须包裹**完整的类上下文**（尤其是类的方法），确保语法高亮正确；不要单独展示脱离类的方法体。适用于后续所有文档写作。
- **D-71（高级 I 待补内容）：** 高级 I 还有未讲内容，待后续补写：**移动 Mover**、**FaceHandler 系列接口**。当前先完成高级 II，之后再补。
- **D-72（注释优先，长期规范）：** 当引擎源码的**注释与实现不一致**时，文档**一律以方法注释为准**，并在对话中**向用户报告**该不一致。不得按实现去改写注释的语义。**该不一致只在对话中报告，不写进文档正文。** 适用于后续所有文档写作。
- **D-73（假定编辑器已完成，长期规范）：** 文档**假定编辑器已经完成**。涉及编辑器 / `.jsonc` 内容配置的地方，只写「需要编辑器」的占位标识；**不要讲「编辑器未就位时改文件、就位后用编辑器」**这类过渡做法。所有 `.jsonc` 均由编辑器负责。适用于后续所有文档写作。
- **D-74（章节锚点链接，长期规范）：** 引用其他文档的**具体章节**时，使用 `./xxx.md#标题` 直接定位到该标题（如 `./static-vs-dynamic-tiles.md#双向转换`）。适用于后续所有文档写作。**待办：** 高级 II 完成后，回头检查高级 I 与中级教程是否存在同类未定位的链接。
- **D-75（高级 I 补写主题）：** 高级 I 需补两篇数据端文档，接入 `docs/advanced/` 与高级 I 侧边栏：
  1. **移动 Mover**（`mover.md`）：`IObjectMover` / `IObjectMovable` / `IMoveController`、移动计划与执行、异步移动、`step` / `forward` / `backward` / `tp` / `face` / `jump` / `speed` / `animDir`、`IObjectMoverHooks` 钩子；讲怎么用、怎么改/扩展。
  2. **FaceHandler 系列**（`face-handler.md`）：`FaceDirection` / `FaceGroup`、`IFaceHandler` / `IFaceDescriptor`、`Dir4FaceHandler` / `Dir8FaceHandler`、`degrade` / `next` / `opposite` / `mapMovement`、`IRoleFaceBinder`；讲怎么用、怎么改/扩展。
  两篇按高级 I 读者水平（D-57：了解基本语法、代码能力一般）与库文档风格（D-59..D-74）编写；渲染端 / 编辑器内容按 D-47 占位。补写完成后同样走独立读者审阅 + 用户修订循环（D-46 / D-57）。
- **D-76（面朝朝向 vs 移动朝向）：** 文档必须明确区分**面朝朝向（`faceDirection`）**与**移动朝向（`moveDirection`）**。`IObjectMover.forward` 的「沿当前移动方向」指的是**面朝朝向**走（不是 `moveDirection`）；`onSetMoveDir` 的「设置朝向」指设置**移动朝向**。源码实现正确，不得把此处注释当作 bug。
- **D-77（文档重心由内容性质决定）：** 文档重心**不是一律讲「怎么用」**，而由所讲内容的性质决定：
  - 样板**已提供、只需使用**的内容 → 重点讲**怎么用**（自定义概率极低，最多一两节带过）；
  - 内容本身就是**靠自定义 / 扩展**实现的 → 重点讲**怎么自定义**。
  二者不冲突。写作后自问：**这篇文档每个章节被使用的概率有多大？** 通篇低概率说明写得不好（除非文档本身就是讲底层自定义）。**若无法判断重心，先问用户，不得自行决定。**
  适用于后续所有文档。
- **D-78（审阅须给出章节使用概率）：** 独立读者审阅时**必须为每个章节给出「被使用的概率」**（高/中/低，并简述理由），让修订者知道哪些重要、哪些可以删减或后置。适用于后续所有读者审阅。
- **D-79（不写使用概率元信息）：** **不要在文档正文写「本节使用概率很低」之类的元信息**。但若某章看起来很有用、实际根本用不到，可以适当提示。适用于后续所有文档写作。
- **D-80（不写源码叙述）：** **不要在文档里写「源码怎么怎么样」**。文档是给人看的，源码级叙述对读者无用。适用于后续所有文档写作。
- **D-81（不把用户问题写进文档）：** 用户提出的是**问题**；**不要把问题本身或「为了解决该问题所以这样写」写进文档**。文档面向读者，不是写给用户看的复盘。适用于后续所有文档写作。
- **D-82（先讲系统模型）：** 讲一个系统时，**先讲清它的模型是什么**（概念、组成、数据流），再讲接口与用法；不要一上来就讲怎么获取、怎么调用。适用于后续所有系统类文档。
- **D-83（高级教程不写模板/需改标记）：** 高级教程中**不再写「模板」「[需改]」等标记或模板章节名**；示例代码只需用**注释说明下一行在做什么**。注意区分：游戏数据领域的「怪物模板 / 原始模板 / 默认模板」等术语不受此限。适用于高级 I / II / III。

### the agent's Discretion

CONTEXT.md 未单独列出 Discretion。按 D-10/D-14，具体页面详略、示例组织、页面内小节顺序属于执行自由度；**页面清单、目录/文件名、公共命名**受 D-13 约束，必须先经用户批准。本文件给出的 8 页切分与文件名为**建议**，不是已批准事实。

### Deferred Ideas (OUT OF SCOPE)

- 初级文档、总览、Agent 参考、API 正文重建。
- 渲染端结构性内容（渲染管线、场景、UI 内部架构）。
- 编辑器 / `.jsonc` 内容配置、序列化事件注册、地图事件 id 绑定。
- legacy 包与 `public/libs/*` 旧引擎作为**当前 API** 的讲解（旧录像只作为对比基线）。
</user_constraints>

<phase_requirements>
## Phase Requirements

Phase 10 没有专属需求 ID；本批以 `10-CONTEXT.md` D-53..D-83 为基线，验收锚在 D-09（人工审阅 + 链接有效 + 构建通过）。

| ID | Description | Research Support |
|----|-------------|------------------|
| D-53 | 高级 III 定位为「原理与架构」，只写数据端 | 本文件按数据端 L0–L3 组织 8 页；渲染端只留边界说明 |
| D-61 | 边界与注意单列文末 | 每页 facts 均列「文末边界」候选 |
| D-77 | 按内容性质决定讲「怎么用」还是「怎么自定义」 | 见「Use vs Customize」矩阵 |
| D-82 | 先讲系统模型，再讲接口 | 见「System Models」各节 |
| D-09 | 人工审阅 + 链接有效 + 构建通过 | 见「Build/verification commands」与「Validation Architecture」 |
</phase_requirements>

## Summary

本批是**纯文档产出**：在 `docs/advanced/iii/` 下新增 1 篇导览 + 7 篇数据端原理文档，并把它们注册进 VitePress 的 `/advanced/` 侧边栏。写作对象是**数据端六个系统**：加载（`@motajs/loader` + `MotaDataLoader`）、录像底层（`ReplayArray` / `ReplaySystem` / `ReplaySandbox`）、事件（`GameEventSystem` / `EventExecutor` / `GameEventStore`）、Anon-Tokyo 解释器、通行性谓词与寻路、`CoreState` 组装与插件内部机制。所有事实均来自本会话对源码的直接阅读，未依赖训练记忆。

**Primary recommendation:** 8 页全部独立成篇，但每篇严格限定「模型 + 关键接口 + 一个可扩展点 + 文末边界」；`anon-tokyo` 与 `event-system`、`plugin-internals` 与 `core-state` 是两组天然相邻页，写作时必须用「本篇只讲 X，Y 见某页」划清边界，否则会重复高级 I/II 已讲内容。渲染端加载只写一个**接口级小节**（`src/client/ui/load.tsx` 如何消费同一个 loader），不写渲染管线；旧录像只作为**对比基线**，不写成当前 API。

### Stability classification（FINAL vs unstable）

| 范围 | 判定 | 依据 |
|------|------|------|
| `@motajs/loader`（LoadTask / LoadManager / starter / types） | FINAL，可写 | 被数据端与渲染端共用，源码完整 [VERIFIED: packages/loader/src/*] |
| `MotaDataLoader` / `PrefixedJSONCProcessor` / `DefaultDataLoaderHook` | FINAL，可写 | 当前 `CoreState` 与 `src/data` 实际使用 [VERIFIED: packages-user/data-state/src/loader/*; src/data/loader/hook.ts] |
| `ReplayArray` / `ReplaySystem` / `ReplaySandbox` | FINAL，可写 | 当前存档/播放实际使用；格式注释完整 [VERIFIED: packages-user/data-common/src/replay/*] |
| `GameEventStore` / `GameEvent` / `GameEventSystem` / `EventExecutor` | FINAL，可写 | 当前事件派发实际使用 [VERIFIED: packages-user/data-common/src/{event,store}/*; packages-user/data-system/src/event/*] |
| `AnonTokyoInterpreter` 模型 | FINAL，可写（模型级） | 当前事件执行实际使用 [VERIFIED: packages/anon-tokyo/src/interpreter.ts] |
| `IPassPredicate` / `MapGraphBuilder` / `PathFinder` / `PathfindingSystem` | FINAL，可写 | 当前初始化与寻路实际使用 [VERIFIED: packages-user/data-base/src/map/types.ts; packages-user/data-system/src/path/*] |
| `CoreState` 构造顺序 / `orderPlugins` | FINAL，可写 | 当前装配实际使用 [VERIFIED: packages-user/data-state/src/core.ts; plugin.ts] |
| 渲染端加载 UI / `ClientCore` 生命周期 | UNSTABLE，只写接口级小节 | `dev.md:136` 明确渲染端底层架构仍需重构；`ClientCore.afterLoad` 有疑点（C2） |
| 本地数据包 FSA starter | 设计能力，不写实现 | 仓库无实现；`ILoadTaskStarter` 是抽象点 [VERIFIED: packages-user/data-state/src/types.ts:73-77] |
| 编辑器 / 序列化事件注册 / 地图事件 id 绑定 | 不在范围 | D-73 + 本批范围；只留占位/边界 |
| `public/libs/*` 旧引擎 | 仅对比基线 | 旧录像用于解释新格式优势，不作为当前 API |

## Scope & Method

- 阅读了 `AGENTS.md`、`dev.md`、`STATE.md`、`ROADMAP.md` Phase 10、`10-CONTEXT.md`（D-53..D-83）、`10-RESEARCH.md` 的文档约定、`docs/advanced/index.md`、`docs/advanced/ii/index.md`、`docs/advanced/ii/pathfinding.md`、`docs/advanced/ii/point-and-tile-events.md`、`docs/advanced/plugin-system.md`、`docs/advanced/saveable-content.md`、`docs/advanced/replay-consistency.md`、`docs/advanced/data-stores.md`、`docs/advanced/ii/custom-replay-command.md`、`docs/.vitepress/config.ts`。
- 逐文件阅读了 `packages/loader/src/*`、`packages-user/data-state/src/*`、`packages-user/data-common/src/{replay,event,store}/*`、`packages-user/data-system/src/{event,path}/*`、`packages-user/data-base/src/{hero,map}/*`、`packages/anon-tokyo/src/{interpreter,type}.ts`、`src/data/**`、`src/client/{entry,initialize,ui/load}.tsx`、`packages-user/client-modules/src/{client,loader/hook}.ts`、`script/test-data-node.ts`、`public/libs/{control,core,utils,items,events,actions}.js`（旧录像基线）。
- 未修改任何 `docs/` 或源码文件；本文件只写研究结论。

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 加载任务与进度聚合 | 核心引擎 `@motajs/loader`（LoadTask / LoadManager） | — | 与游戏无关的通用加载设施，被数据端与渲染端共用 [VERIFIED: packages/loader/src/manager.ts:10-112] |
| 数据端加载编排 | Layer 3 `@user/data-state`（MotaDataLoader / CoreState.load） | Layer 0 配置处理器 | 决定核心配置→额外配置→自定义任务的顺序 [VERIFIED: packages-user/data-state/src/loader/loader.ts:84-142] |
| 录像二进制存储 | Layer 0 `@user/data-common`（ReplayArray / ReplaySystem） | — | 录像格式属于公共数据，不依赖地图/战斗 [VERIFIED: packages-user/data-common/src/replay/array.ts:57-99] |
| 录像播放沙箱 | Layer 0 `@user/data-common`（ReplaySandbox） | Layer 3 状态重置器 | 沙箱只读录像数组；重置由外部 `IStateReseter` 提供 [VERIFIED: packages-user/data-common/src/replay/sandbox.ts:55-62] |
| 事件存储与事件对象 | Layer 0 `@user/data-common`（GameEventStore / GameEvent） | — | 事件实例与触发器属于公共数据 [VERIFIED: packages-user/data-common/src/store/eventStore.ts:5-33] |
| 事件收集与执行 | Layer 2 `@user/data-system`（GameEventSystem / EventExecutor） | Layer 0 解释器 | 事件派发依赖地图图层与勇士位置 [VERIFIED: packages-user/data-system/src/event/system.ts:44-111] |
| 事件脚本解释 | 核心引擎 `@motajs/anon-tokyo` | — | 与游戏无关的通用解释器，数据端只注册内建函数 [VERIFIED: packages/anon-tokyo/src/interpreter.ts:143-219] |
| 通行性判定 | Layer 1 契约 `@user/data-base`（IPassPredicate） | 实现 `src/data/hero/predicate.ts` | 契约属于数据层；默认实现属于游戏内容 [VERIFIED: packages-user/data-base/src/map/types.ts:867-890] |
| 图构建与路径搜索 | Layer 2 `@user/data-system`（MapGraphBuilder / PathFinder） | Layer 1 图层数据 | 构图与搜索是系统层动作 [VERIFIED: packages-user/data-system/src/path/graph.ts:17-151] |
| CoreState 组装 | Layer 3 `@user/data-state` | Layer 0/1/2 构造器 | 顶层只负责装配与生命周期 [VERIFIED: packages-user/data-state/src/core.ts:109-156] |
| 插件依赖排序 | Layer 3 `@user/data-state`（orderPlugins） | — | 纯函数拓扑排序，构造期调用一次 [VERIFIED: packages-user/data-state/src/plugin.ts:20-105] |

## Standard Stack

本批不安装任何新依赖；只使用仓库既有 VitePress 文档工具链。

### Core

| Library | Version (package.json range) | Purpose | Why Standard |
|---------|------------------------------|---------|--------------|
| `vitepress` | `^1.6.4` | 站点生成 | 仓库既有站点载体 [VERIFIED: package.json:92-104] |
| `vitepress-plugin-mermaid` | `^2.0.17` | mermaid 图 | 已启用 [VERIFIED: docs/.vitepress/config.ts:2,12-14] |
| `mermaid` | `^11.12.3` | mermaid 运行时 | 插件依赖 [VERIFIED: package.json:92-104] |
| `prettier` | `^3.8.1` | markdown 格式化 | D-45 要求 [VERIFIED: package.json:92-104] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| VitePress 容器 | 随 VitePress | `:::info` / `:::warning` | 提示与注意事项 |
| `tsx` | `^4.21.0` | 运行 `docs/.vitepress/init.ts` | 构建前生成 `apiSidebar.ts` |

**Installation:** 无。工具链已在 `devDependencies` 中。

## Package Legitimacy Audit

本批**不安装外部包**，因此不触发安装前门禁；无需新增审计表。既有文档工具链的审计结论见 `10-RESEARCH.md` 的 Package Legitimacy Audit。

## System Models

### 1. 加载系统（含渲染端加载）

**模型（先讲这个）：** 一次加载由三层组成：`LoadTask`（一个资源）→ `LoadManager`（聚合任务与字节/任务进度）→ `MotaDataLoader`（按阶段编排配置与自定义任务）。`ILoadTaskStarter` 是环境适配点：网页端用 `WebLoadStarter` 的 `fetch`，Node 端或其他环境可替换为自定义 starter。`MotaDataLoader.start()` 的顺序是：核心配置 → `onCoreConfigLoaded` → 额外配置 → `onExtraConfigLoaded` → 自定义任务 → 全部完成。`CoreState.load()` 把插件 `initialize` 插在 `loader.start()` 之前，把插件 `afterLoad` 插在之后。

**关键接口/类：**

| 名称 | 位置 | 职责 |
|------|------|------|
| `LoadTask<T,R>` | `packages/loader/src/task.ts:24-253` | 单任务：starter → Response → 流式/非流式 → processor → R |
| `LoadManager` | `packages/loader/src/manager.ts:10-112` | 任务集合、总进度、`load()` 异步迭代 |
| `ILoadTaskStarter` | `packages/loader/src/types.ts:186-192` | `start(request): Promise<IResponseLike>` |
| `WebLoadStarter` | `packages/loader/src/starter.ts:3-10` | `fetch` 实现 |
| `LoadDataType` | `packages/loader/src/types.ts:82-88` | `ArrayBuffer` / `Uint8Array` / `Blob` / `Text` / `JSON` |
| `ILoadTaskProcessor` | `packages/loader/src/types.ts:121-128` | `process(response, task): Promise<R>` |
| `MotaDataLoader` | `packages-user/data-state/src/loader/loader.ts:18-151` | 数据端加载编排 |
| `IMotaDataLoader` | `packages-user/data-state/src/loader/types.ts:19-72` | `addCoreConfig` / `addExtraConfig` / `addCustomTask` / `getConfig` |
| `PrefixedJSONCProcessor` | `packages-user/data-state/src/loader/jsoncProcessor.ts:4-28` | 按前缀切分后 `JSON.parse` |
| `DefaultDataLoaderHook` | `src/data/loader/hook.ts:7-29` | 从 `core.jsonc` 添加敌人/道具/地图/图块配置 |
| `RenderLoaderHooks` | `packages-user/client-modules/src/loader/hook.ts:5-25` | 添加贴图/音频/动画/字体配置 |

**数据流：**

```text
CoreState.load()
  ├─ plugin.initialize()                    (数据端插件，加载前)
  ├─ loader.start()
  │    ├─ addCoreConfig 的任务（core.jsonc）
  │    ├─ manager.load() → onCoreConfigLoaded(loader)
  │    ├─ addExtraConfig 的任务（content/*.jsonc）
  │    ├─ manager.load() → onExtraConfigLoaded(loader)
  │    ├─ addCustomTask 的任务
  │    └─ manager.load() → loaded() 兑现
  └─ plugin.afterLoad()                     (数据端插件，加载后)
```

[VERIFIED: packages-user/data-state/src/core.ts:274-283; packages-user/data-state/src/loader/loader.ts:84-142]

**路径解析：** `resolveURL` 在 `import.meta.env.DEV` 时前置 `src/`，构建后不前置 [VERIFIED: packages-user/data-state/src/loader/loader.ts:74-82]。

**自定义加载项/资源（recipe）：**
1. 新配置文件：在 `onCoreConfigLoaded` 或加载前调用 `loader.addExtraConfig(id, url)`；`url` 相对于 `src/content`，文件必须是带系统前缀的 JSONC [VERIFIED: packages-user/data-state/src/loader/types.ts:46-57]。
2. 新资源类型：`new LoadTask<T,R>({ identifier, url, dataType })`，`setProcessor(processor)`，`setStarter(starter)`，再 `loader.addCustomTask(task)`；返回的 Promise 在任务完成后兑现 [VERIFIED: packages-user/data-state/src/loader/loader.ts:65-68; packages/loader/src/task.ts:50-77]。
3. 新环境：实现 `ILoadTaskStarter.start(request)`，返回 `IResponseLike`；把它传给 `createCoreState(starter)` / `createClientCore(starter)` [VERIFIED: packages-user/data-state/src/types.ts:72-84; src/data/entry.ts:28-32]。
4. 本地数据包（File System Access API）：只作为**设计能力**说明——`ILoadTaskStarter` 把「取响应」抽象出来，换一个 starter 即可从本地目录/文件读取；仓库内没有实现，不写代码 [VERIFIED: packages-user/data-state/src/types.ts:73-77; packages/loader/src/starter.ts:3-10]。

**渲染端加载：** 包含一个**接口级小节**即可，不单独成页。`src/bootstrap.ts:12-16` 用 `WebLoadStarter` 创建 `ClientCore` 并打开 `LoadSceneUI`；`LoadScene` 直接迭代 `props.state.loader.start()`，用 `loader.manager.getLoadedTasks()` / `getAddedTasks()` / `getLoadedByte()` / `getTotalByte()` / `getByteRatio()` 画进度 [VERIFIED: src/client/ui/load.tsx:52-174]。`RenderLoaderHooks` 追加渲染端配置 [VERIFIED: packages-user/client-modules/src/loader/hook.ts:5-25]。渲染端底层架构仍在重构（`dev.md:136`），且 `ClientCore.afterLoad` 存在实现疑点（见「Source/comment conflicts」），所以**只写 loader 接口消费，不写场景/UI 生命周期**。

### 2. 录像系统底层

**模型：** `ReplaySystem` 持有一个 `ReplayArray`（二进制录像）与一个可选的 `ReplaySandbox`（播放器）。录制时 `record(code, ...params)` 把一步追加到数组；播放时沙箱用 `createReadStream()` 顺序读，主动步直接执行，被动步由外部 `getPassive()` 取参数并在完成后 `next(status)`。存档时 `saveState()` 返回 `{ length, commandWidth, commandArray, paramArray }`，读档时 `loadState()` 用 `setReplayArray()` 重建索引。

**关键接口/类：**

| 名称 | 位置 | 职责 |
|------|------|------|
| `ReplayArray` | `packages-user/data-common/src/replay/array.ts:57-900` | 二进制存储、索引、读写流、编辑 |
| `ReplaySystem` | `packages-user/data-common/src/replay/system.ts:21-114` | 注册指令、记录、沙箱、禁用、存档 |
| `ReplaySandbox` | `packages-user/data-common/src/replay/sandbox.ts:29-315` | 播放循环、主动/被动步、暂停/恢复/单步 |
| `IReplayCommand` | `packages-user/data-common/src/replay/types.ts:62-78` | `type` + `execute(step)` + 可选 `finalize()` |
| `ReplayCommandType` | `packages-user/data-common/src/replay/types.ts:24-29` | `Active` / `Passive` |
| `ReplayCommandResult` | `packages-user/data-common/src/replay/types.ts:31-38` | `Success` / `Failed` / `Ignored` |
| `ReplayParamValue` | `packages-user/data-common/src/replay/types.ts:40` | `number \| string \| boolean \| bigint` |
| `IReplaySystemSave` | `packages-user/data-common/src/replay/types.ts:373-405` | 存档形状 |
| `IReplaySandbox` | `packages-user/data-common/src/replay/types.ts:114-166` | 播放控制与 `getPassive()` |
| `IStateReseter` | `packages-user/data-common/src/replay/types.ts:168-174` | 播放前重置游戏状态 |

**二进制布局（精确事实）：**
- 指令缓冲区：每条指令 `commandSize` 字节；`Uint8` 宽度为 2 字节（参数数量 1 字节 + 指令 id 1 字节），`Uint16` 宽度为 3 字节（参数数量 1 字节 + 指令 id 2 字节）[VERIFIED: packages-user/data-common/src/replay/array.ts:143-149,345-356; packages-user/data-common/src/replay/types.ts:379-383]。
- 参数缓冲区：每个参数 = 1 字节类型 + 载荷；类型码与长度：`0 boolean` 2B、`1 int8` 2B、`2 int16` 3B、`3 int32` 5B、`4 非负 int64` 9B、`5 负 int64` 9B、`6 float` 9B、`7 非负 bigint` n+2B、`8 负 bigint` n+2B、`9 string` n+5B、`32..255` 短字符串 n+1B [VERIFIED: packages-user/data-common/src/replay/array.ts:11-34,227-309,363-409; packages-user/data-common/src/replay/types.ts:286-302]。
- int64：按幅值拆高低 32 位，`high = floor(magnitude / 2147483648)`，`low = magnitude - high * 2147483648`；解码 `low + high * 2147483648`，负类型取负 [VERIFIED: packages-user/data-common/src/replay/array.ts:383-389,687-698]。
- bigint：按幅值小端字节写入，长度 1 字节；幅值必须 `< 2^2040`，否则告警 152 并丢弃 [VERIFIED: packages-user/data-common/src/replay/array.ts:270-288,703-712]。
- 索引数组：`Uint32Array`，每个指令记录参数起始字节；`add` 写 `indexArray[length] = paramUsed` [VERIFIED: packages-user/data-common/src/replay/array.ts:70-84,438,828-846]。
- 初始容量：1000 条指令、10000 参数字节；扩容乘数 1.2；上限 1,000,000 条 / 10,000,000 字节 [VERIFIED: packages-user/data-common/src/replay/system.ts:34-42]。
- 读取流：`createReadStream(startIndex)` 返回 `{ index, length, expired, read, destroy }`；任何写操作调用 `expireStreams()` 把旧流标记过期 [VERIFIED: packages-user/data-common/src/replay/array.ts:215-220,787-822]。
- 编辑：`insert` / `delete` / `set` 会移动指令/参数缓冲区并平移索引，注释明确「耗时较长，不建议频繁调用」[VERIFIED: packages-user/data-common/src/replay/array.ts:445-584; packages-user/data-common/src/replay/types.ts:232-260]。
- 存档：`saveState()` 直接返回 `commandArray` / `paramArray` 的内部 `ArrayBuffer` 引用，不复制 [VERIFIED: packages-user/data-common/src/replay/system.ts:97-104; packages-user/data-common/src/replay/array.ts:879-885]。读档 `setReplayArray()` 重建索引并过期所有读流 [VERIFIED: packages-user/data-common/src/replay/array.ts:848-875]。
- 禁用：`disabled` 是嵌套计数；`disable()` +1，`revert()` -1，`clearDisableFlag()` 归零 [VERIFIED: packages-user/data-common/src/replay/array.ts:887-899; packages-user/data-common/src/replay/types.ts:323-339]。

**沙箱模型（精确事实）：**
- `createReplaySandbox(config)` 先 `config.reseter.reset(config.save)`，再 `new ReplaySandbox(config.route, this, config.startIndex ?? 0)`，并记录为当前沙箱 [VERIFIED: packages-user/data-common/src/replay/system.ts:70-82]。
- 沙箱构造时创建 `route.createReadStream(startIndex)` [VERIFIED: packages-user/data-common/src/replay/sandbox.ts:55-62]。
- 主动步：`command.execute(curr)`；被动步：`getPassive()` 返回 `{ step, next }`，外部调用 `next(status)` 后才读取下一步 [VERIFIED: packages-user/data-common/src/replay/sandbox.ts:81-110,146-224]。
- 连续步骤的 `finalize()` 在上一步指令与下一步指令不同、或录像结束时触发 [VERIFIED: packages-user/data-common/src/replay/sandbox.ts:115-123,162-205]。
- 控制：`play` / `pause` / `resume` / `stop` / `step` / `setSpeed`；`getReplayed()` 返回已播放步数（不含当前步）[VERIFIED: packages-user/data-common/src/replay/sandbox.ts:70-77,263-312; packages-user/data-common/src/replay/types.ts:136-165]。

**Use vs customize：** 使用侧重点是 `record` / `registerCommand` / `getCommand` / `createReplaySandbox` / `getPassive`；自定义侧重点是**新增指令**（`ReplayCode` + `IReplayCommand` + 注册），已在高级 II 的 `custom-replay-command.md` 讲透，本篇只链接，不重复 [CITED: docs/advanced/ii/custom-replay-command.md:18-245]。`ReplayArray` 的 insert/delete/set 属于底层编辑能力，除非做录像编辑器，否则不展开。

### 3. 事件系统

**模型：** 事件系统由「事件实例仓库」+「事件对象」+「收集器」+「执行器」+「解释器」组成。`GameEventStore` 以 id 存 `IReadonlyGameEvent`；`GameEvent` 持有 `rawEvent: Statement[]` 与 `compiled: AnonTokyoExecutable | null`；`GameEventSystem.collectEvent(layer, trigger, x, y)` 从事件层收集该坐标的点事件与图块事件，按「先点事件、后图块事件，各自优先级降序」生成 `IGameEventInvocation[]`；`EventExecutor.execute()` 逐条从 store 取事件、过滤触发器、执行并折叠返回值。事件层就是 `alias === 'event'` 的普通图层。

**关键接口/类：**

| 名称 | 位置 | 职责 |
|------|------|------|
| `EventTrigger` | `packages-user/data-common/src/event/types.ts:7-30` | 触发器枚举 |
| `IReadonlyGameEvent` / `IGameEvent` | `packages-user/data-common/src/event/types.ts:32-74` | 事件对象契约 |
| `GameEvent` | `packages-user/data-common/src/event/event.ts:8-54` | 编译/执行/设置原始数据与触发器 |
| `GameEventStore` | `packages-user/data-common/src/store/eventStore.ts:5-33` | id → 事件实例 |
| `IGameEventStore` | `packages-user/data-common/src/store/types.ts:291-311` | `addEvent` / `getEvent` |
| `GameEventSystem` | `packages-user/data-system/src/event/system.ts:24-112` | 默认 store、解释器、`collectEvent` |
| `EventExecutor` | `packages-user/data-system/src/event/executor.ts:20-114` | 执行、模式、折叠、钩子 |
| `BlockEventType` | `packages-user/data-system/src/event/types.ts:16-23` | `CommonEvent` / `PointEvent` / `TileEvent` |
| `IBlockEventEnv` | `packages-user/data-system/src/event/types.ts:30-49` | 事件环境字段 |
| `IBlockEventParam` | `packages-user/data-system/src/event/types.ts:25-28` | `{ custom: Record<string, any> }` |
| `EventExecuteMode` | `packages-user/data-system/src/event/types.ts:70-77` | `Normal` / `CutIfFalsy` / `CutIfTruthy` |
| `EventReduceMode` | `packages-user/data-system/src/event/types.ts:79-92` | `NoReduce` / `OrReduce` / `AndReduce` |
| `BuiltInFunction` | `packages/anon-tokyo/src/interpreter.ts:11-18` | `name` + `func(param, env)` |

**收集与执行（精确事实）：**
- `collectEvent` 先 `layer.inMap(x,y)`；点事件来自 `layer.getPointEvent(x,y)`，图块事件来自 `loc.static.tileEvent().get()` 与 `loc.dynamics` 的每个 `tile.tileEvent().get()` [VERIFIED: packages-user/data-system/src/event/system.ts:44-89]。
- 点事件与图块事件各自按 `priority` 降序排序，再拼接 [VERIFIED: packages-user/data-system/src/event/system.ts:90-108]。
- 每个 invocation 的 env 包含 `state` / `type` / `trigger` / `system` / `heroLocator` / `heroFloor` / `triggerLocator` / `tile` / `layer` / `map` [VERIFIED: packages-user/data-system/src/event/system.ts:95-107; packages-user/data-system/src/event/types.ts:30-49]。
- `EventExecutor.execute()` 对每条 invocation：store 为空或事件不存在 → 告警 171 并跳过；`event.trigger !== invocation.env.trigger` → 跳过；否则 `await event.execute(param, env)` [VERIFIED: packages-user/data-system/src/event/executor.ts:81-99]。
- `EventExecuteMode.CutIfFalsy` 在结果 falsy 时 break；`CutIfTruthy` 在 truthy 时 break [VERIFIED: packages-user/data-system/src/event/executor.ts:100-105]。
- `EventReduceMode.OrReduce` / `AndReduce` 对非布尔值告警 172，并按短路规则折叠 [VERIFIED: packages-user/data-system/src/event/executor.ts:53-71]。
- `EventExecutor.execute` 标有 `@shouldReplay('Executing event should be replayed.')` [VERIFIED: packages-user/data-system/src/event/executor.ts:73-77]。

**触发器（精确事实）：** `EventTrigger` 的完整值是 `None` / `OnTouch` / `OnEnter` / `OnLeave` / `OnBeforeBattle` / `OnAfterBattle` / `OnBeforeOpenDoor` / `OnAfterOpenDoor` / `OnAfterGetItem` / `OnBeforeChangeFloor` / `OnAfterChangeFloor` [VERIFIED: packages-user/data-common/src/event/types.ts:7-30]。本仓库内**只有** `OnEnter` / `OnLeave` / `OnTouch` 有派发调用点，均由 `DefaultHeroMoveTopImpl` 的 `enter` / `leave` / `hit` 触发 [VERIFIED: src/data/hero/moverImpl.ts:72-82]；`cannotEnter` 是空实现 [VERIFIED: src/data/hero/moverImpl.ts:87-90]。其余触发器值是枚举的一部分，但本仓库没有对应派发调用点——文档应写成「当前数据端内置派发覆盖进入/离开/触碰，其余由对应系统使用/预留」，不要写成「全部已实现」。

**事件层（精确事实）：** `IGameMap.eventLayer` 是「当前楼层的默认事件层」，类型 `IMapLayer | null` [VERIFIED: packages-user/data-base/src/map/types.ts:668-669]；`MapState.fromRaw` 在图层 `alias === 'event'` 时调用 `setEventLayer(layer)` [VERIFIED: packages-user/data-base/src/map/mapState.ts:89-91]。事件层是普通图层，具备 `getPointEvent` / `getLocationData` / `event` 等接口 [VERIFIED: packages-user/data-base/src/map/types.ts:478-600]。

**自定义事件内建函数（recipe）：**
1. 在 `src/data/event/*.ts` 写一个类，`implements BuiltInFunction<P, IBlockEventEnv>`，提供 `name: string` 与 `func(param, env)` [VERIFIED: src/data/event/map.ts:9-31; src/data/event/event.ts:9-21]。
2. 参数接口写在 `src/data/event/types.ts`，例如 `ISetBlockEventParam` / `IMoveHeroEventParam` [VERIFIED: src/data/event/types.ts:1-66]。
3. 把实例加入 `createEventRegistrations()` 返回数组；该数组最终进入 `ICoreStateConfig.events`，再由 `GameEventSystem` 构造 `AnonTokyoInterpreter` [VERIFIED: src/data/event/registrations.ts:9-24; src/data/entry.ts:15-20; packages-user/data-state/src/core.ts:130; packages-user/data-system/src/event/system.ts:33-36]。
4. 在 `func` 中通过 `env.state` / `env.layer` / `env.map` / `env.trigger` / `env.tile` 取上下文；需要默认图层时用 `getPossibleLayer(env)` [VERIFIED: src/data/event/utils.ts:6-30]。
5. **不要**在本篇讲序列化事件注册 / 地图事件 id 绑定——这是编辑器负责、当前未实现的部分 [CITED: 10-CONTEXT.md D-42; 10-STATE.md Phase 01 decisions]。

**Use vs customize：** 使用侧是 `collectEvent` + `executor.execute` + `eventStore.getEvent`；自定义侧是内建函数类 + 注册。`EventTrigger` 是 `const enum`，新增触发器值需要改 `packages-user` 并在派发点处理，属于引擎级改动，文档只说明边界，不鼓励。

### 4. Anon-Tokyo 解释器模型

**模型：** Anon-Tokyo 把「事件脚本」表示为 `Statement[]`。`AnonTokyoInterpreter` 接收 `LanguageFeature { builtInFunctions, globalFunctions }`；`compile(script)` 把语句编译成 `AnonTokyoExecutable`（内部是 `ExecutionNode[]` 程序）；`exec(parameters, env)` 创建 `AnonTokyoExecutionContext`，由 `AnonTokyoIterator` 反复执行当前节点，处理 `Move` / `Call` / `Return` / `Exit` 四种操作。`GameEvent` 缓存编译结果，`setRaw` 时清空缓存。

**关键接口/类：**

| 名称 | 位置 | 职责 |
|------|------|------|
| `BuiltInFunction` | `packages/anon-tokyo/src/interpreter.ts:11-18` | `name` + 可选 `save` + `func(parameters, env)` |
| `LanguageFeature` | `packages/anon-tokyo/src/interpreter.ts:20-23` | `builtInFunctions` + `globalFunctions` |
| `AnonTokyoInterpreter` | `packages/anon-tokyo/src/interpreter.ts:143-219` | 注册内建/全局函数、`compile`、`exec` |
| `AnonTokyoExecutable` | `packages/anon-tokyo/src/interpreter.ts:114-138` | 程序节点 + `exec` |
| `AnonTokyoExecutionContext` | `packages/anon-tokyo/src/interpreter.ts:84-109` | 调用栈 + `env` |
| `AnonTokyoIterator` | `packages/anon-tokyo/src/interpreter.ts:27-79` | 执行循环 |
| `Statement` | `packages/anon-tokyo/src/type.ts:86-95` | 语句联合类型 |
| `StatementType` | `packages/anon-tokyo/src/type.ts:1-17` | 语句种类 |
| `Scope` | `packages/anon-tokyo/src/type.ts:210-214` | `args` / `local` / `env` |
| `OPType` / `OP` | `packages/anon-tokyo/src/type.ts:197-208` | `Move` / `Call` / `Return` / `Exit` |
| `ExecutionNode` | `packages/anon-tokyo/src/type.ts:216` | `(scope) => Promise<OP> \| OP` |

**精确事实：**
- `StatementType` 的值是 `Expression` / `Call` / `Return` / `If` / `Switch` / `Loop` / `Break` / `Continue` / `Block` / `Exit` / `FunctionDeclare` [VERIFIED: packages/anon-tokyo/src/type.ts:1-17]。
- `Expression = (env: Scope) => any`，`Value = Literal | Expression`，`Block = Statement[]` [VERIFIED: packages/anon-tokyo/src/type.ts:19-23]。
- `compile(script)` 通过 `compile(script, name => this.getBuiltInFunction(name))` 生成程序；`getBuiltInFunction` / `getGlobalFunction` 找不到时直接 `throw` 字符串 [VERIFIED: packages/anon-tokyo/src/interpreter.ts:164-202]。
- `AnonTokyoExecutionContext.callByName` 查全局函数；`call` 把 iterator 压栈、`run` 后弹栈 [VERIFIED: packages/anon-tokyo/src/interpreter.ts:92-106]。
- `AnonTokyoIterator.next()` 根据 `OPType` 更新 `current`：`Move` 跳到下一节点，`Call` 调 `callByName`，`Return` 记返回值，`Exit` 置 -2 [VERIFIED: packages/anon-tokyo/src/interpreter.ts:38-67]。
- `GameEvent.compile()` 调 `interpreter.compile(rawEvent)` 并缓存；`execute()` 优先用 `compiled`，否则编译，再不行直接 `interpreter.exec(rawEvent, param, env)`；`setRaw` 把 `compiled` 置 `null` [VERIFIED: packages-user/data-common/src/event/event.ts:24-49]。
- `GameEventSystem` 构造时 `new AnonTokyoInterpreter({ builtInFunctions: [...builtins], globalFunctions: [] })` [VERIFIED: packages-user/data-system/src/event/system.ts:33-36]。

**Use vs customize：** 使用侧是「事件对象已经替你 compile/exec」；自定义侧是新增 `BuiltInFunction` 或提供 `globalFunctions`（当前数据端传空数组）。不要在本篇讲 `compile.ts` 的解析/优化细节；只讲「编译成可执行程序 → 迭代执行」的模型。

### 5. 通行性谓词与寻路原理

**模型：** 通行性谓词 `IPassPredicate` 是「一步能不能走、撞不撞」的唯一语义契约：`canPass(handler)` 判断能否从 `currLoc` 进入 `nextLoc`，`shouldHit(handler)` 判断这次移动是否应产生撞击。勇士移动器在 `onStepStart` 里用 `topImpl.predicate()` 调它；寻路图构建器在 `build()` 里用注入的谓词调它。**同一个契约**保证「寻路选出的路」和「勇士实际能走的路」一致；但注意它们是**两个实例**：`DefaultHeroMoveTopImpl` 自己 `new DefaultPassPredicateImpl(state)`，`MainDataPlugin.awake` 又为 finder `new DefaultPassPredicateImpl(state)`。寻路流程是「构图 → 搜索 → 交给移动器」：`MapGraphBuilder.build(start)` 从起点 BFS 只扩展可通行边，`shouldHit` 标记终端节点；`PathFinder.search()` 在图上做最小损失搜索，终端节点只能作为终点；`PathfindingSystem.moveTo/teleportTo` 把步骤交给绑定的 `IObjectMover`。

**关键接口/类：**

| 名称 | 位置 | 职责 |
|------|------|------|
| `IPassCheckHandler` | `packages-user/data-base/src/map/types.ts:867-876` | `currLoc` / `nextLoc` / `direction` / `map` |
| `IPassPredicate` | `packages-user/data-base/src/map/types.ts:878-890` | `canPass` / `shouldHit` |
| `DefaultPassPredicateImpl` | `src/data/hero/predicate.ts:6-86` | 默认实现：事件层 + 其它图层 `onlyEvents` |
| `IHeroMoveTopImpl` | `packages-user/data-base/src/hero/types.ts:358-368` | `predicate()` 等勇士顶层行为 |
| `MapGraphBuilder` | `packages-user/data-system/src/path/graph.ts:17-151` | 构图 |
| `PathFinder` | `packages-user/data-system/src/path/finder.ts:96-214` | 搜索 |
| `PathfindingSystem` | `packages-user/data-system/src/path/system.ts:21-130` | 绑定移动器、`getPath` / `moveTo` / `teleportTo` |
| `PathfindingStatus` | `packages-user/data-system/src/path/types.ts:107-116` | `Success` / `InvalidInput` / `NoPath` / `TargetUnder` |

**精确事实：**
- `DefaultPassPredicateImpl.canPass`：先取 `FaceGroup.Dir4` 处理器，`degrade(direction)`；检查事件层当前格 `outPass` 与目标格 `inPass`；再遍历 `map.layerList` 中非事件层，只对 `onlyEvents` 的图块检查通行位 [VERIFIED: src/data/hero/predicate.ts:30-74]。
- `shouldHit`：目标格静态图块存在且 `!nextRaw.eventPass` 时返回 true [VERIFIED: src/data/hero/predicate.ts:76-84]。
- 勇士移动：`onStepStart` 创建 `IPassCheckHandler`，`predicate.canPass` 为 false → `CannotMove`；为 true 且 `shouldHit` → `Hit`；否则 `Step` [VERIFIED: packages-user/data-base/src/hero/mover.ts:201-217]。
- 移动结束：`CannotMove` 调 `topImpl.cannotEnter` 并停止；`Hit` 调 `topImpl.hit` 并停止；`Step` 返回 `nextLoc` [VERIFIED: packages-user/data-base/src/hero/mover.ts:256-282]；`onStepSettled` 先 `leave` 再 `enter` [VERIFIED: packages-user/data-base/src/hero/mover.ts:285-301]。
- 构图：`build(start)` 检查 layer / predicate / face 是否注入，起点是否在 map 内；BFS 用 `face.mapMovement()` 的每个方向，跳过原地，`layer.inMap` 后构造 handler，`predicate.canPass` 失败则跳过，`predicate.shouldHit` 则把 `nextIndex` 加入 terminals；只把从起点可达的节点放入 `nodes` [VERIFIED: packages-user/data-system/src/path/graph.ts:67-150]。
- 搜索：`search()` 用距离堆 + `dist` / `prev` / `visited`；起点等于终点返回空；目标不在图中返回空；`node.terminal` 的节点不能作为中间点（`next.terminal && edge.to !== targetIndex` 跳过）；回溯得到步骤 [VERIFIED: packages-user/data-system/src/path/finder.ts:135-197]。
- `find()`：起点=终点 → `TargetUnder`；`build` 返回 null → `InvalidInput`；路径空 → `NoPath`；否则 `Success` [VERIFIED: packages-user/data-system/src/path/finder.ts:199-213]。
- 初始化：`MainDataPlugin.awake` 创建 `DefaultPassPredicateImpl` 注入 finder，图层先 `null`，`useMover(state.hero.location.mover)`；再创建 `DefaultHeroMoveTopImpl` 并 `useTopImplementation` [VERIFIED: src/data/initialize.ts:34-43]。
- 图层校验：`PathFinder.useMapLayer` 检查 `layer.state !== this.state`，不属于当前状态时告警 182 并忽略 [VERIFIED: packages-user/data-system/src/path/finder.ts:107-115]。
- 移动器：`startMove` 若有未完成移动返回 null；逐步移动对每步 `mover.step(step.dir)`；瞬移 `mover.tp(last.to.x, last.to.y)`；`controller.onEnd` 后触发 `onAfterTeleportTo` [VERIFIED: packages-user/data-system/src/path/system.ts:72-103]。
- `teleportTo`：没有策略或策略返回 true → 逐步；否则瞬移 [VERIFIED: packages-user/data-system/src/path/system.ts:112-121]。

**自定义谓词（recipe）：**
1. 实现 `IPassPredicate` 的 `canPass` / `shouldHit`，输入是 `IPassCheckHandler` [VERIFIED: packages-user/data-base/src/map/types.ts:867-890]。
2. 寻路侧：`state.pathfinding.finder.usePassPredicate(new MyPredicate(state))` [VERIFIED: packages-user/data-system/src/path/types.ts:138-142]。
3. 勇士侧：`DefaultHeroMoveTopImpl` 内部硬编码 `new DefaultPassPredicateImpl(this.state)` [VERIFIED: src/data/hero/moverImpl.ts:20-27]；要换语义，需实现 `IHeroMoveTopImpl`（其 `predicate()` 返回你的谓词）并 `state.hero.location.mover.useTopImplementation(impl)`，或直接改 `DefaultHeroMoveTopImpl` [VERIFIED: packages-user/data-base/src/hero/types.ts:358-368; packages-user/data-base/src/hero/mover.ts:55-57]。
4. 自定义损失/瞬移策略属于高级 II，链接 `../ii/pathfinding.md`，本篇不重复 [CITED: docs/advanced/ii/pathfinding.md:138-204]。

### 6. CoreState 组装初始化

**模型：** `CoreState` 是数据端的组合根：构造函数按 Layer 0 → Layer 1 → Layer 2 → Layer 3 的顺序 `new` 出所有子系统，并把 `this` 注入需要反向引用的对象；然后注册数据端插件、按 `dataDeps` 排序、同步 `awake()`。`load()` 依次执行插件 `initialize()`、`loader.start()`、插件 `afterLoad()`，最后检查所有插件是否 `Loaded`。存档注册与执行器也挂在 CoreState 上。

**构造顺序（精确事实）：**
- L0：`roleFace`（`RoleFaceBinder`）、`faceManager`（`FaceManager`）、`tileStore`（`TileStore`）、`itemStore`（`ItemStore`）、`mapStore`（`MapStore`）、`eventStore`（`GameEventStore`）、`enemyStore`（`EnemyStore`）、`replaySystem`（`ReplaySystem`）[VERIFIED: packages-user/data-state/src/core.ts:111-119]。
- L1：`flags`（`FlagSystem`）、`maps`（`MapState(this)`）、`hero`（`HeroState(this)`）、`enemyManager`（`EnemyManager`）[VERIFIED: packages-user/data-state/src/core.ts:121-125]。
- L2：`enemyContext`（`EnemyContext(this)`）、`combat`（`CombatFlow(this)`）、`eventSystem`（`GameEventSystem(this, config.events)`）、`pathfinding`（`PathfindingSystem(this)`）[VERIFIED: packages-user/data-state/src/core.ts:127-131]。
- L3：`loadManager`（`LoadManager`）、`loader`（`MotaDataLoader(this.loadManager, config.loadStarter)`），然后 `loader.addCoreConfig('core', config.coreURL)` [VERIFIED: packages-user/data-state/src/core.ts:133-137]。
- 插件注册：遍历 `config.dataPlugins`，重复 id 告警 78；构造 `deps`（`dataDeps`）并 `orderPlugins(deps)`；最后 `this.awake()` [VERIFIED: packages-user/data-state/src/core.ts:139-155]。
- `load()`：`await this.initialize()` → `yield* this.loader.start()` → `await this.afterLoad()` → 检查所有插件状态，非 `Loaded` 告警 81 [VERIFIED: packages-user/data-state/src/core.ts:274-283]。
- 存档：`saveables` / `addedSaveables` / `executors` 三个私有容器；`addSaveableContent` 重复 id 告警 112；`bindSaveableExecuter` 可传 id 或对象，未注册对象告警 113；`loadState` 先 `replaySystem.array.clearDisableFlag()`，每个对象 `disable()` → `loadState` → `revert()`，执行器在包裹之外 [VERIFIED: packages-user/data-state/src/core.ts:94-107,289-359]。

**入口职责（精确事实）：**
- `src/data.ts` 只有一行：`export { createCoreState } from './data/entry';` [VERIFIED: src/data.ts:1]。
- `src/data/entry.ts` 的 `createCoreStateConfig(starter)` 组装 `{ loadStarter, coreURL: CORE_URL, dataPlugins: [new MainDataPlugin(HERO_FACE), ...dataPlugins], events: createEventRegistrations() }`；`createCoreState(starter)` 返回**未异步初始化**的 `CoreState`，需要手动 `state.load()` [VERIFIED: src/data/entry.ts:12-32]。
- `src/data/initialize.ts` 的 `MainDataPlugin` 负责朝向组、寻路谓词/图层/移动器、勇士顶层实现、loader hook、敌人/录像/钩子初始化、5 个 `addSaveableContent`；`afterLoad` 读 `core` 配置并 `hero.createAttribute` / `createLocation` [VERIFIED: src/data/initialize.ts:17-84]。
- `src/bootstrap.ts` 用 `createClientCore(new WebLoadStarter())` 创建渲染端主对象并打开 `LoadSceneUI` [VERIFIED: src/bootstrap.ts:12-16]。
- `ClientCore extends CoreState`，构造时 `super(config)`，再挂渲染层 [VERIFIED: packages-user/client-modules/src/client.ts:48-125]。**本篇只讲数据端 CoreState，不讲 L4/L5 渲染层。**

**游戏内新建数据端实例（精确事实）：** `CoreState` 的构造函数创建所有子系统，不依赖全局单例；`coreNode.test.ts` 创建两个实例并断言 `hero` / `attribute` / `eventStore` 不共享，且第一个实例的存档修改不影响第二个 [VERIFIED: packages-user/data-state/__test__/coreNode.test.ts:16-40]。因此可以在游戏内或 Node 中 `new CoreState(fullConfig)` 建一个独立数据端实例，用于回放/比对，而不必启动 CLI。注意必须传完整 `ICoreStateConfig`（`loadStarter` / `coreURL` / `dataPlugins` / `events`）[VERIFIED: packages-user/data-state/src/types.ts:72-84]；测试里省略 `dataPlugins`/`events` 的写法与构造器实现不一致，见「Source/comment conflicts」。

**Use vs customize：** 使用侧是 `createCoreState` / `state.load()` / `state.hero` 等访问器；自定义侧是新增数据端插件（在 `awake` 里 `addSaveableContent`）、在 `src/data/plugin/list.ts` 注册插件、在 `src/data/entry.ts` 增加事件注册。不要建议读者重排构造顺序或手动 `new` 内部子系统。

### 7. 插件内部机制

**模型：** 插件是 `IDataPluginDefine`：`id` + `dataDeps` + `awake` / `initialize` / `afterLoad`。`CoreState` 构造时把所有插件放进 `dataPlugins: Map<string, IDataPlugin>`，用 `dataDeps` 建依赖图，`orderPlugins()` 返回拓扑序、环集合、缺失依赖表；随后按拓扑序执行 `awake`。`load()` 按同一顺序执行 `initialize` 与 `afterLoad`。每个阶段只处理处于前一状态的插件，状态推进 `NotAwakened → Awakened → Initialized → Loaded`。

**关键接口/类：**

| 名称 | 位置 | 职责 |
|------|------|------|
| `PluginStatus` | `packages-user/data-state/src/types.ts:10-19` | 四个状态 |
| `IDataPluginDefine` | `packages-user/data-state/src/types.ts:39-68` | 三阶段生命周期 |
| `IPluginBase` | `packages-user/data-state/src/types.ts:32-37` | `id` + `dataDeps` |
| `IPluginOrderResult` | `packages-user/data-state/src/plugin.ts:3-10` | `order` / `cyclic` / `missing` |
| `orderPlugins` | `packages-user/data-state/src/plugin.ts:20-105` | 拓扑排序 + 环/缺失检测 |
| `CoreState.awake/initialize/afterLoad` | `packages-user/data-state/src/core.ts:208-262` | 按序执行 |
| `CoreState.getDataPlugin` | `packages-user/data-state/src/core.ts:264-268` | 按 id 取包装对象 |

**精确事实：**
- `PluginStatus` 的值是 `NotAwakened` / `Awakened` / `Initialized` / `Loaded` [VERIFIED: packages-user/data-state/src/types.ts:10-19]。
- `orderPlugins` 先检测缺失依赖（`plugins.has(dependency)` 为 false），再从每个插件沿依赖边搜索回到自身来检测环；被环/缺失阻断的插件及其下游进入 `blocked`；最后反复扫描，输出依赖均已就绪的插件 [VERIFIED: packages-user/data-state/src/plugin.ts:26-104]。
- `awake()`：先对 `cyclic` 告警 76、对 `missing` 逐条告警 77；按 `order` 取插件，检查状态为 `NotAwakened`，取依赖包装对象，`plugin.awake(this, dependencies)`，状态置 `Awakened` [VERIFIED: packages-user/data-state/src/core.ts:208-228]。
- `initialize()`：按 `order`，检查状态为 `Awakened`，`await plugin.initialize(...)`，状态置 `Initialized` [VERIFIED: packages-user/data-state/src/core.ts:233-245]。
- `afterLoad()`：按 `order`，检查状态为 `Initialized`，`await plugin.afterLoad(...)`，状态置 `Loaded` [VERIFIED: packages-user/data-state/src/core.ts:250-262]。
- 依赖在启动前定好，之后不重算；没有运行时追加插件的接口 [CITED: docs/advanced/plugin-system.md:255-257]。
- 重复插件 id 在构造时告警 78 并跳过 [VERIFIED: packages-user/data-state/src/core.ts:140-149]。
- `getDataPlugin` 返回 `Readonly<IDataPlugin<T>> | null` [VERIFIED: packages-user/data-state/src/core.ts:264-268; packages-user/data-state/src/types.ts:106-108]。

**Use vs customize：** 使用侧是声明 `dataDeps`、在三个时机里做事、用 `getDataPlugin` 取回；自定义侧是新增插件类并注册到 `src/data/plugin/list.ts` [VERIFIED: src/data/plugin/list.ts:4]。`orderPlugins` 是内部机制，读者不需要自己调用；本篇只解释「为什么顺序固定、依赖写错会怎样」。

## Old vs New Replay Storage（exact facts）

**旧表示（逐字证据）：**

```js
// public/libs/core.js:185 —— 旧录像就是字符串数组
route: [],

// public/libs/control.js:604 —— 一步转向写成字符串
core.status.route.push('turn:' + direction);

// public/libs/items.js:88 —— 使用道具写成 'item:<id>'
core.status.route.push('item:' + itemId);

// public/libs/utils.js:681 —— 整条 route 压缩成一个 base64 字符串
return LZString.compressToBase64(ans);

// public/libs/utils.js:685-688 —— 物品 id 先映射成地图块号
utils.prototype._encodeRoute_id2number = function (id) {
    var number = core.maps.getNumberById(id);
    return number === 0 ? id : number;
};
```

**新表示（逐字证据）：**

```ts
// packages-user/data-common/src/replay/array.ts:80-84 —— 三块 TypedArray
private commandArray: Uint8Array;
private paramArray: Uint8Array;
private indexArray: Uint32Array;

// packages-user/data-common/src/replay/system.ts:97-104 —— 存档就是四个字段
saveState(): IReplaySystemSave {
    return {
        length: this.array.length,
        commandWidth: this.array.commandWidth,
        commandArray: this.array.getCommandArray(),
        paramArray: this.array.getParamArray()
    };
}
```

| 维度 | 旧实现（`public/libs/*`） | 新实现（`@user/data-common`） | 证据 |
|------|---------------------------|-------------------------------|------|
| 容器 | `core.status.route: string[]`，初始化 `route: []` | `ReplayArray`：`commandBuffer` / `paramBuffer` / `indexBuffer` + `Uint8Array` / `Uint32Array` | [VERIFIED: public/libs/core.js:185; packages-user/data-common/src/replay/array.ts:66-84] |
| 单步表示 | 字符串，如 `'up'` / `'turn:D'` / `'item:123'` / `'move:3:4'` | 2/3 字节指令记录：参数数量 + 指令 id；参数为类型 token + 载荷 | [VERIFIED: public/libs/control.js:525,604; public/libs/items.js:88; packages-user/data-common/src/replay/array.ts:143-149,345-356] |
| 序列化 | `encodeRoute()` 生成文本，`LZString.compressToBase64(ans)`；`compress=false` 时前缀 `'!!'` | `saveState()` 返回 `{ length, commandWidth, commandArray, paramArray }`，直接是 `ArrayBuffer` | [VERIFIED: public/libs/utils.js:645-682; packages-user/data-common/src/replay/system.ts:97-104] |
| 解码 | `decodeRoute()` 先 `LZString.decompressFromBase64`，再逐字符解析 | `createReadStream()` / `get(index)` 按索引与类型表解码 | [VERIFIED: public/libs/utils.js:715-736; packages-user/data-common/src/replay/array.ts:776-822] |
| 移动压缩 | 连续同方向合并成 `U3` / `D2` 等 run-length | 每步一条 `ReplayCode.Up/Right/Down/Left`，不做文本 run-length | [VERIFIED: public/libs/utils.js:650-682; packages-user/data-common/src/replay/types.ts:5-22] |
| 参数类型 | 文本 + `parseInt`；类型信息丢失 | `boolean` / `int8` / `int16` / `int32` / `int64` / `float64` / `bigint` / `string` | [VERIFIED: public/libs/utils.js:738-763; packages-user/data-common/src/replay/array.ts:227-309] |
| 大整数/浮点 | 字符串解析，精度/类型有限 | int64 高低 32 位；float64 原样；bigint 幅值字节（<2^2040） | [VERIFIED: packages-user/data-common/src/replay/array.ts:270-288,383-389,687-712] |
| 随机访问 | 从文本开头逐字符解析 | `indexArray` 存每条指令的参数起点；`get(index)` 直接定位 | [VERIFIED: packages-user/data-common/src/replay/array.ts:70-84,776-785] |
| 编辑 | 数组 `splice` 后整体重新 `encodeRoute` | `insert` / `delete` / `set` 原地移动缓冲区并平移索引 | [VERIFIED: public/libs/control.js:2414; packages-user/data-common/src/replay/array.ts:445-584] |
| 物品 id | `getNumberById` 把 id 映射为地图块号；解码用 `blocksInfo` 反查 | 指令码 + 原始参数，不依赖地图块号 | [VERIFIED: public/libs/utils.js:685-688,765-771; packages-user/data-common/src/replay/types.ts:5-22] |
| 读取失效 | 数组被修改后没有读流概念 | 任何写操作 `expireStreams()`；读流 `expired` | [VERIFIED: packages-user/data-common/src/replay/array.ts:215-220,787-822] |
| 指令宽度 | 单字母/自定义 `(...)` 文本语法 | `Uint8`（0-255）或 `Uint16`（0-65535），可 `setCommandWidth` | [VERIFIED: public/libs/utils.js:690-711; packages-user/data-common/src/replay/types.ts:176-181; packages-user/data-common/src/replay/array.ts:586-628] |
| 兼容性 | 文本语法 + LZString | 类型码只增不改；注释明确不承诺旧格式可读回 | [VERIFIED: packages-user/data-common/src/replay/types.ts:400-402] |
| 禁用 | 旧引擎用播放状态/全局判断 | `disabled` 嵌套计数；`disable` / `revert` / `clearDisableFlag` | [VERIFIED: packages-user/data-common/src/replay/array.ts:887-899] |

**具体优势（写文档时可直接用）：**
1. **紧凑**：每步固定 2/3 字节 + 类型化载荷，不需要 base64 膨胀，也不需要 LZString 解压；旧文本虽然 run-length 压缩移动，但整体仍要压缩/解压。
2. **类型保真**：新格式区分 int8/int16/int32/int64/float64/bigint/string；旧格式所有数字都靠文本解析，浮点与大整数容易失真。
3. **可随机访问**：`indexArray` 让 `get(index)` 直接定位参数区；旧格式必须从头解析。
4. **可编辑**：`insert` / `delete` / `set` 是数组级操作；旧格式改一步要重编码整条 route。
5. **不依赖地图编号**：新录像不把物品 id 转成地图块号；旧格式的 `getNumberById` / `blocksInfo` 映射会随地图内容变化而失效。
6. **读取安全**：新数组写操作会让旧读流 `expired`；旧数组没有这个概念。
7. **格式稳定**：类型码只增不改，指令宽度可配置；旧格式是文本语法 + LZString，扩展靠新增字母/括号语法。

## Page Split（8 pages）

**建议目录：** `docs/advanced/iii/`。目录名与文件名须按 D-13 先经用户批准；下表是建议，不是已批准事实。

| # | 文件 | 标题 | 核心内容 | 不写什么 |
|---|------|------|----------|----------|
| 1 | `index.md` | 高级 III 导览 | 难度定位、前置（高级 I/II + 中级相关篇）、阅读路径、8 页地图、与 I/II 的边界 | 不复述各系统细节；不写「渲染端以后讲」的元叙述 |
| 2 | `loading-system.md` | 加载系统 | LoadTask → LoadManager → MotaDataLoader 模型；三阶段；starter 抽象；配置文件/自定义任务；渲染端接口级小节 | 不写 FSA 实现；不写渲染场景/UI；不写 `getTotalByte` 语义 |
| 3 | `replay-internals.md` | 录像系统底层 | ReplayArray 二进制布局、ReplaySystem、Sandbox、主动/被动、存档形状、旧 vs 新对比 | 不写旧引擎当前 API；不写指令目录；不写 route folding |
| 4 | `event-system.md` | 事件系统 | eventStore / GameEvent / collectEvent / EventExecutor / 触发器 / 事件层 / 自定义内建函数 | 不写序列化注册、地图事件 id 绑定、编辑器识别 |
| 5 | `anon-tokyo.md` | Anon-Tokyo 解释器模型 | LanguageFeature / Interpreter / Executable / Context / Iterator / Statement / Scope / OP | 不写 compile.ts 解析器内部；不写性能 |
| 6 | `passability-and-pathfinding.md` | 通行性谓词与寻路原理 | IPassPredicate 契约、同一语义服务勇士/寻路、构图→搜索→移动器、自定义谓词 | 不写 Dijkstra 细节；不重复 `ii/pathfinding.md` 的使用教程 |
| 7 | `core-state.md` | CoreState 组装与初始化 | 构造顺序 L0–L3、load 管线、存档注册、入口职责、游戏内第二实例 | 不写 L4/L5 渲染层；不写 ClientCore |
| 8 | `plugin-internals.md` | 插件内部机制 | orderPlugins 算法、注册表/状态、依赖失败、固定顺序、getDataPlugin | 不重复 `plugin-system.md` 的插件写法；不写渲染端插件 |

**Merge/split flags：**
- `anon-tokyo` 与 `event-system`：天然相邻，但**不要合并**——解释器是独立子系统，合并会让 event-system 变成「事件 + 语言」两大块；若成稿不足约 150 行，可合并，但需用户批准。
- `plugin-internals` 与 `core-state`：天然相邻，但**不要合并**——core-state 讲装配顺序，plugin-internals 讲拓扑排序与失败模式；合并会超出单页合理长度。若必须压缩，优先保留 core-state，把 plugin-internals 缩成 core-state 的一节。
- `passability-and-pathfinding` 与 `ii/pathfinding.md`：**不要合并**，但必须切分：II 讲「怎么用/怎么换损失函数/瞬移策略」，III 只讲「谓词契约 + 构图→搜索→移动器 + 自定义谓词」。若 III 稿开始重复 II 的 `moveTo`/`teleportTo` 用法，删掉并链接。
- `loading-system` 的渲染端内容：**不要单独成页**；作为 `### 渲染端如何消费加载进度` 小节，控制在 1 屏内。
- `replay-internals` 的旧 vs 新对比：**不要单独成页**；作为该页的一节，表格 + 3-5 条优势即可。

## Documentation facts per page

> 每页先写「系统模型」，再写「关键接口」，最后写「怎么用/怎么自定义」；边界统一放文末「边界与注意」。下列 file:line 均为本会话直接阅读。

### 1. `iii/index.md` — 高级 III 导览

- **定位**：高级 III 是「原理与架构」难度层，只写数据端；不是领域分类 [CITED: 10-CONTEXT.md D-53]。
- **前置**：高级 I（插件系统、可存档、录像一致性、Store、钩子、Mover、FaceHandler）+ 高级 II（范围、图块、装备、录像指令、寻路、属性、战斗上下文）；中级相关篇目按需链接 [CITED: docs/advanced/index.md:17-27; docs/advanced/ii/index.md:31-48]。
- **8 页地图**：本文件 Page Split 表；每页一句话「它能让你做什么」。
- **阅读路径建议**：原理线（core-state → plugin-internals → event-system → anon-tokyo → passability-and-pathfinding → replay-internals → loading-system）；按需线（先读 core-state，再跳目标系统）。
- **当前占位**：`docs/advanced/index.md:27` 仍写「高级 III 暂不提供页面入口」；`docs/advanced/ii/index.md:29` 仍写「高级 III 尚未编写」；`docs/.vitepress/config.ts:234-238` 的「高级 III · 原理与架构」分组 `items: []`。本批必须替换这些占位并注册侧边栏。
- **导航风险**：`config.ts:22` 的 `nav` 仍指向 `/advanced/`（当前是高级 I 导览）。若高级 I 被移动到 `/advanced/i/`，`nav` 与 `advanced/index.md` 的归属要同步调整；如果 `advanced/index.md` 也被移走，必须保留或新建一个 `/advanced/index.md` 作为高级教程总入口，否则 `nav` 的 `/advanced/` 会 dead link。否则 `/advanced/` 会指向旧位置。
- **文末边界**：不承诺渲染端/编辑器内容；不把 III 写成 II 的重复；页面文件名需 D-13 批准。

### 2. `iii/loading-system.md` — 加载系统

- **模型**：`LoadTask`（单资源）→ `LoadManager`（聚合）→ `MotaDataLoader`（阶段编排）；`ILoadTaskStarter` 是环境适配点 [VERIFIED: packages/loader/src/task.ts:24-253; packages/loader/src/manager.ts:10-112; packages-user/data-state/src/loader/loader.ts:18-151]。
- **阶段顺序**：core configs → `onCoreConfigLoaded` → extra configs → `onExtraConfigLoaded` → custom tasks → `loaded()` [VERIFIED: packages-user/data-state/src/loader/loader.ts:84-142]。
- **配置格式**：`PrefixedJSONCProcessor` 用 `'// --- SYSTEM PREFIX END --- //'` 切分，前缀之后才是 JSON；切分失败告警 66，JSON 解析失败告警 67 [VERIFIED: packages-user/data-state/src/loader/jsoncProcessor.ts:4-28]。
- **路径**：DEV 前置 `src/`，构建后不前置 [VERIFIED: packages-user/data-state/src/loader/loader.ts:74-82]。
- **自定义配置**：`addCoreConfig` / `addExtraConfig` / `addCustomTask`；额外配置的 `url` 相对于 `src/content` [VERIFIED: packages-user/data-state/src/loader/types.ts:34-65]。
- **自定义资源**：`new LoadTask({ identifier, url, dataType })` + `setProcessor` + `setStarter` + `addCustomTask`；`LoadDataType` 五值 [VERIFIED: packages/loader/src/task.ts:50-77; packages/loader/src/types.ts:82-88]。
- **进度**：`LoadManager.load()` 是异步迭代器，产出已加载字节；`getLoadedTasks` / `getAddedTasks` / `getTaskRatio` / `getByteRatio` [VERIFIED: packages/loader/src/manager.ts:51-111]。
- **默认配置 hook**：`DefaultDataLoaderHook` 从 `core.content` 添加 enemy/item/map-list/tile + 四个 default [VERIFIED: src/data/loader/hook.ts:7-29]。
- **数据端编排**：`CoreState.load()` 先 `initialize()`，再 `loader.start()`，再 `afterLoad()` [VERIFIED: packages-user/data-state/src/core.ts:274-283]。
- **渲染端小节**：`src/bootstrap.ts:12-16` 创建 ClientCore + LoadSceneUI；`src/client/entry.ts:23-38` 的 `createClientCoreConfig` 直接展开 `createCoreStateConfig(starter)`，所以渲染端复用同一套数据端配置与 loader；`LoadScene` 迭代 `loader.start()` 并用 manager 计数器画进度 [VERIFIED: src/client/ui/load.tsx:52-174]；`RenderLoaderHooks` 添加渲染配置 [VERIFIED: packages-user/client-modules/src/loader/hook.ts:5-25]；`ClientCore` 构造时 `loader.addCoreConfig('client', config.clientURL)` [VERIFIED: packages-user/client-modules/src/client.ts:107]。只写接口消费，不写 UI 生命周期。
- **本地数据包（设计能力）**：`ILoadTaskStarter` 可替换为 File System Access API starter；仓库无实现，不写代码 [VERIFIED: packages-user/data-state/src/types.ts:73-77]。
- **文末边界**：`addCustomTask` 只能在加载前或两个 hook 中调用；配置 id 重复告警 68；`LoadManager` 的 `getTotalByte` 实现疑点只报告不写入文档；`loading/dataLoaded` 守卫未赋值只报告不写入文档；`resolveURL` 依赖 Vite `import.meta.env`，自定义 starter 需自行处理路径。

### 3. `iii/replay-internals.md` — 录像系统底层

- **模型**：`ReplaySystem` = `ReplayArray` + 指令注册表 + 可选 `ReplaySandbox`；录制 `record()` 追加；播放沙箱读流 [VERIFIED: packages-user/data-common/src/replay/system.ts:21-114]。
- **指令码**：`ReplayCode` 值 `Up` / `Right` / `Down` / `Left` / `Teleport` / `UseItem` / `Equip` / `Unequip`；数值属于格式，只增不改 [VERIFIED: packages-user/data-common/src/replay/types.ts:4-22; docs/advanced/ii/custom-replay-command.md:18]。
- **指令对象**：`IReplayCommand.type` 为 `Active` / `Passive`；`execute(step)` 返回 `Success` / `Failed` / `Ignored`；可选 `finalize()` [VERIFIED: packages-user/data-common/src/replay/types.ts:24-38,62-78]。
- **二进制布局**：见 System Models §2 的精确事实；写文档时用「指令区 + 参数区 + 索引区」三块解释，不逐字节展开 [VERIFIED: packages-user/data-common/src/replay/array.ts:66-84,143-149,227-309]。
- **int64 / bigint**：int64 高低 32 位；bigint 幅值小端、长度 1 字节、上限 2^2040 [VERIFIED: packages-user/data-common/src/replay/array.ts:270-288,383-389,687-712]。
- **索引与读流**：`indexArray` + `createReadStream` + `expired`；写操作过期旧流 [VERIFIED: packages-user/data-common/src/replay/array.ts:70-84,215-220,787-822]。
- **编辑**：`insert` / `delete` / `set` 的合法区间与告警 179；O(n) 迁移 [VERIFIED: packages-user/data-common/src/replay/array.ts:445-584; packages-user/data-common/src/replay/types.ts:232-260]。
- **沙箱**：`createReplaySandbox` 先 reset；`getPassive()` 返回 `{ step, next }`；主动/被动交错；`finalize`；`play/pause/resume/stop/step` [VERIFIED: packages-user/data-common/src/replay/system.ts:70-82; packages-user/data-common/src/replay/sandbox.ts:81-110,146-224,263-312]。
- **存档**：`IReplaySystemSave` 四字段；`saveState` 返回内部 buffer 引用；`loadState` 重建索引 [VERIFIED: packages-user/data-common/src/replay/system.ts:97-113; packages-user/data-common/src/replay/types.ts:373-405]。
- **旧 vs 新**：使用本文件「Old vs New Replay Storage」表；旧实现只作为对比，不写当前 API。
- **Use vs customize**：使用 `record` / `registerCommand` / `createReplaySandbox`；自定义指令链接 `../ii/custom-replay-command.md`；数组编辑只作边界说明。
- **文末边界**：参数最多 255 个，超出截断告警 153 [VERIFIED: packages-user/data-common/src/replay/array.ts:316-321]；不支持的参数类型告警 148 并丢弃 [VERIFIED: packages-user/data-common/src/replay/array.ts:308-309]；`get(index)` 注释明确「极为缓慢」[VERIFIED: packages-user/data-common/src/replay/types.ts:262-266]；`setCommandWidth` 缩小到 Uint8 时 >255 的指令告警 154 [VERIFIED: packages-user/data-common/src/replay/array.ts:612-616]；存档不承诺旧格式可读回 [VERIFIED: packages-user/data-common/src/replay/types.ts:400-402]；`saveState` 返回直接引用，不要就地修改 [VERIFIED: packages-user/data-common/src/replay/system.ts:101-102]。

### 4. `iii/event-system.md` — 事件系统

- **模型**：eventStore → GameEvent → GameEventSystem.collectEvent → EventExecutor → AnonTokyoInterpreter；事件层是 `alias === 'event'` 的普通图层 [VERIFIED: packages-user/data-common/src/store/eventStore.ts:5-33; packages-user/data-system/src/event/system.ts:24-112; packages-user/data-base/src/map/mapState.ts:89-91]。
- **store**：`addEvent(id, event)` 重复 id 告警 170 并覆盖；`getEvent(id)` 返回实例本身 [VERIFIED: packages-user/data-common/src/store/eventStore.ts:13-32; docs/advanced/data-stores.md:188-222]。
- **事件对象**：`GameEvent` 持有 `trigger` / `rawEvent` / `compiled`；`compile()` 缓存；`setRaw` 清缓存；`setTrigger` 设置触发器 [VERIFIED: packages-user/data-common/src/event/event.ts:8-54]。
- **收集**：点事件优先于图块事件；各自优先级降序；env 字段完整 [VERIFIED: packages-user/data-system/src/event/system.ts:44-111]。
- **执行**：trigger 不匹配跳过；store/事件缺失告警 171；`CutIfFalsy` / `CutIfTruthy`；`NoReduce` / `OrReduce` / `AndReduce`；非布尔告警 172 [VERIFIED: packages-user/data-system/src/event/executor.ts:53-113]。
- **触发器**：完整枚举见 System Models §3；本仓库只有 OnEnter/OnLeave/OnTouch 有派发点 [VERIFIED: src/data/hero/moverImpl.ts:72-82]。
- **事件层**：`IGameMap.eventLayer` + `layerList`；事件层本质是图层 [VERIFIED: packages-user/data-base/src/map/types.ts:659,669]。
- **自定义内建函数**：类 + `name` + `func`；加入 `createEventRegistrations()`；参数接口在 `src/data/event/types.ts`；注册进 `config.events` [VERIFIED: src/data/event/registrations.ts:9-24; src/data/event/map.ts:9-31; src/data/event/types.ts:1-66; src/data/entry.ts:15-20]。
- **Use vs customize**：使用 `collectEvent` / `executor.execute` / `getEvent`；自定义内建函数；`EventTrigger` 新增值属于引擎级改动，不鼓励。
- **文末边界**：`collectEvent` 坐标越界返回空；点/图块事件互不替代；同一优先级覆盖告警 136（来自 `point-and-tile-events.md`）；事件 id 必须已注册；`@shouldReplay` 在执行器上；异步执行顺序；不要写序列化注册/地图 id 绑定。

### 5. `iii/anon-tokyo.md` — Anon-Tokyo 解释器模型

- **模型**：`LanguageFeature` → `AnonTokyoInterpreter` → `compile` → `AnonTokyoExecutable` → `AnonTokyoExecutionContext` / `AnonTokyoIterator` → `OP` 循环 [VERIFIED: packages/anon-tokyo/src/interpreter.ts:20-219]。
- **内建函数**：`BuiltInFunction { name, save?, func(parameters, env) }`；`GameEventSystem` 用 `config.events` 构造 [VERIFIED: packages/anon-tokyo/src/interpreter.ts:11-18; packages-user/data-system/src/event/system.ts:33-36]。
- **语句模型**：`StatementType` 11 值；`Statement` 联合；`Scope { args, local, env }`；`OPType` 4 值 [VERIFIED: packages/anon-tokyo/src/type.ts:1-17,86-95,197-216]。
- **编译/执行**：`compile` 用 `getBuiltInFunction` 解析调用；`exec` 创建 context；`AnonTokyoIterator` 处理 Move/Call/Return/Exit [VERIFIED: packages/anon-tokyo/src/interpreter.ts:38-67,114-138,197-219]。
- **GameEvent 集成**：`compile()` 缓存 `compiled`；`execute()` 优先 compiled；`setRaw` 清缓存 [VERIFIED: packages-user/data-common/src/event/event.ts:24-49]。
- **Use vs customize**：使用事件对象即可；自定义 `BuiltInFunction` 或 `globalFunctions`（当前数据端传空数组）；不要写 `compile.ts` 解析器细节。
- **文末边界**：`getBuiltInFunction` / `getGlobalFunction` 找不到直接 `throw` 字符串 [VERIFIED: packages/anon-tokyo/src/interpreter.ts:164-178]；`AnonTokyoExecutionContext.dump()` 是空实现，不要写成可用功能 [VERIFIED: packages/anon-tokyo/src/interpreter.ts:108]；`BuiltInFunction.save` 在解释器中未被使用，不要赋予未证实语义 [VERIFIED: packages/anon-tokyo/src/interpreter.ts:11-18,143-219]。

### 6. `iii/passability-and-pathfinding.md` — 通行性谓词与寻路原理

- **模型**：`IPassPredicate` 是唯一语义契约；勇士移动与寻路图构建都调 `canPass` / `shouldHit`；寻路是「构图 → 搜索 → 交给移动器」 [VERIFIED: packages-user/data-base/src/map/types.ts:867-890; packages-user/data-system/src/path/graph.ts:123-126; packages-user/data-system/src/path/finder.ts:199-213]。
- **同一语义、两个实例**：`DefaultHeroMoveTopImpl` 自建谓词；`MainDataPlugin` 为 finder 另建一个；文档要明确「同一契约/默认实现，不是同一对象」 [VERIFIED: src/data/hero/moverImpl.ts:20-27; src/data/initialize.ts:34-36]。
- **默认实现**：事件层 `outPass` / `inPass`；其它图层只检查 `onlyEvents`；`shouldHit` 看 `eventPass` [VERIFIED: src/data/hero/predicate.ts:30-84]。
- **勇士移动**：`CannotMove` / `Hit` / `Step` 三种结果；`cannotEnter` / `hit` / `leave` + `enter` [VERIFIED: packages-user/data-base/src/hero/mover.ts:201-217,256-301]。
- **构图**：BFS 只含从起点可达节点；`shouldHit` 标 terminal；`resolveCost` 对 NaN/负数回退 1，Infinity 合法 [VERIFIED: packages-user/data-system/src/path/graph.ts:57-65,99-150]。
- **搜索**：最小损失；terminal 只能作终点；`TargetUnder` / `InvalidInput` / `NoPath` / `Success` [VERIFIED: packages-user/data-system/src/path/finder.ts:135-213; packages-user/data-system/src/path/types.ts:107-116]。
- **系统层**：`useMover` / `useFallbackPolicy` / `getPath` / `moveTo` / `teleportTo` / `interrupt`；`moveTo` 忙碌返回 null；`teleportTo` 策略 [VERIFIED: packages-user/data-system/src/path/system.ts:46-129]。
- **自定义谓词**：实现 `IPassPredicate`；finder `usePassPredicate`；勇士侧换 `IHeroMoveTopImpl` 或改 `DefaultHeroMoveTopImpl` [VERIFIED: packages-user/data-base/src/map/types.ts:878-890; packages-user/data-system/src/path/types.ts:138-142; packages-user/data-base/src/hero/types.ts:358-368]。
- **Use vs customize**：使用侧默认已装配；自定义损失/瞬移策略链接 `../ii/pathfinding.md`；本篇只讲谓词与构图/搜索模型。
- **文末边界**：图层必须属于同一数据端（告警 182）[VERIFIED: packages-user/data-system/src/path/finder.ts:107-115]；face handler 未注入构图返回 null [VERIFIED: packages-user/data-system/src/path/graph.ts:79-82]；起点越界告警 183 [VERIFIED: packages-user/data-system/src/path/graph.ts:83-86]；`NoPath` 正常；`TargetUnder` 不移动；换楼层重新 `useMapLayer`；瞬移跳过途经格 [CITED: docs/advanced/ii/pathfinding.md:303-319]。

### 7. `iii/core-state.md` — CoreState 组装与初始化

- **模型**：CoreState 是组合根；L0 → L1 → L2 → L3 构造；插件注册/排序/awake；`load()` 三阶段 [VERIFIED: packages-user/data-state/src/core.ts:109-156,274-283]。
- **L0**：`roleFace` / `faceManager` / `tileStore` / `itemStore` / `mapStore` / `eventStore` / `enemyStore` / `replaySystem` [VERIFIED: packages-user/data-state/src/core.ts:111-119]。
- **L1**：`flags` / `maps` / `hero` / `enemyManager` [VERIFIED: packages-user/data-state/src/core.ts:121-125]。
- **L2**：`enemyContext` / `combat` / `eventSystem` / `pathfinding` [VERIFIED: packages-user/data-state/src/core.ts:127-131]。
- **L3**：`loadManager` / `loader` + `addCoreConfig('core', coreURL)` [VERIFIED: packages-user/data-state/src/core.ts:133-137]。
- **入口**：`src/data.ts` 只 re-export `createCoreState`；`src/data/entry.ts` 组装完整 config；`MainDataPlugin` 做主要初始化 [VERIFIED: src/data.ts:1; src/data/entry.ts:12-32; src/data/initialize.ts:17-84]。
- **存档**：5 个 `addSaveableContent` id：`@system/hero` / `@system/flags` / `@system/maps` / `@system/enemy` / `@system/replay` [VERIFIED: src/data/initialize.ts:56-60; docs/advanced/saveable-content.md:226]。
- **loadState**：清 disable flag；每个对象 disable/revert；执行器在包裹外 [VERIFIED: packages-user/data-state/src/core.ts:329-359]。
- **游戏内第二实例**：`new CoreState(fullConfig)` 创建独立数据端；`coreNode.test.ts` 断言不共享 [VERIFIED: packages-user/data-state/__test__/coreNode.test.ts:16-40]；可用于回放/比对，不必启动 CLI。
- **Use vs customize**：使用 `createCoreState` / `state.load()` / 访问器；自定义插件 + `src/data/plugin/list.ts`；不要重排构造顺序。
- **文末边界**：`load()` 必须被迭代；`ICoreStateConfig` 四字段必填；`addSaveableContent` 重复 id 告警 112；`bindSaveableExecuter` 未注册对象告警 113；`loadState` 缺 key 告警 177、多余 key 告警 178；插件状态未到 `Loaded` 告警 81。

### 8. `iii/plugin-internals.md` — 插件内部机制

- **模型**：插件注册表 → `dataDeps` 图 → `orderPlugins` → 状态机 → 三阶段 [VERIFIED: packages-user/data-state/src/plugin.ts:20-105; packages-user/data-state/src/core.ts:139-262]。
- **状态**：`NotAwakened` / `Awakened` / `Initialized` / `Loaded` [VERIFIED: packages-user/data-state/src/types.ts:10-19]。
- **排序**：缺失依赖检测、环检测、blocked 下游、反复扫描拓扑序 [VERIFIED: packages-user/data-state/src/plugin.ts:26-104]。
- **执行**：awake 同步、initialize/afterLoad 异步；每个阶段只处理前一状态的插件 [VERIFIED: packages-user/data-state/src/core.ts:208-262]。
- **失败**：环告警 76、缺失依赖告警 77、重复 id 告警 78、状态不符告警 80、未加载完告警 81 [VERIFIED: packages-user/data-state/src/core.ts:140-149,175-190,208-282]。
- **取回**：`getDataPlugin` 返回 `Readonly<IDataPlugin<T>> | null`；启动阶段优先声明依赖 [VERIFIED: packages-user/data-state/src/core.ts:264-268; docs/advanced/plugin-system.md:313-355]。
- **Use vs customize**：使用 `dataDeps` + 三时机；自定义插件类 + `src/data/plugin/list.ts`；`orderPlugins` 不供读者调用。
- **文末边界**：依赖启动前固定，运行时不重算/不追加；环/缺失会阻断下游；`dataDeps` 与渲染端 `clientDeps` 是两套；`getDataPlugin` 的 `status` 必须检查。

## Use vs Customize（D-77）

| 页面 | 使用（高概率） | 自定义（高概率） | 重心判断 |
|------|----------------|------------------|----------|
| loading-system | `getConfig` / `state.load()` / 进度 | 新增配置、`LoadTask`、自定义 starter | 使用与自定义各半；自定义集中在「加配置/加资源」 |
| replay-internals | `record` / `registerCommand` / 沙箱 | 新增指令（链接 II）；数组编辑很少 | **使用为主**；原理用于理解格式 |
| event-system | `collectEvent` / `executor.execute` / `getEvent` | 新增 `BuiltInFunction` 并注册 | **自定义为主**；事件系统本身就是扩展点 |
| anon-tokyo | 通过事件对象使用 | 新增内建函数 / globalFunctions | **使用为主**；解释器内部几乎不需要改 |
| passability-and-pathfinding | 默认谓词已装配；`getPath` / `moveTo` | 实现 `IPassPredicate`；换 `IHeroMoveTopImpl` | **自定义为主**；默认实现通常不改 |
| core-state | `createCoreState` / `state.load()` / 访问器 | 新增插件、注册存档对象 | **使用为主**；装配顺序不要动 |
| plugin-internals | 声明 `dataDeps` / 三时机 | 新增插件类并注册 | **使用为主**；内部排序只解释不修改 |

## What to avoid documenting

| 页面 | 不要写 |
|------|--------|
| 全部 | 渲染管线/场景/UI 内部架构；编辑器与 `.jsonc` 作者流程；legacy 包与 `public/libs/*` 作为当前 API；序列化事件注册 / 地图事件 id 绑定；把 TODO/占位标记写成正文叙述（D-47 的占位标记本身仍要保留） |
| loading-system | File System Access API 实现代码；`getTotalByte` 的「总字节」语义；`loading`/`dataLoaded` 守卫的「只加载一次」承诺；渲染端 `ClientCore` 生命周期 |
| replay-internals | 旧 `control.js` 的 `route` 字符串 API 作为现用接口；route folding；完整指令目录；`compile.ts` 解析器细节 |
| event-system | 编辑器事件注册/识别；地图事件 id 绑定；完整内建事件目录；事件脚本语法全量 |
| anon-tokyo | `compile.ts` 的解析/优化内部；性能结论；`dump()` 作为可用功能 |
| passability-and-pathfinding | Dijkstra 算法证明/复杂度；渲染端移动动画；`ii/pathfinding.md` 已讲的使用教程 |
| core-state | L4/L5 渲染层；`ClientCore` 构造；渲染端插件 |
| plugin-internals | 渲染端插件内部；插件作者入门（链接 `plugin-system.md`）；`ClientCore.afterLoad` 实现 |

## Boundary/edge cases per page（D-61 文末单节）

- **loading-system**：配置 id 重复（68）；`addCustomTask` 调用时机；JSONC 前缀缺失（66/67）；DEV/构建路径差异；自定义 starter 必须返回 `IResponseLike`；`LoadManager` 的字节进度在总大小未知时可能不准（`ILoadManagerHooks.onProgress` 注释已说明 total 可能不准确）[VERIFIED: packages/loader/src/types.ts:276-279]。
- **replay-internals**：参数 >255 截断（153）；不支持类型丢弃（148）；`get(index)` 慢；insert/delete/set O(n) 且越界告警 179；bigint 上限 2^2040；Uint8 缩窄告警 154；存档 buffer 直接引用；旧格式不保证可读回。
- **event-system**：坐标越界返回空；点/图块事件互不替代；同优先级覆盖（136）；事件 id 必须已注册；trigger 不匹配跳过；`CutIf` 模式短路；`OrReduce`/`AndReduce` 非布尔告警 172；异步执行顺序。
- **anon-tokyo**：缺失内建/全局函数直接 throw；`Statement` 是结构化对象而非字符串；`Scope` 三层；`Exit` 与 `Return` 区别；`dump()` 空实现。
- **passability-and-pathfinding**：同一契约两个实例；图层必须同源（182）；face 未注入构图 null；起点越界（183）；terminal 只作终点；`NoPath` 正常；`TargetUnder` 不移动；换楼层重绑；瞬移跳过途经格。
- **core-state**：`load()` 必须迭代；四字段 config；重复 saveable id（112）；executor 未注册（113）；缺 key（177）/多余 key（178）；插件未 Loaded（81）；`loadState` 期间录像禁用。
- **plugin-internals**：依赖启动前固定；环（76）/缺失（77）/下游阻断；重复 id（78）；状态不符（80）；`dataDeps` 与 `clientDeps` 分离；`getDataPlugin` 判空 + 状态检查。

## Pitfalls

### Pitfall 1: 把「模型」写成「源码导读」
**What goes wrong:** 一上来就列 `file:line` 或解释私有字段，读者不知道系统在做什么。
**Why it happens:** D-80 禁止源码叙述，D-82 要求先讲模型；研究笔记里的 file:line 不能直接搬进正文。
**How to avoid:** 每页先用 2-4 段讲「概念/组成/数据流」，file:line 只留在研究文件里，正文用接口名与行为描述。
**Warning signs:** 正文出现「源码第 X 行」「这个私有字段」。

### Pitfall 2: 重复高级 I/II 已讲内容
**What goes wrong:** `passability-and-pathfinding` 写成 `ii/pathfinding.md` 的翻版；`plugin-internals` 重讲插件写法；`replay-internals` 重讲自定义指令。
**Why it happens:** 主题相邻，且 II 已把「怎么用」讲清。
**How to avoid:** 每页开头写「本篇只讲 X；Y 见某页」，并在成稿后对照 II 的标题删重复。
**Warning signs:** 页面里出现 `moveTo` 的完整用法、`IReplayCommand` 的完整示例、插件三时机的入门解释。

### Pitfall 3: 把旧录像写成当前 API
**What goes wrong:** 读者照着 `core.status.route.push('item:...')` 写代码。
**Why it happens:** 旧引擎代码仍在 `public/libs/*`，容易误读。
**How to avoid:** 旧实现只放在「对比」节，明确标注「旧引擎基线，不是当前接口」；当前接口用 `ReplayArray` / `ReplaySystem`。
**Warning signs:** 正文出现 `core.status.route`、`encodeRoute`、`LZString` 而没有「旧」标注。

### Pitfall 4: 把未实现/编辑器内容写成已实现
**What goes wrong:** 写序列化事件注册、地图事件 id 绑定、编辑器识别规则、渲染端加载 UI 生命周期。
**Why it happens:** 这些是明显的「下一步」，但当前不在数据端实现范围。
**How to avoid:** 按 D-47/D-73 用占位标记；事件页只写 `collectEvent` / `BuiltInFunction`；加载页只写 loader 接口消费。
**Warning signs:** 正文出现「在编辑器里」「地图事件 id 绑定」「ClientCore.afterLoad」。

### Pitfall 5: 代码块不完整 / 无法高亮
**What goes wrong:** 只给一个方法体或一个对象字面量，读者无法放进类里。
**Why it happens:** 研究笔记习惯摘片段。
**How to avoid:** D-62/D-70：给完整类/函数/文件级片段；用注释省略无关成员；示例代码加解释性注释（D-65）。
**Warning signs:** 代码块以 `function` 开头但没有闭合、或只有 `foo() { ... }`。

### Pitfall 6: 链接与导航漏注册
**What goes wrong:** 页面写了但侧边栏没有入口；或 `docs/advanced/index.md` / `ii/index.md` 仍说「高级 III 尚未编写」。
**Why it happens:** `config.ts` 的 sidebar 是手写数组；III 分组当前 `items: []` [VERIFIED: docs/.vitepress/config.ts:234-238]。
**How to avoid:** 计划中必须有 `config.ts` 注册步骤 + 替换两处占位 + 构建 gate。
**Warning signs:** 预览站点「高级 III」分组为空；构建 dead link。

### Pitfall 7: 路径假设错误（I 是否已移动）
**What goes wrong:** III 页链接写成 `../plugin-system.md`，但 I 已被移到 `../i/plugin-system.md`，或反之。
**Why it happens:** 本批与「高级 I 移动到 `docs/advanced/i/`」可能并行。
**How to avoid:** 计划先确认移动是否同批完成；若同批，统一用 `../i/...`；若未移动，统一用 `../...`，并在移动批中一次性替换。不要两种混用。
**Warning signs:** 构建 dead link，或链接指向 `docs/advanced/plugin-system.md` 但文件已在 `docs/advanced/i/`。

## Source/comment conflicts（D-72：只在对话报告，不写进文档）

以下均为本会话阅读时发现的**注释/实现或测试/实现不一致**。按 D-72，文档一律以方法注释为准；这些条目**只向用户报告**，不写入 `docs/` 正文。是否算缺陷由用户确认，本文件不擅自判定。

| # | 位置 | 观察 | 影响 |
|---|------|------|------|
| C1 | `packages/loader/src/manager.ts:88-94` | `getTotalByte()` 的注释是「获取总体需要加载的字节数」，实现却 `return this.loaded;`；`getByteRatio()` 用 `this.total` | 渲染端加载 UI 用 `getTotalByte()` 画总字节，显示可能不对；文档不要写「返回总字节」 |
| C2 | `packages-user/client-modules/src/client.ts:193-206` | `afterLoad()` 对每个 client plugin 调用的是 `plugin.initialize(this, ...)`，不是 `plugin.afterLoad(...)`；状态却置 `Loaded` | 渲染端插件 `afterLoad` 可能永远不执行；渲染端加载/插件生命周期不宜写进文档 |
| C3 | `packages-user/data-state/src/core.ts:130,139-155` vs `packages-user/data-state/__test__/coreNode.test.ts:7-12` | 构造器读 `config.events` 并 `for (const define of config.dataPlugins)`；测试只传 `loadStarter` / `coreURL`，没有 `dataPlugins` / `events` | 该测试写法与构造器契约不一致，可能无法运行；文档必须要求完整 `ICoreStateConfig` |
| C4 | `packages-user/data-state/src/loader/loader.ts:27-29,84-85` | 注释说「当前是否正在加载/已经加载完毕」，但 `loading` / `dataLoaded` 从未赋值；`start()` 的重复进入保护实际无效 | 不要文档化「start 只会执行一次」；如需重复加载，行为未定义 |
| C5 | `packages-user/data-state/src/loader/loader.ts:120-126` | 额外配置的 `task.loaded().then` 里检查 `configMap.has(id)` 并告警 68；Phase 8 记录该码不可达（`extraConfigs` 是 Map 键去重） | 不要文档化「重复 id 会稳定告警 68」 |
| C6 | `packages/anon-tokyo/src/interpreter.ts:11-18` | `BuiltInFunction.save?` 字段存在，但 `interpreter.ts` 中没有读取它 | 不要给 `save` 赋予「自动存档/录像」语义 |
| C7 | `packages/anon-tokyo/src/interpreter.ts:108` | `AnonTokyoExecutionContext.dump()` 是空实现 | 不要写成可用的执行上下文导出功能 |
| C8 | `packages-user/data-system/src/path/system.ts:83-86` | `startMove` 先 `mover.tp(...)`，再触发 `onBeforeTeleportTo`；接口注释写「在瞬移自动寻路前触发」 | 文档按注释写「瞬移前」会与实现时序不一致；建议正文只写「瞬移分支中触发」，并在对话报告待用户裁决 |

> C1/C2 与渲染端相关，C3/C4 与加载/CoreState 相关，C5 与配置重复相关，C6/C7 与解释器相关，C8 与寻路瞬移钩子时序相关。它们都不影响本批「模型 + 接口」的写作，但会影响示例能否照抄，计划应避免把疑点写进正文。

## Build/verification commands（沿用前批 Phase 10 门禁）

- **格式化（D-45）**：`node node_modules/prettier/bin/prettier.cjs --write docs/advanced/iii/*.md`；收尾用 `--check` 确认 unchanged。
- **构建**：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`；期望输出 `build complete` 且无 `dead link`。`docs/.vitepress/apiSidebar.ts` 当前不存在（本会话 `Test-Path` = False），必须先跑 `init.ts`。
- **预览**：`cmd /c "pnpm docs:preview"`（预览 `public/_docs`）。
- **结构自检**：kebab-case 文件名、CRLF、单 H1、文末 `返回[高级 III 导览](./index.md)`、每页至少一个 `../ii/...` 或 `../i/...` 链接（按移动状态）。
- **PowerShell 注意**：本机执行策略禁止 `pnpm.ps1`（本会话实测 `PSSecurityException`）；一律用 `cmd /c "pnpm ..."` 或 `node node_modules/prettier/bin/prettier.cjs`。
- **前批证据**：`10-31-READER-REVIEW.md:76,96-97,128-129`、`10-32-PLAN.md:131-132` 使用同一组 prettier + build + `build complete`/`dead link` 门禁 [CITED: .planning/phases/10-docs-restructure/10-32-PLAN.md:131-132]。

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | VitePress / init.ts | ✓ | v24.21.0 | — |
| pnpm | 依赖与脚本 | ✓（经 `cmd /c`） | 12.5.1 | `node node_modules/...` 直接调用 |
| `tsx` | `init.ts` | ✓ | `^4.21.0` | `node node_modules/tsx/dist/cli.mjs` |
| `vitepress` | 构建 | ✓ | `^1.6.4` | — |
| `docs/.vitepress/apiSidebar.ts` | `config.ts` 静态 import | ✗（本会话实测不存在） | — | 先跑 `tsx docs/.vitepress/init.ts` |

**Missing dependencies with no fallback:** 无。
**Missing dependencies with fallback:** `apiSidebar.ts` → `init.ts` 生成。

## Validation Architecture

> `workflow.nyquist_validation` 未在 `.planning/config.json` 中显式关闭，按启用处理。

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^4.0.18`（仓库既有） |
| Config file | `vite.config.ts` 的 `test` 块（`testTimeout` / `hookTimeout` 30000） |
| Quick run command | `cmd /c "pnpm exec prettier --check docs/advanced/iii/*.md"` |
| Full suite command | `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| D-09 | 构建通过 + 链接有效 | smoke | `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` | ✅（脚本既有） |
| D-45 | markdown 格式化 | format | `cmd /c "node node_modules/prettier/bin/prettier.cjs --check docs/advanced/iii/*.md"` | ✅ |
| D-82 | 每页先模型后接口 | manual | 人工审阅（无自动检查） | ❌ 人工 |
| D-61 | 边界单列文末 | manual | 人工审阅 | ❌ 人工 |
| D-77 | 使用/自定义重心 | manual | 人工审阅 + 读者概率表（D-78） | ❌ 人工 |

### Sampling Rate
- **Per page commit:** prettier `--check` + 该页链接人工点检。
- **Per wave merge:** `tsx docs/.vitepress/init.ts && pnpm docs:build`。
- **Phase gate:** 全量构建 green、dead link = 0、用户人工审阅通过。

### Wave 0 Gaps
- [ ] `docs/.vitepress/apiSidebar.ts` — 构建前由 `init.ts` 生成，不检入。
- [ ] `docs/advanced/iii/` 目录与 8 个文件 — 本批新增；文件名待 D-13 批准。
- [ ] `docs/.vitepress/config.ts` 的 III sidebar 条目 — 本批编辑；当前 `items: []`。
- [ ] `docs/advanced/index.md` / `ii/index.md` 的 III 占位替换 — 本批编辑。
- [ ] 无新增测试文件；文档验收以 build + 人工审阅为准。

## Security Domain

本批只写 markdown，不引入运行时依赖、不处理用户输入、不包含密钥。VitePress 允许原始 HTML/mermaid；文档内容为仓库可信内容，不嵌入外部脚本或不可信 HTML。

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 文档无认证 |
| V3 Session Management | no | 文档无会话 |
| V4 Access Control | no | 文档无权限 |
| V5 Input Validation | yes（弱） | 不嵌入不可信 HTML/脚本；代码示例不执行 |
| V6 Cryptography | no | 不涉及 |

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 文档中嵌入外部脚本/iframe | Tampering | 不写 `<script>` / 外部 iframe；只用 VitePress 容器与 mermaid |
| 示例泄露密钥/路径 | Information Disclosure | 示例只用占位路径与公开接口名 |
| 旧引擎代码被误当当前 API | Tampering | 旧实现只放在对比节并显式标注 |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 高级 I 文档会移动到 `docs/advanced/i/`，因此 III 页用 `../i/...` 链接 | Page Split / Pitfalls | 链接全错，构建 dead link；需按实际移动状态统一替换 |
| A2 | 8 页目录/文件名（`docs/advanced/iii/`、`loading-system.md` 等）会获 D-13 批准 | Page Split | 需重命名并改 sidebar/链接 |
| A3 | 渲染端加载只写接口级小节即可满足读者 | loading-system | 若读者需要渲染端细节，需另派批次；当前渲染端架构不稳定 |
| A4 | 「自定义事件触发器」主要指 `BuiltInFunction`，不是新增 `EventTrigger` 枚举值 | event-system | 若用户指后者，需补「改 `packages-user` + 派发点」的引擎级说明 |
| A5 | 旧录像基线是 `public/libs/control.js` 等旧引擎，而不是某个更早的新引擎版本 | Old vs New | 对比事实可能对不上；需用户确认基线 |
| A6 | `ReplayArray` 当前实现已修复 Phase 6 记录的编解码缺陷（本会话读到的是修复后代码） | replay-internals | 若仍有缺陷，文档示例可能踩坑；需用户确认 |

**If this table is empty:** 不适用；以上 6 条需要用户确认或计划中显式处理。

## Open Questions

1. **目录/文件名是否批准？**
   - What we know: 建议 `docs/advanced/iii/` + 8 个 kebab-case 文件。
   - What's unclear: D-13 要求命名先反馈；用户可能偏好不同文件名（如 `replay-system.md`、`events-internals.md`）。
   - Recommendation: 计划 Task 0 先向用户确认目录/文件名，再写正文。

2. **高级 I 是否同批移动到 `docs/advanced/i/`？**
   - What we know: 当前 I 文档在 `docs/advanced/*.md`，`advanced/index.md` 是 I 导览；`config.ts` 的 nav 指向 `/advanced/`。
   - What's unclear: 移动是否与本批同一 wave 完成。
   - Recommendation: 计划先确认；若同批，统一 `../i/...`；若不同批，III 先用 `../...`，移动批再统一替换。

3. **`anon-tokyo` 是否独立成页？**
   - What we know: 解释器模型足够独立，但篇幅可能偏短。
   - What's unclear: 用户是否希望它并入 `event-system`。
   - Recommendation: 先独立；若成稿 <150 行，合并到 event-system 的「脚本如何执行」一节，并请用户批准。

4. **`plugin-internals` 是否独立成页？**
   - What we know: `orderPlugins` + 失败模式 + 状态机内容足够。
   - What's unclear: 与 `core-state` 的边界是否会让读者觉得重复。
   - Recommendation: 独立；core-state 只讲装配顺序，plugin-internals 只讲排序/失败/状态。

5. **渲染端加载小节写到什么深度？**
   - What we know: `LoadScene` 只用 loader 接口；`ClientCore.afterLoad` 有疑点；`dev.md:136` 说渲染端架构仍要重构。
   - What's unclear: 用户是否希望提 `RenderLoaderHooks`。
   - Recommendation: 只写「渲染端也消费同一个 loader；配置由 `RenderLoaderHooks` 追加」，不写 UI/场景生命周期。

6. **C1–C8 是否要修？**
   - What we know: 都是本会话观察到的注释/实现或测试/实现不一致，按 D-72 只报告。
   - What's unclear: 是否属于用户已知的设计/进行中工作。
   - Recommendation: 本批不修、不写入文档；在计划汇报中列出，等用户裁决。

## Sources

### Primary (HIGH confidence)
- `packages/loader/src/{manager,task,starter,types,stream}.ts` — 加载任务/管理器/starter。
- `packages-user/data-state/src/{core,plugin,types,common,shared}.ts` — CoreState/插件/配置。
- `packages-user/data-state/src/loader/{loader,types,jsoncProcessor}.ts` — MotaDataLoader。
- `packages-user/data-common/src/replay/{array,system,sandbox,types,func}.ts` — 录像底层。
- `packages-user/data-common/src/{event,store}/*` — 事件对象/仓库。
- `packages-user/data-system/src/event/{system,executor,types}.ts` — 事件收集/执行。
- `packages-user/data-system/src/path/{graph,finder,system,types}.ts` — 构图/搜索/系统。
- `packages-user/data-base/src/{map,hero}/*` — IPassPredicate / 勇士移动。
- `packages/anon-tokyo/src/{interpreter,type}.ts` — 解释器模型。
- `src/data/**`、`src/client/{entry,initialize,ui/load}.tsx`、`src/bootstrap.ts`、`src/data.ts` — 游戏入口与初始化。
- `packages-user/client-modules/src/{client,loader/hook}.ts` — 渲染端加载消费。
- `public/libs/{control,core,utils,items,events,actions}.js` — 旧录像基线。
- `docs/.vitepress/config.ts`、`package.json`、`dev.md` — 站点/脚本/项目约束。

### Secondary (MEDIUM confidence)
- `docs/advanced/{index,plugin-system,saveable-content,replay-consistency,data-stores}.md`、`docs/advanced/ii/{index,pathfinding,point-and-tile-events,custom-replay-command}.md` — 现有风格与重叠边界。
- `.planning/phases/10-docs-restructure/{10-CONTEXT.md,10-RESEARCH.md,10-31-READER-REVIEW.md,10-32-PLAN.md}` — 决策与门禁。

### Tertiary (LOW confidence)
- 无（本批未使用 WebSearch；所有结论来自仓库源码/文档）。

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `package.json` / `config.ts` 直接读取。
- Architecture: HIGH — 逐文件阅读核心实现；页面切分为 MEDIUM（依赖用户批准）。
- Pitfalls: HIGH — 基于源码/现有文档的直接对照；C1–C8 为观察，不是缺陷判定。
- Old vs new replay: HIGH — 旧/新源码逐行对照；A6 仍待用户确认。

**Research date:** 2026-10-26
**Valid until:** 2026-11-25（30 天；若引擎继续重构，加载/CoreState 相关事实需重读）

## RESEARCH COMPLETE
