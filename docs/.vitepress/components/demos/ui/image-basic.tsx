import { Texture } from '@motajs/render';
import { defineComponent } from 'vue';

// 演示用纹理：只在 demo 内部生成，正文不展示生成方式
function createDemoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1d2733';
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = '#7aa7ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 48, 48);
    ctx.fillStyle = '#f2b84b';
    ctx.beginPath();
    ctx.arc(32, 32, 14, 0, Math.PI * 2);
    ctx.fill();

    return new Texture(canvas);
}

const demoTexture = createDemoTexture();

// 单张图片：loc 固定为 [40, 64, 128, 128]
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="<image> 按 loc 显示纹理的效果"
                fillStyle="#cfe0ff"
            />

            <image image={demoTexture} loc={[40, 64, 128, 128]} />

            <text
                loc={[40, 208]}
                text="loc = [40, 64, 128, 128]"
                fillStyle="#8b98a8"
            />
        </container>
    );
});
