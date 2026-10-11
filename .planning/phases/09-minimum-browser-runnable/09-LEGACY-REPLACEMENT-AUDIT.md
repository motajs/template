# Phase 9 · 任务 6：legacy 接口可替代性判定文档

> 本文件是 Phase 9 任务 6 的**只读判定产物**（`09-12-PLAN.md`）。全程只读：未修改 / 删除 / 新增任何生产 `.ts` / `.tsx` 源码，未做任何改造 / 适配 / 接线。唯一写入为本文件与 `09-12-SUMMARY.md`。文档使用裸 LF 行尾（随仓库既有 phase 文档约定）。所有 `file:line` 锚点取自执行日实测，指向真实存在且行号在范围内的行。

## 0. 判定口径与范围

### 0.1 输入（D-47）

- **输入台账：** `.planning/phases/09-minimum-browser-runnable/09-LEGACY-INTERFACES-AUDIT.md`（任务 5 只读统计产物）。
- **A 节（残余 legacy 接口，A-COUNT = 32）：** A-1 跨包 legacy 依赖 10 条 / A-2 全局 `core` 声明 1 条 / A-3 单例 `client` 3 条 / A-4 patch 机制 3 条 / A-5 UI 运行时符号 7 条 / A-6 `Mota` 全局 3 条 / A-7 回退层 5 文件。
- **C 节（`core.*` 代码级调用点，C-COUNT = 228；去重成员 M = 67）：** 逐成员判定。

### 0.2 替代搜索范围（D-47）

- **纳入（替代依据来源）：** 所有**非 legacy 包**——
  - `packages/**`：`@motajs/system`、`@motajs/client-base`、`@motajs/client`、`@motajs/audio`、`@motajs/common`、`@motajs/render`、`@motajs/common` 等；
  - `packages-user/**`：`@user/data-state`、`@user/data-base`、`@user/data-common`、`@user/data-system`、`@user/client-base`、`@user/client-modules`、`@user/client-system` 等；
  - 仓库根 `src/`：**仅作参考**（类型声明 / 全局声明），不作为替代依据主体。
- **排除：** `@motajs/legacy-ui`、`@motajs/legacy-common`、`@motajs/legacy-system` 及其它 `@motajs/legacy-*`（legacy 包内符号**不作为**替代依据）；`node_modules`、`dist` 与生成物。

### 0.3 判定口径（D-46 三问）

对台账每一条目**逐项判定**：

1. **是否已提供替代接口**——在所有非 legacy 包中是否存在**一一对应**的接口（符号 + `file:line`）；
2. **是否已有现成替代方案**——是否存在**非一一对应**、但可达成同等效果的现成对象 / 路由 / API（符号 + `file:line`）；
3. **是否可无痛替换**——直接替换是否不引入行为变化、无能力缺失、无契约破坏。

### 0.4 五类分类定义（OI-2）

| 分类 | 机器可读键 | 判据 |
| --- | --- | --- |
| `可直接替换` | `DIRECT-COUNT` | 非 legacy 包已有对应替代接口，且**签名 / 语义 / 契约等价**或可直接替换；无行为变化、无能力缺失、无契约破坏；调用方可近乎机械替换。 |
| `有替代但需适配` | `ADAPT-COUNT` | 已有替代接口，但替换需**改造适配**——签名 / 对象 / 路由 / 调用方式变化；无能力缺失。 |
| `有替代方案` | `ALT-COUNT` | **无一一对应**的替代接口，但有**现成替代对象 / 路由 / API** 可达成同等效果。 |
| `无替代` | `NONE-COUNT` | 非 legacy 包中既无替代接口，也无现成替代方案（功能尚未迁移）。 |
| `待定` | `TBD-COUNT` | 现有信息不足以判定；**必须**记录「缺什么才能判定」，**不得**静默猜测。 |

- **OI-6 严格度：** 「可直接替换」须同时满足**接口语义等价 / 无行为变化 / 无能力缺失 / 无契约破坏**；任一条不满足降级为「有替代但需适配」或「待定」。
- **灰区处理：** 接口名相近但语义不同、或能力部分覆盖者，**不得**判为「可直接替换」；记「有替代但需适配」或「待定」并写明依据。

### 0.5 统一 per-entry schema

每条固定 7 列：

```
ID | 类别 | 原接口/成员 | 替代接口 + file:line | 替代方案 + file:line | 可替换性 | 理由
```

- `ID`：A 条目用 `A-<子类>-<序号>`；C 条目用 `C:<member>`。
- `类别`：A 条目取子类名（如 `A-1`）；C 条目取 `C`。
- `替代接口` / `替代方案`：无则填 `无`；有则给出真实 `file:line`。
- `可替换性`：五类之一；`理由`：一行依据。

### 0.6 方法论

- 用 `node` / `rg` 在非 legacy 包中检索替代符号，**逐条读真实代码**确认，不臆造。
- 每个 `file:line` 锚点须指向真实存在且行号在范围内的行（门禁逐条校验「文件存在 + 行号在范围内」）。
- 计数键：`ENTRY-COUNT:`（= 条目总数，基线 99）、`DIRECT-COUNT:`、`ADAPT-COUNT:`、`ALT-COUNT:`、`NONE-COUNT:`、`TBD-COUNT:`，且**五类之和 = `ENTRY-COUNT:`**。

### 0.7 只读声明（D-49）

本文件与 `09-12-SUMMARY.md` 是本计划**唯一允许写入**的文件。全程**未改动**任何生产 `.ts` / `.tsx`、任何既有注释或 `files_modified` 外文件；只读守卫采用「执行前基线对比」（OI-4），仅对本计划执行期**新增**的 `.ts` / `.tsx` 改动判红。

## A. 残余 legacy 接口的可替代性

### A-1 跨包 legacy 依赖（10 条，来源 `09-LEGACY-INTERFACES-AUDIT.md` §A-1）

| ID | 类别 | 原接口/成员 | 替代接口 + file:line | 替代方案 + file:line | 可替换性 | 理由 |
| --- | --- | --- | --- | --- | --- | --- |
| A-1-1 | A-1 | `GameStorage`（`@motajs/legacy-system`，hotkey.ts:3） | 无 | `SaveSystem` packages-user/client-base/src/save/system.ts:41 | 有替代方案 | 新存档系统 `SaveSystem` 以 Dexie 提供存档 / 全局存储能力；接口形态不同（见 C:getSave / C:saves） |
| A-1-2 | A-1 | `Patch` / `PatchClass`（`@motajs/legacy-common`，fallback/audio.ts:1） | 无 | `Hookable` / `HookController` packages/common/src/hook.ts:3 | 有替代方案 | 新架构以 `Hookable` 钩子机制替代 legacy 原型 patch；须改为直接使用新音频模块，非一一对应 |
| A-1-3 | A-1 | `mainSetting`（`@motajs/legacy-ui`，fallback/audio.ts:2） | 无 | 无 | 待定 | 非 legacy 包中尚未检索到设置系统（`audio.bgmEnabled` 等键）的替代模块；须先落地新设置系统方可判定 |
| A-1-4 | A-1 | `Patch` / `PatchClass`（`@motajs/legacy-common`，fallback/ui.ts:1） | 无 | `TipStore` packages-user/client-base/src/components/tip.tsx:148 | 有替代方案 | UI patch 仅为把 `drawTip` 挂回 `core`；新架构直接经 `TipStore` 调用 |
| A-1-5 | A-1 | `Patch` / `PatchClass`（`@motajs/legacy-common`，fallback/weather.ts:1） | 无 | `WeatherController` packages-user/client-modules/src/render/weather/controller.ts:11 | 有替代方案 | 天气 patch 仅为把 `setWeather` 挂回 `core`；新架构直接经 `WeatherController` 调用 |
| A-1-6 | A-1 | `mainUi`（`@motajs/legacy-ui`，ui/settings.tsx:13） | 无 | `mainUIController` packages-user/client-modules/src/ui/controller.tsx:5 | 有替代方案 | 新 UI 控制由 `UIController` 实例承担（见 C:ui） |
| A-1-7 | A-1 | `getVitualKeyOnce`（`@motajs/legacy-ui`，ui/settings.tsx:15） | 无 | `Keyboard` packages/system/src/action/keyboard.ts:51 | 有替代方案 | 新虚拟按键 `Keyboard` 承担输入；获取方式 / 事件契约不同 |
| A-1-8 | A-1 | `mainSetting` + `triggerFullscreen`（`@motajs/legacy-ui`，ui/title.tsx:28） | 无 | 无 | 待定 | `mainSetting` 与 `triggerFullscreen` 在非 legacy 包中均未检索到替代；须先落地新设置系统与全屏工具方可判定 |
| A-1-9 | A-1 | `getVitualKeyOnce`（`@motajs/legacy-ui`，ui/toolbar.tsx:14） | 无 | `Keyboard` packages/system/src/action/keyboard.ts:51 | 有替代方案 | 同 A-1-7 |
| A-1-10 | A-1 | `generateBinary`（`@motajs/legacy-common`，ui/toolbar.tsx:20） | 无 | 无 | 待定 | 非 legacy 包中未检索到二进制生成工具的替代；须确认新输入 / 编码模块是否覆盖该能力 |

### A-2 legacy 全局 `core`（1 条，来源 §A-2）

| ID | 类别 | 原接口/成员 | 替代接口 + file:line | 替代方案 + file:line | 可替换性 | 理由 |
| --- | --- | --- | --- | --- | --- | --- |
| A-2-1 | A-2 | 全局 `core`（声明 src/types/declaration/core.d.ts:1302） | 无 | `CoreState`（含 L0..L3 模块）packages-user/data-state/src/core.ts:76 | 有替代方案 | 新数据端 `CoreState` 为 `core` 的等价承载；`core.*` 逐成员可替代性见 §C |

### A-3 legacy 单例 `client`（3 条，来源 §A-3）

| ID | 类别 | 原接口/成员 | 替代接口 + file:line | 替代方案 + file:line | 可替换性 | 理由 |
| --- | --- | --- | --- | --- | --- | --- |
| A-3-1 | A-3 | `client` 单例定义（core.ts:6） | `ClientCore` packages-user/client-modules/src/client.ts:37 | 无 | 有替代但需适配 | 单例体内为 `ClientCore`（`extends CoreState`）；新架构主张以参数传入 `IClientCore`，调用方式变化 |
| A-3-2 | A-3 | `client` 导入使用（fallback/audio.ts:5） | `IClientCore` packages-user/client-modules/src/client.ts:37 | 无 | 有替代但需适配 | 须改为经 `IClientCore` 参数注入，而非模块级单例 |
| A-3-3 | A-3 | `client` 解构 `{ bgmPlayer, soundPlayer, audioContext }`（fallback/audio.ts:11） | `ClientCore.bgmPlayer` packages-user/client-modules/src/client.ts:44 | 无 | 有替代但需适配 | 同名成员已存在于 `ClientCore`；替换仅需从 `IClientCore` 取值，路由变化 |

### A-4 legacy patch 机制（`Patch` / `PatchClass`，3 条，来源 §A-4）

| ID | 类别 | 原接口/成员 | 替代接口 + file:line | 替代方案 + file:line | 可替换性 | 理由 |
| --- | --- | --- | --- | --- | --- | --- |
| A-4-1 | A-4 | `new Patch(PatchClass.Control)`（fallback/audio.ts:10） | 无 | `SoundPlayer` / `BGMPlayer` packages/audio/src/sound.ts:6 | 有替代方案 | patch 挂载的 `playBgm` / `playSound` 等直接由新音频对象承担；整层可去除 |
| A-4-2 | A-4 | `new Patch(PatchClass.UI)`（fallback/ui.ts:5） | 无 | `TipStore` packages-user/client-base/src/components/tip.tsx:148 | 有替代方案 | `drawTip` 经 `TipStore` 直接调用，patch 层可去除 |
| A-4-3 | A-4 | `new Patch(PatchClass.Control)`（fallback/weather.ts:8） | 无 | `WeatherController` packages-user/client-modules/src/render/weather/controller.ts:11 | 有替代方案 | `setWeather` 经 `WeatherController` 直接调用，patch 层可去除 |

### A-5 legacy UI 运行时符号（7 条，来源 §A-5）

| ID | 类别 | 原接口/成员 | 替代接口 + file:line | 替代方案 + file:line | 可替换性 | 理由 |
| --- | --- | --- | --- | --- | --- | --- |
| A-5-1 | A-5 | `mainSetting.getValue('audio.bgmEnabled')`（fallback/audio.ts:31） | 无 | 无 | 待定 | 新设置系统未落地；须先确定 `audio.bgmEnabled` 的新承载方可判定 |
| A-5-2 | A-5 | `mainUi.open('settings')`（ui/settings.tsx:67） | 无 | `UIController.open` packages/system/src/ui/controller.ts:190 | 有替代方案 | 新 `UIController` 以 `open(ui, props)` 弹出 UI；需以 `GameUI` 实例替代字符串 id |
| A-5-3 | A-5 | `getVitualKeyOnce().then(...)`（ui/settings.tsx:71） | 无 | `Keyboard` packages/system/src/action/keyboard.ts:51 | 有替代方案 | 输入改由 `Keyboard` 承担；返回 / 事件契约不同 |
| A-5-4 | A-5 | `mainSetting.getValue('audio.bgmEnabled', true)`（ui/title.tsx:303） | 无 | 无 | 待定 | 同 A-5-1 |
| A-5-5 | A-5 | `mainSetting.setValue('audio.bgmEnabled', ...)`（ui/title.tsx:334） | 无 | 无 | 待定 | 同 A-5-1 |
| A-5-6 | A-5 | `triggerFullscreen(bool)`（ui/title.tsx:343） | 无 | 无 | 无替代 | 非 legacy 包中未检索到全屏控制工具；功能尚未迁移 |
| A-5-7 | A-5 | `getVitualKeyOnce().then(...)`（ui/toolbar.tsx:101） | 无 | `Keyboard` packages/system/src/action/keyboard.ts:51 | 有替代方案 | 同 A-5-3 |

### A-6 legacy `Mota` 全局（`Mota.require(...)`，3 条，来源 §A-6）

| ID | 类别 | 原接口/成员 | 替代接口 + file:line | 替代方案 + file:line | 可替换性 | 理由 |
| --- | --- | --- | --- | --- | --- | --- |
| A-6-1 | A-6 | `Mota.require('@user/data-base')`（elements/cache.ts:491） | 无 | 直接 ESM 导入 `@user/data-base` packages-user/data-base/src/index.ts:1 | 有替代方案 | 新架构以标准模块导入替代运行时 `Mota.require`；模块解析机制变化 |
| A-6-2 | A-6 | `Mota.require('@user/data-base')`（elements/misc.ts:89） | 无 | 直接 ESM 导入 `@user/data-base` packages-user/data-base/src/index.ts:1 | 有替代方案 | 同 A-6-1 |
| A-6-3 | A-6 | `Mota.require('@user/data-base')`（elements/misc.ts:219） | 无 | 直接 ESM 导入 `@user/data-base` packages-user/data-base/src/index.ts:1 | 有替代方案 | 同 A-6-1 |

### A-7 legacy 兼容 / 回退层（`fallback/**`，5 文件，来源 §A-7）

| ID | 类别 | 原接口/成员 | 替代接口 + file:line | 替代方案 + file:line | 可替换性 | 理由 |
| --- | --- | --- | --- | --- | --- | --- |
| A-7-1 | A-7 | `fallback/index.ts` `patchAll()`（fallback/index.ts:1） | 无 | `create()` packages-user/client-modules/src/index.ts:4 | 有替代方案 | 新入口 `create()` 取代 `patchAll()`；回退层整体可去除 |
| A-7-2 | A-7 | `fallback/audio.ts`（legacy 音频回退） | 无 | `ClientCore` 音频成员 packages-user/client-modules/src/client.ts:44 | 有替代但需适配 | 回退逻辑已内联 `bgmPlayer` / `soundPlayer`；去除回退层须改用 `IClientCore` 成员 |
| A-7-3 | A-7 | `fallback/ui.ts`（legacy UI 回退） | 无 | `TipStore` packages-user/client-base/src/components/tip.tsx:148 | 有替代方案 | `drawTip` 直连 `TipStore`，回退层可去除 |
| A-7-4 | A-7 | `fallback/weather.ts`（legacy 天气回退） | 无 | `WeatherController` packages-user/client-modules/src/render/weather/controller.ts:11 | 有替代方案 | `setWeather` 直连 `WeatherController`，回退层可去除 |
| A-7-5 | A-7 | `fallback/load.ts`（旧版素材加载兼容） | 无 | `TextureManager` packages-user/client-base/src/material/manager.ts:37 | 有替代方案 | 素材加载改由 `TextureManager` 承担（`fallbackLoad` 即适配层）；回退层可去除 |

**A 节分类计数：** `可直接替换` 0 / `有替代但需适配` 4 / `有替代方案` 21 / `无替代` 1 / `待定` 6（合计 32）。

## C. 经 core.* 调用的接口的可替代性

### C.1 `core.*` 去重成员逐成员判定（M = 67）

> 每条 `ID` = `C:<member>`；`类别` = `C`；`理由` 末附该成员调用点 `file:line`（取自 `09-LEGACY-INTERFACES-AUDIT.md` §C-2）。替代依据一律取自**非 legacy 包**。

| ID | 类别 | 原接口/成员 | 替代接口 + file:line | 替代方案 + file:line | 可替换性 | 理由 |
| --- | --- | --- | --- | --- | --- | --- |
| C:actions | C | `core.actions` | 无 | 无 | 待定 | 新 action 系统（packages-user/client-modules/src/action/）为渲染端动作表，未检索到 legacy `core.actions._clickGameInfo_openComments` 的等价注册表；须确认新动作注册是否覆盖。（调用点 packages-user/client-modules/src/action/hotkey.ts:511） |
| C:arrayToRGBA | C | `core.arrayToRGBA` | 无 | 无 | 无替代 | 非 legacy 包中未检索到 `arrayToRGBA`；仅 legacy-ui 与类型声明引用。（调用点 packages-user/client-modules/src/ui/title.tsx:122） |
| C:calValue | C | `core.calValue` | 无 | 无 | 无替代 | 表达式求值工具未迁移到非 legacy 包。（调用点 packages-user/client-base/src/components/textboxTyper.ts:907） |
| C:chooseReplayFile | C | `core.chooseReplayFile` | 无 | 无 | 待定 | 录像文件选取 / 导入未检索到替代；须确认新录像系统是否覆盖文件选取。（调用点 packages-user/client-modules/src/ui/settings.tsx:214） |
| C:clearLocalForage | C | `core.clearLocalForage` | 无 | `SaveSystem.startGlobalTransaction` packages-user/client-base/src/save/system.ts:214 | 有替代方案 | 清空全局存储可由新存档系统事务完成。（调用点 packages-user/client-modules/src/ui/settings.tsx:573） |
| C:confirmRestart | C | `core.confirmRestart` | 无 | 无 | 待定 | 重开确认 UI 未检索到替代；须确认新 UI 是否提供该流程。（调用点 packages-user/client-modules/src/action/hotkey.ts:508） |
| C:control | C | `core.control` | 无 | 无 | 待定 | legacy `core.control` 为巨型逻辑模块，新架构已拆分至各系统，逐一映射未完成；须系统性梳理。（调用点 packages-user/client-modules/src/ui/settings.tsx:584） |
| C:debug | C | `core.debug` | 无 | `logger` packages/common/src/logger.ts:229 | 有替代方案 | 调试输出改由新 logger 承担。（调用点 packages-user/client-modules/src/action/hotkey.ts:514） |
| C:doRegisteredAction | C | `core.doRegisteredAction` | 无 | 无 | 待定 | 注册动作派发未检索到替代；须确认新事件 / 动作系统覆盖。（调用点 packages-user/client-modules/src/ui/main.tsx:109） |
| C:doSL | C | `core.doSL` | 无 | 无 | 待定 | 存读档组合操作（含 autosave / replay 分支）未检索到等价入口；须设计新入口。（调用点 packages-user/client-modules/src/ui/settings.tsx:172） |
| C:download | C | `core.download` | 无 | 无 | 待定 | 浏览器下载工具未检索到替代；须确认新工具层。（调用点 packages-user/client-modules/src/ui/settings.tsx:221） |
| C:drawThumbnail | C | `core.drawThumbnail` | 无 | `drawThumbnail`（组件内本地实现） packages-user/client-base/src/components/thumbnail.tsx:50 | 有替代方案 | 缩略图绘制已本地化到 thumbnail 组件内。（调用点 packages-user/client-base/src/components/thumbnail.tsx:75） |
| C:drawTip | C | `core.drawTip` | 无 | `TipStore.drawTip` packages-user/client-base/src/components/tip.tsx:158 | 有替代方案 | 提示绘制改由 `TipStore` 承担。（调用点 packages-user/client-modules/src/ui/save.tsx:531） |
| C:encodeRoute | C | `core.encodeRoute` | 无 | `ReplaySystem` packages-user/data-common/src/replay/system.ts:21 | 有替代方案 | 录像编码由新录像系统承担。（调用点 packages-user/client-modules/src/ui/settings.tsx:228） |
| C:extractBlocks | C | `core.extractBlocks` | 无 | 无 | 待定 | 楼层图块提取未检索到替代；须确认新地图渲染器覆盖。（调用点 packages-user/client-modules/src/ui/statistics.tsx:165） |
| C:extractBlocksForUI | C | `core.extractBlocksForUI` | 无 | 无 | 待定 | 面向 UI 的图块提取未检索到替代，同 extractBlocks。（调用点 packages-user/client-modules/src/ui/save.tsx:119） |
| C:firstData | C | `core.firstData` | 无 | 无 | 待定 | 首关数据（name/version/title）新承载未检索到；须确认 loader / data 层是否提供。（调用点 packages-user/client-modules/src/client.ts:75） |
| C:flags | C | `core.flags` | `FlagSystem` packages-user/data-base/src/flag/system.ts:5 | 无 | 有替代但需适配 | 新 `FlagSystem` 取代 `core.flags`；键值访问方式变化。（调用点 packages-user/client-modules/src/ui/statusBar.tsx:227） |
| C:floorIds | C | `core.floorIds` | `MapStore` packages-user/data-common/src/store/mapStore.ts:3 | 无 | 有替代但需适配 | 楼层 id 集合由新地图存储承担，遍历方式变化。（调用点 packages-user/client-modules/src/fallback/load.ts:111） |
| C:floors | C | `core.floors` | `MapState` packages-user/data-base/src/map/mapState.ts:17 | 无 | 有替代但需适配 | 楼层静态信息由新地图状态承担，结构变化。（调用点 packages-user/client-modules/src/ui/statusBar.tsx:208） |
| C:flyTo | C | `core.flyTo` | 无 | 无 | 待定 | 飞往楼层未检索到替代；须确认新地图 / 传送系统覆盖。（调用点 packages-user/client-modules/src/ui/viewmap.tsx:135） |
| C:formatBigNumber | C | `core.formatBigNumber` | 无 | 无 | 无替代 | 大数格式化未迁移到非 legacy 包。（调用点 packages-user/client-modules/src/ui/statusBar.tsx:246） |
| C:formatDate2 | C | `core.formatDate2` | 无 | 无 | 无替代 | 日期格式化未迁移到非 legacy 包。（调用点 packages-user/client-modules/src/ui/settings.tsx:222） |
| C:getAllSaves | C | `core.getAllSaves` | 无 | `getAllSaves` packages-user/client-modules/src/render/utils/saves.ts:36 | 有替代方案 | 存档列表查询由新存档工具承担。（调用点 packages-user/client-modules/src/render/utils/saves.ts:38） |
| C:getAnimateFrames | C | `core.getAnimateFrames` | 无 | 无 | 待定 | 动画帧查询未检索到替代；须确认 `TextureManager` 是否覆盖动画帧。（调用点 packages-user/client-base/src/elements/cache.ts:206） |
| C:getLvName | C | `core.getLvName` | 无 | 无 | 无替代 | 等级名称映射未迁移到非 legacy 包。（调用点 packages-user/client-modules/src/ui/statusBar.tsx:183） |
| C:getMappedName | C | `core.getMappedName` | 无 | 无 | 无替代 | 音效名映射未迁移到非 legacy 包。（调用点 packages-user/client-modules/src/fallback/audio.ts:49） |
| C:getNextItem | C | `core.getNextItem` | 无 | 无 | 待定 | 切换道具未检索到替代；须确认 `HeroItems` 是否覆盖。（调用点 packages-user/client-modules/src/action/hotkey.ts:505） |
| C:getSave | C | `core.getSave` | 无 | `SaveSystem.load` packages-user/client-base/src/save/system.ts:185 | 有替代方案 | 单存档读取由新存档系统承担（异步契约）。（调用点 packages-user/client-modules/src/render/utils/saves.ts:21） |
| C:getTilesetOffset | C | `core.getTilesetOffset` | 无 | `TextureManager` packages-user/client-base/src/material/manager.ts:37 | 有替代方案 | tileset 偏移由 `TextureManager` 内部 `tilesetOffsetMap` 处理，未暴露同名公开方法。（调用点 packages-user/client-base/src/elements/cache.ts:131） |
| C:hasItem | C | `core.hasItem` | 无 | `HeroItems` packages-user/data-base/src/hero/items.ts:18 | 有替代方案 | 道具持有查询由新 `HeroItems` 承担。（调用点 packages-user/client-modules/src/ui/viewmap.tsx:133） |
| C:icons | C | `core.icons` | 无 | 无 | 待定 | 图标信息承载未检索到替代；须确认 `TextureManager` / 素材层是否覆盖 `icons` 结构。（调用点 packages-user/client-modules/src/fallback/load.ts:55） |
| C:isMoving | C | `core.isMoving` | `HeroMover` packages-user/data-base/src/hero/mover.ts:23 | 无 | 有替代但需适配 | 移动状态由新 `HeroMover` 承担，查询方式变化。（调用点 packages-user/client-modules/src/action/hotkey.ts:478） |
| C:isPlaying | C | `core.isPlaying` | `ReplaySystem` packages-user/data-common/src/replay/system.ts:21 | 无 | 有替代但需适配 | 播放状态由新录像系统承担（属性 / 方法形态差异）。（调用点 packages-user/client-modules/src/action/move.ts:66） |
| C:isReplaying | C | `core.isReplaying` | `ReplaySystem` packages-user/data-common/src/replay/system.ts:21 | 无 | 有替代但需适配 | 录像播放状态由新录像系统承担。（调用点 packages-user/client-base/src/components/choices.tsx:717） |
| C:maps | C | `core.maps` | `MapState` packages-user/data-base/src/map/mapState.ts:17 | 无 | 有替代但需适配 | 地图状态由新 `MapState` 承担。（调用点 packages-user/client-modules/src/ui/save.tsx:118） |
| C:material | C | `core.material` | `TextureManager` packages-user/client-base/src/material/manager.ts:37 | 无 | 有替代但需适配 | 素材由新 `TextureManager` 承担，`images/animates/enemys/items/icons` 以贴图库访问。（调用点 packages-user/client-base/src/elements/cache.ts:11） |
| C:openBook | C | `core.openBook` | 无 | `BookUI` packages-user/client-modules/src/ui/book.tsx:251 | 有替代方案 | 图鉴 UI 由新 `BookUI` / `UIController.open` 承担。（调用点 packages-user/client-modules/src/action/hotkey.ts:481） |
| C:openEquipbox | C | `core.openEquipbox` | 无 | `EquipBoxUI` packages-user/client-modules/src/ui/equipbox.tsx:551 | 有替代方案 | 装备箱 UI 由新 `EquipBoxUI` 承担。（调用点 packages-user/client-modules/src/action/hotkey.ts:487） |
| C:openQuickShop | C | `core.openQuickShop` | 无 | `ShopUI` packages-user/client-modules/src/ui/shop.tsx:491 | 有替代方案 | 快捷商店由新 `ShopUI` 承担。（调用点 packages-user/client-modules/src/action/hotkey.ts:493） |
| C:openToolbox | C | `core.openToolbox` | 无 | `ToolBoxUI` packages-user/client-modules/src/ui/toolbox.tsx:278 | 有替代方案 | 道具栏由新 `ToolBoxUI` 承担。（调用点 packages-user/client-modules/src/action/hotkey.ts:484） |
| C:pauseReplay | C | `core.pauseReplay` | `ReplaySystem` packages-user/data-common/src/replay/system.ts:21 | `ReplaySandbox.pause` packages-user/data-common/src/replay/sandbox.ts:274 | 有替代但需适配 | 暂停由新录像沙盒承担（异步契约）。（调用点 packages-user/client-modules/src/ui/toolbar.tsx:188） |
| C:platform | C | `core.platform` | 无 | 无 | 待定 | 平台信息（isPC/isChrome 等）未检索到替代；须确认新平台 / 环境模块。（调用点 packages-user/client-modules/src/ui/settings.tsx:282） |
| C:playSound | C | `core.playSound` | 无 | `SoundPlayer.play` packages/audio/src/sound.ts:74 | 有替代方案 | 音效播放由新 `SoundPlayer` 承担（含位置 / 朝向参数与返回 id）。（调用点 packages-user/client-modules/src/ui/settings.tsx:431） |
| C:removeFlag | C | `core.removeFlag` | `FlagSystem.deleteField` packages-user/data-base/src/flag/system.ts:40 | 无 | 有替代但需适配 | 删除标记改由 `FlagSystem.deleteField` 承担。（调用点 packages-user/client-modules/src/ui/statistics.tsx:224） |
| C:removeLocalForage | C | `core.removeLocalForage` | 无 | `SaveSystem.deleteSave` packages-user/client-base/src/save/system.ts:192 | 有替代方案 | 删除指定存档由新存档系统承担。（调用点 packages-user/client-modules/src/render/utils/saves.ts:174） |
| C:removeLocalStorage | C | `core.removeLocalStorage` | 无 | 无 | 待定 | `localStorage` 键删除未检索到替代；须确认新全局存储是否替代 localStorage 用法。（调用点 packages-user/client-modules/src/ui/settings.tsx:585） |
| C:removeSave | C | `core.removeSave` | 无 | `SaveSystem.deleteSave` packages-user/client-base/src/save/system.ts:192 | 有替代方案 | 删除存档由新存档系统承担。（调用点 packages-user/client-modules/src/ui/save.tsx:538） |
| C:replaceText | C | `core.replaceText` | 无 | 无 | 无替代 | 文本模板替换未迁移到非 legacy 包。（调用点 packages-user/client-base/src/components/tip.tsx:104） |
| C:restart | C | `core.restart` | 无 | 无 | 待定 | 重开游戏流程未检索到替代；须确认新入口。（调用点 packages-user/client-modules/src/ui/settings.tsx:108） |
| C:resumeReplay | C | `core.resumeReplay` | `ReplaySystem` packages-user/data-common/src/replay/system.ts:21 | `ReplaySandbox.resume` packages-user/data-common/src/replay/sandbox.ts:284 | 有替代但需适配 | 恢复由新录像沙盒承担。（调用点 packages-user/client-modules/src/ui/toolbar.tsx:187） |
| C:rewindReplay | C | `core.rewindReplay` | `ReplaySystem` packages-user/data-common/src/replay/system.ts:21 | 无 | 有替代但需适配 | 回退能力由新录像系统承担，公开入口形态待确认。（调用点 packages-user/client-modules/src/ui/toolbar.tsx:201） |
| C:saves | C | `core.saves` | 无 | `SaveSystem` packages-user/client-base/src/save/system.ts:41 | 有替代方案 | 存档体系由新 `SaveSystem` 承担，`saveIndex/ids/autosave` 等结构不同。（调用点 packages-user/client-modules/src/render/utils/saves.ts:173） |
| C:setFlag | C | `core.setFlag` | `FlagSystem.setFieldValue` packages-user/data-base/src/flag/system.ts:31 | 无 | 有替代但需适配 | 设置标记改由 `FlagSystem.setFieldValue` 承担（见 flag/types.ts:93 明确对应 `core.setFlag`）。（调用点 packages-user/client-modules/src/ui/statistics.tsx:145） |
| C:setLocalForage | C | `core.setLocalForage` | 无 | `SaveSystem.setGlobal` packages-user/client-base/src/save/system.ts:209 | 有替代方案 | 写全局存储由新存档系统承担。（调用点 packages-user/client-modules/src/render/utils/saves.ts:172） |
| C:speedDownReplay | C | `core.speedDownReplay` | `ReplaySandbox.setSpeed` packages-user/data-common/src/replay/sandbox.ts:70 | 无 | 有替代但需适配 | 减速由新录像沙盒 `setSpeed` 承担，增减语义需适配。（调用点 packages-user/client-modules/src/ui/toolbar.tsx:190） |
| C:speedUpReplay | C | `core.speedUpReplay` | `ReplaySandbox.setSpeed` packages-user/data-common/src/replay/sandbox.ts:70 | 无 | 有替代但需适配 | 加速由新录像沙盒 `setSpeed` 承担，增减语义需适配。（调用点 packages-user/client-modules/src/ui/toolbar.tsx:191） |
| C:startGame | C | `core.startGame` | 无 | 无 | 待定 | 开始游戏流程未检索到替代；须确认新入口。（调用点 packages-user/client-modules/src/ui/title.tsx:223） |
| C:status | C | `core.status` | 无 | `CoreState` packages-user/data-state/src/core.ts:76 | 有替代但需适配 | `core.status` 已拆分至 `CoreState` 的 `maps` / `hero` / `flags`（L1）；`route/lockControl/hero/floorId` 等逐字段需重映射。（调用点 packages-user/client-modules/src/action/hotkey.ts:478） |
| C:stepReplay | C | `core.stepReplay` | `ReplaySandbox.step` packages-user/data-common/src/replay/sandbox.ts:297 | `ReplaySystem` packages-user/data-common/src/replay/system.ts:21 | 有替代但需适配 | 单步由新录像沙盒承担（异步契约）。（调用点 packages-user/client-modules/src/ui/toolbar.tsx:202） |
| C:stopReplay | C | `core.stopReplay` | `ReplaySandbox.stop` packages-user/data-common/src/replay/sandbox.ts:291 | `ReplaySystem` packages-user/data-common/src/replay/system.ts:21 | 有替代但需适配 | 停止由新录像沙盒承担（异步契约）。（调用点 packages-user/client-modules/src/ui/toolbar.tsx:189） |
| C:syncSave | C | `core.syncSave` | 无 | 无 | 待定 | 存档云同步未检索到替代；须确认新同步 / 服务端模块。（调用点 packages-user/client-modules/src/ui/settings.tsx:439） |
| C:tilesets | C | `core.tilesets` | `TextureManager` packages-user/client-base/src/material/manager.ts:37 | 无 | 有替代但需适配 | 额外素材 tileset 由 `TextureManager.tilesetStore` 承担，遍历 / 索引方式变化。（调用点 packages-user/client-modules/src/fallback/load.ts:99） |
| C:turnHero | C | `core.turnHero` | `HeroMover` packages-user/data-base/src/hero/mover.ts:23 | 无 | 有替代但需适配 | 转向由新 `HeroMover` 承担，调用方式变化。（调用点 packages-user/client-modules/src/action/hotkey.ts:502） |
| C:ui | C | `core.ui` | 无 | `mainUIController` packages-user/client-modules/src/ui/controller.tsx:5 | 有替代方案 | UI 控制由 `UIController` 实例承担（`closePanel` 等以 `closeAll` 等价）。（调用点 packages-user/client-modules/src/ui/settings.tsx:160） |
| C:useFly | C | `core.useFly` | 无 | 无 | 待定 | 使用飞行道具未检索到替代；须确认新道具使用流程。（调用点 packages-user/client-modules/src/action/hotkey.ts:490） |
| C:waitHeroToStop | C | `core.waitHeroToStop` | `HeroMover` packages-user/data-base/src/hero/mover.ts:23 | 无 | 有替代但需适配 | 等待停止由新 `HeroMover` / 顶层移动实现承担，调用方式变化。（调用点 packages-user/client-modules/src/action/move.ts:67） |

**C 节分类计数：** `可直接替换` 0 / `有替代但需适配` 21 / `有替代方案` 19 / `无替代` 7 / `待定` 20（合计 67）。

## 汇总

### 五类分类汇总表

| 分类 | 计数 | 代表条目 / 备注 |
| --- | --- | --- |
| `可直接替换` | 0 | 无。OI-6 严格判据下，legacy 接口与替代接口在签名 / 对象 / 路由上均不同，无一可近乎机械替换。 |
| `有替代但需适配` | 25 | 代表：C:flags → `FlagSystem`、C:material → `TextureManager`、C:status → `CoreState`、C:maps → `MapState`、A-3-* 单例 `client`、A-7-2 音频回退。 |
| `有替代方案` | 40 | 代表：C:saves → `SaveSystem`、C:playSound → `SoundPlayer`、C:openBook → `BookUI`、C:drawTip → `TipStore`、A-1-2 patch → `Hookable`、A-6-* `Mota.require` → ESM 导入。 |
| `无替代` | 8 | 代表：C:formatBigNumber / C:calValue / C:replaceText / C:arrayToRGBA / C:getLvName / C:getMappedName / C:formatDate2、A-5-6 `triggerFullscreen`。 |
| `待定` | 26 | 代表：C:status 之外的 C:control / C:actions / C:platform / C:firstData、A-1-3 / A-5-1 / A-5-4 / A-5-5 `mainSetting`。均注明所缺信息。 |

### A / C 两节分布小计

| 节 | 可直接替换 | 有替代但需适配 | 有替代方案 | 无替代 | 待定 | 合计 |
| --- | --- | --- | --- | --- | --- | --- |
| A. 残余 legacy 接口 | 0 | 4 | 21 | 1 | 6 | 32 |
| C. 经 `core.*` 调用的接口 | 0 | 21 | 19 | 7 | 20 | 67 |
| **总计** | **0** | **25** | **40** | **8** | **26** | **99** |

### 机器可读计数（五类之和 = ENTRY-COUNT）

- ENTRY-COUNT: 99
- DIRECT-COUNT: 0
- ADAPT-COUNT: 25
- ALT-COUNT: 40
- NONE-COUNT: 8
- TBD-COUNT: 26

## 改造顺序建议

依判定结果给出建议的**改造顺序与分组**（理由 = 可替换性与影响面）：

1. **第一批 · 批量替换「有替代方案」的运行时调用（低风险，影响面清晰）**：`C:saves` / `C:getSave` / `C:getAllSaves` / `C:setLocalForage` / `C:removeLocalForage` / `C:removeSave` → `SaveSystem`（packages-user/client-base/src/save/system.ts:41）；`C:playSound` → `SoundPlayer`（packages/audio/src/sound.ts:74）；`C:drawTip` → `TipStore`（packages-user/client-base/src/components/tip.tsx:158）；`C:ui` → `mainUIController`（packages-user/client-modules/src/ui/controller.tsx:5）。这些为现成对象 / API，去 legacy 的收益/风险比最高。
2. **第二批 · 按主题分组的「有替代但需适配」**：
   - **audio 主题：** A-1-2 / A-4-1 / A-7-2 去 patch，改直连 `ClientCore` 音频成员（packages-user/client-modules/src/client.ts:44）；
   - **weather 主题：** A-1-5 / A-4-3 / A-7-4 → `WeatherController`（packages-user/client-modules/src/render/weather/controller.ts:11）；
   - **saves 主题：** `C:flags` / `C:setFlag` / `C:removeFlag` → `FlagSystem`（packages-user/data-base/src/flag/system.ts:5）；
   - **maps / material 主题：** `C:maps` / `C:floors` / `C:floorIds` → `MapState` / `MapStore`（packages-user/data-base/src/map/mapState.ts:17 与 packages-user/data-common/src/store/mapStore.ts:3）；`C:material` / `C:tilesets` → `TextureManager`（packages-user/client-base/src/material/manager.ts:37）；
   - **replay 主题：** `C:isPlaying` / `C:isReplaying` / `C:pauseReplay` / `C:resumeReplay` / `C:stopReplay` / `C:stepReplay` / `C:speedUpReplay` / `C:speedDownReplay` / `C:rewindReplay` / `C:encodeRoute` → `ReplaySystem` / `ReplaySandbox`（packages-user/data-common/src/replay/system.ts:21 与 packages-user/data-common/src/replay/sandbox.ts:70）；
   - **hero 主题：** `C:isMoving` / `C:turnHero` / `C:waitHeroToStop` → `HeroMover`（packages-user/data-base/src/hero/mover.ts:23）。
3. **第三批 · 「有替代方案」的 UI / 素材批量**：`C:openBook` / `C:openToolbox` / `C:openEquipbox` / `C:openQuickShop` → `BookUI` / `ToolBoxUI` / `EquipBoxUI` / `ShopUI`（packages-user/client-modules/src/ui/book.tsx:251 等）；A-7-5 素材加载 → `TextureManager`（packages-user/client-base/src/material/manager.ts:37）。
4. **第四批 · 「无替代」（先补功能设计）**：`C:formatBigNumber` / `C:formatDate2` / `C:replaceText` / `C:calValue` / `C:arrayToRGBA` / `C:getLvName` / `C:getMappedName` 与 A-5-6 `triggerFullscreen`——非 legacy 包尚无对应实现，须先补设计 / 迁移工具函数。
5. **第五批 · 「待定」（先待用户 / 设计裁定）**：`C:control` / `C:actions` / `C:platform` / `C:firstData` / `C:doSL` / `C:startGame` / `C:restart` / `C:syncSave` / `C:download` / `C:chooseReplayFile` / `C:extractBlocks` / `C:extractBlocksForUI` / `C:getAnimateFrames` / `C:getNextItem` / `C:flyTo` / `C:useFly` / `C:icons` / `C:removeLocalStorage` / `C:confirmRestart` / `C:doRegisteredAction` 与 A-1-3 / A-1-8 / A-1-10 / A-5-1 / A-5-4 / A-5-5（`mainSetting` / `generateBinary`）——先补设计或待用户裁定，**不得**臆造替代。

**总原则：** 先做「有替代方案」的批量机械替换（低风险、可验证），再按主题处理「有替代但需适配」（需逐调用点适配），「无替代」与「待定」先补功能 / 设计，避免在未定义替代的前提下强行改造。
