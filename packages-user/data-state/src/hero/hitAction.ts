import {
    IHeroHitAction,
    IHeroHitHandler,
    IMapStore,
    IStateBase
} from '@user/data-base';
import { ITriggerCollector, ITriggerHandler } from '@user/data-system';
import { isNil } from 'lodash-es';

export class DefaultHitAction implements IHeroHitAction {
    constructor(
        readonly maps: IMapStore,
        readonly collector: ITriggerCollector,
        readonly state: IStateBase
    ) {}

    async hit(handler: IHeroHitHandler): Promise<void> {
        if (isNil(handler.floorId)) return;

        const map = this.maps.getLayerState(handler.floorId);
        if (!map) return;
        const event = map.eventLayer;
        if (!event) return;

        const { x, y } = handler.nextLoc;
        const triggers = this.collector.collect(x, y, event);

        const triggerHandler: ITriggerHandler = {
            state: this.state,
            layer: map,
            mapLayer: event,
            locator: handler.nextLoc
        };

        return triggers.trigger(triggerHandler);
    }
}
