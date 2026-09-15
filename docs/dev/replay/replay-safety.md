# 需求综述

录像系统依赖作者在各逻辑系统中手动调用 `record`，这一依赖关系使得录像极易因疏忽而失效。需要一种机制来检测这类失效。

# 需求理解

## 明确需求

1. 录像存在失效风险。录像能否正确还原游戏流程完全取决于作者是否在每个状态修改处都调用了 `record`，遗漏是不可避免的风险。

## 隐含需求

1. 检测不能误报。系统内部的状态修改（如战斗结算中的属性计算）不应被检测为遗漏——只有从玩家操作入口派生的修改才需要检测。
2. 播放时同样需检测。沙箱播放期间原始录像系统重新录制用于交叉验证——如果播放逻辑存在遗漏，同样应被检测到。

# 设计前提

1. 已知方案。`@shouldReplay` 标记影响状态的方法，`@ignoreReplay` 标记特定的延迟或被动代码路径，`begin`/`end` 界定检测区间。以下设计基于此方案推导。

# 核心概念定义

## 检测区间

由一对 `begin`/`end` 调用界定的代码执行范围。区间内收集标记，结束时比较区间前后的录像步数变化，结合标记信息决定是否告警。

## 状态影响标记

数据端方法上的 `@shouldReplay` 修饰器。表示此方法的调用应伴随录像步的写入——它是系统判断"此处有状态修改"的唯一依据。

## 检测抑制标记

特定方法上的 `@ignoreReplay` 修饰器。某些场景中，`@shouldReplay` 方法确实被调用，但录像步的写入发生在此区间之外（如异步回调中），不加抑制会误报。它不应用于所有渲染端交互函数——那样系统永不会告警。

# 接口设计分析

## 检测体系

### 设计思路

由于录像失效来源于作者忘记 `record`，而系统无法自动区分"状态修改来自玩家操作"还是"系统内部结算"——计算机不可能判断一次属性修改是玩家打怪触发的还是战斗计算过程——因此必须由作者显式标注哪些方法会影响状态。由此设计 `@shouldReplay` 修饰器。

标注了哪些方法会影响状态之后，还需要界定"在什么范围内检测"。一次玩家操作可能触发若干 `@shouldReplay` 方法——它们应当在同一区间内被收容，区间结束时统一评判。因此需要 `beginReplaySafetyCollection` 和 `endReplaySafetyCollection`。区间需要知道录像是否增长——`begin` 接收 `IReplaySystem` 参数以记录初始步数。

仅有标注和区间还不够——有些代码路径中 `@shouldReplay` 方法确实会被调用，但录像步的写入并不在当前区间内完成。例如玩家点击购买道具，购买逻辑触发属性修改（`@shouldReplay`），但对应的 `record` 在异步事件处理中延迟执行。若不加抑制，这些场景都会误报。因此需要 `@ignoreReplay` 修饰器，标记此类延迟或被动触发路径。

### 接口分析

- 修饰器 `@shouldReplay(description: string)`：预期频率**中频**。每个影响状态的方法标注一次。
- 修饰器 `@ignoreReplay(description: string)`：预期频率**中频**。每个需抑制误报的方法标注一次。
- 函数 `beginReplaySafetyCollection(replay: IReplaySystem): void`：预期频率**低频**。仅出现在渲染端交互入口和沙箱播放循环两处。
- 函数 `endReplaySafetyCollection(): void`：预期频率**低频**。与 `begin` 配对。

### 预期体量

预期代码体量 50 行。

- 修饰器工厂各 10 行。
- `begin`/`end` 及区间管理预期 30 行。

---

# 实现思路

## 检测流程

1. 渲染端交互入口调用 `beginReplaySafetyCollection(replay)`。
2. 代码执行——`@shouldReplay` 和 `@ignoreReplay` 修饰的方法被调用时向区间注册标记。
3. 调用 `endReplaySafetyCollection()`，检查：有 `@shouldReplay` 标记、无 `@ignoreReplay` 标记、步数未增 → 警告。
4. 沙箱每步包裹 `begin`/`end`，用于交叉验证。

# 涉及文件

## `@user/data-common/src/replay/safety.ts`

- [ ] 编写 `shouldReplay` 和 `ignoreReplay` 修饰器工厂
- [ ] 编写 `beginReplaySafetyCollection` 和 `endReplaySafetyCollection` 函数

# 待确认问题

无。
