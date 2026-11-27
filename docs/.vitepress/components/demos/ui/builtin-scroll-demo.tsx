import { defineComponent } from 'vue';
import { Scroll } from '../../../../../packages-user/client-base/src/components/scroll';

const ROWS = Array.from({ length: 12 }, (_, index) => `第 ${index + 1} 行`);

// 滚动区域：直接子元素从上往下排，右侧是滚动条
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[40, 24]}
                text="直接子元素依次排列"
                fillStyle="#cfe0ff"
            />

            <g-rect loc={[40, 52, 300, 220]} fillStyle="#101820" />
            <Scroll loc={[40, 52, 300, 220]}>
                {ROWS.map((row, index) => (
                    <container key={row} loc={[8, 6 + index * 30, 280, 28]}>
                        <g-rect
                            loc={[0, 0, 280, 28]}
                            fillStyle={index % 2 === 0 ? '#26364d' : '#1d2b45'}
                        />
                        <text loc={[10, 6]} text={row} fillStyle="#e8f0ff" />
                    </container>
                ))}
            </Scroll>
        </container>
    );
});
