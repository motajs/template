import { logger } from '@motajs/common';
import {
    IReplayArray,
    IReplayArrayConfig,
    IReplayArraySave,
    IReplayReadStream,
    IReplayStepHandler,
    ReplayCommandWidth,
    ReplayParamValue
} from './types';
import { ISaveableContent } from '../save';

interface INormalizedParam {
    /**
     * 参数类型：
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
    readonly paramType: number;

    /** 参数值 */
    readonly paramValue: number | Uint8Array;
    /** 此参数占据的字节长度，包含类型 token */
    readonly byteLength: number;
}

interface IDecodedParam {
    /** 参数值 */
    readonly paramValue: ReplayParamValue;
    /** 参数占据的字节数，包含类型 token */
    readonly byteLength: number;
}

interface IDecodedCommand {
    /** 指令标识 */
    readonly command: number;
    /** 指令的参数数量 */
    readonly paramCount: number;
}

export class ReplayArray
    implements IReplayArray, ISaveableContent<IReplayArraySave>
{
    length: number = 0;
    commandWidth: ReplayCommandWidth = ReplayCommandWidth.Uint8;

    /** 文本编码器 */
    private readonly textEncoder: TextEncoder;
    /** 文本解码器 */
    private readonly textDecoder: TextDecoder;

    /** 指令数组缓冲区 */
    private commandBuffer: ArrayBuffer;
    /** 参数数组缓冲区 */
    private paramBuffer: ArrayBuffer;
    /** 参数起始索引缓冲区 */
    private indexBuffer: ArrayBuffer;
    /** 当前参数缓冲区已经使用了多少字节 */
    private paramUsed: number;

    /** 指令数组的 DataView */
    private commandView: DataView;
    /** 参数数组的 DataView */
    private paramView: DataView;
    /** 指令数组的 TypedArray */
    private commandArray: Uint8Array;
    /** 参数数组的 TypedArray */
    private paramArray: Uint8Array;
    /** 参数起始索引 TypedArray */
    private indexArray: Uint32Array;

    /** 指令数组扩容乘数 */
    private readonly commandExpand: number;
    /** 参数数组扩容乘数 */
    private readonly paramExpand: number;
    /** 指令数组最大长度 */
    private readonly commandMax: number;
    /** 参数数组最大长度 */
    private readonly paramMax: number;

    /** 所有可用的读取流 */
    private readonly readStreams: Set<IReplayReadStream>;

    constructor(config: Readonly<IReplayArrayConfig>) {
        this.textEncoder = new TextEncoder();
        this.textDecoder = new TextDecoder();
        this.readStreams = new Set();
        this.paramUsed = 0;
        this.commandWidth = config.commandWidth;
        this.commandMax = config.commandMaxLength;
        this.paramMax = config.paramMaxLength;

        if (config.commandExpandMultiplier < 1) {
            const str = config.commandExpandMultiplier.toString();
            logger.warn(149, 'command', str);
            this.commandExpand = 2;
        } else {
            this.commandExpand = config.commandExpandMultiplier;
        }

        if (config.paramExpandMultiplier < 1) {
            const str = config.paramExpandMultiplier.toString();
            logger.warn(149, 'param', str);
            this.paramExpand = 2;
        } else {
            this.paramExpand = config.paramExpandMultiplier;
        }

        const commandSize = this.getCommandSize();
        this.commandBuffer = new ArrayBuffer(
            config.initCommandLength * commandSize
        );
        this.paramBuffer = new ArrayBuffer(config.initParamLength);
        this.indexBuffer = new ArrayBuffer(config.initCommandLength * 4);

        this.commandView = new DataView(this.commandBuffer);
        this.paramView = new DataView(this.paramBuffer);
        this.commandArray = new Uint8Array(this.commandBuffer);
        this.paramArray = new Uint8Array(this.paramBuffer);
        this.indexArray = new Uint32Array(this.indexBuffer);
    }

    /**
     * 获取指令位宽
     */
    private getCommandSize() {
        if (this.commandWidth === ReplayCommandWidth.Uint8) {
            return 2;
        } else {
            return 3;
        }
    }

    /**
     * 检查两个数组缓冲区的容量，不足则扩容
     * @param paramLength 将要添加至参数数组的内容的字节数
     */
    private checkBufferExpand(paramLength: number) {
        const commandSize = this.getCommandSize();
        const commandLength = Math.ceil(
            this.commandBuffer.byteLength / commandSize
        );

        let expanded = false;

        if (commandLength - this.length < 10) {
            if (commandLength >= this.commandMax) {
                logger.warn(150, 'command', this.commandMax.toString());
            } else {
                const nextSize = Math.min(
                    Math.ceil(commandLength * this.commandExpand),
                    this.commandMax
                );
                const origin = this.commandArray;
                this.commandBuffer = new ArrayBuffer(nextSize * commandSize);
                this.commandView = new DataView(this.commandBuffer);
                this.commandArray = new Uint8Array(this.commandBuffer);
                this.commandArray.set(origin);

                const originIndex = this.indexArray;
                this.indexBuffer = new ArrayBuffer(nextSize * 4);
                this.indexArray = new Uint32Array(this.indexBuffer);
                this.indexArray.set(originIndex);

                expanded = true;
            }
        }

        if (this.paramBuffer.byteLength - this.paramUsed < paramLength + 10) {
            if (this.paramBuffer.byteLength >= this.paramMax) {
                logger.warn(150, 'param', this.paramMax.toString());
            } else {
                const nextSize = Math.min(
                    Math.ceil(this.paramBuffer.byteLength * this.paramExpand),
                    this.paramMax
                );
                const origin = this.paramArray;
                this.paramBuffer = new ArrayBuffer(nextSize);
                this.paramView = new DataView(this.paramBuffer);
                this.paramArray = new Uint8Array(this.paramBuffer);
                this.paramArray.set(origin);

                expanded = true;
            }
        }

        if (expanded) {
            // 重新检查一遍，防止拓展之后还是不够用
            this.checkBufferExpand(paramLength);
        }
    }

    //#region 写入与编码

    /**
     * 将所有的读取流标记为过期并删除
     */
    private expireStreams() {
        this.readStreams.forEach(v => {
            v.expired = true;
        });
        this.readStreams.clear();
    }

    /**
     * 将数值标准化为数字或 Uint8Array
     * @param param 参数值
     */
    private normalizeParam(param: ReplayParamValue): INormalizedParam {
        if (typeof param === 'boolean') {
            // 0 - boolean
            return {
                paramType: 0,
                paramValue: param ? 1 : 0,
                byteLength: 2
            };
        } else if (typeof param === 'number') {
            let type = 1;
            let byte = 2;
            if (Number.isInteger(param)) {
                if (param < 128 && param >= -128) {
                    // 1 - int8
                    type = 1;
                    byte = 2;
                } else if (param < 32768 && param >= -32768) {
                    // 2 - int16
                    type = 2;
                    byte = 3;
                } else if (param < 2147483648 && param >= -2147483648) {
                    // 3 - int32
                    type = 3;
                    byte = 5;
                } else {
                    // 4 - int64
                    type = 4;
                    byte = 9;
                }
            } else {
                // 5 - float
                type = 5;
                byte = 9;
            }
            return {
                paramType: type,
                paramValue: param,
                byteLength: byte
            };
        } else if (typeof param === 'bigint') {
            // 6 - bigint
            const wall = 2n ** 2047n;
            if (param > wall - 1n || param < -wall) {
                logger.warn(152);
            }
            const bit = param.toString(2);
            const length = Math.ceil(bit.length / 8);
            const arr = new Uint8Array(length);
            let total = 0n;
            for (let i = 0; i < length; i++) {
                const base = param - total;
                const remain = base % 256n;
                total += remain << (BigInt(i) * 8n);
                arr[i] = Number(remain);
            }
            return {
                paramType: 6,
                paramValue: arr,
                byteLength: arr.length
            };
        } else if (typeof param === 'string') {
            const arr = this.textEncoder.encode(param);
            if (arr.length < 248) {
                // 8 ~ 255 - string
                return {
                    paramType: arr.length + 8,
                    paramValue: arr,
                    byteLength: arr.length
                };
            } else {
                // 7 - string
                return {
                    paramType: 7,
                    paramValue: arr,
                    byteLength: arr.length
                };
            }
        }
        logger.warn(148, typeof param, String(param));
        return {
            paramType: 0,
            paramValue: 0,
            byteLength: 0
        };
    }

    /**
     * 将一系列参数值标准化为数字或 Uint8Array
     * @param params 参数值列表
     */
    private normalizeParamList(params: ReplayParamValue[]): INormalizedParam[] {
        let arr = params;
        if (params.length > 255) {
            logger.warn(153, params.length.toString());
            arr = params.slice(0, 255);
        }
        return arr.map(v => this.normalizeParam(v));
    }

    /**
     * 计算参数所需的字节数
     * @param params 标准化后的参数值
     */
    private calculateParamsLength(params: INormalizedParam[]): number {
        return params.reduce((prev, curr) => prev + curr.byteLength, 0);
    }

    /**
     * 将指令实际写入缓冲区
     * @param startIndex 指令的起始索引
     * @param paramCount 指令对应的参数数量
     * @param command 指令的标识数字
     */
    private setCommandArray(
        startIndex: number,
        paramCount: number,
        command: number
    ) {
        this.commandView.setUint8(startIndex, paramCount);
        if (this.commandWidth === ReplayCommandWidth.Uint8) {
            this.commandView.setUint8(startIndex + 1, command);
        } else {
            this.commandView.setUint16(startIndex + 1, command);
        }
    }

    /**
     * 将参数列表实际写入缓冲区
     * @param startIndex 起始索引
     * @param params 参数列表
     */
    private setParamArray(startIndex: number, params: INormalizedParam[]) {
        params.forEach(param => {
            this.paramView.setInt8(startIndex, param.paramType);

            const num = param.paramValue as number;
            const arr = param.paramValue as Uint8Array;

            if (param.paramType === 0) {
                // 0 - boolean
                this.paramView.setInt8(startIndex + 1, num);
            } else if (param.paramType === 1) {
                // 1 - int8
                this.paramView.setInt8(startIndex + 1, num);
            } else if (param.paramType === 2) {
                // 2 - int16
                this.paramView.setInt16(startIndex + 1, num);
            } else if (param.paramType === 3) {
                // 3 - int32
                this.paramView.setInt32(startIndex + 1, num);
            } else if (param.paramType === 4) {
                // 4 - int64
                const high = Math.floor(num / 2147483648);
                const low = num % 2147483648;
                this.paramView.setInt32(startIndex + 1, low);
                this.paramView.setInt32(startIndex + 5, high);
            } else if (param.paramType === 5) {
                // 5 - float
                this.paramView.setFloat64(startIndex + 1, num);
            } else if (param.paramType === 6) {
                // 6 - bigint
                this.paramArray[startIndex + 1] = arr.length;
                this.paramArray.set(arr, startIndex + 2);
            } else if (param.paramType === 7) {
                // 7 - string
                this.paramView.setInt32(startIndex + 1, arr.length);
                this.paramArray.set(arr, startIndex + 5);
            } else {
                // 8 ~ 256 - string
                this.paramArray.set(arr, startIndex + 1);
            }
        });
    }

    add(command: number, params: ReplayParamValue[]): void {
        const normalized = this.normalizeParamList(params);
        const length = this.calculateParamsLength(normalized);
        this.checkBufferExpand(length);

        // 追加指令
        const commandSize = this.getCommandSize();
        const commandStart = commandSize * this.length;
        this.setCommandArray(commandStart, params.length, command);

        // 追加参数
        this.setParamArray(this.paramUsed, normalized);
        this.indexArray[this.length] = this.paramUsed;
        this.paramUsed += length;
        this.length++;

        this.expireStreams();
    }

    insert(index: number, command: number, params: ReplayParamValue[]): void {
        const normalized = this.normalizeParamList(params);
        const length = this.calculateParamsLength(normalized);
        this.checkBufferExpand(length);

        const commandSize = this.getCommandSize();

        // 先进行位移
        const commandStart = index * commandSize;
        const paramStart = this.indexArray[index];
        this.commandArray.copyWithin(commandStart + commandSize, commandStart);
        this.paramArray.copyWithin(paramStart, paramStart + length);
        this.indexArray.copyWithin(index, index + 1);

        // 然后进行赋值操作，索引数组因为这一个指令的起始索引其实没变，所以不需要赋值
        this.setCommandArray(commandStart, params.length, command);
        this.setParamArray(paramStart, normalized);

        this.length++;
        this.paramUsed += length;

        // 最后把后面的内容的索引数组增加 length 即可
        for (let i = index + 1; i < this.length; i++) {
            this.indexArray[i] += length;
        }

        this.expireStreams();
    }

    delete(index: number): void {
        const commandSize = this.getCommandSize();
        const commandStart = index * commandSize;
        const paramStart = this.indexArray[index];
        const nextParam = this.indexArray[index + 1];
        const paramLength = nextParam - paramStart;

        // 直接进行位移
        this.commandArray.copyWithin(commandStart, commandStart + commandSize);
        this.paramArray.copyWithin(paramStart, nextParam);
        this.indexArray.copyWithin(index, index + 1);

        this.length--;
        this.paramUsed -= paramLength;

        // 然后把后续值赋零
        const commandLast = this.length * commandSize;
        const paramLast = this.paramUsed;
        this.commandArray[commandLast] = 0;
        this.commandArray[commandLast + 1] = 0;
        this.commandArray[commandLast + 2] = 0;
        for (let i = 0; i < paramLength; i++) {
            this.paramArray[paramLast + i] = 0;
        }

        // 最后把后面的索引减少 paramLength
        for (let i = paramStart; i < this.length; i++) {
            this.indexArray[i] -= paramLength;
        }

        this.expireStreams();
    }

    set(index: number, command: number, params: ReplayParamValue[]): void {
        const normalized = this.normalizeParamList(params);
        const length = this.calculateParamsLength(normalized);
        const paramStart = this.indexArray[index];
        const nextParam = this.indexArray[index + 1];
        const paramLength = nextParam - paramStart;
        const deltaLength = length - paramLength;
        if (deltaLength > 0) {
            this.checkBufferExpand(deltaLength);
        }

        // 先写入指令
        const commandSize = this.getCommandSize();
        const commandStart = index * commandSize;
        this.setCommandArray(commandStart, params.length, command);

        // 然后根据差值位移参数数组，如果参数长度减少还需要将最后几项置零
        this.paramArray.copyWithin(nextParam + deltaLength, nextParam);
        this.paramUsed += deltaLength;
        if (deltaLength < 0) {
            const zeros = -deltaLength;
            const paramLast = this.paramUsed;
            for (let i = 0; i < zeros; i++) {
                this.paramArray[paramLast + i] = 0;
            }
        }

        // 然后设置参数数组
        this.setParamArray(paramStart, normalized);

        // 最后调整索引数组
        for (let i = paramStart + 1; i < this.length; i++) {
            this.indexArray[i] += deltaLength;
        }

        this.expireStreams();
    }

    setCommandWidth(width: ReplayCommandWidth): void {
        const oldWidth = this.commandWidth;
        const oldSize = this.getCommandSize();
        this.commandWidth = width;
        const newSize = this.getCommandSize();
        const commandLength = this.commandBuffer.byteLength / oldSize;
        const length = Math.floor(commandLength * newSize);
        const newBuffer = new ArrayBuffer(length);
        const newView = new DataView(newBuffer);

        for (let i = 0; i < this.length; i++) {
            const oldStart = i * oldSize;
            const newStart = i * newSize;

            // 先读取旧指令
            const count = this.commandView.getUint8(oldStart);
            let oldCommand = 0;
            if (oldWidth === ReplayCommandWidth.Uint8) {
                oldCommand = this.commandView.getUint8(oldStart + 1);
            } else {
                oldCommand = this.commandView.getUint16(oldStart + 1);
            }

            // 再写入新的 DataView
            newView.setUint8(newStart, count);
            if (width === ReplayCommandWidth.Uint8) {
                if (oldCommand > 255) {
                    logger.warn(154, oldCommand.toString());
                }
                newView.setUint8(newStart + 1, oldCommand);
            } else {
                newView.setUint16(newStart + 1, oldCommand);
            }
        }

        this.commandBuffer = newBuffer;
        this.commandArray = new Uint8Array(newBuffer);
        this.commandView = newView;

        this.expireStreams();
    }

    //#endregion

    //#region 读取与解码

    /**
     * 解码单个录像指令
     * @param startIndex 解码起始索引
     */
    private decodeCommand(startIndex: number): IDecodedCommand {
        const count = this.commandView.getUint8(startIndex);
        let command = 0;
        if (this.commandWidth === ReplayCommandWidth.Uint8) {
            command = this.commandView.getUint8(startIndex + 1);
        } else {
            command = this.commandView.getUint16(startIndex + 1);
        }

        return {
            command,
            paramCount: count
        };
    }

    /**
     * 解码单个录像参数
     * @param startIndex 解码起始索引
     */
    private decodeParam(startIndex: number): IDecodedParam {
        const type = this.paramArray[startIndex];

        let value: ReplayParamValue = 0;
        let byte = 0;

        if (type === 0) {
            // 0 - boolean
            const next = this.paramArray[startIndex + 1];
            byte = 2;
            if (next === 1) {
                value = true;
            } else if (next === 0) {
                value = false;
            } else {
                logger.warn(151, next.toString());
                value = false;
            }
        } else if (type === 1) {
            // 1 - int8
            byte = 2;
            value = this.paramView.getInt8(startIndex + 1);
        } else if (type === 2) {
            // 2 - int16
            byte = 3;
            value = this.paramView.getInt16(startIndex + 1);
        } else if (type === 3) {
            // 3 - int32
            byte = 5;
            value = this.paramView.getInt32(startIndex + 1);
        } else if (type === 4) {
            // 4 - int64
            const low = this.paramView.getInt32(startIndex + 1);
            const high = this.paramView.getInt32(startIndex + 5);
            byte = 9;
            value = low + high * 2147483647;
        } else if (type === 5) {
            // 5 - float
            byte = 9;
            value = this.paramView.getFloat64(startIndex + 1);
        } else if (type === 6) {
            // 6 - bigint
            const length = this.paramView.getInt8(startIndex + 1);
            let base = 0n;
            for (let i = 0; i < length; i++) {
                const num = this.paramView.getInt8(startIndex + 2 + i);
                base += BigInt(num) << (8n * BigInt(i));
            }
            byte = length + 2;
            value = base;
        } else if (type === 7) {
            // 7 - string
            const length = this.paramView.getInt32(startIndex + 1);
            const endIndex = startIndex + 5 + length;
            const arr = this.paramArray.slice(startIndex + 5, endIndex);
            byte = length + 2;
            value = this.textDecoder.decode(arr);
        } else {
            // 8 ~ 255 - string
            const length = type - 7;
            const endIndex = startIndex + 1 + length;
            const arr = this.paramArray.slice(startIndex + 5, endIndex);
            byte = length + 1;
            value = this.textDecoder.decode(arr);
        }

        return {
            paramValue: value,
            byteLength: byte
        };
    }

    /**
     * 解码指定数量的录像参数
     * @param startIndex 解码起始索引
     * @param count 解码参数数量
     */
    private decodeParamList(
        startIndex: number,
        count: number
    ): IDecodedParam[] {
        const arr: IDecodedParam[] = [];

        let index = startIndex;
        for (let i = 0; i < count; i++) {
            const decoded = this.decodeParam(index);
            index += decoded.byteLength;
            arr.push(decoded);
        }

        return arr;
    }

    /**
     * 创建录像步信息对象
     * @param command 指令标识
     * @param params 解码后的参数列表
     * @param index 录像索引
     */
    private createReplayStepHandler(
        command: number,
        params: IDecodedParam[],
        index: number
    ): IReplayStepHandler {
        return {
            command,
            params: params.map(v => v.paramValue),
            index
        };
    }

    get(index: number): IReplayStepHandler {
        const commandSize = this.getCommandSize();
        const commandStart = index * commandSize;
        const paramStart = this.indexArray[index];

        const command = this.decodeCommand(commandStart);
        const params = this.decodeParamList(paramStart, command.paramCount);

        return this.createReplayStepHandler(command.command, params, index);
    }

    createReadStream(startIndex: number = 0): Readonly<IReplayReadStream> {
        const commandSize = this.getCommandSize();
        let currCommand = startIndex * commandSize;
        let currParam = this.indexArray[startIndex];

        const stream: IReplayReadStream = {
            index: startIndex,
            length: this.length,
            expired: false,

            read: () => {
                if (stream.expired) {
                    logger.warn(155);
                }
                if (stream.index >= this.length) return null;
                const { command, paramCount } = this.decodeCommand(currCommand);
                const params = this.decodeParamList(currParam, paramCount);
                stream.index++;
                currCommand += commandSize;
                currParam += params.reduce(
                    (prev, curr) => prev + curr.byteLength,
                    0
                );
                const index = stream.index;
                return this.createReplayStepHandler(command, params, index);
            },

            destroy: () => {
                this.readStreams.delete(stream);
            }
        };

        this.readStreams.add(stream);

        return stream;
    }

    //#endregion

    //#region 重建方法

    rebuildIndexArray(): void {
        const commandSize = this.getCommandSize();
        let currCommand = 0;
        let currParam = 0;

        // 需要对每个参数进行解码，然后 cumsum
        for (let i = 0; i < this.length; i++) {
            const { paramCount } = this.decodeCommand(currCommand);
            const params = this.decodeParamList(currParam, paramCount);
            this.indexArray[i] = currParam;
            currCommand += commandSize;
            currParam += params.reduce(
                (prev, curr) => prev + curr.byteLength,
                0
            );
        }

        this.paramUsed = currParam;
    }

    setReplayArray(
        commandWidth: ReplayCommandWidth,
        commandBuffer: ArrayBuffer,
        paramBuffer: ArrayBuffer,
        length: number
    ): void {
        this.commandWidth = commandWidth;
        this.commandBuffer = commandBuffer;
        this.commandArray = new Uint8Array(commandBuffer);
        this.commandView = new DataView(commandBuffer);
        this.paramBuffer = paramBuffer;
        this.paramArray = new Uint8Array(paramBuffer);
        this.paramView = new DataView(paramBuffer);

        const commandSize = this.getCommandSize();
        const commandBufferLength = Math.ceil(
            commandBuffer.byteLength / commandSize
        );
        this.indexBuffer = new ArrayBuffer(commandBufferLength * 4);
        this.indexArray = new Uint32Array(this.indexBuffer);

        this.length = length;

        this.rebuildIndexArray();
    }

    //#endregion

    getCommandArray(): ArrayBuffer {
        return this.commandBuffer;
    }

    getParamArray(): ArrayBuffer {
        return this.paramBuffer;
    }

    //#region 存读档

    saveState(): IReplayArraySave {
        return {
            commands: this.commandBuffer,
            params: this.paramBuffer,
            metadata: {
                commandWidth: this.commandWidth
            }
        };
    }

    loadState(state: IReplayArraySave): void {
        this.commandBuffer = state.commands;
        this.paramBuffer = state.params;
        this.commandWidth = state.metadata.commandWidth;

        this.commandView = new DataView(this.commandBuffer);
        this.paramView = new DataView(this.paramBuffer);
        this.commandArray = new Uint8Array(this.commandBuffer);
        this.paramArray = new Uint8Array(this.paramBuffer);
        this.indexArray = new Uint32Array(this.indexBuffer);

        this.expireStreams();
    }
}
