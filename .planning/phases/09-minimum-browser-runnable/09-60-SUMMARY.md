---
phase: 09-minimum-browser-runnable
plan: 60
subsystem: audio
tags:
    - audio
    - hook
    - interface
    - incremental
requires:
    - 既有 packages/audio/src/types.ts — IAudioSource / IAudioRoute / IMotaAudioContext 等声明
    - packages/common/src/hook.ts — Hookable / HookController
    - packages/common/src/types.ts — IHookBase / IHookable / IHookController
provides:
    - 10 个解码 / 格式导出类型（AudioContainer、AudioCodec、AudioInputSource、IAudioFormatInfo、IAudioDecodedChunk、IAudioDecodeSession、IAudioDecodeProvider、IAudioCodecDecoder、AudioCodecDecoderCreateFunc、IAudioDecoderRegistry）
    - IAudioSourceHooks / IAudioRouteHooks（替换 EAudioSourceEvent / EAudioRouteEvent）
    - 4 处 protected createController，4 个类改为 extends Hookable
affects:
    - packages/audio/src/types.ts
    - packages/audio/src/source.ts
    - packages/audio/src/route.ts
    - packages/audio/src/bgm.ts
actuals:
    tokens: 3300
    tasks: 3
    commits: 0
tech-stack:
    patterns:
        - 事件系统迁移到 Hookable / HookController，emit 改为 forEachHook 同步遍历
        - 一次性 load 钩子用 controller.unload() 自卸载，等价旧实现的 once
        - 解码 / 格式接口只做声明，IMotaAudioContext 不新增成员
key-files:
    created:
        - .planning/phases/09-minimum-browser-runnable/09-60-SUMMARY.md
    modified:
        - packages/audio/src/types.ts
        - packages/audio/src/source.ts
        - packages/audio/src/route.ts
        - packages/audio/src/bgm.ts
key-decisions:
    - IMotaAudioContext 不新增成员，解码接口作为独立声明存在，避免写运行时桩
    - AudioRoute 构造器不保存 source 钩子控制器，与旧实现一致（旧实现也从未移除监听）
    - bgm.ts 用 BGMInfo.controller 取代 startFn / endFn 两个字段，移除时按控制器卸载
duration: 约 25 分钟
completed: 2026-11-24T16:30:03+08:00
status: complete
gate_status: 1 个门禁失败（外部原因：用户并发改动 thumbnail.tsx，详见「门禁真实输出」与「偏差」）
---

# Phase 09 Plan 60: 音频包接口设计 + 事件系统 Hook 迁移 Summary

把音频包的事件系统从 `eventemitter3` 迁移到项目现行的 `Hookable` / `HookController`，并在 `types.ts` 先把后续解码 / 格式接口定下来；解码实现（mediabunny、opus / vorbis 解码、流式重构）不在本计划范围。**0 提交，工作树留待验收。**

## 要解决的问题

`packages/audio` 的事件系统建立在 `eventemitter3` 上：`EAudioSourceEvent` / `EAudioRouteEvent` 直接作为 `EventEmitter` 的泛型参数，与本项目现行的 `Hookable` / `IHookable` / `HookController` / `IHookController` 设计不一致。同时，浏览器可运行版本需要一套与具体解码库无关的格式 / 解码接口，仓库里没有任何声明。本计划只**定接口 + 迁事件系统**，解码实现另行派发。

## 文件清单

| 文件 | 变更 |
|------|------|
| `packages/audio/src/types.ts` | import 首行替换为 `IHookBase` / `IHookable`；`EAudioSourceEvent` 替换为 `IAudioSourceHooks`；`EAudioRouteEvent` 替换为 `IAudioRouteHooks`；`IAudioSource` / `IAudioRoute` 父类型改为 `IHookable<...>`；文件末尾新增 `//#region 音频解码`（10 个导出类型） |
| `packages/audio/src/source.ts` | import 块替换；3 个类改 `extends Hookable<IAudioSourceHooks>`；各插入 `createController`；9 处 `emit` 改 `forEachHook` |
| `packages/audio/src/route.ts` | import 块替换；类改 `extends Hookable<IAudioRouteHooks>`；构造器两条 `source.on(...)` 合并为一次 `source.addHook({ onEnd, onPlay })`；插入 `createController`；13 处 `emit` 改 `forEachHook` |
| `packages/audio/src/bgm.ts` | import 段替换；`BGMInfo` 的 `startFn` / `endFn` 改为 `controller`；`removeBgm` 改 `removeHookByController`；`setTransition` 改一次 `addHook`；`play` 三个分支的 `once('load')` 改为一次性 `onLoad` 自卸载钩子 |
| `.planning/phases/09-minimum-browser-runnable/09-60-SUMMARY.md` | 本摘要 |

合计 30 个 diff hunk，集中在上述 4 个文件的 import 段、类型声明段与事件触发点；`actuals.tokens` 按 `git diff` 增删字符数 / 4 实测为 3300。

## 新增命名（均已获用户「可以执行」批准）

### A. 10 个新增导出类型（`types.ts`，只声明）

- `AudioContainer`（`export const enum`）：`Unknown` / `Ogg` / `WebM` / `Mp4` / `Wav` / `Flac` / `Mp3` / `Adts`。
- `AudioCodec`（`export const enum`）：`Unknown` / `Opus` / `Vorbis` / `Aac` / `Mp3` / `Flac` / `Pcm`。
- `AudioInputSource`（联合类型）：`ArrayBuffer | Uint8Array | Blob | ReadableStream<Uint8Array> | string`。
- `IAudioFormatInfo`：`container`、`codec`、`sampleRate`、`channels`、`duration: number | null`，全部 `readonly`。
- `IAudioDecodedChunk`：`channelData: Float32Array<ArrayBuffer>[]`、`samplesDecoded`、`sampleRate`、`timestamp`、`duration`、`errors: IAudioDecodeError[]`，全部 `readonly`。
- `IAudioDecodeSession`：`info`、`chunks: AsyncIterable<IAudioDecodedChunk>`、`seek?(time)`、`close()`。
- `IAudioDecodeProvider`：`probeAudio(source)`、`createDecodeSession(source)`。
- `IAudioCodecDecoder`：`configure(info, description?)`、`decode(packet, timestamp, duration)`、`flush()`、`destroy()`。
- `AudioCodecDecoderCreateFunc`（函数类型别名）：`(context: IMotaAudioContext) => IAudioCodecDecoder`。
- `IAudioDecoderRegistry`：`registerCodecDecoder(codec, decoder)`、`createCodecDecoder(codec)`。

`IMotaAudioContext` 不新增任何成员，上述接口作为独立声明存在。

### B. 新增 / 变更的 Hook 类型

- 新增 `IAudioSourceHooks extends IHookBase`：`onPlay?()`、`onEnd?()`、`onLoad?()`（全部可选）。
- 新增 `IAudioRouteHooks extends IHookBase`：`onUpdateEffect?()`、`onPlay?()`、`onStop?()`、`onPause?()`、`onResume?()`、`onStart?(route)`、`onEnd?(time, route)`（全部可选）。
- `IAudioSource` 改为 `extends IAudioOutput, IHookable<IAudioSourceHooks>`。
- `IAudioRoute` 改为 `extends IAudioOutput, IHookable<IAudioRouteHooks>`。
- **删除** `EAudioSourceEvent`、`EAudioRouteEvent`；`bgm.ts` **删除** `BGMInfo.startFn` / `BGMInfo.endFn`。

### C. 新增受保护方法（全包恰 4 处）

- `source.ts` 3 处：`protected createController(hook: Partial<IAudioSourceHooks>): IHookController<IAudioSourceHooks>`，返回 `new HookController(this, hook)`。
- `route.ts` 1 处：`protected createController(hook: Partial<IAudioRouteHooks>): IHookController<IAudioRouteHooks>`，返回 `new HookController(this, hook)`。

### D. 新增 / 变更的私有命名（`bgm.ts`）

- `BGMInfo.controller`：`readonly controller: IHookController<IAudioRouteHooks>`。
- 局部变量 `controller` 共 4 处：`setTransition` 1 处、`play` 三个互斥分支各 1 处，用于 `controller.unload()` 自卸载。

其余既有公开名称与签名一律不变。

## Hook 映射（源 3 项 + 路由 7 项）

| 类 | 旧事件 | 新钩子 | 参数 |
|----|--------|--------|------|
| 音频源（3 类） | `play` | `onPlay` | 无 |
| 音频源（3 类） | `end` | `onEnd` | 无 |
| 音频源（3 类） | `load` | `onLoad` | 无 |
| `AudioRoute` | `updateEffect` | `onUpdateEffect` | 无 |
| `AudioRoute` | `play` | `onPlay` | 无 |
| `AudioRoute` | `stop` | `onStop` | 无 |
| `AudioRoute` | `pause` | `onPause` | 无 |
| `AudioRoute` | `resume` | `onResume` | 无 |
| `AudioRoute` | `start` | `onStart` | `route: IAudioRoute`（传 `this`） |
| `AudioRoute` | `end` | `onEnd` | `time: number`（`this.endTime`）、`route: IAudioRoute`（`this`） |

22 处 `emit` 全部改为 `forEachHook(hook => hook.onXxx?.(...))`。`Hookable.forEachHook` 是**同步遍历**，触发顺序与旧 `emit` 一致，事件语义不变。

## 实现类迁移

- `AudioStreamSource` / `AudioElementSource` / `AudioBufferSource` 改为 `extends Hookable<IAudioSourceHooks>`（3 处）。
- `AudioRoute` 改为 `extends Hookable<IAudioRouteHooks>`（1 处）。
- 四个类各实现 `createController`，统一 `new HookController(this, hook)` 落地抽象方法。

## 调用方迁移

- `AudioRoute` 构造器：两条 `source.on('end')` / `source.on('play')` 合并为一次 `source.addHook({ onEnd, onPlay })`；**不保存控制器**，与旧实现一致（旧实现也从未移除监听）。`Playing` / `Stoped` 状态同步分支逐字不变。
- `BGMPlayer.setTransition`：`startFn` / `endFn` 两个局部函数删除，逻辑原地内联为一次 `route.addHook({ onStart, onEnd })`，控制器存入 `BGMInfo.controller`；淡入淡出参数逐字不变。
- `BGMPlayer.removeBgm`：`route.off('start', ...)` / `route.off('end', ...)` 改为 `route.removeHookByController(gain.controller)`。
- `BGMPlayer.play` 三个分支：`source.once('load', fn)` 改为 `source.addHook({ onLoad })`，回调首行 `controller.unload()` 自卸载，等效旧 `once` 语义（不会重复计算缓存尺寸）。

## 未改项

- **12 个只读路径**：`packages/audio/src/decoder.ts`、`context.ts`、`effect.ts`、`sound.ts`、`support.ts`、`index.ts`、`packages/audio/package.json`、根 `package.json`、`pnpm-lock.yaml`、`packages-user/client-base/src/components/thumbnail.tsx`、`packages-user/client-base/src/map/renderer.ts`、`packages/render/src/core/types.ts`。其中 11 个哈希与基线一致，`thumbnail.tsx` 见「偏差」。
- `IMotaAudioContext`、`AudioType`、`IAudioDecoder`、`IAudioDecodeData` 与全部既有 jsDoc / 代码注释逐字未改（`git diff` 的 4 个 `types.ts` hunk 均在 import 段、两个事件声明段与文件末尾新增段）。
- `decoder.ts` 一字未改；未引入 `mediabunny`，未实现解码器，未改 `opus-decoder` / `ogg-opus-decoder` / `ogg-vorbis` 的既有用法。
- `AudioStreamSource` 的 `pump` / `decodeData` / `decodeFlushData` / `appendDecodedData` / `mergeBuffers` 流式逻辑原样保留。
- 未改构建配置、`package.json`、锁文件；未新增依赖、未加测试、未跑游戏 / 浏览器 / dev server / `pnpm install`。

## 门禁真实输出

| 门禁 | 结果 | 关键数字 |
|------|------|----------|
| `prettier --check`（4 文件） | PASS | `All matched files use Prettier code style!`。`--write` 只归一新增行（`configure(...)` 收成一行），未重排规格之外的既有行 |
| `eslint`（4 文件） | PASS | 退出码 0，0 error 0 warning |
| 结构闸门 | PASS | types 的 14 个 token 全在；forbidden token（`eventemitter3` / `EventEmitter` / `EAudioSourceEvent` / `EAudioRouteEvent` / `.emit(` / `.once(` / `.off(` / `.on(`）全零；4 处 `new HookController(this, hook)`、4 处 `protected createController(`；`extends Hookable<IAudioSourceHooks>` 3 处、`<IAudioRouteHooks>` 1 处；`addHook(` 合计 5 处（`bgm.ts` 4 处）、`bgm.ts` `removeHookByController(` 1 处、`bgm.ts` `forEachHook(` 0 处；`source.ts` + `route.ts` 的 `forEachHook(` 合计 22 处。首轮曾报 `hookController=3`，补上 `AudioElementSource` 的 `createController` 后通过 |
| 基线新鲜度闸门 | PASS | HEAD `b571269036b4130c00936495b8450eb933104db5`；12 条哈希；状态基线 14 条；类型检查基线早于 `types.ts` 改动 |
| `vue-tsc --noEmit` 零新增闸门 | PASS | 基线 279 条 error 头行 / 改动后 279 条，新增 0 条；**`packages/audio/` 下 0 条 error** |
| 12 路径哈希闸门 | **FAIL（外部原因）** | 路径集合恰为 12 条；11 条与基线一致；`thumbnail.tsx` 由 `d3451b4c...` 变为 `380d66ca...` |
| `git diff --check` | PASS | 本计划 4 个文件 0 命中，其他位置 0 条，退出码 0 |
| CRLF / 无 tab / 无 BOM | PASS | 4 个源文件纯 CRLF，tab 0，BOM 无；SUMMARY 同样纯 CRLF、无 tab、无 BOM |
| 状态基线收敛闸门 | PASS | 当前状态 = 基线（14 条）+ 4 个音频源文件；基线路径一个不少、状态行逐字不变、无额外新条目 |
| `HEAD` 未变（Task 1 末尾） | PASS | `b5712690...` 未变 |
| 写后状态闸门（Task 2） | 见末尾 | 基线（14 条）+ 5 个新增路径（4 个音频源文件 + SUMMARY） |
| `HEAD` 未变（Task 2 最后一个闸门） | PASS | `b5712690...` 未变，工作树仍为脏，产物留给验收 |

**唯一 FAIL 的根因是外部并发改动，不是本计划造成的：** `packages-user/client-base/src/components/thumbnail.tsx` 在基线采集（16:18:23）之后被用户并发修改两次（mtime 16:24:27 → `9fe71694...`，16:29:47 → `380d66ca...`）。该文件是只读哈希清单第 10 项，因此哈希闸门如实报 FAIL。它在 16:24 的中间版本曾引入一条 `TS2769`，到 16:29 的版本已自行消失，所以最终的 `vue-tsc` 零新增闸门是 PASS（279 对 279，新增 0 条）。本计划对该文件**零写入**、未回退、未暂存；基线里的状态行（` M`）前后未变。按规则既不回退用户 WIP，也不改写基线。

## 未提交声明

本次 **0 提交**。`.planning/config.json` 的 `workflow.commit_docs: true` 与 `mode: yolo` 会触发文档提交，本计划**显式跳过**该步骤（执行器不提交、不委托提交、不回退）；未执行任何 `git add` / `git commit` / `git tag` / `git push` / `git stash` / `git checkout`。产物是**未提交**的工作树 + **未提交**的 SUMMARY，留待用户验收。

## 偏差

1. **（工具传输）闸门以脚本文件执行。** 计划里的闸门写的是内联 `node -e "..."`，但本机 PowerShell 5.1 会把内联载荷里的双引号剥掉（实测 `node -e 'console.log("x")'` 直接报 `ReferenceError`），导致内联命令无法运行。改用固定临时目录 `C:/Users/13194/AppData/Local/Temp/opencode` 下的脚本文件执行**逻辑逐字等价的**同一批断言（同样的 token 集合、计数、12 条路径、正则），未改动任何阈值或允许清单。临时目录不是仓库产物，不出现在 `git status`。
2. **（外部）`thumbnail.tsx` 在基线之后被并发改动**，导致「12 路径哈希」门禁失败。证据：基线采集 16:18:23，文件 mtime 16:24:27 与 16:29:47 各变一次；基线与当前哈希分别为 `d3451b4c...` / `380d66ca...`；本计划对该文件零写入，其状态行始终是 ` M`。中间版本曾引入一条 `TS2769`，最终版本的 `vue-tsc` 零新增闸门为 PASS。不越界修复，交由用户裁决。
3. **（格式化）`prettier --write` 归一了新增行。** `IAudioCodecDecoder.configure` 被收成单行、`IAudioSource extends ...` 保持换行；只影响新增行，未改动既有行。
4. 计划里的行数 / 类型检查快照与现场不一致（用户 WIP 变动）：现场状态基线 14 条（计划快照 8 条）、类型检查基线 279 条（计划快照 278 条）。所有闸门一律使用现场采集的基线，未依赖计划里的快照数字。

## 未校准估算

`estimate: confidence: low`，`tokens: 26000`，`tasks: 3`（3 个任务 / 26k，advisory，不作拆分或阻断依据）。实测 `actuals.tokens` 为 3300（`git diff` 增删字符数 / 4），`tasks: 3`，`commits: 0`。

## 留待验收

工作树与 SUMMARY 均**未提交**，请用户自行验收。唯一失败的门禁是 `thumbnail.tsx` 的只读哈希（用户正在并发编辑该文件，16:24 与 16:29 各变一次）：请在自己的改动落定后自行确认它与本次音频改动无关，或重跑该闸门。
