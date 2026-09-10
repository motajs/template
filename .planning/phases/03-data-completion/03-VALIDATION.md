---
phase: "03"
slug: "data-completion"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-10"
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` |
| **Full suite command** | `& pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & pnpm test:data-node; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & pnpm exec tsx script/check-data-type.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & pnpm exec tsx script/check-data-circular.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state`
- **After every plan wave:** Run the full suite command above
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DATA-01 | T-03-02, T-03-03 | Exact singleton/barrel back-edges are absent before fresh CoreState construction | dependency/integration | `pnpm exec madge --json --extensions ts packages-user/data-state/src/enemy/calculator.ts packages-user/data-state/src/legacy/move.ts` plus direct `createCoreState()` probe | ✅ source | ⬜ pending |
| 03-01-02 | 01 | 1 | DATA-01 | T-03-01, T-03-03 | Fixed Node tracer awaits movement and event mutation without browser globals | integration | `pnpm exec vitest run packages-user/data-state/test/nodeTracer.test.ts` | ❌ planned | ⬜ pending |
| 03-02-01 | 02 | 2 | DATA-01 | T-03-04 | All eight approved built-in contracts are recorded before implementation | contract checkpoint | `Get-Content -Raw .planning/phases/03-data-completion/03-EVENT-CONTRACT.md` field/name assertion | ❌ planned | ⬜ pending |
| 03-02-02 | 02 | 2 | DATA-01 | T-03-04, T-03-05 | Approved event built-ins mutate only intended data state and safely await actions | unit/integration | `pnpm exec vitest run packages-user/data-state/src/event/event.test.ts packages-user/data-system/src/event/eventDispatch.test.ts` | ❌ planned | ⬜ pending |
| 03-03-01 | 03 | 3 | DATA-01 | T-03-06 | Replay enum ownership, order, and access boundary are recorded | contract checkpoint | `Get-Content -Raw .planning/phases/03-data-completion/03-REPLAY-CONTRACT.md` order/field assertion | ❌ planned | ⬜ pending |
| 03-03-02 | 03 | 3 | DATA-01 | T-03-06, T-03-07 | Async replay decorators and module command items preserve completion and failure | unit | `pnpm exec vitest run packages-user/data-state/src/replay/commands.test.ts` | ❌ planned | ⬜ pending |
| 03-03-03 | 03 | 3 | DATA-01 | T-03-06, T-03-07 | CoreState owns one ordered eight-command registry and the compatibility barrel remains reachable | unit/integration | `pnpm exec vitest run packages-user/data-state/src/replay/commands.test.ts` and the focused four-package suite | ❌ planned | ⬜ pending |
| 03-04-01 | 04 | 4 | DATA-01 | T-03-09 | First-divergence thrown diagnostic fields and stop policy are recorded | contract checkpoint | `Get-Content -Raw .planning/phases/03-data-completion/03-REPLAY-DIAGNOSTICS.md` field assertion | ❌ planned | ⬜ pending |
| 03-04-02 | 04 | 4 | DATA-01 | T-03-08, T-03-09, T-03-10 | Dedicated Node replay stops at the first divergence and compares end snapshots | integration/process | `pnpm test:data-node` | ❌ planned | ⬜ pending |
| 03-04-03 | 04 | 4 | DATA-01 | T-03-09, T-03-10 | Success and unknown/false/throw/snapshot mismatch branches are deterministic | unit/integration | `pnpm exec vitest run packages-user/data-state/test/nodeReplay.test.ts packages-user/data-state/test/coreNode.test.ts` | ❌ planned | ⬜ pending |
| 03-05-01 | 05 | 5 | DATA-01 | T-03-15 | D-20 common/data-common cycle closure contract is approved | contract checkpoint | `Get-Content -Raw .planning/phases/03-data-completion/03-COMMON-CYCLE-CONTRACT.md` boundary assertion | ❌ planned | ⬜ pending |
| 03-05-02 | 05 | 5 | DATA-01 | T-03-11, T-03-15 | Scoped type and transitive circular gates fail closed on in-scope diagnostics | static analysis | `pnpm exec tsx script/check-data-circular.ts` then `pnpm exec tsx script/check-data-type.ts` | ❌ planned | ⬜ pending |
| 03-05-03 | 05 | 5 | DATA-01 | T-03-11, T-03-12 | Focused DATA-01 closure and final data-side gates are deterministic | integration/quality gate | `pnpm test:ci packages-user/data-common packages-user/data-base packages-user/data-system packages-user/data-state` plus Node/type/circular/lint/Prettier gates | ❌ planned | ⬜ pending |
| 03-06-01 | 06 | 2 | DATA-01 | T-03-14 | TileStore exposes the approved events map and safe lookup behavior | unit | `pnpm exec vitest run packages-user/data-common/src/store/tileStore.test.ts` | ❌ planned | ⬜ pending |
| 03-06-02 | 06 | 2 | DATA-01 | T-03-13 | Legacy conversion preserves the events map and every `it` has the required Chinese coverage comment | unit/static | comment assertion plus `pnpm exec vitest run packages-user/data-state/test/tileLegacy.test.ts packages-user/data-common/src/store/tileStore.test.ts` | ❌ planned | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.planning/phases/03-data-completion/03-EVENT-CONTRACT.md` — approved eight built-in contract record
- [ ] `.planning/phases/03-data-completion/03-REPLAY-CONTRACT.md` — approved stable replay command record
- [ ] `.planning/phases/03-data-completion/03-REPLAY-DIAGNOSTICS.md` — approved first-divergence diagnostic record
- [ ] `.planning/phases/03-data-completion/03-COMMON-CYCLE-CONTRACT.md` — approved D-20 cycle-closure record
- [ ] `packages-user/data-state/test/nodeTracer.test.ts` — Node construction and replay tracer tests
- [ ] `packages-user/data-state/test/fixtures/closed-loop.ts` — deterministic replay fixture
- [ ] `packages-user/data-state/src/event/event.test.ts` — approved built-in behavior tests
- [ ] `packages-user/data-state/src/replay/commands.test.ts` — ordered and awaited command tests
- [ ] `packages-user/data-state/test/nodeReplay.test.ts` — first-divergence regression tests
- [ ] `packages-user/data-state/test/coreNode.test.ts` — independent factory regression tests
- [ ] `packages-user/data-state/test/dataClosure.test.ts` — focused DATA-01 closure tests
- [ ] `packages-user/data-common/src/store/tileStore.test.ts` — Tile events-map tests
- [ ] `packages-user/data-state/test/tileLegacy.test.ts` — legacy Tile conversion tests
- [ ] `script/test-data-node.ts` — dedicated Node verifier
- [ ] `script/check-data-type.ts` — scoped four-package type gate
- [ ] `script/check-data-circular.ts` — scoped circular-dependency gate

---

## Manual-Only Verifications

All Phase 3 behaviors have automated verification. User decision checkpoints in the plans are planning gates, not manual acceptance tests.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
