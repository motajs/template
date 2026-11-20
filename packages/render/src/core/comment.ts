import { RenderItem, RenderItemDefaultHooks } from './item';
import { IRenderItemBaseHooks } from './types';

export class Comment extends RenderItem {
    readonly isComment: boolean = true;

    constructor() {
        super();
        this.hide();
        this.size(1, 1);
        this.pos(-1, -1);
        this.setZIndex(-Infinity);
        this.ignoreEvent(true);
    }

    protected getDefaultCache(): boolean {
        return false;
    }

    protected getDefaultHook(): IRenderItemBaseHooks {
        return new RenderItemDefaultHooks(this.events);
    }

    getBoundingRect(): DOMRectReadOnly {
        return new DOMRectReadOnly(0, 0, 0, 0);
    }

    protected render(): void {}

    show(): void {
        this.hide();
    }

    patchProp(): void {
        this.hide();
        this.setCacheEnabled(false);
        this.size(1, 1);
        this.pos(-1, -1);
        this.ignoreEvent(true);
        this.setZIndex(-Infinity);
    }
}
