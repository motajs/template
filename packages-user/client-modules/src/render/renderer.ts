import { MotaRenderer } from '@motajs/render';
import {
    MAIN_WIDTH,
    MAIN_HEIGHT,
    DEBUG_VARIATOR,
    VARIATOR_DEBUG_SPEED,
    DEBUG_DIVIDER,
    DIVIDER_DEBUG_DIVIDER
} from '../shared';
import { createRendererFor, RendererUsing } from '@motajs/render-vue';
import {
    ExcitationDivider,
    ExcitationVariator,
    RafExcitation
} from '@motajs/animate';

/** 渲染激励源 */
export const rafExcitation = new RafExcitation();
/** 渲染分频器 */
export const excitationDivider = new ExcitationDivider<number>();

if (DEBUG_VARIATOR) {
    const variator = new ExcitationVariator();
    variator.bindExcitation(rafExcitation);
    variator.setSpeed(VARIATOR_DEBUG_SPEED);
    excitationDivider.bindExcitation(variator);
} else {
    excitationDivider.bindExcitation(rafExcitation);
}

if (DEBUG_DIVIDER) {
    excitationDivider.setDivider(DIVIDER_DEBUG_DIVIDER);
}

export const mainRenderer = new MotaRenderer({
    canvas: '#render-main',
    width: MAIN_WIDTH,
    height: MAIN_HEIGHT,
    // 使用分频器，用户可以在设置中调整，如果设备性能较差调高分频有助于提高性能表现
    excitaion: excitationDivider
});

export const using = new RendererUsing(mainRenderer);

export const { createApp, render, tagManager } =
    createRendererFor(mainRenderer);
