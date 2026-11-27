import { computed, defineComponent, onUnmounted, ref } from 'vue';
import { GameUI, IUIDefaultPropsBase, UIController } from '@motajs/system';

// 切换 hidden / cache 的小面板，并显示 active / showBack 状态
export default defineComponent(() => {
    // 控制器与状态 UI 都在 setup 里创建，卸载时释放
    const controller = new UIController<IUIDefaultPropsBase>();
    controller.setPropsBaseCreator((instance, ctrl) => ({
        instance,
        controller: ctrl
    }));

    // 状态 UI 只负责显示控制器的两个引用值
    const StateUI = defineComponent(() => {
        return () => (
            <container loc={[330, 200, 130, 96]}>
                <g-rect loc={[0, 0, 130, 96]} fill fillStyle="#1d2b45" />
                <g-rect loc={[0, 0, 130, 96]} stroke strokeStyle="#7aa2ff" />
                <text loc={[10, 10]} text="控制器状态" fillStyle="#e8f0ff" />
                <text
                    loc={[10, 40]}
                    text={`active：${controller.active.value}`}
                    fillStyle="#8fb6ff"
                />
                <text
                    loc={[10, 64]}
                    text={`showBack：${controller.showBack.value}`}
                    fillStyle="#8fb6ff"
                />
            </container>
        );
    });

    const stateUI = new GameUI('perf-state', StateUI);
    controller.open(stateUI, {});

    const Renderer = defineComponent(() => {
        return () => controller.render();
    });

    const visible = ref(true);
    const cached = ref(false);
    const cacheText = computed(() => (cached.value ? '已开缓存' : '未开缓存'));

    onUnmounted(() => {
        controller.closeAll();
    });

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fill fillStyle="#141a22" />

            <container
                loc={[20, 20, 120, 32]}
                onClick={() => (visible.value = !visible.value)}
            >
                <g-rect loc={[0, 0, 120, 32]} fill fillStyle="#2f6fed" />
                <text loc={[12, 8]} text="显示 / 隐藏" fillStyle="#ffffff" />
            </container>
            <container
                loc={[150, 20, 120, 32]}
                onClick={() => (cached.value = !cached.value)}
            >
                <g-rect loc={[0, 0, 120, 32]} fill fillStyle="#3a2f5f" />
                <text loc={[12, 8]} text="切换缓存" fillStyle="#ffffff" />
            </container>
            <text loc={[20, 64]} text={cacheText.value} fillStyle="#8fb6ff" />

            {/* hidden 控制显示，cache / nocache 控制是否复用离屏画布 */}
            <container
                loc={[20, 96, 260, 200]}
                hidden={!visible.value}
                cache={cached.value}
                nocache={!cached.value}
            >
                <g-rect loc={[0, 0, 260, 200]} fill fillStyle="#101820" />
                {Array.from({ length: 8 }, (_, index) => (
                    <container key={index} loc={[12, 12 + index * 22, 236, 18]}>
                        <g-rect
                            loc={[0, 0, 236, 18]}
                            fill
                            fillStyle={index % 2 === 0 ? '#26364d' : '#1d2b45'}
                        />
                        <text
                            loc={[8, 2]}
                            text={`静态内容 ${index + 1}`}
                            fillStyle="#e8f0ff"
                        />
                    </container>
                ))}
            </container>

            <text
                loc={[20, 300]}
                text="hidden 保留状态；cache 只在内容稳定时才有收益。"
                fillStyle="#8fb6ff"
            />

            <Renderer />
        </container>
    );
});
