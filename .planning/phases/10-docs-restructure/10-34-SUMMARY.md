---
phase: 10-docs-restructure
plan: 34
subsystem: docs
tags: [vitepress, markdown, advanced-iii, loading, loader, extension-points]

requires:
    - phase: 10-docs-restructure
      provides: 10-33 已完成 docs/advanced 目录重组，高级 I / II 位于 i/ 与 ii/，III 侧边栏为空
provides:
    - docs/advanced/iii/loading-system.md：数据端加载系统的模型、阶段、配置与三类扩展点
    - 全文唯一的渲染端内容，限定在「渲染端如何消费加载进度」接口级小节
affects: [10-39 侧边栏注册与互链, 10-40 读者审阅]

actuals:
    tokens: 3829
    tasks: 3
    commits: 2
    plan_head_before: b4083fb9ce0140343c28f344bec4d8001d15202b

tech-stack:
    added: []
    patterns:
        - 系统类页面先讲模型再讲接口（D-82）：LoadTask → LoadManager → MotaDataLoader 三层，ILoadTaskStarter 作为环境适配点
        - 使用与自定义各半（D-77）：主干讲阶段顺序与配置约定，扩展点集中讲「加配置 / 加资源 / 换环境」
        - 边界与特殊情况统一放文末「边界与注意」（D-61）
        - 代码块给完整类 / 函数上下文并带解释性注释（D-62 / D-65 / D-70）
        - 渲染端内容只做接口级消费，不写场景、UI 生命周期与 ClientCore 初始化顺序

key-files:
    created:
        - docs/advanced/iii/loading-system.md
        - .planning/phases/10-docs-restructure/10-34-SUMMARY.md
    modified: []

key-decisions:
    - Task 0 的汇报关卡已由用户预批准满足：用户明确表示「这些都是文档编写工作，不涉及代码本身，直接批准执行 10-33 至 10-37」，本计划据此继续，未再单独等待「可以执行」
    - 页面按「模型 → 阶段 → 配置 → 三个扩展点 → 进度 → 渲染端接口小节 → 边界」组织；渲染端内容不单独成页
    - 不写 getTotalByte 的总字节语义、不承诺 loading / dataLoaded 只加载一次、不写重复配置 id 的稳定告警（D-72）
    - 自定义任务示例显式按 DEV / 构建后分别给出地址，因为自行构造的 LoadTask 地址不会被加载器改写
    - 本地数据包只作为 ILoadTaskStarter 的设计能力一句话说明，不给实现代码
    - 未在 docs/.vitepress/config.ts 注册本页，也未链接尚不存在的 III 页面；留给 10-39

patterns-established:
    - 高级 III 页面的结构：系统模型 → 阶段 / 关键接口 → 扩展点 → 进度等观察量 → 接口级渲染端小节 → 边界
    - 页面内至少保留一条 ../i/ 或 ../ii/ 链接与一条 ../../intermediate/ 链接，用于把读者接回既有教程

requirements-completed: []

coverage:
    - id: D1
      description: 加载三层模型、六段阶段顺序与 CoreState.load 的插件时机包裹关系写清
      verification:
          - kind: other
            ref: '10-34-PLAN.md Task 1 自动门禁 PAGE-OK；人工对照 packages/loader/src/* 与 packages-user/data-state/src/loader/*'
            status: pass
      human_judgment: false
    - id: D2
      description: 三类扩展点各有完整代码块，渲染端内容限定在接口级小节，边界集中在文末
      verification:
          - kind: other
            ref: '10-34-PLAN.md Task 1 自动门禁 PAGE-OK；构建产物 h1=1、language-ts=3、language-text=3、table=3'
            status: pass
      human_judgment: false
    - id: D3
      description: prettier --check 通过，构建 build complete 且无 dead link
      verification:
          - kind: other
            ref: 'prettier --check 通过；cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build" 输出 build complete in 19.32s，无 dead link'
            status: pass
      human_judgment: false

duration: 约 10 分钟
completed: 2026-10-26
status: complete
---

# Phase 10 Plan 34: 加载系统原理页 Summary

**写出高级 III 第一篇数据端原理页：以 `LoadTask` → `LoadManager` → `MotaDataLoader` 三层模型开场，讲清六段加载顺序与配置约定，再给出「加配置 / 加资源 / 换环境」三类扩展点；渲染端只保留接口级消费小节，边界统一收口到文末。**

## Performance

- **Duration:** 约 10 分钟
- **Started:** 2026-10-26T20:46:36Z
- **Completed:** 2026-10-26
- **Tasks:** 3/3（Task 0 由用户预批准满足；Task 1 / Task 2 已执行）
- **Files created:** 2（页面 + 本 SUMMARY）

## Accomplishments

- 新建 `docs/advanced/iii/loading-system.md`，单 H1《加载系统》，246 行。
- 主体结构为：`系统模型` → `一次加载的阶段` → `配置文件与处理器` → `扩展点：加一份配置` → `扩展点：加一种资源` → `扩展点：换一个加载环境` → `进度` → `渲染端如何消费加载进度` → `边界与注意`。
- 系统模型讲清三层职责与 `ILoadTaskStarter` 的环境适配点；阶段小节给出「核心配置 → onCoreConfigLoaded → 额外配置 → onExtraConfigLoaded → 自定义任务 → 完成」，并说明 `CoreState.load()` 把插件 `initialize` 放在 `loader.start()` 之前、`afterLoad` 放在之后。
- 配置小节讲清 JSONC 前缀切分、前缀缺失 / JSON 解析失败的表现为空对象、`addCoreConfig` 与 `addExtraConfig` 的差异、额外配置 URL 相对内容目录，以及加载器统一处理 DEV / 构建路径。
- 三类扩展点均给出完整类或函数上下文并带解释性注释：插件 `initialize` 中 `addExtraConfig`；`LoadTask` + processor + starter + `addCustomTask`；实现 `ILoadTaskStarter` 的 `BaseURLLoadStarter`。
- 渲染端小节只保留接口级消费：`RenderLoaderHooks` 追加渲染侧配置，加载场景迭代同一个 `loader.start()` 并从 `loader.manager` 读计数。
- 文末「边界与注意」覆盖：配置 id 去重、`addCustomTask` 调用时机、前缀缺失 / 解析失败、自定义任务路径、starter 返回契约、自定义任务必须设置 starter、字节进度在总量未知时可能不准、`start()` 必须被迭代。

## Fact Verification

正文事实按当前源码复核，research 的行号未直接搬入页面：

- `packages/loader/src/task.ts`、`manager.ts`、`types.ts`、`starter.ts`：`LoadTask<T,R>`、`LoadManager`、`ILoadTaskStarter` / `IResponseLike`、`LoadDataType` 五值、`WebLoadStarter`。
- `packages-user/data-state/src/loader/loader.ts`、`types.ts`、`jsoncProcessor.ts`：`addCoreConfig` / `addExtraConfig` / `addCustomTask` / `getConfig`、六段顺序、`PrefixedJSONCProcessor` 的前缀与 66 / 67 错误处理、额外配置 URL 相对内容目录。
- `packages-user/data-state/src/core.ts`：`CoreState.load()` 的 `initialize` → `loader.start()` → `afterLoad`。
- `src/data/loader/hook.ts`：`DefaultDataLoaderHook` 从核心配置追加 `enemy` / `item` / `map-list` / `tile` 等额外配置。
- `packages-user/client-modules/src/loader/hook.ts`：`RenderLoaderHooks` 追加贴图 / 音频 / 动画 / 字体配置。
- `src/client/entry.ts`、`src/client/ui/load.tsx`、`packages-user/client-modules/src/client.ts`：渲染端复用数据端配置、追加 `client` 核心配置、加载场景迭代 `loader.start()` 并读取 manager 计数。
- 与 research 的模型与接口描述一致；执行中发现的注释 / 实现与 research 描述不一致的疑点，已只在对话报告，未写入正文（D-72）。

## Deliberately Not Written

- `getTotalByte` 的「总字节」语义；正文只描述已加载字节、任务数与比例。
- 「`loading` / `dataLoaded` 守卫只加载一次」的承诺。
- 重复配置 id 的稳定告警码；只写「同一 id 只登记一份配置」。
- File System Access API / 本地数据包的实现代码；只说明 `ILoadTaskStarter` 支持这种设计能力。
- 渲染场景结构、UI 生命周期、`ClientCore` 初始化顺序；也因而全文没有出现 `src/client`。
- 源码行号、源码叙述、「模板」与「[需改]」标记（D-80 / D-83）。

## Gates

- `node node_modules/prettier/bin/prettier.cjs --check docs/advanced/iii/loading-system.md`：通过（All matched files use Prettier code style）。
- 结构门禁：CRLF、单 H1、九个主体小节齐备、`src/client` 未出现、无模板标记、相对 `.md` 链接目标全部存在。
- 构建门禁：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`，退出码 0，输出 `build complete in 19.32s`，无 `dead link`。
- 渲染抽查：构建产物 `public/_docs/advanced/iii/loading-system.html` 中页面 H1 = 1、TS 代码块 = 3、text 代码块 = 3、表格 = 3，标题层级与代码高亮正常。

## Handoff to 10-39

- 本页尚未注册进 `docs/.vitepress/config.ts` 的「高级 III · 原理与架构」分组（`items: []`），也未链接尚未存在的 III 导览或其它 III 页面。
- 10-39 需要：注册本页到侧边栏、替换 `docs/advanced/index.md` 与 `docs/advanced/ii/index.md` 中「高级 III 尚未编写」的占位，并在 III 导览中把本页列入阅读路径。

## Deviations from Plan

None - 计划按既定任务执行；Task 0 的汇报关卡由用户预批准满足，已记录在 `key-decisions`。

## Issues Encountered

- 工作区存在与本计划无关的既有改动（`packages-user/client-base/*`、`.planning/phases/09-*`、`packages-user/client-base/src/map/__test__/`），所有提交均只暂存本计划文件。

## Self-Check: PASSED

- 文件存在：`docs/advanced/iii/loading-system.md`、`.planning/phases/10-docs-restructure/10-34-SUMMARY.md`
- 提交存在：`16b91af`（Task 1）、本 SUMMARY 的 Task 2 提交
- 门禁存在：prettier `--check` 通过、`build complete in 19.32s`、无 dead link、`PAGE-OK`
