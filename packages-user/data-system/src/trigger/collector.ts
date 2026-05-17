import { IMapLayer } from '@user/data-base';
import {
    ITrigger,
    ITriggerCollection,
    ITriggerCollector,
    ITriggerRegistry
} from './types';
import { logger } from '@motajs/common';
import { TriggerCollection } from './collection';

export class TriggerCollector<
    TEnemy = unknown,
    THero = unknown
> implements ITriggerCollector<TEnemy, THero> {
    /** 当前收集器使用的注册对象 */
    private registry: ITriggerRegistry<TEnemy, THero> | null = null;

    collect(
        x: number,
        y: number,
        layer: IMapLayer
    ): ITriggerCollection<TEnemy, THero> {
        if (!this.registry) {
            logger.warn(135);
            return new TriggerCollection([]);
        }
        const staticType = layer.getTriggerType(x, y);
        const staticTrigger = this.registry.create(staticType);
        const dynamics = [...layer.dynamicLayer.getDynamicTilesAt(x, y)];

        if (dynamics.length === 0) {
            // 没有动态图块
            if (staticTrigger) {
                return new TriggerCollection([staticTrigger]);
            } else {
                return new TriggerCollection([]);
            }
        } else if (dynamics.length === 1) {
            // 一个动态图块，只需要进行一次额外判断即可
            const dynamic = dynamics[0];
            const dynamicTrigger = this.registry.create(dynamic.triggerType);
            // 直接穷举所有可能情况
            if (!staticTrigger && !dynamicTrigger) {
                return new TriggerCollection([]);
            } else if (staticTrigger && !dynamicTrigger) {
                return new TriggerCollection([staticTrigger]);
            } else if (!staticTrigger && dynamicTrigger) {
                return new TriggerCollection([dynamicTrigger]);
            } else {
                // 静态动态都有，则需要额外判断优先级，动态图层在前，因此包含等号
                if (dynamicTrigger!.priority >= staticTrigger!.priority) {
                    const arr = [dynamicTrigger!, staticTrigger!];
                    return new TriggerCollection(arr);
                } else {
                    const arr = [staticTrigger!, dynamicTrigger!];
                    return new TriggerCollection(arr);
                }
            }
        } else {
            // 动态图块大于两个，使用通用方案，记录重复触发器并抛出警告
            const usedPriority = new Set<number>();
            const duplicate = new Set<number>();
            if (staticTrigger) {
                // 有静态触发器
                const lessTriggers: ITrigger<TEnemy, THero>[] = [];
                const greaterTriggers: ITrigger<TEnemy, THero>[] = [];
                // 先收集所有的触发器，并记录重复情况
                for (const tile of layer.dynamicLayer.getDynamicTilesAt(x, y)) {
                    const trigger = this.registry.create(tile.triggerType);
                    if (trigger) {
                        if (usedPriority.has(trigger.priority)) {
                            duplicate.add(trigger.priority);
                        }
                        usedPriority.add(trigger.priority);

                        // 同优先级下动态在前，因此包含等号
                        if (trigger.priority >= staticTrigger.priority) {
                            greaterTriggers.push(trigger);
                        } else {
                            lessTriggers.push(trigger);
                        }
                    }
                }
                if (duplicate.size > 0) {
                    logger.warn(136, [...duplicate].join(','));
                }
                const arr = [
                    ...greaterTriggers.sort((a, b) => b.priority - a.priority),
                    staticTrigger,
                    ...lessTriggers.sort((a, b) => b.priority - a.priority)
                ];
                return new TriggerCollection(arr);
            } else {
                // 没有静态触发器
                const triggers: ITrigger<TEnemy, THero>[] = [];
                for (const tile of layer.dynamicLayer.getDynamicTilesAt(x, y)) {
                    const trigger = this.registry.create(tile.triggerType);
                    if (trigger) {
                        if (usedPriority.has(trigger.priority)) {
                            duplicate.add(trigger.priority);
                        }
                        usedPriority.add(trigger.priority);
                        triggers.push(trigger);
                    }
                }
                if (duplicate.size > 0) {
                    logger.warn(136, [...duplicate].join(','));
                }
                return new TriggerCollection(
                    triggers.sort((a, b) => b.priority - a.priority)
                );
            }
        }
    }

    attachRegistry(registry: ITriggerRegistry<TEnemy, THero> | null): void {
        this.registry = registry;
    }
}
