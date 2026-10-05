import { IGameUI, UIComponent } from './types';

export class GameUI<C extends UIComponent> implements IGameUI<C> {
    // TODO: 这个静态成员是否可以考虑删除？

    /** 当前的所有已声明 UI，用于全局性获取 */
    static list: Map<string, GameUI<UIComponent>> = new Map();

    constructor(
        public readonly name: string,
        public readonly component: C
    ) {}

    /**
     * 根据 ui 名称获取 ui 实例
     * @param id ui 的名称
     */
    static get<T extends UIComponent>(id: string): GameUI<T> | null {
        const ui = this.list.get(id) as GameUI<T>;
        return ui ?? null;
    }
}
