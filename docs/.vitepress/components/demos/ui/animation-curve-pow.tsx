import { pow } from '@motajs/animate';
import { defineComponent, ref } from 'vue';
import { Slider } from '../../../../../packages-user/client-base/src/components/slider';
import CurveLab from './animation-curve-lab';

const EXP_MIN = 0.5;
const EXP_MAX = 4;

// 幂曲线：调整指数，切换四种 CurveMode
export default defineComponent(() => {
    const exp = ref(2);

    return () => (
        <CurveLab
            title="pow(exp, mode?)"
            subtitle="幂曲线：调整指数与模式"
            curve={mode => pow(exp.value, mode)}
            bindings={[exp.value]}
            supportsMode
        >
            <text loc={[24, 4]} text="指数 exp" fillStyle="#cfe0ff" />
            <Slider
                loc={[112, 0, 336, 24]}
                v-model:value={exp.value}
                min={EXP_MIN}
                max={EXP_MAX}
                step={0.1}
            />
        </CurveLab>
    );
});
