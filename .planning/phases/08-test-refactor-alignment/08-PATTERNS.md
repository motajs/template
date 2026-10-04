# Phase 8: 测试重构与接口对齐 - Pattern Map

**Mapped:** 2026-10-04
**Scope:** 71 个测试文件（65 `*.test.ts` + 6 `*.perf.ts`）+ 3 个随迁非测试文件（`replayVerifier.ts`、`fixtures/closed-loop.ts`、`fixtures/floors.json`）
**Analogs found:** 迁移布局 = 无先例（greenfield）；夹具/断言模式 = 全部有现存 analog

---

## 0. Planner TL;DR

1. **全仓不存在任何 `__test__/` 目录**（`git ls-files` + glob 均为 0）。目标布局无历史先例，最接近的 analog 是「源码同目录测试」现状与唯一聚合目录 `data-state/test/`。迁移本身应视为**纯文件系统 + 导入重写**，不引入新测试风格；风格一律沿用现有测试。
2. **导入重写有两条不同规则**，不可用「所有 `../` +1」一刀切：
   - **规则 A（+1 层）**：`data-{common,base,system}/src/**/<sys>/*.{test,perf}.ts` → 同目录 `__test__/`；以及 `data-state/src/**/*.test.ts` → 同目录 `__test__/`。所有相对 specifier 多一层。
   - **规则 B（层数不变）**：`data-state/test/**` → `data-state/__test__/**`（`test/` 与 `__test__/` 同为 `data-state/` 直接子目录，深度相同）。相对 specifier **原样保留**。
3. **唯一外部测试路径引用**：`script/test-data-node.ts:67,122` 硬编码 `data-state/test/{replayVerifier.ts,fixtures/closed-loop.ts}`，`pnpm test:data-node` 依赖它 → 迁移时必须同步改；这是脚本非生产文件，但按 AGENTS.md 仍需用户确认（建议在迁移计划 Task 0 一并汇报）。
4. **无配置需改**：`vite.config.ts` 无 `test.include`（默认 glob 命中 `__test__/`）、`vitest.perf.config.ts` 的 `**/*.perf.ts` 深度无关、`tsconfig.json` `packages-user/**/*.ts` 深度无关、`eslint.config.js` 无测试路径 glob。
5. 每个 `it` 前必须有**一行中文单行注释**（`dev.md:86`）；迁移只改路径与 aligned 断言，不得丢注释。

---

## File Classification（按目标 `__test__/` 目录分组）

> Role 均为 test；Data Flow 用 `unit` / `integration` / `perf` / `fixture` / `helper` 标注。所有路径均为 git-tracked。

| # | 目标目录 | 文件（basename） | 数量 | Data Flow | 最接近 Analog |
|---|----------|------------------|------|-----------|----------------|
| 1 | `data-common/src/common/__test__/` | face, faceManager, indexer, mover, utils | 5 unit | unit | 各自现位于同目录（`packages-user/data-common/src/common/*.test.ts`） |
| 2 | `data-common/src/replay/__test__/` | array, func, sandbox, saveLoad, system | 5 unit | unit | `packages-user/data-common/src/replay/sandbox.test.ts` |
| 3 | `data-common/src/store/__test__/` | eventStore, tileStore | 2 unit | unit | `packages-user/data-common/src/store/tileStore.test.ts` |
| 4 | `data-base/src/enemy/__test__/` | enemy, manager, saveLoad, special | 4 unit | unit | `packages-user/data-base/src/enemy/manager.test.ts` |
| 5 | `data-base/src/flag/__test__/` | saveLoad, system | 2 unit | unit | `packages-user/data-base/src/flag/system.test.ts` |
| 6 | `data-base/src/hero/__test__/` | attribute, equipStore, equipment, follower, items, location, modifier, mover, rendering, saveLoad, state, attribute.perf | 11 unit + 1 perf | unit/perf | `packages-user/data-base/src/hero/follower.test.ts`、`equipment.test.ts` |
| 7 | `data-base/src/map/__test__/` | dynamicTile, eventPath, eventView, gameMap, mapLayer, mapLifecycle, mapState, mover, saveLoad, staticTile, tile | 11 unit | unit | `packages-user/data-base/src/map/mapLayer.test.ts`、`mapState.test.ts` |
| 8 | `data-system/src/combat/__test__/` | combat, context, damage, mapDamage, context.perf, damage.perf | 4 unit + 2 perf | unit/perf | `packages-user/data-system/src/combat/combat.test.ts` |
| 9 | `data-system/src/event/__test__/` | eventDispatch | 1 unit | unit | 自身 |
| 10 | `data-system/src/path/__test__/` | graph, performance, system | 3 unit | unit | `packages-user/data-system/src/path/graph.test.ts` |
| 11 | `data-state/src/__test__/` | coreEventLayer | 1 unit | unit | `packages-user/data-state/src/coreEventLayer.test.ts`（**去留待裁决**，见 No Analog / RESEARCH OQ4） |
| 12 | `data-state/src/enemy/__test__/` | aura, calculator, comparer, final, mapDamage, special | 6 unit | unit | `packages-user/data-state/src/enemy/calculator.test.ts` |
| 13 | `data-state/src/event/__test__/` | event | 1 unit | unit | `packages-user/data-state/src/event/event.test.ts` |
| 14 | `data-state/src/replay/__test__/` | commands | 1 unit | unit | `packages-user/data-state/src/replay/commands.test.ts` |
| 15 | `data-state/__test__/` | coreNode, dataClosure, enemyCombination, nodeReplay, nodeTracer, replayPlayback, saveablesRoundTrip, tileLegacy, mapScenario.perf, saveables.perf, saveablesReal.perf, **replayVerifier.ts**, **fixtures/closed-loop.ts**, **fixtures/floors.json** | 8 unit + 3 perf + 2 helper + 1 fixture | unit/integration/perf/helper | `packages-user/data-state/test/nodeReplay.test.ts`、`test/fixtures/closed-loop.ts` |

**合计核对：** 逐目录求和 5+5+2+4+2+11+11+4+1+3+1+6+1+1+8 = **65 个 `*.test.ts`**；perf：目录 #6 的 1 + 目录 #8 的 2 + 目录 #15 的 3 = **6 个 `*.perf.ts`**；随迁非测试文件 3 个（`replayVerifier.ts` + `fixtures/closed-loop.ts` + `fixtures/floors.json`）。

---

## Pattern Assignments

### M1. 迁移导入重写 — 规则 A（+1 层）

**适用：** #1–#14（同目录测试下沉到 `__test__/`，目录深一层）。
**规则：** 每个**相对** specifier 增加一层：`'./x'`→`'../x'`，`'../x'`→`'../../x'`，`'../../../pkg/src/x'`→`'../../../../pkg/src/x'`。**动态 `import()` 与 `typeof import()` 的字符串同样要改**；`'@user/*'`、`'@motajs/*'`、`'vitest'` 裸包 specifier **不变**。

**Analog（改写前 → 改写后，file:line）：**

`packages-user/data-common/src/common/face.test.ts`（→ `common/__test__/face.test.ts`）
```ts
// before
import { FaceDirection } from './types';                 // :3
interface TestModules { RoleFaceBinder: typeof import('./face').RoleFaceBinder; }  // :11
const faceModule = await import('./face');                // :20
// after
import { FaceDirection } from '../types';
interface TestModules { RoleFaceBinder: typeof import('../face').RoleFaceBinder; }
const faceModule = await import('../face');
```

`packages-user/data-base/src/hero/follower.test.ts`（→ `hero/__test__/follower.test.ts`）
```ts
// before
import { type IPassPredicate } from '../map';   // :13
import { HeroFollowersController } from './follower';  // :14
import { HeroLocation } from './location';      // :15
// after
import { type IPassPredicate } from '../../map';
import { HeroFollowersController } from '../follower';
import { HeroLocation } from '../location';
```

`packages-user/data-state/src/replay/commands.test.ts`（→ `replay/__test__/commands.test.ts`，跨包相对路径）
```ts
// before
import { createCoreState } from '../core';                              // :15
import { ReplaySystem } from '../../../data-common/src/replay/system';  // :16
import { ... } from './commands';                                       // :23
// after
import { createCoreState } from '../../core';
import { ReplaySystem } from '../../../../data-common/src/replay/system';
import { ... } from '../commands';
```

**完整 `./` 相对导入清单（规则 A 命中，供逐文件核对）：** `data-common/src/common/{face,faceManager,indexer,mover,utils}.test.ts`、`data-common/src/store/tileStore.test.ts`、`data-common/src/replay/{array,func,sandbox,saveLoad,system}.test.ts`、`data-system/src/{event/eventDispatch.test.ts,path/{system,performance}.test.ts,combat/{combat,context,damage,mapDamage}.test.ts + context.perf.ts + damage.perf.ts}`、`data-base/src/**`（见 RESEARCH §8 各 anchor）。`data-base` 的 `../map`（仅 `follower.test.ts:13`、`mover.test.ts:11`）与 `data-system/eventDispatch.test.ts:10` 的 `../types` 是仅有的 `../` 命中。

### M2. 迁移导入重写 — 规则 B（层数不变）

**适用：** #15（`data-state/test/**` → `data-state/__test__/**`）。
**依据：** `test/` 与 `__test__/` 同为 `packages-user/data-state/` 直接子目录，`../src/core` 在两侧都解析到 `data-state/src/core`，故**相对 specifier 全部原样**。

Analog `packages-user/data-state/test/coreNode.test.ts`：
```ts
import { createCoreState } from '../src/core';   // :3  → 迁移后不变
```
Analog `packages-user/data-state/test/nodeReplay.test.ts`：
```ts
import { ReplaySystem } from '../../data-common/src/replay/system';  // :3 → 不变
import { ... } from './replayVerifier';                              // :8 → 不变
```
Analog `packages-user/data-state/test/fixtures/closed-loop.ts`：
```ts
import { CoreState, createCoreState } from '../../src/core.ts';  // :23 → 不变（fixtures/ 与 __test__/fixtures/ 同深度）
```
`mapScenario.perf.ts:18` / `saveablesReal.perf.ts:14` 的 `'./fixtures/floors.json'` 同样不变。

> **陷阱：** 迁移执行器若对 `data-state` 一律套用「+1 层」会把规则 B 的文件改坏。建议迁移计划按下表分流：`data-state/test/**` → 不改 specifier；`data-state/src/**/*.test.ts` → +1。

### M3. 随迁的非测试文件（容易漏项）

| 文件 | 迁移 | 备注 |
|------|------|------|
| `data-state/test/replayVerifier.ts` | → `data-state/__test__/replayVerifier.ts` | 被 `nodeReplay.test.ts:8` 与 `script/test-data-node.ts:67` 引用；**不是** test 文件，不在 65 计数内 |
| `data-state/test/fixtures/closed-loop.ts` | → `data-state/__test__/fixtures/closed-loop.ts` | `fixtures/` 随迁（D-02）；被 `dataClosure.test.ts:17`、`nodeTracer.test.ts:2`、`script/test-data-node.ts:122` 引用 |
| `data-state/test/fixtures/floors.json` | → `data-state/__test__/fixtures/floors.json` | 被 `mapScenario.perf.ts:18`、`saveablesReal.perf.ts:14` 以 JSON import 引用 |

---

## 夹具与断言模式（对齐计划复用）

### P1. `vi.hoisted` 全局桩（每个测试文件顶部）

**最小形式**（只补 `main`/`location` 全局）— analog `packages-user/data-common/src/replay/sandbox.test.ts:7-18`：
```ts
import { logger } from '@motajs/common';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { ReplaySystem } from './system';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
});
afterEach(() => { vi.restoreAllMocks(); });
afterAll(() => { vi.unstubAllGlobals(); });
```

**扩展形式**（额外 polyfill `Map.prototype.getOrInsert`/`getOrInsertComputed`）— analog `packages-user/data-base/src/hero/follower.test.ts:18-46`（同型见 `equipment.test.ts:21-49`、`mapState.test.ts:17-45`、`saveablesRoundTrip.test.ts:23-47`、`calculator.test.ts:17-41`）。**迁移原样带过去即可**。

### P2. 动态 `import()` harness + `typeof import()` 类型

**Analog** `packages-user/data-common/src/common/face.test.ts:10-26`：
```ts
interface TestModules {
    RoleFaceBinder: typeof import('./face').RoleFaceBinder;
    logger: typeof import('@motajs/common').logger;
}
let modules: TestModules;
beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const faceModule = await import('./face');
    const commonModule = await import('@motajs/common');
    modules = { RoleFaceBinder: faceModule.RoleFaceBinder, logger: commonModule.logger };
});
```
同型：`packages-user/data-system/src/path/graph.test.ts:32-62`、`packages-user/data-state/src/enemy/calculator.test.ts:43-59`。**注意 `typeof import('./face')` 也须随规则 A 改路径。**

**`vi.mock` 变体**（模块级桩，迁移后 `vi.mock('./enemy')`/`vi.mock('./legacy')` 路径也要 +1）— analog `packages-user/data-state/src/coreEventLayer.test.ts:47-71`：
```ts
vi.mock('./enemy', () => ({ /* class stubs + registerSpecials: vi.fn() */ }));  // :47
vi.mock('./legacy', () => ({ ItemLegacyBridge: class {}, TileLegacyBridge: class {} })); // :59
let modules: TestModules;
beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const coreModule = await import('./core');   // :69
    modules = { CoreState: coreModule.CoreState };
});
```

### P3. `logger.catch` 错误码断言（码覆盖主力）

**Analog** `packages-user/data-common/src/common/face.test.ts:71-82`：
```ts
// 验证绑定未知主图块时经 logger 观测错误码 43 且不建立绑定
it('warns code 43 for an unknown main block', () => {
    const binder = createBinder();
    const result = modules.logger.catch(() => binder.bind(2, 99, FaceDirection.Up));
    expect(result.info.map(info => info.code)).toContain(43);
    expect(binder.getMainFace(2)).toBeNull();
});
```
同型：`packages-user/data-base/src/map/mapState.test.ts:111-112`（`logger.catch(...)` + `toContain(121)`）、`mapLayer.test.ts:185-190`（码 80）。解构形式 `const { info } = logger.catch(...)` 见 `data-common/src/replay/system.test.ts:66`、`replay/saveLoad.test.ts:83`。**缺口码补测（RESEARCH §9.1 的 21 个）直接沿用此机制。**

### P4. 录像桩形状（C 族；**当前测试用 `route`，须改 `array`**）

生产写入面是 `replay.array.add(code, params)`（`equipment.ts:196,214` 等）。现有桩 analog 是**旧形状** `packages-user/data-base/src/hero/equipment.test.ts:63-99`：
```ts
interface ReplaySystemStub {
    route: ReplayRouteStub;              // ← 旧字段，须改 array
    disable: ReturnType<typeof vi.fn>;
    revert: ReturnType<typeof vi.fn>;
}
function createReplaySystem(): ReplaySystemStub {
    let disabled = 0;
    const commands: [ReplayCode, unknown[]][] = [];
    const route: ReplayRouteStub = {
        add(code, params) { if (disabled > 0) return; commands.push([code, params]); },
        commands
    };
    const disable = vi.fn(() => { disabled++; });
    const revert = vi.fn(() => { if (disabled > 0) disabled--; });
    return { route, disable, revert };
}
```
**目标形状**（对齐后，RESEARCH Pattern 2）：把 `route` 键改为 `array: { add }`，保留 `disable`/`revert`。
生产真实形状的可复用 analog：`packages-user/data-state/test/fixtures/closed-loop.ts:170-172,247-250`（直接用真 `ReplaySystem`，`replay.array` + `createReplaySandbox({ route: replay.array, ... })`）。

### P5. Hook 控制器（D 族；删 `.load()`）

`addHook` 即注册，返回 `IHookController`（仅 `unload()`）— 契约源 `packages/common/src/hook.ts:23-32`、`packages/common/src/types.ts:52-60`。
**现有测试全是旧写法**（须删 `.load()`）：
- `packages-user/data-base/src/hero/follower.test.ts:119-125`：`env.controller.addHook({...}).load();`
- `packages-user/data-common/src/replay/sandbox.test.ts:74-80`：`sandbox.addHook({ onStep: ... }).load();`
- `packages-user/data-base/src/map/mapLayer.test.ts:143-149`：`layer.addHook({ onUpdateBlock } ).load();`
- `packages-user/data-base/src/map/gameMap.test.ts:150-154`、`:100-104`
```ts
// 对齐后（保留返回值以备 unload）
const controller = layer.addHook({ onUpdateBlock: (block, x, y) => { updates.push([block, x, y]); } });
// controller.unload();
```

### P6. `CoreState` 构造（B 族；工厂已删）

现有夹具用已删除的 `createCoreState()` — analog `packages-user/data-state/test/fixtures/closed-loop.ts:64`：
```ts
const state = createCoreState();   // ← 已删
```
**目标形状**（RESEARCH §8.11 / ins.ts:11-14）：
```ts
import { CoreState } from '../core';
import { WebLoadStarter } from '@motajs/loader';   // loadStarter 来源须用户裁决，见 OQ1
const state = new CoreState({ loadStarter: new WebLoadStarter(), coreURL: 'placeholder' });
```
全部 10 个 data-state test + 3 个 perf + `fixtures/closed-loop.ts` 均依赖此形状。

### P7. 寻路注入面（path F 族）

`useMapState`/`useDirGroup` 已删，改为 `useMapLayer`/`useFaceHandler`。现有测试处于**过渡态**— analog `packages-user/data-system/src/path/system.test.ts:339-340`：
```ts
system.finder.useMapState(maps);      // :339 已删方法，须移除
system.finder.useMapLayer(layer);     // :340 保留
```
`graph.test.ts:39,59` 仍 import `DirectionMapper`（已删）—须一并移除。
**目标形状**（RESEARCH Code Examples）：
```ts
system.finder.useMapLayer(state.maps.get('F1')!.eventLayer);
system.finder.usePassPredicate(predicate);
system.finder.useFaceHandler(faceHandler);   // 取代 useDirGroup
```

### P8. 地图构造 / 别名（map F 族）

`MapState` 构造已是单参 `state`（现测试 `mapState.test.ts:87` 仍传 `(tileStore, state)`）；`setLayerAlias` 已删，别名改由 `addLayer(alias)` 传入。现有旧写法 analog `gameMap.test.ts:115-130`：
```ts
const first = map.addLayer();                    // :118 → addLayer('<alias>')
map.setLayerAlias(first, 'event');               // :121 → 删除，别名在 addLayer 传入
const result = logger.catch(() => map.setLayerAlias(second, 'event'));  // :125 → 应改为重复别名 131
```
**目标形状**（RESEARCH Code Examples / gameMap.ts:61）：`const layer = map.addLayer('event');` + `map.setEventLayer(layer);`。`coreNode.test.ts:21` 的 `map.addLayer()` 无参调用同样须补别名。

---

## Shared Patterns

### S1. `describe`/`it` 中文单行注释（强制，`dev.md:86`）
每个 `it` 前一行中文注释说明覆盖内容；迁移时**逐文件保留并同步**。反例核对基线：`packages-user/data-state/test/coreNode.test.ts:6`、`nodeReplay.test.ts:163`、`face.test.ts:34`。

### S2. 文件头一行注释
多数测试文件首行是 `// 测试 …`（如 `sandbox.test.ts:1`、`follower.test.ts:1`、`equipment.test.ts:1`）；迁移时保留。

### S3. 全局桩固定搭配
`vi.stubGlobal('main', { replayChecking: true })` + `vi.stubGlobal('location', { origin: 'http://localhost' })` 是数据端测试入场券；`afterAll(() => vi.unstubAllGlobals())` 收尾。**不得删。**

### S4. 禁止的「假绿」手段
`as never` 伪造已删成员、`Object.create` 造骨架、删除测试用例——RESEARCH Anti-Patterns 明令禁止（延续 `07-16-PLAN.md:484/599`）。`it.skip` 仅可保留既有不可达码 147（`equipment.test.ts:352-353`）。

### S5. 唯一既有 `it.skip`
`packages-user/data-base/src/hero/equipment.test.ts:353`（code 147）；迁移后随文件进入 `hero/__test__/`，内容不动。

---

## Config / Barrel / External References

| 引用点 | 是否需要改 | 说明 |
|--------|------------|------|
| `script/test-data-node.ts:67` | **是** | `require('../packages-user/data-state/test/replayVerifier.ts')` → `__test__/replayVerifier.ts` |
| `script/test-data-node.ts:122` | **是** | `require('...data-state/test/fixtures/closed-loop.ts')` → `__test__/fixtures/closed-loop.ts` |
| `package.json:test:data-node` | 否 | 映射到上述 script，无需改 |
| `vite.config.ts:46-49` | 否 | 无 `test.include`，用 Vitest 默认 glob；`__test__/` 不在默认 exclude |
| `vite.config.ts:21-27` 别名 | 否 | `@user/<pkg>` → `packages-user/*/src`，与测试落位无关 |
| `vitest.perf.config.ts:29` | 否 | `include: ['**/*.perf.ts']` 深度无关 |
| `tsconfig.json:30` | 否 | `packages-user/**/*.ts` 覆盖 `__test__/` |
| `eslint.config.js` | 否 | 无测试路径 glob / ignore（`git grep` 0 命中） |
| 各包 `index.ts` barrel | 否 | `git grep` 确认无 barrel 引用测试文件 |
| `.planning/**` | 否 | 规划文档引用不参与运行 |

> `git grep -nE "data-state/test|test/fixtures|replayVerifier"` 全仓（排除 `.planning`）仅命中：`data-state/test/nodeReplay.test.ts:8`（随迁保留）、`script/test-data-node.ts:67,122`（须改）。

---

## No Analog Found

| 目标 | Role | 说明 |
|------|------|------|
| 任意 `**/__test__/` 目录布局 | — | 全仓 0 个现存 `__test__/`；无历史 analog，属全新约定 |
| `data-state/src/__test__/coreEventLayer.test.ts` 的对齐目标 | test | 其被测面 `CoreState.initMapState` 已删；改写为 `MapState.fromRaw` 或退役均无现成 analog，须用户裁决（RESEARCH OQ4） |
| `data-state/test/tileLegacy.test.ts` 的对齐目标 | test | 被测模块 `src/legacy/` 已整体删除，无替代登录点（RESEARCH OQ3） |
| 21 个缺口错误码的补测用例 | test | 现有测试未覆盖这些码，无逐码 analog；仅可复用 P3 的 `logger.catch` 断言机制与源码 emit 点（RESEARCH §9.1） |

---

## Metadata

**Analog search scope:** `packages-user/data-{common,base,system,state}/**`、`script/**`、`vite.config.ts`、`vitest.perf.config.ts`、`tsconfig.json`、`eslint.config.js`、`package.json`
**Files scanned (tests read for patterns):** `data-state/test/{coreNode,nodeReplay,saveablesRoundTrip}.test.ts`、`data-state/test/{replayVerifier.ts,fixtures/closed-loop.ts}`、`data-state/src/coreEventLayer.test.ts`、`data-state/src/enemy/calculator.test.ts`、`data-base/src/hero/{follower,equipment}.test.ts`、`data-base/src/map/{mapState,mapLayer,gameMap}.test.ts`、`data-common/src/common/face.test.ts`、`data-common/src/replay/sandbox.test.ts`、`data-system/src/path/{graph,system}.test.ts`
**Tracked-source gate:** 所有引用路径经 `git ls-files` 校验为 tracked；无 gitignored mirror 路径
**Pattern extraction date:** 2026-10-04
