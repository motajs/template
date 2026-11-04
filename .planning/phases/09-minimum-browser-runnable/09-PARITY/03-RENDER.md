# 03 渲染对照

> 本文件只列旧样板 `D:/github/mota-js` 已有的渲染能力：地图渲染器与图层、图块材质与 autotile、动画与大图与覆盖层、透明度与滤镜与后处理、天气、字体与文本渲染、布局与视口与缩放、缩略图、勇士与门与地图文字扩展，以及 20 项 Canvas2D 绘制原语。
> 新样板只按现有接口、标签或组件能否简单组合来判定；无法确认可简单实现时记为不支持，并写明已检索的范围。
> 判定只用「支持」「部分支持」「不支持」三值；每格 1 到 2 句。
> 快照时间：2026-11-04 13:28（UTC+8）。旧样板 HEAD `3efb548e407ad2b8007b498cb98401e2012a0b55`，工作树干净；新样板 HEAD `5af3ab378b4d65dc5cf1fbcb621fd9a776608dd7`，分支 `refine/data-client`，工作树 162 行改动。
> 工作树会持续变动；本文件只对上述快照负责，不回滚或修改并发改动。

## 1. 判定口径

- 支持：现有新样板接口、标签或组件可以简单组合实现，不需要复杂逻辑或算法，也不直接调用底层接口。
- 部分支持：核心能力已经存在，但需要适配，或只覆盖旧样板行为的一部分。
- 不支持：没有等价能力，或需要自行实现复杂逻辑、算法，或直接调用底层接口；无法确认时一律记不支持。
- 旧侧只读；新侧锚点只使用 `packages/`、`packages-user/`、`src/` 与 `g-` 标签，不使用旧全局对象或声明文件作为实现依据。

## 2. 地图渲染器与图层

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 地图绘制调度 | `libs/maps.js:1150` `drawMap` 先 `clearMap('all')`，再依次 `drawBg`/`drawEvents`/`drawFg`，最后绘制勇士。 | 支持 | `MapRenderItem` 与 `packages-user/client-base/src/map/renderer.ts:1442` 的 `render()` 统一遍历图层，`setLayerState`（`:469`）建立图层顺序。 | 旧按固定画布顺序绘制；新按图层 zIndex 单次渲染，顺序由地图数据决定。 |
| 2 | 背景层 | `libs/maps.js:1229` `drawBg` 与 `:1254` `_drawBg_draw` 把背景图块、楼层贴图与 `bgmap` 画到 `bg` 画布。 | 支持 | `setStaticBackground`/`setDynamicBackground`/`setTileBackground`（`packages-user/client-base/src/map/renderer.ts:524`、`:535`、`:547`）配合 `IMapBackgroundConfig`（`types.ts:54`）。 | 旧是画布合成；新是静态、动态、图块三种背景模式，无 `bgmap` 画布概念。 |
| 3 | 事件层 | `libs/maps.js:1283` `drawEvents` 与 `:1084` `图块绘制内部函数` 把事件块画到 `event`，超高部分画到 `event2`。 | 支持 | `StaticBlockStatus`/`DynamicBlockStatus`（`packages-user/client-base/src/map/status.ts:25`、`:60`）与 `IOverlayBlock`（`types.ts:208`）承载。 | 旧用两张画布分层；新用块状态与覆盖层表达高度，不再有 event2 画布。 |
| 4 | 前景层 | `libs/maps.js:1339` `drawFg` 与 `:1104` `图块绘制内部函数（bg/fg 分支）` 把前景图块画到 `fg` 画布。 | 支持 | `IMapRenderer.getLayer('fg')`（`packages-user/client-base/src/map/renderer.ts:482`）查询前景层，`setZIndex`（`packages-user/data-base/src/map/types.ts:538`）决定顺序。 | 旧固定 fg 画布；新前景是动态图层，别名与 zIndex 可配置。 |
| 5 | 英雄层 | `libs/control.js:812` `drawHero` 与 `:847` `_drawHero_draw` 清空 `hero` 画布后按朝向与帧裁剪勇士图。 | 支持 | `MapHeroRenderer`（`packages-user/client-base/src/map/extension/hero.ts:55`）与 `addHeroMoving`（`:115`）绘制勇士移动块。 | 旧独立画布逐帧重绘；新是移动块与贴图切换，帧由渲染循环推进。 |
| 6 | 伤害层 | `libs/control.js:1269` `drawDamage` 与 `:1288` `_drawDamage_draw` 清空 `damage` 画布后逐点绘制伤害文本。 | 不支持 | 现有接口无法确认可简单实现；`packages/`、`packages-user/`、`src/` 未检索到伤害层运行时实现。 | 旧有独立显伤层；新缩略图只透传 `damage` 选项，未发现同等绘制。 |
| 7 | 动画层 | `libs/maps.js:3000` `drawAnimate` 把动画对象压入 `status.animateObjs`，由主循环画到 `animate` 画布。 | 部分支持 | `Animater`（`packages/animate/src/animater.ts:65`）与 `Transition`（`packages/animate/src/transition.ts:34`）提供驱动，`addMovingBlock`（`packages-user/client-base/src/map/types.ts:565`）承载图块。 | 旧有专用画布与动画对象数组；新无独立图层，需要自行编排。 |
| 8 | 幕布/天气/路由/选择器动态画布 | `libs/control.js:2764` `setCurtain`、`:2818` `screenFlash`、`:922` `setGameCanvasTranslate` 按需创建并定位动态画布。 | 部分支持 | `WeatherController.activate`（`packages-user/client-modules/src/render/weather/controller.ts:72`）与 `Selection`（`packages-user/client-base/src/components/misc.tsx:302`）。 | 天气与选择器有对应；幕布、闪屏、路由画布未发现等价，后处理只是扩展点。 |
| 9 | 图层顺序与别名 | `libs/core.js:114` 的 `bigmap.canvas` 与 `index.html:172` 起的 10 个 `gameCanvas` 固定顺序。 | 支持 | `IMapRenderer.getLayer(alias)`（`packages-user/client-base/src/map/renderer.ts:482`）与 `MapLayer.setZIndex`（`packages-user/data-base/src/map/types.ts:538`），`mapState` 按 alias 建层。 | 旧顺序由 DOM 画布创建顺序固定；新顺序由 zIndex 动态排序。 |
| 10 | 大图分层 | `libs/maps.js:1010` `大图块绘制内部函数` 与 `:955` `大图切片计算函数` 按 face 拆 header/body，z 分别 51/31。 | 部分支持 | `IOverlayBlock.priority`（`packages-user/client-base/src/map/types.ts:216`）与移动块可承载两张图片并分层。 | 旧自动拆分并控制上下遮挡；新无 `bigImage` 字段与拆分逻辑，需内容侧提供切图。 |

## 3. 图块材质与 autotile

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 11 | 图块帧动画 | `libs/maps.js:1001` 用 `posX = animate % 图块动画帧数` 循环图块帧。 | 支持 | `useGlobalFrame`/`useSpecifiedFrame`（`packages-user/client-base/src/map/types.ts:194`、`:200`）与 `getFrameCount`（`packages-user/client-base/src/material/manager.ts:271`）。 | 旧由绘制函数取模；新由材质帧数与块状态驱动。 |
| 12 | tileset 偏移 | `libs/icons.js:52` `getTilesetOffset` 按 `tilesetStartOffset` 累加每个图集宽高。 | 支持 | `addTileset` 与 `tilesetOffsetMap`（`packages-user/client-base/src/material/manager.ts:192-245`）。 | 旧按 `tilesets` 数组顺序累加；新按 index 顺序追加。 |
| 13 | autotile 边缘算法 | `libs/maps.js:1477` `_drawAutotile` 与 `:1666` `_makeAutotileEdges` 用 3×3 邻域和 `toDataURL` 判定连接。 | 支持 | `AutotileProcessor` 的 `flatten`/`connect`/`setConnection`（`packages-user/client-base/src/material/autotile.ts:260`、`:379`、`:309`）。 | 旧按邻域布尔与图像相等；新按 8 邻接位掩码与 spec 组合，组合数不同。 |
| 14 | autotile 动画 | `libs/maps.js:1633` `_drawAutotileAnimate` 与 `:1519` `_drawAutotile_render` 清空该点后按动画状态重绘。 | 支持 | `renderAnimated`（`packages-user/client-base/src/material/autotile.ts:466`）生成动画帧，`IBlockStatus` 控制帧状态。 | 旧逐点清空重绘；新由处理器生成可渲染帧。 |
| 15 | 大图 bigImage | `libs/maps.js:1010` `大图块绘制内部函数` 与 `:955` `大图切片计算函数` 按 `bigImage`/`face` 计算切片。 | 部分支持 | `IOverlayBlock` 与移动块可分层承载大图切片。 | 新无 `bigImage` 运行时字段与 header/body 拆分，需内容侧提供切图。 |
| 16 | faceIds 四向图块 | `libs/maps.js:2676` `_moveBlock_updateDirection` 读取 `图块四向表`，`project/maps.js:102` 给出四向。 | 支持 | `setFaceBinder`（`packages-user/data-base/src/map/types.ts:525`）、`FaceDirection` 与 `setStaticDirection`（`:372`）。 | 旧用图块级 faceIds 映射；新用绑定器，数据形状不同。 |
| 17 | 材质 grid/rowAnimate 加载 | `libs/loader.js:94` `_loadMaterials_sync` 与 `:304` `_loadAnimates_sync` 从目录加载并按 icons 切分。 | 支持 | `addGrid`/`addRowAnimate`（`packages-user/client-base/src/material/manager.ts:144`、`:158`）。 | 旧按 loader 分类加载；新按纹理条目切分。 |
| 18 | autotile 素材加载 | `libs/loader.js:153` `_loadAutotiles_sync` 与 `:176` `_loadAutotiles_afterLoad` 建立 autotile 映射。 | 支持 | `addAutotile`（`packages-user/client-base/src/material/manager.ts:177`）按数量与类型注册并缓存。 | 旧按目录与图标表；新按类型切片。 |
| 19 | tileset 素材加载 | `libs/loader.js:190` `_loadTilesets_sync` 与 `:207` `_loadTilesets_afterLoad` 按 32×32 切分并累加偏移。 | 支持 | `addTileset`（`packages-user/client-base/src/material/manager.ts:192`）注册图集并计算偏移。 | 旧固定 32×32；新支持可变 cell 尺寸。 |
| 20 | 图片/图标素材加载 | `libs/loader.js:222` `loadImages` 与 `:246` `loadImage` 从目录加载图片并按名称存入素材表。 | 支持 | `addImage`（`packages-user/client-base/src/material/manager.ts:247`）与 `getRenderable`（`:571`）。 | 旧按文件名索引；新按 index 与 alias 索引。 |

## 4. 动画、大图与覆盖层

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 21 | 动画播放 | `libs/maps.js:3000` `drawAnimate` 与 `:3068` `_drawAnimateFrame` 按 frames 逐帧绘制，支持 se/ratio/zoom/opacity/mirror/angle。 | 部分支持 | `Animater`（`packages/animate/src/animater.ts:65`）、`Transition`（`packages/animate/src/transition.ts:34`）与 `RafExcitation`（`packages/animate/src/excitation.ts:75`）。 | 旧专用帧绘制；新是通用动画驱动，帧绘制由移动块与材质承担。 |
| 22 | 跟随勇士动画 | `libs/maps.js:3033` `drawHeroAnimate` 把标记 `hero: true` 的动画对象中心跟随勇士。 | 支持 | `MapHeroRenderer` 的实体数组（`packages-user/client-base/src/map/extension/hero.ts:74`）与 `addHeroMoving`（`:115`）。 | 旧用 hero 标志；新由实体状态机管理跟随者。 |
| 23 | box 动画 | `libs/maps.js:2968` `drawBoxAnimate` 在 `ui`/`ui2` 画布绘制大图或图块动画并加金框。 | 部分支持 | `addMovingBlock`（`packages-user/client-base/src/map/types.ts:565`）与 `CustomRenderItem`（`packages/render/src/core/custom.ts:6`）。 | 新可用移动块承载，但无 `boxAnimateObjs` 专用队列与金框绘制。 |
| 24 | 停止/查询动画 | `libs/maps.js:3061` `getPlayingAnimates` 与 `:3096` `stopAnimate` 按 id 查询和停止动画。 | 部分支持 | `IMovingBlock.destroy`（`packages-user/client-base/src/map/types.ts:301`）与 `Animater.destroy`（`packages/animate/src/animater.ts:320`）。 | 旧按动画 id；新按对象引用销毁，无统一 id 注册表。 |
| 25 | 移动块 | `libs/maps.js:2600` `moveBlock` 按 steps 的 up/down/left/right 等逐帧移动图块。 | 支持 | `lineTo`/`moveAs`/`moveRelative`（`packages-user/client-base/src/map/types.ts:256`、`:268`、`:275`）与 `packages-user/client-base/src/map/moving.ts:105`。 | 旧按步进字符串与定时器；新按曲线与时间函数。 |
| 26 | 跳跃块 | `libs/maps.js:2748` `jumpBlock` 从起点到终点做跳跃动画。 | 支持 | `moveAs`（`packages-user/client-base/src/map/types.ts:268`）配合 `ExcitationVariator`（`packages/animate/src/excitation.ts:164`）。 | 旧专用跳跃函数；新用二维曲线，默认时长不同。 |
| 27 | 设置块动画 | `libs/maps.js:2307` `animateSetBlock` 与 `:2384` `animateSetBlocks` 根据原点状态选择直接设置或淡入淡出。 | 部分支持 | 门动画由 `openDoor`/`closeDoor`（`packages-user/client-base/src/map/extension/door.ts:29`、`:44`）承担，显隐可用移动块。 | 旧通用批量淡入与显隐未发现等价 API。 |
| 28 | 大图覆盖层 | `libs/maps.js:1010` `大图块绘制内部函数` 与 `:1028` 的 header/body 用 z 51/31 控制遮挡。 | 部分支持 | `IOverlayBlock.priority`（`packages-user/client-base/src/map/types.ts:216`）与移动块可分层显示 header/body。 | 旧自动拆分并固定 z；新需内容侧拆图并手动分层。 |
| 29 | 覆盖层透明度 | `libs/maps.js:1077` `带滤镜的图块绘制内部函数` 与 `:1119` 用画布全局透明度临时设置图块透明度。 | 支持 | `IBlockStatus.setAlpha`（`packages-user/client-base/src/map/types.ts:184`）由 `StaticBlockStatus`/`DynamicBlockStatus`（`status.ts:39`、`:74`）实现。 | 旧按画布全局透明度；新逐图块 alpha，前景 0.6 策略属数据层。 |
| 30 | 覆盖层排序/优先级 | `libs/maps.js:1039` 与 `:1035` 用固定 z 值控制覆盖关系，`:2972` 的 `ui2` 为 z 142。 | 支持 | `IOverlayBlock.priority`（`packages-user/client-base/src/map/types.ts:216`）与 `StaticOverlayBlock`（`status.ts:95`）。 | 旧固定 z；新按 priority 与图层 zIndex 排序。 |

## 5. 透明度、滤镜与后处理

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 31 | 画布透明度 | `libs/ui.js:453` `setAlpha(name, alpha)` 设置指定画布 `ctx.globalAlpha` 并返回旧值。 | 部分支持 | `RenderItem.setAlpha`（`packages/render/src/core/item.ts:366`）。 | 旧按画布名寻址；新按渲染元素，无画布全局语义。 |
| 32 | 画布滤镜 | `libs/ui.js:468` `setFilter(name, filter)` 把 blur/hue/grayscale/invert/shadow 组合到 `ctx.filter`。 | 部分支持 | `RenderItem.setFilter`（`packages/render/src/core/item.ts:346`）接受字符串滤镜。 | 旧结构化滤镜；新仅元素级字符串，无按图块或画布名设置。 |
| 33 | 图块透明度 | `libs/maps.js:368` `setBlockOpacity(opacity,x,y,floorId)` 写入 `flags.__opacity__` 并重绘该点。 | 支持 | `IBlockStatus.setAlpha`（`packages-user/client-base/src/map/types.ts:184`）。 | 新有逐图块 alpha；旧 flag 的存档与楼层持久化归数据分册。 |
| 34 | 图块滤镜 | `libs/maps.js:395` `setBlockFilter(filter,x,y,floorId)` 支持 blur/hue/shadow/grayscale/invert 并写入 `flags.__filter__`。 | 部分支持 | `RenderItem.setFilter`（`packages/render/src/core/item.ts:346`）可对元素加滤镜。 | 新无逐图块滤镜接口，需自行包装。 |
| 35 | 前景虚化 | `libs/maps.js:1128` `前景虚化判定内部函数` 在 `:1129` 读取 `core.flags.blurFg`，把前景 alpha 降到 0.6。 | 不支持 | 现有接口无法确认可简单实现；未检索到 `blurFg` 标志与前景自动虚化策略。 | 旧有自动前景虚化；新无对应开关。 |
| 36 | 幕布 | `libs/control.js:2764` `setCurtain` 与 `:2785` `_setCurtain_animate` 用 `curtain` 画布铺纯色 RGBA，支持缓动与回调。 | 不支持 | 现有接口无法确认可简单实现；新无默认幕布效果。 | 旧有全局色调幕布；新只有后处理扩展点。 |
| 37 | 闪屏 | `libs/control.js:2818` `screenFlash` 以 `setCurtain` 为基础做多次颜色切换。 | 不支持 | 现有接口无法确认可简单实现；新无默认闪屏效果。 | 旧有闪屏；新无对应实现。 |
| 38 | 全屏叠加后处理 | `libs/control.js:2764` 表明旧只能靠 `curtain` 或 `ui` 画布叠加做全屏效果，没有 FBO 后处理。 | 部分支持 | `IMapRendererPostEffect`（`packages-user/client-base/src/map/types.ts:314`）与 `addPostEffect`（`renderer.ts:319`）提供 FBO 后处理链。 | 旧只能用画布叠加；新需自行实现效果着色器才能得到全屏效果。 |
| 39 | 自定义视觉滤镜 | `libs/ui.js:468` 表明旧只有 Canvas2D `ctx.filter`，不能写自定义片元着色器。 | 部分支持 | `EffectBase`（`packages-user/client-modules/src/render/fx/base.ts:3`）与 `Image3DEffect`（`.../fx/image3d.ts:8`）。 | 旧仅内置滤镜；新需编写着色器才能得到自定义效果。 |
| 40 | 灯光插件 | `project/plugins.js:9` `drawLight` 铺黑色半透明层并用 `destination-out` 挖圆形灯光。 | 不支持 | 现有接口无法确认可简单实现；未检索到默认灯光效果。 | 旧有插件级灯光；新只有后处理扩展点；not planned。 |

## 6. 天气

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 41 | 雨 | `libs/control.js:2701` `_weather_rain` 按 level 生成雨滴节点并随机位置。 | 支持 | `RainWeather`（`packages-user/client-modules/src/render/weather/presets/rain.ts`）配合 `WeatherController.register`（`controller.ts:134`）与 `activate`（`:72`）。 | 旧节点数组加 Canvas2D；新 GL2 实例化雨滴，数量与时长公式不同。 |
| 42 | 雪 | `libs/control.js:2714` `_weather_snow` 按 level 生成雪花节点并随机半径与漂移。 | 支持 | `SnowWeather`（`.../presets/snow.ts`）配合 `WeatherController.register` 与 `activate`。 | 旧节点数组；新 GL2 实例化雪花，数量与时长公式不同。 |
| 43 | 雾 | `libs/control.js:2726` `_weather_fog` 用 `weather.fog` 图片，level 控制透明度并单节点漂移。 | 部分支持 | `FogWeather`（`.../presets/fog.ts`）继承云类预设，经 `WeatherController.register` 注册。 | 图像仍从全局素材表读取；旧单节点漂移，新 2×2 平铺。 |
| 44 | 云 | `libs/control.js:2739` `_weather_cloud` 用 `weather.cloud` 图片，level 控制透明度并单节点漂移。 | 部分支持 | `CloudWeather`（`.../presets/cloud.ts`）继承云类预设，经 `WeatherController.register` 注册。 | 图像仍从全局素材表读取；旧单节点漂移，新平铺。 |
| 45 | 太阳 | `libs/control.js:2752` `_weather_sun` 直接绘制 `weather.sun` 图片并按 level/10 控制透明度。 | 部分支持 | `SunWeather`（`.../presets/sun.ts`）用 `CustomRenderItem` 绘制，经 `WeatherController.register` 注册。 | 图像仍从全局素材表读取；旧直绘，新随机游走。 |
| 46 | 天气注册 | `libs/control.js:2688` `registerWeather(name,initFunc,frameFunc)` 把函数存入 `this.weathers[name]`。 | 部分支持 | `WeatherController.register`（`controller.ts:134`）与 `activate`（`:72`）、`weathers`（`:17`）。 | 注册表存在，但当前工作树未检索到预设注册调用，需项目侧接线。 |

## 7. 字体与文本渲染

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 47 | 设置字体 | `libs/ui.js:429` `setFont(name,font)` 直接设置指定画布 `ctx.font` 字符串。 | 支持 | `Font`（`packages/render/src/style/font.ts:35`）与 `Text.setFont`（`packages/render/src/core/misc.ts:80`）。 | 旧 CSS 字符串；新 family/size/unit/weight/italic。 |
| 48 | 按最大宽度缩字号 | `libs/ui.js:123` `setFontForMaxWidth` 从当前字号向下尝试，直到 `measureText` 不超过最大宽度。 | 部分支持 | `TextContent` 的宽度校验（`packages-user/client-base/src/components/textbox.tsx:126`）与 `TextContentTyper` 换行。 | 新无同名自动缩字号函数，需自行选择字号。 |
| 49 | 计算文本宽度 | `libs/ui.js:532` `calWidth(name,text,font)` 用 `ctx.measureText(text).width` 计算宽度。 | 支持 | `Text.measure`（`packages/render/src/core/misc.ts:58`）与 typer 行宽计算。 | 旧按画布名；新按文本元素或 typer。 |
| 50 | 文本换行 | `libs/ui.js:542` `splitLines` 按换行符与 `measureText` 逐字切分并自动换行。 | 支持 | `TextContentTyper` 的 `breakChars`/`wordBreak`/`ignoreLineStart`/`ignoreLineEnd`（`textboxTyper.ts:12-57`）。 | 旧单一函数；新配置项更细。 |
| 51 | 绘制文本 | `libs/ui.js:738` `drawText(contents,callback)` 逐段绘制并支持打字机与回调。 | 支持 | `Text`（`packages/render/src/core/misc.ts:10`）与 `TextContent`（`packages-user/client-base/src/components/textbox.tsx:117`）。 | 旧按画布逐段绘制；新组件化，打字机由 typer 驱动。 |
| 52 | 富文本绘制 | `libs/ui.js:1088` `drawTextContent` 支持 `\n`、`\r`、`\i`、`\c`、`\d`、`\e` 并逐字块绘制。 | 部分支持 | `TextContent` 与 `TextContentTyper`（`packages-user/client-base/src/components/textbox.tsx:117`）处理颜色、字体、图标与等待标签。 | `\d`/`\e` 的等待与延迟语义未逐项确认，只覆盖已确认部分。 |
| 53 | 文本高度 | `libs/ui.js:1403` `getTextContentHeight` 调用 `drawTextContent(null,...)` 返回 `offsetY`。 | 支持 | `TextContent` 的 `getHeight`/`updateHeight`（`packages-user/client-base/src/components/textbox.tsx:84-171`）与 typer。 | 旧用绘制副作用求高度；新由事件回写。 |
| 54 | 文本框 | `libs/ui.js:1441` `drawTextBox` 绘制窗口皮肤、标题、图标与正文，支持打字机。 | 支持 | `Textbox`（`packages-user/client-base/src/components/textbox.tsx:310`）支持 backColor/winskin/padding/title/icon。 | 旧画布函数；新组件，布局归 UI 分册。 |
| 55 | 滚动文本 | `libs/ui.js:1675` `drawScrollText` 在指定区域滚动文本并按 time 控制速度与回调。 | 支持 | `ScrollText`（`packages-user/client-base/src/components/misc.tsx:210`）与 `Scroll`（`scroll.tsx:109`）。 | 旧按画布与时间；新组件化，支持暂停与改速。 |
| 56 | 文本属性默认值 | `libs/core.js:227` 的 `textAttribute` 集中定义默认字体、颜色、行高、背景与字间距。 | 支持 | `Font.default*`（`packages/render/src/style/font.ts:36-40`）与 `Textbox`/`TextContent` 默认属性（`textbox.tsx:320-347`）。 | 旧集中配置；新分散到字体与组件默认值。 |

## 8. 布局、视口与缩放

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 57 | 设置视口 | `libs/control.js:994` `setViewport(px,py)` 把 `bigmap.offsetX/Y` 夹取到地图范围并更新画布平移。 | 支持 | `IMapRenderer.setViewport`（`packages-user/client-base/src/map/types.ts:453`、`renderer.ts:412`）。 | 旧像素偏移加 DOM 变换；新是 WebGL viewport。 |
| 58 | 移动视口 | `libs/control.js:1010` `moveViewport(x,y,moveMode,time,callback)` 按缓动把视口移到目标格。 | 部分支持 | `Transform.translate`（`packages/render/src/core/transform.ts:75`）与 `ExcitationVariator`（`packages/animate/src/excitation.ts:164`）。 | 新可用变换与激励组合，但无同名封装。 |
| 59 | 更新视口 | `libs/control.js:841` `updateViewport` 根据 `bigmap.v2` 判断是否需要重绘并计算画布偏移。 | 支持 | `MapViewport.getRenderArea`（`packages-user/client-base/src/map/viewport.ts:54`）与 `renderer.needUpdate`（`renderer.ts:1857`）。 | 旧按画布偏移重绘；新按变换反算可见分块。 |
| 60 | 画布平移 | `libs/control.js:922` `setGameCanvasTranslate` 与 `:939` `addGameCanvasTranslate` 直接改每个画布的 CSS transform。 | 支持 | `Transform.translate`（`packages/render/src/core/transform.ts:75`）与 `MapRenderItem`（`packages-user/client-base/src/map/element.ts:8`）。 | 旧逐个 DOM 画布平移；新由单个渲染元素统一变换。 |
| 61 | 分辨率自适应 | `libs/control.js:3245` `resize` 与 `:3337` 起的 `_resize_*` 按横竖屏和缩放档位重排画布、状态栏与工具栏。 | 部分支持 | `MapRenderItem.onResize`/`size`（`packages-user/client-base/src/map/element.ts:74`、`:79`）与 `setCanvasSize`/`setViewport`（`renderer.ts:357`、`:412`）。 | 状态栏与工具栏布局归 UI 分册，新无多画布重排。 |
| 62 | 大地图 | `libs/core.js:113` 的 `bigmap` 用 `v2`/`posX`/`posY`/`threshold`/`cacheCanvas` 控制分块重绘与缓存。 | 部分支持 | `MapViewport`（`packages-user/client-base/src/map/viewport.ts:13`）与 `IMapRenderConfig`（`map/types.ts:69`）。 | 旧有阈值与缓存画布；新由视口与分块脏区管理，无同等字段。 |
| 63 | 图块适配/对齐 | `libs/maps.js:999` 的 `图块取值函数`/`drawBlock` 与 `:1094` 按 32×32 绘制并在超高时转到 `event2`。 | 支持 | `MapTileBehavior`/`MapTileAlign`（`packages-user/client-base/src/map/types.ts:27-48`）与 `configRendering`（`renderer.ts:630`）。 | 旧固定尺寸；新可配置缩放行为与对齐方式。 |
| 64 | 设备像素比/高清 | `libs/core.js:104` 的 `domStyle` 与 `libs/maps.js:1818` 的 `devicePixelRatio` 调整高清画布。 | 支持 | `devicePixelRatio`（`packages-user/client-base/src/map/element.ts:45`、`:58`）与 `setHD`/`setAntiAliasing`（`packages/render/src/core/canvas2d.ts:79`、`:87`）。 | 旧 `hdCanvas` 只覆盖部分画布；新统一在渲染元素处理。 |

## 9. 缩略图

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 65 | 绘制缩略图 | `libs/maps.js:1708` `drawThumbnail(floorId,blocks,options)` 先画临时画布再按 size/all 等选项输出。 | 不支持 | 现有接口无法确认可简单实现；`Thumbnail`（`packages-user/client-base/src/components/thumbnail.tsx:43`）仍透传全局旧绘制。 | 新包内无独立缩略图渲染实现。 |
| 66 | 缩略图临时画布 | `libs/maps.js:1721` `_drawThumbnail_drawTempCanvas` 与 `:1780` `_drawThumbnail_realDrawTempCanvas` 按 all/threshold 裁剪并绘制各层。 | 不支持 | 现有接口无法确认可简单实现；未检索到临时画布与中心裁剪的独立实现。 | 旧有临时画布与分层裁剪；新无对应实现。 |
| 67 | 缩略图交互与尺寸 | `libs/maps.js:1804` `_drawThumbnail_drawToTarget` 按 size 系数适配长方形，all 时黑边居中。 | 部分支持 | `ThumbnailProps`（`packages-user/client-base/src/components/thumbnail.tsx:10`）提供 size/all/noHD/damage/hero/map 参数。 | 尺寸适配与点击区域仍依赖旧绘制，交互归 UI 分册。 |

## 10. 勇士、门与地图文字扩展

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 68 | 勇士四帧动画 | `libs/control.js:851` `_drawHero_draw` 用 `frame` 取模 4 循环，`project/plugins.js:1044` 提供四帧。 | 支持 | `MapHeroRenderer` 的 `frames: 4`（`packages-user/client-base/src/map/extension/hero.ts:167`）与 animateFrame 循环（`:178-193`）。 | 旧按绘制帧取模；新由状态机推进。 |
| 69 | 勇士朝向 | `libs/control.js:818` 用 `utils.scan2[direction]` 与 `:851` 的 `heroIcon.loc` 选择朝向。 | 支持 | `FaceDirection`/`dir4`（`packages-user/client-base/src/map/extension/hero.ts:85`）与 `textureMap`（`:66`）。 | 旧 scan2 与 icons.hero；新方向枚举与贴图绑定。 |
| 70 | 勇士跟随者 | `libs/control.js:858` `_drawHero_getDrawObjs` 按 `drawObjs` 数组绘制勇士与跟随者。 | 支持 | `entities`（`packages-user/client-base/src/map/extension/hero.ts:74`）与 `removeFollower`/`onRemoveFollower`（`:393`、`:495`）。 | 旧绘制对象数组；新实体状态机。 |
| 71 | 门开关动画 | `libs/maps.js:2307` 的 `animateSetBlock` 门分支与 `:2628` 的 `门配置` 按 time 逐帧开关门。 | 支持 | `openDoor`/`closeDoor`（`packages-user/client-base/src/map/extension/door.ts:29`、`:44`）与门渲染器。 | 旧混在 animateSetBlock；新独立门渲染器。 |
| 72 | 地图文字 | `libs/ui.js:1713` `textImage` 与 `libs/events.js:1379` 的 `__text__` 动态画布绘制地图文字。 | 支持 | `OnMapTextRenderer`（`packages-user/client-base/src/map/extension/text.ts:12`）与 `render`/`requireBlockArea`（`:93`、`:173`）。 | 旧动态画布或文本图片；新独立叠加层。 |
| 73 | 扩展管理器 | `libs/maps.js:3033` 的 `drawHeroAnimate`、`:2307` 的 `animateSetBlock` 与 `libs/ui.js:1713` 的 `textImage` 分散扩展能力。 | 支持 | `MapExtensionManager`（`packages-user/client-base/src/map/extension/manager.ts:25`）的 `addHero`/`addDoor`/`addText`。 | 旧扩展分散在 maps/ui；新集中管理。 |
| 74 | 勇士透明度 | `libs/control.js:849` `setAlpha('hero', getFlag('__heroOpacity__',1))` 设置勇士画布透明度。 | 支持 | `IBlockStatus.setAlpha`（`packages-user/client-base/src/map/types.ts:184`）与 `DynamicBlockStatus.setAlpha`（`status.ts:74`）。 | 旧按 flag；新逐块 alpha，flag 持久化归数据分册。 |

## 11. Canvas2D 绘制原语

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 75 | 清空画布 | `libs/ui.js:44` `clearMap` 在 all 时清空所有画布与全局动画，否则 `clearRect` 指定区域。 | 部分支持 | `IMapRenderer.clear`（`packages-user/client-base/src/map/types.ts:460`）与 `MotaOffscreenCanvas2D.clear`（`packages/render/src/core/canvas2d.ts:95`）。 | 新无按画布名加区域清空。 |
| 76 | 填充文本 | `libs/ui.js:82` `fillText` 在指定画布绘制文本，支持分段着色与 maxWidth。 | 支持 | `text` 标签（`packages/render-vue/src/tag.ts:52`）与 `Text`/`TextContent`（`packages/render/src/core/misc.ts:10`）。 | 旧按画布名；新按元素或组件。 |
| 77 | 粗体文本 | `libs/ui.js:135` `fillBoldText` 先描 2px 黑边再填充，支持 maxWidth。 | 支持 | `text` 标签配合 `Font` 粗细（`packages/render/src/style/font.ts:16`）与描边属性。 | 旧固定 2px 描边；新由字体与描边配置。 |
| 78 | 填充矩形 | `libs/ui.js:159` `fillRect` 在指定画布填充矩形并支持旋转。 | 支持 | `g-rect`（`packages/render-vue/src/tag.ts:71`）设置位置与尺寸即可填充。 | 旧按画布名；新按元素，旋转由变换表达。 |
| 79 | 描边矩形 | `libs/ui.js:188` `strokeRect` 描边矩形并支持线宽与旋转。 | 支持 | `g-rect`（`packages/render-vue/src/tag.ts:71`）切换描边模式并设置线宽。 | 同上。 |
| 80 | 填充圆角矩形 | `libs/ui.js:218` `fillRoundRect` 填充圆角矩形并支持 radius 与旋转。 | 支持 | `g-rectr`（`packages/render-vue/src/tag.ts:87`）设置圆角半径后填充。 | 旧单一 radius；新支持四角独立。 |
| 81 | 描边圆角矩形 | `libs/ui.js:237` `strokeRoundRect` 描边圆角矩形并支持 radius 与线宽。 | 支持 | `g-rectr`（`packages/render-vue/src/tag.ts:87`）切换描边模式。 | 同上。 |
| 82 | 填充多边形 | `libs/ui.js:271` `fillPolygon` 按节点数组填充多边形。 | 支持 | `g-path`（`packages/render-vue/src/tag.ts:86`）传入路径节点后填充。 | 旧节点数组；新 Path2D。 |
| 83 | 描边多边形 | `libs/ui.js:292` `strokePolygon` 按节点数组描边多边形。 | 支持 | `g-path`（`packages/render-vue/src/tag.ts:86`）切换描边模式。 | 同上。 |
| 84 | 填充椭圆 | `libs/ui.js:314` `fillEllipse` 按 a/b/angle 填充椭圆。 | 支持 | `g-ellipse`（`packages/render-vue/src/tag.ts:75`）设置半径与角度后填充。 | 旧 a/b/angle；新半径与变换。 |
| 85 | 描边椭圆 | `libs/ui.js:334` `strokeEllipse` 按 a/b/angle 描边椭圆。 | 支持 | `g-ellipse`（`packages/render-vue/src/tag.ts:75`）切换描边模式。 | 同上。 |
| 86 | 填充扇形 | `libs/ui.js:354` `fillArc` 按 x/y/r/start/end 填充扇形。 | 支持 | `g-circle`（`packages/render-vue/src/tag.ts:72`）用角度参数填充扇形。 | 旧 x/y/r/start/end；新弧度。 |
| 87 | 描边圆弧 | `libs/ui.js:371` `strokeArc` 按 x/y/r/start/end 描边圆弧。 | 支持 | `g-circle`（`packages/render-vue/src/tag.ts:72`）切换描边并设置角度。 | 同上。 |
| 88 | 画线 | `libs/ui.js:388` `drawLine` 按两点画线并支持 style/lineWidth。 | 支持 | `g-line`（`packages/render-vue/src/tag.ts:77`）设置两点与线宽。 | 旧按画布名；新按元素。 |
| 89 | 画箭头 | `libs/ui.js:405` `drawArrow` 按两点画箭头并支持 style/lineWidth。 | 支持 | `Arrow`（`packages-user/client-base/src/components/misc.tsx:100`）传入 arrow/head/color。 | 旧 Canvas2D 原语；新 Vue 组件。 |
| 90 | 绘制图片 | `libs/ui.js:572` `drawImage` 支持源/目标矩形、角度与镜像并绘制到指定画布。 | 支持 | `image` 标签（`packages/render-vue/src/tag.ts:57`）与 `Image`（`packages/render/src/core/misc.ts:150`）。 | 旧任意 image；新源图需进入图集。 |
| 91 | 绘制图标 | `libs/ui.js:633` `drawIcon` 从 `material.icons` 按类别/id/帧裁剪并绘制。 | 部分支持 | `getRenderable`（`packages-user/client-base/src/material/manager.ts:571`）配合 `image` 标签裁剪图集图标。 | 矢量 `defineIcon`（`packages-user/client-base/src/components/icons.tsx:115`）只覆盖部分 UI 图标。 |
| 92 | 富文本绘制原语 | `libs/ui.js:1088` `drawTextContent` 逐字块绘制富文本并支持颜色、字体、对齐、行高与打字机。 | 支持 | `text` 标签（`packages/render-vue/src/tag.ts:52`）配合 `TextContent` 与 typer（`textbox.tsx:117`）。 | 旧 Canvas2D 函数；新组件与 typer。 |
| 93 | 绘制背景 | `libs/ui.js:958` `drawBackground` 按 `textAttribute.background` 绘制窗口皮肤或纯色背景并支持小箭头。 | 部分支持 | `Textbox` 的 backColor/winskin/padding（`packages-user/client-base/src/components/textbox.tsx:310`）与 `g-rect` 组合。 | 新无独立背景原语，位置信息 小箭头无直接等价。 |
| 94 | 绘制选择光标 | `libs/ui.js:884` `_drawSelector` 与 `:870` `drawUIEventSelector` 用 winskin 的 9 宫格切出选择光标。 | 支持 | `Selection`（`packages-user/client-base/src/components/misc.tsx:302`）用 9 宫格 winskin 渲染选择光标。 | 旧两个入口；新单组件并带 alpha 呼吸动画。 |

---

本文件只记录渲染能力对照，不判定数据字段、战斗数值或界面布局；旧侧只读，新侧只引用运行时包与标签。所有无法确认的行一律记为不支持，并在差异列写明检索范围。

