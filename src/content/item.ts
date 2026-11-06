type HeroAttr = import('@user/data-common').IHeroAttr;
type CoreState = import('@user/data-state').ICoreState;
type ItemEffect = import('@user/data-common').IItemEffect<HeroAttr, CoreState>;

// --- SYSTEM ITEM PREFIX --- //

export const item200: ItemEffect = {
    canUse() {
        return true;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item201: ItemEffect = {
    canUse(item, state) {
        return (
            item.text.includes('test') &&
            state.flags.getFieldValueDefaults('test', true)
        );
    }
};

// --- SYSTEM ITEM END --- //
