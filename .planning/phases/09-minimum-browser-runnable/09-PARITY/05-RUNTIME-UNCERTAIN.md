# 05 运行时与无法确认项

> 本文件是 09-PARITY 的最后一册，覆盖运行时、扩展、资源加载、音频、存档、服务端、日志、入口与回放播放控制。
> 旧样板是唯一清单来源；每一行先写旧样板的可观察能力，再按三值判定新样板能否用现有接口简单组合出来。
> 只写静态源码对照，不写修复建议，不启动浏览器，不修改源码、配置、内容、`STATE.md`、`ROADMAP.md` 与既有计划或摘要。

## 0. 快照

| 项 | 值 |
| --- | --- |
| 旧样板根目录 / 分支 | `D:/github/mota-js` / `master` |
| 旧样板 HEAD | `3efb548e407ad2b8007b498cb98401e2012a0b55` |
| 旧样板工作树 | 干净（0 行） |
| 新样板根目录 / 分支 | `D:/github/template` / `refine/data-client` |
| 新样板 HEAD | `5af3ab378b4d65dc5cf1fbcb621fd9a776608dd7` |
| 新样板工作树 | 164 行改动（含用户并发编辑，未触碰、未回滚） |
| 采样时间 | `2026-11-04 14:25`（UTC+8） |
| 与旧版对照 | 旧 HEAD 与工作树不变；新 HEAD 与工作树按本次采样记录，只用于定位本文档对应的版本 |

## 1. 阅读口径与覆盖来源

判定只有三个值。支持：通过现有新样板接口、标签或组件，以组合、配置或简单映射实现，不需要复杂逻辑或算法，也不需要直接调用底层接口。部分支持：核心能力已经存在，但需要适配，或只覆盖旧样板行为的一部分。不支持：没有等价能力，或需要自行实现复杂逻辑、算法，或直接调用底层接口。

现有接口无法确认可以简单实现时，一律判不支持，并在「差异 / 说明」列写明已经检索的范围和无法确认的原因。插件与 loader 的判定只看旧能力能否落到新插件生命周期、公开系统接口、加载器与音频接口上，不因为新样板「也有插件系统」就整体判支持。

覆盖来源按人读方式列出。旧枚举源 1（`control.prototype` 的 124 个公开方法）中与运行时相关的音频、存档、回放子集，分别落在本文件 §5、§6、§10。旧枚举源 18（`project/plugins.js` 的 13 个顶层函数）落在 §2，逐项覆盖。旧枚举源 25（`runtime.d.ts` 的 12 个声明类）只作旧 API 旁证，不单独判定，相关能力随对应行说明。另补三类旧源码清单：`libs/loader.js` 的 31 个方法（§4）、`libs/extensions.js` 与 `extensions/*.js` 的扩展机制（§3）、`server.js` 与 `server.py` 的服务端能力（§7），以及 `main.js` 与 `index.html` 的入口能力（§9）。其余 25 项台账来源归 01 至 04 分册，本文件不重复判定。

## 2. 插件系统

旧插件是任意对象挂载：`core._init_plugins` 创建对象后把 `project/plugins.js` 的顶层函数 `apply(core.plugin)`（`libs/core.js:490`），插件之间没有显式依赖，初始化顺序就是对象键顺序。新插件是强类型生命周期加依赖拓扑：`IDataPluginDefine` 定义 `awake`、`initialize`、`afterLoad` 三个阶段（`packages-user/data-state/src/types.ts:39`），`orderPlugins` 负责拓扑排序并检测依赖环与缺失依赖（`packages-user/data-state/src/plugin.ts:20`）。当前实际注册的插件只有 `DataShopPlugin` 与 `ClientShopPlugin`，但插件接口本身允许新增插件，因此逐项判定看的是旧能力能否由插件生命周期或公开接口简单组合。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 插件初始化钩子 | 在所有资源加载后、游戏开始前执行 `_afterLoadResources`（`project/plugins.js:4`） | 支持 | `packages-user/data-state/src/types.ts:39` 的 `IDataPluginDefine` 提供 `afterLoad` 阶段 | 旧按对象键顺序执行，新按依赖拓扑排序，时序语义等价 |
| 2 | 灯光与漆黑层 | 铺黑色半透明层并用 `destination-out` 挖圆形灯光（`project/plugins.js:9`） | 不支持 | 无默认灯光层，`packages-user/client-base/src/map/renderer.ts:319` 的 `addPostEffect` 只是扩展点 | 需自行实现合成，属于直接底层绘制 |
| 3 | 全局商店 | 事件选项加 `need` 表达式打开商店（`project/plugins.js:70`） | 部分支持 | `src/data/plugin/list.ts:5` 的 `DataShopPlugin` 与 `src/client/plugin/list.ts:5` 的 `ClientShopPlugin` 提供库存买卖 | 旧事件选项与 `need` 脚本模型无对应 |
| 4 | 分区删除楼层地图 | 高层塔按分区删图，不入存档、不可浏览或飞行（`project/plugins.js:265`） | 不支持 | 无运行时删楼层接口，地图内容由内容表加载 | 旧按分区动态裁剪并隔离存档与浏览，需自行实现复杂状态处理 |
| 5 | 五图层模式 | 启用 `bg2` 与 `fg2` 两层，共五图层（`project/plugins.js:352`） | 支持 | `packages-user/data-state/src/shared.ts:13` 已内置 bg、bg2、fg、fg2 五层纵深 | 旧需插件开启，新默认具备五图层 |
| 6 | 道具商店事件块 | `item` 为 true 加 `choices` 的道具买卖（`project/plugins.js:506`） | 部分支持 | `src/data/plugin/shop/types.ts:18` 的道具买卖字段覆盖库存交易 | 新无事件块与回收脚本入口 |
| 7 | 怪物境界显示 | 怪物手册显示怪物境界（`project/plugins.js:812`） | 不支持 | 无境界或等级显示字段与手册扩展点 | 旧插件在怪物手册追加境界，新需自定义渲染与数据扩展 |
| 8 | 多角色 | 多角色初始数据与切换（`project/plugins.js:898`） | 不支持 | 无多角色数据与切换接口 | 旧插件的多角色初始数据与切换需自行实现 |
| 9 | 勇士四帧动画 | 勇士与跟随者使用 4 帧动画（`project/plugins.js:1044`） | 支持 | `packages-user/client-base/src/map/extension/hero.ts:167` 使用 frames 为 4 的帧数据与状态机 | 旧按绘制帧取模，新由状态机推进 |
| 10 | 录像路线修正 | 录像路线修正与折叠（`project/plugins.js:1097`） | 不支持 | 无路线修正或折叠接口 | 旧插件对录像路线做折叠修正，属复杂算法 |
| 11 | 仿 RM 数字键盘 | 整数输入面板，支持负数与音效（`project/plugins.js:1188`） | 部分支持 | `src/client/ui/toolbar.tsx:244` 已有 `NumpadToolbar` 布局，`src/client/ui/inputBox.tsx:324` 提供数字输入 | 数字键发送在 `src/client/ui/toolbar.tsx:298` 仍为注释，未接线 |
| 12 | canvas sprite 化 | 把 canvas 内容 sprite 化（`project/plugins.js:1363`） | 不支持 | 无 sprite 插件等价，渲染层只有通用绘制项 | 旧插件把 canvas 内容 sprite 化，需自行实现底层合成 |
| 13 | 运行时热重载 | 监测文件改动并刷新页面（`project/plugins.js:1555`） | 不支持 | 无运行时热重载接口，构建期刷新不算运行时能力 | 旧插件监听文件改动并刷新页面，新未见对应实现 |

## 3. 扩展加载

旧扩展在启动期动态加载：`libs/extensions.js:15` 的 `_load`、`_loadJs`、`_listExtensions` 先扫描 `extensions` 目录，再逐个注入脚本并串行等待 `onload`。新样板没有脚本扩展机制；`packages/loader` 只加载资源与配置文件，不是代码扩展。下表只列三个随仓扩展，目录扫描机制本身在行内说明。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 文件式本地存档 | 覆写 localForage，把存档压缩后写入 `_saves` 目录（`extensions/localSave.js:1`） | 部分支持 | `packages-user/client-base/src/save/system.ts:41` 的 `SaveSystem` 用 Dexie 与 IndexedDB 持久化 | 旧把存档写成文件，新无文件后端，存储介质不同 |
| 2 | 运行时地图编辑器 | 游戏内显示 ID、改图改怪并保存（`extensions/dynamicMapEditor.js:1`） | 不支持 | 无运行时地图编辑器，目录扫描与动态脚本机制也未检索到 | 需自行实现完整编辑器与脚本加载 |
| 3 | UI 编辑器加载 | 条件式 import 编辑器并注入 CSS（`extensions/ui-editor.js:1`） | 不支持 | 无动态脚本注入与样式注入接口 | 旧扩展条件式加载编辑器，新未见等价机制 |

## 4. 资源加载与 loader

旧 `libs/loader.js` 实测 31 个 `loader.prototype` 方法，按 `_loadMaterials_*`、`_loadExtraImages_*`、`_loadAutotiles_*`、`_loadTilesets_*`、`_loadAnimates_*`、`_loadMusic_*`、`loadImages`、`loadBgm` 等分组。新样板由 `LoadManager`、`ILoadTask`、`WebLoadStarter` 与 `MotaDataLoader` 的 core、extra、custom 三段组成，资源清单由 hook 追加（`packages-user/client-modules/src/loader/hook.ts:6`）。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 加载器初始化 | 初始化加载器状态（`libs/loader.js:12`） | 支持 | `packages-user/data-state/src/loader/loader.ts:45` 的 `MotaDataLoader` 构造 | 旧构造即初始化，新构造后由 `start` 驱动 |
| 2 | 更新加载进度数值 | 写进度条宽度百分比（`libs/loader.js:17`） | 支持 | `packages/loader/src/types.ts:268` 的 `ILoadManagerHooks.onProgress` | 新按任务与字节聚合进度，旧手写百分比 |
| 3 | 更新加载提示文本 | 写加载提示文本（`libs/loader.js:22`） | 部分支持 | `src/client/ui/load.tsx:73` 的加载场景显示任务与字节文本 | 新无任意提示文本 setter，文案由场景组件生成 |
| 4 | 资源加载总入口 | 按压缩开关串联资源、动画与音乐加载（`libs/loader.js:26`） | 支持 | `packages-user/data-state/src/loader/loader.ts:102` 的 `start` 三段式加载 | 旧按压缩开关分同步与异步，新统一异步 |
| 5 | 同步加载入口 | 同步脚本式加载入口（`libs/loader.js:34`） | 不支持 | 新只有异步迭代加载 | 旧同步脚本式加载无等价入口 |
| 6 | 异步加载入口 | 异步加载并聚合各类进度（`libs/loader.js:46`） | 支持 | `packages-user/data-state/src/loader/loader.ts:102` 的 `start` 异步迭代 | 旧回调聚合进度，新异步迭代器 |
| 7 | 同步加载 materials | 同步加载 materials 图片（`libs/loader.js:94`） | 支持 | `packages-user/client-modules/src/loader/hook.ts:14` 的纹理清单加载 | 旧遍历目录名数组，新按清单声明 |
| 8 | 异步加载 materials | 从 `materials.h5data` 异步取图并报进度（`libs/loader.js:102`） | 部分支持 | `packages/loader/src/manager.ts:44` 的 `LoadManager.addTask` 支持异步与进度 | 新无 h5data 资源包入口 |
| 9 | materials 加载后处理 | 加载后切分 icons 到状态栏（`libs/loader.js:109`） | 部分支持 | `packages/render/src/assets/splitter.ts` 的 `TextureSplitter` 可切图 | 状态栏图标映射未在包内确认 |
| 10 | 同步加载额外图片 | 同步加载额外图片（`libs/loader.js:122`） | 支持 | `packages-user/data-state/src/loader/types.ts:80` 的 `addCustomContent` | 旧硬编码目录，新自定义内容清单 |
| 11 | 异步加载额外图片 | 异步加载额外图片，gif 单独处理（`libs/loader.js:128`） | 支持 | `packages-user/data-state/src/loader/loader.ts:83` 的 `addCustomTask` | 旧异步取图，新自定义任务 |
| 12 | 同步加载 autotiles | 同步加载 autotiles（`libs/loader.js:153`） | 支持 | `packages-user/client-base/src/elements/cache.ts:16` 的 autotile 缓存 | 旧目录扫描，新清单加渲染缓存 |
| 13 | 异步加载 autotiles | 异步加载 autotiles（`libs/loader.js:165`） | 支持 | `packages/loader/src/manager.ts:44` 的 `LoadManager` 任务 | 异步加载入口等价 |
| 14 | autotiles 加载后处理 | 加载后处理 autotile（`libs/loader.js:176`） | 部分支持 | `packages-user/client-base/src/elements/cache.ts` 的缓存构建 | 加载后语义未逐项对齐 |
| 15 | 同步加载 tilesets | 同步加载 tilesets（`libs/loader.js:190`） | 支持 | `packages-user/client-modules/src/loader/hook.ts:6` 的纹理清单 | 旧同步脚本，新清单加载 |
| 16 | 异步加载 tilesets | 异步加载 tilesets（`libs/loader.js:199`） | 支持 | `packages/loader/src/manager.ts:44` 的 `LoadManager` 任务 | 异步加载入口等价 |
| 17 | tilesets 加载后处理 | 加载后处理 tilesets（`libs/loader.js:207`） | 部分支持 | `packages/render/src/assets/store.ts` 的纹理缓存 | 加载后处理未逐项对齐 |
| 18 | 批量加载图片 | 批量加载图片到对象（`libs/loader.js:222`） | 支持 | `packages/loader/src/manager.ts:44` 的批量 `addTask` | 旧批量函数，新任务集合 |
| 19 | 单图加载 | 单图加载（`libs/loader.js:246`） | 支持 | `packages/loader/src/task.ts` 的单个 `LoadTask` | 单图加载任务化 |
| 20 | 从 zip 批量取图 | 从 zip 批量取图（`libs/loader.js:271`） | 不支持 | 新无运行时 zip 资源包入口 | 旧从 h5data 批量取图，需自行解包 |
| 21 | 同步加载动画 | 同步加载动画（`libs/loader.js:304`） | 支持 | `packages/render/src/assets/animater.ts` 的动画清单解析 | 旧同步脚本，新清单加 `Animater` |
| 22 | 异步加载动画 | 异步加载动画（`libs/loader.js:333`） | 支持 | `packages/render/src/assets/composer.ts` 的动画合成 | 异步加载入口等价 |
| 23 | 解析单个动画 | 解析单个 `.animate` JSON（`libs/loader.js:346`） | 支持 | `packages/render/src/assets/composer.ts` 的 `TextureComposer` | 旧解析 `.animate`，新按动画清单解析自有格式 |
| 24 | 登记 BGM 列表 | 同步登记 BGM 列表（`libs/loader.js:396`） | 支持 | `packages-user/client-modules/src/loader/hook.ts:15` 的音频清单 | 旧同步登记，新清单声明 |
| 25 | 异步加载 BGM 与 SE | 异步加载 BGM 与 SE（`libs/loader.js:408`） | 支持 | `packages/audio/src/sound.ts:55` 的 `SoundPlayer.add` 解码 | 旧异步取音，新由加载器取字节后解码 |
| 26 | 创建单个音乐源 | 创建 `Audio` 元素并预加载元数据（`libs/loader.js:428`） | 支持 | `packages/audio/src/source.ts` 的元素与流音频源创建 | 新按格式选源，旧固定 `Audio` 元素 |
| 27 | 加载单个音效 | HTTP 取音效并解码（`libs/loader.js:437`） | 支持 | `packages/audio/src/sound.ts:55` 的 `SoundPlayer.add` | 旧 HTTP 取音，新任务加载后解码 |
| 28 | 解码音效数据 | Blob 或 zip 读取并解码音效（`libs/loader.js:446`） | 支持 | `packages/audio/src/types.ts:765` 的 `IAudioDecoder` 解码 | 旧 Blob 或 zip 解码，新解码器注册表 |
| 29 | 播放或加载 BGM | 播放或加载指定 BGM（`libs/loader.js:470`） | 支持 | `packages/audio/src/types.ts:722` 的 `IBGMPlayer.play` 与 `addBGMFromURL` | 新按 id 建路由，旧按名称播放 |
| 30 | 预热 BGM | 静音播放预热 BGM（`libs/loader.js:493`） | 部分支持 | `packages/audio/src/bgm.ts:48` 的缓存池与 `setMaxCacheSize` | 新无静音预热入口，只有缓存容量淘汰 |
| 31 | 释放 BGM | 释放指定 BGM（`libs/loader.js:498`） | 支持 | `packages/audio/src/types.ts:715` 的 `removeBgm` 与音频源 `free` | 新显式释放路由 |

## 5. 音频、BGM 与音效

旧音频能力集中在 `libs/control.js` 与 `core.musicStatus`。新样板由 `IBGMPlayer`、`ISoundPlayer`、`IMotaAudioContext` 与音频路由组成，提供播放、暂停、恢复、停止、音效位置与朝向、缓存容量管理。新音频包没有 BGM 倍速、音调开关或 SE 的 pitch 播放速率，这三类不能由现有接口简单组合。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 播放 BGM | 按名称播放 BGM；非 play 模式或未加载则返回，关闭时只记录（`libs/control.js:2834`） | 支持 | `packages/audio/src/types.ts:722` 的 `IBGMPlayer.play` | 新无 `main.mode` 门禁与 `lastBgm` 回退，播放语义等价 |
| 2 | 暂停 BGM | 记录 `pauseTime` 并暂停当前 BGM（`libs/control.js:2900`） | 支持 | `packages/audio/src/types.ts:732` 的 `IBGMPlayer.pause` | 新不记录 `pauseTime` |
| 3 | 恢复 BGM | 恢复播放并重新应用 `bgmSpeed` 与 `bgmUsePitch`（`libs/control.js:2917`） | 支持 | `packages/audio/src/types.ts:727` 的 `IBGMPlayer.resume` | 新无倍速与音调重应用 |
| 4 | 设置 BGM 倍速 | 按 `speed/100` 写 `playbackRate`，并按 `bgmUsePitch` 改写 `preservesPitch`（`libs/control.js:2882`） | 不支持 | 音频包无倍速或音调接口 | 旧写 `playbackRate` 与 `preservesPitch`，新需直接操作底层节点 |
| 5 | 播放音效 | 播放 SE，`pitch` 参数设置 `playbackRate`（`libs/control.js:2955`） | 部分支持 | `packages/audio/src/types.ts:624` 的 `ISoundPlayer.play` | 新支持位置与朝向，无 pitch 播放速率 |
| 6 | 停止音效 | 按播放 id 停止单个或全部 SE（`libs/control.js:2990`） | 支持 | `packages/audio/src/types.ts:634` 的 `stop` 与 `stopAllSounds` | 新用数字路由 id |
| 7 | 查询正在播放的音效 | 按音效名过滤正在播放的 SE id（`libs/control.js:3010`） | 部分支持 | `packages/audio/src/types.ts:586` 的 `ISoundPlayer.playing` | 新只暴露数字集合，无按音效名过滤 |
| 8 | 重新播放当前 BGM | 重新播放当前或起始 BGM（`libs/control.js:3018`） | 支持 | `packages/audio/src/types.ts:727` 的 `resume` 与 `play` | 新无 `startBgm` 回退 |
| 9 | 音乐按钮图标 | 切换音乐按钮图标（`libs/control.js:2935`） | 部分支持 | `packages/audio/src/types.ts:696` 的 `setEnabled` 可切换音乐开关 | 新工具栏无音乐按钮，需组合图标按钮 |
| 10 | BGM 开关 | BGM 开关（`libs/core.js:73`） | 支持 | `packages/audio/src/types.ts:696` 的 `setEnabled` 与 `enabled` | 新同时提供 `blockChange` |
| 11 | SE 开关 | SE 开关（`libs/core.js:74`） | 支持 | `packages/audio/src/sound.ts:20` 的 `ISoundPlayer.enabled` 与 `setEnabled` | 新关闭时停止全部音效 |
| 12 | 当前 BGM 名称 | 当前 BGM 名称（`libs/core.js:75`） | 支持 | `packages/audio/src/types.ts:650` 的 `IBGMPlayer.playingBGM` | 新为只读属性 |
| 13 | BGM 倍速字段 | 100 为正常速度（`libs/core.js:82`） | 不支持 | 音频包无倍速字段或 setter | 旧 100 为正常速度，新无等价 |
| 14 | BGM 音调开关 | 是否同时修改音调（`libs/core.js:83`） | 不支持 | 音频包无音调开关或 `preservesPitch` | 旧控制是否同时改音调，新无等价 |
| 15 | BGM 缓存数组与数量 | BGM 缓存数组与固定缓存数量 8（`libs/core.js:84`） | 部分支持 | `packages/audio/src/bgm.ts:48` 的缓存池与 `setMaxCacheSize` | 新按内存上限淘汰，无固定条数与缓存数组 |

## 6. 存档、存储与同步

旧存档是「全量状态加 localForage 加可选服务端同步」；新存档是「可存档内容注册表加 Dexie 加自动存档栈加全局存储事务」。结构不可直接对等，只能按能力逐项对照。服务端同步在新仓库没有实现，客户端只有注释态痕迹。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 存档结构 | `saveIndex`、`ids`、`autosave`、`favorite`、`cache` 五段（`libs/core.js:128`） | 部分支持 | `packages-user/client-base/src/save/types.ts:42` 的 `ISaveSystem` 与可存档内容注册表 | 新无收藏与缓存段，按注册表与槽位组织 |
| 2 | 保存与读取整个状态 | 保存或读取整个 `core.status`（`libs/control.js:2270`） | 支持 | `packages-user/data-common/src/save/types.ts` 的 `ISaveableContent.saveState` 与 `loadState` | 新按内容分片序列化，旧保存整个状态 |
| 3 | 按槽位读取存档 | 按槽位读单个或全部存档（`libs/control.js:2279`） | 部分支持 | `packages-user/client-base/src/save/types.ts:109` 的 `load` 与 `getLastSlot` | 新无列出全部槽位的接口 |
| 4 | 索引、存在性与删除 | 索引、存在性与删除（`libs/control.js:2336`） | 部分支持 | `packages-user/client-base/src/save/types.ts:115` 的 `deleteSave` 与 Dexie 查询 | 新无同名索引与存在性接口 |
| 5 | 自动存档 | 自动存档文件，最大回退 20（`libs/control.js:1947`） | 支持 | `packages-user/client-base/src/save/types.ts:62` 的 `undoAutosave` 与 `redoAutosave` | 新为内存栈加手动落库，旧为自动存档文件 |
| 6 | 存档同步 | POST `/games/sync.php` 上传或下载存档（`libs/control.js:2162`） | 不支持 | 新无服务端同步实现，`packages-user/client-modules/src/render/utils/saves.ts:110` 仅有注释态痕迹 | 只有部分痕迹，无可用客户端或服务端接口 |
| 7 | 本地存储封装 | 浏览器本地存储抽象（`libs/utils.js`） | 支持 | `packages-user/client-base/src/save/types.ts:126` 的 `getGlobal` 与 `setGlobal` | 存储引擎由 localForage 改为 Dexie 与 IndexedDB |
| 8 | 存档压缩 | `LZString.compressToBase64` 生成 Base64 压缩串（`libs/control.js:2176`） | 支持 | `packages-user/data-common/src/save/types.ts` 的 `SaveCompression` 与 `saveState` 级别 | 新压缩级别可配置，旧固定 LZString Base64 |
| 9 | 本地存储后端 | 旧用 localForage 持久化（`libs/utils.js`） | 支持 | `packages-user/client-base/src/save/system.ts:41` 的 `SaveSystem` 与 Dexie | 旧 localForage，新 IndexedDB |

## 7. 服务端与网络

新仓库没有 `server.js` 或 `server.py`。在仓库根目录与 `packages`、`packages-user`、`src` 检索 `createServer`、`listen`、`app.route`、`/games/`、`sync.php`、`upload.php` 与中文「服务端」「热重载」「排行」，均未检索到服务端实现。客户端静态资源加载由 `packages/loader/src/starter.ts` 的 `WebLoadStarter` 直接 `fetch`，这是客户端加载器，不是服务端。旧服务端能力因此整体判不支持。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 静态文件服务 | 按扩展名返回 JS、CSS、HTML 与音频（`server.js:56`；`server.py:66`） | 不支持 | 新仓库无 `server.js` 或 `server.py` | 旧按扩展名返回文件，新由构建产物或宿主提供 |
| 2 | 楼层与动画打包 | 合并 `project/floors` 与动画文件减少请求（`server.js:80`） | 不支持 | 无服务端合并接口 | 旧服务端合并楼层与动画，新需构建期处理 |
| 3 | 文件读写与目录操作 | 供编辑器读写 `project` 与 `_saves`（`server.js:121`） | 不支持 | 无服务端文件读写路由 | 旧供编辑器读写目录，新无等价 |
| 4 | 热重载 | 监听 libs、main、index、css、floors 并推送刷新（`server.js:295`） | 不支持 | 无服务端 watch 与 reload 路由 | 构建期刷新不算运行时服务端能力 |
| 5 | 录像上传与校验排行 | 保存录像、校验、读取状态与存档（`server.js:410`） | 不支持 | 无服务端录像接口 | 旧上传校验排行需外部服务，新无等价 |
| 6 | 存档同步服务端 | 客户端 POST `/games/sync.php`，依赖外部 PHP 服务（`libs/control.js:2179`） | 不支持 | 无 sync 路由或服务端实现 | 旧依赖外部 PHP 同步，新仅客户端无实现 |

## 8. 错误、日志与调试

旧引擎大量使用自由文本日志，并提供调试模式、游戏与编辑器模式、竞赛模式。新样板有统一的数字码日志接口，但没有调试模式、编辑器模式或竞赛模式的运行时开关。`main` 只在声明文件中出现，新包内未见运行时创建者。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 自由文本日志 | 大量 `console.error` 与 `console.warn` 输出自由文本（`libs/core.js:471`） | 支持 | `packages/common/src/logger.ts:117` 的 `logger.error` 与 `warn` | 新为数字码加参数插值，旧为自由文本 |
| 2 | 调试模式 | `core.debug` 置 flag，按住 Ctrl 穿墙并禁止上传成绩（`libs/control.js:2605`） | 不支持 | 无对应 flag 或穿墙开关 | 旧用 flag 加输入处理，新无等价 |
| 3 | 游戏与编辑器模式 | `main.mode` 控制 play 与 editor 分支（`main.js:84`） | 不支持 | 无 `main.mode` 运行时提供者 | 新代码仍引用 `main.mode`，但只有声明 |
| 4 | 竞赛模式 | `isCompetition` 开关影响成绩与校验（`main.js:15`） | 不支持 | 无竞赛模式开关 | 旧竞赛模式影响成绩校验，新无等价 |

## 9. 全局入口与构建

旧入口由 `main.js` 与 `index.html` 组合：动态加载 13 个模块、按版本查询串注入脚本、把模块方法转发到全局 `core`。新入口由 `src/bootstrap.ts`、`src/client/entry.ts` 与 `src/data/entry.ts` 的 ESM 装配组成，没有全局 `core`、全局 `main` 与运行时脚本注入。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 模块顺序启动 | 动态加载 13 个模块并按序实例化（`main.js:85`） | 支持 | `src/bootstrap.ts:12` 与 `src/client/entry.ts:23` 的有序装配 | 旧脚本按 13 模块顺序注入，新 ESM 入口按依赖装配 |
| 2 | 运行时脚本注入 | 创建 script 标签按 version 查询串注入，支持 `.min`（`main.js:341`） | 不支持 | 无运行时脚本注入或版本查询串 | 新用静态 ESM 与构建工具，旧可热加载外部模块 |
| 3 | 页面入口 | 先加载第三方脚本，再 `main.init` 与 `main.listen`（`index.html:195`） | 支持 | `index.html:25` 的模块脚本入口 | 旧先加载第三方脚本，新由 bootstrap 统一启动 |
| 4 | 全局 core 转发 | `_forwardFunc` 把模块公开方法挂到全局 `core`（`libs/core.js:516`） | 不支持 | 无全局 `core` 运行时创建者 | 新以显式接口替代，旧内容与插件不能直接迁移 |
| 5 | 全局 main | 版本、模式、DOM 与启动 BGM 等全局状态（`main.js:2`） | 不支持 | 无 `main` 运行时创建者，仅 `src/types/declaration/core.d.ts:1297` 声明 | 旧全局状态与 DOM 入口无等价 |
| 6 | 渲染进程包裹 | 录像验证时跳过渲染与交互代码（`libs/control.js` 的分散判断） | 部分支持 | `packages-user/entry-data/src/mota.ts:90` 的 `r` 与 `rf` 包裹 | 接口存在，但依赖未见运行时提供者的 `main` |

## 10. 回放播放控制

本节只写播放控制。旧 15 个回放动作与新 8 个 `ReplayCode` 的命令语义、路线编码与参数差异见 `02-GAMEPLAY.md#11`，本文件不重复判定。新 `IReplaySandbox` 提供播放、暂停、恢复、停止、单步、倍速与钩子；回放面板存在，但行为仍调用旧全局接口。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 播放、暂停与继续 | 进入回放后按 `core.status.replay` 播放、暂停或继续（`libs/control.js` 回放分支） | 支持 | `packages-user/data-common/src/replay/types.ts:144` 的 `play`、`pause` 与 `resume` | 新为沙箱对象方法，旧为全局状态加面板 |
| 2 | 回放倍速 | 设置 `core.status.replay.speed` 并提示 xN 倍（`libs/control.js:1424`） | 支持 | `packages-user/data-common/src/replay/types.ts:134` 的 `setSpeed` 与 `onSpeedSet` | 新由沙箱持有倍率，旧写全局状态 |
| 3 | 回放单步 | 单步推进回放（`libs/control.js:1384`） | 支持 | `packages-user/data-common/src/replay/types.ts:165` 的 `step` | 新返回 Promise，旧同步函数 |
| 4 | 从存档或剩余录像起播 | 从存档剩余录像或指定索引继续（`libs/control.js:2151`） | 部分支持 | `packages-user/data-common/src/replay/types.ts:362` 的 `startIndex`、`save` 与 `IStateReseter.reset` | 旧剩余录像的计算未逐项对齐 |
| 5 | 回放面板入口 | `replay`、`replayLoad`、`replayRemain`、`replaySince` 四个入口（`04-UI-INPUT.md#2`） | 部分支持 | `src/client/ui/settings.tsx:142` 的 `ReplaySettings` 面板 | 面板存在，但行为仍调用旧全局接口 |
| 6 | 回放状态聚合 | 全局 `core.status.replay` 保存回放状态 | 部分支持 | `packages-user/data-common/src/replay/types.ts:80` 的沙箱钩子与状态属性 | 新无全局聚合状态，旧全局对象无等价 |

## 11. 判定统计

| 域 | 支持 | 部分支持 | 不支持 | 合计 |
| --- | --- | --- | --- | --- |
| 插件系统 | 3 | 3 | 7 | 13 |
| 扩展加载 | 0 | 1 | 2 | 3 |
| 资源加载与 loader | 23 | 6 | 2 | 31 |
| 音频、BGM 与音效 | 8 | 4 | 3 | 15 |
| 存档、存储与同步 | 5 | 3 | 1 | 9 |
| 服务端与网络 | 0 | 0 | 6 | 6 |
| 错误、日志与调试 | 1 | 0 | 3 | 4 |
| 全局入口与构建 | 2 | 1 | 3 | 6 |
| 回放播放控制 | 3 | 3 | 0 | 6 |
| 合计 | 45 | 21 | 27 | 93 |

## 12. 边界说明

- 本文件不重新判定 01 至 04 分册已经明确的条目，只对运行时、扩展与入口相关能力做逐项对照。
- 旧样板源码只读；新样板只读检索，未改任何源码、配置、内容、`STATE.md` 与 `ROADMAP.md`。
- 快照只对 §0 时刻负责；工作树的并发改动不改变本文件的静态对照结论。
- 本文件不写修复方案，也不做运行期验证。
