---
phase: "10"
slug: "docs-restructure"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-16"
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none for the docs themselves (repo uses `vitest`, but this batch writes no tests) |
| **Config file** | none — VitePress CLI only |
| **Quick run command** | `pnpm docs:dev` (local preview; manually inspect nav + links) |
| **Full suite command** | `tsx docs/.vitepress/init.ts` then `pnpm docs:build` (build success == D-09 "构建通过") |
| **Estimated runtime** | ~20–60 seconds (VitePress build; `init.ts` a few seconds) |

> NOTE: `docs/.vitepress/config.ts` statically imports `./apiSidebar`; that file is gitignored and currently absent, so `docs:build` fails until `tsx docs/.vitepress/init.ts` regenerates it. Wave 0 must run it first.

---

## Sampling Rate

- **After every task commit:** `pnpm docs:dev` preview (or at minimum one `docs:build`)
- **After every plan wave:** `tsx docs/.vitepress/init.ts && pnpm docs:build`
- **Before `/gsd-verify-work`:** Full build must pass and the user must have reviewed (D-09)
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-W0-CFG | W0 | 1 | D-02/D-20 | — | Sidebar/nav edits are same-dir docs config only; no raw HTML/script | smoke | `tsx docs/.vitepress/init.ts && pnpm docs:build` | ❌ W0 | ⬜ pending |
| 10-TBD | TBD | TBD | D-09 (links) | T-10-info | Doc pages contain no secrets/internal paths; only the single approved external link | integration (build link resolution) + manual | `pnpm docs:build` | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Rows are seeded from RESEARCH.md; the planner must replace the generic rows with the concrete task IDs it defines.*

---

## Wave 0 Requirements

- [ ] Run `tsx docs/.vitepress/init.ts` — regenerate gitignored `docs/.vitepress/apiSidebar.ts` (build prerequisite)
- [ ] Create directory `docs/intermediate/`
- [ ] Edit `docs/.vitepress/config.ts` — add `nav` entry + `sidebar['/intermediate/']` for the 24 pages

*No unit-test framework install needed — this batch has no test requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 24 篇内容正确、可读、无元叙述 | D-09 (人工审阅), D-16 | Content quality/judgment — not machine-checkable | User reads the built site |
| 侧边栏分组与顺序符合 4/8/9/3 | D-20 | Visual/structural | Inspect sidebar after build |
| `data-plugins` 占位示例是否可替换 | D-19/D-44 | Depends on user-supplied plugin example | Confirm example provided before finalizing |

*All machine-checkable behaviors (build + link resolution) are covered by `pnpm docs:build`.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
