---
phase: 09-minimum-browser-runnable
plan: 41
subsystem: runtime-parity-audit
tags: [parity, runtime, plugins, loader, audio, save, server, replay, uncertain]
status: complete
requires: [09-36, 09-37, 09-38, 09-39, 09-40]
provides:
  - .planning/phases/09-minimum-browser-runnable/09-PARITY/05-RUNTIME-UNCERTAIN.md
affects: []
tech-stack:
  added: []
  patterns: [static-source-audit, deny-list, five-value-enum, dedupe-uncertain]
key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-PARITY/05-RUNTIME-UNCERTAIN.md
    - .planning/phases/09-minimum-browser-runnable/09-41-SUMMARY.md
  modified: []
decisions:
  - "运行时审计以静态源码为准，不启动浏览器、不做 UAT"
  - "13 插件与 31 loader 按旧仓库实测枚举，不按『有插件/loader 系统』整体判定"
  - "音频 speed/pitch 与新效果器分开判定：Volume/Echo/Delay/Stereo 不等价于 speed/pitch"
  - "服务端整体判 MISSING，客户端 sync.php 残留只判 PARTIAL"
  - "P6 只汇总 P2–P5 的 UNCERTAIN，不重新判定已明确条目"
metrics:
  duration: "约 1 小时（20:16–21:0x 本地）"
  completed: "2026-11-03"
  tasks: 4
  files: 2
estimate:
  tokens: 80000
  confidence: low
actuals:
  tokens: 12000
  tasks: 4
  commits: 0
---

# Phase 09 Plan 41: 运行时、扩展与不确定项汇总 Summary

一句话：完成 `09-PARITY/05-RUNTIME-UNCERTAIN.md`，逐项审计 13 个旧插件、扩展加载、31 个 loader 方法、音频/BGM/SE、存档/同步、服务端、错误/日志/调试、全局 `Mota`、构建入口与回放播放控制，并汇总 P2–P5 全部 `PAR-UNC` 与 25 项总覆盖率。

## 0. 快照

| 项 | 值 |
| --- | --- |
| 旧引擎 HEAD / dirty | `3efb548e407ad2b8007b498cb98401e2012a0b55` / 0 |
| 新引擎 HEAD / dirty | `bd4d2630f5b4010194f3318873158fe1265745e1` / 148 |
| 快照时间 | `2026-11-03 20:16:34 +08:00` |
| 与前序 5 份文档 | 旧 HEAD/dirty 一致；新 HEAD 由 `b2e9481…` 前移到 `bd4d263…`（只改 `AGENTS.md`/`dev.md` 的提交），dirty 仍 148；不影响运行时结论 |

- 基线：`%TEMP%/gsd-09-parity-41-baseline.txt`（148 行）；快照：`%TEMP%/gsd-09-parity-41-snapshot.txt`。
- 工作树含用户并发改动（`09-42-PLAN.md`、`setting/*.ts`、`packages/common/src/logger.json` 等），本计划未触碰、未回滚、未提交。

## 1. 覆盖结果

### 1.1 13 个旧插件

- 全量枚举：`init`、`drawLight`、`shop`、`removeMap`、`fiveLayers`、`itemShop`、`enemyLevel`、`multiHeros`、`heroFourFrames`、`routeFixing`、`numpad`、`sprites`、`hotReload`，13/13 逐项写入 `## 2.2`。
- 判定：MISSING 8、PARTIAL 3、DIFFERENT 2、UNCERTAIN 0、SUPPORTED 0。
- 关键结论：新引擎只有 `DataShopPlugin`/`ClientShopPlugin` 两个实际注册插件；`drawLight`/`sprites`/`fiveLayers`/`heroFourFrames` 由 P4 交叉引用；其余插件未检索到等价实现。

### 1.2 31 个 loader 方法

- 从 `libs/loader.js` 动态提取 `loader.prototype.*`，31/31 逐项写入 `## 4.1`，覆盖 `_loadMaterials_*`、`_loadExtraImages_*`、`_loadAutotiles_*`、`_loadTilesets_*`、`_loadAnimates_*`、`_loadMusic_*`、`loadImages`、`loadBgm` 等分组。
- 判定：MISSING 2（`_load_sync`、`loadImagesFromZip`）、PARTIAL 3、DIFFERENT 26、UNCERTAIN 0、SUPPORTED 0。
- 关键结论：新 loading 为 core→extra→custom 三段 + `ILoadManager` 字节/任务进度；旧同步入口与 zip 资源包无等价。

### 1.3 音频/BGM/SE

- 旧 `playBgm`/`pauseBgm`/`resumeBgm`/`setBgmSpeed`/`playSound`/`stopSound`/`getPlayingSounds`/`checkBgm`/`setMusicBtn` 与 `core.musicStatus` 的 `bgmSpeed`/`bgmUsePitch`/`cachedBgms`/`cachedBgmCount` 逐项对照 `packages/audio`。
- **MISSING**：`setBgmSpeed`、`bgmSpeed`、`bgmUsePitch`，以及 `playSound` 的 `pitch` 参数。检索 `playbackRate`/`pitch`/`detune`/`rate`/`speed`/`bgmSpeed`/`bgmUsePitch`/`cachedBgm`，`packages/audio/src/**` 0 命中（`rate` 仅 `source.ts:189` 采样率变量）。
- 新 `Volume`/`Echo`/`Delay`/`Stereo` 只覆盖音量/效果/声像，明确不能替代 speed/pitch。

### 1.4 服务端/网络

- 旧 `server.js`/`server.py`：静态服务、楼层/动画打包、文件读写、热重载、录像上传校验、排行；新仓库**无 `server.js`/`server.py`**，整体 **MISSING**。
- 客户端唯一残留：`packages-user/client-modules/src/render/utils/saves.ts:110` 的 `fetch('/games/sync.php')`，整段 `syncLoad` 被注释（`saves.ts:102-124`），只判 **PARTIAL**，不判服务端已实现。
- 旧服务端本身未见 `/sync` 路由；同步依赖外部 PHP 服务，已在 `## 7.1` 注明。

### 1.5 存档/同步、错误/日志、Mota、构建入口、回放控制

- 存档：旧 `core.saves`/localForage/`saveData`/`loadData`/`autosave`/`syncSave`/`syncLoad` vs 新 `ISaveableContent`/`SaveCompression`/Dexie/undo/redo/`getLastSlot`；Dexie 后端 SUPPORTED，同步 MISSING。
- 错误/日志：新 `logger.json` 实测 `error` 89 条（编号 1–2008）、`warn` 214 条（编号 1–1001）；旧 `core.debug` MISSING，`main.mode` UNCERTAIN，`isCompetition` MISSING。
- `Mota`：`Mota.require`/`Mota.register`/`Mota.r`/`Mota.rf` 均在 `packages-user/entry-data/src/mota.ts`；旧 `loadList` 实测 13 模块（计划文本写 14，已按实测记录）；`index.html` 由 4 个第三方脚本 + `main.js` 改为单个 `bootstrap.ts` 模块入口。
- 回放控制：新 `IReplaySandbox` 提供 `play`/`pause`/`resume`/`step`/`setSpeed` + `onStep`/`onSpeedSet`/`onStartReplay`/`onStopReplay`/`onPauseReplay`/`onResumeReplay` 钩子；UI 仍读旧 `core.status.replay`，判 PARTIAL。命令语义交叉引用 `02-GAMEPLAY.md#11`。

## 2. P6 判定计数

| 域 | MISSING | PARTIAL | DIFFERENT | UNCERTAIN | SUPPORTED | 合计 |
| --- | --- | --- | --- | --- | --- | --- |
| 13 个旧插件 | 8 | 3 | 2 | 0 | 0 | 13 |
| 31 个 loader 方法 | 2 | 3 | 26 | 0 | 0 | 31 |
| 音频/BGM/SE 旧能力 | 4 | 2 | 9 | 0 | 0 | 15 |
| 存档/存储/同步 | 1 | 1 | 6 | 0 | 1 | 9 |
| 服务端/网络 | 6 | 0 | 0 | 0 | 0 | 6 |
| 日志/调试旧能力 | 2 | 0 | 1 | 1 | 0 | 4 |
| Mota/构建入口旧能力 | 1 | 0 | 4 | 1 | 0 | 6 |
| 回放播放控制 | 0 | 3 | 3 | 0 | 0 | 6 |
| **合计** | **24** | **12** | **51** | **2** | **1** | **90** |

- 本文件以域表统计，未为每个条目单独分配 `PAR-RT-###` 行号；`NEW-ONLY` 行不计入合计。

## 3. UNC 汇总

- `## 11` 共 27 行：P2 9 条（`PAR-UNC-001`–`009`）、P3 4 条（`PAR-UNC-100`–`103`）、P4 6 条（`PAR-UNC-200`–`205`）、P5 6 条（`PAR-UNC-300`–`305`），另加 `PAR-UNC-199`/`PAR-UNC-399` 两个区间端点占位行。
- P2–P5 的 3 条 `新结论 = UNCERTAIN` 行（`PAR-DATA-006`、`PAR-DATA-017`、`PAR-DATA-039`）与 27 个 `PAR-UNC-*` 引用全部出现；`PAR-GAME-186`/`PAR-GAME-205` 也作为来源 ID 出现。
- P6 自有：`PAR-UNC-400`–`403`（`main` 运行时提供者、运行时热重载等价、扩展加载构建期替代、keyboard 素材）。
- 去重合并：`PAR-UNC-304` 与 `PAR-UNC-101` 语义重叠，合并统计只计一次，两个编号均保留；变更记录见 `## 11.1`。

## 4. 25 项总覆盖率

- `## 12` 恰好 25 行，序号 1..25 与 `00-INDEX.md#8` 逐行同序号、同源名。
- 已覆盖 18 项（6–23）、部分 7 项（1–5、24、25）、未覆盖 0 项。
- 证据位置全部为真实存在的 `09-PARITY/0[1-5]-*.md#<小节>` 锚点；未使用「前文/同 P/见上/待补」。

## 5. 验证结果（真实命令输出）

- Task 1 插件/loader：`plugins 13 loaders 31`（退出码 0）。
- Task 1 前序文档：`missingDocs [] uncertainRows 3`（退出码 0）。
- Task 3 标题：`bytes 40038 missing []`（退出码 0；`bytes` 为 JS 字符数）。
- Task 3 插件/loader 反引号：`plugins 13 missingPlugins [] loaders 31 missingLoaders []`（退出码 0）。
- Task 3 UNC：`prioUncertain 3 missingUncertain 0 prioUncRefs 27 missingRefs 0 uncRows 31`（退出码 0）。
- Task 3 25 项台账：`indexRows 25 outRows 25 numOk true nameBad 0 statusBad 0 evidenceBad 0`（退出码 0）。
- Task 3 音频/服务端/Mota：`missingAudio [] missingServer [] missingMota []`（退出码 0）。
- Task 3 deny/表头：`fixtureOk true entryRows 0 supported 0 supportedDenyHits 0 noAnchor 0 header true`（退出码 0）。
- Task 4 范围闸门：首次运行 `added 3`，多出的是基线首行 BOM 导致的 `.planning/phases/10-docs-restructure/10-CONTEXT.md` 假阳性（该文件在基线时已是 `M`）；将临时基线重写为无 BOM（内容不变）后：`baselineSource 75 nowSource 75 added 2 touched 0`，新增恰为 `05-RUNTIME-UNCERTAIN.md` 与 `09-41-SUMMARY.md`，源码/配置零变化，前序文档零触碰（退出码 0）。
- Task 4 范围闸门（最终复核，外部漂移）：用户并发新增 4 个 `docs/.vitepress/components/demos/ui/text-*.tsx` 并删除/拆分 `text-demo.tsx`，严格门禁变为 `baselineSource 75 nowSource 78 added 6 touched 0` 并返回非 0。**其中本计划新增仍恰为 2 个 Markdown；基线源码行仅 `docs/.vitepress/components/demos/ui/text-demo.tsx` 被用户并发删除，非本计划所为。按外部漂移如实报告，不宣称最终门禁通过。**
- Task 4 SUMMARY 闸门：`summary bytes 7457 missing []`（退出码 0）。

## 6. 纪律声明

- **零代码改动**：未修改任何源码、测试、配置、内容、依赖；只新增两个 Markdown。
- **零提交**：未运行任何 git 写命令（`add`/`commit`/`stash`/`checkout`/`reset` 均未执行），两个 Markdown 保持未提交。
- **未更新 STATE**：未修改 `STATE.md`、`ROADMAP.md`、`REQUIREMENTS.md`、既有 `PLAN`/`SUMMARY`、前序 5 份审计文档。
- **无 UAT**：全部为静态源码审计（E1/E2/E3），未启动浏览器、未做运行期验证。
- **估算未校准**：计划 `estimate.confidence: low`，实际约 12000 tokens（按变更文件字符数/4 粗估），不作为校准依据。
- **22:00 检查**：本机账户 `13194`；执行结束时间见最终报告，若晚于 22:00 已按要求停止后续动作。
- **外部漂移**：新 HEAD `b2e9481…` → `bd4d263…`（`AGENTS.md`/`dev.md` 文档提交）；工作树另有用户并发改动（`09-42-PLAN.md`、`setting/*.ts`、`packages/common/src/logger.json`、`docs/.vitepress/components/demos/ui/text-*.tsx` 等），均未触碰。最终复核期间用户新增 4 个 docs demo `.tsx` 并删除/拆分 `text-demo.tsx`，导致严格范围门禁由 `added 2` 变为 `added 6`；本计划自身仍只新增 2 个 Markdown。

## 7. 偏差记录

1. **[规则 3 - 阻塞] 内联 `node -e` 引号复杂**：13/31 枚举与 UNC 提取改用 `%TEMP%/opencode/gsd-41-extract.js` 执行，命令逻辑与计划一致，仅载体改为临时 JS 文件。
2. **[信息] 计划文本与实测差异**：`main.js` 的 `loadList` 实测 13 项（计划写 14）；`logger.json` 错误码实测上界 2008（计划写 1–78+）；`saves.ts` 行号实测 110（研究文档写 108）。均按实测写入，未沿用旧估值。
3. **[信息] 服务端同步口径**：旧 `server.js`/`server.py` 未见 `/sync` 路由，客户端 `sync.php` 是外部 PHP 服务残留；本文件按「服务端整体 MISSING + 客户端残留 PARTIAL」记录。
4. **[信息] PAR-RT 编号**：未为每个运行时条目单独分配 `PAR-RT-###`，改以域表统计并在 `## 13.3` 汇总；不影响 13/31/UNC/25 项闸门。
5. **[规则 3 - 工具] 基线 BOM 假阳性**：`%TEMP%/gsd-09-parity-41-baseline.txt` 由 PowerShell `Set-Content -Encoding UTF8` 写出，首行带 UTF-8 BOM，导致范围闸门把基线首行误判为新增（`added 3`）。将临时基线重写为无 BOM（内容逐字不变）后，`added 2`、源码零变化；此为临时文件编码问题，不是源码/范围放宽。

## Self-Check: PASSED

- 13 插件、31 loader、音频 speed/pitch、服务端、Mota、25 项台账、UNC 汇总均已落盘并通过全部自动门禁。
- 两个 Markdown 均存在；源码/配置/前序文档零改动；零提交。
