import { logger } from '@motajs/common';
import { Enemy as EnemyImpl } from './enemy';
import {
    IEnemy,
    IEnemyManager,
    IEnemyLegacyBridge,
    SpecialCreation
} from './types';

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
            return this.prefabByCode.get(code) ?? null;
        } else {
            return this.prefabById.get(code) ?? null;
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
    }

    addPrefabFromLegacy(code: number, enemy: Enemy): void {
        if (this.prefabByCode.has(code) || this.prefabById.has(enemy.id)) {
            return;
        }
        const prefab = this.convertLegacyEnemy(code, enemy);
        this.prefabByCode.set(code, prefab);
        this.prefabById.set(prefab.id, prefab);
        this.legacyIdToCode.set(enemy.id, code);
    }

    getPrefab(code: number): IEnemy<TAttr> | null {
        return this.prefabByCode.get(code) ?? null;
    }

    getPrefabById(id: string): IEnemy<TAttr> | null {
        return this.prefabById.get(id) ?? null;
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
    }

    reusePrefab(source: number | string, code: number, id: string): void {
        const prefab = this.internalGetPrefab(source);
        if (!prefab) return;
        this.prefabByCode.set(code, prefab);
        this.prefabById.set(id, prefab);
    }
}
