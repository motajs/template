# 需求综述

`HeroLocation` 当前仅有坐标信息（`x`/`y`），无法确定勇士当前所处的楼层，导致 `HeroMover.checkTerrain` 无法定位到正确的楼层进行地形判定。同时 `checkTerrain` 仍为 TODO 存根，直接返回 `HeroMoveCode.Step`，无法完成通行判定。

本次需要完成以下内容：

1. 为 `HeroLocation` 新增楼层标识信息，保存楼层 id（`string | undefined`）而非 `ILayerState` 对象。勇士允许不处在任何楼层，此时 `floorId` 为 `undefined`。
2. 完成 `HeroMover` 的地形通行判定逻辑，并引入可插拔的 `ITerrainPassChecker` 接口，允许用户注入自定义判定器。当未注入判定器时，地形判定直接返回不可通行。

# 接口设计分析

## ITerrainPassChecker

### 接口综述

`ITerrainPassChecker` 是地形通行判定的可插拔抽象，仅含一个判定方法。HeroMover 每步移动前调用它来判定前方一格是否可通行（高频操作）。用户通过在 `HeroMover` 上调用 `useTerrainChecker` 注入判定器。若未注入（`null`），则 `checkTerrain` 直接返回 `HeroMoveCode.CannotMove`，即所有地形均不可通行。

该接口定义在 Layer 1（`@user/data-base`）。由于 `IHeroLocation` / `IHeroMover` 同为 Layer 1 对象，无法持有 `IStateBase` 引用（`IStateBase` 是 Layer 1 的顶层接口，其中 `maps` 需要 `IStateBase` 才可访问），因此 `canPass` 仅接收 `floorId` 作为楼层标识，具体如何获取 `ILayerState` 由判定器实现方自行处理（判定器实现一般在 Layer 2，可持有 `IStateBase` 引用）。

参考 `IDamageCalculator` 的设计模式：职责单一、实例注入、无外部依赖。

### 接口分析

- `ITerrainPassChecker.canPass(locator, direction, floorId)`：预期频率**高频**。每步移动都需要判定前方地形是否可通行，故为单单词命名。典型使用场景：`HeroMover.onStepStart` 中拿到当前步的 `moveDirection` 后调用 `canPass` 进行判定。`floorId` 可能为 `undefined`（勇士不处于任何楼层时），判定器需自行处理。

### 预期体量

接口定义约 6 行。HeroMover 中 `checkTerrain` 修改约 10 行，`useTerrainChecker` 约 5 行。

## IHeroLocation

### 接口变化

`IHeroLocation` 新增 `readonly floorId: string | undefined` 只读成员。这是楼层标识符，与 `IMapStore.getLayerState(id)` 的 `id` 参数一致。`undefined` 表示勇士尚未处于任何楼层。

## IHeroMover

### 接口变化

`IHeroMover` 新增 `useTerrainChecker(checker)` 方法，传入 `null` 移除判定器（默认状态为 `null`）。

预期频率：**低频**。一般仅在初始化时调用一次以注入自定义判定逻辑。

## 默认判定器

默认判定器（基于图块 `inPass`/`outPass` 的标准通行判定）作为 `ITerrainPassChecker` 的独立实现，放在 `@user/data-state/src/hero/` 下（Layer 2）。该实现持有 `IStateBase` 引用，可在 `canPass` 中通过 `floorId` 查找 `ILayerState`，进而获取事件层图块数据完成通行判定。

由于默认判定器不在本次需求的核心范围内，仅在设计层面预留位置，后续单独实现。

# 实现思路

## 1. 在 `types.ts` 中新增接口与类型

新增 `ITerrainPassChecker` 接口：

```ts
export interface ITerrainPassChecker {
    canPass(
        locator: ITileLocator,
        direction: FaceDirection,
        floorId: string | undefined
    ): boolean;
}
```

修改 `IHeroLocation`：新增 `readonly floorId: string | undefined`。

修改 `IHeroLocationSave`：新增 `readonly floorId: string | undefined`。由于原定义为 `extends Readonly<IFacedTileLocator>`，新增 `floorId` 后需展开为显式成员声明，避免将 `floorId` 类型污染到 `IFacedTileLocator`。

修改 `IHeroMover`：新增 `useTerrainChecker(checker: ITerrainPassChecker | null): void`。

## 2. 修改 `HeroLocation` 类

- 新增 `floorId: string | undefined` 成员，初始值 `undefined`。
- `saveState` 中将 `floorId` 写入 `IHeroLocationSave`。
- `loadState` 中从 `IHeroLocationSave` 恢复 `floorId`。

由于暂不提供 `setFloorId`，`floorId` 的赋值留待后续处理。

## 3. 修改 `HeroMover` 类

- 新增 `private terrainChecker: ITerrainPassChecker | null = null`。
- 实现 `useTerrainChecker(checker)`：`this.terrainChecker = checker ?? null`。
- 修改 `checkTerrain` 方法：
  1. 若 `terrainChecker` 为 `null`，直接返回 `HeroMoveCode.CannotMove`。
  2. 否则以当前坐标（`{ x: tile.x, y: tile.y }`）、`this.moveDirection`、`tile.floorId` 为参数调用 `terrainChecker.canPass`。
  3. 若 `canPass` 返回 `false`，返回 `HeroMoveCode.CannotMove`；返回 `true` 则返回 `HeroMoveCode.Step`。

## 4. 导出

`ITerrainPassChecker` 已定义在 `hero/types.ts`，通过 `hero/index.ts` 导出，无需额外操作。

# 涉及文件

## 需要引用的文件

- `@motajs/common`：引用 `ITileLocator`。
- `@user/data-common`：引用 `FaceDirection`、`IObjectMover`、`IObjectMovable`、`IFaceHandler`、`IMoverController`、`ObjectMoveStep`、`ObjectMoveStepType`、`getFaceMovement`。
- `@user/data-base`：引用 `IHeroLocation`、`IHeroMover`、`IHeroMoverConfig`、`HeroMoveCode`。

## 需要修改的文件

### `packages-user/data-base/src/hero/types.ts`

- [ ] 新增 `ITerrainPassChecker` 接口：提供可插拔的地形通行判定能力。
- [ ] 修改 `IHeroLocation`：新增 `readonly floorId: string | undefined`。
- [ ] 修改 `IHeroLocationSave`：新增 `readonly floorId: string | undefined`。将 `extends Readonly<IFacedTileLocator>` 展开为显式成员声明 `readonly x: number`、`readonly y: number`、`readonly direction: FaceDirection`、`readonly floorId: string | undefined`。
- [ ] 修改 `IHeroMover`：新增 `useTerrainChecker(checker: ITerrainPassChecker | null): void`。

### `packages-user/data-base/src/hero/location.ts`

- [ ] 新增 `floorId: string | undefined` 成员，初始 `undefined`。
- [ ] 修改 `saveState`，新增 `floorId` 字段。
- [ ] 修改 `loadState`，恢复 `floorId` 字段。

### `packages-user/data-base/src/hero/mover.ts`

- [ ] 新增 `private terrainChecker: ITerrainPassChecker | null = null`。
- [ ] 实现 `useTerrainChecker` 方法。
- [ ] 修改 `checkTerrain` 方法：无判定器时返回 `CannotMove`，有判定器时委托调用 `canPass`。
