import { describe, expect, it } from 'vitest';
import { classifyCycle, isInScope } from './check-data-circular';

describe('circular gate scope classifier', () => {
    // 仅兼容路径组成的 legacy cycle 应被排除在门禁范围之外
    it('classifies a legacy-only cycle as outside scope', () => {
        const cycle = [
            'packages-user\\data-state\\src\\legacy\\move.ts',
            'packages-user/data-state/src/legacy/map.ts'
        ];

        expect(classifyCycle(cycle).compatibilityOnly).toBe(true);
        expect(isInScope(cycle)).toBe(false);
    });
});
