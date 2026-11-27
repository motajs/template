---
phase: 09-minimum-browser-runnable
plan: 66
subsystem: audio
tags: [streaming, opus, vorbis, mediabunny, ogg-vorbis, web-audio, pcm-scheduler]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    plan: 65
    provides: OpusCodecDecoder、AudioDecoderRegistry、7 格式探测与整文件 Vorbis 会话
provides:
  - AudioStreamDecoder：推送转拉取桥 + 首包编码判定 + Opus 增量解包 + Vorbis 增量解码
  - AudioPcmScheduler：按已解码采样数的单条时间线、窗口排期、暂停续播、循环重排、合并 AudioBuffer
  - AudioStreamSource 内部替换为解码器 + 调度器组合，公开面与生命周期不变
  - streamDecoder.test.ts（4 个 it）与 pcmScheduler.test.ts（6 个 it）
affects: [09-67 BGM 选择与接入、构建懒加载、旧依赖清理、decoder.ts 旧解码器删除、seek]

actuals:
  tokens: 10940
  tasks: 3
  commits: 0
  plan_head_before: 72599d465be8016be4b2b08ed69410ddabfff8b1

tech-stack:
  added: []
  patterns:
    - 推送转拉取：ReadableStream + mediabunny ReadableStreamSource 承载未知长度的增量字节
    - 首包嗅探后固定编码，Opus 与 Vorbis 各走一条增量路径，互不复用字节
    - 以已解码采样数为唯一时间线来源，节点按窗口提前 start(when, offset) 排期

key-files:
  created:
    - packages/audio/src/streamDecoder.ts
    - packages/audio/src/pcmScheduler.ts
    - packages/audio/src/__test__/streamDecoder.test.ts
    - packages/audio/src/__test__/pcmScheduler.test.ts
  modified:
    - packages/audio/src/source.ts
    - packages/audio/src/types.ts

key-decisions:
  - "Opus 走 StreamBridge + ReadableStreamSource + EncodedPacketSink + 注册表 OpusCodecDecoder，Vorbis 直接把原始 Ogg 字节喂 ogg-vorbis，同一份字节只消费一次"
  - "编码判定以首个 Ogg 包（OpusHead / 0x01 vorbis）或 EBML 魔数为准，64 KiB 内未决即按不支持处理"
  - "pump(undefined, true) 在解码器最前面显式处理，未判定即 fail(25)、Opus 只关桥、Vorbis 只 flush，绝不把 undefined 追加或解码"
  - "调度器以采样时间线排期，节点结束同时以 playing 与存活节点集合为准，stop/free/restartLoop 先摘除 onended 再 stop"
  - "setChunkSize 语义改为单节点最大窗口时长，types.ts 只改这一处 jsDoc"

requirements-completed: []

coverage:
  - id: D1
    description: "AudioStreamDecoder 对 Ogg Opus / WebM Opus / Ogg Vorbis 分块增量解码，不支持数据不产出块"
    verification:
      - kind: unit
        ref: "packages/audio/src/__test__/streamDecoder.test.ts#流式解码"
        status: pass
    human_judgment: false
  - id: D2
    description: "AudioPcmScheduler 的排期、暂停、续播、循环、结束回调与多窗口中间节点语义"
    verification:
      - kind: unit
        ref: "packages/audio/src/__test__/pcmScheduler.test.ts#采样调度器"
        status: pass
    human_judgment: false
  - id: D3
    description: "AudioStreamSource 在真实浏览器中的起播时延、无缝播放、暂停续播、循环与释放听感"
    verification: []
    human_judgment: true
    rationale: "自动化无法覆盖真实 AudioContext 的时序与听感，需要用户用 Safari 等不支持 Ogg 的浏览器做 UAT"

duration: 11min
completed: 2026-11-26
status: complete
---

# Phase 09 Plan 66: 流式音频内核 Summary

**AudioStreamSource 换成推送转拉取桥 + 增量解码器 + 采样时间线调度器，公开面不变，0 提交**

## Performance

- **Duration:** 约 11 min
- **Started:** 2026-11-26T19:30:22Z
- **Completed:** 2026-11-26T19:40:38Z（源码与测试完成；SUMMARY 随后落盘）
- **Tasks:** 3（Task 0 汇报关卡已由用户以「可以执行」批准）
- **Files modified:** 6（2 新建源码、2 新建测试、2 修改）

## 要解决的问题

1. 旧 `AudioStreamSource` 用 `codec-parser` 解析、`createDecoder` 创建 `ogg-opus-decoder` / `ogg-vorbis`，把所有 PCM 按 10 秒块攒进 `audioData`，每次扩容都 `mergeBuffers()` 重建整个 `AudioBuffer` 并重启节点，块边界容易断音。
2. 09-61..09-65 已建立 mediabunny 会话体系（`OpusCodecDecoder`、`AudioDecoderRegistry`、探测、整文件 Vorbis 会话），流式播放却仍走旧解码器，同一容器存在两套解码与两套错误处置。
3. mediabunny 的 `Input` 只在 `Uint8Array` / `Blob` / URL 上用过，没有验证过 `ReadableStreamSource` 的增量读取。
4. 旧 `checkBufferedPlay` 用「已缓冲时长 - 上次开始缓冲点」估算播放位置，暂停续播、循环、`currentTime` 都只是近似。

## 架构

### 数据流

```
StreamLoader.pump(data, done)
  -> AudioStreamSource.pump
     -> AudioStreamDecoder.push(data, done)
        未判定: 追加前缀副本（<= 64 KiB）
        Ogg Opus / WebM Opus: StreamBridge.push(prefix + 后续 data)
          Input(ReadableStreamSource) -> EncodedPacketSink.packets()（后台）
            -> OpusCodecDecoder.decode -> 有序队列
        Ogg Vorbis: ogg-vorbis.decode(prefix 逐块 + 后续 data)（push 内 await）
          -> 有序队列；done 时 flush
        Unsupported: logger.error(25, 头部十六进制) + 结束
  <- AudioStreamSource.consumeChunks 后台消费有序队列
     -> AudioPcmScheduler.append(chunk)
     -> maybeStart（阈值满足且未被用户暂停则起播）
StreamLoader.end(true) -> AudioStreamSource.end(true)
  -> 等 consumeTask 结束 -> scheduler.markEnded() + merge() -> buffer
  -> loaded = true + 钩子 onLoad
```

- Opus 的 `EncodedPacketSink.packets()` 自带约 1 秒预读且会阻塞等待后续数据，因此消费放在后台任务 `consumeOpus`，`pump` 只写桥，不会被卡住。
- Vorbis 不建桥、不喂 mediabunny，直接按原顺序把原始 Ogg 字节交给 `@wasm-audio-decoders/ogg-vorbis` 的增量 `decode` / `flush`。
- 前缀只是 `push` 时保存的字节副本；判定后 Opus 写入新建的桥，Vorbis 重放给解码库，不会从 `pump` 收到的原始流里二次读取。

### 首包判定

- `prefix.length < 4`：`NeedMore`。
- `OggS`：至少 27 字节取页头段数 `prefix[26]`，首包位于 `27 + segments`；`OpusHead` 判 Ogg Opus，`0x01` + `vorbis` 判 Ogg Vorbis，其余 `Unsupported`，字节不足 `NeedMore`。
- `1A 45 DF A3`：`WebMOpus`，打开后再用 `track.getCodec()` 复核，非 `opus` 即不支持。
- 其他字节 `Unsupported`；达到 64 KiB 仍 `NeedMore` 也按不支持处理。

### 采样调度器

- `append` 记录 `chunkStarts` / `chunks` / `bufferedSamples`，首个有效块写入 `sampleRate` / `channelCount`，声道数不一致的后续块静默丢弃。
- `schedule` 把 `[scheduledSamples, bufferedSamples)` 按不超过 `windowDuration` 的窗口切分，`when = max(currentTime + 0.05, plannedTime)`，落后窗口整体丢弃。
- `start(when)` 先置 `playing = true`，以传入 `when` 建立锚点（`anchorSample` / `anchorTime` / `scheduledSamples` / `pendingOffset` / `plannedTime`），不读取 `pendingStart`；`start` 不清 `ended`。
- `stop()` 先记录 `currentTime` 并置 `playing = false`，再逐个摘除 `onended` 后 `stop()`，返回暂停源时刻。
- `handleNodeEnd` 先 `nodes.delete(node)`，再判 `!playing`、`nodes.size > 0`、`scheduledSamples < bufferedSamples`，只有最后一个存活节点在播放中自然结束且文件已结束时才循环重排或触发 `onPlaybackEnd`。
- `free()` 停止节点、清空 PCM 与全部计数，重置 `ended` 但保留 `loop`。

## 命名清单

### 新建文件

| 文件 | 角色 | 进 barrel |
|------|------|-----------|
| `packages/audio/src/streamDecoder.ts` | 字节流到 PCM 块的增量解码器（含内部推送桥） | 否 |
| `packages/audio/src/pcmScheduler.ts` | PCM 存储与 `AudioBufferSourceNode` 排期 | 否 |
| `packages/audio/src/__test__/streamDecoder.test.ts` | 三格式分块解码测试 | 不适用 |
| `packages/audio/src/__test__/pcmScheduler.test.ts` | 调度器伪造上下文测试 | 不适用 |

### `streamDecoder.ts`

`StreamFormatGuess`（模块私有 `const enum`，`NeedMore` / `Unsupported` / `OggOpus` / `OggVorbis` / `WebMOpus`）、`SNIFF_LIMIT`、`sniffStreamFormat`、`toHexHeader`、`IStreamBridge`、`StreamBridge`、`IVorbisStreamChunk`（见偏差）、`IVorbisStreamDecoder`、`IVorbisDecoderModule`、`vorbisModule`、`loadVorbisStreamDecoder`、`IAudioStreamDecoder`、`AudioStreamDecoder`（字段 `info` / `chunks` / `failed` / `opusDecoder` / `ended` / `prefix` / `prefixBytes` / `format` / `bridge` / `input` / `vorbis` / `opusTask` / `pending` / `waiter` / `vorbisSamples` / `headerHex` / `errorReported`；方法 `push` / `close` / `decideFormat` / `prepareOpus` / `openOpus` / `consumeOpus` / `openVorbis` / `runVorbisChunk` / `enqueueVorbis` / `enqueue` / `wake` / `fail` / `generateChunks`）。

### `pcmScheduler.ts`

`MIN_START_LEAD`（0.05）、`PlaybackEndCallback`、`IAudioPcmScheduler`、`AudioPcmScheduler`（字段 `ac` / `bufferedSamples` / `sampleRate` / `playing` / `onPlaybackEnd` / `idleNode` / `lastNode` / `chunks` / `chunkStarts` / `channelCount` / `windowDuration` / `maxWindowSamples` / `anchorSample` / `anchorTime` / `scheduledSamples` / `pendingOffset` / `plannedTime` / `haltedTime` / `pendingStart` / `loop` / `ended` / `nodes` / `target`；getter `currentTime` / `duration` / `output`；方法 `setWindowDuration` / `connect` / `setLoop` / `append` / `markEnded` / `start` / `stop` / `merge` / `free` / `schedule` / `buildWindow` / `handleNodeEnd` / `restartLoop`）。

### `source.ts`

- 新增 `scheduler`（`private readonly AudioPcmScheduler`）、`consumeTask`、`stoppedByUser`；`decoder` 类型改为 `AudioStreamDecoder | null`。
- 新增私有方法 `consumeChunks` / `appendChunk` / `maybeStart` / `finishLoad` / `handlePlaybackEnd` / `teardownDecoder`。
- `output` 改为 `get output()` 委托 `scheduler.output`；`currentTime` 改为 `get` 委托 `scheduler.currentTime`。
- 删除字段 `audioType`、`headerRecieved`、`parser`、`audioData`、`lastStartWhen`、`lastStartTime`、`lastBufferSamples`、`bufferChunkSize`、`loop`、`target`。
- 删除方法 `checkSampleRate`、`decodeData`、`decodeFlushData`、`appendDecodedData`、`checkBufferedPlay`、`mergeBuffers`、`createSourceNode`、`playAudio`。
- 删除模块项 `mimeTypeMap`、`isOggPage` 与 `codec-parser` / `lodash-es` / `AudioType` / `IAudioDecodeData` / `IAudioDecoder` 旧 import。
- `AudioElementSource` / `AudioBufferSource` 逐字未动。

## 既有注释改动（H 表逐项）

1. `source.ts` `setChunkSize` jsDoc：「设置每个缓存数据的大小，默认为10秒钟一个缓存数据」→「设置单个调度节点的最大窗口时长，默认为 10 秒」；`@param size` 原行保留。
2. `bufferChunkSize` / `audioData` 字段注释随字段删除。
3. `lastStartWhen` / `lastStartTime` / `lastBufferSamples` 字段注释随字段删除。
4. 旧私有方法 `checkSampleRate` / `decodeData` / `decodeFlushData` / `appendDecodedData` / `checkBufferedPlay` / `mergeBuffers` / `playAudio` / `createSourceNode` 的注释随方法删除。
5. `errored` 上方新增一行语义注释。
6. `types.ts` `setChunkSize` jsDoc：「设置每个缓存数据的大小，默认为10秒钟一个缓存数据」→「设置单个调度节点的最大窗口时长，默认为 10 秒」，保留「只能在加载开始前设置」后缀与 `@param size` 行；**本文件仅此一处 hunk，无任何代码改动**（`git diff` 为 1 增 1 删）。

新增注释只出现在新文件的注释行与 `source.ts` 新增成员/方法上，未改写其它既有注释。

## `try` / `catch` 与 `void`

- 三个源码文件中 `try` 合计恰好 **1 处**，位于 `streamDecoder.ts` 的共享私有方法 `runVorbisChunk`，同一个 `try` 同时包住 `decode` 与 `flush`（AGENTS.md 第 26 行低层库例外），未拆成两个 `try`。
- `catch` 内按约定 `void vorbis.free()`、置空、`fail(25)`，不新增 `throw`。
- `09-65` 已有的 `vorbisSession.ts` `decodeFile` try/catch 属既有代码，本计划未触碰。
- `void` 用于悬浮 Promise：`openOpus(...).catch(...)`、`vorbis.free()`、`finishLoad()`、`opusTask` 的 `.catch`（Promise 处理器，不是 `try` / `catch` 语法）。
- 三个源码文件 `static` 与 `throw` 均为 0；`source.ts` 不含 `codec-parser` / `Promise.reject(` / `AudioWorklet`；新文件不 import `./source`。

## 终止推送与存活节点判据

- `pump(undefined, true)` 是最常见的终止形式。`AudioStreamDecoder.push` 最前面先判 `failed` / `ended`，随后对 `data === undefined` 显式处理：未判定且 `done` 真 → `fail(25)`（不追加前缀、不判定、不解码）；未判定且 `done` 假 → 直接返回；Opus → 只 `bridge.close()`；Vorbis → 只 `runVorbisChunk(null)`（即 `flush`）。任何路径都不会把 `undefined` 追加到 `prefix` / `pending` 或传给 `decode`。
- 测试终止一律 `await decoder.push(undefined, true)`，随后 `await` 消费排空，不在最后一个数据块后调用 `close()`。
- `handleNodeEnd` 先 `nodes.delete(node)`，再依次判 `!playing`（暂停/释放触发的 `ended` 不重排、不回调）、`nodes.size > 0`、`scheduledSamples < bufferedSamples`；仅最后一个存活节点自然结束时才判断循环重排 / `onPlaybackEnd`。未结束就保持 `playing` 等新数据。
- `stop()` / `free()` / `restartLoop()` 在 `node.stop()` 前先把 `node.onended` 置空，双重保证暂停不会重启循环或触发结束钩子。未使用 `scheduledSamples < bufferedSamples` 作为「还有后续节点」的判据。

## 桥背压说明

`StreamBridge.push` 不读取 `controller.desiredSize`，队列随网络到达增长。上限由 BGM 文件体积与 `ReadableStreamSource` 的 32 MiB 缓存自然约束；解码后的 PCM 本来就要整曲保留，供 `buffer` 与 BGM 缓存池使用，因此没有额外丢弃或暂停拉取。桥只在 Opus 判定后创建，Vorbis 不创建桥；`close` 是唯一结束方式，不向流 `error`，读取以 EOF 结束，不产生未处理拒绝。

## 自动化测试真实输出

命令：`node node_modules/vitest/vitest.mjs run packages/audio/src/__test__`

```
 ✓ packages/audio/src/__test__/decoderRegistry.test.ts (2 tests)
 ✓ packages/audio/src/__test__/probeAudioFormats.test.ts (1 test)
 ✓ packages/audio/src/__test__/vorbisDecodeSession.test.ts (3 tests)
 ✓ packages/audio/src/__test__/opusDecodeSession.test.ts (8 tests)
 ✓ packages/audio/src/__test__/streamDecoder.test.ts (4 tests)
 ✓ packages/audio/src/__test__/pcmScheduler.test.ts (6 tests)

 Test Files  6 passed (6)
      Tests  24 passed (24)
```

- `streamDecoder.test.ts`：Ogg Opus 16 KiB 分块（> 48000 采样、双声道、48 kHz、峰值 > 0.001、时间戳单调）；WebM Opus（现场 `transmuxToWebM` 转封装，16 KiB 分块）；Ogg Vorbis 333 字节分块（总数恰好 1772、单声道、44.1 kHz）；64 字节全零不支持数据产出 0 块且 `failed === true`，并记录 `[ERROR Code 25] ... File header: '00 00 ...'`。
- `pcmScheduler.test.ts`：起播 `when = 0.05`、偏移 0、`duration = 1`、时钟推进后 `currentTime` 跟随；暂停返回 0.5 且续播窗口为 1500 采样；循环重排起点不早于上一节点结束且不回调；非循环结束回调一次且 `playing === false`；0.1 秒窗口产生 5 个节点、首个结束不回调、其余全部结束才回调一次；`stop()` 后手动调用保存的 `onended` 不重排、不回调。
- 既有 14 个 it 全绿。

## 用户 UAT 清单

自动化不覆盖真实 `AudioContext` 的时序与听感，以下由用户验收：

1. Safari（不支持 Ogg）加载 `bgm.opus`：确认 1 秒内起播；整曲无可闻断音与爆音；暂停后恢复位置正确；循环回到开头；`free()` 后不再发声且内存回落。
2. `click.ogg`（Ogg Vorbis 流式路径）各验一遍：起播、连续播放、暂停续播、循环、`free()`。
3. 观察控制台无 `error 25` / `error 97`（正常文件不应触发）。

## 闸门真实输出

| 闸门 | 命令要点 | 结果 |
|------|----------|------|
| 既有音频测试 | `vitest run packages/audio/src/__test__`（Task 1 时） | 4 文件 / 14 tests passed |
| 流式解码测试 | `vitest run .../streamDecoder.test.ts` | 4 passed |
| 调度器测试 | `vitest run .../pcmScheduler.test.ts` | 6 passed（首次运行 3 个失败：伪造上下文把构造器占位节点计入，测试 helper 清空后重跑通过，未改源码语义） |
| 整包音频测试 | `vitest run packages/audio/src/__test__` | 6 文件 / 24 tests passed |
| 类型 | `vue-tsc --noEmit` 与基线对比 | `TSC OK 279 279`，`packages/audio` 0 error，总数不增 |
| eslint | `eslint --max-warnings 0` 5 个 ts 路径 | 退出码 0，无 warning |
| prettier | `prettier --check` 6 个 ts 路径 | All matched files use Prettier code style |
| 结构 | `static` / `throw` / `try` / 残留 / import 检查 | `STRUCTURE OK`（try 合计 1） |
| 循环引用 | `madge packages/audio/src/source.ts` | `CIRCULAR OK` |
| 范围 | `git status --porcelain -uall` = 基线 ∪ 7 路径 | `SCOPE OK` |
| HEAD | 与现场基线一致 | `HEAD OK 72599d465be8016be4b2b08ed69410ddabfff8b1` |

## 未改项

- 未改 `bgm.ts`、`context.ts`、`decoder.ts`、`decoderRegistry.ts`、`effect.ts`、`sound.ts`、`support.ts`、`route.ts`、`index.ts`、`opusSession.ts`、`vorbisSession.ts`、`probe.ts`。
- 未改 `packages/common/src/logger.json` / `logger.ts`、`packages/audio/package.json`、根 `package.json`、`pnpm-lock.yaml`、`script/build-game.ts`、`vite.config.ts`、`vitest.perf.config.ts`。
- 未新增依赖、未执行任何包管理写命令；未新增日志码（只用既有 25 / 97 / 44 / 48）；未新增 `static`；未新增 `throw`；未使用 `AudioWorklet`；未实现 `seek`、BGM 接入、`manualChunks` / 懒加载、旧依赖清理、`decoder.ts` 删除（均属 09-67）。
- 未更新 `ROADMAP.md` / `STATE.md` / `09-CONTEXT.md` / 任何既有计划或摘要；未修改任何既有注释（H 表 6 项除外）。
- 未改 `src/`、`packages-user/`、`docs/` 与任何用户改动。

## 偏差

### 1. [Rule 3 - 阻塞] 新增非导出接口 `IVorbisStreamChunk`

- **发现于：** Task 1（实现 `streamDecoder.ts` 的 Vorbis 接口）。
- **问题：** `@wasm-audio-decoders/ogg-vorbis` 的 `decode` / `flush` 返回 `channelData: Float32Array[]`（`Float32Array<ArrayBufferLike>`），不能赋给 `IAudioDecodeData.channelData: Float32Array<ArrayBuffer>[]`；若接口直接用 `IAudioDecodeData`，动态导入的构造函数类型不兼容，无法通过类型检查。
- **处理：** 在 `streamDecoder.ts` 内新增非导出接口 `IVorbisStreamChunk`（`channelData: Float32Array[]` / `samplesDecoded` / `sampleRate` / `errors`），仅用于匹配库的返回类型；真正的数据块仍在 `enqueueVorbis` 中逐声道 `new Float32Array(channel)` 复制后进入 `IAudioDecodedChunk`。
- **影响：** 纯类型辅助，非导出、不在命名报备清单内；不影响公开面与运行时行为。已在此登记。
- **验证：** `vue-tsc` `packages/audio` 0 error，总数 279 与基线一致。

### 2. [Rule 1 - Bug] `currentTime` 在采样率未知时避免 NaN

- **发现于：** Task 1（实现 `AudioPcmScheduler.currentTime`）。
- **问题：** 严格按公式 `min(anchorSample + ..., scheduledSamples / sampleRate)` 在 `sampleRate === 0` 时为 `0 / 0 = NaN`；虽然正常路径 `maybeStart` 保证采样率已知，但直接复用调度器时会返回 NaN。
- **处理：** 在 getter 内先判 `!playing || sampleRate === 0` 返回 `haltedTime`，其余夹取顺序保持「先已排期采样上界，再 `[0, duration]`」。
- **验证：** 调度器 6 个测试通过；未改变正常路径语义。

### 3. [Rule 1 - Bug] 不支持路径的 `headerHex` 为空

- **发现于：** Task 2（运行不支持数据用例）。
- **问题：** 初版在判定成功后才记录 `headerHex`，导致 `Unsupported` / 超限时 `logger.error(25, '')` 输出空文件头，与规格「记一次 `logger.error(25, 头部十六进制)`」不符。
- **处理：** 在 `decideFormat` 取到判定结果的同一处先记 `headerHex = toHexHeader(prefix)`，再进入各分支。
- **验证：** 用例输出 `File header: '00 00 ...'`，4 个解码测试全绿。

### 4. [测试实现] 伪造上下文需排除构造器占位节点

- **发现于：** Task 2（`pcmScheduler.test.ts` 首跑）。
- **问题：** `AudioPcmScheduler` 构造器会 `createBufferSource()` 创建占位节点，伪造上下文的节点列表把它也算作排期节点，导致断言偏移 2。
- **处理：** 测试 helper 在构造调度器后清空伪造节点记录，再 `connect` 与 `start`；未改源码。
- **验证：** 6 个测试全部通过。

---

**偏差合计：** 3 处自动修复（1 阻塞、2 Bug）+ 1 处测试实现调整。
**对计划影响：** 均为类型/边界正确性所需；未扩大范围、未新增依赖、未新增日志码，公开面与规格一致。

## 未校准估算

计划 frontmatter 的 `estimate` 为**未校准估算**（`confidence: low`，`tokens: 48000`、`raw_tokens: 48000`、`tasks: 3`），仅作 advisory，不作为拆分或阻断依据。实际 `actuals.tokens = 10940`（新文件全文 + 两个修改文件新增行字符数合计 43758 的 chars/4），显著低于估算；该估算尚未校准，本计划执行结果可用于后续校准，但不代表估算方法已收敛。

## 未提交声明（0 提交）

- 全程**未执行任何 git 写命令**：无 `git add` / `add -N` / `commit` / `tag` / `push` / `stash` / `checkout` / `worktree` / `restore`。
- 显式覆盖 `.planning/config.json` 的 `workflow.use_worktrees: true` 与 `commit_docs: true`：在当前工作树 `D:\github\template` 直接执行，未创建 worktree、未创建分支。
- `commits: 0`（本计划 HEAD 未移动）；`plan_head_before = 72599d465be8016be4b2b08ed69410ddabfff8b1`。工作树产物与 `09-66-SUMMARY.md` 均留在工作树，等待用户验收。
- 外部并发改动（`packages-user/client-base/src/components/*.tsx`、`src/client/ui/bookDetail.tsx`、`.planning/phases/10-docs-restructure/skeletons/*`、本计划 PLAN 文件）只记录、未回退；执行期间集合未新增本计划路径以外的条目，HEAD 未被外部推进。

## Issues Encountered

- 无阻碍性问题。调度器测试首跑失败全部来自伪造上下文把占位节点计入，修正测试 helper 后通过；源码语义未因此调整。

## Next Phase Readiness

- `AudioStreamSource` 已能在三种受支持编码上增量解码并排期播放，内部与 09-65 的注册表/`OpusCodecDecoder` 对齐，旧 `codec-parser` 依赖已从 `source.ts` 移除。
- 09-67 可在此基础上做 BGM 选择/接入改造、`manualChunks` / 懒加载、旧依赖与 `decoder.ts` 清理、以及 `seek`。
- 待用户在真实浏览器完成 UAT（尤其 Safari 的 Opus 流式路径与 `click.ogg` 的 Vorbis 路径）。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-11-26*
