# Flag 变量

有些状态要跨事件、跨楼层一直保留，还要跟着存档走——比如「Boss 是否已被击败」「这道门开过没有」「某处计数到了几」。这些状态放哪？Flag 系统（`state.flags`）就是数据端提供的**全局可存档变量**：任何需要跨事件、跨楼层保留的简单状态，都可以存进 Flag，它会随存档一起保存与恢复。

## 字段与字段值

Flag 里的每一项都对应一个**字段**（`IFlagCommonField`）。要读懂下面的接口清单，先分清两个概念：

- **字段**是一个**对象**，代表「这个变量本身」，提供 `get()`（取值）、`set(value)`（设置值）、`add(value)`（对数字值增减）等方法；
- **字段值**就是字段里存的**那个普通值**（数字、字符串、布尔等）。你平时读写的，大多是字段值。

系统接口因此分成两组，看名字就能分辨：

- **返回或操作字段对象**的：`setField` / `getField` / `getOrInsert` / `getOrInsertComputed`——它们返回字段对象本身；
- **直接操作字段值**的：`setFieldValue` / `addFieldValue` / `getFieldValue` / `getFieldValueDefaults`——只关心值，不暴露字段对象。

怎么选？**只读写一次值**时用「值」那组更简单，不必多一步 `get()`；**要多次操作同一个字段、或要复用字段对象**（例如先拿到字段、再反复增减）时，用「字段对象」那组更省事。两者可以互相转换：

```ts
// 用「字段值」的写法：一次设置、一次增减
state.flags.setFieldValue('open-count', 0);
state.flags.addFieldValue('open-count', 1);

// 用「字段对象」的写法：拿到字段后反复操作
const field = state.flags.getOrInsert('open-count', 0);
field.add(1);
const value = field.get();
```

其实「值」那组就是对「字段对象」那组的简写：`setFieldValue(name, v)` 等价于 `getField(name)?.set(v)`，`getFieldValue(name)` 等价于 `getField(name)?.get()`，`addFieldValue(name, v)` 等价于 `getField(name)?.add(v)`，`getFieldValueDefaults(name, d)` 等价于 `getOrInsert(name, d).get()`。

## 全部接口

`IFlagSystem` 提供如下接口：

| 接口                                         | 说明                                   |
| -------------------------------------------- | -------------------------------------- |
| `occupied(field)`                            | 判断字段是否被占用                     |
| `setField(field, value)`                     | 以指定值插入字段，返回字段对象         |
| `getField(field)`                            | 取字段对象，不存在返回 `null`          |
| `getOrInsert(field, defaultValue)`           | 取字段，不存在则以默认值创建           |
| `getOrInsertComputed(field, defaultValue)`   | 同上，但默认值由函数惰性计算           |
| `deleteField(field)`                         | 删除字段                               |
| `setFieldValue(field, value)`                | 设置字段的值                           |
| `addFieldValue(field, value)`                | 对数字字段增减                         |
| `getFieldValue(field)`                       | 取字段的值，不存在返回 `undefined`     |
| `getFieldValueDefaults(field, defaultValue)` | 取字段的值，不存在则以默认值创建并返回 |

`getOrInsertComputed` 只在字段确实不存在时才执行默认值函数，适合默认值计算量较大的场景。`getFieldValue` 没有默认值，需要默认值时用 `getFieldValueDefaults`。

```ts
state.flags.setFieldValue('door-open', true);
const open = state.flags.getFieldValue('door-open');

state.flags.addFieldValue('kill-count', 1);
const count = state.flags.getFieldValueDefaults('kill-count', 0);
```

## 使用建议

Flag 会进入存档，因此**不建议滥用**：不再需要的变量应及时用 `deleteField` 删除，否则它会一直留在存档里。能用局部状态或对象自身数据表达的，就不必放进 Flag。

```ts
if (!state.flags.occupied('temp-flag')) {
    state.flags.setFieldValue('temp-flag', 1);
}

// 用完后删除，避免残留进存档
state.flags.deleteField('temp-flag');
```

Flag 常与游戏关键动作配合使用，例如在钩子中读写，见[钩子](./hooks.md)。

## 示例：记录开关与计数

**目标**：记下「Boss 已被击败」这个开关，以及「门被开过几次」这个计数——两者都要跟着存档走。

**改哪里**：你要记录这些状态的地方——例如某个事件函数或钩子里。

**复制什么**：

```ts
// 记录一个开关
state.flags.setFieldValue('boss-defeated', true);

// 记录一个计数
const times = state.flags.getOrInsert('open-count', 0);
times.add(1);
```

> 复制说明：片段已省略 `import`（这里用到的都是 `state` 上的成员）；若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md#照抄教程里的代码时-怎么处理-import) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：把 `'boss-defeated'`、`'open-count'` 换成你的字段名，把 `true`、`1` 换成你的值。只需一次读写的开关用「值」那组更简单；要反复增减的计数，用 `getOrInsert` 拿到字段对象后再 `add` 更省事。

**怎么验证**：写入后读 `state.flags.getFieldValue('boss-defeated')` / `getFieldValue('open-count')`，应返回你写入的值；存档后再读档依然存在。

**注意**：Flag 会进存档，不再需要的变量要及时 `deleteField`，避免一直残留在存档里。

想从 `state` 出发找到 Flag 对象，见[数据端总览](./data-state-overview.md)。
