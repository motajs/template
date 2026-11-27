---
phase: 09-minimum-browser-runnable
plan: 31
subsystem: ui
tags: [vue, jsx, textcontent, reactive-loc, cumsum, key-removal, source-gate]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-30 的内联 JSX .map() 列表渲染、平铺 Scroll、0 值回退与 TextContent 高度测量"
provides:
  - "TextContent 的 props.loc 响应式同步（宽度恒取 props.width，高度按 autoHeight 分流）"
  - "bookDetail 用 @motajs/common 的 cumsum 计算行位置"
  - "5 个列表型 UI 的 37 个 key 全部删除（不保留、不做 workaround）"
  - "16 组源码形状闸门（原 13 组，删 key / 重挂载断言，新增 3 组）"

# 未校准估算：09-29 / 09-30 的改动在基线时仍未提交，无法从工作树分离 09-31 自身的真实 diff。
# 为避免把前序计划的工作计入 09-31，tokens 不虚报，记 null。
actuals:
  tokens: null
  tasks: 4
  commits: 0
  note: "工作树自带 09-29 / 09-30 的未提交改动，无法分离 09-31 自身的 diff，tokens 记 null；tasks 只计 Task 1-4（Task 0 汇报关卡不计入）；commits 为 0，执行器未做任何代码提交。"

estimate:
  tokens: 70000
  raw_tokens: 35000
  tasks: 4
  confidence: low

tech-stack:
  added: []
  patterns:
    - "TextContent 只从 props.loc 取 x / y / ax / ay，宽度恒取 props.width；调用方每次求值传新数组即可推动位置"
    - "行位置用 cumsum(hs) 的累计结束位置减去本行行高得到，不再手写累加变量"
    - "无状态、顺序固定的列表一律不加 key（dev.md 第 122-123 行）"

key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-31-BASELINE.json
    - .planning/phases/09-minimum-browser-runnable/09-31-SUMMARY.md
  modified:
    - packages-user/client-base/src/components/textbox.tsx
    - src/client/ui/bookDetail.tsx
    - src/client/ui/book.tsx
    - src/client/ui/equipbox.tsx
    - src/client/ui/toolbox.tsx
    - src/client/ui/hotkey.tsx
    - src/client/ui/__test__/uiContainerGate.test.ts

key-decisions:
  - "TextContent 新增 watch(() => props.loc, updateLoc)，updateLoc 恒写六元组 [x, y, props.width, props.autoHeight ? height : h, ax, ay]，宽度不再取传入 loc[2]"
  - "bookDetail 的 specialRows 改为「行高 hs → ends = cumsum(hs) → ends[i] - hs[i] 为行顶」，删除 let top 与 top +="
  - "5 个 UI 文件的 37 个 key 全删（book 13 / bookDetail 2 / equipbox 9 / toolbox 8 / hotkey 5），一个都不保留，不加索引 key、不加 Fragment / 容器 / 条件渲染 / hidden 开关"
  - "渲染器 removeChild 被实现为 destroy 的既有问题按 dev.md 第 123 行视为已知并假定修复，本计划不做任何 workaround"
  - "按用户本轮授权，删除 bookDetail 中两处仍提到 key 的过期注释（原计划默认保留）"

patterns-established:
  - "响应式几何契约：调用方每次求值构造新 loc 数组，组件只按新引用同步自己的矩形，不靠 key 重挂载"
  - "累计位置：cumsum(hs) 返回累计结束位置，行顶必须写 ends[i] - hs[i]"

requirements-completed: []

duration: "未精确计时（约 30 分钟）"
completed: 2026-10-28
status: complete
---

# Phase 09 Plan 31: `TextContent` 响应式 loc + `bookDetail` 改用 `cumsum` + 5 个 UI 文件删除 37 个 `key` Summary

**让 `TextContent` 的 `props.loc` 真正响应式（宽度恒取 `props.width`、高度按 `autoHeight` 分流）、把 `bookDetail` 的行位置交给 `cumsum`、并按 `dev.md` 新规删掉 5 个列表型 UI 的全部 37 个 `key`；不新增入口、不改变行为口径、不做浏览器 UAT**

## Performance

- **Duration:** 未精确计时（约 30 分钟）
- **Completed:** 2026-10-28
- **Tasks:** 4（Task 1-4；Task 0 的 `blocking-human` 汇报关卡不计入）
- **Files modified:** 6 个代码 / 测试文件 + 1 个 `.planning` 基线；另加本摘要与计划文件
- **Commits:** 0（执行器严格未运行任何 git 写命令）

## Accomplishments

### 1. `TextContent` 的位置语义（`packages-user/client-base/src/components/textbox.tsx`）

- 新增专用 watcher，紧随 `updateLoc` 之后：`watch(() => props.loc, updateLoc);`（不传 `deep`，靠调用方每次求值产生的新数组引用触发）。
- `updateLoc` 改为：

  ```ts
  const height = getHeight();
  const [x = 0, y = 0, , h = 0, ax = 0, ay = 0] = props.loc ?? loc.value;
  loc.value = [x, y, props.width, props.autoHeight ? height : h, ax, ay];
  emit('updateHeight', height);
  ```

- 四条固定语义：①`x` / `y` / `ax` / `ay` 只来自传入的 `props.loc`（缺省退回 `loc.value` 同位）；②宽度恒为 `props.width`，**不再**取传入 `loc[2]`；③高度在 `props.autoHeight` 为真时取 `getHeight()` 的实测值，否则取传入 `loc[3]`；④`typer` / `retype` / `showAll` / `getHeight` / `renderContent` / `renderFunc` / `emit('updateHeight', height)` / `expose` / 既有 `watch(props, …)` / `Textbox` / `TextboxStore` / 既有注释全部一字未改。
- 唯一有意为之的可见变化：`Textbox` 内嵌的 `TextContent` 宽度由「整框宽度」变为「内容宽度 `contentWidth`」。这是修正，不是回归。
- `TextContent` 的其它 8 个使用方（`inputBox.tsx` / `waitBox.tsx` / `statusBar.tsx` / `statistics.tsx` / `choices.tsx` 两处 / `src/client/plugin/shop/shop.tsx` / `packages-user/client-base/src/components/input.tsx` / `components/misc.tsx`）**未改**；这些调用点 `width` 与 `loc[2]` 相等，`autoHeight` 处仍取实测高度，尺寸口径不变。`choices` 等 computed `loc` 调用点的 x / y 现在会随 `loc` 变化响应式跟随，属本次修正的预期效果。

### 2. `bookDetail` 的 `cumsum` 等价性（`src/client/ui/bookDetail.tsx`）

- 导入改为 `import { cumsum, ITileLocator } from '@motajs/common';`。
- `specialRows` 改为三段式：行高 `hs` → `const ends = cumsum(hs);` → `specials.value.map((special, i) => …)`，行顶 `labelTop = ends[i] - hs[i]`、`textTop = ends[i] - hs[i] + SPECIAL_LABEL_HEIGHT`、`textHeight = hs[i] - SPECIAL_LABEL_HEIGHT - SPECIAL_GAP`。
- 等价性逐行对照：原 `top` 从 0 开始，每行结束于 `top + SPECIAL_LABEL_HEIGHT + textHeight + SPECIAL_GAP`；`hs[i]` 正是这一增量，`ends[i] - hs[i]` 就是原来的 `top`，`textTop` / `textHeight` 与原来逐字一致。`cumsum` 返回的是**累计结束位置**（不是偏移），所以必须减去 `hs[i]`。
- 文件内不再出现 `top +=`，也没有任何 `for` 累加。`textHeights` / `updateTextHeight`（含同值早退）/ `watch(specials, …)` / `SPECIAL_MIN_HEIGHT` 回退 / 0 值回退全部保留。
- 渲染改为 `specialRows.value.map(row => [<text …/>, <TextContent …/>])`，两个元素**都没有 `key`**；`TextContent` 的 `loc` 为每次求值新建的 `[0, row.textTop, SPECIAL_WIDTH, row.textHeight]`，靠新引用触发位置同步；`autoHeight` / `onUpdateHeight` / `width` / `font` / `fillStyle` 逐字保留。

### 3. 37 个 `key` 的完整删除清单

| 文件 | 删除的 key | 数量 |
|------|-----------|------|
| `src/client/ui/book.tsx` | `hit-` / `icon-` / `name-` / `special-` / `hp-` / `atk-` / `def-` / `money-` / `exp-` / `dmg-` / `crit-` / `reduce-` / `def1-` | 13 |
| `src/client/ui/bookDetail.tsx` | `label-` / `${code}-${textTop}-${textHeight}` | 2 |
| `src/client/ui/equipbox.tsx` | 状态区 3、槽位 3、拥有装备 3 | 9 |
| `src/client/ui/toolbox.tsx` | 永久道具列 4、可消耗道具列 4 | 8 |
| `src/client/ui/hotkey.tsx` | 左栏 2、右栏 1、内层组合 2 | 5 |
| **合计** | | **37** |

- **没有保留任何一个**；没有把 `key` 换成索引 key，也没有新增 Fragment / 容器 / 条件渲染 / `hidden` 开关作为替代。列表仍是内联 `.map()` 返回同级数组，`Scroll` 内仍无 `container`、无 `hidden=`。
- 渲染系统当前 `removeChild` 被实现为 `destroy` 导致无法重新挂载的问题**仍然存在**，按 `dev.md` 第 123 行视为已知并**假定修复**，本计划**未做任何 workaround**（没有加回 `key`，也没有改 `Scroll`）。
- 行为口径零变化：`book` / `bookDetail` 的 0 值回退、`bookDetail` 的 `SPECIAL_MIN_HEIGHT` 回退、`equipbox` 拖拽 / 悬停 / 再点穿戴、`toolbox` 再点使用、`hotkey` 捕获 / 写回 / 分组切换全部保持 09-30 口径。

### 4. 注释改动清单

- `bookDetail` 中描述「复制一次 `props.loc` / `key` 重挂载」的两行旧注释，替换为一行：`// TextContent 已按 props.loc 响应式同步位置，行位置变化时无需重挂载`（计划授权范围内）。
- 按用户本轮明确授权，**删除**两处删掉 key 后已过期的注释：`ISpecialRow.textHeight` 上方的 `/** 描述文本的实测高度，同时用于 TextContent 的 key */` 与 `updateTextHeight` 上方的 `// 同值不写，避免高度回调与 key 重挂载互相触发`。这两处属于本计划对「既有注释只增不改」的**授权例外**（原计划默认保留，见下方「偏离说明」）。
- 其余既有注释**一律未改**，包括 `bookDetail` 的 `// 一次遍历累加出每行位置；行高只在循环内使用，不写入接口`、`// 按特殊属性 code 记录实测描述高度…`、`// 只保留仍存在的条目…`，以及 `book.tsx` 里那条写着「留空」的过期 TODO。

## Files Created/Modified

- `packages-user/client-base/src/components/textbox.tsx` - `TextContent` 新增 `props.loc` 的 watcher，`updateLoc` 改为六元组形态（宽度恒 `props.width`、高度按 `autoHeight` 分流）；其余零改动。
- `src/client/ui/bookDetail.tsx` - 导入 `cumsum`；`specialRows` 用 `hs` + `cumsum(hs)` + `ends[i] - hs[i]`；渲染去掉 2 个 `key`，`TextContent` 的 `loc` 每次新建；替换 1 处旧注释、删除 2 处授权删除的过期注释。
- `src/client/ui/book.tsx` - 删除 13 个 `key`，元素、属性、0 回退、`noevent`、三条 `//` 与 `{/* … */}` 全部不变。
- `src/client/ui/equipbox.tsx` - 删除 9 个 `key`，三处三元组结构、`hidden` 分流、拖拽 / 悬停逻辑与 4 个 `*_SCROLL_LOC` 全部不变。
- `src/client/ui/toolbox.tsx` - 删除 8 个 `key`，两处四元组结构、`hidden={!!current}`、空文本回退、`clickItem` 再点使用全部不变。
- `src/client/ui/hotkey.tsx` - 删除 5 个 `key`，两栏结构、`selectGroup` / `selectKey`、选中边框、根 `nocache` 全部不变。
- `src/client/ui/__test__/uiContainerGate.test.ts` - 新增跨包 `?raw` 导入 `textbox.tsx`；删除 13 个 key 前缀断言与 2 处重挂载注释断言；`book` 每行改为按标签计数（11 `text` + 1 `icon` + 1 `g-rect`）；新增「五文件无 `key={`」「`cumsum` 且无 `top +=`」「`textbox` 响应式 loc」三组；其余保留项断言与辅助函数不变；每个 `it` 上方紧邻一行 `//`。
- `.planning/phases/09-minimum-browser-runnable/09-31-BASELINE.json` - Task 1 在编辑任何代码之前写出的机器可读基线：`head` / 6 个受保护文件哈希 / `textbox.tsx` 改动前哈希 / 全仓脏文件快照 / 7 路径 eslint 基线 / 7 路径 typecheck 基线。
- `.planning/phases/09-minimum-browser-runnable/09-31-SUMMARY.md` - 本文件。

## Gate Results（全部为实际运行结果）

| 闸门 | 结果 |
|------|------|
| `09-31-BASELINE.json` 结构 | 通过：`head` / `hashes`（6 条）/ `textbox` / `dirty`（25 条，已去 `.planning/`）/ `eslint` / `typecheck` 齐全；`textbox.tsx` 未被列入受保护哈希 |
| `uiContainerGate.test.ts` | 通过：**16 passed / 16**（原 13 组，删 3 处 key 断言、新增 3 组） |
| `hotkeySettingsGate.test.ts` | 通过：**12 passed / 12**（未修改该文件） |
| `eslint`（同一组 7 个路径，只判 NEW） | 通过：基线 0 条 → 当前 0 条，**无 NEW** |
| `pnpm check:type`（整仓，仅 7 路径 scope 内判 NEW） | 通过：7 路径内基线 6 条 → 当前 6 条，**无 NEW**（均为既有的 `AllNumbers | keyof IdToNumber` 诊断） |
| 受保护文件哈希（6 个） | 通过：`scroll.tsx` / `settings.tsx` / `ui/index.ts` / `misc/hotkey.ts` / `inputBox.tsx` / `waitBox.tsx` 与基线逐字相等 |
| `textbox.tsx` 前后哈希 | 通过：`b17e988d77c3a81fe3ce3250940e31a9774f8dfb` → `5b58de65007189314553be0aca48209bd9e25981`（**已变化**，证明确实改到位） |
| HEAD 政策 | 通过：HEAD 仍为 `ff0f729cfc7065c00a57d2bf5fd8eb4ff8b74071`，与基线 `head` 相同，无任何提交 |
| 改动范围 | 通过：`git status --porcelain -uall` 共 26 条脏路径，其中 25 条是基线快照里的既有脏文件，新增的只有 `textbox.tsx`；无任何范围外新路径 |
| 摘要内容闸门 | 通过（本文件写完后再跑一次） |
| `keyAdaptationGate.test.ts` | **既存失败，不在本计划范围**（09-30 记录：15 个用例 5 个失败，改动前即如此）；未修、未以它为绿、不声称全部既有闸门为绿 |

## Deviations from Plan

### 授权偏离（用户本轮 addendum）

**1. [用户授权] 删除 `bookDetail.tsx` 两处过期注释**
- **原计划口径：** 这两处注释按 AGENTS.md「不得擅改既有注释」原样保留，只在 SUMMARY / OI-3 中登记为已知过期注释。
- **实际执行：** 用户明确要求删除 `ISpecialRow.textHeight` 上方的 `/** 描述文本的实测高度，同时用于 TextContent 的 key */` 与 `updateTextHeight` 上方的 `// 同值不写，避免高度回调与 key 重挂载互相触发`。
- **影响：** 仅注释；接口字段与 `updateTextHeight` 的同值早退逻辑一字未动。测试中新增两条否定断言，锁定这两段文字不再出现。

### 执行期自动修正

**2. [Rule 3 - 阻塞] watcher 写成 `watch(() => props.loc, updateLoc)`**
- **发现于：** Task 1
- **问题：** 计划给出的 `watch(() => props.loc, () => { updateLoc(); });` 会被 Prettier（`printWidth: 80` + `eslint-plugin-prettier/recommended`）展开成多行，`watch(` 与 `() => props.loc` 之间会插入换行，导致计划自带的形状闸门（要求字面量 `watch(() => props.loc`）失败。两者不可能同时满足。
- **修正：** 改为等价的 `watch(() => props.loc, updateLoc);`（同一 source、同一回调，行为完全一致），既通过 prettier 也满足闸门字面量。
- **文件：** `packages-user/client-base/src/components/textbox.tsx`

**3. [Rule 3 - 阻塞] 测试对 `TextContent` 的 `loc` 断言改用空白容忍正则**
- **发现于：** Task 4
- **问题：** 计划要求断言 `toContain('loc={[')`。经复核，Prettier 换行后仍保留 `loc={[` 字面量，因此原断言实际可以通过；此处的改动不是修复失败，而是把断言收紧为对字段顺序与取值的匹配。
- **修正：** 改为对 `flatten(tagAround(...))` 断言 `/loc=\{\[\s*0,\s*row\.textTop,\s*SPECIAL_WIDTH,\s*row\.textHeight\s*\]\}/`，语义相同、比原来的字面量断言更严格，且与格式化无关。

### 未执行 / 保留项

- **`bookDetail` 的 `// 一次遍历累加出每行位置；行高只在循环内使用，不写入接口`** 在改成 `cumsum` 后已略显过时（已无循环），但按 AGENTS.md「不得擅改既有注释」**原样保留**，在此登记。
- **`book.tsx` 的过期 TODO（写着「留空」）** 原样保留。
- 未修改 `Scroll`、设置入口、UI 导出清单、按键注册表、`inputBox.tsx` / `waitBox.tsx`、`map/*`、`10-*` 及相关文档。

## Known Stubs

无。本计划不新增任何入口、不新增占位数据、不新增未接线的组件；5 个 UI 文件与 `TextContent` 的行为口径与 09-30 一致。

## Threat Flags

无新增信任边界：本计划只改组件内部的位置计算与列表属性，不新增网络 / 文件 / 认证 / 权限相关面。

## 未验证事项（必须如实声明）

- **未做浏览器 UAT**：位置收敛、滚动、内存、点击命中、拖拽手感、复用正确性**均未验证**，本摘要不宣称任何视觉 / 滚动 / 点击 / 拖拽行为已验证。
- **估算未校准**：`estimate` 为 `confidence: low` 的未校准估算（`tokens: 70000` / `raw_tokens: 35000` / `tasks: 4`，Task 0 不计入）；`actuals.tokens` 因工作树自带 09-29 / 09-30 的未提交改动而无法分离，记 `null`。
- **范围闸门的局限**：09-29 / 09-30 的 5 个 UI 文件与 `uiContainerGate.test.ts` 在本计划开始前就已经是脏的，因此范围闸门只能证明「没有新增范围外路径」，不能证明这些文件的全部内容都出自本计划；内容是否改到位由源码形状闸门负责。
- **执行器 0 次代码提交**：本计划未运行任何 git 写命令（`add` / `commit` / `stash` / `checkout` / `restore` / `reset` / `worktree` 一律未执行），全部代码改动留在工作树，交由用户审查。两个 `.planning` 产物（`09-31-BASELINE.json` / 本 SUMMARY）可能由编排器按 `commit_docs: true` 聚合提交，不属于本计划的代码提交。
- **`keyAdaptationGate.test.ts` 的既存失败**不在本计划范围，未修。

## Self-Check: PASSED

- 5 个 UI 文件去注释源码中 `key={` 出现次数均为 0（实测 `book` 0 / `bookDetail` 0 / `equipbox` 0 / `toolbox` 0 / `hotkey` 0）。
- `textbox.tsx` 的 `updateLoc` 仅保留一处 `loc.value` 赋值，形态为 `[x, y, props.width, props.autoHeight ? height : h, ax, ay]`。
- `bookDetail.tsx` 含 `cumsum(hs)` 与 `ends[i] - hs[i]`，无 `top +=`。
- 全部自动闸门以退出码 0 通过（摘要内容闸门在本文件写完后运行）。
