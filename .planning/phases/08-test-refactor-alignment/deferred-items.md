# Phase 08 Deferred Items

Out-of-scope discoveries logged by executors; not fixed within the reporting plan.

| Discovered by | Item | Scope note | Status |
| --- | --- | --- | --- |
| 08-09 | `pnpm test:perf` collects 6 files; `packages-user/data-base/src/hero/__test__/attribute.perf.ts` fails at collection with `TypeError: Class extends value undefined is not a constructor or null` (`:162 class PerfModifier extends BaseHeroModifier`) | data-base file; untouched by 08-09 (zero production and zero data-base changes). Pre-existing since the 08-01 migration commit `36d8b4f`. Expected to be covered by the data-base alignment plan. | deferred |
| 08-09 | `packages-user/data-common/src/replay/__test__/sandbox.test.ts` fails 6 cases because `ReplaySandbox.step()` no longer pre-reads when `playing` is set manually | data-common file; untouched by 08-09. Pre-existing shipped-contract drift (the shipped `step()` pre-reads only when `!playing && !ended`). Expected to be covered by the data-common alignment plan. 08-09 aligned the data-state consumer (`dataClosure.test.ts`) to the shipped natural pre-read. | deferred |
