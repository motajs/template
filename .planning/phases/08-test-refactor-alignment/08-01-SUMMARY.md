# 08-01 SUMMARY — 测试目录迁移

**执行日期:** 2026-10-04
**计划:** `08-01-PLAN.md`（测试目录迁移，独立先行）
**状态:** 完成（门禁通过；提交待用户指示，见文末）

## Task 0 裁决（用户「可以执行」）

- **M1**：`git mv` 逐文件迁移，不写一次性脚本；允许编辑 `script/test-data-node.ts`。
- **M2**：测试仍红属预期（接口/约定改动所致），本计划不做接口对齐。
- **M3**：规则 A（+1 层）/ 规则 B（原样）分流确认无误。
- **M4**：任一声明文件若有用户未提交改动则停止汇报；实际检查 `git status` 时声明路径无用户改动，正常执行。

## 迁移结果

- **移动总量**：71 个测试文件（65 `.test.ts` + 6 `.perf.ts`）+ 3 个随迁非测试文件（`replayVerifier.ts`、`fixtures/closed-loop.ts`、`fixtures/floors.json`）= **74**。
- **规则 A（+1 层，`git mv` 逐文件）**：58 文件，覆盖 `data-common/src/{common,replay,store}`、`data-base/src/{enemy,hero,map}`、`data-system/src/{combat,event,path}`、`data-state/src/{,enemy,event,replay}`；另有 tracer 阶段先迁的 `data-base/src/flag` 2 文件，共 **60** 文件。
- **规则 B（specifier 原样）**：`packages-user/data-state/test/` 整体 `git mv` 为 `packages-user/data-state/__test__/`（14 tracked 文件，含 `fixtures/`）。
- **脚本同步**：`script/test-data-node.ts` 第 67、122 行 `data-state/test/` → `data-state/__test__/`（仅路径字符串）。
- **导入改写**：对规则 A 文件按「每个相对 specifier 加一层」机械改写（`'./x'→'../x'`、`'../x'→'../../x'`；动态 `import()` / `typeof import()` / `new URL()` / `require()` 字符串一并处理）；裸包 specifier（`@user/*`、`@motajs/*`、`vitest`）不变。改写文件 57 个（1 个文件无相对 specifier）。

## 门禁证据

| 门禁 | 结果 |
|------|------|
| `pnpm test:ci` 采集文件数 | **66**（守恒；含 `script/check-data-circular.test.ts`） |
| `pnpm test:perf` 采集文件数 | **6**（守恒） |
| 规则 A 新位置残留 `./` specifier | **0** |
| 规则 B specifier 原样 | 保持（`../src/core`、`./fixtures/...`、`./replayVerifier`、`../../data-common/...`） |
| `pnpm exec eslint <77 个改动 ts 文件>` | **0 报错** |
| 配置改动 | **无**（`vite.config.ts` / `vitest.perf.config.ts` / `tsconfig.json` / `eslint.config.js` / `package.json` 均未改） |
| 生产源码改动 | **无**（`packages-user/*/src/**` 下仅测试/夹具移动；无接口/实现改动） |

测试用例仍大量失败（如 `createCoreState is not a function`），**属预期**——接口对齐由 08-02..08-09 承担。

## Tracer 见证

`flag/__test__/{system,saveLoad}.test.ts` 迁移后聚焦运行：文件被采集、导入解析成功（12 passed / 5 failed 断言漂移），证明「默认 glob 命中 `__test__/`、零配置改动」假设成立。

## 并发保护（D-08）

- 执行前检查声明路径无用户未提交改动。
- 检测到用户并发改动（未触碰、未暂存、未提交）：`packages-user/client-base/src/types.ts`、`packages-user/client-modules/src/client.ts`、`packages-user/client-modules/src/types.ts`，以及未跟踪目录 `packages-user/client-modules/src/ui/`。

## 未决 / 待用户指示

- 本计划的 git 提交**尚未进行**（含并发用户改动，提交须显式路径且待用户指示）。
