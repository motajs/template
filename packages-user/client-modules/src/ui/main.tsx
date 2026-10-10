import {
    Font,
    IActionEvent,
    MotaOffscreenCanvas2D,
    CustomRenderItem
} from '@motajs/render';
// import { WeatherController } from '../weather';
import { defineComponent, ref } from 'vue';
import { Textbox, TextboxProps, Tip } from '@user/client-base';
import { GameUI, SetupComponentOptions } from '@motajs/system';
import {
    ENABLE_RIGHT_STATUS_BAR,
    MAIN_HEIGHT,
    MAIN_WIDTH,
    MAP_HEIGHT,
    MAP_WIDTH,
    RIGHT_STATUS_POS,
    STATUS_BAR_HEIGHT,
    STATUS_BAR_WIDTH
} from '../shared';
import { LeftStatusBar, RightStatusBar } from './statusBar';
import { state } from '@user/data-state';
import { mainUIController } from './controller';
import { isNil } from 'lodash-es';
import { using } from '../render/renderer';
import { IUIPropsBase } from './types';

interface MainSceneProps extends IUIPropsBase {}

const mainSceneProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<MainSceneProps>;

const MainScene = defineComponent<MainSceneProps>(props => {
    const mainMapRenderer = props.state.mainMapRenderer;
    const mainMapExtension = props.state.mainMapExtension;

    //#region 基本定义

    const mainTextboxProps: TextboxProps = {
        text: '',
        hidden: true,
        loc: [0, MAP_HEIGHT - 150, MAP_WIDTH, 150],
        zIndex: 30,
        fillStyle: '#fff',
        titleFill: 'gold',
        font: new Font('normal'),
        titleFont: new Font('normal', 20, 'px', 700),
        winskin: 'winskin.png',
        interval: 30,
        lineHeight: 4,
        width: MAP_WIDTH
    };

    const hideStatus = ref(
        props.state.flags.getFieldValueDefaults('hideStatusBar', false)
    );
    // TODO: flags 更新未接（当前无监听系统）
    // const weather = new WeatherController();
    // weather.extern('main');

    //#region sprite 渲染

    let lastLength = 0;
    using.onExcitedFunc(() => {
        const len = core.status.stepPostfix?.length ?? 0;
        if (len !== lastLength) {
            mapMiscSprite.value?.update();
            lastLength = len;
        }
    });

    const mapMiscSprite = ref<CustomRenderItem>();

    const renderMapMisc = (canvas: MotaOffscreenCanvas2D) => {
        const step = core.status.stepPostfix;
        if (!step) return;
        const ctx = canvas.ctx;
        ctx.fillStyle = '#fff';
        step.forEach(({ x, y, direction }) => {
            ctx.fillRect(x * 32 + 12, y * 32 + 12, 8, 8);
            if (!isNil(direction)) {
                switch (direction) {
                    case 'down':
                        ctx.fillRect(x * 32 + 12, y * 32 + 20, 8, 12);
                        break;
                    case 'left':
                        ctx.fillRect(x * 32, y * 32 + 12, 12, 8);
                        break;
                    case 'right':
                        ctx.fillRect(x * 32 + 20, y * 32 + 12, 12, 8);
                        break;
                    case 'up':
                        ctx.fillRect(x * 32 + 12, y * 32, 8, 12);
                        break;
                }
            }
        });
    };

    //#region 交互监听

    /**
     * 对于 registerAction 的 fallback
     */
    const clickMap = (ev: IActionEvent) => {
        const bx = Math.floor(ev.offsetX / 32);
        const by = Math.floor(ev.offsetY / 32);
        core.doRegisteredAction('onup', bx, by, ev.offsetX, ev.offsetY);
    };

    /**
     * 对于 registerAction 的 fallback
     */
    const downMap = (ev: IActionEvent) => {
        const bx = Math.floor(ev.offsetX / 32);
        const by = Math.floor(ev.offsetY / 32);
        core.doRegisteredAction('ondown', bx, by, ev.offsetX, ev.offsetY);
    };

    /**
     * 对于 registerAction 的 fallback
     */
    const moveMap = (ev: IActionEvent) => {
        const bx = Math.floor(ev.offsetX / 32);
        const by = Math.floor(ev.offsetY / 32);
        core.doRegisteredAction('onmove', bx, by, ev.offsetX, ev.offsetY);
    };

    return () => (
        <container
            id="main-scene"
            width={MAIN_WIDTH}
            height={MAIN_HEIGHT}
            noanti
            nocache
        >
            <LeftStatusBar
                loc={[0, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT]}
                hidden={hideStatus.value}
                state={props.state}
            ></LeftStatusBar>
            <g-line
                line={[STATUS_BAR_WIDTH, 0, STATUS_BAR_WIDTH, MAIN_HEIGHT]}
                lineWidth={1}
            />
            <container
                id="map-draw"
                loc={[STATUS_BAR_WIDTH, 0, MAP_WIDTH, MAP_HEIGHT]}
                zIndex={10}
                onClick={clickMap}
                onDown={downMap}
                onMove={moveMap}
                noanti
            >
                <map-render
                    renderer={mainMapRenderer}
                    // @ts-expect-error 需要重构
                    layerState={state.maps}
                    extension={mainMapExtension}
                    loc={[0, 0, MAP_WIDTH, MAP_HEIGHT]}
                />
                <Textbox id="main-textbox" {...mainTextboxProps}></Textbox>
                {/* <FloorChange id="floor-change" zIndex={50}></FloorChange> */}
                <Tip
                    id="main-tip"
                    zIndex={80}
                    loc={[8, 8, 200, 32]}
                    pad={[12, 6]}
                    corner={16}
                />
                <custom
                    noevent
                    loc={[0, 0, MAP_WIDTH, MAP_HEIGHT]}
                    ref={mapMiscSprite}
                    zIndex={170}
                    render={renderMapMisc}
                />
            </container>
            <g-line
                line={[RIGHT_STATUS_POS, 0, RIGHT_STATUS_POS, MAP_HEIGHT]}
                lineWidth={1}
            />
            <RightStatusBar
                loc={[RIGHT_STATUS_POS, 0, STATUS_BAR_WIDTH, STATUS_BAR_HEIGHT]}
                hidden={hideStatus.value && ENABLE_RIGHT_STATUS_BAR}
                state={props.state}
            ></RightStatusBar>
            <container
                loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
                hidden={!mainUIController.active.value}
                zIndex={200}
            >
                {mainUIController.render()}
            </container>
            <g-rect
                loc={[0, 0, MAIN_WIDTH, MAIN_HEIGHT]}
                hidden={hideStatus.value}
                zIndex={100}
                stroke
                noevent
            ></g-rect>
            <g-line
                line={[STATUS_BAR_WIDTH, 0, RIGHT_STATUS_POS, 0]}
                hidden={!hideStatus.value}
                zIndex={100}
            />
            <g-line
                line={[
                    STATUS_BAR_WIDTH,
                    MAP_HEIGHT,
                    RIGHT_STATUS_POS,
                    MAP_HEIGHT
                ]}
                hidden={!hideStatus.value}
                zIndex={100}
            />
        </container>
    );
}, mainSceneProps);

export const MainSceneUI = new GameUI('main-scene', MainScene);
