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
