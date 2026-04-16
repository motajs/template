import {
    IHeroAttribute,
    IHeroMover,
    IHeroState,
    IReadonlyHeroAttribute
} from './types';

export class HeroState<THero> implements IHeroState<THero> {
    constructor(
        public mover: IHeroMover,
        public attribute: IHeroAttribute<THero>
    ) {}

    attachMover(mover: IHeroMover): void {
        this.mover = mover;
    }

    attachAttribute(attribute: IHeroAttribute<THero>): void {
        this.attribute = attribute;
    }

    getHeroMover(): IHeroMover {
        return this.mover;
    }

    getModifiableAttribute(): IHeroAttribute<THero> {
        return this.attribute;
    }

    getAttribute(): IReadonlyHeroAttribute<THero> {
        return this.attribute;
    }

    getIsolatedAttribute(): IHeroAttribute<THero> {
        return this.attribute.clone();
    }
}
