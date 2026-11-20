import { defineComponent, ref } from 'vue';

// hidden 只切换绘制与命中，面板实例和内部计数都保留
export default defineComponent(() => {
    const open = ref(true);
    const count = ref(0);

    const togglePanel = () => {
        open.value = !open.value;
    };

    const increaseCount = () => {
        count.value++;
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <container loc={[40, 32, 180, 36]} onClick={togglePanel}>
                <g-rect loc={[0, 0, 180, 36]} fill fillStyle="#2f6fed" />
                <text
                    loc={[12, 10]}
                    text="隐藏 / 显示面板"
                    fillStyle="#e8f0ff"
                />
            </container>

            <container
                loc={[40, 92, 240, 160]}
                hidden={!open.value}
                onClick={increaseCount}
            >
                <g-rect loc={[0, 0, 240, 160]} fill fillStyle="#26364d" />
                <text
                    loc={[16, 16]}
                    text="点击面板内部 +1"
                    fillStyle="#e8f0ff"
                />
                <text
                    loc={[16, 52]}
                    text={`面板内点击：${count.value}`}
                    fillStyle="#ffffff"
                />
                <text
                    loc={[16, 96]}
                    text="隐藏后再显示，状态仍在"
                    fillStyle="#cfe0ff"
                />
            </container>
        </container>
    );
});
