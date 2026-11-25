---
phase: 09-minimum-browser-runnable
plan: 63
subsystem: audio
tags: [opus, mediabunny, typescript, jsdoc, comments, factory-function]

requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-61 落地的 Opus 解码会话，以及 09-62 落地的类内静态成员与注释现状"

provides:
  - "opusSession.ts 的 5 个内部接口共 20 个成员注释"
  - "opusSession.ts 的 3 个模块级声明注释：opusModulePromise / loadOpusDecoder / createOpusDecodeSession"
  - "类静态成员改为模块级 Promise 缓存与工厂函数，类内零 static"
  - "context.ts 与 tracer 测试改用 createOpusDecodeSession"

affects: [09-minimum-browser-runnable]

actuals:
  tokens: 2050
  tasks: 3
  commits: 0

tech-stack:
  added: []
  patterns:
    - "模块级 Promise 缓存 + pending.catch 清缓存并重抛，替代类静态成员"
    - "模块级工厂函数承担原静态入口职责，类只保留实例成员"

key-files:
  created:
    - ".planning/phases/09-minimum-browser-runnable/09-63-SUMMARY.md"
  modified:
    - "packages/audio/src/opusSession.ts"
    - "packages/audio/src/context.ts"
    - "packages/audio/src/__test__/opusDecodeSession.test.ts"

key-decisions:
  - "接口成员按 dev.md 第 74 行逐个补注释；接口本体按第 82 行不加注释"
  - "3 个类静态成员改为模块级，只有 createOpusDecodeSession 导出"
  - "缓存清理用 Promise.catch 形式，不用 try 语句，符合 dev.md 第 121 行"
  - "0 提交，工作树与 SUMMARY 留待用户验收"

patterns-established:
  - "模块级非导出 let 作为惰性 Promise 缓存，失败时清回 null 保证可重试"

requirements-completed: []

duration: 7min
completed: 2026-11-25
status: complete
---

# Phase 9 Plan 63: 接口成员注释与类静态成员改模块级 Summary

**给 `opusSession.ts` 的 5 个内部接口补 20 个成员注释与 3 个模块级声明注释，并把 3 个类静态成员改为模块级 Promise 缓存与工厂函数，解码行为零变化**

## 补 09-61 / 09-62 遗留的两个问题

本计划是 gap closure，专门补 **09-61 / 09-62 遗留**的两个问题，两个问题均已由用户确认：

1. **接口成员无注释。** `packages/audio/src/opusSession.ts` 的 5 个内部接口共 20 个成员全部没有注释。`dev.md` 第 74 行要求「其他常用成员、方法、类型也必须添加注释」；第 82 行只说明不建议给接口本体写注释，并未豁免成员；`AGENTS.md` 第 37 行把这类建议视为硬要求，因此 09-61 / 09-62 的注释工作未达标。
2. **`OpusDecodeSession` 使用类静态成员。** `private static opusModule`、`private static loadDecoder`、`static async create` 属遗留静态风格。用户明确当前设计不应新增静态方法，此处也没有必要。

## 目标（Objective）

- 给 5 个内部接口的 20 个成员逐个补注释，非方法成员用单行 jsDoc，`decodeFrame` 与 `free` 两个方法用换行风格 jsDoc。
- 把 3 个类静态成员改为模块级：`opusModulePromise`、`loadOpusDecoder`、`createOpusDecodeSession`，其中只有 `createOpusDecodeSession` 导出。
- `context.ts` 与 tracer 测试各改 2 行改用新工厂。
- 不碰仓库其它位置的旧静态方法，不改 `probe.ts` / `types.ts` / 依赖 / 构建配置，无行为变化，0 提交。

## 执行摘要

### 修改的文件

| 文件 | 改动 | 说明 |
|------|------|------|
| `packages/audio/src/opusSession.ts` | 全文替换 | 20 个接口成员注释 + 3 个模块级声明注释；删除 3 个类静态成员，改为模块级缓存与工厂 |
| `packages/audio/src/context.ts` | 2 行 | import 与 `createDecodeSession` 返回改调 `createOpusDecodeSession` |
| `packages/audio/src/__test__/opusDecodeSession.test.ts` | 2 行 | import 与整文件解码调用改调 `createOpusDecodeSession`，4 个 `it` 与断言不变 |
| `.planning/phases/09-minimum-browser-runnable/09-63-SUMMARY.md` | 新增 | 本摘要，未提交 |

除「静态成员改模块级」和「新增注释」外无行为变化。`parseOpusIdentificationHeader` 的实现与注释、类实例成员、构造器、`decodePacket`、`generateChunks`、`close` 逐字保留。

### 23 个注释目标

5 个内部接口：`IOpusIdentificationHeader`、`IOpusDecodedAudio`、`IOpusDecoderOptions`、`IOpusDecoderInstance`、`IOpusDecoderModule`。

20 个接口成员（非方法成员单行，方法换行）：

| # | 接口 | 成员 | 注释 |
|---|------|------|------|
| 1 | `IOpusIdentificationHeader` | `preSkip` | OpusHead 中声明的起始预跳过采样数，解码后需要丢弃 |
| 2 | `IOpusIdentificationHeader` | `channels` | 输出声道数 |
| 3 | `IOpusIdentificationHeader` | `streamCount` | 独立 Opus 流数量 |
| 4 | `IOpusIdentificationHeader` | `coupledStreamCount` | 耦合 Opus 流数量 |
| 5 | `IOpusIdentificationHeader` | `channelMappingTable` | 输出声道到 Opus 流的映射表 |
| 6 | `IOpusDecodedAudio` | `channelData` | 每个声道的 PCM 数据 |
| 7 | `IOpusDecodedAudio` | `samplesDecoded` | 每个声道解码出的采样数 |
| 8 | `IOpusDecodedAudio` | `sampleRate` | 解码后的采样率 |
| 9 | `IOpusDecodedAudio` | `errors` | 解码过程中产生的错误列表 |
| 10 | `IOpusDecoderOptions` | `sampleRate` | Opus 输出采样率，固定为 48000 |
| 11 | `IOpusDecoderOptions` | `channels` | 输出声道数 |
| 12 | `IOpusDecoderOptions` | `preSkip` | 起始处需要跳过的采样数 |
| 13 | `IOpusDecoderOptions` | `streamCount` | 独立 Opus 流数量 |
| 14 | `IOpusDecoderOptions` | `coupledStreamCount` | 耦合 Opus 流数量 |
| 15 | `IOpusDecoderOptions` | `channelMappingTable` | 输出声道到 Opus 流的映射表 |
| 16 | `IOpusDecoderInstance` | `ready` | WASM 初始化完成的 Promise |
| 17 | `IOpusDecoderInstance` | `decodeFrame` | 多行：解码单个 Opus 包 / `@param packet 待解码的 Opus 包` / `@returns 解码后的 PCM 数据，可能是同步值或 Promise` |
| 18 | `IOpusDecoderInstance` | `free` | 多行：释放解码器占用的资源 |
| 19 | `IOpusDecoderModule` | `OpusDecoder` | 主线程 Opus 解码器构造函数 |
| 20 | `IOpusDecoderModule` | `OpusDecoderWebWorker` | Web Worker Opus 解码器构造函数 |

3 个模块级声明：

| # | 声明 | 形式 | 注释 |
|---|------|------|------|
| 21 | `opusModulePromise` | 单行 | 缓存的 opus-decoder 动态导入 Promise，避免并发重复加载 |
| 22 | `loadOpusDecoder` | 多行 | 按 OpusHead 配置并创建 Opus 解码器；浏览器使用 Worker 变体，Node 使用主线程变体 + `@param header 已解析的 Opus 识别头` |
| 23 | `createOpusDecodeSession` | 多行 | 为 Ogg / WebM Opus 创建整文件解码会话 + `@param source 音频输入数据` + `@param info 探测得到的格式信息` |

明确不注释：5 个接口本体（`dev.md` 第 82 行）；`OpusDecodeSession` 的 `info` / `chunks` / `close`（`dev.md` 第 75 行，接口实现不重复 jsDoc）；构造器（`dev.md` 第 76 行）。已带注释的 `parseOpusIdentificationHeader`、`decodePacket`、`generateChunks`、`input` / `sink` / `decoder` / `closed` 逐字保留。

### 静态改模块级设计

| 目标 | 可见性 | 说明 |
|------|--------|------|
| `opusModulePromise` | 模块私有 `let` | 类型为 `Promise<IOpusDecoderModule>` 或 `null`，作为动态导入的 Promise 缓存 |
| `loadOpusDecoder(header)` | 模块私有 `async function` | 复用缓存；为空时存入 `import('opus-decoder')` 的 Promise；加载失败时用 `pending.catch` 把缓存清回 `null` 并重新抛出，保证后续调用可重试 |
| `createOpusDecodeSession(source, info)` | 导出 `async function` | 搬原 `static create` 的输入 / 音轨 / sink 装配，返回 `Promise<OpusDecodeSession>` 或 `null` |

- 类内零 `static`：删除了 `private static opusModule`、`private static async loadDecoder`、`static async create` 及其各自的注释。
- 解码器选项仍为 `sampleRate: 48000` 与 OpusHead 的 `channels` / `preSkip` / `streamCount` / `coupledStreamCount` / `channelMappingTable`。
- Worker 选择不变：`typeof Worker === 'undefined'` 用 `opus.OpusDecoder`，否则用 `opus.OpusDecoderWebWorker`，`await decoder.ready` 后返回。
- 缓存清理用 `Promise.catch` 形式，未使用 `try` 语句，符合 `dev.md` 第 121 行。

## 行为不变证据

- **tracer 测试 4/4 通过**：1 个测试文件、4 个用例（探测 Ogg Opus 格式 / 未知数据探测为 null / 解析 OpusHead / 整文件解码）全部通过。
- **调用点闸门**：`context.ts` 与测试文件各只改批准的 2 行，行数不变，4 个 `it` 与断言逐字未改。
- **结构闸门**：`decodePacket` / `generateChunks` / `close` / 工厂装配与既有 jsDoc 描述的关键语句全部在位。
- **类型检查**：`vue-tsc --noEmit` 改前 / 改后 error 头行集合零新增，`packages/audio` 零 error。

## 闸门真实输出

| 闸门 | 命令 | 结果 |
|------|------|------|
| 注释完整性 | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-comments.cjs` | `OK: 23/23 个目标声明上方都有非空注释，接口本体与类的 info / chunks / close 上方均无注释` |
| 注释逐字文本 | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-comment-text.cjs` | `OK: 23/23 个目标注释与批准文本逐字一致` |
| 结构（零静态） | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-structure.cjs` | `OK: zero static, no old static names, single dynamic import, all key statements in place` |
| 调用点 | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-callsite.cjs` | `OK: context.ts 与测试各只改批准的 2 行，4 个 it 与断言逐字不变` |
| 16 条守卫哈希 | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-guard.cjs` | `OK: 16 条守卫路径哈希与基线一致` |
| 范围（Task 1） | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-scope.cjs --expect-task1` | `OK: scope within expectation (--expect-task1), packages/audio baseline 5 entries unchanged, no deletions` |
| 范围（Task 2） | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-scope.cjs --expect-task2` | `OK: scope within expectation (--expect-task2), packages/audio baseline 5 entries unchanged, no deletions` |
| CRLF / 无 tab / 无 BOM | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-text.cjs <3 个文件>` | `OK: CRLF, no tab, no BOM (3 files)` |
| prettier | `node node_modules/prettier/bin/prettier.cjs --check <3 个文件>` | `All matched files use Prettier code style!`（未使用 `--write`） |
| eslint | `node node_modules/eslint/bin/eslint.js <3 个文件>` | 无任何输出，退出码 0，0 error 0 warning |
| vitest | `node node_modules/vitest/vitest.mjs run packages/audio/src/__test__/opusDecodeSession.test.ts` | `Test Files 1 passed (1)`、`Tests 4 passed (4)` |
| vue-tsc 改前 | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-capture-tsc.cjs .../gsd-09-63-tsc-before.txt` | 279 个 error 头行，`packages/audio` 0 个 |
| vue-tsc 改后 | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-capture-tsc.cjs .../gsd-09-63-tsc-after.txt` | 279 个 error 头行，`packages/audio` 0 个 |
| vue-tsc 差集 | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-tsc.cjs <before> <after> --audio` | `OK: tsc set-diff has 0 new error headers; packages/audio errors = 0` |
| SUMMARY 内容 | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-summary.cjs` | `OK: SUMMARY content, CRLF, no tab, no BOM` |
| HEAD | `node C:/Users/13194/AppData/Local/Temp/opencode/gsd-09-63-gate-head.cjs` | HEAD 未变 `ba90ce6dace27cbedf6618858cf91ffbfe5f7af2`，工作树仍脏，产物未提交 |

### 实际命令（本机 `pnpm.ps1` 被执行策略拦截）

- prettier：`node node_modules/prettier/bin/prettier.cjs --check <3 个文件>`（等价于 `pnpm exec prettier --check <3 个文件>`）
- eslint：`node node_modules/eslint/bin/eslint.js <3 个文件>`（等价于 `pnpm exec eslint <3 个文件>`）
- vitest：`node node_modules/vitest/vitest.mjs run packages/audio/src/__test__/opusDecodeSession.test.ts`（等价于 `pnpm exec vitest run <同一路径>`）
- vue-tsc：由 `gsd-09-63-capture-tsc.cjs` 内部执行 `node_modules/vue-tsc/bin/vue-tsc.js --noEmit`（等价于 `pnpm exec vue-tsc --noEmit`）

## 决策

- 接口成员按 `dev.md` 第 74 行逐个补注释，接口本体按第 82 行不加注释；类的 `info` / `chunks` / `close` 按第 75 行不加注释。
- 3 个类静态成员改为模块级，只有 `createOpusDecodeSession` 导出，`opusModulePromise` 与 `loadOpusDecoder` 模块私有。
- 缓存失败重试用 `Promise.catch` 形式而非 `try` 语句，遵循 `dev.md` 第 121 行。
- 0 提交，工作树与 SUMMARY 留待用户验收。

## 偏差

1. **新增一个临时校验脚本**：为逐字核对 `opusSession.ts` 与计划「源文件规格」全文一致，在固定临时目录额外写了 `gsd-09-63-gate-spec.cjs`（输出 `OK: opusSession.ts 与源文件规格逐字一致`）。它不是仓库产物，不进入 `git status`，也不替代任何计划闸门。
2. **`opusSession.ts` 写入后做了一次行尾归一**：Write 工具先写出 LF，随后用固定临时目录的 `gsd-09-63-crlf.cjs` 转为 CRLF，以满足 `.prettierrc` 的 `endOfLine: crlf`；归一后 `gate-text` 与 `prettier --check` 均通过。未产生任何内容变化。
3. **未使用 `prettier --write`**：`--check` 首轮即通过，Task 1 第 5 步的兜底路径未触发。
4. **外部改动（只记录、未回退）**：执行期间工作树出现用户的外部改动 `M  packages/render/src/core/render.ts`（已暂存，不在本计划范围内，不在基线中）。删除、回退或提交它都未执行；`gate-scope` 只校验 `packages/audio` 与阶段目录，因此不受影响。外部 `HEAD` 未变化。
5. 其余与计划一致，源码与调用点均按规格逐字落地。

## 未校准估算

计划 `estimate` 为 `confidence: low`、`tokens: 18000`、3 个任务，属**未校准**的 advisory 值，不作为拆分或阻断依据。本摘要 `actuals.tokens` 取实现文本差异（`opusSession.ts` 全文重写 7984 字符 + `context.ts` 与测试各 2 行）约 2050，与 18000 不同尺度（后者含汇报关卡、全仓类型检查与多次闸门运行的整体成本），仅作记录。

## 校验（Self-Check）

- [x] `packages/audio/src/opusSession.ts` 存在且与源文件规格逐字一致
- [x] `packages/audio/src/context.ts` 仅改批准的 2 行
- [x] `packages/audio/src/__test__/opusDecodeSession.test.ts` 仅改批准的 2 行，4 个 `it` 与断言不变
- [x] 23/23 注释目标与批准措辞通过
- [x] 零 `static`、零旧名、单次动态导入、关键语句在位
- [x] 16 条守卫路径哈希不变
- [x] `packages/audio` 状态条目与基线 5 条既有产物逐行相等
- [x] prettier / eslint / vitest 4/4 / vue-tsc 差集通过
- [x] 0 提交，无提交包含本计划文件，工作树仍脏

## 0 提交声明

未执行任何 git 写命令（含 `git add` / `git add -N` / `git commit` / `git tag` / `git push` / `git stash` / `git checkout` / `git worktree` / `git restore`）。显式跳过 `workflow.commit_docs`，未使用 worktree。最终产物是**未提交的工作树 + 未提交的 SUMMARY**，留待用户验收。外部 `HEAD` 与 status 变化只记录、只上报，未回退。
