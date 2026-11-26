import { defineComponent, markRaw, ref } from 'vue';
import {
    ScrollText,
    ScrollTextExpose
} from '../../../../../packages-user/client-base/src/components/misc';
import { TextContentTyper } from '../../../../../packages-user/client-base/src/components/textboxTyper';

const TYPER = markRaw(
    new TextContentTyper({
        lineHeight: 8,
        fillStyle: '#e8f0ff'
    })
);

const NOTICE = [
    '暂停、继续与变速都通过组件实例控制。',
    '改变速度只影响之后的滚动，不重算已经滚过的位置。',
    '回到起点会调用 rescroll，然后再调用 resume。',
    '滚到底时触发 onScrollEnd，组件会停在底部。'
]
    .join('\n')
    .repeat(3);

// 实例方法：暂停、继续、变速与回到起点，全部调用真实组件方法
export default defineComponent(() => {
    const scroll = ref<ScrollTextExpose>();
    const speed = ref(70);
    const status = ref('滚动中');

    const pause = () => {
        scroll.value?.pause();
        status.value = '已暂停';
    };

    const resume = () => {
        scroll.value?.resume();
        status.value = '滚动中';
    };

    const toggleSpeed = () => {
        speed.value = speed.value === 70 ? 140 : 70;
        scroll.value?.setSpeed(speed.value);
    };

    const backToStart = () => {
        scroll.value?.rescroll();
        scroll.value?.resume();
        status.value = '滚动中';
    };

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text loc={[40, 24]} text="滚动控制" fillStyle="#cfe0ff" />
            <text
                loc={[40, 48]}
                text={`${status.value} · 每秒 ${speed.value} 像素`}
                fillStyle="#8b98a8"
            />

            <g-rect loc={[40, 76, 400, 140]} fillStyle="#101820" />
            <ScrollText
                ref={scroll}
                loc={[40, 76, 400, 140]}
                width={400}
                speed={70}
                typer={TYPER}
                text={NOTICE}
                onScrollEnd={() => (status.value = '已到底')}
            />

            <container loc={[40, 246, 84, 30]} onClick={pause}>
                <g-rectr
                    loc={[0, 0, 84, 30]}
                    circle={[6]}
                    fillStyle="#33465f"
                />
                <text loc={[12, 7]} text="暂停" fillStyle="#e8f0ff" />
            </container>
            <container loc={[134, 246, 84, 30]} onClick={resume}>
                <g-rectr
                    loc={[0, 0, 84, 30]}
                    circle={[6]}
                    fillStyle="#2f6fed"
                />
                <text loc={[12, 7]} text="继续" fillStyle="#ffffff" />
            </container>
            <container loc={[228, 246, 84, 30]} onClick={toggleSpeed}>
                <g-rectr
                    loc={[0, 0, 84, 30]}
                    circle={[6]}
                    fillStyle="#3a2f5f"
                />
                <text loc={[12, 7]} text="变速" fillStyle="#e8f0ff" />
            </container>
            <container loc={[322, 246, 110, 30]} onClick={backToStart}>
                <g-rectr
                    loc={[0, 0, 110, 30]}
                    circle={[6]}
                    fillStyle="#33465f"
                />
                <text loc={[12, 7]} text="回到起点" fillStyle="#e8f0ff" />
            </container>
        </container>
    );
});
