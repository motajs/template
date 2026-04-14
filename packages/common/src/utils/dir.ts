import {
    IDirectionDescriptor,
    IDirectionMapper,
    InternalDirectionGroup
} from './types';

export class DirectionMapper implements IDirectionMapper {
    private readonly groups: Map<number, IDirectionDescriptor[]> = new Map();

    constructor() {
        this.registerGroup(InternalDirectionGroup.Dir4, [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ]);
        this.registerGroup(InternalDirectionGroup.Dir8, [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: -1, y: -1 },
            { x: 1, y: -1 },
            { x: -1, y: 1 },
            { x: 1, y: 1 }
        ]);
    }

    registerGroup(group: number, dir: Iterable<IDirectionDescriptor>): void {
        this.groups.set(group, [...dir]);
    }

    map(group: number): Iterable<IDirectionDescriptor> {
        return this.groups.get(group) ?? [];
    }
}
