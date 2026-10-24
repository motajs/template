# 移动 Mover

对象移动是数据端最常见的动作之一：勇士走一步、动态图块被推走、NPC 沿路径巡逻。移动器把「想怎么走」和「实际怎么走」拆开：先用链式调用排出一串移动步骤，再调用 `start()` 按顺序执行。

数据端只维护坐标与状态，画面上的位移、动画与速度表现由渲染端读取这些状态后完成。

<!-- TODO(renderer): 移动动画与速度表现 -->

## 移动器模型

移动器（mover）把一个**可移动对象**和一份**移动计划**绑在一起，按计划逐步推动对象。

- **可移动对象**实现 `IObjectMovable`，只提供坐标与朝向：`x`、`y`、`setPos`、`getCurrentFaceDirection`。勇士的位置对象与动态图块都是这种对象。
- **移动计划**是一串步骤。一个步骤只描述一件小事：朝某个方向走、只转向、瞬移、跳跃、改速度或改动画方向。`step`、`face`、`tp` 这些规划方法只往队列里追加步骤，不会立刻移动对象。
- **执行**由 `start()` 发起：它取出待执行队列并逐步执行，每一步算出落点，再把新坐标写回对象。`start()` 返回本次执行的控制器 `IMoverController`；用 `onEnd` 等待整次结束，用 `push` / `insert` 在执行中追加步骤，用 `stop` 提前收尾。

整次执行里有两个方向：**面朝朝向**（`faceDirection`，对象脸朝哪）与**移动朝向**（`moveDirection`，这一步往哪走）。多数步骤让两者一致；侧身走、后退时两者会分开。二者的具体差别见后文「读取与设置状态」。

移动器只负责「这一步落到哪」，不判断目标格能不能进入、撞到什么。通行规则、进入 / 离开 / 撞击事件与地图边界由调用方的规则层决定；勇士的规则见后文「勇士的顶层实现」。

移动相关的接口由 `@user/data-common` 提供，三个角色分工明确：

| 接口               | 角色           | 关键成员                                      |
| ------------------ | -------------- | --------------------------------------------- |
| `IObjectMovable`   | 被移动的对象   | `x`、`y`、`setPos`、`getCurrentFaceDirection` |
| `IObjectMover`     | 移动器         | 链式规划、`start()`、状态、钩子               |
| `IMoverController` | 一次执行的句柄 | `done`、`onEnd`、`push`、`insert`、`stop`     |

多数场景只需要碰后两者：拿现成的移动器排队、执行、等待。

## 拿到现成的移动器

不要自己 `new` 勇士或动态图块的移动器：它们由引擎随对象创建，与对象同生命周期。重复 `new` 会得到第二个互不相干的移动器，位置与朝向都会对不上。

### 勇士

`state.hero.location.mover` 是勇士位置对象的移动器，类型是 `IHeroMover`。除了通用的链式方法与控制器，它还提供 `config`、`getConfig` 与 `useTopImplementation`（分别见后文「勇士的移动配置」与「勇士的顶层实现」）。

```ts
import { FaceDirection } from '@user/data-common';
import { ICoreState } from '@user/data-state';

async function heroStepRight(state: ICoreState): Promise<void> {
    // 向右走一格并开始执行，拿到本次执行的控制器
    const controller = state.hero.location.mover
        .step(FaceDirection.Right)
        .start();
    await controller?.onEnd;
}
```

勇士位置对象本身的接口（坐标、楼层、朝向、存档）见[勇士位置](../intermediate/hero-location.md)。

### 动态图块

动态图块（`IDynamicTile`）自带 `mover`，类型是 `IObjectMover<IDynamicTile>`，在创建动态图块时一并创建。拿到动态图块通常从图层对象入手：

```ts
import { FaceDirection } from '@user/data-common';
import { IMapLayer } from '@user/data-base';

async function pushTileRight(layer: IMapLayer): Promise<void> {
    // 把 (5, 5) 的静态图块转成动态图块；这一步会清掉原静态图块
    const tile = layer.transferToDynamic(5, 5);
    if (!tile) return;

    // 向右推一格并开始执行，拿到本次执行的控制器
    const controller = tile.mover.step(FaceDirection.Right).start();
    await controller?.onEnd;
}
```

`layer.createDynamic(num, x, y)` 直接新建动态图块，`layer.getDynamicTilesAt(x, y)` 与 `layer.iterateDynamicTiles()` 用来找已存在的动态图块。只是推一格这类简单场景，用 `tile.step(dir, count)` 更省事，它内部就是 `mover.step(...)` 加 `mover.start()`。创建、转换与移动的完整说明见[静态图块与动态图块](./ii/static-vs-dynamic-tiles.md)。

### 其他可移动对象

只有自定义对象才需要自己建移动器：对象实现 `IObjectMovable`（`x`、`y`、`setPos`、`getCurrentFaceDirection`），再为它构造一个移动器实例，写法见后文「实现自己的移动器」。引擎内置对象没有「换一个移动器」的公开入口：勇士只能用 `useTopImplementation` 替换规则层，动态图块的 `mover` 字段是只读的。

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

`speed` 与 `animDir` 只是写移动器状态，本身不产生位移。`speed` 的单位是毫秒每格，初始 `currentSpeed` 为 `100`；`animDir` 设置 `ObjectAnimDirection.Forward` 或 `Backward`。

`mover.push(steps)` 接收步骤对象数组，适合把循环生成或从别处收集来的步骤一次加入；`controller.push(...steps)` 是可变参数，直接把步骤对象逐个传入。两者名字相同、形状不同，别把数组塞给控制器。`clear()` 只清空尚未执行的队列，不影响正在执行的那一次。

规划方法只是往队列里放对象，移动器真正面对的是 `ObjectMoveStep` 联合类型。执行中用 `controller.push` 追加时，也要按这个形状传：

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

`Speed` 与 `AnimDir` 不产生位移，`Face` 只改面朝朝向。`ObjectSpecialStep` 与 `ObjectAnimDirection` 都是 `const enum`，分别表示前进 / 后退与正向 / 反向播放。

## 开始与等待

`start()` 把当前待执行队列取出来执行，并返回 `IMoverController`；如果移动器已经在移动，返回 `null`，不会接管当前移动。

返回 `null` 时它连队列都没有动过：既不切片也不清空，刚排的步骤原样留在移动器里。等当前这次结束后再调用 `start()`，它们会照常执行；不想执行就用 `clear()` 丢掉。不要以为 `start()` 失败会把刚排的步骤一起清掉。

```ts
import { FaceDirection } from '@user/data-common';
import { ICoreState } from '@user/data-state';

async function walkRightThenDown(state: ICoreState): Promise<void> {
    const mover = state.hero.location.mover;
    const before = state.hero.getLocation();

    // 链式排出三个步骤：向右两格、转向下、再向下一格
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

`onEnd` 在整次执行结束时兑现，`done` 是同一时点的布尔查询。等待优先用 `await controller.onEnd`；`done` 适合在同步代码里快速判断。`onEnd` 只在整次执行正常跑完时才兑现，任何一步或任一钩子抛错都会让它永远悬着，见后文「边界与注意」。

`start()` 还会把移动朝向（`moveDirection`）重置为 `Unknown`，面朝朝向（`faceDirection`）不受影响。因此执行期间再用移动器规划，写的是「下一次」的队列，不是本次。

勇士还有一层额外的可能：计划排好了也不一定真走。边界、通行与撞击由顶层实现判定，走不了时 `HeroMover` 会调用 `controller.stop()` 结束本次，位置不变（见后文「勇士的顶层实现」）。判断「走没走成」要看坐标，不能只看 `onEnd` 是否兑现。

## 执行中追加、插入与停止

`controller` 才是当前这次执行的入口。`push` 与 `insert` 只在「仍在移动、没有调用过 `stop`、尚未 `done`」时生效，其余情况静默忽略；`stop()` 总是把停止标记置真并返回本次的 `onEnd`：

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

执行期间在移动器上调用 `step`、`face`、`speed` 等方法，只会写回移动器内部的待执行队列，本次执行不会消费它们。执行中要追加，只能用 `controller.push` 或 `controller.insert`。

`stop()` 的停止检查发生在每轮循环开头，所以不会打断当前步：第一步还没开始就调用，通常一步都不走；在某一步执行中调用，当前步会走完再停。在步进方法或步进钩子里调用 `stop()` 时不要 `await` 它返回的 Promise——它要等当前步结束才兑现，`await` 会把整次移动卡死。内置的 `HeroMover` 在撞击、无法进入等分支里就是直接调用、不等待。

停止后 `done` 会变真，本次控制器不能再追加。想继续走，要重新排计划并再次 `start()`。

## 勇士的移动配置

`IHeroMover.config` 只对勇士有效，三个字段都是开关：

| 字段            | 含义                       |
| --------------- | -------------------------- |
| `ignoreTerrain` | 是否忽略地形碰撞检测       |
| `autoSave`      | 是否在特定时机触发自动存档 |
| `allowOutBound` | 是否允许勇士到达地图之外   |

`config` 只覆盖传入的字段，没传的保持原值；`getConfig` 返回当前配置的只读快照。

```ts
// 忽略地形碰撞，并允许走出地图
state.hero.location.mover.config({ ignoreTerrain: true, allowOutBound: true });

// 读回当前配置
const { ignoreTerrain, autoSave } = state.hero.location.mover.getConfig();
```

`ignoreTerrain` 会让 `HeroMover` 跳过通行谓词与进出 / 撞击事件，只剩边界检查；`allowOutBound` 为真时连边界也跳过。因此打开 `ignoreTerrain` 后改谓词看不到效果。

`autoSave` 只是保存在移动器上的开关，数据端移动时不会读取它；需要它的系统通过 `getConfig()` 读取后自行处理。

配置是立即写入的，`start()` 不会把它恢复成默认值，也不会写进存档：读档只恢复位置与朝向（`x`、`y`、`direction`、`floorId`），移动器上的配置与其它状态都不在存档里，重建数据端后回到默认值。想每次移动都从默认值开始，就在排计划前显式再 `config` 一次。

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
- `code` 是子类 `onStepStart` 返回的数字，会被传给 `onStepStart` 钩子、子类 `onStepEnd` 与 `onStepEnd` 钩子；基类不解释它的含义，由子类自己约定。
- 前四个钩子返回 `Promise`，引擎用 `Promise.all` 并发等待。完成顺序不等于注册顺序；需要顺序时，把有依赖的步骤写进同一个钩子按 `await` 串行。细节见[钩子深入](./hooks-in-depth.md#异步钩子)。
- `onSetPos`、`onSetFaceDir`、`onSetMoveDir` 是同步的，返回 `void`，并且只由对应的 setter 触发。

## 读取与设置状态

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

`forward` 沿的是**面朝朝向**（`faceDirection`），不是移动朝向（`moveDirection`）；`onSetMoveDir` 设置的是移动朝向，`onSetFaceDir` 设置的是面朝朝向。

`speed` 与 `animDir` 往队列里放的是步骤，真正写入 `currentSpeed`、`currAnimDir` 是在这一步执行时；执行后状态留在移动器上，`start()` 不会恢复默认值，所以会带到下一次移动。

`setPos`、`setFaceDir`、`setMoveDir` 与链式规划不同：它们立即生效、不排队。`setPos` 直接写对象坐标，`setFaceDir` 直接改面朝朝向，`setMoveDir` 直接改移动朝向。三者分别触发 `onSetPos`、`onSetFaceDir`、`onSetMoveDir` 钩子。

移动过程中的落点写入由基类直接调用 `tile.setPos`，不经过移动器的 `setPos`，所以不会触发 `onSetPos`。`onSetPos` 只对应你显式调用移动器 `setPos` 的那一次。

## 实现自己的移动器

内置的 `HeroMover` 与 `DynamicTileMover` 已经覆盖勇士与动态图块。只有当你有一个新的可移动对象、并且它的落点规则与这两者都不同时，才需要自己写一个。

`ObjectMover` 是移动器基类，负责队列、控制器、状态更新、钩子分发与坐标回写。子类只需要实现五个 `protected` 方法：

- `onMoveStart` 与 `onMoveEnd` 包住整次执行，分别在第一步之前与最后一步之后运行，返回的 Promise 会被等待。
- `onStepStart` 在每步开始前运行。此时基类已经更新过移动朝向、面朝朝向、速度与动画方向，但坐标还没变。它返回本步的结果码，供后面的逻辑与钩子使用。
- `onStepEnd` 计算这一步的落点，返回一个 `ITileLocator`。基类拿它和当前坐标比较，不同才调用 `tile.setPos`。不要在这里自己写坐标。
- `onStepSettled` 在坐标写入之后运行，参数里带着移动前坐标 `before` 与落点 `curr`。这里适合触发进入 / 离开 / 踩踏一类的事件，或者把朝向同步回对象。

最小实现如下：

```ts
import {
    FaceDirection,
    IObjectMovable,
    ObjectMover,
    ObjectMoveStep,
    ObjectMoveType,
    shouldReplay
} from '@user/data-common';
import { IFaceHandler, ITileLocator } from '@motajs/common';

// 自定义结果码：onStepStart 返回，onStepEnd 与钩子都会收到
const enum SimpleMoveCode {
    /** 这一步可以执行 */
    Success,
    /** 这一步不执行，保持原地 */
    Blocked
}

// 只处理四方向与瞬移的最小移动器；T 是可移动对象类型
export class SimpleMover<T extends IObjectMovable> extends ObjectMover<T> {
    constructor(
        readonly tile: T,
        faceHandler: IFaceHandler<FaceDirection>
    ) {
        // 初始朝向取对象当前朝向；之后由每一步的 prepareStep 维护
        super(faceHandler, tile.getCurrentFaceDirection());
    }

    protected async onMoveStart(): Promise<void> {}

    protected async onMoveEnd(): Promise<void> {}

    protected async onStepStart(
        step: Readonly<ObjectMoveStep>
    ): Promise<number> {
        // 跳跃步骤判为不可执行，其余步骤放行
        return step.type === ObjectMoveType.Jump
            ? SimpleMoveCode.Blocked
            : SimpleMoveCode.Success;
    }

    protected async onStepEnd(
        code: number,
        step: Readonly<ObjectMoveStep>
    ): Promise<ITileLocator> {
        if (code !== SimpleMoveCode.Success) {
            return { x: this.tile.x, y: this.tile.y };
        }

        switch (step.type) {
            case ObjectMoveType.Dir:
            case ObjectMoveType.DirFace:
            case ObjectMoveType.Special: {
                // 方向 → 偏移：moveDirection 已由基类按步骤内容算好
                const { x, y } = this.faceHandler.movement(this.moveDirection);
                return { x: this.tile.x + x, y: this.tile.y + y };
            }
            case ObjectMoveType.Teleport: {
                // rel 为 true 时，x / y 表示相对当前位置的偏移
                return {
                    x: step.rel ? this.tile.x + step.x : step.x,
                    y: step.rel ? this.tile.y + step.y : step.y
                };
            }
            default:
                // Face / Speed / AnimDir 不产生位移
                return { x: this.tile.x, y: this.tile.y };
        }
    }

    // 标 @shouldReplay：重放时也要执行这个会写朝向的方法
    @shouldReplay('Simple tile facing should be replayed.')
    protected async onStepSettled(
        before: ITileLocator,
        curr: ITileLocator,
        step: Readonly<ObjectMoveStep>
    ): Promise<void> {
        // 例如：this.tile.setFaceDirection(this.faceDirection);
    }
}
```

两条容易忘的约定：

- 通行判断不在移动器基类里。`SimpleMover` 只回答「这一步落到哪」，不检查目标格能不能进、有没有墙，也不触发踩踏事件；需要这些行为就照 `HeroMover` 的做法，把判定转发给一层独立的规则对象。
- 方法体里只要有写操作（写朝向、写对象、派发事件），就给它标 `@shouldReplay`，标在真正写状态的那个方法上，不要标在只读查询上。原因与放置规则见[录像一致性](./replay-consistency.md)。

`faceHandler` 决定方向体系：四方向对象配 `Dir4FaceHandler`，八方向对象配 `Dir8FaceHandler`，混用会让偏移与朝向对不上。处理器本身的接口与自定义方式见[FaceHandler 系列](./face-handler.md#实现自己的朝向处理器)。

## 勇士的顶层实现

勇士的移动器自己不判定能不能走。`HeroMover` 在每一步把信息打包成 `IHeroMoveTopHandler`，交给 `IHeroMoveTopImpl` 判断。这是勇士唯一的公开扩展点：`state.hero.location.mover.useTopImplementation(impl)` 装上，传 `null` 会卸掉实现，之后每一步都会直接停下并告警。

| 方法                     | 返回             | 作用                                                   |
| ------------------------ | ---------------- | ------------------------------------------------------ |
| `predicate()`            | `IPassPredicate` | 返回通行性谓词，`HeroMover` 用它判断能否进入、是否撞击 |
| `inBound(x, y, floorId)` | `boolean`        | 目标格是否在地图范围内                                 |
| `enter(handler)`         | `Promise<void>`  | 正常进入目标格后触发                                   |
| `leave(handler)`         | `Promise<void>`  | 离开当前格时触发                                       |
| `hit(handler)`           | `Promise<void>`  | 撞到不可进入的目标格时触发                             |
| `cannotEnter(handler)`   | `Promise<void>`  | 被判定为无法进入时触发                                 |

`handler` 里带着 `currLoc`、`nextLoc`、`direction`、`floorId`、`face` 与 `state`，够你在判定里读位置、朝向与状态。`predicate()` 返回的谓词有两个方法：`canPass(handler)` 为假时本步不移动，走「无法进入」分支；`canPass` 为真且 `shouldHit(handler)` 为真时本步不移动，走「撞击」分支；两者都为真才正常移动。

内置的 `DefaultHeroMoveTopImpl` 是默认实现，它用通行谓词与事件系统完成边界判断、进出与撞击触发器。想保留默认行为、只改其中一环时，包一层并转发给默认实现最省事：

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

/** 保留默认的边界、通行与事件，只禁止向左走。 */
export class NoLeftMoveTopImpl implements IHeroMoveTopImpl {
    // 默认实现负责边界、通行谓词与四类事件派发
    private readonly base: DefaultHeroMoveTopImpl;
    // 每步都会调用 predicate()，构造时建好一次，避免每步新建
    private readonly passPredicate: IPassPredicate;

    constructor(state: IStateSystem) {
        this.base = new DefaultHeroMoveTopImpl(state);
        const inner = this.base.predicate();
        this.passPredicate = {
            // 与默认谓词组合：向左的步骤一律不允许
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
        return this.base.hit(handler);
    }

    cannotEnter(handler: IHeroMoveTopHandler): Promise<void> {
        // 接口要求带 handler；默认实现用不到它，所以这里不转发
        return this.base.cannotEnter();
    }
}
```

装配时把它换进勇士移动器：

```ts
// 依赖加载后才知道配置时，把这段放进 afterLoad
state.hero.location.mover.useTopImplementation(new NoLeftMoveTopImpl(state));
```

几点注意：

- `predicate()` 在每个方向步都会被调用，要返回构造时建好的稳定实例，不要在方法里新建对象（内置实现就是把 `DefaultPassPredicateImpl` 存在字段里）。
- `config({ ignoreTerrain: true })` 会让 `HeroMover` 跳过整个谓词判断、只剩边界检查，此时改谓词看不到效果。
- 寻路用的是同一形状的谓词，但由 `state.pathfinding.finder.usePassPredicate(...)` 独立注入，不会自动跟随勇士的顶层实现。改了勇士的通行规则、又希望寻路一致时，要把同一个谓词再注入给 `finder`，详见[自动寻路](./ii/pathfinding.md)。

## 边界与注意

- <strong>start 返回 null</strong>：移动器已经在移动时不会接管，此时也没有新的控制器可操作。要等或要停，只能用上一次 `start()` 保存的 `controller`：`await controller.onEnd`，或调用 `controller.stop()`。`IHeroMover` 没有 `stop()`，不要在移动器上找。返回 `null` 时刚排的步骤没有被消费，仍留在移动器里，下一次 `start()` 会执行；不想要就用 `clear()`。
- <strong>moveDirection 被重置</strong>：`start()` 把移动朝向（`moveDirection`）设为 `Unknown`，面朝朝向（`faceDirection`）不受影响；`forward()` 用的是面朝朝向，不依赖这次重置。
- <strong>执行期间链式方法无效</strong>：`mover.step`、`mover.face`、`mover.speed` 等写的是下一次的队列；执行中追加只能用 `controller.push` 或 `controller.insert`。
- <strong>stop 不立刻中断</strong>：当前步会走完。第一步还没开始时调用，可能一步都不走。
- <strong>不要在步进方法里 await stop</strong>：`stop()` 返回的 Promise 要等当前步结束才兑现，在步进方法或步进钩子里 `await` 会卡死整次移动。
- <strong>步进方法或钩子抛错会卡住移动器，而且没有恢复入口</strong>：`ObjectMover` 没有为执行 Promise 兜底；任何一步或任一钩子抛错，`onEnd` 都不再兑现、`done` 保持假、`moving` 保持真，之后的 `start()` 会一直返回 `null`，这次拒绝也没有被捕获，会以未处理的 Promise 拒绝暴露出来。`moving` 对外是只读状态，`IHeroMover` / `IObjectMover` 没有重置或强制结束的方法；`controller.stop()` 只能置停止标记，无法兑现那个已经被拒绝的 Promise。结论是运行期没有恢复路径，只能重建数据端。要避免它：自定义步进方法与钩子把预期内的失败转成结果码或内部标记，用 `try` / `catch` 包住可能抛错的外部调用，不要让它冒泡。
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

再验证执行中追加：调用 `start()` 后立刻 `controller.push` 一个 `Dir` 步骤，最终坐标会多走这一步；改用 `mover.step` 追加则不会，因为那是下一次执行的队列。最后验证停止：在 `onStepEnd` 钩子里调用 `controller.stop()`（不要 `await`），移动应在当前步结束时停下，坐标只变化一格。

返回[高级 I 导览](./index.md)。
