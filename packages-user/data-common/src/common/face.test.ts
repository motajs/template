// 测试 L0 RoleFaceBinder 的朝向分配、绑定与查询（含码 43/44 告警）
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FaceDirection } from './types';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
});

interface TestModules {
    RoleFaceBinder: typeof import('./face').RoleFaceBinder;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const faceModule = await import('./face');
    const commonModule = await import('@motajs/common');
    modules = {
        RoleFaceBinder: faceModule.RoleFaceBinder,
        logger: commonModule.logger
    };
});

/** 创建一个朝向绑定器实例 */
function createBinder() {
    return new modules.RoleFaceBinder();
}

describe('RoleFaceBinder malloc and bind', () => {
    // 验证 malloc 建立主朝向后可查询主朝向及该朝向的图块
    it('registers the main face of a block', () => {
        const binder = createBinder();
        binder.malloc(1, FaceDirection.Down);

        expect(binder.getMainFace(1)).toEqual({
            identifier: 1,
            face: FaceDirection.Down
        });
        expect(binder.getFaceDirection(1)).toBe(FaceDirection.Down);
        expect(binder.getFaceOf(1, FaceDirection.Down)).toEqual({
            identifier: 1,
            face: FaceDirection.Down
        });
    });

    // 验证 bind 将另一朝向图块绑定到主图块并共享朝向映射
    it('binds a face block to its main block', () => {
        const binder = createBinder();
        binder.malloc(1, FaceDirection.Down);
        binder.bind(2, 1, FaceDirection.Up);

        expect(binder.getMainFace(2)).toEqual({
            identifier: 2,
            face: FaceDirection.Down
        });
        expect(binder.getFaceDirection(2)).toBe(FaceDirection.Up);
        expect(binder.getFaceOf(1, FaceDirection.Up)).toEqual({
            identifier: 2,
            face: FaceDirection.Up
        });
        expect(binder.getFaceOf(2, FaceDirection.Down)).toEqual({
            identifier: 1,
            face: FaceDirection.Down
        });
    });

    // 验证绑定未知主图块时经 logger 观测错误码 43 且不建立绑定
    it('warns code 43 for an unknown main block', () => {
        const binder = createBinder();

        const result = modules.logger.catch(() =>
            binder.bind(2, 99, FaceDirection.Up)
        );

        expect(result.info.map(info => info.code)).toContain(43);
        expect(binder.getMainFace(2)).toBeNull();
        expect(binder.getFaceDirection(2)).toBeUndefined();
    });

    // 验证绑定与主朝向相同朝向时经 logger 观测错误码 44 且不建立绑定
    it('warns code 44 when binding the main direction', () => {
        const binder = createBinder();
        binder.malloc(1, FaceDirection.Down);

        const result = modules.logger.catch(() =>
            binder.bind(2, 1, FaceDirection.Down)
        );

        expect(result.info.map(info => info.code)).toContain(44);
        expect(binder.getMainFace(2)).toBeNull();
        expect(binder.getFaceDirection(2)).toBeUndefined();
    });
});

describe('RoleFaceBinder queries', () => {
    // 验证 getFaceOf 对未绑定朝向与未知图块均返回 null
    it('returns null for an unbound face or an unknown block', () => {
        const binder = createBinder();
        binder.malloc(1, FaceDirection.Down);

        expect(binder.getFaceOf(1, FaceDirection.Up)).toBeNull();
        expect(binder.getFaceOf(99, FaceDirection.Down)).toBeNull();
    });

    // 验证 getFaceDirection 对未注册图块返回 undefined
    it('returns undefined direction for an unknown block', () => {
        const binder = createBinder();

        expect(binder.getFaceDirection(42)).toBeUndefined();
    });

    // 验证 getMainFace 对未注册图块返回 null
    it('returns null main face for an unknown block', () => {
        const binder = createBinder();

        expect(binder.getMainFace(42)).toBeNull();
    });
});
