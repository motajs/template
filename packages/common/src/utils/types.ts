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
