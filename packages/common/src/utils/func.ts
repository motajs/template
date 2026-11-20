/**
 * 创建一个等待指定时间长度的 `Promise`
 * @param time 等待时间
 * @example await sleep(1000);
 */
export function sleep(time: number) {
    return new Promise(res => setTimeout(res, time));
}

/**
 * 对序列依次求和，结果为一个数组，每一项的值为该项及其前面所有项的和
 * @param seq 数字序列
 * @example cumsum([1, 2, 3, 4]); // [1, 3, 6, 10]
 */
export function cumsum(seq: Iterable<number>): number[] {
    const result: number[] = [];
    let now = 0;
    for (const ele of seq) {
        result.push((now += ele));
    }
    return result;
}

/**
 * 判断一个数组的所有项，符合的项组成 `match`，不符合的组成 `unmatch`，返回 `[match, unmatch]`
 * @param array 要判断的数组
 * @param filter 判断函数
 * @example matchArray([1, 2, 3, 4], v => v < 2); // [[1], [2, 3, 4]]
 */
export function matchArray<T>(
    array: readonly T[],
    filter: (v: T, i: number, a: readonly T[]) => boolean
): [match: T[], unmatch: T[]] {
    const match: T[] = [];
    const unmatch: T[] = [];

    array.forEach((v, i, a) => {
        if (filter(v, i, a)) {
            match.push(v);
        } else {
            unmatch.push(v);
        }
    });

    return [match, unmatch];
}
