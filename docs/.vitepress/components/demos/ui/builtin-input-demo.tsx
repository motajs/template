import { defineComponent, ref } from 'vue';
import { Input } from '../../../../../packages-user/client-base/src/components/input';

// 输入框：单行占位、单行已填内容与多行输入
export default defineComponent(() => {
    const name = ref('');
    const filled = ref('魔塔玩家');
    const note = ref('第一行备注\n第二行备注');

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[40, 24]} text="单行" fillStyle="#cfe0ff" />
            <Input
                loc={[40, 48, 280, 32]}
                v-model:value={name.value}
                placeholder="输入名字"
            />

            <text loc={[40, 96]} text="已填内容" fillStyle="#cfe0ff" />
            <Input loc={[40, 120, 280, 32]} v-model:value={filled.value} />

            <text loc={[40, 168]} text="多行" fillStyle="#cfe0ff" />
            <Input
                loc={[40, 192, 320, 88]}
                v-model:value={note.value}
                multiline
                placeholder="多行备注"
            />
        </container>
    );
});
