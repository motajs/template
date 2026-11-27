import {
    IUIController,
    IUIDefaultPropsBase,
    UIController
} from '@motajs/system';
import { ITextboxInfo, ITextboxManager } from './types';
import { TextboxProps, TextboxUI } from './textbox';
import { TextContentTyper } from './textboxTyper';
import { ITextureManager } from '../material';

export class TextboxManager implements ITextboxManager {
    /** 文本框映射 */
    private readonly textboxMap: Map<number, ITextboxInfo> = new Map();

    readonly ui: IUIController<IUIDefaultPropsBase>;

    constructor(readonly materials: ITextureManager) {
        this.ui = new UIController();
        this.ui.setPropsBaseCreator((instance, controller) => ({
            instance,
            controller
        }));
        this.ui.showAll(false);
    }

    createTextbox(code: number, props?: TextboxProps): ITextboxInfo {
        const exist = this.textboxMap.get(code);
        if (exist) return exist;
        const typer =
            props?.typer ?? new TextContentTyper({ materials: this.materials });
        const instance = this.ui.open(
            TextboxUI,
            props ? { ...props, typer, zIndex: code } : { typer, zIndex: code }
        );
        const info: ITextboxInfo = {
            instance,
            typer
        };
        this.textboxMap.set(code, info);
        return info;
    }

    deleteTextbox(code: number): void {
        const info = this.textboxMap.get(code);
        if (!info) return;
        this.ui.close(info.instance);
        this.textboxMap.delete(code);
    }

    deleteAllTextbox(): void {
        this.ui.closeAll();
        this.textboxMap.clear();
    }

    getTextboxInfo(code: number): ITextboxInfo | null {
        return this.textboxMap.get(code) ?? null;
    }

    hideTextbox(code: number): void {
        const info = this.textboxMap.get(code);
        if (!info) return;
        info.instance.hide();
    }

    showTextbox(code: number): void {
        const info = this.textboxMap.get(code);
        if (!info) return;
        info.instance.show();
    }

    hideAllTextbox(): void {
        this.textboxMap.forEach(v => v.instance.hide());
    }

    showAllTextbox(): void {
        this.textboxMap.forEach(v => v.instance.show());
    }
}
