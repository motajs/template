# 最终属性效果

光环影响别人，查询读取外部再改自己。等这些外部影响都算完，有时还需要对怪物自己做一次最后的收尾：既不依赖周围环境，也不影响其他怪物。这类收尾调整就是最终效果（final effect）。

它适合实现「只看自己（和勇士）就能决定」的转换，例如坚固、模仿。整体流程见[战斗总览](./combat-overview.md)。

## 最终效果接口

为了在外部影响都算完后对怪物自己做一次收尾，我们需要实现 `IEnemyFinalEffect` 接口。它只有两个成员：

- `priority`：优先级，越高越先执行；
- `apply(handler)`：读取 `handler.enemy` 与 `handler.hero`，修改 `handler.enemy` 的基础属性。

注册方式：

```ts
state.enemyContext.registerFinalEffect(effect);
```

`initializeEnemy`（`src/data/enemy/initialize.ts`）已经注册了内置的 `MainEnemyFinalEffect`（`src/data/enemy/final.ts`）。它处理两个属性：

- **坚固（code 3）**：把怪物防御提升到不低于「勇士攻击 - 1」；
- **模仿（code 8）**：把怪物攻击与防御设置为勇士的最终攻击与最终防御。

## 改内置：在 `MainEnemyFinalEffect.apply` 里加分支

最终效果的内置实现只有一个类、一个方法：`src/data/enemy/final.ts` 的 `MainEnemyFinalEffect.apply`。它已经在 `initializeEnemy` 里注册，所以**改内置就是在 `apply` 里加一个 `if` 分支**——不新建类，也不用再调用 `registerFinalEffect`。这是本篇的主线做法。

内置方法体的结构很简单：先取出勇士的最终攻防，然后按 code 依次判断，命中就改怪物的基础属性。加一条新效果，就是在这串判断后面再接一段。

以「仿攻」为例：让怪物的攻击力等于勇士的最终攻击力。它与内置的模仿类似，区别是只改攻击、不改防御（这里的 code 32 是示例自选的未占用编号；内置的最终效果是坚固 code 3、模仿 code 8，内置编号见[特殊属性](./enemy-specials.md)）。

示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」。下面代码用 `[模板]` 标出可原样照抄的行，用 `[需改]` 标出必须按需求改的行。

**目标**：让带「仿攻」（code 32）的怪物，攻击力始终等于勇士的最终攻击力。

**改哪里**：`src/data/enemy/special.ts` 登记一条属性；`src/data/enemy/final.ts` 的 `MainEnemyFinalEffect.apply` 加一个分支。两处都是内置文件，改完不需要注册。

**复制什么**：先在 `special.ts` 里登记属性——

```ts
// special.ts：32 - 仿攻
// [需改] 照 special.ts 里其他属性的写法，新增这样一条定义，编号与名称换成你自己的
map.set(
    32, // [需改] 编号：示例自选的未占用号
    defineNonePropertySpecial(32, {
        name: '仿攻', // [需改] 显示名称
        desc: '怪物攻击等于勇士攻击。', // [需改] 悬停时显示的说明
        color: '#B0C0DD' // [需改] 名称的颜色
    })
);
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

再在 `final.ts` 的 `apply` 末尾接一个分支——

```ts
apply(handler: IEnemyHandler<IEnemyAttr, IHeroAttr>): void {
    const enemy = handler.enemy;
    const heroAtk = handler.hero.getFinalAttribute('atk');
    const heroDef = handler.hero.getFinalAttribute('def');

    // 3 - 坚固
    // ...省略：内置分支原样保留...

    // 8 - 模仿
    // ...省略：内置分支原样保留...

    // [需改] 32 - 仿攻：只改攻击，改成勇士的最终攻击
    if (enemy.hasSpecial(32)) {
        enemy.setAttribute('atk', heroAtk);
    }
}
```

**改什么**：编号（`32`）、名称、描述与颜色换成你自己的；新分支里 `hasSpecial(32)` 的触发条件与 `setAttribute` 的效果换成你要的逻辑。如果要读勇士的其他属性，在方法开头多取一次即可（`getFinalAttribute` 拿到的就是勇士的最终值）。

**怎么验证**：给一只怪物挂上「仿攻」后重建并开战，看它显示的攻击是否等于勇士当前最终攻击（勇士换装备后应同步变化）。

**注意**：`apply` 里 `handler.enemy` 已是可修改对象，直接 `setAttribute` 即可；最终阶段之后不再有别的属性修正，这里写进去的值会直接进入伤害计算。`MainEnemyFinalEffect` 的 `priority` 是 `0`，同一个类里的分支按书写顺序执行。

## 三方对比

光环、查询、最终效果都在构建计算后怪物时执行，但读取与影响的范围不同。把三者放在一起看，分工就清楚了：

| 效果 | 读取其他怪物/上下文 | 影响其他怪物   | 典型用途                   |
| ---- | ------------------- | -------------- | -------------------------- |
| 光环 | 否（只按范围命中）  | 是             | 给周围怪物加属性或特殊属性 |
| 查询 | 是                  | 否（只改自身） | 抱团、同化、号角           |
| 最终 | 否                  | 否             | 坚固、模仿、仿攻           |

最终效果可以读取勇士属性（模仿与仿攻都需要），但不会扫描周围怪物，也不会改变其他怪物。

### 为什么没有「既依赖外部、又修改外部」的能力

看到这里可能会问：为什么没有一种效果，既能像查询那样读取周围环境，又能像光环那样修改其他怪物？

因为那会引入**循环依赖**。如果一个效果既读取外部、又改动外部，就再也说不清一只怪物最终的结果是根据**改动前**的环境、还是**改动后**的环境算出来的——而环境本身又被这次效果改掉了，前后互相牵扯，结果无法稳定确定。

所以上表里「读取外部」与「影响外部」同时为「是」的那一格被刻意留空：需要「读外部之后改变自己的结果」，就用查询；需要「影响其他怪物」，就用光环。两者分开、按固定阶段执行，循环依赖就不会出现。

如果一种属性确实同时需要这两件事，不要试图做一个混合效果，而是把它拆成**查询效果 + 光环效果**：查询读取外部、改自己身上的一个新增标记属性，光环再根据这个标记属性去影响其他怪物。两者靠这个新怪物属性桥接。具体写法会在**高级教程**中讲解（预留标记：`高级教程 · 依赖并修改外部环境的属性`），待高级教程就位后替换为链接。

<!-- TODO(advanced): 依赖并修改外部环境的属性 -->

## 自己写最终效果类

只有两种情况需要自己写类：一是效果要按自己的节奏独立执行（比如想单独控制 `priority`、让它在内置效果之前跑完），二是你不打算改动内置文件。

自己写类要同时处理接口签名、优先级与注册，改动面比在内置 `apply` 里加一个分支大。

**如果你不怎么懂代码，建议直接改内置的 `MainEnemyFinalEffect.apply`（在 `src/data/enemy/final.ts` 里加分支），而不是自己写新的类。** 上面「改内置」一节已经覆盖了绝大多数需求；只有确实需要独立优先级或独立类时，才用下面的写法。

做法是实现 `IEnemyFinalEffect` 接口，再用 `registerFinalEffect` 注册。它与内置效果进入同一条流水线，会按各自的 `priority` 一起执行。先看接口模板，再看一个具体示例。

### 模板：复制什么、改什么

下面是最终效果机制本身的骨架，不含任何具体效果。复制到 `src/data/enemy/final.ts` 末尾后按 `[需改]` 修改（不要另建文件，最终效果的实现集中在这个文件里）：

```ts
// [需改] 类名：换成你自己的效果名
export class XxxFinalEffect implements IEnemyFinalEffect<
    IEnemyAttr,
    IHeroAttr
> {
    // [需改] priority：数值越大越先执行；内置最终效果是 0
    readonly priority = 0;

    // [模板] apply 签名固定：引擎在最终阶段调用它并传入 handler
    apply(handler: IEnemyHandler<IEnemyAttr, IHeroAttr>): void {
        // [需改] 触发条件：哪些怪物要执行这段收尾
        if (!handler.enemy.hasSpecial(XX)) return;
        // [需改] 收尾逻辑：只读 handler.enemy / handler.hero，
        //        再改 handler.enemy 的基础属性
    }
}
```

注册：

```ts
state.enemyContext.registerFinalEffect(new XxxFinalEffect());
```

复制后需要改的只有三处：类名、`priority`、`apply` 里「怎么判断」与「改什么属性」。

### 示例：仿攻

下面仍以「仿攻」为例，演示自写类的形态。它只是填空示范，不是模板本身：

```ts
export class AttackCopyFinal implements IEnemyFinalEffect<
    IEnemyAttr,
    IHeroAttr
> {
    readonly priority = 0;

    apply(handler: IEnemyHandler<IEnemyAttr, IHeroAttr>): void {
        // [需改] 只有带本效果（示例 code 32）的怪物才处理
        if (!handler.enemy.hasSpecial(32)) return;
        // [需改] 把怪物攻击设为勇士的最终攻击
        handler.enemy.setAttribute(
            'atk',
            handler.hero.getFinalAttribute('atk')
        );
    }
}

// [需改] 注册这行要挪进 initializeEnemy（见下方「注册在哪里」）
state.enemyContext.registerFinalEffect(new AttackCopyFinal());
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：编号（`32`）、类名、`priority` 与 `apply` 里的效果换成你自己的。

**怎么验证**：同「改内置」一节——挂上属性后开战，看攻击是否跟随勇士最终攻击变化。

**注意**：自写类与内置效果会**同时**执行，不是替换关系。若两者都处理同一个 code，属性会被改两次，后执行的覆盖先执行的；确定要自写时，记得把内置里对应的分支去掉或改认别的 code。

### 注册在哪里

`registerFinalEffect` 要写进 `initializeEnemy`。下面是 `src/data/enemy/initialize.ts` 中该函数的样子（省略了无关的行）：

```ts
export function initializeEnemy(
    state: ICoreState
): IEnemyInitializationReturns {
    // ...省略：怪物管理器、特殊属性、上下文的初始化...

    const ctx = state.enemyContext;

    // ...省略：伤害系统、地图伤害的初始化与注册...

    // 注册光环转换器
    ctx.registerAuraConverter(new CommonAuraConverter());
    ctx.registerAuraConverter(new GuardAuraConverter());
    ctx.registerAuraConverter(new SpecialAuraConverter());

    // 注册怪物最终效果 —— 内置效果就在这里注册
    ctx.registerFinalEffect(new MainEnemyFinalEffect());
    // [需改] 你自己的最终效果紧接着追加即可：
    // ctx.registerFinalEffect(new AttackCopyFinal());

    // ...省略：脚本与钩子的注册...
}
```

把注册调用放在内置效果那一行之后，你的效果就会随 `initializeEnemy` 一起生效。

## 与伤害计算的分工

最终效果改的是怪物的基础属性，伤害计算器负责决定「这些属性如何变成伤害与回合数」。如果某个效果只是让怪物攻击更高，优先考虑写成光环、查询或最终效果；只有需要改变公式本身时，才去改[伤害计算](./enemy-calculator.md)。
