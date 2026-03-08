import { IExcitable } from './types';

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
