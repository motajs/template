---
quick_id: 260921-lwa
slug: pnpm-12-5-1
date: 2026-09-21
status: complete
completed: 2026-09-21
tags: [toolchain, pnpm, node]
key-decisions:
  - "pnpm 版本锁定用 packageManager 精确值 pnpm@12.5.1（corepack 及通用工具可识别）"
  - "pnpm-workspace.yaml 的 ignore 用 packages 的 ! 排除模式替代，不再使用未识别字段"
  - "Node 运行时要求提升到 ^24，本机安装 24.21.0"
  - "包管理器版本锁定较老（packageManager 为 12.5.1）时，pnpm 12 会把它记入 lockfile 的 packageManagerDependencies，属预期行为"
key-files:
  created:
    - .nvmrc
  modified:
    - package.json
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - dev.md
    - .planning/PROJECT.md
    - .planning/codebase/STACK.md
commits:
  - 1dd3ad4 chore(toolchain): pin pnpm 12.5.1 and require Node 24
  - d09dc3b docs(toolchain): update pnpm 12 / Node 24 requirements
---

# Quick Task 260921-lwa Summary

**工具链对齐到 pnpm 12.5.1 + Node 24：工作区未识别字段清除、锁文件重建、pnpm 版本锁定、开发环境文档同步**

## Performance

- **Completed:** 2026-09-21
- **Commits:** `1dd3ad4`、`d09dc3b`

## Accomplishments

- 安装并切换到 Node `v24.21.0`（nvm），新增 `.nvmrc` 固定该版本。
- 在 Node 24 下重装 `pnpm@12.5.1`（原 pnpm 是 Node 22 下的全局包，切版本后会丢失）。
- 删除 `pnpm-workspace.yaml` 中被 pnpm 12 判为未识别的 `ignore` 字段，改用官方支持的
  `packages` 排除模式 `!packages/**/dist` 等，`pnpm --version` 不再有告警。
- 根 `package.json` 增加 `packageManager: "pnpm@12.5.1"` 与
  `engines: { node: ">=24.0.0", pnpm: ">=12.0.0" }`。
- 以 pnpm 12.5.1 重建 `pnpm-lock.yaml`；`pnpm install --frozen-lockfile` 通过
  （24 个 workspace project，0 变更）。
- `dev.md` 环境要求更新为 `node.js ^24.0.0` / `pnpm >= 12.0.0`；`PROJECT.md` 技术栈
  描述由 pnpm 10 改为 pnpm 12。

## Files Created/Modified

- `.nvmrc`（新增）— `24.21.0`
- `package.json` — `packageManager` + `engines`
- `pnpm-workspace.yaml` — `ignore` → `packages` 的 `!` 排除项
- `pnpm-lock.yaml` — pnpm 12.5.1 重建
- `dev.md`、`.planning/PROJECT.md`、`.planning/codebase/STACK.md` — 版本要求同步

## Decisions Made

- 版本锁定采用 `packageManager` 精确值（生态标准，corepack / 其他工具可读）。
- `ignore` 的语义（把目录排除出 monorepo）由 `packages` 的否定 glob 承接，这是 pnpm 12
  唯一受支持的等价机制。
- `@types/node` 保持在 `^22`（用户确认：类型暂不动，未使用新特性）。

## Deviations from Plan

### Auto-fixed Issues

无。

### 计划外但相关的调整

**1. 同步 `.planning/codebase/STACK.md` 的版本行**
- 该文件两处版本描述直接引用了 `dev.md`（`per dev.md`），不改会与本次改动互相矛盾。
- 仅更新版本号，未触碰文件中既有的其它陈旧内容（如 `onlyBuiltDependencies` 列表），
  后者非本次改动引起。

**2. 锁文件新增 env lockfile 文档（预期行为，非缺陷）**
- 因声明了 `packageManager: pnpm@12.5.1`，pnpm 12 按文档在 `pnpm-lock.yaml` 顶部额外写入
  一个 env lockfile 文档（`configDependencies` / `packageManagerDependencies` 及
  `@pnpm/exe.*` 平台包）。这是 pnpm 12 对 pnpm 12+ 精确 pin 的默认行为；`pmOnFail: ignore`
  可关闭，但会同时放弃版本校验，故保留默认。

**总偏差：** 0 处阻塞性偏差。

## Issues Encountered

- `nvm-windows` 1.1.10 的 `nvm use`（无参数）不读取 `.nvmrc`，仍报 “A version argument is
  required”。`.nvmrc` 作为版本声明保留；本机切换仍需显式 `nvm use 24.21.0`。
- Node 24 下的 pnpm 需重装：切换 node 版本后，原先位于 Node 22 的全局 `pnpm` 不再可见，
  已用 `npm i -g pnpm@12.5.1` 补齐。

## Verification

- `node -v` = `v24.21.0`；`pnpm -v` = `12.5.1`（无未识别设置告警）
- `pnpm install --frozen-lockfile` → `Lockfile is up to date, resolution step is skipped`
- 残留版本描述检索：除 `pnpm-lock.yaml` 中第三方依赖的 `engines` 声明外，无 pnpm 10 /
  Node 20/22 的开发要求残留
- 仅记录、不作门禁（用户确认重构期忽略）：
  - `pnpm lint:packages` → 145 errors / 66 warnings（既有 prettier/`implements` 换行问题，
    本次未改动任何源码，与本次变更无关）
  - `pnpm lint:user` → 11 errors / 11 warnings（同上）
  - `pnpm test:ci` → 38 failed / 28 passed files；180 failed / 356 passed / 132 skipped
    （用户并发重构数据端所致，STATE.md 已记录暂缓处理）
  - `pnpm check:type` → 180 条 TS 诊断（同上，重构期既有）

## Follow-ups

- `.github/workflows/page.yml` 仍固定 `pnpm@7.27.0` 并调用不存在的 `pnpm build`；用户明确
  自行修改，本次未动。
- `.planning/codebase/STACK.md` 第 25 行的 `onlyBuiltDependencies` 列表与实际 `allowBuilds`
  不一致，属既有陈旧内容，未经用户确认，未改动。

---

*Quick task: 260921-lwa*
*Completed: 2026-09-21*
