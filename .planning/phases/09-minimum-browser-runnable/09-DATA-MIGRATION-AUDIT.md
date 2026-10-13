# Phase 9 · 任务 8：旧引擎数据迁移只读盘点台账（09-DATA-MIGRATION-AUDIT）

> 本文件是 Phase 9 任务 8 的**只读盘点产物**（`09-17-PLAN.md`，D-74）。**全程只读**：未修改 / 删除 / 新增任何生产 `.ts` / `.tsx` 源码，未改动任何 `public/project/**` 与 `src/content/**` 数据文件，未生成任何 `.png` 素材（D-75）。本文件唯一用途是为后续「旧引擎数据迁移」计划提供可消费的映射台账。所有 `file:line` 锚点取自执行日实测，指向真实存在且行号在范围内的行；无法确定者一律收入 §8，不猜测编造。文档使用裸 LF 行尾（随仓库既有 phase 文档约定）。

## 0. 盘点口径与范围

### 0.1 盘点范围（D-71）

本次只读盘点覆盖**六类**：

1. **图块定义 tile** —— `public/project/maps.js` 的 `blocksInfo`（运行时名，见 §0.3）。
2. **地图 maps** —— `public/project/floors/*.js`。
3. **贴图素材 textures** —— 显式含 `public/project/materials/*.png` **+** `public/project/autotiles/*.png` **+** `public/project/tilesets/*.png`（2026-10-13 用户裁定，D-71 补充）。
4. **怪物 enemy** —— `public/project/enemys.js`。
5. **道具 items** —— `public/project/items.js`。
6. **NPC** —— `maps.js` 的 `npcs` / `npc48` 图块。

**不在本次范围：** `animation` 素材（暂不处理，不盘点 / 不挪动 `public/project/animates/*.animate`）；`images` / `sounds` / `bgms` / `fonts`。

### 0.2 落点与接线边界（D-70）

迁移目标落点为 `src/content`（jsonc 数据 + 素材文件）。把配置写入 store、把贴图列表写入 `TextureManager` 的**消费接线由用户后续单独提供，本次不实现**。本盘点对应参考的落点侧文件：`src/content/tile.jsonc:1`、`src/content/enemy.jsonc:1`、`src/content/item.jsonc:1`、`src/content/maps/MT0.jsonc:1`、`src/content/texture/.list.jsonc:1`、`src/content/client.jsonc:9`（`textureListDir: texture/.list.jsonc`）、`src/content/defaults/tile.jsonc:1`、`src/content/defaults/enemy.jsonc:1`、`src/content/defaults/item.jsonc:1`、`src/content/defaults/map.jsonc:1`、`src/content/defaults/texture.jsonc:1`。

### 0.3 名词说明（`blocksInfo`）

`blocksInfo` 是**运行时名称**（`core.maps.blocksInfo`），**并非** `public/project/maps.js` 中的字面键名。该文件的字面形态为顶层 `var maps_<hash> = { "1": {…}, … }` 的图块定义对象（`public/project/maps.js:1` 为 `var maps_90f36752_8815_4be8_b32b_d7fad1d0542e =`，`:3` 为第一个图块条目 `"1": {"cls":"animates",…}`）。本文档凡称 `blocksInfo` 一律指代该顶层对象，**检索时请勿按字面串 `blocksInfo` 在文件中匹配**。同理，`enemys.js` 顶层为 `var enemys_<hash>`（`public/project/enemys.js:1`），`items.js` 顶层为 `var items_<hash>`（`public/project/items.js:1`），`floors/*.js` 顶层为 `main.floors.<id> = {…}`（`public/project/floors/MT0.js:1`）。

### 0.4 扫描方法论

- 用 `node` 在 `vm` 沙箱中只读求值 `public/project` 的 JS 数据文件，逐项实测枚举其键与字段，不臆造。
- **PNG 像素尺寸**用 `node` 读取 PNG `IHDR`（宽 = 偏移 16 起 4 字节大端，高 = 偏移 20 起 4 字节大端）获得，无需任何依赖。
- 映射目标接口以 `packages-user/data-common/src/store/types.ts` 与 `packages-user/client-base/src/material/types.ts` 的既有定义为锚点。
- 所有计数为执行日实测；行号以执行日实测为准。

### 0.5 D-72 五条拆分规则原文（含 tilesets / autotiles 例外）

> **D-72（合并 / 分图规则）：** ① `npc` 与 `npc48`、`enemy` 与 `enemy48` 均**合并**（不再有 48 变体）；② `terrains` / `items` / `enemy` / `npc` **分别存储**，不得混入同一张图片；③ `animates` **合并入 `terrains`**；④ **不同帧数**的素材不得放入同一张图片；⑤ 单帧素材按 **4×4** 规格拆分，多帧素材按「**帧数列 × 4 行**」拆分。

**例外（不套用 D-72⑤）：**

- `public/project/tilesets/*.png` → 走 `addTileset`（`source` / `identifier` / `cellWidth` / `cellHeight`，见 `packages-user/client-base/src/material/types.ts:302`），**不**做 4×4 / 帧数列×4 行拆分。
- `public/project/autotiles/*.png` → 走 `addAutotile`（`source` / `identifier` / `type: AutotileType`，见 `packages-user/client-base/src/material/types.ts:289`；`AutotileType` 定义于同文件 `:12`，含 2×3 `Small2x3` 与 3×4 `Big3x4`），**不**做 4×4 / 帧数列×4 行拆分。

#### 0.5.1 指令落地强化（D-72③：`animates` 并入 `terrains`）

> **固定表述：** **`animates` 并入 `terrains`，不设独立 `animates` 素材组。**

上句特指**素材 / 分图分组**层面的合并 —— `animates` 各图块的贴图与 `terrain` 归入**同一** `terrains` 素材组（受规则④约束：`animates` 为多帧，与单帧 `terrains` 分开成图，见 §2.4）。

**不得**与**逻辑类型映射**混淆：§1.1 中旧 `cls: animates` → `TileType.Animate` 的映射**保留不变**（`TileType` 枚举中 `Terrain` 与 `Animate` 并存，见 `packages-user/data-common/src/store/types.ts:6`）。即「逻辑类型仍区分 `Terrain` / `Animate`」与「素材 / 分图分组并入 `terrains`」是**两件独立的事**（消歧见 §1.1 与 OI-4）。

### 0.6 命名待报备说明（D-73）

本盘点中提出的任何新增 / 修改命名（拆分后贴图文件名、`addTileset` / `addAutotile` 的 `identifier` 与参数名、`texture/.list.jsonc` 字段名）**只作为「命名候选」写入台账并逐条标注「待用户报备批准」**，**不落地使用**、**不写入任何 `src/content/**` 文件**（AGENTS.md：公共 / 受保护 / 私有方法、字段命名须先报备获批）。

### 0.7 只读声明（D-74 / D-75）

本文件是本次任务**唯一产物之一**（另一为 `09-17-SUMMARY.md`）。全程未改动任何 `.ts` / `.tsx`、任何 `public/project/**` 与 `src/content/**` 数据文件、任何既有注释或任何既有规划文件；未生成任何 `.png`。根据 D-75，迁移阶段的 PNG 素材将由后续脚本生成，**本盘点阶段不生成任何素材**。

## 1. 图块定义 tile

数据来源：`public/project/maps.js:3` 起的顶层 `var maps_<hash> = { "num": {…} }` 对象（运行时名 `blocksInfo`）。实测共 **235** 个图块定义。

**`num` 可全部重新分配（指令 3）：** **图块 `num` 可全部重新分配，不沿用旧引擎顺序，唯一约束是 `id` ↔ `num` 一致**（即 `addTile` 的 `num` 与 `id` 均不冲突即可，见 `packages-user/data-common/src/store/types.ts:88`）。§1.3 的旧 `num` 列**仅作参考对照**；新 `num` 分配策略候选见 §1.5，均标注「待用户报备批准」。

### 1.1 `cls` → `TileType` 映射候选

目标枚举 `TileType`（`packages-user/data-common/src/store/types.ts:6`）：`Unknown` / `None` / `Terrain` / `Animate` / `Item` / `Enemy` / `Npc` / `Autotile` / `Tileset`。

| 旧 `cls` | 实测条数 | 目标 `TileType`（候选） | 依据 |
| --- | --- | --- | --- |
| `animates` | 29 | `Animate` | 动画类图块（`public/project/maps.js:3` 首项 `cls:"animates"`） |
| `terrains` | 35 | `Terrain` | 地形类图块 |
| `autotile` | 4 | `Autotile` | 自动元件（`public/project/maps.js:19` `"20": {"cls":"autotile","id":"autotile"}`） |
| `items` | 62 | `Item` | 道具类图块（`public/project/maps.js:227` `"331": {"cls":"items","id":"I331"}`） |
| `enemys` | 73 | `Enemy` | 怪物类图块（`public/project/maps.js:121` `"201": {"cls":"enemys","id":"greenSlime"}`） |
| `enemy48` | 8 | `Enemy`（合并，D-72①） | 高 48px 怪物图块（`public/project/maps.js:181` `"261": {"cls":"enemy48","id":"angel"}`） |
| `npcs` | 14 | `Npc` | NPC 图块（`public/project/maps.js:90` `"121": {"cls":"npcs","id":"man"}`） |
| `npc48` | 10 | `Npc`（合并，D-72①） | 高 48px NPC 图块（`public/project/maps.js:102` `"133": {"cls":"npc48","id":"npc0",…}`） |

合计 29 + 35 + 4 + 62 + 73 + 8 + 14 + 10 = **235**。`cls` 实测集合 = `animates, terrains, autotile, items, npcs, npc48, enemys, enemy48`（8 种）；无 `None` / `Tileset` 图块定义。

> **消歧（指令 1 / OI-4）：** 本表是**逻辑类型映射**（`cls` → `TileType`）—— `animates` → `TileType.Animate` 与 `terrains` → `TileType.Terrain` **各自保留**。这与 §0.5.1 / §2.4 的**素材 / 分图分组**合并（`animates` 并入 `terrains`，D-72③）**不是同一件事**：前者管「图块逻辑类型」，后者管「贴图分图归属」。

### 1.2 字段映射候选 → `ITileRawData`

目标接口 `ITileRawData`（`packages-user/data-common/src/store/types.ts:47`）：`num: number` / `id: string` / `events: Record<number, string>` / `type: TileType` / `pass: ITilePassData` / `eventPass: boolean`。通行性子对象 `ITilePassData`（同文件 `:38`）：`onlyEvents: boolean` / `outPass: number` / `inPass: number`。

旧图块字段实测频次：`cls`(235)、`id`(235)、`canBreak`(4)、`animate`(21)、`doorInfo`(17)、`name`(32)、`canPass`(19)、`trigger`(20)、`script`(5)、`faceIds`(4)、`autotileConnection`(2)、`cannotOut`(18)、`cannotIn`(18)。

**字段分类（指令 2，判定基准 = 目标接口是否存在对应字段）：**

- **映射候选（可确定）**：目标接口有对应字段，且映射关系可直接确定。
- **待定（有目标字段但映射不确定）**：目标接口有对应字段，但取值 / 展开关系无法由静态解析唯一确定（汇总见 §8.2）。
- **只记录、不移植（目标接口无对应字段）**：`ITileRawData` / `ITilePassData` 中**不存在**对应字段，旧字段只作盘点记录，不进入迁移（汇总见 §8.1）。

| 旧字段 | 实测条数 | 目标落点（候选） | 分类 | 说明 |
| --- | --- | --- | --- | --- |
| `id` | 235 | `ITileRawData.id` | 映射候选（可确定） | 直接对应图块字符串 id |
| `cls` | 235 | `ITileRawData.type` | 映射候选（可确定） | 经 §1.1 映射为 `TileType` |
| `trigger` | 20 | `ITileRawData.events`（事件 id）/ `eventPass` | 待定（有目标字段但映射不确定） | 旧触发名（`null` / `openDoor` / `ski` / `pushBox`）；**确有对应字段**，仅事件 id 与事件可通行性的具体对应未定（§8.2 U-2） |
| `canPass` | 19 | `ITilePassData`（`inPass` / `outPass` 位运算） | 待定（有目标字段但映射不确定） | 旧布尔「可通行」→ 新四方向通行位（`PassBit`，`packages-user/data-common/src/store/types.ts:27`）；**确有对应字段**，仅具体方向展开未定（§8.2 U-3） |
| `cannotOut` / `cannotIn` | 18 / 18 | `ITilePassData.outPass` / `inPass` | 映射候选（可确定） | 旧方向数组（`up` / `down` / `left` / `right`）→ 方向位掩码（可确定取反：`outPass = 全方向位 & ~cannotOut`） |
| `doorInfo` | 17 | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 含 `time` / `openSound` / `closeSound` / `keys`；`ITileRawData` / `ITilePassData` 无字段承载门机制参数（§8.1 U-4） |
| `animate` | 21 | 无（仅用于 §2 素材帧数推导） | 只记录、不移植（目标接口无对应字段） | 旧值多为 `1`；`ITileRawData` 无帧数字段，帧数由素材（`addRowAnimate`）承载（§8.1 U-4） |
| `canBreak` | 4 | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 出现在 `animates` 墙类（`yellowWall` 等，`public/project/maps.js:3`）；无字段承载「可破坏」语义（§8.1 U-4） |
| `script` | 5 | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 旧内联脚本（如 `lavaNet` / `light` / 血网等）；`events` 仅存事件 id，不承载脚本正文（§8.1 U-4） |
| `faceIds` | 4 | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 仅 `npc48` 的 `npc0..npc3`（`public/project/maps.js:102`）与敌人 `bear` 四面；无字段承载多面机制（§8.1 U-5） |
| `autotileConnection` | 2 | 无（目标接口无对应字段；对应 `IAutotileProcessor.setConnection`，非 `ITileRawData` 字段） | 只记录、不移植（目标接口无对应字段） | 仅 `autotile1` / `autotile3`（`public/project/maps.js:108`，值 `["yellowDoor"]`）（§8.1 U-5） |
| `name` | 32 | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 旧显示名（如 `血网` / `黄门` / `薄墙-上`）；`ITileRawData` 无对应字段（§8.1 U-5） |

### 1.3 `num` / `id` 全清单（235 条）

| num | id | cls | 关键字段 |
| --- | --- | --- | --- |
| 1 | yellowWall | animates | canBreak, animate, doorInfo |
| 2 | whiteWall | animates | canBreak, animate, doorInfo |
| 3 | blueWall | animates | canBreak, animate, doorInfo |
| 4 | star | animates | name |
| 5 | lava | animates | name |
| 6 | ice | animates | doorInfo, animate |
| 7 | blueShopLeft | terrains | - |
| 8 | blueShopRight | terrains | - |
| 9 | pinkShopLeft | terrains | - |
| 10 | pinkShopRight | terrains | - |
| 11 | lavaNet | animates | canPass, trigger, script, name |
| 12 | poisonNet | animates | canPass, trigger, script, name |
| 13 | weakNet | animates | canPass, trigger, script, name |
| 14 | curseNet | animates | canPass, trigger, script, name |
| 15 | blueLava | animates | - |
| 16 | water | animates | - |
| 20 | autotile | autotile | - |
| 21 | yellowKey | items | - |
| 22 | blueKey | items | - |
| 23 | redKey | items | - |
| 24 | greenKey | items | - |
| 25 | steelKey | items | - |
| 26 | bigKey | items | - |
| 27 | redGem | items | - |
| 28 | blueGem | items | - |
| 29 | greenGem | items | - |
| 30 | yellowGem | items | - |
| 31 | redPotion | items | - |
| 32 | bluePotion | items | - |
| 33 | greenPotion | items | - |
| 34 | yellowPotion | items | - |
| 35 | sword1 | items | - |
| 36 | shield1 | items | - |
| 37 | sword2 | items | - |
| 38 | shield2 | items | - |
| 39 | sword3 | items | - |
| 40 | shield3 | items | - |
| 41 | sword4 | items | - |
| 42 | shield4 | items | - |
| 43 | sword5 | items | - |
| 44 | shield5 | items | - |
| 45 | book | items | - |
| 46 | fly | items | - |
| 47 | pickaxe | items | - |
| 48 | icePickaxe | items | - |
| 49 | bomb | items | - |
| 50 | centerFly | items | - |
| 51 | upFly | items | - |
| 52 | downFly | items | - |
| 53 | coin | items | - |
| 54 | freezeBadge | items | - |
| 55 | cross | items | - |
| 56 | superPotion | items | - |
| 57 | earthquake | items | - |
| 58 | poisonWine | items | - |
| 59 | weakWine | items | - |
| 60 | curseWine | items | - |
| 61 | superWine | items | - |
| 62 | dagger | items | - |
| 63 | pack | items | - |
| 64 | amulet | items | - |
| 65 | hammer | items | - |
| 68 | lifeWand | items | - |
| 69 | jumpShoes | items | - |
| 70 | sword0 | items | - |
| 71 | shield0 | items | - |
| 72 | skill1 | items | - |
| 73 | wand | items | - |
| 81 | yellowDoor | animates | trigger, animate, doorInfo, name |
| 82 | blueDoor | animates | trigger, animate, doorInfo, name |
| 83 | redDoor | animates | trigger, animate, doorInfo, name |
| 84 | greenDoor | animates | trigger, animate, doorInfo, name |
| 85 | specialDoor | animates | trigger, animate, doorInfo, name |
| 86 | steelDoor | animates | trigger, animate, doorInfo, name |
| 87 | upFloor | terrains | canPass |
| 88 | downFloor | terrains | canPass |
| 89 | portal | animates | canPass |
| 90 | starPortal | animates | canPass |
| 91 | upPortal | animates | canPass |
| 92 | leftPortal | animates | canPass |
| 93 | downPortal | animates | canPass |
| 94 | rightPortal | animates | canPass |
| 101 | crystalUp | animates | - |
| 102 | crystalBottom | animates | - |
| 103 | fire | animates | - |
| 104 | switch | animates | - |
| 109 | magentaWall | animates | canBreak, animate, doorInfo |
| 121 | man | npcs | - |
| 122 | trader | npcs | - |
| 123 | thief | npcs | - |
| 124 | fairy | npcs | - |
| 125 | wizard | npcs | - |
| 126 | recluse | npcs | - |
| 127 | king | npcs | - |
| 128 | youngMan | npcs | - |
| 129 | sign | npcs | - |
| 130 | expShop | npcs | - |
| 131 | moneyShop | npcs | - |
| 132 | princess | npcs | - |
| 133 | npc0 | npc48 | faceIds, animate |
| 134 | npc1 | npc48 | faceIds, animate |
| 135 | npc2 | npc48 | faceIds, animate |
| 136 | npc3 | npc48 | faceIds, animate |
| 137 | greenMan | npcs | - |
| 138 | blueTrader | npcs | - |
| 151 | autotile1 | autotile | autotileConnection |
| 152 | autotile2 | autotile | - |
| 153 | autotile3 | autotile | autotileConnection |
| 161 | arrowUp | terrains | canPass, cannotOut, cannotIn |
| 162 | arrowDown | terrains | canPass, cannotOut, cannotIn |
| 163 | arrowLeft | terrains | canPass, cannotOut, cannotIn |
| 164 | arrowRight | terrains | canPass, cannotOut, cannotIn |
| 165 | light | terrains | trigger, canPass, script |
| 166 | darkLight | terrains | - |
| 167 | ski | terrains | trigger, canPass |
| 168 | flower | terrains | canPass |
| 169 | box | terrains | trigger |
| 170 | boxed | terrains | trigger |
| 201 | greenSlime | enemys | - |
| 202 | redSlime | enemys | - |
| 203 | blackSlime | enemys | - |
| 204 | slimelord | enemys | - |
| 205 | bat | enemys | - |
| 206 | bigBat | enemys | - |
| 207 | redBat | enemys | - |
| 208 | vampire | enemys | - |
| 209 | skeleton | enemys | - |
| 210 | skeletonWarrior | enemys | - |
| 211 | skeletonCaptain | enemys | - |
| 212 | ghostSoldier | enemys | - |
| 213 | zombie | enemys | - |
| 214 | zombieKnight | enemys | - |
| 215 | rock | enemys | - |
| 216 | slimeman | enemys | - |
| 217 | bluePriest | enemys | - |
| 218 | redPriest | enemys | - |
| 219 | brownWizard | enemys | - |
| 220 | redWizard | enemys | - |
| 221 | yellowGateKeeper | enemys | - |
| 222 | blueGateKeeper | enemys | - |
| 223 | redGateKeeper | enemys | - |
| 224 | swordsman | enemys | - |
| 225 | soldier | enemys | - |
| 226 | yellowKnight | enemys | - |
| 227 | redKnight | enemys | - |
| 228 | darkKnight | enemys | - |
| 229 | blackKing | enemys | - |
| 230 | yellowKing | enemys | - |
| 231 | greenKing | enemys | - |
| 232 | blueKnight | enemys | - |
| 233 | goldSlime | enemys | - |
| 234 | poisonSkeleton | enemys | - |
| 235 | poisonBat | enemys | - |
| 236 | ironRock | enemys | - |
| 237 | skeletonPriest | enemys | - |
| 238 | skeletonKing | enemys | - |
| 239 | skeletonPresbyter | enemys | - |
| 240 | skeletonKnight | enemys | - |
| 241 | evilHero | enemys | - |
| 242 | devilWarrior | enemys | - |
| 243 | demonPriest | enemys | - |
| 244 | goldHornSlime | enemys | - |
| 245 | redKing | enemys | - |
| 246 | blueKing | enemys | - |
| 247 | magicMaster | enemys | - |
| 248 | silverSlime | enemys | - |
| 249 | blademaster | enemys | - |
| 250 | whiteHornSlime | enemys | - |
| 251 | evilPrincess | enemys | - |
| 252 | evilFairy | enemys | - |
| 253 | yellowPriest | enemys | - |
| 254 | redSwordsman | enemys | - |
| 255 | whiteSlimeman | enemys | - |
| 256 | poisonZombie | enemys | - |
| 257 | dragon | enemys | - |
| 258 | octopus | enemys | - |
| 259 | fairyEnemy | enemys | - |
| 260 | princessEnemy | enemys | - |
| 261 | angel | enemy48 | - |
| 262 | elemental | enemy48 | - |
| 263 | steelGuard | enemy48 | - |
| 264 | evilBat | enemy48 | - |
| 265 | silverSlimelord | enemys | - |
| 266 | goldSlimelord | enemys | - |
| 267 | grayRock | enemys | - |
| 270 | greenKnight | enemys | - |
| 271 | bowman | enemys | - |
| 272 | purpleBowman | enemys | - |
| 275 | watcherSlime | enemys | - |
| 277 | frostBat | enemys | - |
| 278 | devilKnight | enemys | - |
| 279 | grayPriest | enemys | - |
| 280 | greenGateKeeper | enemys | - |
| 300 | ground | terrains | - |
| 301 | sWallT | terrains | name, cannotOut, cannotIn |
| 302 | sWallL | terrains | name, cannotOut, cannotIn |
| 303 | sWallR | terrains | name, cannotOut, cannotIn |
| 304 | sWallB | terrains | name, cannotOut, cannotIn |
| 305 | grass | terrains | - |
| 306 | sWallTL | terrains | name, cannotOut, cannotIn |
| 307 | sWallBR | terrains | name, cannotOut, cannotIn |
| 308 | grass2 | terrains | - |
| 309 | sWallTR | terrains | name, cannotOut, cannotIn |
| 310 | sWallBL | terrains | name, cannotOut, cannotIn |
| 311 | ground2 | terrains | - |
| 312 | sWallTB | terrains | name, cannotOut, cannotIn |
| 313 | ground3 | terrains | - |
| 314 | sWallLR | terrains | name, cannotOut, cannotIn |
| 315 | sWallBLR | terrains | name, cannotOut, cannotIn |
| 316 | sWallTLR | terrains | name, cannotOut, cannotIn |
| 317 | sWallTBR | terrains | name, cannotOut, cannotIn |
| 318 | sWallTBL | terrains | name, cannotOut, cannotIn |
| 319 | tallYellowDoor | npc48 | trigger, name, animate, doorInfo |
| 320 | tallBlueDoor | npc48 | trigger, name, animate, doorInfo |
| 321 | tallRedDoor | npc48 | trigger, name, animate, doorInfo |
| 322 | tallGreenDoor | npc48 | trigger, name, animate, doorInfo |
| 323 | tallSpecialDoor | npc48 | trigger, name, animate, doorInfo |
| 324 | tallSteelDoor | npc48 | trigger, name, animate, doorInfo |
| 325 | keiskeiFairy | enemys | - |
| 326 | tulipFairy | enemys | - |
| 327 | bearDown | enemy48 | - |
| 328 | bearLeft | enemy48 | - |
| 329 | bearRight | enemy48 | - |
| 330 | bearUp | enemy48 | - |
| 331 | I331 | items | - |
| 332 | I332 | items | - |
| 333 | I333 | items | - |
| 334 | I334 | items | - |
| 335 | I335 | items | - |
| 336 | I336 | items | - |
| 337 | I337 | items | - |
| 338 | I338 | items | - |
| 339 | I339 | items | - |
| 340 | I340 | items | - |
| 341 | I341 | items | - |

**TILE-COUNT: 235**

### 1.4 图块 → 贴图归属候选

按 D-72①③与 §2 的目标拆分，图块 id 归属候选如下（贴图文件名均为 §2.5 的命名候选，**待用户报备批准**）：

| `cls` | 图块 num 段 | 目标贴图归属候选 |
| --- | --- | --- |
| `terrains` | 7–10, 87–88, 161–170, 300–318 | `terrains` 组（单帧） |
| `animates` | 1–6, 11–16, 81–86, 89–94, 101–104, 109 | `terrains` 组（多帧）—— **`animates` 并入 `terrains`，不设独立 `animates` 素材组**（D-72③） |
| `items` | 21–73, 331–341 | `items` 组 |
| `enemys` + `enemy48` | 201–280, 325–330 | `enemy` 组（合并，D-72①） |
| `npcs` + `npc48` | 121–138, 133–136, 319–324 | `npc` 组（合并，D-72①） |
| `autotile` | 20, 151–153 | 对应 §2.2 的 autotile 素材（例外，非材料拆分） |

> **固定表述（指令 1）：** **`animates` 并入 `terrains`，不设独立 `animates` 素材组**（D-72③，与 §0.5.1 一致）。此为**贴图归属 / 素材分组**层面的合并（受规则④：多帧 `animates` 与单帧 `terrains` 分开成图）；**不影响** §1.1 的**逻辑类型映射**（`animates` → `TileType.Animate` 仍保留）。

### 1.5 id 全清单与新 num 分配策略候选

本节汇总 **id 全清单**（235 条，复用 §1.3 的 `id` 列，按 `cls` 分组，**完整覆盖、不遗漏**）与 **num 分配策略候选**（≥3 个，均标注「待用户报备批准」）。**本盘点只记录候选，不落地任何 `num` 分配**（D-73 / OI-1）。

#### 1.5.1 id 全清单（235 条，按 `cls` 分组）

| `cls` | 条数 | 图块 id 全清单 |
| --- | --- | --- |
| `animates` | 29 | yellowWall, whiteWall, blueWall, star, lava, ice, lavaNet, poisonNet, weakNet, curseNet, blueLava, water, yellowDoor, blueDoor, redDoor, greenDoor, specialDoor, steelDoor, portal, starPortal, upPortal, leftPortal, downPortal, rightPortal, crystalUp, crystalBottom, fire, switch, magentaWall |
| `terrains` | 35 | blueShopLeft, blueShopRight, pinkShopLeft, pinkShopRight, upFloor, downFloor, arrowUp, arrowDown, arrowLeft, arrowRight, light, darkLight, ski, flower, box, boxed, ground, sWallT, sWallL, sWallR, sWallB, grass, sWallTL, sWallBR, grass2, sWallTR, sWallBL, ground2, sWallTB, ground3, sWallLR, sWallBLR, sWallTLR, sWallTBR, sWallTBL |
| `autotile` | 4 | autotile, autotile1, autotile2, autotile3 |
| `items` | 62 | yellowKey, blueKey, redKey, greenKey, steelKey, bigKey, redGem, blueGem, greenGem, yellowGem, redPotion, bluePotion, greenPotion, yellowPotion, sword1, shield1, sword2, shield2, sword3, shield3, sword4, shield4, sword5, shield5, book, fly, pickaxe, icePickaxe, bomb, centerFly, upFly, downFly, coin, freezeBadge, cross, superPotion, earthquake, poisonWine, weakWine, curseWine, superWine, dagger, pack, amulet, hammer, lifeWand, jumpShoes, sword0, shield0, skill1, wand, I331, I332, I333, I334, I335, I336, I337, I338, I339, I340, I341 |
| `enemys` | 73 | greenSlime, redSlime, blackSlime, slimelord, bat, bigBat, redBat, vampire, skeleton, skeletonWarrior, skeletonCaptain, ghostSoldier, zombie, zombieKnight, rock, slimeman, bluePriest, redPriest, brownWizard, redWizard, yellowGateKeeper, blueGateKeeper, redGateKeeper, swordsman, soldier, yellowKnight, redKnight, darkKnight, blackKing, yellowKing, greenKing, blueKnight, goldSlime, poisonSkeleton, poisonBat, ironRock, skeletonPriest, skeletonKing, skeletonPresbyter, skeletonKnight, evilHero, devilWarrior, demonPriest, goldHornSlime, redKing, blueKing, magicMaster, silverSlime, blademaster, whiteHornSlime, evilPrincess, evilFairy, yellowPriest, redSwordsman, whiteSlimeman, poisonZombie, dragon, octopus, fairyEnemy, princessEnemy, silverSlimelord, goldSlimelord, grayRock, greenKnight, bowman, purpleBowman, watcherSlime, frostBat, devilKnight, grayPriest, greenGateKeeper, keiskeiFairy, tulipFairy |
| `enemy48` | 8 | angel, elemental, steelGuard, evilBat, bearDown, bearLeft, bearRight, bearUp |
| `npcs` | 14 | man, trader, thief, fairy, wizard, recluse, king, youngMan, sign, expShop, moneyShop, princess, greenMan, blueTrader |
| `npc48` | 10 | npc0, npc1, npc2, npc3, tallYellowDoor, tallBlueDoor, tallRedDoor, tallGreenDoor, tallSpecialDoor, tallSteelDoor |
| **合计** | **235** | —— |

> 分组条数校验：29 + 35 + 4 + 62 + 73 + 8 + 14 + 10 = **235**（与 §1.1 / §1.3 一致）。以上 id 与 §1.3 的 `id` 列**逐条一致**（§1.3 含旧 `num`，本节只列 `id`，便于重排 `num` 时按 `id` 唯一对应）。

#### 1.5.2 新 num 分配策略候选（均「待用户报备批准」）

以下策略**只作候选记录**，用于后续「迁移计划」确定 `num` 分配口径；**本盘点不选型、不落地**（OI-1）。

| 策略（候选） | 策略要点 | 优点 | 缺点 | 与旧 `num` 的对照 |
| --- | --- | --- | --- | --- |
| **A. 按 `TileType` 分段** | 按逻辑类型分成连续段：`Terrain` / `Animate` / `Item` / `Enemy` / `Npc` / `Autotile` / `Tileset` 各占一段，段内按 `id` 或旧 `num` 排序 | 段位语义清晰，便于按类型批量分配 / 查错 | 需整体重排，旧 `num` 全部失效；跨类共享 `id` 的图（如 door 类）归属需先定 | 完全打乱旧 `num`，仅以 `id` 对应 |
| **B. 沿用旧 `num`** | 保持 §1.3 的 `num` 不变，仅校验 `id` ↔ `num` 唯一一致 | 迁移最省，对照成本最低，旧资料回查方便 | 未利用「可全部重排」的灵活性；`enemy48`/`npc48` 合并后旧 `num` 段可能零散、留空洞 | 与旧 `num` 完全一致 |
| **C. 按目标贴图（拆分后图）分组顺序重排** | 以 §2.4 / §2.5 的目标图（A..E 组及拆分序）顺序为纲，同图内图块 `num` 连续分配 | 与素材拆分结果对齐，`num` 局部性贴近贴图，利于按图缓存 / 定位 | 依赖 §2.4 拆分方案最终定稿；拆分调整会牵动 `num` | 与旧 `num` 无关，按目标图顺序重排 |
| **D. 按 `id` 次序分配** | 对 §1.5.1 的 id 全清单按 `id` 字典序（或分组后组内字典序）依次赋 `num` | 规则最简单、可完全脚本化、无歧义 | `num` 与语义 / 贴图均无关，调试可读性最差 | 与旧 `num` 无关，按 `id` 次序重排 |

> 以上任一策略均满足唯一硬约束：**`id` ↔ `num` 一致**（`addTile` 的 `num` 与 `id` 均不冲突，见 `packages-user/data-common/src/store/types.ts:88`）。候选取用哪一种**待用户报备批准 / 裁定**（OI-1）。

## 2. 贴图素材 textures

本维度显式含三类素材：`materials/*.png`、`autotiles/*.png`（例外）、`tilesets/*.png`（例外）。

### 2.1 `materials/*.png` 登记

像素尺寸由 `node` 读取 PNG `IHDR` 实测（锚点指向对应 PNG 文件，`:1` 表示该文件）。

| 素材 | 像素尺寸 | 承载图块类（候选） |
| --- | --- | --- |
| `public/project/materials/terrains.png:1` | 32×1120 | `terrains`（35 单帧图块，1 列 × 35 行） |
| `public/project/materials/items.png:1` | 32×1984 | `items`（62 单帧图块，1 列 × 62 行） |
| `public/project/materials/enemys.png:1` | 64×2336 | `enemys`（73 怪物，2 列 × 73 行，每怪 2 帧） |
| `public/project/materials/enemy48.png:1` | 128×384 | `enemy48`（8 怪物，2 列 × 8 行，每怪 2 帧） |
| `public/project/materials/npcs.png:1` | 64×448 | `npcs`（14 NPC，2 列 × 14 行，每 NPC 2 帧） |
| `public/project/materials/npc48.png:1` | 128×480 | `npc48`（10 NPC，2 列 × 10 行，每 NPC 2 帧） |
| `public/project/materials/animates.png:1` | 128×928 | `animates`（29 动画图块，4 帧列 × 29 行）—— **素材分组并入 `terrains`，不设独立 `animates` 素材组**（D-72③，见 §0.5.1） |
| `public/project/materials/ground.png:1` | 32×32 | 单帧素材（归类**待确认**，§8） |
| `public/project/materials/airwall.png:1` | 32×32 | 单帧素材（归类**待确认**，§8） |
| `public/project/materials/keyboard.png:1` | 416×416 | 13×13 单帧网格（用途归类**待确认**，§8） |
| `public/project/materials/icons.png:1` | 32×1120 | 1 列 × 35 行（用途归类**待确认**，§8） |
| `public/project/materials/icons_old.png:1` | 32×1120 | 1 列 × 35 行（用途归类**待确认**，§8） |

**MATERIAL-COUNT: 17**（= 12 materials + 4 autotiles + 1 tileset）

### 2.2 `autotiles/*.png` 登记（例外，不套用 D-72⑤）

走 `addAutotile(source, identifier, type)`（`packages-user/client-base/src/material/types.ts:289`）；`type` 取 `AutotileType`（同文件 `:12`）：2×3 = `Small2x3`、3×4 = `Big3x4`。

| 素材 | 像素尺寸 | `type` 候选 | `identifier` 候选 | 判定依据 |
| --- | --- | --- | --- | --- |
| `public/project/autotiles/autotile.png:1` | 96×128 | `Big3x4` | 20 | 96/32 = 3 列、128/32 = 4 行 → 3×4 |
| `public/project/autotiles/autotile2.png:1` | 96×128 | `Big3x4` | 152 | 同上 |
| `public/project/autotiles/autotile3.png:1` | 96×128 | `Big3x4` | 153 | 同上 |
| `public/project/autotiles/autotile1.png:1` | 384×128 | **待确认**（§8） | 151 | 384/32 = 12；无法由尺寸唯一判定 2×3 / 3×4 |

`identifier` 候选值取自 §1 中 `autotile` 类图块的 num（20 / 151 / 152 / 153，见 `public/project/maps.js:19`、`public/project/maps.js:108`）。**明确：`autotiles/*.png` 不套用 D-72⑤ 的 4×4 / 帧数列×4 行拆分。**

### 2.3 `tilesets/*.png` 登记（例外，不套用 D-72⑤）

走 `addTileset(source, identifier, cellWidth, cellHeight)`（`packages-user/client-base/src/material/types.ts:302`）；`identifier` 为 `IIndexedIdentifier`（`{ index: number; alias: string }`，同文件 `:50`）。

| 素材 | 像素尺寸 | `cellWidth` / `cellHeight` 候选 | `identifier` 候选 | 判定依据 |
| --- | --- | --- | --- | --- |
| `public/project/tilesets/magictower.png:1` | 256×1216 | 32 / 32（**待确认**，§8） | `{ index: ?, alias: "magictower" }` | 256/32 = 8 列、1216/32 = 38 行；切格尺寸为**待确认**（§8） |

**明确：`tilesets/*.png` 不套用 D-72⑤ 的 4×4 / 帧数列×4 行拆分。**

### 2.4 D-72 目标拆分方案（materials）

按 D-72 五规则逐组推导（本盘点读法：**单帧目标图 = 4×4 网格，即每图 16 个单帧图块，对应 `addGrid`；多帧目标图 = 「帧数列 × 4 行」，即每图 4 个多帧图块，对应 `addRowAnimate`**。该读法如与用户原意不符，请以用户裁定为准，§8 已记录）。

| 组 | 来源 PNG | 类别 | 帧数 | 图块数 | 目标图（候选）+ 行列布局 | 目标图数 |
| --- | --- | --- | --- | --- | --- | --- |
| A | `terrains.png` | `terrains` 单帧 | 1 | 35 | `4×4`（16 格/图，`addGrid`） | 3 |
| B | `animates.png` | 并入 `terrains`（D-72③）多帧 | 4 | 29 | `帧数列(4) × 4 行`（4 块/图，`addRowAnimate`） | 8 |
| C | `items.png` | `items` 单帧 | 1 | 62 | `4×4`（16 格/图，`addGrid`） | 4 |
| D | `enemys.png` + `enemy48.png` | `enemy` 合并（D-72①）多帧 | 2 | 81 | `帧数列(2) × 4 行`（4 块/图，`addRowAnimate`） | 21 |
| E | `npcs.png` + `npc48.png` | `npc` 合并（D-72①）多帧 | 2 | 24 | `帧数列(2) × 4 行`（4 块/图，`addRowAnimate`） | 6 |

- 落实规则②：`terrains` / `items` / `enemy` / `npc` 各自成图，不混入同一张。
- 落实规则③：**`animates` 并入 `terrains`，不设独立 `animates` 素材组**（因帧数不同，按规则④与 A 组分开成图，D-72③）。
- 落实规则④：单帧（A/C）与多帧（B/D/E）分图；B 为 4 帧、D/E 为 2 帧，亦分图。
- 落实规则⑤：A/C 为单帧 → 4×4；B/D/E 为多帧 → 帧数列 × 4 行。
- `materials` 中 `ground` / `airwall` / `keyboard` / `icons` / `icons_old` 的 D-72 归类**待确认**（§8），未计入本表。
- 每图「帧数 × 4 行」按 `addRowAnimate`「每一行的帧数一致」的能力（`packages-user/client-base/src/material/types.ts:275`）设计。

**SPLIT-COUNT: 42**（= A 3 + B 8 + C 4 + D 21 + E 6；即按 D-72 五规则推导的 materials 目标图数量，仅计 `terrains` / `items` / `enemy` / `npc` 四类）

### 2.5 命名候选（待报备）

下表所有命名**均为候选、标注「待用户报备批准」，本计划不落地使用**（D-73 / OI-3）。

| 候选类别 | 命名候选 | 说明 | 状态 |
| --- | --- | --- | --- |
| materials 拆分图（`terrains` 单帧） | `terrains0.png` / `terrains1.png` / `terrains2.png` | A 组 3 图 | 待用户报备批准 |
| materials 拆分图（`animates` 并入 `terrains`） | `terrainsAnim0.png` … `terrainsAnim7.png` | B 组 8 图；**不设独立 `animates` 素材组**（D-72③） | 待用户报备批准 |
| materials 拆分图（`items`） | `items0.png` … `items3.png` | C 组 4 图 | 待用户报备批准 |
| materials 拆分图（`enemy`） | `enemy0.png` … `enemy20.png` | D 组 21 图 | 待用户报备批准 |
| materials 拆分图（`npc`） | `npc0.png` … `npc5.png` | E 组 6 图 | 待用户报备批准 |
| autotile `identifier` 参数 | `20` / `151` / `152` / `153` | 对应 §2.2，取自 §1 图块 num | 待用户报备批准 |
| autotile `type` 参数 | `AutoTileType.Big3x4` | `autotile.png` / `autotile2.png` / `autotile3.png` | 待用户报备批准 |
| tileset `identifier.alias` | `magictower` | 对应 §2.3 | 待用户报备批准 |
| tileset `cellWidth` / `cellHeight` | `32` / `32` | 待确认（§8） | 待用户报备批准 |
| `.list.jsonc` 承载字段名 | `grid` / `rowAnimate` / `autotile` / `tileset` | 见 §7 草案 | 待用户报备批准 |

## 3. 怪物 enemy

数据来源：`public/project/enemys.js:3` 起的顶层 `var enemys_<hash> = { "<id>": {…} }` 对象，实测 **81** 条，与 §1 的 `enemys`(73) + `enemy48`(8) = 81 图块一一对应（均由 id 关联）。

目标接口 `IEnemyRawData`（`packages-user/data-common/src/store/types.ts:319`）：`num: number` / `attribute: Readonly<T>` / `special: Record<number, any>`。落点默认骨架见 `src/content/defaults/enemy.jsonc:1`（`attribute` 含 `name` / `hp` / `atk` / `def` / `money` / `exp` / `point`）。

### 3.1 字段映射候选

旧字段实测频次：`name`(81)、`hp`(81)、`atk`(81)、`def`(81)、`money`(81)、`exp`(81)、`point`(81)、`special`(81)、`value`(6)、`n`(1)、`range`(1)、`zoneSquare`(1)、`bigImage`(3)、`atkValue`(1)、`defValue`(1)、`add`(1)、`notBomb`(2)、`faceIds`(4)。

分类口径同 §1.2（映射候选（可确定） / 待定（有目标字段但映射不确定） / 只记录、不移植（目标接口无对应字段））；判定基准 = `IEnemyRawData`（`packages-user/data-common/src/store/types.ts:319`）。

| 旧字段 | 目标落点（候选） | 分类 | 说明 |
| --- | --- | --- | --- |
| `num`（由 §1 图块数字得来） | `IEnemyRawData.num` | 映射候选（可确定） | 由 `maps.js` 中 `enemys` / `enemy48` 图块 num 关联（如 `greenSlime` ↔ 201，`public/project/maps.js:121`） |
| `name` / `hp` / `atk` / `def` / `money` / `exp` / `point` | `IEnemyRawData.attribute.{…}` | 映射候选（可确定） | 与 `src/content/defaults/enemy.jsonc:1` 的 `attribute` 骨架字段一一对应 |
| `special`（数字数组，如 `[16,18]`） | `IEnemyRawData.special: Record<number, any>` | 映射候选（可确定） | 旧为「特殊属性数字」数组 → 新为「数字键 → 值」映射；键即数组中的数字 |
| `value` / `range` / `zoneSquare` / `add` / `n` | `IEnemyRawData.special[<键>]`（候选） | 待定（有目标字段但映射不确定） | 旧伴随 `special` 的修饰量；**有目标字段**（`special`），其与具体特殊属性数字键的绑定关系未定（§8.2 U-10） |
| `bigImage` | `IEnemyRawData.special[<键>]`（候选） | 待定（有目标字段但映射不确定） | 仅 3 条含（`octopus` / `dragon` / `bearDown`，值为 `null`）；**有目标字段**（`special`），键位未定（§8.2 U-10） |
| `notBomb` | `IEnemyRawData.special[<键>]`（候选） | 待定（有目标字段但映射不确定） | 2 条（`magicMaster` / `blackKing`）；**有目标字段**（`special`），键位未定（§8.2 U-10） |
| `atkValue` / `defValue` | `attribute` 派生（候选） | 待定（有目标字段但映射不确定） | 1 条（`slimeman`）；**有目标字段**（`attribute` / `special`），派生方式未定（§8.2 U-10） |
| `faceIds` | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 4 条（`bearDown` / `bearLeft` / `bearRight` / `bearUp`）；无字段承载多面机制（`enemy48` 变体合并入 `enemy`，D-72①）（§8.1 U-10b） |

### 3.2 `id` / `num` / `attribute` / `special` 全清单（81 条）

| num | id | name | 附加字段 | special |
| --- | --- | --- | --- | --- |
| 201 | greenSlime | 绿头怪 | - | special=[] |
| 202 | redSlime | 红头怪 | value | special=[16,18] |
| 203 | blackSlime | 青头怪 | - | special=[] |
| 204 | slimelord | 怪王 | - | special=[1,9] |
| 205 | bat | 小蝙蝠 | - | special=[1,27] |
| 206 | bigBat | 大蝙蝠 | - | special=[] |
| 207 | redBat | 红蝙蝠 | - | special=[] |
| 208 | vampire | 冥灵魔王 | n | special=[6] |
| 209 | skeleton | 骷髅人 | - | special=[] |
| 210 | skeletonWarrior | 骷髅士兵 | - | special=[] |
| 211 | skeletonCaptain | 骷髅队长 | - | special=[] |
| 212 | ghostSoldier | 冥队长 | - | special=[8] |
| 213 | zombie | 兽人 | - | special=[] |
| 214 | zombieKnight | 兽人武士 | - | special=[] |
| 215 | rock | 石头人 | - | special=[3] |
| 216 | slimeman | 影子战士 | atkValue, defValue | special=[9] |
| 217 | bluePriest | 初级法师 | - | special=[9] |
| 218 | redPriest | 高级法师 | - | special=[] |
| 219 | brownWizard | 初级巫师 | value, range | special=[15] |
| 220 | redWizard | 高级巫师 | value, zoneSquare | special=[15] |
| 221 | yellowGateKeeper | 初级卫兵 | - | special=[] |
| 222 | blueGateKeeper | 中级卫兵 | - | special=[] |
| 223 | redGateKeeper | 高级卫兵 | - | special=[] |
| 224 | swordsman | 双手剑士 | - | special=[4] |
| 225 | soldier | 冥战士 | - | special=[] |
| 226 | yellowKnight | 金骑士 | - | special=[] |
| 227 | redKnight | 红骑士 | - | special=[7] |
| 228 | darkKnight | 黑骑士 | - | special=[] |
| 229 | blackKing | 黑衣魔王 | notBomb | special=[] |
| 230 | yellowKing | 黄衣魔王 | - | special=[] |
| 231 | greenKing | 青衣武士 | - | special=[] |
| 232 | blueKnight | 蓝骑士 | - | special=[8] |
| 233 | goldSlime | 黄头怪 | - | special=[] |
| 234 | poisonSkeleton | 紫骷髅 | - | special=[13] |
| 235 | poisonBat | 紫蝙蝠 | - | special=[13] |
| 236 | ironRock | 铁面人 | - | special=[] |
| 237 | skeletonPriest | 骷髅法师 | value | special=[18] |
| 238 | skeletonKing | 骷髅王 | - | special=[] |
| 239 | skeletonPresbyter | 骷髅巫师 | - | special=[] |
| 240 | skeletonKnight | 骷髅武士 | - | special=[] |
| 241 | evilHero | 迷失勇者 | - | special=[] |
| 242 | devilWarrior | 魔神武士 | - | special=[] |
| 243 | demonPriest | 魔神法师 | - | special=[] |
| 244 | goldHornSlime | 金角怪 | - | special=[] |
| 245 | redKing | 红衣魔王 | - | special=[] |
| 246 | blueKing | 白衣武士 | - | special=[16] |
| 247 | magicMaster | 黑暗大法师 | value, add, notBomb | special=[11] |
| 248 | silverSlime | 银头怪 | - | special=[14] |
| 249 | blademaster | 剑圣 | - | special=[] |
| 250 | whiteHornSlime | 尖角怪 | - | special=[] |
| 251 | evilPrincess | 痛苦魔女 | - | special=[10] |
| 252 | evilFairy | 黑暗仙子 | - | special=[] |
| 253 | yellowPriest | 中级法师 | - | special=[] |
| 254 | redSwordsman | 剑王 | - | special=[] |
| 255 | whiteSlimeman | 水银战士 | - | special=[] |
| 256 | poisonZombie | 绿兽人 | - | special=[12] |
| 257 | dragon | 魔龙 | bigImage | special=[] |
| 258 | octopus | 血影 | bigImage | special=[] |
| 259 | fairyEnemy | 仙子 | - | special=[] |
| 260 | princessEnemy | 假公主 | - | special=[] |
| 261 | angel | 天使 | - | special=[] |
| 262 | elemental | 元素生物 | - | special=[] |
| 263 | steelGuard | 铁守卫 | value | special=[18] |
| 264 | evilBat | 邪恶蝙蝠 | - | special=[] |
| 265 | silverSlimelord | 银怪王 | - | special=[] |
| 266 | goldSlimelord | 金怪王 | - | special=[] |
| 267 | grayRock | 灰色石头人 | - | special=[] |
| 270 | greenKnight | 强盾骑士 | - | special=[] |
| 271 | bowman | 初级弓兵 | - | special=[] |
| 272 | purpleBowman | 高级弓兵 | - | special=[] |
| 275 | watcherSlime | 邪眼怪 | - | special=[] |
| 277 | frostBat | 寒蝙蝠 | - | special=[] |
| 278 | devilKnight | 恶灵骑士 | - | special=[1,5,7,8] |
| 279 | grayPriest | 混沌法师 | - | special=[] |
| 280 | greenGateKeeper | 卫兵队长 | - | special=[] |
| 325 | keiskeiFairy | 铃兰花妖 | - | special=[] |
| 326 | tulipFairy | 郁金香花妖 | - | special=[] |
| 327 | bearDown | 熊出没 | faceIds, bigImage | special=[] |
| 328 | bearLeft | 熊出没 | faceIds | special=[] |
| 329 | bearRight | 熊出没 | faceIds | special=[] |
| 330 | bearUp | 熊出没 | faceIds | special=[] |

**ENEMY-COUNT: 81**

## 4. 道具 items

数据来源：`public/project/items.js:3` 起的顶层 `var items_<hash> = { "<id>": {…} }` 对象，实测 **62** 条。目标接口 `IItemRawData`（`packages-user/data-common/src/store/types.ts:176`）：`num` / `category: ItemCategory` / `name` / `text` / `hideInToolbox` / `effect: IItemEffect` / `equip: IItemEquipData`。

### 4.1 `cls` → `ItemCategory` 映射候选

目标枚举 `ItemCategory`（`packages-user/data-common/src/store/types.ts:125`）：`Unknown` / `Constant`（永久道具）/ `Consumable`（一次性道具）/ `Pick`（即捡即用）/ `Equipment`（装备）。

| 旧 `cls` | 实测条数 | `ItemCategory`（候选） | 依据 |
| --- | --- | --- | --- |
| `tools` | 20 | `Consumable`（候选） | 多为可多次使用的钥匙 / 器械；`canUseItemEffect` 普遍存在 |
| `items` | 32 | `Consumable`（候选） | 含宝石 / 血瓶 / 剑盾（带 `equip`）；部分语义接近即拾即用（`yellowGem` 带 `useItemEvent`），细分**待确认**（§8） |
| `equips` | 2 | `Equipment` | 仅 `sword0` / `shield0`（`public/project/items.js:132`），带 `equip` |
| `constants` | 8 | `Constant` | 永久道具（`book` / `fly` / `coin` 等，`public/project/items.js:304`） |

说明：`cls` 为 `items` 的剑盾（`sword1..5` / `shield1..5`）也带 `equip`，其 `category` 究竟应取 `Consumable` 还是 `Equipment`**待确认**（§8）。

### 4.2 效果脚本与装备映射候选

旧字段实测频次：`cls`(62)、`name`(62)、`text`(49)、`hideInToolbox`(5)、`itemEffect`(23)、`itemEffectTip`(23)、`useItemEffect`(25)、`canUseItemEffect`(38)、`useItemEvent`(2)、`equip`(12)、`hideInReplay`(2)。

分类口径同 §1.2；判定基准 = `IItemRawData` / `IItemEffect` / `IItemEquipData`（`packages-user/data-common/src/store/types.ts:176` / `:138` / `:161`）。

| 旧字段 | 目标落点（候选） | 分类 | 说明 |
| --- | --- | --- | --- |
| `name` / `text` / `hideInToolbox` | `IItemRawData.{name,text,hideInToolbox}` | 映射候选（可确定） | 直接对应 |
| `itemEffect` | `IItemEffect.effect` 派生（候选） | 待定（有目标字段但映射不确定） | 旧为字符串 / 函数（如 `红宝石` 的 `itemEffect`）；**有目标字段**（`IItemEffect`），派生方式未定（§8.2 U-12） |
| `itemEffectTip` | `IItemEffect.effect` 派生（候选） | 待定（有目标字段但映射不确定） | 效果提示串（含 `${…}` 模板）；**有目标字段**（`IItemEffect`），派生方式未定（§8.2 U-12） |
| `useItemEffect` | `IItemEffect.useEffect?`（候选） | 待定（有目标字段但映射不确定） | 旧为字符串脚本（部分为函数体，如 `freezeBadge` 852 字符）；**有目标字段**（`IItemEffect.useEffect`），映为 `useEffect(item, state)` 方法的改写方式未定（§8.2 U-12） |
| `useItemEvent` | `IItemEffect.useEvent?`（候选） | 待定（有目标字段但映射不确定） | 旧为事件数组（`yellowGem` / `lifeWand`）；新 `useEvent?: string` 承载事件 id，事件库由落点侧提供（`src/content/item.ts:7` 的 `item200` 为示例）（§8.2 U-12） |
| `canUseItemEffect` | `IItemEffect.canUse?`（候选） | 待定（有目标字段但映射不确定） | 旧为布尔或函数串；新为 `canUse(item, state): boolean`（§8.2 U-12） |
| `equip` | `IItemEquipData`（`packages-user/data-common/src/store/types.ts:161`） | 映射候选（可确定） | 字段级有对应目标接口；旧 `equip` = `{ type: number; animate?: string; value: Record<string, number> }` → 新 `{ slots: (number\|string)[]; animate: AnimationIds; value; percentage; loadEvent; unloadEvent }`（子字段映射见 §4.3 / §8.2 U-14） |
| `hideInReplay` | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 2 条（`fly` / `skill1`）；`IItemRawData` 无对应字段（§8.1 U-13） |

### 4.3 `equip` → `IItemEquipData` 映射候选

旧 `equip` 实测 12 条，形态为 `{ type: number; animate?: string; value: Record<string, number> }`。

| 旧 `equip` 字段 | 目标落点（候选） | 说明 |
| --- | --- | --- |
| `type`（0 / 1） | `IItemEquipData.slots: (number\|string)[]` | 旧为单个装备孔索引（0 = 武器，1 = 盾）；新为数组，是否包成 `[type]` **待确认**（§8） |
| `animate`（如 `"sword"`） | `IItemEquipData.animate: AnimationIds` | 仅剑类含（`sword0..5`）；旧动画 id 字符串 → 新 `AnimationIds` 的取值**待确认**（§8） |
| `value`（`{ atk: 10 }` / `{ def: 10 }`） | `IItemEquipData.value: Record<SelectKey<THero, number>, number>` | 旧属性名（`atk` / `def` / `mdef`）→ 新属性键的对应**待确认**（§8） |
| —（旧无） | `IItemEquipData.percentage` / `loadEvent` / `unloadEvent` | 旧数据无对应；`defaults/item.jsonc:1` 给出空骨架 |

### 4.4 `id` / `num` / `cls` 全清单（62 条）

| num | id | cls | 关键字段 |
| --- | --- | --- | --- |
| 21 | yellowKey | tools | hideInToolbox |
| 22 | blueKey | tools | hideInToolbox |
| 23 | redKey | tools | hideInToolbox |
| 24 | greenKey | tools | - |
| 25 | steelKey | tools | - |
| 26 | bigKey | tools | itemEffect, itemEffectTip, useItemEffect, canUseItemEffect |
| 27 | redGem | items | itemEffect, itemEffectTip, useItemEffect, canUseItemEffect |
| 28 | blueGem | items | itemEffect, itemEffectTip, useItemEffect, canUseItemEffect |
| 29 | greenGem | items | itemEffect, itemEffectTip, useItemEffect, canUseItemEffect |
| 30 | yellowGem | items | itemEffect, itemEffectTip, useItemEvent, canUseItemEffect |
| 31 | redPotion | items | itemEffect, itemEffectTip, useItemEffect, canUseItemEffect |
| 32 | bluePotion | items | itemEffect, itemEffectTip, useItemEffect, canUseItemEffect |
| 33 | greenPotion | items | itemEffect, itemEffectTip, useItemEffect, canUseItemEffect |
| 34 | yellowPotion | items | itemEffect, itemEffectTip, useItemEffect, canUseItemEffect |
| 35 | sword1 | items | equip, itemEffect, itemEffectTip |
| 36 | shield1 | items | equip, itemEffect, itemEffectTip |
| 37 | sword2 | items | equip, itemEffect, itemEffectTip |
| 38 | shield2 | items | equip, itemEffect, itemEffectTip |
| 39 | sword3 | items | equip, itemEffect, itemEffectTip |
| 40 | shield3 | items | equip, itemEffect, itemEffectTip |
| 41 | sword4 | items | equip, itemEffect, itemEffectTip |
| 42 | shield4 | items | equip, itemEffect, itemEffectTip |
| 43 | sword5 | items | equip, itemEffect, itemEffectTip |
| 44 | shield5 | items | equip, itemEffect, itemEffectTip |
| 45 | book | constants | hideInToolbox, useItemEffect, canUseItemEffect |
| 46 | fly | constants | hideInReplay, hideInToolbox, useItemEffect, canUseItemEffect |
| 47 | pickaxe | tools | useItemEffect, canUseItemEffect |
| 48 | icePickaxe | tools | useItemEffect, canUseItemEffect |
| 49 | bomb | tools | useItemEffect, canUseItemEffect |
| 50 | centerFly | tools | useItemEffect, canUseItemEffect |
| 51 | upFly | tools | useItemEffect, canUseItemEffect |
| 52 | downFly | tools | useItemEffect, canUseItemEffect |
| 53 | coin | constants | - |
| 54 | freezeBadge | constants | useItemEffect, canUseItemEffect |
| 55 | cross | constants | - |
| 56 | superPotion | items | itemEffect, itemEffectTip, useItemEffect, canUseItemEffect |
| 57 | earthquake | tools | useItemEffect, canUseItemEffect |
| 58 | poisonWine | tools | useItemEffect, canUseItemEffect |
| 59 | weakWine | tools | useItemEffect, canUseItemEffect |
| 60 | curseWine | tools | useItemEffect, canUseItemEffect |
| 61 | superWine | tools | useItemEffect, canUseItemEffect |
| 62 | dagger | constants | - |
| 63 | pack | items | itemEffect, itemEffectTip |
| 64 | amulet | constants | - |
| 65 | hammer | tools | - |
| 68 | lifeWand | tools | useItemEvent, canUseItemEffect |
| 69 | jumpShoes | tools | useItemEffect, canUseItemEffect |
| 70 | sword0 | equips | equip, itemEffect, itemEffectTip |
| 71 | shield0 | equips | equip, itemEffect, itemEffectTip |
| 72 | skill1 | constants | hideInReplay, useItemEffect, canUseItemEffect |
| 73 | wand | items | - |
| 331 | I331 | items | canUseItemEffect |
| 332 | I332 | items | canUseItemEffect |
| 333 | I333 | items | canUseItemEffect |
| 334 | I334 | items | canUseItemEffect |
| 335 | I335 | items | canUseItemEffect |
| 336 | I336 | items | canUseItemEffect |
| 337 | I337 | items | canUseItemEffect |
| 338 | I338 | items | canUseItemEffect |
| 339 | I339 | items | canUseItemEffect |
| 340 | I340 | items | canUseItemEffect |
| 341 | I341 | items | canUseItemEffect |

**ITEM-COUNT: 62**

## 5. NPC

依 D-72①，`npcs`(14) 与 `npc48`(10) **合并**为 `npc`（不再有 48 变体）。数据来源为 §1 的图块集合（`public/project/maps.js:90` 起）。

> **交叉引用（D-72③，指令 1）：** D-72③ 的 **`animates` 并入 `terrains`，不设独立 `animates` 素材组** 作用于**图块素材分组**层面，与本节的 NPC 分组（依 D-72① 并入 `npc`）**互不冲突、互不影响**：NPC 图块仍归 `npc` 组，`animates` 图块归 `terrains` 组。本节不涉及 `animates` 内容。

### 5.1 图块映射候选（合并为 `npc`）

| 旧 `cls` | 旧 num | 旧 id | 目标 | 说明 |
| --- | --- | --- | --- | --- |
| `npcs` | 121 | `man` | `npc` | 普通 NPC（32px） |
| `npcs` | 122 | `trader` | `npc` | |
| `npcs` | 123 | `thief` | `npc` | |
| `npcs` | 124 | `fairy` | `npc` | |
| `npcs` | 125 | `wizard` | `npc` | |
| `npcs` | 126 | `recluse` | `npc` | |
| `npcs` | 127 | `king` | `npc` | |
| `npcs` | 128 | `youngMan` | `npc` | |
| `npcs` | 129 | `sign` | `npc` | |
| `npcs` | 130 | `expShop` | `npc` | |
| `npcs` | 131 | `moneyShop` | `npc` | |
| `npcs` | 132 | `princess` | `npc` | |
| `npcs` | 137 | `greenMan` | `npc` | |
| `npcs` | 138 | `blueTrader` | `npc` | |
| `npc48` | 133 | `npc0` | `npc` | 高 48px；含 `faceIds`（四面） |
| `npc48` | 134 | `npc1` | `npc` | 高 48px；含 `faceIds` |
| `npc48` | 135 | `npc2` | `npc` | 高 48px；含 `faceIds` |
| `npc48` | 136 | `npc3` | `npc` | 高 48px；含 `faceIds` |
| `npc48` | 319 | `tallYellowDoor` | `npc` | 高门（`trigger: openDoor` + `doorInfo`） |
| `npc48` | 320 | `tallBlueDoor` | `npc` | 高门 |
| `npc48` | 321 | `tallRedDoor` | `npc` | 高门 |
| `npc48` | 322 | `tallGreenDoor` | `npc` | 高门 |
| `npc48` | 323 | `tallSpecialDoor` | `npc` | 高门 |
| `npc48` | 324 | `tallSteelDoor` | `npc` | 高门 |

### 5.2 贴图归属候选

`public/project/materials/npcs.png:1`（64×448，14 NPC × 2 帧）与 `public/project/materials/npc48.png:1`（128×480，10 NPC × 2 帧）按 D-72① **合并**为一张 `npc`（多帧，2 帧），归属 §2.4 的 E 组（目标图 6 张，`npc0.png` … `npc5.png`）。**注意：** `npc48` 中的 6 个高门（319–324）虽归 `npc` 图块类，但其 48px 高度与 32px NPC 的帧尺寸不同——是否与 32px NPC 混入同一目标图，受 D-72④「不同帧数不得同图」约束需进一步确认（§8）。

**NPC-COUNT: 24**（= `npcs` 14 + `npc48` 10）

## 6. 地图 maps

数据来源：`public/project/floors/*.js`（`main.floors.<id> = {…}`，`public/project/floors/MT0.js:1`）。实测 **5** 个楼层文件。目标接口 `IMapRawData`（`packages-user/data-common/src/store/types.ts:260`）：`floorId` / `width` / `map: Record<number, number[]>` / `layerAlias: Record<number, string>` / `events: Record<number, Record<number, Record<number, string>>>`。

### 6.1 楼层登记

| 文件 | 楼层 id | `width` × `height` | `map` 形状 | `events` 条目数 | 备注字段 |
| --- | --- | --- | --- | --- | --- |
| `public/project/floors/empty.js:1` | `empty` | 13 × 13 | 二维 13×13 | 0 | `bgm` |
| `public/project/floors/MT0.js:1` | `MT0` | 13 × 13 | 二维 13×13 | 0 | — |
| `public/project/floors/sample0.js:1` | `sample0` | 13 × 13 | 二维 13×13 | 7 | `fgmap` 13×13、`bgm` |
| `public/project/floors/sample1.js:1` | `sample1` | 13 × 13 | 二维 13×13 | 15 | `weather` |
| `public/project/floors/sample2.js:1` | `sample2` | 26 × 26 | 二维 26×26 | 3 | `upFloor` |

各文件字段集合（实测）：`floorId` / `title` / `name` / `width` / `height` / `canFlyTo` / `canFlyFrom` / `canUseQuickShop` / `cannotViewMap` / `defaultGround` / `images` / `bgm` / `ratio` / `weather` / `map` / `firstArrive` / `eachArrive` / `parallelDo` / `events` / `changeFloor` / `afterBattle` / `afterGetItem` / `afterOpenDoor` / `cannotMove` / `cannotMoveIn` / `beforeBattle` / `autoEvent` / `upFloor` / `bgmap` / `fgmap` / `bg2map` / `fg2map`。

### 6.2 字段映射候选 → `IMapRawData`

分类口径同 §1.2；判定基准 = `IMapRawData`（`packages-user/data-common/src/store/types.ts:260`）。

| 旧字段 | 目标落点（候选） | 分类 | 说明 |
| --- | --- | --- | --- |
| `floorId` | `IMapRawData.floorId` | 映射候选（可确定） | 直接对应（如 `MT0`，`public/project/floors/MT0.js:1`） |
| `width` | `IMapRawData.width` | 映射候选（可确定） | 直接对应（13 / 26） |
| `map`（二维数组 `[row][col]`） | `IMapRawData.map: Record<number, number[]>` | 映射候选（可确定） | 旧二维数组 → 新「层键 → 一维数组」；层键即行索引（`0`…`height-1`）为候选，见 `src/content/maps/MT0.jsonc:6`（`"0"` / `"10"` 两键） |
| `layerAlias`（旧无） | `IMapRawData.layerAlias` | 映射候选（可确定） | 旧数据无该字段；默认空对象（`src/content/defaults/map.jsonc:1` 给出 `{}`） |
| `events`（`"x,y"` → 事件数据） | `IMapRawData.events: Record<number, Record<number, Record<number, string>>>` | 待定（有目标字段但映射不确定） | **确有对应目标字段** `IMapRawData.events`；仅「层 → 位置索引 → 优先级 → 事件 id」三段嵌套由 `"x,y"` 换算的算法未定（§8.2 U-15） |
| `title` / `name` | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 楼层显示名（如 `主塔 0 层` / `样板 0 层`）；`IMapRawData` 无对应字段（§8.1 U-16） |
| `height` | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | `IMapRawData` 无 `height`；由 `map` 层数隐含（§8.1 U-16） |
| `firstArrive` / `eachArrive` / `parallelDo` | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 楼层到达 / 并行事件；无专用字段承载（§8.1 U-16） |
| `changeFloor` | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 换层定义（含 `floorId` / `stair` / `loc` / `direction`）；无专用字段（§8.1 U-16） |
| `afterBattle` / `afterGetItem` / `afterOpenDoor` / `beforeBattle` / `cannotMove` / `cannotMoveIn` / `autoEvent` | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 各类钩子事件；无专用字段（§8.1 U-16） |
| `bgmap` / `fgmap` / `bg2map` / `fg2map` | 图层机制（候选） | 待定（有目标字段但映射不确定） | 旧额外图层二维数组（如 `sample0` 的 `fgmap` 13×13，含 10169 等数字）；**可能**落入 `IMapRawData.map` / `layerAlias`，但对应关系无法唯一确定（§8.2 U-16b） |
| `images` / `bgm` / `weather` / `ratio` / `defaultGround` / `canFlyTo` / `canFlyFrom` / `canUseQuickShop` / `cannotViewMap` / `upFloor` | 无（目标接口无对应字段） | 只记录、不移植（目标接口无对应字段） | 渲染 / 规则属性；`IMapRawData` 无对应字段（§8.1 U-16） |

**MAP-COUNT: 5**

## 7. 贴图列表 schema 草案（texture/.list.jsonc）

依 `ITextureManager` 的能力（`packages-user/client-base/src/material/types.ts`）**反向设计** `src/content/texture/.list.jsonc`（落点由 `src/content/client.jsonc:9` 的 `textureListDir: texture/.list.jsonc` 指定；现状为 `{}`，`src/content/texture/.list.jsonc:1`）。**仅草案**；所有字段命名均为候选、标注「待用户报备批准」，**不落地写入任何文件**（D-73 / OI-3 / OI-5）。

能力依据：

- `addGrid(source, map, width, height)`（`:261`）—— 单帧网格贴图（先左到右、再上到下）。
- `addRowAnimate(source, map, width, height)`（`:275`）—— 行动画贴图（每行帧数一致，逐行映射）。
- `addAutotile(source, identifier, type)`（`:289`）—— 自动元件（`type: AutotileType`）。
- `addTileset(source, identifier, cellWidth, cellHeight)`（`:302`）—— tileset 切片（`identifier: IIndexedIdentifier`）。

字段结构草案（与 §2 登记逐条一致）：

| 条目 `type`（候选） | 承载来源（§2） | 字段（候选） | 对应方法 |
| --- | --- | --- | --- |
| `grid` | §2.4 A 组（`terrains` 单帧）、C 组（`items` 单帧） | `source`（PNG 路径）/ `map`（图块数字数组）/ `width` / `height`（单帧像素尺寸，候选 32） | `addGrid` |
| `rowAnimate` | §2.4 B 组（animates 并入 terrains）、D 组（enemy）、E 组（npc） | `source` / `map` / `width` / `height`（每帧像素尺寸） | `addRowAnimate` |
| `autotile` | §2.2（`autotiles/*.png`） | `source` / `identifier`（图块数字）/ `type`（`AutotileType`） | `addAutotile` |
| `tileset` | §2.3（`tilesets/*.png`） | `source` / `identifier`（`{ index, alias }`）/ `cellWidth` / `cellHeight` | `addTileset` |

字段结构草案（示意，**非落地**）：

```
{
    "textures": [
        { "type": "grid",       "source": "<terrains 目标图>",   "map": [ /* nums */ ], "width": 32, "height": 32 },
        { "type": "rowAnimate", "source": "<terrains 动画目标图>", "map": [ /* nums */ ], "width": 32, "height": 32 },
        { "type": "grid",       "source": "<items 目标图>",      "map": [ /* nums */ ], "width": 32, "height": 32 },
        { "type": "rowAnimate", "source": "<enemy 目标图>",      "map": [ /* nums */ ], "width": 32, "height": 32 },
        { "type": "rowAnimate", "source": "<npc 目标图>",        "map": [ /* nums */ ], "width": 32, "height": 32 },
        { "type": "autotile",   "source": "<autotile.png>",     "identifier": 20,  "type": 1 },
        { "type": "tileset",    "source": "<magictower.png>",   "identifier": { "index": 0, "alias": "magictower" }, "cellWidth": 32, "cellHeight": 32 }
    ]
}
```

一致性核对：materials 图 → `grid`（单帧）/ `rowAnimate`（多帧）；`autotiles/*.png` → `autotile`；`tilesets/*.png` → `tileset`。与 §2.1–§2.4 的登记逐条对应。

### 7.1 显式 TypeScript 类型声明（候选，均「待用户报备批准」）

> 本节为 §7 schema 的**显式类型声明**（`interface` 与 `type` 别名形式），供后续「迁移计划」落地参考。**所有新增类型名 / 字段名均为「命名候选」，标注「待用户报备批准」，本盘点不落地写入任何文件**（D-73 / OI-2）。

```ts
/** 图像源路径（候选命名，待用户报备批准） */
type TextureListSource = string;

/** grid 条目，对应 `addGrid`（候选命名，待用户报备批准） */
interface ITextureListGridEntry {
    /** 条目判别字段 */
    type: 'grid';
    /** 图像源 */
    source: TextureListSource;
    /** 贴图的图块数字映射，按先从左到右、再从上到下顺序映射（对应 `addGrid` 的 `map`） */
    map: number[];
    /** 每个贴图的像素宽度（对应 `addGrid` 的 `width`） */
    width: number;
    /** 每个贴图的像素高度（对应 `addGrid` 的 `height`） */
    height: number;
}

/** rowAnimate 条目，对应 `addRowAnimate`（候选命名，待用户报备批准） */
interface ITextureListRowAnimateEntry {
    /** 条目判别字段 */
    type: 'rowAnimate';
    /** 图像源 */
    source: TextureListSource;
    /** 贴图的图块数字映射，按从上到下顺序映射（对应 `addRowAnimate` 的 `map`） */
    map: number[];
    /** 每一帧的像素宽度（对应 `addRowAnimate` 的 `width`） */
    width: number;
    /** 每一帧 / 每一行的像素高度（对应 `addRowAnimate` 的 `height`） */
    height: number;
}

/** autotile 条目，对应 `addAutotile`（候选命名，待用户报备批准） */
interface ITextureListAutotileEntry {
    /** 条目判别字段 */
    type: 'autotile';
    /** 图像源 */
    source: TextureListSource;
    /** 自动元件的图块数字（对应 `addAutotile` 的 `identifier`） */
    identifier: number;
    /**
     * 自动元件类型，取 `AutotileType`（对应 `addAutotile` 的 `type` 参数）。
     * 为避免与判别字段 `type` 同名冲突，此参数以候选字段名 `autotileType` 承载（待用户报备批准，见 §8.3 U-19）。
     */
    autotileType: AutotileType;
}

/** tileset 条目，对应 `addTileset`（候选命名，待用户报备批准） */
interface ITextureListTilesetEntry {
    /** 条目判别字段 */
    type: 'tileset';
    /** 图像源 */
    source: TextureListSource;
    /** tileset 标识符对象，取 `IIndexedIdentifier`（对应 `addTileset` 的 `identifier`） */
    identifier: IIndexedIdentifier;
    /** Tileset 中每个 tile 的宽度（对应 `addTileset` 的 `cellWidth`） */
    cellWidth: number;
    /** Tileset 中每个 tile 的高度（对应 `addTileset` 的 `cellHeight`） */
    cellHeight: number;
}

/** 贴图列表条目联合类型：四类 entry 之一（候选命名，待用户报备批准） */
type TextureListEntry =
    | ITextureListGridEntry
    | ITextureListRowAnimateEntry
    | ITextureListAutotileEntry
    | ITextureListTilesetEntry;

/** `texture/.list.jsonc` 顶层配置接口（候选命名，待用户报备批准） */
interface ITextureListConfig {
    /** 贴图条目列表，元素为 `TextureListEntry` */
    textures: TextureListEntry[];
}
```

**类型声明与能力接口的对应：** `ITextureListGridEntry` ↔ `addGrid`（`packages-user/client-base/src/material/types.ts:261`）；`ITextureListRowAnimateEntry` ↔ `addRowAnimate`（`:275`）；`ITextureListAutotileEntry` ↔ `addAutotile`（`:289`，`type` 取 `AutotileType`，定义于 `:12`）；`ITextureListTilesetEntry` ↔ `addTileset`（`:302`，`identifier` 取 `IIndexedIdentifier`，定义于 `:50`）。`ITextureListConfig.textures` 的元素即 `TextureListEntry`。

**待报备命名清单（OI-2）：** 类型名 `TextureListSource` / `ITextureListGridEntry` / `ITextureListRowAnimateEntry` / `ITextureListAutotileEntry` / `ITextureListTilesetEntry` / `TextureListEntry` / `ITextureListConfig`，以及字段名 `type` / `source` / `map` / `width` / `height` / `identifier` / `autotileType` / `cellWidth` / `cellHeight` / `textures`；**均「待用户报备批准」**。

## 8. 未确定项 / 待确认观察

以下内容**无法从阅读 / 静态解析唯一确定**，或属**疑似不一致的观察**。依 prohibitions，**均不登记为缺陷**，仅作待确认观察，供用户裁定。

**分区依据（指令 2）：** 按「新接口（`ITileRawData` / `ITilePassData` / `IEnemyRawData` / `IItemRawData` / `IMapRawData`）是否存在对应字段」二分 —— **§8.1** 为**无目标字段 → 只记录、不移植**（字段级）；**§8.2** 为**有目标字段但映射不确定 → 待定**（字段级）；**§8.3** 保留**非字段级**的其他待确认观察。§8.1 / §8.2 与 §1.2 / §3.1 / §4.2 / §6.2 的「分类」列**逐条一致**。（旧编号 U-1..U-18 全部保留；含跨类内容的项拆为 `U-10b` / `U-16b`。）

### 8.1 无目标字段 → 只记录、不移植（字段级）

判定基准：目标接口中**不存在**对应字段；旧字段只作盘点记录，不进入迁移。

| 编号 | 观察 / 未确定项 | 所查接口与缺失字段（执行日实测） |
| --- | --- | --- |
| U-4 | 图块 `canBreak`(4) / `script`(5) / `doorInfo`(17) / `animate`(21)（§1.2） | 查 `ITileRawData`（`packages-user/data-common/src/store/types.ts:47`）与 `ITilePassData`（`:38`）：无承载「可破坏 / 内联脚本正文 / 门机制参数（`time`/`keys`/`openSound`/`closeSound`）/ 帧数」的字段 |
| U-5 | 图块 `name`(32) / `faceIds`(4) / `autotileConnection`(2)（§1.2） | 查 `ITileRawData`（`:47`）/ `ITilePassData`（`:38`）：无显示名 / 多面 / 自动元件连接字段（`autotileConnection` 对应 `IAutotileProcessor.setConnection`，非图块原始数据字段） |
| U-10b | 怪物 `faceIds`(4)（§3.1） | 查 `IEnemyRawData`（`:319`）：无多面怪物字段 |
| U-13 | 道具 `hideInReplay`(2)（§4.2） | 查 `IItemRawData`（`:176`）：无对应字段 |
| U-16 | 地图 `title` / `name` / `height` / `firstArrive` / `eachArrive` / `parallelDo` / `changeFloor` / `afterBattle` / `afterGetItem` / `afterOpenDoor` / `beforeBattle` / `cannotMove` / `cannotMoveIn` / `autoEvent` / `images` / `bgm` / `weather` / `ratio` / `defaultGround` / `canFlyTo` / `canFlyFrom` / `canUseQuickShop` / `cannotViewMap` / `upFloor`（§6.2） | 查 `IMapRawData`（`:260`）：无上述楼层属性的对应字段 |

### 8.2 有目标字段但映射不确定 → 待定（字段级）

判定基准：目标接口**确有**对应字段，但取值 / 展开 / 嵌套关系无法由静态解析唯一确定。

| 编号 | 观察 / 未确定项 | 已确认存在的目标字段（执行日实测） | 缺什么才能确定 |
| --- | --- | --- | --- |
| U-2 | 图块 `trigger`（`null` / `openDoor` / `ski` / `pushBox`）的具体对应（§1.2，共 20 条） | `ITileRawData.events`（`:53`）/ `eventPass`（`:62`） | 新引擎事件 id 命名与事件可通行性约定 |
| U-3 | 图块 `canPass: true` → 四方向通行位（`PassBit`）的具体展开（§1.2，共 19 条） | `ITilePassData.inPass` / `outPass`（`:38`，位掩码见 `PassBit` `:27`） | 新引擎通行位的方向展开规则 |
| U-10 | 怪物 `value` / `range` / `zoneSquare` / `add` / `n` / `bigImage` / `notBomb` / `atkValue` / `defValue` 与 `special` 数字键的绑定关系（§3.1） | `IEnemyRawData.special`（`:325`）/ `attribute`（`:323`） | 新引擎特殊属性数字字典 |
| U-12 | 道具 `itemEffect` / `itemEffectTip` / `useItemEffect` / `useItemEvent` / `canUseItemEffect` 的目标落点（§4.2） | `IItemEffect`（`:138`，含 `useEvent` / `useEffect` / `canUse`） | 新引擎道具效果接口对上述字段的承载方式 |
| U-14 | `equip.type`（单值）→ `IItemEquipData.slots`（数组）的包装；`animate` 字符串 → `AnimationIds`；`value` 属性名（`atk` / `def` / `mdef`）→ 新属性键（§4.3） | `IItemEquipData`（`:161`） | 新引擎装备槽索引、动画 id 与属性键的取值 |
| U-15 | 地图 `events` 旧键 `"x,y"` → `IMapRawData.events` 三段嵌套（层 / 位置索引 / 优先级）的算法（§6.2） | `IMapRawData.events`（`:270`） | 新引擎事件位置索引与优先级约定 |
| U-16b | 地图 `bgmap` / `fgmap` / `bg2map` / `fg2map` 是否并入地图图层（§6.2） | `IMapRawData.map`（`:266`）/ `layerAlias`（`:268`） | 额外图层是否编入 `map` / `layerAlias` 及对应关系 |

### 8.3 其他待确认观察（非字段级）

| 编号 | 观察 / 未确定项 | 缺什么才能确定 |
| --- | --- | --- |
| U-1 | D-72⑤ 读法：本盘点将「单帧按 4×4 / 多帧按帧数列 × 4 行」理解为「单帧目标图 = 4×4 网格（16 格）；多帧目标图 = 帧数列 × 4 行（4 块）」，并据此得 SPLIT-COUNT = 42（§2.4）。 | 用户确认该读法，或给出目标图每图格数的确切约定 |
| U-6 | `ground.png` / `airwall.png` / `keyboard.png` / `icons.png` / `icons_old.png` 是否属于 D-72 四类拆分范围及其归属（§2.1）。 | 用户确认其是否纳入 tile 素材及归入哪一类 |
| U-7 | `autotile1.png`（384×128）的自动元件类型无法由尺寸唯一判定为 2×3 `Small2x3` 或 3×4 `Big3x4`（§2.2）。 | 该素材的原始自动元件规格 |
| U-8 | `magictower.png`（256×1216）的 `cellWidth` / `cellHeight` 切格尺寸与 `identifier.index`（§2.3）。 | 该 tileset 的切格尺寸与索引约定 |
| U-9 | `enemy48.png` / `npc48.png` 的每格像素与帧布局：本盘点按「2 帧列、128px 宽」推导（§2.1），但 48px 高度下的单元格尺寸未由数据唯一确定。 | 高 48px 素材的单元格尺寸与帧布局 |
| U-11 | 道具 `category` 细分：`cls: items` 且带 `equip` 的剑盾（`sword1..5` / `shield1..5`）应取 `Consumable` 还是 `Equipment`（§4.1）。 | 用户确认其分类口径 |
| U-17 | `npc48` 中的 6 个高门（319–324，48px 高）与 32px NPC 是否可混入同一目标图（受 D-72④「不同帧数不得同图」约束，§5.2）。 | 用户确认高门是否单独成图 |
| U-18 | `blocksInfo` 中无 `None` / `Tileset` 类图块定义（§1.1）；空图块（num 0）在 `map` 中大量出现但不在 `blocksInfo`。 | 新引擎对空图块 / tileset 图块的定义方式 |
| U-19 | §7.1 中 `autotile` 条目的 `AutotileType` 参数与条目判别字段 `type` **同名**，无法同时以 `type` 承载二者（§7.1）。 | 用户确认该参数字段的最终命名（候选名 `autotileType`，待用户报备批准）（OI-2 的一部分） |

> **U-19 说明：** 此为**命名层面的观察**（不登记为缺陷）—— 判别字段 `type`（取 `'grid'` / `'rowAnimate'` / `'autotile'` / `'tileset'`）与 `addAutotile` 的 `type: AutotileType` 参数冲突；§7.1 暂以候选字段名 `autotileType` 消歧，最终命名待用户裁定。

## 9. 汇总

| 维度 | 计数 | 说明 |
| --- | --- | --- |
| 图块 tile | 235 | `public/project/maps.js` 的 `blocksInfo`（8 个 `cls`） |
| 贴图素材 textures | 17 | materials 12 + autotiles 4 + tilesets 1 |
| 素材拆分目标图 split | 42 | D-72 四类推导（terrains/items/enemy/npc）；**`animates` 并入 `terrains`，不设独立 `animates` 素材组**（D-72③） |
| 怪物 enemy | 81 | `public/project/enemys.js`（与 `enemys` 73 + `enemy48` 8 图块一一对应） |
| 道具 items | 62 | `public/project/items.js`（`tools` 20 / `items` 32 / `equips` 2 / `constants` 8） |
| NPC | 24 | `npcs` 14 + `npc48` 10（合并为 `npc`） |
| 地图 maps | 5 | `public/project/floors/*.js` |

机器可读计数行：

```
TILE-COUNT: 235
MATERIAL-COUNT: 17
SPLIT-COUNT: 42
ENEMY-COUNT: 81
ITEM-COUNT: 62
NPC-COUNT: 24
MAP-COUNT: 5
```

> **命名说明：** 本盘点中提出的所有候选命名 —— 拆分后贴图文件名 `terrains*/items*/enemy*/npc*`、`addTileset` / `addAutotile` 的 `identifier` 与参数名、`texture/.list.jsonc` 字段名 `grid` / `rowAnimate` / `autotile` / `tileset`、**§1.5 的新 `num` 分配策略候选（策略 A / B / C / D）**、**§7.1 的显式 TypeScript 类型名（`TextureListSource` / `ITextureListGridEntry` / `ITextureListRowAnimateEntry` / `ITextureListAutotileEntry` / `ITextureListTilesetEntry` / `TextureListEntry` / `ITextureListConfig` 及其字段）** —— **均为「命名候选」，标注「待用户报备批准」，本计划不落地使用**（D-73 / OI-1 / OI-2）。**`animates` 并入 `terrains`，不设独立 `animates` 素材组**（D-72③）。§8 的未确定项均**未登记为缺陷**，仅作待确认观察，待用户裁定后方可另立计划。
