import { defineComponent } from 'vue';
import { Arrow } from '../../../../../packages-user/client-base/src/components/misc';

// 箭头：三条箭头分别改 head 与 color
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <Arrow arrow={[48, 48, 300, 48]} head={8} color="#f2b84b" />
            <text loc={[48, 80]} text="head = 8" fillStyle="#cfe0ff" />

            <Arrow arrow={[48, 136, 300, 136]} head={18} color="#7ee787" />
            <text loc={[48, 168]} text="head = 18" fillStyle="#cfe0ff" />

            <Arrow arrow={[48, 224, 300, 224]} head={30} color="#7aa2ff" />
            <text loc={[48, 256]} text="head = 30" fillStyle="#cfe0ff" />
        </container>
    );
});
