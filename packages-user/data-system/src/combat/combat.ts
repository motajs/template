import {
    Hookable,
    HookController,
    IHookController,
    ITileLocator,
    logger
} from '@motajs/common';
import {
    ICombatFlow,
    ICombatFlowHandler,
    ICombatFlowHook,
    ICombatScript,
    IDamageContext,
    IEnemyContext,
    IEnemyDamageInfo,
    IEnemyView,
    IReadonlyEnemyHandler
} from './types';
import {
    Enemy,
    IEnemy,
    IHeroAttribute,
    IReadonlyEnemy,
    IStateBase
} from '@user/data-base';

export class CombatFlow<TEnemy, THero>
    extends Hookable<ICombatFlowHook<TEnemy, THero>>
    implements ICombatFlow<TEnemy, THero>
{
    hero: IHeroAttribute<THero> | null = null;
    context: IEnemyContext<TEnemy, THero> | null = null;
    damage: IDamageContext<TEnemy, THero> | null = null;

    /** 战前战后脚本列表 */
    private readonly scriptList: ICombatScript<TEnemy, THero>[] = [];

    constructor(readonly state: IStateBase) {
        super();
    }

    //#region 对象控制

    protected createController(
        hook: Partial<ICombatFlowHook<TEnemy, THero>>
    ): IHookController<ICombatFlowHook<TEnemy, THero>> {
        return new HookController(this, hook);
    }

    bindHero(hero: IHeroAttribute<THero> | null): void {
        this.hero = hero;
    }

    bindContext(context: IEnemyContext<TEnemy, THero> | null): void {
        if (!context) {
            this.context = null;
        } else {
            // 传入对象的 state 必须与当前对象一致
            if (context.state === this.state) {
                this.context = context;
            } else {
                logger.warn(138, 'an enemy context object');
            }
        }
    }

    bindDamage(damage: IDamageContext<TEnemy, THero> | null): void {
        if (!damage) {
            this.damage = null;
        } else {
            // 传入对象的 state 必须与当前对象一致
            if (damage.state === this.state) {
                this.damage = damage;
            } else {
                logger.warn(138, 'a damage context object');
            }
        }
    }

    private createHandler(
        enemy: IEnemy<TEnemy>,
        locator: ITileLocator | null
    ): ICombatFlowHandler<TEnemy, THero> {
        return {
            onMap: locator !== null,
            hero: this.hero!,
            enemy,
            context: this.context!,
            locator: locator ?? { x: -1, y: -1 },
            state: this.state
        };
    }

    private createEnemyHandler(
        enemy: IReadonlyEnemy<TEnemy>,
        locator: ITileLocator | null
    ): IReadonlyEnemyHandler<TEnemy, THero> {
        return {
            enemy,
            context: this.context!,
            locator: locator ?? { x: -1, y: -1 },
            hero: this.hero!,
            state: this.state
        };
    }

    addCombatScript(script: ICombatScript<TEnemy, THero>): void {
        if (this.scriptList.some(v => v.priority === script.priority)) {
            logger.warn(140);
            return;
        }
        this.scriptList.push(script);
        this.scriptList.sort((a, b) => b.priority - a.priority);
    }

    //#endregion

    //#region 战斗流程

    /**
     * 尝试根据怪物信息从怪物上下文中查找坐标
     * @param view 怪物视图
     * @param computed 计算后怪物
     * @param origin 可修改的原始怪物对象
     */
    private tryGetEnemyLocator(
        view: IEnemyView<TEnemy> | null,
        computed: IReadonlyEnemy<TEnemy> | null,
        origin: IEnemy<TEnemy> | null
    ): ITileLocator | null {
        if (!this.context) return null;
        // 尝试视图
        if (view) {
            const locator = this.context.getEnemyLocatorByView(view);
            if (locator) return locator;
        }
        // 尝试计算后怪物
        if (computed) {
            const view = this.context.getViewByComputed(computed);
            if (view) {
                const locator = this.context.getEnemyLocatorByView(view);
                if (locator) return locator;
            }
        }
        // 尝试原始怪物
        if (origin) {
            const locator = this.context.getEnemyLocator(origin);
            if (locator) return locator;
            // 传入的原始怪物可能是计算后怪物，所以也判断一下
            const view = this.context.getViewByComputed(origin);
            if (view) {
                const locator = this.context.getEnemyLocatorByView(view);
                if (locator) return locator;
            }
        }
        return null;
    }

    /**
     * 执行战斗流程
     * @param handler 战斗流程信息对象
     * @param eHandler 怪物信息对象
     */
    private async combatFlow(
        handler: ICombatFlowHandler<TEnemy, THero>,
        eHandler: IReadonlyEnemyHandler<TEnemy, THero>
    ): Promise<IEnemyDamageInfo<TEnemy, THero> | null> {
        if (!this.damage) {
            logger.warn(139, 'a damage context object');
            return null;
        }
        const damage = this.damage.getDamageInfoByHandler(eHandler);
        if (!damage) {
            logger.warn(141);
            return null;
        }

        for (const script of this.scriptList) {
            await script.before(damage, handler);
        }
        await Promise.all(
            this.forEachHook(hook => hook.onBeforeCombat?.(damage))
        );
        for (const script of this.scriptList) {
            await script.after(damage, handler);
        }
        await Promise.all(
            this.forEachHook(hook => hook.onAfterCombat?.(damage))
        );

        return damage;
    }

    battle(
        enemy: IEnemyView<TEnemy>
    ): Promise<IEnemyDamageInfo<TEnemy, THero> | null> {
        if (!this.context) {
            logger.warn(139, 'an enemy context object');
            return Promise.resolve(null);
        }
        if (!this.hero) {
            logger.warn(139, 'a hero attribute object');
            return Promise.resolve(null);
        }

        const computed = enemy.getComputedEnemy();
        const origin = enemy.getModifiableEnemy();
        const locator = this.tryGetEnemyLocator(enemy, computed, origin);
        const handler = this.createHandler(origin, locator);
        const eHandler = this.createEnemyHandler(computed, locator);

        return this.combatFlow(handler, eHandler);
    }

    battleComputed(
        enemy: IReadonlyEnemy<TEnemy>
    ): Promise<IEnemyDamageInfo<TEnemy, THero> | null> {
        if (!this.context) {
            logger.warn(139, 'an enemy context object');
            return Promise.resolve(null);
        }
        if (!this.hero) {
            logger.warn(139, 'a hero attribute object');
            return Promise.resolve(null);
        }

        const view = this.context.getViewByComputed(enemy);
        // 如果能查询到怪物视图，直接走 battle 流程
        if (view) return this.battle(view);
        else {
            // 否则走单独的流程
            const locator = { x: -1, y: -1 };
            const attr = enemy.cloneAttributes();
            const writableEnemy = new Enemy(enemy.id, enemy.code, attr);
            const handler = this.createHandler(writableEnemy, locator);
            const eHandler = this.createEnemyHandler(enemy, locator);
            return this.combatFlow(handler, eHandler);
        }
    }

    //#endregion
}
