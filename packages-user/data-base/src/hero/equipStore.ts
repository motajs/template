import { IItemRawData, SaveCompression, IDataCommon } from '@user/data-common';
import { isNil, maxBy } from 'lodash-es';
import { ValueModifier, PercentageModifier } from './modifier';
import {
    IEquipmentState,
    IHeroModifier,
    IEquipmentStateSave,
    IHeroEquipsStore,
    IEquipmentSorter,
    IEquipmentSortHandler,
    IHeroEquipsStoreSave
} from './types';
import { logger } from '@motajs/common';

export class EquipmentState<THero> implements IEquipmentState<THero> {
    readonly item: IItemRawData<THero>;

    /** 装备产生的所有修饰器，每个元素为 [属性名, 修饰器] */
    readonly modifiers: [SelectKey<THero, number>, IHeroModifier<number>][];

    /** 装备的数值属性 */
    private readonly value: Map<SelectKey<THero, number>, number>;
    /** 装备的百分比属性 */
    private readonly percentage: Map<SelectKey<THero, number>, number>;

    constructor(
        readonly uid: number,
        item: IItemRawData<THero>,
        buildModifier: boolean = true
    ) {
        this.item = item;
        this.modifiers = [];

        const equip = item.equip;
        this.value = new Map(equip.value);
        this.percentage = new Map(equip.percentage);

        if (buildModifier) {
            this.rebuildModifiers();
        }
    }

    /**
     * 从装备属性重新生成装备修饰器
     */
    private rebuildModifiers() {
        this.modifiers.length = 0;

        for (const [name, baseVal] of this.value) {
            this.modifiers.push([name, new ValueModifier(baseVal)]);
        }
        for (const [name, basePct] of this.percentage) {
            this.modifiers.push([name, new PercentageModifier(basePct)]);
        }
    }

    getModifiers(): Iterable<
        [keyof SelectType<THero, number>, IHeroModifier<number>]
    > {
        return this.modifiers;
    }

    /**
     * NoCompression 级别保存：完整存储所有修饰器值
     * @returns 完整的装备状态存档
     */
    private saveNoCompression(): IEquipmentStateSave<THero> {
        return {
            uid: this.uid,
            num: this.item.num,
            value: new Map(this.value),
            percentage: new Map(this.percentage)
        };
    }

    /**
     * Low / High 压缩级别保存：仅存储与原始定义存在差异的条目
     * @returns 差异化的装备状态存档
     */
    private saveDiff(): IEquipmentStateSave<THero> {
        const { value, percentage } = this.item.equip;
        const valueDiff = new Map<SelectKey<THero, number>, number>();
        for (const [name, equipValue] of this.value) {
            const base = value.get(name);
            if (base !== equipValue) {
                valueDiff.set(name, equipValue);
            }
        }
        const perDiff = new Map<SelectKey<THero, number>, number>();
        for (const [name, equipPer] of this.percentage) {
            const base = percentage.get(name);
            if (base !== equipPer) {
                perDiff.set(name, equipPer);
            }
        }
        return {
            uid: this.uid,
            num: this.item.num,
            value: valueDiff,
            percentage: perDiff
        };
    }

    saveState(compression: SaveCompression): IEquipmentStateSave<THero> {
        if (compression === SaveCompression.NoCompression) {
            return this.saveNoCompression();
        } else {
            return this.saveDiff();
        }
    }

    /**
     * NoCompression 级别读档：使用完整存档值覆盖所有修饰器
     * @param state 装备状态存档
     */
    private loadNoCompression(state: IEquipmentStateSave<THero>): void {
        this.value.clear();
        this.percentage.clear();
        for (const [name, value] of state.percentage) {
            this.value.set(name, value);
        }
        for (const [name, value] of state.percentage) {
            this.percentage.set(name, value);
        }
        this.rebuildModifiers();
    }

    /**
     * Low / High 压缩级别读档：从存档查询值，缺失则回退到原始定义
     * @param state 装备状态存档
     */
    private loadDiff(state: IEquipmentStateSave<THero>): void {
        this.value.clear();
        this.percentage.clear();
        for (const [name, value] of state.percentage) {
            this.value.set(name, value);
        }
        for (const [name, value] of state.percentage) {
            this.percentage.set(name, value);
        }

        // 差异内容
        for (const [name, value] of state.value) {
            this.value.set(name, value);
        }
        for (const [name, value] of state.percentage) {
            this.percentage.set(name, value);
        }

        this.rebuildModifiers();
    }

    loadState(
        state: IEquipmentStateSave<THero>,
        compression: SaveCompression
    ): void {
        if (compression === SaveCompression.NoCompression) {
            this.loadNoCompression(state);
        } else {
            this.loadDiff(state);
        }
    }
}

export class HeroEquipsStore<THero> implements IHeroEquipsStore<THero> {
    /** 装备实例存储表 */
    private readonly instanceMap: Map<number, EquipmentState<THero>> =
        new Map();

    /** 自增 uid 计数器 */
    private nextUid: number = 0;

    /** 排序器 */
    private sorter: IEquipmentSorter<THero> | null = null;

    readonly state: IDataCommon;

    constructor(state: IDataCommon) {
        this.state = state;
    }

    add(item: number | string): number {
        const num = this.state.tileStore.num(item);
        if (isNil(num)) return -1;

        const raw = this.state.itemStore.getData(num!);
        if (!raw) return -1;

        const uid = this.nextUid++;
        const state = new EquipmentState<THero>(uid, raw);
        this.instanceMap.set(uid, state);
        return uid;
    }

    delete(uid: number): void {
        this.instanceMap.delete(uid);
    }

    get(uid: number): IEquipmentState<THero> | null {
        return this.instanceMap.get(uid) ?? null;
    }

    count(item: number | string): number {
        const num = this.state.tileStore.num(item);
        if (isNil(num)) return 0;

        let count = 0;
        for (const state of this.instanceMap.values()) {
            if (state.item.num === num) count++;
        }
        return count;
    }

    useSorter(comparer: IEquipmentSorter<THero> | null): void {
        this.sorter = comparer;
    }

    /**
     * 按当前排序器对所有装备实例排序，无排序器时按 uid 升序
     * @param list 装备实例数组
     * @returns 排序后的数组
     */
    private sortList(list: EquipmentState<THero>[]): EquipmentState<THero>[] {
        const sorter = this.sorter;
        if (sorter) {
            return list.sort((a, b) => {
                const handler: IEquipmentSortHandler<THero> = {
                    equipA: a,
                    equipB: b,
                    store: this,
                    state: this.state
                };
                const cmp = sorter.compare(handler);
                if (cmp === 0) {
                    return a.uid - b.uid;
                } else {
                    return cmp;
                }
            });
        } else {
            return list.sort((a, b) => a.uid - b.uid);
        }
    }

    instancesOf(equip: number | string): IEquipmentState<THero>[] {
        const num = this.state.tileStore.num(equip);
        if (isNil(num)) return [];
        return this.sortList(
            [...this.instanceMap.values()].filter(v => v.item.num === num)
        );
    }

    instances(): IEquipmentState<THero>[] {
        return this.sortList([...this.instanceMap.values()]);
    }

    saveState(compression: SaveCompression): IHeroEquipsStoreSave<THero> {
        const equipments: IEquipmentStateSave<THero>[] = [];
        for (const state of this.instanceMap.values()) {
            equipments.push(state.saveState(compression));
        }
        return { equipments };
    }

    loadState(
        state: IHeroEquipsStoreSave<THero>,
        compression: SaveCompression
    ): void {
        this.instanceMap.clear();
        for (const save of state.equipments) {
            const raw = this.state.itemStore.getData(save.num);
            if (!raw) {
                logger.error(59, save.num.toString());
                continue;
            }
            const instance = new EquipmentState<THero>(save.uid, raw, false);
            instance.loadState(save, compression);
            this.instanceMap.set(save.uid, instance);
        }
        const maxUid = maxBy(state.equipments, 'uid');
        if (!maxUid) {
            logger.error(58);
            return;
        }
        this.nextUid = maxUid.uid + 1;
    }
}
