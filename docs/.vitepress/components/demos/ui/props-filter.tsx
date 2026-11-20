import { Texture } from '@motajs/render';
import { defineComponent } from 'vue';

// 演示用纹理：带几种颜色，便于看出灰度与亮度变化
function createDemoTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#2a3550';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#2f6fed';
    ctx.fillRect(0, 0, 64, 24);
    ctx.fillStyle = '#f2b84b';
    ctx.beginPath();
    ctx.arc(32, 42, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7ee787';
    ctx.fillRect(44, 44, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 40, 10, 10);

    return new Texture(canvas);
}

const demoTexture = createDemoTexture();

// 同一张图分别使用正常、模糊与灰度滤镜
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="filter 对照" fillStyle="#cfe0ff" />

            <image image={demoTexture} loc={[48, 84, 120, 120]} />
            <text loc={[48, 218]} text="正常" fillStyle="#8b98a8" />

            <image
                image={demoTexture}
                loc={[180, 84, 120, 120]}
                filter="blur(3px)"
            />
            <text loc={[180, 218]} text="blur(3px)" fillStyle="#8b98a8" />

            <image
                image={demoTexture}
                loc={[312, 84, 120, 120]}
                filter="grayscale(1) brightness(0.7)"
            />
            <text loc={[312, 218]} text="灰度 + 亮度" fillStyle="#8b98a8" />
        </container>
    );
});
