import { logger } from '@motajs/common';
import { Enemy as EnemyImpl } from './enemy';
import {
    IEnemy,
    IEnemyComparer,
    IEnemyManager,
    IEnemyManagerSaveState,
    IEnemyLegacyBridge,
    IReadonlyEnemy,
    SpecialCreation,
    IEnemySaveState
} from './types';
import { SaveCompression } from '../common/types';

export class EnemyManager<TAttr> implements IEnemyManager<TAttr> {
    /** 特殊属性注册表，code -> 创建函数 */
    private readonly specialRegistry: Map<number, SpecialCreation<any, TAttr>> =
        new Map();
    /** 自定义怪物属性注册表，name -> 默认值 */
    private readonly attributeRegistry: Map<keyof TAttr, any> = new Map();
    /** 怪物模板表，code -> IEnemy */
    private readonly prefabByCode: Map<number, IEnemy<TAttr>> = new Map();
    /** 怪物模板表，id -> IEnemy */
    private readonly prefabById: Map<string, IEnemy<TAttr>> = new Map();
    /** 旧样板怪物 id 到 code 的映射，用于 fromLegacyEnemy 快速查找已有模板 */
    private readonly legacyIdToCode: Map<string, number> = new Map();
    /** 复用映射，reusedCode -> sourceCode */
    private readonly reuseByCode: Map<number, number> = new Map();
    /** 复用映射，reusedId -> sourceId */
    private readonly reuseById: Map<string, string> = new Map();
    /** 脏模板集合，存储发生了变化的模板 code */
    private readonly dirtySet: Set<number> = new Set();
    /** 参考快照，code -> IReadonlyEnemy，由 compareWith 提供 */
    private referenceByCode: Map<number, IReadonlyEnemy<TAttr>> = new Map();
    /** 当前附加的怪物比较器 */
    private comparer: IEnemyComparer<TAttr> | null = null;
    /** 是否已首次调用 compareWith */
    private hasReference: boolean = false;

    constructor(readonly bridge: IEnemyLegacyBridge<TAttr>) {}

    registerSpecial(code: number, cons: SpecialCreation<any, TAttr>): void {
        this.specialRegistry.set(code, cons);
    }

    setAttributeDefaults<K extends keyof TAttr>(
        name: K,
        defaultValue: TAttr[K]
    ): void {
        if (
            typeof defaultValue === 'function' ||
            typeof defaultValue === 'symbol' ||
            typeof defaultValue === 'bigint' ||
            typeof defaultValue === 'undefined'
        ) {
            logger.error(53);
            return;
        }
        this.attributeRegistry.set(name, defaultValue);
    }

    fromLegacyEnemy(code: number, enemy: Enemy): IEnemy<TAttr> {
        // 如果该旧样板怪物已经通过 addPrefabFromLegacy 注册为模板，直接克隆模板
        const existingCode = this.legacyIdToCode.get(enemy.id);
        if (existingCode) {
            const prefab = this.prefabByCode.get(existingCode);
            if (prefab) {
                return prefab.clone();
            }
        }

        return this.convertLegacyEnemy(code, enemy);
    }

    /**
     * 根据旧样板怪物与注册过的默认属性构造属性对象
     * @param enemy 旧样板怪物对象
     */
    private createAttributes(enemy: Enemy): TAttr {
        const attrs: Partial<TAttr> = {};
        for (const [name, defaultValue] of this.attributeRegistry) {
            attrs[name] = structuredClone(defaultValue);
        }

        Object.assign(attrs, this.bridge.fromLegacyEnemy(enemy, attrs));

        return attrs as TAttr;
    }

    /**
     * 真正执行旧样板怪物到新怪物对象的转换
     * @param code 怪物图块数字
     * @param enemy 旧样板怪物对象
     */
    private convertLegacyEnemy(code: number, enemy: Enemy): IEnemy<TAttr> {
        const attrs = this.createAttributes(enemy);
        const result = new EnemyImpl<TAttr>(
            enemy.id,
            code,
            structuredClone(attrs)
        );

        // 转换特殊属性
        if (enemy.special) {
            for (const specialCode of enemy.special) {
                const creator = this.specialRegistry.get(specialCode);
                if (!creator) continue;
                const special = creator(result);
                special.fromLegacyEnemy(enemy);
                result.addSpecial(special);
            }
        }

        return result;
    }

    createEnemy(code: number): IEnemy<TAttr> | null {
        const prefab = this.prefabByCode.get(code);
        if (!prefab) return null;
        return prefab.clone();
    }

    createEnemyById(id: string): IEnemy<TAttr> | null {
        const prefab = this.prefabById.get(id);
        if (!prefab) return null;
        return prefab.clone();
    }

    private internalGetPrefab(code: number | string) {
        if (typeof code === 'number') {
            const sourceCode = this.reuseByCode.get(code) ?? code;
            return this.prefabByCode.get(sourceCode) ?? null;
        } else {
            const sourceId = this.reuseById.get(code) ?? code;
            return this.prefabById.get(sourceId) ?? null;
        }
    }

    addPrefab(enemy: IEnemy<TAttr>): void {
        if (
            this.prefabByCode.has(enemy.code) ||
            this.prefabById.has(enemy.id)
        ) {
            return;
        }
        const cloned = enemy.clone();
        this.prefabByCode.set(enemy.code, cloned);
        this.prefabById.set(enemy.id, cloned);
        this.updateDirty(cloned.code, cloned);
    }

    addPrefabFromLegacy(code: number, enemy: Enemy): void {
        if (this.prefabByCode.has(code) || this.prefabById.has(enemy.id)) {
            return;
        }
        const prefab = this.convertLegacyEnemy(code, enemy);
        this.prefabByCode.set(code, prefab);
        this.prefabById.set(prefab.id, prefab);
        this.legacyIdToCode.set(enemy.id, code);
        this.updateDirty(code, prefab);
    }

    getPrefab(code: number): IReadonlyEnemy<TAttr> | null {
        const sourceCode = this.reuseByCode.get(code) ?? code;
        return this.prefabByCode.get(sourceCode) ?? null;
    }

    getPrefabById(id: string): IReadonlyEnemy<TAttr> | null {
        const sourceId = this.reuseById.get(id) ?? id;
        return this.prefabById.get(sourceId) ?? null;
    }

    deletePrefab(code: number | string): void {
        const prefab = this.internalGetPrefab(code);
        if (!prefab) return;
        this.prefabByCode.delete(prefab.code);
        this.prefabById.delete(prefab.id);
    }

    changePrefab(code: number | string, enemy: IEnemy<TAttr>): void {
        // 先删除旧的模板（如果存在）
        this.deletePrefab(code);
        // 再添加新的模板
        this.prefabByCode.set(enemy.code, enemy);
        this.prefabById.set(enemy.id, enemy);
        this.updateDirty(enemy.code, enemy);
    }

    reusePrefab(source: number | string, code: number, id: string): void {
        const prefab = this.internalGetPrefab(source);
        if (!prefab) return;
        this.reuseByCode.set(code, prefab.code);
        this.reuseById.set(id, prefab.id);
    }

    compareWith(reference: ReadonlyMap<number, IReadonlyEnemy<TAttr>>): void {
        const isSubsequentCall = this.hasReference;
        if (isSubsequentCall) {
            logger.warn(117);
        }
        this.referenceByCode = new Map();
        reference.forEach((enemy, key) => {
            this.referenceByCode.set(key, enemy.clone());
        });
        this.hasReference = true;
        this.dirtySet.clear();
        if (isSubsequentCall) {
            this.refreshDirty(reference.keys());
        }
    }

    modifyPrefabAttribute(
        code: number | string,
        modify: (prefab: IEnemy<TAttr>) => IEnemy<TAttr>
    ): void {
        const prefab = this.internalGetPrefab(code);
        if (!prefab) return;
        const result = modify(prefab);
        const prefabCode = prefab.code;
        if (result !== prefab) {
            this.prefabByCode.set(result.code, result);
            this.prefabById.set(result.id, result);
            if (result.code !== prefabCode) {
                this.prefabByCode.delete(prefabCode);
            }
            if (result.id !== prefab.id) {
                this.prefabById.delete(prefab.id);
            }
        }
        this.updateDirty(result.code, result);
    }

    attachEnemyComparer(comparer: IEnemyComparer<TAttr>): void {
        this.comparer = comparer;
    }

    getEnemyComparer(): IEnemyComparer<TAttr> | null {
        return this.comparer;
    }

    saveState(compression: SaveCompression): IEnemyManagerSaveState<TAttr> {
        const modified: Map<number, IEnemySaveState<TAttr>> = new Map();
        for (const code of this.dirtySet) {
            const prefab = this.prefabByCode.get(code);
            if (!prefab) continue;
            modified.set(code, prefab.saveState(compression));
        }
        return { modified };
    }

    loadState(
        state: IEnemyManagerSaveState<TAttr>,
        compression: SaveCompression
    ): void {
        for (const [code, enemyState] of state.modified) {
            const prefab = this.prefabByCode.get(code);
            if (!prefab) {
                logger.warn(119, code.toString());
                continue;
            }
            prefab.loadState(enemyState, compression);
        }
        // loadState 结束后重新刷新 dirty 集合
        this.refreshDirty(state.modified.keys());
    }

    /**
     * 根据参考快照更新指定 code 的脏状态
     * @param code 怪物图块数字
     * @param current 当前模板对象
     */
    private updateDirty(code: number, current: IEnemy<TAttr>): void {
        if (!this.hasReference) return;
        if (!this.comparer) {
            logger.warn(118);
            this.dirtySet.add(code);
            return;
        }
        const ref = this.referenceByCode.get(code);
        if (!ref || !this.comparer.compare(current, ref)) {
            this.dirtySet.add(code);
        } else {
            this.dirtySet.delete(code);
        }
    }

    /**
     * 将所有模板加入脏集合，再与参考比较，去除未变化的模板
     */
    private refreshDirty(dirties: Iterable<number>): void {
        if (!this.hasReference) return;
        for (const code of dirties) {
            this.dirtySet.add(code);
        }
        if (!this.comparer) return;
        for (const code of [...this.dirtySet]) {
            const prefab = this.prefabByCode.get(code);
            if (!prefab) {
                this.dirtySet.delete(code);
                continue;
            }
            const ref = this.referenceByCode.get(code);
            if (ref && this.comparer.compare(prefab, ref)) {
                this.dirtySet.delete(code);
            }
        }
    }
}
