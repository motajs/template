# 代码基础

你不需要成为程序员，也能读懂并改写本引擎的大部分内容：真正会用到的语法并不多。本篇用尽量简短的方式，补齐写中级教程所需的最小语法与类型知识——即使你只懂一点代码，也能跟着走完。已有 JavaScript / TypeScript 基础的话，可以快速跳过对应小节。

## 一、简明语法

先认识四种最常见的写法：变量、函数、分支与循环、对象与数组。会用它们，就能表达大多数「让游戏做点什么」的需求。

### 变量

```ts
// let 声明之后可以重新赋值的变量
let count = 0;

// const 声明之后不再重新赋值的变量
const name = 'hero';

count = count + 1;
```

### 函数

```ts
// 函数接收参数，返回结果
function add(a: number, b: number): number {
    return a + b;
}

// 箭头函数是函数的简写形式
const double = (n: number) => n * 2;
```

### 分支与循环

```ts
if (count > 0) {
    // 条件成立时执行
} else {
    // 条件不成立时执行
}

for (const item of items) {
    // 逐个处理 items 中的每一项
}
```

### 对象与数组

```ts
// 对象：一组有名字的字段
const hero = { hp: 100, atk: 10 };

// 数组：一串有序的值
const skills = ['a', 'b', 'c'];

hero.atk = hero.atk + 5;
```

## 二、模块与引入

当代码变多，就要拆成多个文件。一个文件就是一个模块：用 `export` 把内容暴露出去，用 `import` 从别的模块引入。

```ts
// math.ts
export function add(a: number, b: number): number {
    return a + b;
}

export const PI = 3.14;
```

```ts
// app.ts
import { add, PI } from './math';

add(1, PI);
```

也可以整体引入：

```ts
import * as math from './math';

math.add(1, 2);
```

### 照抄教程里的代码时，怎么处理 import

本教程其余篇章给出的都是**要粘进你文件的代码片段**。为了不啰嗦，片段里一律**不写 `import`**——照着下面三步处理即可：

1. **直接粘片段**。你所在文件的顶部通常**已经有**这些引入，不用再粘一遍；
2. 粘完若编辑器提示「找不到名称 Xxx」，说明这个文件还没引入它，再回到**文件顶部**补一行对应的 `import`（写法同上面的 `import { add } from './math'`）；
3. 不确定某个名字该从哪个包装入，看 [src 导览](./src-tour.md#包从哪来-src、packages-user-与-packages) 的「包从哪来」。

不要把片段里没出现的 `import` 也一并照抄，重复引入反而会让编辑器报错。

## 三、类型入门

TypeScript 在 JavaScript 之上增加了类型，用来描述「这份数据长什么样」。类型会在编写与编译阶段被检查，帮你在运行之前就发现错误。

### 基础类型

```ts
let n: number = 1;
let s: string = 'text';
let b: boolean = true;
```

### 接口

当一份对象有固定的形状时，用 `interface` 描述它。声明好接口之后，就可以把一个符合该形状的对象标注为这个类型。

```ts
interface Hero {
    hp: number;
    atk: number;
}

const hero: Hero = { hp: 100, atk: 10 };
```

### 泛型：类型的「函数」

如果觉得「类型」本身有点抽象，可以这样理解泛型：普通函数接收**值**、返回**值**；泛型则接收**类型**、返回**类型**，相当于一个「类型的函数」。尖括号里的 `T` 是一个类型参数，调用时才确定具体是什么类型。

```ts
// T 是类型参数，取什么类型由调用时传入的值决定
function first<T>(list: T[]): T {
    return list[0];
}

const a = first([1, 2, 3]); // T 被推断为 number，a 的类型是 number
const b = first(['x', 'y']); // T 被推断为 string，b 的类型是 string
```

### 接口与实现：一种约定

本引擎大量使用 `interface` 描述接口，再让类去 `implements` 它，以此保证类实现了接口要求的所有内容。

```ts
interface Runner {
    run(): void;
}

class FastRunner implements Runner {
    run(): void {
        // 具体实现
    }
}
```

这是一种**建议但非强制**的约定：遵循它能让代码结构更清晰、类型更可靠；不遵循也不会导致程序出错。

### 装饰器

有时你会看到某个类或方法上方单独写着一行 `@名字(...)`，例如：

```ts
class Service {
    @shouldReplay('移动')
    move() {
        // ...
    }
}
```

这种以 `@` 开头的写法叫**装饰器（decorator）**：它像给方法贴一张标签，用来给这个方法附加额外的信息或行为，方法本身的代码不用改。本引擎只在少数地方（如录像安全检测）用到它，遇到时照着写即可。

## 进一步学习

本篇只覆盖了编写本引擎所需的最小语法。如果你想系统学习 JavaScript / TypeScript，下面这份教程更适合本引擎的作者：

[JavaScript / TypeScript 教程](https://h5mota.com/bbs/thread/?tid=1018&p=3#p41)

写代码时该把文件放到哪里，见 [src 导览](./src-tour.md)。
