---
phase: 09-minimum-browser-runnable
plan: 19
subsystem: data-migration
tags: [jsonc, png, zlib, texture-atlas, tile, enemy, item, map, data-migration]

requires:
  - phase: 09-minimum-browser-runnable
    provides: "09-17/09-18 产出的只读盘点台账 09-DATA-MIGRATION-AUDIT.md（字段映射候选 + §8.1/§8.2 分区）"
provides:
  - "src/content/{tile,enemy,item}.jsonc 真实基础数据（235 / 81 / 62 条）"
  - "src/content/maps/{empty,MT0,sample0,sample1,sample2}.jsonc + maps/.list.jsonc"
  - "src/content/texture/ 43 张拆分图 + 4 autotile + 1 tileset + .list.jsonc"
  - "script/migrateProjectTextures.ts 一次性零依赖 PNG 生成脚本（Node zlib）"
  - "09-DATA-MIGRATION-AUDIT.md 的 48px 事实与拆分计数更正（D-84 / D-85）"
  - "09-DATA-MIGRATION-UNMAPPED.md（仅 §8.1 无目标字段）"
affects: [09-minimum-browser-runnable]

actuals:
  tokens: 133232
  tasks: 4
  commits: 0

tech-stack:
  added: []
  patterns:
    - "零依赖 Node zlib 手写 PNG 编解码（IHDR/IDAT 解析 + inflate/deflate + 反滤镜 + CRC32）"
    - "num 策略 A：按 TileType 分段、段内旧 num 升序、从 1 起连续编号"
    - "拆分图列数固定、行数 ≤4 且按每图实际块数裁剪（D-84）"
    - "48px 素材按尺寸与帧数分组、不放一块不留白不重采样（D-85）"

key-files:
  created:
    - script/migrateProjectTextures.ts
    - src/content/maps/empty.jsonc
    - src/content/maps/sample0.jsonc
    - src/content/maps/sample1.jsonc
    - src/content/maps/sample2.jsonc
    - src/content/texture/*.png
    - .planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-UNMAPPED.md
  modified:
    - .planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-AUDIT.md
    - src/content/tile.jsonc
    - src/content/enemy.jsonc
    - src/content/item.jsonc
    - src/content/maps/MT0.jsonc
    - src/content/maps/.list.jsonc
    - src/content/texture/.list.jsonc

key-decisions:
  - "num 策略 A 落地：段序 Terrain(2)/Animate(3)/Item(4)/Enemy(5)/Npc(6)/Autotile(7)，段内旧 num 升序，从 1 起连续，0 保留空图块"
  - "贴图布局按 D-84：列数固定（单帧 4 / 多帧 = 帧数列），行数 ≤4 按每图实际块数裁剪，末图可为 128×32 / 64×32 / 64×64 / 128×96"
  - "48px 素材按 D-85 按尺寸与帧数分组：npc0..6=7（32px 组 4 图 + 48px 组 3 图），SPLIT-COUNT=43"
  - "item 旧缺 text 的 13 条（wand/pack/I331..I341）显式写空字符串，不省略"
  - "source 精灵行序取自 public/project/icons.js（每类 id→素材索引，计数与 materials PNG 尺寸逐一吻合）；texture/.list.jsonc 的 map 按此顺序列出新 num"
  - "地图旧二维 map 行主序展平为单张图层（键 0），layerAlias={}，events={}"

patterns-established:
  - "一次性迁移脚本用 Node zlib 零依赖手写 PNG decode/encode，不新增依赖"
  - "素材索引权威：icons.js 的每类 id→行索引映射源素材 sprite 行"

requirements-completed: []

coverage:
  - id: D1
    description: "盘点台账 09-DATA-MIGRATION-AUDIT.md 的 48px 事实与拆分计数更正为自洽（4 帧 / 单元格 32×48 / 行数 8、10；enemy 21 / npc 7 / SPLIT-COUNT 43 / npc0..6）"
    verification:
      - kind: other
        ref: "node gate-task1-ledger.js（LEDGER GATE）"
        status: pass
    human_judgment: false
  - id: D2
    description: "三类实体 jsonc：tile.jsonc 235 / enemy.jsonc 81 / item.jsonc 62，基础字段全量、精确键集、id/num 唯一"
    verification:
      - kind: other
        ref: "node gate-task2-entity.js + gate-task2-prefix.js（ENTITY / PREFIX GATE）"
        status: pass
    human_judgment: false
  - id: D3
    description: "43 张拆分图 + 4 autotile + 1 tileset + texture/.list.jsonc，尺寸按 D-84 逐图推导、npc=7 按 D-85 分组、覆盖全部有贴图图块"
    verification:
      - kind: other
        ref: "node gate-task3-texture.js + gate-task3-copy.js + gate-task3-dep.js（TEXTURE / COPY / DEP GATE）"
        status: pass
    human_judgment: false
  - id: D4
    description: "5 楼层地图 + maps/.list.jsonc + 09-DATA-MIGRATION-UNMAPPED.md（仅 §8.1）"
    verification:
      - kind: other
        ref: "node gate-task4-map.js（MAP GATE）"
        status: pass
    human_judgment: false
  - id: D5
    description: "消费接线（写 store / 写 TextureManager）不在本增量；由用户后续单独提供（D-70 / D-83）"
    verification: []
    human_judgment: true
    rationale: "消费接线按决策明确不在本计划范围，须由用户后续单独提供，非自动化可判定"

duration: 18min
completed: 2026-10-14
status: complete
---

# Phase 09 Plan 19: 旧引擎数据基础移植 + 盘点台账事实更正 Summary

**把 `public/project` 的六类基础数据移植为 `src/content` 的真实 jsonc 数据与 43 张零依赖生成的 PNG 素材（含按尺寸与帧数分组的 npc0..6），并更正盘点台账的 48px 素材事实（4 帧 / 单元格 32×48 / SPLIT-COUNT 43）**

## Performance

- **Duration:** 18 min
- **Started:** 2026-10-14T04:45:54Z
- **Completed:** 2026-10-14T05:04:00Z
- **Tasks:** 4 个执行任务（Task 0 为只读汇报关卡，已由用户「可以执行」通过）
- **Files modified:** 见 `key-files`（13 个文本文件 + 48 张 PNG）

## Accomplishments

- **Task 1 · 台账事实更正：** 更正 `09-DATA-MIGRATION-AUDIT.md` 的 48px 素材事实——§2.1 `enemy48.png`/`npc48.png` 行为 **4 帧列 / 单元格 32×48 / 行数 8、10**；§2.4 的 D / E 组按**帧数与尺寸**拆为 `enemys`(2f)/`enemy48`(4f)、`npcs`(2f)/`npc48`(4f)，含 `enemy = ceil(73/4)+ceil(8/4) = 19+2 = 21`、`npc = ceil(14/4)+ceil(10/4) = 4+3 = 7`；`SPLIT-COUNT` 由 42 → **43**（§2.4 / §9 / §8.3 U-1 三处一致）；§2.5 命名扩为 `npc0..6`（7 图）；§0.5.2 新增 D-84/D-85 修订口径与文件头「2026-10-13 用户更正」标注；§5.2 / §8.3 U-9/U-17 同步；标注 **D-81 的 npc 计数（`npc0..5`=6 / 42）已被 D-85 取代**（enemy 不受影响仍 `enemy0..20`=21）。**未改**字段分类判定、§8.1/§8.2 分区或条目增删。
- **Task 2 · 三类实体 jsonc：** 以 `num` 策略 A 建立全局 `id`↔`num` 基准并写 `tile.jsonc`（235）/ `enemy.jsonc`（81）/ `item.jsonc`（62），替换样例。
- **Task 3 · 素材 + list：** 写一次性零依赖 PNG 脚本 `script/migrateProjectTextures.ts`（Node `zlib`），按 D-72 **与 D-84 / D-85** 生成 **43 张**拆分图（列数固定、行数 ≤4 按需裁剪）+ 逐字节复制 4 autotile + 1 tileset，并写 `texture/.list.jsonc`（D-80 已批准 schema）。
- **Task 4 · 地图 + 文档：** 写 5 楼层 jsonc + `maps/.list.jsonc`（旧 `num` 重映射为新 `num`）+ `09-DATA-MIGRATION-UNMAPPED.md`（仅 §8.1），并跑最终静态门禁。

## 逐类映射口径

| 类别 | 范围 | 映射口径 | 产出 |
| --- | --- | --- | --- |
| tile | 235 | `id` / `cls→type`（§1.1）/ `cannotOut`+`cannotIn`→`pass.outPass`+`inPass`（位掩码取反：`方向 = 15 & ~被禁位`，`Up=1/Right=2/Down=4/Left=8`）；`events={}`、`eventPass=false`、默认 `pass={onlyEvents:true,outPass:15,inPass:15}` | 235 条，键集恰 6 键 |
| enemy | 81 | `num` = 对应图块新 `num`；`attribute` 取旧 `name/hp/atk/def/money/exp/point`；`special` 由旧数字数组生成 `{数字: null}` | 81 条，键集恰 3 键 |
| item | 62 | `num` = 对应图块新 `num`；`category` 按 §4.1（`tools`/`items`→`Consumable`=2、`equips`→`Equipment`=4、`constants`→`Constant`=1）；`name` 直取；`text` 直取（旧缺 13 条写 `""`）；`hideInToolbox` 旧值 | 62 条，键集恰 5 键 |
| map | 5 楼层 | `floorId`/`width`；旧二维 `map` 行主序展平为单张图层（键 `0`），数值经「旧 `num`→`id`→新 `num`」重映射（`0` 保持）；`layerAlias={}`、`events={}` | 5 条，顶层键集恰 5 键 |
| texture | 43 + 5 | 单帧组 `grid`（4 列、每图 16 格）、多帧组 `rowAnimate`（列=帧数列、每图 ≤4 块）；autotile/tileset 逐字节复制 | 43 拆分 + 4 autotile + 1 tileset |

## `num` 策略 A（D-79）分段取值

段序 `Terrain(2) → Animate(3) → Item(4) → Enemy(5) → Npc(6) → Autotile(7)`，段内按旧 `num` 升序、从 `num=1` 起连续分配（`0` 保留空图块）：

| 段 | 条数 | 新 `num` 区间 | 示例 |
| --- | --- | --- | --- |
| Terrain | 35 | 1–35 | `blueShopLeft`=1、`arrowUp`=7、`ground`=17、`sWallTBL`=35 |
| Animate | 29 | 36–64 | `yellowWall`=36 |
| Item | 62 | 65–126 | `yellowKey`=65、`wand`=115 |
| Enemy | 81 | 127–207 | `greenSlime`=127 |
| Npc | 24 | 208–231 | `man`=208 |
| Autotile | 4 | 232–235 | `autotile`=232、`autotile1`=233、`autotile2`=234、`autotile3`=235 |

**五处 `id`↔`num` 全局一致：** `tile.jsonc` 的 `num`、`enemy.jsonc`/`item.jsonc` 的 `num`、`texture/.list.jsonc` 的 `map`/`identifier`、`maps/*.jsonc` 图层数值。

## `text` 缺失 13 条的处置

旧 `items.js` 中 `wand` / `pack` / `I331`..`I341`（共 **13** 条，均 `cls: items`）无 `text`。本计划对其**显式写入空字符串 `""`**（与 `defaults/item.jsonc` 一致），**不省略**——以保证「恰 5 键」与 `typeof text === 'string'` 成立、数据自洽，而非依赖默认合并兜底。其余 §8.2 待定字段（`itemEffect`/`itemEffectTip`/`useItemEffect`/`useItemEvent`/`canUseItemEffect` 与 `equip` 子字段、`effect`/`equip`）沿用现有样例的**省略策略**（由默认合并兜底），仅在文档记录。

## 素材产出（43 张拆分图 + 5 张复制，D-72 / D-84 / D-85）

每张图**列数固定**（单帧 4 列 / 多帧 = 帧数列），**行数 ≤4 且按每图实际块数裁剪**；每张 `width = 列数 × 帧宽`、`height = 行数 × 帧高`（`1 ≤ 行数 ≤ 4`）。

| 组 | 图名 | 块/格 | 尺寸 | 帧尺寸 |
| --- | --- | --- | --- | --- |
| A `terrains` 单帧 | `terrains0`/`terrains1`（各 4 行）、`terrains2`（1 行，末图） | 16+16+3 | 128×128 / **128×32** | 32×32 |
| B `animates` 并入 `terrains` | `terrainsAnim0..6`（各 4 行）、`terrainsAnim7`（1 行，末图） | 7×4+1 | 128×128 / **128×32** | 32×32（4 帧） |
| C `items` 单帧 | `items0..3`（末图 14 格占满 4 行） | 16+16+16+14 | 均 128×128 | 32×32 |
| D `enemy`（32px 组） | `enemy0..17`（各 4 行）、`enemy18`（1 行，末图） | 18×4+1 | 64×128 / **64×32** | 32×32（2 帧） |
| D `enemy`（48px 组） | `enemy19`/`enemy20`（各 4 行） | 4+4 | 均 **128×192** | **32×48**（4 帧） |
| E `npc`（32px 组，D-85） | `npc0..2`（各 4 行）、`npc3`（2 行，末图） | 3×4+2 | 64×128 / **64×64** | 32×32（2 帧） |
| E `npc`（48px 组，D-85） | `npc4`/`npc5`（各 4 行）、`npc6`（2 行，末图） | 4+4+2 | 128×192 / **128×96** | **32×48**（4 帧） |

复制（逐字节，不重编码）：`autotile.png` / `autotile1.png` / `autotile2.png` / `autotile3.png`（4）+ `magictower.png`（1）。**`animates` 并入 `terrains`、不设独立 `animates` 素材组（D-72③）。**

## D-84 / D-85 处置与取代说明

- **D-84（贴图布局放宽）：** 台账 §2 的「严格 4 行（单帧 4×4 / 多帧 帧数列×4 行）」读法**已被 D-84 取代**——列数固定、行数 ≤4 且按每图实际块数裁剪；门禁按**实际行数**断言尺寸，不硬编码 4 行尺寸。
- **D-85（48px 素材分组 = 原 OI-3 的 A，已裁定）：** 不同尺寸 / 帧数的素材**必须用不同图片**——`npc` 按尺寸与帧数分组为 `npc0..6`（**7 图**）：32px 组 `npc0..2` 64×128 + `npc3` 64×64、48px 组 `npc4`/`npc5` 128×192 + `npc6` 128×96；**不放一块、不留白、不重采样**。台账 §2.5 的 `npc0..5`=6 计数**已被 D-85 取代**（enemy 不受影响仍 `enemy0..20`=21）。
- **D-85 字面描述的取代说明：** D-85 的 CONTEXT 文字「64×48」/「3×128×192」由权威口径取代——48px 单元格实为 **32×48**（帧数权威 `FrameNumbers`：`npc48` = 4 帧），且经 D-84 逐图裁剪后 48px 组为 `npc4`/`npc5` 128×192 + `npc6` 128×96（非「3×128×192」）。本计划实现为 32×48 与 `npc6`=128×96，据此保留。

## 地图图层键与旧→新重映射口径

- `mapState.fromRaw` 显示 `IMapRawData.map` 每个键是**整张展平网格**（`length = width × height`，行主序），故按「旧二维 `map` → 单张展平图层」处理，图层键默认 `0`（OI-4）、`layerAlias = {}`、`events = {}`。
- 旧 `num` 经「旧 `num` → `id` → 新 `num`」重映射（`0` 保持 `0`）；§8.2 的 `events` 与额外图层（U-16b）与 §8.1 楼层字段均**不移植**。
- 5 楼层：`empty`(13×13, 全 0) / `MT0`(13×13, 全 0) / `sample0`(13×13, 136 非零) / `sample1`(13×13, 98 非零) / `sample2`(26×26, 124 非零)；每层数组长度 = `width × height`。

## 消费接线（不在本增量）

沿用 **D-70 / D-83**：**不实现**把配置写入 store、把 list 写入 `TextureManager` 的消费接线；未改 `packages*/`、`src/`（除 `src/content/**`）、`public/project/**`。

## 门禁结果（全部实际运行，判定通过）

| 任务 | 门禁 | 结果 |
| --- | --- | --- |
| Task 0 | `PRESTATE`（预执行状态） | **PASS**（台账就位、unmapped/summary 未存在、参考文件齐、Node zlib 可用）；人工关卡由用户「可以执行」通过 |
| Task 1 | `LEDGER GATE` | **PASS**（4 帧 / 单元格 32×48 / 行数 8、10；SPLIT-COUNT 43 三处一致；enemy 21 / npc 7；npc0..6；D-84/D-85 同步） |
| Task 2 | `ENTITY GATE` + `PREFIX GATE` | **PASS**（tile 235 六键 / enemy 81 三键 / item 62 五键、id/num 唯一、type 合法、text 为字符串、头部 `// Type:` 保留） |
| Task 3 | `TEXTURE GATE` + `COPY GATE` + `DEP GATE` | **PASS**（43 拆分图尺寸按 D-84 逐图相符、npc=7、rowAnimate 每帧尺寸与帧数正确、覆盖全部有贴图 num；autotile/tileset 逐字节一致；脚本零依赖、`package.json` 未变） |
| Task 4 | `MAP GATE` + `SCOPE GATE` | **PASS**（5 楼层 5 键、图层长度符合、数值合法；.list 5 id；unmapped 仅 §8.1；无越界改动） |

**未使用全仓门禁**（无 `pnpm check:type` / `pnpm build`）。

## Files Created/Modified

- `.planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-AUDIT.md` — 48px 事实与拆分计数更正（D-84 / D-85），仅此一个既有规划文件被改
- `src/content/tile.jsonc` — 235 条图块（替换样例）
- `src/content/enemy.jsonc` — 81 条怪物（替换样例）
- `src/content/item.jsonc` — 62 条道具（替换样例）
- `src/content/maps/{empty,sample0,sample1,sample2}.jsonc` — 新增楼层
- `src/content/maps/MT0.jsonc` / `src/content/maps/.list.jsonc` — 替换（5 楼层）
- `src/content/texture/*.png` — 43 拆分图 + 4 autotile + 1 tileset（新增）
- `src/content/texture/.list.jsonc` — D-80 已批准 schema（48 条目）
- `script/migrateProjectTextures.ts` — 一次性零依赖 PNG 生成脚本（小驼峰）
- `.planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-UNMAPPED.md` — 仅 §8.1 无目标字段

## Task Commits

**本计划未创建任何提交**——按用户明确指令「不要运行 `git add` / `git commit`，把全部产出留在工作树，我会统一提交」。所有产出（含新文件与替换文件）均处于未暂存 / 未跟踪状态。用户并发改动 `AGENTS.md` / `09-CONTEXT.md` 未被触碰、未纳入。

## Decisions Made

- **`num` 策略 A 落地口径**（D-79）：段序 Terrain→Animate→Item→Enemy→Npc→Autotile，段内旧 `num` 升序，从 1 起连续。
- **素材精灵行序来源：** 采用 `public/project/icons.js` 的「每类 `id`→素材行索引」映射确定源 sprite 行（各类计数与 `materials/*.png` 尺寸逐一吻合：terrains 35 / animates 29 / items 62 / enemys 73 / enemy48 8 / npcs 14 / npc48 10），据此生成拆分图并写 `texture/.list.jsonc` 的 `map`（依源行序列出新 `num`）。
- **`grid` / `rowAnimate` 条目 `width`/`height` = 每帧尺寸**：48px 条目 = 32/48（4 帧），32px 条目 = 32/32（2 帧），`terrainsAnim*` = 32/32（4 帧）。
- **autotile / tileset 参数取候选默认（OI-6）**：`identifier` 取图块新 `num`（232/233/234/235），`autotileType` = `Big3x4`=1；tileset `{index:0, alias:'magictower'}`、`32/32`。

## Deviations from Plan

**None — plan executed exactly as written.** 说明：计划未在 `read_first` 中列出 `public/project/icons.js`，但它是确定源素材 sprite 行序的**唯一权威数据**（计数与各 `materials/*.png` 尺寸逐一吻合）；采用它而非任何臆造顺序，符合「不臆造映射关系」的 prohibition，属按计划精神的正确定性，非范围偏离。

## Known Stubs

None — 生成的数据 / 素材均为真实内容（PNG 已核验含非零像素；jsonc 为全量数据）。

## Threat Flags

None — 未引入新的网络端点、鉴权路径、文件访问面或 schema 信任边界。

## Issues Encountered

- **旧 `MT0` 楼层源码为全 0 地图**（`public/project/floors/MT0.js` 的 `map` 全为 0），故迁移后 `MT0.jsonc` 亦为全 0；与既有样例中的人工示意数据不同，但忠实于源数据。

## User Setup Required

None — 无外部服务配置。**产出尚未提交**，由用户统一提交。

## open_items（最终处置）

- **OI-1（unmapped 文档路径/命名）：** 采用提议路径 `.planning/phases/09-minimum-browser-runnable/09-DATA-MIGRATION-UNMAPPED.md`（连字符命名，Markdown 规范）。**待用户报备批准。**
- **OI-2（一次性脚本路径/命名）：** 采用 `script/migrateProjectTextures.ts`（小驼峰，符合 dev.md「代码文件名=小驼峰」）。**待用户报备批准。**
- **OI-3（48px 素材合并）：** **已由 D-85 裁定** = A · 按尺寸与帧数分组（`npc0..6`=7 / `SPLIT-COUNT`=43）；不再是开放项。
- **OI-4（地图图层键 / `layerAlias` 口径）：** 默认「旧二维 `map` → 单张展平图层（键 `0`），`layerAlias = {}`」。**待用户确认。**
- **OI-5（`texture/.list.jsonc` 的 `source` 路径形态）：** 默认用相对 `texture/` 的文件名（如 `terrains0.png`），与 `client.jsonc` 的 `textureDir: texture` 对齐。**待用户确认**是否需含目录前缀。
- **OI-6（autotile / tileset 参数）：** `autotile1.png` 的 `AutotileType`（U-7）、`magictower.png` 的 `cellWidth`/`cellHeight` 与 `identifier.index`（U-8）暂取候选默认。**待用户确认。**
- **OI-7（写操作方式声明）：** 本计划执行含文件写入（数据 / PNG / 脚本 / 台账更正 / 文档），由派发子代理（`gsd-executor`）执行，非内联执行（已在 Task 0 汇报）。

## Next Phase Readiness

- 六类基础数据与素材已在 `src/content` 就位，替换了原有样例；下一步的「消费接线」（写 store / 写 `TextureManager`）仍需用户单独提供（D-70 / D-83）。
- 待裁定项：OI-1 / OI-2 / OI-4 / OI-5 / OI-6 的最终口径。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-14*

## Self-Check: PASSED

- 14 个产出 / 更正文件全部存在（`tile/enemy/item.jsonc`、4 新增 + 1 替换 + `.list` 楼层、`texture/.list.jsonc`、`script/migrateProjectTextures.ts`、`09-DATA-MIGRATION-AUDIT.md`、`09-DATA-MIGRATION-UNMAPPED.md`、本 SUMMARY）。
- 48 张 PNG（43 拆分 + 4 autotile + 1 tileset）全部生成且 IHDR 合法（8 位 / 非隔行 / RGBA）。
- 各 jsonc 头部 `// Type:` 注释行与 `// --- SYSTEM PREFIX END --- //` 分隔标记保留；`split(marker)` 后可 `JSON.parse`；文件为 LF。
- 所有 `files_modified` 内条目完成；无 `files_modified` 外文件被改（`SCOPE GATE` 通过；用户并发改动 `AGENTS.md` / `09-CONTEXT.md` 未触碰）。
- 未创建任何提交（按用户指令）。
