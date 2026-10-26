# 钩子深入

中级教程的[钩子](../../intermediate/hooks.md)回答的是「什么需求该用哪个钩子」；这一篇讲另一件事：怎么把钩子限定到你关心的那个对象上。做法很简单——<strong>建议一个对象一个钩子实例</strong>。共享实例是允许的，但不建议；除非你明确了解钩子的内部实现与后果，否则不要这样做。

钩子接口本身不难，容易出错的是「挂上去了，触发的却不只是你想管的那张地图、那个图层」。下面先讲实例与对象的关系，再给一个完整示例，最后是注册、移除与异步的接口事实。

阅读前需要会基础语法：`class`、`new`、`import`、`async` / `await`。本篇只讲数据端，示例都按当前源码里的接口书写。

## 建议一个对象一个实例

一个钩子类只是定义。真正参与事件的是你用 `new` 创建出来的<strong>实例</strong>，以及它被注册到的那个对象实例。

`Hookable` 的钩子列表是实例字段：每个地图、每个图层、每个移动器各自持有一份，而不是整个类共享一份。所以：

- 同一个钩子类可以 `new` 出多个实例，分别注册到不同对象；
- 给图层 A 注册的钩子，不会出现在图层 B 上；
- 一个实例只应注册到一个对象。

以图层为例，`GameMap.addLayer(alias)` 每次调用都会创建一个新的 `MapLayer`。同一张地图的 `ground` 与 `wall` 是两个不同的 `MapLayer` 实例，各自有独立的钩子列表。地图对象本身也是 `Hookable`，但它的钩子列表与图层完全分开，接收的是另一套接口（`IGameMapHooks` 与 `IMapLayerHooks`），事件也从不同对象发出。

把实例固定在一个对象上，身份就固定在注册处：钩子在哪个对象上被触发，就是因为它注册在哪个对象上。多数钩子方法因此不需要再判断「这次是不是我要的对象」。把同一个实例注册到多个对象是允许的，但回调里就得自己区分触发者，还要承担共享状态带来的后果；除非你明确了解钩子的内部实现，否则不要这样做，本篇也不展开这种用法。

## 示例：图层级钩子

如果你想给某个图层挂一个只处理它的钩子，可以参考下面的示例：钩子类只处理注册它的那个图层，注册函数负责找到目标图层并把实例挂上去。

```ts
import { IMapLayer, IMapLayerHooks } from '@user/data-base';
import { ICoreState } from '@user/data-state';

// 图层级钩子：只处理注册它的那个图层
export class GroundBlockHooks implements IMapLayerHooks {
    constructor(
        readonly state: ICoreState,
        // 注册时传入的目标图层；这个实例只服务它
        readonly layer: IMapLayer
    ) {}

    onUpdateBlock(block: number, x: number, y: number): void {
        // 触发者必然是 this.layer；参数里没有 layer 可比较
        this.state.emitTip(`图层更新：(${x}, ${y}) -> ${block}`);
    }
}
```

```ts
import { IMapLayerHookController } from '@user/data-base';
import { ICoreState } from '@user/data-state';
import { GroundBlockHooks } from './ground-block-hooks';

// 找到目标图层后注册；通常放在插件的 afterLoad 里
export function registerGroundHooks(
    state: ICoreState
): IMapLayerHookController | null {
    const map = state.maps.getMap('floor-1');
    if (!map) {
        // afterLoad 时楼层未必已经构造出来，不要静默跳过
        state.emitTip('floor-1 尚未构造，钩子未注册');
        return null;
    }
    const layer = [...map.layerList].find(v => v.alias === 'ground');
    if (!layer) {
        state.emitTip('ground 图层不存在');
        return null;
    }

    // 注册到 layer，不是 map；返回控制器以便之后卸载
    return layer.addHook(new GroundBlockHooks(state, layer));
}
```

这个示例声明了 `GroundBlockHooks` 类，实现 `IMapLayerHooks`；`registerGroundHooks` 负责按 `alias` 找到目标图层，再调用 `layer.addHook` 注册实例。

示例里的 `readonly layer` 让钩子能访问目标图层本身（读宽高、调用图层方法），不是用来比较一个不存在的参数。`afterLoad` 时楼层未必已经由加载流程构造出来（取决于内容加载方式与插件顺序），`state.maps.getMap('floor-1')` 可能返回 `null`；这时至少要把原因报出来，或者把注册推迟到楼层创建之后。另外，`onUpdateBlock` 只在图块数字真的变化时触发，设置成相同数字不会触发。

如果钩子要在构造时保持通用、注册时才确定图层，可以在 `awake` 里取控制器。`MapLayer` 的控制器是 `IMapLayerHookController`，带 `layer` 字段与 `getMapData()`：

```ts
import { ICoreState } from '@user/data-state';
import { IMapLayerHookController, IMapLayerHooks } from '@user/data-base';

// 节选：awake 同样写在类里，通过控制器拿到注册它的图层
export class UniversalBlockHooks implements IMapLayerHooks {
    constructor(readonly state: ICoreState) {}

    awake(controller: IMapLayerHookController): void {
        // controller.layer 就是注册这个钩子的图层
        console.log(controller.layer.alias);
    }

    onUpdateBlock(block: number, x: number, y: number): void {
        this.state.emitTip(`图层更新：(${x}, ${y}) -> ${block}`);
    }
}
```

## 示例：地图级钩子筛图层

地图级钩子挂在 `map` 上，仍然是一个地图一个实例。但 `IGameMapHooks.onResizeLayer(layer, width, height)` 会收到<strong>该地图每个图层</strong>的尺寸变化——事件来自多个图层，对象却只有一个。这种回调里要自己筛掉不关心的图层：

```ts
import { IGameMapHooks, IMapLayer } from '@user/data-base';
import { ICoreState } from '@user/data-state';

// 地图级钩子：一个地图一个实例，回调里自己筛图层
export class TargetLayerResizeHooks implements IGameMapHooks {
    constructor(
        readonly state: ICoreState,
        // 注册时传入的目标图层，用来和回调参数比较
        readonly targetLayer: IMapLayer
    ) {}

    onResizeLayer(layer: IMapLayer, width: number, height: number): void {
        // 只处理目标图层；其它图层直接返回
        if (layer !== this.targetLayer) return;
        this.state.emitTip(`目标图层尺寸：${width} x ${height}`);
    }
}
```

注册到 `map`，不是 `layer`：

```ts
import { ICoreState } from '@user/data-state';
import { TargetLayerResizeHooks } from './target-layer-resize-hooks';

// 注册到 map，不是 layer
export function registerTargetLayerHooks(state: ICoreState): void {
    const map = state.maps.getMap('floor-1');
    if (!map) {
        state.emitTip('floor-1 尚未构造，钩子未注册');
        return;
    }
    const targetLayer = [...map.layerList].find(v => v.alias === 'ground');
    if (!targetLayer) {
        state.emitTip('ground 图层不存在');
        return;
    }

    map.addHook(new TargetLayerResizeHooks(state, targetLayer));
}
```

这里的比较用对象引用（`===`）。`onResizeLayer` 能拿到 layer，是因为 `GameMap.addLayer` 给每个图层装了内部转发器，把图层的 `onResize` 转发到地图级钩子并带上具体图层。调用 `map.resizeLayer(30, 30, true)` 时每个图层都会触发一次，你的处理只应在目标图层上生效。

## 注册与移除

`addHook` 会创建控制器、把钩子写入内部映射与列表、调用 `awake`，最后返回控制器。控制器最重要的方法是 `unload()`：

```ts
import { IMapLayerHookController } from '@user/data-base';

// 保存注册时返回的控制器，之后需要撤掉时调用
export function removeGroundBlockHooks(
    controller: IMapLayerHookController
): void {
    controller.unload();
}
```

几条接口事实：

- `awake` 在钩子加入「已加载列表」之前调用，而 `forEachHook` 只遍历已加载列表。所以在 `awake` 里由其它代码触发的事件不会回调到自己；需要初始同步就直接在 `awake` 里做。
- `removeHook(hook)` 按对象引用查找，必须传注册时的<strong>同一个实例</strong>。传一个新建的同字段实例不会匹配，也不会报错。
- `addHook` 不去重。同一个实例注册两次会得到两个控制器、两条记录，实例被调用两次；第二次还会覆盖「实例到记录」的映射，第一次的记录之后很难按实例清理。一个实例只注册一次。
- `forEachHook` 的执行顺序不保证。需要顺序时，把步骤写进同一个钩子内部按 `await` 串行。
- 移除钩子时会调用 `destroy(controller)`，适合清理定时器与外部监听器。
- `GameMap.removeLayer(layer)` 会移除图层并卸载它为图层创建的内部转发器，但<strong>不会</strong>卸载你自己挂在图层上的钩子，也不会调用它们的 `destroy`。要释放资源，自己保存控制器并显式 `unload()`。

## 异步钩子

钩子分同步与异步两类。异步钩子返回 `Promise`，引擎会把本次触发的返回值收集起来，用 `Promise.all` 并发等待：

| 钩子族                | 返回 `Promise` 的方法                                  | 引擎如何等待                                                     |
| --------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `IObjectMoverHooks`   | `onMoveStart`、`onMoveEnd`、`onStepStart`、`onStepEnd` | 移动流程里用 `Promise.all` 等待                                  |
| `IMapLayerHooks`      | `onOpenDoor`、`onCloseDoor`、`onDeleteDynamic`         | `openDoor` / `closeDoor` / `deleteDynamic` 用 `Promise.all` 等待 |
| `IHeroStateHooks`     | `onBeforeChangeFloor`、`onAfterChangeFloor`            | `changeFloor` 用 `Promise.all` 等待                              |
| `ICombatFlowHooks`    | `onBeforeCombat`、`onAfterCombat`                      | 战斗流程用 `Promise.all` 等待                                    |
| `IReplaySandboxHooks` | `onStep`                                               | 播放与单步流程用 `Promise.all` 等待                              |

其余常用钩子，例如 `IMapLayerHooks.onUpdateBlock`、`IHeroLocationHooks.onSetPos`、`IGameEventExecutorHooks` 的事件前后钩子，都是同步的。

`Promise.all` 只保证「本次触发的所有异步钩子都完成」，不保证谁先完成。注册顺序与 `forEachHook` 的遍历顺序，都不能决定异步完成顺序。确实需要顺序时，把有依赖的步骤写进<strong>同一个钩子</strong>按 `await` 串行；战斗场景改用带 `priority` 的战斗脚本（细节见 `高级教程 II · 战斗脚本与优先级`）。不要试图在多个独立钩子之间约定顺序，钩子没有跨实例的优先级接口。

`onDeleteDynamic` 只在 `deleteDynamic` 这条异步删除路径上被 `Promise.all` 等待；`toStatic` 是同步转换，那里触发的 `onDeleteDynamic` 不会等待返回值。

> 钩子在系统级流程中如何被消费、跨系统如何安排优先级，属于 `高级教程 II · 系统级实现`；钩子调度的底层原理属于 `高级教程 III · 架构原理`。本篇只写你能直接使用的那一层。

<!-- TODO(advanced-II): 钩子的系统级消费与优先级 -->
<!-- TODO(advanced-III): 钩子调度原理 -->

## 边界与注意

- <strong>把地图级钩子挂到图层上</strong>。`layer.addHook` 接收的是 `IMapLayerHooks`，地图级方法名对不上，永远不会被调用；反过来把图层钩子挂到地图上也不会收到图层事件。
- <strong>把同一个实例注册到多个对象</strong>。接口允许，但不建议；除非你明确了解钩子的内部实现与后果，否则回调里区分触发者、共享状态带来的问题都会由你自己承担。
- <strong>重复注册同一个实例</strong>。`addHook` 不去重，实例会被多次调用，旧控制器还留在内部列表里。
- <strong>移除时 new 了一个新实例</strong>。`removeHook` 按引用查找，新实例不会匹配，也不会报错；保存注册时的实例或控制器。
- <strong>在 awake 里等自己触发的事件</strong>。`awake` 调用时钩子还不在已加载列表里，`forEachHook` 遍历不到它。
- <strong>依赖异步钩子的顺序</strong>。引擎用 `Promise.all` 并发等待，完成顺序不等于注册顺序。
- <strong>以为移除图层会顺带清理自己的钩子</strong>。`removeLayer` 只卸载内部转发器，你自己挂的钩子要显式 `unload()`。

## 小结

- 建议一个对象一个钩子实例：实例注册到哪个对象，就只服务那个对象。共享允许但不建议，除非明确了解内部实现与后果。
- 参数里没有图层身份的钩子（如 `onUpdateBlock`）靠注册位置限定；地图级钩子收到多图层事件时，用 `===` 比较回调传来的对象。
- `addHook` 返回控制器，`removeHook` 要传原实例；`awake` 在加入已加载列表前调用，`destroy` 在移除时调用。
- `addHook` 不去重，`forEachHook` 顺序不保证，异步钩子用 `Promise.all` 并发等待。

返回[高级 I 导览](./index.md)。
