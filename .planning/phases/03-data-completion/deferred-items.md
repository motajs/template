# Deferred Items — Phase 03

- `pnpm check:type` remains blocked by pre-existing render/legacy diagnostics and the user-owned Tile events contract migration (`TileStore.getEvent` and `TileLegacyBridge` still use the old `trigger` shape). The migration is outside Plan 03-01 and remains assigned to the later Phase 3 tile-events plan.
