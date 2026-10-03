# material 接口影响范围清点（只读）

**日期:** 2026-09-22
**范围:** 被查对象 `packages-user` 全量（含新包 `packages-user/client-system`）；`packages/` 不纳入（D-32，理应不受本改动影响）；`src/` 命中仅报告、不修改
**性质:** 只读清点（D-30 / D-31 / D-32 第一步），未修改任何生产代码
**接口基准:** `packages-user/client-base/src/material/types.ts` 与 `packages-user/client-base/src/types.ts`（`4e305e3` 后），以及 `packages-user/data-state/src/types.ts`（`ICoreStateExtended` 定义源）
**基准提交:** `4e305e3 refactor(type): material types.`（当日工作树 HEAD `58a8e68`；`4e305e3` 之后仅有 `.planning/` 计划簿记提交，生产源码未再改动）
**下一步:** 第二步（material 接口适应实施）未规划，待用户审阅本文件后另行规划（D-32）

## 背景

本文件是 Phase 4 第六个增量（用户裁定 2026-09-21 · D-30 / D-31 / D-32 **第一步**）的交付物：对 `4e305e3` material 接口基准在 `packages-user` 全量的**只读影响清点**。

- **D-30**：下一个任务 = 完成 material 相关的接口适应。用户已自行修改接口 `packages-user/client-base/src/types.ts`（提交 `4e305e3 refactor(type): material types.`）并改完受影响的一部分内容；**剩余未适应的实现与消费者**由本任务处理。
- **D-31**：本次改动的根因：用户**重写了 Texture 的底层管理器，删除 `big-image` 概念**（旧样板概念，新引擎不再需要；旧兼容可**无痛丢弃**）。`4e305e3` 已从接口删除 `IBigImageReturn` / `isBigImage` / `getBigImage` / `getIfBigImage` / `getBigImageByAlias` / `setBigImage` / `bigImageStore`，并把 `IMaterialManager`→`ITextureManager`、`IMaterialGetter`→`ITextureGetter`、`IMaterialAliasGetter`→`ITextureAliasGetter`，新增 `textures` 与 `ICoreStateExtended` 约束。**影响面可能很大。**
- **D-32**：计划分**两步**。**第一步** = 收集影响范围（只读清点，产出本文件）；**第二步** = 进行修改，待用户审阅第一步结果后再规划。边界：范围限 `packages-user`；`packages` 不纳入（理应不受本改动影响）；以 `packages-user/client-base/src/types.ts`（及 `material/types.ts`）为基准；**若发现其余 big-image 残留，必须在清点文档中报告**；`src/` 或 `packages/` 内若命中，仅报告、不修改。

本步**只清点、不修改、不规划第二步**。

## 方法

**枚举面（两侧）：**

- **（a）基准面**：`packages-user/client-base/src/material/types.ts`（`ITextureManager` / `ITextureGetter` / `ITextureAliasGetter` / `IAutotileProcessor` / `IAssetBuilder` / `ITrackedAssetData` / `IMaterialData` / `IMaterialFramedData` 等现行成员）+ `packages-user/client-base/src/types.ts`（`IClientBase.materials`）+ `packages-user/data-state/src/types.ts`（`ICoreStateExtended` 定义源）。
- **（b）命中面**：`packages-user` 全量（`client-base` / `client-modules` / `client-system` / `entry-*` / `legacy-plugin-*` / `data-fallback`），另对 `packages/` 与 `src/` 做**对照扫描**（只登记、不修改）。

**判定口径（六类固定，一条记录只归一类，跨类拆条并互相引用）：**

| 类别 | 含义 | 归属规则 |
|---|---|---|
| A | 已移除**接口成员**的**引用点**（消费者侧） | `client-modules` 对 `manager.*` 的调用点 + `manager.ts:20` 的 `IBigImageReturn` import |
| B | 改名后的旧接口名剩余引用 | 源码面命中数；本次应为 0，须给机器证据 |
| C | 新增 / 收紧约束在实现类上未实现 | 基准侧 = 接口声明行；命中侧 = 实现类声明行与构造点 |
| D | **不在接口成员层面**的 big-image 实现 / 概念残留 | `client-base` 内已不属接口的实现成员 + 走 legacy 全局的 `cache.ts` 概念路径 |
| E | 范围外（`src/`、`packages/`、`.planning/graphs/*`、依赖声明） | 只报告，不修改、不建议 |
| F | 未能从阅读确定 | 只登记，不得写成错配 / 缺失 / 残留 |

**A 与 D 的分列规则（写死）**：A 记「消费者调用点」（`client-modules` 对 `manager.*` 的调用 + `manager.ts:20` 的类型 import），D 记「`client-base` 内已不属接口的实现残留」与「走 legacy 全局的 `cache.ts` 概念路径」。同一成员两侧都有时两条都记并互相引用。

**证据纪律：** 每行含 `接口/成员名 + 命中处 file:line + 基准侧锚点 file:line + 问题描述 + 影响 + 置信`，**每行至少两个 `file:line` 锚点**；静态阅读不能定论者一律进 F 类，**不得写成错配 / 缺失 / 残留**。

**只读起始基线（packages / packages-user / src）**：Task 1 起始执行 `git status --porcelain -- packages packages-user src`，输出为空，逐行原样记录如下：

（无）

当日工作树内唯一的未提交改动为 `.planning/phases/04-render-adaptation/04-CONTEXT.md`（不在该路径集合内），属用户既有改动，本 run 不回滚 / 不暂存 / 不提交 / 不修改。

**类型门禁命令与口径：** `pnpm exec vue-tsc --noEmit`；「错误总行数」= 输出中正则 `error TS\d+` 的匹配数（与 Task 3 门禁同一正则，保证可逐字比对）；「material 相关错误行数」为**规划日人工归类**，执行日按当日实测重新归类并逐行列出，**不由任何门禁断言**、由人工复核保证。

**只读子代理：** 重型整文件读取可按 D-09 委派**只读**子代理（子代理只回传事实表「成员名 + 所属 `file:line` + 形态」，**不得写文件、不得贴大段源码**），最终由主执行者按 `file:line` 切片复核。

## 基准变更（4e305e3）

依据：`git show 4e305e3 -- packages-user/client-base/src/types.ts packages-user/client-base/src/material/types.ts`（当日与工作树逐条比对一致）。该提交共触及 19 个文件（`git show --stat 4e305e3`）。以下三类差异中，每条附**现行基准侧锚点**。

**① 移除 7 个符号**（`4e305e3` 已删除；现行 `material/types.ts` 的成员集合不含）：

| 已移除符号 | 原所属 | 现行基准侧锚点（该符号原属接口的现行行） |
|---|---|---|
| `IBigImageReturn` | 原定义接口（`material/types.ts`，已整体删除） | `packages-user/client-base/src/material/types.ts:260`（`ITextureManager`，现无该类型；其引用侧见 A 类 `#04-06-A-09` 与 D 类） |
| `isBigImage` | 原 `IMaterialGetter`（现 `ITextureGetter`） | `packages-user/client-base/src/material/types.ts:196`（`ITextureGetter` 现行成员不含） |
| `getBigImage` | 原 `IMaterialGetter`（现 `ITextureGetter`） | `packages-user/client-base/src/material/types.ts:196` |
| `getIfBigImage` | 原 `IMaterialGetter`（现 `ITextureGetter`） | `packages-user/client-base/src/material/types.ts:196` |
| `getBigImageByAlias` | 原 `IMaterialAliasGetter`（现 `ITextureAliasGetter`） | `packages-user/client-base/src/material/types.ts:228` |
| `setBigImage` | 原 `IMaterialManager`（现 `ITextureManager`） | `packages-user/client-base/src/material/types.ts:260` |
| `bigImageStore` | 原 `IMaterialManager`（现 `ITextureManager`） | `packages-user/client-base/src/material/types.ts:260` |

**② 改名 3 个接口**（`4e305e3` 同步改动消费者）：

| 旧名 | 新名 | 现行基准侧锚点 | 该提交内同步改名的消费者文件（`git show --stat 4e305e3`） |
|---|---|---|---|
| `IMaterialManager` | `ITextureManager` | `packages-user/client-base/src/material/types.ts:260` | `packages-user/client-base/src/{load/loader.ts, material/autotile.ts, material/builder.ts, material/manager.ts, types.ts}`；`packages-user/client-modules/src/{client.ts, fallback/load.ts, render/map/moving.ts, render/map/renderer.ts, render/map/types.ts, types.ts}` |
| `IMaterialGetter` | `ITextureGetter` | `packages-user/client-base/src/material/types.ts:196` | 同上 |
| `IMaterialAliasGetter` | `ITextureAliasGetter` | `packages-user/client-base/src/material/types.ts:228` | 同上 |

**③ 新增 / 收紧约束：**

- `ITextureManager` 新增 `readonly textures: ITextureStore`，现行基准侧锚点 `packages-user/client-base/src/material/types.ts:262-263`，jsDoc 原文 `/** 通过加载获取的所有纹理贴图存储，包括图块、普通图片等 */`。未实现于 `MaterialManager`（见 C 类 `#04-06-C-01`）。
- 四处新增 `extends ICoreStateExtended`：`ITextureManager`（`packages-user/client-base/src/material/types.ts:260`，`extends ITextureGetter, ITextureAliasGetter, ICoreStateExtended`，`extends` 行在 `:261`）；`IAutotileProcessor`（`packages-user/client-base/src/material/types.ts:104`）；`IAssetBuilder`（`packages-user/client-base/src/material/types.ts:430`）；`ITrackedAssetData`（`packages-user/client-base/src/material/types.ts:462-463`）。
- `ICoreStateExtended` 的**定义源**：`packages-user/data-state/src/types.ts:45-49`（`readonly state: ICoreState;`，`4e305e3` 首次加入该文件）。

**同提交内的相邻变更（登记，不作本步裁定）：** `packages-user/client-base/src/types.ts` 新增 `rafExcitation: IExcitation<number>`（`:24`）与 `excitationDivider: IExcitationDivider<number>`（`:26`）；新增 `packages-user/client-system` 包（`package.json` / `src/index.ts` / `src/types.ts`，含 `IClientSystem extends IClientBase`）；`packages-user/client-modules/package.json` 与 `pnpm-lock.yaml` 有同步改动。

## 类型门禁实测基线

命令：`pnpm exec vue-tsc --noEmit`（整仓非 0 退出属预期）。统计口径：正则 `error TS\d+` 的匹配数。

- **错误总行数**：199
- **material 相关错误行数**：19

机器比对形式（与本节门禁的同一正则同形，便于逐字比对）：错误总行数：199；material 相关错误行数：19。

当日实测（2026-09-22，HEAD `58a8e68`）与规划日（2026-09-21，HEAD `4e305e3`）**完全一致**：199 / 19。

**material 相关错误逐行列出（19 条 = `client-base` 7 条 + `client-modules` 12 条）：**

`packages-user/client-base`（7 条）：

1. `packages-user/client-base/src/material/autotile.ts:42` `error TS2420`：`Class 'AutotileProcessor' incorrectly implements interface 'IAutotileProcessor'.` / `Property 'state' is missing`
2. `packages-user/client-base/src/material/builder.ts:12` `error TS2420`：`Class 'AssetBuilder' incorrectly implements interface 'IAssetBuilder'.` / `Property 'state' is missing`
3. `packages-user/client-base/src/material/builder.ts:91` `error TS2741`：`Property 'state' is missing in type 'TrackedAssetData' but required in type 'ITrackedAssetData'.`
4. `packages-user/client-base/src/material/builder.ts:99` `error TS2420`：`Class 'TrackedAssetData' incorrectly implements interface 'ITrackedAssetData'.` / `Property 'state' is missing`
5. `packages-user/client-base/src/material/manager.ts:20` `error TS2305`：`Module '"./types"' has no exported member 'IBigImageReturn'.`
6. `packages-user/client-base/src/material/manager.ts:38` `error TS2420`：`Class 'MaterialManager' incorrectly implements interface 'ITextureManager'.` / `Type 'MaterialManager' is missing the following properties from type 'ITextureManager': textures, state`
7. `packages-user/client-base/src/material/manager.ts:86` `error TS2741`：`Property 'state' is missing in type 'AssetBuilder' but required in type 'IAssetBuilder'.`

`packages-user/client-modules`（12 条）：

8. `packages-user/client-modules/src/client.ts:84` `error TS2739`：`Type 'MaterialManager' is missing the following properties from type 'ITextureManager': textures, state`
9. `packages-user/client-modules/src/client.ts:85` `error TS2741`：`Property 'state' is missing in type 'AutotileProcessor' but required in type 'IAutotileProcessor'.`
10. `packages-user/client-modules/src/render/map/extension/door.ts:36` `error TS2339`：`Property 'getIfBigImage' does not exist on type 'ITextureManager'.`
11. `packages-user/client-modules/src/render/map/extension/door.ts:46` `error TS2339`：`Property 'getIfBigImage' does not exist on type 'ITextureManager'.`
12. `packages-user/client-modules/src/render/map/extension/hero.ts:239` `error TS2339`：`Property 'getIfBigImage' does not exist on type 'ITextureManager'.`
13. `packages-user/client-modules/src/render/map/extension/hero.ts:364` `error TS2339`：`Property 'getIfBigImage' does not exist on type 'ITextureManager'.`
14. `packages-user/client-modules/src/render/map/extension/hero.ts:428` `error TS2339`：`Property 'getIfBigImage' does not exist on type 'ITextureManager'.`
15. `packages-user/client-modules/src/render/map/renderer.ts:234` `error TS2741`：`Property 'state' is missing in type 'AutotileProcessor' but required in type 'IAutotileProcessor'.`
16. `packages-user/client-modules/src/render/map/renderer.ts:652` `error TS2551`：`Property 'bigImageStore' does not exist on type 'ITextureManager'. Did you mean 'imageStore'?`
17. `packages-user/client-modules/src/render/map/renderer.ts:653` `error TS2551`：`Property 'getBigImage' does not exist on type 'ITextureManager'. Did you mean 'getImage'?`
18. `packages-user/client-modules/src/render/map/renderer.ts:1250` `error TS2339`：`Property 'getIfBigImage' does not exist on type 'ITextureManager'.`
19. `packages-user/client-modules/src/render/map/vertex.ts:546` `error TS2339`：`Property 'getIfBigImage' does not exist on type 'ITextureManager'.`

**单列：与本改动无关的既有错误（180 条），不得算作本次 material 改动的后果。**

- `client-base` / `client-modules` 中属**加载系统重构**（提交 `cc434a6`）的 16 条：`packages-user/client-base/src/load/loader.ts` 6 条（`LoadAudioProcessor` / `LoadFontProcessor` / `LoadImageProcessor` / `LoadTextProcessor` / `LoadZipProcessor` / `IMotaDataLoader` 未导出，TS2305）、`packages-user/client-modules/src/core.ts:6` 1 条（TS2554）、`packages-user/client-modules/src/render/ui/load.tsx` 9 条（`IMotaDataLoader` 成员不存在，TS2339）。
- `data-base` / `data-state` / `data-system` 的测试与寻路相关既有错误（`*.test.ts` / `*.perf.ts` 的属性构造、`DirectionMapper` / `IFaceHandler` 导出、`graph` 可能为 `null`、`createCoreState` 未导出等）：合计 164 条，与 material 接口无关。

**口径说明：** 「material / 非 material」的划分为**规划日的人工归类**（material 19 = `client-base` 7 + `client-modules` 12；非 material 180），须用户在审阅时确认。若用户判定其中某条应归 material，执行者按裁定重新归类并同步两个数字与 `## 处置` 的口径说明，不得改动其它事实。此划分**不由任何机器门禁断言**；门禁只覆盖**错误总行数**（Task 3 重跑等于本记录值）。

## A 已移除符号的剩余引用

列序固定：`ID | 接口/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信`。本节登记**消费者侧**对 `4e305e3` 已移除接口成员的引用点（`client-modules` 对 `manager.*` 的调用 + `client-base/src/material/manager.ts:20` 的类型 import）；`client-base` 内已不属接口的实现残留见 D 类，两侧对同一成员互相引用。**行内不含任何修复建议或替代写法**（替代是否成立属 F 类）。

| ID | 接口/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-06-A-01 | `getIfBigImage` | packages-user/client-modules/src/render/map/extension/door.ts:36,46 | packages-user/client-base/src/material/types.ts:196-226 | `openDoor`（`door.ts:36`）/ `closeDoor`（`door.ts:46`）经 `this.renderer.manager.getIfBigImage(num)` 取值并读取 `data.frames` 驱动大图开门帧序；该成员已不在接口上 | 编译报 TS2339（`door.ts:36,46`）；若类型断言被绕过则运行时不可达 | 高 |
| #04-06-A-02 | `getIfBigImage` | packages-user/client-modules/src/render/map/extension/hero.ts:239 | packages-user/client-base/src/material/types.ts:196-226 | 勇士移动取下一图块贴图：`this.renderer.manager.getIfBigImage(nextTile?.identifier ?? block.tile)`；该成员已不在接口上（D-18：不涉 `HeroRendering` 语义裁定） | 编译报 TS2339（`hero.ts:239`） | 高 |
| #04-06-A-03 | `getIfBigImage` | packages-user/client-modules/src/render/map/extension/hero.ts:364 | packages-user/client-base/src/material/types.ts:196-226 | 勇士贴图朝向取值：`this.renderer.manager.getIfBigImage(faced?.face ?? image)`；该成员已不在接口上 | 编译报 TS2339（`hero.ts:364`） | 高 |
| #04-06-A-04 | `getIfBigImage` | packages-user/client-modules/src/render/map/extension/hero.ts:428 | packages-user/client-base/src/material/types.ts:196-226 | 勇士移动贴图取值：`this.renderer.manager.getIfBigImage(nextFace.identifier)`；该成员已不在接口上 | 编译报 TS2339（`hero.ts:428`） | 高 |
| #04-06-A-05 | `getIfBigImage` | packages-user/client-modules/src/render/map/renderer.ts:1250 | packages-user/client-base/src/material/types.ts:196-226 | 背景图块取值：`const tex = this.manager.getIfBigImage(tile)`；该成员已不在接口上 | 编译报 TS2339（`renderer.ts:1250`） | 高 |
| #04-06-A-06 | `getIfBigImage` | packages-user/client-modules/src/render/map/vertex.ts:546 | packages-user/client-base/src/material/types.ts:196-226 | 顶点数组更新取值：`const tile = this.renderer.manager.getIfBigImage(num)`；该成员已不在接口上 | 编译报 TS2339（`vertex.ts:546`） | 高 |
| #04-06-A-07 | `bigImageStore` | packages-user/client-modules/src/render/map/renderer.ts:652 | packages-user/client-base/src/material/types.ts:260-271 | `getOffsetPool` 遍历 `this.manager.bigImageStore.keys()` 收集大图偏移；该成员已不在接口上。互引：与 D 类 `#04-06-D-01`（`manager.ts:43` 的实现成员）两侧对同一成员 | 编译报 TS2551（`renderer.ts:652`） | 高 |
| #04-06-A-08 | `getBigImage` | packages-user/client-modules/src/render/map/renderer.ts:653 | packages-user/client-base/src/material/types.ts:196-226 | `getOffsetPool` 内 `this.manager.getBigImage(identifier)` 取帧数计算偏移；该成员已不在接口上。互引：与 D 类 `#04-06-D-07`（`manager.ts:579-581`） | 编译报 TS2551（`renderer.ts:653`） | 高 |
| #04-06-A-09 | `IBigImageReturn`（类型 import） | packages-user/client-base/src/material/manager.ts:20 | packages-user/client-base/src/material/types.ts:260 | `material/manager.ts:20` 从 `./types` import `IBigImageReturn`（该符号已不在基准导出中）；同文件 `:556,:568` 的类型标注计入 D 类 `#04-06-D-10`。互引：与 D 类 `#04-06-D-10` | 编译报 TS2305（`manager.ts:20`） | 高 |
| #04-06-A-10 | `setBigImage` | 调用点 0 处（源码面唯一命中为 D 类定义行 packages-user/client-base/src/material/manager.ts:552） | packages-user/client-base/src/material/types.ts:260 | 核对命令 `git grep -n -E "setBigImage\|isBigImage\|getBigImageByAlias" -- packages packages-user src` 仅命中 `manager.ts` 自身定义行；消费者侧**调用点 0 处**（不遗漏、不臆造） | 无消费者调用导致的类型错误 | 高 |
| #04-06-A-11 | `isBigImage` | 调用点 0 处（源码面唯一命中为 D 类定义行 packages-user/client-base/src/material/manager.ts:575） | packages-user/client-base/src/material/types.ts:196 | 同上核对命令；消费者侧**调用点 0 处** | 无消费者调用导致的类型错误 | 高 |
| #04-06-A-12 | `getBigImageByAlias` | 调用点 0 处（源码面唯一命中为 D 类定义行 packages-user/client-base/src/material/manager.ts:583） | packages-user/client-base/src/material/types.ts:228 | 同上核对命令；消费者侧**调用点 0 处** | 无消费者调用导致的类型错误 | 高 |

**A 类小结：** 7 个已移除符号全部覆盖；`getIfBigImage` 计 **7 处**调用点（`door.ts:36` / `door.ts:46` / `hero.ts:239` / `hero.ts:364` / `hero.ts:428` / `renderer.ts:1250` / `vertex.ts:546`）；`bigImageStore` 1 处（`renderer.ts:652`）；`getBigImage` 1 处（`renderer.ts:653`）；`IBigImageReturn` 1 处 import（`manager.ts:20`）；`setBigImage` / `isBigImage` / `getBigImageByAlias` 消费者侧 0 处。

## B 改名的剩余引用

三个旧接口名在**源码面**（`packages`、`packages-user`、`src`，排除 `node_modules`）的当日命中数：

核对命令（原样执行）：

```
git grep -n -E "IMaterialManager|IMaterialGetter|IMaterialAliasGetter" -- packages packages-user src
```

原样输出：**（无输出）**，退出码 1（无匹配）。

- `IMaterialManager`：源码面命中 **0** 处。
- `IMaterialGetter`：源码面命中 **0** 处。
- `IMaterialAliasGetter`：源码面命中 **0** 处。

**单列：`.planning/graphs/*` 的过期工装态标签**（**不计入源码命中、不作为基准**，归 E 类登记）：`.planning/graphs/graph.json` 仍含 `IMaterialGetter`（`:6604` / `:6612` / `:48305` 等）、`IMaterialManager`（`:13359`）、`IBigImageReturn`（`:15400`）、`.getBigImage()`（`:48361` / `:76741`）、`.getBigImageByAlias()`（`:76753` / `:81025`）等标签；`.planning/graphs/.last-build-snapshot.json` 同样残留 `IMaterialManager` / `IMaterialGetter` / `IBigImageReturn`。该快照时间戳为 **2026-09-07T02:50:52.708Z**，早于 `4e305e3` 的 2026-09-21，属过期工装态。

- **结论**：三个旧接口名在源码面命中 0 处（仅工装态过期标签存在，见 E 类）。

## C 新增与收紧约束的未实现

列序固定：`ID | 接口/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信`。每条含**基准侧锚点 + 实现侧锚点 + 当日实测错误码与错误原文摘要**。`state` 的语义来源与注入方式**不在本步裁定**（进 F 类）。

| ID | 接口/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-06-C-01 | `ITextureManager.textures` 未实现 | packages-user/client-base/src/material/manager.ts:38-43 | packages-user/client-base/src/material/types.ts:262-263 | `MaterialManager implements ITextureManager`（`manager.ts:38`），成员仅 `tileStore`（`:39`）/ `tilesetStore`（`:40`）/ `imageStore`（`:41`）/ `assetStore`（`:42`）/ `bigImageStore`（`:43`），**无 `textures`**；基准新增 `readonly textures: ITextureStore`（`types.ts:262-263`） | 实测 `client-modules/src/client.ts:84` 报 `error TS2739`：`Type 'MaterialManager' is missing the following properties from type 'ITextureManager': textures, state` | 高 |
| #04-06-C-02 | `ICoreStateExtended`（经 `ITextureManager`）未实现 | packages-user/client-base/src/material/manager.ts:38 | packages-user/client-base/src/material/types.ts:260；定义源 packages-user/data-state/src/types.ts:45-49 | `ITextureManager extends ITextureGetter, ITextureAliasGetter, ICoreStateExtended`（`types.ts:260-261`），实现类 `MaterialManager`（`manager.ts:38`）**无 `state` 成员**；`ICoreStateExtended` 定义源 `data-state/src/types.ts:45-49`（`readonly state: ICoreState`） | 实测 `manager.ts:38` 报 `error TS2420`：`Class 'MaterialManager' incorrectly implements interface 'ITextureManager'.` / `missing ... 'textures', 'state'` | 高 |
| #04-06-C-03 | `ICoreStateExtended`（经 `IAutotileProcessor`）未实现 | packages-user/client-base/src/material/autotile.ts:42 | packages-user/client-base/src/material/types.ts:104；定义源 packages-user/data-state/src/types.ts:45-49 | `IAutotileProcessor extends ICoreStateExtended`（`types.ts:104`），实现类 `AutotileProcessor`（`autotile.ts:42`，构造器仅参数 `manager`）**无 `state` 成员** | 实测 `autotile.ts:42` 报 `error TS2420`（`Property 'state' is missing`）；构造点 `client-modules/src/client.ts:85` 与 `render/map/renderer.ts:234` 报 `error TS2741`：`Property 'state' is missing in type 'AutotileProcessor' but required in type 'IAutotileProcessor'.` | 高 |
| #04-06-C-04 | `ICoreStateExtended`（经 `IAssetBuilder`）未实现 | packages-user/client-base/src/material/builder.ts:12 | packages-user/client-base/src/material/types.ts:430；定义源 packages-user/data-state/src/types.ts:45-49 | `IAssetBuilder extends ICoreStateExtended`（`types.ts:430`），实现类 `AssetBuilder`（`builder.ts:12`）**无 `state` 成员** | 实测 `builder.ts:12` 报 `error TS2420`（`Property 'state' is missing`）；构造点 `material/manager.ts:86`（`new AssetBuilder(this)`）与 `builder.ts:91` 报 `error TS2741` | 高 |
| #04-06-C-05 | `ICoreStateExtended`（经 `ITrackedAssetData`）未实现 | packages-user/client-base/src/material/builder.ts:99 | packages-user/client-base/src/material/types.ts:462-463；定义源 packages-user/data-state/src/types.ts:45-49 | `ITrackedAssetData extends IDirtyTracker<Set<number>>, ICoreStateExtended`（`types.ts:462-463`），实现类 `TrackedAssetData`（`builder.ts:99`）**无 `state` 成员** | 实测 `builder.ts:99` 报 `error TS2420`（`Property 'state' is missing`）；构造点 `builder.ts:91`（TS2741） | 高 |

**构造 / 接线面登记（不裁定 `state` 的注入方式）：**

| 构造 / 接线点 | 锚点 |
|---|---|
| `new MaterialManager()`（无参） | packages-user/client-modules/src/client.ts:84 |
| `new AutotileProcessor(this.materials)` | packages-user/client-modules/src/client.ts:85 |
| `new AutotileProcessor(manager)`（`MapRenderer` 构造内） | packages-user/client-modules/src/render/map/renderer.ts:234 |
| `new AssetBuilder(this)`（`MaterialManager` 构造内） | packages-user/client-base/src/material/manager.ts:86 |
| `new TrackedAssetData(materials, this)`（`AssetBuilder` 构造内） | packages-user/client-base/src/material/builder.ts:28 |

背景事实（仅作背景，不裁定）：`ClientCore extends CoreState`（packages-user/client-modules/src/client.ts:45）；`MaterialManager` 在 `client-modules/src/client.ts:84` 由 `ClientCore` 构造。

## D big-image 残留（实现与消费者）

列序固定：`ID | 接口/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信`。本节登记**不在接口成员层面**的 big-image 实现 / 概念残留：`client-base` 内已不属接口的实现成员（`manager.ts`）与走 legacy 全局的 `cache.ts` 概念路径。每条给「是否仍属某个接口成员」（**否**）与「是否导致类型错误」的判定。**A 类与 D 类对同一成员的两条记录互相引用。**

| ID | 接口/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-06-D-01 | `bigImageStore`（实现，非接口成员） | packages-user/client-base/src/material/manager.ts:43 | packages-user/client-base/src/material/types.ts:260 | `MaterialManager.bigImageStore: ITextureStore = new TextureStore()`；不在现行 `ITextureManager` 上（**是否仍属接口成员：否**）。互引：A 类 `#04-06-A-07`（`renderer.ts:652` 的消费点） | 不直接导致类型错误（`implements` 只要求接口成员；多余成员不报错） | 高 |
| #04-06-D-02 | `bigImageData`（实现，非接口成员） | packages-user/client-base/src/material/manager.ts:56 | packages-user/client-base/src/material/types.ts:260 | `MaterialManager.bigImageData: Map<number, IMaterialFramedData>`（大怪物数据）；**是否仍属接口成员：否** | 不直接导致类型错误 | 高 |
| #04-06-D-03 | `bigImageId`（实现，非接口成员） | packages-user/client-base/src/material/manager.ts:77 | packages-user/client-base/src/material/types.ts:260 | `private bigImageId: number = 0`（大怪物贴图标识符）；**是否仍属接口成员：否** | 不直接导致类型错误 | 高 |
| #04-06-D-04 | `setDefaultFrame` 对 `bigImageData` 的耦合 | packages-user/client-base/src/material/manager.ts:233-235 | packages-user/client-base/src/material/types.ts:340 | `setDefaultFrame(identifier, defaultFrame)` 除写入 `defaultFrames` 外，还 `this.bigImageData.get(identifier)` 并改其 `defaultFrame`（`:233-235`）；`setDefaultFrame` **是**现行接口成员（`types.ts:340`），但其内部对 big-image 数据结构的耦合属残留。**是否仍属接口成员：接口方法在、耦合逻辑不在** | 不直接导致类型错误 | 高 |
| #04-06-D-05 | `setBigImage`（实现，非接口成员） | packages-user/client-base/src/material/manager.ts:552-573 | packages-user/client-base/src/material/types.ts:260 | 实现 `setBigImage(identifier, image, frames): IBigImageReturn`（`:552`），内部 `this.bigImageId++`（`:557`）/ `this.bigImageStore.addTexture`（`:558`）/ `this.bigImageData.set`（`:567`）；**是否仍属接口成员：否**。互引：A 类 `#04-06-A-10`（消费者调用点 0 处） | 不直接导致类型错误；其返回类型 `IBigImageReturn` 未导出见 D-10 | 高 |
| #04-06-D-06 | `isBigImage`（实现，非接口成员） | packages-user/client-base/src/material/manager.ts:575-577 | packages-user/client-base/src/material/types.ts:196 | 实现 `isBigImage(identifier): boolean` → `this.bigImageData.has(identifier)`；**是否仍属接口成员：否**。互引：A 类 `#04-06-A-11`（调用点 0 处） | 不直接导致类型错误 | 高 |
| #04-06-D-07 | `getBigImage`（实现，非接口成员） | packages-user/client-base/src/material/manager.ts:579-581 | packages-user/client-base/src/material/types.ts:196 | 实现 `getBigImage(identifier): Readonly<IMaterialFramedData> \| null` → `this.bigImageData.get(identifier) ?? null`；**是否仍属接口成员：否**。互引：A 类 `#04-06-A-08`（`renderer.ts:653`） | 不直接导致类型错误 | 高 |
| #04-06-D-08 | `getBigImageByAlias`（实现，非接口成员） | packages-user/client-base/src/material/manager.ts:583-587 | packages-user/client-base/src/material/types.ts:228 | 实现 `getBigImageByAlias(alias)` → 经 `idNumMap` 取 identifier 后 `this.bigImageData.get`；**是否仍属接口成员：否**。互引：A 类 `#04-06-A-12`（调用点 0 处） | 不直接导致类型错误 | 高 |
| #04-06-D-09 | `getIfBigImage`（实现，非接口成员） | packages-user/client-base/src/material/manager.ts:589-593 | packages-user/client-base/src/material/types.ts:196 | 实现 `getIfBigImage(identifier)` → 先查 `this.bigImageData`，无则 `this.getTile(identifier)`；**是否仍属接口成员：否**。互引：A 类 `#04-06-A-01`..`#04-06-A-06`（7 处消费者调用点） | 不直接导致类型错误（实现类多余成员） | 高 |
| #04-06-D-10 | `IBigImageReturn` 类型引用 | packages-user/client-base/src/material/manager.ts:20 | packages-user/client-base/src/material/types.ts:260 | import `IBigImageReturn`（`:20`）与类型标注 `): IBigImageReturn {`（`:556`）、`const data: IBigImageReturn = {`（`:568`）；该类型已不在基准导出中。互引：A 类 `#04-06-A-09`（import 侧） | **导致类型错误**：`manager.ts:20` 报 `error TS2305`（`Module '"./types"' has no exported member 'IBigImageReturn'.`） | 高 |
| #04-06-D-11 | `RenderableDataBase.bigImage`（legacy 概念路径） | packages-user/client-modules/src/render/elements/cache.ts:36 | src/types/declaration/map.d.ts:354 | `RenderableDataBase` 接口声明 `bigImage: boolean`（`cache.ts:36`），并在 `:48`（`AutotileRenderable`）/ `:144` / `:190` / `:215` / `:243` / `:276` 赋值。**不走 `ITextureManager`**（走 legacy 全局 `core.material.*`）；**是否仍属接口成员：否** | **不导致 material 类型错误**（走 `core.*` legacy 全局，`interface` 定义在本文件内） | 高 |
| #04-06-D-12 | `cache.ts` legacy bigImage 读取（`enemys[id].bigImage` 与 `core.material.images.images[bigImage]`） | packages-user/client-modules/src/render/elements/cache.ts:153,157,159-160 | src/types/declaration/map.d.ts:354 | `let { faceIds, bigImage } = data;`（`:153`）与 `({ bigImage, faceIds } = enemys[id as EnemyIds]);`（`:157`）取自 legacy `maps_*` / `enemys_*` 全局；`if (bigImage) { const image = core.material.images.images[bigImage]; ... }`（`:159-160`）经 `core.material.*` 读旧全局。**不走 `ITextureManager`**；**是否仍属接口成员：否** | **不导致 material 类型错误**（走 `core.*` legacy 全局） | 高 |

**D 类小结：** `MaterialManager` 残留 **10** 项（`#04-06-D-01`..`#04-06-D-10`）+ `cache.ts` legacy 概念路径 2 条记录（`#04-06-D-11` / `#04-06-D-12`，同一 `cache.ts` 文件）。`cache.ts` 明确标注「不走 `ITextureManager`、不导致 material 类型错误」。全部 `bigImage*` 源码命中已由 `git grep -n -i "bigimage" -- packages-user` 核对无遗漏（命中集仅 `manager.ts` / `cache.ts` / `door.ts` / `hero.ts` / `renderer.ts` / `vertex.ts`）。

## E 范围外命中（仅报告）

**本节仅报告：不在本阶段修改，也不提出修改建议。**

列序固定：`ID | 接口/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信`。本节只登记事实与核对命令。

| ID | 接口/成员名 | 命中处 | 基准侧锚点 | 问题描述 | 影响 | 置信 |
|---|---|---|---|---|---|---|
| #04-06-E-01 | `bigImage` 数据字段 | src/types/declaration/enemy.d.ts:65 | packages-user/client-base/src/material/types.ts:196 | `enemy.d.ts:65` 声明 `bigImage?: ImageIds;`（`src/` 内旧数据字段声明），与基准 `ITextureGetter` 已无 big-image 成员形成对照 | 仅报告；`src/` 不在本阶段范围（D-32） | 高 |
| #04-06-E-02 | `bigImage` 数据字段 | src/types/declaration/core.d.ts:1286 | packages-user/client-base/src/material/types.ts:196 | `core.d.ts:1286` 声明 `bigImage?: ImageIds;`（同形旧数据字段声明） | 仅报告；`src/` 不在本阶段范围 | 高 |
| #04-06-E-03 | `bigImage` 数据字段 | src/types/declaration/map.d.ts:354 | packages-user/client-base/src/material/types.ts:196 | `map.d.ts:354` 声明 `bigImage: HTMLImageElement;`（旧数据字段声明） | 仅报告；`src/` 不在本阶段范围 | 高 |
| #04-06-E-04 | `_getBigImageInfo` | src/types/declaration/map.d.ts:1443 | packages-user/client-base/src/material/types.ts:196 | `map.d.ts:1443` 声明 `_getBigImageInfo(bigImage: HTMLImageElement, face: Dir, posX: number): any;`（legacy API 声明） | 仅报告；`src/` 不在本阶段范围 | 高 |
| #04-06-E-05 | `bigImage` 数据字段 | src/types/declaration/status.d.ts:391 | packages-user/client-base/src/material/types.ts:196 | `status.d.ts:391` 声明 `bigImage: HTMLImageElement;`（在 `BigImageBoxAnimate`，`status.d.ts:387`） | 仅报告；`src/` 不在本阶段范围 | 高 |
| #04-06-E-06 | `bigImage`（对照扫描零命中） | packages/（零命中；对照扫描无任何 file:line 命中） packages-user/client-base/src/types.ts:18 | packages-user/client-base/src/material/types.ts:196 | 核对命令 `git grep -n -i bigImage -- packages` 输出为**空**（退出码 1，无匹配）；与 D-32「`packages` 不纳入、理应不受影响」一致 | 仅报告；`packages/` 零命中，无需处置 | 高 |
| #04-06-E-07 | 过期工装态标签 | .planning/graphs/graph.json（`IMaterialManager` 等过期标签） packages-user/client-base/src/material/types.ts:260 | packages-user/client-base/src/types.ts:18 | `.planning/graphs/graph.json` 与 `.planning/graphs/.last-build-snapshot.json` 仍标注 `IMaterialManager` / `IMaterialGetter` / `IBigImageReturn` / `.getBigImage()` 等已被删除的符号；快照时间戳 `2026-09-07T02:50:52.708Z`，早于 `4e305e3`（2026-09-21） | 仅报告；不得作为基准或命中依据（是否重建由用户决定，见 F 类） | 高 |
| #04-06-E-08 | `@user/data-state` 依赖声明 | packages-user/client-base/package.json:3-8 packages-user/client-base/src/material/types.ts:9 | packages-user/client-base/src/types.ts:3 | `client-base/package.json` 的 `dependencies` 仅声明 `@motajs/audio` / `@motajs/render` / `@motajs/client-base` / `@user/data-base`，**未声明** `@user/data-state`；而 `material/types.ts:9`（`import { ICoreStateExtended } from '@user/data-state';`）与 `client-base/src/types.ts:3`（`import { ICoreState } from '@user/data-state';`）已 import 该包 | 仅报告事实；是否算问题**交由用户判断**（本步不判定） | 高 |

**E 类小结：** `src/types/declaration/*` 命中 **5** 处（`enemy.d.ts:65` / `core.d.ts:1286` / `map.d.ts:354` / `map.d.ts:1443` / `status.d.ts:391`）；`packages/` **0** 命中；`.planning/graphs/*` 过期标签；`client-base/package.json` 未声明 `@user/data-state` 的事实。全节只登记事实与核对命令，**不写成待修改项、不提出修改建议**。

## F 未能从阅读确定（未猜测）

条目形如 `- **#04-06-F-NN**：现象 + 为什么读不出来 + 需要用户裁决的点`。**只登记，不判定**；不得写成错配 / 缺失 / 残留。

- **#04-06-F-01**：`getIfBigImage` 的语义替代是否成立。现象：`getIfBigImage` 已被删除，新基准 `ITextureGetter` 只提供 `getTile`（`packages-user/client-base/src/material/types.ts:201`）、`getImage`（`:225`）、`ITextureManager.getRenderable`（`:397`）。读不出来的原因：`door.ts` 的大图开门帧数语义（`:36,:46` 读 `data.frames`）、`hero.ts` 的贴图取值（`:239,:364,:428`）、`vertex.ts` 的顶点裁剪（`:546`）所依赖的「大图帧数据」是否可由 `getTile` 的返回（`Readonly<IMaterialFramedData>`）等价承接，取决于这些调用点对「大图特殊帧序 / 偏移」的实际期望，超出静态阅读可定论的范围。需要用户裁决：**大图帧序语义由哪个成员承接**。

- **#04-06-F-02**：`ITextureManager.textures`（`packages-user/client-base/src/material/types.ts:262`）应由哪个现有 store 承担。现象：基准新增 `readonly textures: ITextureStore`（jsDoc：「通过加载获取的所有纹理贴图存储，包括图块、普通图片等」），实现类 `MaterialManager`（`packages-user/client-base/src/material/manager.ts:38-43`）现只有 `tileStore` / `tilesetStore` / `imageStore` / `assetStore` / `bigImageStore`。读不出来的原因：`textures` 的语义是「所有纹理的合集」还是某一个已有的 store，抑或需要新建，取决于新引擎对「加载所得纹理统一入口」的定位。需要用户裁决：**`textures` 由 `tileStore` 承担，还是新建 / 复用其它 store**。

- **#04-06-F-03**：四个实现类缺失的 `state` 从何处注入。现象：`MaterialManager`（`manager.ts:38`）、`AutotileProcessor`（`autotile.ts:42`）、`AssetBuilder`（`builder.ts:12`）、`TrackedAssetData`（`builder.ts:99`）均无 `state` 成员，而基准四处 `extends ICoreStateExtended`（定义源 `packages-user/data-state/src/types.ts:45-49`：`readonly state: ICoreState`）。读不出来的原因：`ClientCore extends CoreState`（`packages-user/client-modules/src/client.ts:45`），构造点 `client.ts:84`（`new MaterialManager()`）、`client.ts:85`、`render/map/renderer.ts:234`、`manager.ts:86`、`builder.ts:28` 均在 `client-modules` 侧；但 `client-base` 是否应依赖 `@user/data-state`（其 `package.json` 未声明该依赖，见 E-08）以及 `state` 是构造注入还是属性赋值，超出静态阅读可定论范围。需要用户裁决：**`state` 的来源与注入方式**（D-23 亦约束新增代码不得取全局单例）。

- **#04-06-F-04**：`cache.ts` 的 legacy bigImage 路径属本 material 增量还是 Phase 5 legacy 清退边界。现象：`packages-user/client-modules/src/render/elements/cache.ts` 经 `core.material.images.images[bigImage]`（`:160`）与 `enemys[id].bigImage`（`:157`）读旧全局，**不走 `ITextureManager`**、且不产生 material 类型错误。读不出来的原因：`core.*` 属旧引擎适配（D-12，第五阶段），而「big-image 概念删除后的 conceptual 残留」又落在本 material 增量的语义范围内，二者边界需要裁决。需要用户裁决：**`cache.ts` 的 legacy bigImage 路径归属哪个阶段**。

- **#04-06-F-05**：`setDefaultFrame` 与 `bigImageData` 的耦合在新概念下是否有对位。现象：`setDefaultFrame`（`packages-user/client-base/src/material/types.ts:340`，接口成员）内部耦合 `this.bigImageData`（`manager.ts:233-235`）；`bigImageData` 已不属接口成员。读不出来的原因：新引擎中「按 identifier 设置默认帧」是否仍需同步一份「大图帧数据」，还是会随 big-image 概念一并消失，取决于新引擎的帧数据模型。需要用户裁决：**`setDefaultFrame` 在新概念下是否需要保留对某帧数据结构的同步**。

- **#04-06-F-06**：`.planning/graphs/*` 是否需要重建。现象：`.planning/graphs/{graph.json,.last-build-snapshot.json}` 仍标注已被删除的 `IMaterialManager` / `IMaterialGetter` / `IBigImageReturn` / `getBigImage` 等标签（快照 `2026-09-07`）。读不出来的原因：工装态重建属流程决策，非代码事实。需要用户裁决：**是否在本阶段或后续重建 `.planning/graphs/*`**。

## 处置

- 本文件是 material 接口适应（D-30 / D-31）**第一步（只读清点）**的交付物；本步**未修改任何生产代码**，`files_modified` 仅本文件。
- 相对本文件 `## 方法` 记录的**只读起始基线**（`git status --porcelain -- packages packages-user src` = 空）**零变化**；生产源码自 `4e305e3` 起未再改动，类型错误总行数重跑一致（199）。
- **第二步（material 接口适应实施）未规划**，待用户审阅本文件后另行规划（D-32）。本文件不含修复方案、不含代码改动建议、未产出任何 `04-07+` 或新 `*-PLAN.md`。
- 范围限 `packages-user`，`packages/` 不纳入、`src/` 命中仅报告（D-32）。
- A / B / C / D / E / F 六类中：只有 **A / C / D** 是 `packages-user` 内的待处置项；**B** 类已清零；**E** 类仅报告；**F** 类须用户裁决。
- `state` 的注入方式、`textures` 的承担者、`getIfBigImage` 的替代一律由**用户裁决**（不得由 AI 裁定；D-23 亦约束新增代码不得取全局单例）。
- `core.*` legacy 适配（D-12）与移动控制（D-19）、跟随者（D-22）、`HeroRendering` 语义（D-18）不属本步。
- `REND-01` / `REND-02` 保持 **Pending**。
- 当日实测数值（199 / 19）与规划日（199 / 19）一致，无差异需要说明；「material / 非 material」的划分口径为规划日人工归类，**须用户确认**（见 `## 类型门禁实测基线`）。

