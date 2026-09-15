// 测试 HeroLocation 构件：初始坐标/楼层、朝向一致性以及位置与楼层钩子
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    type IDataCommon,
    Dir8FaceHandler,
    FaceDirection,
    ItemStore,
    TileStore
} from '@user/data-common';
import { HeroLocation } from './location';

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

/** 构造一个停在指定定位器上的勇士位置对象 */
function createLocation(): HeroLocation {
    return new HeroLocation(
        createState(),
        { x: 3, y: 4, direction: FaceDirection.Right },
        createFaceHandler()
    );
}

describe('HeroLocation position and floor', () => {
    // 验证初始坐标、未定楼层与朝向来自构造时的定位器
    it('initializes position, face direction and an undefined floor', () => {
        const location = createLocation();

        expect(location.x).toBe(3);
        expect(location.y).toBe(4);
        expect(location.floorId).toBeUndefined();
        expect(location.getCurrentFaceDirection()).toBe(FaceDirection.Right);
        expect(location.mover.faceDirection).toBe(FaceDirection.Right);
    });

    // 验证 setPos 更新坐标并触发 onSetPos 钩子
    it('updates the position and notifies the onSetPos hook', () => {
        const location = createLocation();
        const calls: [number, number][] = [];
        location
            .addHook({
                onSetPos: (x, y) => {
                    calls.push([x, y]);
                }
            })
            .load();

        location.setPos(7, 9);

        expect(location.x).toBe(7);
        expect(location.y).toBe(9);
        expect(calls).toEqual([[7, 9]]);
    });

    // 验证 setFloor 更新楼层并触发 onSetFloor 钩子
    it('updates the floor and notifies the onSetFloor hook', () => {
        const location = createLocation();
        const floors: (string | undefined)[] = [];
        location
            .addHook({
                onSetFloor: floorId => {
                    floors.push(floorId);
                }
            })
            .load();

        location.setFloor('F2');
        expect(location.floorId).toBe('F2');

        location.setFloor(undefined);
        expect(location.floorId).toBeUndefined();
        expect(floors).toEqual(['F2', undefined]);
    });

    // 验证朝向经由共享移动器读写
    it('reports the face direction through the shared mover', () => {
        const location = createLocation();

        location.mover.setFaceDir(FaceDirection.Down);

        expect(location.getCurrentFaceDirection()).toBe(FaceDirection.Down);
    });
});
