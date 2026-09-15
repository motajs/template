---
phase: 03-data-completion
plan: 06
subsystem: data-store
tags: [tile, events, legacy-bridge, vitest, node]

requires:
  - phase: 03-data-completion
    provides: Node-safe data state construction and the authoritative ITileRawData.events contract baseline from Plan 03-01
provides:
  - TileStore events-map storage and defensive getEvent(num) lookup
  - Legacy tile conversion into the events-map contract with safe empty defaults
  - Focused TileStore and TileLegacyBridge regression coverage
affects: [03-05, phase-05-legacy-migration, data-common, data-state]

actuals:
  tokens: 3438
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - Store normalized tile event maps internally and return fresh read-only views for lookup callers
    - Use explicit legacy-like fixtures without browser globals for bridge contract tests

key-files:
  created:
    - packages-user/data-common/src/store/tileStore.test.ts
    - packages-user/data-state/test/tileLegacy.test.ts
  modified:
    - packages-user/data-common/src/store/tileStore.ts
    - packages-user/data-state/src/legacy/tile.ts
    - .planning/phases/03-data-completion/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "ITileRawData.events and ITileStore.getEvent(num) remain the sole Tile runtime contract; no trigger scalar compatibility field was restored."
  - "TileStore snapshots raw events into an internal map and returns a fresh Map on every lookup so callers cannot mutate stored defaults."
  - "LegacyTileData accepts an optional legacy events object; missing or malformed entries become a safe empty/filtered events map without browser dependencies."

patterns-established:
  - "Tile replacement removes the previous event snapshot together with data and both indexes."
  - "Focused data tests use explicit fixtures and place a Chinese coverage comment immediately before every it call."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "TileStore stores raw tile default events and exposes indexed, defensive getEvent lookups."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/store/tileStore.test.ts (5 tests)"
        status: pass
      - kind: other
        ref: "comment-adjacency PowerShell gate plus pnpm exec vitest run packages-user/data-common/src/store/tileStore.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "TileLegacyBridge converts explicit legacy event input and missing input into TileStore-consumable events maps without trigger output."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/test/tileLegacy.test.ts (2 tests)"
        status: pass
      - kind: other
        ref: "pnpm exec vitest run packages-user/data-state/test/tileLegacy.test.ts packages-user/data-common/src/store/tileStore.test.ts"
        status: pass
    human_judgment: false

duration: 12 min
completed: 2026-09-10
status: complete
plan_head_before: 846513b2a6738486009b1e05f45f6175e59f8127
commits: 3
---

# Phase 3 Plan 6: Tile Events-Map Contract Migration Summary

**TileStore and legacy tile conversion now share the user-approved events-map contract, with defensive lookup and Node-safe focused regressions**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-10T07:48:00Z
- **Completed:** 2026-09-10T07:59:20Z
- **Tasks:** 2
- **Files modified:** 6 implementation/test/ledger files

## Accomplishments

- Replaced TileStore's scalar trigger lookup with normalized `ITileRawData.events` storage, preserving id/num indexes and replacement behavior
- Added safe empty-map behavior for missing tiles and fresh lookup maps that cannot mutate internal defaults
- Migrated TileLegacyBridge to optional legacy events input with filtered safe defaults and no trigger scalar output
- Added explicit Chinese-commented TileStore and legacy bridge tests, including direct TileStore consumption and browser-global independence

## Task Commits

Each task was committed atomically:

1. **Task 1: Tile events raw-data 到 accessor tracer** - `89e53a6` (feat)
2. **Task 2: Legacy tile conversion events-map regression** - `a12b2d2` (feat)

Additional required formatting/deferred-ledger fix:

- `f911ac5` (style): normalized CRLF/Prettier formatting and recorded remaining out-of-scope type diagnostics

**Plan metadata:** pending final metadata commit

## Files Created/Modified

- `packages-user/data-common/src/store/tileStore.ts` - stores normalized default event maps and returns defensive lookup copies
- `packages-user/data-common/src/store/tileStore.test.ts` - covers event defaults, missing tiles, indexes, replacement, and mutation isolation
- `packages-user/data-state/src/legacy/tile.ts` - converts optional legacy events to the authoritative raw-data events map
- `packages-user/data-state/test/tileLegacy.test.ts` - covers explicit legacy conversion and missing-event defaults without globals
- `.planning/phases/03-data-completion/deferred-items.md` - records only the remaining pre-existing repository type diagnostics
- `.planning/WINDOWS.md` - records the deferred type gate and formatting deviation for cross-phase auditability

## Decisions Made

- Kept `ITileRawData.events` and `ITileStore.getEvent(num)` as the only Tile contract, following D-22 and leaving user-owned `types.ts` unchanged
- Kept full legacy removal and migration out of scope; only the conversion boundary needed by this contract was changed
- Used a fresh `Map` for every accessor result rather than exposing the internal normalized map

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied repository line-ending and Prettier formatting**

- **Found during:** Task 2 (Legacy tile conversion events-map regression)
- **Issue:** ESLint failed the newly changed files because the repository requires CRLF formatting; functional tests had already passed
- **Fix:** Ran the project ESLint auto-fix on the four Tile implementation/test files, then reran lint and focused tests
- **Files modified:** `packages-user/data-common/src/store/tileStore.ts`, `packages-user/data-common/src/store/tileStore.test.ts`, `packages-user/data-state/src/legacy/tile.ts`, `packages-user/data-state/test/tileLegacy.test.ts`
- **Verification:** Targeted ESLint passed; focused Tile tests passed with 7 tests
- **Committed in:** `f911ac5`

---

**Total deviations:** 1 auto-fixed (1 Rule 3 blocking formatting issue)
**Impact on plan:** Formatting-only correction; no scope or runtime behavior change.

## Issues Encountered

- `pnpm check:type` remains non-zero only for pre-existing render/legacy package diagnostics outside this plan. No diagnostics were reported for the migrated Tile files; the deferred-items ledger and broken-windows ledger retain the remaining gate as an open out-of-scope item.
- Test runs emitted expected duplicate-tile and existing data-layer warning messages; all targeted and full data tests passed.

## Verification

- PASS: comment-adjacency gate for both Tile test files
- PASS: `pnpm exec vitest run packages-user/data-state/test/tileLegacy.test.ts packages-user/data-common/src/store/tileStore.test.ts` — 2 files, 7 tests
- PASS: `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` — 13 files, 67 tests
- PASS: ESLint on all four modified Tile implementation/test files
- DEFERRED: `pnpm check:type` remains blocked by unrelated pre-existing render/legacy diagnostics; the former Tile contract diagnostics are resolved

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03-05 can consume the migrated Tile contract for its four-package type/circular gates.
- Phase 5 may later remove or expand legacy conversion behavior, but this plan intentionally leaves the legacy host boundary intact.
- The repository-wide type gate still needs the unrelated render/legacy diagnostics resolved before it can be green.

---
*Phase: 03-data-completion*
*Completed: 2026-09-10*

## Self-Check: PASSED

- Summary, both focused test files, and all four declared implementation/test files exist on disk
- Task commits `89e53a6`, `a12b2d2`, and formatting/ledger commit `f911ac5` are present in git history
- Focused Tile tests, full four-package data suite, and targeted ESLint passed
- STATE.md and ROADMAP.md were not modified per orchestrator instruction
