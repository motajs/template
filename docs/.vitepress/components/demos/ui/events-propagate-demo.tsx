import { defineComponent, ref } from 'vue';
import type { IActionEvent } from '@motajs/render';

// 嵌套容器中的捕获与冒泡，以及可切换的 stopPropagation
export default defineComponent(() => {
    const log = ref<string[]>([]);
    const stop = ref(false);

    // 每次点击只保留本次交互的日志，不做累积
    const push = (text: string) => {
        log.value = [...log.value, text];
    };

    const handleToggleStop = () => {
        stop.value = !stop.value;
    };

    // 外层捕获是一次点击的起点：先清空日志，再记录本次触发的后续事件
    const handleOuterCapture = () => {
        log.value = ['外层捕获'];
    };

    const handleOuterBubble = () => push('外层冒泡');
    const handleInnerCapture = () => push('内层捕获');
    const handleInnerBubble = () => push('内层冒泡');
    const handleButtonCapture = () => push('按钮捕获');

    const handleButtonBubble = (ev: IActionEvent) => {
        // 先记录按钮冒泡，再按开关决定是否截断向外传播
        push('按钮冒泡');
        if (stop.value) ev.stopPropagation();
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="捕获与冒泡" fillStyle="#cfe0ff" />

            {/* 切换 stop：只影响下方按钮冒泡是否继续向外层传递 */}
            <container loc={[24, 52, 156, 36]} onClick={handleToggleStop}>
                <g-rect
                    loc={[0, 0, 156, 36]}
                    fillStyle={stop.value ? '#f2b84b' : '#2f6fed'}
                />
                <text
                    loc={[18, 10]}
                    text={stop.value ? 'stop：开启' : 'stop：关闭'}
                    fillStyle="#141a22"
                />
            </container>

            {/* 外层捕获是一次点击的起点：先清空日志，再记录本次触发的后续事件 */}
            <container
                loc={[24, 108, 264, 172]}
                onClickCapture={handleOuterCapture}
                onClick={handleOuterBubble}
            >
                <g-rect loc={[0, 0, 264, 172]} fillStyle="#26364d" />
                <container
                    loc={[32, 32, 200, 108]}
                    onClickCapture={handleInnerCapture}
                    onClick={handleInnerBubble}
                >
                    <g-rect loc={[0, 0, 200, 108]} fillStyle="#1d2a3a" />
                    <g-rect
                        loc={[40, 28, 120, 52]}
                        fillStyle="#2f6fed"
                        onClickCapture={handleButtonCapture}
                        onClick={handleButtonBubble}
                    />
                    <text loc={[40, 90]} text="点按钮" fillStyle="#e8f0ff" />
                </container>
            </container>

            <text loc={[308, 80]} text="只显示本次点击" fillStyle="#8b98a8" />

            {[0, 1, 2, 3, 4, 5].map(index => (
                <text
                    key={index}
                    loc={[308, 112 + index * 24]}
                    text={log.value[index] ?? ''}
                    fillStyle="#f2b84b"
                />
            ))}

            <text
                loc={[24, 292]}
                text="stop 开启后，按钮冒泡不再传给外层"
                fillStyle="#8b98a8"
            />
        </container>
    );
});
