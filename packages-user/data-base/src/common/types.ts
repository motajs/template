export const enum FaceDirection {
    Unknown,
    Left,
    Up,
    Right,
    Down,
    LeftUp,
    RightUp,
    LeftDown,
    RightDown
}

export interface IFaceData {
    /** 图块数字 */
    readonly identifier: number;
    /** 图块朝向 */
    readonly face: FaceDirection;
}
