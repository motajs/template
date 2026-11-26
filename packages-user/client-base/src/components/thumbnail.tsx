import {
    ElementLocator,
    MotaOffscreenCanvas2D,
    Transform
} from '@motajs/render';
import { DefaultProps, xywh } from '@motajs/render-vue';
import { computed, defineComponent, inject, watch } from 'vue';
import { SetupComponentOptions } from '@motajs/system';
import { IMapRenderer } from '../map';
import { IMapState } from '@user/data-base';
import { clamp, isNil } from 'lodash-es';

// TODO: 显伤

export interface IThumbnailCellProps extends DefaultProps {
    /** 楼层 ID */
    floorId?: string;
    /** 楼层存储对象 */
    maps?: IMapState;
    /** 地图渲染器，默认会使用主对象上的辅助地图渲染器，如果不知道传什么就不要传 */
    renderer?: IMapRenderer;
    /** 显示尺寸，1 表示与原始尺寸一致，默认为 1 */
    size?: number;
    /** 显示区域的左上角**分块坐标**，写小数会向下取整 */
    origin?: [x: number, y: number];
    /**
     * 是否自动根据 `size` 和显示区域适应元素尺寸，启用时会自动适应元素尺寸，传入尺寸无效。
     * 若未启用，地图将会画在容器的左上角位置，不会居中绘制。剩余内容会完全透明。
     */
    autoSize?: boolean;
    /** 是否渲染伤害数字 */
    damage?: boolean;
}

export type ThumbnailCellEmits = {
    /**
     * 在 `autoSize` 条件下，当元素尺寸修改时触发，未启用 `autoSize` 不会触发
     * @param width 更新后的宽度
     * @param height 更新后的高度
     */
    updateSize: (width: number, height: number) => void;
};

const thumbnailCellProps = {
    props: [
        'floorId',
        'maps',
        'renderer',
        'size',
        'origin',
        'autoSize',
        'damage',
        'loc',
        'x',
        'y',
        'width',
        'height'
    ],
    emits: ['updateSize']
} satisfies SetupComponentOptions<
    IThumbnailCellProps,
    ThumbnailCellEmits,
    keyof ThumbnailCellEmits
>;

/**
 * 渲染地图缩略图的一个区块。注意，地图渲染器是一个状态机，如果频繁切换地图会导致性能严重下降，
 * 如果你需要使用此组件同时渲染多个不同地图区块，建议给同一地图缩略图添加相同的 `zIndex` 以减少地图切换，提高性能表现。
 */
export const ThumbnailCell = defineComponent<
    IThumbnailCellProps,
    ThumbnailCellEmits,
    keyof ThumbnailCellEmits
>((props, { emit }) => {
    const defaultRenderer = inject<IMapRenderer | null>(
        '@default/expandMapRenderer',
        null
    );
    /** 使用的地图渲染器 */
    const mapRenderer = computed(() => props.renderer ?? defaultRenderer);

    const [x, y, width, height] = xywh(props);

    /** 渲染缩放尺寸 */
    const size = computed(() => props.size ?? 1);
    /** 当前地图 */
    const map = computed(() => {
        if (isNil(props.floorId) || !props.maps) return null;
        return props.maps.getMap(props.floorId);
    });
    /** 分块坐标 */
    const origin = computed<[number, number]>(() => {
        if (!props.origin) return [0, 0];
        const [x, y] = props.origin;
        return [Math.floor(x), Math.floor(y)];
    });

    /** 渲染区域大小 */
    const chunkSize = computed<[number, number]>(() => {
        const renderer = mapRenderer.value;
        if (!renderer || !props.origin || !map.value) return [0, 0];
        const [ox, oy] = props.origin;
        const { chunkWidth, chunkHeight } = renderer.vertex.block;
        const { width, height } = map.value;
        const sx = ox * chunkWidth;
        const sy = oy * chunkHeight;
        const restWidth = width - sx;
        const restHeight = height - sy;
        return [
            clamp(restWidth, 0, chunkWidth),
            clamp(restHeight, 0, chunkHeight)
        ];
    });

    /** 真实的渲染尺寸 */
    const renderSize = computed<[number, number]>(() => {
        const renderer = mapRenderer.value;
        if (!renderer) return [1, 1];
        const [cw, ch] = chunkSize.value;
        if (cw === 0 || ch === 0) return [1, 1];
        const { cellWidth, cellHeight } = renderer;
        return [cw * cellWidth * size.value, ch * cellHeight * size.value];
    });

    /** 元素定位 */
    const loc = computed<ElementLocator>(() => {
        if (props.autoSize) {
            const [w, h] = renderSize.value;
            return [x.value, y.value, w, h];
        } else {
            return [x.value, y.value, width.value, height.value];
        }
    });

    watch(renderSize, ([w, h]) => {
        if (props.autoSize) {
            emit('updateSize', w, h);
        }
    });

    const render = (canvas: MotaOffscreenCanvas2D) => {
        const [cw, ch] = chunkSize.value;
        const ctx = canvas.ctx;
        if (!mapRenderer.value || !map.value || cw === 0 || ch === 0) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const hw = canvas.width / 2;
            const hh = canvas.height / 2;
            ctx.fillText('未绑定渲染器或楼层对象', hw, hh);
            return;
        }
        const renderer = mapRenderer.value;
        // 重置激励时间戳，保证显示内容的一致性，不会因为动画导致显示内容变化
        renderer.excited(0);
        renderer.setGameMap(map.value);
        const { width, height } = renderer.canvas;
        const [rw, rh] = renderSize.value;
        const [ox, oy] = origin.value;
        /** 区块起始位置的像素横坐标 */
        const otx = ox * rw;
        /** 区块起始位置的像素纵坐标 */
        const oty = oy * rh;
        // 为了保证渲染精度正确，如果 renderSize 大于画布尺寸，那么还需要专门拼图，所以这里要取二者的较小值
        const dw = Math.min(width, rw);
        const dh = Math.min(height, rh);
        renderer.setRenderSize(dw, dh);
        const xCount = Math.ceil(rw / dw - 1e-8);
        const yCount = Math.ceil(rh / dh - 1e-8);
        const before = renderer.transform;
        const transform = new Transform();
        renderer.setTransform(transform);

        if (xCount === 1 && yCount === 1) {
            // 若二者都是 1，说明渲染区域在画布范围内，那么好说，渲染一次足够，大多数情况下应该都走这条分支
            renderer.setViewport(0, 0, dw, dh);
            transform.translate(otx / dw, oty / dh);
            transform.scale(size.value);
            const result = renderer.render();
            ctx.drawImage(result.canvas, 0, 0, dw, dh, 0, 0, dw, dh);
        } else {
            // 如果不是的话，说明需要专门拼接
            // 拼接按照先横向再纵向的顺序
            for (let ny = 0; ny < yCount - 1; ny++) {
                renderer.setViewport(0, 0, dw, dh);
                for (let nx = 0; nx < xCount - 1; nx++) {
                    /** 这个拼接位置的像素横坐标 */
                    const rtx = otx / dw + nx;
                    /** 这个拼接位置的像素纵坐标 */
                    const rty = oty / dh + ny;
                    transform.reset();
                    transform.translate(rtx, rty);
                    transform.scale(size.value);
                    const result = renderer.render();
                    const dx = dw * nx;
                    const dy = dh * ny;
                    ctx.drawImage(result.canvas, 0, 0, dw, dh, dx, dy, dw, dh);
                }
                // 尾部要专门处理，避免涉及下一个区块，不增加不必要的区块顶点生成
                // 算法是先获取渲染区域最右侧的坐标，然后 -1 得到对应左侧的坐标
                // 注意这里要裁剪，只取最右侧的一部分
                const rtx = (otx + rw) / dw - 1;
                const rty = oty / dh + ny;
                const sw = rw % dw;
                const sx = dw - sw;
                transform.reset();
                transform.translate(rtx, rty);
                transform.scale(size.value);
                const result = renderer.render();
                const dx = dw * (xCount - 1);
                const dy = dh * ny;
                ctx.drawImage(result.canvas, sx, 0, sw, dh, dx, dy, sw, dh);
            }
            // 纵向的尾部也要单独处理
            for (let nx = 0; nx < xCount - 1; nx++) {
                const rtx = otx / dw + nx;
                const rty = (oty + rh) / dh - 1;
                const sh = rh % dh;
                const sy = dh - sh;
                transform.reset();
                transform.translate(rtx, rty);
                transform.scale(size.value);
                const result = renderer.render();
                const dx = dw * nx;
                const dy = dh * (yCount - 1);
                ctx.drawImage(result.canvas, 0, sy, dw, sh, dx, dy, dw, sh);
            }
            // 还有最右下角的一个小块
            const rtx = (otx + rw) / dw - 1;
            const rty = (oty + rh) / dh - 1;
            const sw = rw % dw;
            const sx = dw - sw;
            const sh = rh % dh;
            const sy = dh - sh;
            transform.reset();
            transform.translate(rtx, rty);
            transform.scale(size.value);
            const result = renderer.render();
            const dx = dw * (xCount - 1);
            const dy = dh * (yCount - 1);
            ctx.drawImage(result.canvas, sx, sy, sw, sh, dx, dy, sw, sh);
        }

        renderer.setTransform(before);
    };

    return () => (
        <custom
            loc={loc.value}
            render={render}
            bindings={[map.value, renderSize.value]}
            noanti
        />
    );
}, thumbnailCellProps);

interface IThumbnailChunk {
    /** 这个区块的定位 */
    readonly loc: ElementLocator;
    /** 区块位置 */
    readonly origin: [number, number];
}

interface IThumbnailChunkData {
    /** 每个区块的数据 */
    readonly chunks: IThumbnailChunk[];
    /** 裁切矩形的定位 */
    readonly slice: ElementLocator;
}

export interface ThumbnailProps extends DefaultProps {
    /** 楼层 ID */
    floorId?: string;
    /** 楼层存储对象 */
    maps?: IMapState;
    /** 缩略图填充样式，默认为黑色 */
    padStyle?: CanvasStyle;
    /** 地图渲染器，注意如果你不知道地图渲染的细节，一定永远传入 `expandMapRenderer`！ */
    renderer?: IMapRenderer;
    /**
     * 要展示的地图区域的**格子坐标**，可以写小数以显示半个格子，超出地图范围的会被忽略，
     * 地图会被正确平移，例如起始横坐标为 -1，那么地图会从 1 处开始画，最左侧一列会留空。
     */
    area?: [x: number, y: number, w: number, h: number];
    /** 显示尺寸，1 表示与原始尺寸一致，默认为 1 */
    size?: number;
    /**
     * 是否自适应元素尺寸，启用后会根据渲染区域和尺寸等自动设置元素的尺寸，此时传入尺寸无效。
     * 不启用时，缩略图会画在容器的左上角，为包含地图的区域会使用 `padStyle` 填充。
     */
    autoSize?: boolean;
    /** 是否启用伤害显示 */
    damage?: boolean;
}

const thumbnailProps = {
    props: [
        'floorId',
        'maps',
        'padStyle',
        'renderer',
        'area',
        'size',
        'autoSize',
        'damage',
        'loc',
        'x',
        'y',
        'width',
        'height'
    ]
} satisfies SetupComponentOptions<ThumbnailProps>;

export const Thumbnail = defineComponent<ThumbnailProps>(props => {
    const defaultRenderer = inject<IMapRenderer | null>(
        '@default/expandMapRenderer',
        null
    );
    /** 使用的地图渲染器 */
    const mapRenderer = computed(() => props.renderer ?? defaultRenderer);
    /** 空白区域填充样式 */
    const padStyle = computed(() => props.padStyle ?? 'black');
    /** 渲染尺寸比例 */
    const size = computed(() => props.size ?? 1);

    const [x, y, width, height] = xywh(props);

    /** 当前地图 */
    const map = computed(() => {
        if (isNil(props.floorId) || !props.maps) return null;
        return props.maps.getMap(props.floorId);
    });

    /** 渲染区域，考虑了区域是否超出了地图范围 */
    const area = computed<[number, number, number, number]>(() => {
        if (!props.area || !map.value) return [0, 0, 0, 0];
        const [x, y, w, h] = props.area;
        if (w <= 0 || h <= 0) return [0, 0, 0, 0];
        const { width, height } = map.value;
        const left = clamp(x, 0, width - 1);
        const top = clamp(y, 0, height - 1);
        const right = clamp(x + w, 0, width);
        const bottom = clamp(y + h, 0, height);
        return [left, top, right - left, bottom - top];
    });

    /** 渲染尺寸 */
    const renderSize = computed(() => {
        const renderer = mapRenderer.value;
        if (!renderer || !props.area) return [1, 1];
        const [, , w, h] = props.area;
        const { cellWidth, cellHeight } = renderer;
        return [cellWidth * w * size.value, cellHeight * h * size.value];
    });

    /** 元素定位 */
    const loc = computed<ElementLocator>(() => {
        if (props.autoSize) {
            const [w, h] = renderSize.value;
            return [x.value, y.value, w, h];
        } else {
            return [x.value, y.value, width.value, height.value];
        }
    });

    /** ThumbnailCell 的分块信息 */
    const chunks = computed<IThumbnailChunkData>(() => {
        const renderer = mapRenderer.value;
        if (!renderer || !props.area) {
            return {
                chunks: [],
                slice: []
            };
        }
        // 原始的 area 还需要用来考虑平移，所以也要读取
        const [x, y] = props.area;
        const [nx, ny, nw, nh] = area.value;
        const { chunkWidth, chunkHeight } = renderer.vertex.block;

        // 获取目标渲染区域都有哪些分块，然后把这些分块形成 ThumbnailCell 能看懂的参数形式
        const startChunkX = Math.floor(nx / chunkWidth + 1e-8);
        const startChunkY = Math.floor(ny / chunkHeight + 1e-8);
        const endChunkX = Math.ceil((nx + nw) / chunkWidth - 1e-8);
        const endChunkY = Math.ceil((ny + nh) / chunkHeight - 1e-8);
        const xCount = endChunkX - startChunkX;
        const yCount = endChunkY - startChunkY;
        const startTileX = startChunkX * chunkWidth;
        const startTileY = startChunkY * chunkHeight;
        const chunkPixelWidth = chunkWidth * renderer.cellWidth * size.value;
        const chunkPixelHeight = chunkHeight * renderer.cellHeight * size.value;

        const chunks: IThumbnailChunk[] = [];
        for (let ny = 0; ny < yCount; ny++) {
            for (let nx = 0; nx < xCount; nx++) {
                const cx = startTileX + nx * chunkWidth - x;
                const cy = startTileY + ny * chunkHeight - y;
                const cpx = cx * renderer.cellWidth * size.value;
                const cpy = cy * renderer.cellHeight * size.value;
                chunks.push({
                    loc: [cpx, cpy, chunkPixelWidth, chunkPixelHeight],
                    origin: [nx + startChunkX, ny + startChunkY]
                });
            }
        }

        // 最后计算裁剪矩形的范围，裁剪矩形使用 destination-in 实现
        const sx = Math.max(0, (nx - x) * renderer.cellWidth * size.value);
        const sy = Math.max(0, (ny - y) * renderer.cellHeight * size.value);
        const sw = nw * renderer.cellWidth * size.value;
        const sh = nh * renderer.cellHeight * size.value;

        return { chunks, slice: [sx, sy, sw, sh] };
    });

    return () => (
        <container loc={loc.value} nocache>
            <g-rect
                loc={[0, 0, loc.value[2], loc.value[3]]}
                fillStyle={padStyle.value}
                zIndex={0}
            />
            <container loc={[0, 0, loc.value[2], loc.value[3]]} zIndex={10}>
                {chunks.value.chunks.map(chunk => (
                    <ThumbnailCell
                        loc={chunk.loc}
                        origin={chunk.origin}
                        renderer={mapRenderer.value ?? void 0}
                        maps={props.maps}
                        floorId={props.floorId}
                        size={size.value}
                        damage={props.damage}
                        zIndex={10}
                    />
                ))}
                <g-rect
                    loc={chunks.value.slice}
                    fillStyle="#FFF"
                    zIndex={10}
                    composite="destination-in"
                />
            </container>
        </container>
    );
}, thumbnailProps);
