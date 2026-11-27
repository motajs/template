---
phase: 09-minimum-browser-runnable
plan: 56
subsystem: render-anim
tags:
    - render-anim
    - animation
    - jsdoc
    - logger
    - error-codes
    - single-canvas
    - vitest
requires:
    - 09-55 parseRenderAnimation v2 binary parser with logger.error codes 82..95
provides:
    - parse.ts multi-line jsDoc and meaningful inline comments for 12 top-level functions
    - logger.json error codes merged from 82..95 into 82..91 with specific messages
    - animater.ts single offscreen canvas reuse per sequence
    - parse.test.ts updated expected codes, arity map and static guard
    - animater.test.ts single-canvas semantics (9 tests)
affects:
    - packages/render-anim/src/parse.ts
    - packages/render-anim/src/animater.ts
    - packages/render-anim/src/__test__/parse.test.ts
    - packages/render-anim/src/__test__/animater.test.ts
    - packages/common/src/logger.json
actuals:
    tokens: 24494
    tasks: 6
    commits: 0
tech-stack:
    patterns:
        - one MotaOffscreenCanvas2D per sequence, resized per frame with canvas.size
        - logger.error only receives low-cardinality reason labels, numbers, field names, '-' placeholders
        - logger.json error 82..91 with matching $n arity 3/2/2/6/10/4/5/5/2/2
key-files:
    modified:
        - packages/render-anim/src/parse.ts
        - packages/render-anim/src/animater.ts
        - packages/render-anim/src/__test__/parse.test.ts
        - packages/render-anim/src/__test__/animater.test.ts
        - packages/common/src/logger.json
        - .planning/phases/09-minimum-browser-runnable/09-56-SUMMARY.md
key-decisions:
    - sequence creates exactly one MotaOffscreenCanvas2D after the empty-frames guard and reuses it
    - composeFrame(canvas, texture, data, frame): void resizes with canvas.size each frame and no longer constructs a canvas
    - normal completion calls canvas.clear() and zeroes canvas.canvas.width / height; early .return() does not use finally
    - logger.json error 82..95 merged into 82..91, 92..95 deleted, 1..81 / 2001..2008 / warn incl. 213 and 1001 verbatim
    - parse.ts logger call sites pass only reason labels, numbers, field names, '-' or the 91 reason message
    - the class-level jsDoc of RenderAnimater is preserved verbatim and no class comment is added
patterns-established:
    - readRawMeta comment precedes the !isRecord(meta) guard so the compact static assertion stays stable
    - animater tests assert const canvas = fakes.instances[0] plus canvas.canvas.width / height
duration: 约 14 分钟
completed: 2026-11-09T18:30:00+08:00
status: complete
---

# Phase 09 Plan 56: 动画解析器注释 / logger 合并与单画布复用 Summary

为 `@motajs/render-anim` 补齐 `parse.ts` / `animater.ts` 的注释与 jsDoc、把 logger error 82–95 合并为 82–91，并把 `sequence` 从每帧新建离屏画布改为每个序列复用一块画布。

## 本计划范围

`files_modified` 共 6 个路径：

- `packages/render-anim/src/parse.ts`
- `packages/render-anim/src/animater.ts`
- `packages/render-anim/src/__test__/parse.test.ts`
- `packages/render-anim/src/__test__/animater.test.ts`
- `packages/common/src/logger.json`
- `.planning/phases/09-minimum-browser-runnable/09-56-SUMMARY.md`

本计划编号为 09-56（09-01..09-55 已占用），波次 5，`depends_on: 09-55`。只写上述 5 个目标文件与本 SUMMARY；`types.ts` / `index.ts` / `package.json` 只验证不改（哈希基线一致）；不跑游戏 / 浏览器 / dev server / `pnpm install`；不执行 git 写命令，**0 次提交**。

## 文件清单

| 文件 | 变更 |
|------|------|
| `packages/render-anim/src/parse.ts` | 12 个顶层函数多行 jsDoc + 行内注释、logger 调用点改为 82–91、删除导出 region 与 `// prettier-ignore` |
| `packages/render-anim/src/animater.ts` | 单画布复用、composeFrame / sequence 多行 jsDoc、删除 3 组 region 与 once / cycled jsDoc、类级 jsDoc 原样保留 |
| `packages/render-anim/src/__test__/parse.test.ts` | 期望码 82–91、注释同步、ERROR_PARAM_COUNTS 与 arity 断言、静态闸门更新 |
| `packages/render-anim/src/__test__/animater.test.ts` | 9 条单画布语义用例 |
| `packages/common/src/logger.json` | error 82–91 共 10 条具体消息，删除 92–95 |
| `.planning/phases/09-minimum-browser-runnable/09-56-SUMMARY.md` | 本摘要 |

## 测试数量

- `parse.test.ts`：70 个用例（实测）。
- `animater.test.ts`：9 个用例（实测）。
- 合计：79 passed。

**说明：** 实测基线为 70 个 parse 用例 + 9 个 animater 用例 = 79 passed；79 是合计，不是 parse 用例数。此前规划输入曾误写成 79 parse，本计划以实测 70 + 9 为准。改写后 parse 用例仍为 70、animater 仍为 9，数量未退化。

`parse.test.ts` 新增 `ERROR_PARAM_COUNTS`（82–91 → 3/2/2/6/10/4/5/5/2/2），`expectFailure` 额外断言 `loggerMock.error.mock.calls[0].length === ERROR_PARAM_COUNTS[code] + 1`，校验调用点 arity 而不只是错误码存在。

## 错误码映射表（旧 → 新）

| 旧码 | 新码 | 触发位置 |
|------|------|----------|
| 82 | 82 | 容器头过短 / 头部长度不一致 |
| 83 | 83 | 签名不匹配 |
| 84 | 84 | 版本不支持 |
| 85 | 82 | 总长度不一致（旧 85 并入 82） |
| 86 | 85 | sprite 数量 < 1 / 尺寸表越界 / 宽高 < 1 |
| 87 | 86 | 位图列表非数组 / 数量不符 / 项非对象 / 字段非法 / 解码后越界 |
| 88（帧结构） | 87 | frame 非数组 / 帧项非对象 / objects 非数组 / sound 非数组 |
| 88（对象项非数组 / 元组 4 元 / 元组 8 元） | 88 | not-tuple / invalid-field-count |
| 88（元数据非对象） | 90 | readRawMeta 守卫与 validateMeta 纵深防御 |
| 89 | 88 | 对象位图索引越界 / 非整数 |
| 90 | 88 | 对象 x / y / scale / opacity / mirror / rotate 非法 |
| 91 | 89 | ratio 非法 |
| 92 | 89 | blend 非法 |
| 93 | 89 | 音效项非对象 / name / volume / pitch 非法 |
| 94 | 90 | 元数据 JSON 解析失败（invalid-json） |
| 95 | 91 | 图像解码失败（decode-failed）/ 纹理创建失败（texture-failed） |

- 92–95 已删除；`1..81`、`2001..2008` 与整个 `warn` 段（含并发 `213` 与既有 `1001`）逐字未变。
- 未新增任何 `1000+` 码。

## 行为变更说明

- `sequence` 在 `frames.length === 0` 判断之后只创建一块 `MotaOffscreenCanvas2D`，`setHD(false)` / `setAntiAliasing(false)` 各一次。
- `composeFrame(canvas, texture, data, frame): void` 每帧首行 `canvas.size(frame.width, frame.height)`（重设尺寸会重置变换矩阵并清空上一帧），内部不再构造画布。
- 每帧 `yield` 同一个 `canvas.canvas`，`rect` 仍为 `{ x: 0, y: 0, w: frame.width, h: frame.height }`。
- 正常播放结束 `canvas.clear()` 并把 `canvas.canvas.width` / `height` 置 0；提前 `.return()` 不写 `finally`、不做兜底清理，最后一帧留在同一画布交给垃圾回收。
- `composeFrame` 签名由 `(texture, data, frame) => MotaOffscreenCanvas2D` 改为 `(canvas, texture, data, frame) => void`，方法名与其它成员名不变。

## 注释 / jsDoc 变更

- `parse.ts` 12 个顶层函数（`isRecord` / `isNumber` / `isInteger` / `readHeader` / `readSpriteDimensions` / `readRawMeta` / `validateMeta` / `validateBitmapBounds` / `toObject` / `toFrame` / `computeFrameBox` / `toBlendMode`）改为紧邻 `function` 的多行 jsDoc，带 `@param` / `@returns`，无 `@throws`。
- 补充字节偏移、校验顺序、帧包围盒半宽 / 半高公式、先 close 再记日志等行内注释；`readRawMeta` 的 primitive 注释位于 `if (!isRecord(meta))` 之前。
- `animater.ts` 的 `composeFrame` / `sequence` 改为多行 jsDoc；删除 `once` / `cycled` 的 jsDoc（`ITextureAnimater` 接口已文档化）。
- 删除 `animater.ts` 全部 3 组 `#region` / `#endregion`；删除 `parse.ts` 的导出 region（保留其余 3 个功能性 region）。
- 删除两处 `// prettier-ignore`（86 号多参数调用自然换行；`ctx.rotate` 提取 `angle` 中间量）。
- 类级 jsDoc 全块逐字未动；文件恰有 3 个 `/**` 块（类 + composeFrame + sequence），未新增任何类级注释。
- 成员名集合保持 `composeFrame` / `cycled` / `once` / `sequence`（`composeFrame` 仅改签名）。

## 类级 jsDoc 文档债

类级 jsDoc 中「每次 `.next()` 恢复后会释放上一帧」在单画布复用后已不准确（现在复用同一块画布、不逐帧释放）；按用户要求逐字保留，未经另行批准不得改写。

## 明确未改项

- 未把 `if (!x) return` 一类提前返回当作违规改写。
- 未改动 `validateMeta` 的嵌套层级与结构。
- 可选原始字段仍使用 `!== undefined`（`object[5]` / `object[6]` / `item.volume` / `item.pitch`）。
- `isRecord` 仍使用 `value !== null`（未引入 `isNil` / `!value`）。
- 未改 `parseRenderAnimation` 的签名、3 处窄 `try/catch` 与可空返回；无 `throw` / `finally`；`new Blob` 在 `try` 外；位图越界先 close 再记日志；纹理失败先 close。

## 门禁结果

- `node node_modules/vitest/vitest.mjs run parse.test.ts animater.test.ts`：2 files / 79 passed（70 parse + 9 animater）。
- `prettier --check`：5 个改动文件全部通过。
- `eslint`：两个源码 + 两个测试，无 error / warning。
- CRLF / 无 BOM / 无 tab：5 个改动文件全部通过。
- `vue-tsc --version` 哨兵通过（Version 6.0.3）；`--noEmit --incremental false` 过滤 `packages[\\/]render-anim` 诊断为 0 行（全仓其它包既有诊断导致进程退出码 2，不参与判定）。
- 仓库根目录无 `*.tsbuildinfo`，`git status` 无 `tsbuildinfo` 条目。
- 综合静态门禁：animater 无 region / 无 `// prettier-ignore` / 类级 jsDoc 全块逐字一致且紧邻类声明 / 恰 3 个 `/**` 块 / 成员名集合不变 / once / cycled 无 jsDoc / sequence 恰 1 处画布构造 / composeFrame 内不构造 / 无 try / finally；parse 无导出 region / 无 `// prettier-ignore` / 无 `@throws` / 无字面量内容含空格 / 12 个 jsDoc 紧邻 `function` / 必需行内注释齐全且 readRawMeta 注释在守卫之前 / try 恰 3 处 / 82–91 全在、92–95 不在 / 可选字段与 isRecord 不变量保留；logger 82–91 两两不同且非 `$1`-only；测试文件无 92–95 且含 arity 映射与断言。
- 哈希闸门：排除 `09-56-PLAN.md` 后比较 8 条基线，恰有 5 个目标文件变化，`types.ts` / `index.ts` / `package.json` 不变。
- 写后范围闸门：`git status` 仅新增本 `09-56-SUMMARY.md`，无其它新增 / 删除条目。

## 偏差

无。计划命令均可按原样执行，未发现需要修正的计划命令缺陷；未触发行为 / 代码歧义。

## 未校准估算

`confidence: low`、`tokens: 110000`（7 个任务 / 110k 仅为 advisory 建议值；plan-checker 已指出可能超出 smart-zone，但按用户要求保持单计划不拆分，不作为拆分依据、不阻断执行）。本次按改动文件 `chars/4` 实测约 24494 tokens。

## 可见跳过

spec-less probe fallback skipped: phase has no requirement IDs to probe (visible skip)。
