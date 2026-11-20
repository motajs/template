import { sin } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveLab from './animation-curve-lab';

// 曲线模式：同一条正弦曲线在四种 CurveMode 之间切换
export default defineComponent(() => {
    return () => (
        <CurveLab
            title="sin()"
            subtitle="同一条正弦曲线在四种模式之间切换"
            curve={mode => sin(mode)}
            bindings={[]}
            supportsMode
        />
    );
});
