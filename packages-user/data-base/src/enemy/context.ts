import { IRange, logger } from '@motajs/common';
import { ITileLocator } from '@user/types';
import {
    IAuraConverter,
    IAuraView,
    IDamageSystem,
    IEnemy,
    IEnemyAuraView,
    IEnemyCommonQueryEffect,
    IEnemyContext,
    IEnemyFinalEffect,
    IEnemySpecialModifier,
    IEnemySpecialQueryEffect,
    IEnemyView,
    IMapDamage,
    IReadonlyEnemy,
    ISpecial
} from './types';
import { EnemyView } from './enemy';
import { MapLocIndexer } from './utils';

export class EnemyContext<TAttr> implements IEnemyContext<TAttr> {
    private readonly enemyViewMap: Map<number, EnemyView<TAttr>> = new Map();
    private readonly enemyMap: Map<number, IEnemy<TAttr>> = new Map();
    private readonly locatorViewMap: Map<IEnemyView<TAttr>, number> = new Map();
    private readonly locatorEnemyMap: Map<IEnemy<TAttr>, number> = new Map();
    private readonly computedToView: Map<
        IReadonlyEnemy<TAttr>,
        EnemyView<TAttr>
    > = new Map();

    private readonly auraConverter: Set<IAuraConverter<TAttr>> = new Set();
    private readonly converterStatus: Map<IAuraConverter<TAttr>, boolean> =
        new Map();
    private readonly convertedAura: Map<ISpecial<any>, IAuraView<TAttr>> =
        new Map();

    private readonly commonQueryMap: Map<
        number,
        IEnemyCommonQueryEffect<TAttr>[]
    > = new Map();

    private readonly specialQueryEffects: Map<
        number,
        IEnemySpecialQueryEffect<TAttr>[]
    > = new Map();

    private readonly finalEffects: IEnemyFinalEffect<TAttr>[] = [];
    private readonly globalAuraList: Set<IAuraView<TAttr>> = new Set();
    private readonly sortedAura: Map<number, Set<IAuraView<TAttr>>> = new Map();

    private readonly needTotallyRefresh: Set<IEnemyView<TAttr>> = new Set();
    private readonly requestedCommonContext: Set<IEnemyView<TAttr>> = new Set();
    private readonly dirtyEnemy: Set<IEnemyView<TAttr>> = new Set();

    private mapDamage: IMapDamage<TAttr> | null = null;
    private damageSystem: IDamageSystem<TAttr, unknown> | null = null;
    readonly indexer: MapLocIndexer = new MapLocIndexer();

    private needUpdate: boolean = true;

    built: boolean = false;
    width: number = 0;
    height: number = 0;

    resize(width: number, height: number): void {
        this.clear();
        this.width = width;
        this.height = height;
        this.indexer.setWidth(width);
    }

    registerAuraConverter(converter: IAuraConverter<TAttr>): void {
        this.auraConverter.add(converter);
        this.converterStatus.set(converter, true);
    }

    unregisterAuraConverter(converter: IAuraConverter<TAttr>): void {
        this.auraConverter.delete(converter);
        this.converterStatus.delete(converter);
    }

    setAuraConverterEnabled(
        converter: IAuraConverter<TAttr>,
        enabled: boolean
    ): void {
        if (!this.auraConverter.has(converter)) return;
        this.converterStatus.set(converter, enabled);
    }

    registerCommonQueryEffect(
        code: number,
        effect: IEnemyCommonQueryEffect<TAttr>
    ): void {
        const array = this.commonQueryMap.getOrInsert(code, []);
        array.push(effect);
        array.sort((a, b) => b.priority - a.priority);
    }

    unregisterCommonQueryEffect(
        code: number,
        effect: IEnemyCommonQueryEffect<TAttr>
    ): void {
        const array = this.commonQueryMap.get(code);
        if (!array) return;
        const index = array.indexOf(effect);
        if (index === -1) return;
        array.splice(index, 1);
    }

    registerSpecialQueryEffect(effect: IEnemySpecialQueryEffect<TAttr>): void {
        const list = this.specialQueryEffects.getOrInsert(effect.priority, []);
        list.push(effect);
    }

    unregisterSpecialQueryEffect(
        effect: IEnemySpecialQueryEffect<TAttr>
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
    }

    registerFinalEffect(effect: IEnemyFinalEffect<TAttr>): void {
        this.finalEffects.push(effect);
        this.finalEffects.sort((a, b) => b.priority - a.priority);
    }

    unregisterFinalEffect(effect: IEnemyFinalEffect<TAttr>): void {
        const index = this.finalEffects.indexOf(effect);
        if (index !== -1) {
            this.finalEffects.splice(index, 1);
        }
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

        this.needUpdate = true;
    }

    deleteEnemy(locator: ITileLocator): void {
        const index = this.indexer.locToIndex(locator.x, locator.y);
        this.deleteEnemyAt(index);
    }

    private *internalScanRange<T>(
        range: IRange<T>,
        param: T
    ): Iterable<EnemyView<TAttr>> {
        range.bindHost(this);
        const keys = new Set(this.enemyViewMap.keys());
        const matched = range.autoDetect(keys, param);
        const viewMap = this.enemyViewMap;
        for (const index of matched) {
            const view = viewMap.get(index);
            if (view) {
                yield view;
            }
        }
    }

    scanRange<T>(range: IRange<T>, param: T): Iterable<IEnemyView<TAttr>> {
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

    attachMapDamage(damage: IMapDamage<TAttr> | null): void {
        this.mapDamage = damage;
        if (damage) {
            damage.refreshAll();
        }
    }

    getMapDamage(): IMapDamage<TAttr> | null {
        return this.mapDamage;
    }

    attachDamageSystem(system: IDamageSystem<TAttr, unknown>): void {
        this.damageSystem = system;
        system.markAllDirty();
    }

    getDamageSystem<THero>(): IDamageSystem<TAttr, THero> | null {
        return this.damageSystem as IDamageSystem<TAttr, THero> | null;
    }

    private convertSpecial(
        special: ISpecial<any>,
        enemy: IReadonlyEnemy<TAttr>,
        locator: ITileLocator
    ): IEnemyAuraView<TAttr, any, any> | null {
        let matched: IAuraConverter<TAttr> | null = null;

        for (const converter of this.auraConverter) {
            if (!this.converterStatus.get(converter)) continue;
            if (converter.shouldConvert(special, enemy, locator)) {
                if (matched) {
                    logger.warn(97, special.code.toString());
                    return null;
                }
                matched = converter;
            }
        }

        if (!matched) return null;
        return matched.convert(special, enemy, locator, this);
    }

    private insertIntoSortedAura(aura: IAuraView<TAttr>): void {
        const set = this.sortedAura.getOrInsertComputed(
            aura.priority,
            () => new Set()
        );
        set.add(aura);
    }

    private removeFromSortedAura(aura: IAuraView<TAttr>): void {
        const set = this.sortedAura.get(aura.priority);
        if (set) {
            set.delete(aura);
            if (set.size === 0) {
                this.sortedAura.delete(aura.priority);
            }
        }
    }

    private processSpecialModifier(
        modifier: IEnemySpecialModifier<TAttr>,
        enemy: IEnemy<TAttr>,
        locator: ITileLocator,
        currentPriority: number
    ): Set<IAuraView<TAttr>> {
        const toAdd = modifier.add(enemy, locator);
        const toDelete = modifier.delete(enemy, locator);

        const affectedAuras = new Set<IAuraView<TAttr>>();

        if (toAdd.length > 0 && toDelete.length > 0) {
            logger.warn(100);
            return affectedAuras;
        }

        for (const adding of toAdd) {
            const aura = this.convertSpecial(adding, enemy, locator);
            if (aura) {
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
            const success = modifier.modify(enemy, special, locator);
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

    private processSpecialQuery(
        effect: IEnemySpecialQueryEffect<TAttr>,
        currentPriority: number
    ): void {
        const modifier = effect.for(this);

        for (const [index, view] of this.enemyViewMap) {
            const locator = this.indexer.indexToLocator(index);
            const enemy = view.getComputingEnemy();

            if (!modifier.shouldQuery(enemy, locator)) continue;

            const affectedAuras = this.processSpecialModifier(
                modifier,
                enemy,
                locator,
                currentPriority
            );

            if (affectedAuras.size > 0) {
                this.needTotallyRefresh.add(view);
            } else {
                this.requestedCommonContext.add(view);
            }
        }
    }

    private processAuraSpecial(
        aura: IAuraView<TAttr>,
        currentPriority: number
    ): void {
        const param = aura.getRangeParam();

        for (const enemyView of this.internalScanRange(aura.range, param)) {
            const locator = this.getEnemyLocatorByView(enemyView);
            if (!locator) continue;

            const enemy = enemyView.getComputingEnemy();
            const base = enemyView.getBaseEnemy();
            const modifier = aura.applySpecial(enemy, base, locator);

            if (!modifier) continue;

            this.processSpecialModifier(
                modifier,
                enemy,
                locator,
                currentPriority
            );

            this.needTotallyRefresh.add(enemyView);
        }
    }

    private buildupSpecials(): void {
        for (const aura of this.globalAuraList) {
            this.insertIntoSortedAura(aura);
        }

        for (const [index, view] of this.enemyViewMap) {
            const enemy = view.getComputingEnemy();
            const locator = this.indexer.indexToLocator(index);

            for (const special of enemy.iterateSpecials()) {
                const aura = this.convertSpecial(special, enemy, locator);
                if (!aura) continue;
                this.convertedAura.set(special, aura);
                this.insertIntoSortedAura(aura);
            }
        }

        const processedPriorities = new Set<number>();

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

    private buildupBase(): void {
        const priorities = [...this.sortedAura.keys()].sort((a, b) => b - a);
        for (const p of priorities) {
            const auras = this.sortedAura.get(p);
            if (!auras) continue;
            for (const aura of auras) {
                const param = aura.getRangeParam();
                for (const view of this.internalScanRange(aura.range, param)) {
                    const enemy = view.getComputingEnemy();
                    const base = view.getBaseEnemy();
                    const locator = this.getEnemyLocatorByView(view)!;
                    aura.apply(enemy, base, locator);
                }
            }
        }
    }

    private buildupQuery(): void {
        for (const [index, view] of this.enemyViewMap) {
            const enemy = view.getComputingEnemy();
            const locator = this.indexer.indexToLocator(index);
            let queried = false;
            const query = () => {
                queried = true;
                return this;
            };
            for (const special of enemy.iterateSpecials()) {
                const effects = this.commonQueryMap.get(special.code);
                if (!effects) continue;
                for (const effect of effects) {
                    effect.apply(enemy, special, query, locator);
                }
            }
            if (queried) {
                this.requestedCommonContext.add(view);
            }
        }
    }

    private buildupFinal(): void {
        for (const [index, view] of this.enemyViewMap) {
            const enemy = view.getComputingEnemy();
            const locator = this.indexer.indexToLocator(index);
            for (const effect of this.finalEffects) {
                effect.apply(enemy, locator);
            }
        }
    }

    buildup(): void {
        if (!this.needUpdate) return;
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

    private refreshSpecialModifier(
        modifier: IEnemySpecialModifier<TAttr>,
        enemy: IEnemy<TAttr>,
        locator: ITileLocator
    ): void {
        const toAdd = modifier.add(enemy, locator);
        const toDelete = modifier.delete(enemy, locator);

        if (toAdd.length > 0 && toDelete.length > 0) {
            logger.warn(100);
            return;
        }

        for (const adding of toAdd) {
            enemy.addSpecial(adding);
            if (import.meta.env.DEV) {
                const aura = this.convertSpecial(adding, enemy, locator);
                if (aura) {
                    logger.warn(101, adding.code.toString());
                }
            }
        }

        for (const deleting of toDelete) {
            enemy.deleteSpecial(deleting);
            if (import.meta.env.DEV) {
                const aura = this.convertSpecial(deleting, enemy, locator);
                if (aura) {
                    logger.warn(101, deleting.code.toString());
                }
            }
        }

        for (const special of enemy.iterateSpecials()) {
            const success = modifier.modify(enemy, special, locator);
            if (import.meta.env.DEV && success) {
                const aura = this.convertedAura.get(special);
                if (aura) {
                    logger.warn(101, special.code.toString());
                }
            }
        }
    }

    private refreshEnemy(view: EnemyView<TAttr>): void {
        const locator = this.getEnemyLocatorByView(view);
        if (!locator) return;

        view.reset();
        const enemy = view.getComputingEnemy();
        const base = view.getBaseEnemy();

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
            if (auras) {
                for (const aura of auras) {
                    if (!aura.couldApplySpecial) continue;
                    const param = aura.getRangeParam();
                    aura.range.bindHost(this);
                    const inRange = aura.range.inRange(
                        locator.x,
                        locator.y,
                        param
                    );
                    if (!inRange) continue;
                    const modifier = aura.applySpecial(enemy, base, locator);
                    if (!modifier) continue;
                    this.refreshSpecialModifier(modifier, enemy, locator);
                }
            }

            const effects = this.specialQueryEffects.get(priority);
            if (effects) {
                for (const effect of effects) {
                    const modifier = effect.for(this);
                    if (!modifier.shouldQuery(enemy, locator)) continue;
                    this.refreshSpecialModifier(modifier, enemy, locator);
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
                if (!aura.range.inRange(locator.x, locator.y, param)) {
                    continue;
                }
                aura.apply(enemy, base, locator);
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
                effect.apply(enemy, special, query, locator);
            }
        }
        if (queried) {
            this.requestedCommonContext.add(view);
        }

        for (const effect of this.finalEffects) {
            effect.apply(enemy, locator);
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
        this.damageSystem = null;
        this.auraConverter.clear();
        this.commonQueryMap.clear();
        this.specialQueryEffects.clear();
        this.finalEffects.length = 0;
    }
}
