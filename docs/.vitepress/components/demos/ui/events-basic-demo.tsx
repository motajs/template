import { defineComponent, ref } from 'vue';
import type { IActionEvent, IWheelEvent } from '@motajs/render';

// 内置事件：按下、抬起、点击，以及进入、离开、移动、滚轮
export default defineComponent(() => {
    const log = ref<string[]>([]);
    const move = ref('—');

    const push = (text: string) => {
        log.value = [...log.value, text].slice(-4);
    };

    const handleDown = () => push('按下');
    const handleUp = () => push('抬起');
    const handleClick = () => push('点击');
    const handleEnter = () => push('进入');
    const handleLeave = () => push('离开');
    const handleMove = (ev: IActionEvent) => {
        move.value = `${Math.round(ev.offsetX)}, ${Math.round(ev.offsetY)}`;
    };
    const handleWheel = (ev: IWheelEvent) => {
        push(`滚轮 ${Math.round(ev.wheelY)}`);
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="内置事件" fillStyle="#cfe0ff" />

            <g-rect
                loc={[24, 56, 160, 48]}
                fillStyle="#2f6fed"
                onDown={handleDown}
                onUp={handleUp}
                onClick={handleClick}
            />
            <text loc={[64, 73]} text="点我" fillStyle="#e8f0ff" noevent />

            <g-rect
                loc={[212, 56, 244, 112]}
                fillStyle="#26364d"
                onEnter={handleEnter}
                onLeave={handleLeave}
                onMove={handleMove}
                onWheel={handleWheel}
            />
            <text
                loc={[228, 72]}
                text="悬停、移动、滚轮"
                fillStyle="#cfe0ff"
                noevent
            />
            <text
                loc={[228, 100]}
                text={`局部坐标：${move.value}`}
                fillStyle="#8b98a8"
                noevent
            />

            <text
                loc={[24, 196]}
                text={`事件：${log.value.join(' → ')}`}
                fillStyle="#f2b84b"
            />
            <text
                loc={[24, 236]}
                text="移动只更新坐标，不写入事件日志"
                fillStyle="#8b98a8"
            />
        </container>
    );
});
