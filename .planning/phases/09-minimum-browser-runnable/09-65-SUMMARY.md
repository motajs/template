---
phase: 09-minimum-browser-runnable
plan: 65
subsystem: audio
tags: [audio, probe, vorbis, opus, decoder-registry, tests]
status: complete
requires:
  - 09-64
provides:
  - 七容器格式探测（MP4 / WebM / Ogg / Wav / Flac / Mp3 / Adts）
  - toAudioContainer 与 readDuration（头部优先时长）
  - Ogg Vorbis 整文件解码会话 createVorbisDecodeSession
  - OpusCodecDecoder 与注入式 OpusDecodeSession
  - 可被 MotaAudioContext 委托的 AudioDecoderRegistry
affects:
  - packages/audio/src/probe.ts
  - packages/audio/src/opusSession.ts
  - packages/audio/src/context.ts
  - packages/audio/src/types.ts
tech-stack:
  added: []
  patterns:
    - 探测格式与会话格式共用同一份格式表
    - 编码解码器经注册表注入
    - 注册表逻辑抽成 Node 可测类
key-files:
  created:
    - packages/audio/src/vorbisSession.ts
    - packages/audio/src/decoderRegistry.ts
    - packages/audio/src/__test__/vorbisDecodeSession.test.ts
    - packages/audio/src/__test__/probeAudioFormats.test.ts
    - packages/audio/src/__test__/decoderRegistry.test.ts
  modified:
    - packages/audio/src/types.ts
    - packages/audio/src/probe.ts
    - packages/audio/src/opusSession.ts
    - packages/audio/src/context.ts
    - packages/audio/src/__test__/opusDecodeSession.test.ts
decisions:
  - 探测格式表扩到七个容器，不加入 MATROSKA
  - 时长先取头部，只有 Ogg / WebM 才整文件扫描
  - Vorbis 走容器级整文件会话，唯一一处 try / catch 只包 decodeFile
  - Opus 解码器抽成 OpusCodecDecoder，由注册表注入会话
  - 注册表逻辑抽成 AudioDecoderRegistry，Node 可直接测试
metrics:
  tasks: 3
  files: 10
  duration: 约 10 分钟
  completed: 2026-11-26
actuals:
  tokens: 7544
  tasks: 3
  commits: 0
---

# Phase 09 Plan 65: 补齐音频格式覆盖并接通解码器注册表 Summary

探测从 2 种容器扩到 7 种并按容器区分时长代价，新增 Ogg Vorbis 整文件会话，Opus 解码器抽成 `OpusCodecDecoder` 经注册表注入会话，并用 mediabunny 现场把 `bgm.opus` 转封装成 WebM 验证 WebM 解码路径。

## 问题

1. 探测只认 Ogg / WebM，MP3 / WAV / FLAC / ADTS / MP4 一律探测为 `null`，`IAudioFormatInfo` 对原生格式不可用。
2. 时长无条件 `computeDuration()`，MP3 / ADTS 这类没有头部时长的容器等于整文件扫描。
3. 浏览器原生不支持 Ogg Vorbis（Safari）时没有 `IAudioDecodeSession` 实现，只能落回 legacy。
4. WebM / Opus 分支只有 Ogg fixture，从未被实际跑过。
5. 09-60 声明的 `IAudioDecoderRegistry` / `IAudioCodecDecoder` / `AudioCodecDecoderCreateFunc` 没有实现，是死代码。

## 格式矩阵

| 容器 | 编码 | `AudioContainer` | `AudioCodec` | 时长来源 | `createDecodeSession` |
|------|------|------------------|--------------|----------|------------------------|
| Ogg | Opus | `Ogg` | `Opus` | `computeDuration`（头部无） | `OpusCodecDecoder` + `createOpusDecodeSession` |
| WebM | Opus | `WebM` | `Opus` | 头部优先，缺失才扫描 | `OpusCodecDecoder` + `createOpusDecodeSession` |
| Ogg | Vorbis | `Ogg` | `Vorbis` | `computeDuration`（头部无） | `createVorbisDecodeSession` |
| MP4 | AAC | `Mp4` | `Aac` | 头部 | `null` 继续原生 / legacy |
| WAVE | PCM | `Wav` | `Pcm` | 头部 | `null` 继续原生 / legacy |
| FLAC | FLAC | `Flac` | `Flac` | 头部 | `null` 继续原生 / legacy |
| MP3 | MP3 | `Mp3` | `Mp3` | 头部（有 Xing / ID3） | `null` 继续原生 / legacy |
| ADTS | AAC | `Adts` | `Aac` | 头部缺失时 `null`，不扫描 | `null` 继续原生 / legacy |
| 其它 | 任意 | `Unknown` | 无 | 无 | `logger.error(97)` + `null` |

MATROSKA 不在范围（`.mka` 超出本计划）。`mediaFormats` 恰为 `[MP4, WEBM, OGG, WAVE, FLAC, MP3, ADTS]`，`toAudioCodec` 的既有映射逐字未动。

## 新增命名

### B. probe.ts

| 名称 | 可见性 | 说明 |
|------|--------|------|
| `mediaFormats` | 模块常量 | 7 项容器表 |
| `toAudioContainer` | 模块私有函数（新增） | `(format: InputFormat): AudioContainer`，未命中返回 `Unknown` |
| `readDuration` | 模块私有函数（新增） | `(input: Input, container: AudioContainer): Promise<number | null>` |

`createMediaSource` / `createMediaInput` / `toAudioCodec` / `probeAudioSource` 签名不变。

### C. vorbisSession.ts

| 名称 | 可见性 | 说明 |
|------|--------|------|
| `IVorbisDecodedAudio` | 非导出 interface | `channelData` / `samplesDecoded` / `sampleRate` / `errors` |
| `IVorbisDecoderInstance` | 非导出 interface | `ready` / `decodeFile` / `free` |
| `IVorbisDecoderModule` | 非导出 interface | 两个构造签名 |
| `vorbisModule` | 模块级 let | 缓存已加载模块 |
| `readSourceBytes` | 模块私有函数 | 读取全部字节，不支持的输入返回 null |
| `loadVorbisDecoder` | 模块私有函数 | 动态加载，Node 主线程 / 浏览器 Worker |
| `VorbisDecodeSession` | export class | `implements IAudioDecodeSession` |
| `createVorbisDecodeSession` | export async function | 返回 `VorbisDecodeSession | null` |

### D. opusSession.ts

| 名称 | 可见性 | 说明 |
|------|--------|------|
| `OpusCodecDecoder` | 新增 export class | `implements IAudioCodecDecoder`，`configure` / `decode` / `flush` / `destroy`，零 static |
| `OpusDecodeSession` | export class | `decoder` 字段类型改为 `IAudioCodecDecoder` |
| `decodePacket` | 删除（private async） | 逻辑移入 `OpusCodecDecoder.decode`，其 jsDoc 一并删除 |
| `createOpusDecodeSession` | export async function（签名变更） | 三参 `(source, info, decoder: IAudioCodecDecoder)` |

### E. decoderRegistry.ts

| 名称 | 可见性 | 说明 |
|------|--------|------|
| `AudioDecoderRegistry` | export class | `implements IAudioDecoderRegistry`，`context` + `Map<AudioCodec, AudioCodecDecoderCreateFunc>` |
| 构造器 | 参数 | `constructor(context: IMotaAudioContext)` |

### F. context.ts

| 名称 | 可见性 | 说明 |
|------|--------|------|
| `codecRegistry` | 新增 private readonly 字段 | 类型为接口 `IAudioDecoderRegistry` |
| `registerCodecDecoder` | 新增 public | 委托 `codecRegistry` |
| `createCodecDecoder` | 新增 public | 委托 `codecRegistry` |
| 构造器 | 变更 | 末尾 `new AudioDecoderRegistry(this)` + 默认注册 Opus |
| `createDecodeSession` | 重写方法体 | Ogg + Vorbis → Vorbis 会话；Opus → 注册表解码器 + Opus 会话 |

### G. types.ts

| 项 | 变化 |
|----|------|
| `IMotaAudioContext` | 父接口追加 `IAudioDecoderRegistry`（1 个 hunk） |
| 删除命名 | `OpusDecodeSession.decodePacket` |

## 既有注释改动

H 表 6 处逐字：

1. probe.ts：`// 只声明本 tracer 支持的容器格式，避免为其它格式付解析器体积` → `// 声明本包支持的全部容器格式，原生支持的格式仍优先走浏览器解码`
2. probe.ts：`* 用 Ogg / WebM 精选格式表创建一个 mediabunny 输入` → `* 用支持格式表创建一个 mediabunny 输入`
3. probe.ts：`// 已注册格式表只有 Ogg / WebM，走到这里说明探测结果异常` → `// 已注册格式表覆盖全部支持的容器，走到这里说明探测结果异常`
4. opusSession.ts：保留既有三行 jsDoc，新增 `* @param decoder 已注册的 Opus 编码解码器`
5. opusSession.ts：`/** 当前会话使用的 Opus 解码器实例 */` → `/** 当前会话使用的 Opus 编码解码器 */`
6. opusDecodeSession.test.ts 首行：`// 校验 Ogg Opus 的格式探测、OpusHead 解析与整文件解码会话` → `// 校验 Ogg Opus 与 WebM Opus 的格式探测、编码解码器与整文件解码会话`

I 表允许的新增注释：probe.ts 的 `toAudioContainer` / `readDuration` jsDoc 内容行与 `// Ogg 与 WebM 不记录头部时长，整文件解码本来就要遍历全部数据`；opusSession.ts 的 `/** 当前配置好的 Opus 解码器，未配置时为空 */`；context.ts 的 `/** 编码解码器注册表 */` 与 `// Opus 解码器由 opus-decoder 自行管理资源，不需要音频上下文`；vorbisSession.ts / decoderRegistry.ts 全部为新增文件。注释闸门按 `(改前 − removed) ∪ added === 改后` 与 `改后 − (改前 ∪ added) 为空` 双重校验通过。

## WebM 测试决策

可行，不加二进制 fixture。用 mediabunny 的 `EncodedPacketSink` + `EncodedAudioPacketSource` + `Output` / `WebMOutputFormat` / `BufferTarget` 现场把 `bgm.opus` 转封装成 WebM，探测为 WebM/Opus、48000、2 声道；测试只消费前 50 个数据块就 break，避免二次整文件全量解码。

## 注册表测试决策

注册表逻辑抽到 `decoderRegistry.ts` 的 `AudioDecoderRegistry`，构造参数是 `IMotaAudioContext`，Node 里可直接 `new AudioDecoderRegistry({} as IMotaAudioContext)`，无需伪造 `AudioContext` / `Audio`。`decoderRegistry.test.ts` 的 2 个 it 覆盖「注册后返回同一实例」「未注册返回 null」「工厂收到上下文」。`context.ts` 只做委托，`gate-structure` 另做静态断言。

## MP3 / WAV 探测决策

`probeAudioFormats.test.ts` 的 1 个 it 使用仓库既有 fixture：`click.mp3` → Mp3/Mp3/44100/1 声道/0.0794 秒，`click.wav` → Wav/Pcm/44100/1 声道/0.0402 秒，容差 0.01 秒，不新增 fixture。「MP3 / WAV 不作整文件扫描」由结构闸门兜底：`computeDuration(` 全文件 1 处且位于 Ogg / WebM 条件之后。

## try / catch 例外

`vorbisSession.ts` 的 `createVorbisDecodeSession` 内 `decodeFile` 外层有本计划唯一一处 `try` / `catch`（AGENTS.md 第 26 行低层库例外，Task 0 已报备），`try` 只包 `decoded = await decoder.decodeFile(bytes);` 一行；catch 内 `void decoder.free();` + `logger.error(97);` + `return null;`，不新增 `throw`、不扩散。`context.ts` 既有的 `decodeNative` 的 try / catch 逐字未动，全仓 try 仅这两处。

## void 处理

三处 `void` 悬浮 Promise：`VorbisDecodeSession.close()` 的 `void this.decoder.free();`、`OpusDecodeSession.close()` 的 `void this.decoder.destroy();`、`createVorbisDecodeSession` 内抛错与零采样两处清理的 `void decoder.free();`。`close()` 是同步接口，用 `void` 显式声明不等待，避免悬浮 Promise 告警。

## 时间关卡

`gsd-09-65-clock.txt` 采集：账户 `13194`，采集时间 2026-11-26 16:54（本地）。Task 1 结束 17:01，Task 2 结束 17:03，全程未到晚于 22:00 的停止点，未触发时间关卡停止。

## 日志码

本计划不新增日志码，复用 error 97（容器未知 / 无主音轨 / Opus 会话创建失败 / Vorbis 解码抛错 / Vorbis 解码零采样）与 warn 217（不支持的输入类型）。已知语义偏差：97 的既有消息偏「音轨或解码描述缺失」，用在 Vorbis 抛错与零采样上并非逐字贴合；本计划未新增 98，留待用户另行批准。

## 闸门真实输出

| 闸门 | 真实输出 | 结果 |
|------|----------|------|
| 结构 --source | `STRUCTURE GATE OK (--source)` | 通过 |
| 结构 --full | `STRUCTURE GATE OK (--full)` | 通过 |
| 注释 --source | `COMMENTS GATE OK (--source)` | 通过 |
| 注释 --full | `COMMENTS GATE OK (--full)` | 通过 |
| typesdiff | `TYPESDIFF GATE OK (hunks=1)` | 通过 |
| 守卫哈希 | `GUARD GATE OK (16 paths unchanged)` | 通过 |
| 文本 7 文件 | `TEXT GATE OK (7 files)` | 通过 |
| 文本 10 文件 | `TEXT GATE OK (10 files)` | 通过 |
| opus 单文件测试 | `6 passed (6)`（Task 1） | 通过 |
| 全量音频测试 | `Test Files 4 passed (4)` / `Tests 14 passed (14)` | 通过 |
| tsc 改前 | 基线 279 error 头行，`packages/audio` 0 error | 记录 |
| tsc Task 1 | `TSC GATE OK (baseline=279 compare=279 added=0 audio=0)` | 通过 |
| tsc Task 2 | `TSC GATE OK (baseline=279 compare=279 added=0 audio=0)` | 通过 |
| 范围 Task 1 | `SCOPE GATE OK (--expect-task1, added=7, external=1)` | 通过 |
| HEAD | `HEAD GATE OK (unchanged, head=82ae65a)` | 通过 |
| prettier | `All matched files use Prettier code style!` | 通过 |
| eslint | 退出码 0、0 warning | 通过 |
| SUMMARY | `SUMMARY GATE OK` | 通过 |

## 未改项

16 条只读守卫路径哈希逐条未变：`packages/common/src/logger.ts`、`packages/common/src/logger.json`、`packages/audio/src/source.ts`、`packages/audio/src/bgm.ts`、`packages/audio/src/decoder.ts`、`packages/audio/src/effect.ts`、`packages/audio/src/sound.ts`、`packages/audio/src/support.ts`、`packages/audio/src/index.ts`、`packages/audio/src/route.ts`、`packages/audio/package.json`、`package.json`、`pnpm-lock.yaml`、`script/build-game.ts`、`vite.config.ts`、`vitest.perf.config.ts`。零新增依赖、零 `logger.json` 改动、零新增 `throw`、零 `static`、`index.ts` barrel 未动。

## 偏差

1. 使用了 `prettier --write` 兜底：Write 工具写出 LF，先 `--write` 归一为 CRLF 并重排长行，之后 `--check` 通过（Task 1 与 Task 2 各一次）。
2. 外部并发改动：执行期间用户新增 `docs/.vitepress/components/demos/ui/text-demo-materials.ts`，与本计划无关；范围闸门以 `gsd-09-65-external-added.txt` 白名单记录该外部新增并继续，未回退。基线其余条目状态行未变。
3. 无其它偏差；规格未放宽任何断言。

## 未校准估算

计划估算 `confidence: low`、`tokens: 36000`、3 个任务（advisory）。实测按「修改文件 git diff 字符数 + 新建文件字符数」求和 30176 字符，除以 4 得约 7544 tokens；3 个任务；0 提交。估算明显高于实测，属未校准估算的保守取值。

## 未提交声明

本计划 0 提交：未执行任何 `git add` / `git commit` / `git tag` / `git push` / `git stash` / `git checkout` / `git worktree` / `git restore`；显式跳过 `workflow.commit_docs`；未使用 worktree。产物与本文档留在工作树等用户验收。

## 用户验收

真实浏览器里原生支持与 WASM 兜底的降级效果（Safari 等不支持 Ogg Vorbis 的环境）由用户手动验收，不作为自动断言。
