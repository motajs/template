import { defineComponent } from 'vue';

// 两个重叠矩形：先写的蓝色 zIndex 更高，盖在黄色上面
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="zIndex 对照" fillStyle="#cfe0ff" />

            <g-rect loc={[80, 88, 200, 140]} fillStyle="#2f6fed" zIndex={2} />
            <g-rect loc={[180, 148, 200, 140]} fillStyle="#f2b84b" />

            <text loc={[24, 296]} text="蓝色 zIndex 2" fillStyle="#8b98a8" />
            <text loc={[300, 296]} text="黄色 zIndex 0" fillStyle="#8b98a8" />
        </container>
    );
});
