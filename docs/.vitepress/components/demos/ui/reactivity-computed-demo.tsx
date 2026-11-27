import { computed, defineComponent, ref } from 'vue';

// computed 从 count 派生 doubled，不需要另外维护一份状态
export default defineComponent(() => {
    const count = ref(0);
    const doubled = computed(() => count.value * 2);

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[40, 36]}
                text="count 变化后 doubled 自动重算"
                fillStyle="#cfe0ff"
            />

            <g-rect
                loc={[40, 96, 180, 56]}
                fillStyle="#2f6fed"
                onClick={() => count.value++}
            />
            <text loc={[64, 114]} text="点我 +1" fillStyle="#e8f0ff" noevent />

            <text
                loc={[260, 104]}
                text={`count = ${count.value}`}
                fillStyle="#ffffff"
            />
            <text
                loc={[260, 140]}
                text={`doubled = ${doubled.value}`}
                fillStyle="#f2b84b"
            />
        </container>
    );
});
