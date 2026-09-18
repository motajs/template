# 渲染端 ↔ 数据端接口对账审计

**日期:** 2026-09-18
**范围:** 被查对象 `packages-user/client-base` + `packages-user/client-modules`；`packages-user/data-{common,base,system,state}` 仅作接口基准（D-03/D-04）
**性质:** 只读清点，未修改任何代码（D-02）
**接口基准:** 各数据端包的 `types.ts` / `core.ts` / `ins.ts` 现行签名（D-04/D-05）

## 背景

本文件是 Phase 4 第一步（增量规划，D-01/D-02）的交付物：对渲染端与数据端做**只读接口对账**，清点所有「渲染端实现 ↔ 数据端现行接口」不匹配项，供用户决定阶段 4 剩余工作（适配实施 + 移动端/桌面端双布局，REND-01/REND-02）如何拆分。

本步**只清点、不改代码**。被查对象限 `client-base` 与 `client-modules`（D-03）；`data-common` / `data-base` / `data-system` / `data-state` 只作接口基准（D-04）。对账以**接口签名为准**，不受用户并行修改数据端**实现**的影响（D-05）。

## 方法

- **枚举面（A1..A7）**：A1 渲染契约桥、A2 组合根/单例、A3 legacy 全局 `core.*` 读取、A4 新数据层接口调用、A5 数据端类型直连、A6 双布局既有资产、A7 加载/素材接线。
- **判定口径**：每条 `core.*` 读取先判「读的是数据端状态」还是「渲染侧素材/全局」；数据端状态 → ① 错配或 ③ 多余旧路径，纯渲染侧素材/全局 → 「判定为『匹配』的同类边界」。不因出现 `core.` 就一律登记。
- **分类固定三选一**（D-06）：① 错配 `#04-01-M-N`、② 数据端缺失 `#04-01-G-N`（独立成节，D-08）、③ 多余旧路径 `#04-01-L-N`。一条记录只归一类，跨类拆条。
- **证据纪律**：每条含 `接口名 + 所属文件:行 + 分类 + 问题描述 + 影响 + 置信 + 依据`（D-07）；`#04-01-M-*` 的「依据」列引用数据端基准文件；静态阅读不能定论者进「未能从阅读确定（未猜测）」，不写成缺陷。
- **只读约束**：本 run 唯一允许写出的文件是本审计文档；允许只读子代理扫描（D-09），但子代理仅回传文本、不得写文件。
- **扫描前基线**：执行 `git status --porcelain -- packages-user/client-base packages-user/client-modules`，输出为空（被查两包无任何工作树改动）。

## 发现

列序固定：`ID | 接口名 | 所属文件:行 | 分类 | 问题描述 | 影响 | 置信 | 依据`。本节只登记 ① 错配与 ③ 多余旧路径；② 数据端缺失见下一独立节。

| ID | 接口名 | 所属文件:行 | 分类 | 问题描述 | 影响 | 置信 | 依据 |
|----|--------|-------------|------|----------|------|------|------|
| #04-01-M-01 | `HeroMover` / `IMoveController`（`@user/data-state`） | packages-user/client-modules/src/action/move.ts:4（使用 `:19,:29,:33`） | ① 错配 | import 带 `// @ts-expect-error 需要重构`（`move.ts:3`）。`data-state` 未导出这两个符号：`HeroMover` 实际导出在 `@user/data-base`，`IMoveController` 数据端名为 `IMoverController`（拼写 Mover），属渲染端需局部重构采用新接口 | `HeroKeyMover` 全类无法编译；按键移动模块需改 import 源与类型名 | 高 | packages-user/data-base/src/hero/mover.ts:22；packages-user/data-common/src/common/mover.ts:142；packages-user/data-state/src/index.ts:1-9（无该导出） |
| #04-01-L-01 | `core.status.*` / `core.itemCount()` / `core.status.replay` / `core.isReplaying()` | packages-user/client-modules/src/render/ui/main.tsx:99,103,114-120,124,127-128 | ③ 多余旧路径 | 同一文件 `:100-101,121-123,134` 已改用新接口 `client.flags.getFieldValueDefaults(...)`，但状态栏其余字段与回放态仍读 legacy 全局 `core.*`，新旧双路径并存 | 状态栏数值/回放状态读取仍走旧路径，未接新数据层接口 | 高 | packages-user/data-base/src/types.ts:21（IStateBase.hero）；packages-user/data-base/src/hero/types.ts:310（floorId）；packages-user/data-common/src/replay/types.ts:375（IReplaySystem.replaying） |

## ② 数据端缺失接口

本节登记「渲染端需要而数据端未提供」且**经阅读确认**的接口。凡不能确认的候选一律不登记为缺失项，转入「未能从阅读确定（未猜测）」。

本步未确认数据端缺失接口。

**②节结论：** 本步未确认数据端缺失接口；相关不确定项见「未能从阅读确定（未猜测）」

## 触发序列（举例）

**#04-01-M-01：** `HeroKeyMover` 构造期 import `{ HeroMover, IMoveController } from '@user/data-state'`（编译期即带 `// @ts-expect-error 需要重构`）→ 因其按旧概念「移动控制器」声明 `controller?: IMoveController`、`mover: HeroMover` → 数据端实际只在 `@user/data-base` 提供 `HeroMover`（`data-base/src/hero/mover.ts:22`）、把控制器命名为 `IMoverController`（`data-common/src/common/mover.ts:142`）→ 该模块无法按新接口接线，需局部重构为 `IHeroMover` / `IMoverController`。

## 判定为「匹配」的同类边界

- **渲染侧素材族（`core.material.*` / `core.materials` / `core.icons.*` / `core.tilesets`）**：这些读取的是渲染端自己的素材/纹理资产，不是数据端状态，因此不算数据端错配。判据：其值由渲染端 `client-base/src/material/**` 与加载器写入（如 `client-base/src/load/loader.ts:103,129,151,167` 写 `core.material.images.*`、`:284,418` 读 `core.materials`），数据端 `types.ts` 中并无对应状态字段。典型命中：`render/elements/cache.ts`、`render/elements/misc.ts`、`render/components/misc.tsx`、`render/weather/presets/{cloud,fog,sun}.ts`、`fallback/load.ts:55-56`。
- **A4 新接口用法**：`hook` 订阅（`render/index.tsx:4,37-40`）、`loading` 生命周期（`client-modules/src/index.ts:1`、`client.ts:43`）、`state` 单例（`render/map/extension/hero.ts:21,225`）均命中数据端现行接口，属已走新接口。

## 未能从阅读确定（未猜测）

1. **② 节是否有缺失项**：本步未确认任何数据端缺失接口，但存在若干候选（如游戏工程元数据 `core.firstData.*`、勇士渲染粒度钩子），其「应由数据端补充」还是「由渲染端改接既有数据对象」无法仅凭静态阅读判定，故不登记为 ②，见 Task 3 定稿段。

## 处置

- **本步性质**：只读清点，**无任何生产代码改动**；被查两包 `client-base` / `client-modules` 保持零改动。
- **后续拆分**：实际适配实施与移动端/桌面端双布局**未在本 run 规划**，由用户在对账结果出来后决定如何拆分（D-01/D-02）。REND-01（渲染端适配新数据层接口）与 REND-02（双布局）的验收边界尚未提供，需用户在规划实施前补齐。
- **双布局既有资产（仅登记为后续起点，不展开实施）**：
  - packages-user/client-modules/src/render/use.ts:22-66 —— `Orientation`（Landscape/Portrait）枚举、`OrientationHook`、`checkOrientation()`（`window.innerWidth >= window.innerHeight`）与 `onOrientationChange()`；当前在 `client-modules` 内无消费点。
  - packages-user/client-modules/src/shared.ts:33-105 —— `MAP_BLOCK_WIDTH`/`MAP_BLOCK_HEIGHT`（13×13）、`MAP_WIDTH`/`MAP_HEIGHT`、`STATUS_BAR_WIDTH`、`MAIN_WIDTH`/`MAIN_HEIGHT` 等布局常量；现为「单一横屏 + 最多双状态栏」的静态常量，与 `Orientation` 判定尚未接线。
