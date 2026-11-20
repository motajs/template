import { sec } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveLab from './animation-curve-lab';

// 正割曲线：切换四种 CurveMode，观察快慢分布
export default defineComponent(() => {
    return () => (
        <CurveLab
            title="sec(mode?)"
            subtitle="正割曲线：切换模式观察快慢分布"
            curve={mode => sec(mode)}
            bindings={[]}
            supportsMode
        />
    );
});
