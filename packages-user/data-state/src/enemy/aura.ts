import {
    FullRange,
    IManhattanRangeParam,
    IRange,
    IRectRangeParam,
    ManhattanRange,
    RectRange
} from '@motajs/common';
import {
    IAuraConverter,
    IEnemyAuraView,
    IEnemySpecialModifier,
    IReadonlyEnemy,
    ISpecial,
    IEnemy
} from '@user/data-base';
import { IHaloValue } from './special';
import { ITileLocator } from '@user/types';

const FULL_RANGE = new FullRange();
const RECT_RANGE = new RectRange();
const MANHATTAN_RANGE = new ManhattanRange();

//#region 25-光环

export class CommonAuraConverter implements IAuraConverter {
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 25;
    }

    convert(
        special: ISpecial<any>,
        enemy: IReadonlyEnemy,
        locator: ITileLocator
    ): IEnemyAuraView<any, any> {
        return new CommonAura(enemy, special as ISpecial<IHaloValue>, locator);
    }
}

export class CommonAura implements IEnemyAuraView<
    IRectRangeParam | IManhattanRangeParam | void,
    IHaloValue
> {
    readonly priority: number = 25;
    readonly couldApplyBase: boolean = true;
    readonly couldApplySpecial: boolean = false;

    readonly range: IRange<IRectRangeParam | IManhattanRangeParam | void>;

    constructor(
        readonly enemy: IReadonlyEnemy,
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

    apply(enemy: IEnemy, baseEnemy: IReadonlyEnemy): void {
        const { hpBuff, atkBuff, defBuff } = this.special.value;

        if (hpBuff !== 0) {
            enemy.setAttribute(
                'hp',
                enemy.getAttribute('hp') +
                    Math.floor((baseEnemy.getAttribute('hp') * hpBuff) / 100)
            );
        }

        if (atkBuff !== 0) {
            enemy.setAttribute(
                'atk',
                enemy.getAttribute('atk') +
                    Math.floor((baseEnemy.getAttribute('atk') * atkBuff) / 100)
            );
        }

        if (defBuff !== 0) {
            enemy.setAttribute(
                'def',
                enemy.getAttribute('def') +
                    Math.floor((baseEnemy.getAttribute('def') * defBuff) / 100)
            );
        }
    }

    applySpecial(): IEnemySpecialModifier | null {
        return null;
    }
}

//#endregion
