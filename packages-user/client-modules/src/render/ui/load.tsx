import { DefaultProps } from '@motajs/render-vue';
import {
    GameUI,
    SetupComponentOptions,
    UIComponentProps
} from '@motajs/system';
import { defineComponent } from 'vue';
import {
    FULL_LOC,
    LOAD_BYTE_HEIGHT,
    LOAD_BYTE_LENGTH,
    LOAD_BYTE_LINE_WIDTH,
    LOAD_FONT_COLOR,
    LOAD_LOADED_COLOR,
    LOAD_TASK_CENTER_HEIGHT,
    LOAD_TASK_LINE_WIDTH,
    LOAD_TASK_RADIUS,
    LOAD_UNLOADED_COLOR,
    MAIN_WIDTH
} from '../shared';
import { ElementLocator, Font, MotaOffscreenCanvas2D } from '@motajs/render';
import { transitioned } from '../use';
import { cosh, CurveMode, linear } from '@motajs/animate';
import { loader } from '@user/client-base';
import { clamp } from 'lodash-es';
import { sleep } from '@motajs/common';
import { loading } from '@user/data-base';
import { GameTitleUI } from './title';

export interface ILoadProps extends UIComponentProps, DefaultProps {}

const loadSceneProps = {
    props: ['controller', 'instance']
} satisfies SetupComponentOptions<ILoadProps>;

export const LoadScene = defineComponent<ILoadProps>(props => {
    const taskFont = new Font('Verdana', 24);
    const byteFont = new Font('Verdana', 12);

    /** 当前加载进度 */
    const taskProgress = transitioned(0, 500, cosh(2, CurveMode.EaseOut))!;
    const byteProgress = transitioned(0, 500, cosh(2, CurveMode.EaseOut))!;
    const alpha = transitioned(1, 400, linear())!;

    // 两个进度条的位置
    const taskLoc: ElementLocator = [
        MAIN_WIDTH / 2,
        LOAD_TASK_CENTER_HEIGHT,
        LOAD_TASK_RADIUS * 2 + LOAD_TASK_LINE_WIDTH * 2,
        LOAD_TASK_RADIUS * 2 + LOAD_TASK_LINE_WIDTH * 2,
        0.5,
        0.5
    ];
    const byteLoc: ElementLocator = [
        MAIN_WIDTH / 2,
        LOAD_BYTE_HEIGHT,
        LOAD_BYTE_LENGTH + LOAD_BYTE_LINE_WIDTH,
        LOAD_BYTE_LINE_WIDTH * 2 + byteFont.size,
        0.5,
        0.5
    ];

    const loadEnd = async () => {
        loading.emit('loaded');
        alpha.set(0);
        await sleep(400);
        props.controller.closeAll();
        props.controller.open(GameTitleUI, {});
    };

    const startLoad = async () => {
        loader.initSystemLoadTask();
        loader.load().then(() => {
            loadEnd();
        });
        for await (const _ of loader.progress) {
            taskProgress.set(loader.progress.getLoadedTasks());
            byteProgress.set(loader.progress.getLoadedByte());
        }
    };

    // 开始加载
    startLoad();

    /** 渲染加载任务进度 */
    const renderTaskList = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        ctx.lineCap = 'round';
        ctx.lineWidth = LOAD_TASK_LINE_WIDTH;
        ctx.font = taskFont.string();
        const loaded = loader.progress.getLoadedTasks();
        const total = loader.progress.getAddedTasks();
        // 这里使用渐变参数，因为要有动画效果
        const progress = clamp(taskProgress.value / total, 0, 1);
        const cx = taskLoc[2]! / 2;
        const cy = taskLoc[3]! / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, LOAD_TASK_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = LOAD_UNLOADED_COLOR;
        ctx.stroke();
        ctx.beginPath();
        const end = progress * Math.PI * 2 - Math.PI / 2;
        ctx.arc(cx, cy, LOAD_TASK_RADIUS, -Math.PI / 2, end);
        ctx.strokeStyle = LOAD_LOADED_COLOR;
        ctx.stroke();
        ctx.fillStyle = LOAD_FONT_COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${loaded} / ${total}`, cx, cy + 3);
    };

    /** 渲染加载字节进度 */
    const renderByteList = (canvas: MotaOffscreenCanvas2D) => {
        const ctx = canvas.ctx;
        ctx.lineCap = 'round';
        ctx.lineWidth = LOAD_BYTE_LINE_WIDTH;
        ctx.font = byteFont.string();
        const total = loader.progress.getTotalByte();
        const loaded = loader.progress.getLoadedByte();
        // 这里使用渐变参数，因为要有动画效果
        const progress = clamp(byteProgress.value / total, 0, 1);
        const sx = LOAD_BYTE_LINE_WIDTH;
        const sy = byteFont.size + LOAD_BYTE_LINE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + LOAD_BYTE_LENGTH, sy);
        ctx.strokeStyle = LOAD_UNLOADED_COLOR;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + progress * LOAD_BYTE_LENGTH, sy);
        ctx.strokeStyle = LOAD_LOADED_COLOR;
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = LOAD_FONT_COLOR;
        const loadedMB = (loaded / 2 ** 20).toFixed(2);
        const totalMB = (total / 2 ** 20).toFixed(2);
        const percent = loader.progress.getByteRatio() * 100;
        ctx.fillText(
            `${loadedMB}MB / ${totalMB}MB | ${percent.toFixed(2)}%`,
            byteLoc[2]! - LOAD_BYTE_LINE_WIDTH,
            byteLoc[3]! - LOAD_BYTE_LINE_WIDTH * 2
        );
    };

    return () => (
        <container loc={FULL_LOC} alpha={alpha.ref.value}>
            <custom
                loc={taskLoc}
                render={renderTaskList}
                bindings={[taskProgress.ref]}
                nocache
            />
            <custom
                loc={byteLoc}
                render={renderByteList}
                bindings={[byteProgress.ref]}
                nocache
            />
        </container>
    );
}, loadSceneProps);

export const LoadSceneUI = new GameUI('load-scene', LoadScene);
