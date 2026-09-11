import { BuiltInFunction } from 'anon-tokyo';
import {
    DeleteBlockEventRegistration,
    MoveBlockEventRegistration,
    SetBlockEventRegistration
} from './map';
import {
    MoveHeroEventRegistration,
    MoveHeroStepEventRegistration,
    TouchFrontEventRegistration
} from './hero';
import {
    InsertEventEventRegistration,
    InsertEventsEventRegistration
} from './event';

/** 创建地图控制事件的内建函数注册项 */
export function createMapEventBuiltinRegistrations(): ReadonlyArray<BuiltInFunction> {
    return [
        new SetBlockEventRegistration(),
        new MoveBlockEventRegistration(),
        new DeleteBlockEventRegistration()
    ];
}

/** 创建勇士控制事件的内建函数注册项 */
export function createHeroEventBuiltinRegistrations(): ReadonlyArray<BuiltInFunction> {
    return [
        new MoveHeroEventRegistration(),
        new MoveHeroStepEventRegistration(),
        new TouchFrontEventRegistration()
    ];
}

/** 创建事件控制事件的内建函数注册项 */
export function createControlEventBuiltinRegistrations(): ReadonlyArray<BuiltInFunction> {
    return [
        new InsertEventsEventRegistration(),
        new InsertEventEventRegistration()
    ];
}

/** 组装八个批准事件 built-in 的稳定注册项 */
export function createEventBuiltinRegistrations(): ReadonlyArray<BuiltInFunction> {
    return [
        ...createMapEventBuiltinRegistrations(),
        ...createHeroEventBuiltinRegistrations(),
        ...createControlEventBuiltinRegistrations()
    ];
}
