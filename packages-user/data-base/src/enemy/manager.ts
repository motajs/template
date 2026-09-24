import { logger } from '@motajs/common';
import {
    IEnemy,
    IEnemyComparer,
    IEnemyManager,
    IEnemyManagerSaveState,
    IReadonlyEnemy,
    SpecialCreation,
    IEnemySaveState
} from './types';
import { ITileStore, SaveCompression } from '@user/data-common';
import { isNil } from 'lodash-es';

export class EnemyManager<TEnemy> implements IEnemyManager<TEnemy> {
    /** 特殊属性注册表，code -> 创建函数 */
    private readonly specialRegistry: Map<
        number,
        SpecialCreation<any, TEnemy>
    > = new Map();
    /** 自定义怪物属性注册表，name -> 默认值 */
    private readonly attributeRegistry: Map<keyof TEnemy, any> = new Map();
    /** 怪物模板表，code -> IEnemy */
    private readonly prefabByCode: Map<number, IEnemy<TEnemy>> = new Map();
    /** 复用映射，reusedCode -> sourceCode */
    private readonly reuseByCode: Map<number, number> = new Map();
    /** 脏模板集合，存储发生了变化的模板 code */
    private readonly dirtySet: Set<number> = new Set();
    /** 参考快照，code -> IReadonlyEnemy，由 compareWith 提供 */
    private referenceByCode: Map<number, IReadonlyEnemy<TEnemy>> = new Map();
    /** 当前附加的怪物比较器 */
    private comparer: IEnemyComparer<TEnemy> | null = null;
    /** 是否已首次调用 compareWith */
    private hasReference: boolean = false;

    constructor(private readonly tileStore: ITileStore) {}

    registerSpecial(code: number, cons: SpecialCreation<any, TEnemy>): void {
        this.specialRegistry.set(code, cons);
    }

    setAttributeDefaults<K extends keyof TEnemy>(
        name: K,
        defaultValue: TEnemy[K]
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

    /**
     * 根据怪物的图块数字或 id 获取其模板
     * @param token 怪物的图块数字或 id
     * @returns
     */
    private internalGetPrefab(token: number | string) {
        const num = this.tileStore.num(token);
        if (isNil(num)) return null;
        const sourceCode = this.reuseByCode.get(num) ?? num;
        return this.prefabByCode.get(sourceCode) ?? null;
    }

    createEnemy(code: number): IEnemy<TEnemy> | null {
        const prefab = this.internalGetPrefab(code);
        if (!prefab) return null;
        return prefab.clone();
    }

    addPrefab(enemy: IEnemy<TEnemy>): void {
        if (this.prefabByCode.has(enemy.code)) {
            return;
        }
        const cloned = enemy.clone();
        this.prefabByCode.set(enemy.code, cloned);
        this.updateDirty(cloned.code, cloned);
    }

    getPrefab(token: number | string): IReadonlyEnemy<TEnemy> | null {
        return this.internalGetPrefab(token);
    }

    deletePrefab(token: number | string): void {
        const prefab = this.internalGetPrefab(token);
        if (!prefab) return;
        this.prefabByCode.delete(prefab.code);
    }

    changePrefab(token: number | string, enemy: IEnemy<TEnemy>): void {
        // 先删除旧的模板（如果存在）
        this.deletePrefab(token);
        // 再添加新的模板
        this.prefabByCode.set(enemy.code, enemy);
        this.updateDirty(enemy.code, enemy);
    }

    reusePrefab(source: number | string, reuse: number | string): void {
        const prefab = this.internalGetPrefab(source);
        if (!prefab) return;
        const num = this.tileStore.num(reuse);
        if (isNil(num)) return;
        this.reuseByCode.set(num, prefab.code);
    }

    compareWith(reference: ReadonlyMap<number, IReadonlyEnemy<TEnemy>>): void {
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
        modify: (prefab: IEnemy<TEnemy>) => IEnemy<TEnemy>
    ): void {
        const prefab = this.internalGetPrefab(code);
        if (!prefab) return;
        const result = modify(prefab);
        const prefabCode = prefab.code;
        if (result !== prefab) {
            this.prefabByCode.set(result.code, result);
            if (result.code !== prefabCode) {
                this.prefabByCode.delete(prefabCode);
            }
        }
        this.updateDirty(result.code, result);
    }

    attachEnemyComparer(comparer: IEnemyComparer<TEnemy>): void {
        this.comparer = comparer;
    }

    getEnemyComparer(): IEnemyComparer<TEnemy> | null {
        return this.comparer;
    }

    saveState(compression: SaveCompression): IEnemyManagerSaveState<TEnemy> {
        const modified: Map<number, IEnemySaveState<TEnemy>> = new Map();
        for (const code of this.dirtySet) {
            const prefab = this.prefabByCode.get(code);
            if (!prefab) continue;
            modified.set(code, prefab.saveState(compression));
        }
        return { modified };
    }

    loadState(
        state: IEnemyManagerSaveState<TEnemy>,
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
    private updateDirty(code: number, current: IEnemy<TEnemy>): void {
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
