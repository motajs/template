---
phase: 09-minimum-browser-runnable
plan: 32
subsystem: ui
tags:
    [vue, jsx, listpage, element-locator, handler-extraction, source-gate, no-uat]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-29..09-31 的平铺 Scroll、内联 .map()、0 值回退、cumsum 行位置、37 个 key 全删"
provides:
  - "hotkey 的分组列表改由既有 ListPage 承载（分母 basis + 内置选中态 + 内置「关闭」）"
  - "5 个列表型 UI 的 14 处多行内联 loc 全部提为 ElementLocator 常量"
  - "5 个列表型 UI 的 13 处内联箭头事件处理器全部提为具名函数 / 工厂"
  - "18 组源码形状闸门（原 16 组，hotkey 组改写，新增 2 组）"

# 未校准估算：09-29..09-31 的改动在执行开始时仍未提交，工作树自带它们的 diff，
# 无法把本计划自身的改动从工作树里分离，故 tokens 记 null，不虚报。
actuals:
  tokens: null
  tasks: 3
  commits: 0
  note: "工作树自带 09-29..09-31 的未提交改动，无法分离本计划自身 diff，tokens 记 null；tasks 只计 Task 1-3（Task 0 是汇报关卡，不计入）；commits 为 0，执行器未做任何代码提交。"

estimate:
  tokens: 70000
  raw_tokens: 35000
  tasks: 3
  confidence: low

tech-stack:
  added: []
  patterns:
    - "分组列表 + 选中态 + 关闭按钮一律交给 ListPage；调用方只提供 list / selected / basis / closeLoc / onUpdate / onClose"
    - "ListPage 内容区原点为 width * basis，内容区内的 loc 必须减去该原点才能保持绝对位置"
    - "事件处理器一律写成 setup 里的具名函数或具名工厂，JSX 只保留 onXxx={fn} / onXxx={factory(arg)}"
    - "凡会被 Prettier 折行的 loc 数组一律提为 const xxxLoc: ElementLocator"

key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-32-BASELINE.json
    - .planning/phases/09-minimum-browser-runnable/09-32-SUMMARY.md
  modified:
    - src/client/ui/hotkey.tsx
    - src/client/ui/book.tsx
    - src/client/ui/bookDetail.tsx
    - src/client/ui/equipbox.tsx
    - src/client/ui/toolbox.tsx
    - src/client/ui/__test__/uiContainerGate.test.ts
    - src/client/ui/__test__/hotkeySettingsGate.test.ts

key-decisions:
  - "hotkey 根元素改为 <ListPage loc={FULL_LOC} basis={GROUP_BASIS} list={groupItems} selected={selectedGroup.value} lineHeight={GROUP_ROW_HEIGHT} font={CONTENT_FONT} close closeLoc={CLOSE_LOC} onUpdate={selectGroup} onClose={close} nocache>，default 插槽只返回一条 <Scroll loc={COMMAND_SCROLL_LOC}>"
  - "GROUP_BASIS = GROUP_WIDTH / MAIN_WIDTH、CONTENT_WIDTH = MAIN_WIDTH * (1 - GROUP_BASIS)、COMMAND_WIDTH = CONTENT_WIDTH - LEFT_PAD * 3、COMMAND_SCROLL_LOC = [LEFT_PAD * 2, LIST_TOP, COMMAND_WIDTH, LIST_HEIGHT]；实测取值为 32 / 48 / 368 / 320，内容区原点 180，180 + 32 = 212 与改造前 RIGHT_LEFT 完全一致"
  - "BOX_LEFT 改由 COMMAND_WIDTH 定义，实测仍等于 172（368 - 180 - 16）"
  - "分组选中态交由 ListPage 内部的 Selection 表示，hotkey 源码不再出现 Selection，也不再自建分组行"
  - "关闭入口改用 ListPage 内置「关闭」文本，close 复用原 close（先 cancelCapture 再 controller.close）"
  - "hotkeySettingsGate.test.ts 按用户决定改写关闭用例（断言 ListPage / 布尔 close / closeLoc / onClose / @common/exit + list.tsx 的 text=\"关闭\"），删除过时的「返回」要求，因此它退出受保护哈希集合（受保护文件 8 个）"
  - "五个 UI 文件的所有局部 loc 常量在 map 回调内每次求值新建，不做共享可变数组"

patterns-established:
  - "ListPage 接入：left 列表宽度由 basis 反推（GROUP_WIDTH / MAIN_WIDTH），右栏定位相对内容区原点"
  - "行数据工厂：getEnemyClick(view) / getItemClick(item) / getKeyClick(command, index) / getSlotEnter(slot) / getSlotLeave(slot) / getSlotDown(equip, slot) / getOwnedDown(uid) / getUpdateHeight(code)"
  - "渲染宽度约束：当内联 JSX 嵌套导致具名调用被 Prettier 折行、进而打断源码闸门的连续字面量断言时，把该段 JSX 提为 setup 级渲染函数以降低缩进（renderCommands / getSpecialItems）"

requirements-completed: []

duration: "未精确计时（约 50 分钟，含两次整仓 vue-tsc）"
completed: 2026-10-28
status: complete
---

# Phase 09 Plan 32: `hotkey` 改用 `ListPage` + 5 个 UI 文件提取 14 处内联 loc 与 13 处内联 handler Summary

**用项目既有 `ListPage` 重写热键设置界面的分组列表（内置选中态与「关闭」文本），并把 `book` / `bookDetail` / `equipbox` / `toolbox` / `hotkey` 里 14 处多行内联 loc 与 13 处内联箭头事件处理器全部提成 `ElementLocator` 常量与具名函数 / 工厂；行为零变化、不新增入口、不做浏览器 UAT、执行器 0 次代码提交**

## 执行概览

| 任务 | 结果 | 关键产物 |
|------|------|----------|
| Task 1 | 完成（基线先写、代码后改） | `09-32-BASELINE.json`、`hotkey.tsx` 的 `ListPage` 重构 |
| Task 2 | 完成 | `book` / `bookDetail` / `equipbox` / `toolbox` 的 handler 与 loc 提取 |
| Task 3 | 完成（先跑门禁 → 再写本文件 → 再跑摘要闸门） | `uiContainerGate.test.ts` 18 组、`hotkeySettingsGate.test.ts` 12 组 |

Task 0 是 `blocking-human` 汇报关卡，用户已回复「可以执行」；本计划在执行前未写任何文件，`09-32-BASELINE.json` 是 Task 1 的第一步、且只写一次。

## `ListPage` 接入方式

```tsx
<ListPage
    loc={FULL_LOC}
    basis={GROUP_BASIS}
    list={groupItems}
    selected={selectedGroup.value}
    lineHeight={GROUP_ROW_HEIGHT}
    font={CONTENT_FONT}
    close
    closeLoc={CLOSE_LOC}
    onUpdate={selectGroup}
    onClose={close}
    nocache
>
    {{ default: () => renderCommands() }}
</ListPage>
```

- `close` 是布尔简写（`react/jsx-boolean-value: never` 要求不写 `close={true}`）。
- `onUpdate={selectGroup}` 是分组切换的唯一入口，`selectGroup` 仍是 `cancelCapture()` + `selectedGroup.value = id` + `refreshCombinations()` 三步，签名未变。
- `onClose` 复用同一个 `close`：`cancelCapture()` + `props.controller.close(props.instance)`。
- `default` 插槽只返回一条 `<Scroll loc={COMMAND_SCROLL_LOC}>`（源码内 `<ListPage` 1 个、`<Scroll` 1 个、`<container` 0 个）。
- `@common/exit` 仍走 `useKey(props.state.hotkey.system)!`，且 `if (selectedCommand.value) return;` 逐字保留，捕获中不关闭。

### 几何换算（右栏绝对位置不变）

| 常量 | 定义 | 实测值 |
|------|------|--------|
| `GROUP_BASIS` | `GROUP_WIDTH / MAIN_WIDTH` | `180 / 596 ≈ 0.302013422818792` |
| `CONTENT_WIDTH` | `MAIN_WIDTH * (1 - GROUP_BASIS)` | `416` |
| `COMMAND_WIDTH` | `CONTENT_WIDTH - LEFT_PAD * 3` | `368` |
| `COMMAND_SCROLL_LOC` | `[LEFT_PAD * 2, LIST_TOP, COMMAND_WIDTH, LIST_HEIGHT]` | `[32, 48, 368, 320]` |
| `CLOSE_LOC` | `[LEFT_PAD, MAIN_HEIGHT - LEFT_PAD, void 0, void 0, 0, 1]` | `[16, 400, …]` 左下角 |
| `BOX_LEFT` | `COMMAND_WIDTH - KEY_BOX_WIDTH - LEFT_PAD` | `172`（与改造前逐字相同） |

`ListPage` 把内容区放在 `[width * basis, 0, width * (1 - basis), height]`，内容区原点为 `596 * 180/596 = 180`；因此右栏 Scroll 的 x 取 `LEFT_PAD * 2 = 32`，绝对位置 `180 + 32 = 212`，与改造前的 `RIGHT_LEFT = 212` 完全一致，宽 368、高 320 也逐字相同。`COMMAND_TEXT_LEFT` / `COMMAND_TEXT_TOP` / `KEY_BOX_HEIGHT` / `COMMAND_GAP` / `BOX_FILL_HEIGHT` 均未改动。

## 删除清单（Task 0 已授权）

- 左栏自建 `<Scroll loc={[LEFT_PAD, LIST_TOP, GROUP_WIDTH, LIST_HEIGHT]}>` 及其全部分组 `g-rectr` 行与分组名 `text`。
- 文件级常量及其 jsDoc：`GROUP_TEXT_LEFT`、`RIGHT_LEFT`、`RIGHT_WIDTH`。
- 两处分组行注释：JSX 注释「每行点击区与分组名，选中态由同一矩形的描边表示」、行注释「选中分组只由这一行的边框表示，元素始终挂载」。
- `/** 关闭界面，返回文本是实际的关闭路径 */` 按 AGENTS.md **逐字保留**（文字已略过时），且不再被任何闸门依赖。

## 新增清单

- 文件级常量：`GROUP_BASIS` / `CONTENT_WIDTH` / `COMMAND_WIDTH` / `COMMAND_SCROLL_LOC` / `CLOSE_LOC`（均带 jsDoc，前三个为 number，后两个为 `ElementLocator`）。
- setup 成员：`groupItems: [string, string][]`（`groups.map(([id, group]) => [id, group.name])`，`group.name` 在全文件恰好 1 次）、`getKeyClick(command, index)`。
- 三个局部 loc：`nameLoc`（指令名）、`boxLoc`（按键框）、`textLoc`（组合文本）。
- 按键框仍是 `<g-rectr>` + `strokeStyle={isSelected ? …}` + `lineWidth={isSelected ? …}`，两处各恰好 1 次，未使用 `Selection`。

## 14 处多行内联 loc 的逐文件清单

| 文件 | 处数 | 新常量 / 落点 |
|------|------|----------------|
| `book.tsx` | 0 | 无（全部 loc 均为单行短数组，按要求保留） |
| `bookDetail.tsx` | 2 | 文件级 `SPECIAL_SCROLL_LOC`（`Scroll`）；`getSpecialItems` 内 `textLoc`（`TextContent`，每次调用新建） |
| `equipbox.tsx` | 7 | 状态区增减文本 `deltaLoc`；`slotCellLoc` / `slotIconLoc` / `slotNameLoc`；`ownedCellLoc` / `ownedIconLoc`；渲染闭包内 `dragLoc` |
| `toolbox.tsx` | 2 | 两处 map 内各一个 `cellLoc`（永久 / 可消耗列） |
| `hotkey.tsx` | 3 | `renderCommands` 内 `nameLoc` / `boxLoc` / `textLoc` |
| **合计** | **14** | |

## 13 处内联箭头事件处理器的逐文件清单

| 文件 | 处数 | 新具名函数 / 工厂 | JSX 调用点 |
|------|------|--------------------|-------------|
| `book.tsx` | 1 | `getEnemyClick(view)` | `onClick={getEnemyClick(view)}` |
| `bookDetail.tsx` | 1 | `getUpdateHeight(code)` | `onUpdateHeight={getUpdateHeight(row.special.code)}` |
| `equipbox.tsx` | 7 | `onMove`（根 container）、`getSlotEnter(slot)` ×2、`getSlotLeave(slot)` ×2、`getSlotDown(equip, slot)`、`getOwnedDown(uid)` | `onMove={onMove}` / `onEnter={getSlotEnter(i)}` / `onLeave={getSlotLeave(i)}` / `onDown={getSlotDown(slotEquip, i)}` / `onDown={getOwnedDown(item.uid)}` |
| `toolbox.tsx` | 2 | `getItemClick(item)` | 两处 `onClick={getItemClick(item)}` |
| `hotkey.tsx` | 2 | `getKeyClick(command, index)`（含分组点击一并由 ListPage 取代） | `onClick={getKeyClick(row.command, j)}` |
| **合计** | **13** | | |

行为口径保持：`book` 13 个同级元素与四项临界 0 回退、`bookDetail` 的 `cumsum(hs)` / `ends[i] - hs[i]` / `autoHeight` + `onUpdateHeight` + `textHeights` + `SPECIAL_MIN_HEIGHT` 回退与「已按 `props.loc` 响应式同步」注释、`equipbox` 的 `hidden` 分流与拖拽 / 悬停 / 再点穿戴、`toolbox` 的 `hidden={!!current}` 与再点使用、`hotkey` 的捕获 / 写回 / 分组切换 / 无入口 / 无持久化 / 无冲突 / 无恢复默认，全部保持。逻辑体（`startPress` / `movePress` / `endPress` / `clickItem` / `openDetail` / `updateTextHeight` / `selectKey`）零改动。

## `nocache` 走属性透传的假设

`ListPage` 的 `props` 声明里没有 `nocache`，本次依赖 Vue 的「未声明属性透传到唯一根元素」规则，把它落到 `ListPage` 的根 `<container loc={props.loc}>` 上，从而让整屏仍不缓存。**这是未在浏览器中验证的假设**：范围闸门只能证明 `list.tsx` 未被修改（哈希一致），不能证明透传在运行时生效。若后续发现整屏被缓存复用，应停下上报，不得改 `list.tsx`、也不得擅自加包裹 container（本计划未加，hotkey 源码 `<container` 计数为 0）。

## `hotkeySettingsGate.test.ts` 的改写口径

- 关闭用例改名为 `closes through the common exit command and the ListPage close text`，断言 `@common/exit`、`ListPage`、布尔 `close`（`/<ListPage[^>]*\sclose(?=[\s>])/`）、`closeLoc={CLOSE_LOC}`、`onClose={close}`，并否定 `text="返回"` 与 `text="关闭"`。
- 新增 `list.tsx?raw` 导入，断言 `text="关闭"`，证明关闭文本确实来自 `ListPage` 而非 hotkey 自建。
- **删除**了原来 `expect(hotkeySource).toContain('返回')` 的过时要求——它此前只命中 jsDoc 里的字面量，不代表真实关闭路径。
- 其余 10 个用例与 `stripComments` 一字未动；该文件因此**退出受保护哈希集合**（受保护文件降为 8 个），只出现在范围闸门的 7 个允许路径里。
- 改写前（Task 1 时）与改写后（Task 3）两次运行均为 12 个用例全绿。

## 视觉差异登记（只记录、不修复）

1. 分组选中态由金色 2px 边框变为 `ListPage` 内部 `Selection` 的脉动高亮（默认 `color` / `border` 为 `undefined`）。
2. 左栏列表几何从自建 `Scroll loc={[16, 48, 180, 320]}` 变为 `ListPage` 列表区 `loc={[0, 0, 180, 416]}`：行整体左移 16、上移 48，并占满 416 整高（末行可贴到左下角「关闭」所在的 y = 400 附近并被其覆盖）。
3. 分组名文本不再变金色（`List` 内置 `text` 用默认 `fillStyle`）。
4. 选中矩形宽度为 `listWidth - 10 = 170`，不再与原分组行同宽。
5. 分组名文本 x 由 8 变为 `List` 固定的 10。
6. 关闭入口由左上角「返回」变为左下角 `CLOSE_LOC` 的「关闭」。
7. `List` 的行用 `container` 包裹（`ListPage` / `List` 内部行为，不在 hotkey 源码里）。

以上均为用户选择 `ListPage` 直接带来的形态变化，本计划不修复。

## 门禁实际结果（全部在写本文件之前跑完）

| 门禁 | 结果 |
|------|------|
| Task 1 基线 schema | `OK task1: baseline` |
| Task 1 hotkey 形状 | `OK task1: hotkey on ListPage, handlers and locs extracted` |
| `pnpm exec eslint src/client/ui/hotkey.tsx` | exit 0，无输出 |
| `vitest hotkeySettingsGate.test.ts`（Task 1 时，仍断言「返回」） | 12 passed |
| Task 2 形状（无多行 loc / 无内联箭头 / 无 key） | `OK task2: no multiline loc, no inline arrow handler, no key` |
| Task 2 内容（handler 与行为标记） | `OK task2: handlers extracted and behaviour markers retained` |
| `pnpm exec eslint`（4 个 UI 文件） | exit 0，无输出 |
| `vitest uiContainerGate.test.ts` | **18 passed**（原 16 组 + 新增 2 组） |
| `vitest hotkeySettingsGate.test.ts` | 12 passed |
| `eslint` NEW-only（7 路径，归一化口径与基线逐字相同） | `baseline 0 -> current 0`，无 NEW |
| `pnpm check:type` NEW-only（7 路径 scope） | `baseline 6 -> current 6`，无 NEW 诊断（6 条均为既存 `Type 'number' is not assignable to type 'AllNumbers \| keyof IdToNumber'`） |
| 8 个受保护文件哈希 + HEAD 政策 | `OK protected files unchanged; HEAD policy satisfied`（HEAD 仍为 `422f3d8`） |
| 全仓脏文件范围闸门 | `OK scope: no out-of-scope writes (25 dirty paths total, 24 pre-existing)` |

范围闸门的局限：09-29 / 09-30 / 09-31 的改动在执行开始时仍未提交，本计划的 6 个代码 / 测试路径在基线快照里本来就是脏的，因此该闸门只能证明「没有新增范围外路径」，不能证明这些文件的 diff 全部来自本计划。

## Deviations from Plan

### 自动修正 / 必要调整

**1. [Rule 3 - 阻塞] `COMMAND_SCROLL_LOC` / `CLOSE_LOC` 的声明位置后移到 `LIST_HEIGHT` 之后**
- **发现于：** Task 1
- **问题：** 计划写「在 `GROUP_WIDTH` 之后新增」这两个 `ElementLocator`，但 `COMMAND_SCROLL_LOC` 引用 `LIST_TOP` / `LIST_HEIGHT`，这两个常量在文件中声明更靠后；模块级 `const` 存在 TDZ，按计划的顺序会在模块初始化时抛 `ReferenceError`。
- **处理：** `GROUP_BASIS` / `CONTENT_WIDTH` / `COMMAND_WIDTH` 仍紧跟 `GROUP_WIDTH`，两个 loc 常量移到 `LIST_HEIGHT` 之后；取值与语义完全不变。
- **文件：** `src/client/ui/hotkey.tsx`

**2. [Rule 3 - 阻塞] hotkey 右栏 JSX 提为 setup 级 `renderCommands`**
- **发现于：** Task 1
- **问题：** 若把 `<Scroll>` 直接内联在 `default: () => (…)` 插槽里，`onClick={getKeyClick(row.command, j)}` 位于 44 列缩进、整行 81 列，Prettier 会把调用参数折行，于是「扁平化后连续字面量」断言（计划自带闸门与 `tagAround` 的针）全部失配。
- **处理：** 把右栏渲染提为 setup 里的 `renderCommands`，插槽写成 `{{ default: () => renderCommands() }}`，仍在 `default` 插槽内返回唯一一条 `<Scroll loc={COMMAND_SCROLL_LOC}>`；缩进降到 32 列后 `onClick` 保持单行。行为零变化。
- **文件：** `src/client/ui/hotkey.tsx`

**3. [Rule 3 - 阻塞] bookDetail 每行子项提为 setup 级 `getSpecialItems(row)`**
- **发现于：** Task 2
- **问题：** `map` 回调改成块体后才能声明 `const textLoc`，此时 `onUpdateHeight={getUpdateHeight(row.special.code)}` 落在 32 列缩进、整行 81 列，Prettier 会折行并打断 Task 2 闸门的连续字面量断言。
- **处理：** 每行子项提为 `getSpecialItems(row)`，`textLoc` 仍在每次调用时新建（保持「每次求值新建 loc 数组」）；JSX 写 `{specialRows.value.map(row => getSpecialItems(row))}`。
- **文件：** `src/client/ui/bookDetail.tsx`

**4. [Rule 1 - 计划内部矛盾] equipbox 的 `@motajs/render` 导入保留两行**
- **发现于：** Task 2
- **问题：** 计划要求把 `import { Font } from '@motajs/render';` 与 `import { ElementLocator } from '@motajs/render';` 合并为 `import { ElementLocator, IActionEvent } from '@motajs/render';`，但该文件仍用 `Font.defaults(...)` 生成 `titleFont` / `labelFont`，按字面合并会删掉仍在使用的 `Font`。
- **处理：** 保留两行——`import { Font } from '@motajs/render';` 与 `import { ElementLocator, IActionEvent } from '@motajs/render';`。这样 Task 3 断言的精确字符串仍然命中，`Font` 也不会丢失。**需要你确认是否接受这个写法**（若要单行，需要同时放宽该断言）。
- **文件：** `src/client/ui/equipbox.tsx`

**5. [格式] 用 `pnpm exec prettier --write` 统一格式与 CRLF**
- **发现于：** 全部任务
- **处理：** 编辑后用仓库自带 Prettier 配置（`endOfLine: crlf`、printWidth 80）格式化 5 个 UI 文件与 2 个测试文件；无任何语义改动，eslint 前后基线都是 0 条。

### 未获预先报备的局部命名（需你确认）

为了绕开上面第 2 / 3 条的宽度约束，新增了两个**不在 OI-1 命名清单里**的 setup 局部标识符：

- `renderCommands`（hotkey 右栏渲染函数）
- `getSpecialItems`（bookDetail 每行子项工厂）

两者都是 setup 内的局部 `const`，不导出、不进接口、不进 `GameUI`。若你希望换名（例如 `renderCommandColumn` / `getSpecialRow`），我可以整体替换后再跑一次门禁。

## 未做浏览器 UAT 声明

**本计划全程未做浏览器 UAT**，不宣称布局、滚动、点击命中、拖拽手感、捕获时序、`Selection` 脉动高亮或 `nocache` 透传中的任何一项已验证。以上全部由源码形状断言与静态检查间接保证，实际观感需人工确认。

## 其他声明

- `estimate` 为**未校准估算**（`confidence: low`），`actuals.tokens` 记 `null`：工作树自带 09-29..09-31 的未提交改动，无法把本计划自身的 diff 分离出来。
- **执行器 0 次代码提交**：未运行任何 `git add` / `commit` / `stash` / `checkout` / `restore` / `reset` / `worktree`；代码改动全部留在工作树供审查，`.planning` 产物由编排器按 `commit_docs` 决定。
- `keyAdaptationGate.test.ts` 是**既存失败**（09-30 记录 15 个用例 5 个失败，09-31 未修），引用的是 `src/client/misc/hotkey.ts` 与 `ui/inputBox` / `waitBox`，与本计划改的 `ui/hotkey.tsx` 无关；本计划不修、不以其为绿、不声称全部既有闸门为绿。
- `book.tsx` 的过期 TODO（写着「留空」，与 0 值回退矛盾）与 `bookDetail` 的「一次遍历累加出每行位置…」等既有注释一律原样保留。
- 空分组边界（`List` 固定读 `list[0][0]`，空列表会抛错）属 `ListPage` / `List` 既有行为，本计划只记录、不修复，未改 `list.tsx`。

## Known Stubs

无。本计划只做结构重构，未引入任何空数据占位、TODO 或未接线组件。

## Threat Flags

无新增。8 个受保护文件（`scroll.tsx` / `list.tsx` / `textbox.tsx` / `settings.tsx` / `ui/index.ts` / `misc/hotkey.ts` / `inputBox.tsx` / `waitBox.tsx`）哈希与基线一致，未新增依赖、未执行安装、未执行构建。

## Self-Check: PASSED

- 5 个 UI 文件、2 个测试文件与 2 个 `.planning` 产物全部存在且已按计划改写。
- 全部门禁（vitest ×2、eslint NEW-only、`check:type` NEW-only、8 个受保护哈希、HEAD 政策、全仓脏文件范围）均以退出码 0 结束。
- 摘要闸门在本文件写完后运行，未通过则补齐后重跑。
