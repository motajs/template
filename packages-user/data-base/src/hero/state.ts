import { HeroEquipment } from './equipment';
import { HeroItems } from './items';
import { HeroLocation } from './location';
import {
    IHeroAttribute,
    IHeroEquipment,
    IHeroItems,
    IHeroLocation,
    IHeroModifier,
    IHeroState,
    IHeroStateSave,
    IReadonlyHeroAttribute,
    IHeroChangeFloorInfo,
    IHeroStateHooks
} from './types';
import {
    FaceDirection,
    IDataCommon,
    IFacedTileLocator,
    SaveCompression
} from '@user/data-common';
import {
    Hookable,
    HookController,
    IHookController,
    IFaceHandler
} from '@motajs/common';

export class HeroState<THero>
    extends Hookable<IHeroStateHooks>
    implements IHeroState<THero>
{
    readonly location: IHeroLocation;
    readonly items: IHeroItems<THero>;
    readonly equip: IHeroEquipment<THero>;

    constructor(
        state: IDataCommon,
        faceHandler: IFaceHandler<FaceDirection>,
        public readonly attribute: IHeroAttribute<THero>
    ) {
        super();
        const defaultLoc: IFacedTileLocator = {
            x: 0,
            y: 0,
            direction: FaceDirection.Down
        };
        this.location = new HeroLocation(state, defaultLoc, faceHandler);
        this.items = new HeroItems(state);
        this.equip = new HeroEquipment(this.items.equipment, this.attribute);
    }

    protected createController(
        hook: Partial<IHeroStateHooks>
    ): IHookController<IHeroStateHooks> {
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
        this.attribute.registerModifier(type, cons);
    }

    createModifier<T, V>(type: string): IHeroModifier<T, V> | null {
        return this.attribute.createModifier<T, V>(type);
    }

    createAndInsertModifier<K extends keyof THero, V>(
        type: string,
        name: K
    ): IHeroModifier<THero[K], V> | null {
        return this.attribute.createAndInsertModifier<K, V>(type, name);
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
        return {
            attribute: this.attribute.saveState(compression),
            location: this.location.saveState(compression),
            items: this.items.saveState(compression),
            equip: this.equip.saveState(compression)
        };
    }

    loadState(
        state: IHeroStateSave<THero>,
        compression: SaveCompression
    ): void {
        // 属性原地读档：不替换实例，使装备与战斗侧持有的引用跨读档始终有效
        this.attribute.loadState(state.attribute, compression);
        this.location.loadState(state.location, compression);
        this.items.loadState(state.items, compression);
        this.equip.loadState(state.equip, compression);
    }
}
