// 测试 L0 ObjectMover：既有坐标回写回归用例 + 全部公开移动方法的正常与边界行为
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { type ITileLocator } from '@motajs/common';
import { FaceDirection } from '@user/data-common';
import {
    type IObjectMovable,
    ObjectAnimDirection,
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

/** 根据朝向返回从当前位置移动一步后的坐标，未知朝向原地不动 */
function nextLocator(dir: FaceDirection, tile: TestTile): ITileLocator {
    switch (dir) {
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
        case FaceDirection.LeftUp:
            return { x: tile.x - 1, y: tile.y - 1 };
        case FaceDirection.RightDown:
            return { x: tile.x + 1, y: tile.y + 1 };
        case FaceDirection.LeftDown:
            return { x: tile.x - 1, y: tile.y + 1 };
        default:
            return { x: tile.x, y: tile.y };
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
            if (
                step.type === ObjectMoveType.Teleport ||
                step.type === ObjectMoveType.Jump
            ) {
                return step.rel
                    ? { x: tile.x + step.x, y: tile.y + step.y }
                    : { x: step.x, y: step.y };
            }
            if (
                step.type === ObjectMoveType.Dir ||
                step.type === ObjectMoveType.DirFace
            ) {
                return nextLocator(step.move, tile);
            }
            if (step.type === ObjectMoveType.Special) {
                return nextLocator(this.moveDirection, tile);
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

describe('object mover public surface', () => {
    // 验证 setPos 立即写入绑定对象的位置
    it('sets the position of the bound object', () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.setPos(4, 6);

        expect(tile.x).toBe(4);
        expect(tile.y).toBe(6);
        expect(tile.setPosCalls).toEqual([{ x: 4, y: 6 }]);
    });

    // 验证 setFaceDir 与 setMoveDir 分别更新朝向与移动方向
    it('sets face and move directions independently', () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.setFaceDir(FaceDirection.Left);
        mover.setMoveDir(FaceDirection.Up);

        expect(mover.faceDirection).toBe(FaceDirection.Left);
        expect(mover.moveDirection).toBe(FaceDirection.Up);
    });

    // 验证 jump 绝对模式把对象跳跃到目标坐标
    it('jumps to an absolute target', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.jump(3, 4);
        const controller = mover.start();
        expect(controller).not.toBeNull();
        await controller!.onEnd;

        expect(tile.x).toBe(3);
        expect(tile.y).toBe(4);
    });

    // 验证 jump 相对模式在当前坐标基础上偏移
    it('jumps by a relative offset', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.jump(2, 3, true);
        const controller = mover.start();
        await controller!.onEnd;

        expect(tile.x).toBe(2);
        expect(tile.y).toBe(3);
    });

    // 验证 stepFace 按指定移动方向移动并采用显式朝向
    it('moves by the step move direction and applies the explicit face', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.stepFace(FaceDirection.Right, FaceDirection.Up);
        const controller = mover.start();
        await controller!.onEnd;

        expect(tile.x).toBe(1);
        expect(tile.y).toBe(0);
        expect(mover.faceDirection).toBe(FaceDirection.Up);
    });

    // 验证 forward 沿当前朝向连续前进
    it('moves forward along the current face direction', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.forward(2);
        const controller = mover.start();
        await controller!.onEnd;

        expect(tile.x).toBe(0);
        expect(tile.y).toBe(2);
        expect(mover.faceDirection).toBe(FaceDirection.Down);
    });

    // 验证 backward 沿当前朝向的反方向后退一步
    it('moves backward against the current face direction', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.backward(1);
        const controller = mover.start();
        await controller!.onEnd;

        expect(tile.x).toBe(0);
        expect(tile.y).toBe(-1);
        expect(mover.faceDirection).toBe(FaceDirection.Down);
        expect(mover.moveDirection).toBe(FaceDirection.Up);
    });

    // 验证连续后退每一步都以当前朝向为基准，保持同轴后退且朝向不变（#06-08-1）
    it('keeps retreating along the same axis across multiple backward steps', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.backward(2);
        const controller = mover.start();
        await controller!.onEnd;

        expect(tile.x).toBe(0);
        expect(tile.y).toBe(-2);
        expect(mover.faceDirection).toBe(FaceDirection.Down);
        expect(mover.moveDirection).toBe(FaceDirection.Up);
    });

    // 验证 speed 步更新后续移动速度
    it('applies a speed step to the mover', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.speed(250).step(FaceDirection.Right);
        const controller = mover.start();
        await controller!.onEnd;

        expect(mover.currentSpeed).toBe(250);
        expect(tile.x).toBe(1);
    });

    // 验证 face 步只改变朝向而不产生位移
    it('changes only the face direction without moving', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.face(FaceDirection.Left);
        const controller = mover.start();
        await controller!.onEnd;

        expect(mover.faceDirection).toBe(FaceDirection.Left);
        expect(tile.setPosCalls).toEqual([]);
    });

    // 验证 animDir 步切换动画播放方向
    it('switches the animation direction', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.animDir(ObjectAnimDirection.Backward);
        const controller = mover.start();
        await controller!.onEnd;

        expect(mover.currAnimDir).toBe(ObjectAnimDirection.Backward);
    });

    // 验证 push 追加的多个步骤按传入顺序依次执行
    it('executes pushed steps in order', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.push([
            { type: ObjectMoveType.Dir, move: FaceDirection.Right },
            { type: ObjectMoveType.Teleport, x: 5, y: 5, rel: false }
        ]);
        const controller = mover.start();
        await controller!.onEnd;

        expect(tile.setPosCalls).toEqual([
            { x: 1, y: 0 },
            { x: 5, y: 5 }
        ]);
    });

    // 验证 clear 清空尚未执行的步骤队列
    it('clears queued steps before starting', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.step(FaceDirection.Right).clear();
        const controller = mover.start();
        await controller!.onEnd;

        expect(tile.setPosCalls).toEqual([]);
    });

    // 验证已有移动进行中时 start 返回 null，结束后 moving 复位
    it('returns null while a move is already in progress', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        const first = mover.step(FaceDirection.Right).start();
        expect(first).not.toBeNull();

        const second = mover.start();
        expect(second).toBeNull();

        await first!.onEnd;
        expect(first!.done).toBe(true);
        expect(mover.moving).toBe(false);
    });

    // 验证控制器 stop 会阻止队列中剩余步骤执行
    it('stops the move before executing queued steps', async () => {
        const tile = new TestTile();
        const mover = createMover(tile);

        mover.step(FaceDirection.Right, 3);
        const controller = mover.start();
        expect(controller).not.toBeNull();

        await controller!.stop();

        expect(tile.setPosCalls).toEqual([]);
        expect(controller!.done).toBe(true);
    });
});
