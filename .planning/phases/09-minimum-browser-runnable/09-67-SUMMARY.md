---
phase: 09-minimum-browser-runnable
plan: 67
status: complete
gap_closure: true
requires: [09-66]
provides:
  - "AudioStreamDecoder 使用 Promise.withResolvers 创建等待 Promise，并删除未使用的 opusTask 字段"
  - "pcmScheduler 以 nodeHandlers 映射与 addEventListener / removeEventListener 取代 onended 赋值"
  - "source / opusSession / vorbisSession 去除 5 处纯副作用语句前缀的 void"
affects:
  - packages/audio
tech-stack:
  added: []
  patterns:
    - "Promise.withResolvers 创建单次唤醒的 resolve"
    - "WeakMap 保存节点到结束监听器的映射，保证摘除时函数引用一致"
key-decisions:
  - "nodeHandlers 用 WeakMap 而非 Map，节点结束后条目可被回收"
  - "测试伪造节点实现 addEventListener / removeEventListener / dispatchEvent 与 handlers 快照，按事件派发触发结束"
  - "不改构建脚本，Promise.withResolvers 的 Safari 15 兼容性由遗留构建 polyfill 静态核验证明，真实加载交用户 UAT"
key-files:
  created: []
  modified:
    - packages/audio/src/streamDecoder.ts
    - packages/audio/src/pcmScheduler.ts
    - packages/audio/src/source.ts
    - packages/audio/src/opusSession.ts
    - packages/audio/src/vorbisSession.ts
    - packages/audio/src/__test__/pcmScheduler.test.ts
coverage:
  test-files: 6
  tests: 24
  scheduler-tests: 6
actuals:
  tokens: 1200
  tasks: 3
  commits: 0
  plan_head_before: afb1ff30aa266cb5326bc0451237e9ee89ec454f
  measurement: "按本计划实际改动行数估算（约 4800 字符 / 4）；3 个目标文件为 09-66 的未跟踪文件，git diff 不含其完整内容，故不以整文件计"
duration: "约 6 分钟（2026-11-27 15:16 至 15:22）"
---

# Phase 9 Plan 67: 四项风格修复 Summary

将 09-66 交付的流式音频内核中四处已确认的风格问题修掉：`generateChunks` 改用 `Promise.withResolvers`、去除 10 处纯副作用语句前缀的 `void`、删除未使用的 `opusTask` 字段、把调度器的 `onended` 赋值改成 `addEventListener` / `removeEventListener` 并用 `nodeHandlers` 映射保管监听器引用；测试伪造节点同步按 `ended` 事件派发。功能、公开面、日志码与依赖均不变。

## 要解决的问题

1. `streamDecoder.ts` 的 `generateChunks` 用 `await new Promise<void>(resolve => { this.waiter = resolve; })` 只为拿到一个 resolve，意图不直白。
2. 10 处对 `free()` / `destroy()` / `finishLoad()` / `openOpus().catch()` 的调用被 `void` 包成表达式语句，属于多余包装。
3. `opusTask` 只有声明与一次赋值，零读取，是死字段。
4. 调度器用 `node.onended = handler` / `= null` 注册与摘除结束回调，不是标准的 EventTarget 注册方式。

## 四项修复逐条落点

### 修复 1：`Promise.withResolvers`

`packages/audio/src/streamDecoder.ts` 的 `generateChunks` 等待分支（改后约 552 行）：

改前：

```ts
await new Promise<void>(resolve => {
    this.waiter = resolve;
});
```

改后：

```ts
const { promise, resolve } = Promise.withResolvers<void>();
this.waiter = resolve;
await promise;
```

`waiter` 字段声明与 `wake()` 均逐字未动；未接收未使用的 `reject`。

### 修复 2：去除纯副作用语句前缀的 `void`（10 处）

| # | 文件 | 改前 | 改后 |
|---|------|------|------|
| 1 | `streamDecoder.ts`（`close`） | `void this.vorbis?.free();` | `this.vorbis?.free();` |
| 2 | `streamDecoder.ts`（`decideFormat`） | `void this.openOpus(guess).catch(...)` | `this.openOpus(guess).catch(...)` |
| 3 | `streamDecoder.ts`（`runVorbisChunk` 的 catch） | `void vorbis.free();` | `vorbis.free();` |
| 4 | `streamDecoder.ts`（`runVorbisChunk` 收尾） | `void vorbis.free();` | `vorbis.free();` |
| 5 | `streamDecoder.ts`（`fail`） | `void this.vorbis?.free();` | `this.vorbis?.free();` |
| 6 | `source.ts`（`end`） | `void this.finishLoad();` | `this.finishLoad();` |
| 7 | `opusSession.ts`（`close`） | `void this.decoder.destroy();` | `this.decoder.destroy();` |
| 8 | `vorbisSession.ts`（`close`） | `void this.decoder.free();` | `this.decoder.free();` |
| 9 | `vorbisSession.ts`（创建失败的 catch） | `void decoder.free();` | `decoder.free();` |
| 10 | `vorbisSession.ts`（零采样分支） | `void decoder.free();` | `decoder.free();` |

全部 `(): void` / `void {}` / `Promise<void>` / `void | Promise<void>` 返回类型保留，未新增 `await`，未改调用顺序。

### 修复 3：删除未使用的 `opusTask`

`streamDecoder.ts` 删除了成员注释与 `private opusTask: Promise<void> | null = null;` 声明；`openOpus` 末尾由赋值改为直接调用：

```ts
this.consumeOpus(track).catch(() => {
    if (!this.ended && !this.failed) this.fail(25);
});
```

`consumeOpus` 的签名、循环体与 `.catch` 守卫未动，未新增替代字段。

### 修复 4：`onended` 改 EventTarget 监听

`pcmScheduler.ts`：

- 字段区新增唯一新增标识符 `private readonly nodeHandlers: WeakMap<AudioBufferSourceNode, () => void> = new WeakMap();`（prettier 将其格式化为两行，约 118-119 行），带一行成员注释。
- `schedule()` 在 `node.connect(...)` 之后、`node.start(...)` 之前注册：

```ts
const handler = () => this.handleNodeEnd(node);
this.nodeHandlers.set(node, handler);
node.addEventListener('ended', handler);
```

- `handleNodeEnd` 在 `this.nodes.delete(node);` 之后摘除并从映射删除，再执行原有的 `!playing` / `nodes.size` / `scheduledSamples` 判定。
- `stop()` 与 `restartLoop()` 的节点循环都改为先 `get` / `removeEventListener` / `delete`，再 `node.stop()`；`restartLoop()` 的锚点重置与 `schedule()` 未动。
- 文件内已无对 `onended` 的赋值。

### 测试改造

`packages/audio/src/__test__/pcmScheduler.test.ts`：

- `FakeNode` 去掉 `onended` 字段，新增 `listeners: Map<string, (() => void)[]>`、`addEventListener`、`removeEventListener`、`dispatchEvent`（遍历监听器浅拷贝，允许回调内摘除自身）与 `handlers(type)` 快照。
- 新增 `fireEnded(node)` 与 `endedHandlers(node)` 两个 helper。
- 6 个 `it` 全部保留：自然结束改为 `fireEnded`；原「stop 后 onended 不生效」改名为「stop 后 ended 监听器不生效」，在 `stop()` 前用 `endedHandlers(last)` 保存处理器快照，`stop()` 后逐个调用，继续断言节点数不变、结束回调为 0、`playing === false`，非循环情形同样处理。

## polyfill 静态核验

只读检查，未运行任何构建：

| 检查项 | 实际结果 |
|--------|----------|
| `@vitejs/plugin-legacy` 解析到的 core-js 版本 | 3.48.0 |
| `core-js/modules/es.promise.with-resolvers.js` | 存在 |
| `core-js-compat/data.json` 的 `es.promise.with-resolvers` | `safari` 17.4、`ios` 17.4 |
| `script/build-game.ts` | 含 `Safari >= 15`、`polyfills: true` |
| `@vitejs/plugin-legacy/dist/index.js` | 含 `babel-plugin-polyfill-corejs3` 与 `detectPolyfills` |

结论：遗留构建会按 usage 注入该 polyfill，未改 `script/build-game.ts`。Safari 15 的真实加载由用户 UAT 覆盖，本计划未做真实浏览器验证。

## 测试真实输出

- `pcmScheduler.test.ts`：1 个文件，6 个 `it` 通过（3ms）。
- 整包 `packages/audio/src/__test__`：6 个测试文件、24 个 `it` 全部通过（1.57s）。
- 日志中的 `[WARNING Code 217]` / `[ERROR Code 25]` 是既有用例对不支持输入与坏文件头的预期告警，不是失败。

## 闸门真实输出

| 闸门 | 实际输出 |
|------|----------|
| 结构修复 1-3 | `FIX123 OK` |
| 结构修复 4 | `FIX4 OK` |
| 注释（U+2026 等） | `COMMENT OK` |
| 测试 | 6 files / 24 tests passed |
| 类型 | `TSC OK 279 279`（`packages/audio` 0 error，总数等于现场基线 279） |
| eslint | `ESLINT OK`（`--max-warnings 0`，0 error 0 warning） |
| prettier | 6 个文件 `--check` 通过（`pcmScheduler.ts` 经 `--write` 后复检通过） |
| 范围 | `SCOPE OK`（基线 15 条，收尾 17 条；新增仅 `opusSession.ts`、`vorbisSession.ts` 两条允许路径） |
| HEAD | `HEAD OK afb1ff3`（未移动） |
| polyfill | `POLYFILL OK 3.48.0 17.4 17.4` |

## 未改项

- `streamDecoder.test.ts`、`types.ts`、`bgm.ts`、`context.ts`、`decoder.ts`、`decoderRegistry.ts`、`effect.ts`、`sound.ts`、`support.ts`、`route.ts`、`index.ts`、`probe.ts`、`packages/common/src/logger.*`、`packages/audio/package.json` 未改。
- `script/build-game.ts`、`vite.config.ts`、`tsconfig.json`、`package.json`、`pnpm-lock.yaml` 未改，未安装依赖，未执行构建。
- 未实现 BGM 选择与接入、`manualChunks` / 懒加载、旧依赖清理、`decoder.ts` 删除、`seek`（属 09-68）。
- 未新增 `throw`、`static` 成员、公开 API 或公开字段；`nodeHandlers` 是唯一新增标识符。

## 偏差

1. **prettier 重排新增字段**：`nodeHandlers` 字段按 prettier（`printWidth: 80`）格式化为两行（声明行 + `new WeakMap()` 行），与计划示例的三行写法不同，语义一致；计划已授权以 `prettier --check` 结果为准。
2. **`source.ts` / `types.ts` / `src/client/ui/bookDetail.tsx` 的既有未提交改动**：属 09-66 产物与外部并发改动，现场采集为基线，只记录未回退。`source.ts` 的本计划改动仅 `end()` 内一处 `void` 去除。
3. **Task 0 由执行编排方完成**：编排方向用户逐条汇报四项修复、`nodeHandlers` 命名、polyfill 核验、范围、0 提交与时间规则后，用户于 2026-11-27 恰好回复「可以执行」，本执行器据此直接进入 Task 1，未重复提问。

## 未校准估算

计划估算 `tokens: 14000`、`tasks: 3`、`confidence: low`，为 advisory 建议值，不是校准后的预测；实际改动量远小于估算（见 frontmatter `actuals`）。

## 0 提交声明

本执行器**未执行任何 git 写命令**（无 `add` / `commit` / `tag` / `push` / `stash` / `checkout` / `worktree` / `restore`），`commits: 0`。计划显式覆盖 `.planning/config.json` 的 `workflow.use_worktrees: true`（不创建 worktree，直接在当前工作树执行）与 `commit_docs: true`（SUMMARY 只落盘、不提交）。HEAD 保持现场基线 `afb1ff3`，未移动；全部改动留在当前工作树等用户验收。

## Self-Check: PASSED

- 6 个代码/测试文件均存在且已按四项修复改动。
- 无提交，HEAD 未移动，范围闸门确认无越界路径。
