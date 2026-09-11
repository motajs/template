import { BuiltInFunction } from 'anon-tokyo';

import { createControlEventBuiltinRegistrations } from './event';
import { createHeroEventBuiltinRegistrations } from './hero';
import { createMapEventBuiltinRegistrations } from './map';

/** 组装八个批准事件 built-in 的稳定注册项 */
export function createEventBuiltinRegistrations(): ReadonlyArray<BuiltInFunction> {
    return [
        ...createMapEventBuiltinRegistrations(),
        ...createHeroEventBuiltinRegistrations(),
        ...createControlEventBuiltinRegistrations()
    ];
}

export * from './event';
export * from './hero';
export * from './map';
export * from './types';
