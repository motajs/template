---
phase: 09-minimum-browser-runnable
plan: 29
subsystem: client-ui
tags:
  - ui
  - scroll
  - flatten
  - book
  - bookDetail
  - equipbox
  - toolbox
  - hotkey
requires: []
provides:
  - 5 个列表型 UI 的 Scroll 直接子元素平铺
  - book / bookDetail 临界信息 0 值回退
  - bookDetail 特殊属性行按实测高度排版
  - hotkey 两栏平铺、commandRows 预计算、Selection 移除
  - uiContainerGate 源码形状闸门
affects:
  - src/client/ui
  - src/client/ui/__test__
tech-stack:
  added: []
  patterns:
    - VNode[] 作为 Scroll 的唯一 children
    - TextContent autoHeight + key 重挂载
    - 显示开关按 Scroll 内外分流
key-files:
  created:
    - src/client/ui/__test__/uiContainerGate.test.ts
  modified:
    - src/client/ui/book.tsx
    - src/client/ui/bookDetail.tsx
    - src/client/ui/equipbox.tsx
    - src/client/ui/toolbox.tsx
    - src/client/ui/hotkey.tsx
decisions:
  - bookDetail 的高度表按特殊属性 code 保留，TextContent 的 key 由 code + textTop + textHeight 组成
  - hotkey 选中态落在既有 g-rectr 的 strokeStyle / lineWidth 上，Selection 完全移除
  - toolbox 的未选择提示放在说明 Scroll 之前的根层，避免拦截 Scroll 内的指针事件
metrics:
  duration: "~12 min"
  completed: 2026-10-27
status: complete
actuals:
  tokens: 17871
  tasks: 4
  commits: 0
  plan_head_before: 9bf8f296c47a85f19c762072f9b73214fe329ee3
---

# Phase 09 Plan 29: 列表容器平铺与临界信息 0 值回退 Summary

把 5 个列表型 UI 的 `container` 嵌套拉平为 `Scroll` 直接子元素，补齐 `book` / `bookDetail` 缺失临界信息的 `0` 值显示，`bookDetail` 长描述按实测高度排版，`hotkey` 移除 `Selection` 改用既有 `g-rectr` 的边框表示选中。

## 逐文件结果

| 文件 | `container` | 平铺后的 `Scroll` 直接子元素 |
|------|-------------|------------------------------|
| `book.tsx` | 只剩根（1） | 每行 13 个：透明 `g-rect` 命中层 + `icon` + 名称 / 特殊属性 + 5 个基础数值 + 4 个临界数值，全部按 `y = i * ROW_HEIGHT` 绝对定位；除命中层外全部 `noevent` |
| `bookDetail.tsx` | 只剩根（1） | 每行 2 个：标题 `text` + 带 `autoHeight` / `onUpdateHeight` 的 `TextContent`；行位置由 `specialRows` 一次遍历累加 |
| `equipbox.tsx` | 只剩根（1） | 状态行每条 3 个（属性名 / 数值 / 增减值）；槽位每格 3 个（`g-rectr` + `icon` + 槽名）；拥有装备行每行 3 个（`g-rectr` + `icon` + 名称）；描述区 `Scroll` 只含一个 `TextContent` |
| `toolbox.tsx` | 只剩根（1） | 两列每行 4 个：`g-rectr` 命中层 + `icon` + 名称 `text` + 数量 `text`；说明 `Scroll` 只含一个 `TextContent` |
| `hotkey.tsx` | 只剩根（1，带 `nocache`） | 左栏每组 2 个（透明 `g-rectr` + 分组名 `text`）；右栏每条指令 1 个名称 `text` + 每个组合 2 个（`g-rectr` + 组合 `text`） |

删除数量：`equipbox` 3 个外层包装容器 + 3 类行容器；`hotkey` 6 个容器（内容总高容器 ×2、分组行、指令行、按键区、按键框）；`book` / `bookDetail` / `toolbox` 全部行容器。`book` / `bookDetail` / `equipbox` / `toolbox` 的根 `container` 评估后不加 `nocache`；`hotkey` 根按 `09-29-NOTES.md` §5 加 `nocache`。

## 行为变化（实际实现口径）

- **临界信息缺失显示 `0`**：`book` 的 `伤害` / `临界` / `减伤` / `1 防` 四项恒渲染，`critical` 为 null 时显示 `format(0)`，`1 防` 在 `critical` 或 `def1` 任一为 null 时显示 `format(0)`；`bookDetail` 的 `加攻` / `减伤` 同样恒渲染、缺失为 `0`。旧的条件渲染已消失。
- **显示开关按位置分流（共 9 处）**：`Scroll` 外 5 处使用 `hidden`（`equipbox` 未选择装备 / 装备名 / 装备孔 / 拖拽浮层，`toolbox` 未选择提示）；`Scroll` 直接子元素 4 处改用动态空文本 / `icon` 的 0 回退（`equipbox` 属性增减值、描述 `TextContent`、槽位图标；`toolbox` 描述 `TextContent`）。`hotkey` **没有显示开关**：选中态是既有 `g-rectr` 的边框状态，不挂载 / 不隐藏元素。
- **`bookDetail` 长描述不再重叠**：`TextContent` 用 `autoHeight` + `onUpdateHeight` 上报实测高度，按 `code` 记入 `textHeights`，`specialRows` 一次遍历给出每行 `labelTop` / `textTop` / `textHeight`；`TextContent` 的 `key` 由 `code` + `textTop` + `textHeight` 组成，行位置或实测高度变化时重挂载到新 `loc`；同值高度回调不写入，重挂载一次后收敛；首次测量前用 `SPECIAL_MIN_HEIGHT` 回退；`specials` 变化时只保留仍存在条目的高度。
- **`hotkey` 选中态改为边框**：完全移除 `Selection`（含 `@user/client-base` 的导入）；左栏分组行与右栏按键框各自由既有 `g-rectr` 的 `strokeStyle={isSelected ? 'gold' : 'transparent'}` / `lineWidth={isSelected ? 2 : 1}` 表示，无新增元素、无 `hidden`、无 `if (isSelected)` 条件挂载。
- **`hotkey` 去掉 O(n²)**：删除 `getCommandHeight` / `getCommandTop` / `getContentHeight`，新增 `ICommandRow`（`command` / `top`）与 `commandRows` 一次遍历预计算。
- **命中方式与内缩**：`book` 整行仍是透明命中层；`equipbox` 槽位 `g-rectr` 四周内缩 4px、拥有装备行上下各 2px（左右各 4px），槽位拖动起手仍只在 `icon` 上、整格负责悬停；`toolbox` 行左右各 4px / 上下各 2px；`hotkey` 按键框命中高度为 `KEY_BOX_HEIGHT - 4`。
- **`toolbox` 提示位置**：未选择提示移到说明 `Scroll` 之前（同一绝对坐标），被 `Scroll` 覆盖，不再拦截其指针事件；描述 `TextContent` 恒挂载 + 空文本回退。
- **列表末端可滚动范围略减**：`hotkey` 右栏约 16px（`COMMAND_GAP`）、`equipbox` 拥有装备区约 2px / 状态区约 4.5px、`toolbox` 约 2px，只影响末端空白。
- **注释**：`book.tsx` 两条行内 JSX 注释按 OI-5 原样迁移为 `// 数值列表区` / `// 临界信息区`（文本不变）；`getCritical` 上方的过期 TODO 按 OI-1 原样保留；未修改任何既有注释或 jsDoc。

## 门禁结果（实测）

| 门禁 | 命令 | 结果 |
|------|------|------|
| 基线 | Task 1 第一步写出 `09-29-BASELINE.json` | `head` `9bf8f296…`，`hashes` 5 条，`dirty` 18 条，`eslint` 0 条，`typecheck` 6 条（均为既存 `Type 'number' is not assignable to type 'AllNumbers \| keyof IdToNumber'`） |
| 源码闸门 | `pnpm exec vitest run src/client/ui/__test__/uiContainerGate.test.ts` | **9/9 通过**（Scroll 块内无 `container` / `hidden=`、5 文件各 1 个根 `container`、`hotkey` 无 `Selection` 且两处 `g-rectr` 各带边框、`book` / `bookDetail` 0 值回退、`bookDetail` 高度测量与 key、显示开关分流 + `noevent` 逐元素配对、`hotkey` 根 `nocache`、4 个 `loc` 常量带 `: ElementLocator`） |
| 既有闸门 | `hotkeySettingsGate.test.ts` | **12/12 通过**（`hotkey.tsx` 仍不含 `<g-rect`） |
| 既存失败 | `keyAdaptationGate.test.ts` | **15 个用例中 5 个失败，改动前即如此（同一次改动前运行同为 5 失败），属既存问题、不在本计划范围，本计划不修、也不声称全部既有闸门为绿** |
| eslint NEW | 6 个改动文件 vs 基线 | 无 NEW（基线 0 → 当前 0） |
| 类型 NEW | `pnpm check:type` 整仓，按 6 个改动文件过滤。归一化与基线逐字一致并保留 `src/` / `packages-user/` 前缀 | 无 NEW（基线 6 → 当前 6） |
| 受保护哈希 | 5 个文件：`scroll.tsx` / `textbox.tsx` / `settings.tsx` / `ui/index.ts` / `misc/hotkey.ts` | 与基线逐字相等 |
| HEAD 政策 | 与基线比较，允许 `.planning` 聚合提交 | HEAD 未变（`9bf8f296…`），满足 |
| 范围 | 整仓 `git status --porcelain -uall` 对照基线 `dirty` 快照 + 6 个允许路径 | 通过：24 条脏路径 = 18 条既存 + 6 个允许路径，无范围外写入 |

## 声明与遗留

- **未做浏览器 UAT**：滚动、内存、点击命中、拖拽手感均未验证，本摘要不宣称任何视觉 / 滚动 / 内存 / 拖拽行为已通过。
- **执行器 0 次代码提交**：未运行任何 git 写命令（`add` / `commit` / `stash` / `checkout` / `restore` / `worktree` / `reset`）；5 个 UI 文件与新增测试留在工作树供用户审查。3 个 `.planning` 产物可能由编排器按 `commit_docs: true` 聚合提交，不属于本计划的代码提交。
- **估算未校准**：计划 `estimate.confidence: low`；实际改动 5 个 UI 文件 + 1 个测试文件（约 71k 字符，按 chars/4 计约 17.9k tokens），仅作记录，不作为校准依据。
- **OI-1**：`book.tsx` `getCritical` 上方的过期 TODO（写着「留空」）按用户要求原样保留，与实际「缺失显示 0」不一致。
- **OI-3 / 既有实现**：`Scroll` 的 `padEnd`、`TextContent` 的 `props.hidden` 等系统层既有行为未动；`Scroll` 直接子元素上的 `hidden` 会被 `Scroll` 覆盖，因此只在 `Scroll` 外使用。
- **无新增依赖、未执行构建、未改按键注册与设置入口。**

## Deviations from Plan

1. **[Rule 3 - 实现细节] 测试辅助 `stripComments` 的 JSX 注释正则使用 `[ \t]*` 而非跨行空白**
   - **Found during:** Task 4 编写闸门测试
   - **Issue:** 若用 `/\{\s*\/\*[^]*?\*\/\s*\}/g`，组件体的 `{` 紧跟 jsDoc 注释时会被当作 JSX 注释起点，整段代码被吞掉（`book.tsx` 从约 9.8k 字符被削到约 2.2k，所有肯定断言假红）。
   - **Fix:** 改为 `/\{[ \t]*\/\*[^]*?\*\/[ \t]*\}/g`（JSX 注释与花括号必须在同一行），仍保持「先去 JSX 注释 → 再去块注释 → 再删行注释」的顺序。
   - **Files modified:** `src/client/ui/__test__/uiContainerGate.test.ts`
   - **Commit:** 无（按计划不提交代码）
2. 无其它偏离；计划要求的文件范围、命名、行为口径与门禁均按 Task 1–4 执行。

## Self-Check: PASSED

- 6 个代码 / 测试路径均存在并包含预期改动：`book.tsx`、`bookDetail.tsx`、`equipbox.tsx`、`toolbox.tsx`、`hotkey.tsx`、`__test__/uiContainerGate.test.ts`。
- `09-29-BASELINE.json` 只在改动前写出一次；`09-29-SUMMARY.md` 已写出。
- 所有自动化门禁均以非零退出即失败的方式实际运行并通过（见上表）。
- 未执行任何 git 写命令；HEAD 仍为 `9bf8f296c47a85f19c762072f9b73214fe329ee3`。
