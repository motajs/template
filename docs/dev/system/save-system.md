# 需求综述

实现游戏引擎存档系统（`SaveSystem`）及全局事务（`GlobalTransaction`）两个类的完整逻辑。
存档系统分为两部分：

- **存档内容**：按 slot id 保存/读取游戏当前状态（`Map<string, ISaveableContent<unknown>>`），
  使用 Dexie 将数据存入 IndexedDB。
- **全局存储**：跨存档的 key-value 存储，用于存放存档 meta data、全局设置等。
  支持事务处理，事务中的写入操作在发生错误时全部回滚。

此外，系统提供基于内存的自动存档，并支持 undo/redo 操作。
自动存档不主动写入 IndexedDB，只有显式调用 `saveAutosaveToDB` 时才将 undo
栈顶存档写入数据库。
存档操作使用 `performance` 接口监控耗时，超过配置阈值时通过 logger 发出警告。

---

# 实现思路

## 1. Dexie 数据库 Schema 设计

`SaveSystem` 构造函数接收数据库名称 `name`，在其中创建如下两张表：

| 表名     | 主键            | 说明                                                      |
| -------- | --------------- | --------------------------------------------------------- |
| `saves`  | `id`（number）  | 按 slot id 存储存档数据；`id = -1` 固定用于持久化自动存档 |
| `global` | `key`（string） | 全局 key-value 存储                                       |

- `saves` 表中每条记录结构为 `{ id: number, compression: SaveCompression, data: Map<string, unknown> }`，
  与 `ISaveRead` 对应，直接利用 IndexedDB 的结构化克隆存储，不进行 JSON 序列化。
- `global` 表中每条记录结构为 `{ key: string, value: unknown }`，
  同样直接存储，不进行 JSON 序列化。

## 2. 内部状态

`SaveSystem` 需要维护如下私有成员：

- `private undoStack: ISaveRead[]`：undo 栈，存储 `ISaveRead` 快照
- `private redoStack: ISaveRead[]`：redo 栈，存储 `ISaveRead` 快照
- `private stackSize: number`：undo/redo 栈最大容量（默认 `20`）
- `private autosaveLevel: SaveCompression`：默认 `SaveCompression.LowCompression`
- `private commonSaveLevel: SaveCompression`：默认 `SaveCompression.HighCompressoin`
- `private saveTimeTolerance: number`：默认 `100`（ms）
- `private autosaveTimeTolerance: number`：默认 `50`（ms）

## 3. ISaveRead 数据结构

栈与数据库读写均使用新接口 `ISaveRead`：

```ts
interface ISaveRead {
    readonly compression: SaveCompression;
    readonly data: Map<string, unknown>;
}
```

- `compression`：存档时使用的压缩等级，读档时传回给 `loadState`，使接收方能够正确解压。
- `data`：key 到每个可存档对象序列化数据的 Map，key 与 `ISaveableContent` 注册时的 id 对应。

内存栈和数据库均直接存储 `ISaveRead`，不需要引入辅助包装层。
存档系统本身不负责将数据写回游戏对象，调用方拿到 `ISaveRead` 后自行遍历并调用
各可存档对象的 `loadState(data, compression)` 完成状态恢复。

## 4. 各方法实现

### `config(config)`

将 config 各字段写入对应私有成员，使用传入的值覆盖默认值。

### `setAutosaveStackSize(size)`

将 `stackSize` 更新为 `size`。如果当前 undo 栈超过新的 `size`，
从栈底移除多余条目（保留最新的）；redo 栈同理。

### `autosave(state)`

1. 遍历 `state`，对每个 `(key, content)` 调用
   `content.saveState(this.autosaveLevel)` 获取序列化数据，
   汇总为 `Map<string, unknown>`，构建 `ISaveRead { compression: autosaveLevel, data }` 并压入 `undoStack`；
2. **清空 `redoStack`**（执行新的自动存档后无法再 redo）；
3. 若 `undoStack.length > stackSize`，从栈底（`[0]`）移除多余条目。

> IndexedDB 支持结构化克隆，Map、Set、TypedArray 等均可直接存储，无需 JSON 序列化。

### `undoAutosave(current)`

1. 若 `undoStack` 为空，返回 `null`；
2. 将 `current` 序列化为 `ISaveRead { compression: autosaveLevel, data: Map }`，
   压入 `redoStack`；检查 `redoStack.length > stackSize`，超长时从栈底移除多余条目；
3. 弹出 `undoStack` 栈顶（`pop()`），返回弹出的 `ISaveRead`；
4. 调用方拿到返回的 `ISaveRead` 后，自行遍历并对各游戏对象调用 `loadState` 完成恢复。

### `redoAutosave(current)`

与 `undoAutosave` 逻辑对称：将 `current` 序列化压入 `undoStack`，
弹出 `redoStack` 栈顶并返回，调用方自行恢复状态。

### `getUndoStack()` / `getRedoStack()`

使用 `slice()` 返回栈数组的浅拷贝快照，防止外部意外修改栈结构。

### `saveAutosaveToDB()`

1. 若 `undoStack` 为空，直接返回（无需写入）；
2. 记录 `t0 = performance.now()`；
3. 取 `undoStack` 栈顶（`ISaveRead`），将其连同 `id = -1` 一起写入 `saves` 表；
4. 记录 `t1 = performance.now()`；若 `t1 - t0 > autosaveTimeTolerance`，
   调用 `logger.warn(115, (t1 - t0).toFixed(0), this.autosaveTimeTolerance.toString())`。

### `save(id, state)`

1. 记录 `t0 = performance.now()`；
2. 遍历 `state`，对每个 `(key, content)` 调用
   `content.saveState(this.commonSaveLevel)` 汇总为 `Map<string, unknown>`，
   构建 `{ id, compression: commonSaveLevel, data }` 写入 `saves` 表；
3. 将 `id` 写入全局存储 `'lastSlot'` 键（用于 `getLastSlot()`）；
4. 记录 `t1 = performance.now()`；若 `t1 - t0 > saveTimeTolerance`，
   调用 `logger.warn(114, (t1 - t0).toFixed(0), this.saveTimeTolerance.toString())`。

### `load(id)`

1. 从 Dexie `saves` 表查询 `id`；
2. 若不存在返回 `null`；
3. 将读取到的记录中的 `compression` 和 `data` 字段组装成 `ISaveRead` 返回。
   调用方自行遍历 `data` 并对各游戏对象调用 `loadState` 完成恢复。

> `load(-1)` 可用于读取持久化的自动存档。

### `deleteSave(id)`

直接从 Dexie `saves` 表删除对应记录。

### `getLastSlot()`

从全局存储读取 `'lastSlot'` 键对应的值并返回；若不存在则返回 `0`。

### `getGlobal<T>(key)` / `setGlobal(key, value)`

- `getGlobal`：从 Dexie `global` 表读取 `key` 对应的 `value` 字段并返回，类型断言为 `T`；
- `setGlobal`：将 `{ key, value }` 直接写入 Dexie `global` 表，无需 JSON 序列化。

### `startGlobalTransaction<R>(handle)`

使用 `Dexie.transaction('rw', this.db.table('global'), ...)` 包裹 `handle` 调用，
传入 `GlobalTransaction` 实例，出错时自动回滚。

### `GlobalTransaction.get<T>(key)` / `GlobalTransaction.set(key, value)`

在事务上下文中直接读写 `table`（即全局 `global` 表的引用），无需 JSON 序列化。

## 5. logger.json 新增 warn 代码

当前最大 warn 代码为 `113`，新增如下两条（写入 `packages/common/src/logger.json`
的 `warn` 对象，置于 `113` 之后）：

| 代码  | 消息                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------------------- |
| `114` | `Save operation took $1ms, exceeding the tolerance of $2ms. Consider reducing compression level.`     |
| `115` | `Autosave operation took $1ms, exceeding the tolerance of $2ms. Consider reducing compression level.` |

---

# 涉及文件

## 需要引用的文件

- `dexie`：Dexie / Table 类型，用于创建和操作 IndexedDB 数据库
- `@motajs/common`：`logger`，用于输出存档耗时超限警告
- `@user/data-base`：`ISaveableContent`、`SaveCompression`，存档接口与压缩枚举
- `./types`：`ISaveRead`、`IGlobalTrasaction`、`ISaveSystem`、`ISaveSystemConfig`

## 需要修改的文件

### `packages/common/src/logger.json`

- [x] 在 `warn` 对象中新增代码 `114`：普通存档耗时超限警告
- [x] 在 `warn` 对象中新增代码 `115`：自动存档耗时超限警告

### `packages-user/data-state/src/save/system.ts`

- [x] 新增 `private undoStack: ISaveRead[]` 成员：存储 undo 历史快照
- [x] 新增 `private redoStack: ISaveRead[]` 成员：存储 redo 历史快照
- [x] 新增 `private stackSize: number` 成员：undo/redo 栈容量上限，默认 `20`
- [x] 新增 `private autosaveLevel: SaveCompression` 成员：
      默认 `SaveCompression.LowCompression`
- [x] 新增 `private commonSaveLevel: SaveCompression` 成员：
      默认 `SaveCompression.HighCompressoin`
- [x] 新增 `private saveTimeTolerance: number` 成员：普通存档耗时阈值，默认 `100`
- [x] 新增 `private autosaveTimeTolerance: number` 成员：自动存档耗时阈值，默认 `50`
- [x] 编写构造函数：初始化 Dexie 实例，定义 `saves`（主键 `id`）和
      `global`（主键 `key`）两张表的 schema
- [x] 编写 `config` 方法：将配置项写入私有成员
- [x] 编写 `setAutosaveStackSize` 方法：更新 stackSize，修剪超长的 undo/redo 栈
- [x] 编写 `autosave` 方法：遍历 state 序列化为 `ISaveRead` 压入 undoStack，
      清空 redoStack，超长时修剪栈底
- [x] 编写 `undoAutosave` 方法：将 current 序列化为 `ISaveRead` 压入 redoStack，
      弹出 undoStack 栈顶返回 `ISaveRead`（或 null）
- [x] 编写 `redoAutosave` 方法：与 undoAutosave 对称
- [x] 编写 `getUndoStack` / `getRedoStack` 方法：使用 `slice()` 返回栈的浅拷贝快照
- [x] 编写 `saveAutosaveToDB` 方法：取 undoStack 栈顶以 `id = -1` 写入 `saves` 表，
      performance 监控，超限时调用 `logger.warn(115, ...)`
- [x] 编写 `save` 方法：遍历 state 序列化为 `ISaveRead` 写入 `saves` 表，
      更新 `lastSlot`，performance 监控，超限时调用 `logger.warn(114, ...)`
- [x] 编写 `load` 方法：从 Dexie `saves` 表读取记录组装为 `ISaveRead` 返回
      （不存在返回 null）；`load(-1)` 可读取持久化的自动存档
- [x] 编写 `deleteSave` 方法：从 Dexie `saves` 表删除指定记录
- [x] 编写 `getLastSlot` 方法：从全局存储读取 `'lastSlot'`，不存在时返回 `0`
- [x] 编写 `getGlobal` / `setGlobal` 方法：直接读写 Dexie `global` 表，不进行 JSON 序列化
- [x] 编写 `startGlobalTransaction` 方法：
      使用 Dexie 事务包裹 handle，传入 GlobalTransaction 实例

### `packages-user/data-state/src/save/system.ts`（GlobalTransaction 部分）

- [x] 编写 `GlobalTransaction.get` 方法：在事务上下文中直接读取 table 中 key 对应的 value
- [x] 编写 `GlobalTransaction.set` 方法：在事务上下文中直接写入 key-value，不进行 JSON 序列化
