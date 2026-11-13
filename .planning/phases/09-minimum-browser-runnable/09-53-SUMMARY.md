---
phase: 09-minimum-browser-runnable
plan: 53
subsystem: render-anim
tags: [typescript, types-only, render-anim, types-split, animation]
requires:
    - "09-52 的 @motajs/render-anim 类型骨架（1 个 export const enum + 6 个接口）"
provides:
    - "IAnimationParsedData（texture / bitmaps / frames / blend，不含 animater 成员）"
    - "export type IAnimationAnimater = ITextureAnimater<IAnimationParsedData>;"
    - "删除 IAnimationAnimaterData 与 IAnimationData 两个旧接口"
affects: [09-minimum-browser-runnable, render-anim]
actuals:
    # chars/4 上限值，只统计本计划 types.ts 的替换块（删除 444 字符 + 新增 367 字符 = 811 字符）；SUMMARY 自身不计入
    tokens: 203
    tasks: 5
    commits: 0
tech-stack:
    added: []
    patterns:
        - "解析数据与动画器分离：解析数据是纯数据对象，动画器是独立类型别名"
        - "ITextureAnimater<T> 的 data 参数只接收纯解析数据，不再把自身当作参数"
key-files:
    created: []
    modified:
        - packages/render-anim/src/types.ts
key-decisions:
    - "IAnimationParsedData 取代 IAnimationAnimaterData + IAnimationData 的组合设计，成员顺序固定为 texture / bitmaps / frames / blend"
    - "IAnimationAnimater 为类型别名 ITextureAnimater<IAnimationParsedData>，不在解析数据中保留 animater 成员"
    - "只落类型声明，RenderAnimater 与 parseRenderAnimation 留给后续实现计划"
patterns-established:
    - "类型别名承载动画器契约：动画器类型由 ITextureAnimater<解析数据类型> 组合而成，不重复声明接口成员"
duration: 12min
completed: 2026-11-07
status: complete
---

# Phase 9 Plan 53: `@motajs/render-anim` 类型拆分（纯解析数据 + 独立动画器）

**删除 `IAnimationAnimaterData` / `IAnimationData`，落 `IAnimationParsedData`（`texture` / `bitmaps` / `frames` / `blend`）与 `export type IAnimationAnimater = ITextureAnimater<IAnimationParsedData>;`，不含任何实现。**

## 本计划范围

- 只修改 `packages/render-anim/src/types.ts` 的类型声明；**不实现** `RenderAnimater`、**不实现** `parseRenderAnimation`。
- `files_modified` 恰为两项：`packages/render-anim/src/types.ts` 与 `.planning/phases/09-minimum-browser-runnable/09-53-SUMMARY.md`。
- `packages/render-anim/src/index.ts` 与 `packages/render-anim/package.json` 只验证、不修改（哈希与 Task 1 基线一致）。
- 不运行测试、构建、dev server、浏览器；不做运行时主张；不运行 `pnpm install`，锁文件不变。
- **0 次提交**：全程未执行任何 git 写命令，改动留在工作树供审阅。
- 编号说明：派发编号 09-53 / 波次 2 / `depends_on: 09-52`；`09-01`..`09-52` 均已占用。

## Task 0 执行前汇报关卡（已满足）

| 项 | 内容 |
|----|------|
| 关卡类型 | `checkpoint:human-verify` |
| Gate | `blocking-human` |
| 汇报对象 | 修改前（第 62–76 行）与修改后的逐字 diff、拆分原因、四个成员与类型别名逐字形态、删除清单、dev.md 合规点、命名、影响范围、只读静态验证口径、0 次提交、编号与依赖 |
| 用户回复 | 恰好「可以执行」四个字（针对本修订版） |
| 结论 | 关卡通过，进入 Task 1–4 |

## 修改前后 diff（逐字）

### 修改前（原第 62–76 行，已删除）

```ts
export interface IAnimationAnimaterData {
    /** 位图列表 */
    readonly bitmaps: readonly IAnimationBitmap[];
    /** 帧列表 */
    readonly frames: readonly IAnimationFrame[];
}

export interface IAnimationData extends IAnimationAnimaterData {
    /** 合成帧使用的纹理 */
    readonly texture: ITexture;
    /** 动画器 */
    readonly animater: ITextureAnimater<IAnimationAnimaterData>;
    /** 混合模式 */
    readonly blend: AnimationBlendMode;
}
```

### 修改后（现第 62–73 行，新增）

```ts
export interface IAnimationParsedData {
    /** 合成帧使用的纹理 */
    readonly texture: ITexture;
    /** 位图列表 */
    readonly bitmaps: readonly IAnimationBitmap[];
    /** 帧列表 */
    readonly frames: readonly IAnimationFrame[];
    /** 混合模式 */
    readonly blend: AnimationBlendMode;
}

export type IAnimationAnimater = ITextureAnimater<IAnimationParsedData>;
```

**第 1–61 行逐字不变**：首行普通引入 `import { ITexture, ITextureAnimater } from '@motajs/render';`、`AnimationBlendMode` 枚举、`IAnimationBitmap`、`IAnimationSound`、`IAnimationObject`、`IAnimationFrame` 全部未动；前缀 sha256 门禁逐字证明（见下）。

## 逐成员最终形态

| 导出类型 | 成员（顺序固定） | 成员 jsDoc（沿用既有文本） |
|----------|------------------|----------------------------|
| `IAnimationParsedData`（新增、`export interface`） | `readonly texture: ITexture` | 合成帧使用的纹理 |
| | `readonly bitmaps: readonly IAnimationBitmap[]` | 位图列表 |
| | `readonly frames: readonly IAnimationFrame[]` | 帧列表 |
| | `readonly blend: AnimationBlendMode` | 混合模式 |
| `IAnimationAnimater`（新增、`export type`） | — | 类型别名本身不写 jsDoc |
| `AnimationBlendMode`（不变） | `Normal` / `Add` | 普通混合 / 加算混合 |
| `IAnimationBitmap`（不变） | `x` / `y` / `width` / `height` | 保持 09-52 的既有注释 |
| `IAnimationSound`（不变） | `name` / `volume?` / `pitch?` | 保持 09-52 的既有注释 |
| `IAnimationObject`（不变） | `index` / `x` / `y` / `scale` / `opacity` / `mirror` / `rotate` | 保持 09-52 的既有注释 |
| `IAnimationFrame`（不变） | `width` / `height` / `originX` / `originY` / `objects` / `sound?` | 保持 09-52 的既有注释 |

**删除清单：** `IAnimationAnimaterData`（含 `bitmaps` / `frames` 两个成员与两条注释）、`IAnimationData`（含 `texture` / `animater` / `blend` 三个成员与三条注释、`extends IAnimationAnimaterData` 关系）以及 `动画器` 注释。删除后文件导出恰为：1 个 `export const enum` + 5 个 `export interface` + 1 个 `export type`。

## Task 1 基线（只读采集）

| 路径 | `git hash-object` 基线 |
|------|------------------------|
| `packages/render-anim/src/types.ts` | `53d4b962bb525730d3de85737fbf60764cb30bd4` |
| `packages/render-anim/src/index.ts` | `fcb073fefcd6bebc8afd726f830e66828ebc5e90` |
| `packages/render-anim/package.json` | `4934efaea21143110e313816a317130b296982d0` |
| `09-50-PLAN.md` | `1575237b92a411a9f6819ed4108f22672ef934d4` |
| `09-50-SUMMARY.md` | `9283ff0511cba1a4f11ccd6f13f48777d791e9f7` |
| `09-51-PLAN.md` | `a83f21cbdb8f275cefab756ea041f2a0d93bb857` |
| `09-51-SUMMARY.md` | `257483e79741f5597ca78f3fecf07fb4eba31a8d` |
| `09-52-PLAN.md` | `5fdcef8add173e6432388d5995dfd8ea81394929` |
| `09-52-SUMMARY.md` | `8416ecd0740b3f5fe3a21ec38427d78cdb6dc93c` |
| `09-53-PLAN.md` | `d11b37920f31be4d391195a7e1f875786f44a7dd` |

- `packages/render-anim` 的 git 状态恰为 3 条未跟踪文件：`?? package.json` / `?? src/index.ts` / `?? src/types.ts`。
- 前缀基线：`types.ts` 第 1–61 行 sha256 = `d4d97496b09ffa0cb945ebfb23b43f97e18d825b3ec0a2b1a6e0d26106f7884e`（按 CRLF 精确拼接、含第 61 行行尾 CRLF）。
- 根 `tsconfig.json`：`include` 覆盖 `packages/**/*.ts`，`paths['@motajs/*'] = ['./packages/*/src']`，`strict: true`、`isolatedModules: true`、`noEmit: true`。
- `.prettierrc`：`printWidth: 80` / `tabWidth: 4` / `singleQuote: true` / `arrowParens: avoid` / `trailingComma: none` / `endOfLine: crlf`；`eslint.config.js` 为 `typescript-eslint` + `eslint-plugin-prettier/recommended`。
- `@motajs/render` 侧：`ITextureAnimater<T>` 声明 `once(texture: ITexture, data: T): Generator<ITextureRenderable, void>` 与 `cycled(texture: ITexture, data: T): Generator<ITextureRenderable, void>`；`ITexture` 为接口，两者均可从包根导出取得。

## 门禁真实结果

| 门禁 | 命令要点 | 真实输出 | 结果 |
|------|----------|----------|------|
| 格式 | `node node_modules/prettier/bin/prettier.cjs --check packages/render-anim/src/types.ts packages/render-anim/src/index.ts packages/render-anim/package.json` | `Checking formatting...` / `All matched files use Prettier code style!`，退出码 0 | 通过 |
| lint | `node node_modules/eslint/bin/eslint.js packages/render-anim/src/types.ts packages/render-anim/src/index.ts` | 无任何输出，退出码 0 | 通过 |
| 换行 / BOM / 缩进 | Task 2 / Task 3 node 门禁 | `OK lf=73 crlf=73 tabs=0 bom=false` | 通过 |
| 内容 / 结构（逐接口成员 + 逐成员 jsDoc） | Task 2 块替换门禁 | `OK: split applied` | 通过 |
| 内容 / 结构（5 接口 + 1 type alias + 1 enum） | Task 3 第 4 条 node 门禁 | `OK: split types match`，退出码 0 | 通过 |
| index / package 未改动 | Task 3 第 5 条 node 门禁 | `changed:` 仅 `packages/render-anim/src/types.ts f71b6a97767685cbb3cc654d5c655f8315cf1922` / `OK: only types.ts changed; index/package unchanged` | 通过 |
| 第 1–61 行前缀哈希 + 注释不变 | Task 3 第 7 条 node 门禁 | `OK: prefix baseline d4d97496b09ffa0cb945ebfb23b43f97e18d825b3ec0a2b1a6e0d26106f7884e + enum jsDoc present`；`OK: lines 1-61 unchanged, exact jsDoc present` | 通过 |
| 类型门禁 | node 先跑 `vue-tsc --version` 哨兵，再捕获 `--noEmit` 并过滤 `packages/render-anim` 诊断 | **已运行**：`sentinel: vue-tsc Version 6.0.3 | type check exit 2` / `OK: no render-anim diagnostics`（0 行诊断）；全仓既有类型错误与 `vue-tsc` 非 0 退出码属既有基线，不参与判定 | 通过 |
| 范围闸门（SUMMARY 写入前） | Task 4 第 1 步 node 门禁 | `added:` 空、`removed:` 空、`OK: pre-write range clean` | 通过 |
| 哈希闸门 | Task 4 第 2 步 node 门禁（10 条基线） | 仅 `packages/render-anim/src/types.ts` 变化为 `f71b6a97767685cbb3cc654d5c655f8315cf1922`，其余 9 条逐字不变；`OK: only types.ts changed` | 通过 |
| 范围闸门（SUMMARY 写入后） | Task 4 `<verify>` 第 2 条 node 门禁 | 见下「写后范围闸门」 | 见下 |

人工逐成员复核（绑定判定）：`types.ts` 现共 73 行 / 1977 字节；新接口成员顺序为 `texture` → `bitmaps` → `frames` → `blend`，四个成员均为 `readonly`、数组成员为只读数组，每个成员有且只有一行逐字为 `/** 合成帧使用的纹理 */` / `/** 位图列表 */` / `/** 帧列表 */` / `/** 混合模式 */` 的 jsDoc；`IAnimationAnimater` 别名逐字为 `ITextureAnimater<IAnimationParsedData>`；两个旧接口的全部成员 / 注释 / `extends` 已删除；无实现体、无 `export default`、无新增其它注释。

## 未做 / 跳过项

- 未运行任何测试、构建、dev server 或浏览器；不做运行时可用性主张。
- 未运行 `pnpm install`；锁文件未变（依赖仅为同仓库工作区包）。
- 未执行任何 git 写命令（`add` / `commit` / `stash` / `checkout` / `restore` / `reset`），**0 次提交**。
- 未创建 `09-53-RESEARCH.md` / `09-53-VALIDATION.md`；未改动 `STATE.md` / `ROADMAP.md` / `09-CONTEXT.md` / 09-50 / 09-51 / 09-52。
- 本 run 无 RESEARCH / 无 VALIDATION：`requirements: []`，Nyquist 不适用；spec-less probe fallback skipped（phase has no requirement IDs to probe）。

## 偏差与问题

1. **[Rule 3 - Blocking] Write 工具把换行归一化为 LF**：写入 SUMMARY 后测得 `crlf=0`，会使计划要求的 CRLF 门禁失败。处理方式：写入后运行一次 Node 脚本，把 `09-53-SUMMARY.md` 按 `/\r?\n/` → `\r\n` 统一为 CRLF，内容其余部分不变；随后 CRLF / BOM / 制表符门禁通过。未新增或删除任何字符。
2. Task 0 的批准记录落在本 SUMMARY，未创建独立 approval 文件——计划正文要求 Task 0 不写文件，本次执行也仅允许写 `files_modified` 的两个路径。

除上述两点外，计划按原文执行。

## 设计记录（未实现）

- `RenderAnimater` 将 `implements IAnimationAnimater`（即 `ITextureAnimater<IAnimationParsedData>`）；`parseRenderAnimation(buffer: ArrayBuffer): Promise<IAnimationParsedData>`。
- 解析数据不含动画器：`once(texture, data)` / `cycled(texture, data)` 的 `data` 参数只接收纯解析数据对象，不再出现 `data.animater.once(texture, data)` 这种把同一对象既当自身数据又当参数传入的用法。
- `bitmaps` / `frames` 为只读数组，实现阶段不得改成可变数组；解析器对外返回只读视图。
- `blend` 以 `AnimationBlendMode` 存于文件并由解析数据暴露，动画器不决定混合；`sound` 由宿主播放。

## 待确认项

- **OI-1（已获用户批准）**：公开名称固定为 `IAnimationParsedData` 与 `IAnimationAnimater`；解析数据成员固定为 `texture` / `bitmaps` / `frames` / `blend`。本计划未新增任何其它公开名称。
- **OI-2（只记录）**：四个成员注释文本从 09-52 的既有注释原样沿用；`动画器` 注释已随 `IAnimationData.animater` 成员一并移除。
- **OI-3（只记录，不实现）**：后续 `RenderAnimater` 实现 `IAnimationAnimater`，`parseRenderAnimation(buffer: ArrayBuffer): Promise<IAnimationParsedData>`；本计划未写任何实现体。
- **OI-4（只记录）**：`estimate` 未校准（`confidence: low`）；本计划未运行构建或测试，因此不做运行时可用性主张。
- **OI-5（只记录）**：09-52 的产物与本计划的改动仍未提交，留在工作树供审阅。

## 估算

- **估算：** `confidence: low`，未校准（计划 `estimate.tokens: 30000`）。
- **实际（actuals）：** `types.ts` 替换块共 811 字符（删除 444 + 新增 367），约 203 tokens（chars/4）；文件 1977 字节 / 73 行；任务 5 个；提交 0 次。

## Self-Check: PASSED

- `packages/render-anim/src/types.ts` 存在且为拆分后形态（73 行、1977 字节、全 CRLF、无 BOM、无制表符）。
- `packages/render-anim/src/index.ts` 与 `package.json` 哈希与 Task 1 基线逐字一致，未被修改。
- 09-50 / 09-51 / 09-52 的计划与摘要、`09-53-PLAN.md` 哈希逐字不变。
- `files_modified` 之外零改动（范围闸门 `extra` / `missing` / `removed` 均为空）；0 次提交。

---

*Phase: 09-minimum-browser-runnable*
*Completed: 2026-11-07*
