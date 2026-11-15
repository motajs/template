import { defineComponent } from 'vue';
import { Background } from '../../../../../packages-user/client-base/src/components/background';

// 背景：同一个组件换两组 color 与 border
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <container loc={[40, 48, 180, 150]}>
                <Background
                    loc={[0, 0, 180, 150]}
                    color="#1d2b45"
                    border="#3a5a8c"
                />
                <text
                    loc={[16, 16]}
                    text="color + border"
                    fillStyle="#e8f0ff"
                />
            </container>

            <container loc={[260, 48, 180, 150]}>
                <Background
                    loc={[0, 0, 180, 150]}
                    color="#2a2140"
                    border="#c9a7ff"
                />
                <text loc={[16, 16]} text="换一组颜色" fillStyle="#e8f0ff" />
            </container>
        </container>
    );
});
