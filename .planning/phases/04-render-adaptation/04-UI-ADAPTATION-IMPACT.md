# 部分 UI 进一步接口适配影响范围清点（只读）

**日期:** 2026-09-30
**范围:** 被查对象 = 渲染端部分 UI（`packages-user/client-modules/src/render/ui/**` + `packages-user/client-modules/src/render/index.tsx`）对已删全局 `loading` / `hook` 与旧加载系统的使用点；边界（非 UI）面（`packages-user/client-modules/src/client.ts` / `packages-user/client-modules/src/index.ts` / `packages-user/entry-client/src/create.ts`）只报告；`packages/` 与 `src/` 仅报告（D-33 沿用）
**性质:** 只读清点（D-71 / D-72 第一步），未修改任何生产代码，未引入任何命名变更
**基准提交:** `d8fa4b8 refactor: Delete global loading & hook object`；当日 HEAD `faba3d3`（分支 `refine/data-client`）
**新加载系统基准:** `@motajs/loader` + `packages-user/data-state/src/loader/**`
**下一步:** 第二步（适配实施）未规划，待用户审阅本文件后另行规划（D-72）

## 只读起始基线

- **只读起始基线（packages / packages-user / src）**：执行 `git status --porcelain -- packages packages-user src`，当日实测输出**为空**，原样逐行记录：
- （无）
- 当日 HEAD = `faba3d3c11a6ca1f5c0a900ce7c73131c2a5cc8e`（short `faba3d3`），分支 `refine/data-client`；`git merge-base --is-ancestor d8fa4b8 HEAD` 退出码 0。
- `packages-user/client-base/src/load/` 目录**不存在**（`Test-Path` 返回 `False`）；`d8fa4b8` 已在 HEAD 历史中。
- `.planning/phases/04-render-adaptation/04-CONTEXT.md` 的既有未提交改动**仍在**（`git status --porcelain` 显示 ` M .planning/phases/04-render-adaptation/04-CONTEXT.md`）；本 run 不回滚 / 不暂存 / 不提交 / 不修改（D-56）。

## 背景

本文件是 Phase 4 第十三个增量（用户裁定 2026-09-25 · **D-71 / D-72 / D-73** 第一步）的交付物：对「部分 UI 的进一步接口适配」需修改点的**只读影响清点**。

- **D-71（目标）:** 完成部分 UI 的进一步接口适配。此前已有一轮适配；数据端经用户近期调整（含 `d8fa4b8 refactor: Delete global loading & hook object`、加载系统重构等）后，仍有若干需适配的点：
    1. **全局 `loading` / `hook` 对象已被删除** —— 组件不得再依赖这些全局对象监听全局钩子，必须在对应的对象上监听。
    2. **加载系统重构** —— 现使用新的加载系统，旧的加载 UI 已不能用了，需要重新适配。
- **D-72（两步走）:** 本目标至少两个计划 —— 第一个计划只做只读收集（清点需要修改的点，产出影响台账；生产代码零改动）；第二个及后续才真正执行适配。第一个计划的产出是后续执行计划的输入。
- **D-73（边界延续）:** 沿用既有约束 —— 范围外一律不改、不追平全部类型错误（D-33）；`packages-user/client-base/src/material/**` 归用户、AI 不得改（D-42 / D-48）；不考虑任何 legacy（D-49 / D-55 / D-65）；不得触碰 / 提交用户并发改动（D-56）；不要求「保证能运行」、不得以 `check:type` / `build` / TS 诊断数作为门禁（D-68）；桶导出边界（**D-69**）继续适用。

本步**只清点、不修改、不规划第二步**。本文件不含修复方案、不含代码改动建议、不产出任何新 `*-PLAN.md`。

## 方法

**枚举面（两侧）：**

- **（a）基准面（用户已调整）**：`d8fa4b8` 删除的全局 `loading` / `hook`（`packages-user/data-base/src/{game.ts,index.ts}`）与旧加载系统（`packages-user/client-base/src/load/**`、`IMotaAssetsLoader`）；新加载系统 `@motajs/loader`（`packages/loader/src/{manager,starter,stream,task,types,index}.ts`）与 `packages-user/data-state/src/loader/{loader,types,hook,jsoncProcessor,index}.ts`、`CoreState.loader` / `loadManager`（`packages-user/data-state/src/core.ts`、`packages-user/data-state/src/types.ts`）。
- **（b）命中面**：渲染端部分 UI（`packages-user/client-modules/src/render/ui/**` 与 `packages-user/client-modules/src/render/index.tsx`）对上述旧接口的使用点；边界（非 UI）面（`packages-user/client-modules/src/client.ts` / `packages-user/client-modules/src/index.ts` / `packages-user/entry-client/src/create.ts`）**只报告**；`packages/` 与 `src/` 对照扫描**只报告**。

**判定口径（固定六类，一条记录只归一类，跨类拆条并互相引用）：**

| 类别 | 含义 | 归属规则 |
|---|---|---|
| A | 全局 `loading` / `hook` 使用点（UI 面） | `render/ui/load.tsx`（经 `client.loader` 的旧加载接口）、`render/ui/main.tsx`（`statusBarUpdate` 监听 / 手工调用）、`render/index.tsx`（`restart` 监听）；边界非 UI 面（`client.ts` / `client-modules/src/index.ts` / `entry-client/src/create.ts`）只报告 |
| B | 目标对象与钩子 API 证据 | 每处 A 给出应改监听 / 使用的对象 + 现行源码 `file:line` 证据，或显式 undetermined |
| C | 旧加载 UI 清单与新加载系统 | 旧侧 `LoadScene` / `LoadSceneUI` + 已删 `client-base/src/load/**` / `IMotaAssetsLoader`；新侧 `@motajs/loader` + `data-state/src/loader/**` + `CoreState.loader` / `loadManager` |
| D | 分层与 barrel（D-69）检查 | 逐个分明 barrel 的 `export *` 面，判定是否违反 D-69、是否存在转发 / 反向依赖候选；`packages/` 命中只报告 |
| E | legacy 命中（仅报告） | `core.*` / `Mota.require`（legacy）不修、不登记为待办；`client` / `state` 单例另属 D-23 / D-28 的只读范围（非 legacy），一并只报告 |
| F | 未能从阅读确定（未猜测） | 静态阅读不能定论项，只登记不判定；不得写成错配 / 缺失 / 残留 / 待办 |

**分列规则（写死，防止类别互相冒充）：** A 记「全局 `loading` / `hook` 使用点」；B 记「目标对象与钩子 API 证据」；C 记「旧加载 UI 与新加载系统清单」；D 记「分层与 barrel（D-69）判定」；E 记「legacy 命中（仅报告）」；F 记「未能从阅读确定」。

**证据纪律：** A–E 的**事实行**每行至少 **2** 个完整 `文件:行` 锚点；**证据行**（零命中 / 对照扫描，仅在 ID / 项目单元格带 `[证据行]` 标记）改为必须携带核对命令（`git grep` / `git status --porcelain`）与原样结果，豁免 ≥2 计数；**非证据行带 `[证据行]` 标记即违规**。静态阅读不能定论者一律进 F 类，**不得写成错配 / 缺失 / 残留 / 待办**。

## 基准变更（d8fa4b8）

依据：`git show d8fa4b8 --stat --format="%H %s"`（共触及 16 个文件，`16 files changed, 32 insertions(+), 977 deletions(-)`）。

**① 删除旧加载系统（4 个文件）：**

| 旧文件 | 删除行数 | 说明 |
|---|---|---|
| `packages-user/client-base/src/load/loader.ts` | 515 | 旧加载器实现 |
| `packages-user/client-base/src/load/types.ts` | 84 | 旧接口 `IMotaAssetsLoader`（`initSystemLoadTask` / `addCustomLoadTask` / `load` / `progress`） |
| `packages-user/client-base/src/load/data.ts` | 37 | 旧加载数据 |
| `packages-user/client-base/src/load/index.ts` | 3 | 旧 barrel |

同提交在 `packages-user/client-base/src/index.ts:1` 删除 `export * from './load';`（现行 `packages-user/client-base/src/index.ts:1-9` 仅剩 8 条同目录 `export *`）。现行 `packages-user/client-base/src/load/` 目录不存在（`Test-Path` 返回 `False`）；`IMotaAssetsLoader` / `initSystemLoadTask` / `addCustomLoadTask` 在 `packages-user` / `packages` / `src` 源码面 `git grep` 均零命中。

**② 删除全局 `hook` / `loading`：**

- `packages-user/data-base/src/game.ts` 删除 273 行（原 `hook` / `gameListener` 渲染通知机制）。
- `packages-user/data-base/src/index.ts:1-2` 删除 `export * from './load';` 与 `export * from './game';`。
- `packages-user/entry-data/src/create.ts`（2 行）与 `packages-user/entry-data/src/index.ts`（6 行）同步移除。

**③ 把 16 个文件中的 `loading` / `hook` 用法改为注释（本步相关的 UI 面）：**

- `packages-user/client-modules/src/client.ts`：`loading.once('loaded', ...)` + `fallbackLoad` / `loading.emit('assetBuilt')` 与 `loading.once('assetBuilt', initMapExtensions)` 改为注释（现行 `client.ts:88-92` 与 `client.ts:124-127`）。
- `packages-user/client-modules/src/index.ts`：删除 `import { loading }` 与 `loading.once('coreInit', () => { createGameRenderer(); })`（现行 `create()` 只 `patchAll()` + `createRender()`）。
- `packages-user/client-modules/src/render/index.tsx`：删除 `import { hook }` 与 `import { GameTitleUI }`；`hook.on('restart', ...)` 改为注释（现行 `render/index.tsx:35-38`）。
- `packages-user/client-modules/src/render/ui/load.tsx`：删除 `import { loading } from '@user/data-base';` 与 `loading.emit('loaded');` 一行（现行 `load.tsx` 无 `loading` 引用）。
- `packages-user/client-modules/src/render/ui/main.tsx`：删除 `import { hook }`；`hook.on('statusBarUpdate', ...)` / `hook.off(...)` 改为注释并补入手工单次调用（现行 `main.tsx:140-143` 与 `main.tsx:145-152`）。
- `packages-user/client-modules/src/render/use.ts`：删除 `import { loading }` 与 `onLoaded(hook)` 函数（现行 `use.ts` 不含 `onLoaded`）。
- `packages-user/entry-client/src/create.ts`：`loading.once('registered', ...)` / `loading.emit('clientRegistered')` / `createModule()` + `hook.emit('renderLoaded')` 改为注释或删除（现行 `create.ts:16,31,34-41`）。

**新加载系统基准（`d8fa4b8` 后的现行面）：** `@motajs/loader`（`packages/loader/src/index.ts:1-5` 导出 `./manager` / `./starter` / `./stream` / `./task` / `./types`）与 `packages-user/data-state/src/loader/index.ts:1-4`（导出 `./hook` / `./jsoncProcessor` / `./loader` / `./types`）。

## A 全局 loading / hook 使用点（UI 面）

列序固定：`ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信`。本节登记**渲染端部分 UI 及其边界**对已删全局 `loading` / `hook` 与旧加载系统的使用点。**行内不含任何修复建议或改写写法**（应改对象见 B 类，未定者见 F 类）。

| ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-13-A-01 | `load.tsx` 旧加载接口使用点（`client.loader` / `initSystemLoadTask` / `load` / `progress`） | packages-user/client-modules/src/render/ui/load.tsx:36, packages-user/client-modules/src/render/ui/load.tsx:71, packages-user/client-modules/src/render/ui/load.tsx:72, packages-user/client-modules/src/render/ui/load.tsx:76-79, packages-user/client-modules/src/render/ui/load.tsx:91-92, packages-user/client-modules/src/render/ui/load.tsx:118-119, packages-user/client-modules/src/render/ui/load.tsx:139 | packages-user/data-state/src/types.ts:29, packages-user/data-state/src/loader/types.ts:19-72, packages/loader/src/types.ts:288-335 | 旧加载 UI 按已删的旧加载接口编写：`:36` `const loader = client.loader;`、`:71` `loader.initSystemLoadTask()`、`:72` `loader.load()`、`:76-79` `for await (const _ of loader.progress)` 与 `loader.progress.getLoadedTasks()` / `getLoadedByte()`（`:75` 有 `@ts-expect-error 需要重构`）、`:91-92` `getLoadedTasks` / `getAddedTasks`、`:118-119` `getTotalByte` / `getLoadedByte`、`:139` `getByteRatio`。`client.loader` 现为 `ICoreState.loader: IMotaDataLoader`（`packages-user/data-state/src/types.ts:29`），其上无 `initSystemLoadTask` / `progress` 成员 | 该 UI 无法按旧接口工作；等价数据来源见 B / F 类 | 高 |
| #04-13-A-02 | 旧加载 UI 装配链（深导 + 打开时机，当前不可达） | packages-user/client-modules/src/render/index.tsx:11, packages-user/client-modules/src/render/index.tsx:25, packages-user/client-modules/src/render/index.tsx:13 | packages-user/client-modules/src/index.ts:4-7, packages-user/client-modules/src/render/index.tsx:13 | 旧加载 UI 经深导 `import { LoadSceneUI } from './ui/load'`（`render/index.tsx:11`）装配在 `createGameRenderer`（`render/index.tsx:13`）内，并在 `render/index.tsx:25` `sceneController.open(LoadSceneUI, {})` 打开。`git grep -n "createGameRenderer" -- packages-user packages src` **仅命中 `render/index.tsx:13` 定义行，无调用者**；`client-modules/src/index.ts:4-7` 的 `create()` 现只 `patchAll()` + `createRender()` | 事实登记：旧加载 UI 当前**不可达**；是否纳入第二步由用户裁定（F 类） | 高 |
| #04-13-A-03 | `main.tsx` `statusBarUpdate` 全局 `hook` 监听点与手工单次调用 | packages-user/client-modules/src/render/ui/main.tsx:140-143, packages-user/client-modules/src/render/ui/main.tsx:145-152 | packages-user/client-modules/src/render/ui/main.tsx:97, packages-user/client-modules/src/render/ui/main.tsx:101-132, packages-user/client-modules/src/render/ui/main.tsx:137, packages-user/data-base/src/hero/types.ts:277-295 | `:140-143` 为注释「保留函数调用，避免被识别为未使用函数而报错 / 后续修改后需要删除」+ `updateDataFallback()` / `updateStatus()` 手工单次调用；`:145-152` 为被注释的 `hook.on('statusBarUpdate', updateStatus)` / `hook.on('statusBarUpdate', updateDataFallback)` 与 `hook.off(...)`。状态更新函数（`:96-138`）读取 `core.status` / `client.hero.attribute` / `client.flags` 等。`d8fa4b8` 把这两处监听改为注释 | 状态栏更新不再由事件驱动；应改监听对象无法从阅读确定为单一对象（F 类 F-03） | 高 |
| #04-13-A-04 | `render/index.tsx` `restart` 全局 `hook` 监听点 | packages-user/client-modules/src/render/index.tsx:35-38 | packages-user/client-modules/src/render/ui/settings.tsx:112, packages-user/client-modules/src/action/hotkey.ts:507, packages-user/client-modules/src/render/ui/title.tsx:38 | `:35-38` 为被注释的 `hook.on('restart', () => { sceneController.closeAll(); sceneController.open(GameTitleUI, {}); })`。`d8fa4b8` 把该监听改为注释。`git grep -n "restart" -- packages-user/client-modules/src` 仅命中 hotkey 实现（`action/hotkey.ts:194,507`）、legacy `core.restart()`（`render/ui/settings.tsx:112`）与该注释行 `render/index.tsx:35`，**无新发射者** | 事件来源与新接线方式未定（F 类 F-04） | 高 |
| #04-13-A-05 | 边界（非 UI，仅报告）— `client.ts` 被注释的 `loading` 接线 | packages-user/client-modules/src/client.ts:88-92, packages-user/client-modules/src/client.ts:124-127 | packages-user/client-modules/src/client.ts:131, packages-user/client-modules/src/client.ts:137-148 | `client.ts:88-92` 为被注释的 `loading.once('loaded', () => { fallbackLoad(this.materials); loading.emit('assetBuilt'); })`；`client.ts:124-127` 为被注释的 `loading.once('assetBuilt', () => { this.initMapExtensions(); })`。`d8fa4b8` 把两处改为注释；`client.ts:131` 现走新加载系统 `this.loader.addCoreConfig('client', config.clientURL)`。此处非 UI（D-71 措辞为「组件 / UI」） | 仅报告；是否纳入第二步由用户裁定（F 类 F-05） | 高 |
| #04-13-A-06 | 边界（非 UI，仅报告）— `client-modules/src/index.ts` 的 `loading.once('coreInit')` 已移除 | packages-user/client-modules/src/index.ts:1-8 | packages-user/client-modules/src/render/index.tsx:13, packages-user/client-modules/src/render/index.tsx:43-49 | 现行 `client-modules/src/index.ts:1-8` 的 `create()` 只 `patchAll()` + `createRender()`；`d8fa4b8` 删除了 `import { loading }` 与 `loading.once('coreInit', () => { createGameRenderer(); })`。组合根不再经全局 `loading` 触发 `createGameRenderer`（`render/index.tsx:13`），故其无调用者 | 仅报告；是否纳入第二步由用户裁定（F 类 F-05） | 高 |
| #04-13-A-07 | 边界（非 UI，仅报告）— `entry-client/create.ts` 被注释的 `loading` / `hook` | packages-user/entry-client/src/create.ts:16,31,34-41 | packages-user/entry-client/src/create.ts:1-14, packages-user/entry-client/src/create.ts:18-29 | `create.ts:16` `// loading.once('registered', createModule);`、`create.ts:31` `// loading.emit('clientRegistered');`、`create.ts:34-41` 为被注释的 `createModule()`（`ClientModules.create()` / `LegacyUI.create()` / `main.renderLoaded = true` / `hook.emit('renderLoaded')`）。`d8fa4b8` 把这些接线改为注释；此处为入口组合根，非 UI | 仅报告；是否纳入第二步由用户裁定（F 类 F-05） | 高 |

**A 类小结：** UI 面 3 组（`load.tsx` 旧加载接口 A-01 / 装配链 A-02 / `main.tsx` `statusBarUpdate` A-03 / `render/index.tsx` `restart` A-04），边界非 UI 面 3 条（`client.ts` A-05 / `client-modules/src/index.ts` A-06 / `entry-client/create.ts` A-07）。**行内无修复建议。**

## B 目标对象与钩子 API 证据

列序固定：`ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信`。本节对 A 的每一处给出**应改监听 / 使用的对象**并附现行源码 `file:line` 证据，或显式 **undetermined（无法从阅读确定目标对象）**。**行内不写具体 import / 调用改写写法。**

| ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-13-B-01 | A-01 目标对象 — 新加载系统（加载器 / 管理器 / 钩子） | packages-user/client-modules/src/render/ui/load.tsx:71, packages-user/client-modules/src/render/ui/load.tsx:72, packages-user/client-modules/src/render/ui/load.tsx:76-79 | packages-user/data-state/src/loader/types.ts:19-72, packages/loader/src/types.ts:288-335, packages/loader/src/manager.ts:10-112, packages-user/data-state/src/loader/loader.ts:18-151 | 旧加载 UI 应改依新加载系统的对象 / 钩子：`IMotaDataLoader`（`packages-user/data-state/src/loader/types.ts:19-72`：`start()` / `loaded()` / `manager` / `addCustomTask`）、`ILoadManager`（`packages/loader/src/types.ts:288-335`：`onStartLoad` / `onProgress` / `onLoadEnd` + `getLoadedByte` / `getTotalByte` / `getLoadedTasks` / `getAddedTasks` / `getTaskRatio` / `getByteRatio`）、实现 `LoadManager`（`packages/loader/src/manager.ts:10-112`）/ `MotaDataLoader`（`packages-user/data-state/src/loader/loader.ts:18-151`）。旧 UI 用到的 `getLoadedTasks` / `getAddedTasks` / `getTotalByte` / `getLoadedByte` / `getByteRatio` 在 `ILoadManager` 上均有对应成员 | 承接对象为 `IMotaDataLoader` / `ILoadManager`；`loader.progress` 异步迭代的等价写法 undetermined（F 类 F-02） | 高 |
| #04-13-B-02 | A-02 目标对象 — 数据端加载入口 | packages-user/client-modules/src/render/index.tsx:11, packages-user/client-modules/src/render/index.tsx:25 | packages-user/data-state/src/core.ts:205-208, packages-user/data-state/src/types.ts:26-43 | 新加载系统的数据端入口为 `CoreState.loader` / `CoreState.loadManager`：`core.ts:205` `this.loadManager = new LoadManager();`、`core.ts:206` `this.loader = new MotaDataLoader(this.loadManager, config.loadStarter);`、`core.ts:207-208` `this.loader.addHook(new DefaultDataLoaderHook()); this.loader.addCoreConfig('core', config.coreURL);`；契约见 `packages-user/data-state/src/types.ts:26-43`（`ICoreState.loader` / `ICoreState.loadManager`） | 旧加载 UI 的打开时机原由 `loading.once('coreInit')` 触发；新接线方式 **undetermined（无法从阅读确定目标对象）** | 中 |
| #04-13-B-03 | A-03 目标对象 — 状态栏可 hook 的数据端对象（候选集合） | packages-user/client-modules/src/render/ui/main.tsx:145-152 | packages-user/data-base/src/hero/types.ts:277-295, packages-user/data-base/src/hero/types.ts:428-443, packages-user/data-base/src/hero/types.ts:652-671, packages-user/data-base/src/hero/types.ts:883-903, packages-user/data-common/src/common/mover.ts:166, packages-user/data-base/src/map/types.ts:220, packages-user/data-base/src/map/types.ts:599, packages-user/data-common/src/replay/types.ts:80, packages-user/data-common/src/replay/types.ts:342 | 状态栏为**多对象聚合**：状态更新函数（`main.tsx:96-138`）读取 `client.hero.attribute`（只读属性对象 —— 该对象不可 hook）、`client.flags`、`core.status`（含 `core.status.replay`）等，另 `core.itemCount(...)` / `core.getNextLvUpNeed()` / `core.getLvName(...)` 等 legacy 调用。可 hook 的数据端对象接口候选：`IHeroLocationHooks` / `IHeroRenderingHooks` / `IEquipmentStateHooks` / `IHeroStateHooks` / `IObjectMoverHooks` / `IMapLayerHooks` / `IGameMapHooks` / `IReplaySandboxHooks` / `IReplaySystemHooks` | 单一目标对象无法从阅读确定 ⇒ **undetermined（无法从阅读确定目标对象）**；交叉引用 F 类 F-03 | 中 |
| #04-13-B-04 | A-04 目标对象 — `restart` 事件来源 | packages-user/client-modules/src/render/index.tsx:35-38 | packages-user/client-modules/src/render/ui/settings.tsx:112, packages-user/client-modules/src/action/hotkey.ts:507 | 全局 `hook` 删除后 `restart` **无新发射者**：`git grep -n "restart" -- packages-user/client-modules/src` 仅命中 legacy `core.restart()`（`render/ui/settings.tsx:112`）与 hotkey 实现（`action/hotkey.ts:194,507`）。事件由谁发出 / 应改在哪个对象上监听 **undetermined（无法从阅读确定目标对象）** | 交叉引用 F 类 F-04 | 中 |
| #04-13-B-05 | A-05 / A-06 / A-07 边界目标 — 新加载系统（配置 / 钩子） | packages-user/client-modules/src/client.ts:131, packages-user/client-modules/src/client.ts:137-148 | packages-user/data-state/src/loader/loader.ts:57-63, packages-user/data-state/src/loader/hook.ts:5-24, packages-user/data-state/src/loader/types.ts:4-17 | 边界非 UI 面的 `loading` / `hook` 接线目标为新加载系统的 `IMotaDataLoader`：`addCoreConfig` / `addExtraConfig`（`packages-user/data-state/src/loader/loader.ts:57-63`）、`IMotaDataLoaderHooks.onCoreConfigLoaded` / `onExtraConfigLoaded`（`packages-user/data-state/src/loader/types.ts:4-17`）、装配 `DefaultDataLoaderHook.onCoreConfigLoaded` 内 `addExtraConfig`（`packages-user/data-state/src/loader/hook.ts:5-24`） | 该面是否纳入「部分 UI」适配范围 **undetermined**；交叉引用 F 类 F-05 | 中 |

**B 类小结：** A-01 目标可确定（`IMotaDataLoader` / `ILoadManager`，惟 `progress` 迭代等价写法进 F 类）；A-02 / A-03 / A-04 / A-05..A-07 的目标对象均**显式 undetermined** 并交叉引用 F 类。**每行含现行源码锚点。**

## C 旧加载 UI 清单与新加载系统

列序固定：`ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信`。**只登记事实与锚点，不给修复 / 改写建议。**

| ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-13-C-01 | 旧侧 — 旧加载 UI 清单与已删旧加载系统 | packages-user/client-modules/src/render/ui/load.tsx:35, packages-user/client-modules/src/render/ui/load.tsx:165, packages-user/client-modules/src/render/index.tsx:11, packages-user/client-modules/src/render/index.tsx:13, packages-user/client-modules/src/render/index.tsx:25 | packages-user/client-modules/src/render/use.ts:1-19, packages-user/client-modules/src/render/index.tsx:29-41 | 旧加载 UI = `LoadScene`（`load.tsx:35`）/ `LoadSceneUI`（`load.tsx:165`）+ 装配点 `render/index.tsx:11,13,25`。旧系统 `packages-user/client-base/src/load/{loader.ts,types.ts,data.ts,index.ts}` 与旧接口 `IMotaAssetsLoader`（其 `initSystemLoadTask` / `addCustomLoadTask` / `load` / `progress` 成员）**已随 `d8fa4b8` 删除，现行不存在**（`git grep -n "IMotaAssetsLoader" -- packages-user packages src` 零命中；`initSystemLoadTask` 仅剩 `load.tsx:71` 的无效调用点）。另 `packages-user/client-modules/src/render/use.ts` 的 `onLoaded` 已随该提交删除（现行 `use.ts:1-19` 不含 `onLoaded`） | 事实登记；旧加载 UI 已不能用了，需重新适配（D-71） | 高 |
| #04-13-C-02 | 新侧 — 新加载系统提供物（入口 / API / 钩子） | packages/loader/src/index.ts:1-5, packages/loader/src/manager.ts:10-112, packages/loader/src/starter.ts:3-11, packages/loader/src/types.ts:194-266, packages/loader/src/types.ts:288-335 | packages-user/data-state/src/loader/loader.ts:18-151, packages-user/data-state/src/loader/types.ts:19-72, packages-user/data-state/src/loader/hook.ts:5-24, packages-user/data-state/src/loader/index.ts:1-4, packages-user/data-state/src/core.ts:205-208 | 新加载系统提供物 = `@motajs/loader`（`packages/loader/src/index.ts:1-5`；`LoadManager` `packages/loader/src/manager.ts:10-112`；`WebLoadStarter` `packages/loader/src/starter.ts:3-11`；`ILoadTask` / `ILoadTaskHooks` `packages/loader/src/types.ts:194-266`；`ILoadManager` `packages/loader/src/types.ts:288-335`）+ `packages-user/data-state/src/loader/**`（`MotaDataLoader` / `IMotaDataLoader` / `DefaultDataLoaderHook`；导出面 `packages-user/data-state/src/loader/index.ts:1-4`）+ `CoreState.loader` / `loadManager`（`packages-user/data-state/src/core.ts:205-208`）。**这些是新加载 UI 重新适配时必须使用的入口 / API / 钩子**（本步不写用法） | 事实登记（后续执行计划的输入） | 高 |

**C 类小结：** 旧侧（`LoadScene` / `LoadSceneUI` + 装配链 + 已删 `client-base/src/load/**` / `IMotaAssetsLoader` / `use.ts:onLoaded`）与新侧（`@motajs/loader` + `data-state/src/loader/**` + `CoreState.loader` / `loadManager`）均已登记并带 `file:line`。**未给任何修复方案。**

## D 分层与 barrel（D-69）检查

列序固定：`ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信`。逐条登记 barrel 的 `export *` 面，判定是否违反 D-69、是否存在为补齐导出面而转发 / 反向依赖的**候选**；`packages/` 命中只报告。

| ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-13-D-01 | barrel — `render/ui/index.ts`（**无** `./load` 导出） | packages-user/client-modules/src/render/ui/index.ts:1-14 | packages-user/client-modules/src/render/index.tsx:11, packages-user/client-modules/src/render/ui/load.tsx:35 | `packages-user/client-modules/src/render/ui/index.ts`（14 行）的 `export *` 面为 `./controller` / `./main` / `./save` / `./settings` / `./statistics` / `./statusBar` / `./toolbar` / `./viewmap`（全同目录），**没有** `export * from './load'` ⇒ 旧加载 UI 不经 `ui` 桶暴露，由 `render/index.tsx:11` 深导 `./ui/load`。判定：该 barrel 全部同目录 `export *`，**不违反 D-69** | 事实登记；是否有转发 / 反向依赖候选由用户裁定 | 高 |
| #04-13-D-02 | barrel — `render/index.tsx`（7 条同目录 `export *`） | packages-user/client-modules/src/render/index.tsx:43-49 | packages-user/client-modules/src/render/index.tsx:11, packages-user/client-modules/src/render/index.tsx:13 | `render/index.tsx:43-49` 的 7 条 `export *`（`./fx` / `./ui` / `./utils` / `./weather` / `./renderer` / `./scene` / `./use`）全为同目录项（含同目录子文件夹 `./ui`），**不违反 D-69**。`render/index.tsx:11` 的 `./ui/load` 为目录内深导，与 barrel 边界无关 | 事实登记 | 高 |
| #04-13-D-03 | barrel — `client-modules/src/index.ts` | packages-user/client-modules/src/index.ts:9-16 | packages-user/client-modules/src/index.ts:1-8 | `client-modules/src/index.ts:9-16` 的 `export *` 面（`./action` / `./fallback` / `./render` / `./client` / `./core` / `./shared` / `./types`）全为同目录项，**不违反 D-69**；无跨包 / 上层转发 | 事实登记 | 高 |
| #04-13-D-04 | barrel — `client-base/src/index.ts`（8 条同目录 `export *`） | packages-user/client-base/src/index.ts:1-8 | packages-user/client-base/src/index.ts:1-9, packages-user/client-base/src/index.ts:1 | `client-base/src/index.ts:1-9` 的 8 条 `export *`（`./material` / `./save` / `./types` / `./layout` / `./shared` / `./components` / `./elements` / `./map`）全为同目录项，**不违反 D-69**；`d8fa4b8` 已删除 `export * from './load';` 一条 | 事实登记 | 高 |
| #04-13-D-05 | `packages/` 命中（只报告）— `packages/client/src/index.ts` | packages/client/src/index.ts:1 | packages-user/client-base/src/index.ts:1, packages-user/client-base/src/index.ts:1-9 | `packages/client/src/index.ts:1` 的 `export * from '@motajs/client-base'` 为**跨包转发**，**违反 D-69**，但在 `packages/`（D-33 **只报告**，不修改） | 仅报告；不修改 | 高 |

**D 类小结：** 4 个渲染端 barrel 节点（`render/ui/index.ts` / `render/index.tsx` / `client-modules/src/index.ts` / `client-base/src/index.ts`）均为同目录 `export *`，**不违反 D-69**；`render/ui/index.ts` 无 `./load` 导出（旧加载 UI 走 `render/index.tsx:11` 深导）。`packages/client/src/index.ts:1` 跨包转发违反 D-69 但只报告（D-33）。**未给补位 / 改指方案。**

## E legacy 命中（仅报告）

**本节仅报告：按 D-49 / D-55 / D-65 不考虑任何 legacy 内容，legacy 相关报错一律不管、不修、不登记为待办。**

列序固定：`ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信`。本节只登记事实与核对命令。

| ID | 项目 | 命中处 file:line | 目标锚点 / 证据 file:line | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-13-E-01 | `render/ui/*.tsx` 的 `core.*` 命中（legacy，仅报告） | packages-user/client-modules/src/render/ui/main.tsx:97, packages-user/client-modules/src/render/ui/settings.tsx:112, packages-user/client-modules/src/render/ui/statusBar.tsx:139, packages-user/client-modules/src/render/ui/toolbar.tsx:90, packages-user/client-modules/src/render/ui/viewmap.tsx:54 | packages-user/client-modules/src/render/ui/main.tsx:96-138, packages-user/client-modules/src/render/ui/load.tsx:35 | `git grep -n -E "\bcore\.|\bMota\.require\b" -- packages-user/client-modules/src/render/ui` 命中 `main.tsx`（`:97,101-132,137,158,168,201,210,219`）、`settings.tsx`（`:112,164-628`）、`save.tsx`（`:90-587`）、`statistics.tsx`、`statusBar.tsx`、`title.tsx`、`toolbar.tsx`、`viewmap.tsx` 等大量 `core.*`（旧引擎适配，D-12 / D-49 / D-55 / D-65）。**仅报告**，不修、不登记为待办 | 仅报告 | 高 |
| #04-13-E-02 | `client` / `state` 单例使用（D-23 / D-28 只读范围，另属非 legacy） | packages-user/client-modules/src/render/ui/load.tsx:27, packages-user/client-modules/src/render/ui/main.tsx:28, packages-user/client-modules/src/render/ui/main.tsx:32, packages-user/client-modules/src/render/ui/settings.tsx:28, packages-user/client-modules/src/render/ui/statusBar.tsx:15, packages-user/client-modules/src/render/ui/title.tsx:38, packages-user/client-modules/src/render/ui/toolbar.tsx:28 | packages-user/client-modules/src/render/ui/main.tsx:28, packages-user/client-modules/src/render/ui/main.tsx:32 | `git grep -n -F "from '../../core'" -- packages-user/client-modules/src/render/ui` 命中 6 处 `import { client } from '../../core'`（`load.tsx:27` / `main.tsx:32` / `settings.tsx:28` / `statusBar.tsx:15` / `title.tsx:38` / `toolbar.tsx:28`）；`main.tsx:28` 另有 `import { state } from '@user/data-state'`。属 D-23 / D-28 的只读范围（**非 legacy**），一并只报告 | 仅报告 | 高 |
| #04-13-E-03 | legacy `Mota.require('@user/data-base')` 取已删 `hook` / `loading`（`packages/` 只报告） | packages/legacy-ui/src/preset/ui.ts:13,222, packages/legacy-ui/src/preset/ui.ts:222 | packages-user/data-base/src/index.ts:1-2 | `packages/legacy-ui/src/preset/ui.ts:13` `const { hook } = Mota.require('@user/data-base');`（`hook.once('mounted', ...)`）与 `packages/legacy-ui/src/preset/ui.ts:222` `const { loading } = Mota.require('@user/data-base');`（`loading.once('coreInit', ...)`）经 legacy 插件系统取已删的 `hook` / `loading`（`d8fa4b8` 已从 `packages-user/data-base/src/index.ts` 删除 `./game`（`hook`）与 `./load`（`loading`）导出）。在 `packages/`（D-33 **只报告**） | 仅报告；不修、不登记为待办 | 高 |
| #04-13-E-04 | `[证据行]` — `render/ui` 内 `Mota.require` 对照扫描（零命中） | packages-user/client-modules/src/render/ui（核对命令 `git grep -n -F "Mota.require" -- packages-user/client-modules/src/render/ui` → 无输出，退出码 1） | packages-user/client-modules/src/render/ui/main.tsx:1-33, packages-user/client-modules/src/render/ui/load.tsx:1-28 | `render/ui` 内**无** `Mota.require` 命中；该面 legacy 命中仅为 `core.*`（见 E-01）。**仅报告** | 仅报告 | 高 |

**E 类小结：** `core.*`（E-01）、`client` / `state` 单例（E-02）、legacy-ui 经 `Mota.require` 取已删 `hook` / `loading`（E-03）与 `render/ui` 内 `Mota.require` 零命中（E-04）均已登记。**全节只报告，无任何修复 / 待办措辞。**

## F 未能从阅读确定（未猜测）

条目形如 `- **#04-13-F-NN**：现象 + 为什么读不出来 + 需要用户裁决的点`。**只登记，不判定**；不得写成错配 / 缺失 / 残留。

- **#04-13-F-01**：旧加载 UI 的「任务进度 / 字节进度 / 总字节」新数据来源。现象：旧 UI 经 `loader.progress`（`packages-user/client-modules/src/render/ui/load.tsx:76-79,91-92,118-119,139`）取任务 / 字节进度。读不出来的原因：新 `ILoadManager`（`packages/loader/src/types.ts:288-335`）虽提供 `getTotalByte` / `getLoadedByte` / `getLoadedTasks` / `getAddedTasks` / `getTaskRatio` / `getByteRatio`，但旧 UI 期望的 `loader.progress` 对象形态在新 API 下的等价数据来源未定；且 `LoadManager.getTotalByte`（`packages/loader/src/manager.ts:92-94`）实现返回 `this.loaded`（非独立 total 字段）需用户确认语义。需要用户裁决：**旧加载 UI 的进度数据来源与取值入口**。
- **#04-13-F-02**：`loader.progress` 异步迭代语义在新 API 下的等价写法。现象：`for await (const _ of loader.progress)`（`packages-user/client-modules/src/render/ui/load.tsx:76`，`:75` 有 `@ts-expect-error 需要重构`）。读不出来的原因：新 `IMotaDataLoader.start()`（`packages-user/data-state/src/loader/types.ts:26`）与 `ILoadManager.load()`（`packages/loader/src/types.ts:304`）均返回 `AsyncIterable<number>`，但 `loader.progress` 是旧 `IMotaAssetsLoader`（已删）的属性；迭代对象 / 迭代语义如何对应无法由静态阅读定论。需要用户裁决：**迭代改写所依对象与语义**。
- **#04-13-F-03**：`statusBarUpdate` 的精确监听对象集合。现象：状态栏更新函数（`packages-user/client-modules/src/render/ui/main.tsx:96-138`）聚合读取 `client.hero.attribute`（只读属性对象 —— 该对象**不可 hook**）、`client.flags`、`core.status`（含 `core.status.replay`）等；原监听点 `main.tsx:145-152` 已注释。读不出来的原因：单一目标对象无法从阅读确定；可 hook 的数据端对象接口有多个候选（`packages-user/data-base/src/hero/types.ts:277-295,428-443,652-671,883-903`、`packages-user/data-common/src/common/mover.ts:166`、`packages-user/data-base/src/map/types.ts:220,599`、`packages-user/data-common/src/replay/types.ts:80,342`），各自只覆盖字段来源的一部分。需要用户裁决：**状态栏更新应监听的精确对象集合 / 聚合方式**。
- **#04-13-F-04**：`restart` 事件在全局 `hook` 删除后无新发射者。现象：原 `hook.on('restart', ...)`（`packages-user/client-modules/src/render/index.tsx:35-38`）已注释；`git grep -n "restart" -- packages-user/client-modules/src` 仅命中 hotkey 实现（`action/hotkey.ts:194,507`）与 legacy `core.restart()`（`render/ui/settings.tsx:112`）。读不出来的原因：事件来源（谁触发重开）与新接线方式无法由静态阅读定论。需要用户裁决：**`restart` 的事件来源与应监听对象**。
- **#04-13-F-05**：`client.ts` / `client-modules/src/index.ts` / `entry-client/create.ts` 是否纳入「部分 UI」适配范围。现象：`packages-user/client-modules/src/client.ts:88-92,124-127` 与 `packages-user/entry-client/src/create.ts:16,31,34-41` 的被注释 `loading` / `hook` 接线、`packages-user/client-modules/src/index.ts:1-8` 的 `loading.once('coreInit')` 移除点，均为非 UI（D-71 措辞为「组件 / UI」）。读不出来的原因：D-71 的范围措辞未明确是否覆盖这些非 UI 面（组合根 / 入口）。需要用户裁决：**这些边界面是否纳入第二步适配工作集**。

## 修改点汇总（供后续执行计划消费）

列序固定：`文件 file:line | 现状（旧全局对象 / 旧加载接口） | 应改为监听 / 使用的对象（附 B 类证据锚点，或 undetermined） | 归属（UI / 边界非 UI / 其余） | 置信`。**只汇总本台账已登记条目，不新增未登记事实、不给代码写法。**

| 文件 file:line | 现状（旧全局对象 / 旧加载接口） | 应改为监听 / 使用的对象（证据锚点或 undetermined） | 归属 | 置信 |
|---|---|---|---|---|
| packages-user/client-modules/src/render/ui/load.tsx:71,72,76-79 | 旧加载接口 `initSystemLoadTask()` / `load()` / `progress` 异步迭代 | `IMotaDataLoader`（packages-user/data-state/src/loader/types.ts:19-72）/ `ILoadManager`（packages/loader/src/types.ts:288-335）；`progress` 迭代等价写法 undetermined（F-02） | UI | 高 |
| packages-user/client-modules/src/render/ui/load.tsx:36,91-92,118-119,139 | `client.loader` + `loader.progress.getLoadedTasks` / `getAddedTasks` / `getTotalByte` / `getLoadedByte` / `getByteRatio` | `IMotaDataLoader.manager`（packages-user/data-state/src/loader/types.ts:21）/ `ILoadManager.get*`（packages/loader/src/types.ts:288-335） | UI | 高 |
| packages-user/client-modules/src/render/index.tsx:11,25 | 旧加载 UI 深导 + `sceneController.open(LoadSceneUI, {})`（当前不可达） | undetermined（无法从阅读确定目标对象；F-01） | UI | 中 |
| packages-user/client-modules/src/render/ui/main.tsx:145-152 | 全局 `hook.on('statusBarUpdate', ...)`（已注释） | 可 hook 数据端对象候选（packages-user/data-base/src/hero/types.ts:277-295 等）；精确集合 undetermined（F-03） | UI | 中 |
| packages-user/client-modules/src/render/index.tsx:35-38 | 全局 `hook.on('restart', ...)`（已注释） | undetermined（无法从阅读确定目标对象；F-04） | UI | 中 |
| packages-user/client-modules/src/client.ts:88-92,124-127 | 被注释的 `loading.once('loaded' / 'assetBuilt')` | `IMotaDataLoader`（packages-user/data-state/src/loader/types.ts:19-72）；是否纳入 undetermined（F-05） | 边界非 UI | 中 |
| packages-user/client-modules/src/index.ts:1-8 | `loading.once('coreInit', () => { createGameRenderer(); })` 已移除 | 无（组合根现只 `patchAll()` + `createRender()`；`createGameRenderer` 无调用者） | 边界非 UI | 中 |
| packages-user/entry-client/src/create.ts:16,31,34-41 | 被注释的 `loading` / `hook` 接线（`registered` / `clientRegistered` / `renderLoaded`） | undetermined（无法从阅读确定目标对象；F-05） | 边界非 UI | 中 |

## 处置

- 本文件是部分 UI 进一步接口适配（D-71 / D-72）**第一步（只读收集）**的交付物；本步**未修改任何生产代码**、**未引入任何命名变更**；`files_modified` 仅本文件。
- 相对「只读起始基线」**零变化**（当日 `git status --porcelain -- packages packages-user src` 为空）：本 run 未新增 / 消失任何生产改动，也未回滚 / 暂存 / 提交 / 修改用户的并发改动（D-56）。
- **第二步（适配实施）未规划**，待用户审阅本文件后另行规划（D-72）。本文件不含适配方案、不含 `import` / 调用改写写法、不产出任何新 `*-PLAN.md`。
- 范围限渲染端部分 UI 及其对已删全局 `loading` / `hook` 与旧加载系统的使用点；边界非 UI 面（`client.ts` / `client-modules/src/index.ts` / `entry-client/create.ts`）与 `packages/` / `src/` 命中**仅报告**（D-33 沿用）；`packages-user/client-base/src/material/**`（D-42 / D-48）零触碰；legacy（D-49 / D-55 / D-65）只报告、不登记为待办。
- A / B 为事实层、C 为旧 / 新加载系统清单、D 为 D-69 barrel 判定、E 为 legacy 只报告、F 为未确定项（须用户裁决）；`## 修改点汇总` 供后续第二个执行计划挑选工作集。
- `REND-01` / `REND-02` 保持 **Pending**；`.planning/REQUIREMENTS.md` 零改动；本步无运行时要求（D-68 的延续）。
