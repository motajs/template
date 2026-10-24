import {
    IGameMap,
    IHeroAttributeHooks,
    IHeroChangeFloorInfo,
    IHeroLocation,
    IHeroLocationHooks,
    IHeroStateHooks
} from '@user/data-base';
import {
    FaceDirection,
    IHeroAttr,
    IObjectMover,
    IObjectMoverHooks,
    ObjectMoveStep
} from '@user/data-common';
import { ICoreState } from '@user/data-state';

export class MainHeroAttributeHooks implements IHeroAttributeHooks<IHeroAttr> {
    constructor(readonly state: ICoreState) {}

    onUpdateAttribute<K extends keyof IHeroAttr>(
        name: K,
        value: IHeroAttr[K]
    ): void {
        // 删除下面这两行开始编写你自己的勇士属性更新钩子
        void name;
        void value;
    }
}

export class MainHeroLocationHooks implements IHeroLocationHooks {
    constructor(readonly state: ICoreState) {}

    onSetFloor(map: IGameMap | null): void {
        // 删除下面这两行开始编写你自己的切换楼层钩子
        void map;
    }

    onSetPos(x: number, y: number): void {
        // 删除下面这两行开始编写你自己的勇士位置设置钩子
        void x;
        void y;
    }
}

export class MainHeroMoverHooks implements IObjectMoverHooks<IHeroLocation> {
    constructor(readonly state: ICoreState) {}

    async onMoveStart(
        tile: IHeroLocation,
        mover: IObjectMover<IHeroLocation>
    ): Promise<void> {
        // 删除下面这两行注释开始编写你自己的勇士移动前钩子
        void tile;
        void mover;
    }

    async onStepStart(
        code: number,
        step: Readonly<ObjectMoveStep>,
        tile: IHeroLocation,
        mover: IObjectMover<IHeroLocation>
    ): Promise<void> {
        // 删除下面这四行注释开始编写你自己的勇士每步开始时钩子
        void code;
        void step;
        void tile;
        void mover;
    }

    async onStepEnd(
        code: number,
        step: Readonly<ObjectMoveStep>,
        tile: IHeroLocation,
        mover: IObjectMover<IHeroLocation>
    ): Promise<void> {
        // 删除下面这四行注释开始编写你自己的勇士每步结束后钩子
        void code;
        void step;
        void tile;
        void mover;
    }

    async onMoveEnd(
        tile: IHeroLocation,
        mover: IObjectMover<IHeroLocation>
    ): Promise<void> {
        // 删除下面这两行注释开始编写你自己的勇士移动前钩子
        void tile;
        void mover;
    }

    onSetFaceDir(
        dir: FaceDirection,
        tile: IHeroLocation,
        mover: IObjectMover<IHeroLocation>
    ): void {
        // 删除下面这三行注释开始编写你自己的设置面朝朝向的钩子
        void dir;
        void tile;
        void mover;
    }

    onSetMoveDir(
        dir: FaceDirection,
        tile: IHeroLocation,
        mover: IObjectMover<IHeroLocation>
    ): void {
        // 删除下面这三行注释开始编写你自己的设置移动朝向的钩子
        void dir;
        void tile;
        void mover;
    }

    onSetPos(
        x: number,
        y: number,
        tile: IHeroLocation,
        mover: IObjectMover<IHeroLocation>
    ): void {
        // 删除下面这三行注释开始编写你自己的设置位置的钩子
        void x;
        void y;
        void tile;
        void mover;
    }
}

export class MainHeroStateHooks implements IHeroStateHooks {
    constructor(readonly state: ICoreState) {}

    async onBeforeChangeFloor(info: IHeroChangeFloorInfo): Promise<void> {
        // 删除下面这一行注释开始编写你自己的楼层转换前钩子
        void info;
    }

    async onAfterChangeFloor(info: IHeroChangeFloorInfo): Promise<void> {
        // 删除下面这一行注释开始编写你自己的楼层转换后钩子
        void info;
    }
}
