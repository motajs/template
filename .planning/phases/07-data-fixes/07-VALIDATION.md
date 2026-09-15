---
phase: "7"
slug: "data-fixes"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-15"
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vite.config.ts` (`test: { testTimeout: 30000, hookTimeout: 30000 }` at `:46-49`) |
| **Quick run command** | `pnpm exec vitest run <测试文件或目录>` |
| **Full suite command** | `pnpm test:ci` (= `vitest run`, non-watch) |
| **Estimated runtime** | ~90 seconds (full suite) |

---

## Sampling Rate

- **After every task commit:** System-focused command (see map) → then D-44 gate: `pnpm exec eslint --fix <改动文件>` + `pnpm exec eslint <改动文件>` (0 errors); `pnpm exec vue-tsc --noEmit` filtered by changed-file paths (0 errors)
- **After every plan/system:** `pnpm test:ci` (full suite green)
- **Before `/gsd-verify-work`:** Full suite green + WINDOWS.md ids 19–27 结清
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

每行对应一条 finding；取消 `it.skip` 后必须转绿（D-10）。

| Finding | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| #06-01-1 | combat | 1 | FIX-01 | — | N/A | unit | `pnpm exec vitest run packages-user/data-system/src/combat/damage.test.ts` | ✅ | ⬜ pending |
| #06-01-2 | combat | 1 | FIX-01 | T-7-01 | 清理来源伤害不留幽灵数据 | unit | `pnpm exec vitest run packages-user/data-system/src/combat/mapDamage.test.ts` | ✅ | ⬜ pending |
| #06-01-3 | combat | 1 | FIX-01 | — | 战前脚本放弃语义与文档一致 | unit | `pnpm exec vitest run packages-user/data-system/src/combat/combat.test.ts` | ✅ | ⬜ pending |
| #06-01-4 | combat | 1 | FIX-01 | — | 全量重建从原始怪物重算 | unit | `pnpm exec vitest run packages-user/data-system/src/combat/damage.test.ts` | ✅ | ⬜ pending |
| #06-15-1 | combat | 1 | FIX-01 | — | 删除光环后属性回退基础值 | unit | `pnpm exec vitest run packages-user/data-system/src/combat/context.test.ts` | ✅ | ⬜ pending |
| #06-03-1 | enemy | 1 | FIX-01 | — | 复用映射生成独立怪物 | unit | `pnpm exec vitest run packages-user/data-base/src/enemy/manager.test.ts` | ✅ | ⬜ pending |
| #06-04-1 | replay | 1 | FIX-01 | T-7-02 | 录像参数编解码精确往返 | unit | `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts` | ✅ | ⬜ pending |
| #06-04-2 | replay | 1 | FIX-01 | T-7-02 | 多字节 bigint 无符号解码 | unit | `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts` | ✅ | ⬜ pending |
| #06-04-3 | replay | 1 | FIX-01 | T-7-02 | delete 后索引与参数对齐 | unit | `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts` | ✅ | ⬜ pending |
| #06-04-4 | replay | 1 | FIX-01 | T-7-02 | insert 后参数位移正确 | unit | `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts` | ✅ | ⬜ pending |
| #06-05-1 | hero | 1 | FIX-01 | — | 无修饰器时 final 反映 base | unit | `pnpm exec vitest run packages-user/data-base/src/hero/attribute.test.ts` | ✅ | ⬜ pending |
| #06-05-2 | hero | 1 | FIX-01 | — | 优先占用空装备槽 | unit | `pnpm exec vitest run packages-user/data-base/src/hero/equipment.test.ts` | ✅ | ⬜ pending |
| #06-05-3 | hero | 1 | FIX-01 | — | 码 147 保留未用、设计如此（不转绿） | static | `Select-String -Path packages-user/data-base/src/hero/equipment.test.ts -Pattern "保留错误码"` | ✅ | ⬜ pending |
| #06-06-1 | map | 1 | FIX-01 | T-7-03 | 越界转换发码 128 | unit | `pnpm exec vitest run packages-user/data-base/src/map/mapLayer.test.ts` | ✅ | ⬜ pending |
| #06-07-1 | path | 1 | FIX-01 | — | 顶层录像瞬移可用（**用户接线后**） | integration | `pnpm exec vitest run packages-user/data-state/test/replayPlayback.test.ts` | ✅ | ⬜ pending |
| #06-08-1 | flag+common | 1 | FIX-01 | — | 多步后退沿同一轴 | unit | `pnpm exec vitest run packages-user/data-common/src/common/mover.test.ts` | ✅ | ⬜ pending |
| #06-09-1 | save | 1 | FIX-01 | T-7-01 | 压缩档装备加成可恢复 | unit | `pnpm exec vitest run packages-user/data-base/src/hero/saveLoad.test.ts` | ✅ | ⬜ pending |
| #06-09-2 | save | 1 | FIX-01 | T-7-01 | 存档深拷贝、活对象不污染 | unit | `pnpm exec vitest run packages-user/data-base/src/hero/saveLoad.test.ts` | ✅ | ⬜ pending |
| #06-09-3 | save | 1 | FIX-01 | T-7-01 | 同实例读档恢复图块数字 | unit | `pnpm exec vitest run packages-user/data-base/src/map/saveLoad.test.ts` | ✅ | ⬜ pending |
| #06-09-5 | save | 1 | FIX-01 | T-7-04 | 码 178 独立诊断多出 key | unit | `pnpm exec vitest run packages-user/data-state/test/saveablesRoundTrip.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

- 20 条正确预期用例（`it.skip`）均已存在（Phase 6 / gap-fill 06-10..06-15 产出）
- 无新增测试文件、无新增 fixture、无框架安装需求（D-10：不新增用例）
- 执行前置（非文件）：(i) D-09 逐计划方案汇报与用户确认；(ii) `#06-07-1` 由用户负责接线，path 计划的取消 skip 验证需等待用户完成

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `#06-07-1` CoreState → `pathfinding.finder` 注入 | FIX-01 | D-07 规定由用户亲自修改，AI 不实现 | 用户完成后确认 `state.pathfinding.teleportTo` 不再发码 173；随后取消 `replayPlayback.test.ts` 对应 `it.skip` 并跑绿 |
| `#06-05-3` 码 147 保留未用判定 | FIX-01 | D-06 为设计裁决，非行为修复 | 静态审查 `equipment.test.ts` 对应 skip 保留且有注释；确认未纳入取消 skip 清单 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
