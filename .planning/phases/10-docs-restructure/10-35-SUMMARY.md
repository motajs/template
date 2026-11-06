---
phase: 10-docs-restructure
plan: 35
subsystem: docs
tags: [vitepress, markdown, advanced-iii, replay, binary-format, sandbox]

requires:
    - phase: 10-docs-restructure
      provides: 10-34 已完成 docs/advanced/iii/loading-system.md，III 目录存在且侧边栏仍为空
provides:
    - docs/advanced/iii/replay-internals.md：录像的存储格式、录制与沙箱播放模型、存档形状，以及旧引擎文本录像对比
affects: [10-39 侧边栏注册与互链, 10-40 读者审阅]

actuals:
    tokens: 4163
    tasks: 3
    commits: 2
    plan_head_before: 5dc713434f23e9ee65daf7bd3fe5b33dbea847db

tech-stack:
    added: []
    patterns:
        - 系统类页面先讲模型再讲接口（D-82）：ReplaySystem 由数组、指令注册表与可选沙箱组成
        - 使用与原理分段（D-77）：录制与沙箱播放属于可用接口，内部实现后置（D-69）
        - 边界与特殊情况统一放文末「边界与注意」（D-61）
        - 代码块给完整类上下文并带解释性注释（D-62 / D-65 / D-70）
        - 旧引擎只在独立「旧引擎基线对比」小节出现并显式标注，避免被当成当前接口

key-files:
    created:
        - docs/advanced/iii/replay-internals.md
        - .planning/phases/10-docs-restructure/10-35-SUMMARY.md
    modified: []

key-decisions:
    - Task 0 的汇报关卡已由用户预批准满足：用户明确表示「这些都是文档编写工作，不涉及代码本身，直接批准执行 10-33 至 10-37」，本计划据此继续，未再单独等待「可以执行」
    - finalize 统一写成「指令切换或录像结束时触发」，并明确同一指令连续多步之间不会逐步触发
    - 存档小节写清四个字段，并说明 saveState 返回内部缓冲区引用、loadState 重建索引并使旧读流失效
    - 旧引擎内容只出现在对比小节，先声明「仅作对比基线，不是当前接口」，再给 7 行表格与 5 条优势
    - 自定义指令只链接 ../ii/custom-replay-command.md，不重讲；数组级编辑只作边界说明，不写成推荐用法
    - 未在 docs/.vitepress/config.ts 注册本页，也未链接尚不存在的 III 页面；留给 10-39
    - 执行前仓库存在未完成的合并，10-34-SUMMARY.md 冲突阻塞提交；按 Rule 3 保留本地较新版本并完成合并，已记入 Deviations

patterns-established:
    - 高级 III 原理页的结构：系统模型 → 关键操作（录制 / 播放）→ 存档 → 内部实现 → 对比基线 → 边界
    - 内部实现章节以「此章节讲解一下 XXX 的内部实现」开头，只讲模型与类型表，不写偏移算式与逐字节布局

requirements-completed: []

coverage:
    - id: D1
      description: ReplaySystem / ReplayArray / ReplaySandbox / IReplayCommand 模型、录制一步、主动与被动、三态结果与 finalize 时机写清
      verification:
          - kind: other
            ref: '10-35-PLAN.md Task 1 自动门禁 PAGE-OK；人工对照 packages-user/data-common/src/replay/{types,system,sandbox}.ts'
            status: pass
      human_judgment: false
    - id: D2
      description: 沙箱播放、存档四字段、指令区 / 参数区 / 索引区、参数类型表、索引与读流语义齐备
      verification:
          - kind: other
            ref: '10-35-PLAN.md Task 1 自动门禁 PAGE-OK；构建产物 h1=1、table=6、language-ts=2、language-text=1'
            status: pass
      human_judgment: false
    - id: D3
      description: 旧引擎只在对比小节出现，prettier --check 通过，构建 build complete 且无 dead link
      verification:
          - kind: other
            ref: 'prettier --check 通过；cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build" 输出 build complete in 19.89s，无 dead link'
            status: pass
      human_judgment: false

duration: 约 10 分钟
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 35: 录像系统底层原理页 Summary

**写出高级 III 的《录像系统底层》：先讲 `ReplaySystem` = 二进制数组 + 指令注册表 + 可选沙箱，再讲录制一步与沙箱播放，随后落到存档四字段与指令区 / 参数区 / 索引区，最后用独立小节对比旧引擎文本录像并收口边界。**

## Performance

- **Duration:** 约 10 分钟
- **Completed:** 2026-10-26
- **Tasks:** 3/3（Task 0 由用户预批准满足；Task 1 / Task 2 已执行）
- **Files created:** 2（页面 + 本 SUMMARY）

## Accomplishments

- 新建 `docs/advanced/iii/replay-internals.md`，单 H1《录像系统底层》，219 行。
- 主体结构为：`系统模型` → `录制一步` → `沙箱播放` → `存档形状` → `内部实现：三块缓冲区` → `内部实现：索引与读流` → `旧引擎基线对比` → `边界与注意`。
- 系统模型讲清 `ReplaySystem` 持有 `ReplayArray`、指令注册表与可选沙箱；录制把一步追加进数组，播放用读取流顺序取步，存档只存数组与长度、宽度。
- 录制小节讲清 `record(code, ...params)` 的参数范围、主动（`Active`）与被动（`Passive`）的分工、三态结果（`Success` / `Failed` / `Ignored`），并把 `finalize` 写成「指令切换或录像结束时触发」，明确同一指令连续多步之间不会逐步触发。
- 沙箱小节讲清创建前先 `reseter.reset(save)`、主动步直接执行、被动步由外部取参数并 `next` 回报、播放控制与 `getReplayed()` 不含当前步；给出完整类示例演示接管被动步。
- 存档小节给出 `length` / `commandWidth` / `commandArray` / `paramArray` 四字段，说明返回内部引用不要就地修改，读档会重建索引并使旧读流失效。
- 内部实现以「此章节讲解一下录像二进制格式的内部实现」开头，用指令区 / 参数区 / 索引区三块缓冲区解释存储，并给出参数类型表（布尔、各宽度整数、浮点、大整数、字符串与短字符串）。
- 旧引擎对比先声明「仅作对比基线，不是当前接口」，再给 7 行对比表与 5 条优势（紧凑、类型保真、可随机访问、可编辑、不依赖地图编号）。

## Fact Verification

正文事实按当前源码复核，research 的行号未直接搬入页面：

- `packages-user/data-common/src/replay/types.ts`：`ReplayCode`、`ReplayCommandType.Active` / `Passive`、`ReplayCommandResult`、`ReplayParamValue`、`IReplayCommand.finalize`、`IReplaySystemSave` 四字段、`ReplayCommandWidth.Uint8` / `Uint16`、`IReplayReadStream` 的 `expired`。
- `packages-user/data-common/src/replay/array.ts`：`ReplayArray` 的指令固定宽度（8 位 2 字节 / 16 位 3 字节）、参数类型码 0–9 与 32–255、参数个数超过 255 截断、无法编码的参数被丢弃、bigint 幅值小于 2^2040、扩容乘数与上限、`Uint32Array` 索引、写操作使读流过期、`get` 较慢、编辑为线性搬移、`saveState` 返回内部引用、`setReplayArray` 重建索引并使读流过期。
- `packages-user/data-common/src/replay/system.ts`：`ReplaySystem` 持有数组、指令表与沙箱；`record` 追加并触发钩子；`createReplaySandbox` 先重置状态；`saveState` 返回四字段。
- `packages-user/data-common/src/replay/sandbox.ts`：读取流从 `startIndex` 创建；主动步 `execute`；被动步经 `getPassive()` 取参数、`next(status)` 推进；`finalize` 在指令切换或录像结束时触发；`play` / `pause` / `resume` / `stop` / `step` / `setSpeed` 与 `getReplayed()` 语义。
- `src/data/replay/commands.ts`、`initialize.ts`：移动指令的 `finalize` 用法与内置指令注册，佐证连续步骤的收尾时机。
- 旧引擎对比仅取证于 `public/libs/control.js` 的 `core.status.route` 文本数组与播放控制，以及 `public/libs/utils.js` 的 `encodeRoute` / `decodeRoute`（文本记号、LZString Base64、`!!` 不压缩、物品 id ↔ 地图内容编号），只出现在对比小节。
- 未发现需要按 D-72 改写的注释 / 实现冲突；对话中报告的两点措辞疑点未写入正文。

## Param Type Table Coverage

参数类型表覆盖：`0` 布尔、`1` int8、`2` int16、`3` int32、`4` 非负 int64、`5` 负 int64、`6` 浮点、`7` 非负 bigint、`8` 负 bigint、`9` 长字符串、`32–255` 短字符串。每行只描述载荷形态，不写偏移算式与逐字节布局。

## Old Engine Labeling

- 对比小节开头固定写明：「以下为旧引擎的文本录像，仅作对比基线，不是当前接口。」
- `core.status.route`、`getNumberById`、`blocksInfo` 等旧写法全部位于该小节标题之后；正文其它位置不出现旧引擎接口。
- 对比表 7 行：容器、单步表示、序列化、随机访问、参数类型、编辑、物品标识；随后 5 条优势对应 T-10-103 的缓解。

## Deliberately Not Written

- 指令目录全量、`ReplayCode` 每个值的逐条解释。
- 旧引擎的 route folding 机制。
- `compile.ts` 与解释器细节。
- 数组级编辑（插入 / 删除 / 改写）的推荐用法；只在文末边界说明其线性成本。
- 编辑器、`.jsonc` 内容配置与序列化事件注册。
- 源码行号、源码叙述、「模板」与「[需改]」标记（D-80 / D-83）。
- 侧边栏注册与指向尚不存在 III 页面的链接。

## Gates

- `node node_modules/prettier/bin/prettier.cjs --check docs/advanced/iii/replay-internals.md`：通过（All matched files use Prettier code style）。
- 结构门禁：CRLF（219 个 CRLF、0 个裸 LF）、单 H1、八个主体小节齐备、内部实现后置且以规定句式开头、文末「边界与注意」。
- 误导门禁：`core.status.route` 只出现在对比小节之后；旧引擎只在该小节出现；自定义指令只外链 `../ii/custom-replay-command.md`。
- 链接门禁：相对 `.md` 目标全部存在，含 `../ii/custom-replay-command.md` 与 `../i/replay-consistency.md`。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`，退出码 0，输出 `build complete in 19.89s`，无 `dead link`。
- 渲染抽查：`public/_docs/advanced/iii/replay-internals.html` 中 H1 = 1、表格 = 6、TS 代码块 = 2、text 代码块 = 1，参数类型表正常渲染。

## Handoff to 10-39

- 本页尚未注册进 `docs/.vitepress/config.ts` 的「高级 III · 原理与架构」分组（`items: []`），也未链接尚未存在的 III 导览或其它 III 页面。
- 10-39 需要：注册本页到侧边栏、替换 `docs/advanced/index.md` 与 `docs/advanced/ii/index.md` 中「高级 III 尚未编写」的占位，并在 III 导览中把本页列入阅读路径。
- 可顺手替换两处既有占位：`docs/advanced/ii/custom-replay-command.md` 的 `高级 III · 录像格式与指令码位宽`，以及 `docs/advanced/i/replay-consistency.md` 的 `高级 III · 录像深层原理`，改为指向本页。

## Deviations from Plan

**1. [Rule 3 - Blocking] 预存在的合并阻塞提交**

- **Found during:** Task 1 提交前
- **Issue:** 仓库已处于合并中，`.planning/phases/10-docs-restructure/10-34-SUMMARY.md` 为 `both added` 冲突，任何提交都被拒绝。冲突内容仅为同一份 10-34 SUMMARY 的 token 数与构建耗时差异（3830 / 19.28s 对 3829 / 19.32s）。
- **Fix:** 保留本地较新版本（3830 / 19.28s），移除冲突标记并完成合并。
- **Commit:** `5dc7134`（合并提交；不计入本计划 2 个任务提交）
- **Scope:** 仅处理该冲突文件；未触碰 `packages-user/client-base/*` 等无关工作区改动。

## Issues Encountered

- 工作区存在与本计划无关的既有改动（`packages-user/client-base/*`、`.planning/phases/09-*`、`packages-user/client-base/src/map/__test__/`），所有提交均只暂存本计划文件。
- 页面提交后发现一处「步」字误写成日文汉字「歩」，修正后并入 Task 2 提交。

## Self-Check: PASSED

- 文件存在：`docs/advanced/iii/replay-internals.md`、`.planning/phases/10-docs-restructure/10-35-SUMMARY.md`
- 提交存在：`fddeeaa`（Task 1）、本 SUMMARY 的 Task 2 提交
- 门禁存在：prettier `--check` 通过、`build complete in 19.89s`、无 dead link、`PAGE-OK`
