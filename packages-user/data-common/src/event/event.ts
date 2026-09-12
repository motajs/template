import {
    AnonTokyoInterpreter,
    AnonTokyoExecutable,
    Statement
} from 'anon-tokyo';
import { EventTrigger, IGameEvent } from './types';

export class GameEvent<
    P extends Record<string, any>,
    E extends Record<string, any>,
    R = void
> implements IGameEvent<P, E, R> {
    trigger: EventTrigger = EventTrigger.None;
    rawEvent: Statement[];
    compiled: AnonTokyoExecutable | null = null;

    constructor(
        readonly interpreter: AnonTokyoInterpreter,
        raw: Statement[]
    ) {
        this.rawEvent = raw;
    }

    compile(): AnonTokyoExecutable | null {
        this.compiled = this.interpreter.compile(this.rawEvent);
        return this.compiled;
    }

    execute(param: P, env: Record<string, any>): Promise<R> {
        if (this.compiled) {
            return this.compiled.exec(param, env) as Promise<R>;
        } else {
            const compiled = this.compile();
            if (compiled) {
                return compiled.exec(param, env) as Promise<R>;
            } else {
                return this.interpreter.exec(
                    this.rawEvent,
                    param,
                    env
                ) as Promise<R>;
            }
        }
    }

    setRaw(raw: Statement[]): void {
        this.rawEvent = raw;
        this.compiled = null;
    }

    setTrigger(trigger: EventTrigger): void {
        this.trigger = trigger;
    }
}
