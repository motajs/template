import { logger } from '@motajs/common';
import { Enemy as EnemyImpl } from './enemy';
import {
    IEnemy,
    IEnemyAttributes,
    IEnemyManager,
    ISpecial,
    SpecialCreation
} from './types';

export class EnemyManager implements IEnemyManager {
    /** 特殊属性注册表，code -> 创建函数 */
    private readonly specialRegistry: Map<number, SpecialCreation<any>> =
        new Map();
    /** 自定义怪物属性注册表，name -> 默认值 */
    private readonly attributeRegistry: Map<string, any> = new Map();
    /** 怪物模板表，code -> IEnemy */
    private readonly prefabByCode: Map<number, IEnemy> = new Map();
    /** 怪物模板表，id -> IEnemy */
    private readonly prefabById: Map<string, IEnemy> = new Map();
    /** 旧样板怪物 id 到 code 的映射，用于 fromLegacyEnemy 快速查找已有模板 */
    private readonly legacyIdToCode: Map<string, number> = new Map();

    registerSpecial(
        code: number,
        cons: (enemy: IEnemy) => ISpecial<any>
    ): void {
        this.specialRegistry.set(code, cons);
    }

    registerAttribute(name: string, defaultValue: any): void {
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

    fromLegacyEnemy(enemy: Enemy): IEnemy {
        // 如果该旧样板怪物已经通过 addPrefabFromLegacy 注册为模板，直接克隆模板
        const existingCode = this.legacyIdToCode.get(enemy.id);
        if (existingCode) {
            const prefab = this.prefabByCode.get(existingCode);
            if (prefab) {
                return prefab.clone();
            }
        }

        return this.convertLegacyEnemy(0, enemy);
    }

    /**
     * 真正执行旧样板怪物到新怪物对象的转换
     * @param code 怪物图块数字
     * @param enemy 旧样板怪物对象
     */
    private convertLegacyEnemy(code: number, enemy: Enemy): IEnemy {
        const attrs: IEnemyAttributes = {
            hp: enemy.hp,
            atk: enemy.atk,
            def: enemy.def,
            money: enemy.money,
            exp: enemy.exp,
            point: enemy.point
        };
        const result = new EnemyImpl(enemy.id, code, structuredClone(attrs));

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

    createEnemy(code: number): IEnemy | null {
        const prefab = this.prefabByCode.get(code);
        if (!prefab) return null;
        return prefab.clone();
    }

    createEnemyById(id: string): IEnemy | null {
        const prefab = this.prefabById.get(id);
        if (!prefab) return null;
        return prefab.clone();
    }

    addPrefab(enemy: IEnemy): void {
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

    getPrefab(code: number): IEnemy | null {
        return this.prefabByCode.get(code) ?? null;
    }

    getPrefabById(id: string): IEnemy | null {
        return this.prefabById.get(id) ?? null;
    }

    deletePrefab(code: number | string): void {
        const prefab =
            typeof code === 'number'
                ? this.prefabByCode.get(code)
                : this.prefabById.get(code);
        if (!prefab) return;
        this.prefabByCode.delete(prefab.code);
        this.prefabById.delete(prefab.id);
    }

    changePrefab(code: number | string, enemy: IEnemy): void {
        // 先删除旧的模板（如果存在）
        this.deletePrefab(code);
        // 再添加新的模板
        this.prefabByCode.set(enemy.code, enemy);
        this.prefabById.set(enemy.id, enemy);
    }
}
