import { isEqual } from 'lodash-es';
import { SaveCompression } from '@user/data-common';
import { ISpecial, SpecialCreation } from './types';

export interface ICommonSpecialConfig<T> {
    /** 获取特殊属性的名称 */
    name: string | ((special: ISpecial<T>) => string);
    /** 获取特殊属性的描述 */
    desc: string | ((special: ISpecial<T>) => string);
    /** 获取特殊属性的名称显示颜色 */
    color: string | ((special: ISpecial<T>) => string);
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

    /**
     * 获取配置数据的值，是字面量则直接返回，是函数则返回其调用结果
     * @param config 配置源数据
     */
    private getConfigValue(
        config: string | ((special: ISpecial<T>) => string)
    ) {
        if (typeof config === 'string') {
            return config;
        } else {
            return config(this);
        }
    }

    getSpecialName(): string {
        return this.getConfigValue(this.config.name);
    }

    getDescription(): string {
        return this.getConfigValue(this.config.desc);
    }

    getNameColor(): string {
        return this.getConfigValue(this.config.color);
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

    /**
     * 获取配置数据的值，是字面量则直接返回，是函数则返回其调用结果
     * @param config 配置源数据
     */
    private getConfigValue(
        config: string | ((special: ISpecial<void>) => string)
    ) {
        if (typeof config === 'string') {
            return config;
        } else {
            return config(this);
        }
    }

    getSpecialName(): string {
        return this.getConfigValue(this.config.name);
    }

    getDescription(): string {
        return this.getConfigValue(this.config.desc);
    }

    getNameColor(): string {
        return this.getConfigValue(this.config.color);
    }

    clone(): ISpecial<void> {
        return new NonePropertySpecial(this.code, this.config);
    }

    saveState(): void {
        return undefined;
    }

    loadState(): void {
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
