# FaceHandler 系列

方向在数据端有两个落点。一个是逻辑朝向 `FaceDirection`：勇士朝哪、动态图块这一步朝哪，都用它表示。另一个是图块数字：同一个角色可能有多张不同朝向的图，换方向时要换成对应的数字。

两个落点之间夹着一套换算。`IFaceHandler` 把任意朝向变成本组支持的方向、位移、反方向与旋转；`IRoleFaceBinder` 把朝向映射成图块数字。

本篇只讲数据端。这些值最后怎么画、动画怎么播，由渲染端读取后完成。

<!-- TODO(renderer): 朝向图块绘制 -->

## 朝向模型

朝向在数据端分两层：**逻辑朝向**决定对象怎么走、怎么转向；**图块数字**决定画哪张图。两层之间由五个组件连接：

| 组件              | 是什么                                                         | 负责                                      |
| ----------------- | -------------------------------------------------------------- | ----------------------------------------- |
| `FaceDirection`   | 方向值，`const enum`，含 `Unknown` 在内共九个成员              | 移动方向、朝向、寻路步骤里的 `dir`        |
| `FaceGroup`       | 方向组的编号，内置 `Dir4` 与 `Dir8`，表示「这一组认哪些方向」  | 从 `state.faceManager` 取处理器时作为 key |
| `IFaceHandler`    | 朝向处理器，把任意方向换算成本组支持的方向、偏移、反方向与旋转 | 移动器构造、寻路邻域、图块转向            |
| `IFaceDescriptor` | 只读的 `{ x, y }` 增量，表示朝某方向走一步坐标加多少           | 处理器返回位移时使用                      |
| `IRoleFaceBinder` | 朝向图块绑定器                                                 | 把朝向映射成图块数字                      |

一条链路服务于移动：移动器或寻路拿到一个 `IFaceHandler`，把 `FaceDirection` 换成坐标偏移，用它算落点、扩展邻域。另一条链路服务于显示：`IRoleFaceBinder` 按「当前图块数字 + 目标朝向」查出该朝向对应的图块数字，换向时换图。

`IFaceHandler` 与 `IRoleFaceBinder` 都是共享对象：处理器不保存「当前处理的是哪个对象」的状态，绑定器保存的是图块数字之间的映射。两者都不直接绘制，渲染端读取结果后完成显示。

`FaceDirection` 的成员依次是 `Unknown`、`Left`、`Up`、`Right`、`Down`，再加上四个斜向 `LeftUp`、`RightUp`、`LeftDown`、`RightDown`。它是 `const enum`，数值由声明顺序决定；不要按数值硬编码，一律写成员名。`Unknown` 表示没有方向，它也会出现在处理器的输入与输出里。

`FaceGroup` 只有 `Dir4` 与 `Dir8` 两个成员，分别表示四方向（上下左右）与八方向（上下左右加斜向）。它本身不携带行为，只是一个编号；真正的换算逻辑在对应的 `IFaceHandler` 上。取处理器时写 `FaceGroup.Dir4` / `FaceGroup.Dir8`，不要自己写 `0`、`1`。

还有一个配套类型 `IFaceDescriptor`，它是只读的 `{ x, y }` 增量，处理器用它表示「朝这个方向走一步，坐标加多少」。它不是坐标，而是位移量。

## 拿到朝向处理器

`state.faceManager` 是朝向处理器的注册表，有两种取法：按数字分组取，或按字符串 id 取。两者找不到时都返回 `null`。

```ts
import { FaceDirection, FaceGroup } from '@user/data-common';
import { ICoreState } from '@user/data-state';

function stepUp(state: ICoreState): void {
    const dir8 = state.faceManager.get<FaceDirection>(FaceGroup.Dir8);
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

`get` 的泛型决定返回的 `IFaceHandler<T>` 里 `T` 是什么：不写泛型时 `T` 退化为 `number`，`degrade`、`opposite`、`next` 的静态类型都会是 `number`；需要 `FaceDirection` 的强类型时写 `get<FaceDirection>(...)`。

内置处理器在启动期注册，四方向与八方向各注册了数字 key 与字符串 id。启动之后按约定只读使用：运行期再注册只会影响之后取用它的地方，不会替换已经构造好的对象里保存的处理器。

同一个角色的图块数字映射由 `state.roleFace` 负责，见下文「朝向图块映射」。

## 常用方法

八个方法可以按「输入方向、输出什么」分成三组：降级与换算、遍历、由偏移反推。`degrade` 是核心，因为调用方可以传进任意方向值，包括本组不认的方向。

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

最常见的是「把方向换成坐标」：

```ts
import { FaceDirection, FaceGroup } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 从勇士当前位置朝 direction 走一步后的坐标。 */
function targetOf(
    state: ICoreState,
    direction: FaceDirection
): { x: number; y: number } | null {
    const handler = state.faceManager.get<FaceDirection>(FaceGroup.Dir8);
    if (!handler) return null;

    // [需改] 把 direction 换成你要算的方向
    const { x, y } = handler.movement(direction);
    const loc = state.hero.getLocation();
    return { x: loc.x + x, y: loc.y + y };
}
```

`move` 适合一次算多格，例如 `handler.move(FaceDirection.Left, 3)` 得到 `{ x: -3, y: 0 }`；传负数就是反方向。`opposite` 与 `next` 都在本组内求解：先 `degrade`，再查本组的映射表，所以传入本组不认的方向时，结果取决于 `degrade` 的归并。`next` 的第二个参数是 `anticlockwise`，省略时为 `false`，即顺时针。

`dirOf` 走的是相反方向：给你一个偏移量，问它是哪个方向。它不接收方向，也不会先 `degrade`；偏移量与表中某一项完全相等时才命中，多个方向共用同一偏移时只返回其中一个。不要用它反推「唯一方向」，也不要用它校验位移是否合法。

`mapDirection` 与 `mapMovement` 用于遍历，两者的结果都包含 `Unknown`，`mapMovement` 里 `Unknown` 对应的偏移是 `{ x: 0, y: 0 }`。自己按 `mapMovement` 扩展邻域时，要跳过零偏移条目，否则对象会原地走一步；寻路的构图循环就是这样处理的。

## 用在哪里

### 移动器与寻路

移动器构造时保存一个处理器，每一步用它把 `moveDirection` 换成落点偏移。内置的 `DynamicTile` 构造自己的 `DynamicTileMover` 时，从 `state.faceManager` 按 `DYNAMIC_MOVER_FACE`（即 `Dir8`）取处理器；自己写移动器时，处理器要作为构造参数传进去（见[移动 Mover](./mover.md#实现自己的移动器)）。处理器必须与对象的方向体系一致：四方向对象配八方向处理器，或反过来，偏移与朝向都会对不上。

寻路复用同一套方向规则。构建有向图时，它按 `mapMovement()` 的条目向相邻格扩展，所以处理器直接决定「能往哪几个方向走」：四方向处理器只扩展上下左右，八方向处理器会扩展到斜向。注入方式是 `finder.useFaceHandler(handler)`；没有注入时构图会失败（找不到图层、谓词或处理器都会失败），详见[自动寻路](./ii/pathfinding.md)。

因为「方向即偏移」被多处共用，改处理器的行为会同时影响移动与寻路：调整四方向处理器的斜向归并，移动器的斜向输入和寻路的斜向分支会一起改变。只希望其中一处变化时，不要直接换掉共享的处理器，而是给那处单独注入一个处理器实例。

### 图块朝向

地图图层默认使用 `state.roleFace` 作为自己的朝向绑定器，图块转向时查的就是这份映射。`MapTileBase.setFaceDirection(direction)` 的处理顺序是：

1. 用当前图块数字与目标方向查 `getFaceOf`，查到就换图并返回新数字；
2. 查不到时用 `Dir4` 处理器的 `degrade` 折一次，再查一次；
3. 仍查不到则保持原图块数字。

第 2 步把方向降级为四方向后再查一次图，查到就换图并返回新的图块数字。

### 朝向图块映射

同一个角色可能有多张图，分别对应不同朝向。真正把「朝右」换成「朝右那张图的图块数字」的是 `IRoleFaceBinder`，地图图层通过 `state.roleFace` 使用它。

| 方法                           | 作用                                 | 返回                |
| ------------------------------ | ------------------------------------ | ------------------- |
| `malloc(identifier, main)`     | 给一个图块分配主朝向，登记为一个新组 | `void`              |
| `bind(identifier, main, face)` | 把一个图块绑定到某个主图块的某个朝向 | `void`              |
| `getFaceOf(identifier, face)`  | 取该组在指定朝向下使用的图块数字     | `IFaceData \| null` |
| `getFaceDirection(identifier)` | 取该图块数字自身的朝向               | `FaceDirection`     |
| `getMainFace(identifier)`      | 取该图块数字所属组的主朝向           | `IFaceData \| null` |

`malloc` 是建组：`identifier` 作为主图块，`main` 是它的朝向（主朝向一般是朝下）。`bind` 把同组的另一张图块挂进来，`main` 必须是已经 `malloc` 过的图块数字。两者都只写映射，不发事件：

```ts
import { FaceDirection } from '@user/data-common';
import { ICoreState } from '@user/data-state';

function bindFacingTiles(state: ICoreState): void {
    const binder = state.roleFace;
    // [需改] 1 是主图块数字（朝下），2 是同一角色的另一张朝向图块
    binder.malloc(1, FaceDirection.Down);
    binder.bind(2, 1, FaceDirection.Right);

    // 传入组内任意一个图块数字，都能查到该朝向使用的图块
    console.log(binder.getFaceOf(1, FaceDirection.Right)); // { identifier: 2, face: Right }

    // 2 这张图自带的朝向
    console.log(binder.getFaceDirection(2)); // Right

    // 2 所属组的主朝向；返回的 identifier 仍是传入的图块数字
    console.log(binder.getMainFace(2)); // { identifier: 2, face: Down }
}
```

`bind` 有两个前置条件，任一不满足都会记一条错误日志并放弃绑定：`main` 没有 `malloc` 过，或绑定的朝向与主朝向相同。因此建组的顺序必须是先 `malloc` 主图块，再 `bind` 其余朝向。`getFaceOf` 与 `getMainFace` 找不到时返回 `null`；`getFaceDirection` 找不到时返回 `Unknown`，而不是 `null`。

示例里的 `1` 与 `2` 只是占位，换图前先确认这两个图块数字在当前地图里没有被别的朝向组占用。`malloc` 会覆盖同一个图块数字原有的组，`bind` 会覆盖该组同一朝向的旧映射，所以要从地图的图块数据里取真实数字，不要照抄示例。

## 两个内置处理器

内置的 `Dir8FaceHandler` 与 `Dir4FaceHandler` 都实现 `IFaceHandler<FaceDirection>`，区别只在认哪些方向、以及斜向怎么归并：

| 处理器            | 支持方向         | `degrade` 行为                                     | 典型用途                         |
| ----------------- | ---------------- | -------------------------------------------------- | -------------------------------- |
| `Dir8FaceHandler` | 八个方向         | 原样返回，不做归并                                 | 八方向移动、勇士与动态图块的默认 |
| `Dir4FaceHandler` | 上下左右四个方向 | 四个正方向原样；四个斜向折到左右；其余为 `Unknown` | 只走四方向的地图与寻路           |

`Dir4FaceHandler` 的归并需要记住一条：斜向折到左右，不是折到上下。

| 输入         | `degrade` 结果 |
| ------------ | -------------- |
| `LeftUp`     | `Left`         |
| `LeftDown`   | `Left`         |
| `RightUp`    | `Right`        |
| `RightDown`  | `Right`        |
| 其余非正方向 | `Unknown`      |

这一点决定了四方向体系里的实际手感：斜向输入不会让对象斜着走，也不会变成上下位移，而是变成横向一步。需要别的归并策略，或方向体系根本不是方格（例如六边形布局）时，才需要自己写处理器（见下一节）。

两个处理器在 `Unknown` 上的行为一致：`movement` 与 `move` 返回零偏移，`opposite` 与 `next` 返回 `Unknown`，`mapDirection` 与 `mapMovement` 会把它列出来。查表失败时 `movement` 同样退回零偏移。

勇士与动态图块默认都走 `Dir8`，分组分别来自 `HERO_FACE` 与 `DYNAMIC_MOVER_FACE`。需要四方向时，改的是分组来源。

## 实现自己的朝向处理器

需要自定义处理器的场合通常不是「换一种斜向归并」，而是**坐标系本身不是方格**。例如六边形地图有六个邻接方向，既不是四方向也不是八方向；这类布局需要一套自己的方向规则，通过实现 `IFaceHandler` 提供。

实现时把「降级表」「运动表」「旋转顺序」放在模块顶层做共享常量，类只负责按契约查表。处理器是共享对象，实例上不保存任何「当前对象」的状态。几条契约要逐条满足：

- 所有接收方向的入参，都要在方法内部先经过 `degrade`；`dirOf`、`mapDirection`、`mapMovement` 不接收方向。
- `Unknown` 不能被当成普通方向参与运算：`movement` 与 `move` 返回零偏移，`opposite` 与 `next` 返回 `Unknown`。
- `mapMovement` 必须包含 `Unknown` 及其零偏移，调用方靠这张表把每个方向都映射到偏移。
- `dirOf` 匹配不到时返回 `Unknown`，不要抛错；只遍历本组自己的偏移表。

下面以六边形布局为例：只认左右与四个斜向，上下不是邻接方向。偏移量按示例的行列坐标给出，换坐标系时替换成自己的增量。`[需改]` 标出需要按布局替换的部分：

```ts
import { IFaceDescriptor, IFaceHandler } from '@motajs/common';
import { FaceDirection } from '@user/data-common';

// [需改] 降级表：六边形只认六个邻接方向，其余方向无法降级
const HEX_DEGRADE: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Left, FaceDirection.Left],
    [FaceDirection.Right, FaceDirection.Right],
    [FaceDirection.LeftUp, FaceDirection.LeftUp],
    [FaceDirection.RightUp, FaceDirection.RightUp],
    [FaceDirection.LeftDown, FaceDirection.LeftDown],
    [FaceDirection.RightDown, FaceDirection.RightDown]
]);

// [需改] 运动表：六个方向的单步偏移，必须包含 Unknown 的零偏移
const HEX_MOVEMENTS: ReadonlyMap<FaceDirection, IFaceDescriptor> = new Map([
    [FaceDirection.Unknown, { x: 0, y: 0 }],
    [FaceDirection.Left, { x: -1, y: 0 }],
    [FaceDirection.Right, { x: 1, y: 0 }],
    [FaceDirection.LeftUp, { x: -1, y: -1 }],
    [FaceDirection.RightUp, { x: 1, y: -1 }],
    [FaceDirection.LeftDown, { x: -1, y: 1 }],
    [FaceDirection.RightDown, { x: 1, y: 1 }]
]);

// 顺时针顺序，不含 Unknown；逆时针与反方向都在这张表上取
const HEX_CW: readonly FaceDirection[] = [
    FaceDirection.Right,
    FaceDirection.RightDown,
    FaceDirection.LeftDown,
    FaceDirection.Left,
    FaceDirection.LeftUp,
    FaceDirection.RightUp
];

/** 六边形布局的朝向处理器：只认六个邻接方向。 */
export class HexFaceHandler implements IFaceHandler<FaceDirection> {
    degrade(dir: number): FaceDirection {
        // 不在六个方向里的输入（含 Up、Down、Unknown 与非法值）都无法降级
        return HEX_DEGRADE.get(dir as FaceDirection) ?? FaceDirection.Unknown;
    }

    movement(dir: number): IFaceDescriptor {
        // 先降级，再查表
        return HEX_MOVEMENTS.get(this.degrade(dir)) ?? { x: 0, y: 0 };
    }

    move(dir: number, count: number): IFaceDescriptor {
        // 等价于 movement 乘以 count；count 为负表示反向位移
        const { x, y } = this.movement(dir);
        return { x: x * count, y: y * count };
    }

    opposite(dir: number): FaceDirection {
        // 六个方向里相隔三个位置的方向就是反方向
        const i = HEX_CW.indexOf(this.degrade(dir));
        return i < 0 ? FaceDirection.Unknown : HEX_CW[(i + 3) % HEX_CW.length];
    }

    next(dir: number, anticlockwise: boolean = false): FaceDirection {
        const i = HEX_CW.indexOf(this.degrade(dir));
        if (i < 0) return FaceDirection.Unknown;

        // 顺时针 +1，逆时针 -1，转满一圈回到起点
        const step = anticlockwise ? -1 : 1;
        return HEX_CW[(i + step + HEX_CW.length) % HEX_CW.length];
    }

    dirOf(dx: number, dy: number): FaceDirection {
        // 只认本组的单步偏移；其它偏移没有对应方向
        for (const [dir, { x, y }] of HEX_MOVEMENTS) {
            if (x === dx && y === dy) return dir;
        }
        return FaceDirection.Unknown;
    }

    mapDirection(): Iterable<FaceDirection> {
        return HEX_MOVEMENTS.keys();
    }

    mapMovement(): Iterable<[FaceDirection, IFaceDescriptor]> {
        return HEX_MOVEMENTS.entries();
    }
}
```

注册时选一个未被内置占用的分组键。数字键没有命名空间保护，将来内置新增分组时可能撞车；自定义分组更推荐字符串 id：

```ts
import { FaceDirection } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import { HexFaceHandler } from './hex-face-handler';

function registerHexFace(state: ICoreState): void {
    state.faceManager.registerById('hex', new HexFaceHandler());

    const handler = state.faceManager.getById<FaceDirection>('hex');
    if (!handler) return;

    // 六个邻接方向能换算偏移；上下会被降级为 Unknown
    console.log(handler.movement(FaceDirection.RightUp)); // { x: 1, y: -1 }
    console.log(handler.degrade(FaceDirection.Up)); // Unknown
}
```

注册只往表里放处理器，不会替任何已有对象换掉手上的那一个。真正生效的地方是显式取用它的代码：构造移动器时把处理器传进去，寻路时调用 `finder.useFaceHandler(handler)`。这些地方之后按新策略计算，已经构造好的移动器仍持有构造时的处理器。

## 边界与注意

- <strong>四方向的斜向折左右</strong>：`Dir4FaceHandler.degrade` 把 `LeftUp` 与 `LeftDown` 折到 `Left`，`RightUp` 与 `RightDown` 折到 `Right`，不是折到上下。需要别的归并策略时自建处理器。
- <strong>get 与 getById 可能返回 null</strong>：自建分组、或在启动期之外取用处理器时，先判空再调用；直接对 `null` 调方法会在运行期报错。
- <strong>dirOf 可能有多解</strong>：偏移量相同、方向不同的情况只返回其中一个，不要用它反推「唯一方向」，也不要用它校验位移是否合法。
- <strong>Unknown 的偏移是零</strong>：`movement` 与 `move` 对 `Unknown` 返回 `{ x: 0, y: 0 }`，`opposite` 与 `next` 返回 `Unknown`；把它当普通方向做位置运算，对象会原地不动。
- <strong>bind 前必须 malloc</strong>：主图块没有分配朝向时，`bind` 会记错误并放弃；绑定的朝向与主朝向相同也会被拒绝。
- <strong>重复 malloc 会覆盖</strong>：同一个图块数字再次 `malloc` 会重建该组的映射，之前 `bind` 进去的其它朝向不会被保留；已经 `bind` 过的子图块仍持有旧映射表，`getFaceOf` 可能查到旧结果。重建整组后要重新 `bind` 所有子图块。
- <strong>处理器是共享对象</strong>：不要在实例上保存「当前处理的是哪个对象」之类的状态；多个对象共用同一个处理器时，状态会互相覆盖。注册一次即可，也没有卸载流程；换处理器要改使用方的引用，而不是重新 `register`。
- <strong>不同分组互不影响</strong>：`Dir4`、`Dir8` 与自定义分组各有一份处理器，换掉其中一个不会改动其余分组；注册也不替换已经构造好的对象手里的实例。
- <strong>getMainFace 返回的是朝向</strong>：返回的 `IFaceData` 里，`identifier` 仍是你传入的图块数字，`face` 是它所属组的主朝向，不是主图块的数字。

## 怎么验证

先确认内置处理器取得到，再逐项打印关键换算结果：

```ts
import { FaceDirection, FaceGroup } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 打印内置处理器的关键结果，确认方向换算符合预期。 */
function verifyFaceHandler(state: ICoreState): void {
    const dir4 = state.faceManager.get<FaceDirection>(FaceGroup.Dir4);
    const dir8 = state.faceManager.get<FaceDirection>(FaceGroup.Dir8);
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

最后验证自定义处理器：注册后取回，确认六个邻接方向能换算偏移、`movement(RightUp)` 为 `{ x: 1, y: -1 }`、`degrade(Up)` 为 `Unknown`；再把它交给一个新建的移动器或 `finder.useFaceHandler`，重算一次目标格与一条路径，确认只在六个方向上扩展。已构造好的移动器不会发生变化，若结果没变，先检查是否仍在用旧的处理器。

返回[高级 I 导览](./index.md)。
