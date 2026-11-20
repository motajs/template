import { describe, expect, it } from 'vitest';
import inputBoxSource from '../inputBox.tsx?raw';
import waitBoxSource from '../waitBox.tsx?raw';
import backgroundSource from '../background.tsx?raw';
import choicesSource from '../choices.tsx?raw';
import saveSource from '../save.tsx?raw';
import settingsSource from '../settings.tsx?raw';
import titleSource from '../title.tsx?raw';
import viewMapSource from '../viewmap.tsx?raw';
import componentIndexSource from '../../../../packages-user/client-base/src/components/index.ts?raw';
import componentInputSource from '../../../../packages-user/client-base/src/components/input.tsx?raw';
import componentMiscSource from '../../../../packages-user/client-base/src/components/misc.tsx?raw';
import useHotkeySource from '../../../../packages-user/client-base/src/use/hotkey.ts?raw';
import hotkeyDeclSource from '../../misc/hotkey.ts?raw';

// 取出单条命令声明，从 system.addCommand('<id>' 到下一条命令或分组结束后
function getCommandBlock(source: string, id: string): string {
    const needle = `system.addCommand('${id}'`;
    const start = source.indexOf(needle);
    if (start < 0) return '';
    const next = source.indexOf('system.addCommand(', start + needle.length);
    const close = source.indexOf(']);', start);
    if (next < 0 && close < 0) return source.slice(start);
    if (next < 0) return source.slice(start, close);
    if (close < 0) return source.slice(start, next);
    return source.slice(start, Math.min(next, close));
}

// 取出单条按键实现，从 .implement('<id>' 到下一条 .implement( 之前
function getImplementBlock(source: string, id: string): string {
    const needle = `.implement('${id}'`;
    const start = source.indexOf(needle);
    if (start < 0) return '';
    const next = source.indexOf('.implement(', start + needle.length);
    return next < 0 ? source.slice(start) : source.slice(start, next);
}

// 取出源文件中的全部导入语句，用于只检查导入而不检查正文
const IMPORT_KEYWORD = 'im' + 'port ';

function getImportStatements(source: string): string[] {
    const lines = source.split(/\r?\n/);
    const statements: string[] = [];
    let current = '';
    for (const line of lines) {
        if (current === '') {
            if (!line.startsWith(IMPORT_KEYWORD)) continue;
            current = line;
        } else {
            current += '\n' + line;
        }
        if (line.trimEnd().endsWith("';")) {
            statements.push(current);
            current = '';
        }
    }
    return statements;
}

// 抹掉块注释、JSX 注释与行注释，避免说明性文字让否定断言假红
function stripLineComments(source: string): string {
    return source
        .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split(/\r?\n/)
        .map(line => line.replace(/\/\/.*$/, ''))
        .join('\n');
}

describe('按键适配源码闸门', () => {
    // 输入框组件已搬到新文件，命令由只绑 Enter 的 @ui/input-confirm 承担
    it('moves the input box family into src/client/ui/inputBox.tsx', () => {
        expect(inputBoxSource).toContain('export interface InputBoxProps');
        expect(inputBoxSource).toContain('export type InputBoxEmits');
        expect(inputBoxSource).toContain('export const InputBox');
        expect(inputBoxSource).toContain('export function getInput(');
        expect(inputBoxSource).toContain(
            'export async function getInputNumber('
        );
        expect(inputBoxSource).toContain('export const InputBoxUI');
        expect(inputBoxSource).toContain('IGameUIPropsBase');
        expect(inputBoxSource).toContain('onConfirm: (value: string)');
        expect(stripLineComments(inputBoxSource)).not.toContain(
            "from '@user/client-base'"
        );
        expect(stripLineComments(inputBoxSource)).toContain(
            'packages-user/client-base/src/'
        );
    });

    // 等待框组件已搬到新文件，并复用背景组件的参数类型
    it('moves the wait box family into src/client/ui/waitBox.tsx', () => {
        expect(waitBoxSource).toContain('export interface WaitBoxProps');
        expect(waitBoxSource).toContain('export type WaitBoxEmits');
        expect(waitBoxSource).toContain('export interface WaitBoxExpose');
        expect(waitBoxSource).toContain('export const WaitBox');
        expect(waitBoxSource).toContain('export function waitbox');
        expect(waitBoxSource).toContain('export const WaitBoxUI');
        expect(waitBoxSource).toContain('BackgroundProps');
        expect(waitBoxSource).toContain("from './background'");
        expect(waitBoxSource).toContain('onResolve: (data: T)');
        expect(stripLineComments(waitBoxSource)).not.toContain(
            "from '@user/client-base'"
        );
        expect(stripLineComments(waitBoxSource)).toContain(
            'packages-user/client-base/src/'
        );
    });

    // 背景组件并入既有文件，同时保留主界面背景，且尺寸常量来自叶子模块
    it('adds the background component next to the main background', () => {
        expect(backgroundSource).toContain('export interface BackgroundProps');
        expect(backgroundSource).toContain('export const Background');
        expect(backgroundSource).toContain('export const BackgroundUI');
        expect(backgroundSource).toContain('MainBackground');
        expect(backgroundSource).toContain('MainBackgroundUI');
        expect(backgroundSource).toContain('@/client/uiConstant');
        expect(stripLineComments(backgroundSource)).not.toContain(
            "from '@/client'"
        );
        expect(stripLineComments(backgroundSource)).not.toContain(
            "from '@user/client-base'"
        );
    });

    // 旧居所不再保留输入框一族，也不再使用旧按键 API
    it('trims the input box and old key handling out of client-base input', () => {
        const source = stripLineComments(componentInputSource);
        expect(source).not.toContain('export interface InputBoxProps');
        expect(source).not.toContain('export const InputBox');
        expect(source).not.toContain('export function getInput(');
        expect(source).not.toContain('export const InputBoxUI');
        expect(source).not.toContain('InputBoxProps');
        expect(source).not.toContain('useKey');
        expect(source).not.toContain('KeyCode');
        expect(source).not.toContain("from './misc'");
        expect(source).toContain('export const Input');
        expect(source).toContain('routedInputNumber');
    });

    // 旧居所不再保留背景与等待框两族，通用组件仍在
    it('trims the background and wait box families out of client-base misc', () => {
        const source = stripLineComments(componentMiscSource);
        expect(source).not.toContain('export interface BackgroundProps');
        expect(source).not.toContain('export const Background');
        expect(source).not.toContain('export interface WaitBoxProps');
        expect(source).not.toContain('export const WaitBox');
        expect(source).not.toContain('export function waitbox');
        expect(source).not.toContain('export const WaitBoxUI');
        expect(source).not.toContain('export const BackgroundUI');
        expect(source).not.toContain('logger.');
        expect(source).toContain('export const Selection');
        expect(source).toContain('export const ScrollText');
        expect(source).toContain('export const Arrow');
        expect(source).toContain('export const Progress');
    });

    // 公共导入面用相对路径再导出搬迁后的三个文件
    it('re-exports the three moved ui modules from the component barrel', () => {
        expect(componentIndexSource).toContain(
            "export * from '../../../../src/client/ui/background';"
        );
        expect(componentIndexSource).toContain(
            "export * from '../../../../src/client/ui/inputBox';"
        );
        expect(componentIndexSource).toContain(
            "export * from '../../../../src/client/ui/waitBox';"
        );
        expect(componentIndexSource).toContain(
            "export * from '../../../../src/client/ui/choices';"
        );
    });

    // 选择框改用通用选择命令，并从本地背景模块取得背景组件
    it('rewires choices to the common selection commands', () => {
        expect(choicesSource).toContain('@common/select-up');
        expect(choicesSource).toContain('@common/select-down');
        expect(choicesSource).toContain('@common/select-left');
        expect(choicesSource).toContain('@common/select-right');
        expect(choicesSource).toContain('@common/confirm');
        const source = stripLineComments(choicesSource);
        expect(source).not.toContain(".implement('moveUp'");
        expect(source).not.toContain(".implement('moveDown'");
        expect(source).not.toContain(".implement('moveLeft'");
        expect(source).not.toContain(".implement('moveRight'");
        expect(source).not.toContain(".implement('confirm'");
        expect(source).toContain("from './background'");
        expect((source.match(/'state'/g) || []).length).toBeGreaterThanOrEqual(
            2
        );
        expect(source).not.toContain("from '@user/client-base'");
        expect(source).toContain('packages-user/client-base/src/');
    });

    // 存档界面十二条命令全部就位，翻页方向逐条落在对应实现块里
    it('maps all twelve save commands and keeps the page directions', () => {
        expect(saveSource).toContain(".implement('@common/confirm'");
        expect(saveSource).toContain(".implement('@common/exit'");
        expect(saveSource).toContain(".implement('@ui/save'");
        expect(saveSource).toContain(".implement('@ui/load'");
        expect(saveSource).toContain(".implement('@ui/save-up'");
        expect(saveSource).toContain(".implement('@ui/save-down'");
        expect(saveSource).toContain(".implement('@ui/save-left'");
        expect(saveSource).toContain(".implement('@ui/save-right'");
        expect(saveSource).toContain(".implement('@ui/save-page-prev'");
        expect(saveSource).toContain(".implement('@ui/save-page-next'");
        expect(saveSource).toContain(".implement('@ui/save-page-prev-10'");
        expect(saveSource).toContain(".implement('@ui/save-page-next-10'");
        const source = stripLineComments(saveSource);
        expect(source).not.toContain(".implement('@save_pageUp'");
        expect(source).not.toContain(".implement('@save_pageDown'");
        expect(source).not.toContain(".implement('@save_up'");
        expect(source).not.toContain(".implement('@save_down'");
        expect(source).not.toContain(".implement('@save_left'");
        expect(source).not.toContain(".implement('@save_right'");
        const directions = [
            ['@ui/save-page-prev', 'movePage(-1)'],
            ['@ui/save-page-next', 'movePage(1)'],
            ['@ui/save-page-prev-10', 'movePage(-10)'],
            ['@ui/save-page-next-10', 'movePage(10)']
        ];
        for (const [id, call] of directions) {
            const block = getImplementBlock(source, id);
            expect(block).toContain(call);
            for (const [, other] of directions) {
                if (other !== call) expect(block).not.toContain(other);
            }
        }
        expect(source).toContain("'state'");
    });

    // 六个界面文件全部只走新按键系统，旧 API 与旧导入销声匿迹
    it('removes the old key api from all migrated ui files', () => {
        const sources = [
            choicesSource,
            saveSource,
            settingsSource,
            titleSource,
            viewMapSource,
            inputBoxSource
        ];
        for (const raw of sources) {
            const source = stripLineComments(raw);
            expect(/useKey\(\s*\)/.test(source)).toBe(false);
            expect(source).not.toContain('.realize(');
            expect(source).not.toContain('willEmit(');
            for (const statement of getImportStatements(raw)) {
                if (statement.includes('@user/client-modules')) {
                    expect(statement).not.toContain('useKey');
                }
            }
        }
    });

    // 设置界面的子作用域继承父级实现，且没有新增 legacy 按键用法
    it('keeps the settings parent scope and leaves game key usage untouched', () => {
        const source = stripLineComments(settingsSource);
        expect((source.match(/<Choices(?=[\s>])/g) || []).length).toBe(7);
        expect((source.match(/freshScope=\{false\}/g) || []).length).toBe(7);
        expect((source.match(/state=\{props\.state!\}/g) || []).length).toBe(7);
        expect(
            (source.match(/props\.state!\.hotkey\.system/g) || []).length
        ).toBe(7);
        expect(source).not.toMatch(/props\.state\.hotkey\.system/);
        expect(source).toContain(".implement('@common/exit'");
        expect(source).not.toContain('scope={scope}');
        expect(/const\s*\[\s*key\s*,\s*scope\s*\]/.test(source)).toBe(false);
        expect(source).toContain('getVitualKeyOnce');
        expect((source.match(/gameKey/g) || []).length).toBe(2);
        expect((source.match(/gameKey\.emitKey\(/g) || []).length).toBe(1);
        for (const raw of [
            saveSource,
            titleSource,
            viewMapSource,
            choicesSource,
            inputBoxSource
        ]) {
            expect(
                (stripLineComments(raw).match(/gameKey/g) || []).length
            ).toBe(0);
        }
    });

    // 标题界面与浏览地图的按键全部改用新命令，地图不再特判怪物手册
    it('rewires title and view map to the new command ids', () => {
        expect(titleSource).toContain('@ui/start-up');
        expect(titleSource).toContain('@ui/start-down');
        expect(titleSource).toContain('@common/confirm');
        expect(stripLineComments(titleSource)).not.toContain('@start_up');
        expect(stripLineComments(titleSource)).not.toContain('@start_down');
        const source = stripLineComments(viewMapSource);
        expect(source).toContain(".implement('@ui/view-map-next'");
        expect(source).toContain(".implement('@ui/view-map-prev'");
        expect(source).toContain(".implement('@ui/view-map-next-10'");
        expect(source).toContain(".implement('@ui/view-map-prev-10'");
        expect(source).toContain(".implement('@ui/view-map-book'");
        expect(source).toContain(".implement('@ui/view-map-fly'");
        expect(source).toContain(".implement('@common/confirm'");
        expect(source).toContain(".implement('@common/exit'");
        expect(source).not.toContain(".implement('@viewMap_book'");
        expect(source).not.toContain('willEmit');
        expect(viewMapSource).toContain('IGameUIPropsBase');
        expect(viewMapSource).toContain("'state'");
    });

    // 输入框只认 Enter 的确认键，热键作用域在挂载前进入
    it('binds the input confirm key and enters the scope before mount', () => {
        expect(inputBoxSource).toContain(".implement('@ui/input-confirm'");
        expect(stripLineComments(inputBoxSource)).not.toContain(
            '@common/confirm'
        );
        expect(inputBoxSource).toContain('document.activeElement');
        expect(inputBoxSource).toContain('blur()');
        const source = stripLineComments(useHotkeySource);
        expect(source).toContain('onBeforeMount(');
        expect(source).toContain('onUnmounted(');
        expect(source).not.toContain('onMounted(');
    });

    // 声明层不再出现重复命令 ID
    it('declares every command id exactly once', () => {
        const source = stripLineComments(hotkeyDeclSource);
        const ids = [...source.matchAll(/system\.addCommand\('([^']+)'/g)].map(
            match => match[1]
        );
        expect(new Set(ids).size).toBe(ids.length);
        for (const id of [
            '@ui/save-right',
            '@ui/save-down',
            '@ui/save-left',
            '@ui/save-page-prev-10',
            '@ui/save-page-next-10'
        ]) {
            expect(ids).toContain(id);
        }
    });

    // 怪物手册独占怪物手册键，其它地图指令不阻断
    it('blocks the exit command only for the view map book key', () => {
        const source = stripLineComments(hotkeyDeclSource);
        expect(getCommandBlock(source, '@ui/view-map-book')).toContain(
            'block: true'
        );
        expect(getCommandBlock(source, '@ui/view-map-fly')).not.toContain(
            'block: true'
        );
    });

    // 输入框确认指令只绑 Enter，公共确认键保持三键
    it('binds input confirm to enter only and keeps common confirm', () => {
        const source = stripLineComments(hotkeyDeclSource);
        const block = getCommandBlock(source, '@ui/input-confirm');
        expect(block).toContain('[[KeyCode.Enter]]');
        expect(block).not.toContain('KeyCode.Space');
        expect(block).not.toContain('KeyCode.KeyC');
        expect(block).not.toContain('mode:');
        expect(block).not.toContain('priority:');
        expect(block).not.toContain('interval:');
        expect(block).not.toContain('block:');
        expect(
            (source.match(/system\.addCommand\('@ui\/input-confirm'/g) || [])
                .length
        ).toBe(1);
        expect(source).toContain("hotkey.setGroup('@ui/input', '输入框'");
        const common = getCommandBlock(source, '@common/confirm');
        expect(common).toContain('KeyCode.Space');
        expect(common).toContain('KeyCode.KeyC');
    });
});
