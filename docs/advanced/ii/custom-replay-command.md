# 自定义录像指令

高级 I 的[录像一致性](../replay-consistency.md)讲的是「已有行为该不该记」，回答方式是给方法加 `@shouldReplay`。还有一种情况它覆盖不到：行为本身不在引擎里，录像里没有对应的指令码，回放时根本无从执行。这时需要新增一条录像指令。

本篇讲一条自定义指令从指令码、指令对象、注册到记录的完整路径，并用技能给出完整示例。主动步与被动步的配合会先用选择框说明。新增指令码会修改 `packages-user` 下的引擎内容，升级时要预期合并成本；如果只是给已有行为补标记，回到[录像一致性](../replay-consistency.md)即可，不必新增指令。

## 什么时候需要自定义指令

判断标准回到那条核心原则：玩家直接产生、会影响最终成绩的行为必须可复现。

- 行为已经有引擎内置指令覆盖，只缺记录：给入口补 `@shouldReplay` 与 `record`。
- 行为是玩家操作，但引擎没有对应指令（自定义交互、技能、商店交易等），需要一条新指令，让回放时能把这一步重新执行。

中级教程的[录像指令](../../intermediate/replay-commands.md)已经讲过主动与被动、`IReplayCommand` 的主体结构；本篇从指令码、指令对象和注册开始，把一条新指令接进引擎，并讲清被动步在回放时怎么被消费。

## 指令码是格式的一部分

`ReplayCode` 是 `packages-user/data-common/src/replay/types.ts` 里的 `const enum`。它的数值会写进录像的命令数组，属于录像格式的一部分，因此遵循只增不改：新语义必须分配新值，删除或用旧值表示新语义都会让旧录像读错。

```ts
/** 录像指令码，数值属于录像格式的一部分 */
export const enum ReplayCode {
    // ...已有录像码省略

    /** 使用技能（本篇新增） */
    UseSkill,
    /** 技能特效的被动步，紧跟主动步（本篇新增） */
    SkillEffect
}
```

本篇新增两个码：`UseSkill` 是主动步，`SkillEffect` 是紧跟其后的被动步；两者都要在 `registerCommand` 里注册，否则沙盒按指令码查表时会中止播放。

新增一项意味着修改 `packages-user` 的引擎内容，而不是只改 `src`。`registerCommand` 收的是普通 `number`，跳过枚举直接写数字也能注册；但引擎之后分配新码时可能撞号，所以正式做法仍然是在枚举末尾追加。

指令码默认能容纳 255 个，99.9% 的项目都用不完，本篇不展开位宽细节。若指令码数量确实可能超过 255，参考 `高级 III · 录像格式与指令码位宽`。

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

`finalize` 在两种时机被调用：下一步换了另一条指令，或整条录像已经播完。它没有参数，但**有返回值**：`Promise<ReplayCommandResult>`。返回 `Success` 继续，返回 `Ignored` 记录后继续，返回 `Failed` 会中止播放。需要跨步保存的数据要放在指令对象的成员里。典型用途是「连续多步操作后统一收尾」：每步只更新暂存状态，最后一步结束时再提交。

## 主动录像与被动录像

`ReplayCommandType.Active` 的指令自己执行逻辑，实现 `execute` 即可，是最常见的形式。

被动步不执行自己的逻辑，它的参数要由知道「什么时候该用它」的那一方来取。最典型的例子是选择框：玩家打开选择框并选择一项。录像无法提前知道这里会弹出什么选择框、有哪些选项，只能等选择框出现后，由选择框系统自己读录像里的选择。选择框一般由样板内置，作者通常不需要自己实现；这里只用它说明被动步的场景。

回放时，主动步负责让选择框出现并等它结束；选择框系统在框出现后取被动步，用录下来的选择代替玩家点击，然后调用 `next` 推进。这样，选择框什么时候弹、弹出什么，都由当时运行的界面决定，录像只负责回答「玩家选了什么」。

被动步有两个硬性约束：

- **必须紧跟在一个主动步之后**。`getPassive()` 只在当前主动步执行期间把下一步暴露出来；一个主动步只对应一个紧随其后的被动步。
- **必须在主动步完成前被取走并 `next` 完**。被动步一定源于某个主动操作：主动操作让界面出现，界面再读选择。主动步一旦返回，这一步就不会再作为被动步交给任何人；沙盒会告警并跳过它，等待这一步结果的界面也就永远等不到。所以不要把 `next` 留到主动步返回之后。反过来，主动步预期有被动步、但下一步不是被动步时，`getPassive()` 会返回 `null` 并报错。

取到 handler 后只有一个推进动作：处理完调用 `next`。确实可能需要在多个地方分别取用，但每一处用完都要 `next`；不调用的话，再次 `getPassive()` 拿到的还是同一步。

`getPassive()` 返回的是 `IReplayPassiveHandler | null`，结构为：

```ts
export interface IReplayPassiveHandler {
    /** 被动步本身，params 与 command 都在这里 */
    readonly step: IReplayStepHandler;
    /** 处理完后调用；Success 或 Ignored 会进入下一步，Failed 不推进 */
    next(status: ReplayCommandResult): Promise<void>;
}
```

:::info 忘记 next 会怎样
忘记 `next` 不会让整条录像停住，只是这一步没有读到下一个录像。主动步返回后，沙盒发现这条被动录像没被消费，会告警并跳过它，然后继续播放后面的录像。
:::

回放链路可以拆成三步：

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

主动步的 `execute` 返回值决定播放是否继续；被动步的 `next` 只负责推进读取。通常应在 `await passive.next(...)` 之后返回 `Success`。

被动步的指令对象只用来声明类型和参数，`execute` 不会被沙盒调用：

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

推荐把注册写进插件。插件在 `awake` 里注册自己带来的指令；别人安装这个插件时，指令会随插件一起就位，不需要再改 `initializeReplay`，只需要在 `ReplayCode` 里补上对应的码（如果这个码还不存在）。

```ts
import { ReplayCode } from '@user/data-common';
import { ICoreState, IDataPluginDefine } from '@user/data-state';
import { ISkillService, ReplaySkillEffect, ReplayUseSkill } from './commands';
import { SkillSystem } from './skill';

/**
 * 技能插件：技能服务与录像指令一起注册。
 * 把插件加进 src/data/plugin/list.ts 的 dataPlugins 后，它会随数据端一起初始化。
 */
export class DataSkillPlugin implements IDataPluginDefine {
    readonly id: string = 'data-skill-plugin';
    readonly dataDeps: string[] = [];

    /** 技能服务：主动步通过它执行技能 */
    skill!: ISkillService;

    awake(state: ICoreState): void {
        this.skill = new SkillSystem(state);

        // 注册必须发生在第一次创建沙盒之前；插件的 awake 满足这个时机
        state.replaySystem.registerCommand(
            ReplayCode.UseSkill,
            new ReplayUseSkill(state, this.skill)
        );
        state.replaySystem.registerCommand(
            ReplayCode.SkillEffect,
            new ReplaySkillEffect(state)
        );
    }

    async initialize(): Promise<void> {}

    async afterLoad(): Promise<void> {}
}
```

同一指令码只能注册一次。重复注册会告警（code 163）并保留先注册的对象，后注册的不会生效；因此不要在插件初始化与主初始化里各注册一遍。只有确实不属于任何插件的引擎内容，才放在 `src/data/replay/initialize.ts` 的 `initializeReplay` 里。

## 记录

注册只让回放认识这条指令，录制仍要在行为入口写入。技能系统里，`use` 负责记录：先 `record` 主动步，再 `record` 紧跟其后的被动步，两个录像步必须相邻；回放时由 `ReplayUseSkill` 执行，不再记录。

`@shouldReplay` 写在 `apply` 上，而不是 `use` 上：真正可能修改状态的是 `apply`，`use` 只是调用它；而且 `use` 里的 `if` 在不可用时会直接返回，不会走到记录。把标记写在 `apply` 上，任何调用 `apply` 的路径都会被检查到。

```ts
import { ReplayCode, shouldReplay } from '@user/data-common';
import { ICoreState } from '@user/data-state';
import { ISkillService } from './commands';

/** 技能系统：玩家入口写录像，回放入口只执行效果 */
export class SkillSystem implements ISkillService {
    constructor(private readonly state: ICoreState) {}

    canUse(skillId: number, x: number, y: number): boolean {
        // ...判断技能是否可用
        return true;
    }

    use(skillId: number, x: number, y: number): void {
        if (!this.canUse(skillId, x, y)) return;

        // 先记录主动步，再记录紧随其后的被动步；两者必须相邻
        this.state.replaySystem.record(ReplayCode.UseSkill, skillId, x, y);
        this.state.replaySystem.record(ReplayCode.SkillEffect, skillId);
        this.apply(skillId, x, y);
    }

    /** 真正修改状态的地方，@shouldReplay 写在这里 */
    @shouldReplay('Applying a skill should be replayed.')
    apply(skillId: number, x: number, y: number): void {
        // ...真正的技能效果；回放时由 ReplayUseSkill 调用这里
    }
}
```

把「记录 + 执行」的玩家入口与「只执行」的回放入口分开，可以避免同一次技能被记两遍。如果某个被动触发的路径会调用带记录的入口，用 `disable()` 与 `revert()` 把那段包住，并且必须配对。

## 怎么验证

录一段包含技能的录像，再用样板内置的沙盒播放验证：回放时技能会按录像里的参数再次执行，而不是等你操作；结束后检查技能带来的状态变化（例如目标怪物掉血、勇士属性变化）是否与录制时一致。

播放时不要禁用录制。沙盒播放本身也是一遍真实运行；禁用录制的话，这一遍不会留下任何录像，既不能重播，也无法拿它和原录像对比。样板的播放入口已经处理好播放流程，作者一般不需要自己写。

## 边界与注意

- **不要复用已删除的旧指令码**：数值属于录像格式，旧录像会按旧值解码。新语义一律追加新值。
- **参数类型必须与 `paramTypes` 一致**：只支持 `number`、`string`、`boolean`、`bigint`。传对象等无法编码的值会被丢弃，参数个数随之变化，基类会判为失败。
- **被动步必须在主动步期间消费**：`getPassive()` 只在当前主动步执行期间暴露下一步；主动步返回后，未消费的被动步会被沙盒告警并按 code 194 跳过，等待它的代码会一直等下去。取到 handler 后一定要 `next`；忘记 `next` 不会让整条录像停住，只是不会读到下一个录像，沙盒随后会跳过这一步继续播放。
- **`finalize` 返回 `Failed` 会中止播放**：它返回的是 `Promise<ReplayCommandResult>`，和 `execute` 一样会中断后续步骤，不要在里面吞掉错误。它需要跨步状态时，只能把数据保存在指令对象的成员里；指令对象在注册时创建一次，之后复用。
- **指令对象跨回放复用**：成员变量不会自动清空；如果 `execute` 里累积了跨步状态，要在每次 `execute` 开头重置，或在 `finalize` 末尾清理，否则第二次回放会带着上一次的残留。
- **重复注册不会覆盖**：同一指令码重复注册会告警（code 163）并保留先注册的对象。确认注册只发生一次。
- **未知指令码会中止播放**：沙盒查不到指令时告警并停止，不会跳过继续。

返回[高级 II 导览](./index.md)。
