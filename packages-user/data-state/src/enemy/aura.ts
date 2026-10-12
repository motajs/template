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
    IReadonlyEnemyHandler
} from '@user/data-system';
import { IReadonlyEnemy, ISpecial } from '@user/data-base';
import { ISpecial23Value, ISpecial26Value } from './special';
import { IHeroAttr, IEnemyAttr } from '@user/data-common';

const FULL_RANGE = new FullRange();
const RECT_RANGE = new RectRange();
const MANHATTAN_RANGE = new ManhattanRange();

//#region 23-光环

export class CommonAuraConverter implements IAuraConverter<
    IEnemyAttr,
    IHeroAttr
> {
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 23;
    }

    convert(
        special: ISpecial<ISpecial23Value>,
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): CommonAura {
        return new CommonAura(handler.enemy, special, handler.locator);
    }
}

export class CommonAura implements IEnemyAuraView<
    IEnemyAttr,
    IRectRangeParam | IManhattanRangeParam | void,
    ISpecial23Value
> {
    readonly priority: number = 10;
    readonly couldApplyBase: boolean = true;
    readonly couldApplySpecial: boolean = false;
    readonly range: IRange<IRectRangeParam | IManhattanRangeParam | void>;

    constructor(
        readonly enemy: IReadonlyEnemy<IEnemyAttr>,
        readonly special: ISpecial<ISpecial23Value>,
        readonly locator: ITileLocator
    ) {
        this.range = this.createRange();
    }

    private createRange(): IRange<
        IRectRangeParam | IManhattanRangeParam | void
    > {
        const { range, square } = this.special.value;
        if (range <= 0) {
            return FULL_RANGE;
        }
        return square ? RECT_RANGE : MANHATTAN_RANGE;
    }

    getRangeParam(): IRectRangeParam | IManhattanRangeParam | void {
        const { range, square } = this.special.value;
        if (range <= 0) {
            return undefined;
        }
        if (square) {
            return {
                x: this.locator.x - range,
                y: this.locator.y - range,
                w: range * 2 + 1,
                h: range * 2 + 1
            };
        }
        return {
            cx: this.locator.x,
            cy: this.locator.y,
            radius: range
        };
    }

    apply(
        handler: IEnemyHandler<IEnemyAttr, any>,
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

//#region 24-支援

export class GuardAuraConverter implements IAuraConverter<
    IEnemyAttr,
    IHeroAttr
> {
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 24;
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
    readonly priority: number = 5;
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
        enemy.getAttribute('guard').add(this.locator);
    }

    applySpecial(): IEnemySpecialModifier<IEnemyAttr> | null {
        return null;
    }
}

//#endregion

//#region 26-特殊光环

export class SpecialAuraConverter implements IAuraConverter<
    IEnemyAttr,
    IHeroAttr
> {
    shouldConvert(special: ISpecial<any>): boolean {
        return special.code === 26;
    }

    convert(
        special: ISpecial<ISpecial26Value>,
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): SpecialAura {
        return new SpecialAura(handler.enemy, special, handler.locator);
    }
}

export class SpecialAuraModifier implements IEnemySpecialModifier<IEnemyAttr> {
    constructor(readonly special: ISpecial<ISpecial26Value>) {}

    add(handler: IReadonlyEnemyHandler<IEnemyAttr, any>): ISpecial<any>[] {
        const manager = handler.state.enemyManager;
        const list: ISpecial<any>[] = [];
        for (const [code, param] of this.special.value.specials) {
            if (handler.enemy.hasSpecial(code)) continue;
            const sp = manager.getSpecial(code)?.();
            if (!sp) continue;
            sp.setValue(param);
            list.push(sp);
        }
        return list;
    }

    delete(): ISpecial<any>[] {
        // 特殊光环不删除特殊属性
        return [];
    }

    modify(
        _handler: IEnemyHandler<IEnemyAttr, any>,
        special: ISpecial<any>
    ): boolean {
        const sp = this.special.value.specials.find(v => v[0] === special.code);
        if (!sp) return false;
        const param = sp[1];
        if (typeof param !== 'number') return false;
        if (this.special.value.mulAdd) {
            special.setValue(special.value * param);
        } else {
            special.setValue(special.value + param);
        }
        return true;
    }
}

export class SpecialAura implements IEnemyAuraView<
    IEnemyAttr,
    IRectRangeParam | IManhattanRangeParam | void,
    ISpecial26Value
> {
    readonly priority: number = 20;
    readonly couldApplyBase: boolean = true;
    readonly couldApplySpecial: boolean = false;
    readonly range: IRange<IRectRangeParam | IManhattanRangeParam | void>;

    constructor(
        readonly enemy: IReadonlyEnemy<IEnemyAttr>,
        readonly special: ISpecial<ISpecial26Value>,
        readonly locator: ITileLocator
    ) {
        this.range = this.createRange();
    }

    private createRange(): IRange<
        IRectRangeParam | IManhattanRangeParam | void
    > {
        const { range, square } = this.special.value;
        if (range <= 0) {
            return FULL_RANGE;
        }
        return square ? RECT_RANGE : MANHATTAN_RANGE;
    }

    getRangeParam(): IRectRangeParam | IManhattanRangeParam | void {
        const { range, square } = this.special.value;
        if (range <= 0) {
            return undefined;
        }
        if (square) {
            return {
                x: this.locator.x - range,
                y: this.locator.y - range,
                w: range * 2 + 1,
                h: range * 2 + 1
            };
        }
        return {
            cx: this.locator.x,
            cy: this.locator.y,
            radius: range
        };
    }

    apply(): void {
        // 特殊光环不修改基本属性
    }

    applySpecial(): IEnemySpecialModifier<IEnemyAttr> | null {
        return new SpecialAuraModifier(this.special);
    }
}

//#endregion
