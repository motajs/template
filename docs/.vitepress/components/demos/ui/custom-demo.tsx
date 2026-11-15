import type { CustomRenderFunction } from '@motajs/render';
import { defineComponent, ref } from 'vue';

const ringColors = ['#2f6fed', '#7aa7ff', '#f2b84b'];

// 演示 custom 的局部坐标绘制：同心圆环、径向渐变与旋转指针
export default defineComponent(() => {
    // 把 angle.value 放进 bindings；点击按钮改变角度时会触发重绘
    const angle = ref(0);

    // 在元素局部坐标里直接绘制：同心圆环、径向渐变与旋转指针
    const render: CustomRenderFunction = canvas => {
        const ctx = canvas.ctx;
        const cx = 100;
        const cy = 100;

        // 径向渐变与同心圆环直接走 Canvas 2D
        const gradient = ctx.createRadialGradient(cx, cy, 12, cx, cy, 88);
        gradient.addColorStop(0, '#2f6fed');
        gradient.addColorStop(1, '#141a22');
        ctx.beginPath();
        ctx.arc(cx, cy, 88, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ringColors.forEach((color, index) => {
            ctx.beginPath();
            ctx.arc(cx, cy, 70 - index * 16, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
        });

        // 指针从圆心出发，按 angle 旋转；坐标都相对元素左上角
        ctx.translate(cx, cy);
        ctx.rotate(angle.value);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -64);
        ctx.strokeStyle = '#e8f0ff';
        ctx.lineWidth = 4;
        ctx.stroke();
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="<custom> 在局部坐标里直接绘制"
                fillStyle="#cfe0ff"
            />

            <custom
                loc={[140, 44, 200, 200]}
                bindings={[angle.value]}
                render={render}
            />

            <container
                loc={[138, 256, 92, 36]}
                onClick={() => {
                    angle.value -= Math.PI / 12;
                }}
            >
                <g-rect loc={[0, 0, 92, 36]} fillStyle="#2f6fed" />
                <text loc={[18, 9]} text="−15°" fillStyle="#e8f0ff" />
            </container>

            <container
                loc={[250, 256, 92, 36]}
                onClick={() => {
                    angle.value += Math.PI / 12;
                }}
            >
                <g-rect loc={[0, 0, 92, 36]} fillStyle="#2f6fed" />
                <text loc={[18, 9]} text="+15°" fillStyle="#e8f0ff" />
            </container>

            <text
                loc={[24, 300]}
                text="angle.value 放进 bindings，点击按钮会重绘"
                fillStyle="#8b98a8"
            />
        </container>
    );
});
