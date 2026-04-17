import {
    FullRange,
    IManhattanRangeParam,
    IRange,
    IRectRangeParam,
    ITileLocator,
    ManhattanRange,
    RectRange
} from '@motajs/common';
import {
    IAuraConverter,
    IEnemyHandler,
    IEnemyAuraView,
    IEnemyContext,
    IEnemySpecialModifier,
    IEnemyView,
    IReadonlyEnemyHandler,
    IReadonlyEnemy,
    ISpecial
} from '@user/data-base';
import { IHaloValue } from './special';
import { IEnemyAttr } from './types';
import { IHeroAttr } from '../hero';

const FULL_RANGE = new FullRange();
const RECT_RANGE = new RectRange();
const MANHATTAN_RANGE = new ManhattanRange();

//#region 25-光环

export class CommonAuraConverter implements IAuraConverter<
    IEnemyAttr,
    IHeroAttr
> {
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 25;
    }

    convert(
        special: ISpecial<IHaloValue>,
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): CommonAura {
        return new CommonAura(handler.enemy, special, handler.locator);
    }
}

export class CommonAura implements IEnemyAuraView<
    IEnemyAttr,
    IRectRangeParam | IManhattanRangeParam | void,
    IHaloValue
> {
    readonly priority: number = 25;
    readonly couldApplyBase: boolean = true;
    readonly couldApplySpecial: boolean = false;
    readonly range: IRange<IRectRangeParam | IManhattanRangeParam | void>;

    constructor(
        readonly enemy: IReadonlyEnemy<IEnemyAttr>,
        readonly special: ISpecial<IHaloValue>,
        readonly locator: ITileLocator
    ) {
        this.range = this.createRange();
    }

    private createRange(): IRange<
        IRectRangeParam | IManhattanRangeParam | void
    > {
        const { haloRange, haloSquare } = this.special.value;
        if (haloRange <= 0) {
            return FULL_RANGE;
        }
        return haloSquare ? RECT_RANGE : MANHATTAN_RANGE;
    }

    getRangeParam(): IRectRangeParam | IManhattanRangeParam | void {
        const { haloRange, haloSquare } = this.special.value;
        if (haloRange <= 0) {
            return undefined;
        }
        if (haloSquare) {
            return {
                x: this.locator.x - haloRange,
                y: this.locator.y - haloRange,
                w: haloRange * 2 + 1,
                h: haloRange * 2 + 1
            };
        }
        return {
            cx: this.locator.x,
            cy: this.locator.y,
            radius: haloRange
        };
    }

    apply(
        handler: IEnemyHandler<IEnemyAttr, unknown>,
        baseEnemy: IReadonlyEnemy<IEnemyAttr>
    ): void {
        const { enemy } = handler;
        const { hpBuff, atkBuff, defBuff } = this.special.value;

        if (hpBuff !== 0) {
            const hpValue = (baseEnemy.getAttribute('hp') * hpBuff) / 100;
            enemy.addAttribute('hp', Math.floor(hpValue));
        }

        if (atkBuff !== 0) {
            const atkValue = (baseEnemy.getAttribute('atk') * atkBuff) / 100;
            enemy.addAttribute('atk', Math.floor(atkValue));
        }

        if (defBuff !== 0) {
            const defValue = (baseEnemy.getAttribute('def') * defBuff) / 100;
            enemy.addAttribute('def', Math.floor(defValue));
        }
    }

    applySpecial(): IEnemySpecialModifier<IEnemyAttr> | null {
        return null;
    }
}

//#endregion

//#region 26-支援

export class GuardAuraConverter implements IAuraConverter<
    IEnemyAttr,
    IHeroAttr
> {
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 26;
    }

    convert(
        special: ISpecial<void>,
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
        context: IEnemyContext<IEnemyAttr, IHeroAttr>
    ): GuardAura {
        return new GuardAura(context, handler.enemy, special, handler.locator);
    }
}

export class GuardAura implements IEnemyAuraView<
    IEnemyAttr,
    IRectRangeParam,
    void
> {
    readonly priority: number = 26;
    readonly couldApplyBase: boolean = true;
    readonly couldApplySpecial: boolean = false;
    readonly range: IRange<IRectRangeParam> = RECT_RANGE;

    private readonly sourceView: IEnemyView<IEnemyAttr> | null;

    constructor(
        context: IEnemyContext<IEnemyAttr, IHeroAttr>,
        readonly enemy: IReadonlyEnemy<IEnemyAttr>,
        readonly special: ISpecial<void>,
        readonly locator: ITileLocator
    ) {
        this.sourceView = context.getViewByComputed(enemy);
    }

    getRangeParam(): IRectRangeParam {
        return {
            x: this.locator.x - 1,
            y: this.locator.y - 1,
            w: 3,
            h: 3
        };
    }

    apply(handler: IEnemyHandler<IEnemyAttr, IHeroAttr>): void {
        if (!this.sourceView) return;
        const { enemy, locator } = handler;
        if (locator.x === this.locator.x && locator.y === this.locator.y) {
            return;
        }
        enemy.getAttribute('guard').add(this.sourceView);
    }

    applySpecial(): IEnemySpecialModifier<IEnemyAttr> | null {
        return null;
    }
}

//#endregion
