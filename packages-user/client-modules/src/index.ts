import { patchAll } from './fallback';
import { createRender } from './render';

export function create() {
    patchAll();
    createRender();
}

export * from './action';
export * from './fallback';
export * from './render';

export * from './client';
export * from './core';
export * from './shared';
export * from './types';
