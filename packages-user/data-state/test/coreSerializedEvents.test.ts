import { describe, expect, it } from 'vitest';
import { EventTrigger, SaveCompression } from '@user/data-common';
import { IBlockEventEnv, IBlockEventParam } from '@user/data-system';
import { createClosedLoopFixture } from './fixtures/closed-loop';

describe('CoreState serialized event loading', () => {
    // 验证序列化事件保留触发器与原始语句，并经原始地图绑定坐标事件 id
    it('registers serialized event data before binding map event ids', () => {
        const fixture = createClosedLoopFixture();
        const event = fixture.state.eventStore.getEvent<
            IBlockEventParam,
            IBlockEventEnv,
            void
        >(fixture.eventId);

        expect(event).not.toBeNull();
        if (!event) throw new Error('serialized event was not registered');
        expect(event.trigger).toBe(EventTrigger.OnEnter);
        expect(event.rawEvent).toBe(fixture.rawEvent);
        expect(fixture.eventLayer.getPointEvent(1, 0)).toEqual(
            new Map([[10, fixture.eventId]])
        );
    });

    // 验证固定录像只执行一次已注册事件并得到稳定的最终数据快照
    it('executes the registered event once through the replay path', async () => {
        const fixture = createClosedLoopFixture();
        const event = fixture.state.eventStore.getEvent<
            IBlockEventParam,
            IBlockEventEnv,
            void
        >(fixture.eventId);

        expect(event).not.toBeNull();
        if (!event) throw new Error('serialized event was not registered');
        const execute = event.execute.bind(event);
        let executionCount = 0;
        event.execute = async (param, env) => {
            executionCount++;
            await execute(param, env);
        };

        fixture.sandbox.play();
        await waitForEnded(fixture.sandbox);

        expect(executionCount).toBe(1);
        expect(fixture.eventCompleted()).toBe(true);
        expect(
            fixture.state.hero.saveState(SaveCompression.NoCompression).attribute
        ).toEqual(
            fixture.expected.hero
        );
        expect(fixture.eventLayer.getMapData()).toEqual(
            fixture.expected.maps[0].layers[2].matrix
        );
    });
});

async function waitForEnded(sandbox: {
    readonly ended: boolean;
}): Promise<void> {
    for (let index = 0; index < 1000 && !sandbox.ended; index++) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    if (!sandbox.ended) throw new Error('replay did not reach normal end');
}
