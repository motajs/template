import { Texture } from '@motajs/render';
import { defineComponent } from 'vue';

// 演示用纹理：16×16 的棋盘格，放大后更容易看出抗锯齿差异
function createPixelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    const ctx = canvas.getContext('2d')!;
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            ctx.fillStyle = (x + y) % 2 === 0 ? '#f2b84b' : '#2f6fed';
            ctx.fillRect(x, y, 1, 1);
        }
    }

    return new Texture(canvas);
}

const demoTexture = createPixelTexture();

// 同一张纹理放大显示，对照默认抗锯齿与 noanti
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="同一张纹理放大到 160×160"
                fillStyle="#cfe0ff"
            />

            <image image={demoTexture} loc={[56, 76, 160, 160]} />
            <text loc={[56, 250]} text="默认" fillStyle="#8b98a8" />

            <image image={demoTexture} noanti loc={[264, 76, 160, 160]} />
            <text loc={[264, 250]} text="noanti" fillStyle="#8b98a8" />
        </container>
    );
});
