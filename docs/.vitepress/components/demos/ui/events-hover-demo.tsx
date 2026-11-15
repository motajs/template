import { defineComponent, ref } from 'vue';
import type { IWheelEvent } from '@motajs/render';

// enter / leave 由悬停集合做差集触发，滚轮与 cursor 跟随命中结果
export default defineComponent(() => {
    const outerState = ref('未进入');
    const innerState = ref('未进入');
    const cursor = ref('pointer');
    const total = ref(0);

    const handleOuterEnter = () => {
        outerState.value = '进入';
        cursor.value = 'pointer';
    };

    const handleOuterLeave = () => {
        outerState.value = '离开';
        cursor.value = 'pointer';
    };

    const handleOuterWheel = (ev: IWheelEvent) => {
        total.value += ev.wheelY;
    };

    const handleInnerEnter = () => {
        innerState.value = '进入';
        cursor.value = 'text';
    };

    const handleInnerLeave = () => {
        innerState.value = '离开';
        cursor.value = 'pointer';
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[24, 20]} text="悬停与滚轮" fillStyle="#cfe0ff" />

            <container
                loc={[24, 64, 220, 176]}
                cursor="pointer"
                onEnter={handleOuterEnter}
                onLeave={handleOuterLeave}
                onWheel={handleOuterWheel}
            >
                <g-rect loc={[0, 0, 220, 176]} fillStyle="#26364d" />
                <text
                    loc={[16, 16]}
                    text="外层：cursor pointer"
                    fillStyle="#cfe0ff"
                />
                <g-rect
                    loc={[40, 64, 140, 80]}
                    fillStyle="#2f6fed"
                    cursor="text"
                    onEnter={handleInnerEnter}
                    onLeave={handleInnerLeave}
                />
                <text
                    loc={[40, 152]}
                    text="内层：cursor text"
                    fillStyle="#e8f0ff"
                />
            </container>

            <text
                loc={[264, 80]}
                text={`外层：${outerState.value}`}
                fillStyle="#ffffff"
            />
            <text
                loc={[264, 112]}
                text={`内层：${innerState.value}`}
                fillStyle="#7ee787"
            />
            <text
                loc={[264, 144]}
                text={`cursor：${cursor.value}`}
                fillStyle="#f2b84b"
            />
            <text
                loc={[264, 176]}
                text={`滚轮累计：${Math.round(total.value)}`}
                fillStyle="#cfe0ff"
            />
            <text
                loc={[24, 264]}
                text="从内层移回外层时，外层不会重新 enter"
                fillStyle="#8b98a8"
            />
        </container>
    );
});
