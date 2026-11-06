---
phase: 09-minimum-browser-runnable
plan: 22
subsystem: build
tags: [vite, rollup, typescript-ast, decorators, jsonc, content-filter, build-pipeline]

# Dependency graph
requires:
  - phase: 09-minimum-browser-runnable
    provides: 09-21 的构建重构（`dataIsolationPlugin`、content 镜像、`buildGame` 编排）
provides:
  - "script/build-plugin.ts：`removeReplayDecorators` / `replayDecoratorPlugin`（AST 切片删除录像装饰器）"
  - "script/build-game.ts：`buildClient` 与 `buildData` 双端注入录像装饰器删除插件"
  - "script/build-resource.ts：按 `.list.jsonc` 过滤 content 素材（根目录与 `defaults/` 豁免）"
  - "script/__test__/：插件与 content 行为测试（旧 `script/build-plugin.test.ts` 已移动）"
affects: [09-minimum-browser-runnable, build:game 产物布局, dist/content 素材集合]

# Actuals
actuals:
  tokens: 7900
  tasks: 2
  commits: 0
  plan_head_before: 9d291a6f80764a995e376aee6e8f583874433ee1

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "装饰器删除：TypeScript AST（`ts.canHaveDecorators` / `ts.getDecorators`）取节点范围后按起点降序切片"
    - "content 清单过滤：`minifyJSONC` 去整行注释 + `JSON.parse` + 递归收集全部字符串值"
    - "测试：真实 `vite.build()` 的带插件 / 不带插件对照，防止 `not.toContain` 空断言"

key-files:
  created:
    - script/__test__/build-plugin.test.ts
    - script/__test__/build-resource.test.ts
  modified:
    - script/build-plugin.ts
    - script/build-game.ts
    - script/build-resource.ts
  deleted:
    - script/build-plugin.test.ts（移动为 `script/__test__/build-plugin.test.ts`）

key-decisions:
  - "装饰器删除用 TypeScript AST 精确切片，不用正则扫描；字符串与注释中的同名文本不受影响"
  - "录像装饰器在数据端与渲染端都删除（`buildData` + `buildClient` 各注入一次），不手动删 import"
  - "插件固定 `enforce: 'pre'` + `apply: 'build'`，开发服务（`pnpm dev`）行为不变"
  - "content：根目录经 `isRoot` 显式跳过过滤，`defaults/` 全量，其余子文件夹按各自 `.list.jsonc` 取舍"
  - "清单只按「完整文件名」或「去扩展名主文件名」两种精确方式匹配；`.list.jsonc` 自身始终压缩输出"
  - "测试文件统一放到 `script/__test__/`，旧 `script/build-plugin.test.ts` 不保留"

patterns-established:
  - "构建脚本行为用临时 fixture + 真实 `vite.build()` 验证，结构门禁只断言值标记与导出形态"
  - "既有 jsDoc 零丢失门禁与仓库外 Task 0 基线比对，不依赖 git 提交时序"

requirements-completed: []
duration: 12min
completed: 2026-10-21
status: complete
---

# Phase 09 Plan 22: 任务 11 后续修复 —— content 清单过滤与录像装饰器删除 Summary

**content 构建改为按 `.list.jsonc` 只保留被引用素材（根目录与 `defaults/` 始终全量、清单自身压缩输出），并在数据端与渲染端构建时用 TypeScript AST 精确删除全部 `@shouldReplay` / `@ignoreReplay` 装饰器应用（不手删 import、不影响 `pnpm dev`）；两套测试共 20 个用例通过，结构门禁、注释基线门禁、真实清单覆盖率与 eslint 全绿**

## Performance

- **Duration:** 约 12 分钟
- **Completed:** 2026-10-21
- **Tasks:** 2（Task 0 汇报关卡已由用户「可以执行」闭环，不在本次执行内重复）
- **Files:** 新增 2、修改 3、移动 1（旧路径删除）

## 任务执行结果

| Task | 内容 | 结果 |
| ---- | ---- | ---- |
| Task 1 | `removeReplayDecorators` / `replayDecoratorPlugin` + `build-game` 双端注入 + 插件测试移动并扩展 | 完成，11/11 用例通过 |
| Task 2 | content 清单过滤 + `build-resource` 行为测试 + 本 SUMMARY | 完成，9/9 用例通过与全部门禁通过 |

## What Was Built

### 录像装饰器删除插件（`script/build-plugin.ts`）

- 新增不导出常量：`REPLAY_DECORATORS`（`['shouldReplay', 'ignoreReplay']`）、`SCRIPT_EXTENSIONS`（`['.ts', '.tsx']`）、`NODE_MODULES_SEGMENT`（`/[/\\]node_modules[/\\]/`）。
- `removeReplayDecorators(code, fileName)`：用 `ts.createSourceFile` 建 AST，以显式栈遍历全部节点；对 `ts.canHaveDecorators(node)` 的节点取 `ts.getDecorators(node)`，仅当装饰器表达式是目标标识符或「callee 为目标标识符的调用表达式」时记录 `[getStart, getEnd]`，按起点降序切片删除；无命中时原样返回输入文本。
- `replayDecoratorPlugin()`：`name: 'mota-replay-decorator'`、`enforce: 'pre'`、`apply: 'build'`；`transform` 先剥离 `?` 查询串，命中 `node_modules` 或非 `.ts` / `.tsx` 返回 `null`，代码未变化也返回 `null`。
- 既有 `dataIsolationPlugin` / `SPECIFIER_BANS` / `PATH_BANS` / `findBan` 行为与注释一字未动。

### 双端注入（`script/build-game.ts`）

- 导入改为 `{ dataIsolationPlugin, replayDecoratorPlugin }`。
- `buildClient`：`plugins: [replayDecoratorPlugin(), legacy({ ... })]`（新插件在 `legacy` 之前）。
- `buildData`：`plugins: [dataIsolationPlugin(), replayDecoratorPlugin()]`（隔离插件保持首位）。
- 构建顺序（准备 → 渲染端 → 数据端 → content → LICENSE）、产物落点与其余配置均未变。

### content 清单过滤（`script/build-resource.ts`）

- 新增不导出常量 `LIST_FILE_NAME = '.list.jsonc'`、`DEFAULTS_DIRECTORY = 'defaults'`。
- 新增内部函数：`readListNames`（读文件 → `minifyJSONC` 去注释 → `JSON.parse`）、`collectListedNames`（递归收集全部字符串值）、`isListedFile`（完整文件名或去扩展名主文件名的精确匹配）。
- `processDirectory` 增加第五个参数 `isRoot = false`：
  - `buildContent` 的根调用传 `true`，根目录**永不**按清单取舍（即使将来出现根 `.list.jsonc`）；
  - `defaults/` 通过 `DEFAULTS_DIRECTORY` 显式豁免，全量输出并压缩；
  - 其余子目录若存在 `.list.jsonc`，只保留被引用文件，未引用文件既不拷贝也不计入统计；
  - `.list.jsonc` 自身先于过滤判断，始终走 `.jsonc` 压缩分支；
  - 无清单的子文件夹与递归子目录保持全量。
- `minifyJSONC` / `buildContent` / 接口名称与签名、字体分支与告警文案均未改；jsonc 仍只剥离整行 `//` 注释（含系统标记行），不改解析与序列化方式，不分块、不 zip。

### 测试（`script/__test__/`）

- `script/__test__/build-plugin.test.ts`：由 `script/build-plugin.test.ts` 移动而来（导入改 `../build-plugin`，旧路径已删除），保留既有 `dataIsolationPlugin` 四个用例；新增纯函数用例（删 `@shouldReplay` / `@ignoreReplay`、参数含双引号与嵌套括号、字符串不误删、注释不误删）与插件跳过用例，以及**对照式双装饰器**真实 `vite.build()`：同一 fixture 内本地定义且不导出 `shouldReplay` / `ignoreReplay` 工厂，导出一个类、两个方法分别带一种装饰器并各返回 `mota_replay_probe` / `mota_ignore_probe`。对照组（`plugins: []`）产物含两个工厂名、两个唯一字面量与两个方法名；实验组不含 `shouldReplay` / `ignoreReplay`，但两个唯一字面量与两个方法名仍在。
- `script/__test__/build-resource.test.ts`：9 个 fixture 行为用例——根 jsonc 压缩、根目录存在 `.list.jsonc` 仍全量、`defaults/` 存在 `.list.jsonc` 仍全量、maps 清单（原文带 `//` 注释）保留/剔除、texture 对象清单 + 完整文件名按字节保留、font 清单、无清单子文件夹全量、`item.ts` 原样、统计值一致。
- 每个 `it` 前均有一行中文说明注释（AGENTS.md）。

## Files Created/Modified

- `script/build-plugin.ts`（修改）— 新增录像装饰器删除纯函数与构建插件
- `script/build-game.ts`（修改）— 双端注入新插件
- `script/build-resource.ts`（修改）— content 清单过滤
- `script/__test__/build-plugin.test.ts`（新增；源 `script/build-plugin.test.ts` 已删除）
- `script/__test__/build-resource.test.ts`（新增）
- `.planning/phases/09-minimum-browser-runnable/09-22-SUMMARY.md`（本文件）

**未改动（已核对）：** `script/build-lib.ts`、`package.json`、`index.html`、`dev.md`、`src/**`、`public/**`、`packages-user/**`、`packages/**`、`vite.config.ts`、`pnpm-lock.yaml`、`script/dev.ts`、`script/check-data-circular.test.ts`；未手动删除任何 import。

## 命名获批情形

- OI-1：`removeReplayDecorators` / `replayDecoratorPlugin` / `name: 'mota-replay-decorator'`，以及内部常量 `REPLAY_DECORATORS` / `SCRIPT_EXTENSIONS` / `NODE_MODULES_SEGMENT`。
- OI-2：`LIST_FILE_NAME` / `DEFAULTS_DIRECTORY` / `readListNames` / `collectListedNames` / `isListedFile`，以及 `processDirectory` 的 `isRoot` 参数。
- OI-3：`script/__test__/build-plugin.test.ts`（移动）与 `script/__test__/build-resource.test.ts`（新增）。
- 均按计划提议命名采用（Task 0 已报备并由用户批准执行）。

## Gates Run

| 门禁 | 命令 / 内容 | 结果 |
| ---- | ----------- | ---- |
| 插件单测 | `cmd /c "pnpm exec vitest run script/__test__/build-plugin.test.ts"` | **PASS**（11/11） |
| content 单测 | `cmd /c "pnpm exec vitest run script/__test__/build-resource.test.ts"` | **PASS**（9/9） |
| 合并重跑 | 两个测试文件同时运行 | **PASS**（20/20） |
| 插件结构门禁 | 计划 Task 1 `<automated>`（AST 标记、`enforce` / `apply`、导出形态、`build-game` 按函数切片、测试位置与正负向断言） | **PASS**（`OK replay plugin: AST strip + dual-sided wiring`） |
| 插件注释基线门禁 | 与 `gsd-09-22-jsdoc-baseline.json` 比对 | **PASS**（`build-plugin.ts` 既有注释 9 行唯一值全部保留） |
| content 结构门禁 | 计划 Task 2 `<automated>`（值标记、导出与 `chars: string`、基线注释零丢失、SUMMARY 关键字与基线 SHA） | **PASS** |
| 真实清单覆盖率 | 5 个清单目录内现存素材全部被清单命中 | **PASS** |
| eslint | `cmd /c "pnpm exec eslint <5 个改动文件>"` | **PASS**（零报告） |

### 注释基线

- 文件：`gsd-09-22-jsdoc-baseline.json`（由 Task 0 写入仓库外 `os.tmpdir()`，本次执行复用、未覆盖）。
- 捕获时 `head`：`539c6516720b4aa9f6a0bbbf912ad447f95fc85c`。
- `script/build-plugin.ts` 与 `script/build-resource.ts` 的既有注释行均与基线逐行一致（去重后分别为 9 行与 24 行），门禁与 git 提交无关、可重复执行。

## Open Items 处置

- OI-1 / OI-2 / OI-3：按计划提议命名采用，未改名。
- 已知边界见下节，均不在本计划范围。

## Known Boundaries

- **未端到端运行全量 `build:game`：** 渲染端仍有用户 WIP 的 stale import（`src/client/initialize.ts`、`src/client/plugin/shop/shop.tsx`，09-21 已记录）。本次验证只覆盖两个测试文件、结构门禁、注释基线、真实清单覆盖率与 eslint；**不得**表述为「全量构建已通过」。
- **生产构建不再有录像安全检查：** `@shouldReplay` / `@ignoreReplay` 应用在构建期被删除，运行期不再产生对应的录像收集信息，属用户裁定与 D-96 的预期结果。
- **`index.html` 仍引用 `/styles.css`：** 本计划不产出、不改该文件（09-21 已记录）。
- **`animation` / `audio` / `font` 当前无对应素材：** 其清单过滤规则仅由测试覆盖，不影响现有产物。
- **估算未校准：** 计划 `estimate.tokens=46000` 是 `confidence: low` 的原始估算，尚无历史执行样本，本次 `actuals.tokens≈7900` 为按实际改动字符数（chars/4）测得，二者差异不构成校准结论（`uncalibrated`）。

## Deviations from Plan

无功能性偏差。执行细节说明：

1. **换行符：** 3 个脚本经 `prettier --write` 保持仓库既有 CRLF；2 个新测试文件同样以 `.prettierrc` 的 `endOfLine: crlf` 格式化；本 SUMMARY 沿用 `.planning` 既有的 LF。
2. **测试辅助函数：** 插件测试把探测构建收敛为一个接收 `{ root, entry, plugins }` 的辅助函数，以便对照组写出字面量 `plugins: []`（结构门禁要求的对照构建），行为与计划一致。

## Issues Encountered

无。两套测试首轮即通过。

## User Setup Required

None。

## Commits

**未提交任何内容（`git add` / `git commit` 均未执行，按本次执行指令保留在工作树）。** `actuals.commits` 因此记录为 0。

---

*Phase: 09-minimum-browser-runnable*
*Completed: 2026-10-21*
