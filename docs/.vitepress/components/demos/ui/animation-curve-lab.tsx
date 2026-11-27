import { CurveMode, type ExcitationCurve } from '@motajs/animate';
import { Font } from '@motajs/render';
import { SetupComponentOptions } from '@motajs/system';
import { defineComponent, ref } from 'vue';
import { createCurveRender } from './animation-curve-plot';

const LABEL_FONT = new Font('Verdana', 12);

const MODE_ITEMS: { mode: CurveMode; label: string; hint: string }[] = [
    { mode: CurveMode.EaseIn, label: 'EaseIn', hint: '缓进快出' },
    { mode: CurveMode.EaseOut, label: 'EaseOut', hint: '快进缓出' },
    { mode: CurveMode.EaseInOut, label: 'EaseInOut', hint: '缓进缓出，中间快' },
    {
        mode: CurveMode.EaseCenter,
        label: 'EaseCenter',
        hint: '快进快出，中间缓'
    }
];

export interface ICurveLabProps {
    /** 曲线名称，显示在标题位置 */
    title: string;
    /** 曲线说明，显示在标题下方 */
    subtitle: string;
    /** 按当前模式生成要绘制的曲线 */
    curve: (mode: CurveMode) => ExcitationCurve;
    /** 曲线依赖的响应式值；变化时重绘 */
    bindings: unknown[];
    /** 是否显示四种曲线模式的按钮 */
    supportsMode?: boolean;
    /** 没有控件时显示的说明 */
    note?: string;
}

const curveLabProps = {
    props: ['title', 'subtitle', 'curve', 'bindings', 'supportsMode', 'note']
} satisfies SetupComponentOptions<ICurveLabProps>;

// 曲线实验台：标题、说明、曲线图，以及可选的模式按钮与参数控件
const CurveLab = defineComponent<ICurveLabProps>((props, { slots }) => {
    const mode = ref<CurveMode>(CurveMode.EaseIn);

    return () => {
        const supportsMode = props.supportsMode ?? false;
        const currentMode =
            MODE_ITEMS.find(item => item.mode === mode.value) ?? MODE_ITEMS[0];
        const hasBody = Boolean(slots.default) || Boolean(props.note);
        const modeTop = hasBody ? 258 : 272;
        const bodyTop = supportsMode ? 292 : 268;
        const render = createCurveRender([
            {
                label: props.title,
                color: '#7ee787',
                curve: props.curve(mode.value)
            }
        ]);

        return (
            <container loc={[0, 0, 480, 320]}>
                <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
                <text loc={[24, 16]} text={props.title} fillStyle="#e8f0ff" />
                <text
                    loc={[24, 38]}
                    text={props.subtitle}
                    fillStyle="#8b98a8"
                />

                {supportsMode && (
                    <text
                        loc={[456, 16]}
                        anc={[1, 0]}
                        text={currentMode.hint}
                        font={LABEL_FONT}
                        fillStyle="#8b98a8"
                    />
                )}

                <custom
                    loc={[36, 64, 408, 190]}
                    bindings={[...props.bindings, mode.value]}
                    render={render}
                />

                {supportsMode &&
                    MODE_ITEMS.map((item, index) => {
                        const active = item.mode === mode.value;

                        return (
                            <container
                                key={item.label}
                                loc={[28 + index * 108, modeTop, 100, 26]}
                                cursor="pointer"
                                onClick={() => {
                                    mode.value = item.mode;
                                }}
                            >
                                <g-rectr
                                    loc={[0, 0, 100, 26]}
                                    circle={[8]}
                                    fillStyle={active ? '#2f6fed' : '#26364d'}
                                />
                                <text
                                    loc={[50, 13]}
                                    anc={[0.5, 0.5]}
                                    text={item.label}
                                    font={LABEL_FONT}
                                    fillStyle={active ? '#ffffff' : '#cfe0ff'}
                                    noevent
                                />
                            </container>
                        );
                    })}

                {hasBody && (
                    <container loc={[0, bodyTop, 480, 26]}>
                        {slots.default?.()}
                        {!slots.default && props.note && (
                            <text
                                loc={[24, 4]}
                                text={props.note}
                                fillStyle="#8b98a8"
                            />
                        )}
                    </container>
                )}
            </container>
        );
    };
}, curveLabProps);

export default CurveLab;
