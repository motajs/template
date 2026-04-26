import { HeroAttribute } from './attribute';
import {
    IHeroAttribute,
    IHeroModifier,
    IHeroMover,
    IHeroState,
    IHeroStateSave,
    IModifierStateSave,
    IReadonlyHeroAttribute
} from './types';
import { SaveCompression } from '../common';
import { logger } from '@motajs/common';

export class HeroState<THero> implements IHeroState<THero> {
    /** 修饰器工厂函数注册表 */
    private readonly registry: Map<string, () => IHeroModifier> = new Map();

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
        return this.attribute.getModifiableClone();
    }

    registerModifier(type: string, cons: () => IHeroModifier): void {
        this.registry.set(type, cons);
    }

    createModifier<T, V>(type: string): IHeroModifier<T, V> | null {
        const cons = this.registry.get(type);
        if (!cons) {
            logger.warn(116, type);
            return null;
        } else {
            return cons() as IHeroModifier<T, V>;
        }
    }

    createAndInsertModifier<K extends keyof THero, V>(
        type: string,
        name: K
    ): IHeroModifier<THero[K], V> | null {
        const modifier = this.createModifier<THero[K], V>(type);
        if (!modifier) return null;
        this.attribute.addModifier(name, modifier);
        return modifier;
    }

    saveState(compression: SaveCompression): IHeroStateSave<THero> {
        const modifiers: IModifierStateSave[] = [];
        for (const [name, modifier] of this.attribute.iterateModifiers()) {
            modifiers.push({
                name,
                type: modifier.type,
                state: modifier.saveState(compression)
            });
        }
        return {
            attribute: this.attribute.toStructured(),
            locator: {
                x: this.mover.x,
                y: this.mover.y,
                direction: this.mover.direction
            },
            followers: structuredClone(this.mover.followers),
            modifiers
        };
    }

    loadState(
        state: IHeroStateSave<THero>,
        compression: SaveCompression
    ): void {
        const newAttribute = new HeroAttribute<THero>(state.attribute);
        for (const save of state.modifiers) {
            const cons = this.registry.get(save.type);
            if (!cons) continue;
            const modifier = cons();
            modifier.loadState(save.state as never, compression);
            newAttribute.addModifier(
                save.name as keyof THero,
                modifier as unknown as IHeroModifier<THero[keyof THero]>
            );
        }
        this.attribute = newAttribute;
        this.mover.setPosition(state.locator.x, state.locator.y);
        this.mover.turn(state.locator.direction);
        this.mover.removeAllFollowers();
        state.followers.forEach(follower => {
            this.mover.addFollower(follower.num, follower.identifier);
            this.mover.setFollowerAlpha(follower.identifier, follower.alpha);
        });
    }
}
