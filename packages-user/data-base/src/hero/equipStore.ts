import {
    IItemRawData,
    SaveCompression,
    IDataCommon,
    shouldReplay
} from '@user/data-common';
import { isNil, maxBy } from 'lodash-es';
import { ValueModifier, PercentageModifier } from './modifier';
import {
    IEquipmentState,
    IHeroModifier,
    IEquipmentStateSave,
    IHeroEquipsStore,
    IEquipmentSorter,
    IEquipmentSortHandler,
    IHeroEquipsStoreSave,
    IEquipmentStateHooks
} from './types';
import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';

type Modifiers<THero> = Map<SelectKey<THero, number>, IHeroModifier<number>>;

export class EquipmentState<THero>
    extends Hookable<IEquipmentStateHooks<THero>>
    implements IEquipmentState<THero>
{
    readonly item: IItemRawData<THero>;

    /** 数值修饰器列表 */
    readonly valueModifiers: Modifiers<THero> = new Map();
    /** 百分比修饰器列表 */
    readonly perModifiers: Modifiers<THero> = new Map();

    /** 装备的数值属性 */
    private readonly value: Map<SelectKey<THero, number>, number> = new Map();
    /** 装备的百分比属性 */
    private readonly per: Map<SelectKey<THero, number>, number> = new Map();

    /** 是否已经构建过修饰器 */
    private built: boolean = false;

    constructor(
        readonly uid: number,
        item: IItemRawData<THero>
    ) {
        super();
        this.item = item;

        const equip = item.equip;
        for (const [key, value] of Object.entries(equip.value)) {
            this.value.set(key as SelectKey<THero, number>, value as number);
        }
        for (const [key, value] of Object.entries(equip.percentage)) {
            this.per.set(key as SelectKey<THero, number>, value as number);
        }
    }

    protected createController(
        hook: Partial<IEquipmentStateHooks<THero>>
    ): IHookController<IEquipmentStateHooks<THero>> {
        return new HookController(this, hook);
    }

    /**
     * 触发修饰器变动钩子
     */
    private notifyModifierChange() {
        this.forEachHook(hook => hook.onChangeModifier?.(this.getModifiers()));
    }

    @shouldReplay('Setting equipment value should be replayed.')
    setValue(name: keyof SelectType<THero, number>, value: number): void {
        if (value === 0) {
            this.value.delete(name);
            this.valueModifiers.delete(name);
        } else {
            this.value.set(name, value);
            const modifier = this.valueModifiers.getOrInsertComputed(
                name,
                () => new ValueModifier(value, 0)
            );
            modifier.setValue(value);
        }
        this.notifyModifierChange();
    }

    @shouldReplay('Setting equipment percentage value should be replayed.')
    setPercentage(name: keyof SelectType<THero, number>, value: number): void {
        if (value === 0) {
            this.per.delete(name);
            this.perModifiers.delete(name);
        } else {
            this.per.set(name, value);
            const modifier = this.perModifiers.getOrInsertComputed(
                name,
                () => new PercentageModifier(value, 10)
            );
            modifier.setValue(value);
        }
        this.notifyModifierChange();
    }

    getValue(name: keyof SelectType<THero, number>): number {
        return this.value.get(name) ?? 0;
    }

    getPercentage(name: keyof SelectType<THero, number>): number {
        return this.per.get(name) ?? 0;
    }

    buildModifiers() {
        if (this.built) return;
        this.built = true;

        this.valueModifiers.clear();
        this.perModifiers.clear();

        for (const [name, baseVal] of this.value) {
            this.valueModifiers.set(name, new ValueModifier(baseVal, 0));
        }
        for (const [name, basePct] of this.per) {
            this.perModifiers.set(name, new PercentageModifier(basePct, 10));
        }

        this.notifyModifierChange();
    }

    *getModifiers(): Iterable<
        [SelectKey<THero, number>, IHeroModifier<number>]
    > {
        if (!this.built) {
            this.buildModifiers();
        }
        yield* this.valueModifiers;
        yield* this.perModifiers;
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
            percentage: new Map(this.per)
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
            const base = value[name];
            if (base !== equipValue) {
                valueDiff.set(name, equipValue);
            }
        }
        const perDiff = new Map<SelectKey<THero, number>, number>();
        for (const [name, equipPer] of this.per) {
            const base = percentage[name];
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
        this.per.clear();
        for (const [name, value] of state.value) {
            this.value.set(name, value);
        }
        for (const [name, value] of state.percentage) {
            this.per.set(name, value);
        }
        this.buildModifiers();
    }

    /**
     * Low / High 压缩级别读档：从存档查询值，缺失则回退到原始定义
     * @param state 装备状态存档
     */
    private loadDiff(state: IEquipmentStateSave<THero>): void {
        this.value.clear();
        this.per.clear();

        // 基准为装备原始定义，再叠加存档中的差异条目
        for (const [name, value] of Object.entries<number>(
            this.item.equip.value
        )) {
            this.value.set(name as SelectKey<THero, number>, value);
        }
        for (const [name, value] of Object.entries<number>(
            this.item.equip.percentage
        )) {
            this.per.set(name as SelectKey<THero, number>, value);
        }

        // 差异内容
        for (const [name, value] of state.value) {
            this.value.set(name, value);
        }
        for (const [name, value] of state.percentage) {
            this.per.set(name, value);
        }

        this.buildModifiers();
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

    @shouldReplay('Adding equipment to equip store should be replayed.')
    add(item: number | string): number {
        const num = this.state.tileStore.num(item);
        if (isNil(num)) return -1;

        const raw = this.state.itemStore.getData(num!);
        if (!raw) return -1;

        const uid = this.nextUid++;
        const state = new EquipmentState<THero>(uid, raw);
        this.instanceMap.set(uid, state);
        state.buildModifiers();
        return uid;
    }

    @shouldReplay('Deleting equipment from equip store should be replayed.')
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
            const ins = new EquipmentState<THero>(save.uid, raw);
            ins.loadState(save, compression);
            this.instanceMap.set(save.uid, ins);
        }
        if (state.equipments.length === 0) {
            this.nextUid = 0;
        } else {
            const maxUid = maxBy(state.equipments, 'uid');
            if (!maxUid) {
                logger.error(58);
                this.nextUid = 0;
            } else {
                this.nextUid = maxUid.uid + 1;
            }
        }
    }
}
