---
phase: 07-data-fixes
plan: 03
subsystem: replay
tags: [replay, codec, int64, bigint, negative-values, type-codes, array-edit, vitest, data-common]

# Dependency graph
requires:
  - phase: 06-unit-tests
    provides: 正确预期 it.skip 用例（replay 7 条）与 06-TEST-FINDINGS.md #06-04-1..4 权威登记
  - phase: 07-data-fixes
    plan: 02
    provides: 波次 2 的串行执行基线（D-09 逐步确认与 D-12c 全量门禁的串行约束）
provides:
  - int64 解码乘数修正（2^31 = 2147483648），非负 int64 精确往返（#06-04-1）
  - 多字节 bigint 按位取字节编码 + 无符号读取解码（#06-04-2）
  - 负 int64（type 5）与负 bigint（type 8）经独立类型码以幅值载荷精确往返（A8/A9）
  - 参数类型码表整体重编号：0-9 + 10..255（A10，无兼容分支）
  - getParamRange 私有助手（末步以 paramUsed 作终点哨兵）+ delete 以命令索引回退（#06-04-3）
  - insert 两处 copyWithin 位移方向修正，array.get(i) 插入语义正确（#06-04-4）
affects: [07-verify-work, replay, data-state]

actuals:
  tokens: 5580
  tasks: 6
  commits: 4
  plan_head_before: c7e5a643c2e913cf765431229fd9408ea7723244

tech-stack:
  added: []
  patterns:
    - "幅值载荷 + 独立类型码承载负数：负值不借用符号位、不改写非负语义，编解码对称取绝对值后还原符号"
    - "末步终点哨兵：参数区间终点一律以 index + 1 < length ? indexArray[index + 1] : paramUsed 计算，不再直读 indexArray[length]"
    - "唯一性约束链式重编号：新增类型码时整体后移，杜绝 decodeParam 出现重复且不可达的 type 分支"

key-files:
  created: []
  modified:
    - packages-user/data-common/src/replay/array.ts
    - packages-user/data-common/src/replay/array.test.ts
    - .planning/WINDOWS.md

key-decisions:
  - "Task 0（D-09）由用户裁决为 approve-both + 负值支持：负 int64 = type 5、负 bigint = type 8，载荷只存幅值 |n|，解码取负；取代旧的 low = num - high * 2^31 与方法 α 符号位方案（A8/A9）"
  - "类型码表整体重编号且不保留旧码（A10，项目未发布、无向后兼容要求）：0 boolean、1 int8、2 int16、3 int32、4 非负 int64、5 负 int64、6 float、7 非负 bigint、8 负 bigint、9 长字符串、10–255 短字符串（type = length + 9）"
  - "#06-04-4 两处同修（:424 paramArray 与 :425 indexArray），使 array.get(i) 插入语义一并正确（A6）"
  - "D-10 唯一例外（A7，用户显式授权）：为负值路径新增聚焦用例并同步类型表相关断言；除该迁移外既有断言一字未改"
  - "getParamRange 返回类型按 dev.md 单独声明 IParamRange 接口，不使用内联对象类型"

patterns-established:
  - "整数与 bigint 的负数编码：normalizeParam 取 magnitude、setParamArray 按幅值写入、decodeParam 按类型码取负，三处严格对称"
  - "参数类型码注释表（INormalizedParam.paramType jsDoc）、normalizeParam、setParamArray、decodeParam 四处必须同步变更，任何一处漏改都会产生不可达分支"

requirements-completed: [FIX-01]

coverage:
  - id: D1
    description: "#06-04-1 int64 解码乘数修正：非负 int64（含 2^53 - 1）经 type 4 精确往返"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#round-trips int64 values above the int32 range"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#round-trips non-negative int64 values through type 4"
        status: pass
    human_judgment: false
  - id: D2
    description: "#06-04-2 多字节 bigint 按位取字节编码 + 无符号读取解码，多字节值精确往返"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#round-trips a multi-byte bigint"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#round-trips a heterogeneous step mixing a multi-byte bigint and an int64 value"
        status: pass
    human_judgment: false
  - id: D3
    description: "负 int64（type 5）与负 bigint（type 8）经独立类型码以幅值载荷精确往返；非负路径语义与 bigint 255 字节范围不变"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#round-trips negative int64 values through the dedicated type"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#round-trips negative bigint values through the dedicated type"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#round-trips non-negative bigint values through type 7"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#warns code 152 for an out-of-range bigint"
        status: pass
    human_judgment: false
  - id: D4
    description: "#06-04-3 delete 以命令索引回退并以 paramUsed 作末步终点哨兵"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#deletes a middle step and shifts later param indexes"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads the new order after deleting a middle step from a heterogeneous route"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#deletes the first step without leaving a hole（既有绿用例不回归）"
        status: pass
    human_judgment: false
  - id: D5
    description: "#06-04-4 insert 两处 copyWithin 位移方向修正，插入后顺序与 array.get(i) 语义正确"
    requirement: FIX-01
    verification:
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads the new order after inserting a step"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#reads the new order after inserting a step into a heterogeneous route"
        status: pass
      - kind: unit
        ref: "packages-user/data-common/src/replay/array.test.ts#inserts a step at the given index and shifts later steps（既有绿用例不回归）"
        status: pass
    human_judgment: false
  - id: D6
    description: "D-44 文件级门禁（eslint 0 错误 + vue-tsc 过滤 0 类型错误）与 pnpm test:ci 全绿；WINDOWS.md id 23 结清"
    requirement: FIX-01
    verification:
      - kind: other
        ref: "pnpm exec eslint --fix + pnpm exec eslint packages-user/data-common/src/replay/{array.ts,array.test.ts}（0 错误）"
        status: pass
      - kind: other
        ref: "pnpm exec vue-tsc --noEmit 按 replay/array 与 data-common 过滤（0 命中）"
        status: pass
      - kind: integration
        ref: "pnpm test:ci（66 files passed / 667 passed / 14 skipped）"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-09-15
status: complete
---

# Phase 7 Plan 03: replay 系统缺陷修复 Summary

**录像数组 4 条编解码 / 索引编辑缺陷全部修复：int64 乘数改用 2^31、bigint 按位取字节并无符号读取、delete 以命令索引回退且引入 `getParamRange` 末步哨兵、insert 两处 `copyWithin` 方向取反；同时负 int64 独立为 type 5、负 bigint 独立为 type 8（载荷只存幅值 `|n|`，解码取负），类型码表整体重编号后 7 条 skip 全部取消、focused 套件 46/46 全绿、全量套件 667 passed / 14 skipped**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-15T10:31:30Z
- **Completed:** 2026-09-15T10:56Z
- **Tasks:** 6 (Task 0 为已获用户裁决的 checkpoint:decision，Task 1–5 为 auto)
- **Files modified:** 3 (1 生产源码 + 1 测试 + WINDOWS.md)

## Accomplishments

- **#06-04-1（int64 解码乘数）**：`decodeParam` 的 type 4 分支 `value = low + high * 2147483647` 改为 `2147483648`，与编码侧 `setParamArray` 的 `Math.floor(num / 2147483648)` 对称；高低 32 位读取偏移与 `byte = 9` 未动。
- **负 int64 = 独立 type 5（A8，取代旧的 `low = num - high * 2^31` 方案）**：`normalizeParam` 的整数超 int32 分支依符号拆为 `param >= 2147483648` → type 4（非负）与 `param < -2147483648` → type 5（负）；两型 `byteLength` 均为 9。`setParamArray` 合并 `paramType === 4 || 5` 分支，先取幅值 `const magnitude = num < 0 ? -num : num;` 再拆分高低 32 位；`decodeParam` 的 type 5 分支按同一读法取回幅值后取负（`value = -(low + high * 2147483648)`）。非负路径逐位不变（`num` 必为非负，取幅值后等价）。
- **#06-04-2（多字节 bigint 编解码）**：编码循环体由错误的 `total += remain << (BigInt(i) * 8n)` 累加式改为按位取字节 `arr[i] = Number((magnitude >> (8n * BigInt(i))) & 0xffn);`（该累加式在 `i >= 1` 时 `remain` 恒为 0，多字节值只剩最低字节）；解码的长度前缀与幅值字节由 `getInt8` 改为 `getUint8`，顺带消除「长度前缀 ≥ 128 被当作负数」的静默错读。`bit` / `length` / `byteLength: arr.length + 2` 与 `logger.warn(152)` 的墙体判定（仍以 `param` 对 `±2n ** 2047n` 比较）保持不变。
- **负 bigint = 独立 type 8（A9，取代旧的方法 α 符号位借用）**：`normalizeParam` 先取 `const magnitude = param < 0n ? -param : param;` 再据其计算 `bit` / `length` / `arr`，`paramType` 改为 `param < 0n ? 8 : 7`；`setParamArray` 合并 `paramType === 7 || 8` 写入幅值字节；`decodeParam` 合并 `type === 7 || 8`，以 `getUint8` 无符号读长度与字节后 `value = type === 8 ? -base : base`。**不再借用长度前缀最高位作符号位**，`BigInt.asUintN` / `asIntN` 未引入，负值与非负一样保留完整 255 字节载荷范围。（解码侧长度前缀为普通长度字节，写入 `arr.length`、读取 `getUint8`。）
- **类型码表整体重编号（A10）**：见下「类型码表重编号记录」。
- **#06-04-3（delete 索引回退与末步哨兵）**：新增私有 `getParamRange(index)`，`end` 采用末步感知 `index + 1 < this.length ? this.indexArray[index + 1] : this.paramUsed`（以 `paramUsed` 作末条命令的终点哨兵），`delete` 改由它取 `[start, end)`；回退循环起点由参数字节偏移 `paramStart` 改为命令索引 `index`（`for (let i = index; i < this.length; i++)`）。`delete(0)` 路径修后等价（`index === paramStart === 0`），既有绿用例未回归。
- **#06-04-4（insert 位移方向，两处同修）**：`paramArray.copyWithin` 改为 target `paramStart + length` / start `paramStart`；`indexArray.copyWithin` 改为 target `index + 1` / start `index`。`:435-437` 的尾段补偿循环在修正方向上已恰好覆盖 `[index + 1, newLength - 1]`，未改。两处同修使 **`array.get(i)` 的插入语义一并正确**（只修 paramArray 时读流顺序读会「看似通过」，但 `get(i)` 仍读到错误参数，见 A6）。
- **测试处置（D-10 + A7 例外）**：取消 7 条既有 `it.skip`（断言一字未改，仅同步 it 前中文注释）：int64、多字节 bigint、异质 bigint+int64、delete 中间步、异质 delete 中间步、insert、异质 insert。新增 4 条经用户授权的聚焦用例（负 int64 / 非负对照 / 负 bigint / 非负对照）。`array.test.ts` 由 42 tests（35 passed / 7 skipped）变为 **46 tests / 46 passed / 0 skipped**，无任何 `it.skip` 残留。

## Task Commits

Each task was committed atomically:

1. **Task 0: D-09 裁决记录（approve-both + 负值支持）** - checkpoint:decision，已在 PLAN.md 由用户裁决并锁入 `<record>`（`c7e5a64` 为计划修订提交）；本执行者未停步，直接进入 Task 1
2. **Task 1: #06-04-1 round-trip negative int64 and renumber param type codes** - `528b8c9` (fix)
3. **Task 2: #06-04-2 round-trip multi-byte and negative bigint parameters** - `965e002` (fix)
4. **Task 3: #06-04-3 shift param indexes from the command index on delete** - `45dde1c` (fix)
5. **Task 4: #06-04-4 shift replay params in the insert direction** - `40824cc` (fix)

**Plan metadata:** `docs(07-03): complete replay data-fixes plan`（SUMMARY.md + WINDOWS.md 提交，见 completion report）

_Note: 4 个 fix 提交精确对应「编解码族」（Task 1/2）与「索引编辑族」（Task 3/4）两组根因（D-13）。_

## Files Created/Modified

- `packages-user/data-common/src/replay/array.ts` - `INormalizedParam.paramType` jsDoc 类型表更新；新增 `IParamRange` 接口与私有 `getParamRange`；`normalizeParam` 负 int64/负 bigint 分支与类型码迁移；`setParamArray` type 4/5 幅值合并、type 7/8 合并、float 6 / string 9；`decodeParam` type 4 乘数修正、type 5 负 int64、type 6 float、type 7/8 `getUint8` 无符号读取、type 9 与 `type - 9` 短串；`insert` 两处 `copyWithin` 方向；`delete` 改用 `getParamRange` 并从 `index` 回退
- `packages-user/data-common/src/replay/array.test.ts` - 7 条 skip 取消 + 4 条经授权的聚焦用例 + 类型字节 / 字符串长度阈值断言同步到新表（float 5→6、单字节 bigint 6→7、短串 9→长度+9、长/空串 7→9）
- `.planning/WINDOWS.md` - id 23（G-06-04-A）→ `fixed`（`open_count` 14→13，`fixed_count` 13→14）

## Decisions Made

- **Task 0（D-09）**：用户裁决 `approve-both` 扩展版 —— 四条登记修复全部执行；`#06-04-4` 两处同修；负 int64 采**独立 type 5**（载荷 = 幅值，解码取负），负 bigint 采**独立 type 8**（载荷 = 幅值，解码取负）；类型码表整体重编号且不保留旧码；授权新增负值聚焦用例（D-10 唯一例外 A7）与同步更新类型表相关断言；账本仅结清 id 23、不新建条目。本计划据此直接执行，未再询问。
- **类型码迁移必须与负 int64 同属一个原子提交**：type 5 被负 int64 占用后 float 必须离开 5（→6），连带 bigint 离开 6（→7）、长字符串离开 7（→9）、短字符串后移到 10–255。这是一个**唯一性约束链**，只改一半会让 `decodeParam` 出现重复且不可达的 `type === N` 分支，套件无法全绿。故 Task 1 的单个提交内同时完成 int64 乘数修正 + type 5 新增 + 全表重编号。
- **`paramUsed` 作末步终点哨兵**：`getParamRange` 的 `end` 对末条命令取 `paramUsed` 而非 `indexArray[length]`（后者是未初始化槽位，取值为 0），这是 `#06-04-3` 末步缺终点哨兵的正确修法。
- **提交粒度（D-13）**：按根因族切分 —— Task 1 与 Task 2 属编解码族、Task 3 与 Task 4 属索引编辑族，各成原子 `fix` 提交，共 4 个。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Plan 事实性错误] 聚焦用例中 `-1` 的类型码断言改为其真实类型（int8 = 1），而非计划书写的 5**
- **Found during:** Task 1（负 int64 独立为 type 5）
- **Issue:** PLAN.md 的 `<record>` 第 6 条 / Task 1 `<action>` 与 `must_haves.truths` 把 `-1` 列入「负 int64」并对其断言 `firstParamToken` 为 5。但 `normalizeParam` 的类型判定链先做 int8 判定（`param < 128 && param >= -128`），`-1` 实际归一化为 **type 1（int8，2 字节）**，并非 type 5。type 5 的第一个取值是 `param < -2147483648`（即 `-2147483649`）。照字面写断言会让该用例失败。
- **Fix:** 保留计划点名的三个取值在同一聚焦用例中做**精确往返**断言（`-1`、`-2147483649`、`-4294967297` 各自 `array.add(0, [v])` 后 `array.get(0).params` 读回原值），类型码断言按实际表取值：`-1` → 1（int8，小负值仍走更窄位宽，作为对照）、`-2147483649` → 5、`-4294967297` → 5。用例内以一行中文注释说明「小负值仍走更窄的位宽类型」。**覆盖未削弱、断言未放宽**：负值往返覆盖保持，且 type 5 锁定由两个真正的 int64 负值承担；另设「非负 int64 走 type 4（含 2^53 - 1）」对照组。
- **Files modified:** `packages-user/data-common/src/replay/array.test.ts`
- **Verification:** 聚焦套件 46/46 全绿；`negativeCases` 数据驱动断言逐项通过。
- **Committed in:** `528b8c9`（Task 1 提交）

**2. [Rule 2 - dev.md 硬约束] `getParamRange` 返回类型单独声明 `IParamRange` 接口，不使用内联对象类型**
- **Found during:** Task 3（`delete` 引入 `getParamRange`）
- **Issue:** PLAN.md 写「新增一个私有 `getParamRange(index: number)`：返回 `{ start, end }`」。dev.md（AGENTS.md 指定必读）明确「当任何时候必须出现对象类型的时候，单独声明一个 `interface`，不得出现直接的对象类型」。内联返回类型会违反该硬约束。
- **Fix:** 在文件顶部接口区新增 `IParamRange { readonly start; readonly end }`（含每个成员的中文 jsDoc），`getParamRange` 返回 `IParamRange`。与同文件既有 `IDecodedParam` / `IDecodedCommand` 的写法一致。
- **Files modified:** `packages-user/data-common/src/replay/array.ts`
- **Verification:** `pnpm exec eslint` 0 错误；`vue-tsc` 过滤 0 类型错误。
- **Committed in:** `45dde1c`（Task 3 提交）

**3. [Rule 3 - 阻塞项] `gsd-tools windows fixed 23` 重写 WINDOWS.md 为 LF，已归一化回 CRLF**
- **Found during:** Task 5（账本结清）
- **Issue:** GSD 的 `windows fixed` 动词重写 `.planning/WINDOWS.md` 时使用 LF 换行，而 dev.md 要求换行使用 `CRLF`（`git add` 时报 `LF will be replaced by CRLF`）。
- **Fix:** 读取全文后归一化 `\r\n`（`CR=373 / LF=373`），保持 UTF-8 无 BOM。文件内容 diff 仍为 6 行（frontmatter 3 项 + id 23 表格行 + JSON 块 2 项），未改变语义。
- **Files modified:** `.planning/WINDOWS.md`
- **Verification:** `git diff --stat` 仍为 `1 file changed, 6 insertions(+), 6 deletions(-)`；`windows status` 解析 JSON 正常，id 23 `status=fixed`。
- **Committed in:** SUMMARY 提交（Task 5 的账本落库提交）

---

**Total deviations:** 3 auto-fixed (1 Rule 1 事实性修正、1 Rule 2 项目规范、1 Rule 3 换行归一化)
**Impact on plan:** 三处均为正确性 / 规范所必需，无范围蔓延。#1 未削弱任何断言（负值往返与 type 5 锁定均保留），#2 为 dev.md 硬约束、#3 仅换行格式。源码改动严格限于 `files_modified` 声明的两个文件（外加计划指定的 WINDOWS.md 账本结清）。

## Verification Results

- **Task 1 聚焦：** `pnpm exec vitest run packages-user/data-common/src/replay/array.test.ts` → **1 file passed / 44 tests / 38 passed / 6 skipped**
- **Task 2 聚焦：** 同命令 → **1 file passed / 46 tests / 42 passed / 4 skipped**
- **Task 3 聚焦：** 同命令 → **1 file passed / 46 tests / 44 passed / 2 skipped**
- **Task 4 聚焦（全部 skip 取消后）：** 同命令 → **1 file passed / 46 tests / 46 passed / 0 skipped**
- **D-44 文件级门禁（每个 fix 提交前均对两个改动文件串行执行）：**
  - `pnpm exec eslint --fix <2 files>` 后 `pnpm exec eslint <2 files>` → **0 错误**（四个提交均 0）
  - `pnpm exec vue-tsc --noEmit` 输出按 `replay/array` 与 `data-common` 过滤 → **0 命中**（0 类型错误）；整仓退出码为 2，但全部为既有渲染端 / legacy 诊断（D-12 明确排除，本计划不追求全仓 `check:type`）
  - `pnpm test:ci` → **66 files passed / 667 passed / 14 skipped**（07-02 结束时基线 66 files / 656 passed / 21 skipped；**+11 passed、−7 skipped**，与「7 条取消 skip + 4 条新增聚焦用例」精确对应）
- **`it.skip` 审计：** `array.test.ts` 中已无任何 `it.skip` / `it.only`；本计划未新增任何跳过（D-10）。
- **类型码一致性自检：** `INormalizedParam.paramType` jsDoc、`normalizeParam`、`setParamArray`、`decodeParam` 四处均为 0 boolean / 1 int8 / 2 int16 / 3 int32 / 4 非负 int64 / 5 负 int64 / 6 float / 7 非负 bigint / 8 负 bigint / 9 长字符串 / 10–255 短字符串（`type = length + 9`），无旧码残留。

## findings↔ledger 对照（D-14 / Task 5 强制登记）

| Phase 6 finding | 内容 | WINDOWS.md 账本条目 | 处置 |
| --- | --- | --- | --- |
| `#06-04-1` | `array.ts` int64 解码乘数误用 `2147483647` | **id 23**（G-06-04-A，同时覆盖 `#06-04-1` + `#06-04-2`） | `fixed`（`resolved_at` 2026-09-15T10:51:28.234Z） |
| `#06-04-2` | `array.ts` 多字节 bigint 编解码错误（编码循环体 + 有符号读取） | **id 23**（同上，单条目覆盖两条 finding） | `fixed` |
| `#06-04-3` | `array.ts` `delete` 以参数字节偏移当作命令索引回退起点且末步缺终点哨兵 | **无 ledger entry** | 账本中**无对应条目**；**不新建条目**（新建会抬高 `open_count` 门禁），未执行 `fixed` / `waive` 动作 |
| `#06-04-4` | `array.ts` `insert` 两处 `copyWithin` 位移方向相反 | **无 ledger entry** | 同上：账本中**无对应条目**，未新建、未 `fixed` / `waive` |

`windows status` 结清后：`open_count 14 → 13` / `fixed_count 13 → 14` / `total_count 27`。本计划**未新建任何账本条目**、未执行任何 `waive`，也未记录新的台账缺陷（stub / skipped-test / unrun-verify / deviation 均无新增）。

### 已修复（本计划，不再登记为缺口）

- **负 int64 往返**（A8）：独立类型码 **type 5**，载荷 = 幅值 `|n|`，解码取负；取值 `-2147483649`、`-4294967297` 及非负对照 `2147483648`、`9007199254740991`（2^53 - 1）均精确往返。
- **负 bigint 往返**（A9）：独立类型码 **type 8**，载荷 = 幅值 `|n|`，解码取负；取值 `-1n`、`-128n`、`-129n`、`-256n`、`-65537n` 及非负对照 `100n`、`0x0102030405060708n` 均精确往返。
- 两者均保留与对应非负类型相同的载荷范围（**bigint 仍为 255 字节**），**无符号位借用、无范围取舍**，`BigInt.asUintN` / `asIntN` 未引入。

### 类型码表重编号记录（A10）

| type | 含义 | 载荷 | 旧码（已作废） |
| --- | --- | --- | --- |
| 0 | boolean | 1 字节 | 0 |
| 1 | int8 | 1 字节 | 1 |
| 2 | int16 | 2 字节 | 2 |
| 3 | int32 | 4 字节 | 3 |
| 4 | 非负 int64 | 8 字节（高低 32 位，幅值） | 4 |
| **5** | **负 int64** | 8 字节（高低 32 位，幅值 `|n|`，解码取负） | 新增 |
| 6 | float | 8 字节 float64 | 5 |
| 7 | 非负 bigint | 长度前缀 + 幅值字节 | 6 |
| **8** | **负 bigint** | 长度前缀 + 幅值字节（`|n|`，解码取负） | 新增 |
| 9 | 长字符串 | int32 长度前缀 | 7 |
| 10–255 | 短字符串 | 内联字节，`type = length + 9`（长度 1..246） | `length + 7`（阈值 248） |

项目**未发布、无向后兼容要求**，**不保留任何旧码或兼容分支**。`array.test.ts` 中断言类型字节 / 字符串长度阈值的既有用例已同步更新到新表（float token 5→6、单字节 bigint 6→7、短串 9→长度+9、长/空串 7→9，以及相应中文注释）；**除该类型表迁移外既有断言一字未改**。

### 仍未修复的同族缺口（只登记不修）

| 缺口 | 位置 | 说明 |
| --- | --- | --- |
| `ReplayArray.set` 的末步 `nextParam` 与回退起点 | `array.ts` `set()`（`const nextParam = this.indexArray[index + 1]`；`for (let i = paramStart + 1; ...)`） | 与 `#06-04-3` 同族：末步终点仍直读 `indexArray[index + 1]`（未初始化槽位）、索引调整起点仍为参数字节偏移 `paramStart + 1`。**未登记缺陷、无既有测试、需用户决定是否另立条目。** 本计划未修改。 |
| `insert(index === length)` 的 `paramStart` | `array.ts` `insert()`（`const paramStart = this.indexArray[index]`） | 末位追加时 `indexArray[length]` 为未初始化 0，而实际应取 `paramUsed`（末尾追加）。**未登记缺陷、无既有测试、需用户决定是否另立条目。** 本计划未修改。 |

### 另记（不在本计划范围）

- 码 **128** 占位符不足的问题属 **07-05**，本计划未触及。

## Threat Flags

None — 未引入新的信任边界或外部接口。`threat_model` 中 `T-7-02`（Tampering：`decodeParam`/`normalizeParam` 编解码不精确）已由 Task 1/2 的精确往返 + 幅值载荷 + `getUint8` 无符号读取缓解；`T-7-08`（Tampering：`delete`/`insert` 索引位移错位）已由 Task 3/4 的命令索引与参数字节偏移严格区分缓解；`T-7-SC`（依赖安装）本计划**无任何安装动作**（`package.json` / `pnpm-lock.yaml` 未变更）。

## Known Stubs

None — 本计划未新增 stub、未新增 `TODO` / `FIXME`、未留下占位实现，未遗留未运行的 `<verify>`。WINDOWS.md 亦未新增任何条目。

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- replay 系统 `#06-04-1..4` 已全部修复并原子入库（4 个 fix 提交），7 条正确预期用例转绿、4 条经授权的负值聚焦用例入库，focused 套件 46/46、全量套件 667 passed / 14 skipped；WINDOWS.md id 23 结清。
- 负值路径（负 int64 type 5 / 负 bigint type 8）现为可逆；类型码表已整体重编号，**下游任何按类型码硬编码的消费方都需按新表对齐**（本计划范围内已确认无其他消费方：`types.ts` 的 `ReplayParamValue` 不暴露类型码）。
- 同族仍有 2 条未登记缺口（`set`、`insert(index === length)`），已如实登记于本 SUMMARY，**未被静默忽略**，待用户决定是否另立条目 / 另立计划。
- 剩余 Phase 7 计划（hero / map / flag+common / save / path）尚未执行；本计划源码层与其他计划无耦合，但按 D-09 / D-12c 仍须**串行**执行。
- **STATE.md / ROADMAP.md 未由本执行者修改**（按 orchestrator 指示，由 orchestrator 在 wave 完成后统一写入）。

---
*Phase: 07-data-fixes*
*Completed: 2026-09-15*

## Self-Check: PASSED

- SUMMARY.md present at `.planning/phases/07-data-fixes/07-03-SUMMARY.md`
- Commits present: 528b8c9, 965e002, 45dde1c, 40824cc
- Modified files present: `packages-user/data-common/src/replay/array.ts`, `packages-user/data-common/src/replay/array.test.ts`, `.planning/WINDOWS.md`
- Ledger: id 23 `status=fixed`; `open_count=13` / `fixed_count=14` / `total_count=27` (no new entries)
- Focused suite: 46 tests / 46 passed / 0 skipped; full suite: 66 files / 667 passed / 14 skipped
