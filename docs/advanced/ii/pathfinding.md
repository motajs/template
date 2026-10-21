# 自动寻路

自动寻路回答的是「从当前格到目标格走哪条路」。它不负责播放移动动画，也不负责踩踏事件；这两件事分别由移动器和移动钩子完成。寻路系统把「选路」与「执行」拆开：求解器只产出一串方向，真正的位移交给绑定的移动器。

本篇讲这套分工、图的构建入口、两种移动方式与几个可替换点。寻路内部用的是最小损失搜索，本篇只说明它的输入输出，不展开算法实现。

## 参与对象与分工

| 对象                     | 获取方式                         | 职责                                         |
| ------------------------ | -------------------------------- | -------------------------------------------- |
| `IPathfindingSystem`     | `state.pathfinding`              | 对外入口：绑定移动器、取路径、执行移动、中止 |
| `IPathFinder`            | `state.pathfinding.finder`       | 在图上求最小损失路径                         |
| `IMapGraphBuilder`       | `IPathFinder` 内部               | 按图层、通行谓词、损失函数与方向组构建有向图 |
| `IPassPredicate`         | 通过 `usePassPredicate` 注入     | 判断一步能否通行，并标记只能作为终点的格子   |
| `IObjectMover`           | 通过 `useMover` 绑定             | 执行每一步位移，维护位置与朝向               |
| `IPathfindingController` | `moveTo` / `teleportTo` 的返回值 | 把本次路径与底层移动控制器包在一起           |

寻路系统本身不保存地图数据。它每次都从 `IPathFinder` 当前绑定的图层重新构图，因此换楼层、换图层之后必须重新绑定，不能沿用上一次的图。

## 完整流程

一次寻路分为四段：

1. **绑定移动器**：`state.pathfinding.useMover(mover)` 告诉系统「路径最终交给谁走」。勇士场景下传入 `state.hero.location.mover`；动态图块也可以绑定自己的移动器。
2. **构建图**：`finder.useMapLayer(layer)` 选择从哪张图层取格子，通常绑定事件层；`finder.usePassPredicate(predicate)` 判断一步能否通行；`finder.useCostFunction(cost)` 给进入每一格的代价；`finder.useFaceHandler(face)` 指定邻域方向，四方向用 `Dir4FaceHandler`，八方向用 `Dir8FaceHandler`。
3. **求最短路径**：`finder.find(start, target)` 返回 `IPathfindingResult`，里面包含状态与路径步骤。
4. **交给移动器**：`moveTo` 逐步调用 `mover.step(step.dir)` 后启动移动器；`teleportTo` 在策略允许时直接把移动器瞬移到最后一个步骤的终点。

```mermaid
flowchart LR
    A[绑定移动器] --> B[构建有向图]
    B --> C[求解最小损失路径]
    C --> D[交给移动器执行]
```

绑定发生在初始化与换楼层两处。`src/data/initialize.ts` 已经注入通行谓词并把移动器指向勇士，图层先置为 `null`；真正进入楼层后，再把当前楼层的事件层与方向处理器绑上：

```ts
// Dir4FaceHandler / Dir8FaceHandler 都在 @user/data-common，不在 @motajs/common
import { Dir4FaceHandler } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/**
 * 绑定当前楼层的事件层与四方向移动。
 * 每次切换楼层后都要重新调用；不在任何楼层时解除图层绑定。
 */
function bindPathfindingLayer(state: ICoreState): void {
    const map = state.hero.location.map;
    const layer = map ? map.eventLayer : null;
    if (!layer) {
        state.pathfinding.finder.useMapLayer(null);
        return;
    }

    // 方向处理器决定邻域：Dir4FaceHandler 只向上下左右扩展
    state.pathfinding.finder.useFaceHandler(new Dir4FaceHandler());
    // 事件层同时承载图块与事件，寻路通常以它为准
    state.pathfinding.finder.useMapLayer(layer);
}
```

初始化里没有注入方向处理器。缺少它时 `build` 返回 `null`，`getPath` 会得到 `InvalidInput`；绑定图层时一并注入即可。

## 结果状态

`IPathfindingResult` 只有两个字段：`status` 与 `path`。`path` 仅在状态为 `Success` 时非空。

| 状态                             | 含义                                                               | 处理建议                       |
| -------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| `PathfindingStatus.Success`      | 找到路径                                                           | 读取 `path`，交给移动器        |
| `PathfindingStatus.InvalidInput` | 输入不合法：未绑定移动器、图层、谓词或方向处理器，或起点不在地图内 | 检查绑定与起点坐标             |
| `PathfindingStatus.NoPath`       | 从起点出发无法到达目标点                                           | 不要移动；先检查通行谓词与图层 |
| `PathfindingStatus.TargetUnder`  | 目标点就在起点脚下                                                 | 不需要移动                     |

每一步是 `IPathfindingStep`，包含 `dir`（移动方向）、`from`（出发位置）与 `to`（到达位置）。`from` 与 `to` 都是只读的坐标对象；路径按起点到终点的顺序排列。

`finder.find(start, target)` 和 `state.pathfinding.getPath(target)` 的区别只在起点：

- `finder.find` 要求显式传入起始坐标，不会读取移动器，适合「从任意起点试算」；
- `getPath` 是便捷包装，取 `state.pathfinding.mover.tile` 的当前坐标作为起点，再把结果交给 `finder.find`。没有绑定移动器时它直接返回 `InvalidInput`。

两者都依赖同一套图层、通行谓词与方向处理器；换用哪个都不会绕过这些绑定。

## 两种移动方式

`moveTo` 总是逐步移动。它先取路径，状态不是 `Success` 时直接返回 `null`；否则把每一步的 `dir` 依次交给移动器，再启动移动器。

`teleportTo` 也先取路径，但会额外询问瞬移回退策略：`useFallbackPolicy(policy)` 注入的策略返回 `true` 表示「不允许瞬移」，此时自动退化为逐步移动；返回 `false` 才瞬移。没有设置策略时默认必定逐步移动。

```ts
import { ICoreState } from '@user/data-state';

/** 走到目标点并等待移动结束；返回是否成功启动。 */
async function walkTo(
    state: ICoreState,
    x: number,
    y: number
): Promise<boolean> {
    const moving = state.pathfinding.moveTo({ x, y });
    if (!moving) return false;

    // controller 是底层移动控制器，onEnd 在整段移动结束后兑现
    await moving.controller.onEnd;
    return true;
}
```

成功启动时，两个方法都返回 `IPathfindingController`：`controller` 是底层移动控制器（可读 `done`、可 `await onEnd`），`path` 是本次使用的寻路结果。**上一次移动没有结束时，新的 `moveTo` / `teleportTo` 会直接返回 `null`，不会接管当前移动**；底层 `mover.start()` 在移动中同样返回 `null`。想换目标，必须先等 `controller.onEnd`，或调用 `await state.pathfinding.interrupt()` 停止当前移动，再发起新的寻路。

## 初始化在哪里

寻路在 `src/data/initialize.ts` 的 `awake` 中完成三件事：

```ts
// 通行谓词：决定一步能否走、哪一格会撞停
const predicate = new DefaultPassPredicateImpl(state);
state.pathfinding.finder.usePassPredicate(predicate);

// 初始不在任何楼层，图层先置空，切换楼层后再绑定
state.pathfinding.finder.useMapLayer(null);

// 寻路结果交给勇士的移动器执行
state.pathfinding.useMover(state.hero.location.mover);
```

日常需求通常不需要重建这套系统，只需要替换损失函数或瞬移策略。初始化之后替换损失函数就是一次 `useCostFunction` 调用：

```ts
import { PathCostFunction } from '@user/data-system';
import { ICoreState } from '@user/data-state';

/** 在初始化完成之后替换寻路损失函数。 */
function replacePathCost(state: ICoreState, cost: PathCostFunction): void {
    state.pathfinding.finder.useCostFunction(cost);
}
```

## 自定义损失函数

`PathCostFunction` 接收一个 `ILayerLocation`，返回进入该格的代价。不注入时每格代价为 `1`。损失函数只读取位置信息，不修改地图：

- `block.tile`：该格静态图块的数字，空格为 `0`；
- `block.locator`：该格坐标；
- `block.static`：该格静态图块实例，只要坐标在地图内就非 `null`，空格时实例的 `num()` 为 `0`；
- `block.dynamics`：该格的动态图块集合。

判断空格要用 `block.tile === 0`，不要用 `block.static === null`：图层按坐标缓存静态图块实例，空地上 `layer.getTile()` 同样返回实例。

返回值必须是有限数或 `Infinity`。`Infinity` 是合法的「不可进入」代价；`NaN` 与负数会被视为非法，告警后回退为 `1`。

```ts
import { PathCostFunction } from '@user/data-system';

/** 沼泽图块的数字，按自己的内容配置替换 */
const SWAMP_TILE = 21;
/** 墙图块的数字 */
const WALL_TILE = 1;

/**
 * 进入沼泽花费 3，普通地面花费 1，墙不可进入。
 * 代价只影响选路，不改变一步能否通行；通行仍由 usePassPredicate 决定。
 */
export const terrainCost: PathCostFunction = block => {
    if (block.tile === WALL_TILE) return Infinity;
    if (block.tile === SWAMP_TILE) return 3;
    return 1;
};
```

损失函数参与的是「进入节点的总代价」，起点自身不计费。目标格的代价也会被计入，所以给目标格设置 `Infinity` 会让它变成不可达。若某种图块在通行谓词里已经禁止进入，损失函数根本不会看到它；两者分工不同，不要只改其中一边就期待通行判定变化。

## 自定义瞬移策略

`PathFallbackPolicy` 接收完整路径，返回 `true` 表示禁止瞬移、退回逐步移动。它只在 `teleportTo` 中调用，`moveTo` 不会询问策略。未设置策略时，`teleportTo` 也总是逐步移动。

策略适合表达「这段路瞬移过去会跳过不该跳过的东西」：路径太长、经过危险图块、或途经需要触发事件的格子。路径只提供方向与坐标，需要图块信息时可以通过闭包读取当前楼层：

```ts
import { PathFallbackPolicy } from '@user/data-system';
import { ICoreState } from '@user/data-state';

/** 岩浆图块的数字 */
const LAVA_TILE = 30;

/**
 * 路径超过 20 步，或会经过岩浆时，禁止瞬移。
 * 返回 true 表示退回逐步移动。
 */
export function createStepPolicy(state: ICoreState): PathFallbackPolicy {
    return path => {
        if (path.length > 20) return true;

        const map = state.hero.location.map;
        const layer = map ? map.eventLayer : null;
        if (!layer) return true;

        for (const step of path) {
            if (layer.getBlock(step.to.x, step.to.y) === LAVA_TILE) {
                return true;
            }
        }
        return false;
    };
}
```

安装策略同样是 `state.pathfinding.useFallbackPolicy(policy)`。策略只决定「这一次瞬移要不要退化为逐步」，不会修改路径本身；退化为逐步后走的仍是同一条路径。

## 瞬移钩子

`IPathfindingSystemHooks` 提供两个钩子，空实现已经在 `src/data/hook/path.ts` 中留好：

- `onBeforeTeleportTo(path, system)`：只在瞬移分支中触发；
- `onAfterTeleportTo(path, system)`：在移动控制器结束后触发。

两个钩子都挂在寻路系统上，而寻路系统可以绑定任意移动器。因此不只是勇士，动态图块等通过 `useMover` 绑定的对象发生瞬移时也会触发；写回调时不要假设移动的一定是勇士。

```ts
import { ICoreState } from '@user/data-state';
import {
    IPathfindingResult,
    IPathfindingSystem,
    IPathfindingSystemHooks
} from '@user/data-system';

/** 记录自动寻路的瞬移与结束。 */
export class MainPathfindingSystemHooks implements IPathfindingSystemHooks {
    constructor(readonly state: ICoreState) {}

    onBeforeTeleportTo(
        path: IPathfindingResult,
        system: IPathfindingSystem
    ): void {
        const mover = system.mover;
        const last = path.path.at(-1);
        if (!mover || !last) return;

        // 瞬移只落在终点，途经格不会触发踩踏事件
        console.log(
            '从',
            mover.tile.x,
            mover.tile.y,
            '瞬移到',
            last.to.x,
            last.to.y
        );
    }

    onAfterTeleportTo(
        path: IPathfindingResult,
        system: IPathfindingSystem
    ): void {
        // 第二个参数同样是寻路系统，可用来判断这次移动绑定的移动器
        void system;
        // 这个钩子挂在所有移动的结束回调上，逐步移动也会走到这里
        console.log('寻路移动结束，共', path.path.length, '步');
    }
}
```

这段代码直接补进 `src/data/hook/path.ts` 的 `MainPathfindingSystemHooks` 即可（类已存在，方法体是空的）。注册发生在 `src/data/hook/initialize.ts` 的 `initializeHooks`：

```ts
// initializeHooks 内部
state.pathfinding.addHook(new MainPathfindingSystemHooks(state));
```

需要区分「这次是瞬移还是逐步」时，在 `onBeforeTeleportTo` 里记录标记，再在 `onAfterTeleportTo` 里读取并清除；不要只看结束钩子。

## 怎么验证

先准备一张固定地图，把勇士放到起点，再用 `getPath` 观察状态与步数，最后执行 `moveTo` 并等待控制器结束：

```ts
import { ICoreState } from '@user/data-state';
import { PathfindingStatus } from '@user/data-system';

/** 打印寻路结果，并在成功时走到目标点。 */
async function verifyPathfinding(
    state: ICoreState,
    x: number,
    y: number
): Promise<void> {
    const path = state.pathfinding.getPath({ x, y });
    console.log('状态', path.status, '步数', path.path.length);

    if (path.status !== PathfindingStatus.Success) {
        console.log('未找到路径，检查移动器、图层、通行谓词与方向处理器');
        return;
    }

    const moving = state.pathfinding.moveTo({ x, y });
    if (!moving) {
        console.log('已有移动进行中，或本次寻路失败');
        return;
    }

    await moving.controller.onEnd;
    const location = state.hero.getLocation();
    console.log('到达', location.x, location.y);
}
```

预期英雄沿最小损失路径到达目标点；目标不可达时 `status` 为 `NoPath`，不会发生移动。若状态是 `InvalidInput`，按顺序检查移动器、图层、通行谓词与方向处理器是否都已绑定。

## 边界与注意

- **未绑定移动器时 `getPath` 返回 `InvalidInput`**：寻路需要从移动器读取当前坐标，没有移动器就没有起点。
- **`moveTo` 与 `teleportTo` 只在 `Success` 时启动**：`NoPath`、`TargetUnder`、`InvalidInput` 都会返回 `null`。
- **上一次移动未结束时返回 `null`**：连续调用 `moveTo` 前先等 `controller.onEnd`，或显式 `interrupt()`。
- **目标点在脚下不会移动**：`find` 在起点与终点相同时直接返回 `TargetUnder`。
- **目标格必须可达**：图只包含从起点沿可通行边能到达的节点，不可达区域不会进入图。
- **谓词的 `shouldHit` 会标记终端节点**：终端节点只能作为路径终点，不能作为中间点；目标点不可达时优先检查 `canPass` 与 `shouldHit` 的组合。
- **换楼层要重新绑定**：`useMapLayer` 绑定的是具体图层对象，旧楼层失效后必须换成新楼层的图层。
- **图层必须属于同一个数据端对象**：`useMapLayer` 会校验图层来源，不属于当前状态时告警并忽略这次绑定。
- **损失函数的非法返回值会回退**：`NaN` 与负数告警后按 `1` 处理；`Infinity` 合法，表示不可进入。
- **策略只影响 `teleportTo`**：`moveTo` 永远逐步移动，不会询问回退策略。
- **瞬移会跳过途经格**：途经的踩踏事件不会触发；需要补触发时用 `onBeforeTeleportTo` 或 `onAfterTeleportTo`。
- **`onAfterTeleportTo` 不是瞬移专用**：它挂在移动控制器结束回调上，逐步移动结束时同样会触发。
- **`interrupt()` 会等待底层移动停止**：它返回 `Promise`，需要确保停止后再开始新的移动。

渲染端如何表现寻路移动不在本篇范围内。 <!-- TODO(renderer): 寻路移动动画与瞬移表现 -->

返回[高级 II 导览](./index.md)。
