# Phase 10 Plan 42: VitePress 内嵌自定义渲染器 demo 最小 POC Summary

## 一句话

在保留 VitePress SSR 预渲染的前提下，用 DOM 包装组件 + `onMounted` 动态 import，把 `@motajs/render` / `@motajs/render-vue` 的自定义渲染器嵌进文档站；「渲染基础」与「UISystem」两个 demo 真实绘制、可交互、可安全卸载。

## 解决的问题

验证「文档内嵌可运行示例」在 `vitepress build docs` 的预渲染阶段是否可行：引擎模块顶层会碰 `document`（`core/utils.ts`、`core/graphics.ts`、`core/misc.ts`、`render-vue/src/tag.ts`），因此包装组件与页面顶层只能对引擎包动态 import，页面用 `<ClientOnly>` 跳过预渲染。POC 通过后，才值得评估 fence 插件与正式渲染端文档批次。

## 最终落点与命名

- 包装组件：`docs/.vitepress/components/renderDemo.vue`（组件名 `RenderDemo`；props `loader` / `width` / `height` / `scale` / `background`；内部类型 `RenderDemoProps` / `DemoLoader` / `DemoModule` / `AppHandle`）
- 渲染基础 demo：`docs/.vitepress/components/demos/basicRender.vue`（`BasicRenderDemo`）
- UISystem demo：`docs/.vitepress/components/demos/uiSystem.vue`（`UISystemDemo`）
- POC 页面：`docs/poc/render-demo.md`（不进 nav / sidebar）
- 配置：`docs/.vitepress/config.ts` 的 `vite.resolve.alias` / `dedupe` / `isCustomElement` / `vuejsx`
- docs 局部 TS 项目：`docs/tsconfig.json`（不并入 `pnpm check:type`，根 `tsconfig.json` / `tsconfig.node.json` 未改）
- ESLint docs override：`eslint.config.js`（只匹配 `docs/.vitepress/components/**/*.vue`）

## 六类门禁

- prettier：`--write` → `--check` 均通过（`All matched files use Prettier code style!`）。
- ESLint：`cmd /c "pnpm exec eslint docs/.vitepress/components docs/.vitepress/config.ts"` 为 0 error / 0 warning，无 `vue/attribute-hyphenation` / `vue/one-component-per-file`；渲染属性保持 camelCase（`fillStyle` / `strokeStyle` / `lineWidth`），未为了 lint 改属性名。
- docs 类型检查：`cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"` 中 `docs/` 路径 0 报错；仅 11 条 `packages/` 既有报错（`packages/common/src/logger.ts` 缺 `main` 3 条、`packages/render/src/core/types.ts` 缺 `CanvasStyle` 8 条），既有、非本轮引入、不得修，只记录。
- 构建：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` green，输出含 `build complete`，无 dead link。
- 静态断言：计划 Task 5 的 Node 组合（config / 包装组件 SSR 边界 / 两个 demo / 页面 ClientOnly 与两个动态 loader / `eslint.config.js` override / 四文件 CRLF）为 `GATE-OK`。
- 产物：`public/_docs/poc/render-demo.html` 已生成，且 POC 页不在 nav / sidebar。

## 人工验证

用户人工验证：通过
用户原文：pass

浏览器中确认：两个 demo 真实绘制、点击交互生效、UI 打开 / 关闭后栈长度归零、反复进出页面无残留、控制台无 `logger` 74 / 21 / 19。

## 页面保留决定

**暂时保留** `docs/poc/render-demo.md` 与现有命名、落点；后续正式渲染端文档批次再决定删除或迁移。

## 未做事项

- 不做 markdown fence 插件（POC 通过后再评估）。
- 不写正式渲染端文档批次。
- 不使用 `client-base` 的真实素材 / 组件。
- 不把 POC 页加入 nav / sidebar。
- 不改任何引擎源码（`packages/` / `packages-user/` / `src/` 均未改）；引擎既有类型错误只记录。
- 本计划未产生任何 git commit / push。

## HEAD 与提交状态

BASE-HEAD: db726ff58d2fe4311704d375cd34a4b7e755eba3
CURRENT-HEAD: e05cc55b957104e730421e3996adb5912143a253
PLAN-FILES-COMMITTED: none

判定口径：允许 HEAD 与基线不同——POC 期间用户有并发提交（例如 `refactor: 删除 legacy-ui 包`、`feat: 设置系统类型声明`）。本计划未产生 commit 的证明是：① `git log --oneline <基线 HEAD>..HEAD -- <本计划六个关键路径>` 输出为空（本计划文件没有被任何新 commit 带入）；② `git status --porcelain -- <同一组路径>` 仍有未提交输出（`docs/poc/render-demo.md`、`docs/tsconfig.json`、`docs/.vitepress/components`、`docs/.vitepress/config.ts`、`eslint.config.js`、`.planning/phases/10-docs-restructure/10-42-POC-NOTES.md`）。

## Self-Check: PASSED

- 产物与记录文件均存在：`docs/.vitepress/config.ts`、`docs/tsconfig.json`、`eslint.config.js`、三个组件、`docs/poc/render-demo.md`、本 SUMMARY、POC-NOTES、`ROADMAP.md`、`STATE.md`、`public/_docs/poc/render-demo.html`。
- 本计划未产生 commit：`git log db726ff58d2fe4311704d375cd34a4b7e755eba3..HEAD -- <本计划六个关键路径>` 输出为空，`git status --porcelain` 对这些路径仍有输出。
