import {
    linear,
    moveCurve,
    reciprocalCurve,
    scaleCurve
} from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const SOURCE = moveCurve(scaleCurve(linear(), 0.5), 0.5);
const RESULT = reciprocalCurve(SOURCE, 0.5);

// 倒数：来源曲线取值在 0.5 到 1，避免分母过零
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="reciprocalCurve"
            subtitle="结果 = scale / f(x)"
            curves={[
                { label: '0.5 + 0.5p', color: '#2f6fed', curve: SOURCE },
                { label: 'reciprocalCurve', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
