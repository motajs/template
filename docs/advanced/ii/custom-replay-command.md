# 自定义录像指令

高级 I 的[录像一致性](../replay-consistency.md)讲的是「已有行为该不该记」，回答方式是给方法加 `@shouldReplay`。还有一种情况它覆盖不到：行为本身不在引擎里，录像里没有对应的指令码，回放时根本无从执行。这时需要新增一条录像指令。

本篇讲一条自定义指令从指令码、指令对象、注册到记录的完整路径，并用选择框讲清主动步与被动步怎么配合。新增指令码会修改 `packages-user` 下的引擎内容，升级时要预期合并成本；如果只是给已有行为补标记，回到[录像一致性](../replay-consistency.md)即可，不必新增指令。

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

    /** 打开选择框（本篇新增） */
    OpenChoice,
    /** 玩家在选择框中的选择，紧跟主动步的被动步（本篇新增） */
    ChoiceSelect
}
```

本篇新增两个码：`OpenChoice` 是主动步，`ChoiceSelect` 是紧跟其后的被动步；两者都要在 `registerCommand` 里注册，否则沙盒按指令码查表时会中止播放。

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

`finalize` 在两种时机被调用：下一步换了另一条指令，或整条录像已经播完。它没有参数，但**有返回值**：`Promise<ReplayCommandResult>`。返回 `Success` 继续，返回 `Ignored` 记录后继续，返回 `Failed` 会中止播放。需要跨步保存的数据要放在指令对象的成员里。典型用途是「连续多步操作后统一收尾」：每步只更新暂存状态，最后一步结束时再提交。

## 主动录像与被动录像

`ReplayCommandType.Active` 的指令自己执行逻辑，实现 `execute` 即可，是最常见的形式。

被动步不执行自己的逻辑，它的参数要由知道「什么时候该用它」的那一方来取。最典型的例子是选择框：玩家打开选择框并选择一项。录像无法提前知道这里会弹出什么选择框、有哪些选项，只能等选择框出现后，由选择框系统自己读录像里的选择。

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

下面这个选择框系统同时处理正常游玩与回放：

```ts
import {
    ReplayCode,
    ReplayCommandResult,
    shouldReplay
} from '@user/data-common';
import { ICoreState } from '@user/data-state';

/** 选择框服务：由作者自己的选择框系统实现，引擎不内置 */
export interface IChoiceService {
    /** 打开选择框并返回选择结果；回放时返回录像里的选择 */
    open(choiceId: number): Promise<number>;
}

/** 选择框系统：正常游玩时等玩家点击，回放时读被动录像 */
export class ChoiceSystem implements IChoiceService {
    constructor(private readonly state: ICoreState) {}

    async open(choiceId: number): Promise<number> {
        if (!this.canOpen(choiceId)) {
            // 不可用时直接提示并返回，不记录录像
            this.state.emitTip('当前不能打开这个选择框');
            return -1;
        }

        // 先让选择框出现；数据端只给出选项 id，显示交给渲染端
        this.show(choiceId);

        // 有沙盒说明正在回放，此时没有玩家点击，由选择框系统自己读被动录像
        const sandbox = this.state.replaySystem.sandbox;
        if (sandbox) {
            const passive = sandbox.getPassive();
            if (!passive) {
                // 主动步预期有被动步，但下一步不是被动步；getPassive 已经报错
                return -1;
            }

            // 被动步的参数就是玩家当时的选择
            const [selected] = passive.step.params as [number];
            // 用完必须 next，否则再次 getPassive 还是这一步
            await passive.next(ReplayCommandResult.Success);
            this.apply(choiceId, selected);
            return selected;
        }

        // 正常游玩：等待玩家点击
        const selected = await this.waitForPlayer(choiceId);
        // 主动步与紧跟其后的被动步必须相邻
        this.state.replaySystem.record(ReplayCode.OpenChoice, choiceId);
        this.state.replaySystem.record(ReplayCode.ChoiceSelect, selected);
        this.apply(choiceId, selected);
        return selected;
    }

    /** 真正修改状态的地方，@shouldReplay 写在这里 */
    @shouldReplay('Applying a choice should be replayed.')
    apply(choiceId: number, selected: number): void {
        // ...把选择结果写进游戏状态
    }

    private canOpen(choiceId: number): boolean {
        // ...判断当前能否打开这个选择框
        return true;
    }

    private show(choiceId: number): void {
        // ...渲染端弹出选择框
    }

    private waitForPlayer(choiceId: number): Promise<number> {
        // ...等待玩家点击并返回选项索引
        return Promise.resolve(0);
    }
}
```

主动步的 `execute` 返回值决定播放是否继续；被动步的 `next` 只负责推进读取。通常应在 `await passive.next(...)` 之后返回 `Success`。

被动步的指令对象只用来声明类型和参数，`execute` 不会被沙盒调用：

```ts
import { ReplayCommandResult, ReplayCommandType } from '@user/data-common';
import { BaseReplayCommand } from './commands';

/** 玩家在选择框中的选择：被动步 */
export class ReplayChoiceSelect extends BaseReplayCommand {
    readonly type: ReplayCommandType = ReplayCommandType.Passive;

    protected readonly name: string = 'choice-select';
    protected readonly paramTypes: readonly string[] = ['number'];

    async wrappedExecute(): Promise<ReplayCommandResult> {
        // 被动步不会进入这里；保留实现只是为了满足基类契约
        return ReplayCommandResult.Success;
    }
}
```

渲染端的播放表现按渲染端教程处理，本篇只写数据端。 <!-- TODO(renderer): 选择框的渲染端消费 -->

## 用基类减少样板

`src/data/replay/commands.ts` 里的 `BaseReplayCommand` 已经实现了参数校验：它按 `paramTypes` 检查参数个数与 `typeof` 结果，不匹配时直接返回 `Failed`，不会进入子类逻辑。子类只需要提供：

- `name`：写进错误信息的指令名；
- `paramTypes`：参数类型名数组，取值只能是 `'number'`、`'string'`、`'boolean'`、`'bigint'`；
- `wrappedExecute(step)`：真正的执行逻辑，不需要再校验参数类型。

下面这条 `ReplayOpenChoice`：参数为 `[number choiceId]`，`open` 返回负数时判定为失败。

```ts
import {
    IReplayStepHandler,
    ReplayCommandResult,
    ReplayCommandType
} from '@user/data-common';
import { IStateSystem } from '@user/data-system';
import { BaseReplayCommand } from './commands';
import { IChoiceService } from './choice';

/**
 * 打开选择框。
 * 参数：选择框 id。
 */
export class ReplayOpenChoice extends BaseReplayCommand {
    readonly type: ReplayCommandType = ReplayCommandType.Active;

    protected readonly name: string = 'open-choice';
    protected readonly paramTypes: readonly string[] = ['number'];

    constructor(
        state: IStateSystem,
        private readonly choices: IChoiceService
    ) {
        super(state);
    }

    async wrappedExecute(
        step: IReplayStepHandler
    ): Promise<ReplayCommandResult> {
        // 参数已由基类校验过，这里可以直接断言类型
        const [choiceId] = step.params as [number];

        // 打开选择框；回放时选择框系统会在框出现后读取被动录像
        const selected = await this.choices.open(choiceId);
        if (selected < 0) {
            // 没有读到选择，后续步骤无法继续
            return ReplayCommandResult.Failed;
        }

        return ReplayCommandResult.Success;
    }
}
```

`BaseReplayCommand` 的 `execute` 会先校验参数再调用 `wrappedExecute`。因此不要在 `wrappedExecute` 里重复写 `typeof` 判断；参数个数或类型错了，基类已经返回 `Failed`。

如果打开选择框是异步的，要在 `wrappedExecute` 里 `await` 完再返回 `Success`，否则后续录像步可能在选择结果落地前就开始执行。

## 注册

推荐把注册写进插件。插件在 `awake` 里注册自己带来的指令；别人安装这个插件时，指令会随插件一起就位，不需要再改 `initializeReplay`，只需要在 `ReplayCode` 里补上对应的码（如果这个码还不存在）。

```ts
import { ReplayCode } from '@user/data-common';
import { ICoreState, IDataPluginDefine } from '@user/data-state';
import { ChoiceSystem, IChoiceService } from './choice';
import { ReplayChoiceSelect, ReplayOpenChoice } from './commands';

/**
 * 选择框插件：指令随插件一起注册。
 * 把插件加进 src/data/plugin/list.ts 的 dataPlugins 后，它会随数据端一起初始化。
 */
export class DataChoicePlugin implements IDataPluginDefine {
    readonly id: string = 'data-choice-plugin';
    readonly dataDeps: string[] = [];

    /** 选择框服务：主动步通过它打开选择框 */
    choice!: IChoiceService;

    awake(state: ICoreState): void {
        this.choice = new ChoiceSystem(state);

        // 注册必须发生在第一次创建沙盒之前；插件的 awake 满足这个时机
        state.replaySystem.registerCommand(
            ReplayCode.OpenChoice,
            new ReplayOpenChoice(state, this.choice)
        );
        state.replaySystem.registerCommand(
            ReplayCode.ChoiceSelect,
            new ReplayChoiceSelect(state)
        );
    }

    async initialize(): Promise<void> {}

    async afterLoad(): Promise<void> {}
}
```

同一指令码只能注册一次。重复注册会告警（code 163）并保留先注册的对象，后注册的不会生效；因此不要在插件初始化与主初始化里各注册一遍。只有确实不属于任何插件的引擎内容，才放在 `src/data/replay/initialize.ts` 的 `initializeReplay` 里。

## 记录

注册只让回放认识这条指令，录制仍要在行为入口写入。选择框系统里，`open` 负责记录：先 `record` 主动步，再 `record` 紧跟其后的被动步，两个录像步必须相邻；回放时走沙盒分支，只读被动步，不再记录。

`@shouldReplay` 写在 `apply` 上，而不是 `open` 上：真正可能修改状态的是 `apply`，`open` 只是调用它；而且 `open` 里的 `if` 在不可用时会直接提示并返回，不会走到记录。把标记写在 `apply` 上，任何调用 `apply` 的路径都会被检查到。

把「记录 + 执行」的玩家入口与「只读取 / 只执行」的回放入口分开，可以避免同一次选择被记两遍。如果某个被动触发的路径会调用带记录的入口，用 `disable()` 与 `revert()` 把那段包住，并且必须配对。

## 怎么验证

录一段包含选择框的录像，再用样板内置的沙盒播放验证：回放时选择框会出现，并按录像里的选择自动选中，而不是等你点击；结束后检查选择带来的状态变化（例如 Flag 或道具数量）是否与录制时一致，并确认没有出现「选择录像缺失」的提示。

播放时不要禁用录制。沙盒播放本身也是一遍真实运行；禁用录制的话，这一遍不会留下任何录像，既不能重播，也无法拿它和原录像对比。样板的播放入口已经处理好播放流程，作者一般不需要自己写。

## 边界与注意

- **不要复用已删除的旧指令码**：数值属于录像格式，旧录像会按旧值解码。新语义一律追加新值。
- **`Uint8` 下不要超过 255**：写入会截断，产生无法回放的录像。需要更多码时切 `Uint16`，并把它当成格式变更处理。
- **参数类型必须与 `paramTypes` 一致**：只支持 `number`、`string`、`boolean`、`bigint`。传对象等无法编码的值会被丢弃，参数个数随之变化，基类会判为失败。
- **被动步必须在主动步期间消费**：`getPassive()` 只在当前主动步执行期间暴露下一步；主动步返回后，未消费的被动步会被沙盒告警并按 code 194 跳过，等待它的代码会一直等下去。取到 handler 后一定要 `next`；忘记 `next` 不会让整条录像停住，只是不会读到下一个录像，沙盒随后会跳过这一步继续播放。
- **`finalize` 返回 `Failed` 会中止播放**：它返回的是 `Promise<ReplayCommandResult>`，和 `execute` 一样会中断后续步骤，不要在里面吞掉错误。它需要跨步状态时，只能把数据保存在指令对象的成员里；指令对象在注册时创建一次，之后复用。
- **指令对象跨回放复用**：成员变量不会自动清空；如果 `execute` 里累积了跨步状态，要在每次 `execute` 开头重置，或在 `finalize` 末尾清理，否则第二次回放会带着上一次的残留。
- **重复注册不会覆盖**：同一指令码重复注册会告警（code 163）并保留先注册的对象。确认注册只发生一次。
- **未知指令码会中止播放**：沙盒查不到指令时告警并停止，不会跳过继续。

返回[高级 II 导览](./index.md)。
