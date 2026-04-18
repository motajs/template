import { logger } from '@motajs/common';
import { Patch, PatchClass } from '@motajs/legacy-common';
import { ICoreState } from '@user/data-state';

/**
 * Flag 系统 patch
 */
export function patchFlags(state: ICoreState) {
    const patch = new Patch(PatchClass.Control);
    const flags = state.flags;
    patch.add('setFlag', (name, value) => {
        logger.warn(56, 'core.setFlag', 'IFlagSystem');
        if (value === null || value === undefined) {
            flags.deleteField(name);
        } else {
            flags.setFieldValue(name, value);
        }
    });
    patch.add('getFlag', <T>(name: string, defaultValue?: T) => {
        logger.warn(56, 'core.getFlag', 'IFlagSystem');
        if (defaultValue === undefined) {
            return flags.getFieldValue<T>(name);
        } else {
            return flags.getFieldValueDefaults(name, defaultValue);
        }
    });
    patch.add('addFlag', (name, value) => {
        logger.warn(56, 'core.addFlag', 'IFlagSystem');
        if (typeof value !== 'number') return;
        flags.addFieldValue(name, value);
    });
    patch.add('hasFlag', name => {
        return flags.occupied(name);
    });
    patch.add('removeFlag', name => {
        flags.deleteField(name);
    });
}
