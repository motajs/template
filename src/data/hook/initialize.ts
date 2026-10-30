import { ICoreState } from '@user/data-state';
import { MainCombatFlowHooks } from './combat';
import { MainGameEventExecutorHooks } from './event';
import {
    MainHeroAttributeHooks,
    MainHeroLocationHooks,
    MainHeroMoverHooks,
    MainHeroStateHooks
} from './hero';
import { MainMotaDataLoaderHooks } from './loader';
import { MainPathfindingSystemHooks } from './path';

/**
 * 初始化数据端主要钩子
 * @param state 数据端主对象
 */
export function initializeHooks(state: ICoreState) {
    state.combat.addHook(new MainCombatFlowHooks(state));
    state.eventSystem.executor.addHook(new MainGameEventExecutorHooks(state));
    state.hero.addHook(new MainHeroStateHooks(state));
    state.hero.attribute.addHook(new MainHeroAttributeHooks(state));
    state.hero.location.addHook(new MainHeroLocationHooks(state));
    state.hero.location.mover.addHook(new MainHeroMoverHooks(state));
    state.loader.addHook(new MainMotaDataLoaderHooks(state));
    state.pathfinding.addHook(new MainPathfindingSystemHooks(state));
}
