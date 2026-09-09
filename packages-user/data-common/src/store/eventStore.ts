import { logger } from '@motajs/common';
import { IReadonlyGameEvent } from '../event';
import { IGameEventStore } from './types';

export class GameEventStore implements IGameEventStore {
    private readonly store: Map<
        string,
        IReadonlyGameEvent<Record<string, any>, Record<string, any>, any>
    > = new Map();

    addEvent(
        id: string,
        event: IReadonlyGameEvent<Record<string, any>, Record<string, any>, any>
    ): void {
        if (this.store.has(id)) {
            logger.warn(170, id);
        }
        this.store.set(id, event);
    }

    getEvent<
        P extends Record<string, any>,
        E extends Record<string, any>,
        R = void
    >(id: string): IReadonlyGameEvent<P, E, R> | null {
        return this.store.get(id) ?? null;
    }
}
