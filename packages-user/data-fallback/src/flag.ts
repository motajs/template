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
        logger.warn(56, 'core.setFlag', 'state.flags.setFieldValue');
        if (value === null || value === undefined) {
            flags.deleteField(name);
        } else {
            flags.setFieldValue(name, value);
        }
    });
    patch.add('getFlag', <T>(name: string, defaultValue?: T) => {
        logger.warn(56, 'core.getFlag', 'state.flags.getFieldValueDefaults');
        if (defaultValue === undefined) {
            return flags.getFieldValue<T>(name);
        } else {
            return flags.getFieldValueDefaults(name, defaultValue);
        }
    });
    patch.add('addFlag', (name, value) => {
        logger.warn(56, 'core.addFlag', 'state.flags.addFieldValue');
        if (typeof value !== 'number') return;
        flags.addFieldValue(name, value);
    });
    patch.add('hasFlag', name => {
        logger.warn(56, 'core.hasFlag', 'state.flags.occupied');
        return flags.occupied(name);
    });
    patch.add('removeFlag', name => {
        logger.warn(56, 'core.removeFlag', 'state.flags.deleteField');
        flags.deleteField(name);
    });

    const switchName = (
        x?: number,
        y?: number,
        floorId?: string,
        name?: string
    ) => {
        return (
            (floorId ?? core.status.floorId ?? ':f') +
            '@' +
            (x ?? 'x') +
            '@' +
            (y ?? 'y') +
            '@' +
            name
        );
    };

    patch.add('getSwitch', (x, y, floorId, name, defaultValue) => {
        logger.warn(56, 'core.getSwitch', 'state.flags.getFieldValue');
        return flags.getFieldValueDefaults(
            switchName(x, y, floorId, name),
            defaultValue
        );
    });
    patch.add('setSwitch', (x, y, floorId, name, value) => {
        logger.warn(56, 'core.setSwitch', 'state.flags.setFieldValue');
        flags.setFieldValue(switchName(x, y, floorId, name), value);
    });
    patch.add('addSwitch', (x, y, floorId, name, value) => {
        logger.warn(56, 'core.addSwitch', 'state.flags.addFieldValue');
        flags.addFieldValue(switchName(x, y, floorId, name), value ?? 0);
    });
    patch.add('hasSwitch', (x, y, floorId, name) => {
        logger.warn(56, 'core.hasSwitch', 'state.flags.occupied');
        return flags.occupied(switchName(x, y, floorId, name));
    });
    patch.add('removeSwitch', (x, y, floorId, name) => {
        logger.warn(56, 'core.removeSwitch', 'state.flags.deleteField');
        flags.deleteField(switchName(x, y, floorId, name));
    });
}
