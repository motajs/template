import { clamp } from 'lodash-es';
import {
    IDirectionDescriptor,
    IManhattanRangeParam,
    IRangeHost,
    IRange,
    IRayRangeParam,
    IRectRangeParam
} from './types';

export abstract class BaseRange<T> implements IRange<T> {
    protected host: IRangeHost = { width: 0, height: 0 };

    bindHost(host: IRangeHost): void {
        this.host = host;
    }

    /**
     * 判断一个点是否在宿主对象范围内
     * @param x 横坐标
     * @param y 纵坐标
     */
    protected isInBounds(x: number, y: number) {
        const { width, height } = this.host;
        return x >= 0 && y >= 0 && x < width && y < height;
    }

    /**
     * 判断一个坐标索引是否在宿主对象范围内
     * @param index 坐标索引
     */
    protected isValidIndex(index: number) {
        const { width, height } = this.host;
        return index >= 0 && index < width * height;
    }

    /**
     * 估算范围内总共有多少个点
     * @param param 传递的参数
     */
    protected abstract estimatePointCount(param: Readonly<T>): number;

    abstract iterateLoc(param: Readonly<T>): Iterable<number>;

    abstract inRange(x: number, y: number, param: Readonly<T>): boolean;

    inRangeIndex(index: number, param: Readonly<T>): boolean {
        const { width } = this.host;
        return this.inRange(index % width, Math.floor(index / width), param);
    }

    *iterate(list: Iterable<number>, param: Readonly<T>): Iterable<number> {
        for (const index of list) {
            if (this.inRangeIndex(index, param)) yield index;
        }
    }

    *scan(list: Set<number>, param: Readonly<T>): Iterable<number> {
        for (const index of this.iterateLoc(param)) {
            if (list.has(index)) yield index;
        }
    }

    autoDetect(list: Set<number>, param: Readonly<T>): Iterable<number> {
        if (this.estimatePointCount(param) < list.size) {
            return this.scan(list, param);
        } else {
            return this.iterate(list, param);
        }
    }
}

export class RectRange extends BaseRange<IRectRangeParam> {
    protected estimatePointCount(param: Readonly<IRectRangeParam>): number {
        return Math.abs(param.w) * Math.abs(param.h);
    }

    *iterateLoc(param: Readonly<IRectRangeParam>): Iterable<number> {
        const { width, height } = this.host;
        const sx = clamp(Math.min(param.x, param.x + param.w), 0, width);
        const sy = clamp(Math.min(param.y, param.y + param.h), 0, height);
        const ex = clamp(Math.max(param.x, param.x + param.w), 0, width);
        const ey = clamp(Math.max(param.y, param.y + param.h), 0, height);
        if (sx >= ex || sy >= ey) return;

        for (let y = sy; y < ey; y++) {
            for (let x = sx; x < ex; x++) {
                yield y * width + x;
            }
        }
    }

    inRange(x: number, y: number, param: Readonly<IRectRangeParam>): boolean {
        const sx = Math.min(param.x, param.x + param.w);
        const sy = Math.min(param.y, param.y + param.h);
        const ex = Math.max(param.x, param.x + param.w);
        const ey = Math.max(param.y, param.y + param.h);

        return this.isInBounds(x, y) && x >= sx && y >= sy && x < ex && y < ey;
    }
}

export class ManhattanRange extends BaseRange<IManhattanRangeParam> {
    protected estimatePointCount(
        param: Readonly<IManhattanRangeParam>
    ): number {
        const radius = Math.max(0, param.radius);
        return 1 + 2 * radius * (radius + 1);
    }

    *iterateLoc(param: Readonly<IManhattanRangeParam>): Iterable<number> {
        const { width, height } = this.host;
        for (let dy = -param.radius; dy <= param.radius; dy++) {
            const y = param.cy + dy;
            if (y < 0 || y >= height) {
                continue;
            }

            const span = param.radius - Math.abs(dy);
            const startX = Math.max(0, param.cx - span);
            const endX = Math.min(width - 1, param.cx + span);
            for (let x = startX; x <= endX; x++) {
                yield y * width + x;
            }
        }
    }

    inRange(
        x: number,
        y: number,
        param: Readonly<IManhattanRangeParam>
    ): boolean {
        return (
            this.isInBounds(x, y) &&
            Math.abs(x - param.cx) + Math.abs(y - param.cy) <= param.radius
        );
    }
}

export class RayRange extends BaseRange<IRayRangeParam> {
    protected estimatePointCount(param: Readonly<IRayRangeParam>): number {
        const { width, height } = this.host;
        // 考虑到这种范围的 `inRange` 判断要更加耗时，因此将返回值略微降低，更倾向于使用 `scan` 方式
        return ((width + height) * param.dir.length) / 3;
    }

    /**
     * 判断一个点是否在某条射线上
     * @param x 横坐标
     * @param y 纵坐标
     * @param direction 方向对象
     * @param param 范围参数
     */
    private isPointOnRay(
        x: number,
        y: number,
        direction: IDirectionDescriptor,
        param: Readonly<IRayRangeParam>
    ): boolean {
        if (direction.x === 0 && direction.y === 0) {
            return false;
        }

        const deltaX = x - param.cx;
        const deltaY = y - param.cy;

        if (direction.x === 0) {
            return (
                deltaX === 0 &&
                deltaY % direction.y === 0 &&
                deltaY / direction.y >= 0
            );
        }

        if (direction.y === 0) {
            return (
                deltaY === 0 &&
                deltaX % direction.x === 0 &&
                deltaX / direction.x >= 0
            );
        }

        if (deltaX % direction.x !== 0 || deltaY % direction.y !== 0) {
            return false;
        }

        const stepX = deltaX / direction.x;
        const stepY = deltaY / direction.y;
        return stepX >= 0 && stepX === stepY;
    }

    *iterateLoc(param: Readonly<IRayRangeParam>): Iterable<number> {
        const { width } = this.host;
        const yielded = new Set<number>();

        if (this.isInBounds(param.cx, param.cy)) {
            const centerIndex = param.cy * width + param.cx;
            yielded.add(centerIndex);
            yield centerIndex;
        }

        for (const direction of param.dir) {
            if (direction.x === 0 && direction.y === 0) {
                continue;
            }

            let x = param.cx + direction.x;
            let y = param.cy + direction.y;
            while (this.isInBounds(x, y)) {
                const index = y * width + x;
                if (!yielded.has(index)) {
                    yielded.add(index);
                    yield index;
                }
                x += direction.x;
                y += direction.y;
            }
        }
    }

    inRange(x: number, y: number, param: Readonly<IRayRangeParam>): boolean {
        if (!this.isInBounds(x, y)) {
            return false;
        }

        if (x === param.cx && y === param.cy) {
            return true;
        }

        for (const direction of param.dir) {
            if (this.isPointOnRay(x, y, direction, param)) {
                return true;
            }
        }

        return false;
    }
}

export class FullRange extends BaseRange<void> {
    protected estimatePointCount(): number {
        const { width, height } = this.host;
        return width * height;
    }

    iterate(list: Iterable<number>): Iterable<number> {
        return list;
    }

    *iterateLoc(): Iterable<number> {
        const { width, height } = this.host;
        for (let index = 0; index < width * height; index++) {
            yield index;
        }
    }

    scan(list: Set<number>): Iterable<number> {
        return list;
    }

    autoDetect(list: Set<number>): Iterable<number> {
        return list;
    }

    inRange(x: number, y: number): boolean {
        return this.isInBounds(x, y);
    }

    inRangeIndex(index: number): boolean {
        return this.isValidIndex(index);
    }
}

export class NoneRange extends BaseRange<void> {
    protected estimatePointCount(): number {
        return 0;
    }

    iterate(): Iterable<number> {
        return new Set();
    }

    iterateLoc(): Iterable<number> {
        return new Set();
    }

    scan(): Iterable<number> {
        return new Set();
    }

    autoDetect(): Iterable<number> {
        return new Set();
    }

    inRange(): boolean {
        return false;
    }

    inRangeIndex(): boolean {
        return false;
    }
}
