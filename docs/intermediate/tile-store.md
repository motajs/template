# 图块存储

地图上每一格摆的都是一个**图块**，而每种图块在内容层 `src/content/tile.jsonc` 里都有一条定义（编号、名字、类型、通行性、默认事件等）。这些定义由 `state.tileStore`（类型 `ITileStore`）统一存放与查询。本篇讲清它存的是什么、**图块数字**与**图块 id** 的区别，以及最常用的几个查询接口。

若你还不熟悉 `state` 从哪来，见[数据端总览](./data-state-overview.md)。

## 图块数字与图块 id

同一个图块有两个「名字」，用途不同：

- **图块数字（num）**：一个整数编号，以内容层 `tile.jsonc` 每个条目的 `num` 字段为准。地图数据里存的都是它——地图矩阵、`Uint32Array` 等一律用数字，因为数字**紧凑、按下标检索快**（一张地图可达成千上万格）。
- **图块 id**：一个稳定的字符串标识（如 `blueShopLeft`），由内容与作者使用，**可读、可长期引用**。

两者必须能互相换算，所以 `state.tileStore` 内部同时保存了两张映射表（`id → num` 与 `num → id`），再加上每个图块数字对应的**默认事件**。于是你写地图时用数字、配置与交流时用 id，随时都能换算。

## 常用接口

| 接口              | 作用                                                                             |
| ----------------- | -------------------------------------------------------------------------------- |
| `getData(num)`    | 按图块数字取完整原始定义（`ITileRawData`；不存在返回 `null`）                    |
| `getType(num)`    | 按图块数字取图块逻辑类型（`TileType`；不存在返回 `TileType.Unknown`）            |
| `getEvent(num)`   | 按图块数字取默认事件（`ReadonlyMap`，键为优先级、值为事件 id；无事件返回空 Map） |
| `addTile(data)`   | 添加一条图块定义（`num` 或 `id` 冲突时告警并覆盖，一般由加载流程调用）           |
| `idToNumber(id)`  | 图块 id → 图块数字（不存在返回 `undefined`）                                     |
| `numberToId(num)` | 图块数字 → 图块 id（不存在返回 `undefined`）                                     |
| `num(token)`      | 传入数字或 id，统一返回图块数字（id 未知返回 `undefined`）                       |
| `id(token)`       | 传入数字或 id，统一返回图块 id（数字未知返回 `undefined`）                       |
| `identity(token)` | 传入数字或 id，返回 `[图块数字, 图块 id]`（未知返回空数组 `[]`）                 |

> 日常写作主要用 `num` / `id` 这一对：传入哪一种都能得到另一种。`idToNumber` / `numberToId` 则是更直白的单向往返写法。

内容层里一条图块定义大致长这样（节选自 `tile.jsonc`）：

```jsonc
{
    "num": 1,
    "id": "blueShopLeft",
    "type": 2,
    "events": {}
}
```

## 实操：在 id 与数字之间换算

**目标**：已知图块的字符串 id，拿到它对应的图块数字（地图读写用），并验证能反查回同一个 id。

**改哪里**：任何能访问到 `state` 的位置——例如某个事件函数或钩子里。

**复制什么**：

```ts
// 图块 id → 图块数字（地图读写用的都是数字）
const num = state.tileStore.num('blueShopLeft')!;

// 图块数字 → 图块 id（读回可读的名字）
const id = state.tileStore.id(num);
```

> 复制说明：片段已省略 `import`（这里用到的都是 `state` 上的成员，一般无需额外引入）；若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md#照抄教程里的代码时-怎么处理-import) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：把 `'blueShopLeft'` 换成你的图块 id。

**怎么验证**：`num` 应等于内容层 `tile.jsonc` 中该条目 `num` 字段的值；`state.tileStore.id(num)` 应反查回同一个 id。

**注意**：token 未知时换算会返回 `undefined`（`num` / `id`）。`!` 只是告诉编辑器「我确信它存在」，若该 id 并不存在，拿到的就是 `undefined`。要一次拿两个值、并按存在性判断，可以用 `identity`——未知时它返回空数组 `[]`（长度为 0）：

```ts
const pair = state.tileStore.identity('blueShopLeft');
if (pair.length === 2) {
    const [num, id] = pair; // 已知存在：num 为数字，id 为字符串
}
```

## 与其它篇章的联系

- 地图上读写图块（`setBlock` / `getBlock` 等）用的正是图块数字，见[地图图块](./map-tiles.md)；
- 道具接口（如 `addItem`）的 `item` 参数同样接受图块数字或 id，见[勇士道具](./hero-items.md)。
