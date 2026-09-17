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

// 逐参数断言 JS 类型与值：先比 typeof 再比严格相等，避免 bigint、boolean 与 number 被宽松比较混淆
function expectParamTyped(
    actual: ReplayParamValue,
    expected: ReplayParamValue
): void {
    expect(typeof actual).toBe(typeof expected);
    expect(actual).toBe(expected);
}

// 断言单步的指令、逐参数类型与值以及索引：读流索引为位置 + 1，与 get 的从 0 起语义不同
function expectStepTyped(
    step: {
        command: number;
        params: readonly ReplayParamValue[];
        index: number;
    },
    command: number,
    params: readonly ReplayParamValue[],
    index: number
): void {
    expect(step.command).toBe(command);
    expect(step.params.length).toBe(params.length);
    params.forEach((param, i) => expectParamTyped(step.params[i], param));
    expect(step.index).toBe(index);
}

// 整数与浮点参数用例：值 → 期望参数类型 token（int64 见下方专门用例）
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
    [1.5, 6],
    [-1.5, 6]
];

// 异质命令序列：参数个数与类型各不相同（含 boolean、多位宽整数、float、string、bigint）
const heterogeneousSteps: ReadonlyArray<readonly [number, ReplayParamValue[]]> =
    [
        [1, [10]],
        [2, [true, 'x']],
        [3, []],
        [4, [100n]],
        [5, [1, -32769, 3]],
        [6, ['a'.repeat(300), 1.5]]
    ];

// 用异质命令序列填充一个全新录像数组，供多条用例复用同一份期望
function createHeterogeneousArray(): ReplayArray {
    const array = createArray();
    for (const [command, params] of heterogeneousSteps) {
        array.add(command, params);
    }
    return array;
}

// 仅经读取流验证的复杂序列：7 条命令、参数个数 1/2/0/1/4/2/3，覆盖各可正确编解码的类型与边界
const complexRouteSteps: ReadonlyArray<readonly [number, ReplayParamValue[]]> =
    [
        [1, [10]],
        [2, [true, 'x']],
        [3, []],
        [4, [100n]],
        [5, [1, -32769, 3, 1.5]],
        [6, ['a'.repeat(300), false]],
        [7, ['', -1, 127]]
    ];

// 用复杂序列填充一个全新录像数组（含中间起始索引读取的用例共用同一份期望）
function createComplexArray(): ReplayArray {
    const array = createArray();
    for (const [command, params] of complexRouteSteps) {
        array.add(command, params);
    }
    return array;
}

// 逐条比较读流与按索引读回：读流索引为位置 + 1、get 从 0 起，故只按指令与参数对应并对每参数断言类型
function expectHeterogeneousRead(
    array: ReplayArray,
    expectedSteps: ReadonlyArray<readonly [number, ReplayParamValue[]]>
): void {
    const stream = array.createReadStream(0);
    expect(stream.length).toBe(array.length);
    expectedSteps.forEach(([command, params], i) => {
        expectStepTyped(stream.read()!, command, params, i + 1);
        const step = array.get(i);
        expect(step.command).toBe(command);
        params.forEach((param, j) => expectParamTyped(step.params[j], param));
        expect(step.index).toBe(i);
    });
    expect(stream.index).toBe(expectedSteps.length);
    expect(stream.read()).toBeNull();
}

// 仅经读取流逐条验证异质序列：每参数类型与值、流索引 1..N 递进，末尾断言 null 与索引等于步数
function expectRouteStream(
    array: ReplayArray,
    expectedSteps: ReadonlyArray<readonly [number, ReplayParamValue[]]>
): void {
    const stream = array.createReadStream(0);
    expectedSteps.forEach(([command, params], i) => {
        expectStepTyped(stream.read()!, command, params, i + 1);
    });
    expect(stream.read()).toBeNull();
    expect(stream.index).toBe(expectedSteps.length);
}

// 执行越界编辑并对比前后全部可观测状态：长度、两个缓冲区字节与每一步解码结果，返回本次告警码
function expectArrayUnchanged(array: ReplayArray, run: () => void): number[] {
    const length = array.length;
    const commands = new Uint8Array(array.getCommandArray()).slice();
    const params = new Uint8Array(array.getParamArray()).slice();
    const steps = Array.from({ length }, (_, i) => array.get(i));

    const { info } = logger.catch(run);

    expect(array.length).toBe(length);
    expect(new Uint8Array(array.getCommandArray())).toEqual(commands);
    expect(new Uint8Array(array.getParamArray())).toEqual(params);
    expect(
        Array.from({ length: array.length }, (_, i) => array.get(i))
    ).toEqual(steps);

    return info.map(v => v.code!);
}

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

    // 验证 delete 中间步骤后索引数组按删除位置回退，后续步骤仍读到正确参数
    it('deletes a middle step and shifts later param indexes', () => {
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

describe('ReplayArray set index maintenance', () => {
    // 验证中间步 set 增长参数编码长度后其后步骤的索引同步平移，逐步读回命令与参数均正确（CR-01）
    it('keeps later steps readable after a middle set grows the param length', () => {
        const array = createArray();
        array.add(1, [1]);
        array.add(2, [2]);
        array.add(3, [30]);

        array.set(1, 5, [true, true, true]);

        expect(array.length).toBe(3);
        expect(array.get(0)).toEqual({ command: 1, params: [1], index: 0 });
        expect(array.get(1)).toEqual({
            command: 5,
            params: [true, true, true],
            index: 1
        });
        expect(array.get(2)).toEqual({ command: 3, params: [30], index: 2 });
    });

    // 验证中间步 set 缩短参数编码长度后后续参数字节前移，且末位残留字节被清零
    it('keeps later steps readable after a middle set shrinks the param length', () => {
        const array = createArray();
        array.add(1, [1]);
        array.add(2, [2]);
        array.add(3, [30]);

        array.set(1, 5, []);

        expect(array.length).toBe(3);
        expect(array.get(0)).toEqual({ command: 1, params: [1], index: 0 });
        expect(array.get(1)).toEqual({ command: 5, params: [], index: 1 });
        expect(array.get(2)).toEqual({ command: 3, params: [30], index: 2 });
    });

    // 验证末步 set 增长参数时以 paramUsed 作为参数终点，不产生位移，且之后仍能正确追加
    it('sets the last step with more params and appends afterwards', () => {
        const array = createArray();
        array.add(1, [1]);
        array.add(2, [2]);

        array.set(1, 5, [true, true, true]);

        expect(array.length).toBe(2);
        expect(array.get(0)).toEqual({ command: 1, params: [1], index: 0 });
        expect(array.get(1)).toEqual({
            command: 5,
            params: [true, true, true],
            index: 1
        });

        array.add(3, [30]);
        expect(array.get(2)).toEqual({ command: 3, params: [30], index: 2 });
    });

    // 验证末步 set 缩短参数后 paramUsed 相应减少，后续追加的参数落在正确偏移上
    it('sets the last step with fewer params and appends afterwards', () => {
        const array = createArray();
        array.add(1, [1]);
        array.add(2, [300, 400, 500]);

        array.set(1, 5, [7]);

        expect(array.get(0)).toEqual({ command: 1, params: [1], index: 0 });
        expect(array.get(1)).toEqual({ command: 5, params: [7], index: 1 });

        array.add(3, [30]);
        expect(array.get(2)).toEqual({ command: 3, params: [30], index: 2 });
    });

    // 验证中间步 set 增长参数后，读取流逐条读回与按索引读回结果一致
    it('reads every step through a read stream after a growing set', () => {
        const array = createArray();
        array.add(1, [10]);
        array.add(2, [20]);
        array.add(3, [30]);
        array.set(1, 5, [true, 'ab', 300]);

        const expected: ReadonlyArray<readonly [number, ReplayParamValue[]]> = [
            [1, [10]],
            [5, [true, 'ab', 300]],
            [3, [30]]
        ];
        const stream = array.createReadStream(0);
        expected.forEach(([command, params], i) => {
            expectStepTyped(stream.read()!, command, params, i + 1);
            const step = array.get(i);
            expect(step.command).toBe(command);
            params.forEach((param, j) =>
                expectParamTyped(step.params[j], param)
            );
        });
        expect(stream.read()).toBeNull();
        expect(stream.index).toBe(3);
    });

    // 验证末步 set 改变参数长度后，读取流仍能读完两步并在末尾返回 null
    it('reads every step through a read stream after setting the last step', () => {
        const array = createArray();
        array.add(1, [10]);
        array.add(2, [20]);

        array.set(1, 5, [true, true, true, true, true]);

        const stream = array.createReadStream(0);
        expectStepTyped(stream.read()!, 1, [10], 1);
        expectStepTyped(stream.read()!, 5, [true, true, true, true, true], 2);
        expect(stream.read()).toBeNull();
        expect(stream.index).toBe(2);
    });
});

describe('ReplayArray index bounds', () => {
    // 验证 insert 传入当前总步数时按末尾追加处理，追加后按索引与读流读回结果一致
    it('appends when the insert index equals the current length', () => {
        const array = createArray();
        array.add(1, [10]);
        array.add(2, [20]);

        array.insert(array.length, 3, [30]);

        expect(array.length).toBe(3);
        expect(array.get(2)).toEqual({ command: 3, params: [30], index: 2 });
        const stream = array.createReadStream(0);
        expectStepTyped(stream.read()!, 1, [10], 1);
        expectStepTyped(stream.read()!, 2, [20], 2);
        expectStepTyped(stream.read()!, 3, [30], 3);
        expect(stream.read()).toBeNull();
    });

    // 验证 insert 负索引与超出总步数的索引触发告警码 179 且不修改任何缓冲区内容
    it('warns code 179 and keeps the buffers unchanged for an out-of-range insert', () => {
        const array = createHeterogeneousArray();

        for (const index of [-1, array.length + 1]) {
            const codes = expectArrayUnchanged(array, () =>
                array.insert(index, 9, [true, 5])
            );
            expect(codes).toContain(179);
        }
    });

    // 验证 delete 负索引与等于总步数的索引触发告警码 179 且不修改任何缓冲区内容
    it('warns code 179 and keeps the buffers unchanged for an out-of-range delete', () => {
        const array = createHeterogeneousArray();

        for (const index of [-1, array.length]) {
            const codes = expectArrayUnchanged(array, () =>
                array.delete(index)
            );
            expect(codes).toContain(179);
        }
    });

    // 验证 set 负索引与等于总步数的索引触发告警码 179 且不修改任何缓冲区内容
    it('warns code 179 and keeps the buffers unchanged for an out-of-range set', () => {
        const array = createHeterogeneousArray();

        for (const index of [-1, array.length]) {
            const codes = expectArrayUnchanged(array, () =>
                array.set(index, 9, [true, 5])
            );
            expect(codes).toContain(179);
        }
    });

    // 验证空录像上的 delete 与 set 一律按越界处理，既不告警 179 之外的内容也不产生录像步
    it('treats every index as out of range on an empty route', () => {
        const array = createArray();

        for (const index of [0, -1]) {
            expect(
                expectArrayUnchanged(array, () => array.delete(index))
            ).toContain(179);
        }
        expect(
            expectArrayUnchanged(array, () => array.set(0, 1, [10]))
        ).toContain(179);
        expect(array.length).toBe(0);
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
        expect(firstParamToken(array)).toBe(7);
    });

    // 验证多字节 bigint 各幅值字节经 type 7 完整读回
    it('round-trips a multi-byte bigint', () => {
        const array = createArray();
        const value = 0x0102030405060708n;
        array.add(0, [value]);

        expect(array.get(0).params).toEqual([value]);
    });

    // 负 bigint 使用独立类型码 8，载荷为幅值 |n|，解码后取负（A9）
    it('round-trips negative bigint values through the dedicated type', () => {
        const negativeCases: readonly bigint[] = [
            -1n,
            -128n,
            -129n,
            -256n,
            -65537n
        ];

        for (const value of negativeCases) {
            const array = createArray();
            array.add(0, [value]);
            expectParamTyped(array.get(0).params[0], value);
            expect(firstParamToken(array)).toBe(8);
        }
    });

    // 非负 bigint 仍为 type 7，单字节与多字节幅值逐字节不变
    it('round-trips non-negative bigint values through type 7', () => {
        const nonNegativeCases: readonly bigint[] = [100n, 0x0102030405060708n];

        for (const value of nonNegativeCases) {
            const array = createArray();
            array.add(0, [value]);
            expectParamTyped(array.get(0).params[0], value);
            expect(firstParamToken(array)).toBe(7);
        }
    });

    // 验证超过 int32 范围的非负 int64 参数经 type 4 精确读回
    it('round-trips int64 values above the int32 range', () => {
        const array = createArray();
        array.add(0, [2147483648]);
        expect(array.get(0).params).toEqual([2147483648]);
    });

    // 负 int64 使用独立类型码 5，载荷为幅值 |n|，解码后取负（A8）；小负值仍走更窄的位宽类型
    it('round-trips negative int64 values through the dedicated type', () => {
        const negativeCases: ReadonlyArray<readonly [number, number]> = [
            [-1, 1],
            [-2147483649, 5],
            [-4294967297, 5]
        ];

        for (const [value, token] of negativeCases) {
            const array = createArray();
            array.add(0, [value]);
            expectParamTyped(array.get(0).params[0], value);
            expect(firstParamToken(array)).toBe(token);
        }
    });

    // 非负 int64 仍为 type 4，上界 2^53 - 1 精确读回，幅值编码逐位不变
    it('round-trips non-negative int64 values through type 4', () => {
        const nonNegativeCases: readonly number[] = [
            2147483648, 9007199254740991
        ];

        for (const value of nonNegativeCases) {
            const array = createArray();
            array.add(0, [value]);
            expectParamTyped(array.get(0).params[0], value);
            expect(firstParamToken(array)).toBe(4);
        }
    });

    // 验证多字节 bigint 与超 int32 的 int64 混在同一步时逐参数精确读回
    it('round-trips a heterogeneous step mixing a multi-byte bigint and an int64 value', () => {
        const array = createArray();
        array.add(0, [true, 0x0102030405060708n, 2147483648, 'x']);

        expect(array.get(0).params).toEqual([
            true,
            0x0102030405060708n,
            2147483648,
            'x'
        ]);
    });

    // 验证短字符串参数使用内联类型 token（长度 + 9）并读回一致
    it('round-trips a short string with an inline type token', () => {
        const array = createArray();
        array.add(0, ['hi']);

        expect(array.get(0).params).toEqual(['hi']);
        expect(firstParamToken(array)).toBe(11);
    });

    // 验证超过内联长度的字符串参数使用 type 9 并读回一致
    it('round-trips a long string through the length-prefixed type', () => {
        const array = createArray();
        const value = 'a'.repeat(300);
        array.add(0, [value]);

        expect(array.get(0).params).toEqual([value]);
        expect(firstParamToken(array)).toBe(9);
    });

    // 验证空字符串参数回退到 type 9 并读回为空串
    it('round-trips an empty string', () => {
        const array = createArray();
        array.add(0, ['']);

        expect(array.get(0).params).toEqual(['']);
        expect(firstParamToken(array)).toBe(9);
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

    // 验证 bigint 的长度字节边界值（2^2040 - 1）仍可完整读写且后续参数不错位
    it('round-trips the largest bigint that fits the length byte', () => {
        const array = createArray({
            initParamLength: 512,
            paramMaxLength: 4096
        });
        const value = 2n ** 2040n - 1n;
        array.add(0, [value, 7]);

        const params = array.get(0).params;
        expectParamTyped(params[0], value);
        expectParamTyped(params[1], 7);
        expect(firstParamToken(array)).toBe(7);
        // 长度字节为 255，与写入的幅值字节数一致
        expect(new Uint8Array(array.getParamArray())[1]).toBe(255);
    });

    // 验证 2^2040 及以上的 bigint 触发告警码 152 并丢弃该参数，命令与其余参数仍完整写入且计数一致
    it('drops the unrepresentable bigint param and keeps the rest of the command', () => {
        for (const value of [
            2n ** 2040n,
            2n ** 2041n,
            2n ** 2048n,
            -(2n ** 2040n)
        ]) {
            const array = createArray({
                initParamLength: 512,
                paramMaxLength: 4096
            });
            const { info } = logger.catch(() => array.add(0, [value, 7, 'x']));

            expect(info.map(v => v.code)).toContain(152);
            expect(array.length).toBe(1);
            expect(array.get(0).command).toBe(0);
            expect(array.get(0).params).toEqual([7, 'x']);
            // 命令计数与实际写入的参数个数一致
            expect(new Uint8Array(array.getCommandArray())[0]).toBe(2);
        }
    });

    // 验证被丢弃的 bigint 参数不影响读流：后续命令仍从正确偏移解码
    it('keeps the read stream aligned after dropping an unrepresentable bigint', () => {
        const array = createArray({
            initParamLength: 512,
            paramMaxLength: 4096
        });
        logger.catch(() => array.add(1, [2n ** 2041n, 7]));
        array.add(2, [20]);

        const stream = array.createReadStream(0);
        expectStepTyped(stream.read()!, 1, [7], 1);
        expectStepTyped(stream.read()!, 2, [20], 2);
        expect(stream.read()).toBeNull();
        expect(stream.index).toBe(2);
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

    // 验证 256 个参数的命令只写入截断后的计数 255，且后续命令仍能被读流正确读回
    it('writes the truncated param count when a command exceeds 255 params', () => {
        const array = createArray({
            initParamLength: 1024,
            paramMaxLength: 4096
        });
        const params = new Array<number>(256).fill(0);

        logger.catch(() => array.add(0, params));
        array.add(1, [9]);

        expect(new Uint8Array(array.getCommandArray())[0]).toBe(255);
        expect(array.get(0).params.length).toBe(255);

        const stream = array.createReadStream(0);
        const first = stream.read()!;
        expect(first.command).toBe(0);
        expect(first.params.length).toBe(255);
        expectStepTyped(stream.read()!, 1, [9], 2);
        expect(stream.read()).toBeNull();
    });

    // 验证 insert 与 set 同样写入截断后的参数计数，其后命令仍能正确读回
    it('writes the truncated param count through insert and set', () => {
        const params = new Array<number>(300).fill(0);

        const inserted = createArray({
            initParamLength: 1024,
            paramMaxLength: 4096
        });
        inserted.add(1, [9]);
        logger.catch(() => inserted.insert(1, 2, params));
        inserted.add(3, [8]);

        expect(new Uint8Array(inserted.getCommandArray())[2]).toBe(255);
        expect(inserted.get(1).params.length).toBe(255);
        const insertedStream = inserted.createReadStream(0);
        expectStepTyped(insertedStream.read()!, 1, [9], 1);
        expect(insertedStream.read()!.params.length).toBe(255);
        expectStepTyped(insertedStream.read()!, 3, [8], 3);
        expect(insertedStream.read()).toBeNull();

        const replaced = createArray({
            initParamLength: 1024,
            paramMaxLength: 4096
        });
        replaced.add(1, [9]);
        replaced.add(2, [20]);
        logger.catch(() => replaced.set(0, 2, params));

        expect(new Uint8Array(replaced.getCommandArray())[0]).toBe(255);
        expect(replaced.get(0).params.length).toBe(255);
        const replacedStream = replaced.createReadStream(0);
        expect(replacedStream.read()!.params.length).toBe(255);
        expectStepTyped(replacedStream.read()!, 2, [20], 2);
        expect(replacedStream.read()).toBeNull();
    });
});

describe('ReplayArray stream and buffer combination', () => {
    // 验证 createReadStream 从起始索引顺序读回多步，每参数为 number 且流索引逐次递进，末尾返回 null
    it('reads a sequence of steps through a read stream', () => {
        const array = createArray();
        array.add(1, [10]);
        array.add(2, [20]);
        array.add(3, [30]);

        const stream = array.createReadStream(0);
        expect(stream.index).toBe(0);
        expect(stream.length).toBe(3);
        for (let i = 0; i < 3; i++) {
            const step = stream.read()!;
            expect(step).toEqual({
                command: i + 1,
                params: [(i + 1) * 10],
                index: i + 1
            });
            expect(typeof step.params[0]).toBe('number');
            expect(step.params[0]).toBe((i + 1) * 10);
            expect(stream.index).toBe(i + 1);
        }
        expect(stream.read()).toBeNull();
    });

    // 验证 createReadStream 可从指定起始索引开始读取
    it('starts a read stream at the given index', () => {
        const array = createArray();
        array.add(1, []);
        array.add(2, []);
        array.add(3, []);

        const stream = array.createReadStream(2);
        expect(stream.read()).toEqual({ command: 3, params: [], index: 3 });
        expect(stream.read()).toBeNull();
    });

    // 验证复杂序列仅经读取流逐条读回：每参数类型与值严格一致、索引 1..7 递进、末尾为 null
    it('reads a heterogeneous route exclusively through a read stream', () => {
        const array = createComplexArray();
        const stream = array.createReadStream(0);

        expect(stream.length).toBe(7);
        expect(stream.index).toBe(0);
        complexRouteSteps.forEach(([command, params], position) => {
            const step = stream.read()!;
            expectStepTyped(step, command, params, position + 1);
            expect(stream.index).toBe(position + 1);
        });
        expect(stream.read()).toBeNull();
        expect(stream.index).toBe(7);
    });

    // 验证复杂序列可从中间起始索引仅经读取流读回原第 4..7 步，索引为 4..7 且末尾为 null
    it('starts a complex route read stream at a middle index', () => {
        const array = createComplexArray();
        const stream = array.createReadStream(3);

        expect(stream.index).toBe(3);
        complexRouteSteps.slice(3).forEach(([command, params], offset) => {
            const step = stream.read()!;
            expectStepTyped(step, command, params, offset + 4);
            expect(stream.index).toBe(offset + 4);
        });
        expect(stream.read()).toBeNull();
        expect(stream.index).toBe(7);

        const tail = array.createReadStream(6);
        expectStepTyped(tail.read()!, 7, complexRouteSteps[6][1], 7);
        expect(tail.read()).toBeNull();
    });

    // 验证 6 条参数个数与类型各异的命令经读流与按索引读回均逐条一致
    it('reads back a heterogeneous command sequence through both the stream and get', () => {
        const array = createHeterogeneousArray();

        expect(array.length).toBe(6);
        expectHeterogeneousRead(array, heterogeneousSteps);
        expect(array.createReadStream(0).read()!.index).toBe(1);
        expect(array.get(0).index).toBe(0);
    });

    // 验证加宽到 uint16 后 6 条异质命令仍可逐条读回一致
    it('reads back the heterogeneous sequence after widening to uint16', () => {
        const array = createHeterogeneousArray();
        array.setCommandWidth(ReplayCommandWidth.Uint16);

        expect(array.commandWidth).toBe(ReplayCommandWidth.Uint16);
        expectHeterogeneousRead(array, heterogeneousSteps);
    });

    // 验证异质序列删除首步后剩余步骤经按索引与读流读回均一致
    it('reads back a heterogeneous sequence after deleting its first step', () => {
        const array = createHeterogeneousArray();
        array.delete(0);

        expect(array.length).toBe(5);
        expect(array.get(0)).toEqual({
            command: 2,
            params: [true, 'x'],
            index: 0
        });
        expectHeterogeneousRead(array, heterogeneousSteps.slice(1));
    });

    // 验证 insert 后参数缓冲区后移，读流按新次序精确读回
    it('reads the new order after inserting a step', () => {
        const array = createArray();
        array.add(1, [10]);
        array.add(3, [30]);
        array.insert(1, 2, [20]);

        const stream = array.createReadStream(0);
        expect(stream.read()).toEqual({ command: 1, params: [10], index: 1 });
        expect(stream.read()).toEqual({ command: 2, params: [20], index: 2 });
        expect(stream.read()).toEqual({ command: 3, params: [30], index: 3 });
    });

    // 验证异质序列删除中间步后索引按删除位置回退，读流按新次序精确读回
    it('reads the new order after deleting a middle step from a heterogeneous route', () => {
        const array = createHeterogeneousArray();
        array.delete(1);

        expect(array.length).toBe(5);
        const remaining = heterogeneousSteps.filter(
            (_, stepIndex) => stepIndex !== 1
        );
        expectRouteStream(array, remaining);
    });

    // 验证 insert 的参数与索引位移方向一致，异质序列插入后按新次序精确读回
    it('reads the new order after inserting a step into a heterogeneous route', () => {
        const array = createHeterogeneousArray();
        array.insert(2, 9, [true, 5]);

        expect(array.length).toBe(7);
        const reordered: ReadonlyArray<readonly [number, ReplayParamValue[]]> =
            [
                heterogeneousSteps[0],
                heterogeneousSteps[1],
                [9, [true, 5]],
                heterogeneousSteps[2],
                heterogeneousSteps[3],
                heterogeneousSteps[4],
                heterogeneousSteps[5]
            ];
        expectRouteStream(array, reordered);
    });

    // 验证 getCommandArray 与 getParamArray 暴露内部缓冲区的直接内容
    it('exposes the underlying command and param buffers', () => {
        const array = createArray();
        array.add(3, [1]);

        const commands = new Uint8Array(array.getCommandArray());
        const params = new Uint8Array(array.getParamArray());
        expect(array.getCommandArray()).toBeInstanceOf(ArrayBuffer);
        expect(commands[0]).toBe(1);
        expect(commands[1]).toBe(3);
        expect(params[0]).toBe(1);
        expect(params[1]).toBe(1);
    });

    // 验证 setReplayArray 装载原始缓冲区并重建索引后可读回步骤
    it('loads raw buffers through setReplayArray and reads them back', () => {
        const source = createArray();
        source.add(1, [10]);
        source.add(2, [20]);

        const loaded = createArray();
        loaded.setReplayArray(
            ReplayCommandWidth.Uint8,
            source.getCommandArray().slice(0, 4),
            source.getParamArray().slice(0, 4),
            2
        );

        expect(loaded.length).toBe(2);
        expect(loaded.get(0)).toEqual({ command: 1, params: [10], index: 0 });
        expect(loaded.get(1)).toEqual({ command: 2, params: [20], index: 1 });
    });

    // 验证 rebuildIndexArray 幂等，重复重建后读回结果不变
    it('rebuilds the index array idempotently', () => {
        const array = createArray();
        array.add(5, ['a', 7]);
        array.add(6, []);
        const before = array.get(1);

        array.rebuildIndexArray();

        expect(array.get(1)).toEqual(before);
        expect(array.get(0)).toEqual({
            command: 5,
            params: ['a', 7],
            index: 0
        });
    });

    // 验证 setCommandWidth 加宽到 uint16 后指令与参数仍能读回
    it('re-encodes commands when widening to uint16', () => {
        const array = createArray();
        array.add(1, [10]);
        array.add(200, ['x']);
        array.setCommandWidth(ReplayCommandWidth.Uint16);

        expect(array.commandWidth).toBe(ReplayCommandWidth.Uint16);
        expect(array.get(0)).toEqual({ command: 1, params: [10], index: 0 });
        expect(array.get(1)).toEqual({ command: 200, params: ['x'], index: 1 });
    });

    // 验证 setCommandWidth 可从 uint16 缩回 uint8 且不影响合法指令
    it('narrows commands back to uint8', () => {
        const array = createArray({
            commandWidth: ReplayCommandWidth.Uint16
        });
        array.add(200, [7]);
        array.setCommandWidth(ReplayCommandWidth.Uint8);

        expect(array.commandWidth).toBe(ReplayCommandWidth.Uint8);
        expect(array.get(0)).toEqual({ command: 200, params: [7], index: 0 });
    });
});

describe('ReplayArray expand and width warnings', () => {
    // 验证扩容乘数小于 1 时触发告警码 149 并回退为默认倍率
    it('warns code 149 for an illegal expand multiplier', () => {
        const { info } = logger.catch(() =>
            createArray({
                commandExpandMultiplier: 0,
                paramExpandMultiplier: 0
            })
        );

        expect(info.map(v => v.code)).toEqual([149, 149]);
    });

    // 验证指令数组达到上限后触发告警码 150
    it('warns code 150 when the command array is full', () => {
        const array = createArray({
            initCommandLength: 10,
            commandMaxLength: 10
        });

        const { info } = logger.catch(() => {
            array.add(1, []);
            array.add(2, []);
            array.add(3, []);
        });

        expect(info.map(v => v.code)).toContain(150);
    });

    // 验证从 uint16 缩回 uint8 时超出 255 的指令触发告警码 154
    it('warns code 154 when narrowing a command above 255', () => {
        const array = createArray({
            commandWidth: ReplayCommandWidth.Uint16
        });
        array.add(300, []);

        const { info } = logger.catch(() =>
            array.setCommandWidth(ReplayCommandWidth.Uint8)
        );

        expect(info.map(v => v.code)).toContain(154);
        expect(array.commandWidth).toBe(ReplayCommandWidth.Uint8);
    });

    // 验证录像被修改后读取流过期并触发告警码 155
    it('warns code 155 when reading an expired stream', () => {
        const array = createArray();
        array.add(1, []);
        const stream = array.createReadStream(0);
        array.add(2, []);

        const { info } = logger.catch(() => stream.read());

        expect(stream.expired).toBe(true);
        expect(info.map(v => v.code)).toContain(155);
    });

    // 验证复杂序列 add 变更后既有读流过期并告警 155，新建读流按新次序逐条类型化读回 7 步
    it('expires a read stream after the heterogeneous route is mutated', () => {
        const array = createHeterogeneousArray();
        const stream = array.createReadStream(0);
        expectStepTyped(stream.read()!, 1, [10], 1);
        expectStepTyped(stream.read()!, 2, [true, 'x'], 2);

        array.add(7, ['z']);

        expect(stream.expired).toBe(true);
        const { info } = logger.catch(() => stream.read());
        expect(info.map(v => v.code)).toContain(155);

        const expectedSteps: ReadonlyArray<
            readonly [number, ReplayParamValue[]]
        > = [...heterogeneousSteps, [7, ['z']]];
        const fresh = array.createReadStream(0);
        expectedSteps.forEach(([command, params], i) => {
            expectStepTyped(fresh.read()!, command, params, i + 1);
        });
        expect(fresh.read()).toBeNull();
        expect(fresh.index).toBe(7);
    });

    // 验证初始容量不足时自动扩容，扩容后仍能顺序读回每一步且流索引逐次递进
    it('expands buffers and still reads every step back', () => {
        const array = createArray({
            initCommandLength: 2,
            initParamLength: 8
        });
        for (let i = 0; i < 15; i++) {
            array.add(i, [i]);
        }

        expect(array.length).toBe(15);
        const stream = array.createReadStream(0);
        for (let i = 0; i < 15; i++) {
            const step = stream.read()!;
            expect(step).toEqual({
                command: i,
                params: [i],
                index: i + 1
            });
            expect(typeof step.params[0]).toBe('number');
            expect(step.params[0]).toBe(i);
            expect(stream.index).toBe(i + 1);
        }
        expect(stream.read()).toBeNull();
    });
});

describe('ReplayArray disable and revert', () => {
    // 验证禁用后录像操作被忽略，恢复后录像继续记录
    it('ignores recording while disabled and resumes after revert', () => {
        const array = createArray();
        array.add(1, [10]);

        array.disable();
        array.add(2, [20]);
        expect(array.length).toBe(1);

        array.revert();
        array.add(3, [30]);
        expect(array.length).toBe(2);
        expect(array.get(1)).toEqual({ command: 3, params: [30], index: 1 });
    });
});
