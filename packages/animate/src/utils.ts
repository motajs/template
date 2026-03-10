import { cumsum } from '@motajs/common';
import {
    ExcitationCurve,
    ExcitationCurve2D,
    ExcitationCurve3D,
    GeneralExcitationCurve,
    IExcitable
} from './types';

//#region 工具函数

/**
 * 将一个函数转换为可激励对象
 * @param func 激励函数
 * @param thisArg 激励函数执行时的 `this` 指向
 */
export function excited<T>(
    func: (payload: T) => void,
    thisArg?: unknown
): IExcitable<T> {
    if (thisArg) {
        return { excited: func.bind(thisArg) };
    } else {
        return { excited: func };
    }
}

//#endregion

//#region 曲线计算

/**
 * 曲线相加 `a(p) + b(p)`
 * @param curve1 加数
 * @param curve2 加数
 */
export function addCurve(
    curve1: ExcitationCurve,
    curve2: ExcitationCurve
): ExcitationCurve {
    return p => curve1(p) + curve2(p);
}

/**
 * 曲线相减 `a(p) - b(p)`
 * @param curve1 被减数
 * @param curve2 减数
 */
export function subCurve(
    curve1: ExcitationCurve,
    curve2: ExcitationCurve
): ExcitationCurve {
    return p => curve1(p) - curve2(p);
}

/**
 * 曲线相乘 `a(p) * b(p)`
 * @param curve1 乘数
 * @param curve2 乘数
 */
export function mulCurve(
    curve1: ExcitationCurve,
    curve2: ExcitationCurve
): ExcitationCurve {
    return p => curve1(p) * curve2(p);
}

/**
 * 曲线相除 `a(p) / b(p)`
 * @param curve1 乘数
 * @param curve2 乘数
 */
export function divCurve(
    curve1: ExcitationCurve,
    curve2: ExcitationCurve
): ExcitationCurve {
    return p => curve1(p) / curve2(p);
}

/**
 * 曲线取幂 `a(p) ** b(p)`
 * @param curve1 底数
 * @param curve2 指数
 */
export function powCurve(
    curve1: ExcitationCurve,
    curve2: ExcitationCurve
): ExcitationCurve {
    return p => curve1(p) ** curve2(p);
}

/**
 * 曲线组合，`a(b(p))`
 * @param curve1 外层曲线
 * @param curve2 内层曲线
 */
export function compositeCurve(
    curve1: ExcitationCurve,
    curve2: ExcitationCurve
): ExcitationCurve {
    return p => curve1(curve2(p));
}

/**
 * 平移曲线，`a(p) + b`
 * @param curve 曲线
 * @param move 纵轴平移量
 */
export function moveCurve(
    curve: ExcitationCurve,
    move: number = 0
): ExcitationCurve {
    return p => curve(p) + move;
}

/**
 * 曲线求相反数并平移，`b - a(p)`
 * @param curve 曲线
 * @param move 纵轴平移量
 */
export function oppsiteCurve(
    curve: ExcitationCurve,
    move: number = 0
): ExcitationCurve {
    return p => move - curve(p);
}

/**
 * 纵向缩放曲线，`a(p) * b`
 * @param curve 曲线
 * @param scale 缩放比例
 */
export function scaleCurve(
    curve: ExcitationCurve,
    scale: number = 1
): ExcitationCurve {
    return p => curve(p) * scale;
}

/**
 * 求曲线的倒数，并缩放，`g(x) = b / f(x)`
 * @param curve 曲线
 * @param scale 缩放比例
 */
export function reciprocalCurve(
    curve: ExcitationCurve,
    scale: number = 1
): ExcitationCurve {
    return p => scale / curve(p);
}

/**
 * 曲线拼接函数，将按照序列顺序依次调用曲线，序列长度过长（> 100）可能会导致性能下降
 * @param seq 曲线序列
 * @param duration 每个曲线的持续时长，范围在 `[0,1]` 之间，所有值之和应该是 1，否则超出 1 的部分不会被执行
 * @param scale 每个曲线拼接时的缩放比例
 * @param move 每个曲线拼接时在纵轴上的偏移量
 */
export function sequenceCurve(
    seq: ExcitationCurve[],
    duration: number[],
    scale: number[],
    move: number[]
): ExcitationCurve {
    const keep = cumsum(duration);
    return p => {
        const index = keep.findIndex(sum => p >= sum);
        if (index === -1) return 0;
        const progress = (p - keep[index]) / duration[index];
        return seq[index](progress) * scale[index] + move[index];
    };
}

/**
 * 将二维速率曲线分割为两个一维速率曲线
 * @param curve 二维速率曲线
 */
export function splitCurve2D(
    curve: ExcitationCurve2D
): [ExcitationCurve, ExcitationCurve] {
    return [p => curve(p)[0], p => curve(p)[1]];
}

/**
 * 将三维速率曲线分割为三个一维速率曲线
 * @param curve 三维速率曲线
 */
export function splitCurve3D(
    curve: ExcitationCurve3D
): [ExcitationCurve, ExcitationCurve, ExcitationCurve] {
    return [p => curve(p)[0], p => curve(p)[1], p => curve(p)[2]];
}

/**
 * 将 n 维速率曲线分割为 n 个一维速率曲线
 * @param curve n 维速率曲线
 */
export function splitCurve(curve: GeneralExcitationCurve): ExcitationCurve[] {
    const n = curve(0).length;
    const arr: ExcitationCurve[] = [];
    for (let i = 0; i < n; i++) {
        arr.push(p => curve(p)[i]);
    }
    return arr;
}

/**
 * 将两个一维速率曲线合并为一个二维速率曲线
 * @param curve1 第一个速率曲线
 * @param curve2 第二个速率曲线
 */
export function stackCurve2D(
    curve1: ExcitationCurve,
    curve2: ExcitationCurve
): ExcitationCurve2D {
    return p => [curve1(p), curve2(p)];
}

/**
 * 将三个一维速率曲线合并为一个三维速率曲线
 * @param curve1 第一个速率曲线
 * @param curve2 第二个速率曲线
 * @param curve3 第三个速率曲线
 */
export function stackCurve3D(
    curve1: ExcitationCurve,
    curve2: ExcitationCurve,
    curve3: ExcitationCurve
): ExcitationCurve3D {
    return p => [curve1(p), curve2(p), curve3(p)];
}

/**
 * 将 n 个一维速率曲线合并为一个 n 维速率曲线
 * @param curves 速率曲线列表
 */
export function stackCurve(curves: ExcitationCurve[]): GeneralExcitationCurve {
    return p => curves.map(v => v(p));
}

/**
 * 对速率曲线归一化，此函数假设传入的曲线单调，会使用 `curve(0)` 和 `curve(1)` 作为最大值或最小值。
 *
 * - `f(0) > f(1)`: `g(x) = (f(x) - f(0)) / (f(0) - f(1))`
 * - `f(0) < f(1)`: `g(x) = (f(x) - f(1)) / (f(1) - f(0))`
 * - `f(0) = f(1)`: `g(x) = f(x)`
 * @param curve 需要归一化的曲线
 * @returns
 */
export function normalize(curve: ExcitationCurve): ExcitationCurve {
    const head = curve(1);
    const tail = curve(0);
    if (head > tail) {
        const diff = head - tail;
        return p => (curve(p) - tail) / diff;
    } else if (head < tail) {
        const diff = tail - head;
        return p => (curve(p) - head) / diff;
    } else {
        return curve;
    }
}

//#endregion

//#region 内置曲线

export const enum CurveMode {
    /** 缓进快出 */
    EaseIn,
    /** 快进缓出 */
    EaseOut,
    /** 缓进缓出，中间快 */
    EaseInOut,
    /** 快进快出，中间缓 */
    EaseCenter
}

/** 输入缓进快出，输出缓进快出 */
function easeIn(curve: ExcitationCurve): ExcitationCurve {
    return curve;
}

/** 输入缓进快出，输出快进缓出 */
function easeOut(curve: ExcitationCurve): ExcitationCurve {
    return p => 1 - curve(1 - p);
}

/** 输入缓进快出，输出缓进缓出，中间快 */
function easeInOut(curve: ExcitationCurve): ExcitationCurve {
    return p => (p < 0.5 ? curve(p * 2) * 0.5 : 1 - curve((1 - p) * 2) * 0.5);
}

/** 输入缓进快出，输出快进快出，中间缓 */
function easeCenter(curve: ExcitationCurve): ExcitationCurve {
    return p =>
        p < 0.5
            ? 0.5 - curve(1 - p * 2) * 0.5
            : 0.5 + curve((p - 0.5) * 2) * 0.5;
}

/**
 * 实施曲线模式，传入曲线的缓进快出模式，根据传入的参数输出对应的模式
 * - `CurveMode.EaseIn`: `g(x) = f(x)`
 * - `CurveMode.EaseOut`: `g(x) = 1 - f(1 - x)`
 * - `CurveMode.EaseInOut`: `g(x) = 0.5 * f(2x) if x < 0.5 else 1 - 0.5 * f(2 - 2x)`
 * - `CurveMode.EaseCenter`: `g(x) = 0.5 - 0.5 * f(1 - 2x) if x < 0.5 else 0.5 + 0.5 * f(2x - 1)`
 * @param func 速率曲线
 * @param mode 曲线模式
 * @returns
 */
export function applyCurveMode(func: ExcitationCurve, mode: CurveMode) {
    switch (mode) {
        case CurveMode.EaseIn:
            return easeIn(func);
        case CurveMode.EaseOut:
            return easeOut(func);
        case CurveMode.EaseInOut:
            return easeInOut(func);
        case CurveMode.EaseCenter:
            return easeCenter(func);
    }
}

/** f(x) = 1 - cos(x * pi/2), x∈[0,1], f(x)∈[0,1] */
const sinfunc: ExcitationCurve = p => 1 - Math.cos((p * Math.PI) / 2);

/**
 * 正弦速率曲线，EaseIn: `f(x) = 1 - cos(x * pi/2), x∈[0,1], f(x)∈[0,1]`
 * @param mode 曲线模式
 */
export function sin(mode: CurveMode = CurveMode.EaseIn): ExcitationCurve {
    return applyCurveMode(sinfunc, mode);
}

/** f(x) = tan(x * pi/4), x∈[0,1], f(x)∈[0,1] */
const tanfunc: ExcitationCurve = p => Math.tan((p * Math.PI) / 4);

/**
 * 正切速率曲线，EaseIn: `f(x) = tan(x * pi/4), x∈[0,1], f(x)∈[0,1]`
 * @param mode 曲线模式
 */
export function tan(mode: CurveMode = CurveMode.EaseIn): ExcitationCurve {
    return applyCurveMode(tanfunc, mode);
}

/** f(x) = sec(x * pi/3) - 1, x∈[0,1], f(x)∈[0,1] */
const secfunc: ExcitationCurve = p => 1 / Math.cos((p * Math.PI) / 3) - 1;

/**
 * 正割速率曲线，EaseIn: `f(x) = sec(x * pi/3)-1, x∈[0,1], f(x)∈[0,1]`
 * @param mode 曲线模式
 */
export function sec(mode: CurveMode = CurveMode.EaseIn): ExcitationCurve {
    return applyCurveMode(secfunc, mode);
}

/**
 * 幂函数速率曲线，EaseIn: `f(x) = x ** n, x∈[0,1], f(x)∈[0,1]`
 * @param exp 指数
 * @param mode 曲线模式
 */
export function pow(
    exp: number,
    mode: CurveMode = CurveMode.EaseIn
): ExcitationCurve {
    // f(x) = x ** n, x∈[0,1], f(x)∈[0,1]
    const powfunc: ExcitationCurve = p => Math.pow(p, exp);
    return applyCurveMode(powfunc, mode);
}

/**
 * 双曲余弦速率曲线，EaseIn: `f(x) = (cosh(x * k) - 1) / (cosh(k) - 1), x∈[0,1], f(x)∈[0,1]`
 * @param k 比例参数
 * @param mode 曲线模式
 */
export function cosh(
    k: number = 2,
    mode: CurveMode = CurveMode.EaseIn
): ExcitationCurve {
    // f(x) = (cosh(x * k) - 1) / cosh(k), x∈[0,1], f(x)∈[0,1]
    const s = Math.cosh(k) - 1;
    const coshfunc: ExcitationCurve = p => (Math.cosh(p * k) - 1) / s;
    return applyCurveMode(coshfunc, mode);
}

/**
 * 双曲正切速率曲线，EaseIn: `f(x) = 1 + tanh((x - 1) * k) / tanh(k), x∈[0,1], f(x)∈[0,1]`
 * @param k 比例参数
 * @param mode 曲线模式
 */
export function tanh(
    k: number = 2,
    mode: CurveMode = CurveMode.EaseIn
): ExcitationCurve {
    // f(x) = 1 + tanh((x - 1) * k) / tanh(k), x∈[0,1], f(x)∈[0,1]
    const s = Math.tanh(k);
    const tanhfunc: ExcitationCurve = p => 1 + Math.tanh((p - 1) * k) / s;
    return applyCurveMode(tanhfunc, mode);
}

/**
 * 双曲正割速率曲线，EaseIn: `f(x) = 1 - sech(x * k) / sech(k), x∈[0,1], f(x)∈[0,1]`
 * @param k 比例参数
 * @param mode 曲线模式
 */
export function sech(
    k: number = 2,
    mode: CurveMode = CurveMode.EaseIn
): ExcitationCurve {
    // f(x) = 1 - sech(x * k) / sech(k), x∈[0,1], f(x)∈[0,1]
    // sech(x) = 1 / cosh(x)
    const s = 1 / Math.cosh(k);
    const sechfunc: ExcitationCurve = p => 1 - 1 / Math.cosh(p * k) / s;
    return applyCurveMode(sechfunc, mode);
}

/**
 * 常数速率曲线，`f(x) = b, x∈[0,1], f(x)∈R`
 * @param k 常数值
 */
export function constant(k: number): ExcitationCurve {
    return _ => k;
}

/**
 * 线性速率曲线，`f(x) = x, x∈[0,1], f(x)∈[0,1]`
 */
export function linear(): ExcitationCurve {
    return p => p;
}

/**
 * 阶梯速率曲线，`f(x) = floor(x * k) / k, x∈[0,1], f(x)∈[0,1]`
 * @param k 阶梯参数
 */
export function step(k: number): ExcitationCurve {
    // f(x) = floor(x * k) / k, x∈[0,1], f(x)∈[0,1]
    return p => Math.floor(p * k) / k;
}

//#endregion
