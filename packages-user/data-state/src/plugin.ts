//#region 插件排序接口

export interface IPluginDepends {
    /** 插件标识符 */
    readonly id: string;
    /** 插件所依赖的其他插件 id */
    readonly dependencies: readonly string[];
}

export interface IPluginHolder<T extends IPluginDepends> {
    /** 插件内容 */
    readonly plugin: T;
}

export interface IPluginOrderResult<T> {
    /** 可初始化的插件拓扑序 */
    readonly order: T[];
    /** 处于依赖环中的插件 id */
    readonly cyclic: Set<string>;
    /** 直接引用了不存在依赖的插件 id，与其缺失的依赖 id 列表 */
    readonly missing: Map<string, string[]>;
}

//#endregion

//#region 依赖排序

/**
 * 依据插件的依赖关系计算可初始化的拓扑序，并检测依赖环与不存在的依赖
 * @param plugins 以插件 id 为键的插件映射表
 */
export function orderPlugins<H extends IPluginHolder<IPluginDepends>>(
    plugins: ReadonlyMap<string, H>
): IPluginOrderResult<H> {
    const cyclic = new Set<string>();
    const missing = new Map<string, string[]>();

    // 依赖不存在检测：记录直接引用了不存在依赖的插件及其缺失的依赖
    for (const holder of plugins.values()) {
        const define = holder.plugin;
        const lacked: string[] = [];
        for (const dependency of define.dependencies) {
            if (!plugins.has(dependency)) {
                lacked.push(dependency);
            }
        }
        if (lacked.length > 0) {
            missing.set(define.id, lacked);
        }
    }

    // 环检测：从每个插件出发沿依赖边搜索，若能回到自身则其处于依赖环中
    for (const id of plugins.keys()) {
        const start = plugins.get(id)!;
        const visited = new Set<string>();
        const pending: string[] = [];
        for (const dependency of start.plugin.dependencies) {
            pending.push(dependency);
        }
        while (pending.length > 0) {
            const current = pending.pop()!;
            if (current === id) {
                cyclic.add(id);
                break;
            }
            if (visited.has(current)) continue;
            visited.add(current);
            const node = plugins.get(current);
            if (!node) continue;
            for (const dependency of node.plugin.dependencies) {
                pending.push(dependency);
            }
        }
    }

    // 被排除集合：环上插件、依赖不存在的插件，以及依赖它们的下游插件
    const blocked = new Set<string>();
    for (const id of cyclic) blocked.add(id);
    for (const id of missing.keys()) blocked.add(id);

    let expanded = true;
    while (expanded) {
        expanded = false;
        for (const holder of plugins.values()) {
            const define = holder.plugin;
            if (blocked.has(define.id)) continue;
            for (const dependency of define.dependencies) {
                if (blocked.has(dependency)) {
                    blocked.add(define.id);
                    expanded = true;
                    break;
                }
            }
        }
    }

    // 拓扑排序：反复扫描，逐轮输出依赖均已就绪的插件，保证依赖先于被依赖者
    const order: H[] = [];
    const emitted = new Set<string>();
    let progressed = true;
    while (progressed) {
        progressed = false;
        for (const holder of plugins.values()) {
            const define = holder.plugin;
            if (blocked.has(define.id) || emitted.has(define.id)) continue;
            let ready = true;
            for (const dependency of define.dependencies) {
                if (!emitted.has(dependency)) {
                    ready = false;
                    break;
                }
            }
            if (!ready) continue;
            order.push(holder);
            emitted.add(define.id);
            progressed = true;
        }
    }

    return { order, cyclic, missing };
}

//#endregion
