---
quick_id: 260921-lwa
slug: pnpm-12-5-1
date: 2026-09-21
status: complete
tags: [toolchain, pnpm, node]
---

# Quick Task 260921-lwa: 升级到 pnpm 12.5.1 + Node 24

## Objective

把项目工具链从 pnpm 10 时代对齐到本机的 pnpm 12.5.1，并把 Node 运行时要求提升到 24，
使工作区配置、锁文件、脚本与文档不再产生兼容性告警。

## Scope

- `pnpm-workspace.yaml`、`package.json`、`pnpm-lock.yaml`
- `.nvmrc`（新增）
- `dev.md`、`.planning/PROJECT.md`

## Tasks

1. **Node 24 + pnpm 12.5.1 工具链** — `nvm install 24.21.0`、`nvm use 24.21.0`；
   在 node 24 下安装 `pnpm@12.5.1`（原 pnpm 是 node 22 下的全局包，切换后需重装）；
   新增 `.nvmrc` 固定 `24.21.0`。

2. **工作区配置迁移 + 锁文件重建** — 删除 `pnpm-workspace.yaml` 中被 pnpm 12 判为未识别的
   `ignore` 字段，改用 `packages` 的 `!` 排除模式；根 `package.json` 增加
   `packageManager: pnpm@12.5.1` 与 `engines`；以 pnpm 12.5.1 重建 `pnpm-lock.yaml`；
   若 `strictDepBuilds` 拦截未批准的构建脚本则补齐 `allowBuilds`。

3. **文档对齐** — `dev.md` 的 pnpm / node 版本要求；`.planning/PROJECT.md` 的 Context 技术栈描述。

## must_haves

- [ ] `node -v` = `v24.21.0`，`pnpm -v` = `12.5.1`（在 node 24 下）
- [ ] `pnpm --version` 不再报告未识别的工作区设置
- [ ] `pnpm i --frozen-lockfile` 通过
- [ ] 仓库内无残留的 pnpm 10 / Node 20/22 开发要求描述

## Out of scope

- `.github/workflows/page.yml`（用户自行修改）
- `@types/node` 版本升级（用户确认暂不动）
- 重构期既有的类型错误与测试失败（用户确认忽略）
