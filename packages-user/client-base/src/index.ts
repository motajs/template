import { loading } from '@user/data-base';
import { createMaterial, fallbackLoad } from './material';
import { materials } from './ins';

export function create() {
    createMaterial();
    loading.once('loaded', () => {
        fallbackLoad(materials);
        loading.emit('assetBuilt');
    });
}

export * from './load';
export * from './material';

export * from './ins';
