import { defineComponent, ref } from 'vue';
import { Slider } from '../../../../../packages-user/client-base/src/components/slider';

// 滑动条：右侧显示当前值，旁边配两个按钮增减数值
export default defineComponent(() => {
    const volume = ref(40);

    const decrease = () => {
        volume.value = Math.max(0, volume.value - 5);
    };
    const increase = () => {
        volume.value = Math.min(100, volume.value + 5);
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[44, 48]} text="音量" fillStyle="#cfe0ff" />

            <container loc={[44, 76, 196, 24]}>
                <Slider
                    loc={[0, 0, 196, 24]}
                    v-model:value={volume.value}
                    min={0}
                    max={100}
                    step={5}
                    showValue
                />
            </container>

            <container loc={[44, 124, 64, 28]} onClick={decrease}>
                <g-rectr
                    loc={[0, 0, 64, 28]}
                    circle={[4]}
                    fillStyle="#2f6fed"
                />
                <text
                    loc={[32, 14]}
                    anc={[0.5, 0.5]}
                    text="-"
                    fillStyle="#ffffff"
                />
            </container>
            <container loc={[120, 124, 64, 28]} onClick={increase}>
                <g-rectr
                    loc={[0, 0, 64, 28]}
                    circle={[4]}
                    fillStyle="#3a2f5f"
                />
                <text
                    loc={[32, 14]}
                    anc={[0.5, 0.5]}
                    text="+"
                    fillStyle="#ffffff"
                />
            </container>
        </container>
    );
});
