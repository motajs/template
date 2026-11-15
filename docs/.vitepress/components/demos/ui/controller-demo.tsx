import { computed, defineComponent, onUnmounted } from 'vue';
import {
    GameUI,
    IUIDefaultPropsBase,
    IUIInstance,
    UIController
} from '@motajs/system';

// 最小控制器：只注入 instance 与 controller，不依赖游戏状态
const controller = new UIController<IUIDefaultPropsBase>();
controller.setPropsBaseCreator((instance, ctrl) => ({
    instance,
    controller: ctrl
}));

// 被打开的 UI：固定在画布右侧，避免和按钮重叠
const DemoPanel = defineComponent(() => {
    return () => (
        <container loc={[220, 120, 220, 150]}>
            <g-rect loc={[0, 0, 220, 150]} fill fillStyle="#1d2b45" />
            <g-rect loc={[0, 0, 220, 150]} stroke strokeStyle="#7aa2ff" />
            <text loc={[16, 24]} text="这是一个最小 UI" fillStyle="#e8f0ff" />
            <text
                loc={[16, 64]}
                text="由 UIController 打开"
                fillStyle="#8fb6ff"
            />
        </container>
    );
});

const demoUI = new GameUI('controller-demo-panel', DemoPanel);

// 把 controller.render() 挂进同一棵渲染树
const UIRenderer = defineComponent(() => {
    return () => controller.render();
});

export default defineComponent(() => {
    // 打开与关闭必须复用同一个实例
    let instance: IUIInstance | null = null;

    const stackSize = computed(() => controller.stack.length);
    const activeText = computed(() =>
        controller.active.value ? '已打开' : '未打开'
    );

    const openUI = () => {
        if (!instance) {
            instance = controller.open(demoUI, {});
        }
    };

    const closeUI = () => {
        if (instance) {
            controller.close(instance);
            instance = null;
        }
    };

    onUnmounted(() => {
        controller.closeAll();
    });

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fill fillStyle="#141a22" />

            <text loc={[20, 20]} text="打开 UI" fillStyle="#e8f0ff" />
            <container loc={[20, 44, 150, 44]} onClick={openUI}>
                <g-rect loc={[0, 0, 150, 44]} fill fillStyle="#2f6fed" />
                <text loc={[16, 12]} text="打开" fillStyle="#ffffff" />
            </container>

            <text loc={[20, 116]} text="关闭 UI" fillStyle="#e8f0ff" />
            <container loc={[20, 140, 150, 44]} onClick={closeUI}>
                <g-rect loc={[0, 0, 150, 44]} fill fillStyle="#3a2f5f" />
                <text loc={[16, 12]} text="关闭" fillStyle="#ffffff" />
            </container>

            <text
                loc={[20, 220]}
                text={`栈长度：${stackSize.value}`}
                fillStyle="#8fb6ff"
            />
            <text
                loc={[20, 252]}
                text={`状态：${activeText.value}`}
                fillStyle="#8fb6ff"
            />

            <UIRenderer />
        </container>
    );
});
