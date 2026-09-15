// 测试 L0 common 朝向工具纯函数：坐标偏移、降级、旋转与字符串解析
import { describe, expect, it } from 'vitest';
import { FaceDirection } from './types';
import {
    degradeFace,
    fromDirectionString,
    getFaceMovement,
    nextFaceDirection
} from './utils';

/** 全部朝向枚举值，用于校验方向表的完整覆盖 */
const ALL_DIRECTIONS: readonly FaceDirection[] = [
    FaceDirection.Unknown,
    FaceDirection.Left,
    FaceDirection.Up,
    FaceDirection.Right,
    FaceDirection.Down,
    FaceDirection.LeftUp,
    FaceDirection.RightUp,
    FaceDirection.LeftDown,
    FaceDirection.RightDown
];

/** 每个朝向对应的单步坐标偏移量 */
const FACE_MOVEMENTS: readonly [FaceDirection, Loc][] = [
    [FaceDirection.Unknown, { x: 0, y: 0 }],
    [FaceDirection.Left, { x: -1, y: 0 }],
    [FaceDirection.Up, { x: 0, y: -1 }],
    [FaceDirection.Right, { x: 1, y: 0 }],
    [FaceDirection.Down, { x: 0, y: 1 }],
    [FaceDirection.LeftUp, { x: -1, y: -1 }],
    [FaceDirection.RightUp, { x: 1, y: -1 }],
    [FaceDirection.LeftDown, { x: -1, y: 1 }],
    [FaceDirection.RightDown, { x: 1, y: 1 }]
];

describe('getFaceMovement', () => {
    // 验证全部朝向（含未知）都返回唯一且正确的坐标偏移量
    it('returns the coordinate offset for every face direction', () => {
        for (const [dir, movement] of FACE_MOVEMENTS) {
            expect(getFaceMovement(dir)).toEqual(movement);
        }
        expect(FACE_MOVEMENTS.map(item => item[0]).sort()).toEqual(
            [...ALL_DIRECTIONS].sort()
        );
    });
});

describe('degradeFace', () => {
    // 验证对角朝向降级为对应的左/右，正交朝向原样返回
    it('degrades diagonals into their orthogonal direction', () => {
        expect(degradeFace(FaceDirection.LeftUp)).toBe(FaceDirection.Left);
        expect(degradeFace(FaceDirection.LeftDown)).toBe(FaceDirection.Left);
        expect(degradeFace(FaceDirection.RightUp)).toBe(FaceDirection.Right);
        expect(degradeFace(FaceDirection.RightDown)).toBe(FaceDirection.Right);
        expect(degradeFace(FaceDirection.Left)).toBe(FaceDirection.Left);
        expect(degradeFace(FaceDirection.Right)).toBe(FaceDirection.Right);
        expect(degradeFace(FaceDirection.Up)).toBe(FaceDirection.Up);
        expect(degradeFace(FaceDirection.Down)).toBe(FaceDirection.Down);
    });

    // 验证未知朝向默认返回未知，且可经 unknown 参数自定义返回值
    it('maps unknown to the configurable fallback', () => {
        expect(degradeFace(FaceDirection.Unknown)).toBe(FaceDirection.Unknown);
        expect(degradeFace(FaceDirection.Unknown, FaceDirection.Down)).toBe(
            FaceDirection.Down
        );
    });
});

describe('nextFaceDirection', () => {
    // 验证四方向顺时针旋转顺序为上→右→下→左
    it('rotates four directions clockwise', () => {
        expect(nextFaceDirection(FaceDirection.Up)).toBe(FaceDirection.Right);
        expect(nextFaceDirection(FaceDirection.Right)).toBe(FaceDirection.Down);
        expect(nextFaceDirection(FaceDirection.Down)).toBe(FaceDirection.Left);
        expect(nextFaceDirection(FaceDirection.Left)).toBe(FaceDirection.Up);
    });

    // 验证四方向逆时针旋转顺序为上→左→下→右
    it('rotates four directions anticlockwise', () => {
        expect(nextFaceDirection(FaceDirection.Up, true)).toBe(
            FaceDirection.Left
        );
        expect(nextFaceDirection(FaceDirection.Left, true)).toBe(
            FaceDirection.Down
        );
        expect(nextFaceDirection(FaceDirection.Down, true)).toBe(
            FaceDirection.Right
        );
        expect(nextFaceDirection(FaceDirection.Right, true)).toBe(
            FaceDirection.Up
        );
    });

    // 验证四方向模式下对角朝向同样按九十度旋转
    it('rotates diagonal directions in four-way mode', () => {
        expect(nextFaceDirection(FaceDirection.LeftUp)).toBe(
            FaceDirection.RightUp
        );
        expect(nextFaceDirection(FaceDirection.RightUp)).toBe(
            FaceDirection.RightDown
        );
        expect(nextFaceDirection(FaceDirection.RightDown)).toBe(
            FaceDirection.LeftDown
        );
        expect(nextFaceDirection(FaceDirection.LeftDown)).toBe(
            FaceDirection.LeftUp
        );
    });

    // 验证八方向顺时针按四十五度依次推进一整圈
    it('rotates eight directions clockwise', () => {
        expect(nextFaceDirection(FaceDirection.Up, false, true)).toBe(
            FaceDirection.RightUp
        );
        expect(nextFaceDirection(FaceDirection.RightUp, false, true)).toBe(
            FaceDirection.Right
        );
        expect(nextFaceDirection(FaceDirection.Right, false, true)).toBe(
            FaceDirection.RightDown
        );
        expect(nextFaceDirection(FaceDirection.RightDown, false, true)).toBe(
            FaceDirection.Down
        );
        expect(nextFaceDirection(FaceDirection.Down, false, true)).toBe(
            FaceDirection.LeftDown
        );
        expect(nextFaceDirection(FaceDirection.LeftDown, false, true)).toBe(
            FaceDirection.Left
        );
        expect(nextFaceDirection(FaceDirection.Left, false, true)).toBe(
            FaceDirection.LeftUp
        );
        expect(nextFaceDirection(FaceDirection.LeftUp, false, true)).toBe(
            FaceDirection.Up
        );
    });

    // 验证八方向逆时针按四十五度依次回退一整圈
    it('rotates eight directions anticlockwise', () => {
        expect(nextFaceDirection(FaceDirection.Up, true, true)).toBe(
            FaceDirection.LeftUp
        );
        expect(nextFaceDirection(FaceDirection.LeftUp, true, true)).toBe(
            FaceDirection.Left
        );
        expect(nextFaceDirection(FaceDirection.Left, true, true)).toBe(
            FaceDirection.LeftDown
        );
        expect(nextFaceDirection(FaceDirection.LeftDown, true, true)).toBe(
            FaceDirection.Down
        );
        expect(nextFaceDirection(FaceDirection.Down, true, true)).toBe(
            FaceDirection.RightDown
        );
        expect(nextFaceDirection(FaceDirection.RightDown, true, true)).toBe(
            FaceDirection.Right
        );
        expect(nextFaceDirection(FaceDirection.Right, true, true)).toBe(
            FaceDirection.RightUp
        );
        expect(nextFaceDirection(FaceDirection.RightUp, true, true)).toBe(
            FaceDirection.Up
        );
    });

    // 验证未知朝向在所有旋转模式下都原样透传
    it('passes unknown through every rotation mode', () => {
        expect(nextFaceDirection(FaceDirection.Unknown)).toBe(
            FaceDirection.Unknown
        );
        expect(nextFaceDirection(FaceDirection.Unknown, true)).toBe(
            FaceDirection.Unknown
        );
        expect(nextFaceDirection(FaceDirection.Unknown, false, true)).toBe(
            FaceDirection.Unknown
        );
        expect(nextFaceDirection(FaceDirection.Unknown, true, true)).toBe(
            FaceDirection.Unknown
        );
    });
});

describe('fromDirectionString', () => {
    // 验证每个合法朝向字符串都解析为对应枚举值
    it('parses every direction string', () => {
        expect(fromDirectionString('left')).toBe(FaceDirection.Left);
        expect(fromDirectionString('right')).toBe(FaceDirection.Right);
        expect(fromDirectionString('up')).toBe(FaceDirection.Up);
        expect(fromDirectionString('down')).toBe(FaceDirection.Down);
        expect(fromDirectionString('leftup')).toBe(FaceDirection.LeftUp);
        expect(fromDirectionString('rightup')).toBe(FaceDirection.RightUp);
        expect(fromDirectionString('leftdown')).toBe(FaceDirection.LeftDown);
        expect(fromDirectionString('rightdown')).toBe(FaceDirection.RightDown);
    });

    // 验证无法识别的字符串回退为未知朝向
    it('falls back to unknown for an unrecognized string', () => {
        const invalid = 'sideways' as Dir2;
        expect(fromDirectionString(invalid)).toBe(FaceDirection.Unknown);
    });
});
