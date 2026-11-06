import { describe, expect, it } from 'vitest';
import bookSource from '../book.tsx?raw';
import bookDetailSource from '../bookDetail.tsx?raw';
import equipBoxSource from '../equipbox.tsx?raw';
import toolBoxSource from '../toolbox.tsx?raw';
import hotkeySource from '../hotkey.tsx?raw';
import textBoxSource from '../../../../packages-user/client-base/src/components/textbox.tsx?raw';
import listSource from '../../../../packages-user/client-base/src/components/list.tsx?raw';

// 抹掉块注释、JSX 注释与行注释，避免说明性文字让否定断言假红
function stripComments(source: string): string {
    return source
        .replace(/\{[ \t]*\/\*[^]*?\*\/[ \t]*\}/g, '')
        .replace(/\/\*[^]*?\*\//g, '')
        .split(/\r?\n/)
        .map(line => line.replace(/\/\/.*$/, ''))
        .join('\n');
}

// 把跨行书写的表达式压成单行，用于肯定断言
function flatten(source: string): string {
    return source.replace(/\s+/g, ' ').trim();
}

// 逐段取出每个 Scroll 块，用于按位置断言其内部结构
function getScrollBlocks(source: string): string[] {
    const blocks: string[] = [];
    let index = 0;
    while (true) {
        const start = source.indexOf('<Scroll', index);
        if (start < 0) break;
        const end = source.indexOf('</Scroll>', start);
        if (end < 0) break;
        blocks.push(source.slice(start, end));
        index = end + '</Scroll>'.length;
    }
    return blocks;
}

// 取出包含 needle 的那个自闭合元素标签原文，用于把 noevent 配对变成逐元素断言
function tagAround(source: string, tag: string, needle: string): string {
    const i = source.indexOf(needle);
    if (i < 0) return '';
    const start = source.lastIndexOf('<' + tag, i);
    const end = source.indexOf('/>', i);
    if (start < 0 || end < 0) return '';
    return source.slice(start, end + 2);
}

describe('列表平铺源码闸门', () => {
    // Scroll 内必须平铺：块内既不能有 container，也不能有 hidden
    it('keeps every Scroll child flat and free of hidden toggles', () => {
        const sources = [
            bookSource,
            bookDetailSource,
            equipBoxSource,
            toolBoxSource,
            hotkeySource
        ];
        for (const raw of sources) {
            const blocks = getScrollBlocks(stripComments(raw));
            expect(blocks.length).toBeGreaterThan(0);
            for (const block of blocks) {
                expect(block).not.toMatch(/<container(?=[\s>])/);
                expect(block).not.toMatch(/hidden\s*=/);
            }
        }
    });

    // 四个列表文件各保留一个根 container，hotkey 改由 ListPage 承载后不再自带 container
    it('keeps only the root container in each list file', () => {
        const sources = [
            bookSource,
            bookDetailSource,
            equipBoxSource,
            toolBoxSource
        ];
        for (const raw of sources) {
            const source = stripComments(raw);
            expect(source.match(/<container(?=[\s>])/g)).toHaveLength(1);
        }
        const hotkey = stripComments(hotkeySource);
        expect(hotkey).not.toMatch(/<container(?=[\s>])/);
        expect(hotkey.match(/<ListPage(?=[\s>])/g)).toHaveLength(1);
        expect(hotkey.match(/<Scroll(?=[\s>])/g)).toHaveLength(1);
        const equipFlat = flatten(stripComments(equipBoxSource));
        expect(equipFlat).not.toContain(
            'RIGHT_LEFT, DESC_TOP, RIGHT_WIDTH, DESC_HEIGHT'
        );
        expect(equipFlat).not.toContain(
            'RIGHT_LEFT, OWNED_TOP, RIGHT_WIDTH, OWNED_HEIGHT'
        );
    });

    // hotkey 的分组改由 ListPage 承载，右栏只剩一条 Scroll，选中态仍用按键框边框
    it('renders the hotkey groups through ListPage and keeps the key box border', () => {
        const source = stripComments(hotkeySource);
        expect(getScrollBlocks(source)).toHaveLength(1);
        const flat = flatten(source);
        expect(source).toMatch(
            /import\s*\{[^}]*ListPage[^}]*\}\s*from\s*'@user\/client-base'/
        );
        expect(flat).toContain('ListPage');
        expect(flat).toContain('basis={GROUP_BASIS}');
        expect(flat).toContain('list={groupItems}');
        expect(flat).toContain('selected={selectedGroup.value}');
        expect(flat).toContain('lineHeight={GROUP_ROW_HEIGHT}');
        expect(flat).toContain('font={CONTENT_FONT}');
        expect(source).toMatch(/<ListPage[^>]*\sclose(?=[\s>])/);
        expect(flat).toContain('closeLoc={CLOSE_LOC}');
        expect(flat).toContain('onUpdate={selectGroup}');
        expect(flat).toContain('onClose={close}');
        expect(flat).toContain('default:');
        expect(flat).toContain('COMMAND_SCROLL_LOC');
        expect(flat).toContain('commandRows');
        expect(flat).toContain('ICommandRow');
        expect(flat).not.toContain('getCommandTop');
        expect(flat).not.toContain('getCommandHeight');
        expect(flat).not.toContain('getContentHeight');
        expect(source).not.toMatch(/Selection/);
        expect(source).not.toContain('GROUP_TEXT_LEFT');
        expect(source).not.toContain('RIGHT_LEFT');
        expect(source).not.toContain('RIGHT_WIDTH');
        expect(source).not.toContain('selectGroup(id)');
        const keyHit = tagAround(
            source,
            'g-rectr',
            'getKeyClick(row.command, j)'
        );
        expect(keyHit).toContain('strokeStyle');
        expect(keyHit).toContain('lineWidth');
        expect(keyHit).toContain('isSelected');
        expect(source.match(/strokeStyle=\{\s*isSelected\s*\?/g)).toHaveLength(
            1
        );
        expect(source.match(/lineWidth=\{\s*isSelected\s*\?/g)).toHaveLength(1);
        expect(source).not.toContain('if (isSelected)');
        expect(source).not.toContain('hidden={!isSelected}');
        expect(source).not.toContain('{isSelected &&');
        expect(source).not.toContain('isSelected && groupNodes.push');
        expect(source).not.toContain('isSelected && commandNodes.push');
    });

    // book 四项临界信息缺失时回退为 0，且不再整项条件渲染
    it('falls back to zero for the four critical fields in book', () => {
        const source = stripComments(bookSource);
        const flat = flatten(source);
        expect(flat).toContain(
            'const damage = critical ? critical.baseInfo.damage : 0;'
        );
        expect(flat).toContain(
            'const nextDiff = critical ? critical.nextDiff : 0;'
        );
        expect(flat).toContain(
            'const damageDiff = critical ? -critical.damageDiff : 0;'
        );
        expect(flat).toContain(
            'const def1Damage = critical && def1 ? critical.baseInfo.damage - def1.baseInfo.damage : 0;'
        );
        expect(flat).toContain('伤害');
        expect(flat).toContain('临界');
        expect(flat).toContain('减伤');
        expect(flat).toContain('1 防');
        expect(source).not.toMatch(/\{\s*critical\s*&&/);
        expect(source).not.toContain('def1 && (');
    });

    // bookDetail 两项临界信息缺失时回退为 0
    it('falls back to zero for both critical fields in book detail', () => {
        const source = stripComments(bookDetailSource);
        const flat = flatten(source);
        expect(flat).toContain(
            'format(critical.value ? critical.value.nextDiff : 0)'
        );
        expect(flat).toContain(
            'format(critical.value ? -critical.value.damageDiff : 0)'
        );
        expect(flat).toContain('加攻');
        expect(flat).toContain('减伤');
        expect(source).not.toMatch(/\{\s*critical\.value\s*&&/);
    });

    // bookDetail 用高度回调计算每行位置，且不再用 key 触发重挂载
    it('measures special rows through the height callback without remount keys', () => {
        const flat = flatten(stripComments(bookDetailSource));
        expect(flat).toContain('autoHeight');
        expect(flat).toContain('onUpdateHeight');
        expect(flat).toContain('textHeights');
        expect(flat).toContain('specialRows');
        expect(flat).toContain('SPECIAL_MIN_HEIGHT');
        expect(flat).toContain('getDescription()');
        expect(flat).toContain('textTop');
        expect(flat).toContain('textHeight');
        expect(flat).toContain('ISpecialRow');
        expect(flat).toContain('ISpecial<unknown>');
        expect(flat).toContain('cumsum(hs)');
        expect(flat).toContain('ends[i] - hs[i]');
        expect(flat).not.toContain('top +=');
    });

    // 显示开关按位置分流，且命中层与被覆盖元素逐个配对
    it('splits display toggles by position and pairs hit layers with noevent', () => {
        const equipSource = stripComments(equipBoxSource);
        const equipFlat = flatten(equipSource);
        expect(equipFlat).toContain('hidden={!!equip}');
        expect(equipFlat).toContain('hidden={!equip}');
        expect(equipFlat).toContain('hidden={!dragging.value}');
        expect(equipFlat).toContain("delta === 0 ? ''");
        expect(equipFlat).toContain("equip ? equip.item.text : ''");
        expect(equipFlat).toContain('slotEquip ? slotEquip.item.num : 0');
        expect(equipSource).not.toContain('{!equip &&');
        expect(equipSource).not.toContain('{equip &&');
        expect(equipSource).not.toContain('{delta !== 0 &&');
        expect(equipSource).not.toContain('{slotEquip &&');
        expect(equipSource).not.toContain('{dragging.value &&');
        expect(equipSource).not.toContain('hidden={!slotEquip}');
        expect(equipSource).not.toContain('hidden={delta === 0}');
        const toolSource = stripComments(toolBoxSource);
        const toolFlat = flatten(toolSource);
        expect(toolFlat).toContain('hidden={!!current}');
        expect(toolFlat).toContain("current ? current.raw.text : ''");
        expect(toolSource).not.toContain('{!current &&');
        expect(toolSource).not.toContain('{current &&');
        expect(toolSource).not.toContain('hidden={!current}');
        const hintIndex = toolSource.indexOf('hidden={!!current}');
        const detailIndex = toolSource.indexOf(
            "current ? current.raw.text : ''"
        );
        expect(hintIndex).toBeGreaterThanOrEqual(0);
        expect(detailIndex).toBeGreaterThan(hintIndex);
        const hotkeyFlat = flatten(stripComments(hotkeySource));
        expect(hotkeyFlat).not.toContain('hidden={!isSelected}');
        expect(hotkeyFlat).not.toContain('{isSelected &&');

        const bookTexts = stripComments(bookSource);
        const bookNameTag = tagAround(
            bookTexts,
            'text',
            "base.getAttribute('name')"
        );
        const bookDamageTag = tagAround(bookTexts, 'text', 'format(damage)');
        const bookIconTag = tagAround(bookTexts, 'icon', 'icon={base.code}');
        expect(bookNameTag).toContain('noevent');
        expect(bookDamageTag).toContain('noevent');
        expect(bookIconTag).toContain('noevent');

        const ownedNameTag = tagAround(equipSource, 'text', 'item.item.name');
        const ownedIconTag = tagAround(equipSource, 'icon', 'item.item.num');
        const slotNameTag = tagAround(equipSource, 'text', 'text={name}');
        const slotIconTag = tagAround(
            equipSource,
            'icon',
            'slotEquip ? slotEquip.item.num : 0'
        );
        expect(ownedNameTag).toContain('noevent');
        expect(ownedIconTag).toContain('noevent');
        expect(slotNameTag).toContain('noevent');
        expect(slotIconTag).not.toContain('noevent');

        const toolNameTag = tagAround(toolSource, 'text', 'item.raw.name');
        const toolCountTag = tagAround(
            toolSource,
            'text',
            'core.formatBigNumber(item.count)'
        );
        const toolRowTag = tagAround(
            toolSource,
            'g-rectr',
            'getItemClick(item)'
        );
        expect(toolNameTag).toContain('noevent');
        expect(toolCountTag).toContain('noevent');
        expect(toolRowTag).not.toContain('noevent');

        const hotkeyTexts = stripComments(hotkeySource);
        const commandNameTag = tagAround(
            hotkeyTexts,
            'text',
            'row.command.name'
        );
        const combinationTag = tagAround(
            hotkeyTexts,
            'text',
            'formatCombination(showing)'
        );
        const keyHitTag = tagAround(
            hotkeyTexts,
            'g-rectr',
            'getKeyClick(row.command, j)'
        );
        expect(commandNameTag).toContain('noevent');
        expect(combinationTag).toContain('noevent');
        expect(keyHitTag).not.toContain('noevent');

        for (const tag of [
            bookNameTag,
            bookDamageTag,
            bookIconTag,
            ownedNameTag,
            ownedIconTag,
            slotNameTag,
            slotIconTag,
            toolNameTag,
            toolCountTag,
            toolRowTag,
            commandNameTag,
            combinationTag,
            keyHitTag
        ]) {
            expect(tag).not.toBe('');
        }
    });

    // hotkey 的 ListPage 开标签带 nocache，避免整屏缓存复用旧画面
    it('marks the hotkey list page as nocache', () => {
        const source = stripComments(hotkeySource);
        const start = source.indexOf('<ListPage');
        const end = source.indexOf('>', start);
        expect(start).toBeGreaterThanOrEqual(0);
        expect(end).toBeGreaterThan(start);
        expect(source.slice(start, end + 1)).toContain('nocache');
    });

    // equipbox 的四个循环无关 loc 已提为常量并标注 ElementLocator
    it('hoists the four equipbox scroll locators with explicit types', () => {
        const source = stripComments(equipBoxSource);
        const flat = flatten(source);
        const names = [
            'STATUS_SCROLL_LOC',
            'DESC_SCROLL_LOC',
            'SLOT_SCROLL_LOC',
            'OWNED_SCROLL_LOC'
        ];
        for (const name of names) {
            expect(flat).toContain(`${name}: ElementLocator`);
            expect(flat).toContain(`loc={${name}}`);
        }
        expect(source).toContain(
            "import { ElementLocator, IActionEvent } from '@motajs/render';"
        );
    });

    // 列表必须内联渲染，不得再预建 VNode 数组或按数组名收集
    it('renders lists inline instead of prebuilt VNode arrays', () => {
        const sources = [
            bookSource,
            bookDetailSource,
            equipBoxSource,
            toolBoxSource,
            hotkeySource
        ];
        const arrayNames = [
            'specialNodes',
            'statusNodes',
            'slotNodes',
            'ownedNodes',
            'permNodes',
            'consNodes',
            'groupNodes',
            'commandNodes'
        ];
        for (const raw of sources) {
            const source = stripComments(raw);
            expect(source).not.toMatch(/\bVNode\b/);
            expect(source).not.toContain(': VNode[]');
            for (const name of arrayNames) {
                expect(source).not.toContain(name);
                expect(source).not.toContain(`${name}.push(`);
            }
        }
        expect(stripComments(bookSource)).not.toContain('rows.push(');
    });

    // 每个列表都必须在 JSX 内直接 map，且循环变量使用 i / j
    it('renders every list with inline map and short loop variables', () => {
        expect(flatten(stripComments(bookSource))).toContain(
            'enemies.value.map('
        );
        expect(flatten(stripComments(bookDetailSource))).toContain(
            'specialRows.value.map('
        );
        expect(flatten(stripComments(equipBoxSource))).toContain(
            'props.attributes.map('
        );
        expect(flatten(stripComments(equipBoxSource))).toContain(
            'hero.equip.slots.map('
        );
        expect(flatten(stripComments(equipBoxSource))).toContain(
            'owned.value.map('
        );
        expect(flatten(stripComments(toolBoxSource))).toContain(
            'permItems.value.map('
        );
        expect(flatten(stripComments(toolBoxSource))).toContain(
            'consItems.value.map('
        );
        const hotkeyFlat = flatten(stripComments(hotkeySource));
        expect(hotkeyFlat).toContain('groups.map(');
        expect(hotkeyFlat).toContain('commandRows.value.map(');
        expect(hotkeyFlat).toContain('combinationLists.value[i]');
        expect(hotkeyFlat).toContain('.map((keys, j)');
        expect(hotkeyFlat).toContain('getKeyClick(row.command, j)');
        expect(hotkeyFlat).toContain('selectKey(command, index)');
        const sources = [
            bookSource,
            bookDetailSource,
            equipBoxSource,
            toolBoxSource,
            hotkeySource
        ];
        for (const raw of sources) {
            const source = stripComments(raw);
            expect(source).not.toContain('groupIndex');
            expect(source).not.toContain('commandIndex');
            expect(source).not.toMatch(/for\s*\(\s*\r?\n/);
        }
    });

    // book 每行必须仍渲染命中层、图标、名称、特殊属性、五个基础数值与四个临界数值
    it('keeps all thirteen elements in every book row', () => {
        const source = stripComments(bookSource);
        const flat = flatten(source);
        const blocks = getScrollBlocks(source);
        expect(blocks).toHaveLength(1);
        const block = blocks[0];
        expect(block.match(/<text(?=[\s>])/g)).toHaveLength(11);
        expect(block.match(/<icon(?=[\s>])/g)).toHaveLength(1);
        expect(block.match(/<g-rect(?=[\s>])/g)).toHaveLength(1);
        for (const label of ['生命', '攻击', '防御', '金币', '经验']) {
            expect(flat).toContain(label);
        }
        expect(flat).toContain('specialText(base)');
    });

    // 注释不得落在 JSX 子元素位置，Scroll 内只允许 JSX 注释
    it('keeps line comments out of Scroll children', () => {
        // 按花括号配对删掉表达式容器，字符串与模板字面量内的括号不参与配对
        const withoutContainers = (text: string): string => {
            let result = '';
            let index = 0;
            while (index < text.length) {
                if (text[index] !== '{') {
                    result += text[index];
                    index++;
                    continue;
                }
                let depth = 0;
                let quote = '';
                let escaped = false;
                let cursor = index;
                for (; cursor < text.length; cursor++) {
                    const current = text[cursor];
                    if (quote) {
                        if (escaped) escaped = false;
                        else if (current === '\\') escaped = true;
                        else if (current === quote) quote = '';
                        continue;
                    }
                    if (current === '"' || current === "'" || current === '`') {
                        quote = current;
                        continue;
                    }
                    if (current === '{') depth++;
                    if (current === '}') {
                        depth--;
                        if (depth === 0) break;
                    }
                }
                index = cursor + 1;
            }
            return result;
        };
        const cases = [
            { source: bookSource, counts: [1] },
            { source: bookDetailSource, counts: [1] },
            { source: equipBoxSource, counts: [1, 0, 1, 1] },
            { source: toolBoxSource, counts: [1, 1, 0] },
            { source: hotkeySource, counts: [1] }
        ];
        for (const item of cases) {
            const blocks = getScrollBlocks(item.source);
            const counts = blocks.map(
                block => (block.match(/\{\s*\/\*/g) || []).length
            );
            expect(counts).toEqual(item.counts);
            for (const block of blocks) {
                const children = block.slice(block.indexOf('>') + 1);
                expect(children.trimStart()[0]).toMatch(/[{<]/);
                expect(withoutContainers(children)).not.toContain('//');
            }
        }
        const bookFallback =
            '// 临界信息缺失时回退为 0，让「没有数据」与「数值为 0」可以区分';
        const bookComments = ['// 数值列表区', '// 临界信息区', bookFallback];
        for (const comment of bookComments) {
            expect(bookSource.split(comment)).toHaveLength(2);
        }
        const bookLines = bookSource.split(/\r?\n/);
        expect(
            bookLines.filter(line => line.trim() === bookFallback)
        ).toHaveLength(1);
        const fallbackIndex = bookSource.indexOf(bookFallback);
        expect(fallbackIndex).toBeGreaterThan(bookSource.indexOf('<Scroll'));
        expect(fallbackIndex).toBeLessThan(bookSource.indexOf('</Scroll>'));
        const detailComment =
            '// TextContent 已按 props.loc 响应式同步位置，行位置变化时无需重挂载';
        expect(bookDetailSource.split(detailComment)).toHaveLength(2);
        for (const stale of [
            '// TextContent 只在 setup 时复制一次 props.loc，之后改 loc 不会移动元素',
            '// 因此 key 同时包含行位置与实测高度，位置变化时重挂载一次即可收敛'
        ]) {
            expect(bookDetailSource).not.toContain(stale);
        }
        const equipComments = [
            '// Scroll 会覆盖直接子元素的 hidden，增减值为 0 时改用空文本',
            '// 拖动起手仍只在图标上，整格只负责悬停判定'
        ];
        for (const comment of equipComments) {
            expect(equipBoxSource.split(comment)).toHaveLength(2);
        }
        const hotkeyComments = ['// 选中按键框同样只切换这个既有矩形的描边'];
        for (const comment of hotkeyComments) {
            expect(hotkeySource.split(comment)).toHaveLength(2);
        }
        expect(hotkeySource).not.toContain('选中分组只由这一行的边框表示');
        expect(hotkeySource).not.toContain('每行点击区与分组名');
    });

    // 五个列表文件都不再用 key 强制重挂载
    it('renders every list file without keys', () => {
        const sources = [
            bookSource,
            bookDetailSource,
            equipBoxSource,
            toolBoxSource,
            hotkeySource
        ];
        for (const raw of sources) {
            expect(stripComments(raw)).not.toContain('key={');
        }
        const contentTag = tagAround(
            stripComments(bookDetailSource),
            'TextContent',
            'getDescription()'
        );
        expect(contentTag).not.toBe('');
        expect(contentTag).not.toContain('key=');
        expect(flatten(contentTag)).toContain('loc={textLoc}');
        expect(flatten(stripComments(bookDetailSource))).toMatch(
            /textLoc: ElementLocator = \[\s*0,\s*row\.textTop,\s*SPECIAL_WIDTH,\s*row\.textHeight\s*\]/
        );
        // 用户已授权删除两处仍提到 key 的过期注释
        expect(bookDetailSource).not.toContain('同时用于 TextContent 的 key');
        expect(bookDetailSource).not.toContain(
            '避免高度回调与 key 重挂载互相触发'
        );
    });

    // hotkey 的分组列表由 ListPage 渲染，关闭按钮使用其内置的关闭文本
    it('delegates the hotkey group list and close text to ListPage', () => {
        const hotkey = stripComments(hotkeySource);
        expect(hotkey).toContain('ListPage');
        expect(hotkey).toContain('closeLoc=');
        expect(hotkey).not.toContain('text="返回"');
        expect(hotkey).not.toContain('text="关闭"');
        expect(listSource).toContain('text="关闭"');
        expect(listSource).toContain('basis');
    });

    // 五个 UI 文件都不保留多行内联 loc 与内联箭头事件处理器
    it('keeps multiline inline locators and inline arrow handlers out of the list files', () => {
        const sources = [
            bookSource,
            bookDetailSource,
            equipBoxSource,
            toolBoxSource,
            hotkeySource
        ];
        for (const raw of sources) {
            const source = stripComments(raw);
            expect(source).not.toMatch(/loc=\{\[\s*\r?\n/);
            expect(source).not.toMatch(/on[A-Z][A-Za-z]*=\{[^{}]*=>/);
        }
    });

    // bookDetail 用 cumsum 计算行位置且不再手写累加
    it('computes special row offsets with cumsum', () => {
        const flat = flatten(stripComments(bookDetailSource));
        expect(flat).toContain("from '@motajs/common'");
        expect(flat).toContain('cumsum');
        expect(flat).toContain('cumsum(hs)');
        expect(flat).toContain('ends[i] - hs[i]');
        expect(flat).not.toContain('top +=');
    });

    // TextContent 会随 props.loc 更新位置并恒用 props.width 作为宽度
    it('syncs TextContent position from props.loc and always uses props.width', () => {
        const flat = flatten(stripComments(textBoxSource));
        expect(flat).toContain('watch(() => props.loc');
        expect(flat).toContain('props.autoHeight ? height : h');
        expect(flat).toContain('props.width');
        expect(flat).toContain("emit('updateHeight', height)");
        expect(flat).toContain('typer.setConfig(props)');
        expect(flat).toMatch(
            /loc\.value = \[\s*x,\s*y,\s*props\.width,\s*props\.autoHeight \? height : h,\s*ax,\s*ay\s*\]/
        );
    });
});
