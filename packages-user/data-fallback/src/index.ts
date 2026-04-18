import { ICoreState } from '@user/data-state';
import { patchBattle } from './battle';
import { patchDamage } from './damage';
import { patchFlags } from './flag';
import { patchHero } from './hero';

export function patchAll(state: ICoreState) {
    patchBattle();
    patchDamage();
    patchFlags(state);
    patchHero(state);
}
