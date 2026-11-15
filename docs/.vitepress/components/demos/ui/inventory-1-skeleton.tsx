import { defineComponent, ref } from 'vue';

// 示例（一）的 live：720×480 骨架、标题、关闭按钮与左右占位
export default defineComponent(() => {
    const hint = ref('骨架阶段：先确认面板能显示、关闭按钮能用');

    const close = () => {
        // 文档站没有真实 UI 栈，用一行提示代替 controller.close
        hint.value = '已请求关闭（真实面板会调用 controller.close）';
    };

    return () => (
        <container loc={[0, 0, 720, 480]}>
            <g-rect loc={[0, 0, 720, 480]} fill fillStyle="#0e141b" />

            <g-rectr
                loc={[30, 30, 660, 420]}
                circle={[18]}
                fill
                fillStyle="#1d2b45"
                stroke
                strokeStyle="#2f6fed"
            />

            <text loc={[54, 52]} text="背包" fillStyle="#e8f0ff" />

            <container loc={[626, 50, 56, 32]} onClick={close}>
                <g-rectr
                    loc={[0, 0, 56, 32]}
                    circle={[8]}
                    fill
                    fillStyle="#7a3d3d"
                />
                <text loc={[14, 8]} text="关闭" fillStyle="#ffe9e9" />
            </container>

            <container loc={[54, 110, 400, 330]}>
                <g-rect loc={[0, 0, 400, 330]} fill fillStyle="#101820" />
                <text loc={[16, 16]} text="道具网格占位" fillStyle="#8fb6ff" />
            </container>

            <container loc={[470, 110, 196, 330]}>
                <g-rect loc={[0, 0, 196, 330]} fill fillStyle="#101820" />
                <text loc={[16, 16]} text="详情占位" fillStyle="#8fb6ff" />
            </container>

            <text loc={[54, 420]} text={hint.value} fillStyle="#8fb6ff" />
        </container>
    );
});
