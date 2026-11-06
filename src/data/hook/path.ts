import { ICoreState } from '@user/data-state';
import {
    IPathfindingResult,
    IPathfindingSystem,
    IPathfindingSystemHooks
} from '@user/data-system';

export class MainPathfindingSystemHooks implements IPathfindingSystemHooks {
    constructor(readonly state: ICoreState) {}

    onBeforeTeleportTo(
        path: IPathfindingResult,
        system: IPathfindingSystem
    ): void {
        // 删除下面这两行注释开始编写你自己的自动寻路瞬移前钩子，注意非勇士的瞬移也会触发
        void path;
        void system;
    }

    onAfterTeleportTo(
        path: IPathfindingResult,
        system: IPathfindingSystem
    ): void {
        // 删除下面这两行注释开始编写你自己的自动寻路瞬移后钩子，注意非勇士的瞬移也会触发
        void path;
        void system;
    }
}
