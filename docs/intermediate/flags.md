# Flag 变量

Flag 系统（`state.flags`）是数据端提供的**全局可存档变量**。任何需要跨事件、跨楼层保留的简单状态，都可以存进 Flag；它会随存档一起保存与恢复。

## 字段

Flag 中的每一项是一个**字段**（`IFlagCommonField`），字段名与值一一对应。字段对象提供 `set(value)`（设置值）、`add(value)`（对数字值增减）与 `get()`（取值）。一般不需要直接操作字段对象，用下面的系统接口即可。

## 全部接口

`IFlagSystem` 提供如下接口：

| 接口 | 说明 |
| --- | --- |
| `occupied(field)` | 判断字段是否被占用 |
| `setField(field, value)` | 以指定值插入字段，返回字段对象 |
| `getField(field)` | 取字段对象，不存在返回 `null` |
| `getOrInsert(field, defaultValue)` | 取字段，不存在则以默认值创建 |
| `getOrInsertComputed(field, defaultValue)` | 同上，但默认值由函数惰性计算 |
| `deleteField(field)` | 删除字段 |
| `setFieldValue(field, value)` | 设置字段的值 |
| `addFieldValue(field, value)` | 对数字字段增减 |
| `getFieldValue(field)` | 取字段的值，不存在返回 `undefined` |
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

```ts
// 记录一个开关
state.flags.setFieldValue('boss-defeated', true);

// 记录一个计数
const times = state.flags.getOrInsert('open-count', 0);
times.add(1);
```

想从 `state` 出发找到 Flag 对象，见[数据端总览](./data-state-overview.md)。
