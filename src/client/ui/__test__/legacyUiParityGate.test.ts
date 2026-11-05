import { describe, expect, it } from 'vitest';
import { adjustGrid } from '@user/client-base/layout/layout';
import enemyOneSource from '../enemyOne.tsx?raw';
import bookSource from '../book.tsx?raw';
import bookDetailSource from '../bookDetail.tsx?raw';
import toolboxSource from '../toolbox.tsx?raw';
import equipboxSource from '../equipbox.tsx?raw';
import hotkeySource from '../../misc/hotkey.ts?raw';

// 抹掉块注释、JSX 注释与行注释，避免说明性文字让否定断言假红
function stripComments(source: string): string {
    return source
        .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split(/\r?\n/)
        .map(line => line.replace(/\/\/.*$/, ''))
        .join('\n');
}

describe('09-42 旧版 UI 对齐源码闸门', () => {
    // EnemyOne 必须导出组件与三个共享辅助函数，并具备选中描边。
    it('exposes the reusable EnemyOne component and its helpers', () => {
        expect(enemyOneSource).toContain('export const EnemyOne');
        expect(enemyOneSource).toContain('export function getEnemyDamageData');
        expect(enemyOneSource).toContain('export function getDamageColor');
        expect(enemyOneSource).toContain('export function getSpecialSummary');
        expect(enemyOneSource).toContain('adjustGrid(180, 72, 56, 20, 4, 4)');
        expect(enemyOneSource).toContain('<icon');
        expect(enemyOneSource).toContain('fill={false}');
        expect(enemyOneSource).toContain('stroke');
        expect(enemyOneSource).toContain('strokeStyle');
        expect(enemyOneSource).toContain('selected');
        expect(enemyOneSource).toContain('onClick');
        expect(enemyOneSource).toContain('onHover');
    });

    // book 必须复用 EnemyOne，并补齐空状态、键盘、滚动与详情入口。
    it('reuses EnemyOne in the book list and wires the legacy interactions', () => {
        expect(bookSource).toContain('EnemyOne');
        expect(bookSource).toContain('getEnemyDamageData');
        expect(bookSource).toContain('getSpecialSummary');
        expect(bookSource).toContain('useKey');
        expect(bookSource).toContain('@ui/book-up');
        expect(bookSource).toContain('@ui/book-down');
        expect(bookSource).toContain('@ui/book-page-up');
        expect(bookSource).toContain('@ui/book-page-down');
        expect(bookSource).toContain('@common/confirm');
        expect(bookSource).toContain('@common/exit');
        expect(bookSource).toContain('ScrollExpose');
        expect(bookSource).toContain('scrollTo');
        expect(bookSource).toContain('本层无怪物');
        expect(bookSource).toContain('selected');
        expect(bookSource).toContain('openDetail');
    });

    // bookDetail 必须为单页三区结构，临界表固定 8 行并随 current 重算。
    it('renders the single-page detail with the critical table', () => {
        expect(bookDetailSource).toContain('EnemyOne');
        expect(bookDetailSource).toContain(
            'adjustGrid(548, 104, 260, 12, 20, 1)'
        );
        expect(bookDetailSource).toContain('criticlas');
        expect(bookDetailSource).toContain('加攻');
        expect(bookDetailSource).toContain('减伤');
        expect(bookDetailSource).toMatch(/CRITICAL_COUNT\s*=\s*8/);
        expect(bookDetailSource).toContain('TextContent');
        expect(bookDetailSource).toContain('@common/exit');
        expect(bookDetailSource).toContain('@common/confirm');
        expect(bookDetailSource).toContain('watch(current,');
        expect(bookDetailSource).toContain('{ immediate: true }');
        expect(bookDetailSource).toContain('getDamageSystem()');
        expect(bookDetailSource).toContain('无怪物数据');
        expect(bookDetailSource).toContain('locator');
    });

    // toolbox 必须具备双列表详情、使用流程、交叉导航与 mode/index 选择模型。
    it('implements the toolbox lists, usage flow and cross navigation', () => {
        expect(toolboxSource).toContain('EquipBoxUI');
        expect(toolboxSource).toContain('attributes');
        expect(toolboxSource).toContain('props.attributes ?? []');
        expect(toolboxSource).toContain('keep(');
        expect(toolboxSource).toContain('useItem');
        expect(toolboxSource).toContain('当前无法使用该道具');
        expect(toolboxSource).toContain('@ui/toolbox');
        expect(toolboxSource).toContain('@common/select-left');
        expect(toolboxSource).toContain('@common/select-right');
        expect(toolboxSource).toContain('@common/select-up');
        expect(toolboxSource).toContain('@common/select-down');
        expect(toolboxSource).toContain('@common/confirm');
        expect(toolboxSource).toContain('@common/exit');
        expect(toolboxSource).toContain('TextContent');
        expect(toolboxSource).toContain('装备栏');
        expect(toolboxSource).toContain('永久道具');
        expect(toolboxSource).toContain('消耗道具');
        expect(toolboxSource).toContain('点击该物品以使用');
        expect(toolboxSource).toContain("'consumable'");
        expect(toolboxSource).toContain('index = ref(0)');
        expect(toolboxSource).toContain(
            "mode.value === 'permanent' && i === index.value"
        );
        expect(toolboxSource).not.toContain('selected = ref(-1)');
    });

    // equipbox 只新增道具栏导航、跨槽拖拽与键盘关闭，保留现有布局。
    it('adds only the three equipbox behaviors without legacy layout', () => {
        expect(equipboxSource).toContain('ToolBoxUI');
        expect(equipboxSource).toContain('keep(');
        expect(equipboxSource).toContain('@common/exit');
        expect(equipboxSource).toContain('@ui/command');
        expect(equipboxSource).toContain('endPress');
        expect(equipboxSource).toContain('target');
        expect(equipboxSource).toContain('equip(');
        expect(equipboxSource).toContain('STATUS_WIDTH');
        expect(equipboxSource).toContain('OWNED_TOP');
    });

    // 热键命令必须存在且各声明一次，本计划不修改热键文件。
    it('declares each required hotkey command exactly once', () => {
        const commands = [
            '@ui/book-up',
            '@ui/book-down',
            '@ui/book-page-up',
            '@ui/book-page-down',
            '@ui/toolbox',
            '@common/confirm',
            '@common/exit'
        ];
        for (const command of commands) {
            const count = hotkeySource.split(command).length - 1;
            expect(count).toBe(1);
        }
    });

    // 共享排除项不得出现在五个 UI 源码中。
    it('keeps the shared exclusions out of the ui sources', () => {
        const uiSources = [
            enemyOneSource,
            bookSource,
            bookDetailSource,
            toolboxSource,
            equipboxSource
        ]
            .map(stripComments)
            .join('\n');
        expect(uiSources).not.toContain('isMobile');
        expect(uiSources).not.toContain('@media');
        expect(uiSources).not.toContain('window.innerWidth');
        expect(uiSources).not.toContain('innerHTML');
        expect(uiSources).not.toContain('v-html');
        expect(uiSources).not.toContain('!!html');
        expect(uiSources).not.toContain('chart.js');
        expect(uiSources).not.toContain('Slider');
        expect(uiSources).not.toContain('EnemyTarget');
        expect(uiSources).not.toContain('bookScale');
    });

    // adjustGrid 的 3×3 与临界表 8×2 数学结果必须与源码参数一致。
    it('computes the expected grid math for both layouts', () => {
        const stats = adjustGrid(180, 72, 56, 20, 4, 4);
        expect(stats.cols).toBe(3);
        expect(stats.rows).toBe(3);
        expect(stats.locs.length).toBe(9);

        const critical = adjustGrid(548, 104, 260, 12, 20, 1);
        expect(critical.cols).toBe(2);
        expect(critical.rows).toBe(8);
        expect(critical.locs.length).toBe(16);
    });
});
