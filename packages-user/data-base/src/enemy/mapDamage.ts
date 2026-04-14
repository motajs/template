import { logger } from '@motajs/common';
import { ITileLocator } from '@user/types';
import {
    IEnemyContext,
    IEnemyView,
    IMapDamage,
    IMapDamageConverter,
    IMapDamageInfo,
    IMapDamageReducer,
    IMapDamageView,
    IMapLocIndexer
} from './types';

interface IPointInfo {
    /** 该点所有的地图伤害 */
    readonly damages: Set<Readonly<IMapDamageInfo>>;
    /** 所有影响该点的地图伤害视图 */
    readonly affectedBy: Set<IMapDamageView<any>>;
}

interface IViewStore {
    /** 该地图伤害视图所影响的伤害信息 */
    readonly damages: Map<number, Readonly<IMapDamageInfo>>;
    /** 当前视图所属的怪物视图 */
    readonly enemy: IEnemyView;
}

interface IDamageStore {
    /** 该地图伤害信息的地图伤害视图来源 */
    readonly sourceView: IMapDamageView<any>;
    /** 地图伤害信息的来源怪物 */
    readonly sourceEnemy: IEnemyView;
    /** 该地图伤害信息所处的索引 */
    readonly index: number;
}

export class MapDamage implements IMapDamage {
    /** 当前使用的地图伤害转换器 */
    private converter: IMapDamageConverter | null = null;
    /** 当前使用的地图伤害合并器 */
    private reducer: IMapDamageReducer | null = null;

    /** 无来源地图伤害，坐标 -> 点伤害信息 */
    private readonly sourcelessDamage: Map<number, IPointInfo> = new Map();
    /** 有来源地图伤害，坐标 -> 点伤害信息 */
    private readonly sourcedDamage: Map<number, IPointInfo> = new Map();
    /** 地图伤害视图 -> 其信息对象 */
    private readonly viewStore: Map<IMapDamageView, IViewStore> = new Map();
    /** 地图伤害信息 -> 其信息对象 */
    private readonly damageStore: Map<IMapDamageInfo, IDamageStore> = new Map();
    /** 怪物视图 -> 其影响对象 */
    private readonly enemyStore: Map<IEnemyView, Set<IMapDamageView>> =
        new Map();
    /** 需要延迟刷新的坐标索引 */
    private readonly dirtyIndexes: Set<number> = new Set();
    /** 合并后伤害缓存，索引 -> 合并结果 */
    private readonly reducedCache: Map<number, IMapDamageInfo> = new Map();

    constructor(
        readonly context: IEnemyContext,
        readonly indexer: IMapLocIndexer
    ) {}

    useConverter(converter: IMapDamageConverter): void {
        this.converter = converter;
        this.refreshAll();
    }

    useReducer(reducer: IMapDamageReducer): void {
        this.reducer = reducer;
        this.reducedCache.clear();
    }

    addMapDamage(locator: ITileLocator, info: IMapDamageInfo): void {
        const index = this.indexer.locaterToIndex(locator);
        const store = this.sourcelessDamage.getOrInsertComputed(index, () => ({
            affectedBy: new Set(),
            damages: new Set()
        }));
        store.damages.add(info);
        this.markDirtyIndex(index);
    }

    deleteMapDamage(locator: ITileLocator, info: IMapDamageInfo): void {
        const index = this.indexer.locaterToIndex(locator);
        const current = this.sourcelessDamage.get(index);
        if (!current) return;
        current.damages.delete(info);
        this.markDirtyIndex(index);
    }

    /**
     * 将指定索引标记为脏
     * @param index 坐标索引
     */
    private markDirtyIndex(index: number) {
        this.dirtyIndexes.add(index);
        this.reducedCache.delete(index);
    }

    markDirty(locator: ITileLocator): void {
        this.markDirtyIndex(this.indexer.locaterToIndex(locator));
    }

    markEnemyDirty(view: IEnemyView): void {
        const store = this.enemyStore.get(view);
        const locator = this.context.getEnemyLocatorByView(view);
        if (!store) {
            if (!locator) {
                logger.warn(104);
            } else {
                this.refreshAll();
            }
            return;
        }
        if (!locator) return;
        this.refreshEnemyAndClearCache(view, locator);
    }

    deleteEnemy(view: IEnemyView): void {
        const store = this.enemyStore.get(view);
        if (!store) return;
        const collection = new Set<number>();
        for (const viewItem of store) {
            const affecting = this.viewStore.get(viewItem);
            if (!affecting) continue;
            affecting.damages.forEach((dam, index) => {
                this.damageStore.delete(dam);
                collection.add(index);
            });
            this.viewStore.delete(viewItem);
        }
        this.enemyStore.delete(view);
        collection.forEach(v => {
            this.markDirtyIndex(v);
        });
    }

    getReducedDamage(locator: ITileLocator): Readonly<IMapDamageInfo> | null {
        if (!this.reducer) {
            logger.warn(103);
            return null;
        }

        const index = this.indexer.locaterToIndex(locator);
        if (this.dirtyIndexes.has(index)) {
            this.refreshIndex(index);
        }

        const cache = this.reducedCache.get(index);
        if (cache) return cache;

        const separated = this.getSeparatedDamageByIndex(index);
        if (separated.size === 0) return null;

        const reduced = this.reducer.reduce(separated, locator);
        this.reducedCache.set(index, reduced);
        return reduced;
    }

    /**
     * 根据索引获取指定位置的合并前伤害
     * @param index 坐标索引
     */
    private getSeparatedDamageByIndex(
        index: number
    ): Set<Readonly<IMapDamageInfo>> {
        const sourceless = this.sourcelessDamage.get(index);
        const sourced = this.sourcedDamage.get(index);
        if (sourceless) {
            if (sourced) {
                return sourced.damages.union(sourceless.damages);
            } else {
                return sourceless.damages;
            }
        } else if (sourced) {
            return sourced.damages;
        } else {
            return new Set();
        }
    }

    getSeparatedDamage(
        locator: ITileLocator
    ): Iterable<Readonly<IMapDamageInfo>> {
        const index = this.indexer.locaterToIndex(locator);
        if (this.dirtyIndexes.has(index)) {
            this.refreshIndex(index);
        }
        return this.getSeparatedDamageByIndex(index);
    }

    /**
     * 清空所有有来源伤害的内部状态
     */
    private clearSourceState(): void {
        this.sourcedDamage.clear();
        this.damageStore.clear();
        this.viewStore.clear();
        this.enemyStore.clear();
        this.dirtyIndexes.clear();
        this.reducedCache.clear();
    }

    /**
     * 移除指定怪物所产生的地图伤害
     * @param view 怪物视图
     */
    private removeEnemyAffecting(view: IEnemyView) {
        const views = this.enemyStore.get(view);
        if (!views) return;
        views.forEach(viewItem => {
            const store = this.viewStore.get(viewItem);
            if (!store) return;
            store.damages.forEach((dam, index) => {
                const point = this.sourcedDamage.get(index);
                if (!point) return;
                point.affectedBy.delete(viewItem);
                point.damages.delete(dam);
                this.damageStore.delete(dam);
            });
            this.viewStore.delete(viewItem);
        });
        this.enemyStore.delete(view);
    }

    /**
     * 刷新指定位置的怪物地图伤害，并执行刷新缓存的操作
     */
    private refreshEnemyAndClearCache(view: IEnemyView, locator: ITileLocator) {
        this.removeEnemyAffecting(view);
        const enemy = view.getComputedEnemy();
        const views = this.converter!.convert(enemy, locator, this.context);
        const set = new Set(views);
        if (set.size === 0) return;
        this.enemyStore.set(view, set);
        const collection = new Set<number>();
        set.forEach(viewItem => {
            const range = viewItem.getRange();
            const param = viewItem.getRangeParam();
            range.bindHost(this.context);
            for (const index of range.iterateLoc(param)) {
                const loc = this.indexer.indexToLocator(index);
                const point = this.sourcedDamage.getOrInsertComputed(
                    index,
                    () => ({
                        affectedBy: new Set(),
                        damages: new Set()
                    })
                );
                const damage = viewItem.getDamageWithoutCheck(loc);
                if (damage) {
                    point.affectedBy.add(viewItem);
                    point.damages.add(damage);
                    collection.add(index);
                }
            }
        });
        collection.forEach(v => {
            this.dirtyIndexes.delete(v);
            this.reducedCache.delete(v);
        });
    }

    /**
     * 刷新指定位置的怪物地图伤害
     */
    private refreshEnemy(view: IEnemyView, locator: ITileLocator) {
        this.removeEnemyAffecting(view);
        const enemy = view.getComputedEnemy();
        const views = this.converter!.convert(enemy, locator, this.context);
        const set = new Set(views);
        if (set.size === 0) return;
        this.enemyStore.set(view, set);
        set.forEach(viewItem => {
            const range = viewItem.getRange();
            const param = viewItem.getRangeParam();
            range.bindHost(this.context);
            for (const index of range.iterateLoc(param)) {
                const loc = this.indexer.indexToLocator(index);
                const point = this.sourcedDamage.getOrInsertComputed(
                    index,
                    () => ({
                        affectedBy: new Set(),
                        damages: new Set()
                    })
                );
                const damage = viewItem.getDamageWithoutCheck(loc);
                if (damage) {
                    point.affectedBy.add(viewItem);
                    point.damages.add(damage);
                }
            }
        });
    }

    refreshAll(): void {
        if (!this.converter) {
            logger.warn(102);
            return;
        }
        if (!this.reducer) {
            logger.warn(103);
            return;
        }

        this.clearSourceState();
        this.reducedCache.clear();

        for (const [locator, view] of this.context.iterateEnemy()) {
            this.refreshEnemy(view, locator);
        }
    }

    /**
     * 重新计算指定点位的有来源伤害缓存
     */
    private refreshIndex(index: number): void {
        this.dirtyIndexes.delete(index);
        this.reducedCache.delete(index);

        const locator = this.indexer.indexToLocator(index);
        const point = this.sourcedDamage.get(index);
        if (!point) return;

        for (const damage of point.damages) {
            const store = this.damageStore.get(damage);
            if (!store) continue;
            const viewStore = this.viewStore.get(store.sourceView);
            if (!viewStore) continue;
            viewStore.damages.delete(index);
            this.damageStore.delete(damage);
        }
        point.damages.clear();

        point.affectedBy.forEach(view => {
            const damage = view.getDamageWithoutCheck(locator);
            if (damage) point.damages.add(damage);
        });
    }
}
