import { defineComponent, ref } from 'vue';
import type { IActionEvent } from '@motajs/render';

// 同一个点击在内层、外层与画布坐标下的不同结果
export default defineComponent(() => {
    const inner = ref('—');
    const outer = ref('—');
    const absolute = ref('—');

    // 外层移动与点击都刷新同一组外层坐标
    const handleOuterPoint = (ev: IActionEvent) => {
        outer.value = `${Math.round(ev.offsetX)}, ${Math.round(ev.offsetY)}`;
        absolute.value = `${Math.round(ev.absoluteX)}, ${Math.round(
            ev.absoluteY
        )}`;
    };

    // 内层移动与点击都刷新同一组内层坐标
    const handleInnerPoint = (ev: IActionEvent) => {
        inner.value = `${Math.round(ev.offsetX)}, ${Math.round(ev.offsetY)}`;
    };

    const handleInnerLeave = () => {
        inner.value = '—';
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="事件坐标" fillStyle="#cfe0ff" />

            <container
                loc={[24, 60, 216, 180]}
                onMove={handleOuterPoint}
                onClick={handleOuterPoint}
            >
                <g-rect loc={[0, 0, 216, 180]} fillStyle="#26364d" />
                <g-rect
                    loc={[36, 40, 144, 88]}
                    fillStyle="#2f6fed"
                    onMove={handleInnerPoint}
                    onClick={handleInnerPoint}
                    onLeave={handleInnerLeave}
                />
                <text
                    loc={[72, 76]}
                    text="点这里"
                    fillStyle="#e8f0ff"
                    noevent
                />
            </container>

            <text
                loc={[264, 76]}
                text={`内层 offset：${inner.value}`}
                fillStyle="#ffffff"
            />
            <text
                loc={[264, 108]}
                text={`外层 offset：${outer.value}`}
                fillStyle="#f2b84b"
            />
            <text
                loc={[264, 140]}
                text={`画布 absolute：${absolute.value}`}
                fillStyle="#7ee787"
            />
            <text
                loc={[24, 264]}
                text="在内层与外层移动、点击，比较三组坐标"
                fillStyle="#8b98a8"
            />
        </container>
    );
});
