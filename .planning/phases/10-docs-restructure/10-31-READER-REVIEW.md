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

