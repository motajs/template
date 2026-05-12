import { FaceDirection } from './types';

//#region 接口与枚举

export const enum InternalFaceGroup {
    /** 四方向（上下左右） */
    Dir4,
    /** 八方向（上下左右+斜向） */
    Dir8
}

export interface IFaceDescriptor {
    /** 横坐标增量 */
    readonly x: number;
    /** 纵坐标增量 */
    readonly y: number;
}

export interface IFaceHandler<T extends number> {
    /**
     * 将任意朝向值降级为本组支持的方向。
     * 对于无法合理降级的方向（包括 `Unknown`），返回 `FaceDirection.Unknown`
     * @param dir 任意朝向值
     */
    degrade(dir: number): T;

    /**
     * 获取指定方向的单步坐标偏移量，输入先经过 `degrade`
     * @param dir 朝向
     */
    movement(dir: number): IFaceDescriptor;

    /**
     * 获取指定方向走 `count` 步的坐标偏移量，等价于 `movement * count`。
     * `count` 允许为负数，表示反向位移，输入先经过 `degrade`
     * @param dir 朝向
     * @param count 步数，允许为负
     */
    move(dir: number, count: number): IFaceDescriptor;

    /**
     * 获取本组内的反方向，输入先经过 `degrade`，`Unknown` 返回 `Unknown`
     * @param dir 朝向
     */
    opposite(dir: number): T;

    /**
     * 在本组方向集合内顺时针（默认）或逆时针旋转一步，输入先经过 `degrade`，
     * `Unknown` 返回 `Unknown`
     * @param dir 朝向
     * @param anticlockwise 是否逆时针，默认顺时针
     */
    next(dir: number, anticlockwise?: boolean): T;

    /**
     * 迭代本组支持的所有朝向，包含 `Unknown`
     */
    mapDirection(): Iterable<T>;

    /**
     * 迭代本组所有朝向及其对应的坐标描述器，包含 `Unknown`（对应 `{ x: 0, y: 0 }`）
     */
    mapMovement(): Iterable<[T, IFaceDescriptor]>;
}

export interface IFaceManager {
    /**
     * 以数字 key 注册一个 handler
     * @param group 数字 key
     * @param handler 朝向处理器
     */
    register(group: number, handler: IFaceHandler<number>): void;

    /**
     * 以字符串 id 注册一个 handler
     * @param id 字符串 id
     * @param handler 朝向处理器
     */
    registerById(id: string, handler: IFaceHandler<number>): void;

    /**
     * 按数字 key 查找 handler，未找到返回 `null`
     * @param group 数字 key
     */
    get<T extends number>(group: number): IFaceHandler<T> | null;

    /**
     * 按字符串 id 查找 handler，未找到返回 `null`
     * @param id 字符串 id
     */
    getById<T extends number>(id: string): IFaceHandler<T> | null;
}

//#endregion

//#region 内置 Handler

const ZERO_DESCRIPTOR: IFaceDescriptor = { x: 0, y: 0 };

const DIR8_MOVEMENTS: ReadonlyMap<FaceDirection, IFaceDescriptor> = new Map([
    [FaceDirection.Unknown, ZERO_DESCRIPTOR],
    [FaceDirection.Left, { x: -1, y: 0 }],
    [FaceDirection.Up, { x: 0, y: -1 }],
    [FaceDirection.Right, { x: 1, y: 0 }],
    [FaceDirection.Down, { x: 0, y: 1 }],
    [FaceDirection.LeftUp, { x: -1, y: -1 }],
    [FaceDirection.RightUp, { x: 1, y: -1 }],
    [FaceDirection.LeftDown, { x: -1, y: 1 }],
    [FaceDirection.RightDown, { x: 1, y: 1 }]
]);

/** 顺时针旋转顺序（不含 Unknown） */
const DIR8_CW: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Up, FaceDirection.RightUp],
    [FaceDirection.RightUp, FaceDirection.Right],
    [FaceDirection.Right, FaceDirection.RightDown],
    [FaceDirection.RightDown, FaceDirection.Down],
    [FaceDirection.Down, FaceDirection.LeftDown],
    [FaceDirection.LeftDown, FaceDirection.Left],
    [FaceDirection.Left, FaceDirection.LeftUp],
    [FaceDirection.LeftUp, FaceDirection.Up]
]);

/** 逆时针旋转顺序（不含 Unknown） */
const DIR8_CCW: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Up, FaceDirection.LeftUp],
    [FaceDirection.LeftUp, FaceDirection.Left],
    [FaceDirection.Left, FaceDirection.LeftDown],
    [FaceDirection.LeftDown, FaceDirection.Down],
    [FaceDirection.Down, FaceDirection.RightDown],
    [FaceDirection.RightDown, FaceDirection.Right],
    [FaceDirection.Right, FaceDirection.RightUp],
    [FaceDirection.RightUp, FaceDirection.Up]
]);

const DIR8_OPPOSITE: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Up, FaceDirection.Down],
    [FaceDirection.Down, FaceDirection.Up],
    [FaceDirection.Left, FaceDirection.Right],
    [FaceDirection.Right, FaceDirection.Left],
    [FaceDirection.LeftUp, FaceDirection.RightDown],
    [FaceDirection.RightDown, FaceDirection.LeftUp],
    [FaceDirection.RightUp, FaceDirection.LeftDown],
    [FaceDirection.LeftDown, FaceDirection.RightUp]
]);

export class Dir8FaceHandler implements IFaceHandler<FaceDirection> {
    degrade(dir: number): FaceDirection {
        return dir as FaceDirection;
    }

    movement(dir: number): IFaceDescriptor {
        return DIR8_MOVEMENTS.get(this.degrade(dir)) ?? ZERO_DESCRIPTOR;
    }

    move(dir: number, count: number): IFaceDescriptor {
        const { x, y } = this.movement(dir);
        return { x: x * count, y: y * count };
    }

    opposite(dir: number): FaceDirection {
        const degraded = this.degrade(dir);
        return DIR8_OPPOSITE.get(degraded) ?? FaceDirection.Unknown;
    }

    next(dir: number, anticlockwise: boolean = false): FaceDirection {
        const degraded = this.degrade(dir);
        if (degraded === FaceDirection.Unknown) return FaceDirection.Unknown;
        const map = anticlockwise ? DIR8_CCW : DIR8_CW;
        return map.get(degraded) ?? FaceDirection.Unknown;
    }

    mapDirection(): Iterable<FaceDirection> {
        return DIR8_MOVEMENTS.keys();
    }

    mapMovement(): Iterable<[FaceDirection, IFaceDescriptor]> {
        return DIR8_MOVEMENTS.entries();
    }
}

const DIR4_DEGRADE: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Left, FaceDirection.Left],
    [FaceDirection.Up, FaceDirection.Up],
    [FaceDirection.Right, FaceDirection.Right],
    [FaceDirection.Down, FaceDirection.Down],
    [FaceDirection.LeftUp, FaceDirection.Left],
    [FaceDirection.LeftDown, FaceDirection.Left],
    [FaceDirection.RightUp, FaceDirection.Right],
    [FaceDirection.RightDown, FaceDirection.Right]
]);

const DIR4_MOVEMENTS: ReadonlyMap<FaceDirection, IFaceDescriptor> = new Map([
    [FaceDirection.Unknown, ZERO_DESCRIPTOR],
    [FaceDirection.Left, { x: -1, y: 0 }],
    [FaceDirection.Up, { x: 0, y: -1 }],
    [FaceDirection.Right, { x: 1, y: 0 }],
    [FaceDirection.Down, { x: 0, y: 1 }]
]);

const DIR4_CW: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Up, FaceDirection.Right],
    [FaceDirection.Right, FaceDirection.Down],
    [FaceDirection.Down, FaceDirection.Left],
    [FaceDirection.Left, FaceDirection.Up]
]);

const DIR4_CCW: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Up, FaceDirection.Left],
    [FaceDirection.Left, FaceDirection.Down],
    [FaceDirection.Down, FaceDirection.Right],
    [FaceDirection.Right, FaceDirection.Up]
]);

const DIR4_OPPOSITE: ReadonlyMap<FaceDirection, FaceDirection> = new Map([
    [FaceDirection.Up, FaceDirection.Down],
    [FaceDirection.Down, FaceDirection.Up],
    [FaceDirection.Left, FaceDirection.Right],
    [FaceDirection.Right, FaceDirection.Left]
]);

export class Dir4FaceHandler implements IFaceHandler<FaceDirection> {
    degrade(dir: number): FaceDirection {
        return DIR4_DEGRADE.get(dir as FaceDirection) ?? FaceDirection.Unknown;
    }

    movement(dir: number): IFaceDescriptor {
        return DIR4_MOVEMENTS.get(this.degrade(dir)) ?? ZERO_DESCRIPTOR;
    }

    move(dir: number, count: number): IFaceDescriptor {
        const { x, y } = this.movement(dir);
        return { x: x * count, y: y * count };
    }

    opposite(dir: number): FaceDirection {
        const degraded = this.degrade(dir);
        return DIR4_OPPOSITE.get(degraded) ?? FaceDirection.Unknown;
    }

    next(dir: number, anticlockwise: boolean = false): FaceDirection {
        const degraded = this.degrade(dir);
        if (degraded === FaceDirection.Unknown) return FaceDirection.Unknown;
        const map = anticlockwise ? DIR4_CCW : DIR4_CW;
        return map.get(degraded) ?? FaceDirection.Unknown;
    }

    mapDirection(): Iterable<FaceDirection> {
        return DIR4_MOVEMENTS.keys();
    }

    mapMovement(): Iterable<[FaceDirection, IFaceDescriptor]> {
        return DIR4_MOVEMENTS.entries();
    }
}

//#endregion

//#region FaceManager

export class FaceManager implements IFaceManager {
    private readonly byGroup: Map<number, IFaceHandler<number>> = new Map();
    private readonly byId: Map<string, IFaceHandler<number>> = new Map();

    register(group: number, handler: IFaceHandler<number>): void {
        this.byGroup.set(group, handler);
    }

    registerById(id: string, handler: IFaceHandler<number>): void {
        this.byId.set(id, handler);
    }

    get<T extends number>(group: number): IFaceHandler<T> | null {
        return (this.byGroup.get(group) as IFaceHandler<T>) ?? null;
    }

    getById<T extends number>(id: string): IFaceHandler<T> | null {
        return (this.byId.get(id) as IFaceHandler<T>) ?? null;
    }
}

//#endregion
