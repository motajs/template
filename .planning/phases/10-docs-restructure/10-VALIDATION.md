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

> NOTE: `10-01`（Wave 0）已删除旧内容并解除 `docs/.vitepress/config.ts` 对生成物 `./apiSidebar` 的静态依赖，给 `docs/.vitepress/api.ts` 的 `generateSidebar()` 加了缺失目录守卫。旧内容删除后 **`docs:build` 必须转绿、dead link = 0**（此前的死链失败源 `docs/dev/store/tile-store.md` 已被删除）。`tsx docs/.vitepress/init.ts` 仍在构建前运行，但在 `docs/api/` 缺失时会安全跳过、不再抛 ENOENT。

---

## Sampling Rate

- **After every task commit:** `pnpm docs:dev` preview (or at minimum one `docs:build`)
- **After every plan wave:** `tsx docs/.vitepress/init.ts && pnpm docs:build`
- **Before `/gsd-verify-work`:** Full build must pass with **dead link = 0**（旧内容已删除，构建必须转绿，不再有「既有死链不可避免」的豁免）and the user must have reviewed (D-09)
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-T1 | 10-01 | 1 | D-04 / D-14 | T-10-01 / T-10-02 | config.ts / api.ts 同目录编辑；删除限于白名单；无原始 HTML/script | smoke（静态 + 构建） | `tsx docs/.vitepress/init.ts && pnpm docs:build`（+ 删除 / 配置 / 守卫断言） | ❌ W0 | ⬜ pending |
| 10-01-T2 | 10-01 | 1 | D-13 / D-20 | T-10-01 | 侧边栏注册仅改同目录 config；无原始 HTML/script | smoke（静态 + 构建） | 同一构建 + 24 链接 / 4 分组断言 | ❌ W0 | ⬜ pending |
| 10-02-T1 | 10-02 | 2 | D-21 / D-22 | T-10-04 | 2 篇 markdown：无原始 `<script>` / 内联 HTML | static structure | CRLF / 单 H1 / mermaid 断言 | ❌ | ⬜ pending |
| 10-02-T2 | 10-02 | 2 | D-23 / D-24 | T-10-05 | 唯一外链为 D-23 批准链接 | static structure | CRLF / 单 H1 / 外链 / addHook 断言 | ❌ | ⬜ pending |
| 10-03-T1 | 10-03 | 3 | D-25 / D-26 / D-27 | T-10-07 | 3 篇 markdown：无原始 `<script>` | static structure | CRLF / 单 H1 / 修饰器 / 类别断言 | ❌ | ⬜ pending |
| 10-03-T2 | 10-03 | 3 | D-28 / D-29 / D-30 | T-10-07 | 3 篇 markdown：无原始 `<script>` | static structure | CRLF / 单 H1 / autoUnload / eventLayer 断言 | ❌ | ⬜ pending |
| 10-03-T3 | 10-03 | 3 | D-31 / D-32 | T-10-07 | 2 篇 markdown：无原始 `<script>` | static structure | CRLF / 单 H1 / iterateBlocks / getOrInsertComputed 断言 | ❌ | ⬜ pending |
| 10-04-T1 | 10-04 | 4 | D-33 / D-34 / D-35 | T-10-10 | 3 篇 markdown：无原始 `<script>` | static structure | CRLF / 单 H1 / mermaid / applySpecial 断言 | ❌ | ⬜ pending |
| 10-04-T2 | 10-04 | 4 | D-36 / D-37 / D-38 | T-10-10 | 3 篇 markdown：无原始 `<script>` | static structure | CRLF / 单 H1 / register / getCriticalLimit 断言 | ❌ | ⬜ pending |
| 10-04-T3 | 10-04 | 4 | D-39 / D-40 / D-41 | T-10-10 | 3 篇 markdown：无原始 `<script>` | static structure | CRLF / 单 H1 / useReducer / onAfterTeleportTo 断言 | ❌ | ⬜ pending |
| 10-05-T1 | 10-05 | 5 | D-42 / D-43 / D-44 | T-10-13 | 3 篇 markdown：无原始 `<script>` | static structure | CRLF / 单 H1 / createEventRegistrations / @shouldReplay / afterLoad 断言 | ❌ | ⬜ pending |
| 10-06-T1 | 10-06 | 6 | D-09 | T-10-16 / T-10-17 | 全批验收：仅白名单外链；无原始 `<script>` | smoke（构建）+ 静态 | 全量构建 + 24 文件 / sidebar / 外链断言 | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Rows map to the six plans' concrete task IDs（`10-01`..`10-06`）。每计划的 Task 0 检查点，以及 `10-06` Task 2，为人工门禁，见下方 Manual-Only Verifications。*

---

## Wave 0 Requirements

> `10-01`（Wave 0）已扩展为「旧内容清空 + 站点注册」，下列为其实际范围（与 `10-01-PLAN.md` 一致）：

- [ ] 删除旧内容 — `docs/index.md` + `docs/guide/`、`docs/dev/`、`docs/logger/`、`docs/api/`（D-04 已并入本批 Wave 0 / 10-01）
- [ ] 清理 `docs/.vitepress/config.ts` 的旧 `nav`/`sidebar` 键 — 移除指向已删内容的旧 `nav` 入口（主页 / 指南 / API / 错误代码）与旧 sidebar 键（guide / logger / api 三个路径前缀）
- [ ] 解除 `config.ts` 对 `./apiSidebar` 的静态依赖，并给 `docs/.vitepress/api.ts` 的 `generateSidebar()` 加缺失目录守卫（`node:fs` 的 `existsSync`）— 使 `tsx docs/.vitepress/init.ts` 与 `docs:dev` 在 `docs/api/` 缺失时安全跳过、不再抛 ENOENT
- [ ] 注册 `nav` 入口与 `sidebar['/intermediate/']`（4 组 / 24 条，顺序 4/8/9/3）并创建 `docs/intermediate/` 目录 — 供后续写作计划落点
- [ ] 完成后运行 `tsx docs/.vitepress/init.ts && pnpm docs:build` — 必须打印 `build complete`、**dead link = 0、无 import 失败**；否则视为 Wave 0 未通过

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
