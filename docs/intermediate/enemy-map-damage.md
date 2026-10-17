# 地图伤害

地图伤害不是通过战斗结算的伤害，而是勇士在地图上移动时，根据怪物与位置自动扣减的生命值。常见形式有领域、夹击、阻击、激光与伏击。整体流程见[战斗总览](./combat-overview.md)。

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

| 类型 | 视图类 | 转换器读取的 code | `special.ts` 中同名属性的 code | 说明 |
|------|--------|-------------------|-------------------------------|------|
| 领域 | `ZoneDamageView` | `getSpecial(15)` | 13 | 范围内自动减血 |
| 夹击 | `BetweenDamageView` | `hasSpecial(16)` | 14 | 两只怪物夹住勇士时扣半血 |
| 阻击 | `RepulseDamageView` | `getSpecial(18)` | 16 | 经过时怪物后退并造成伤害 |
| 激光 | `LaserDamageView` | `getSpecial(24)` | 22 | 同行或同列时造成伤害 |
| 伏击 | `AmbushDamageView` | `hasSpecial(27)` | 未注册 | 返回 0 伤害并附带捕捉标记 |

:::warning 编号与结算：今日可用 vs 待补齐
- **今日可用**：地图伤害系统本身的三个部件——伤害视图、转换器、合并器——都已实现，注册（`useConverter` / `useReducer`）照常可用。只要让特殊属性使用转换器真正读取的 code，或按下方「受地形遮挡的激光」那样自定义属性 + 转换器，地图伤害就能生效。
- **待补齐（编号未对齐）**：上表两组 code 目前并不一致——转换器实际读取的是 15、16、18、24、27，而 `special.ts` 注册的是 13、14、16、22、24，且没有 27。因此按当前 `src/` 代码，直接给怪物挂上内置的「领域 / 夹击 / 阻击 / 激光」特殊属性，并不会产生对应的地图伤害；「伏击」在内置特殊属性里也没有登记。使用内置编号前，请以你的 `src/data/enemy/mapDamage.ts` 为准二选一：让特殊属性改用转换器真正读取的 code，或修改转换器使其与 `special.ts` 对齐。
- **待补齐（实际结算）**：移动时真正的结算逻辑仍在补齐，见下文「实际结算」。
:::

另外两点以当前代码为准：

- `AmbushDamageView` 返回 `MapDamageType.Unknown`，因为 `MapDamageType` 没有「伏击」这一项；它的作用是产生 `extra.catch`，由移动钩子触发强制战斗。
- `BetweenDamageView` 读取全局 flag `betweenAttackMax`，决定夹击伤害是否取「半血、当前怪物伤害、对侧怪物伤害」三者的较小值；对侧怪物通过 `hasSpecial(16)` 识别。

## 示例：受地形遮挡的激光

内置激光使用 `RayRange` 沿四个方向发射，不判断中间是否被地形挡住。下面的示例新增一个「遮挡激光」特殊属性（code 43），沿射线检查路径，遇到非空图块就停止：

示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」；`map.set(...)` 的 `map` 是 `special.ts` 中 `createSpecials(state)` 建的属性表，见[特殊属性](./enemy-specials.md)。

```ts
/** 43 - 遮挡激光 */
export interface ISpecial43Value {
    damage: number;
}

// 43 - 遮挡激光
map.set(
    43,
    defineCommonSerializableSpecial<ISpecial43Value>(
        43,
        { damage: 50 },
        {
            name: '遮挡激光',
            desc: special => `同行或同列时造成${special.value.damage}点伤害，被地形遮挡则无效。`,
            color: '#D0A0DD'
        }
    )
);
```

```ts
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

const RAY_RANGE = new RayRange();

export class BlockedLaserDamageView implements IMapDamageView<IRayRangeParam> {
    private readonly dirs: IFaceDescriptor[];

    constructor(
        private readonly context: IEnemyContext<IEnemyAttr, IHeroAttr>,
        private readonly locator: ITileLocator,
        private readonly special: ISpecial<ISpecial43Value>,
        dir: IFaceHandler<number>
    ) {
        this.dirs = [...dir.mapMovement()].map(v => v[1]);
    }

    getRange(): IRange<IRayRangeParam> {
        return RAY_RANGE;
    }

    getRangeParam(): IRayRangeParam {
        return {
            cx: this.locator.x,
            cy: this.locator.y,
            dir: this.dirs
        };
    }

    getDamageAt(locator: ITileLocator): Readonly<IMapDamageInfo> | null {
        const range = this.getRange();
        range.bindHost(this.context);
        if (!range.inRange(locator.x, locator.y, this.getRangeParam())) {
            return null;
        }
        return this.getDamageWithoutCheck(locator);
    }

    getDamageWithoutCheck(
        locator: ITileLocator
    ): Readonly<IMapDamageInfo> | null {
        if (this.isBlocked(locator)) return null;
        return {
            damage: this.special.value.damage,
            type: MapDamageType.Layer,
            extra: {
                catch: new Set(),
                repulse: new Set()
            }
        };
    }

    /**
     * 判断从怪物到目标点的路径上是否有非空图块
     */
    private isBlocked(target: ITileLocator): boolean {
        const floor = this.context.floor;
        if (!floor) return false;
        const map = this.context.state.maps.getMap(floor);
        const eventLayer = map?.eventLayer;
        if (!eventLayer) return false;

        const dx = Math.sign(target.x - this.locator.x);
        const dy = Math.sign(target.y - this.locator.y);
        let x = this.locator.x + dx;
        let y = this.locator.y + dy;
        while (x !== target.x || y !== target.y) {
            if (eventLayer.getBlock(x, y) !== 0) return true;
            x += dx;
            y += dy;
        }
        return false;
    }
}

export class BlockedLaserConverter implements IMapDamageConverter<
    IEnemyAttr,
    IHeroAttr
> {
    convert(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
        context: IEnemyContext<IEnemyAttr, IHeroAttr>
    ): IMapDamageView<any>[] {
        const special = handler.enemy.getSpecial<ISpecial43Value>(43);
        if (!special) return [];
        const face = handler.state.faceManager.get(FaceGroup.Dir4)!;
        return [new BlockedLaserDamageView(context, handler.locator, special, face)];
    }
}

const mapDamage = state.enemyContext.getMapDamage();
mapDamage?.useConverter(new BlockedLaserConverter());
```

示例用 `eventLayer.getBlock(x, y)` 判断遮挡；如果你的项目把地形放在别的图层，替换成对应图层的 `getBlock` 即可。`useConverter` 会替换掉内置转换器，若要保留内置五类，需要在转换器里同时收集内置视图，或修改 `MainMapDamageConverter`。

## 合并器

`MainMapDamageReducer.reduce` 的规则很直接：

- 把所有来源的 `damage` 相加；
- 取伤害最大的那条来源的 `type` 作为合并后的类型；
- 把所有来源的 `extra.catch` 与 `extra.repulse` 合并。

多个地图伤害落在同一格时，勇士只会受到合并后的一份伤害。需要不同的取舍规则时，实现 `IMapDamageReducer` 并 `useReducer` 替换即可。

## 实际结算

移动时由 `EnemyMoveHooks.onStepEnd` 调用 `handleMapDamage`：先用 `mapDamage.getReducedDamage(location)` 取合并伤害，再扣减勇士生命、发出提示，并处理阻击后退与捕捉强制战斗。当前 `src/` 中地图伤害的实际结算仍在补齐；以上是移动钩子当前的处理方式，若你使用的版本结算逻辑不同，以当时代码为准。
