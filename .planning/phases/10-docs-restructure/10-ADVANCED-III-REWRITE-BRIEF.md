# 高级 III 重写简报（Phase A）

> 只做阅读、分析与重写设计；没有修改 `docs/` 或源码，没有派发子代理，没有调用 `opencode`，没有提交。
>
> 阅读量：中级教程 25 篇、高级教程 28 篇（总导览 1 + 高级 I 9 + 高级 II 10 + 高级 III 8）、规划与规范 6 份（`AGENTS.md`、`dev.md`、`10-CONTEXT.md`、`10-ADVANCED-III-RESEARCH.md`、`10-40-READER-REVIEW.md`、`10-41-PLAN.md`），以及约 59 个源码、配置与测试文件；合计约 118 个文件。源码覆盖 replay、event、anon-tokyo、path、map、hero、data-state、loader、save 与相关测试。

---

## 0. 现状判断

### 0.1 工作区里的高级 III 是一次回退式改写

`git diff --stat -- docs/advanced/iii` 覆盖八页，合计 `593 insertions, 1017 deletions`；其中七篇目标页是主要压缩来源：

| 页面 | HEAD 行数（约） | 当前行数 | 被删掉的结构 |
| --- | --- | --- | --- |
| `core-state.md` | 195 | 66 | 加载管线、存档挂载、第二个实例、内部实现：装配顺序 |
| `passability-and-pathfinding.md` | 249 | 179 | 同一契约、两个实例；勇士移动的三种结果；系统层做什么 |
| `replay-internals.md` | 约 230 | 142 | 存档形状；内部实现：三块缓冲区；内部实现：索引与读流 |
| `event-system.md` | 约 280 | 151 | 收集章节的完整 env 表与示例；执行器的录像标记 |
| `anon-tokyo.md` | 约 190 | 124 | 与事件对象的衔接；内部实现：编译与执行 |
| `plugin-internals.md` | 约 150 | 124 | 三阶段的依赖参数与等待语义细节；失败模式的展开 |
| `index.md` | 约 110 | 42 | 读者画像、与 I/II 的区别、不覆盖范围、自检 |

这不是「某一段写错」，而是把有模型、有理由、有例子的页面改成了接口清单。用户说的「只读局部代码就改」，在这批改写里表现为：保留了当前类名与方法表，删掉了需要跨文件理解才能写出的设计段落。

### 0.2 重写目标

七篇目标页（`index`、`replay-internals`、`event-system`、`anon-tokyo`、`passability-and-pathfinding`、`core-state`、`plugin-internals`）按高级 I 的库文档风格重写：先模型，再数据流，再接口，再一个完整示例，最后边界；`loading-system.md` 是用户认可的样板，只作为参照，不在本次重写范围。

---

## A. 风格分析：中级与高级 I/II 到底怎么教

### A1 中级教程的写法

中级篇目的共同结构是「场景开场 → 分清概念 → 接口 → 一个任务型示例 → 常见注意 → 下一篇」。具体特征：

1. 开场先给一个玩家能感知的场景。`combat-overview.md` 从「点一下怪物，勇士走过去、挥几刀」开始；`replay-commands.md` 从「录像验证要能重放出和原来一模一样的结果」开始。场景之后立刻说明「本篇讲什么、不展开什么」。
2. 先分清楚概念，再给接口。`hero-equipment.md` 先分「装备槽」与「装备实例仓库」；`enemy-specials.md` 先分「code 与 value」「无参 / 有参」；`enemy-aura.md` 先分「转换器 / 视图 / 优先级」。
3. 示例是任务型的，不是接口演示。每篇都有「目标 / 改哪里 / 复制什么 / 改什么 / 怎么验证 / 注意」六段（D-48），示例完整、可粘贴，注释解释每一行。
4. 「为什么」用短段落讲，不写成源码分析。`combat-overview.md` 的「为什么分四步」用装配零件的类比；`enemy-final.md` 用「读取外部 / 影响外部」的二维表解释为什么没有混合效果。
5. 边界集中在文末。每篇末尾列 3–6 条真实易错点，不在正文里到处插警告。
6. 大量使用对照表。四类道具、五种地图伤害、光环 / 查询 / 最终三方对比、脚本 vs 钩子，都是「同一维度的几个选项」压成一张表。

### A2 高级 I 的写法

高级 I 是重写时最应该模仿的层，因为它已经脱离「六步实操」，但仍然对读者友好：

1. 开篇先给一个真实工程问题。`plugin-system.md` 从「假设你要加一个任务系统，不做成插件，代码会散在几个地方」开始；`saveable-content.md` 从「存档不是把内存倒进文件，而是状态快照」开始；`mover.md` 从「移动器把想怎么走和实际怎么走拆开」开始。
2. 先给角色表，再给流程图，再逐项解释。`plugin-system.md` 的角色表是「插件 / 依赖 / 三时机」；`mover.md` 的角色表是 `IObjectMovable` / `IObjectMover` / `IMoverController`；`face-handler.md` 的角色表是五个组件。
3. 强调「分工」与「不变量」。`declarative-vs-imperative.md` 用「执行时机由谁决定」贯穿全篇；`saveable-content.md` 反复强调「只存重建必需的数据」「返回值必须独立」「读档顺序不保证」；`mover.md` 反复强调「移动器只算落点，不判断通行」。
4. 示例是完整类或完整函数，注释很密。`saveable-content.md` 给 `MySaveable`、`MyPlugin` 两个完整类；`mover.md` 给完整的 `SimpleMover`；`face-handler.md` 给完整的 `HexFaceHandler`。
5. 「为什么这样设计」集中成段。`plugin-system.md` 的生命周期一节先给时间线，再解释每个时机为什么不能互换；`mover.md` 的「边界与注意」把「start 返回 null 时步骤还在队列里」「执行期间链式方法无效」讲成因果，而不是命令。
6. 边界与小结分开。高级 I 几乎每篇都有 `## 边界与注意` 和 `## 小结`，边界列真实失败模式，小结只回收 4–6 条结论。
7. 「怎么验证」不是每篇都有，但有验证的篇目会给可执行函数。`mover.md` 的验证函数会打印钩子顺序、坐标与 `done`；`saveable-content.md` 的验证函数做「存档 → 改状态 → 读档 → 比较」。

### A3 高级 II 的写法

高级 II 比高级 I 更接近「改造一个具体系统」，因此多了三种结构：

1. 「参与对象与分工」表。`pathfinding.md` 用一张表列出 `IPathfindingSystem` / `IPathFinder` / `IMapGraphBuilder` / `IPassPredicate` / `IObjectMover` / `IPathfindingController`，每个对象一行职责。
2. 「完整流程」编号步骤 + mermaid。`pathfinding.md` 的四段流程、`enemy-context-and-combat.md` 的 `buildup` 五段，都是「编号步骤 + 一段解释 + 一张图」。
3. 「同一件事的多个视角」对照。`pathfinding.md` 的 `moveTo` vs `teleportTo`、`static-vs-dynamic-tiles.md` 的静态 vs 动态、`equipment-system.md` 的 `getEquipped` vs `compareEquip`。
4. 示例之后给「怎么验证」与「改什么」。高级 II 仍保留任务型示例，但示例通常是完整类（`AtkBonusSorter`、`NoTilePassPredicate` 一类）。
5. 把「设计原因」写成一句可复述的规则。例如 `enemy-context-and-combat.md` 的「不要直接改 `getBaseEnemy()`」「新光环需要全量重建」；`equipment-system.md` 的「装备加成只能由 equip / unequip 维护」。这些句子是读者以后排查问题的抓手。

### A4 可直接模仿的具体写法

1. 开篇 2–4 句：一个玩家可见或工程可见的问题 → 本篇讲什么 → 本篇不讲什么、去哪里看。
2. `## 系统模型`：一张角色表 + 一张流程（mermaid 或 text），表里只放「角色 / 职责」，不放成员清单。
3. 每个机制小节的第一段先回答「它在整个流程里的位置」，再给接口。
4. 接口只列「读者会碰到的成员」，并在表前写一句「这里只列常用的，完整签名见 API 参考」。
5. 示例前先写「这个例子要解决什么」，示例后用 2–4 句解释「它声明了什么、实现了什么、在哪里接入」。
6. 关键不变量用加粗短句或独立段落，例如「录像只记录入口动作，不记录派生结果」。
7. 「为什么这样设计」用 2–3 段，不用源码口吻；讲取舍与后果，不讲私有字段。
8. 结尾固定：`## 怎么验证`（3–8 行可执行片段或检查步骤）→ `## 边界与注意`（5–6 条）→ `返回[高级 III 导览](./index.md)`。
9. 跨页引用尽量带锚点（D-74），例如 `../i/mover.md#勇士的顶层实现`。
10. 不在正文写「本节使用概率低」「源码第 X 行」「以后渲染端会讲」这类元信息。

### A5 当前高级 III 的反模式

1. 用成员表替代模型。`replay-internals` 直接给 `IReplayArray` 的 15 个成员，读者知道有哪些方法，却不知道「为什么录像要分成指令区 / 参数区 / 索引区」。
2. 删掉「为什么」只留「是什么」。`core-state` 当前只讲四层和固定顺序，删掉了加载管线、存档挂载与第二实例，读者无法判断「新增一个可存档系统要动哪里」。
3. 把「两个实例」「两个阶段」「三层作用域」这类最重要的对照删掉。`passability` 当前没有「同一契约、两个实例」，`plugin-internals` 当前没有三阶段的等待语义细节，`anon-tokyo` 当前没有「与事件对象的衔接」。
4. 示例变成接口演示。`event-system` 当前只给一个 `EventHealHero`，没有展示「收集 → 执行」的完整链路；`replay-internals` 当前的 `PlayerInputRecorder` 只展示 `record`，没有展示播放时如何避免再次录制。
5. 章节顺序不稳定。当前 `core-state` 先讲「为什么分四层」再讲「每层职责」再讲「不能反向依赖」再讲「固定顺序」，同一件事被拆成四段；`plugin-internals` 把「依赖排序」放在「状态机」之前，但依赖排序是内部实现，按 D-69 应后置。

---

## B. 逐页重写大纲

> 通用约束：每页开头写清「本篇只讲 X；Y 见某页」；每页只保留 5–6 条文末边界；示例必须是完整类 / 完整函数；不使用「模板」「[需改]」这类高级教程已禁用的标记（D-83）；不写源码叙述（D-80）；不写用户问题复盘（D-81）。

### B0 `index.md`

**读者与目的**：已经读完高级 I / II、现在需要判断「一个改动该落在装配、事件、寻路、录像还是加载」的作者。这一页只做导航与边界，不复述任何系统细节。

**当前问题**：当前只有「前置 / 七篇地图 / 阅读路径」三节，删掉了「给谁」「与 I/II 的区别」「不覆盖什么」「跨页约定」「自检」；地图表的顺序（加载在前）与阅读路径（CoreState 在前）互相矛盾，读者第一次进入会先读加载系统，却还没有四层装配与插件生命周期的心智模型。

**章节大纲**

1. `## 高级 III 是给谁的`：4 条具体能力（能读类型签名；需要判断改动落点；要排查存档/回放不一致；接受固定顺序），不要写成泛泛的「高级读者」。
2. `## 与高级 I、高级 II 的区别`：三行表说明「I 讲扩展机制怎么接、II 讲具体系统怎么改、III 讲为什么这样拆 / 数据怎么流 / 失败在哪里」。明确「分层是难度标签，不是领域分类」。
3. `## 前置`：四个必读链接（插件系统、可存档内容、录像一致性、自动寻路）+ 一句「CoreState 是本层多数页的隐性前置」。不要罗列全部 I/II 篇目。
4. `## 八篇地图`：8 行表（本页 + 7 篇），列「篇目 / 它回答的问题 / 什么时候读」。顺序按阅读主线：CoreState → 插件内部 → 事件 → Anon-Tokyo → 通行与寻路 → 录像 → 加载。不要按「数据流从加载开始」排表，否则与阅读路径冲突。
5. `## 阅读路径`：三条线。原理线按上面的顺序；按需线先读 CoreState 再跳；排查线给三个入口（回放不一致 → 录像 → CoreState 存档挂载；事件不触发 → 事件 → Anon-Tokyo；寻路能走但勇士不能走 → 通行页的「两个实例」）。
6. `## 跨页约定`：一张「概念 → 归属页」表（见 C1）。这一节是防止重复的关键。
7. `## 本层不覆盖什么`：渲染端结构、编辑器与内容配置、API 签名清单、legacy 包；旧引擎只作为对比基线。
8. `## 怎么验证你读懂了`：6 条自检，分别对应 6 个系统（装配顺序、插件阻断、事件组序、两个谓词实例、录像按步号读取、加载三阶段）。

**核心模型与理由**：导览页的模型是「层与页的映射」：每一页负责一个不可再分的问题域，页与页之间只通过明确的接口相接。它不解释任何系统，只让读者在正确的时间翻到正确的页。

**示例**：不放代码。可以用一张 mermaid 阅读路径图，但表与图只能留一个，避免重复。

**接口引入**：不引入接口；只出现篇目名与概念名。

**删除**：删掉「七篇地图」的错误计数与「加载在前」的表序；删掉只有三节的骨架；不要保留「本页是第八篇」这类计数句。

**边界（保留 5 条）**：本层不写渲染端与编辑器；不重复 I/II 的用法；不做 API 全量参考；旧引擎只作对比基线；篇目顺序按阅读主线，不按模块目录。

**链接**：7 篇正文 + `../i/` + `../ii/` + 中级相关篇目（按需）。

**怎么验证**：不设验证节；自检清单替代。

---

### B1 `replay-internals.md`

**读者与目的**：要新增录像行为、排查回放不一致、或理解「为什么录像能跨机器重放」的作者。这一页讲存储、录制入口、播放沙箱与存档形状；「哪些方法该登记」在高级 I，「怎么新增一条指令」在高级 II。

**当前问题**：当前页把 `IReplayArray` 的成员表当成主体，删掉了「存档形状」与两节内部实现；没有讲「玩家移动是在移动器里记录的」「播放必须禁用录制」「`finalize` 为什么用于连续移动」这三个决定行为的点。读者读完仍不知道录像为什么能重放、播放为什么会自己坏掉。

**章节大纲**

1. `## 开篇`：问题（录像不是状态快照，而是按顺序重放的输入序列）→ 本篇讲存储 / 录制 / 播放 / 存档 → 不写「该不该记」（链接高级 I）与「新增指令」（链接高级 II）。
2. `## 系统模型`：三角色表 `ReplaySystem` / `ReplayArray` / `ReplaySandbox`，加 `IReplayCommand`。关键不变量：录像数组只存指令码与原始参数，指令对象在运行时注册表里，所以录像可以脱离代码对象序列化。给一张 text 流程：`record → 指令区 / 参数区 / 索引区；createReplaySandbox → 读流 → 查表 → 主动执行 / 被动交给外部`。
3. `## 一条录像步是什么`：`code` + `params`；参数只支持四种原始类型（number / string / boolean / bigint）；对象、数组、函数、undefined 会被丢弃且不留占位。解释「为什么参数必须可编码」：录像要跨机器、跨会话；参数类型码只增不改。
4. `## 录制发生在哪里`：先讲 `record()`，再讲一个更容易被忽略的事实：玩家移动不是由业务代码调 `record`，而是移动器在每一步开始时写入方向指令；事件脚本里的 `moveHero` / `stepHero` 会临时禁用录制。解释「为什么在步进开始时记录」：即使这一步最终不能走，回放也要重放同一次尝试，才能得到同样的状态与同样的告警/事件。补一句 `@shouldReplay` 只做检查、不写录像（链接高级 I）。
5. `## 主动与被动`：两类指令；主动步的 `execute` 返回 `Success` / `Failed` / `Ignored`；被动步必须在主动步执行期间通过 `getPassive()` 取走并 `next()`，否则沙箱告警并跳过。解释「为什么被动步必须紧跟主动步」：被动步的参数只有主动步知道什么时候该消费。
6. `## finalize 与连续移动`：`finalize` 在指令切换或录像结束时触发；给出内置 `ReplayMove` 的真实形态：每步只 `mover.step(dir)` 入队，`finalize` 才 `mover.start()`。解释「为什么这样做」：连续移动只启动一次移动器，动画连续，回放不会逐步打断。
7. `## 播放沙箱`：`createReplaySandbox({ route, reseter, startIndex?, save? })` 先 `reseter.reset(save)`，再创建读取流；`play` / `pause` / `resume` / `stop` / `step` / `setSpeed` / `getReplayed`。必须单独讲：播放期间要 `replaySystem.disable()` / `revert()` 包住，否则移动器会再次写入录像，任何写入都会让当前读流 `expired`，回放会在中途停住。给一个完整的播放函数示例。
8. `## 存档形状`：四个字段 `length` / `commandWidth` / `commandArray` / `paramArray`；`saveState` 返回的是缓冲区副本（当前实现会切片），所以长期保存安全，但不要把它当成「活的录像」；`loadState` 会重建索引并让旧读流过期，正在播放的沙箱要重建。一句「录像作为可存档对象由主插件注册」并链接 CoreState 的存档挂载。
9. `## 为什么是二进制`：保留 3–4 条优势（紧凑、类型保真、可按步号定位、不依赖地图编号），用 3 行对照表，不展开旧引擎 API。旧引擎只作为「为什么不是字符串数组」的基线。
10. `## 可扩展点`：`registerCommand(code, command)` + 链接高级 II；`IReplayArray` 的插入/删除/改写只适合录像编辑器，讲清线性成本与越界告警即可。
11. `## 怎么验证`：录两步 → `saveState` → `loadState` → 用 `disable/revert` 包住播放 → 比较 `length`、终点坐标与关键状态；再故意不 disable，观察读流过期（只作为理解，不作为推荐做法）。
12. `## 边界与注意`：6 条。
13. `返回[高级 III 导览](./index.md)`。

**核心模型与理由**：录像是「输入日志」而不是「状态快照」。因此：入口必须记录玩家意图，派生结果在回放时重算；指令对象不能进录像；读流是只读视图，任何写操作都要让它失效；播放本身不能再录。这四条是整页的骨架。

**示例**：`PlayerInputRecorder`（完整类，展示玩家入口「先 record、再执行」）；`playRoute`（完整函数，展示 `createReplaySandbox` + `disable/revert` + `play` + 等待结束 + `releaseSandbox`）；可选 `ReplayChoiceConsumer`（完整类，展示被动步的 `getPassive` / `next`）。如果篇幅超限，用 6–8 行说明替代，不删「播放禁用录制」的例子。

**接口引入顺序**：`ReplayCode` → `ReplayParamValue` → `IReplayStepHandler` → `ReplayCommandType` / `ReplayCommandResult` → `IReplayCommand` → `IReplayArray`（只列 `length` / `get` / `createReadStream` / `disable` / `revert`）→ `IReplaySandbox` / `IReplayPassiveHandler`。不要一上来给 `IReplayArray` 全表。

**删除**：删掉当前 `IReplayArray 与存储格式` 的 15 行成员表（改成「常用成员 + 三块存储」）；删掉「沙箱通常由系统内部创建」（实际由调用方创建）；删掉「参数支持 … 需要时使用的 bigint」这种含糊说法；删掉「与旧引擎的区别」的 3 行泛表，改为「为什么是二进制」的短论证。

**边界（保留 6 条）**：参数超过 255 个会被截断并告警；不支持的类型会被丢弃，参数个数随之变化；`get(index)` 是随机读，不适合放进播放循环；插入 / 删除 / 改写是线性成本，越界不修改并告警；`bigint` 幅值有上限（小于 2 的 2040 次方）；缩窄指令宽度会截断超过 255 的指令码。

**可丢弃的边界**：「录像不带指令对象」（属于模型）；「被动步必须 next」（属于主动/被动小节）；「旧格式不保证读回」（对比节正文一句即可）。

**链接**：`../i/replay-consistency.md`、`../ii/custom-replay-command.md`、`./core-state.md#存档挂载`、`../i/mover.md`。

**怎么验证**：见第 11 节；验证函数要包含「播放前 disable、播放后 revert」这一对，否则示例本身会误导。

---

### B2 `event-system.md`

**读者与目的**：要挂事件、改收集顺序、新增内建函数的作者。这一页讲「事件怎么被收集、过滤、执行」；脚本怎么编译与执行在 `anon-tokyo`。

**当前问题**：当前页删掉了 env 字段表与完整收集示例，也删掉了「`EventExecutor.execute` 带录像标记」这一事实；「事件层就是 alias 为 event 的普通图层」说得过满（`setEventLayer` 可指定，alias 只是内容加载时的默认约定）；「事件由内容侧注册」在当前仓库没有对应加载路径，不能写成既有行为。

**章节大纲**

1. `## 开篇`：事件把「一段脚本」和「什么时候跑」接在一起；本篇讲仓库、收集、执行、触发器与内建函数；脚本编译见 Anon-Tokyo；编辑器注册不在本篇。
2. `## 系统模型`：五角色表（`GameEventStore` / `GameEvent` / `GameEventSystem` / `EventExecutor` / `AnonTokyoInterpreter`）+ text 流程。关键不变量：收集阶段只认坐标与图层，执行阶段才认事件对象与触发器；收集结果是 `{ id, env }`，不是事件实例。
3. `## 事件对象与触发器`：`GameEvent` 的 `trigger` / `rawEvent` / `compiled`，`compile` 缓存，`setRaw` 清缓存，`setTrigger`。`EventTrigger` 11 个值的表 + 「当前数据端派发」列：只有 `OnTouch` / `OnEnter` / `OnLeave` 有派发点（勇士移动的 hit / enter / leave），其余是枚举保留。解释「为什么触发器过滤不放在收集器」：同一坐标可能因不同时机被收集，收集器不应知道事件脚本的语义。
4. `## 收集：这一次该执行谁`：`collectEvent(layer, trigger, x, y)` 的边界（越界返回空）；点事件来自 `layer.getPointEvent`，图块事件来自静态图块与每个动态图块的 `tileEvent()`；两组各自降序、点事件整组在前。解释「为什么整组优先」：点事件描述「这个坐标发生什么」，图块事件描述「这个物体发生什么」；跨组比较优先级会让物体事件压过坐标语义，难以推理。给 env 字段表（state / type / trigger / system / heroLocator / heroFloor / triggerLocator / tile / layer / map），并注明 `env.state` 的类型宽度是 `IStateBase`，拿不到 L3 的 loader 等成员（链接 CoreState 的类型分层）。
5. `## 执行与折叠`：`execute` 的三步（仓库/事件缺失告警并跳过；trigger 不匹配静默跳过；`await event.execute`）；`EventExecuteMode` 三种短路；`EventReduceMode` 三种折叠；非布尔值告警但按短路规则继续。讲清楚：`mode` 与 `reduce` 是执行器上的共享状态，不是每次调用的参数，改完要复位。`EventExecutor.execute` 带 `@shouldReplay`，含义是「执行事件这条路径必须产生录像记录」，不是自动写录像。`onBeforeExecuteEvent` / `onAfterExecuteEvent` 是同步钩子；任意事件拒绝会让 `execute` 拒绝，后续调用项与 `onAfterExecuteEvent` 不再执行。
6. `## 两种 param 不是一回事`：`IBlockEventParam`（`{ custom }`）会进入脚本的 `scope.args`；内建函数的 `param` 是 `Call.parameters` 求值后的对象。两者不会自动传递。这部分可以并入执行小节，但必须保留。
7. `## 事件层`：默认事件层由内容里 `alias === 'event'` 的图层登记（`MapState.fromRaw`），也可以用 `setEventLayer` 显式指定；它仍是普通图层，具备图块、点事件、图块事件、存档与钩子。不要写「事件层一定是 alias event」。
8. `## 自定义一个内建函数`：完整类 + 参数接口 + `createEventRegistrations`；`env.state` / `env.layer` / `env.map` / `env.trigger` / `env.tile` 的用法；`getPossibleLayer` / `getPossibleMap` 的兜底顺序。不要重复中级教程的六步实操。
9. `## 怎么验证`：写一个 `OnEnter` 事件，调用 `collectEvent` + `executor.execute`，断言块被改 / flag 被写；再故意把 trigger 改成不匹配，确认静默跳过。
10. `## 边界与注意`：6 条。
11. `返回[高级 III 导览](./index.md)`。

**核心模型与理由**：事件系统是「坐标 → 候选 id → 事件对象 → 解释器」的管道。它的设计取舍是：收集便宜且通用，执行才做语义判断；事件对象缓存编译产物；执行器把「执行策略」与「事件内容」分开。读者只要抓住「收集不筛触发器、执行才筛」，就不会把顺序与过滤混在一起。

**示例**：`EventHealHero`（完整类，展示内建函数形状与 `env.state`）；`runEventsAt`（完整函数，展示 `collectEvent` + `executor.execute` 的完整链路）；保留 `createEventRegistrations` 的完整函数。

**接口引入顺序**：`EventTrigger` → `GameEvent` / `IReadonlyGameEvent` → `IGameEventInvocation` → `IBlockEventEnv` → `IBlockEventParam` → `EventExecuteMode` / `EventReduceMode` → `BuiltInFunction`。env 表放在收集小节，不要放在开头。

**删除**：删掉「事件由内容侧注册进 state.eventStore」这种没有当前实现支撑的绝对句（改为「登记接口是 `eventStore.addEvent`；谁在加载期登记属于内容加载，不在本篇」）；删掉「事件层就是 alias 为 event 的普通图层」的绝对化表述；删掉「执行器状态改完记得复位」以外的泛泛提醒。

**边界（保留 6 条）**：坐标越界返回空列表，不告警；点事件与图块事件互不替代；同一优先级重复设置会覆盖并告警 136；事件 id 未注册时执行器告警 171 并跳过；触发器不匹配时静默跳过，不告警；执行器 `mode` / `reduce` 是共享状态，改完要复位。

**可丢弃的边界**：「多条事件异步顺序执行」（放到执行小节正文）；「短路模式后面的条目不再执行」（属于 mode 表）；「事件注册属于内容配置」（放到开篇范围句）。

**链接**：`./anon-tokyo.md`、`../ii/point-and-tile-events.md`、`../i/data-stores.md`、`../../intermediate/events.md`、`../i/mover.md#勇士的顶层实现`。

**怎么验证**：见第 9 节；验证重点是「收集顺序」与「trigger 过滤位置」，不是再写一个业务事件。

---

### B3 `anon-tokyo.md`

**读者与目的**：要写复杂事件脚本、排查编译错误、理解脚本执行模型的作者。这一页讲语句、作用域、编译产物、执行上下文与迭代；事件怎么收集见事件系统。

**当前问题**：当前页删掉了「与事件对象的衔接」与独立的「内部实现：编译与执行」，把作用域并入语句模型；`save` 字段、`dump()`、`Exit` vs `Return` 的边界也没有了。读者不知道编译产物由谁缓存、为什么 `Call` 的返回值拿不到、为什么某些脚本写法会出错。

**章节大纲**

1. `## 开篇`：脚本在数据里是结构化语句数组，不是字符串；解释器把语句编译成程序，再由上下文与迭代器求值；数据端只负责把事件对象交给它。
2. `## 系统模型`：角色表 `LanguageFeature` / `AnonTokyoInterpreter` / `AnonTokyoExecutable` / `AnonTokyoExecutionContext` / `AnonTokyoIterator` / `Statement` / `Scope` / `OP` + text 流程。关键不变量：编译产物可复用，执行上下文不能复用；一次执行一个上下文，上下文里是调用栈与环境。
3. `## 语句模型`：`StatementType` 表；只把可执行语句讲清楚：`Expression` / `Call` / `Return` / `If` / `Switch` / `Loop` / `Break` / `Continue` / `Exit`。`Block` 不是独立对象，是 `Statement[]`；`FunctionDeclare` 只存在于枚举里，当前可执行语句联合没有它。不要暗示「可以声明局部函数」。
4. `## 作用域`：`args` / `local` / `env` 三层；`args` 是调用参数，`local` 是本次迭代器自己的局部变量，`env` 沿调用链共享。解释「为什么没有声明语法」：局部变量就是 `local` 上的字段；不要把参数放进 `local`，也不要把局部状态放进 `env`。
5. `## 编译与执行`：`compile(script)` 做控制流分析并生成程序节点；内建函数在编译期按名字解析（缺失直接抛错）；全局函数在解释器构造时先编译，调用时按名字查表（缺失抛错）。`exec` 创建上下文，迭代器反复求值当前节点，按 `OP` 推进：`Move` / `Call` / `Return` / `Exit`。`Call` 是语句，不是表达式，内建/全局的返回值不会写回作用域；需要计算值时用 `Expression` 存到 `scope.local`。
6. `## 与事件对象的衔接`：`GameEvent` 持有 `rawEvent` 与 `compiled`；`compile` 缓存；`execute` 优先用缓存，`setRaw` 清缓存；解释器不收集坐标、不判断触发器、不查事件仓库。解释「为什么同一解释器可以被多个事件共享」：编译缓存属于事件对象，运行上下文属于每次执行。
7. `## 自定义内建函数与全局函数`：`LanguageFeature` 两张表；内建函数是数据端最常用的扩展点（链接事件系统）；数据端当前把 `config.events` 作为内建函数表，全局函数表为空，标准装配没有暴露全局函数配置入口。不要给 `save` 赋予存档/录像语义。
8. `## 内部实现：编译与执行`（D-69，放后）：编译期把语句展开成带跳转的流程节点，再生成按编号索引的程序节点；相邻且可合并的节点会被合并执行。这里要讲一条作者能感知的约束：相邻节点会被合并执行，合并后的表达式不能依赖定义处的外部变量（闭包）；需要的数据通过 `scope.args` / `scope.local` / `scope.env` 传入。不要写 `new AsyncFunction`、`toString` 这类源码叙述，只写行为约束。执行上下文没有可用的导出/转储能力。
9. `## 怎么验证`：编译一次、执行两次，确认两次 `args` 互不影响；故意写错内建函数名，确认 `compile` 阶段抛错；写一个 `Call` 后跟 `Return`，确认 `Call` 的返回值不会自动出现在作用域里。
10. `## 边界与注意`：6 条。
11. `返回[高级 III 导览](./index.md)`。

**核心模型与理由**：解释器的设计是「编译一次、执行多次、每次新建上下文」。这带来三个后果：编译期错误（内建函数名）早暴露；运行期错误（全局函数名、表达式异常）晚暴露；`env` 是唯一跨调用共享的通道，`args` / `local` 都是每次执行自己的。所有边界都从这三条推出来。

**示例**：一个完整的顶层文件：定义内建函数 `logValue`，构造解释器，编译包含 `Call` 与 `Return` 的脚本，执行两次并打印不同结果。保留逐行注释。可选：在同一脚本里加一个 `If`，展示 `branches` 与 `otherwise`；如果加，保持一个例子，不要拆成多个半截片段。

**接口引入顺序**：`Statement` / `StatementType` → `Scope` → `LanguageFeature` → `AnonTokyoInterpreter` → `AnonTokyoExecutable` → `AnonTokyoExecutionContext` / `AnonTokyoIterator` → `OP`。`ExecutionNode` 只在内部实现小节出现。

**删除**：删掉把「作用域」并进语句模型的写法（恢复独立小节）；删掉「编译期先做控制流分析…」这种一句话带过的源码描述，改为内部实现小节的行为说明；删掉「`dump` 可用」的任何暗示（当前是空实现）；删掉「`save` 字段」的未证实语义。

**边界（保留 6 条）**：语句是结构化对象，不是可解析字符串；`args` / `local` / `env` 不要混用；`Call` 是语句，返回值不会写回作用域；内建函数名在编译期解析，缺失直接抛错；全局函数名在执行到 `Call` 时才解析，缺失抛错；执行上下文没有导出/转储能力，`save` 字段没有额外语义。

**可丢弃的边界**：「`Exit` 与 `Return` 不同」（放到语句模型表）；「解释器不负责派发」（放到衔接节）；「修改原始语句要重新编译」（放到衔接节）。

**链接**：`./event-system.md`、`../i/data-stores.md`、`../../intermediate/events.md`。

**怎么验证**：见第 9 节；验证函数要展示「编译一次、执行两次」与「编译期抛错」两件事。

---

### B4 `passability-and-pathfinding.md`

**读者与目的**：要改移动规则、排查「寻路能走但勇士不能走」、或替换通行语义的作者。这一页讲谓词契约、默认实现、两个实例、三种移动结果、构图与搜索；`moveTo` / 损失函数 / 瞬移策略的用法在高级 II。

**当前问题**：当前页把十个章节压成五节，删掉了「同一契约、两个实例」「勇士移动的三种结果」「系统层做什么」；这三节恰恰是读者最容易踩坑的地方。当前页也没有说明默认谓词只读静态图块、动态图块不参与判断。

**章节大纲**

1. `## 开篇`：通行性谓词回答「能不能走进目标格」与「会不会撞上目标格」；勇士移动与寻路构图都用它；本篇讲契约、默认实现、两个实例与构图搜索。
2. `## 系统模型`：角色表 `IPassCheckHandler` / `IPassPredicate` / `DefaultPassPredicateImpl` / `MapGraphBuilder` / `PathFinder` / `PathfindingSystem` + text 流程（勇士移动一步 vs 寻路构图）。一句关键：寻路本身不判断通行，它只是反复调用谓词，把结果翻译成图的边。
3. `## 谓词契约`：`canPass` 与 `shouldHit` 是两个问题；`shouldHit` 为真不是「不能走」，而是「走得到但会撞」；`canPass` 为假才是真的进不去。`IPassCheckHandler` 的 `currLoc` / `nextLoc` / `direction` / `map` / `state`。谓词不保存「当前是哪个对象」，所以可以被两侧复用。
4. `## 默认实现怎么判断`：四步（取 Dir4 处理器并降级；事件层存在；事件层当前格 `outPass` 与目标格 `inPass`；其它图层只检查 `onlyEvents`）。方向位表：`outPass` 用移动方向，`inPass` 用反方向。空格不施加限制。`shouldHit` 只看事件层目标格，`eventPass === false` 时撞停。明确边界：只读静态图块，动态图块不参与判定；需要动态图块挡路时写自定义谓词。斜向输入只说「先降级到四方向再判定」，不要声称斜向有独立的通行位；默认玩法按四方向描述。
5. `## 同一契约、两个实例`：表格对照「勇士移动：`DefaultHeroMoveTopImpl` 构造时自建谓词，`predicate()` 返回它」与「寻路：`MainDataPlugin.awake` 另建一个，`finder.usePassPredicate` 注入」。结论：行为一致、对象不同、状态不共享；改一侧不会自动改另一侧，要一致就两边都换。说明「无状态谓词各建一个没问题，有状态谓词必须共享同一个实例」。
6. `## 勇士移动的三种结果`：`CannotMove` → `cannotEnter`（默认空实现）→ 停止，位置不变；`Hit` → `hit` → 触发 `OnTouch` → 停止；`Step` → 写入目标格 → 结算时先 `leave` 再 `enter`（`OnLeave` / `OnEnter`）。这一节把「撞击」与「进入」两种事件的来源讲清楚，链接事件系统。
7. `## 构图：从起点只保留可达节点`：`build(start)` 的前置（图层、谓词、方向处理器、起点在界内，缺一返回 `null`）；BFS 用 `mapMovement()`，跳过零偏移；`canPass` 为假不建边也不扩展；`shouldHit` 建边并标终端；只有可达节点进图。损失函数按节点计算，未注入按 1；`NaN` / 负数回退 1，`Infinity` 是合法损失（这里要与高级 II 的「有限数」说法对齐，见 E3）。
8. `## 搜索：最小损失与终端约束`：`PathFinder.search` 只读 `cost` / `terminal`，不重新判断通行；终端只能作终点；四个状态 `Success` / `InvalidInput` / `NoPath` / `TargetUnder`；`NoPath` 是正常结果。
9. `## 系统层做什么`：`useMover` / `getPath`（从 mover 的 tile 取起点）/ `moveTo`（总是逐步）/ `teleportTo`（策略允许才瞬移）/ `interrupt`；忙碌时返回 `null`；瞬移跳过途经格。不要重复高级 II 的 `useCostFunction` / `useFallbackPolicy` 示例，只给职责与边界。
10. `## 换一套通行语义`：完整 `NoTilePassPredicate` 类（包住默认谓词，再叠加禁止图块）；寻路侧 `finder.usePassPredicate(...)`；勇士侧 `useTopImplementation(...)` 或改默认实现。强调「只改一侧不会同步」。
11. `## 怎么验证`：用默认谓词判断一步（`cannotMove` / `hit` / `step`）；再用 `getPath` 看状态；最后 `moveTo` 并等待 `onEnd`。
12. `## 边界与注意`：6 条。
13. `返回[高级 III 导览](./index.md)`。

**核心模型与理由**：整个页面的核心是「一个契约、两个消费者、两条路径」。契约必须无状态，才能让两个消费者各自持有实例而结果一致；一旦自定义谓词带状态，就必须把同一实例注入两侧。构图只保留可达节点，是为了让搜索不必处理不可达区域；终端标记把「走得到但会撞」编码进图，而不是在搜索时重新判断通行。

**示例**：`judgeStep`（完整函数，展示用默认谓词判断一步的三种结果）；`NoTilePassPredicate`（完整类，展示「包住默认谓词 + 叠加规则」）；两条注入片段（`finder.usePassPredicate` 与 `useTopImplementation`），写成完整函数。

**接口引入顺序**：`IPassCheckHandler` → `IPassPredicate` → `PassBit` / `ITilePassData`（解释默认实现时才出现）→ `MapGraphBuilder` → `PathFinder` → `PathfindingSystem`。`ILayerLocation` 只在损失函数一句里出现。

**删除**：删掉当前「契约」小节里「同一套规则算出」的绝对句（改为「在默认装配下」）；删掉「把传入方向降级到四向」后直接讲方向位的误导（补一句「默认玩法按四方向」）；删掉「构图、搜索与移动」把三件事混在一节的写法；恢复「两个实例」「三种结果」「系统层」。

**边界（保留 6 条）**：两个实例不共享，改一侧不会自动改另一侧；图层必须属于同一数据端，否则告警并忽略绑定；未注入方向处理器时构图失败，`find` 得到 `InvalidInput`；起点越界会告警并返回失败；终端只能作终点，不能作中间点；默认实现只读静态图块，动态图块不参与，需要时写自定义谓词。

**可丢弃的边界**：「无路径是正常结果」（放到搜索小节）；「目标在脚下不移动」（放到状态表）；「换楼层要重绑」（放到系统层或 CoreState）。

**链接**：`../ii/pathfinding.md#自定义损失函数`、`../ii/pathfinding.md#自定义瞬移策略`、`../i/mover.md#勇士的顶层实现`、`../i/face-handler.md#用在哪里`、`./event-system.md`、`./core-state.md`。

**怎么验证**：见第 11 节；验证要覆盖「默认谓词的三结果」与「换谓词后寻路状态变化」。

---

### B5 `core-state.md`

**读者与目的**：要新增子系统、新增可存档对象、调整启动流程、或在游戏内创建第二个数据端实例的作者。这一页是整层的组合根：四层装配、入口、加载管线、存档挂载、第二实例。

**当前问题**：当前页只剩「为什么四层 / 每层职责 / 不能反向依赖 / 固定顺序 / 入口」五节，删掉了加载管线、存档挂载、第二个实例与内部装配顺序；读者无法回答「`load()` 到底做了什么」「五个存档 id 是哪五个」「为什么读档不会重跑插件 afterLoad」「怎样在 Node/游戏内再建一个数据端」。

**章节大纲**

1. `## 开篇`：`CoreState` 是数据端的组合根；构造它时按层装配、注册插件并排序、同步 `awake`；调 `load()` 时加载按固定次序推进。本篇讲装配与生命周期；插件怎么写见高级 I，存档形状见高级 I，插件排序细节见 plugin-internals。
2. `## 系统模型`：四层表（L0 公共数据 / L1 状态基座 / L2 系统层 / L3 顶层）+ 依赖方向图。补一张「类型宽度」表：`IDataCommon` → `IStateBase` → `IStateSystem` → `ICoreState`，说明运行时是同一个对象，编译期成员逐层增加；这正是「为什么某些扩展点的 `state` 看不到 `loader`」的原因。这一节回答「改动该落在哪一层」。
3. `## 为什么分成四层、为什么不能反向依赖`：合并当前的「为什么」与「不能反向依赖」。讲三条后果：循环引用检查会报错；低层构造时高层还没建好，只能拿到 `undefined`；低层绑定高层后无法独立替换/测试。不要重复「每层职责」的列表。
4. `## 入口的职责`：`src/data.ts` 只 re-export；`entry.ts` 的 `createCoreStateConfig(starter)` 组装四个字段（`loadStarter` / `coreURL` / `dataPlugins` / `events`），`dataPlugins` 把 `MainDataPlugin` 放在最前再展开业务插件；`createCoreState(starter)` 返回尚未异步初始化的实例。强调 `MainDataPlugin` 只是列表里的第一个插件，排序仍由 `dataDeps` 决定（链接 plugin-internals）。
5. `## 加载管线`：`state.load()` 是异步迭代器：`await initialize()` → `yield* loader.start()` → `await afterLoad()` → 检查所有插件是否 `Loaded`。解释每一步为什么在这个位置：`initialize` 在加载前，仍可追加配置；`afterLoad` 在加载后，核心配置、地图与内容才可读；最后一步只做检查。强调：`load()` 只负责初次加载，玩家读档不会重跑；必须消费迭代器，否则加载不开始。
6. `## 存档挂载`：`addSaveableContent(id, content)`；五个内置 id（`@system/hero` / `@system/flags` / `@system/maps` / `@system/enemy` / `@system/replay`）；`bindSaveableExecuter` 的对象/id 两种写法；`loadState` 先清录像禁用标记，再对每个对象 `disable()` → `loadState` → `revert()`，执行器在包裹之外。解释「为什么执行器不在包裹内」：执行器可能需要做出需要记录的行为。顺序不保证，重复 id 告警 112，缺 key 177，多 key 178。存档形状与三级压缩链接高级 I，不在这里重讲。
7. `## 在游戏内另建一个数据端实例`：构造器不依赖全局单例；传完整 `ICoreStateConfig` 即可得到独立实例；与主实例不共享 hero / maps / eventStore / 存档。给完整函数 `createSecondaryState`（含 `for await` 消费 `load()`）。用途：回放对比、离线校验、测试。不要建议读者重排构造顺序。
8. `## 内部实现：装配顺序`（D-69，放后）：精确 L0 → L1 → L2 → L3 的创建顺序与同层依赖（`tileStore` 先于 `itemStore` / `enemyStore`；`maps` / `hero` 回指主对象；`eventSystem` 接收 `config.events`；`loader` 依赖 `loadManager` 并登记核心配置）。插件注册、去重、`orderPlugins`、`awake` 都在四层之后。不要写私有字段名。
9. `## 怎么验证`：创建一个第二实例，检查 `hero` / `eventStore` 不共享；检查五个存档 id 都存在；检查插件状态在 `load()` 后为 `Loaded`。
10. `## 边界与注意`：6 条。
11. `返回[高级 III 导览](./index.md)`。

**核心模型与理由**：`CoreState` 是「对象图的唯一构造点 + 生命周期的唯一编排点」。四层不是目录分类，而是构造依赖的顺序；插件阶段放在最后，是因为 `awake` 可以看到整个数据端；加载与读档是两条不同的路径（`load()` 只管初次加载，`loadState` 管快照恢复）。这三条决定了所有扩展点的落位。

**示例**：`createSecondaryState`（完整函数，展示完整配置、`new CoreState`、消费 `load()`）。存档挂载不写完整 `ISaveableContent` 实现（高级 I 已讲），只给五个 id 表与一段「注册 + 绑定执行器」的短函数。

**接口引入顺序**：`ICoreStateConfig` → `ICoreState` / `IStateSystem` / `IStateBase` / `IDataCommon` → `IDataPlugin` / `PluginStatus`（只作为插件阶段的名词）→ `ISaveableContent` / `ISaveableExecutor`（只作为存档挂载的名词，细节链接高级 I）。不要在开头堆四个接口。

**删除**：删掉当前「每层职责」与「固定初始化顺序」的重复（合并成「层次 + 依赖」与「内部实现：装配顺序」两节）；删掉只有五节的骨架；删掉「L3 只有 loader / loadManager」的暗示（还要讲 `getDataPlugin` / `load` / `bindSaveableExecuter`，但不必列全）。

**边界（保留 6 条）**：`load()` 必须被迭代，否则加载不开始；`ICoreStateConfig` 四个字段必填；重复的 saveable id 只保留第一个并告警 112；执行器绑定未注册对象会告警 113，按 id 找不到会静默返回；读档缺 key 告警 177，多 key 告警 178；`load()` 结束时状态不是 `Loaded` 的插件会被逐个告警。

**可丢弃的边界**：「读档期间录像被禁用」（放到存档挂载正文）；「系统层不进存档」（放到四层表）；「不要手动构造内部子系统」（放到边界最后一条或开篇范围句）。

**链接**：`./plugin-internals.md`、`./loading-system.md`、`../i/plugin-system.md`、`../i/saveable-content.md#注册到存档系统`、`../i/saveable-content.md#读档收尾与执行器`。

**怎么验证**：见第 9 节；验证要覆盖「第二实例独立」与「五个存档 id」。

---

### B6 `plugin-internals.md`

**读者与目的**：要写插件、排查插件未执行或阶段顺序问题的作者。这一页只讲机制：插件表怎么变成确定顺序、状态怎么推进、依赖写错会怎样；插件类怎么写见高级 I。

**当前问题**：当前页已经补上了「`MainDataPlugin` 不是隐式前置」这条重要警告，但把三阶段的依赖参数、`awake` 不等待、阶段失败的展开删掉了；「依赖排序」放在「状态机」之前，读者还没理解阶段就先读内部算法。

**章节大纲**

1. `## 开篇`：插件系统对使用者只暴露三件事（声明 `dataDeps`、在三个时机做事、按 id 取回）；本篇讲背后的顺序、状态与失败；写法见高级 I。
2. `## 系统模型`：五段流程（插件表 → 依赖图 → 拓扑序 → 状态机 → 三阶段）+ 表。关键不变量：依赖图只由 `id` 与 `dataDeps` 构成，不读运行期状态；拓扑序在构造期算一次，三个阶段复用。
3. `## 三个阶段怎么执行`：三行表（时机 / 是否等待 / 适合做什么）；每个阶段收到按 `dataDeps` 顺序解析的 `{ status, plugin }` 包装数组，取能力要 `.plugin` 并断言成对方接口；`awake` 的返回值不被等待，`async awake` 不会阻塞；`initialize` / `afterLoad` 会被 `await`。明确警告：`MainDataPlugin` 不是隐式前置，用到它注册的存档 id / 默认装配时必须在 `dataDeps` 里写 `'main-data-plugin'`。
4. `## 状态机`：四状态与推进条件；每个阶段只处理前一状态的插件；状态不对会跳过并告警；被阻断的插件永远停在 `NotAwakened`；状态只前进不后退，不支持运行期重置。
5. `## 失败会怎样`：表格化五类失败（环 76 / 缺失 77 / 重复 id 78 / 状态不符 80 / 启动后未完成 81）；说明「不是抛异常，而是排除 + 控制台提示」；下游会被一起阻断。补一句：没有查询阻断原因的公开 API，`getDataPlugin` 看到 `NotAwakened` 无法区分「还没开始」与「被阻断」。
6. `## 取回一个插件`：`getDataPlugin<T>(id)` 返回只读包装或 `null`；先判空、再检查 `status === Loaded`；启动阶段优先用 `dataDeps` 让引擎保证顺序，运行期才用按 id 取回。给完整函数示例。
7. `## 内部实现：依赖排序`（D-69，放后）：四步（缺失检测 / 环检测 / 阻断传播 / 拓扑输出）；输出时按插件表的插入顺序扫描，互不依赖的插件保持列表顺序，因此「固定顺序」只对同一份列表成立；结果分三份（order / cyclic / missing），构造期只算一次。
8. `## 边界与注意`：6 条。
9. `返回[高级 III 导览](./index.md)`。

**核心模型与理由**：插件的「顺序」来自依赖图，不来自列表位置；列表位置只决定互不依赖插件的平局顺序。三个阶段共享同一份拓扑序，状态机保证每个插件每个阶段只执行一次；失败不是异常，而是把插件及其下游从执行集合里移除，所以作者看到的往往是「某些对象不存在」，而不是一条明确的错误。

**示例**：`useMyPlugin`（完整函数，展示 `getDataPlugin` 的判空 + 状态检查）。可选：一个最小的 `dataDeps` 声明类，只展示「依赖主插件要显式写 id」；如果篇幅超限，用一句正文 + 代码行替代，不要写成完整插件教程。

**接口引入顺序**：`IDataPluginDefine` / `IPluginBase` → `PluginStatus` → `IDataPlugin`（包装）→ `IPluginOrderResult`（内部实现小节）。不要在开头列 `orderPlugins` 的返回类型。

**删除**：删掉重复的「插件表 / 依赖图 / 拓扑序」表与 text 流程（保留一个）；把「依赖排序」从状态机之前移到最后；删掉「失败会怎样」里已经在上文讲过的状态机内容；保留并突出 `MainDataPlugin` 警告。

**边界（保留 6 条）**：依赖在启动前固定，运行期修改 `dataDeps` 不会改变顺序；不支持运行期追加插件；环或缺失会阻断下游，不只是出错的插件本身；重复 id 只保留第一个；`getDataPlugin` 要判空并检查 `status`；`dataDeps` 与渲染端 `clientDeps` 是两套，不要混用。

**可丢弃的边界**：「状态不符会被跳过」（放到状态机）；「`orderPlugins` 不供读者调用」（放到内部实现小节）；「启动后未完成会告警」（放到失败表）。

**链接**：`../i/plugin-system.md`、`./core-state.md#加载管线`、`./core-state.md#存档挂载`。

**怎么验证**：把某个 `dataDeps` 改成不存在的 id，确认控制台出现 77、插件停在 `NotAwakened`；再在 `load()` 后检查 `getDataPlugin` 的 `status`。

---

## C. 跨页设计叙事

### C1 页面所有权矩阵

| 概念 / 问题 | 归属页 | 其它页只做什么 |
| --- | --- | --- |
| 四层装配、构造顺序、`load()` 管线、五个存档 id、第二实例 | `core-state` | 其它页只引用「已装配完成」这一前提 |
| 插件 `dataDeps`、拓扑序、状态机、失败模式 | `plugin-internals` | 高级 I 讲怎么写插件；`core-state` 只讲装配阶段 |
| 事件仓库、触发器、收集顺序、执行器、内建函数 | `event-system` | `anon-tokyo` 只讲脚本怎么跑；`passability` 只讲触发器由哪三种移动结果派发 |
| 语句、作用域、编译产物、执行上下文、`Call` 语义 | `anon-tokyo` | `event-system` 只讲 `GameEvent` 如何缓存编译产物 |
| 通行谓词、默认实现、两个实例、构图、搜索、系统层 | `passability-and-pathfinding` | 高级 II 讲 `moveTo` / 损失函数 / 瞬移策略的用法 |
| 录像数组、指令注册、录制入口、沙箱、存档形状 | `replay-internals` | 高级 I 讲该不该记；高级 II 讲怎么新增指令 |
| 三层加载、阶段、配置、自定义资源、进度 | `loading-system` | `core-state` 只讲 `load()` 的三步顺序 |

### C2 每页默认读者已经知道什么

- `core-state`：只需高级 I 的插件与存档名词；本页负责建立 L0–L3 与 `ICoreState` 的类型宽度。
- `plugin-internals`：默认读者知道怎么写插件（高级 I），本页只解释顺序与失败。
- `event-system`：默认读者知道 `state`、地图图层、`eventStore` 的基本用法；本页解释收集与执行。
- `anon-tokyo`：默认读者知道 `GameEvent` 与内建函数的存在；本页解释语言与执行模型。
- `passability-and-pathfinding`：默认读者知道地图图层、`IObjectMover`、高级 II 的寻路用法；本页解释契约与构图搜索。
- `replay-internals`：默认读者知道 `@shouldReplay` 与自定义指令的写法；本页解释存储、录制入口、播放与存档。
- `index`：不假设读者知道任何系统细节，只假设读完 I/II。

### C3 不得重复的内容

- 不在 `core-state` 重讲 `ISaveableContent` 的字段、三级压缩、`saveState` 返回值约束（高级 I）。
- 不在 `plugin-internals` 重讲插件类写法、`awake` / `initialize` / `afterLoad` 的入门解释（高级 I）。
- 不在 `replay-internals` 重讲 `@shouldReplay` 的放置规则、`ReplayCode` 的追加流程、自定义指令的完整示例（高级 I / II）。
- 不在 `passability-and-pathfinding` 重讲 `moveTo` / `teleportTo` 的完整用法、损失函数与瞬移策略的示例（高级 II）。
- 不在 `event-system` 重讲点事件 / 图块事件的读写接口（高级 II 已有专篇）。
- 不在 `anon-tokyo` 重讲内建函数的完整注册流程（事件系统已讲）。
- 不在 `index` 复述任何系统机制。

### C4 统一术语与阅读顺序

- 统一写「装配」表示构造期建对象，「加载」表示 `loader.start()`，「读档」表示 `loadState()`；不要用「初始化」同时指三者。
- 统一写「录像步」「指令」「沙箱」「读取流」；不要混用「录像条目」「命令」「播放器」。
- 统一写「通行谓词」「构图」「搜索」「终端」；不要混用「碰撞判断」「寻路图」「终点格」。
- 阅读主线：`core-state` → `plugin-internals` → `event-system` → `anon-tokyo` → `passability-and-pathfinding` → `replay-internals` → `loading-system`。`index` 的表与路径图都按这个顺序。

---

## D. 源码依据的设计笔记

> 以下内容用于写作时核对「为什么」与「不变量」；正文不要写文件路径与私有字段（D-80）。

### D1 录像

**为什么这样设计**

- 录像是输入日志：记录玩家意图与指令参数，不是最终状态。回放时重新执行同一套逻辑，派生结果自然重算。
- 指令对象不能进录像：录像要能存成二进制、跨机器读取；指令对象是运行时行为，所以 `ReplayArray` 只存 `code + params`，`ReplaySystem` 单独持有注册表。
- 格式遵循只增不改：`ReplayCode` 的数值与参数类型码都是格式的一部分，新语义必须新码。
- 读流是只读视图：`ReplayArray` 的任何写操作（`add` / `insert` / `delete` / `set` / `setCommandWidth` / `setReplayArray`）都会让已有读流 `expired`，防止「边改边读」得到不一致数据。

**关键生命周期**

1. 录制：`ReplaySystem.record(code, ...params)` → `ReplayArray.add`；参数被规范化，不支持的参数被丢弃且不留占位；`record` 会触发 `onRecordCommand` 钩子。
2. 玩家移动的特殊路径：`HeroMover.onStepStart` 在判断通行之前，直接把 `Up` / `Right` / `Down` / `Left` 写入 `replay.array.add`；瞬移写 `Teleport`。因此移动尝试即使失败也会被记录；`onRecordCommand` 不会为这条路径触发。事件脚本驱动的 `moveHero` / `stepHero` 会 `replaySystem.disable()` / `revert()`，避免把脚本移动记成玩家输入。
3. 播放：`createReplaySandbox({ route, reseter, ... })` 先 `reseter.reset(save)`，再建 `ReplaySandbox`；沙箱构造时 `route.createReadStream(startIndex)`。
4. 单步：沙箱在主动步执行前先读下一步（`appendingStep`），因为被动步必须在主动步执行期间被消费；主动步执行完，若下一步是被动步且没被取走，日志告警并跳过（code 194）。
5. `finalize`：当前主动指令与上一步不同，或读流结束时，调用上一条指令的 `finalize()`；`ReplayMove` 正是靠它把连续移动合并为一次 `mover.start()`。
6. 存档：`ReplaySystem.saveState` 返回 `{ length, commandWidth, commandArray: getCommandArray().slice(), paramArray: getParamArray().slice() }`；`loadState` 调用 `setReplayArray`，重建索引并使旧读流过期。
7. 禁用：`disabled` 是嵌套计数，`disable()` +1、`revert()` -1、`clearDisableFlag()` 归零；`CoreState.loadState` 在开始处清空，读档期间逐对象包裹。

**常见误解**

- 「录像记录的是结果」：错误；它记录入口动作与参数，结果在回放时重算。
- 「播放沙箱会自动暂停录制」：错误；沙箱不碰 `disabled`，播放方必须自己 `disable` / `revert`，否则移动器会再次写入并让读流过期。
- 「`saveState` 返回内部缓冲区」：当前实现是切片副本；不要按旧版文档写「直接引用」。
- 「`get(index)` 可以用来顺序播放」：它是随机读，播放应使用 `createReadStream`。
- 「`ReplaySystem.replaying` 会被自动维护」：当前没有代码设置它；不要在正文承诺它的语义。

### D2 事件

**为什么这样设计**

- 收集与执行分离：收集只依赖图层与坐标，可以在不知道脚本的情况下工作；执行才依赖事件仓库、触发器与解释器。
- 收集结果只带 `{ id, env }`：事件对象可能被替换、仓库可能被替换，收集阶段不应持有事件实例。
- 组序固定：点事件整组优先于图块事件整组，组内才按优先级降序；这是让「坐标语义」稳定压过「物体语义」，而不是让数值优先级跨组比较。
- 触发器过滤在执行器：同一坐标可能因 `OnEnter` / `OnLeave` / `OnTouch` 多次被收集，收集器只负责把时机写进 `env.trigger`。
- 执行器是共享对象：`mode` / `reduce` 是执行器状态，不是每次调用的参数。

**关键生命周期**

1. 事件登记：`GameEventStore.addEvent(id, event)`；重复 id 告警 170 并覆盖。
2. 事件编译：`GameEvent.compile()` 调解释器并缓存；`setRaw` 清缓存；`execute` 优先用缓存。
3. 收集：`GameEventSystem.collectEvent(layer, trigger, x, y)`；越界返回空；点事件 + 静态图块事件 + 动态图块事件；两组各自降序后拼接。
4. 执行：`EventExecutor.execute(invocations, param)`；仓库/事件缺失告警 171 跳过；trigger 不匹配静默跳过；`await event.execute`；按 `mode` 短路；按 `reduce` 折叠；调用 `onAfterExecuteEvent`。
5. 派发：`DefaultHeroMoveTopImpl` 在 `enter` / `leave` / `hit` 中调用 `collectEvent`，分别对应 `OnEnter` / `OnLeave` / `OnTouch`；`cannotEnter` 是空实现。
6. 内建函数：`BuiltInFunction { name, func(param, env) }`；注册进 `config.events`；`GameEventSystem` 构造解释器时传入。

**常见误解**

- 「事件层一定是特殊图层」：它是被指定为事件层的普通图层；内容加载时 `alias === 'event'` 会默认指定，`setEventLayer` 也可以改。
- 「收集时就按触发器过滤」：不会；过滤在执行器。
- 「`param` 就是事件参数」：不是；`param` 是 `Call.parameters` 求值后的对象，事件参数在脚本的 `scope.args`。
- 「`@shouldReplay` 会自动写录像」：不会；它只登记检查路径。
- 「所有 `EventTrigger` 都已派发」：只有 `OnTouch` / `OnEnter` / `OnLeave` 有派发点。

### D3 Anon-Tokyo

**为什么这样设计**

- 脚本是结构化数据，所以可以被内容系统序列化、被事件对象缓存编译结果；不需要在运行时解析文本。
- 编译与执行分离：`compile` 解析内建函数名并生成程序节点；`exec` 每次新建上下文，避免不同执行之间共享调用栈或局部变量。
- `Scope` 三层：`args` 是本次调用参数，`local` 是本次迭代器的局部变量，`env` 是调用链共享的环境；这个分层让参数、局部状态、外部上下文不会互相污染。
- `Call` 是语句而不是表达式：内建函数与全局函数的返回值不写回作用域；需要值就用 `Expression` 写入 `scope.local`。
- 编译期解析内建函数：名字写错在 `compile` 就失败；全局函数在解释器构造时编译，调用时才查表。

**关键生命周期**

1. 构造解释器：`new AnonTokyoInterpreter({ builtInFunctions, globalFunctions })`；内建函数装表，全局函数立刻编译。
2. 编译：`compile(script)` 做控制流分析，生成按编号索引的程序节点；遇到 `Call` 且 `builtIn` 为真时，编译期就解析内建函数。
3. 执行：`executable.exec(parameters, env)` 新建上下文；上下文持有调用栈与 `env`；迭代器持有 `args`、`local` 与当前节点。
4. 推进：节点返回 `Move` / `Call` / `Return` / `Exit`；`Call` 把控制权交给全局函数（新迭代器压栈），`Return` 记录返回值，`Exit` 结束整个执行。
5. 事件衔接：`GameEvent.compile` 缓存 `AnonTokyoExecutable`；`GameEvent.execute` 优先用缓存；`setRaw` 清空缓存。

**常见误解**

- 「脚本是可解析的字符串」：不是；它是 `Statement[]`。
- 「`Call` 的返回值会出现在后续语句」：不会；`Call` 是语句，值要自己写进 `scope.local`。
- 「`local` 与 `env` 可以混用」：不要；`local` 每次执行独立，`env` 沿调用链共享。
- 「表达式的闭包一定会被保留」：相邻节点会合并执行，合并后的表达式不能依赖定义处的外部变量；数据通过 `scope` 传。
- 「`save` 字段会自动存档/录像」：当前没有语义。
- 「执行上下文可以导出」：没有可用的导出/转储能力。

### D4 通行性与寻路

**为什么这样设计**

- 一个契约：`canPass` 与 `shouldHit` 同时服务勇士移动与寻路构图，保证「寻路选出的路」与「勇士实际能走的路」在默认装配下一致。
- 两个问题：`canPass` 是「进不进得去」，`shouldHit` 是「进得去但会不会撞」；把两者分开，才能让「带事件的墙」既不可进入、又能在寻路里作为目标终端。
- 两个实例：`DefaultHeroMoveTopImpl` 自建一个默认谓词，`MainDataPlugin` 为 finder 另建一个；行为一致、对象不同、状态不共享。
- 构图只保留可达节点：搜索不必处理不可达区域；终端标记把「走得到但会撞」编码进图，搜索不再重新判断通行。
- 损失与通行分开：损失函数只决定进入代价，不决定能否进入；不可通行由谓词负责。

**关键生命周期**

1. 初始化：`MainDataPlugin.awake` 创建 `DefaultPassPredicateImpl` 注入 finder，图层先置空，`useMover(state.hero.location.mover)`；再创建 `DefaultHeroMoveTopImpl` 并 `useTopImplementation`。
2. 勇士一步：`HeroMover.onStepStart` 记录方向/瞬移，判断边界，调用 `topImpl.predicate()` 的 `canPass` / `shouldHit`，返回 `CannotMove` / `Hit` / `Step`。
3. 结算：`onStepEnd` 对 `CannotMove` 调 `cannotEnter` 并停止，对 `Hit` 调 `hit`（触发 `OnTouch`）并停止，对 `Step` 返回目标格；`onStepSettled` 先 `leave`（`OnLeave`）再 `enter`（`OnEnter`）。
4. 构图：`MapGraphBuilder.build(start)` 检查图层、谓词、方向处理器与起点，BFS 只沿 `canPass` 的边扩展；`shouldHit` 标记终端；只把可达节点放进图。
5. 搜索：`PathFinder.search` 用最小损失堆，只读 `cost` / `terminal`；终端只能作终点。
6. 系统层：`getPath` 从 mover 的 tile 取起点；`moveTo` 总是逐步；`teleportTo` 由策略决定；忙碌返回 `null`；`interrupt` 等底层停止。

**常见误解**

- 「勇士与寻路共享同一个谓词对象」：不是；默认装配是两个实例。
- 「`shouldHit` 为真就是不能走」：不是；是走得到但会撞。
- 「动态图块会挡路」：默认实现不读动态图块；需要时写自定义谓词。
- 「损失函数可以用 `Infinity` 标记不可达」：不要把 `Infinity` 当通行判断；通行由谓词控制。当前实现对 `Infinity` 是接受的，`NaN` / 负数才回退 1。
- 「终端节点可以作为中间点」：不可以；它只能是目标。

### D5 CoreState

**为什么这样设计**

- 组合根：所有入口从 `CoreState` 出发，层与层之间由它注入，生命周期只有一套。
- 四层是构造依赖：L0 工具与仓库 → L1 可存档状态 → L2 操作状态的系统 → L3 启动入口；依赖只能向下。
- 插件最后装配：`awake` 可能访问任意一层，必须在四层齐了之后。
- 加载与读档分开：`load()` 只做初次加载（插件三阶段 + loader）；`loadState()` 做快照恢复（逐对象 `loadState` + 执行器）。

**关键生命周期**

1. 构造：L0（`roleFace` / `faceManager` / `tileStore` / `itemStore` / `mapStore` / `eventStore` / `enemyStore` / `replaySystem`）→ L1（`flags` / `maps` / `hero` / `enemyManager`）→ L2（`enemyContext` / `combat` / `eventSystem` / `pathfinding`）→ L3（`loadManager` / `loader` + `addCoreConfig`）。
2. 插件：遍历 `config.dataPlugins` 建表（重复 id 告警 78）→ `orderPlugins` 排序 → 按顺序执行 `awake`，状态置 `Awakened`。
3. 加载：`load()` → `initialize()`（`Awakened` → `Initialized`）→ `loader.start()` → `afterLoad()`（`Initialized` → `Loaded`）→ 检查未完成插件（告警 81）。
4. 存档：`addSaveableContent`（重复 id 112）→ `bindSaveableExecuter`（未注册对象 113）→ `saveState` 遍历注册表 → `loadState` 清 disable flag、逐对象 `disable` / `loadState` / `revert`、执行器在包裹外、缺 key 177 / 多 key 178。
5. 五个内置 id：`@system/hero` / `@system/flags` / `@system/maps` / `@system/enemy` / `@system/replay`。
6. 第二实例：`new CoreState(fullConfig)` 不依赖全局单例；必须传四个字段；`load()` 要被消费。

**常见误解**

- 「`new CoreState` 就等于加载完成」：不是；返回的是未异步初始化的实例。
- 「读档会重跑插件 afterLoad」：不会；只在初次加载后运行。
- 「存档顺序有保证」：没有；执行器只保证当前对象已恢复。
- 「`loader` 是低层」：它是 L3；低层扩展点的 `state` 看不到它。
- 「可以只传 starter 与 coreURL」：构造器需要完整 `ICoreStateConfig`；测试里的省略写法与契约不一致，不要照抄。

### D6 插件内部

**为什么这样设计**

- 顺序来自依赖图，不来自列表位置；列表位置只决定互不依赖插件的平局顺序。
- 三个阶段共享同一份拓扑序；状态机保证每个插件每个阶段只执行一次。
- 失败不是异常，而是把插件及其下游从执行集合里移除；所以作者看到的往往是「对象不存在」而不是明确错误。
- `MainDataPlugin` 只是普通插件；用它的默认装配/存档 id 时必须显式依赖。

**关键生命周期**

1. 构造期：建插件表（`id` → `{ status, plugin }`，重复 id 告警 78）→ 建依赖表 → `orderPlugins` → `awake`。
2. `orderPlugins`：缺失依赖检测 → 环检测 → 阻断传播（环/缺失的下游）→ 反复扫描输出就绪插件；按插件表插入顺序扫描。
3. 三阶段：`awake`（同步、不等待）→ `initialize`（加载前、await）→ `afterLoad`（加载后、await）；每个阶段只处理前一状态的插件，状态不符告警 80。
4. 失败：环 76 / 缺失 77 / 重复 78 / 状态 80 / 未完成 81；被阻断的插件停在 `NotAwakened`。
5. 取回：`getDataPlugin` 返回 `{ status, plugin }` 或 `null`；启动阶段优先用 `dataDeps`。

**常见误解**

- 「列表里排第一就先执行」：不是；只影响平局顺序。
- 「依赖写错会抛异常」：不会；插件被排除，控制台提示。
- 「`getDataPlugin` 拿到就能用」：还要检查 `status === Loaded`。
- 「被阻断的插件可以通过再次 `load()` 补跑」：不会；状态只前进，没有重置。
- 「`MainDataPlugin` 自动在前」：只是列表顺序；没有隐式依赖。

---

## E. 风险

### E1 结构性问题（最高）

1. 当前工作区是一次回退式改写：八页合计删除 1017 行、只新增 593 行（七篇目标页占主要部分），删掉的正是「加载管线 / 存档挂载 / 第二实例 / 两个实例 / 三种结果 / 存档形状 / 内部实现」这些需要跨文件理解才能写出的设计段落。
2. 页面被组织成接口清单，而不是「模型 → 数据流 → 为什么 → 扩展点」。读者能查到方法，却无法判断「这个改动该落在哪一层」。
3. 跨页架构断裂：`index` 不再是 8 页地图（当前写「七篇地图」且表序与阅读路径冲突）；`core-state` 与 `plugin-internals` 的边界被压缩后互相缺环；`event-system` 与 `anon-tokyo` 的衔接被删；`replay-internals` 与 `core-state` 的存档挂载互相引用不到。

### E2 当前文档 actively wrong / too shallow

1. `replay-internals`：没有「播放必须禁用录制」这一关键约束；没有「移动器在步进开始时记录」的入口说明；没有存档形状；`finalize` 只被描述成「连续步骤收尾」，没有说明 `ReplayMove` 的「入队 + 最后 start」用法。读者按当前页写播放，会在移动器再次记录时让读流过期。
2. `event-system`：把事件层写成「alias 为 event 的普通图层」；把事件注册写成「内容侧注册」；没有 env 表；没有 `@shouldReplay` 的准确含义；没有执行器异常行为。这些会让读者误判「事件层可随意替换」「事件失败会被吞掉」。
3. `passability-and-pathfinding`：删掉了「同一契约、两个实例」与「勇士移动三种结果」；没有说明默认谓词只看静态图块；「同一套规则」说得过满。读者会以为改勇士规则会自动同步寻路。
4. `core-state`：删掉了加载管线、存档挂载、第二实例与内部装配顺序；读者无法判断「新增可存档对象要注册到哪里」「读档为什么不重跑 afterLoad」。
5. `anon-tokyo`：删掉了「与事件对象的衔接」与内部实现；`save`、`dump()`、`Exit` / `Return`、闭包约束都没有了。
6. `plugin-internals`：三阶段的依赖参数、`awake` 不等待、失败展开被压缩；`MainDataPlugin` 警告虽然补上了，但读者仍不知道「什么时候必须声明它」。

### E3 以前的「只读局部代码」结论（需用户裁决）

1. `docs/advanced/ii/pathfinding.md` 说损失函数返回值应是非负的有限数、`Infinity` 非法；当前 `MapGraphBuilder.resolveCost` 明确把 `Infinity` 当合法损失，只有 `NaN` / 负数回退 1。这是一条与实现冲突的旧结论；重写通行页时应写成「`Infinity` 不是通行判断工具，当前实现接受它」，不要照抄「有限数」。
2. `docs/advanced/ii/custom-replay-command.md` 说「播放时不要禁用录制」；`replayPlayback.test.ts` 的播放函数明确用 `disable()` / `revert()` 包裹，且 `HeroMover` 在步进时会再次 `array.add`。如果不禁用，任何写入都会让读流过期。重写录像页时应写「播放期间必须禁用录制」；是否回头修 II 需用户决定。
3. HEAD 版 `replay-internals.md` 说 `saveState` 返回内部缓冲区直接引用；当前 `ReplaySystem.saveState` 使用 `.slice()`，是副本。重写时以当前实现为准，旧句不能保留。
4. `docs/advanced/iii/loading-system.md`（已验收样板，不在本次范围）把 `addExtraConfig` 的 `url` 例子写成 `content/quest/quest.jsonc`；加载器实际会再前置 `content/`，得到 `src/content/content/quest/quest.jsonc`。`IMotaDataLoader.addExtraConfig` 的注释写「相对于 src」，实现是「相对于 src/content」。这是一条注释/实现不一致（D-72：只在对话报告，不写进正文）；因为 loading-system 已验收，建议只记录、不改。
5. `passability-and-pathfinding` 的 HEAD 版与当前版都说「先把方向降级到四向，再检查通行位」；默认实现只用降级结果判断是否为 `Unknown`，通行位掩码仍按原始方向计算。四方向玩法下没有差异，斜向输入下会不同。重写时按「默认四方向」表述，不要把「降级后的方向用于掩码」写成事实。
6. `event-system` 的「事件由内容侧注册」在当前仓库没有加载实现：只有测试构造 `GameEvent`，`src/data` 只注册内建函数。重写时写「登记接口是 `eventStore.addEvent`」，不要写「内容加载已经这样做」。
7. `ReplaySystem.replaying` 字段当前没有代码设置；`BuiltInFunction.save` 没有被解释器读取；`AnonTokyoExecutionContext.dump()` 是空实现。文档不要给这些字段/方法赋予未证实的语义。

### E4 只报告、不写入文档的源码观察

- `HeroMover.onStepStart` 用 `replay.array.add` 直接记录，绕过 `ReplaySystem.record`，所以 `onRecordCommand` 钩子不会为玩家移动触发；这是设计还是遗漏需用户确认。
- `src/data/event/hero.ts` 的 `EventMoveHero` / `EventStepHero` 在 `controller` 为 `null` 时直接返回，没有 `revert()`，可能留下禁用层；文档不要描述「必定成对」。
- `compile.ts` 里有 `console.log` 调试输出；不影响文档，但说明该子系统仍在整理。
- `IGameEventSystem` 的 deferred 条目提到「同一系统同时只执行一个事件」尚未实现；文档不要写成既有约束。

### E5 需要用户决定的问题

1. 是否把「恢复 HEAD 已有章节」作为重写的基线，还是允许按本简报重新设计章节（例如把 `core-state` 的「内部实现」合并为更短的一节）？
2. `passability` 页是否要写「斜向输入与默认四方向掩码」的差异？这属于实现细节，可能超出「原理」范围。
3. `replay-internals` 是否保留「旧引擎基线对比」？当前读者审阅把它标为低概率；建议压缩成 3 行「为什么是二进制」，不再列旧字段。
4. `event-system` 是否要写「事件执行异常会让 `execute` 拒绝、后续项不执行」？这是当前实现的真实行为，但可能与未来「串行执行」约束冲突；建议写成当前行为并标注边界。
5. 高级 II 的 `pathfinding.md` 与 `custom-replay-command.md` 的冲突是否要在本轮一并修正？本次任务范围只允许写这份简报，不能改 II。

---

## F. 写作顺序与验收清单

1. 先写 `core-state` 与 `plugin-internals`：它们是其它页的隐性前置；写完后再写 `event-system` / `anon-tokyo`，最后 `passability` / `replay`，最后 `index`。
2. 每页完成后对照 A4 的十条检查：是否有模型、是否有数据流、是否有「为什么」、示例是否完整、接口是否按需引入、边界是否 5–6 条、是否有验证、是否有返回导览、是否无源码叙述、是否无模板标记。
3. 跨页检查：`index` 的 8 页表与阅读路径一致；每页开头有「本篇只讲 X；Y 见 Z」；C1 的每个概念只在一个页面展开；C3 的重复项为零。
4. 事实检查：至少复核 E3 的 7 条；涉及「录像存档引用」「播放禁用录制」「损失函数 Infinity」「事件层 alias」「事件注册」的句子必须与当前源码一致。
5. 格式检查：prettier、CRLF、单 H1、相对链接可解析、无死链；构建通过。
6. 审阅检查：按 D-46 的独立读者循环与 D-78 的章节使用概率；重点问「读完能否判断改动落点」「两个实例 / 两个阶段是否讲清」「示例能否照做」。

---

## 附：本简报的核心结论

- 高级 III 的问题不是「某几个接口写错」，而是页面被压缩成接口清单，失去了「模型 → 数据流 → 设计理由 → 扩展点」的主干。
- 重写必须以 `core-state` 为根，以「一个契约、两个实例」「两个阶段」「三层作用域」「输入日志而非状态快照」这些不变量为骨架。
- 所有示例都应从「读者要完成的任务」出发，而不是从「类有哪些成员」出发；所有边界都应来自真实的失败模式，而不是接口注释的复述。

