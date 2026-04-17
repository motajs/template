import {
    DirectionMapper,
    IDirectionDescriptor,
    InternalDirectionGroup,
    IManhattanRangeParam,
    IRange,
    IRayRangeParam,
    IRectRangeParam,
    ManhattanRange,
    RayRange,
    RectRange,
    ITileLocator
} from '@motajs/common';
import {
    IEnemyContext,
    IMapDamageConverter,
    IMapDamageInfo,
    IMapDamageInfoExtra,
    IMapDamageReducer,
    IReadonlyEnemyHandler,
    ISpecial,
    IMapDamageView,
    IReadonlyHeroAttribute
} from '@user/data-base';
import { IZoneValue } from './special';
import { IEnemyAttr, MapDamageType } from './types';
import { IHeroAttr } from '../hero';

const RECT_RANGE = new RectRange();
const MANHATTAN_RANGE = new ManhattanRange();
const RAY_RANGE = new RayRange();

const DIRECTION_MAPPER = new DirectionMapper();
const DIR4 = [...DIRECTION_MAPPER.map(InternalDirectionGroup.Dir4)];

//#region 地图伤害

abstract class BaseMapDamageView<T> implements IMapDamageView<T> {
    constructor(
        protected readonly context: IEnemyContext<IEnemyAttr, IHeroAttr>
    ) {}

    abstract getRange(): IRange<T>;

    abstract getRangeParam(): T;

    getDamageAt(locator: ITileLocator): Readonly<IMapDamageInfo> | null {
        const range = this.getRange();
        const param = this.getRangeParam();
        range.bindHost(this.context);
        if (!range.inRange(locator.x, locator.y, param)) {
            return null;
        }

        return this.getDamageWithoutCheck(locator);
    }

    abstract getDamageWithoutCheck(
        locator: ITileLocator
    ): Readonly<IMapDamageInfo> | null;

    /**
     * 创建伤害信息
     * @param damage 伤害值
     * @param type 伤害类型
     * @param extra 额外信息
     */
    protected createInfo(
        damage: number,
        type: number,
        extra?: Partial<IMapDamageInfoExtra>
    ): IMapDamageInfo {
        return {
            damage,
            type,
            extra: {
                catch: extra?.catch ?? new Set(),
                repulse: extra?.repulse ?? new Set()
            }
        };
    }
}

export class ZoneDamageView extends BaseMapDamageView<
    IRectRangeParam | IManhattanRangeParam
> {
    constructor(
        context: IEnemyContext<IEnemyAttr, IHeroAttr>,
        private readonly locator: Readonly<ITileLocator>,
        private readonly special: Readonly<ISpecial<IZoneValue>>
    ) {
        super(context);
    }

    getRange(): IRange<IRectRangeParam | IManhattanRangeParam> {
        return this.special.value.zoneSquare ? RECT_RANGE : MANHATTAN_RANGE;
    }

    getRangeParam(): IRectRangeParam | IManhattanRangeParam {
        if (this.special.value.zoneSquare) {
            return {
                h: this.special.value.range * 2 + 1,
                w: this.special.value.range * 2 + 1,
                x: this.locator.x - this.special.value.range,
                y: this.locator.y - this.special.value.range
            };
        }

        return {
            cx: this.locator.x,
            cy: this.locator.y,
            radius: this.special.value.range
        };
    }

    getDamageWithoutCheck(): Readonly<IMapDamageInfo> | null {
        return this.createInfo(this.special.value.zone, MapDamageType.Zone);
    }
}

export class RepulseDamageView extends BaseMapDamageView<IManhattanRangeParam> {
    constructor(
        context: IEnemyContext<IEnemyAttr, IHeroAttr>,
        private readonly locator: Readonly<ITileLocator>,
        private readonly special: Readonly<ISpecial<number>>
    ) {
        super(context);
    }

    getRange(): IRange<IManhattanRangeParam> {
        return MANHATTAN_RANGE;
    }

    getRangeParam(): IManhattanRangeParam {
        return {
            cx: this.locator.x,
            cy: this.locator.y,
            radius: 1
        };
    }

    getDamageWithoutCheck(
        locator: ITileLocator
    ): Readonly<IMapDamageInfo> | null {
        if (locator.x === this.locator.x && locator.y === this.locator.y) {
            return null;
        }

        return this.createInfo(this.special.value, MapDamageType.Repulse, {
            repulse: new Set([this.locator])
        });
    }
}

export class LaserDamageView extends BaseMapDamageView<IRayRangeParam> {
    constructor(
        context: IEnemyContext<IEnemyAttr, IHeroAttr>,
        private readonly locator: Readonly<ITileLocator>,
        private readonly special: Readonly<ISpecial<number>>,
        private readonly dir: IDirectionDescriptor[] = DIR4
    ) {
        super(context);
    }

    getRange(): IRange<IRayRangeParam> {
        return RAY_RANGE;
    }

    getRangeParam(): IRayRangeParam {
        return {
            cx: this.locator.x,
            cy: this.locator.y,
            dir: this.dir
        };
    }

    getDamageWithoutCheck(): Readonly<IMapDamageInfo> | null {
        return this.createInfo(this.special.value, MapDamageType.Layer);
    }
}

export class BetweenDamageView extends BaseMapDamageView<IManhattanRangeParam> {
    constructor(
        context: IEnemyContext<IEnemyAttr, IHeroAttr>,
        private readonly locator: Readonly<ITileLocator>,
        private readonly hero: IReadonlyHeroAttribute<IHeroAttr>
    ) {
        super(context);
    }

    getRange(): IRange<IManhattanRangeParam> {
        return MANHATTAN_RANGE;
    }

    getRangeParam(): IManhattanRangeParam {
        return {
            cx: this.locator.x,
            cy: this.locator.y,
            radius: 1
        };
    }

    getDamageWithoutCheck(
        locator: ITileLocator
    ): Readonly<IMapDamageInfo> | null {
        const deltaX = locator.x - this.locator.x;
        const deltaY = locator.y - this.locator.y;
        if (Math.abs(deltaX) + Math.abs(deltaY) !== 1) {
            return null;
        }
        if (deltaX <= 0 && deltaY <= 0) {
            return null;
        }

        const otherX = locator.x + deltaX;
        const otherY = locator.y + deltaY;
        const range = this.getRange();
        range.bindHost(this.context);
        if (!range.inBound(otherX, otherY)) {
            return null;
        }

        const other = this.context.getEnemyByLoc(otherX, otherY);
        if (!other) {
            return null;
        }
        if (!other.getComputedEnemy().hasSpecial(16)) {
            return null;
        }

        const damage = this.hero.getFinalAttribute('hp');
        return this.createInfo(damage, MapDamageType.Between);
    }
}

export class AmbushDamageView extends BaseMapDamageView<IManhattanRangeParam> {
    constructor(
        context: IEnemyContext<IEnemyAttr, IHeroAttr>,
        private readonly locator: Readonly<ITileLocator>
    ) {
        super(context);
    }

    getRange(): IRange<IManhattanRangeParam> {
        return MANHATTAN_RANGE;
    }

    getRangeParam(): IManhattanRangeParam {
        return {
            cx: this.locator.x,
            cy: this.locator.y,
            radius: 1
        };
    }

    getDamageWithoutCheck(): Readonly<IMapDamageInfo> | null {
        return this.createInfo(0, MapDamageType.Unknown, {
            catch: new Set([this.locator])
        });
    }
}

//#endregion

//#region 转换器

export class MainMapDamageConverter implements IMapDamageConverter<
    IEnemyAttr,
    IHeroAttr
> {
    convert(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
        context: IEnemyContext<IEnemyAttr, IHeroAttr>
    ): IMapDamageView<any>[] {
        const views: IMapDamageView<any>[] = [];
        const { enemy, locator } = handler;

        const zone = enemy.getSpecial<IZoneValue>(15);
        if (zone) {
            views.push(new ZoneDamageView(context, locator, zone));
        }

        if (enemy.hasSpecial(16)) {
            views.push(new BetweenDamageView(context, locator, handler.hero));
        }

        const repulse = enemy.getSpecial<number>(18);
        if (repulse) {
            views.push(new RepulseDamageView(context, locator, repulse));
        }

        const laser = enemy.getSpecial<number>(24);
        if (laser) {
            views.push(new LaserDamageView(context, locator, laser));
        }

        if (enemy.hasSpecial(27)) {
            views.push(new AmbushDamageView(context, locator));
        }

        return views;
    }
}

//#endregion

//#region 合并器

export class MainMapDamageReducer implements IMapDamageReducer {
    reduce(info: Iterable<Readonly<IMapDamageInfo>>): Readonly<IMapDamageInfo> {
        let damage = 0;
        let type = MapDamageType.Unknown;
        let maxDamage = -Infinity;
        const extra = {
            catch: new Set<ITileLocator>(),
            repulse: new Set<ITileLocator>()
        };

        for (const item of info) {
            damage += item.damage;
            if (item.damage > maxDamage) {
                maxDamage = item.damage;
                type = item.type;
            }
            item.extra.catch.forEach(v => extra.catch.add(v));
            item.extra.repulse.forEach(v => extra.repulse.add(v));
        }

        return {
            damage,
            extra,
            type
        };
    }
}

//#endregion
