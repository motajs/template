import {
    ILoadManager,
    ILoadTask,
    ILoadTaskStarter,
    LoadDataType,
    LoadTask
} from '@motajs/loader';
import { IMotaDataLoader, IMotaDataLoaderHooks } from './types';
import { PrefixedJSONCProcessor } from './jsoncProcessor';
import { ICoreStateCoreConfig } from '../common';
import {
    Hookable,
    HookController,
    IHookController,
    logger
} from '@motajs/common';

export class MotaDataLoader
    extends Hookable<IMotaDataLoaderHooks>
    implements IMotaDataLoader
{
    /** 加载完毕时兑现的 `Promise` */
    private loadedPromise: Promise<void>;
    /** 调用以使 `loadedPromise` 兑现 */
    private loadResolve: () => void;
    /** 当前是否正在加载 */
    private loading: boolean = false;
    /** 当前是否已经加载完毕 */
    private dataLoaded: boolean = false;

    /** 额外配置对象的路径 */
    private extraConfigs: Map<string, string> = new Map();
    /** 配置文件列表 */
    private configMap: Map<string, any> = new Map();

    /** 自定义加载任务 */
    private customTask: Set<ILoadTask<LoadDataType, unknown>> = new Set();

    constructor(
        readonly manager: ILoadManager,
        readonly coreDir: string,
        readonly starter: ILoadTaskStarter
    ) {
        super();
        const { promise, resolve } = Promise.withResolvers<void>();
        this.loadedPromise = promise;
        this.loadResolve = resolve;
    }

    protected createController(
        hook: Partial<IMotaDataLoaderHooks>
    ): IHookController<IMotaDataLoaderHooks> {
        return new HookController(this, hook);
    }

    addExtraConfig(identifier: string, url: string): void {
        this.extraConfigs.set(identifier, url);
    }

    addCustomTask<T>(task: LoadTask<LoadDataType, T>): Promise<T> {
        this.customTask.add(task);
        return task.loaded();
    }

    /**
     * 解析加载路径，根据运行环境确认应当使用什么路径格式
     * @param url 加载路径
     */
    private resolveURL(url: string) {
        if (import.meta.env.DEV) {
            // 开发时 content 文件都在 src 文件夹下，因此前置 src
            return `${import.meta.env.BASE_URL}src/${url}`;
        } else {
            // 而构建后就会把文件移动至游戏根目录下，因此不需要前置 src
            return `${import.meta.env.BASE_URL}${url}`;
        }
    }

    async *start(): AsyncIterable<number> {
        if (this.loading || this.dataLoaded) return;

        // 首先加载核心配置
        const processor = new PrefixedJSONCProcessor<ICoreStateCoreConfig>(
            '// --- SYSTEM PREFIX END --- //'
        );
        const coreTask = new LoadTask<LoadDataType.Text, ICoreStateCoreConfig>({
            identifier: 'data-core-config',
            url: this.resolveURL(this.coreDir),
            dataType: LoadDataType.Text
        });
        coreTask.setProcessor(processor);
        coreTask.setStarter(this.starter);
        this.manager.addTask(coreTask);
        yield* this.manager.load();

        // 然后加载其他配置文件
        const coreConfig = await coreTask.loaded();
        this.configMap.set('core', coreConfig);
        await Promise.all(
            this.forEachHook(hook =>
                hook.onCoreConfigLoaded?.(coreConfig, this)
            )
        );

        for (const [id, url] of this.extraConfigs) {
            const task = new LoadTask({
                identifier: id,
                url: this.resolveURL(`content/${url}`),
                dataType: LoadDataType.Text
            });
            task.setProcessor(processor);
            task.setStarter(this.starter);
            this.manager.addTask(task);
            task.loaded().then(obj => {
                if (this.configMap.has(id)) {
                    logger.error(68, id);
                    return;
                }
                this.configMap.set(id, obj);
            });
        }

        yield* this.manager.load();

        await Promise.all(
            this.forEachHook(hook => hook.onExtraConfigLoaded?.(this))
        );

        for (const task of this.customTask) {
            this.manager.addTask(task);
        }

        yield* this.manager.load();

        this.loadResolve();
    }

    getConfig<T>(identifier: string): T | null {
        return this.configMap.get(identifier) ?? null;
    }

    loaded(): Promise<void> {
        return this.loadedPromise;
    }
}
