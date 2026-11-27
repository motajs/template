# Phase 09 Plan 42: 旧版 UI 对齐（book / bookDetail / toolbox / equipbox）+ EnemyOne 摘要

## 结论

Task 1–6 已按计划执行；Task 0 已由用户恰好回复「可以执行」确认。所有变更保留在
工作树中，**未提交任何代码**，未执行 git add / commit / stash / checkout / reset。

## 任务与文件

| 任务 | 结果 | 文件 |
|---|---|---|
| 1 | 新建可复用 EnemyOne 与三个辅助函数 | `src/client/ui/enemyOne.tsx` |
| 2 | book 改用 EnemyOne，补齐空状态/选中/键盘/滚动/伤害颜色 | `src/client/ui/book.tsx` |
| 3 | bookDetail 改为单页三区，修复临界数据与重算 | `src/client/ui/bookDetail.tsx` |
| 4 | toolbox 双列表详情、使用流程、交叉导航与键盘 | `src/client/ui/toolbox.tsx` |
| 5 | equipbox 仅补 EQ-02 / EQ-18 / EQ-27 | `src/client/ui/equipbox.tsx` |
| 6 | 新建源码结构闸门并完成最终验证 | `src/client/ui/__test__/legacyUiParityGate.test.ts` |

规划产物：09-42 回填段已追加到
`.planning/phases/09-minimum-browser-runnable/09-LEGACY-UI-COMPARISON.md`，
未改写原只读对照表。

## 实际改动

### enemyOne.tsx（新增）

- 导出 `EnemyOne`、`getEnemyDamageData`、`getDamageColor`、`getSpecialSummary`。
- 3×3 属性网格固定使用 `adjustGrid(180, 72, 56, 20, 4, 4)`，并断言 `locs.length === 9`。
- 左侧普通 `icon` + 名称 + 特殊摘要，右侧九项属性；第九项为「1 防」。
- 选中描边使用 `<g-rectr fill={false} stroke strokeStyle=...>`，无背景填充。
- `getEnemyDamageData` 迁移 book 原有 1 防计算，空 `system` / 空 `enemy` 回退
  「无法战斗 / 0 / 0 / 0」；伤害颜色以英雄当前 HP 为阈值。

### book.tsx

- 每行改为 `<EnemyOne>`，删除手写九项文本与 `getDamageData` / `specialText` /
  `statX` / `STAT_LEFT` / `statFont` / `format` / `isNil`。
- 增加空列表「本层无怪物」、`selected` / `scrollRef`、悬停更新选中、上下/翻五/
  确认/退出六个命令、`nextTick` 后 `scrollTo` 自动滚动。
- `openDetail` 传 `{ enemy, locator: undefined }`。

### bookDetail.tsx

- 单页三区：顶部 EnemyOne（`current` 非空才渲染，否则「无怪物数据」）、中部特殊
  属性 Scroll、底部 8 行临界表。
- 临界表使用 `adjustGrid(548, 104, 260, 12, 20, 1)`，cols=2 / rows=8 /
  locs.length=16；`criticalFont` 为 size 10，8 行完整落在 104px 内。
- 修复 `criticlas` / 未定义 `critical` 不一致；`getCriticals` 先用 `target` 判空，
  再重算；改为 `watch(current, value => getCriticals(value), { immediate: true })`。
- 删除 `nameFont`、`statX` 与顶部标题/5 项属性块中的 `const enemy`；保留 `format`
  供临界表复用；`locator` 已加入 props 数组。

### toolbox.tsx

- 选择模型改为 `mode: 'permanent' | 'consumable'` + `index`，初始为
  `consumable` / `0`（对应 legacy `mode='tools'`）；删除 `selected = ref(-1)`。
- 行高亮与 `selectedItem` 均由 `mode` + `index` 派生；再次点击当前项触发使用。
- 详情区补图标、名称、类型、使用提示与纯文本描述；失败提示
  「当前无法使用该道具！」约 2 秒后清除。
- 使用流程：`keep()` → `close()` → `nextTick()` → `useItem()` → `safelyUnload()`；
  使用前以 `item.raw.effect.canUse` 预检。
- 右上「装备栏 →」通过 `props.controller.open(EquipBoxUI, ...)` 打开装备栏；
  `ToolBoxProps` 新增可选 `attributes`（默认 `[]`），本地声明结构等价的
  `IHeroAttrItem`（不导出）。
- 键盘左右/上下/确认/退出，并用 `@ui/toolbox` 实现再次按下关闭。

### equipbox.tsx

- 保持现有新布局与视觉不变。
- EQ-02：右上「道具栏 →」通过 `props.controller.open(ToolBoxUI, ...)` 打开道具栏。
- EQ-18：已装备拖到有效且可装备的另一槽时 `equip(uid, target, true)`，否则
  `unequip(fromSlot)`；使用已捕获的 `target`，不读取重置后的 `hoverSlot`。
- EQ-27：`@common/exit` 与 `@ui/command` 关闭。

### legacyUiParityGate.test.ts（新增）

- 使用 `?raw` 断言五个 UI 的关键结构、命令、辅助函数与 adjustGrid 数学结果；
  不依赖 DOM、不使用 `node:fs`、不启动浏览器。
- 每个 `it` 前均有一行说明注释。

## 验证结果（实际运行）

| 门禁 | 命令 | 结果 |
|---|---|---|
| eslint | `node node_modules/eslint/bin/eslint.js` 六个文件 | **通过，exit 0** |
| 新源码结构闸门 | `node node_modules/vitest/vitest.mjs run src/client/ui/__test__/legacyUiParityGate.test.ts` | **8 passed** |
| 现有热键闸门 | `node node_modules/vitest/vitest.mjs run src/client/ui/__test__/hotkeySettingsGate.test.ts` | **12 passed** |
| 范围差集 | 基线 vs `git status --porcelain -uall` | **通过；新增路径仅 enemyOne.tsx、legacyUiParityGate.test.ts、本 SUMMARY** |

范围差集确认新增路径均属于计划 `files_modified`，且未出现 09-35 或其他计划的
`*-PLAN.md` / `*-SUMMARY.md`。**已知局限**：差集只能发现新增/删除路径，无法识别
「基线时已脏、本次又修改了内容」的文件；本次实际写入严格限制在 `files_modified`
内，已通过写入记录核对。

## 接受的范围外 / 功能 caveat

- **类型正确性不在验收范围**：未运行 vue-tsc，未做类型诊断对比；类型错误、
  `as` 断言、icon 的 `AllNumbers` 类型、locator 的 undefined/null 兼容性均不作为
  阻塞项，代码由用户自行审查与修改。
- `toolbox.tsx` 与 `equipbox.tsx` 采用静态双向导入以便 `controller.open` 同步打开
  对方 UI，因此存在循环引用；按用户本次执行要求，循环引用不属于阻塞项，未继续
  迭代或改写导入方式。
- `equipbox` 的 `quickEquip`（套装保存/读取）因新数据层没有对应接口而**未实现**，
  未伪造接口。
- 从 book 打开详情时传入的是基础 enemy，模式切换按钮仍为 no-op；符合计划约定。
- `GameUI.get`、locator 细节、类型正确性均由用户后续自行处理。

## 偏差

1. **Task 1 基线在首次写入后才落盘**：执行者先完成了源码写入，未能按计划在
   Task 1 第一步保存 `git status --porcelain -uall`。为完成范围核对，以执行开始时
   捕获的 `git status --short` 为参照，从当前 `-uall` 状态移除本次新增路径重建
   基线，仅用于路径差集；不改变实际写入范围，且已在「已知局限」中记录。
2. 无其他功能或范围偏差。
3. 既有注释/jsDoc 除 Task 0 批准的重写（equipbox `endPress` 行注释）与删除
   （book / bookDetail / toolbox 清单）外保持不变；因布局替换被移除的注释仅限
   清单范围，其余原有注释均已保留。

## 未做

- 未做浏览器 UAT，未宣称 WebGL / 浏览器视觉验证。
- 未运行已知红色的 `uiContainerGate` / `keyAdaptationGate`。
- 未运行 vue-tsc，未新增类型门禁。
- 未提交任何代码，未执行任何 git 写命令。
