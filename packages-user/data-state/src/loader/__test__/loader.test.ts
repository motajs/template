// 测试 data-state loader：PrefixedJSONCProcessor 解析、DefaultDataLoaderHook 核心配置守卫与 MotaDataLoader 公开面
import { describe, expect, it, vi } from 'vitest';
import { ILoadTask, LoadDataType } from '@motajs/loader';
import { logger } from '@motajs/common';
import { PrefixedJSONCProcessor } from '../jsoncProcessor';
import { DefaultDataLoaderHook } from '../hook';
import { MotaDataLoader } from '../loader';

/** 与生产 loader 一致的 jsonc 前缀分隔串 */
const PREFIX = '// --- SYSTEM PREFIX END --- //';

/** 构造一个仅暴露 url 的最小加载任务桩 */
function createTaskStub(url: string): ILoadTask<LoadDataType.Text, unknown> {
    return { url } as never;
}

/** 构造一个按任务 url 返回带前缀 JSON 的加载启动器桩 */
function createStarter() {
    return {
        async start(request: { url: string }) {
            const identifier = request.url.split('/').pop();
            return {
                url: request.url,
                body: null,
                headers: { get: () => null },
                arrayBuffer: async () => new ArrayBuffer(0),
                blob: async () => new Blob(),
                bytes: async () => new Uint8Array(),
                json: async () => ({}),
                text: async () => `${PREFIX}${JSON.stringify({ identifier })}`
            };
        }
    };
}

/** 构造一个按需迭代任务 start() 的加载管理器桩 */
function createManager() {
    const tasks: ILoadTask[] = [];
    return {
        addTask(task: ILoadTask): void {
            tasks.push(task);
        },
        async *load(): AsyncIterable<number> {
            for (const task of [...tasks]) {
                for await (const loaded of task.start()) {
                    yield loaded;
                }
            }
        }
    };
}

describe('PrefixedJSONCProcessor', () => {
    // 验证携带合法前缀的响应会被解析为对象
    it('parses the payload after the prefix split', async () => {
        const processor = new PrefixedJSONCProcessor<{ a: number }>(PREFIX);

        await expect(
            processor.process(`${PREFIX}{"a":1}`, createTaskStub('x'))
        ).resolves.toEqual({ a: 1 });
    });

    // 验证响应缺少前缀分隔串时告警码 66 并返回空对象
    it('warns code 66 when the prefix split string is missing', () => {
        const processor = new PrefixedJSONCProcessor<unknown>(PREFIX);
        const result = logger.catch(() =>
            processor.process('no prefix at all', createTaskStub('core.jsonc'))
        );

        expect(result.info.map(info => info.code)).toContain(66);
    });

    // 验证前缀后的 JSON 无法解析时告警码 67 并返回空对象
    it('warns code 67 when the split payload is not valid json', () => {
        const processor = new PrefixedJSONCProcessor<unknown>(PREFIX);
        const result = logger.catch(() =>
            processor.process(
                `${PREFIX}{not json`,
                createTaskStub('core.jsonc')
            )
        );

        expect(result.info.map(info => info.code)).toContain(67);
    });
});

describe('DefaultDataLoaderHook', () => {
    // 验证核心配置缺失时告警码 69 且不追加任何额外配置
    it('warns code 69 when the core config is missing', async () => {
        const hook = new DefaultDataLoaderHook();
        const loader = { getConfig: () => null } as never;
        const result = logger.catch(() => hook.onCoreConfigLoaded(loader));

        await expect(result.ret).resolves.toBeUndefined();
        expect(result.info.map(info => info.code)).toContain(69);
    });

    // 验证核心配置存在时按目录与默认值追加全部额外配置
    it('adds every extra config declared by the core config', async () => {
        const hook = new DefaultDataLoaderHook();
        const addExtraConfig = vi.fn();
        const coreConfig = {
            content: {
                enemyDir: 'enemy',
                itemDir: 'item',
                mapListDir: 'map-list',
                tileDir: 'tile',
                defaults: {
                    enemyDefault: 'enemy-default',
                    itemDefault: 'item-default',
                    mapDefault: 'map-default',
                    tileDefault: 'tile-default'
                }
            }
        };
        const loader = {
            getConfig: (id: string) => (id === 'core' ? coreConfig : null),
            addExtraConfig
        } as never;

        await hook.onCoreConfigLoaded(loader);

        expect(addExtraConfig).toHaveBeenCalledWith('enemy', 'enemy');
        expect(addExtraConfig).toHaveBeenCalledWith('item', 'item');
        expect(addExtraConfig).toHaveBeenCalledWith('map-list', 'map-list');
        expect(addExtraConfig).toHaveBeenCalledWith('tile', 'tile');
        expect(addExtraConfig).toHaveBeenCalledWith(
            'enemy-default',
            'enemy-default'
        );
        expect(addExtraConfig).toHaveBeenCalledWith(
            'item-default',
            'item-default'
        );
        expect(addExtraConfig).toHaveBeenCalledWith(
            'map-default',
            'map-default'
        );
        expect(addExtraConfig).toHaveBeenCalledWith(
            'tile-default',
            'tile-default'
        );
    });
});

describe('MotaDataLoader', () => {
    // 验证加载器依次加载核心与额外配置、兑现 loaded 并暴露已加载配置
    it('loads core and extra configs, exposes them and resolves loaded', async () => {
        const loader = new MotaDataLoader(
            createManager() as never,
            createStarter() as never
        );
        const coreHook = vi.fn(async () => {});
        const extraHook = vi.fn(async () => {});
        loader.addHook({
            onCoreConfigLoaded: coreHook,
            onExtraConfigLoaded: extraHook
        });
        loader.addCoreConfig('core', 'core.jsonc');
        loader.addExtraConfig('enemy', 'enemy.jsonc');
        loader.addExtraConfig('item', 'item.jsonc');

        for await (const loaded of loader.start()) {
            expect(typeof loaded).toBe('number');
        }
        await loader.loaded();

        expect(coreHook).toHaveBeenCalledWith(loader);
        expect(extraHook).toHaveBeenCalledWith(loader);
        expect(loader.getConfig('enemy')).toEqual({
            identifier: 'enemy.jsonc'
        });
        expect(loader.getConfig('item')).toEqual({ identifier: 'item.jsonc' });
        expect(loader.getConfig('missing')).toBeNull();
    });
});
