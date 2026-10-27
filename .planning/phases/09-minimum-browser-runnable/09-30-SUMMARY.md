---
phase: 09-minimum-browser-runnable
plan: 30
subsystem: ui
tags: [vue, jsx, scroll, inline-map, source-gate]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-29 的平铺 Scroll、0 值回退、TextContent 高度测量与热键设置行为口径"
provides:
  - "5 个列表型 UI 的内联 JSX .map() 渲染写法"
  - "13 组源码形状闸门（原 9 组 + 新增 4 组）"
affects: [09-minimum-browser-runnable, ui]

# 未校准估算：09-29 的改动在基线时仍未提交，无法从工作树分离 09-30 自身的真实 diff。
# 为避免把 09-29 的工作计入 09-30，tokens 不虚报，记 null。
actuals:
  tokens: null
  tasks: 4
  commits: 0
  note: "无法从工作树分离 09-30 自身的 diff，tokens 记 null；tasks 只计 Task 1-4。"

estimate:
  tokens: 60000
  raw_tokens: 30000
  tasks: 4
  confidence: low

tech-stack:
  added: []
  patterns: ["Scroll 的列表子元素直接在 JSX 内 .map() 展开，一行多元素返回同级数组"]

key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-30-BASELINE.json
    - .planning/phases/09-minimum-browser-runnable/09-30-SUMMARY.md
  modified:
    - src/client/ui/book.tsx
    - src/client/ui/bookDetail.tsx
    - src/client/ui/equipbox.tsx
    - src/client/ui/toolbox.tsx
    - src/client/ui/hotkey.tsx
    - src/client/ui/__test__/uiContainerGate.test.ts

key-decisions:
  - "列表一律改为 JSX 内联 .map()，删除顶部预建 VNode[] 数组；一行多元素返回同级数组，不包容器"
  - "bookDetail 的两条既有 // 保留在 return () 之前；book 的第三条保留在 map 回调体内单独成行"
  - "注释位置按渲染正确性处理：Scroll 的 JSX 子元素位置只放 {/* … */}，// 只落在 JS 代码位置"

patterns-established:
  - "列表段落：Scroll 内先写一行 {/* 职责与内容 */}，再用 .map() 返回同级子项数组"
  - "一行多元素：回调返回数组，不引入 Fragment / 容器"

requirements-completed: []

duration: "约 20min"
completed: 2026-10-27
status: complete
---

# Phase 09 Plan 30: 列表回归内联 JSX `.map()` 渲染 Summary

**把 5 个列表型 UI 的预建 `VNode[]` + `for` + `push` 全部改回内联 JSX `.map()`，一行多元素返回同级数组，行为口径与 09-29 保持一致**

## Performance

- **Duration:** 约 20 分钟（非精确计时）
- **Completed:** 2026-10-27
- **Tasks:** 4（Task 1-4；Task 0 汇报关卡不计入）
- **Files modified:** 6 个代码 / 测试文件，另写出 2 个 `.planning` 产物（BASELINE / SUMMARY）

## Accomplishments

- `book.tsx`、`bookDetail.tsx`、`equipbox.tsx`、`toolbox.tsx`、`hotkey.tsx` 均删除顶部预建 `VNode[]` 与列表 `for` 循环，改为 JSX 内联 `.map()`。
- `book` 每行仍返回 13 个同级元素（命中层、图标、名称、特殊属性、五个基础数值、四个临界数值）。
- `bookDetail` 仍按 `specialRows` 渲染标题与 `TextContent`，高度测量、`key` 重挂载与 `SPECIAL_MIN_HEIGHT` 回退未变。
- 每个列表段落新增一行 `{/* … */}` 职责注释；所有 `//` 只留在 JS 代码位置。
- `uiContainerGate.test.ts` 从 9 组扩展到 13 组，新增「无预建 `VNode` 数组」「内联 `.map()` 与短循环变量」「`book` 每行 13 元素齐全」「注释位置与数量」四组。

## Files Created/Modified

- `src/client/ui/book.tsx` - 删除 `rows: VNode[]` 与 `for`，改为 `enemies.value.map((view, i) => [13 个同级元素])`；`vue` 导入去掉 `VNode`。
- `src/client/ui/bookDetail.tsx` - 删除 `specialNodes` 与 `for`，改为 `specialRows.value.map(row => [<text/>, <TextContent/>])`；保留 `watch` 与全部高度逻辑。
- `src/client/ui/equipbox.tsx` - 删除 `statusNodes` / `slotNodes` / `ownedNodes` 与三个 `for`，改为三处内联 `.map()`，各返回三元组；4 个 `*_SCROLL_LOC` 与 `ElementLocator` 导入保留。
- `src/client/ui/toolbox.tsx` - 删除 `permNodes` / `consNodes` 与两个 `for`，改为 `permItems.value.map` / `consItems.value.map` 各返回四元组。
- `src/client/ui/hotkey.tsx` - 删除 `groupNodes` / `commandNodes` 与两个 `for`；左栏 `groups.map(([id, group], i)`，右栏 `commandRows.value.map((row, i)` + 内层 `.map((keys, j)`；保留 `ICommandRow` / `commandRows` / `combinationLists`。
- `src/client/ui/__test__/uiContainerGate.test.ts` - 保留原 9 组断言，新增 4 组，共 13 组；`hotkey` 的 `selectKey` needle 改为 `j`。
- `.planning/phases/09-minimum-browser-runnable/09-30-BASELINE.json` - 改代码前写出的基线：HEAD、7 个受保护文件哈希、全仓脏文件快照、6 路径 eslint / typecheck 基线。
- `.planning/phases/09-minimum-browser-runnable/09-30-SUMMARY.md` - 本文件。

## 逐文件对照：预建数组 → 内联 map

| 文件 | 删除的预建数组 / 循环 | 新增的内联写法 |
|------|----------------------|----------------|
| `book.tsx` | `rows: VNode[]` + `for` + `rows.push(...)` | `enemies.value.map((view, i) => { …; return [13 元组]; })` |
| `bookDetail.tsx` | `specialNodes: VNode[]` + `for` + `push` | `specialRows.value.map(row => [<text/>, <TextContent/>])` |
| `equipbox.tsx` | `statusNodes` / `slotNodes` / `ownedNodes` + 三个 `for` | `props.attributes.map` / `hero.equip.slots.map` / `owned.value.map`，各返回三元组 |
| `toolbox.tsx` | `permNodes` / `consNodes` + 两个 `for` | `permItems.value.map` / `consItems.value.map`，各返回四元组 |
| `hotkey.tsx` | `groupNodes` / `commandNodes` + 两段嵌套 `for` | 左栏 `groups.map` 二元组；右栏 `commandRows.value.map` + 内层 `list.map((keys, j))` 二元组 |

## 循环变量与 key

- `groupIndex` / `commandIndex` → `i`；内层 `index` → `j`。
- `selectKey` 的函数签名保持 `(command, index)` 不变，调用点改为 `selectKey(row.command, j)`。
- `hotkey` 按键框 key：`box-${i}-${j}`；组合文本 key：`text-${i}-${j}`。
- `book` 保留 13 个 key 前缀：`hit-` / `icon-` / `name-` / `special-` / `hp-` / `atk-` / `def-` / `money-` / `exp-` / `dmg-` / `crit-` / `reduce-` / `def1-`。

## 注释位置与数量

- 每个 `Scroll` 块内 `{/* … */}` 数量：`book [1]`、`bookDetail [1]`、`equipbox [1,0,1,1]`（状态 / 描述 / 槽位 / 拥有）、`toolbox [1,1,0]`（永久 / 消耗 / 描述）、`hotkey [1,1]`。
- `equipbox` / `toolbox` 的描述块不是列表，未新增 `{/* … */}`。
- `Scroll` 的 JSX 子元素位置只放 `{/* … */}`；`//` 只落在渲染函数体、`map` 回调体或返回的数组字面量内部。
- `bookDetail` 的两条既有 `//` 原样留在渲染函数体、`return (` 之前，不在 `Scroll` 块内。
- `book` 的三条既有 `//`（`// 数值列表区` / `// 临界信息区` / `// 临界信息缺失时回退为 0，让「没有数据」与「数值为 0」可以区分`）文本未改；第三条单独成行，位于 `map` 回调体内（即 `Scroll` 块内）。
- `equipbox` 的两条、`hotkey` 的两条既有 `//` 文本未改；`hotkey` 新增的内层 `//` 只位于内层回调体。
- 未修改任何既有注释或 jsDoc；只新增注释。

## Gate Results（实际运行）

| 门禁 | 结果 |
|------|------|
| `pnpm exec vitest run src/client/ui/__test__/uiContainerGate.test.ts` | **13/13 通过**（原 9 组 + 新增 4 组） |
| `pnpm exec vitest run src/client/ui/__test__/hotkeySettingsGate.test.ts` | **12/12 通过** |
| `pnpm exec eslint`（同一组 6 个路径，NEW-only） | 基线 0 → 当前 0，**无 NEW** |
| `pnpm check:type`（整仓，6 路径 scope，NEW-only） | 基线 6 → 当前 6，**无 NEW**；6 条均为 09-29 既有的 `TS2322`，位于 `book.tsx` / `equipbox.tsx` / `toolbox.tsx` |
| 7 个受保护文件哈希 | 与基线逐字一致 |
| HEAD 政策 | 与基线相同：`e2415a7a48d9a9e9d2f886e00c10ca51e91340d1` |
| 全仓脏文件范围闸门 | 25 条脏路径，全部在基线快照或 6 个允许路径内；**无新增范围外路径**；6 个允许路径全部出现 |
| 摘要内容闸门 | 本文件写出后运行并通过 |

## 声明与限制

- **未做浏览器 UAT**：未宣称滚动、内存、点击命中、拖拽手感、内联数组是否逐元素平铺等任何视觉 / 交互行为已验证。
- **执行器 0 次代码提交**：未运行任何 git 写命令（`add` / `commit` / `stash` / `checkout` / `restore` / `worktree` / `reset`），代码改动全部留在工作树供审查。
- **估算未校准**：`confidence: low`，`tasks: 4`，不含 Task 0 汇报关卡；`actuals.tokens` 因 09-29 未提交而无法分离，记 `null`。
- **09-29 改动未提交**：5 个 UI 文件与 `uiContainerGate.test.ts` 在基线时本来就是脏的，因此范围闸门只能证明「没有新增范围外路径」，不能证明这 6 个路径本次被改过；内容是否改到位由源码形状闸门负责。
- **基线脏文件范围**：基线快照还包含 docs、`AGENTS.md`、`map/*`、`setting/*` 等既有未提交修改；本计划未触碰这些文件。
- **`book.tsx` 过期 TODO**：`getCritical` 上方写着「留空」的既有 TODO 按现状保留，未修改。
- **`keyAdaptationGate.test.ts` 是既存失败**：15 个用例中 5 个失败，改动前即如此，不在本计划范围；未修复、未以它为绿、不声称全部既有闸门为绿。
- **无 `inputBox.tsx` / `waitBox.tsx` 改动**：两份受保护文件哈希与基线一致。

## Deviations from Plan

### 1. 修正 Task 4 中一处与 Task 1 冲突的断言（Rule 1 - 测试缺陷）

- **Found during:** Task 4 摘要前门禁。
- **Issue:** Task 4 的文字要求断言 `book` 的第三条注释索引「小于 `<Scroll`」，但 Task 1 明确要求该注释留在 `map` 回调体内（`const damage` 之上），而回调体位于 `<Scroll>` 内部，两个要求不可能同时成立。
- **Fix:** 将该断言改为「大于 `<Scroll` 且小于 `</Scroll>`」，与 Task 1 / `must_haves` 的注释位置要求一致；未改动业务代码。
- **Files modified:** `src/client/ui/__test__/uiContainerGate.test.ts`。
- **Verification:** `uiContainerGate.test.ts` 13/13 通过。

### 2. Prettier 格式化（Rule 1 - 阻塞性格式检查）

- **Found during:** Task 2 / Task 3 eslint。
- **Issue:** 内联 `map` 后缩进变化，部分原有单行三元与属性折行不再满足 `prettier/prettier`。
- **Fix:** 对 5 个 UI 文件与测试文件运行 `pnpm exec prettier --write`；只调整换行与缩进，未改行为、未改注释文本。
- **Files modified:** 5 个 UI 文件 + `uiContainerGate.test.ts`。
- **Verification:** eslint 无 NEW（基线 0 → 当前 0）。

**Total deviations:** 2（测试断言修正 1、格式化 1）。两者均在 `files_modified` 允许范围内，无范围外写入。

## Self-Check: PASSED

- 5 个 UI 文件与 `uiContainerGate.test.ts` 均存在且已写入。
- `09-30-BASELINE.json` 已写出，7 个哈希齐全。
- `uiContainerGate` 13/13、`hotkeySettingsGate` 12/12 通过。
- eslint / `check:type` 无 NEW；7 个受保护文件哈希与 HEAD 政策通过；范围闸门通过。
- 未执行任何 git 写命令。
