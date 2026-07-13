import { IHookable, IHookBase } from '@motajs/common';
import { ISaveableContent } from '../save';

export type ReplayParamValue = number | string | boolean | bigint;

export interface IReplayStepHandler {
    /** 当前步的指令标识 */
    readonly command: number;
    /** 当前步的参数列表 */
    readonly params: readonly ReplayParamValue[];
    /** 当前步在录像中的索引 */
    readonly index: number;
}

export interface IReplayCommand {
    /**
     * 执行当前录像步对应的操作逻辑
     * @param step 当前录像步信息
     */
    execute(step: IReplayStepHandler): Promise<void>;
}

export interface IReplaySandboxHook extends IHookBase {
    /**
     * 当录像沙箱将某一步录像操作执行完毕后触发
     * @param step 当前录像步信息
     */
    onStep?(step: IReplayStepHandler): Promise<void>;

    /**
     * 当设置播放速度时触发
     * @param speed 播放速度
     */
    onSpeedSet?(speed: number): void;

    /**
     * 当开始播放时触发
     */
    onStartReplay?(): void;

    /**
     * 当停止播放时触发
     */
    onStopReplay?(): void;

    /**
     * 当暂停播放时触发
     */
    onPauseReplay?(): void;

    /**
     * 当继续播放时触发
     */
    onResumeReplay?(): void;
}

export interface IReplaySandbox extends IHookable<IReplaySandboxHook> {
    /** 是否处于暂停状态 */
    readonly pausing: boolean;
    /** 播放倍率，1 为正常速度 */
    readonly speed: number;

    /**
     * 设置播放倍率
     * @param speed 播放倍率
     */
    setSpeed(speed: number): void;

    /**
     * 开始连续播放
     */
    play(): void;

    /**
     * 暂停播放
     */
    pause(): Promise<void>;

    /**
     * 从暂停状态恢复播放
     */
    resume(): void;

    /**
     * 终止播放，恢复为正常游戏状态
     */
    stop(): Promise<void>;

    /**
     * 单步播放一步，返回的 Promise 在该步渲染完成后兑现
     */
    step(): Promise<void>;
}

export interface IStateReseter {
    /**
     * 在录像播放时，需要将游戏状态重置为初始状态或指定存档状态，此方法用于执行此重置操作。
     * @param save 可选，已加载的存档数据，不传则重置为初始状态
     */
    reset(save?: Map<string, unknown>): void;
}

export const enum ReplayCommandWidth {
    /** 1 字节宽度，支持 0-255 的指令 ID */
    Uint8 = 1,
    /** 2 字节宽度，支持 0-65535 的指令 ID */
    Uint16 = 2
}

export interface IReplayReadStream {
    /** 当前读取位置的步索引 */
    index: number;
    /** 录像总步数 */
    length: number;
    /** 当前录像读取流是否已经过期，当有录像被修改时此值会变为 true */
    expired: boolean;

    /**
     * 读取当前指针位置的录像步并将指针推进到下一步
     * 超出录像长度时返回 null
     */
    read(): IReplayStepHandler | null;

    /**
     * 摧毁此读取流，当不再使用此录像读取流时必须调用
     */
    destroy(): void;
}

export interface IReplayArrayConfig {
    /** 初始指令数组长度，以指令数量为单位 */
    initCommandLength: number;
    /** 初始参数数组长度，以字节为单位 */
    initParamLength: number;
    /** 指令数组扩容乘数 */
    commandExpandMultiplier: number;
    /** 参数数组扩容乘数 */
    paramExpandMultiplier: number;
    /** 录像指令码位宽 */
    commandWidth: ReplayCommandWidth;
    /** 指令最大长度，即最多有多少个录像步 */
    commandMaxLength: number;
    /** 参数数组最大长度 */
    paramMaxLength: number;
}

export interface IReplayArray {
    /** 录像中的总步数 */
    readonly length: number;
    /** 录像的指令码宽度 */
    readonly commandWidth: ReplayCommandWidth;

    /**
     * 向录像末尾追加一条录像步
     * @param command 指令标识
     * @param params 参数列表
     */
    add(command: number, params: ReplayParamValue[]): void;

    /**
     * 在指定索引处插入一条录像步，后续录像会自动后移。
     * 由于此操作会涉及大量的内存迁移，耗时较长，因此不建议频繁调用。
     * @param index 插入位置
     * @param command 指令标识
     * @param params 参数列表
     */
    insert(index: number, command: number, params: ReplayParamValue[]): void;

    /**
     * 删除指定索引处的录像步，此行为不会产生空槽。
     * 由于此操作会涉及大量的内存迁移，耗时较长，因此不建议频繁调用。
     * @param index 要删除的步索引
     */
    delete(index: number): void;

    /**
     * 修改指定索引处的录像步。
     * 由于此操作会涉及大量的内存迁移，耗时较长，因此不建议频繁调用。
     * @param index 要修改的步索引
     * @param command 新的指令标识
     * @param params 新的参数列表
     */
    set(index: number, command: number, params: ReplayParamValue[]): void;

    /**
     * 读取指定索引处的录像步。该操作极为缓慢，如果不是为了指定要读取的索引，不建议频繁调用此方法。
     * @param index 步索引
     */
    get(index: number): IReplayStepHandler;

    /**
     * 创建一个流式读取器，用于顺序播放
     * @param startIndex 起始步索引，默认为 0
     */
    createReadStream(startIndex?: number): Readonly<IReplayReadStream>;

    /**
     * 变更所有已写入指令的编码宽度
     * @param width 新的指令码宽度
     */
    setCommandWidth(width: ReplayCommandWidth): void;

    /**
     * 获取指令数组，为内部存储的直接引用
     */
    getCommandArray(): ArrayBuffer;

    /**
     * 获取参数数组，为内部存储的直接引用。参数类型列表：
     *
     * - 0: boolean
     * - 1: int8
     * - 2: int16
     * - 3: int32
     * - 4: int64
     * - 5: float
     * - 6: bigint
     * - 7: string
     * - 8 ~ 255: n - 7 长度的字符串
     */
    getParamArray(): ArrayBuffer;

    /**
     * 重建索引数组，索引数组用于存储每个指令的参数起始索引，速度非常慢，一般情况下不需要手动调用此接口
     */
    rebuildIndexArray(): void;

    /**
     * 直接设置录像数组
     * @param commandWidth 指令位宽
     * @param commandBuffer 指令数组缓冲区
     * @param paramBuffer 参数数组缓冲区
     * @param length 录像长度
     */
    setReplayArray(
        commandWidth: ReplayCommandWidth,
        commandBuffer: ArrayBuffer,
        paramBuffer: ArrayBuffer,
        length: number
    ): void;
}

export interface IReplaySystemHook extends IHookBase {
    /**
     * 当创建新的录像沙盒时触发
     * @param sandbox 创建的录像沙盒
     */
    onCreateSandbox?(sandbox: IReplaySandbox): void;

    /**
     * 当录像系统记录新指令时触发
     * @param command 指令标识
     * @param index 新记录的指令的索引
     * @param params 指令对应的参数
     */
    onRecordCommand?(
        command: number,
        index: number,
        params: ReplayParamValue[]
    ): void;
}

export interface IReplayMetadataSave {
    /** 当前录像使用的指令码宽度 */
    readonly commandWidth: ReplayCommandWidth;
}

export interface IReplaySystemSave {
    /**
     * 指令数组，在 Uint8 位宽下，两个字节为一组，第一个字节为参数数量，第二个字节为指令标识。
     * 在 Uint16 位宽下，三个字节为一组，第一个字节为参数数量，后两个字节组成的 uint16 为指令标识。
     */
    readonly commands: ArrayBuffer;

    /**
     * 参数数组，由参数类型和参数值组成。参数类型占据一个字节，参数值根据类型不同占据不同的字节。
     * 参数类型列表：
     *
     * - 0: boolean --- 2 Byte
     * - 1: int8    --- 2 Byte
     * - 2: int16   --- 3 Byte
     * - 3: int32   --- 5 Byte
     * - 4: int64   --- 9 Byte
     * - 5: float   --- 9 Byte
     * - 6: bigint  --- n + 1 Byte, 其中 n 是 bigint 的字节数
     * - 7: string  --- n + 1 Byte, 其中 n 是字符串编码后的字节数
     * - 8 ~ 255: n - 7 长度的字符串  --- n + 1 Byte, 其中 n 是字符串编码后的字节数
     */
    readonly params: ArrayBuffer;

    /** 录像元数据 */
    readonly metadata: IReplayMetadataSave;
}

export interface IReplaySystem
    extends ISaveableContent<IReplaySystemSave>, IHookable<IReplaySystemHook> {
    /** 当前是否处在录像播放状态 */
    readonly replaying: boolean;
    /** 当前正在播放的录像沙箱实例 */
    readonly sandbox: IReplaySandbox | null;
    /** 当前的录像操作器，用于直接操作或读取录像数据 */
    readonly route: IReplayArray;

    /**
     * 注册一个录像命令
     * @param id 命令的唯一标识
     * @param command 命令对应的执行对象
     */
    registerCommand(id: number, command: IReplayCommand): void;

    /**
     * 向录像末尾追加一条录像步
     * @param id 命令标识
     * @param params 可变数量的录像参数
     */
    record(id: number, ...params: ReplayParamValue[]): void;

    /**
     * 创建一个录像播放沙箱
     * @param reseter 状态重置器，用于在播放前重置游戏状态
     * @param save 可选，已加载的存档数据，用于从存档状态继续播放
     */
    createReplaySandbox(
        reseter: IStateReseter,
        save?: Map<string, unknown>
    ): IReplaySandbox;

    /**
     * 释放当前活跃的沙箱
     */
    releaseSandbox(): void;
}
