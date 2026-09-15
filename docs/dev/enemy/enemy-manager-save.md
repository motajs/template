# 需求综述

对怪物管理器 `IEnemyManager` 进行存档适配，使其能够参与游戏存档系统。
由于大多数情况下怪物模板不会被修改，不需要全量存储，
只需对比"参考状态"（游戏加载完成时的初始模板），仅保存发生了变化的模板。

为此需要：

- `IEnemy` 和 `ISpecial` 继承 `ISaveableContent` 以支持自身序列化；
- 给 `ISpecial` 添加 `deepEqualsTo` 接口用于特殊属性间的深度比较；
- `IEnemyManager` 继承 `ISaveableContent`，新增 `compareWith`、`modifyPrefabAttribute`、
  `attachEnemyComparer`、`getEnemyComparer` 接口；
- `IEnemyManager` 内部维护 dirty 集合，以首次 `compareWith` 传入的参考为唯一基准；
- `getPrefab` / `getPrefabById` 返回值收窄为 `IReadonlyEnemy<TAttr>`，
  统一由 `modifyPrefabAttribute` 承担模板修改职责。

---

# 实现思路

## 1. 新增存档状态类型

在 `types.ts` 中新增如下类型，用于序列化怪物与管理器的状态：

```ts
/** 单个 IEnemy 的存档状态 */
interface IEnemySaveState<TAttr> {
    readonly attrs: TAttr;
    // 特殊属性按 code 映射，值为各 ISpecial.saveState() 的结果
    readonly specials: ReadonlyMap<number, unknown>;
}

/** IEnemyManager 的存档状态，只保存与参考状态不同的模板 */
interface IEnemyManagerSaveState<TAttr> {
    // code -> 变更后的 IEnemySaveState
    readonly modified: ReadonlyMap<number, IEnemySaveState<TAttr>>;
}
```

## 2. 新增 `IEnemyComparer<TAttr>` 接口

由于管理器外部没有比较怪物属性的需求，将比较逻辑封装为独立的比较器，
附着在 `EnemyManager` 上。比较器接口如下：

```ts
interface IEnemyComparer<TAttr> {
    compare(
        enemyA: IReadonlyEnemy<TAttr>,
        enemyB: IReadonlyEnemy<TAttr>
    ): boolean;
}
```

由用户在初始化时通过 `attachEnemyComparer` 提供。若未提供比较器，
在调用 `modifyPrefabAttribute` 或 `changePrefab` 时需发出警告，且视所有怪物均为脏。

## 3. `ISpecial<T>` 继承 `ISaveableContent<T>`

- `saveState` 返回 `structuredClone(this.value)`（即 `getValue()` 的深拷贝）；
- `loadState` 调用 `setValue(state)`；
- 新增 `deepEqualsTo(other: ISpecial<T>): boolean`：先对比 `code`，
  再对 `value` 进行深度比较。

各内置实现类的比较策略：

- `NonePropertySpecial`：只需比较 `code`，`value` 为 `void` 无需对比；
- `CommonSerializableSpecial`：`value` 为普通可序列化对象，
  使用 `lodash-es` 的 `isEqual` 进行递归深度比较。

## 4. `IEnemy<TAttr>` 继承 `ISaveableContent<IEnemySaveState<TAttr>>`

- `saveState(compression)`：深拷贝 `attrs`，对每个 special 调用
  `saveState(compression)` 收集到 `specials` Map，返回 `IEnemySaveState<TAttr>`；
- `loadState(state, compression)`：以 `state.attrs` 还原属性，
  然后对已有的每个 special 按 code 查找存档中的对应条目并调用 `loadState`；
  若存档中出现当前怪物未注册的 special code，发出 logger 警告并跳过。

## 5. `IEnemyManager<TAttr>` 接口修改

### 5a. 继承 `ISaveableContent<IEnemyManagerSaveState<TAttr>>`

- `saveState(compression)`：遍历 dirty 集合，对每个脏模板调用
  `prefab.saveState(compression)`，汇总为 `IEnemyManagerSaveState<TAttr>` 并返回；
- `loadState(state, compression)`：遍历 `state.modified`，
  找到 code 对应的现有模板，调用 `prefab.loadState(enemyState, compression)` 还原；
  若某 code 不在当前 prefab 表中，发出 logger 警告并跳过；
  **不清空 dirty 集合**，始终以首次 `compareWith` 提供的参考为唯一基准；
  `loadState` 结束后重新用比较器对每个已有脏模板进行比对，
  刷新 dirty 集合（避免加载后实际已恢复初始值的模板仍停留在 dirty 中）。

### 5b. 新增 `compareWith`

```ts
compareWith(reference: ReadonlyMap<number, IReadonlyEnemy<TAttr>>): void;
```

- 由调用方在游戏初始化完成后提供参考快照，外部传入，管理器保存引用；
- **首次调用**：直接存储参考，清空 dirty 集合；
- **非首次调用**：通过 logger 发出警告，提示此操作风险高，
  请作者确认操作意图，但仍然执行覆盖（直接替换参考，重置 dirty 集合）。

### 5c. `getPrefab` / `getPrefabById` 返回值改为 `IReadonlyEnemy<TAttr>`

原来返回 `IEnemy<TAttr>`，外部可以直接修改模板。
改为只读引用，外部不能直接修改，必须通过 `modifyPrefabAttribute` 完成。

### 5d. 新增 `modifyPrefabAttribute`

```ts
modifyPrefabAttribute(
    code: number | string,
    modify: (prefab: IEnemy<TAttr>) => IEnemy<TAttr>
): void;
```

执行流程：

1. 根据 `code`（数字或 id 字符串）找到对应的模板；
2. 将模板以可写引用传入 `modify`，获得修改结果；
3. 若 `modify` 返回的是**新引用**（与传入的不同），则将该新对象替换模板表条目
   （同时更新 `prefabByCode` 与 `prefabById`）；
4. 将最终生效的模板与 `compareWith` 中提供的参考模板进行 `IEnemyComparer.compare` 比较：
    - 若不相等，则将此 code 加入 dirty 集合；
    - 若相等（改回了初始值），则从 dirty 集合中移除；
5. 若未附加比较器，则始终视为脏，并发出 logger 警告。

### 5e. 新增 `attachEnemyComparer` / `getEnemyComparer`

```ts
attachEnemyComparer(comparer: IEnemyComparer<TAttr>): void;
getEnemyComparer(): IEnemyComparer<TAttr> | null;
```

- `attachEnemyComparer`：设置当前管理器使用的比较器；
- `getEnemyComparer`：返回当前比较器，如未设置则返回 `null`，
  允许外部在特殊场景下借用比较器。

### 5f. `changePrefab` 也参与 dirty 追踪

`changePrefab` 直接替换模板表，修改完成后同样与参考模板进行比较，
更新 dirty 集合（逻辑与 `modifyPrefabAttribute` 步骤 4 相同）。

`deletePrefab` 不参与 dirty 追踪，存档时直接跳过被删除的模板。

---

# 涉及文件

## 需要引用的文件

- `lodash-es`：`CommonSerializableSpecial.deepEqualsTo` 中使用 `isEqual` 进行深度比较
- `@motajs/common`：引用 `logger` 接口
- `@user/data-base/common/types.ts`：引用 `ISaveableContent`、`SaveCompression`

## 需要修改的文件

### `packages-user/data-base/src/enemy/types.ts`

- [ ] 新增 `IEnemySaveState<TAttr>` 类型：单个怪物的存档状态
- [ ] 新增 `IEnemyManagerSaveState<TAttr>` 类型：管理器的存档状态
- [ ] 新增 `IEnemyComparer<TAttr>` 接口：包含 `compare` 方法，由用户实现
- [ ] 修改 `ISpecial<T>`：继承 `ISaveableContent<T>`，
      新增 `deepEqualsTo(other: ISpecial<T>): boolean`
- [ ] 修改 `IEnemy<TAttr>`：继承 `ISaveableContent<IEnemySaveState<TAttr>>`
- [ ] 修改 `IEnemyManager<TAttr>`：继承 `ISaveableContent<IEnemyManagerSaveState<TAttr>>`，
      新增 `compareWith`、`modifyPrefabAttribute`、`attachEnemyComparer`、`getEnemyComparer`；
      修改 `getPrefab` 与 `getPrefabById` 返回类型为 `IReadonlyEnemy<TAttr>`

### `packages-user/data-base/src/enemy/enemy.ts`（`Enemy` 类）

- [ ] 实现 `saveState(compression): IEnemySaveState<TAttr>`
- [ ] 实现 `loadState(state, compression): void`

### `packages-user/data-base/src/enemy/manager.ts`（`EnemyManager` 类）

- [ ] 新增 `private readonly dirtySet: Set<number>` 成员：记录脏模板的 code
- [ ] 新增 `private referenceByCode: Map<number, IReadonlyEnemy<TAttr>>` 成员：
      保存参考快照
- [ ] 新增 `private comparer: IEnemyComparer<TAttr> | null` 成员：比较器
- [ ] 新增 `private hasReference: boolean` 成员：标记是否已首次调用 `compareWith`
- [ ] 实现 `compareWith`：存储参考快照，非首次调用发出警告，重置 dirty 集合
- [ ] 实现 `modifyPrefabAttribute`：调用 modify、处理引用变化、比较、更新 dirty 集合
- [ ] 修改 `changePrefab`：替换模板后同步更新 dirty 集合
- [ ] 修改 `getPrefab` / `getPrefabById` 返回类型（仅类型，实现无需改动）
- [ ] 实现 `attachEnemyComparer` / `getEnemyComparer`
- [ ] 实现 `saveState`：遍历 dirty 集合，序列化并返回
- [ ] 实现 `loadState`：根据存档恢复脏模板，恢复后重新刷新 dirty 集合

### 引擎内置特殊属性（当前包内）

- [ ] `NonePropertySpecial`：实现 `saveState`、`loadState`、`deepEqualsTo`
      （`value` 为 `void`，`deepEqualsTo` 只比较 `code`）
- [ ] `CommonSerializableSpecial`：实现 `saveState`、`loadState`、`deepEqualsTo`
      （`deepEqualsTo` 的 value 比较使用 `lodash-es` 的 `isEqual`）
