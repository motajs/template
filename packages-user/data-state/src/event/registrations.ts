import { BuiltInFunction } from '@motajs/anon-tokyo';
import { EventDeleteBlock, EventMoveBlock, EventSetBlock } from './map';
import { EventMoveHero, EventMoveHeroStep, EventTouchFront } from './hero';
import { EventInsertEvent, EventInsertEvents } from './event';

/**
 * 创建全部内建事件的注册项
 */
export function createEventRegistrations(): BuiltInFunction[] {
    return [
        // 地图控制
        new EventSetBlock(),
        new EventMoveBlock(),
        new EventDeleteBlock(),

        // 玩家控制
        new EventMoveHero(),
        new EventMoveHeroStep(),
        new EventTouchFront(),

        // 事件控制
        new EventInsertEvents(),
        new EventInsertEvent()
    ];
}
