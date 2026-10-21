# 声明式 vs 命令式接口

如果你已经会用中级教程里的接口做效果，可能注意过一件事：同样是「让某只怪物更强」，有的写法是直接改数值，有的写法只是往数据里加一条 `special`。这不是新旧语法的差别，而是两种完全不同的思路。

高级教程后续的插件、存档、录像与钩子，都建立在第二种思路上。这一层如果没弄明白，后面每篇都会变成死记接口。本篇把两种思路讲透，并告诉你什么时候该用哪一种。

阅读前你只需要会基础语法：变量、函数、`class` 与 `new`、`import`。不要求懂引擎内部结构；涉及内部机制的地方，我们会先说「你能拿它做什么」。

## 一句话区别

- <strong>命令式</strong>：你写一步，代码走到就执行一步。执行时机由你写的位置决定。
- <strong>声明式</strong>：你声明规则、数据或对象，引擎在定义好的时机调用。执行时机由引擎决定。

可以把它想成点菜：命令式是你走进厨房自己开火、下锅、装盘，每一步都要亲自做，而且只做这一次；声明式是你把菜单交给厨房，说明「要什么」，厨房在出餐时按流程做好。

所以，声明式<strong>不是不写代码</strong>。你仍然要写「怎么算、怎么改」；只是把「做什么」与「什么时候做」分开了。分开之后，同一个规则可以被引擎在不同场景反复使用，而不必在每个调用点重写一遍。

## 命令式：写到就执行

旧样板里，很多效果是直接写在某段脚本里的：需要强化周围怪物，就在事件脚本里遍历它们、直接改攻击力；需要勇士回血，就直接改勇士当前的血量。

下面只是示意图，用来说明执行方式，<strong>不是可以照抄的新接口</strong>：

```ts
// 旧样板示意（伪代码，不可照抄）
// 事件脚本执行到这里时，直接遍历周围怪物，改写它们“当下”的攻击力
function strengthenNearbyEnemies(nearbyEnemies: IEnemyState[]): void {
    for (const enemy of nearbyEnemies) {
        enemy.atk = enemy.atk + 10;
    }
}

// 另一段脚本里，勇士回血也是直接改当前数值
function healHero(hero: IHeroState<IHeroAttr>): void {
    hero.hp = hero.hp + 50;
}
```

这种写法的执行时机非常直观：代码走到哪，效果就发生到哪。但它会带来几个后果：

- <strong>只在执行到的那一瞬间生效</strong>。脚本没被触发，效果就不存在；触发第二次，效果就再来一次。
- <strong>想重新计算只能重跑</strong>。怪物移动、光环范围变化之后，旧数值不会自动更新；再跑一遍脚本，又容易把加成叠加两次。
- <strong>每条路径都要自己同步</strong>。存档、读档、录像回放、重新进入楼层，这些路径都可能绕开你写的那段脚本，于是状态对不上。
- <strong>没法凭空给怪物加特殊属性</strong>。直接改 `atk` 只是改了一个数字，不能让怪物「获得一条领域属性」。

这不是说命令式一无是处。玩家点一下、走一步、用一次道具，本来就是「现在立刻发生」的动作，用命令式接口最直接。问题只出在：把<strong>持续生效的规则</strong>也写成了一次性命令。

## 声明式：引擎在合适的时机执行

新样板把规则与调用时机拆开。下面五组都是当前源码里真实存在的机制，也是后续高级内容的基础。

### 怪物特殊属性与光环

<strong>你声明什么</strong>：怪物数据上的 `special` 字段。键是特殊属性编号，值是该属性的参数。比如给怪物声明一条光环（编号 `23`），参数类型是 `ISpecial23Value`，定义在 `src/data/enemy/special.ts`：

```ts
// special 字段里编号 23 的值，类型为 ISpecial23Value
const aura: ISpecial23Value = {
    range: 1, // 光环范围，单位为格
    square: false, // true 为矩形范围，false 为十字型范围
    hpBuff: 0, // 三项都是百分比：生命、攻击、防御
    atkBuff: 20,
    defBuff: 0
};
```

<strong>引擎在哪个时机执行</strong>：构建「计算后怪物」时。`state.enemyContext.buildup()` 会按固定顺序重建每只怪物，把光环、查询与最终效果真正写进属性；`aura.ts` 里的 `CommonAuraConverter` 负责把编号 `23` 转成 `CommonAura` 视图，这个转换器在初始化时通过 `ctx.registerAuraConverter(...)` 注册一次。

<strong>为什么这比命令式更稳</strong>：怪物模板本身没有被改写，每次重建都从模板的原始值出发，所以反复重建不会让加成越叠越多；你改的是数据里的一条声明，所有读取计算后怪物的场景都会自动看到新结果；存档也只需要保存模板。更细的构建流程见[战斗总览](../intermediate/combat-overview.md)，属性本身的写法见[特殊属性](../intermediate/enemy-specials.md)。

### 伤害计算器

<strong>你声明什么</strong>：一组属性到伤害结果的换算规则。核心是实现 `IDamageCalculator.calculate(handler)`，返回 `{ damage, turn }`；接口还有 `getCriticalLimit(handler, attribute)` 供临界值计算，改公式时按内置实现 `MainDamageCalculator` 的写法保留它即可。内置实现通过 `useCalculator(new ...)` 注册一次。

<strong>引擎在哪个时机执行</strong>：任何需要伤害数值的地方。显示伤害预览、计算临界值、真正结算战斗，都会调用计算器；同一场战斗里，它可能被反复调用很多次。

<strong>为什么这比命令式更稳</strong>：你只描述 `f(enemy, hero)` 这一条规则，所有调用点共用同一份结果。不需要在「显示」和「结算」两处各写一遍公式，也不会出现显示一个数、实际打另一个数。代价是计算器<strong>必须无副作用</strong>，下面会单独解释。

改公式与注册的完整做法见[伤害计算](../intermediate/enemy-calculator.md)。

### 道具效果

<strong>你声明什么</strong>：道具被使用或拾取时要做的事，即道具数据上的效果对象。要实现效果，实现 `IItemEffect` 的 `useEffect(item, state)`；如果还要判断能不能用，再实现 `canUse(item, state)`。

<strong>引擎在哪个时机执行</strong>：道具系统处理使用与拾取时。`Pick` 类道具在拾取时触发，`Constant` 与 `Consumable` 类道具在使用时触发。这个时机以及道具数量、消耗、存档与录像，都由道具系统统一处理。

<strong>为什么这比命令式更稳</strong>：你只声明「这个道具有什么效果」，不用自己处理扣数量、判定类别、记录录像。只要道具是通过正常入口使用的，效果就会在正确时机发生，也不会漏掉存档同步。

### 可存档对象

<strong>你声明什么</strong>：一份自定义状态该怎么存、怎么读。实现 `ISaveableContent<T>`：`saveState(compression)` 返回要保存的数据，`loadState(state, compression)` 负责把数据读回来。返回的对象必须与运行中的对象<strong>互相独立</strong>，`saveState` 不会替你深拷贝。

<strong>引擎在哪个时机执行</strong>：存档与读档时。你只需要注册一次，例如 `state.addSaveableContent('@my/xxx', content)`，之后引擎会在存档、读档时按注册表逐个调用。

<strong>为什么这比命令式更稳</strong>：存与读写在同一个接口里，不会出现「存的时候漏了一个字段、读的时候又忘了恢复」。注册一次之后，压缩级别、调用顺序、跨对象引用都由存档系统统一管理。完整约束见[可存档内容](./saveable-content.md)。

### 钩子

<strong>你声明什么</strong>：某个动作发生时要做的事。实现对应的钩子族接口，把处理写进方法体。比如「勇士属性变化时做点什么」，就实现 `IHeroAttributeHooks` 的 `onUpdateAttribute`。

<strong>引擎在哪个时机执行</strong>：对应动作发生时。主对象会通过 `forEachHook` 依次通知挂在自己身上的钩子。你只需要注册一次：

```ts
import { ICoreState } from '@user/data-state';
import { MyHeroAttributeHooks } from './hero-attribute-hooks';

// 注册钩子：new 一个钩子实例，挂到关心的主对象上
export function registerHeroAttributeHooks(state: ICoreState): void {
    state.hero.attribute.addHook(new MyHeroAttributeHooks(state));
}
```

不需要时可以用 `removeHook` 摘掉。内置钩子已经在初始化时注册好，你自己写的钩子才需要 `addHook`。

<strong>为什么这比命令式更稳</strong>：你不需要去改每一个调用点。动作发生时引擎统一广播，多个钩子可以同时存在、各自处理；不再需要时也能干净地移除。完整用法见[钩子深入](./hooks-in-depth.md)。

这五组的共同点是：你写的不是一串执行步骤，而是「一份规则加一个注册动作」。注册之后，调用时机归引擎。你不需要，也不应该自己再找地方调用它。

## 对照表

| 对比项     | 旧样板：命令式                 | 新样板：声明式                               |
| ---------- | ------------------------------ | -------------------------------------------- |
| 你写什么   | 一步一步的操作                 | 规则、数据或对象                             |
| 何时执行   | 代码被执行到的那一刻           | 引擎定义好的时机（构建、使用、存档、事件等） |
| 执行次数   | 你写几次就执行几次             | 由引擎决定，可能反复调用                     |
| 副作用     | 每次都要自己保证一致           | 计算类必须无副作用，状态修改走指定时机       |
| 存档与读档 | 自己记录、自己恢复             | 声明 `saveState` / `loadState`，引擎统一调用 |
| 录像       | 容易漏记，回放结果对不上       | 入口动作记入录像，派生结果重算               |
| 组合方式   | 脚本顺序就是执行顺序，容易覆盖 | 注册表与优先级组合，可叠加、可移除           |
| 常见错误   | 忘记在别的路径同步状态         | 把声明式当成不用写逻辑，或在计算器里改状态   |

## 为什么这样设计

把执行时机交给引擎，换来的是下面几件事：

1. <strong>时机集中</strong>。所有光环都在重建计算后怪物时执行，所有存档对象都在存档时执行。调用点只有引擎一处，不会出现「这个效果我在 A 处记得调用、在 B 处忘了」。
2. <strong>从模板重算，避免叠加</strong>。每次重建都从模板的原始值出发，算出来的是「当前应该是什么样」，而不是「上次基础上再加一点」。命令式反复执行同一段脚本，很容易越加越多。
3. <strong>按注册表与优先级组合</strong>。转换器、效果、钩子都注册到对应系统里，多个扩展可以同时存在；需要顺序时由优先级决定，而不是靠你调整脚本摆放位置。
4. <strong>录像只记录玩家入口动作</strong>。玩家的移动、使用道具等动作进入录像，光环、伤害这些派生结果在回放时重新计算。如果派生结果依赖某段命令式脚本执行了几次，回放就会和录制时对不上。

## 「副作用」是什么

所谓副作用，就是<strong>除了返回结果之外，还顺手改动了外部状态</strong>。比如写了一个 flag、删了一条记录、改了怪物或勇士的属性，这些都属于副作用。

看一个反例：

```ts
import { ICoreState } from '@user/data-state';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import {
    CriticalableHeroStatus,
    IDamageCalculator,
    IEnemyDamageInfoBase,
    IReadonlyDamageHandler
} from '@user/data-system';

// [反例] 有副作用的计算器：算出结果的同时，还改了外部状态
export class BadDamageCalculator implements IDamageCalculator<
    IEnemyAttr,
    IHeroAttr
> {
    constructor(private readonly state: ICoreState) {}

    calculate(
        handler: IReadonlyDamageHandler<IEnemyAttr, IHeroAttr>
    ): IEnemyDamageInfoBase {
        const damage = 100; // 这里只是示意，真实公式会读 handler
        // 副作用：把这次结果写进 flag
        this.state.flags.setField('lastDamage', damage);
        return { damage, turn: 1 };
    }

    // 临界计算同样会被反复调用，这里只保留结构
    getCriticalLimit(
        handler: IReadonlyDamageHandler<IEnemyAttr, IHeroAttr>,
        attribute: CriticalableHeroStatus<IHeroAttr>
    ): number {
        return 0;
    }
}
```

计算器在一次战斗里会被反复调用：显示伤害要算、临界值要二分十几次、真正结算还要算。只要它顺手改了状态，第二次调用的输入就可能已经被第一次改过了。结果是显示、临界与实际战斗互相污染。

需要说明的是，副作用本身不是错。钩子、道具效果、存档对象本来就要改状态；错的是在<strong>只该读输入、且会被反复调用</strong>的位置改状态。判断标准很简单：这个方法会不会被引擎多次调用？如果会，它就应该只读输入、返回结果。

## 什么时候仍然用命令式

声明式不是万能模板。下面这些场景仍然应该用命令式接口：

- <strong>玩家直接产生的一次性动作</strong>：走一步、使用一个道具、触发一段一次性剧情。它们的语义就是「现在立刻发生」。
- <strong>只在该时刻生效、且不需要回放的脚本</strong>：如果一段脚本的效果本来就只应该发生一次，写成命令式没有问题。
- <strong>需要立即得到返回值再决定下一步的流程</strong>：比如先判断能否使用道具，再决定是否扣除数量。

但要记住一条边界：<strong>这些入口动作必须计入录像</strong>。玩家按下的操作进入录像，回放时重新走一遍命令式接口，派生结果再由声明式规则重算。具体要求见[录像一致性](./replay-consistency.md)。

可以用一句话概括：<strong>一次性动作用命令式，持续生效的规则用声明式</strong>。

## 扩展点一览

前面五组机制各自要写什么、注册到哪里、引擎什么时候调用，放在一起看更清楚：

| 扩展点     | 你要实现的东西                               | 注册入口                                 | 引擎调用时机           |
| ---------- | -------------------------------------------- | ---------------------------------------- | ---------------------- |
| 特殊属性   | `createSpecials` 里的一条 `map.set(code, …)` | `initializeEnemy` 统一注册，无需单独调用 | 读取或重建计算后怪物时 |
| 光环       | 一个转换器与一个视图                         | `ctx.registerAuraConverter(new …)`       | 重建计算后怪物时       |
| 伤害计算器 | `IDamageCalculator.calculate`                | `useCalculator(new …)`                   | 显示、临界、战斗结算时 |
| 道具效果   | `IItemEffect.useEffect`                      | 写在道具数据里                           | 使用或拾取道具时       |
| 可存档对象 | `ISaveableContent.saveState` / `loadState`   | `state.addSaveableContent(id, content)`  | 存档与读档时           |
| 钩子       | 对应钩子族接口的方法                         | `addHook(new …)`                         | 对应动作发生时         |

这些扩展点的写法都是「实现一个类 + 注册一次」：类里只放引擎会调用的方法，注册放在初始化函数里。示例一律写成 `class` 再 `new`，不要写成 `const obj = { ... }` 这种 plain object。

## 小结

- 命令式是「写到就执行」，声明式是「声明规则，引擎在合适时机执行」。
- 声明式不是不写代码，而是把「做什么」与「什么时候做」分开。
- 持续生效的规则用声明式；玩家直接产生的一次性动作用命令式，但要计入录像。
- 计算类扩展必须无副作用；状态修改放到引擎规定的时机里。

返回[高级 I 导览](./index.md)。
