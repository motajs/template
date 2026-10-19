# 勇士位置

很多逻辑都要先知道一件事：勇士此刻站在哪一层、哪一格、朝哪个方向。比如「进门前朝向对不对」「这只怪离勇士多远」「当前在哪一层」。勇士位置（`state.hero.location`）记录的就是这些信息。本篇只讲如何**获取**它们；如何移动、如何切换楼层属于更底层的内容，会在**高级教程**中讲解（预留标记：`高级教程 · 位置移动与切换楼层`）；待高级教程就位后，此处会替换为链接。

<!-- TODO(advanced): 位置移动与切换楼层 -->

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

## 示例：读取勇士位置信息

**目标**：读取勇士当前的坐标、朝向与所在楼层，并弹出一条提示。

**改哪里**：任何需要这些信息的地方——例如钩子、事件函数或战斗计算里。

**复制什么**：

```ts
const loc = state.hero.getLocation();
const floorId = state.hero.location.floorId;

state.emitTip(
    `坐标 (${loc.x}, ${loc.y})，朝向 ${loc.direction}，楼层 ${floorId}`
);
```

> 复制说明：片段已省略 `import`（这里用到的都是 `state` 上的成员）；若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：只保留你要用的那几行；提示文字换成你自己的。

**怎么验证**：触发一次，看提示里的坐标、朝向、楼层是否与勇士当前状态一致。

**注意**：`floorId` 为 `undefined`、`map` 为 `null` 时表示勇士不处于任何楼层，用到它们前要考虑这种情况（例如勇士尚未上场时）。

楼层的结构与激活状态见[地图结构](./map-structure.md)；想从 `state` 出发找到勇士与地图对象，见[数据端总览](./data-state-overview.md)。
