# 地图结构

地图在数据端分成三层：**楼层集合**（`state.maps`）、**楼层**（`IGameMap`）与**图层**（`IMapLayer`）。本篇说明这三层的关系与常用接口。

## 楼层集合（IMapState）

`state.maps` 管理所有楼层：

- `maps`：所有楼层 id 的有序数组；
- `getMap(id)`：取指定 id 的楼层，不存在返回 `null`；
- `getActiveMap(id)`：取指定 id 的**已激活**楼层，未激活返回 `null`；
- `isMapActive(id)`：判断指定楼层是否激活；
- `setMapActiveStatus(id, active)`：设置楼层激活状态；
- `iterateAllMaps()`：迭代所有楼层。

```ts
const floor = state.maps.getMap('floor-1');
for (const [id, map] of state.maps.iterateAllMaps()) {
    // id 为楼层 id，map 为楼层对象
}
```

## 楼层激活（active）

每个楼层（`IGameMap`）都有 `active` 表示是否激活。**只有已激活的楼层才会进入存档**——`IMapState` 的存档仅包含已激活楼层。`getActiveMap(id)` 只返回已激活的楼层，迭代可用 `iterateActiveMaps()` / `iterateInactiveMaps()`。

```ts
state.maps.setMapActiveStatus('floor-1', true);
const active = state.maps.getActiveMap('floor-1');
```

## 楼层（IGameMap）

一个楼层对象包含：

- `floorId`：楼层 id；
- `layerList`：本楼层的所有图层；
- `eventLayer`：本楼层的默认事件层；
- `tileStore`：本楼层共享的图块定义存储；
- `width`、`height`：地图宽高；
- `active`：是否激活。

## 图层（IMapLayer）

`layerList` 中的每个图层（`IMapLayer`）都有：

- `alias`：图层别名；
- `width`、`height`：图层宽高。

**事件层本质就是一个图层**：`eventLayer` 的类型同样是 `IMapLayer`，因此对图层的操作同样适用于事件层。图块的读写见[地图图块](./map-tiles.md)。

想从 `state` 出发找到地图对象，见[数据端总览](./data-state-overview.md)；勇士当前所在楼层见[勇士位置](./hero-location.md)。
