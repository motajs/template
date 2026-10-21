# 自定义范围对象

光环要影响「周围的怪物」，地图伤害要判定「勇士踩进的格子」，查询也常常要问「这一圈里有哪些目标」。这些需求表面不同，底层都是同一件事：**以某个坐标为中心，枚举或判断一片格子**。负责这件事的对象就是范围对象 `IRange`。

本篇说明 `IRange` 的职责、它和宿主的关系、内置范围各自的参数，最后给出一个可直接复用的自定义范围类。读完你应当能判断：一个需求该用哪个内置范围，以及内置范围不够时该怎么补一个。

## 范围对象解决什么问题

范围对象把「哪些格子算在范围内」从具体系统里抽出来。光环不需要知道范围是矩形还是菱形，只需要拿到一个 `IRange` 与一份参数；地图伤害也一样。于是同一个自定义范围可以同时被多个系统复用，而不必在每个系统里各写一遍坐标循环。

范围对象输出的是**坐标索引**，不是 `{ x, y }` 对象。约定是：

```ts
const index = y * width + x;
```

其中 `width` 是宿主的宽度。`iterateLoc`、`scan`、`iterate` 返回的都是这种索引；需要坐标时再拆回去：

```ts
const x = index % width;
const y = Math.floor(index / width);
```

`inRange(x, y, param)` 接收坐标，`inRangeIndex(index, param)` 接收索引，两者判断的是同一件事。

## 范围对象与宿主

范围对象本身不保存地图。它只保存宿主的**尺寸**，因为枚举时需要知道边界在哪里。宿主接口只有两个成员：

```ts
export interface IRangeHost {
    /** 区域整体宽度 */
    readonly width: number;
    /** 区域整体高度 */
    readonly height: number;
}
```

`bindHost(host)` 把宿主尺寸交给范围对象；`inBound(x, y)` 与 `inBoundIndex(index)` 用这份尺寸判断点是否落在宿主内。`BaseRange` 的宿主初始是 `{ width: 0, height: 0 }`，所以**没有绑定宿主之前，任何范围都是空的**。

地图上下文、图层对象都可以充当宿主，只要它们有 `width` 与 `height`。绑定发生在系统内部：光环构建时上下文会绑定自己，地图伤害刷新时也会绑定上下文。自定义范围不需要自己保存地图宽高，更不要在不同尺寸的地图之间共用同一个已绑定的范围实例。

## 接口职责

`IRange<T>` 的成员可以按「输入什么、输出什么」分成三组：

| 成员                         | 作用                                                     | 计算量         |
| ---------------------------- | -------------------------------------------------------- | -------------- |
| `iterateLoc(param)`          | 枚举范围内全部索引，顺序由范围自己决定                   | 与范围面积相关 |
| `inRange(x, y, param)`       | 判断单个坐标是否在范围内                                 | 一次判定       |
| `inRangeIndex(index, param)` | 判断单个索引是否在范围内，内部会拆回坐标再调用 `inRange` | 一次判定       |
| `iterate(list, param)`       | 遍历一个已有索引列表，只保留落在范围内的项               | 与列表长度相关 |
| `scan(list, param)`          | 按范围顺序遍历范围，只输出同时存在于列表中的项           | 与范围面积相关 |
| `autoDetect(list, param)`    | 在 `iterate` 与 `scan` 之间自动选择                      | 取决于估算结果 |

`scan` 与 `iterate` 的差别只是「先遍历谁」：`scan` 先走范围、再查集合，适合范围小、列表大的情况；`iterate` 先走列表、再逐个判定，适合列表小、范围大的情况。`autoDetect` 用 `estimatePointCount(param)` 估算范围大小，再和 `list.size` 比较，决定走哪一条。这个估算不需要精确，它只影响性能，不影响结果。

`BaseRange` 已经实现了 `inRangeIndex`、`iterate`、`scan`、`autoDetect`。继承它时通常只需要实现三个方法：`estimatePointCount`、`iterateLoc`、`inRange`。

## 内置范围与参数

以下范围都从 `@motajs/common` 导出：

| 范围类           | 参数类型               | 参数含义                                | 适用场景                     |
| ---------------- | ---------------------- | --------------------------------------- | ---------------------------- |
| `FullRange`      | `void`                 | 无                                      | 全图，例如全局光环           |
| `RectRange`      | `IRectRangeParam`      | `x`、`y` 为左上角，`w`、`h` 为宽高      | 矩形区域，例如十字以外的方块 |
| `ManhattanRange` | `IManhattanRangeParam` | `cx`、`cy` 为中心，`radius` 为半径      | 菱形范围，距离按曼哈顿距离算 |
| `RayRange`       | `IRayRangeParam`       | `cx`、`cy` 为中心，`dir` 为方向增量列表 | 从一点向若干方向发射的射线   |
| `NoneRange`      | `void`                 | 无                                      | 永远为空，用于关闭范围效果   |

几个容易混淆的点：

- `RectRange` 的 `w`、`h` 可以为负，内部会按 `min` / `max` 归一化；枚举时会裁掉宿主外的部分。
- `ManhattanRange` 的 `radius` 会取绝对值；半径内包含中心，`radius: 0` 只命中中心。
- `RayRange` 的 `dir` 是 `IFaceDescriptor[]`，每一项形如 `{ x: 1, y: 0 }`。中心点只要在宿主内就会命中；同一格被多条射线覆盖时只输出一次。
- `FullRange` 与 `NoneRange` 不需要参数，泛型参数是 `void`。

## 自定义范围

内置范围覆盖不了时，继承 `BaseRange<T>` 写一个类即可。下面是一个**环形范围**：只保留曼哈顿距离**恰好等于** `radius` 的格子，也就是菱形边框，不含中心与内部。

```ts
import { BaseRange } from '@motajs/common';

// 环形范围的参数：以 (cx, cy) 为中心，只保留距离恰好为 radius 的格
export interface IRingRangeParam {
    cx: number;
    cy: number;
    radius: number;
}

export class RingRange extends BaseRange<IRingRangeParam> {
    // autoDetect 用这个估算决定走 iterate 还是 scan，不要求精确
    protected estimatePointCount(param: Readonly<IRingRangeParam>): number {
        const radius = Math.abs(param.radius);
        // 半径 0 退化为单点；否则曼哈顿距离恰为 radius 的格子有 4 * radius 个
        return radius === 0 ? 1 : 4 * radius;
    }

    // 必须与下面的 inRange 判定完全一致，否则 scan 会漏格或多格
    *iterateLoc(param: Readonly<IRingRangeParam>): Iterable<number> {
        const { width, height } = this.host;
        const radius = Math.abs(param.radius);
        for (let dy = -radius; dy <= radius; dy++) {
            const y = param.cy + dy;
            if (y < 0 || y >= height) continue;

            // 每一行只保留左右两个端点：距离中心恰好为 radius 的位置
            const span = radius - Math.abs(dy);
            if (span === 0) {
                if (this.inBound(param.cx, y)) yield y * width + param.cx;
                continue;
            }

            const left = param.cx - span;
            const right = param.cx + span;
            if (this.inBound(left, y)) yield y * width + left;
            if (this.inBound(right, y)) yield y * width + right;
        }
    }

    inRange(x: number, y: number, param: Readonly<IRingRangeParam>): boolean {
        const radius = Math.abs(param.radius);
        return (
            this.inBound(x, y) &&
            Math.abs(x - param.cx) + Math.abs(y - param.cy) === radius
        );
    }
}
```

三个实现各有分工：

- `estimatePointCount` 只服务 `autoDetect`，返回值偏大或偏小都只会让选型变差，不会改变命中结果；
- `iterateLoc` 决定「枚举时输出哪些格」，必须和 `inRange` 使用同一套判定；
- `inRange` 决定「单个点算不算命中」，越界必须先由 `inBound` 收口，不能只比较距离。

`radius` 统一取绝对值，因此 `-2` 与 `2` 等价。`radius: 0` 时环形退化为中心单点，这与 `inRange` 的 `距离 === 0` 判定一致。

## 绑定到系统

系统会自己调用 `bindHost`，你只需要把范围对象与参数传进去。以怪物上下文为例：

```ts
const loc = state.hero.getLocation();
const hits = state.enemyContext.scanRange(new RingRange(), {
    cx: loc.x,
    cy: loc.y,
    radius: 2
});

for (const [hit, view] of hits) {
    // hit 是命中坐标，view 是该位置的怪物视图
    console.log('命中', hit.x, hit.y, view.getBaseEnemy().getAttribute('hp'));
}
```

`scanRange` 内部会先 `range.bindHost(this)`，再用 `autoDetect` 在「遍历怪物列表」与「遍历范围」之间选一条路径。自定义范围不需要知道怪物列表长什么样。

如果要在自己的函数里复用范围，也可以显式接收宿主：

```ts
import { IRange, IRangeHost } from '@motajs/common';

function collectRing(
    range: IRange<IRingRangeParam>,
    param: IRingRangeParam,
    host: IRangeHost
): number[] {
    // 宿主由调用方注入，范围对象只借用宽度与高度
    range.bindHost(host);
    return [...range.iterateLoc(param)];
}
```

地图伤害与光环视图也是同样的用法：地图伤害在刷新时调用 `range.bindHost(this.context)`，再遍历 `range.iterateLoc(param)`；光环则由上下文统一绑定。具体视图写法见[地图伤害](../../intermediate/enemy-map-damage.md)与[怪物光环](../../intermediate/enemy-aura.md)。

## 与视图和转换器的关系

光环视图通过 `range` 与 `getRangeParam()` 返回「范围对象 + 参数」，上下文拿这两个值去扫描；地图伤害视图通过 `getRange()` 与 `getRangeParam()` 做同样的事。范围对象只负责「哪些格」，不负责「命中后做什么」——后者由视图的 `apply`、`applySpecial` 或 `getDamageWithoutCheck` 决定。转换器如何构造视图、优先级如何排队，见[怪物光环](../../intermediate/enemy-aura.md)，本篇不再重复。

## 怎么验证

先确认上下文已绑定勇士。正常初始化流程会调用 `state.enemyContext.bindHero(state.hero.getAttribute())`；如果你在最小环境里手动搭上下文，需要自己补这一步。

把勇士放在一只怪物旁边，执行：

```ts
state.enemyContext.bindHero(state.hero.getAttribute());

const loc = state.hero.getLocation();
const hits = [
    ...state.enemyContext.scanRange(new RingRange(), {
        cx: loc.x,
        cy: loc.y,
        radius: 2
    })
];

for (const [hit] of hits) {
    console.log(`命中 (${hit.x}, ${hit.y})`);
}
```

预期现象：只输出与勇士曼哈顿距离恰好为 `2` 的格子，最多 8 格；中心与距离为 `1` 的格子不会出现。如果勇士靠近地图边缘，超出地图的格会被裁掉，数量相应减少。场景里没有怪物时，可以先放两只测试怪，或临时用 `collectRing` 直接检查索引数量。

## 边界与注意

- **越界必须返回 `false`**：`inRange` 先调用 `inBound`，再比较距离。只比较距离会让地图外的坐标也命中。
- **`iterateLoc` 与 `inRange` 必须同源**：两者判定不一致时，`scan` 会按范围枚举出一批格，再用另一套规则判断，结果就会漏格或多格。写完自定义范围后，用同一组参数分别跑 `iterateLoc` 与逐点 `inRange` 对照一次。
- **`estimatePointCount` 只是估算**：它不参与命中判定，也不需要考虑地图裁剪。估得不准只会让 `autoDetect` 选错路径，不会改变结果。
- **负半径按绝对值处理**：这是本篇示例的约定；如果你希望负半径表示「无效」，要在 `inRange` 与 `iterateLoc` 里同时改，不能只改一处。
- **绑定后的范围实例不要跨地图共用**：`bindHost` 是可变状态，同一个实例先后绑定不同尺寸的宿主时，后一次会覆盖前一次。需要并行处理多张地图时，每张地图各用一个实例，或在每次使用前重新绑定。
- **`radius: 0` 是中心单点**：环形范围在半径为 0 时没有「边框」可枚举，按距离恰好为 0 处理，只命中中心。

返回[高级 II 导览](./index.md)。
