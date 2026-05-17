import { isNil } from 'lodash-es';
import {
    FaceDirection,
    IMoverController,
    IObjectMover,
    IRoleFaceBinder
} from '../common';
import { IDynamicLayer, IDynamicTile } from './types';
import { DynamicTileMover } from './mover';

export class DynamicTile implements IDynamicTile {
    readonly mover: IObjectMover<IDynamicTile>;
    triggerType: number;

    /** 当前的朝向绑定对象 */
    private face: IRoleFaceBinder | null = null;

    constructor(
        public num: number,
        public x: number,
        public y: number,
        public readonly layer: IDynamicLayer
    ) {
        this.mover = new DynamicTileMover(this);
        this.triggerType = -1;
    }

    setFaceBinder(binder: IRoleFaceBinder | null): void {
        this.face = binder;
    }

    setFaceDirection(direction: FaceDirection): number {
        if (!this.face) return this.num;
        const next = this.face.getFaceOf(this.num, direction);
        if (next) {
            this.num = next.identifier;
        }
        return this.num;
    }

    setTriggerType(type: number): void {
        this.triggerType = type;
    }

    delete(): Promise<void> {
        return this.layer.deleteDynamic(this);
    }

    toStatic(): void {
        this.layer.transferToStatic(this);
    }

    toStaticIfSafe(): boolean {
        return this.layer.transferToStaticIfSafe(this);
    }

    step(dir: FaceDirection, count?: number): IMoverController | null {
        if (this.mover.moving) return null;
        this.mover.step(dir, count);
        return this.mover.start();
    }

    setPos(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.layer.updateDynamicTile(this);
    }

    getCurrentFaceDirection(): FaceDirection {
        if (this.face) {
            const face = this.face.getFaceDirection(this.num);
            if (isNil(face)) return FaceDirection.Unknown;
            else return face;
        } else {
            return FaceDirection.Down;
        }
    }
}
