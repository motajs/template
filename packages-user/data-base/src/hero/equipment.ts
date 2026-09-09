import { isNil } from 'lodash-es';
import { IDataCommon } from '@user/data-common';
import {
    EquipStatus,
    IEquipmentState,
    IHeroAttribute,
    IHeroEquipment,
    IHeroEquipmentSave,
    IHeroEquipsStore
} from './types';
import { logger } from '@motajs/common';

export class HeroEquipment<THero> implements IHeroEquipment<THero> {
    /** 当前已装备的装备，键表示装备槽索引，值表示装备至这个装备槽的装备 uid */
    private readonly equips: Map<number, number> = new Map();

    slots: string[] = [];

    readonly state: IDataCommon;

    constructor(
        private readonly store: IHeroEquipsStore<THero>,
        private readonly attribute: IHeroAttribute<THero>
    ) {
        this.state = this.store.state;
    }

    setSlots(slots: string[]): void {
        this.slots = slots;
    }

    canEquipTo(uid: number, slot: number | string): EquipStatus {
        const state = this.store.get(uid);
        if (!state) return EquipStatus.CannotEquip;
        const raw = state.item;
        const slots = raw.equip.slots;

        // 如果装备压根不支持这个槽位
        if (!slots.includes(slot)) {
            return EquipStatus.CannotEquip;
        }

        if (typeof slot === 'number') {
            // 如果传入的 slot 是指定索引
            if (!this.equips.has(slot)) {
                return EquipStatus.CanEquip;
            } else {
                return EquipStatus.NeedReplace;
            }
        } else {
            // 如果传入的 slot 是槽位名称，那么要对每个槽位都判断
            let hasEmpty = false;
            let hasSlot = false;
            this.slots.forEach((name, index) => {
                if (slots.includes(name) && !this.equips.has(index)) {
                    hasEmpty = true;
                }
                if (name === slot) {
                    hasSlot = true;
                }
            });
            if (hasSlot) {
                if (hasEmpty) {
                    return EquipStatus.CanEquip;
                } else {
                    return EquipStatus.NeedReplace;
                }
            } else {
                return EquipStatus.CannotEquip;
            }
        }
    }

    //#region 装备行为

    /**
     * 向勇士属性施加装备的修饰器
     * @param state 装备状态实例
     */
    private loadEquipEffect(state: IEquipmentState<THero>) {
        for (const [name, modifier] of state.getModifiers()) {
            // @ts-expect-error 泛型无法推导
            this.attribute.addModifier(name, modifier, true);
        }
    }

    /**
     * 从勇士属性上删除装备的修饰器
     * @param state 装备状态实例
     */
    private unloadEquipEffect(state: IEquipmentState<THero>) {
        for (const [name, modifier] of state.getModifiers()) {
            // @ts-expect-error 泛型无法推导
            this.attribute.deleteModifier(name, modifier);
        }
    }

    equip(
        uid: number,
        slot: number | string,
        autoUnload: boolean = true
    ): number | undefined {
        if (this.canEquipTo(uid, slot) === EquipStatus.CannotEquip) {
            return void 0;
        }

        // 检查有没有同 uid 装备
        for (const [index, curr] of this.equips) {
            if (curr !== uid) continue;
            if (index === slot || this.slots[index] === slot) {
                // 指定装备已经装备至了指定装备槽，直接忽略
                return void 0;
            } else {
                // 否则看 autoUnload
                if (autoUnload) {
                    this.unequip(index);
                    break;
                } else {
                    return void 0;
                }
            }
        }

        const state = this.store.get(uid);
        if (!state) {
            logger.warn(146, uid.toString());
            return void 0;
        }

        if (typeof slot === 'number') {
            // 数字槽位，直接进行指定替换
            const curr = this.equips.get(slot);
            this.unequip(slot);
            this.equips.set(slot, uid);
            this.loadEquipEffect(state);
            return curr;
        } else {
            // 字符串槽位，需要判断是否包含空槽
            let first = -1;
            let empty = -1;
            this.slots.forEach((name, index) => {
                if (name !== slot) return;
                if (first === -1) first = index;
                if (empty !== -1 && !this.equips.has(index)) {
                    empty = index;
                }
            });
            if (empty === -1) {
                // 无空槽，替换第一个匹配的槽位
                if (first === -1) {
                    logger.warn(147, uid.toString());
                    return void 0;
                } else {
                    const curr = this.equips.get(first);
                    this.unequip(first);
                    this.equips.set(first, uid);
                    this.loadEquipEffect(state);
                    return curr;
                }
            } else {
                // 此时有空槽，直接装备上就行
                this.equips.set(empty, uid);
                this.loadEquipEffect(state);
                return void 0;
            }
        }
    }

    unequip(slot: number): number | undefined {
        const uid = this.equips.get(slot);
        if (isNil(uid)) return void 0;

        const state = this.store.get(uid);
        if (!state) {
            logger.warn(146, uid.toString());
            return void 0;
        }

        this.unloadEquipEffect(state);
        this.equips.delete(slot);

        return uid;
    }

    //#endregion

    //#region 装备获取

    equipped(uid: number): boolean {
        return [...this.equips.values()].includes(uid);
    }

    getEquipped(slot: number): number | undefined {
        return this.equips.get(slot);
    }

    getEquips(): (IEquipmentState<THero> | null)[] {
        const result: (IEquipmentState<THero> | null)[] = [];
        for (let i = 0; i < this.slots.length; i++) {
            const uid = this.equips.get(i);
            if (isNil(uid)) {
                result.push(null);
            } else {
                const state = this.store.get(uid);
                if (!state) {
                    logger.warn(146, uid.toString());
                    result.push(null);
                } else {
                    result.push(state);
                }
            }
        }
        return result;
    }

    //#endregion

    //#region 装备对比

    compareEquip(
        equipA: number,
        equipB: number,
        slot: number
    ): Readonly<Partial<THero>> {
        const stateA = this.store.get(equipA);
        const stateB = this.store.get(equipB);
        if (!stateA) {
            logger.warn(146, equipA.toString());
            return {} as Partial<THero>;
        }
        if (!stateB) {
            logger.warn(146, equipB.toString());
            return {} as Partial<THero>;
        }

        const clone = this.attribute.clone();

        // 获取比对槽位的装备对应的所有修饰器，这些修饰器需要在克隆对象中删除
        const equipped = this.getEquipped(slot);
        if (!isNil(equipped)) {
            const state = this.store.get(equipped);
            if (!state) {
                logger.warn(146, equipped.toString());
                return {} as Partial<THero>;
            }
            for (const [name, modifier] of state.getModifiers()) {
                const index = this.attribute.getModifierIndex(modifier);
                clone.deleteModifierByIndex(name, index);
            }
        }

        // 分别将两个装备的修饰器克隆并加入到克隆属性上对比
        const attrA: Partial<THero> = {};
        const attrB: Partial<THero> = {};
        const keys = new Set<SelectKey<THero, number>>();

        for (const [name, modifier] of stateA.getModifiers()) {
            // @ts-expect-error 泛型无法推导
            clone.addModifier(name, modifier);
        }
        for (const [name] of stateA.getModifiers()) {
            attrA[name] = clone.getFinalAttribute(name);
            keys.add(name);
        }
        for (const [name, modifier] of stateA.getModifiers()) {
            // @ts-expect-error 泛型无法推导
            clone.deleteModifier(name, modifier);
        }

        for (const [name, modifier] of stateB.getModifiers()) {
            // @ts-expect-error 泛型无法推导
            clone.addModifier(name, modifier);
        }
        for (const [name] of stateB.getModifiers()) {
            attrB[name] = clone.getFinalAttribute(name);
            keys.add(name);
        }

        // 第二次没必要再删除了，因为这个 clone 对象不会再被使用到

        // 然后收集键名并对比
        const diff: Partial<THero> = {};
        for (const key of keys) {
            const final = this.attribute.getFinalAttribute(key);
            const valueA = (attrA[key] as number) ?? final;
            const valueB = (attrB[key] as number) ?? final;
            diff[key] = (valueA - valueB) as THero[SelectKey<THero, number>];
        }

        return diff;
    }

    //#endregion

    saveState(): IHeroEquipmentSave {
        return {
            equipped: this.equips,
            slots: this.slots
        };
    }

    loadState(state: IHeroEquipmentSave): void {
        this.slots.length = 0;
        state.slots.forEach(v => {
            this.slots.push(v);
        });
        // 由于装备修饰器不进存档，所以此时的勇士处于没有任何装备修饰器的状态，故可以安全清除
        this.equips.clear();
        for (const [index, uid] of state.equipped) {
            this.equip(uid, index);
        }
    }
}
