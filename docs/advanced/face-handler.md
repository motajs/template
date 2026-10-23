# FaceHandler 系列

方向在数据端有两个落点。一个是逻辑朝向 `FaceDirection`：勇士朝哪、动态图块这一步朝哪，都用它表示。另一个是图块数字：同一个角色可能有多张不同朝向的图，移动时需要按当前朝向换成对应的数字。

两个落点之间夹着一套换算。四方向与八方向认的方向集合不同，斜向输入在四方向体系里必须先归并成某个方向，才有偏移和转向可言。`IFaceHandler` 负责这套换算，把任意朝向变成本组支持的方向、位移、反方向与旋转；`IRoleFaceBinder` 负责把朝向映射成图块数字。

本篇只讲数据端。这些值最后怎么画、动画怎么播，由渲染端读取后完成（`渲染端 · 朝向图块绘制`）。

<!-- TODO(renderer): 朝向图块绘制 -->

## 三个概念

| 概念            | 是什么                                                         | 用在哪                                    |
| --------------- | -------------------------------------------------------------- | ----------------------------------------- |
| `FaceDirection` | 方向值，`const enum`，含 `Unknown` 在内共九个成员              | 移动方向、朝向、寻路步骤里的 `dir`        |
| `FaceGroup`     | 方向组的编号，内置 `Dir4` 与 `Dir8`，表示「这一组认哪些方向」  | 从 `state.faceManager` 取处理器时作为 key |
| `IFaceHandler`  | 朝向处理器，把任意方向换算成本组支持的方向、偏移、反方向与旋转 | 移动器构造、寻路邻域、图块转向            |

`FaceDirection` 的成员依次是 `Unknown`、`Left`、`Up`、`Right`、`Down`，再加上四个斜向 `LeftUp`、`RightUp`、`LeftDown`、`RightDown`。它是 `const enum`，数值由声明顺序决定；不要按数值硬编码，一律写成员名。方向值为 `Unknown` 时表示没有方向，它也会出现在处理器的输入与输出里。

`FaceGroup` 只有 `Dir4` 与 `Dir8` 两个成员，分别表示四方向（上下左右）与八方向（上下左右加斜向）。它本身不携带行为，只是一个编号；真正的换算逻辑在对应的 `IFaceHandler` 上。

还有一个配套类型 `IFaceDescriptor`，它是只读的 `{ x, y }` 增量，处理器用它表示「朝这个方向走一步，坐标加多少」。它不是坐标，而是位移量。

## 拿到朝向处理器

`state.faceManager` 是朝向处理器的注册表，有两种取法：按数字分组取，或按字符串 id 取。两者找不到时都返回 `null`：

```ts
import { FaceDirection, FaceGroup } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 取内置的八方向处理器，并算一步向上的偏移。 */
function stepUp(state: ICoreState): void {
    const dir8 = state.faceManager.get(FaceGroup.Dir8);
    if (!dir8) {
        // 启动期没有注册时才会走到这里
        console.log('八方向处理器未注册');
        return;
    }

    // 按字符串 id 取到的是同一个实例
    const byId = state.faceManager.getById('dir8');
    console.log(dir8 === byId); // true

    const offset = dir8.movement(FaceDirection.Up);
    console.log(offset); // { x: 0, y: -1 }
}
```

注册发生在启动期，位于 `src/data/initialize.ts` 的 `awake` 中，四个内置注册分别是 `Dir4` + `'dir4'` 与 `Dir8` + `'dir8'`：

```ts
// src/data/initialize.ts 的 awake 中，朝向组在启动期一次性注册
const dir4 = new Dir4FaceHandler();
const dir8 = new Dir8FaceHandler();
state.faceManager.register(FaceGroup.Dir4, dir4);
state.faceManager.registerById('dir4', dir4);
state.faceManager.register(FaceGroup.Dir8, dir8);
state.faceManager.registerById('dir8', dir8);
```

启动之后按约定只读使用：运行期再注册分组只会影响之后取用它的地方，不会替换已经构造好的对象里保存的处理器。自定义分组用未被占用的数字或字符串 id 都可以，见后文「实现自己的朝向处理器」。

## IFaceHandler 能做什么

八个方法可以按「输入方向、输出什么」分成三组：降级与换算、遍历、由偏移反推。`degrade` 是一整套的核心，因为调用方可以传进任意方向值，包括本组不认的方向。

| 方法                        | 作用                                   | 输入先 `degrade`   | `Unknown` 的结果            |
| --------------------------- | -------------------------------------- | ------------------ | --------------------------- |
| `degrade(dir)`              | 把任意方向降级为本组支持的方向         | 否，它本身就是降级 | `Unknown`                   |
| `movement(dir)`             | 单步坐标偏移                           | 是                 | `{ x: 0, y: 0 }`            |
| `move(dir, count)`          | 走 `count` 步的偏移，`count` 可为负    | 是                 | `{ x: 0, y: 0 }`            |
| `opposite(dir)`             | 本组内的反方向                         | 是                 | `Unknown`                   |
| `next(dir, anticlockwise?)` | 顺时针（默认）或逆时针旋转一步         | 是                 | `Unknown`                   |
| `dirOf(dx, dy)`             | 由偏移反推方向，多个符合时返回其中一个 | 不接收方向         | 匹配不到时 `Unknown`        |
| `mapDirection()`            | 迭代本组支持的所有方向                 | 不接收方向         | 包含 `Unknown`              |
| `mapMovement()`             | 迭代本组所有方向及其偏移               | 不接收方向         | 包含 `Unknown` 对应的零偏移 |

`degrade` 决定这一组的归并策略：本组不认的方向该折成哪一个。后文会看到，内置的 `Dir4FaceHandler` 把斜向折到左右，而自定义处理器可以改成折到上下。

`movement` 与 `move` 的区别只在步数。`move(dir, -2)` 等价于把 `movement(dir)` 的横纵分量都乘 `-2`，也就是朝反方向走两步，但它返回的仍是 `dir` 的位移乘以负数，不会先取 `opposite`。

`opposite` 与 `next` 都在本组内求解：先 `degrade`，再查本组的映射表，因此传入一个本组不认的方向时，结果取决于 `degrade` 的归并。`next` 的第二个参数是 `anticlockwise`，省略时为 `false`，即顺时针。

`dirOf` 走的是相反方向：给你一个偏移量，问它是哪个方向。它不接收方向，也不会先 `degrade`；偏移量与表中某一项完全相等时才命中，多个方向共用同一偏移时只返回其中一个。

`mapDirection` 与 `mapMovement` 用于遍历。两者的结果都包含 `Unknown`，`mapMovement` 里 `Unknown` 对应的偏移是 `{ x: 0, y: 0 }`。寻路就是按 `mapMovement` 的条目扩展邻域的，所以处理器认哪些方向，直接决定图的分支数。

## 两个内置处理器

内置实现都在 `@user/data-common` 的 `faceManager.ts` 里。它们都实现 `IFaceHandler<FaceDirection>`，区别只在认哪些方向、以及斜向怎么归并：

| 处理器            | 支持方向         | `degrade` 行为                                     | 典型用途                         |
| ----------------- | ---------------- | -------------------------------------------------- | -------------------------------- |
| `Dir8FaceHandler` | 八个方向         | 原样返回，不做归并                                 | 八方向移动、勇士与动态图块的默认 |
| `Dir4FaceHandler` | 上下左右四个方向 | 四个正方向原样；四个斜向折到左右；其余为 `Unknown` | 只走四方向的地图与寻路           |

`Dir8FaceHandler` 的 `degrade` 把八个方向原样保留；按接口约定，无法合理降级的方向（包括 `Unknown`）应返回 `Unknown`。查表失败时 `movement` 退回零偏移，`opposite` 与 `next` 退回 `Unknown`。

`Dir4FaceHandler` 的归并需要记住一条：斜向折到左右，不是折到上下。

| 输入         | `degrade` 结果 |
| ------------ | -------------- |
| `LeftUp`     | `Left`         |
| `LeftDown`   | `Left`         |
| `RightUp`    | `Right`        |
| `RightDown`  | `Right`        |
| 其余非正方向 | `Unknown`      |

这一点决定了四方向体系里的实际手感：斜向输入不会让对象斜着走，也不会变成上下位移，而是变成横向一步。四方向地图上如果希望斜向折到上下，就需要自己写一个处理器（见下一节）。

两个处理器在 `Unknown` 上的行为一致：`movement` 与 `move` 返回零偏移，`opposite` 与 `next` 返回 `Unknown`，`mapDirection` 与 `mapMovement` 会把它列出来。

勇士与动态图块默认都走 `Dir8`：勇士的分组来自 `src/data/constant.ts` 的 `HERO_FACE`，由 `MainDataPlugin` 构造时传入；动态图块的分组来自 `data-base/src/shared.ts` 的 `DYNAMIC_MOVER_FACE`（同文件的 `HERO_MOVER_FACE` 也定义为 `Dir8`）。需要四方向时，改的是这些分组来源，而不是处理器本身的实现。

## 用处理器算位置与方向

处理器最常见的用法是「把方向换成坐标」。下面三段各自独立，分别算目标格、算反方向、遍历四方向。

```ts
import { FaceDirection, FaceGroup } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 从勇士当前位置朝 direction 走一步后的坐标。 */
function targetOf(
    state: ICoreState,
    direction: FaceDirection
): { x: number; y: number } | null {
    const handler = state.faceManager.get(FaceGroup.Dir8);
    if (!handler) return null;

    const loc = state.hero.getLocation();
    // [需改] 把 direction 换成你要算的方向
    const { x, y } = handler.movement(direction);
    return { x: loc.x + x, y: loc.y + y };
}
```

```ts
import { FaceDirection, FaceGroup } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 取某个方向在本组内的反方向。 */
function oppositeOf(
    state: ICoreState,
    direction: FaceDirection
): FaceDirection | null {
    const handler = state.faceManager.get(FaceGroup.Dir8);
    if (!handler) return null;

    // [需改] 把 direction 换成你要取反的方向
    return handler.opposite(direction);
}
```

```ts
import { FaceGroup } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 列出四方向处理器认的所有方向与偏移，包含 Unknown。 */
function listDir4Steps(state: ICoreState): void {
    const handler = state.faceManager.get(FaceGroup.Dir4);
    if (!handler) return;

    for (const [dir, offset] of handler.mapMovement()) {
        // dir 为 Unknown 时 offset 是 { x: 0, y: 0 }
        console.log(dir, offset.x, offset.y);
    }
}
```

`move` 适合一次算多格，例如 `handler.move(FaceDirection.Left, 3)` 得到 `{ x: -3, y: 0 }`；传负数就是反方向。需要逐个方向处理时用 `mapMovement`，不要自己拼一份方向数组——自定义处理器换掉方向集合后，遍历写法仍然成立。

## 实现自己的朝向处理器

需要自定义的场合有两类：仍然走四方向，但希望斜向换一种归并；或者方向数不是 4 与 8，需要一套自己的方向规则。两者都通过实现 `IFaceHandler` 完成。

实现时可以把「降级表」「运动表」「旋转表」放在模块顶层做共享常量，类只负责按契约查表。这样同一个处理器可以被多个对象共用，实例上不保存任何「当前对象」的状态。需要自己写一个时，可参考下述模板。

### 模板：一个自定义朝向处理器

这个模板仍是四方向，但把斜向折到上下，用来演示 `degrade` 的策略作用。`[需改]` 标出需要替换的部分。

```ts
import { IFaceDescriptor, IFaceHandler } from '@motajs/common';
import { FaceDirection } from '@user/data-common';

// [需改] 降级表：决定本组认哪些方向、其余方向怎么归并
const VERTICAL_DEGRADE: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Left, FaceDirection.Left],
    [FaceDirection.Up, FaceDirection.Up],
    [FaceDirection.Right, FaceDirection.Right],
    [FaceDirection.Down, FaceDirection.Down],
    // 斜向折到上下，这是与内置 Dir4FaceHandler 的唯一区别
    [FaceDirection.LeftUp, FaceDirection.Up],
    [FaceDirection.RightUp, FaceDirection.Up],
    [FaceDirection.LeftDown, FaceDirection.Down],
    [FaceDirection.RightDown, FaceDirection.Down]
]);

// [需改] 运动表：本组每个方向的单步偏移，必须包含 Unknown 的零偏移
const VERTICAL_MOVEMENTS: ReadonlyMap<FaceDirection, IFaceDescriptor> = new Map(
    [
        [FaceDirection.Unknown, { x: 0, y: 0 }],
        [FaceDirection.Left, { x: -1, y: 0 }],
        [FaceDirection.Up, { x: 0, y: -1 }],
        [FaceDirection.Right, { x: 1, y: 0 }],
        [FaceDirection.Down, { x: 0, y: 1 }]
    ]
);

// 顺时针旋转顺序，不含 Unknown
const VERTICAL_CW: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Up, FaceDirection.Right],
    [FaceDirection.Right, FaceDirection.Down],
    [FaceDirection.Down, FaceDirection.Left],
    [FaceDirection.Left, FaceDirection.Up]
]);

// 逆时针旋转顺序，不含 Unknown
const VERTICAL_CCW: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Up, FaceDirection.Left],
    [FaceDirection.Left, FaceDirection.Down],
    [FaceDirection.Down, FaceDirection.Right],
    [FaceDirection.Right, FaceDirection.Up]
]);

// 反方向表，只覆盖本组方向
const VERTICAL_OPPOSITE: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Up, FaceDirection.Down],
    [FaceDirection.Down, FaceDirection.Up],
    [FaceDirection.Left, FaceDirection.Right],
    [FaceDirection.Right, FaceDirection.Left]
]);

/** 四方向处理器：斜向一律折到上下。 */
export class VerticalDir4FaceHandler implements IFaceHandler<FaceDirection> {
    degrade(dir: number): FaceDirection {
        // 表中没有的方向（含 Unknown 与任意非法值）一律视为无法降级
        return (
            VERTICAL_DEGRADE.get(dir as FaceDirection) ?? FaceDirection.Unknown
        );
    }

    movement(dir: number): IFaceDescriptor {
        // 先降级，再查表；查不到按零偏移处理
        return VERTICAL_MOVEMENTS.get(this.degrade(dir)) ?? { x: 0, y: 0 };
    }

    move(dir: number, count: number): IFaceDescriptor {
        // 等价于 movement 乘以 count；count 为负表示反向位移
        const { x, y } = this.movement(dir);
        return { x: x * count, y: y * count };
    }

    opposite(dir: number): FaceDirection {
        const degraded = this.degrade(dir);
        // 降级后仍查不到时返回 Unknown
        return VERTICAL_OPPOSITE.get(degraded) ?? FaceDirection.Unknown;
    }

    next(dir: number, anticlockwise: boolean = false): FaceDirection {
        const degraded = this.degrade(dir);
        // Unknown 不参与旋转，原样返回
        if (degraded === FaceDirection.Unknown) return FaceDirection.Unknown;

        const map = anticlockwise ? VERTICAL_CCW : VERTICAL_CW;
        return map.get(degraded) ?? FaceDirection.Unknown;
    }

    dirOf(dx: number, dy: number): FaceDirection {
        // 只认本组的单步偏移；斜向偏移没有对应方向，返回 Unknown
        for (const [dir, { x, y }] of VERTICAL_MOVEMENTS) {
            if (x === dx && y === dy) return dir;
        }
        return FaceDirection.Unknown;
    }

    mapDirection(): Iterable<FaceDirection> {
        return VERTICAL_MOVEMENTS.keys();
    }

    mapMovement(): Iterable<[FaceDirection, IFaceDescriptor]> {
        return VERTICAL_MOVEMENTS.entries();
    }
}
```

模板的每个方法都对应一条契约，实现时要逐条满足：

- 所有接收方向的入参，都要在方法内部先经过 `degrade`。`movement`、`move`、`opposite`、`next` 都是如此；`degrade` 本身就是降级，`dirOf`、`mapDirection`、`mapMovement` 不接收方向。
- `Unknown` 不能被当成普通方向参与运算：`movement` 与 `move` 返回零偏移，`opposite` 与 `next` 返回 `Unknown`。
- `mapMovement` 必须包含 `Unknown` 及其零偏移。处理器的方法可能返回 `Unknown`，调用方靠这张表把每个方向都映射到偏移；缺了它，`Unknown` 只能走各方法自己的兜底分支，行为就不再由表统一决定。
- `next` 的第二个参数省略时表示顺时针；逆时针表要能与顺时针表首尾相接，转满一圈回到起点。
- `dirOf` 匹配不到时要返回 `Unknown`，不要抛错；多个方向共用同一偏移时返回其中一个即可。
- 表用 `ReadonlyMap` 这类共享常量即可，不要在处理器实例上记录「当前处理的是哪个对象」，处理器是共用的。

注册时选一个未被内置占用的分组键，数字与字符串 id 都可以：

```ts
import { FaceDirection } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import { VerticalDir4FaceHandler } from './vertical-face-handler';

/** 注册自定义朝向组，并取回验证一次。 */
function registerVerticalFace(state: ICoreState): void {
    // 3 是自定义分组键，内置只占用了 0（Dir4）与 1（Dir8）
    state.faceManager.register(3, new VerticalDir4FaceHandler());
    // 也可以再按字符串 id 注册，便于配置里写 id
    state.faceManager.registerById(
        'vertical-dir4',
        new VerticalDir4FaceHandler()
    );

    const handler = state.faceManager.get<FaceDirection>(3);
    if (!handler) return;

    // 斜向现在折到上下：LeftUp 的降级结果是 Up
    console.log(handler.degrade(FaceDirection.LeftUp));
    console.log(handler.movement(FaceDirection.LeftUp)); // { x: 0, y: -1 }
}
```

注册只往表里放处理器，不会替任何已有对象换掉手上的那一个。真正生效的地方是显式取用它的代码：构造移动器时把处理器传进去（见 `移动 Mover`），寻路时调用 `finder.useFaceHandler(handler)`。这些地方之后按新策略计算，已经构造好的移动器仍持有构造时的处理器。

## 朝向图块：IRoleFaceBinder

同一个角色可能有多张图，分别对应不同朝向。逻辑上的「朝右」需要换成「朝右那张图的图块数字」，这件事由 `state.roleFace` 完成。`IRoleFaceBinder` 只维护图块数字之间的对应关系，不关心对象在哪、移动器是什么。

| 方法                           | 作用                                 | 返回                |
| ------------------------------ | ------------------------------------ | ------------------- |
| `malloc(identifier, main)`     | 给一个图块分配主朝向，登记为一个新组 | `void`              |
| `bind(identifier, main, face)` | 把一个图块绑定到某个主图块的某个朝向 | `void`              |
| `getFaceOf(identifier, face)`  | 取该组在指定朝向下使用的图块数字     | `IFaceData \| null` |
| `getFaceDirection(identifier)` | 取该图块数字自身的朝向               | `FaceDirection`     |
| `getMainFace(identifier)`      | 取该图块数字所属组的主朝向           | `IFaceData \| null` |

`malloc` 是建组：`identifier` 作为主图块，`main` 是它的朝向（主朝向一般是朝下）。`bind` 把同组的另一张图块挂进来，`main` 必须是已经 `malloc` 过的图块数字。两者都只写映射，不发事件：

```ts
import { FaceDirection, IRoleFaceBinder } from '@user/data-common';

/** 登记一组朝向图块，并读回映射结果。 */
function bindFacingTiles(binder: IRoleFaceBinder): void {
    // [需改] 1 是主图块数字（朝下），2 是同一角色的另一张朝向图块
    binder.malloc(1, FaceDirection.Down);
    binder.bind(2, 1, FaceDirection.Right);

    // 传入组内任意一个图块数字，都能查到该朝向使用的图块
    console.log(binder.getFaceOf(1, FaceDirection.Right)); // { identifier: 2, face: Right }
    console.log(binder.getFaceOf(2, FaceDirection.Right)); // { identifier: 2, face: Right }

    // 2 这张图自带的朝向
    console.log(binder.getFaceDirection(2)); // Right

    // 2 所属组的主朝向；返回的 identifier 仍是传入的图块数字
    console.log(binder.getMainFace(2)); // { identifier: 2, face: Down }

    // 没有登记过的图块数字
    console.log(binder.getFaceOf(999, FaceDirection.Right)); // null
}
```

`bind` 有两个前置条件，任一不满足都会记一条错误日志并放弃绑定：`main` 没有 `malloc` 过，或绑定的朝向与主朝向相同。因此建组的顺序必须是先 `malloc` 主图块，再 `bind` 其余朝向。`getFaceOf` 与 `getMainFace` 找不到时返回 `null`；`getFaceDirection` 找不到时返回 `Unknown`，而不是 `null`。

地图图层默认使用 `state.roleFace` 作为自己的朝向绑定器，所以图块转向时查的就是这份映射。`MapTileBase.setFaceDirection` 先按原方向查 `getFaceOf`，查不到时再用 `Dir4` 处理器的 `degrade` 折一次再查，仍然查不到就保持原图块数字。这就是两层结构在实现里的交汇点：朝向映射决定换哪张图，处理器决定斜向该往哪折。

## 它们怎么串起来

一个方向值从产生到落地，会依次经过三层：

- `FaceDirection` 是逻辑朝向。移动器、寻路步骤、图块对象都用它表示「朝哪」。
- `IFaceHandler` 把逻辑朝向变成位移与转向。移动器构造时保存一个处理器，每一步用它把 `moveDirection` 换成落点偏移；寻路用它决定邻域分支。
- `IRoleFaceBinder` 把逻辑朝向变成图块数字。动态图块取当前朝向时，走的是 `layer.faceBinder.getFaceDirection(tileNum)`；图块转向时反过来用朝向查数字。

具体到动态图块：`DynamicTile` 构造自己的 `DynamicTileMover` 时，从 `state.faceManager` 按 `DYNAMIC_MOVER_FACE`（即 `Dir8`）取处理器，并把图块当前朝向一起交给基类；单步结束时再用处理器把 `moveDirection` 换成坐标增量。处理器与初始朝向此后都保存在移动器实例上，换分组不会影响已经建好的实例。

再往上就是渲染端：图块数字与坐标交给渲染端，由它决定画哪张图、播哪个朝向的动画（`渲染端 · 朝向图块绘制`）。数据端只保证「数字与朝向对得上」，不决定画面。

<!-- TODO(renderer): 朝向图块绘制 -->

## 与寻路、范围对象的关系

寻路复用同一套方向规则。构建有向图时，它按 `mapMovement()` 的条目向相邻格扩展，所以处理器直接决定「能往哪几个方向走」：四方向处理器只扩展上下左右，八方向处理器会扩展到斜向。注入方式是 `finder.useFaceHandler(handler)`，需要在绑定图层时一并设置；不注入时构图会失败，状态为 `InvalidInput`。详见[自动寻路](./ii/pathfinding.md)。

范围对象也复用方向这一层。射线范围 `RayRange` 的参数里，`dir` 是 `IFaceDescriptor[]`，每一项形如 `{ x: 0, y: -1 }`；它要的是偏移量，不是 `FaceDirection`。需要从方向得到偏移时，用处理器的 `movement` 转换即可。详见[自定义范围对象](./ii/custom-range.md)。

因为「方向即偏移」被多处共用，改处理器的行为会同时影响移动与寻路：把四方向处理器的斜向归并改成折到上下，移动器的斜向输入和寻路的斜向分支会一起改变。只希望其中一处变化时，不要直接换掉共享的处理器，而是给那处单独注入一个处理器实例。

## 边界与注意

- <strong>四方向的斜向折左右</strong>：`Dir4FaceHandler.degrade` 把 `LeftUp` 与 `LeftDown` 折到 `Left`，`RightUp` 与 `RightDown` 折到 `Right`，不是折到上下。需要折上下时自建处理器。
- <strong>get 与 getById 可能返回 null</strong>：自建分组、或在启动期之外取用处理器时，先判空再调用；直接对 `null` 调方法会在运行期报错。
- <strong>dirOf 可能有多解</strong>：偏移量相同、方向不同的情况只返回其中一个，不要用它反推「唯一方向」，也不要用它校验位移是否合法。
- <strong>Unknown 的偏移是零</strong>：`movement` 与 `move` 对 `Unknown` 返回 `{ x: 0, y: 0 }`，`opposite` 与 `next` 返回 `Unknown`；把它当普通方向做位置运算，对象会原地不动。
- <strong>bind 前必须 malloc</strong>：主图块没有分配朝向时，`bind` 会记错误并放弃；绑定的朝向与主朝向相同也会被拒绝。
- <strong>重复 malloc 会覆盖</strong>：同一个图块数字再次 `malloc` 会重建该组的映射，之前 `bind` 进去的其它朝向不会被保留。
- <strong>处理器是共享对象</strong>：不要在实例上保存「当前处理的是哪个对象」之类的状态；多个对象共用同一个处理器时，状态会互相覆盖。
- <strong>不同分组互不影响</strong>：`Dir4`、`Dir8` 与自定义分组各有一份处理器，换掉其中一个不会改动其余分组。
- <strong>注册不替换已有实例</strong>：注册只影响之后取用它的代码；已经构造好的移动器仍持有构造时传入的处理器。
- <strong>getMainFace 返回的是朝向</strong>：返回的 `IFaceData` 里，`identifier` 仍是你传入的图块数字，`face` 是它所属组的主朝向，不是主图块的数字。

## 怎么验证

先确认内置处理器取得到，再逐项打印关键换算结果：

```ts
import { FaceDirection, FaceGroup } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 打印内置处理器的关键结果，确认方向换算符合预期。 */
function verifyFaceHandler(state: ICoreState): void {
    const dir4 = state.faceManager.get(FaceGroup.Dir4);
    const dir8 = state.faceManager.get(FaceGroup.Dir8);
    if (!dir4 || !dir8) {
        console.log('处理器未注册，检查 initialize.ts 的注册');
        return;
    }

    // 四方向：斜向应折到左右
    console.log('左上降级', dir4.degrade(FaceDirection.LeftUp)); // Left

    // 八方向：向上走一步是纵坐标 -1
    console.log('向上单步', dir8.movement(FaceDirection.Up)); // { x: 0, y: -1 }

    // 反方向与旋转；旋转方向以处理器认的方向集合为准
    console.log('向右的反方向', dir8.opposite(FaceDirection.Right)); // Left
    console.log('向上的顺时针', dir8.next(FaceDirection.Up));
    console.log('向上的逆时针', dir8.next(FaceDirection.Up, true));
}
```

再验证朝向图块的登记与读取：先 `malloc` 主图块，再 `bind` 另一朝向，然后核对 `getFaceOf`、`getFaceDirection` 与 `getMainFace` 的返回值；把 `bind` 挪到 `malloc` 之前，应当看到错误日志且映射没有建立。

最后验证自定义处理器：注册后取回，确认 `degrade(LeftUp)` 变成 `Up`、`movement(LeftUp)` 变成 `{ x: 0, y: -1 }`；再把它交给一个新建的移动器或 `finder.useFaceHandler`，重算一次目标格与一条路径，确认斜向输入按新策略归并。已构造好的移动器不会发生变化，若结果没变，先检查是否仍在用旧的处理器。
