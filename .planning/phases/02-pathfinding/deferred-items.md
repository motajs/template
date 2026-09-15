# Phase 02 Deferred Items

## Deferred Items

- data-base/src/hero/mover.ts 的 2 处既有 TypeScript 诊断（TS2339：IHeroMoveTopImpl 上不存在 canPass/shouldHit）
  status: resolved
  **What:** 用户提交 7a011b2 将 `IHeroMoveTopImpl` 重构为 `predicate(): IPassPredicate` 形态后，
  消费方 `data-base/src/hero/mover.ts:183/185` 仍直接调用 `canPass/shouldHit`，产生既有诊断。
  02-02 计划的 `check:type` 过滤式类型门（`mover\.ts`）会命中该既有文件；按计划声明
  「仓库既有诊断不在本计划范围」与本执行器的范围边界规则不修复，留给 02-03 Task 1
  （「掩码语义谓词由 02-03 Task 1 从 moverImpl 重构为 predicate() 后经 usePassPredicate 注入」）一并收口。
   02-02 计划内文件（`src/path/`、`data-common/src/common/mover.ts`）类型诊断为 0。

- data-state/src/core.ts 的 2 处既有 TypeScript 诊断（TS2322/TS2345：TileStore 泛型实现与 ITileStore 不兼容）
  status: open
  **What:** `CoreState` 原有 `TileStore<LegacyTileData>` 装配在 `this.tileStore` 与 `MapState` 构造处
  被仓库当前接口泛型诊断命中；本计划仅在同一构造器追加寻路接线，不改变既有 TileStore 契约，
  按范围边界规则留给后续数据层类型收口。

- packages-user/ 下的既有 lint:user 诊断（52 errors，集中在 client-modules 与 legacy-plugin-*）
  status: open
  **What:** 阶段门禁 `pnpm lint:user` 仍被本计划未修改的渲染与 legacy 文件阻塞；计划归属文件的
  ESLint 检查为 0 problems，按范围边界规则不修复无关基线问题。

- data-state/src/hero/moverImpl.ts 的 TS18047 诊断（`loc.static` 可能为 `null`）
  status: resolved
  **What:** `commonTrigger` 的静态图块事件收集在可空 `ILayerLocation.static` 上直接调用
  `tileEvent()`，导致计划归属文件的类型门禁失败。
  **Resolution:** 仅在 `loc.static` 非空时收集静态图块事件；动态事件收集、优先级排序、来源环境
  与单次 executor 调用保持不变。
