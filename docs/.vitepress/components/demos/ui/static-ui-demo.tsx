import { defineComponent } from 'vue';

// 静态界面演示：容器、背景、标题、矩形、圆、分隔线与层级
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            {/* 深色底：用一块和容器等大的矩形铺出来 */}
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            {/* 标题 */}
            <text loc={[24, 24]} text="背包" fillStyle="#e8f0ff" />

            {/* 矩形与圆 */}
            <g-rect loc={[24, 64, 160, 64]} fillStyle="#2f6fed" />
            <g-circle circle={[280, 96, 32]} fillStyle="#58c4dd" />

            {/* 分隔线 */}
            <g-line line={[24, 168, 456, 168]} strokeStyle="#7aa7ff" />

            {/* 层级：第一个 zIndex 更大，重叠处在上面 */}
            <g-rect loc={[320, 120, 120, 72]} fillStyle="#f2b84b" zIndex={2} />
            <g-rect loc={[368, 152, 120, 72]} fillStyle="#58c4dd" />
        </container>
    );
});
