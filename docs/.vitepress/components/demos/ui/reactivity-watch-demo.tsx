import { defineComponent, ref, watch } from 'vue';

// watch 监听 count，变化后把新旧值写进 log
export default defineComponent(() => {
    const count = ref(0);
    const log = ref('还没有变化');

    watch(count, (next, prev) => {
        log.value = `count：${prev} → ${next}`;
    });

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[40, 36]}
                text="count 变化后 watch 写日志"
                fillStyle="#cfe0ff"
            />

            <g-rect
                loc={[40, 96, 180, 56]}
                fillStyle="#2f6fed"
                onClick={() => count.value++}
            />
            <text loc={[64, 114]} text="点我 +1" fillStyle="#e8f0ff" noevent />

            <text
                loc={[260, 112]}
                text={`log = ${log.value}`}
                fillStyle="#7ee787"
            />
        </container>
    );
});
