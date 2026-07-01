import {
    IItemEffect,
    IItemLegacyConverter,
    IItemRawData,
    ItemCategory
} from '@user/data-common';
import { IStateSystem } from '@user/data-system';

export type LegacyItemData = Item<AllIdsOf<'items'>>;

type LegacyItemEffectFn = (state: IStateSystem, item: IItemRawData) => void;
type LegacyItemCanUseFn = (state: IStateSystem, item: IItemRawData) => boolean;

class LegacyItemEffect implements IItemEffect {
    pickEvent: unknown;
    useEvent: unknown;

    private readonly pickFn: LegacyItemEffectFn | null = null;
    private readonly useFn: LegacyItemEffectFn | null = null;
    private readonly canUseFn: LegacyItemCanUseFn | null = null;
    private readonly state: IStateSystem;

    constructor(legacy: LegacyItemData, state: IStateSystem) {
        this.state = state;
        this.pickEvent = undefined;
        this.useEvent = legacy.useItemEvent;

        if (legacy.itemEffect) {
            this.pickFn = new Function(
                'state',
                'item',
                legacy.itemEffect
            ) as LegacyItemEffectFn;
        }
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

    pickEffect(item: IItemRawData): void {
        this.pickFn?.(this.state, item);
    }

    useEffect(item: IItemRawData): void {
        this.useFn?.(this.state, item);
    }

    canUse(item: IItemRawData): boolean {
        if (!this.canUseFn) return true;
        else return this.canUseFn(this.state, item);
    }
}

export class ItemLegacyBridge implements IItemLegacyConverter<LegacyItemData> {
    constructor(private readonly state: IStateSystem) {}

    fromLegacy(num: number, legacy: LegacyItemData): IItemRawData {
        const effect = new LegacyItemEffect(legacy, this.state);
        return {
            num,
            id: legacy.id,
            category: this.mapCategory(legacy.cls),
            name: legacy.name,
            text: legacy.text ?? '',
            hideInToolbox: legacy.hideInToolBox,
            effect,
            equip: legacy.equip
        };
    }

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
