---
phase: 04-render-adaptation
plan: 7
subsystem: render-material
tags: [material, texture-manager, big-image-removal, constructor-injection, state, data-state]
requires:
  - phase: 04-render-adaptation
    provides: 04-06 material 接口影响只读清点（04-MATERIAL-INTERFACE-IMPACT.md，A/C/D/E 四类待处置项）
provides:
  - MaterialManager.textures 补实现（专用 TextureStore）
  - MaterialManager / AutotileProcessor / AssetBuilder / TrackedAssetData 的构造器注入 state
  - big-image 实现与消费者全部删除，7 处取值改为 getTile
  - cache.ts legacy big-image 路径整体删除
  - client-base/package.json 补 @user/data-state 声明
affects: [04-render-adaptation]
actuals:
  tokens: 4505
  tasks: 3
  commits: 2
  plan_head_before: 786c00c
tech-stack:
  added: []
  patterns: [构造器注入 state（D-35）, big-image 概念删除（D-34/D-36）]
key-files:
  created: []
  modified:
    - packages-user/client-base/package.json
    - packages-user/client-base/src/material/manager.ts
    - packages-user/client-base/src/material/autotile.ts
    - packages-user/client-base/src/material/builder.ts
    - packages-user/client-modules/src/client.ts
    - packages-user/client-modules/src/render/map/renderer.ts
    - packages-user/client-modules/src/render/map/vertex.ts
    - packages-user/client-modules/src/render/map/extension/door.ts
    - packages-user/client-modules/src/render/map/extension/hero.ts
    - packages-user/client-modules/src/render/elements/cache.ts
key-decisions:
  - "D-35: state 一律经构造器注入，不取全局单例（D-23）"
  - "F-02 裁定：textures 由新建专用 TextureStore 承担（本次范围内无写入者）"
  - "D-34: getIfBigImage ≡ getTile（bigImageData 无写入者），7 处调用行为保持改写"
requirements-completed: []
duration: ~35min
completed: 2026-09-22
status: complete
---

# Phase 4 Plan 7: material 接口适应实施 Summary

**删除 material 的 big-image 全链路并把 state 经构造器注入四个实现类，`packages-user` 内 material 归属类型诊断从 19 条清零（总行数 199 → 180）。**

## Performance

- **Duration:** ~35min（单次顺序会话；refactor 提交 `78873d0` 于 2026-09-22 11:52:55 +0800）
- **Started:** 2026-09-22
- **Completed:** 2026-09-22
- **Tasks:** 3（Task 0 为只读汇报关卡，不计入工作任务）
- **Files modified:** 10

## Accomplishments

- D-34：`MaterialManager` 的 big-image 实现面（`IBigImageReturn` import、`bigImageStore` / `bigImageData` / `bigImageId` 三字段、`setBigImage` / `isBigImage` / `getBigImage` / `getBigImageByAlias` / `getIfBigImage` 五方法、`setDefaultFrame` 的 big-image 耦合）全部删除；7 处消费者调用改为 `getTile(...)`；`getOffsetPool` 的 big-image 偏移收集循环删除。
- D-35：`MaterialManager` 补 `readonly textures: ITextureStore`（专用 `TextureStore`）与构造器注入的 `state`；`AutotileProcessor` / `AssetBuilder` / `TrackedAssetData` 各补构造器注入的 `state`；`state` 一律构造器传入，未引入全局单例（D-23）。
- D-36：`cache.ts` 的 legacy big-image 路径（字段、`AutotileRenderable` 的 `bigImage: false`、5 处对象字面量、`faceIds` / `bigImage` 解构与 `enemys` 特判、`if (bigImage)` 分支、随之未使用的 `enemys` 声明）全部删除。
- D-37：`client-base/package.json` 补 `"@user/data-state": "workspace:*"`；未执行安装、未修改 `pnpm-lock.yaml`（pnpm 隐式同步的 lockfile 改动已还原）。
- 门禁：material 归属诊断 19 → 0；总错误行数 199 → 180（= 基线减 material 条数）；10 个在范围文件 0 诊断；`packages-user` 内 `bigimage` 记号归零；eslint 0 错误；CRLF 保持。

## Task Commits

1. **Task 1+2+3: material 接口适应实施** - `78873d0` (refactor) — 10 个文件一次原子提交
2. **Task 3: 执行记录** - `docs(04-07): record execution state` (docs) — 仅含本 SUMMARY

_说明：按 04-07-PLAN 要求，Task 1 / Task 2 为整体修正的中间态，不单独提交；Task 3 完成全部改动后一次原子提交。_

## Files Created/Modified

- `packages-user/client-base/package.json` - `dependencies` 新增 `@user/data-state: workspace:*`（D-37）
- `packages-user/client-base/src/material/manager.ts` - 补 `textures` 与构造器注入 `state`；big-image 实现面全删
- `packages-user/client-base/src/material/autotile.ts` - 构造器新增 `state`（保留 `manager` 形参）
- `packages-user/client-base/src/material/builder.ts` - `AssetBuilder` / `TrackedAssetData` 构造器新增 `state`
- `packages-user/client-modules/src/client.ts` - `new MaterialManager(this)`、`new AutotileProcessor(this.materials, this)`
- `packages-user/client-modules/src/render/map/renderer.ts` - `new AutotileProcessor(manager, manager.state)`；`getOffsetPool` 清理；`useTileBackground` 取值改 `getTile`
- `packages-user/client-modules/src/render/map/vertex.ts` - `updateVertexArray` 取值改 `getTile`
- `packages-user/client-modules/src/render/map/extension/door.ts` - `openDoor` / `closeDoor` 取值改 `getTile`
- `packages-user/client-modules/src/render/map/extension/hero.ts` - 三处取值改 `getTile`；D-28 保留项未动
- `packages-user/client-modules/src/render/elements/cache.ts` - legacy big-image 路径整体删除

## 执行前核对（Task 1 步骤 0a，带 file:line）

- ① `MaterialManager` 仍 `implements ITextureManager`，字段仅 `tileStore` / `tilesetStore` / `imageStore` / `assetStore` / `bigImageStore`，无 `textures`、无 `state` —— 结论：一致（`manager.ts:38-43`，初始状态）
- ② 四个实现类仍缺 `state` —— 结论：一致（`manager.ts:38`、`autotile.ts:42`、`builder.ts:12`、`builder.ts:99`）
- ③ `ICoreStateExtended` 定义源仍为 `readonly state: ICoreState`，`ICoreState` 由 barrel 导出 —— 结论：一致（`data-state/src/types.ts:45-49`；`data-state/src/index.ts:11` `export * from './types';`）
- ④ 四处 `extends ICoreStateExtended` 与 `readonly textures: ITextureStore` 仍在基准侧 —— 结论：一致（`material/types.ts:104`、`:260-263`、`:430`、`:462-463`）
- ⑤ 构造 / 接线面仅五处 —— 结论：一致（`client.ts:84` / `client.ts:85` / `render/map/renderer.ts:234` / `manager.ts:86` / `builder.ts:28`；`git grep` 无第六处）
- ⑥ `ClientCore extends CoreState implements IClientCore`、`CoreState implements ICoreState`、链 `IClientCore → IClientSystem → IClientBase → ICoreState` —— 结论：一致（`client.ts:45`、`core.ts:77`、`client-modules/types.ts:9`、`client-system/types.ts:3`、`client-base/types.ts:8`）
- ⑦ `render/map/renderer.ts:217` 的 `manager` 类型仍为 `ITextureManager` —— 结论：一致
- ⑧ `@user/data-state` 仍不在 `client-base/package.json`，而 `material/types.ts:9` 与 `client-base/src/types.ts:3` 已 import —— 结论：一致
- ⑨ `ITextureGetter.getTile(identifier): Readonly<IMaterialFramedData> | null` —— 结论：一致（`material/types.ts:201`）
- ⑩ `setBigImage` / `isBigImage` / `getBigImageByAlias` 消费者调用点仍为 0 —— 结论：一致（`git grep` 仅命中 `manager.ts` 自身定义行）
- ⑪ `cache.ts` 的 bigImage 命中与 `enemys` 声明仍在 —— 结论：一致（`cache.ts:36,48,144,153,157,159,160,190,215,243,276`、`:127`）
- ⑫ `@motajs/render` barrel 仍导出 `TextureStore` —— 结论：一致（`packages/render/src/assets/index.ts` `export * from './store';`）

十二项全部与规划基线一致，无需修订；其中第 ⑪ 项与 04-06 清点的 `cache.ts` 命中行号一致。

## 类型门禁基线（Task 1 步骤 0b，当日实测）

<!-- TYPE-BASELINE:START -->
错误总行数：199；material 归属行数：19
packages-user/client-base/src/material/autotile.ts(42,14): error TS2420: Class 'AutotileProcessor' incorrectly implements interface 'IAutotileProcessor'.
packages-user/client-base/src/material/builder.ts(12,14): error TS2420: Class 'AssetBuilder' incorrectly implements interface 'IAssetBuilder'.
packages-user/client-base/src/material/builder.ts(91,9): error TS2741: Property 'state' is missing in type 'TrackedAssetData' but required in type 'ITrackedAssetData'.
packages-user/client-base/src/material/builder.ts(99,7): error TS2420: Class 'TrackedAssetData' incorrectly implements interface 'ITrackedAssetData'.
packages-user/client-base/src/material/manager.ts(20,5): error TS2305: Module '"./types"' has no exported member 'IBigImageReturn'.
packages-user/client-base/src/material/manager.ts(38,14): error TS2420: Class 'MaterialManager' incorrectly implements interface 'ITextureManager'.
packages-user/client-base/src/material/manager.ts(86,9): error TS2741: Property 'state' is missing in type 'AssetBuilder' but required in type 'IAssetBuilder'.
packages-user/client-modules/src/client.ts(84,9): error TS2739: Type 'MaterialManager' is missing the following properties from type 'ITextureManager': textures, state
packages-user/client-modules/src/client.ts(85,9): error TS2741: Property 'state' is missing in type 'AutotileProcessor' but required in type 'IAutotileProcessor'.
packages-user/client-modules/src/render/map/extension/door.ts(36,44): error TS2339: Property 'getIfBigImage' does not exist on type 'ITextureManager'.
packages-user/client-modules/src/render/map/extension/door.ts(46,44): error TS2339: Property 'getIfBigImage' does not exist on type 'ITextureManager'.
packages-user/client-modules/src/render/map/extension/hero.ts(239,47): error TS2339: Property 'getIfBigImage' does not exist on type 'ITextureManager'.
packages-user/client-modules/src/render/map/extension/hero.ts(364,43): error TS2339: Property 'getIfBigImage' does not exist on type 'ITextureManager'.
packages-user/client-modules/src/render/map/extension/hero.ts(428,48): error TS2339: Property 'getIfBigImage' does not exist on type 'ITextureManager'.
packages-user/client-modules/src/render/map/renderer.ts(234,9): error TS2741: Property 'state' is missing in type 'AutotileProcessor' but required in type 'IAutotileProcessor'.
packages-user/client-modules/src/render/map/renderer.ts(652,47): error TS2551: Property 'bigImageStore' does not exist on type 'ITextureManager'. Did you mean 'imageStore'?
packages-user/client-modules/src/render/map/renderer.ts(653,39): error TS2551: Property 'getBigImage' does not exist on type 'ITextureManager'. Did you mean 'getImage'?
packages-user/client-modules/src/render/map/renderer.ts(1250,34): error TS2339: Property 'getIfBigImage' does not exist on type 'ITextureManager'.
packages-user/client-modules/src/render/map/vertex.ts(546,44): error TS2339: Property 'getIfBigImage' does not exist on type 'ITextureManager'.
<!-- TYPE-BASELINE:END -->

基线说明：`错误总行数 199`、`material 归属 19`（= `client-base` 7 + `client-modules` 12），与 `04-MATERIAL-INTERFACE-IMPACT.md` 的规划日实测完全一致，无差异需要说明。material 归属由固定谓词机器判定（路径含 `client-base/src/material/` 或诊断文本命中 14 个固定记号之一）。

**完工后类型门禁实测**：material 归属 **0**；10 个在范围文件诊断 **0**；错误总行数 **180** = 基线 199 − material 19（≤ 允许上限 180）。

## 并发改动基线（Task 1 步骤 0c，当日实测）

<!-- CONCURRENT-BASELINE:START -->
<!-- CONCURRENT-BASELINE:END -->
基线摘要 sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855

基线说明：当日 `git status --porcelain` **输出为空**（无用户并发未提交改动；规划日假设的 ` M .planning/phases/04-render-adaptation/04-CONTEXT.md` 当日已提交，故实测为空，与 04-04 / 04-06 的旧列表不同，本 run 一律以本次实测为准）。摘要 `sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` 为空集摘要。本计划未回滚 / 暂存 / 提交 / 修改任何条目；完工后同一命令复算，条目集合与摘要均未变（entries 0）。

## D-33..D-37 处置对照

| 裁定 | 类别 | 落地内容 | 结果 |
|---|---|---|---|
| D-34 | A 类（已移除符号引用） | `MaterialManager` big-image 实现面全删；7 处 `getIfBigImage` → `getTile`；`getOffsetPool` big-image 循环删除 | 完成 |
| D-35 | C 类（新增约束未实现） | 四个实现类补构造器注入 `state`；`MaterialManager` 补 `textures`（专用 `TextureStore`） | 完成 |
| D-36 | D 类（big-image 残留） | `MaterialManager` 残留（同 D-34）+ `cache.ts` legacy big-image 路径整体删除 | 完成 |
| D-37 | E 类（依赖声明） | `client-base/package.json` 补 `@user/data-state: workspace:*`；不安装、不同步 lockfile | 完成 |
| D-33 | 范围边界 | 只修 material 归属诊断；19 → 0，总行数 199 → 180（≤ 180）；无关诊断一条未追 | 完成 |

### 逐处替换映射（含行为保持论据）

| 位置 | 旧 | 新 | 等价性 |
|---|---|---|---|
| `door.ts:36` | `this.renderer.manager.getIfBigImage(num)` | `this.renderer.manager.getTile(num)` | **行为保持** |
| `door.ts:46` | 同上 | 同上 | 同上 |
| `hero.ts:239` | `getIfBigImage(nextTile?.identifier ?? block.tile)` | `getTile(nextTile?.identifier ?? block.tile)` | 同上 |
| `hero.ts:364` | `getIfBigImage(faced?.face ?? image)` | `getTile(faced?.face ?? image)` | 同上 |
| `hero.ts:428` | `getIfBigImage(nextFace.identifier)` | `getTile(nextFace.identifier)` | 同上 |
| `renderer.ts:1250` | `this.manager.getIfBigImage(tile)` | `this.manager.getTile(tile)` | 同上 |
| `vertex.ts:546` | `this.renderer.manager.getIfBigImage(num)` | `this.renderer.manager.getTile(num)` | 同上 |
| `renderer.ts:651-657` | `bigImageStore.keys()` + `getBigImage(identifier)` 偏移循环 | **整段删除**（含行内注释） | big-image 专属偏移，概念删除后不再存在 |
| `manager.ts:20` | import `IBigImageReturn` | 从 import 列表删除 | 符号已不存在 |
| `manager.ts` 三字段 | `bigImageStore` / `bigImageData` / `bigImageId` | 删除 | 非接口成员、无消费者 |
| `manager.ts` `setDefaultFrame` | 对 `bigImageData` 的耦合 | 删除耦合，保留 `defaultFrames.set` | 接口方法本体保留（F-05） |
| `manager.ts` 五方法 | `setBigImage` / `isBigImage` / `getBigImage` / `getBigImageByAlias` / `getIfBigImage` | 整体删除 | 非接口成员；消费者 0 或被 `getTile` 取代 |
| `cache.ts` 11 处 | 字段 / 字面量 / 解构 / `enemys` 特判 / `if (bigImage)` 分支 | 整体删除（含 `enemys` 声明） | legacy 概念路径 |
| `client-base/package.json` | 无 `@user/data-state` | `"@user/data-state": "workspace:*"` | 声明补全 |

**`getIfBigImage ≡ getTile` 论据（现场复验）**：`getIfBigImage(x)` 的实现是 `bigImageData.get(x) ?? getTile(x)`（原 `manager.ts:589-593`），而 `bigImageData` 的唯一写入者 `setBigImage` 在全仓库**消费者调用点为 0**——完工后 `git grep -n -E "setBigImage|isBigImage|getBigImageByAlias" -- packages-user` **无输出**（退出码 1），故今日 `getIfBigImage ≡ getTile`，7 处改写行为保持。

**`textures` 承担 store（F-02 裁定）**：按用户在 Task 0 的裁定，采用建议默认 (a) —— `readonly textures: ITextureStore = new TextureStore();`。**事实声明：本次改动范围内没有任何代码向它写入**（写入侧属新引擎后续步骤，loader 不在 D-33 范围内）；它是接口要求的「统一纹理入口」占位实现，不是「已可用的统一纹理入口」。

**`cache.ts` 删除的行为影响（D-36，未经运行验证）**：`if (bigImage)` 分支删除后，原本走该分支的 legacy 大图怪物会落到后续分支（`enemy48` / `npc48` 分支或普通图块分支）渲染。这与 D-31「big-image 概念删除、旧兼容可痛丢弃」一致，但确是一次**运行时可见**的变化；因无渲染设施，本计划**未在运行时验证它**。

## 门禁输出摘要

- Task 1 tracer 类型门禁：`OK tracer: C-class 0; material 10==M-9; total 190<=190`
- Task 1 绑定门禁：`OK tracer bindings: textures + 4 state + 5 construction sites + D37 dependency`
- Task 1 eslint（5 文件）：0 错误
- Task 1 CRLF（5 文件）：`OK CRLF`
- Task 2 scoped 类型门禁：`OK A-class: material 0; touched 0; total 180<=180`
- Task 2 静态门禁：`OK D34 deletions + 7 getTile + getOffsetPool cleaned`
- Task 2 eslint（5 文件）：0 错误
- Task 2 CRLF（5 文件）：`OK CRLF`
- Task 3 终验类型门禁：`OK final type gate: material 0; touched 0; total 180<=180`
- Task 3 终验静态门禁（D34 / D35 / D36 / D37 全量）：`OK final static gates D34 D35 D36 D37`
- Task 3 范围门禁（基线感知）：`OK scope (baseline-aware): out-of-scope extra 0`
- Task 3 并发改动基线门禁：`OK user concurrent edits unchanged entries 0`
- Task 3 eslint（9 文件）：0 错误
- Task 3 CRLF（9 源文件）：`OK CRLF source files`
- 提交后删除检查：`no deletions`
- Task 3 SUMMARY 完整性门禁：见文末自检

## 人工复核（Task 3 步骤 6，十一条）

1. **D-34 的 7 处调用逐条对位**：door `:36` / `:46`、hero `:239` / `:364` / `:428`、renderer `:1250`、vertex `:546` 均由 `getIfBigImage` 改为 `getTile`；「行为保持」论据现场复验成立（`setBigImage` 消费者调用点 0，见上）。**结论：通过**。
2. **`getOffsetPool` 删除后池来源**：现只剩常量 `32`（`const pool = new Set([32]);`）与 `imageStore.values()` 循环（经 `assetContainsTexture` 过滤），以及 DEV 告警与 `MAX_VERTEX_UNIFORM_VECTORS` 错误分支、`return [...pool]`；不再有 big-image 偏移。**结论：通过**。
3. **`MaterialManager` 五个 big-image 方法与三个字段全部删除、`setDefaultFrame` 本体与签名未变**：`git grep -i bigimage -- packages-user` 无输出；`setDefaultFrame(identifier, defaultFrame): void` 本体仅剩 `this.defaultFrames.set(identifier, defaultFrame);`。**结论：通过**。
4. **D-35 注入链逐环节对位**：`client.ts:84` 传 `this`（`ClientCore extends CoreState implements IClientCore`，`this` 即 `ICoreState`）→ `manager.ts` 构造器 `readonly state` → `manager.ts` `new AssetBuilder(this, state)` → `builder.ts` `new TrackedAssetData(materials, this, state)`；`client.ts:85` `new AutotileProcessor(this.materials, this)`；`renderer.ts:234` `new AutotileProcessor(manager, manager.state)`（取自注入的 `ITextureManager`，**未引入任何全局单例**，D-23）。**结论：通过**。
5. **`textures` 承担 store 与 Task 0 裁定一致**：为新建专用 `TextureStore`（建议默认 (a)）；SUMMARY 已明写「本次范围内无写入者」的事实。**结论：通过**。
6. **D-36 的 `cache.ts` 11 处命中逐条对位**：字段（`:36`）、`AutotileRenderable.bigImage`（`:48`）、对象字面量 `bigImage`（`:144` / `:215` / `:243` / `:276`）、解构（`:153`）、`enemys` 特判（`:155-158`）、`if (bigImage)` 分支（`:159-194`）、未使用 `enemys` 声明（`:127`）全部删除；行为影响（大图怪物落回后续分支）与「未经运行验证」已记录。**结论：通过**。
7. **D-37 声明就位、`pnpm-lock.yaml` 未动、未执行安装**：`package.json.dependencies['@user/data-state'] === 'workspace:*'`；`pnpm exec` 隐式同步的 lockfile 改动已 `git checkout --` 还原，交付树内 lockfile 与 HEAD 一致。**结论：通过**（见 Deviations 第 1 条）。
8. **D-33 范围核对**：`git show --stat HEAD` 恰含 10 个文件；无关诊断（加载系统 16 + 数据端测试 / 寻路 164）一条未动。**结论：通过**。
9. **D-28 保留**：`hero.ts` 的 `state.roleFace.getFaceOf` 计数 = 3，`import { state } from '@user/data-state';` 未动，`hero.ts:423` 的 `getFaceOf` 调用逐字保留。**结论：通过**。
10. **运行时 UAT 不可得的理由**：渲染端无测试设施（`client-modules` 无 `*.test.*`），本增量改动只在浏览器渲染流程可观察，本计划不启动渲染、不新增测试、不接线被注释的接线点。**结论：UAT 不可得，已如实声明，未伪造绿**。
11. **既有注释零改写（AGENTS.md；truth 第 7 条的可失败检查）**：对 10 个在范围文件逐 hunk 复核 `git show HEAD -- <10 个文件>`，每一处既有 jsDoc / 注释文本要么**原样保留**、要么**随其所属成员 / 代码块被整体删除**：
    - 整体删除的注释：`/** 大怪物数据 */`、`/** 大怪物贴图的标识符 */`、`/** 是否是大怪物 */`、`// 其他的都是 bigImage 了，直接遍历获取`、`// 怪物需要特殊处理，因为它的大怪物信息不在 maps 里面`（随其 `if` 块整体删除）——均属「删除成员 / 代码块连其注释整体删除」的预授权范围；
    - 未改写的注释（逐字保留）：`// 还有勇士图片`、`// 图块背景`、`// 地狱般的分支if`、`// 额外素材`、`/** 特判空图块与空气墙 */`、`// enemy48和npc48都应该视为大怪物`、`// 自动元件`、`vertex.ts` 的两行说明、`manager.ts` 各 store / 字段注释等。
    - 未发现任何既有注释文本被改写 / 重排 / 局部编辑。**结论：通过**。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 还原 pnpm 隐式同步的 `pnpm-lock.yaml`**
- **Found during:** Task 3（提交前 `git status` 检查）
- **Issue:** 修改 `client-base/package.json` 后，`pnpm exec eslint` / `pnpm exec vue-tsc` 触发 pnpm 的依赖校验，隐式向 `pnpm-lock.yaml` 的 `packages-user/client-base` importer 段写入了 `@user/data-state`（+3 行）。这违反 D-37「不修改 `pnpm-lock.yaml`」。
- **Fix:** 在所有基于 pnpm 的门禁跑完后，`git checkout -- pnpm-lock.yaml` 还原该文件；提交仅含 10 个在范围文件。用户已知悉 lockfile 未同步（`pnpm install --frozen-lockfile` 在用户自行同步前会失败）。
- **Files modified:** `pnpm-lock.yaml`（已还原，最终未变更）
- **Verification:** 提交后 `git status --porcelain` 仅含未跟踪的 SUMMARY；并发改动基线门禁 `entries 0`。
- **Committed in:** 未提交（还原后与 HEAD 一致）

**2. [Plan-literal] `hero.ts:428` 的换行被 prettier 收为单行**
- **Found during:** Task 2（eslint --fix）
- **Issue:** 计划 Task 2 (2e) 要求「保持现有换行形态，仅换成员名」。原 `getIfBigImage(nextFace.identifier)` 因超 80 列被 prettier 折行；改为更短的 `getTile(...)` 后整行 ≤ 80 列，prettier 依规将其并为单行。
- **Fix:** 依 dev.md「严格遵循 eslint 配置」与仓库 prettier 惯例，接受单行形态（此处为**代码**格式，不涉及任何注释文本）。
- **Files modified:** `packages-user/client-modules/src/render/map/extension/hero.ts`
- **Verification:** eslint 0 错误；语义（`moving.block.setTexture(tile)` 等后续用法）未变。
- **Committed in:** `78873d0`

**Deviation summary:** 2 项（1 项 Rule 3 阻塞还原、1 项 prettier 格式取舍）；影响面均在计划允许的范围内，未见范围蔓延。

## 未实现 / 显式延后项

- `textures` 的**写入侧**（让 loader / `addGrid` / `addTileset` / `addImage` 等填充统一 store）—— 属新引擎后续步骤（本次范围内该 store 无写入者）。
- `.planning/graphs/*` 重建（F-06）—— E 类只报告，待用户裁决。
- 其余渲染适配与移动端 / 桌面端双布局（REND-01 剩余部分 / REND-02）—— 本 run 不含。
- `core.*` legacy 适配（D-12，第五阶段）；移动控制（D-19）；跟随者位置 / 动画归属（D-22）；贴图 / 不透明度来源（D-18）；加载系统重构遗留 16 条诊断（D-33）。
- 本次未新增任何测试（渲染端无测试设施）。

## 需求状态

REND-01 / REND-02 在本 run 后仍保持 **Pending**：本计划只落地「material 接口适应实施（第二步）」一个子切片，未实施其余渲染适配与移动端 / 桌面端双布局（见 04-07-PLAN 的两条 FLAGGED ASSUMPTION）。

## 运行时 UAT 不可得声明

渲染端**无测试设施**，本增量的改动（构造器注入、材质取值改写、`cache.ts` 大图分支删除）只在浏览器渲染流程里可观察。本计划**不启动渲染、不新增测试、不接线任何被注释的接线点**，故运行时渲染 UAT **不可得**；本计划的实质验证 = scoped 类型门禁 + 静态门禁 + eslint / CRLF + 基线感知范围 / 并发基线门禁 + 人工代码复核。**「编译通过」不等于「运行时可用」**，未以任何不可运行的门禁冒充通过。

## Self-Check

- 10 个在范围文件已提交于 `78873d0`；SUMMARY 单独提交。
- material 归属诊断 0；在范围文件诊断 0；总行数 180 ≤ 180。
- 用户并发改动未被触碰（基线空集，完工后仍为空）。

---
*Phase: 04-render-adaptation*
*Completed: 2026-09-22*
