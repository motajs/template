---
phase: 09-minimum-browser-runnable
plan: 18
subsystem: docs
tags: [data-migration, audit, read-only, texture-list, schema, tile-num, animates, terrains]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-17 产出的只读盘点台账 09-DATA-MIGRATION-AUDIT.md（本次原地修订对象）"
provides:
  - "按用户 2026-10-13 四条指示修订后的 09-DATA-MIGRATION-AUDIT.md（只读盘点台账，未实施迁移）"
  - "四条指示的逐条落实位置、命名候选清单（num 分配策略 + texture/.list.jsonc 类型声明）、七项计数（不变）"
affects: [09-19 or later 旧引擎数据迁移计划, texture/.list.jsonc schema 落地]

# Actuals (#2632) — chars/4 over the revised artifact + summary (docs-only plan; no source diff)
actuals:
  tokens: 15000
  tasks: 2
  commits: 0

# Tech tracking
tech-stack:
  added: []
  patterns: ["只读盘点台账的原地修订（增改不删既有正确内容）", "字段级三分标注：映射候选 / 待定 / 只记录不移植"]

key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-18-SUMMARY.md
  modified:
    - .planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-AUDIT.md

key-decisions:
  - "指令 1：animates 并入 terrains（素材分组），与逻辑类型映射 animates → TileType.Animate 显式区分"
  - "指令 2：只记录、不移植 严格限定为目标接口无对应字段；§8 重构为 8.1/8.2/8.3"
  - "指令 3：图块 num 可全部重排（唯一约束 id↔num 一致）；新增 §1.5（id 全清单 + 4 个 num 分配策略候选）"
  - "指令 4：§7.1 补显式 TypeScript 类型声明（四个 entry 接口 + 联合别名 + 顶层配置接口）"
  - "autotile 条目 AutotileType 参数与判别字段 type 同名冲突，暂以候选名 autotileType 消歧（§8.3 U-19）"

patterns-established:
  - "字段分类三分法：映射候选（可确定） / 待定（有目标字段但映射不确定） / 只记录、不移植（目标接口无对应字段）"

requirements-completed: []

coverage:
  - id: D1
    description: "指令 1 —— animates 并入 terrains（强化到无歧义，并区分逻辑类型映射与素材分组）已落到 §0.5.1 / §1.1 / §1.4 / §2.1 / §2.4 / §2.5 / §5 / §9"
    verification:
      - kind: other
        ref: "node gate REV-AUDIT-A / REV-AUDIT-B: token '不设独立' 落在 §0 且在 §2 及之后强化"
        status: pass
    human_judgment: true
    rationale: "文档表述的『无歧义』程度需用户确认（OI-4）"
  - id: D2
    description: "指令 2 —— 只记录、不移植 严格二分 + §1.2/§3.1/§4.2/§6.2 分类列 + §8 重构为 8.1/8.2/8.3"
    verification:
      - kind: other
        ref: "node gate: '只记录、不移植' / '待定' / '### 8.1' / '### 8.2' / '### 8.3' 存在"
        status: pass
    human_judgment: true
    rationale: "字段分类的判定依据（是否存在对应字段）需用户复核"
  - id: D3
    description: "指令 3 —— §1 明确 num 可全部重排 + §1.5 id 全清单（235 条）+ 4 个 num 分配策略候选（待报备）"
    verification:
      - kind: other
        ref: "node gate: '可全部重新分配' / 'id 全清单' / 'num 分配策略候选' 存在；§1.5.1 合计 235"
        status: pass
    human_judgment: true
    rationale: "num 分配策略采用哪种待用户裁定（OI-1）"
  - id: D4
    description: "指令 4 —— §7.1 显式 TypeScript 类型声明（四个 entry 接口 + 联合别名 + 顶层配置接口）"
    verification:
      - kind: other
        ref: "node gate: 'interface ' / 'type ' / 'ITextureListConfig' / 'ITextureListGridEntry' 存在"
        status: pass
    human_judgment: true
    rationale: "所有类型名 / 字段名为命名候选，待用户报备批准（OI-2）"

# Metrics
duration: ~20min
completed: 2026-10-13
status: complete
---

# Phase 9 Plan 18: 按用户四条指示修订旧引擎数据迁移只读盘点台账 Summary

**按用户 2026-10-13 四条指示原地修订 `09-DATA-MIGRATION-AUDIT.md`：`animates` 并入 `terrains` 强化到无歧义、字段级三分标注并重构 §8 为 8.1/8.2/8.3、`num` 可全部重排并补 `id` 全清单与策略候选、§7 补显式 TypeScript 类型声明 —— 全程只读，零源码 / 零数据 / 零 PNG 改动。**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-10-13T08:20Z（约）
- **Completed:** 2026-10-13T08:37Z
- **Tasks:** 2（Task 0 汇报关卡已由用户「可以执行」满足）
- **Files modified:** 1（`09-DATA-MIGRATION-AUDIT.md` 原地修订）+ 1 新增（本 SUMMARY）

## Accomplishments

- **指令 1（`animates` 并入 `terrains`）**：新增 §0.5.1 固定表述「**`animates` 并入 `terrains`，不设独立 `animates` 素材组**」，并明确区分**素材分组**（并入 `terrains`）与**逻辑类型映射**（§1.1 `animates` → `TileType.Animate` 保留）；§1.1 / §1.4 / §2.1 / §2.4 / §2.5 / §5（交叉引用）/ §9 同步强化。
- **指令 2（严格界定「只记录、不移植」）**：`ITileRawData` / `ITilePassData` / `IEnemyRawData` / `IItemRawData` / `IMapRawData` 为目标判定基准；§1.2 / §3.1 / §4.2 / §6.2 各表**新增「分类」列**逐字段标注三类；`trigger` / map `events` 等**有目标字段项标「待定」而非「只记录」**；§8 **重构**为 §8.1（无目标字段 → 只记录、不移植）/ §8.2（有目标字段但映射不确定 → 待定）/ §8.3（其他待确认观察），并与各表逐条一致。
- **指令 3（`num` 可全部重排）**：§1 加入固定表述「图块 `num` 可全部重新分配，不沿用旧引擎顺序，唯一约束是 `id` ↔ `num` 一致」；新增 §1.5：**235 条 `id` 全清单**（按 `cls` 分组，合计 235）+ **4 个 `num` 分配策略候选**（A 按 `TileType` 分段 / B 沿用旧 `num` / C 按目标贴图分组 / D 按 `id` 次序），均「待用户报备批准」。
- **指令 4（§7 显式类型声明）**：新增 §7.1，给出 `ITextureListGridEntry` / `ITextureListRowAnimateEntry` / `ITextureListAutotileEntry` / `ITextureListTilesetEntry` 四个 entry 接口、`TextureListEntry` 联合别名、`ITextureListConfig` 顶层配置接口，字段对齐 `addGrid` / `addRowAnimate` / `addAutotile` / `addTileset`；全部命名标注「待用户报备批准」。
- **计数不变**：`TILE-COUNT: 235` / `MATERIAL-COUNT: 17` / `SPLIT-COUNT: 42` / `ENEMY-COUNT: 81` / `ITEM-COUNT: 62` / `NPC-COUNT: 24` / `MAP-COUNT: 5` 七项值均未变。
- **只读确认**：仅写 `09-DATA-MIGRATION-AUDIT.md`（原地）与本 SUMMARY；未改任何 `.ts`/`.tsx`、`public/project/**`、`src/content/**`；未生成 `.png`；未改 09-17 计划 / 摘要、`ROADMAP.md`、`STATE.md`、`09-CONTEXT.md`。

## Task Commits

本计划**未提交**（经用户指示：产出留在工作树供审阅，不得 `git add` / `git commit`）。

1. **Task 1（指令 1 §0 + 指令 2 §1 + 指令 3）** - 未提交（工作树内修订）
2. **Task 2（指令 1 §2/§5/§9 + 指令 2 §3/§4/§6 + §8 重构 + 指令 4 §7 + SUMMARY）** - 未提交（工作树内修订）

_Note：仅本 SUMMARY 为新增文件；`09-DATA-MIGRATION-AUDIT.md` 为原地修订（09-17 产出，原为工作树未跟踪文件）。_

## Files Created/Modified

- `.planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-AUDIT.md` - 原地修订：§0.5.1（新增强化）、§1（`num` 重排说明）、§1.1（消歧）、§1.2（分类列）、§1.4（强化）、§1.5（新增）、§2.1/§2.4/§2.5（强化）、§3.1/§4.2/§6.2（分类列）、§5（交叉引用）、§7.1（新增显式 TS 类型声明）、§8（重构为 8.1/8.2/8.3）、§9（命名说明）
- `.planning/phases/09-minimum-browser-runnable/09-18-SUMMARY.md` - 本执行摘要（新增）

## Decisions Made

- **`animates` 归属**：明确「素材 / 分图分组并入 `terrains`」与「逻辑类型映射 `animates` → `TileType.Animate` 保留」为两件事（消歧，OI-4）。
- **分类三分法**：以目标接口是否存在对应字段为唯一判定基准；`trigger`（`ITileRawData.events`/`eventPass`）、map `events`（`IMapRawData.events`）确认为「待定」而非「只记录」。
- **`num` 策略**：只记录 4 个候选，不选型、不落地（OI-1）。
- **autotile `type` 同名冲突**：§7.1 暂以候选字段名 `autotileType` 消歧，作为 §8.3 U-19 观察（不登记为缺陷），最终命名待用户裁定（OI-2）。

## Deviations from Plan

None - 计划按用户四条指示执行。计划中允许的「仓库外只读基线」按 Task 1 `<action>` 步骤 (0) 写入 `%TEMP%\opencode\gsd-09-18-baseline.txt`（基线为空 = 执行前无生产文件 / 数据改动）；`<verify>` 幂等未覆写。

> 说明（非偏差）：用户指示「§5 相关处」中，本文档 §5 为 NPC 节、与 `animates`/`terrains` 无关，故按计划 assumptions 以「交叉引用」方式落实（OI-3）。

## Issues Encountered

None。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 修订后的 `09-DATA-MIGRATION-AUDIT.md` 已就位，供用户审阅后派发后续「旧引擎数据迁移计划」。
- 待用户裁定 / 报备项：**OI-1**（`num` 分配策略）、**OI-2**（`texture/.list.jsonc` 类型 / 字段命名）、**OI-3**（§5 定位处理方式）、**OI-4**（`animates` 消歧方式）；另有 §8.3 U-19（autotile `type` 同名冲突命名）。
- 未提交：产出留在工作树，用户确认后再决定后续流程。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-13*
