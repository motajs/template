# TextureManager 新接口影响范围清点（只读）

**日期:** 2026-09-23
**范围:** 被查对象 `packages-user` 全量消费者面；`packages/` 与 `src/` 命中仅报告、不修改（D-32 沿用）；`packages-user/client-base/src/material/` 按 D-42 只登记、不修改
**性质:** 只读清点（D-38 / D-40 第一步），未修改任何生产代码
**接口基准:** `packages-user/client-base/src/material/{types,manager,autotile,index}.ts` 与 `packages-user/client-base/src/types.ts`（`d36ea69` 后）
**基准提交:** `d36ea69 refactor: 贴图存储方式`（当日工作树 HEAD `d74cc35`；`d36ea69`..`d74cc35` 的用户提交仅触及数据端 `data-base` / `data-common` / `data-system`，未触及 texture 基准与本次清点消费者文件，见「方法」一节）
**下一步:** 第二步（TextureManager 新接口适应实施）未规划，待用户审阅本文件后另行规划（D-40）

## 背景

本文件是 Phase 4 第七个增量（用户裁定 2026-09-22 · D-38 / D-39 / D-40 / D-41 / D-42 **第一步**）的交付物：对 `d36ea69` TextureManager 接口基准在 `packages-user` 消费者面的**只读影响清点**。

- **D-38**：用户已完成 **TextureManager 相关重构**（提交 `d36ea69「refactor: 贴图存储方式」`），`MaterialManager` 改名并重写为 `TextureManager`（构造器不再无参）、`client.autotile` / `IClientBase.autotile` 删除、`AutotileProcessor` 重写、`IAutotileProcessor` 的 `render` / `renderWith` / `renderWithoutCheck` 合并为单一 `render(tile, connection)`、`renderAnimatedWith` → `renderAnimated`、`BlockCls` 枚举整体删除且 `IMaterialFramedData.cls` → `tileType: TileType`、barrel 与入口调整（`createMaterial()` / `create()` 删除）。**影响面大、主要在地图渲染部分**。下一目标 = **适应新接口**。
- **D-39**：**不得修改加载相关的内容**（用户将自行适配新加载系统，属其处理范围）。
- **D-40**：本目标同样走**两步**：**先收集（只读清点）再修复**。第一步产出只读影响清单文档（即本文件）；第二步待用户审阅后再规划。
- **D-41**：「加载相关」的排除边界（用户界定）：**加载本身**，以及**向 `TextureManager` 中添加素材的内容**（均由用户自行适配新加载系统）。
- **D-42**：`packages-user/client-base/src/material/` 文件夹已由用户**重构完毕**；AI **只修改消费者**（如地图渲染）。**若某接口被删除且无替代，必须向用户反馈**，不得自行发明替代方案。
- **D-33（沿用范围约束）**：范围外一律不改；**不追求解决全部类型错误**（整仓既有错误大量与本次无关），只清点与本次 texture 接口适应相关的项。

本步**只清点、不修改、不规划第二步**。本文件不含修复方案、不含代码改动建议、不产出任何 `04-09-PLAN.md` 或新 `*-PLAN.md`（D-40）。

## 方法

**枚举面（两侧）：**

- **（a）基准面**：`packages-user/client-base/src/material/types.ts`（`ITextureManager` / `ITextureGetter` / `ITextureAliasGetter` / `IAutotileProcessor` / `IMaterialFramedData` / `AutotileType` / `IAssetBuilder` / `ITrackedAssetData` 等现行成员）+ `packages-user/client-base/src/material/manager.ts`（`TextureManager` 类与构造器）+ `packages-user/client-base/src/material/autotile.ts`（`AutotileProcessor` 类与构造器）+ `packages-user/client-base/src/material/index.ts` 与 `packages-user/client-base/src/index.ts`（barrel）+ `packages-user/client-base/src/types.ts`（`IClientBase.materials`）+ `packages-user/client-modules/src/types.ts`（`IClientCoreConfig`）。
- **（b）命中面**：`packages-user` 全量（`client-base` / `client-modules` / `client-system` / `entry-*` / `legacy-plugin-*` / `data-fallback`），另对 `packages/` 与 `src/` 做**对照扫描**（只登记、不修改）。

**判定口径（六类固定，一条记录只归一类，跨类拆条并互相引用）：**

| 类别 | 含义 | 归属规则 |
|---|---|---|
| A | **符号级**：改名 / 移除的符号引用点 | `TextureManager`（新名消费者）与 `MaterialManager` / `renderAnimatedWith` / `getIdentifierByAlias` / `getAliasByIdentifier` / `getBlockCls(ByAlias)` 的**旧名引用点**（本次实测均为 0，须给机器证据）、`BlockCls` 消费者 import、`IMaterialFramedData.cls` 消费者读写点、`AutotileProcessor` 构造器调用点、`IClientBase.autotile` 与 `create()` / `createMaterial()` 的消费者 |
| B | **签名级**：成员在但参数 / 类型变化的调用点 | `addGrid` / `addRowAnimate` / `addAutotile` / `addTileset` 的调用点、`ITextureManager` 新增成员（`tiles` / `autotile` / `tilesetReserve` / `tilesetUnit` / `getFrameCount`）与 `IClientCoreConfig` 新增必填字段的实现 / 传入点、`IAutotileProcessor.flatten` 新增 |
| C | **定位索引**（不新增独立事实） | 第二步将触及的 `file:line` 按文件汇总，逐条**交叉引用其 A / B / D 记录 ID** |
| D | **被删且无替代**（需用户反馈） | `renderWithoutCheck`、`BlockCls` 及其 `@deprecated` 依赖（`material/utils.ts`，用户自有面）、`manager`、`renderWith`、`getIdentifierByAlias` / `getAliasByIdentifier`、`getBlockCls(ByAlias)`、`IClientBase.autotile`、`create()` / `createMaterial()` |
| E | 加载相关与添加素材（仅报告） | `client-base/src/load/loader.ts`（加载本身）+ `client-modules/src/fallback/load.ts`（向 `TextureManager` 添加素材）+ `packages/` / `src/` 对照扫描 |
| F | 未能从阅读确定 | 只登记，不得写成错配 / 缺失 / 残留 |

**分列规则（写死，防止类别互相冒充）：** A 记「符号级（旧名 / 被删符号的消费者引用）」；B 记「签名级（成员在但参数 / 类型变化的消费者调用）」；C 记「第二步将触及的定位汇总（不新增独立事实，逐条交叉引用 A / B / D 的 ID）」；D 记「接口已删且 AI 未发现替代（每行明写需用户反馈）」；E 记「加载本身 + 向 `TextureManager` 添加素材（D-39 / D-41 归用户）」；F 记「静态阅读不能定论」。**一条记录只归一类，跨类拆条并互相引用。**

**证据纪律：** 每行含 `符号/成员名 + 命中处 file:line + 基准侧锚点 file:line + 问题描述 + 影响 + 置信`，**每行至少两个 `file:line` 锚点**；静态阅读不能定论者一律进 F 类，**不得写成错配 / 缺失 / 残留**。

**D-42 纪律：** 命中 `packages-user/client-base/src/material/` 内的记录一律归 D 类并标注「用户自有面」，不得写成 AI 工作项。

**只读起始基线（packages / packages-user / src）**：Task 1 起始执行 `git status --porcelain -- packages packages-user src`，当日实测输出（原样逐行记录，为空）：

```
（无）
```

**基线说明（重要）：** 规划日（2026-09-22）该输出为**空**；当日 0a 起始实测**非空（15 条）**，用户在本 run 期间持续编辑数据端（条目数一度增至 22），随后用户提交 `7743795 refactor: Hero equipment system` 与 `d74cc35 feat: Adding should replay flag`（均为数据端）后归零，故门禁终跑时本块为「（无）」。本 run 一律**不回滚 / 不暂存 / 不提交 / 不修改**用户的任何改动，并以其为只读起始基线（点对点快照）；Task 1 / Task 3 门禁断言其后**逐条一致**（不新增、不消失、状态码不变）。用户改动全部位于 `packages-user/data-base` / `data-common` / `data-system`，不在本计划改动范围内；其提交未触及 texture 基准与本次消费者文件。`packages` / `client-base` / `client-modules` / `src` 下无条目。

**基准提交核对：** 当日 0a 起始 HEAD = `e78309b`；用户在本 run 期间提交 `7743795 refactor: Hero equipment system` 与 `d74cc35 feat: Adding should replay flag`（均为数据端），HEAD 现为 `d74cc35`；`git merge-base --is-ancestor d36ea69 HEAD` 退出码 0。用户新提交仅触及 `packages-user/data-base` / `data-common` / `data-system`；`git diff --stat e78309b HEAD -- packages-user/client-base/src/material packages-user/client-base/src/types.ts packages-user/client-modules/src/render/map packages-user/client-modules/src/fallback packages-user/entry-client/src/create.ts` **无输出**，即 texture 基准（`material/` 与 `client-base/src/types.ts`）与本次清点的消费者文件未被触及，故 texture 接口基准 = `d36ea69`，文档行号在当日实测下有效。

**类型门禁命令与口径：** `pnpm exec vue-tsc --noEmit`；「错误总行数」= 输出中正则 `error TS\d+` 的匹配数（与 Task 3 门禁同一正则，保证可逐字比对）；「texture 归属错误行数」为**规划日 / 执行日人工归类**，执行日按当日实测重新归类并逐行列出，**不由任何门禁断言**、由人工复核保证。

**只读子代理：** 重型整文件读取可按 D-09 委派**只读**子代理（子代理只回传事实表「符号 / 成员名 + 所属 `file:line` + 形态或签名」，**不得写文件、不得贴大段源码**），最终由主执行者按 `file:line` 切片复核。

## 基准变更（d36ea69）

依据：`git show d36ea69 --stat`（共触及 12 个文件：`client-base/src/{index.ts,types.ts,material/{types,manager,autotile,index}.ts}`、`client-modules/src/{client.ts,core.ts,types.ts,render/map/renderer.ts}`、`entry-client/src/create.ts`、`packages/common/src/logger.json`）与 `git show d36ea69 -- <基准文件>`，并与当日工作树逐条比对一致。以下三类差异中，每条附**现行基准侧锚点**（`file:line`）。

**① 改名 1 类：**

| 旧名 | 新名 | 现行基准侧锚点 | 说明 |
|---|---|---|---|
| `MaterialManager` | `TextureManager` | `packages-user/client-base/src/material/manager.ts:37` | `export class TextureManager implements ITextureManager`；构造器由无参改为 `constructor(readonly state: ICoreState, readonly tiles: ITileStore, readonly tilesetReserve: number, readonly tilesetUnit: number)`（`packages-user/client-base/src/material/manager.ts:84-89`）；消费者 `packages-user/client-modules/src/client.ts:15`（import）与 `packages-user/client-modules/src/client.ts:83`（构造点） |

另记 `AutotileProcessor` 构造器一并收紧为单参 `constructor(readonly state: ICoreState)`（`packages-user/client-base/src/material/autotile.ts:64` 类声明、`packages-user/client-base/src/material/autotile.ts:75` 构造器）；`TextureManager` 构造内 `this.autotile = new AutotileProcessor(state);`（`packages-user/client-base/src/material/manager.ts:90`）。

**② 移除（现行基准成员集合已不含）：**

- **`BlockCls` 枚举整体删除**：现行 `packages-user/client-base/src/material/types.ts` 的成员集合不含 `BlockCls`（对照：`IMaterialFramedData` 现为 `tileType: TileType`，锚点 `packages-user/client-base/src/material/types.ts:75-86`）。消费者 import 见 A 类 `#04-08-A-06`，用户自有面命中见 D 类 `#04-08-D-03`。
- **`IMaterialFramedData.cls: BlockCls` → `tileType: TileType`**：现行锚点 `packages-user/client-base/src/material/types.ts:79`；消费者读写点见 A 类 `#04-08-A-03`..`#04-08-A-05`。
- **`IAutotileProcessor` 的 `render(autotile: number, connection)` / `renderWith(tile, connection)` / `renderWithoutCheck(tile, connection)` 三者合并为 `render(tile: IMaterialFramedData, connection: number)`**：现行锚点 `packages-user/client-base/src/material/types.ts:148-151`（`render(tile: IMaterialFramedData, connection: number): ITextureRenderable | null`）；`renderWithoutCheck` 消费者 3 处见 D 类 `#04-08-D-01`，`renderWith` 消费者 0 处见 D 类 `#04-08-D-05`。
- **`IAutotileProcessor.manager` 删除**：现行 `IAutotileProcessor`（`packages-user/client-base/src/material/types.ts:94-163`）无 `manager` 成员；消费者 0 处见 D 类 `#04-08-D-04`。
- **`renderAnimatedWith` → `renderAnimated`**：现行锚点 `packages-user/client-base/src/material/types.ts:159-162`；已适配点为 `packages-user/client-modules/src/render/map/renderer.ts:1264`（`this.autotile.renderAnimated(tex, 0b1111_1111)`）；旧名 `renderAnimatedWith` 引用 0 处，见 A 类 `#04-08-A-12`。
- **`ITextureManager.getIdentifierByAlias` / `getAliasByIdentifier` 删除**：现行 `ITextureManager`（`packages-user/client-base/src/material/types.ts:217-404`）无此二者；消费者 0 处见 A 类 `#04-08-A-09` / D 类 `#04-08-D-06`。
- **`ITextureManager.clsMap` 删除**：现行 `ITextureManager`（`packages-user/client-base/src/material/types.ts:217-404`）无 `clsMap`。
- **`ITextureGetter.getBlockCls` 删除 / `ITextureAliasGetter.getBlockClsByAlias` 删除**：现行 `ITextureGetter`（`packages-user/client-base/src/material/types.ts:165-189`）与 `ITextureAliasGetter`（`packages-user/client-base/src/material/types.ts:191-215`）均无 `getBlockCls` / `getBlockClsByAlias`；消费者 0 处见 A 类 `#04-08-A-10` / D 类 `#04-08-D-09`。
- **`IClientBase.autotile` 删除**：现行 `IClientBase`（`packages-user/client-base/src/types.ts:8-25`）仅保留 `materials: ITextureManager`（`packages-user/client-base/src/types.ts:18`），无 `autotile` 成员；消费者面见 A 类 `#04-08-A-08` / D 类 `#04-08-D-07`。
- **barrel 入口函数删除**：`packages-user/client-base/src/material/index.ts` 的 `createMaterial()`（连同 `createAutotile` import）已删除（现行文件仅剩 5 行 `export * from ...`，锚点 `packages-user/client-base/src/material/index.ts:1-5`）；`packages-user/client-base/src/index.ts` 的 `create()`（连同 `createMaterial` import）已删除（现行文件锚点 `packages-user/client-base/src/index.ts:1-5`）。消费者面见 A 类 `#04-08-A-11` / D 类 `#04-08-D-08`；`git grep -n -E "export function create\b|createMaterial|createAutotile" -- packages-user/client-base` **无输出**（退出码 1）。

**③ 新增 / 收紧：**

- `ITextureManager` 新增 `readonly tiles: ITileStore`（`packages-user/client-base/src/material/types.ts:220`）与 `readonly autotile: IAutotileProcessor`（`packages-user/client-base/src/material/types.ts:222`），并保留 `readonly textures`（`packages-user/client-base/src/material/types.ts:225`）；新增 `readonly tilesetReserve`（`packages-user/client-base/src/material/types.ts:241`）与 `readonly tilesetUnit`（`packages-user/client-base/src/material/types.ts:246`）；新增 `getFrameCount(num: number): number`（`packages-user/client-base/src/material/types.ts:336`）。
- 四个 `add*` 方法参数收紧：`addGrid(source, map: ArrayLike<number>, width, height)`（`packages-user/client-base/src/material/types.ts:261-266`）、`addRowAnimate(source, map: ArrayLike<number>, width, height)`（`packages-user/client-base/src/material/types.ts:275-280`）、`addAutotile(source, identifier: number, type: AutotileType)`（`packages-user/client-base/src/material/types.ts:289-293`）、`addTileset(source, identifier, cellWidth, cellHeight)`（`packages-user/client-base/src/material/types.ts:302-307`）。
- `IAutotileProcessor.flatten(source: SizedCanvasImageSource, type: AutotileType, frames: number)` 新增（`packages-user/client-base/src/material/types.ts:101-105`）。
- `AutotileType` 新增（`packages-user/client-base/src/material/types.ts:12-17`，`Small2x3` / `Big3x4`）。
- `IClientCoreConfig` 新增 `tilesetReserve` / `tilesetUnit` 两个必填字段（`packages-user/client-modules/src/types.ts:8-10`）。

**同提交内的相邻变更（登记，不作本步裁定）：**

- `packages-user/client-modules/src/core.ts:6-11`：单例构造由 `new ClientCore()` 改为传入 config（`tilesetReserve: 100000` / `tilesetUnit: 5000`）。
- `packages-user/entry-client/src/create.ts:26`：`Mota.register('@user/client-base', UserClientBase)` 仍整体注册该命名空间；同提交删除了 `createModule` 内的 `UserClientBase.create();` 调用（现行 `packages-user/entry-client/src/create.ts:36` 仅剩 `ClientModules.create();`）。
- `packages/common/src/logger.json`：新增 8 行（logger codes）。

**不得**修改任何被引用文件。

## 类型门禁实测基线

命令：`pnpm exec vue-tsc --noEmit`（整仓非 0 退出属预期）。统计口径：正则 `error TS\d+` 的匹配数。

- **错误总行数**：263
- **texture 归属错误行数**：23

机器比对形式（与本节门禁的同一正则同形，便于逐字比对）：错误总行数：263；texture 归属错误行数：23。

**与规划日（2026-09-22，HEAD `d36ea69`，工作树干净）的差异：** 规划日实测总行数为 **202**，当日实测为 **263**，差 **+61**。原因：用户并发进行中的数据端重构（`packages-user/data-base` / `data-common` / `data-system`；本 run 期间先为未提交改动，后经 `7743795` / `d74cc35` 提交）为数据层类型错误的新增来源（`data-base` 116 + `data-state` 57 + `data-system` 52），与 `d36ea69` texture 接口改动无关。**texture 归属错误行数仍为 23（与规划日一致）**，说明 texture 接口改动对消费者面的影响未因工作树改动而扩大。以上以当日实测为准（见 assumptions）。

**texture 归属错误逐行列出（23 条 = `client-base` 1 条 + `client-modules` 22 条）：**

`packages-user/client-base`（1 条）：

1. `packages-user/client-base/src/material/utils.ts:2` `error TS2305`：`Module '"./types"' has no exported member 'BlockCls'.`（用户自有面，见 D 类 `#04-08-D-03`）

`packages-user/client-modules`（22 条）：

2. `packages-user/client-modules/src/fallback/load.ts:76` `error TS2554`：`Expected 4 arguments, but got 2.`（`addGrid`，加载面，见 E 类 `#04-08-E-01`）
3. `packages-user/client-modules/src/fallback/load.ts:77` `error TS2554`：`Expected 4 arguments, but got 2.`（`addGrid`）
4. `packages-user/client-modules/src/fallback/load.ts:80` `error TS2554`：`Expected 4 arguments, but got 3.`（`addRowAnimate`）
5. `packages-user/client-modules/src/fallback/load.ts:81` `error TS2554`：`Expected 4 arguments, but got 3.`（`addRowAnimate`）
6. `packages-user/client-modules/src/fallback/load.ts:82` `error TS2554`：`Expected 4 arguments, but got 3.`（`addRowAnimate`）
7. `packages-user/client-modules/src/fallback/load.ts:83` `error TS2554`：`Expected 4 arguments, but got 3.`（`addRowAnimate`）
8. `packages-user/client-modules/src/fallback/load.ts:84` `error TS2554`：`Expected 4 arguments, but got 3.`（`addRowAnimate`）
9. `packages-user/client-modules/src/fallback/load.ts:95` `error TS2554`：`Expected 3 arguments, but got 2.`（`addAutotile`）
10. `packages-user/client-modules/src/fallback/load.ts:105` `error TS2554`：`Expected 4 arguments, but got 2.`（`addTileset`）
11. `packages-user/client-modules/src/render/map/extension/hero.ts:15` `error TS2305`：`Module '"@user/client-base"' has no exported member 'BlockCls'.`
12. `packages-user/client-modules/src/render/map/extension/hero.ts:167` `error TS2353`：`Object literal may only specify known properties, and 'cls' does not exist in type 'IMaterialFramedData'.`
13. `packages-user/client-modules/src/render/map/renderer.ts:10` `error TS2305`：`Module '"@user/client-base"' has no exported member 'BlockCls'.`
14. `packages-user/client-modules/src/render/map/renderer.ts:234` `error TS2554`：`Expected 1 arguments, but got 2.`（`AutotileProcessor`）
15. `packages-user/client-modules/src/render/map/renderer.ts:1252` `error TS2339`：`Property 'cls' does not exist on type 'Readonly<IMaterialFramedData>'.`
16. `packages-user/client-modules/src/render/map/renderer.ts:1253` `error TS2339`：`Property 'renderWithoutCheck' does not exist on type 'IAutotileProcessor'.`
17. `packages-user/client-modules/src/render/map/renderer.ts:1263` `error TS2339`：`Property 'cls' does not exist on type 'Readonly<IMaterialFramedData>'.`
18. `packages-user/client-modules/src/render/map/vertex.ts:27` `error TS2305`：`Module '"@user/client-base"' has no exported member 'BlockCls'.`
19. `packages-user/client-modules/src/render/map/vertex.ts:461` `error TS2339`：`Property 'renderWithoutCheck' does not exist on type 'IAutotileProcessor'.`
20. `packages-user/client-modules/src/render/map/vertex.ts:517` `error TS2339`：`Property 'cls' does not exist on type 'Readonly<IMaterialFramedData>'.`
21. `packages-user/client-modules/src/render/map/vertex.ts:561` `error TS2339`：`Property 'cls' does not exist on type 'Readonly<IMaterialFramedData>'.`
22. `packages-user/client-modules/src/render/map/vertex.ts:852` `error TS2339`：`Property 'cls' does not exist on type 'IMaterialFramedData'.`
23. `packages-user/client-modules/src/render/map/vertex.ts:874` `error TS2339`：`Property 'renderWithoutCheck' does not exist on type 'IAutotileProcessor'.`

**单列：另两类错误（不计入 texture 归属）**

- **② 加载系统重构（提交 `cc434a6`）既有 15 条**（与 `d36ea69` 无关）：
    - `packages-user/client-base/src/load/loader.ts:17,18,19,20,21,28` `error TS2305`×6：`Module '"@user/data-base"' has no exported member 'LoadAudioProcessor' / 'LoadFontProcessor' / 'LoadImageProcessor' / 'LoadTextProcessor' / 'LoadZipProcessor' / 'IMotaDataLoader'.`
    - `packages-user/client-modules/src/render/ui/load.tsx:73,74,79,80,93,94,120,121,141` `error TS2339`×9：`Property 'initSystemLoadTask' / 'load' / 'progress' does not exist on type 'IMotaDataLoader'.`
- **③ 其余既有 225 条**：`packages-user/data-base`（116）、`packages-user/data-state`（57）、`packages-user/data-system`（52）的测试 / 寻路 / 数据端接口相关既有错误，含用户当日并发未提交改动引入的新增项；与 texture 接口改动无关。

**口径说明：** 「texture 归属 / 加载既有 / 其余既有」的划分为**规划日 / 执行日的人工归类**（texture 23 = `client-base` 1 + `client-modules` 22；加载既有 15；其余既有 225），**须用户在审阅时确认**。若用户判定其中某条应改类，执行者按裁定重新归类并同步数字与「处置」一节的口径说明，不得改动其它事实。此划分**不由任何机器门禁断言**；门禁只覆盖**错误总行数**（Task 3 重跑等于本记录值 263）。

## A 符号改名与移除的引用点

列序固定：`ID | 符号/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信`。本节登记**消费者侧**对 `d36ea69` 改名 / 移除符号的引用点；`material/` 内命中见 D 类「用户自有面」。**行内不含任何修复建议或替代写法**（替代是否成立属 F 类）。

| ID | 符号/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-08-A-01 | `TextureManager`（新名，消费者） | packages-user/client-modules/src/client.ts:15, packages-user/client-modules/src/client.ts:83 | packages-user/client-base/src/material/manager.ts:37 | 新名消费者：`client.ts:15` 从 `@user/client-base` import `TextureManager`；`client.ts:83-88` `new TextureManager(this, this.tileStore, config.tilesetReserve, config.tilesetUnit)` 按新构造器（4 参）构造 | 构造器已按新签名适配，无类型错误；为旧名 `MaterialManager`（A-02）的对照锚点 | 高 |
| #04-08-A-02 | `MaterialManager`（旧名） | 引用点 0 处（核对命令 `git grep -n -- MaterialManager -- packages-user` 无输出、退出码 1） | packages-user/client-base/src/material/manager.ts:37, packages-user/client-modules/src/client.ts:83 | 旧名 `MaterialManager` 在 `packages-user` 源码面**引用点 0 处**；现行权威基准为 `material/manager.ts:37` 的 `TextureManager`，消费者 `client.ts:83` 已改用新名。机器证据：`git grep -n -- MaterialManager -- packages-user` 无输出 | 无消费者调用导致的类型错误（旧名已彻底清零） | 高 |
| #04-08-A-03 | `IMaterialFramedData.cls`（写占位点） | packages-user/client-modules/src/render/map/extension/hero.ts:167 | packages-user/client-base/src/material/types.ts:79, packages-user/client-base/src/material/types.ts:75-86 | 勇士贴图构造 `IMaterialFramedData` 对象字面量时仍写 `cls: BlockCls.Unknown`（`hero.ts:164-170`）；基准现行成员为 `tileType: TileType`（`types.ts:79`），无 `cls` | 编译报 TS2353（`hero.ts:167`，`'cls' does not exist in type 'IMaterialFramedData'`）。是否落入 D-18 `HeroRendering` 暂不处理边界，列入 F 类 `#04-08-F-03` | 高 |
| #04-08-A-04 | `IMaterialFramedData.cls`（读点，背景） | packages-user/client-modules/src/render/map/renderer.ts:1252, packages-user/client-modules/src/render/map/renderer.ts:1263 | packages-user/client-base/src/material/types.ts:79, packages-user/client-base/src/material/types.ts:75-86 | `useTileBackground` 内两处 `if (tex.cls === BlockCls.Autotile)`（`:1252` 单帧分支、`:1263` 多帧分支）读取已被移除的 `cls`；同处 `:1264` 已改用 `renderAnimated`（见 A-12） | 编译报 TS2339×2（`renderer.ts:1252` / `renderer.ts:1263`） | 高 |
| #04-08-A-05 | `IMaterialFramedData.cls`（读 / 解构点） | packages-user/client-modules/src/render/map/vertex.ts:517, packages-user/client-modules/src/render/map/vertex.ts:561, packages-user/client-modules/src/render/map/vertex.ts:852, packages-user/client-modules/src/render/map/vertex.ts:872 | packages-user/client-base/src/material/types.ts:79, packages-user/client-base/src/material/types.ts:75-86 | 顶点生成器四处消费被移除的 `cls`：`:517` `tile.cls !== BlockCls.Autotile`、`:561` `tile.cls === BlockCls.Autotile`、`:852` `const { cls, frames, offset, texture } = block.texture;`（解构自 `IMovingBlock.texture`，`map/types.ts:204`）、`:872` `if (cls === BlockCls.Autotile)` | 编译报 TS2339×3（`vertex.ts:517` / `vertex.ts:561` / `vertex.ts:852`）；`:872` 复用 `:852` 已解构的 `cls`，另命中 `BlockCls`（A-06） | 高 |
| #04-08-A-06 | `BlockCls`（枚举删除后的消费者 import / 使用） | packages-user/client-modules/src/render/map/extension/hero.ts:15, packages-user/client-modules/src/render/map/renderer.ts:10, packages-user/client-modules/src/render/map/vertex.ts:27 | packages-user/client-base/src/material/types.ts:75-86, packages-user/client-base/src/material/index.ts:4 | 三处消费者从 `@user/client-base` import `BlockCls`（`hero.ts:15`、`renderer.ts:10`、`vertex.ts:27`），且 `hero.ts:167` / `renderer.ts:1252,1263` / `vertex.ts:517,561,872` 使用其成员；`BlockCls` 已从基准 `material/types.ts` 整体删除（`material/index.ts:4` `export * from './types'` 的导出集合已不含） | 三处 import 均编译报 TS2305；`material/utils.ts:2` 同因命中（用户自有面，见 D-03） | 高 |
| #04-08-A-07 | `AutotileProcessor`（构造点） | packages-user/client-modules/src/render/map/renderer.ts:234, packages-user/client-modules/src/client.ts:16 | packages-user/client-base/src/material/autotile.ts:64, packages-user/client-base/src/material/autotile.ts:75, packages-user/client-base/src/material/manager.ts:90 | 消费者 `renderer.ts:234` 仍按旧形参个数构造 `new AutotileProcessor(manager, manager.state)`（2 参）；基准构造器现为单参 `constructor(readonly state: ICoreState)`（`autotile.ts:75`），正确构造示例见基准实现 `manager.ts:90`（`new AutotileProcessor(state)`）；`client.ts:16` 的 `AutotileProcessor` import 在 `client.autotile` 删除后成为未使用 import | 编译报 TS2554（`renderer.ts:234`，期望 1 参得 2 参）；`client.ts:16` 为潜在未使用 import | 高 |
| #04-08-A-08 | `IClientBase.autotile`（删除后的消费者面） | packages-user/client-modules/src/client.ts:14, packages-user/client-modules/src/client.ts:16 | packages-user/client-base/src/types.ts:18, packages-user/client-base/src/types.ts:8-25 | `IClientBase`（`types.ts:8-25`）现仅保留 `materials: ITextureManager`（`types.ts:18`），`autotile` 成员已删；消费者 `client.ts:14`（`IAutotileProcessor` import）与 `client.ts:16`（`AutotileProcessor` import）在 `ClientCore.autotile` 字段删除后失去使用点 | `client.ts` 的两处 import 为未使用 import（潜在 lint 诊断）；`ClientCore` 类字段实现已随之删除（同提交） | 高 |
| #04-08-A-09 | `ITextureManager.getIdentifierByAlias` / `getAliasByIdentifier`（旧名） | 引用点 0 处（核对命令 `git grep -n -- getIdentifierByAlias -- packages-user` 与 `git grep -n -- getAliasByIdentifier -- packages-user` 均无输出、退出码 1） | packages-user/client-base/src/material/types.ts:217, packages-user/client-base/src/material/types.ts:220 | 两个别名查找成员已从 `ITextureManager`（`types.ts:217-404`）删除，`packages-user` 源码面**引用点 0 处**；现行该接口通过 `tiles`（`types.ts:220`）等成员对外表达 | 无消费者调用导致的类型错误（旧名已清零） | 高 |
| #04-08-A-10 | `ITextureGetter.getBlockCls` / `ITextureAliasGetter.getBlockClsByAlias`（旧名） | 引用点 0 处（核对命令 `git grep -n -- getBlockClsByAlias -- packages-user` 与 `git grep -n -- getBlockCls -- packages-user` 均无输出、退出码 1） | packages-user/client-base/src/material/types.ts:165, packages-user/client-base/src/material/types.ts:191 | 两个取类成员已从 `ITextureGetter`（`types.ts:165-189`）与 `ITextureAliasGetter`（`types.ts:191-215`）删除，`packages-user` 源码面**引用点 0 处** | 无消费者调用导致的类型错误（旧名已清零） | 高 |
| #04-08-A-11 | `create()` / `createMaterial()`（入口函数删除后的消费者） | packages-user/entry-client/src/create.ts:26（整体注册 `@user/client-base` 命名空间处） | packages-user/client-base/src/index.ts:1, packages-user/client-base/src/material/index.ts:1 | `packages-user/client-base/src/index.ts` 的 `create()`（连同 `createMaterial` import）与 `material/index.ts` 的 `createMaterial()`（连同 `createAutotile` import）已删除，现行两文件仅剩 `export *`；包内调用点 **0**（原调用点 `entry-client/src/create.ts` 的 `UserClientBase.create();` 已随同提交删除）。机器证据：`git grep -n -E "createMaterial\|UserClientBase\.create" -- packages-user src` 无输出 | `entry-client/src/create.ts:26` 仍把整个命名空间注册进 legacy 插件系统（该命名空间内 `create` 已不在）；插件面是否调用列入 F 类 `#04-08-F-07` | 高 |
| #04-08-A-12 | `renderAnimatedWith`（旧名） / `renderAnimated`（新名） | packages-user/client-modules/src/render/map/renderer.ts:1264（新名，已适配点） | packages-user/client-base/src/material/types.ts:159, packages-user/client-base/src/material/types.ts:148-151 | `renderAnimatedWith` 在 `packages-user` 源码面**引用点 0 处**（核对命令 `git grep -n -- renderAnimatedWith -- packages-user` 无输出、退出码 1）；新名 `renderAnimated` 已适配点 `renderer.ts:1264`（`this.autotile.renderAnimated(tex, 0b1111_1111)`），基准声明 `types.ts:159-162` | 无旧名残留；该点无类型错误 | 高 |
| #04-08-A-13 | `renderWith`（旧名） | 引用点 0 处（精确核对 `git grep -n -E "\.renderWith\(|renderWith\(" -- packages-user` 无输出；注意 `git grep -n -- renderWith` 的 3 条命中为 `renderWithoutCheck` 的子串，非 `renderWith` 本身） | packages-user/client-base/src/material/types.ts:148, packages-user/client-base/src/material/types.ts:151 | 旧成员 `renderWith` 已合并入 `render(tile, connection)`（`types.ts:148-151`），**引用点 0 处**；须区分：`renderWithoutCheck`（D 类 `#04-08-D-01`）是另一被删成员，其 3 处调用点非 `renderWith` 的调用 | 无 `renderWith` 消费者调用导致的类型错误 | 高 |

**A 类小结：** 覆盖改名 1 个（`TextureManager`）、旧名 5 个（`MaterialManager` / `renderAnimatedWith` / `getIdentifierByAlias` / `getAliasByIdentifier` / `getBlockCls(ByAlias)`，源码面引用均 **0**）、被删符号消费者（`BlockCls` 3 处 import、`cls` 7 处读写 = hero 1 + renderer 2 + vertex 4、`AutotileProcessor` 构造 1 处 + 1 处未使用 import、`IClientBase.autotile` 2 处未使用 import、`create()` / `createMaterial()` 命名空间注册 1 处）。**行内无修复建议。**

## B 成员与签名变化的调用点

列序固定：`ID | 符号/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信`。本节登记**签名级**（成员在但参数 / 类型变化）的调用点与新增成员的实现 / 传入点。**每行含基准侧声明 `file:line` + 命中侧调用 `file:line`。**

| ID | 符号/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-08-B-01 | `ITextureManager.tiles` / `autotile` / `tilesetReserve` / `tilesetUnit`（新增成员） | packages-user/client-base/src/material/manager.ts:84-89, packages-user/client-modules/src/client.ts:83-88 | packages-user/client-base/src/material/types.ts:220, packages-user/client-base/src/material/types.ts:222, packages-user/client-base/src/material/types.ts:241, packages-user/client-base/src/material/types.ts:246 | 基准新增四成员；实现侧 `manager.ts:38` 声明 `autotile`，构造器 `manager.ts:84-89` 以 `(state, tiles, tilesetReserve, tilesetUnit)` 实现四成员；消费侧 `client.ts:83-88` 传入 `this.tileStore` / `config.tilesetReserve` / `config.tilesetUnit`。`manager.ts` 属用户自有面（D-42），只登记 | 无类型错误（新签名已适配）；用户自有面不得由 AI 修改 | 高 |
| #04-08-B-02 | `IClientCoreConfig.tilesetReserve` / `tilesetUnit`（新增必填字段） | packages-user/client-modules/src/core.ts:6-11, packages-user/client-modules/src/client.ts:86-87 | packages-user/client-modules/src/types.ts:8-10 | 基准 `IClientCoreConfig` 新增两个必填字段（`types.ts:8-10`）；单例传入点 `core.ts:6-11`（`tilesetReserve: 100000` / `tilesetUnit: 5000`）；消费点 `client.ts:86-87`（传入 `TextureManager` 构造器） | 无类型错误（两处已同步） | 高 |
| #04-08-B-03 | `addGrid(source, map, width, height)`（参数收紧） | packages-user/client-modules/src/fallback/load.ts:76, packages-user/client-modules/src/fallback/load.ts:77 | packages-user/client-base/src/material/types.ts:261-266 | 基准 `addGrid` 现收 `(source, map: ArrayLike<number>, width, height)`（4 参）；调用点 `load.ts:76`（`addGrid(images.terrains, terrains)`）与 `load.ts:77`（`addGrid(images.items, items)`）仍传 2 参。**按 D-39 / D-41 归 E 类只报告**，交叉引用 E 类 `#04-08-E-01`，不属第二步 AI 工作项 | 编译报 TS2554×2（`load.ts:76` / `load.ts:77`）；归用户加载面 | 高 |
| #04-08-B-04 | `addRowAnimate(source, map, width, height)`（参数收紧） | packages-user/client-modules/src/fallback/load.ts:80, packages-user/client-modules/src/fallback/load.ts:81, packages-user/client-modules/src/fallback/load.ts:82, packages-user/client-modules/src/fallback/load.ts:83, packages-user/client-modules/src/fallback/load.ts:84 | packages-user/client-base/src/material/types.ts:275-280 | 基准 `addRowAnimate` 现收 4 参（`source, map: ArrayLike<number>, width, height`）；5 处调用点（`load.ts:80-84`）仍传 3 参（末参原为宽度，新签名须补高度）。**按 D-39 / D-41 归 E 类只报告**，交叉引用 E 类 `#04-08-E-01` | 编译报 TS2554×5（`load.ts:80-84`）；归用户加载面 | 高 |
| #04-08-B-05 | `addAutotile(source, identifier: number, type: AutotileType)`（参数收紧） | packages-user/client-modules/src/fallback/load.ts:95 | packages-user/client-base/src/material/types.ts:289-293 | 基准 `addAutotile` 现收 `(source, identifier: number, type: AutotileType)`（3 参）；调用点 `load.ts:95`（`addAutotile(img, identifier)`，`identifier` 为 `IBlockIdentifier` 对象）仍传 2 参，且第二参类型为 `number`。**按 D-39 / D-41 归 E 类只报告**，交叉引用 E 类 `#04-08-E-01` | 编译报 TS2554（`load.ts:95`）；归用户加载面 | 高 |
| #04-08-B-06 | `addTileset(source, identifier, cellWidth, cellHeight)`（参数收紧） | packages-user/client-modules/src/fallback/load.ts:105 | packages-user/client-base/src/material/types.ts:302-307 | 基准 `addTileset` 现收 `(source, identifier, cellWidth, cellHeight)`（4 参）；调用点 `load.ts:105`（`addTileset(img, identifier)`）仍传 2 参。**按 D-39 / D-41 归 E 类只报告**，交叉引用 E 类 `#04-08-E-01` | 编译报 TS2554（`load.ts:105`）；归用户加载面 | 高 |
| #04-08-B-07 | `IAutotileProcessor.flatten(source, type, frames)`（新增成员） | packages-user/client-base/src/material/manager.ts:456 | packages-user/client-base/src/material/types.ts:101-105 | 基准新增 `flatten(source: SizedCanvasImageSource, type: AutotileType, frames: number)`（`types.ts:101-105`）；实现侧消费示例 `manager.ts:456`（`this.autotile.flatten(source, autotileType, frames)`）。`manager.ts` 属用户自有面（D-42），只登记 | 无类型错误；用户自有面不得由 AI 修改 | 高 |
| #04-08-B-08 | `getFrameCount(num)`（新增成员） | 消费者 0 处（核对命令 `git grep -n -- getFrameCount -- packages-user` 命中仅基准声明与实现） | packages-user/client-base/src/material/types.ts:336, packages-user/client-base/src/material/manager.ts:270 | 基准新增 `getFrameCount(num: number): number`（`types.ts:336`），实现 `manager.ts:270-272`；`packages-user` 消费者**调用点 0 处**（当前无消费者，属新增公共面） | 无类型错误；新增成员暂无消费者 | 高 |

**B 类小结：** 覆盖 `ITextureManager` 新增 5 个成员（`tiles` / `autotile` / `tilesetReserve` / `tilesetUnit` / `getFrameCount`）、`IClientCoreConfig` 新增 2 个必填字段、四个 `add*` 方法参数收紧的调用点（全部落在 `fallback/load.ts`，按 D-39 / D-41 归 E 类只报告）、`flatten` 新增。**每行含基准侧声明与命中侧调用两个锚点。**

## C 地图渲染消费者定位索引

列序固定：`ID | 符号/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信`。本节**不新增独立事实**，只把第二步将触及的定位点按文件汇总，并逐条**交叉引用其 A / B / D 记录 ID**。**C 行不得把 E 类（加载相关）或 `material/` 内（D 类用户自有面）的定位点写成 AI 工作项**；第二步是否纳入由用户据本文件裁定。

| ID | 符号/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-08-C-01 | 地图渲染器 `render/map/renderer.ts` 定位点 | packages-user/client-modules/src/render/map/renderer.ts:10, packages-user/client-modules/src/render/map/renderer.ts:234, packages-user/client-modules/src/render/map/renderer.ts:1252, packages-user/client-modules/src/render/map/renderer.ts:1253, packages-user/client-modules/src/render/map/renderer.ts:1263 | packages-user/client-base/src/material/types.ts:79 | 定位汇总：`:10` `BlockCls` import（→ #04-08-A-06）、`:234` `AutotileProcessor` 构造（→ #04-08-A-07）、`:1252` / `:1263` `tex.cls` 读（→ #04-08-A-04）、`:1253` `renderWithoutCheck`（→ #04-08-D-01）；另 `:1264` 为已适配的 `renderAnimated`（→ #04-08-A-12）。第二步是否纳入由用户裁定 | 定位索引，无独立事实；对应类型错误见 `## 类型门禁实测基线` | 高 |
| #04-08-C-02 | 地图顶点生成器 `render/map/vertex.ts` 定位点 | packages-user/client-modules/src/render/map/vertex.ts:27, packages-user/client-modules/src/render/map/vertex.ts:461, packages-user/client-modules/src/render/map/vertex.ts:517, packages-user/client-modules/src/render/map/vertex.ts:561, packages-user/client-modules/src/render/map/vertex.ts:852, packages-user/client-modules/src/render/map/vertex.ts:874 | packages-user/client-base/src/material/types.ts:79 | 定位汇总：`:27` `BlockCls` import（→ #04-08-A-06）、`:461` / `:874` `renderWithoutCheck`（→ #04-08-D-01）、`:517` / `:561` `tile.cls`（→ #04-08-A-05）、`:852` `cls` 解构（→ #04-08-A-05；来源 `IMovingBlock.texture`，`map/types.ts:204`）；`:872` 使用 `BlockCls`（→ #04-08-A-06）。第二步是否纳入由用户裁定 | 定位索引，无独立事实 | 高 |
| #04-08-C-03 | 勇士渲染扩展 `render/map/extension/hero.ts` 定位点 | packages-user/client-modules/src/render/map/extension/hero.ts:15, packages-user/client-modules/src/render/map/extension/hero.ts:167 | packages-user/client-base/src/material/types.ts:75-86 | 定位汇总：`:15` `BlockCls` import（→ #04-08-A-06）、`:167` `IMaterialFramedData` 对象字面量 `cls` 写（→ #04-08-A-03）。该点是否落入 D-18 `HeroRendering` 暂不处理边界列入 F 类 `#04-08-F-03`；第二步是否纳入由用户裁定 | 定位索引，无独立事实 | 高 |
| #04-08-C-04 | 移动图块 `render/map/moving.ts` 定位点 | packages-user/client-modules/src/render/map/moving.ts:3, packages-user/client-modules/src/render/map/moving.ts:31, packages-user/client-modules/src/render/map/moving.ts:75, packages-user/client-modules/src/render/map/moving.ts:103 | packages-user/client-base/src/material/types.ts:75-86 | 定位汇总：`:3` import `IMaterialFramedData`、`:31` `texture: IMaterialFramedData`、`:75` 构造器 `block: number \| IMaterialFramedData`、`:103` `setTexture(texture: IMaterialFramedData)`。该文件本身不读 `cls`，但它承载的 `IMaterialFramedData` 经 `IMovingBlock.texture`（`map/types.ts:204`）流向 `vertex.ts:852` 的 `cls` 解构（→ #04-08-A-05） | 定位索引，无独立事实 | 高 |
| #04-08-C-05 | 地图类型面 `render/map/types.ts` 定位点 | packages-user/client-modules/src/render/map/types.ts:8-12, packages-user/client-modules/src/render/map/types.ts:204, packages-user/client-modules/src/render/map/types.ts:217, packages-user/client-modules/src/render/map/types.ts:329, packages-user/client-modules/src/render/map/types.ts:334, packages-user/client-modules/src/render/map/types.ts:536 | packages-user/client-base/src/material/types.ts:75-86 | 定位汇总：`:8-12` import `IAutotileProcessor` / `IMaterialFramedData` / `ITextureManager`、`:204` `IMovingBlock.texture: IMaterialFramedData`、`:217` `setTexture(texture: IMaterialFramedData)`、`:329` `IMapRenderer.manager: ITextureManager`、`:334` `readonly autotile: IAutotileProcessor`、`:536` 移动块构造参数 `block: number \| IMaterialFramedData`（`:204` 的 `texture` 流向顶点 `cls` 解构见 #04-08-A-05；`:334` 的 `autotile` 与基准新增 `ITextureManager.autotile` 的关系见 #04-08-D-07 / #04-08-F-04） | 定位索引，无独立事实 | 高 |
| #04-08-C-06 | 客户端组合根 `client-modules/src/client.ts` 定位点 | packages-user/client-modules/src/client.ts:14, packages-user/client-modules/src/client.ts:16, packages-user/client-modules/src/client.ts:83-88, packages-user/client-modules/src/client.ts:125 | packages-user/client-base/src/material/types.ts:220 | 定位汇总：`:14` / `:16` `IAutotileProcessor` / `AutotileProcessor` 未使用 import（→ #04-08-A-08）、`:83-88` `TextureManager` 构造点（→ #04-08-A-01 / B-01）、`:125` `new MapRenderer(this.materials)`（把 `ITextureManager` 交给地图渲染器）。第二步是否纳入由用户裁定 | 定位索引，无独立事实 | 高 |
| #04-08-C-07 | 客户端配置类型 `client-modules/src/types.ts` 定位点 | packages-user/client-modules/src/types.ts:8-10 | packages-user/client-base/src/material/types.ts:220 | 定位汇总：`:8-10` `IClientCoreConfig.tilesetReserve` / `tilesetUnit` 新增必填字段（→ #04-08-B-02）。第二步是否纳入由用户裁定 | 定位索引，无独立事实 | 高 |
| #04-08-C-08 | 客户端单例 `client-modules/src/core.ts` 定位点 | packages-user/client-modules/src/core.ts:6-11 | packages-user/client-base/src/material/types.ts:220 | 定位汇总：`:6-11` `new ClientCore({ clientURL, tilesetReserve: 100000, tilesetUnit: 5000 })`（→ #04-08-B-02）。第二步是否纳入由用户裁定 | 定位索引，无独立事实 | 高 |

**C 类小结：** 覆盖 8 个定位文件（`render/map/renderer.ts` / `render/map/vertex.ts` / `render/map/extension/hero.ts` / `render/map/moving.ts` / `render/map/types.ts` / `client-modules/src/client.ts` / `client-modules/src/types.ts` / `client-modules/src/core.ts`）；每条带 `file:line` 并交叉引用 A / B / D 记录 ID；未把 E 类或 `material/` 内命中写成 AI 工作项。

## D 被删且无替代（需用户反馈）

列序固定：`ID | 符号/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信`。本节登记**接口成员 / 符号被删且 AI 未发现替代**者（D-42）。**每条明写「接口已删、AI 未发现替代、请用户反馈」；不得自拟替代、不得写成「应改为 X」。** `material/utils.ts` 的两处依赖标注为「用户自有面」。

| ID | 符号/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-08-D-01 | `IAutotileProcessor.renderWithoutCheck(tile, connection)` | packages-user/client-modules/src/render/map/renderer.ts:1253, packages-user/client-modules/src/render/map/vertex.ts:461, packages-user/client-modules/src/render/map/vertex.ts:874 | packages-user/client-base/src/material/types.ts:148-151 | 原接口成员 `renderWithoutCheck` 已删，现行 `IAutotileProcessor`（`types.ts:148-151`）只有 `render(tile, connection)`；共 **3 处**调用点。`vertex.ts:460` 附近既有注释表达「使用不带检查的版本可以减少分支数量，提升性能」的意图，故不能仅凭签名判断 `render` 可等价承接。**接口已删、AI 未发现替代、请用户反馈**（语义 / 性能替代能否成立列入 F 类 `#04-08-F-01`） | 编译报 TS2339×3（`renderer.ts:1253` / `vertex.ts:461` / `vertex.ts:874`）；运行时语义待用户裁决 | 高 |
| #04-08-D-02 | `BlockCls`（枚举整体删除） | packages-user/client-modules/src/render/map/extension/hero.ts:15, packages-user/client-modules/src/render/map/renderer.ts:10, packages-user/client-modules/src/render/map/vertex.ts:27 | packages-user/client-base/src/material/types.ts:75-86 | `BlockCls` 枚举已从基准整体删除（现行 `material/types.ts` 成员集合不含）；3 处消费者 import（同 A-06）与 6 处成员使用失去类型。**接口已删、AI 未发现替代、请用户反馈**（是改用 `TileType` 还是 `AutotileType`、以及「自动元件」取值列入 F 类 `#04-08-F-02`） | 编译报 TS2305×3 + 相关 TS2339 / TS2353；替代方案待用户裁决 | 高 |
| #04-08-D-03 | `material/utils.ts` 的 `BlockCls` 依赖（**用户自有面**） | packages-user/client-base/src/material/utils.ts:2, packages-user/client-base/src/material/utils.ts:7, packages-user/client-base/src/material/utils.ts:35 | packages-user/client-base/src/material/types.ts:75-86 | `material/utils.ts:2` 从 `./types` import 已删除的 `BlockCls`（TS2305）；同文件 `getClsByString`（`utils.ts:7`）与 `getTextureFrame`（`utils.ts:35`）两个带 `@deprecated` 标注的函数强依赖 `BlockCls`（共 21 处引用）。**该文件在 `client-base/src/material/`（D-42 用户自有面）内，AI 不得计划任何修改。接口已删、AI 未发现替代、请用户反馈** | 编译报 TS2305（`utils.ts:2`）；处置权归用户 | 高 |
| #04-08-D-04 | `IAutotileProcessor.manager`（删除） | 引用点 0 处（核对命令 `git grep -n -E "\.manager\b" -- packages-user/client-modules/src/render` 无 `autotile.manager` 命中；接口上确无该成员） | packages-user/client-base/src/material/types.ts:94, packages-user/client-base/src/material/types.ts:163 | 原接口成员 `manager: ITextureManager` 已删，现行 `IAutotileProcessor`（`types.ts:94-163`）无该成员；`packages-user` 消费者**引用点 0 处**。**接口已删、AI 未发现替代、请用户反馈**（原 `manager` 承担的取值职责由 `ITextureManager` 哪一成员承接列入 F 类 `#04-08-F-04`） | 无消费者调用导致的类型错误；职责归属待用户裁决 | 中 |
| #04-08-D-05 | `IAutotileProcessor.renderWith(tile, connection)` 与旧 `render(autotile: number, connection)`（删除并合并） | 引用点 0 处（旧 `render(number, number)` 形态消费者 0；精确核对 `git grep -n -E "\.renderWith\(|renderWith\(" -- packages-user` 无输出） | packages-user/client-base/src/material/types.ts:148, packages-user/client-base/src/material/types.ts:151 | 旧 `render(autotile: number, connection)` 与 `renderWith(tile, connection)` 已删除并合并入 `render(tile: IMaterialFramedData, connection)`（`types.ts:148-151`）；两者消费者**引用点 0 处**。**接口已删、AI 未发现替代、请用户反馈**（旧调用形态是否已全部由新 `render` 覆盖，须用户确认） | 无消费者调用导致的类型错误；合并语义待用户确认 | 中 |
| #04-08-D-06 | `ITextureManager.getIdentifierByAlias` / `getAliasByIdentifier`（删除） | 引用点 0 处（见 A-09 的核对命令与结论） | packages-user/client-base/src/material/types.ts:217, packages-user/client-base/src/material/types.ts:404 | 两个别名-标识符双向查找成员已从 `ITextureManager`（`types.ts:217-404`）删除，消费者**引用点 0 处**。**接口已删、AI 未发现替代、请用户反馈**（若后续需要别名 / 标识符互查，应由哪一成员承担由用户裁决） | 无消费者调用导致的类型错误；能力缺口由用户裁决 | 中 |
| #04-08-D-07 | `IClientBase.autotile`（删除） | packages-user/client-modules/src/client.ts:14, packages-user/client-modules/src/client.ts:16 | packages-user/client-base/src/types.ts:18, packages-user/client-base/src/types.ts:8-25 | `IClientBase.autotile` 已删，`IClientBase`（`types.ts:8-25`）现仅 `materials`（`types.ts:18`）；消费者 `client.ts:14` / `:16` 两处 import 失去使用点。与 `MapRenderer` 自建 `new AutotileProcessor(manager, manager.state)`（`renderer.ts:234`）的关系是否应由新增的 `ITextureManager.autotile`（`types.ts:222`）统一承接列入 F 类 `#04-08-F-04`。**接口已删、AI 未发现替代、请用户反馈** | 两处未使用 import；是否复用 `ITextureManager.autotile` 待用户裁决 | 高 |
| #04-08-D-08 | `create()` / `createMaterial()`（入口函数删除） | packages-user/entry-client/src/create.ts:26 | packages-user/client-base/src/index.ts:1, packages-user/client-base/src/material/index.ts:1 | 包内入口函数 `create()` / `createMaterial()` 已删（同 A-11），包内调用点 **0**；但 `@user/client-base` 被整体注册进 legacy 插件系统（`create.ts:26` `Mota.register('@user/client-base', UserClientBase)`），插件面是否仍调用 `create` 未由静态阅读确认。**接口已删、AI 未发现替代、请用户反馈**（是否破坏插件面列入 F 类 `#04-08-F-07`） | 包内无类型错误；插件面影响待用户裁决 | 中 |
| #04-08-D-09 | `ITextureGetter.getBlockCls` / `ITextureAliasGetter.getBlockClsByAlias`（删除） | 引用点 0 处（见 A-10 的核对命令与结论） | packages-user/client-base/src/material/types.ts:165, packages-user/client-base/src/material/types.ts:191 | 取类成员已从 `ITextureGetter`（`types.ts:165-189`）与 `ITextureAliasGetter`（`types.ts:191-215`）删除，消费者**引用点 0 处**。**接口已删、AI 未发现替代、请用户反馈**（原取类需求的承接方式由用户裁决） | 无消费者调用导致的类型错误；能力缺口由用户裁决 | 中 |

**D 类小结：** 共 **9** 项，全部明写「接口已删、AI 未发现替代、请用户反馈」；其中 `#04-08-D-03`（`material/utils.ts`）标注为「用户自有面」（D-42），AI 不得计划修改。**无任何自拟替代或「应改为 X」。**

## E 加载相关与添加素材（仅报告）

**本节仅报告：D-39 / D-41 边界内的内容归用户自行适配新加载系统，本阶段不修改、不提修改方案。**

列序固定：`ID | 符号/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信`。本节只登记事实与核对命令。

| ID | 符号/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-08-E-01 | `addGrid` / `addRowAnimate` / `addAutotile` / `addTileset` 参数个数错误 | packages-user/client-modules/src/fallback/load.ts:76, packages-user/client-modules/src/fallback/load.ts:77, packages-user/client-modules/src/fallback/load.ts:80, packages-user/client-modules/src/fallback/load.ts:81, packages-user/client-modules/src/fallback/load.ts:82, packages-user/client-modules/src/fallback/load.ts:83, packages-user/client-modules/src/fallback/load.ts:84, packages-user/client-modules/src/fallback/load.ts:95, packages-user/client-modules/src/fallback/load.ts:105 | packages-user/client-base/src/material/types.ts:261-266 | 向 `TextureManager` 添加素材的 9 条 TS2554：`load.ts:76` / `:77` `addGrid` 期望 4 参得 2 参；`load.ts:80` / `:81` / `:82` / `:83` / `:84` `addRowAnimate` 期望 4 参得 3 参；`load.ts:95` `addAutotile` 期望 3 参得 2 参；`load.ts:105` `addTileset` 期望 4 参得 2 参。**仅报告**：按 D-41 此即「向 `TextureManager` 添加素材」，归用户自行适配 | 编译报 TS2554×9；归用户加载面 | 高 |
| #04-08-E-02 | `extractClsBlocks` 产出 `IBlockIdentifier[]` 与新 `addGrid` / `addRowAnimate` 收 `ArrayLike<number>` | packages-user/client-modules/src/fallback/load.ts:9-29, packages-user/client-modules/src/fallback/load.ts:76 | packages-user/client-base/src/material/types.ts:263, packages-user/client-base/src/material/types.ts:277 | `extractClsBlocks`（`load.ts:9-29`）返回 `IBlockIdentifier[]`，而新 `addGrid` / `addRowAnimate` 的 `map` 参数现收 `ArrayLike<number>`（`types.ts:263` / `types.ts:277`）；`load.ts:76` 直接以该数组为 `map` 传入。**仅报告**：该转换是否属用户加载面（D-41）列入 F 类 `#04-08-F-08` | 仅报告；归用户加载面 | 中 |
| #04-08-E-03 | `client-base/src/load/loader.ts` 加载本身 | packages-user/client-base/src/load/loader.ts:17, packages-user/client-base/src/load/loader.ts:18, packages-user/client-base/src/load/loader.ts:19, packages-user/client-base/src/load/loader.ts:20, packages-user/client-base/src/load/loader.ts:21, packages-user/client-base/src/load/loader.ts:28 | packages-user/client-base/src/material/types.ts:217 | 「加载本身」（D-41 第一类）：`loader.ts:17-21` import `LoadAudioProcessor` / `LoadFontProcessor` / `LoadImageProcessor` / `LoadTextProcessor` / `LoadZipProcessor`、`:28` import `IMotaDataLoader`，均报 TS2305。**仅报告**：其 **6** 条错误属**加载系统重构提交（`cc434a6`）既有、与 `d36ea69` 无关**；`ITextureManager`（`types.ts:217`）为该文件使用素材接口处的对照锚点 | 编译报 TS2305×6（加载系统重构既有）；不在本步范围 | 高 |
| #04-08-E-04 | 接线点 `fallbackLoad(this.materials)` | packages-user/client-modules/src/client.ts:93-96, packages-user/client-modules/src/client.ts:94 | packages-user/client-base/src/types.ts:18 | `client.ts:93-96` 于 `loading.once('loaded')` 中调用 `fallbackLoad(this.materials)`（`client.ts:94`）并 `loading.emit('assetBuilt')`；即「加载完成后向 `TextureManager` 添加素材」的接线点。**仅报告**：该接线及其目标 `fallbackLoad` 归用户加载面（D-39 / D-41） | 仅报告；归用户加载面 | 高 |
| #04-08-E-05 | `packages/` 对照扫描（texture 记号零命中） | packages/（对照扫描无任何 file:line 命中） packages-user/client-base/src/material/types.ts:220 | packages-user/client-base/src/material/types.ts:225 | 核对命令 `git grep -n -i -E "bigImage\|BlockCls\|IMaterialManager" -- packages` 与 `git grep -n -E "TextureManager\|IAutotileProcessor\|ITextureManager\|IMaterialFramedData" -- packages` **均无输出**（退出码 1，零命中）；与 D-32「`packages` 不纳入、理应不受影响」一致。**仅报告**：`packages/` 零命中，无需处置 | 仅报告；`packages/` 零命中 | 高 |
| #04-08-E-06 | `src/types/declaration/*` legacy 声明 | src/types/declaration/core.d.ts:1286, src/types/declaration/enemy.d.ts:65, src/types/declaration/map.d.ts:354, src/types/declaration/map.d.ts:1006, src/types/declaration/map.d.ts:1443, src/types/declaration/status.d.ts:387, src/types/declaration/status.d.ts:391, src/types/declaration/status.d.ts:602 | packages-user/client-base/src/material/types.ts:165 | 对照扫描命中：`core.d.ts:1286` / `enemy.d.ts:65` 声明 `bigImage?: ImageIds;`、`map.d.ts:354` 声明 `bigImage: HTMLImageElement;`、`map.d.ts:1006` 声明 `getBlockCls(...)`（及 `:1000` 注释示例）、`map.d.ts:1443` 声明 `_getBigImageInfo(...)`、`status.d.ts:387` `interface BigImageBoxAnimate` 与 `:391` / `:602` 相关字段。均为 `src/` 内旧引擎数据字段 / API 声明，与渲染端 `ITextureGetter`（`types.ts:165-189`）无调用关系。**仅报告**：`src/` 不在本阶段范围（D-32） | 仅报告；`src/` 命中不修改 | 高 |
| #04-08-E-07 | `packages-user/client-base/package.json` 依赖声明现状 | packages-user/client-base/package.json:1 | packages-user/client-base/src/material/types.ts:9 | 只登记事实：`client-base/package.json` 的 `dependencies`（现状见该文件 `:1` 起）与 `material/types.ts:9`（`import { ITileStore, TileType } from '@user/data-common'`）、`material/types.ts:10`（`import { ICoreStateExtended } from '@user/data-state'`）的 import 现状；是否算问题交由用户判断。**仅报告** | 仅报告；不判定 | 中 |

**E 类小结：** `fallback/load.ts` 9 条 TS2554（`:76,:77,:80,:81,:82,:83,:84,:95,:105`）逐条列出；`client-base/src/load/loader.ts` 加载本身 6 条 TS2305 并明写属加载系统重构既有、与 `d36ea69` 无关；`client.ts:93-96` 接线点；`packages/` 零命中（附命令与结论）；`src/types/declaration/*` legacy 声明；`client-base/package.json` 依赖现状。全节**只登记事实，不提出修改建议**。

## F 未能从阅读确定（未猜测）

条目形如 `- **#04-08-F-NN**：现象 + 为什么读不出来 + 需要用户裁决的点`。**只登记，不判定**；不得写成错配 / 缺失 / 残留。

- **#04-08-F-01**：`renderWithoutCheck` 的语义与性能意图能否由新 `render(tile, connection)` 等价承接。现象：`renderWithoutCheck` 已删（现行 `IAutotileProcessor` 只有 `render`，`packages-user/client-base/src/material/types.ts:148-151`），3 处调用点 `packages-user/client-modules/src/render/map/renderer.ts:1253`、`packages-user/client-modules/src/render/map/vertex.ts:461`、`packages-user/client-modules/src/render/map/vertex.ts:874`。读不出来的原因：`vertex.ts:460` 附近注释明写「使用不带检查的版本可以减少分支数量，提升性能」，「不带检查」所省的分支与新 `render` 内部是否包含检查无法由静态阅读定论。需要用户裁决：**`render` 是否等价承接 `renderWithoutCheck` 的语义与性能意图**。
- **#04-08-F-02**：`BlockCls` 删除后消费者应改用 `TileType`（`@user/data-common`）还是 `AutotileType`，以及「自动元件」在 `TileType` 中的取值。现象：`BlockCls` 已删，`IMaterialFramedData` 现为 `tileType: TileType`（`packages-user/client-base/src/material/types.ts:79`），另有新增 `AutotileType`（`packages-user/client-base/src/material/types.ts:12-17`）。读不出来的原因：各调用点（`renderer.ts:1252,1263`、`vertex.ts:517,561,872`）以 `BlockCls.Autotile` 判定自动元件，而新体系下正确判定依据（`TileType.Autotile`？`AutotileType`？）超出静态阅读可定论范围。需要用户裁决：**判定「自动元件」应使用哪个类型与其取值**。
- **#04-08-F-03**：`hero.ts:167` 构造 `IMaterialFramedData` 时 `tileType` 应填何值（勇士贴图不是地图图块），以及该点是否落入 D-18 的 `HeroRendering` 暂不处理边界。现象：`packages-user/client-modules/src/render/map/extension/hero.ts:164-170` 的对象字面量现写 `cls: BlockCls.Unknown`。读不出来的原因：勇士贴图非地图图块，`TileType` 中无对应项；且 D-18 明示 `HeroRendering` 相关暂不处理，该点是否随之排除需裁决。需要用户裁决：**该点 `tileType` 取值与是否属 D-18 边界**。
- **#04-08-F-04**：`MapRenderer` 自建的 `new AutotileProcessor(manager, manager.state)`（`packages-user/client-modules/src/render/map/renderer.ts:234`）与新增的 `ITextureManager.autotile`（`packages-user/client-base/src/material/types.ts:222`）是否重复、第二步应复用还是保留自建。读不出来的原因：基准在 `ITextureManager` 上新增了 `autotile`，而 `MapRenderer` 仍自建一个 `AutotileProcessor` 并存于 `readonly autotile`（`packages-user/client-modules/src/render/map/types.ts:334`）；两者职责是否重叠取决于新引擎的 processor 归属设计。需要用户裁决：**第二步复用 `ITextureManager.autotile` 还是保留自建**（交叉引用 D 类 `#04-08-D-07`）。
- **#04-08-F-05**：`ITextureManager.textures` / `tileStore` / `tiles`（`ITileStore`）三者的职责边界与地图背景取值应走哪一个。现象：基准同时存在 `textures`（`packages-user/client-base/src/material/types.ts:225`）、`tileStore`（`packages-user/client-base/src/material/types.ts:227`）、`tiles: ITileStore`（`packages-user/client-base/src/material/types.ts:220`）。读不出来的原因：三者的语义分工（贴图存储 / 图块数据存储）在静态阅读下难以确定地图背景（`renderer.ts:1243` `getTile`）之外还应读取哪一个。需要用户裁决：**三者的职责边界与取值入口**。
- **#04-08-F-06**：`textures` 的写入侧归属哪一步。现象：04-07 已记录 `textures` 由新建专用 `TextureStore` 承担且「本次范围内无写入者」（`packages-user/client-base/src/material/manager.ts:40`）。读不出来的原因：写入侧（loader / `addGrid` / `addTileset` 等填充统一 store）属加载面，而加载面按 D-39 / D-41 归用户。需要用户裁决：**`textures` 写入侧的归属步骤**。
- **#04-08-F-07**：`@user/client-base` 作为整体注册进 legacy 插件系统后，删除 `create()` / `createMaterial()` 是否破坏插件面。现象：`packages-user/entry-client/src/create.ts:26` 仍 `Mota.register('@user/client-base', UserClientBase)`（整体命名空间），而 `create()` / `createMaterial()` 已删（见 A-11 / D-08）。读不出来的原因：legacy 插件系统是否在别处按名字调用该命名空间的 `create`，无法由本仓库静态阅读定论。需要用户裁决：**删除入口函数是否影响 legacy 插件面**。
- **#04-08-F-08**：`fallback/load.ts` 的 `IBlockIdentifier[]` → `ArrayLike<number>` 转换是否属用户加载面（D-41）。现象：`extractClsBlocks`（`packages-user/client-modules/src/fallback/load.ts:9-29`）产出 `IBlockIdentifier[]`，新 `addGrid` / `addRowAnimate` 收 `ArrayLike<number>`（见 E 类 `#04-08-E-02`）。读不出来的原因：`IBlockIdentifier`（`packages-user/client-base/src/material/types.ts:41-48`，其 `cls: Cls` 走 legacy 全局类型）到数字数组的转换既涉及 `material/` 类型（D-42），又涉及加载面（D-41），边界需裁决。需要用户裁决：**该转换归属哪一面**。

## 处置

- 本文件是 TextureManager 新接口适应（D-38 / D-40）**第一步（只读清点）**的交付物；本步**未修改任何生产代码**，`files_modified` 仅本文件。
- 相对本文件「方法」一节记录的**只读起始基线**（门禁终跑为空「（无）」，entries 0）**零变化**：Task 1 / Task 3 门禁断言其后逐条一致（未新增、未消失、状态码不变）；用户的数据端改动与提交不在本 run 改动范围内，本 run **不回滚 / 不暂存 / 不提交 / 不修改**。
- **第二步（TextureManager 新接口适应实施）未规划**，待用户审阅本文件后另行规划（D-40）。本文件不含修复方案、不含代码改动建议、未产出任何 `04-09+` 或新 `*-PLAN.md`。
- 范围限 `packages-user` 消费者面；`packages/` 与 `src/` 命中**仅报告**（D-33 沿用）；`packages-user/client-base/src/material/` 内命中（`#04-08-D-03`）按 **D-42** 只登记、归用户，不在 AI 工作范围。
- A / B / C / D / E / F 六类中：**A / B 是事实层、C 是定位索引**（第二步的候选工作集，最终由用户裁定）；**D 类须用户反馈后才可能进入第二步**；**E 类归用户自行适配新加载系统（D-39 / D-41）**；**F 类须用户裁决**。
- `tileType` 应填何值（`#04-08-F-03`）、`renderWithoutCheck` 的替代（`#04-08-F-01`）、`MapRenderer` 自建 `AutotileProcessor` 是否复用 `ITextureManager.autotile`（`#04-08-F-04`）一律由**用户裁决**（不得由 AI 裁定）。
- `core.*` legacy 适配（D-12）与移动控制（D-19）、跟随者（D-22）、`HeroRendering` 语义（D-18）不属本步；`render/elements/cache.ts` / `render/elements/misc.ts` / `render/components/textbox.tsx` 的 legacy 路径只作对照，不提出清退计划（属 Phase 5 边界）。
- `REND-01` / `REND-02` 保持 **Pending**。
- **当日实测数值与规划日的差异说明**：总错误行数 263（规划日 202 / HEAD `d36ea69` 干净工作树），差 +61 源于用户数据端进行中的重构（`packages-user/data-base` / `data-common` / `data-system`；后经 `7743795` / `d74cc35` 提交）；**texture 归属错误行数仍为 23（与规划日一致）**。texture / 加载既有 / 其余既有的三分类为规划日 / 执行日**人工归类**，**须用户确认**（见 `## 类型门禁实测基线`）。
