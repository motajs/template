import { ERenderItemEvent, IRenderItem, IRenderTreeRoot } from '@motajs/render';
import { onMounted, onUnmounted } from 'vue';
import EventEmitter from 'eventemitter3';
import { IRendererUsing } from './types';
import {
    IExcitable,
    IAnimater,
    ITransition,
    Animater,
    IExcitation,
    Transition,
    excited
} from '@motajs/animate';

export class RendererUsing implements IRendererUsing {
    constructor(readonly renderer: IRenderTreeRoot) {}

    onExcited(excitable: IExcitable<number>): void {
        onMounted(() => {
            this.renderer.excitation.add(excitable);
        });
        onUnmounted(() => {
            this.renderer.excitation.remove(excitable);
        });
    }

    onExcitedFunc(fn: (payload: number) => void): void {
        this.onExcited(excited(fn));
    }

    listenEvent<
        T extends ERenderItemEvent,
        K extends EventEmitter.EventNames<T>
    >(
        item: IRenderItem,
        key: K,
        listener: EventEmitter.EventListener<T, K>
    ): void {
        item.on(key, listener);
        onUnmounted(() => {
            item.off(key, listener);
        });
    }

    useAnimater(excitation: IExcitation<number>): IAnimater {
        const anim = new Animater();
        onMounted(() => {
            anim.bindExcitation(excitation);
        });
        onUnmounted(() => {
            anim.unbindExcitation();
        });
        return anim;
    }

    useTransition(excitation: IExcitation<number>): ITransition {
        const tran = new Transition();
        onMounted(() => {
            tran.bindExcitation(excitation);
        });
        onUnmounted(() => {
            tran.unbindExcitation();
        });
        return tran;
    }
}
