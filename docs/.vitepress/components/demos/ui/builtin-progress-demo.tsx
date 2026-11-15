import { defineComponent } from 'vue';
import { Progress } from '../../../../../packages-user/client-base/src/components/misc';

// 进度条：progress 分别取 0.3、0.6 与 1
const BARS = [
    { label: 'progress = 0.3', y: 68, progress: 0.3 },
    { label: 'progress = 0.6', y: 128, progress: 0.6 },
    { label: 'progress = 1', y: 188, progress: 1 }
];

export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            {BARS.map(bar => (
                <container key={bar.label} loc={[0, 0, 480, 320]}>
                    <text
                        loc={[48, bar.y - 24]}
                        text={bar.label}
                        fillStyle="#cfe0ff"
                    />
                    <Progress
                        loc={[48, bar.y, 300, 10]}
                        progress={bar.progress}
                        success="#7ee787"
                        background="#26364d"
                        lineWidth={8}
                    />
                </container>
            ))}
        </container>
    );
});
