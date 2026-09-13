---
quick_id: 260913-qtq
slug: event-built-ins-refactor-and-anon-tokyo
date: 2026-09-13
status: complete
tags: [events, anon-tokyo, data-state, refactor]
---

# Quick Task 260913-qtq: 事件内建函数改造 + anon-tokyo 引用统一

## Objective

把内嵌的 `@motajs/anon-tokyo` 作为唯一 anon-tokyo 来源接入全部包，并把
`data-state` 的全部事件内建函数改为与用户手写的 `EventSetBlock` 一致的
类式写法，注册收口为单一函数，共享工具收敛到 `utils.ts`。

> 说明：本记录为追溯补录。代码已先行完成并提交（`a701aa6`、`f0fd2f5`），
> 现补 PLAN/SUMMARY/STATE 记录以保证可追溯。

## Scope

- `packages-user/data-common`、`packages-user/data-system`、`packages-user/data-state`

## Tasks

1. **anon-tokyo 引用统一**
   - 全部 `from 'anon-tokyo'` → `from '@motajs/anon-tokyo'`
   - `data-common` / `data-system` 声明 `@motajs/anon-tokyo: workspace:*`，刷新 lockfile

2. **事件内建函数类式重写**
   - `map.ts` / `hero.ts` / `event.ts` 每个内建函数改为
     `EventXxx implements BuiltInFunction<P, E>`，`name` 使用短名 + `func` 方法
   - 删除落单函数；共享工具迁至 `event/utils.ts`（不经 index 导出）
   - 非公共功能性函数改为类私有方法
   - 移动序列改用 `IObjectMover.push`，删除 `appendMoveSteps`
   - `registrations.ts` 仅保留 `createEventRegistrations()`，按三类顺序写入八条
   - 删除 `EventBuiltinName`

3. **验证**
   - 数据包 type 门禁、`vitest run`、Prettier/ESLint
   - 对齐 `46a38fa` 遗留的 replay 测试红点

## must_haves

- [x] 源码中不再有裸 `anon-tokyo` 引用
- [x] 八个内建函数均为类实现，名称稳定为 `setBlock/moveBlock/deleteBlock/moveHero/moveHeroStep/touchFront/insertEvents/insertEvent`
- [x] `event/utils.ts` 存在且不被 `event/index.ts` 导出
- [x] `createEventRegistrations()` 为唯一注册入口，顺序稳定
- [x] 全量测试通过，type 门禁 0 in-scope 诊断
