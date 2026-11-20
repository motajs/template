import { ExcitationVariator, RafExcitation } from '@motajs/animate';
import { defineComponent, onUnmounted, ref } from 'vue';

// 变速器：输出端连续两次时间的差值
export default defineComponent(() => {
    const speed = ref(1);
    const inputNow = ref(0);
    const prevOut = ref(0);
    const currOut = ref(0);
    const gap = ref(0);
    const hasPrev = ref(false);

    const source = new RafExcitation();
    const variator = new ExcitationVariator();
    variator.bindExcitation(source);

    let lastOut = 0;

    source.add({
        excited(payload: number) {
            inputNow.value = payload;
        }
    });

    variator.add({
        excited(payload: number) {
            if (hasPrev.value) {
                prevOut.value = lastOut;
                gap.value = payload - lastOut;
            }
            currOut.value = payload;
            lastOut = payload;
            hasPrev.value = true;
            speed.value = variator.speed;
        }
    });

    const changeSpeed = (value: number) => {
        variator.setSpeed(value);
        speed.value = value;
    };

    onUnmounted(() => {
        variator.destroy();
        source.destroy();
    });

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />
            <text
                loc={[24, 16]}
                text="ExcitationVariator：输出端连续两次时间"
                fillStyle="#e8f0ff"
            />
            <text
                loc={[24, 40]}
                text="变速器按速度换算输入源时间，再推进接收方"
                fillStyle="#8b98a8"
            />

            <text loc={[40, 78]} text="输入源当前时间" fillStyle="#cfe0ff" />
            <text
                loc={[40, 102]}
                text={`${Math.round(inputNow.value)} ms`}
                fillStyle="#8fb6ff"
            />

            <g-rect loc={[40, 130, 400, 104]} fillStyle="#1b2433" />

            <text loc={[52, 140]} text="上次时间" fillStyle="#cfe0ff" />
            <text
                loc={[52, 164]}
                text={hasPrev.value ? `${prevOut.value.toFixed(1)} ms` : '—'}
                fillStyle="#8fb6ff"
            />

            <text loc={[180, 140]} text="本次时间" fillStyle="#cfe0ff" />
            <text
                loc={[180, 164]}
                text={`${currOut.value.toFixed(1)} ms`}
                fillStyle="#8fb6ff"
            />

            <text loc={[300, 140]} text="时间差" fillStyle="#f2b84b" />
            <text
                loc={[300, 164]}
                text={hasPrev.value ? `${gap.value.toFixed(2)} ms` : '—'}
                fillStyle="#f2b84b"
            />

            <text
                loc={[52, 198]}
                text="速度越高，输出端相邻两次的时间差越大"
                fillStyle="#8b98a8"
            />

            <text loc={[40, 240]} text="当前速度" fillStyle="#cfe0ff" />
            <text
                loc={[128, 240]}
                text={`${speed.value.toFixed(2)}×`}
                fillStyle="#7ee787"
            />

            <container loc={[40, 274, 88, 32]} onClick={() => changeSpeed(0.5)}>
                <g-rectr
                    loc={[0, 0, 88, 32]}
                    circle={[8]}
                    fillStyle={speed.value === 0.5 ? '#2f6fed' : '#33465f'}
                />
                <text loc={[18, 8]} text="0.5×" fillStyle="#ffffff" />
            </container>
            <container loc={[144, 274, 88, 32]} onClick={() => changeSpeed(1)}>
                <g-rectr
                    loc={[0, 0, 88, 32]}
                    circle={[8]}
                    fillStyle={speed.value === 1 ? '#2f6fed' : '#33465f'}
                />
                <text loc={[24, 8]} text="1×" fillStyle="#ffffff" />
            </container>
            <container loc={[248, 274, 88, 32]} onClick={() => changeSpeed(2)}>
                <g-rectr
                    loc={[0, 0, 88, 32]}
                    circle={[8]}
                    fillStyle={speed.value === 2 ? '#2f6fed' : '#33465f'}
                />
                <text loc={[18, 8]} text="2×" fillStyle="#ffffff" />
            </container>
        </container>
    );
});
