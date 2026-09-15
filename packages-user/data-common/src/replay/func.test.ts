// 测试 replay 播放安全收集装饰器的组合生命周期与其告警码
import { logger } from '@motajs/common';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import {
    beginReplaySafetyCollection,
    endReplaySafetyCollection,
    ignoreReplay,
    logReplaySafetyDetail,
    shouldReplay
} from './func';
import { ReplaySystem } from './system';

vi.hoisted(() => {
    vi.stubGlobal('main', { replayChecking: true });
    vi.stubGlobal('location', { origin: 'http://localhost' });
});

afterEach(() => {
    vi.restoreAllMocks();
});

afterAll(() => {
    vi.unstubAllGlobals();
});

// 构造 shouldReplay/ignoreReplay 需要的类方法上下文
function methodContext<This, Return>(
    name: string
): ClassMethodDecoratorContext<This, (this: This) => Return> {
    return { name } as ClassMethodDecoratorContext<
        This,
        (this: This) => Return
    >;
}

describe('replay safety collection', () => {
    // 验证 begin 后嵌套 decorated 调用被收集且 end 触发告警码 161 并输出简化详情
    it('collects nested decorated calls and warns code 161', () => {
        interface Fixture {
            inner(): void;
            outer(): void;
        }
        const inner = shouldReplay('inner')(function (
            this: Fixture
        ): void {}, methodContext<Fixture, void>('inner'));
        const outer = shouldReplay('outer')(function (this: Fixture): void {
            this.inner();
        }, methodContext<Fixture, void>('outer'));
        const fixture: Fixture = { inner, outer };
        const system = new ReplaySystem();
        const group = vi.spyOn(console, 'group').mockImplementation(() => {});
        const output = vi.spyOn(console, 'log').mockImplementation(() => {});

        const { info } = logger.catch(() => {
            beginReplaySafetyCollection(system);
            fixture.outer();
            fixture.inner();
            endReplaySafetyCollection();
        });

        const detail = info.find(v => v.code === 161);
        expect(detail).toBeDefined();
        expect(detail!.message).toContain('outer: outer');
        expect(detail!.message).toContain('inner: inner');

        const match = detail!.message.match(/logReplaySafetyDetail\((\d+)\)/);
        expect(match).not.toBeNull();
        const detailed = logger.catch(() =>
            logReplaySafetyDetail(Number(match![1]))
        );
        expect(detailed.info.map(v => v.code)).not.toContain(162);
        expect(group).toHaveBeenCalled();
        expect(output).toHaveBeenCalled();
    });

    // 验证已有收集进行时再次 begin 触发告警码 159
    it('warns code 159 when beginning during another collection', () => {
        const system = new ReplaySystem();

        const { info } = logger.catch(() => {
            beginReplaySafetyCollection(system);
            beginReplaySafetyCollection(system);
            endReplaySafetyCollection();
        });

        expect(info.map(v => v.code)).toContain(159);
    });

    // 验证收集外调用 end 触发告警码 160
    it('warns code 160 when ending outside a collection', () => {
        const { info } = logger.catch(() => endReplaySafetyCollection());

        expect(info.map(v => v.code)).toContain(160);
    });

    // 验证查询不存在的详情 code 触发告警码 162
    it('warns code 162 when the detail code is unknown', () => {
        const { info } = logger.catch(() => logReplaySafetyDetail(987654));

        expect(info.map(v => v.code)).toContain(162);
    });

    // 验证 ignoreReplay 跳过收集输出并在结束后完全重置生命周期
    it('skips the collection output when ignoreReplay ran', () => {
        interface Fixture {
            ignored(): void;
        }
        const ignored = ignoreReplay('async')(function (
            this: Fixture
        ): void {}, methodContext<Fixture, void>('ignored'));
        const fixture: Fixture = { ignored };
        const system = new ReplaySystem();

        const first = logger.catch(() => {
            beginReplaySafetyCollection(system);
            fixture.ignored();
            endReplaySafetyCollection();
        });
        expect(first.info.map(v => v.code)).not.toContain(161);

        const second = logger.catch(() => {
            beginReplaySafetyCollection(system);
            endReplaySafetyCollection();
        });
        expect(second.info.map(v => v.code)).not.toContain(159);
    });

    // 验证收集未开始时 shouldReplay 直接透传原方法的返回值
    it('passes through decorated calls when no collection is active', () => {
        interface Fixture {
            compute(): number;
        }
        const compute = shouldReplay('compute')(function (
            this: Fixture
        ): number {
            return 42;
        }, methodContext<Fixture, number>('compute'));
        const fixture: Fixture = { compute };

        expect(fixture.compute()).toBe(42);
    });
});
