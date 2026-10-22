# 高级 II 用户修订记录

## 第 1 轮（2026-10-20，待执行）

**状态：** 已记录，明日继续执行。修改方式将按 GSD 流程派发子代理（只改 `docs/advanced/ii/*.md`，必要时含 `docs/advanced/*.md`）。

| # | 用户意见 | 落点 |
|---|----------|------|
| U6-01 | `const hits = state.enemyContext.scanRange(new RingRange() ...)`：把 `new RingRange()` 提出来作为常量；引擎代码风格不建议在此内联 `new` | `custom-range.md` |
| U6-02 | 范围要专门讲 `estimatePointCount`：只要求尽量快地估算大致数量，不要为数量准确牺牲性能（否则自动判断可能因估算太慢而变慢） | `custom-range.md` |
| U6-03 | 有些代码未包裹完整类上下文导致高亮错误，重点关注**类的方法**；适用于后续所有文档（D-70） | 全部 |
| U6-04 | 点事件与图块事件较复杂，**单独开一篇文档**讲；重点：二者区别、跟随移动的区别、二者都可以自己设置且跟随存档 | 新增文档（II） |
| U6-05 | 「事件基准」简单提一句即可：`markPure` 与 `ref` 是样板内部优化接口，一般不要调用，除非清楚自己在做什么 | `static-vs-dynamic-tiles.md` |
| U6-06 | 装备 `getModifier` 的实现细节不用讲，只说它用于获取装备修饰器 | `equipment-system.md` |
| U6-07 | 若 `slots` 定义为字符串，也可以传索引；索引最精确、字符串是粗略描述（同名时无法指定具体槽）。文档写成「不能混用」应改 | `equipment-system.md` |
| U6-08 | 「修饰器与存档的关键约定」讲的是内部实现：章节开头写「此章节讲解一下 XXX 的内部实现」；这类纯内部实现章节应放在文档靠后，前面主要讲使用（D-69） | `equipment-system.md` 及后续 |
| U6-09 | `loadEvent` / `unloadEvent` 尚未实现，文档要说明「还未实现」，待后续实现再改 | `equipment-system.md` |
| U6-10 | 内置录像行为还没做完，不要用内置作为示例；直接用注释写一行省略已有录像码枚举 | `custom-replay-command.md` |
| U6-11 | 被动录像的典型案例：弹出一个选择框，玩家选择内容；录像无法提前知道弹出什么选择框，只能等选择框出现后由选择框系统自己读录像选择——用这个案例讲被动录像 | `custom-replay-command.md` |
| U6-12 | 主动/被动录像的推进部分太复杂，不要讲太细：被动步用完后要调用 `next`，否则再次调用还是这个被动步（可能确实需要在多处调用，但务必 next）；主动步实现 `execute` 即可 | `custom-replay-command.md` |
| U6-13 | 讲明「被动步为什么必须跟在主动步之后、且在主动步完成前全部被使用」：若主动步执行完才轮到被动步，被动步未被调用会永远卡住；主动步需要被动步时会报错。实际中被动步一定源于某个主动操作 | `custom-replay-command.md` |
| U6-14 | 录像注册建议写到插件里：安装别人的插件时无需自己再注册录像，只需新增录像码；这是样板推荐写法 | `custom-replay-command.md` |
| U6-15 | 记录处：`apply` 才是应写 `@shouldReplay` 的地方（它才可能修改状态），`use` 只是调用 `apply`，可以不写；且 `use` 里有 `if` 判断，不能用时会直接告警 | `custom-replay-command.md` |
| U6-16 | 沙盒播放不用讲（且原文讲错了）：沙盒播放必须启用录像，否则播放结束没有记录任何录像，不能重播也不能验证；样板会内置沙盒播放，作者几乎不需要自己写 | `custom-replay-command.md` |
| U6-17 | 被动步忘记 `next` 不是不推进，只是不读下一个录像；若此时主动录像播完，会继续播放后面的录像 | `custom-replay-command.md` |
| U6-18 | 自动寻路中不要用 `Infinity` 把一个点设为不可达；不可达应由谓词控制，用 `Infinity` 不标准 | `pathfinding.md` |
| U6-19 | 样板所有 `.jsonc` 只允许开头那条带系统前缀注释的注释，后面不允许注释；勇士属性处不要说 `.jsonc` 允许注释。且 `.jsonc` 由编辑器修改，留占位 | `adding-hero-attribute.md`（及 `.jsonc` 相关内容） |
| U6-20 | 新增勇士属性若需存档迁移，建议用 Executor 实现——Executor 本就是为了这个目标而存在 | `adding-hero-attribute.md` |
| U6-21 | 内容层是 JSONC，不经过 TypeScript 的 `Record` 检查；TS 手写 `IItemEquipData<IHeroAttr>` 的 `Record` 细节作者不需要知道，这段不用专门说 | `adding-hero-attribute.md` |
| U6-22 | 怪物上下文不要讲手动更新（样板已基本做好，少数情况才需 `markDirty`）；细节过多、难懂，要降低理解难度。刷新只说：若怪物申请了上下文查询，周围怪物更新时它也要更新——这正是必须用 `query()` 而非 `handler.context` 的原因。局部刷新与全量重建章节缩减到现在的一半 | `enemy-context-and-combat.md` |

## 高级 I 待补内容（用户 2026-10-20 提出，待后续补写）

| # | 主题 | 说明 |
|---|------|------|
| AI-GAP-01 | 移动 Mover | 高级 I 未讲，需补写 |
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
