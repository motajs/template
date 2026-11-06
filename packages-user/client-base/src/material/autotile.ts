import {
    IRect,
    ITextureRenderable,
    SizedCanvasImageSource
} from '@motajs/render';
import {
    AutotileConnection,
    AutotileType,
    IAutotileConnection,
    IAutotileProcessor,
    IMaterialFramedData
} from './types';
import { ICoreState } from '@user/data-state';
import { isNil } from 'lodash-es';
import { logger } from '@motajs/common';

// 3x4 自动元件索引图
//
// | <- 当上下左右都没有连接时，会使用左上角的内容，其实等同于使用 [12, 17, 42, 47]
// |-------|-------|-------| <- 当上左、上右、下左、下右有连接时，会使用右上角的内容
// | 00 01 | 02 03 | 04 05 |
// | 06 07 | 08 09 | 10 11 |
// |-------|-------|-------| <- 分割线，上面用于控制无连接（左）以及十字连接（右），中间用于判断父子关系（特殊连接）
// | 12 13 | 14 15 | 16 17 |
// | 18 19 | 20 21 | 22 23 |
// |-------|-------|-------| <- 当仅下方有连接时，会用第二行的内容
// | 24 25 | 26 27 | 28 29 |
// | 30 31 | 32 33 | 34 35 |
// |-------|-------|-------| <- 当上下都有连接时，会用第三行的内容
// | 36 37 | 38 39 | 40 41 |
// | 42 43 | 44 45 | 46 47 |
// |-------|-------|-------| <- 当仅上方有连接时，会用第四行的内容
// |       |       |       |
// |       |       |       | <- 左右和上下的连接会相互干扰，具体干扰方式间右上角内容的描述
// |       |       | <- 当仅左方有连接时，会使用第三列的内容
// |       | <- 当左右都有连接时，会使用第二列的内容
// | <- 当仅右方有连接时，会用第一列的内容

// 2x3 自动元件索引图
//
// |-------|-------|
// | 00 01 | 02 03 |
// | 04 05 | 06 07 |
// |-------|-------| <- 分割线，上面用于控制无连接（左）以及十字连接（右），这种自动元件无法从图片获取父子关系
// | 08 09 | 10 11 |
// | 12 13 | 14 15 |
// |-------|-------|
// | 16 17 | 18 19 |
// | 20 21 | 22 23 |
// |-------|-------|
// 此自动元件本质上是把 3x4 自动元件中间的 4x4 区域合并为了这里的 [13, 14, 17, 18]

interface IConnectedAutotile {
    /** 左上角 */
    readonly lt: Readonly<IRect>;
    /** 右上角 */
    readonly rt: Readonly<IRect>;
    /** 右下角 */
    readonly rb: Readonly<IRect>;
    /** 左下角 */
    readonly lb: Readonly<IRect>;
}

export class AutotileProcessor implements IAutotileProcessor {
    /** 自动元件特殊连接方式映射 */
    private readonly spec: Map<number, Set<number>> = new Map();

    /** 3x4 自动元件的各方向连接索引 */
    readonly conn3x4: Map<number, [number, number, number, number]> = new Map();
    /** 2x3 自动元件的各方向连接索引 */
    readonly conn2x3: Map<number, [number, number, number, number]> = new Map();
    /** 不重复连接映射，用于平铺自动元件，一共 48 种 */
    readonly distinct: Map<number, number> = new Map();

    constructor(readonly state: ICoreState) {
        this.conn3x4 = this.mapAutotile(AutotileType.Big3x4);
        this.conn2x3 = this.mapAutotile(AutotileType.Small2x3);
        this.deduplicateConnection();
    }

    /**
     * 映射自动元件连接
     * @param type 自动元件类型
     */
    private mapAutotile(type: AutotileType) {
        // 这些常量非常 magic，可以参考文件开头的索引注释来理解
        const h = type === AutotileType.Big3x4 ? 2 : 1; // 横向偏移因子
        const v = type === AutotileType.Big3x4 ? 12 : 4; // 纵向偏移因子
        const luo = type === AutotileType.Big3x4 ? 12 : 8; // leftup origin
        const ruo = type === AutotileType.Big3x4 ? 17 : 11; // rightup origin
        const ldo = type === AutotileType.Big3x4 ? 42 : 20; // leftdown origin
        const rdo = type === AutotileType.Big3x4 ? 47 : 23; // rightdown origin
        const luc = type === AutotileType.Big3x4 ? 4 : 2; // leftup corner
        const ruc = type === AutotileType.Big3x4 ? 5 : 3; // rightup corner
        const rdc = type === AutotileType.Big3x4 ? 11 : 7; // rightdown corner
        const ldc = type === AutotileType.Big3x4 ? 10 : 6; // leftdown corner

        const result = new Map<number, [number, number, number, number]>();

        for (let i = 0; i <= 0b1111_1111; i++) {
            // 自动元件由四个更小的矩形组合而成
            // 初始状态下，四个矩形分别处在四个角的位置
            // 而且对应角落的矩形只可能出现在每个大区块的对应角落

            let lu = luo; // leftup
            let ru = ruo; // rightup
            let ld = ldo; // leftdown
            let rd = rdo; // rightdown

            // 先看四个方向，最后看斜角方向
            if (i & 0b0000_0001) {
                // 左侧有连接，左侧两个矩形向右偏移两个因子
                lu += h * 2;
                ld += h * 2;
                // 如果右侧还有连接，那么右侧矩形和左侧矩形需要移动至中间
                // 但是由于后面还处理了先右侧再左侧的情况，因此需要先向右偏移一个因子
                // 结果就是先向右移动了一个因子，在后面又向左移动了两个因子，因此相当于向左移动了一个因子
                if (i & 0b0001_0000) {
                    ru += h;
                    rd += h;
                }
            }
            if (i & 0b0000_0100) {
                // 下侧有连接，下侧两个矩形向上偏移两个因子
                ld -= v * 2;
                rd -= v * 2;
                if (i & 0b0100_0000) {
                    lu -= v;
                    ru -= v;
                }
            }
            if (i & 0b0001_0000) {
                // 右侧有连接，右侧矩形向左移动两个因子
                ru -= h * 2;
                rd -= h * 2;
                if (i & 0b0000_0001) {
                    lu -= h;
                    ld -= h;
                }
            }
            if (i & 0b0100_0000) {
                // 上侧有链接，上侧矩形向下移动两个因子
                lu += v * 2;
                ru += v * 2;
                if (i & 0b0000_0100) {
                    ld += v;
                    rd += v;
                }
            }
            // 斜角
            // 如果左上仅与上和左连接
            if ((i & 0b1100_0001) === 0b0100_0001) {
                lu = luc;
            }
            // 如果右上仅与上和右连接
            if ((i & 0b0111_0000) === 0b0101_0000) {
                ru = ruc;
            }
            // 如果右下仅与右和下连接
            if ((i & 0b0001_1100) === 0b0001_0100) {
                rd = rdc;
            }
            // 如果左下仅与左和下连接
            if ((i & 0b0000_0111) === 0b0000_0101) {
                ld = ldc;
            }
            result.set(i, [lu, ru, rd, ld]);
        }

        return result;
    }

    /**
     * 初始化自动元件连接配置
     */
    private deduplicateConnection() {
        const usedRect: [number, number, number, number][] = [];
        let flag = 0;
        // 2x3 和 3x4 的自动元件连接方式一样，因此没必要映射两次
        this.conn2x3.forEach((conn, num) => {
            const index = usedRect.findIndex(
                used =>
                    used[0] === conn[0] &&
                    used[1] === conn[1] &&
                    used[2] === conn[2] &&
                    used[3] === conn[3]
            );
            if (index === -1) {
                this.distinct.set(num, flag);
                usedRect.push(conn.slice() as [number, number, number, number]);
                flag++;
            } else {
                this.distinct.set(num, index);
            }
        });
    }

    /**
     * 获取自动元件指定连接方式在原贴图上的裁剪位置
     * @param connection 连接方式，八位二进制数字
     * @param type 自动元件类型
     * @param cw 自动元件的 tile 宽度的一半
     * @param ch 自动元件的 tile 高度的一半
     */
    private getSliceRect(
        connection: number,
        type: AutotileType,
        hw: number,
        hh: number
    ): IConnectedAutotile | null {
        const map = type === AutotileType.Big3x4 ? this.conn3x4 : this.conn2x3;
        const data = map.get(connection);
        if (!data) return null;
        // 每行的切块数量，可以参考开头的注释理解其含义
        const n = type === AutotileType.Big3x4 ? 6 : 4;
        const [ltd, rtd, rbd, lbd] = data;
        const ltx = (ltd % n) * hw;
        const lty = Math.floor(ltd / n) * hh;
        const rtx = (rtd % n) * hw;
        const rty = Math.floor(rtd / n) * hh;
        const rbx = (rbd % n) * hw;
        const rby = Math.floor(rbd / n) * hh;
        const lbx = (lbd % n) * hw;
        const lby = Math.floor(lbd / n) * hh;
        const rect: IConnectedAutotile = {
            lt: { x: ltx, y: lty, w: hw, h: hh },
            rt: { x: rtx, y: rty, w: hw, h: hh },
            rb: { x: rbx, y: rby, w: hw, h: hh },
            lb: { x: lbx, y: lby, w: hw, h: hh }
        };
        return rect;
    }

    /**
     * 获取自动元件的单个图块尺寸
     * @param frameWidth 自动元件每帧的宽度
     * @param height 自动元件的高度
     * @param type 自动元件的类型
     */
    private getAutotileCellSize(
        frameWidth: number,
        height: number,
        type: AutotileType
    ): [width: number, height: number] {
        if (type === AutotileType.Big3x4) {
            if (frameWidth % 3 !== 0 || height % 4 !== 0) {
                logger.warn(190, frameWidth.toString(), height.toString());
                return [0, 0];
            }
            return [frameWidth / 3, height / 4];
        } else {
            if (frameWidth % 2 !== 0 || height % 3 !== 0) {
                logger.warn(190, frameWidth.toString(), height.toString());
                return [0, 0];
            }
            return [frameWidth / 2, height / 3];
        }
    }

    flatten(
        source: SizedCanvasImageSource,
        type: AutotileType,
        frames: number
    ): SizedCanvasImageSource | null {
        if (source.width % frames !== 0) {
            logger.warn(189, source.width.toString(), frames.toString());
            return null;
        }
        const { width, height } = source;
        // frame width
        const fw = width / frames;
        // cell width, cell height
        const [cw, ch] = this.getAutotileCellSize(fw, height, type);
        if (cw % 2 !== 0 || ch % 2 !== 0) {
            logger.warn(190, fw.toString(), height.toString());
            return null;
        }
        // 画到画布上
        const canvas = document.createElement('canvas');
        canvas.width = cw * frames;
        canvas.height = ch * 48;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        // half width, half height
        const hw = cw / 2;
        const hh = ch / 2;
        // 遍历每个组合
        this.distinct.forEach((index, conn) => {
            const rect = this.getSliceRect(conn, type, hw, hh)!;
            const { lt, rt, rb, lb } = rect;
            const y = index * ch;
            for (let i = 0; i < frames; i++) {
                const x = i * cw;
                const ox = i * fw;
                // prettier-ignore
                ctx.drawImage(source, lt.x + ox, lt.y, lt.w, lt.h, x, y, hw, hh);
                // prettier-ignore
                ctx.drawImage(source, rt.x + ox, rt.y, rt.w, rt.h, x + hw, y, hw, hh);
                // prettier-ignore
                ctx.drawImage(source, rb.x + ox, rb.y, rb.w, rb.h, x + hw, y + hh, hw, hh);
                // prettier-ignore
                ctx.drawImage(source, lb.x + ox, lb.y, lb.w, lb.h, x, y + hh, hw, hh);
            }
        });

        return canvas;
    }

    setConnection(autotile: number, target: number): void {
        const set = this.spec.getOrInsertComputed(autotile, () => new Set());
        set.add(target);
    }

    /**
     * 判断地图边缘连接点
     * @param length 地图面积，也就是地图数组的总长度
     * @param index 目标位置索引
     * @param width 地图宽度
     */
    private connectEdge(length: number, index: number, width: number): number {
        // 最高位表示左上，低位依次顺时针旋转

        // 如果地图大小只有 1
        if (length === 1) {
            return 0b1111_1111;
        }
        // 如果地图高度只有 1
        if (length === width) {
            if (index === 0) {
                return 0b1110_1111;
            } else if (index === length - 1) {
                return 0b1111_1110;
            } else {
                return 0b1110_1110;
            }
        }
        // 如果地图宽度只有 1
        if (width === 1) {
            if (index === 0) {
                return 0b1111_1011;
            } else if (index === length - 1) {
                return 0b1011_1111;
            } else {
                return 0b1011_1011;
            }
        }

        // 正常地图

        const lastLine = length - width;
        const x = index % width;

        // 四个角，左上，右上，右下，左下
        if (index === 0) {
            return 0b1110_0011;
        } else if (index === width - 1) {
            return 0b1111_1000;
        } else if (index === length - 1) {
            return 0b0011_1110;
        } else if (index === lastLine) {
            return 0b1000_1111;
        }
        // 四条边，上，右，下，左
        else if (index < width) {
            return 0b1110_0000;
        } else if (x === width - 1) {
            return 0b0011_1000;
        } else if (index > lastLine) {
            return 0b0000_1110;
        } else if (x === 0) {
            return 0b1000_0011;
        }
        // 不在边缘
        else {
            return 0b0000_0000;
        }
    }

    connect(
        array: Uint32Array,
        index: number,
        width: number
    ): IAutotileConnection {
        const block = array[index];
        if (block === 0) {
            return {
                connection: 0,
                center: 0
            };
        }
        let res = this.connectEdge(array.length, index, width);
        const spec = this.spec.get(block);

        // 最高位表示左上，低位依次顺时针旋转
        // 在边缘时，在地图外的部分一定会连接上，所以哪怕索引可能导致串行，也对结果没有任何影响
        // 例如在右边缘时，右侧一定连接，此时不论其与下一行的首个图块是否一个连接，都不会影响需要连接的结果
        const a7 = array[index - width - 1] ?? 0;
        const a6 = array[index - width] ?? 0;
        const a5 = array[index - width + 1] ?? 0;
        const a4 = array[index + 1] ?? 0;
        const a3 = array[index + width + 1] ?? 0;
        const a2 = array[index + width] ?? 0;
        const a1 = array[index + width - 1] ?? 0;
        const a0 = array[index - 1] ?? 0;

        // Benchmark https://www.measurethat.net/Benchmarks/Show/35271/0/convert-boolean-to-number

        if (!spec || spec.size === 0) {
            // 不包含子元件，那么直接跟相同的连接
            res |=
                +(a0 === block) |
                (+(a1 === block) << 1) |
                (+(a2 === block) << 2) |
                (+(a3 === block) << 3) |
                (+(a4 === block) << 4) |
                (+(a5 === block) << 5) |
                (+(a6 === block) << 6) |
                (+(a7 === block) << 7);
        } else {
            res |=
                +spec.has(a0) |
                (+spec.has(a1) << 1) |
                (+spec.has(a2) << 2) |
                (+spec.has(a3) << 3) |
                (+spec.has(a4) << 4) |
                (+spec.has(a5) << 5) |
                (+spec.has(a6) << 6) |
                (+spec.has(a7) << 7);
        }

        return {
            connection: res,
            center: block
        };
    }

    updateConnectionFor(
        connection: number,
        center: number,
        target: number,
        direction: AutotileConnection
    ): number {
        const childList = this.spec.get(center);
        if (!childList || !childList.has(target)) {
            return connection & ~direction;
        } else {
            return connection | direction;
        }
    }

    render(
        tile: IMaterialFramedData,
        connection: number
    ): ITextureRenderable | null {
        const { texture } = tile;
        const size = texture.height === 32 * 48 ? 32 : 48;
        const index = this.distinct.get(connection);
        if (isNil(index)) return null;
        const { rect } = texture.render();
        return {
            source: texture.source,
            rect: { x: rect.x, y: rect.y + size * index, w: size, h: size }
        };
    }

    *renderAnimated(
        tile: IMaterialFramedData,
        connection: number
    ): Generator<ITextureRenderable, void> {
        const { texture, frames } = tile;
        const size = texture.height === 128 ? 32 : 48;
        const index = this.distinct.get(connection);
        if (isNil(index)) return;
        for (let i = 0; i < frames; i++) {
            yield {
                source: texture.source,
                rect: { x: i * size, y: size * index, w: size, h: size }
            };
        }
    }
}
