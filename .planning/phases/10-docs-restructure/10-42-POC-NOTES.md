# 10-42 POC 记录：VitePress 内嵌自定义渲染器

记录日期：2026-10-29

## 命名清单（用户已确认）

方案 A，逐项最终值如下（包装组件文件名、组件名、props、内部类型、demo 目录、两个 demo 文件名与组件名、POC 页面路径、config 新增键均已确认）：

| 项 | 最终值 | 类型 / 默认值 |
| --- | --- | --- |
| 包装组件文件 | `docs/.vitepress/components/renderDemo.vue` | — |
| 包装组件名 | `RenderDemo` | — |
| 包装组件 props | `loader` / `width` / `height` / `scale` / `background` | `DemoLoader`（必填）/ `number`（480）/ `number`（320）/ `number`（1）/ `string`（`'#101418'`） |
| 包装组件内部类型 | `RenderDemoProps` / `DemoLoader` / `DemoModule` | `interface` / `type` / `interface` |
| demo 目录 | `docs/.vitepress/components/demos/` | — |
| 渲染基础 demo | `basicRender.vue` | 组件名 `BasicRenderDemo` |
| UISystem demo | `uiSystem.vue` | 组件名 `UISystemDemo` |
| POC 页面 | `docs/poc/render-demo.md` | 不进 nav / sidebar |
| 命名确认记录 | `.planning/phases/10-docs-restructure/10-42-POC-NOTES.md` | 本文件 |
| config 新增键 | `vite.resolve.alias` / `vite.resolve.dedupe` / `vue.template.compilerOptions.isCustomElement` / `vite.plugins`（追加 `vuejsx`） | — |

用户确认：可以执行
用户原文：可以执行

## 基线

基线 HEAD：db726ff58d2fe4311704d375cd34a4b7e755eba3
ROADMAP 基线 Plans 行：**Plans:** 29/32 completed（第一批：中级教程 24 篇 + 站点注册 + D-09 复审修订；第二批：高级 I 7 篇 + 注册 + 读者审阅 + 用户修订循环；第三批：高级 II 10 篇 + 注册 + 读者审阅 + 用户修订循环；第四批：高级 I 补写 Mover + FaceHandler 2 篇 + 注册 + 读者/用户修订，已完成）。**未完成 3 个**（第一批遗留）：`10-06`（中级全批验收）、`10-11`（中级读者审阅）、`10-12`（中级最终验收）——其范围已被后续 D-09 修订与高级 I/II 期间的最终状态覆盖，缺独立 SUMMARY，待补跑或并入后续验收。
STATE 基线 total_plans： 134
STATE 基线 completed_plans： 126

以上基线项（ROADMAP 计数行原文 + STATE 两个计数原值 + HEAD）是「本次修改不得改动」的比对基准，不写死任何期望数字（10-41 可能已把 Phase 10 的计数改成 38/41，本计划只保证自己不改它）。

## 门禁

首次构建：green

- 命令：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`
- 关键输出：`build complete in 19.38s.`；无 dead link 报告；仅有既有的 chunk 体积警告

### Task 5 门禁结论

| 门禁 | 命令 | 结论 |
| --- | --- | --- |
| prettier `--write` | `cmd /c "pnpm exec prettier --write docs/.vitepress/config.ts docs/.vitepress/components docs/poc/render-demo.md"` | 通过（exit 0） |
| prettier `--check` | `cmd /c "pnpm exec prettier --check docs/.vitepress/config.ts docs/.vitepress/components docs/poc/render-demo.md"` | 通过（`All matched files use Prettier code style!`） |
| ESLint | `cmd /c "pnpm exec eslint docs/.vitepress/components docs/.vitepress/config.ts"` | 0 error / 0 warning（exit 0，无规则命中） |
| docs 类型检查 | `cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"` | `docs/` 路径 0 报错；仅 `packages/` 既有报错 |
| 静态断言 | 计划 Task 5 的 Node 断言组合（config / 包装组件 / 两个 demo / 页面 / `eslint.config.js` / 四个文件 CRLF） | `GATE-OK` |
| 全量构建 | `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` | green：`build complete`，无 dead link |
| 产物 | `public/_docs/poc/render-demo.html` | 已生成（`Test-Path` = True） |

注：首次 Task 5 构建曾因既有 `packages/system/src/hotkey/index.ts` 的失效 `export * from './hotkey'` 而 red；该文件已由用户自行修复，本次重跑构建 green。本计划未修改该文件。

## 组件类型与 ESLint

属性名保持 camelCase：docs demo 的 `g-*` / `container` / `text` 是 `isCustomElement` 的元素 vnode，`@vue/compiler-dom` 的 `v-bind` 不会对元素做 camelize——把 `fillStyle` / `strokeStyle` / `lineWidth` 改写成连字符会被原样编译成 `fill-style` 键；而 `packages/render/src/core/graphics.ts:255-263` 与 `packages/render/src/core/misc.ts:127-137` 的 `handleProps` 只匹配 camelCase 字面量，改名即失配、demo 不渲染，因此属性名一律保持 camelCase，连字符告警只能靠 ESLint 局部 override 放宽。
eslint 覆盖范围：`eslint.config.js` 仅新增一个 `files: ['docs/.vitepress/components/**/*.vue']` 的 override（`vue/attribute-hyphenation: ['warn', 'never']`、`vue/one-component-per-file: 'off'`）；既有 `ignores` 与其它规则、`packages/` / `packages-user/` / `src/` 的 lint 范围均未改动。
docs 类型检查：`cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"` 通过，`docs/` 路径 0 报错；`docs/tsconfig.json` 只服务 docs，不并入 `pnpm check:type`，根 `tsconfig.json` / `tsconfig.node.json` 未改。
引擎既有类型错误：11 条（`packages/common/src/logger.ts` 缺 `main` 全局 3 条；`packages/render/src/core/types.ts` 缺 `CanvasStyle` 导入 8 条）；既有、非本轮引入、不得修，只记录不修复。

## 待人工验证项

1. 渲染基础 demo 出现 container 背景、矩形、圆与文字。
2. 点击矩形 / 圆后计数与颜色可见变化（若点击无反应，先查根锚点是否被改动、canvas 是否被写内联宽高）。
3. UISystem demo「打开 UI」能看到最小 UI，「关闭 UI」后栈长度归零、打开状态变为未打开。
4. 站点内来回切换路由或反复进出该页后，两个 demo 仍能正常显示与交互，画面不叠加、控制台无 RAF / 事件相关报错。
5. 控制台无 `logger` 错误（特别是 74 / 21 / 19）。
6. 明确答复「POC 结束后该页 / 命名 / 落点是否保留」。

## 待议项

POC 结束后该页 / 命名 / 落点是否保留，由用户在 Task 6 决定；本记录不做决定。

## 人工验证与提交状态

用户人工验证：通过
用户原文：pass

页面 / 命名 / 落点决定：**暂时保留** `docs/poc/render-demo.md` 与现有命名、落点；后续正式渲染端文档批次再决定删除或迁移。

当前 HEAD：e05cc55b957104e730421e3996adb5912143a253

提交状态：本计划文件未被任何 commit 带入，且仍未提交——`git log <基线 HEAD>..HEAD -- <本计划文件>` 输出为空，`git status --porcelain` 对本计划六个关键路径仍有未提交输出。Task 1 的 `基线 HEAD：` 行保持 `db726ff58d2fe4311704d375cd34a4b7e755eba3` 不变；HEAD 前移来自用户并发提交。
