import {
    IRenderAnimated,
    IRenderAnimatedHooks,
    IRenderTreeRoot
} from './types';
import { ITexture, ITextureAnimater, ITextureRenderable } from '../assets';
import { RenderItem, RenderItemDefaultHooks } from './item';
import { MotaOffscreenCanvas2D } from './canvas2d';

export class Animated<T>
    extends RenderItem<IRenderAnimatedHooks>
    implements IRenderAnimated<T>
{
    texture: ITexture | null = null;
    animater: ITextureAnimater<T> | null = null;
    interval: number = 50;
    cycled: boolean = false;
    paused: boolean = false;
    param: T | undefined = void 0;
    frame: number = 0;

    /** 当前时刻 */
    private currentTime: number = -1;
    /** 上一帧的时刻 */
    private lastFrameTime: number = -1;
    /** 当前的可渲染对象 */
    private current: ITextureRenderable | null = null;

    /** 动画生成器 */
    private gen: Generator<ITextureRenderable, void> | null = null;
    /** 委托 Excitation 的 id */
    private delegation: number = -1;

    constructor() {
        super();
        this.eventNames
            .add('onSetTexture')
            .add('onSetAnimater')
            .add('onAnimationEnd')
            .add('onFrame');
    }

    protected onConnected(root: IRenderTreeRoot): void {
        this.delegation = root.delegateExcitable(time => {
            this.currentTime = time;
            if (this.lastFrameTime === -1) {
                this.lastFrameTime = time;
            }
            if (this.paused || !this.gen) return;
            const dt = time - this.lastFrameTime;
            const nextFrames = Math.floor(dt / this.interval);
            if (!this.current || nextFrames >= 1) {
                let pass = this.current ? nextFrames : 1;
                for (let i = 0; i < pass; i++) {
                    const next = this.gen.next();
                    if (next.done) {
                        pass = i;
                        this.forEachHook(hook => hook.onAnimationEnd?.());
                        break;
                    }
                    this.current = next.value;
                }
                if (pass !== 0) {
                    this.frame += pass;
                    this.lastFrameTime = time;
                    this.forEachHook(hook => hook.onFrame?.(this.frame));
                    this.update();
                }
            }
        });
    }

    protected onDisconnected(prevRoot: IRenderTreeRoot): void {
        prevRoot.removeExcitable(this.delegation);
    }

    protected getDefaultCache(): boolean {
        return false;
    }

    protected getDefaultHook(): IRenderAnimatedHooks {
        return new AnimatedDefaultHooks(this.events);
    }

    protected render(canvas: MotaOffscreenCanvas2D): void {
        const ctx = canvas.ctx;
        if (!this.current) return;
        const { source, rect: r } = this.current;
        const { width, height } = this;
        ctx.drawImage(source, r.x, r.y, r.w, r.h, 0, 0, width, height);
    }

    /**
     * 执行动画执行器，获取动画序列生成器
     */
    private generate() {
        if (!this.animater || !this.texture) {
            this.gen = null;
            this.current = null;
            this.frame = 0;
            this.forEachHook(hook => hook.onFrame?.(this.frame));
            this.update();
            return;
        }
        if (this.cycled) {
            this.gen = this.animater.cycled(this.texture, this.param as T);
            this.lastFrameTime = this.currentTime;
        } else {
            this.gen = this.animater.once(this.texture, this.param as T);
            this.lastFrameTime = this.currentTime;
        }
        this.frame = 0;
        this.forEachHook(hook => hook.onFrame?.(this.frame));
        this.update();
    }

    setTexture(texture: ITexture | null): void {
        this.texture = texture;
        this.generate();
        this.forEachHook(hook => hook.onSetTexture?.(texture));
    }

    setInterval(interval: number): void {
        if (interval <= 0) {
            this.interval = 50;
        } else {
            this.interval = interval;
        }
    }

    setAnimater(animater: ITextureAnimater<T> | null): void {
        this.animater = animater;
        this.generate();
        this.forEachHook(hook => hook.onSetAnimater?.(animater));
    }

    setParam(param: T | undefined): void {
        this.param = param;
        this.generate();
    }

    pause(): void {
        this.paused = true;
    }

    resume(): void {
        this.paused = false;
        this.lastFrameTime = this.currentTime;
    }

    setCycled(cycled: boolean): void {
        this.cycled = cycled;
        this.generate();
    }
}

export class AnimatedDefaultHooks
    extends RenderItemDefaultHooks
    implements IRenderAnimatedHooks
{
    onSetTexture(texture: ITexture | null): void {
        this.list.get('onSetTexture')?.(texture);
    }

    onSetAnimater(animater: ITextureAnimater<unknown> | null): void {
        this.list.get('onSetAnimater')?.(animater);
    }

    onAnimationEnd(): void {
        this.list.get('onAnimationEnd')?.();
    }

    onFrame(frame: number): void {
        this.list.get('onFrame')?.(frame);
    }
}
