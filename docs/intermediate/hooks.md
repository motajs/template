# 钩子

游戏里的某个动作发生时——勇士属性变了、战斗开始了、门被推开了——你希望「顺手做点什么」，但又不想去改引擎本身的代码。钩子（hook）就是为此准备的：它是本引擎提供的「事件订阅」机制。动作发生，主对象会依次通知挂在它上面的钩子；你把想做的事写进钩子方法，就能在正确的时机介入。

## 钩子是什么

在数据端，勇士、地图、战斗流程等主对象在发生关键动作时，会依次调用自己身上每个钩子的对应方法。于是你只需要写一个钩子类、把它注册到关心的主对象上，就能在这些动作发生时收到通知。

一个钩子就是一个**类**：类里实现某个钩子族接口的方法，**「什么时候」由方法名决定，「做什么」由方法体决定**。例如想在勇士属性变化时做点什么，就实现 `IHeroAttributeHooks` 的 `onUpdateAttribute`：

```ts
// [模板] 钩子类：implements 后面写钩子族接口
export class MyHeroAttributeHooks implements IHeroAttributeHooks<IHeroAttr> {
    // [模板] 构造函数里保存 state，方法体里才能取到数据端主对象
    constructor(readonly state: ICoreState) {}

    // [需改] 方法体换成你要做的事
    onUpdateAttribute<K extends keyof IHeroAttr>(
        name: K,
        value: IHeroAttr[K]
    ): void {
        // 当勇士的某个属性变化时执行
    }
}
```

引擎里的内置钩子也是这样的类，例如 `src/data/hook/hero.ts` 的 `MainHeroAttributeHooks`；它们的实例在 `src/data/hook/initialize.ts` 里统一注册。日常改内置钩子时，不需要自己写上面这个类，改内置类的方法体即可（见下文「改内置钩子」）。

## 常用钩子族一览

「钩子族」是同一类钩子方法的集合（一个 `interface`）。常用的几族如下，方法名以源码为准：

| 钩子族                          | 所属主对象     | 主要方法                                                                                                                                  |
| ------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `IDataCommonHooks`              | 数据端公共对象 | `onTip`                                                                                                                                   |
| `IHeroAttributeHooks`           | 勇士属性       | `onUpdateAttribute`                                                                                                                       |
| `IHeroLocationHooks`            | 勇士位置       | `onSetPos`、`onSetFloor`                                                                                                                  |
| `IHeroStateHooks`               | 勇士状态       | `onBeforeChangeFloor`、`onAfterChangeFloor`                                                                                               |
| `IEquipmentStateHooks`          | 装备           | `onChangeModifier`                                                                                                                        |
| `IHeroFollowersControllerHooks` | 勇士跟随者     | `onAddFollower`、`onRemoveFollower`、`onGatherFollowers`                                                                                  |
| `IObjectMoverHooks`             | 移动器         | `onMoveStart`、`onMoveEnd`、`onStepStart`、`onStepEnd`、`onSetPos`、`onSetFaceDir`、`onSetMoveDir`                                        |
| `ICombatFlowHooks`              | 战斗流程       | `onBeforeCombat`、`onAfterCombat`                                                                                                         |
| `IGameEventExecutorHooks`       | 事件执行器     | `onBeforeExecuteEvent`、`onAfterExecuteEvent`                                                                                             |
| `IPathfindingSystemHooks`       | 寻路系统       | `onBeforeTeleportTo`、`onAfterTeleportTo`                                                                                                 |
| `IMapLayerHooks`                | 地图图层       | `onResize`、`onUpdateArea`、`onUpdateBlock`、`onOpenDoor`、`onCloseDoor`、`onCreateDynamic`、`onDeleteDynamic`、`onUpdateDynamicPosition` |
| `IGameMapHooks`                 | 地图           | `onChangeBackground`、`onUpdateLayer`、`onResizeLayer`                                                                                    |
| `IReplaySystemHooks`            | 录像系统       | `onCreateSandbox`、`onRecordCommand`                                                                                                      |
| `IReplaySandboxHooks`           | 录像沙盒       | `onStep`、`onSpeedSet`、`onStartReplay`、`onStopReplay`、`onPauseReplay`、`onResumeReplay`                                                |

## 需求 → 钩子对照表

真要动手时，多半是先有一个需求、再去找它对应哪个钩子。下表把常见需求和对应的钩子方法列在一起，照着找即可：

| 需求                         | 对应钩子                                                                    |
| ---------------------------- | --------------------------------------------------------------------------- |
| 勇士属性变化时做点事         | `IHeroAttributeHooks.onUpdateAttribute`                                     |
| 勇士被设置坐标或切换楼层     | `IHeroLocationHooks.onSetPos` / `onSetFloor`                                |
| 勇士移动开始、结束或每走一步 | `IObjectMoverHooks.onMoveStart` / `onMoveEnd` / `onStepStart` / `onStepEnd` |
| 切换楼层前后做过渡处理       | `IHeroStateHooks.onBeforeChangeFloor` / `onAfterChangeFloor`                |
| 战斗前或战斗后介入           | `ICombatFlowHooks.onBeforeCombat` / `onAfterCombat`                         |
| 事件执行前后介入             | `IGameEventExecutorHooks.onBeforeExecuteEvent` / `onAfterExecuteEvent`      |
| 地图图块被修改、区域被更新   | `IMapLayerHooks.onUpdateBlock` / `onUpdateArea`                             |
| 开门或关门时做点什么         | `IMapLayerHooks.onOpenDoor` / `onCloseDoor`                                 |
| 动态图块被创建或删除         | `IMapLayerHooks.onCreateDynamic` / `onDeleteDynamic`                        |
| 装备的修饰器发生变化         | `IEquipmentStateHooks.onChangeModifier`                                     |
| 瞬移寻路前后介入             | `IPathfindingSystemHooks.onBeforeTeleportTo` / `onAfterTeleportTo`          |
| 录像播放到某一步             | `IReplaySandboxHooks.onStep`                                                |
| 录像记录新指令               | `IReplaySystemHooks.onRecordCommand`                                        |
| 通知渲染端进行一次提示       | `IDataCommonHooks.onTip`                                                    |

注意区分「切换楼层」相关的两族钩子，它们挂在不同的主对象上：`onSetFloor` 属于 `IHeroLocationHooks`，挂在 `state.hero.location` 上；`onBeforeChangeFloor` / `onAfterChangeFloor` 属于 `IHeroStateHooks`，挂在 `state.hero` 上。

若某类需求暂未在表中找到，可以在对应主对象的 `IHookable` 接口处查看它支持的全部钩子方法（例如 `hero-attribute`、`enemy-status-hooks` 等篇会进一步说明相关钩子的用法）。

## 改内置钩子（推荐）

日常需求优先改内置钩子文件（`src/data/hook/*`）：内置钩子已经在 `initializeHooks`（`src/data/hook/initialize.ts`）里注册好，你只要改对应类的方法体，不需要自己写类，也不需要再调用 `addHook`。

内置钩子类与所在文件：

| 钩子族                    | 内置类                       | 文件                      |
| ------------------------- | ---------------------------- | ------------------------- |
| `ICombatFlowHooks`        | `MainCombatFlowHooks`        | `src/data/hook/combat.ts` |
| `IGameEventExecutorHooks` | `MainGameEventExecutorHooks` | `src/data/hook/event.ts`  |
| `IHeroStateHooks`         | `MainHeroStateHooks`         | `src/data/hook/hero.ts`   |
| `IHeroAttributeHooks`     | `MainHeroAttributeHooks`     | `src/data/hook/hero.ts`   |
| `IHeroLocationHooks`      | `MainHeroLocationHooks`      | `src/data/hook/hero.ts`   |
| `IObjectMoverHooks`       | `MainHeroMoverHooks`         | `src/data/hook/hero.ts`   |
| `IMotaDataLoaderHooks`    | `MainMotaDataLoaderHooks`    | `src/data/hook/loader.ts` |
| `IPathfindingSystemHooks` | `MainPathfindingSystemHooks` | `src/data/hook/path.ts`   |

**目标**：在勇士某个属性变化时，立刻执行你写好的处理。

**改哪里**：`src/data/hook/hero.ts` 的 `MainHeroAttributeHooks.onUpdateAttribute` 方法体。

**复制什么**：下面的类本来就在文件里，复制时保留类与构造函数，只把方法体里的占位行换成你的处理：

```ts
export class MainHeroAttributeHooks implements IHeroAttributeHooks<IHeroAttr> {
    constructor(readonly state: ICoreState) {}

    onUpdateAttribute<K extends keyof IHeroAttr>(
        name: K,
        value: IHeroAttr[K]
    ): void {
        // [需改] 删掉下面两行占位，换成你的处理
        void name;
        void value;

        // 示例：攻击变化时给出提示
        if (name === 'atk') {
            this.state.emitTip(`攻击变为 ${value}`);
        }
    }
}
```

> 复制说明：这段就是内置类的现有代码，不需要新增文件；若编辑器提示缺少某个名字，再在文件顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：把 `void name;` / `void value;` 换成你的处理；示例只是提示，也可以改成加属性、记 flag、触发事件等。

**怎么验证**：手动改一次勇士攻击力（例如使用道具或调试命令），看提示有没有出现。

**注意**：一个钩子方法会对该主对象的**所有**同类动作触发——例如 `onUpdateAttribute` 对每个属性变化都触发，需要时要在方法体里判断 `name`，别误以为只对某一个属性生效。内置类已注册，改完方法体就会生效，不要重复 `addHook`。

## 异步钩子

部分钩子返回 `Promise`，是**异步钩子**，会在对应的动画或流程真正结束后才兑现；等待它们完成可以保证时序正确。例如：

- `IObjectMoverHooks` 的 `onMoveStart`、`onMoveEnd`、`onStepStart`、`onStepEnd`；
- `ICombatFlowHooks` 的 `onBeforeCombat`、`onAfterCombat`；
- `IHeroStateHooks` 的 `onBeforeChangeFloor`、`onAfterChangeFloor`；
- `IMapLayerHooks` 的 `onOpenDoor`、`onCloseDoor`、`onDeleteDynamic`；
- `IReplaySandboxHooks` 的 `onStep`。

其余钩子均为同步钩子，触发时立即执行。

## 一个提醒：钩子可能被非本对象触发

钩子由所属主对象触发，但同一个主对象可能对应多个游戏对象（例如场上有多只怪物）。因此钩子被触发时，不一定是针对你关心的那一只；当场上存在多个同类主对象时，需要在回调里根据传入的参数判断是否为你的目标对象。一般情况下不会串。

钩子建立在数据端的主对象之上，两端分工见[数据端与渲染端](./data-vs-render.md)；编写钩子所需的语法见[代码基础](./code-basics.md)。

## 自己写钩子类

如果不想改内置文件，或需要给同一个主对象挂多个互不影响的钩子，可以自己写一个钩子类，再用 `addHook(new ...(state))` 注册：

```ts
// [需改] 类名与处理逻辑
export class MyHeroAttributeHooks implements IHeroAttributeHooks<IHeroAttr> {
    constructor(readonly state: ICoreState) {}

    onUpdateAttribute<K extends keyof IHeroAttr>(
        name: K,
        value: IHeroAttr[K]
    ): void {
        // 属性变化时要做的事
    }
}

// [模板] 注册：实例先存进变量，之后移除时要用
const hook = new MyHeroAttributeHooks(state);
const controller = state.hero.attribute.addHook(hook);
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：类名、`implements` 后面的钩子族接口、方法名（对照上两张表），以及 `addHook` 前面的目标主对象。

**注意**：一个主对象可以挂多个钩子，它们会依次被调用。需要移除时，保留注册时的实例或控制器：把**原来的实例**传给 `removeHook`，或调用控制器的 `unload` 方法。

```ts
// 方式一：传回原来的钩子实例
state.hero.attribute.removeHook(hook);

// 方式二：用注册时返回的控制器卸载
controller.unload();
```

**如果你不怎么懂代码，建议直接改内置钩子（`src/data/hook/*` 里已有的类），而不是自己写新的类。** 改内置只需要替换方法体，注册也已经完成；自己写类还要处理接口签名、构造函数与注册/移除时机。
