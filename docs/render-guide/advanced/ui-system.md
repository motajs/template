# UI 系统

UI 系统由控制器、实例和栈组成。每次 `open` 都会在控制器上产生一个实例并压入栈，`close` 把实例从栈里移除；栈记录打开顺序，决定实例的叠放关系，也决定哪些实例可见。一个控制器同时管理一条栈、一个背景和一套显示策略。

写 UI 时主要接触控制器与 `GameUI`；实例由系统创建，作者通常只持有 `open` 返回的实例，用来关闭或隐藏它。

## 前置知识

阅读本篇前，建议先读完：

- [事件与交互](./events.md)

## 打开与关闭

需要让一个界面出现在控制器管理的画面上时，用 `open(ui, vBind, alwaysShow?)`。`ui` 是声明的 `GameUI`，`vBind` 是传给组件的参数，`alwaysShow` 省略时为普通界面。每次调用都会新建一个实例、压入栈，并返回这个实例；后打开的实例默认叠在先打开的上面。

```tsx
// 打开一个已声明的 UI，返回这次打开产生的实例
const instance = props.controller.open(ShopUI, {});

// 关闭这个实例
props.controller.close(instance);
```

关闭时要传 `open` 返回的那个实例，而不是重新打开一个再关。需要一次清空时用 `closeAll()`；传入一个 `GameUI` 时只关闭这一类界面。一次性弹窗可以用第三个参数 `alwaysShow` 打开，让它保持可见并盖在普通面板上方。

```ts
// 关闭控制器里的全部 UI
props.controller.closeAll();

// 只关闭 ShopUI 这一类
props.controller.closeAll(ShopUI);
```

下面的示例用一个最小控制器演示打开、关闭、栈长度与激活状态。

<ClientOnly>
  <RenderDemo :loader="controllerLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 隐藏与显示

面板短期内还要回来，并且希望保留滚动位置、输入内容或组件状态时，用 `hide(instance)` 隐藏；需要恢复时用 `show(instance)`。两者只改可见性，不改变栈顺序，也不会卸载组件，状态、监听与按键作用域都还在。确定不再需要这个界面、希望它下次打开时重新开始时，才用 `close` 卸载。

```ts
// 暂时隐藏，稍后还能原样显示
props.controller.hide(instance);
props.controller.show(instance);
```

隐藏的实例仍然留在栈里，策略计算「最后一个该显示谁」时仍会把它算进去；如果只是想让面板从画面上消失，不要用 `close` 再 `open` 重建。

## keep

`keep()` 用来处理「关一个、马上开一个」的间隙。比如从道具栏切换到详情面板时，旧面板关闭后背景会先熄灭；用 `keep()` 包住这次切换，背景就能保持到新面板打开。

它返回一个 `IKeepController` 对象，这个对象有两个方法：

- `safelyUnload()`：栈里还有 UI 时保留背景，栈为空时才关闭背景。
- `unload()`：不管栈里还有没有 UI，立即关闭背景。

`keep()` 本身不改变栈，也不卸载 UI；用完要调用其中一个方法收尾。

```ts
// 先保持背景，再关旧面板、开新面板
const keep = props.controller.keep();
props.controller.close(oldInstance);
props.controller.open(NextUI, {});
keep.safelyUnload();
```

## 控制器状态

`active` 与 `showBack` 是控制器的状态引用，主要给主场景容器用，普通 UI 组件一般不需要读。

## 背景

背景是控制器单独管理的一层，垫在 UI 栈下面，不占栈位置。普通 `open` / `close` 不会把它压栈或移除，`hide(instance)` 也关不掉它；要控制背景，用下面这组接口。

`setBackground(ui, vBind)` 设置背景 UI：`ui` 是一个 `GameUI`，`vBind` 是传给背景组件的参数。设置后背景实例始终在最下面；传 `null` 可以清空背景。

`showBackground()` 打开背景开关，`hideBackground()` 关闭背景开关。两者只影响背景这一层，不改变栈里的 UI。

`showBack` 是一个只读的 `Ref<boolean>`，表示背景最终是否显示；`showingBack()` 是同一结果的函数形式，返回 `boolean`。需要判断背景现在是否可见时，读 `showBack.value` 或调用 `showingBack()`。

```ts
// 设置背景 UI：不占栈位置，始终垫在最下面
props.controller.setBackground(BackgroundUI, {});

// 打开或关闭背景开关
props.controller.hideBackground();
props.controller.showBackground();

// 读取背景当前是否显示
const showing = props.controller.showingBack();
```

## 显示策略

栈里同时有多个实例时，显示策略决定打开与关闭后每个实例该显示还是隐藏。默认是 `lastOnly()`：只显示最后一个非 `alwaysShow` 实例，适合一层层推进的面板。`showAll()` 让栈里的界面同时可见，适合并排或叠加的界面。需要特殊叠放规则时，用 `showCustom(strategy)` 传入自定义策略；`strategy` 是一个 `IUICustomStrategy` 对象，负责决定每个实例在打开、关闭、隐藏、显示时该显示还是隐藏，只有内置的 `lastOnly()` / `showAll()` 不够用时才需要自己实现。

`lastOnly` 与 `showAll` 都接受一个 `stack` 参数：`lastOnly()` 默认开启栈模式，`showAll()` 默认关闭。开启栈模式后，关闭一个实例会连带移除它之后打开的实例；关闭并排工具栏时则不要开启。`alwaysShow` 的实例参与压栈，但不会被 `hide` 隐藏，所以弹窗能盖在面板上而不把面板挤掉。

```ts
// 一层层推进的面板
props.controller.lastOnly();

// 同时显示栈里的界面
props.controller.showAll();

// strategy 是一个由你实现的 IUICustomStrategy 对象
props.controller.showCustom(strategy);
```

切换策略会立刻按现有栈重算显示状态，不要假设「新打开的一定盖住旧的」而不看当前策略。

下面的示例并排对比「只显示最后一个」与「显示全部」两种策略的叠放效果。

<ClientOnly>
  <RenderDemo :loader="strategyLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 边界与注意

- 栈模式下 `close` 会连带关闭上层。只想去掉一层时，先确认当前策略是不是 `lastOnly`，或者改用 `showAll`。
- `alwaysShow` 的实例不会被 `hide` 隐藏；一次性弹窗就是靠这一点盖在面板上。
- 背景实例是 `alwaysShow` 的，`hide(instance)` 关不掉它；要隐藏背景用 `hideBackground`。
- `showBack` 与 `showingBack()` 是同一个结果；判断背景可见性时读它们即可。
- 频繁 `open` / `close` 会反复创建与销毁组件。能复用就复用，能 `hide` / `show` 就不要重建。
- `hide` 不会移除按键作用域，也不会让已打开的输入框失焦；需要彻底停止交互时用 `close`。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const controllerLoader = () =>
    import('../../.vitepress/components/demos/ui/controller-demo.tsx');

const strategyLoader = () =>
    import('../../.vitepress/components/demos/ui/strategy-demo.tsx');
</script>
