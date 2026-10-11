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
