import { BuiltInFunction } from '@motajs/anon-tokyo';
import { EventRemoveBlock, EventMoveBlock, EventSetBlock } from './map';
import { EventMoveHero, EventStepHero } from './hero';
import { EventInsertEvent, EventInsertEvents } from './event';

/**
 * 创建全部内建事件的注册项
 */
export function createEventRegistrations(): BuiltInFunction[] {
    return [
        // 地图控制
        new EventSetBlock(),
        new EventMoveBlock(),
        new EventRemoveBlock(),

        // 玩家控制
        new EventMoveHero(),
        new EventStepHero(),

        // 事件控制
        new EventInsertEvents(),
        new EventInsertEvent()
    ];
}
