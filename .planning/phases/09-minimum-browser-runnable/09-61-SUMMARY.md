---
phase: 09-minimum-browser-runnable
plan: 61
subsystem: audio
tags: [audio, decode, opus, mediabunny, wasm-fallback, tracer]
depends_on:
    requires: [09-60]
    provides: [probeAudioSource, OpusDecodeSession, IAudioDecodeProvider 实现]
    affects: [09-62, 09-63]
tech-stack:
    added: [mediabunny@1.66.3]
    patterns: [原生命令优先加 WASM 兜底, 动态导入解码器]
key-files:
    created:
        - packages/audio/src/probe.ts
        - packages/audio/src/opusSession.ts
        - packages/audio/src/__test__/opusDecodeSession.test.ts
    modified:
        - package.json
        - pnpm-lock.yaml
        - packages/audio/src/types.ts
        - packages/audio/src/context.ts
decisions:
    - 探测与解码都用 mediabunny，原生 decodeAudioData 优先，失败才走 Opus 会话
    - opus-decoder 只动态加载并缓存，Node 用主线程解码器、浏览器用 WebWorker 变体
metrics:
    duration: 约 1 小时 5 分钟（19:00 - 19:45）
    completed: 2026-11-24
status: complete
estimate:
    tokens: 34000
    tasks: 3
    confidence: low
actuals:
    tokens: 4496
    tasks: 3
    commits: 0
---

# Phase 9 Plan 61: mediabunny 探测 + 整文件 Ogg Opus 解码 tracer Summary

一句话：用 mediabunny 探测容器与编码，原生 `decodeAudioData` 优先、失败后对 Ogg/WebM Opus 走 `opus-decoder` 整文件解码，把 09-60 声明好的解码接口第一次跑通。

## 问题

09-60 只声明了 `IAudioDecodeProvider` / `IAudioDecodeSession` / `IAudioDecodedChunk` 等接口，没有任何实现。整文件音频解码此前只能依赖浏览器原生 `decodeAudioData`，浏览器（尤其 Safari）不支持 Ogg Opus 时 `VanillaDecoder` 直接失败，浏览器最小可运行版本卡在音频解码这一步。

## 文件清单

- `package.json`：根 `dependencies` 新增 1 行 `"mediabunny": "^1.66.3"`。
- `pnpm-lock.yaml`：由 `pnpm` 生成，新增 `mediabunny` 的 importers 条目与包解析条目（共 23 行新增）。
- `packages/audio/src/types.ts`：单 hunk，只改 `IMotaAudioContext` 的父接口行。
- `packages/audio/src/context.ts`：新增 5 个私有方法与 `probeAudio` / `createDecodeSession` 两个公开方法，重写 `decodeAudio` / `decodeToAudioBuffer`。
- `packages/audio/src/probe.ts`：新文件，mediabunny 探测。
- `packages/audio/src/opusSession.ts`：新文件，整文件 Ogg/WebM Opus 解码会话。
- `packages/audio/src/__test__/opusDecodeSession.test.ts`：新文件，Node 侧 tracer 测试（4 个 `it`）。
- `.planning/phases/09-minimum-browser-runnable/09-61-SUMMARY.md`：本文件，未提交。

## 新增命名

### B. `probe.ts`

| 名称 | 可见性 | 签名 |
|------|--------|------|
| `mediaFormats` | 模块常量（不导出） | `[OGG, WEBM]` |
| `createMediaSource` | 模块私有 | `(source: AudioInputSource): BufferSource \| BlobSource \| UrlSource \| null` |
| `createMediaInput` | `export function` | `(source: AudioInputSource): Input \| null` |
| `toAudioCodec` | 模块私有 | `(codec: string \| null): AudioCodec` |
| `probeAudioSource` | `export async function` | `(source: AudioInputSource): Promise<IAudioFormatInfo \| null>` |

### C. `opusSession.ts`

| 名称 | 可见性 | 说明 |
|------|--------|------|
| `IOpusIdentificationHeader` | 非导出 interface | `preSkip` / `channels` / `streamCount` / `coupledStreamCount` / `channelMappingTable` |
| `IOpusDecodedAudio` | 非导出 interface | `channelData` / `samplesDecoded` / `sampleRate` / `errors` |
| `IOpusDecoderOptions` | 非导出 interface | `sampleRate: 48000` 与 OpusHead 映射字段 |
| `IOpusDecoderInstance` | 非导出 interface | `ready` / `decodeFrame` / `free` |
| `IOpusDecoderModule` | 非导出 interface | `OpusDecoder` / `OpusDecoderWebWorker` 构造签名 |
| `parseOpusIdentificationHeader` | `export function` | `(description: Uint8Array \| null, channels: number): IOpusIdentificationHeader` |
| `OpusDecodeSession` | `export class implements IAudioDecodeSession` | 整文件会话 |
| `info` / `chunks` | `public readonly` | 接口成员；`chunks` 在构造器内赋为私有生成器 |
| `opusModule` | `private static` | 缓存的动态导入模块 |
| `input` / `sink` / `decoder` | `private readonly` | mediabunny `Input`、`EncodedPacketSink`、解码器实例 |
| `closed` | `private` | 关闭标记 |
| `loadDecoder` | `private static async` | `(header: IOpusIdentificationHeader): Promise<IOpusDecoderInstance>` |
| `create` | `public static async` | `(source: AudioInputSource, info: IAudioFormatInfo): Promise<OpusDecodeSession \| null>` |
| `decodePacket` | `private async` | `(packet: EncodedPacket): Promise<IAudioDecodedChunk \| null>` |
| `generateChunks` | `private async *` | `(): AsyncGenerator<IAudioDecodedChunk>` |

### D. `context.ts`

| 名称 | 可见性 | 说明 |
|------|--------|------|
| `probeAudio` | `public`（实现 `IAudioDecodeProvider`） | 转调 `probeAudioSource` |
| `createDecodeSession` | `public`（实现 `IAudioDecodeProvider`） | 只对 Ogg/WebM + Opus 返回会话 |
| `decodeNative` | `private async` | 复制字节后原生解码，失败返回 `null` |
| `convertAudioBuffer` | `private` | `AudioBuffer` 转 `IAudioDecodeData` |
| `mergeChannelData` | `private` | 合并同声道分块 |
| `decodeSession` | `private async` | 整文件遍历会话并 `close()` |
| `decodeAudioLegacy` | `private async` | 与改动前 `decodeAudio` 函数体逐字等价 |
| `decodeAudio` | `public`（重写） | 探测、原生、会话、旧路径 |
| `decodeToAudioBuffer` | `public`（重写） | 探测、原生、会话、旧路径 |

删除命名：无。`seek` 按接口可选成员未实现，tracer 不支持跳转。

## 依赖

- 新增依赖：`mediabunny`，批准区间 `^1.66.3`，锁文件实际解析版本 **1.66.3**。
- 安装命令（计划要求）：`pnpm.cmd add mediabunny@^1.66.3`；实际执行见「偏差」节（需要 `-w`，且 `^` 需绕开 `cmd.exe` 解析）。
- `opus-decoder` 已是既有依赖（`^0.7.11`），未新增、未升级。
- `packages/audio/package.json` 零改动（哈希与基线一致，仍只有 workspace 依赖）。

## 兜底顺序

1. `probeAudio` 探测格式（mediabunny，精选 `[OGG, WEBM]`）。
2. `decodeNative` 原生 `decodeAudioData`：先 `data.slice()` 复制字节，避免原生解码 detach 原始缓冲区；`try` / `catch` 捕获失败并返回 `null`。
3. 仅当探测结果是 Ogg/WebM + Opus 时，`createDecodeSession` 建立 `OpusDecodeSession` 整文件解码。
4. `decodeAudio` 最后落回 `decodeAudioLegacy`，其函数体与改动前 `decodeAudio` 逐字等价，MP3/WAV/FLAC/AAC 与已注册解码器的结果不回退。

`decodeNative` 内的 `try` / `catch` 是用户在计划中明确要求的「原生失败 → WASM 兜底」路径，属于 `dev.md`「不建议 try-catch」的**授权例外**，未扩散到其它方法。

**已知不等价点：** `decodeToAudioBuffer` 的 vanilla 分支改为经 `decodeNative`（先复制字节、`try` 捕获、失败返回 `null`），旧实现的 `data.buffer instanceof ArrayBuffer` 守卫随复制一起移除，因此该分支只保证解码结果等价，不再逐字等价；该差异已在 Task 0 报备并在此记录。

## 限制

- `ReadableStream` 输入不在 tracer 范围：`createMediaSource` 返回 `null`，探测与会话随之返回 `null`。
- `seek` 未实现（接口可选成员）。
- Node 环境（`typeof Worker === 'undefined'`）使用主线程 `OpusDecoder`，浏览器使用 `OpusDecoderWebWorker`。
- 结构损坏但仍可识别容器的文件可能在 mediabunny 解析阶段抛错，tracer 不额外兜底，留给 09-62 / 09-63。
- 探测与会话各建立一次 mediabunny `Input`（多一次头部解析），合并留给 09-63。
- `opus-decoder` 在 `packages/audio/src` 内只有 1 处 `await import('opus-decoder')`，0 处静态导入。

## 未改项

以下 11 条只读路径的 `git hash-object` 与基线逐一相等：

1. `packages/audio/src/source.ts`
2. `packages/audio/src/bgm.ts`
3. `packages/audio/src/decoder.ts`
4. `packages/audio/src/effect.ts`
5. `packages/audio/src/sound.ts`
6. `packages/audio/src/support.ts`
7. `packages/audio/src/index.ts`
8. `packages/audio/package.json`
9. `script/build-game.ts`
10. `vite.config.ts`
11. `vitest.perf.config.ts`

另外 `getAudioTypeFromData` / `getErrorHeaderInfo` / `toAudioBuffer` 实现体与既有 jsDoc 注释均未改动；`decoder.ts` 的旧解码器未动；`types.ts` 只改父接口行（`IMotaAudioContext extends IMotaAudioContextCreator, IAudioDecodeProvider`），未新增 `IAudioDecoderRegistry`。

## 门禁真实输出

### tracer 测试

命令：`node node_modules/vitest/vitest.mjs run packages/audio/src/__test__/opusDecodeSession.test.ts`

- 1 个测试文件、4 个用例全部通过（探测 Ogg Opus / 未知数据为 null / 解析 OpusHead / 整文件解码），耗时约 170 ms。
- 探测结果：容器 Ogg、编码 opus、采样率 48000、2 声道、时长 57.6535 秒。
- OpusHead：`description` 19 字节，`preSkip` 312，`channels` 2，`streamCount` 1，`coupledStreamCount` 1，映射表 `[0, 1]`。
- 整文件解码：2883 个包，总采样数 **2767368**，折算 **57.6535 秒**（与探测时长差 0），首个包时间戳 0.0135、最后 57.6335，峰值 **0.8153754472732544**。

### 静态检查

- prettier `--check`：6 个文件（`package.json`、`types.ts`、`context.ts`、`probe.ts`、`opusSession.ts`、测试）全部通过。
- eslint：同样 6 个文件，退出码 0，**0 error 0 warning**。
- 结构闸门：通过（`import('opus-decoder')` 恰 1 处、0 静态导入、两文件外部依赖只有 `mediabunny`、`[OGG, WEBM]` 且无 `ALL_FORMATS`、`EncodedPacketSink` / `sink.packets()` / `packet.timestamp` / `packet.duration` / `getDecoderConfig(` / `typeof Worker` / `OpusDecoderWebWorker` 均在位、`context.ts` 新调用点齐全、`getAudioTypeFromData` 无删除行、全仓 `mediabunny` 只出现在两个新文件、`script/build-game.ts` 的 `manualChunks` 仍 1 处）。
- `types.ts` 单 hunk：通过（1 个 `@@`，新增行含 `IMotaAudioContext` 与 `IAudioDecodeProvider`，删除行是旧的 `IMotaAudioContextCreator {`）。
- 11 路径哈希：通过，11 行集合与清单完全相等，逐条哈希未变。
- 依赖闸门：根 `dependencies.mediabunny` 恰为 `^1.66.3`，`git diff -U0 package.json` 只有 1 条新增行，锁文件含 `mediabunny@1.66.`（3 处引用），`packages/audio/package.json` 哈希未变。

### 全仓类型检查（`node node_modules/vue-tsc/bin/vue-tsc.js --noEmit`）

| 阶段 | error 头行数 | `packages/audio` error 头行数 |
|------|--------------|-------------------------------|
| 装依赖前（`gsd-09-61-tsc-before.txt`） | 279 | 0 |
| 装依赖后（`gsd-09-61-tsc-installed.txt`） | 279 | 0 |
| 改完源码与测试（`gsd-09-61-tsc-after.txt`） | 279 | 0 |

装依赖零新增、改完代码零新增，`packages/audio/` 全程零错误。

### 状态与提交

- 现场基线：13 条（用户并发改动 12 条 + 未跟踪的 `09-61-PLAN.md`）。
- Task 1 结束：基线 ∪ 6 个路径（`package.json`、`pnpm-lock.yaml`、`types.ts`、`context.ts`、`probe.ts`、`opusSession.ts`）。
- Task 2 结束：基线 ∪ 8 个路径（再加测试文件与本 SUMMARY）；基线条目一个不少、状态行不变。
- `HEAD` 两处断言均为 `282875c956c8a460768b6a705ef2356af21d7c8e`，未变；工作树仍脏。
- 新增文件纯 CRLF、0 制表符、无 BOM（4 个源码文件 + 测试文件 + 本 SUMMARY）。

## 未提交声明

- **0 提交**：未执行任何 git 写命令（`git add` / `git commit` / `git tag` / `git push` / `git stash` / `git checkout` / `git worktree`）。
- `.planning/config.json` 的 `workflow.commit_docs: true` 与 `mode: yolo` 会触发文档提交，本计划**显式跳过**该提交；`use_worktrees: true` 不适用，全程在当前工作树执行。
- 所有产物与本 SUMMARY 都**未提交**，留在工作树等用户验收。

## 偏差

1. **`pnpm add` 需要 `-w`**：首次 `pnpm.cmd add mediabunny@^1.66.3` 被 pnpm 以 `ERR_PNPM_ADDING_TO_ROOT` 拒绝（未写任何文件），随后加上 `-w` 才落到根 `package.json`。
2. **`^` 被 `cmd.exe` 吞掉**：通过 `pnpm.cmd` 调用时 `python` 语义外的 `^` 被 shell 解析剥除，pnpm 把版本存成精确值 `1.66.3`。为落到批准的 `^1.66.3`，先手工把 `package.json` 的该行改成 `^1.66.3`，再用 `D:\nvm\v24.21.0\node_modules\pnpm\pnpm.exe add mediabunny@^1.66.3 -w`（不经过 `cmd.exe`）让 pnpm 自己把锁文件 importer 的 `specifier` 更新为 `^1.66.3`。最终 `package.json` 仍只有 1 行新增，解析版本 1.66.3。
3. **`pnpm-workspace.yaml` 被 pnpm 自动追加**：pnpm 12 自动写入 `minimumReleaseAgeExclude: mediabunny@1.66.3`。该文件不在 `files_modified` 内，已按 HEAD 内容逐字节还原（blob `c5c1938`），因此不出现在 `git status`。如果本机的 minimum release age 策略需要该豁免，请用户自行重新加入。
4. **测试文件导入改为 `node:fs` 并加 `@ts-expect-error`**：计划原文写的是 `from 'fs'`，但仓库根类型检查未加载 Node 类型（既有 `packages/render-anim/src/__test__/parse.test.ts` 同样用 `// @ts-expect-error` 处理）。为让 `packages/audio` 保持零类型错误，按仓库既有范式改为 `node:fs` 并加说明注释；运行时行为不变，测试通过。
5. **prettier 归一了两处换行**：`probeAudio` 的签名与 `createDecodeSession` 内的容器判断条件被折成多行（行长归一，计划允许）；除此之外未改动规格外内容。
6. **门禁脚本与统计脚本写在固定临时目录** `C:/Users/13194/AppData/Local/Temp/opencode`（`gsd-09-61-*`），不是仓库产物。

## 未校准估算

- `confidence: low`，`tokens: 34000`，3 个任务 —— 未校准估算。
- 实测（按 realized diff 的字符数 / 4，与新代码同尺度）：约 4496 tokens；任务 3 个；提交 0 个。

## 用户验收

- 自动闸门只覆盖 Node 侧 tracer 测试与静态检查。
- 真实浏览器里原生支持与 WASM 兜底的降级效果（Safari 等不支持 Ogg Opus 的浏览器）请用户手动验收，不作为自动断言。
- 工作树与 SUMMARY 未提交，等待用户验收后再决定是否提交。
