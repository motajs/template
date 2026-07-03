import {
    IHeroAttr,
    IItemEffect,
    IItemEquipData,
    IItemLegacyConverter,
    IItemRawData,
    ItemCategory
} from '@user/data-common';
import { IStateSystem } from '@user/data-system';

export type LegacyItemData = Item<AllIdsOf<'items'>>;

type LegacyItemEffectFn = (
    state: IStateSystem,
    item: IItemRawData<IHeroAttr>
) => void;
type LegacyItemCanUseFn = (
    state: IStateSystem,
    item: IItemRawData<IHeroAttr>
) => boolean;

class LegacyItemEffect implements IItemEffect<IHeroAttr> {
    pickEvent: unknown;
    useEvent: unknown;

    /** 道具使用效果 */
    private readonly useFn: LegacyItemEffectFn | null = null;
    /** 是否能够使用道具 */
    private readonly canUseFn: LegacyItemCanUseFn | null = null;
    /** 全局状态对象 */
    private readonly state: IStateSystem;

    constructor(legacy: LegacyItemData, state: IStateSystem) {
        this.state = state;
        this.pickEvent = undefined;
        this.useEvent = legacy.useItemEvent;

        if (legacy.cls === 'items') {
            if (legacy.itemEffect) {
                this.useFn = new Function(
                    'state',
                    'item',
                    legacy.itemEffect
                ) as LegacyItemEffectFn;
            }
        } else if (legacy.cls === 'constants' || legacy.cls === 'tools') {
            if (legacy.useItemEffect) {
                this.useFn = new Function(
                    'state',
                    'item',
                    legacy.useItemEffect
                ) as LegacyItemEffectFn;
            }
            if (typeof legacy.canUseItemEffect === 'string') {
                this.canUseFn = new Function(
                    'state',
                    'item',
                    legacy.canUseItemEffect
                ) as LegacyItemCanUseFn;
            } else {
                this.canUseFn = () => !!legacy.canUseItemEffect;
            }
        }
    }

    useEffect(item: IItemRawData<IHeroAttr>): void {
        this.useFn?.(this.state, item);
    }

    canUse(item: IItemRawData<IHeroAttr>): boolean {
        if (!this.canUseFn) return true;
        else return this.canUseFn(this.state, item);
    }
}

export class ItemLegacyBridge implements IItemLegacyConverter<
    IHeroAttr,
    LegacyItemData
> {
    constructor(private readonly state: IStateSystem) {}

    fromLegacy(num: number, legacy: LegacyItemData): IItemRawData<IHeroAttr> {
        const effect = new LegacyItemEffect(legacy, this.state);
        return {
            num,
            id: legacy.id,
            category: this.mapCategory(legacy.cls),
            name: legacy.name,
            text: legacy.text ?? '',
            hideInToolbox: legacy.hideInToolBox,
            effect,
            equip: this.convertEquip(legacy.equip)
        };
    }

    /**
     * 将旧样板装备信息转换为新样板接口
     * @param legacy 旧样板格式的装备信息
     */
    private convertEquip(legacy: Equip): IItemEquipData<IHeroAttr> {
        const valueMap = new Map<SelectKey<IHeroAttr, number>, number>();
        const perMap = new Map<SelectKey<IHeroAttr, number>, number>();

        for (const [key, value] of Object.entries(legacy.value)) {
            valueMap.set(key as SelectKey<IHeroAttr, number>, value);
        }
        for (const [key, value] of Object.entries(legacy.percentage)) {
            perMap.set(key as SelectKey<IHeroAttr, number>, value);
        }

        return {
            slots: [legacy.type],
            animate: legacy.animate,
            value: valueMap,
            percentage: perMap,
            loadEvent: legacy.equipEvent,
            unloadEvent: legacy.unequipEvent
        };
    }

    /**
     * 从旧样板道具类型获取新接口对应的类型
     * @param cls 旧样板道具类型
     */
    private mapCategory(cls: ItemCls): ItemCategory {
        switch (cls) {
            case 'constants':
                return ItemCategory.Constant;
            case 'tools':
                return ItemCategory.Consumable;
            case 'equips':
                return ItemCategory.Equipment;
            case 'items':
                return ItemCategory.Pick;
            default:
                return ItemCategory.Unknown;
        }
    }
}
