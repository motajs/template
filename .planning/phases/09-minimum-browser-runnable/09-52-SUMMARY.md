---
phase: 09-minimum-browser-runnable
plan: 52
subsystem: render-anim
tags: [typescript, types-only, render-anim, enum, animation]
requires: []
provides:
  - "新包 @motajs/render-anim 的 package.json（name + @motajs/render workspace:*）"
  - "1 个 export const enum AnimationBlendMode（Normal / Add）与 6 个动画数据接口"
  - "src/index.ts 的单一星号导出"
affects: [09-minimum-browser-runnable, render-anim]
actuals:
  # chars/4 上限值，只统计本计划新建的 3 个包文件（2201 字节）；SUMMARY 自身不计入
  tokens: 550
  tasks: 5
  commits: 0
tech-stack:
  added: []
  patterns:
    - "类型骨架先行：公开类型由用户审阅后再另立实现计划"
    - "枚举替代字符串标识符：AnimationBlendMode 使用 export const enum 且成员为隐式数值"
    - "同目录星号导出，不跨包转发 @motajs/render 的符号"
key-files:
  created:
    - packages/render-anim/package.json
    - packages/render-anim/src/types.ts
    - packages/render-anim/src/index.ts
  modified: []
key-decisions:
  - "OI-1 按用户裁定 (B)：AnimationBlendMode 由字符串字面量联合改为 export const enum AnimationBlendMode（成员 Normal / Add，隐式数值 0 / 1）"
  - "IAnimationData 通过 extends IAnimationAnimaterData 复用 bitmaps / frames，不重复声明成员"
  - "只落类型骨架，RenderAnimater 与 parseRenderAnimation 留给后续实现计划"
patterns-established:
  - "新包的 package.json 只写 name 与 workspace 依赖，不写 version / private / type / exports / scripts"
requirements-completed: []
duration: 9min
completed: 2026-11-07
status: complete
---

# Phase 9 Plan 52: 新建 `@motajs/render-anim` 的类型骨架

**只新增 `package.json` / `src/types.ts` / `src/index.ts` 三个文件，落下 1 个 `export const enum AnimationBlendMode`（`Normal` / `Add`）与 6 个动画数据接口，不含任何实现。**

## Performance

- **Duration:** 约 9 min
- **Started:** 2026-11-07T13:02:00Z
- **Completed:** 2026-11-07T13:11:20Z
- **Tasks:** 5（Task 0 为已获「可以执行」的汇报关卡；Task 1–4 为执行任务）
- **Files created:** 3 个包文件，另有本 SUMMARY

## 本计划范围

- 只建 `@motajs/render-anim` 的类型骨架；**不实现** `RenderAnimater`、**不实现** `parseRenderAnimation`。
- 不跑测试、构建、dev server、浏览器；不做任何运行时主张。
- 不运行 `pnpm install`，锁文件不变；不新增包级 `tsconfig.json` 或任何配置。
- **0 次提交**：全程未执行任何 git 写命令，改动留在工作树供审阅。
- 编号说明：派发编号 09-52 / 波次 1；`09-01`..`09-51` 均已占用，本计划不删除、不覆盖任何既有记录。

## Task 0 执行前汇报关卡（已满足）

| 项 | 内容 |
|----|------|
| 关卡类型 | `checkpoint:human-verify` |
| Gate | `blocking-human` |
| 汇报对象 | 三个文件的逐字形态、1 个 `export const enum` + 6 个接口的逐成员清单、dev.md 合规点、影响范围、只读静态验证口径、编号说明、不提交声明 |
| OI-1 裁定 | 用户选择 **(B)**：`AnimationBlendMode` 改为 `export const enum AnimationBlendMode`（成员 `Normal` / `Add`，隐式数值 0 / 1，成员 jsDoc 为「普通混合」/「加算混合」） |
| 用户回复 | 恰好「可以执行」四个字（针对本修订版） |
| 结论 | 关卡通过，进入 Task 1–4；未再询问 (A)/(B) |

**说明：** 本仓库与 GSD 既有约定中不存在独立的「approval 文件」；计划正文也明确 Task 0「不写任何文件」，且本次执行被限定只能写 4 个路径。因此该结构化批准记录落在本 SUMMARY，不额外创建文件。

## 逐文件最终形态

### `packages/render-anim/package.json`

只有两个顶层键，顺序为 `name`、`dependencies`；`dependencies` 只有一个条目 `@motajs/render: workspace:*`：

```json
{
    "name": "@motajs/render-anim",
    "dependencies": {
        "@motajs/render": "workspace:*"
    }
}
```

无 `version` / `private` / `type` / `main` / `module` / `types` / `exports` / `scripts`；113 字节，6 行，全 CRLF。

### `packages/render-anim/src/types.ts`

首行为普通引入 `import { ITexture, ITextureAnimater } from '@motajs/render';`（未使用 `import type`），随后一个空行，再按固定顺序导出 7 个类型。成员级 jsDoc 为单行中文，接口与枚举本身不写 jsDoc。2062 字节，76 行，全 CRLF。

| 导出类型 | 成员（顺序固定） |
|----------|------------------|
| `AnimationBlendMode`（`export const enum`） | `Normal`（普通混合，隐式 0）、`Add`（加算混合，隐式 1） |
| `IAnimationBitmap` | `readonly x: number`、`readonly y: number`、`readonly width: number`、`readonly height: number` |
| `IAnimationSound` | `readonly name: string`、`readonly volume?: number`、`readonly pitch?: number` |
| `IAnimationObject` | `readonly index: number`、`readonly x: number`、`readonly y: number`、`readonly scale: number`、`readonly opacity: number`、`readonly mirror: number`、`readonly rotate: number` |
| `IAnimationFrame` | `readonly width: number`、`readonly height: number`、`readonly originX: number`、`readonly originY: number`、`readonly objects: readonly IAnimationObject[]`、`readonly sound?: readonly IAnimationSound[]` |
| `IAnimationAnimaterData` | `readonly bitmaps: readonly IAnimationBitmap[]`、`readonly frames: readonly IAnimationFrame[]` |
| `IAnimationData extends IAnimationAnimaterData` | `readonly texture: ITexture`、`readonly animater: ITextureAnimater<IAnimationAnimaterData>`、`readonly blend: AnimationBlendMode` |

`AnimationBlendMode` 声明形态（OI-1 B）：顶格 `export const enum AnimationBlendMode {`，成员为 4 空格缩进的单行 jsDoc + `Normal,` / `Add`（末成员无尾逗号），最后顶格 `}`；无显式初始化，无声明级 jsDoc。

### `packages/render-anim/src/index.ts`

全文只有一行 `export * from './types';`，不转发 `@motajs/render` 的符号。26 字节，1 行，CRLF 结尾。

## Task 1 记录的类型 / 命名方案（只读采集）

- `packages/render/src/assets/types.ts`：`ITexture` 为接口（`Texture` 类 `implements ITexture`）；`ITextureAnimater<T>` 的 `once(texture, data)` / `cycled(texture, data)` 均返回 `Generator<ITextureRenderable, void>`；成员 jsDoc 风格为单行中文、结尾不加句号。
- `packages/render/src/index.ts`：`export * from './assets' | './core' | './style' | './types' | './utils'`，因此 `ITexture` / `ITextureAnimater` 可从 `@motajs/render` 根导出取得。
- `packages/render/src/core/canvas2d.ts`：`MotaOffscreenCanvas2D` 提供 `setHD(hd: boolean)` 与 `setAntiAliasing(anti: boolean)`（仅供后续实现记录，本计划未调用）。
- 包清单范式：`packages/render/package.json` 只有 `name`；`packages/audio/package.json` 为 `name` + `dependencies`（`workspace:*`）。新包按后者书写。
- 根 `tsconfig.json`：`include` 覆盖 `packages/**/*.ts`，`paths['@motajs/*'] = ['./packages/*/src']`，`strict: true`、`isolatedModules: true`、`noEmit: true`，因此无需为新包新增 tsconfig。
- `.prettierrc`：`printWidth: 80` / `tabWidth: 4` / `singleQuote: true` / `arrowParens: avoid` / `trailingComma: none` / `endOfLine: crlf`；`eslint.config.js` 为 `typescript-eslint` + `eslint-plugin-prettier/recommended`。
- 命名与 jsDoc 结论：类型名 / 成员名全部由用户提供，未新增任何未获批的公开名称；`IAnimationSound.name: string` 属 dev.md 允许的字符串 id 别名一类（OI-2）。

## 门禁真实结果

| 门禁 | 命令要点 | 真实输出 | 结果 |
|------|----------|----------|------|
| 格式 | `node node_modules/prettier/bin/prettier.cjs --check packages/render-anim/{package.json,src/types.ts,src/index.ts}` | `Checking formatting...` / `All matched files use Prettier code style!`，退出码 0 | 通过 |
| lint | `node node_modules/eslint/bin/eslint.js packages/render-anim/src/types.ts packages/render-anim/src/index.ts` | 无任何输出，退出码 0 | 通过 |
| 换行 / 缩进 | Task 3 第 3 步 node 门禁 | `OK   packages/render-anim/package.json lf=6 crlf=6 tabs=0` / `OK   packages/render-anim/src/types.ts lf=76 crlf=76 tabs=0` / `OK   packages/render-anim/src/index.ts lf=1 crlf=1 tabs=0` | 通过 |
| 内容 / 结构 | Task 3 第 4 步 node 门禁（枚举 + 6 接口 + 21 条成员片段（覆盖 25 个成员）+ 首行 import + 负向检查 + index / package 校验） | `OK`，退出码 0 | 通过 |
| 逐接口成员 | Task 3 第 5 步 node 门禁（按接口块逐字比对成员序列、`extends`、接口数、枚举成员序列） | `OK: per-interface skeleton matches`，退出码 0 | 通过 |
| 类型门禁 | node 过滤 `vue-tsc --noEmit` 输出，只看 `packages/render-anim` 诊断 | **已运行**：`OK: no render-anim diagnostics`（0 行诊断）；全仓既有类型错误与 `vue-tsc` 非 0 退出码不参与判定 | 通过 |
| 范围闸门（SUMMARY 写入前） | Task 4 第 1 步 node 门禁 | `added:` 恰为 `?? packages/render-anim/package.json` / `?? packages/render-anim/src/index.ts` / `?? packages/render-anim/src/types.ts`；`removed` / `extra` / `missing` 均为空 | 通过 |
| 哈希闸门 | Task 4 第 2 步 node 门禁 | `09-50-PLAN 1575237b…`、`09-50-SUMMARY 9283ff05…`、`09-51-PLAN a83f21cb…`、`09-51-SUMMARY 257483e7…`、`09-52-PLAN 5fdcef8a…`；`OK: 5 files unchanged` | 通过 |

人工逐成员复核（绑定判定）：`types.ts` 的成员顺序、接口归属、`readonly`、可选性（`volume?` / `pitch?` / `sound?`）、只读数组、`extends IAnimationAnimaterData`、泛型实参 `ITextureAnimater<IAnimationAnimaterData>` 与计划正文「类型骨架逐成员对照」逐项一致；`AnimationBlendMode` 为 `export const enum`，成员恰为 `Normal` → `Add`（隐式数值、无显式初始化、末成员无尾逗号）；每个成员有且只有一行 jsDoc；无实现体、无 `export default`。

## 未做 / 跳过项

- 未运行任何测试、构建、dev server 或浏览器；不做运行时可用性主张。
- 未运行 `pnpm install`；锁文件未变（依赖仅为同仓库工作区包）。
- 未执行任何 git 写命令（`add` / `commit` / `stash` / `checkout` / `restore` / `reset`），**0 次提交**。
- 未创建 `09-52-RESEARCH.md` / `09-52-VALIDATION.md`；未改动 `STATE.md` / `ROADMAP.md` / `09-CONTEXT.md`。
- 本 run 无 RESEARCH / 无 VALIDATION：`requirements: []`，Nyquist 不适用；spec-less probe fallback skipped（phase has no requirement IDs to probe）。

## 设计记录（未实现）

- 浏览器专用；`RenderAnimater` 将实现 `ITextureAnimater<IAnimationAnimaterData>`（`once` / `cycled` 返回 `Generator<ITextureRenderable>`，帧时序与循环由外部驱动）。
- 逐帧惰性合成；产出的可渲染对象在下一次 `.next()` 前有效，下一次恢复或 `return` 时清理上一帧。
- 使用 `MotaOffscreenCanvas2D` 并调用 `setHD(false)` / `setAntiAliasing(false)`，不直接调用浏览器 canvas API。
- 空帧产出透明小图；帧尺寸可不同，每帧自带 `width` / `height` / `originX` / `originY`。
- `blend` 以 `AnimationBlendMode` 存于文件并由解析数据暴露，动画器不决定混合；`sound` 由宿主播放。
- 解析函数为 `parseRenderAnimation(buffer: ArrayBuffer): Promise<IAnimationData>`。

## 偏差与问题

1. **[Rule 3 - Blocking] Write 工具把换行归一化为 LF**：写入后测得 `crlf=0`，会使 prettier `--check`（`endOfLine: crlf`）失败。处理方式：写入后运行一次 Node 脚本，把 3 个包文件按 `/\r?\n/` → `\r\n` 统一为 CRLF，内容其余部分不变；随后 CRLF 门禁与 prettier `--check` 均通过。未新增或删除任何字符。
2. Task 0 的批准记录落在本 SUMMARY（见上节说明），未创建独立的 approval 文件——计划正文要求 Task 0 不写文件，本次执行也仅允许写 3 个包文件与本 SUMMARY。

除上述两点外，计划按原文执行。

## 待确认项

- **OI-1（已裁定）**：`AnimationBlendMode` 使用 `export const enum`，成员 `Normal` / `Add`，隐式数值；`IAnimationData.blend` 类型不变。
- **OI-2（仅记录）**：`IAnimationSound.name: string` 属允许的字符串 id 别名一类，保留。
- **OI-3（仅记录）**：类型骨架由用户自行审阅 / 修改后再进入实现；`RenderAnimater` 与 `parseRenderAnimation(buffer: ArrayBuffer): Promise<IAnimationData>` 另立后续计划。
- **OI-4（仅记录）**：成员（含枚举成员）jsDoc 使用单行中文风格；接口与枚举本身按 dev.md 不写 jsDoc。如需英文注释或接口级说明，请指示。
- **OI-5（仅记录）**：`estimate` 未校准（`confidence: low`），本计划未运行构建或测试。

## 估算

- **估算：** `confidence: low`，未校准（计划 `estimate.tokens: 30000`）。
- **实际（actuals）：** 新建包文件 2201 字节，约 550 tokens（chars/4）；任务 5 个；提交 0 次。

## Self-Check: PASSED

- 3 个包文件均存在：`packages/render-anim/package.json`（113 B）、`src/types.ts`（2062 B）、`src/index.ts`（26 B）。
- `files_modified` 之外零改动（范围闸门 `extra` / `missing` / `removed` 均为空）。
- 0 次提交；工作树保留全部改动。

---
*Phase: 09-minimum-browser-runnable*
*Completed: 2026-11-07*
