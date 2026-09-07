---
phase: "1"
slug: "event"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-07"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 |
| **Config file** | none — 根 `package.json` `"test": "vitest"`，无 `vitest.config.*` |
| **Quick run command** | `pnpm check:type` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~30 seconds (quick) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm check:type`
- **After every plan wave:** Run `pnpm check:circular` + `pnpm lint:user`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| -01-01 | 01 | 1 | EVT-01 | — | 事件数据容忍非法块名/参数（logger.warn 非抛异常） | unit | `pnpm check:type` | ❌ W0 | ⬜ pending |
| -01-02 | 01 | 1 | EVT-02 | T-1-01 | 踩踏触发→事件执行、对话 await、开门链路 | integration | `pnpm check:type` + 手动验证 | ❌ W0 | ⬜ pending |
| -01-03 | 01 | 1 | EVT-03 | — | 旧 ITrigger 无残留引用、无复杂通用表达式 | static | `pnpm check:type` + `pnpm check:circular` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages-user/data-common/src/event/event.test.ts` — `GameEvent` compile/execute/缓存回写冒烟（可选，TEST-01 在 Phase 6）
- [ ] `packages-user/data-common/src/store/eventStore.test.ts` — `addEvent`/`getEvent`（可选）

*说明：TEST-01 单测补齐为 Phase 6；本阶段以 `check:type`/`check:circular`/`lint:user` 为主要验证门禁。*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 对话/开门端到端事件链路 | EVT-02 | 依赖 A2 内建函数清单（暂缓），无自动断言 | 清单落地后补 vitest 冒烟或手动走查 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < ~30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
