import { sin } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveLab from './animation-curve-lab';

// 正弦曲线：切换四种 CurveMode，观察快慢分布
export default defineComponent(() => {
    return () => (
        <CurveLab
            title="sin(mode?)"
            subtitle="正弦曲线：切换模式观察快慢分布"
            curve={mode => sin(mode)}
            bindings={[]}
            supportsMode
        />
    );
});
