# 自定义录像指令

高级 I 的[录像一致性](../replay-consistency.md)讲的是「已有行为该不该记」，回答方式是给方法加 `@shouldReplay`。还有一种情况它覆盖不到：行为本身不在引擎里，录像里没有对应的指令码，回放时根本无从执行。这时需要新增一条录像指令。

本篇讲一条自定义指令从指令码、指令对象、注册、记录到沙盒回放的完整路径。新增指令码会修改 `packages-user` 下的引擎内容，升级时要预期合并成本；如果只是给已有行为补标记，回到[录像一致性](../replay-consistency.md)即可，不必新增指令。

## 什么时候需要自定义指令

判断标准回到那条核心原则：玩家直接产生、会影响最终成绩的行为必须可复现。

- 行为已经由引擎内置指令覆盖（移动、瞬移、使用道具、装备、卸下），只缺记录，补 `@shouldReplay` 与 `record`。
- 行为是玩家操作，但引擎没有对应指令（技能、商店交易、自定义交互），需要一条新指令，让回放时能把这一步重新执行。

中级教程的[录像指令](../../intermediate/replay-commands.md)已经讲过主动与被动、`IReplayCommand` 的主体结构；本篇不重复这些，直接进入「怎么把一条新指令接进引擎」。

## 指令码是格式的一部分

`ReplayCode` 是 `packages-user/data-common/src/replay/types.ts` 里的 `const enum`。它的数值会写进录像的命令数组，属于录像格式的一部分，因此遵循只增不改：新语义必须分配新值，删除或用旧值表示新语义都会让旧录像读错。

```ts
/** 录像指令码，数值属于录像格式的一部分 */
export const enum ReplayCode {
    /** 向上移动一步 */
    Up,
    /** 向右移动一步 */
    Right,
    /** 向下移动一步 */
    Down,
    /** 向左移动一步 */
    Left,
    /** 自动寻路瞬移至目标点 */
    Teleport,
    /** 使用道具 */
    UseItem,
    /** 装备物品 */
    Equip,
    /** 卸下装备 */
    Unequip,
    /** 使用技能（本篇新增） */
    UseSkill
}
```

新增一项意味着修改 `packages-user` 的引擎内容，而不是只改 `src`。`registerCommand` 收的是普通 `number`，跳过枚举直接写数字也能注册；但引擎之后分配新码时可能撞号，所以正式做法仍然是在枚举末尾追加。

指令码的取值还受位宽限制。默认的 `ReplayCommandWidth.Uint8` 只支持 `0–255`，超出后写入会被截断。需要更多指令码时，在开始录制前切到 `ReplayCommandWidth.Uint16`（`0–65535`）：

```ts
import { ReplayCommandWidth } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 在注册/录制超过 255 的指令码之前调用。 */
function useUint16ReplayCodes(state: ICoreState): void {
    state.replaySystem.array.setCommandWidth(ReplayCommandWidth.Uint16);
}
```

`setCommandWidth` 会重新编码现有指令；`ReplaySystem.saveState` 会把当前 `commandWidth` 一并存入录像，`loadState` 再按存档里的宽度恢复，所以本系统自己的存读档不需要额外转换。但这是录像格式变更：外部工具或旧版本若固定按 Uint8 解析，就读不了 Uint16 录像；从 Uint16 降回 Uint8 时，大于 255 的指令码会告警 code 154 并被截断。确定要扩容后就不要来回切换。

## 指令对象

一条指令实现 `IReplayCommand`：

| 成员            | 作用                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `type`          | `ReplayCommandType.Active` 或 `Passive`                                   |
| `execute(step)` | 执行这一步，返回 `Promise<ReplayCommandResult>`                           |
| `finalize?()`   | 连续多步同一指令结束时统一收尾，返回 `Promise<ReplayCommandResult>`；可选 |

`step` 提供 `command`（指令码）、`params`（参数列表）与 `index`（读取流给出的步索引）。返回值 `ReplayCommandResult` 有三种：

- `Success`：这一步成功，继续播放；
- `Failed`：这一步失败，播放中止；
- `Ignored`：失败但可以忽略，控制台输出信息后继续。

`finalize` 在两种时机被调用：下一步换了另一条指令，或整条录像已经播完。它没有参数，但**有返回值**：`Promise<ReplayCommandResult>`。返回 `Success` 继续，返回 `Ignored` 记录后继续，返回 `Failed` 会中止播放。需要跨步保存的数据要放在指令对象的成员里。典型用途是「连续多步移动后，统一启动一次动画」：每步只更新目标，最后一步结束时再提交。

## 主动录像与被动录像

`ReplayCommandType.Active` 的指令自己执行逻辑，是最常见的形式。内置的移动、瞬移、使用道具、装备都是主动录像。

`ReplayCommandType.Passive` 的指令不执行任何逻辑。沙盒在主动步执行期间把下一步暴露给 `IReplaySandbox.getPassive()`，由主动步取走参数，处理完后调用 `next(status)` 才会推进。适合「需要渲染端配合、耗时不可预测」的行为：数据端只负责给出参数，什么时候处理完由外部决定。

`getPassive()` 返回的是 `IReplayPassiveHandler | null`，结构为：

```ts
export interface IReplayPassiveHandler {
    /** 被动步本身，params 与 command 都在这里 */
    readonly step: IReplayStepHandler;
    /** 处理完后调用；Success 或 Ignored 会进入下一步，Failed 不推进 */
    next(status: ReplayCommandResult): Promise<void>;
}
```

**`next(status)` 在这个 handler 上，不在 `IReplayCommand` 上，也不在 `getPassive()` 的返回值之外**。完整链路是：

1. 玩家入口先 `record` 主动指令，再紧接着 `record` 被动指令——两个录像步必须相邻：

    ```ts
    this.state.replaySystem.record(ReplayCode.UseSkill, skillId, x, y);
    // 紧随其后的被动步，给渲染端播放技能特效
    this.state.replaySystem.record(ReplayCode.SkillEffect, skillId);
    ```

2. 回放时，主动指令的 `execute` 在自己的执行期间取被动 handler：

    ```ts
    const passive = this.state.replaySystem.sandbox?.getPassive();
    if (passive) {
        // 参数在 passive.step.params；先确认它确实是预期的那条被动指令
        const [effectSkill] = passive.step.params as [number];
        console.log('播放技能特效', effectSkill);
        // 渲染端处理完后推进；不调用 next 就不会进入下一步
        await passive.next(ReplayCommandResult.Success);
    }
    ```

3. `next` 推进读取流并触发 `onStep`；重复调用 `getPassive()` 在推进前会拿到同一个 handler / 同一步。

被动指令本身只需要声明类型并注册，`execute` 不会被沙盒调用：

```ts
import { ReplayCommandResult, ReplayCommandType } from '@user/data-common';
import { BaseReplayCommand } from './commands';

/** 技能特效的被动步：参数由主动步通过 getPassive 取走。 */
export class ReplaySkillEffect extends BaseReplayCommand {
    readonly type: ReplayCommandType = ReplayCommandType.Passive;

    protected readonly name: string = 'skill-effect';
    protected readonly paramTypes: readonly string[] = ['number'];

    async wrappedExecute(): Promise<ReplayCommandResult> {
        // 被动步不会进入这里；保留实现只是为了满足基类契约
        return ReplayCommandResult.Success;
    }
}
```

被动步必须紧跟在某个主动步之后，并在那个主动步的 `execute` 返回前被取走。没有及时消费的被动步不会让播放永远卡住：下一次 `replayStep` 发现它是 `Passive` 时会告警 code 194 并跳过，但这一步对应的效果就丢了。被动步对应的指令对象仍然要注册，沙盒要靠它判断 `type`；它的 `execute` 不会被调用。一个主动步只对应一个紧随其后的被动步，不要连续排两个。

渲染端的播放表现按渲染端教程处理，本篇只写数据端。 <!-- TODO(renderer): 被动录像的渲染端消费 -->

## 用基类减少样板

`src/data/replay/commands.ts` 里的 `BaseReplayCommand` 已经实现了参数校验：它按 `paramTypes` 检查参数个数与 `typeof` 结果，不匹配时直接返回 `Failed`，不会进入子类逻辑。子类只需要提供：

- `name`：写进错误信息的指令名；
- `paramTypes`：参数类型名数组，取值只能是 `'number'`、`'string'`、`'boolean'`、`'bigint'`；
- `wrappedExecute(step)`：真正的执行逻辑，不需要再校验参数类型。

下面是一条 `ReplayUseSkill`：参数为 `[number skillId, number x, number y]`，技能不可用时返回 `Failed`。

```ts
import {
    IReplayStepHandler,
    ReplayCommandResult,
    ReplayCommandType
} from '@user/data-common';
import { IStateSystem } from '@user/data-system';
import { BaseReplayCommand } from './commands';

/** 技能服务：由作者自己的技能系统实现，引擎不内置 */
export interface ISkillService {
    /** 判断技能能否在目标点使用 */
    canUse(skillId: number, x: number, y: number): boolean;
    /** 执行技能效果；回放时也走这里，注意不要在这里写录像 */
    apply(skillId: number, x: number, y: number): void;
}

/**
 * 使用技能。
 * 参数顺序必须与 paramTypes 一致：技能 id、目标横坐标、目标纵坐标。
 */
export class ReplayUseSkill extends BaseReplayCommand {
    readonly type: ReplayCommandType = ReplayCommandType.Active;

    protected readonly name: string = 'use-skill';
    protected readonly paramTypes: readonly string[] = [
        'number',
        'number',
        'number'
    ];

    constructor(
        state: IStateSystem,
        private readonly skills: ISkillService
    ) {
        super(state);
    }

    async wrappedExecute(
        step: IReplayStepHandler
    ): Promise<ReplayCommandResult> {
        // 参数已由基类校验过，这里可以直接断言类型
        const [skillId, x, y] = step.params as [number, number, number];

        // 技能不可用时不继续播放，避免后续步骤建立在错误状态上
        if (!this.skills.canUse(skillId, x, y)) {
            return ReplayCommandResult.Failed;
        }

        this.skills.apply(skillId, x, y);
        return ReplayCommandResult.Success;
    }
}
```

`BaseReplayCommand` 的 `execute` 会先校验参数再调用 `wrappedExecute`。因此不要在 `wrappedExecute` 里重复写 `typeof` 判断；参数个数或类型错了，基类已经返回 `Failed`。

如果技能效果是异步的，要在 `wrappedExecute` 里 `await` 完再返回 `Success`，否则后续录像步可能在效果完成前就开始执行。

## 注册

指令必须在沙盒开始播放之前注册。沙盒每一步都通过 `state.replaySystem.getCommand(code)` 查表；查不到时告警并中止播放。

内置指令在 `src/data/replay/initialize.ts` 的 `initializeReplay` 中注册。新增一条指令，就在同一个函数里加一行：

```ts
import { ReplayCode } from '@user/data-common';
import { IDataPluginDefine, ICoreState } from '@user/data-state';
import { ISkillService, ReplayUseSkill } from './commands';

/**
 * 技能插件：既提供技能服务，也具备数据端插件生命周期。
 * 如果你的技能系统不是插件，换成自己的取得方式即可。
 */
export interface ISkillPlugin extends IDataPluginDefine, ISkillService {}

/**
 * 初始化录像指令。
 * 注册必须发生在第一次创建沙盒之前。
 */
export function initializeReplay(state: ICoreState): void {
    const replay = state.replaySystem;

    // ...内置指令的注册保持不变

    const skillPlugin = state.getDataPlugin<ISkillPlugin>('skill');
    if (skillPlugin) {
        replay.registerCommand(
            ReplayCode.UseSkill,
            new ReplayUseSkill(state, skillPlugin.plugin)
        );
    }
}
```

同一指令码只能注册一次。重复注册会告警（code 163）并保留先注册的对象，后注册的不会生效；因此不要在插件初始化与主初始化里各注册一遍。

如果技能系统不是插件，就换成你自己的取得方式；只要保证注册发生在第一次 `createReplaySandbox` 之前即可。

## 记录

注册只让回放认识这条指令，录制仍要在行为入口写入。高级 I 已经讲过 `@shouldReplay` 的规则，这里只给与自定义指令配合的写法：

```ts
import { ReplayCode, shouldReplay } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 技能系统：玩家入口写录像，回放入口只执行效果 */
export class SkillSystem implements ISkillService {
    constructor(private readonly state: ICoreState) {}

    canUse(skillId: number, x: number, y: number): boolean {
        // ...判断技能是否可用
        return true;
    }

    @shouldReplay('Using a skill should be replayed.')
    use(skillId: number, x: number, y: number): void {
        if (!this.canUse(skillId, x, y)) return;

        // 先记录，再执行；参数顺序必须与 paramTypes 一致
        this.state.replaySystem.record(ReplayCode.UseSkill, skillId, x, y);
        this.apply(skillId, x, y);
    }

    apply(skillId: number, x: number, y: number): void {
        // ...真正的技能效果；回放时由 ReplayUseSkill 调用这里
    }
}
```

把「记录 + 执行」的玩家入口与「只执行」的回放入口分开，可以避免同一次技能被记两遍。如果某个被动触发的路径会调用带记录的入口，用 `disable()` 与 `revert()` 把那段包住，并且必须配对。

## 沙盒播放

`createReplaySandbox` 创建播放沙盒：

```ts
import { IReplayArray, IStateReseter } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/**
 * 演示用重置器：把游戏恢复到录像开始前的状态。
 * 恢复逻辑由项目的新游戏或读档入口提供，通过构造函数注入。
 */
export class ReplayReseter implements IStateReseter {
    constructor(
        private readonly restore: (save?: Map<string, unknown>) => void
    ) {}

    reset(save?: Map<string, unknown>): void {
        // 传入存档时恢复到该存档；不传时回到新游戏初始状态
        this.restore(save);
    }
}

/**
 * 播放一条录像。
 * restore 由项目自己的读档或新游戏流程实现。
 */
async function playReplay(
    state: ICoreState,
    route: IReplayArray,
    restore: (save?: Map<string, unknown>) => void
): Promise<void> {
    const replay = state.replaySystem;

    // 从创建沙盒开始就禁用录制：
    // 创建时会立刻重置状态，播放时还会执行各条指令，这些都不应写回录像
    replay.disable();
    try {
        // 创建沙盒时会立刻调用 reseter.reset(save)，把状态恢复到起始点
        const sandbox = replay.createReplaySandbox({
            route,
            reseter: new ReplayReseter(restore),
            // 从第几步开始播放，默认为 0
            startIndex: 0
        });

        // 先挂结束钩子，再开始播放
        const stopped = new Promise<void>(resolve => {
            sandbox.addHook({ onStopReplay: () => resolve() });
        });

        sandbox.play();
        await stopped;
    } finally {
        replay.revert();
        replay.releaseSandbox();
    }
}
```

`reseter` 负责把游戏状态重置到录像的起点；不重置的话，回放会叠加在当前状态上，结果与原始游玩对不上。`createReplaySandbox` 在创建时就会调用一次 `reset`，不是在 `play` 时。

`reset` 收到的 `save` 来自沙盒配置的 `save` 字段（`IReplaySandboxConfig.save`，可选）。`ReplaySystem.createReplaySandbox` 实际执行的是 `config.reseter.reset(config.save)`；不传 `save` 就是 `reset(undefined)`。如果录像要从某个存档点开始回放，把该存档读出的 `Map<string, unknown>` 传给 `save`，`reset` 就用它恢复起点；`ReplayReseter` 里注入的 `restore` 只是项目自己的「新游戏 / 读档」实现。

播放控制由 `IReplaySandbox` 提供：

| 成员            | 作用                                                        |
| --------------- | ----------------------------------------------------------- |
| `play()`        | 连续播放                                                    |
| `step()`        | 单步播放，返回该步是否成功                                  |
| `pause()`       | 暂停，返回的 Promise 在真正暂停后兑现                       |
| `resume()`      | 从暂停恢复                                                  |
| `stop()`        | 停止播放                                                    |
| `getReplayed()` | 已读取的录像步数量，不含当前正在播放的一步                  |
| `pausing`       | 是否处于暂停状态                                            |
| `ended`         | 是否已经播放完毕                                            |
| `playing`       | 是否处于播放状态                                            |
| `getPassive()`  | 取下一步的 `IReplayPassiveHandler`，不是被动步时返回 `null` |

`ended` 由连续播放的循环在结束时置为 `true`。只用 `step()` 一步步走到末尾时，沙盒会完成 `finalize` 并停止推进，但不会因此设置 `ended`；需要观察结束状态时，用 `play()` 或 `resume()` 跑完循环。

`onStep` 钩子可以在每一步完成后观察进度。它接收当前步的 `command`、`params` 与 `index`；`step()` 与连续播放都会触发。

## 怎么验证

先准备固定地图与固定英雄属性；技能依赖地图时，这一步不能省。然后构造一条只含 `UseSkill` 的录像，分别验证单步与连续播放：

```ts
import { IReplayArray, IReplaySandbox, IStateReseter } from '@user/data-common';
import { ReplayCode } from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 等待沙盒自然结束。 */
function waitForReplayEnd(sandbox: IReplaySandbox): Promise<void> {
    return new Promise(resolve => {
        sandbox.addHook({ onStopReplay: () => resolve() });
    });
}

/**
 * 验证 UseSkill：技能 1，目标 (5, 6)。
 * reseter 由调用方提供，负责把状态恢复到录像起点。
 */
async function verifyUseSkill(
    state: ICoreState,
    route: IReplayArray,
    reseter: IStateReseter
): Promise<void> {
    const replay = state.replaySystem;

    // 只放一条技能录像
    route.add(ReplayCode.UseSkill, [1, 5, 6]);

    // 单步：确认这一步执行成功，且读取进度为 1
    replay.disable();
    try {
        const single = replay.createReplaySandbox({ route, reseter });
        const ok = await single.step();
        console.log('单步结果', ok, '已播放', single.getReplayed());
    } finally {
        replay.revert();
        replay.releaseSandbox();
    }

    // 连续播放：确认能自然结束
    replay.disable();
    try {
        const player = replay.createReplaySandbox({ route, reseter });
        const stopped = waitForReplayEnd(player);
        player.play();
        await stopped;
        console.log('是否结束', player.ended);
    } finally {
        replay.revert();
        replay.releaseSandbox();
    }
}
```

预期现象：

- 单步调用返回 `true`，`getReplayed()` 为 `1`，技能效果（例如目标怪物掉血、勇士属性变化）已经发生；
- 连续播放能走到结束，`ended` 为 `true`；
- 整个过程中录像长度不变；若变长，说明播放期间没有禁用录制。

## 边界与注意

- **不要复用已删除的旧指令码**：数值属于录像格式，旧录像会按旧值解码。新语义一律追加新值。
- **`Uint8` 下不要超过 255**：写入会截断，产生无法回放的录像。需要更多码时切 `Uint16`，并把它当成格式变更处理。
- **参数类型必须与 `paramTypes` 一致**：只支持 `number`、`string`、`boolean`、`bigint`。传对象等无法编码的值会被丢弃，参数个数随之变化，基类会判为失败。
- **被动步忘记 `next` 不会推进**：沙盒不会自己前进；重复调用 `getPassive()` 会得到同一个 handler / 同一步。被动步没有在主动步期间取走时，下一次 `replayStep` 会告警 code 194 并跳过它——播放不会永远卡住，但这一步的效果丢了。
- **`finalize` 返回 `Failed` 会中止播放**：它返回的是 `Promise<ReplayCommandResult>`，和 `execute` 一样会中断后续步骤，不要在里面吞掉错误。
- **指令对象跨回放复用**：指令对象在注册时创建一次，之后每次回放都用同一个实例。成员变量不会自动清空；如果 `execute` 里累积了跨步状态，要在每次 `execute` 开头重置，或在 `finalize` 末尾清理，否则第二次回放会带着上一次的残留。
- **重复注册不会覆盖**：同一指令码重复注册会告警（code 163）并保留先注册的对象。确认注册只发生一次。
- **未知指令码会中止播放**：沙盒查不到指令时告警并停止，不会跳过继续。
- **播放期间必须禁用录制**：否则回放执行的行为会写回同一条录像，并让读取流过期。用 `disable()` 与 `revert()` 包住播放，且保证配对。
- **不要在播放期间修改 `route`**：追加、插入或删除都会让读取流过期，播放随即停止。
- **`finalize` 需要跨步状态**：它没有参数，连续步骤的信息只能保存在指令对象的成员里；指令对象在注册时创建一次，之后复用。

返回[高级 II 导览](./index.md)。
