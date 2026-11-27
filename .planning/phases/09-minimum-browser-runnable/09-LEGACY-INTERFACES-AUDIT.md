# Phase 9 · 任务 5：legacy 接口只读统计台账

> 本文件是 Phase 9 任务 5 的**只读统计产物**（`09-11-PLAN.md`）。全程只读：未修改 / 删除 / 新增任何生产 `.ts` / `.tsx` 源码，未做任何改造。§A / §B 见下，§C 与汇总见后续章节。

## 0. 统计口径与范围

### 0.1 统计范围（D-42）

- **统计对象：** 恰好两个包内的 `.ts` / `.tsx` 源码——
  - `packages-user/client-base/src`
  - `packages-user/client-modules/src`
- **排除：** `node_modules`、`dist` 及任何生成物。
- **不外扩：** `packages/**`、`packages-user/data-**`、`packages-user/client-system`、`entry-*`、`src/`（下述 A-2 对 `src/types/declaration/core.d.ts` 的引用为**类型声明引用**，非统计条目）。

### 0.2 legacy 判定基准

凡属于「旧引擎 / 旧架构遗留、尚未迁移到新接口」的构造，判为 legacy。判定依据为**显式依赖 legacy 包**（A-1）、**访问 legacy 全局 `core` / `Mota`**（A-2 / A-6）、**使用 legacy 单例 / patch 机制 / legacy UI 运行时符号**（A-3 / A-4 / A-5）或**位于 legacy 兼容 / 回退层**（A-7）。口径在下方 A-1..A-7 显式给出，**不臆造条目**。

### 0.3 分类口径 A-1..A-7（D-43①）

| 子类 | 名称 | 判定口径 |
| --- | --- | --- |
| A-1 | 跨包 legacy 依赖 | `import ... from '@motajs/legacy-ui'` / `'@motajs/legacy-common'` / `'@motajs/legacy-system'` 的导入语句 |
| A-2 | legacy 全局 `core` | 声明于 `src/types/declaration/core.d.ts` 的 legacy 全局 `core`；调用点归 C 节并交叉引用 |
| A-3 | legacy 单例 `client` | `packages-user/client-modules/src/core.ts` 导出的 `client` 单例及其使用点 |
| A-4 | legacy patch 机制 | `Patch` / `PatchClass` 及其 `new Patch(...)` / `.add(...)` |
| A-5 | legacy UI 运行时符号 | `mainUi` / `mainSetting` / `getVitualKeyOnce` / `triggerFullscreen` 的使用点 |
| A-6 | legacy `Mota` 全局 | `Mota.require(...)` 调用 |
| A-7 | legacy 兼容 / 回退层 | `packages-user/client-modules/src/fallback/**`（含用户所称 data-fallback；规划日未检索到 `data-fallback` 同名符号，OI-3） |

### 0.4 扫描方法论

- 用 `node` 递归遍历两包内 `.ts` / `.tsx`（跳过 `node_modules` / `dist`）。
- **代码级 `core.<member>` 的识别**使用 TypeScript 6.0.3 编译器 API（`ts.createSourceFile` + AST 遍历），仅收集 `PropertyAccessExpression`（`core.<member>`，取首成员）——**天然排除注释与字符串 / 模板字面量**。等价地，注释中的 `core.js`（见两包 `shared.ts` 第 11/13、32/34 行）**不计**。
- **A-1 / B** 使用 AST `ImportDeclaration`（模块说明符）与原文行扫描（`@deprecated` 字面量）。
- **计数粒度：** `A-COUNT` = A-1..A-7 各表登记**行数之和**（同一构造在不同视角下可能出现在多个子类，属有意为之，见 0.6）；`C-COUNT` = 代码级 `core.<member>` 访问点的**总条数**，另给出去重成员数 M 与覆盖文件数。

### 0.5 只读声明（D-45）

本文件是本次任务**唯一产物之一**（另一为 `09-11-SUMMARY.md`）。全程未改动任何 `.ts` / `.tsx`、任何既有注释或任何既有规划文件。文档使用裸 LF 行尾（随仓库既有 phase 文档约定）。所有 `file:line` 锚点取自执行日实测，指向真实存在且行号在范围内的行。

### 0.6 子类交叉引用说明

A 类子类之间允许**同一物理行**出现在不同子类（例如某行既是 A-1 的跨包依赖来源，其机制又归 A-4）：各子类按不同视角登记，便于后续改造分主题查阅。A-2 的 `core` 全局调用点**不在 A 节重复枚举**，统一在 C 节给出。

## A. 残余的 legacy 接口

### A-1 跨包 legacy 依赖

统计两包内 `import ... from '@motajs/legacy-ui' | '@motajs/legacy-common' | '@motajs/legacy-system'` 的导入语句（10 条）。

| 锚点 | 导入符号 | 来源包 | 说明 |
| --- | --- | --- | --- |
| `packages-user/client-modules/src/action/hotkey.ts:3` | `GameStorage` | `@motajs/legacy-system` | legacy 存档 / 存储系统 |
| `packages-user/client-modules/src/fallback/audio.ts:1` | `Patch`, `PatchClass` | `@motajs/legacy-common` | legacy patch 机制 |
| `packages-user/client-modules/src/fallback/audio.ts:2` | `mainSetting` | `@motajs/legacy-ui` | legacy 设置单例 |
| `packages-user/client-modules/src/fallback/ui.ts:1` | `Patch`, `PatchClass` | `@motajs/legacy-common` | legacy patch 机制 |
| `packages-user/client-modules/src/fallback/weather.ts:1` | `Patch`, `PatchClass` | `@motajs/legacy-common` | legacy patch 机制 |
| `packages-user/client-modules/src/ui/settings.tsx:13` | `mainUi` | `@motajs/legacy-ui` | legacy 主 UI 运行时 |
| `packages-user/client-modules/src/ui/settings.tsx:15` | `getVitualKeyOnce` | `@motajs/legacy-ui` | legacy 虚拟按键输入 |
| `packages-user/client-modules/src/ui/title.tsx:28` | `mainSetting`, `triggerFullscreen` | `@motajs/legacy-ui` | legacy 设置单例 / 全屏控制 |
| `packages-user/client-modules/src/ui/toolbar.tsx:14` | `getVitualKeyOnce` | `@motajs/legacy-ui` | legacy 虚拟按键输入 |
| `packages-user/client-modules/src/ui/toolbar.tsx:20` | `generateBinary` | `@motajs/legacy-common` | legacy 二进制生成工具 |

### A-2 legacy 全局 `core`

legacy 全局 `core` 的**类型声明**位于 `src/types/declaration/core.d.ts:1`（**范围外的类型声明引用**，非统计条目）。两包内对其的**全部代码级 `core.<member>` 调用点**统一在 §C 枚举，本节不重复列举。判定依据见 §0.4 方法论（AST 精确识别，排除注释 / 字符串）。

| 锚点（引用） | 符号 | 来源 | 说明 |
| --- | --- | --- | --- |
| `src/types/declaration/core.d.ts:1` | `core` | 全局声明（范围外） | legacy 全局 `core` 本体声明；调用点见 §C |

### A-3 legacy 单例 `client`

`client` 单例定义于 `packages-user/client-modules/src/core.ts`，使用点仅见于 `fallback/audio.ts`（3 条）。

| 锚点 | 符号 | 类别 | 说明 |
| --- | --- | --- | --- |
| `packages-user/client-modules/src/core.ts:6` | `client` | 定义 | `export const client = new ClientCore(...)` 单例 |
| `packages-user/client-modules/src/fallback/audio.ts:5` | `client` | 使用 | `import { client } from '../core'` |
| `packages-user/client-modules/src/fallback/audio.ts:11` | `client` | 使用 | `const { bgmPlayer, soundPlayer, audioContext } = client` |

> 说明：`packages-user/client-modules/src/loader/hook.ts:7` 的 `client` 是**局部变量**（`loader.getConfig<IClientConfig>('client')`），**非**本 legacy 单例，**不计入**。

### A-4 legacy patch 机制（`Patch` / `PatchClass`）

`Patch` / `PatchClass` 的实例化点（3 条）；导入来源见 A-1，`.add(...)` 为向 legacy patch 挂载方法。

| 锚点 | 符号 | 说明 |
| --- | --- | --- |
| `packages-user/client-modules/src/fallback/audio.ts:10` | `new Patch(PatchClass.Control)` | 挂载 `playBgm` / `pauseBgm` / `resumeBgm` / `checkBgm` / `triggerBgm` / `playSound` / `stopSound` / `getPlayingSounds`（`.add` 见 20/23/26/29/41/46/61/68） |
| `packages-user/client-modules/src/fallback/ui.ts:5` | `new Patch(PatchClass.UI)` | 挂载 `drawTip`（`.add` 见 7） |
| `packages-user/client-modules/src/fallback/weather.ts:8` | `new Patch(PatchClass.Control)` | 挂载 `setWeather`（`.add` 见 12） |

### A-5 legacy UI 运行时符号

`mainUi` / `mainSetting` / `getVitualKeyOnce` / `triggerFullscreen` 的**使用点**（不含导入行，7 条；导入行见 A-1）。

| 锚点 | 符号 | 说明 |
| --- | --- | --- |
| `packages-user/client-modules/src/fallback/audio.ts:31` | `mainSetting` | `mainSetting.getValue('audio.bgmEnabled')` |
| `packages-user/client-modules/src/ui/settings.tsx:67` | `mainUi` | `mainUi.open('settings')` |
| `packages-user/client-modules/src/ui/settings.tsx:71` | `getVitualKeyOnce` | `getVitualKeyOnce().then(...)` |
| `packages-user/client-modules/src/ui/title.tsx:303` | `mainSetting` | `mainSetting.getValue('audio.bgmEnabled', true)` |
| `packages-user/client-modules/src/ui/title.tsx:334` | `mainSetting` | `mainSetting.setValue('audio.bgmEnabled', ...)` |
| `packages-user/client-modules/src/ui/title.tsx:343` | `triggerFullscreen` | `await triggerFullscreen(!fullscreen.value)` |
| `packages-user/client-modules/src/ui/toolbar.tsx:101` | `getVitualKeyOnce` | `getVitualKeyOnce().then(...)` |

### A-6 legacy `Mota` 全局（`Mota.require(...)`）

| 锚点 | 符号 | 说明 |
| --- | --- | --- |
| `packages-user/client-base/src/elements/cache.ts:491` | `Mota.require` | `const { loading } = Mota.require('@user/data-base')` |
| `packages-user/client-base/src/elements/misc.ts:89` | `Mota.require` | `const { loading } = Mota.require('@user/data-base')` |
| `packages-user/client-base/src/elements/misc.ts:219` | `Mota.require` | `const { loading } = Mota.require('@user/data-base')` |

### A-7 legacy 兼容 / 回退层（`fallback/**`）

含用户所称 data-fallback 的兼容 / 回退层（5 个文件，OI-3）。

| 锚点 | 文件 | 说明 |
| --- | --- | --- |
| `packages-user/client-modules/src/fallback/index.ts:1` | `fallback/index.ts` | 回退层入口 `patchAll()`（调用 `patchAudio` / `patchWeather` / `patchUI`） |
| `packages-user/client-modules/src/fallback/audio.ts:1` | `fallback/audio.ts` | legacy 音频回退（patch `core` 音频接口） |
| `packages-user/client-modules/src/fallback/ui.ts:1` | `fallback/ui.ts` | legacy UI 回退（patch `drawTip`） |
| `packages-user/client-modules/src/fallback/weather.ts:1` | `fallback/weather.ts` | legacy 天气回退（patch `setWeather`） |
| `packages-user/client-modules/src/fallback/load.ts:1` | `fallback/load.ts` | 旧版素材加载兼容（`fallbackLoad`） |

**A-COUNT: 32**

## B. 标注 @deprecated 的接口

### B.1 扫描范围与匹配方式

- **扫描范围：** `packages-user/client-base/src` 与 `packages-user/client-modules/src` 内全部 `.ts` / `.tsx`（排除 `node_modules` / `dist`）。
- **匹配方式：** 对每行原文匹配 `@deprecated` 字面量（JSDoc 标注）。

### B.2 结果

**实测：0 条。** 两包内未出现任何 `@deprecated` 标注（与规划日实测一致）。本节**显式报告 0 条**，不省略。

| 锚点 | 符号 | 说明 |
| --- | --- | --- |
| （无） | （无） | 两包内 0 条 `@deprecated` |

**B-COUNT: 0**

## C. 所有经 core.* 调用的接口

### C.0 扫描口径

- **范围：** 同 §0.1（恰好两包内 `.ts` / `.tsx`，排除 `node_modules` / `dist`）。
- **匹配：** 用 TypeScript 编译器 API 遍历 AST，收集 `PropertyAccessExpression`（`core.<member>`，取**首成员**，如 `core.status.x` 记 `core.status`）。
- **排除：** 注释（`//` / `/* */`）与字符串 / 模板字面量——**天然排除**，故两包 `shared.ts` 注释中的 `core.js`（第 11/13、32/34 行）**不计**。
- **计数：** `C-COUNT` = 全部代码级 `core.<member>` 访问点总条数；另给出去重成员数 M 与覆盖文件数。

### C-1 去重成员清单（`core.<member>`，M = 67）

`core.actions`、`core.arrayToRGBA`、`core.calValue`、`core.chooseReplayFile`、`core.clearLocalForage`、`core.confirmRestart`、`core.control`、`core.debug`、`core.doRegisteredAction`、`core.doSL`、`core.download`、`core.drawThumbnail`、`core.drawTip`、`core.encodeRoute`、`core.extractBlocks`、`core.extractBlocksForUI`、`core.firstData`、`core.flags`、`core.floorIds`、`core.floors`、`core.flyTo`、`core.formatBigNumber`、`core.formatDate2`、`core.getAllSaves`、`core.getAnimateFrames`、`core.getLvName`、`core.getMappedName`、`core.getNextItem`、`core.getSave`、`core.getTilesetOffset`、`core.hasItem`、`core.icons`、`core.isMoving`、`core.isPlaying`、`core.isReplaying`、`core.maps`、`core.material`、`core.openBook`、`core.openEquipbox`、`core.openQuickShop`、`core.openToolbox`、`core.pauseReplay`、`core.platform`、`core.playSound`、`core.removeFlag`、`core.removeLocalForage`、`core.removeLocalStorage`、`core.removeSave`、`core.replaceText`、`core.restart`、`core.resumeReplay`、`core.rewindReplay`、`core.saves`、`core.setFlag`、`core.setLocalForage`、`core.speedDownReplay`、`core.speedUpReplay`、`core.startGame`、`core.status`、`core.stepReplay`、`core.stopReplay`、`core.syncSave`、`core.tilesets`、`core.turnHero`、`core.ui`、`core.useFly`、`core.waitHeroToStop`

### C-2 按文件调用点（逐条 `file:line`）

#### packages-user/client-base/src/components/choices.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-base/src/components/choices.tsx:677 | `core.status` | `const route = core.status.replay.toReplay[0];` |
| packages-user/client-base/src/components/choices.tsx:717 | `core.isReplaying` | `if (core.isReplaying()) {` |
| packages-user/client-base/src/components/choices.tsx:719 | `core.control` | `const timeout = core.control.__replay_getTimeout();` |
| packages-user/client-base/src/components/choices.tsx:720 | `core.status` | `` core.status.route.push(`choices:${confirm ? 0 : 1}`); `` |
| packages-user/client-base/src/components/choices.tsx:721 | `core.status` | `core.status.replay.toReplay.shift();` |
| packages-user/client-base/src/components/choices.tsx:730 | `core.control` | `await sleep(core.control.__replay_getTimeout());` |
| packages-user/client-base/src/components/choices.tsx:735 | `core.status` | `` core.status.route.push(`choices:${confirm ? 0 : 1}`); `` |
| packages-user/client-base/src/components/choices.tsx:772 | `core.isReplaying` | `if (core.isReplaying()) {` |
| packages-user/client-base/src/components/choices.tsx:774 | `core.control` | `const timeout = core.control.__replay_getTimeout();` |
| packages-user/client-base/src/components/choices.tsx:775 | `core.status` | `` core.status.route.push(`choices:${selected}`); `` |
| packages-user/client-base/src/components/choices.tsx:776 | `core.status` | `core.status.replay.toReplay.shift();` |
| packages-user/client-base/src/components/choices.tsx:785 | `core.control` | `await sleep(core.control.__replay_getTimeout());` |
| packages-user/client-base/src/components/choices.tsx:791 | `core.status` | `` core.status.route.push(`choices:${index}`); `` |

#### packages-user/client-base/src/components/floorSelect.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-base/src/components/floorSelect.tsx:62 | `core.floors` | `const floorName = computed(() => core.floors[floorId.value].title);` |
| packages-user/client-base/src/components/floorSelect.tsx:181 | `core.floors` | `const floor = core.floors[v];` |

#### packages-user/client-base/src/components/misc.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-base/src/components/misc.tsx:315 | `core.material` | `isWinskin.value ? core.material.images.images[props.winskin!] : null` |

#### packages-user/client-base/src/components/textboxTyper.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-base/src/components/textboxTyper.ts:907 | `core.calValue` | `this.resolved += core.calValue(exp);` |

#### packages-user/client-base/src/components/thumbnail.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-base/src/components/thumbnail.tsx:75 | `core.drawThumbnail` | `core.drawThumbnail(props.floorId, props.map, options);` |

#### packages-user/client-base/src/components/tip.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-base/src/components/tip.tsx:104 | `core.replaceText` | `text.value = core.replaceText(tipText);` |

#### packages-user/client-base/src/elements/cache.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-base/src/elements/cache.ts:11 | `core.material` | `return core.material.images[img];` |
| packages-user/client-base/src/elements/cache.ts:87 | `core.material` | `this.tileset = core.material.images.tilesets;` |
| packages-user/client-base/src/elements/cache.ts:89 | `core.material` | `this.images = core.material.images.images;` |
| packages-user/client-base/src/elements/cache.ts:131 | `core.getTilesetOffset` | `const offset = core.getTilesetOffset(num);` |
| packages-user/client-base/src/elements/cache.ts:151 | `core.material` | `const img = core.material.images[cls];` |
| packages-user/client-base/src/elements/cache.ts:202 | `core.material` | `core.material.images[` |
| packages-user/client-base/src/elements/cache.ts:206 | `core.getAnimateFrames` | `const frame = core.getAnimateFrames(cls);` |
| packages-user/client-base/src/elements/cache.ts:393 | `core.material` | `for (const [key, img] of Object.entries(core.material.images.autotile)) {` |
| packages-user/client-base/src/elements/cache.ts:469 | `core.material` | `for (const [key, img] of Object.entries(core.material.images.autotile)) {` |

#### packages-user/client-base/src/elements/misc.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-base/src/elements/misc.ts:221 | `core.material` | `const image = core.material.images.images[name];` |
| packages-user/client-base/src/elements/misc.ts:228 | `core.material` | `const image = core.material.images.images[id];` |

#### packages-user/client-modules/src/action/hotkey.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/action/hotkey.ts:478 | `core.status` | `!core.status.lockControl && !core.isMoving() && !core.isReplaying()` |
| packages-user/client-modules/src/action/hotkey.ts:478 | `core.isMoving` | `!core.status.lockControl && !core.isMoving() && !core.isReplaying()` |
| packages-user/client-modules/src/action/hotkey.ts:478 | `core.isReplaying` | `!core.status.lockControl && !core.isMoving() && !core.isReplaying()` |
| packages-user/client-modules/src/action/hotkey.ts:481 | `core.openBook` | `core.openBook(true);` |
| packages-user/client-modules/src/action/hotkey.ts:484 | `core.openToolbox` | `core.openToolbox(true);` |
| packages-user/client-modules/src/action/hotkey.ts:487 | `core.openEquipbox` | `core.openEquipbox(true);` |
| packages-user/client-modules/src/action/hotkey.ts:490 | `core.useFly` | `core.useFly(true);` |
| packages-user/client-modules/src/action/hotkey.ts:493 | `core.openQuickShop` | `core.openQuickShop(true);` |
| packages-user/client-modules/src/action/hotkey.ts:496 | `core.doSL` | `core.doSL('autoSave', 'load');` |
| packages-user/client-modules/src/action/hotkey.ts:499 | `core.doSL` | `core.doSL('autoSave', 'reload');` |
| packages-user/client-modules/src/action/hotkey.ts:502 | `core.turnHero` | `core.turnHero();` |
| packages-user/client-modules/src/action/hotkey.ts:505 | `core.getNextItem` | `core.getNextItem();` |
| packages-user/client-modules/src/action/hotkey.ts:508 | `core.confirmRestart` | `core.confirmRestart();` |
| packages-user/client-modules/src/action/hotkey.ts:511 | `core.actions` | `core.actions._clickGameInfo_openComments();` |
| packages-user/client-modules/src/action/hotkey.ts:514 | `core.debug` | `core.debug();` |

#### packages-user/client-modules/src/action/move.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/action/move.ts:66 | `core.isReplaying` | `if (core.isReplaying() \|\| !core.isPlaying()) return;` |
| packages-user/client-modules/src/action/move.ts:66 | `core.isPlaying` | `if (core.isReplaying() \|\| !core.isPlaying()) return;` |
| packages-user/client-modules/src/action/move.ts:67 | `core.waitHeroToStop` | `core.waitHeroToStop();` |
| packages-user/client-modules/src/action/move.ts:97 | `core.status` | `if (this.hotkey.scope !== this.scope \|\| core.status.lockControl) return;` |
| packages-user/client-modules/src/action/move.ts:123 | `core.status` | `if (this.moving \|\| core.status.lockControl) return false;` |
| packages-user/client-modules/src/action/move.ts:156 | `core.status` | `if (core.status.lockControl) {` |

#### packages-user/client-modules/src/client.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/client.ts:75 | `core.firstData` | `` this.save.init(`@game/${core.firstData.name}`); `` |

#### packages-user/client-modules/src/fallback/audio.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/fallback/audio.ts:49 | `core.getMappedName` | `const name = core.getMappedName(sound) as SoundIds;` |

#### packages-user/client-modules/src/fallback/load.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/fallback/load.ts:44 | `core.maps` | `const id = core.maps.blocksInfo[v as keyof NumberToId];` |
| packages-user/client-modules/src/fallback/load.ts:55 | `core.icons` | `const icons = core.icons.icons;` |
| packages-user/client-modules/src/fallback/load.ts:56 | `core.material` | `const images = core.material.images;` |
| packages-user/client-modules/src/fallback/load.ts:59 | `core.maps` | `for (const [key, value] of Object.entries(core.maps.blocksInfo)) {` |
| packages-user/client-modules/src/fallback/load.ts:99 | `core.tilesets` | `core.tilesets.forEach((v, i) => {` |
| packages-user/client-modules/src/fallback/load.ts:111 | `core.floorIds` | `core.floorIds.forEach(v => {` |
| packages-user/client-modules/src/fallback/load.ts:112 | `core.floors` | `const floor = core.floors[v];` |

#### packages-user/client-modules/src/render/utils/saves.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/render/utils/saves.ts:21 | `core.getSave` | `core.getSave(index, data => {` |
| packages-user/client-modules/src/render/utils/saves.ts:27 | `core.firstData` | `name: core.firstData.name,` |
| packages-user/client-modules/src/render/utils/saves.ts:28 | `core.firstData` | `version: core.firstData.version,` |
| packages-user/client-modules/src/render/utils/saves.ts:38 | `core.getAllSaves` | `core.getAllSaves(saves => {` |
| packages-user/client-modules/src/render/utils/saves.ts:44 | `core.firstData` | `name: core.firstData.name,` |
| packages-user/client-modules/src/render/utils/saves.ts:45 | `core.firstData` | `version: core.firstData.version,` |
| packages-user/client-modules/src/render/utils/saves.ts:103 | `core.firstData` | `formData.append('name', core.firstData.name);` |
| packages-user/client-modules/src/render/utils/saves.ts:172 | `core.setLocalForage` | `core.setLocalForage('save' + i, result[i - 1]);` |
| packages-user/client-modules/src/render/utils/saves.ts:173 | `core.saves` | `} else if (core.saves.ids[i]) {` |
| packages-user/client-modules/src/render/utils/saves.ts:174 | `core.removeLocalForage` | `core.removeLocalForage('save' + i);` |
| packages-user/client-modules/src/render/utils/saves.ts:185 | `core.saves` | `const idx = core.saves.saveIndex;` |
| packages-user/client-modules/src/render/utils/saves.ts:187 | `core.setLocalForage` | `` core.setLocalForage(`save${idx}`, result, res); `` |

#### packages-user/client-modules/src/render/weather/presets/cloud.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/render/weather/presets/cloud.ts:6 | `core.material` | `return core.material.images.images['cloud.png'] ?? null;` |

#### packages-user/client-modules/src/render/weather/presets/fog.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/render/weather/presets/fog.ts:22 | `core.material` | `const image = core.material.images.images['fog.png'];` |

#### packages-user/client-modules/src/render/weather/presets/sun.ts

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/render/weather/presets/sun.ts:50 | `core.material` | `this.image = core.material.images.images['sun.png'];` |

#### packages-user/client-modules/src/ui/book.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/book.tsx:55 | `core.formatBigNumber` | `return core.formatBigNumber(value);` |

#### packages-user/client-modules/src/ui/bookDetail.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/bookDetail.tsx:99 | `core.formatBigNumber` | `const format = (value: number) => core.formatBigNumber(value);` |

#### packages-user/client-modules/src/ui/main.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/main.tsx:66 | `core.status` | `const len = core.status.stepPostfix?.length ?? 0;` |
| packages-user/client-modules/src/ui/main.tsx:76 | `core.status` | `const step = core.status.stepPostfix;` |
| packages-user/client-modules/src/ui/main.tsx:109 | `core.doRegisteredAction` | `core.doRegisteredAction('onup', bx, by, ev.offsetX, ev.offsetY);` |
| packages-user/client-modules/src/ui/main.tsx:118 | `core.doRegisteredAction` | `core.doRegisteredAction('ondown', bx, by, ev.offsetX, ev.offsetY);` |
| packages-user/client-modules/src/ui/main.tsx:127 | `core.doRegisteredAction` | `core.doRegisteredAction('onmove', bx, by, ev.offsetX, ev.offsetY);` |

#### packages-user/client-modules/src/ui/save.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/save.tsx:96 | `core.formatBigNumber` | `const hp = core.formatBigNumber(hero.hp);` |
| packages-user/client-modules/src/ui/save.tsx:97 | `core.formatBigNumber` | `const atk = core.formatBigNumber(hero.atk);` |
| packages-user/client-modules/src/ui/save.tsx:98 | `core.formatBigNumber` | `const def = core.formatBigNumber(hero.def);` |
| packages-user/client-modules/src/ui/save.tsx:118 | `core.maps` | `const map = core.maps.loadMap(currData.maps, currData.floorId);` |
| packages-user/client-modules/src/ui/save.tsx:119 | `core.extractBlocksForUI` | `core.extractBlocksForUI(map, currData.hero.flags); // 这一步会向map写入blocks` |
| packages-user/client-modules/src/ui/save.tsx:250 | `core.saves` | `const startIndex = getPosIndex(core.saves.saveIndex);` |
| packages-user/client-modules/src/ui/save.tsx:253 | `core.saves` | `Math.floor(core.saves.saveIndex / (grid.value.count - 1))` |
| packages-user/client-modules/src/ui/save.tsx:531 | `core.drawTip` | `core.drawTip(validation.message);` |
| packages-user/client-modules/src/ui/save.tsx:538 | `core.removeSave` | `core.removeSave(index);` |
| packages-user/client-modules/src/ui/save.tsx:540 | `core.drawTip` | `core.drawTip(validation.message);` |
| packages-user/client-modules/src/ui/save.tsx:570 | `core.doSL` | `core.doSL(index + 1, 'save');` |
| packages-user/client-modules/src/ui/save.tsx:591 | `core.doSL` | `core.doSL('autoSave', 'load');` |
| packages-user/client-modules/src/ui/save.tsx:593 | `core.doSL` | `core.doSL(index + 1, 'load');` |

#### packages-user/client-modules/src/ui/settings.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/settings.tsx:108 | `core.restart` | `core.restart();` |
| packages-user/client-modules/src/ui/settings.tsx:160 | `core.ui` | `core.ui.closePanel();` |
| packages-user/client-modules/src/ui/settings.tsx:161 | `core.status` | `const route = core.status.route.slice();` |
| packages-user/client-modules/src/ui/settings.tsx:165 | `core.startGame` | `core.startGame(core.status.hard, seed, route);` |
| packages-user/client-modules/src/ui/settings.tsx:165 | `core.status` | `core.startGame(core.status.hard, seed, route);` |
| packages-user/client-modules/src/ui/settings.tsx:172 | `core.doSL` | `core.doSL('autoSave', 'replayLoad');` |
| packages-user/client-modules/src/ui/settings.tsx:174 | `core.doSL` | `core.doSL(index + 1, 'replayLoad');` |
| packages-user/client-modules/src/ui/settings.tsx:183 | `core.doSL` | `const success = core.doSL(name, 'replayRemain');` |
| packages-user/client-modules/src/ui/settings.tsx:197 | `core.doSL` | `core.doSL(name2, 'replayRemain');` |
| packages-user/client-modules/src/ui/settings.tsx:205 | `core.doSL` | `core.doSL('autoSave', 'replaySince');` |
| packages-user/client-modules/src/ui/settings.tsx:207 | `core.doSL` | `core.doSL(index + 1, 'replaySince');` |
| packages-user/client-modules/src/ui/settings.tsx:214 | `core.chooseReplayFile` | `core.chooseReplayFile();` |
| packages-user/client-modules/src/ui/settings.tsx:221 | `core.download` | `core.download(` |
| packages-user/client-modules/src/ui/settings.tsx:222 | `core.firstData` | `core.firstData.name + '_' + core.formatDate2() + '.h5route',` |
| packages-user/client-modules/src/ui/settings.tsx:222 | `core.formatDate2` | `core.firstData.name + '_' + core.formatDate2() + '.h5route',` |
| packages-user/client-modules/src/ui/settings.tsx:225 | `core.firstData` | `name: core.firstData.name,` |
| packages-user/client-modules/src/ui/settings.tsx:226 | `core.status` | `hard: core.status.hard,` |
| packages-user/client-modules/src/ui/settings.tsx:228 | `core.encodeRoute` | `route: core.encodeRoute(core.status.route)` |
| packages-user/client-modules/src/ui/settings.tsx:228 | `core.status` | `route: core.encodeRoute(core.status.route)` |
| packages-user/client-modules/src/ui/settings.tsx:282 | `core.platform` | `if (core.platform.isPC) window.open('editor.html', '_blank');` |
| packages-user/client-modules/src/ui/settings.tsx:297 | `core.firstData` | `const name = core.firstData.name;` |
| packages-user/client-modules/src/ui/settings.tsx:299 | `core.platform` | `if (core.platform.isPC) {` |
| packages-user/client-modules/src/ui/settings.tsx:315 | `core.firstData` | `const name = core.firstData.name;` |
| packages-user/client-modules/src/ui/settings.tsx:317 | `core.platform` | `if (core.platform.isPC) window.open(href);` |
| packages-user/client-modules/src/ui/settings.tsx:431 | `core.playSound` | `core.playSound('confirm.opus');` |
| packages-user/client-modules/src/ui/settings.tsx:439 | `core.syncSave` | `core.syncSave('all');` |
| packages-user/client-modules/src/ui/settings.tsx:444 | `core.playSound` | `core.playSound('confirm.opus');` |
| packages-user/client-modules/src/ui/settings.tsx:452 | `core.syncSave` | `core.syncSave();` |
| packages-user/client-modules/src/ui/settings.tsx:502 | `core.download` | `core.download(` |
| packages-user/client-modules/src/ui/settings.tsx:503 | `core.firstData` | `` `${core.firstData.name}_${core.formatDate2( `` |
| packages-user/client-modules/src/ui/settings.tsx:503 | `core.formatDate2` | `` `${core.firstData.name}_${core.formatDate2( `` |
| packages-user/client-modules/src/ui/settings.tsx:519 | `core.saves` | `const data = await getSaveData(core.saves.saveIndex);` |
| packages-user/client-modules/src/ui/settings.tsx:520 | `core.download` | `core.download(` |
| packages-user/client-modules/src/ui/settings.tsx:521 | `core.firstData` | `` `${core.firstData.name}_${core.formatDate2( `` |
| packages-user/client-modules/src/ui/settings.tsx:521 | `core.formatDate2` | `` `${core.firstData.name}_${core.formatDate2( `` |
| packages-user/client-modules/src/ui/settings.tsx:573 | `core.clearLocalForage` | `core.clearLocalForage(() => {` |
| packages-user/client-modules/src/ui/settings.tsx:574 | `core.saves` | `core.saves.ids = {};` |
| packages-user/client-modules/src/ui/settings.tsx:575 | `core.saves` | `core.saves.autosave.data = null;` |
| packages-user/client-modules/src/ui/settings.tsx:576 | `core.saves` | `core.saves.autosave.updated = false;` |
| packages-user/client-modules/src/ui/settings.tsx:577 | `core.saves` | `core.saves.autosave.now = 0;` |
| packages-user/client-modules/src/ui/settings.tsx:579 | `core.saves` | `core.saves.cache = {};` |
| packages-user/client-modules/src/ui/settings.tsx:580 | `core.saves` | `core.saves.saveIndex = 1;` |
| packages-user/client-modules/src/ui/settings.tsx:581 | `core.saves` | `core.saves.favorite = [];` |
| packages-user/client-modules/src/ui/settings.tsx:582 | `core.saves` | `core.saves.favoriteName = {};` |
| packages-user/client-modules/src/ui/settings.tsx:584 | `core.control` | `core.control._updateFavoriteSaves();` |
| packages-user/client-modules/src/ui/settings.tsx:585 | `core.removeLocalStorage` | `core.removeLocalStorage('saveIndex');` |
| packages-user/client-modules/src/ui/settings.tsx:613 | `core.saves` | `Object.keys(core.saves.ids).forEach(function (v) {` |
| packages-user/client-modules/src/ui/settings.tsx:614 | `core.removeLocalForage` | `core.removeLocalForage('save' + v);` |
| packages-user/client-modules/src/ui/settings.tsx:616 | `core.removeLocalForage` | `core.removeLocalForage('autoSave', () => {` |
| packages-user/client-modules/src/ui/settings.tsx:617 | `core.saves` | `core.saves.ids = {};` |
| packages-user/client-modules/src/ui/settings.tsx:618 | `core.saves` | `core.saves.autosave.data = null;` |
| packages-user/client-modules/src/ui/settings.tsx:619 | `core.saves` | `core.saves.autosave.updated = false;` |
| packages-user/client-modules/src/ui/settings.tsx:620 | `core.saves` | `core.saves.autosave.now = 0;` |
| packages-user/client-modules/src/ui/settings.tsx:621 | `core.ui` | `core.ui.closePanel();` |
| packages-user/client-modules/src/ui/settings.tsx:622 | `core.saves` | `core.saves.saveIndex = 1;` |
| packages-user/client-modules/src/ui/settings.tsx:623 | `core.saves` | `core.saves.favorite = [];` |
| packages-user/client-modules/src/ui/settings.tsx:624 | `core.saves` | `core.saves.favoriteName = {};` |
| packages-user/client-modules/src/ui/settings.tsx:626 | `core.control` | `core.control._updateFavoriteSaves();` |
| packages-user/client-modules/src/ui/settings.tsx:627 | `core.removeLocalStorage` | `core.removeLocalStorage('saveIndex');` |

#### packages-user/client-modules/src/ui/shop.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/shop.tsx:288 | `core.formatBigNumber` | `text={core.formatBigNumber(item.stock)}` |
| packages-user/client-modules/src/ui/shop.tsx:337 | `core.formatBigNumber` | `entry ? core.formatBigNumber(entry.buyPrice) : '-'` |
| packages-user/client-modules/src/ui/shop.tsx:353 | `core.formatBigNumber` | `entry ? core.formatBigNumber(entry.sellPrice) : '-'` |
| packages-user/client-modules/src/ui/shop.tsx:368 | `core.formatBigNumber` | `text={entry ? core.formatBigNumber(entry.stock) : '-'}` |
| packages-user/client-modules/src/ui/shop.tsx:382 | `core.formatBigNumber` | `text={entry ? core.formatBigNumber(entry.owned) : '-'}` |
| packages-user/client-modules/src/ui/shop.tsx:396 | `core.formatBigNumber` | `text={core.formatBigNumber(total)}` |

#### packages-user/client-modules/src/ui/statistics.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/statistics.tsx:145 | `core.setFlag` | `core.setFlag('__statistics__', true);` |
| packages-user/client-modules/src/ui/statistics.tsx:149 | `core.status` | `const hero = core.status.hero;` |
| packages-user/client-modules/src/ui/statistics.tsx:163 | `core.status` | `core.status.hero = proxy;` |
| packages-user/client-modules/src/ui/statistics.tsx:165 | `core.extractBlocks` | `core.extractBlocks(floorId);` |
| packages-user/client-modules/src/ui/statistics.tsx:179 | `core.status` | `core.status.maps[floorId].blocks.forEach(v => {` |
| packages-user/client-modules/src/ui/statistics.tsx:220 | `core.status` | `core.status.hero = hero;` |
| packages-user/client-modules/src/ui/statistics.tsx:222 | `core.status` | `window.flags = core.status.hero.flags;` |
| packages-user/client-modules/src/ui/statistics.tsx:224 | `core.removeFlag` | `core.removeFlag('__statistics__');` |
| packages-user/client-modules/src/ui/statistics.tsx:229 | `core.setFlag` | `core.setFlag('__statistics__', true);` |
| packages-user/client-modules/src/ui/statistics.tsx:230 | `core.status` | `const hero = core.status.hero;` |
| packages-user/client-modules/src/ui/statistics.tsx:245 | `core.status` | `core.status.hero = proxy;` |
| packages-user/client-modules/src/ui/statistics.tsx:248 | `core.floorIds` | `core.floorIds.forEach(v => {` |
| packages-user/client-modules/src/ui/statistics.tsx:253 | `core.status` | `core.status.hero = hero;` |
| packages-user/client-modules/src/ui/statistics.tsx:255 | `core.status` | `window.flags = core.status.hero.flags;` |
| packages-user/client-modules/src/ui/statistics.tsx:256 | `core.removeFlag` | `core.removeFlag('__statistics__');` |

#### packages-user/client-modules/src/ui/statusBar.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/statusBar.tsx:183 | `core.getLvName` | `s.lv = core.getLvName(` |
| packages-user/client-modules/src/ui/statusBar.tsx:193 | `core.status` | `if (map) s.floor = core.status.floorId;` |
| packages-user/client-modules/src/ui/statusBar.tsx:208 | `core.floors` | `const floorName = computed(() => core.floors[s.floor]?.title ?? '');` |
| packages-user/client-modules/src/ui/statusBar.tsx:227 | `core.flags` | `const list = core.flags.statusBarItems;` |
| packages-user/client-modules/src/ui/statusBar.tsx:246 | `core.formatBigNumber` | `const hp = core.formatBigNumber(s.hp);` |
| packages-user/client-modules/src/ui/statusBar.tsx:247 | `core.formatBigNumber` | `const hpmax = core.formatBigNumber(s.hpmax);` |
| packages-user/client-modules/src/ui/statusBar.tsx:257 | `core.formatBigNumber` | `value: computed(() => core.formatBigNumber(s.hp)),` |
| packages-user/client-modules/src/ui/statusBar.tsx:269 | `core.formatBigNumber` | `const mana = core.formatBigNumber(s.mana);` |
| packages-user/client-modules/src/ui/statusBar.tsx:270 | `core.formatBigNumber` | `const manamax = core.formatBigNumber(s.manamax);` |
| packages-user/client-modules/src/ui/statusBar.tsx:288 | `core.formatBigNumber` | `value: computed(() => core.formatBigNumber(s.atk)),` |
| packages-user/client-modules/src/ui/statusBar.tsx:298 | `core.formatBigNumber` | `value: computed(() => core.formatBigNumber(s.def)),` |
| packages-user/client-modules/src/ui/statusBar.tsx:308 | `core.formatBigNumber` | `value: computed(() => core.formatBigNumber(s.mdef)),` |
| packages-user/client-modules/src/ui/statusBar.tsx:318 | `core.formatBigNumber` | `value: computed(() => core.formatBigNumber(s.money)),` |
| packages-user/client-modules/src/ui/statusBar.tsx:330 | `core.formatBigNumber` | `value: computed(() => core.formatBigNumber(s.up)),` |
| packages-user/client-modules/src/ui/statusBar.tsx:338 | `core.formatBigNumber` | `value: computed(() => core.formatBigNumber(s.exp)),` |

#### packages-user/client-modules/src/ui/title.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/title.tsx:122 | `core.arrayToRGBA` | `color: core.arrayToRGBA(v.color!),` |
| packages-user/client-modules/src/ui/title.tsx:210 | `core.chooseReplayFile` | `core.chooseReplayFile();` |
| packages-user/client-modules/src/ui/title.tsx:223 | `core.startGame` | `core.startGame(hard);` |
| packages-user/client-modules/src/ui/title.tsx:364 | `core.firstData` | `text={core.firstData.title}` |

#### packages-user/client-modules/src/ui/toolbar.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/toolbar.tsx:89 | `core.openBook` | `const book = () => core.openBook(true);` |
| packages-user/client-modules/src/ui/toolbar.tsx:90 | `core.openToolbox` | `const tool = () => core.openToolbox(true);` |
| packages-user/client-modules/src/ui/toolbar.tsx:91 | `core.useFly` | `const fly = () => core.useFly(true);` |
| packages-user/client-modules/src/ui/toolbar.tsx:98 | `core.openEquipbox` | `const equip = () => core.openEquipbox(true);` |
| packages-user/client-modules/src/ui/toolbar.tsx:99 | `core.openQuickShop` | `const shop = () => core.openQuickShop(true);` |
| packages-user/client-modules/src/ui/toolbar.tsx:110 | `core.doSL` | `const undo = () => core.doSL('autoSave', 'load');` |
| packages-user/client-modules/src/ui/toolbar.tsx:111 | `core.doSL` | `const redo = () => core.doSL('autoSave', 'reload');` |
| packages-user/client-modules/src/ui/toolbar.tsx:187 | `core.resumeReplay` | `const play = () => core.resumeReplay();` |
| packages-user/client-modules/src/ui/toolbar.tsx:188 | `core.pauseReplay` | `const pause = () => core.pauseReplay();` |
| packages-user/client-modules/src/ui/toolbar.tsx:189 | `core.stopReplay` | `const stop = () => core.stopReplay(true);` |
| packages-user/client-modules/src/ui/toolbar.tsx:190 | `core.speedDownReplay` | `const speedDown = () => core.speedDownReplay();` |
| packages-user/client-modules/src/ui/toolbar.tsx:191 | `core.speedUpReplay` | `const speedUp = () => core.speedUpReplay();` |
| packages-user/client-modules/src/ui/toolbar.tsx:192 | `core.openBook` | `const book = () => core.openBook(true);` |
| packages-user/client-modules/src/ui/toolbar.tsx:197 | `core.isPlaying` | `if (core.isPlaying() && !core.isMoving() && !core.status.lockControl) {` |
| packages-user/client-modules/src/ui/toolbar.tsx:197 | `core.isMoving` | `if (core.isPlaying() && !core.isMoving() && !core.status.lockControl) {` |
| packages-user/client-modules/src/ui/toolbar.tsx:197 | `core.status` | `if (core.isPlaying() && !core.isMoving() && !core.status.lockControl) {` |
| packages-user/client-modules/src/ui/toolbar.tsx:198 | `core.ui` | `core.ui._drawViewMaps();` |
| packages-user/client-modules/src/ui/toolbar.tsx:201 | `core.rewindReplay` | `const rewind = () => core.rewindReplay();` |
| packages-user/client-modules/src/ui/toolbar.tsx:202 | `core.stepReplay` | `const step = () => core.stepReplay();` |

#### packages-user/client-modules/src/ui/toolbox.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/toolbox.tsx:165 | `core.formatBigNumber` | `text={core.formatBigNumber(item.count)}` |
| packages-user/client-modules/src/ui/toolbox.tsx:220 | `core.formatBigNumber` | `text={core.formatBigNumber(item.count)}` |

#### packages-user/client-modules/src/ui/viewmap.tsx

| 行 | core.<member> | 上下文 |
| --- | --- | --- |
| packages-user/client-modules/src/ui/viewmap.tsx:54 | `core.status` | `const nowFloorId = core.status.floorId;` |
| packages-user/client-modules/src/ui/viewmap.tsx:71 | `core.floorIds` | `core.floorIds.filter(v => {` |
| packages-user/client-modules/src/ui/viewmap.tsx:73 | `core.floors` | `!core.floors[v].cannotViewMap &&` |
| packages-user/client-modules/src/ui/viewmap.tsx:74 | `core.status` | `!core.status?.hero?.flags?.__removed__?.includes(v)` |
| packages-user/client-modules/src/ui/viewmap.tsx:118 | `core.formatBigNumber` | `return core.formatBigNumber(num ?? 0, 6);` |
| packages-user/client-modules/src/ui/viewmap.tsx:130 | `core.openBook` | `const openBook = () => core.openBook(true);` |
| packages-user/client-modules/src/ui/viewmap.tsx:133 | `core.hasItem` | `if (!core.hasItem('fly')) return;` |
| packages-user/client-modules/src/ui/viewmap.tsx:135 | `core.flyTo` | `const success = core.flyTo(id);` |
| packages-user/client-modules/src/ui/viewmap.tsx:137 | `core.floors` | `` else tip.value?.drawTip(`无法飞往${core.floors[id].title}`); `` |
| packages-user/client-modules/src/ui/viewmap.tsx:361 | `core.status` | `core.status.floorId = nowFloorId;` |
| packages-user/client-modules/src/ui/viewmap.tsx:362 | `core.status` | `core.status.thisMap = core.status.maps[nowFloorId];` |
| packages-user/client-modules/src/ui/viewmap.tsx:362 | `core.status` | `core.status.thisMap = core.status.maps[nowFloorId];` |
| packages-user/client-modules/src/ui/viewmap.tsx:566 | `core.status` | `floorId: core.status.floorId` |

### C-3 每文件计数

| 文件 | 调用点计数 |
| --- | --- |
| packages-user/client-base/src/components/choices.tsx | 13 |
| packages-user/client-base/src/components/floorSelect.tsx | 2 |
| packages-user/client-base/src/components/misc.tsx | 1 |
| packages-user/client-base/src/components/textboxTyper.ts | 1 |
| packages-user/client-base/src/components/thumbnail.tsx | 1 |
| packages-user/client-base/src/components/tip.tsx | 1 |
| packages-user/client-base/src/elements/cache.ts | 9 |
| packages-user/client-base/src/elements/misc.ts | 2 |
| packages-user/client-modules/src/action/hotkey.ts | 15 |
| packages-user/client-modules/src/action/move.ts | 6 |
| packages-user/client-modules/src/client.ts | 1 |
| packages-user/client-modules/src/fallback/audio.ts | 1 |
| packages-user/client-modules/src/fallback/load.ts | 7 |
| packages-user/client-modules/src/render/utils/saves.ts | 12 |
| packages-user/client-modules/src/render/weather/presets/cloud.ts | 1 |
| packages-user/client-modules/src/render/weather/presets/fog.ts | 1 |
| packages-user/client-modules/src/render/weather/presets/sun.ts | 1 |
| packages-user/client-modules/src/ui/book.tsx | 1 |
| packages-user/client-modules/src/ui/bookDetail.tsx | 1 |
| packages-user/client-modules/src/ui/main.tsx | 5 |
| packages-user/client-modules/src/ui/save.tsx | 13 |
| packages-user/client-modules/src/ui/settings.tsx | 59 |
| packages-user/client-modules/src/ui/shop.tsx | 6 |
| packages-user/client-modules/src/ui/statistics.tsx | 15 |
| packages-user/client-modules/src/ui/statusBar.tsx | 15 |
| packages-user/client-modules/src/ui/title.tsx | 4 |
| packages-user/client-modules/src/ui/toolbar.tsx | 19 |
| packages-user/client-modules/src/ui/toolbox.tsx | 2 |
| packages-user/client-modules/src/ui/viewmap.tsx | 13 |
| **合计** | **228** |

**C-COUNT: 228**（去重成员数 M = 67；覆盖文件数 = 29；其中 `client-base` 8 个、`client-modules` 21 个。）

## 汇总

| 类别 | 计数 | 覆盖文件数 | 说明 |
| --- | --- | --- | --- |
| A. 残余的 legacy 接口 | 32 | 12 | A-1 跨包依赖(10) + A-2 全局 `core`(1) + A-3 单例 `client`(3) + A-4 patch 机制(3) + A-5 UI 运行时符号(7) + A-6 `Mota` 全局(3) + A-7 回退层(5) |
| B. 标注 `@deprecated` 的接口 | 0 | 0 | 两包内实测 0 条（显式报告，不省略） |
| C. 经 `core.*` 调用的接口 | 228 | 29 | 去重成员 67 个；`client-base` 8 文件 + `client-modules` 21 文件 |

- **A-COUNT: 32**
- **B-COUNT: 0**
- **C-COUNT: 228**
