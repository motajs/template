# 勇士位置

很多逻辑都要先知道一件事：勇士此刻站在哪一层、哪一格、朝哪个方向。比如「进门前朝向对不对」「这只怪离勇士多远」「当前在哪一层」。勇士位置（`state.hero.location`）记录的就是这些信息。本篇只讲如何**获取**它们；如何移动、如何切换楼层属于更底层的内容，留到高级教程。

## 当前坐标

勇士站在哪一格，读 `x`、`y` 即可：

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

如果坐标和朝向要一起用，`state.hero.getLocation()` 会返回一个包含 `x`、`y`、`direction` 的位置对象（`IFacedTileLocator`），一次取走更省事：

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
