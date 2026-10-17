# 特殊属性

一只怪物的基础属性决定它「有多少血、多少攻防」。但魔塔里的怪物往往还会做别的事：先手攻击、一回合打两下、给周围的怪物加成……这些「还会做什么」就记在特殊属性里。

每个特殊属性就是一个数字 `code` 加一份可选参数 `value`。`code` 说明这是哪一种机制，`value` 保存它的参数；没有参数的属性，`value` 为空。先攻、连击、坚固、光环、中毒都是这样挂到怪物身上的。

访问怪物特殊属性的入口见[战斗总览](./combat-overview.md)。

## 在数据里的样子

数据端的怪物对象（`IReadonlyEnemy`）提供三个读取接口：

- `getSpecial<T>(code)`：取指定 code 的特殊属性对象，没有则返回 `null`；
- `hasSpecial(code)`：判断是否拥有指定特殊属性；
- `iterateSpecials()`：迭代全部特殊属性。

每个特殊属性对象实现 `ISpecial<T>`，常用成员是 `code`、`value` 与 `getDescription()`：

```ts
const multiHit = enemy.getSpecial<number>(4);
if (multiHit) {
    // 连击的 value 是每回合攻击次数
    console.log(multiHit.value);
}

if (enemy.hasSpecial(3)) {
    // 坚固：只看有没有，不读参数
}
```

`ISpecial` 还提供 `setValue` / `getValue`、`getSpecialName` / `getNameColor`、`clone` 与 `deepEqualsTo`。需要修改怪物时用 `IEnemy` 的 `addSpecial` / `deleteSpecial`，不要直接改 `value` 后忘记刷新上下文。

## 两类定义

写一条特殊属性时，先问自己一个问题：这个机制需要参数吗？答案不同，使用的工厂函数也不同。

内置特殊属性在 `src/data/enemy/special.ts` 的 `createSpecials(state)` 中定义，使用两个工厂函数：

- `defineNonePropertySpecial(code, config)`：无参数，`value` 为 `void`，适合先攻、魔攻、坚固、模仿这类纯机制；
- `defineCommonSerializableSpecial<T>(code, defaultValue, config)`：有参数，参数会进入存档，适合连击、破甲、光环这类需要数值描述的效果。

`config` 的 `name`、`desc`、`color` 都可以写成字符串，也可以写成 `(special) => string` 的函数。需要根据参数变化显示不同文字时，就写成函数：

```ts
// 无参：坚固
map.set(
    3,
    defineNonePropertySpecial(3, {
        name: '坚固',
        desc: '怪物防御不小于勇士攻击-1。',
        color: '#C0B088'
    })
);

// 有参：n连击，默认 2 次
map.set(
    4,
    defineCommonSerializableSpecial(4, 2, {
        name: special => `${special.value}连击`,
        desc: special => `怪物每回合攻击${special.value}次。`,
        color: '#FE7'
    })
);
```

参数可以不只是数字。比如吸血用对象保存比例与是否加到自身：

```ts
/** 9 - 吸血 */
export interface ISpecial9Value {
    /** 吸血比例 */
    vampire: number;
    /** 是否加到自身生命值上 */
    add: boolean;
}

map.set(
    9,
    defineCommonSerializableSpecial<ISpecial9Value>(
        9,
        { vampire: 0, add: false },
        {
            name: '吸血',
            desc: special => `战斗前吸取勇士${special.value.vampire}%生命。`,
            color: '#DD4448'
        }
    )
);
```

## 自定义一个新特殊属性

当你需要引擎里没有的机制时，就新增一条特殊属性。以「每回合给勇士造成固定伤害」为例（假设使用 code 50）：

1. **选一个未使用的 code**。先搜一遍 `special.ts` 中已有的 `map.set(...)`，确认没有冲突。
2. **有参数时定义参数接口**。在文件顶部 `//#region 复合属性值类型` 内声明 `ISpecial50Value`，并在接口前写 `/** 50 - 属性名 */`。
3. **在 `//#region 属性定义` 内注册**。每条定义前写 `// 50 - 属性名`，再用 `map.set(50, define...)` 添加。
4. **实现效果**。按下方「属性实现位置」表，把效果写进对应的计算器、光环、地图伤害或钩子；如果不属于现有分类，再考虑新增对应的转换器 / 效果 / 钩子。
5. **刷新上下文**。修改怪物模板或新增属性后，调用 `state.enemyContext.markDirty(view)` 标记脏数据，必要时调用 `state.enemyContext.buildup()` 全量重建计算后怪物。

```ts
// 50 - 灼烧
map.set(
    50,
    defineCommonSerializableSpecial(50, 0, {
        name: '灼烧',
        desc: special => `每回合对勇士造成${special.value}点伤害。`,
        color: '#F80'
    })
);
```

`createSpecials(state)` 返回 `Map<number, SpecialCreation<any>>`。`initializeEnemy` 会遍历这个 Map，逐个调用 `state.enemyManager.registerSpecial(code, cons)`，所以新增属性只要放进这个 Map 就会完成注册。

## 属性实现位置

注册只是让引擎认识这条属性，真正让它生效的代码在别处。`special.ts` 顶部的注释给出了内置属性的实现分工。新增属性时按这张表找落点：

| 属性类型 | 实现位置 | 说明 |
|----------|----------|------|
| 调参类（先攻、魔攻、连击、破甲、反击、净化、固伤、仇恨、自爆等） | `src/data/enemy/calculator.ts` 的 `MainDamageCalculator.calculate` | 只改变伤害公式的结果 |
| 坚固、模仿 | `src/data/enemy/final.ts` 的 `MainEnemyFinalEffect.apply` | 只修改怪物自身基础属性 |
| 领域、夹击、阻击、激光、伏击 | `src/data/enemy/mapDamage.ts` | 伤害视图 + 转换器 |
| 光环、支援、特殊光环 | `src/data/enemy/aura.ts` | 光环视图 + 转换器 |
| 中毒的每步效果 | `src/data/enemy/hook.ts` 的 `EnemyMoveHooks.handlePoison` | 移动钩子 |
| 中毒的瞬移效果 | `src/data/enemy/hook.ts` 的 `EnemyPathfindingHooks.handlePoison` | 寻路钩子 |
| 衰弱 | `src/data/enemy/hook.ts` 的 `EnemyCombatHooks.onAfterCombat` | 战后钩子 + 修饰器 |
| 重生 | `src/data/enemy/hook.ts` 的 `EnemyCombatHooks.onAfterCombat` 与 `EnemyChangeFloorHooks.onSetFloor` | 两个钩子协同 |

具体实现方式分别见[怪物光环](./enemy-aura.md)、[伤害计算](./enemy-calculator.md)、[地图伤害](./enemy-map-damage.md)与[状态钩子](./enemy-status-hooks.md)。

## 编辑器识别约定

`special.ts` 里的部分注释是编辑器的识别模式，删除后编辑器可能无法识别属性。新增属性时保持以下写法：

- 属性定义前写 `// {code} - {name}`，例如 `// 50 - 灼烧`；
- 参数接口前写 `/** {code} - {name} */`，例如 `/** 50 - 灼烧 */`；
- 参数接口名必须是 `ISpecial{code}Value`，例如 `ISpecial50Value`；
- `//#region 复合属性值类型` 与 `//#region 属性定义` 这两行标记不能删除。

:::warning
`special.ts` 顶部的注释明确说明这些注释会被编辑器读取。修改属性定义时不要顺手删掉 `#region` 标记或 `// {code} - {name}` 注释。
:::

## 怪物比较

`MainEnemyComparer.compare` 负责判断两个怪物是否相同：先比较 `hp`、`atk`、`def`、`money`、`exp`、`point`，再逐个比较特殊属性的 `deepEqualsTo`。它用于怪物模板的脏数据判断。一般不需要改；只有当你希望「两个怪物是否视为同一模板」的判定标准发生变化时，才替换比较器。
