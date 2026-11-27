# 10-43..10-54 记录：高级 II 子分组「自定义 UI 与渲染」

本文件记录 10-43..10-54 的命名、参考清单哈希、门禁与人工验证，只追加不改写（计划顺延与重排说明见文末；10-49..10-54 为 2026-11-01 重排后新增或替换）。

## 命名总表

| 项           | 最终值                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| 子分组名     | 自定义 UI 与渲染                                                        |
| 目录         | `docs/advanced/ii/ui/`                                                  |
| 分组 1       | 起步（Part 0）                                                          |
| 分组 2       | 元素与布局（Part 1）                                                    |
| 分组 3       | 交互与数据（Part 2）                                                    |
| 分组 4       | 组件化（Part 3）                                                        |
| 分组 5       | 内置组件与 UI 系统（Part 4）                                            |
| 分组 6       | 完整示例（Part 5）                                                      |
| demo 目录    | `docs/.vitepress/components/demos/ui/`                                  |
| 侧边栏层级   | 高级 II → 子分组「自定义 UI 与渲染」→ 6 个 Part 分组 → 篇目（两层嵌套） |
| 落点         | 先全部写进高级 II 的新子分组；合并 / 拆分评估留到 10-50                 |
| 导览更新时机 | 本计划只做措辞修正 + 子分组入口；完整目录表留到 10-50 收尾              |

### 27 篇文件名与侧边栏显示名

| 序  | 文件名                                          | 侧边栏显示名               | live                     | demo 文件            |
| --- | ----------------------------------------------- | -------------------------- | ------------------------ | -------------------- |
| 1   | `ui-template.md`                                | UI 通用模板（TSX）         | 是                       | `template-demo.tsx`  |
| 2   | `ui-template-ts.md`                             | 同一 UI 的 TS 元素层写法   | 是（复用 template-demo） | `template-demo.tsx`  |
| 3   | `container-and-coordinates.md`                  | 容器与坐标                 | 是                       | `container-demo.tsx` |
| 4   | `basic-shapes.md`                               | 基础图形                   | 是                       | `shapes-demo.tsx`    |
| 5   | `curves-and-paths.md`                           | 曲线与路径                 | 是                       | `curves-demo.tsx`    |
| 6   | `text.md`                                       | 文字                       | 是                       | `text-demo.tsx`      |
| 7   | `image-and-texture.md`                          | 图片与最小纹理             | 是（10-44）              | 待 10-44 建          |
| 8   | `layer-transform-performance.md`                | 层级、变换与性能           | 是（10-44）              | 待 10-44 建          |
| 9   | `reactivity.md`                                 | 响应式                     | 是（10-44）              | 待 10-44 建          |
| 10  | `events.md`                                     | 事件与交互                 | 是（10-44）              | 待 10-44 建          |
| 11  | `hotkey-in-ui.md`                               | 按键与快捷键               | 否（10-44 按需）         | —                    |
| 12  | `conditional-and-list-rendering.md`             | 条件渲染与循环渲染         | 是（10-44）              | 待 10-44 建          |
| 13  | `props.md`                                      | props                      | 是（10-45）              | 待 10-45 建          |
| 14  | `component-tsx.md`                              | 组件（TSX）                | 是（10-45）              | 待 10-45 建          |
| 15  | `component-ts.md`                               | 组件（TS 直调）            | 是（10-45）              | 待 10-45 建          |
| 16  | `slots-and-attrs.md`                            | slots 与 attrs             | 是（10-45）              | 待 10-45 建          |
| 17  | `builtin-text-and-input.md`                     | 内置组件：文本与输入       | 按需（10-46）            | 待 10-46 建          |
| 18  | `builtin-list-and-containers.md`                | 内置组件：列表与容器       | 按需（10-46）            | 待 10-46 建          |
| 19  | `ui-controller-and-stack.md`                    | UIController 与 UI 栈      | 是（10-46）              | 待 10-46 建          |
| 20  | `replace-builtin-ui.md`                         | 修改 / 替换内置 UI         | 是（10-46）              | 待 10-46 建          |
| 21  | `ui-performance.md`                             | UI 系统性能与注意事项      | 是（10-46）              | 待 10-46 建          |
| 22  | `inventory-example-1-skeleton.md`               | 示例（一）目标与骨架       | 是（10-47）              | 待 10-47 建          |
| 23  | `inventory-example-2-grid.md`                   | 示例（二）道具网格         | 是（10-47）              | 待 10-47 建          |
| 24  | `inventory-example-3-detail.md`                 | 示例（三）详情区           | 是（10-47）              | 待 10-47 建          |
| 25  | `inventory-example-4-scroll.md`                 | 示例（四）滚动与列表       | 是（10-47）              | 待 10-47 建          |
| 26  | `inventory-example-5-state.md`                  | 示例（五）交互与状态       | 是（10-47）              | 待 10-47 建          |
| 27  | `inventory-example-6-animation-and-register.md` | 示例（六）动画、拆分与注册 | 是（10-47）              | 待 10-47 建          |

### 本计划（10-43）五个 demo

| 文件                 | 组件名          |
| -------------------- | --------------- |
| `template-demo.tsx`  | `TemplateDemo`  |
| `container-demo.tsx` | `ContainerDemo` |
| `shapes-demo.tsx`    | `ShapesDemo`    |
| `curves-demo.tsx`    | `CurvesDemo`    |
| `text-demo.tsx`      | `TextDemo`      |

用户确认（10-43）：可以执行
用户原文：可以执行（批准执行 10-43..10-47；10-48 读者/用户审阅前停下）
基线 HEAD：b94b4c3b41da8184312bc9f264654dc9a54adf69

## 参考清单哈希基线

哈希为 `git hash-object -- <path>` 实测值；Manifest 列取自 `10-CUSTOM-UI-RESEARCH.md` 的 `## Reference Manifest`（基线 `b94b4c3`）。

| 路径                                               | Manifest 哈希（HEAD）                                        | 写作前实测                                                          | 是否一致                           |
| -------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------------- |
| `packages/render/src/core/item.ts`                 | `1acd9193d1b0e3121af1dd74ccef25f3dcc7124f`                   | `1acd9193d1b0e3121af1dd74ccef25f3dcc7124f`                          | 是                                 |
| `packages/render/src/core/types.ts`                | `31d9120f43d34757aa5936731bc16ebb0ff39cd3`                   | `31d9120f43d34757aa5936731bc16ebb0ff39cd3`                          | 是                                 |
| `packages/render/src/core/graphics.ts`             | `eebc2f659f2fda05e60cb48e6473ef05f134a5da`                   | `eebc2f659f2fda05e60cb48e6473ef05f134a5da`                          | 是                                 |
| `packages/render/src/core/misc.ts`                 | `3c19fd4d464df04a562a2951120df72ec6adbd2a`                   | `3c19fd4d464df04a562a2951120df72ec6adbd2a`                          | 是                                 |
| `packages/render/src/core/transform.ts`            | `c3f38c52843027ff49373da20c707fcf0091f25f`                   | `c3f38c52843027ff49373da20c707fcf0091f25f`                          | 是                                 |
| `packages/render/src/core/canvas2d.ts`             | `a9c80670c03866b95689413eaf7ed40781176c1d`                   | `a9c80670c03866b95689413eaf7ed40781176c1d`                          | 是                                 |
| `packages/render/src/style/font.ts`                | `0e4541e22555140dd4afcf34fb88fbd91f2edb37`                   | `0e4541e22555140dd4afcf34fb88fbd91f2edb37`                          | 是                                 |
| `packages/render/src/assets/texture.ts`            | `545e2ca46494a99f2c93e33b4d0c1c84d5b4d8fa`                   | `545e2ca46494a99f2c93e33b4d0c1c84d5b4d8fa`                          | 是                                 |
| `packages/render-vue/src/props.ts`                 | `27e0f9f3bb2fa63bf2d9d358af87078eebe56053`                   | `27e0f9f3bb2fa63bf2d9d358af87078eebe56053`                          | 是                                 |
| `packages/render-vue/src/elements.ts`              | `39e0c20c93f3c0b84ad7148688eceac4ed89813b`                   | `39e0c20c93f3c0b84ad7148688eceac4ed89813b`                          | 是                                 |
| `packages/render-vue/src/tag.ts`                   | `7b0265a276dcbdc36c01eac709e4a35cbc7a13f0`                   | `7b0265a276dcbdc36c01eac709e4a35cbc7a13f0`                          | 是                                 |
| `packages/render-vue/src/types.ts`                 | `a90549e8c3bf07e5069107c414086edde65270b0`                   | `a90549e8c3bf07e5069107c414086edde65270b0`                          | 是                                 |
| `packages/render-vue/src/use.ts`                   | `b23674c3b3c143c22cfb6683ff9d2c47fff7ee2b`                   | `b23674c3b3c143c22cfb6683ff9d2c47fff7ee2b`                          | 是                                 |
| `packages/system/src/ui/controller.ts`             | `25c3ea6f2bb3877989c65f25d3fc6dc3288ead7a`                   | `25c3ea6f2bb3877989c65f25d3fc6dc3288ead7a`                          | 是                                 |
| `packages/system/src/ui/types.ts`                  | `2a24550a6a3f8dade44524f7be2564f7d7957551`                   | `2a24550a6a3f8dade44524f7be2564f7d7957551`                          | 是                                 |
| `packages/system/src/ui/instance.ts`               | `11a6ce881e5f1de32f232fd07c7bbc09a9e56203`                   | `11a6ce881e5f1de32f232fd07c7bbc09a9e56203`                          | 是                                 |
| `packages/system/src/ui/container.tsx`             | `8eeddcad33bb5e3e70e4c66ad33b41dbece83e3d`                   | `8eeddcad33bb5e3e70e4c66ad33b41dbece83e3d`                          | 是                                 |
| `packages/system/src/ui/ui.ts`                     | `04b98c0ce7ce04c24c97906f5dd7261b1f53907a`                   | `04b98c0ce7ce04c24c97906f5dd7261b1f53907a`                          | 是                                 |
| `packages-user/client-base/src/types.ts`           | `cdf7224dc39118665b00a9697c31e6f5ae7c4f84`                   | `cdf7224dc39118665b00a9697c31e6f5ae7c4f84`                          | 是                                 |
| `packages-user/client-modules/src/client.ts`       | `3156c76b4a6fc6262f353259955bd06b6220da60`                   | `3156c76b4a6fc6262f353259955bd06b6220da60`                          | 是                                 |
| `packages-user/client-modules/src/ui/func.ts`      | `bd7386412bc5e1c40e2cc06325a8f26809ad76`                     | `bd7386412bc5e1c40e2cc06325a8f26809ad76`                            | 是                                 |
| `src/bootstrap.ts`                                 | `e0f678e8103ccdbf0e02b071af18f000d6f64214`                   | `e0f678e8103ccdbf0e02b071af18f000d6f64214`                          | 是                                 |
| `src/client/ui/main.tsx`                           | `3dc4f096cd1750707ba5bf56ea5597903235da11`                   | `3dc4f096cd1750707ba5bf56ea5597903235da11`                          | 是                                 |
| `src/client/ui/inputBox.tsx`                       | `3eb246200ae3300f9f221a8e0e9142e5a612a696`                   | `3eb246200ae3300f9f221a8e0e9142e5a612a696`                          | 是                                 |
| `src/client/ui/title.tsx`                          | `9658447b77dc4c0a1bbd13a4266402f3a2d2b773`                   | `9658447b77dc4c0a1bbd13a4266402f3a2d2b773`                          | 是                                 |
| `src/client/ui/load.tsx`                           | `b41ec3ddc145beae79424234f51198d2d78b7fd8`                   | `b41ec3ddc145beae79424234f51198d2d78b7fd8`                          | 是                                 |
| `docs/.vitepress/components/renderDemo.vue`        | `8ed38a889ceb66ac06f2742f185e176adc010f35`                   | `8ed38a889ceb66ac06f2742f185e176adc010f35`                          | 是                                 |
| `docs/.vitepress/components/demos/basicRender.vue` | `1577085892cf6d6d4c77a0b45fe35bb5b612381e`                   | `1577085892cf6d6d4c77a0b45fe35bb5b612381e`                          | 是                                 |
| `docs/.vitepress/components/demos/uiSystem.vue`    | `6cf03bcd72e100d28e43622ee0a1a1724cfd7639`                   | `6cf03bcd72e100d28e43622ee0a1a1724cfd7639`                          | 是                                 |
| `docs/.vitepress/config.ts`                        | `4d66cfc87aee8cea8e7e2a9f523fbc677d5fce37`                   | `4d66cfc87aee8cea8e7e2a9f523fbc677d5fce37`                          | 是（本计划会修改，属例外）         |
| `docs/advanced/ii/index.md`                        | `df5bdfd3f228d7a5ea5380a9556f75d9c5b81871`                   | `df5bdfd3f228d7a5ea5380a9556f75d9c5b81871`                          | 是（本计划会修改措辞）             |
| `docs/advanced/index.md`                           | `13a29d69669acba40a3cdf9b248d02ce7e1f35d4`                   | `13a29d69669acba40a3cdf9b248d02ce7e1f35d4`                          | 是（本计划会修改措辞）             |
| `docs/tsconfig.json`                               | `07705ee1ccb588ca4c9b355b9981b0a929caeb35`                   | `07705ee1ccb588ca4c9b355b9981b0a929caeb35`                          | 是（本计划会修改 include，属例外） |
| `src/client/ui/choices.tsx`（HEAD）                | `1fbd21d16a0e30f0c10d0a94132268ee08f1ad76`                   | `1fbd21d16a0e30f0c10d0a94132268ee08f1ad76`（`git rev-parse HEAD:`） | 是                                 |
| `src/client/ui/choices.tsx`（工作树）              | Manifest I 记录为 `d6f13d798e89b15079497194bdb459505b5834ea` | `d6f13d798e89b15079497194bdb459505b5834ea`                          | 是（与 HEAD 不同，只允许接口参考） |

规则：任一文件实测哈希与 Manifest 不一致、或 `git status --porcelain -- <path>` 非空（`docs/.vitepress/config.ts`、`docs/tsconfig.json`、两份导览本计划自己要改，除外），立即停下向用户报告，不得按旧内容继续写作。

### 10-44 参考哈希复核（2026-10-31）

`git hash-object -- <path>` 实测结果：

| 路径                                             | 实测                                       | 与 Manifest | `git status` |
| ------------------------------------------------ | ------------------------------------------ | ----------- | ------------ |
| `packages/render/src/core/misc.ts`               | `3c19fd4d464df04a562a2951120df72ec6adbd2a` | 一致        | 干净         |
| `packages/render/src/core/item.ts`               | `1acd9193d1b0e3121af1dd74ccef25f3dcc7124f` | 一致        | 干净         |
| `packages/render/src/core/canvas2d.ts`           | `a9c80670c03866b95689413eaf7ed40781176c1d` | 一致        | 干净         |
| `packages/render/src/core/transform.ts`          | `c3f38c52843027ff49373da20c707fcf0091f25f` | 一致        | 干净         |
| `packages/render/src/assets/texture.ts`          | `545e2ca46494a99f2c93e33b4d0c1c84d5b4d8fa` | 一致        | 干净         |
| `packages/render/src/core/event.ts`              | `6a0999e6f4b7f3bf3084195a97411d87c884d98f` | 一致        | 干净         |
| `packages/render/src/core/container.ts`          | `e01b5122fc2d3685648c28db6932919c554c98d6` | 一致        | 干净         |
| `packages/system/src/hotkey/types.ts`            | `600432021f3f253730d3421fd1a5fb80fafd92e1` | 一致        | 干净         |
| `packages/system/src/hotkey/command.ts`          | `8d99e6a364943f34c962e7b6461a97f6d23e75ca` | 一致        | 干净         |
| `packages/system/src/hotkey/system.ts`           | `da87e18a7e6c8ae951f73bfaf7daf22a7a53e0c5` | 一致        | 干净         |
| `packages-user/client-base/src/hotkey/hotkey.ts` | `9344fabb5d902ad18482ede6277513998c5db2b1` | 一致        | 干净         |
| `packages-user/client-base/src/use/hotkey.ts`    | `75e7f716a7655301d969285e22388414db1eb3c3` | 一致        | 干净         |

结论：本计划涉及的全部参考文件与 Manifest 基线一致，工作树对本批参考路径无改动，可按现有内容写作。

## 写作硬规则

1. 目标读者完全没写过 UI；只讲写 UI 必需的 Vue 概念，不讲初始化。
2. 示例一律 TSX；条件写 `hidden` 或三元，循环写 `.map()`；`key` 只用于会重排/增删且需要保留身份的场景。
3. `hidden` = 不显示、不交互，保留元素与状态；三元会创建/销毁并重置状态。
4. 属性名一律 camelCase；容器自定义标签全批只写 `container-custom`。
5. UI 的 Props 只能 `extends IGameUIPropsBase, DefaultProps`，`props` 数组至少含 `controller` / `instance` / `state`。
6. `update:xxx` 只作为 `v-model:xxx` 的使用说明出现，不教手动监听事件属性。
7. 组件内按键用 `useKey(props.state.hotkey.system)!`，不加多余类型守卫。
8. 正文不出现渲染器类名、渲染器初始化、标签注册，也不出现以 core 开头的命名空间。
9. 不含 Thumbnail 与 Tip；`icon` / `winskin` / `map-render` 只作占位。
10. 不写源码实现叙述与仓库行号；目标页已存在才写 `./xxx.md#标题`，后续批次才创建的页只写纯文本。
11. 代码块是完整、结构正确的文件 / 类 / 函数级片段，注释尽量写；编辑器产物不手写。
12. 单 `#` H1，按「问题 → 系统模型 → 机制 → 接口 → 示例 → 边界」组织，末尾 `## 边界与注意`；文件 CRLF，写完跑 prettier。

## 门禁记录

### 10-43 门禁

- 首次全量构建：green。命令 `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`；输出 `build complete in 14.91s.`，无 dead link，仅有既有 chunk 体积警告。
- `docs/` 路径类型报错 0（`cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"`）；既有引擎报错 11 条（`packages/common/src/logger.ts` 缺 `main` 3 条、`packages/render/src/core/types.ts` 缺 `CanvasStyle` 8 条），既有、非本轮引入、不得修。

#### 10-43 六类门禁（Task 5）

| 门禁               | 命令                                                                                                                                                                     | 结论                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| prettier `--write` | `cmd /c "pnpm exec prettier --write docs/advanced/ii/ui docs/.vitepress/components/demos/ui docs/.vitepress/config.ts docs/advanced/ii/index.md docs/advanced/index.md"` | exit 0                                                                 |
| prettier `--check` | 同上路径 `--check`                                                                                                                                                       | `All matched files use Prettier code style!`                           |
| ESLint             | `cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"`                                                                                                          | exit 0，0 error / 0 warning；渲染属性保持 camelCase                    |
| docs 类型          | `cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"`                                                                                                              | `docs/` 路径类型报错 0；既有引擎报错 11 条（既有、非本轮引入、不得修） |
| 静态断言           | 6 篇正文 + 5 个 demo + 侧边栏 + `custom` 数组 + 兄弟分组                                                                                                                 | `STATIC-OK`                                                            |
| 全量构建           | `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`                                                                                                      | green，`build complete in 15.25s.`，无 dead link                       |

docs/ 路径类型报错 0；既有引擎报错 11 条（既有、非本轮引入、不得修）。

静态断言明细：6 篇均为单 H1、含 `## 边界与注意`、无被禁写法、`<ClientOnly>` + 动态 loader、CRLF；5 个 demo 默认导出、无 DOM 属性、CRLF；4 个 demo 零引擎 import，`text-demo` 仅允许 `@motajs/render` 的 `Font` 且为位置参数 `new Font('Verdana', 32, 'px', 700)`、无 `Font.defaults`；侧边栏 6 条链接齐全；`custom` 数组同时含 `container-custom` 与 `custom-container`；高级 II 既有条目与高级 III 分组未丢。

#### 本批清单（6 篇 + 5 个 demo）

| 页面                                               | live       | demo                                                     |
| -------------------------------------------------- | ---------- | -------------------------------------------------------- |
| `docs/advanced/ii/ui/ui-template.md`               | 是         | `docs/.vitepress/components/demos/ui/template-demo.tsx`  |
| `docs/advanced/ii/ui/ui-template-ts.md`            | 是（复用） | `docs/.vitepress/components/demos/ui/template-demo.tsx`  |
| `docs/advanced/ii/ui/container-and-coordinates.md` | 是         | `docs/.vitepress/components/demos/ui/container-demo.tsx` |
| `docs/advanced/ii/ui/basic-shapes.md`              | 是         | `docs/.vitepress/components/demos/ui/shapes-demo.tsx`    |
| `docs/advanced/ii/ui/curves-and-paths.md`          | 是         | `docs/.vitepress/components/demos/ui/curves-demo.tsx`    |
| `docs/advanced/ii/ui/text.md`                      | 是         | `docs/.vitepress/components/demos/ui/text-demo.tsx`      |

### 10-44 门禁

| 门禁               | 命令                                                                                                                    | 结论                                                                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prettier `--write` | `cmd /c "pnpm exec prettier --write docs/advanced/ii/ui docs/.vitepress/components/demos/ui docs/.vitepress/config.ts"` | exit 0                                                                                                                                                                            |
| prettier `--check` | 同上路径 `--check`                                                                                                      | `All matched files use Prettier code style!`                                                                                                                                      |
| ESLint             | `cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"`                                                         | exit 0，0 error / 0 warning                                                                                                                                                       |
| docs 类型          | `cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"`                                                             | `docs/` 路径类型报错 0；既有引擎报错 11 条（`packages/common/src/logger.ts` 缺 `main` 3 条、`packages/render/src/core/types.ts` 缺 `CanvasStyle` 8 条，既有、非本轮引入、不得修） |
| 静态断言           | 6 篇正文 + 5 个 demo + 侧边栏 + 回填链接 + 兄弟分组                                                                     | `STATIC-OK`                                                                                                                                                                       |
| 全量构建           | `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`                                                     | green，`build complete in 15.35s.`，无 dead link                                                                                                                                  |

docs/ 路径类型报错 0；既有引擎报错 11 条（与本轮无关，保持不动）。

静态断言明细：6 篇均为单 H1、含 `## 边界与注意`、无被禁写法、CRLF；五篇 live 有 `<ClientOnly>` + 动态 loader，按键篇无 live；5 个 demo 默认导出、无 DOM 属性；4 个 demo 零引擎 import，`texture-demo` 仅 import `@motajs/render` 的 `Texture`；侧边栏 12 条链接齐全（本批 6 条 + 10-43 的 6 条），`custom-range` 与高级 III 分组未丢；第 3 篇 `./layer-transform-performance.md` 与第 4 篇 `./events.md` 的回填链接均已生效。

交叉一致性：第 8 篇与第 12 篇对 `hidden` 的表述一致，均为「不显示、不交互」+「保留元素与状态」+「跳过绘制与命中」；第 6 篇对第 17 篇、第 9 篇对第 13 篇仍是纯文本前瞻引用，本批未引入任何指向未创建页面的链接。

#### 本批清单（6 篇 + 5 个 demo）

| 页面                                                    | live                       | demo                                                       |
| ------------------------------------------------------- | -------------------------- | ---------------------------------------------------------- |
| `docs/advanced/ii/ui/image-and-texture.md`              | 是                         | `docs/.vitepress/components/demos/ui/texture-demo.tsx`     |
| `docs/advanced/ii/ui/layer-transform-performance.md`    | 是                         | `docs/.vitepress/components/demos/ui/layer-demo.tsx`       |
| `docs/advanced/ii/ui/reactivity.md`                     | 是                         | `docs/.vitepress/components/demos/ui/reactivity-demo.tsx`  |
| `docs/advanced/ii/ui/events.md`                         | 是                         | `docs/.vitepress/components/demos/ui/events-demo.tsx`      |
| `docs/advanced/ii/ui/hotkey-in-ui.md`                   | 否（文档站无游戏按键系统） | —                                                          |
| `docs/advanced/ii/ui/conditional-and-list-rendering.md` | 是                         | `docs/.vitepress/components/demos/ui/conditional-demo.tsx` |

## 人工验证记录

（由 Task 6 追加；本轮在 10-48 独立读者审阅与 10-49 用户修订前停下，live 人工验证待最终人工审阅。

live 人工验证（10-43）：待最终人工审阅。本轮未写「用户人工验证：通过」，也未把 live 关卡标记为完成。）

## 10-44 命名确认

用户确认（10-44）：可以执行
用户原文：可以执行（批准执行 10-43..10-47；10-48 的读者/用户审阅前停下）

- 纹理方案：用 `document.createElement('canvas')` 画一个棋盘，再包成 `Texture`（Task 0 推荐方案，用户已随全局批准一并确认）。
- 按键篇 live：不配 live。文档站没有游戏的按键系统，配一个仅监听浏览器键盘的示例会误导读者；正文用一句话说明原因。
- 6 篇文件名与侧边栏显示名（沿用命名总表）：`image-and-texture.md`「图片与最小纹理」、`layer-transform-performance.md`「层级、变换与性能」、`reactivity.md`「响应式」、`events.md`「事件与交互」、`hotkey-in-ui.md`「按键与快捷键」、`conditional-and-list-rendering.md`「条件渲染与循环渲染」。
- 5 个 demo：`texture-demo.tsx`（`TextureDemo`）、`layer-demo.tsx`（`LayerDemo`）、`events-demo.tsx`（`EventsDemo`）、`reactivity-demo.tsx`（`ReactivityDemo`）、`conditional-demo.tsx`（`ConditionalDemo`）。
- 基线：HEAD `b94b4c3b41da8184312bc9f264654dc9a54adf69`；参考清单哈希复核见上节「10-44 参考哈希复核」。

live 人工验证（10-44）：待最终人工审阅。本轮未写「用户人工验证：通过」，也未把 live 关卡标记为完成。

## 10-45 命名确认

用户确认（10-45）：可以执行
用户原文：可以执行（批准执行 10-43..10-47；10-48 的读者/用户审阅前停下）

- 四篇文件名与侧边栏显示名（沿用命名总表）：`props.md`「props」、`component-tsx.md`「组件（TSX）」、`component-ts.md`「组件（TS 直调）」、`slots-and-attrs.md`「slots 与 attrs」。
- 第 14 篇示例组件选型：带选中态的道具格子（`ItemCell`），与第 23 篇完整示例复用同一概念。
- 两条界线都单独设小节：第 14 篇「组件与 UI 的区别」、第 15 篇「组件 vs 元素层类」，各控制在半页内。
- 4 个 demo：`props-demo.tsx`（`PropsDemo`）、`component-demo.tsx`（`ComponentDemo`）、`ts-component-demo.tsx`（`TsComponentDemo`）、`slots-demo.tsx`（`SlotsDemo`）。
- 基线：HEAD `b94b4c3b41da8184312bc9f264654dc9a54adf69`。

### 10-45 参考哈希复核（2026-10-31）

`git hash-object -- <path>` 实测结果：

| 路径                                                   | 实测                                       | 与 Manifest | `git status`   |
| ------------------------------------------------------ | ------------------------------------------ | ----------- | -------------- |
| `packages/render-vue/src/types.ts`                     | `a90549e8c3bf07e5069107c414086edde65270b0` | 一致        | 干净           |
| `packages/render-vue/src/props.ts`                     | `27e0f9f3bb2fa63bf2d9d358af87078eebe56053` | 一致        | 干净           |
| `packages/render/src/core/item.ts`                     | `1acd9193d1b0e3121af1dd74ccef25f3dcc7124f` | 一致        | 干净           |
| `packages/render/src/core/container.ts`                | `e01b5122fc2d3685648c28db6932919c554c98d6` | 一致        | 干净           |
| `packages/render/src/core/custom.ts`                   | `440163608dec8818f0e2320d0b415a62e2061242` | 未列入基线  | 干净           |
| `packages/render/src/core/canvas2d.ts`                 | `a9c80670c03866b95689413eaf7ed40781176c1d` | 一致        | 干净           |
| `packages-user/client-base/src/types.ts`               | `cdf7224dc39118665b00a9697c31e6f5ae7c4f84` | 一致        | 干净           |
| `packages-user/client-base/src/components/input.tsx`   | `bfe65b06b9600f80a4d74f6ef222e55d13d09134` | 未列入基线  | 干净           |
| `packages-user/client-base/src/components/textbox.tsx` | `5b58de65007189314553be0aca48209bd9e25981` | 未列入基线  | 干净           |
| `docs/.vitepress/config.ts`                            | 本计划要改                                 | 属例外      | 已修改（前批） |
| `docs/advanced/ii/ui/reactivity.md`                    | 10-44 新建                                 | 未列入基线  | 未跟踪         |

结论：本计划涉及的参考文件与基线一致，工作树对本批参考路径无越界改动，可按现有内容写作。

### 10-45 门禁

| 门禁               | 命令                                                                                                                    | 结论                                                                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prettier `--write` | `cmd /c "pnpm exec prettier --write docs/advanced/ii/ui docs/.vitepress/components/demos/ui docs/.vitepress/config.ts"` | exit 0                                                                                                                                                                            |
| prettier `--check` | 同上路径 `--check`                                                                                                      | `All matched files use Prettier code style!`                                                                                                                                      |
| ESLint             | `cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"`                                                         | exit 0，0 error / 0 warning                                                                                                                                                       |
| docs 类型          | `cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"`                                                             | `docs/` 路径类型报错 0；既有引擎报错 11 条（`packages/common/src/logger.ts` 缺 `main` 3 条、`packages/render/src/core/types.ts` 缺 `CanvasStyle` 8 条，既有、非本轮引入、不得修） |
| 静态断言           | 4 篇正文 + 4 个 demo + 侧边栏 16 条 + 回填链接 + 兄弟分组                                                               | `STATIC-OK`                                                                                                                                                                       |
| 全量构建           | `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`                                                     | green，`build complete in 15.76s.`，无 dead link                                                                                                                                  |

`docs/` 路径类型报错 0；既有引擎报错 11 条（与本轮无关，保持不动）。

静态断言明细：4 篇均为单 H1、含 `## 边界与注意`、无被禁写法、`<ClientOnly>` + 动态 loader、CRLF；4 个 demo 默认导出、无 DOM 属性、零引擎 import；侧边栏「组件化」4 条齐全（本批 4 条 + 前三批 12 条，共 16 条），`custom-range` 与高级 III 分组未丢；第 9 篇 `reactivity.md` 对第 13 篇的引用已回填为 `./props.md` 链接。

交叉一致性：第 13 篇的 `props` 声明（`props` 数组 + `satisfies SetupComponentOptions`）与第 14 篇的组件实现使用同一套写法；第 1 篇与第 14 篇的 UI 判定三要素表述一致，均为 Props 同时继承 `IGameUIPropsBase` 与 `DefaultProps`、`props` 数组包含 `controller` / `instance` / `state`、被 `GameUI` 注册。

#### 本批清单（4 篇 + 4 个 demo）

| 页面                                     | live | demo                                                        |
| ---------------------------------------- | ---- | ----------------------------------------------------------- |
| `docs/advanced/ii/ui/props.md`           | 是   | `docs/.vitepress/components/demos/ui/props-demo.tsx`        |
| `docs/advanced/ii/ui/component-tsx.md`   | 是   | `docs/.vitepress/components/demos/ui/component-demo.tsx`    |
| `docs/advanced/ii/ui/component-ts.md`    | 是   | `docs/.vitepress/components/demos/ui/ts-component-demo.tsx` |
| `docs/advanced/ii/ui/slots-and-attrs.md` | 是   | `docs/.vitepress/components/demos/ui/slots-demo.tsx`        |

live 人工验证（10-45）：待最终人工审阅。本轮未写「用户人工验证：通过」，也未把 live 关卡标记为完成。

## 10-46 命名确认

用户确认（10-46）：可以执行
用户原文：可以执行（批准执行 10-43..10-47；10-48 的读者/用户审阅前停下）

- 五篇文件名与侧边栏显示名（沿用命名总表）：`builtin-text-and-input.md`「内置组件：文本与输入」、`builtin-list-and-containers.md`「内置组件：列表与容器」、`ui-controller-and-stack.md`「UIController 与 UI 栈」、`replace-builtin-ui.md`「修改 / 替换内置 UI」、`ui-performance.md`「UI 系统性能与注意事项」。
- 契约取舍：示例为主 + 常用项表；`TextContent` 的 `width` 必填、`autoHeight`、`Input` 的 `v-model:value`、`List` 的 `v-model:selected`、`Scroll` 只对直接子元素生效这几条写全（Task 0 推荐方案，用户已随全局批准一并确认）。
- 第 20 篇力度：只讲「打开处替换 / 包装组件 / 显示策略与背景」三种改法，不复制源码（研究 Q5 推荐方案，随全局批准确认）。
- `Choices` 命名：正文标题用 `Choices（选项框）`，并注明「用户习惯叫 `ChoicesBox`，源码导出名是 `Choices` / `ChoicesUI`」（研究 Q6 推荐方案，随全局批准确认）。
- 5 个 demo：`builtin-text-demo.tsx`（`BuiltinTextDemo`）、`builtin-list-demo.tsx`（`BuiltinListDemo`）、`controller-demo.tsx`（`ControllerDemo`）、`strategy-demo.tsx`（`StrategyDemo`）、`perf-demo.tsx`（`PerfDemo`）。
- 落点：`docs/advanced/ii/ui/` 五篇；侧边栏「内置组件与 UI 系统」分组 5 条；demo 在 `docs/.vitepress/components/demos/ui/`。
- 修改方式：正文 / demo / 文档由 GSD 执行器（子代理）执行，未内联改动源码；未调用 `opencode` 命令；不 commit。
- 基线：HEAD `b94b4c3b41da8184312bc9f264654dc9a54adf69`；参考哈希复核见下节。

### 10-46 参考哈希复核（2026-10-31）

`git hash-object -- <path>` 实测结果：

| 路径                                                   | 实测                                       | 与 Manifest        | `git status`          |
| ------------------------------------------------------ | ------------------------------------------ | ------------------ | --------------------- |
| `packages-user/client-base/src/components/textbox.tsx` | `5b58de65007189314553be0aca48209bd9e25981` | 一致               | 干净                  |
| `packages-user/client-base/src/components/list.tsx`    | `a6723454788b8fff22389bc5d19883c90a4eb5b5` | 一致               | 干净                  |
| `packages-user/client-base/src/components/page.tsx`    | `b18520460dd335385be901e535f222eedcb9941e` | 一致               | 干净                  |
| `packages-user/client-base/src/components/scroll.tsx`  | `809af86b816bdad643292afce85e106886dd5a99` | 一致               | 干净                  |
| `packages-user/client-base/src/components/input.tsx`   | `bfe65b06b9600f80a4d74f6ef222e55d13d09134` | 一致               | 干净                  |
| `packages-user/client-base/src/components/misc.tsx`    | `365e826610678276599e71f4f69ff42e30daef7f` | 一致               | 干净                  |
| `packages/system/src/ui/controller.ts`                 | `25c3ea6f2bb3877989c65f25d3fc6dc3288ead7a` | 一致               | 干净                  |
| `packages/system/src/ui/ui.ts`                         | `04b98c0ce7ce04c24c97906f5dd7261b1f53907a` | 一致               | 干净                  |
| `packages/system/src/ui/instance.ts`                   | `11a6ce881e5f1de32f232fd07c7bbc09a9e56203` | 一致               | 干净                  |
| `packages/system/src/ui/container.tsx`                 | `8eeddcad33bb5e3e70e4c66ad33b41dbece83e3d` | 一致               | 干净                  |
| `packages/system/src/ui/types.ts`                      | `2a24550a6a3f8dade44524f7be2564f7d7957551` | 一致               | 干净                  |
| `packages-user/client-modules/src/ui/func.ts`          | `bd7386412bc5e1c40e2cc06325a8f26809ad76`   | 一致               | 干净                  |
| `packages-user/client-modules/src/client.ts`           | `3156c76b4a6fc6262f353259955bd06b6220da60` | 一致               | 干净                  |
| `src/client/ui/inputBox.tsx`                           | `3eb246200ae3300f9f221a8e0e9142e5a612a696` | 一致               | 干净                  |
| `src/client/ui/choices.tsx`（HEAD）                    | `1fbd21d16a0e30f0c10d0a94132268ee08f1ad76` | 一致               | —                     |
| `src/client/ui/choices.tsx`（工作树，仅接口参考）      | `d6f13d798e89b15079497194bdb459505b5834ea` | 与 Manifest I 一致 | `M`（既有改动，未碰） |

结论：本计划涉及的全部参考文件与 Manifest / NOTES 基线一致；`choices.tsx` 工作树哈希仍为 `d6f13d7…`，未再变化，只读 props / emits / 函数签名。可按现有内容写作。

### 10-46 门禁

| 门禁               | 命令                                                                                                                    | 结论                                                                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prettier `--write` | `cmd /c "pnpm exec prettier --write docs/advanced/ii/ui docs/.vitepress/components/demos/ui docs/.vitepress/config.ts"` | exit 0                                                                                                                                                                            |
| prettier `--check` | 同上路径 `--check`                                                                                                      | `All matched files use Prettier code style!`                                                                                                                                      |
| ESLint             | `cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"`                                                         | exit 0，0 error / 0 warning                                                                                                                                                       |
| docs 类型          | `cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"`                                                             | `docs/` 路径类型报错 0；既有引擎报错 11 条（`packages/common/src/logger.ts` 缺 `main` 3 条、`packages/render/src/core/types.ts` 缺 `CanvasStyle` 8 条，既有、非本轮引入、不得修） |
| 静态断言           | 5 篇正文 + 5 个 demo + 侧边栏 21 条 + 回填链接 + 兄弟分组                                                               | `STATIC-OK`                                                                                                                                                                       |
| 全量构建           | `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`                                                     | green，`build complete in 21.10s.`，无 dead link                                                                                                                                  |

`docs/` 路径类型报错 0；既有引擎报错 11 条（与本轮无关，保持不动）。

静态断言明细：5 篇均为单 H1、含 `## 边界与注意`、无被禁写法、`<ClientOnly>` + 动态 loader、CRLF；5 个 demo 默认导出、无 DOM 属性、无引擎 / 用户包 import；侧边栏「内置组件与 UI 系统」5 条齐全（本批 5 条 + 前三批 16 条，共 21 条），`custom-range` 与高级 III 分组未丢；第 6 篇 `text.md` 与第 16 篇 `slots-and-attrs.md` 对第 17 篇的引用已回填为 `./builtin-text-and-input.md` 链接；第 8、12、21 篇的 `hidden` 表述都含「不显示、不交互」。

交叉一致性：第 19 篇「没有全局注册 / 覆盖入口」与第 20 篇「没有全局替换接口」表述一致；第 17 篇 `v-model:value`、第 18 篇 `v-model:selected` 与第 13 篇的 `v-model:xxx` 口径一致。

#### 本批清单（5 篇 + 5 个 demo）

| 页面                                                 | live               | demo                                                        |
| ---------------------------------------------------- | ------------------ | ----------------------------------------------------------- |
| `docs/advanced/ii/ui/builtin-text-and-input.md`      | 是（等价元素演示） | `docs/.vitepress/components/demos/ui/builtin-text-demo.tsx` |
| `docs/advanced/ii/ui/builtin-list-and-containers.md` | 是（等价元素演示） | `docs/.vitepress/components/demos/ui/builtin-list-demo.tsx` |
| `docs/advanced/ii/ui/ui-controller-and-stack.md`     | 是                 | `docs/.vitepress/components/demos/ui/controller-demo.tsx`   |
| `docs/advanced/ii/ui/replace-builtin-ui.md`          | 是                 | `docs/.vitepress/components/demos/ui/strategy-demo.tsx`     |
| `docs/advanced/ii/ui/ui-performance.md`              | 是                 | `docs/.vitepress/components/demos/ui/perf-demo.tsx`         |

#### 已知限制（10-46）

- `packages-user/client-base/src/renderer` 在当前工作树不存在（`elements/index.ts` 与 `components/misc.tsx` 的 `../renderer` 引用未解析；属既有中间态，非本轮引入）。因此文档站无法静态 import `@user/client-base` 的内置组件（会触发 `Could not resolve "../renderer"`），任何内置组件 import 都会使 `pnpm docs:build` 失败。
- 处理：两篇内置组件正文保留真实代码块；`builtin-text-demo.tsx` / `builtin-list-demo.tsx` 用等价渲染元素演示交互，并在正文「运行效果」写明「文档站缺少完整客户端环境，示例用等价元素演示」。
- 未改 `packages/` / `packages-user/` / `src/`，未绕过断言。

live 人工验证（10-46）：待最终人工审阅。本轮未写「用户人工验证：通过」，也未把 live 关卡标记为完成。

## 10-47 命名确认

用户确认（10-47）：可以执行
用户原文：可以执行（批准执行 10-43..10-47；10-48 的读者/用户审阅前停下）

- 六篇文件名与侧边栏显示名（沿用命名总表）：`inventory-example-1-skeleton.md`「示例（一）目标与骨架」、`inventory-example-2-grid.md`「示例（二）道具网格」、`inventory-example-3-detail.md`「示例（三）详情区」、`inventory-example-4-scroll.md`「示例（四）滚动与列表」、`inventory-example-5-state.md`「示例（五）交互与状态」、`inventory-example-6-animation-and-register.md`「示例（六）动画、拆分与注册」。
- 6 个 demo：`inventory-1-skeleton.tsx`（`Inventory1Skeleton`）、`inventory-2-grid.tsx`（`Inventory2Grid`）、`inventory-3-detail.tsx`（`Inventory3Detail`）、`inventory-4-scroll.tsx`（`Inventory4Scroll`）、`inventory-5-state.tsx`（`Inventory5State`）、`inventory-6-full.tsx`（`Inventory6Full`）。
- 组件拆分（第 22 篇定下，第 27 篇只回顾不改变）：`InventoryPanel` / `ItemGrid` / `ItemCell` / `ItemDetail` / `ActionBar`。
- 面板尺寸：720×480 根容器；假数据 10 个道具，只用 `g-rect` / `g-rectr` / `text` 绘制图标与名称，不引入真实素材。
- 第 25 篇取舍：`Scroll` 平铺为主，末尾用 `ListPage` 做「左列表右详情」对比，并给 `Scroll` / `ListPage` / `Page` 判定表。
- 第 27 篇注册：`export const InventoryUI = new GameUI('inventory-panel', InventoryPanel)`，打开处替换；不写全局注册表。
- 落点：正文 `docs/advanced/ii/ui/` 六篇；demo 在 `docs/.vitepress/components/demos/ui/`；侧边栏「完整示例」分组 6 条。
- 修改方式：正文 / demo / 文档由 GSD 执行器执行，未内联改动源码；未调用 `opencode` 命令；不 commit。
- 基线：HEAD `b94b4c3b41da8184312bc9f264654dc9a54adf69`；参考哈希复核见下节。

### 10-47 参考哈希复核（2026-10-31）

`git hash-object -- <path>` 实测结果：

| 路径                                                   | 实测                                       | 与 Manifest | `git status` |
| ------------------------------------------------------ | ------------------------------------------ | ----------- | ------------ |
| `packages/render/src/core/item.ts`                     | `1acd9193d1b0e3121af1dd74ccef25f3dcc7124f` | 一致        | 干净         |
| `packages/render/src/core/container.ts`                | `e01b5122fc2d3685648c28db6932919c554c98d6` | 一致        | 干净         |
| `packages/render-vue/src/props.ts`                     | `27e0f9f3bb2fa63bf2d9d358af87078eebe56053` | 一致        | 干净         |
| `packages/system/src/ui/controller.ts`                 | `25c3ea6f2bb3877989c65f25d3fc6dc3288ead7a` | 一致        | 干净         |
| `packages/system/src/ui/ui.ts`                         | `04b98c0ce7ce04c24c97906f5dd7261b1f53907a` | 一致        | 干净         |
| `packages-user/client-base/src/components/list.tsx`    | `a6723454788b8fff22389bc5d19883c90a4eb5b5` | 一致        | 干净         |
| `packages-user/client-base/src/components/scroll.tsx`  | `809af86b816bdad643292afce85e106886dd5a99` | 一致        | 干净         |
| `packages-user/client-base/src/components/textbox.tsx` | `5b58de65007189314553be0aca48209bd9e25981` | 一致        | 干净         |
| `packages-user/client-base/src/use/hotkey.ts`          | `75e7f716a7655301d969285e22388414db1eb3c3` | 一致        | 干净         |
| `packages-user/client-modules/src/render/use.ts`       | `81d764410093a9baa5ad073dc6002ff2942d2d5f` | 未列入基线  | 干净         |

结论：本计划涉及的全部参考文件与 Manifest / NOTES 基线一致，工作树对本批参考路径无改动，可按现有内容写作。

### 10-47 门禁

| 门禁               | 命令                                                                                                                    | 结论                                                                                                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| prettier `--write` | `cmd /c "pnpm exec prettier --write docs/advanced/ii/ui docs/.vitepress/components/demos/ui docs/.vitepress/config.ts"` | exit 0                                                                                                                                                                            |
| prettier `--check` | 同上路径 `--check`                                                                                                      | `All matched files use Prettier code style!`                                                                                                                                      |
| ESLint             | `cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"`                                                         | exit 0，0 error / 0 warning                                                                                                                                                       |
| docs 类型          | `cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"`                                                             | `docs/` 路径类型报错 0；既有引擎报错 11 条（`packages/common/src/logger.ts` 缺 `main` 3 条、`packages/render/src/core/types.ts` 缺 `CanvasStyle` 8 条，既有、非本轮引入、不得修） |
| 静态断言           | 6 篇正文 + 6 个 demo + 侧边栏 27 条 + 兄弟分组 + 第 22/27 篇组件名                                                      | `STATIC-OK`                                                                                                                                                                       |
| 全量构建           | `cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`                                                     | green，`build complete in 24.63s.`，无 dead link                                                                                                                                  |

`docs/` 路径类型报错 0；既有引擎报错 11 条（与本轮无关，保持不动）。

静态断言明细：6 篇均为单 H1、含 `## 边界与注意`、无被禁写法、`<ClientOnly>` + 动态 loader、CRLF；6 个 demo 默认导出、无 DOM 属性、只 import vue（无其它引擎 / 用户包 import）；侧边栏 27 条链接共 27 次出现、27 个唯一值、无重复，`custom-range` 与高级 III 分组未丢；第 22 与第 27 篇的五个组件名一致。

#### 本批清单（6 篇 + 6 个 demo）

| 页面                                                                | live           | demo                                                           |
| ------------------------------------------------------------------- | -------------- | -------------------------------------------------------------- |
| `docs/advanced/ii/ui/inventory-example-1-skeleton.md`               | 是             | `docs/.vitepress/components/demos/ui/inventory-1-skeleton.tsx` |
| `docs/advanced/ii/ui/inventory-example-2-grid.md`                   | 是             | `docs/.vitepress/components/demos/ui/inventory-2-grid.tsx`     |
| `docs/advanced/ii/ui/inventory-example-3-detail.md`                 | 是             | `docs/.vitepress/components/demos/ui/inventory-3-detail.tsx`   |
| `docs/advanced/ii/ui/inventory-example-4-scroll.md`                 | 是             | `docs/.vitepress/components/demos/ui/inventory-4-scroll.tsx`   |
| `docs/advanced/ii/ui/inventory-example-5-state.md`                  | 是             | `docs/.vitepress/components/demos/ui/inventory-5-state.tsx`    |
| `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` | 是（完整面板） | `docs/.vitepress/components/demos/ui/inventory-6-full.tsx`     |

### 全批交叉核对

① 27 篇是否都在侧边栏出现且无重复：是。`config.ts` 中 `/advanced/ii/ui/` 链接共 27 次出现、27 个唯一值，无重复。
② 六个 Part 分组的顺序：是。依次为起步、元素与布局、交互与数据、组件化、内置组件与 UI 系统、完整示例，与 10-43 命名总表一致。
③ `hidden` 口径：一致。第 8 / 12 / 21 / 24 篇均为「不显示、不交互」+「保留元素与状态」+「跳过绘制与命中」。
④ `v-model:xxx` 口径：一致。第 13 篇规定 `update:xxx` 只随 `v-model:xxx` 出现；第 17 篇 `v-model:value`、第 18 篇 `v-model:selected` 均按此写。
⑤ 第 22 与第 27 篇的组件拆分：一致。均为 `InventoryPanel` / `ItemGrid` / `ItemCell` / `ItemDetail` / `ActionBar`。
⑥ 被禁写法：本批 6 篇静态断言未命中 `custom-container`、渲染器类名、`createRendererFor`、`registerElement`、`IUIPropsBase`、core 命名空间、`onUpdate:`、模板条件/循环/隐藏指令属性、`GameUI.get`。

live 人工验证（10-47）：待最终人工审阅。本轮未写「用户人工验证：通过」，也未把 live 关卡标记为完成。

## 10-48 / 10-49 拆分说明（2026-10-31）

原 `10-48-PLAN.md` 合并了「独立读者审阅 + 用户主导修订 + 最终门禁 + 落位评估 + 收尾」六件事。按用户要求拆成两个可独立执行的计划：

- `10-48-PLAN.md`：只做独立读者审阅（D-46 第 1 阶段 / D-89），只产出 `10-48-READER-REVIEW.md`；不改正文、不做 live 目视验证、不写 SUMMARY / ROADMAP / STATE、不 commit。审阅前后记录 docs 哈希快照，证明审阅期间正文零改动。
- `10-49-PLAN.md`：用户逐条裁决 10-48 的问题并修订，随后跑最终门禁、全站 live 复验、落位评估与收尾（`10-49-USER-REVIEW.md` / `10-49-SUMMARY.md` / ROADMAP / STATE）。

本批范围仍为 27 篇正文 + 25 个 demo；10-43..10-47 已执行完成，10-48 / 10-49 未执行。此前记录的「live 人工验证（10-4X）：待最终人工审阅」统一由 10-49 Task 4 的全站 live 复验覆盖，不再为前五批单独补标记。

## 计划顺延说明（2026-10-31，pre-review 修复）

用户要求在独立审阅前先完成三项修复，计划编号顺延如下；本节只记录新编号，不改写上面的历史记录与用户原话：

- `10-48-PLAN.md`：**pre-review 修复**（新增）。删去 `ui-template-ts.md`、`component-ts.md` 与 `ts-component-demo.tsx`，内联简短 TS 元素层演示，去掉全局 `client`，给 25 篇正文与 24 个 demo 补注释；不改 ROADMAP / STATE、不写 SUMMARY、不 commit。
- `10-49-PLAN.md`：**独立读者审阅**（原 10-48）。只读修复后的 25 篇 Markdown，只提问、只记录使用概率，不改正文；产出 `10-49-READER-REVIEW.md`。
- `10-50-PLAN.md`：**用户修订 + 最终门禁 + 落位评估 + 收尾**（原 10-49）。产出 `10-50-USER-REVIEW.md` / `10-50-SUMMARY.md`，并在最终门禁中使用 25 篇 / 24 个 demo / 25 个 HTML。

修复后的计数为 **25 篇正文 + 24 个 demo**；上面的 27 篇 / 25 个 demo 记录是修复前的历史状态。历史文本中的 10-48 / 10-49 指当时的审阅 / 修订计划；自本节起，10-48 为 pre-review 修复、10-49 为独立读者审阅、10-50 为用户修订与收尾，以本节为准。

## 10-48 pre-review 修复

用户确认（10-48）：可以执行

用户原文（2026-10-31）：「可以执行」，批准三项修复：删除独立 TS 页并内联 TS 片段、`client` 改为 `props.state`、补注释。

修复范围：①删去 2 篇独立 TS 页与 1 个 TS demo 并内联 TS 片段；②去掉全局 client、改用 props.state；③给 25 篇正文代码块与 24 个 demo 补注释。
删除清单：docs/advanced/ii/ui/ui-template-ts.md、docs/advanced/ii/ui/component-ts.md、docs/.vitepress/components/demos/ui/ts-component-demo.tsx
基线 HEAD（10-48 记录）：b94b4c3b41da8184312bc9f264654dc9a54adf69
修复前 docs 快照哈希：31439e8621b5723687d08550618f56db530c2d794531d599190820aaafcfdd59
修复前 demo 快照哈希：86611ab1ff9bd572ef7be06dc0fa1b6bc5e2f99d50b261846a5f0fccedd5b6de
ROADMAP 受保护行哈希：a9b74dcdc8be21ab1aa98a7b63fc81527c69a376ddb6e20509eeb7a792d70532
ROADMAP 全文哈希：fecfd9b5d7cd71389d58de9345efd6188649b0c7083f5d617d9cbc72563ee04a
STATE 全文哈希：e4731f2b66115eb43d9b185634c2d86802ef6c2638201558c98d917e133c3591
删除完成：3 个文件
页面计数（删除后）：25
demo 计数（删除后）：24

Part 0-1 注释前代码哈希：9d9594b907a9a54d504a88a6136a17481394c11223838d872672c7f56dfb5a2e
Part 0-1 注释后代码哈希：9d9594b907a9a54d504a88a6136a17481394c11223838d872672c7f56dfb5a2e

Part 2-5 注释前代码哈希：dca838e1e7d86fa67dc9b1a47e57a36b6e2e43b6d87576b4fe8e29d877f5a750
Part 2-5 注释后代码哈希：dca838e1e7d86fa67dc9b1a47e57a36b6e2e43b6d87576b4fe8e29d877f5a750

修复后 docs 快照哈希：d0acf96d440f9796135455e49d4da78ba290c5bc8772f7a92d45e24e2cd13738
修复后 demo 快照哈希：faff7a51416094cf058ec666d8f12246833ca102936fd832012b395bf47bfd36
页面计数：25
demo 计数：24
构建产物：25
10-48 门禁：prettier 通过；ESLint 0/0；docs 类型 0 报错；构建 green；0 dead link；25 HTML；静态断言通过。
停止点：10-48 修复结束，未进入 10-49 独立审阅；未改 ROADMAP / STATE；未写 SUMMARY；未 commit。

## 10-48 执行偏差（2026-10-31）

- 计划内 verify 脚本 bug：T1 oreach( in @(...)) 少一个右括号，运行前补 )，断言语义不变。
- 计划内 verify 脚本 bug：T3/T4/T5 的
  ode -e $js 在 PowerShell 5.1 下引号丢失，改为 $js | node -；T5 因脚本含中文改用临时 UTF-8 文件执行。
- 计划内 verify 脚本 bug：T5 聚合函数 const agg=fs=>... 参数遮蔽 s 模块，参数改名为 list。
- 计划内 verify 脚本 bug：T5 构建调用在 ErrorActionPreference=Stop 下被原生 stderr 中止，仅在构建调用前后临时设为 Continue。
- 执行中误删 events.md 一个代码围栏，已恢复；恢复后 Part 2-5 去注释聚合哈希与基线完全一致，证明非注释代码未变。
- 元素层实际 API 没有 loc() 方法（loc 只是 TSX 属性，对应 pos() + size()）；六处内联 s 片段统一用 pos() / size()，与 packages/render 一致。

## 10-49 独立读者审阅

用户原话（10-49，2026-11-01）：「到第二天了，继续」
用户要求（10-49，2026-11-01）：独立人格审阅由 orchestrator 分别派发多个子代理编排，不允许一个子代理包办。
本次执行范围（10-49）：只做 Task 0 记录与 Task 1 审阅前基线；不派发读者、不执行 Task 2 / Task 3。
审阅范围：docs/advanced/ii/ui/ 下 25 篇 Markdown（Part 0→5）+ docs/advanced/ii/index.md + docs/advanced/index.md 两份导览；只读 Markdown，不读源码；不做 live 目视验证。
读者人格（逐字）：你是一位刚读完中级教程、想给自己的魔塔做一套自定义界面的作者。你完全没写过 UI，不知道 canvas 是什么，也不会 Vue 的组件写法；你只掌握了基础 TS/JS、函数、对象、数组和一点点模板语法。你手里只有这套文档，不能看源码，也没有人可以问。你的任务不是评价文档好坏，而是老老实实按顺序读，读到哪里卡住就记下：我在哪一段卡住、我从文档里已经知道什么、我还缺什么才能继续往下做。
ROADMAP 基线 Plans 行：**Plans:** 29/32 completed（第一批：中级教程 24 篇 + 站点注册 + D-09 复审修订；第二批：高级 I 7 篇 + 注册 + 读者审阅 + 用户修订循环；第三批：高级 II 10 篇 + 注册 + 读者审阅 + 用户修订循环；第四批：高级 I 补写 Mover + FaceHandler 2 篇 + 注册 + 读者/用户修订，已完成）。**未完成 3 个**（第一批遗留）：`10-06`（中级全批验收）、`10-11`（中级读者审阅）、`10-12`（中级最终验收）——其范围已被后续 D-09 修订与高级 I/II 期间的最终状态覆盖，缺独立 SUMMARY，待补跑或并入后续验收。
STATE 基线 total_plans：134
STATE 基线 completed_plans：126
基线 HEAD（10-49 记录）：b94b4c3b41da8184312bc9f264654dc9a54adf69
审阅前 docs 快照哈希：d0acf96d440f9796135455e49d4da78ba290c5bc8772f7a92d45e24e2cd13738
审阅前 docs 快照文件数：27（25 篇 UI 正文 + docs/advanced/ii/index.md + docs/advanced/index.md）
ROADMAP 受保护行哈希：a9b74dcdc8be21ab1aa98a7b63fc81527c69a376ddb6e20509eeb7a792d70532
ROADMAP 全文哈希：fecfd9b5d7cd71389d58de9345efd6188649b0c7083f5d617d9cbc72563ee04a
STATE 全文哈希：e4731f2b66115eb43d9b185634c2d86802ef6c2638201558c98d917e133c3591
审阅停止条件：审阅结束即停止，不进入用户修订；不写 SUMMARY / ROADMAP / STATE；不改导览与侧边栏；不 commit。
读者派发方式：orchestrator 子代理
审阅后 docs 快照哈希：d0acf96d440f9796135455e49d4da78ba290c5bc8772f7a92d45e24e2cd13738
读者审阅：已完成（见 10-49-READER-REVIEW.md）
停止点：审阅结束，未进入用户修订；未写 SUMMARY / ROADMAP / STATE；未改 docs/；未 commit。

## 计划重排（2026-11-01）

用户要求把 10-49 之后的计划重排为「深度扩写 → 独立读者循环 → 用户审阅」，本节只记录编号映射与文件处置，不改写上面的历史记录：

- 旧 `10-49-PLAN.md`（独立读者审阅）→ 读者循环现为 `10-53-PLAN.md`（执行 Round 2/3；Round 1 记录保留在 `10-49-READER-REVIEW.md`，不删除、不复制、不交给用户）。
- 旧 `10-50-PLAN.md`（用户修订 + 最终门禁 + 落位 + 收尾）→ 现为 `10-54-PLAN.md`。
- 新增 `10-49-PLAN.md`：Part 0–1 深度扩写（7 篇）。
- 新增 `10-50-PLAN.md`：Part 2–3 深度扩写（7 篇）。
- 新增 `10-51-PLAN.md`：Part 4 深度扩写（5 篇）。
- 新增 `10-52-PLAN.md`：Part 5 深度扩写（6 篇）。
- `10-48` 仍是 pre-review 修复，编号不变。
- 四份扩写计划串行（wave 7→10），共享本文件与 `pnpm docs:build` 产物目录；读者循环 wave 11，用户审阅 wave 12。
- 旧 `10-49-PLAN.md` / `10-50-PLAN.md` 的正文已被新计划替换；本文件中 2026-11-01 之前的 10-49 / 10-50 记录是历史状态，按本节映射理解。
- 交叉引用：`10-43-PLAN.md`、`10-47-PLAN.md`、`10-48-PLAN.md` 末尾各追加了「编号变更（2026-11-01）」小节；`10-CUSTOM-UI-RESEARCH.md` 末尾追加了同一映射。历史正文不改写。
- 本次重排只写计划与规划记录；不改 `docs/`、代码、`ROADMAP.md`、`STATE.md`；不 commit。

## 10-49 深度扩写（Part 0–1）

用户确认（10-49）：可以执行
用户原话（2026-11-01）：「批准执行所有计划，在独立读者审阅循环前停下，注意 22:00 后停止」
本次执行范围（10-49）：只做 Part 0–1 的 7 篇深度扩写与门禁；不进入 10-50..10-54，不进入 10-53 读者循环。
Task 0 记录：用户已随全局批准确认本计划六项（7 篇范围、D-93 四类逐页判定、体量仅记录不设门禁、Round 1 仅内部输入、扩写结束即停且不写 SUMMARY / ROADMAP / STATE / 不 commit、派发子代理执行）；执行器不再重复提问。
扩写范围：`docs/advanced/ii/ui/ui-template.md`、`docs/advanced/ii/ui/container-and-coordinates.md`、`docs/advanced/ii/ui/basic-shapes.md`、`docs/advanced/ii/ui/curves-and-paths.md`、`docs/advanced/ii/ui/text.md`、`docs/advanced/ii/ui/image-and-texture.md`、`docs/advanced/ii/ui/layer-transform-performance.md`（Part 0–1）。不新增/删除页面，仍为 25 篇正文 + 24 个 demo；不改其它 18 篇与两份导览。
Round 1 内部输入：`10-49-READER-REVIEW.md`（25 篇、116 条提问、178 行分节概率）；仅内部输入，不交给用户，不作为唯一修改清单。
基线 HEAD（10-49 深度扩写）：b94b4c3b41da8184312bc9f264654dc9a54adf69
扩写前本批页面聚合哈希：d140f3cd846c5cb616ae703380869fe54cd501f7c9e70a58b7e14dcc984c9eeb
本批外文件聚合哈希：63ec28b4cda6019ee9118473508c692405616c9a70c41704b438a88b88a77d21
ROADMAP 全文哈希：fecfd9b5d7cd71389d58de9345efd6188649b0c7083f5d617d9cbc72563ee04a
STATE 全文哈希：e4731f2b66115eb43d9b185634c2d86802ef6c2638201558c98d917e133c3591

### D-93 覆盖表

| 篇目                                               | 渲染树模型 | 事件模型 | 元素/组件用法 | 示例后解释 | 现状行数 |
| -------------------------------------------------- | ---------- | -------- | ------------- | ---------- | -------- |
| docs/advanced/ii/ui/ui-template.md                 | 已讲       | 已讲     | 已讲          | 已讲       | 123      |
| docs/advanced/ii/ui/container-and-coordinates.md   | 已讲       | 已讲     | 已讲          | 已讲       | 114      |
| docs/advanced/ii/ui/basic-shapes.md                | 已讲       | 已讲     | 已讲          | 已讲       | 159      |
| docs/advanced/ii/ui/curves-and-paths.md            | 已讲       | 已讲     | 已讲          | 已讲       | 143      |
| docs/advanced/ii/ui/text.md                        | 已讲       | 已讲     | 已讲          | 已讲       | 118      |
| docs/advanced/ii/ui/image-and-texture.md           | 已讲       | 已讲     | 已讲          | 已讲       | 96       |
| docs/advanced/ii/ui/layer-transform-performance.md | 已讲       | 已讲     | 已讲          | 已讲       | 160      |

体量参考（非门禁）：7 篇当前总行数 913，平均 130.4 行。~300 行仅为参考，不设下限/上限；不因低于 300 行失败，也不为凑行数注水（D-88）。
停止点：10-49 只做 Part 0–1 深度扩写；不改 10-50..10-54、不改 docs 其它页与 demo、不写 SUMMARY / ROADMAP / STATE、不 commit。
自查：docs/advanced/ii/ui/ui-template.md — 渲染树：新增「这份模板在渲染树里的位置」，讲清组件→VNode→元素树、创建/挂载/销毁、控制器栈与画布根、裸文字为什么不可用；事件：新增「事件从哪里进入」，讲清命中起点、zIndex 顺序、捕获/冒泡入口并回链事件篇；组件/元素：新增「组件、元素与打开方式」，讲清三个基础 props、open 第二参数、instance 与 close、GameUI 对象、文件放置与出口；示例解释：两段等价代码后都解释了它在树中的位置与保留/销毁关系，并新增「两条写法怎么选」比较混用边界。
已完成扩写：docs/advanced/ii/ui/ui-template.md
门禁（10-49 Task 2）：prettier --check 通过；docs:build green（build complete in 19.29s），0 dead link；页面 25 篇、demo 24 个不变。
自查：docs/advanced/ii/ui/container-and-coordinates.md — 渲染树：新增「渲染树：根、容器与子元素」，讲清根→UI 容器→区域→叶子的树、父子建立方式、容器三项职责与 zIndex 同父比较；事件：新增「事件在嵌套容器中的路径」，讲清命中→捕获→冒泡、容器捕获单位、stopPropagation / noevent / hidden 与 enter/leave 的边界；组件/元素：扩展 loc/anchors 与嵌套示例，补 appendChild/removeChild/destroy 的生命周期与缓存写法；示例解释：新增父级 scale 示例与居中计算，并解释变换复合、容器不裁剪但命中受限、缓存何时该关。
自查：docs/advanced/ii/ui/basic-shapes.md — 渲染树：新增「图形在渲染树里的位置」，讲清叶子元素、绘制/命中顺序、按几何而非包围盒命中；事件：新增 actionStroke 命中宽度、填充/描边组合的命中判定与按钮命中注意；组件/元素：新增「图形作为界面零件」与「为什么矩形没有圆角」，补元素层类从 `@motajs/render` 导入；示例解释：填充/描边代码后给组合表并解释绘制顺序与命中差异。
自查：docs/advanced/ii/ui/curves-and-paths.md — 渲染树：新增「路径与曲线的坐标基准」与「路径在渲染树与命中中的位置」，讲清点坐标/Path2D 局部坐标、叶子位置与命中几何；事件：补 actionStroke 只命中描边及其宽度；组件/元素：扩写圆角矩形四张映射表与左上/右下示例，补「什么时候用路径」的取舍；示例解释：曲线、路径、圆角代码后均解释坐标基准、包围盒与命中边界。
已完成扩写：docs/advanced/ii/ui/container-and-coordinates.md
已完成扩写：docs/advanced/ii/ui/basic-shapes.md
已完成扩写：docs/advanced/ii/ui/curves-and-paths.md
门禁（10-49 Task 3）：prettier --write 通过；docs:build green（build complete in 18.05s），0 dead link；页面 25 篇、demo 24 个不变。
自查：docs/advanced/ii/ui/text.md — 渲染树：新增「文字元素与渲染树」，讲清叶子元素、测量尺寸与命中矩形、裸文字不可用；事件：补按钮文字与底板的命中关系（文字加 noevent 让点击落到按钮底）；组件/元素：扩写 Font 构造/默认值/setDefaults、尺寸测量与锚点重复写法、四类界面零件与默认不缓存；示例解释：右对齐与按钮文字示例后说明锚点、命中与缓存代价。
自查：docs/advanced/ii/ui/image-and-texture.md — 渲染树：新增「图片元素与纹理」，讲清叶子元素、纹理拉伸、按矩形命中与透明像素；事件：补背景/图标 noevent 与按钮图标命中；组件/元素：新增 PNG 异步加载完整路径、素材管理器取纹理、像素图与 hd/noanti 的真实作用、四类界面零件；示例解释：棋盘纹理、加载组件与像素设置后均解释尺寸、异步与缓存关系。
自查：docs/advanced/ii/ui/layer-transform-performance.md — 渲染树：新增「渲染树、层级与绘制顺序」，讲清兄弟排序、绘制/命中方向、父级子树与 UI 栈两层关系；事件：新增「事件坐标与变换」，讲清 offset 局部坐标、absolute 画布坐标、缩放后命中反算；组件/元素：扩写变换继承、hidden 与无布局流、缓存与脏更新、错误示范与 noevent 子树；示例解释：缩放探针组件逐段解释局部坐标与命中。
已完成扩写：docs/advanced/ii/ui/text.md
已完成扩写：docs/advanced/ii/ui/image-and-texture.md
已完成扩写：docs/advanced/ii/ui/layer-transform-performance.md
门禁（10-49 Task 4）：prettier --write 通过；docs:build green（build complete in 18.02s），0 dead link；页面 25 篇、demo 24 个不变。
扩写后本批页面聚合哈希：ea27f311d3782e84c5d564590244d5e4284716196cad675cf985bb295579174b
体量参考（扩写后）：`ui-template.md` 229 行；`container-and-coordinates.md` 222 行；`basic-shapes.md` 222 行；`curves-and-paths.md` 233 行；`text.md` 192 行；`image-and-texture.md` 179 行；`layer-transform-performance.md` 247 行。7 篇总行数 1524，平均 217.7 行。仍不设 300 行门禁：低于 300 行不失败，高于 300 行也不失败；不注水、不堆接口表（D-88）。

### 10-49 门禁

- 结构：`docs/advanced/ii/ui` 25 篇 `.md`；`docs/.vitepress/components/demos/ui` 24 个 `.tsx`；7 篇正文均 CRLF、0 个 LF；覆盖表无 `待补`；每篇均有 `自查：` 与 `已完成扩写：`；7 篇均无以「模板 / 需改」命名的小节，也无「简化版 / v1 / 以后再做」表述。
- 聚合哈希：`本批外文件聚合哈希` 仍为 `63ec28b4cda6019ee9118473508c692405616c9a70c41704b438a88b88a77d21`，与基线一致；`ROADMAP 全文哈希` 仍为 `fecfd9b5d7cd71389d58de9345efd6188649b0c7083f5d617d9cbc72563ee04a`，与基线一致；`STATE 全文哈希` 仍为 `e4731f2b66115eb43d9b185634c2d86802ef6c2638201558c98d917e133c3591`，与基线一致；`扩写后本批页面聚合哈希` 与扩写前不同。
- prettier：`cmd /c "pnpm exec prettier --write docs/advanced/ii/ui"` 后 `--check` 同路径，exit 0，`All matched files use Prettier code style!`。
- ESLint：`cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"`，exit 0，0 error / 0 warning。
- docs 类型：`cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"`，`docs/` 路径类型报错 0；既有引擎报错 11 条（`packages/common/src/logger.ts` 缺 `main` 3 条、`packages/render/src/core/types.ts` 缺 `CanvasStyle` 8 条，既有、非本轮引入、不得修）。
- 构建：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`，exit 0，`build complete in 17.09s.`，0 dead link；`public/_docs/advanced/ii/ui` 下 `.html` 恰好 25 个；页面 25 篇、demo 24 个不变。
  D-93 抽查：docs/advanced/ii/ui/ui-template.md — 通过
  D-93 抽查：docs/advanced/ii/ui/container-and-coordinates.md — 通过
  D-93 抽查：docs/advanced/ii/ui/basic-shapes.md — 通过
  D-93 抽查：docs/advanced/ii/ui/curves-and-paths.md — 通过
  D-93 抽查：docs/advanced/ii/ui/text.md — 通过
  D-93 抽查：docs/advanced/ii/ui/image-and-texture.md — 通过
  D-93 抽查：docs/advanced/ii/ui/layer-transform-performance.md — 通过
  停止点：10-49 扩写结束；未进入 10-53 读者循环；未写 SUMMARY / ROADMAP / STATE；未改 10-50..10-54；未 commit。

## 10-50 深度扩写（Part 2–3）

用户确认（10-50）：可以执行
用户原话（执行上下文转述，2026-11-01）：「用户已批准执行所有计划，在独立读者审阅循环前停下；22:00 后停止。」
本次执行范围（10-50）：只执行 Part 2–3 的 7 篇深度扩写与门禁；不进入 10-51..10-54，不进入 10-53 读者循环。
Task 0 记录：六项已随全局批准确定（7 篇范围、事件顺序以源码核对并改正、D-93 四类逐页判定、体量仅记录不设门禁、扩写结束即停且不写 SUMMARY / ROADMAP / STATE / 不 commit、修改方式）。执行器不再重复提问。
修改方式：由 GSD 执行器执行；本次执行环境未提供再派生子代理的工具，正文由执行器直接落盘；未调用 `opencode` 命令；不 commit。
扩写范围：`docs/advanced/ii/ui/reactivity.md`、`docs/advanced/ii/ui/events.md`、`docs/advanced/ii/ui/hotkey-in-ui.md`、`docs/advanced/ii/ui/conditional-and-list-rendering.md`、`docs/advanced/ii/ui/props.md`、`docs/advanced/ii/ui/component-tsx.md`、`docs/advanced/ii/ui/slots-and-attrs.md`（Part 2–3）。不新增/删除页面，仍为 25 篇正文 + 24 个 demo；不改其它 18 篇与两份导览。
Round 1 内部输入：`10-49-READER-REVIEW.md`（25 篇、116 条提问、178 行分节概率）；仅内部输入，不交给用户，不作为唯一修改清单。
基线 HEAD（10-50 深度扩写）：b94b4c3b41da8184312bc9f264654dc9a54adf69
扩写前本批页面聚合哈希：6c5b764ded45d1208cef8d4c4686131607b6ceb954b62a8ce4f108591ab8b83c
本批外文件聚合哈希：b3d4305a029cfc0187eb5ec033563b83a46bf0a332b9bf45ea75d02fbeb4774d
ROADMAP 全文哈希：fecfd9b5d7cd71389d58de9345efd6188649b0c7083f5d617d9cbc72563ee04a
STATE 全文哈希：e4731f2b66115eb43d9b185634c2d86802ef6c2638201558c98d917e133c3591

### D-93 覆盖表

| 篇目                                                  | 渲染树模型 | 事件模型 | 元素/组件用法 | 示例后解释 | 现状行数 |
| ----------------------------------------------------- | ---------- | -------- | ------------- | ---------- | -------- |
| docs/advanced/ii/ui/reactivity.md                     | 已讲       | 已讲     | 已讲          | 已讲       | 165      |
| docs/advanced/ii/ui/events.md                         | 已讲       | 已讲     | 已讲          | 已讲       | 179      |
| docs/advanced/ii/ui/hotkey-in-ui.md                   | 已讲       | 已讲     | 已讲          | 已讲       | 123      |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | 已讲       | 已讲     | 已讲          | 已讲       | 130      |
| docs/advanced/ii/ui/props.md                          | 已讲       | 已讲     | 已讲          | 已讲       | 237      |
| docs/advanced/ii/ui/component-tsx.md                  | 已讲       | 已讲     | 已讲          | 已讲       | 256      |
| docs/advanced/ii/ui/slots-and-attrs.md                | 已讲       | 已讲     | 已讲          | 已讲       | 195      |

体量参考（非门禁）：7 篇当前总行数 1285，平均 183.6 行。~300 行仅为参考，不设下限/上限；不因低于 300 行失败，也不为凑行数注水（D-88）。
停止点：10-50 只做 Part 2–3 深度扩写；不改 10-51..10-54、不改 docs 其它页与 demo、不写 SUMMARY / ROADMAP / STATE、不 commit。
自查：docs/advanced/ii/ui/reactivity.md — 渲染树：新增「数据变化如何走到渲染树」，讲清数据→组件→VNode→属性 patch→绘制，并说明重渲染是组件级、patch 是元素级；事件：在生命周期边界与两种 `ref` 对照中讲清重渲染不影响元素、事件回调改 `ref` 才驱动画面；组件/元素：新增重渲染条件、批处理与 `nextTick`、`computed` 缓存、`hidden` / 三元 / `key` 的差异与四类界面状态归属；示例解释：每段代码后说明它在链上的位置与状态保留关系。
已完成扩写：docs/advanced/ii/ui/reactivity.md
自查：docs/advanced/ii/ui/events.md — 渲染树：命中测试按根→zIndex→同层顺序→几何说明，并把命中链与渲染树对应；事件：改正为「父容器先捕获、命中元素随后捕获并先冒泡、父容器最后冒泡」，补 `stopPropagation` 同元素语义、enter/leave 的 hover 集合、同一元素事件对象复用与跨层各自计算；组件/元素：补 `MouseType` / `buttons` 位运算、`identifier`、坐标与变换、`noevent` 子树、`actionStroke` 宽度、嵌套传播完整例子；示例解释：每段代码后说明命中了谁、经过了哪条链、日志为什么是这个顺序。
已完成扩写：docs/advanced/ii/ui/events.md
门禁（10-50 Task 2）：prettier --write / --check 通过；docs:build green，0 dead link；页面 25 篇、demo 24 个不变。
自查：docs/advanced/ii/ui/hotkey-in-ui.md — 渲染树：把按键作用域解释为一条全局栈，并说明它不随 `hidden` 离开、只在卸载时移除；事件：新增「按键与元素事件是两条路径」，讲清按键不经命中、元素事件不自动转成按键、两者无统一先后；组件/元素：扩写指令/作用域/实现、`useKey` 的 `clearImpl`、`implement` 覆盖与未注册行为、注册与分组、注销、三种触发方式与时间参数、优先级只比较同次匹配的指令、UI 栈归属与 Esc/Enter/方向键场景；示例解释：每段代码后说明它在作用域栈与事件模型中的位置。
已完成扩写：docs/advanced/ii/ui/hotkey-in-ui.md
自查：docs/advanced/ii/ui/conditional-and-list-rendering.md — 渲染树：新增「条件渲染改的是树，不是样式」，把 `hidden`、三元卸载与坐标不参与布局流放在同一棵树上比较；事件：列表项事件用闭包拿当前项，删除时处理选中态与监听随元素销毁；组件/元素：扩写 `key` 的匹配规则与作用域、`ref` / `shallowRef` / `reactive` 数组的修改差异、`computed` 派生列表、排查「改了没动」的五步、条件/列表完整树形示例；示例解释：代码后逐段说明哪一层增删、哪些状态保留、哪些重建。
已完成扩写：docs/advanced/ii/ui/conditional-and-list-rendering.md
门禁（10-50 Task 3）：prettier --write / --check 通过；docs:build green，0 dead link；页面 25 篇、demo 24 个不变。
自查：docs/advanced/ii/ui/props.md — 渲染树：新增「props 与渲染树」，讲清 prop 变化只 patch 属性、结构变化由子组件决定、`key` 变化才重建；事件：补 `v-model:xxx` 的等价属性与 `emit` / 回调的取舍；组件/元素：新增四环 props 管线与逐环排查、泛型顺序、camelCase 与 `v-model:` 例外、`??` 默认值、`computed` 与读一次的差异、UI 的 controller/instance/state 注入、props/attrs/slot 职责表；示例解释：每段代码后说明值落在哪一环、哪个写法会跟随更新。
已完成扩写：docs/advanced/ii/ui/props.md
自查：docs/advanced/ii/ui/component-tsx.md — 渲染树：新增「组件如何映射成一棵子树」，讲清组件不产生额外节点、根元素是挂载点、多根节点成为同级子元素；事件：补 `emit` 与父组件回调的取舍、父组件 `onXxx` 在组件边界上的归属；组件/元素：扩写 `defineComponent` 四个泛型与第二参数省略后的后果、生命周期对应的树操作与自动/手动清理、`expose` 与父级 `ref`、组件拆分边界、普通子组件不传 controller；示例解释：每段代码后说明它在组件树与元素树中的位置。
已完成扩写：docs/advanced/ii/ui/component-tsx.md
自查：docs/advanced/ii/ui/slots-and-attrs.md — 渲染树：新增「slot 在渲染树里的位置」与完整落点示例，讲清 slot 在父作用域求值后插入子组件位置；事件：补组件边界上的 `onClick` 归属、声明 emits 后不再透传、转发写法与「点了没反应」排查；组件/元素：扩写四个泛型与手写 options 的关系、默认/具名/作用域 slot、`attrs` 响应式与 `inheritAttrs`、UI 的 `hidden` / `zIndex` 走 attrs、slot/props/attrs 选择表；示例解释：逐段说明每块内容最终落在哪棵子树、哪个元素。
已完成扩写：docs/advanced/ii/ui/slots-and-attrs.md
门禁（10-50 Task 4）：prettier --write / --check 通过；docs:build green，0 dead link；页面 25 篇、demo 24 个不变。
扩写后本批页面聚合哈希：9f70e2e66a6b140580758cfc17c40157ca0c724c2c69f1369d5e6874af2635be
体量参考（扩写后）：`reactivity.md` 363 行；`events.md` 441 行；`hotkey-in-ui.md` 251 行；`conditional-and-list-rendering.md` 346 行；`props.md` 350 行；`component-tsx.md` 425 行；`slots-and-attrs.md` 382 行。7 篇总行数 2558，平均 365.4 行。仍不设 300 行门禁：低于 300 行不失败，高于 300 行也不失败；不注水、不堆接口表（D-88）。

### 10-50 门禁

- 结构：`docs/advanced/ii/ui` 25 篇 `.md`；`docs/.vitepress/components/demos/ui` 24 个 `.tsx`；7 篇正文均 CRLF、0 个 LF；覆盖表无 `待补`；每篇均有 `自查：` 与 `已完成扩写：`；7 篇均无「简化版 / v1 / 以后再做」表述，也没有新增「模板 / 需改」小节。
- 聚合哈希：`本批外文件聚合哈希（复算）` 为 b3d4305a029cfc0187eb5ec033563b83a46bf0a332b9bf45ea75d02fbeb4774d，与基线一致；`ROADMAP 全文哈希（复算）` 为 fecfd9b5d7cd71389d58de9345efd6188649b0c7083f5d617d9cbc72563ee04a，与基线一致；`STATE 全文哈希（复算）` 为 e4731f2b66115eb43d9b185634c2d86802ef6c2638201558c98d917e133c3591，与基线一致；`扩写后本批页面聚合哈希` 与扩写前不同，且与按同一算法重算的结果一致。
- prettier：`cmd /c "pnpm exec prettier --write docs/advanced/ii/ui"` 后 `--check` 同路径，exit 0，`All matched files use Prettier code style!`。
- ESLint：`cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"`，exit 0，0 error / 0 warning。
- docs 类型：`cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"`，exit 2；`docs/` 路径类型报错 0；既有引擎报错 11 条（`packages/common/src/logger.ts` 缺 `main` 3 条、`packages/render/src/core/types.ts` 缺 `CanvasStyle` 8 条，既有、非本轮引入、不得修）。
- 构建：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`，exit 0，`build complete in 22.80s.`，0 dead link；`public/_docs/advanced/ii/ui` 下 `.html` 恰好 25 个；页面 25 篇、demo 24 个不变。
  D-93 抽查：docs/advanced/ii/ui/reactivity.md — 通过
  D-93 抽查：docs/advanced/ii/ui/events.md — 通过
  D-93 抽查：docs/advanced/ii/ui/hotkey-in-ui.md — 通过
  D-93 抽查：docs/advanced/ii/ui/conditional-and-list-rendering.md — 通过
  D-93 抽查：docs/advanced/ii/ui/props.md — 通过
  D-93 抽查：docs/advanced/ii/ui/component-tsx.md — 通过
  D-93 抽查：docs/advanced/ii/ui/slots-and-attrs.md — 通过
  事件顺序复核：events.md 不含肯定式「子元素先捕获」；已按源码核对为「父容器先捕获、命中元素随后捕获并先冒泡、父容器最后冒泡」；`stopPropagation` 只停止传播、不阻止同一元素同一事件名的其它监听器；`noevent` 为整个子树不参与命中；enter/leave 由根的 hover 集合做差集统一触发、先 leave 后 enter，不走普通冒泡。

### 10-50 执行偏差

- 修改方式：本执行环境未提供再派生子代理的工具，7 篇正文与 NOTES 由执行器直接落盘；未调用 `opencode` 命令；不 commit。
- Task 2–5 的 verify 脚本在 PowerShell 5.1 与 `$ErrorActionPreference='Stop'` 下会把 `pnpm docs:build` 的正常 stderr 当成终止错误；执行时用同名 `cmd` 包装函数把原生命令的 stderr 降为 Continue，脚本其余断言原样执行，未修改计划、断言或构建命令。
- Task 2 首次 verify 未命中 `hover` 关键词，正文补写「hover 集合」后通过；未删改断言。
  停止点：10-50 扩写结束；未进入 10-53 读者循环；未写 SUMMARY / ROADMAP / STATE；未改 10-51..10-54；未 commit。

## 10-51 深度扩写（Part 4）

用户确认（10-51）：可以执行
用户原话（执行上下文转述，2026-11-01）：「用户已批准执行所有计划，在独立读者审阅循环前停下；22:00 后停止。」
本次执行范围（10-51）：只执行 Part 4 的 5 篇深度扩写与门禁；不进入 10-52..10-54，不进入 10-53 读者循环。
Task 0 记录：六项已随全局批准确定（5 篇范围、每个内置组件讲「替你决定了什么 / 树落点 / 事件 / 组合与不适用」、D-93 四类逐页判定、体量仅记录不设门禁、扩写结束即停且不写 SUMMARY / ROADMAP / STATE / 不 commit、修改方式）。执行器不再重复提问。
修改方式：由 GSD 执行器执行；本次执行环境未提供再派生子代理的工具，正文由执行器直接落盘；未调用 `opencode` 命令；不 commit。
扩写范围：`docs/advanced/ii/ui/builtin-text-and-input.md`、`docs/advanced/ii/ui/builtin-list-and-containers.md`、`docs/advanced/ii/ui/ui-controller-and-stack.md`、`docs/advanced/ii/ui/replace-builtin-ui.md`、`docs/advanced/ii/ui/ui-performance.md`（Part 4）。不新增/删除页面，仍为 25 篇正文 + 24 个 demo；不改其它 20 篇与两份导览。
Round 1 内部输入：`10-49-READER-REVIEW.md`（25 篇、116 条提问、178 行分节概率）；仅内部输入，不交给用户，不作为唯一修改清单。
基线 HEAD（10-51 深度扩写）：b94b4c3b41da8184312bc9f264654dc9a54adf69
扩写前本批页面聚合哈希：e3bb3fd495f571df9905d1a47f546a53c0f97ca52cc0174a7cb9821d9456c25f
本批外文件聚合哈希：7d0970aed1d0c3f5e3a116c310b21fb97b8ddcf6b0a131e03037ce33c5dd0137
ROADMAP 全文哈希：fecfd9b5d7cd71389d58de9345efd6188649b0c7083f5d617d9cbc72563ee04a
STATE 全文哈希：e4731f2b66115eb43d9b185634c2d86802ef6c2638201558c98d917e133c3591

### D-93 覆盖表

| 篇目                                               | 渲染树模型 | 事件模型 | 元素/组件用法 | 示例后解释 | 现状行数 |
| -------------------------------------------------- | ---------- | -------- | ------------- | ---------- | -------- |
| docs/advanced/ii/ui/builtin-text-and-input.md      | 已讲       | 已讲     | 已讲          | 已讲       | 284      |
| docs/advanced/ii/ui/builtin-list-and-containers.md | 已讲       | 已讲     | 已讲          | 已讲       | 309      |
| docs/advanced/ii/ui/ui-controller-and-stack.md     | 已讲       | 已讲     | 已讲          | 已讲       | 180      |
| docs/advanced/ii/ui/replace-builtin-ui.md          | 已讲       | 已讲     | 已讲          | 已讲       | 110      |
| docs/advanced/ii/ui/ui-performance.md              | 已讲       | 已讲     | 已讲          | 已讲       | 130      |

体量参考（非门禁）：5 篇当前总行数 1013，平均 202.6 行。~300 行仅为参考，不设下限/上限；不因低于 300 行失败，也不为凑行数注水（D-88）。
停止点：10-51 只做 Part 4 深度扩写；不改 10-52..10-54、不改 docs 其它页与 demo、不写 SUMMARY / ROADMAP / STATE、不 commit。
自查：docs/advanced/ii/ui/builtin-text-and-input.md — 渲染树：新增「这些组件替你决定了什么」与「事件与渲染树」，讲清 TextContent 的根是 custom、排版宽度只认 width、Textbox 根容器与标题/正文的落点、Input 根容器接点击而内部文字 noevent；事件：讲清 typeEnd / typeStart / updateHeight、Input 的 update:value / input / change 时序与失焦移除、TextboxStore 的 id 键；组件/元素：补多行说明、标题加正文、可滚动长说明、多个输入字段与不适用场景；示例解释：每段代码后说明它在树中的位置、状态归属与事件路径。
已完成扩写：docs/advanced/ii/ui/builtin-text-and-input.md
自查：docs/advanced/ii/ui/builtin-list-and-containers.md — 渲染树：新增「列表、滚动、分页、弹窗各自解决什么」与「组合示例与树形解释」，讲清 List 行结构、ListPage 三层、Page 内容区与页码条、Scroll 直接子元素与 container-custom；事件：讲清选中由点击驱动并发出 update / update:selected、ListPage 的 close 只发事件、Page 的 pageChange / update:page、滚动中的命中坐标偏移；组件/元素：补选中与 v-model、key、滚动裁剪与 scrollTo 像素、弹窗层级与返回值、Page 与 ListPage 的 slot 形式差异；示例解释：每段代码后说明哪一层增删、谁收到事件、状态归谁。
已完成扩写：docs/advanced/ii/ui/builtin-list-and-containers.md
门禁（10-51 Task 2）：prettier --write / --check 通过；docs:build green（build complete in 22.79s），0 dead link；页面 25 篇、demo 24 个不变。
自查：docs/advanced/ii/ui/ui-controller-and-stack.md — 渲染树：新增「控制器、实例与栈」与「事件归属与生命周期」，讲清控制器/实例/容器四层、栈顺序映射成 zIndex 与隐藏、背景在 zIndex 0、关闭卸载与隐藏保留；事件：讲清命中按渲染树、上层不自动拦截、按键走挂载作用域、hide 不摘作用域；组件/元素：补实例字段、open 第三参数 alwaysShow、背景四个名字状态表、栈策略与自定义策略最小实现、两个控制器分工与决策表、props creator 必须带回 state、主界面容器随 active 显隐；示例解释：工具栏→设置→确认逐层说明栈位置、背景变化、事件归属与关闭级联。
已完成扩写：docs/advanced/ii/ui/ui-controller-and-stack.md
自查：docs/advanced/ii/ui/replace-builtin-ui.md — 渲染树：新增「替换的是入口，不是实现」与内置 UI 的 GameUI/入口/文件对照表，讲清打开处、包装层与显示策略三层改法；事件：讲清关闭只关实例、Esc 与按键作用域随卸载移除、包装要转发 emits；组件/元素：补可替换范围与必须保留的行为、五步替换流程与验证点、存档返回值语义、最小替换示例接在主 UI 栈；示例解释：说明替换后所在栈、背景、遮挡与关闭路径，并给出回退方式。
已完成扩写：docs/advanced/ii/ui/replace-builtin-ui.md
门禁（10-51 Task 3）：prettier --write / --check 通过；docs:build green，0 dead link；页面 25 篇、demo 24 个不变。
自查：docs/advanced/ii/ui/ui-performance.md — 渲染树：新增「性能问题先定位在哪一层」与「缓存」两节，把绘制、命中、重渲染、列表、纹理、栈六层放在同一棵树上说明，讲清脏标记向上冒泡与隐藏子树中断；事件：新增「命中与事件」，说明每次鼠标移动的命中遍历、noevent 剪枝、actionStroke 热区与全屏遮罩的代价；组件/元素：补缓存默认值与取舍、hidden 与卸载、Scroll 平铺与分页、key、纹理与文字、creator 名字与 state；示例解释：错误缓存示范与两种修正后说明缓存在哪一层、为什么变慢或变快。
已完成扩写：docs/advanced/ii/ui/ui-performance.md
门禁（10-51 Task 4）：prettier --write / --check 通过；docs:build green，0 dead link；页面 25 篇、demo 24 个不变。
扩写后本批页面聚合哈希：b7da49c6a497219cfe56f3a71221c882a9550643e559e19d32cbd19e90a89f3a
体量参考（扩写后）：`builtin-text-and-input.md` 488 行；`builtin-list-and-containers.md` 461 行；`ui-controller-and-stack.md` 318 行；`replace-builtin-ui.md` 243 行；`ui-performance.md` 234 行。5 篇总行数 1744，平均 348.8 行。仍不设 300 行门禁：低于 300 行不失败，高于 300 行也不失败；不注水、不堆接口表（D-88）。

### 10-51 门禁

- 结构：`docs/advanced/ii/ui` 25 篇 `.md`；`docs/.vitepress/components/demos/ui` 24 个 `.tsx`；5 篇正文均 CRLF、0 个 LF；覆盖表无 `待补`；每篇均有 `自查：` 与 `已完成扩写：`；5 篇均无「简化版 / v1 / 以后再做」表述，也没有新增「模板 / 需改」小节。
- 聚合哈希：`本批外文件聚合哈希（复算）` 为 7d0970aed1d0c3f5e3a116c310b21fb97b8ddcf6b0a131e03037ce33c5dd0137，与基线一致；`ROADMAP 全文哈希（复算）` 为 fecfd9b5d7cd71389d58de9345efd6188649b0c7083f5d617d9cbc72563ee04a，与基线一致；`STATE 全文哈希（复算）` 为 e4731f2b66115eb43d9b185634c2d86802ef6c2638201558c98d917e133c3591，与基线一致；`扩写后本批页面聚合哈希` 与扩写前不同，且与按同一算法重算的结果一致。
- prettier：`cmd /c "pnpm exec prettier --write docs/advanced/ii/ui/{5 篇}"` 后 `cmd /c "pnpm exec prettier --check docs/advanced/ii/ui"`，exit 0，`All matched files use Prettier code style!`。
- ESLint：`cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"`，exit 0，0 error / 0 warning。
- docs 类型：`cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"`，exit 2；`docs/` 路径类型报错 0；既有引擎报错 11 条（`packages/common/src/logger.ts` 3 条、`packages/render/src/core/types.ts` 8 条，既有、非本轮引入、不得修）。
- 构建：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`，exit 0，`build complete in 23.04s.`，0 dead link；`public/_docs/advanced/ii/ui` 下 `.html` 恰好 25 个；页面 25 篇、demo 24 个不变。
  D-93 抽查：docs/advanced/ii/ui/builtin-text-and-input.md — 通过
  D-93 抽查：docs/advanced/ii/ui/builtin-list-and-containers.md — 通过
  D-93 抽查：docs/advanced/ii/ui/ui-controller-and-stack.md — 通过
  D-93 抽查：docs/advanced/ii/ui/replace-builtin-ui.md — 通过
  D-93 抽查：docs/advanced/ii/ui/ui-performance.md — 通过

### 10-51 执行偏差

- 修改方式：本执行环境未提供再派生子代理的工具，5 篇正文与 NOTES 由执行器直接落盘；未调用 `opencode` 命令；不 commit。
- Task 2–5 的 verify 脚本在 PowerShell 5.1 与 `$ErrorActionPreference='Stop'` 下会把 `pnpm docs:build` 的正常 stderr 当成终止错误；执行时用同名包装把原生命令的 stderr 降为 Continue，脚本其余断言原样执行，未修改计划、断言或构建命令。
- Task 2 首次 verify 未命中列表篇的 `渲染树` 关键词，正文补写一句「同一棵渲染树」后通过；Task 3 首次 verify 因 NOTES 追加缺少换行而未命中 `自查：`，补上换行后通过；未删改断言。
- 与源码核对时的两处口径：`TextContent` 的排版宽度只看 `width`（`loc` 第三项被覆盖）；一次性弹窗以 `alwaysShow` 打开，所以 `lastOnly` 不会把它隐藏。均按方法注释与行为写入正文，未报告为缺陷。
  停止点：10-51 扩写结束；未进入 10-53 读者循环；未写 SUMMARY / ROADMAP / STATE；未改 10-52..10-54；未 commit。

## 10-52 深度扩写（Part 5）

用户确认（10-52）：可以执行
用户原话（执行上下文转述，2026-11-01）：「用户已批准执行所有计划，在独立读者审阅循环前停下；22:00 后停止。Task 0 不再提问；把用户原话与 10-52 确认记录写入 NOTES。」
本次执行范围（10-52）：只执行 Part 5 的 6 篇深度扩写与门禁；不进入 10-53 / 10-54，不进入 10-53 读者循环。
Task 0 记录：六项已随全局批准确定（6 篇范围、系列一致性契约九条、D-93 四类逐页判定、体量仅记录不设门禁、扩写结束即停且不写 SUMMARY / ROADMAP / STATE / 不 commit、修改方式）。执行器不再重复提问。
修改方式：由 GSD 执行器执行；本次执行环境未提供再派生子代理的工具，正文由执行器直接落盘；未调用 `opencode` 命令；不 commit。
扩写范围：`docs/advanced/ii/ui/inventory-example-1-skeleton.md`、`docs/advanced/ii/ui/inventory-example-2-grid.md`、`docs/advanced/ii/ui/inventory-example-3-detail.md`、`docs/advanced/ii/ui/inventory-example-4-scroll.md`、`docs/advanced/ii/ui/inventory-example-5-state.md`、`docs/advanced/ii/ui/inventory-example-6-animation-and-register.md`（Part 5）。不新增/删除页面，仍为 25 篇正文 + 24 个 demo；不改其它 19 篇、两份导览与 24 个 demo。
Round 1 内部输入：`10-49-READER-REVIEW.md`（25 篇、116 条提问、178 行分节概率）；仅内部输入，不交给用户，不作为唯一修改清单。
基线 HEAD（10-52 深度扩写）：b94b4c3b41da8184312bc9f264654dc9a54adf69
扩写前本批页面聚合哈希：e9565ba82aa52a3f74deeda4585bd224fe51103df5968e5a458afd6d8bac1b06
本批外文件聚合哈希：56fedcb45d7849d73a742d8afb95097eadc5a95e40423359ce9bcf9c164f4958
ROADMAP 全文哈希：fecfd9b5d7cd71389d58de9345efd6188649b0c7083f5d617d9cbc72563ee04a
STATE 全文哈希：e4731f2b66115eb43d9b185634c2d86802ef6c2638201558c98d917e133c3591
demo 快照哈希：02b1d6a88d414c9ce197b7bd8f7773020d8ae1c5c18099518595a66ca1ad6a4a

### D-93 覆盖表

| 篇目                                                              | 渲染树模型 | 事件模型 | 元素/组件用法 | 示例后解释 | 现状行数 |
| ----------------------------------------------------------------- | ---------- | -------- | ------------- | ---------- | -------- |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md               | 已讲       | 已讲     | 已讲          | 已讲       | 144      |
| docs/advanced/ii/ui/inventory-example-2-grid.md                   | 已讲       | 已讲     | 已讲          | 已讲       | 234      |
| docs/advanced/ii/ui/inventory-example-3-detail.md                 | 已讲       | 已讲     | 已讲          | 已讲       | 113      |
| docs/advanced/ii/ui/inventory-example-4-scroll.md                 | 已讲       | 已讲     | 已讲          | 已讲       | 143      |
| docs/advanced/ii/ui/inventory-example-5-state.md                  | 已讲       | 已讲     | 已讲          | 已讲       | 233      |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | 已讲       | 已讲     | 已讲          | 已讲       | 138      |

系列一致性契约
契约 1：`items` 在 `InventoryPanel` 里是 `ref<Item[]>`；子组件收到的是父级解包后的数组或明确 props，不在子组件里直接引用父级闭包变量；派生列表用 `computed`。
契约 2：`Item` 类型只定义一次，定义在示例（二）的共享类型位置；后续页面引用它，不各自重写。
契约 3：`selectedId` 是 `ref<string | null>`，初始为 `null`（显示「请选择道具」）；点击有效项写 id；详情区提供「取消选择」回到未选中。
契约 4：关闭归 `InventoryPanel`：面板的关闭按钮调用 `props.controller.close(props.instance)`；子组件不直接关闭面板，需要关闭时通过回调上报。
契约 5：左侧最终方案是 `Scroll`（示例四引入）；示例二/三的普通网格是阶段性实现，示例四明确替换关系，示例五/六不再回到普通网格或 `ListPage`。
契约 6：布局坐标（layout）以最终组装页为准：左侧 `[54, 100, 400, 280]`、右侧 `[470, 100, 196, 280]`、底部 `ActionBar` `[54, 392, 304, 32]`；左侧网格/滚动区与底部 `ActionBar` 不重叠；各页坐标若调整，必须在当页说明与最终页的关系。
契约 7：组件拆分为 `InventoryPanel` / `ItemGrid` / `ItemCell` / `ItemDetail` / `ActionBar`；`InventoryPanel` 持有 `items`、`selectedId`、`equippedId`、`hint`，`ItemGrid` 收 `items` / `selectedId` / `equippedId` 与 `onSelect`，`ItemCell` 收 `item` / `selected` / `equipped` / `size`，`ItemDetail` 收 `item` 与 `onClear`，`ActionBar` 收 `canEquip` / `canUse` / `equipped` 与三个回调；后续页面不新增未声明的隐式依赖。
契约 8：列表 key 用 `item.id`；不用下标代替会变化的身份；无状态静态列表的例外要写明。
契约 9：事件流为 `ItemCell` 点击 → 上报 `onSelect(id)` → `ItemGrid` → `InventoryPanel` 更新 `selectedId`；操作按钮 → 上报动作 → 面板决定装备 / 使用 / 关闭。

体量参考（非门禁）：6 篇当前总行数 1005，平均 167.5 行。~300 行仅为参考，不设下限/上限；不因低于 300 行失败，也不为凑行数注水（D-88）。
自查：docs/advanced/ii/ui/inventory-example-1-skeleton.md — 渲染树：新增「骨架在渲染树里的位置」，画出根容器→面板主体/标题/关闭按钮/左右区域的树，讲清三个区域坐标、720×480 是逻辑尺寸、同父 zIndex 与加入顺序、关闭按钮的命中与冒泡；事件：讲清点击命中按钮容器后调用 close、子元素无监听时沿父链上报；组件/元素：新增「组件与文件怎么分」五文件职责与 props 链、GameUI 注册、打开的三处入口、关闭归 InventoryPanel；示例解释：代码后解释根容器是入口、占位容器先定尺寸、后续只替换子树不重算坐标，并说明 props 三项由 UI 栈注入。
已完成扩写：docs/advanced/ii/ui/inventory-example-1-skeleton.md
自查：docs/advanced/ii/ui/inventory-example-2-grid.md — 渲染树：新增「从占位到网格」与「网格的树结构」，讲清 ItemGrid→定位容器→ItemCell 两层树、5 列坐标来源与 362 宽总尺寸、定位容器与格子同尺寸避免默认 200×200 遮挡；事件：新增「点击如何上报」，讲清 ItemCell→ItemGrid→InventoryPanel 的 emit/onSelect 链与每层职责；组件/元素：Item 只在示例（二）定义一次、items 为 ref<Item[]>、columns/cellSize/gap 用 computed、key 用 item.id；示例解释：每段代码后说明节点挂在哪层、props 怎么流、选中值为什么在面板，并写明普通网格是阶段性实现、示例（四）换 Scroll。
已完成扩写：docs/advanced/ii/ui/inventory-example-2-grid.md
自查：docs/advanced/ii/ui/inventory-example-3-detail.md — 渲染树：新增「详情区的树结构」，画出根容器→背景/标题/提示块/详情块/取消选择按钮，讲清 hidden 两块兄弟与文字宽度 164、描述从 120 到 236 的边界；事件：讲清取消选择只 emit clear、由面板写回 null，以及点击上报与 clear 是同一状态链的两端；组件/元素：selectedId 为 ref<string | null> 初始 null、find 用 ?? null 收口、selectedItem 在面板派生、ItemDetail 收 item 与 onClear、TextContent 的 width/autoHeight；示例解释：代码后说明按钮最后加入因此在最上层、详情不重复查列表、三种空态的显示与恢复。
已完成扩写：docs/advanced/ii/ui/inventory-example-3-detail.md
门禁（10-52 Task 2）：prettier --write / --check 通过；docs:build green，0 dead link；页面 25 篇、demo 24 个不变。
自查：docs/advanced/ii/ui/inventory-example-4-scroll.md — 渲染树：新增「为什么要换滚动」与「Scroll 在渲染树里的位置」，画出左侧区域→Scroll→行容器→ItemCell 的树，讲清视口 372×244、右侧 28 像素给滚动条、行距 74、Scroll 内部滚动条层级、窗口外行的逻辑裁剪；事件：新增「滚动与事件」，讲清滚轮由 Scroll 自己处理、捕获阶段补滚动偏移、拖动与点击共用按下/移动/抬起、可点击元素避开滚动条区域；组件/元素：ItemGrid 根节点改为行容器数组以成为 Scroll 直接子元素、props 链不变、ScrollExpose 的 scrollTo/getScrollLength、padEnd、滚动位置在卸载与隐藏时的差异；示例解释：代码后说明行坐标不随滚动改变、为什么 ListPage 不作为最终方案、示例（五）（六）继续用 Scroll。
已完成扩写：docs/advanced/ii/ui/inventory-example-4-scroll.md
自查：docs/advanced/ii/ui/inventory-example-5-state.md — 渲染树：新增「操作条的树与事件流」，画出底部区域→ActionBar→三个按钮，讲清坐标与左侧区域不重叠；事件：讲清 equip/use/close 三类 emit、按钮命中与早返回、三条关闭入口汇到 controller.close、Esc 作用域；组件/元素：ActionBar 的 props 与 emits、equipped 语义是当前选中是否已装备、ItemCell 与 ItemGrid 的 equipped 三处同步改动、遮罩 noevent 与绘制顺序；示例解释：代码后说明状态变化分别落到哪处树节点、为什么不改子组件内部状态、关闭前确认应走 UI 栈。
已完成扩写：docs/advanced/ii/ui/inventory-example-5-state.md
自查：docs/advanced/ii/ui/inventory-example-6-animation-and-register.md — 渲染树：新增「动画作用在树的哪一层」与最终组装树，讲清呼吸描边与提示都是面板兄弟节点、noevent 不参与命中、动画不进子组件 props 链；事件：讲清 close 的三条入口与注册后从主 UI 栈打开、GameUI 是对象不是名字查找；组件/元素：五个文件落位、src/client/ui/index.ts 统一导出、InventoryPanel 注册、坐标与 props 链最终写法；示例解释：代码后说明动画节点位置与停止时机，并新增「最终组装与契约核对」九条表与「最终验证清单」逐项路径。
已完成扩写：docs/advanced/ii/ui/inventory-example-6-animation-and-register.md
门禁（10-52 Task 3）：prettier --write / --check 通过；docs:build green，0 dead link；页面 25 篇、demo 24 个不变。

### 10-52 一致性核对

契约 1：通过 — 6 篇合并检查含 `ref<Item[]>`；`items` 只在 `InventoryPanel` 持有，`ItemGrid` / `ItemCell` 只读 props；示例（二）（四）（五）的网格代码均未引用父级闭包。
契约 2：通过 — `Item` 只在示例（二）定义一次；示例（三）（四）（五）（六）直接使用该类型，没有第二份定义。
契约 3：通过 — 合并检查含 `ref<string | null>`；示例（二）（三）（五）初始值均为 `null`，未选中显示「请选择道具」，示例（三）的「取消选择」写回 `null`。
契约 4：通过 — 合并检查含 `controller.close(props.instance)`；示例（一）（五）（六）都归面板关闭，`ActionBar` 只发 `close`，没有子组件直接关闭或只改提示的写法。
契约 5：通过 — 示例（四）明确「左侧最终方案是 Scroll」并说明替换示例（二）；示例（五）（六）继续用 `Scroll`，没有把 `ListPage` 写成终选。
契约 6：通过 — 六篇统一左侧 `[54, 100, 400, 280]`、右侧 `[470, 100, 196, 280]`、操作条 `[54, 392, 304, 32]`、提示 `[54, 432]`；左侧下边界 380 与操作条 392 不重叠。
契约 7：通过 — 五个组件职责与 props 链一致；示例（五）显式给出 `equipped` / `equippedId` 的接口、props 数组与渲染三处改动，后续页面没有新增未声明依赖。
契约 8：通过 — 格子 key 统一 `item.id`；示例（四）行容器 `key={row}` 并说明行只表示位置，格子身份仍按 id。
契约 9：通过 — 示例（二）（三）（五）（六）的事件流均为 `ItemCell → ItemGrid → InventoryPanel`，操作条通过 `emit` 上报、面板决定动作。
D-93 抽查：docs/advanced/ii/ui/inventory-example-1-skeleton.md — 通过
D-93 抽查：docs/advanced/ii/ui/inventory-example-2-grid.md — 通过
D-93 抽查：docs/advanced/ii/ui/inventory-example-3-detail.md — 通过
D-93 抽查：docs/advanced/ii/ui/inventory-example-4-scroll.md — 通过
D-93 抽查：docs/advanced/ii/ui/inventory-example-5-state.md — 通过
D-93 抽查：docs/advanced/ii/ui/inventory-example-6-animation-and-register.md — 通过
扩写后本批页面聚合哈希：724022a6b6eecb4ae8e49829be8a16d74f48920505505c90be5856eab43d966f
体量参考（扩写后）：`inventory-example-1-skeleton.md` 202 行；`inventory-example-2-grid.md` 297 行；`inventory-example-3-detail.md` 194 行；`inventory-example-4-scroll.md` 202 行；`inventory-example-5-state.md` 362 行；`inventory-example-6-animation-and-register.md` 264 行。6 篇总行数 1521，平均 253.5 行。仍不设 300 行门禁：低于 300 行不失败，高于 300 行也不失败；不注水、不堆接口表（D-88）。

### 10-52 门禁

- 结构：`docs/advanced/ii/ui` 25 篇 `.md`；`docs/.vitepress/components/demos/ui` 24 个 `.tsx`；6 篇正文均 CRLF、0 个 LF；覆盖表无 `待补`；每篇均有 `自查：` 与 `已完成扩写：`；6 篇均无「简化版 / v1 / 以后再做」表述。
- 聚合哈希：`本批外文件聚合哈希（复算）` 为 56fedcb45d7849d73a742d8afb95097eadc5a95e40423359ce9bcf9c164f4958，与基线一致；`ROADMAP 全文哈希（复算）` 为 fecfd9b5d7cd71389d58de9345efd6188649b0c7083f5d617d9cbc72563ee04a，与基线一致；`STATE 全文哈希（复算）` 为 e4731f2b66115eb43d9b185634c2d86802ef6c2638201558c98d917e133c3591，与基线一致；`demo 快照哈希（复算）` 为 02b1d6a88d414c9ce197b7bd8f7773020d8ae1c5c18099518595a66ca1ad6a4a，与基线一致；`扩写后本批页面聚合哈希` 与扩写前不同，且与按同一算法重算的结果一致。
- prettier：`cmd /c "pnpm exec prettier --check docs/advanced/ii/ui"`，exit 0，`All matched files use Prettier code style!`。
- ESLint：`cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"`，exit 0，0 error / 0 warning。
- docs 类型：`cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"`，exit 2；`docs/` 路径类型报错 0；既有引擎报错 11 条（`packages/common/src/logger.ts` 缺 `main` 3 条、`packages/render/src/core/types.ts` 缺 `CanvasStyle` 8 条，既有、非本轮引入、不得修）。
- 构建：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"`，exit 0，`build complete in 26.86s.`，0 dead link；`public/_docs/advanced/ii/ui` 下 `.html` 恰好 25 个；页面 25 篇、demo 24 个不变。
- D-93 逐篇结论：6 篇均讲清渲染树落点（节点挂在哪层、坐标与裁剪）、事件路径（命中与上报链）、组件/元素用法（props、内置组件、注册）、示例后解释（为什么现在加这一步），抽查全部通过。
  停止点：10-52 只做 Part 5 深度扩写；不改 10-53 / 10-54、不改 docs 其它页与 demo、不写 SUMMARY / ROADMAP / STATE、不 commit。
  停止点：10-52 扩写结束；25 篇扩写全部完成；未进入 10-53 读者循环；未写 SUMMARY / ROADMAP / STATE；未改 10-53 / 10-54；未 commit。

### 10-52 执行偏差

- 修改方式：本执行环境未提供再派生子代理的工具，6 篇正文与 NOTES 由执行器直接落盘；未调用 `opencode` 命令；不 commit。
- Task 2–5 的 verify 脚本在 PowerShell 5.1 与 `$ErrorActionPreference='Stop'` 下会把 `pnpm docs:build` 的正常 stderr 当成终止错误；执行时用同名 `cmd` 包装把原生命令的 stderr 降为 Continue，脚本其余断言原样执行，未修改计划、断言或构建命令。
- 写作期自查修正：示例（四）初稿提前带了 `equippedId`，已改为示例（五）再引入，保持增量顺序与契约 7 一致；未删改断言。

## 10-53 独立读者循环（第 2/3 轮）

用户确认（10-53）：可以执行
用户原话（2026-11-01）：「先进入读者循环吧，具体的问题到后面我再一个个提」
用户确认说明：Task 0 不再重复提问；用户同意直接进入独立读者循环，读者问题后续由用户逐条提出。
循环范围：25 篇 `docs/advanced/ii/ui/*.md`；Round 1 已完成（`10-49-READER-REVIEW.md`：25 篇、116 条提问、178 行分节概率），本计划执行 Round 2 / Round 3，最多 3 轮。
读者分组：A（Part 0–1，7 篇）、B（Part 2–3，7 篇）、C（Part 4，5 篇）、D（Part 5，6 篇）；每轮至少 4 个独立读者，不得由单代理包办全部篇目。
用户更正（2026-11-01）：Round 2/3 改为一个读者读完全部 25 篇，不是 4 组读者；4 组临时结果作废，`10-53` 的 4 组结构已被用户覆盖，按单读者结构记录。
Round 1 输入边界：只作内部输入，不复制、不改写、不交给用户；Round 2 读者使用新上下文。
基线 HEAD（10-53 读者循环）：b94b4c3b41da8184312bc9f264654dc9a54adf69
循环前 docs 快照哈希：9b10f4285ff107be1b90e2f0c6078267fd6a881eb1a3d9532855c22adecb764b
循环前 docs 快照文件数：27（25 篇 UI 正文 + docs/advanced/ii/index.md + docs/advanced/index.md）
读者派发方式：orchestrator 子代理（单读者）
Round 2 单读者输入：`C:\Users\13194\AppData\Local\Temp\opencode\round2-single.md`（25 篇、53 条提问、16 条跨篇问题；表格篇目为简称，记录时归一化为 `docs/advanced/ii/ui/<slug>.md`）。
阻断判定口径：缺前置、术语未定义、步骤缺失、明确矛盾、缺 import/入口、D-93 模型/事件/组件没讲清；设计取舍/风格/详略不修。
记录归属：仅 `.planning`，append-only、带 `### 第 N 轮`；不写入 docs 正文，不交给用户。
修改方式：Task 1 由执行器内联写基线记录（不改 docs、不派读者）；读者与修订者由 orchestrator 派发子代理执行。
停止点：10-53 只做读者循环；不进入 10-54 用户审阅；不写 SUMMARY / ROADMAP / STATE；不 commit。

第 2 轮读者：单读者读完全部 25 篇（用户更正，4 组作废）；53 条逐篇提问 + 16 条跨篇问题。
第 2 轮分诊：阻断 29 条、非阻断 40 条；编号 R2-01…R2-69；逐条理由与处理见 `10-53-READER-REVIEW.md`。
第 2 轮修订：阻断 29 条，已修 29 条，未修 0 条；修订者同时按 D-93 检查渲染树、事件、组件与示例后解释，不只按问题清单修。
第 2 轮门禁：prettier `--write` / `--check docs/advanced/ii/ui` exit 0；ESLint exit 0、0 error / 0 warning；`vue-tsc --noEmit -p docs/tsconfig.json` exit 2、`docs/` 路径 0 条类型错误、既有引擎报错 11 条（不得修）；`docs:build` exit 0、`build complete in 33.00s.`、0 dead link；`public/_docs/advanced/ii/ui` 下 `.html` 25 个；25 篇 `.md` / 24 个 demo 不变；25 篇正文均 CRLF。
循环后 docs 快照哈希（第 2 轮修订后）：18b7c3927564da58d359dbd08809defb70b19c7116aaa4aaffdabdb3c7b1fa76
停止点：第 2 轮已完成并修订；未开始 Round 3；未进入 10-54 用户审阅；未写 SUMMARY / ROADMAP / STATE；未 commit。

### 10-53 最终门禁

第 3 轮读者：单读者读完全部 25 篇（未看前两轮清单）；47 条逐篇提问 + 9 条跨篇问题。
第 3 轮分诊：阻断 22 条、非阻断 34 条；逐条理由与处理见 `10-53-READER-REVIEW.md`。
第 3 轮修订：阻断 22 条，已修 22 条，未修 0 条；修订者同时按 D-93 检查模型、事件、组件与示例后解释，不只按问题清单修。
轮次完整性：Round 2（阻断 29）+ Round 3（阻断 22）；加上 Round 1 共 3 轮，达到 D-91 上限；不存在第 4 轮；第 3 轮修订后无剩余阻断。
结构门禁：25 篇 `.md` / 24 个 demo / `public/_docs/advanced/ii/ui` 下 25 个 `.html`；25 篇正文均 CRLF；未新增/删除页面。
质量门禁：prettier `--check docs/advanced/ii/ui` exit 0；ESLint exit 0、0 error / 0 warning；`vue-tsc --noEmit -p docs/tsconfig.json` exit 2、`docs/` 路径 0 条类型错误、既有引擎报错 11 条（不得修）；`docs:build` exit 0、`build complete in 20.34s.`、0 dead link。
循环后 docs 快照哈希：b667ff1e3e604aada8704dfb722a7363ae444ed3cb13ca07b58637ea806d278e
快照对比：循环前 `9b10f428…`、第 2 轮后 `18b7c392…`、本轮后 `b667ff1e…`；三次不同，说明修订确实落到正文。
读者循环结论：已完成
记录归属：仅 .planning，未交给用户
停止点：10-53 读者循环结束；不进入 10-54 用户审阅；不写 SUMMARY / ROADMAP / STATE；不 commit。

### 重跑 Round 1（D-94）

用户指令（2026-11-01）：按 D-94 重跑读者循环；先汇总 Round 1、分诊阻断、只修阻断，不开始 Round 2；22:05 停止。
旧轮次：`10-49-READER-REVIEW.md` 的 Round 1 与 `10-53-READER-REVIEW.md` 的 Round 2/3 未读非目标文档，不满足 D-94 → 已标注作废、仅保留历史，不删除。
Round 1（D-94）输入：`10-53-READER-REVIEW-ROUND1-D94.md`（单读者；非目标文档 + 25 篇目标；83 条逐篇提问、10 条跨篇问题）。
Round 1（D-94）分诊：阻断 16 条、非阻断 14 条（按篇汇总）；编号 R1-01…R1-30；逐条理由与处理见 `10-53-READER-REVIEW.md`。
Round 1（D-94）修订：阻断 16 条，已修 5 条（R1-01/12/21/24/30，另附带澄清 R1-10），交用户 11 条，未修 0 条。
修订范围：`ui-template.md`、`reactivity.md`、`builtin-text-and-input.md`、`inventory-example-6-animation-and-register.md`、`layer-transform-performance.md`；未改页面结构、未新增/删除页面、未改 demo。
停止点：Round 1（D-94）已汇总并修完可在文档内解决的阻断；未开始 Round 2；未跑最终门禁（prettier/ESLint/类型/构建）；不写 SUMMARY / ROADMAP / STATE；不 commit。

## 前置去重与 mermaid（重跑前）

用户指令（2026-11-01）：「先收集其他文档中已经讲过的内容，把这些内容删除，然后再重新审阅循环。」已批准执行本次去重 + 补图；**不开始读者循环**。

输入：`10-UI-DEDUP-COVERAGE.md`（主题覆盖表、明确不应写进 UI 的内容、mermaid 位置表）。范围：只改 `docs/advanced/ii/ui/*.md` 与本 NOTES；不改非目标文档、demo、侧边栏、源码、ROADMAP / STATE；不 commit。

### 删除 / 压缩项（按权威页归并）

- **工程命令与别名**：`ui-template.md` 删除 `pnpm install` / `pnpm dev` / `pnpm docs:dev` 与 `@motajs/*` / `@user/*` 路径映射整段，改为一句指向仓库根 `dev.md` 与 `src-tour.md`；`inventory-example-1-skeleton.md` 同类命令段改为一句指向 `dev.md`。`dev.md` 在 docs 根之外，VitePress 不能做相对链接，写成纯文本路径（首次构建 2 个 dead link 即来自此，已改掉）。
- **渲染树**：权威 = `container-and-coordinates.md` §渲染树。`ui-template.md` §这份模板在渲染树里的位置 删掉三层列表与 `text` 树，压成一句 + 链接；`inventory-example-1-skeleton.md` 删掉 `text` 树，保留五个区域坐标事实 + 链接；`component-tsx.md` 只保留「组件树 vs 元素树」差异（新增映射图）。
- **zIndex / 命中**：规则权威 = `layer-transform-performance.md`，命中权威 = `events.md`。`container-and-coordinates.md` 两处规则压成一句 + 链接；`basic-shapes.md` 的 zIndex 段压成一句 + 链接；`inventory-example-1-skeleton.md` 删掉命中顺序长段；`ui-controller-and-stack.md` 的 `i * 5` 段改为指向本篇前文；`ui-performance.md` §命中与事件 只留遍历成本与 `noevent` 性能建议 + 链接。
- **事件 / 捕获冒泡 / 坐标 / noevent**：权威 = `events.md`。`container-and-coordinates.md` §事件在嵌套容器中的路径 保留命中→捕获→冒泡三段，删掉 `stopPropagation` / `enter`-`leave` 细节改链接；`ui-template.md` §事件从哪里进入 整段压成一句 + 链接；`layer-transform-performance.md` 删除「事件坐标与变换」「noevent」两整节，合并为一小节 + 链接（标题保留 `## 事件坐标与 noevent`）。
- **hidden vs 三元**：权威 = `conditional-and-list-rendering.md`。`layer-transform-performance.md` §显示开关 只留 `hidden` 原则、与缓存的关系，删掉四种场景列表与三元素例，末尾重复的选型表整节删除；`ui-performance.md` §显示开关 压成一段 + 链接；`container-and-coordinates.md` 保留一句 + 链接。
- **缓存 / 脏更新**：机制权威 = `layer-transform-performance.md`；`ui-performance.md` §缓存 删除默认缓存标签列表与两段修正代码，只留「何时值得开 / 三类不适合 / 判断标准」并链接机制篇；`container-and-coordinates.md` §生命周期与缓存 删除机制段与两段缓存代码，改为一句 + 链接；`image-and-texture.md` 像素图特例保持不变（权威）。
- **GameUI 名字不参与查找**：权威 = `ui-template.md` §GameUI 是一个对象，不是名字。`ui-controller-and-stack.md` 两处、`inventory-example-6-animation-and-register.md`、`replace-builtin-ui.md` 各压成一句 + 链接。
- **泛型顺序**：权威 = `props.md` §泛型顺序。`component-tsx.md` 删除四行表格与逐位解释，压成一句 + 链接；`slots-and-attrs.md` 删除「四个泛型依次是…」的顺序复述，保留 slot 专属部分 + 链接。
- **props 不解构**：权威 = `props.md` §props 是响应式的，不要解构。`reactivity.md` 删除代码块与展开，压成两句 + 链接。
- **props 基础注入链**：权威 = `ui-controller-and-stack.md` §事件归属与生命周期。`ui-performance.md` §基础 props 删除代码与机制，只留「creator 里不要做重活」+ 链接。
- **目录扫描 / 注册**：`ui-template.md` 删除「没有目录扫描…」长段，压成一句 + `src-tour.md` 链接；保留 `src/client/ui/index.ts` 统一出口这一 UI 特有事实。

### 必须保留、未删的 UI 特有内容

渲染树三层与容器三职责、`loc` 六元组 / `anc` / 默认 200×200、命中测试五条与 `enter` / `leave` 集合差（`events.md`）、`hidden` / `noevent` / `actionStroke` / `cursor` 行为、缓存机制与 `nocache` 优先级、UI 栈四层与策略 / `keep` / 背景四名、`setPropsBaseCreator` 注入链、内置组件、纹理、按键作用域、替换内置 UI、UI 性能六层定位与观测流程。页面数量（25）、demo 数量（24）、侧边栏均未改。

### 新增 mermaid（9 张图，覆盖 8 个主图位置）

1. `container-and-coordinates.md` §渲染树：`flowchart TD`（替换原 `text` 树）——画布根 → UI 容器 → 面板根 → 区域 / 叶子。
2. `events.md` §命中测试：`flowchart TD` + 两个决策节点——zIndex 先问谁、`hidden` / `noevent` 跳过。
3. `events.md` §捕获与冒泡：`sequenceDiagram`——根 → 面板 → 按钮捕获，按钮 → 面板 → 根冒泡，`stopPropagation` 截断说明。
4. `layer-transform-performance.md` §缓存与脏更新：`flowchart TD`——变化 → 标脏 → 沿父链上冒 → 重画，`custom` 手动触发分支。
5. `ui-controller-and-stack.md` §控制器、实例与栈：`classDiagram`——`GameUI` / `UIController` / `UIInstance` / `UIContainer` 持有与创建关系。
6. `ui-controller-and-stack.md` §栈策略：`stateDiagram-v2`——`open` / `hide` / `show` / `close` 在 `lastOnly` 与 `showAll` 下的迁移。
7. `component-tsx.md` §组件如何映射成一棵子树：`flowchart TD`——组件树与元素树的对应，组件边界不可见。
8. `reactivity.md` §数据变化如何走到渲染树：`flowchart LR`——数据 → 渲染函数 → VNode → 元素属性 → 绘制。
9. `props.md` §props 的完整管线：`flowchart LR`——父属性 → VNode props → `props` 数组分叉 → setup / attrs。

均为 ` ```mermaid ` 代码块、中文标签、配 1–3 句说明；未引入新依赖。全 UI 子分组 `mermaid` 计数 9（原 0），原有 `text` 树块仅保留 inventory-6 的目录树（清单建议不替换）。

### 门禁（2026-11-01 21:27 前后）

- prettier：`cmd /c "pnpm exec prettier --check docs/advanced/ii/ui"` exit 0，`All matched files use Prettier code style!`。
- ESLint：`cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"` exit 0，0 error / 0 warning。
- 构建：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` exit 0，`build complete in 25.22s.`，0 dead link。
- 结构：`docs/advanced/ii/ui` 25 篇 `.md`；`docs/.vitepress/components/demos/ui` 24 个 `.tsx`；`public/_docs/advanced/ii/ui` 25 个 `.html`；25 篇正文均 CRLF、无 LF-only。
- 未改：ROADMAP / STATE / 非目标文档 / demo / 侧边栏 / 源码；未 commit、未 stash、未切换分支。

### 未完成 / 停止点

- 未开始读者循环（按用户要求先去重、重跑循环留待下一步）。
- 未做 `vue-tsc` 类型检查（本次只改 Markdown 与 mermaid，未触 TypeScript）；如需与 10-53 同等门禁可补跑。
- 停止点：前置去重与 8 个主图位置已完成；不进入读者循环；不写 SUMMARY / ROADMAP / STATE；不 commit。

### 重跑 Round 2（D-94）

用户指令（2026-11-01）：按 D-94 重跑 Round 2；单读者、先读非目标文档再读 25 篇；只修阻断；22:25 停止；不开始 Round 3；不 commit。
输入：`10-53-READER-REVIEW-ROUND2-D94.md`（单读者；非目标文档 + 25 篇目标文档；25 条逐篇提问、8 条跨篇问题）。
Round 2（D-94）分诊：阻断 9 条、非阻断 24 条；编号 `R2-01…R2-33`（本节独立编号，与上方已作废的第 2 轮 `R2-01…R2-69` 无关）；逐条理由与处理见 `10-53-READER-REVIEW.md`。
Round 2（D-94）修订：阻断 9 条，已修 7 条（3 处正文），交用户 2 条（R2-02、R2-17，均依赖 UI 容器/主场景实现），未修 0 条。
修订范围：`docs/advanced/ii/ui/props.md`（对象型 prop 内部字段追踪）、`docs/advanced/ii/ui/builtin-text-and-input.md`（`Textbox` 尺寸来源）、`docs/advanced/ii/ui/inventory-example-1-skeleton.md`（480×320 首次验证的缩放做法）；未改页面结构、未新增/删除页面、未改 demo。
门禁：prettier `--check` 三篇 exit 0；ESLint `docs/.vitepress/components/demos/ui` exit 0、0 error / 0 warning；`vue-tsc --noEmit -p docs/tsconfig.json` exit 2、`docs/` 路径 0 条类型错误、既有引擎报错 11 条（不得修）；`docs:build` exit 0、`build complete in 18.38s.`（最终一次）、0 dead link；`public/_docs/advanced/ii/ui` 下 25 个 `.html`；25 篇 `.md` / 24 个 demo 不变；25 篇正文均 CRLF。
未完成项：无（7 条阻断已修，2 条交用户；Round 3 按指令未开始；最终门禁无待跑项）。
停止点：Round 2（D-94）已汇总并修完可在文档内解决的阻断；**未开始 Round 3**；未进入 10-54 用户审阅；不写 SUMMARY / ROADMAP / STATE；不 commit。

### 重跑 Round 3（D-94）

用户指令（2026-11-02）：执行第 3 轮（最后一轮）D-94 读者审阅；单读者、先读非目标文档再读 25 篇；只修阻断；跑最终门禁；不开始 Round 4 / 10-54；不 commit；22:00 停止。

输入：`10-53-READER-REVIEW-ROUND3-D94.md`（单读者；非目标文档 + 25 篇目标文档；124 条逐篇提问、14 条跨篇问题）。原记录先落在临时目录，已按前两轮做法复制到计划目录，未改内容。

Round 3（D-94）分诊：阻断 7 条、非阻断 36 行；编号 `R3-01…R3-43`（跨篇 R3-34/35/40 分别与 R3-17/06/10 同项，不重复计数）；逐条理由与处理见 `10-53-READER-REVIEW.md`。

Round 3（D-94）修订：阻断 7 条，已修 6 条（落在 6 处正文），交用户 1 条（R3-19，`mainUIController.render()` 的主场景挂载，沿用 R2-17），未修 0 条。

修订范围：`docs/advanced/ii/ui/container-and-coordinates.md`（`loc` 两两一组的写法）、`docs/advanced/ii/ui/image-and-texture.md`（`ITexture`/`Texture` 导入与类型）、`docs/advanced/ii/ui/hotkey-in-ui.md`（普通子组件的 `useKey` 入口）、`docs/advanced/ii/ui/builtin-text-and-input.md`（`Textbox` 高度来源）、`docs/advanced/ii/ui/ui-controller-and-stack.md`（`keep` 的 close 顺序）、`docs/advanced/ii/ui/replace-builtin-ui.md`（`openSettings` 示例签名）。未改页面结构、未新增/删除页面、未改 demo、未改源码。

最终门禁（2026-11-02 14:25 前后）：

- prettier：`cmd /c "pnpm exec prettier --check docs/advanced/ii/ui"` exit 0，`All matched files use Prettier code style!`。
- ESLint：`cmd /c "pnpm exec eslint docs/.vitepress/components/demos/ui"` exit 0，0 error / 0 warning。
- 类型：`cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json"` exit 2；`docs/` 路径 0 条类型错误；既有引擎报错 11 条（`packages/common/src/logger.ts` 3 条、`packages/render/src/core/types.ts` 8 条，不得修）。
- 构建：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` exit 0，`build complete in 18.21s.`（最后一次；补 `loc` 说明后重跑），0 dead link。
- 结构：`docs/advanced/ii/ui` 25 篇 `.md`；`docs/.vitepress/components/demos/ui` 24 个 `.tsx`；`public/_docs/advanced/ii/ui` 25 个 `.html`；25 篇正文均 CRLF、无 LF-only。
- 最终 docs 快照哈希（27 个文件：25 篇 UI 正文 + `docs/advanced/ii/index.md` + `docs/advanced/index.md`；按相对路径排序，`path:sha256(content)` 逐行拼接后再 sha256，不剥注释）：`c444757333e536123ed0fa170b3faeb805930007ec773247e74ce6c802521132`。

未完成项：无（6 条阻断已修，1 条交用户；Round 4 按指令未开始；最终门禁无待跑项）。

停止点：10-53 读者循环结束；未进入 10-54；未写 SUMMARY/ROADMAP/STATE；未 commit。

## 10-54 用户审阅与收尾

用户确认（10-54）：已完成（非示例）
用户原文（2026-11-15）：「这部分文档算是差不多全看完了。示例部分先保留，标记为待审阅，先不审阅它。你把文档审阅计划标记为已完成，把当前计划收尾。」
审阅范围：25 篇 docs/advanced/ii/ui/\*.md；其中 19 篇非示例文档已审阅完成，6 篇示例文档保留现状并标记为待审阅。
示例待审阅清单：inventory-example-1-skeleton.md、inventory-example-2-grid.md、inventory-example-3-detail.md、inventory-example-4-scroll.md、inventory-example-5-state.md、inventory-example-6-animation-and-register.md。
审阅结论：文档审阅计划已完成（带待审阅项）；示例不纳入本轮完成范围。
计划状态：已完成（带待审阅项）；不代表 25 篇全部审阅完成。
停止点：10-54 文档审阅收尾；示例 1-6 待审阅；未改源码/demo；未 commit。

## 10-55 渲染指南迁移

用户确认（10-55）：可以执行
用户原文（摘要，2026-11-16）：用户确认修正后的计划 10-55-PLAN.md（名称 / 范围更正：指南为「渲染指南」，不是「渲染端指南」；只收画屏幕 / 写 UI 的材料，无关系统留在中级 / 高级教程），并批准执行 Task 1–4；Task 5 用户审阅与 Task 6 记账不在本次执行范围。
裁决摘要：路径 docs/render-guide/；导航名「渲染指南」；三分区 asics/、dvanced/、internals/（渲染基础 / 渲染进阶 / 渲染底层）；页面基线 27（basics 10 / advanced 15 / internals 2）；19 篇继承 10-54 已审阅、ui-basics / irst-static-ui 待审阅、示例 1–6 待审阅；demo 不移动；普通教程渲染相关内容收敛另开计划；POC 页保留不动；不 commit。
BASE-HEAD：2a4b3220ed9ecc01b2f92eabd375185eb686a01a
页面基线：27；实测 27（docs/advanced/ii/ui/\*.md 计数）。10-54 记录值 25 篇（19 已审阅 + 6 待审阅）/ 24 demo 只作历史记录。
新增页审阅状态与依据：ui-basics = 待审阅；irst-static-ui = 待审阅。依据：两篇在 10-54 的 25 篇清单中无对应 slug（5db2cef 后新增），用户未确认其已审阅，按默认记待审阅。
POC 处置：保留不动（docs/poc/render-demo.md 本计划不改）。
demo 基线：文件 67；被正文引用 65；带 live（renderDemo.vue） 24。demo 目录：docs/.vitepress/components/demos/ui/。
docs 快照哈希：363b822c90b84761eff38b4ca518837eae609d0a1c6d8f1b7d5f62f38cb6c853（27 篇，按相对路径排序，逐文件 SHA-256 后以 LF 拼 path:hash 再取 SHA-256）
配置快照哈希：212dc5960e3a9ff5d04b0f08e9616cf0dfae268856e92a8654022930ef6bcbbe（docs/.vitepress/config.ts）
迁移范围：docs/advanced/ii/ui/ → docs/render-guide/{basics,advanced,internals}/
示例口径：1..6 保持待审阅，不审阅正文
停止点：10-55 迁移前清单已建立

### 10-55 门禁

执行时间：2026-11-16（本地时间 13:51 起）。
结构门禁：docs/render-guide/ 共 28 个 .md（27 篇 + index.md），目录仅 asics / dvanced / internals；docs/advanced/ii/ui/ 已删除；docs 与 docs/.vitepress/_.ts 中 /advanced/ii/ui/、./ui/ 链接为 0；docs/advanced/ii/index.md 与 docs/advanced/index.md 含
ender-guide 链接且不含「自定义 UI 与渲染」「高级 II 的《UI 性能》」，数据端与 III 链接保留。结果：通过。
导航门禁：nav 含「渲染指南」与 /render-guide/；/render-guide/ 侧边栏 27 条与磁盘 27 篇双向一致（无死链、无孤儿页）；旧 UI 分组已移除；/intermediate/ 链接 26 条（25 侧边栏 + 1 顶部）不变。结果：通过。
导入与 live 门禁：docs/render-guide/\*\*/_.md 中 .vitepress/components 导入全部为 ../../.vitepress/...，../../../.vitepress/components 为 0；demo 目录 git status --porcelain 为空；demo 文件 67、被正文引用 65、带
enderDemo.vue 24，与基线一致。结果：通过。
文档结构门禁：27 篇各有且仅有一个 ## 前置知识；示例 6 篇在清单中仍为 待审阅；ui-basics / irst-static-ui 与清单 新增页面审阅状态（均 待审阅）一致；10-54-SUMMARY.md、10-54-USER-REVIEW.md、docs/poc/render-demo.md 未被修改；剥离 ## 前置知识 段、链接行与导入行后 27 篇与 HEAD 逐字一致；全部代码块与 HEAD 逐字一致；新指南正文无 待审阅 / 未审阅 / 已修复 / 审阅记录。结果：通过。
格式门禁：cmd /c "pnpm exec prettier --check docs/render-guide docs/.vitepress/config.ts docs/advanced/ii/index.md docs/advanced/index.md" 首次对 docs/render-guide/index.md 报格式差异，--write 后复跑 exit 0，差异仅为表格/空行排布。结果：通过。
类型门禁：cmd /c "pnpm exec vue-tsc --noEmit -p docs/tsconfig.json" exit 2；docs/ 路径报错 1 条：docs/.vitepress/components/demos/ui/container-custom-demo.tsx(17,41): error TS2554；其余 218 条全部位于 packages/ / packages-user/（工作树中存在与本计划无关的未提交改动，如 packages-user/client-base/src/map/element.ts 的
enderContent 签名改为 1 个参数，10-54 基线 11 条不再适用）。该 docs 报错来自未被本计划修改的 demo 文件与未提交的包改动，不是 10-55 引入；按要求不修改 demo 与 packages/，已记入 10-55-DEFERRED-ITEMS.md。docs 路径断言未达 0。结果：未通过（预存在、非本计划引入，待用户裁决）。
构建门禁：cmd /c "pnpm exec tsx docs/.vitepress/init.ts" exit 0；cmd /c "pnpm docs:build" exit 0，输出 uild complete in 19.28s，无 dead link；public/\_docs/render-guide/\*_/_.html 共 28 个（basics 10 / advanced 15 / internals 2 + index），等于页面基线 + 1。结果：通过。
计数：页面 27；导入 89（demo 65 + RenderDemo 24）；demo 67/65/24；内部链接 46（跨区改写 25，同区保留 21）；侧边栏 27。示例待审阅结论：1–6 全部仍为待审阅，正文未审阅、未改写。旧链接清零结论：/advanced/ii/ui/ 与 ./ui/ 在 docs 与配置中均为 0。
docs 迁移后快照哈希：6c1130ec8596af25316405b4597f5a815008adee436b5715e6a85c0ceaee8185（27 篇，按相对路径排序，逐文件 SHA-256 后以 LF 拼 path:hash 再取 SHA-256）
迁移后配置快照哈希：cdb9d2562b517ddbed4f8614496e941aad0ca8b51f77c269e5bce171125adc2b
迁移后指南导览哈希：65e9466ba8447eef4dbab7fe0d9936cc8dc7c812bda8477406e458895f202209
停止点：10-55 Task 4 门禁已跑；未进入 Task 5 用户审阅；未写 SUMMARY、未改 ROADMAP / STATE、未 commit。

### 10-55 用户结构修正（2026-11-16）

用户要求：渲染指南改为两分区，不保留底层文档；`ui-system` 与 `ui-performance` 两篇移入 `advanced/`；`ui-system` 不再以 `custom-components` 为前置。已执行：用 `git mv` 将两篇移到 `docs/render-guide/advanced/` 并删除空的 `internals/`；侧边栏移除「渲染底层」组，两篇并入「渲染进阶」；导览、迁移清单与相关链接同步改为 advanced。分区计数：basics 10 / advanced 17 / internals 0（有效分区 2）。`ui-system.md` 的「前置知识」仅保留「事件与交互」。

### 10-55 收尾（2026-11-16）

用户确认（10-55）：可以执行（Task 5 结构 / 链接审阅通过，用户可以收尾）
用户原文：「可以收尾」（2026-11-16，确认 Task 5 审阅后指示执行 Task 6 收尾记账）
结构审阅：已完成
最终页面计数：27（`docs/render-guide/` 共 28 个 `.md`，含 `index.md`）；两区计数：basics 10 / advanced 17；internals 0（不建目录，UI 系统与 UI 性能归 advanced）。
新增页审阅状态与依据：`ui-basics` = 待审阅；`first-static-ui` = 待审阅。依据：10-54 的 25 篇清单无对应 slug，用户未确认其已审阅，按默认保持待审阅。
审阅谱系：19 篇继承 10-54 已审阅（含改名继承）+ 2 篇新增待审阅 + 6 篇示例待审阅 = 27。
POC 处置：保留不动（`docs/poc/render-demo.md` 未改）。
demo：文件 67；被正文引用 65；带 live（`renderDemo.vue`） 24；目录 `docs/.vitepress/components/demos/ui/` 未移动、未修改。
迁移后 docs 快照哈希：754b6b15d9aae205ec74ad955c9e683a4b25ab5eb2921f041fb20cecf31f2894（27 篇，按相对路径排序，逐文件 SHA-256 后以 LF 拼 `path:hash` 再取 SHA-256；两分区修正后实测）。
迁移后配置快照哈希：a498e4e371a12b9617943db7813a5b7dfd82e3e857d6294e9d0b002b6e88e1c3。
门禁摘要：结构 / 导航 / 导入与 live / 文档结构 / 格式 / 构建通过；类型门禁 `docs/` 路径 1 条为未在本计划修改的 demo 与工作树无关包改动所致，已记 `10-55-DEFERRED-ITEMS.md`，未修、未绕过。
示例待审阅结论：示例 1–6 全部仍为 待审阅，正文未审阅、未改写。
停止点：10-55 渲染指南迁移完成
