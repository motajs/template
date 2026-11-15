import { defineComponent } from 'vue';

// 圆角矩形：circle 给圆形圆角，ellipse 给椭圆圆角
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="圆角矩形：不同圆角写法对比"
                fillStyle="#e8f0ff"
            />

            <g-rectr
                loc={[60, 60, 130, 90]}
                circle={[24]}
                fillStyle="#2f6fed"
            />
            <g-rectr
                loc={[290, 60, 130, 90]}
                circle={[36, 0, 36, 0]}
                fillStyle="#58c4dd"
            />
            <g-rectr
                loc={[60, 192, 130, 90]}
                ellipse={[50, 24]}
                fillStyle="#c58af9"
            />
            <g-rectr
                loc={[290, 192, 130, 90]}
                circle={[90]}
                fillStyle="#f2b84b"
            />

            <text loc={[60, 163]} text="1 项 circle=[24]" fillStyle="#cfe0ff" />
            <text
                loc={[270, 163]}
                text="4 项 [36,0,36,0]"
                fillStyle="#cfe0ff"
            />
            <text loc={[60, 294]} text="ellipse=[50,24]" fillStyle="#cfe0ff" />
            <text
                loc={[290, 294]}
                text="大半径 circle=[90]"
                fillStyle="#cfe0ff"
            />
        </container>
    );
});
