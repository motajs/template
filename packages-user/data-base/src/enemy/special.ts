import { isEqual } from 'lodash-es';
import { SaveCompression } from '../common/types';
import { ISpecial, SpecialCreation } from './types';

// TODO: 颜色参数

export interface ICommonSpecialConfig<T> {
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
        readonly config: ICommonSpecialConfig<T>
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

    saveState(_compression: SaveCompression): T {
        return structuredClone(this.value);
    }

    loadState(state: T, _compression: SaveCompression): void {
        this.setValue(state);
    }

    deepEqualsTo(other: ISpecial<T>): boolean {
        if (this.code !== other.code) return false;
        return isEqual(this.value, other.getValue());
    }
}

export class NonePropertySpecial implements ISpecial<void> {
    value: void = undefined;

    constructor(
        readonly code: number,
        readonly config: ICommonSpecialConfig<void>
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

    saveState(_compression: SaveCompression): void {
        return undefined;
    }

    loadState(_state: void, _compression: SaveCompression): void {
        // 无属性，无需操作
    }

    deepEqualsTo(other: ISpecial<void>): boolean {
        return this.code === other.code;
    }
}

export function defineCommonSerializableSpecial<T, TAttr = any>(
    code: number,
    value: T,
    config: ICommonSpecialConfig<T>
): SpecialCreation<T, TAttr> {
    return () =>
        new CommonSerializableSpecial(code, structuredClone(value), config);
}

export function defineNonePropertySpecial<TAttr = any>(
    code: number,
    config: ICommonSpecialConfig<void>
): SpecialCreation<void, TAttr> {
    return () => new NonePropertySpecial(code, config);
}
