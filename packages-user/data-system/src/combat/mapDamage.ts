import { logger, ITileLocator } from '@motajs/common';
import {
    IEnemyContext,
    IReadonlyEnemyHandler,
    IEnemyView,
    IMapDamage,
    IMapDamageConverter,
    IMapDamageInfo,
    IMapDamageReducer,
    IMapDamageView
} from './types';
import { IStateBase } from '@user/data-base';
import { ILocationHelper } from '@user/data-common';

interface IPointInfo {
    /** 该点所有的地图伤害 */
    readonly damages: Set<Readonly<IMapDamageInfo>>;
    /** 所有影响该点的地图伤害视图 */
    readonly affectedBy: Set<IMapDamageView<any>>;
}

interface IViewStore<TAttr> {
    /** 该地图伤害视图所影响的伤害信息 */
    readonly damages: Map<number, Readonly<IMapDamageInfo>>;
    /** 当前视图所属的怪物视图 */
    readonly enemy: IEnemyView<TAttr>;
}

interface IDamageStore<TAttr> {
    /** 该地图伤害信息的地图伤害视图来源 */
    readonly sourceView: IMapDamageView<any>;
    /** 地图伤害信息的来源怪物 */
    readonly sourceEnemy: IEnemyView<TAttr>;
    /** 该地图伤害信息所处的索引 */
    readonly index: number;
}

export class MapDamage<TEnemy, THero> implements IMapDamage<TEnemy, THero> {
    /** 当前使用的地图伤害转换器 */
    private converter: IMapDamageConverter<TEnemy, THero> | null = null;
    /** 当前使用的地图伤害合并器 */
    private reducer: IMapDamageReducer | null = null;

    /** 无来源地图伤害，坐标 -> 点伤害信息 */
    private readonly sourcelessDamage: Map<number, IPointInfo> = new Map();
    /** 有来源地图伤害，坐标 -> 点伤害信息 */
    private readonly sourcedDamage: Map<number, IPointInfo> = new Map();
    /** 地图伤害视图 -> 其信息对象 */
    private readonly viewStore: Map<IMapDamageView<any>, IViewStore<TEnemy>> =
        new Map();
    /** 地图伤害信息 -> 其信息对象 */
    private readonly damageStore: Map<IMapDamageInfo, IDamageStore<TEnemy>> =
        new Map();
    /** 怪物视图 -> 其影响对象 */
    private readonly enemyStore: Map<
        IEnemyView<TEnemy>,
        Set<IMapDamageView<any>>
    > = new Map();
    /** 需要延迟刷新的坐标索引 */
    private readonly dirtyIndexes: Set<number> = new Set();
    /** 合并后伤害缓存，索引 -> 合并结果 */
    private readonly reducedCache: Map<number, IMapDamageInfo> = new Map();

    /** 坐标索引对象 */
    private readonly indexer: ILocationHelper;

    readonly state: IStateBase;

    constructor(readonly context: IEnemyContext<TEnemy, THero>) {
        this.indexer = context.indexer;
        this.state = context.state;
    }

    useConverter(converter: IMapDamageConverter<TEnemy, THero>): void {
        this.converter = converter;
        this.refreshAll();
    }

    /**
     * 创建只读信息对象
     * @param view 怪物视图
     * @param locator 怪物位置
     */
    private createReadonlyHandler(
        view: IEnemyView<TEnemy>,
        locator: ITileLocator
    ): IReadonlyEnemyHandler<TEnemy, THero> | null {
        const hero = this.context.getBindedHero();
        if (!hero) return null;
        return {
            enemy: view.getComputedEnemy(),
            context: this.context,
            locator,
            hero,
            state: this.state
        };
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
        if (current.damages.size === 0 && current.affectedBy.size === 0) {
            this.sourcelessDamage.delete(index);
        }
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

    markEnemyDirty(view: IEnemyView<TEnemy>): void {
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

    deleteEnemy(view: IEnemyView<TEnemy>): void {
        const store = this.enemyStore.get(view);
        if (!store) return;
        const collection = new Set<number>();
        for (const viewItem of store) {
            const affecting = this.viewStore.get(viewItem);
            if (!affecting) continue;
            affecting.damages.forEach((dam, index) => {
                this.damageStore.delete(dam);
                collection.add(index);
                const point = this.sourcedDamage.get(index);
                if (!point) return;
                point.affectedBy.delete(viewItem);
                point.damages.delete(dam);
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
                // 大集合 union 小集合会更快，一般有来源伤害更多，所以 source union sourceless
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
    private removeEnemyAffecting(view: IEnemyView<TEnemy>) {
        const views = this.enemyStore.get(view);
        if (!views) return;
        // 收集被移除贡献的坐标索引，遍历结束后统一标脏以清掉其旧合并缓存
        const removed = new Set<number>();
        views.forEach(viewItem => {
            const store = this.viewStore.get(viewItem);
            if (!store) return;
            store.damages.forEach((dam, index) => {
                removed.add(index);
                const point = this.sourcedDamage.get(index);
                if (!point) return;
                point.affectedBy.delete(viewItem);
                point.damages.delete(dam);
                this.damageStore.delete(dam);
            });
            this.viewStore.delete(viewItem);
        });
        this.enemyStore.delete(view);
        removed.forEach(index => {
            this.markDirtyIndex(index);
        });
    }

    /**
     * 登记有来源伤害的反向索引，供删除与局部刷新时按来源清理
     * @param point 坐标点伤害信息
     * @param viewItem 产生伤害的视图
     * @param sourceEnemy 该视图所属的怪物视图
     * @param index 坐标索引
     * @param damage 该点上的伤害信息
     */
    private registerSourcedDamage(
        point: IPointInfo,
        viewItem: IMapDamageView<any>,
        sourceEnemy: IEnemyView<TEnemy>,
        index: number,
        damage: Readonly<IMapDamageInfo>
    ): void {
        point.affectedBy.add(viewItem);
        point.damages.add(damage);
        this.damageStore.set(damage, {
            sourceView: viewItem,
            sourceEnemy,
            index
        });
        const viewStore = this.viewStore.getOrInsertComputed(viewItem, () => ({
            damages: new Map(),
            enemy: sourceEnemy
        }));
        viewStore.damages.set(index, damage);
    }

    /**
     * 刷新指定位置的怪物地图伤害，并执行刷新缓存的操作
     */
    private refreshEnemyAndClearCache(
        view: IEnemyView<TEnemy>,
        locator: ITileLocator
    ) {
        this.removeEnemyAffecting(view);
        if (!this.converter) return;
        const handler = this.createReadonlyHandler(view, locator);
        if (!handler) return;
        const views = this.converter.convert(handler, this.context);
        const set = new Set<IMapDamageView<any>>(views);
        // 空集也需要登记，否则该怪物此后标脏会退回整表刷新
        this.enemyStore.set(view, set);
        if (set.size === 0) return;
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
                    this.registerSourcedDamage(
                        point,
                        viewItem,
                        view,
                        index,
                        damage
                    );
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
    private refreshEnemy(view: IEnemyView<TEnemy>, locator: ITileLocator) {
        this.removeEnemyAffecting(view);
        if (!this.converter) return;
        const handler = this.createReadonlyHandler(view, locator);
        if (!handler) return;
        const views = this.converter.convert(handler, this.context);
        const set = new Set<IMapDamageView<any>>(views);
        // 空集也需要登记，否则该怪物此后标脏会退回整表刷新
        this.enemyStore.set(view, set);
        if (set.size === 0) return;
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
                    this.registerSourcedDamage(
                        point,
                        viewItem,
                        view,
                        index,
                        damage
                    );
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
            if (!damage) return;
            // 视图已被删除时不再重建其伤害，避免删除怪物后残留来源伤害
            const viewStore = this.viewStore.get(view);
            if (!viewStore) return;
            this.registerSourcedDamage(
                point,
                view,
                viewStore.enemy,
                index,
                damage
            );
        });
    }
}
