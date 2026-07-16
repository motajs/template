import { logger } from '@motajs/common';
import { IReplaySystem } from './types';

interface IReplaySafetyCollection {
    /** 这个安全对象（由 `@shouldReplay()` 触发）的名称，即传入给 `@shouldReplay` 的参数 */
    readonly name: string;
    /** 这个安全对象所包含的所有字对象 */
    readonly messages: IReplaySafetyCollection[];
}

interface IReplaySafetyDetailQueue {
    /** 详细信息代码 */
    readonly code: number;
    /** 此详细信息对应的安全对象 */
    readonly collection: IReplaySafetyCollection;
}

type ReplayDecorator = <
    Return,
    This,
    Func extends (this: This, ...args: any[]) => Return
>(
    method: Func,
    context: ClassMethodDecoratorContext
) => (this: This, ...args: any[]) => Return;

/** 本次收集使用的录像系统 */
let replaySystem: IReplaySystem | null = null;
/** 当前是否正在进行录像收集 */
let collecting: boolean = false;
/** 收集之前录像系统的录像长度 */
let beforeLength: number = 0;
/** 收集时是否有 `@ignoreReplay` 调用 */
let shouldIgnore: boolean = false;

/** 录像安全收集根对象 */
const collection: IReplaySafetyCollection = {
    name: 'root',
    messages: []
};
/** 当前录像安全收集对象 */
let currentCollection: IReplaySafetyCollection | null = null;

/** 详细信息 code */
let detailCode = 0;
/** 录像收集详细信息队列，保留 50 个以确保可以在控制台重复输出 */
const detailQueue: IReplaySafetyDetailQueue[] = [];

/**
 * 开始录像安全性检查收集，一般情况下不需要手动调用此接口
 * @param system 录像系统对象
 */
export function beginReplaySafetyCollection(system: IReplaySystem): void {
    if (collecting || replaySystem) {
        logger.warn(159);
        return;
    }
    replaySystem = system;
    collecting = true;
    beforeLength = system.route.length;
    collection.messages.length = 0;
    currentCollection = collection;
}

/**
 * 结束录像安全性检查收集，并输出收集结果
 */
export function endReplaySafetyCollection(): void {
    if (!collecting || !replaySystem) {
        logger.warn(160);
        return;
    }
    if (shouldIgnore) return;
    if (replaySystem.route.length > beforeLength) return;
    if (collection.messages.length === 0) return;

    // 需要把收集内容输出，这里只输出一层，完整输出需要在控制台手动调用
    const code = detailCode++;
    const col: IReplaySafetyCollection = {
        name: `detail#${code}`,
        messages: collection.messages.slice()
    };
    const command = `Mota.require('@user/data-common').logReplaySafetyDetail(${code});`;
    const simplified = [...collection.messages]
        .sort((a, b) => b.messages.length - a.messages.length)
        .map(v => v.name)
        .join('\n');
    logger.warn(161, command, simplified);

    while (detailQueue.length > 50) {
        detailQueue.shift();
    }
    detailQueue.push({
        code,
        collection: col
    });
}

/**
 * 输出指定的录像安全对象的所有详细信息
 * @param collection 录像安全对象
 */
function logCollection(collection: IReplaySafetyCollection): void {
    console.group(collection.name);
    const sorted = collection.messages.toSorted(
        (a, b) => b.messages.length - a.messages.length
    );
    for (const msg of sorted) {
        if (msg.messages.length === 0) {
            console.log(msg.name);
        } else {
            logCollection(msg);
        }
    }
    console.groupEnd();
}

/**
 * 输出某次录像安全检查的详细信息
 * @param code 录像安全检查对象的代码
 */
export function logReplaySafetyDetail(code: number): void {
    const root = detailQueue.find(v => v.code === code);
    if (!root) {
        logger.warn(162, code.toString());
        return;
    }
    logCollection(root.collection);
}

/**
 * 将一个类的方法标记为需要计入录像
 * @param message 如果录像安全检查出现问题，那么会使用此作为信息输出
 */
export function shouldReplay(message: string): ReplayDecorator {
    return function <
        Return,
        This,
        Args extends any[],
        Func extends (this: This, ...args: Args) => Return
    >(
        this: This,
        method: Func,
        context: ClassMethodDecoratorContext
    ): (this: This, ...args: Args) => Return {
        return function (this: This, ...args: Args): Return {
            const before = currentCollection;
            if (!before) return method.apply(this, args);

            const exist = before.messages.find(v => v.name === message);
            const newCollection: IReplaySafetyCollection = exist ?? {
                name: `${String(context.name)}: ${message}`,
                messages: []
            };
            if (!exist) {
                before.messages.push(newCollection);
            }

            currentCollection = newCollection;
            const result = method.apply(this, args);
            currentCollection = before;
            return result;
        };
    };
}

/**
 * 将一个类的方法标记为忽略录像安全检查，一般用于异步内容等不是立刻会触发状态修改的方法，
 * 不要使用此方法来规避控制台的录像错误警告，否则很可能导致录像出错。
 */
export function ignoreReplay(): ReplayDecorator {
    return function <
        Return,
        This,
        Args extends any[],
        Func extends (this: This, ...args: Args) => Return
    >(this: This, method: Func): (this: This, ...args: Args) => Return {
        return function (this: This, ...args: Args): Return {
            shouldIgnore = true;
            return method.apply(this, args);
        };
    };
}
