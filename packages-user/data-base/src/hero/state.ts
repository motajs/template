import { HeroAttribute } from './attribute';
import { HeroEquipment } from './equipment';
import { HeroFollowersController } from './follower';
import { HeroItems } from './items';
import { HeroLocation } from './location';
import { HeroRendering } from './rendering';
import {
    IHeroAttribute,
    IHeroFollowersController,
    IHeroEquipment,
    IHeroItems,
    IHeroLocation,
    IHeroModifier,
    IHeroRendering,
    IHeroState,
    IHeroStateSave,
    IModifierStateSave,
    IReadonlyHeroAttribute,
    IHeroChangeFloorInfo,
    IHeroStateHook
} from './types';
import {
    FaceDirection,
    IDataCommon,
    IFaceHandler,
    SaveCompression
} from '@user/data-common';
import {
    Hookable,
    HookController,
    IFacedTileLocator,
    IHookController,
    logger
} from '@motajs/common';

export class HeroState<THero>
    extends Hookable<IHeroStateHook>
    implements IHeroState<THero>
{
    /** 修饰器工厂函数注册表 */
    private readonly registry: Map<
        string,
        <K extends keyof THero>() => IHeroModifier<THero[K]>
    > = new Map();

    readonly location: IHeroLocation;
    readonly rendering: IHeroRendering;
    readonly followers: IHeroFollowersController;
    readonly items: IHeroItems<THero>;
    readonly equip: IHeroEquipment<THero>;

    constructor(
        state: IDataCommon,
        faceHandler: IFaceHandler<FaceDirection>,
        public attribute: IHeroAttribute<THero>
    ) {
        super();
        this.rendering = new HeroRendering(state);
        const defaultLoc: IFacedTileLocator = {
            x: 0,
            y: 0,
            direction: FaceDirection.Down
        };
        this.location = new HeroLocation(state, defaultLoc, faceHandler);
        this.followers = new HeroFollowersController(
            state,
            this.location,
            faceHandler
        );
        this.items = new HeroItems(state);
        this.equip = new HeroEquipment(this.items.equipment, this.attribute);
    }

    protected createController(
        hook: Partial<IHeroStateHook>
    ): IHookController<IHeroStateHook> {
        return new HookController(this, hook);
    }

    getLocation(): IFacedTileLocator {
        return {
            x: this.location.x,
            y: this.location.y,
            direction: this.location.mover.faceDirection
        };
    }

    //#region 属性相关

    attachAttribute(attribute: IHeroAttribute<THero>): void {
        this.attribute = attribute;
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

    registerModifier(
        type: string,
        cons: <K extends keyof THero>() => IHeroModifier<THero[K]>
    ): void {
        this.registry.set(type, cons);
    }

    createModifier<T, V>(type: string): IHeroModifier<T, V> | null {
        const cons = this.registry.get(type);
        if (!cons) {
            logger.warn(116, type);
            return null;
        }
        return cons() as IHeroModifier<T, V>;
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

    //#endregion

    async changeFloor(info: IHeroChangeFloorInfo): Promise<void> {
        await Promise.all(
            this.forEachHook(hook => hook.onBeforeChangeFloor?.(info))
        );
        const mover = this.location.mover;
        mover.setFaceDir(info.face);
        mover.setMoveDir(info.face);
        mover.setPos(info.x, info.y);
        this.location.setFloor(info.target);
        await Promise.all(
            this.forEachHook(hook => hook.onAfterChangeFloor?.(info))
        );
    }

    saveState(compression: SaveCompression): IHeroStateSave<THero> {
        const modifiers: IModifierStateSave<THero>[] = [];
        for (const [name, modifier] of this.attribute.iterateModifiers()) {
            if (!this.attribute.getModifierSaveEnabled(modifier)) continue;
            modifiers.push({
                name: name as keyof THero,
                type: modifier.type,
                state: modifier.saveState(compression)
            });
        }
        const followerSaves = this.followers
            .getAllFollowers()
            .map(v => v.saveState(compression));

        return {
            attribute: this.attribute.toStructured(),
            location: this.location.saveState(compression),
            rendering: this.rendering.saveState(compression),
            followers: followerSaves,
            modifiers,
            items: this.items.saveState(compression),
            equip: this.equip.saveState(compression)
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
            modifier.loadState(save.state, compression);
            newAttribute.addModifier(save.name, modifier);
        }
        this.attribute = newAttribute;
        this.location.loadState(state.location, compression);
        this.rendering.loadState(state.rendering, compression);
        this.items.loadState(state.items, compression);
        this.equip.loadState(state.equip, compression);
        void this.followers.removeAllFollowers();
        for (const save of state.followers) {
            const follower = this.followers.addFollower(save.num);
            follower.loadState(save, compression);
        }
    }
}
