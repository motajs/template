import { step } from '@motajs/animate';
import { defineComponent, ref } from 'vue';
import { Slider } from '../../../../../packages-user/client-base/src/components/slider';
import CurveLab from './animation-curve-lab';

const STEP_MIN = 2;
const STEP_MAX = 12;

// 阶梯曲线：进度每走 1/k，输出跳变一次
export default defineComponent(() => {
    const k = ref(5);

    return () => (
        <CurveLab
            title="step(k)"
            subtitle="阶梯曲线：每 1/k 段跳变一次"
            curve={() => step(k.value)}
            bindings={[k.value]}
        >
            <text loc={[24, 4]} text="阶梯数 k" fillStyle="#cfe0ff" />
            <Slider
                loc={[112, 0, 336, 24]}
                v-model:value={k.value}
                min={STEP_MIN}
                max={STEP_MAX}
                step={1}
            />
        </CurveLab>
    );
});
