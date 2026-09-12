import { logger } from '@motajs/common';
import { SaveCompression } from '@user/data-common';
import {
    IHeroAttribute,
    IHeroAttributeCloneOption,
    IHeroModifier
} from './types';
import { isNil } from 'lodash-es';

export abstract class BaseHeroModifier<T, V> implements IHeroModifier<T, V, V> {
    abstract readonly type: string;
    abstract readonly priority: number;

    owner: IHeroAttribute<unknown> | null = null;

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

    bindAttribute(attribute: IHeroAttribute<unknown> | null): void {
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

export class HeroAttribute<THero> implements IHeroAttribute<THero> {
    /** 当前勇士属性修饰器 */
    private readonly modifier: Map<keyof THero, IHeroModifier[]> = new Map();
    /** 当前每个修饰器对应的属性名称 */
    private readonly modifierName: Map<IHeroModifier, keyof THero> = new Map();
    /** 当前标记为不存档的修饰器集合 */
    private readonly modifierNosave: Set<IHeroModifier> = new Set();
    /** 当前勇士最终属性 */
    private readonly finalAttribute: THero;

    /**
     * @param attribute 当前勇士的基础属性
     */
    constructor(private readonly attribute: THero) {
        this.finalAttribute = structuredClone(attribute);
    }

    //#region 属性计算

    /**
     * 判定修饰器结果是否同引用
     * @param curr 当前属性值
     * @param next 修饰器修饰结果
     */
    private isSameReference(curr: unknown, next: unknown) {
        return typeof curr === 'object' && curr !== null && curr === next;
    }

    /**
     * 重新计算指定属性值
     * @param name 属性名称
     */
    private recalculateAttribute<K extends keyof THero>(name: K): void {
        const modifierList = this.modifier.get(name);
        if (!modifierList) return;

        const baseValue = this.attribute[name];
        let value = baseValue;
        for (const modifier of modifierList as IHeroModifier<THero[K]>[]) {
            const nextValue = modifier.modify(value, baseValue, name);
            // 部署之后就没必要弹这个警告了，额外判断反而可能会有一定的性能损失，直接 tree-shaking 优化掉
            if (import.meta.env.DEV && this.isSameReference(value, nextValue)) {
                // 对于对象属性，如果返回值和原始值的引用相同，那么应该抛出警告
                const modiferName = modifier.constructor.name;
                logger.warn(109, modiferName, String(name));
            }
            value = nextValue;
        }

        this.finalAttribute[name] = value;
    }

    *catchCalculateProgress<K extends keyof THero>(name: K) {
        const modifierList = this.modifier.get(name);
        if (!modifierList) return;

        const baseValue = this.attribute[name];
        let value = baseValue;
        for (const modifier of modifierList as IHeroModifier<THero[K]>[]) {
            const nextValue = modifier.modify(value, baseValue, name);
            // 部署之后就没必要弹这个警告了，额外判断反而可能会有一定的性能损失，直接 tree-shaking 优化掉
            if (import.meta.env.DEV && this.isSameReference(value, nextValue)) {
                // 对于对象属性，如果返回值和原始值的引用相同，那么应该抛出警告
                const modiferName = modifier.constructor.name;
                logger.warn(109, modiferName, String(name));
            }
            value = nextValue;
            yield [modifier, value] as [IHeroModifier<THero[K]>, THero[K]];
        }
    }

    getBaseAttribute<K extends keyof THero>(name: K): THero[K] {
        return this.attribute[name];
    }

    getFinalAttribute<K extends keyof THero>(name: K): THero[K] {
        return this.finalAttribute[name];
    }

    //#endregion

    //#region 属性操作

    set<K extends keyof THero>(name: K, value: THero[K]): void {
        this.attribute[name] = value;
        this.markDirty(name);
    }

    add(name: SelectKey<THero, number>, value: number): void {
        (this.attribute[name] as number) += value;
        this.markDirty(name);
    }

    mul(name: SelectKey<THero, number>, value: number): void {
        (this.attribute[name] as number) *= value;
        this.markDirty(name);
    }

    div(name: SelectKey<THero, number>, value: number): void {
        (this.attribute[name] as number) /= value;
        this.markDirty(name);
    }

    //#endregion

    //#region 修饰器处理

    *iterateModifiers(): IterableIterator<[PropertyKey, IHeroModifier]> {
        for (const [modifier, name] of this.modifierName) {
            yield [name, modifier];
        }
    }

    getModifiers<K extends keyof THero>(
        name: K
    ): Iterable<IHeroModifier<THero[K]>> {
        const arr = this.modifier.get(name) as IHeroModifier<THero[K]>[];
        return arr ?? [];
    }

    getModifierIndex(modifier: IHeroModifier): number {
        const name = this.modifierName.get(modifier);
        if (isNil(name)) return -1;
        const arr = this.modifier.get(name);
        if (!arr) return -1;
        return arr.indexOf(modifier);
    }

    addModifier<K extends keyof THero>(
        name: K,
        modifier: IHeroModifier<THero[K]>,
        save: boolean = true
    ): void {
        if (modifier.owner) {
            const modiferName = modifier.constructor.name;
            logger.warn(108, modiferName, String(name));
            return;
        }

        const modifierList = this.modifier.getOrInsert(name, []);
        modifierList.push(modifier);
        modifierList.sort((left, right) => right.priority - left.priority);

        this.modifierName.set(modifier, name);
        if (!save) {
            this.modifierNosave.add(modifier);
        }
        modifier.bindAttribute(this);
        this.markDirty(name);
    }

    deleteModifier<K extends keyof THero>(
        name: K,
        modifier: IHeroModifier<THero[K], unknown>
    ): void {
        const modifierList = this.modifier.get(name);
        if (!modifierList) return;
        const index = modifierList.indexOf(modifier);
        if (index === -1) return;

        modifier.bindAttribute(null);
        modifierList.splice(index, 1);
        this.modifierName.delete(modifier);
        this.modifierNosave.delete(modifier);

        this.markDirty(name);
    }

    deleteModifierByIndex<K extends keyof THero>(
        name: K,
        index: number
    ): IHeroModifier<THero[K]> | null {
        const arr = this.modifier.get(name);
        if (!arr) return null;
        const modifier = arr.splice(index, 1);
        if (modifier.length === 0) return null;
        else return modifier[0] as IHeroModifier<THero[K]>;
    }

    markDirty(name: keyof THero): void {
        this.recalculateAttribute(name);
    }

    markModifierDirty(modifier: IHeroModifier<THero[keyof THero]>): void {
        const name = this.modifierName.get(modifier);
        if (name === undefined) return;
        this.markDirty(name);
    }

    setModifierSaveEnabled(modifier: IHeroModifier, save: boolean): void {
        if (save) {
            this.modifierNosave.delete(modifier);
        } else {
            this.modifierNosave.add(modifier);
        }
    }

    getModifierSaveEnabled(modifier: IHeroModifier): boolean {
        return !this.modifierNosave.has(modifier);
    }

    //#endregion

    //#region 属性克隆

    clone(
        option: Readonly<Partial<IHeroAttributeCloneOption>> = {}
    ): IHeroAttribute<THero> {
        const { cloneModifier = true } = option;
        const cloned = new HeroAttribute<THero>(
            structuredClone(this.attribute)
        );
        if (!cloneModifier) return cloned;
        for (const [name, modifiers] of this.modifier) {
            const arr: IHeroModifier[] = modifiers.map(v => v.clone());
            cloned.modifier.set(name, arr);
            cloned.recalculateAttribute(name);
        }
        return cloned;
    }

    getModifiableClone(): IHeroAttribute<THero> {
        return this.clone();
    }

    toStructured(): THero {
        return structuredClone(this.attribute);
    }

    //#endregion
}
