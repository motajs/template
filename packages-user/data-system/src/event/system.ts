import { IStateBase } from '@user/data-base';
import { IGameEventStore } from '@user/data-common';
import { AnonTokyoInterpreter, BuiltInFunction } from 'anon-tokyo';
import { EventExecutor } from './executor';
import { IGameEventExecutor, IGameEventSystem } from './types';

export class GameEventSystem implements IGameEventSystem {
    readonly executor: IGameEventExecutor;
    store: IGameEventStore | null;

    constructor(
        readonly state: IStateBase,
        builtins: ReadonlyArray<BuiltInFunction> = []
    ) {
        this.store = state.eventStore;
        const interpreter = new AnonTokyoInterpreter({
            builtInFunctions: [...builtins],
            globalFunctions: []
        });
        this.executor = new EventExecutor(interpreter, () => this.store);
    }

    useStore(store: IGameEventStore | null): void {
        this.store = store;
    }
}
