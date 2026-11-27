import { constant } from '@motajs/animate';
import { defineComponent, ref } from 'vue';
import { Slider } from '../../../../../packages-user/client-base/src/components/slider';
import CurveLab from './animation-curve-lab';

const VALUE_MIN = 0;
const VALUE_MAX = 1;

// 常数曲线：输出始终等于 k
export default defineComponent(() => {
    const k = ref(0.5);

    return () => (
        <CurveLab
            title="constant(k)"
            subtitle="常数曲线：输出始终等于 k（示例 k 取 0 到 1）"
            curve={() => constant(k.value)}
            bindings={[k.value]}
        >
            <text loc={[24, 4]} text="常数值 k" fillStyle="#cfe0ff" />
            <Slider
                loc={[112, 0, 336, 24]}
                v-model:value={k.value}
                min={VALUE_MIN}
                max={VALUE_MAX}
                step={0.05}
            />
        </CurveLab>
    );
});
