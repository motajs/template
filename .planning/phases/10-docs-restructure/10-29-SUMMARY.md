---
phase: 10-docs-restructure
plan: 29
subsystem: docs
tags: [vitepress, markdown, face-handler, face-direction, data-common, advanced-i]

requires:
    - phase: 10-docs-restructure
      provides: 高级 I 既有篇目与高级 II 寻路 / 范围篇目的互引落点；10-28 的 docs/advanced/mover.md
provides:
    - docs/advanced/face-handler.md：高级 I 补写篇目「FaceHandler 系列」
affects: [10-30 sidebar registration]

actuals:
    tokens: 4568
    tasks: 3
    commits: 3
    plan_head_before: ce3cd3660a958a2bae7e9528bc3a2a710cf7609c

tech-stack:
    added: []
    patterns:
        - 高级教程按一般库文档组织：概念 → 示例 → 接入位置（D-59）
        - 模板先讲理念与引导语，再给完整类骨架（D-63 / D-64）
        - 注释与实现不一致时以方法注释为准，并在 SUMMARY 中报告（D-72）

key-files:
    created:
        - docs/advanced/face-handler.md
        - .planning/phases/10-docs-restructure/10-29-SUMMARY.md
    modified: []

key-decisions:
    - 自定义处理器示例命名 VerticalDir4FaceHandler，分组键用 3；模板把斜向降级折到上下，与内置 Dir4 折左右形成对照。
    - 文档按 IFaceHandler 方法注释书写语义；Dir8FaceHandler.degrade 的原样返回只报告、不写进正文（D-72）。
    - 不断言 Dir4FaceHandler.dirOf 对斜向偏移的返回值；正文只写「由偏移反推方向、多解取其一」。
    - 移动器只用代码 span `移动 Mover`，真实链接留给 10-30 收口；本篇指向高级 II 的两处链接使用真实相对路径。

patterns-established:
    - 补写篇目沿用「概念 → 取用 → 接口语义 → 内置实现 → 用法示例 → 自定义模板 → 关联系统 → 边界 → 验证」的顺序。
    - 两层结构（逻辑朝向 / 图块数字）在文中显式分节，最后用一节说明交汇点。

requirements-completed: []

coverage:
    - id: D1
      description: docs/advanced/face-handler.md 覆盖 FaceDirection / FaceGroup / IFaceHandler / IFaceDescriptor、八个方法语义、两个内置处理器、用处理器算位置与方向、自定义处理器模板与注册、IRoleFaceBinder、与移动器 / 寻路 / 范围对象的关系、边界与验证
      verification:
          - kind: other
            ref: 'pnpm docs:build（build complete，dead link = 0）与 prettier --check'
            status: pass
      human_judgment: true
      rationale: 文档是否适配高级 I 读者、示例是否讲清，需要按 D-46 / D-57 的用户主导修订循环审阅；自动化只能验证结构、链接与构建。

duration: 20min
completed: 2026-10-23
status: complete
---

# Phase 10 Plan 29: FaceHandler 系列 Summary

**新增高级 I 补写篇目 `docs/advanced/face-handler.md`，讲清方向的两层结构：`IFaceHandler` 负责方向换算与位移，`IRoleFaceBinder` 负责朝向到图块数字的映射，并给出可实现的四方向自定义处理器模板。**

## Performance

- **Duration:** 约 20 分钟
- **Started:** 2026-10-23（本会话）
- **Completed:** 2026-10-23
- **Tasks:** 3/3（Task 0 汇报关卡已由用户预先批准）
- **Files modified:** 1 个新增文档；SUMMARY 1 个

## Accomplishments

- 新增 `docs/advanced/face-handler.md`（436 行，CRLF，单 H1「FaceHandler 系列」），按高级 I 库文档风格组织，不使用中级教程的六步实操。
- 讲清两层结构：`FaceDirection` 是逻辑朝向，`IFaceHandler` 把它变成位移与转向，`IRoleFaceBinder` 把它变成图块数字；并用 `MapTileBase.setFaceDirection` 说明两者在地图图块上的交汇。
- 用方法表逐条说明八个方法的语义，包括哪些方法内部先 `degrade`、`Unknown` 各返回什么、`mapMovement` 必含 `Unknown` 的零偏移。
- 突出 `Dir4FaceHandler` 的降级策略：斜向折到 `Left` / `Right`，不是折到上下；并用 `VerticalDir4FaceHandler` 模板演示改成折上下后的完整实现与注册方式。
- 给出 `IRoleFaceBinder` 的五个方法、`malloc` → `bind` 的前置顺序，以及 `getFaceOf` / `getFaceDirection` / `getMainFace` 的读回结果。
- 构建通过、prettier 通过、无死链、无渲染端内容；`src/client` 未出现。

## 章节结构

1. 三个概念
2. 拿到朝向处理器
3. IFaceHandler 能做什么
4. 两个内置处理器
5. 用处理器算位置与方向
6. 实现自己的朝向处理器（含「模板：一个自定义朝向处理器」）
7. 朝向图块：IRoleFaceBinder
8. 它们怎么串起来
9. 与寻路、范围对象的关系
10. 边界与注意
11. 怎么验证

## 引用的源码落点

- `packages/common/src/utils/types.ts`：`IFaceHandler` 八个方法、`IFaceDescriptor`、`IRayRangeParam.dir`。
- `packages-user/data-common/src/common/types.ts`：`FaceDirection`、`IFaceData`、`IRoleFaceBinder` 五个方法及 `malloc` / `bind` 的注释约定。
- `packages-user/data-common/src/common/faceManager.ts`：`FaceGroup`、`IFaceManager`、`Dir4FaceHandler` / `Dir8FaceHandler` 的降级表、运动表与旋转表、`FaceManager`。
- `packages-user/data-common/src/common/face.ts`：`RoleFaceBinder` 的 `malloc` / `bind` / `getFaceOf` / `getFaceDirection` / `getMainFace`；`bind` 在未 `malloc`（code 43）或朝向与主朝向相同（code 44）时报错并放弃。
- `src/data/initialize.ts`：`awake` 中 `Dir4` + `'dir4'`、`Dir8` + `'dir8'` 四个注册；`afterLoad` 按 `heroFace` 取处理器。
- `src/data/constant.ts` 与 `packages-user/data-base/src/shared.ts`：`HERO_FACE`、`HERO_MOVER_FACE`、`DYNAMIC_MOVER_FACE` 均为 `Dir8`。
- `packages-user/data-base/src/map/mover.ts`：`DynamicTileMover` 构造时取 `DYNAMIC_MOVER_FACE` 处理器，单步用 `handler.movement(this.moveDirection)` 算落点。
- `packages-user/data-base/src/map/dynamicTile.ts`：`getCurrentFaceDirection()` 走 `layer.faceBinder.getFaceDirection(tileNum)`。
- `packages-user/data-base/src/map/tile.ts`：`MapTileBase.setFaceDirection` 先 `getFaceOf`，再回退到 `Dir4` 的 `degrade` 重查。
- `packages-user/data-system/src/path/{finder,graph}.ts`：`useFaceHandler` 注入，构图按 `face.mapMovement()` 扩展邻域。
- `packages-user/data-common/src/types.ts`：`state.roleFace` 与 `state.faceManager` 挂在 Layer 0 的 `IDataCommon`。

## 核对到的关键语义

- `FaceDirection` 是 `const enum`，顺序为 `Unknown`、`Left`、`Up`、`Right`、`Down`、`LeftUp`、`RightUp`、`LeftDown`、`RightDown`；文档明确不要按数值硬编码。
- `FaceGroup` 只有 `Dir4` / `Dir8`；`FaceManager.get` / `getById` 找不到返回 `null`。
- `degrade` 是整套换算的核心：`movement` / `move` / `opposite` / `next` 内部先 `degrade`；`dirOf`、`mapDirection`、`mapMovement` 不接收方向。
- `Unknown`：`movement` / `move` 为零偏移，`opposite` / `next` 为 `Unknown`；`mapDirection` / `mapMovement` 包含 `Unknown`，后者对应 `{ x: 0, y: 0 }`。
- `Dir4FaceHandler.degrade`：`LeftUp` / `LeftDown` → `Left`，`RightUp` / `RightDown` → `Right`，其余（含 `Unknown`）→ `Unknown`。
- `IRoleFaceBinder.bind` 必须先 `malloc` 主图块；`getFaceOf` / `getMainFace` 未命中返回 `null`，`getFaceDirection` 未命中返回 `Unknown`。
- `getMainFace` 返回的 `IFaceData` 中 `identifier` 是调用方传入的图块数字，`face` 是主朝向；文档已写明，避免误读为主图块数字。
- 注册只影响之后取用处理器的代码；已构造的移动器仍持有构造时传入的处理器。

## 格式与构建结论

- prettier：`node node_modules/prettier/bin/prettier.cjs --check docs/advanced/face-handler.md` → 退出码 0。
- 构建：`cmd /c "pnpm exec tsx docs/.vitepress/init.ts && pnpm docs:build"` → 退出码 0，输出 `build complete`，无 dead link；产物 `public/_docs/advanced/face-handler.html` 已生成。
- 静态门禁：CRLF、单 H1、概念 / 八方法 / 两个内置处理器 / 用法示例 / 自定义模板 / `IRoleFaceBinder` / 串联 / 寻路与范围 / 边界 / 验证齐全；无 `src/client`；无加粗边界问题；相对 `.md` 链接目标均存在。

## 向用户报告的不一致

供你确认是否为设计如此；文档已按方法注释书写，未按实现改写语义（D-72）：

1. `Dir8FaceHandler.degrade` 的实现是 `return dir as FaceDirection`，对任意数字（例如 `42`）都原样返回；而 `IFaceHandler.degrade` 的方法注释写「对于无法合理降级的方向（包括 `Unknown`），返回 `FaceDirection.Unknown`」。文档按注释写，未把「原样返回非法值」写进正文。
2. `Dir4FaceHandler.dirOf` 遍历的是 `DIR8_MOVEMENTS`（八方向运动表），因此对斜向偏移可能返回 `LeftUp` 这类不在本组的方向；这与「四方向处理器只认四个方向」的整体语义可能不一致，但接口注释只写「返回其中一个符合要求的朝向」，未明确限定本组。按计划要求，文档只写通用语义，没有断言斜向偏移的具体返回值，也未把它记录为问题。

## Task Commits

1. **Task 1: 编写 face-handler.md 正文** — `3c61984`（docs）
2. **Task 2: 源码核对、格式与构建收口** — `56bbe73`（docs，含本 SUMMARY）
3. **收尾：按文档字符数校正实测 token 值** — 本提交（docs）

## Files Created/Modified

- `docs/advanced/face-handler.md` — 高级 I「FaceHandler 系列」正文，436 行。
- `.planning/phases/10-docs-restructure/10-29-SUMMARY.md` — 本执行总结。

## Decisions Made

- 模板类名用 `VerticalDir4FaceHandler`，分组键用 `3`；斜向折上下，便于与内置 `Dir4FaceHandler` 的折左右对照。
- 模板中的 `dirOf` 只认本组单步偏移、斜向偏移返回 `Unknown`，避免复制内置实现里跨组查表的行为。
- 用三段独立示例分别演示目标格、反方向与 `mapMovement` 遍历（D-66），不合并成一块。
- 与移动器的互引保持代码 span `移动 Mover`，真实链接由 10-30 统一收口；与高级 II 的互引使用真实链接。

## Deviations from Plan

None - 计划内容按顺序执行。Task 0 为汇报关卡，用户已在派发时预先批准「可以执行」，未重复阻塞。

实现细节上按源码核对收紧了措辞（均在 Task 2 内完成）：

- `Dir8FaceHandler.degrade` 初稿写成「不会拦截非法值」（实现行为），与接口注释冲突；已按注释改为「无法合理降级的方向返回 `Unknown`」（D-72）。
- 勇士与动态图块默认分组的来源初稿写成两个常量并列；核对后改为 `HERO_FACE`（`src/data/constant.ts`）由 `MainDataPlugin` 传入，动态图块用 `DYNAMIC_MOVER_FACE`，`HERO_MOVER_FACE` 仅作同名定义。
- `mapMovement` 缺失 `Unknown` 的后果初稿写成「落到 `null` 分支」，已改为「只能走各方法自己的兜底分支」，避免把实现细节当成契约。

## Issues Encountered

- 构建门禁的验证脚本要求 SUMMARY 已存在，因此先完成正文与构建、再写 SUMMARY、最后运行完整门禁；SUMMARY 与 Task 2 的正文改动合并为计划的收口提交。
- 未修改 `config.ts`、生产代码或渲染端内容；侧边栏注册留给 10-30。

## User Setup Required

None - 无外部服务配置。

## Next Phase Readiness

- `docs/advanced/face-handler.md` 已可供 10-30 的导览、侧边栏注册与互引收口引用。
- `docs/advanced/mover.md` 已由 10-28 完成，10-30 可把本篇的 `移动 Mover` 代码 span 改成 `[移动 Mover](./mover.md)`，并从 `mover.md` 反向链接本篇。
- 两处注释 / 实现差异待用户确认；确认前文档按方法注释语义，不影响构建。

---

_Phase: 10-docs-restructure_
_Completed: 2026-10-23_

## Self-Check: PASSED

- docs/advanced/face-handler.md 存在
- 10-29-SUMMARY.md 存在
- 提交 3c61984、56bbe73 与本次收尾提交存在
