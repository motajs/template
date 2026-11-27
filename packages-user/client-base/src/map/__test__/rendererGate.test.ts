import { describe, expect, it } from 'vitest';
import rendererSource from '../renderer.ts?raw';
import vertexSource from '../vertex.ts?raw';
import typesSource from '../types.ts?raw';
import movingSource from '../moving.ts?raw';
import statusSource from '../status.ts?raw';
import viewportSource from '../viewport.ts?raw';
import fragSource from '../shader/map.frag?raw';

// 提取指定方法的源码片段，从签名开始到该方法的四空格闭合括号为止
function getMethodBody(source: string, signature: string): string {
    const start = source.indexOf(signature);
    if (start < 0) return '';
    const end = source.indexOf('\n    }', start);
    return end < 0 ? source.slice(start) : source.slice(start, end);
}

// 依据每个颜色附着的最近一次帧缓冲绑定，得到帧缓冲到颜色纹理的配对
function getColorAttachments(source: string): Map<string, string> {
    const init = source.slice(
        source.indexOf('private initContext()'),
        source.indexOf('destroy(): void')
    );
    const result = new Map<string, string>();
    const re =
        /framebufferTexture2D\(\s*gl\.FRAMEBUFFER\s*,\s*gl\.COLOR_ATTACHMENT0\s*,\s*gl\.TEXTURE_2D\s*,\s*(\w+)/g;
    let match: RegExpExecArray | null = re.exec(init);
    while (match) {
        const before = init.slice(0, match.index);
        const bind = before.lastIndexOf('bindFramebuffer(gl.FRAMEBUFFER, ');
        const fb =
            bind < 0
                ? null
                : /bindFramebuffer\(gl\.FRAMEBUFFER, (\w+)\)/.exec(
                      before.slice(bind)
                  );
        result.set(fb ? fb[1] : '?', match[1]);
        match = re.exec(init);
    }
    return result;
}

/**
 * 去掉整行注释与空行，用于判断一个文件是否只剩注释
 * @param source 源码文本
 */
function getUncommented(source: string): string {
    return source
        .split(/\r?\n/)
        .filter(line => line.trim().length > 0 && !line.trim().startsWith('//'))
        .join('\n');
}

describe('渲染源码闸门', () => {
    // 覆盖层不再依赖独立模块，也不再有字符串身份键的构造器
    it('keeps the overlay implementation inside the vertex generator', () => {
        expect(vertexSource).not.toContain("from './overlay'");
        expect(vertexSource).not.toContain('MapOverlayOrder');
        expect(vertexSource).not.toContain('IMapOverlayOrder');
        expect(vertexSource).not.toContain('getStaticOverlayKey');
        expect(vertexSource).not.toContain('getDynamicOverlayKey');
    });

    // 覆盖层身份只由图层对象与数值索引组成，不再拼接任何字符串键
    it('uses no string identity keys for the overlay', () => {
        expect(/static:\$\{|dynamic:\$\{/.test(vertexSource)).toBe(false);
        expect(vertexSource).not.toContain('Map<string');
    });

    // 覆盖块接口新增实例索引、写回静态格与不降级的不透明度契约
    it('declares a single overlay block contract', () => {
        const start = typesSource.indexOf('export interface IOverlayBlock');
        expect(start).toBeGreaterThan(-1);
        const end = typesSource.indexOf('\n}', start);
        const body = typesSource.slice(start, end);
        expect(body).toContain('readonly layer: IMapLayer;');
        expect(body).toContain('readonly priority: number;');
        expect(body).toContain('x: number;');
        expect(body).toContain('y: number;');
        expect(body).toContain('readonly index: number;');
        expect(body).toContain('toStatic(');
        expect(body).toContain('setAlpha(');
        expect(body).toContain('readonly texture: IMaterialFramedData;');
        expect(body).toContain('readonly renderer: IMapRenderer;');
        expect(typesSource).not.toContain('IOverlayStaticBlock');
        expect(typesSource).not.toContain('OverlayBlockKind');
        expect(typesSource).not.toContain('kind');
    });

    // 移动算法退化为注释，接口仍保留但没有任何实现
    it('keeps the mover interface without an implementation', () => {
        expect(typesSource).toContain('export interface IRenderBlockMover');
        expect(getUncommented(movingSource).trim()).toBe('');
    });

    // 渲染器提供五个覆盖层方法与一个内部工厂，不再保留移动图块接口
    it('declares the renderer overlay api', () => {
        const names = [
            'addOverlayBlock(',
            'getOverlayBlocks(',
            'getOverlayBlockByIndex(',
            'deleteOverlayBlock(',
            'deleteOverlayBlockByIndex(',
            'createOverlayBlock('
        ];
        names.forEach(name => expect(typesSource).toContain(name));
        expect(typesSource).not.toContain('addMovingBlock');
        expect(typesSource).not.toContain('deleteMoving');
        expect(typesSource).not.toContain('hasMoving');
    });

    // 覆盖层只剩一个实现了覆盖块接口的具体类
    it('declares one concrete overlay block', () => {
        expect(statusSource).toContain('export class OverlayBlock');
        expect(statusSource).toContain('implements IOverlayBlock');
        expect(statusSource).toContain('readonly index: number;');
        expect(statusSource).toContain('readonly tile: number;');
        expect(statusSource).toContain('readonly renderer: IMapRenderer;');
        expect(statusSource).toContain('readonly priority: number;');
        expect(statusSource).toContain('x: number = 0;');
        expect(statusSource).toContain('y: number = 0;');
        expect(statusSource).not.toContain('DynamicBlockStatus');
        expect(statusSource).not.toContain('StaticOverlayBlock');
        expect(statusSource).not.toContain('IOverlayStaticBlock');
    });

    // 覆盖层的不透明度与帧数统一走动态槽位接口
    it('routes overlay state through the dynamic slot api', () => {
        const body = statusSource.slice(
            statusSource.indexOf('export class OverlayBlock')
        );
        expect(body).toContain('setDynamicAlpha(');
        expect(body).toContain('setDynamicFrame(');
        expect(body).toContain('getDynamicAlpha(');
        expect(body).toContain('getDynamicFrame(');
        expect(body).not.toContain('setStaticAlpha(');
        expect(body).not.toContain('setStaticFrame(');
    });

    // 覆盖块的销毁与写回都委托给渲染器
    it('delegates destroy and toStatic to the renderer', () => {
        const body = statusSource.slice(
            statusSource.indexOf('export class OverlayBlock')
        );
        expect(body).toContain('deleteOverlayBlock(this)');
        expect(body).toContain('vertex.toStatic(this');
    });

    // 静态图块状态对象原样保留
    it('keeps the static block status', () => {
        expect(statusSource).toContain('export class StaticBlockStatus');
        expect(statusSource).toContain('implements IBlockStatus');
    });

    // 移动算法的五个方法只以注释形式保留
    it('keeps the moving algorithm as comments only', () => {
        expect(getUncommented(movingSource).trim()).toBe('');
        const methods = [
            'lineTo(',
            'moveAs(',
            'moveRelative(',
            'endMoving(',
            'stepMoving('
        ];
        methods.forEach(name => expect(movingSource).toContain(name));
    });

    // 渲染器用集合、索引映射与索引池管理覆盖层
    it('manages overlays through a set map and pool', () => {
        expect(rendererSource).toContain('overlayBlocks: Set<IOverlayBlock>');
        expect(rendererSource).toContain('overlayIndexMap');
        expect(rendererSource).toContain('overlayIndexPool');
        expect(rendererSource).toContain('requireOverlayIndex(');
        expect(rendererSource).toContain('returnOverlayIndex(');
    });

    // 新增覆盖块与 API 覆盖块共用同一个工厂
    it('creates overlay blocks through one factory', () => {
        expect(rendererSource).toContain('createOverlayBlock(');
        const body = getMethodBody(rendererSource, 'addOverlayBlock(');
        expect(body).toContain('createOverlayBlock(');
        expect(body).toContain('updateOverlay(overlay, true)');
    });

    // 渲染器不再包含任何移动图块的公开面
    it('removes the moving renderer surface', () => {
        expect(rendererSource).not.toContain('IMovingRenderer');
        expect(rendererSource).not.toContain('MovingBlock');
        expect(rendererSource).not.toContain('IMovingBlock');
        expect(rendererSource).not.toContain('addMovingBlock');
        expect(rendererSource).not.toContain('deleteMoving');
        expect(rendererSource).not.toContain('hasMoving');
    });

    // tick 只保留背景帧、地图帧与 ticker，不再步进任何图块
    it('keeps the tick free of moving steps', () => {
        const body = getMethodBody(rendererSource, '\n    tick(timestamp');
        expect(body).toContain('tickers.forEach');
        expect(body).toContain('backgroundFrame');
        expect(body).not.toContain('stepMoving');
        expect(body).not.toContain('updateOverlayList');
        expect(body).not.toContain('movingBlock');
    });

    // 排序键依次为图层、纵坐标、横坐标与绘制优先级
    it('sorts overlays by layer y x and priority', () => {
        const body = getMethodBody(vertexSource, 'private sortOverlay(');
        expect(body).toContain('getOverlayBlocks()');
        expect(body).toContain('getLayerIndex(a.layer)');
        expect(body).toContain('getLayerIndex(b.layer)');
        expect(body).toContain('a.y - b.y');
        expect(body).toContain('a.x - b.x');
        expect(body).toContain('a.priority - b.priority');
        expect(body).toContain('overlayValueDirty = true');
        expect(body).not.toContain('StaticOverlayBlock');
        expect(body).not.toContain('instanceof');
    });

    // 组装时每块只按自身索引从动态数组拷贝 16 个浮点
    it('assembles every overlay from its slot', () => {
        const body = getMethodBody(vertexSource, 'private assembleOverlay(');
        expect(body).toContain('block.index * INSTANCED_COUNT');
        expect(body).toContain('dynamicInstancedArray');
        expect(body).toContain('overlayCount');
        expect(body).not.toContain('instanceof');
        expect(body).not.toContain('rectX');
    });

    // 静态图块 alpha 小于 1 时自动提升为覆盖层
    it('promotes static blocks below full alpha', () => {
        const body = getMethodBody(vertexSource, 'setStaticAlpha(');
        expect(body).toContain('alpha < 1');
        expect(body).toContain('promoteStaticBlock(');
        expect(body).toContain('getPromotedBlock(');
        expect(body).toContain('writeStaticAlpha(');
        const promote = getMethodBody(
            vertexSource,
            'private promoteStaticBlock('
        );
        expect(promote).toContain('createOverlayBlock(');
        expect(promote).toContain('subarray(');
        expect(promote).toContain('INSTANCED_COUNT');
        expect(promote).toContain('setPromotedBlock(');
        expect(promote).toContain('markRenderDirty(');
        expect(vertexSource).not.toContain('alphaMap');
        expect(vertexSource).not.toContain('flushPendingAlpha');
        expect(vertexSource).not.toContain('pendingAlpha');
        expect(vertexSource).not.toContain('overlayStatic');
    });

    // 读取已提升图块的 alpha 时转读覆盖层槽位
    it('reads promoted alpha from the overlay slot', () => {
        const getAlpha = getMethodBody(vertexSource, 'getStaticAlpha(');
        expect(getAlpha).toContain('getPromotedBlock(');
        expect(getAlpha).toContain('getDynamicAlpha(');
        const setAlpha = getMethodBody(vertexSource, 'setStaticAlpha(');
        expect(setAlpha).toContain('alpha >= 1');
        expect(setAlpha).toContain('writeStaticAlpha(');
        const write = getMethodBody(vertexSource, 'private writeStaticAlpha(');
        expect(write).toContain('INSTANCED_COUNT');
        expect(write).toContain('markRenderDirty(');
    });

    // 静态格更新时按掩码刷新提升槽位，源格变空时删除提升块
    it('refreshes promoted slots and drops empty cells', () => {
        const tile = getMethodBody(vertexSource, 'private updateTileVertex(');
        expect(tile).toContain('getPromotedBlock(');
        expect(tile).toContain('dynamicInstancedArray[');
        expect(tile).toContain('instancedArray[startIndex] = 0');
        expect(tile).toContain('VertexUpdate.Texture');
        expect(tile).toContain('VertexUpdate.Frame');
        const empty = getMethodBody(vertexSource, 'private updateVertexArray(');
        expect(empty).toContain('getPromotedBlock(');
        expect(empty).toContain('deleteOverlayBlock(');
    });

    // 覆盖层 alpha 恰好为 1 时不删除提升块，也没有自动降级
    it('never demotes promoted overlays', () => {
        const body = getMethodBody(vertexSource, 'setStaticAlpha(');
        expect(body).toContain('getPromotedBlock(');
        expect(body).toContain('.setAlpha(');
        expect(body).not.toContain('deletePromotedBlock');
        expect(body).not.toContain('deleteOverlayBlock');
        expect(body).not.toContain('promotedBlocks.clear');
    });

    // toStatic 先写回静态格并按目标格重算位置与纵深，最后释放覆盖块
    it('writes overlay data back to a static cell', () => {
        const body = getMethodBody(vertexSource, 'toStatic(');
        expect(body).toContain('getIndexInBlock(');
        expect(body).toContain('INSTANCED_COUNT');
        expect(body).toContain('layerStart');
        expect(body).toContain('perBlockZ');
        expect(body).toContain('cellWidth');
        expect(body).toContain('renderWidth');
        expect(body).toContain('markRenderDirty(');
        expect(body).toContain('deleteOverlayBlock(');
    });

    // 删除覆盖块时顺序脏与值脏必须同时置位
    it('keeps both dirty flags when deleting an overlay', () => {
        const body = getMethodBody(vertexSource, 'deleteOverlay(');
        expect(body).toContain('overlayOrderDirty = true');
        expect(body).toContain('overlayValueDirty = true');
    });

    // 帧数读写先查提升表，命中时转调动态槽位
    it('forwards frames through the promotion table', () => {
        const setFrame = getMethodBody(vertexSource, 'setStaticFrame(');
        expect(setFrame).toContain('getPromotedBlock(');
        expect(setFrame).toContain('setDynamicFrame(');
        const getFrame = getMethodBody(vertexSource, 'getStaticFrame(');
        expect(getFrame).toContain('getPromotedBlock(');
        expect(getFrame).toContain('getDynamicFrame(');
    });

    // 新增的私有覆盖层方法都在签名前带有 jsDoc
    it('documents every new private overlay method', () => {
        const signatures = [
            'getPromotedBlock',
            'setPromotedBlock',
            'deletePromotedBlock',
            'deletePromotedBlockByValue',
            'promoteStaticBlock',
            'writeStaticAlpha',
            'sortOverlay',
            'assembleOverlay'
        ];
        let found = 0;
        for (const name of signatures) {
            const index = vertexSource.indexOf('private ' + name + '(');
            if (index < 0) continue;
            found++;
            expect(
                vertexSource.slice(Math.max(0, index - 400), index)
            ).toContain('/**');
        }
        expect(found).toBe(signatures.length);
    });

    // 取覆盖层数组的顺序固定为先排序再组装
    it('takes the overlay array in sort then assemble order', () => {
        const body = getMethodBody(vertexSource, 'getOverlayArray(');
        expect(body).not.toBe('');
        const sort = body.indexOf('sortOverlay(');
        const assemble = body.indexOf('assembleOverlay(');
        expect(sort).toBeGreaterThan(-1);
        expect(assemble).toBeGreaterThan(sort);
        expect(body).not.toContain('flushPendingAlpha');
    });

    // 覆盖层脏标记只由顺序脏与值脏组成
    it('covers order and value in the overlay dirty flag', () => {
        const body = getMethodBody(vertexSource, 'isOverlayDirty(');
        expect(body).toContain('overlayOrderDirty');
        expect(body).toContain('overlayValueDirty');
        expect(body).not.toContain('alphaMap');
    });

    // 四个源码文件都不再引用任何被删除的覆盖层符号
    it('references no removed overlay symbols', () => {
        const sources = [
            typesSource,
            statusSource,
            vertexSource,
            rendererSource
        ];
        const removed = [
            'DynamicBlockStatus',
            'StaticOverlayBlock',
            'IOverlayStaticBlock',
            'IMovingBlock',
            'IMovingRenderer',
            'MovingBlock',
            'pendingAlpha',
            'flushPendingAlpha',
            'alphaMap',
            'overlayStatic'
        ];
        sources.forEach(source =>
            removed.forEach(name => expect(source).not.toContain(name))
        );
    });

    // 不透明遍与覆盖层遍分别显式设置深度掩码，并在覆盖层之后恢复
    it('sets the depth mask explicitly for both passes', () => {
        const off = rendererSource.indexOf('gl.depthMask(false)');
        const on = rendererSource.lastIndexOf('gl.depthMask(true)');
        expect(rendererSource).toContain('gl.depthMask(true)');
        expect(off).toBeGreaterThan(-1);
        expect(on).toBeGreaterThan(off);
    });

    // 使用分离式混合函数，保证 alpha 通道正确累积
    it('uses separate blend factors', () => {
        expect(rendererSource).toContain('blendFuncSeparate(');
        expect(rendererSource).not.toContain(
            'gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)'
        );
    });

    // 后处理帧缓冲使用深度附件，并在缩放与销毁时完整处理
    it('attaches and disposes depth renderbuffers', () => {
        expect(rendererSource).toContain('DEPTH_COMPONENT24');
        expect(rendererSource).toContain('framebufferRenderbuffer');
        expect(rendererSource).toContain('renderbufferStorage');
        expect(rendererSource).toContain('deleteRenderbuffer');
        expect(rendererSource).toContain('deleteFramebuffer');
        expect(rendererSource).toContain('deleteTexture');
        expect(
            /setCanvasSize\([\s\S]{0,2000}renderbufferStorage/.test(
                rendererSource
            )
        ).toBe(true);
    });

    // ping 帧缓冲绑定 ping 颜色纹理，pong 帧缓冲绑定 pong 颜色纹理
    it('pairs each framebuffer with its own color texture', () => {
        const attach = getColorAttachments(rendererSource);
        expect(attach.get('pingFramebuffer')).toBe('pingTexture2D');
        expect(attach.get('pongFramebuffer')).toBe('pongTexture2D');
    });

    // 最后一个后处理效果输出到屏幕，链路不再使用倒数第二个切换
    it('renders the last post effect to the screen', () => {
        const start = rendererSource.indexOf('postEffects.forEach(');
        const end = rendererSource.indexOf('});', start);
        const loop = rendererSource.slice(start, end < 0 ? start + 1600 : end);
        expect(loop).toContain('.length - 1');
        expect(loop).toContain('null');
        expect(rendererSource).not.toContain('.length - 2');
        expect(rendererSource).not.toContain('postEffects.length > 1');
    });

    // 第一个效果读取 ping 的颜色纹理，零个效果时直接绘制到默认帧缓冲
    it('feeds the scene texture into the first post effect', () => {
        const chain = rendererSource.slice(
            rendererSource.indexOf('const postEffects'),
            rendererSource.indexOf('postEffects.forEach(')
        );
        expect(chain).toContain('pingTexture2D');
    });

    // 覆盖层使用独立缓冲区与实例化绘制，脏分支先取数组再取数量
    it('draws the overlay from its own instanced buffer', () => {
        expect(rendererSource).toContain('overlayBuffer');
        expect(rendererSource).toContain('drawArraysInstanced');
        expect(rendererSource).not.toContain('drawElementsInstanced');
        const start = rendererSource.indexOf('isOverlayDirty()');
        expect(start).toBeGreaterThan(-1);
        const seg = rendererSource.slice(start, start + 900);
        const array = seg.indexOf('getOverlayArray()');
        const count = seg.indexOf('getOverlayCount()');
        expect(array).toBeGreaterThan(-1);
        expect(count).toBeGreaterThan(-1);
        expect(array).toBeLessThan(count);
    });

    // 不透明遍按动态起始索引裁掉动态尾部，避免与覆盖层重复绘制
    it('clips the dynamic tail from the opaque pass', () => {
        expect(rendererSource).toContain('Math.min(v.endIndex, dynamicStart)');
    });

    // 覆盖层绘制区间保留了解释性注释，说明深度、顺序与上传策略
    it('documents the overlay draw block', () => {
        const start = rendererSource.indexOf('// 图块');
        const end = rendererSource.indexOf('// Post effects', start);
        expect(start).toBeGreaterThan(-1);
        expect(end).toBeGreaterThan(start);
        const comments = (
            rendererSource.slice(start, end).match(/(^|\r?\n)\s*\/\//g) || []
        ).length;
        expect(comments).toBeGreaterThanOrEqual(6);
    });

    // 分块张量布局保持不变，且静态分块数组没有被排序
    it('keeps the chunk layout and never sorts the chunk array', () => {
        expect(vertexSource).toContain('this.dynamicStart = staticCount;');
        expect(vertexSource).toContain('instancedStart');
        expect(vertexSource).toContain('i * count * INSTANCED_COUNT');
        expect(
            /(instancedArray|tileInstanced)\s*\.sort\(/.test(vertexSource)
        ).toBe(false);
    });

    // 视口仍然把动态尾部合并进渲染区域，由不透明遍负责裁剪
    it('keeps merging the dynamic tail into the render area', () => {
        expect(viewportSource).toContain(
            'this.checkDynamic(renderArea, dynamicStart, dynamicCount);'
        );
        expect(viewportSource).toContain('last.count += dynamicCount;');
    });

    // 片元着色器的丢弃阈值已下调，旧阈值不再残留
    it('lowers the fragment discard threshold', () => {
        expect(fragSource).toContain('0.004');
        expect(fragSource).not.toContain('alpha < 0.1');
    });

    // 渲染路径不使用半精度深度编码或顺序剥离机制
    it('avoids half precision depth encoding and order peeling', () => {
        const pattern = /OIT|depthPeel|gl_FragDepth|halfFloat|half_float/i;
        expect(pattern.test(rendererSource)).toBe(false);
        expect(pattern.test(vertexSource)).toBe(false);
    });

    // 块内偏移使用分块左上角坐标，跨分块地图才能定位到正确的实例
    it('locates instances with data coordinates inside a chunk', () => {
        const body = getMethodBody(vertexSource, 'private getIndexInBlock(');
        expect(body).not.toBe('');
        expect(body).toContain('x - block.elX');
        expect(body).toContain('y - block.elY');
        expect(body).not.toContain('x - block.x');
    });

    // getOverlayCount 的契约说明要求在脏时先调用 getOverlayArray 完成组装
    it('documents the getOverlayCount contract', () => {
        const index = typesSource.indexOf('getOverlayCount():');
        expect(index).toBeGreaterThan(-1);
        const docStart = typesSource.lastIndexOf('/**', index);
        expect(docStart).toBeGreaterThan(-1);
        expect(typesSource.slice(docStart, index)).toContain('getOverlayArray');
    });
});
