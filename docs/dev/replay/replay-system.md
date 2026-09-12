# 需求综述

需要一个能录制并回放游戏过程的系统，通过录像唯一还原一段游戏流程。

# 需求理解

## 明确需求

1. 游戏过程可回放。能通过录像唯一地还原出游戏从起点到终点的一段完整流程。
2. 录像步可自定义。录像步的类型不限于系统内置——移动、使用道具等——也允许作者自定义。

## 隐含需求

1. 异步播放。由于播放每个录像步都伴随渲染动画，动画未结束前不能执行下一步——播放必须是异步的。
2. 渲染端被动通知。架构约束下渲染端不能主动拉取数据——需要钩子将每步信息推送给渲染端。
3. 录像需跨会话持久化。录像可能录制于这次游戏，在下次游戏中被播放——需要存档。

## 未确定需求

无。

# 设计前提

1. 确定性执行。计入录像的操作在相同输入下产生相同输出。
2. 单向依赖。录像系统位于 `@user/data-common`，不依赖 Layer 1/2。渲染端被动接收信息。
3. 外部主动录制。系统不自动录制——作者在逻辑系统中手动调用录像步写入接口。
4. 底层存储独立。录像的二进制存储由 `IReplayArray` 统一管理（详见 `replay-array.md`），本系统不直接操作 `ArrayBuffer`。

# 核心概念定义

## 录像步

一段游戏流程中不可再分的最小操作单元。由一个指令标识和一组数量可变的参数构成：指令标识区分操作类型，参数描述操作的细节。

## 录像

一组按时间顺序排列的录像步的序列。完整记录从某初始状态到某最终状态的全部操作，是还原一段游戏流程的充要条件。

## 录像录制

将玩家操作转化为录像步并通过 `IReplayArray.add` 追加到末尾的过程。由作者在各逻辑系统（商店、移动等）中主动调用写入接口完成。

## 录像播放

从 `IReplayArray` 中通过流式读取器依次取出录像步并驱动数据端状态变化的过程。由于播放时需要从初始状态逐步重建到目标状态——这是整个系统中唯一需要批量修改全局状态的场景——使用沙箱隔离播放过程。

# 接口设计分析

## `IReplaySystem`

### 设计思路

由于要还原游戏流程，需要记录玩家操作。不同操作对应不同录像步类型——因此需要 `registerCommand` 注册命令，使每种命令 ID 映射到对应的执行对象。

注册了命令类型后，运行时需要向 `IReplayArray` 中追加新步——因此需要 `record` 方法，接收命令 ID 和可变长度的参数，内部委托给 `IReplayArray.add`。

由于需要回放录像，且回放时原始录像系统仍需录制新步（做交叉验证），播放需要有独立的执行环境。此外播放前需要重置全局状态，但重置逻辑属于数据端不应被 Layer 0 直接依赖——因此需要 `createReplaySandbox` 创建沙箱，通过 `IStateReseter` 接口间接访问重置能力。播放结束需要销毁沙箱——因此需要 `releaseSandbox`。

由于播放期间渲染端和数据端需要切换行为，需要一个成员标记当前是否有活跃沙箱——因此需要 `replaying`。外部可能需要获取当前沙箱实例——因此需要 `sandbox` 成员。

### 接口分析

- 成员 `replaying: boolean`：预期频率**高频**。
- 成员 `sandbox: IReplaySandbox | null`：预期频率**中频**。
- 方法 `registerCommand(id: number, command: IReplayCommand)`：预期频率**低频**。
- 方法 `record(id: number, ...params: ReplayParamValue[])`：预期频率**高频**。
- 方法 `createReplaySandbox(reseter: IStateReseter, save?: Map<string, unknown>): IReplaySandbox`：预期频率**低频**。
- 方法 `releaseSandbox()`：预期频率**低频**。

### 预期体量

预期代码体量 60-80 行。

- 命令注册与管理预期 15 行：`Map<number, IReplayCommand>` 的增删查。
- 沙箱创建与销毁预期 20 行：深拷贝 `IReplayArray`、注入命令注册表和 `IStateReseter`、创建 `ReplaySandbox` 实例。
- 存档实现预期 25 行：`saveState` 从 `IReplayArray` 导出 `ArrayBuffer` 及 `IReplayMetadata`，`loadState` 从存档数据重建 `IReplayArray` 并恢复标记。

## `IReplayCommand`

### 设计思路

由于作者可以自定义录像步类型，播放不同步类型时需要执行不同的操作逻辑。录像系统本身无法知晓这些逻辑，需要作者提供。这些逻辑往往需要持有数据端引用，纯函数回调无法满足——因此需要接口对象 `IReplayCommand`，作者编写实现类通过构造器持有所需引用。沙箱执行时传递当前步信息——因此 `execute` 直接接收 `IReplayStepHandler`。

### 接口分析

- 方法 `execute(step: IReplayStepHandler)`：预期频率**低频**。每个命令编写一个实现类。

### 预期体量

预期代码体量 5 行。

## `IReplaySandbox`

### 设计思路

由于需要回放录像，播放过程中需要流程控制——连续推进、暂停、单步前进、终止。因此需要 `play`、`pause`、`resume`、`step`、`stop` 五个方法。

由于需求隐含要求异步播放和渲染端被动通知——项目已有 `IHookable` 通用钩子系统，沙箱扩展 `IHookable<IReplaySandboxHook>`，每步触发钩子并 `await` 其完成。

由于播放期间原始录像系统仍在录制，沙箱不能引用正在增长的 `IReplayArray`——创建时深拷贝，播放时通过 `IReplayReadStream` 顺序读取每一步，避免每次随机访问的 O(n) 偏移扫描。播放速度需要调节，渲染端据此调整动画时长——因此需要 `speed` 只读成员和 `setSpeed` 方法。

### 接口分析

- 成员 `replaying: boolean`：预期频率**高频**。
- 成员 `pausing: boolean`：预期频率**中频**。
- 成员 `speed: number`：预期频率**中频**。播放倍率，只读。
- 方法 `setSpeed(speed: number)`：预期频率**低频**。
- 方法 `play()`：预期频率**低频**。
- 方法 `pause()`：预期频率**低频**。
- 方法 `resume()`：预期频率**低频**。
- 方法 `stop()`：预期频率**低频**。
- 方法 `step()`：预期频率**中频**。返回 `Promise<void>`。

### 预期体量

预期代码体量 120-160 行。

- 播放循环预期 80 行。在循环中通过 `IReplayReadStream.read()` 逐帧解码，传给 `IReplayCommand.execute`，再触发 `onStep` 钩子并 `await`。连续模式下循环自动推进，单步模式执行一步后挂起等待下个 `step` 调用，暂停冻结循环但不丢失索引，终止跳出循环并清空流式读取器。四种模式的状态切换组合逻辑占主要行数。
- 状态管理预期 30 行。`play`/`pause`/`resume`/`stop`/`step` 之间的互斥与合法性检查——未播放时 `pause` 无效果，已暂停时 `resume` 才恢复，`stop` 后一切操作无效。
- 钩子集成预期 20 行。扩展 `Hookable` 后在循环中调用 `forEachHook`，收集 `onStep` 的 Promise 并全部 `await`。

## `IStateReseter`

### 设计思路

由于沙箱播放前需将全局状态恢复到基准状态——从头播放恢复为初始状态，从存档继续播放恢复为存档状态。重置能力属于数据端，不应被 `@user/data-common` 直接依赖——因此设计 `IStateReseter` 接口隔离此依赖，`reset` 接收可选存档数据覆盖两种场景。

### 接口分析

- 方法 `reset(save?: Map<string, unknown>)`：预期频率**低频**。

### 预期体量

预期代码体量 3 行。

## `IReplaySandboxHook`

### 设计思路

由于架构约束下渲染端被动接收信息，沙箱需要钩子将每步信息推送给渲染端。项目已有 `IHookable`/`IHookBase` 体系——因此沙箱钩子扩展 `IHookBase`，提供 `onStep` 方法接收 `IReplayStepHandler`。沙箱 `await` 其完成后再推进下一步。

### 接口分析

- 方法 `onStep?(step: IReplayStepHandler): Promise<void>`：预期频率**低频**。渲染端注册时定义一次。

### 预期体量

预期代码体量 4 行。

## `IReplayStepHandler`

### 设计思路

由于钩子和命令执行器都需要当前步的完整信息（操作类型、参数、索引），因此设计统一的 handler 风格数据接口 `IReplayStepHandler`，包含 `id`、`params`、`index`。

### 接口分析

- 成员 `id: number`：预期频率**高频**。
- 成员 `params: readonly ReplayParamValue[]`：预期频率**高频**。
- 成员 `index: number`：预期频率**低频**。

### 预期体量

预期代码体量 5 行。

## 类型别名

`ReplayParamValue = number | string | boolean | bigint`

---

# 实现思路

## 沙箱播放与交叉验证

1. 创建沙箱时深拷贝当前 `IReplayArray`。
2. 调用 `reseter.reset(save)` 重置全局状态。
3. 创建 `IReplayReadStream`，循环：`read()` 解码一步 → `IReplayCommand.execute` → 触发 `onStep` → `await`。
4. 原始录像系统清空并重新录制——播放中沙箱执行的命令触发 `record`，若遗漏则安全系统警告。

# 涉及文件

## `@user/data-common/src/replay/types.ts`

- [ ] 新增 `IReplaySystem`、`IReplaySandbox`、`IReplayCommand`、`IStateReseter`、`IReplaySandboxHook`、`IReplayStepHandler` 接口与 `ReplayParamValue` 类型别名

## `@user/data-common/src/replay/replay.ts`

- [ ] 编写 `ReplaySystem` 类：命令注册、沙箱创建、存档实现

## `@user/data-common/src/replay/sandbox.ts`

- [ ] 编写 `ReplaySandbox` 类：扩展 `Hookable` 实现 `IReplaySandbox`

## `@user/data-common/src/replay/array.ts`

- [ ] 详见 `replay-array.md`

## `@user/data-common/src/types.ts`

- [ ] 新增 `IDataCommon` 成员 `replay`

## `@user/data-common/src/index.ts`

- [ ] 新增 `export * from './replay'`

## `@user/data-state/src/core.ts`

- [ ] 新增 `ReplaySystem` 实例化与 `IStateReseter` 实现
- [ ] 新增存档注册
