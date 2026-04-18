//#region 字段

export interface IFlagCommonField<T> {
    /** 此字段所处的 Flag 系统 */
    readonly system: IFlagSystem;

    /**
     * 设置此字段的值
     * @param value 要设置为的值
     */
    set(value: T): void;

    /**
     * 增减此字段的值，如果此字段的当前值不是数字，那么会抛出警告
     * @param value 增减值
     */
    add(value: number): void;

    /**
     * 获取此字段的值
     */
    get(): T;

    /**
     * 转换为可结构化存储的数据
     */
    toStructured(): any;

    /**
     * 从结构化存储数据中读取数据
     * @param data 结构化存储数据
     */
    fromStructured(data: any): void;
}

//#endregion

//#region 系统

export interface IFlagSystemSave {
    /** 每个字段的值，值为 {@link IFlagCommonField.toStructured} 方法输出 */
    readonly fields: Map<PropertyKey, any>;
}

export interface IFlagSystem {
    /**
     * 判断一个字段是否被占用，类似于旧样板的 `core.hasFlag`
     * @param field 字段名称
     */
    occupied(field: PropertyKey): boolean;

    /**
     * 以指定值插入字段
     * @param field 字段名称
     * @param value 字段值
     */
    insertField<T>(field: PropertyKey, value: T): IFlagCommonField<T>;

    /**
     * 获取指定字段对象
     * @param field 字段名称
     */
    getField<T>(field: PropertyKey): IFlagCommonField<T> | null;

    /**
     * 获取指定字段，如果字段不存在则以 `defaultValue` 创建字段。
     * 如果默认值计算量较大，建议使用 {@link getOrInsertComputed} 方法。
     * @param field 字段名称
     * @param defaultValue 字段默认值
     */
    getOrInsert<T>(field: PropertyKey, defaultValue: T): IFlagCommonField<T>;

    /**
     * 获取指定字段，如果字段不存在则以 `defaultValue` 创建字段。
     * 如果字段不存在则不会执行 `defaultValue` 函数，如果默认值计算量大，建议使用此方法。
     * @param field 字段名称
     * @param defaultValue 字段默认值函数
     */
    getOrInsertComputed<K extends PropertyKey, T>(
        field: K,
        defaultValue: (field: K) => T
    ): IFlagCommonField<T>;

    /**
     * 删除指定字段
     * @param field 字段名称
     */
    deleteField(field: PropertyKey): void;

    /**
     * 设置字段的值，类似于旧样板的 `core.setFlag`，等同于如下代码：
     * ```ts
     * const field = flagSystem.getField(name);
     * field.set(value);
     * ```
     * @param field 字段名称
     * @param value 要设置为的值
     */
    setFieldValue(field: PropertyKey, value: any): void;

    /**
     * 对字段的值进行增减操作，如果字段的值不是数字，那么会抛出警告。
     * 类似于旧样板的 `core.addFlag`，等同于如下代码：
     * ```ts
     * const field = flagSystem.getField(name);
     * field.add(value);
     * ```
     * @param field 字段名称
     * @param value 字段增减值
     */
    addFieldValue(field: PropertyKey, value: number): void;

    /**
     * 获取指定字段的值，类似于旧样板的 `core.getFlag`，但是没有默认值，
     * 如果需要默认值使用 {@link getFieldValueDefaults} 等方法。等同于如下代码：
     * ```ts
     * flagSystem.getField(name)?.get();
     * ```
     * @param field 字段名称
     */
    getFieldValue<T>(field: PropertyKey): T | undefined;

    /**
     * 获取字段的值，如果字段不存在会返回默认值，并以默认值创建新字段，
     * 类似于旧样板的 `core.getFlag`，且包含默认值，等同于如下代码：
     * ```ts
     * const field = flagSystem.getOrInsert(name, defaultValue);
     * return field.get();
     * ```
     * @param field 字段名称
     * @param defaultValue 字段默认值
     */
    getFieldValueDefaults<T>(field: PropertyKey, defaultValue: T): T;

    /**
     * 对 Flag 系统进行结构化复制，形成存档对象
     */
    saveState(): IFlagSystemSave;

    /**
     * 从指定存档对象读取信息
     * @param state 存档对象
     */
    loadState(state: IFlagSystemSave): void;
}

//#endregion
