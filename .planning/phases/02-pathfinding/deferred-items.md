# Phase 02 Deferred Items

## Deferred Items

- data-base/src/hero/mover.ts 的 2 处既有 TypeScript 诊断（TS2339：IHeroMoveTopImpl 上不存在 canPass/shouldHit）
  status: open
  **What:** 用户提交 7a011b2 将 `IHeroMoveTopImpl` 重构为 `predicate(): IPassPredicate` 形态后，
  消费方 `data-base/src/hero/mover.ts:183/185` 仍直接调用 `canPass/shouldHit`，产生既有诊断。
  02-02 计划的 `check:type` 过滤式类型门（`mover\.ts`）会命中该既有文件；按计划声明
  「仓库既有诊断不在本计划范围」与本执行器的范围边界规则不修复，留给 02-03 Task 1
  （「掩码语义谓词由 02-03 Task 1 从 moverImpl 重构为 predicate() 后经 usePassPredicate 注入」）一并收口。
  02-02 计划内文件（`src/path/`、`data-common/src/common/mover.ts`）类型诊断为 0。
