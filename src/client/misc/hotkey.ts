import { KeyCode } from '@motajs/system';
import { IClientCore } from '@user/client-modules';

export function initializeHotkey(state: IClientCore) {
    const hotkey = state.hotkey;
    const system = hotkey.system;

    //#region 通用按键

    hotkey.setGroup('@system/common', [
        system.addCommand('ok', {
            priority: 0,
            defaults: [[KeyCode.Enter], [KeyCode.Space], [KeyCode.KeyC]]
        }),
        system.addCommand('exit', {
            priority: 0,
            defaults: [[KeyCode.Escape], [KeyCode.KeyX]]
        })
    ]);

    //#endregion
}
