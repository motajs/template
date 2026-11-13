import { SaveCompression } from '@user/data-common';
import { IHeroModifier, IHeroModifierOwner } from './types';

export abstract class BaseHeroModifier<T, V> implements IHeroModifier<T, V, V> {
    abstract readonly type: string;
    abstract readonly priority: number;

    owner: IHeroModifierOwner | null = null;

    constructor(private currentValue: V) {}

    get value(): V {
        return this.currentValue;
    }

    setValue(value: V): void {
        this.currentValue = value;
        this.owner?.markModifierDirty(this);
    }

    getValue(): V {
        return this.currentValue;
    }

    bindAttribute(attribute: IHeroModifierOwner | null): void {
        this.owner = attribute;
    }

    saveState(_compression: SaveCompression): V {
        return this.currentValue;
    }

    loadState(state: V, _compression: SaveCompression): void {
        this.setValue(state);
    }

    abstract modify(value: T, baseValue: T, name: string): T;

    abstract clone(): IHeroModifier<T, V>;
}

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
