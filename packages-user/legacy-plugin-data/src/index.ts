import { loading } from '@user/data-base';
import { initFallback } from './fallback';
import { initFiveLayer } from './fiveLayer';
import { createHook } from './hook';
import { initReplay } from './replay';

export function createLegacy() {
    initFallback();
    loading.once('coreInit', () => {
        initFiveLayer();
        createHook();
        initReplay();
    });
}

export * from './fallback';
export * from './fiveLayer';
export * from './replay';
export * from './shop';
