# 钩子深入

中级教程的[钩子](../intermediate/hooks.md)篇回答的是「什么需求该用哪个钩子」；这一篇回答另一个问题：当同一个钩子类被多个地图、多个图层、多个移动器触发时，你怎么知道这次回调是不是你关心的那个对象。

钩子本身不难，难在<strong>身份</strong>。一张地图有多个图层，一个楼层集合里又有多张地图；给其中一个图层挂的钩子，不会自动只对那个图层生效，除非你在注册方式或回调里把身份限定住。限定错了，效果就会加到别的楼层或图层上。

阅读前需要会基础语法：`class`、`new`、`import`、`async` / `await`。本篇只讲数据端，示例都按当前源码里的接口书写。

## 钩子挂在实例上

一个钩子类只是模板。真正参与事件的是你用 `new` 创建出来的<strong>实例</strong>，以及它被注册到的那个主对象实例。

`Hookable` 的钩子列表是实例字段：每个地图、每个图层、每个移动器各自持有一份，而不是整个类共享一份。因此：

- 同一个钩子类可以 `new` 出很多个实例，分别注册到不同对象；
- 给图层 A 注册的钩子，不会出现在图层 B 上；
- 同一个实例也可以注册到多个对象，但这时它必须能在回调里区分身份，否则就会串。

以图层为例，`GameMap.addLayer(alias)` 每次调用都会创建一个新的 `MapLayer`。同一张地图的 `ground` 与 `wall` 是两个不同的 `MapLayer` 实例，各自有独立的钩子列表。地图对象本身也是 `Hookable`，它的钩子列表与图层完全分开。

这也是为什么「给地图加钩子」和「给图层加钩子」不能混：它们接收的是两套不同的接口，事件也从不同的对象发出。

## 多对象场景

先看几种容易出错的组合：

| 场景                   | 实际存在的对象                                      |
| ---------------------- | --------------------------------------------------- |
| 一张地图有多个图层     | 每个图层一个 `MapLayer`，各自独立                   |
| 楼层集合里有多张地图   | 每张地图一个 `IGameMap`，各自独立                   |
| 场上有多个动态图块     | 每个动态图块一个 `IDynamicTile`，各自带一个 `mover` |
| 勇士与动态图块同时存在 | 勇士的移动器与图块的移动器是不同实例                |
| 同一楼层 id 被重新创建 | 旧引用与新引用是两个 `IGameMap`，名字相同但引用不同 |

钩子被触发，只能说明「它所属的实例发生了事件」，不能说明那就是你想要的那个实例。比如地图级钩子的 `onResizeLayer(layer, width, height)` 会收到该地图每个图层的尺寸变化；如果你不比较 `layer`，就会对每个图层都执行一次。

地图与图层之间还有一层内部转发：`GameMap.addLayer` 会为每个图层注册一个 `StateMapLayerHook`，把图层的 `onResize` 转发到地图的 `onResizeLayer`，并带上具体 `layer`。所以地图级钩子能拿到图层身份；图层级钩子的大多数回调参数里没有 layer，只有动态图块方法能通过 `tile.layer` 间接拿到。

## 身份从哪里来

判断能不能在回调里做身份校验，先看这个钩子族有没有把身份传回来：

| 钩子族                                                                           | 回调里能拿到的身份                        | 能否直接比较                                   |
| -------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `IMapLayerHooks.onResize` / `onUpdateArea` / `onUpdateBlock`                     | 没有 layer 参数，只有尺寸、区域或图块坐标 | 不能                                           |
| `IMapLayerHooks.onOpenDoor` / `onCloseDoor`                                      | 没有 layer 参数，只有门的位置或图块数字   | 不能                                           |
| `IMapLayerHooks.onCreateDynamic` / `onDeleteDynamic` / `onUpdateDynamicPosition` | `tile`，而 `tile.layer` 是它所属的图层    | 可以比较 `tile.layer`                          |
| `IGameMapHooks.onChangeBackground`                                               | 只有背景图块数字                          | 不能判断是哪张地图                             |
| `IGameMapHooks.onUpdateLayer`                                                    | `layerList`，当前地图的图层集合           | 只能看集合内容，不能直接判断是哪张地图触发     |
| `IGameMapHooks.onResizeLayer`                                                    | `layer`、宽度、高度                       | 可以比较 `layer`；`layer.map` 还能拿到所属地图 |
| `IObjectMoverHooks` 的各方法                                                     | `tile` 与 `mover`                         | 可以比较 `tile` 或 `mover`                     |
| `IHeroLocationHooks.onSetFloor`                                                  | `map`，即设置后的楼层对象                 | 可以比较 `map`                                 |
| `IHeroLocationHooks.onSetPos`                                                    | 只有坐标                                  | 不能；但勇士位置通常只有一个                   |
| `IHeroStateHooks.onBeforeChangeFloor` / `onAfterChangeFloor`                     | `info`，其中 `info.target` 是目标楼层     | 可以比较 `info.target`                         |

这张表决定了两种做法：没有身份参数的钩子，只能靠「每个对象一个实例」把身份固定在注册处；有身份参数的钩子，才可以共享一个实例，在回调里用 `===` 比较。

### 不要用 alias 判断身份

`alias` 是图层的查找名，不是身份。两张不同的地图可以有同名图层；同一张地图上重复调用 `addLayer('ground')` 也会再建一个图层，并覆盖 `aliasLayerMap` 里的映射。用 `layer.alias === 'ground'` 只能说明「名字叫 ground」，不能说明「就是当初那个图层对象」。

要判断身份，用对象引用：`layer === this.targetLayer`、`map === this.targetMap`、`tile === this.targetTile`。引用比较不受重名影响。

## 做法 A：每个对象一个钩子实例

这是图层钩子的默认做法，也是最不容易出错的做法。

构造钩子时把目标对象保存为字段，注册时只注册到那个对象上。以图层为例，构造时保存 `readonly layer`：

```ts
// [模板] 每层一个实例的图层钩子
export class MyLayerHooks implements IMapLayerHooks {
    constructor(
        readonly state: ICoreState,
        readonly layer: IMapLayer
    ) {}

    // [需改] 这个方法没有 layer 参数；触发者就是注册时的 this.layer
    onUpdateBlock(block: number, x: number, y: number): void {
        // 只在这个图层上做事
    }

    // [需改] 动态图块钩子会回传 tile，可以再核对一次
    onCreateDynamic(tile: IDynamicTile): void {
        if (tile.layer !== this.layer) return;
        // 只处理目标图层上的动态图块
    }
}
```

注意 `onUpdateBlock` 的签名里没有 `layer`。所以不要在里面写 `if (layer !== this.layer) return`，那个 `layer` 根本不存在。这个实例只注册在 `this.layer` 上，触发者必然是它；身份在注册时就确定了。

`readonly layer` 的作用是让钩子能访问目标图层本身，例如读宽高、调用图层方法，或者在动态图块回调里核对 `tile.layer`。它不是用来比较一个不存在的参数。

如果钩子是通用的、构造时还拿不到图层，可以利用 `awake` 收到的控制器。`MapLayer` 的控制器是 `IMapLayerHookController`，带 `layer` 字段与 `getMapData()`：

```ts
// [模板] 在 awake 里取得所属图层
awake(controller: IMapLayerHookController): void {
    // controller.layer 就是注册这个钩子的图层
}
```

这种做法适合「先写一个通用钩子类，注册到哪一层就服务哪一层」的工厂。无论用哪种方式，核心都是：<strong>一个实例只服务一个对象</strong>。

## 做法 B：共享实例，用 `===` 比较

如果钩子回调会回传身份，可以只创建一个实例，注册到多个对象，在回调里筛掉不关心的触发者。

例如地图级钩子 `IGameMapHooks.onResizeLayer(layer, width, height)` 会收到该地图所有图层的 resize。共享实例时，构造时保存目标图层 `targetLayer`：

```ts
// [模板] 共享实例：在回调里比较目标图层
export class MyMapResizeHooks implements IGameMapHooks {
    constructor(
        readonly state: ICoreState,
        readonly targetLayer: IMapLayer
    ) {}

    onResizeLayer(layer: IMapLayer, width: number, height: number): void {
        // [需改] 只处理目标图层；其他图层直接返回
        if (layer !== this.targetLayer) return;

        this.state.emitTip(`目标图层变为 ${width} x ${height}`);
    }
}
```

同样的思路可以用于：

- `IHeroLocationHooks.onSetFloor(map)`：比较 `map`；
- `IObjectMoverHooks` 的 `onMoveStart` / `onStepEnd` 等：比较 `tile` 或 `mover`；
- `IHeroStateHooks.onBeforeChangeFloor` / `onAfterChangeFloor`：比较 `info.target`；
- `IMapLayerHooks` 的动态图块方法：比较 `tile.layer`。

但 `IMapLayerHooks` 的 `onResize`、`onUpdateBlock`、`onOpenDoor` 等方法没有 layer 参数，不能用这种做法。它们必须走做法 A。

### 共享实例不要保存「当前对象」

共享实例只适合保存<strong>固定的目标</strong>，例如 `targetLayer`、`targetTile`。不要保存「当前正在处理的对象」：

```ts
// 不要这样：共享实例里保存“当前对象”
onResizeLayer(layer: IMapLayer): void {
    this.currentLayer = layer;
    // 后续异步逻辑再读 this.currentLayer
}
```

异步钩子可能交错执行：A 图层的事件还没处理完，B 图层的事件已经进来，`currentLayer` 会被覆盖。需要当前对象时，用回调参数或局部变量；需要跨异步步骤保留，就在回调开头把它存进局部常量。

## 同一钩子被多个对象复用

「能共享」不等于「应该共享」。按钩子族分开看：

| 钩子族                                  | 能否共享一个实例 | 条件                                                         |
| --------------------------------------- | ---------------- | ------------------------------------------------------------ |
| `IMapLayerHooks`（无 layer 参数的方法） | 不能             | 回调无法区分图层，必须每层一个实例                           |
| `IMapLayerHooks`（动态图块方法）        | 可以             | 回调里比较 `tile.layer`                                      |
| `IGameMapHooks.onResizeLayer`           | 可以             | 回调里比较 `layer`                                           |
| `IGameMapHooks.onChangeBackground`      | 不建议           | 回调没有地图身份；跨地图共享会分不清是谁的背景变化           |
| `IGameMapHooks.onUpdateLayer`           | 不建议           | 只有图层集合，无法可靠判断是哪张地图触发                     |
| `IObjectMoverHooks`                     | 可以             | 回调里比较 `tile` 或 `mover`；若每个对象有独立状态则不要共享 |
| `IHeroLocationHooks.onSetFloor`         | 可以             | 回调里比较 `map`                                             |
| `IHeroStateHooks`（切层钩子）           | 可以             | 回调里比较 `info.target`；若只服务一个勇士则无需共享         |

如果钩子内部要为每个对象保存不同状态（计数、上次位置、临时标记），即使接口允许共享，也建议每对象一个实例。共享实例的字段只有一份，很难避免互相覆盖。

为多个对象创建实例时，用一个工厂把「创建 + 注册」收在一起，避免漏注册或注册到错误对象：

```ts
// [模板] 为每个图层各建一个实例
function addLayerHook(state: ICoreState, layer: IMapLayer) {
    return layer.addHook(new MyLayerHooks(state, layer));
}
```

调用方对每个目标图层调用一次即可。不要在事件回调里临时 `new` 钩子再注册；那样每次事件都会多一个钩子，且旧钩子很难清理。

## 注册、移除与生命周期

### addHook 返回控制器

`addHook` 会创建控制器、把钩子写入内部映射与列表、调用 `awake`，最后返回控制器：

```ts
// [模板] 注册并保留控制器
const hook = new MyLayerHooks(state, layer);
const controller = layer.addHook(hook);
```

控制器最重要的方法是 `unload()`，它会按控制器移除对应钩子。对图层来说，控制器还带 `layer` 与 `getMapData()`，可以在 `awake` 或后续逻辑里使用。

### awake 在加入已加载列表之前

`addHook` 的调用顺序是：

1. 创建控制器；
2. 写入映射与钩子列表；
3. 调用 `hook.awake(controller)`；
4. 把钩子加入已加载列表；
5. 返回控制器。

`forEachHook` 只遍历已加载列表。因此，在 `awake` 内部由其他代码触发的事件，不会回调到这个钩子——它还没进已加载列表。需要在启动时同步一次状态，就在 `awake` 里直接做，不要指望「在 `awake` 里调用 `setBlock` 会触发自己的 `onUpdateBlock`」。

### 移除需要原实例

`removeHook(hook)` 按钩子对象的引用查找。传入注册时的**同一个实例**才会移除；传一个新建的、字段相同的实例不会匹配，也不会报错：

```ts
// 正确：传回注册时的实例
layer.removeHook(hook);

// 也可以：用注册时返回的控制器卸载
controller.unload();
```

```ts
// 错误：这是一个新实例，removeHook 找不到它
layer.removeHook(new MyLayerHooks(state, layer));
```

移除时会调用钩子的 `destroy(controller)`，适合清理定时器、外部监听器等资源。`destroy` 与 `awake` 都收到控制器，可以在这里读取所属对象。

### forEachHook 的顺序不保证

引擎文档明确写了 `forEachHook` 的执行顺序不固定。不要把「我先注册，所以先执行」当成契约。需要固定顺序时，把步骤写进同一个钩子内部按 `await` 串行，或改用本身带顺序语义的机制；不要依赖多个钩子的注册顺序。

### 同一实例重复注册

`addHook` 不会去重。对同一个实例调用两次，会创建两个控制器、两条内部记录；结果是这个实例被调用两次，而且第一次的控制器仍然留在内部映射里：

```ts
// 不要这样：同一个实例注册两次
layer.addHook(hook);
layer.addHook(hook);
```

第二次注册会覆盖 `hookMap` 里「实例到记录」的映射，但第一次的记录仍在已加载列表里。之后 `removeHook(hook)` 只会移除第二次的记录；如果你没有保存第一次返回的控制器，第一次的记录就很难再按实例清理。这是 `addHook` 的行为事实，不是引擎缺陷；按「每个实例只注册一次」使用即可。

### 图层移除会卸载内部转发器

`GameMap.removeLayer(layer)` 会移除图层，并卸载 `addLayer` 时为它创建的内部 `StateMapLayerHook`。因此图层移除后，地图级钩子不会再收到这个图层的 resize。你自己挂在图层上的钩子会随图层对象一起失去作用；如果还持有控制器，也可以显式 `unload()`。

## 异步钩子

钩子分同步与异步两类。同步钩子在触发时立即执行；异步钩子返回 `Promise`。在本篇列出的异步钩子族里，引擎会把本次触发的返回值收集起来，用 `Promise.all` 并发等待。

本篇核对过的异步钩子族：

| 钩子族                | 返回 `Promise` 的方法                                  | 引擎如何等待                                                     |
| --------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `IObjectMoverHooks`   | `onMoveStart`、`onMoveEnd`、`onStepStart`、`onStepEnd` | 移动流程里用 `Promise.all` 等待                                  |
| `IMapLayerHooks`      | `onOpenDoor`、`onCloseDoor`、`onDeleteDynamic`         | `openDoor` / `closeDoor` / `deleteDynamic` 用 `Promise.all` 等待 |
| `IHeroStateHooks`     | `onBeforeChangeFloor`、`onAfterChangeFloor`            | `changeFloor` 用 `Promise.all` 等待                              |
| `ICombatFlowHooks`    | `onBeforeCombat`、`onAfterCombat`                      | 战斗流程用 `Promise.all` 等待                                    |
| `IReplaySandboxHooks` | `onStep`                                               | 播放与单步流程用 `Promise.all` 等待                              |

其余常用钩子，例如 `IMapLayerHooks.onUpdateBlock`、`IHeroLocationHooks.onSetPos`、`IGameEventExecutorHooks` 的事件前后钩子，都是同步的，触发时立即执行。

`Promise.all` 只保证「本次触发的所有异步钩子都完成」，不保证谁先完成。注册顺序、`forEachHook` 的遍历顺序，都不能决定异步完成顺序。两个钩子都实现 `onStepEnd` 时，一个内部 `await` 了 100ms，另一个没有等待，后者会先兑现；这并不表示引擎把后者排在了前面。

确实需要顺序时：

- 把有先后依赖的步骤写进<strong>同一个钩子</strong>，在方法体里按 `await` 串行；
- 战斗场景改用带 `priority` 的战斗脚本，脚本会按优先级依次执行（细节见 `高级教程 II · 战斗脚本与优先级`）；
- 不要试图在多个独立钩子之间约定顺序，钩子没有跨实例的优先级接口。

这里有一处容易忽略的细节：`onDeleteDynamic` 在 `deleteDynamic` 这条异步删除路径上会被 `Promise.all` 等待；但 `toStatic` 是同步转换，那里触发的 `onDeleteDynamic` 不会等待返回值。不要把「声明为异步」误当成「所有调用路径都会等它」。

> 钩子在系统级流程中如何被消费、跨系统如何安排优先级，属于 `高级教程 II · 系统级实现`；钩子调度的底层原理属于 `高级教程 III · 架构原理`。本篇只写你能直接使用的那一层。

<!-- TODO(advanced-II): 钩子的系统级消费与优先级 -->
<!-- TODO(advanced-III): 钩子调度原理 -->

## 模板：一个带身份校验的钩子

<strong>目标</strong>：每层一个钩子实例，只对目标图层做事；如果回调回传了图块，再额外核对一次所属图层。

<strong>改哪里</strong>：`src/data/hook/` 下的现有钩子文件，或你自己的插件文件；类写好后，在能拿到目标图层的时机注册。

<strong>复制什么</strong>：下面是机制本身的通用骨架，复制后按 `[需改]` 修改。它不是某个具体效果的完整实现。

```ts
// [模板] 每层一个实例的图层钩子
export class MyLayerHooks implements IMapLayerHooks {
    constructor(
        readonly state: ICoreState,
        readonly layer: IMapLayer
    ) {}

    // [需改] 没有 layer 参数；触发者就是 this.layer
    onUpdateBlock(block: number, x: number, y: number): void {
        // 在这里做事
    }

    // [需改] 动态图块回调回传 tile，可再核对 tile.layer
    onCreateDynamic(tile: IDynamicTile): void {
        if (tile.layer !== this.layer) return;
        // 在这里做事
    }
}
```

<strong>改什么</strong>：

1. 类名 `MyLayerHooks` 换成你的名字；
2. `readonly layer` 保留，构造时传入目标图层；
3. 方法体换成你的处理；
4. 如果目标钩子不回传身份，不要把这个实例共享给多个图层，改为每层 `new` 一个。

<strong>怎么验证</strong>：见下面的「只处理指定图层」；核心是改目标图层会触发、改别的图层不触发。

<strong>注意</strong>：`readonly layer` 不是为了在 `onUpdateBlock` 里比较一个不存在的参数。身份来自「这个实例注册在哪个图层上」；动态图块方法里的 `tile.layer` 才是额外的运行时校验。

## 示例：只处理指定图层

<strong>目标</strong>：只对 `floor-1` 的 `ground` 图层响应图块更新，其他图层的变化不处理。

<strong>改哪里</strong>：在能拿到 `state` 与目标图层的时机注册，例如插件的 `afterLoad` 中；下面的片段省略了外层函数或方法，`return` 需要放在函数体内。

<strong>复制什么</strong>：

```ts
// [需改] 类名、提示内容
class GroundBlockHooks implements IMapLayerHooks {
    constructor(
        readonly state: ICoreState,
        readonly layer: IMapLayer
    ) {}

    onUpdateBlock(block: number, x: number, y: number): void {
        this.state.emitTip(`ground 图层更新：(${x}, ${y}) -> ${block}`);
    }
}

// [模板] 取楼层、取图层、注册
const map = state.maps.getMap('floor-1');
if (!map) return;
const layer = [...map.layerList].find(l => l.alias === 'ground');
if (!layer) return;

const hook = new GroundBlockHooks(state, layer);
const controller = layer.addHook(hook);
```

<strong>改什么</strong>：

- `'floor-1'` 换成你的楼层 id；
- `'ground'` 换成目标图层 alias；
- 提示内容换成你的处理；
- `layer.addHook(hook)` 的目标必须是 `layer`，不是 `map`。

<strong>怎么验证</strong>：

1. 对目标图层调用 `layer.setBlock(1, 0, 0)`，换一个与原来不同的图块数字，提示应出现；
2. 从 `map.layerList` 里取另一个图层，调用它的 `setBlock(1, 0, 0)`，提示不应出现；
3. 调用 `controller.unload()`，再改目标图层，提示不应再出现。

<strong>注意</strong>：`onUpdateBlock` 只在图块数字真的变化时触发；设置成相同数字不会触发。不要用 `alias` 当身份，也不要把同一个钩子实例注册到所有图层。

## 示例：地图级钩子里筛图层

<strong>目标</strong>：在地图级 `onResizeLayer` 里只处理目标图层。地图级钩子会收到该地图所有图层的尺寸变化，必须自己筛。

<strong>改哪里</strong>：在能拿到 `map` 与目标图层的时机注册；这次注册到 `map`，不是 `layer`。

<strong>复制什么</strong>：

```ts
// [需改] 类名与处理逻辑
class TargetLayerResizeHooks implements IGameMapHooks {
    constructor(
        readonly state: ICoreState,
        readonly targetLayer: IMapLayer
    ) {}

    onResizeLayer(layer: IMapLayer, width: number, height: number): void {
        if (layer !== this.targetLayer) return;
        this.state.emitTip(`目标图层尺寸：${width} x ${height}`);
    }
}

// [模板] 取目标图层并注册到地图
const map = state.maps.getMap('floor-1');
if (!map) return;
const targetLayer = [...map.layerList].find(l => l.alias === 'ground');
if (!targetLayer) return;

map.addHook(new TargetLayerResizeHooks(state, targetLayer));
```

<strong>改什么</strong>：楼层 id、图层 alias、比较字段与提示内容。比较必须用 `layer !== this.targetLayer`，不要用 `layer.alias`。

<strong>怎么验证</strong>：调用 `map.resizeLayer(30, 30, true)`（换一个与当前不同的尺寸）。该地图的每个图层都会触发一次 `onResizeLayer`，但提示只应出现一次，且宽高是目标图层的新尺寸。把 `targetLayer` 换成另一个图层，提示应对应另一层。

<strong>注意</strong>：`onResizeLayer` 能拿到 layer，是因为 `GameMap.addLayer` 给每个图层装了内部转发器；`onChangeBackground` 没有地图参数，跨地图共享实例时无法判断是谁的背景变化。地图级钩子建议每张地图一个实例，除非你只使用带身份参数的方法。

## 改内置还是自己写

如果你只是给现有系统加行为，先看 `src/data/hook/*` 里已经注册的类。它们已经在 `src/data/hook/initialize.ts` 的 `initializeHooks` 中 `addHook`，改方法体即可，不需要自己写类，也不需要再注册。

地图与图层没有对应的内置 `src/data/hook` 类；这类需求需要自己写一个小类。把类写小：只做身份限定与转发，真正的系统逻辑放进插件或独立系统，不要让钩子类承担一整套功能。

如果这是一整套新系统，优先通过插件实现（见[插件系统](./plugin-system.md)），钩子在事件发生时调用它。这样新增逻辑留在 `src` 里，升级内置包时要跟的差异更少。

<strong>如果你不怎么懂代码，建议直接改内置钩子，而不是自己写新的类。</strong>内置类已经注册好，改方法体就能生效；自己写类还要处理身份、注册时机与移除，排查面更大。

## 常见错误

- <strong>把地图级钩子挂到图层上</strong>。`layer.addHook` 接收的是 `IMapLayerHooks`，地图级方法名对不上，永远不会被调用。反过来，把图层钩子挂到地图上也不会收到图层事件。
- <strong>用 alias 判断身份</strong>。alias 只是查找名，不同地图可以重名，重复 `addLayer` 还会覆盖映射。身份用对象引用比较。
- <strong>共享实例却保存当前对象</strong>。异步钩子交错时，后一个对象会覆盖前一个对象的值。共享实例只保存固定的目标字段。
- <strong>重复注册同一个实例</strong>。`addHook` 不去重，同一实例会被多次调用，旧控制器还留在内部列表里。每个实例只注册一次。
- <strong>依赖异步钩子的顺序</strong>。引擎用 `Promise.all` 并发等待，完成顺序不等于注册顺序。需要顺序就把步骤放进同一个钩子串行。
- <strong>在 awake 里等自己触发的事件</strong>。`awake` 调用时钩子还没加入已加载列表，`forEachHook` 不会遍历到它。初始同步直接在 `awake` 里做。
- <strong>移除时 new 了一个新实例</strong>。`removeHook` 按引用查找，新实例不会匹配，也不会报错；保存注册时的实例或控制器。

## 怎么验证

<strong>第一项：确认图层隔离</strong>。按「只处理指定图层」注册后，分别修改目标图层与另一个图层。目标图层应有提示，另一个图层不应有。把钩子注册到另一个图层，现象应对调。

<strong>第二项：确认地图级筛选</strong>。按「地图级钩子里筛图层」注册后，调用 `map.resizeLayer` 改一次尺寸。地图级钩子会对每个图层触发，但你的处理只应对目标图层生效。把比较条件删掉，提示会变成每个图层一次——这能反过来证明筛选确实在起作用。

<strong>第三项：确认移除生效</strong>。保存 `addHook` 返回的控制器，调用 `controller.unload()`，再触发同一事件，处理不应再执行。也可以改用 `removeHook(原实例)`，效果应一致；传一个新实例则不应生效。

<strong>第四项：确认异步完成顺序不等于注册顺序</strong>。注册两个都实现 `onStepEnd` 的异步钩子：第一个内部延迟 100ms，第二个不延迟。故意把慢的注册在前面，移动一步后，快的应先提示。这个现象只说明 `Promise.all` 并发等待，不说明引擎按注册顺序执行。

## 小结

- 钩子挂在**实例**上，不挂在类上；同一个类可以服务多个对象，但每个对象的钩子列表独立。
- 没有身份参数的钩子（如 `IMapLayerHooks.onUpdateBlock`）必须每对象一个实例；有身份参数的钩子（如 `onResizeLayer`、`IObjectMoverHooks`）才能共享实例并用 `===` 比较。
- 不要用 alias 判断身份；对象引用才唯一。
- `addHook` 返回控制器，`removeHook` 要传原实例，控制器可 `unload`；`awake` 在加入已加载列表前调用，`destroy` 在移除时调用。
- `addHook` 不去重，`forEachHook` 顺序不保证，异步钩子用 `Promise.all` 并发等待。

返回[高级 I 导览](./index.md)。
