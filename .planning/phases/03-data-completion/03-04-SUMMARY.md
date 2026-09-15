---
phase: 03-data-completion
plan: 04
subsystem: data-state-replay
tags: [node, replay, verifier, snapshots, vitest]

requires:
  - phase: 03-data-completion
    provides: Node-safe CoreState factory, approved event built-ins, and stable top-level replay registry
provides:
  - Approved verifier-local first-divergence thrown diagnostic contract
  - Fixed multi-floor replay fixture with full hero and map-layer snapshots
  - Dedicated deterministic pnpm test:data-node process gate
  - Focused verifier and CoreState factory regression coverage
affects: [03-05, phase-4-render-adaptation]

actuals:
  tokens: 9626
  tasks: 3
  commits: 4
  plan_head_before: 4b644283f29d4c243021f0846d21aeacf1dce7f4
plan_head_before: 4b644283f29d4c243021f0846d21aeacf1dce7f4
commits: 4

tech-stack:
  added: []
  patterns:
    - Node runner imports the concrete CoreState path and uses a package-local verifier harness for Vitest injection
    - Replay diagnostics preserve original primitive parameters while formatting them deterministically and safely
    - Final acceptance compares hero attributes and every floor/layer Uint32Array only after normal sandbox end

key-files:
  created:
    - .planning/phases/03-data-completion/03-REPLAY-DIAGNOSTICS.md
    - script/test-data-node.ts
    - packages-user/data-state/test/coreNode.test.ts
    - packages-user/data-state/test/nodeReplay.test.ts
    - packages-user/data-state/test/replayVerifier.ts
  modified:
    - packages-user/data-state/test/fixtures/closed-loop.ts
    - packages-user/data-common/src/replay/array.ts
    - package.json

key-decisions:
  - "The approved first-divergence mechanism is an implementation-local thrown error with index, stable enum code, original params, and readable reason; replay commands remain Promise<boolean>."
  - "The fixed fixture uses CoreState's top-level replay registry and compares only end-of-replay hero and all map matrices."
  - "A package-local verifier harness is shared by Vitest and the dedicated Node entry so composite project boundaries do not change the runtime contract."

patterns-established:
  - "Verifier diagnostics are local to the Node/test harness and do not introduce public error classes or result-object APIs."
  - "Node replay failures stop before later route commands and return non-zero through the process entry."

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "The fixed fixture initializes two explicit floors, records an approved player movement, awaits event-driven map mutation, and stores full expected hero/map snapshots."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "pnpm test:data-node"
        status: pass
      - kind: integration
        ref: "repeat pnpm test:data-node twice; exit status and output matched"
        status: pass
    human_judgment: false
  - id: D2
    description: "Unknown, false, thrown, hero mismatch, and map matrix mismatch branches throw the first local diagnostic and stop later commands."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/nodeReplay.test.ts (6 tests)"
        status: pass
      - kind: unit
        ref: "pnpm exec vitest run packages-user/data-state/test/nodeReplay.test.ts packages-user/data-state/test/coreNode.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Two independent no-argument CoreState instances remain Node-safe and do not share mutable hero, map, event-store, or save-system state."
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "packages-user/data-state/test/coreNode.test.ts (2 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The four data packages remain green after replay-array parameter fidelity and verifier additions."
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state (17 files, 92 tests)"
        status: pass
    human_judgment: false

duration: 52 min
completed: 2026-09-10
status: complete
---

# Phase 3 Plan 4: Replay Verifier Summary

**Fixed Node replay verification now reports deterministic first divergence and performs exact end-only hero/all-map snapshot acceptance**

## Performance

- **Duration:** 52 min
- **Started:** 2026-09-10T08:26:00Z
- **Completed:** 2026-09-10T09:19:00Z
- **Tasks:** 3
- **Files modified:** 8 implementation/test/planning files, plus the verifier harness

## Accomplishments

- Recorded the approved `approve-locked-contract` decision without inventing a public replay error mechanism or changing `Promise<boolean>`.
- Extended the closed-loop fixture to two explicit floors and every standard layer, with initial hero/flags/maps/enemy save state, a fixed registered route, and literal expected hero/map matrices.
- Added `pnpm test:data-node`, a direct Node verifier that stops at the first unknown/false/throw divergence and reports index, stable code, original params, and readable reason.
- Added end-only exact comparison for `hero.attribute.toStructured()` and every map layer `getMapData()` matrix.
- Added focused success/failure regression tests and independent Node factory tests.

## Task Commits

Each task was committed atomically:

1. **Task 1: 批准首分歧 thrown diagnostic 与输出字段** - `ebf6c19` (docs)
2. **Task 2: 固定闭环 fixture 与首分歧 Node verifier** - `c060938` (feat)
3. **Task 3: Node replay verifier regression tests** - `1218504` (test)
4. **Task 3 follow-up: shared package-local verifier harness** - `704e23f` (fix)

**Plan metadata:** pending summary metadata commit

## Files Created/Modified

- `.planning/phases/03-data-completion/03-REPLAY-DIAGNOSTICS.md` - approved local thrown diagnostic contract
- `packages-user/data-state/test/fixtures/closed-loop.ts` - fixed two-floor route, reset state, expected hero/maps
- `script/test-data-node.ts` - direct Node process entry and live-state snapshot adapter
- `packages-user/data-state/test/replayVerifier.ts` - injectable verifier runtime and local diagnostics
- `packages-user/data-state/test/nodeReplay.test.ts` - success and first-divergence regression cases
- `packages-user/data-state/test/coreNode.test.ts` - factory isolation and Node-safe construction regressions
- `packages-user/data-common/src/replay/array.ts` - corrected multi-parameter route encoding required to preserve diagnostic params
- `package.json` - dedicated `test:data-node` script

## Decisions Made

- Kept the approved diagnostic local to the verifier; no public error class, public diagnostic interface, result-object API, or replay command contract change was introduced.
- Used the top-level Plan 03 replay registry rather than the former private direct command tracer.
- Kept final map validation end-only while allowing fake runtimes to inject route, command, and expected snapshot data in focused tests.
- Did not modify `STATE.md` or `ROADMAP.md`, per user instruction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Repaired ReplayArray parameter encoding**

- **Found during:** Task 3 (diagnostic parameter regression)
- **Issue:** Mixed replay parameters were overwritten or decoded with incorrect lengths, so thrown diagnostics could not report original params.
- **Fix:** Advanced the parameter write cursor and corrected bigint/string byte lengths and decoding offsets.
- **Files modified:** `packages-user/data-common/src/replay/array.ts`
- **Verification:** `nodeReplay.test.ts` deterministic parameter assertions and full data suite passed
- **Committed in:** `1218504`

**2. [Rule 3 - Blocking] Added a package-local verifier harness for Vitest**

- **Found during:** Task 3 verification
- **Issue:** Vitest could not import the composite `script/` project directly through Node package aliases, while the direct Node entry remained required.
- **Fix:** Moved the injectable verifier runtime and comparison logic into `packages-user/data-state/test/replayVerifier.ts`; the Node script remains the process entry and loads the same harness.
- **Files modified:** `packages-user/data-state/test/replayVerifier.ts`, `script/test-data-node.ts`, `packages-user/data-state/test/nodeReplay.test.ts`
- **Verification:** focused Vitest suite, direct Node runner, repeated output gate, and full data suite passed
- **Committed in:** `704e23f`

**3. [Rule 3 - Blocking] Applied repository formatting**

- **Found during:** Task 2 lint verification
- **Issue:** New files initially used LF formatting and failed the repository's CRLF/Prettier rule.
- **Fix:** Ran scoped Prettier formatting before lint and commit.
- **Files modified:** fixture, runner, package manifest, and focused tests
- **Verification:** scoped ESLint and Prettier checks passed
- **Committed in:** `c060938` / `1218504`

---

**Total deviations:** 3 auto-fixed (1 Rule 1 bug, 2 Rule 3 blocking issues)
**Impact on plan:** All deviations were required for deterministic diagnostics, testability, or repository quality gates; no public replay API or user-facing error contract was expanded.

## Issues Encountered

- `pnpm check:type` remains non-zero only on pre-existing client/legacy/render export and type diagnostics outside this plan's files. No Plan 03-04-owned type errors remain.
- Existing test warnings remain expected and do not fail the data suite.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03-05 can consume the deterministic Node gate and its focused diagnostics while preserving the approved replay registry and data-layer boundaries.
- The dedicated runner is ready for CI triage: normal replay exits zero; first divergence exits non-zero with deterministic index/code/params/reason.
- `STATE.md` and `ROADMAP.md` remain intentionally unchanged.

---
*Phase: 03-data-completion*
*Completed: 2026-09-10*

## Self-Check: PASSED

- Summary, diagnostic record, fixture, runner, verifier harness, tests, replay-array fix, and package script exist on disk.
- Task commits `ebf6c19`, `c060938`, `1218504`, and `704e23f` are present in git history.
- Focused verifier tests, full data suite, dedicated Node gate, repeated deterministic Node gate, lint, and formatting checks passed.
- `STATE.md` and `ROADMAP.md` were not modified per user instruction.
