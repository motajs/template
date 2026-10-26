# 高级 I 补写（Mover / FaceHandler）读者审阅

## 读者人格（逐字，沿用高级 I）

> 假设你是一位对代码有一定了解、了解基本语法（变量、函数、类、import 等），但代码能力一般、不熟悉引擎内部架构的游戏作者。你已经读完中级教程，正在阅读高级教程 I，想判断自己能不能照着文档完成插件等扩展。

## 第 1 轮 · 问题清单

### 阻断性（4）

| # | 问题 | 定位 |
|---|------|------|
| B-01 | `start()` 返回 `null` 时，文档让读者「等 `controller.onEnd` 或调用 `stop()`」，但此时根本没有 controller（返回的就是 null），`IHeroMover` 也没有 `stop()`。应改为：保存上一次 `start()` 返回的 controller，等它的 `onEnd` 或对它 `stop()` | `mover.md`「边界与注意」 |
| B-02 | 勇士扩展点 `useTopImplementation` 只有一句，没有 `IHeroMoveTopImpl` 契约、示例，也没说与内置 `DefaultHeroMoveTopImpl` 的关系；而 `ObjectMover` 模板会丢掉勇士的通行/踩踏/撞击/自动存档。照文档只能在「整类重写丢功能」和「不改」之间选 | `mover.md`「拿到现成的移动器」「实现自己的移动器」 |
| B-03 | `MapTileBase.setFaceDirection` 的降级回退与源码不一致：文档说折一次再查、查到就换图；源码降级分支只 `return next.identifier`，没有 `this.set(...)`（`packages-user/data-base/src/map/tile.ts:56-71`） | `face-handler.md`「它们怎么串起来」 |
| B-04 | `Dir4FaceHandler.dirOf` 实际遍历 `DIR8_MOVEMENTS`，`dir4.dirOf(1,1)` 返回 `RightDown`；与「四方向只认上下左右」不一致（源码 bug 或文档需改） | `face-handler.md`「IFaceHandler 能做什么」「两个内置处理器」 |

### 非阻断（摘要）

- `config()` / `speed()` / `animDir()` 的持久性：mover 上不重置，会带到后续移动（文档需说明）。
- `mover.push(steps[])` 是数组，`controller.push(...steps)` 是可变参数，易写错。
- 执行中异常路径：步进方法/钩子抛错时 `onEnd` 不兑现、`moving` 恒真，后续 `start()` 恒返回 null（文档需提示）。
- 「怎么验证」的 `step(Right,2).face(Down).step(Down)` 是 4 个 step，不是 3 个。
- `faceManager.get(FaceGroup.Dir8)` 不传泛型时返回 `IFaceHandler<number>`，静态类型非 `FaceDirection`。
- 朝向图块的示例数字 1/2 来源与地图编号冲突未说明。
- 重复 `malloc` 时子图块旧 `faceMap` 仍可查到旧映射。
- `mapMovement` 含 `Unknown` 零偏移；直接遍历会把对象原地走一步（寻路内部会跳过）。
- `Dir8FaceHandler.degrade(999)` 实际返回 999，不是 `Unknown`。
- `mover.ts` 的 `IObjectMover.forward` 注释「沿当前移动方向」与文档「沿面朝朝向」的歧义（按 D-76，实现正确，文档需说明）。
- `index.md`：「同时覆盖数据端与渲染端」与「暂时只能写数据端」张力；「读完这一层」未覆盖 Mover/FaceHandler；阅读路径未列入。
- 自定义 mover/handler 接进插件/真实对象的目录、生命周期、持有者、存档、替换现有 mover 未说明（最大非阻断缺口）。
- `HeroMover` 开头说「负责边界/通行/踩踏/撞击」，后文又说「通行判断不在移动器里」，需一句「自己不判定，只转发给 topImpl」。

## 迭代记录

## 第 1 轮 · 修复记录

仅改 `docs/advanced/mover.md`、`docs/advanced/face-handler.md`、`docs/advanced/index.md` 与本记录；未改生产代码与配置。

### 阻断项

| # | 处置 | 说明 |
|---|------|------|
| B-01 | 已修正 | `mover.md`「边界与注意」：`start()` 返回 `null` 时没有新控制器，只能用上一次 `start()` 保存的 `controller` 等 `onEnd` 或对它 `stop()`；明确 `IHeroMover` 没有 `stop()`。 |
| B-02 | 已修正 | `mover.md` 新增「勇士的顶层实现」：`IHeroMoveTopImpl` 六个方法、`IHeroMoveTopHandler` 字段、与 `DefaultHeroMoveTopImpl` 的关系与装配位置，并给出包装默认实现的完整类示例；说明 `ObjectMover` 只算落点，勇士的边界/通行/踩踏/撞击与配置不在其中。 |
| B-03 | 已按注释修正并报告 | `face-handler.md` 按 `setFaceDirection` 方法注释描述「折一次再查、查到就换图」的语义，并标注实现差异：降级分支只 `return next.identifier`，未 `this.set(...)` 写回。按 D-72 以注释为准，未按实现改写注释语义。 |
| B-04 | 已按通用语义修正并报告 | `face-handler.md` 不再断言 `Dir4` 只返回上下左右；在 `dirOf` 段说明内置 `Dir4FaceHandler.dirOf` 遍历八方向表，`dirOf(1, 1)` 返回 `RightDown`，属实现与直觉/文档描述不一致；接口注释只承诺多解时返回其一。 |

### 非阻断项

| 项 | 处置 |
|----|------|
| `config()` / `speed()` / `animDir()` 持久性 | `mover.md`「移动器状态」补充：状态不随 `start()` 重置，会带入下一次；需要默认值要显式重设。 |
| `mover.push(steps[])` 与 `controller.push(...steps)` | `mover.md`「排一个移动计划」补充两者形状差异。 |
| 异常路径 | `mover.md`「执行与等待」与「边界与注意」补充：抛错时 `onEnd` 不兑现、`moving` 恒真、后续 `start()` 恒 `null`。 |
| 验证步数 | `mover.md`「怎么验证」改为四步计划，预期写明 `Dir`、`Dir`、`Face`、`Dir` 四个步骤。 |
| `faceManager.get` 泛型 | `face-handler.md` 说明不传泛型返回 `IFaceHandler<number>`，示例改用 `get<FaceDirection>`。 |
| 朝向图块编号来源 | `face-handler.md` 说明 `1` / `2` 为占位，`malloc` / `bind` 会覆盖既有映射，应取真实图块数字。 |
| 重复 `malloc` | `face-handler.md`「边界与注意」补充子图块仍持有旧 `faceMap`，需重新 `bind`。 |
| `mapMovement` 含 `Unknown` 零偏移 | `face-handler.md` 说明自行遍历要跳过零偏移，寻路构图已跳过。 |
| `Dir8FaceHandler.degrade(999)` | `face-handler.md` 报告实现返回 `999`，与接口注释「无效值应返回 `Unknown`」不一致，提示不要把该值当合法方向。 |
| D-76 朝向语义 | `mover.md`「移动器状态」补充：源码注释的「当前移动方向」指面朝朝向，`onSetMoveDir` 的「朝向」指移动朝向，实现正确。 |
| `index.md` 张力与覆盖 | 统一为「目标双端覆盖、当前只写数据端」；阅读顺序说明 Mover / FaceHandler 为按需参考；阅读路径与「读完这一层」补入两篇能力。 |
| 接入与替换 | `mover.md` 新增「接进插件与真实对象」：`awake` / `afterLoad` 装配、处理器注册、勇士 `useTopImplementation`、动态图块 mover 只读、生命周期与存档。 |
| `HeroMover` 不判定通行 | 开头与「示例」段改为：`HeroMover` 只登记录像、写坐标、跑流程，通行/边界/踩踏/撞击转发给 `IHeroMoveTopImpl`。 |

### 报告给用户的源码/注释不一致

1. `MapTileBase.setFaceDirection`（`packages-user/data-base/src/map/tile.ts:55-72`）：注释描述降级后查到映射就换图，实现降级分支只返回 `next.identifier`，没有 `this.set(...)`。
2. `Dir4FaceHandler.dirOf`（`packages-user/data-common/src/common/faceManager.ts:202-207`）：遍历 `DIR8_MOVEMENTS`，`dirOf(1, 1)` 返回 `RightDown`；接口注释未限制只返回本组方向。
3. `Dir8FaceHandler.degrade`（`packages-user/data-common/src/common/faceManager.ts:95-97`）：原样返回入参，`degrade(999)` 为 `999`；`IFaceHandler.degrade` 注释约定无法降级时返回 `Unknown`。

### 本轮构建

- `pnpm exec prettier --write docs/advanced/mover.md docs/advanced/face-handler.md docs/advanced/index.md`：通过（mover 有格式变动，其余 unchanged）。
- `pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build`：`build complete in 15.06s`，无 dead link 报错。

## 第 2 轮 · 复审（非阻断项）

本轮仅改 `docs/advanced/mover.md`、`docs/advanced/face-handler.md`、`docs/advanced/index.md` 与本记录；未改生产代码与配置。以下结论均对照 `data-common/src/common/mover.ts`、`data-common/src/common/faceManager.ts`、`data-base/src/hero/mover.ts`、`data-base/src/hero/types.ts`、`data-base/src/map/types.ts`、`data-base/src/map/tile.ts`、`data-base/src/map/mover.ts`、`src/data/hero/moverImpl.ts` 与 `src/data/initialize.ts` 核对。

| # | 项 | 处置 |
|---|----|------|
| 1 | `predicate()` / `IPassPredicate` | `mover.md` 新增「改通行规则：predicate() 与 IPassPredicate」：`canPass` / `shouldHit` 的职责、`IPassCheckHandler` 的 `currLoc` / `nextLoc` / `direction` / `map` / `state` 字段、`CannotMove` / `Hit` / 正常移动的判定顺序、`ignoreTerrain` 会跳过整个谓词、`predicate()` 要返回稳定实例；包装默认实现的示例改为「禁止向左走」，并说明寻路需通过 `usePassPredicate` 单独注入。 |
| 2 | `start()` 返回 null 时的队列 | `mover.md`「执行与等待」与「边界与注意」补充：返回 `null` 时刚排的步骤没有被切片或清空，仍留在移动器里，下一次 `start()` 会执行；不要就用 `clear()` 丢掉。 |
| 3 | 异常后的恢复 | `mover.md`「边界与注意」改写：抛错后 `onEnd` 不再兑现、`moving` 恒真、后续 `start()` 恒 `null`，并会产生未处理的 Promise 拒绝；`moving` 对外只读，没有重置或强制结束入口，运行期没有恢复路径，只能重建数据端；建议用 `try` / `catch` 把预期内的失败转成结果码。 |
| 4 | `prepareStep` 与受保护成员 | `mover.md`「实现自己的移动器」明确：五个 `on*` 方法是 `protected` 抽象方法；`prepareStep` 与 `moveProgress` 是 `private`，不可覆写或调用；`faceHandler`、`moveDirection`、`faceDirection` 在接口上只读。 |
| 5 | `get<FaceDirection>(3)` 的分组键 | `face-handler.md` 说明 `FaceGroup` 为 `const enum`（`Dir4 = 0`、`Dir8 = 1`），内置取用应写枚举成员；`3` 只是当前空闲数字、不是保留区，可能与未来内置分组冲突，自定义分组更推荐字符串 id，数字键取用前先 `get(3)` 判空。 |
| 6 | `dirOf` 的内置特例 | `face-handler.md` 统一口径：内置 `Dir4FaceHandler.dirOf` 遍历八方向表属于实现特例，自定义处理器应只遍历本组表；`dirOf(1, 1) = RightDown` 在当前实现下可复现但不是接口承诺，且不是四方向结果，不能用于四方向判定，必要时用 `degrade` 或 `mapMovement()` 自行收敛。`dirOf` 契约条目与边界条目同步补充。 |
| 7 | `cannotEnter(handler)` 签名 | `mover.md` 包装示例保留接口要求的 `handler` 参数，调用 `DefaultHeroMoveTopImpl.cannotEnter()` 时不转发（默认实现声明为无参空实现），并补一段说明；表格与示例一致。 |
| 8 | `@shouldReplay` 放置 | `mover.md` 模板去掉 `onStepEnd` 上的标记（它只返回落点）；最小示例把标记移到实际写回朝向的 `onStepSettled`；「与录像、存档的关系」改为「标在方法体真正写状态的那一个」，并列出 `onStepEnd` / `onStepSettled` / `DynamicTileMover.onStepEnd` 三种情况。 |
| 9 | `index.md` 主要主题 | 「高级 I · 扩展基础」行的主要主题补入「移动 Mover、FaceHandler 系列」，与九篇清单一致。 |

### 本轮构建

- `pnpm exec prettier --write docs/advanced/mover.md docs/advanced/face-handler.md docs/advanced/index.md`：通过（mover、index 有格式变动）。
- `pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build`：`build complete in 19.98s`，无 dead link 报错。

## 复审收敛结论（收尾）

对照首轮清单、第 1 轮修复记录、第 2 轮复审表与两篇正文现状，逐条核对结论如下。

| # | 首轮问题 | 复审结论 | 依据 |
| --- | --- | --- | --- |
| B-01 | `start()` 返回 `null` 时该等谁、该停谁 | 已消除 | 「边界与注意」只用上一次 `start()` 保存的 `controller` 等 `onEnd` 或对它 `stop()`，写明 `IHeroMover` 没有 `stop()`；返回 `null` 时队列未被消费也一并说明 |
| B-02 | 勇士 `useTopImplementation` 缺契约与示例 | 已消除 | 「勇士的顶层实现」列出 `IHeroMoveTopImpl` 六个方法与 `IHeroMoveTopHandler` 携带的字段，说明与 `DefaultHeroMoveTopImpl` 的关系，并给出包装默认实现的完整类 |
| B-03 | `MapTileBase.setFaceDirection` 的降级语义与源码不一致 | 已消除 | 第 1 轮按方法注释口径改写；第 2 轮按 D-80 把实现差异移出正文，正文只留使用结论 |
| B-04 | `Dir4FaceHandler.dirOf` 遍历八方向表 | 已消除 | 正文不再断言 Dir4 只返回上下左右；`dirOf` 收敛为「实现特例，可复现但不是接口承诺，不能用于四方向判定」 |

- 非阻断项：首轮 13 项已全部在正文落地（见第 1 轮修复记录）；第 2 轮复审另提 9 项，全部已处理（见第 2 轮表格）。复审未新增阻断项。
- 覆盖自查：两篇仍覆盖 D-75 要求的内容——移动三件套、步骤类型、控制器、钩子、`degrade` / `next` / `opposite` / `mapMovement`、`IRoleFaceBinder`、`useTopImplementation` 均仍在正文中。
- 无「仍存在」的阻断项。

**阻断性问题 = 0，审阅通过**

**未复用中级人格**：本记录全程使用上文的高级 I 人格提示词（假设读者已读完中级教程、正在阅读高级教程 I），未复用 `10-11-READER-REVIEW.md` 的中级教程人格（该人格「不懂代码」，与本篇的前提不同）。

### D-72 源码 / 注释差异（只在对话中报告，正文不保留）

按 D-80，正文不写实现与注释的差异；以下三项在执行期间向用户报告过，未写进 `mover.md` / `face-handler.md`：

1. `MapTileBase.setFaceDirection`：注释描述「降级后查到映射就换图」，实现降级分支只返回 `next.identifier`，未写回图块。
2. `Dir4FaceHandler.dirOf`：遍历 `DIR8_MOVEMENTS`，`dirOf(1, 1)` 返回 `RightDown`；接口注释未承诺只返回本组方向。
3. `Dir8FaceHandler.degrade`：原样返回入参，`degrade(999)` 为 `999`，与接口注释「无法降级时返回 `Unknown`」不一致。

### 收尾构建

- `node node_modules/prettier/bin/prettier.cjs --write docs/advanced/mover.md docs/advanced/face-handler.md`：两篇均 `unchanged`。
- `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`：退出码 0，`build complete in 14.31s`，无 dead link。
