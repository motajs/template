import {
    HotkeySystem,
    IHotkeyCommand,
    IHotkeySystem,
    KeyCode
} from '@motajs/system';
import { IClientHotkey, IClientHotkeySave, IHotkeyCommandGroup } from './types';
import { logger } from '@motajs/common';

export class ClientHotkey implements IClientHotkey {
    system: IHotkeySystem = new HotkeySystem();

    /** 按键分组 */
    private readonly groups: Map<string, IHotkeyCommandGroup> = new Map();

    setGroup(group: string, name: string, commands: IHotkeyCommand[]): void {
        if (commands.length > 0) {
            if (this.groups.has(group)) {
                logger.warn(208, group);
            }
            this.groups.set(group, {
                name,
                commands
            });
        } else {
            this.groups.delete(group);
        }
    }

    addCommandToGroup(group: string, command: IHotkeyCommand): void {
        const obj = this.groups.get(group);
        if (!obj) return;
        if (obj.commands.includes(command)) {
            logger.warn(210, command.command, group);
            return;
        }
        obj.commands.push(command);
    }

    getGroup(group: string): IHotkeyCommandGroup | null {
        return this.groups.get(group) ?? null;
    }

    getUngrouped(): Iterable<IHotkeyCommand> {
        const grouped = new Set([...this.groups.values()].flat());
        return new Set([...this.system.iterateCommands()]).difference(grouped);
    }

    iterateGroups(): Iterable<[id: string, group: IHotkeyCommandGroup]> {
        return this.groups.entries();
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
