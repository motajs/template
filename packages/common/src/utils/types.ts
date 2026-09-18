export interface ISearchable4Dir {
    /** 获取上侧元素 */
    up(): ISearchable4Dir | null;
    /** 获取下侧元素 */
    down(): ISearchable4Dir | null;
    /** 获取左侧元素 */
    left(): ISearchable4Dir | null;
    /** 获取右侧元素 */
    right(): ISearchable4Dir | null;
}

export interface ISearchable8Dir {
    /** 获取上侧元素 */
    up(): ISearchable8Dir | null;
    /** 获取下侧元素 */
    down(): ISearchable8Dir | null;
    /** 获取左侧元素 */
    left(): ISearchable8Dir | null;
    /** 获取右侧元素 */
    right(): ISearchable8Dir | null;
    /** 获取左上元素 */
    leftUp(): ISearchable8Dir | null;
    /** 获取右上元素 */
    rightUp(): ISearchable8Dir | null;
    /** 获取左下元素 */
    leftDown(): ISearchable8Dir | null;
    /** 获取右下元素 */
    rightDown(): ISearchable8Dir | null;
}

//#region 范围

export interface IRangeHost {
    /** 区域整体宽度 */
    readonly width: number;
    /** 区域整体高度 */
    readonly height: number;
}

export interface IRange<T> {
    /**
     * 绑定宿主对象，宽度和高度将会使用此宿主对象的宽高
     * @param host 宿主对象
     */
    bindHost(host: IRangeHost): void;

    /**
     * 扫描一个可迭代对象，依次输出列表中在此范围内的对象。
     * 算法是依次迭代 `list` 的内容并判断其是否在范围内，计算次数为传入的列表长度。
     * @param list 要扫描的列表，每一项的值为 `y * width + x`
     * @param param 传递给范围对象的参数
     */
    iterate(list: Iterable<number>, param: Readonly<T>): Iterable<number>;

    /**
     * 迭代范围内的所有坐标，输出值为 `y * width + x`
     * @param param 传入范围对象的参数
     */
    iterateLoc(param: Readonly<T>): Iterable<number>;

    /**
     * 指定一个列表，按照一定的顺序判定这一点是否在列表中。
     * 算法是按照范围的内置顺序依次变量，然后判断这一点是否在列表中，计算次数为范围内包含的坐标数。
     * @param list 要扫描的列表，每一项的值为 `y * width + x`
     * @param param 传递给范围对象的参数
     */
    scan(list: Set<number>, param: Readonly<T>): Iterable<number>;

    /**
     * 自动决定是使用 {@link iterate} 来迭代还是使用 {@link scan} 来扫描。
     * @param list 要扫描的列表，每一项的值为 `y * width + x`
     * @param param 传递给范围对象的参数
     */
    autoDetect(list: Set<number>, param: Readonly<T>): Iterable<number>;

    /**
     * 判断一个点是否在范围内
     * @param x 横坐标
     * @param y 纵坐标
     * @param param 传递给范围对象的参数
     */
    inRange(x: number, y: number, param: Readonly<T>): boolean;

    /**
     * 判断一个索引是否在范围内
     * @param index 索引，值表示 y * width + x
     * @param param 传递给范围对象的参数
     */
    inRangeIndex(index: number, param: Readonly<T>): boolean;

    /**
     * 判断一个点是否在宿主对象矩形范围内
     * @param x 横坐标
     * @param y 纵坐标
     */
    inBound(x: number, y: number): boolean;

    /**
     * 判断一个点索引是否在宿主对象矩形范围内
     * @param index 索引
     */
    inBoundIndex(index: number): boolean;
}

export interface IRectRangeParam {
    /** 左上角横坐标 */
    x: number;
    /** 左上角纵坐标 */
    y: number;
    /** 范围宽度 */
    w: number;
    /** 范围高度 */
    h: number;
}

export interface IManhattanRangeParam {
    /** 中心横坐标 */
    cx: number;
    /** 中心纵坐标 */
    cy: number;
    /** 半径 */
    radius: number;
}

export interface IRayRangeParam {
    /** 中心点横坐标 */
    cx: number;
    /** 中心点纵坐标 */
    cy: number;
    /** 方向列表 */
    dir: IFaceDescriptor[];
}

//#endregion

//#region 实用接口

export interface ITileLocator {
    /** 图块所在横坐标 */
    x: number;
    /** 图块所在纵坐标 */
    y: number;
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

//#endregion
