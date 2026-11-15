---
phase: 09-minimum-browser-runnable
plan: 54
subsystem: render-anim
tags:
    - render-anim
    - animation
    - binary-parser
    - canvas2d
    - vitest
requires:
    - 09-52 render-anim package skeleton
    - 09-53 IAnimationParsedData / IAnimationAnimater contract
provides:
    - parseRenderAnimation v2 binary parser
    - RenderAnimater lazy frame compositor
    - render-anim package root exports
affects:
    - packages/render-anim/src/index.ts
actuals:
    tokens: 10816
    tasks: 6
    commits: 0
tech-stack:
    added: []
    patterns:
        - DataView / Uint8Array / TextDecoder / Blob / createImageBitmap
        - MotaOffscreenCanvas2D lazy per-frame composition
        - vi.mock module boundary for render barrel in Node tests
key-files:
    created:
        - packages/render-anim/src/parse.ts
        - packages/render-anim/src/animater.ts
        - packages/render-anim/src/__test__/parse.test.ts
        - packages/render-anim/src/__test__/animater.test.ts
    modified:
        - packages/render-anim/src/index.ts
        - .planning/phases/09-minimum-browser-runnable/09-54-SUMMARY.md
key-decisions:
    - ratio 折入 IAnimationObject.scale（rawScale * ratio），解析数据不含 ratio 成员
    - 清理策略采用用户决定的 1B：不使用 try/finally，下次 next 恢复后清理上一帧，正常完成释放最后一帧，提前 return 交给 GC
    - 测试用 vi.mock 替换 @motajs/render 边界，规避渲染包根在 Vitest 下的既有循环依赖
patterns-established:
    - 浏览器专用解析器只使用 Web 平台 API，不引入 Node / 原生图像依赖
    - 帧包围盒按旋转后轴对齐包围盒计算，mirror 不参与包围盒
duration: 约 12 分钟
completed: 2026-11-08T15:39:55+08:00
status: complete
---

# Phase 09 Plan 54: 浏览器动画运行时（v2 解析器 + 动画合成器）Summary

用 v2 二进制解析器 `parseRenderAnimation` 与惰性逐帧合成的 `RenderAnimater`，让 `@motajs/render-anim` 从类型骨架变成可运行的浏览器动画运行时。

## 本计划范围

`files_modified` 逐字如下（共 6 个路径）：

- `packages/render-anim/src/parse.ts`
- `packages/render-anim/src/animater.ts`
- `packages/render-anim/src/index.ts`
- `packages/render-anim/src/__test__/parse.test.ts`
- `packages/render-anim/src/__test__/animater.test.ts`
- `.planning/phases/09-minimum-browser-runnable/09-54-SUMMARY.md`

本计划编号为 09-54（09-01..09-53 已占用），波次 3，`depends_on: 09-52, 09-53`。只实现 v2 解析器、`RenderAnimater`、包根导出与测试；不改 `types.ts`、`package.json`、其它包、配置或既有计划 / 摘要；不新增依赖；不跑游戏 / 浏览器 / dev server；不执行 git 写命令，**0 次提交**。

Task 0 汇报关卡已按 AGENTS.md / D-03 完整汇报 v2 布局、解析顺序、帧公式与算例、动画器画布策略、命名表、已定取舍、180k 估算接受项、影响范围与验证形态，用户回复「可以执行」后进入 Task 1–5；命名按「导出与命名」表获得批准，未新增表外公开名称。

## v2 布局与解析结果

`parseRenderAnimation(buffer: ArrayBuffer): Promise<IAnimationParsedData>` 按下列布局读取：

- 头部 16 字节：`ANIM`（大端 `0x414e494d`）、UInt32LE version `2`、UInt32LE `imageDataSize`、UInt32LE `metaDataSize`。
- 偏移 16 起：UInt32LE `spriteCount`，随后 `spriteCount × 8` 字节的 sprite 宽高表，然后是单个 WebP。
- 偏移 `16 + imageDataSize` 起：`metaDataSize` 字节 UTF-8 JSON。
- 总长度恒等式：`16 + imageDataSize + metaDataSize === buffer.byteLength`。

解析顺序为先字节 / JSON 校验、再解码、再越界校验、最后构造纹理与帧：

1. 头部与总长度校验；`imageDataSize >= 4`、`metaDataSize >= 1`。
2. `spriteCount >= 1`，`spriteCount * 8 + 4 < imageDataSize`，每个 sprite 宽高 `>= 1`。
3. 切出 WebP 与元数据字节，`TextDecoder('utf-8')` 解码后 `JSON.parse`。
4. 校验 `ratio`、`blend`、`bitmaps`、`frame`、对象元组与音效字段。
5. `createImageBitmap(new Blob([webpBytes], { type: 'image/webp' }))`。
6. 按解码尺寸校验位图越界，失败先 `image.close()` 再抛出。
7. `new Texture(image)`，逐帧转换并返回 `{ texture, bitmaps, frames, blend }`。

`blend` 映射 `0 → AnimationBlendMode.Normal`、`1 → AnimationBlendMode.Add`。公开类型没有 ratio 成员，因此 `ratio` 折入 `IAnimationObject.scale`（保存 `rawScale * ratio`，仍是百分数），动画器用 `/ 100` 计算真实尺寸。

畸形输入覆盖：签名、版本、总长度、`imageDataSize` / `metaDataSize`、sprite 数量与尺寸、bitmap 数量、bitmap 坐标 / 尺寸 / 越界、帧对象索引、ratio、blend、opacity、mirror、音效字段。错误消息均为明确中文；不使用 `try-catch`，`JSON.parse` 与 `createImageBitmap` 的错误自然抛出。

## 帧包围盒 / 原点公式

对帧内每个对象：

- `eff = rawScale * ratio`（解析后即 `object.scale`）
- `w = bitmap.width * eff / 100`、`h = bitmap.height * eff / 100`
- `a = rotate * PI / 180`
- `hx = (w / 2) * |cos a| + (h / 2) * |sin a|`
- `hy = (w / 2) * |sin a| + (h / 2) * |cos a|`
- `minX = min(x - hx)`、`maxX = max(x + hx)`、`minY = min(y - hy)`、`maxY = max(y + hy)`
- `width = max(1, ceil(maxX - minX))`、`height = max(1, ceil(maxY - minY))`
- `originX = -minX`、`originY = -minY`

空帧为 1x1、原点 `0, 0`；`mirror` 不进入包围盒公式。

算例：

1. 单个 32×32、`ratio = 1`、`scale = 100`、`x = y = 0`、`rotate = 0`：`width = height = 32`，`originX = originY = 16`。
2. 同上但 `rotate = 45`：`hx = hy ≈ 22.627`，`width = height = 46`，`originX = originY ≈ 22.627`。
3. 空帧：`width = height = 1`，`originX = originY = 0`，动画器产出透明 1x1。

## 动画器行为

`RenderAnimater implements ITextureAnimater<IAnimationParsedData>`，`once` / `cycled` 委托私有生成器 `sequence`：

- 每帧 `new MotaOffscreenCanvas2D()`，`setHD(false)`、`setAntiAliasing(false)`、`size(frame.width, frame.height)`。
- 绘制顺序：`save` → `translate(frame.originX + object.x, frame.originY + object.y)` → `scale(-1, 1)`（mirror）→ `rotate(-object.rotate * Math.PI / 180)` → `globalAlpha = object.opacity / 255` → `drawImage(source, bitmap.x, bitmap.y, bitmap.width, bitmap.height, -realWidth / 2, -realHeight / 2, realWidth, realHeight)` → `restore`。
- yield `{ source: canvas.canvas, rect: { x: 0, y: 0, w: frame.width, h: frame.height } }`，`source` 是 `HTMLCanvasElement`。
- 清理策略（用户决定 1B，不使用 `try/finally`）：下次 `.next()` 恢复后对上一帧 `clear()` 并把物理宽高设为 `0`；`once` 正常完成时释放最后一帧；提前 `.return()` 跳过正常结束路径，最后一帧交给 GC，本计划不承诺 `.return()` 清理。
- 空帧创建 1x1 画布且不调用 `drawImage`；`frames` 为空时不 yield；不 dispose 源纹理；不实现帧计时 / 定时器 / 请求动画帧。

## Task 1 基线

- 8 条哈希基线（`types.ts`、`package.json`、`index.ts`、09-52 / 09-53 计划与摘要、`09-54-PLAN.md`）已写入 `process.env.TEMP/gsd-09-54-hashes.txt`；范围基线写入 `process.env.TEMP/gsd-09-54-status.txt`。
- `packages/render-anim` 工作树在 Task 1 时干净，`package.json` / `src/index.ts` / `src/types.ts` 已在 HEAD `7bf9fe9` 中跟踪。
- 工具链实测：`node v24.21.0`；`node_modules/vitest/vitest.mjs`、`prettier.cjs`、`eslint.js`、`vue-tsc.js` 均存在；`vite.config.ts` 的 `@motajs/*` 别名映射到 `packages/*/src`；`tsconfig.json` 的 `include` 覆盖 `packages/**/*.ts`。

## 门禁真实结果

- `node node_modules/vitest/vitest.mjs run packages/render-anim`：`Test Files 2 passed (2)`、`Tests 30 passed (30)`。
- `node node_modules/prettier/bin/prettier.cjs --check <5 files>`：`All matched files use Prettier code style!`。
- `node node_modules/eslint/bin/eslint.js <5 files>`：无输出，退出码 0。
- CRLF / BOM / 制表符门禁：`OK: all 5 files are CRLF, no tabs, no BOM`。
- 静态内容门禁：解析器关键 token、`parseRenderAnimation` jsDoc、浏览器专用 / 无副作用检查均 `OK`；`parse.ts exports only parseRenderAnimation`；动画器 shape / jsDoc / `animater.ts exports only RenderAnimater` 均 `OK`；`index.ts has exactly the 3 exports in order`。
- 类型门禁：已运行。`sentinel: vue-tsc Version 6.0.3 | type check exit 2`（仓库既有错误导致全仓退出码 2），过滤后 `OK: no render-anim diagnostics`。
- 哈希闸门：`changed: packages/render-anim/src/index.ts ...`，`OK: only index.ts changed among baseline`。
- 写前范围闸门：`addedIn` 恰为 4 个新文件加 ` M packages/render-anim/src/index.ts`，`extra` / `missing` / `removedIn` / `addedOut` / `removedOut` 均空，输出 `OK: pre-write range matches the 5 expected entries`。
- 写后范围闸门：`addedIn` 恰为 4 个新文件、` M packages/render-anim/src/index.ts` 与 `?? .planning/phases/09-minimum-browser-runnable/09-54-SUMMARY.md`，`extra` / `missing` / `removedIn` / `addedOut` / `removedOut` 均空。

## 未做 / 跳过项与已知限制

- **不做浏览器 E2E**：不运行游戏 / 浏览器 / dev server，不使用真实 WebP 素材；运行时浏览器行为不做主张。测试只在 Node 环境以 mock `createImageBitmap` 与假画布验证纯逻辑与绘制调用参数。
- 不运行 `pnpm install`；不执行 git 写命令，0 次提交。
- **OI-9**：sprite 尺寸表只校验 `>= 1` 与用于计算 WebP 偏移，不与元数据 `bitmaps` 或解码后的 `image.width` / `image.height` 交叉比对；裁剪矩形以 `bitmaps` 为准。
- **OI-10**：范围闸门以 Task 1 的 porcelain 路径集合为基线，相关根之外的新增 / 删除条目必须为空；基线中已存在的包外脏条目若被外部改动，其内容漂移在路径集合中不可见。本计划执行期间未并发修改工作树，`packages/render-anim` 在 Task 1 已断言干净。

## 偏差与执行说明

1. **[Rule 3 - 阻塞] 测试改为 mock `@motajs/render` 模块边界**：真实渲染包根在 Vitest 的模块转换下暴露既有循环依赖（`core/index.ts` 先导出 `graphics.ts`，而 `graphics.ts` 从 `'.'` 取 `RenderItem`，此时 `./item` 尚未导出，导致 `Class extends value undefined`）。测试改为在 `vi.hoisted` 中定义假 `Texture` / `MotaOffscreenCanvas2D` 并 `vi.mock('@motajs/render')`，仍以假画布、假 2D context 与 mock `createImageBitmap` 验证解析、帧数学、生成器序列、清理与不 dispose 纹理。未修改 `packages/render` 或任何配置。
2. **[格式] 旋转表达式保留计划字面量**：Prettier 会把 `-object.rotate * Math.PI / 180` 改写成 `(-object.rotate * Math.PI) / 180`，为同时满足计划门禁的字面量与 `prettier --check`，在该行前使用 `// prettier-ignore`；语义不变。
3. 为满足计划门禁的 `canvas.clear()` 字面量，`sequence` 的上一帧变量命名为 `canvas`，行为与设计一致。

## 待确认项 / 已定项

- **OI-1**：`parseRenderAnimation`、`RenderAnimater` 与内部名称按「导出与命名」表经 Task 0 批准。
- **OI-2**：公开类型无 ratio 成员，`ratio` 折入 `IAnimationObject.scale`。
- **OI-3**：清理策略已由用户决定为 1B（不使用 `try/finally`；不承诺 `.return()` 清理）。
- **OI-4**：raw 帧对象元组接受 5–7 个元素，缺省 `mirror` / `rotate` 为 0。
- **OI-5**：解析器不修改 `Texture.isBitmap`；`data.texture` 由调用方拥有并负责 `dispose()`。
- **OI-6**：运行时浏览器行为不做 E2E 测试（可见跳过）。
- **OI-7**：`estimate` 为 180k、`confidence: low`，未校准，超出 100k 智能区间预算；用户已明确接受保持单个组合计划、不拆分为 09-54 / 09-55，本计划不声称符合智能区间预算。
- **OI-8**：09-52 / 09-53 产物已提交（HEAD `7bf9fe9`）；本计划 0 次提交，改动留在工作树供审阅。

## 估算与实际

- 估算：`tokens: 180000`、`tasks: 6`、`confidence: low`（未校准，超出 100k 智能区间预算，用户已接受不拆分）。
- 实际（按最终文件 chars/4 测量，仅 5 个源码 / 测试文件）：约 `tokens: 10816`；`tasks: 6`；`commits: 0`。
- 最终行数：`parse.ts` 430 行、`animater.ts` 129 行、`index.ts` 4 行、`parse.test.ts` 493 行、`animater.test.ts` 377 行。

## Self-Check

- 5 个源码 / 测试文件与 SUMMARY 均存在且为 CRLF、无 BOM、无制表符。
- targeted vitest 30 个测试全部通过；prettier / eslint / 静态内容 / 哈希 / 范围门禁通过；过滤类型门禁为 0 行 render-anim 诊断。
- 0 次提交，未越界写包外文件。
