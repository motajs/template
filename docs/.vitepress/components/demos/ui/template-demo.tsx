import { defineComponent } from 'vue';

// 最小 UI 模板的 live 版本：一个背景矩形加一行文字
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            {/* 背景矩形先铺满整块画布，避免文字落在透明区域 */}
            <g-rect loc={[0, 0, 480, 320]} fill fillStyle="#1d2b45" />
            <text loc={[24, 24]} text="我的第一个 UI" fillStyle="#e8f0ff" />
        </container>
    );
});
