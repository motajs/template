import { ICoreState } from '@user/data-state';
import { createSpecials } from './special';
import { DamageSystem, MapDamage } from '@user/data-system';
import {
    SpecialAuraConverter,
    CommonAuraConverter,
    GuardAuraConverter
} from './aura';
import { MainEnemyFinalEffect } from './final';
import { MainDamageCalculator } from './calculator';
import { MainEnemyComparer } from './comparer';
import { MainMapDamageConverter, MainMapDamageReducer } from './mapDamage';
import { IEnemyInitializationReturns } from './types';
import {
    EnemyChangeFloorHooks,
    EnemyCombatHooks,
    EnemyMoveHooks,
    EnemyPathfindingHooks
} from './hook';
import { MainCombatScript } from './script';

/**
 * 初始化怪物相关内容
 * @param state 数据端主对象
 * @param config 数据端配置
 */
export function initializeEnemy(
    state: ICoreState
): IEnemyInitializationReturns {
    // 怪物管理器初始化
    const comparer = new MainEnemyComparer();
    state.enemyManager.attachEnemyComparer(comparer);

    // 特殊属性定义注册
    const specials = createSpecials(state);
    for (const [code, cons] of specials) {
        state.enemyManager.registerSpecial(code, cons);
    }

    // 初始化怪物上下文
    const ctx = state.enemyContext;
    const damageSystem = new DamageSystem(ctx);
    const mapDamage = new MapDamage(ctx);
    damageSystem.useCalculator(new MainDamageCalculator());
    mapDamage.useReducer(new MainMapDamageReducer());
    mapDamage.useConverter(new MainMapDamageConverter());
    ctx.attachDamageSystem(damageSystem);
    ctx.attachMapDamage(mapDamage);
    ctx.bindHero(state.hero.getAttribute());

    // 注册光环转换器
    ctx.registerAuraConverter(new CommonAuraConverter());
    ctx.registerAuraConverter(new GuardAuraConverter());
    ctx.registerAuraConverter(new SpecialAuraConverter());

    // 注册怪物最终效果
    ctx.registerFinalEffect(new MainEnemyFinalEffect());

    // 添加默认战前战后脚本
    state.combat.addCombatScript(new MainCombatScript());

    // 注册相关的钩子
    state.hero.location.mover.addHook(new EnemyMoveHooks(state));
    state.pathfinding.addHook(new EnemyPathfindingHooks(state));
    const combatHook = new EnemyCombatHooks(state);
    state.combat.addHook(combatHook);
    state.hero.location.addHook(new EnemyChangeFloorHooks(state));

    return { weak: combatHook };
}
