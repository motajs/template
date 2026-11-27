# Phase 09 Plan 43: 旧样板对等性总索引改写 Summary

把 `09-PARITY/00-INDEX.md` 从机器口径台账改写成人读总索引：只保留旧样板清单，统一三值判定与六列格式，保留 25 项枚举源与 6 份文档索引。

## 结果

- 目标文档：`.planning/phases/09-minimum-browser-runnable/09-PARITY/00-INDEX.md`
- 基线行数：25
- 新文档行数：25
- 文档索引：6
- 合并/拆分记录：无
- 判定标准：支持 / 部分支持 / 不支持；无法确认一律记不支持并注明。
- 六列表头：序号、旧样板功能、旧样板行为、新样板判定、新样板如何实现、差异 / 说明。
- 删除项：影响等级、五值枚举、证据等级、附录专用规则、十列字段模板、汇总矩阵模板。

## 快照（写作时刻）

| 项 | 值 |
| --- | --- |
| 旧样板 HEAD | `3efb548e407ad2b8007b498cb98401e2012a0b55`（`master`，工作树干净） |
| 新样板 HEAD | `5af3ab378b4d65dc5cf1fbcb621fd9a776608dd7`（`refine/data-client`，159 行改动） |
| 采样时间 | `2026-11-03 21:19`（UTC+8） |
| 目标文档改写前 SHA256 | `FA9EC52E280C3DA6E0FAE5F80F0F7A7B98B7ED2EDFE992EC3C0936EE83EB93A3` |

工作树在写作期间由用户并发改动；本计划只读旧源码，不触碰任何外部改动，也不回滚。

## 门禁真实输出

### Task 1：清单与基线

命令：计划内嵌 `<automated>` 原文。

```text
numbered=25 missingDocs=0
TASK1 GATE OK
```

### Task 2：三值标准与六列格式

命令：计划内嵌 `<automated>` 原文。

```text
missing=0 bad=False
TASK2 GATE OK
```

### Task 3 / Task 4：文档结构

计划内嵌门禁的禁用词检查在第 56 行命中 `05-RUNTIME-UNCERTAIN.md`：

```text
badCount=1
56: | [05-RUNTIME-UNCERTAIN.md](./05-RUNTIME-UNCERTAIN.md) | ... |
```

原因：计划要求文档出现文件名 `05-RUNTIME-UNCERTAIN.md`，同时把 `UNCERTAIN` 列为禁用词；PowerShell `Select-String` 默认不区分大小写，因此文件名命中。该命中是否属于门禁表述问题，待用户确认。

Task 3 门禁在 `$bad` 处退出（输出为命中行，退出码 1）。Task 4 门禁同样在 `$bad` 处退出，输出为禁用词命中数：

```text
1
```

除该文件名外，结构门禁全部通过：

```text
headerPresent=True
rows=25
missingDocs=0
```

补充检查：把 `05-RUNTIME-UNCERTAIN.md` 替换为占位符后，再跑同一禁用词正则，结果为空；其余门禁逐条实跑如下：

```text
badExcludingFilename=False
headerPresent=True
rows=25
missingDocs=0
summaryKey[基线行数：25]=True
summaryKey[新文档行数：25]=True
summaryKey[文档索引：6]=True
summaryKey[合并/拆分记录：无]=True
extraPaths=0
scopeUnchanged=True
hashChanged=True
newHash=184100BC7A7603805EDB3037517EDB9C8CA14FA32E7C607E4B8DB722A48E8AA1
baselineLines=159
scopeLines=38
```

结论：除文件名命中项外，Task 3、Task 4 的所有结构、统计、范围与哈希检查均通过。

## 偏差

### 1. [Rule 1 - 门禁结果] 必需文件名命中禁用词

- 发现于：Task 3、Task 4。
- 现象：门禁要求六份文档路径齐全，其中包含 `05-RUNTIME-UNCERTAIN.md`；同一门禁又禁止出现 `UNCERTAIN`。`Select-String` 不区分大小写，文件名因此命中。是否属于门禁表述问题，待用户确认。
- 处理：保留六份文档路径与文件名，不改文档、不放宽检查；用补充命令证明除该文件名外，文档不含任何禁用词，其余结构与范围门禁全部通过。
- 影响：文档内容符合三值标准与六列格式，未改源码、配置、STATE、ROADMAP、计划或其它文档。

## 范围证明

- 基线：`git status --porcelain -uall` 共 159 行，已写入 `%TEMP%/gsd-09-43-baseline.txt`。
- 范围基线：`src`、`packages`、`packages-user`、`public`、`package.json`、`pnpm-lock.yaml`、`.planning/STATE.md`、`.planning/ROADMAP.md` 共 38 行，已写入 `%TEMP%/gsd-09-43-scope.txt`。
- 相对基线新增路径仅：目标文档与本源文件；两者均由本计划创建或改写。
- 源码、配置、STATE、ROADMAP 状态与基线一致。
- 目标文档 SHA256 已变化（改写前见上表）。
- 未修改 `01-DATA.md` 至 `05-RUNTIME-UNCERTAIN.md`、`09-42-PLAN.md` 或任何既有计划/总结。

## 未提交声明

两个文件保持未提交：未运行 `git add`、`git commit`、`git stash`、`git checkout`、`git reset` 等写命令；只使用了 `git status`、`git rev-parse`、`git log` 等只读命令。

## 自检

- [x] 目标文档存在且为人读版总索引。
- [x] 25 项旧枚举源台账完整，编号行 25。
- [x] 6 份文档路径齐全。
- [x] 六列表头逐字一致。
- [x] 三值标准可直接被 01 至 05 分册复用。
- [x] 源码、配置、STATE、ROADMAP 零改动。
- [x] 零提交。
