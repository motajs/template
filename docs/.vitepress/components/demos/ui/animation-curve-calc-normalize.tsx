import { moveCurve, normalize, scaleCurve, sin } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveCalcLab from './animation-curve-calc';

const SOURCE = moveCurve(scaleCurve(sin(), 0.6), 0.2);
const RESULT = normalize(SOURCE);

// 归一化：把来源曲线的两端对齐到 0 与 1
export default defineComponent(() => {
    return () => (
        <CurveCalcLab
            title="normalize"
            subtitle="结果按 curve(0) 与 curve(1) 归一化"
            curves={[
                { label: '0.2 + 0.6·sin()', color: '#2f6fed', curve: SOURCE },
                { label: 'normalize', color: '#7ee787', curve: RESULT }
            ]}
        />
    );
});
