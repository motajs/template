---
phase: 09-minimum-browser-runnable
plan: 33
subsystem: client-base-setting
tags: [typescript, type-declarations, setting-system, client-base]

# Dependency graph
requires: []
provides:
  - "packages-user/client-base/src/setting/types.ts：6 个导出 interface，作为后续设置系统实现 / 工厂 / UI / 存档注册的类型契约"
affects: [client-base, setting-system, setting-ui, save-registration]

# Actuals（未校准估算配对；tokens 为 types.ts 实际字符数 / 4）
actuals:
  tokens: 581
  tasks: 2
  commits: 0

tech-stack:
  added: []
  patterns:
    - "设置项契约：ISettingItem<T> 承载设置语义，存档 / 读取完全继承 ISaveableContent<T>"
    - "分组单向归属：分组 id 只存在于 ISettingSystem.groups 的键上，设置项不带分组字段"

key-files:
  created: []
  modified:
    - packages-user/client-base/src/setting/types.ts

key-decisions:
  - "设置项不带分组字段：分组归属只在 ISettingSystem.groups 与 ISettingItemGroup.items 中表达"
  - "不提供未分组枚举方法：设置项只能经分组进入系统，没有游离设置项状态"
  - "ISettingSubPageItem 使用 ISettingItem<void> + readonly page: IGameUI，void 表示无自身存档值"
  - "ISettingSystemSave 使用 ReadonlyMap<string, unknown>，与热键存档同风格"
  - "两处存档 / 读取方法继承自 ISaveableContent，不重复声明"

requirements-completed: []

# Metrics
duration: 1 session
completed: 2026-10-29
status: complete
---

# Phase 9 Plan 33: setting/types.ts 类型契约 Summary

**把 `setting/types.ts` 的 3 行空壳替换为 6 个导出 interface 的纯类型声明，为后续设置系统实现钉死数据契约。**

## Performance

- **Duration:** 1 session
- **Tasks:** 2（Task 0 为汇报关卡，不计入）
- **Files modified:** 1（`packages-user/client-base/src/setting/types.ts`）
- **Baseline HEAD:** `f5f83229851c910b05db33834d7e0f65d7b5120b`

## Accomplishments

- 落点文件 `packages-user/client-base/src/setting/types.ts` 由 3 行空壳整文件替换为 6 个导出 interface。
- 旧的两个空 interface 已按用户批准删除（该文件原本无任何注释，不涉及修改既有注释）。
- 仅类型声明，零实现：没有类、函数体、常量、工厂、UI、存档注册或 `IClientBase` 接线。
- 全部门禁通过（eslint / 类型 NEW-only / 形状 / 受保护哈希 / HEAD / 范围）。

## 六个 interface 的最终形状

1. `ISettingItem<T = unknown> extends ISaveableContent<T>`
   - `readonly id: string`
   - `readonly name: string`
   - `readonly description: string`
   - `getValue(): T`
   - `setValue(value: T): void`
   - `getPreviewString(): string`
   - `getSettingComponent(): UIComponent`
2. `ISettingSubPageItem extends ISettingItem<void>`
   - `readonly page: IGameUI`
3. `ISettingItemGroup`
   - `readonly name: string`
   - `readonly items: readonly ISettingItem[]`
4. `ISettingSystemSave`
   - `readonly values: ReadonlyMap<string, unknown>`
5. `ISettingSystem extends ISaveableContent<ISettingSystemSave>`
   - `readonly groups: ReadonlyMap<string, ISettingItemGroup>`
   - `setGroup(group: string, name: string, items: ISettingItem[]): void`
   - `addItemToGroup(group: string, item: ISettingItem): void`
   - `getGroup(group: string): ISettingItemGroup | null`
   - `getItem(id: string): ISettingItem | null`
   - `iterateGroups(): Iterable<[id: string, group: ISettingItemGroup]>`
   - `getValue<T>(id: string): T | null`
   - `setValue<T>(id: string, value: T): void`
6. `ISettingComponentProps<T = unknown>`
   - `readonly setting: ISettingItem<T>`

`ISettingItem` 与 `ISettingSystem` 的存档 / 读取方法（`saveState` / `loadState`）来自 `ISaveableContent<T>` 的继承，本文件没有重复声明，避免与 `@user/data-common` 源头签名漂移。

## 设计取舍

- **设置项不带分组字段。** 分组归属只存在于 `ISettingSystem.groups` 与 `ISettingItemGroup.items`；不做「项上记 group」的双写，避免换组时两处不一致。`ISettingItemGroup` 只承载 `name` 与 `items`，分组 id 仅是 `groups` 的键。
- **不提供未分组枚举方法。** 本文件不声明 `getUngrouped`。热键系统存在未分组指令，因此 `IClientHotkey` 有该方法；设置项只能通过分组进入系统，不存在「游离设置项」状态。
- **`ISettingSubPageItem` 使用 `ISettingItem<void>`。** `void` 表示子页面项没有自身的存档值，`saveState` / `loadState` 在类型层即为空操作；`page: IGameUI` 只描述进入哪个子页面。本计划不实现打开逻辑，属纯类型表达。
- **`ISettingSystemSave` 使用 `ReadonlyMap<string, unknown>`。** 键为设置项 id，与热键存档（`ReadonlyMap`）同风格。

## 导入口径与 jsDoc 口径

- 导入恰为 2 行普通导入，位于文件最前、中间无空行无注释、无第三行导入、无仅类型导入：
  - `import { ISaveableContent } from '@user/data-common';`
  - `import { IGameUI, UIComponent } from '@motajs/system';`
- 逐成员中文 jsDoc：方法使用换行风格（可带 `@param`），短成员使用单行风格；方法之间空一行，字段之间不空行；不写 interface 本身的 jsDoc；不写任何非 jsDoc 注释。
- 文件为整文件替换：旧的 `export interface ISettingItem {}` 与 `export interface ISettingSystem {}` 已删除（属用户批准的替换，原文件无既有注释）。

## 门禁结果（Task 2 步骤 A 实际运行）

| 门禁 | 结果 |
|------|------|
| `eslint packages-user/client-base/src/setting/types.ts` | 退出码 0，0 报错（含 prettier：80 列 / 4 空格 / 单引号 / 无尾逗号 / CRLF） |
| `check:type`（整仓 `vue-tsc --noEmit`，`cmd /c` 包装） | 该文件 NEW 诊断 0；整仓总数 159，与基线 159 持平 |
| 源码形状闸门（Task 1 / Task 2） | 通过：2 行导入、6 个 `export interface`、25 条签名命中、`ISettingItem` 块内 4 个方法且无分组字段、`ISettingSystem` 块内 7 个方法、无 `getUngrouped`、无实现体 |
| 7 个受保护文件哈希 | 与基线逐字一致（见下） |
| HEAD 政策 | HEAD 未变（`f5f8322...`），无任何提交 |
| 范围闸门 | 仅目标文件被修改；整仓 16 条脏路径全部在基线快照内，无新增范围外路径 |

7 个受保护文件哈希（与 `09-33-BASELINE.json` 一致）：

- `packages-user/client-base/src/setting/index.ts` — `fcb073fefcd6bebc8afd726f830e66828ebc5e90`
- `packages-user/client-base/src/index.ts` — `3904bbe873a1fc1fe448529708dda15232271019`
- `packages-user/client-base/src/types.ts` — `cdf7224dc39118665b00a9697c31e6f5ae7c4f84`
- `packages-user/client-base/package.json` — `3e9b20220568df6244bbbceadb16e5c3b2a3e874`
- `packages-user/client-base/src/hotkey/types.ts` — `d1cdf0c25530950a46bce801df63ed975665b451`
- `packages-user/data-common/src/save/types.ts` — `06b37a622a5e26abb91cc6332c49ca65c6691204`
- `packages/system/src/ui/types.ts` — `2a24550a6a3f8dade44524f7be2564f7d7957551`

## 未做 / 明确声明

- **未做浏览器 UAT**：本计划没有任何运行期行为，不宣称设置系统 / 界面 / 存档行为已验证。
- **执行器 0 次代码提交**：未运行任何 git 写命令，代码改动留在工作树供审查；HEAD 与基线相同。`.planning` 产物可能由编排器按 `commit_docs: true` 聚合提交，不属于本计划的代码提交。
- **估算未校准**：计划 `estimate` 为 `confidence: low`，实际成本仅作参考，不用于校准结论。
- **系统本体未实现**：`ISettingSystem` / `ISettingItem` 的实现类、工厂、设置界面、存档注册、`IClientBase` 接线均未实现，属后续计划。
- 工作树中 09-29..09-32 的既有改动仍未提交，这些路径在基线里本就是脏的；范围闸门只证明「无新增范围外路径」。

## Deviations from Plan

None - plan executed exactly as written（未实现范围外内容，未修改任何受保护文件）。

## Issues Encountered

None。

## Next Phase Readiness

- 设置系统的类型契约已就位，后续实现可直接基于这 6 个 interface，无需再自造字段。
- 后续需要实现系统本体、设置项工厂、设置界面、存档注册，并在 `IClientBase` 上接入 `setting` 字段（均不在本计划范围）。

---

*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-29*
