import { describe, expect, it } from 'vitest';
import hotkeySource from '../hotkey.tsx?raw';
import typesSource from '../../../../packages-user/client-base/src/hotkey/types.ts?raw';
import implSource from '../../../../packages-user/client-base/src/hotkey/hotkey.ts?raw';
import settingsSource from '../settings.tsx?raw';
import uiIndexSource from '../index.ts?raw';

// 抹掉块注释、JSX 注释与行注释，避免说明性文字让否定断言假红
function stripComments(source: string): string {
    return source
        .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split(/\r?\n/)
        .map(line => line.replace(/\/\/.*$/, ''))
        .join('\n');
}

describe('热键设置源码闸门', () => {
    // iterateGroups 必须同时存在于接口声明与实现中
    it('declares iterateGroups on the interface and returns the group entries', () => {
        expect(typesSource).toMatch(/\/\*\*[\s\S]*?\*\/\s*iterateGroups\(\)/);
        expect(typesSource).toMatch(/iterateGroups\(\)\s*:\s*Iterable/);
        expect(implSource).toMatch(
            /iterateGroups\(\)[\s\S]*?this\.groups\.entries\(\)/
        );
    });

    // 界面不得包含任何持久化调用
    it('keeps persistence calls out of the hotkey settings ui', () => {
        const source = stripComments(hotkeySource);
        expect(source).not.toContain('saveState');
        expect(source).not.toContain('setGlobal');
        expect(source).not.toContain('loadState');
    });

    // 设置入口与 UI 导出清单都不得接入本界面
    it('leaves the settings entry and ui barrel untouched', () => {
        expect(settingsSource).not.toContain('HotkeySettings');
        expect(settingsSource).not.toContain('hotkey.tsx');
        expect(uiIndexSource).not.toContain('./hotkey');
    });

    // 文档按键监听必须位于捕获阶段，并阻断事件继续传播
    it('listens on document in the capture phase and blocks propagation', () => {
        expect(hotkeySource).toMatch(
            /addEventListener\(\s*'keydown'\s*,[^,]+,\s*true\s*\)/
        );
        expect(hotkeySource).toMatch(
            /addEventListener\(\s*'keyup'\s*,[^,]+,\s*true\s*\)/
        );
        expect(hotkeySource).toContain('preventDefault()');
        expect(hotkeySource).toContain('stopPropagation()');
        expect(hotkeySource).toContain('stopImmediatePropagation()');
    });

    // 组合必须写回指令对象
    it('writes the captured combination back through setKeyCombination', () => {
        expect(hotkeySource).toContain('setKeyCombination(');
    });

    // 组合文本使用统一枚举转换，并以加号连接，空组合显示未设置
    it('formats combinations with KeyCodeUtils and the plus separator', () => {
        expect(hotkeySource).toContain('KeyCodeUtils.toString');
        expect(hotkeySource).toContain(' + ');
        expect(hotkeySource).toContain('未设置');
    });

    // 不加入冲突检测与恢复默认
    it('adds neither conflict detection nor default restoring', () => {
        const source = stripComments(hotkeySource).toLowerCase();
        expect(source).not.toContain('conflict');
        expect(source).not.toContain('restoredefault');
        expect(source).not.toContain('resetdefault');
    });

    // 左栏分组必须来自分组迭代 API
    it('builds the group list from iterateGroups', () => {
        expect(hotkeySource).toContain('iterateGroups(');
    });

    // 事件码必须经同一映射表转换，并忽略未知按键
    it('maps events through EVENT_KEY_CODE_MAP and ignores unknown keys', () => {
        expect(hotkeySource).toContain('EVENT_KEY_CODE_MAP');
        expect(hotkeySource).toContain('KeyCode.Unknown');
    });

    // 全屏布局且不自绘背景
    it('uses the full screen locator and draws no background', () => {
        expect(hotkeySource).toContain('FULL_LOC');
        const source = stripComments(hotkeySource);
        expect(source).not.toMatch(/<g-rect[\s>]/);
        expect(source).not.toContain('<Background');
    });

    // 每个按键组合渲染一个独立框
    it('renders one clickable box per key combination', () => {
        expect(hotkeySource).toContain('iterateKeyCombinations(');
    });

    // 关闭路径使用公共退出命令与返回文本
    it('closes through the common exit command and the back text', () => {
        expect(hotkeySource).toContain('@common/exit');
        expect(hotkeySource).toContain('返回');
    });
});
