import { IItemRawData, ItemCategory } from '@user/data-common';

type HeroAttr = import('@user/data-common').IHeroAttr;
type CoreState = import('@user/data-state').ICoreState;
// type ItemEffect = import('@user/data-common').IItemEffect<HeroAttr, CoreState>;

// --- SYSTEM ITEM PREFIX --- //

// export const item200: ItemEffect = {
//     canUse() {
//         return true;
//     }
// };

// --- SYSTEM ITEM SPLIT --- //

// export const item201: ItemEffect = {
//     canUse(item, state) {
//         return (
//             item.text.includes('test') &&
//             state.flags.getFieldValueDefaults('test', true)
//         );
//     }
// };

//#region 基础物品

export const yellowKey: IItemRawData<HeroAttr> = {
    num: 65,
    category: ItemCategory.Consumable,
    name: '黄钥匙',
    text: '可以打开一扇黄门',
    hideInToolbox: true,
    effect: {
        // 普通钥匙由开门流程消耗，禁止从背包直接使用
        canUse() {
            return false;
        }
    }
};

export const blueKey: IItemRawData<HeroAttr> = {
    num: 66,
    category: ItemCategory.Consumable,
    name: '蓝钥匙',
    text: '可以打开一扇蓝门',
    hideInToolbox: true,
    effect: {
        canUse() {
            return false;
        }
    }
};

export const redKey: IItemRawData<HeroAttr> = {
    num: 67,
    category: ItemCategory.Consumable,
    name: '红钥匙',
    text: '可以打开一扇红门',
    hideInToolbox: true,
    effect: {
        canUse() {
            return false;
        }
    }
};

export const greenKey: IItemRawData<HeroAttr> = {
    num: 68,
    category: ItemCategory.Consumable,
    name: '绿钥匙',
    text: '可以打开一扇绿门',
    hideInToolbox: false,
    effect: {
        canUse() {
            return false;
        }
    }
};

export const steelKey: IItemRawData<HeroAttr> = {
    num: 69,
    category: ItemCategory.Consumable,
    name: '铁门钥匙',
    text: '可以打开一扇铁门',
    hideInToolbox: false,
    effect: {
        canUse() {
            return false;
        }
    }
};

export const redGem: IItemRawData<HeroAttr> = {
    num: 71,
    category: ItemCategory.Pick,
    name: '红宝石',
    text: '攻击+3',
    hideInToolbox: false,
    effect: {
        useEffect(_item, state: CoreState) {
            state.hero.getModifiableAttribute().add('atk', 3);
        }
    }
};

export const blueGem: IItemRawData<HeroAttr> = {
    num: 72,
    category: ItemCategory.Pick,
    name: '蓝宝石',
    text: '防御+3',
    hideInToolbox: false,
    effect: {
        useEffect(_item, state: CoreState) {
            state.hero.getModifiableAttribute().add('def', 3);
        }
    }
};

export const greenGem: IItemRawData<HeroAttr> = {
    num: 73,
    category: ItemCategory.Pick,
    name: '绿宝石',
    text: '护盾+5',
    hideInToolbox: false,
    effect: {
        useEffect(_item, state: CoreState) {
            state.hero.getModifiableAttribute().add('mdef', 5);
        }
    }
};

export const yellowGem: IItemRawData<HeroAttr> = {
    num: 74,
    category: ItemCategory.Pick,
    name: '黄宝石',
    text: '生命+1000，攻击+6，防御+6，护盾+10',
    hideInToolbox: false,
    effect: {
        // 对应旧样板拾取效果；背包使用时的加点选择不在此处实现
        useEffect(_item, state: CoreState) {
            const attribute = state.hero.getModifiableAttribute();
            attribute.add('hp', 1000);
            attribute.add('atk', 6);
            attribute.add('def', 6);
            attribute.add('mdef', 10);
        }
    }
};

export const items: readonly IItemRawData<HeroAttr>[] = [
    yellowKey,
    blueKey,
    redKey,
    greenKey,
    steelKey,
    redGem,
    blueGem,
    greenGem,
    yellowGem
];

//#endregion
// --- SYSTEM ITEM END --- //
