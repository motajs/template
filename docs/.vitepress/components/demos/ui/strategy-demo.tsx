import { computed, defineComponent, onUnmounted } from 'vue';
import {
    GameUI,
    IUIDefaultPropsBase,
    IUIInstance,
    UIController
} from '@motajs/system';

// 策略演示：四个面板分别放在左右两个控制器里
interface PanelLoc {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    label: string;
}

// 生成一个固定位置的演示面板，两个策略各用两份
const makePanel = (options: PanelLoc) => {
    const { x, y, width, height, color, label } = options;
    return defineComponent(() => {
        return () => (
            <container loc={[x, y, width, height]}>
                <g-rect loc={[0, 0, width, height]} fill fillStyle={color} />
                <g-rect
                    loc={[0, 0, width, height]}
                    stroke
                    strokeStyle="#ffffff"
                />
                <text loc={[12, 12]} text={label} fillStyle="#ffffff" />
            </container>
        );
    });
};

// 每个面板都是一个独立 GameUI，打开时按策略压栈
const leftBottomUI = new GameUI(
    'strategy-left-bottom',
    makePanel({
        x: 20,
        y: 110,
        width: 200,
        height: 130,
        color: '#2f6fed',
        label: '底层 A'
    })
);
const leftTopUI = new GameUI(
    'strategy-left-top',
    makePanel({
        x: 70,
        y: 160,
        width: 200,
        height: 130,
        color: '#3a2f5f',
        label: '上层 B'
    })
);
const rightBottomUI = new GameUI(
    'strategy-right-bottom',
    makePanel({
        x: 260,
        y: 110,
        width: 200,
        height: 130,
        color: '#2f6fed',
        label: '底层 A'
    })
);
const rightTopUI = new GameUI(
    'strategy-right-top',
    makePanel({
        x: 310,
        y: 160,
        width: 200,
        height: 130,
        color: '#3a2f5f',
        label: '上层 B'
    })
);

const leftController = new UIController<IUIDefaultPropsBase>();
leftController.setPropsBaseCreator((instance, ctrl) => ({
    instance,
    controller: ctrl
}));
// 左边：只显示最后一个
leftController.lastOnly();

const rightController = new UIController<IUIDefaultPropsBase>();
rightController.setPropsBaseCreator((instance, ctrl) => ({
    instance,
    controller: ctrl
}));
// 右边：显示全部
rightController.showAll();

const LeftRenderer = defineComponent(() => {
    return () => leftController.render();
});

const RightRenderer = defineComponent(() => {
    return () => rightController.render();
});

export default defineComponent(() => {
    let leftBottom: IUIInstance | null = null;
    let leftTop: IUIInstance | null = null;
    let rightBottom: IUIInstance | null = null;
    let rightTop: IUIInstance | null = null;

    const leftCount = computed(() => leftController.stack.length);
    const rightCount = computed(() => rightController.stack.length);

    // 打开与关闭都直接调用对应控制器
    const openLeftBottom = () => {
        if (!leftBottom) {
            leftBottom = leftController.open(leftBottomUI, {});
        }
    };
    const openLeftTop = () => {
        if (!leftTop) {
            leftTop = leftController.open(leftTopUI, {});
        }
    };
    const openRightBottom = () => {
        if (!rightBottom) {
            rightBottom = rightController.open(rightBottomUI, {});
        }
    };
    const openRightTop = () => {
        if (!rightTop) {
            rightTop = rightController.open(rightTopUI, {});
        }
    };

    const closeLeft = () => {
        leftController.closeAll();
        leftBottom = null;
        leftTop = null;
    };
    const closeRight = () => {
        rightController.closeAll();
        rightBottom = null;
        rightTop = null;
    };

    onUnmounted(() => {
        leftController.closeAll();
        rightController.closeAll();
    });

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fill fillStyle="#141a22" />

            <text
                loc={[20, 16]}
                text="只显示最后一个（lastOnly）"
                fillStyle="#e8f0ff"
            />
            <container loc={[20, 44, 80, 32]} onClick={openLeftBottom}>
                <g-rect loc={[0, 0, 80, 32]} fill fillStyle="#2f6fed" />
                <text loc={[12, 8]} text="打开 A" fillStyle="#ffffff" />
            </container>
            <container loc={[110, 44, 80, 32]} onClick={openLeftTop}>
                <g-rect loc={[0, 0, 80, 32]} fill fillStyle="#3a2f5f" />
                <text loc={[12, 8]} text="打开 B" fillStyle="#ffffff" />
            </container>
            <container loc={[200, 44, 80, 32]} onClick={closeLeft}>
                <g-rect loc={[0, 0, 80, 32]} fill fillStyle="#7a3d3d" />
                <text loc={[12, 8]} text="清空" fillStyle="#ffffff" />
            </container>
            <text
                loc={[20, 84]}
                text={`栈长度：${leftCount.value}`}
                fillStyle="#8fb6ff"
            />

            <text
                loc={[260, 16]}
                text="显示全部（showAll）"
                fillStyle="#e8f0ff"
            />
            <container loc={[260, 44, 80, 32]} onClick={openRightBottom}>
                <g-rect loc={[0, 0, 80, 32]} fill fillStyle="#2f6fed" />
                <text loc={[12, 8]} text="打开 A" fillStyle="#ffffff" />
            </container>
            <container loc={[350, 44, 80, 32]} onClick={openRightTop}>
                <g-rect loc={[0, 0, 80, 32]} fill fillStyle="#3a2f5f" />
                <text loc={[12, 8]} text="打开 B" fillStyle="#ffffff" />
            </container>
            <container loc={[260, 76, 80, 32]} onClick={closeRight}>
                <g-rect loc={[0, 0, 80, 32]} fill fillStyle="#7a3d3d" />
                <text loc={[12, 8]} text="清空" fillStyle="#ffffff" />
            </container>
            <text
                loc={[360, 84]}
                text={`栈长度：${rightCount.value}`}
                fillStyle="#8fb6ff"
            />

            <LeftRenderer />
            <RightRenderer />
        </container>
    );
});
