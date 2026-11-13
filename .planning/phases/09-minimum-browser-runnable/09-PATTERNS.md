# Phase 9: 最小浏览器可运行版本 - Pattern Map

**Mapped:** 2026-10-09
**规划范围:** 仅任务 1（UI 接口适配，D-10..D-14）；不含 Phase 9 其余内容、不含 `@motajs/legacy-ui` 移植（D-14）
**Files analyzed:** 10 个 UI 实现文件（迁移 + 对齐）+ 4 个接线/barrel 修改点 + 1 个新建响应式对象 + 1 个待删目录
**Analogs found:** 全部有既有范式；唯一「无直接 analog」项 = D-12 的 `IHeroAttr` 响应式对象（仅可借 `main.tsx` 内联写法）

> **性质声明：** 本文件是 pattern map（只读产出），不修改任何生产代码；唯一写文件是本 `09-PATTERNS.md`。
> 所有生产路径均经 `git ls-files` 验证为 tracked source（`render/ui/**` 11 文件 + `src/ui/**` 6 文件均 tracked，无 gitignored 镜像路径）。
> **命名纪律（AGENTS.md）：** 本文件出现的任何新公共/受保护/私有命名（尤其 D-12 的响应式对象名）均标注「命名待用户批准」，不得据此拍板。

---

## Scope Note（本 run 的边界）

| 项 | 值 |
|----|----|
| 当前规划单元 | 任务 1「UI 接口适配」（CONTEXT `## 任务 1`，D-10..D-14） |
| 迁移源 | `packages-user/client-modules/src/render/ui/**`（11 文件，全 tracked） |
| 迁移目标 | `packages-user/client-modules/src/ui/`（已存在 6 文件：`background.tsx` / `func.ts` / `index.ts` / `load.tsx` / `title.tsx` / `types.ts`，部分迁移先行） |
| 接口基准（只读） | `packages-user/client-base/src/types.ts`（`IClientBase` / `IGameUIPropsBase`）、`packages-user/data-{base,state}/src/types.ts`（`IStateBase` / `ICoreState`）、`packages/system/src/ui/**`（新 UI 系统） |
| 明确排除 | 任何 UI 形态/视觉改动、`@motajs/legacy-ui` 移植、flags 更新监听（D-13 仅标 TODO）、D-08 拆分剩余内容（属后续任务） |
| 交付物 | 本 `09-PATTERNS.md` |

---

## File Classification

### A. 迁移并接口对齐的 UI 实现（D-10 + D-11）

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages-user/client-modules/src/ui/main.tsx` ← `render/ui/main.tsx` | component | request-response（读状态 + 渲染） | `src/ui/title.tsx`（已迁移，`props.state` 读法） | exact（同目录同角色） |
| `packages-user/client-modules/src/ui/controller.tsx` ← `render/ui/controller.tsx` | controller/component | request-response | `src/ui/background.tsx`（已迁移，`GameUI` + `props`） | role-match |
| `packages-user/client-modules/src/ui/save.tsx` ← `render/ui/save.tsx` | component | request-response | `src/ui/load.tsx`（已迁移） | role-match |
| `packages-user/client-modules/src/ui/settings.tsx` ← `render/ui/settings.tsx` | component | request-response | `src/ui/title.tsx`（已迁移） | role-match |
| `packages-user/client-modules/src/ui/statistics.tsx` ← `render/ui/statistics.tsx` | component | transform（统计聚合） | `src/ui/load.tsx`（已迁移） | role-match |
| `packages-user/client-modules/src/ui/statusBar.tsx` ← `render/ui/statusBar.tsx` | component | request-response | `src/ui/title.tsx`（已迁移，`props.state.materials`） | exact（同 `client`→`props.state` 读点） |
| `packages-user/client-modules/src/ui/toolbar.tsx` ← `render/ui/toolbar.tsx` | component | request-response | `src/ui/title.tsx`（已迁移，`props.state.materials`） | exact（同 `client`→`props.state` 读点） |
| `packages-user/client-modules/src/ui/viewmap.tsx` ← `render/ui/viewmap.tsx` | component | request-response | `src/ui/load.tsx`（已迁移） | role-match |
| `packages-user/client-modules/src/ui/load.tsx`（已存在，需补齐 props 类型） | component | file-I/O（加载进度迭代） | 自身旧版 `render/ui/load.tsx` + 新系统 `packages/system/src/ui` | exact |
| `packages-user/client-modules/src/ui/title.tsx`（已存在，需补齐 import + `client`→`props.state`） | component | request-response | 自身旧版 `render/ui/title.tsx` | exact |

### B. 接线 / barrel 修改点

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `packages-user/client-modules/src/ui/index.ts` | barrel / wiring（`createUI`） | request-response | `render/ui/index.ts`（旧 barrel）+ `render/index.tsx:29-36`（旧 `createRender`） | role-match |
| `packages-user/client-modules/src/ui/types.ts` | contract / types | — | 自身既有 `IUIPropsBase` | exact |
| `packages-user/client-modules/src/ui/func.ts` | factory | request-response | `packages/system/src/ui/container.tsx`（props creator 消费端） | role-match |
| `packages-user/client-modules/src/ui/background.tsx` | component | request-response | 自身既有 + `render/ui/controller.tsx`（`MainBackgroundProps` 源） | role-match |
| `packages-user/client-modules/src/render/index.tsx` | composition root | event-driven | 自身既有 | exact |
| `packages-user/client-modules/src/client.ts` | composition root | event-driven | 自身既有 | exact |
| `packages-user/client-modules/src/render/action.ts` | wiring（hotkey → UI） | event-driven | 自身既有 | exact |

### C. 新建文件（D-12，命名待批准）

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `packages-user/client-modules/src/ui/<hero-attr>.ts`（文件名与 `IHeroAttr` 名**待用户批准**） | hook / composable | event-driven（`addHook` 监听） | `render/ui/main.tsx:66-90,141-150`（内联 `reactive` + `attribute.addHook` + `onUnmounted` 卸载） | no-exact（仓内无独立响应式属性包装先例） |

### D. 待删除（迁移后残留）

| File | 说明 |
|------|------|
| `packages-user/client-modules/src/render/ui/index.ts` | 旧 barrel；能力由 `src/ui/index.ts` 承接 |
| `packages-user/client-modules/src/render/ui/main.tsx` | 能力由 `src/ui/main.tsx` 承接 |
| `packages-user/client-modules/src/render/ui/controller.tsx` | 能力由 `src/ui/controller.tsx` + `src/ui/background.tsx` 承接 |
| `packages-user/client-modules/src/render/ui/load.tsx` | 能力由 `src/ui/load.tsx` 承接（已迁移） |
| `packages-user/client-modules/src/render/ui/save.tsx` | 能力由 `src/ui/save.tsx` 承接 |
| `packages-user/client-modules/src/render/ui/settings.tsx` | 能力由 `src/ui/settings.tsx` 承接 |
| `packages-user/client-modules/src/render/ui/statistics.tsx` | 能力由 `src/ui/statistics.tsx` 承接 |
| `packages-user/client-modules/src/render/ui/statusBar.tsx` | 能力由 `src/ui/statusBar.tsx` 承接 |
| `packages-user/client-modules/src/render/ui/title.tsx` | 能力由 `src/ui/title.tsx` 承接（已迁移） |
| `packages-user/client-modules/src/render/ui/toolbar.tsx` | 能力由 `src/ui/toolbar.tsx` 承接 |
| `packages-user/client-modules/src/render/ui/viewmap.tsx` | 能力由 `src/ui/viewmap.tsx` 承接 |

---

## Pattern Assignments

### 1. 目标 props 机制（所有 UI 组件的公共骨架）

**Analog:** `packages-user/client-modules/src/ui/title.tsx:60-64`（已迁移的「经 props 获取主对象」范本）
**机制源（只读基准）:**
- `packages-user/client-base/src/types.ts:15-19` — `IGameUIPropsBase extends IUIDefaultPropsBase<T>` 携带 `readonly state: IClientBase`。
- `packages-user/client-modules/src/ui/func.ts:13-26` — `createUIPropsBase(state)` 返回 creator，产出 `{ instance, controller, state }`。
- `packages-user/client-modules/src/ui/types.ts:1-5` — 本地 `IUIPropsBase extends IUIDefaultPropsBase, IClientBaseExtended`（与 `IGameUIPropsBase` 同构）。
- `packages-user/client-modules/src/client.ts:128-130` — `sceneController` / `mainUIController` 各自 `setPropsBaseCreator(createUIPropsBase(this))`。
- `packages/system/src/ui/container.tsx:32-43` — 容器渲染时对每个实例调 `data.createPropsBase(v)` 并 `{...pb}` 展开到组件 props。

**Props 声明 + state 获取范式（照抄 `src/ui/title.tsx:60-68`）：**
```tsx
export interface GameTitleProps extends DefaultProps, IUIDefaultPropsBase {}

const gameTitleProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<GameTitleProps>;

export const GameTitle = defineComponent<GameTitleProps>(props => {
    const materials = props.state.materials;   // ← 主对象经 props 获取，非 client 单例
    // ...
});
```

**加载组件同款（`src/ui/load.tsx:25-32`）：**
```tsx
export interface ILoadProps extends IUIDefaultPropsBase, DefaultProps {}

const loadSceneProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<ILoadProps>;

export const LoadScene = defineComponent<ILoadProps>(props => {
    const loader = props.state.loader;   // ← 旧 client.loader → props.state.loader
```

> **WIP 修正点（planner 须处理）：** `src/ui/load.tsx:23` 现 `import { IUIDefaultPropsBase } from './types';`，但 `src/ui/types.ts` 只导出 `IUIPropsBase`（未导出 `IUIDefaultPropsBase`）⇒ 类型断链。目标写法应统一为 `props` 泛型 `extends IUIPropsBase`（本地）或 `IGameUIPropsBase`（`@user/client-base`），二选一后所有组件共用（见「Shared Patterns / Props 基类型统一」）。

---

### 2. `src/ui/main.tsx`（component, request-response）

**Analog:** `src/ui/title.tsx`（已迁移读法）+ 自身旧版 `render/ui/main.tsx`

**旧 import（`render/ui/main.tsx:1-33`，须改写）：**
```tsx
import { ReplayingStatus } from './toolbar';
import { state } from '@user/data-state';          // ← data-state 单例
import { mainUIController } from './controller';   // ← 模块级单例
import { using } from '../renderer';               // ← 模块级单例
import { client } from '../../core';               // ← client 单例（本次要消除）
```

**Old → New 映射（本文件全部 `client` 读点）：**

| 旧（`client.*` / 单例） | 旧位置 | 新（`props.state.*`，`IClientBase`） | 证据（新接口定义） |
|---|---|---|---|
| `client.mainMapRenderer` | `main.tsx:35` | `props.state.mainMapRenderer` | `client-base/src/types.ts:39` |
| `client.mainMapExtension` | `main.tsx:35` | `props.state.mainMapExtension` | `client-base/src/types.ts:43` |
| `client.flags` | `main.tsx:98` | `props.state.flags` | `data-base/src/types.ts:27` |
| `client.hero.attribute.getFinalAttribute(...)` | `main.tsx:102-110`（9 处） | `props.state.hero.attribute.getFinalAttribute(...)` | `data-base/src/hero/types.ts:921,928` + `:117` |
| `client.hero.attribute.addHook({ onUpdateAttribute })` | `main.tsx:141` | `props.state.hero.attribute.addHook({ onUpdateAttribute })` | `data-base/src/hero/types.ts:104-105`（`IReadonlyHeroAttribute extends IHookable`） |
| `state`（`@user/data-state` 单例） | `main.tsx:28,248` | `props.state`（同一 `IClientBase`，`extends ICoreState`） | `data-state/src/types.ts:26`；`client-base/src/types.ts:21` |
| `using`（模块级单例） | `main.tsx:31,155` | `props.state.using` | `client-base/src/types.ts:45` |
| `mainUIController`（模块级单例） | `main.tsx:29,281,284` | `props.state.mainUIController`（**切换与否待用户裁定**，见 Shared Patterns / 单例归属） | `client-base/src/types.ts:49` |

**生命周期/清理范式（`main.tsx:141-150`，新对象须照此卸载）：**
```tsx
const attributeHook = client.hero.attribute.addHook({
    onUpdateAttribute: () => {
        updateStatus();
        updateDataFallback();
    }
});

onUnmounted(() => {
    attributeHook.unload();
});
```
> 新版本将 `client.hero.attribute` 换为 `props.state.hero.attribute`；`addHook` 返回 `IHookController`（`.unload()` 契约源于 `@motajs/common` Hookable）。

**`map-render` 读点（`main.tsx:246-252`，注意既有 Phase 4 错配 M-08）：**
```tsx
<map-render
    renderer={mainMapRenderer}
    // @ts-expect-error 需要重构
    layerState={state.maps}   // ← state 单例；目标 props.state.maps
    extension={mainMapExtension}
    loc={[0, 0, MAP_WIDTH, MAP_HEIGHT]}
/>
```
> `state.maps` 为 `IMapState` 而 `layerState` 要求单层 `IGameMap`（Phase 4 04-RENDER-INTERFACE-AUDIT `#04-01-M-08` 已登记）。本任务只做单例→props 替换，**不解决该形状错配**（D-14 纯适配）；保持 `@ts-expect-error` 原样，勿擅自扩范围。

**flags TODO 标记点（D-13）：** `main.tsx:98-99`（`flags.getFieldValueDefaults('hideStatusBar', false)`）、`:119-121`（poison/weak/curse）、`:132`（hard）在替换为 `props.state.flags` 后，因 flags 尚无监听系统，更新不处理，须就近加 `// TODO:`（格式遵循 `dev.md:78`）。

---

### 3. `src/ui/title.tsx`（component, request-response）

**Analog:** 自身（已迁移）+ 旧版 `render/ui/title.tsx`；`client` 读点见 `render/ui/title.tsx:67`。

**已迁移读法（`src/ui/title.tsx:1-38,66-68` 状态）：**
```tsx
import { ExitFullscreen, Fullscreen, SoundVolume } from '@user/client-base';
import { mainSetting, triggerFullscreen } from '@motajs/legacy-ui';   // ← legacy，超出本任务范围
import { saveLoad } from './save';                                     // ← 待迁移 save 模块
import { MainSceneUI } from './main';                                  // ← 待迁移 main 模块
import { adjustCover } from '@user/client-base';
// ...
export const GameTitle = defineComponent<GameTitleProps>(props => {
    const materials = props.state.materials;   // ← client.materials → props.state.materials
```
**必改点：**
- `render/ui/title.tsx:38` `import { client } from '../../core';` → 删除，改 `props.state.materials`（`:67`）。
- `src/ui/title.tsx:38` 现有 `import { IUIDefaultPropsBase } from './types';` 应为 `IUIPropsBase`（与 `load.tsx` 同类 WIP 类型断链）。
- `@motajs/legacy-ui`（`mainSetting` / `triggerFullscreen`，`src/ui/title.tsx:32`）为 legacy，**只报告不改**（D-14）。

---

### 4. `src/ui/statusBar.tsx` / `src/ui/toolbar.tsx`（component, request-response）

**Analog:** `src/ui/title.tsx`（`props.state.materials` 读法）

**`client.materials` 读点（须改写）：**

| 文件:行 | 旧 | 新 |
|---|---|---|
| `render/ui/statusBar.tsx:15,119` | `import { client } from '../../core';` + `client.materials` | 删除 import，`props.state.materials` |
| `render/ui/toolbar.tsx:28,77,175` | `import { client } from '../../core';` + `client.materials`（两处） | 删除 import，`props.state.materials` |

**注意（toolbar）：** `PlayingToolbar` / `ReplayingToolbar` 现声明为 `defineComponent<ToolbarProps>`（`render/ui/toolbar.tsx:72-76,172-173`），`ToolbarProps` 不含 `state`。要取 `props.state`，须把 props 泛型扩为携带主对象的基类型（见 Scripts / Props 基类型统一），并加 `'state'` 到 `props` 数组。此改动**属接口对齐，不属 UI 形态改动**（D-14）。
`statusBar.tsx` 内 `RightStatusBar` / `LeftStatusBar` 的 `StatusBarProps<T>` 同理需挂载主对象基类型。
`toolbar.tsx` 内 `mainUIController` 单例（`:23,94,97,115,120,126,195`）与 `render/action.ts` 的 `mainUIController` 单例归属：见 Shared Patterns / 单例归属（待用户裁定）。

---

### 5. `src/ui/settings.tsx`（component, request-response）

**Analog:** `src/ui/title.tsx`

**`client.flags` 读点（须改写）：**

| 文件:行 | 旧 | 新 |
|---|---|---|
| `render/ui/settings.tsx:28,166,221` | `import { client } from '../../core';` + `const flags = client.flags;`（两处） | 删除 import，`props.state.flags` |

**legacy（只报告，不改）：** `mainUi`（`@motajs/legacy-ui`，`render/ui/settings.tsx:17`）、`getVitualKeyOnce`（`:19`）。**flags TODO（D-13）：** `settings.tsx:166-167` / `:221-222` 用 `flags.getFieldValue('__seed__')`，替换来源后加 `// TODO:` 注明 flags 更新未接（无监听系统）。

---

### 6. `src/ui/save.tsx` / `src/ui/statistics.tsx` / `src/ui/viewmap.tsx` / `src/ui/controller.tsx`（无 `client` 读点，纯迁移）

**Analog:** `src/ui/load.tsx`（已迁移文件的骨架）

- `render/ui/save.tsx`：**无 `client` 引用**（`git grep` 零命中）；纯路径移动 + `import` 相对路径调整（`'../../shared'` → `'../shared'`，`'../use'` / `'../utils'` / `'../render'` 视目标层级调整）。
- `render/ui/statistics.tsx`：无 `client`；含 legacy `ItemState`（`@user/data-state`，`render/ui/statistics.tsx:11` + `@ts-expect-error`）+ 大量 `core.*`；本任务只迁移路径，**legacy 只报告不改**。
- `render/ui/viewmap.tsx`：无 `client`；含 `core.*` legacy（只报告）。
- `render/ui/controller.tsx`：`mainUIController` 单例 + `MainBackground` + `MainBackgroundUI` + `createMainController()`（`:11,20-33`）。`src/ui/background.tsx:3` 现 `import { MainBackgroundProps } from '../render';` —— 该类型定义在 **旧** `render/ui/controller.tsx:13-14`，迁移后须改指新 `./controller`（或把 `MainBackgroundProps` 落在新 controller / types）。这是**必处理的 import 断链**。

---

### 7. 新建 `IHeroAttr` 响应式对象（D-12，命名待批准）

**Analog（仅内联范式，无独立先例）:** `render/ui/main.tsx:66-90`（`reactive` 状态对象）+ `:141-150`（`attribute.addHook` + `onUnmounted` 卸载）

**内联参照（`render/ui/main.tsx:66-90` 摘选）：**
```tsx
const leftStatus: ILeftHeroStatus = reactive({
    hp: 0, hpmax: 0, mana: 0, manamax: 0,
    atk: 0, def: 0, mdef: 0, money: 0, exp: 0,
    // ...
});
```
**监听参照（`render/ui/main.tsx:141-150`）：**
```tsx
const attributeHook = props.state.hero.attribute.addHook({
    onUpdateAttribute: () => { /* 同步 reactive 属性值 */ }
});
onUnmounted(() => attributeHook.unload());
```
**新接口证据（只读基准）：**
- `packages-user/data-base/src/hero/types.ts:95-102` — `IHeroAttributeHooks.onUpdateAttribute(name, value)`。
- `packages-user/data-base/src/hero/types.ts:104-117` — `IReadonlyHeroAttribute extends IHookable<...>`，含 `getFinalAttribute(name)`。
- `packages-user/data-base/src/hero/types.ts:921-928` — `IHeroState.attribute: IReadonlyHeroAttribute<THero>`。

**约束（D-12 + AGENTS.md）：**
- 命名（文件名、接口名、类名，含 `IHeroAttr` 是否沿用）**必须先向用户反馈并获批**后使用；注意与既有 `IHeroAttr`（`@user/data-common` 的**属性数据字典类型**，见 `data-base/src/types.ts:8,21` 泛型参数）及 `IHeroAttribute` 一族区分——**不得**复用/覆写既有 `IHeroAttr` 语义。
- 该类须遵循 `dev.md:100`「类必须先 `interface` 声明再 `implements`」；如需 `reactive` 包装，参照 `main.tsx` 的 `reactive(...)` 写法。

---

### 8. Barrel / 接线修改（D-10 引用改写）

**`src/ui/index.ts`（旧 `render/ui/index.ts:1-14` 的映射）：**
```ts
// 旧 render/ui/index.ts
import { createMainController } from './controller';
export function createUI() { createMainController(); }
export * from './controller';
export * from './main';
// ... 共 8 条 export *
```
> **目标：** 新 `src/ui/index.ts` 须导出全部迁移模块（`controller` / `main` / `save` / `settings` / `statistics` / `statusBar` / `toolbar` / `viewmap` / `types` / `background` / `func`）。现 `src/ui/index.ts:1` 只有 `export * from './types';` ⇒ 补齐。`createUI()` 的存废取决于新系统接线（`render/index.tsx:31` 现调 `createUI()`），须在 planning 时对照 `client.ts:126-130` 的 `setPropsBaseCreator` 接线一并定夺。

**`src/render/index.tsx`（`git grep` 实测 3 处引用）：**
| 行 | 旧 | 目标 |
|---|---|---|
| `:6` | `import { createUI } from './ui';` | `from '../ui'`（或按新 barrel 决策改） |
| `:11` | `import { LoadSceneUI } from './ui/load';` | `from '../ui/load'` |
| `:39` | `export * from './ui';` | **须评估 D-69**：`../ui` 非「同目录项」，barrel 硬约束下该转发应删除，改由 `client-modules/src/index.ts` 直连 `./ui` |

**`src/client.ts`（`git grep` 实测 2 处）：**
| 行 | 旧 | 目标 |
|---|---|---|
| `:44` | `import { LoadSceneUI } from './render/ui/load';` | `from './ui/load'` |
| `:45` | `import { createUIPropsBase } from './ui/func';` | 不变（已是新路径） |

**`src/render/action.ts`（`git grep` 实测 1 处）：**
| 行 | 旧 | 目标 |
|---|---|---|
| `:4-11` | `from './ui'` | `from '../ui'` |

**层级/import 相对路径规则（`dev.md:55` import 置首、无洞、无注释；`dev.md:52` 不转发导出）：** 迁移后 `src/ui/*.tsx` 对共享常量的引用由 `'../../shared'` 变 `'../shared'`；对 `render` 能力的引用须指向**叶子模块** `'../render/use'`（`transitioned` 等，定义于 `render/use.ts:330`）或 `'../render/renderer'`（`mainRenderer` / `createApp` 等），**不得**经 `'../render'` barrel（`render/index.tsx`）—— `render/index.tsx` 自身 `import { createUI } from './ui'` / `export * from './ui'`，从 `src/ui/**` 再反向 `import ... from '../render'` 会形成 `render/index.tsx ↔ src/ui` 循环引用，违反 `dev.md:37`。`src/ui/load.tsx:18` 现有的 `import { transitioned } from '../render';` 即此类 barrel 引用，迁移/对齐时应改为 `from '../render/use'`（`transitioned` 实际归属）。须逐文件核对相对层级与符号归属，避免断链与环（`dev.md:37` 无循环引用）。

---

## Old → New Interface Mapping（D-11 要求，集中表）

> 本表为任务 1 的核心交付之一。**「新接口」列全部有 `IClientBase` 上的实证**；凡 `IClientBase` 无对应者单列「无对等（报告）」节，**不自造接口**。

| 旧（单例/全局） | 出现位置（迁移源） | 新接口（经 `props.state: IClientBase`） | 新接口定义证据 |
|---|---|---|---|
| `client.loader` | `render/ui/load.tsx:27,36` | `props.state.loader` | `data-state/src/types.ts:29`（`ICoreState.loader`） |
| `client.materials` | `render/ui/title.tsx:67`；`statusBar.tsx:119`；`toolbar.tsx:77,175` | `props.state.materials` | `client-base/src/types.ts:31` |
| `client.flags` | `render/ui/main.tsx:98`；`settings.tsx:166,221` | `props.state.flags` | `data-base/src/types.ts:27`（`IStateBase.flags`） |
| `client.hero.attribute.getFinalAttribute()` | `render/ui/main.tsx:102-110` | `props.state.hero.attribute.getFinalAttribute()` | `data-base/src/hero/types.ts:921,928,117` |
| `client.hero.attribute.addHook()` | `render/ui/main.tsx:141` | `props.state.hero.attribute.addHook()` | `data-base/src/hero/types.ts:104`（`IHookable`） |
| `client.mainMapRenderer` | `render/ui/main.tsx:35` | `props.state.mainMapRenderer` | `client-base/src/types.ts:39` |
| `client.mainMapExtension` | `render/ui/main.tsx:35` | `props.state.mainMapExtension` | `client-base/src/types.ts:43` |
| `state`（`@user/data-state` 单例） | `render/ui/main.tsx:28,248` | `props.state`（`IClientBase extends ICoreState`） | `client-base/src/types.ts:21`；`data-state/src/types.ts:26` |
| `using`（模块级单例） | `render/ui/main.tsx:31,155` | `props.state.using` | `client-base/src/types.ts:45` |
| `mainUIController`（模块级单例） | `render/ui/controller.tsx:11`；`main.tsx:29`；`statusBar.tsx:7`；`toolbar.tsx:23`；`render/action.ts:5` | `props.state.mainUIController`（**组件内可切换；非组件模块归属待裁定**） | `client-base/src/types.ts:49` |
| `sceneController`（模块级单例） | `render/scene.ts:3`；`render/index.tsx:8` | `props.state.sceneController`（组件内可切换；组合根归属待裁定） | `client-base/src/types.ts:47` |

### 无对等（报告，不造接口）

| 旧调用 | 位置 | 归属 | 处置 |
|---|---|---|---|
| `mainSetting` / `triggerFullscreen` / `mainUi` / `getVitualKeyOnce`（`@motajs/legacy-ui`） | `src/ui/title.tsx:32`；`render/ui/settings.tsx:17,19`；`render/ui/toolbar.tsx:14` | legacy UI | D-14：不移植，**只报告** |
| `generateBinary`（`@motajs/legacy-common`） | `render/ui/toolbar.tsx:20` | legacy common | **只报告** |
| `core.*`（含 `core.status.*` / `core.doSL` / `core.ui.closePanel` / `core.startGame` 等，遍布各 UI） | 全 UI 文件 | legacy 全局 | D-14 纯适配 + Phase 4 D-55：**只报告、不改、不登记为待办** |
| `ItemState`（`@user/data-state`，带 `@ts-expect-error`） | `render/ui/statistics.tsx:10-11,178` | 数据端缺失/改名 | **只报告**（Phase 4 `#04-01-M-07` 已登记） |

> **注意：** 上述 legacy 项均**不属于**「`client` 单例 → `IClientBase`」映射范畴；D-11 只要求替换 `client` 相关操作。planner 不得借任务 1 扩大范围处理 `core.*`（D-06 / D-14）。

---

## Shared Patterns

### Props 基类型统一（跨所有迁移组件）
**Source:** `packages-user/client-base/src/types.ts:15-19`（`IGameUIPropsBase`）；`packages-user/client-modules/src/ui/types.ts:1-5`（`IUIPropsBase`）；`packages-user/client-modules/src/ui/func.ts:13-26`（`createUIPropsBase`）
**Apply to:** 所有 `src/ui/*.tsx` 组件。
- 组件 props 须声明 `'controller' | 'instance' | 'state'` 三项（照抄 `src/ui/title.tsx:62-64`）。
- 组件内获取主对象一律 `props.state`，**禁止** `import { client }`。
- **待决（planner 须在计划中定一个并全仓统一）：** props 泛型基类型取 `IUIPropsBase`（client-modules 本地）还是 `IGameUIPropsBase`（`@user/client-base`）。两者同构；`func.ts` / `client.ts` 现行用 `IGameUIPropsBase`，`types.ts` 定义 `IUIPropsBase`。修正 `src/ui/load.tsx:23` 与 `src/ui/title.tsx:38` 的 `import { IUIDefaultPropsBase } from './types'`（该符号并不由 `./types` 导出）。

### 单例归属（`mainUIController` / `sceneController` / `using`）
**Source:** `packages-user/client-base/src/types.ts:45,47,49`（`IClientBase` 已含三者字段）；Phase 4 `04-15-RENDER-SINGLETON-AUDIT` `#04-15-F-02/F-04/F-05`
**Apply to:** `controller.tsx` / `main.tsx` / `statusBar.tsx` / `toolbar.tsx` / `render/action.ts` / `render/index.tsx`
- 组件内使用主对象字段是可行且受支持的（`IClientBase` 有字段）；但**模块级单例（`controller.tsx:11`、`render/scene.ts:3`）的存废/迁移**是 Phase 4 遗留未决项，**须先经用户裁定**（AGENTS.md 命名/接口须先反馈）。
- 本任务**不得**擅自删除或改名这些单例；只做 `client` 单例的消除。

### 生命周期清理（hook 卸载）
**Source:** `render/ui/main.tsx:148-150`
**Apply to:** D-12 新响应式对象、以及任何 `addHook` 订阅。
```tsx
onUnmounted(() => {
    attributeHook.unload();
});
```

### flags 更新占位（D-13）
**Source:** CONTEXT D-13
**Apply to:** `main.tsx` / `settings.tsx` 内所有 `flags` 读取后需响应更新的点。
- flags 无监听系统 ⇒ 不加监听，仅加 `// TODO:`（格式 `dev.md:78`），并注明「flags 更新未接」。

### 目录移动范式（D-10）
**Source:** `.planning/phases/04-render-adaptation/04-STRUCTURE-MIGRATION-IMPACT.md:59-110`（被移集合清单表）+ `:32-43`（六类判定口径 + 外部导入点 B 类）
**Apply to:** 全部迁移文件与 importer。
- 先出「现路径 → 目标路径」映射表（逐文件）；再出「外部导入点」清单（每一处 `file:line`）；最后核对 barrel 断链与 D-69。
- 迁移后**必须**删除源目录 `render/ui/**`，不得留双份。

### Barrel 硬约束（D-69）
**Source:** CONTEXT `<code_context>` Established Patterns；`.planning/phases/04-render-adaptation/04-UI-ADAPTATION-IMPACT.md:126-138`（D-69 判定）
**Apply to:** `src/ui/index.ts`、`src/render/index.tsx`、`src/client-modules/src/index.ts`。
- barrel 只允许 `export * from './<同目录项>'`；`render/index.tsx` 的 `export * from '../ui'` 属**上层转发**，违反 D-69 ⇒ 评估删除，改由 `client-modules/src/index.ts` 直连 `./ui`。
- 消费者直连包公共面，不经中间 barrel 转发。

### 代码规范（`dev.md`，迁移时同步遵守）
- 引入置首、import 间无空行/注释（`dev.md:55`）。
- 无 `import type`（`dev.md:54`）；所有类须 `implements` 接口（`:100`）；避免 `?.`（`:107-109`）。
- 不改任何既有 jsDoc 注释（AGENTS.md），新增注释遵循 `dev.md:72-86`。

---

## No Analog Found

| 对象 | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/ui/<hero-attr>.ts`（D-12 的 `IHeroAttr` 响应式对象） | hook / composable | event-driven | 仓内无「独立响应式属性包装 + `addHook` 监听」的既有同类文件；仅可借 `render/ui/main.tsx:66-90,141-150` 的内联写法。**命名待用户批准**。 |
| flags 更新监听 | — | event-driven | 仓内无 flags 监听系统（D-13 明确）；本任务不实现，仅标 TODO。 |

---

## Metadata

**Analog search scope:** `packages-user/client-modules/src/{render/ui,ui,render}`、`packages-user/client-base/src/{types.ts,save,components}`、`packages-user/data-{base,state}/src/{types.ts,hero}`、`packages/system/src/ui/**`、`.planning/phases/04-render-adaptation/**`、`dev.md`、`AGENTS.md`
**Files scanned:** 迁移源 11 + 迁移目标已存在 6 + 接线/barrel 3 + 接口基准 ~10 + Phase 4 文档 5
**Tracked-source 校验:** `render/ui/**`（11）与 `src/ui/**`（6）经 `git ls-files` 验证为 tracked；未引用任何 gitignored 镜像路径
**Pattern extraction date:** 2026-10-09
