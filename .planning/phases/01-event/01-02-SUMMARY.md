---
phase: 01-event
plan: 02
subsystem: event-execution
tags: [typescript, events, anon-tokyo, dependency-injection, legacy-removal]
requires:
    - phase: 01-event/01-01
      provides: GameEventStore, map event views, and event-aware map persistence
provides:
    - EventExecutor with sequential async execution, cut modes, and return reduction
    - GameEventSystem with replaceable store wiring
    - CoreState event store and complete event system assembly
    - Removal of the legacy ITrigger implementation
affects: [01-03, hero-movement, event-builtins]
actuals:
    tokens: 7017
    tasks: 2
    commits: 0
plan_head_before: 6f6ed62b1b401a8e1d51207ba7b08c8e7935dfb2
tech-stack:
    added: []
    patterns:
        [
            lazy event-store reference,
            interface-led execution modes,
            complete system assembly
        ]
key-files:
    created:
        - packages-user/data-system/src/event/executor.ts
        - packages-user/data-system/src/event/system.ts
    modified:
        - packages-user/data-system/src/event/index.ts
        - packages-user/data-system/src/index.ts
        - packages-user/data-system/src/types.ts
        - packages-user/data-state/src/core.ts
        - packages/common/src/logger.json
key-decisions:
    - "Implemented the current user-authored EventExecuteMode and EventReduceMode interfaces instead of the plan's stale combined-mode assumptions."
    - 'Added warning code 172 because the existing reduction interface explicitly requires warnings for non-boolean values.'
patterns-established:
    - 'EventExecutor resolves every id through a lazy store callback so GameEventSystem.useStore takes effect immediately.'
    - 'CoreState assembles GameEventStore before constructing the complete GameEventSystem.'
requirements-completed: [EVT-01, EVT-02, EVT-03]
coverage:
    - id: D1
      description: 'EventExecutor and GameEventSystem implement the existing async execution, cut, reduction, and store-replacement contracts.'
      requirement: EVT-02
      verification:
          - kind: other
            ref: 'pnpm check:type filtered to data-system event files; focused ESLint/Prettier'
            status: pass
      human_judgment: false
    - id: D2
      description: 'CoreState owns an event store and complete event system while the legacy trigger implementation is removed.'
      requirement: EVT-03
      verification:
          - kind: other
            ref: 'legacy-symbol/path checks plus focused ESLint'
            status: pass
      human_judgment: false
duration: 11min
completed: 2026-09-08
status: complete
---

# Phase 01 Plan 02: Event Executor and System Assembly Summary

**Sequential async event execution with independent cut/reduction modes, replaceable store wiring, CoreState assembly, and legacy trigger removal**

## Performance

- **Duration:** 11 min
- **Started:** 2026-09-08T12:50:04Z
- **Completed:** 2026-09-08T13:00:48Z
- **Tasks:** 2
- **Implementation files created/modified/deleted:** 14

## Accomplishments

- Implemented `EventExecutor` against the current user-authored interface, including sequential `await`, missing-id recovery, cut modes, and independent return reduction.
- Implemented `GameEventSystem` with a complete executor/store/useStore assembly and a lazy store reference.
- Wired `GameEventStore` and `GameEventSystem` into `CoreState`, then removed trigger members from `IStateSystem`.
- Replaced the data-system trigger barrel with the event barrel and deleted all seven explicitly listed legacy files.

## Task Commits

| Task                                                         | Result          | Commit                                                                     |
| ------------------------------------------------------------ | --------------- | -------------------------------------------------------------------------- |
| 1. EventExecutor, GameEventSystem, barrels, and logger codes | Complete        | Intentionally skipped — project policy requires user review before commits |
| 2. Legacy trigger deletion and CoreState event assembly      | Complete        | Intentionally skipped — project policy requires user review before commits |
| Plan metadata                                                | Summary created | Intentionally skipped — project policy requires user review before commits |

All Plan 01-02 changes remain uncommitted for user review. `STATE.md` and `ROADMAP.md` were not updated by this executor.

## Files Created/Modified

- `packages-user/data-system/src/event/executor.ts` — Executes stored events sequentially, applies cut/reduction settings, and warns for missing ids or non-boolean reduction values.
- `packages-user/data-system/src/event/system.ts` — Owns the interpreter, executor, current event store, and store replacement wiring.
- `packages-user/data-system/src/event/index.ts` — Exports executor and system implementations alongside existing interfaces.
- `packages-user/data-system/src/index.ts` — Exports the event module instead of the removed trigger module.
- `packages-user/data-system/src/types.ts` — Removes trigger registry/collector members while retaining the user-authored event system member.
- `packages-user/data-state/src/core.ts` — Instantiates the event store and complete event system and removes trigger assembly.
- `packages/common/src/logger.json` — Adds code 171 for unknown event ids and code 172 for non-boolean reduction values while preserving prior user changes.

`packages-user/data-system/src/event/types.ts` was reviewed and preserved unchanged: its user-authored `Promise<R>` return type and independent execute/reduce interfaces were already present.

## Files Deleted

- `packages-user/data-system/src/trigger/types.ts`
- `packages-user/data-system/src/trigger/trigger.ts`
- `packages-user/data-system/src/trigger/registry.ts`
- `packages-user/data-system/src/trigger/collector.ts`
- `packages-user/data-system/src/trigger/collection.ts`
- `packages-user/data-system/src/trigger/index.ts`
- `packages-user/data-state/src/content/triggers.ts`

## Verification

- **Task 1 focused type check:** Passed with no matching errors in event types/executor/system/barrels.
- **Task 2 focused type check:** `data-system/src/types.ts` passed. `core.ts` still reports two known `TileStore.getTrigger` incompatibilities originating in out-of-plan store interfaces/implementation.
- **Focused ESLint and Prettier:** Passed for all Plan 01-02 TypeScript and logger files.
- **Legacy removal checks:** The trigger directory and `content/triggers.ts` do not exist; no legacy trigger symbols remain in data-system, `core.ts`, or data-state content.
- **Full `pnpm check:type`:** Ran. It remains red in deferred client, `tileStore.ts`, Plan 01-03 `moverImpl.ts`, legacy integration files, and the two derived `core.ts` TileStore errors. No event executor/system or data-system interface errors were reported.
- **`pnpm check:circular`:** Ran and reported 18 existing/Plan 01-01 dependency cycles; none traverses the new data-system event executor/system files.
- **`git diff --check`:** Passed for implementation changes; only pre-existing line-ending notices for user-owned planning files were printed.
- **Tests:** Not run because the repository currently contains no test files; verification used focused type/lint/static checks as directed.

## Deviations from Plan

### Existing Interface Authority

**1. Implemented the current split execute/reduce contract**

- **Found during:** Task 1 required-file reread.
- **Issue:** The plan assumed stale combined `EventExecuteMode` members, while the user-authored interface defines `Normal`/cut execution modes plus independent `EventReduceMode` and `setReduce`.
- **Resolution:** Preserved the interface and implemented exactly its existing public members; no unapproved public API was added or changed.
- **Commit:** Intentionally skipped per user review policy.

**2. Promise return change was already present**

- **Found during:** Task 1 required-file reread.
- **Issue:** The planned single-line `execute` return change had already been made by the user.
- **Resolution:** Left `event/types.ts` unchanged and implemented `Promise<R>` in the executor.
- **Commit:** Intentionally skipped per user review policy.

### Auto-fixed Issues

**3. [Rule 2 - Interface correctness] Added a reduction warning code**

- **Found during:** Task 1 implementation.
- **Issue:** The existing interface requires a warning when reduction receives a non-boolean value, but the plan allocated only the unknown-id code.
- **Fix:** Added unique warning code 172 and emitted it without changing reduction semantics.
- **Files modified:** `event/executor.ts`, `logger.json`
- **Verification:** Focused type/lint checks passed.
- **Commit:** Intentionally skipped per user review policy.

**Total deviations:** 3 (2 interface-authority adjustments, 1 correctness addition). No scope expansion or unapproved public-interface changes.

## Known Stubs

None found in files created or modified by this plan. Empty interpreter built-ins are intentional and explicitly deferred by the plan.

## Blockers

None for Plan 01-02. Full-project type and circular checks remain blocked by work assigned to Plan 01-03, Plan 01-01 follow-up, or other out-of-plan legacy/client areas.

## User Setup Required

None.

## Next Phase Readiness

- Plan 01-03 can replace `moverImpl.ts` trigger imports and dispatch with event collection/execution.
- The event system is fully assembled and exported; built-in functions remain intentionally deferred to later wrap-up work.

## Self-Check: PASSED

- All seven implementation outputs and this summary exist; all seven planned legacy files are absent.
- Focused event type checks and all focused lint/format checks pass.
- Git HEAD remains `6f6ed62b1b401a8e1d51207ba7b08c8e7935dfb2`; no commits were created.
- Existing Plan 01-01/user working-tree changes remain present, and `ROADMAP.md` has no executor change.
- `STATE.md` and `ROADMAP.md` were not updated by this executor.

---

_Phase: 01-event_
_Completed: 2026-09-08_
