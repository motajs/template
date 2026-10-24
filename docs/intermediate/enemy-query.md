# 怪物查询

有些特殊属性不能只看自己。比如「抱团」要知道周围站了多少同伴，「同化」要看看其他怪物身上有什么属性，「号角」要数一数场上有多少怪物。这类属性需要先读取外部状态，再决定自己怎么变，对应的机制就叫查询（query）。

查询在构建计算后怪物时执行：读取周围有哪些怪物、它们带什么特殊属性、勇士在哪里，然后修改怪物自身的基础属性，或增删、修改怪物的特殊属性。基础概念见[战斗总览](./combat-overview.md)。

:::warning
查询效果是**引擎未内置、需要自己注册的新增内容**。当前 `src/data/enemy/initialize.ts` 只注册了光环转换器、最终效果、战斗脚本与钩子，没有注册任何查询效果。下文示例都是新增的类，在你自己写类并调用注册方法之前不会生效。
:::

## 常规查询（CommonQuery）

如果一条特殊属性只需要「读外部状态，然后改自己的基础属性」，用常规查询就够了。为了实现它，我们需要实现 `IEnemyCommonQueryEffect` 接口：写一个类，让引擎在构建计算后怪物时调用它的 `apply`。写好后这样注册：

```ts
state.enemyContext.registerCommonQueryEffect(code, new GroupQueryEffect());
```

（`GroupQueryEffect` 是下文「抱团」示例里的类；换成你自己写的类名即可。）

`IEnemyCommonQueryEffect` 只有两个成员：

- `priority`：优先级；
- `apply(handler, special, query)`：处理逻辑。`handler.enemy` 是正在计算的怪物，`special` 是触发查询的特殊属性，`query()` 返回怪物上下文。

`query()` 不只是取上下文，它还告诉上下文「这个怪物依赖外部状态」。**常规查询里必须调用 `query()`**：直接读 `handler.context` 虽然也能拿到同一个上下文对象，却不会把「这只怪物查询过外部状态」这件事登记下来。于是当周围怪物或位置发生变化时，上下文会认为这只怪物「没有进行过查询」，不会重新计算它，导致后续的伤害等计算结果不一致、甚至出错——这是个很容易踩、后果又严重的坑。因此请始终通过 `query()` 取上下文，不要用 `handler.context` 代替。

## 特殊查询（SpecialQuery）

如果查询要动的是目标怪物**拥有的特殊属性**——添加、删除或改写——就用特殊查询。例如给范围内的怪物补上一条属性，或把它们身上的数值属性叠加起来。为了实现它，我们需要实现 `IEnemySpecialQueryEffect` 接口，并配一个修饰器类来处理增删改。注册方式：

```ts
state.enemyContext.registerSpecialQueryEffect(new AssimilationQueryEffect());
```

（`AssimilationQueryEffect` 是下文「同化」示例里的类。）

常规查询的效果绑定在某个 `code` 上（引擎要按 code 找到会触发它的那条特殊属性），所以注册时还要传 code；特殊查询面向整只怪物，由修饰器里的 `shouldQuery` 自行筛选目标、可以一次改动多个属性，不绑定单个 code，因此只传效果实例。

`IEnemySpecialQueryEffect` 有：

- `priority`：优先级；
- `for(ctx)`：返回一个 `IEnemySpecialQueryModifier`。

修饰器包含四个方法：

- `shouldQuery(handler)`：判断当前怪物是否要执行这次查询；
- `add(handler)`：返回要添加给怪物的特殊属性数组；
- `delete(handler)`：返回要删除的特殊属性数组；
- `modify(handler, special)`：修改怪物的某个特殊属性，真正修改了返回 `true`。

`add` 与 `delete` 不应同时返回非空结果：上下文遇到这种组合会告警并放弃这次修改。

## 优先级

常规查询与特殊查询的 `priority` 和光环共用同一套优先级，从高到低处理。高优先级的效果先执行，低优先级能看到它留下的结果；反过来不行。查询新增的光环只能影响之后的阶段，规则与[怪物光环](./enemy-aura.md)一致。

查询属于「依赖外部、但只改自己」的那一类。如果一种属性确实同时需要「依赖外部」与「修改外部」，不要把它硬做成一种查询或一种光环，而应拆成查询 + 光环两个效果，再用一个新怪物属性桥接（见[怪物光环](./enemy-aura.md#光环、计算后怪物与「读写外部」)的「光环、计算后怪物与『读写外部』」）。

## 查询上下文 ctx

常规查询里的 `query()` 与特殊查询里的 `for(ctx)`，拿到的都是**查询上下文**（类型 `IReadonlyEnemyContext`），它代表「这次查询所在的怪物战场」。它是**只读**的，这是有意为之：查询效果应当只读取外部状态、再改自己，而不应反过来依赖可变的外部上下文，否则「谁先算、谁后算」的结果就无法确定。示例里用到它的这几个成员：

- `ctx.scanRange(range, param)`：用一个范围对象扫出范围内的怪物，逐项返回 `[位置, 怪物视图]`；
- `ctx.iterateEnemy()`：遍历上下文中的全部怪物，同样逐项返回 `[位置, 怪物视图]`；
- `ctx.indexer.index(x, y)`：把坐标换算成该位置在上下文中的索引（数字越小越靠前），示例用它给怪物排序。

这里的**怪物视图**是 `IEnemyView`：用 `view.getComputedEnemy()` 取到该怪物的计算后对象，就能读它的特殊属性。上下文还有其他成员（如按坐标取怪物、取绑定的勇士与地图伤害管理器），需要时再查 API 参考。

## 接进内置流程

查询效果在引擎里**没有可直接修改的内置实现**：`initializeEnemy` 中只注册了光环转换器、最终效果、战斗脚本与钩子，没有注册任何查询效果。要新增一条查询，需要做两件事：

1. 在 `src/data/enemy/query.ts` 里按下面的示例写一个**类**，让它实现对应接口。查询属性是**唯一**需要新建文件的一类：光环、最终效果、地图伤害等都写进各自的现成文件，不要另建；
2. 在 `initializeEnemy` 里 `new` 出这个类并注册（见文末「注册在哪里」）。

三个示例都是这种写法：先定义类，再在注册时 `new` 一次。查询效果只需要一个实例，注册一次即可。

查询没有内置类可改，但**不是所有需求都要新写查询类**。如果需求只是「影响周围怪物」或「只看自己与勇士做收尾」，优先改已有的内置类：

- 影响周围怪物 → 改内置光环 `src/data/enemy/aura.ts`（见[怪物光环](./enemy-aura.md)）；
- 只按自身与勇士收尾 → 改内置最终效果 `src/data/enemy/final.ts`（见[最终属性效果](./enemy-final.md)）。

这些内置类已经在 `initializeEnemy` 里注册好，直接改方法体即可，不需要新建类。只有「必须读取周围怪物、再修改自己」的逻辑，才需要按下面的示例自己写查询类。

## 模板：复制什么、改什么

查询分两种，模板也分两种。下面是机制本身的骨架，不含任何具体效果；复制到 `src/data/enemy/query.ts` 后，按 `[需改]` 改成你的查询。每条查询建议用 `//#region {code}-{name}` 包起来，以 `//#endregion` 结束，例如 `//#region 40-抱团`。

### 常规查询模板

```ts
// [需改] 类名
export class XxxCommonQueryEffect implements IEnemyCommonQueryEffect<
    IEnemyAttr,
    IHeroAttr
> {
    // [需改] 优先级：与光环共用，越大越先执行
    readonly priority = 10;

    // [模板] apply 签名固定
    apply(
        handler: IEnemyHandler<IEnemyAttr, IHeroAttr>,
        special: ISpecial<any>,
        query: () => IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>
    ): void {
        // [模板] 必须用 query() 取上下文，不能用 handler.context 代替
        const ctx = query();
        // [需改] 用 ctx 读外部状态（scanRange / iterateEnemy / indexer），
        //        再改 handler.enemy 的基础属性
    }
}
```

注册时把效果绑定到一个 code 上：

```ts
// [需改] code 换成触发这条查询的特殊属性编号
state.enemyContext.registerCommonQueryEffect(40, new XxxCommonQueryEffect());
```

### 特殊查询模板

特殊查询由「效果 + 修饰器」两个类组成：效果只负责造修饰器，修饰器负责真正增删改目标的特殊属性。

```ts
// [需改] 类名：修饰器
class XxxQueryModifier implements IEnemySpecialQueryModifier<
    IEnemyAttr,
    IHeroAttr
> {
    // [模板] 保存只读查询上下文
    constructor(
        private readonly ctx: IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>
    ) {}

    // [需改] 这次查询作用于哪些怪物
    shouldQuery(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): boolean {
        return handler.enemy.hasSpecial(41);
    }

    // [需改] 要添加的特殊属性
    add(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): ISpecial<any>[] {
        return [];
    }

    // [需改] 要删除的特殊属性
    delete(): ISpecial<any>[] {
        return [];
    }

    // [需改] 要改写的特殊属性；真正改了才返回 true
    modify(
        handler: IEnemyHandler<IEnemyAttr, IHeroAttr>,
        special: ISpecial<any>
    ): boolean {
        return false;
    }
}

// [需改] 类名：效果本身
export class XxxSpecialQueryEffect implements IEnemySpecialQueryEffect<
    IEnemyAttr,
    IHeroAttr
> {
    // [需改] 优先级
    readonly priority = 15;

    // [模板] for 签名固定：返回修饰器
    for(
        ctx: IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>
    ): IEnemySpecialQueryModifier<IEnemyAttr, IHeroAttr> {
        return new XxxQueryModifier(ctx);
    }
}
```

注册时特殊查询不绑定 code，只传效果实例：

```ts
state.enemyContext.registerSpecialQueryEffect(new XxxSpecialQueryEffect());
```

复制后只需要改这几处：

| 位置                                     | 改成什么                 |
| ---------------------------------------- | ------------------------ |
| `priority`                               | 你的执行顺序             |
| 常规查询的 `apply` 方法体与注册时的 code | 你的读法、改法与触发属性 |
| 特殊查询的 `shouldQuery`                 | 这次查询作用于哪些怪物   |
| 特殊查询的 `add` / `delete` / `modify`   | 你要增删改哪些特殊属性   |
| 类名 `Xxx...`                            | 你的名字                 |

下面三个示例都只是「填空示范」，不是模板本身。

## 示例：抱团

「抱团」的规则是：范围内每有一个带同种特殊属性的怪物，自身攻击力就增加固定值。它只需要读周围、改自己的攻击，所以用常规查询实现（示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md#包从哪来-src、packages-user-与-packages) 的「包从哪来」）。

**目标**：带「抱团」（示例 code 40）的怪物，范围内每多一个同种特殊属性的怪物，自身攻击加固定值。

**改哪里**：在 `src/data/enemy/query.ts` 里写下面这个类（用 `//#region 40-抱团` 包住）；再到 `src/data/enemy/initialize.ts` 里用 `registerCommonQueryEffect` 注册（见文末「注册在哪里」）。

**复制什么**：

```ts
export class GroupQueryEffect implements IEnemyCommonQueryEffect<
    IEnemyAttr,
    IHeroAttr
> {
    readonly priority = 10; // [需改] 优先级

    apply(
        handler: IEnemyHandler<IEnemyAttr, IHeroAttr>,
        special: ISpecial<any>,
        query: () => IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>
    ): void {
        // [需改] 读出本属性登记的参数
        const { radius, atk } = special.value as {
            radius: number;
            atk: number;
        };
        const ctx = query();
        const range = new ManhattanRange();
        let count = 0;
        for (const [locator, view] of ctx.scanRange(range, {
            cx: handler.locator.x,
            cy: handler.locator.y,
            radius
        })) {
            // [需改] 跳过自己，统计拥有同种特殊属性的其他怪物
            if (
                locator.x === handler.locator.x &&
                locator.y === handler.locator.y
            ) {
                continue;
            }
            if (view.getComputedEnemy().hasSpecial(special.code)) {
                count++;
            }
        }
        // [需改] 每有一个同类，攻击加 atk 点
        handler.enemy.addAttribute('atk', count * atk);
    }
}

// [需改] 注册：code 是绑定本效果的属性编号（示例自选 40）
state.enemyContext.registerCommonQueryEffect(40, new GroupQueryEffect());
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md#照抄教程里的代码时-怎么处理-import) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：`priority`、触发用的 `special.code` 与注册时的 code（本示例 40）、`radius` / `atk` 的读法换成你自己的。

**怎么验证**：给带该属性的怪物周围放上同类怪物，看它的攻击是否随同类数量按 `atk` 递增。

**注意**：`apply` 里必须用 `query()` 取上下文（直接读 `handler.context` 不会被登记为「查询过」，见上文）。

这个需求如果改用光环实现会麻烦得多：光环只能逐个目标施加减益或增益，很难先统计「范围内有多少个同类」再一次性加攻。查询可以在一次 `apply` 里完成扫描与累加。

## 示例：同化

「同化」的规则是：把场上其他怪物的特殊属性搬到自己身上——自己还没有的属性直接照抄（先按位置索引从小到大排序，靠前位置的属性先被抄过来）；自己已经有的数值型属性则与场上其他怪物的同一属性加算叠加。它要增删、改写自己拥有的特殊属性，所以用特殊查询（示例用 `ctx.iterateEnemy()` 遍历全场；若要限定范围，把遍历换成 `ctx.scanRange`）。

**目标**：带「同化」（示例 code 41）的怪物，把其他怪物的特殊属性搬到自己身上（没有的照抄，数值型的叠加）。

**改哪里**：在 `src/data/enemy/query.ts` 里写下面这个类（用 `//#region 41-同化` 包住）；再到 `src/data/enemy/initialize.ts` 里用 `registerSpecialQueryEffect` 注册（见文末「注册在哪里」）。

**复制什么**：

```ts
class AssimilationModifier implements IEnemySpecialQueryModifier<
    IEnemyAttr,
    IHeroAttr
> {
    constructor(
        private readonly ctx: IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>
    ) {}

    // [需改] 这次查询作用于哪些怪物
    shouldQuery(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): boolean {
        return handler.enemy.hasSpecial(41);
    }

    // [需改] 把别人有、自己没有的属性照抄过来（跳过同化属性自身）
    add(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): ISpecial<any>[] {
        const result: ISpecial<any>[] = [];
        const others = [...this.ctx.iterateEnemy()]
            .filter(([, view]) => view.getComputedEnemy() !== handler.enemy)
            .sort(
                ([a], [b]) =>
                    this.ctx.indexer.index(a.x, a.y) -
                    this.ctx.indexer.index(b.x, b.y)
            );
        for (const [, view] of others) {
            for (const special of view.getComputedEnemy().iterateSpecials()) {
                if (special.code === 41) continue;
                if (handler.enemy.hasSpecial(special.code)) continue;
                result.push(special.clone());
            }
        }
        return result;
    }

    delete(): ISpecial<any>[] {
        return [];
    }

    // [需改] 自己已有、需要叠加数值的属性在这里处理
    modify(
        handler: IEnemyHandler<IEnemyAttr, IHeroAttr>,
        special: ISpecial<any>
    ): boolean {
        if (typeof special.value !== 'number') return false;
        let sum = special.value;
        let found = false;
        for (const [, view] of this.ctx.iterateEnemy()) {
            const other = view
                .getComputedEnemy()
                .getSpecial<number>(special.code);
            if (!other || typeof other.value !== 'number') continue;
            sum += other.value;
            found = true;
        }
        if (!found) return false;
        special.setValue(sum);
        return true;
    }
}

export class AssimilationQueryEffect implements IEnemySpecialQueryEffect<
    IEnemyAttr,
    IHeroAttr
> {
    readonly priority = 15; // [需改] 优先级

    for(
        ctx: IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>
    ): IEnemySpecialQueryModifier<IEnemyAttr, IHeroAttr> {
        return new AssimilationModifier(ctx);
    }
}

// [需改] 注册（特殊查询不绑定单个 code，只传实例）
state.enemyContext.registerSpecialQueryEffect(new AssimilationQueryEffect());
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md#照抄教程里的代码时-怎么处理-import) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：`priority`、`shouldQuery` 里的判断（本示例 `hasSpecial(41)`）、`add` / `modify` 的合并逻辑换成你自己的。

**怎么验证**：给一只怪物挂上「同化」，让它周围有其他带特殊属性的怪物，看它是否照抄了别人的属性、数值型是否叠加。

**注意**：`add` 与 `delete` 不要同时返回非空结果（见上文）；`add` 负责处理「自己还没有的属性」，`modify` 负责处理「自己已经有、需要叠加数值」的属性。两者配合，就能把场上其他怪物的特殊属性合并到自身。

## 示例：号角

「号角」的规则是：场上每有一只怪物，自身就获得一份加成。它不关心范围与同类，用常规查询遍历全场即可：

**目标**：带「号角」（示例 code 42）的怪物，场上每有一只怪物就给自身加一份攻击。

**改哪里**：在 `src/data/enemy/query.ts` 里写下面这个类（用 `//#region 42-号角` 包住）；再到 `src/data/enemy/initialize.ts` 里用 `registerCommonQueryEffect` 注册（见文末「注册在哪里」）。

**复制什么**：

```ts
export class HornQueryEffect implements IEnemyCommonQueryEffect<
    IEnemyAttr,
    IHeroAttr
> {
    readonly priority = 5; // [需改] 优先级

    apply(
        handler: IEnemyHandler<IEnemyAttr, IHeroAttr>,
        special: ISpecial<any>,
        query: () => IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>
    ): void {
        const ctx = query();
        let count = 0;
        // [需改] 遍历全场怪物逐一计数
        for (const _ of ctx.iterateEnemy()) {
            count++;
        }
        // [需改] 每有一只怪物，攻击加 special.value 点
        handler.enemy.addAttribute('atk', count * (special.value as number));
    }
}

// [需改] 注册：示例自选 code 42
state.enemyContext.registerCommonQueryEffect(42, new HornQueryEffect());
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md#照抄教程里的代码时-怎么处理-import) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：`priority`、注册时的 code（本示例 42）、`special.value` 的用法换成你自己的。

**怎么验证**：把怪物放到场上（场上有其他怪物），看它的攻击是否随全场怪物数量递增。

**注意**：`apply` 里同样必须用 `query()` 取上下文。

三个示例分别覆盖了「按范围统计同类」「合并特殊属性」「遍历全场计数」三种典型用法。

## 注册在哪里

`registerCommonQueryEffect` 与 `registerSpecialQueryEffect` 要写进 `initializeEnemy`。下面是 `src/data/enemy/initialize.ts` 中该函数的样子（省略了无关的行）：

```ts
export function initializeEnemy(
    state: ICoreState
): IEnemyInitializationReturns {
    // ...省略：怪物管理器、特殊属性、上下文、伤害系统、地图伤害的初始化...

    const ctx = state.enemyContext;

    // ...省略：光环转换器与最终效果的注册...

    // [需改] 查询效果目前没有内置；先 import 你写的类，再在这里注册：
    // ctx.registerCommonQueryEffect(40, new GroupQueryEffect());
    // ctx.registerSpecialQueryEffect(new AssimilationQueryEffect());

    // ...省略：脚本与钩子的注册...
}
```

把注册调用放在这里，查询就会参与构建计算后怪物。注册的是 `new` 出来的实例，不是类本身。

## 自己写查询类时

只有在「必须读取周围怪物、再修改自己」时才需要自己写查询类。写法就是上面三个示例：`class` + `implements`，注册时 `new` 一次。

- **常规查询**：`class ... implements IEnemyCommonQueryEffect<IEnemyAttr, IHeroAttr>`，用 `registerCommonQueryEffect(code, new ...())` 注册；
- **特殊查询**：`class ... implements IEnemySpecialQueryEffect<IEnemyAttr, IHeroAttr>`，用 `registerSpecialQueryEffect(new ...())` 注册。

**如果你不怎么懂代码，建议直接改内置类（如 `src/data/enemy/aura.ts`、`src/data/enemy/final.ts`），而不是自己写新的类。** 自己写类要同时处理接口签名、注册时机与查询上下文，改动面比改内置方法体大得多；能由光环或最终效果表达的需求，优先改对应的内置类。

> 查询机制的设计原理（为什么常规查询要绑定 code、查询上下文为何是只读的、它与光环如何共用优先级）会在**高级教程**中讲解（预留标记：`高级教程 · 查询设计原理`）；待高级教程就位后，此处会替换为链接。

<!-- TODO(advanced): 查询设计原理 -->
