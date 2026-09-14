// 测试 HeroState 装配：子系统装配、属性视图、修饰器注册与 changeFloor 钩子顺序
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    type IHeroAttr,
    Dir8FaceHandler,
    FaceDirection,
    ItemStore,
    TileStore
} from '@user/data-common';
import { logger } from '@motajs/common';
import { HeroAttribute } from './attribute';
import { ValueModifier } from './modifier';
import { HeroState } from './state';
import { type IHeroAttribute, type IHeroState } from './types';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    Map.prototype.getOrInsert ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        value: V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        this.set(key, value);
        return value;
    };
    Map.prototype.getOrInsertComputed ??= function <K, V>(
        this: Map<K, V>,
        key: K,
        callback: (key: K) => V
    ): V {
        const existing = this.get(key);
        if (existing !== undefined) return existing;
        const value = callback(key);
        this.set(key, value);
        return value;
    };
});

afterAll(() => {
    vi.unstubAllGlobals();
});

/** 构造一个仅包含图块与道具存储的公共层假对象 */
function createState(): IDataCommon {
    return {
        tileStore: new TileStore(),
        itemStore: new ItemStore()
    } as never;
}

/** 构造一个八方向朝向处理器 */
function createFaceHandler(): Dir8FaceHandler {
    return new Dir8FaceHandler();
}

/** 构造一份合成的勇士基础属性 */
function createBaseAttr(): IHeroAttr {
    return {
        name: 'hero',
        hp: 100,
        hpmax: 100,
        atk: 10,
        def: 5,
        mdef: 0,
        mana: 0,
        manamax: 0,
        money: 0,
        exp: 0
    };
}

/** 构造一个装配完成的勇士状态对象，可注入既有属性对象 */
function createHeroState(
    attribute?: IHeroAttribute<IHeroAttr>
): IHeroState<IHeroAttr> {
    return new HeroState<IHeroAttr>(
        createState(),
        createFaceHandler(),
        attribute ?? new HeroAttribute<IHeroAttr>(createBaseAttr())
    );
}

describe('HeroState assembly', () => {
    // 验证构造器装配全部子系统并停在默认定位器
    it('assembles every subsystem at the default locator', () => {
        const hero = createHeroState();

        expect(hero.location).toBeDefined();
        expect(hero.rendering.alpha).toBe(1);
        expect(hero.followers.getAllFollowers()).toEqual([]);
        expect(hero.items.equipment).toBeDefined();
        expect(hero.equip.slots).toEqual([]);
        expect(hero.getLocation()).toEqual({
            x: 0,
            y: 0,
            direction: FaceDirection.Down
        });
    });

    // 验证可修改属性返回共享对象、只读视图共享引用、独立属性为克隆
    it('exposes shared, readonly and isolated attribute views', () => {
        const attribute = new HeroAttribute<IHeroAttr>(createBaseAttr());
        const hero = createHeroState(attribute);

        expect(hero.getModifiableAttribute()).toBe(attribute);
        expect(hero.getAttribute()).toBe(attribute);

        const isolated = hero.getIsolatedAttribute();
        expect(isolated).not.toBe(attribute);
        isolated.set('hp', 1);
        expect(attribute.getBaseAttribute('hp')).toBe(100);
    });

    // 验证 attachAttribute 替换绑定的属性对象
    it('replaces the bound attribute through attachAttribute', () => {
        const hero = createHeroState();
        const replacement = new HeroAttribute<IHeroAttr>(createBaseAttr());

        hero.attachAttribute(replacement);

        expect(hero.getModifiableAttribute()).toBe(replacement);
        expect(hero.getAttribute()).toBe(replacement);
    });
});

describe('HeroState modifier registry', () => {
    // 验证已注册类型可创建并插入修饰器，未知类型告警 116 并返回 null
    it('creates registered modifiers and warns code 116 for unknown types', () => {
        const hero = createHeroState();
        hero.registerModifier('@system/value', () => new ValueModifier(5));

        expect(hero.createModifier('@system/value')).not.toBeNull();
        expect(
            hero.createAndInsertModifier('@system/value', 'hp')
        ).not.toBeNull();
        expect(hero.getModifiableAttribute().getFinalAttribute('hp')).toBe(105);

        const unknown = logger.catch(() =>
            hero.createAndInsertModifier('@missing/type', 'hp')
        );
        expect(unknown.ret).toBeNull();
        expect(unknown.info.map(info => info.code)).toContain(116);
    });
});

describe('HeroState changeFloor', () => {
    // 验证 changeFloor 依次触发 before、位置/楼层更新与 after 钩子
    it('changes floor with the documented hook order', async () => {
        const hero = createHeroState();
        const calls: string[] = [];
        hero.addHook({
            onBeforeChangeFloor: async () => {
                calls.push('before');
            },
            onAfterChangeFloor: async () => {
                calls.push('after');
            }
        }).load();
        hero.location
            .addHook({
                onSetFloor: () => {
                    calls.push('floor');
                }
            })
            .load();

        await hero.changeFloor({
            target: 'F2',
            x: 5,
            y: 6,
            face: FaceDirection.Up
        });

        expect(calls).toEqual(['before', 'floor', 'after']);
        expect(hero.getLocation()).toEqual({
            x: 5,
            y: 6,
            direction: FaceDirection.Up
        });
        expect(hero.location.floorId).toBe('F2');
        expect(hero.location.mover.moveDirection).toBe(FaceDirection.Up);
    });
});
