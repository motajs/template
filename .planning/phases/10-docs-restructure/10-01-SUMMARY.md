---
phase: 10-docs-restructure
plan: 01
subsystem: docs
tags: [vitepress, documentation, docs-site]

# Dependency graph
requires: []
provides:
  - "docs/ cleared of legacy content: guide/ dev/ logger/ api/ trees + homepage index.md deleted"
  - "docs/.vitepress/config.ts decoupled from ./apiSidebar and ./api generated artifacts; old nav/sidebar keys removed"
  - "docs/.vitepress/api.ts generateSidebar() guarded with existsSync (safe no-op when docs/api absent)"
  - "Nav entry 中级教程 + sidebar['/intermediate/'] (4 groups / 24 links, order 4/8/9/3) registered"
  - "docs/intermediate/ landing directory for the intermediate-tutorial writing plans"
affects:
  - 10-02 .. 10-06 (intermediate tutorial writing plans land in docs/intermediate/)

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
actuals:
  tokens: 190639
  tasks: 2
  commits: 2
  plan_head_before: 1099583b0782a207d66a8145814b086c5a9ac309

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Guard generated-artifact consumers with existsSync early-return instead of try-catch (dev.md bans try-catch)"

key-files:
  created: []
  modified:
    - docs/.vitepress/config.ts
    - docs/.vitepress/api.ts
  deleted:
    - docs/index.md
    - docs/api/** (109 files)
    - docs/dev/** (25 files)
    - docs/guide/** (23 files)
    - docs/logger/** (4 files)

key-decisions:
  - "Deleted legacy doc trees outright rather than keeping redirects (D-04: old interfaces drifted too far from current implementation)"
  - "Removed the static ./apiSidebar import and listenSidebar() dev plugin — build no longer depends on the generated apiSidebar.ts artifact"
  - "Kept the per-package generateSidebar() scan logic intact (D-03) and only added an existsSync guard so init.ts / docs:dev survive the absent docs/api directory"
  - "Left nav/sidebar as empty containers after clearing, then wrote only the intermediate entries (nav one entry; sidebar one '/intermediate/' key)"

requirements-completed: []

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Legacy doc trees and homepage removed from the repo (docs/guide, docs/dev, docs/logger, docs/api, docs/index.md)"
    verification:
      - kind: integration
        ref: "Test-Path docs/guide docs/dev docs/logger docs/api docs/index.md -> all False"
        status: pass
    human_judgment: false
  - id: D2
    description: "config.ts no longer carries old nav/sidebar keys or the apiSidebar/api imports; unused Plugin import dropped"
    verification:
      - kind: integration
        ref: "static grep of config.ts for '/guide/', '/logger/', '/api/', apiSidebar, listenSidebar, generateSidebar -> none"
        status: pass
    human_judgment: false
  - id: D3
    description: "generateSidebar() safely returns when docs/api is absent; tsx docs/.vitepress/init.ts no longer throws ENOENT"
    verification:
      - kind: integration
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts\" -> exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Nav entry 中级教程 and sidebar['/intermediate/'] with 4 groups / 24 unique links in order 4/8/9/3"
    verification:
      - kind: integration
        ref: "static structure gate: 24 unique /intermediate/ link targets + group titles 概念与导航/基础接口/战斗/其他"
        status: pass
    human_judgment: false
  - id: D5
    description: "VitePress site builds after the deletion with no dead links or unresolved imports"
    verification:
      - kind: integration
        ref: "cmd /c \"pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build\" -> build complete, no dead link / Failed to resolve import"
        status: pass
    human_judgment: false

# Metrics
duration: 5min
completed: 2026-10-17
status: complete
---

# Phase 10 Plan 01: 旧内容清空 + 站点注册 Summary

**Deleted the entire legacy docs tree (guide/dev/logger/api + homepage, 162 files) and re-registered the site: config.ts decoupled from the generated apiSidebar, `generateSidebar()` guarded for the absent `docs/api`, and a 中级教程 nav + `/intermediate/` sidebar (4 groups / 24 links) wired to the empty `docs/intermediate/` landing directory so the site builds green.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-10-17T09:34:49Z
- **Completed:** 2026-10-17T09:39:30Z
- **Tasks:** 2 (Task 0 approval checkpoint pre-cleared by the user's 「可以执行」)
- **Files changed:** 164 (162 deletions + 2 modifications)

## Accomplishments

- Removed all legacy documentation: `docs/guide/` (23 files), `docs/dev/` (25), `docs/logger/` (4), `docs/api/` (109), and the VitePress homepage `docs/index.md` — 162 tracked files deleted.
- Cleaned `docs/.vitepress/config.ts`: dropped the 4 legacy nav entries and the `/guide/`, `/logger/`, `/api/` sidebar keys; removed the `./apiSidebar` default import and the `./api` `generateSidebar` import; deleted the `listenSidebar()` dev plugin and its `vite.plugins` call; removed the now-unused `Plugin` type import.
- Guarded `generateSidebar()` in `docs/.vitepress/api.ts` with `existsSync(apiDir)` so `tsx docs/.vitepress/init.ts` and `docs:dev` no longer throw `ENOENT` when `docs/api/` is absent — the per-package scan logic is untouched (D-03).
- Registered the顶栏 `中级教程` entry (`/intermediate/data-vs-render`) and the `sidebar['/intermediate/']` key with 4 collapsed groups (概念与导航 / 基础接口 / 战斗 / 其他) and 24 links in the 4/8/9/3 order (D-20).
- Site build passes: `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` prints `build complete` with no dead links and no unresolved imports — the pre-existing `docs/dev/store/tile-store.md` dead-link failure is gone.

## Task Commits

Each task was committed atomically:

1. **Task 1: 删除旧文档树与首页，清理 config.ts，并为 apiSidebar 生成加缺失目录守卫** - `e3d61ee` (docs)
2. **Task 2: 在 config.ts 注册 nav 入口与 '/intermediate/' 侧边栏分组** - `ca3a61f` (docs)

**Plan metadata:** (this SUMMARY commit)

## Files Created/Modified

- `docs/.vitepress/config.ts` - Removed legacy nav/sidebar keys, `apiSidebar`/`api` imports, `listenSidebar()` + `Plugin`; added `中级教程` nav entry and `'/intermediate/'` sidebar (24 links)
- `docs/.vitepress/api.ts` - Added `import { existsSync } from 'node:fs'` and an early-return guard in `generateSidebar()`
- `docs/index.md`, `docs/guide/**`, `docs/dev/**`, `docs/logger/**`, `docs/api/**` - Deleted (162 files)
- `docs/.vitepress/apiSidebar.ts` - Deleted local gitignored generated artifact (no longer consumed)

## Decisions Made

- Delete legacy content outright (no redirect stubs) — D-04: the old interfaces drifted too far from the current implementation to preserve.
- Keep the per-package `generateSidebar()` mechanism (D-03) and harden it against the missing directory rather than deleting it, so the future API-reference rebuild can reuse the scan.
- Empty `nav`/`sidebar` containers were used as the intermediate state in Task 1, then filled with only the intermediate entries in Task 2.

## Deviations from Plan

None - plan executed exactly as written.

- The plan's Task 1 `<precondition>` was honored exactly: the pre-existing uncommitted `'/intermediate/'` edit in `docs/.vitepress/config.ts` was reverted (`git restore`) to HEAD before any edit, then re-applied cleanly in Task 2.

## Issues Encountered

None.

- Pre-existing uncommitted edits to `.planning/phases/10-docs-restructure/*` (PLAN/CONTEXT/PATTERNS/RESEARCH/VALIDATION) were present before this run and were deliberately left unstaged — they are planning artifacts outside this plan's `docs/**` scope and are owned by the orchestrator/planning flow.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `docs/` is now empty of markdown pages except the (empty) `docs/intermediate/` landing directory; the site builds green and is ready for the 24 intermediate-tutorial writing plans (10-02 .. 10-06).
- Nav + sidebar registration is in place, so articles written into `docs/intermediate/` will be visible (D-09 human review gate).
- No blockers.

---
*Phase: 10-docs-restructure*
*Completed: 2026-10-17*

## Self-Check: PASSED

- `docs/.vitepress/config.ts` — FOUND
- `docs/.vitepress/api.ts` — FOUND
- Commit `e3d61ee` — FOUND
- Commit `ca3a61f` — FOUND
- Legacy paths removed (`docs/guide`, `docs/dev`, `docs/logger`, `docs/api`, `docs/index.md`) — all GONE
- Plan build gates `W0-CLEAR-OK` (Task 1) and `W0-REGISTER-OK` (Task 2) — both PASSED
- Commits measured: `git rev-list --count 1099583..HEAD` = 2
