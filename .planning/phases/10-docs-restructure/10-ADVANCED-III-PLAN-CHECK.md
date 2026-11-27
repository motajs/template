# Phase 10: Advanced III 文档批次 — Plan Check

**Phase:** 10-docs-restructure
**Plans checked:** 10-33 .. 10-41 (9 plans)
**Research input:** `10-ADVANCED-III-RESEARCH.md`
**Decisions baseline:** `10-CONTEXT.md` D-09/D-12/D-13/D-46/D-53..D-83
**Status:** ISSUES FOUND — 3 blockers, 6 warnings, 9 advisories
**Re-check (post-revision):** PASS — 0 blockers, 0 warnings, 3 residual INFO; see **RE-CHECK (post-revision)** at the end.

## VERIFICATION SUMMARY

The batch covers the approved scope end-to-end: directory restructure + root guide (10-33), the seven III data-end pages (10-34..10-38), III index + sidebar registration + placeholder replacement (10-39), independent reader review (10-40), and user-led revision + closeout (10-41). Source facts in the research are assigned to the correct pages and the core models match the current source. However, two verification gates contradict their own required end state, and the STATE.md accounting instruction is factually wrong for the project-wide counters. These must be fixed before execution; otherwise the plan cannot pass its own gate or will corrupt project state.

## Plan Summary

| Plan | Scope | Tasks | Wave | Status |
|------|-------|-------|------|--------|
| 10-33 | git mv Advanced I → `docs/advanced/i/`; new root guide; config I group; cross-layer links | 3 (1 checkpoint + 2 auto) | 5 | Block (gate self-contradiction) |
| 10-34 | `loading-system.md` | 3 (1 checkpoint + 2 auto) | 6 | Block (gate self-contradiction) |
| 10-35 | `replay-internals.md` | 3 (1 checkpoint + 2 auto) | 7 | Warning (finalize semantics) |
| 10-36 | `event-system.md` + `anon-tokyo.md` | 4 (1 checkpoint + 3 auto) | 8 | Pass |
| 10-37 | `passability-and-pathfinding.md` | 3 (1 checkpoint + 2 auto) | 9 | Pass (minor imprecision) |
| 10-38 | `core-state.md` + `plugin-internals.md` | 4 (1 checkpoint + 3 auto) | 10 | Warning (D-69 placement) |
| 10-39 | III index; sidebar 8 items; 3 placeholder replacements; backlinks/cross-links | 4 (1 checkpoint + 3 auto) | 11 | Warning (anchor mismatch) |
| 10-40 | Independent reader review + usage probabilities + ≤3 rounds | 4 (1 checkpoint + 3 auto) | 12 | Warning (persona gate fragility) |
| 10-41 | User revision loop + confirmation + final gates + ROADMAP/STATE | 5 (3 checkpoints + 2 auto) | 13 | Block (STATE counters) |

Wave/dependency graph is valid and linear: 10-32(w4) → 10-33(w5) → 10-34(w6) → 10-35(w7) → 10-36(w8) → 10-37(w9) → 10-38(w10) → 10-39(w11) → 10-40(w12) → 10-41(w13). All referenced plans exist; no cycles; no same-wave parallel pairs, so no undeclared coupling. All plan structures are valid; only 10-33 emits a tool warning (fallible `git` heuristic).

## Coverage Summary

| Approved scope / decision | Plans | Status |
|---------------------------|-------|--------|
| Move Advanced I to `docs/advanced/i/`, rebuild root 高级教程总导览, update config I group | 10-33 | Covered |
| loading-system (model, phases, extensions, renderer interface section, boundaries) | 10-34 | Covered |
| replay-internals (ReplayArray/System/Sandbox, Active/Passive, save shape, old-vs-new baseline) | 10-35 | Covered (one fact misstated) |
| event-system + anon-tokyo (store/collect/executor/triggers; interpreter model) | 10-36 | Covered |
| passability-and-pathfinding (predicate contract, two instances, graph→search→mover) | 10-37 | Covered |
| core-state + plugin-internals (L0–L3 assembly, load pipeline, saveable ids, orderPlugins) | 10-38 | Covered |
| III index, sidebar 8 items, three placeholder replacements, backlinks | 10-39 | Covered |
| D-46 stage 1 / D-57 higher persona / D-78 usage probabilities / ≤3 rounds | 10-40 | Covered |
| D-46 stage 2 / user confirmation before closeout / appended ROADMAP+STATE | 10-41 | Block (STATE counters) |
| D-09 (user review + links valid + build) | 10-40, 10-41 | Covered |
| D-12/D-13 Task 0 「可以执行」 + naming confirmation | 10-33..10-41 | Covered |
| D-77/D-80/D-82/D-83/D-60/D-61/D-62/D-70/D-65 content constraints | 10-34..10-39 | Covered |
| Render pipeline excluded; editor/serialized registration excluded; legacy only as labeled baseline | 10-34..10-39 | Covered |

## ISSUES FOUND

### Blockers — these properties must hold ("must fix" is the property, never the example)

**1. [task_completeness / verification] The stale-root gate must not reject the intentionally recreated `docs/advanced/index.md`**
- Plan: 10-33
- Evidence: Task 1 creates the new root guide at `docs/advanced/index.md` (`10-33-PLAN.md:114` step 3: "用 Write 重写 `docs/advanced/index.md`（原文件已移走，这是新建）"). But the Task 1 verify iterates `$names` including `'index'` and errors if `docs/advanced/index.md` exists: `if(Test-Path -LiteralPath "docs/advanced/$n.md"){ Write-Error "STALE-ROOT $n.md" }` (`10-33-PLAN.md:122`). The `fails_when` explicitly fails on `STALE-ROOT` (`10-33-PLAN.md:123`). A correct execution therefore always fails the gate.
- Example fix (non-binding — any mechanism reaching the property counts): exclude `index` from the stale-root check (check only the 8 non-index I files), or assert the old I-guide content is gone rather than the path being absent.

**2. [task_completeness / verification] The loading-system title check must accept a CRLF H1**
- Plan: 10-34
- Evidence: The page is required to be CRLF (`10-34-PLAN.md:101-102`: LF-ONLY check) and the exact title check is `if($raw -notmatch '(?m)^# 加载系统$'){ Write-Error 'NO-TITLE' }` (`10-34-PLAN.md:102`). In .NET multiline mode `$` does not match a line ending in `\r\n`; the actual H1 line is `# 加载系统\r\n`, so the check fails on every compliant file. `NO-TITLE` is in `fails_when` (`10-34-PLAN.md:103`). I confirmed the regex behavior locally: `[regex]::IsMatch("# 加载系统`r`n...", '(?m)^# 加载系统$')` = False.
- Example fix (non-binding): use `'(?m)^# 加载系统\r?$'`, a substring check, or a BOM/line-normalized comparison.

**3. [context_compliance / accounting] STATE.md's project-wide `progress.*_plans` counters must not be overwritten with phase-only counts**
- Plan: 10-41
- Evidence: `10-41-PLAN.md:148` instructs: "`progress.total_plans` 改为 41、`progress.completed_plans` 改为实际完成数（预期 38）". But `.planning/STATE.md:14-15` currently hold project-wide aggregates `total_plans: 134` / `completed_plans: 126` (with `total_phases: 10` / `completed_phases: 3`). Setting them to 41/38 would silently corrupt the project ledger. It also contradicts the plan's own truth "STATE.md 只做增量更新" (`10-41-PLAN.md:35`) and acceptance "两个文件均为追加式编辑" (`10-41-PLAN.md:150`). The closeout verify only checks `第五批` and `10-06` (`10-41-PLAN.md:152`), so the corruption would pass unnoticed.
- Example fix (non-binding): increment the global counters by the 9 newly completed plans (e.g. 134→143, 126→135) while keeping the phase-level `Progress: Phase 10 · 38/41 plans` line; or leave the frontmatter counters untouched and only update the phase-level progress line.

### Warnings — these properties should hold

**1. [verification_derivation / factual accuracy] The replay finalize semantics must match the source**
- Plan: 10-35
- Evidence: `10-35-PLAN.md:87` says "连续同指令步骤之间会调用一次收尾方法" ("finalize is called between consecutive same-command steps"). Source and research say the opposite: finalize runs when the active command changes (`sandbox.ts:196` `if (curr.command !== this.last)`) or at replay end (`sandbox.ts:162-164`), per research `10-ADVANCED-III-RESEARCH.md:264`. The must_haves wording "连续步骤之间会触发 finalize" (`10-35-PLAN.md:21`) is ambiguous; the action wording is wrong.
- Example fix (non-binding): state "指令切换或录像结束时触发 finalize".

**2. [verification_derivation / D-69] Internal-implementation sections must be placed later, as the plan's own must_haves claims**
- Plan: 10-38
- Evidence: `10-38-PLAN.md:29` requires "内部实现章节后置". But core-state orders `## 系统模型` → `## 内部实现：装配顺序` → `## 加载管线` (`10-38-PLAN.md:90`), and plugin-internals orders `## 系统模型` → `## 内部实现：依赖排序` → usage sections (`10-38-PLAN.md:111`). Both put the internal section second, not later, conflicting with D-69 and the plan's stated truth.
- Example fix (non-binding): move the internal sections after the usage/API sections, or justify that these pages are themselves internal-implementation topics.

**3. [context_compliance / D-74] Chapter anchor links must match the actual heading text**
- Plan: 10-39
- Evidence: 10-39 instructs linking `./event-system.md#收集` (`10-39-PLAN.md:121`), but the event page heading is `## 收集：这一次该执行谁` (`10-36-PLAN.md:92`). VitePress slugs the full heading, so `#收集` will not land on the section. The build does not validate anchors, so the link gate will not catch it.
- Example fix (non-binding): use the full anchor (`#收集这一次该执行谁`) or point at the exact heading.

**4. [task_completeness / scope] Every file the plan may modify must be listed in scope**
- Plan: 10-41
- Evidence: `10-41-PLAN.md:36` allows "不改 `config.ts` 结构（除用户明确要求的显示名 / 顺序）", i.e. the user may request sidebar name/order changes, but `files_modified` (`10-41-PLAN.md:7-19`) omits `docs/.vitepress/config.ts`. If the user requests such a change, the executor would edit an undeclared file, violating the plan's own scope gate (`10-41-PLAN.md:187`).
- Example fix (non-binding): add `docs/.vitepress/config.ts` to `files_modified` as a conditional target, or state that display-name/order changes are out of scope for 10-41.

**5. [verification_derivation] The reader-persona gate must accept the plan's own record format**
- Plan: 10-40
- Evidence: The persona is recorded as a blockquote in `10-40-PLAN.md:73`, but the verify computes `$flat=$raw -replace '\s',''` then `$flat.Contains($persona)` (`10-40-PLAN.md:111,136`). `-replace '\s',''` removes spaces/newlines but not the `>` prefix; if the long persona is line-wrapped in the review file (a legitimate rendering of the same text), the `>` characters break the substring and the gate fails.
- Example fix (non-binding): also strip `>`/blockquote markers, or compare line-by-line after trimming the quote prefix.

**6. [research_resolution] The new research's Open Questions must be marked resolved or explicitly dispositioned**
- Research: `10-ADVANCED-III-RESEARCH.md:810` has `## Open Questions` with six questions and no `(RESOLVED)` suffix or per-question RESOLVED markers. The plans do address them (Q1/Q2 via Task 0 gates; Q3/Q4 via fixed page list; Q5 via 10-34's renderer scope; Q6 via the C1–C8 dialogue-report rule), but the research artifact itself still reads as unresolved.
- Example fix (non-binding): mark the section `## Open Questions (RESOLVED)` and annotate each question with its disposition, or add a pointer to the plans that answer it.

### Advisories (info)

**1. [requirement_coverage] Link-count annotations in 10-33 are stale; the "全部" replacement still works**
- Plan: 10-33
- Evidence: `10-33-PLAN.md:83` says 15 `../intermediate/` occurrences and 6 `./ii/` occurrences; the current tree has 16 `../intermediate/` (data-stores has 2, not 1) and 7 `./ii/` (index has 4, not 3). The action says "全部" replace (`10-33-PLAN.md:115`), and the verify checks no `](../intermediate/` / `](./ii/` remains, so the replacement is functionally correct; only the counts are wrong.
- Example fix (non-binding): update the counts or drop the numbers.

**2. [scope_sanity] 10-33 lists 15 files, but 9 are `git mv` moves**
- Plan: 10-33
- Evidence: `10-33-PLAN.md:7-22` lists 15 paths; 9 are moved with unchanged content and 3 II files only change link paths. Estimate is 42k tokens (`10-33-PLAN.md:26-30`), well under the 100k budget, so the edit surface is not actually over budget. Advisory only.

**3. [scope_sanity] 10-41 has 5 tasks, but 3 are human checkpoints**
- Plan: 10-41
- Evidence: `10-41-PLAN.md:87-156` (Tasks 0/1/3 are `checkpoint:human-verify`; Tasks 2/4 are auto). Context cost is low (estimate 32k, `10-41-PLAN.md:23-27`). Advisory only.

**4. [task_completeness] 10-33 emits a `git` heuristic warning**
- Plan: 10-33
- Evidence: `gsd-tools query verify.plan-structure` warns "[plan-criteria R4] A fallible `git` in a non-final pipeline stage is swallowed". The plan only uses `git mv` (`10-33-PLAN.md:114`) and a `git status` self-check (`10-33-PLAN.md:172`); there is no pipeline whose last stage would mask a `git` failure. Likely a false positive; no action required.

**5. [verification_derivation] 10-37 does not link the event page from the "three move results" section**
- Plan: 10-37
- Evidence: `10-37-PLAN.md:91` says the trigger relationship is mentioned as text and "不要放链接——该页由另一计划创建"; however 10-36 is an earlier dependency, so `event-system.md` already exists. This is conservative and creates no dead link; 10-39 later adds the sibling link (`10-39-PLAN.md:121`). Advisory only.

**6. [factual_accuracy] 10-37's "撞击看目标格的通行位" is imprecise**
- Plan: 10-37
- Evidence: `10-37-PLAN.md:89` says `shouldHit` looks at "目标格静态图块的通行位"; source/research say it checks `!nextRaw.eventPass` (`src/data/hero/predicate.ts:79`, research `10-ADVANCED-III-RESEARCH.md:363`). The executor is told to re-read source (`10-37-PLAN.md:62`), so this is likely corrected in execution.
- Example fix (non-binding): say "目标格的 eventPass 通行标记".

**7. [context_compliance] 10-34's "配置 id 冲突的后果" boundary could drift into the unreachable warning-68 claim**
- Plan: 10-34
- Evidence: `10-34-PLAN.md:97` asks the page to explain "配置 id 冲突的后果", while the plan's must_haves forbids documenting "重复配置 id 稳定告警" (`10-34-PLAN.md:25`) and research C5 says warning 68 is unreachable (`10-ADVANCED-III-RESEARCH.md:717`). Keep the boundary to "later duplicate is ignored / loader dedupes" and do not promise a stable warning.

**8. [verification_derivation] 10-41's confirmation-marker gate requires the marker on its own line**
- Plan: 10-41
- Evidence: `10-41-PLAN.md:152` matches `^\s*(?:[-*]\s*)?用户最终确认：(通过|满意)\s*$`. The plan says the marker is on its own line (`10-41-PLAN.md:31,74`), but also says "并附用户原文"; if the quote is appended on the same line, the gate fails on a legitimate record. Keep the quote on a following line or relax the regex.

**9. [context_compliance] 10-39's "八篇地图" wording vs seven linked pages**
- Plan: 10-39
- Evidence: `10-39-PLAN.md:31` and `:116` say the map has eight pages with real links, but the index itself is not (and should not be) a self-link; the verify correctly requires links to the seven content pages (`10-39-PLAN.md:126`). Wording only.

## Structured Issues

```yaml
issues:
  - plan: "10-33"
    dimension: "task_completeness"
    severity: "blocker"
    required_property: "The stale-root gate does not reject the intentionally recreated docs/advanced/index.md"
    description: "Task 1 creates the new root guide at docs/advanced/index.md, but the Task 1 verify iterates $names including 'index' and errors if docs/advanced/index.md exists (STALE-ROOT index.md), so a correct execution always fails the gate."
    task: 1
    fix_hint: "Exclude 'index' from the stale-root check, or assert the old I-guide content is gone rather than the path being absent."
  - plan: "10-34"
    dimension: "task_completeness"
    severity: "blocker"
    required_property: "The loading-system title check accepts a CRLF H1"
    description: "The page is required to be CRLF, but the exact title check '(?m)^# 加载系统$' does not match '# 加载系统\\r\\n' in .NET multiline mode; NO-TITLE always fires."
    task: 1
    fix_hint: "Use '(?m)^# 加载系统\\r?$', a substring check, or a line-normalized comparison."
  - plan: "10-41"
    dimension: "context_compliance"
    severity: "blocker"
    required_property: "STATE.md's project-wide progress.*_plans counters remain consistent and are not overwritten with phase-only counts"
    description: "The plan sets progress.total_plans=41 and completed_plans=38, but STATE.md:14-15 currently hold project-wide aggregates 134/126; this corrupts the ledger and contradicts the plan's own 'incremental/append-only' truth."
    task: 4
    fix_hint: "Increment the global counters by the 9 completed plans (134→143, 126→135), or leave the frontmatter counters untouched and update only the phase-level Progress line."
  - plan: "10-35"
    dimension: "verification_derivation"
    severity: "warning"
    required_property: "The replay finalize semantics match the source"
    description: "The plan says finalize is called '连续同指令步骤之间', but the source triggers it when the active command changes or the replay ends."
    task: 1
    fix_hint: "State '指令切换或录像结束时触发 finalize'."
  - plan: "10-38"
    dimension: "verification_derivation"
    severity: "warning"
    required_property: "Internal-implementation sections are placed later per D-69 and the plan's own must_haves"
    description: "core-state and plugin-internals put '## 内部实现' sections second (immediately after the model), not later as the must_haves requires."
    task: 1
    fix_hint: "Move the internal sections after the usage/API sections, or justify that these pages are themselves internal-implementation topics."
  - plan: "10-39"
    dimension: "context_compliance"
    severity: "warning"
    required_property: "Chapter anchor links match the actual heading text (D-74)"
    description: "The plan links ./event-system.md#收集, but the heading is '## 收集：这一次该执行谁'; the anchor will not resolve."
    task: 1
    fix_hint: "Use the full anchor '#收集这一次该执行谁' or point at the exact heading."
  - plan: "10-41"
    dimension: "task_completeness"
    severity: "warning"
    required_property: "Every file the plan may modify is listed in scope"
    description: "The plan allows user-requested sidebar display/order changes but omits docs/.vitepress/config.ts from files_modified."
    task: 4
    fix_hint: "Add docs/.vitepress/config.ts as a conditional target, or state display-name/order changes are out of scope."
  - plan: "10-40"
    dimension: "verification_derivation"
    severity: "warning"
    required_property: "The reader-persona gate accepts the plan's own record format"
    description: "The verify strips whitespace but not blockquote '>' prefixes; a wrapped persona record breaks $flat.Contains($persona)."
    task: 1
    fix_hint: "Strip '>' prefixes or compare line-by-line after trimming the quote marker."
  - plan: null
    dimension: "research_resolution"
    severity: "warning"
    required_property: "The new research's open questions are marked resolved or explicitly dispositioned"
    description: "10-ADVANCED-III-RESEARCH.md:810 has '## Open Questions' without '(RESOLVED)' and no per-question resolution markers; the plans address them but the artifact reads as unresolved."
    fix_hint: "Mark the section '(RESOLVED)' and annotate each question with its disposition."
  - plan: "10-33"
    dimension: "requirement_coverage"
    severity: "info"
    required_property: "The plan's link-count facts match the repository"
    description: "The plan says 15 ../intermediate/ and 6 ./ii/ occurrences; the tree has 16 and 7. The '全部' replacement still covers them."
    task: 1
    fix_hint: "Update or drop the counts."
  - plan: "10-33"
    dimension: "scope_sanity"
    severity: "info"
    required_property: "Each plan stays within the per-plan context budget"
    description: "15 files listed, but 9 are git mv moves and the estimate is 42k/100k."
    task: 1
    fix_hint: "No change required; note the move-only files in the summary."
  - plan: "10-41"
    dimension: "scope_sanity"
    severity: "info"
    required_property: "Each plan stays within the per-plan context budget"
    description: "5 tasks, but 3 are human checkpoints and the estimate is 32k/100k."
    task: 0
    fix_hint: "No change required."
  - plan: "10-33"
    dimension: "task_completeness"
    severity: "info"
    required_property: "The plan's verify commands are runnable"
    description: "verify.plan-structure emits an R4 warning about fallible git, but the plan uses git mv only (no pipeline whose last stage masks it)."
    task: 1
    fix_hint: "No action; likely a false positive."
  - plan: "10-37"
    dimension: "verification_derivation"
    severity: "info"
    required_property: "Cross-page links are added when the target already exists"
    description: "The plan avoids linking event-system.md because it says another plan creates it, but 10-36 is an earlier dependency; 10-39 adds the link later."
    task: 1
    fix_hint: "Optional: link event-system.md now; no dead-link risk either way."
  - plan: "10-37"
    dimension: "verification_derivation"
    severity: "info"
    required_property: "Factual descriptions match the source"
    description: "'撞击看目标格的通行位' should be '目标格的 eventPass 标记'."
    task: 1
    fix_hint: "Use the precise eventPass wording."
  - plan: "10-34"
    dimension: "context_compliance"
    severity: "info"
    required_property: "Documentation does not promise unreachable warning behavior"
    description: "The boundary asks for '配置 id 冲突的后果' while the must_haves forbids documenting a stable warning-68; keep the boundary to dedupe/ignore semantics."
    task: 1
    fix_hint: "Do not promise a stable warning code."
  - plan: "10-41"
    dimension: "verification_derivation"
    severity: "info"
    required_property: "The confirmation gate accepts the plan's own record format"
    description: "The marker must be alone on its line; if the user quote is appended on the same line, the gate fails."
    task: 4
    fix_hint: "Put the quote on a following line or relax the regex."
  - plan: "10-39"
    dimension: "context_compliance"
    severity: "info"
    required_property: "Wording matches the actual link count"
    description: "'八篇地图全部有真实链接' is inaccurate because the index itself is not a self-link; the verify correctly requires the seven content pages."
    task: 1
    fix_hint: "Say '七篇正文 + 本页说明'."
```

## Recommendation

3 blocker(s) and 6 warning(s) require revision. The batch's scope, page assignment, and content constraints are otherwise sound; source facts for loading, replay storage, Anon-Tokyo, predicate instances, CoreState assembly, and plugin ordering match the current source. Fix the two self-contradictory gates (10-33 stale-root, 10-34 CRLF H1), correct the STATE.md counter instruction (10-41), and tighten the replay finalize wording / D-69 placement / anchor / persona-normalization warnings. No plan files or docs/source were modified by this check.

---

# RE-CHECK (post-revision)

**Re-checked:** 2026-10-26
**Revised plans:** 10-33 .. 10-41 (9 plans, all modified)
**Status:** PASS — 0 blockers, 0 warnings, 3 residual advisories (INFO). No revision required.

## Re-check verdict

The planner revised all nine plans. Every BLOCK and FLAG from the first check is resolved, the fixes do not introduce a new blocker, and all nine plans remain structurally valid. D-12 Task 0 checkpoints and 「可以执行」 stop text are intact in every plan.

## Finding-by-finding re-verification

| # | Original finding | Result | Evidence |
|---|------------------|--------|----------|
| 1 | 10-33 stale-root gate rejected the intentionally recreated root guide | **PASS** | `10-33-PLAN.md:130` now uses `$moved=@('declarative-vs-imperative',...)` (8 pages, no `index`), asserts `docs/advanced/i/index.md` exists, asserts `docs/advanced/index.md` exists (`MISSING-ROOT-INDEX`), asserts the I guide title in `i/index.md`, and asserts the root guide does **not** contain `# 高级 I 导览` (`STALE-I-GUIDE-AT-ROOT`). `fails_when` includes the new tokens (`:131`). No self-contradiction. |
| 2 | 10-34 CRLF H1 regex `(?m)^# 加载系统$` always failed on CRLF | **PASS** | `10-34-PLAN.md:102` now uses `(?m)^# 加载系统\r?$`; the LF-only check is still present. A scan of all 9 plans found no other `(?m)^# ...$` H1 regex; the remaining `^# ` checks are substring/count checks and are CRLF-safe. |
| 3 | 10-41 overwrote global STATE counters with phase-only 41/38 | **PASS** | `10-41-PLAN.md:152` now says the frontmatter `progress.total_plans` / `completed_plans` are project-wide cumulative values and must stay unchanged (explicitly "不得改成 41 / 38"). `10-41-PLAN.md:36` encodes the same truth. The verify at `:157` extracts both counters, fails on `STATE-BATCH-COUNTERS` (`-eq 41` / `-eq 38`), `STATE-TOTAL-PLANS-SHRANK` (`< 134`), `STATE-COMPLETED-PLANS-SHRANK` (`< 126`), and `STATE-COUNTERS-MISSING`; `fails_when` lists them (`:158`). This actually catches a regression, not just a text match. |
| 4 | 10-35 `finalize` semantics were reversed | **PASS** | `10-35-PLAN.md:87` now says finalize runs when "**指令切换或录像结束时**", explicitly forbids "连续步骤之间". This matches `sandbox.ts:196` (command change) and `sandbox.ts:162-164` (end) / research `:264`. The must_haves truth at `10-35-PLAN.md:21` matches. |
| 5 | 10-38 internal sections were second, not late | **PASS** | Core-state order is now 系统模型 → 入口的职责 → 加载管线 → 存档挂载 → 在游戏内另建 → **内部实现：装配顺序** → 边界 (`10-38-PLAN.md:94`). Plugin-internals order is 系统模型 → 三个阶段 → 取回 → 失败 → **内部实现：依赖排序** → 状态机 → 边界 (`:116`). Both internal sections are second-to-last, satisfying D-69 and the must_haves. Verify section checks are substring-based, so reordering does not break them. |
| 6 | 10-39 anchor `#收集` did not match the heading | **PASS** | `10-39-PLAN.md:121` now uses `./event-system.md#收集这一次该执行谁` and explicitly says the heading is frozen and the anchor must be written per the full heading, not `#收集`. `10-36-PLAN.md` freezes `## 收集：这一次该执行谁`. VitePress slug (colon removed) matches the new anchor. |
| 7 | 10-41 omitted config.ts from `files_modified` | **PASS** | `10-41-PLAN.md:20` now lists `docs/.vitepress/config.ts` in `files_modified`; `:43` lists it in artifacts as conditional; `:153` action (8) authorizes the edit only if the user requests display-name/order changes and otherwise says leave it untouched and note "config 未改". |
| 8 | 10-40 persona gate broke on blockquote/wrapped text | **PASS** | Both persona checks now normalize with `$flat=($raw -replace '>','') -replace '\s',''` (`10-40-PLAN.md:112` Task 1, `:137` Task 3), stripping blockquote markers and whitespace before `Contains($persona)`. Wrapped/blockquoted records no longer break the gate. |
| 9 | Research Open Questions were not marked resolved | **PASS (by citation)** | `10-33-PLAN.md:93-99` adds a Q1–Q6 disposition block ("研究开放问题处置：Q1–Q6 统一口径记录在本段；research 文件本身不修改，以本表为准"), covering directory/file names, I move, anon-tokyo independence, plugin-internals independence, renderer-section depth, and C1–C8. This satisfies the accepted "citation in 10-33" route. The research file itself still shows `## Open Questions`, but the plan-side disposition is explicit. |
| 10 | New blockers / structure / D-12 regressions | **PASS** | `verify.plan-structure` = valid for all 9 plans (10-33 keeps only the pre-existing R4 `git` heuristic warning). Waves/deps unchanged and valid (5→13). All plans have `autonomous: false`, `estimate`, and a Task 0 `checkpoint:human-verify` containing "停下等待用户明确回复「可以执行」四个字". SUMMARY references/outputs intact. Task counts unchanged (3/3/3/4/3/4/4/4/5). |

## Residual advisories (INFO only — do not block execution)

1. **10-35 verify only checks `finalize` presence, not the corrected semantics.** The action (`10-35-PLAN.md:87`) is correct, but the page gate does not assert "指令切换或录像结束". A regression in the page wording would not be caught by the automated gate. Optional: add a substring assertion for the corrected semantics.
2. **10-41 Task 4 `<files>` omits `docs/.vitepress/config.ts`.** The plan-level `files_modified` includes it (`10-41-PLAN.md:20`) and action (8) authorizes the conditional edit (`:153`), but the task-level `<files>` line (`:148`) does not list it. Scope is still governed by `files_modified`; optional cleanup for consistency.
3. **10-41 Task 4 step (4) says "确认标记与用户原文" without repeating "下一行".** The format is fixed by the must_haves (`:32`) and acceptance (`:155`), and the Task 1/3 actions (`:108`, `:135`) explicitly put the quote on the next line; the verify's `NO-USER-QUOTE-NEXT-LINE` (`:157`) enforces it. Optional wording cleanup.

## Re-check recommendation

**PASS.** All 3 blockers and 6 warnings are fixed; no new blockers were introduced. The three residual items are advisory only and do not require a revision before execution. No plan files, docs, or source were modified by this re-check.

