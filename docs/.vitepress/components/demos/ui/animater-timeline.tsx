import { linear } from '@motajs/animate';
import { Font } from '@motajs/render';
import { useAnimater } from '@motajs/render-vue';
import { defineComponent, nextTick, onMounted, ref } from 'vue';

const LABEL_FONT = new Font('Verdana', 12);

const TOTAL = 1400;
const A1_TIME = 800;
const A2_DELAY = 200;
const A2_TIME = 400;
const B1_DELAY = 200;
const B1_TIME = 500;
const B2_DELAY = 150;
const B2_TIME = 300;

const TRACK_X = 70;
const TRACK_WIDTH = 350;
const TIMELINE_TOP = 164;

interface ITimelineSegment {
    label: string;
    start: number;
    end: number;
    row: number;
    color: string;
}

const SEGMENTS: ITimelineSegment[] = [
    { label: 'A1', start: 0, end: A1_TIME, row: 0, color: '#58c4dd' },
    {
        label: 'A2',
        start: A1_TIME + A2_DELAY,
        end: A1_TIME + A2_DELAY + A2_TIME,
        row: 0,
        color: '#58c4dd'
    },
    {
        label: 'B1',
        start: B1_DELAY,
        end: B1_DELAY + B1_TIME,
        row: 1,
        color: '#f2b84b'
    },
    {
        label: 'B2',
        start: B1_DELAY + B1_TIME + B2_DELAY,
        end: B1_DELAY + B1_TIME + B2_DELAY + B2_TIME,
        row: 1,
        color: '#f2b84b'
    }
];

// 时间线演示：两个动画对象由同一个 Animater 推进，播放头本身也是一条计划
export default defineComponent(() => {
    const animater = useAnimater()!;
    const left = ref(0);
    const right = ref(0);
    const phase = ref(0);
    const running = ref(false);

    const play = async () => {
        if (running.value) return;
        running.value = true;
        left.value = 0;
        right.value = 0;
        phase.value = 0;

        const group = animater
            .animate(phase)
            .curve(linear())
            .to(1, TOTAL)
            .animate(left)
            .when(0)
            .to(1, A1_TIME)
            .animate(right)
            .when(B1_DELAY)
            .to(1, B1_TIME)
            .animate(right)
            .after(B2_DELAY)
            .to(0, B2_TIME)
            .animate(left)
            .afterPlan(left, 1, A2_DELAY)
            .to(0, A2_TIME)
            .planEnd();

        await animater.wait(phase, 1, group);
        running.value = false;
    };

    onMounted(() => {
        nextTick(() => {
            void play();
        });
    });

    return () => {
        const playhead = TRACK_X + phase.value * TRACK_WIDTH;
        const elapsed = Math.round(phase.value * TOTAL);

        return (
            <container loc={[0, 0, 480, 320]}>
                <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
                <text
                    loc={[24, 16]}
                    text="Animater：计划组时间线"
                    fillStyle="#e8f0ff"
                />
                <text
                    loc={[24, 38]}
                    text="两条轨迹由同一个执行器推进，色块是计划段"
                    fillStyle="#8b98a8"
                />

                <text loc={[24, 64]} text="对象 A" fillStyle="#cfe0ff" />
                <text
                    loc={[456, 64]}
                    anc={[1, 0]}
                    text={`value ${left.value.toFixed(2)}`}
                    font={LABEL_FONT}
                    fillStyle="#8fb6ff"
                />
                <g-rect
                    loc={[TRACK_X, 81, TRACK_WIDTH, 2]}
                    fillStyle="#26364d"
                />
                <g-circle
                    circle={[TRACK_X + left.value * TRACK_WIDTH, 82, 7]}
                    fillStyle="#58c4dd"
                />

                <text loc={[24, 100]} text="对象 B" fillStyle="#cfe0ff" />
                <text
                    loc={[456, 100]}
                    anc={[1, 0]}
                    text={`value ${right.value.toFixed(2)}`}
                    font={LABEL_FONT}
                    fillStyle="#8fb6ff"
                />
                <g-rect
                    loc={[TRACK_X, 117, TRACK_WIDTH, 2]}
                    fillStyle="#26364d"
                />
                <g-circle
                    circle={[TRACK_X + right.value * TRACK_WIDTH, 118, 7]}
                    fillStyle="#f2b84b"
                />

                <text loc={[24, 142]} text="计划组 1" fillStyle="#cfe0ff" />
                <text
                    loc={[456, 142]}
                    anc={[1, 0]}
                    text={`${elapsed} ms`}
                    font={LABEL_FONT}
                    fillStyle="#8fb6ff"
                />

                <g-rect
                    loc={[TRACK_X, TIMELINE_TOP, TRACK_WIDTH, 16]}
                    fillStyle="#1c2633"
                />
                <g-rect
                    loc={[TRACK_X, TIMELINE_TOP + 26, TRACK_WIDTH, 16]}
                    fillStyle="#1c2633"
                />
                <text loc={[24, TIMELINE_TOP]} text="A" fillStyle="#e8f0ff" />
                <text
                    loc={[24, TIMELINE_TOP + 26]}
                    text="B"
                    fillStyle="#e8f0ff"
                />

                {SEGMENTS.map(segment => {
                    const x = TRACK_X + (segment.start / TOTAL) * TRACK_WIDTH;
                    const width =
                        ((segment.end - segment.start) / TOTAL) * TRACK_WIDTH;
                    const y = TIMELINE_TOP + segment.row * 26;

                    return (
                        <container key={segment.label} loc={[x, y, width, 16]}>
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

                <g-rect loc={[playhead - 1, 156, 2, 60]} fillStyle="#e8f0ff" />
                <g-circle circle={[playhead, 156, 4]} fillStyle="#e8f0ff" />

                <text
                    loc={[24, 224]}
                    text="A1 0–800ms；A2 在 A1 结束后 200ms 开始"
                    font={LABEL_FONT}
                    fillStyle="#8b98a8"
                />
                <text
                    loc={[24, 242]}
                    text="B1 在 A1 开始后 200ms 开始；B2 在 B1 结束后 150ms 开始"
                    font={LABEL_FONT}
                    fillStyle="#8b98a8"
                />

                <container
                    loc={[70, 268, 100, 30]}
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
                    loc={[184, 276]}
                    text={running.value ? '播放头正在推进' : '点击重播时间线'}
                    font={LABEL_FONT}
                    fillStyle="#8b98a8"
                />
            </container>
        );
    };
});
