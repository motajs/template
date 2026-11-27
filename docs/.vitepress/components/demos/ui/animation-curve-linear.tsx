import { linear } from '@motajs/animate';
import { defineComponent } from 'vue';
import CurveLab from './animation-curve-lab';

// 线性曲线：没有参数，输出始终等于 x
export default defineComponent(() => {
    return () => (
        <CurveLab
            title="linear()"
            subtitle="线性曲线：输出等于 x"
            curve={() => linear()}
            bindings={[]}
            note="无参数"
        />
    );
});
