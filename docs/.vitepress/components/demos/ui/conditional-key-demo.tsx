import { defineComponent, ref } from 'vue';

interface Row {
    id: number;
    label: string;
}

interface StatefulRowProps {
    label: string;
    offsetY: number;
}

interface StatefulRowOptions {
    props: (keyof StatefulRowProps)[];
}

const statefulRowOptions: StatefulRowOptions = {
    props: ['label', 'offsetY']
};

// 每一行有自己的计数；重排后它跟着组件实例走
const StatefulRow = defineComponent<StatefulRowProps, {}, string>(props => {
    const count = ref(0);

    const increaseCount = () => {
        count.value++;
    };

    return () => (
        <container loc={[0, props.offsetY, 200, 36]} onClick={increaseCount}>
            <g-rect loc={[0, 0, 200, 36]} fill fillStyle="#26364d" />
            <text loc={[10, 10]} text={props.label} fillStyle="#ffffff" />
            <text
                loc={[104, 10]}
                text={`点击 ${count.value}`}
                fillStyle="#f2b84b"
            />
        </container>
    );
}, statefulRowOptions);

// key=id 的状态跟着项，key=index 的状态留在原位置
export default defineComponent(() => {
    const rows = ref<Row[]>([
        { id: 1, label: '甲' },
        { id: 2, label: '乙' },
        { id: 3, label: '丙' }
    ]);

    const rotateRows = () => {
        const first = rows.value.shift();
        if (first) {
            rows.value.push(first);
        }
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 16]}
                text="点行内 +1，再点「轮换顺序」"
                fillStyle="#cfe0ff"
            />

            <text loc={[24, 52]} text="key = id" fillStyle="#58c4dd" />
            <text loc={[256, 52]} text="key = index" fillStyle="#f2b84b" />

            <container loc={[24, 84]}>
                {rows.value.map((row, index) => (
                    <StatefulRow
                        key={row.id}
                        label={row.label}
                        offsetY={index * 42}
                    />
                ))}
            </container>

            <container loc={[256, 84]}>
                {rows.value.map((row, index) => (
                    <StatefulRow
                        key={index}
                        label={row.label}
                        offsetY={index * 42}
                    />
                ))}
            </container>

            <container loc={[160, 260, 160, 36]} onClick={rotateRows}>
                <g-rect loc={[0, 0, 160, 36]} fill fillStyle="#2f6fed" />
                <text loc={[52, 10]} text="轮换顺序" fillStyle="#e8f0ff" />
            </container>
        </container>
    );
});
