import { describe, expect, it, vi } from 'vitest';
import {
    IEnemyAttr,
    IReplaySandbox,
    IHeroAttr,
    ReplaySystem,
    SaveCompression
} from '@user/data-common';
import { IEnemy, IReadonlyHeroAttribute } from '@user/data-base';
import { IReadonlyEnemyHandler } from '@user/data-system';
import { createCoreState, CoreState } from '../src/core';
import { MainDamageCalculator } from '../src/enemy/calculator';
import { REPLAY_COMMAND_ORDER, ReplayCommandCode } from '../src/replay/types';
import { createClosedLoopFixture } from './fixtures/closed-loop';

vi.hoisted(() => {
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

interface IManualReplaySandbox extends IReplaySandbox {
    pausing: boolean;
    playing: boolean;
}

function createEnemy(): IEnemy<IEnemyAttr> {
    let attrs: IEnemyAttr = {
        hp: 20,
        atk: 8,
        def: 5,
        money: 2,
        exp: 3,
        point: 1,
        guard: new Set()
    };
    const enemy: IEnemy<IEnemyAttr> = {
        id: 'closure-enemy',
        code: 1,
        getSpecial: () => null,
        hasSpecial: () => false,
        iterateSpecials: () => [],
        getAttribute: key => attrs[key],
        cloneAttributes: () => structuredClone(attrs),
        clone: () => {
            const copy = createEnemy();
            copy.copyFrom(enemy);
            return copy;
        },
        addSpecial: () => {},
        deleteSpecial: () => {},
        setAttribute: (key, value) => {
            attrs[key] = value;
        },
        addAttribute: (key, value) => {
            attrs[key] = (attrs[key] as number) + value;
        },
        copyFrom: other => {
            attrs = other.cloneAttributes();
        },
        saveState: () => ({
            attrs: structuredClone(attrs),
            specials: new Map()
        }),
        loadState: state => {
            attrs = structuredClone(state.attrs);
        }
    };
    return enemy;
}

function addEnemy(state: CoreState): IEnemy<IEnemyAttr> {
    state.enemyManager.addPrefab(createEnemy());
    const enemy = state.enemyManager.createEnemy(1);
    if (!enemy) throw new Error('closure enemy was not created');
    return enemy;
}

async function waitForEnded(sandbox: IReplaySandbox): Promise<void> {
    for (let index = 0; index < 1000 && !sandbox.ended; index++) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    if (!sandbox.ended) throw new Error('closure replay did not end');
}

describe('DATA-01 closure', () => {
    // 验证敌人管理器能够创建敌人、修改属性并完成独立存档恢复
    it('creates, mutates, and saves an enemy through the public manager', () => {
        const state = createCoreState();
        const enemy = addEnemy(state);

        enemy.setAttribute('hp', 31);
        const saved = enemy.saveState(SaveCompression.NoCompression);
        enemy.setAttribute('hp', 2);
        enemy.loadState(saved, SaveCompression.NoCompression);

        expect(enemy.getAttribute('hp')).toBe(31);
        expect(enemy.getAttribute('atk')).toBe(8);
        expect(enemy.id).toBe('closure-enemy');
    });

    // 验证 Flag 的设置读取和 save/load round trip 保留字段值
    it('round-trips Flag values through save and load', () => {
        const state = createCoreState();
        state.flags.setFieldValue('closureScore', 7);
        state.flags.addFieldValue('closureScore', 5);
        const saved = state.flags.saveState(SaveCompression.NoCompression);

        state.flags.setFieldValue('closureScore', 0);
        state.flags.loadState(saved, SaveCompression.NoCompression);

        expect(state.flags.getFieldValue<number>('closureScore')).toBe(12);
        expect(state.flags.occupied('closureScore')).toBe(true);
    });

    // 验证同一敌人和勇士属性下的战斗伤害结果保持确定
    it('computes deterministic combat damage', () => {
        const state = createCoreState();
        const enemy = addEnemy(state);
        const hero = {
            getBaseAttribute: (
                name: keyof IHeroAttr
            ): IHeroAttr[typeof name] => (name === 'hp' ? 100 : 0),
            getFinalAttribute: (
                name: keyof IHeroAttr
            ): IHeroAttr[typeof name] => {
                if (name === 'atk') return 20;
                if (name === 'def') return 5;
                return 0;
            }
        } as IReadonlyHeroAttribute<IHeroAttr>;
        const handler = {
            enemy,
            context: state.enemyContext,
            locator: { x: 0, y: 0 },
            hero,
            state
        } as IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>;

        const calculator = new MainDamageCalculator();
        const first = calculator.calculate(handler);
        const second = calculator.calculate(handler);

        expect(first).not.toBeNull();
        expect(second).toEqual(first);
        expect(first?.damage).toBe(3);
        expect(first?.turn).toBe(2);
    });

    // 验证可存档勇士内容在修改后能够恢复保存时的属性快照
    it('round-trips a saveable hero state', () => {
        const state = createCoreState();
        const hero = state.hero.getModifiableAttribute();
        hero.set('hp', 88);
        const saved = state.hero.saveState(SaveCompression.NoCompression);

        hero.set('hp', 1);
        state.hero.loadState(saved, SaveCompression.NoCompression);

        expect(state.hero.attribute.getBaseAttribute('hp')).toBe(88);
    });

    // 验证 trigger/event executor 等待事件完成并应用事件层状态变化
    it('executes a trigger event and applies its awaited mutation', async () => {
        const fixture = createClosedLoopFixture();
        expect(fixture.map.eventLayer?.getBlock(1, 0)).toBe(1);

        fixture.sandbox.play();
        await waitForEnded(fixture.sandbox);

        expect(fixture.sandbox.ended).toBe(true);
        expect(fixture.eventCompleted()).toBe(true);
        expect(fixture.map.eventLayer?.getBlock(1, 0)).toBe(2);
        expect(fixture.state.eventStore.getEvent('mutate-map')).not.toBeNull();
    });

    // 验证 replay 注册顺序、参数路线、异步完成与首个失败停止行为
    it('preserves replay order, awaits completion, and stops on failure', async () => {
        const state = createCoreState();
        expect(
            REPLAY_COMMAND_ORDER.every(code =>
                state.replaySystem.getCommand(code)
            )
        ).toBe(true);
        expect(REPLAY_COMMAND_ORDER).toEqual([
            ReplayCommandCode.Up,
            ReplayCommandCode.Right,
            ReplayCommandCode.Down,
            ReplayCommandCode.Left,
            ReplayCommandCode.AutoPathfindToPoint,
            ReplayCommandCode.UseItem,
            ReplayCommandCode.Equip,
            ReplayCommandCode.Unequip
        ]);

        state.replaySystem.record(ReplayCommandCode.Right, 4, 'route');
        expect(state.replaySystem.route.get(0)).toMatchObject({
            command: ReplayCommandCode.Right,
            params: [4, 'route']
        });

        const fixture = createClosedLoopFixture();
        fixture.sandbox.play();
        await waitForEnded(fixture.sandbox);
        expect(fixture.eventCompleted()).toBe(true);

        const replay = new ReplaySystem();
        let laterExecuted = false;
        replay.registerCommand(0, { execute: async () => false });
        replay.registerCommand(1, {
            execute: async () => {
                laterExecuted = true;
                return true;
            }
        });
        replay.record(0);
        replay.record(1);
        const sandbox = replay.createReplaySandbox({
            route: replay.route,
            reseter: { reset: () => {} }
        }) as IManualReplaySandbox;
        sandbox.pausing = false;
        sandbox.playing = true;

        await expect(sandbox.step()).resolves.toBe(false);
        expect(sandbox.getReplayed()).toBe(1);
        expect(laterExecuted).toBe(false);
    });
});
