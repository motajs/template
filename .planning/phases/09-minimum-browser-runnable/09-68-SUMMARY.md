---
phase: 09-minimum-browser-runnable
plan: 68
status: complete
requires: [09-67]
provides:
  - "AudioType.WebM 枚举值"
  - "support.ts 的 webm 扩展名映射、WebM 初始探测、streamTypes 与 isAudioStreamSupport"
  - "bgm.ts 的 useElement 选择矩阵"
  - "bgmSelection.test.ts 的 5 个 Node 可跑用例"
affects:
  - packages/audio/src/types.ts
  - packages/audio/src/support.ts
  - packages/audio/src/bgm.ts
  - packages/audio/src/__test__/bgmSelection.test.ts
tech-stack:
  added: []
  patterns:
    - "原生支持与流式可解码两个正交条件共同决定播放源"
    - "Node 测试用全局 Audio 桩与 vi.resetModules 重建模块级副作用"
key-decisions:
  - "AudioType.WebM 取值沿用既有成员的值即 MIME 字符串写法，取 audio/webm; codecs=opus"
  - "isAudioStreamSupport 放在 support.ts 并导出，经 barrel 成为包级 API"
  - "选择条件固定为 useElement = isAudioSupport(type) || !isAudioStreamSupport(type)"
  - "MP3 / WAV / FLAC / AAC 无论原生是否支持都走 audio 元素，不再落进流式分支"
key-files:
  created:
    - packages/audio/src/__test__/bgmSelection.test.ts
  modified:
    - packages/audio/src/types.ts
    - packages/audio/src/support.ts
    - packages/audio/src/bgm.ts
coverage:
  tests: "7 个测试文件、29 个 it 全绿（原有 24 + 新增 5）"
  type: "vue-tsc --noEmit 全仓 279 error 与现场基线一致，packages/audio 0 error"
actuals:
  tokens: 0
  tasks: 2
  commits: 0
  note: "0 提交为计划硬性要求，未执行任何 git 写命令，故 tokens 与 commits 不按提交测量"
duration: "约 5 分钟"
---

# Phase 9 Plan 68: BGM 接入流式内核并补上 WebM 类型 Summary

一句话：让 `.webm` 的 BGM 能被识别为 `AudioType.WebM`，并把 BGM 的播放源选择改成「原生支持 或 不可流式」走 `<audio>`，只有「原生不支持且可流式」才走 `AudioStreamSource` + `StreamLoader`。

## 要解决的问题

1. `.webm` 的 BGM 直接被拒：`support.ts` 的 `typeMap` 原本只有 `ogg` / `mp3` / `wav` / `flac` / `opus` / `aac` 六项，`AudioType` 也没有 WebM 成员，`guessTypeByExt('xxx.webm')` 返回空串，`bgm.ts` 走 `logger.warn(50)` 后直接返回。
2. BGM 仍按旧假设选源：09-66 更换流式内核后，`AudioStreamDecoder` 只认 Ogg Opus、Ogg Vorbis 与 WebM Opus；旧的「原生不支持就走流式源」会把 MP3 / WAV / FLAC / AAC 送进必然失败的流式分支。
3. 选择依据缺一条：格式可解码性（新增的 `isAudioStreamSupport`）与浏览器原生支持（既有 `isAudioSupport`）是两个正交条件，只有合起来才是正确的选择依据。
4. 没有 Node 侧防线：扩展名映射与选择矩阵原本无自动化覆盖，且 `support.ts` 在模块作用域 `new Audio()`，Node 下直接 import 会抛错。

## 类型与选择矩阵

### 类型改动（`packages/audio/src/types.ts`）

`AudioType` 末尾追加 `WebM = 'audio/webm; codecs="opus"'`，既有 7 个成员的值与顺序不动。

### 选择矩阵（最终行为）

| 扩展名 | `AudioType` | 浏览器原生支持（预期，待 UAT 确认） | 可流式 | 选择 |
|--------|-------------|----------------|--------|------|
| `.ogg` | `Ogg`（vorbis） | 是 | 是 | `<audio>` 元素 |
| `.ogg` | `Ogg`（vorbis） | 否 | 是 | `AudioStreamSource` + `StreamLoader` |
| `.opus` | `Opus`（ogg opus） | 是 | 是 | `<audio>` 元素 |
| `.opus` | `Opus`（ogg opus） | 否 | 是 | `AudioStreamSource` + `StreamLoader` |
| `.webm` | `WebM`（webm opus） | 是 | 是 | `<audio>` 元素 |
| `.webm` | `WebM`（webm opus） | 否 | 是 | `AudioStreamSource` + `StreamLoader` |
| `.mp3` | `Mp3` | 是 | 否 | `<audio>` 元素 |
| `.wav` | `Wav` | 是 | 否 | `<audio>` 元素 |
| `.flac` | `Flac` | 是 | 否 | `<audio>` 元素 |
| `.aac` | `Aac` | 是 | 否 | `<audio>` 元素 |
| 其它 | 空串 | 不适用 | 不适用 | `logger.warn(50, ...)` 后返回 |

判定式：`const useElement = isAudioSupport(type) || !isAudioStreamSupport(type);`。

「浏览器原生支持」一列是设计前提与 UAT 待确认项，不是已测得的结论；实际结果只影响某环境走哪条分支的观感，`useElement` 的判定逻辑不变。

## 命名清单与新增注释

| 名称 | 位置 | 说明 |
|------|------|------|
| `WebM` | `types.ts` 的 `AudioType` | 公开枚举成员，值 `'audio/webm; codecs="opus"'` |
| `['webm', AudioType.WebM]` | `support.ts` 的 `typeMap` | 模块私有映射条目 |
| `streamTypes` | `support.ts` | 模块私有 `Set<AudioType>`，只含 `Ogg` / `Opus` / `WebM` |
| `isAudioStreamSupport` | `support.ts` | 导出函数，经 barrel 成为包级 API |
| `useElement` | `bgm.ts` 的 `addBGMFromURL` | 唯一分支条件 |
| `FakeAudio` / `installAudioStub` / `createFakeContext` | 测试文件 | 测试 helper，`FakeAudio` 的 `static table` 属测试豁免 |

新增注释只落在：`streamTypes` 上方一行、`isAudioStreamSupport` 的 jsDoc、`useElement` 上方一行、测试文件首行 / 每个 `it` 前一行 / 三个 helper 各一行。既有 jsDoc 与代码注释未改。

## 测试真实输出

新增 `packages/audio/src/__test__/bgmSelection.test.ts`，5 个 `it`，全部包在 `describe('BGM 选择', ...)` 内，每个 `it` 前一行中文说明注释；用可配置 `FakeAudio` 全局桩 + `vi.resetModules()` + 动态 `import()`，Node 下无真实 `AudioContext`。

单文件运行：

```
✓ packages/audio/src/__test__/bgmSelection.test.ts (5 tests) 627ms
Test Files  1 passed (1)
     Tests  5 passed (5)
```

整包运行：

```
✓ pcmScheduler.test.ts (6)
✓ decoderRegistry.test.ts (2)
✓ probeAudioFormats.test.ts (1)
✓ vorbisDecodeSession.test.ts (3)
✓ bgmSelection.test.ts (5)
✓ opusDecodeSession.test.ts (8)
✓ streamDecoder.test.ts (4)
Test Files  7 passed (7)
     Tests  29 passed (29)
```

5 个用例覆盖：`.webm` 映射（含大写 `X.WEBM`）、既有 6 个扩展名不回归与未知扩展名返回空串、`isAudioStreamSupport` 的 8 项格式矩阵、原生不支持时 Ogg / WebM 走流式源、原生不支持时 MP3 走 `<audio>`、原生支持 WebM 时走 `<audio>`。

## 浏览器 UAT 清单（用户执行，本计划未跑浏览器）

素材：`public/project/bgms/bgm.opus` 与 `public/_server/blockly/media/click.ogg`；仓内无 `.webm` 素材，如需验证 `.webm` 可用 09-66 测试里的转封装方式现场生成到临时目录，仅作 UAT，不入库。

环境分工为**预期、待用户确认**，不是已测得的结论：预期 Safari 15 在原生不支持时走流式源；Safari 17.4+ 与 Chrome 预期走 `<audio>` 元素。

逐项检查：起播、暂停、续播、循环、进度显示，以及控制台无 error 25 / 97。若实测与预期不符，只记录现象，不改 `useElement` 判定。

## 闸门真实输出

| 闸门 | 结果 |
|------|------|
| 结构（类型与支持） | `TYPE OK`：WebM 值精确、`webm` 映射、WebM 初始探测、`streamTypes` 恰好 3 项（Ogg → Opus → WebM）、无 Mp3 / Wav / Flac / Aac / Unknown |
| 结构（选择） | `SELECT OK`：`const useElement`、`isAudioStreamSupport(type)`、`logger.warn(50`、两工厂、`new StreamLoader(url)`，旧分支已消失 |
| 结构（测试） | `TESTFILE OK 5`：5 个 `it`，说明注释不少于 5，含 `resetModules` / `globalThis` / `canPlayType` / `createFakeContext` |
| 注释 / CRLF | `COMMENT OK`：4 个路径无 U+2026 等非汉语、非 ASCII 符号，均为纯 CRLF、无裸 LF |
| 新测试 | 5 passed |
| 整包测试 | 7 文件 29 `it` passed |
| 类型 | `TSC OK 279 279`：`packages/audio` 0 error，全仓 279 与现场基线一致 |
| eslint | 0 error 0 warning（`--max-warnings 0`） |
| prettier | `All matched files use Prettier code style!` |
| 禁区 | `FORBIDDEN OK`：19 个禁区路径与基线逐字一致 |
| 范围 | `SCOPE OK`：工作树路径集合 = 现场基线 ∪ 5 个 `files_modified` |
| HEAD | `HEAD OK a6a4f26317d751a5c867395a833c4c1417f48fac`：未移动 |

## 未改项

`source.ts`、`streamDecoder.ts`、`pcmScheduler.ts`、`decoder.ts`、`context.ts`、`route.ts`、`sound.ts`、`effect.ts`、`index.ts`、`probe.ts`、`opusSession.ts`、`vorbisSession.ts`、`decoderRegistry.ts`、`packages/audio/package.json`、根 `package.json`、`pnpm-lock.yaml`、`script/build-game.ts`、`vite.config.ts`、`vitest.perf.config.ts`、`packages/common/**` 全部零改动；`StreamLoader.start()` 的 `start` 后 `pump` 顺序、`AudioStreamSource` 的 `pump` / `end(true)` / `finishLoad` / `buffer`、BGM 缓存池 `onLoad` 钩子、循环、渐变均未触碰。零新增依赖、零新增日志码、生产源码零新增 `static`、零新增 `throw` / `try` / `catch`。

## 偏差

无功能偏差，计划按设计执行。仅一处格式化操作：新测试文件由写入工具落成 LF，按计划允许的方式对该文件执行 `prettier --write` 转为 CRLF 并统一风格，随后 `--check` 通过；未涉及既有注释，未改其它文件。

## 未校准估算

计划 `estimate` 为 `tokens: 16000`、`confidence: low`，是 advisory 建议值，不作为拆分或阻断依据；本摘要把 `actuals.tokens` 记为 0 并在 frontmatter 说明原因（0 提交、未按提交测量）。

## 未提交声明

本计划全程未执行任何 git 写命令（`git add` / `commit` / `tag` / `push` / `stash` / `checkout` / `worktree` / `restore`），**0 提交**；覆盖配置中的 `workflow.use_worktrees: true` 为「不使用 worktree」，在当前工作树 `D:\github\template` 执行，覆盖 `commit_docs: true` 为不提交文档。`09-68-SUMMARY.md` 落盘后工作树即为验收对象，HEAD 仍为现场基线 `a6a4f26`。

外部改动只记录、未回退：执行前工作树已有 5 个已修改文件（`docs/` 下 4 个、`src/client/ui/bookDetail.tsx`）与 18 个未跟踪的 docs / `10-docs-restructure` 文件，均与本计划无关，未触碰。

## 时间关卡

账户 `13194`。Task 1 前 18:58、Task 1 末 19:02、Task 2 前 19:02，均早于 22:00，未触发停止条件。
