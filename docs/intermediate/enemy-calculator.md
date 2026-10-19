# 伤害计算

属性算准之后，战斗还差最后一步换算：这些 `hp`、`atk`、`def` 到底意味着勇士会掉多少血、要打几回合？负责这件事的就是伤害计算器。

它实现的是 `f(enemy, hero)`：输入计算后的怪物与勇士属性，输出 `{ damage, turn }`。本篇导读内置公式，并说明要改公式时应该动哪里。整体流程见[战斗总览](./combat-overview.md)。

## 接口

`IDamageCalculator` 有两个方法：

- `calculate(handler)`：返回 `IEnemyDamageInfoBase`，即 `{ damage, turn }`；
- `getCriticalLimit(handler, attribute)`：返回指定勇士属性进行临界计算时的上界。

`handler` 是 `IReadonlyDamageHandler`，包含：

- `enemy`：计算后的怪物对象；
- `hero`：勇士属性对象；
- `context`：怪物上下文；
- `locator`：怪物位置；
- `state`：数据端状态对象。

注册方式：

```ts
state.enemyContext.getDamageSystem()?.useCalculator(new MainDamageCalculator());
```

`initializeEnemy` 在创建 `DamageSystem` 后就调用了 `useCalculator(new MainDamageCalculator())`，因此默认使用内置公式。

:::warning 计算器必须无副作用
计算器在一次战斗里会被**反复调用**：算临界值要二分十几次，渲染伤害数值、图鉴与提示等也可能在真正开打前各调用一次。因此它**必须只读输入、算出结果，不能改动任何外部状态**——不能写 flag、不能删 flag，也不能改怪物或勇士对象。只要存在副作用，同一只怪物在不同时刻就会算出不同结果，临界与显示都会错乱。需要「一次性」生效的状态，请放到别处去改（战斗脚本、钩子等），计算器只负责读取。
:::

### 改内置，还是自己写

- **改内置公式**：直接在 `src/data/enemy/calculator.ts` 的 `MainDamageCalculator.calculate` 里改公式或加分支。多数「调参类」属性（先攻、连击、破甲等）都实现在这里。
- **写自己的计算器**：实现 `IDamageCalculator` 接口，再用 `useCalculator` 替换。适合整条公式都要换、或不想改动内置文件时。

两者只能二选一：`useCalculator` 是**替换**当前计算器，选了自己的就会把内置的整个换掉，内置的那些分支需要你在自己的 `calculate` 里重新保留。

## 内置公式逐段导读

与其一次背下整条公式，不如按顺序看每一段在算什么。`MainDamageCalculator.calculate`（`src/data/enemy/calculator.ts`）按以下顺序计算：

1. **读取属性**：从 `hero` 读 `hp`、`atk`、`def`、`mdef`，从 `enemy` 读 `atk`、`def`、`hp`。
2. **无敌分支**：满足条件时直接返回 `{ damage: Infinity, turn: 0 }`，表示无法击败。
3. **勇士每回合伤害**：`atk - monDef`。如果小于等于 0，同样返回 `Infinity`。
4. **吸血**：按勇士生命值比例增加伤害，必要时把伤害加到怪物生命上。
5. **怪物每回合伤害**：`monAtk - def`；魔攻时忽略勇士防御；连击则乘以攻击次数。
6. **回合数**：`turn = ceil(monHp / heroPerDamage)`。
7. **支援**：怪物带有支援者时，递归计算每个支援者的伤害与回合数，并把它们累加到当前怪物上。
8. **先攻、破甲、反击、净化**：按各自规则增加伤害或每回合伤害。
9. **总伤害**：`damage += (turn - 1) * enemyPerDamage`，再减去魔防；未开启负伤时，负伤害归零。
10. **固伤、仇恨、自爆**：固伤与仇恨不受魔防影响；自爆把伤害抬到「勇士生命 - 1」。
11. **返回**：`damage` 向下取整，连同 `turn` 一起返回。

「加自己的属性加在哪一步」取决于你想改什么：

- 只是让怪物某项属性更高：不要改计算器，放进光环、查询或最终效果，让 `enemy.getAttribute(...)` 读到新值即可；
- 要让属性按回合数累积、按条件改变倍率、或增加新的伤害分支：在 `calculate` 的对应段落里改公式；
- 只是给勇士一侧加临时数值：用[勇士属性](./hero-attribute.md)里的修饰器，计算器会自动读到最终属性。

## 支援怪

支援怪部分的递归计算较绕：计算当前怪物时，会把每个支援者的回合数与伤害也加进来。初次阅读可以暂时跳过这一段，不影响自定义普通怪物的公式；等需要处理支援组合时再回来看。

## 示例：等差数列属性

有时公式本身要随回合变化，而光环、查询、最终效果都做不到这一点——它们改的是一次计算里的固定属性。这时就该动计算器。

「等差数列属性」指怪物攻击每回合按固定值递增。属性本身在一次计算中是常量，所以不能靠给 `atk` 加值实现；要在 `calculate` 里把「每回合伤害」按等差数列求和：

示例里的 `@motajs/*`、`@user/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」。下面用 `[模板]` 标出可原样照抄的行，用 `[需改]` 标出必须按需求改的行。

**目标**：让怪物的每回合伤害按固定公差逐回合递增（本示例公差为 5）。

**改哪里**：`src/data/enemy/calculator.ts` 的 `MainDamageCalculator.calculate`（改内置），或另建文件写一个计算器再用 `useCalculator` 替换。

**复制什么**：下面是只保留本示例所需分支的最小计算器——

```ts
// [需改] 类名：换成你自己的计算器名
export class ArithmeticCalculator implements IDamageCalculator<
    IEnemyAttr,
    IHeroAttr
> {
    // [模板] calculate 签名固定：读 handler 里的 enemy 与 hero，返回 { damage, turn }
    calculate(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>
    ): IEnemyDamageInfoBase {
        // [模板] 取出只读的怪物与勇士对象（只读，供读取，不可改写）
        const { enemy, hero } = handler;
        // [模板] 勇士每回合对怪物造成的伤害 = 勇士攻击 - 怪物防御
        const heroPerDamage =
            hero.getFinalAttribute('atk') - enemy.getAttribute('def');
        // [模板] 打不动（≤ 0）时返回 Infinity，表示无法击败
        if (heroPerDamage <= 0) {
            return { damage: Infinity, turn: 0 };
        }

        // [模板] 回合数 = 怪物血量 / 每回合伤害，向上取整
        const turn = Math.ceil(enemy.getAttribute('hp') / heroPerDamage);
        // [需改] 怪物每回合的基础伤害：这里按「怪物攻击 - 勇士防御」并最低取 0
        const base = Math.max(
            0,
            enemy.getAttribute('atk') - hero.getFinalAttribute('def')
        );
        // [需改] 公差：每回合递增的伤害（本示例固定为 5）
        const step = 5;

        // [需改] 等差数列求和：首项 base，公差 step，共 turn 项
        const damage = turn * base + (step * turn * (turn - 1)) / 2;
        // [模板] 返回结果，damage 向下取整
        return { damage: Math.floor(damage), turn };
    }

    // [模板] getCriticalLimit 的签名同样是固定的：这里直接返回勇士当前最终值
    getCriticalLimit(
        handler: IReadonlyEnemyHandler<IEnemyAttr, IHeroAttr>,
        attribute: CriticalableHeroStatus<IHeroAttr>
    ): number {
        return handler.hero.getFinalAttribute(attribute);
    }
}
```

> 复制说明：片段已省略 `import`；文件顶部通常已有，不要再粘。若编辑器提示缺少某个名字，再在顶部补对应的 `import`（详见 [代码基础](./code-basics.md) 的「照抄教程里的代码时，怎么处理 import」）。

**改什么**：`step`（公差，本示例为 `5`）与 `base` 的算法换成你要的递增规则；换算成「改内置」时，把这段逻辑并入 `calculate` 的对应段落即可。

**怎么验证**：给怪物挂上后开战，看显示的回合伤害是否随回合数按公差递增、总伤害是否等于求和结果。

**注意**：这是只保留本示例分支的最小计算器；若用 `useCalculator` 替换，内置的无敌、吸血、支援等分支需要你按上文顺序自行保留。计算器**必须无副作用**（见上方 warning）。

## 临界

临界计算回答「勇士某项属性提高到多少时，战斗结果会发生变化」。相关接口：

- `getCriticalLimit(handler, attribute)`：返回该属性的计算上界；
- `calculateViewCritical(enemy, attribute, precision?)` 与 `calculateEnemyCritical(...)`：伤害系统上的临界计算方法，返回 `IEnemyCritical` 的生成器；
- `CriticalableHeroStatus<THero>`：只允许数值类型的勇士属性，例如 `atk`、`def`、`hp`。

内置 `getCriticalLimit` 对 `atk` 的处理是：怪物有坚固时返回 `Infinity`，否则返回 `def + hp`；其他属性直接返回勇士当前最终值。

现有约定是**伤害值随属性提高单调递减**。临界值唯一依赖「最后的伤害值」，因此公式不单调也能运行，只是算出的临界点不准。写自定义公式时尽量保持单调，临界结果才有意义。
