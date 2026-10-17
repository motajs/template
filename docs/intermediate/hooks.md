# 钩子

游戏里的某个动作发生时——勇士属性变了、战斗开始了、门被推开了——你希望「顺手做点什么」，但又不想去改引擎本身的代码。钩子（hook）就是为此准备的：它是本引擎提供的「事件订阅」机制。动作发生，主对象会依次通知挂在它上面的钩子；你把想做的事写进钩子方法，就能在正确的时机介入。

## 钩子是什么

在数据端，勇士、地图、战斗流程等主对象在发生关键动作时，会依次调用自己身上每个钩子的对应方法。于是你只需要写一个钩子对象、把它注册到关心的主对象上，就能在这些动作发生时收到通知。

一个钩子对象就是一组方法的集合，**「什么时候」由方法名决定，「做什么」由方法体决定**。例如想在勇士属性变化时做点什么，就实现 `onUpdateAttribute`：

```ts
const hook = {
    onUpdateAttribute(name, value) {
        // 当勇士的某个属性变化时执行
    }
};
```

## 常用钩子族一览

「钩子族」是同一类钩子方法的集合（一个 `interface`）。常用的几族如下，方法名以源码为准：

| 钩子族 | 所属主对象 | 主要方法 |
| --- | --- | --- |
| `IDataCommonHooks` | 数据端公共对象 | `onTip` |
| `IHeroAttributeHooks` | 勇士属性 | `onUpdateAttribute` |
| `IHeroLocationHooks` | 勇士位置 | `onSetPos`、`onSetFloor` |
| `IHeroStateHooks` | 勇士状态 | `onBeforeChangeFloor`、`onAfterChangeFloor` |
| `IEquipmentStateHooks` | 装备 | `onChangeModifier` |
| `IHeroFollowersControllerHooks` | 勇士跟随者 | `onAddFollower`、`onRemoveFollower`、`onGatherFollowers` |
| `IObjectMoverHooks` | 移动器 | `onMoveStart`、`onMoveEnd`、`onStepStart`、`onStepEnd`、`onSetPos`、`onSetFaceDir`、`onSetMoveDir` |
| `ICombatFlowHooks` | 战斗流程 | `onBeforeCombat`、`onAfterCombat` |
| `IGameEventExecutorHooks` | 事件执行器 | `onBeforeExecuteEvent`、`onAfterExecuteEvent` |
| `IPathfindingSystemHooks` | 寻路系统 | `onBeforeTeleportTo`、`onAfterTeleportTo` |
| `IMapLayerHooks` | 地图图层 | `onResize`、`onUpdateArea`、`onUpdateBlock`、`onOpenDoor`、`onCloseDoor`、`onCreateDynamic`、`onDeleteDynamic`、`onUpdateDynamicPosition` |
| `IGameMapHooks` | 地图 | `onChangeBackground`、`onUpdateLayer`、`onResizeLayer` |
| `IReplaySystemHooks` | 录像系统 | `onCreateSandbox`、`onRecordCommand` |
| `IReplaySandboxHooks` | 录像沙盒 | `onStep`、`onSpeedSet`、`onStartReplay`、`onStopReplay`、`onPauseReplay`、`onResumeReplay` |

## 需求 → 钩子对照表

真要动手时，多半是先有一个需求、再去找它对应哪个钩子。下表把常见需求和对应的钩子方法列在一起，照着找即可：

| 需求 | 对应钩子 |
| --- | --- |
| 勇士属性变化时做点事 | `IHeroAttributeHooks.onUpdateAttribute` |
| 勇士被设置坐标或切换楼层 | `IHeroLocationHooks.onSetPos` / `onSetFloor` |
| 勇士移动开始、结束或每走一步 | `IObjectMoverHooks.onMoveStart` / `onMoveEnd` / `onStepStart` / `onStepEnd` |
| 切换楼层前后做过渡处理 | `IHeroStateHooks.onBeforeChangeFloor` / `onAfterChangeFloor` |
| 战斗前或战斗后介入 | `ICombatFlowHooks.onBeforeCombat` / `onAfterCombat` |
| 事件执行前后介入 | `IGameEventExecutorHooks.onBeforeExecuteEvent` / `onAfterExecuteEvent` |
| 地图图块被修改、区域被更新 | `IMapLayerHooks.onUpdateBlock` / `onUpdateArea` |
| 开门或关门时做点什么 | `IMapLayerHooks.onOpenDoor` / `onCloseDoor` |
| 动态图块被创建或删除 | `IMapLayerHooks.onCreateDynamic` / `onDeleteDynamic` |
| 装备的修饰器发生变化 | `IEquipmentStateHooks.onChangeModifier` |
| 瞬移寻路前后介入 | `IPathfindingSystemHooks.onBeforeTeleportTo` / `onAfterTeleportTo` |
| 录像播放到某一步 | `IReplaySandboxHooks.onStep` |
| 录像记录新指令 | `IReplaySystemHooks.onRecordCommand` |
| 通知渲染端进行一次提示 | `IDataCommonHooks.onTip` |

注意区分「切换楼层」相关的两族钩子，它们挂在不同的主对象上：`onSetFloor` 属于 `IHeroLocationHooks`，挂在 `state.hero.location` 上；`onBeforeChangeFloor` / `onAfterChangeFloor` 属于 `IHeroStateHooks`，挂在 `state.hero` 上。

若某类需求暂未在表中找到，可以在对应主对象的 `IHookable` 接口处查看它支持的全部钩子方法（例如 `hero-attribute`、`enemy-status-hooks` 等篇会进一步说明相关钩子的用法）。

## 注册与移除钩子

写好了钩子对象，还要挂到目标主对象上。用 `addHook` 完成注册，它会返回一个控制器：

```ts
const controller = state.hero.attribute.addHook({
    onUpdateAttribute(name, value) {
        // 属性变化时的处理
    }
});
```

需要移除时，有两种方式：把**原来的钩子对象**传给 `removeHook`，或调用 `addHook` 返回的控制器的 `unload` 方法。

```ts
// 方式一：传回原来的钩子对象
state.hero.attribute.removeHook(hook);

// 方式二：用注册时返回的控制器卸载
controller.unload();
```

数据端的内置钩子在 `src/data/hook/initialize.ts` 中统一注册（涵盖战斗、事件、勇士、加载、寻路等），它是了解内置钩子如何挂载的入口。

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
