# Phase 08 Deferred Items

Out-of-scope discoveries logged by executors; not fixed within the reporting plan.

| Discovered by | Item | Scope note | Status |
| --- | --- | --- | --- |
| 08-09 | `pnpm test:perf` collects 6 files; `packages-user/data-base/src/hero/__test__/attribute.perf.ts` fails at collection with `TypeError: Class extends value undefined is not a constructor or null` (`:162 class PerfModifier extends BaseHeroModifier`) | Test-side import drift: `BaseHeroModifier` was imported from `../attribute` (not exported); corrected to `../modifier` in 08-10. | resolved by 08-10 |
| 08-09 | `packages-user/data-common/src/replay/__test__/sandbox.test.ts` fails 6 cases because `ReplaySandbox.step()` no longer pre-reads when `playing` is set manually | Test-side obsolete `playing=true` pre-read bypass; aligned to shipped natural `step()` in 08-10. | resolved by 08-10 |
| 08-10 | Pre-existing `prettier/prettier` eslint errors (46 errors across 7 files) unrelated to this plan's changes and present at HEAD `339f72d` before any 08-10 edit — `data-base/src/enemy/__test__/{manager,saveLoad}.test.ts`, `data-base/src/hero/__test__/{follower,location}.test.ts`, `data-system/src/combat/__test__/{context,damage}.perf.ts`, and production `data-common/src/replay/func.ts`. All are `--fix`-able formatting-only (line wrapping); verified via `git diff --stat HEAD` that the files are unmodified by 08-10. | Out of scope (scope boundary: do not fix pre-existing lint in unrelated files); `func.ts` is production so fixing would violate the zero-production-change constraint. Surfaced in 08-10-SUMMARY. All files touched by 08-10 pass eslint with 0 errors. | deferred |
