// 测试 HeroMover 异步移动：配置往返、Step/CannotMove/Hit、越界、地形忽略、enter/leave 顺序与码 144
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    Dir8FaceHandler,
    FaceDirection,
    ItemStore,
    TileStore
} from '@user/data-common';
import { logger } from '@motajs/common';
import { type IPassPredicate } from '../map';
import { HeroLocation } from './location';
import { type IHeroMoveTopHandler, type IHeroMoveTopImpl } from './types';

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

/** 构造一个仅含图块与道具存储的公共层假对象 */
function createState(): IDataCommon {
    // 录像系统桩，仅用于满足移动时的 route.add 记录
    const replaySystem = { route: { add: vi.fn() } };
    return {
        tileStore: new TileStore(),
        itemStore: new ItemStore(),
        replaySystem
    } as never;
}

/** 构造一个停在原点的勇士位置对象，复用真实实现作为移动器宿主 */
function createTestTile(): HeroLocation {
    return new HeroLocation(
        createState(),
        { x: 0, y: 0, direction: FaceDirection.Down },
        new Dir8FaceHandler()
    );
}

/** 构造一个绑定在真实勇士位置对象上的移动器 */
function createMover(): HeroLocation['mover'] {
    return createTestTile().mover;
}

/** 可配置结果的顶层移动实现，记录每次触发的顺序与信息对象 */
class FakeTopImpl implements IHeroMoveTopImpl {
    /** 触发的行为序列 */
    readonly calls: string[] = [];
    /** 每次触发携带的信息对象 */
    readonly handlers: IHeroMoveTopHandler[] = [];
    /** 通行性判定结果 */
    canPass: boolean = true;
    /** 撞击判定结果 */
    shouldHit: boolean = false;
    /** 目标是否在地图范围内 */
    bounded: boolean = true;

    predicate(): IPassPredicate {
        return {
            canPass: () => this.canPass,
            shouldHit: () => this.shouldHit
        };
    }

    inBound(): boolean {
        return this.bounded;
    }

    async enter(handler: IHeroMoveTopHandler): Promise<void> {
        this.calls.push('enter');
        this.handlers.push(handler);
    }

    async leave(handler: IHeroMoveTopHandler): Promise<void> {
        this.calls.push('leave');
        this.handlers.push(handler);
    }

    async hit(handler: IHeroMoveTopHandler): Promise<void> {
        this.calls.push('hit');
        this.handlers.push(handler);
    }

    async cannotEnter(handler: IHeroMoveTopHandler): Promise<void> {
        this.calls.push('cannotEnter');
        this.handlers.push(handler);
    }
}

describe('HeroMover configuration', () => {
    // 验证配置默认值以及 config 增量更新与链式返回
    it('configures and reads back move options', () => {
        const mover = createMover();

        expect(mover.getConfig()).toEqual({
            ignoreTerrain: false,
            autoSave: false,
            allowOutBound: false
        });

        expect(mover.config({ ignoreTerrain: true, autoSave: true })).toBe(
            mover
        );
        expect(mover.getConfig()).toEqual({
            ignoreTerrain: true,
            autoSave: true,
            allowOutBound: false
        });
    });
});

describe('HeroMover step codes', () => {
    // 验证正常步进写入目标位置并按 before/current 顺序触发 leave 后 enter
    it('steps onto the next tile and triggers leave before enter', async () => {
        const mover = createMover();
        const top = new FakeTopImpl();
        mover.useTopImplementation(top);

        mover.step(FaceDirection.Right);
        const controller = mover.start();
        expect(controller).not.toBeNull();
        await controller!.onEnd;

        expect(mover.tile.x).toBe(1);
        expect(mover.tile.y).toBe(0);
        expect(top.calls).toEqual(['leave', 'enter']);
        expect(top.handlers[0].currLoc).toEqual({ x: 0, y: 0 });
        expect(top.handlers[0].nextLoc).toEqual({ x: 1, y: 0 });
    });

    // 验证不可通行时停在原地并触发 cannotEnter
    it('stops and triggers cannotEnter when the target is not passable', async () => {
        const mover = createMover();
        const top = new FakeTopImpl();
        top.canPass = false;
        mover.useTopImplementation(top);

        mover.step(FaceDirection.Right);
        const controller = mover.start();
        await controller!.onEnd;

        expect(mover.tile.x).toBe(0);
        expect(top.calls).toEqual(['cannotEnter', 'leave', 'enter']);
    });

    // 验证撞击时停在原地并触发 hit
    it('triggers hit and stops when the predicate reports an impact', async () => {
        const mover = createMover();
        const top = new FakeTopImpl();
        top.shouldHit = true;
        mover.useTopImplementation(top);

        mover.step(FaceDirection.Down);
        const controller = mover.start();
        await controller!.onEnd;

        expect(mover.tile.y).toBe(0);
        expect(top.calls).toEqual(['hit', 'leave', 'enter']);
    });

    // 验证默认阻挡越界，开启 allowOutBound 后放行
    it('blocks out-of-bound steps unless allowOutBound is enabled', async () => {
        const mover = createMover();
        const top = new FakeTopImpl();
        top.bounded = false;
        mover.useTopImplementation(top);

        mover.step(FaceDirection.Right);
        await mover.start()!.onEnd;
        expect(mover.tile.x).toBe(0);
        expect(top.calls).toEqual(['cannotEnter', 'leave', 'enter']);

        top.calls.length = 0;
        mover.config({ allowOutBound: true });
        mover.step(FaceDirection.Right);
        await mover.start()!.onEnd;
        expect(mover.tile.x).toBe(1);
        expect(top.calls).toEqual(['leave', 'enter']);
    });

    // 验证忽略地形时跳过通行/撞击判定与 enter/leave 触发
    it('skips terrain checks when ignoreTerrain is enabled', async () => {
        const mover = createMover();
        const top = new FakeTopImpl();
        top.canPass = false;
        top.shouldHit = true;
        mover.useTopImplementation(top);
        mover.config({ ignoreTerrain: true });

        mover.step(FaceDirection.Right);
        await mover.start()!.onEnd;

        expect(mover.tile.x).toBe(1);
        expect(top.calls).toEqual([]);
    });

    // 验证传送步按边界规则执行或停止
    it('handles teleport steps with the configured boundary rule', async () => {
        const mover = createMover();
        const top = new FakeTopImpl();
        mover.useTopImplementation(top);

        mover.tp(3, 4);
        await mover.start()!.onEnd;
        expect(mover.tile.x).toBe(3);
        expect(mover.tile.y).toBe(4);

        top.calls.length = 0;
        top.bounded = false;
        mover.config({ allowOutBound: true });
        mover.tp(9, 9);
        await mover.start()!.onEnd;
        expect(mover.tile.x).toBe(3);
        expect(mover.tile.y).toBe(4);
        expect(top.calls).toEqual(['leave', 'enter']);
    });
});

describe('HeroMover top implementation guard', () => {
    // 验证缺少顶层实现时告警 144 且不移动
    it('warns code 144 and stops without a top implementation', async () => {
        const mover = createMover();
        mover.step(FaceDirection.Right);

        const result = logger.catch(() => mover.start());
        const controller = result.ret;
        expect(controller).not.toBeNull();
        await controller!.onEnd;

        expect(result.info.map(info => info.code)).toContain(144);
        expect(mover.tile.x).toBe(0);
    });
});
