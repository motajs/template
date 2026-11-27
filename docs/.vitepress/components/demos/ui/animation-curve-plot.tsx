import type { ExcitationCurve } from '@motajs/animate';
import type { CustomRenderFunction } from '@motajs/render';

// 一条曲线的名称、颜色与函数
export interface CurveEntry {
    label: string;
    color: string;
    curve: ExcitationCurve;
}

const WIDTH = 408;
const HEIGHT = 190;
const LEFT = 46;
const TOP = 12;
const RIGHT = 12;
const BOTTOM = 36;

// 刻度文字：整数不带小数点，其余最多保留两位
function formatTick(value: number): string {
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

// 生成绘制坐标轴与多条曲线的 render 函数；纵轴默认 0 到 1，可指定显示范围
export function createCurveRender(
    curves: CurveEntry[],
    options: { min?: number; max?: number } = {}
): CustomRenderFunction {
    const min = options.min ?? 0;
    const max = options.max ?? 1;

    return canvas => {
        const ctx = canvas.ctx;
        const plotWidth = WIDTH - LEFT - RIGHT;
        const plotHeight = HEIGHT - TOP - BOTTOM;
        const bottom = TOP + plotHeight;
        const toY = (value: number) =>
            TOP + ((max - value) / (max - min)) * plotHeight;

        // 背景
        ctx.fillStyle = '#101820';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        // 网格
        ctx.strokeStyle = '#22304a';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = TOP + (plotHeight * i) / 4;
            ctx.beginPath();
            ctx.moveTo(LEFT, y);
            ctx.lineTo(LEFT + plotWidth, y);
            ctx.stroke();

            const x = LEFT + (plotWidth * i) / 4;
            ctx.beginPath();
            ctx.moveTo(x, TOP);
            ctx.lineTo(x, bottom);
            ctx.stroke();
        }

        // 坐标轴
        ctx.strokeStyle = '#7d8ea6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(LEFT, TOP);
        ctx.lineTo(LEFT, bottom);
        ctx.lineTo(LEFT + plotWidth, bottom);
        ctx.stroke();

        // 刻度
        ctx.fillStyle = '#8b98a8';
        ctx.font = '11px Verdana';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= 4; i++) {
            const value = max - ((max - min) * i) / 4;
            const y = TOP + (plotHeight * i) / 4;
            ctx.fillText(formatTick(value), LEFT - 8, y);
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('0', LEFT, bottom + 6);
        ctx.fillText('0.5', LEFT + plotWidth / 2, bottom + 6);
        ctx.fillText('1', LEFT + plotWidth, bottom + 6);

        // 轴名
        ctx.fillText('x', LEFT + plotWidth / 2, bottom + 22);

        ctx.save();
        ctx.translate(12, TOP + plotHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = 'middle';
        ctx.fillText('输出', 0, 0);
        ctx.restore();

        // 曲线
        ctx.lineWidth = 2.5;
        for (const entry of curves) {
            ctx.beginPath();
            ctx.strokeStyle = entry.color;
            for (let i = 0; i <= 120; i++) {
                const p = i / 120;
                const value = entry.curve(p);
                const x = LEFT + p * plotWidth;
                const y = toY(value);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    };
}
