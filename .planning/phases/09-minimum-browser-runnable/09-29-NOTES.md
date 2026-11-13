# 09-29 待规划记录：UI 容器 / Scroll / 缓存优化

**状态**：待规划，尚未修改任何源码。
**记录日期**：2026-10-26
**来源**：用户对 09-28 `hotkey.tsx` 及 `book` / `bookDetail` / `equipbox` / `toolbox` 的复查意见。
**参考文档**：`docs/guide/ui/perf.md`（已删除，可从 `e3d61ee^:docs/guide/ui/perf.md` 取回）。

## 核心原则

- `container` 在本渲染系统中会创建 canvas 缓存层，不是 HTML 的普通 `div`；嵌套越深，缓存与内存压力越大。
- `Scroll` 内部应直接平铺 `text` / `Selection` / `icon` / `g-rect*` 等元素；不要再套一层大 `container`，否则 `Scroll` 只能看到单个子元素，虚拟滚动失效。
- `Scroll` 自身已经包含 `container`，不要在 `Scroll` 外面再套 `container`。
- `Selection`、`text` 不需要单独容器；能直接写的就直写。
- 必须使用 `container` 且内容较少时，加 `nocache` 禁用内部缓存。
- 需要条件显示/隐藏时优先使用 `hidden` 属性，不要用 `{cond && <...>}` 之类的条件渲染。
- `loc` 过长导致换行时，先在顶层声明为常量，再在 JSX 中引用，避免缩进层级过深。

## 具体待办

### 1. `book.tsx`

- 「临界」「伤害」「减伤」「1 防」等信息即使没有 `critical` 也必须显示，缺失值显示 `0`，不能整项隐藏。
- `Scroll` 当前直接子元素是每行 `container`，虚拟滚动正常；但行容器约 11 个子元素，默认建缓存。评估改为直接平铺，或至少加 `nocache`。
- 全屏根 `container` 是否加 `nocache` 一并评估。

### 2. `bookDetail.tsx`

- 删除特殊属性列表每行的 `container`，把 `text` / `TextContent` 直接作为 `Scroll` 子元素，按行高定位。
- `TextContent` 当前未获取实际高度，长描述会重叠；必须通过其高度回调/`autoHeight` 获取高度，并据此计算每行高度与后续行 `loc`，必要时让 `Scroll` 内容高度随之更新。
- 「临界」「加攻」「减伤」等信息即使没有 `critical` 也必须显示，缺失值显示 `0`。
- 全屏根 `container` 是否加 `nocache` 一并评估。

### 3. `equipbox.tsx`

- 减少 `container` 嵌套：
  - 描述区、装备槽区、拥有装备区外的 `container` 与内部 `Scroll` 重复定位，移除多余外层。
  - 每行槽位 / 拥有装备 / 状态行的容器按内容量处理：能平铺则平铺，否则加 `nocache`。
- 条件显示改为 `hidden`，不要用条件渲染。
- 全屏根 `container` 是否加 `nocache` 一并评估。

### 4. `toolbox.tsx`

- 两列列表的每行 `container` 内容较少，评估直接平铺或加 `nocache`。
- 条件显示改为 `hidden`。
- 全屏根 `container` 是否加 `nocache` 一并评估。

### 5. `hotkey.tsx`

- P0：两个 `Scroll` 内全部平铺，删除「内容总高容器」「指令行容器」「按键区容器」「按键框容器」。
- 左栏直接写分组 `text` + 选中 `Selection`；右栏直接写指令名称 `text` + 每个组合的 `g-rectr` 点击区 + `Selection` + `text`。
- 根 `container` 加 `nocache`。
- 用一次遍历预计算行/键位 `top`，删除 O(n²) 的 `getCommandTop()`。
- 保持无入口、无持久化、无冲突检测、无恢复默认、无滚动条外容器。

### 6. `inputBox.tsx` / `waitBox.tsx`

- 各有 1 层根 `container`，内容较少；评估加 `nocache`。

## 其他全局检查

- 检查所有被本阶段触达的 UI，`: 条件渲染`是否应改为 `hidden`。
- 检查所有 `Scroll` 是否有多余外层 `container`。
- 检查所有长 `loc` 是否应提取为常量。
- 不修改既有注释/jsDoc；新增注释遵循 dev.md。

## 验证预期

- eslint。
- `pnpm check:type` 前后基线，只判新增诊断。
- 源码闸门（`?raw`）断言：`Scroll` 内无包裹容器、`hidden` 使用、`nocache`、`loc` 常量、`book`/`bookDetail` 的 0 值显示。
- 不做浏览器 UAT，不提交代码；视觉/滚动/内存表现留给用户人工确认。

## 明确不做

- 不接入口。
- 不做持久化。
- 不做冲突检测 / 恢复默认。
- 不改按键注册表。
