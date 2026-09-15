import { ICoreState } from '@user/data-state';
import { patchFlags } from './flag';
import { patchHero } from './hero';

export function patchAll(state: ICoreState) {
    patchFlags(state);
    patchHero(state);
}
