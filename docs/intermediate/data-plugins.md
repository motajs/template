# 数据插件

当你有一组相关功能想打包在一起、挂到数据端主对象 `state` 上，并让它们按固定的时机自动初始化，就可以把它做成一个**数据插件**。插件是数据端的**强拓展系统**：它把一组相关的对象与逻辑收拢到一处，随数据端启动一起加装。本篇只讲基础用法，插件系统更底层的工作原理（依赖如何排序、三个时机在加载流程中的位置等）会在**高级教程**中系统讲解（预留标记：`高级教程 · 插件系统工作原理`）；待高级教程就位后，此处会替换为链接。

<!-- TODO(advanced): 插件系统工作原理 -->

## 插件定义 IDataPluginDefine

一个插件实现 `IDataPluginDefine` 接口：

| 成员                              | 说明                                             |
| --------------------------------- | ------------------------------------------------ |
| `id`                              | 插件标识符，全局唯一                             |
| `dependencies`                    | 依赖的其它插件 **id 字符串数组**，不允许循环依赖 |
| `awake(state, dependencies)`      | 同步初始化                                       |
| `initialize(state, dependencies)` | 异步初始化                                       |
| `afterLoad(state, dependencies)`  | 加载完成后初始化                                 |

三个时机方法都会收到数据端主对象 `state`，你对数据端的操作都从这里展开（`state` 的获取方式与含义见[数据端总览](./data-state-overview.md)）。

## 时机次序

数据端启动时，每个插件会依次经历三个阶段：

```text
awake（装配）→ initialize（加载前）→ afterLoad（加载后）
```

- **`awake`**：数据端主对象创建完毕、正式初始化之前调用。同步执行，适合在这里装配插件自己的对象、注册可存档内容；
- **`initialize`**：加载开始**前**调用。返回 `Promise`，可以阻塞加载——它不兑现，依赖它的插件就不会开始初始化，游戏加载也不会开始；
- **`afterLoad`**：主对象加载**完毕后**调用。返回 `Promise`，同样可阻塞。适合做依赖加载内容（地图、数据等）的初始化。

三个阶段都按依赖顺序执行：被依赖的插件先完成同一阶段，才轮到依赖它的一方。注意区分两处的 `dependencies`：定义插件时写的 `dependencies` 是依赖插件的 **id 字符串数组**；而 `awake` / `initialize` / `afterLoad` 三个方法收到的 `dependencies` 参数，是这些 id 解析后的**插件对象数组**（`IDataPlugin`，含 `plugin` 与 `status`），可以直接操作依赖插件本身。

## 注册插件

插件在 `src/data/plugin/list.ts` 的 `dataPlugins` 数组中登记；`IDataPluginDefine` 来自 `@user/data-state`（包名含义见 [src 导览](./src-tour.md#包从哪来-src、packages-user-与-packages) 的「包从哪来」）：

```ts
/** 数据端插件列表 */
export const dataPlugins: IDataPluginDefine[] = [new DataShopPlugin()];
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md#照抄教程里的代码时-怎么处理-import) 的「照抄教程里的代码时，怎么处理 import」）。

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
