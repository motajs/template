# 地图伤害

地图伤害不是通过战斗结算的伤害，而是勇士在地图上移动时，根据怪物与位置自动扣减的生命值。常见形式有领域、夹击、阻击、激光与捕捉。整体流程见[战斗总览](./combat-overview.md)。

## 三部分

地图伤害系统由三部分组成：

- **伤害视图** `IMapDamageView`：描述一个来源的影响范围，以及某个位置会受到多少伤害；
- **转换器** `IMapDamageConverter`：把一个怪物的特殊属性转换成一组伤害视图；
- **合并器** `IMapDamageReducer`：当一个位置同时受到多个来源影响时，决定最终取什么伤害。

伤害视图的核心方法：

- `getRange()` / `getRangeParam()`：返回范围对象与范围参数；
- `getDamageAt(locator)`：先判断坐标是否在范围内，再取伤害；
- `getDamageWithoutCheck(locator)`：不判断范围，直接取该位置的伤害。

伤害信息 `IMapDamageInfo` 包含 `damage`（伤害值）、`type`（伤害类型）与 `extra`（额外信息）。`extra.catch` 记录需要触发强制战斗的怪物位置，`extra.repulse` 记录需要后退的阻击怪物位置。

## 注册

地图伤害管理器由 `state.enemyContext.getMapDamage()` 取得。注册方式：

```ts
const mapDamage = state.enemyContext.getMapDamage();
mapDamage?.useReducer(new MainMapDamageReducer());
mapDamage?.useConverter(new MainMapDamageConverter());
```

`initializeEnemy` 已经按上面的顺序注册了 `MainMapDamageReducer` 与 `MainMapDamageConverter`。`useConverter` 会替换当前转换器，`useReducer` 会替换当前合并器。

## 内置五类

`MapDamageType` 定义了 `Unknown`、`Zone`、`Layer`、`Repulse`、`Between` 五种类型。内置视图与转换器在 `src/data/enemy/mapDamage.ts`：

| 类型 | 视图类              | 内置特殊属性 code       | 说明                         |
| ---- | ------------------- | ----------------------- | ---------------------------- |
| 领域 | `ZoneDamageView`    | 13（`ISpecial13Value`） | 范围内自动减血               |
| 夹击 | `BetweenDamageView` | 14                      | 两只怪物夹住勇士时扣半血     |
| 阻击 | `RepulseDamageView` | 16                      | 经过时怪物后退并造成伤害     |
| 激光 | `LaserDamageView`   | 22                      | 同行或同列时造成伤害         |
| 捕捉 | `AmbushDamageView`  | 25                      | 触发强制战斗，本身不造成伤害 |

表中的 code 就是 `src/data/enemy/special.ts` 里同名内置属性注册的编号，转换器读取的也是同一组编号。要启用某类地图伤害，给怪物挂上对应的内置特殊属性即可，不需要再换算编号或修改转换器。

另外两点以当前代码为准：

- 「捕捉」的视图类名沿用 `AmbushDamageView`（伏击），它读取的是 code 25「捕捉」。它返回 `MapDamageType.Unknown`，因为 `MapDamageType` 没有「捕捉」这一项；伤害恒为 0，作用是产生 `extra.catch`，由移动钩子触发强制战斗。捕捉本身不造成伤害是设计如此，不是未补齐的功能。
- `BetweenDamageView` 读取全局 flag `betweenAttackMax`，决定夹击伤害是否取「半血、当前怪物伤害、对侧怪物伤害」三者的较小值；对侧怪物通过 `hasSpecial(14)` 识别，与夹击自身使用的是同一个编号。

## 改内置：调整内置视图与转换器

内置五类地图伤害的视图与转换器都写在 `src/data/enemy/mapDamage.ts`，而且已经在 `initializeEnemy` 里注册好了。所以**改内置就是改这些类的现有方法、或往 `MainMapDamageConverter.convert` 里加一个分支**——不新建类，也不用再调用 `useConverter`。这是本篇的主线做法。

先按「想改什么」找落点：

| 想改的东西             | 改哪里                                                                |
| ---------------------- | --------------------------------------------------------------------- |
| 某类伤害的范围         | 对应视图的 `getRange` / `getRangeParam`                               |
| 某类伤害的数值或类型   | 对应视图的 `getDamageWithoutCheck`                                    |
| 某类伤害读哪个特殊属性 | `MainMapDamageConverter.convert` 里对应的 `getSpecial` / `hasSpecial` |
| 多来源叠加的取舍规则   | `MainMapDamageReducer.reduce`                                         |
| 某类伤害的触发条件     | 对应视图的 `getDamageWithoutCheck`（返回 `null` 即该点不受伤）        |

五个视图都继承自 `BaseMapDamageView`，它已经实现了 `getDamageAt`（先判范围再取伤害）并提供 `createInfo(damage, type, extra?)` 帮你拼伤害信息。所以改一个视图时通常只需要碰 `getRangeParam` 与 `getDamageWithoutCheck` 两个方法。

### 示例：让激光也打斜向（八方向激光）

内置激光（code 22）用 `FaceGroup.Dir4`（上下左右四个方向）沿射线发射。要让同一条内置激光多覆盖四个斜向，最省事的做法是改内置：把转换器里取的朝向组换成 `FaceGroup.Dir8`，`LaserDamageView` 本身一行都不用改——它只是把传入的朝向处理器映射成方向列表，方向多了自然就多打四个斜向。

**目标**：内置激光（code 22）沿上下左右加四个斜向共八个方向发射，其余行为不变。

**改哪里**：`src/data/enemy/mapDamage.ts` 的 `MainMapDamageConverter.convert`（内置文件，改完不需要注册）。

**复制什么**：把取朝向处理器那一行换个方向组——

```ts
convert(
    handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
    context: IEnemyContext<IEnemyAttr, IHeroAttr>
): IMapDamageView<any>[] {
    const views: IMapDamageView<any>[] = [];
    const { enemy, locator, hero } = handler;

    // ...省略：领域 13、夹击 14、阻击 16 的分支，原样保留...

    const laser = enemy.getSpecial<number>(22);
    if (laser) {
        // [需改] 内置是 FaceGroup.Dir4（四方向），改成 Dir8 即八方向
        const face = handler.state.faceManager.get(FaceGroup.Dir8)!;
        views.push(new LaserDamageView(context, locator, laser, face));
    }

    // ...省略：捕捉 25 的分支，原样保留...

    return views;
}
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：只需要把 `FaceGroup.Dir4` 换成 `FaceGroup.Dir8`。`LaserDamageView` 的构造函数把朝向处理器经 `dir.mapMovement()` 映射成方向列表，八方向组自然给出八项；其中「原地不动」的未知方向偏移为零，`RayRange` 会自动跳过它，不必额外处理。

**怎么验证**：给带激光（code 22）的怪物挂上后，站在它八个方向任一格的勇士都应受到伤害；斜向也要覆盖到（这正是与原本四方向激光的区别）。

**注意**：这次改的是**内置激光**，所有挂 code 22 的怪物都会变成八方向。如果只想让某一种新怪物打八方向、其余仍是四方向，就得给它一条新的特殊属性并另写转换器分支——那属于下一节的「自己写」。

### 另外几处常见的改法

- **领域（13）**：`ZoneDamageView.getRangeParam` 按 `square` 在矩形与曼哈顿之间切换。想换算法（例如改成全场），在模块顶部建一个 `const FULL_RANGE = new FullRange();`，让 `getRange` 返回它，并让 `getRangeParam` 返回 `undefined` 即可。
- **阻击（16）**：`RepulseDamageView.getRangeParam` 里的 `radius: 1` 决定触发距离，`getDamageWithoutCheck` 里的 `extra.repulse` 决定哪个怪物后退。想改触发距离，改 `getRangeParam` 的 `radius`。
- **捕捉（25）**：`AmbushDamageView` 的伤害恒为 0、只产出 `extra.catch`。要让捕捉附带伤害，改 `createInfo` 的第一个参数。
- **合并规则**：`MainMapDamageReducer.reduce` 现在是「伤害相加、类型取最大来源」。要改成取最大值、或优先某类型，改这个方法。

## 自己写地图伤害类

只有「内置五类都表达不了、往内置方法体里也塞不进去」时才需要自己写类。典型情况是：一条全新的特殊属性要有自己的范围形态与伤害算法，而它既不是射线、也不是矩形 / 曼哈顿。

自己写类要同时处理视图与转换器两个接口，还要用 `useConverter` 替换内置转换器，改动面比改内置方法体大得多。

**如果你不怎么懂代码，建议直接改内置的视图与转换器（`src/data/enemy/mapDamage.ts`），而不是自己写新的类。** 上面「改内置」一节已经覆盖了调范围、调数值、调方向、调合并规则这些需求；自写转换器意味着你要自己把内置五类视图也重新收集进去，否则它们会全部失效。

`useConverter` 是**替换**当前转换器：选了自己的就把内置的整个换掉，若要同时保留内置五类，需要在自己的转换器里把它们的视图也收集进去，或直接改内置转换器。

### 模板：复制什么、改什么

自己写地图伤害永远是「一个视图 + 一个转换器」两个类。下面是机制本身的骨架，不含任何具体伤害；复制到新文件后按 `[需改]` 修改。

先写视图——它负责「范围、某点的伤害与类型」：

```ts
// [需改] 类名：换成你的视图名
export class XxxDamageView implements IMapDamageView<TRangeParam> {
    // [模板] 构造函数接收引擎传进来的上下文、位置与特殊属性
    constructor(
        private readonly context: IEnemyContext<IEnemyAttr, IHeroAttr>,
        private readonly locator: ITileLocator,
        private readonly special: ISpecial<IXxxValue>
    ) {}

    // [需改] 范围对象：RectRange / ManhattanRange / RayRange / FullRange 之一
    getRange(): IRange<TRangeParam> {
        // [需改] RANGE 换成你在模块顶部建好的范围对象
        return RANGE;
    }

    // [需改] 与范围配套的参数（矩形 { x, y, w, h }；曼哈顿 { cx, cy, radius }；
    //        射线 { cx, cy, dir }；全场返回 undefined）
    getRangeParam(): TRangeParam {
        return undefined as TRangeParam;
    }

    // [模板] 先判范围，再取伤害；通常不需要改
    getDamageAt(locator: ITileLocator): Readonly<IMapDamageInfo> | null {
        const range = this.getRange();
        range.bindHost(this.context);
        if (!range.inRange(locator.x, locator.y, this.getRangeParam())) {
            return null;
        }
        return this.getDamageWithoutCheck(locator);
    }

    // [需改] 真正决定某点的伤害与类型；返回 null 表示该点不受伤
    getDamageWithoutCheck(
        locator: ITileLocator
    ): Readonly<IMapDamageInfo> | null {
        return {
            damage: 0,
            type: MapDamageType.Unknown,
            extra: { catch: new Set(), repulse: new Set() }
        };
    }
}
```

再写转换器——它负责「从怪物身上读出属性，造出视图」：

```ts
// [需改] 类名：换成你的转换器名
export class XxxConverter implements IMapDamageConverter<
    IEnemyAttr,
    IHeroAttr
> {
    // [模板] convert 签名固定：把特殊属性翻译成一组视图
    convert(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
        context: IEnemyContext<IEnemyAttr, IHeroAttr>
    ): IMapDamageView<any>[] {
        // [需改] 读取要转换的特殊属性
        const special = handler.enemy.getSpecial<IXxxValue>(XX);
        if (!special) return [];
        // [需改] 造视图；一条属性也可以返回多个视图
        return [new XxxDamageView(context, handler.locator, special)];
    }
}
```

注册（**替换**当前转换器）：

```ts
const mapDamage = state.enemyContext.getMapDamage();
mapDamage?.useConverter(new XxxConverter());
```

复制后需要改的只有：两个类名、范围对象与参数、`getDamageWithoutCheck` 的伤害 / 类型、转换器读取的 code。

### 示例：八方向激光

下面是一个具体效果，演示怎么把模板填满。它只是填空示范，不是模板本身。

**目标**：新增一个「八方向激光」特殊属性（示例 code 43），沿上下左右加四个斜向共八个方向发射，且不影响内置的四方向激光。

**改哪里**：`src/data/enemy/special.ts` 登记属性；另建文件写伤害视图与转换器；`initializeEnemy` 里用 `useConverter` 替换（见下方「注册在哪里」）。

**复制什么**：先在 `src/data/enemy/special.ts` 登记这条属性——

```ts
/** 43 - 八方向激光 */
export interface ISpecial43Value {
    damage: number; // [需改] 参数：激光造成的伤害
}

// 43 - 八方向激光
map.set(
    43, // [需改] 编号：示例自选的未占用号
    defineCommonSerializableSpecial<ISpecial43Value>(
        43,
        { damage: 50 }, // [需改] 默认参数：默认 50 点伤害
        {
            name: '八方向激光', // [需改] 显示名称
            desc: special =>
                `同行、同列或同斜线时造成${special.value.damage}点伤害。`, // [需改] 悬停说明
            color: '#D0A0DD' // [需改] 名称颜色
        }
    )
);
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

再写伤害视图与转换器——

```ts
// [模板] 范围对象可以复用，在模块顶层建一次即可
const RAY_RANGE = new RayRange();

// [需改] 类名：换成你的视图名
export class EightDirLaserDamageView implements IMapDamageView<IRayRangeParam> {
    // [模板] 存下八个方向的偏移量，供 getRangeParam 使用
    private readonly dirs: IFaceDescriptor[];

    // [模板] 构造函数签名固定：引擎会把上下文、位置、特殊属性与朝向处理器传进来
    constructor(
        private readonly context: IEnemyContext<IEnemyAttr, IHeroAttr>,
        private readonly locator: ITileLocator,
        private readonly special: ISpecial<ISpecial43Value>,
        dir: IFaceHandler<number>
    ) {
        // [模板] mapMovement() 给出「方向 → 偏移」，这里只取偏移（每项的 [1]）
        this.dirs = [...dir.mapMovement()].map(v => v[1]);
    }

    // [模板] 返回射线范围对象
    getRange(): IRange<IRayRangeParam> {
        return RAY_RANGE;
    }

    // [模板] 范围参数：中心点是怪物位置，方向列表是八个方向
    getRangeParam(): IRayRangeParam {
        return {
            cx: this.locator.x,
            cy: this.locator.y,
            dir: this.dirs
        };
    }

    // [模板] 先判断目标点是否落在范围内（RayRange 会跳过零偏移的未知方向）
    getDamageAt(locator: ITileLocator): Readonly<IMapDamageInfo> | null {
        const range = this.getRange();
        range.bindHost(this.context);
        if (!range.inRange(locator.x, locator.y, this.getRangeParam())) {
            return null;
        }
        return this.getDamageWithoutCheck(locator);
    }

    // [需改] 真正决定某点的伤害：这里固定返回本属性登记的伤害与激光类型
    getDamageWithoutCheck(
        locator: ITileLocator
    ): Readonly<IMapDamageInfo> | null {
        return {
            damage: this.special.value.damage,
            type: MapDamageType.Layer,
            extra: {
                catch: new Set(), // [模板] 无捕捉来源
                repulse: new Set() // [模板] 无阻击来源
            }
        };
    }
}

// [需改] 类名：换成你的转换器名
export class EightDirLaserConverter implements IMapDamageConverter<
    IEnemyAttr,
    IHeroAttr
> {
    // [模板] convert 签名固定：把怪物身上的特殊属性翻译成一组视图
    convert(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
        context: IEnemyContext<IEnemyAttr, IHeroAttr>
    ): IMapDamageView<any>[] {
        // [需改] 读取触发本转换器的特殊属性（示例 code 43）
        const special = handler.enemy.getSpecial<ISpecial43Value>(43);
        // [模板] 没有这个属性就不产生视图
        if (!special) return [];
        // [需改] 取八方向朝向处理器（内置激光这里用的是 FaceGroup.Dir4）
        const face = handler.state.faceManager.get(FaceGroup.Dir8)!;
        // [模板] 返回视图数组
        return [
            new EightDirLaserDamageView(context, handler.locator, special, face)
        ];
    }
}

// [需改] 注册这行要挪进 initializeEnemy（见下方「注册在哪里」）
const mapDamage = state.enemyContext.getMapDamage();
mapDamage?.useConverter(new EightDirLaserConverter());
```

**改什么**：编号（`43`）、类名、方向组（本示例 `FaceGroup.Dir8`）与 `getDamageWithoutCheck` 返回的伤害 / 类型换成你自己的。

**怎么验证**：给带该属性的怪物挂上后，站在它八个方向任一格的勇士都应受到伤害；斜向也要覆盖到。同时确认原本带激光（code 22）的怪物仍按四方向工作——如果你没有在自己的转换器里收集内置视图，它不会再生效。

**注意**：`useConverter` 是**替换**当前转换器——选了自己的就把内置的整个换掉；要同时保留内置五类，需要在自己的转换器里把它们的视图也收集进去，或直接改内置转换器。

### 注册在哪里

`useConverter` 要写进 `initializeEnemy`。下面是 `src/data/enemy/initialize.ts` 中该函数的样子（省略了无关的行）：

```ts
export function initializeEnemy(
    state: ICoreState
): IEnemyInitializationReturns {
    // ...省略：怪物管理器、特殊属性、上下文的初始化...

    const ctx = state.enemyContext;
    const damageSystem = new DamageSystem(ctx);
    const mapDamage = new MapDamage(ctx);
    // ...省略：damageSystem.useCalculator(...)...
    mapDamage.useReducer(new MainMapDamageReducer());
    mapDamage.useConverter(new MainMapDamageConverter());
    // [需改] 你自己的转换器在这里替换/追加：
    // mapDamage.useConverter(new EightDirLaserConverter());
    ctx.attachDamageSystem(damageSystem);
    ctx.attachMapDamage(mapDamage);

    // ...省略：绑定勇士、光环、最终效果、脚本、钩子...
}
```

## 合并器

`MainMapDamageReducer.reduce` 的规则很直接：

- 把所有来源的 `damage` 相加；
- 取伤害最大的那条来源的 `type` 作为合并后的类型；
- 把所有来源的 `extra.catch` 与 `extra.repulse` 合并。

多个地图伤害落在同一格时，勇士只会受到合并后的一份伤害。需要不同的取舍规则时，改内置的 `reduce` 方法即可；只有在整条合并逻辑都要换掉时才实现 `IMapDamageReducer` 并用 `useReducer` 替换。

## 实际结算

移动时由 `EnemyMoveHooks.onStepEnd` 调用 `handleMapDamage`：先用 `mapDamage.getReducedDamage(location)` 取合并伤害，再扣减勇士生命、发出提示，并处理阻击后退与捕捉强制战斗。这套结算在当前 `src/data/enemy/hook.ts` 中已经接通：踩到地图伤害格会立即掉血，阻击会推动怪物后退，捕捉会触发强制战斗。
