# 高级 I 读者审阅

## D-58 修订记录

**时间：** 2026-10-20
**依据：** D-58——「改内置还是自己新增」的取舍与「必须提供通用模板章节」只适用于中级教程；高级 I 不强制模板章节，是否提供视内容而定，取舍原则仍是 D-55（新增系统优先用插件，必要时才改内置）。
**范围：** `docs/advanced/` 七篇；只改文档，不改 `config.ts` 与生产代码；未改渲染端内容。

### 模板章节取舍

| 篇目                          | 决定         | 说明                                                                                                                                      |
| ----------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `index.md`                    | 不设模板     | 导览页只给分层、阅读路径与取舍原则，没有需要读者照抄的机制                                                                                |
| `declarative-vs-imperative.md` | 移除通用骨架 | 原骨架用 `XxxHandler` / `IXxxHandler` 泛化占位，不对应任何真实接口，照抄也无法落地；保留其中的「扩展点一览」表与 `#region`、类示例约定     |
| `plugin-system.md`            | 保留         | 插件是高级 I 的核心机制，读者必须自己实现 `IDataPluginDefine`；骨架含五个成员、注册位置与存档 id 的易错点                                 |
| `saveable-content.md`         | 保留         | `ISaveableContent` 是必须实现的接口；骨架覆盖 `saveState` 深拷贝与 `loadState` 先清空再重建两个易错点；示例精简为「接到插件里」，不再重复整类 |
| `replay-consistency.md`       | 移除         | 骨架只是「一个方法 + 一个装饰器」，与后续「给内置方法补录像标记」六步重复；「一个方法只写一个标记」并入常见错误                            |
| `data-stores.md`              | 保留（精简） | Store 没有逐对象模板；去掉外层 `MyContent` 包装类，只保留「一条原始定义长什么样」的 `addTile` 载荷                                        |
| `hooks-in-depth.md`           | 移除         | 骨架与「做法 A：每个对象一个钩子实例」的代码完全相同；保留做法 A 与两个六步示例                                                          |

### 移除的中级定位

| 篇目                          | 移除内容                                                                                             | 替代                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `index.md`                    | 「如果你不怎么懂代码，优先改内置已有实现，而不是自己造一套。」                                       | 判断标准改为改动落在谁的代码里：能由插件或内容定义完成的留在 `src`；必须动内置包时收敛差异         |
| `declarative-vs-imperative.md` | 同句；「日常需求优先改内置」与「能改内置解决的问题，不值得再包一层」                                 | 小节改为「改内置还是写成插件」，按 D-55：新增系统优先插件，只有必要时才改内置包                    |
| `plugin-system.md`            | 「如果你不怎么懂代码，建议直接改内置，而不是自己写新的插件」与「新建插件比改内置多出不少工作」       | 小节改为「改现有插件还是新建插件」；「改内置」明确限定为改 `packages` / `packages-user`            |
| `saveable-content.md`         | 同句；「能改内置解决的问题，不值得再新建一个可存档对象」                                             | 新增系统优先由插件承载可存档对象；必要时才改内置存档实现                                          |
| `replay-consistency.md`       | 同句                                                                                                 | 保留「绝大多数情况不需要新写类」；整套新系统优先用插件组织                                         |
| `data-stores.md`              | 同句                                                                                                 | 保留「补条目优先、不要扩展 `IDataCommon`」；新的原始数据表先按插件组织                             |
| `hooks-in-depth.md`           | 同句                                                                                                 | 保留「先改 `src/data/hook/*` 已有类」与「整套新系统优先用插件」                                    |

### 保留项

- **D-48 六步：** `plugin-system`、`saveable-content`、`data-stores`、`replay-consistency`、`hooks-in-depth` 的实操段落保持「目标 / 改哪里 / 复制什么 / 改什么 / 怎么验证 / 注意」结构。
- **D-47 占位：** `高级 II · …`、`高级 III · …` 的代码 span 与 `<!-- TODO(advanced-*) -->` 注释保留；`replay-consistency` 移除模板后，两处指向移入「改内置还是自己写」。
- **D-51 / D-52 / D-55：** `#region` 约定、加粗边界、优先插件原则保留。

### 构建

- `cmd /c "pnpm exec prettier --write docs/advanced/*.md"`：七篇全部 unchanged，已符合格式。
- `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`：`build complete`，无 dead link。

---

## 读者审阅 · 第 1 轮（Advanced I persona）

**人格提示词（逐字）：**
> 假设你是一位对代码有一定了解、了解基本语法（变量、函数、类、import 等），但代码能力一般、不熟悉引擎内部架构的游戏作者。你已经读完中级教程，正在阅读高级教程 I，想判断自己能不能照着文档完成插件等扩展。

**明确「未复用中级人格」**：本次不使用中级教程的「不懂代码的游戏作者」人格。

### 阻断性（5）

| # | 问题 | 定位 |
|---|------|------|
| B-01 | 插件注册示例写成 `[new MyPlugin()]`，照抄会覆盖原有 `DataShopPlugin`；且新建插件时 `list.ts` 顶部并没有该插件的 import | `plugin-system.md`「注册到 dataPlugins」 |
| B-02 | `ShopManager.loadState(state: IShopManagerSave): void` 方法体用了 `compression`，照抄会报「未定义」，示例本身不能编译 | `saveable-content.md`「ISaveableContent：对象与存档形状」 |
| B-03 | 示例注册 `@plugin/my-store`，验证却查 `@plugin/example-counter`；照做会拿到 `null`，误以为注册失败 | `saveable-content.md`「示例：把可存档对象接到插件里」「怎么验证」第三项 |
| B-04 | 反复要求「存档/读档」「三档压缩各跑一次」「删掉存档里的一个键」，但没给最外层触发存档/读档的入口，也没说怎样取得并修改存档 `Map`，无法按文档完成验证 | `saveable-content.md`「怎么验证」；`plugin-system.md`、`declarative-vs-imperative.md` 对应验证段 |
| B-05 | 指定改 `FlagSystem.setField`，但同段又说该文件的 `setField` / `deleteField` 都已有标记；照「复制装饰器一行」会变成两个标记，注释掉后仍剩一个，告警不会按文档消失 | `replay-consistency.md`「给一个内置方法补录像标记」 |

### 非阻断（摘要）

- 插件模板里 `mySystem!: MySystem` / `new MySystem(state)` 未给定义；`[需改]` 可补救。
- 注册位置表述不一致（「更晚阶段也可以」vs「必须在 awake」）。
- 模板里的 `saveState` / `loadState` 省略了 `compression`，未说明是否合法。
- 跨对象引用示例只给了 `@plugin/example-quest`，没有对应注册与类定义。
- 装饰器表格写成 `@shouldReplay()` / `@ignoreReplay()`，实际需要 message/reason。
- 任务叫「加录像标记」，但装饰器不写录像，读者易误解。
- 收集区间目前只有测试调用；正文未说明生产环境如何使用该检查。
- 钩子示例默认 `afterLoad` 时 `state.maps.getMap('floor-1')` 已存在，可能静默跳过。
- 「图层移除会卸载内部转发器」表述不准确：自己 `addHook` 的实例仍需手动 `unload()`。
- `declarative-vs-imperative.md` 的 `IDamageCalculator` 未提 `getCriticalLimit`；验证里 `view` 未定义。
- `data-stores.md`：`tileStore.num(...)` 可能返回 `undefined` 未判空；`afterLoad` 登记后未说明何时 `fromRaw` / `addLayer`；`IItemRawData` 的 `effect`/`equip` 并非二选一；`EnemyStore` 缺可操作入口。
- 多处模板/示例省略 import，对「新建文件」的读者不能直接运行。

---

## 第 1 轮修复记录（2026-10-20）

**范围：** 仅 `docs/advanced/` 六篇；未改 `config.ts`、生产代码与渲染端内容。

### 阻断性问题

| #     | 修复                                                                                                                                  | 落点                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| B-01  | 注册示例改为保留 `DataShopPlugin` 并追加 `new MyPlugin()`；明确新建插件文件必须补 `import`，只有改已有插件才复用原有 import             | `plugin-system.md`「注册到 dataPlugins」                            |
| B-02  | `ShopManager.loadState` 补上 `compression: SaveCompression`，与 `ISaveableContent` 及源码一致                                          | `saveable-content.md`「ISaveableContent：对象与存档形状」           |
| B-03  | 示例注册、验证统一使用 `@plugin/my-store`；模板补 `getValue` 供验证                                                                    | `saveable-content.md` 注册 / 示例 / 怎么验证                        |
| B-04  | 三个验证段补上 `state.saveState` / `state.loadState` 最外层入口；给出存档 → 改 → 读档、三档压缩、删除映射键的可复制写法               | `saveable-content.md`、`plugin-system.md`、`declarative-vs-imperative.md` |
| B-05  | 练习对象从已有标记的 `setField` 改为未标记的 `getOrInsert`；验证改为调用 `getOrInsert`，去掉标记后告警确实消失                          | `replay-consistency.md` 六步实操                                    |

### 高价值非阻断

- `plugin-system.md`：说明 `MySystem` 需自行定义或连同字段一起删除；模板标注为新建文件并保留 `import`；验证段给出可取回插件对象的完整写法。
- `saveable-content.md`：统一 `awake` / `afterLoad` 注册口径；说明省略 `compression` 的 TypeScript 兼容性；跨对象引用补 `QuestSaveable` 类、`@plugin/shop` 注册位置与执行器断言写法。
- `replay-consistency.md`：装饰器表改为 `@shouldReplay(message)` / `@ignoreReplay(reason)`；补生产环境无自动收集开关的说明；再次强调标记不产生录像步。
- `declarative-vs-imperative.md`：补 `getCriticalLimit`；验证片段改用 `getEnemyByLoc` 取得 `view` 并说明坐标；补存档 / 读档入口。
- `data-stores.md`：`tileStore.num` 验证补 `undefined` 判断；明确 `effect` / `equip` 均为必填；补 `afterLoad` 登记后 `fromRaw` / `addLayer` 的时机；把 `EnemyStore` 改为可操作的自建注册表建议。
- `hooks-in-depth.md`：说明 `afterLoad` 时 `getMap('floor-1')` 可能为 `null`，不可静默跳过；修正「图层移除」只卸载内部转发器、不清理自挂钩子的表述；补新文件 `import` 说明。

### 构建

- `cmd /c "pnpm exec prettier --write docs/advanced/*.md"`：通过。
- `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`：`build complete`，无 dead link。

---

## 读者审阅 · 第 2 轮（复审）

**结论：阻断性问题 = 0，审阅通过。**

5 项旧阻断问题均判「已消除」：
- B-01：插件注册示例改为追加 + 新文件 import 说明；
- B-02：`compression` 形参补齐；
- B-03：注册/验证 id 统一为 `@plugin/my-store`；
- B-04：补 `state.saveState` / `state.loadState` 可执行入口；
- B-05：练习目标改为未标记的 `getOrInsert`。

### 残留（非阻断，供用户与后续处理）

1. **录像标记练习对普通作者的可验证性偏弱**：收集区间目前只在测试中调用，正文已说明，但读者仍缺乏生产环境下的可观察入口。
2. **目标楼层/图层的注册时机**：文档提示 `afterLoad` 时可能 `getMap` 为 `null`，但没有给出「楼层创建」的可订阅事件/时机。
3. **命名一致性**：`setField` vs `setFieldValue`、`@plugin/my-plugin` vs `@plugin/my-store` 跨篇不一致；`bindSaveableExecuter` 与 `ISaveableExecutor` 拼写差异易被误认为笔误；`revert()` 名称易误解。
4. **`Mota.require(...)`** 在验证示例中出现但未解释。
5. **`data-stores.md`** 只有图块定义骨架，道具/地图/事件的原始数据形状缺示例。
6. **钩子示例** 地图级 `addHook` 的控制器未保存，后续 `unload` 无句柄。

以上均为「能写、但验证/细节仍有落差」的项，不影响读者照文档写出可注册代码；留待用户修订循环（10-20）决定是否处理。



