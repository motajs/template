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
    IEnemyAuraView,
    IEnemyContext,
    IEnemySpecialModifier,
    IEnemyView,
    IReadonlyEnemy,
    ISpecial,
    IEnemy
} from '@user/data-base';
import { IHaloValue } from './special';
import { IEnemyAttributes } from './types';

const FULL_RANGE = new FullRange();
const RECT_RANGE = new RectRange();
const MANHATTAN_RANGE = new ManhattanRange();

//#region 25-光环

export class CommonAuraConverter implements IAuraConverter<IEnemyAttributes> {
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 25;
    }

    convert(
        special: ISpecial<IHaloValue>,
        enemy: IReadonlyEnemy<IEnemyAttributes>,
        locator: ITileLocator
    ): CommonAura {
        return new CommonAura(enemy, special, locator);
    }
}

export class CommonAura implements IEnemyAuraView<
    IEnemyAttributes,
    IRectRangeParam | IManhattanRangeParam | void,
    IHaloValue
> {
    readonly priority: number = 25;
    readonly couldApplyBase: boolean = true;
    readonly couldApplySpecial: boolean = false;
    readonly range: IRange<IRectRangeParam | IManhattanRangeParam | void>;

    constructor(
        readonly enemy: IReadonlyEnemy<IEnemyAttributes>,
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
        enemy: IEnemy<IEnemyAttributes>,
        baseEnemy: IReadonlyEnemy<IEnemyAttributes>
    ): void {
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

    applySpecial(): IEnemySpecialModifier<IEnemyAttributes> | null {
        return null;
    }
}

//#endregion

//#region 26-支援

export class GuardAuraConverter implements IAuraConverter<IEnemyAttributes> {
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 26;
    }

    convert(
        special: ISpecial<void>,
        enemy: IReadonlyEnemy<IEnemyAttributes>,
        locator: ITileLocator,
        context: IEnemyContext<IEnemyAttributes>
    ): GuardAura {
        return new GuardAura(context, enemy, special, locator);
    }
}

export class GuardAura implements IEnemyAuraView<
    IEnemyAttributes,
    IRectRangeParam,
    void
> {
    readonly priority: number = 26;
    readonly couldApplyBase: boolean = true;
    readonly couldApplySpecial: boolean = false;
    readonly range: IRange<IRectRangeParam> = RECT_RANGE;

    private readonly sourceView: IEnemyView<IEnemyAttributes> | null;

    constructor(
        context: IEnemyContext<IEnemyAttributes>,
        readonly enemy: IReadonlyEnemy<IEnemyAttributes>,
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

    apply(
        enemy: IEnemy<IEnemyAttributes>,
        _baseEnemy: IReadonlyEnemy<IEnemyAttributes>,
        locator: ITileLocator
    ): void {
        if (!this.sourceView) return;
        if (locator.x === this.locator.x && locator.y === this.locator.y) {
            return;
        }
        enemy.getAttribute('guard').add(this.sourceView);
    }

    applySpecial(): IEnemySpecialModifier<IEnemyAttributes> | null {
        return null;
    }
}

//#endregion
