# 地图结构

地图并不是一张铺开的大图，而是分层的。要从代码里找到「某一层的某一块图块」，得先顺着它的层次往下走。地图在数据端分成三层：**楼层集合**（`state.maps`）、**楼层**（`IGameMap`）与**图层**（`IMapLayer`）。本篇说明这三层的关系与常用接口。

## 三层结构

可以把三层想成一棵树：`state.maps` 是「所有楼层的总目录」，里面每个条目是一个楼层；每个楼层里又有一组图层，图块就摆在图层上。日常查地图，大多是从第一层往下逐级找。

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

每个楼层（`IGameMap`）都有 `active` 表示是否激活。**只有已激活的楼层才会进入存档**——`IMapState` 的存档仅包含已激活楼层。因此如果一处楼层改动要跟着存档走，记得先把它激活。`getActiveMap(id)` 只返回已激活的楼层，迭代可用 `iterateActiveMaps()` / `iterateInactiveMaps()`。

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

- `alias`：图层别名，用于标识这个图层；
- `zIndex`：图层纵深，决定渲染时的遮挡顺序；
- `width`、`height`：图层宽高。

**事件层本质就是一个图层**：`eventLayer` 的类型同样是 `IMapLayer`，因此对图层的操作同样适用于事件层。

### 如何取到指定图层

`layerList` 是一个集合（`Set<IMapLayer>`），本身没有「按名字直接取」的方法，所以从 `layerList` 里筛出想要的那一个即可：按 **`alias`** 找（最常用），或按 **`zIndex`** 找。

**目标**：从某个楼层里取出指定图层（例如名为 `ground` 的图层）。

**改哪里**：任何需要操作图层的地方——例如某个事件函数或钩子里。

**复制什么**：

```ts
const map = state.maps.getMap('floor-1')!;

// 按别名取：例如名为 'ground' 的图层
const ground = [...map.layerList].find(layer => layer.alias === 'ground');

// 按纵深取：例如 zIndex 为 2 的图层
const second = [...map.layerList].find(layer => layer.zIndex === 2);
```

> 复制说明：片段已省略 `import`（这里用到的都是 `state` 上的成员）；若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：把 `'floor-1'` 换成你的楼层 id；把 `'ground'` / `2` 换成你要找的别名或纵深；只保留你要用的那种找法。

**怎么验证**：取到的图层若非 `undefined`，再读它的 `alias` 应与你要找的一致；找不到时为 `undefined`。

**注意**：别把 `addLayer(alias)` 当成「取图层」——它是**新建**一个图层并返回，用同一个别名调用会再建一个。取已有图层请按上面的方式从 `layerList` 里找。

事件层是个例外：它可以直接从楼层的 `eventLayer` 取得，不必去筛 `layerList`。

```ts
const eventLayer = map.eventLayer; // IMapLayer | null
```

图块的读写见[地图图块](./map-tiles.md)。

> 地图的通行性判定、图块移动与踩踏触发等更底层的内容，会在**高级教程**中讲解（预留标记：`高级教程 · 地图通行与踩踏`）；待高级教程就位后，此处会替换为链接。

<!-- TODO(advanced): 地图通行与踩踏 -->

想从 `state` 出发找到地图对象，见[数据端总览](./data-state-overview.md)；勇士当前所在楼层见[勇士位置](./hero-location.md)。
