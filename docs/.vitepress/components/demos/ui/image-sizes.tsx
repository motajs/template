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

// 同一张纹理放进三种尺寸的矩形
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="同一张图，三种显示尺寸"
                fillStyle="#cfe0ff"
            />

            <image image={demoTexture} loc={[48, 96, 64, 64]} />
            <text loc={[48, 172]} text="64×64" fillStyle="#8b98a8" />

            <image image={demoTexture} loc={[192, 80, 96, 96]} />
            <text loc={[192, 188]} text="96×96" fillStyle="#8b98a8" />

            <image image={demoTexture} loc={[336, 64, 128, 128]} />
            <text loc={[336, 204]} text="128×128" fillStyle="#8b98a8" />
        </container>
    );
});
