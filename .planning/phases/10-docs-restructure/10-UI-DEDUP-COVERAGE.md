# UI 文档去重与 mermaid 覆盖清单

> 范围：`docs/advanced/ii/ui/` 下 25 篇为目标文档；本清单只做覆盖判断与图位置标记，不修改任何文档。
> 依据：D-94（先读非目标文档）、D-95（实际使用 mermaid）。本文件为只读调研产物。

## 读取范围（按 D-94 顺序，实际读过的非目标文档）

标注说明：**通读** = 逐段读完；**标题+导语+关键节** = 读完标题结构与导语，并抽读与 UI 相关的关键节（多为数据端领域细节，UI 文档不可能重复）。

### 1. `docs/intermediate/*.md`（24 篇，全部）

| 文档 | 读取程度 | 与 UI 去重相关的要点 |
| --- | --- | --- |
| `code-basics.md` | 通读 | 最小 TS/JS 语法；「示例一律省略 import」的约定（第 87–95 行） |
| `data-vs-render.md` | 通读 | 双端分工 + mermaid 示例（第 17–23 行）；渲染端结构标为「高级教程」预留 |
| `src-tour.md` | 通读 | 三层包与别名（第 7–15 行）、`src/client` 目录（第 29–38 行）、常量与入口 |
| `data-state-overview.md` | 通读 | `state` 来源、常用对象表、L0–L3（第 85–107 行） |
| `hooks.md` | 通读 | 钩子族表、改内置 vs 自写、异步钩子；渲染端提示 `onTip` |
| `events.md` | 通读 | 数据端内建函数、`IBlockEventEnv`、注册流程 |
| `data-plugins.md` | 通读 | `IDataPluginDefine`、三时机、注册列表、可存档 |
| `replay-commands.md` | 通读 | 录像原则、主/被动、装饰器 |
| `map-structure.md` / `map-tiles.md` / `tile-store.md` | 通读 | 楼层/图层/图块数字、zIndex 概念（地图层） |
| `hero-location.md` / `hero-attribute.md` / `hero-items.md` / `hero-equipment.md` | 通读 | 数据端对象入口与修饰器 |
| `flags.md` | 通读 | 全局可存档变量 |
| `combat-overview.md` | 通读 | 战斗流程 + mermaid（第 65–74 行） |
| `enemy-specials.md` / `enemy-aura.md` / `enemy-query.md` / `enemy-calculator.md` / `enemy-map-damage.md` / `enemy-combat-script.md` / `enemy-final.md` / `enemy-status-hooks.md` | 标题+导语+关键节 | 战斗领域细节，与 UI 无交集；确认无需在 UI 重复 |

### 2. `docs/advanced/index.md` + `docs/advanced/i/*.md`（11 篇）

| 文档 | 读取程度 | 要点 |
| --- | --- | --- |
| `advanced/index.md` | 通读 | 三层定位；第 38–39 行明确「高级 II 已收录自定义 UI 与渲染」，且「不重复中级已讲内容」 |
| `i/index.md` | 通读 | 高级 I 九篇地图；渲染端当时「尚未完工」的表述（第 15、75 行） |
| `i/declarative-vs-imperative.md` | 通读 | 声明式/命令式、副作用、扩展点表；「录像只记入口动作」 |
| `i/plugin-system.md` | 通读 | 两端插件、目录与 `list.ts` 注册（第 24–82 行）、三时机与依赖（第 84–265 行）、错误码 76/77/78 |
| `i/hooks-in-depth.md` | 通读 | 一对象一实例、控制器、异步钩子；与 UI 无关 |
| `i/data-stores.md` | 通读 | 五个 Store 读法、运行期只读 |
| `i/saveable-content.md` | 前 80 行 + 标题 | 什么该存/不该存、`ISaveableContent` |
| `i/replay-consistency.md` | 前 60 行 + 标题 | `@shouldReplay`/`@ignoreReplay`，仅数据端 |
| `i/mover.md` | 前 60 行 + 标题 | 移动器模型；渲染端动画标为 TODO |
| `i/face-handler.md` | 前 60 行 + 标题 | 朝向模型；「渲染端读取后完成显示」 |

### 3. `docs/advanced/ii/index.md` + `docs/advanced/ii/*.md`（排除 `ui/`，9 篇）

| 文档 | 读取程度 | 要点 |
| --- | --- | --- |
| `ii/index.md` | 通读 | 第 15、52–54 行：UI 子分组 25 篇，入口 `ui/ui-template.md`，Part 0 不要求高级 I |
| `ii/point-and-tile-events.md` | 通读 | 点事件/图块事件、事件视图、存档 |
| `ii/static-vs-dynamic-tiles.md` | 通读 | 静/动态图块、`keepEvent`、告警 127/128/129 |
| `ii/pathfinding.md` | 前 70 行 + 标题 | 寻路四段 + mermaid（第 29–34 行） |
| `ii/enemy-context-and-combat.md` | 前 80 行 + 标题 | buildup 五段 + mermaid（第 61–69 行） |
| `ii/custom-range.md` | 前 50 行 + 标题 | 范围对象与宿主 |
| `ii/equipment-system.md` | 前 45 行 + 标题 | 装备实例、渲染端动画标为 TODO |
| `ii/custom-replay-command.md` | 前 40 行 + 标题 | 指令码、注册 |
| `ii/adding-hero-attribute.md` / `ii/adding-enemy-attribute.md` | 前 60/40 行 + 标题 | 属性接入链路；「显示」部分留给编辑器与渲染端 |

### 4. `docs/advanced/iii/*.md`（7 篇）

| 文档 | 读取程度 | 要点 |
| --- | --- | --- |
| `iii/index.md` | 通读 | 第 90–96 行明确「本层不覆盖渲染端的结构、动画与输入处理」 |
| `iii/core-state.md` | 通读 | 四层、构造顺序、MainDataPlugin 装配 + mermaid |
| `iii/plugin-internals.md` | 前 70 行 + 标题 | 插件表/依赖图/拓扑序/三阶段 + mermaid |
| `iii/event-system.md` | 通读 | 事件仓库、触发器 11 值、收集/执行 + mermaid |
| `iii/loading-system.md` | 通读 | 加载三阶段、配置、`addCustomContent`；第 283 行说明渲染端可复用加载器追加贴图/音频/动画/字体 |
| `iii/replay-internals.md` | 前 50 行 + 标题 | 录像存储布局 + mermaid |
| `iii/passability-and-pathfinding.md` | 前 50 行 + 标题 | 通行谓词 + mermaid |

### 5. 其它非目标文档

| 文档 | 读取程度 | 要点 |
| --- | --- | --- |
| `docs/poc/render-demo.md` | 通读 | 文档内嵌 demo 的技术验证页，不入导航 |
| `README.md` | 通读 | 仅版本更新记录 |
| `dev.md` | 通读 | 项目结构、开发/构建命令（第 12–37 行）、命名与注释规范、双端分离（第 127–160 行） |
| `AGENTS.md` | 通读 | 流程约束（不改注释、走 GSD、先确认等），不影响内容判断 |

未读：`.planning/`（除写入本文件）、任何 `.ts/.tsx/.vue/.json`、`packages*/`、`src/`、旧文档与旧审阅记录。

## 主题覆盖表

| 主题 | 已覆盖位置 | 已讲到什么 | UI 可能重复页 | 建议 |
| --- | --- | --- | --- | --- |
| 工程命令（安装/开发/文档站） | `dev.md` §开发说明（`pnpm i`、`pnpm dev`）；`dev.md` §构建说明 | 依赖版本、安装与开发、构建与 lint 命令 | `ui-template.md:43`、`inventory-example-1-skeleton.md:47` | 从 UI 删除命令说明，改为「见 dev.md」。`docs:dev` 在 dev.md 中未列，先按待确认项 1 处理 |
| 包分层与别名 | `src-tour.md` §包从哪来（第 7–15 行：`src`→`packages-user`→`packages`，`@user/*`、`@motajs/*`）；`dev.md` §项目结构 | 三层含义、依赖单向、示例 import 照抄 | `ui-template.md:43`（`@motajs/*`→`packages/*/src`） | 删除路径映射式解释；UI 只保留「本篇示例用到的包各自提供什么」，别名规则链接 `src-tour.md` |
| 双端分离（为什么 UI 不进录像） | `data-vs-render.md` 全篇；`declarative-vs-imperative.md` §为什么这样设计；`replay-consistency.md:57` | 数据端算、渲染端画；录像只跑数据端；装饰器仅数据端 | `ui-performance.md` 等未展开，`hotkey-in-ui.md` 也未提 | UI 侧最多一句「UI 与录像无关」，不重述双端模型 |
| 文件放哪 / 如何被加载 | `src-tour.md` §src/client（第 29–38 行）；`plugin-system.md` §注册与目录（第 24–47 行） | `src/client/{entry,initialize,plugin,ui}`；插件放 `plugin/<name>/` 并加入 `list.ts`；无自动扫描 | `ui-template.md` §文件放在哪里（第 153–173 行）；`inventory-example-6` §注册与打开（第 194–224 行）；`replace-builtin-ui.md` §替换步骤 | UI 保留 `src/client/ui/index.ts` 统一出口这一 UI 特有事实；删除重复的「无目录扫描」长段，链接 `src-tour.md` |
| 插件三时机与依赖 | `data-plugins.md` §时机次序；`plugin-system.md` §生命周期/§状态与顺序；`plugin-internals.md` 全篇 | `awake` 同步、`initialize`/`afterLoad` 阻塞；依赖拓扑序；错误码 76/77/78 | UI 文档基本未重复（仅 `ui-template.md:41` 提到包来源） | 不写入 UI；若 UI 需要「UI 是否该做成插件」，一句链接 `plugin-system.md` |
| 数据端 `state` 与 L0–L3 | `data-state-overview.md` §state/L0–L3；`core-state.md` 全篇 | `state` 获取三途径、分层是静态类型叠加、四层构造顺序 | UI 的 `props.state` 是 `IClientCore`，与数据端 `state` 同名不同义 | 不要解释数据端 `state`；UI 必须显式声明「本组分的 `state` 指客户端核心」，避免读者混淆（见待确认项 4） |
| 数据端事件系统 | `events.md`（中级）、`event-system.md`、`point-and-tile-events.md` | 触发器、收集顺序（点事件组整体优先）、执行与折叠 | `events.md`（UI）与 `hotkey-in-ui.md` 讲指针/键盘，不涉及地图事件 | UI 不重述事件系统；仅在 `container-and-coordinates.md` 提「事件层」时用链接（现未提，保持） |
| 地图 zIndex | `map-structure.md` 第 52–53 行（图层 `zIndex` 决定遮挡） | 图层纵深概念 | UI 的 `zIndex` 是渲染树兄弟排序，不是地图图层 | 两处同名不同域，UI 侧不需引用；如需对照，一句脚注 |
| Store（tile/item/map/enemy/event） | `data-stores.md` 全篇；`tile-store.md` | 五表、读法、运行期只读、错误码 133/134/170/181 | UI 文档未涉及 | 不写入 UI |
| 数据端钩子 | `hooks.md` §常用钩子族一览/§异步钩子；`hooks-in-depth.md` | 钩子族、注册/移除、`Promise.all` | `hotkey-in-ui.md` 的「作用域」是另一套机制 | 不写入；若要对比，一句「按键作用域不是数据端钩子」 |
| 存档 / 录像 | `saveable-content.md`、`replay-commands.md`、`replay-consistency.md`、`replay-internals.md` | 存什么、怎么注册、录像格式 | UI 文档未涉及 | 不写入 UI |
| 加载系统 | `loading-system.md` 全篇（第 283 行：渲染端可复用加载器追加贴图/音频/动画/字体）；`data-plugins.md` | 三阶段、`onCoreConfigLoaded`、`addCustomContent`、`getConfig` | `image-and-texture.md` §加载一张 PNG（第 59–107 行）自行 `new Image` 加载 | 保留「素材管理器取纹理」为主路径；手动加载只作为兜底，并链接 `loading-system.md`（见待确认项 7） |
| 性能（引擎级） | `advanced/index.md:39`、`ii/index.md:82`、`iii/index.md:90–96` | 引擎级性能属高级 III；本层不覆盖渲染管线 | `ui-performance.md` 第 3 行已正确链接高级 III | 保留现有边界声明，不重复引擎级内容 |
| 错误码 / 告警 | `plugin-system.md`（76–80）、`event-system.md`（136/171/172）、`data-stores.md`（133/134/170/181）、`static-vs-dynamic-tiles.md`（127–129） | 各系统的错误码语义 | UI 文档只有「告警」字样，无错误码（已检索确认） | UI 不新增错误码表；若需提示「不会报错」，沿用「静默失效」描述 |
| 调试 / 观测 | `ui-performance.md` §观测与验证（第 149–159 行）、§症状与排查（第 161–173 行） | 用浏览器性能面板录帧、做减法定位、一次只改一个开关；按症状查层 | 仅 `ui-performance.md` 自身；全站无独立调试篇 | 保留此两节即可，不新增 devtools/日志章节（与 UI 教程职责不符） |
| 渲染树 / 元素树 | 仅 UI 子分组；`advanced/iii/index.md:90–96` 明确排除渲染端 | 画布根 → UI 容器 → 面板根 → 子元素；组件树与元素树两层 | `ui-template.md` §这份模板在渲染树里的位置（第 79–103 行）、`container-and-coordinates.md` §渲染树（第 11–36 行）、`component-tsx.md` §组件如何映射成一棵子树（第 5–40 行）、`inventory-example-1` §骨架在渲染树里的位置（第 19–49 行） | **四处重复**。保留 `container-and-coordinates.md` 为权威（含职责与缓存边界），其余改为一句 + 链接；`component-tsx` 只保留「组件树 vs 元素树」差异 |
| Vue 响应式 / 组件 | 仅 UI 子分组；`code-basics.md` 只讲 TS 语法 | `ref/reactive/computed/watch/nextTick/shallowRef/markRaw`；组件结构、生命周期 | `reactivity.md` 全篇；`component-tsx.md` §生命周期（第 211–268 行）；`props.md` §props 不是响应式的（第 256–279 行）；`slots-and-attrs.md` 第 59–61 行（泛型顺序） | 权威分工：`reactivity.md`（响应式）、`props.md`（参数管线）、`component-tsx.md`（组件结构/生命周期）、`slots-and-attrs.md`（slot/attrs）。删除 `props.md` 与 `reactivity.md` 的「不要解构」双写、`component-tsx` 与 `slots-and-attrs` 的泛型顺序双写 |
| 事件命中 / 捕获冒泡 | `events.md`（UI）；`container-and-coordinates.md` §事件在嵌套容器中的路径；`ui-template.md` §事件从哪里进入 | 命中规则 5 条、捕获/冒泡顺序、`stopPropagation`、`enter/leave` 集合差、事件对象字段、`offset` vs `absolute` | `events.md` 第 5–24、44–51、130–151、153–166 行；`container-and-coordinates.md` 第 56–68 行；`ui-template.md` 第 105–111 行；`layer-transform-performance.md` §事件坐标与变换（第 149–179 行）；`ui-performance.md` §命中与事件（第 122–136 行） | 权威 = `events.md`。`container` 只留「路径三段」摘要 + 链接；`ui-template` 删除整段；`layer-transform` 删除「事件坐标」整节（与 `events.md` §事件对象/§事件坐标重复）；`ui-performance` 只留「遍历成本」一句 + 链接 |
| zIndex / 层叠 | `events.md` §命中测试、`layer-transform-performance.md` §渲染树、层级与绘制顺序、`container-and-coordinates.md` §层级、`basic-shapes.md:9`、`inventory-example-1:49` | 绘制小→大、命中大→小、同值按插入顺序、只在同父级比较、父级带整棵子树比较 | 五处以上重复；另 `ui-controller-and-stack.md` §事件归属（第 222 行）说「栈内 `i*5`」 | 权威 = `layer-transform-performance.md`（规则）+ `ui-controller`（栈的 `i*5` 特例）。`basic-shapes`、`inventory-1` 删除；`container` 保留一句；`events` 保留「命中规则」角度 |
| `hidden` vs 三元 | `conditional-and-list-rendering.md` §条件渲染改的是树（第 5–41 行）；`layer-transform-performance.md` §显示开关（第 72–116 行）；`ui-performance.md` §显示开关（第 69–97 行）；`container-and-coordinates.md` 第 91 行 | 语义差别、何时用哪个、对状态/缓存的影响 | 四页各有一份近乎相同的说明与表格（`layer-transform` 与 `ui-performance` 的「四种情况」列表基本逐字相同） | 权威 = `conditional-and-list-rendering.md`（语义与选型表）；`layer-transform` 只留「与缓存的关系」；`ui-performance` 删除重复列表，改为一句 + 链接；`container` 保留一句 |
| 缓存 / 脏更新 / `hd` `anti` | `layer-transform-performance.md` §缓存与脏更新（第 118–147 行）；`ui-performance.md` §缓存（第 22–67 行）；`container-and-coordinates.md` §生命周期与缓存（第 70–91 行）；`image-and-texture.md` §像素图与高清缓存（第 121–138 行） | 默认缓存标签、`nocache` 优先级、脏标记向上冒泡、`custom` 需手动触发、`hd` 仅对缓存生效 | 机制段在 `layer-transform` 与 `container` 重复；策略段在 `ui-performance` 与 `layer-transform` 重复 | 权威 = `layer-transform`（机制）；`ui-performance` 只保留「何时值得开」与排查表；`container` 删除机制段；`image` 保留像素图特例（`noanti`/整数倍） |
| `noevent` / `actionStroke` / `cursor` | `events.md` §noevent/§cursor/§actionStroke；`layer-transform-performance.md` §noevent（第 181–206 行）；`container-and-coordinates.md` 第 66 行；`ui-performance.md` §命中与事件；`inventory-example-5` §按钮的 noevent（第 303 行） | 可见但不命中、整子树生效、描边热区 = `lineWidth`、`cursor` 随命中失效 | `noevent` 在 5 页出现，`layer-transform` 整节与 `events.md` 整节重复 | 权威 = `events.md`。`layer-transform` 删除整节；`ui-performance` 保留性能视角一句；示例页保留各 1–2 行用法 |
| UI 系统（GameUI/控制器/实例/栈） | 仅 UI 子分组 | 四层对象、栈、背景四名、策略、`keep`、`active`/`showBack`、场景 vs 主 UI | 权威 `ui-controller-and-stack.md`；重复：`ui-template.md` §三个基础 props/§打开与关闭、`inventory-example-1` §打开、`inventory-example-6` §注册与打开、`replace-builtin-ui.md` 第 9–16 行 | 保留 `ui-controller` 全篇；`ui-template` 只留「三个 props 必须列全」与三入口一行；示例页各保留 3–5 行；「`GameUI` 名字不参与查找」只留一处（建议 `ui-controller` 或 `ui-template`），其余链接 |
| 图片 / 纹理 | 仅 UI 子分组；`loading-system.md` 只有渲染端素材一句话 | 纹理 = 可绘制图像源、`Texture` 构造、素材管理器、像素图清晰度、图片作为零件 | 权威 `image-and-texture.md`；`ui-performance.md` §纹理与文字（第 138–147 行）与其重复约三成 | `ui-performance` 保留「开销与释放时机」角度，删除「怎么建纹理」的复述 |
| 按键 / 快捷键 | 仅 UI 子分组 | 两条路径、指令/作用域/实现、`useKey`/`implement`、`HotkeyEmitMode`、优先级、栈关系、默认键 | 权威 `hotkey-in-ui.md`；`events.md` 与之仅概念对照 | 保留；把「按键不是元素事件」压缩为 3–5 行并链接 `events.md` |
| 替换内置 UI | 仅 UI 子分组 | 入口替换 vs 包装层、每类界面必须保留的语义 | 权威 `replace-builtin-ui.md`；`ui-template`/`inventory-6` 重复「`GameUI` 不参与查找」 | 保留；删除 `ui-template:151`、`inventory-6:222` 的重复段落，改为链接 |
| 术语（`loc`/锚点/props/attrs/slot/`state`） | `container-and-coordinates.md` §loc 与锚点；`props.md`；`slots-and-attrs.md` | `loc` 六元组、`anc`、默认 200×200、props 管线、attrs 透传 | `ui-template.md` 第 71–77 行复述 `loc` 与三种元素；`component-tsx` 复述 props 泛型；`basic-shapes`/`text` 复述「TSX 内置注册 vs 元素层 import」 | `loc` 权威在 `container`；`ui-template` 只留一句；「TSX 标签无需 import、元素层需要」只在 `ui-template` 说明一次，其余页面不再解释 |

## 明确不应写进 UI 教程的内容（含依据）

| 内容 | 出现位置 | 依据（已有覆盖） | 处理建议 |
| --- | --- | --- | --- |
| `pnpm install` / `pnpm dev` / `pnpm docs:dev` 的操作步骤 | `ui-template.md:43`、`inventory-example-1-skeleton.md:47` | `dev.md` §开发说明已给安装与开发命令；`dev.md` §构建说明给构建/lint 命令。工程命令属项目级信息，与「怎么写 UI」无关 | 删除，改为「环境准备见 dev.md」 |
| `@motajs/*`、`@user/*` 的路径映射与三层依赖解释 | `ui-template.md:43` | `src-tour.md` §包从哪来（第 7–15 行）已讲清三层、包名与单向依赖；`dev.md` §项目结构同义 | 删除路径映射；保留「本篇用到哪几个包、各提供什么」的 UI 相关映射 |
| 「渲染端尚未完工/高级 I 只写数据端」的历史叙述 | 非 UI 文档（`i/index.md:15`）；UI 文档已按完工口径写 | 与 UI 现状不一致，且属层级导览信息 | 不写进 UI；若需提示范围，以 `ii/index.md` 的 UI 子分组说明为准 |
| 数据端插件三时机、依赖拓扑、注册表错误码 | 无 UI 重复；`ui-template.md:41` 仅提包名 | `plugin-system.md` §生命周期/§状态与顺序、`plugin-internals.md` 全篇 | 不写进 UI；需要时一句链接 |
| 加载阶段、`getConfig`、`addCustomContent` 的用法 | `image-and-texture.md` 未展开（仅第 117 行声明不展开） | `loading-system.md` 全篇 | 保持「不展开」；只链接 |
| Store 的运行期只读规则与错误码 | 无 | `data-stores.md` §为什么运行期只读 | 不写进 UI |
| 数据端事件触发器、收集顺序、事件 id 注册 | 无 | `event-system.md`、`point-and-tile-events.md` | 不写进 UI；`events.md`（UI）已用「元素事件」区分 |
| 存档 `saveState`/`loadState` 约束、录像一致性 | 无 | `saveable-content.md`、`replay-consistency.md` | 不写进 UI；「UI 不参与录像」一句即可 |
| 引擎级渲染管线、批处理、帧预算 | `ui-performance.md:3` 已声明不覆盖 | `advanced/index.md:39`、`iii/index.md:90–96` | 保持现有边界声明 |
| 编辑器 / 素材配置的制作流程 | `image-and-texture.md:117` 已声明不展开 | `ii/index.md:81`、`adding-hero-attribute.md:15` 均把编辑器归到对应端 | 保持；素材只讲「怎么取、怎么用」 |
| 地图图层 `zIndex` 与图块绘制 | 无 UI 重复 | `map-structure.md:52–53` | 不写进 UI；UI 的 `zIndex` 只讲渲染树兄弟 |
| 通用 TS/JS 语法与「示例省略 import」约定 | 无 UI 重复（UI 示例均带 import） | `code-basics.md` §照抄教程里的代码时 | 不写进 UI；UI 示例已自包含 import，符合其自身需要 |

## UI 层必须保留的内容（引擎层没讲、或 UI 特有）

| 必须保留 | 理由（覆盖缺口） |
| --- | --- |
| 渲染树三层：画布根 → UI 容器 → 面板根；组件树 vs 元素树 | `advanced/iii/index.md:90–96` 明确不覆盖渲染端结构；`data-vs-render.md` 只讲双端分工。这是全站唯一出处 |
| `loc` 六元组、`anc`、锚点、默认 200×200、局部坐标系与变换复合 | 无其它文档覆盖；且是 UI 报错高发点 |
| `zIndex` 仅同父级比较、父级带整棵子树参与排序、绘制与命中顺序相反 | 数据端 `zIndex`（`map-structure.md`）是图层纵深，语义不同，不能替代 |
| 命中测试规则、`hidden`/`noevent`/`actionStroke`/`cursor` 的行为差异 | 引擎层文档不涉及画布命中 |
| 捕获/冒泡、`stopPropagation` 边界、`enter`/`leave` 的悬停集合差、事件对象字段与 `offset` vs `absolute` | 数据端事件系统是脚本触发模型，与指针事件无关 |
| 缓存机制（默认缓存标签、`nocache` 优先级、脏标记上冒、`custom` 需手动触发）与性能取舍 | 仅 UI 子分组；`advanced/iii` 只讲引擎级性能 |
| TSX + Vue 在画布上的用法：`ref/reactive/computed/watch/nextTick`、`shallowRef`/`markRaw`、模板指令不适用、`v-model:xxx` 的写法 | `code-basics.md` 只讲 TS 语法，不含 Vue |
| 组件结构：`defineComponent` 泛型、`SetupComponentOptions`、`emits`/`expose`、生命周期与清理边界 | UI 特有框架约定 |
| props 管线（父属性 → VNode props → `props` 数组 → setup；未声明进 `attrs`）、默认值写法、`props` 不解构 | UI 特有；`attrs` 透传是框架行为 |
| slot（函数而非标签、具名对象形式、作用域 slot 类型）与 `inheritAttrs` | UI 特有 |
| `GameUI`/`UIController`/`UIInstance`/`UIContainer` 四层、栈与 `i*5`、背景四名、`keep`、`active`/`showBack`、`lastOnly`/`showAll`/自定义策略、场景 vs 主 UI | 全站唯一出处；`plugin-system.md` 只讲插件，不涉及 UI 栈 |
| `setPropsBaseCreator` / `createPropsBase` 与 `state` 的 `markRaw` | UI 特有注入链 |
| 内置组件：`List`/`ListPage`/`Page`/`Scroll`/`Selection`/`ConfirmBox`/`Choices`/`InputBox`、`TextContent`/`Textbox`/`Input` | 全站唯一出处 |
| 图片与纹理：`Texture` 构造、素材管理器 `getImageByAlias`/`getImage`、`noanti`/`hd`/整数倍缩放 | 全站唯一出处；`loading-system.md` 只说明渲染端可追加素材 |
| 按键作用域：`useKey`/`implement`/`registerCommand`/`HotkeyEmitMode`/优先级与栈关系/默认键 | 全站唯一出处；`hotkey-in-ui.md:243–245` 已说明无 live 示例 |
| 替换内置 UI 的两个替换点与「必须保留的结果语义」 | 全站唯一出处 |
| UI 性能六层定位、`Scroll` 平铺约束、观测流程 | UI 特有；与引擎级性能边界已在 `ui-performance.md:3` 划清 |

## mermaid 图位置表

**现状**：25 篇 UI 文档中 **0 个 mermaid 图**（已检索 `` ```mermaid ``，全站 11 处均在非 UI 文档）。UI 文档现有 **12 处 `` ```text `` 树/流程块**，是最该替换为 mermaid 的位置。

**既有风格参照**（保持一致）：`data-vs-render.md:17–23`（`graph LR`）、`combat-overview.md:65–74`（`graph TD` + 决策边标签）、`pathfinding.md:29–34`（`flowchart LR`）、`enemy-context-and-combat.md:61–69`（`graph TD`）、`iii/event-system.md:17–26`（`flowchart TD` + `{决策}` + `<br/>`）、`iii/loading-system.md:21–27、96–103`（`flowchart TD`）、`iii/plugin-internals.md:17–25`、`iii/core-state.md:16–21`、`iii/replay-internals.md:19–31`、`iii/passability-and-pathfinding.md:18–30`。

| UI 页面 | 小节 | 建议图类型 | 图要回答的问题 |
| --- | --- | --- | --- |
| `ui-template.md` | §这份模板在渲染树里的位置（现 `` ```text ``，第 87–93 行） | `flowchart TD` | 一个面板从画布根到 `g-rect`/`text` 到底挂在哪几层；哪层由控制器创建、哪层由作者写 |
| `ui-template.md` | §事件从哪里进入（第 105–111 行） | `flowchart TD` 或删除改链接 | 一次点击从画布根到面板内的路径；与 `events.md` 重复时以链接替代 |
| `container-and-coordinates.md` | §渲染树：根、容器与子元素（现 `` ```text ``，第 15–24 行） | `flowchart TD` | 容器三个职责（坐标系/捕获单位/缓存边界）分别落在树的哪个位置 |
| `container-and-coordinates.md` | §坐标与变换如何沿树传递（第 38–54 行） | `flowchart LR` | 父级平移/缩放/旋转如何复合到子级坐标；锚点在其中的位置 |
| `container-and-coordinates.md` | §事件在嵌套容器中的路径（第 56–68 行） | `sequenceDiagram` | 命中 → 捕获（根→子）→ 冒泡（子→根）的参与者顺序；`stopPropagation` 截断点 |
| `events.md` | §命中测试（第 5–24 行） | `flowchart TD` + 决策节点 | 指针落点如何逐层筛到最上层元素；`zIndex`/插入顺序/`hidden`/`noevent` 在哪一步生效 |
| `events.md` | §捕获与冒泡（第 44–51 行，三层例子） | `sequenceDiagram` | 根捕获→面板捕获→按钮捕获→按钮冒泡→面板冒泡→根冒泡的完整时序 |
| `events.md` | §enter 与 leave 不走普通冒泡（第 153–166 行） | `flowchart TD` | 悬停集合如何生成、比较、差集触发 `leave`/`enter`；为何父级不闪 |
| `events.md` | §事件对象 / §事件坐标与变换（第 168–242 行） | `flowchart LR` | 画布坐标 `absoluteX` 如何逆变换成各层 `offsetX`；为何父子数值不同 |
| `layer-transform-performance.md` | §渲染树、层级与绘制顺序（第 5–18 行） | `flowchart LR` | 绘制顺序（小→大）与命中顺序（大→小）为何相反；同值时的插入顺序 |
| `layer-transform-performance.md` | §缓存与脏更新（第 118–147 行） | `flowchart TD` | 属性变化 → 标脏 → 沿父链上冒 → 父缓存重画；`custom` 手动触发在哪一步 |
| `ui-controller-and-stack.md` | §控制器、实例与栈（第 5–42 行） | `classDiagram` | `GameUI`/`UIController`/`UIInstance`/`UIContainer` 的持有与创建关系 |
| `ui-controller-and-stack.md` | §背景的四个名字（第 82–109 行） | `flowchart LR` | 用户设置（`showBackground`/`hideBackground`）与系统需求如何合成为 `showBack` |
| `ui-controller-and-stack.md` | §栈策略（第 111–177 行） | `stateDiagram-v2` | `open`/`close`/`hide`/`show` 在 `lastOnly` 与 `showAll` 下如何改变实例可见状态 |
| `ui-controller-and-stack.md` | §打开与关闭的完整例子（第 242–303 行） | `sequenceDiagram` | 工具栏 → 设置面板 → 确认框 → 逐层关闭的调用顺序与栈变化 |
| `component-tsx.md` | §组件如何映射成一棵子树（第 5–40 行） | `flowchart TD` | 组件树（Panel→Badge）与元素树（container 嵌套）的对应关系；组件边界为何不可见 |
| `component-tsx.md` | §生命周期与渲染树（第 211–218 行） | `stateDiagram-v2` | `setup` → 挂载 → 更新（patch）→ 卸载的迁移；哪些操作会触发卸载 |
| `reactivity.md` | §数据变化如何走到渲染树（第 7–19 行） | `flowchart LR` | 数据（ref/reactive）→ 组件重渲染 → VNode diff → 元素属性 → 绘制，五步各自粒度 |
| `reactivity.md` | §什么时候会重渲染、什么时候不会（第 168–186 行） | `flowchart TD` + 决策节点 | 一次数据变化是否会触发重渲染（是否被渲染函数读过、是否响应式、是否 `shallowRef`） |
| `props.md` | §props 的完整管线（第 7–18 行） | `flowchart LR` | 父组件属性 → VNode props → `props` 数组筛选 → setup；未声明键分流到 `attrs` |
| `slots-and-attrs.md` | §slots/attrs 与渲染树（第 254–342 行） | `flowchart TD` | slot 内容插入到子组件哪个位置；`attrs` 透传到根元素还是被 `inheritAttrs` 截断 |
| `conditional-and-list-rendering.md` | §条件/列表的树形示意（第 221–309 行） | `flowchart TD` | 同一棵树上 `hidden`、三元、`map`+`key` 三种更新的差异落点 |
| `basic-shapes.md` | §填充、描边与命中（第 98–166 行） | `flowchart TD` + 决策节点 | `fill`/`stroke`/`strokeAndFill` 各自命中哪里；`actionStroke` 如何收窄到描边 |
| `curves-and-paths.md` | §路径在渲染树与命中中的位置（第 104–117 行） | `flowchart LR` | 路径如何按几何命中；为何宽高不裁剪路径；`actionStroke` 的效果 |
| `text.md` | §尺寸与测量（第 98–129 行） | `flowchart LR` | 内容/字体/描边宽度如何决定测量尺寸，测量尺寸如何成为命中矩形 |
| `image-and-texture.md` | §纹理从哪里来（第 21–119 行） | `flowchart LR` | 图像源（canvas/ImageBitmap/HTMLImageElement）→ `Texture` → `image` 元素 → 拉伸绘制 |
| `image-and-texture.md` | §像素图与高清缓存（第 121–138 行） | `flowchart TD` + 决策节点 | `noanti`/`anti`/`hd`/`cache` 四开关谁能真正改善像素图；为何 `image` 默认不缓存时 `hd={false}` 无效 |
| `builtin-list-and-containers.md` | §组合示例与树形解释（第 345–431 行） | `flowchart TD` | `ListPage` → `List` → `Scroll` → 行、`Page` → 内容/页码条、弹窗另起树，三者归属 |
| `builtin-list-and-containers.md` | §列表、滚动、分页、弹窗各自解决什么（第 7–20 行） | `flowchart TD` + 决策节点 | 按需求（选一个/左右详情/超视口/翻页/弹一次）该选哪个组件 |
| `builtin-text-and-input.md` | §输入组件的受控边界（第 232–332 行） | `stateDiagram-v2` | `Input` 的值副本、覆盖输入框、失焦、确认/取消的状态迁移 |
| `replace-builtin-ui.md` | §替换的是入口，不是实现（第 7–36 行） | `flowchart LR` | 打开处替换与包装层替换两条路径；哪些调用方会被一起换掉 |
| `replace-builtin-ui.md` | §替换步骤（第 55–142 行） | `flowchart TD` | 找打开点 → 新建 UI → 保留 props/语义 → 验证的顺序与回退点 |
| `hotkey-in-ui.md` | §按键与元素事件是两条路径（第 7–16 行） | `flowchart LR` | 指针事件（命中→捕获→冒泡）与键盘事件（匹配指令→作用域）如何分流 |
| `hotkey-in-ui.md` | §按键与 UI 栈的关系（第 214–225 行） | `stateDiagram-v2` | 面板 A 打开 → B 打开（B 在栈顶）→ B 关闭 → A 恢复的按键归属变化 |
| `inventory-example-1-skeleton.md` | §骨架在渲染树里的位置（现 `` ```text ``，第 23–33 行） | `flowchart TD` | 720×480 面板里五个区域各挂在哪一层、谁是兄弟 |
| `inventory-example-1-skeleton.md` | §打开、状态与关闭归谁（第 69–90 行） | `flowchart LR` | `open` 产生实例、`props.instance` 回到控制器、状态归面板的归属关系 |
| `inventory-example-2-grid.md` | §从占位到网格（现 `` ```text ``，第 9–16 行） | `flowchart TD` | 左侧区域 → `ItemGrid` → `ItemCell` 的层级与坐标相对谁 |
| `inventory-example-2-grid.md` | §点击如何上报（现 `` ```text ``，第 255–261 行） | `sequenceDiagram` | `ItemCell` → `ItemGrid` → `InventoryPanel` 的 emit 链与重渲染 |
| `inventory-example-3-detail.md` | §详情区的树结构（现 `` ```text ``，第 29–40 行） | `flowchart TD` | 详情根内四块（标题/未选中提示/内容/取消按钮）与两个 `hidden` 分支 |
| `inventory-example-3-detail.md` | §选中态与两个隐藏分支（现 `` ```text ``，第 147–152 行） | `stateDiagram-v2` | 「未选中 ↔ 已选中」两态及各自可见子树 |
| `inventory-example-4-scroll.md` | §Scroll 在渲染树里的位置（现 `` ```text ``，第 25–36 行） | `flowchart TD` | 视口、行容器、两个按钮的位置关系；为何行必须是 `Scroll` 直接子元素 |
| `inventory-example-4-scroll.md` | §数据与选中态如何穿过滚动层（第 46–110 行） | `flowchart LR` | `items`/`selectedId` 从面板到 `ItemGrid` 到 `ItemCell` 的传递，`Scroll` 为何不持有数据 |
| `inventory-example-5-state.md` | §操作条的树与事件流（现 `` ```text ``，第 21–28 行） | `flowchart TD` + `sequenceDiagram` | `ActionBar` 三个按钮的树位置；按钮 → `ActionBar` → 面板的事件方向 |
| `inventory-example-5-state.md` | §状态变化如何反映到画面（现 `` ```text ``，第 168–174 行） | `flowchart LR` | 装备/使用/提示三条状态链各自改到树上哪一处 |
| `inventory-example-5-state.md` | §关闭的完整路径（现 `` ```text ``，第 184–192 行） | `flowchart TD` | 三个关闭入口如何汇到 `controller.close(instance)` 并卸载子树 |
| `inventory-example-6-animation-and-register.md` | §注册与打开（第 194–224 行） | `sequenceDiagram` | `GameUI` 对象 → `open` → 实例 → `close` 的调用链；`keep` 在切换中的位置 |
| `inventory-example-6-animation-and-register.md` | §最后一步要收什么（现 `` ```text ``，第 9–18 行） | 保留 `` ```text `` | 这是目录树，不是数据流；mermaid 反而更差，建议不替换 |

**结论**：D-95 落地时，至少覆盖以下 8 个「主图」：渲染树（`container-and-coordinates`）、命中规则（`events`）、捕获/冒泡时序（`events`）、缓存脏更新（`layer-transform-performance`）、UI 栈与实例关系（`ui-controller-and-stack`）、组件↔元素映射（`component-tsx`）、响应式五步（`reactivity`）、props 管线（`props`）。其余为按页补的局部图。

## 待确认项（只列问题，不下结论）

1. `pnpm docs:dev` 在 `dev.md` 中不存在（`dev.md` 只有 `pnpm i`、`pnpm dev` 与构建/lint 命令）。它是否是真实存在的脚本？若存在，命令说明的唯一归属应是 `dev.md` 还是保留在 `ui-template.md`？（本次未读 `package.json`，无法确认）
2. `ui-template.md:43` 写的别名映射（`@motajs/*` → `packages/*/src`、`@user/*` → `packages-user/*/src`）在 `src-tour.md` 与 `dev.md` 中都没有逐字出现；这属于构建配置细节。它应归入 `dev.md`、归入 `src-tour.md`，还是允许 UI 首篇保留一行？
3. `inventory-example-1-skeleton.md:47` 交叉引用「第 1 篇「工程与命令」」，但 `ui-template.md` 没有名为「工程与命令」的小节（命令只出现在第 43 行的段落里）。是补小节名，还是删除该引用？
4. UI 文档的 `state` 指 `IClientCore`（如 `props.state.mainUIController`），数据端文档的 `state` 指 `ICoreState`。是否需要在 UI 首篇显式声明这一同名不同义，或统一改称（如 `clientState`）？
5. `dev.md:138–143` 说渲染端分 `@user/client-base`（系统层）与 `@user/client-modules`（实现层）；UI 文档示例还使用 `@motajs/system`、`@motajs/render-vue`、`@motajs/render`。哪些包属于作者应直接依赖的稳定 API，哪些只应在内部出现？教程是否应统一 import 来源？
6. 「`GameUI` 的名字不参与查找、打开/关闭/栈比较都用对象或实例」在 `ui-template.md:151`、`ui-controller-and-stack.md:333`、`inventory-example-6:222`、`replace-builtin-ui.md:16` 四处出现。应保留在哪一篇作为唯一权威？
7. `image-and-texture.md` §加载一张 PNG 示范手动 `new Image` + `onload`，同一篇第 117 行又说「素材由编辑器维护，正文只负责使用已登记素材」；`loading-system.md:283` 又说渲染端可复用加载器追加贴图。教程是否允许示范手动加载？还是只保留素材管理器路径、手动加载降为脚注？
8. 渲染树/元素树目前分散在 `ui-template`、`container-and-coordinates`、`component-tsx`、`inventory-example-1` 四处。是否把 `container-and-coordinates.md` 定为唯一权威（其余链接），还是在 UI 子分组内单列一篇「渲染树」？（本次不新增/删除页面，仅提问）
9. D-95 的 mermaid 是否要求「凡 `` ```text `` 树/流程块一律替换」？目录树（`inventory-example-6` 第 9–18 行）与纯坐标清单是否属于例外？
10. `layer-transform-performance.md`（第 72–147 行）与 `ui-performance.md`（第 22–97 行）的 `hidden`/缓存内容大面积重合，且两处「四种情况」列表几乎逐字相同。是合并到机制篇（`layer-transform`）+ 策略篇（`ui-performance`）各留一半，还是保留双份但互相链接？

## 声明

未读源码：是（未读任何 `.ts/.tsx/.vue/.json`、`packages*/`、`src/`；仅读 Markdown）

未修改任何文档：是（本文件之外未写入 `docs/`，未运行 `docs:dev`，未 commit）
