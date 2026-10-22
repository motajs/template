import {
    HotkeySystem,
    IHotkeyCommand,
    IHotkeySystem,
    KeyCode
} from '@motajs/system';
import { IClientHotkey, IClientHotkeySave } from './types';
import { logger } from '@motajs/common';

export class ClientHotkey implements IClientHotkey {
    system: IHotkeySystem = new HotkeySystem();

    /** 按键分组 */
    private readonly groups: Map<string, IHotkeyCommand[]> = new Map();

    setGroup(group: string, commands: IHotkeyCommand[]): void {
        if (commands.length > 0) {
            if (this.groups.has(group)) {
                logger.warn(208, group);
            }
            this.groups.set(group, commands);
        } else {
            this.groups.delete(group);
        }
    }

    getGroup(group: string): IHotkeyCommand[] {
        return this.groups.get(group) ?? [];
    }

    getUngrouped(): Iterable<IHotkeyCommand> {
        const grouped = new Set([...this.groups.values()].flat());
        return new Set([...this.system.iterateCommands()]).difference(grouped);
    }

    saveState(): IClientHotkeySave {
        const keys: Map<string, (readonly KeyCode[])[]> = new Map();
        for (const command of this.system.iterateCommands()) {
            const saveKeys: (readonly KeyCode[])[] = Array.from(
                { length: command.length },
                () => []
            );
            for (const [index, key] of command.iterateKeyCombinations()) {
                saveKeys[index] = key;
            }
            keys.set(command.command, saveKeys);
        }
        return {
            keys
        };
    }

    loadState(state: IClientHotkeySave): void {
        for (const [id, keys] of state.keys) {
            const command = this.system.getCommand(id);
            if (!command) {
                logger.warn(209, id);
                return;
            }
            command.setKeys(keys.length);
            keys.forEach((key, index) => {
                command.setKeyCombination(index, key);
            });
        }
    }
}
