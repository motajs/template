import { cosh } from '@motajs/animate';
import { defineComponent, ref } from 'vue';
import { Slider } from '../../../../../packages-user/client-base/src/components/slider';
import CurveLab from './animation-curve-lab';

const K_MIN = 0.5;
const K_MAX = 4;

// 双曲余弦曲线：调整比例参数 k，切换四种 CurveMode
export default defineComponent(() => {
    const k = ref(2);

    return () => (
        <CurveLab
            title="cosh(k = 2, mode?)"
            subtitle="双曲余弦曲线：调整 k 与模式"
            curve={mode => cosh(k.value, mode)}
            bindings={[k.value]}
            supportsMode
        >
            <text loc={[24, 4]} text="比例参数 k" fillStyle="#cfe0ff" />
            <Slider
                loc={[112, 0, 336, 24]}
                v-model:value={k.value}
                min={K_MIN}
                max={K_MAX}
                step={0.1}
            />
        </CurveLab>
    );
});
