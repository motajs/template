# Anon-Tokyo 解释器

事件脚本在数据里不是一段字符串，而是结构化的语句数组。解释器把语句数组编译成可执行程序，再由迭代器逐步求值。数据端只负责把事件对象交给它，编译产物会被事件对象缓存。

本篇讲这个模型：语言特性、编译产物、执行上下文与迭代器；事件怎么收集、触发器怎么过滤见[事件系统](./event-system.md)。脚本语法与解析器内部不在本篇范围。

## 系统模型

| 角色                        | 职责                                   |
| --------------------------- | -------------------------------------- |
| `LanguageFeature`           | 语言特性：内建函数表与全局函数表       |
| `AnonTokyoInterpreter`      | 注册函数、把语句编译成程序、执行程序   |
| `AnonTokyoExecutable`       | 编译产物：程序节点序列，可直接执行     |
| `AnonTokyoExecutionContext` | 一次执行的调用栈与环境                 |
| `AnonTokyoIterator`         | 执行循环：反复求值当前节点             |
| `Statement` / `Block`       | 语句与语句数组                         |
| `Scope`                     | 每次求值时可见的作用域                 |
| `OP`                        | 节点返回的操作：前进、调用、返回、退出 |

一次执行的模型如下。语言特性先交给解释器，解释器据此编译语句；每次执行都会新建上下文，上下文里保存调用栈与环境，迭代器在上下文中逐步推进。

```text
LanguageFeature（builtInFunctions + globalFunctions）
        │  构造解释器
        ▼
AnonTokyoInterpreter ──compile(script)──> AnonTokyoExecutable（程序节点）
        │                                       │ exec(parameters, env)
        │                                       ▼
        └──exec(script, parameters, env)──> AnonTokyoExecutionContext（调用栈 + env）
                                                │
                                                ▼
                                        AnonTokyoIterator（反复求值当前节点）
```

## 语句模型

脚本是一个 `Statement[]`。语句种类由 `StatementType` 枚举列出：

| 种类              | 形状与作用                                  |
| ----------------- | ------------------------------------------- |
| `Expression`      | 执行一个表达式，不改变控制流                |
| `Call`            | 按名字调用内建函数或全局函数                |
| `Return`          | 记录返回值并结束当前程序                    |
| `If`              | 按条件选择分支                              |
| `Switch`          | 按模式匹配选择分支                          |
| `Loop`            | 循环：初始化、条件、迭代器与循环体          |
| `Break`           | 跳出循环，可带标签                          |
| `Continue`        | 进入下一次循环                              |
| `Block`           | 块：语句数组，用 `Block = Statement[]` 表示 |
| `Exit`            | 直接结束整个执行                            |
| `FunctionDeclare` | 函数声明：语句种类枚举中的一项              |

块不是独立对象，而是语句数组；函数声明只出现在语句种类枚举里，可执行语句联合类型没有对应成员。

表达式是接收 `Scope` 并返回值的函数；值可以是字面量，也可以是表达式。`Scope` 分三层：

| 层      | 内容                             |
| ------- | -------------------------------- |
| `args`  | 调用时传入的参数                 |
| `local` | 当前程序运行期的局部变量         |
| `env`   | 调用链共享的环境，由事件系统传入 |

每个执行节点返回一种操作，迭代器据此决定下一步：

| 操作     | 含义                         |
| -------- | ---------------------------- |
| `Move`   | 跳到下一个节点               |
| `Call`   | 按名字调用全局函数，然后继续 |
| `Return` | 记录返回值并结束当前程序     |
| `Exit`   | 结束整个执行，不记录返回值   |

这一段只讲形状，不展开解析器如何把语句变成节点。

## 与事件对象的衔接

`GameEvent` 持有原始语句 `rawEvent` 与编译产物 `compiled`。`compile()` 调解释器编译并缓存；`execute(param, env)` 优先用缓存，没有缓存时先编译；如果编译函数返回空，则退回 `interpreter.exec(rawEvent, param, env)` 直接执行原始语句。`setRaw` 替换原始语句时会清空缓存，下一次执行重新编译。

解释器本身不判断触发器、不收集坐标、不查事件仓库。这些都在事件系统里：收集器产出调用列表，执行器比较 `event.trigger` 与 `env.trigger` 后才调用 `event.execute`。因此同一个解释器可以被多个事件对象共享，编译缓存也各归各的事件对象。

## 内部实现：编译与执行

此章节讲解一下 Anon-Tokyo 的执行循环的内部实现。

编译期做两件事：把语句分析成程序节点，并按名字解析内建函数。内建函数在编译时查表，名字不存在会直接抛错；全局函数在解释器构造时先编译成程序，调用时再按名字查表，名字不存在也会直接抛错。

运行期从 `exec` 开始：为一次执行创建上下文，上下文持有调用栈与环境；执行程序时创建迭代器，迭代器反复求值当前节点，并根据节点返回的操作推进。`Call` 会把新的迭代器压栈，执行完再弹栈；`Return` 记录返回值；`Exit` 结束整个执行。程序自然走完时按隐式返回处理。

下面这个例子把同一段脚本编译一次，再执行多次：

```ts
import {
    AnonTokyoInterpreter,
    Scope,
    Statement,
    StatementType
} from '@motajs/anon-tokyo';

// 内建函数：打印传入的值，不返回值
const logValue = {
    name: 'logValue',
    func: (param: { value: number }) => {
        console.log('value =', param.value);
    }
};

// 解释器：内建函数在这里注册，全局函数表为空
const interpreter = new AnonTokyoInterpreter({
    builtInFunctions: [logValue],
    globalFunctions: []
});

// 脚本：先调用内建函数，再把参数乘二返回
const script: Statement[] = [
    {
        type: StatementType.Call,
        functionName: 'logValue',
        builtIn: true,
        parameters: {
            // 参数可以是字面量，也可以是接收 Scope 的表达式
            value: (scope: Scope) => scope.args.value
        }
    },
    {
        type: StatementType.Return,
        // 返回值同样可以来自表达式
        value: (scope: Scope) => scope.args.value * 2
    }
];

// 编译一次：内建函数名字写错会在这里抛错
const executable = interpreter.compile(script);

// 执行多次：每次都会创建新的执行上下文，args 互不影响
console.log(await executable.exec({ value: 10 }, {})); // 20
console.log(await executable.exec({ value: 21 }, {})); // 42
```

编译只做一次，执行上下文每次新建；这就是事件对象缓存 `compiled` 的意义：同一事件反复触发时不必重复编译。

## 自定义内建函数与全局函数

解释器的语言特性由 `LanguageFeature` 描述：

| 字段               | 内容                                                   |
| ------------------ | ------------------------------------------------------ |
| `builtInFunctions` | 内建函数表：每个项有 `name` 与 `func(parameters, env)` |
| `globalFunctions`  | 全局函数表：名字 → 语句数组，构造解释器时编译          |

内建函数是事件脚本最常用的扩展点。完整的类写法、参数接口与注册路径见[事件系统](./event-system.md#自定义一个内建函数)，本篇不重复示例。

数据端当前把 `config.events` 作为内建函数表，并把全局函数表传为空数组。全局函数允许脚本按名字调用另一段语句；需要时由创建解释器的一方提供，当前数据端没有使用。

## 边界与注意

- **缺少内建函数会在编译时抛错**：名字不存在时，`compile` 直接抛错。
- **缺少全局函数会在调用时抛错**：名字不存在时，执行到 `Call` 才抛错。
- **语句是结构化对象**：不是可解析的字符串，不要把脚本当文本再解析一遍。
- **作用域三层不要混用**：参数放 `args`，局部变量放 `local`，跨调用共享的上下文放 `env`。
- **`Exit` 与 `Return` 语义不同**：前者结束整个执行且不记录返回值，后者记录并返回一个值。
- **执行上下文没有导出能力**：没有可用的导出或转储功能，不要依赖它做调试快照。
- **可选字段当前没有额外语义**：内建函数上的 `save` 字段不要被当成存档或录像开关。
- **编译产物属于事件对象**：修改原始语句后必须重新编译，`setRaw` 会清空缓存。
- **解释器不负责派发**：触发器过滤与坐标收集在事件系统，不在解释器。

相关背景可看[高级 I 的 data-common Store](../i/data-stores.md)与[中级教程的自定义事件](../../intermediate/events.md)。

返回[高级 III 导览](./index.md)。
