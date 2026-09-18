// 测试 L0 FaceManager 注册表与内建 4/8 方向处理器的方向语义
import { describe, expect, it } from 'vitest';
import { FaceDirection } from './types';
import { Dir4FaceHandler, Dir8FaceHandler, FaceManager } from './faceManager';

/** 创建内建的 4 方向与 8 方向处理器 */
function createHandler() {
    return {
        dir4: new Dir4FaceHandler(),
        dir8: new Dir8FaceHandler()
    };
}

describe('FaceManager registry', () => {
    // 验证按数字 key 与字符串 id 注册后都能查回同一处理器
    it('returns the registered handler by group and id', () => {
        const manager = new FaceManager();
        const { dir4, dir8 } = createHandler();
        manager.register(1, dir8);
        manager.registerById('four', dir4);

        expect(manager.get<FaceDirection>(1)).toBe(dir8);
        expect(manager.getById<FaceDirection>('four')).toBe(dir4);
    });

    // 验证查询未注册的 key 或 id 时返回 null
    it('returns null for an unknown group and id', () => {
        const manager = new FaceManager();

        expect(manager.get<FaceDirection>(9)).toBeNull();
        expect(manager.getById<FaceDirection>('missing')).toBeNull();
    });
});

describe('Dir8FaceHandler', () => {
    // 验证 degrade 对任意输入原样透传
    it('passes degrade through unchanged', () => {
        const { dir8 } = createHandler();

        expect(dir8.degrade(FaceDirection.LeftUp)).toBe(FaceDirection.LeftUp);
        expect(dir8.degrade(123)).toBe(123);
    });

    // 验证 movement 对全部八个方向及未知返回单步偏移量
    it('returns the single-step offset for every direction', () => {
        const { dir8 } = createHandler();

        expect(dir8.movement(FaceDirection.Left)).toEqual({ x: -1, y: 0 });
        expect(dir8.movement(FaceDirection.Up)).toEqual({ x: 0, y: -1 });
        expect(dir8.movement(FaceDirection.Right)).toEqual({ x: 1, y: 0 });
        expect(dir8.movement(FaceDirection.Down)).toEqual({ x: 0, y: 1 });
        expect(dir8.movement(FaceDirection.LeftUp)).toEqual({ x: -1, y: -1 });
        expect(dir8.movement(FaceDirection.RightUp)).toEqual({ x: 1, y: -1 });
        expect(dir8.movement(FaceDirection.LeftDown)).toEqual({ x: -1, y: 1 });
        expect(dir8.movement(FaceDirection.RightDown)).toEqual({ x: 1, y: 1 });
        expect(dir8.movement(FaceDirection.Unknown)).toEqual({ x: 0, y: 0 });
    });

    // 验证越界方向输入返回零偏移量
    it('returns the zero offset for an out-of-range direction', () => {
        const { dir8 } = createHandler();

        expect(dir8.movement(999)).toEqual({ x: 0, y: 0 });
    });

    // 验证 move 按步数缩放偏移量，负步数得到反向位移
    it('scales the offset by the step count including negatives', () => {
        const { dir8 } = createHandler();

        expect(dir8.move(FaceDirection.Right, 3)).toEqual({ x: 3, y: 0 });
        expect(dir8.move(FaceDirection.RightUp, 2)).toEqual({ x: 2, y: -2 });
        expect(dir8.move(FaceDirection.RightUp, -2)).toEqual({ x: -2, y: 2 });
    });

    // 验证 opposite 返回反方向，未知朝向返回未知
    it('returns the opposite direction including unknown', () => {
        const { dir8 } = createHandler();

        expect(dir8.opposite(FaceDirection.Up)).toBe(FaceDirection.Down);
        expect(dir8.opposite(FaceDirection.Left)).toBe(FaceDirection.Right);
        expect(dir8.opposite(FaceDirection.LeftUp)).toBe(
            FaceDirection.RightDown
        );
        expect(dir8.opposite(FaceDirection.RightUp)).toBe(
            FaceDirection.LeftDown
        );
        expect(dir8.opposite(FaceDirection.Unknown)).toBe(
            FaceDirection.Unknown
        );
    });

    // 验证 next 默认顺时针、传入参数时逆时针，未知朝向透传
    it('rotates clockwise by default and anticlockwise on request', () => {
        const { dir8 } = createHandler();

        expect(dir8.next(FaceDirection.Up)).toBe(FaceDirection.RightUp);
        expect(dir8.next(FaceDirection.LeftUp)).toBe(FaceDirection.Up);
        expect(dir8.next(FaceDirection.Up, true)).toBe(FaceDirection.LeftUp);
        expect(dir8.next(FaceDirection.LeftUp, true)).toBe(FaceDirection.Left);
        expect(dir8.next(FaceDirection.Unknown)).toBe(FaceDirection.Unknown);
        expect(dir8.next(FaceDirection.Unknown, true)).toBe(
            FaceDirection.Unknown
        );
    });

    // 验证 mapDirection 与 mapMovement 迭代全部九个方向且未知为零偏移
    it('maps every direction together with its movement', () => {
        const { dir8 } = createHandler();

        expect([...dir8.mapDirection()]).toEqual([
            FaceDirection.Unknown,
            FaceDirection.Left,
            FaceDirection.Up,
            FaceDirection.Right,
            FaceDirection.Down,
            FaceDirection.LeftUp,
            FaceDirection.RightUp,
            FaceDirection.LeftDown,
            FaceDirection.RightDown
        ]);

        const movements = [...dir8.mapMovement()];
        expect(movements).toHaveLength(9);
        expect(movements[0]).toEqual([FaceDirection.Unknown, { x: 0, y: 0 }]);
        expect(movements[8]).toEqual([FaceDirection.RightDown, { x: 1, y: 1 }]);
    });
});

describe('Dir4FaceHandler', () => {
    // 验证 degrade 把对角降级为对应正交方向，其余非法输入降级为未知
    it('degrades diagonals into orthogonal and the rest into unknown', () => {
        const { dir4 } = createHandler();

        expect(dir4.degrade(FaceDirection.LeftUp)).toBe(FaceDirection.Left);
        expect(dir4.degrade(FaceDirection.LeftDown)).toBe(FaceDirection.Left);
        expect(dir4.degrade(FaceDirection.RightUp)).toBe(FaceDirection.Right);
        expect(dir4.degrade(FaceDirection.RightDown)).toBe(FaceDirection.Right);
        expect(dir4.degrade(FaceDirection.Left)).toBe(FaceDirection.Left);
        expect(dir4.degrade(FaceDirection.Up)).toBe(FaceDirection.Up);
        expect(dir4.degrade(FaceDirection.Unknown)).toBe(FaceDirection.Unknown);
        expect(dir4.degrade(999)).toBe(FaceDirection.Unknown);
    });

    // 验证 movement、move、opposite 与 next 在四方向集合内正确工作
    it('computes movement, opposite and rotation on the four-way set', () => {
        const { dir4 } = createHandler();

        expect(dir4.movement(FaceDirection.Left)).toEqual({ x: -1, y: 0 });
        expect(dir4.movement(FaceDirection.RightUp)).toEqual({ x: 1, y: 0 });
        expect(dir4.movement(999)).toEqual({ x: 0, y: 0 });
        expect(dir4.move(FaceDirection.Down, 2)).toEqual({ x: 0, y: 2 });
        expect(dir4.move(FaceDirection.Right, 3)).toEqual({ x: 3, y: 0 });
        expect(dir4.opposite(FaceDirection.Up)).toBe(FaceDirection.Down);
        expect(dir4.opposite(FaceDirection.Unknown)).toBe(
            FaceDirection.Unknown
        );
        expect(dir4.next(FaceDirection.Up)).toBe(FaceDirection.Right);
        expect(dir4.next(FaceDirection.Up, true)).toBe(FaceDirection.Left);
        expect(dir4.next(FaceDirection.Unknown)).toBe(FaceDirection.Unknown);
    });

    // 验证 mapDirection 与 mapMovement 只迭代四个正交方向与未知
    it('maps only the four-way set plus unknown', () => {
        const { dir4 } = createHandler();

        expect([...dir4.mapDirection()]).toEqual([
            FaceDirection.Unknown,
            FaceDirection.Left,
            FaceDirection.Up,
            FaceDirection.Right,
            FaceDirection.Down
        ]);

        const movements = [...dir4.mapMovement()];
        expect(movements).toHaveLength(5);
        expect(movements[0]).toEqual([FaceDirection.Unknown, { x: 0, y: 0 }]);
    });
});
