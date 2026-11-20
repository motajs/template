---
phase: 09-minimum-browser-runnable
plan: 55
subsystem: render-anim
tags:
    - render-anim
    - animation
    - binary-parser
    - logger
    - error-codes
    - vitest
requires:
    - 09-54 parseRenderAnimation v2 binary parser
provides:
    - parseRenderAnimation nullable return with logger.error code paths
    - common logger error codes 82..95 for animation parsing
    - @motajs/common workspace dependency for render-anim
affects:
    - packages/render-anim/src/parse.ts
    - packages/common/src/logger.json
actuals:
    tokens: 18950
    tasks: 6
    commits: 0
tech-stack:
    added:
        - '@motajs/common workspace:* dependency'
    patterns:
        - logger.error(code, ...params) then return null for invalid runtime data
        - minimal try/catch around JSON.parse / createImageBitmap / new Texture only
        - vi.mock @motajs/common logger plus @motajs/render fakes in Node tests
key-files:
    modified:
        - packages/render-anim/src/parse.ts
        - packages/render-anim/src/__test__/parse.test.ts
        - packages/render-anim/package.json
        - packages/common/src/logger.json
        - .planning/phases/09-minimum-browser-runnable/09-55-SUMMARY.md
key-decisions:
    - parseRenderAnimation now returns Promise<IAnimationParsedData | null>; callers check for null
    - animation parsing failures use logger.error 82..95 and return null instead of throwing
    - try/catch is limited to JSON.parse (94), createImageBitmap (95) and new Texture (95)
    - bitmap overflow captures imageWidth / imageHeight before image.close() and logs 87 with captured sizes
    - readRawMeta rejects non-object JSON (42 / null / 0 / false / "") with code 88
    - logger.json keeps the concurrent warn 213 entry verbatim and only appends error 82..95
patterns-established:
    - external throwing calls are wrapped individually; Blob construction and object guards stay outside try
    - validators use early-exit for loops instead of forEach so return false ends the function
duration: 约 18 分钟
completed: 2026-11-08T19:08:00+08:00
status: complete
---

# Phase 09 Plan 55: 动画解析器日志化（可空返回 + 82–95 错误码）Summary

把 `parseRenderAnimation` 从抛异常改为 `logger.error` + 返回 null，并接入 `@motajs/common` 与 82–95 错误码。

## 本计划范围

`files_modified` 逐字如下（共 5 个路径）：

- `packages/render-anim/src/parse.ts`
- `packages/render-anim/src/__test__/parse.test.ts`
- `packages/render-anim/package.json`
- `packages/common/src/logger.json`
- `.planning/phases/09-minimum-browser-runnable/09-55-SUMMARY.md`

本计划编号为 09-55（09-01..09-54 已占用），波次 4，`depends_on: 09-54`。只改上述 4 个代码 / 配置文件与本 SUMMARY；`types.ts` / `animater.ts` / `index.ts` 未动（哈希基线一致）；不改其它包、根配置或既有计划 / 摘要；不跑游戏 / 浏览器 / dev server / `pnpm install`；不执行 git 写命令，**0 次提交**。

## Task 0 批准记录

Task 0 的 `checkpoint:human-verify gate="blocking-human"` 已向用户完整汇报可空签名、82–95 错误码表与 `$1` 明细串、`@motajs/common` 依赖及排序、`try/catch` 三处作用域与 dev.md 例外理由、唯一被改写的 `parseRenderAnimation` jsDoc、测试与影响范围、0 次提交；用户回复「可以执行」后进入 Task 1–5。

## 签名变更

`parseRenderAnimation(buffer: ArrayBuffer): Promise<IAnimationParsedData | null>`。

成功返回 `IAnimationParsedData`；任一步校验或解码失败时先 `logger.error(code, ...)` 再返回 `null`，由调用方判空。解析器全文不出现 `throw` / `@throws` / `finally`。

## 错误码表（82–95）

| code | 文本 | 触发位置 |
|------|------|----------|
| 82 | `Cannot parse animation: buffer is too short, got $1 bytes while the $2 byte header is required.` | `readHeader` 缓冲区短于 16 字节 |
| 83 | `Cannot parse animation: invalid signature 0x$1, expected 0x$2.` | `readHeader` 签名不匹配 |
| 84 | `Cannot parse animation: unsupported version $1, expected version $2.` | `readHeader` 版本不支持 |
| 85 | `Cannot parse animation: data length mismatch, imageDataSize: $1, metaDataSize: $2, buffer length: $3.` | `readHeader` 长度字段 / 总长度不符 |
| 86 | `Cannot parse animation: $1.` | sprite 数量、尺寸与尺寸表越界（`sprite count ...` / `sprite N has invalid size ...` / `sprite table ... exceeds ...`） |
| 87 | `Cannot parse animation: $1.` | 位图列表 / 数量 / 字段 / 解码后越界（越界明细含 `exceeds the decoded image 16 x 16`） |
| 88 | `Cannot parse animation: $1.` | `readRawMeta` 的非对象 JSON 守卫，以及帧 / 元组 / sound 结构 |
| 89 | `Cannot parse animation: invalid object index $1 at frame $2, expected an integer in [0, $3).` | 对象位图索引越界或非整数 |
| 90 | `Cannot parse animation: $1.` | x / y / scale / opacity / mirror / rotate 字段 |
| 91 | `Cannot parse animation: invalid ratio $1, expected a positive finite number.` | ratio 非正或非数字 |
| 92 | `Cannot parse animation: invalid blend mode $1, expected 0 (normal) or 1 (add).` | blend 非 0 / 1 |
| 93 | `Cannot parse animation: $1.` | 音效名称 / 音量 / 音高 / 音效项 |
| 94 | `Cannot parse animation: cannot parse metadata JSON. $1` | `JSON.parse` 失败，`$1` 固定为脱敏常量 `metadata is not valid JSON` |
| 95 | `Cannot parse animation: cannot decode image or create texture. $1` | `createImageBitmap` 或 `new Texture` 抛错，`$1` 为异常 message |

`logger.json` 的 `error` 段在 `"81"` 之后、`"2001"` 之前追加这 14 条；`warn` 段（含并发新增的 `213`）与既有 error `1..81` / `2001..2008` 逐字未变，未使用 `1000+` 码段。

元数据为 JSON 原语 `42` / `null` / `0` / `false` / `""` 时，`JSON.parse` 会成功返回同名原语；`readRawMeta` 在 `try` 之后用 `!isRecord(meta)` 守卫记 88 并返回 `null`，不会让 `if (!meta) return null;` 在 `validateMeta` 之前静默短路。

## `try/catch` 例外说明

全文件恰有 3 处 `try {`，块体内分别只有：

1. `meta = JSON.parse(text);`（失败记 94，脱敏常量，不读 `error.message`）
2. `image = await createImageBitmap(webpBlob);`（失败记 95）
3. `texture = new Texture(image);`（失败先 `image.close()`，再记 95）

`const webpBlob = new Blob([webpBytes], { type: 'image/webp' });` 在 `try` 之前构造；`!isRecord(meta)` 守卫与 `return meta` 在 `try` 之后；不写 `finally`。这是对 dev.md「不建议写 `try-catch-finally`」的显式例外：这三处是外部 API 的天然抛错点，畸形动画文件属于运行时数据条件，用户已决定「记录日志后返回 null」。

位图越界时先捕获 `imageWidth` / `imageHeight`（在 `image.close()` 之前），再 `image.close()`，再用捕获值记录 87 并返回 `false`；日志不得在 `close()` 之后读取 `image.width` / `image.height`。

## 测试结果

- `packages/render-anim/src/__test__/parse.test.ts`：`Test Files 1 passed (1)`、`Tests 70 passed (70)`。
- 11 个 09-54 成功用例全部保留（改用 `parseOk` 收窄类型），断言内容不变。
- 失败用例逐条断言 `null` + 精确 `logger.error` 首个实参，覆盖 82–95 全部码；含 5 条非对象 JSON（`42` / `null` / `0` / `false` / `""`，88）、非法 JSON（94）、解码失败（95）、纹理失败（95）。
- 越界用例额外断言 `close` 被调用，且 `logger.error.mock.calls[0][1]` 含 `exceeds the decoded image 16 x 16`；纹理失败用例额外断言 `close` 被调用。
- 新增静态闸门用例：读取 `packages/render-anim/src/parse.ts`，断言无 `throw` / `@throws`、恰 3 处 `try {`、无 `finally`、三处 `try` 块体只有三个外部调用、`new Blob` 在 `try` 外、`!isRecord` 守卫在 `try` 后，并断言 `validateMeta` / `validateBitmapBounds` 体内无 `forEach`。
- 每个 `it` 前均有一行中文注释。

## 门禁真实结果

- `prettier --check`：对 `parse.ts` / `parse.test.ts` / `package.json` / `logger.json` 全部 `All matched files use Prettier code style!`。
- `eslint`：对 `parse.ts` / `parse.test.ts` 无输出，退出码 0。
- CRLF / BOM / 制表符：4 个改动文件与 SUMMARY 均 `lf===crlf`、`tabs=0`、`bom=false`。
- 范围闸门：写前 `addedIn` 恰为 ` M packages/render-anim/package.json` 且 SUMMARY 不存在；写后恰为 ` M packages/render-anim/package.json` 与 `?? .planning/phases/09-minimum-browser-runnable/09-55-SUMMARY.md`，`extra` / `missing` / `removedIn` / `addedOut` / `removedOut` 为空。
- 哈希闸门：10 条基线中只有 `parse.ts` / `parse.test.ts` / `package.json` / `logger.json` 变化；`types.ts` / `animater.ts` / `index.ts` / 09-54 计划与摘要 / `09-55-PLAN.md` 哈希不变。
- `logger.json` 深比较：既有 error 码与整个 `warn` 段（含 `213`）逐字未变；新增码恰为 82–95；未使用 `1000+`。
- `$n` 占位数量与调用点一致；82–95 消息与计划「错误码映射」表逐字一致。
- `parse.ts` 静态门禁：无 `throw` / `@throws` / `finally`，恰 3 处 `try {`，签名 `Promise<IAnimationParsedData | null>`，全部 82–95 出现在 `logger.error` 调用点。

## 类型检查

- 哨兵：`vue-tsc Version 6.0.3`。
- `vue-tsc --noEmit`：全仓退出码 2（既有其它包诊断导致），过滤 `packages/render-anim` 后诊断行数为 **0**。
- 全仓既有诊断与总退出码不参与本计划判定。

## 偏差与执行说明

1. **[Rule 1 - Bug] 非数字 ratio / blend / index 的 `.toString()` 会抛错**：`JSON.stringify(NaN)` 产出 `null`，`meta.ratio.toString()` / `meta.blend.toString()` / `index.toString()` 在值为 `null` 时会抛 `TypeError`，违反「解析器无 throw」。改为 `String(meta.ratio)` / `String(meta.blend)` / `String(index)`，其余实参仍为数字，已字符串化。真机 vitest 曾以 2 个失败暴露该问题，修复后 70 个用例全过。
2. **[格式] `// prettier-ignore` 保留 87 日志单行**：计划门禁要求 `image.close()` 之后出现连续的 `logger.error(87`，而 Prettier 因模板串过长会拆分实参列表。仅在该语句前添加 `// prettier-ignore`（与 09-54 的同类做法一致），语义不变。
3. **[类型门禁] `node:fs` 需要 `@ts-expect-error`**：`vue-tsc` 根程序未加载 Node 类型（实测 `import ... from 'fs'` 同样报 TS2591），静态闸门用例需要 `readFileSync` 读取源码。按 dev.md「无法避免类型错误时使用 `// @ts-expect-error` 并说明原因」添加带说明的指令，过滤后 `packages/render-anim` 诊断为 0。
4. **[已知误报，未削弱门禁] Task 3 的 `validateBitmapBounds` 切片门禁**：计划里的 `seg('function validateBitmapBounds', 'export async function parseRenderAnimation')` 会连带包含 `computeFrameBox` 的合法 `forEach`（该函数按计划保持 09-54 原样），因此该门禁必然报 `validateBitmapBounds uses forEach`。未修改门禁、也未改动 `computeFrameBox`；另用花括号匹配提取 `validateMeta` / `validateBitmapBounds` 自身函数体，确认二者均无 `forEach`、均有 `for` 与 `return false`，与计划意图一致。

## 已知限制

- **OI-6**：未运行 `pnpm install`，`pnpm-lock.yaml` 未更新，`packages/render-anim/node_modules` 无 `@motajs/common` 链接；测试与类型检查依赖 `vite.config.ts` / `tsconfig.json` 的 `@motajs/*` 路径映射解析到源码。
- **OI-7**：`logger.error` 的引用页（`error2.html`）未生成 / 未修改，仅写入 `logger.json`。
- **OI-8**：不做浏览器 E2E，不跑游戏 / dev server，不使用真实 WebP 素材；测试只在 Node 环境以 mock `createImageBitmap`、假 `Texture` 与 mocked `logger` 验证纯逻辑。

## 未校准估算

- `confidence: low`、`tokens: 90000` 为**未校准**建议值（6 个任务 / 90k 仅为 advisory，不作为拆分依据，也未再切分）。
- 实际（按最终文件 chars/4 测量，4 个改动文件）：约 `tokens: 18950`；`tasks: 6`；`commits: 0`。

## Self-Check

- 4 个代码 / 配置文件与 SUMMARY 均存在且为 CRLF、无 BOM、无制表符。
- targeted vitest 70 个测试全部通过；prettier / eslint / 静态内容 / 哈希 / 范围 / `logger.json` 深比较门禁通过。
- 过滤类型门禁为 0 行 `packages/render-anim` 诊断。
- 0 次提交；未越界写包外文件。
