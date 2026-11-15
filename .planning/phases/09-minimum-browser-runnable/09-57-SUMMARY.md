---
phase: 09-minimum-browser-runnable
plan: 57
subsystem: render-anim
tags:
    - render-anim
    - animation
    - logger
    - error-codes
    - low-cardinality
    - vitest
requires:
    - 09-56 parseRenderAnimation parser diagnostics with logger.error 82..91 and single-canvas animater
provides:
    - parse.ts logger.error call sites narrowed to reason label plus matching index
    - logger.json error codes 82..96 with specific messages
    - parse.test.ts expected codes, arity map and no-value static guard
affects:
    - packages/render-anim/src/parse.ts
    - packages/render-anim/src/__test__/parse.test.ts
    - packages/common/src/logger.json
actuals:
    tokens: 15000
    tasks: 7
    commits: 0
tech-stack:
    patterns:
        - logger.error only receives a kebab-case reason label and/or a numeric index via toString()
        - at most three parameters per logger.error call, no concrete values
        - logger.json error 82..96 with $n arity 1/0/0/1/1/1/2/1/0/2/3/1/3/1/1
key-files:
    modified:
        - packages/render-anim/src/parse.ts
        - packages/render-anim/src/__test__/parse.test.ts
        - packages/common/src/logger.json
        - .planning/phases/09-minimum-browser-runnable/09-57-SUMMARY.md
key-decisions:
    - parser diagnostics carry only a reason label plus the matching index; concrete values are dropped
    - 92 and 94 pass frameIndex first, object/sound index second, reason last; $1 frame, $2 item index, $3 reason
    - bitmap out-of-bounds and texture failures close the image before logging
    - the two catch blocks are unbound (catch { ... }) and the old reason variable is removed
    - 09-56 jsDoc, inline comments, 3 regions, class-level jsDoc and the single-canvas animater stay untouched
patterns-established:
    - multi-line logger.error 92..96 calls keep one argument per line to satisfy printWidth 80
    - the no-value static guard extracts balanced-paren arguments inline in the existing static-guard it
duration: 约 15 分钟
completed: 2026-11-09T21:25:00+08:00
status: complete
---

# Phase 09 Plan 57: 动画解析器 logger 去参数化 Summary

把 `@motajs/render-anim` 的 `parse.ts` 解析器诊断从「大量具体值」收紧为「错误原因 + 对应索引」，并把 `logger.json` 的 error 段重写为 82–96 共 15 条具体消息。

## 本计划范围

`files_modified` 共 4 个路径：

- `packages/render-anim/src/parse.ts`
- `packages/render-anim/src/__test__/parse.test.ts`
- `packages/common/src/logger.json`
- `.planning/phases/09-minimum-browser-runnable/09-57-SUMMARY.md`

本计划编号为 09-57（09-01..09-56 已占用），波次 6，`depends_on: 09-56`。只写上述 3 个目标文件与本 SUMMARY；`animater.ts` / `types.ts` / `index.ts` / `package.json` 只验证不改（哈希基线一致）；不跑游戏 / 浏览器 / dev server / `pnpm install`；不执行 git 写命令，**0 次提交**。Task 0 汇报关卡已由用户「可以执行」通过，本摘要记录 Task 1–6 的执行结果。

## 文件清单

| 文件 | 变更 |
|------|------|
| `packages/render-anim/src/parse.ts` | 39 处 `logger.error` 收敛为 82–96 的「原因 + 索引」，至多 3 参数；两个 catch 改为无绑定并删除 `reason` |
| `packages/render-anim/src/__test__/parse.test.ts` | 期望码 82–96、注释同步、`ERROR_PARAM_COUNTS` 与 arity 断言、无值实参静态闸门、92/94 参数顺序断言；仍 70 用例 |
| `packages/common/src/logger.json` | error 82–96 共 15 条具体消息；`1..81` / `2001..2008` / `warn`（含 213 / 1001）逐字未变 |
| `.planning/phases/09-minimum-browser-runnable/09-57-SUMMARY.md` | 本摘要 |

## 错误码映射（09-56 → 09-57）

09-56 的 82–91 每条携带大量具体值（buffer 长度、签名、尺寸、x/y/w/h、图像宽高、JSON 大小、异常 message 等）；09-57 把它们重新划分为 82–96 的「具体上下文 + reason: '$n' / 索引」，每条消息两两不同：

| 新码 | 触发位置（只传原因 / 索引） |
|------|------------------------------|
| 82 | 头部过短 `buffer-too-short` / 长度不符 `length-mismatch` |
| 83 | 签名非法（0 参） |
| 84 | 版本不支持（0 参） |
| 85 | sprite 表非法 `invalid-count` / `table-overflow` |
| 86 | 单个 sprite 宽或高 < 1（索引） |
| 87 | 位图列表非法 `not-array` / `count-mismatch` |
| 88 | 位图项非法（索引 + `not-object` / `invalid-x` / `invalid-y` / `invalid-width` / `invalid-height`） |
| 89 | 解码后位图越界（索引） |
| 90 | 帧列表非法（0 参） |
| 91 | 帧项非法（帧索引 + `not-object` / `objects-not-array` / `sound-not-array`） |
| 92 | 对象非法（帧索引 + 对象索引 + 原因） |
| 93 | 标量字段非法 `invalid-ratio` / `invalid-blend` |
| 94 | 音效非法（帧索引 + 音效索引 + 原因） |
| 95 | 元数据非法 `invalid-json` / `not-object` |
| 96 | 图像失败 `decode-failed` / `texture-failed` |

- 92–95 从 09-56 的「已删除」重新作为合法码加入（92 对象 / 93 标量 / 94 音效 / 95 元数据），96 为图像失败。
- 92 / 94 固定帧索引在前、对象 / 音效索引在后、原因最后（消息 `$1` 帧、`$2` 对象 / 音效索引、`$3` 原因）。
- `1..81`、`2001..2008` 与整个 `warn` 段（含并发 `213` 与既有 `1001`）逐字未变；未新增任何 `1000+` 码。

## 测试数量

- `parse.test.ts`：70 个用例（改写前后均为 70，未新增 / 删除）。
- `ERROR_PARAM_COUNTS` 更新为 `82:1, 83:0, 84:0, 85:1, 86:1, 87:1, 88:2, 89:1, 90:0, 91:2, 92:3, 93:1, 94:3, 95:1, 96:1`。
- `expectFailure` 保留首参错误码断言，并断言 `loggerMock.error.mock.calls[0].length === ERROR_PARAM_COUNTS[code] + 1`。
- 至少一个 92 用例与一个 94 用例分别断言 `calls[0][1]` / `calls[0][2]` / `calls[0][3]` 为帧索引 / 对象或音效索引 / 原因。

## 风格说明

新 82–96 消息与 `logger.json` 既有风格一致——「具体上下文 + `reason: '$n'` / 索引，无具体值」，参照 warn 44、error 63、warn 179。反例 `Cannot parse animation: $1.` 这类泛化消息不存在（静态门禁逐字比对计划表并检查两两不同）。

## 行为不变说明

- 两个 catch 改为无绑定 `catch { ... }`，删除 `reason` 局部变量；解码失败只记 `decode-failed`，纹理失败只记 `texture-failed`。
- 位图越界仍先 `image.close()` 再记日志（新 89 号只传索引，旧 `'out-of-bounds'` 原因与尺寸断言已删除，改为断言索引 `'0'`）。
- 纹理创建失败仍先 `image.close()` 再记日志。
- `validateBitmapBounds` 仍在 `close()` 前读取 `image.width` / `image.height` 用于越界判定，只是不再写入日志。
- 校验逻辑、提前返回、`validateMeta` 嵌套、可选字段 `!== undefined`、`isRecord` 的 `value !== null`、`parseRenderAnimation` 可空签名、3 处窄 `try/catch`、无 `throw` / `finally`、`new Blob` 在 `try` 外全部保持。

## 明确未改项

- 09-56 的 jsDoc / 行内注释 / 3 组功能性 `#region` / 类级 jsDoc / 单画布实现逐字保留。
- 未修改 `animater.ts` / `types.ts` / `index.ts` / `package.json`（哈希基线一致）。
- 未新增 / 重命名任何公开、受保护、私有方法、字段或导出命名；测试未新增具名辅助函数（无值实参提取内联在既有静态闸门 `it` 内）。

## 门禁结果

- `node node_modules/vitest/vitest.mjs run packages/render-anim/src/__test__/parse.test.ts`：70 passed。
- `prettier --check`：`parse.ts` / `parse.test.ts` / `logger.json` 三个改动文件全部通过。
- `eslint`：`parse.ts` / `parse.test.ts` 无 error / warning。
- CRLF / 无 BOM / 无 tab：3 个改动文件全部通过。
- `vue-tsc --version` 哨兵通过（Version 6.0.3）；`--noEmit --incremental false` 过滤 `packages[\\/]render-anim` 诊断为 0 行（全仓其它包既有诊断导致进程退出码 2，不参与判定）；仓库根目录无 `*.tsbuildinfo`，`git status` 无 `tsbuildinfo` 条目。
- 综合静态门禁：`parse.ts` 82–96 全在；39 处 `logger.error` 均 ≤3 参数，实参只有 `.toString()` 索引或允许的原因标签；无 `'-'` / 值形式 `String(...)` / `.message` / actual / expected；3 组 region、3 处 try、无 throw / finally、可空签名、可选字段与 `isRecord` 不变量、`new Blob` 在 try 外、越界先 close、纹理失败先 close、92/94 帧索引在前的 compact 断言全部通过。
- `logger.json` 82–96 与计划表逐字一致、占位符数量 1/0/0/1/1/1/2/1/0/2/3/1/3/1/1、两两不同、非泛化；`1..81` / `2001..2008` / warn 与 Task 1 快照逐字一致。
- 哈希闸门：排除 `09-57-PLAN.md` 后比较 8 条基线，恰有 3 个目标文件（`parse.ts` / `parse.test.ts` / `logger.json`）变化，其余 5 个只读文件不变。
- 写后范围闸门：`git status` 仅新增本 `09-57-SUMMARY.md`，无其它新增 / 删除条目。

## 偏差

1. **无值实参静态闸门的 82–96 存在性断言改写（内联、范围内）**：初始以 `source.includes('logger.error(' + code)` 断言 82–96 全在，但 92 / 94 的调用因超过 printWidth 采用多行 `logger.error(\n 92,` 形式，字面量 `logger.error(92` 不连续，导致该断言误判失败。已改为空白容忍的正则 `new RegExp('logger\\.error\\(\\s*' + code + '\\b')` 判定，语义等价且覆盖多行调用。这是本计划自身测试断言的实现修正，不改变 `parse.ts` 行为与计划意图。
2. **执行方式**：源码 / 测试 / logger 的批量改写由执行子代理以确定性脚本内联完成（每次替换均断言恰好匹配一处），未偏离 `files_modified` 范围。除此之外计划命令均可按原样执行，未发现计划命令缺陷，未触发行为 / 代码歧义。

## 未校准估算

`confidence: low`、`tokens: 80000`（7 个任务 / 80k 仅为 advisory 建议值，不作为拆分或阻断依据）。`actuals.tokens` 为粗略 chars/4 估算，非精确计量。

## 可见跳过

spec-less probe fallback skipped: phase has no requirement IDs to probe (visible skip)。
