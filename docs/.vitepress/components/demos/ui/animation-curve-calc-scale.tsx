import { scaleCurve, sin } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const SOURCE = sin();
const RESULT = scaleCurve(SOURCE, 0.5);

// 缩放：纵向缩小来源曲线
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="scaleCurve"
            subtitle="结果 = f(x) · scale"
            curves={[
                { label: 'sin()', color: '#2f6fed', curve: SOURCE },
                { label: 'scaleCurve', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
