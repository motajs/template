import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { classifyCycle, isInScope, FixtureName } from './check-data-circular';

const pnpmCommand = 'pnpm';

function runFixture(fixture: FixtureName) {
    return spawnSync(
        pnpmCommand,
        ['exec', 'tsx', 'script/check-data-circular.ts', '--fixture', fixture],
        {
            cwd: process.cwd(),
            encoding: 'utf8',
            shell: process.platform === 'win32'
        }
    );
}

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

    // 仅客户端兼容路径以及 legacy/client 混合路径仍属于兼容性排除
    it('classifies client-only and legacy-client cycles as outside scope', () => {
        const clientCycle = [
            'packages-user/client-modules/map.ts',
            'packages-user\\client-modules\\render.ts'
        ];
        const mixedCompatibilityCycle = [
            'packages-user/data-state/src/legacy/move.ts',
            'packages-user/client-modules/render.ts'
        ];

        expect(classifyCycle(clientCycle).compatibilityOnly).toBe(true);
        expect(isInScope(clientCycle)).toBe(false);
        expect(classifyCycle(mixedCompatibilityCycle).compatibilityOnly).toBe(
            true
        );
        expect(isInScope(mixedCompatibilityCycle)).toBe(false);
    });

    // 触及 data-state 或 data-base 的 legacy 混合 cycle 必须留在门禁范围内
    it('keeps legacy-data cycles in scope', () => {
        const legacyDataCycle = [
            'packages-user/data-state/src/legacy/move.ts',
            'packages-user\\data-base\\src\\hero\\state.ts'
        ];
        const legacyStateCycle = [
            'packages-user/data-state/src/legacy/move.ts',
            'packages-user/data-state/src/map/state.ts'
        ];

        expect(classifyCycle(legacyDataCycle).compatibilityOnly).toBe(false);
        expect(isInScope(legacyDataCycle)).toBe(true);
        expect(isInScope(legacyStateCycle)).toBe(true);
    });

    // 触及 common 或 transitive common 的 legacy 混合 cycle 必须失败
    it('keeps legacy-common and approved boundary cycles in scope', () => {
        const legacyCommonCycle = [
            'packages-user/data-state/src/legacy/move.ts',
            'packages/common/src/utils/types.ts'
        ];
        const commonDataCycle = [
            'packages/common/src/utils/types.ts',
            'packages-user/data-common/src/common/types.ts'
        ];
        const dataOnlyCycle = [
            'packages-user/data-system/src/system.ts',
            'packages-user/data-state/src/core.ts'
        ];

        expect(isInScope(legacyCommonCycle)).toBe(true);
        expect(isInScope(commonDataCycle)).toBe(true);
        expect(isInScope(dataOnlyCycle)).toBe(true);
    });

    // 真实脚本进程必须按兼容性排除和混合边界返回对应退出状态
    it('uses the real fixture process for pass and fail exit statuses', () => {
        const cases: readonly [FixtureName, number, string][] = [
            ['legacy-only', 0, 'OUTSIDE-SCOPE CYCLE'],
            ['client-only', 0, 'OUTSIDE-SCOPE CYCLE'],
            ['legacy-data', 1, 'IN-SCOPE CYCLE'],
            ['legacy-common', 1, 'IN-SCOPE CYCLE']
        ];

        for (const [fixture, expectedStatus, expectedReport] of cases) {
            const result = runFixture(fixture);
            expect(result.error).toBeUndefined();
            expect(result.status).toBe(expectedStatus);
            expect(`${result.stdout}${result.stderr}`).toContain(
                expectedReport
            );
            if (expectedStatus !== 0) {
                expect(`${result.stdout}${result.stderr}`).toContain(
                    'Circular gate failed'
                );
            }
        }
    });
});
