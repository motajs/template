import { describe, expect, it } from 'vitest';
import { createCoreState } from '../src/core';
import { createClosedLoopFixture } from './fixtures/closed-loop';

describe('Node replay tracer', () => {
    // 验证 Node 宿主无需浏览器全局即可创建相互独立的现有存档状态
    it('creates independent Node-safe CoreState instances', () => {
        const first = createCoreState();
        const second = createCoreState();

        expect(first).not.toBe(second);
        expect(first.saveSystem).not.toBe(second.saveSystem);
        expect(first.saveSystem.constructor.name).toBe('SaveSystem');
        expect(second.saveSystem.constructor.name).toBe('SaveSystem');
    });

    // 验证 replay 等待真实移动与事件完成后才结束并改变事件层矩阵
    it('replays movement, awaits event mutation, and ends normally', async () => {
        const fixture = createClosedLoopFixture();

        expect(fixture.eventLayer.getBlock(0, 0)).toBe(1);
        expect(fixture.eventLayer.getBlock(1, 0)).toBe(1);

        fixture.sandbox.play();
        await waitForEnded(fixture.sandbox);

        expect(fixture.sandbox.ended).toBe(true);
        expect(fixture.sandbox.getReplayed()).toBe(1);
        expect(fixture.state.hero.location.x).toBe(1);
        expect(fixture.state.hero.location.y).toBe(0);
        expect(fixture.eventCompleted()).toBe(true);
        expect(fixture.eventLayer.getBlock(1, 0)).toBe(2);
    });
});

async function waitForEnded(sandbox: {
    readonly ended: boolean;
}): Promise<void> {
    for (let index = 0; index < 100 && !sandbox.ended; index++) {
        await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    if (!sandbox.ended) {
        throw new Error('replay did not reach its end state');
    }
}
