---
phase: "07"
slug: "data-fixes"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-16"
---

# Phase 07 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| 录像存档 → 解码器 | 录像参数经定长/长度前缀解码还原为命令参数，长度与索引读取必须无符号且与编码对称 | replay 命令/参数（完整性敏感） |
| 命令索引 ↔ 参数字节偏移 | 同一 `number[]` 承担两种语义，混用即产生静默错位 | 内部索引（完整性敏感） |
| 存档 → 读档 | `CoreState` / 各 saveable 的 `loadState` 决定缺失/多余 key 的诊断与状态恢复 | 存档快照（版本一致性敏感） |
| 顶层装配 → finder | `maps`/`layer`/谓词未注入或为 null 时 finder 返回空路径并上报诊断码 | 寻路输入（可用性/DoS） |
| 包管理器 → 仓库 | 本阶段无安装动作 | — |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-7-01 | Tampering | `mapDamage.ts`（route A store 写入）；`equipStore.ts` `loadNoCompression`/`loadDiff` | high | mitigate | 补齐 `viewStore`/`damageStore` 登记使删除/刷新路径正确；压缩档读档以 `item.equip` 为基准回退 | closed |
| T-7-02 | Tampering | `array.ts` `decodeParam`/`normalizeParam` | medium | mitigate | int64 乘数修正、bigint 幅值按位取字节 + `getUint8` 无符号读取；负值经独立 type 5/8 | closed |
| T-7-03 | Tampering | `mapLayer.ts` `transferToDynamic` | low | mitigate | 越图分支改发码 128，与两个 `transferToStatic*` 越界语义一致 | closed |
| T-7-04 | Tampering / Repudiation | `core.ts` `loadState` 码 178 | low | mitigate | `loaded.difference(total)`，178 独立诊断「存档多出的 key」，不再与 177 重叠 | closed |
| T-7-05 | Tampering | `context.ts` `buildup()` | medium | mitigate | 全量重建前对每个视图调用既有 `view.reset()`，消除属性累加 | closed |
| T-7-06 | Repudiation | `combat.ts` 战前脚本 | low | mitigate | `before` 返回 false 才放弃战斗，对齐 `types.ts:772` jsdoc；同步纠偏既有用例 | closed |
| T-7-07 | Tampering | `manager.ts` `createEnemy`/`createEnemyById` | low | mitigate | 统一经 `internalGetPrefab`，接入复用映射 | closed |
| T-7-08 | Tampering | `array.ts` `delete`/`insert` 索引位移 | medium | mitigate | 命令索引与参数字节偏移严格区分；`getParamRange` 末步哨兵 | closed |
| T-7-09 | Tampering | `equipment.ts` `saveState` | medium | mitigate | `equipped`/`slots` 深拷贝，满足 `ISaveableContent` 契约 | closed |
| T-7-10 | Tampering | `attribute.ts` `recalculateAttribute` | low | mitigate | 无修饰器时同步 `finalAttribute` 与 base | closed |
| T-7-11 | Tampering | `dynamicTile.ts` `loadState` | medium | mitigate | 恢复 `num`（`set(save.num)`），保持一参签名 | closed |
| T-7-12 | Tampering | `mover.ts` `prepareStep` 的 `Special` 后退 | low | mitigate | 后退基准取 `faceDirection`，多步后退同轴、不摆动 | closed |
| T-7-13 | Repudiation | `mover.ts` `IObjectMover.backward` jsdoc | low | mitigate | 按 D-11 同步契约注释与实现（多步同轴） | closed |
| T-7-14 | DoS（功能性） | `path/finder.ts` 的 `layer = null` 早退路径（告警 173）与楼层切换重注入缺口 | low | accept | 接线由用户完成（D-07）；`layer = null` 为有意设计，测试侧显式绑定 `map.eventLayer` 规避；切层重注入属用户负责后续项，未修改生产代码 | closed（accepted） |
| T-7-SC | Tampering | npm/pip/cargo 安装 | high | accept | 本阶段不安装任何包（`package.json`/`pnpm-lock.yaml` 不变）；执行中未出现安装需求 | closed（accepted） |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

**Classification result:** 14/14 threats closed; `threats_open: 0`. Register authored at plan time (`<threat_model>` present in all 8 PLANs); ASVS L1 short-circuit applies (grep-depth sufficient). All `mitigate` threats were independently confirmed implemented by the phase verifier (`07-VERIFICATION.md`, status passed) and by post-phase code review (`07-REVIEW.md`).

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-07-01 | T-7-14 | `core.ts:238` 的 `useMapLayer(null)` 为有意设计（勇士初始不在任何楼层）；楼层切换时的重注入由用户后续处理。关联的 `teleportTo` 自目标/空路径行为（返回 null → 2005 → sandbox 挂起）同为未登记缺陷，登记于 `07-08-SUMMARY.md`，本阶段不修 | user (D-07/D-09) | 2026-09-16 |
| AR-07-02 | T-7-SC | 本阶段不引入任何依赖（`package.json`/`pnpm-lock.yaml` 未变），无可执行的供应链面 | user | 2026-09-16 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-16 | 14 | 14 | 0 | orchestrator (grep-depth L1, ASVS L1 short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-16
