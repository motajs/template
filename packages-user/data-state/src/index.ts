import { FaceDirection, loading } from '@user/data-base';
import { isNil } from 'lodash-es';
import { ICoreState } from './types';
import { state } from './ins';

function createCoreState(state: ICoreState) {
    //#region 图块部分

    const data = Object.entries(core.maps.blocksInfo);
    for (const [key, block] of data) {
        const num = Number(key);
        state.idNumberMap.set(block.id, num);
        state.numberIdMap.set(num, block.id);
    }

    for (const [key, block] of data) {
        if (!block.faceIds) continue;
        const { down, up, left, right } = block.faceIds;
        const downNum = state.idNumberMap.get(down);
        if (downNum !== Number(key)) continue;
        const upNum = state.idNumberMap.get(up);
        const leftNum = state.idNumberMap.get(left);
        const rightNum = state.idNumberMap.get(right);
        state.roleFace.malloc(downNum, FaceDirection.Down);
        if (!isNil(upNum)) {
            state.roleFace.bind(upNum, downNum, FaceDirection.Up);
        }
        if (!isNil(leftNum)) {
            state.roleFace.bind(leftNum, downNum, FaceDirection.Left);
        }
        if (!isNil(rightNum)) {
            state.roleFace.bind(rightNum, downNum, FaceDirection.Right);
        }
    }

    //#endregion
}

export function create() {
    loading.once('loaded', () => {
        // 加载后初始化全局状态
        createCoreState(state);
    });
}

export * from './enemy';
export * from './hero';
export * from './legacy';

export * from './core';
export * from './ins';
export * from './shared';
export * from './types';
