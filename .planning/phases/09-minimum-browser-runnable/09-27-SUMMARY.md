---
phase: 09-minimum-browser-runnable
plan: 27
subsystem: ui-hotkey
tags: [hotkey, game-ui, component-split, barrel, source-gate, vitest]

requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-26 的源码形状闸门形态与「基线 + 执行前后真值比较」门禁写法

provides:
  - "InputBox / WaitBox / Background 三个 GameUI 组件按定义拆到 src/client/ui/{inputBox,waitBox,background}.tsx，原文件保留并被裁剪"
  - "client-base barrel 以既有 choices 同款相对路径再导出三个搬迁文件，waitbox / getInput / Background 的公共导入面保持不变"
  - "choices / save / settings / title / viewmap / inputBox 六处按键实现迁到新热键系统（useKey(system, clearImpl) + implement）"
  - "use/hotkey.ts 的进入作用域时机由 onMounted 改为 onBeforeMount"
  - "src/client/misc/hotkey.ts 修正 6 处重复 / 错误声明，并新增 @ui/input-confirm（分组 @ui/input，只绑 Enter）"
  - "新增源码形状闸门 src/client/ui/__test__/keyAdaptationGate.test.ts（15 条断言）"

affects: [按键投递接线（IHotkeySystem.listen）后续计划, Phase 10 文档]

actuals:
  tokens: 20904
  tasks: 5
  commits: 0

tech-stack:
  added: []
  patterns:
    - "GameUI 组件下沉到 src/client/ui，client-base barrel 用相对路径 export * 保持公共面"
    - "被 barrel 再导出的文件只从具体模块（相对路径）导入 client-base 依赖，避免直接回引根 barrel"
    - "新热键系统写法：useKey(props.state.hotkey.system[, clearImpl])! + key.implement('<id>', fn)"
    - "子作用域继承父级实现：<Choices freshScope={false} state={props.state!}> + useKey(props.state!.hotkey.system)!"
    - "声明层用 block: true 取代实现层的 willEmit 特判"

key-files:
  created:
    - src/client/ui/inputBox.tsx
    - src/client/ui/waitBox.tsx
    - src/client/ui/__test__/keyAdaptationGate.test.ts
    - .planning/phases/09-minimum-browser-runnable/09-27-BASELINE.json
    - .planning/phases/09-minimum-browser-runnable/09-27-SUMMARY.md
  modified:
    - packages-user/client-base/src/components/index.ts
    - packages-user/client-base/src/components/input.tsx
    - packages-user/client-base/src/components/misc.tsx
    - packages-user/client-base/src/use/hotkey.ts
    - src/client/ui/background.tsx
    - src/client/ui/choices.tsx
    - src/client/ui/save.tsx
    - src/client/ui/settings.tsx
    - src/client/ui/title.tsx
    - src/client/ui/viewmap.tsx
    - src/client/misc/hotkey.ts
  deleted: []

key-decisions:
  - "save 翻页方向采用用户已批准的新定义：prev = movePage(-1)、next = movePage(1)、十页 = ±10（相对旧实现方向相反）"
  - "十页翻页保持声明层的 Continuous/500「按住重复」（用户已批准）"
  - "inputBox 使用专用 @ui/input-confirm（只绑 Enter），不复用 @common/confirm，因此不覆盖 Space / KeyC"
  - "src/client/ui/waitBox.tsx 的 onResolve: (data: T) 在 strictFunctionTypes 下产生 TS2322，用户裁定为可接受的设计层类型错误，不加 @ts-expect-error、不改签名"
  - "settings.tsx 的 11 条既有诊断仅因消息文本变化（props 形状 / 泛型默认参数显示），用户批准按「同文件 + 同 TS 码 + 各码计数不变」视为非新增"
  - "按用户要求未运行任何 git 写命令，代码改动全部留在工作树供用户审查"
  - "不做浏览器 UAT，不宣称任何按键行为已验证；IHotkeySystem.listen 未接线属预期状态"

patterns-established:
  - "barrel 再导出跨目录文件时，被导出文件改用具体模块相对路径导入，避免 barrel↔文件直接环"
  - "settings 的 7 个 Choices 子作用域统一传 freshScope={false} + state={props.state!}，父级 @common/exit 得以保留"
  - "声明层同键冲突用 block: true 阻断，实现层不再写 willEmit 特判"

requirements-completed: []

coverage:
  - id: T1
    description: "三个 GameUI 组件按定义搬迁、旧文件裁剪、barrel 再导出、background.tsx 改用叶子常量"
    verification:
      - kind: unit
        ref: "keyAdaptationGate.test.ts#moves the input box family into src/client/ui/inputBox.tsx"
        status: pass
      - kind: unit
        ref: "keyAdaptationGate.test.ts#moves the wait box family into src/client/ui/waitBox.tsx"
        status: pass
      - kind: unit
        ref: "keyAdaptationGate.test.ts#adds the background component next to the main background"
        status: pass
    human_judgment: false
  - id: T2
    description: "六个界面文件迁到新热键系统并命中新命令 ID"
    verification:
      - kind: unit
        ref: "keyAdaptationGate.test.ts#maps all twelve save commands and keeps the page directions"
        status: pass
      - kind: unit
        ref: "keyAdaptationGate.test.ts#removes the old key api from all migrated ui files"
        status: pass
      - kind: unit
        ref: "keyAdaptationGate.test.ts#keeps the settings parent scope and leaves game key usage untouched"
        status: pass
    human_judgment: false
  - id: T3
    description: "声明层 6 处修正 + 新增 @ui/input-confirm"
    verification:
      - kind: unit
        ref: "keyAdaptationGate.test.ts#declares every command id exactly once"
        status: pass
      - kind: unit
        ref: "keyAdaptationGate.test.ts#blocks the exit command only for the view map book key"
        status: pass
      - kind: unit
        ref: "keyAdaptationGate.test.ts#binds input confirm to enter only and keeps common confirm"
        status: pass
    human_judgment: false

duration: 未精确记录
completed: 2026-10-25
status: partial
---

# Phase 9 Plan 27: 按键适配与 GameUI 组件拆分 Summary

把 `InputBox` / `WaitBox` / `Background` 三个 GameUI 组件从 `client-base` 按定义拆到 `src/client/ui`，六个界面的按键实现整体迁到新热键系统，并修正声明层的重复 / 错误 ID、新增只绑 Enter 的输入框确认指令。

## Accomplishments

- **组件搬迁（只搬定义，不搬整文件）**：`InputBox` / `InputBoxUI` / `getInput` / `getInputNumber` / `InputBoxProps` / `InputBoxEmits` → 新建 `src/client/ui/inputBox.tsx`；`WaitBox` / `WaitBoxUI` / `waitbox` / `WaitBoxProps` / `WaitBoxEmits` / `WaitBoxExpose` → 新建 `src/client/ui/waitBox.tsx`；`Background` / `BackgroundUI` / `BackgroundProps` → 追加进既有 `src/client/ui/background.tsx`（`MainBackground` / `MainBackgroundUI` 原样保留）。
- **旧文件裁剪**：`components/input.tsx` 只保留 `Input` 一族与 `routedInput*`，旧 `const [key] = useKey()` + `KeyCode.Enter` 特判整块移除；`components/misc.tsx` 只保留 `Progress` / `Arrow` / `ScrollText` / `Selection`，两族 GameUI 组件与失效导入（`logger` / `GameUI` / `IUIController` / `SetupContext` / `IGameUIPropsBase`）一并移除。
- **公共导入面不变**：`components/index.ts` 在既有 `choices` 行之后追加 `background` / `inputBox` / `waitBox` 三条相对路径 `export *`；`statistics.tsx` 与 `client-modules/src/render/utils/saves.ts` 一行未改。
- **barrel 图卫生**：`background.tsx` 的尺寸常量改从叶子模块 `@/client/uiConstant` 导入；`inputBox.tsx` / `waitBox.tsx` / `choices.tsx` 的 client-base 依赖全部走具体模块相对路径（文件中无 `from '@user/client-base'`）。
- **按键迁移**：6 个 UI 文件全部改为 `useKey(props.state.hotkey.system[, clearImpl])!` + `key.implement(...)`；`settings.tsx` 额外用 `props.state!` 与 `freshScope={false}` / `state={props.state!}` 让子作用域继承父级实现；`viewmap.tsx` 删除 `willEmit('book')` 特判并由声明层 `block: true` 取代。
- **作用域时机**：`packages-user/client-base/src/use/hotkey.ts` 的进入作用域回调由 `onMounted` 改为 `onBeforeMount`（离开仍 `onUnmounted`）。
- **声明修正（6 处 + 1 条新增）**：3 条重复的 `@ui/save-up` 拆成 `@ui/save-right` / `@ui/save-down` / `@ui/save-left`；两条十页 ID 改为 `@ui/save-page-prev-10` / `@ui/save-page-next-10`；`@ui/view-map-book` 加 `block: true`；新增分组 `@ui/input`（`输入框`）与其唯一命令 `@ui/input-confirm`（`输入框确认`，`defaults: [[KeyCode.Enter]]`，默认 `mode`）。`system.addCommand(` 由 62 增至 63。

## `settings.tsx` 的作用域继承

7 个子组件的按键都写成 `const key = useKey(props.state!.hotkey.system)!;` + `key.implement('@common/exit', …)`，局部 `scope` 变量与所有 `scope={scope}` 均已删除；7 处 `<Choices>` 同时传 `freshScope={false}` 与 `state={props.state!}`，因此子作用域以 `clearImpl = false` 进入，父级 `@common/exit` 不会被清空。`MainSettingsProps` 的 `extends Partial<ChoicesProps>, IUIPropsBase` 形态未改，VirtualKey 分支（`getVitualKeyOnce` + `gameKey.emitKey`）原样保留。

## 逐文件命令映射

| 文件 | 旧 ID | 新 ID |
|------|-------|-------|
| `choices.tsx` | `moveUp` / `moveDown` / `moveLeft` / `moveRight` / `confirm` | `@common/select-up` / `@common/select-down` / `@common/select-left` / `@common/select-right` / `@common/confirm` |
| `save.tsx` | `confirm` / `exit` / `save` / `load` | `@common/confirm` / `@common/exit` / `@ui/save` / `@ui/load` |
| `save.tsx` | `@save_up` / `@save_down` / `@save_left` / `@save_right` | `@ui/save-up` / `@ui/save-down` / `@ui/save-left` / `@ui/save-right` |
| `save.tsx` | `@save_pageUp` / `@save_pageDown` | `@ui/save-page-prev` / `@ui/save-page-next` |
| `save.tsx` | （无） | `@ui/save-page-prev-10` / `@ui/save-page-next-10` |
| `settings.tsx` | `exit`（7 处） | `@common/exit`（7 处） |
| `title.tsx` | `@start_up` / `@start_down` / `confirm` | `@ui/start-up` / `@ui/start-down` / `@common/confirm` |
| `viewmap.tsx` | `@viewMap_up` / `@viewMap_down` / `@viewMap_up_ten` / `@viewMap_down_ten` | `@ui/view-map-next` / `@ui/view-map-prev` / `@ui/view-map-next-10` / `@ui/view-map-prev-10` |
| `viewmap.tsx` | `@viewMap_book` / `@viewMap_fly` / `confirm` / `exit` | `@ui/view-map-book` / `@ui/view-map-fly` / `@common/confirm` / `@common/exit` |
| `inputBox.tsx` | （无） | `@ui/input-confirm`（只由 Enter 触发，blur 当前聚焦的 input / textarea） |

## 已批准的行为口径（用户已批准，作为事实记录）

1. **save 翻页方向（新定义）**：`@ui/save-page-prev` → `movePage(-1)`、`@ui/save-page-next` → `movePage(1)`、`@ui/save-page-prev-10` → `movePage(-10)`、`@ui/save-page-next-10` → `movePage(10)`。旧实现是 PageUp → `movePage(1)`、PageDown → `movePage(-1)`，方向相反；用户已批准采用新定义。
2. **十页按住重复**：`viewmap` / `save` 的十页命令在声明层是 `Continuous` / `interval: 500`，按住会连续跳十页（旧 `@viewMap_*_ten` 是单发）；用户已批准保持按住重复。
3. **输入框只认 Enter**：`inputBox` 使用专用 `@ui/input-confirm`（`defaults: [[KeyCode.Enter]]`），**不再**复用 `@common/confirm`，因此**不覆盖** Space / KeyC；`@common/confirm` 仍是 Enter / Space / KeyC 三键。

以上都只是声明层语义，**未经浏览器验证**。

## 搬迁时的两处类型注解（行为不变）

- `getInput` 的 `onConfirm: (value: string)`
- `waitbox` 的 `onResolve: (data: T)`

目的：让旧文件里既有的 `TS7006` 隐式 `any` 不随搬迁在新文件里重现。

## 按键投递未接线声明（预期状态）

`IHotkeySystem.listen` 目前没有任何生产代码调用，**按键不会真的送达 UI**。这是**已知且预期**的现状，**不在本计划范围**，本计划不把它列为待修问题，只做「实现层 ↔ 架构层」的接口对齐。因此本计划**不宣称任何浏览器 / 键盘行为已验证**，浏览器 UAT 全程跳过。

## Task Commits

**无。** 按用户要求未运行任何 git 写命令（`add` / `commit` / `stash` / `checkout` / `restore` / `worktree` / `reset`），代码改动全部留在工作树供用户审查。

## Verification

### 源码形状闸门（vitest）

`cmd /c "pnpm exec vitest run src/client/ui/__test__/keyAdaptationGate.test.ts"` → **15 / 15 passed**（1 个测试文件）。测试文件结构闸门：15 个 `it`、每个紧邻上方一行 `//` 注释、只导入 `vitest` 与 `?raw`、不使用 `node:fs` → PASS。

### eslint（基线相对，多重集只判 NEW）

`pnpm exec eslint -f json <改动文件集合>`：

- Task 1 子集：基线 11 → 当前 0，无 NEW。
- Task 2 子集（5 个 UI + `use/hotkey.ts`）：基线 11 → 当前 9，无 NEW。
- Task 3 子集（`src/client/misc/hotkey.ts`）：基线 11 → 当前 0，无 NEW。
- Task 5 全集合（16 个路径，含两个新文件与两个 barrel 消费方）：基线 11 → 当前 11，无 NEW；`status === 1` 仅因基线本身已含 severity-2 条目（`statistics.tsx` / `viewmap.tsx` 的既存 unused-vars），按计划口径接受。

### 类型闸门（基线相对）

`pnpm check:type`（`vue-tsc --noEmit`，整仓运行）→ `status === 2`，输出含可解析 `error TS` 行，属**预期状态**（全仓既有诊断），不判崩溃。

- 改动文件集合内基线 89 条 → 当前 81 条；仓库总诊断 229 → 221。
- 除下述两项已批准例外外，**没有新增诊断点**；`inputBox.tsx` / `waitBox.tsx` 中没有 `TS7006`。
- `statistics.tsx` 与 `saves.ts` 两个 barrel 消费方各自仍只有基线条目，未出现 NEW。

### 声明掩码比对

`git show 6846c21…:src/client/misc/hotkey.ts` 与当前文件：两侧先做 `\r\n` → `\n`、行尾空白、空行与首尾换行归一化，再整段剔除新增的 `@ui/input` 分组，最后掩掉 save 的 8 个 ID 与 1 个 `block: true`，**逐字相同**；声明扫描基于剔除注释后的文本。`system.addCommand(` 由基线 62 → 63；`block: true` 由 0 → 1；全部命令 ID 唯一。

### 范围闸门

`git status --porcelain -uall -- <白名单>`：代码侧恰为 14 条期望状态（11 个 ` M` + 3 个 `??`）；`src/client/ui/statistics.tsx` 与 `packages-user/client-modules/src/render/utils/saves.ts` **没有任何状态行**；三个 `09-27-*` 规划产物为未跟踪。PASS。

### 哈希 / 未提交闸门

- 基线 head：`6846c211c73854762c782e8cde82e81b0191c524`（`git merge-base --is-ancestor` 成立；`<基线 head>..HEAD` 提交清单：无）。
- `src/client/ui/toolbar.tsx`：`bcfec1e3e8c38848c91a2258db63f943dec4131f`
- `src/client/ui/index.ts`：`4e3950598b1beee23753a5556d8e8c82eb21bc57`
- `packages-user/client-base/src/components/textbox.tsx`：`b17e988d77c3a81fe3ce3250940e31a9774f8dfb`
- `packages-user/client-modules/src/render/use.ts`：`55b6aaa0cbb2e007313825da1b1e11104f71dd5a`
- `packages-user/client-modules/src/ui/types.ts`：`8a9288918be5a836d8c06c7ca44e0c9ccc03cf81`

五个哈希与基线逐字相等；基线 head 是当前 HEAD 的祖先；`<基线 head>..HEAD` 没有提交触碰任何白名单代码路径。**执行方未提交任何代码。**

## Accepted Exceptions（用户已批准的例外）

1. **`src/client/ui/waitBox.tsx` 的设计层类型错误（无抑制）**。`WaitBoxUI` 的泛型 emits 被擦除为 `WaitBoxEmits<unknown>`，因此 `controller.open` 期望 `onResolve?: (data: unknown) => any`，而计划要求保留显式参数注解 `onResolve: (data: T) => { … }`。在 `strict: true`（`strictFunctionTypes`）下二者不兼容。原文：

   ```
   src/client/ui/waitBox.tsx(181,13): error TS2322: Type '(data: T) => void' is not assignable to type '(data: unknown) => any'.
   ```

   用户裁定：这是**可接受的设计层类型错误**，保留 `(data: T)` 原样，**不添加** `@ts-expect-error`、不改成 `unknown`、不改 `GameUI`。Task 1 的 MOVED TYPECHECK 门禁与 Task 5 的类型门禁均只对这**一条**放行；其它任何 `inputBox.tsx` / `waitBox.tsx` 诊断仍会判失败。

2. **`src/client/ui/settings.tsx` 的消息文本变化（同文件 + 同 TS 码 + 各码计数不变）**。77 条诊断前后数量不变，按 TS 码分布也不变；仅消息文本因计划要求的改动而变化：

   - 7 条 `TS2322`：`<Choices>` 的 props 对象形状由 `… interval: number; scope: symbol; }` 变为 `… interval: number; freshScope: false; state: IClientBase; }`（`scope={scope}` → `freshScope={false}` + `state={props.state!}` 的必然结果）。
   - 4 条 `TS2345`：目标类型由 `IUIController<IGameUIPropsBase>` 显示为 `IUIController<IGameUIPropsBase<UIComponent>>`。原因是搬迁后的 `getInput` / `waitbox` 按计划从**正确**的 `packages-user/client-base/src/types` 导入 `IGameUIPropsBase`（该接口带默认泛型参数），旧文件从不可解析的 `client-modules/src/types` 取到的是未解析类型。
   - 用户裁定：这些是**消息文本层面**的变化，不是新增诊断点；类型门禁对 `settings.tsx` 采用「同文件 + 同 TS 码 + 各码计数不得增加」的判据。任何真正的新增诊断点或某码计数增加仍会判失败。

## Deviations / Issues

- **Task 0 第 ⑭ 条批准的两条既有注释已随被删代码一并移除**：`components/input.tsx` 的 `// 特判回车键`、`src/client/ui/viewmap.tsx` 的 `// 如果按键不能触发怪物手册，则关闭界面，因为怪物手册和退出默认使用同一个按键，需要特判`。除此之外未改写任何既有注释 / jsDoc。
- **`TS7006` 的两处消解**：`getInput` / `waitbox` 按计划补显式参数注解，旧文件中的两条隐式 `any` 不再出现在新文件里（新文件零诊断，唯 waitBox TS2322 例外）。
- **`viewmap.tsx` 的 `// .realize('@viewMap_reset', () => resetCamera())`** 一行按计划原样保留（闸门先剔除行注释，不参与判定）。
- 未发现其它需要修正的问题；未做全仓类型 / lint 归零，未跑构建。

## Known Limits / OI-2（只记录，不修复）

1. `IHotkeySystem.listen` 无生产调用、按键投递未接线——**预期状态**，不在本计划范围。
2. `src/client/ui/toolbar.tsx` 与 `settings.tsx` 的 VirtualKey 分支仍是 legacy `gameKey`。
3. 旧 `@user/client-modules` 的 `useKey` 变为无引用但保留。
4. `MainBackground` / `MainBackgroundUI` 随 `background.tsx` 的 `export *` 进入 `client-base` 公共面。
5. `src/client/ui/index.ts` 未加 `inputBox` / `waitBox` 导出；其中既有的 `export * from './background';` 会自动扩大该 barrel 的有效导出面（无害，未编辑该文件）。
6. 游戏当前不可运行，浏览器 UAT 全程跳过。
7. 三个被再导出的文件的**直接** barrel 回引已改为具体模块导入；`client-base` 内部既有的 `textbox → elements → map` 与 `types.ts → ./map` 回引链早于本计划存在，**不在本计划范围**，`pnpm check:circular` 未运行，**不得**表述为「循环已全部解决」。

## estimate 声明

`estimate.tokens = 120000`、`raw_tokens` 同为 120000、`tasks = 6`、`confidence: low`，为**未校准估算**。120k 约为 smart-zone 单计划预算的 1.2×；按 D-01 不得未经用户同意拆分，本计划未拆分、未砍范围、未跳过门禁。**用户已在 Task 0 的决策中批准接受该估算超额。**

## 未被触碰的文件

- `packages-user/client-base/src/map/renderer.ts` / `map/shader/map.frag` / `map/status.ts` / `map/types.ts` / `map/vertex.ts` / `map/__test__/rendererGate.test.ts`（09-26 留给用户的未提交改动）未触碰。
- `.planning/phases/10-docs-restructure/10-CONTEXT.md`（用户并发脏文件）未触碰。
- `src/client/ui/statistics.tsx`、`packages-user/client-modules/src/render/utils/saves.ts`、`src/client/ui/toolbar.tsx`、`src/client/ui/index.ts`、`packages-user/client-base/src/components/textbox.tsx`、`packages-user/client-modules/src/render/use.ts`、`packages-user/client-modules/src/ui/types.ts` 一行未改（五个受保护文件哈希见上）。

## Self-Check: PASSED

- `src/client/ui/inputBox.tsx` / `waitBox.tsx` / `__test__/keyAdaptationGate.test.ts` 均存在，PASSED
- `09-27-BASELINE.json` 恰含 `head` + 5 个完整路径哈希 + `eslint` / `typecheck` / `addCommandCount`，PASSED
- 源码闸门 15 / 15 passed；测试文件结构闸门 15 个 `it` 均有前置注释、仅 `vitest` / `?raw` 导入，PASSED
- eslint 全集合基线 11 → 11，无 NEW；`status === 1` 仅因基线已含 severity-2 条目，PASSED
- 类型闸门：基线 89 → 81，仓库 229 → 221；仅 waitBox TS2322（已批准）与 settings.tsx 消息文本变化（已批准），PASSED
- 范围闸门：代码侧恰 14 条期望状态，两个 barrel 消费方无状态行，三个规划产物未跟踪，PASSED
- 哈希闸门：基线 head 是 HEAD 祖先、`<基线 head>..HEAD` 未触碰白名单代码路径、5 个受保护文件哈希逐字相等，PASSED
- 全程未运行任何 git 写命令，代码改动全部留在工作树，PASSED
- 按用户要求未做浏览器 UAT、未宣称按键行为已验证，PASSED
