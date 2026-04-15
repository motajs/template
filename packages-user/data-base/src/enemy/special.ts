import { ISpecial, SpecialCreation } from './types';

export interface ICommonSerializableSpecialConfig<T> {
    /** 获取特殊属性的名称 */
    getSpecialName: (special: ISpecial<T>) => string;
    /** 获取特殊属性的描述 */
    getDescription: (special: ISpecial<T>) => string;
    /** 从旧样板怪物对象获取此特殊属性对应的属性值 */
    fromLegacyEnemy: (enemy: Enemy) => T;
}

export class CommonSerializableSpecial<T> implements ISpecial<T> {
    constructor(
        readonly code: number,
        public value: T,
        readonly config: ICommonSerializableSpecialConfig<T>
    ) {}

    setValue(value: T): void {
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }

    getSpecialName(): string {
        return this.config.getSpecialName(this);
    }

    getDescription(): string {
        return this.config.getDescription(this);
    }

    fromLegacyEnemy(enemy: Enemy): void {
        this.value = this.config.fromLegacyEnemy(enemy);
    }

    clone(): ISpecial<T> {
        return new CommonSerializableSpecial(
            this.code,
            structuredClone(this.value),
            this.config
        );
    }
}

export class NonePropertySpecial implements ISpecial<void> {
    value: void = undefined;

    constructor(
        readonly code: number,
        readonly config: ICommonSerializableSpecialConfig<void>
    ) {}

    setValue(_value: void): void {
        // unneeded
    }

    getValue(): void {
        return void 0;
    }

    getSpecialName(): string {
        return this.config.getSpecialName(this);
    }

    getDescription(): string {
        return this.config.getDescription(this);
    }

    fromLegacyEnemy(_enemy: Enemy): void {
        // unneeded
    }

    clone(): ISpecial<void> {
        return new NonePropertySpecial(this.code, this.config);
    }
}

export function defineCommonSerializableSpecial<T, TAttr = any>(
    code: number,
    value: T,
    config: ICommonSerializableSpecialConfig<T>
): SpecialCreation<T, TAttr> {
    return () =>
        new CommonSerializableSpecial(code, structuredClone(value), config);
}

export function defineNonePropertySpecial<TAttr = any>(
    code: number,
    config: ICommonSerializableSpecialConfig<void>
): SpecialCreation<void, TAttr> {
    return () => new NonePropertySpecial(code, config);
}
