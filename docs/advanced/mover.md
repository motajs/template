# 移动 Mover

对象移动是数据端最常见的动作之一：勇士走一步、动态图块被推走、NPC 沿路径巡逻。移动器把「想怎么走」和「实际怎么走」拆开：先用链式调用排出一串移动步骤，再调用 `start()` 按顺序执行；每一步落在哪一格，由移动器的子类决定。

这样拆的好处是同一套执行流程可以服务不同对象。勇士的 `HeroMover` 自己不判定能不能走，它把边界、通行、踩踏与撞击转发给顶层实现对象 `IHeroMoveTopImpl`；动态图块的 `DynamicTileMover` 只把方向换成落点。读这篇不需要先读它们的源码：先会用现成移动器，再看怎么扩展。

数据端只维护坐标与状态，画面上的位移、动画与速度表现由渲染端读取这些状态后完成。渲染端内容用 `渲染端 · 移动表现` 占位。

<!-- TODO(renderer): 移动动画与速度表现 -->

## 三个角色

移动相关的接口都在 `@user/data-common` 的 `mover.ts` 里。三个角色分工明确：

| 接口               | 角色           | 关键成员                                      |
| ------------------ | -------------- | --------------------------------------------- |
| `IObjectMovable`   | 被移动的对象   | `x`、`y`、`setPos`、`getCurrentFaceDirection` |
| `IObjectMover`     | 移动器         | 链式规划、`start()`、状态、钩子               |
| `IMoverController` | 一次执行的句柄 | `done`、`onEnd`、`push`、`insert`、`stop`     |

关系是组合：对象实现 `IObjectMovable`，移动器持有对象（`tile`），并在每一步把新坐标写回对象。`IObjectMover<T>` 本身是一个可挂钩子的对象，`IObjectMoverHooks<T>` 是它对应的钩子族。

`IMoverController` 不是移动器本身，而是 `start()` 返回的一张「这次执行」的凭证。移动结束后仍然可以读它的 `done`，但不能再追加步骤。

## 拿到现成的移动器

多数场景不需要自己 `new` 移动器。引擎已经为两类对象建好了实例：

- `state.hero.location.mover`：勇士位置对象的移动器，类型是 `IHeroMover`。除了通用接口，它还提供 `config`、`getConfig`、`useTopImplementation`。
- 动态图块的 `mover` 字段：类型是 `IObjectMover<IDynamicTile>`，创建动态图块时一并创建；`dynamic.step(dir)` 是它的单步便捷入口。

这两个实例与对象同生命周期。重复 `new` 会得到第二个互不相干的移动器，位置与朝向都会对不上。

`IHeroMover` 的配置有三个字段：

| 字段            | 含义                       |
| --------------- | -------------------------- |
| `ignoreTerrain` | 是否忽略地形碰撞检测       |
| `autoSave`      | 是否在特定时机触发自动存档 |
| `allowOutBound` | 是否允许勇士到达地图之外   |

`config` 只覆盖传入的字段，没传的保持原值；`getConfig` 返回当前配置的只读快照。

### 勇士的顶层实现

`useTopImplementation` 替换的是勇士这一层的行为，不是移动器本身。`IHeroMover` 没有 `stop()`，停止只发生在 `start()` 返回的控制器上。

`HeroMover` 在每一步把信息打包成 `IHeroMoveTopHandler`，交给 `IHeroMoveTopImpl` 判断：

| 方法                     | 返回             | 作用                                                                           |
| ------------------------ | ---------------- | ------------------------------------------------------------------------------ |
| `predicate()`            | `IPassPredicate` | 返回通行性谓词，`HeroMover` 用它判断能否进入、是否撞击（见下文「改通行规则」） |
| `inBound(x, y, floorId)` | `boolean`        | 目标格是否在地图范围内                                                         |
| `enter(handler)`         | `Promise<void>`  | 正常进入目标格后触发                                                           |
| `leave(handler)`         | `Promise<void>`  | 离开当前格时触发                                                               |
| `hit(handler)`           | `Promise<void>`  | 撞到不可进入的目标格时触发                                                     |
| `cannotEnter(handler)`   | `Promise<void>`  | 被判定为无法进入时触发                                                         |

`handler` 里带着 `currLoc`、`nextLoc`、`direction`、`floorId`、`face` 与 `state`，够你在判定里读位置、朝向与状态。引擎内置的 `DefaultHeroMoveTopImpl`（`src/data/hero/moverImpl.ts`）就是默认实现：它用通行谓词与事件系统完成边界判断、进出与撞击触发器。`MainDataPlugin` 在 `awake` 里把它装上：

```ts
// src/data/initialize.ts 的 awake 中
const heroMoveTopImpl = new DefaultHeroMoveTopImpl(state);
state.hero.location.mover.useTopImplementation(heroMoveTopImpl);
```

### 改通行规则：predicate() 与 IPassPredicate

`predicate()` 返回通行性谓词 `IPassPredicate`，真正「能不能走」的判定在它里面。`HeroMover` 先看边界；对方向步（`Dir`、`DirFace` 与 `Special`）再取一次谓词，用它决定本步的结果：

| 方法                 | 作用                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `canPass(handler)`   | 能否从当前格进入目标格；返回 `false` 时本步不移动，走「无法进入」分支 |
| `shouldHit(handler)` | 能进入但会产生撞击时返回 `true`；本步不移动，走「撞击」分支           |

两个方法的参数都是 `IPassCheckHandler`，字段包括 `currLoc`、`nextLoc`、`direction`（本步移动朝向）、`map`（勇士当前地图，可能为 `null`）与 `state`。判定顺序固定：

- `canPass` 为假 → `CannotMove`，不触发 `OnTouch` 撞击事件；
- `canPass` 为真且 `shouldHit` 为真 → `Hit`，触发 `OnTouch`；
- `canPass` 为真且 `shouldHit` 为假 → 正常移动。

两个容易踩空的地方：`config({ ignoreTerrain: true })` 会让 `HeroMover` 跳过整个谓词判断、只剩边界检查，此时改谓词看不到效果；`predicate()` 在每个方向步都会被调用，要返回构造时建好的稳定实例，不要在方法里新建对象（内置实现就是把 `DefaultPassPredicateImpl` 存在字段里）。

寻路用的是同一形状的谓词，但由 `state.pathfinding.finder.usePassPredicate(...)` 独立注入，不会自动跟随勇士的顶层实现。改了勇士的通行规则、又希望寻路一致时，要把同一个谓词再注入给 `finder`，详见[自动寻路](./ii/pathfinding.md)。

想保留默认行为、只改其中一环时，包一层并转发给默认实现，比从头写省事：

```ts
// src/data/hero/moverTop.ts
import { FaceDirection } from '@user/data-common';
import {
    IHeroMoveTopHandler,
    IHeroMoveTopImpl,
    IPassPredicate
} from '@user/data-base';
import { IStateSystem } from '@user/data-system';
import { DefaultHeroMoveTopImpl } from './moverImpl';

/** 保留默认的边界、通行与事件，只禁止向左走，并给撞击加一条日志。 */
export class MyHeroMoveTopImpl implements IHeroMoveTopImpl {
    // 默认实现负责边界、通行谓词与四类事件派发
    private readonly base: DefaultHeroMoveTopImpl;
    // 每步都会调用 predicate()，构造时建好一次，避免每步新建
    private readonly passPredicate: IPassPredicate;

    constructor(state: IStateSystem) {
        this.base = new DefaultHeroMoveTopImpl(state);
        const inner = this.base.predicate();
        this.passPredicate = {
            // [需改] 把这里换成你要拦的条件
            canPass: handler =>
                handler.direction !== FaceDirection.Left &&
                inner.canPass(handler),
            shouldHit: handler => inner.shouldHit(handler)
        };
    }

    predicate(): IPassPredicate {
        return this.passPredicate;
    }

    inBound(x: number, y: number, floorId: string | undefined): boolean {
        return this.base.inBound(x, y, floorId);
    }

    enter(handler: IHeroMoveTopHandler): Promise<void> {
        return this.base.enter(handler);
    }

    leave(handler: IHeroMoveTopHandler): Promise<void> {
        return this.base.leave(handler);
    }

    hit(handler: IHeroMoveTopHandler): Promise<void> {
        // [需改] 撞击时先做自己的事，再交给默认实现触发原有触发器
        console.log('撞到', handler.nextLoc);
        return this.base.hit(handler);
    }

    cannotEnter(handler: IHeroMoveTopHandler): Promise<void> {
        // 接口要求带 handler；默认实现是空实现、用不到它，所以这里不转发
        return this.base.cannotEnter();
    }
}
```

`cannotEnter` 在接口上要收 `IHeroMoveTopHandler`，而 `DefaultHeroMoveTopImpl` 的实现声明为无参空实现（它用不到 handler），所以包装类保留参数、调用基类时不传。要让「无法进入」也触发点什么，就在这个方法里读 `handler` 自己实现，不要指望默认实现。

装配时把它换进勇士移动器：

```ts
// src/data/initialize.ts 的 awake 中，替换掉默认实现
state.hero.location.mover.useTopImplementation(new MyHeroMoveTopImpl(state));
```

这就是勇士的扩展点：`HeroMover` 负责录像登记、坐标写入与步进流程，`IHeroMoveTopImpl` 负责「这一步能不能走、撞到什么、进出触发什么」。给勇士扩展时，优先实现 `IHeroMoveTopImpl` 并通过 `useTopImplementation` 装上；不要为了改通行规则去重写整个移动器，更不要从 `ObjectMover` 起手——`ObjectMover` 只算落点，边界、通行、踩踏、撞击和 `HeroMover` 的配置（含 `autoSave` 开关）都不在里面，勇士会失去这些行为。

勇士位置对象的接口见[勇士位置](../intermediate/hero-location.md)；动态图块的创建、转换与移动见[静态图块与动态图块](./ii/static-vs-dynamic-tiles.md)。

## 排一个移动计划

规划方法是链式的：每次调用追加一个或几个步骤，返回移动器本身，所以可以连着写。规划阶段不会移动对象，对象要等 `start()` 才动。

| 方法                           | 追加的步骤          | 作用                                               |
| ------------------------------ | ------------------- | -------------------------------------------------- |
| `step(dir, count?)`            | `Dir`               | 朝 `dir` 走 `count` 格，同时更新移动朝向与面朝朝向 |
| `stepFace(move, face, count?)` | `DirFace`           | 朝 `move` 走，面朝朝向显式设为 `face`              |
| `forward(count?)`              | `Special(Forward)`  | 沿当前面朝朝向前进                                 |
| `backward(count?)`             | `Special(Backward)` | 沿当前面朝朝向的反方向后退，面朝朝向不变           |
| `face(dir)`                    | `Face`              | 只转向，不移动                                     |
| `tp(x, y, rel?)`               | `Teleport`          | 瞬移到目标格                                       |
| `jump(x, y, rel?)`             | `Jump`              | 跳跃到目标格                                       |
| `speed(value)`                 | `Speed`             | 设置后续移动的每格耗时，单位 ms                    |
| `animDir(dir)`                 | `AnimDir`           | 设置后续步骤的动画播放方向                         |
| `push(steps)`                  | 一组步骤            | 把预先拼好的 `ObjectMoveStep` 数组原样追加         |
| `clear()`                      | 无                  | 清空尚未执行的队列                                 |

`step` 的 `count` 默认是 1。传 2 会追加两个 `Dir` 步骤，逐步执行，不是把一步拆成两格。`stepFace` 把移动朝向与面朝朝向分开，适合「侧身走」这类表现。

`forward` 与 `backward` 是相对步，都以当前的面朝朝向（`faceDirection`）为基准：`forward` 直接朝面朝朝向走，`backward` 朝面朝朝向的反方向走并保持朝向不变，所以连续后退会一直沿同一条轴线，不会因为上一步写入的反方向而左右摆动。

`tp` 与 `jump` 的 `rel` 省略时为 `false`，`x`、`y` 是目标格坐标；`rel` 为 `true` 时，`x`、`y` 是相对当前位置的偏移。数据端上两者都是直接落到目标格，区别只在步骤类型，渲染端可以据此播放不同的表现。

`speed` 与 `animDir` 只是写移动器状态，本身不产生位移。`speed` 的单位是毫秒每格，初始 `currentSpeed` 为 `100`；`animDir` 设置 `ObjectAnimDirection.Forward` 或 `Backward`。真正让速度与动画方向「看得见」的是渲染端。

`mover.push(steps)` 接收的是步骤对象数组，适合把循环生成或从别处收集来的步骤一次加入；`controller.push(...steps)` 是可变参数，直接把步骤对象逐个传入。两者名字相同、形状不同，别把数组塞给控制器。`clear` 只清空尚未执行的队列，不影响正在执行的那一次。

## 执行与等待

`start()` 把当前待执行队列取出来执行，并返回 `IMoverController`；如果移动器已经在移动，返回 `null`，不会接管当前移动。

返回 `null` 时它连队列都没有动过：既不切片也不清空，你刚排的步骤原样留在移动器里。等当前这次结束后再调用 `start()`，它们会照常执行；不想执行就用 `clear()` 丢掉。不要以为 `start()` 失败会把刚排的步骤一起清掉。

```ts
import { FaceDirection } from '@user/data-common';
import { ICoreState } from '@user/data-state';

async function walkRightThenDown(state: ICoreState): Promise<void> {
    const mover = state.hero.location.mover;
    const before = state.hero.getLocation();

    // [需改] 按需求换成你要的步数与方向
    mover
        .step(FaceDirection.Right, 2) // 向右两格
        .face(FaceDirection.Down) // 只转向，不移动
        .step(FaceDirection.Down); // 向下一格

    const controller = mover.start();
    if (!controller) {
        // 上一次移动还没结束；这里直接放弃，避免和它抢位置
        return;
    }

    // done 在整次执行结束时才变 true
    console.log('开始', controller.done); // false
    await controller.onEnd;
    console.log('结束', controller.done); // true

    const after = state.hero.getLocation();
    console.log('前', before.x, before.y, '后', after.x, after.y);
}
```

`onEnd` 是整次执行结束时兑现的 Promise，`done` 是同一时点的布尔查询。等待优先用 `await controller.onEnd`；`done` 适合在同步代码里快速判断。`onEnd` 只在整次执行正常跑完时才兑现，任何一步或任一钩子抛错都会让它永远悬着，见「边界与注意」。

`start()` 会做三件事：把当前队列切片成本次执行的局部队列、清空移动器内部的待执行队列、把 `moveDirection` 重置为 `Unknown`。因此执行期间再用移动器规划，写的是「下一次」的队列，不是本次。

`moveDirection` 被重置这一点与 `forward()` 无关：`forward()` 沿的是面朝朝向（`faceDirection`），而面朝朝向不随 `start()` 清空。被清空的只有移动朝向（`moveDirection`），所以只有需要读 `moveDirection` 的自定义逻辑，才要先在本计划里用 `step` 或 `stepFace` 把它确定下来。

## 执行中追加、插入与停止

`controller` 才是当前这次执行的入口。`push` 与 `insert` 只在「仍在移动、没有调用过 `stop`、尚未 `done`」时生效，其余情况静默忽略；`stop()` 则总是把停止标记置真并返回本次的 `onEnd`：

- `push(...steps)`：追加到本次队列末尾。
- `insert(...steps)`：插到当前步之后。当前步已经从队列取出，所以实际是插到剩余队列的最前面；多个步骤按参数顺序排列。
- `stop()`：把内部停止标记置真，返回本次的 `onEnd`；当前步会走完，之后不再开始新步骤。

```ts
import { FaceDirection, ObjectMoveType } from '@user/data-common';
import { ICoreState } from '@user/data-state';

async function extendWhileMoving(state: ICoreState): Promise<void> {
    const controller = state.hero.location.mover
        .step(FaceDirection.Right, 2)
        .start();
    if (!controller) return;

    // 执行已经开始，但还没结束；追加的步骤会进入本次队列
    controller.push({ type: ObjectMoveType.Dir, move: FaceDirection.Down });

    await controller.onEnd;
}
```

这里有一条容易踩的边界：执行期间在移动器上调用 `step`、`face`、`speed` 等方法，只会写回移动器内部的待执行队列，本次执行不会消费它们。执行中要追加，只能用 `controller.push` 或 `controller.insert`。

`stop()` 的停止检查发生在每轮循环开头，所以不会打断正在执行的这一步。如果第一步还没开始就调用 `stop()`，循环会在开始第一步之前退出，结果是一步都不走；如果在某一步执行中调用，当前步会走完再停。

```ts
import { FaceDirection } from '@user/data-common';
import { ICoreState } from '@user/data-state';

async function stopBeforeFirstStep(state: ICoreState): Promise<void> {
    const controller = state.hero.location.mover
        .step(FaceDirection.Right, 3)
        .start();
    if (!controller) return;

    // 立即停止：当前还没有步骤真正开始，通常一步都不走
    await controller.stop();
}
```

在步进方法或步进钩子里调用 `stop()` 时不要 `await` 它返回的 Promise。它要等当前步结束才兑现，`await` 会把整次移动卡死。内置的 `HeroMover` 在撞击、无法进入等分支里就是直接调用、不等待。

停止后 `done` 会变真，本次控制器不能再追加。想继续走，要重新排计划并再次 `start()`。

## 步骤类型

规划方法只是往队列里放对象；移动器真正面对的是 `ObjectMoveStep` 联合类型。八种步骤对应 `ObjectMoveType` 的八个成员：

| `type`                    | 字段                                                  | 效果                                  |
| ------------------------- | ----------------------------------------------------- | ------------------------------------- |
| `ObjectMoveType.Dir`      | `move`                                                | 走向 `move`，移动朝向与面朝朝向都更新 |
| `ObjectMoveType.DirFace`  | `move`、`face`                                        | 走向 `move`，面朝朝向设为 `face`      |
| `ObjectMoveType.Speed`    | `value`                                               | 设置后续每格耗时                      |
| `ObjectMoveType.Face`     | `value`                                               | 只改面朝朝向                          |
| `ObjectMoveType.Special`  | `direction`：`ObjectSpecialStep.Forward` / `Backward` | 前进或后退                            |
| `ObjectMoveType.AnimDir`  | `dir`：`ObjectAnimDirection.Forward` / `Backward`     | 设置动画播放方向                      |
| `ObjectMoveType.Teleport` | `x`、`y`、`rel`                                       | 瞬移                                  |
| `ObjectMoveType.Jump`     | `x`、`y`、`rel`                                       | 跳跃                                  |

`Speed` 与 `AnimDir` 不产生位移，`Face` 只改面朝朝向。它们的状态更新由基类在每步开始前完成，自定义移动器只需要在计算落点时知道「这几类不移动」。

自定义移动器必须自己处理这些 `type`：至少要知道每个类型该返回什么落点。没有识别的类型不要抛错，原样返回当前坐标即可，这样未知步骤表现为原地不动。

`ObjectSpecialStep` 与 `ObjectAnimDirection` 都是 `const enum`，分别表示前进 / 后退与正向 / 反向播放。

## 移动器状态

移动器把一次执行需要的状态都放在自己身上：

| 成员            | 含义         | 说明                                                   |
| --------------- | ------------ | ------------------------------------------------------ |
| `moving`        | 是否正在移动 | `start()` 后为真，整次结束才回到假                     |
| `tile`          | 绑定的对象   | 构造时传入                                             |
| `faceDirection` | 面朝朝向     | 由步骤或 `setFaceDir` 更新                             |
| `moveDirection` | 移动朝向     | 由步骤或 `setMoveDir` 更新，`start()` 重置为 `Unknown` |
| `currAnimDir`   | 当前动画方向 | 初始为 `ObjectAnimDirection.Forward`                   |
| `currentSpeed`  | 当前每格耗时 | 单位毫秒，初始为 `100`                                 |
| `faceHandler`   | 朝向处理器   | 构造时传入，负责方向与偏移的换算                       |

<strong>面朝朝向（`faceDirection`）</strong>指对象「脸朝哪」，<strong>移动朝向（`moveDirection`）</strong>指「这一步往哪走」，两者是不同的概念，不要混用。`step` 会让两者一起更新；`stepFace` 与 `backward` 会让两者不同，例如向右走但脸朝上，或者朝下后退时移动朝向是上。`forward()` 沿的是面朝朝向，而不是移动朝向。

`IObjectMover.forward` 的源码注释写的是「沿当前移动方向」，这里指的是**面朝朝向**：`forward` 读的是 `faceDirection`，不是 `moveDirection`。同理，`onSetMoveDir` 注释里的「设置朝向」指设置**移动朝向**。源码实现与这个理解一致，不要把它当成 bug 去改。

`speed` 与 `animDir` 往队列里放的是步骤，真正写入 `currentSpeed`、`currAnimDir` 是在这一步执行时；执行后状态留在移动器上，`start()` 不会恢复默认值，所以会带到下一次移动。勇士的 `config` 也是立即写入且不重置。想每次都从默认值开始，就在排计划时显式写 `speed(100)`、`animDir(ObjectAnimDirection.Forward)` 与对应的 `config`。

`setPos`、`setFaceDir`、`setMoveDir` 与链式规划不同：它们立即生效、不排队。`setPos` 直接写对象坐标，`setFaceDir` 直接改面朝朝向，`setMoveDir` 直接改移动朝向。三者分别触发 `onSetPos`、`onSetFaceDir`、`onSetMoveDir` 钩子。

移动过程中的落点写入由基类直接调用 `tile.setPos`，不经过移动器的 `setPos`，所以不会触发 `onSetPos`。`onSetPos` 只对应你显式调用移动器 `setPos` 的那一次。

## 钩子

`IObjectMoverHooks<T>` 是移动器上的钩子族，泛型参数就是被移动的对象类型。用 `mover.addHook(...)` 注册，用返回的控制器 `unload()` 或 `removeHook(...)` 移除，规则与其它钩子一致，见[钩子深入](./hooks-in-depth.md)。

| 钩子           | 触发时机                              | 参数                            | 异步 |
| -------------- | ------------------------------------- | ------------------------------- | ---- |
| `onMoveStart`  | 整次移动开始，子类 `onMoveStart` 之后 | `tile`、`mover`                 | 是   |
| `onMoveEnd`    | 整次移动结束，子类 `onMoveEnd` 之后   | `tile`、`mover`                 | 是   |
| `onStepStart`  | 单步开始前，坐标仍是移动前            | `code`、`step`、`tile`、`mover` | 是   |
| `onStepEnd`    | 单步结束，坐标已更新                  | `code`、`step`、`tile`、`mover` | 是   |
| `onSetPos`     | 调用移动器 `setPos` 时                | `x`、`y`、`tile`、`mover`       | 否   |
| `onSetFaceDir` | 调用移动器 `setFaceDir` 时            | `dir`、`tile`、`mover`          | 否   |
| `onSetMoveDir` | 调用移动器 `setMoveDir` 时            | `dir`、`tile`、`mover`          | 否   |

`onSetFaceDir` 的 `dir` 是面朝朝向（`faceDirection`），`onSetMoveDir` 的 `dir` 是移动朝向（`moveDirection`）。

几条与使用直接相关的时序：

- `onStepStart` 触发时坐标还是移动前，`onStepEnd` 触发时坐标已经写入对象。两者之间是子类 `onStepEnd` 计算落点、基类写坐标、`onStepSettled` 运行。
- `code` 是子类 `onStepStart` 返回的数字。它会被传给 `onStepStart` 钩子、子类 `onStepEnd` 与 `onStepEnd` 钩子；基类不解释它的含义，由子类自己约定。
- 前四个钩子返回 `Promise`，引擎用 `Promise.all` 并发等待。完成顺序不等于注册顺序；需要顺序时，把有依赖的步骤写进同一个钩子按 `await` 串行。细节见[钩子深入](./hooks-in-depth.md#异步钩子)。
- `onSetPos`、`onSetFaceDir`、`onSetMoveDir` 是同步的，返回 `void`，并且只由对应的 setter 触发。

## 实现自己的移动器

只有现成的 `HeroMover` 与 `DynamicTileMover` 不满足需求时，才需要自己写。例如新对象有自己的落点规则、需要在每一步前后做额外处理，或者要换一套结果码。

`ObjectMover` 是移动器基类，负责队列、控制器、状态更新、钩子分发与坐标回写。子类只需要实现五个 `protected` 方法，决定每一步「能不能走、落到哪、落完之后做什么」。

如果想给自己的对象接上移动器，可以参考下面的模板。模板用 `SimpleMover` 作为类名，用 `SimpleMoveCode` 作为结果码；`[需改]` 标出需要按需求替换的部分。

```ts
import {
    FaceDirection,
    IMoverController,
    IObjectMovable,
    ObjectMover,
    ObjectMoveStep
} from '@user/data-common';
import { IFaceHandler, ITileLocator } from '@motajs/common';

// 自定义结果码：onStepStart 返回，onStepEnd 与钩子都会收到
const enum SimpleMoveCode {
    /** 这一步可以执行 */
    Success,
    /** 这一步不执行，保持原地 */
    Blocked
}

// 模板：自定义移动器。T 换成你自己的可移动对象类型
export class SimpleMover<T extends IObjectMovable> extends ObjectMover<T> {
    constructor(
        readonly tile: T,
        faceHandler: IFaceHandler<FaceDirection>
    ) {
        // 初始朝向取对象当前朝向；之后由每一步的 prepareStep 维护
        super(faceHandler, tile.getCurrentFaceDirection());
    }

    // [需改] 整次移动开始时执行；没有额外逻辑可以留空
    protected async onMoveStart(
        tile: T,
        controller: Readonly<IMoverController>
    ): Promise<void> {}

    // [需改] 整次移动结束时执行
    protected async onMoveEnd(
        tile: T,
        controller: Readonly<IMoverController>
    ): Promise<void> {}

    // [需改] 单步开始：检查这一步能否执行，返回结果码
    protected async onStepStart(
        step: Readonly<ObjectMoveStep>,
        tile: T,
        controller: Readonly<IMoverController>
    ): Promise<number> {
        return SimpleMoveCode.Success;
    }

    // [需改] 单步结束：返回这一步的落点；坐标由基类写入
    protected async onStepEnd(
        code: number,
        step: Readonly<ObjectMoveStep>,
        tile: T,
        controller: Readonly<IMoverController>
    ): Promise<ITileLocator> {
        if (code !== SimpleMoveCode.Success) {
            return { x: tile.x, y: tile.y };
        }

        // 模板先原地不动；按 step.type 换成你的落点规则
        return { x: tile.x, y: tile.y };
    }

    // [需改] 单步已结束、坐标已写入之后执行；要在这里写状态就补 @shouldReplay（见示例）
    protected async onStepSettled(
        before: ITileLocator,
        curr: ITileLocator,
        tile: T,
        step: Readonly<ObjectMoveStep>,
        controller: Readonly<IMoverController>
    ): Promise<void> {}
}
```

五个方法的职责：

- `onMoveStart` 与 `onMoveEnd` 包住整次执行，分别在第一步之前与最后一步之后运行，返回的 Promise 会被等待。
- `onStepStart` 在每步开始前运行。此时基类已经更新过移动朝向、面朝朝向、速度与动画方向，但坐标还没变。它返回本步的结果码，供后面的逻辑与钩子使用。
- `onStepEnd` 计算这一步的落点，返回一个 `ITileLocator`。基类拿它和当前坐标比较，不同才调用 `tile.setPos`。不要在这里自己写坐标。
- `onStepSettled` 在坐标写入之后运行，参数里带着移动前坐标 `before` 与落点 `curr`。这里适合触发进入 / 离开 / 踩踏一类的事件，或者把朝向同步回对象。
- 五个方法都是 `protected` 抽象方法，外部代码不能直接调用，子类必须实现。对外是链式方法、`start()`、三个 setter 与几个只读状态。
- 基类里的 `prepareStep` 与 `moveProgress` 是 `private`，子类既不能覆写也不能调用。`prepareStep` 每步会把 `moveDirection`、`faceDirection`、`currAnimDir`、`currentSpeed` 按步骤更新好，子类读这些状态即可。
- `faceHandler`、`moveDirection`、`faceDirection` 在 `IObjectMover` 接口上都是 `readonly`，按只读使用。手动改它们不会改变流程，还会被下一步的 `prepareStep` 覆盖。

模板本身不写状态，所以没有加 `@shouldReplay`。你的实现一旦在某个方法里改状态（写朝向、写对象、派发事件），就按示例把标记加在那个方法上；原因与放置规则见下文「与录像、存档的关系」。

## 示例：一个最小可移动对象

把模板的类型参数固定成 `SimpleTile`，只让四方向与瞬移产生位移，就得到一个能跑的最小移动器。下面两段可以放在同一个文件，也可以拆成两个文件；拆开时按第二段的 `import` 引入。

```ts
import { FaceDirection, IObjectMovable } from '@user/data-common';

// 最小可移动对象：只保存坐标与朝向
export class SimpleTile implements IObjectMovable {
    constructor(
        public x: number,
        public y: number,
        private direction: FaceDirection = FaceDirection.Down
    ) {}

    // IObjectMovable：移动器在落点确定后通过它写回坐标
    setPos(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    // IObjectMovable：移动器构造时读取初始朝向
    getCurrentFaceDirection(): FaceDirection {
        return this.direction;
    }

    // 不在 IObjectMovable 里：移动器在 onStepSettled 把朝向写回对象
    setFaceDirection(dir: FaceDirection): void {
        this.direction = dir;
    }
}
```

```ts
import {
    FaceDirection,
    IMoverController,
    ObjectMover,
    ObjectMoveStep,
    ObjectMoveType,
    shouldReplay
} from '@user/data-common';
import { IFaceHandler, ITileLocator } from '@motajs/common';
import { SimpleTile } from './simple-tile';

const enum SimpleMoveCode {
    /** 这一步可以执行 */
    Success,
    /** 这一步不执行，保持原地 */
    Blocked
}

// 只处理四方向与瞬移的最小移动器
export class SimpleMover extends ObjectMover<SimpleTile> {
    constructor(
        readonly tile: SimpleTile,
        faceHandler: IFaceHandler<FaceDirection>
    ) {
        super(faceHandler, tile.getCurrentFaceDirection());
    }

    protected async onMoveStart(
        tile: SimpleTile,
        controller: Readonly<IMoverController>
    ): Promise<void> {}

    protected async onMoveEnd(
        tile: SimpleTile,
        controller: Readonly<IMoverController>
    ): Promise<void> {}

    protected async onStepStart(
        step: Readonly<ObjectMoveStep>,
        tile: SimpleTile,
        controller: Readonly<IMoverController>
    ): Promise<number> {
        // 跳跃不在最小实现里；其余步骤都放行
        if (step.type === ObjectMoveType.Jump) {
            return SimpleMoveCode.Blocked;
        }
        return SimpleMoveCode.Success;
    }

    protected async onStepEnd(
        code: number,
        step: Readonly<ObjectMoveStep>,
        tile: SimpleTile,
        controller: Readonly<IMoverController>
    ): Promise<ITileLocator> {
        if (code !== SimpleMoveCode.Success) {
            return { x: tile.x, y: tile.y };
        }

        switch (step.type) {
            case ObjectMoveType.Dir:
            case ObjectMoveType.DirFace:
            case ObjectMoveType.Special: {
                // 方向 → 偏移：moveDirection 已由基类按步骤内容算好
                const { x, y } = this.faceHandler.movement(this.moveDirection);
                return { x: tile.x + x, y: tile.y + y };
            }
            case ObjectMoveType.Teleport: {
                // rel 为 true 时，x / y 表示相对当前位置的偏移
                const nx = step.rel ? tile.x + step.x : step.x;
                const ny = step.rel ? tile.y + step.y : step.y;
                return { x: nx, y: ny };
            }
            default:
                // Face / Speed / AnimDir 不产生位移
                return { x: tile.x, y: tile.y };
        }
    }

    // 这里写回朝向，属于状态变更，所以要标 @shouldReplay
    @shouldReplay('Simple tile facing should be replayed.')
    protected async onStepSettled(
        before: ITileLocator,
        curr: ITileLocator,
        tile: SimpleTile,
        step: Readonly<ObjectMoveStep>,
        controller: Readonly<IMoverController>
    ): Promise<void> {
        // 坐标已经写入 tile，这里把朝向同步给对象
        tile.setFaceDirection(this.faceDirection);
    }
}
```

这段示例把「方向 → 偏移 → 落点」串了起来：`faceHandler.movement(this.moveDirection)` 给出单格的坐标偏移，加到 `tile.x`、`tile.y` 上就是落点；基类拿到落点后负责写入坐标。

通行判断不在移动器基类里。`SimpleMover` 不检查目标格能不能进、有没有墙，也不触发踩踏事件，它只回答「这一步落到哪」。`HeroMover` 也一样：它登记录像、写坐标、跑流程，但自己不判定通行，而是把判定与进出/撞击事件转发给顶层实现对象（见前文「勇士的顶层实现」）。

把对象与移动器接起来：

```ts
import { Dir4FaceHandler, FaceDirection } from '@user/data-common';
import { SimpleMover } from './simple-mover';
import { SimpleTile } from './simple-tile';

async function runSimpleMover(): Promise<void> {
    const tile = new SimpleTile(3, 4, FaceDirection.Down);
    // 四方向对象配四方向处理器；八方向换成 Dir8FaceHandler
    const mover = new SimpleMover(tile, new Dir4FaceHandler());

    const controller = mover.step(FaceDirection.Right, 2).start();
    if (!controller) return;

    await controller.onEnd;
    console.log(tile.x, tile.y); // 5, 4
}
```

`faceHandler` 决定方向体系。四方向对象要配四方向处理器，八方向对象配八方向处理器；混用会让偏移与朝向对不上。朝向处理器本身的接口与自定义方式见[FaceHandler 系列](./face-handler.md)。

## 接进插件与真实对象

自定义移动器与朝向处理器都要在数据端插件的 `awake` 里装配，依赖加载后配置或已创建对象的放到 `afterLoad`。

- <strong>处理器</strong>：`state.faceManager.register(...)` 放进 `awake`，见[FaceHandler 系列](./face-handler.md#实现自己的朝向处理器)。
- <strong>勇士的规则</strong>：`state.hero.location.mover.useTopImplementation(...)` 是公开的替换点；移动器实例本身由 `createLocation` 创建，没有公开 setter。
- <strong>动态图块</strong>：`mover` 在 `DynamicTile` 构造时随对象创建，只读；需要整套换掉时，在自己的对象创建流程里构造替代实例，而不是事后改字段。
- <strong>生命周期</strong>：移动器与对象同生命周期，不需要卸载；钩子用 `unload()` 移除。移动器上的状态不进入存档，位置由 `IHeroLocationSave` 保存；自定义的额外状态要做成可存档内容，见[可存档内容](./saveable-content.md)。

```ts
// src/data/plugin/my-plugin/plugin.ts 的 awake 中
state.hero.location.mover.useTopImplementation(new MyHeroMoveTopImpl(state));
```

这段放 `awake` 还是 `afterLoad` 取决于依赖：`DefaultHeroMoveTopImpl` 只用到 `state`，`awake` 就够；如果装配需要加载后的配置或已创建的对象，放到 `afterLoad`。

## 与录像、存档的关系

`HeroMover` 在 `onStepStart`、`onStepEnd`、`onStepSettled` 上都标了 `@shouldReplay`，因为这三个方法体里都有写入或副作用：`onStepStart` 登记录像码，`onStepEnd` 与 `onStepSettled` 会调用顶层实现触发事件。`DynamicTileMover` 只标 `onStepEnd`，因为它在那里面写回朝向并算出落点。

自定义移动器同理：标在方法体里真正写状态的那一个，而不是「看起来最关键」的那一个。判断标准很直接：这个方法体里有没有写操作。

- `onStepEnd` 只返回落点，坐标由基类在它返回后写入；方法体里没有写入时，标它没有意义。
- 在 `onStepSettled` 里调用 `tile.setFaceDirection(...)` 把朝向写回对象，写入就在这里，要标 `onStepSettled`。
- 方法体里既有落点计算又有写入（内置 `DynamicTileMover.onStepEnd` 就是这种），标 `onStepEnd`。

不要标在只读查询上。标记的具体含义、检测能保证什么与不能保证什么，见[录像一致性](./replay-consistency.md)。

位置本身是存档内容。`IHeroLocationSave` 保存 `x`、`y`、`direction`、`floorId`；移动过程不会为每一步写存档，读档后恢复的是位置结果，不是「正在走第几步」。因此不要在移动器里另存一份位置状态，否则读档后容易与对象本身不一致。

## 内部执行流程

此章节讲解一下移动器的内部执行流程。下面按 `ObjectMover` 的源码顺序说明，只讲与使用相关的时序，不逐行翻译实现。

`start()` 的步骤：

1. 如果 `moving` 为真，直接返回 `null`。
2. 把 `moveQueue` 切片成本次的局部队列 `queue`，再清空内部队列。
3. 把 `shouldStop` 置假，把 `moveDirection` 重置为 `Unknown`。
4. 创建控制器：`done` 初始为假，`onEnd` 是待兑现的 Promise；`push` 与 `insert` 操作的是局部队列 `queue`，`stop` 把 `shouldStop` 置真并返回 `onEnd`。
5. 把 `moving` 置真，启动 `moveProgress(queue, controller)`。
6. `moveProgress` 结束时，把 `moving` 置假、`done` 置真，并兑现 `onEnd`。

`moveProgress` 的顺序：

1. 子类 `onMoveStart`，然后钩子 `onMoveStart`，用 `Promise.all` 等待。
2. 循环取步：从 `queue` 头部取一步；如果取不到、`moving` 已为假或 `shouldStop` 为真，退出循环。
3. 调用 `prepareStep`，同步更新 `moveDirection`、`faceDirection`、`currAnimDir`、`currentSpeed`。
4. 子类 `onStepStart` 返回结果码 `code`。
5. 钩子 `onStepStart`，收到 `code`，用 `Promise.all` 等待。
6. 子类 `onStepEnd` 返回落点 `ITileLocator`。
7. 记录移动前坐标 `before` 与落点 `curr`；坐标不同时才调用 `tile.setPos`。这里调用的是对象的方法，不经过移动器的 `setPos`。
8. 子类 `onStepSettled(before, curr, ...)`。
9. 钩子 `onStepEnd`，收到 `code`，用 `Promise.all` 等待。
10. 回到循环开头，直到队列空或被停止。
11. 子类 `onMoveEnd`，然后钩子 `onMoveEnd`，用 `Promise.all` 等待。

因为 `controller.push` 与 `controller.insert` 改的就是局部队列 `queue`，它们能影响本次执行；而 `mover.step`、`mover.face` 等方法写的是内部待执行队列，局部队列不会读它，所以执行期间无效。

`shouldStop` 的检查点在每轮循环开头。当前步的 `onStepStart`、`onStepEnd`、`onStepSettled` 与两组钩子都会走完，才在下一轮退出。这就是 `stop()` 不打断当前步的原因。

## 边界与注意

- <strong>start 返回 null</strong>：移动器已经在移动时不会接管，此时也没有新的控制器可操作。要等或要停，只能用上一次 `start()` 保存的 `controller`：`await controller.onEnd`，或调用 `controller.stop()`。`IHeroMover` 没有 `stop()`，不要在移动器上找。返回 `null` 时刚排的步骤没有被消费，仍留在移动器里，下一次 `start()` 会执行；不要就用 `clear()`。
- <strong>moveDirection 被重置</strong>：`start()` 把移动朝向（`moveDirection`）设为 `Unknown`，面朝朝向（`faceDirection`）不受影响；`forward()` 用的是面朝朝向，不依赖这次重置。
- <strong>执行期间链式方法无效</strong>：`mover.step`、`mover.face`、`mover.speed` 等写的是下一次的队列；执行中追加只能用 `controller.push` 或 `controller.insert`。
- <strong>stop 不立刻中断</strong>：当前步会走完。第一步还没开始时调用，可能一步都不走。
- <strong>不要在步进方法里 await stop</strong>：`stop()` 返回的 Promise 要等当前步结束才兑现，在步进方法或步进钩子里 `await` 会卡死整次移动。
- <strong>步进方法或钩子抛错会卡住移动器，而且没有恢复入口</strong>：`ObjectMover` 没有为执行 Promise 兜底；任何一步或任一钩子抛错，`onEnd` 都不再兑现、`done` 保持假、`moving` 保持真，之后的 `start()` 会一直返回 `null`，这次拒绝也没有被捕获，会以未处理的 Promise 拒绝暴露出来。`moving` 对外是只读状态，`IHeroMover` / `IObjectMover` 没有重置或强制结束的方法；`controller.stop()` 只能置停止标记，无法兑现那个已经被拒绝的 Promise。结论是运行期没有恢复路径，只能重建数据端（重新创建对象与移动器）。要避免它：自定义步进方法与钩子把预期内的失败转成结果码或内部标记，用 `try` / `catch` 包住可能抛错的外部调用，不要让它冒泡。
- <strong>setPos 不触发步进钩子</strong>：移动器的 `setPos` 只触发 `onSetPos`，不触发 `onStepStart` / `onStepEnd`；移动过程中的落点写入也不会触发 `onSetPos`。
- <strong>speed 与 animDir 只是状态</strong>：它们不产生位移。没有消费方读取时，设置速度与动画方向不会产生可见效果。
- <strong>faceHandler 必须与对象方向体系一致</strong>：四方向对象配八方向处理器，或反过来，都会让偏移与朝向对不上。
- <strong>通行判断不在移动器里</strong>：移动器只算落点。能不能走、撞到什么、踩到什么，由调用方的规则决定。
- <strong>控制器追加可能被忽略</strong>：已经 `stop` 或 `done` 之后，`controller.push` 与 `controller.insert` 静默不生效。
- <strong>不要重复 new 现成移动器</strong>：`state.hero.location.mover` 与动态图块的 `mover` 与对象同生命周期，另建一个不会同步位置与朝向。

## 怎么验证

先排一个固定的四步计划：向右两格、转向、向下一格，观察坐标、`done` 与钩子顺序：

```ts
import { FaceDirection, IObjectMoverHooks } from '@user/data-common';
import { IHeroLocation } from '@user/data-base';
import { ICoreState } from '@user/data-state';

// 打印钩子顺序：期望 onMoveStart → 每步 onStepStart → onStepEnd → onMoveEnd
class MoveOrderHooks implements IObjectMoverHooks<IHeroLocation> {
    async onMoveStart(): Promise<void> {
        console.log('onMoveStart');
    }

    async onStepStart(code: number): Promise<void> {
        console.log('onStepStart', code);
    }

    async onStepEnd(code: number): Promise<void> {
        console.log('onStepEnd', code);
    }

    async onMoveEnd(): Promise<void> {
        console.log('onMoveEnd');
    }
}

async function verifyPlan(state: ICoreState): Promise<void> {
    const mover = state.hero.location.mover;
    // 注册钩子后保存控制器，验证结束再卸载
    const hookController = mover.addHook(new MoveOrderHooks());

    const before = state.hero.getLocation();
    const controller = mover
        .step(FaceDirection.Right, 2)
        .face(FaceDirection.Down)
        .step(FaceDirection.Down)
        .start();

    if (!controller) {
        hookController.unload();
        return;
    }

    console.log('done before end', controller.done); // false
    await controller.onEnd;
    console.log('done after end', controller.done); // true

    const after = state.hero.getLocation();
    console.log('before', before.x, before.y, 'after', after.x, after.y);

    hookController.unload();
}
```

预期：`done` 从假变真；整次共四个步骤（`Dir`、`Dir`、`Face`、`Dir`），坐标先水平移动两格，再向下移动一格；钩子顺序与表中一致，且每一步的 `onStepStart` 都在对应的 `onStepEnd` 之前。

再验证执行中追加：调用 `start()` 后立刻 `controller.push` 一个 `Dir` 步骤，观察最终坐标是否多走了这一步。如果改用 `mover.step` 追加，最终坐标不会包含它，因为那是下一次执行的队列。

最后验证停止：在 `onStepEnd` 钩子里调用 `controller.stop()`，观察移动是否在当前步结束时停下。不要把 `stop()` 的 Promise 在钩子里 `await`，否则会卡住。

```ts
import {
    FaceDirection,
    IMoverController,
    IObjectMoverHooks
} from '@user/data-common';
import { IHeroLocation } from '@user/data-base';
import { ICoreState } from '@user/data-state';

// 在第一步结束时叫停；不要 await stop() 返回的 Promise
class StopAfterOneStep implements IObjectMoverHooks<IHeroLocation> {
    controller: Readonly<IMoverController> | null = null;

    async onStepEnd(): Promise<void> {
        this.controller?.stop();
    }
}

async function verifyStop(state: ICoreState): Promise<void> {
    const mover = state.hero.location.mover;
    const hook = new StopAfterOneStep();
    const hookController = mover.addHook(hook);

    const before = state.hero.getLocation();
    const controller = mover.step(FaceDirection.Right, 3).start();
    if (!controller) {
        hookController.unload();
        return;
    }

    // start() 返回时第一步还没结束，这里补上控制器引用
    hook.controller = controller;
    await controller.onEnd;

    const after = state.hero.getLocation();
    console.log('只应移动一格', after.x - before.x);
    hookController.unload();
}
```

预期：坐标只变化一格，`done` 为真，控制器上的后续追加不再生效。

返回[高级 I 导览](./index.md)。
