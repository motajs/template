import { defineComponent } from 'vue';
import {
    PlayIcon,
    PauseIcon,
    RollbackIcon,
    RetweetIcon,
    SoundVolume,
    Fullscreen,
    DoubleArrow,
    StepForward,
    ArrowLeftTailless
} from '../../../../../packages-user/client-base/src/components/icons';

// 图标组件：每个图标都只接受 loc，按名字使用
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <PlayIcon loc={[56, 36, 32, 32]} />
            <text loc={[56, 80]} text="PlayIcon" fillStyle="#cfe0ff" />

            <PauseIcon loc={[196, 36, 32, 32]} />
            <text loc={[196, 80]} text="PauseIcon" fillStyle="#cfe0ff" />

            <RollbackIcon loc={[336, 36, 32, 32]} />
            <text loc={[336, 80]} text="RollbackIcon" fillStyle="#cfe0ff" />

            <RetweetIcon loc={[56, 128, 32, 32]} />
            <text loc={[56, 172]} text="RetweetIcon" fillStyle="#cfe0ff" />

            <SoundVolume loc={[196, 128, 32, 32]} />
            <text loc={[196, 172]} text="SoundVolume" fillStyle="#cfe0ff" />

            <Fullscreen loc={[336, 128, 32, 32]} />
            <text loc={[336, 172]} text="Fullscreen" fillStyle="#cfe0ff" />

            <DoubleArrow loc={[56, 220, 32, 32]} />
            <text loc={[56, 264]} text="DoubleArrow" fillStyle="#cfe0ff" />

            <ArrowLeftTailless loc={[196, 220, 32, 32]} />
            <text
                loc={[196, 264]}
                text="ArrowLeftTailless"
                fillStyle="#cfe0ff"
            />

            <StepForward loc={[336, 220, 32, 32]} />
            <text loc={[336, 264]} text="StepForward" fillStyle="#cfe0ff" />
        </container>
    );
});
