# 08-02 SUMMARY — data-common 对齐

**执行日期:** 2026-10-04
**计划:** `08-02-PLAN.md`
**状态:** 完成（聚焦 147/147 通过；eslint 0；已提交）

## Task 0 裁决（用户）

- **Q1：** 退役 `common/__test__/utils.test.ts`（直接删除）。
- **Q2：** `sandbox` 失败码断言改为当前实际码（`logger.error(72, method)`）。
- **Q3：** 删除 `DirectionMapper` 注入残留，改用 shipped `IFaceHandler` 语义。

## 生产改动（唯一，经用户确认的重构遗漏）

- `packages-user/data-common/src/replay/sandbox.ts`：
  - `play()` 入口与 `step()` 入口各补「惰性预读首步」（`!appendingStep && !reader.expired && !ended` → `appendingStep = reader.read()`）。
  - 成因：`75a39ad refactor: 被动录像步应当在主动录像步执行期间完成` 重构后丢失初始预读，`appendingStep` 恒为 `null` 被 `replayStep` 当作「已播完」，导致 `step()`/`play()` 无法执行任何命令。
  - 用户确认为「忘记写了首步读取，在 play 和 step 处预读即可」。

## 测试对齐改动（12 个声明文件中的 5 个失败文件）

| 文件 | 旧 → 新 |
|------|---------|
| `common/__test__/face.test.ts` | `getFaceDirection` 未知图块断言 `toBeUndefined()` → `toBe(FaceDirection.Unknown)`（3 处；含未知图块用例标题/注释同步为 Unknown） |
| `replay/__test__/array.test.ts` | 短字符串内联类型码基址 `9 → 32`：`'hi'` 期望 `11 → 34`（2 处）、空串期望 `9 → 32`（1 处）；同步注释与类型表说明 |
| `replay/__test__/system.test.ts` | 移除 2 处 `addHook(...).load()`；`onRecordCommand` 索引期望 `1 → 0`（生产传 `array.length - 1`） |
| `replay/__test__/sandbox.test.ts` | 移除 7 处 `addHook(...).load()`；命令桩改为 shipped 契约：`type: ReplayCommandType.Active` + `execute/finalize` 返回 `ReplayCommandResult`（`Success`/`Failed`）；失败码 `158 → 72`（`logger.error(72, 'execute')`）、`175 → 72`（`logger.error(72, 'finalize')`），断言改用 `logger.error` |
| `common/__test__/utils.test.ts` | **删除**（退役）。被测的 `getFaceMovement`/`degradeFace`/`nextFaceDirection`/`fromDirectionString` 已从源码整体删除；等价覆盖在 `common/__test__/faceManager.test.ts`（`Dir4FaceHandler`/`Dir8FaceHandler`/`IFaceHandler`）与 `face.test.ts` |

其余 7 个声明文件（`faceManager`、`indexer`、`mover`、`eventStore`、`tileStore`、`replay/array` 的非失败用例等）零改动。

## 期望值改写台账

- `array.test.ts`：`firstParamToken` short-string `11→34`、empty-string `9→32`、type-table short-string `11→34`（依据 `replay/types.ts:286-301` 的「32~255: n-32 长度字符串」）。
- `system.test.ts`：`onRecordCommand` index `1→0`（依据 `replay/system.ts:66`）。
- `sandbox.test.ts`：`getReplayed()` `1→2`（见下方观测）。

## 观测（未登记为缺陷，待用户确认）

- `sandbox.test.ts`「errors code 72 and stops…」：执行一步后 `getReplayed()` 现为 **2**（旧实现为 1）。原因是 shipped `replayStep` 在执行主动步前即预读下一步（`sandbox.ts:210`），`reader.index` 因此包含未执行的下一步；这与 `IReplaySandbox.getReplayed` 文档「已经播放过、不包括当前正在播放的步骤数」存在措辞差异。本计划按 shipped 行为对齐为 `2`，**未改生产**；是否调整实现或文档待用户裁定。

## 门禁证据

- `pnpm exec vitest run packages-user/data-common/src/{common,store,replay}/__test__` → **11 passed / 147 passed**。
- `pnpm exec eslint --fix` 后 `eslint` 对改动文件 **0 报错**。
- 生产改动仅 `data-common/src/replay/sandbox.ts`（经确认）；其余改动全为 `__test__/` 测试文件。
- 仓库级 skipped 仍为 1（未新增 skip）。

## 并发保护（D-08）

- 未触碰、未暂存、未提交任何用户并发改动（`client-*` / `system/src/ui/*` / 未跟踪 `client-modules/src/ui/`）。
