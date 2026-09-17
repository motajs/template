import { isNil } from 'lodash-es';
import { IDataCommon, ReplayCode } from '@user/data-common';
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
        // 装备修饰器由 HeroEquipment.loadState 的重新装备恢复，故不进入属性存档，避免与属性读档的重建重复计入
        for (const [name, modifier] of state.getModifiers()) {
            // @ts-expect-error 泛型无法推导
            this.attribute.addModifier(name, modifier, false);
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

    /**
     * 判断一个装备是否已经装备至某个装备槽，如果已装备的装备槽与目标装备槽不符，那么根据 `autoUnload` 判断是否卸下
     * @param uid 装备实例 uid
     * @param slot 要装备至的装备槽
     * @param autoUnload 当要装备的装备已经处于某个装备槽，是否自动将其卸下
     * @returns 是否需要进行后续的装备操作
     */
    private checkEuipped(
        uid: number,
        slot: number | string,
        autoUnload: boolean
    ): boolean {
        // 检查有没有同 uid 装备
        for (const [index, curr] of this.equips) {
            if (curr !== uid) continue;
            if (index === slot || this.slots[index] === slot) {
                // 指定装备已经装备至了指定装备槽，直接忽略
                return false;
            } else {
                // 否则看 autoUnload
                if (autoUnload) {
                    this.unequip(index);
                    return true;
                } else {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 获取可以装备至的装备槽
     * @param slot 数字装备槽或字符串装备槽
     * @returns 可装备至的数字装备槽，-1 表示没有可用槽位
     */
    private getCouldEquipSlot(slot: number | string): number {
        if (typeof slot === 'number') return slot;
        let first = -1;
        let empty = -1;
        this.slots.forEach((name, index) => {
            if (name !== slot) return;
            if (first === -1) first = index;
            if (empty === -1 && !this.equips.has(index)) {
                empty = index;
            }
        });
        if (empty === -1) {
            return first;
        } else {
            return empty;
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

        const state = this.store.get(uid);
        if (!state) {
            logger.warn(146, uid.toString());
            return void 0;
        }

        // 由于期间会调用 `unload` 卸下装备，因此需要暂时禁用录像记录
        const replay = this.state.replaySystem;
        replay.disable();

        // 如果装备已装备，那么应该根据 `autoUnload` 决定是否卸下
        const next = this.checkEuipped(uid, slot, autoUnload);
        if (!next) {
            replay.revert();
            return void 0;
        }

        // 接下来获取可用装备槽
        const available = this.getCouldEquipSlot(slot);
        if (available === -1) {
            logger.warn(147, uid.toString());
            replay.revert();
            return void 0;
        }

        // 然后执行真正的装备效果
        const curr = this.equips.get(available);
        this.unequip(available);
        this.equips.set(available, uid);
        this.loadEquipEffect(state);

        // 最后恢复录像记录并记录录像
        replay.revert();
        replay.route.add(ReplayCode.Equip, [uid]);

        return curr;
    }

    unequip(slot: number): number | undefined {
        const uid = this.equips.get(slot);
        if (isNil(uid)) return void 0;

        const state = this.store.get(uid);
        if (!state) {
            logger.warn(146, uid.toString());
            return void 0;
        }

        // 记录录像
        const replay = this.state.replaySystem;
        replay.route.add(ReplayCode.Unequip, [slot]);

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
                // 索引取自原属性，为负时说明原属性已不含该修饰器对象，克隆上不得删除任何修饰器
                const index = this.attribute.getModifierIndex(modifier);
                if (index < 0) continue;
                // 克隆体按原属性同顺序重建修饰器数组，故取克隆自己的同槽位新对象作为删除目标
                const cloned = [...clone.getModifiers(name)][index];
                if (!cloned) continue;
                clone.deleteModifier(name, cloned);
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
            equipped: new Map(this.equips),
            slots: [...this.slots]
        };
    }

    loadState(state: IHeroEquipmentSave): void {
        this.slots.length = 0;
        state.slots.forEach(v => {
            this.slots.push(v);
        });
        // 由于装备修饰器不进存档，所以此时的勇士处于没有任何装备修饰器的状态，故可以安全清除
        this.equips.clear();
        // 读档期间经 equip 恢复槽位会产生真实录像指令，故暂时禁用录像记录
        const replay = this.state.replaySystem;
        replay.disable();
        try {
            for (const [index, uid] of state.equipped) {
                this.equip(uid, index);
            }
        } finally {
            // 必须保证所有路径都恢复录像记录，否则会永久吞掉后续录像
            replay.revert();
        }
    }
}
