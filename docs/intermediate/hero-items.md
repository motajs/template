# 勇士道具

勇士的背包里能放哪些东西？捡起一把黄钥匙、使用一瓶药水、捡到就立刻生效的宝石——这些行为背后其实是同一套道具系统在管。勇士道具（`state.hero.items`）负责管理勇士拥有的除装备外的所有道具，并提供增加、查询、使用等接口。装备虽然也是道具，但归独立的装备系统，见[勇士装备](./hero-equipment.md)。

## 先分清四类道具

一件道具被捡起或使用时会发生什么，取决于它属于哪一类。类别由 `ItemCategory` 定义：

| 类别         | 含义         | 典型行为                                      |
| ------------ | ------------ | --------------------------------------------- |
| `Constant`   | 永久道具     | 使用后不消耗，可以反复使用                    |
| `Consumable` | 一次性道具   | 使用后消耗一个，用完即消失                    |
| `Pick`       | 即捡即用道具 | 拾取时立刻生效，不进入背包                    |
| `Equipment`  | 装备类道具   | 走装备系统，见[勇士装备](./hero-equipment.md) |

`Unknown` 表示尚未归类。理解了这四类的差别，就能预判一件道具「什么时候、发生什么」：`Pick` 道具不会进入背包——`addItem` 到 `Pick` 道具时会直接触发它的效果。

## 常用接口

日常打交道的主要是下面几个：

- `addItem(item, count?)`：增加道具数量，`count` 可以填负数以扣除道具，默认为 1；对 `Pick` 道具会立刻执行其效果；
- `getItemState(item)`：获取指定道具的状态，不存在返回 `null`；
- `iterateItems()`：迭代勇士拥有的所有道具；
- `useItem(item)`：使用道具，**仅对 `Constant` 与 `Consumable` 生效**，`Consumable` 使用后数量减一；
- `itemCount(item)`：获取指定道具的持有数量。

`item` 参数可以传道具的图块数字或字符串 id（图块数字的含义见[地图图块](./map-tiles.md)）。

```ts
// 发一把黄钥匙（+1）
state.hero.items.addItem('yellow-key');

// 扣减道具（数量传负数）
state.hero.items.addItem('yellow-key', -2);

// 使用道具
state.hero.items.useItem('yellow-key');

// 查询数量
const count = state.hero.items.itemCount('yellow-key');
```

## 迭代背包

想一次看遍勇士拥有的全部道具，用 `iterateItems()`。它每一项的键是道具图块数字，值是道具状态：

```ts
for (const [num, item] of state.hero.items.iterateItems()) {
    // num 为道具图块数字，item 为道具状态
    state.emitTip(`${item.id}: ${item.count}`);
}
```

## 道具效果属内容层

道具「被捡起或使用时具体做什么」，写在内容层的 `src/content/item.ts`，用 `IItemEffect` 描述：`useEffect` 在 `Pick` 拾取或 `Constant` / `Consumable` 使用时触发，`canUse` 决定能否使用，`useEvent` 关联使用事件。道具效果可以调用 `state`（数据端主对象）与道具数据，因而能修改勇士属性、设置 Flag、发送提示等。

```ts
// src/content/item.ts（内容层）
export const item200: ItemEffect = {
    useEffect(item, state) {
        state.hero.getModifiableAttribute().add('atk', 5); // [!code ++]
        state.emitTip('攻击力提升！'); // [!code ++]
    }
};
```

想了解从 `state` 能取到哪些对象，见[数据端总览](./data-state-overview.md)。
