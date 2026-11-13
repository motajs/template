# Phase 9 · 旧引擎 ↔ 新引擎功能对等性审计 · 研究盘点

> 本文件是「旧引擎 vs 新引擎功能对等性审计」的**只读研究/盘点产物**，供后续拆分 6 份审计文档与计划使用。  
> 本文件**不产出最终对等表**，不判定任何单条功能的最终结论，不修改任何代码、计划、`STATE.md`、`ROADMAP.md` 或既有 `PLAN/SUMMARY`。  
> 写作时间：2026-11-03 15:10（本地）。行尾 LF，UTF-8。

## 0. 用户约束（本次审计口径，优先级最高）

以下为用户本次任务的明确决定，后续 6 份文档与计划必须以此为准，不得用 `09-CONTEXT.md` 的旧计划登记覆盖：

- **旧引擎基线 = `D:\github\mota-js` 唯一**；`../mota-js` 视为权威旧引擎。
- **旧引擎排除**：`public/` 与全部教学/说明/markdown；不计 `_docs`、`docs`、`_codelab` 的散文文档。`extensions/`、`libs/`、`project/`、`main.js`、`server.js` 在范围内。
- **新引擎 = 本仓库 `packages/`、`packages-user/`、`src/` 的最新工作树文件（含未提交用户改动）**；排除 `docs/`、`public/`、教学内容。
- **legacy 既不是旧引擎也不是新引擎**：`packages/legacy-common`、`packages/legacy-system`、`packages/legacy-ui`，以及残留的 `@motajs/client` / `@motajs/client-base`（仅向后兼容胶水）。**不得**用它们证明新引擎支持某项功能；只存在于 legacy 的功能按“不支持”处理。
- 最终文档落点 `.planning/phases/09-minimum-browser-runnable/09-PARITY/`；按新引擎层/子系统拆 6 份：**index / 数据与内容 / 玩法系统 / 渲染 / UI 与输入 / 运行时与扩展 + 不确定汇总**。
- 审计对象：旧引擎**存在**而新引擎**缺失（MISSING）/ 仅部分支持（PARTIAL）/ 行为不同（DIFFERENT）/ 不确定（UNCERTAIN）**的功能、行为、内容。**新引擎独有功能不在范围**；**PARTIAL 与 DIFFERENT 在范围内**；**UNCERTAIN 视为不支持**。
- 本次只读；只写本文件；不得运行 git 写命令；不得提交。

**AGENTS.md 相关硬约束（对本审计的计划与执行有效）：**

- 任何计划执行前，第一个 block 点必须先向用户汇报（要做什么、为什么、怎么做、影响范围），等待用户明确回复「可以执行」四个字；未收到前不得执行，也不得派发执行子代理。
- 不得擅自修改已有注释；新增注释遵循 `dev.md`。本审计只写 `.md`，不涉及源码。
- `dev.md` 中“建议/最好”视为必须，“不建议/尽量不”视为禁止。
- 命名（公共/受保护/私有方法、字段）如需新增，必须先报备并获批准；本审计不新增代码命名。
- 禁止调用 `opencode` 命令（不可豁免）。
- 22:00 规则：若本机账户为 `LHY/lhy/13194`，每轮子代理执行完毕检查时间，晚于 22:00 停止执行。

---

## 1. 口径与范围

### 1.1 基线快照（写作时刻）

| 项 | 旧引擎 | 新引擎 |
| --- | --- | --- |
| 根目录 | `D:\github\mota-js` | `D:\github\template` |
| 分支 | `master` | `refine/data-client` |
| HEAD | `3efb548e407ad2b8007b498cb98401e2012a0b55` | `ca62d283a57e1be5c7dc5c1281908662706ca8c1`（`chore: 更新 pnpm-lock`） |
| 工作树 | 干净（0 个 dirty） | **58 个 dirty**（`git status --porcelain` 行数） |
| 说明 | 只读引用 | 按**写作时刻最新工作树**分析，含未提交改动 |

**快照不稳定警告（实测，且非常关键）**：研究期间新仓库 HEAD 连续变化：`6cc27b6`（dirty 57）→ `ad37186`（dirty 63，删除 legacy-system）→ `ca62d28`（dirty 58，删除 `@motajs/types`、`@motajs/client`、`@motajs/client-base`）。会话开始时可见的 `packages/legacy-*` 与 `packages/types`/`client`/`client-base` 在写作时已从 HEAD 与工作树删除；`packages/` 当前只剩 `animate`、`anon-tokyo`、`audio`、`common`、`loader`、`render`、`render-vue`、`system`。  
**因此：本文件是“某一时刻”的盘点；每份审计文档与每个计划执行前必须重新记录 HEAD、dirty 数与时间戳，并以当时最新工作树为准。** 尤其注意：`packages-user/entry-data/src/mota.ts` 仍 `import type * as Client from '@motajs/client'` 等，`packages-user/client-base/src/map/renderer.ts:40` 仍 `import { compileProgramWith } from '@motajs/client-base'`；这些包已删除，属于“工作树正在重构”的瞬时状态，不能据此判定功能存在或缺失。

### 1.2 旧引擎范围

**在范围：**

- `libs/*.js`：`actions.js`、`control.js`、`core.js`、`data.js`、`enemys.js`、`events.js`、`extensions.js`、`icons.js`、`items.js`、`loader.js`、`maps.js`、`ui.js`、`utils.js`
- `main.js`、`server.js`（`server.py` 为同一服务的 Python 实现，可作补充）、`runtime.d.ts`
- `extensions/*.js`：`localSave.js`、`dynamicMapEditor.js`、`ui-editor.js`
- `project/*.js`：`data.js`、`enemys.js`、`events.js`、`functions.js`、`icons.js`、`items.js`、`maps.js`、`plugins.js`
- `project/floors/*.js` 与目录型素材：`animates/`、`autotiles/`、`bgms/`、`fonts/`、`images/`、`materials/`、`sounds/`、`tilesets/`

**排除：** `public/`、`docs/`、`_docs/`、`_codelab/`、README/教学 markdown、`editor.html`/`editor-mobile.html`（编辑器外壳，不属于游戏运行时能力；若后续需要可单独补）。`_server/` 仅在 `extensions.js` 通过 `_server/fs.js` 引用时作为运行时依赖提及，不展开其实现。

### 1.3 新引擎范围

**在范围：**

- `packages/`：`animate`、`anon-tokyo`、`audio`、`common`、`loader`、`render`、`render-vue`、`system`、`types`
- `packages-user/`：`data-common`、`data-base`、`data-system`、`data-state`、`client-base`、`client-modules`、`client-system`、`entry-client`、`entry-data`
- `src/`：`client/`（含 `ui/`、`plugin/shop/`、`misc/hotkey.ts`）、`content/`（jsonc 与素材）、`data/`（enemy/event/hero/hook/loader/plugin/replay）、`types/`、`bootstrap.ts`、`data.ts`

**排除：** `docs/`、`public/`、教学内容；`node_modules`、`dist` 等生成物（检索时排除）。

**范围外但需注意：** `src/types/declaration/*.d.ts` 是**旧引擎全局 `core` 的类型镜像**，只用于类型检查，不是新引擎运行时实现；不得作为“已支持”证据（详见 §1.6）。

### 1.4 legacy 处理

| legacy 项 | 当前状态 | 审计处理 |
| --- | --- | --- |
| `packages/legacy-common` / `legacy-system` / `legacy-ui` | 写作时已从 HEAD 与工作树删除 | 不作为任何证据；若代码仍 import，则相关功能视为“依赖 legacy” |
| `@motajs/client` / `@motajs/client-base` | 写作时（`ca62d28`）已从 HEAD 与工作树删除；早期快照中曾是重导出胶水 | 不作为功能支持证据；若代码仍 import，按“工作树瞬时重构状态”记录，不判定功能 |
| `@motajs/types` | 写作时（`e4dc28e`）已删除 | 不作为证据；原 `packages/types` 条目从模块地图中移除 |
| 全局 `core`（`src/types/declaration/core.d.ts:1302` `declare const core: CoreMixin;`） | 只有类型声明；当前 HEAD 未发现运行时创建者 | 所有 `core.*` 调用按 legacy 处理；功能是否支持取决于新包内是否有对应实现 |
| `src/types/declaration/**` | 旧 API 类型镜像 | 只用于查“旧引擎曾有该 API”，不作为新引擎实现 |

> **判定提示**：新 UI 文件（`src/client/ui/*`）大量调用 `core.*`（如 `statusBar.tsx:227` `core.flags.statusBarItems`、`statusBar.tsx:183` `core.getLvName`、`viewmap.tsx:119-122` `core.hasItem('fly')` / `core.flyTo(id)`）。这些调用点说明的是“UI 依赖旧全局 core”，**不是**新引擎实现了对应能力。审计必须以新包内的实现为支持证据。

### 1.5 判定口径（最终 6 份文档统一使用）

| 判定 | 定义 | 是否计入“缺失/差异” |
| --- | --- | --- |
| `MISSING` | 旧引擎存在该功能/行为/内容，新引擎**完全未实现** | 计入 |
| `PARTIAL` | 新引擎实现了其中一部分子行为/子字段/子状态，但旧引擎完整语义未覆盖 | 计入 |
| `DIFFERENT` | 新旧都实现，但语义、参数、顺序、数值、默认值、触发时机、存档结构等不同 | 计入 |
| `UNCERTAIN` | 在新引擎范围内无法证明“有”，也无法证明“无”（缺枚举源、动态/eval、扩展点、文档缺口） | **计入，按不支持处理** |
| `SUPPORTED` | 新引擎包内有明确实现且语义对齐 | 不计入 |
| `NEW-ONLY` | 仅新引擎有、旧引擎无 | 不计入；只可放附录，不得写成差异条目 |

**规则：**

1. `UNCERTAIN` 必须写明“已检索了哪些路径/模式、为什么仍不能确定”，不得用“大概没有”代替。
2. `PARTIAL` 必须列出已支持的子项与未覆盖的子项。
3. `DIFFERENT` 必须写出旧行为与新行为各一句，并尽量给出旧/新代码锚点。
4. 判定粒度 = **功能/行为/内容条目**，不是文件或方法；一个方法可拆成多条（如 `useItem` 的消耗、效果、事件、提示）。
5. 旧引擎内容层的 `project/functions.js` 覆盖了 `libs/*` 的默认实现；审计**有效行为**时以 `libs + project 覆盖` 为准，同时记录“引擎默认”与“样板有效行为”两者（若不同）。

### 1.6 “新引擎支持”的定义

只有同时满足以下条件才可标 `SUPPORTED`：

1. 实现位于 `packages/**`（非 legacy）或 `packages-user/**`（非 legacy）或 `src/**`（非 `src/types/declaration`）；
2. 是运行时实现（类/函数/枚举/注册表/插件/钩子），不是仅类型声明、不是仅注释、不是仅内容数据；
3. 该实现能覆盖旧行为的**完整语义**（或已明确列出 PARTIAL 的缺口）；
4. 不依赖全局 `core.*` 完成核心动作（UI 仅调用 `core` 取展示值也算依赖；核心计算/状态变更在新包内才可算支持）。

### 1.7 证据等级

| 等级 | 含义 | 用法 |
| --- | --- | --- |
| E1 | 本次会话直接 `Read` 源码并引用行号 | 默认等级 |
| E2 | 由枚举源/注册表/表文件穷举得出（计数或列表） | 需给出枚举锚点 |
| E3 | 由命名/注释/调用点推断，未找到定义 | 只能支撑 `UNCERTAIN`，不得支撑 `SUPPORTED` |

> 本文件中的 `[VERIFIED: path:line]` 表示本次会话直接读取；`[CITED: file]` 表示引用旧仓库类型声明/文档；`[ASSUMED]` 表示推断。所有“未检索到”都会写明检索范围。

---

## 2. 两引擎模块地图

### 2.1 旧引擎文件 → 职责

| 文件 | 职责 | 关键导出/符号 | 枚举价值 |
| --- | --- | --- | --- |
| `main.js`（995 行） | 启动、DOM 绑定、脚本加载、`loadList`、状态栏 DOM、输入监听、启动动画 | `main.loadList`（`main.js:85-99`）、`main.pureData`（100-109）、`main.materials`（110-119）、`main.statusBar`（121-...） | 模块加载顺序、素材类别、状态栏图标 |
| `server.js` / `server.py` | 本地静态服务、文件读写、热重载、录像上传/校验/排行、存档同步 | `getAll`、`readDir`、`writeFile`、`replay*`、`reload`、`watch` | 服务端能力清单 |
| `runtime.d.ts`（2529 行） | 旧引擎公共 API 类型声明 | `declare class control/events/actions/enemys/maps/loader/items/ui/utils/icons/plugin`、`Sprite`、`main/core/flags/hero` | **旧 API 防漏总表** |
| `libs/core.js`（547） | 全局 `core` 构造、模块转发、插件初始化、flags/values 初始化、自动事件、图片裁剪 | `core.prototype.init/_init_flags/_init_platform/_init_plugins/_forwardFunc` | 全局对象结构、模块转发规则 |
| `libs/control.js`（3565） | 主循环、输入→移动、视口、渲染调度、录像、存读档、状态/flag/buff、天气、音频、缩放、状态栏 | 218 个 prototype 方法（124 个公开）；`registerReplayAction`（1610）、`registerWeather`（2688） | 回放命令、天气、存读档、状态栏、音频 |
| `libs/actions.js`（3165） | 交互事件注册/派发、键鼠触摸、各界面交互 | 136 个方法（15 公开）；`registerAction`（69）、`_init` 注册表（17-58） | 输入动作类型、按键映射、点击/长按/滚轮 |
| `libs/events.js`（3788） | 游戏流程、系统触发器、事件执行器、**129 个事件语句**、预编译、值系统、UI 辅助 | 296 个方法（84 公开）；`registerEvent`（935）、`registerSystemEvent`（295）、`_action_*`、`_precompile_*`、`_sys_*` | 事件语句、触发器、值表达式 |
| `libs/maps.js`（2818） | 地图初始化、图层、压缩/存读、绘制、autotile、动画、图块操作 | 159 个方法（81 公开）；`_initFloors`、`extractBlocks`、`saveMap/loadMap`、`drawMap/drawAutotile` | 地图层、图块字段、绘制能力 |
| `libs/enemys.js`（464） | 怪物特殊属性文本/颜色/flag、怪物信息、伤害、临界 | 29 个方法（17 公开）；`hasSpecial`（56）、`getSpecials`（78）、`getEnemyInfo`（383）、`nextCriticals`（222） | 特殊属性、临界算法 |
| `libs/items.js`（387） | 道具效果、使用、装备、比较、快捷套装 | 27 个方法（21 公开）；`getItemEffect`、`useItem`、`loadEquip/unloadEquip`、`quickSaveEquip` | 道具类别、装备槽、套装 |
| `libs/ui.js`（3208） | Canvas UI 绘制、文本系统、全部面板 | 187 个方法（61 公开）；`drawBook/drawBookDetail/drawFly/drawViewMaps/drawToolbox/drawEquipbox/drawStatusBar` | UI 面板与绘制原语 |
| `libs/loader.js`（461） | 图片/素材/动画/音乐加载 | 31 个方法（7 公开）；`_loadMaterials_*`、`_loadAnimates_*`、`loadBgm` | 资源类别与加载阶段 |
| `libs/utils.js`（1226） | 表达式替换、路线编解码、存储、克隆、缓动、HTTP、随机 | 72 个方法（59 公开）；`replaceValue`、`encodeRoute/decodeRoute`（524/603）、`rand`（860） | **回放编码字母表**、存储、随机 |
| `libs/icons.js`（78） | 图标注册表、动画帧数、tileset 偏移 | `getIcons`、`getClsFromId`、`_getAnimateFrames`、`getTilesetOffset` | 图标类别 |
| `libs/extensions.js`（51） | 动态加载 `extensions/*.js` | `_load`、`_loadJs`、`_listExtensions` | 扩展机制 |
| `extensions/localSave.js` | 用 `fs` 把存档写入 `_saves/` | 覆写 `core.utils._setLocalForage_set` 等 | 存储后端差异 |
| `extensions/dynamicMapEditor.js` | 动态地图编辑 | 编辑器扩展 | 非运行时核心，记录即可 |
| `project/data.js` | 关卡/全局配置 | `main`、`firstData`、`values`、`flags` | **配置字段总表** |
| `project/enemys.js` | 怪物表（81 条） | `enemys_*` 对象 | 模板字段与特殊值 |
| `project/events.js` | 公共事件表 | `commonEvent` | 事件数据格式 |
| `project/functions.js` | **样板覆盖层**：事件/怪物/输入/控制/UI 的 29 个覆写函数 | `events`(11)、`enemys`(3)、`actions`(2)、`control`(9)、`ui`(4) | **有效行为**、伤害/临界/特殊属性真实公式 |
| `project/icons.js` | 图标表 | 9 个类别：`hero/terrains/animates/npcs/npc48/enemys/enemy48/items/autotile` | 图标 ID 与帧数 |
| `project/items.js` | 道具表（63 条） | `items_*` | 道具字段与效果字符串 |
| `project/maps.js` | 图块定义表（224 条） | `blocksInfo` | **图块 cls/字段总表** |
| `project/plugins.js` | 13 个样板插件 | `init/drawLight/shop/removeMap/fiveLayers/itemShop/enemyLevel/multiHeros/heroFourFrames/routeFixing/numpad/sprites/hotReload` | **插件能力清单** |
| `project/floors/*.js` | 4 个楼层（`MT0/sample0/1/2`） | 楼层对象 | **楼层字段总表** |
| `project/materials/images/animates/autotiles/tilesets/sounds/bgms/fonts` | 素材 | 文件 | 素材类别与命名 |

**旧引擎公共方法量级**（`X.prototype.<publicName> = function` 计数，不含 `_` 私有）：

| 模块 | 全部 | 公开 | 说明 |
| --- | ---: | ---: | --- |
| `control` | 218 | 124 | 运行时核心 |
| `ui` | 187 | 61 | 绘制 + 面板 |
| `maps` | 159 | 81 | 地图 |
| `actions` | 136 | 15 | 输入 |
| `events` | 296 | 84 | 流程 + 129 事件语句（`_action_*`） |
| `items` | 27 | 21 | 道具 |
| `enemys` | 29 | 17 | 怪物 |
| `loader` | 31 | 7 | 资源 |
| `utils` | 72 | 59 | 工具 |
| `icons` | 6 | 4 | 图标 |
| **合计** | **1161** | **473** | 另有 129 事件语句、15 回放动作、27 特殊属性、29 面板 ID |

### 2.2 新引擎包/目录 → 职责

| 包/目录 | 层 | 职责 | 关键符号/文件 |
| --- | --- | --- | --- |
| `packages/types` | 基础 | 通用类型（**写作时已删除**） | 原 `enemy.ts`、`utils.ts` |
| `packages/common` | 基础 | 钩子、日志、范围、工具 | `Hookable`、`logger`（`logger.json` 308 行）、`RectRange/ManhattanRange/RayRange/FullRange/IRange` |
| `packages/system` | 系统 | 热键系统 + UI 控制器 | `HotkeyCommand/HotkeySystem`、`HotkeyEmitMode`、`UIController/UIInstance` |
| `packages/render` | 渲染底层 | WebGL2 渲染器、图形、纹理、着色器、字体 | `MotaRenderer`、`Graphics`、`ShaderProgram`、`Font`、`Transform` |
| `packages/render-vue` | 渲染桥 | Vue 组件/标签/Props | `createRendererFor`、`tagManager`、`RendererUsing` |
| `packages/animate` | 动画 | 激励源、过渡、曲线 | `RafExcitation`、`ExcitationDivider`、`ExcitationCurve2D` |
| `packages/audio` | 音频 | BGM/音效/路由/效果/解码 | `IBGMPlayer`、`ISoundPlayer`、`IAudioRoute`、`Volume/Echo/Delay/Stereo` |
| `packages/loader` | 加载 | 加载任务、流、启动器 | `ILoadManager`、`ILoadTaskStarter`、`LoadDataType` |
| `packages/anon-tokyo` | 事件语言 | 事件脚本 AST/编译/解释 | `StatementType`、`Statement`、`BuiltInFunction`、`AnonTokyoInterpreter` |
| `packages-user/data-common` | L0 | 公共接口、store 类型、事件类型、回放、存档契约、移动器 | `TileType`、`ItemCategory`、`ITileRawData`、`IItemRawData`、`IMapRawData`、`IEnemyRawData`、`EventTrigger`、`ReplayCode`、`ReplaySystem`、`ObjectMover` |
| `packages-user/data-base` | L1 | 可存档数据：地图/怪物/勇士/flag | `GameMap`、`MapLayer`、`StaticTile`、`DynamicTile`、`EnemyManager`、`HeroAttribute/Items/Equipment/Followers`、`FlagSystem` |
| `packages-user/data-system` | L2 | 系统：战斗、事件执行、寻路 | `DamageSystem/DamageContext`、`IDamageCalculator`、`CombatFlow`、`EventExecutor`、`PathfindingSystem` |
| `packages-user/data-state` | L3 | 数据端主对象、插件、加载、配置 | `CoreState`、`IDataPluginDefine`、`CoreState.load`、`ICoreStateCoreConfig`、`ICoreStateFlagConfig` |
| `packages-user/client-base` | L4 | 渲染系统层：地图渲染、素材、存档、设置、热键、组件 | `IMapRenderer`、`ITextureManager`、`MapExtensionManager`、`ISaveSystem`、`ISettingSystem`、`FloorSelector/List/Scroll/Textbox/Tip` |
| `packages-user/client-modules` | L5 | 客户端实现层：ClientCore、渲染/UI 胶水、天气、特效 | `ClientCore`、`IClientBase`、`UIController` 装配、`IWeather`、`EffectBase` |
| `packages-user/entry-data` / `entry-client` | 入口 | 全局 `Mota` 接口注册 | `Mota.require/register/r/rf` |
| `src/data` | 游戏数据实现 | 怪物特殊属性/计算/光环/最终效果/地图伤害/钩子、事件内建、回放命令、商店插件、初始化 | `createSpecials`、`MainDamageCalculator`、`CommonAura/GuardAura/SpecialAura`、`MainEnemyFinalEffect`、`createEventRegistrations`、`initializeReplay`、`DataShopPlugin` |
| `src/content` | 内容 | 配置、地图、怪物、道具、贴图/动画/音频/字体列表 | `core.jsonc`、`client.jsonc`、`tile.jsonc`、`enemy.jsonc`、`item.jsonc`、`maps/*.jsonc`、`*/.list.jsonc`、`defaults/*.jsonc` |
| `src/client` | 渲染入口 | 启动、常量、UI 屏幕、热键、商店 UI 插件 | `bootstrap.ts`、`createClientCore`、`ui/*.tsx`（20 个文件）、`misc/hotkey.ts`、`plugin/shop/*` |
| `src/types` | 类型 | 旧全局 `core` 声明镜像 | `declaration/core.d.ts` 等，**非运行时** |

### 2.3 legacy 排除项（完整）

| 路径 | 内容 | 处理 |
| --- | --- | --- |
| `packages/legacy-common` | 写作时已删除 | 不引用、不作为证据 |
| `packages/legacy-system` | 写作时已删除 | 不引用、不作为证据 |
| `packages/legacy-ui` | 写作时已删除 | 不引用、不作为证据 |
| `packages/client` | 写作时已删除（曾为 `export * from '@motajs/client-base'`） | 仅胶水；已删除，不作证据 |
| `packages/client-base` | 写作时已删除（曾为 `glUtils` + `ResponseBase/SyncSaveFromServerResponse` 类型） | 仅胶水/类型；已删除，不作证据 |
| `packages/types` | 写作时已删除（曾为通用类型） | 不作证据 |
| `src/types/declaration/**` | 旧 `core` API 类型镜像 | 仅查旧 API，不作为新实现 |

### 2.4 结构性差异（仅记录，不在本文件判定）

| 维度 | 旧引擎 | 新引擎 | 审计影响 |
| --- | --- | --- | --- |
| 架构 | 单例 `core` + 模块 prototype + `_forwardFunc` 把模块方法转发到 `core`（`core.js:508-534`） | 分层 L0-L5 + 依赖注入 + 插件/钩子 | 不能按“方法名”直接对等，要按能力 |
| 事件 | JSON `{type: "..."}` + 129 个 `_action_*` 分发（`events.js:945-959`） | anon-tokyo 语句 AST + 7 个内建函数（`src/data/event/registrations.ts:9-23`） | 事件是最大的语义差异区 |
| 内容覆盖 | `project/functions.js` 覆盖 `libs` 方法（29 个覆写） | 插件/钩子/`src/data` 实现 | 旧“引擎默认”≠“样板有效行为” |
| 脚本 | `eval(itemEffect)`、块 `script`、事件 `function` | 无 `eval`，`useEffect` 回调 + anon-tokyo | 任意 JS 能力是**能力级**差异 |
| 存档 | `core.saves` + localForage/IndexedDB + 服务端同步 + 录像折叠 | Dexie + `ISaveableContent` + 压缩级别 + undo/redo | 结构不可直接对等 |
| 渲染 | Canvas2D 多画布 + 绘制函数 | WebGL2 单渲染器 + 图层/实例化/着色器 | 按“视觉/行为能力”对等 |
| 输入 | `registerAction` 字符串动作 + DOM 事件 | 强类型热键命令 + UI 事件 | 需按“用户可感知操作”对等 |
| 扩展 | 动态加载 `extensions/*.js` + `project/plugins.js` | TS 插件（数据/客户端四段式）+ 钩子 | 扩展 API 能力对等，不逐插件对等 |

---

## 3. 功能面清单与枚举源（10 领域）

> 本节只回答“**枚举源在哪、能否穷举、新引擎对应区域在哪**”，不写最终条目。

### 3.1 录像 / 回放

**旧引擎枚举源（可穷举）：**

- 回放动作注册表：`libs/control.js:38-52`，共 15 个：
  `"move", "item", "equip", "unEquip", "saveEquip", "loadEquip", "fly", "shop", "turn", "getNext", "moveDirectly", "key", "click", "ignoreInput", "no"`。
- 每个动作的参数语义：`_replayAction_*`（`control.js:1720-1945`）。例如：
  - `item:` → 物品 id（`1727-1729`）
  - `equip:` → 装备 id（`1755-1756`）
  - `unEquip:` → 装备槽索引（`1790-1791`）
  - `saveEquip:` / `loadEquip:` → 套装索引（`1821-1829`）
  - `fly:` → 楼层 id（`1835-1836`）
  - `shop:` → 商店 id（`1853-1854`）
  - `turn` / `turn:<dir>`（`1864-1867`）
  - `move:x:y`（`1879-1891`）、`key:<code>`（`1912-1914`）、`click:x:y`（`1919-1921`）、`input:`/`input2:`/`choices:`/`random:`（`1928-1935`）
- 路线编码字母表：`libs/utils.js:524-600`（`encodeRoute` / `_encodeRoute_encodeOne`）与 `603-740`（`decodeRoute` / `_decodeRoute_decodeOne`）。字母：
  `U/D/L/R` 移动；`I` item；`u` unEquip；`e` equip；`s` saveEquip；`l` loadEquip；`F` fly；`c` choices:none；`C` choices；`S` shop；`T` turn；`t` turn:dir；`G` getNext；`p` input:none；`P` input；`Q` input2；`N` no；`M` move；`K` key；`k` click；`X` random；`(...)` 自定义原样；最后 LZString 压缩为 Base64。
- 随机：`utils.js:860-909` 的 `rand/rand2/__init_seed/__next_rand` 与 `random:` 录像（`878-893`）。

**新引擎对应区域：**

- 指令码枚举：`packages-user/data-common/src/replay/types.ts:5-22`，共 8 个：
  `Up, Right, Down, Left, Teleport, UseItem, Equip, Unequip`（注释原文：`/** 向上移动一步 */` 等）。
- 命令实现：`src/data/replay/commands.ts`：`ReplayMove`（79）、`ReplayTeleport`（120）、`ReplayUseItem`（148）、`ReplayEquip`（171）、`ReplayUnequip`（204）。
- 注册：`src/data/replay/initialize.ts:20-43`；参数类型表在 `commands.ts` 的 `paramTypes`（如 `['number','number','boolean']`）。
- 回放数组/沙箱：`packages-user/data-common/src/replay/{system,array,sandbox}.ts`；参数类型码表 `types.ts:285-302`（0 boolean … 9 string、32-255 短字符串）。
- 录像系统钩子：`types.ts:80-112`（onStep/onSpeedSet/onStartReplay/onStopReplay/onPauseReplay/onResumeReplay）。

**可穷举性：** 旧 = **穷举**（注册表 + 字母表 + `_replayAction_*`）；新 = **穷举**（枚举 + 注册调用）。  
**主要缺口候选：** 旧 15 动作 vs 新 8 指令；旧 string 路线 + 压缩 vs 新二进制数组；旧 `saveEquip/loadEquip/fly/shop/turn/getNext/key/click/ignoreInput/no/choices/input/random` 在新枚举中无对应；旧随机种子在新引擎未发现。

### 3.2 怪物模板字段与特殊属性

**旧引擎枚举源：**

- 模板数据：`project/enemys.js`（81 条），字段示例：`name/hp/atk/def/money/exp/point/special/value/n/range/zoneSquare/atkValue/defValue/vampire/add/breakArmor/counterAttack/purify/damage/laser/repulse/hpBuff/atkBuff/defBuff/haloRange/haloSquare/haloAdd/bigImage/faceIds`（字段由 `project/functions.js` 与 `libs/enemys.js` 的使用点反推，**半穷举**）。
- 特殊属性表：`project/functions.js:493-521` 的 `getSpecials()`，共 27 项（旧编号 1..27）：
  `1 先攻, 2 魔攻, 3 坚固, 4 2连击, 5 3连击, 6 n连击, 7 破甲, 8 反击, 9 净化, 10 模仿, 11 吸血, 12 中毒, 13 衰弱, 14 诅咒, 15 领域, 16 夹击, 17 仇恨, 18 阻击, 19 自爆, 20 无敌, 21 退化, 22 固伤, 23 重生, 24 激光, 25 光环, 26 支援, 27 捕捉`。
- 特殊属性运行时语义：`libs/enemys.js:56-165`（hasSpecial/getSpecials/getSpecialText/getSpecialColor/getSpecialFlag/getSpecialHint）。
- 怪物信息/伤害：`project/functions.js:523-645`（getEnemyInfo：模仿 10、坚固 3、光环 25、支援 26）、`646-803`（getDamageInfo）。
- 图块上的怪物字段：`project/maps.js`（`cls: "enemys"` / `"enemy48"`）与 `libs/maps.js:223-253`（`faceIds`、`trigger='battle'`、`height`）。

**新引擎对应区域：**

- 模板字段：`packages-user/data-common/src/types.ts:13-30` 的 `IEnemyAttr`（`name/hp/atk/def/money/exp/point/guard`）；`packages-user/data-common/src/store/types.ts:324-331` 的 `IEnemyRawData`（`num/attribute/special`）；默认模板 `src/content/defaults/enemy.jsonc`。
- 特殊属性注册：`src/data/enemy/special.ts:84-476`，`map.set(0..26, ...)`，共 **27 项（新编号 0..26）**：
  `0 空, 1 先攻, 2 魔攻, 3 坚固, 4 n连击, 5 破甲, 6 反击, 7 净化, 8 模仿, 9 吸血, 10 中毒, 11 衰弱, 12 诅咒, 13 领域, 14 夹击, 15 仇恨, 16 阻击, 17 自爆, 18 无敌, 19 退化, 20 固伤, 21 重生, 22 激光, 23 光环, 24 支援, 25 捕捉, 26 特殊光环`。
- 特殊属性实现：`src/data/enemy/calculator.ts`（调参类）、`final.ts`（坚固/模仿）、`aura.ts`（23/24/26）、`mapDamage.ts`（13/14/16/22/25）、`hook.ts`（中毒/衰弱/诅咒/仇恨/退化/重生）、`src/data/enemy/script.ts`、`comparer.ts`。
- 怪物管理器：`packages-user/data-base/src/enemy/{enemy,manager}.ts`；`ISpecial` 接口 `data-base/src/enemy/types.ts:31-75`。

**可穷举性：** 旧特殊属性 = **穷举**（表 1..27）；旧模板字段 = **半穷举/启发式**（无 schema，靠字段使用点）；新 = **穷举**（`map.set` 0..26 + `IEnemyAttr` + 默认模板）。  
**已知陷阱：** 旧编号与新编号**不等价**（旧 4/5/6 = 2/3/n 连击；新 4 = n 连击；旧 7 破甲 → 新 5；旧 25 光环 → 新 23；旧 26 支援 → 新 24；旧 27 捕捉 → 新 25；新 26 特殊光环为旧引擎没有的扩展）。审计必须按“语义”而非“编号”对齐，且把编号差异记为 DIFFERENT/迁移风险。

### 3.3 事件系统

**旧引擎枚举源：**

- 事件语句：`libs/events.js` 的 `events.prototype._action_*`，共 **129** 个（`^events.prototype._action_` 实测计数）。完整名单：
  `text, moveTextBox, clearTextBox, autoText, scrollText, comment, _label, setText, tip, show, hide, setBlock, setBlockOpacity, setBlockFilter, turnBlock, showFloorImg, hideFloorImg, showBgFgMap, hideBgFgMap, setBgFgBlock, follow, unfollow, animate, stopAnimate, setViewport, lockViewport, move, moveAction, moveHero, jump, jumpHero, changeFloor, changePos, showImage, showTextImage, hideImage, showGif, moveImage, rotateImage, scaleImage, setCurtain, screenFlash, setWeather, openDoor, closeDoor, useItem, loadEquip, unloadEquip, openShop, disableShop, battle, trigger, insert, playBgm, pauseBgm, resumeBgm, loadBgm, freeBgm, playSound, stopSound, setVolume, setBgmSpeed, setValue, addValue, setEnemy, setEnemyOnPoint, resetEnemyOnPoint, moveEnemyOnPoint, setEquip, setFloor, setGlobalAttribute, setGlobalValue, setGlobalFlag, setNameMap, setHeroIcon, input, input2, if, switch, choices, confirm, for, forEach, while, dowhile, break, continue, win, lose, restart, function, update, showStatusBar, hideStatusBar, showHero, hideHero, setHeroOpacity, vibrate, sleep, wait, waitAsync, stopAsync, callBook, callSave, autoSave, forbidSave, callLoad, exit, previewUI, clearMap, fillText, fillBoldText, fillRect, fillPolygon, strokeRect, strokePolygon, fillEllipse, strokeEllipse, fillArc, strokeArc, drawLine, drawArrow, setAttribute, setFilter, drawImage, drawIcon, drawSelector, drawBackground, drawTextContent`。
- 预编译：`_precompile_*` 共 18 个（`jump, showImage, moveImage, rotateImage, scaleImage, moveEnemyOnPoint, if, switch, choices, confirm, for, forEach, while, dowhile, wait, previewUI, fillPolygon, strokePolygon`）。
- 系统触发器：`_sys_*` 共 **8** 个（`battle, openDoor, getItem, changeFloor, pushBox, ski, action, custom`），注册入口 `events.js:295-301`（`registerSystemEvent`）。
- 自定义事件注册：`events.js:935-942`（`registerEvent` / `unregisterEvent`）；分发 `doEvent`（945-959）：先查 `this.actions[type]`，再查 `_action_<type>`，否则报“未知的自定义事件”。
- 触发器值：块 `trigger` 取值来自 `project/maps.js` 与 `libs/maps.js`：`action`（默认，`maps.js:290-291`）、`battle`（`242-243`）、`getItem`（`245-246`）、`openDoor`、`changeFloor`、`pushBox`、`ski`、`null`、`custom`。
- 事件数据：`project/events.js`（`commonEvent`）；字符串简写自动转 `text`（`events.js:1019-1020`）。
- 旧“面板/事件 ID”集合（`core.status.event.id`）共 29 个（去重）：`action, book, book-detail, centerFly, confirmBox, cursor, equipbox, gameInfo, help, keyBoard, localSaveSelect, notes, replay, replayLoad, replayRemain, replaySince, save, selectShop, settings, storageRemove, switchs, switchs-action, switchs-display, switchs-sounds, syncSave, syncSelect, toolbox, viewMaps, waiting`。
- 值表达式：`core.replaceValue` / `core.replaceText` / `core.calValue`（`utils.js`；`events.js` 预编译使用）；语法含 `${...}`、`flag:`、`item:`、`status:` 等。

**新引擎对应区域：**

- 触发器枚举：`packages-user/data-common/src/event/types.ts:7-30` 的 `EventTrigger`，共 **11** 个：
  `None, OnTouch, OnEnter, OnLeave, OnBeforeBattle, OnAfterBattle, OnBeforeOpenDoor, OnAfterOpenDoor, OnAfterGetItem, OnBeforeChangeFloor, OnAfterChangeFloor`。
- 事件对象：`packages-user/data-common/src/event/types.ts:32-74`（`interpreter/trigger/rawEvent/compiled/compile/execute`）。
- 内建函数注册：`src/data/event/registrations.ts:9-23`，共 **7** 个：
  `EventSetBlock, EventMoveBlock, EventRemoveBlock, EventMoveHero, EventStepHero, EventInsertEvents, EventInsertEvent`。
- 语句种类：`packages/anon-tokyo/src/type.ts:1-88` 的 `StatementType`：`Expression, Call, Return, If, Switch, Loop, Break, Continue, Block, Exit, FunctionDeclare`。
- 执行器：`packages-user/data-system/src/event/executor.ts`、`types.ts`（`EventExecuteMode`：Normal/CutIfFalsy/CutIfTruthy；`EventReduceMode`：NoReduce/OrReduce/AndReduce；`BlockEventType`：CommonEvent/PointEvent/TileEvent）。
- 事件存储：`packages-user/data-common/src/store/types.ts:296-318`（`IGameEventStore.addEvent/getEvent`）；`packages-user/data-common/src/store/eventStore.ts`。
- 地图/勇士内建实现：`src/data/event/{map,hero,event}.ts`；参数类型 `src/data/event/types.ts:6-65`。

**可穷举性：** 旧 = **穷举**（`_action_`/`_precompile_`/`_sys_` 前缀 + 注册表）；新 = **穷举**（注册数组 + `StatementType` + `EventTrigger`）。  
**核心风险：** 旧 129 个 JSON 事件语句 vs 新 7 个内建脚本函数，且新事件是**脚本 AST** 而非旧 JSON；`text/choices/confirm/input/wait/tip/playBgm/...` 等大量旧语句在新注册表中没有对应。审计要按“用户可编写的事件能力”对等，不能只比函数名。

### 3.4 战斗 / 伤害

**旧引擎枚举源：**

- 有效伤害入口：`project/functions.js:646-803`（`getDamageInfo`）。阶段顺序（行号）：
  1. 取勇士/怪物有效属性（657-677）
  2. 技能 1（二倍斩，680-682）
  3. 无敌 20（685-686，返回 `null`）
  4. 吸血 11（692-705）
  5. 每回合伤害 `mon_atk - hero_def`；魔攻 2（708-712）
  6. 连击 4/5/6（715-717）
  7. 反击 8（720-722）
  8. 先攻 1（725）
  9. 破甲 7（728-729）
  10. 净化 9（732-733）
  11. 勇士每回合伤害；破防返回 `null`（736-739）
  12. 回合数 `ceil(mon_hp / hero_per_damage)`（742）
  13. 支援 26 递归（746-774）
  14. 总伤害 `init + (turn-1)*per + turn*counter`（777）
  15. 扣护盾 `damage -= hero_mdef`（779）
  16. 负伤开关（782-783）
  17. 仇恨 17（786-788）、固伤 22（789-791）
  18. 取整 `Math.floor` 输出 8 个字段（793-802）
- 怪物信息/光环/支援：`project/functions.js:523-645`；光环 25 叠加规则（592-597）、支援 26 九宫格（600-606）、缓存（561-620）。
- 临界：`libs/enemys.js:222-372`（`nextCriticals`；`_nextCriticals_overAtk` / `_nextCriticals_special` / `_nextCriticals_useLoop` / `_nextCriticals_useBinarySearch` / `_nextCriticals_useTurn`）；`flags.useLoop` 决定算法（282-340）。
- 地图伤害：`project/functions.js:1252-1462`（`updateCheckBlock`：领域 15、夹击 16、阻击 18、捕捉 27、激光 24）；`libs/control.js:1118-1260`（`updateDamage` / `checkBlock`）。
- 战斗流程：`events.js:227-471`（`beforeBattle/afterBattle`、`battle`、`openDoor/getItem` 等系统事件）；`project/functions.js:227-471`（beforeBattle/afterBattle/afterOpenDoor/afterGetItem/afterPushBox）。
- 状态/减益：`libs/control.js:2402-2500`（`setStatus/addStatus/getStatus/getRealStatus/setBuff/addBuff/getBuff/triggerDebuff`）；`project/functions.js:1112-1168`（`triggerDebuff`）；`hero.statistics` 字段。

**新引擎对应区域：**

- 伤害系统接口：`packages-user/data-system/src/combat/types.ts:377-527`（`IEnemyDamageInfoBase{damage,turn}`、`IEnemyCritical`、`IDamageCalculator`、`IDamageContext`、`IDamageSystem.with`）。
- 伤害实现：`packages-user/data-system/src/combat/damage.ts`（`DamageContext.findNextCritical` 二分，147-183；`calculateEnemyCritical` 210-267；`DamageSystem` 缓存）。
- 主计算器：`src/data/enemy/calculator.ts:17-160`（`MainDamageCalculator.calculate`）；`getCriticalLimit`（162-178）。
- 最终效果：`src/data/enemy/final.ts`（坚固 3、模仿 8）。
- 光环：`src/data/enemy/aura.ts`（23 光环、24 支援、26 特殊光环）。
- 地图伤害：`src/data/enemy/mapDamage.ts`（13 领域、14 夹击、16 阻击、22 激光、25 捕捉；`MapDamageType` 在 `src/data/enemy/types.ts:1-12`）。
- 战后钩子：`src/data/enemy/hook.ts`（中毒 10、衰弱 11、诅咒 12、仇恨 15、退化 19、重生 21；支援/阻击位移 100-132）。
- 战斗流程：`packages-user/data-system/src/combat/{combat,enemy,context}.ts`；`ICombatFlow`（types.ts:847-901），`ICombatScript`（813-836）、`ICombatFlowHooks`（799-811）。
- 寻路：`packages-user/data-system/src/path/*`（移动/瞬移/地图伤害路径）。
- 日志/提示：`packages/common/src/logger.json`（308 行，错误码 1-78+ 警告码）；地图伤害提示字符串 `hook.ts:30-36`。

**可穷举性：** 旧 = **半穷举**（`getDamageInfo` 阶段可读，但公式可被 `project/functions.js`/用户覆盖，且 `enemy.<field>` 无 schema）；新 = **穷举**（计算器/光环/最终效果/地图伤害/钩子）。  
**已知差异点（供 P3 重点核对，不在本文件定论）：**

- 旧 2/3/n 连击拆成 4/5/6；新只有 4（值）。
- 旧支援 `guard_before_current_enemy=false` 默认时**不把支援怪回合加到当前怪回合**（746-772），新 `calculator.ts:81-98` 直接把 `extraInfo.turn` 加到 `turn`。
- 旧临界对坚固/模仿走 `_nextCriticals_special`（276-281），新 `getCriticalLimit` 对坚固返回 `Infinity`；旧 `flags.useLoop` 可选线性算法，新固定二分。
- 旧无敌返回 `null`（不可战斗），新返回 `{damage: Infinity, turn: 0}`（`calculator.ts:30-36`）。
- 旧 `counterAttack` 默认取 `core.values.counterAttack`，新特效率值默认 0，需内容显式配 `6` 的值。

---

### 3.5 地图 / 内容

**旧引擎枚举源：**

- 图块定义表：`project/maps.js`（224 条；行 3-226），字段并集：
  `cls, id, name, canPass, canBreak, cannotIn, cannotOut, trigger, script, event, doorInfo{time,openSound,closeSound,keys}, animate, faceIds, height, bigImage, enable, bg, fg`（由 `libs/maps.js` 使用点反推，**半穷举**）。
- `cls` 取值：`animates, terrains, autotile, items, npcs, npc48, enemys, enemy48, tileset`（`project/maps.js` 实测）。
- 图块运行时初始化：`libs/maps.js:200-292`（`initBlock`：`noPass` 默认、`trigger` 默认、`height`、`animate`、`faceIds`、`disable`）。
- 楼层字段（4 个楼层文件并集）：`floorId, title, name, canFlyTo, canFlyFrom, canUseQuickShop, cannotViewMap, defaultGround, images, bgm, weather, ratio, map, firstArrive, parallelDo, events, changeFloor, afterBattle, beforeBattle, afterGetItem, afterOpenDoor, cannotMove, cannotMoveIn, bgmap, fgmap, width, height, autoEvent, upFloor`。
- 地图图层/压缩：`libs/maps.js:1-200`（`_initMaps/_initFloors`）、`compressMap`、`saveMap`、`loadMap`、`decompressMap`；`bgmap/fgmap`、`maps/event/event2/fg/bg/damage` 画布（`core.js:113-127`、`bigmap.canvas`）。
- 地图绘制/autotile/大图/动画：`maps.js` 的 `drawMap/drawBg/drawFg/drawEvents/drawAutotile/drawThumbnail/drawBoxAnimate/drawAnimate/drawHeroAnimate`；`_drawBlockInfo_bigImage`、`_makeAutotileEdges`、`_drawAutotile_*`。
- 点/静态/动态事件：`extractBlocks`、`mapBlockObjs`、`initBlock`、`_addEvent`、`setBlock/removeBlock/moveBlock/jumpBlock/animateBlock`。
- 地图存读：`saveMap/loadMap`、`compressMap/decompressMap`（旧存档结构）。

**新引擎对应区域：**

- 图块 schema：`packages-user/data-common/src/store/types.ts:47-68` 的 `ITileRawData`（`num/id/events/type/pass{onlyEvents,outPass,inPass}/eventPass/translucence`）；`TileType`（6-25）；`PassBit`（27-36）。
- 地图 schema：`store/types.ts:265-276` 的 `IMapRawData`（`floorId/width/map/layerAlias/events`）；`IMapStore`（278-290）。
- 楼层/图层运行时：`packages-user/data-base/src/map/types.ts`（`IMapLayer` 478-600、`IGameMap` 651-740、`IMapState` 760-861、`IStaticTile` 149-163、`IDynamicTile` 165-203）；`map/{gameMap,mapLayer,staticTile,dynamicTile,tile,eventView,mover}.ts`。
- 事件视图：`eventView.ts`；`IGameEventStore`（store/types.ts:296-318）。
- 地图内容：`src/content/maps/*.jsonc`（`empty/MT0/sample0/1/2`，5 层）与 `maps/.list.jsonc`；默认 `src/content/defaults/map.jsonc`（仅 `floorId/width/map/layerAlias/events`）。
- 图块内容：`src/content/tile.jsonc`（235 条）与 `defaults/tile.jsonc`。
- 渲染层：`packages-user/client-base/src/map/*`（renderer/layer/vertex/viewport/status/extension/door/hero/text）。

**可穷举性：** 旧图块字段 = **半穷举**（无 schema，靠 `project/maps.js` 并集 + `libs/maps.js` 使用点）；旧楼层字段 = **穷举**（4 文件并集）；新 = **穷举**（`ITileRawData`/`IMapRawData`/`IMapLayer` 显式）。  
**已知风险：**

- 旧 `cls` 体系（含 48 变体、tileset）与新 `TileType`（Unknown/None/Terrain/Animate/Item/Enemy/Npc/Autotile/Tileset）不是一一对应；`npc48/enemy48` 在新引擎无类别。
- 旧图块字段 `canBreak/doorInfo/script/bigImage/faceIds/height/cannotIn/cannotOut/noPass/event` 在新 `ITileRawData` 中无直接字段；部分能力由 `pass`/`events`/`eventPass`/材质/扩展承担，需逐条判定。
- 旧楼层字段（`title/name/canFlyTo/canFlyFrom/canUseQuickShop/defaultGround/images/bgm/weather/ratio/firstArrive/parallelDo/changeFloor/afterBattle/beforeBattle/afterGetItem/afterOpenDoor/cannotMove/cannotMoveIn/bgmap/fgmap/autoEvent/upFloor`）在新 `IMapRawData` 中未体现；是否在其他 store/插件中有承载，需 P2 全量检索后判定。
- 旧 224 图块 vs 新 235 图块；旧 4 层 vs 新 5 层（`empty`），内容条目差异本身属于内容迁移，不计为引擎能力（但可作为覆盖线索）。

### 3.6 勇士 / 道具 / 装备 / flag / 商店

**旧引擎枚举源：**

- 勇士初始字段：`project/data.js:170-198`（`image/animate/name/lv/hpmax/hp/manamax/mana/atk/def/mdef/money/exp/equipment/items{constants,tools,equips}/loc{direction,x,y}/flags/followers/steps`）。
- 全局配置：`project/data.js:3-164`（`main`：`floorIds/floorPartitions/images/tilesets/animates/bgms/sounds/fonts/nameMap/levelChoose/equipName/startBgm/styles/splitImages`）；`firstData`（`title/name/version/floorId/hero/startCanvas/startText/shops/levelUp`）；`values`（`lavaDamage/poisonDamage/weakValue/redGem/blueGem/greenGem/redPotion/bluePotion/yellowPotion/greenPotion/breakArmor/counterAttack/purify/hatred/animateSpeed/moveSpeed/statusCanvasRowsOnMobile/floorChangeTime`）；`flags`（`statusBarItems` 12 项 + 21 个开关（共 22 键），见 `data.js:740-776`）。
- 道具表：`project/items.js`（63 条），字段并集：`cls,name,text,itemEffect,itemEffectTip,useItemEffect,useItemEvent,canUseItemEffect,hideInToolbox,hideInReplay,equip{type,animate,value,percentage,equipEvent,unequipEvent},icon,canSale,sell`（后三项由代码/商店使用点反推，**半穷举**）。`cls` 实际值：`items, constants, tools`（装备通过 `equip` 字段表达，`libs/items.js:417` 也识别 `equips`）。
- 道具运行时：`libs/items.js` 27 个方法（`getItemEffect/useItem/canUseItem/itemCount/hasItem/hasEquip/getEquip/setItem/addItem/removeItem/loadEquip/unloadEquip/compareEquipment/quickSaveEquip/quickLoadEquip`）。
- 装备槽：`project/data.js:122-125`（`equipName`）；`libs/items.js:218-235`（按名称/索引解析）；`hero.equipment` 数组。
- flag/开关：`libs/control.js:2540-2630`（`setFlag/addFlag/getFlag/hasFlag/removeFlag/getSwitch/setSwitch/addSwitch/hasSwitch/removeSwitch`）；`utils.js` 的 `setGlobal/getGlobal`。
- 状态栏字段：`project/data.js:741-754` 的 `statusBarItems`：`enableFloor, enableLv, enableHP, enableMana, enableAtk, enableDef, enableMDef, enableMoney, enableExp, enableKeys, enablePZF, enableSkill`。
- 商店：`project/data.js:559-678`（`shops[]`：`id/text/textInList/mustEnable/disablePreview/choices[{text,need,action}]`）；`libs/control.js` 的 `listShopIds/canUseQuickShop/openQuickShop`；`libs/ui.js` 的 `_drawQuickShop`；`project/functions.js` 的 `shop` 插件（`project/plugins.js:70`）。
- 升级：`project/data.js:679-719`（`levelUp[{need,title,action}]`）；`libs/events.js:checkLvUp`；`libs/control.js:getLvName/getNextLvUpNeed`。
- 统计：`hero.statistics` 字段（`battle,battleDamage,currTime,exp,extraDamage,hp,ignoreSteps,money,moveDirectly,poisonDamage,start,totalTime`，由 `libs/*` 使用点反推）。

**新引擎对应区域：**

- 勇士属性：`packages-user/data-common/src/types.ts:32-55` 的 `IHeroAttr`（`name/level/hp/hpmax/atk/def/mdef/mana/manamax/money/exp`）。
- 勇士状态：`packages-user/data-base/src/hero/types.ts`（`IHeroAttribute` 186-283、`IHeroItems` 612-647、`IHeroEquipment` 817-883、`IHeroState` 927-1007、`IHeroFollowersController` 520-579、`IHeroRendering` 448-461）。
- 道具 schema：`packages-user/data-common/src/store/types.ts:130-198`（`ItemCategory`、`IItemRawData`：`num/category/name/text/hideInToolbox/effect{useEvent,useEffect,canUse}/equip{slots,animate,value,percentage,loadEvent,unloadEvent}`）。
- 装备实例/槽：`data-base/src/hero/{equipment,equipStore}.ts`；`EquipStatus`（types.ts:808-815）；`compareEquip`（878-882）。
- flag：`packages-user/data-base/src/flag/types.ts`（`IFlagSystem` 47-136；`getFieldValueDefaults` 135）。
- 商店：`src/data/plugin/shop/{state,manager,system,plugin,types}.ts`（`IShopState`：`id/enabled/items/buyPrice/sellPrice`；`addItem/getCount/setPrice/getPrice/enable/disable`）；`src/client/plugin/shop/shop.tsx`；插件注册 `src/data/plugin/list.ts`、`src/client/plugin/list.ts`。
- 升级：在 `packages-user`/`packages`/`src` 中检索 `levelUp/checkLvUp/getLvName`，**仅** 在 `src/client/ui/statusBar.tsx:183/326` 与 `src/types/declaration/*` 命中；未发现新引擎升级系统实现（检索范围见 §6）。
- 统计：`src/client/ui/statistics.tsx` 是展示组件，数据通过 `StatisticsData` 传入；其计算函数 `calculateStatisticsOne`（141 起）仍用 `core.setFlag/core.status.hero`。
- 存档：`packages-user/data-common/src/save/types.ts`（`SaveCompression`、`ISaveableContent`）；`packages-user/client-base/src/save/{system,types}.ts`（Dexie、autosave/undo/redo、global）。

**可穷举性：** 新 = **穷举**（`IHeroAttr`/`IItemRawData`/`IHeroEquipment`/`IFlagSystem`/`IShopState`）；旧 = **半穷举**（道具/装备字段无 schema，`eval` 字符串）。  
**已知风险：**

- 旧 `cls: items/constants/tools` + `equip` 字段 vs 新 `ItemCategory: Unknown/Constant/Consumable/Pick/Equipment`；`hideInReplay` 在新无字段；`icon` 在新无字段（用 num 绑定材质）。
- 旧装备按 `equip.type`（数字或名称）+ `hero.equipment[type]` 存 id；新按 `uid` + 槽数组 + 实例仓。
- 旧 `equip.value`/`equip.percentage` 直接改 `hero` 属性/`addBuff`；新用 `IHeroModifier` 修饰器链。
- 旧 `levelUp`/`enableSkill`/`getLvName`/`getNextLvUpNeed` 在新引擎未发现等价实现。
- 旧商店是“事件选项 + need 表达式 + action”；新商店是“库存 + 买/卖价 + 启用状态”，语义不同。
- 旧 `statusBarItems` 12 项；新 `statusBar.tsx` 读取 `core.flags.statusBarItems`（legacy），实际支持 `enableLv/enableHP/enableHPMax/enableMana/enableAtk/enableDef/enableMdef/enableMoney/enableExp/enableLevelUp/enableKeys/enableGreenKey/enablePZF/enableDebuff`；`enableFloor/enableSkill` 未在 `statusBar.tsx` 体现，且 `enableMDef` 大小写不同。

### 3.7 渲染

**旧引擎枚举源：**

- 主循环与绘制调度：`libs/control.js` 的 `registerAnimationFrame/_setRequestAnimationFrame/_animationFrame_*`（18 个）。
- 地图绘制：`libs/maps.js` 的 `drawMap/redrawMap/drawBg/drawFg/drawEvents/drawThumbnail/drawAutotile/drawAutotileAnimate/drawBoxAnimate/drawAnimate/drawHeroAnimate/getPlayingAnimates/stopAnimate`；`_drawBlockInfo_bigImage`、`_drawBlockInfo_drawWithFilter`、`_drawBlockInfo_bgfg`、`_drawBlockInfo_shouldBlurFg`。
- Canvas 绘制原语：`libs/ui.js` 的 `clearMap/fillText/fillBoldText/fillRect/strokeRect/fillRoundRect/strokeRoundRect/fillPolygon/strokePolygon/fillEllipse/strokeEllipse/fillArc/strokeArc/drawLine/drawArrow/drawImage/drawIcon/drawTextContent/drawBackground/drawSelector`。
- 效果：天气 5 种（`libs/control.js:2701-2760+` 的 `_weather_rain/_weather_snow/_weather_fog/_weather_cloud/_weather_sun`；注册 `registerWeather` 2688-2691）；幕布 `setCurtain`；闪屏 `screenFlash`；提示 `drawTip`；地图/图块 alpha/filter（`setAlpha/setFilter/setBlockOpacity/setBlockFilter`）；`blurFg` flag；`drawLight` 插件（`project/plugins.js:9`）。
- 布局/视口：`control.js` 的 `setViewport/moveViewport/updateViewport/setGameCanvasTranslate/addGameCanvasTranslate/resize/_resize_*`；`core.bigmap`（`core.js:113-127`）。
- 字体/文本：`libs/ui.js` 的 `setFont/setFontForMaxWidth/calWidth/splitLines/drawText/drawTextContent/getTextContentHeight`；`drawTextBox/drawScrollText`；`core.status.textAttribute`（`core.js:227-239`）。
- 动画/精灵：`libs/maps.js` 的 `animateSetBlock/animateSetBlocks/animateBlock/moveBlock/jumpBlock`；`project/plugins.js` 的 `sprites`（1363）、`heroFourFrames`（1044）、`fiveLayers`（352）。
- 素材：`libs/loader.js` 的 `_loadMaterials_*`、`_loadAnimates_*`、`_loadAutotiles_*`、`_loadTilesets_*`、`_loadMusic_*`、`loadImages/loadImage`；`libs/icons.js` 的 `getTilesetOffset`。

**新引擎对应区域：**

- 渲染底层：`packages/render/src/core/*`（`MotaRenderer`、`Canvas2D`、`Graphics`、`Shader`、`Transform`、`Container`、`RenderItem`）；`packages/render/src/assets/*`（`TextureManager`/`Animater`/`Composer`/`Splitter`/`Store`）；`packages/render/src/style/font.ts`（`Font`）。
- Vue 桥/标签：`packages/render-vue/src/*`（`createRendererFor`、`tagManager`、`elements`）。
- 地图渲染器：`packages-user/client-base/src/map/renderer.ts`（`setViewport/clear/setLayerState/setStaticBackground/setDynamicBackground/setTileBackground/configBackground/configRendering/addPostEffect/addMovingBlock/tick` 等）；`map/types.ts`（`IMapRenderConfig`：`minBehavior/magBehavior/tileAlignX/tileAlignY/tileTestMode/frameSpeed`；`IMapRendererPostEffect`；`IBlockStatus.setAlpha/useGlobalFrame/useSpecifiedFrame`）。
- 图层/顶点：`map/{mapLayer,vertex,status,viewport,moving,block,element}.ts`。
- 扩展：`map/extension/{hero,door,text,manager}.ts`（勇士、门、地图文字）。
- 素材/材质：`packages-user/client-base/src/material/{manager,builder,autotile,types}.ts`（`addGrid/addRowAnimate/addTileset/addAutotile/addImage`、`buildAssets`、`getRenderable`）。
- 天气：`packages-user/client-modules/src/render/weather/{controller,weather}.ts` + `presets/{rain,snow,fog,cloud,cloudLike,sun}.ts`（**6 种预设**）。
- 特效：`packages-user/client-modules/src/render/fx/{base,image3d}.ts`（`EffectBase` 着色器效果）。
- 布局：`packages-user/client-base/src/layout/layout.ts`（`adjustGrid/adjustCover`）。
- 文字组件：`packages-user/client-base/src/components/{textbox,scroll,misc}.tsx`（`TextContent/Textbox/ScrollText/Progress/Selection`）。
- 内容：`src/content/texture/.list.jsonc`（48 项）、`animation/.list.jsonc`；`defaults/{texture,animation,font}.jsonc`。

**可穷举性：** 旧 = **半穷举**（绘制函数可列，但效果/插件/`project/plugins.js` 组合无限）；新 = **半穷举**（渲染器方法可列，但 `addPostEffect`/扩展/自定义着色器是开放集合）。  
**重点风险：** 旧 Canvas2D 绘制函数（`fillText/fillRect/...`）与新 `Graphics`/Vue 元素不是一一对应；旧“幕布/闪屏/绘制到任意命名画布”在新引擎无直接等价；旧 `blurFg`/`setBlockFilter(blur/shadow)` 与新 `setAlpha`/后处理不等价；旧大图（`bigImage`）与新材质/扩展关系需逐条核对。

### 3.8 UI / 输入

**旧引擎枚举源：**

- 面板/事件 ID：29 个（见 §3.3）。
- UI 绘制方法：`libs/ui.js` 187 个（61 公开），面板入口：
  `drawBook, drawBookDetail, drawFly, drawViewMaps, drawToolbox, drawEquipbox, drawSLPanel, drawKeyBoard, drawStatusBar, drawStatistics, drawAbout, drawHelp, drawTip, drawChoices, drawConfirmBox, drawWaiting, drawPagination, drawText, drawTextBox, drawScrollText, drawBackground`。
- 输入动作注册表：`libs/actions.js:17-58`，动作类型：
  `onkeyDown, onkeyUp, pressKey, keyDown, keyUp, ondown, onmove, onup, onmousewheel, keyDownCtrl, longClick, onStatusBarClick`（`onclick` 归入 `ondown`）。
- 按键映射/左手模式：`actions.js:127-152`（`W/S/A/D → 方向`，`I/J/K/L → W/A/S/D`）；旧 `onKeyUp` 覆盖在 `project/functions.js:806`。
- 状态栏/工具栏：`main.js:121-186`（8 个按钮 + 3 个扩展按钮）；`project/data.js:741-754`（`statusBarItems`）；`libs/control.js` 的 `drawStatusBar/updateStatusBar/_shouldDisplayStatus/_resize_statusBar/_resize_toolBar`。
- 设置：`libs/ui.js` 的 `_drawSwitchs/_drawSwitchs_sounds/_drawSwitchs_display/_drawSwitchs_action/_drawNotes`；`core.status.event.id` 的 `switchs*`。
- 存读档 UI：`_drawSLPanel`、`_drawSyncSave`、`_drawSyncSelect`、`_drawLocalSaveSelect`、`_drawStorageRemove`、`_drawReplay*`。
- 键盘/触屏：`libs/actions.js` 的 `ondown/onmove/onup/onmousewheel/longClick`；`libs/ui.js` 的 `_drawKeyBoard`。
- 提示/选择/输入/等待：`drawTip/drawChoices/drawConfirmBox/drawWaiting/drawText/drawTextBox`。

**新引擎对应区域：**

- UI 系统：`packages/system/src/ui/{controller,instance,container,types}.ts`（UI 栈、背景、打开/关闭/隐藏/显示、`IUIDefaultPropsBase`）。
- UI 屏幕（`src/client/ui/`，20 个文件）：
  `background.tsx, book.tsx, bookDetail.tsx, choices.tsx, equipbox.tsx, hotkey.tsx, inputBox.tsx, load.tsx, main.tsx, save.tsx, setting.tsx, settings.tsx, statistics.tsx, statusBar.tsx, title.tsx, toolbar.tsx, toolbox.tsx, viewmap.tsx, waitBox.tsx`（+ `index.ts`）。
- 商店 UI：`src/client/plugin/shop/shop.tsx`。
- 通用组件（`packages-user/client-base/src/components/`）：
  `FloorSelector, Icon/defineIcon, Input, List, ListPage, Progress, Arrow, ScrollText, Selection, Page, Scroll, TextContent, Textbox, Thumbnail, Tip`。
- 输入/热键：`packages/system/src/hotkey/*`（`HotkeyEmitMode: KeyUp/Once/Continuous`；`HotkeyCommand` 支持多组键、priority/block/timeout/interval/dt）；`packages-user/client-base/src/hotkey/*`；`src/client/misc/hotkey.ts` 命令表（`@common/confirm/exit/select-*`、`@game/up/right/down/left/turn/undo/redo/get-next/quick-equip`、`@ui/book/save/load/fly/menu/view-map/toolbox/command/replay/shop/statistics/...`、`@system/restart/comment/debug`）。
- 鼠标/触摸：`packages/render/src/core/event.ts`、`packages-user/client-base/src/components/input.tsx`、`src/client/ui/*` 的 `onClick/onWheel`。
- 设置：`packages-user/client-base/src/setting/{system,controls,factories,types}.ts`（未提交新文件）+ `src/client/ui/setting.tsx/settings.tsx`。
- 字体/文本：`packages/render/src/style/font.ts`；`TextContent/Textbox`。

**可穷举性：** 旧 = **穷举**（29 面板 ID + 12 输入动作 + `ui.prototype.*`）；新 = **穷举**（20 UI 文件 + 热键命令表），但**每屏功能点**需人工清单（无“功能注册表”）。  
**重点风险：**

- 旧 `fly`（`drawFly`）在新无独立 `fly.tsx`；`viewmap.tsx:119-122` 通过 `core.hasItem('fly')/core.flyTo` 实现“飞行”，依赖 legacy。
- 旧 `keyBoard`（虚拟键盘）在新 `hotkey.tsx` 是**按键设置**，不是游戏内虚拟键盘；`_drawKeyBoard` 无直接对应。
- 旧 `gameInfo/help/notes/about/selectShop/storageRemove/syncSave/syncSelect/localSaveSelect/replay*` 等面板在新文件列表中未发现同名实现。
- 旧 `statusBarItems` 与新 `statusBar.tsx` 支持项不完全一致（见 §3.6）。
- 旧提示/选择/确认/等待是 Canvas 绘制；新是 Vue 组件，交互语义需逐项核对（键盘索引、翻页、超时等）。

---

### 3.9 运行时 / 扩展

**旧引擎枚举源：**

- 模块加载：`main.js:85-99` 的 `loadList`（`loader, control, utils, items, icons, maps, enemys, events, actions, data, ui, extensions, core`）。
- 全局对象/转发：`libs/core.js:508-534`（`_forwardFuncs/_forwardFunc` 把模块公开方法挂到 `core`）；`core` 初始化 `init`（275-301）。
- 插件：`project/plugins.js` 的 13 个函数：`init, drawLight, shop, removeMap, fiveLayers, itemShop, enemyLevel, multiHeros, heroFourFrames, routeFixing, numpad, sprites, hotReload`；`core._init_plugins`（`core.js:490-506`）把 `plugins_*` 对象上的函数 `apply(core.plugin)`。
- 扩展：`libs/extensions.js`（动态加载 `extensions/*.js`）；`extensions/localSave.js`（覆写 localForage 到 `_saves/`）。
- 资源加载：`libs/loader.js`（31 方法）；`main.materials` 类别（`animates/enemys/items/npcs/terrains/enemy48/npc48/icons`）。
- 音频：`libs/control.js` 的 `playBgm/pauseBgm/resumeBgm/setBgmSpeed/playSound/stopSound/getPlayingSounds/checkBgm/setMusicBtn`；`core.musicStatus`（`core.js:71-86`：`bgmStatus/soundStatus/playingBgm/lastBgm/gainNode/playingSounds/userVolume/designVolume/bgmSpeed/bgmUsePitch/cachedBgms/cachedBgmCount`）。
- 存档：`control.js` 的 `saveData/loadData/getSave/getSaves/getAllSaves/getSaveIndexes/hasSave/removeSave/autosave/checkAutosave/doSL/syncSave/syncLoad`；`core.saves`（`core.js:128-142`）；`utils.js` 的 localForage 封装。
- 服务端：`server.js` 的静态服务/读写/热重载/录像上传校验排行/存档同步（`replay*`、`sync*`、`watch`）。
- 错误/调试：`libs/*` 大量 `console.error/console.warn`；`core.debug`（`control.js`）；`main.mode`（`play/editor`）；`main.isCompetition`。
- 构建/入口：`main.js` 动态脚本注入（`loadMod/loadJs`）；`index.html`；`editor.html`。

**新引擎对应区域：**

- 插件系统：`packages-user/data-state/src/types.ts`（`PluginStatus: NotAwakened/Awakened/Initialized/Loaded`；`IDataPluginDefine.awake/initialize/afterLoad`；`ICoreStateConfig.dataPlugins/events`）；`data-state/src/plugin.ts`（拓扑排序、环/缺失依赖）；`CoreState.load()`（`data-state/src/core.ts`）。
- 客户端插件镜像：`packages-user/client-modules/src/types.ts`（`IClientPluginDefine/IClientPlugin`）、`ClientCore`；`src/client/initialize.ts` 的 `MainClientPlugin`；`src/client/plugin/list.ts`。
- 插件列表：`src/data/plugin/list.ts`（仅 `DataShopPlugin`）；`src/client/plugin/list.ts`（仅 `ClientShopPlugin`）。
- 资源加载：`packages/loader/src/*`（`LoadManager`、`ILoadTask`、流、`WebLoadStarter`）；`packages-user/data-state/src/loader/*`（`loader.ts`、`jsoncProcessor.ts`）；`packages-user/client-modules/src/loader/*`。
- 音频：`packages/audio/src/*`（`BGMPlayer`、`SoundPlayer`、`AudioContext`、`route`、`effect`、`decoder`、`source`）；`IClientBase.bgmPlayer/soundPlayer/audioContext`（`client-base/src/types.ts`）。
- 存档：`packages-user/data-common/src/save/types.ts`（`ISaveableContent`、`SaveCompression`）；`packages-user/client-base/src/save/*`（Dexie、autosave/undo/redo、global、`getLastSlot`）；`CoreState` 的 `saveState/loadState` + `bindSaveableExecuter`。
- 服务端/网络：新仓库**未发现** `server.js`/`server.py`；仅 `packages-user/client-modules/src/render/utils/saves.ts:108` 有 `fetch('/games/sync.php')` 的客户端同步残留（且压缩逻辑被注释）。
- 错误/日志：`packages/common/src/logger.json`（308 行；错误码 1-78+、警告码）；`logger.ts`。
- 全局 `Mota`：`packages-user/entry-data/src/mota.ts`（`IMota.r/rf/require/register`）；`entry-client/src/create.ts` 注册模块；`src/bootstrap.ts`。
- 构建/入口：`src/bootstrap.ts`、`src/client/entry.ts`、`src/data.ts`、`src/data/entry.ts`、`index.html`；`script/` 构建脚本（不在本次代码审计范围，但属于运行时入口能力）。

**可穷举性：** 旧 = **半穷举**（13 插件 + 扩展目录；插件内部可任意写）；新 = **穷举**（插件接口 + 注册列表），但**开放钩子**（`registerXxx`）使能力面无限。  
**重点风险：**

- 旧 `core.plugin` 是任意对象挂载；新插件是强类型四段式 + 依赖拓扑，能力对等但扩展写法完全不同。
- 旧 `extensions/*.js` 可动态加载任意脚本；新引擎未发现等价“目录扫描 + 动态脚本”扩展机制（`packages/loader` 是资源加载，不是代码扩展）。
- 旧 BGM 有 `bgmSpeed`/`bgmUsePitch`/缓存数量；新 `packages/audio` 有音量/路由/效果，但**未发现** speed/pitch；需 P6 判定。
- 旧服务端上传/校验/排行/热重载；新仓库无服务端实现，只有客户端 `sync.php` 残留。
- 旧 `core.debug`/编辑器模式/竞赛模式；新未发现等价。

### 3.10 内容数据

**旧引擎：**

- `project/data.js`：`main`（14 键）、`firstData`（9 键）、`values`（18 键）、`flags`（22 键）。
- `project/enemys.js`：81 条；`project/items.js`：63 条；`project/maps.js`：224 条图块；`project/icons.js`：9 类图标；`project/events.js`：`commonEvent`；`project/plugins.js`：13 插件。
- `project/floors/*.js`：4 层（`MT0/sample0/1/2`），字段见 §3.5。
- 素材目录：`animates/autotiles/bgms/fonts/images/materials/sounds/tilesets`。

**新引擎：**

- `src/content/core.jsonc`：`name/title/version/floorAreas/content{...}/init{startEvent,hero,shop}/flag{11 项}`。
- `src/content/client.jsonc`：`titleImage/titleBGM/heroImage/content{textureDir,textureListDir,audioDir,audioListDir,animationDir,animationListDir,fontDir,fontListDir,defaults}`。
- `src/content/enemy.jsonc`（81 条）、`item.jsonc`（62 条）、`tile.jsonc`（235 条）、`maps/*.jsonc`（5 层）。
- `src/content/*/.list.jsonc`：`texture`（48 项）、`animation`、`audio`、`font`、`maps`。
- `src/content/defaults/*.jsonc`：`enemy/item/map/tile/texture/audio/animation/font`（各字段默认值）。
- `src/data/plugin/shop` 的商店数据来自 `core.jsonc` 的 `init.shop`（`ICoreStateShopInitConfig{id,enabled,items}`）。

**可穷举性：** 旧 = **穷举**（文件 + 表）；新 = **穷举**（文件 + schema 注释）。  
**重点风险：** 旧内容字段（`cls/canBreak/doorInfo/script/bigImage/faceIds/height/noPass/cannotIn/cannotOut`、楼层 `title/canFlyTo/...`、道具 `hideInReplay/itemEffect/useItemEffect/canUseItemEffect/equip.type`）与新 schema 的对应关系需要逐字段映射；`09-DATA-MIGRATION-AUDIT.md` 是已做的迁移台账，但**该台账不是本次引擎能力审计**，只能作为线索，不能直接当结论。

### 3.11 领域汇总表

| # | 领域 | 旧枚举源 | 旧规模 | 新对应 | 新规模 | 可穷举性 | 主文档 |
| --- | --- | --- | ---: | --- | ---: | --- | --- |
| 1 | 录像/回放 | `control.js:38-52` + `utils.js:524-740` | 15 动作 / 21 字母 | `replay/types.ts:5-22` + `commands.ts` | 8 指令 | 穷举 | P3 |
| 2 | 怪物/特殊属性 | `project/functions.js:493-521` + `project/enemys.js` | 27 特殊 / 81 模板 | `src/data/enemy/special.ts:84-476` + `IEnemyAttr` | 27 特殊 / 81 模板 | 特殊穷举、字段半穷举 | P2、P3 |
| 3 | 事件 | `events.js:_action_*` | 129 语句 / 18 预编译 / 8 触发器 / 29 面板 ID | `src/data/event/registrations.ts` + `anon-tokyo/type.ts` | 7 内建 / 11 语句种类 / 11 触发器 | 穷举 | P3、P5 |
| 4 | 战斗/伤害 | `project/functions.js:646-803` + `enemys.js:222-372` | ~18 阶段 | `calculator.ts` + `damage.ts` + `aura/final/mapDamage/hook` | ~18 阶段 | 半穷举（旧可覆盖） | P3 |
| 5 | 地图/内容 | `project/maps.js` + `floors/*.js` + `maps.js` | 224 图块 / 29 楼层字段 | `store/types.ts` + `data-base/map` + `src/content` | 235 图块 / 5 层 | 旧半穷举、新穷举 | P2、P4 |
| 6 | 勇士/道具/装备/flag/商店 | `project/data.js` + `items.js` + `control.js` | 63 道具 / 12 状态栏项 / 22 flag 键 | `IHeroAttr/IItemRawData/IHeroEquipment/IFlagSystem/IShopState` | 62 道具 / 11 flag | 旧半穷举、新穷举 | P2、P3、P5 |
| 7 | 渲染 | `maps.js` + `ui.js` + `control.js` | 绘制函数 ~150 / 5 天气 | `render` + `client-base/map/material` + `client-modules/weather/fx` | 渲染器方法 ~60 / 6 天气 | 半穷举 | P4 |
| 8 | UI/输入 | `ui.js` + `actions.js` + `main.js` | 29 面板 / 12 动作 | `src/client/ui` + `system/ui` + `hotkey` | 20 屏幕 / 4 命令组 | 穷举（屏幕）/半穷举（功能点） | P5 |
| 9 | 运行时/扩展 | `core.js` + `extensions.js` + `project/plugins.js` + `server.js` | 13 插件 / 31 loader 方法 | `data-state/plugin` + `loader` + `audio` + `save` + `Mota` | 1 商店插件 / 4 段插件 | 半穷举 | P6 |
| 10 | 内容数据 | `project/*.js` + `floors` | 见 §3.10 | `src/content/*` | 见 §3.10 | 穷举 | P2 |

---

## 4. 差异审计拆分方案（6 份文档/计划的精确边界）

### 4.1 总表

| 文档 | 文件（建议） | 覆盖 | 旧引擎输入 | 新引擎检索区域 | 预计条目量级 | 依赖 |
| --- | --- | --- | --- | --- | ---: | --- |
| P1 index | `09-PARITY/00-INDEX.md` | 口径、ID 规则、覆盖率台账、6 文档索引、汇总矩阵、未决问题 | 本文件 + 旧枚举源清单 | 全部（只做索引，不判定） | 15–30（元条目） | 无（先做） |
| P2 数据与内容 | `09-PARITY/01-DATA.md` | 怪物模板/特殊属性、道具、装备、图块、楼层、地图、内容表、数据存档结构 | `project/{enemys,items,maps,icons,data}.js`、`floors/*`、`libs/{enemys,items,maps}.js`、`project/functions.js:486-810` | `data-common/store`、`data-base/{enemy,hero,map,flag}`、`src/data/enemy`、`src/content` | 180–260 | P1 |
| P3 玩法系统 | `09-PARITY/02-GAMEPLAY.md` | 战斗管线、伤害/临界/光环/支援/地图伤害、减益/状态、事件执行语义、寻路/移动、楼层切换、商店、升级/统计、回放命令语义 | `project/functions.js`（events/enemys/control/ui 覆盖）、`libs/{control,events,enemys,items}.js` | `data-system/{combat,event,path}`、`src/data/{enemy,event,replay,plugin/shop}`、`data-base/{hero,map}` | 120–180 | P1、P2（共享特殊属性/图块映射） |
| P4 渲染 | `09-PARITY/03-RENDER.md` | 地图渲染器/图层/图块/材质/着色器/autotile/动画/大图/覆盖层/透明度/后处理/天气/字体/文本/布局/视口/缩略图 | `libs/{maps,ui,control,loader,icons}.js`、`project/plugins.js`（drawLight/sprites/fiveLayers）、`extensions` 渲染相关 | `packages/{render,render-vue,animate}`、`client-base/{map,material,layout,elements}`、`client-modules/{render,weather,fx}`、`src/content/{texture,animation}` | 80–130 | P1、P2（图块/材质映射） |
| P5 UI/输入 | `09-PARITY/04-UI-INPUT.md` | 全部屏幕/面板、状态栏/工具栏、热键/键盘/鼠标/触摸、设置/存读档、book/equipbox/toolbox/shop/viewmap/fly、文本/选择/输入/等待 | `libs/{ui,actions,control}.js`、`main.js`、`project/data.js:741-754`、`project/functions.js`（onKeyUp/onStatusBarClick/ui） | `src/client/{ui,misc,plugin}`、`system/ui`、`client-base/{components,hotkey,setting,save,use}` | 120–180 | P1、P3（book 战斗/临界）、P2（道具/图块） |
| P6 运行时/扩展 + 不确定汇总 | `09-PARITY/05-RUNTIME-UNCERTAIN.md` | 插件/扩展 API、资源加载、音频/BGM/SE、存档/存储、服务端/网络、错误/日志/调试、全局 `Mota`、构建/入口、回放播放控制；并汇总全部 `UNCERTAIN` | `libs/{core,loader,extensions,utils}.js`、`project/plugins.js`、`extensions/*`、`server.js`、`main.js` | `data-state/{plugin,loader,core}`、`loader`、`audio`、`save`、`client-modules/{loader,render/utils}`、`entry-*`、`src/bootstrap.ts`、`logger.json` | 90–140 | P1–P5（汇总依赖） |

### 4.2 每份文档的边界细则

**P1 index（先做）：**

- 固定口径、ID 命名空间、判定枚举、证据格式、覆盖率台账模板。
- 给出 6 份文档的交叉引用与“旧→新枚举源”总清单（不展开条目）。
- 汇总矩阵只放**计数与状态**（MISSING/PARTIAL/DIFFERENT/UNCERTAIN 各多少），不放逐条结论。
- 验收：任何人只看 INDEX 就能知道“哪份文档覆盖哪个旧模块、哪些旧枚举源尚未分配”。

**P2 数据与内容：**

- 必覆盖：怪物模板字段 + 特殊属性语义 + 道具分类/效果/装备 + 图块字段 + 楼层字段 + 地图层/事件存储 + 内容表（enemy/item/tile/map）+ 数据存档结构（`saveState/loadState`）。
- 不覆盖：伤害公式（P3）、渲染表现（P4）、UI 展示（P5）。
- 旧输入：`project/functions.js:486-810`（怪物）、`project/items.js`、`project/maps.js`、`project/floors/*`、`project/data.js`、`libs/{enemys,items,maps}.js`。
- 新检索：`packages-user/data-common/src/store/*`、`data-base/{enemy,hero,map,flag}/*`、`src/data/enemy/*`、`src/content/*`。
- 量级依据：81 怪物 + 63 道具 + 224 图块 + 29 楼层字段 + 27 特殊属性 + 22 flag 键 + 18 values + 9 firstData + 14 main ≈ 480 原始项；按“字段/语义”合并后约 180–260 条。

**P3 玩法系统：**

- 必覆盖：伤害阶段、公式/取整、临界、光环/支援/特殊光环、地图伤害、战斗流程/战前战后脚本、状态/减益、事件语句语义（按能力，不按 129 个名字逐条抄）、事件值表达式、寻路/移动/跳跃/瞬移、楼层切换、商店买卖/库存、升级/经验、统计、回放命令语义与参数。
- 不覆盖：纯数据字段（P2）、渲染表现（P4）、UI 面板（P5）。
- 旧输入：`project/functions.js`（有效行为）、`libs/{control,events,enemys}.js`。
- 新检索：`data-system/{combat,event,path}`、`src/data/{enemy,event,replay,plugin/shop}`、`data-base/{hero,map}`。
- 量级依据：~18 伤害阶段 + 27 特殊属性语义 + 129 事件语句按类合并 + 15 回放动作 + 商店/升级/统计/寻路 ≈ 120–180 条。

**P4 渲染：**

- 必覆盖：地图图层/背景/前景/事件层、图块材质/帧动画/autotile/tileset、大图、移动块/动画、覆盖层/透明度/滤镜、后处理/着色器、天气、字体/文本渲染、布局/视口/缩放、缩略图、勇士/门/地图文字扩展。
- 不覆盖：UI 面板布局（P5）、战斗数值（P3）。
- 旧输入：`libs/maps.js`（draw*）、`libs/ui.js`（绘制原语）、`libs/control.js`（天气/视口/缩放）、`libs/loader.js`、`project/plugins.js`（drawLight/sprites/fiveLayers）。
- 新检索：`packages/render/*`、`packages/render-vue/*`、`packages/animate/*`、`client-base/{map,material,layout,elements}`、`client-modules/{render,weather,fx}`、`src/content/{texture,animation}`。
- 量级依据：旧绘制/效果函数 ~150，按能力合并 ≈ 80–130 条。

**P5 UI/输入：**

- 必覆盖：29 个旧面板 ID 对应的屏幕、状态栏/工具栏、热键/键鼠触摸/长按/滚轮、设置、存读档 UI、book/bookDetail/equipbox/toolbox/shop/viewmap/fly、choices/confirm/input/wait/tip/textbox。
- 不覆盖：底层渲染（P4）、战斗公式（P3）。
- 旧输入：`libs/ui.js`、`libs/actions.js`、`libs/control.js`（status bar）、`main.js`（DOM/按钮）、`project/data.js:741-754`、`project/functions.js`（onKeyUp/onStatusBarClick/ui）。
- 新检索：`src/client/{ui,misc,plugin}`、`packages/system/src/ui`、`client-base/{components,hotkey,setting,save,use}`。
- 量级依据：29 面板 + 12 输入动作 + 12 状态栏项 + 热键命令 ~40 ≈ 120–180 条。

**P6 运行时/扩展 + 不确定汇总：**

- 必覆盖：插件生命周期/依赖、扩展加载、资源加载、音频/BGM/SE、存档/存储/同步、服务端/网络、错误码/日志/调试、全局 `Mota`、构建/入口、回放播放控制（播放/暂停/倍速/单步/回退）。
- 必须汇总：P2–P5 中所有 `UNCERTAIN`，去重、编号 `UNC-*`、说明“为何不确定/下一步怎么确认”。
- 不覆盖：已在 P2–P5 明确判定的条目（只交叉引用）。
- 旧输入：`libs/{core,loader,extensions,utils}.js`、`project/plugins.js`、`extensions/*`、`server.js`、`main.js`。
- 新检索：`data-state/{plugin,loader,core}`、`packages/loader`、`packages/audio`、`client-base/save`、`client-modules/{loader,render/utils}`、`entry-*`、`src/bootstrap.ts`、`logger.json`。
- 量级依据：13 插件 + 31 loader 方法 + 音频/存档/服务端/错误码 ≈ 90–140 条。

### 4.3 依赖关系

```text
P1 (index)
 ├─> P2 (data/content)
 │     ├─> P3 (gameplay)  ← 依赖 P2 的特殊属性/图块映射
 │     ├─> P4 (render)    ← 依赖 P2 的图块/材质映射
 │     └─> P5 (UI/input)  ← 依赖 P2 的道具/图块；依赖 P3 的战斗/临界（book）
 └─> P6 (runtime/uncertain) ← 依赖 P2–P5 的 UNCERTAIN 汇总
```

> 建议：**严格按 P1→P2→P3→P4→P5→P6 顺序**执行；若必须并行，P2 必须先完成，P4 可与 P3 并行，P6 必须最后。

---

## 5. 条目 ID 与证据格式

### 5.1 ID 命名空间

| 前缀 | 文档 | 示例 |
| --- | --- | --- |
| `PAR-IDX-###` | P1 index 元条目 | `PAR-IDX-003` |
| `PAR-DATA-###` | P2 数据与内容 | `PAR-DATA-014` |
| `PAR-GAME-###` | P3 玩法系统 | `PAR-GAME-027` |
| `PAR-REND-###` | P4 渲染 | `PAR-REND-011` |
| `PAR-UI-###` | P5 UI/输入 | `PAR-UI-042` |
| `PAR-RT-###` | P6 运行时/扩展 | `PAR-RT-009` |
| `PAR-UNC-###` | P6 不确定汇总（从各文档汇总） | `PAR-UNC-006` |

规则：ID **只增不改**；条目被合并/拆分时保留旧 ID 并在“变更记录”注明；跨文档引用用完整 ID。

### 5.2 每条条目必须包含的字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `ID` | 是 | 见 §5.1 |
| `名称` | 是 | 功能/行为/内容条目的短名 |
| `领域` | 是 | 数据/玩法/渲染/UI/运行时 |
| `旧证据` | 是 | `file:line` + 符号 + **原文摘录**（1–5 行）；不得只写“旧引擎有” |
| `旧行为` | 是 | 用一句话描述旧引擎的可观察行为（输入→输出/状态变化） |
| `新检索` | 是 | 检索到的路径/符号/行号；若未找到，写“未检索到”+ 检索范围 |
| `新结论` | 是 | `MISSING / PARTIAL / DIFFERENT / UNCERTAIN / SUPPORTED` |
| `缺口/差异` | 是 | PARTIAL 列已支持/未支持；DIFFERENT 列旧 vs 新；UNCERTAIN 列不确定性来源 |
| `影响` | 是 | `blocker / major / minor / info`（对“最小浏览器可运行/对等内容”的影响） |
| `证据等级` | 是 | `E1 / E2 / E3`（见 §1.7） |
| `备注` | 否 | 关联条目、待确认点、内容迁移风险 |
| `变更记录` | 否 | 合并/拆分/推翻时使用 |

### 5.3 判定枚举（固定值，不得自造）

`MISSING` / `PARTIAL` / `DIFFERENT` / `UNCERTAIN` / `SUPPORTED`。  
**最终统计只把前四类计入“差异”；`SUPPORTED` 只用于说明“已覆盖”，不计入差异；`NEW-ONLY` 只允许出现在附录，不进入统计。**

### 5.4 条目模板（不是最终审计结论）

```md
| 字段 | 内容 |
| --- | --- |
| ID | PAR-GAME-000 |
| 名称 | <功能短名> |
| 领域 | 玩法 |
| 旧证据 | `D:\github\mota-js\project\functions.js:646-803` `getDamageInfo`；原文：`...` |
| 旧行为 | <旧引擎可观察行为> |
| 新检索 | `packages-user/.../calculator.ts:17-160` `MainDamageCalculator.calculate`；或“在 `packages/**`、`packages-user/**`、`src/**`（排除 legacy/declaration）检索 `xxx`，未检索到” |
| 新结论 | MISSING / PARTIAL / DIFFERENT / UNCERTAIN / SUPPORTED |
| 缺口/差异 | <PARTIAL 列子项；DIFFERENT 列旧/新；UNCERTAIN 列原因> |
| 影响 | blocker / major / minor / info |
| 证据等级 | E1 / E2 / E3 |
| 备注 | <关联/待确认> |
```

### 5.5 防“空口判定”规则

1. 每条必须有**旧证据原文**（至少 1 行代码/数据摘录）和**新检索结论**；缺一不可。
2. 旧证据必须来自 §1.2 范围内的文件；不得引用 `public/`、教学文档。
3. 新检索不得引用 `packages/legacy-*`、`packages/client*`、`src/types/declaration/**` 作为“支持”。
4. 若新行为只能通过全局 `core.*` 触发，判 `PARTIAL` 或 `UNCERTAIN`，并在“新检索”中注明 `core` 调用点。
5. 数值型断言（默认值、取整、顺序）必须引用原文；不得凭记忆写“旧引擎是 X”。
6. 同一功能在旧引擎有“默认实现 + project 覆盖”时，`旧证据` 必须同时给出两者（或注明“样板有效行为见 `project/functions.js:...`”）。

---

## 6. 检测与防漏报策略

### 6.1 旧引擎防漏清单（必须逐项覆盖）

| # | 枚举源 | 生成方式 | 规模 | 分配文档 |
| --- | --- | --- | ---: | --- |
| 1 | `control.prototype.*` 公开方法 | `Select-String '^control\.prototype\.[a-zA-Z]'` | 124 | P3/P6 |
| 2 | `ui.prototype.*` 公开方法 | 同上 | 61 | P4/P5 |
| 3 | `maps.prototype.*` 公开方法 | 同上 | 81 | P2/P4 |
| 4 | `actions.prototype.*` 公开方法 | 同上 | 15 | P5 |
| 5 | `events.prototype.*` 公开方法 | 同上 | 84 | P3/P5 |
| 6 | `events._action_*` | 前缀 | 129 | P3 |
| 7 | `events._precompile_*` | 前缀 | 18 | P3 |
| 8 | `events._sys_*` | 前缀 | 8 | P3 |
| 9 | `registerReplayAction` + `_replayAction_*` | 注册表 + 前缀 | 15 | P3 |
| 10 | `_encodeRoute_encodeOne` / `_decodeRoute_decodeOne` 字母 | 函数体 switch/if | 21 | P3 |
| 11 | `getSpecials()` 行 | 表 | 27 | P2/P3 |
| 12 | `project/enemys.js` 条目 + 字段并集 | 对象键 + `functions.js` 使用点 | 81 / ~20 字段 | P2 |
| 13 | `project/items.js` 条目 + 字段并集 | 对象键 | 63 / ~15 字段 | P2 |
| 14 | `project/maps.js` 条目 + 字段并集 | 对象键 | 224 / ~18 字段 | P2 |
| 15 | `project/floors/*.js` 字段并集 | 对象键 | 29 | P2 |
| 16 | `project/data.js` 的 `main/firstData/values/flags` 键 | 对象键 | 14/9/18/22 | P2/P3 |
| 17 | `project/icons.js` 9 类 + ID | 对象键 | 9 类 | P2 |
| 18 | `project/plugins.js` 13 插件 | 对象键 | 13 | P6 |
| 19 | 天气 5 种 | `_weather_*` | 5 | P4 |
| 20 | 面板/事件 ID 29 个 | `status.event.id = '...'` | 29 | P5 |
| 21 | 输入动作 12 个 | `registerAction` 调用 | 12 | P5 |
| 22 | 状态栏项 12 个 | `data.js:741-754` | 12 | P5 |
| 23 | 图块 `cls` 9 类 | `project/maps.js` | 9 | P2 |
| 24 | 楼层 `trigger` 值 | `project/maps.js` + `maps.js` | 8 个系统触发器（+ null 关闭） | P2/P3 |
| 25 | `runtime.d.ts` 声明类/方法 | 声明文件 | 12 类 | 全 |

**执行要求：** P1 在 INDEX 中建立“防漏清单 → 文档”的映射；P2–P6 每份文档末尾给出“本文件已覆盖的枚举源 + 未覆盖/转交”的覆盖率台账；P6 汇总总覆盖率。

### 6.2 正向 + 反向双通道

- **正向（旧→新）**：按 §6.1 逐项在新引擎检索，生成 `MISSING/PARTIAL/DIFFERENT/UNCERTAIN`。
- **反向（新→旧）**：遍历新引擎的枚举/注册表/表（`ReplayCode`、`EventTrigger`、`createEventRegistrations`、`createSpecials`、`ItemCategory`、`TileType`、`ICoreStateFlagConfig`、`logger.json` 码表、`dataPlugins/clientPlugins`、`hotkey.setGroup` 命令），反查旧引擎是否有对应语义。  
  **反向通道只用于发现“改名/重组/编号变化”，不新增 NEW-ONLY 条目**；发现旧引擎无对应时，在备注记“NEW-ONLY（不计入）”。
- **交叉验证**：同一能力若在旧引擎有多个入口（如 `core.useItem` 与 `core.items.useItem`、事件 `useItem` 与录像 `item:`），必须合并为一条并在“旧证据”列出全部入口，避免重复计数。

### 6.3 负证据（“新引擎没有”）的检索协议

1. **检索范围**：`packages/**`、`packages-user/**`、`src/**`；排除 `node_modules`、`dist`、`docs`、`public`、`packages/legacy-*`、`packages/client*`、`src/types/declaration/**`。
2. **检索模式**：至少覆盖
   - 旧符号原名（camelCase）
   - 旧符号 kebab-case / 下划线变体
   - 新引擎可能的别名（如 `levelUp` ↔ `level`、`checkLvUp` ↔ `levelUp`、`bgmSpeed` ↔ `playbackRate`）
   - 中文注释关键词（如“升级”“吸血”“光环”“幕布”“闪屏”）
   - 枚举成员/常量名
3. **判定“未检索到”前必须**：
   - 在 `packages-user/data-*` 的 `index.ts`/`types.ts` 查导出；
   - 在 `src/data`、`src/client` 查实现；
   - 在 `packages/render`/`packages/audio`/`packages/loader` 查底层；
   - 在 `packages/common/src/logger.json` 查是否有对应错误码（有错误码通常意味着有实现或已规划）。
4. **命中 legacy 时**：立即降级为 `PARTIAL`/`UNCERTAIN`，并在“新检索”记录 `legacy` 路径，注明“不计为支持”。
5. **命中 declaration 时**：只作为“旧 API 存在”的旁证，不算新实现。

### 6.4 “不确定视为不支持”的落地

- `UNCERTAIN` 条目在统计中计入“差异”，并在 P6 的 `PAR-UNC-*` 汇总中给出：
  - 不确定来源（缺枚举源 / 动态 eval / 扩展点 / 新引擎实现不完整 / 文档缺口）
  - 已检索范围
  - 建议的确认方式（读哪个文件、跑哪个测试、问用户哪个决策）
- 禁止把 `UNCERTAIN` 写成“应该支持”或“可能支持”；只写“在本次检索范围内无法证明支持”。

### 6.5 legacy 误判防护

- 建立 deny-list：`packages/legacy-`、`@motajs/legacy-`、`packages/client`、`packages/client-base`、`src/types/declaration`、全局 `core.`。
- 任何“新引擎支持”的结论必须给出**至少一个新包内的实现锚点**；只有 UI 调用 `core.*` 的，判 `PARTIAL/UNCERTAIN`。
- 对 `@motajs/client`/`client-base` 的 import 逐条检查是否只是类型/胶水；若是运行时功能，按 legacy 处理。

### 6.6 旧“有效行为”与“引擎默认”双记录

- 旧 `libs/*` 是引擎默认；`project/functions.js` 是样板覆盖（29 个覆写）。  
- 对每个受覆盖影响的条目（`events/enemys/actions/control/ui`），`旧证据` 同时列：
  - `libs/...` 默认实现；`project/functions.js:...` 覆盖实现；
  - 若两者行为不同，`旧行为` 写“样板有效行为”，备注写“引擎默认为 ...”。
- 这样可避免把“样板特例”误判为“引擎能力”，也避免漏掉样板实际行为。

---

## 7. 计划拆分与波次建议（P1..P6）

### 7.1 波次

| 波次 | 计划 | 目标 | 前置 |
| --- | --- | --- | --- |
| W0 | P1 index | 固定口径/ID/模板/覆盖率台账；建立 6 文档骨架 | 无 |
| W1 | P2 数据与内容 | 完成数据/内容条目 | P1 |
| W2 | P3 玩法系统 | 完成玩法/战斗/事件/回放条目 | P1、P2 |
| W3 | P4 渲染 | 完成渲染条目 | P1、P2 |
| W4 | P5 UI/输入 | 完成 UI/输入条目 | P1、P2、P3 |
| W5 | P6 运行时/扩展 + 不确定汇总 | 完成运行时条目 + 汇总 UNCERTAIN + 总覆盖率 | P1–P5 |

> 用户已定“P1 先做，P2..P6 可依序”；上述 W2/W3 可互换，但 P5 依赖 P3，P6 必须最后。

### 7.2 每份文档的验收标准

**通用：**

- [ ] 文件存在且路径正确（`09-PARITY/` 下）。
- [ ] 条目字段完整（§5.2），每条有旧证据原文 + 新检索结论。
- [ ] 判定只使用 §5.3 枚举；统计口径一致。
- [ ] 无 legacy/declaration 作为“支持”证据。
- [ ] 末尾有“覆盖率台账”（已覆盖枚举源 / 未覆盖 / 转交）。
- [ ] 无代码改动、无计划/STATE/ROADMAP 改动、无提交。
- [ ] 文档头记录快照（HEAD、dirty 数、时间）。

**P1：**

- [ ] 6 份文档边界、ID 命名空间、模板、判定枚举、覆盖率模板齐全。
- [ ] 旧枚举源清单与文档映射齐全（§6.1 的 25 项）。
- [ ] 汇总矩阵可自动/手动汇总，不预设结论。

**P2：**

- [ ] 81 怪物模板字段 + 27 特殊属性 + 63 道具 + 224 图块 + 29 楼层字段 + 内容表全部有归属。
- [ ] 每个特殊属性有“旧编号→新编号/无对应”的记录（不要求结论，但必须记录映射）。
- [ ] 数据存档结构差异（旧 `saveMap`/`core.saves` vs 新 `ISaveableContent`）有专门小节。

**P3：**

- [ ] 伤害阶段、临界、光环/支援、地图伤害、减益、事件语义、回放命令全部覆盖。
- [ ] 129 事件语句按“能力类”归并，未逐条抄写但有映射表（旧 type → 新 builtin/无）。
- [ ] 支援递归顺序、连击编号、无敌返回值、临界算法差异有明确记录。

**P4：**

- [ ] 地图图层/图块/材质/autotile/动画/大图/覆盖层/透明度/后处理/天气/字体/布局/视口/缩略图全部覆盖。
- [ ] 旧 Canvas 绘制原语与 `packages/render` 的对应关系有映射表。
- [ ] 天气 5 旧 vs 6 新有差异记录。

**P5：**

- [ ] 29 旧面板 ID 全部有“新屏幕/无对应/部分”的归属。
- [ ] 12 输入动作 + 热键命令表 + 状态栏 12 项全部覆盖。
- [ ] `fly`、`keyBoard`、`gameInfo/help/notes/sync*` 等疑似缺口有明确检索记录。

**P6：**

- [ ] 13 旧插件 + 扩展机制 + loader + 音频 + 存档 + 服务端 + 错误码 + `Mota` + 构建入口全部覆盖。
- [ ] `PAR-UNC-*` 汇总 P2–P5 全部 UNCERTAIN，去重并有确认建议。
- [ ] 总覆盖率台账：25 项枚举源的覆盖状态。

### 7.3 条目量级依据

- 旧引擎公开方法 473 个 + 129 事件语句 + 15 回放动作 + 27 特殊属性 + 29 面板 + 13 插件 ≈ 687 个“原始功能点”。
- 按“同一能力多入口合并、纯展示/纯数据拆分”后，预计 **600–900 条**审计条目：
  - P2 180–260
  - P3 120–180
  - P4 80–130
  - P5 120–180
  - P6 90–140
  - P1 15–30（元条目）
- 该量级适合 6 份文档分载；单份超过 300 条时应拆分小节或再分计划，避免单文档过大。

---

## 8. 风险与未知

| # | 风险 | 影响 | 缓解 |
| --- | --- | --- | --- |
| R1 | **工作树在审计期间持续变动**（HEAD 6cc27b6→ad37186→ca62d28；dirty 57→63→58；legacy 包、`@motajs/types`、`@motajs/client*` 被连续删除） | 结论可能针对旧快照，计划执行时失真；甚至构建会因 import 已删包而失败 | 每份文档头记录 HEAD/dirty/时间；执行前重新快照；以“条目不删只加变更记录”方式维护 |
| R2 | **legacy/兼容包已删除，但 UI 与渲染仍调用全局 `core` 或 import 已删包**（`statusBar.tsx`、`viewmap.tsx`、`statistics.tsx`、`client-base/src/map/renderer.ts:40`、`entry-data/src/mota.ts` 等） | 容易把“UI 显示/编译期 import”误判为新引擎支持；实际核心行为仍依赖 legacy 或处于重构中 | 强制“新包实现锚点”规则；`core.*` 与已删包 import 一律降级/注明瞬时状态 |
| R3 | **旧引擎大量 `eval`/字符串脚本**（`itemEffect`、`useItemEffect`、`canUseItemEffect`、块 `script`、事件 `function`） | 无法逐条穷举行为；新旧“脚本能力”不可直接对等 | 按“能力级”判定（是否支持任意 JS/表达式）；具体内容行为标 UNCERTAIN；在 P2/P3 单列“脚本能力”条目 |
| R4 | **旧 `project/functions.js` 覆盖 29 个方法** | 引擎默认与样板有效行为不同；只看 `libs` 会误判 | 双记录（§6.6）；P3 以 `project/functions.js` 为有效行为主证据 |
| R5 | **特殊属性编号重排**（旧 1..27 vs 新 0..26；4/5/6、7..27 偏移；新 26 为新独有） | 内容迁移/对等判定错位；旧内容直接喂新引擎会语义错误 | P2 建“旧编号→新编号/语义”映射表；P3 按语义判定，禁止按编号对齐 |
| R6 | **新引擎开放钩子/扩展点**（`registerAuraConverter`、`registerFinalEffect`、`registerCommonQueryEffect`、`addPostEffect`、插件 `awake/initialize/afterLoad`） | “能力面”无限，无法穷举所有用户扩展行为 | 审计“引擎提供的扩展点 + 默认实现”，不审计用户自定义扩展；在 P6 说明边界 |
| R7 | **新引擎缺少部分枚举源**（UI 每屏功能点、渲染效果组合、事件语义细节） | 只能启发式审计，易漏 | 用旧枚举源做“必须覆盖清单”；新侧用“文件/组件/方法/命令表”做反向核对；未覆盖项进 UNCERTAIN |
| R8 | **内容 schema 不一致**（`src/content/texture/.list.jsonc` 使用 `type/source/map/width/height`，而 `packages-user/client-modules/src/common.ts` 的 `IClientTextureListConfig` 使用 `read/usage/grid/tiles`） | 可能把“内容未接线”误判为“引擎不支持” | P2/P4 明确区分“引擎能力”与“内容配置/接线”；内容问题只作备注，不单独判 MISSING（除非引擎无对应能力） |
| R9 | **旧文件中文编码在 PowerShell 下乱码** | 误读字段/描述 | 用 Node `fs.readFileSync(...,'utf8')` 读取；以源码原文为准 |
| R10 | **`09-CONTEXT.md` 的旧计划登记已过时**（仍提 legacy 包、任务 1-11） | 误导范围 | 本审计以用户本次口径为准；`09-CONTEXT.md` 只作背景，不作范围依据 |
| R11 | **`src/types/declaration` 是旧 API 镜像，可能已与旧引擎不同步** | 用错“旧 API 存在”证据 | 旧证据优先用 `D:\github\mota-js` 源码；declaration 只作旁证 |
| R12 | **服务端能力整体缺失**（新仓库无 `server.js`/`server.py`） | 存档同步/录像上传/排行/热重载无法对等 | P6 单列“服务端”能力；区分“客户端残留（`sync.php` fetch）”与“服务端实现” |
| R13 | **新引擎未实现升级/技能/状态（buff）等整套系统** | 可能影响大量玩法条目 | P3 单列“缺失系统”；不把“声明/UI 文案”当实现 |
| R14 | **旧引擎 `main.loadList` 顺序影响初始化**（`data` 在 `ui` 前等） | 行为顺序差异可能被忽略 | P6 记录模块初始化顺序与依赖；P2 记录数据加载顺序 |
| R15 | **内容迁移文档（`09-DATA-MIGRATION-AUDIT.md`）不是引擎审计** | 直接引用会混淆“内容已迁移”与“引擎支持” | 仅作线索；每条仍以引擎源码判定 |

---

## 9. 执行注意

1. **只读代码**：`D:\github\mota-js` 与 `D:\github\template` 的源码、配置、内容文件全部只读；不得修改、格式化、重命名、删除。
2. **只写 `09-PARITY/`**：本文件之外，后续只允许在 `.planning/phases/09-minimum-browser-runnable/09-PARITY/` 下新增审计文档；不得写其他目录。
3. **按最新工作树**：每份文档写作前记录 `git rev-parse HEAD`、`git status --porcelain | Measure-Object -Line`、时间；若与上一份不同，在文档头注明并说明是否影响结论。
4. **禁止修改** `.planning/STATE.md`、`.planning/ROADMAP.md`、任何既有 `PLAN.md`/`SUMMARY.md`、任何源码/内容/配置文件；不得新增/修改计划登记。
5. **禁止提交**：不运行 `git add/commit/push/tag` 等写命令；只允许 `git rev-parse`、`git status`、`git log`、`git show` 等只读命令。
6. **禁止把 legacy 当支持**：`packages/legacy-*`、`@motajs/legacy-*`、`packages/client*`、`src/types/declaration/**`、全局 `core.*` 均不得作为“新引擎支持”的证据。
7. **禁止引用旧教学/public**：旧引擎 `public/`、`_docs/`、`docs/`、`_codelab/` 不进入证据；只读 `libs/`、`extensions/`、`project/`、`main.js`、`server.js`、`runtime.d.ts`。
8. **UTF-8 / LF**：审计文档 UTF-8；行尾可用 LF（与既有 phase 文档一致）。旧源码读取用 Node UTF-8，避免 PowerShell 乱码。
9. **命名**：本审计不新增代码命名；如需在文档中提议新接口/字段名，必须先向用户报备并获批准（AGENTS.md）。
10. **计划执行关卡**：任何审计计划执行前，第一个 block 点必须先向用户汇报（做什么/为什么/怎么做/影响范围），等待「可以执行」四个字；未收到前不得执行、不得派发执行子代理。
11. **22:00 规则**：若本机账户为 `LHY/lhy/13194`，每轮子代理执行完毕检查时间；晚于 22:00 停止执行。
12. **禁止 `opencode` 命令**：任何情况下不得调用 `opencode`（含 `opencode run` 等），不得启动额外 opencode 会话。
13. **不写“修复建议”**：审计文档只记录“旧有/新无/差异/不确定”，不写“应该怎么改”“建议新增什么接口”；修复由后续用户派发的任务另行规划。
14. **不做最终对等表**：本文件只做研究盘点；最终逐条对等表在 P2–P6 产出。

---

## 10. 研究结论摘要

1. **旧引擎是一个 1,100+ prototype 方法的单体运行时**：`control` 218、`ui` 187、`maps` 159、`events` 296、`actions` 136 等；其中公开方法 473 个，叠加 129 个事件语句、15 个回放动作、27 个特殊属性、29 个面板 ID、13 个插件，构成约 680+ 个原始功能点。
2. **新引擎是分层强类型架构**：`data-common(L0) → data-base(L1) → data-system(L2) → data-state(L3) → client-base(L4) → client-modules(L5)`，配合 `packages/{render,audio,loader,animate,anon-tokyo,system}` 与 `src/{data,content,client}`；能力边界清晰，但与旧引擎不是一一对应。
3. **最大的结构性差异在事件与回放**：旧 129 个 JSON 事件语句 + 21 字母路线编码 + 15 个回放动作 → 新 7 个事件内建函数 + 8 个回放指令 + 二进制数组；`text/choices/confirm/input/wait/tip/playBgm/saveEquip/fly/shop/random` 等大量旧能力在新枚举中无直接对应。
4. **特殊属性编号整体重排**：旧 1..27（4/5/6 = 2/3/n 连击，25 光环、26 支援、27 捕捉）vs 新 0..26（4 = n 连击，23 光环、24 支援、25 捕捉、26 特殊光环）；按编号对齐会系统性出错，必须按语义建映射。
5. **旧引擎的“有效行为”不等于 `libs` 默认**：`project/functions.js` 覆盖了 29 个方法（events/enemys/actions/control/ui），伤害、临界、光环、支援、状态栏、商店等真实行为都在覆盖层；审计必须双记录。
6. **legacy 已从 HEAD 删除，但 UI 仍大量调用全局 `core`**（`statusBar`、`viewmap`、`statistics` 等）；这会让“看起来有 UI”误判为“新引擎支持”。必须以新包内实现锚点为准。
7. **可穷举性总体良好**：旧侧有 `prototype` 前缀、`_action_*`、`getSpecials`、`blocksInfo`、`floors`、`data.js` 等表；新侧有 `ReplayCode`、`EventTrigger`、`createSpecials`、`registrations`、`ItemCategory`、`TileType`、`ICoreStateFlagConfig`、`logger.json` 等枚举。**半穷举区**是旧道具/图块/楼层字段（无 schema）、旧 `project/functions.js` 覆盖、旧 `eval` 脚本、新开放钩子/后处理。
8. **建议拆分**：P1 index（先做）→ P2 数据/内容 → P3 玩法 → P4 渲染 → P5 UI/输入 → P6 运行时/扩展 + `UNCERTAIN` 汇总；预计 600–900 条，单份 80–260 条。
9. **主要风险**：工作树持续变动、legacy 依赖误判、`eval` 不可穷举、特殊属性编号重排、内容 schema 不一致、服务端整体缺失、升级/技能/状态系统未实现、旧 `core` 无运行时提供者。
10. **结论**：本审计可行，且枚举源足以支撑“防漏”；但必须把“不确定视为不支持”、把“legacy/declaration 不算支持”、把“旧有效行为双记录”三条作为硬规则，否则会产生系统性误判。

---

### 附：本文件引用的关键锚点速查

| 主题 | 旧锚点 | 新锚点 |
| --- | --- | --- |
| 回放注册表 | `libs/control.js:38-52` | `packages-user/data-common/src/replay/types.ts:5-22`；`src/data/replay/initialize.ts:20-43` |
| 路线编码 | `libs/utils.js:524-600`、`603-740` | `packages-user/data-common/src/replay/types.ts:285-302`（参数类型码） |
| 特殊属性表 | `project/functions.js:493-521` | `src/data/enemy/special.ts:84-476` |
| 伤害管线 | `project/functions.js:646-803` | `src/data/enemy/calculator.ts:17-160`；`packages-user/data-system/src/combat/damage.ts` |
| 事件语句 | `libs/events.js:_action_*`（129） | `src/data/event/registrations.ts:9-23`（7） |
| 事件触发器 | `libs/events.js:_sys_*`（8） | `packages-user/data-common/src/event/types.ts:7-30`（11） |
| 图块字段 | `project/maps.js`（224） | `packages-user/data-common/src/store/types.ts:47-68` |
| 楼层字段 | `project/floors/*.js` | `packages-user/data-common/src/store/types.ts:265-276`（仅 5 字段） |
| 道具字段 | `project/items.js`（63） | `packages-user/data-common/src/store/types.ts:130-198` |
| 勇士属性 | `project/data.js:170-198` | `packages-user/data-common/src/types.ts:32-55` |
| 商店 | `project/data.js:559-678` | `src/data/plugin/shop/types.ts` |
| 天气 | `libs/control.js:2701+`（5） | `client-modules/src/render/weather/presets/*`（6） |
| 面板 ID | `libs/{ui,control,actions}.js`（30） | `src/client/ui/*`（20 文件） |
| 插件 | `project/plugins.js`（13） | `src/data/plugin/list.ts`、`src/client/plugin/list.ts`（各 1） |
| 日志 | 无统一码表 | `packages/common/src/logger.json`（308 行） |

---

*Research complete. 本文件仅用于规划拆分，不构成最终审计结论。*

