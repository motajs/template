import { defineComponent } from 'vue';
import { Selection } from '../../../../../packages-user/client-base/src/components/misc';

// 选中框：两组 color 与 border，第二组调大 alphaRange
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <container loc={[40, 48, 240, 32]}>
                <Selection
                    loc={[0, 0, 240, 32]}
                    color="#2f6fed"
                    border="#7aa2ff"
                />
                <text loc={[12, 8]} text="被选中的项" fillStyle="#ffffff" />
            </container>

            <container loc={[40, 96, 240, 32]}>
                <Selection
                    loc={[0, 0, 240, 32]}
                    color="#8a6a1f"
                    border="#f2b84b"
                    alphaRange={[0.4, 0.8]}
                />
                <text
                    loc={[12, 8]}
                    text="alphaRange = [0.4, 0.8]"
                    fillStyle="#ffffff"
                />
            </container>

            <container loc={[40, 144, 240, 32]}>
                <text loc={[12, 8]} text="没有选中框的项" fillStyle="#e8f0ff" />
            </container>
        </container>
    );
});
