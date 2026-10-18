# 勇士属性

勇士属性决定战斗数值的最终结果。本篇讲解如何读取基础与最终属性、如何修改基础属性，以及如何用修饰器施加临时或永久的加成。访问勇士属性的入口见[数据端总览](./data-state-overview.md)。

## 基础属性与最终属性

勇士属性（`state.hero.attribute`）区分**基础值**与**最终值**：

- `getBaseAttribute(name)`：基础属性，即未经任何 Buff 或装备加成的原始值；
- `getFinalAttribute(name)`：最终属性，即基础值经所有修饰器加成后的结果。

```ts
const base = state.hero.attribute.getBaseAttribute('atk');
const finalAtk = state.hero.attribute.getFinalAttribute('atk');
```

属性名与勇士属性接口 `IHeroAttr` 的字段一致，常用的有 `hp`、`hpmax`、`atk`、`def`、`mdef`、`money`、`exp` 等。

## 修改基础属性

要修改勇士的基础属性，先取到可修改对象 `getModifiableAttribute()`，再调用：

- `set(name, value)`：直接设置；
- `add(name, value)`：增减；
- `mul(name, value)`：乘以某个数；
- `div(name, value)`：除以某个数。

```ts
const attr = state.hero.getModifiableAttribute();
attr.add('atk', 10); // 攻击 +10
attr.set('hp', 1000); // 生命值设为 1000
attr.mul('money', 2); // 金币翻倍
```

只读访问（只想读取、不加修改）可用 `state.hero.attribute`；需要修改时统一走 `getModifiableAttribute()`。

## 修饰器：数值与百分比加成

直接改基础属性的效果是永久的，它会直接改变勇士数值；而**修饰器**把加成从基础值里独立出来，既可以用于永久加成，也可以用于临时加成——是否临时，取决于你什么时候把它移除。属性包内置了两种：

- `ValueModifier`（type `@system/value`）：数值加减，最终值 = 原值 + 修饰值；
- `PercentageModifier`（type `@system/percentage`）：按**基础值**计算百分比，最终值 = 原值 + 基础值 × 修饰值。

用 `addModifier(name, modifier, save?)` 挂上修饰器，用 `deleteModifier(name, modifier)` 移除（示例里的 `@user/*`、`@motajs/*` 是包名，含义见 [src 导览](./src-tour.md) 的「包从哪来」）：

```ts
import { ValueModifier, PercentageModifier } from '@user/data-base';

const attr = state.hero.getModifiableAttribute();

// 攻击永久 +5：加一个数值修饰器
attr.addModifier('atk', new ValueModifier(5));

// 防御临时 -30%：按基础防御算的百分比修饰器
const defDown = new PercentageModifier(-0.3);
attr.addModifier('def', defDown);

// 需要移除时，传回同一个修饰器对象
attr.deleteModifier('def', defDown);
```

想要一段**临时**加成时，就先 `addModifier(...)` 挂上修饰器，在不再需要时用 `deleteModifier(...)` 把它移除，加成随即消失；反之，只要一直不移除，它就是永久加成。

`PercentageModifier` 的百分比以**基础值**为基数，而非当前最终值，因此多个百分比修饰器不会彼此叠乘。装备产生的加成走的也是同一套修饰器机制，见[勇士装备](./hero-equipment.md)。

## save 参数与读档一致性

`addModifier(name, modifier, save?)` 的 `save` 参数默认为 `true`，表示该修饰器会进入存档、读档后自动恢复；传 `false` 则表示**不进入存档**。

:::warning
当修饰器不进入存档时，读档后它不会自动恢复。此时应由负责分配该修饰器的**外部系统**在读档后重新分配，否则会出现「存档前有加成、读档后消失」的不一致。仅在加成完全由外部系统掌控时才使用 `save: false`。
:::

## 只读与试算

- `getAttribute()`：取只读属性对象，只能读、不能改；
- `getIsolatedAttribute()`：取一份**独立的**属性副本，修改它不会影响勇士本身，适合在不改动实际数值的前提下试算某个效果。

```ts
// 试算：把攻击 +999 后最终攻击会是多少
const trial = state.hero.getIsolatedAttribute();
trial.add('atk', 999);
const preview = trial.getFinalAttribute('atk');
```

## 示例

```ts
// 攻击 +15 永久：直接改基础属性
state.hero.getModifiableAttribute().add('atk', 15);

// 防御 -20% 临时：挂一个百分比修饰器，战斗结束后再删除
const weaken = new PercentageModifier(-0.2);
state.hero.getModifiableAttribute().addModifier('def', weaken);
```

想在属性变化时收到通知，可以用属性钩子族的 `onUpdateAttribute`，见[钩子](./hooks.md)。

> 修饰器的底层原理（修饰器如何参与属性求值、加减乘除类修饰器的组合规则等）会在**高级教程**中讲解（预留标记：`高级教程 · 修饰器原理`）；待高级教程就位后，此处会替换为链接。

<!-- TODO(advanced): 修饰器原理 -->
