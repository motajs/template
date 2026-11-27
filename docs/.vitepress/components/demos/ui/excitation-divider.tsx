import { ExcitationDivider, IntervalExcitation } from '@motajs/animate';
import { defineComponent, onUnmounted, ref } from 'vue';

// 分频器：统计输入源激励次数与输出端转发次数
export default defineComponent(() => {
    const divider = ref(1);
    const upCount = ref(0);
    const downCount = ref(0);
    const upPayload = ref(0);
    const downPayload = ref(0);

    const source = new IntervalExcitation(200);
    const splitter = new ExcitationDivider<number>();
    splitter.bindExcitation(source);

    source.add({
        excited(payload: number) {
            upCount.value += 1;
            upPayload.value = payload;
        }
    });

    splitter.add({
        excited(payload: number) {
            downCount.value += 1;
            downPayload.value = payload;
        }
    });

    const changeDivider = (value: number) => {
        splitter.setDivider(value);
        divider.value = value;
    };

    onUnmounted(() => {
        splitter.unbindExcitation();
        splitter.destroy();
        source.destroy();
    });

    const options = [1, 2, 3, 5];

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text
                loc={[24, 16]}
                text="ExcitationDivider：输入与转发次数"
                fillStyle="#e8f0ff"
            />
            <text
                loc={[24, 40]}
                text="分频器只转发部分激励，负载本身不变"
                fillStyle="#8b98a8"
            />

            <text loc={[40, 76]} text="输入源原始载荷" fillStyle="#cfe0ff" />
            <text
                loc={[40, 102]}
                text={`${Math.round(upPayload.value)} ms`}
                fillStyle="#8fb6ff"
            />
            <text loc={[40, 146]} text="输入源次数" fillStyle="#cfe0ff" />
            <text
                loc={[40, 172]}
                text={String(upCount.value)}
                fillStyle="#8fb6ff"
            />

            <text loc={[260, 76]} text="输出端收到的载荷" fillStyle="#f2b84b" />
            <text
                loc={[260, 102]}
                text={`${Math.round(downPayload.value)} ms`}
                fillStyle="#f2b84b"
            />
            <text loc={[260, 146]} text="输出端次数" fillStyle="#f2b84b" />
            <text
                loc={[260, 172]}
                text={String(downCount.value)}
                fillStyle="#f2b84b"
            />

            <text loc={[40, 210]} text="当前分频比" fillStyle="#cfe0ff" />
            <text
                loc={[40, 236]}
                text={`每 ${divider.value} 次输入 → 1 次输出`}
                fillStyle="#7ee787"
            />

            {options.map((value, index) => {
                const active = divider.value === value;

                return (
                    <container
                        key={value}
                        loc={[40 + index * 72, 270, 64, 32]}
                        onClick={() => changeDivider(value)}
                    >
                        <g-rectr
                            loc={[0, 0, 64, 32]}
                            circle={[8]}
                            fillStyle={active ? '#2f6fed' : '#33465f'}
                        />
                        <text
                            loc={[20, 8]}
                            text={`÷${value}`}
                            fillStyle="#ffffff"
                        />
                    </container>
                );
            })}
        </container>
    );
});
