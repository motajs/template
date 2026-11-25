---
phase: 09-minimum-browser-runnable
plan: 64
subsystem: audio
tags: [opus, mediabunny, logger, error-codes, gap-closure, typescript]

requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-61 落地的 Opus 探测与整文件解码会话，09-63 落地的模块级工厂与接口注释"

provides:
  - "logger.json 的 error 97（会话创建失败）与 warn 217（输入类型不支持）"
  - "probe.ts 的 warn 217、容器未知 / 无主音轨各一次 error 97、getFormat 前置"
  - "opusSession.ts 的 OpusHead 改返 null、四处 error 97、零采样带错误保留"
  - "context.ts 公共边界两处 error 25 + null"
  - "测试 6 个 it 与单参数解析调用"

affects: [09-minimum-browser-runnable]

actuals:
  tokens: 830
  tasks: 3
  commits: 0

tech-stack:
  added: []
  patterns:
    - "静默兜底与可诊断失败分离：期望内路径不发声，异常路径各记一次码"
    - "零采样但带错误时保留 chunk，把 errors 一路带到公共边界统一记一次 25"

key-files:
  created:
    - ".planning/phases/09-minimum-browser-runnable/09-64-SUMMARY.md"
  modified:
    - "packages/common/src/logger.json"
    - "packages/audio/src/probe.ts"
    - "packages/audio/src/opusSession.ts"
    - "packages/audio/src/context.ts"
    - "packages/audio/src/__test__/opusDecodeSession.test.ts"

key-decisions:
  - "decodePacket 零采样带错误时保留零采样 chunk，让 decodeSession 收集 errors 后由公共边界记一次 error 25；DTX 空包仍静默跳过"
  - "loadOpusDecoder 里 09-63 既有的唯一一处 throw error（清缓存后重抛）原样保留，全文件零新增 throw"
  - "既有 if (!x) return null 守卫全部保留，按 dev.md 第 124 行前提不改写为提前返回"
  - "测试解析断言的 header 加一处非空断言以满足 vue-tsc，属计划严格差异规格未覆盖的必要类型修正"
  - "0 提交，工作树与 SUMMARY 留待用户验收"

patterns-established:
  - "异常分支各记一次日志码，期望内兜底（canRead 失败、decodeNative 失败、DTX）不记录，避免日志风暴"

requirements-completed: []

duration: 28min
completed: 2026-11-25
status: complete
---

# Phase 9 Plan 64: 静默失败补日志与两个日志码 Summary

**给 09-61 / 09-63 遗留的静默失败补上 error 97 与 warn 217，把 OpusHead 的默认回退改为返回 null，并把零采样带错误的解码失败一路带到公共边界记一次 error 25**

## 补 09-61 / 09-63 遗留的五个问题

本计划是 gap closure，专门补 **09-61 / 09-63 遗留**的问题，五个问题均已由用户确认：

1. **不支持的输入类型完全静默。** `probe.ts` 的 `createMediaSource` 对 `AudioInputSource` 联合类型里的 `ReadableStream` 直接返回 null，调用方无法判断是数据不是 Ogg / WebM，还是输入类型根本没实现。
2. **Ogg / WebM 的异常分支静默。** `probeAudioSource` 先取主音轨后判容器，「容器是 Ogg / WebM 但没有主音轨」与「容器未知」都只返回 null。
3. **`parseOpusIdentificationHeader` 静默回退默认值。** 缺失或非法的 OpusHead 被伪造成 `preSkip: 0` 与单流映射，解码结果失真且无提示。
4. **解码器的错误被吞掉。** `decodePacket` 对零采样一律返回 null，`decoded.errors` 里有内容也会消失；公共边界拿到 null 直接返回，用户看不到失败。
5. **两个日志码不存在。** `logger.json` 的 error 段止于 96、warn 段止于 216。

## 修改的文件

| 文件 | 改动 | 说明 |
|------|------|------|
| `packages/common/src/logger.json` | 新增 2 行 | error 97 紧跟 96、warn 217 紧跟 216 |
| `packages/audio/src/probe.ts` | 全文替换 | 新增 logger 引入、warn 217、getFormat 前置、两处 error 97 |
| `packages/audio/src/opusSession.ts` | 全文替换 | OpusHead 改返 null、删 fallback、四处 error 97、零采样带错误保留 |
| `packages/audio/src/context.ts` | 2 个块 | 公共边界两处 error 25 + null |
| `packages/audio/src/__test__/opusDecodeSession.test.ts` | 1 行 + 1 行 + 2 个 it | 单参数解析调用、`Math.max` 声道数、两个新 it |
| `.planning/phases/09-minimum-browser-runnable/09-64-SUMMARY.md` | 新增 | 本摘要，未提交 |

无新功能、无新依赖、无新增 `throw`、无新增测试文件。`types.ts` / `source.ts` / `bgm.ts` / `decoder.ts` / 依赖 / 构建配置逐字未动。

## 日志码

| 码 | 级别 | 插入位置 | 消息 | 长度 / 上限 |
|----|------|----------|------|-------------|
| 97 | error | error 段 `"96"` 之后、`"2001"` 之前 | `Cannot create audio decode session: the audio track or its decoder description is missing.` | 90 / 96 |
| 217 | warn | warn 段 `"216"` 之后、`"1001"` 之前 | `Unsupported audio input source type: '$1'.` | 42 / 216 |

两条均为普通顺序码，不使用 1000+ / 2000+ 域段；本段内各恰好出现 1 次。

## 记录与静默的分支

| 文件 | 分支 | 处理 | 记录 |
|------|------|------|------|
| `probe.ts` | 不支持的输入类型（`ReadableStream`） | 返回 null | `logger.warn(217, source.constructor.name)` |
| `probe.ts` | `canRead()` 为 false | dispose 后返回 null | 不记录（数据不是 Ogg / WebM） |
| `probe.ts` | 容器既非 Ogg 也非 WebM | dispose 后返回 null | `logger.error(97)` |
| `probe.ts` | Ogg / WebM 但无主音轨 | dispose 后返回 null | `logger.error(97)` |
| `opusSession.ts` | 不可读 | dispose 后返回 null | `logger.error(97)` |
| `opusSession.ts` | 无主音轨 | dispose 后返回 null | `logger.error(97)` |
| `opusSession.ts` | 无 `getDecoderConfig().description` | dispose 后返回 null | `logger.error(97)` |
| `opusSession.ts` | OpusHead 非法 | dispose 后返回 null | `logger.error(97)` |
| `opusSession.ts` | 零采样且无错误（DTX） | 返回 null，跳过该包 | 不记录 |
| `context.ts` | `decodeNative` 失败 | 返回 null | 不记录（走 Opus 会话或 legacy） |
| `context.ts` | `decodeSession` 零采样 | 返回 null | 不记录（由公共边界记 25） |
| `context.ts` | 会话存在但结果零采样或 errors 非空 | 返回 null | `logger.error(25, this.getErrorHeaderInfo(data))`，两个公共方法各 1 次 |
| `context.ts` | `session` 为 null，走 legacy | legacy 原有行为 | legacy 自己的 error 25 / 53，不新增第二条 |

## 契约裁定

- **零采样带错误：** `decodePacket` 先算 `isEmpty`，仅当 `isEmpty && errors.length === 0` 才返回 null；零采样但带错误时保留零采样 chunk，让 `decodeSession` 收集 `errors` 后由公共边界记一次 error 25。零采样且无错误（DTX）仍静默跳过。
- **既有 `throw` 保留：** `opusSession.ts` 中 09-63 既有的唯一一处 `throw error`（清缓存后重抛，保证后续可重试）原样保留，全文件 `throw` 计数仍为 1，零新增。
- **公共边界返回 null：** Opus 会话存在但结果为零采样或 `errors` 非空时，`decodeAudio` 与 `decodeToAudioBuffer` 各记一次 error 25 并返回 null；`session` 为 null 时仍走 legacy，不新增第二条 error 25。
- **守卫控制流：** 既有 `if (!x) return null` 守卫全部保留，按 `dev.md` 第 124 行的前提（该条约束的是并列条件）不改写为 `if / else`，也不合并。

## 行为与证据

- **测试：** `vitest` 1 个测试文件、6 个用例全部通过；6 个 `it` 前各有一行中文注释。
- **类型检查：** `vue-tsc --noEmit` 集合差集对改前基线新增 0 个 error 头行，`packages/audio` 0 error。
- **格式：** `prettier --check` 首轮通过；`eslint` 退出码 0，0 error 0 warning。
- **严格差异：** 5 个文件严格等于「改前副本 + 已批准替换」（含任务中必要的非空断言修正）。
- **结构：** `opusSession.ts` 零 `static`、`throw` 计数 1（opusSession）/ 0（probe、context）；`logger.error(97)` 计数 4（opusSession）/ 2（probe）；`logger.warn(217` 计数 1；`context.ts` 的 error 25 计数 4、公共边界判空块 2 处；守卫与关键语句在位。
- **守卫与范围：** 16 条守卫路径哈希与基线一致；范围只新增 `logger.json` 与 `09-64-SUMMARY.md` 两个条目，范围内无删除。

## 闸门真实输出

| 闸门 | 结果 |
|------|------|
| 日志码 `gsd-09-64-gate-codes.cjs` | `OK: error 97 / warn 217 唯一、位置正确、消息逐字一致（90 / 42 字符）` |
| 结构 `gsd-09-64-gate-structure.cjs` | `OK: zero static, single throw, logger points, guards and 6 commented its in place` |
| 严格差异 `gsd-09-64-gate-diff.cjs` | `OK: 5 个文件严格等于「改前副本 + 已批准替换」` |
| 守卫哈希 `gsd-09-64-gate-guard.cjs` | `OK: 16 条守卫路径哈希与基线一致` |
| 范围 Task 1 `gsd-09-64-gate-scope.cjs --expect-task1` | `OK: scope within expectation (--expect-task1), packages/audio baseline 5 entries unchanged, logger.json added, no scoped deletions` |
| CRLF `gsd-09-64-gate-text.cjs` | `OK: CRLF, no tab, no BOM (5 files)` |
| `prettier --check` | `All matched files use Prettier code style!`（未使用 `--write`） |
| `eslint` | 无输出，退出码 0，0 error 0 warning |
| `vitest` | `Test Files 1 passed (1)`、`Tests 6 passed (6)` |
| `vue-tsc` 改前采集 | 286 个 error 头行，`packages/audio` 0 个 |
| `vue-tsc` 改后采集 | 284 个 error 头行，`packages/audio` 0 个（期间用户外部提交修复了若干既有错误） |
| `vue-tsc` 差集 `gsd-09-64-gate-tsc.cjs <before> <after> --audio` | `OK: tsc set-diff has 0 new error headers; packages/audio errors = 0` |
| SUMMARY 内容 `gsd-09-64-gate-summary.cjs` | 见写后闸门输出 |
| HEAD `gsd-09-64-gate-head.cjs` | `OK: HEAD 由不含本计划文件的提交推进到 24f7f8d558d7083925f81b15eb3c05948b72a9eb，工作树仍脏，产物未提交` |

### 实际命令（本机 `pnpm.ps1` 被执行策略拦截）

- `vitest`：`node node_modules/vitest/vitest.mjs run packages/audio/src/__test__/opusDecodeSession.test.ts`（等价于 `pnpm exec vitest run <同一路径>`）
- `vue-tsc`：由 `gsd-09-64-capture-tsc.cjs` 内部执行 `node_modules/vue-tsc/bin/vue-tsc.js --noEmit`（等价于 `pnpm exec vue-tsc --noEmit`）
- `prettier`：`node node_modules/prettier/bin/prettier.cjs --check <5 个文件>`（等价于 `pnpm exec prettier --check <5 个文件>`）
- `eslint`：`node node_modules/eslint/bin/eslint.js <4 个 TS 文件>`（等价于 `pnpm exec eslint <4 个 TS 文件>`）

## 偏差

1. **测试解析断言补一处非空断言（Rule 1 - 类型错误）。** 计划把 `parseOpusIdentificationHeader` 的返回类型改为 `IOpusIdentificationHeader | null`，但计划给出的测试改动只有三处，未覆盖既有「解析 OpusHead」用例里对 `header.preSkip` 等属性的直接访问；只按计划落地会产生 5 条 `TS18047 'header' is possibly 'null'`。为满足计划自身的 `vue-tsc` 集合差集零新增闸门，把已批准的替换行改为 `const header = parseOpusIdentificationHeader(head)!;`（`dev.md` 第 110 行允许必要的非空断言；测试文件只需遵守每个 `it` 前一行注释的规则）。相应地，严格差异闸门脚本里该替换的期望文本同步为带 `!` 的版本；其余 4 个文件的已批准替换不变。改后重采 `vue-tsc` 为 0 新增、`packages/audio` 0 error。
2. **行尾归一。** Write / Edit 可能写出 LF，已用固定临时目录的 `gsd-09-64-crlf.cjs` 对 5 个文件与 SUMMARY 归一为 CRLF，未改动任何字符。
3. **未使用 `prettier --write`。** `--check` 首轮即通过，兜底路径未触发。
4. **外部提交与 HEAD 移动（只记录、未回退）。** 执行期间 HEAD 由基线 `6773069c2405392bf53f791a8675dd8089960236` 推进到 `24f7f8d558d7083925f81b15eb3c05948b72a9eb`，含两个外部提交：`24f7f8d`（fix: 遗漏的 types.ts）与 `8fe1c84`（feat: client 上关于 mainTextboxManager 的默认主对象实例），只涉及 `packages-user/client-base/...` 与 `packages-user/client-modules/src/client.ts`，不含本计划 6 个路径、也不含 16 条守卫路径。工作树另有外部改动 `M package.json`、`M pnpm-lock.yaml`。以上只记录、只上报，未执行任何回退、rebase 或 checkout。
5. 其余与计划一致。

## 未校准估算

计划 `estimate` 为 `confidence: low`、`tokens: 24000`、3 个任务，属**未校准**的 advisory 值，不作为拆分或阻断依据。本摘要 `actuals.tokens` 取实现文本差异（新增 58 行 2287 字符 + 删除 25 行 1032 字符，约 830 tokens），与 24000 不同尺度（后者含 Task 0 汇报关卡、全仓类型检查与多次闸门运行的整体成本），仅作记录。

## 0 提交声明

未执行任何 git 写命令（含 `git add` / `git add -N` / `git commit` / `git tag` / `git push` / `git stash` / `git checkout` / `git worktree` / `git restore`）。显式跳过 `workflow.commit_docs`，未使用 worktree。最终产物是**未提交的工作树 + 未提交的 SUMMARY**，留待用户验收。外部 `HEAD` 与 status 变化只记录、只上报，未回退。
