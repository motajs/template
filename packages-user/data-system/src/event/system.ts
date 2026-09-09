import { IStateBase } from '@user/data-base';
import { IGameEventStore } from '@user/data-common';
import { AnonTokyoInterpreter } from 'anon-tokyo';
import { EventExecutor } from './executor';
import { IGameEventExecutor, IGameEventSystem } from './types';

export class GameEventSystem implements IGameEventSystem {
    readonly executor: IGameEventExecutor;
    store: IGameEventStore | null;

    constructor(readonly state: IStateBase) {
        this.store = state.eventStore;
        const interpreter = new AnonTokyoInterpreter({
            builtInFunctions: [],
            globalFunctions: []
        });
        this.executor = new EventExecutor(interpreter, () => this.store);
    }

    useStore(store: IGameEventStore | null): void {
        this.store = store;
    }
}
