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

<!-- gsd:c-pending -->
