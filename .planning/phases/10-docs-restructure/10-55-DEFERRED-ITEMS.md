# Deferred Items — 10-docs-restructure

## 10-55 执行期间发现（2026-11-16）

- **类型检查：`docs/.vitepress/components/demos/ui/container-custom-demo.tsx(17,41): error TS2554: Expected 1 arguments, but got 2.`**
  - 发现于：Task 4 类型门禁。
  - 原因：工作树中与本计划无关的未提交改动（`packages-user/client-base/src/map/element.ts` 的 `renderContent` 调用改为 1 个参数）与 demo 中按两参数写入的 `renderContent(canvas, transform)` 不一致。
  - 范围判断：demo 文件本身未被 10-55 修改（`git status` 为空）；10-55 未改 `packages/` / `packages-user/`，按范围边界不修。
  - 影响：`vue-tsc -p docs/tsconfig.json` 的 `docs/` 路径报错从 0 变为 1；其余 218 条报错均位于 `packages/` / `packages-user/`。
  - 待办：由用户确认包改动与 demo 的预期签名后，另行修复 demo 或包；10-55 不处理。
