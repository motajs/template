# Phase 3 Plan 03: Replay Command Contract

## User structural supersession

本节晚于初始 replay checkpoint，优先于下方关于 command completion 和 decorator
placement 的旧记录。S-05 又 supersedes S-02 在 replay-step completion 边界上的结论：

- replay command 不调用 `shouldReplay`；移动和寻路 command 必须等待各自 controller 完成后再返回，确保下一录像步不会与上一步并发。`shouldReplay` 的最终落点仍由用户放在真正改变最终状态的低层方法上。
- 既有 `ReplaySystem`、route 和 sandbox 只做使同步 command 正常运行所需的最小兼容调整，不重新设计录像系统。
- `@shouldReplay()` 不在本次 correction 中移动或新增；其最终位置由用户自行处理，且不得通过 replay command 构造器间接注入。

## Approval

The `confirm-record` checkpoint response approves one top-level replay command
enum. Numeric values are stable and are assigned once in the locked D-25 order;
module registration items provide implementations only and never allocate
global command numbers.

## Stable enum and registration order

`ReplayCommandCode` is the sole owner of these numeric values:

| Order | Enum member           | Stable code | Route command            | Action                                                     |
| ----: | --------------------- | ----------: | ------------------------ | ---------------------------------------------------------- |
|     1 | `Up`                  |         `0` | `up`                     | Move the hero one step upward                              |
|     2 | `Right`               |         `1` | `right`                  | Move the hero one step rightward                           |
|     3 | `Down`                |         `2` | `down`                   | Move the hero one step downward                            |
|     4 | `Left`                |         `3` | `left`                   | Move the hero one step leftward                            |
|     5 | `AutoPathfindToPoint` |         `4` | `auto-pathfind-to-point` | Move the hero to the encoded target point                  |
|     6 | `UseItem`             |         `5` | `use-item`               | Call the hero item-use entry point                         |
|     7 | `Equip`               |         `6` | `equip`                  | Equip the encoded equipment instance into the encoded slot |
|     8 | `Unequip`             |         `7` | `unequip`                | Unequip the encoded numeric slot                           |

The values `0` through `7` are part of the replay format. They must not be
renumbered, inferred from registration-map iteration, replaced with strings,
or allocated by `data-common`, `data-system`, or an individual command module.
The top-level registry must register exactly these eight entries in this table's
order and reject duplicate codes before delegating to `ReplaySystem`.

## Command parameter boundary

The command route continues to use the existing primitive
`ReplayParamValue[]` representation. The command implementations validate
their parameter count and primitive types before touching state:

| Command                       | Parameters                                                                     | State access                                                      |
| ----------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `up`, `right`, `down`, `left` | none                                                                           | `CoreState.hero.location.mover`                                   |
| `auto-pathfind-to-point`      | numeric `x`, numeric `y`                                                       | the internally owned `PathfindingSystem`, bound to the hero mover |
| `use-item`                    | one numeric item number or string item id                                      | `CoreState.hero.items.useItem(item)`                              |
| `equip`                       | numeric equipment `uid`, numeric or string slot, optional boolean `autoUnload` | `CoreState.hero.equip.equip(uid, slot, autoUnload)`               |
| `unequip`                     | one numeric slot                                                               | `CoreState.hero.equip.unequip(slot)`                              |

Invalid parameter count/types, missing targets, an already-running action, or
a state API failure return `false`. A successful synchronous state API returns
silent success.

## Top-level registry ownership

`CoreState` is the final assembly boundary. A fresh `CoreState` owns a fresh
`ReplaySystem` and invokes one data-state replay registration helper with the
approved enum order. The helper's registration items contain command behavior,
while the top-level enum remains the only stable code owner. No lower layer
registers a global code or imports the data-state root barrel to obtain one.

Each non-directional replay instruction is an independent class in the replay
command module. The class owns its state reference, parameter validation, action
call, and `execute` implementation. The four directional entries use one
parameterized `ReplayDirectionCommand` class with a distinct `FaceDirection`
value per fresh instance; they share no mutable command context or closure
factory, and no instruction constructs or delegates to another instruction.
The registry creates four fresh directional instances plus one fresh instance
of each non-directional class in stable enum order while retaining the existing
`IReplayCommandItem` extension boundary.

The existing `IReplaySystem.registerCommand(code, command)` and
`IReplayCommand.execute(step): Promise<boolean>` public contracts remain in
force. Duplicate detection belongs to the top-level assembly helper; the
existing `ReplaySystem` remains the route/command storage boundary.

## CoreState and Node runner access

The public `ICoreState` contract is not expanded for replay. The concrete
`CoreState` construction path is the approved access seam: `createCoreState()`
creates an independent instance, and the Node runner imports that factory from
`data-state/src/core.ts`, never the compatibility singleton from `ins.ts`.

The concrete state instance owns the replay system and the internally bound
pathfinding system needed by command implementations. Node verification may
consume those concrete assembly seams, but it must not depend on browser globals,
the singleton, IndexedDB, or a new options-bearing factory API. The existing
`hero`, `maps`, `eventSystem`, `hero.items`, and `hero.equip` state boundaries
remain the action targets; no new `ICoreState` member is required by this
contract.

## Completion boundaries

- Four-direction movement appends one direction to the hero mover, starts it,
  and awaits the returned mover controller's `onEnd`; it returns `true` only
  after the controller completes and returns `false` for a missing, active, or
  failed action.
- Auto-pathfind calls the existing `PathfindingSystem.moveTo({ x, y })`; a null
  result is `false`, and a non-null result awaits its controller's `onEnd`
  before resolving `true`.
- Item and equipment calls remain synchronous under the current interfaces; their
  boolean/undefined result is converted to the command's success boolean.
- Replay command implementations do not add or invoke replay-safety decorators.
  The user-owned low-level state-mutation decorator boundary remains outside this
  correction; synchronous item/equipment calls retain their existing command
  boundary.
- `IReplayCommand.execute()` continues to return the existing `Promise<boolean>`
  boundary, with movement/pathfinding completion awaited before that Promise
  resolves and synchronous item/equipment results adapted to the same boundary.

## Explicit exclusions

This record does not authorize a new public `ICoreState` replay property, a
second command-code owner, a string-code route format, a reordered registry, a
Phase 4 render click boundary, or reuse of the Plan 01 private direct tracer as
the final registry.
