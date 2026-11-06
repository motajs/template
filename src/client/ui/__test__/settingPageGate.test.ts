import { describe, expect, it } from 'vitest';
import settingSource from '../setting.tsx?raw';
import uiIndexSource from '../index.ts?raw';
import settingsSource from '../settings.tsx?raw';
import barrelSource from '../../../../packages-user/client-base/src/setting/index.ts?raw';
import systemSource from '../../../../packages-user/client-base/src/setting/system.ts?raw';
import factoriesSource from '../../../../packages-user/client-base/src/setting/factories.ts?raw';
import controlsSource from '../../../../packages-user/client-base/src/setting/controls.tsx?raw';

// 抹掉块注释、JSX 注释与行注释，避免说明性文字让否定断言假红
function stripComments(source: string): string {
    return source
        .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split(/\r?\n/)
        .map(line => line.replace(/\/\/.*$/, ''))
        .join('\n');
}

// 事件属性直接写行内匿名函数的形态
const INLINE_HANDLER = /on[A-Z][A-Za-z]*=\{\s*(\(|[A-Za-z_$][\w$]*\s*=>)/;
// 在 JSX 属性中直接展开多行 loc 数组的形态
const MULTILINE_LOC = /loc=\{\[\s*\r?\n/;

describe('设置页面源码闸门', () => {
    // 界面导出、props 声明与界面对象都必须存在
    it('declares the page props and exports the page ui', () => {
        const source = stripComments(settingSource);
        expect(source).toContain('SettingPageProps extends IGameUIPropsBase');
        expect(source).toContain('readonly system: ISettingSystem');
        expect(source).toContain('SettingPageUI');
        expect(source).toContain("new GameUI('setting-page'");
    });

    // 左栏使用 ListPage 并同时提供热键与内置关闭文本两条关闭路径
    it('uses ListPage and closes through the common exit command', () => {
        const source = stripComments(settingSource);
        expect(source).toMatch(/<ListPage[\s\S]*?close/);
        expect(source).toContain('closeLoc={CLOSE_LOC}');
        expect(source).toContain('onUpdate={selectGroup}');
        expect(source).toContain('onClose={exit}');
        expect(source).toContain('@common/exit');
        expect(settingSource).not.toContain('text="关闭"');
    });

    // 控件必须由设置项取得，并只接收设置项与控制器
    it('renders the setting component with setting and controller props', () => {
        const source = stripComments(settingSource);
        expect(source).toContain('getSettingComponent()');
        expect(source).toContain('setting={item}');
        expect(source).toContain('controller={props.controller}');
        expect(source).toContain('{{ default: renderGroup }}');
    });

    // 界面与控件都不得出现行内匿名事件处理函数
    it('uses named handlers instead of inline handlers', () => {
        expect(INLINE_HANDLER.test(stripComments(settingSource))).toBe(false);
        expect(INLINE_HANDLER.test(stripComments(controlsSource))).toBe(false);
    });

    // 界面与控件都不得在 JSX 属性中直接展开多行 loc 数组
    it('keeps multiline loc arrays out of jsx attributes', () => {
        expect(MULTILINE_LOC.test(settingSource)).toBe(false);
        expect(MULTILINE_LOC.test(controlsSource)).toBe(false);
    });

    // 界面层不得包含任何持久化与渲染端主对象设置字段
    it('keeps persistence and main object fields out of the page', () => {
        const source = stripComments(settingSource);
        for (const token of ['saveState', 'loadState', 'globalSetting']) {
            expect(source).not.toContain(token);
        }
        expect(source).not.toContain('gameSettings');
    });

    // client-base 的设置实现不得构造界面对象，也不得引用存档注册与主对象
    it('keeps ui object construction out of client-base', () => {
        for (const source of [systemSource, factoriesSource, controlsSource]) {
            expect(/new\s+GameUI\s*\(/.test(source)).toBe(false);
        }
        const system = stripComments(systemSource);
        expect(system).not.toContain('IClientBase');
        expect(system).not.toContain('addSaveableContent');
    });

    // 分层：控件只存在于 controls.tsx，界面文件不定义设置组件 props
    it('keeps control definitions inside the controls module', () => {
        expect(stripComments(systemSource)).not.toContain('defineComponent');
        expect(stripComments(factoriesSource)).not.toContain('defineComponent');
        expect(settingSource).not.toContain('interface ISettingComponentProps');
    });

    // 设置桶恰好导出四个同目录模块，界面未接入 UI 桶与设置菜单
    it('leaves the barrel and the settings entry untouched', () => {
        const barrel = stripComments(barrelSource)
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);
        expect(barrel).toEqual([
            "export * from './controls';",
            "export * from './factories';",
            "export * from './system';",
            "export * from './types';"
        ]);
        expect(uiIndexSource).not.toContain("'./setting'");
        expect(settingsSource).not.toContain('SettingPage');
    });

    // 工厂与预览的源码形状，替代因渲染依赖需要 DOM 而无法运行期测试的工厂测试
    it('declares the four factories with clamped numeric values', () => {
        const source = stripComments(factoriesSource);
        for (const token of [
            'export function defineNumberSetting',
            'export function defineBooleanSetting',
            'export function defineRangeSetting',
            'export function defineSubPageSetting',
            'implements ISettingItem<number>',
            'implements ISettingItem<boolean>',
            'implements ISettingItem<void>',
            'clampSettingValue',
            'Math.round',
            'Math.min',
            'Math.max',
            'toFixed(6)',
            'private readonly control',
            'shallowRef'
        ]) {
            expect(source).toContain(token);
        }
        expect(source).toContain("'开'");
        expect(source).toContain("'关'");
        expect(source).toContain('return void 0;');
    });

    // 四个控件创建函数与区间控件的拖拽事件、子页面打开调用必须存在
    it('declares the four controls with drag and page opening', () => {
        const source = stripComments(controlsSource);
        for (const token of [
            'createNumberSettingControl',
            'createBooleanSettingControl',
            'createRangeSettingControl',
            'createSubPageSettingControl',
            'onDown',
            'onMove',
            'onUp',
            '.open('
        ]) {
            expect(source).toContain(token);
        }
    });

    // 空系统只渲染一个空滚动区占位，并以显式渲染函数返回
    it('renders an empty scroll placeholder and an explicit render function', () => {
        const source = stripComments(settingSource);
        expect(source).toContain('<Scroll loc={CONTENT_SCROLL_LOC} />');
        expect(source).toContain('return () => renderPage();');
    });
});
