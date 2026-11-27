---
phase: 09-minimum-browser-runnable
plan: 13
subsystem: client-modules（渲染端入口 / legacy 回退层去除）
tags: [legacy-removal, fallback, TipStore, SoundPlayer, refactor]

requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-12 legacy 接口可替代性判定（ALT-COUNT: 40 / ENTRY-COUNT: 99）
provides:
  - 删除 legacy patch 回退层 `packages-user/client-modules/src/fallback/**`（5 文件）
  - `client-modules/src/index.ts` 去回退层接线（无 `patchAll` / 无 `export * from './fallback'`）
  - `core.drawTip` → `TipStore.drawTip`（`ui/save.tsx`）
  - `core.playSound` → `SoundPlayer.play`（`ui/settings.tsx`）
affects: [09-14, 09-15, 09-16]

actuals:
  tokens: 3015
  tasks: 2
  commits: 2
  plan_head_before: 8819faa93b402e39ebac12193522f8bd3a29492d

tech-stack:
  added: []
  patterns:
    - "回退层（legacy patch）整层去除，调用点直连新系统（TipStore / SoundPlayer）"
    - "UI 组件经 props.state（IClientBase）取得音频播放器，不用 client 单例（D-11）"

key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-13-SUMMARY.md
  modified:
    - packages-user/client-modules/src/index.ts
    - packages-user/client-modules/src/ui/save.tsx
    - packages-user/client-modules/src/ui/settings.tsx
  deleted:
    - packages-user/client-modules/src/fallback/index.ts
    - packages-user/client-modules/src/fallback/audio.ts
    - packages-user/client-modules/src/fallback/ui.ts
    - packages-user/client-modules/src/fallback/weather.ts
    - packages-user/client-modules/src/fallback/load.ts

key-decisions:
  - "Task 0 关卡已由用户回复「可以执行」闭环，并批准「非 ALT 分类连带消除清单」（整文件删除 fallback/audio.ts + fallback/load.ts 的必然后果）"
  - "C:drawTip 按审计替代方案 = TipStore.drawTip，采用 fallback/ui.ts 原实现的 TipStore.get('main-tip') 取实例（非 client 单例）"
  - "C:playSound 按 D-11 经 props.state.soundPlayer 取得 ISoundPlayer 实例，保留原音效名 'confirm.opus'（不引入 client 单例）"
  - "不新增任何公共 / 受保护 / 私有命名（复用既有符号）"

patterns-established:
  - "legacy 回退层去除：整文件删除 + 入口断线 + 调用点成对直连（避免悬空调用）"
  - "UI 组件取主对象：经 props.state（IClientBase），不使用 client 单例"

requirements-completed: []

duration: 7min
completed: 2026-10-12
status: complete
---

# Phase 9 Plan 13: 回退层去除 + 调用点直连 Summary

**删除 `client-modules/src/fallback/**` legacy patch 回退层（5 文件）并断开 `index.ts` 接线，将仅有的两个有调用者的 patch 方法调用点改直连 `TipStore.drawTip` / `SoundPlayer.play`（12 条 ALT）**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-12T08:07:34Z
- **Completed:** 2026-10-12T08:14:06Z
- **Tasks:** 2（Task 0 为 `blocking-human` 汇报关卡，已闭环；不计入自动任务数）
- **Files modified:** 8（5 删除 + 3 修改）+ 1 SUMMARY

## Task 0：预执行汇报关卡（已闭环）

**类型：** `checkpoint:decision` · `gate="blocking-human"` · **结论：用户已回复「可以执行」四个字。**

- 本计划 = 任务 7 · 第一批改造（ALT 条目）· 拆分后的**第 1 组 / 共 4 组**：回退层去除 + 其调用点（12 条 ALT）。
- 用户在关卡同时批准了**「非 ALT 分类连带消除清单」**（删除整文件 `fallback/audio.ts` / `fallback/load.ts` 的必然后果，共 12 条，见下）。
- 依据：`AGENTS.md`（执行前须获批）/ D-03 / D-04；`.planning/config.json` 为 `mode: yolo`，故本关卡显式 `blocking-human` 且 `autonomous: false`。
- 采纳默认处置：`execute-default`（回退层整体去除 + 调用点成对替换 + 命名零新增 + 静态门禁）。OI-1..OI-4 均按默认处置执行（OI-4 = `SoundPlayer` 经 `props.state` 取得）。

## Task Commits

Each task was committed atomically:

1. **Task 1: 删除回退层 + 断开 index.ts 接线** - `12bb67b` (refactor)
2. **Task 2: `core.drawTip` / `core.playSound` 调用点改直连** - `0747fca` (refactor)

**Plan commits（测量，非叙述）：** `git rev-list --count 8819faa..HEAD` = **2**。
**Plan metadata:**（本 SUMMARY 的提交由收尾的 docs 提交承载）

## Files Created/Modified

- `packages-user/client-modules/src/fallback/index.ts` - **删除**（`patchAll()` 与三个 patch 导入）
- `packages-user/client-modules/src/fallback/audio.ts` - **删除**（legacy 音频 patch 层）
- `packages-user/client-modules/src/fallback/ui.ts` - **删除**（legacy UI `drawTip` patch 层）
- `packages-user/client-modules/src/fallback/weather.ts` - **删除**（legacy 天气 `setWeather` patch 层）
- `packages-user/client-modules/src/fallback/load.ts` - **删除**（legacy 素材加载适配层）
- `packages-user/client-modules/src/index.ts` - **修改**：移除 `import { patchAll } from './fallback'`、`create()` 内 `patchAll()` 调用、`export * from './fallback'`；保留 `create()` / `createRender()`
- `packages-user/client-modules/src/ui/save.tsx` - **修改**：两处 `core.drawTip(validation.message)`（`selectSave` 内）→ `TipStore.get('main-tip')?.drawTip(validation.message)`；新增 `TipStore` 导入（`@user/client-base`）
- `packages-user/client-modules/src/ui/settings.tsx` - **修改**：两处 `core.playSound('confirm.opus')`（`SyncSaveSelect` 内）→ `props.state.soundPlayer.play('confirm.opus')`

## 本组 12 条 ALT 落地对照

| ID | 原接口/成员 | 替代方案（锚点） | 落地位置 | 结果 |
| --- | --- | --- | --- | --- |
| A-7-1 | `fallback/index.ts` `patchAll()` | `create()`（client-modules/src/index.ts:4） | index.ts 断线 + 删文件 | ✅ |
| A-7-3 | `fallback/ui.ts` | `TipStore`（tip.tsx:148） | 删文件 | ✅ |
| A-7-4 | `fallback/weather.ts` | `WeatherController`（controller.ts:11） | 删文件 | ✅ |
| A-7-5 | `fallback/load.ts` | `TextureManager`（manager.ts:37） | 删文件（`fallbackLoad` 无调用者） | ✅ |
| A-1-2 | `Patch`/`PatchClass`（audio.ts:1） | `Hookable`/`HookController` | 删文件 | ✅ |
| A-1-4 | `Patch`/`PatchClass`（ui.ts:1） | `TipStore` | 删文件 | ✅ |
| A-1-5 | `Patch`/`PatchClass`（weather.ts:1） | `WeatherController` | 删文件 | ✅ |
| A-4-1 | `new Patch(PatchClass.Control)`（audio.ts:10） | `SoundPlayer`/`BGMPlayer` | 删文件 | ✅ |
| A-4-2 | `new Patch(PatchClass.UI)`（ui.ts:5） | `TipStore` | 删文件 | ✅ |
| A-4-3 | `new Patch(PatchClass.Control)`（weather.ts:8） | `WeatherController` | 删文件 | ✅ |
| C:drawTip | `core.drawTip`（save.tsx:531/540） | `TipStore.drawTip`（tip.tsx:158） | save.tsx 两处改直连 | ✅ |
| C:playSound | `core.playSound`（settings.tsx:431/444） | `SoundPlayer.play`（sound.ts:74） | settings.tsx 两处改直连 | ✅ |

## 非 ALT 分类连带消除清单（整文件删除的必然后果，经 Task 0 关卡批准）

> **性质：** 下列条目**不是**「顺手改」，而是删除**整文件** `fallback/audio.ts` / `fallback/load.ts` 的**必然后果**（D-53 批次边界）。已在本计划 Task 0 `blocking-human` 关卡逐条呈报并由用户批准（含在「可以提交」授权内）。

| 连带消除项 | 分类 | 所在被删文件:行 | 备注 |
| --- | --- | --- | --- |
| A-7-2（`fallback/audio.ts` 音频回退本体） | 有替代但需适配 | fallback/audio.ts（整文件） | 替代 `ClientCore` 音频成员（client.ts:44）——随整文件删除消除 |
| A-1-3 `mainSetting` | 待定 | fallback/audio.ts:2 | 无替代 |
| A-3-2 `client` 导入使用 | 有替代但需适配 | fallback/audio.ts:5 | → 经 `IClientCore` 参数注入 |
| A-3-3 `client` 解构 `{ bgmPlayer, soundPlayer, audioContext }` | 有替代但需适配 | fallback/audio.ts:11 | → `ClientCore` 成员（client.ts:44） |
| A-5-1 `mainSetting.getValue('audio.bgmEnabled')` | 待定 | fallback/audio.ts:31 | 无替代 / 待定 |
| C:getMappedName | 无替代 | fallback/audio.ts:49 | 无替代 |
| C:maps | 有替代但需适配 | fallback/load.ts:44,59 | → `MapState`（mapState.ts:17） |
| C:icons | 待定 | fallback/load.ts:55 | 无替代 / 待定 |
| C:material | 有替代但需适配 | fallback/load.ts:56 | → `TextureManager`（manager.ts:37） |
| C:tilesets | 有替代但需适配 | fallback/load.ts:99 | → `TextureManager.tilesetStore` |
| C:floorIds | 有替代但需适配 | fallback/load.ts:111 | → `MapStore`（mapStore.ts:3） |
| C:floors | 有替代但需适配 | fallback/load.ts:112 | → `MapState`（mapState.ts:17） |

**说明：** 共 12 条非 ALT 用法随两个整文件的删除而消除；本计划未对它们做任何**主动**编辑，仅记录整文件删除的必然影响，以保持 D-53 批次边界可审计。

## 命名影响（D-04 / OI-3）

**零新增命名。** 复用既有符号：`TipStore`（`@user/client-base`）、`props.state.soundPlayer`（`ISoundPlayer`）、`create()` / `createRender()`。未新增任何公共 / 受保护 / 私有成员、方法、字段、类型或接口；未改既有命名。

## Gates / 验证结果

| 门禁 | 结果 |
| --- | --- |
| Task 0 pre-state（回退层/调用点/审计文档存在，ALT-COUNT=40） | ✅ OK |
| Task 1 FALLBACK gate（5 文件删除 + 无 `patchAll`/`./fallback` + 保留 `create()`/`createRender()`） | ✅ OK |
| Task 1 CRLF gate（`index.ts`） | ✅ OK |
| Task 1 scope gate（`git status --porcelain`：仅 `files_modified`，用户并发改动除外） | ✅ OK |
| Task 2 CALLSITE gate（无 `core.drawTip`/`core.playSound`，有 `TipStore`/`play(`） | ✅ OK |
| Task 2 CRLF / IMPORT gate（两文件 CRLF、无 `import type`） | ✅ OK |
| Task 2 scope gate | ✅ OK |

**门禁口径：** 全部为**静态断言**；未使用 `pnpm check:type` / `pnpm build` / 全仓 TS 诊断数。

**行尾 / 注释：** 被改源码保持 CRLF；未修改任何既有注释 / JSDoc。**依据（D-52）：** 严格取自 `09-LEGACY-REPLACEMENT-AUDIT.md`；未 invent 替代方案。

## Deviations from Plan

**None - plan executed exactly as written.**

- 执行期未发现回退层 patch 方法的其它调用者（OI-2 前置成立）：`client-base` / `client-modules` 内除本计划已替换的 `save.tsx` / `settings.tsx` 外，无 `core.drawTip` / `core.playSound` / `core.playBgm` / `core.setWeather` / `core.getPlayingSounds` 等调用者。
- `SoundPlayer` 实例经 `props.state.soundPlayer` 取得（OI-4 默认处置），未引入 `client` 单例。
- 未触碰其它分类（DIRECT / ADAPT / NONE / TBD）的任何**主动**用法；未改 09-01..09-12 文件、`09-CONTEXT.md`、`09-LEGACY-REPLACEMENT-AUDIT.md`。

## Issues Encountered

None。

> 用户并发改动（非本计划产物，未触碰 / 未暂存）：`packages-user/data-state/**`（`enemy/{aura,calculator,final,legacy,special}`）与 `packages-user/data-system/src/combat/types.ts`。二者均为 `git status` 守卫豁免的既有并发改动，本计划仅暂存自身 `files_modified`。

## Next Phase Readiness

- 回退层已彻底去除，`client-modules/src/index.ts` 为去 legacy 接线后的干净入口。
- 本组 12 条 ALT 已收口；其余 28 条 ALT 由 09-14 / 09-15 / 09-16 承接（同批次）。

---

## Self-Check: PASSED

- 删除文件均不存在；`index.ts` 无 `patchAll` / `./fallback`，保留 `create()` / `createRender()`。
- 两处 `core.drawTip` → `TipStore.get('main-tip')?.drawTip(...)`；两处 `core.playSound` → `props.state.soundPlayer.play(...)`。
- 提交存在：`12bb67b`、`0747fca`；测量提交数 = 2 = `plan_head_before..HEAD`。
- STATE.md / ROADMAP.md / REQUIREMENTS.md 未被本执行修改（由 orchestrator 负责）。

---
*Phase: 09-minimum-browser-runnable*
*Plan: 13*
*Completed: 2026-10-12*
