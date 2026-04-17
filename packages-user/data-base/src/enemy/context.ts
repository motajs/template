import { IRange, ITileLocator, logger } from '@motajs/common';
import {
    IAuraConverter,
    IAuraView,
    IDamageSystem,
    IEnemy,
    IEnemyAuraView,
    IEnemyCommonQueryEffect,
    IEnemyContext,
    IEnemyFinalEffect,
    IEnemyHandler,
    IEnemySpecialModifier,
    IEnemySpecialQueryEffect,
    IEnemyView,
    IMapDamage,
    IReadonlyEnemy,
    IReadonlyEnemyHandler,
    ISpecial
} from './types';
import { EnemyView } from './enemy';
import { MapLocIndexer } from './utils';
import { IReadonlyHeroAttribute } from '../hero';

export class EnemyContext<TAttr, THero> implements IEnemyContext<TAttr, THero> {
    private readonly enemyViewMap: Map<number, EnemyView<TAttr>> = new Map();
    private readonly enemyMap: Map<number, IEnemy<TAttr>> = new Map();
    private readonly locatorViewMap: Map<IEnemyView<TAttr>, number> = new Map();
    private readonly locatorEnemyMap: Map<IEnemy<TAttr>, number> = new Map();
    private readonly computedToView: Map<
        IReadonlyEnemy<TAttr>,
        EnemyView<TAttr>
    > = new Map();

    private readonly auraConverter: Set<IAuraConverter<TAttr, THero>> =
        new Set();
    private readonly converterStatus: Map<
        IAuraConverter<TAttr, THero>,
        boolean
    > = new Map();
    private readonly convertedAura: Map<ISpecial<any>, IAuraView<TAttr>> =
        new Map();

    private readonly commonQueryMap: Map<
        number,
        IEnemyCommonQueryEffect<TAttr, THero>[]
    > = new Map();

    private readonly specialQueryEffects: Map<
        number,
        IEnemySpecialQueryEffect<TAttr, THero>[]
    > = new Map();

    private readonly finalEffects: IEnemyFinalEffect<TAttr, THero>[] = [];
    private readonly globalAuraList: Set<IAuraView<TAttr>> = new Set();
    private readonly sortedAura: Map<number, Set<IAuraView<TAttr>>> = new Map();

    private readonly needTotallyRefresh: Set<IEnemyView<TAttr>> = new Set();
    private readonly requestedCommonContext: Set<IEnemyView<TAttr>> = new Set();
    private readonly dirtyEnemy: Set<IEnemyView<TAttr>> = new Set();

    /** 当前绑定的勇士属性对象 */
    private bindedHero: IReadonlyHeroAttribute<THero> | null = null;
    /** 地图伤害对象 */
    private mapDamage: IMapDamage<TAttr, THero> | null = null;
    /** 伤害系统对象 */
    private damageSystem: IDamageSystem<TAttr, THero> | null = null;

    /** 索引工具 */
    readonly indexer: MapLocIndexer = new MapLocIndexer();

    /** 当前是否需要全量刷新 */
    private needUpdate: boolean = true;

    built: boolean = false;
    width: number = 0;
    height: number = 0;

    resize(width: number, height: number): void {
        this.clear();
        this.width = width;
        this.height = height;
        this.indexer.setWidth(width);
        this.needUpdate = true;
    }

    registerAuraConverter(converter: IAuraConverter<TAttr, THero>): void {
        this.auraConverter.add(converter);
        this.converterStatus.set(converter, true);
        this.needUpdate = true;
    }

    unregisterAuraConverter(converter: IAuraConverter<TAttr, THero>): void {
        this.auraConverter.delete(converter);
        this.converterStatus.delete(converter);
        this.needUpdate = true;
    }

    setAuraConverterEnabled(
        converter: IAuraConverter<TAttr, THero>,
        enabled: boolean
    ): void {
        if (!this.auraConverter.has(converter)) return;
        this.converterStatus.set(converter, enabled);
        this.needUpdate = true;
    }

    registerCommonQueryEffect(
        code: number,
        effect: IEnemyCommonQueryEffect<TAttr, THero>
    ): void {
        const array = this.commonQueryMap.getOrInsert(code, []);
        array.push(effect);
        array.sort((a, b) => b.priority - a.priority);
        this.needUpdate = true;
    }

    unregisterCommonQueryEffect(
        code: number,
        effect: IEnemyCommonQueryEffect<TAttr, THero>
    ): void {
        const array = this.commonQueryMap.get(code);
        if (!array) return;
        const index = array.indexOf(effect);
        if (index === -1) return;
        array.splice(index, 1);
        this.needUpdate = true;
    }

    registerSpecialQueryEffect(
        effect: IEnemySpecialQueryEffect<TAttr, THero>
    ): void {
        const list = this.specialQueryEffects.getOrInsert(effect.priority, []);
        list.push(effect);
        this.needUpdate = true;
    }

    unregisterSpecialQueryEffect(
        effect: IEnemySpecialQueryEffect<TAttr, THero>
    ): void {
        const list = this.specialQueryEffects.get(effect.priority);
        if (!list) return;
        const index = list.indexOf(effect);
        if (index !== -1) {
            list.splice(index, 1);
        }
        if (list.length === 0) {
            this.specialQueryEffects.delete(effect.priority);
        }
        this.needUpdate = true;
    }

    registerFinalEffect(effect: IEnemyFinalEffect<TAttr, THero>): void {
        this.finalEffects.push(effect);
        this.finalEffects.sort((a, b) => b.priority - a.priority);
        this.needUpdate = true;
    }

    unregisterFinalEffect(effect: IEnemyFinalEffect<TAttr, THero>): void {
        const index = this.finalEffects.indexOf(effect);
        if (index !== -1) {
            this.finalEffects.splice(index, 1);
        }
        this.needUpdate = true;
    }

    bindHero(hero: IReadonlyHeroAttribute<THero> | null): void {
        this.bindedHero = hero;
        this.needUpdate = true;
        this.damageSystem?.bindHeroStatus(hero);
        this.mapDamage?.refreshAll();
    }

    getBindedHero(): IReadonlyHeroAttribute<THero> | null {
        return this.bindedHero;
    }

    /**
     * 创建可修改信息对象
     * @param enemy 怪物对象
     * @param locator 怪物位置
     */
    private createHandler(
        enemy: IEnemy<TAttr>,
        locator: ITileLocator
    ): IEnemyHandler<TAttr, THero> {
        return { enemy, locator, hero: this.bindedHero! };
    }

    getEnemyLocator(enemy: IEnemy<TAttr>): Readonly<ITileLocator> | null {
        const index = this.locatorEnemyMap.get(enemy);
        if (index === undefined) return null;
        return this.indexer.indexToLocator(index);
    }

    getEnemyLocatorByView(
        view: IEnemyView<TAttr>
    ): Readonly<ITileLocator> | null {
        const index = this.locatorViewMap.get(view);
        if (index === undefined) return null;
        return this.indexer.indexToLocator(index);
    }

    getEnemyByLocator(locator: ITileLocator): IEnemyView<TAttr> | null {
        const index = this.indexer.locToIndex(locator.x, locator.y);
        return this.enemyViewMap.get(index) ?? null;
    }

    getEnemyByLoc(x: number, y: number): IEnemyView<TAttr> | null {
        const index = this.indexer.locToIndex(x, y);
        return this.enemyViewMap.get(index) ?? null;
    }

    getViewByComputed(enemy: IReadonlyEnemy<TAttr>): IEnemyView<TAttr> | null {
        return this.computedToView.get(enemy) ?? null;
    }

    /**
     * 删除指定索引位置的怪物以及与之关联的所有运行时状态
     * @param index 地图索引
     */
    private deleteEnemyAt(index: number) {
        const view = this.enemyViewMap.get(index);
        const enemy = this.enemyMap.get(index);
        if (!view || !enemy) return;
        this.needUpdate = true;

        if (this.mapDamage) {
            this.mapDamage.deleteEnemy(view);
        }
        if (this.damageSystem) {
            this.damageSystem.deleteEnemy(view);
        }

        this.needTotallyRefresh.delete(view);
        this.dirtyEnemy.delete(view);
        this.requestedCommonContext.delete(view);

        this.computedToView.delete(view.getComputingEnemy());
        this.enemyViewMap.delete(index);
        this.enemyMap.delete(index);
        this.locatorViewMap.delete(view);
        this.locatorEnemyMap.delete(enemy);
    }

    setEnemyAt(locator: ITileLocator, enemy: IEnemy<TAttr>): void {
        const index = this.indexer.locToIndex(locator.x, locator.y);
        this.deleteEnemyAt(index);

        const view = new EnemyView<TAttr>(enemy, this);
        this.enemyMap.set(index, enemy);
        this.enemyViewMap.set(index, view);
        this.locatorEnemyMap.set(enemy, index);
        this.locatorViewMap.set(view, index);
        this.computedToView.set(view.getComputingEnemy(), view);

        if (this.mapDamage) {
            this.mapDamage.markEnemyDirty(view);
        }
        if (this.damageSystem) {
            this.damageSystem.markDirty(view);
        }

        this.needUpdate = true;
    }

    deleteEnemy(locator: ITileLocator): void {
        const index = this.indexer.locToIndex(locator.x, locator.y);
        this.deleteEnemyAt(index);
    }

    /**
     * 在指定范围内筛选出当前上下文中的怪物视图
     * @param range 范围对象
     * @param param 范围参数
     */
    private *internalScanRange<T>(
        range: IRange<T>,
        param: T
    ): Iterable<[ITileLocator, EnemyView<TAttr>]> {
        range.bindHost(this);
        const keys = new Set(this.enemyViewMap.keys());
        const matched = range.autoDetect(keys, param);
        const viewMap = this.enemyViewMap;
        for (const index of matched) {
            const view = viewMap.get(index);
            if (view) {
                const locator = this.indexer.indexToLocator(index);
                yield [locator, view];
            }
        }
    }

    scanRange<T>(
        range: IRange<T>,
        param: T
    ): Iterable<[ITileLocator, IEnemyView<TAttr>]> {
        return this.internalScanRange(range, param);
    }

    *iterateEnemy(): Iterable<[ITileLocator, IEnemyView<TAttr>]> {
        for (const [index, view] of this.enemyViewMap) {
            const locator = this.indexer.indexToLocator(index);
            yield [locator, view];
        }
    }

    addAura(aura: IAuraView<TAttr>): void {
        this.globalAuraList.add(aura);
        this.needUpdate = true;
    }

    deleteAura(aura: IAuraView<TAttr>): void {
        this.globalAuraList.delete(aura);
        this.needUpdate = true;
    }

    attachMapDamage(damage: IMapDamage<TAttr, THero> | null): void {
        this.mapDamage = damage;
        if (damage) {
            damage.refreshAll();
        }
    }

    getMapDamage(): IMapDamage<TAttr, THero> | null {
        return this.mapDamage;
    }

    attachDamageSystem(system: IDamageSystem<TAttr, unknown> | null): void {
        this.damageSystem = system;
        if (system) {
            system.bindHeroStatus(this.bindedHero);
        }
    }

    getDamageSystem(): IDamageSystem<TAttr, THero> | null {
        return this.damageSystem;
    }

    /**
     * 将怪物身上的特殊属性尝试转换为光环视图
     * @param special 特殊属性
     * @param enemy 怪物对象
     * @param locator 怪物位置
     */
    private convertSpecial(
        special: ISpecial<any>,
        handler: IReadonlyEnemyHandler<TAttr, THero>
    ): IEnemyAuraView<TAttr, any, any> | null {
        let matched: IAuraConverter<TAttr, THero> | null = null;
        for (const converter of this.auraConverter) {
            if (!this.converterStatus.get(converter)) continue;
            if (converter.shouldConvert(special, handler)) {
                if (matched) {
                    logger.warn(97, special.code.toString());
                    return null;
                }
                matched = converter;
            }
        }

        if (!matched) return null;
        return matched.convert(special, handler, this);
    }

    /**
     * 将光环按优先级插入到有序表中
     * @param aura 光环视图
     */
    private insertIntoSortedAura(aura: IAuraView<TAttr>): void {
        const set = this.sortedAura.getOrInsertComputed(
            aura.priority,
            () => new Set()
        );
        set.add(aura);
    }

    /**
     * 从优先级表中移除一个光环
     * @param aura 光环视图
     */
    private removeFromSortedAura(aura: IAuraView<TAttr>): void {
        const set = this.sortedAura.get(aura.priority);
        if (set) {
            set.delete(aura);
            if (set.size === 0) {
                this.sortedAura.delete(aura.priority);
            }
        }
    }

    /**
     * 执行特殊属性修饰器，并返回因此受到影响的光环集合
     * @param modifier 特殊属性修饰器
     * @param enemy 目标怪物
     * @param locator 怪物位置
     * @param currentPriority 当前处理的优先级
     */
    private processSpecialModifier(
        modifier: IEnemySpecialModifier<TAttr>,
        handler: IEnemyHandler<TAttr, THero>,
        currentPriority: number
    ): Set<IAuraView<TAttr>> {
        const enemy = handler.enemy;
        const affectedAuras = new Set<IAuraView<TAttr>>();
        const toAdd = modifier.add(handler);
        const toDelete = modifier.delete(handler);

        if (toAdd.length > 0 && toDelete.length > 0) {
            logger.warn(100);
            return affectedAuras;
        }

        for (const adding of toAdd) {
            const aura = this.convertSpecial(adding, handler);
            if (aura) {
                // 新生成的光环只能影响之后的阶段，不能反过来影响当前优先级链
                if (import.meta.env.DEV && aura.priority > currentPriority) {
                    logger.warn(
                        99,
                        aura.priority.toString(),
                        currentPriority.toString()
                    );
                    continue;
                }
                this.convertedAura.set(adding, aura);
                this.insertIntoSortedAura(aura);
                affectedAuras.add(aura);
            }
            enemy.addSpecial(adding);
        }

        for (const deleting of toDelete) {
            enemy.deleteSpecial(deleting);
            const aura = this.convertedAura.get(deleting);
            if (aura) {
                // 当前阶段不允许删除同优先级或更高优先级的已生效光环。
                if (import.meta.env.DEV && aura.priority >= currentPriority) {
                    logger.warn(
                        98,
                        aura.priority.toString(),
                        currentPriority.toString()
                    );
                    continue;
                }
                this.removeFromSortedAura(aura);
                this.convertedAura.delete(deleting);
                affectedAuras.add(aura);
            }
        }

        for (const special of enemy.iterateSpecials()) {
            const success = modifier.modify(handler, special);
            if (!success) continue;
            const aura = this.convertedAura.get(special);
            if (!aura) continue;
            affectedAuras.add(aura);

            if (import.meta.env.DEV && aura.priority >= currentPriority) {
                logger.warn(
                    98,
                    aura.priority.toString(),
                    currentPriority.toString()
                );
            }
        }

        return affectedAuras;
    }

    /**
     * 执行单个特殊查询效果
     * @param effect 特殊查询效果
     * @param currentPriority 当前处理的优先级
     */
    private processSpecialQuery(
        effect: IEnemySpecialQueryEffect<TAttr, THero>,
        currentPriority: number
    ): void {
        const modifier = effect.for(this);

        for (const [index, view] of this.enemyViewMap) {
            const locator = this.indexer.indexToLocator(index);
            const enemy = view.getComputingEnemy();
            const handler = this.createHandler(enemy, locator);

            if (!modifier.shouldQuery(handler)) continue;

            const affectedAuras = this.processSpecialModifier(
                modifier,
                handler,
                currentPriority
            );

            if (affectedAuras.size > 0) {
                this.needTotallyRefresh.add(view);
            } else {
                this.requestedCommonContext.add(view);
            }
        }
    }

    /**
     * 执行光环带来的特殊属性修饰效果
     * @param aura 光环视图
     * @param currentPriority 当前处理的优先级
     */
    private processAuraSpecial(
        aura: IAuraView<TAttr>,
        currentPriority: number
    ): void {
        const param = aura.getRangeParam();
        const iter = this.internalScanRange(aura.range, param);

        for (const [locator, enemyView] of iter) {
            const enemy = enemyView.getComputingEnemy();
            const base = enemyView.getBaseEnemy();
            const handler = this.createHandler(enemy, locator);
            const modifier = aura.applySpecial(handler, base);
            if (!modifier) continue;

            this.processSpecialModifier(modifier, handler, currentPriority);
            this.needTotallyRefresh.add(enemyView);
        }
    }

    /**
     * 构建所有由特殊属性衍生出的光环与特殊查询结果
     */
    private buildupSpecials(): void {
        for (const aura of this.globalAuraList) {
            this.insertIntoSortedAura(aura);
        }

        for (const [index, view] of this.enemyViewMap) {
            const enemy = view.getComputingEnemy();
            const locator = this.indexer.indexToLocator(index);
            const handler = this.createHandler(enemy, locator);

            for (const special of enemy.iterateSpecials()) {
                const aura = this.convertSpecial(special, handler);
                if (!aura) continue;
                this.convertedAura.set(special, aura);
                this.insertIntoSortedAura(aura);
            }
        }

        const processedPriorities = new Set<number>();

        // 由于期间可能会产生新优先级的光环，所以要用 while (true) 而不是直接遍历
        while (true) {
            let maxPriority: number | null = null;
            for (const priority of this.sortedAura.keys()) {
                if (!processedPriorities.has(priority)) {
                    if (maxPriority === null || priority > maxPriority) {
                        maxPriority = priority;
                    }
                }
            }
            for (const priority of this.specialQueryEffects.keys()) {
                if (!processedPriorities.has(priority)) {
                    if (maxPriority === null || priority > maxPriority) {
                        maxPriority = priority;
                    }
                }
            }

            if (maxPriority === null) break;
            processedPriorities.add(maxPriority);

            const auras = this.sortedAura.get(maxPriority);
            if (auras) {
                for (const aura of auras) {
                    if (aura.couldApplySpecial) {
                        this.processAuraSpecial(aura, maxPriority);
                    }
                }
            }

            const effects = this.specialQueryEffects.get(maxPriority);
            if (effects) {
                for (const effect of effects) {
                    this.processSpecialQuery(effect, maxPriority);
                }
            }
        }
    }

    /**
     * 按优先级执行所有基础属性光环效果
     */
    private buildupBase(): void {
        const priorities = [...this.sortedAura.keys()].sort((a, b) => b - a);
        for (const p of priorities) {
            const auras = this.sortedAura.get(p);
            if (!auras) continue;
            for (const aura of auras) {
                const param = aura.getRangeParam();
                const iter = this.internalScanRange(aura.range, param);
                for (const [locator, view] of iter) {
                    const enemy = view.getComputingEnemy();
                    const base = view.getBaseEnemy();
                    const handler = this.createHandler(enemy, locator);
                    aura.apply(handler, base);
                }
            }
        }
    }

    /**
     * 执行常规查询效果，并记录哪些怪物查询了上下文
     */
    private buildupQuery(): void {
        for (const [index, view] of this.enemyViewMap) {
            const enemy = view.getComputingEnemy();
            const locator = this.indexer.indexToLocator(index);
            const handler = this.createHandler(enemy, locator);
            let queried = false;
            const query = () => {
                queried = true;
                return this;
            };
            for (const special of enemy.iterateSpecials()) {
                const effects = this.commonQueryMap.get(special.code);
                if (!effects) continue;
                for (const effect of effects) {
                    effect.apply(handler, special, query);
                }
            }
            if (queried) {
                this.requestedCommonContext.add(view);
            }
        }
    }

    /**
     * 执行最终效果阶段
     */
    private buildupFinal(): void {
        for (const [index, view] of this.enemyViewMap) {
            const enemy = view.getComputingEnemy();
            const locator = this.indexer.indexToLocator(index);
            const handler = this.createHandler(enemy, locator);
            for (const effect of this.finalEffects) {
                effect.apply(handler);
            }
        }
    }

    buildup(): void {
        if (!this.needUpdate) return;
        if (!this.bindedHero) {
            logger.warn(110);
            return;
        }
        this.needUpdate = false;
        this.sortedAura.clear();
        this.convertedAura.clear();
        this.dirtyEnemy.clear();
        this.needTotallyRefresh.clear();
        this.requestedCommonContext.clear();
        const hasAura = this.auraConverter.size > 0;
        const hasSpecialQuery = this.specialQueryEffects.size > 0;
        if (hasAura || hasSpecialQuery) {
            this.buildupSpecials();
            this.buildupBase();
        }
        if (this.commonQueryMap.size > 0) {
            this.buildupQuery();
        }
        if (this.finalEffects.length > 0) {
            this.buildupFinal();
        }

        if (this.damageSystem) {
            this.damageSystem.markAllDirty();
        }

        if (this.mapDamage) {
            this.mapDamage.refreshAll();
        }
    }

    markDirty(view: IEnemyView<TAttr>): void {
        if (!this.locatorViewMap.has(view)) return;
        this.dirtyEnemy.add(view);
        if (this.damageSystem) {
            this.damageSystem.markDirty(view);
        }
    }

    /**
     * 在局部刷新期间执行特殊属性修饰器，但不重建光环拓扑
     * @param modifier 特殊属性修饰器
     * @param enemy 目标怪物
     * @param locator 怪物位置
     */
    private refreshSpecialModifier(
        modifier: IEnemySpecialModifier<TAttr>,
        handler: IEnemyHandler<TAttr, THero>
    ): void {
        const enemy = handler.enemy;
        const toAdd = modifier.add(handler);
        const toDelete = modifier.delete(handler);

        if (toAdd.length > 0 && toDelete.length > 0) {
            logger.warn(100);
            return;
        }

        for (const adding of toAdd) {
            enemy.addSpecial(adding);
            if (import.meta.env.DEV) {
                const aura = this.convertSpecial(adding, handler);
                if (aura) {
                    logger.warn(101, adding.code.toString());
                }
            }
        }

        for (const deleting of toDelete) {
            enemy.deleteSpecial(deleting);
            if (import.meta.env.DEV) {
                const aura = this.convertSpecial(deleting, handler);
                if (aura) {
                    logger.warn(101, deleting.code.toString());
                }
            }
        }

        for (const special of enemy.iterateSpecials()) {
            const success = modifier.modify(handler, special);
            if (import.meta.env.DEV && success) {
                const aura = this.convertedAura.get(special);
                if (aura) {
                    logger.warn(101, special.code.toString());
                }
            }
        }
    }

    /**
     * 刷新单个怪物视图的计算结果
     * @param view 怪物视图
     */
    private refreshEnemy(view: EnemyView<TAttr>): void {
        const locator = this.getEnemyLocatorByView(view);
        if (!locator) return;

        view.reset();
        const enemy = view.getComputingEnemy();
        const base = view.getBaseEnemy();
        const handler = this.createHandler(enemy, locator);

        const specialPriorities = new Set<number>();
        for (const priority of this.sortedAura.keys()) {
            specialPriorities.add(priority);
        }
        for (const priority of this.specialQueryEffects.keys()) {
            specialPriorities.add(priority);
        }

        const orderedSpecialPriorities = [...specialPriorities].sort(
            (a, b) => b - a
        );

        for (const priority of orderedSpecialPriorities) {
            const auras = this.sortedAura.get(priority);
            const effects = this.specialQueryEffects.get(priority);

            if (auras) {
                for (const aura of auras) {
                    if (!aura.couldApplySpecial) continue;
                    const param = aura.getRangeParam();
                    aura.range.bindHost(this);
                    // 局部刷新只重新判断“这个怪物是否被该光环命中”
                    if (!aura.range.inRange(locator.x, locator.y, param)) {
                        continue;
                    }
                    const modifier = aura.applySpecial(handler, base);
                    if (!modifier) continue;
                    this.refreshSpecialModifier(modifier, handler);
                }
            }

            if (effects) {
                for (const effect of effects) {
                    const modifier = effect.for(this);
                    if (!modifier.shouldQuery(handler)) continue;
                    this.refreshSpecialModifier(modifier, handler);
                }
            }
        }

        const basePriorities = [...this.sortedAura.keys()].sort(
            (a, b) => b - a
        );
        for (const priority of basePriorities) {
            const auras = this.sortedAura.get(priority);
            if (!auras) continue;
            for (const aura of auras) {
                const param = aura.getRangeParam();
                aura.range.bindHost(this);
                if (!aura.range.inRange(locator.x, locator.y, param)) continue;
                aura.apply(handler, base);
            }
        }

        this.requestedCommonContext.delete(view);
        let queried = false;
        const query = () => {
            queried = true;
            return this;
        };
        for (const special of enemy.iterateSpecials()) {
            const effects = this.commonQueryMap.get(special.code);
            if (!effects) continue;
            for (const effect of effects) {
                effect.apply(handler, special, query);
            }
        }
        if (queried) {
            this.requestedCommonContext.add(view);
        }

        for (const effect of this.finalEffects) {
            effect.apply(handler);
        }

        this.dirtyEnemy.delete(view);

        if (this.damageSystem) {
            this.damageSystem.markDirty(view);
        }

        if (this.mapDamage) {
            this.mapDamage.markEnemyDirty(view);
        }
    }

    requestRefresh(view: IEnemyView<TAttr>): void {
        if (!this.dirtyEnemy.has(view)) return;
        if (this.needTotallyRefresh.has(view)) {
            this.needUpdate = true;
        }
        if (this.needUpdate) {
            this.buildup();
            return;
        }

        this.refreshEnemy(view as EnemyView<TAttr>);

        for (const requestedView of this.requestedCommonContext) {
            if (requestedView === view) continue;
            this.refreshEnemy(requestedView as EnemyView<TAttr>);
        }
    }

    clear(): void {
        this.enemyViewMap.clear();
        this.enemyMap.clear();
        this.locatorViewMap.clear();
        this.locatorEnemyMap.clear();
        this.computedToView.clear();
        this.globalAuraList.clear();
        this.sortedAura.clear();
        this.needTotallyRefresh.clear();
        this.requestedCommonContext.clear();
        this.dirtyEnemy.clear();
        if (this.damageSystem) {
            this.damageSystem.markAllDirty();
        }
        if (this.mapDamage) {
            this.mapDamage.refreshAll();
        }
    }

    destroy(): void {
        this.clear();
        this.attachMapDamage(null);
        this.attachDamageSystem(null);
        this.auraConverter.clear();
        this.commonQueryMap.clear();
        this.specialQueryEffects.clear();
        this.finalEffects.length = 0;
        this.bindedHero = null;
    }
}
