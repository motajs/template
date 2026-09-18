import { Hookable, HookController, IHookController } from '@motajs/common';
import { IDataCommon } from '@user/data-common';
import {
    IHeroRendering,
    IHeroRenderingHooks,
    IHeroRenderingSave
} from './types';

export class HeroRendering
    extends Hookable<IHeroRenderingHooks>
    implements IHeroRendering
{
    alpha: number = 1;
    readonly state: IDataCommon;

    constructor(state: IDataCommon) {
        super();
        this.state = state;
    }

    protected createController(
        hook: Partial<IHeroRenderingHooks>
    ): IHookController<IHeroRenderingHooks> {
        return new HookController(this, hook);
    }

    setAlpha(alpha: number): void {
        this.alpha = alpha;
        this.forEachHook(hook => {
            hook.onSetAlpha?.(alpha);
        });
    }

    saveState(): IHeroRenderingSave {
        return { alpha: this.alpha };
    }

    loadState(state: IHeroRenderingSave): void {
        this.setAlpha(state.alpha);
    }
}
