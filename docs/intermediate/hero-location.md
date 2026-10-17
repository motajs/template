# 勇士位置

勇士位置（`state.hero.location`）记录当前坐标、朝向与所在楼层。本篇只讲如何**获取**这些信息。

## 当前坐标

```ts
const x = state.hero.location.x;
const y = state.hero.location.y;
```

`x`、`y` 为勇士当前的横、纵坐标。

## 当前朝向

朝向通过 `getCurrentFaceDirection()` 获取，返回 `FaceDirection`（`Left`、`Up`、`Right`、`Down` 等）：

```ts
const dir = state.hero.location.getCurrentFaceDirection();
```

`state.hero.getLocation()` 会返回一个包含 `x`、`y`、`direction` 的位置对象（`IFacedTileLocator`），适合一次性取走当前坐标与朝向：

```ts
const loc = state.hero.getLocation();
// loc.x、loc.y、loc.direction
```

## 当前楼层

勇士所在的楼层通过 `floorId` 与 `map` 获取：

- `floorId`：当前楼层 id，`undefined` 表示不处于任何楼层；
- `map`：当前楼层对象（`IGameMap`），`null` 表示不处于任何楼层。

```ts
const floorId = state.hero.location.floorId;
const map = state.hero.location.map;
```

楼层的结构与激活状态见[地图结构](./map-structure.md)；想从 `state` 出发找到勇士与地图对象，见[数据端总览](./data-state-overview.md)。
