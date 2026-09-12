---
phase: 01-event
plan: 05
subsystem: event-contract-decisions
tags: [typescript, events, raw-event, event-store, circular-dependencies, planning]
requires:
  - phase: 01-event/01-03
    provides: Existing event source, event execution, and eventStore implementation context
provides:
  - Exact user-approved rawEvent compatibility contract
  - Exact eventStore circular-dependency deferral and baseline paths
  - Downstream blocker record for the unchanged 01-08 implementation assumptions
affects: [01-08, phase-01-verification]
actuals:
  tokens: 4700
  tasks: 2
  commits: 0
  plan_head_before: 6f6ed62b1b401a8e1d51207ba7b08c8e7935dfb2
tech-stack:
  added: []
  patterns:
    - User-owned event contracts are recorded verbatim before implementation.
    - Existing circular dependencies may remain explicit phase baselines when the user declines an architectural change.
key-files:
  created:
    - .planning/phases/01-event/01-05-SUMMARY.md
  modified:
    - .planning/STATE.md
    - .planning/ROADMAP.md
    - .planning/WINDOWS.md
key-decisions:
  - "rawEvent remains exactly current behavior: public Statement[], constructor/setRaw alias the caller array, and no defensive copy, unknown type, or cache-safety change is authorized."
  - "IGameEvent.execute keeps the generic Promise<R> contract and event.ts keeps its current as Promise<R> adapters for anon-tokyo Promise<unknown> results."
  - "eventStore circular dependencies are not fixed in this plan; current imports and behavior remain unchanged, and the exact check:circular paths are deferred as the Phase 01 baseline."
patterns-established:
  - "Decision-only plans record the approved public contract and explicitly mark implementation verification as downstream."
requirements-completed: [EVT-01]
coverage:
  - id: D1
    description: "The public rawEvent aliasing and generic Promise<R> contract are recorded exactly as currently implemented."
    verification:
      - kind: other
        ref: "User decision supplied in execution request; current types.ts and event.ts inspected"
        status: pass
    human_judgment: true
    rationale: "This is an explicit user-owned API compatibility decision; automation cannot select the contract."
  - id: D2
    description: "The eventStore circular paths are recorded as a deferred Phase 01 baseline without changing imports or behavior."
    verification:
      - kind: other
        ref: "pnpm check:circular"
        status: pass
    human_judgment: true
    rationale: "The command intentionally reports the preserved baseline; whether to repair it is an architectural user decision."
duration: 17min
completed: 2026-09-08
status: complete
---

# Phase 01 Plan 05: Event Contract Decisions Summary

**Raw event compatibility and eventStore cycle deferral recorded without modifying implementation or creating a commit**

## Performance

- **Duration:** 17 min
- **Started:** 2026-09-08T15:19:00Z
- **Completed:** 2026-09-08T15:36:50Z
- **Tasks:** 2 decision records
- **Files modified by this plan:** 1 summary file; planning state/roadmap and broken-windows ledger refreshed; 0 implementation files

## Accomplishments

- Recorded that `rawEvent` remains a public mutable `Statement[]` property, with constructor and `setRaw` retaining caller-array aliases exactly as current behavior.
- Recorded that the generic `Promise<R>` public return contract and all current `as Promise<R>` adapters remain unchanged; no `unknown`, defensive copy, or cache-safety change is authorized by this plan.
- Ran `pnpm check:circular` and recorded the eventStore paths as an intentional Phase 01 baseline. No import edge, eventStore behavior, or duplicate-id warning behavior was changed.

## Task Commits

No task commits were created, per the explicit user instruction not to create git commits. No downstream plan was executed.

## Files Created/Modified

- `.planning/phases/01-event/01-05-SUMMARY.md` — Records the two explicit user decisions, the circular baseline, and downstream blockers.
- `.planning/STATE.md` — Planning state refreshed after this decision-recording plan.
- `.planning/ROADMAP.md` — Phase plan progress refreshed after this decision-recording plan.
- `.planning/WINDOWS.md` — Records the intentionally unrun downstream verification.

No implementation files were modified.

## Decisions Made

### 1. Preserve the rawEvent contract exactly

The public type remains `Statement[]`, not a readonly or defensive view. The constructor continues to store the input array by alias, and `setRaw` continues to store its input array by alias while invalidating `compiled` as current behavior does. This plan does not add defensive copies, `unknown`, cache-safety changes, new getters/setters, or new public members.

`IGameEvent.execute` continues to declare generic `Promise<R>`. The three current `as Promise<R>` adapters in `event.ts` remain authorized to bridge anon-tokyo's `Promise<unknown>` return type. The downstream no-`as` and immutable-source requirements in the original gap plan are therefore not approved by this decision record.

### 2. Preserve eventStore circular dependencies as baseline

The current imports and runtime behavior remain unchanged. `GameEventStore` continues to implement `IGameEventStore`, use `logger.warn(170, id)` for duplicate ids, overwrite the duplicate, and return events by id. This plan does not select a leaf import, interface relocation, reverse-dependency correction, or any other architectural cycle-breaking edge.

The exact `pnpm check:circular` output observed on 2026-09-08 reported 18 cycles. The two paths involving the eventStore introduced by the current implementation are:

9. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/store/index.ts > ../packages-user/data-common/src/store/eventStore.ts > ../packages-user/data-common/src/store/types.ts`
10. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/store/index.ts > ../packages-user/data-common/src/store/eventStore.ts`

For completeness, the remaining 16 reported paths are also preserved as the same phase baseline:

1. `../packages-user/data-common/src/common/index.ts > ../packages-user/data-common/src/common/face.ts`
2. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/common/index.ts > ../packages-user/data-common/src/common/face.ts`
3. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/common/index.ts > ../packages-user/data-common/src/common/indexer.ts`
4. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/common/index.ts > ../packages-user/data-common/src/common/mover.ts`
5. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/replay/index.ts > ../packages-user/data-common/src/replay/array.ts > ../packages-user/data-common/src/replay/types.ts`
6. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/replay/index.ts > ../packages-user/data-common/src/replay/array.ts > ../packages-user/data-common/src/save/index.ts > ../packages-user/data-common/src/save/system.ts`
7. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/replay/index.ts > ../packages-user/data-common/src/replay/array.ts`
8. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/replay/index.ts > ../packages-user/data-common/src/replay/sandbox.ts`
11. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/store/index.ts > ../packages-user/data-common/src/store/itemStore.ts`
12. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/store/index.ts > ../packages-user/data-common/src/store/tileStore.ts`
13. `../packages/common/src/index.ts > ../packages/common/src/utils/index.ts > ../packages/common/src/utils/dir.ts > ../packages/common/src/utils/types.ts > ../packages-user/data-common/src/index.ts > ../packages-user/data-common/src/types.ts`
14. `../packages/render/src/core/event.ts > ../packages/render/src/core/types.ts`
15. `../packages/render/src/core/index.ts > ../packages/render/src/core/graphics.ts`
16. `../packages/render/src/core/index.ts > ../packages/render/src/core/misc.ts`
17. `../packages-user/data-state/src/core.ts > ../packages-user/data-state/src/enemy/index.ts > ../packages-user/data-state/src/enemy/calculator.ts > ../packages-user/data-state/src/ins.ts`
18. `../packages-user/data-state/src/index.ts > ../packages-user/data-state/src/core.ts > ../packages-user/data-state/src/legacy/index.ts > ../packages-user/data-state/src/legacy/move.ts`

## Deviations from Plan

The original plan asked the user to choose a cycle-breaking edge and to approve an immutable raw-event/no-assertion contract. The explicit user decisions instead preserve both current behaviors. This plan therefore records decisions only and intentionally does not perform the proposed implementation work.

## Verification

- `pnpm check:circular` ran successfully as a diagnostic command and reported 18 circular dependencies with exit code 1; this is the expected preserved baseline, not a failure of the decision record.
- Current `types.ts`, `event.ts`, `eventStore.ts`, and related import files were inspected; no implementation files were edited.
- Downstream behavior tests and implementation verification were not run because the user explicitly prohibited downstream plan execution and implementation changes.

## Blockers and Deferred Work

- The original 01-08 Task 1 must-haves (immutable aliases, cache-safety changes, and removal of `as Promise<R>`) conflict with the approved contract and require a revised plan or a future user decision before implementation.
- The original 01-08 Task 2 circular-gate criterion conflicts with the approved eventStore baseline. Any future plan that preserves these imports must not claim that the eventStore paths are absent from `check:circular`.
- No downstream plans were executed.

## User Setup Required

None.

## Next Phase Readiness

The exact current rawEvent and execute contracts are available to future planning. The eventStore dependency cycles are explicitly deferred as baseline. Implementation work must not be started from the original 01-08 assumptions until that plan is reconciled with this summary.

## Self-Check: PASSED

- `.planning/phases/01-event/01-05-SUMMARY.md` exists.
- No implementation files were modified by this plan.
- Git HEAD remains `6f6ed62b1b401a8e1d51207ba7b08c8e7935dfb2`; no commit was created.
- No downstream plan was executed.

---
*Phase: 01-event*
*Completed: 2026-09-08*
