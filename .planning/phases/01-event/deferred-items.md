# Deferred Items — Phase 01 Plan 13

## Pre-existing repository-wide diagnostics

`pnpm check:type` remains blocked by diagnostics outside the files owned by
Plan 01-13. The failures are in the legacy/client integration surfaces and
the pre-existing `TileStore`/`ITileStore` trigger-shape mismatch, including:

- `packages-user/client-modules/**`
- `packages-user/data-common/src/store/tileStore.ts`
- `packages-user/data-state/**`
- `packages-user/legacy-plugin-data/**`
- `packages/legacy-ui/src/tools/equipbox.tsx`

No type errors were reported in the Plan 01-13 implementation or test files.
