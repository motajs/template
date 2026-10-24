# 高级 I 补写（Mover / FaceHandler）用户修订记录

## 第 1 轮（2026-10-24，待执行）

**用户意见（核心）：** 两篇文档重心不对。重心应是**怎么使用**，不是怎么自定义。游戏需要自定义移动器 / 自定义朝向组的概率几乎为 0，不要大篇幅写自定义；应重点讲：怎么用、不同可移动对象怎么获取移动器（动态图块、勇士等）。自定义部分最多一两节简单带过。

**长期规范：**

- **D-77**：文档重心是「怎么用」；自定义内容最多一两节；写作后自问每个章节的使用概率，通篇低概率说明文档不好。
- **D-78**：独立读者审阅必须为每个章节给出「被使用的概率」（高/中/低 + 理由）。

**重构要求：**

- `mover.md`：以用法为主——先讲移动器能做什么；**如何获取移动器**（勇士 `state.hero.location.mover`、动态图块 `tile.mover`、如何得到动态图块等）；如何规划（`step`/`stepFace`/`forward`/`backward`/`tp`/`face`/`jump`/`speed`/`animDir`/`push`/`clear`）；如何开始与等待（`start` → `IMoverController` → `onEnd`）；执行中控制（`controller.push`/`insert`/`stop`）；配置与钩子的用法；自定义移动器 / 勇士 `useTopImplementation` 压缩到末尾 1–2 节。
- `face-handler.md`：以用法为主——如何获取处理器（`faceManager.get` / `getById`）、常用方法（`move`/`movement`/`opposite`/`next`/`degrade`/`dirOf`/`mapMovement`）、用在哪里（移动器、图块朝向、`roleFace` 绑定）、内置 Dir4/Dir8 差异；自定义处理器压缩到末尾 1 节。
- 低概率内容（内部执行流程、深度实现差异等）后置或大幅删减。
- 保持 D-72（注释优先）与源码准确性。

**状态：已执行（2026-10-24）**

### 执行记录

**改动范围：** 仅 `docs/advanced/mover.md`、`docs/advanced/face-handler.md`；未改代码、配置与状态文件。

**`mover.md`（775 → 525 行）：**

- 新顺序：能做什么 → 拿到移动器（勇士 / 动态图块 / 其他对象）→ 排计划 → 开始与等待 → 执行中控制 → 勇士配置 → 钩子 → 读取与设置状态 → 自定义（2 节）→ 边界 → 验证。
- 「拿到移动器」提前到第 2 节，给出 `state.hero.location.mover`、`tile.mover` 与取得动态图块的方式（`transferToDynamic` / `createDynamic` / `getDynamicTilesAt` / `iterateDynamicTiles`），并补 `tile.step()` 便捷入口。
- 步骤类型表并入「排计划」（`controller.push` 需要）；配置表前移到用法区。
- 删除独立的「内部执行流程」整节；删掉 `SimpleTile` + 装配 + 插件装配三段示例，自定义移动器只留一条 5 方法说明与一个最小模板。
- 自定义压缩为末尾两节：「实现自己的移动器」「勇士的顶层实现」；保留 D-76 面朝 / 移动朝向说明。
- 新增勇士「排好计划也不一定真走」的用法提示（通行失败时 `HeroMover` 调 `controller.stop()`）。

**`face-handler.md`（447 → 350 行）：**

- 新顺序：三个概念 → 拿到处理器 → 常用方法 → 用在哪里（移动器 / 寻路、图块朝向、`roleFace` 映射）→ 内置 Dir4/Dir8 → 自定义（1 节）→ 边界 → 验证。
- 「拿到处理器」提前，明确 `get<FaceDirection>` 泛型、`getById` 与 `null` 判空；`state.roleFace` 在「用在哪里」中作为映射入口讲。
- 常用方法表保留 8 个方法，补一段 `movement` 组合用法；`dirOf` 特例按 D-72 收敛为「实现特例，不要当四方向结果」。
- 自定义处理器压缩为 1 节：契约 4 条 + 一个完整模板（用 `CW` 数组替代原有的两张旋转表）+ 注册示例；删除大段表格解释。
- `setFaceDirection` 降级分支与 `Dir8.degrade` 的实现差异各保留一句，放在使用说明处而非独立小节。

**验证：** `prettier --write` 两篇通过；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 构建通过，无死链；CRLF 保持。

**自评（按 D-77 / D-78）：** 高概率章节（拿移动器、排计划、开始与等待、执行中控制、常用方法、用在哪里）占正文约一半且全部前置；自定义仅末尾 2 节 / 1 节。仍属低概率但保留的内容：`mover.md` 的自定义模板与勇士顶层实现示例（读者确需扩展时才有用），`face-handler.md` 的 `IRoleFaceBinder` 细节（图块换向时才会用到）。\*\*

## 第 2 轮（2026-10-24）

**用户意见：** 两篇文档应先讲系统模型，再讲接口与用法（D-82）；删除正文中的使用概率元信息（D-79）、源码叙述与实现 / 注释差异说明（D-80），以及把用户问题写进文档的框架（D-81）。朝向组的自定义示例应体现非方格布局（六边形），而不是任意示例；自定义仍只保留一节。

| 条目 | 落点                          | 处置                                                                                                             | 状态        |
| ---- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------- |
| M1   | `mover.md` 首节               | 新增「移动器模型」：可移动对象、移动计划、执行与控制器、面朝 / 移动两个方向；接口分工表并入模型                  | 状态：已处理 |
| M2   | `mover.md` 全文               | 删除「使用概率很低」、`forward` 的源码注释说明、默认实现与装配处的源码路径                                       | 状态：已处理 |
| F1   | `face-handler.md` 首节        | 把「三个概念」改为「朝向模型」，补齐 `IFaceDescriptor` 与 `IRoleFaceBinder`，先讲移动与显示两条数据流           | 状态：已处理 |
| F2   | `face-handler.md` 全文        | 删除「使用概率很低」、`dirOf` 八方向遍历、降级分支未写回图块、`Dir8FaceHandler.degrade` 实现差异、分组来源的源码路径 | 状态：已处理 |
| F3   | `face-handler.md` 自定义一节  | 示例改为六边形布局的 `HexFaceHandler`（六个邻接方向）；保留四条契约与一个注册示例，仍为一节                      | 状态：已处理 |

### 执行记录

- 仅修改 `docs/advanced/mover.md`、`docs/advanced/face-handler.md`；未改代码、配置、状态文件，未写 SUMMARY。
- `mover.md`：新增首节「移动器模型」；删除正文中的使用概率与源码 / 实现差异叙述；保留 D-76 面朝朝向与移动朝向的语义区分。
- `face-handler.md`：首节改为「朝向模型」，补齐五个组件与两条链路；删除源码级与实现 / 注释差异说明；自定义一节改为六边形布局示例（`HexFaceHandler`，六个邻接方向），注册改用字符串 id `hex`；验证段同步改为六方向检查。
- 验证：`prettier --write` 两篇 unchanged；`pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build` 输出 `build complete in 17.97s`，无 dead link；CRLF 与单 H1 保持。
