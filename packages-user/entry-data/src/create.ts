import { Mota } from './mota';
import * as Common from '@motajs/common';
import * as LegacyCommon from '@motajs/legacy-common';
import * as DataCommon from '@user/data-common';
import * as DataBase from '@user/data-base';
import * as DataSystem from '@user/data-system';
import * as DataFallback from '@user/data-fallback';
import * as DataState from '@user/data-state';

export function create() {
    Mota.register('@motajs/common', Common);
    Mota.register('@motajs/legacy-common', LegacyCommon);
    Mota.register('@user/data-common', DataCommon);
    Mota.register('@user/data-base', DataBase);
    Mota.register('@user/data-system', DataSystem);
    Mota.register('@user/data-fallback', DataFallback);
    Mota.register('@user/data-state', DataState);

    DataBase.loading.emit('dataRegistered');
}
