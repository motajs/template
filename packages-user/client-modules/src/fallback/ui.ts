import { Patch, PatchClass } from '@motajs/legacy-common';
import { TipStore } from '@user/client-base';

export function patchUI() {
    const patch = new Patch(PatchClass.UI);

    patch.add('drawTip', function (text, id) {
        const tip = TipStore.get('main-tip');
        tip?.drawTip(text, id);
    });
}
