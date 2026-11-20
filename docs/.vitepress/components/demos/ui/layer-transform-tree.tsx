import { defineComponent } from 'vue';

// 父级缩放，子元素仍按局部坐标描述内容
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="变换沿树传递" fillStyle="#cfe0ff" />
            <text
                loc={[24, 48]}
                text="父级 scale 后，子元素的 loc 不变"
                fillStyle="#8b98a8"
            />

            {/* 父级放大 1.5 倍，子元素仍写 [0, 0, 140, 100]；加 nocache 避免缓存图被重采样 */}
            <container loc={[40, 88, 140, 100]} scale={[1.5, 1.5]} nocache>
                <g-rect loc={[0, 0, 140, 100]} fill fillStyle="#2f6fed" />
                <g-circle circle={[18, 18, 10]} fillStyle="#f2b84b" />
                <text loc={[12, 44]} text="子元素" fillStyle="#e8f0ff" />
            </container>

            {/* 同一棵子树未缩放的参考 */}
            <container loc={[290, 88, 140, 100]}>
                <g-rect loc={[0, 0, 140, 100]} fill fillStyle="#2f6fed" />
                <g-circle circle={[18, 18, 10]} fillStyle="#f2b84b" />
                <text loc={[12, 44]} text="子元素" fillStyle="#e8f0ff" />
            </container>

            <text
                loc={[40, 252]}
                text="父级 scale [1.5, 1.5]"
                fillStyle="#8b98a8"
            />
            <text loc={[290, 252]} text="未缩放参考" fillStyle="#8b98a8" />
        </container>
    );
});
