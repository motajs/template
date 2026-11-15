import { defineComponent } from 'vue';

// 带 cursor 的区域：鼠标移入后光标变成手型
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="cursor 属性" fillStyle="#cfe0ff" />
            <text
                loc={[24, 56]}
                text="把鼠标移到下面的区域上"
                fillStyle="#8b98a8"
            />

            <g-rect
                loc={[40, 100, 400, 140]}
                fillStyle="#2f6fed"
                cursor="pointer"
            />
            <text loc={[40, 258]} text='cursor="pointer"' fillStyle="#8b98a8" />
        </container>
    );
});
