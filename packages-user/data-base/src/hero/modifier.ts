import { BaseHeroModifier } from './attribute';
import { IHeroModifier } from './types';

export class ValueModifier extends BaseHeroModifier<number, number> {
    readonly type = '@system/value';

    constructor(
        value: number,
        readonly priority: number = 0
    ) {
        super(value);
    }

    modify(value: number): number {
        return value + this.value;
    }

    clone(): IHeroModifier<number, number> {
        return new ValueModifier(this.value, this.priority);
    }
}

export class PercentageModifier extends BaseHeroModifier<number, number> {
    readonly type = '@system/percentage';

    constructor(
        value: number,
        readonly priority: number = 10
    ) {
        super(value);
    }

    modify(value: number, baseValue: number): number {
        return value + baseValue * this.value;
    }

    clone(): IHeroModifier<number, number> {
        return new PercentageModifier(this.value, this.priority);
    }
}
