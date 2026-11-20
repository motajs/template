import { defineComponent, ref } from 'vue';

// 面板自己的计数：组件被卸载后实例消失，再挂载时从 0 开始
const CounterPanel = defineComponent(() => {
    const count = ref(0);

    const increaseCount = () => {
        count.value++;
    };

    return () => (
        <container loc={[0, 0, 240, 160]} onClick={increaseCount}>
            <g-rect loc={[0, 0, 240, 160]} fill fillStyle="#26364d" />
            <text loc={[16, 16]} text="点击面板内部 +1" fillStyle="#e8f0ff" />
            <text
                loc={[16, 52]}
                text={`面板内点击：${count.value}`}
                fillStyle="#ffffff"
            />
            <text
                loc={[16, 96]}
                text="重新显示后，计数归零"
                fillStyle="#cfe0ff"
            />
        </container>
    );
});

// 三元切换：面板被卸载与重建
export default defineComponent(() => {
    const open = ref(true);

    const togglePanel = () => {
        open.value = !open.value;
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

            {open.value ? (
                <container loc={[40, 92]}>
                    <CounterPanel />
                </container>
            ) : null}
        </container>
    );
});
