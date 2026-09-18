---
quick_id: 260913-qtq
slug: event-built-ins-refactor-and-anon-tokyo
date: 2026-09-13
status: complete
tags: [events, anon-tokyo, data-state, refactor]
---

# Quick Task 260913-qtq: 事件内建函数改造 + anon-tokyo 引用统一

> 追溯记录：仅记录本次 AI 侧的改动（提交 `a701aa6`、`f0fd2f5`、文档提交见 SUMMARY）。

## Objective

全仓统一引用内嵌的 `@motajs/anon-tokyo`，并把 `data-state` 的全部事件内建函数改为
类式 `BuiltInFunction` 写法，注册收口为单一函数，共享工具收敛到 `utils.ts`。

## Scope

- `packages-user/data-common`、`packages-user/data-system`、`packages-user/data-state`

## Tasks

1. **anon-tokyo 引用统一** — 全部 `from 'anon-tokyo'` → `from '@motajs/anon-tokyo'`；
   `data-common` / `data-system` 声明 `@motajs/anon-tokyo: workspace:*`，刷新 lockfile。

2. **事件内建函数类式重写** — `map.ts` / `hero.ts` / `event.ts` 每个内建函数改为
   `EventXxx implements BuiltInFunction<P, E>`（`name` 用短名 + `func` 方法）；共享工具
   迁至 `event/utils.ts`（不经 index 导出）；非公共功能性函数改为类私有方法；移动序列
   改用 `IObjectMover.push`；`registrations.ts` 仅保留 `createEventRegistrations()`；
   删除 `EventBuiltinName`。

3. **装配与测试** — `core.ts` 改用 `createEventRegistrations()`；更新
   `event.test.ts` 与 `closed-loop` fixture；对齐 replay 命令测试。

## must_haves

- [x] 源码中不再有裸 `anon-tokyo` 引用
- [x] 八个内建函数均为类实现，名称为 `setBlock/moveBlock/deleteBlock/moveHero/moveHeroStep/touchFront/insertEvents/insertEvent`
- [x] `event/utils.ts` 存在且不被 `event/index.ts` 导出
- [x] `createEventRegistrations()` 为唯一注册入口，顺序稳定
- [x] 全量测试通过，type 门禁 0 in-scope 诊断
