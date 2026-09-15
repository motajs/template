import { describe, expect, it } from 'vitest';
import { SaveCompression } from '@user/data-common';
import { createCoreState } from '../src/core';

describe('Node CoreState factory', () => {
    // 验证无参数工厂创建的状态实例不会共享勇士、地图、事件存储和存档系统
    it('creates independent mutable data-side instances', () => {
        const first = createCoreState();
        const second = createCoreState();

        expect(first).not.toBe(second);
        expect(first.hero).not.toBe(second.hero);
        expect(first.hero.attribute).not.toBe(second.hero.attribute);
        expect(first.eventStore).not.toBe(second.eventStore);
        expect(first.saveSystem).not.toBe(second.saveSystem);

        first.hero.getModifiableAttribute().set('hp', 99);
        expect(second.hero.attribute.getFinalAttribute('hp')).not.toBe(99);

        const map = first.maps.createMap('isolated-floor', 1, 1);
        map.setActiveStatus(true);
        const layer = map.addLayer();
        layer.setMapRef(new Uint32Array([7]));
        expect(second.maps.getMap('isolated-floor')).toBeNull();

        const saved = first.maps.saveState(SaveCompression.NoCompression);
        const savedFloor = saved.floors.get('isolated-floor');
        const savedLayer = savedFloor?.layers.get(0);
        if (!savedLayer?.fullMap)
            throw new Error('missing isolated map snapshot');
        savedLayer.fullMap[0] = 99;
        expect(layer.getBlock(0, 0)).toBe(7);
    });

    // 验证 Node 工厂路径不读取浏览器宿主并使用现有独立存档实现
    it('constructs through the Node-safe path without browser globals', () => {
        expect(() => createCoreState()).not.toThrow();
        const state = createCoreState();

        expect(state.saveSystem.constructor.name).toBe('SaveSystem');
        expect(state.maps).toBeDefined();
        expect(state.eventStore).toBeDefined();
    });
});
