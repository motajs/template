// 测试 GameEventStore 的 add/get、未知 ID 和重复 ID 告警覆盖
import { AnonTokyoInterpreter } from 'anon-tokyo';
import {
    afterAll,
    afterEach,
    beforeAll,
    describe,
    expect,
    it,
    vi
} from 'vitest';

interface TestModules {
    GameEvent: typeof import('@user/data-common').GameEvent;
    GameEventStore: typeof import('@user/data-common').GameEventStore;
    logger: typeof import('@motajs/common').logger;
}

let modules: TestModules;

beforeAll(async () => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
    const commonModule = await import('@user/data-common');
    const loggerModule = await import('@motajs/common');
    modules = {
        GameEvent: commonModule.GameEvent,
        GameEventStore: commonModule.GameEventStore,
        logger: loggerModule.logger
    };
});

afterEach(() => {
    vi.restoreAllMocks();
});

afterAll(() => {
    vi.unstubAllGlobals();
});

function createEvent() {
    const interpreter = new AnonTokyoInterpreter({
        builtInFunctions: [],
        globalFunctions: []
    });
    return new modules.GameEvent(interpreter, []);
}

describe('GameEventStore public barrel behavior', () => {
    // 验证使用注册时的 ID 可以取回同一个事件
    it('retrieves an event by the id used when adding it', () => {
        const store = new modules.GameEventStore();
        const event = createEvent();

        store.addEvent('event-id', event);

        expect(store.getEvent('event-id')).toBe(event);
    });

    // 验证查询不存在的事件 ID 返回 null
    it('returns null for an unknown id', () => {
        const store = new modules.GameEventStore();

        expect(store.getEvent('missing-id')).toBeNull();
    });

    // 验证重复 ID 会告警并由后写入事件覆盖旧事件
    it('warns and overwrites when an id is added twice', () => {
        const store = new modules.GameEventStore();
        const firstEvent = createEvent();
        const secondEvent = createEvent();
        const warning = vi.spyOn(modules.logger, 'warn');

        store.addEvent('duplicate-id', firstEvent);
        store.addEvent('duplicate-id', secondEvent);

        expect(warning).toHaveBeenCalledWith(170, 'duplicate-id');
        expect(store.getEvent('duplicate-id')).toBe(secondEvent);
    });
});
