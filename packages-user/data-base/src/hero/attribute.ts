import { logger } from '@motajs/common';
import { SaveCompression } from '../common';
import { IHeroAttribute, IHeroModifier } from './types';

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
    /** 当前每个修饰器对应的属性值 */
    private readonly modifierName: Map<IHeroModifier, keyof THero> = new Map();
    /** 当前勇士最终属性 */
    private readonly finalAttribute: THero;

    /**
     * @param attribute 当前勇士的基础属性
     */
    constructor(private readonly attribute: THero) {
        this.finalAttribute = structuredClone(attribute);
    }

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
                const modiferName = modifier.constructor.name;
                logger.warn(109, modiferName, String(name));
            }
            value = nextValue;
        }

        this.finalAttribute[name] = value;
    }

    getBaseAttribute<K extends keyof THero>(name: K): THero[K] {
        return this.attribute[name];
    }

    getFinalAttribute<K extends keyof THero>(name: K): THero[K] {
        return this.finalAttribute[name];
    }

    setBaseAttribute<K extends keyof THero>(name: K, value: THero[K]): void {
        this.attribute[name] = value;
        this.markDirty(name);
    }

    addBaseAttribute<K extends keyof SelectType<THero, number>>(
        name: K,
        value: number
    ): void {
        (this.attribute[name] as number) += value;
        this.markDirty(name);
    }

    addModifier<K extends keyof THero>(
        name: K,
        modifier: IHeroModifier<THero[K], unknown>
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

        this.markDirty(name);
    }

    markDirty(name: keyof THero): void {
        this.recalculateAttribute(name);
    }

    markModifierDirty(modifier: IHeroModifier): void {
        const name = this.modifierName.get(modifier);
        if (name === undefined) return;
        this.markDirty(name);
    }

    clone(cloneModifier: boolean = true): IHeroAttribute<THero> {
        const cloned = new HeroAttribute<THero>(
            structuredClone(this.attribute)
        );
        if (!cloneModifier) return cloned;
        // 拷贝修饰器
        for (const [modifier, name] of this.modifierName) {
            cloned.addModifier(
                name,
                modifier.clone() as IHeroModifier<THero[keyof THero]>
            );
        }
        return cloned;
    }

    getModifiableClone(): IHeroAttribute<THero> {
        return this.clone();
    }

    toStructured(): THero {
        return structuredClone(this.attribute);
    }

    *iterateModifiers(): IterableIterator<[keyof THero, IHeroModifier]> {
        for (const [modifier, name] of this.modifierName) {
            yield [name, modifier];
        }
    }
}
