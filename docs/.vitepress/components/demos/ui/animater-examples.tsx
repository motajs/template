import { EndRelation, linear } from '@motajs/animate';
import { Font } from '@motajs/render';
import { useAnimater } from '@motajs/render-vue';
import { defineComponent, nextTick, onMounted, ref } from 'vue';

const LABEL_FONT = new Font('Verdana', 12);

const TRACK_X = 110;
const TRACK_WIDTH = 330;
const TIMELINE_TOP = 112;
const ROW_GAP = 36;
const BUTTON_TOP = 276;

const BLUE = '#58c4dd';
const ORANGE = '#f2b84b';

type ScenarioKind =
    | 'sequential'
    | 'parallel'
    | 'delayed'
    | 'relay'
    | 'query'
    | 'retarget';

type DemoView = 'timeline' | 'playback';

type Animater = NonNullable<ReturnType<typeof useAnimater>>;

interface ISegment {
    label: string;
    start: number;
    end: number;
    row: number;
    color: string;
}

interface IScenario {
    title: string;
    hint: string;
    total: number;
    segments: ISegment[];
}

const SCENARIOS: Record<ScenarioKind, IScenario> = {
    sequential: {
        title: 'Animater：顺序执行',
        hint: 'x 走完，y 才开始',
        total: 1150,
        segments: [
            { label: 'x1', start: 0, end: 700, row: 0, color: BLUE },
            { label: 'y1', start: 700, end: 1150, row: 1, color: ORANGE }
        ]
    },
    parallel: {
        title: 'Animater：并行执行',
        hint: 'x 与 y 同时开始',
        total: 900,
        segments: [
            { label: 'x1', start: 0, end: 900, row: 0, color: BLUE },
            { label: 'y1', start: 0, end: 900, row: 1, color: ORANGE }
        ]
    },
    delayed: {
        title: 'Animater：延迟与重叠',
        hint: 'y 在 x 开始 300ms 后启动',
        total: 1000,
        segments: [
            { label: 'x1', start: 0, end: 1000, row: 0, color: BLUE },
            { label: 'y1', start: 300, end: 900, row: 1, color: ORANGE }
        ]
    },
    relay: {
        title: 'Animater：组接力',
        hint: '组 2 等组 1 全部结束才开始',
        total: 1200,
        segments: [
            { label: 'x1', start: 0, end: 600, row: 0, color: BLUE },
            { label: 'y1', start: 600, end: 1200, row: 1, color: ORANGE }
        ]
    },
    query: {
        title: 'Animater：查询与等待',
        hint: '读出 y 的步骤，只等待这一条',
        total: 300,
        segments: [
            { label: 'x1', start: 0, end: 300, row: 0, color: BLUE },
            { label: 'y1', start: 100, end: 300, row: 1, color: ORANGE }
        ]
    },
    retarget: {
        title: 'Animater：中途改道',
        hint: 'x 第 2 段在 700ms 接管第 1 段',
        total: 1500,
        segments: [
            { label: 'x1', start: 0, end: 700, row: 0, color: BLUE },
            { label: 'x2', start: 700, end: 1200, row: 0, color: BLUE },
            { label: 'y1', start: 0, end: 1500, row: 1, color: ORANGE }
        ]
    }
};

const VIEW_HINTS: Record<ScenarioKind, string> = {
    sequential: 'x 结束后，y 才开始。',
    parallel: 'x 与 y 在同一组里同时推进。',
    delayed: 'y 在 x 开始 300ms 后启动。',
    relay: '组 2 等组 1 全部结束才开始。',
    query: '读出 y 第 1 段，并只等待它。',
    retarget: 'x 第 2 段在 700ms 接管第 1 段。'
};

async function runScenario(
    animater: Animater,
    kind: ScenarioKind,
    x: { value: number },
    y: { value: number },
    setStatus: (text: string) => void
): Promise<void> {
    switch (kind) {
        case 'sequential': {
            const group = animater
                .animate(x)
                .curve(linear())
                .to(1, 700)
                .animate(y)
                .after()
                .to(1, 450)
                .planEnd();

            setStatus('x 执行中');
            await animater.wait(x, 1, group);
            setStatus('x 完成，y 开始');
            await animater.wait(y, 1, group);
            setStatus('全部完成');
            break;
        }
        case 'parallel': {
            const group = animater
                .animate(x)
                .curve(linear())
                .to(1, 900)
                .animate(y)
                .curve(linear())
                .to(1, 900)
                .planEnd();

            setStatus('x 与 y 同时执行');
            await animater.wait(y, 1, group);
            setStatus('全部完成');
            break;
        }
        case 'delayed': {
            const group = animater
                .animate(x)
                .curve(linear())
                .to(1, 1000)
                .when(300)
                .animate(y)
                .curve(linear())
                .to(1, 600)
                .planEnd();

            setStatus('x 先走，y 延迟 300ms 启动');
            await animater.wait(y, 1, group);
            setStatus('y 完成，x 仍在走');
            await animater.wait(x, 1, group);
            setStatus('全部完成');
            break;
        }
        case 'relay': {
            const first = animater
                .animate(x)
                .curve(linear())
                .to(1, 600)
                .planEnd();
            const second = animater
                .animate(y)
                .curve(linear())
                .to(1, 600)
                .planEnd();

            setStatus('组 1：x 执行中');
            await animater.wait(x, 1, first);
            setStatus('组 1 完成，组 2 开始');
            await animater.wait(y, 1, second);
            setStatus('全部完成');
            break;
        }
        case 'query': {
            const group = animater
                .animate(x)
                .curve(linear())
                .to(1, 300)
                .when(100)
                .animate(y)
                .curve(linear())
                .to(1, 200)
                .planEnd();
            const yStep = animater.query(y, 1, group);

            setStatus(
                yStep
                    ? `y 第 1 段：目标 ${yStep.targetValue}，时长 ${yStep.time}ms`
                    : '未查询到 y 第 1 段'
            );
            await animater.wait(x, 1, group);
            setStatus('x 完成');
            await animater.wait(y, 1, group);
            setStatus('y 完成，只等了指定步骤');
            break;
        }
        case 'retarget': {
            const group = animater
                .animate(x)
                .curve(linear())
                .to(1, 1200, EndRelation.Self)
                .animate(y)
                .curve(linear())
                .to(1, 1500)
                .whenPlan(x, 1, 700)
                .animate(x)
                .curve(linear())
                .to(0, 500)
                .planEnd();
            const second = animater.query(x, 2, group);

            setStatus(
                second
                    ? `x 第 2 段：目标 ${second.targetValue}，时长 ${second.time}ms`
                    : '未查询到 x 第 2 段'
            );
            await animater.wait(x, 1, group);
            setStatus('x 第 1 段在改道时结束');
            await animater.wait(x, 2, group);
            setStatus('x 第 2 段完成，y 仍在走');
            await animater.wait(y, 1, group);
            setStatus('全部完成');
            break;
        }
    }
}

function createDemo(kind: ScenarioKind, view: DemoView) {
    const scenario = SCENARIOS[kind];

    return defineComponent(() => {
        const animater = useAnimater()!;
        const clock = useAnimater()!;
        const x = ref(0);
        const y = ref(0);
        const phase = ref(0);
        const running = ref(false);
        const status = ref('等待开始');

        const play = async () => {
            if (running.value) return;
            running.value = true;
            x.value = 0;
            y.value = 0;
            phase.value = 0;
            status.value = '准备开始';

            clock
                .animate(phase)
                .curve(linear())
                .to(1, scenario.total)
                .planEnd();

            await runScenario(animater, kind, x, y, text => {
                status.value = text;
            });
            running.value = false;
        };

        onMounted(() => {
            nextTick(() => {
                void play();
            });
        });

        const renderTimeline = () => {
            const playhead = TRACK_X + phase.value * TRACK_WIDTH;
            const elapsed = Math.round(phase.value * scenario.total);

            return (
                <>
                    <text
                        loc={[24, TIMELINE_TOP - 14]}
                        text="x"
                        fillStyle="#cfe0ff"
                    />
                    <text
                        loc={[24, TIMELINE_TOP + ROW_GAP - 14]}
                        text="y"
                        fillStyle="#cfe0ff"
                    />
                    {[0, 1].map(row => (
                        <g-rect
                            key={row}
                            loc={[
                                TRACK_X,
                                TIMELINE_TOP + row * ROW_GAP,
                                TRACK_WIDTH,
                                16
                            ]}
                            fillStyle="#1c2633"
                        />
                    ))}
                    {scenario.segments.map(segment => {
                        const left =
                            TRACK_X +
                            (segment.start / scenario.total) * TRACK_WIDTH;
                        const width =
                            ((segment.end - segment.start) / scenario.total) *
                            TRACK_WIDTH;
                        const top = TIMELINE_TOP + segment.row * ROW_GAP;

                        return (
                            <container
                                key={segment.label}
                                loc={[left, top, width, 16]}
                            >
                                <g-rectr
                                    loc={[0, 0, width, 16]}
                                    circle={[4]}
                                    fillStyle={segment.color}
                                />
                                <text
                                    loc={[5, 2]}
                                    text={segment.label}
                                    font={LABEL_FONT}
                                    fillStyle="#0e141b"
                                />
                            </container>
                        );
                    })}
                    <g-rect
                        loc={[playhead - 1, TIMELINE_TOP - 8, 2, ROW_GAP + 32]}
                        fillStyle="#e8f0ff"
                    />
                    <g-circle
                        circle={[playhead, TIMELINE_TOP - 8, 4]}
                        fillStyle="#e8f0ff"
                    />
                    <text
                        loc={[456, TIMELINE_TOP - 18]}
                        anc={[1, 0]}
                        text={`${elapsed} ms`}
                        font={LABEL_FONT}
                        fillStyle="#8fb6ff"
                    />
                    <text
                        loc={[24, 214]}
                        text={`x ${x.value.toFixed(2)}   y ${y.value.toFixed(2)}`}
                        font={LABEL_FONT}
                        fillStyle="#cfe0ff"
                    />
                    <text
                        loc={[24, 236]}
                        text="色块是步骤段，竖线是播放头。"
                        font={LABEL_FONT}
                        fillStyle="#8b98a8"
                    />
                    <text
                        loc={[24, 254]}
                        text="播放头由另一个真实执行器推进。"
                        font={LABEL_FONT}
                        fillStyle="#8b98a8"
                    />
                </>
            );
        };

        const renderPlayback = () => {
            const retargetX = TRACK_X + (700 / scenario.total) * TRACK_WIDTH;

            return (
                <>
                    <text loc={[24, 96]} text="x" fillStyle="#cfe0ff" />
                    <g-rect
                        loc={[TRACK_X, 104, TRACK_WIDTH, 8]}
                        fillStyle="#26364d"
                    />
                    <g-circle
                        circle={[TRACK_X + x.value * TRACK_WIDTH, 108, 7]}
                        fillStyle={BLUE}
                    />
                    <text
                        loc={[456, 96]}
                        anc={[1, 0]}
                        text={x.value.toFixed(2)}
                        font={LABEL_FONT}
                        fillStyle="#8fb6ff"
                    />

                    <text loc={[24, 146]} text="y" fillStyle="#cfe0ff" />
                    <g-rect
                        loc={[TRACK_X, 154, TRACK_WIDTH, 8]}
                        fillStyle="#26364d"
                    />
                    <g-circle
                        circle={[TRACK_X + y.value * TRACK_WIDTH, 158, 7]}
                        fillStyle={ORANGE}
                    />
                    <text
                        loc={[456, 146]}
                        anc={[1, 0]}
                        text={y.value.toFixed(2)}
                        font={LABEL_FONT}
                        fillStyle="#f2b84b"
                    />

                    {kind === 'retarget' && (
                        <>
                            <g-rect
                                loc={[retargetX - 1, 96, 2, 24]}
                                fillStyle="#e8f0ff"
                            />
                            <text
                                loc={[retargetX - 16, 82]}
                                text="改道"
                                font={LABEL_FONT}
                                fillStyle="#e8f0ff"
                            />
                        </>
                    )}

                    <text
                        loc={[24, 202]}
                        text={status.value}
                        font={LABEL_FONT}
                        fillStyle="#7ee787"
                    />
                    <text
                        loc={[24, 226]}
                        text={VIEW_HINTS[kind]}
                        font={LABEL_FONT}
                        fillStyle="#8b98a8"
                    />
                </>
            );
        };

        return () => (
            <container loc={[0, 0, 480, 320]}>
                <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
                <text
                    loc={[24, 14]}
                    text={scenario.title}
                    fillStyle="#e8f0ff"
                />
                <text loc={[24, 36]} text={scenario.hint} fillStyle="#8b98a8" />
                <text
                    loc={[24, 56]}
                    text={view === 'timeline' ? '时间轴视图' : '播放视图'}
                    font={LABEL_FONT}
                    fillStyle="#8b98a8"
                />

                {view === 'timeline' ? renderTimeline() : renderPlayback()}

                <container
                    loc={[24, BUTTON_TOP, 100, 30]}
                    cursor="pointer"
                    onClick={() => {
                        void play();
                    }}
                >
                    <g-rectr
                        loc={[0, 0, 100, 30]}
                        circle={[8]}
                        fillStyle={running.value ? '#33465f' : '#2f6fed'}
                    />
                    <text
                        loc={[50, 15]}
                        anc={[0.5, 0.5]}
                        text={running.value ? '播放中' : '重播'}
                        font={LABEL_FONT}
                        fillStyle="#e8f0ff"
                    />
                </container>
                <text
                    loc={[136, BUTTON_TOP + 8]}
                    text={running.value ? '真实执行器正在推进' : '点击重播'}
                    font={LABEL_FONT}
                    fillStyle="#8b98a8"
                />
            </container>
        );
    });
}

export const SequentialTimeline = createDemo('sequential', 'timeline');
export const SequentialPlayback = createDemo('sequential', 'playback');
export const ParallelTimeline = createDemo('parallel', 'timeline');
export const ParallelPlayback = createDemo('parallel', 'playback');
export const DelayedTimeline = createDemo('delayed', 'timeline');
export const DelayedPlayback = createDemo('delayed', 'playback');
export const RelayTimeline = createDemo('relay', 'timeline');
export const RelayPlayback = createDemo('relay', 'playback');
export const QueryTimeline = createDemo('query', 'timeline');
export const QueryPlayback = createDemo('query', 'playback');
export const RetargetTimeline = createDemo('retarget', 'timeline');
export const RetargetPlayback = createDemo('retarget', 'playback');
