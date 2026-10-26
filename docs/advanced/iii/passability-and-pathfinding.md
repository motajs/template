# 通行性谓词与寻路原理

通行性谓词回答两个问题：这一步能不能走进目标格，以及这次移动会不会撞上目标格。它是数据端唯一的通行语义契约：勇士移动在每一步开始时问它，寻路在构图时也问它。因此在默认实现下，「寻路选出的路」与「勇士实际能走的路」由同一套规则算出。

本篇讲这个契约、默认实现如何判断、它为什么会出现两个实例，以及寻路如何构图、搜索并把步骤交给移动器。损失函数与瞬移策略属于[自动寻路](../ii/pathfinding.md)的用法，本篇不重复。

## 系统模型

通行性判断只有一组输入：当前位置、目标位置、移动方向与地图。勇士移动与寻路构图都把这组输入打包成 `IPassCheckHandler`，再调用同一个 `IPassPredicate`。两者的差别只在「拿到结果后做什么」。

| 对象                       | 职责                                                   |
| -------------------------- | ------------------------------------------------------ |
| `IPassCheckHandler`        | 一次判断的输入：当前格、目标格、方向与地图             |
| `IPassPredicate`           | 通行性契约：`canPass` 与 `shouldHit`                   |
| `DefaultPassPredicateImpl` | 数据端默认实现：按事件层与图块的通行位判断             |
| `MapGraphBuilder`          | 从起点出发构图，只保留可达节点，并标记终端             |
| `PathFinder`               | 在图上搜索最小损失路径                                 |
| `PathfindingSystem`        | 绑定移动器、图层、谓词与方向处理器，并把步骤交给移动器 |

两个消费方的调用方式如下。寻路本身不判断通行，它只是反复调用谓词，把「能不能走」翻译成图的边。

```text
勇士移动：一步开始
  └─ IPassPredicate.canPass / shouldHit
       ├─ canPass 为 false             → 不能走
       ├─ canPass 为 true 且 shouldHit → 撞停
       └─ 两者都放行                   → 正常一步

寻路：构图
  └─ 对每个相邻格调用同一组方法
       ├─ canPass 为 false → 不建边
       ├─ shouldHit 为 true → 目标格记为终端
       └─ 其余             → 建一条可通行边
```

寻路整体是「构图 → 搜索 → 交给移动器」：`MapGraphBuilder` 把当前楼层变成一张有向图，`PathFinder` 在图上找一条最小损失路径，`PathfindingSystem` 再把路径拆成步骤交给绑定的移动器。三者都不自己判断通行，判断统一落在谓词上。

## 通行性谓词契约

`IPassPredicate` 只有两个方法，接收同一个 `IPassCheckHandler`：

- `canPass(handler)`：判断能否从当前格进入目标格。
- `shouldHit(handler)`：判断这次移动是否应该产生撞击。

两者是不同的问题。`shouldHit` 为真并不表示「不能走」，而是「走得到，但会撞」；`canPass` 为假才是真的进不去。勇士移动正是按这个顺序判断的：先看 `canPass`，再在放行时看 `shouldHit`。寻路构图也用同一组结果：`canPass` 决定建不建边，`shouldHit` 决定目标格是不是终端。

`IPassCheckHandler` 带着 `currLoc`、`nextLoc`、`direction` 与 `map`，还带着数据端主对象。谓词不保存「当前是哪个对象在走」的状态，同一个判断函数可以同时被勇士和寻路调用。

## 默认实现怎么判断

`DefaultPassPredicateImpl` 是数据端内置的默认实现。它在 `canPass` 里分层判断：

1. 先从朝向管理器取四方向处理器，把传入方向降级到四向；取不到处理器或降级为 `Unknown` 时直接不通行。
2. 没有地图、地图没有事件层时直接不通行。
3. 在事件层上，当前格静态图块的 `pass.outPass` 必须允许朝移动方向离开；目标格静态图块的 `pass.inPass` 必须允许从反方向进入。事件层的图块无论是否标记「只判事件」都参与判断。
4. 在其它图层上，只检查 `pass.onlyEvents` 为真的图块；没标记的图块不参与通行判断。标记了的图块同样检查离开与进入两个方向。

`shouldHit` 只看事件层的目标格：目标格静态图块存在，并且它的 `eventPass` 为假时，返回真。`eventPass` 是图块的事件通行标记：为真表示玩家会走上去触发事件，为假表示玩家会撞在格子上触发事件。因此默认规则下，带事件但不可走上去的格子会成为寻路的终端，而不是普通中间格。

下面这段函数用默认谓词判断某一步的结果，三种返回值与勇士移动的分支一一对应：

```ts
// src/data/hero/passCheck.ts
import { ITileLocator } from '@motajs/common';
import { FaceDirection } from '@user/data-common';
import { IPassCheckHandler } from '@user/data-base';
import { ICoreState } from '@user/data-state';
import { DefaultPassPredicateImpl } from './predicate';

/** 一步的三种结果：不能走、走得到但会撞、正常进入。 */
export type StepResult = 'cannotMove' | 'hit' | 'step';

/**
 * 用默认谓词判断从 curr 朝 direction 走到 next 的结果。
 * 默认谓词内部按事件层与 onlyEvents 图块检查通行位，并用 eventPass 判断撞击。
 */
export function judgeStep(
    state: ICoreState,
    curr: ITileLocator,
    next: ITileLocator,
    direction: FaceDirection
): StepResult {
    // 判断一次也要构造完整输入，地图与状态都从数据端主对象取
    const handler: IPassCheckHandler = {
        currLoc: curr,
        nextLoc: next,
        direction,
        map: state.hero.location.map,
        state
    };

    // 谓词本身只保存数据端主对象，频繁判断时应复用同一个实例
    const predicate = new DefaultPassPredicateImpl(state);

    if (!predicate.canPass(handler)) return 'cannotMove';
    if (predicate.shouldHit(handler)) return 'hit';
    return 'step';
}
```

## 同一契约、两个实例

这是本页最容易讲错的一点：勇士移动与寻路用的谓词来自同一个类，但不是同一个对象。

| 消费方   | 实例来源                                            | 注入方式                            |
| -------- | --------------------------------------------------- | ----------------------------------- |
| 勇士移动 | `DefaultHeroMoveTopImpl` 构造时自己新建一个默认谓词 | 顶层实现的 `predicate()` 返回它     |
| 寻路构图 | 数据端初始化时另建一个默认谓词                      | `finder.usePassPredicate(...)` 注入 |

`DefaultHeroMoveTopImpl` 把谓词保存在字段里，`predicate()` 每次返回同一个实例。数据端初始化时又为寻路求解器新建了一个默认谓词，通过 `state.pathfinding.finder.usePassPredicate(...)` 注入。两者行为一致，因为它们由同一个类实现、读同一份地图数据；但它们没有共享状态，也没有自动同步。

因此，改勇士侧的谓词不会改变寻路侧，改寻路侧的谓词也不会改变勇士侧。要让两边保持一致，必须两边都换：要么把同一个谓词实例同时交给顶层实现和求解器，要么在两侧分别构造同一个自定义类。

## 勇士移动的三种结果

勇士移动在每一步开始时调用顶层实现的 `predicate()`，再用返回的谓词判断这一步：

- 不能走：`canPass` 为假。调用顶层实现的 `cannotEnter(handler)`，然后停止本次移动，位置不变。当前默认实现里这个回调是空实现，没有对应的内置触发器。
- 撞停：`canPass` 为真、`shouldHit` 也为真。调用顶层实现的 `hit(handler)`，然后停止本次移动，位置不变。
- 正常一步：两者都放行。本步返回目标格，移动器把坐标写过去；结算时先触发离开当前格，再触发进入目标格。

三种结果与触发器派发的对应关系只有一句：撞停走触碰，正常一步走离开与进入，不能走目前没有内置触发器。触发器本身的收集与执行属于事件系统，本篇不展开。

## 构图：从起点只保留可达节点

`MapGraphBuilder` 负责把图层变成有向图。构图前必须已经注入图层、通行谓词与方向处理器；起点还必须在地图范围内。缺任何一项，`build(start)` 都会告警并返回 `null`。

构图从起点开始做广度扩展：

1. 用方向处理器的 `mapMovement()` 枚举邻域，跳过零偏移的原地条目。
2. 邻格不在地图内就跳过；否则用当前格、邻格、方向与地图构造 `IPassCheckHandler`。
3. 谓词的 `canPass` 为假时不建边，也不继续扩展该邻格。
4. `canPass` 放行但 `shouldHit` 为真时，仍然建边，同时把邻格记为终端。
5. 只有从起点可达的节点才进入图；不可达区域根本不会出现在图里。

每个节点的损失由损失函数计算，未注入时按 1 处理；损失值非法时也回退为 1。损失函数只决定「进入这一格要花多少代价」，不决定能不能进入。

终端是构图阶段留下的约束：终端格可以作为路径的终点，但不能作为路径的中间点。默认实现里，`shouldHit` 为真的格子就是终端，所以「走得到但会撞」的格子只在作为目标时才会出现在路径末尾。

## 搜索：最小损失与终端约束

`PathFinder` 在构好的图上搜索最小损失路径。它不重新判断通行，也不重新计算损失，只读取节点上的 `cost` 与 `terminal`。

搜索的输入输出可以归结为几条约束：

- 起点等于终点时直接返回空路径，表示目标就在脚下。
- 目标不在图里时返回空路径；图只包含从起点可达的节点，不可达自然找不到。
- 终端节点只能作为终点：搜索不会把一个终端节点当作通往其它节点的中间点。
- 找到路径时返回按起点到终点排列的步骤，每一步带方向、出发位置与到达位置。

`find(start, target)` 把构图与搜索串起来，并把结果归入四个状态：

| 状态                             | 含义                                               |
| -------------------------------- | -------------------------------------------------- |
| `PathfindingStatus.Success`      | 找到路径，`path` 非空                              |
| `PathfindingStatus.InvalidInput` | 构图失败：缺少图层、谓词或方向处理器，或起点越界   |
| `PathfindingStatus.NoPath`       | 图上找不到路径，例如目标被终端格或不可通行区域挡住 |
| `PathfindingStatus.TargetUnder`  | 起点与终点相同，目标就在脚下                       |

`NoPath` 是正常结果，不是错误。它说明按当前谓词与当前图层，从起点走不到目标；调用方不需要为它做特殊恢复。

## 系统层做什么

`PathfindingSystem` 是寻路的对外入口，负责把求解器与移动器接起来：

- 用 `useMover(mover)` 绑定移动器；`getPath(target)` 从移动器的 `tile` 读取起点，没有绑定移动器时直接返回 `InvalidInput`。
- 图层、通行谓词、方向处理器与损失函数都通过 `finder` 注入；换楼层时重新绑定图层。
- `moveTo(target)` 总是逐步移动：取到 `Success` 的路径后，把每一步的方向交给移动器，再启动移动器。
- `teleportTo(target)` 先询问瞬移回退策略；没有策略或策略返回真时退回逐步移动，只有策略放行才把移动器瞬移到最后一个步骤的终点。
- 上一次移动还没有结束时，新的 `moveTo` 或 `teleportTo` 返回 `null`，不会接管当前移动。
- `interrupt()` 会等待底层移动真正停止，再允许开始下一次移动。

系统层不保存地图数据，也不缓存上一次的图；每次寻路都从当前绑定的图层重新构图。完整的绑定流程、损失函数与瞬移策略示例见[自动寻路](../ii/pathfinding.md)。

## 换一套通行语义

换通行语义就是换谓词。实现 `IPassPredicate` 的两个方法，输入都是 `IPassCheckHandler`；需要保留默认规则时，在内部包一个默认实现，再叠加自己的判断。

下面这个类在默认规则之上禁止勇士走进指定图块数字的格子：

```ts
// src/data/hero/noTilePassPredicate.ts
import { IPassCheckHandler, IPassPredicate } from '@user/data-base';
import { IStateSystem } from '@user/data-system';
import { DefaultPassPredicateImpl } from './predicate';

/** 在默认规则之上，禁止进入指定图块数字的格子。 */
export class NoTilePassPredicate implements IPassPredicate {
    // 默认谓词负责事件层、onlyEvents 图块与 eventPass 的判断
    private readonly base: IPassPredicate;

    constructor(
        state: IStateSystem,
        // 要禁止进入的图块数字，按自己的内容配置传入
        private readonly blockedTile: number
    ) {
        this.base = new DefaultPassPredicateImpl(state);
    }

    canPass(handler: IPassCheckHandler): boolean {
        // 默认规则已经拒绝时，不再叠加判断
        if (!this.base.canPass(handler)) return false;

        const map = handler.map;
        const event = map ? map.eventLayer : null;
        if (!event) return false;

        // 读取目标格在事件层上的静态图块数字
        const next = event.getLocationData(
            handler.nextLoc.x,
            handler.nextLoc.y
        );
        return next?.static?.raw()?.num !== this.blockedTile;
    }

    shouldHit(handler: IPassCheckHandler): boolean {
        // 撞击语义保持默认：目标格静态图块的 eventPass 为假时撞停
        return this.base.shouldHit(handler);
    }
}
```

寻路侧只需要把求解器的谓词换掉：

```ts
// src/data/initialize.ts 的 awake 中
const LAVA_TILE = 30;

// 换掉寻路构图使用的谓词；之后构图与终端标记都按新规则计算
state.pathfinding.finder.usePassPredicate(
    new NoTilePassPredicate(state, LAVA_TILE)
);
```

勇士侧要换的是顶层实现，而不是直接往移动器里塞谓词。`DefaultHeroMoveTopImpl` 在构造时已经建好自己的默认谓词；保留其它行为时，包一层顶层实现并转发，让 `predicate()` 返回你的谓词。完整写法见[移动 Mover](../i/mover.md#勇士的顶层实现)。如果这套规则就是本作唯一的规则，也可以直接修改默认实现，让勇士与寻路都拿到新语义。

方向处理器决定「哪些方向算相邻」，它的选择会同时影响移动与构图；四方向与八方向的差别见[FaceHandler 系列](../i/face-handler.md#用在哪里)。损失函数与瞬移策略不改变通行性，它们分别决定进入代价与是否逐步移动，见[自定义损失函数](../ii/pathfinding.md#自定义损失函数)与[自定义瞬移策略](../ii/pathfinding.md#自定义瞬移策略)。

## 边界与注意

- 两个实例不共享：勇士侧与寻路侧各有一个谓词对象，改一侧不会自动改另一侧；要一致就两边都换。
- 图层必须属于同一数据端：`useMapLayer` 会校验图层来源，不属于当前状态时告警并忽略这次绑定。
- 未注入方向处理器时构图失败：`build` 返回 `null`，`find` 得到 `InvalidInput`；初始化只注入谓词与移动器，图层与方向处理器要在进入楼层时补上。
- 起点越界会告警并返回失败：`build` 先检查起点是否在图层范围内，越界时不会产生图。
- 终端只能作终点：`shouldHit` 标记的格子不能作为路径中间点，只能作为目标格。
- 无路径是正常结果：目标不可达时返回 `NoPath`，不会移动，也不需要特殊处理。
- 目标在脚下不移动：起点与终点相同时直接返回 `TargetUnder`。
- 换楼层要重新绑定图层：绑定的是具体图层对象，换楼层后要换成新楼层的事件层。
- 瞬移会跳过途经格：瞬移分支只落到终点，途经格的进入、离开与撞击都不会发生；需要补触发时用钩子，或用回退策略退回逐步移动。
