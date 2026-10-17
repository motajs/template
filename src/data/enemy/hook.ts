import {
    IGameMap,
    IHeroLocation,
    IHeroLocationHooks,
    IHeroModifier,
    IHeroMover,
    PercentageModifier
} from '@user/data-base';
import {
    FaceGroup,
    IEnemyAttr,
    IHeroAttr,
    IObjectMover,
    IObjectMoverHooks,
    ObjectMoveStep,
    ObjectMoveType
} from '@user/data-common';
import { ICoreState } from '@user/data-state';
import {
    ICombatFlowHooks,
    IEnemyDamageInfo,
    IPathfindingResult,
    IPathfindingSystem,
    IPathfindingSystemHooks
} from '@user/data-system';
import { ICombatWeakHandler, MapDamageType } from './types';
import { isNil } from 'lodash-es';
import { ISpecial19Value } from './special';

const mapDamageTypeString: Record<number, string> = {
    [MapDamageType.Between]: '夹击',
    [MapDamageType.Layer]: '激光',
    [MapDamageType.Repulse]: '阻击',
    [MapDamageType.Zone]: '领域',
    [MapDamageType.Unknown]: '地图'
};

export class EnemyMoveHooks implements IObjectMoverHooks<IHeroLocation> {
    constructor(readonly state: ICoreState) {}

    /**
     * 处理中毒效果
     * @param step 移动步对象
     */
    private handlePoison(
        step: Readonly<ObjectMoveStep>,
        mover: IHeroMover<IHeroLocation>
    ) {
        const poison = this.state.flags.getFieldValueDefaults('poison', 0);
        // 中毒伤害小于等于 0，直接返回
        if (poison <= 0) return;
        const config = mover.getConfig();
        // 如果忽略地形，那么也不计算中毒伤害
        if (config.ignoreTerrain) return;

        // 获取勇士的可修改属性对象
        const hero = this.state.hero.getModifiableAttribute();

        // 判断是否为常规移动步
        if (
            step.type === ObjectMoveType.Dir ||
            step.type === ObjectMoveType.DirFace ||
            step.type === ObjectMoveType.Special
        ) {
            // 给勇士加上 -poison 的生命值，就相当于扣 poison 的生命值
            hero.add('hp', -poison);
        }
    }

    /**
     * 处理地图伤害
     * @param location 勇士位置对象
     */
    private async handleMapDamage(location: IHeroLocation) {
        if (isNil(location.floorId)) return;

        const context = this.state.enemyContext;
        const mapDamage = context.getMapDamage();
        if (!mapDamage) return;
        const damage = mapDamage.getReducedDamage(location);
        if (!damage) return;
        const hero = this.state.hero.getModifiableAttribute();
        // 首先掉血
        hero.add('hp', -damage.damage);
        this.state.emitTip(
            `玩家受到${mapDamageTypeString[damage.type]}伤害${damage.damage}点`
        );

        // 获取朝向处理工具，用于处理位移技能
        const handler = this.state.faceManager.get(FaceGroup.Dir8);
        if (!handler) return;
        // 获取当前地图事件层
        const map = this.state.maps.getMap(location.floorId);
        if (!map) return;
        const event = map.eventLayer;
        if (!event) return;

        const movings: Promise<unknown>[] = [];

        // 阻击效果
        for (const repulse of damage.extra.repulse) {
            const dx = location.x - repulse.x;
            const dy = location.y - repulse.y;
            const dir = handler.dirOf(-dx, -dy);
            const next = event.getTile(
                location.x + dx * 2,
                location.y + dy * 2
            );
            // 身后有东西就无法后退无法后退
            if (next) continue;
            movings.push(
                event.moveBlock(repulse.x, repulse.y, dir, 1, 200, true)
            );
        }

        // 捕捉效果
        for (const cat of damage.extra.catch) {
            const view = context.getEnemyByLocator(cat);
            if (!view) continue;
            const computed = view.getComputedEnemy();
            const dx = location.x - cat.x;
            const dy = location.y - cat.y;
            const dir = handler.dirOf(dx, dy);
            const moving = event
                .moveBlock(cat.x, cat.y, dir, 1, 200, true)
                .then(() => {
                    return this.state.combat.battleComputed(computed);
                });
            movings.push(moving);
        }

        await Promise.all(movings);
    }

    async onStepEnd(
        _code: number,
        step: Readonly<ObjectMoveStep>,
        tile: IHeroLocation,
        mover: IObjectMover<IHeroLocation>
    ): Promise<void> {
        // 检查状态对象
        if (tile.state !== this.state) return;
        // 检查移动器是否为勇士移动器
        if (mover !== this.state.hero.location.mover) return;

        // 处理中毒
        this.handlePoison(step, mover as IHeroMover<IHeroLocation>);

        await this.handleMapDamage(tile);
    }
}

export class EnemyPathfindingHooks implements IPathfindingSystemHooks {
    constructor(readonly state: ICoreState) {}

    /**
     * 处理中毒效果
     * @param path 自动寻路路径
     */
    private handlePoison(path: IPathfindingResult) {
        const poison = this.state.flags.getFieldValueDefaults('poison', 0);
        // 中毒伤害小于等于 0，直接返回
        if (poison <= 0) return;
        const mover = this.state.hero.location.mover;
        const config = mover.getConfig();
        // 如果忽略地形，那么也不计算中毒伤害
        if (config.ignoreTerrain) return;

        const hero = this.state.hero.getModifiableAttribute();
        // 勇士减少步数乘以单步中毒的伤害。
        hero.add('hp', -path.path.length);
    }

    onAfterTeleportTo(
        path: IPathfindingResult,
        system: IPathfindingSystem
    ): void {
        // 判断状态对象
        if (system.state !== this.state) return;
        // 判断当前绑定的是不是勇士移动器
        if (system.mover !== this.state.hero.location.mover) return;

        // 处理中毒
        this.handlePoison(path);
    }
}

export class EnemyCombatHooks
    implements ICombatFlowHooks<IEnemyAttr, IHeroAttr>, ICombatWeakHandler
{
    /** 当前的虚弱值 */
    private weakValue: number = 0;
    /** 攻击虚弱修饰器 */
    private readonly weakAtkModifier: IHeroModifier<number, number, number>;
    /** 防御虚弱修饰器 */
    private readonly weakDefModifier: IHeroModifier<number, number, number>;

    constructor(readonly state: ICoreState) {
        const hero = state.hero.getModifiableAttribute();
        // 初始化虚弱属性的修饰器，并添加到勇士修饰器中
        this.weakAtkModifier = new PercentageModifier(0);
        this.weakDefModifier = new PercentageModifier(0);
        hero.addModifier('atk', this.weakAtkModifier);
        hero.addModifier('def', this.weakDefModifier);
    }

    setWeakValue(value: number): void {
        this.weakValue = value;
        // 需要填写负数才能使勇士属性降低
        this.weakAtkModifier.setValue(-value);
        this.weakDefModifier.setValue(-value);
    }

    getWeakValue(): number {
        return this.weakValue;
    }

    async onAfterCombat(
        info: IEnemyDamageInfo<IEnemyAttr, IHeroAttr>
    ): Promise<void> {
        // 判断状态对象
        if (info.handler.state !== this.state) return;
        // 判断勇士对象
        if (info.handler.hero !== this.state.hero.getAttribute()) return;

        // 处理中毒属性
        const poison = info.handler.enemy.getSpecial<number>(10);
        if (poison) {
            // 获取 poison 全局 flag，如果 flag 不存在，则自动插入为 0
            const field = this.state.flags.getOrInsert('poison', 0);
            const max = Math.max(field.get(), poison.value);
            field.set(max);
        }

        // 处理虚弱属性
        const weak = info.handler.enemy.getSpecial<number>(11);
        if (weak) {
            const max = Math.max(this.weakValue, weak.value);
            this.setWeakValue(max);
        }

        // 处理诅咒属性
        if (info.handler.enemy.hasSpecial(12)) {
            this.state.flags.setFieldValue('curse', true);
        }

        // 处理仇恨属性
        const currHatred = this.state.flags.getOrInsert('currHatred', 0);
        if (info.handler.enemy.hasSpecial(15)) {
            currHatred.set(Math.floor(currHatred.get() / 2));
        } else {
            const hatred = this.state.flags.getFieldValueDefaults('hatred', 1);
            currHatred.add(hatred);
        }

        // 处理退化属性
        const degrade = info.handler.enemy.getSpecial<ISpecial19Value>(19);
        if (degrade) {
            const hero = this.state.hero.getModifiableAttribute();
            hero.add('atk', -degrade.value.atkValue);
            hero.add('def', -degrade.value.defValue);
        }

        // 处理重生属性
        if (info.handler.enemy.hasSpecial(21)) {
            const field = this.state.flags.getFieldValueDefaults<
                Map<string, [number, number, number][]>
            >('rebirth', new Map());

            // 如果战斗不发生在任何地图，或者不存在坐标，那么不计入重生
            if (isNil(info.handler.context.floor) || !info.handler.locator) {
                return;
            }

            // 获取当前楼层的重生存储，并向其中添加重生标记
            const floor = field.getOrInsert(info.handler.context.floor, []);
            const { x, y } = info.handler.locator;
            floor.push([info.handler.enemy.code, x, y]);
        }
    }
}

export class EnemyChangeFloorHooks implements IHeroLocationHooks {
    constructor(readonly state: ICoreState) {}

    /**
     * 处理重生属性
     * @param floor 目标楼层
     */
    private handleRebirth(map: IGameMap) {
        // 先获取指定楼层的重生标记
        const field = this.state.flags.getFieldValueDefaults<
            Map<string, [number, number, number][]>
        >('rebirth', new Map());
        const list = field.get(map.floorId);

        // 如果不存在重生，直接返回
        if (!list || list.length === 0) return;

        const event = map.eventLayer;
        // 如果不存在事件层，直接返回
        if (!event) return;

        // 把每个重生怪都放到事件层上
        for (const [tile, x, y] of list) {
            event.setBlock(tile, x, y);
        }

        // 清空重生怪列表
        list.length = 0;
    }

    onSetFloor(map: IGameMap | null): void {
        if (!map) return;
        // 判断状态对象
        if (map.state !== this.state) return;

        // 处理重生
        this.handleRebirth(map);
    }
}
