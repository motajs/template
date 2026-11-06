---
phase: 09-minimum-browser-runnable
plan: 34
status: complete
subsystem: client-base setting system + generic setting page
tags:
    - setting
    - client-base
    - ui
dependency_graph:
    requires:
        - packages-user/client-base/src/setting/types.ts (09-33 类型契约)
    provides:
        - SettingSystem
        - defineNumberSetting / defineBooleanSetting / defineRangeSetting / defineSubPageSetting
        - createNumberSettingControl / createBooleanSettingControl / createRangeSettingControl / createSubPageSettingControl
        - SettingPage / SettingPageUI
    affects: []
tech_stack:
    added: []
    patterns:
        - vue defineComponent + 闭包携带控件配置
        - vue shallowRef 承载设置项取值
key_files:
    created:
        - packages-user/client-base/src/setting/system.ts
        - packages-user/client-base/src/setting/factories.ts
        - packages-user/client-base/src/setting/controls.tsx
        - packages-user/client-base/src/setting/__test__/system.test.ts
        - src/client/ui/setting.tsx
        - src/client/ui/__test__/settingPageGate.test.ts
        - .planning/phases/09-minimum-browser-runnable/09-34-BASELINE.json
    modified:
        - packages-user/client-base/src/setting/types.ts
        - packages-user/client-base/src/setting/index.ts
commits: 0
decisions:
    - 控件用「创建函数 + 闭包」携带 step / min / max / page，不给 ISettingComponentProps 增加成员
    - 设置项取值用 vue shallowRef 承载，使页面预览与控件读取同一响应式源
    - 工厂的 control 成员使用 ReturnType<typeof createXxxSettingControl> 作为显式类型
    - 不开运行期工厂测试（controls.tsx 经 @motajs/render 在导入期需要 DOM）
---

# Phase 9 Plan 34: 设置系统、工厂、内置控件与通用设置界面 Summary

在 `client-base` 落地设置系统（`system.ts`）、四个设置项工厂（`factories.ts`）与四个内置控件（`controls.tsx`），并在 `src/client/ui/setting.tsx` 落地一个通用设置页面（`SettingPage` / `SettingPageUI`）。**不做任何接线**：不接渲染端主对象、不进设置菜单、不注册存档、不改入口。

## 系统 API（`SettingSystem implements ISettingSystem`）

- 成员：公开只读 `groups: Map<string, ISettingItemGroup>`（引用只读、原地增删）与私有 `private readonly settings: Map<string, ISettingItem>`。
- `setGroup(group, name, items)`：先把每个设置项按 id 登记进 `settings`，再整体替换分组；`items` 为空数组时只删除分组，已登记的设置项保留并变为未分组。
- `addSettingToGroup(group, item)`：分组不存在时直接返回（no-op，不登记）；存在时登记并追加，同一设置项重复加入不会产生重复项（以引用比较去重）。
- `getGroup` / `getSetting`：缺失返回 `null`。
- `iterateGroups()`：返回 `this.groups.entries()`。
- `getUngrouped()`：先收集所有分组内的设置项引用，再返回「已登记但不在任何分组」的设置项数组。
- `getValue<T>(id)`：缺失返回 `undefined`（`void 0`），否则转发设置项的 `getValue()`（唯一一处必要的 `as T`）。
- `setValue<T>(id, value)`：缺失直接返回，否则转发。
- `saveState(compression)`：遍历 `settings` 聚合为 `{ values: Map<string, unknown> }`，压缩级别原样透传给每个设置项。
- `loadState(state, compression)`：逐项转发；未登记的 id 直接跳过，**不新增任何日志码**（`logger.json` 未改）。

## 工厂 options

- `defineNumberSetting(options: ISettingNumberOptions)`：`id` / `name` / `description` / `defaultValue` / `min` / `max` / `step`，返回 `ISettingItem<number>`。
- `defineBooleanSetting(options: ISettingBooleanOptions)`：`id` / `name` / `description` / `defaultValue`，返回 `ISettingItem<boolean>`。
- `defineRangeSetting(options: ISettingRangeOptions)`：字段与数字项相同，返回 `ISettingItem<number>`。
- `defineSubPageSetting(options: ISettingSubPageOptions)`：`id` / `name` / `description` / `page: IGameUI` / 可选 `props`，返回 `ISettingItem<void>`；打开时把 `props ?? {}` 原样交给控制器。
- 数值项（数字 / 区间）在 `setValue` 内统一经 `clampSettingValue` 做区间收敛、步长对齐与浮点尾差消除，`loadState` 复用 `setValue`；布尔预览为「开」/「关」；子页面项无值（`getValue()` 返回 `void 0`）、保存 / 读取为空操作、预览为空串。
- 取值由 vue `shallowRef` 承载，使页面与控件的渲染期读取到同一个响应式源。

## 控件行为（`controls.tsx`）

- 控件只接收 `ISettingComponentProps`（`setting` + `controller`），在 [0,0] 为原点的固定 180×24 区域内绘制，不构造任何界面对象。
- `createNumberSettingControl(step)`：左减 / 右加按钮 + 中置当前值文本，每次按 `step` 增减，收敛交给设置项。
- `createBooleanSettingControl()`：整块开关按钮，显示「开」/「关」，点击取反。
- `createRangeSettingControl(min, max)`：轨道 + 已填充部分 + 滑块；`onDown` / `onMove` / `onUp` / `onLeave` 只接命名函数，按下与拖拽按指针横坐标线性映射到区间，步长对齐交给设置项，抬起或离开结束拖拽。
- `createSubPageSettingControl(page, vBind)`：可点击行（「打开」+「>」），点击执行 `controller.open(page, vBind)`，不读写设置项的值。
- `step` / `min` / `max` / `page` 通过创建函数的闭包携带，因此 `ISettingComponentProps` 只增加了 `controller`。

## 页面布局（`src/client/ui/setting.tsx`）

- props：`SettingPageProps extends IGameUIPropsBase`，唯一新增成员 `readonly system: ISettingSystem`。
- 左栏：`ListPage` 承载 `iterateGroups()` 的分组（第一项为分组 id、第二项为分组名）。
- 右栏：一条 `Scroll` 平铺当前分组的设置行；每行为 `item.name`、`TextContent` 描述（`autoHeight`）、`item.getPreviewString()` 预览，以及右侧固定控件区中的 `<Control setting={item} controller={props.controller} />`。
- 关闭：`@common/exit` 热键命令 + `ListPage` 内置关闭文本（`close` / `closeLoc` / `onClose`），界面不自行绘制关闭文本。
- 空系统：不渲染 `ListPage`，改渲染一个 `loc={CONTENT_SCROLL_LOC}` 的空 `Scroll` 占位，此时只有 `@common/exit` 可退出。
- 导出 `SettingPage` 与 `SettingPageUI = new GameUI('setting-page', SettingPage)`；组件返回固定为 `return () => renderPage();`。

## 界面 / 控件分工

- `client-base`：只放系统、工厂、内置控件与类型；`system.ts` / `factories.ts` / `controls.tsx` 均不出现 `new GameUI(`，允许 `IGameUI` 类型引用。
- `src/client/ui`：只放页面，不定义任何控件；界面层零持久化调用、零主对象设置字段。
- `SettingPageUI` 未进入 `src/client/ui/index.ts`，`src/client/ui/settings.tsx` 未出现 `SettingPage`；设置系统与界面**均未接线**（不接渲染端主对象、不进设置菜单、不注册存档）。
- 受保护的 10 个文件哈希与基线逐字一致，其中 `packages-user/client-base/src/index.ts` 的 `export * from './setting';` 仍在（执行在当前脏工作树内完成）。

## 真实门禁结果（全部直连二进制，未使用 pnpm）

`pnpm` 在本树不可用：`packages-user/client-modules/package.json` 引用了已删除的 `@motajs/legacy-ui`。未修任何 workspace / `package.json`，门禁全部直连二进制：

1. `node node_modules/vitest/vitest.mjs run packages-user/client-base/src/setting/__test__/system.test.ts` → 13 passed / 13（DOM-free，未导入 factories / controls）。
2. `node node_modules/vitest/vitest.mjs run src/client/ui/__test__/settingPageGate.test.ts src/client/ui/__test__/hotkeySettingsGate.test.ts` → 2 files passed，24 passed / 24（新增闸门 12、既有 hotkeySettingsGate 12）。只跑了这两个文件，未跑整个目录，也未宣称既有闸门全部通过。
3. `node node_modules/eslint/bin/eslint.js packages-user/client-base/src/setting src/client/ui/setting.tsx src/client/ui/__test__/settingPageGate.test.ts` → 退出码 0（Task 1 / Task 2 各自的 eslint 也均退出码 0）。
4. `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit` → 6 个改动源码文件内 NEW 诊断为 **0**，整仓诊断总数 **202**（与基线 `typecheckTotal` 202 持平）；基线 `typecheck` 数组为空，scope 内诊断数 0。
5. 受保护文件：10 个哈希与 `09-34-BASELINE.json` 逐字相等；HEAD 与基线相同（`102963401afe8c8321167b2093bc9e15c8446922`），未产生任何代码提交。
6. 范围闸门：8 个目标路径全部出现在脏文件列表；整仓 25 条脏路径中 17 条为基线既有，其余为目标路径，无范围外写入。
7. 摘要闸门：本文件写完后运行，见下文。

### 既有失败（范围外，仅记录，不作门禁）

- `keyAdaptationGate.test.ts`：现场单独采集为 **6 failed / 9 passed / 15 total**（计划写作时预期 5/15；基线以现场采集为准记录为 6/15）。该文件不在 `files_modified` 中，工作树里本来就是坏的，属既有 / 范围外，未修、未纳入门禁。
- `uiContainerGate.test.ts`：**7 failed / 11 passed / 18 total**（与计划的 7/18 一致）。该文件同样不在 `files_modified` 中，属既有 / 范围外，未修、未纳入门禁。
- 证据：`09-34-BASELINE.json` 的 `keyAdaptation` / `uiContainer` 信息字段记录的是写代码之前的现场数字。

## 工厂测试取舍

未创建 `factories.test.ts`：`factories.ts` 静态导入 `controls.tsx`，`controls.tsx` 静态导入 `@motajs/render`，导入期即需要 DOM，因此在 node 环境无法 `import '../factories'`。未新增 jsdom / DOM mock，也未改模块导入结构；四个工厂的 options、`clampSettingValue` 的收敛与对齐、布尔「开 / 关」预览、子页面空串预览改由 `settingPageGate.test.ts` 的 `?raw` 源码形状断言覆盖。

## 偏差与实现说明

1. **控件成员类型走计划允许的回退方案**：`ISettingComponentProps<number>` 作为 `control` 成员类型时产生 3 条 NEW 诊断（`DefineSetupFnComponent` 的实例类型在 `unknown` / `number` 之间不可赋值）。按计划改用 `ReturnType<typeof createNumberSettingControl>` 等作为成员类型，并仅把 `getSettingComponent()` 的返回标注为 `DefineSetupFnComponent<ISettingComponentProps>`；未使用 `as`，未改接口。修正后 scope 内 NEW 诊断为 0。
2. **组件内部注释使用 `//` 而非块注释**：计划自带的 `stripComments` 形状闸门会把「`{` + 空白 + `/*`」起的整段吞到下一个「`*/}`」，若在组件体或 `SettingPageProps` 成员处使用块注释，会把真实代码一起从闸门输入中抹掉。为让形状闸门断言的是真实代码，组件内部与 `SettingPageProps.system` 的说明改用单行注释；模块级常量 / 导出函数 / 主要导出的中文 jsDoc 保留。
3. **控件 props 声明在调用处内联**：按计划写成 `{ props: ['setting', 'controller'] } satisfies SetupComponentOptions<ISettingComponentProps>`，未引入额外命名。
4. **`keyAdaptationGate` 实际为 6/15**（计划预期 5/15）：属既有失败，仅记录实际值。

## 范围告警

本计划共 11 个路径 / 估算 80k（原 12 / 90k），高于推荐规模。**范围告警已接受**，不拆分（OI-5：四层是同一纵向切片，拆分会造成 `types.ts` / `factories.ts` / `controls.tsx` 的同文件跨计划依赖）。

## 声明

- 估算未校准：`confidence: low`。
- **未做浏览器 UAT**，不宣称任何界面 / 控件的浏览器行为已验证。
- 设置系统与界面均未接线（不进渲染端主对象、不进设置菜单、不注册存档）。
- 执行器 **0 次代码提交**：未运行任何 git 写命令，代码改动留在工作树；`.planning` 产物可能由编排器聚合提交，不属本计划的代码提交。

## 实际使用的门禁命令原文

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit`
- `node node_modules/eslint/bin/eslint.js packages-user/client-base/src/setting/types.ts packages-user/client-base/src/setting/system.ts packages-user/client-base/src/setting/factories.ts packages-user/client-base/src/setting/controls.tsx packages-user/client-base/src/setting/index.ts src/client/ui/setting.tsx`
- `node node_modules/eslint/bin/eslint.js packages-user/client-base/src/setting src/client/ui/setting.tsx src/client/ui/__test__/settingPageGate.test.ts`
- `node node_modules/vitest/vitest.mjs run packages-user/client-base/src/setting/__test__/system.test.ts`
- `node node_modules/vitest/vitest.mjs run src/client/ui/__test__/settingPageGate.test.ts src/client/ui/__test__/hotkeySettingsGate.test.ts`

## Self-Check: PASSED

- 已创建：`setting/system.ts`、`setting/factories.ts`、`setting/controls.tsx`、`setting/__test__/system.test.ts`、`src/client/ui/setting.tsx`、`src/client/ui/__test__/settingPageGate.test.ts`、`09-34-BASELINE.json`、本摘要。
- 已修改：`setting/types.ts`（只做加法）、`setting/index.ts`（4 行桶导出）。
- 未创建 `factories.test.ts`；未提交任何代码（HEAD 与基线相同）。
