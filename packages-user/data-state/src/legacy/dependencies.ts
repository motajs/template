import {
    IItemLegacyConverter,
    IHeroAttr,
    IEnemyAttr,
    ISaveSystem,
    ITileLegacyConverter,
    MemorySaveSystem,
    SaveSystem
} from '@user/data-common';
import { IEnemyLegacyBridge, loading } from '@user/data-base';
import { IStateSystem } from '@user/data-system';
import { EnemyLegacyBridge } from '../enemy/legacy';
import { ItemLegacyBridge, LegacyItemData } from './item';
import { LegacyTileData, TileLegacyBridge } from './tile';

export interface ILegacyLoadData {
    readonly tiles: typeof core.maps.blocksInfo;
    readonly items: typeof core.items.items;
    readonly enemies: Record<EnemyIds, Enemy>;
    readonly floors: FloorIds[];
    readonly maps: Record<FloorIds, ResolvedFloor>;
}

export interface ILegacyDependencies {
    readonly saveSystem: ISaveSystem;
    readonly tileConverter: ITileLegacyConverter<LegacyTileData> | null;
    readonly enemyBridge: IEnemyLegacyBridge<IEnemyAttr>;
    createItemConverter(
        state: IStateSystem
    ): IItemLegacyConverter<IHeroAttr, LegacyItemData> | null;
    registerLoading(onLoaded: (data: ILegacyLoadData) => void): void;
}

function hasLegacyHost(): boolean {
    return (
        typeof main !== 'undefined' &&
        typeof core !== 'undefined' &&
        typeof window !== 'undefined' &&
        typeof document !== 'undefined' &&
        typeof indexedDB !== 'undefined'
    );
}

export function createLegacyDependencies(): ILegacyDependencies {
    if (!hasLegacyHost()) {
        return {
            saveSystem: new MemorySaveSystem(),
            tileConverter: null,
            enemyBridge: new EnemyLegacyBridge(),
            createItemConverter: () => null,
            registerLoading: () => {}
        };
    }

    const saveSystem = new SaveSystem();
    return {
        saveSystem,
        tileConverter: new TileLegacyBridge(),
        enemyBridge: new EnemyLegacyBridge(),
        createItemConverter: state => new ItemLegacyBridge(state),
        registerLoading: onLoaded => {
            loading.once('coreInit', () => {
                saveSystem.init(`@game/${core.firstData.name}`);
            });
            loading.once('loaded', () => {
                onLoaded({
                    tiles: core.maps.blocksInfo,
                    items: core.items.items,
                    enemies: enemys_fcae963b_31c9_42b4_b48c_bb48d09f3f80,
                    floors: core.floorIds,
                    maps: core.floors as Record<FloorIds, ResolvedFloor>
                });
            });
        }
    };
}
