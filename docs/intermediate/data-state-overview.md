# 数据端总览

数据端的一切都从主对象 `state` 开始。本篇列出作者最常需要的对象与接口，并说明如何从 `state` 拿到它们，作为中级教程其余篇章的查表入口。

## state：一切入口

`state` 是数据端的主对象（类型为 `ICoreState`），地图、勇士、怪物、战斗、Flag 等全部挂在它下面。在数据端代码里，它通常由框架传入——例如道具效果拿到 `(item, state)`、插件拿到 `state`；你也可以从任一数据端对象向外取得它。

```ts
// 从 state 出发访问勇士、地图与 Flag
const hp = state.hero.attribute.getFinalAttribute('hp');
const floorId = state.hero.location.floorId;
const cleared = state.flags.getFieldValue('cleared');
```

## 常用对象与获取方式

下表把最常用的对象与接口列在一起：

| 对象 | 获取方式 | 用途 | 分层 |
| --- | --- | --- | --- |
| `hero` | `state.hero` | 勇士状态（属性、道具、装备、位置） | L1 |
| `maps` | `state.maps` | 楼层集合与楼层激活 | L1 |
| `flags` | `state.flags` | 全局可存档变量 | L1 |
| `enemyManager` | `state.enemyManager` | 怪物创建与查询 | L1 |
| `enemyContext` | `state.enemyContext` | 怪物属性构建与光环 | L2 |
| `combat` | `state.combat` | 战斗流程 | L2 |
| `eventSystem` | `state.eventSystem` | 地图事件执行 | L2 |
| `pathfinding` | `state.pathfinding` | 勇士寻路 | L2 |
| `tileStore` | `state.tileStore` | 图块定义存储 | L0 |
| `itemStore` | `state.itemStore` | 道具定义存储 | L0 |
| `mapStore` | `state.mapStore` | 地图定义存储 | L0 |
| `eventStore` | `state.eventStore` | 游戏事件存储 | L0 |
| `faceManager` | `state.faceManager` | 朝向管理 | L0 |
| `roleFace` | `state.roleFace` | 朝向绑定 | L0 |
| `replaySystem` | `state.replaySystem` | 录像系统 | L0 |
| `loader` | `state.loader` | 数据端加载对象 | L3 |
| `loadManager` | `state.loadManager` | 加载管理器 | L3 |
| `getDataPlugin(id)` | `state.getDataPlugin('xxx')` | 取得已加装的插件 | L3 |
| `emitTip(...)` | `state.emitTip('提示')` | 通知渲染端提示 | L0 |

```ts
const plugin = state.getDataPlugin('main');
state.emitTip('获得黄钥匙');
```

## 分层标注（L0–L3）

上表的「分层」列标注了对象所属的模块层级：L0 公共层、L1 数据层、L2 系统层、L3 顶层。分层的意义在于区分「哪些内容会进存档」「哪些内容负责产生动作」，但**不影响你如何使用它们**——所有对象都能从 `state` 直接访问，调用方式完全一致。

```ts
// 无论哪个分层，访问方式都相同
state.flags.setFieldValue('door-open', true); // L1
const map = state.maps.getActiveMap('floor-1'); // L1
state.emitTip('获得黄钥匙'); // L0
```

## 从这里继续

- 勇士的数值与加成：见[勇士属性](./hero-attribute.md)；
- 勇士的道具与装备：见[勇士道具](./hero-items.md)；
- 地图的层次结构：见[地图结构](./map-structure.md)；
- 全局可存档变量：见[Flag 变量](./flags.md)；
- 在关键动作上挂接处理：见[钩子](./hooks.md)。
