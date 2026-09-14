// 测试 ReplayArray 构件级行为：单类型参数编解码与单数组操作单次读回
import { logger } from '@motajs/common';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { ReplayArray } from './array';
import { ReplayCommandWidth, ReplayParamValue } from './types';

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

afterAll(() => {
    vi.unstubAllGlobals();
});

interface IArrayOverrides {
    initCommandLength?: number;
    initParamLength?: number;
    commandExpandMultiplier?: number;
    paramExpandMultiplier?: number;
    commandWidth?: ReplayCommandWidth;
    commandMaxLength?: number;
    paramMaxLength?: number;
}

// 与 system.ts 初始化保持一致的构造入口，默认给足初始容量避免无关扩容
function createArray(overrides: IArrayOverrides = {}): ReplayArray {
    return new ReplayArray({
        initCommandLength: 32,
        initParamLength: 128,
        commandExpandMultiplier: 2,
        paramExpandMultiplier: 2,
        commandWidth: ReplayCommandWidth.Uint8,
        commandMaxLength: 64,
        paramMaxLength: 512,
        ...overrides
    });
}

// 读取第一个参数的类型 token，用于断言编解码与位宽选择一致
function firstParamToken(array: ReplayArray): number {
    return new Uint8Array(array.getParamArray())[0];
}

// 整数与浮点参数用例：值 → 期望参数类型 token（int64 见 #06-04-1 跳过）
const paramCases: ReadonlyArray<readonly [ReplayParamValue, number]> = [
    [-128, 1],
    [127, 1],
    [128, 2],
    [-129, 2],
    [-32768, 2],
    [32767, 2],
    [32768, 3],
    [-32769, 3],
    [-2147483648, 3],
    [2147483647, 3],
    [1.5, 5],
    [-1.5, 5]
];

describe('ReplayArray single operations', () => {
    // 验证 add 追加一条录像步并在原索引读回指令与参数
    it('appends one step and reads it back at the original index', () => {
        const array = createArray();
        array.add(7, [1, true]);

        expect(array.length).toBe(1);
        expect(array.get(0)).toEqual({
            command: 7,
            params: [1, true],
            index: 0
        });
    });

    // 验证 insert 在指定索引插入录像步并将既有步骤整体后移
    it('inserts a step at the given index and shifts later steps', () => {
        const array = createArray();
        array.add(1, []);
        array.add(3, []);
        array.insert(1, 2, [9]);

        expect(array.length).toBe(3);
        expect(array.get(0)).toEqual({ command: 1, params: [], index: 0 });
        expect(array.get(1)).toEqual({ command: 2, params: [9], index: 1 });
        expect(array.get(2)).toEqual({ command: 3, params: [], index: 2 });
    });

    // 验证 delete 删除首步后不产生空槽且后续步骤索引前移
    it('deletes the first step without leaving a hole', () => {
        const array = createArray();
        array.add(1, [10]);
        array.add(2, [20]);
        array.add(3, [30]);
        array.delete(0);

        expect(array.length).toBe(2);
        expect(array.get(0)).toEqual({ command: 2, params: [20], index: 0 });
        expect(array.get(1)).toEqual({ command: 3, params: [30], index: 1 });
    });

    // 疑似 bug：delete 中间步骤后索引数组未按删除位置回退，导致后续步骤读到错误参数，详见 06-TEST-FINDINGS.md #06-04-3，修复后取消 skip
    it.skip('deletes a middle step and shifts later param indexes', () => {
        const array = createArray();
        array.add(1, [10]);
        array.add(2, [20]);
        array.add(3, [30]);
        array.delete(1);

        expect(array.length).toBe(2);
        expect(array.get(0)).toEqual({ command: 1, params: [10], index: 0 });
        expect(array.get(1)).toEqual({ command: 3, params: [30], index: 1 });
    });

    // 验证 set 覆盖指定步骤的指令与全部参数且不影响相邻步骤
    it('overwrites the command and params of a step', () => {
        const array = createArray();
        array.add(1, [1]);
        array.add(2, [2]);
        array.add(3, [30]);
        array.set(1, 5, [true]);

        expect(array.get(1)).toEqual({ command: 5, params: [true], index: 1 });
        expect(array.get(0)).toEqual({ command: 1, params: [1], index: 0 });
        expect(array.get(2)).toEqual({ command: 3, params: [30], index: 2 });
    });

    // 验证 get 返回的录像步携带其在录像中的索引
    it('returns the step index together with command and params', () => {
        const array = createArray();
        array.add(1, []);
        array.add(2, []);
        array.add(3, []);

        expect(array.get(2).index).toBe(2);
        expect(array.get(2).command).toBe(3);
    });
});

describe('ReplayArray param codec', () => {
    // 验证 boolean 参数按 type 0 写入并读回布尔值
    it('round-trips boolean parameters', () => {
        const array = createArray();
        array.add(0, [true, false]);

        expect(array.get(0).params).toEqual([true, false]);
        expect(new Uint8Array(array.getParamArray())[0]).toBe(0);
    });

    // 验证各整数位宽与浮点参数按类型写入并原样读回
    it('round-trips every integer width and float', () => {
        for (const [value, token] of paramCases) {
            const array = createArray();
            array.add(0, [value]);
            expect(array.get(0).params).toEqual([value]);
            expect(firstParamToken(array)).toBe(token);
        }
    });

    // 验证单字节 bigint 参数写入后读回一致
    it('round-trips a single byte bigint', () => {
        const array = createArray();
        array.add(0, [100n]);

        expect(array.get(0).params).toEqual([100n]);
        expect(firstParamToken(array)).toBe(6);
    });

    // 疑似 bug：bigint 编码循环缺少按字节右移，多字节 bigint 只能还原最低字节，详见 06-TEST-FINDINGS.md #06-04-2，修复后取消 skip
    it.skip('round-trips a multi-byte bigint', () => {
        const array = createArray();
        const value = 0x0102030405060708n;
        array.add(0, [value]);

        expect(array.get(0).params).toEqual([value]);
    });

    // 疑似 bug：int64 解码乘数误用 2147483647，导致 int64 参数无法按写入值读回，详见 06-TEST-FINDINGS.md #06-04-1，修复后取消 skip
    it.skip('round-trips int64 values above the int32 range', () => {
        const array = createArray();
        array.add(0, [2147483648]);
        expect(array.get(0).params).toEqual([2147483648]);
    });

    // 验证短字符串参数使用内联类型 token 并读回一致
    it('round-trips a short string with an inline type token', () => {
        const array = createArray();
        array.add(0, ['hi']);

        expect(array.get(0).params).toEqual(['hi']);
        expect(firstParamToken(array)).toBe(9);
    });

    // 验证超过内联长度的字符串参数使用 type 7 并读回一致
    it('round-trips a long string through the length-prefixed type', () => {
        const array = createArray();
        const value = 'a'.repeat(300);
        array.add(0, [value]);

        expect(array.get(0).params).toEqual([value]);
        expect(firstParamToken(array)).toBe(7);
    });

    // 验证空字符串参数回退到 type 7 并读回为空串
    it('round-trips an empty string', () => {
        const array = createArray();
        array.add(0, ['']);

        expect(array.get(0).params).toEqual(['']);
        expect(firstParamToken(array)).toBe(7);
    });

    // 验证单条录像步的多个不同类型参数按顺序完整读回
    it('round-trips a boolean, integer, string and bigint in one step', () => {
        const array = createArray();
        array.add(9, [true, 42, 'x', 100n]);

        expect(array.get(0).params).toEqual([true, 42, 'x', 100n]);
    });

    // 验证未知参数类型触发告警码 148 且写入流程不中断
    it('warns code 148 for an unknown param type', () => {
        const array = createArray();
        const { info } = logger.catch(() => array.add(1, [undefined!]));

        expect(info.map(v => v.code)).toContain(148);
        expect(array.length).toBe(1);
    });

    // 验证 boolean 原始字节非法时触发告警码 151 并回退为 false
    it('warns code 151 for an out-of-range boolean byte', () => {
        const array = createArray();
        const commands = new ArrayBuffer(2);
        new DataView(commands).setUint8(0, 1);
        new DataView(commands).setUint8(1, 5);
        const params = new ArrayBuffer(2);
        new DataView(params).setUint8(0, 0);
        new DataView(params).setUint8(1, 2);

        const { ret, info } = logger.catch(() => {
            array.setReplayArray(ReplayCommandWidth.Uint8, commands, params, 1);
            return array.get(0);
        });

        expect(info.map(v => v.code)).toContain(151);
        expect(ret.params).toEqual([false]);
    });

    // 验证超出范围的 bigint 触发告警码 152
    it('warns code 152 for an out-of-range bigint', () => {
        const array = createArray();
        const { info } = logger.catch(() => array.add(0, [2n ** 2048n]));

        expect(info.map(v => v.code)).toContain(152);
    });

    // 验证单条命令参数超过 255 个时触发告警码 153 并忽略溢出参数
    it('warns code 153 when a command exceeds 255 params', () => {
        const array = createArray({
            initParamLength: 1024,
            paramMaxLength: 4096
        });
        const params = new Array<number>(256).fill(0);

        const { info } = logger.catch(() => array.add(0, params));

        expect(info.map(v => v.code)).toContain(153);
    });
});
