---
phase: 03-data-completion
plan: 10
subsystem: data-state-compatibility
tags: [legacy-compatibility, replay, node-verifier, data-state]

requires:
  - phase: 03-data-completion
    provides: CoreState replay assembly, raw map APIs, and the fixed replay route
provides:
  - Existing SaveSystem and legacy loading callbacks restored in CoreState
  - Phase-3 legacy dependency and serialized-loading adapters removed
  - Direct data-side replay fixture with a deterministic mutation completion barrier
affects: [03-data-completion, Phase 4 render adaptation, Phase 5 legacy migration]

actuals:
  tokens: 6173
  tasks: 2
  commits: 2
  plan_head_before: 4d094f988f35619acd6cf7d4f0a480ab5c39e8c2
commits: 2

tech-stack:
  added: []
  patterns:
    - Existing compatibility loading remains directly attached to CoreState's SaveSystem and legacy converters
    - Replay fixtures construct raw maps and GameEvent instances directly through data-side APIs
    - Map-layer mutation hooks provide synchronous completion markers for final replay snapshots

key-files:
  created: []
  modified:
    - packages-user/data-state/src/core.ts
    - packages-user/data-state/test/fixtures/closed-loop.ts
    - packages-user/data-state/test/nodeTracer.test.ts
    - script/test-data-node.ts
    - .planning/WINDOWS.md
  deleted:
    - packages-user/data-state/src/legacy/dependencies.ts
    - packages-user/data-state/src/legacy/events.ts
    - packages-user/data-state/test/coreSerializedEvents.test.ts

key-decisions:
  - "CoreState uses the existing SaveSystem, legacy converter/bridge attachments, and loading callbacks directly; no replacement legacy or Node-specific loading boundary remains."
  - "The fixture registers its GameEvent directly, uses explicit raw maps, and awaits only the fixture mutation signal before snapshotting."
  - "The existing @user/data-common ReplaySystem import and user-owned @shouldReplay() boundary remain unchanged."

patterns-established:
  - "Compatibility-only legacy behavior stays at the pre-Phase-3 CoreState boundaries."
  - "Replay command execution remains synchronous; verifier completion is a separate fixture-level observation barrier."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "CoreState restores direct SaveSystem construction, legacy converter/bridge attachments, and existing loading callbacks without Phase-3 adapters."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/tileLegacy.test.ts"
        status: pass
      - kind: other
        ref: "CoreState source and tsx construction compatibility checks"
        status: pass
    human_judgment: false
  - id: D2
    description: "The closed-loop Node replay uses explicit maps and a directly registered event, then waits for the synchronous map mutation marker before its final snapshot."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "packages-user/data-state/test/nodeTracer.test.ts"
        status: pass
      - kind: integration
        ref: "pnpm test:data-node"
        status: pass
      - kind: unit
        ref: "packages-user/data-state/test/nodeReplay.test.ts"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-09-11
status: complete
---

# Phase 3 Plan 10 Summary

**CoreState now retains its existing compatibility-only SaveSystem/loading path while the fixed replay uses direct data-side setup and a deterministic mutation barrier**

## Performance

- **Duration:** 9 min
- **Started:** 2026-09-11T13:52:54+08:00
- **Completed:** 2026-09-11T14:01:46+08:00
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Restored direct `SaveSystem` construction, legacy tile/item converter attachments, the enemy bridge, and the existing `loading.once('coreInit'/'loaded')` callbacks in `CoreState`.
- Deleted the Phase-3-only legacy dependency and serialized-event adapter files, including the regression that existed only for the rejected serialized-loading boundary.
- Rebuilt the closed-loop fixture with explicit `MapState.fromRaw` maps and direct `GameEventStore` registration, using `onUpdateBlock` plus `Promise.withResolvers` as the exact verifier completion signal.
- Preserved the `@user/data-common` `ReplaySystem` import, synchronous replay command behavior, and user-owned `@shouldReplay()` placement.
- Marked the obsolete open broken-window entry for the deleted legacy dependency boundary as fixed.

## Task Commits

Each task was committed atomically:

1. **Task 1: CORR-03-01 restore the existing compatibility loading path** - `e4e39f7` (fix)
2. **Task 2: CORR-03-01 restore direct replay fixture coverage** - `45e3b1f` (fix)

## Files Created/Modified

- `packages-user/data-state/src/core.ts` - Restores the pre-Phase-3 compatibility assembly while retaining current event and replay wiring.
- `packages-user/data-state/test/fixtures/closed-loop.ts` - Uses explicit raw maps, direct event registration, and a mutation completion promise.
- `script/test-data-node.ts` - Awaits fixture event completion before the final snapshot.
- `packages-user/data-state/test/nodeTracer.test.ts` - Aligns the existing tracer assertion with the restored `SaveSystem`.
- `packages-user/data-state/src/legacy/dependencies.ts` - Deleted Phase-3 dependency factory and loading boundary.
- `packages-user/data-state/src/legacy/events.ts` - Deleted Phase-3 serialized-event adapter.
- `packages-user/data-state/test/coreSerializedEvents.test.ts` - Deleted regression for the removed serialized-loading boundary.

## Decisions Made

- Followed supersession S-01 exactly: legacy remains compatibility behavior at the existing boundaries and is not replaced with another adapter.
- Followed supersession S-02 exactly: the replay command path does not await movement or event Promises; only the Node verifier awaits the fixture's mutation signal.
- Did not modify `STATE.md` or `ROADMAP.md`, and preserved the pre-existing unrelated `.planning/STATE.md` and `.planning/HANDOFF.json` working-tree changes.

## Broken-Windows Ledger

- Fixed entry 9 in `.planning/WINDOWS.md`; the recorded Node legacy dependency stub no longer exists after this correction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Stale regression assertion] Updated the tracer's save-system expectation**
- **Found during:** Task 2 (CORR-03-01 restore direct replay fixture coverage)
- **Issue:** The required `nodeTracer.test.ts` gate still asserted the Phase-3 `MemorySaveSystem` after Task 1 restored the required existing `SaveSystem` path.
- **Fix:** Changed only the two constructor-name assertions to expect `SaveSystem`; no save implementation or architecture was added.
- **Files modified:** `packages-user/data-state/test/nodeTracer.test.ts`
- **Verification:** Focused replay tests and `pnpm test:data-node` passed.
- **Committed in:** `45e3b1f` (part of task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1: 1)
**Impact on plan:** Necessary test alignment for the explicitly restored SaveSystem behavior; no architecture or user-owned boundary was expanded.

## Issues Encountered

- The first Task 2 gate exposed the stale `MemorySaveSystem` assertion described above; it was corrected inline and the complete gate then passed.
- Existing Browserslist and interpreter diagnostic output appeared during tests but did not fail any gate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CORR-03-01 is closed. Plan 03-11 can remove the remaining Phase-3 `MemorySaveSystem` adapter and update its dedicated Node construction tests without changing CoreState's restored compatibility path.
- All Plan 03-10 replay and compatibility gates passed. `STATE.md` and `ROADMAP.md` intentionally remain untouched.

---
*Phase: 03-data-completion*
*Completed: 2026-09-11*

## Self-Check: PASSED

- Summary file exists.
- Task commits `e4e39f7` and `45e3b1f` are present in git history.
- Focused compatibility, replay, Node verifier, deleted-artifact, source-reference, and diff-check gates passed.
- Post-write self-check confirmed the summary path and both task commit hashes; unrelated `STATE.md` and `HANDOFF.json` changes remain unmodified.
