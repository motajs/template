# 数据插件

插件是数据端的**强拓展系统**：它把一组相关的对象与逻辑打包在一起，挂到数据端主对象 `state` 上，并在加载流程的固定时机初始化。本篇只讲基础用法；插件系统更底层的工作原理见高级教程。

## 插件定义 IDataPluginDefine

一个插件实现 `IDataPluginDefine` 接口：

| 成员 | 说明 |
| --- | --- |
| `id` | 插件标识符，全局唯一 |
| `dependencies` | 依赖的其它插件 id 数组，不允许循环依赖 |
| `awake(state, dependencies)` | 同步初始化 |
| `initialize(state, dependencies)` | 异步初始化 |
| `afterLoad(state, dependencies)` | 加载完成后初始化 |

## 时机次序

数据端启动时，每个插件会依次经历三个阶段：

```text
awake（装配）→ initialize（加载前）→ afterLoad（加载后）
```

- **`awake`**：数据端主对象创建完毕、正式初始化之前调用。同步执行，适合在这里装配插件自己的对象、注册可存档内容；
- **`initialize`**：加载开始**前**调用。返回 `Promise`，可以阻塞加载——它不兑现，依赖它的插件就不会开始初始化，游戏加载也不会开始；
- **`afterLoad`**：主对象加载**完毕后**调用。返回 `Promise`，同样可阻塞。适合做依赖加载内容（地图、数据等）的初始化。

三个阶段都按依赖顺序执行：被依赖的插件先完成同一阶段，才轮到依赖它的一方。`dependencies` 里传入的正是这些依赖插件的对象。

## 注册插件

插件在 `src/data/plugin/list.ts` 的 `dataPlugins` 数组中登记：

```ts
import { IDataPluginDefine } from '@user/data-state';
import { DataShopPlugin } from './shop';

/** 数据端插件列表 */
export const dataPlugins: IDataPluginDefine[] = [new DataShopPlugin()];
```

数据端启动时按这个列表加装插件。把你自己写的插件 `new` 出来加进数组即可（插件目录见[源码导览](./src-tour.md)）。

## 可存档内容

插件常常带有需要进存档的数据。在 `awake` 中用 `state.addSaveableContent(id, content)` 把可存档对象注册进存档系统，读档时它会被一并恢复：

```ts
awake(state: ICoreState): void {
    // 注册插件的可存档内容
    state.addSaveableContent('@plugin/my-plugin', this.saveable);
}
```

`id` 是这个可存档内容在存档中的标识，需唯一。之后可用 `state.getDataPlugin(id)` 取回已加装的插件（见[数据端总览](./data-state-overview.md)）。

## 示例

:::info 占位 / 待提供
一个较简单的插件示例待补充。是否将它纳入本篇，取决于示例本身的难度。
:::
