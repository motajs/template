---
phase: "01"
slug: "event"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-08"
---

# Phase 01 - Validation Strategy

## Current Validation State

Plans 01-04 through 01-10 are executable gap-closure plans, but their checkpoint outputs, tests, and implementation have not run. Every row below therefore remains `pending`; this file does not claim behavioral success.

The installed GSD SDK currently returns `sdk_unknown_command` for both verify-command path resolution and failing-direction probes. Paths and commands below were manually grounded against the root scripts and current/planned file ownership, but deterministic SDK probe success is unavailable and must not be inferred.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | none - root `package.json` provides the test script |
| **Quick run command** | The focused `pnpm exec vitest run "<file>" -t "<behavior>"` command from the active task |
| **Focused phase behavior command** | `pnpm exec vitest run "packages-user/data-common/src/store/eventStore.test.ts" "packages-user/data-base/src/map/eventPath.test.ts" "packages-user/data-base/src/map/mapLifecycle.test.ts" "packages-user/data-system/src/event/eventDispatch.test.ts"` |
| **Static aggregate command** | None added by revised 01-08/01-09; the preserved eventStore cycle is not a failure condition |
| **Runtime target** | under 60 seconds per focused task command; not yet measured |

## Sampling Rate

- **After every task:** Run that task's exact `<automated>` command.
- **After plans 01-06, 01-07, 01-08, and 01-10:** Run the complete newly created test file, not only its named `-t` slice.
- **Before `/gsd-verify-work`:** Run 01-09's Low/High point-event-only aggregation behavior command; do not add a production-registration or cycle-removal gate.
- **Max feedback latency target:** 60 seconds; pending measurement during execution.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Behavior / Static Property | Test Type | Automated Command | Artifact State | Status |
|---------|------|------|-------------|------------|----------------------------|-----------|-------------------|----------------|--------|
| 01-01-01 | 01 | 1 | EVT-01 | T-01-01 | Duplicate priorities warn without throwing | type/static | `pnpm check:type` with Plan 01 file filter | completed plan; prior static evidence only | pending re-check |
| 01-02-01 | 02 | 2 | EVT-02 | T-02-01 | Unknown event ids warn and are skipped | type/static | `pnpm check:type` with Plan 02 file filter | completed plan; prior static evidence only | pending re-check |
| 01-03-01 | 03 | 3 | EVT-02, EVT-03 | T-03-01 | Movement dispatch tolerates unknown ids and old trigger symbols are absent | type/static | `pnpm check:type` with Plan 03 file filter | completed plan; prior static evidence only | pending re-check |
| 01-04-01 | 04 | 4 | EVT-01, EVT-02 | T-01-04-01 | Production initialization decision is based on the still-current addEvent/CoreState seam | checkpoint preflight | `if (!(Test-Path "packages-user/data-common/src/store/types.ts") -or !(Test-Path "packages-user/data-state/src/core.ts")) { exit 1 }; if (!(Select-String -Path "packages-user/data-common/src/store/types.ts" -Pattern "addEvent" -Quiet)) { exit 1 }` | source exists; decision summary not produced | pending |
| 01-04-02 | 04 | 4 | EVT-02 | T-01-04-01 | Source-aware dispatch decision is based on the current single-env seam | checkpoint preflight | `if (!(Select-String -Path "packages-user/data-system/src/event/types.ts" -Pattern "events: string\[\]" -Quiet)) { exit 1 }; if (!(Select-String -Path "packages-user/data-state/src/hero/moverImpl.ts" -Pattern "BlockEventType.TileEvent" -Quiet)) { exit 1 }` | source exists; decision summary not produced | pending |
| 01-04-03 | 04 | 4 | EVT-01, EVT-02 | T-01-04-02 | Point persistence decision is made only while IMapLayerSave still lacks its approved field | checkpoint preflight | `$content = Get-Content -Raw "packages-user/data-base/src/map/types.ts"; if ($content -notmatch "interface IMapLayerSave") { exit 1 }; if ($content -match "pointEvents\??:") { exit 1 }` | source exists; decision summary not produced | pending |
| 01-05-01 | 05 | 4 | EVT-01 | T-01-05-01, T-01-05-03 | Immutable source and no-assertion return decisions are grounded in current interfaces | checkpoint preflight | `if (!(Select-String -Path "packages-user/data-common/src/event/types.ts" -Pattern "readonly rawEvent: Statement\[\]" -Quiet)) { exit 1 }; if (!(Select-String -Path "packages-user/data-common/src/event/event.ts" -Pattern "this.rawEvent = raw" -Quiet)) { exit 1 }; if (!(Select-String -Path "node_modules/anon-tokyo/dist/index.d.ts" -Pattern "Promise\x3Cunknown\x3E" -Quiet)) { exit 1 }; if (!(Select-String -Path "packages-user/data-common/src/event/event.ts" -Pattern "\bas\s+Promise" -Quiet)) { exit 1 }` | source exists; decision summary not produced | pending |
| 01-05-02 | 05 | 4 | EVT-01 | T-01-05-02 | Current circular report still exposes the eventStore path before the user selects a cut edge | checkpoint preflight | `$output = pnpm check:circular 2>&1; if ($output -notmatch "circular dependenc") { $output; exit 1 }; if ($output -notmatch "store/eventStore\.ts") { $output; exit 1 }` | current source exists; decision summary not produced | pending |
| 01-06-01 | 06 | 5 | EVT-01, EVT-02 | T-01-06-01 | Valid raw point ids enter the point view and event alias selects eventLayer | behavior | `pnpm exec vitest run "packages-user/data-base/src/map/eventPath.test.ts" -t "raw point events and event layer"` | test created by task | pending |
| 01-06-02 | 06 | 5 | EVT-01, EVT-02, EVT-03 | T-01-06-01, T-01-06-02, T-01-06-03 | Malformed event containers fail before map registration with matching logger codes | behavior | `pnpm exec vitest run "packages-user/data-base/src/map/eventPath.test.ts" -t "malformed raw event structures"` | test created by task | pending |
| 01-07-01 | 07 | 6 | EVT-02, EVT-03 | T-01-07-01, T-01-07-02 | Matching point/static/dynamic events execute in source-correct order and await sequentially | behavior | `pnpm exec vitest run "packages-user/data-system/src/event/eventDispatch.test.ts" -t "source-aware matching dispatch"` | test created by task | pending |
| 01-07-02 | 07 | 6 | EVT-02, EVT-03 | T-01-07-03 | Cut/reduce and enter/leave/hit behavior cover only executed matching events | behavior | `pnpm exec vitest run "packages-user/data-system/src/event/eventDispatch.test.ts"` | test created by 01-07-01 | pending |
| 01-08-01 | 08 | 5 | EVT-01 | T-01-08-01 | Public-barrel GameEventStore add/get/unknown/duplicate warning and overwrite behavior | behavior | `pnpm exec vitest run "packages-user/data-common/src/store/eventStore.test.ts"` | test created by task | pending |
| 01-09-01 | 09 | 7 | EVT-01 | T-01-09-01, T-01-09-02 | GameMap retains a layer whose only serialized content is dirty pointEvents | behavior | `pnpm exec vitest run "packages-user/data-base/src/map/mapLifecycle.test.ts" -t "map saves layers containing only point events"` | test extended by task | pending |
| 01-09-02 | 09 | 7 | EVT-01 | T-01-09-01, T-01-09-02 | Low/High compression both preserve point-event-only layer aggregation | behavior | `pnpm exec vitest run "packages-user/data-base/src/map/mapLifecycle.test.ts" -t "map saves layers containing only point events"` | test extended by task | pending |
| 01-10-01 | 10 | 5 | EVT-01, EVT-02, EVT-03 | T-01-10-01, T-01-10-02 | Raw defaults, stable snapshots, untouched dynamic save/load baseline, conversion, and point-coordinate ownership hold | behavior | `pnpm exec vitest run "packages-user/data-base/src/map/mapLifecycle.test.ts" -t "tile defaults snapshots conversion and movement"` | test created by task | pending |
| 01-10-02 | 10 | 5 | EVT-01, EVT-02, EVT-03 | T-01-10-03 | Point dirty/save/load/reset/resize follows the approved persistence contract | behavior | `pnpm exec vitest run "packages-user/data-base/src/map/mapLifecycle.test.ts" -t "point event lifecycle"` | test created by 01-10-01 | pending |

## Static and Aggregate Gate Map

| Gate | Owning Task | Passing Condition | Current Evidence |
|------|-------------|-------------------|------------------|
| GameEventStore behavior regression | 01-08-01 | Public-barrel test passes for add/get/null/duplicate warning 170 and overwrite | not run |
| GameMap point-event aggregation | 01-09-01, 01-09-02 | Low/High focused test retains point-event-only layer save | not run |
| Existing focused lint/type baselines | prior plans | Existing plan-owned checks remain authoritative; revised 01-09 adds no broad gate | recorded in prior summaries |
| Registration/cycle boundary | 01-08-01, 01-09-01 | No acceptance gate requires production registration or eventStore cycle removal | locked deferral |

## Wave 0 Requirements

- [ ] Plan 01-06 creates `packages-user/data-base/src/map/eventPath.test.ts` before its first behavior verification.
- [ ] Plan 01-07 creates `packages-user/data-system/src/event/eventDispatch.test.ts` before its first behavior verification.
- [ ] Plan 01-08 creates `packages-user/data-common/src/store/eventStore.test.ts` before its verification; rawEvent and cycle repair remain deferred.
- [ ] Plan 01-10 creates `packages-user/data-base/src/map/mapLifecycle.test.ts`, including the untouched dynamic default-event round-trip, before its verifications.
- [ ] Plan 01-09 extends `packages-user/data-base/src/map/mapLifecycle.test.ts` before its aggregation verification; production registration remains deferred.
- [ ] The focused phase command discovers the existing eventStore, map-ingestion, map-lifecycle, and dispatch tests and exits successfully.

## Manual-Only Verifications

No revised 01-08/01-09 acceptance behavior is manual-only. The external Blockly editor, concrete dialogue/open-door built-ins, serialized production registration, and map-id binding remain outside this executable scope; 01-09 owns only automated GameMap point-event aggregation.

## Validation Sign-Off

- [ ] All decision checkpoints produced their required SUMMARY contracts.
- [ ] All planned test files exist and are discovered.
- [ ] Every focused task command passed in its owning wave.
- [ ] 01-09 Low/High point-event-only aggregation commands passed without adding registration or cycle-removal gates.
- [ ] Deterministic verify-path and failing-direction probe results are available, or their SDK limitation remains explicitly recorded without claiming success.
- [ ] Measured focused feedback latency is below 60 seconds.
- [ ] `nyquist_compliant: true` is set only after the above evidence exists.

**Approval:** pending execution evidence
