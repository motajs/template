import {
    Dir4FaceHandler,
    Dir8FaceHandler,
    FaceDirection,
    FaceGroup,
    IFacedTileLocator
} from '@user/data-common';
import {
    ICoreState,
    ICoreStateCoreConfig,
    IDataPluginDefine
} from '@user/data-state';
import { initializeEnemy } from './enemy';
import { initializeReplay } from './replay';
import { logger } from '@motajs/common';
import { DefaultHeroMoveTopImpl, DefaultPassPredicateImpl } from './hero';
import { DefaultDataLoaderHook } from './loader';

export class MainDataPlugin implements IDataPluginDefine {
    readonly id: string = 'main-data-plugin';
    readonly dependencies: string[] = [];

    constructor(readonly heroFace: FaceGroup) {}

    awake(state: ICoreState): void {
        // 朝向组初始化
        const dir4 = new Dir4FaceHandler();
        const dir8 = new Dir8FaceHandler();
        state.faceManager.register(FaceGroup.Dir4, dir4);
        state.faceManager.registerById('dir4', dir4);
        state.faceManager.register(FaceGroup.Dir8, dir8);
        state.faceManager.registerById('dir8', dir8);

        // 寻路初始化
        const predicate = new DefaultPassPredicateImpl(state);
        state.pathfinding.finder.usePassPredicate(predicate);
        // 初始状态下勇士不在任何楼层，切换楼层后再具体设置
        state.pathfinding.finder.useMapLayer(null);
        state.pathfinding.useMover(state.hero.location.mover);

        // 勇士同步初始化
        const heroMoveTopImpl = new DefaultHeroMoveTopImpl(state);
        state.hero.location.mover.useTopImplementation(heroMoveTopImpl);

        // 加载
        state.loader.addHook(new DefaultDataLoaderHook());

        // 其他复杂初始化
        initializeEnemy(state);
        initializeReplay(state);

        // 存档初始化
        state.addSaveableContent('@system/hero', state.hero);
        state.addSaveableContent('@system/flags', state.flags);
        state.addSaveableContent('@system/maps', state.maps);
        state.addSaveableContent('@system/enemy', state.enemyManager);
        state.addSaveableContent('@system/replay', state.replaySystem);
    }

    async initialize(): Promise<void> {}

    async afterLoad(state: ICoreState): Promise<void> {
        // 进行勇士的加载后初始化
        const coreConfig = state.loader.getConfig<ICoreStateCoreConfig>('core');
        if (!coreConfig) {
            logger.error(79, 'Data');
            return;
        }
        const dir = state.faceManager.get(this.heroFace);
        if (!dir) {
            logger.error(80);
            return;
        }
        state.hero.createAttribute(coreConfig.init.hero.attribute);
        const location: IFacedTileLocator = {
            x: coreConfig.init.hero.x,
            y: coreConfig.init.hero.y,
            direction: FaceDirection.Down
        };
        state.hero.createLocation(location, dir);
    }
}
