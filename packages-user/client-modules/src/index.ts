import { loading } from '@user/data-base';
import { patchAll } from './fallback';
import { createGameRenderer, createRender } from './render';

export function create() {
    patchAll();
    createRender();
    loading.once('coreInit', () => {
        createGameRenderer();
    });
}

export * from './action';
export * from './fallback';
export * from './render';

export * from './client';
export * from './core';
export * from './shared';
export * from './types';
