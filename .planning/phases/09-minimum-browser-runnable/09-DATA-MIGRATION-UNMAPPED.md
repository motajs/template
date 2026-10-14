# Phase 9 · 任务 9：旧引擎数据「无目标字段」说明文档（09-DATA-MIGRATION-UNMAPPED）

> 本文件是 Phase 9 任务 9（`09-19-PLAN.md`，D-76 / D-78）的产物之一。**仅收录盘点台账 `09-DATA-MIGRATION-AUDIT.md` §8.1「无目标字段 → 只记录、不移植」的字段**——这些旧字段在新接口（`ITileRawData` / `ITilePassData` / `IEnemyRawData` / `IItemRawData` / `IMapRawData`）中**不存在对应字段**，故本次基础移植**不写入任何数据文件**，仅在此记录，供用户后续补充。
>
> **§8.2「有目标字段但映射不确定 → 待定」的字段不写入本文件**，它们保留在盘点台账 `09-DATA-MIGRATION-AUDIT.md` §8.2，同样未移植。
>
> 文档使用裸 LF 行尾（随仓库既有 phase 文档约定）。路径 / 命名经 Task 0 报备待批准（OI-1）。

## 1. 图块 tile（源：`public/project/maps.js` 的 `blocksInfo`）

| 旧字段 | 所查接口与缺失字段 |
| --- | --- |
| `canBreak` | 查 `ITileRawData`（`packages-user/data-common/src/store/types.ts:47`）与 `ITilePassData`（同文件 `:38`）：无承载「可破坏」语义的字段 |
| `script` | 查 `ITileRawData`（`:47`）：`events` 仅存事件 id，不承载内联脚本正文 |
| `doorInfo` | 查 `ITileRawData` / `ITilePassData`：无承载门机制参数（`time` / `keys` / `openSound` / `closeSound`）的字段 |
| `animate` | 查 `ITileRawData`（`:47`）：无帧数字段；帧数由素材（`addRowAnimate`）承载，不落数据文件 |
| `name` | 查 `ITileRawData`（`:47`）：无显示名字段 |
| `faceIds` | 查 `ITileRawData`（`:47`）：无多面机制字段 |
| `autotileConnection` | 查 `ITileRawData`（`:47`）：对应 `IAutotileProcessor.setConnection`，非图块原始数据字段 |

## 2. 怪物 enemy（源：`public/project/enemys.js`）

| 旧字段 | 所查接口与缺失字段 |
| --- | --- |
| `faceIds` | 查 `IEnemyRawData`（`packages-user/data-common/src/store/types.ts:319`）：无多面怪物字段 |

## 3. 道具 item（源：`public/project/items.js`）

| 旧字段 | 所查接口与缺失字段 |
| --- | --- |
| `hideInReplay` | 查 `IItemRawData`（`packages-user/data-common/src/store/types.ts:176`）：无对应字段 |

## 4. 地图 maps（源：`public/project/floors/*.js`）

| 旧字段 | 所查接口与缺失字段 |
| --- | --- |
| `title` | 查 `IMapRawData`（`packages-user/data-common/src/store/types.ts:260`）：无楼层显示名字段 |
| `name` | 查 `IMapRawData`（`:260`）：无楼层名称字段 |
| `height` | 查 `IMapRawData`（`:260`）：无 `height` 字段；由 `map` 图层长度与 `width` 隐含 |
| `firstArrive` | 查 `IMapRawData`（`:260`）：无到达事件字段 |
| `eachArrive` | 查 `IMapRawData`（`:260`）：无到达事件字段 |
| `parallelDo` | 查 `IMapRawData`（`:260`）：无并行事件字段 |
| `changeFloor` | 查 `IMapRawData`（`:260`）：无换层定义字段 |
| `afterBattle` | 查 `IMapRawData`（`:260`）：无战后钩子字段 |
| `afterGetItem` | 查 `IMapRawData`（`:260`）：无拾取后钩子字段 |
| `afterOpenDoor` | 查 `IMapRawData`（`:260`）：无开门后钩子字段 |
| `beforeBattle` | 查 `IMapRawData`（`:260`）：无战前钩子字段 |
| `cannotMove` | 查 `IMapRawData`（`:260`）：无移动限制字段 |
| `cannotMoveIn` | 查 `IMapRawData`（`:260`）：无移动限制字段 |
| `autoEvent` | 查 `IMapRawData`（`:260`）：无自动事件字段 |
| `images` | 查 `IMapRawData`（`:260`）：无楼层图像字段 |
| `bgm` | 查 `IMapRawData`（`:260`）：无背景音乐字段 |
| `weather` | 查 `IMapRawData`（`:260`）：无天气字段 |
| `ratio` | 查 `IMapRawData`（`:260`）：无战斗倍率字段 |
| `defaultGround` | 查 `IMapRawData`（`:260`）：无默认地面字段 |
| `canFlyTo` | 查 `IMapRawData`（`:260`）：无飞行到达字段 |
| `canFlyFrom` | 查 `IMapRawData`（`:260`）：无飞行出发字段 |
| `canUseQuickShop` | 查 `IMapRawData`（`:260`）：无快捷商店字段 |
| `cannotViewMap` | 查 `IMapRawData`（`:260`）：无查看地图限制字段 |
| `upFloor` | 查 `IMapRawData`（`:260`）：无上下楼字段 |

## 5. 未收录项

- **§8.2「待定」字段不在此文档**（tile `trigger` / `canPass`；enemy `value` / `range` / `zoneSquare` / `add` / `n` / `bigImage` / `notBomb` / `atkValue` / `defValue`；item `itemEffect` 系列；地图 `events` 与额外图层等）—— 保留在 `09-DATA-MIGRATION-AUDIT.md` §8.2，本增量不移植。
- 上表字段仅作盘点记录，未写入 `src/content/**` 任何数据文件（各实体 / 地图以精确键集断言兜底）。
