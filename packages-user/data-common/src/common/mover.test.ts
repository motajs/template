// 验证 L0 ObjectMover 单步移动后的坐标回写行为（正交 / 斜向 / 传送步），为 mover.ts:651 条件缺陷的修复铺设回归用例
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import { FaceDirection } from '@user/data-common';
import {
    type IObjectMovable,
    type ObjectMoveStep,
    ObjectMoveType
} from './mover';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
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

interface TestModules {
    ObjectMover: typeof import('./mover').ObjectMover;
    Dir8FaceHandler: typeof import('@user/data-common').Dir8FaceHandler;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const moverModule = await import('./mover');
    const commonModule = await import('@user/data-common');
    modules = {
        ObjectMover: moverModule.ObjectMover,
        Dir8FaceHandler: commonModule.Dir8FaceHandler
    };
});

/** 测试用可移动对象，记录每次 setPos 调用以断言坐标回写 */
class TestTile implements IObjectMovable {
    /** 当前横坐标 */
    x: number = 0;
    /** 当前纵坐标 */
    y: number = 0;
    /** setPos 调用记录 */
    readonly setPosCalls: ITileLocator[] = [];
    /** 当前朝向 */
    face: FaceDirection = FaceDirection.Down;

    /**
     * 记录并应用一次位置设置
     * @param x 横坐标
     * @param y 纵坐标
     */
    setPos(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.setPosCalls.push({ x, y });
    }

    /**
     * 获取当前朝向
     */
    getCurrentFaceDirection(): FaceDirection {
        return this.face;
    }
}

/** 创建最小移动器子类：按步骤类型模拟移动实现并返回该步的到达坐标 */
function createMover(tile: TestTile) {
    class TestMover extends modules.ObjectMover<TestTile> {
        readonly tile: TestTile;

        constructor(tile: TestTile) {
            super(new modules.Dir8FaceHandler(), FaceDirection.Down);
            this.tile = tile;
        }

        protected override async onMoveStart(): Promise<void> {}

        protected override async onMoveEnd(): Promise<void> {}

        protected override async onStepStart(): Promise<number> {
            // 移动代码对基类不透明，固定传 0 即可
            return 0;
        }

        protected override async onStepEnd(
            _code: number,
            step: Readonly<ObjectMoveStep>,
            tile: TestTile
        ): Promise<ITileLocator> {
            if (step.type === ObjectMoveType.Teleport) {
                return { x: step.x, y: step.y };
            }
            if (step.type === ObjectMoveType.Dir) {
                switch (step.move) {
                    case FaceDirection.Right:
                        return { x: tile.x + 1, y: tile.y };
                    case FaceDirection.Left:
                        return { x: tile.x - 1, y: tile.y };
                    case FaceDirection.Up:
                        return { x: tile.x, y: tile.y - 1 };
                    case FaceDirection.Down:
                        return { x: tile.x, y: tile.y + 1 };
                    case FaceDirection.RightUp:
                        return { x: tile.x + 1, y: tile.y - 1 };
                    default:
                        return { x: tile.x, y: tile.y };
                }
            }
            return { x: tile.x, y: tile.y };
        }

        protected override async onStepSettled(): Promise<void> {}
    }
    return new TestMover(tile);
}

describe('object mover position writeback', () => {
    // 验证正交步（仅 x 变化）移动后经 setPos 回写 x 轴坐标，覆盖 mover.ts:651 条件缺陷场景
    it('writes back the x position after an orthogonal x-only step', async () => {
        const tile = new TestTile();
        tile.x = 0;
        tile.y = 0;
        const mover = createMover(tile);
        mover.step(FaceDirection.Right);
        const controller = mover.start();
        expect(controller).not.toBeNull();
        await controller!.onEnd;
        expect(tile.x).toBe(1);
        expect(tile.y).toBe(0);
        expect(tile.setPosCalls).toEqual([{ x: 1, y: 0 }]);
    });

    // 验证正交步（仅 y 变化）移动后经 setPos 回写 y 轴坐标，覆盖另一正交方向
    it('writes back the y position after an orthogonal y-only step', async () => {
        const tile = new TestTile();
        tile.x = 0;
        tile.y = 0;
        const mover = createMover(tile);
        mover.step(FaceDirection.Down);
        const controller = mover.start();
        expect(controller).not.toBeNull();
        await controller!.onEnd;
        expect(tile.x).toBe(0);
        expect(tile.y).toBe(1);
        expect(tile.setPosCalls).toEqual([{ x: 0, y: 1 }]);
    });

    // 验证斜向步移动后经 setPos 双轴同时回写，保证修复不破坏双轴步语义
    it('writes back both axes after a diagonal step', async () => {
        const tile = new TestTile();
        tile.x = 1;
        tile.y = 1;
        const mover = createMover(tile);
        mover.step(FaceDirection.RightUp);
        const controller = mover.start();
        expect(controller).not.toBeNull();
        await controller!.onEnd;
        expect(tile.x).toBe(2);
        expect(tile.y).toBe(0);
        expect(tile.setPosCalls).toEqual([{ x: 2, y: 0 }]);
    });

    // 验证传送步（ObjectMoveType.Teleport）移动后经 setPos 双轴回写至目标坐标
    it('writes back both axes after a teleport step', async () => {
        const tile = new TestTile();
        tile.x = 1;
        tile.y = 1;
        const mover = createMover(tile);
        mover.tp(3, 4);
        const controller = mover.start();
        expect(controller).not.toBeNull();
        await controller!.onEnd;
        expect(tile.x).toBe(3);
        expect(tile.y).toBe(4);
        expect(tile.setPosCalls).toEqual([{ x: 3, y: 4 }]);
    });
});
