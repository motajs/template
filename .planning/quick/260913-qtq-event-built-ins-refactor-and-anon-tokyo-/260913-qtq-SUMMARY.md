---
quick_id: 260913-qtq
slug: event-built-ins-refactor-and-anon-tokyo
date: 2026-09-13
status: complete
completed: 2026-09-13
tags: [events, anon-tokyo, data-state, refactor]
key-decisions:
  - "内建函数名改用短名（setBlock 等），删除 EventBuiltinName 枚举"
  - "anon-tokyo 以内嵌 workspace 包 @motajs/anon-tokyo 为唯一来源"
  - "事件注册收口为单函数 createEventRegistrations，不做分类包装"
  - "共享工具放 event/utils.ts 且不经 index 导出"
key-files:
  created:
    - packages-user/data-state/src/event/utils.ts
  modified:
    - packages-user/data-state/src/event/{map,hero,event,types,registrations,index}.ts
    - packages-user/data-state/src/event/event.test.ts
    - packages-user/data-state/src/core.ts
    - packages-user/data-state/test/fixtures/closed-loop.ts
    - packages-user/data-common/src/event/{types,event}.ts
    - packages-user/data-common/src/store/eventStore.test.ts
    - packages-user/data-system/src/event/{types,system,executor,eventDispatch.test}.ts
    - packages-user/data-common/package.json
    - packages-user/data-system/package.json
    - pnpm-lock.yaml
commits:
  - a701aa6 refactor(anon-tokyo): import embedded workspace package everywhere
  - f0fd2f5 refactor(event): class-based built-ins, shared utils, single registration
---

# Quick Task 260913-qtq Summary

**八个事件内建全部改为类式 `BuiltInFunction` 实现，注册收口为单一 `createEventRegistrations()`，anon-tokyo 统一走内嵌 `@motajs/anon-tokyo`**

## Performance

- **Completed:** 2026-09-13
- **Commits:** 2 (`a701aa6`, `f0fd2f5`)

## Accomplishments

- 全部 `anon-tokyo` 引用改为 `@motajs/anon-tokyo`；`data-common` / `data-system` 声明 workspace 依赖，lockfile 同步。
- `map.ts` / `hero.ts` / `event.ts` 八个内建函数改为类式实现，`name` 采用短名，`func` 为类方法；不再有落单函数。
- 共享工具收敛到 `event/utils.ts`（`getPossibleMap` / `getPossibleLayer` / `getEventExecutor` / `enterEventInsert` / `exitEventInsert`），不经 `event/index.ts` 导出。
- 非公共功能性函数改为类私有方法（`EventTouchFront.collectInvocations`、`EventInsertEvents.collectInvocations`）。
- 移动序列使用 `IObjectMover.push`，删除逐方法调用辅助。
- `registrations.ts` 仅保留 `createEventRegistrations()`，按地图/玩家/事件三类顺序写入八条，注释分隔。
- 删除 `EventBuiltinName`；`core.ts` 改用 `createEventRegistrations()`。

## Files Created/Modified

- `packages-user/data-state/src/event/utils.ts`（新增）— 共享事件工具，不在 barrel 导出
- `packages-user/data-state/src/event/{map,hero,event,registrations,index,types}.ts` — 类式重写
- `packages-user/data-state/src/event/event.test.ts` — 按新类与注册函数重写
- `packages-user/data-state/src/core.ts` — 使用 `createEventRegistrations()`
- `packages-user/data-state/test/fixtures/closed-loop.ts` — 内建名改短名
- `packages-user/data-common`、`packages-user/data-system` — import 重命名 + 依赖声明

## Decisions Made

- 内建函数名改用短名（`setBlock` 等）并删除 `EventBuiltinName`（用户确认）。
- anon-tokyo 内嵌为 workspace 包，全仓统一引用 `@motajs/anon-tokyo`。
- 注册不做分类包装，`createEventRegistrations()` 内按顺序直写八条。
- `utils.ts` 只放共享功能性函数，不经 index 导出。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] 对齐 replay 命令测试的先行红点**
- **Found during:** 验证阶段
- **Issue:** 用户上一提交 `46a38fa` 将 `ReplayCommandCode.AutoPathfindToPoint` 改名 `Teleport`、`registerReplayCommand` 改名复数、并简化 equip/unequip 逻辑，但未同步测试，导致 `commands.test.ts` 3 例失败。
- **Fix:** 按实现更新测试预期（Teleport 名称、registerReplayCommands、equip/unequip 只校验最终槽位、错误码 2007/2008）。
- **Files modified:** `packages-user/data-state/src/replay/commands.test.ts`
- **Verification:** `vitest run` 19 files / 112 tests 全通过。
- **Committed in:** `f0fd2f5`

**总偏差：** 1 处（Rule 3）。属恢复全套件绿色所必需，无范围蔓延。

## Issues Encountered

- 两个 git 提交命令并发执行触发 `index.lock`，`commands.test.ts` 被并入 `f0fd2f5`；内容正确，仅提交信息未单列。工作树最终干净。

## Verification

- 数据包 type 门禁：`Type gate passed: zero in-scope data-package diagnostics`
- `vitest run`：19 files / 112 tests passed
- 改动文件 Prettier 通过、ESLint 退出码 0

## Follow-ups / 未决

- 根 `package.json` 仍保留外部依赖 `anon-tokyo@0.0.0-alpha.0`，现已无人引用，可移除。
- `packages-user/legacy-plugin-data/src/fallback.ts` 的 `'eventMoveHero'` 为 legacy 全局补丁名，留给 Phase 5。
- `03-REPLAY-CONTRACT.md` 等契约文档尚未同步为新的短名 / 单一注册设计。

---

*Quick task: 260913-qtq*
*Completed: 2026-09-13*
