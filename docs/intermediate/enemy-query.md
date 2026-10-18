# 怪物查询

有些特殊属性不能只看自己。比如「抱团」要知道周围站了多少同伴，「同化」要看看其他怪物身上有什么属性，「号角」要数一数场上有多少怪物。这类属性需要先读取外部状态，再决定自己怎么变，对应的机制就叫查询（query）。

查询在构建计算后怪物时执行：读取周围有哪些怪物、它们带什么特殊属性、勇士在哪里，然后修改怪物自身的基础属性，或增删、修改怪物的特殊属性。基础概念见[战斗总览](./combat-overview.md)。

:::warning
查询效果是**引擎未内置、需要自己注册的新增内容**。当前 `src/data/enemy/initialize.ts` 只注册了光环转换器、最终效果、战斗脚本与钩子，没有注册任何查询效果。下面的接口与示例在你自己调用注册方法之前不会生效。
:::

## 常规查询（CommonQuery）

如果一条特殊属性只需要「读外部状态，然后改自己的基础属性」，用常规查询就够了。注册方式：

```ts
state.enemyContext.registerCommonQueryEffect(code, effect);
```

`IEnemyCommonQueryEffect` 只有两个成员：

- `priority`：优先级；
- `apply(handler, special, query)`：处理逻辑。`handler.enemy` 是正在计算的怪物，`special` 是触发查询的特殊属性，`query()` 返回怪物上下文。

`query()` 不只是取上下文，它还告诉上下文「这个怪物依赖外部状态」。**常规查询里必须调用 `query()`**：直接读 `handler.context` 虽然也能拿到同一个上下文对象，却不会把「这只怪物查询过外部状态」这件事登记下来。于是当周围怪物或位置发生变化时，上下文会认为这只怪物「没有进行过查询」，不会重新计算它，导致后续的伤害等计算结果不一致、甚至出错——这是个很容易踩、后果又严重的坑。因此请始终通过 `query()` 取上下文，不要用 `handler.context` 代替。

## 特殊查询（SpecialQuery）

如果查询要动的是目标怪物**拥有的特殊属性**——添加、删除或改写——就用特殊查询。例如给范围内的怪物补上一条属性，或把它们身上的数值属性叠加起来。注册方式：

```ts
state.enemyContext.registerSpecialQueryEffect(effect);
```

常规查询的效果绑定在某个 `code` 上（引擎要按 code 找到会触发它的那条特殊属性），所以注册时还要传 code；特殊查询面向整只怪物，由修饰器里的 `shouldQuery` 自行筛选目标、可以一次改动多个属性，不绑定单个 code，因此只传 effect。

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

查询属于「依赖外部、但只改自己」的那一类；「既依赖外部、又修改外部」的能力是刻意不提供的，原因见[最终属性效果](./enemy-final.md)。

## 查询上下文 ctx

常规查询里的 `query()` 与特殊查询里的 `for(ctx)`，拿到的都是**查询上下文**（类型 `IReadonlyEnemyContext`），它代表「这次查询所在的怪物战场」。它是**只读**的，这是有意为之：查询效果应当只读取外部状态、再改自己，而不应反过来依赖可变的外部上下文，否则「谁先算、谁后算」的结果就无法确定。示例里用到它的这几个成员：

- `ctx.scanRange(range, param)`：用一个范围对象扫出范围内的怪物，逐项返回 `[位置, 怪物视图]`；
- `ctx.iterateEnemy()`：遍历上下文中的全部怪物，同样逐项返回 `[位置, 怪物视图]`；
- `ctx.indexer.index(x, y)`：把坐标换算成该位置在上下文中的索引（数字越小越靠前），示例用它给怪物排序。

这里的**怪物视图**是 `IEnemyView`：用 `view.getComputedEnemy()` 取到该怪物的计算后对象，就能读它的特殊属性。上下文还有其他成员（如按坐标取怪物、取绑定的勇士与地图伤害管理器），需要时再查 API 参考。

## 改内置，还是自己写

查询是**引擎未内置、必须自己写并注册的新增内容**（见上方 warning），没有「只改内置一处」的捷径：`initialize.ts` 里目前没有注册任何查询效果。

- **常规查询**：写一个 `IEnemyCommonQueryEffect` 对象，用 `registerCommonQueryEffect(code, effect)` 注册；
- **特殊查询**：写一个 `IEnemySpecialQueryEffect` 对象，用 `registerSpecialQueryEffect(effect)` 注册。

下面代码用 `[模板]` 标出可原样照抄的行（接口签名、遍历骨架），用 `[需改]` 标出必须按需求改写的行（code、优先级、统计与修改逻辑）。

## 示例：抱团

「抱团」的规则是：范围内每有一个带同种特殊属性的怪物，自身攻击力就增加固定值。它只需要读周围、改自己的攻击，所以用常规查询实现（示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」）：

```ts
// [模板] 依赖导入
import { ManhattanRange } from '@motajs/common';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { IEnemyCommonQueryEffect } from '@user/data-system';

// [需改] 变量名：这是一个常规查询效果对象
const effect: IEnemyCommonQueryEffect<IEnemyAttr, IHeroAttr> = {
    // [需改] priority：与光环共用一套优先级，越大越先执行
    priority: 10,
    // [模板] apply 签名固定：handler 是当前怪物，special 是触发查询的属性，query() 取上下文
    apply(handler, special, query) {
        // [需改] 读出本属性登记的参数（示例：半径与每只同类提供的攻击加成）
        const { radius, atk } = special.value as {
            radius: number;
            atk: number;
        };
        // [模板] 必须用 query() 取上下文（直接读 handler.context 不会被登记为「查询过」，见上文）
        const ctx = query();
        // [模板] 范围对象建一次即可
        const range = new ManhattanRange();
        let count = 0;
        // [模板] 扫出范围内的怪物，逐项拿到 [位置, 视图]
        for (const [locator, view] of ctx.scanRange(range, {
            cx: handler.locator.x,
            cy: handler.locator.y,
            radius
        })) {
            // [需改] 跳过自己：只统计周围的其他怪物
            if (
                locator.x === handler.locator.x &&
                locator.y === handler.locator.y
            ) {
                continue;
            }
            // [需改] 统计拥有同种特殊属性的怪物
            if (view.getComputedEnemy().hasSpecial(special.code)) {
                count++;
            }
        }
        // [需改] 修改自身：每有一个同类，攻击加 atk 点
        handler.enemy.addAttribute('atk', count * atk);
    }
};

// [需改] 注册：code 是绑定本效果的属性编号（示例自选 40）
state.enemyContext.registerCommonQueryEffect(40, effect);
```

这个需求如果改用光环实现会麻烦得多：光环只能逐个目标施加减益或增益，很难先统计「范围内有多少个同类」再一次性加攻。查询可以在一次 `apply` 里完成扫描与累加。

## 示例：同化

「同化」的规则是：把场上其他怪物的特殊属性搬到自己身上——自己还没有的属性直接照抄（先按位置索引从小到大排序，靠前位置的属性先被抄过来）；自己已经有的数值型属性则与场上其他怪物的同一属性加算叠加。它要增删、改写自己拥有的特殊属性，所以用特殊查询（示例用 `ctx.iterateEnemy()` 遍历全场；若要限定范围，把遍历换成 `ctx.scanRange`）：

```ts
// [模板] 依赖导入
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { IEnemySpecialQueryEffect } from '@user/data-system';
import { ISpecial } from '@user/data-base';

// [需改] 变量名：特殊查询效果对象
const effect: IEnemySpecialQueryEffect<IEnemyAttr, IHeroAttr> = {
    priority: 15, // [需改] 优先级
    // [模板] for(ctx) 签名固定：返回一个修饰器；ctx 是只读查询上下文
    for(ctx) {
        return {
            // [需改] shouldQuery：本效果是否作用于这只怪物（示例：带 code 41 的怪物）
            shouldQuery: handler => handler.enemy.hasSpecial(41),
            // [需改] add：返回要添加给怪物的特殊属性
            add(handler) {
                const result: ISpecial<any>[] = [];
                // [模板] 取全场其他怪物，并按位置索引从小到大排序
                const others = [...ctx.iterateEnemy()]
                    .filter(
                        ([, view]) => view.getComputedEnemy() !== handler.enemy
                    )
                    .sort(
                        ([a], [b]) =>
                            ctx.indexer.index(a.x, a.y) -
                            ctx.indexer.index(b.x, b.y)
                    );
                // [需改] 把别人有、自己没有的属性照抄过来（跳过同化属性自身）
                for (const [, view] of others) {
                    for (const special of view
                        .getComputedEnemy()
                        .iterateSpecials()) {
                        if (special.code === 41) continue;
                        if (handler.enemy.hasSpecial(special.code)) continue;
                        result.push(special.clone());
                    }
                }
                return result;
            },
            // [模板] 本效果不删除属性，返回空数组
            delete() {
                return [];
            },
            // [需改] modify：自己已有、需要叠加数值的属性在这里处理
            modify(handler, special) {
                // [模板] 只处理数值型属性
                if (typeof special.value !== 'number') return false;
                let sum = special.value;
                let found = false;
                // [模板] 遍历全场，把同 code 的数值加算进来
                for (const [, view] of ctx.iterateEnemy()) {
                    const other = view
                        .getComputedEnemy()
                        .getSpecial<number>(special.code);
                    if (!other || typeof other.value !== 'number') continue;
                    sum += other.value;
                    found = true;
                }
                if (!found) return false;
                // [模板] 写回并返回 true，表示确实改动了
                special.setValue(sum);
                return true;
            }
        };
    }
};

// [需改] 注册（特殊查询不绑定单个 code，只传 effect）
state.enemyContext.registerSpecialQueryEffect(effect);
```

`add` 负责处理「自己还没有的属性」，`modify` 负责处理「自己已经有、需要叠加数值」的属性。两者配合，就能把范围内怪物的特殊属性合并到自身。

## 示例：号角

「号角」的规则是：场上每有一只怪物，自身就获得一份加成。它不关心范围与同类，用常规查询遍历全场即可：

```ts
// [模板] 依赖导入
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { IEnemyCommonQueryEffect } from '@user/data-system';

// [需改] 变量名：同样是常规查询效果对象
const effect: IEnemyCommonQueryEffect<IEnemyAttr, IHeroAttr> = {
    priority: 5, // [需改] 优先级
    // [模板] apply 签名固定
    apply(handler, special, query) {
        // [模板] 必须用 query() 取上下文
        const ctx = query();
        let count = 0;
        // [模板] 遍历全场怪物逐一计数
        for (const _ of ctx.iterateEnemy()) {
            count++;
        }
        // [需改] 修改自身：每有一只怪物，攻击加 special.value 点
        handler.enemy.addAttribute('atk', count * (special.value as number));
    }
};

// [需改] 注册：示例自选 code 42
state.enemyContext.registerCommonQueryEffect(42, effect);
```

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

    // [需改] 查询效果目前没有内置，需要自己在这里注册：
    // ctx.registerCommonQueryEffect(40, effect);
    // ctx.registerSpecialQueryEffect(effect);

    // ...省略：脚本与钩子的注册...
}
```

把注册调用放在这里，查询就会参与构建计算后怪物。
