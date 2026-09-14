// 测试 followers 组合行为：增删与钩子、邻居链接、同步/异步聚集与码 142
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    Dir8FaceHandler,
    FaceDirection,
    ItemStore,
    TileStore,
    TileType
} from '@user/data-common';
import { logger } from '@motajs/common';
import { type IPassPredicate } from '../map';
import { HeroFollowersController } from './follower';
import { HeroLocation } from './location';
import { type IHeroMoveTopImpl } from './types';

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

interface TestEnv {
    state: IDataCommon;
    location: HeroLocation;
    controller: HeroFollowersController;
}

/** 构造一个注册了跟随者图块的公共层假对象 */
function createState(): IDataCommon {
    const tileStore = new TileStore();
    const itemStore = new ItemStore();
    tileStore.addTile({
        num: 100,
        id: 'ghost',
        events: {},
        type: TileType.Npc,
        pass: { onlyEvents: false, inPass: 15, outPass: 15 },
        eventPass: true
    });
    // 录像系统桩，仅用于满足移动时的 route.add 记录
    const replaySystem = { route: { add: vi.fn() } };
    return { tileStore, itemStore, replaySystem } as never;
}

/** 构造一个停在原点的勇士位置对象 */
function createLocation(
    state: IDataCommon,
    faceHandler: Dir8FaceHandler
): HeroLocation {
    return new HeroLocation(
        state,
        { x: 0, y: 0, direction: FaceDirection.Down },
        faceHandler
    );
}

/** 构造一个跟随者控制器及其勇士位置对象 */
function createController(): TestEnv {
    const state = createState();
    const faceHandler = new Dir8FaceHandler();
    const location = createLocation(state, faceHandler);
    return {
        state,
        location,
        controller: new HeroFollowersController(state, location, faceHandler)
    };
}

/** 一个始终允许通行的顶层移动实现，用于驱动跟随者实际移动 */
class FakeTopImpl implements IHeroMoveTopImpl {
    predicate(): IPassPredicate {
        return { canPass: () => true, shouldHit: () => false };
    }

    inBound(): boolean {
        return true;
    }

    async enter(): Promise<void> {}

    async leave(): Promise<void> {}

    async hit(): Promise<void> {}

    async cannotEnter(): Promise<void> {}
}

describe('HeroFollowersController members', () => {
    // 验证 addFollower 在勇士位置追加并触发 onAddFollower
    it('appends followers at the hero locator and notifies the add hook', () => {
        const env = createController();
        const added: [number, number][] = [];
        env.controller
            .addHook({
                onAddFollower: (follower, index) => {
                    added.push([follower.num, index]);
                }
            })
            .load();
        env.location.setPos(2, 3);
        env.location.mover.setFaceDir(FaceDirection.Up);

        const first = env.controller.addFollower(100);
        const second = env.controller.addFollower('ghost');

        expect(first.num).toBe(100);
        expect(second.num).toBe(100);
        expect(first.location.x).toBe(2);
        expect(first.location.y).toBe(3);
        expect(first.location.getCurrentFaceDirection()).toBe(FaceDirection.Up);
        expect(first.rendering.alpha).toBe(1);
        expect(added).toEqual([
            [100, 0],
            [100, 1]
        ]);
        expect(env.controller.getAllFollowers()).toEqual([first, second]);
    });

    // 验证按索引与按数字/字符串 id 查询跟随者
    it('queries followers by index and by id', () => {
        const env = createController();
        const first = env.controller.addFollower(100);
        const second = env.controller.addFollower(100);

        expect(env.controller.getFollower(0)).toBe(first);
        expect(env.controller.getFollower(1)).toBe(second);
        expect(env.controller.getFollower(5)).toBeNull();
        expect(
            [...env.controller.getFollowersById(100)].map(i => i[0])
        ).toEqual([0, 1]);
        expect(
            [...env.controller.getFollowersById('ghost')].map(i => i[0])
        ).toEqual([0, 1]);
        expect([...env.controller.getFollowersById(999)]).toEqual([]);
    });

    // 验证 next/last 返回相邻跟随者且边界为 null
    it('links neighbours through next and last', () => {
        const env = createController();
        const first = env.controller.addFollower(100);
        const second = env.controller.addFollower(100);
        const third = env.controller.addFollower(100);

        expect(first.next()).toBe(second);
        expect(second.next()).toBe(third);
        expect(third.next()).toBeNull();
        expect(third.last()).toBe(second);
        expect(first.last()).toBeNull();
    });

    // 验证移除单个或全部跟随者都会触发 onRemoveFollower
    it('removes one or all followers and notifies the remove hook', async () => {
        const env = createController();
        const removed: number[] = [];
        env.controller
            .addHook({
                onRemoveFollower: (_follower, index) => {
                    removed.push(index);
                }
            })
            .load();
        env.controller.addFollower(100);
        const second = env.controller.addFollower(100);

        await env.controller.removeFollower(0);
        expect(env.controller.getAllFollowers()).toEqual([second]);
        expect(removed).toEqual([0]);

        await env.controller.removeFollower(9);
        expect(env.controller.getAllFollowers()).toEqual([second]);

        await env.controller.removeAllFollowers();
        expect(env.controller.getAllFollowers()).toEqual([]);
        expect(removed).toEqual([0, 0]);
    });
});

describe('HeroFollowersController gathering', () => {
    // 验证同步聚集把跟随者吸附到勇士位置并同步朝向
    it('gathers followers synchronously onto the hero', () => {
        const env = createController();
        const gathered: boolean[] = [];
        env.controller
            .addHook({
                onGatherFollowers: sync => {
                    gathered.push(sync);
                }
            })
            .load();
        const follower = env.controller.addFollower(100);
        env.location.setPos(5, 6);
        env.location.mover.setFaceDir(FaceDirection.Right);

        env.controller.gatherFollowersSync();

        expect(follower.location.x).toBe(5);
        expect(follower.location.y).toBe(6);
        expect(follower.location.getCurrentFaceDirection()).toBe(
            FaceDirection.Right
        );
        expect(gathered).toEqual([true]);
    });

    // 验证异步聚集等待移动结束并按勇士移动方向跟进一步
    it('gathers followers asynchronously and waits for the movement', async () => {
        const env = createController();
        const follower = env.controller.addFollower(100);
        const gathered: boolean[] = [];
        env.controller
            .addHook({
                onGatherFollowers: sync => {
                    gathered.push(sync);
                }
            })
            .load();
        env.location.mover.useTopImplementation(new FakeTopImpl());
        follower.location.mover.useTopImplementation(new FakeTopImpl());

        env.location.mover.step(FaceDirection.Right);
        const controller = env.location.mover.start();
        expect(controller).not.toBeNull();
        await controller!.onEnd;
        expect(env.location.x).toBe(1);

        await env.controller.gatherFollowers();

        expect(follower.location.x).toBe(1);
        expect(follower.location.y).toBe(0);
        expect(gathered).toEqual([false]);
    });

    // 验证未知字符串跟随者 id 告警 142 并退回数字 0
    it('warns code 142 for an unknown string follower id', () => {
        const env = createController();

        const result = logger.catch(() =>
            env.controller.addFollower('missing')
        );

        expect(result.info.map(info => info.code)).toContain(142);
        expect(result.ret.num).toBe(0);
    });
});
