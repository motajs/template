---
phase: 09-minimum-browser-runnable
plan: 17
subsystem: data-migration
tags: [legacy-migration, read-only-audit, tile, textures, enemy, item, npc, map, texture-list-schema]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: "旧引擎数据（public/project）与新引擎落点（src/content）的只读映射台账"
provides:
  - "09-DATA-MIGRATION-AUDIT.md：任务 8 只读盘点台账（§0..§9，235 tile / 17 texture / 42 split / 81 enemy / 62 item / 24 npc / 5 map）"
affects: [data-migration-plan, texture-list-schema]

# Actuals (#2632) — no commit (per user instruction to leave output in working tree)
actuals:
  tokens: 13680
  tasks: 2
  commits: 0

tech-stack:
  added: []
  patterns: ["只读台账 + 执行前基线对比只读守卫 + 命名候选集中报备"]

key-files:
  created:
    - ".planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-AUDIT.md"
  modified: []

key-decisions:
  - "全程只读：唯一写入为盘点文档 + SUMMARY（+ 仓库外只读基线），零 .ts/.tsx、零 public/project/**、零 src/content/** 改动，零 PNG 生成"
  - "命名候选（拆分文件名 / identifier / 参数名 / .list.jsonc 字段名）只入台账并标注「待用户报备批准」，不落地"
  - "textures 维度显式含 materials/*.png + autotiles/*.png + tilesets/*.png；autotiles/tilesets 不套用 D-72⑤"
  - "D-72⑤ 读法（单帧 4×4、多帧 帧数列×4 行）与 SPLIT-COUNT=42 记入 §8 U-1 待用户确认"
  - "无法静态确定者一律入 §8「未确定项 / 待确认观察」，未登记为缺陷"

patterns-established:
  - "只读盘点以执行前基线（仓库外）对比作只读守卫，可检出执行期越界写入"

requirements-completed: []

coverage:
  - id: D1
    description: "只读盘点台账 09-DATA-MIGRATION-AUDIT.md（§0 口径 + §1 tile + §2 textures + §3 enemy + §4 items + §5 NPC + §6 maps + §7 schema 草案 + §8 未确定项 + §9 汇总）"
    verification:
      - kind: other
        ref: "node -e 静态门禁（AUDIT-TILE-TEX / AUDIT-MIG-FINAL：章节 / 计数 / token / 锚点有效性）+ READONLY 守卫"
        status: pass
    human_judgment: true
    rationale: "盘点的映射候选、拆分方案读法与命名候选均需用户逐项报备 / 裁定（D-73）；自动化只能校验结构、计数与锚点有效性，不能替代人工确认语义"
  - id: D2
    description: "只读保证：零源码 / 零数据 / 零 PNG 改动（执行前基线对比 READONLY 门禁全绿）"
    verification:
      - kind: other
        ref: "node READONLY gate（Task 1 / Task 2）+ git status --porcelain"
        status: pass
    human_judgment: false

duration: 1h
completed: 2026-10-13
status: complete
---

# Phase 9 Plan 17: 旧引擎数据迁移只读盘点 摘要

**旧引擎 `public/project` 数据到新引擎接口（`ITileRawData` / `IEnemyRawData` / `IItemRawData` / `IMapRawData` / `TextureManager`）的只读映射台账：235 tile / 17 texture / 42 split / 81 enemy / 62 item / 24 npc / 5 map**

## Performance

- **Duration:** ~1h
- **Completed:** 2026-10-13
- **Tasks:** 2（Task 0 为已闭环的 `blocking-human` 汇报关卡，见下）
- **Files modified:** 1（新增盘点文档；另新增 1 份 SUMMARY）

## Task 0 说明（执行前汇报关卡）

本计划第一个 block 点是 Task 0 `checkpoint:decision@blocking-human`（AGENTS.md 硬要求 / D-03 / D-74）。**该关卡在本次执行前已闭环**：用户已就预执行汇报明确回复「可以执行」四个字（含盘点范围六类、textures 维度含 materials + autotiles + tilesets、七个维度、D-72 五条拆分规则与 tilesets/autotiles 例外、命名候选报备方式、产出路径、只读保证与开放项 OI-1..OI-6）。据此执行 Task 1 / Task 2；未再重复询问。

## Accomplishments

- 产出只读盘点台账 `09-DATA-MIGRATION-AUDIT.md`（54718 字节 / 817 行 / 裸 LF），含 §0..§9 完整章节。
- §1 登记 `blocksInfo` 全表 **235** 图块（8 个 `cls`）+ `cls → TileType` 与字段映射候选 + id/num 全清单。
- §2 登记 **17** 个 PNG（materials 12 + autotiles 4 + tilesets 1）与实际像素尺寸，按 D-72 五规则给出 materials 拆分方案（目标图 **42** 张）+ autotiles/tilesets 例外参数候选。
- §3/§4/§5/§6 分别给出 enemy(81) / items(62) / NPC(24) / maps(5) 映射候选。
- §7 给出 `texture/.list.jsonc` 字段结构草案（与 §2 逐条一致）；§8 集中登记 18 项未确定项（未登记为缺陷）；§9 汇总七维度计数。
- 全程只读：只读基线对比守卫（Task 1 / Task 2）与 `git status --porcelain` 全绿。

## Files Created/Modified

- `.planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-AUDIT.md`（新增，只读盘点台账 §0..§9）
- `.planning/phases/09-minimum-browser-runnable/09-17-SUMMARY.md`（新增，本摘要）

## 各维度计数

| 维度 | 计数 | 机器可读行 |
| --- | --- | --- |
| 图块 tile | 235 | `TILE-COUNT: 235` |
| 贴图素材 textures | 17 | `MATERIAL-COUNT: 17` |
| 素材拆分目标图 split | 42 | `SPLIT-COUNT: 42` |
| 怪物 enemy | 81 | `ENEMY-COUNT: 81` |
| 道具 items | 62 | `ITEM-COUNT: 62` |
| NPC | 24 | `NPC-COUNT: 24` |
| 地图 maps | 5 | `MAP-COUNT: 5` |

## 命名候选清单（待用户报备批准）

均**只作候选入台账，本计划不落地使用**（D-73 / AGENTS.md）：

| 类别 | 候选 |
| --- | --- |
| materials 拆分图（terrains 单帧） | `terrains0.png` / `terrains1.png` / `terrains2.png` |
| materials 拆分图（animates 并入 terrains） | `terrainsAnim0.png` … `terrainsAnim7.png` |
| materials 拆分图（items） | `items0.png` … `items3.png` |
| materials 拆分图（enemy） | `enemy0.png` … `enemy20.png` |
| materials 拆分图（npc） | `npc0.png` … `npc5.png` |
| `addAutotile` 的 `identifier` 参数 | `20` / `151` / `152` / `153` |
| `addAutotile` 的 `type` 参数 | `AutoTileType.Big3x4` |
| `addTileset` 的 `identifier.alias` | `magictower` |
| `addTileset` 的 `cellWidth` / `cellHeight` | `32` / `32`（待确认） |
| `.list.jsonc` 承载字段名 | `grid` / `rowAnimate` / `autotile` / `tileset` |

## OI-1..OI-6 最终裁定（本计划处置）

| 开放项 | 处置 |
| --- | --- |
| OI-1（产出文档命名 / 路径） | 采用 `.planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-AUDIT.md`（Task 0 已获批） |
| OI-2（文档章节结构） | 采用 §0..§9 五节序列（如实现） |
| OI-3（命名候选呈现方式） | 采用「命名候选（待报备）」集中表，逐条标注「待用户报备批准」（§2.5 / §4 / §7 / §9） |
| OI-4（拆分方案粒度，含例外） | 按 D-72 五规则逐组列出目标图 + 来源 + 帧数 + 行列布局；tilesets/autotiles 各给参数候选（§2.2–§2.4） |
| OI-5（schema 草案深度） | 仅给 `texture/.list.jsonc` 字段结构草案与到四个方法的对应，不含最终命名落地（§7） |
| OI-6（未确定项与只读守卫口径） | 无法确定者一律入 §8（未登记为缺陷）；只读守卫采用「执行前基线对比」，基线由 Task 1 步骤 (0) 一次性写入仓库外，`<verify>` 幂等不覆写 |

## Deviations from Plan

None - plan executed exactly as written（Task 0 关卡已预先闭环；无源码 / 数据 / PNG 改动；无命名落地）。

## Issues Encountered

无。所有静态门禁（Task 1：基线幂等 + 结构 / 计数 / token / 锚点 + READONLY；Task 2：结构 / 七计数 / token / 锚点 + READONLY + `git status`）全绿。

## 只读确认

- 未修改 / 删除 / 新增任何生产 `.ts` / `.tsx` 源码。
- 未修改 / 删除 / 新增任何 `public/project/**` 与 `src/content/**` 数据文件。
- 未生成任何 `.png`；未改动任何既有注释；未改 `ROADMAP.md` / `STATE.md` / `09-CONTEXT.md`。
- 唯一新增文件为盘点文档与本 SUMMARY（另在仓库外临时目录写入只读基线 `%TEMP%/opencode/gsd-09-17-baseline.txt`）。
- 未执行 `git add` / `git commit`（按执行指示将产出留在工作树，供用户审阅后自行决定提交）；未触碰用户并发改动（`AGENTS.md`）。

## Next Phase Readiness

- 盘点台账已可直接供后续「旧引擎数据迁移」计划消费（字段映射候选 + 拆分方案 + 命名候选）。
- §8 的 18 项未确定项与 §2.5 命名候选待用户裁定 / 报备后，方可进入迁移实施计划。

## Self-Check

- FOUND: `.planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-AUDIT.md`
- FOUND: `.planning/phases/09-minimum-browser-runnable/09-17-SUMMARY.md`
- COMMITS: 0（按执行指示未提交，产出留在工作树）

## Self-Check: PASSED

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-13*
