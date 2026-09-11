# Deferred Items — Phase 03

- `pnpm check:type` remains blocked by pre-existing render/legacy diagnostics outside Plan 03-06. The Tile events contract diagnostics from the earlier baseline were resolved by Plan 03-06.
- Plan 03-15's scoped circular gate reports seven pre-existing legacy/render boundary cycles through `data-state/src/legacy/move.ts`; the independent replay command class changes do not touch those imports.
