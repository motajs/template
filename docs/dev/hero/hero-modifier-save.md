# 需求综述

当前勇士属性修饰器 `IHeroModifier` 是非注册式的，无法直接存档。
目标是将其改为注册式，每种修饰器在使用前需先在属性对象上注册，
并实现 `ISaveableContent` 接口以支持存档读档。

注册接口签名：`registerModifier(identifier: string, cons: () => IHeroModifier): void`

# 实现思路

## 1. 修改 `IHeroModifier` 接口

- 将 `identifier` 改为 `type`：一类修饰器可能被添加多次，
  `type` 比 `identifier` 更准确地表达"修饰器类型"的含义。
- 新增泛型参数 `S = unknown` 作为存档类型，让接口继承 `ISaveableContent<S>`：
  `IHeroModifier<T, V, S = unknown>`
- 大多数修饰器的可变状态只有 `value`，因此 `BaseHeroModifier` 将 `S` 默认为 `V`。
  若修饰器需要特殊存储结构，可以不继承 `BaseHeroModifier`，自行编写实现类。

## 2. 新增 `IModifierStateSave` 类型

`IModifierStateSave` 记录单条修饰器的存档信息：

```ts
interface IModifierStateSave {
    readonly name: PropertyKey; // 属性名，如 'atk'
    readonly type: string; // 修饰器类型（与注册时的 key 对应）
    readonly state: unknown; // 修饰器 saveState 结果
}
```

## 3. 修改 `IHeroStateSave`，新增 `modifiers` 字段

`attribute` 字段维持原来的 `THero` 只保存基础属性值，
修饰器列表单独作为顶层字段：

```ts
readonly modifiers: readonly IModifierStateSave[];
```

## 4. 修改 `IHeroAttribute`，新增 `iterateModifiers` 方法

`HeroAttribute` 不再继承 `ISaveableContent`，也不负责存读档，
保留现有的 `toStructured(): THero`。
新增 `iterateModifiers` 方法，供 `HeroState` 在存档时遍历所有已挂载的修饰器：

```ts
iterateModifiers(): Iterable<[keyof THero, IHeroModifier]>;
```

## 5. 修改 `BaseHeroModifier`，新增 `S` 泛型并实现 `ISaveableContent<V>`

- 改为 `BaseHeroModifier<T, V>` 隐式以 `S = V` 实现 `ISaveableContent<V>`
- 将 `abstract readonly identifier: string` 改为 `abstract readonly type: string`
- `saveState()` 直接返回 `this.currentValue`
- `loadState(state)` 调用 `this.setValue(state)` 恢复值

## 6. 修改 `HeroState`

修饰器注册表移至 `HeroState`：

- 新增 `private readonly registry: Map<string, () => IHeroModifier>` 存储工厂函数
- 实现 `registerModifier(type, cons)`：向 `registry` 写入工厂，
  并同步注册到接口签名中
- 实现 `createModifier<V>(type)`：从 `registry` 取出对应工厂，
  调用工厂函数创建并返回修饰器实例，类型为 `IHeroModifier<unknown, V>`
- 实现 `createAndInsertModifier<K, V>(type, name)`：
  调用 `createModifier` 创建实例后，自动调用 `this.attribute.addModifier(name, modifier)` 插入属性对象，
  返回该修饰器实例，类型与 `createModifier` 一致
- 修改 `saveState()`：
    1. `attribute` 字段调用 `this.attribute.toStructured()` 获取基础属性值（与现在一致）
    2. 遍历 `this.attribute.iterateModifiers()`，对每个修饰器调用
       `modifier.saveState(compression)` 并拼装 `IModifierStateSave[]`，
       写入 `modifiers` 字段
- 修改 `loadState()`：
    1. 创建新的 `HeroAttribute` 实例（使用 `state.attribute` 还原基础属性值，与现在一致）
    2. 遍历 `state.modifiers`，通过 `registry.get(type)` 创建修饰器实例，
       调用 `modifier.loadState(state)` 恢复值，再 `addModifier(name, modifier)` 挂载

# 涉及文件

## 需要修改的文件

### `@user/data-base/hero/types.ts`

- [x] 修改 `IHeroModifier<T, V>` 接口：
      改为 `IHeroModifier<T, V, S = unknown>`，`identifier` 改名为 `type`，
      继承 `ISaveableContent<S>`
- [x] 新增 `IModifierStateSave` 接口：单条修饰器的存档格式
- [x] 修改 `IHeroStateSave<THero>`：新增 `readonly modifiers: readonly IModifierStateSave[]` 字段
- [x] 修改 `IReadonlyHeroAttribute<THero>`：新增 `iterateModifiers()` 方法签名
- [x] 修改 `IHeroState<THero>`：新增以下方法签名 - `registerModifier(type: string, cons: () => IHeroModifier): void` - `createModifier<V>(type: string): IHeroModifier<unknown, V>` - `createAndInsertModifier<K extends keyof THero, V>(type: string, name: K): IHeroModifier<unknown, V>`

### `@user/data-base/hero/attribute.ts`

- [x] 修改 `BaseHeroModifier<T, V>`：
      将 `abstract readonly identifier` 改为 `abstract readonly type`；
      实现 `saveState` / `loadState`
- [x] 修改 `HeroAttribute<THero>`：实现 `iterateModifiers()`

### `@user/data-base/hero/state.ts`

- [x] 修改 `HeroState<THero>`：新增 `private readonly registry: Map<string, () => IHeroModifier>` 成员
- [x] 实现 `HeroState.registerModifier`：将工厂函数写入 `registry`
- [x] 实现 `HeroState.createModifier`：从 `registry` 取出工厂并调用，返回新实例；
      若 `type` 未注册则抛出错误
- [x] 实现 `HeroState.createAndInsertModifier`：调用 `createModifier` 后，
      再调用 `this.attribute.addModifier(name, modifier)`，返回同一实例
- [x] 修改 `HeroState.saveState`：遍历 `iterateModifiers()` 写入 `modifiers` 字段
- [x] 修改 `HeroState.loadState`：遍历 `state.modifiers` 重建修饰器并挂载
