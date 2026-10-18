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

## 示例：八方向激光

内置激光（code 22）用 `FaceGroup.Dir4`（上下左右四个方向）沿射线发射。下面的示例新增一个「八方向激光」特殊属性（code 43），改用 `FaceGroup.Dir8`（再加上四个斜向，共八个方向）发射，其余逻辑与内置激光一致。

示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」；`map.set(...)` 的 `map` 是 `special.ts` 中 `createSpecials(state)` 建的属性表，见[特殊属性](./enemy-specials.md)。

示例里出现的几个名字先简单说明：`FaceGroup.Dir8` 是「八方向」朝向组，`faceManager` 按朝向组管理朝向；`dir.mapMovement()` 把朝向处理器映射成各方向对应的移动量，示例据此取出八个方向（其中「原地不动」的未知方向偏移为零，`RayRange` 会自动跳过它）；`IFaceHandler` / `IFaceDescriptor` 分别是「朝向处理器」与「单个朝向」的类型；`MapDamageType.Layer` 是伤害类型枚举里的「激光伤害」（定义在 `src/data/enemy/types.ts`）。

### 改内置，还是自己写

- **改内置**：直接改 `src/data/enemy/mapDamage.ts` 里的 `LaserDamageView` / `MainMapDamageConverter`，或往转换器里加分支。内置五类地图伤害都实现在那里。
- **写自己的**：实现 `IMapDamageView`（描述一个来源的影响范围与某点的伤害）与 `IMapDamageConverter`（把特殊属性翻译成视图），再用 `useConverter` 注册。下面的示例就是这种写法。

`useConverter` 是**替换**当前转换器：选了自己的就把内置的整个换掉，若要同时保留内置五类，需要在自己的转换器里把它们的视图也收集进去，或直接改内置转换器。

下面代码用 `[模板]` 标出可原样照抄的行，用 `[需改]` 标出必须按需求修改的行。先在 `src/data/enemy/special.ts` 登记这条属性：

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

再写伤害视图与转换器：

```ts
// [模板] 依赖导入：类型分别来自 @motajs/common、@user/data-system、@user/data-base 与 @user/data-common
import {
    IFaceDescriptor,
    IFaceHandler,
    IRange,
    IRayRangeParam,
    ITileLocator,
    RayRange
} from '@motajs/common';
import {
    IEnemyContext,
    IMapDamageConverter,
    IMapDamageInfo,
    IMapDamageView,
    IReadonlyEnemyHandler
} from '@user/data-system';
import { ISpecial } from '@user/data-base';
import { IEnemyAttr, IHeroAttr, FaceGroup } from '@user/data-common';
import { MapDamageType } from './types';
import { ISpecial43Value } from './special';

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

示例只用 `FaceGroup.Dir8` 替换内置的 `FaceGroup.Dir4`，其余与内置激光相同，就得到了八方向激光。

## 合并器

`MainMapDamageReducer.reduce` 的规则很直接：

- 把所有来源的 `damage` 相加；
- 取伤害最大的那条来源的 `type` 作为合并后的类型；
- 把所有来源的 `extra.catch` 与 `extra.repulse` 合并。

多个地图伤害落在同一格时，勇士只会受到合并后的一份伤害。需要不同的取舍规则时，实现 `IMapDamageReducer` 并 `useReducer` 替换即可。

## 实际结算

移动时由 `EnemyMoveHooks.onStepEnd` 调用 `handleMapDamage`：先用 `mapDamage.getReducedDamage(location)` 取合并伤害，再扣减勇士生命、发出提示，并处理阻击后退与捕捉强制战斗。这套结算在当前 `src/data/enemy/hook.ts` 中已经接通：踩到地图伤害格会立即掉血，阻击会推动怪物后退，捕捉会触发强制战斗。
