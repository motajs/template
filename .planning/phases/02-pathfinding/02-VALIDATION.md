---
phase: "02"
slug: "pathfinding"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-09"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing, root `pnpm test`) |
| **Config file** | existing vitest config (repo root) |
| **Quick run command** | `pnpm exec vitest run <changed-test-file>` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~10–60 seconds |

Type/lint gates (per Phase 01 conventions): `pnpm check:type` (filtered via `Select-String`), `pnpm check:circular`, `pnpm lint:user` / `pnpm lint:custom`.

---

## Sampling Rate

- **After every task commit:** Run focused vitest file(s) for the touched package
- **After every plan wave:** Run `pnpm test` plus `pnpm check:circular`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PATH-01 | — | N/A | unit | `pnpm exec vitest run "packages-user/data-system/src/pathfinding/*.test.ts"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | PATH-01 | — | N/A | unit (L0 regression) | `pnpm exec vitest run "packages-user/data-common/src/common/mover.test.ts"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | PATH-01 | — | N/A | unit | `pnpm exec vitest run "packages-user/data-state/src/hero/*.test.ts"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Exact task IDs/commands to be finalized by the planner; table above is the seeded skeleton from RESEARCH.md findings (pathfinding unit tests in data-system, L0 mover regression in data-common, hero wiring in data-state).*

---

## Wave 0 Requirements

- [ ] `packages-user/data-system/src/pathfinding/*.test.ts` — stubs for PATH-01 (graph build, min-loss path, unreachable semantics)
- [ ] `packages-user/data-common/src/common/mover.test.ts` — L0 `moveProgress` coordinate-writeback regression (Pitfall P1)
- [ ] No framework install needed — vitest already configured

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 打断时序手感（stop 后 await vs onEnd 回调） | PATH-01 | 接口语义经用户拍板后仍需实际操作确认手感 | 在自动寻路中按键打断，确认停下时机符合拍板契约 |
| 移动端点击触发寻路 | PATH-02 | 渲染端接线属 Phase 4 | 本阶段仅验证数据端入口 API 可被调用；点击接线在 Phase 4 验证 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
