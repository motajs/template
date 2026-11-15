import { IItemRawData, ItemCategory } from '@user/data-common';

type HeroAttr = import('@user/data-common').IHeroAttr;
type CoreState = import('@user/data-state').ICoreState;
type ItemEffect = import('@user/data-common').IItemEffect<HeroAttr, CoreState>;

// --- SYSTEM ITEM PREFIX --- //

export const item065: ItemEffect = {
    // 普通钥匙由开门流程消耗，禁止从背包直接使用
    canUse() {
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item066: ItemEffect = {
    canUse() {
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item067: ItemEffect = {
    canUse() {
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item068: ItemEffect = {
    canUse() {
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item069: ItemEffect = {
    canUse() {
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item070: ItemEffect = {
    useEffect() {
        // TODO: 实现大黄门钥匙效果
    },

    canUse() {
        // TODO: 判断当前层存在可开启的黄门，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item071: ItemEffect = {
    useEffect(_item, state) {
        state.hero.getModifiableAttribute().add('atk', 3);
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item072: ItemEffect = {
    useEffect(_item, state) {
        state.hero.getModifiableAttribute().add('def', 3);
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item073: ItemEffect = {
    useEffect(_item, state) {
        state.hero.getModifiableAttribute().add('mdef', 5);
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item074: ItemEffect = {
    // 对应旧样板拾取效果；背包使用时的加点选择不在此处实现
    useEffect(_item, state) {
        const attribute = state.hero.getModifiableAttribute();
        attribute.add('hp', 1000);
        attribute.add('atk', 6);
        attribute.add('def', 6);
        attribute.add('mdef', 10);
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item075: ItemEffect = {
    useEffect() {
        // TODO: 实现红血瓶效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item076: ItemEffect = {
    useEffect() {
        // TODO: 实现蓝血瓶效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item077: ItemEffect = {
    useEffect() {
        // TODO: 实现绿血瓶效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item078: ItemEffect = {
    useEffect() {
        // TODO: 实现黄血瓶效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item079: ItemEffect = {
    useEffect() {
        // TODO: 实现铁剑效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item080: ItemEffect = {
    useEffect() {
        // TODO: 实现铁盾效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item081: ItemEffect = {
    useEffect() {
        // TODO: 实现银剑效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item082: ItemEffect = {
    useEffect() {
        // TODO: 实现银盾效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item083: ItemEffect = {
    useEffect() {
        // TODO: 实现骑士剑效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item084: ItemEffect = {
    useEffect() {
        // TODO: 实现骑士盾效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item085: ItemEffect = {
    useEffect() {
        // TODO: 实现圣剑效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item086: ItemEffect = {
    useEffect() {
        // TODO: 实现圣盾效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item087: ItemEffect = {
    useEffect() {
        // TODO: 实现神圣剑效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item088: ItemEffect = {
    useEffect() {
        // TODO: 实现神圣盾效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item089: ItemEffect = {
    useEffect() {
        // TODO: 实现怪物手册效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item090: ItemEffect = {
    useEffect() {
        // TODO: 实现楼层传送器效果
    },

    canUse() {
        // TODO: 判断当前楼层允许传送且满足楼梯限制，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item091: ItemEffect = {
    useEffect() {
        // TODO: 实现破墙镐效果
    },

    canUse() {
        // TODO: 判断目标位置存在可破坏的墙，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item092: ItemEffect = {
    useEffect() {
        // TODO: 实现破冰镐效果
    },

    canUse() {
        // TODO: 判断前方存在冰墙，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item093: ItemEffect = {
    useEffect() {
        // TODO: 实现炸弹效果
    },

    canUse() {
        // TODO: 判断目标位置存在可炸毁的怪物，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item094: ItemEffect = {
    useEffect() {
        // TODO: 实现中心对称飞行器效果
    },

    canUse() {
        // TODO: 判断中心对称位置可落脚，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item095: ItemEffect = {
    useEffect() {
        // TODO: 实现上楼器效果
    },

    canUse() {
        // TODO: 判断上一层存在且对应位置可落脚，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item096: ItemEffect = {
    useEffect() {
        // TODO: 实现下楼器效果
    },

    canUse() {
        // TODO: 判断下一层存在且对应位置可落脚，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item097: ItemEffect = {
    canUse() {
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item098: ItemEffect = {
    useEffect() {
        // TODO: 实现冰冻徽章效果
    },

    canUse() {
        // TODO: 判断目标位置存在熔岩，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item099: ItemEffect = {
    canUse() {
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item100: ItemEffect = {
    useEffect() {
        // TODO: 实现圣水效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item101: ItemEffect = {
    useEffect() {
        // TODO: 实现地震卷轴效果
    },

    canUse() {
        // TODO: 判断当前层存在可破坏的墙，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item102: ItemEffect = {
    useEffect() {
        // TODO: 实现解毒药水效果
    },

    canUse() {
        // TODO: 判断勇士处于中毒状态，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item103: ItemEffect = {
    useEffect() {
        // TODO: 实现解衰药水效果
    },

    canUse() {
        // TODO: 判断勇士处于衰弱状态，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item104: ItemEffect = {
    useEffect() {
        // TODO: 实现解咒药水效果
    },

    canUse() {
        // TODO: 判断勇士处于诅咒状态，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item105: ItemEffect = {
    useEffect() {
        // TODO: 实现万能药水效果
    },

    canUse() {
        // TODO: 判断勇士存在可解除的异常状态，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item106: ItemEffect = {
    canUse() {
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item107: ItemEffect = {
    useEffect() {
        // TODO: 实现钱袋效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item108: ItemEffect = {
    canUse() {
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item109: ItemEffect = {
    canUse() {
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item110: ItemEffect = {
    useEffect() {
        // TODO: 实现生命魔杖效果
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item111: ItemEffect = {
    useEffect() {
        // TODO: 实现跳跃靴效果
    },

    canUse() {
        // TODO: 判断前方两格在地图内且可落脚，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM SPLIT --- //

export const item112: ItemEffect = {};

// --- SYSTEM ITEM SPLIT --- //

export const item113: ItemEffect = {};

// --- SYSTEM ITEM SPLIT --- //

export const item114: ItemEffect = {
    useEffect() {
        // TODO: 实现技能：二倍斩效果
    },

    canUse() {
        // TODO: 判断技能已开启或魔力满足开启要求，条件接入前暂不允许使用
        return false;
    }
};

// --- SYSTEM ITEM END --- //
