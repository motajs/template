import { defineComponent, reactive } from 'vue';

// reactive 代理对象：逐字段修改，标题与开关一起更新
export default defineComponent(() => {
    const panel = reactive({
        open: true,
        title: '背包'
    });

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[40, 36]}
                text="点击切换 open 与 title"
                fillStyle="#cfe0ff"
            />

            <g-rect
                loc={[40, 96, 180, 56]}
                fillStyle="#2f6fed"
                onClick={() => {
                    panel.open = !panel.open;
                    panel.title = panel.open ? '背包' : '道具';
                }}
            />
            <text loc={[64, 114]} text="切换" fillStyle="#e8f0ff" noevent />

            <text
                loc={[260, 104]}
                text={`open = ${panel.open}`}
                fillStyle="#ffffff"
            />
            <text
                loc={[260, 140]}
                text={`title = ${panel.title}`}
                fillStyle="#f2b84b"
            />
        </container>
    );
});
