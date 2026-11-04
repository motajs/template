---
phase: 09-minimum-browser-runnable
plan: 48
subsystem: runtime-parity-rewrite
tags: [parity, runtime, plugins, loader, audio, save, server, replay]
status: complete
requires: [09-43, 09-44, 09-45, 09-46, 09-47]
provides:
  - .planning/phases/09-minimum-browser-runnable/09-PARITY/05-RUNTIME-UNCERTAIN.md
affects: []
tech-stack:
  added: []
  patterns: [three-value-verdict, human-readable-parity-table, old-engine-sole-source]
key-files:
  created:
    - .planning/phases/09-minimum-browser-runnable/09-48-SUMMARY.md
  modified:
    - .planning/phases/09-minimum-browser-runnable/09-PARITY/05-RUNTIME-UNCERTAIN.md
decisions:
  - "旧样板是唯一清单来源，新样板只按现有接口能否简单组合来判定"
  - "判定只保留支持、部分支持、不支持三值，无法确认一律判不支持"
  - "删除九行仅新样板内容与旧的汇总表，无法确认项并入对应功能行"
  - "服务端整体判不支持，客户端 sync.php 注释残留只作部分痕迹说明"
metrics:
  duration: "约 40 分钟"
  completed: "2026-11-04"
  tasks: 5
  files: 2
actuals:
  tokens: 24000
  tasks: 5
  commits: 0
---

# Phase 09 Plan 48: 运行时与无法确认项重写 Summary

一句话：把 `09-PARITY/05-RUNTIME-UNCERTAIN.md` 重写成 93 行的人读运行时对照表，覆盖 13 个旧插件、3 个扩展、31 个 loader 方法、15 个音频能力、9 个存档能力、6 个服务端能力、4 个日志调试能力、6 个入口能力和 6 个回放控制能力。

## 0. 快照

| 项 | 值 |
| --- | --- |
| 旧样板 HEAD / 工作树 | `3efb548e407ad2b8007b498cb98401e2012a0b55` / 0 行 |
| 新样板 HEAD / 工作树 | `5af3ab378b4d65dc5cf1fbcb621fd9a776608dd7` / 164 行（含用户并发编辑） |
| 分支 | `refine/data-client` |
| 采样时间 | `2026-11-04 14:25`（UTC+8） |

工作树会持续变动；本计划只记录并只读处理，未回滚、未删除、未触碰任何用户并发改动。

## 1. 行数与统计

- 当前特性表行数：102
- 移除新引擎独有行：9
- 基线行数：93
- 新文档行数：93

三值统计：

- 支持：48
- 部分支持：21
- 不支持：24

48 + 21 + 24 = 93。
- not planned：17（§2：2、7、8、10、11、12；§3：1、2、3；§4：5；§7：2、3；§8：3；§9：2、4、5、6）；maybe：1（§4：20）

分域计数：

| 域 | 支持 | 部分支持 | 不支持 | 合计 |
| --- | --- | --- | --- | --- |
| 插件系统 | 3 | 3 | 7 | 13 |
| 扩展加载 | 0 | 1 | 2 | 3 |
| 资源加载与 loader | 23 | 6 | 2 | 31 |
| 音频、BGM 与音效 | 8 | 4 | 3 | 15 |
| 存档、存储与同步 | 5 | 3 | 1 | 9 |
| 服务端与网络 | 0 | 0 | 6 | 6 |
| 错误、日志与调试 | 1 | 0 | 3 | 4 |
| 全局入口与构建 | 2 | 1 | 3 | 6 |
| 回放播放控制 | 3 | 3 | 0 | 6 |
| 合计 | 48 | 21 | 24 | 93 |

## 2. 粒度与合并记录

- 基线 93 行由 102 行减去 9 行仅新样板内容得到：§3.2 的 5 行新样板检索结果、§5.1 的 1 行新效果器、§8 的 2 行码表与日志捕获、§9 的 1 行模块注册表。
- 扩展加载只保留 3 行（localSave、dynamicMapEditor、ui-editor），目录扫描与动态脚本机制写在小节说明中，不单独计行，避免与扩展条目重复。
- 音频保留 15 行旧能力，删除 1 行仅新样板效果器；BGM 倍速与音调相关 3 行仍判不支持。
- 服务端 6 行全部判不支持；客户端 `packages-user/client-modules/src/render/utils/saves.ts:110` 的注释态 `sync.php` 请求只作部分痕迹写进对应行，不当作服务端实现。
- 没有拆分或丢弃旧侧条目；行数核对为 13 + 3 + 31 + 15 + 9 + 6 + 4 + 6 + 6 = 93。

## 3. 判定口径落地

- 支持：现有新接口、标签或组件的简单组合，例如插件生命周期、`LoadManager`、`IBGMPlayer`、`ISoundPlayer`、`ISaveSystem`、`IReplaySandbox`、`logger.error`。
- 部分支持：核心能力存在但需适配，或只覆盖旧行为一部分，例如商店模型、自定义加载任务、自动存档栈、回放面板。
- 不支持：无等价能力或需复杂逻辑与底层调用，例如灯光合成、运行时删图、路线修正、BGM 倍速与音调、调试与竞赛模式、服务端能力。
- 无法确认的能力一律判不支持，并在差异列写明检索范围与原因；例如全局 `main` 只有声明，没有运行时创建者。

## 4. 旧汇总表去向

旧版的 27 行不确定项汇总表已删除，不再作为独立表出现。其内容按能力并入对应行：P2 的 9 条（001 至 009）、P3 的 4 条（100 至 103）与两个区间端点、P4 的 6 条（200 至 205）、P5 的 6 条（300 至 305）与两个区间端点、P6 的 4 条（400 至 403），分别在 §2 至 §10 的相关行或以小节说明承接；没有遗留只存在于旧汇总表的条目。

## 5. 门禁记录

- Task 1 基线门禁：`raw=102`，清单存在且含基线 93，通过。
- Task 2 判定门禁：`rows=93 bad=0`，通过。
- Task 3 文档门禁：`rows=93 headers=9 exact=9`，通过。
- Task 4 综合门禁：`old=156 new=80` 后输出 `RUNTIME GATES OK`，通过。旧锚点 156 个、新锚点 80 个，均不少于 40 个。
- Task 4 范围门禁：`git status` 相对基线只多出目标文档与 Summary，源码、配置、`STATE.md`、`ROADMAP.md` 范围逐行一致，目标文档哈希已变化，通过。

## 6. 范围与纪律

- 只修改目标文档并新增本 Summary；未修改 `00-INDEX.md`、`01-DATA.md`、`02-GAMEPLAY.md`、`03-RENDER.md`、`04-UI-INPUT.md`、既有计划或摘要。
- 未修改任何源码、配置、内容、`STATE.md`、`ROADMAP.md`。
- 未运行任何 git 写命令；两个 Markdown 保持未提交。
- 未启动浏览器，未做运行期验证；全部为静态源码对照。
- 本机账户为 `13194`；完成时间见最终报告，未晚于 22:00。

## Self-Check: PASSED

- 目标文档 93 行、九张六列表、三值判定齐全。
- Summary 存在，旧 102 行减 9 行后 93 行，三值 48/21/24 统计，相加等于 93。

- **插件判定**：4 改为支持（楼层激活/未激活状态等价）；2、7、8、10、11、12 标为 not planned。
- **服务端判定**：§7 的 1、4 改由 Vite 与外部编辑器/ToolKit 实现，判支持；2、3 标为 not planned。