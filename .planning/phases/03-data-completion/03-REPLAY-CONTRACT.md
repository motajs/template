# Phase 3 Replay Command Contract

本文件记录录像指令的稳定契约。数值指令码属于录像格式的一部分，注册项提供实现但不
分配全局指令编号。

> **实现同步（quick 260913-qtq 及后续）：** 指令改为 `BaseReplayCommand` 基类 + 类
> 实现；寻路指令码改名 `Teleport`；参数改为纯数值 / 固定数量；注册收口为 `CoreState`
> 的私有 `registerReplayCommands()`；移动指令新增 `notExecuted` 批量收尾。本节取代
> 下方任何与旧指令名 / 旧注册辅助 / 字符串参数相关的历史描述。

## Stable enum and registration order

`ReplayCommandCode` 是这些数值的唯一拥有者：

| Order | Enum member | Stable code | Action |
| ----: | ----------- | ----------: | ------ |
| 1 | `Up` | `0` | 勇士向上移动一步 |
| 2 | `Right` | `1` | 勇士向右移动一步 |
| 3 | `Down` | `2` | 勇士向下移动一步 |
| 4 | `Left` | `3` | 勇士向左移动一步 |
| 5 | `Teleport` | `4` | 瞬移 / 自动寻路到编码的目标点 |
| 6 | `UseItem` | `5` | 调用勇士道具使用入口 |
| 7 | `Equip` | `6` | 将编码装备穿到编码槽位 |
| 8 | `Unequip` | `7` | 卸下编码的数值槽位 |

`0`–`7` 属于录像格式，不得重编号、不得由注册表遍历推断、不得替换为字符串、也不得由
`data-common` / `data-system` 或单个指令模块分配。裸名 `REPLAY_COMMAND_ORDER` 保留为
测试读取的稳定顺序。

## Command shape

`replay/commands.ts` 中每个指令实现 `IReplayCommand`。公共基类
`BaseReplayCommand` 提供：

- `name: string` — 指令的字符串名称（用于参数校验日志）。
- `paramTypes: readonly string[]` — 期望的 JS 参数类型列表。
- `protected assertParameter(command, parameter, expect)` — 校验参数数量与类型；
  数量不符记 `logger.error(2001)`，类型不符记 `logger.error(2002)`，校验失败返回 `false`。
- `abstract wrappedExecute(step): Promise<boolean>` — 参数校验后的实际逻辑。
- `execute(step): Promise<boolean>` — 先校验参数，再委托 `wrappedExecute`。

指令不调用 `shouldReplay`；`shouldReplay` 的落点仍由用户放在真正改变最终状态的底层
方法上。需要跨步收尾的指令实现可选的 `notExecuted()`（见“移动指令”）。

## Command parameter boundary

指令参数使用现有 `ReplayParamValue[]`。每个指令在 `wrappedExecute` 首行以注释记录期望
的二进制参数类型；参数数量固定，**不允许可选参数，也不使用字符串参数**：

| Command | 参数（二进制类型注释） | 状态访问 |
| ------- | ---------------------- | -------- |
| `move`（四个方向实例） | 无 | `CoreState.hero.location.mover` |
| `teleport` | `[int16 x, int16 y]` | 内部拥有的、绑定勇士移动器的 `PathfindingSystem` |
| `use-item` | `[int16 item]` | `CoreState.hero.items.useItem(item)` |
| `equip` | `[int16 uid, int8 slot, bool autoUnload]` | `CoreState.hero.equip.equip(uid, slot, autoUnload)` |
| `unequip` | `[int8 slot]` | `CoreState.hero.equip.unequip(slot)` |

非法参数数量 / 类型、目标缺失、动作已在进行中或状态 API 无效果时返回 `false`。每个
`return false` 位置对应一个独立 logger 错误码，确保录像报错可溯源（当前 `2003`–`2008`）。

## Completion boundaries

- **移动指令（`ReplayMoveCommand`，四个方向实例）：** `wrappedExecute` 只把方向追加到
  移动器（`mover.step(direction)`），不启动；`notExecuted()` 调用 `mover.start()` 并
  等待 `onEnd`。这样连续移动步骤可以合并成一次移动，由下一次不同指令或录像结束触发
  收尾。
- **瞬移指令（`ReplayTeleportCommand`）：** 调用 `PathfindingSystem.teleportTo({ x, y })`；
  返回 `null` 记 `2005` 并返回 `false`，否则等待其 `controller.onEnd`。
- **使用物品（`ReplayUseItemCommand`）：** 直接返回 `hero.items.useItem(item)`；失败记
  `2006` 并返回 `false`。
- **装备（`ReplayEquipCommand`）：** 调用 `equipment.equip(uid, slot, autoUnload)`；
  `getEquipped(slot) !== uid` 记 `2007` 并返回 `false`。
- **卸下（`ReplayUnequipCommand`）：** 调用 `equipment.unequip(slot)`；
  `getEquipped(slot) !== undefined` 记 `2008` 并返回 `false`。
- 移动 / 瞬移在 `execute` 返回 `Promise<boolean>` 之前等待控制器完成；道具与装备沿用
  既有同步边界，其结果被适配为同一布尔边界。

## Sandbox finalization

`ReplaySandbox.step()` 在播放下一步之前，先对**上一步**指令调用 `notExecuted?.()`（记
`warn 175` 表示收尾失败）；当读取流结束（录像结束）时，先对最后一步执行同样的收尾，
再标记结束。收尾逻辑封装为私有 `finalizeLast()`。这保证以连续移动结尾的录像最终也会
启动并等待移动。

## Top-level registry ownership

`CoreState` 是最终装配边界。一个 `CoreState` 拥有独立的 `ReplaySystem`，并通过私有方法
`registerReplayCommands()` **逐个直接注册**八个稳定指令码：

```ts
this.replaySystem.registerCommand(
    ReplayCommandCode.Up,
    new ReplayMoveCommand(this, FaceDirection.Up)
);
// …共八条，按 Up/Right/Down/Left/Teleport/UseItem/Equip/Unequip 顺序
```

不再有 `data-state/replay` 下的工厂 / 注册辅助函数，也不使用 `IReplayCommandItem` /
`IReplayCommandRegistry` 扩展边界。重复指令码由既有 `ReplaySystem.registerCommand`
（记 `warn 163`）处理。

## CoreState and Node runner access

公共 `ICoreState` 契约不为 replay 扩展。`createCoreState()` 创建独立实例；Node runner
从 `data-state/src/core.ts` 导入该工厂，而非兼容单例。具体状态实例拥有 replay system
与内部绑定移动器的寻路系统；`hero.location.mover`、`hero.items`、`hero.equip`、
`state.pathfinding` 是既有动作目标，不新增 `ICoreState` 成员。

## Explicit exclusions

本记录不授权新增公共 `ICoreState` replay 属性、第二个指令码拥有者、字符串指令码格式、
重排注册表、Phase 4 渲染点击边界，或把 Plan 01 的私有 tracer 当作最终注册表。
