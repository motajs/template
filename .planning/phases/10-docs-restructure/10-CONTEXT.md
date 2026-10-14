# Phase 10: 文档重构 - Context

**Gathered:** 2026-10-14
**Status:** Discussion only — 待引擎整体完工后再规划/执行

<domain>
## Phase Boundary

重构过老、结构不佳、新人理解难度过高的项目文档。面向多背景读者（完全新手 / 不懂代码的作者 / 有基础的作者 / AI Agent）提供分层指南，并专门为 AI Agent 编写参考文档。

**执行时机（本阶段关键）：** 本阶段当前**只记录讨论共识，不规划、不执行**。引擎仍在收尾、部分内容（编辑器、部分重构）尚未完工，文档尚不具备编写条件；待引擎整体完工后再进入 Plan → Execute → Verify。

文档分为六大部分：

1. **总览**：如何正确地看文档、查文档；不同背景的作者应如何阅读；AI Agent 应如何阅读。
2. **初级文档**：面向完全新手，**不含任何代码**，教学编辑器基本操作，并提供一些**仅使用编辑器的非代码编辑功能**即可实现的效果。因编辑器尚未实装，**待编辑器实装后再规划**。
3. **中级教程**：面向读完初级文档的作者及有一定经验的作者，讲解**必须使用代码**才能完成的内容，简单讲解顶层接口的使用，**不深挖底层逻辑**。读完本部分，作者理应能完成绝大多数需求。
4. **高级教程**：面向有高度定制需求、以及需要理解底层逻辑的作者，**系统讲解引擎的设计理念**。**待引擎整体完工后再规划**。
5. **API 参考**：列出引擎的所有 API 接口并给出解释，**重点接口详细解释**。
6. **Agent 参考**：面向 AI Agent，包含引擎快速总览、需求接口定位、游戏数值设计、游戏地图设计等参考文档。

</domain>

<decisions>
## Implementation Decisions

### 载体与整体形式

- **D-01:** 文档载体沿用现有 **VitePress** 站点（`docs/.vitepress/`）；**不要求**脱离 VitePress 的纯 markdown 兼容，按 VitePress 语法书写即可（`:::info`、`mermaid` 等可用）。
- **D-02:** 六大块各建**独立文件夹**，命名已获用户批准：
  - `docs/overview`（总览）
  - `docs/beginner`（初级文档）
  - `docs/intermediate`（中级教程）
  - `docs/advanced`（高级教程）
  - `docs/api`（API 参考，已存在）
  - `docs/agent`（Agent 参考）
  - 按 `dev.md`，目录 / 文件名一律使用连字符英文命名。

### API 参考（第 5 部分）

- **D-03:** 继续按包生成 API 列表（保留 `docs/api/` 现有生成机制），但**正文讲解由人手写**，不是自动生成；对**重点接口额外详细讲解**。

### 旧内容处置

- **D-04:** 现有旧文档内容**全部删除、重写**，不保留——旧接口设计与当前实现差距较大。范围包括 `docs/guide/*`、`docs/dev/*`、`docs/logger/*` 等既有旧内容。

### 范围界定

- **D-05:** API 参考**不含 legacy 包**（`@motajs/legacy-*`、`@user/legacy-*`、`@user/data-fallback`）——这部分尚未重构完。
- **D-06:** **初级文档**本期不规划，待**编辑器实装后**再规划；具体范围后续另行说明。
- **D-07:** **高级教程**本期不规划，待**引擎整体完工后**再规划。
- **D-08:** **Agent 参考**放 `docs/agent`，具体内容后续再讨论。

### 验收与流程

- **D-09:** 验收标准 = **用户人工审阅** + **链接全部有效** + **构建通过**。
- **D-10:** 本阶段当前**仅讨论**；待引擎整体完工后再进入 GSD 的 Plan → Execute → Verify。

</decisions>

<specifics>
## Specific Ideas

- 用户原话（目标）：「现在的项目使用文档过老，而且文档编写的结构也不够好，对于新人来说理解难度过高……目标是能让新人、不怎么懂代码的作者、有一定基础的作者等各种背景的作者都能获取到合理的指南，并且专门为 AI Agent 编写文档，让 Agent 有文档参考。」
- 用户原话（时机）：「目前来看，文档可能还无法开始编写，因此本阶段先进行大致的讨论，待引擎整体完工后再进行规划执行。」

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 项目与阶段定义
- `.planning/PROJECT.md` — 项目核心价值与项目级决策
- `.planning/ROADMAP.md` — Phase 10 目标与依赖（Depends on: Phase 9）
- `.planning/REQUIREMENTS.md` — 需求基线
- `dev.md` — 项目开发规范（命名、流程、约束）
- `AGENTS.md` — AI 行为约束（执行前须获批、命名须先反馈等）

### 文档站点现状（重构对象）
- `docs/index.md` — VitePress 首页（hero / features）
- `docs/.vitepress/config.ts`、`docs/.vitepress/api.ts`、`docs/.vitepress/init.ts` — 站点配置与 API 构建
- `docs/api/index.md` — 按包 API 列表（现含 legacy 包，本阶段将排除）
- `docs/guide/*`、`docs/dev/*`、`docs/logger/*` — 待删除重写的旧内容

</canonical_refs>

<code_context>
## Existing Code Insights

### 文档站点结构（已核实）
- VitePress 站点位于 `docs/`，配置在 `docs/.vitepress/`。
- `docs/api/` 按包生成（`motajs-*` / `user-*` 各一目录 + `index.md` 列表）。
- `docs/guide/` 为面向作者的使用指南（quick-start、coding、diff、audio、system、implements、ui）。
- `docs/dev/` 为引擎接口设计文档（如 `template.md` 的「需求综述 → 需求理解 → 接口设计分析 → 实现思路」方法论）。
- `docs/logger/` 为 logger 相关文档。

### 相关约定
- `dev.md`：Markdown 文档文件名使用连字符命名法。

</code_context>

<deferred>
## Deferred Ideas

- **初级文档**（第 2 部分）完整范围与内容 —— 待编辑器实装后再规划。
- **高级教程**（第 4 部分）完整范围与内容 —— 待引擎整体完工后再规划。
- **中级教程**（第 3 部分）范围细化与具体篇章。
- **Agent 参考**（第 6 部分）——「游戏数值设计、游戏地图设计」的具体内涵与内容来源。
- 各部分内部的具体文件命名与篇章划分。
- 旧内容删除的具体时机与清单核对。

</deferred>

---

*Phase: 10-docs-restructure*
*Context gathered: 2026-10-14*
