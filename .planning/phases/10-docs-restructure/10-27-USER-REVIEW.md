# 高级 II 用户修订记录

## 第 1 轮（2026-10-20，待执行）

**状态：** 已记录，明日继续执行。修改方式将按 GSD 流程派发子代理（只改 `docs/advanced/ii/*.md`，必要时含 `docs/advanced/*.md`）。

| #     | 用户意见                                                                                                                                                                                                                                                       | 落点                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| U6-01 | `const hits = state.enemyContext.scanRange(new RingRange() ...)`：把 `new RingRange()` 提出来作为常量；引擎代码风格不建议在此内联 `new`                                                                                                                        | `custom-range.md`                                  |
| U6-02 | 范围要专门讲 `estimatePointCount`：只要求尽量快地估算大致数量，不要为数量准确牺牲性能（否则自动判断可能因估算太慢而变慢）                                                                                                                                      | `custom-range.md`                                  |
| U6-03 | 有些代码未包裹完整类上下文导致高亮错误，重点关注**类的方法**；适用于后续所有文档（D-70）                                                                                                                                                                       | 全部                                               |
| U6-04 | 点事件与图块事件较复杂，**单独开一篇文档**讲；重点：二者区别、跟随移动的区别、二者都可以自己设置且跟随存档                                                                                                                                                     | 新增文档（II）                                     |
| U6-05 | 「事件基准」简单提一句即可：`markPure` 与 `ref` 是样板内部优化接口，一般不要调用，除非清楚自己在做什么                                                                                                                                                         | `static-vs-dynamic-tiles.md`                       |
| U6-06 | 装备 `getModifier` 的实现细节不用讲，只说它用于获取装备修饰器                                                                                                                                                                                                  | `equipment-system.md`                              |
| U6-07 | 若 `slots` 定义为字符串，也可以传索引；索引最精确、字符串是粗略描述（同名时无法指定具体槽）。文档写成「不能混用」应改                                                                                                                                          | `equipment-system.md`                              |
| U6-08 | 「修饰器与存档的关键约定」讲的是内部实现：章节开头写「此章节讲解一下 XXX 的内部实现」；这类纯内部实现章节应放在文档靠后，前面主要讲使用（D-69）                                                                                                                | `equipment-system.md` 及后续                       |
| U6-09 | `loadEvent` / `unloadEvent` 尚未实现，文档要说明「还未实现」，待后续实现再改                                                                                                                                                                                   | `equipment-system.md`                              |
| U6-10 | 内置录像行为还没做完，不要用内置作为示例；直接用注释写一行省略已有录像码枚举                                                                                                                                                                                   | `custom-replay-command.md`                         |
| U6-11 | 被动录像的典型案例：弹出一个选择框，玩家选择内容；录像无法提前知道弹出什么选择框，只能等选择框出现后由选择框系统自己读录像选择——用这个案例讲被动录像                                                                                                           | `custom-replay-command.md`                         |
| U6-12 | 主动/被动录像的推进部分太复杂，不要讲太细：被动步用完后要调用 `next`，否则再次调用还是这个被动步（可能确实需要在多处调用，但务必 next）；主动步实现 `execute` 即可                                                                                             | `custom-replay-command.md`                         |
| U6-13 | 讲明「被动步为什么必须跟在主动步之后、且在主动步完成前全部被使用」：若主动步执行完才轮到被动步，被动步未被调用会永远卡住；主动步需要被动步时会报错。实际中被动步一定源于某个主动操作                                                                           | `custom-replay-command.md`                         |
| U6-14 | 录像注册建议写到插件里：安装别人的插件时无需自己再注册录像，只需新增录像码；这是样板推荐写法                                                                                                                                                                   | `custom-replay-command.md`                         |
| U6-15 | 记录处：`apply` 才是应写 `@shouldReplay` 的地方（它才可能修改状态），`use` 只是调用 `apply`，可以不写；且 `use` 里有 `if` 判断，不能用时会直接告警                                                                                                             | `custom-replay-command.md`                         |
| U6-16 | 沙盒播放不用讲（且原文讲错了）：沙盒播放必须启用录像，否则播放结束没有记录任何录像，不能重播也不能验证；样板会内置沙盒播放，作者几乎不需要自己写                                                                                                               | `custom-replay-command.md`                         |
| U6-17 | 被动步忘记 `next` 不是不推进，只是不读下一个录像；若此时主动录像播完，会继续播放后面的录像                                                                                                                                                                     | `custom-replay-command.md`                         |
| U6-18 | 自动寻路中不要用 `Infinity` 把一个点设为不可达；不可达应由谓词控制，用 `Infinity` 不标准                                                                                                                                                                       | `pathfinding.md`                                   |
| U6-19 | 样板所有 `.jsonc` 只允许开头那条带系统前缀注释的注释，后面不允许注释；勇士属性处不要说 `.jsonc` 允许注释。且 `.jsonc` 由编辑器修改，留占位                                                                                                                     | `adding-hero-attribute.md`（及 `.jsonc` 相关内容） |
| U6-20 | 新增勇士属性若需存档迁移，建议用 Executor 实现——Executor 本就是为了这个目标而存在                                                                                                                                                                              | `adding-hero-attribute.md`                         |
| U6-21 | 内容层是 JSONC，不经过 TypeScript 的 `Record` 检查；TS 手写 `IItemEquipData<IHeroAttr>` 的 `Record` 细节作者不需要知道，这段不用专门说                                                                                                                         | `adding-hero-attribute.md`                         |
| U6-22 | 怪物上下文不要讲手动更新（样板已基本做好，少数情况才需 `markDirty`）；细节过多、难懂，要降低理解难度。刷新只说：若怪物申请了上下文查询，周围怪物更新时它也要更新——这正是必须用 `query()` 而非 `handler.context` 的原因。局部刷新与全量重建章节缩减到现在的一半 | `enemy-context-and-combat.md`                      |

## 高级 I 待补内容（用户 2026-10-20 提出，待后续补写）

| #         | 主题                 | 说明                |
| --------- | -------------------- | ------------------- |
| AI-GAP-01 | 移动 Mover           | 高级 I 未讲，需补写 |
| AI-GAP-02 | FaceHandler 系列接口 | 高级 I 未讲，需补写 |

## 迭代记录

### 批次 A（U6-01..U6-09）执行记录（2026-10-22）

- U6-01：`custom-range.md` 的 `new RingRange()` 已提为模块级常量，调用处复用；验证段同步。
- U6-02：新增「estimatePointCount 的取舍」小节，强调只需快速估算、不要为精确牺牲性能；正文与边界条目同步。
- U6-03/D-70：`static-vs-dynamic-tiles.md` 中孤立的 `num()` 方法体已包进完整 `StaticTile` 类上下文；其余代码块检查为完整函数/类。
- U6-04：新增 `point-and-tile-events.md`；把原「事件的两类归属」「事件视图接口」「在代码里操作事件」迁入并扩写（区别、跟随移动、作者可设置、存档恢复）；`static-vs-dynamic-tiles.md` 保留简短指引；侧边栏 9→10，`index.md` 同步为十篇。
- U6-05：`markPure` / `ref` 在事件文档与图块文档中均只作「样板内部优化接口，一般不要调用」的简短说明。
- U6-06：`equipment-system.md` 不再讲 `getModifiers` 的懒构建等实现细节，只说明它用于获取装备修饰器；示例与边界条目相应收敛。
- U6-07：改写「槽位写法必须与定义一致/不能混用」；明确索引最精确、名称是粗略描述（同名槽无法指定），并说明 `equip.slots.includes` 的实际判定。
- U6-08/D-69：「修饰器与存档的内部实现」移至文档靠后（装备事件之后、验证之前），开头写明「此章节讲解一下……的内部实现」。
- U6-09：`equipment-system.md` 明确 `loadEvent` / `unloadEvent` 尚未实现，当前只是数据字段，也没有内置穿戴/卸下钩子。

**验证：** `pnpm exec prettier --write`（含新文档）→ `pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build` 构建通过，无死链告警。

### 批次 B（U6-10..U6-17）执行记录（2026-10-22）

- U6-10：`custom-replay-command.md` 的 `ReplayCode` 示例不再列出内置录像码，改为一行注释省略；正文删去「内置的移动、瞬移、使用道具、装备都是主动录像」这类以内置行为举例的说法。
- U6-11：被动录像改用「选择框」案例：主动步让选择框出现，选择框系统在框出现后通过 `getPassive()` 读取录像里的选择；不再用技能特效作被动示例。
- U6-12：主动/被动推进收敛为「主动步实现 `execute`；被动步处理完必须 `next`，不调用则再次 `getPassive()` 仍是同一步」，删去 `next(Success/Ignored/Failed)` 的细分说明。
- U6-13：补充被动步为什么必须紧跟主动步、且在主动步返回前被取走并 `next` 完；主动步需要被动步而下一步不是被动步时 `getPassive()` 返回 `null` 并报错。
- U6-14：「注册」改为推荐写在插件的 `awake` 里，安装插件即可带上指令，只需补 `ReplayCode` 码；`initializeReplay` 只留不属于任何插件的引擎内容。
- U6-15：`@shouldReplay` 改标在 `apply` 上，`open` 只是调用 `apply` 且带不可用时的提示与提前返回；正文说明为什么不必标在 `open`。
- U6-16：删除「沙盒播放」整节（含 `ReplayReseter` / `playReplay` / 播放控制表）；验证段说明沙盒播放由样板内置、作者一般不用自己写，且必须启用录制。
- U6-17：补充忘记 `next` 不会停住整条播放，只是不读下一个录像；主动步返回后沙盒会告警并跳过该被动步继续播放。

**验证：** `node node_modules/prettier/bin/prettier.cjs --write docs/advanced/ii/custom-replay-command.md` → CRLF、单 H1；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 退出 0、`build complete`、无 dead link。

### 批次 C（U6-18..U6-22）执行记录（2026-10-22）

- U6-18：`pathfinding.md` 不再教用 `Infinity` 标记不可进入；损失函数只要求非负有限数，`NaN` / 负数回退为 `1`，不可达统一由通行谓词控制。示例删去 `WALL_TILE` 与 `Infinity` 分支，边界条目同步。
- U6-19：`adding-hero-attribute.md` 与 `adding-enemy-attribute.md` 的 `.jsonc` 示例删去全部注释；正文不再说「`core.jsonc` 允许注释」，改为说明样板 `.jsonc` 只有文件开头那段系统前缀注释，加载器按前缀切开后直接 `JSON.parse`。编辑器新增 `编辑器 · 内容配置` 占位与 TODO，并同步开头「编辑器负责内容配置」的说法。
- U6-20：`adding-hero-attribute.md` 的「旧存档迁移」改为推荐 `ISaveableExecutor`：新增示例类 `HeroAttributeSaveExecutor`（`afterLoad` 用 `Object.hasOwn` 判断缺键后 `set`，并说明 `set` 会重算最终值），并给出 `bindSaveableExecuter('@system/hero', ...)` 的绑定位置；删去原先「直接改存档映射更干净」的相反建议。
- U6-21：`adding-hero-attribute.md` 删除 TS `Record<SelectKey<IHeroAttr, number>, number>` 的类型检查细节，只保留「内容层是 JSONC，直接写在 `item.jsonc`」与「新属性不需要额外注册」。
- U6-22：`enemy-context-and-combat.md` 删去 `setFloor` / `resize` / `bindHero` 的手动置脏操作说明，改为「正常换图流程已处理好」；`getComputedEnemy()` 改为「读取时按需刷新」的说法；「局部刷新与全量重建」由 41 行压到 7 行（约 1/6），只保留「日常自动刷新、少数直接改模板才 `markDirty`、新光环需全量重建、`query()` 登记依赖」四点；收束示例与验证示例删去 `requestRefresh`，边界条目同步。

**验证：** `node node_modules/prettier/bin/prettier.cjs --write` 三篇文档 → CRLF、单 H1；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 退出 0、`build complete in 18.09s`、无 dead link。

---

## 第 2 轮（2026-10-22，待执行）

| # | 用户意见 | 落点 |
|---|----------|------|
| U7-01 | 事件视图说法有误：`eventView.set(num)` 不会重置为默认事件，它要求第二个 `event` 参数必填；该注释来源不明，需修正 | `point-and-tile-events.md`（及事件相关） |
| U7-02 | 不要在文档里写「模块级复用 / 不要在调用处内联 new」这类说明；用户只是要求改写法，读者不需要知道这些细节 | `custom-range.md` |
| U7-03 | `transferToDynamic` 的 `keepEvent` 说明有误：**以引擎方法注释为准**——「不论是否 keepEvent，源图块的图块事件都会被清空」。若注释与实现不一致，按注释写，并**向用户报告**（长期规范 D-72） | `static-vs-dynamic-tiles.md` |
| U7-04 | 动态图块的 `mover` 未讲却讲了 `moveBlock`。应先用**引用**指向高级 I 的 mover 文档（不重复讲概念/接口），再讲 `moveBlock`；顺序必须 mover 在前、moveBlock 在后 | `static-vs-dynamic-tiles.md` |
| U7-05 | 指令码位宽在高级 II 不需要讲，只提一嘴：99.9% 情况用不完 255 个指令码；如有极小概率超过，参考高级 III 指定文档。细节放高级 III | `custom-replay-command.md` |
| U7-06 | 录像的典型例子「选择框」不是让你改成代码示例；原来的代码示例很好，改回去。选择框一般内置 | `custom-replay-command.md` |
| U7-07 | `NoPath` 是正常输出，不是错误；被怪物挡着去不了很正常。当前「NoPath 处理建议」不对，只需说明「找不到可行路径」，无需处理 | `pathfinding.md` |
| U7-08 | 假定编辑器已完成：不要写「编辑器就位前改文件、就位后用编辑器」。需要编辑器的地方只写「需要编辑器」标识，不讲没有编辑器时怎么做。所有 `.jsonc` 都由编辑器负责，涉及部分先写占位（长期规范 D-73） | 全部 |

**状态：执行中**（批次 D 已完成 U7-01、U7-03、U7-04；其余待执行）

### 批次 D（U7-01、U7-03、U7-04）执行记录（2026-10-22）

- U7-01：`point-and-tile-events.md` 删去「`set(num)` 会重置为默认事件」的错误注释，改为「同一优先级已有事件时覆盖并告警」；正文明确 `ILayerEventView.set(priority, event)` 两个参数都必填、不会顺带恢复默认事件，并说明恢复默认事件应使用 `tile.set(num)` / `tile.restoreDefaultEvents()`。表内与边界条目中的 `set(num)` 统一写作 `tile.set(num)`，避免与事件视图的 `set` 混淆。
- U7-03：`static-vs-dynamic-tiles.md` 按 `IMapLayer.transferToDynamic` 的方法注释改写（D-72）：`keepEvent` 只决定是否把源静态图块的图块事件复制到动态实例，**不论取值如何，源静态图块的图块事件都会被清空**；删去原「`false` 时源实例完全不被触碰、旧事件仍保留」的不对称说法。`point-and-tile-events.md` 中同一处描述与交叉引用同步修正，避免两篇互相矛盾。
- U7-04：`static-vs-dynamic-tiles.md` 在 `moveBlock` 之前新增「移动器 mover」小节，用 D-47 非断链占位 `高级 I · 移动 Mover` 指向待补的高级 I 文档，不重复 mover 的概念与接口；随后才讲 `moveBlock`，并补上 `mover.start()` / `onEnd` 的实际调用顺序。

**待报告（D-72）：** `mapLayer.transferToDynamic` 的方法注释称「不论是否保留，此格的静态图块事件都会被清空」，但当前实现仅在 `keepEvent` 为 `true` 的分支内调用 `staticTile.tileEvent().clear()`；`keepEvent` 为 `false` 时，若该坐标的静态图块实例已存在，其事件不会被清空。现有单测未覆盖「先 `getTile` 再以 `false` 转换」的情形，因此未暴露。文档按注释书写。

**验证：** `node node_modules/prettier/bin/prettier.cjs --write` 两篇文档 → CRLF、单 H1；`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` 退出 0、`build complete in 19.04s`、无 dead link。

