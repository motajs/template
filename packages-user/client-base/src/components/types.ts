import { IUIController, IUIInstance } from '@motajs/system';
import { IGameUIPropsBase } from '../types';
import { TextboxProps } from './textbox';
import { TextContentTyper } from './textboxTyper';
import { ITextureManager } from '../material';

export interface ITextboxInfo {
    /** 文本框对应的 UI 实例 */
    readonly instance: IUIInstance;
    /** 打字机对象 */
    readonly typer: TextContentTyper;
}

export interface ITextboxManager {
    /** 使用的 UI 控制器 */
    readonly ui: IUIController<IGameUIPropsBase>;
    /** 使用的贴图素材管理器 */
    readonly materials: ITextureManager;

    /**
     * 创建一个新的文本框，如果代码已存在则会返回已存在的那个。`code` 越大，显示层级越高
     * @param code 文本框使用的代码，同时负责文本框的标识与 `zIndex` 排序
     * @param props 传递给 Textbox 的初始参数，填写 `typer` 将会覆盖默认使用的打字机对象，不填也可以通过 `getTextboxInfo` 获取
     */
    createTextbox(code: number, props?: TextboxProps): ITextboxInfo;

    /**
     * 删除指定代码对应的文本框
     * @param code 文本框使用的代码
     */
    deleteTextbox(code: number): void;

    /**
     * 删除所有文本框
     */
    deleteAllTextbox(): void;

    /**
     * 获取指定代码对应的文本框信息
     * @param code 文本框使用的代码
     */
    getTextboxInfo(code: number): ITextboxInfo | null;

    /**
     * 隐藏指定的文本框
     * @param code 文本框使用的代码
     */
    hideTextbox(code: number): void;

    /**
     * 显示指定的文本框
     * @param code 文本框使用的代码
     */
    showTextbox(code: number): void;

    /**
     * 隐藏所有文本框
     */
    hideAllTextbox(): void;

    /**
     * 显示所有文本框
     */
    showAllTextbox(): void;
}
