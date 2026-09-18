# Phase 4: 渲染适配与双布局 - Pattern Map

**Mapped:** 2026-09-18
**本次规划范围:** 仅 plan 04-01（第一步·只读对账），不规划后续适配/双布局实施
**Files analyzed:** 1 交付文档（新建）+ 50 个只读扫描目标（`client-base` 15 文件 / `client-modules` 81 文件，本次分类到组）
**Analogs found:** 1 / 1 交付文档有同仓库结构范式；扫描目标均有既有耦合/契约范式可照抄

> **性质声明（对齐 04-CONTEXT D-02 / D-09）：** plan 04-01 是**只读清点**，不写任何生产代码。本文件
> 中的「Analog」对交付文档是**结构范式**（从既有 `.planning` 审计/登记文档照抄章节骨架），
> 对扫描目标是**耦合判定范式**（每一类耦合给出可照抄的 `file:line` 锚点与判定口径）。
> 所有下列生产源码路径均已 `git ls-files` 验证为 **tracked source**（无 gitignored 镜像路径）。

---

## Scope Note（本 run 的边界）

| 项 | 值 |
|----|----|
| 被查对象（audit targets） | `packages-user/client-base/src/**`、`packages-user/client-modules/src/**`（D-03） |
| 接口基准（baseline，不作为被查对象） | `packages-user/data-common` / `data-base` / `data-system` / `data-state` 的 `types.ts`、`core.ts`、`ins.ts`（D-04） |
| 明确排除 | `packages` 全部、`entry-client`、`legacy-plugin-client`、`legacy-plugin-data`、`data-fallback`（D-03 / Deferred） |
| 交付物 | `.planning/phases/04-render-adaptation/04-RENDER-INTERFACE-AUDIT.md`（D-02） |
| 不产出 | 任何生产/测试代码改动；后续适配与双布局的计划不在此 run |

---

## File Classification

### A. 交付文档（新建，唯一写文件）

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `.planning/phases/04-render-adaptation/04-RENDER-INTERFACE-AUDIT.md` | audit / registry document | read-only inventory（分类登记：错配 / 数据端缺失 / 多余旧路径） | `.planning/phases/07-data-fixes/07-LOADSTATE-AUDIT.md`（只读审计骨架）+ `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md`（字段定义表 + 分节登记） | exact（结构） |

### B. 扫描目标组（只读，不修改）

| 组 | 代表文件 | Role | Data Flow | Closest Analog（既有耦合范式） | Match Quality |
|----|---------|------|-----------|-------------------------------|---------------|
| A1 渲染契约桥 | `client-base/src/types.ts`、`client-modules/src/types.ts` | contract / types | request-response（类型面） | 同文件既有 `extends ICoreState` / `extends IClientBase` | exact |
| A2 渲染组合根与单例 | `client-base/src/index.ts`、`client-modules/src/index.ts`、`client-modules/src/client.ts`、`client-modules/src/core.ts` | entry / composition-root | event-driven（`loading.once` 生命周期） | 同文件既有注册/继承/单例范式 | exact |
| A3 legacy 全局 `core.*` 读取 | `action/move.ts`、`render/ui/{main,statistics,viewmap,settings,save,toolbar,statusBar}.tsx`、`render/elements/{cache,misc}.ts`、`render/components/{choices,misc}.tsx`、`render/weather/presets/*`、`fallback/load.ts`、`render/utils/saves.ts` | component / adapter | request-response（读全局） | 同组既有 `core.<field>` 读取点（见下方锚点表） | exact（同类） |
| A4 新数据层接口调用 | `render/map/extension/hero.ts`、`render/ui/main.tsx`、`render/ui/statistics.tsx`、`render/index.tsx`、`render/use.ts` | component / hook-consumer | event-driven（`hook` / `state` / `loading`） | 同文件既有 `state` / `hook` / `loading` 用法 | exact |
| A5 数据端类型/契约直连 | `render/map/{renderer,moving,element,status,vertex,types}.ts`、`render/elements/props.ts`、`client-base/src/save/{system,types}.ts` | renderer / adapter | request-response（类型面） | 同组既有 `IGameMap` / `IMapLayer` / `ISaveableContent` import | role-match |
| A6 双布局既有资产 | `render/use.ts`（`Orientation` / `onOrientationChange`）、`shared.ts`（`MAIN_WIDTH` 等） | utility / config | event-driven（resize） | 同文件既有横竖屏判定范式 | exact |
| A7 加载/素材接线 | `client-base/src/load/{loader,data,types}.ts`、`client-base/src/material/**` | loader / manager | file-I/O（素材加载） | 同组既有 `core.material` / `IMotaDataLoader` 读取点 | role-match |

### C. 接口基准（只读，不登记为被查对象；D-04）

| File | Role | 用途 |
|------|------|------|
| `packages-user/data-common/src/types.ts` | contract L0 | `IDataCommon` 基准 |
| `packages-user/data-base/src/types.ts` | contract L1 | `IStateBase` 基准 |
| `packages-user/data-system/src/types.ts` | contract L2 | `IStateSystem` 基准 |
| `packages-user/data-state/src/types.ts` | contract L3 | `ICoreState` 基准 |
| `packages-user/data-state/src/core.ts` | assembly | 顶层装配 + `loadState` + legacy bridge 落点（`:54`,`:151`,`:292-307`） |
| `packages-user/data-state/src/ins.ts` | singleton | `state` 单例入口 |
| `packages-user/data-base/src/game.ts` | event bus | `hook`（`:155`）、`gameListener`（`:266-267`，`@deprecated`） |
| `packages-user/entry-data/src/mota.ts` | gate | `r()` / `rf()` 渲染调用门控（`:125-136`） |

---

## Pattern Assignments

### 1. `04-RENDER-INTERFACE-AUDIT.md`（交付文档，audit / read-only inventory）

**结构主 Analog:** `.planning/phases/07-data-fixes/07-LOADSTATE-AUDIT.md`
**字段定义 Analog:** `.planning/phases/06-unit-tests/06-TEST-FINDINGS.md`
**分类/排除口径 Analog:** `.planning/phases/06-unit-tests/06-SAVE-EXCLUSIONS.md`
**接口契约引用 Analog:** `.planning/phases/02-pathfinding/02-INTERFACE-DRAFT.md`

**章节骨架（照抄 `07-LOADSTATE-AUDIT.md` 的 7 段式，逐段对应）：**

```markdown
# 渲染端 ↔ 数据端接口对账审计            ← Analog: 07-LOADSTATE-AUDIT.md:1

**日期:** 2026-09-18                        ← Analog: :3
**范围:** packages-user/client-base + client-modules（被查）
          data-* 作为接口基准（D-04）        ← Analog: :4
**性质:** 只读清点，未修改任何代码           ← Analog: :5
**接口基准:** 各包 types.ts / core.ts / ins.ts ← Analog: :6（种子缺陷位 → 基准源位）

## 背景                                    ← Analog: :8-10
## 方法                                    ← Analog: :12-14（枚举扫描面 + 判定口径）
## 发现                                    ← Analog: :16-27（表格，见下方字段表）
## 触发序列（举例）                          ← Analog: :29-35（错配的调用→旧形状解读链）
## 判定为「匹配」的同类边界                   ← Analog: :37-46（哪些读取点确认走的是新接口）
## 未能从阅读确定（未猜测）                   ← Analog: :48-53（诚实边界，不臆断）
## 处置                                    ← Analog: :55-58（后续处理归属）
```

**发现表字段（对齐 04-CONTEXT D-06 / D-07，锚定 `07-LOADSTATE-AUDIT.md:18-27` 与 `06-TEST-FINDINGS.md:9-18`）：**

```markdown
| ID | 接口名 | 所属文件:行 | 分类 | 问题描述 | 影响 | 置信 | 依据 |
|----|--------|-------------|------|----------|------|------|------|
```

- `分类` 取值固定三选一：**① 错配** / **② 数据端缺失** / **③ 多余旧路径**（D-06）。
- **② 数据端缺失** 必须**独立成节**（D-08），不混入发现表主节；该节结构照抄
  `06-COVERAGE-GAPS.md` 的逐条 `### G-xx：标题（严重度）→ 现状 / 期望` 写法（`:10-13`）。
- **接口基准引用** 照抄 `02-INTERFACE-DRAFT.md` 顶部「接口事实源：… 为准」块（`:3-5`）与
  `07-LOADSTATE-AUDIT.md:14` 的「枚举所有实现 → 判定持有者 → 检查覆盖」方法段。
- 每条记录**必须**含 `file:line` 锚点（D-07）；`判定为「匹配」的同类边界` 段防止把
  「已走新接口」误报为错配（照抄 `07-LOADSTATE-AUDIT.md:37-46` 的「安全边界」写法）。
- `未能从阅读确定（未猜测）` 段为**强制段**：对无法从静态阅读下结论的调用链，只登记
  不确定项，不写成缺陷（照抄 `07-LOADSTATE-AUDIT.md:48-53`）。

### 2. 组 A1 — 渲染契约桥（exact）

**Analog:** 同文件既有继承链。

`packages-user/client-base/src/types.ts:1-27` — 渲染系统层契约**直接 extends 数据端 L3 契约**（这是 REND-01 的桥头）：
```ts
import { ICoreState } from '@user/data-state';
// ...
export interface IClientBase extends ICoreState {
    /** 存档系统 */
    readonly save: ISaveSystem;
    // ...
}
export interface IClientBaseExtended {
    /** 当前对象的渲染端基本层对象（Layer 4 对象） */
    readonly state: IClientBase;
}
```

`packages-user/client-modules/src/types.ts:1-20` — 实现层契约 extends 系统层契约；对账时逐字段比对 `ICoreState` 是否新增/改名。

### 3. 组 A2 — 组合根 / 单例（exact）

**Analog:** 同文件既有注册范式。

`packages-user/client-modules/src/index.ts:1-11` — 生命周期入口，`loading.once('coreInit')` 是数据→渲染的既有启动门：
```ts
import { loading } from '@user/data-base';
import { patchAll } from './fallback';
import { createGameRenderer, createRender } from './render';

export function create() {
    patchAll();
    createRender();
    loading.once('coreInit', () => {
        createGameRenderer();
    });
}
```

`packages-user/client-modules/src/client.ts:46` — `export class ClientCore extends CoreState implements IClientCore {`：
渲染组合根**继承数据端 `CoreState`**，故所有 `this.<state>` 读取都在对账面内；`:71` 的 `core.firstData.name` 是全局读取点。

`packages-user/client-modules/src/core.ts:1-6` — 单例 + 既有重构 TODO（对账时记录为「已知待重构面」，不作为新缺陷）：
```ts
// TODO: 逐渐弱化 ClientCore 的单例概念，每个接口都通过参数传入 IClientCore 对象

/** 客户端实例 */
export const client = new ClientCore();
```

`packages-user/client-base/src/index.ts:1-11` — 系统层 barrel；`create()` 仅 `createMaterial()`。

### 4. 组 A3 — legacy 全局 `core.*` 读取（③ 多余旧路径的主证据面）

**Analog:** 同组既有 `core.<field>` 读取点。**扫描锚点（已核实行号）：**

| 文件:行 | 读取面 | 对应数据端新接口候选（基准） |
|---------|--------|------------------------------|
| `action/move.ts:66-67,97,123,156` | `core.isReplaying()` / `core.isPlaying()` / `core.waitHeroToStop()` / `core.status.lockControl` | `ICoreState` 状态查询 |
| `render/ui/main.tsx:99,103,113-128,139,155,165` | `core.status.*` / `core.getNextLvUpNeed()` / `core.itemCount()` / `core.getLvName()` | `ICoreState` + `IStateSystem` |
| `render/ui/statistics.tsx:144,158,174,215,217,225,240,248,250` | `core.status.hero` / `core.status.maps` / `window.flags` | `IStateBase` / `IHeroState` |
| `render/ui/viewmap.tsx:54,74,361-362,566` | `core.status.floorId` / `core.status.maps` / `core.status.thisMap` | `IMapState` |
| `render/ui/settings.tsx:165,168,224-230,299,317,504,522` | `core.status.route/hard` / `core.startGame()` / `core.firstData` / `core.formatDate2()` / `core.encodeRoute()` | replay / lifecycle |
| `render/ui/save.tsx:111` | `core.maps.loadMap()` | `IMapState` 加载 |
| `render/ui/toolbar.tsx:198` | `core.isPlaying()` / `core.isMoving()` / `core.status.lockControl` | `ICoreState` |
| `render/ui/statusBar.tsx:158` | `core.flags.statusBarItems` | `IFlagSystem` |
| `render/components/choices.tsx:675,715,718-719,733,770-774,789` | `core.status.replay.toReplay` / `core.status.route.push()` | replay 命令接口 |
| `render/components/misc.tsx:312` | `core.material.images.images[...]` | 渲染侧素材（非数据端） |
| `render/elements/cache.ts:11,90,92,160,197,250,442,518` | `core.material.images.*` | 渲染侧素材（非数据端） |
| `render/elements/misc.ts:221,228` | `core.material.images.images[...]` | 渲染侧素材 |
| `render/weather/presets/{cloud,fog,sun}.ts` | `core.material.images.images[...]` | 渲染侧素材 |
| `fallback/load.ts:44,55-56,59` | `core.maps.blocksInfo` / `core.icons.icons` / `core.material.images` | `IMapState` / 素材 |
| `render/utils/saves.ts:27-28,44-45,103` | `core.firstData.*` | 配置读取 |
| `client-base/src/load/loader.ts:103,129,151,167,188,284,418` | `core.material.images.*` / `core.materials` | 渲染侧素材 |

**判定口径（照抄 `07-LOADSTATE-AUDIT.md:14` 的方法段）：** 每条 `core.*` 读取先判定其读的是
**数据端状态**（→ 记为 ③ 多余旧路径或 ① 错配）还是**纯渲染侧素材/全局**（→ 判为「匹配」的
同类边界，见 `core.material` 族）。**不得**因出现 `core.` 就一律登记（04-CONTEXT D-06 / the agent's Discretion）。

**关键辅证:** `packages-user/client-modules/src/action/move.ts:1-6` — 数据端 import 已带既有重构标记：
```ts
import { KeyCode } from '@motajs/client-base';
import { Hotkey, HotkeyData } from '@motajs/system';
// @ts-expect-error 需要重构
import { HeroMover, IMoveController } from '@user/data-state';
```

### 5. 组 A4 — 新数据层接口调用（对照面，用于判定「已走新接口」）

**Analog:** 同文件既有 `state` / `hook` / `loading` 用法。

`packages-user/client-modules/src/render/ui/main.tsx:28-30` — 新接口与 legacy 全局**同文件并存**（对账的典型错配/过渡样本）：
```tsx
// @ts-expect-error 需要重构
import { getHeroStatusOn, state } from '@user/data-state';
import { hook } from '@user/data-base';
```
同文件 `:100-101` 已用新接口 `client.flags.getFieldValueDefaults(...)`，而 `:99-128` 仍读 legacy `core.status.*` / `core.isReplaying()`。

`packages-user/client-modules/src/render/map/extension/hero.ts:1-21` — 数据端 import 多个 `@ts-expect-error 需要重构` + 新接口 `state`：
```ts
import {
    degradeFace,
    FaceDirection,
    getFaceMovement,
    // @ts-expect-error 需要重构
    HeroAnimateDirection,
    // @ts-expect-error 需要重构
    IHeroMoveController,
    // @ts-expect-error 需要重构
    IHeroMoveControllerHooks,
    nextFaceDirection
} from '@user/data-common';
import { IMapLayer } from '@user/data-base';
// ...
import { state } from '@user/data-state';
```

`packages-user/client-modules/src/render/index.tsx:4,37-40` — 数据端事件订阅范式：
```ts
import { hook } from '@user/data-base';
// ...
hook.on('restart', () => {
    sceneController.closeAll();
    sceneController.open(GameTitleUI, {});
});
```

**数据端基准侧（只读，确认 hook/门控定义）：**
- `packages-user/data-base/src/game.ts:155` — `export const hook = new EventEmitter<GameEvent>();`
- `packages-user/data-base/src/game.ts:166` — `class GameListener extends EventEmitter<ListenerEvent>`；`:266-267` `/** @deprecated */ export const gameListener = new GameListener();`
- `packages-user/entry-data/src/mota.ts:125-136` — `rf()` 在 `main.replayChecking || main.mode === 'editor'` 时返回 `empty`（渲染端被调用门控）。
- `packages-user/data-state/src/ins.ts:1-10` — `state` 单例，jsDoc 明确「仅服务于渲染…此对象是数据端状态」。

### 6. 组 A5 — 数据端类型直连（role-match）

**Analog:** 同组既有 import。

`packages-user/client-modules/src/render/map/renderer.ts:33`：
```ts
import { IGameMap, IGameMapHooks, IMapLayer } from '@user/data-base';
```
同族：`render/map/types.ts:13`、`render/map/moving.ts:5`、`render/map/element.ts:2`、`render/map/status.ts:1`、`render/map/vertex.ts:1`、`render/elements/props.ts:3`。对账时比对这些 `IGameMap`/`IMapLayer` 成员是否与数据端 `types.ts` 现行签名一致。

**数据端基准侧（只读）：** `data-base/src/types.ts`（`IStateBase`）、`data-system/src/types.ts`、`data-state/src/types.ts`（`ICoreState`）。

### 7. 组 A6 — 双布局既有资产（后续步骤参考，本 run 不实施）

**Analog:** 同文件既有横竖屏判定。

`packages-user/client-modules/src/render/use.ts:22-52` — 横竖屏枚举 + resize 监听已存在：
```ts
export const enum Orientation {
    /** 横屏 */
    Landscape,
    /** 竖屏 */
    Portrait
}
export type OrientationHook = (orientation: Orientation, width: number, height: number) => void;
// ...
window.addEventListener('resize', checkOrientation);
export function onOrientationChange(hook: OrientationHook) { /* ... */ }
```
`packages-user/client-modules/src/shared.ts:33-97` — `MAP_BLOCK_WIDTH` / `STATUS_BAR_WIDTH` / `MAIN_WIDTH` 等布局常量（固定 13×13 + 单一状态栏，无双布局分支）。
> **本 run 仅需在审计文档中登记该资产为「后续双布局起点」，不展开实施**（Deferred 明确）。

---

## Shared Patterns

### 分类口径（① 错配 / ② 数据端缺失 / ③ 多余旧路径）
**Source:** `07-LOADSTATE-AUDIT.md:18-27`（表格分类列）+ `04-CONTEXT D-06`
**Apply to:** 发现表每一条记录。
- 一条记录只归一类；跨类则拆条。
- 「数据端缺失接口」独立成节（D-08），结构照抄 `06-COVERAGE-GAPS.md:10-13` 的 `现状 / 期望` 两段式。
- 「影响」字段写法按 the agent's Discretion 把握，但**不得据此扩大范围**（D-03/D-04）。

### 证据纪律（file:line，不臆断）
**Source:** `07-LOADSTATE-AUDIT.md:12-14`（方法）与 `:48-53`（未能确定段）
**Apply to:** 全部记录与「未确定」段。
- 每条含 `接口名 + 所属文件:行 + 描述 + 影响`（D-07）。
- 静态阅读无法定论的调用链一律进「未能从阅读确定（未猜测）」，**不得**写成缺陷。
- 对账以**接口签名**为准，不受用户并行修改数据端实现影响（D-05）；只引用 `types.ts`/`core.ts`/`ins.ts` 等契约面。

### 只读约束
**Source:** `04-CONTEXT D-02 / D-09`
**Apply to:** 全部任务。
- 允许派子代理只读扫描，**禁止修改任何文件**（D-09）。
- 本 run 唯一允许写出的文件是 `04-RENDER-INTERFACE-AUDIT.md`。

### 既有重构标记的处置口径
**Source:** `action/move.ts:3`、`render/map/extension/hero.ts:5,7,9`、`render/ui/main.tsx:28`（`// @ts-expect-error 需要重构`）
**Apply to:** 所有带该标记的 import。
- 该标记是**既有已知待重构面**，应作为错配/旧路径的**强线索**列出，但需与数据端 `types.ts` 实签核对后定性；不得仅凭标记直接判为缺陷。

---

## No Analog Found

| 对象 | Role | Data Flow | Reason |
|------|------|-----------|--------|
| 审计文档的「② 数据端缺失接口」**内容节** | registry | inventory | 仓内无「渲染端需要而数据端未提供」的既有登记文档；仅可借 `06-COVERAGE-GAPS.md` 的条目骨架，内容须由实际扫描产出 |
| 审计文档的「双布局能力缺口」视角 | inventory | inventory | 无既有文档；本 run 不展开（Deferred） |

> 其余 50 个扫描目标均有既有耦合/契约范式，无「无 analog」项。

---

## Metadata

**Analog search scope:** `.planning/phases/*/`（审计/登记/契约文档）、`packages-user/client-base/src/`、`packages-user/client-modules/src/`、`packages-user/data-{common,base,system,state}/src/`、`packages-user/entry-data/src/`、`dev.md`、`.planning/codebase/`、`.planning/ROADMAP.md`
**Files scanned:** 交付文档 4 个结构 analog + 扫描目标 96 文件（client-base 15 / client-modules 81）+ 数据端基准 8 文件
**Tracked-source 校验:** 全部引用生产路径经 `git ls-files` 验证为 tracked（无 gitignored 镜像路径）
**Pattern extraction date:** 2026-09-18
