# Phase 09 Plan 50: TextContent 方括号标签与转义 Summary

## 概述

本计划把 `TextContent` 解析器的全部标签识别改为方括号语法，并实现方括号转义规则。改动只涉及 `packages-user/client-base/src/components/textboxTyper.ts`，并新增本 SUMMARY；未修改调用点、文档、测试、配置、STATE、ROADMAP 或任何其它文件；未提交；未运行测试、构建、浏览器、开发服务器或包管理命令。

## 标签映射

| 标签 | 类型 | 旧入口 | 说明 |
|------|------|--------|------|
| `[c=#DDD]xxxxx[/c]` | 配对标签 | `\r[...]` / `\r` | 颜色填充样式，压栈 / 出栈 |
| `[s=20]xxxxx[/s]` | 配对标签 | `\c[...]` / `\c` | 字号，`parseFloat` 取等号后的值，压栈 / 出栈 |
| `[f=Verdana]xxxxx[/f]` | 配对标签 | `\g[...]` / `\g` | 字体族，压栈 / 出栈 |
| `[b]` | 无闭合单标签 | `\d` | 粗体 toggle |
| `[i]` | 无闭合单标签 | `\e` | 斜体 toggle |
| `[w=100]` | 无闭合单标签 | `\z[100]` | 等待，`parseInt` 后调用 `addWaitRenderable(end + 1, time)` |
| `[icon=num]` | 无闭合单标签 | `\i[...]` | 图标，保留 `^\d+$`、`^X\d+$` 与 `texture.idNumberMap` 别名查找 |

换行 `\n` 与 `\\n` 的语义不变。

## 方括号规则

- 普通文本 `[[` 输出 `[`，`]]` 输出 `]`，两种转义均成对消耗。
- 普通文本中不成对的单个 `[` 或 `]` 原样显示。
- `[` 紧跟空格时输出 `[`，不按标签解析；空格正常处理，不被吞掉。
- 标签头 / 参数内不应用普通文本转义：`[[` 原样保留，`]]` 的首个 `]` 关闭标签且不输出。
- 未知 / 畸形标签（空标签头、未知名称、缺 `=`、等号后为空、`[/x]`、`[b=…]`、`[i=…]`、`[w]`、`[icon]` 等）原样输出源码文本，不崩溃。
- 不注册自定义标签。

## 删除项

- 反斜杠 switch 中的 `case 'r'`、`'c'`、`'g'`、`'d'`、`'e'`、`'z'`、`'i'`。
- 主循环中的 `else if (char === '\r')` 裸回车颜色分支。

上述旧入口已不再具备任何语义。

## 保留项

- `\n`、`\\n`、`\\`、`\$` 与 `${}` 表达式逐字保留。
- 解析栈（`fillStyleStack`、`fontSizeStack`、`fontFamilyStack`）、`addTextNode`、`addWaitRenderable`、`addIconRenderable`。
- `parseFontWeight` / `parseFontItalic` 的 toggle 行为。
- `getChildableTagParam` / `getTagParam` / `indexParam` 的签名与内部逻辑；仅改为以标签头指针调用。
- `splitLines` / `splitNode` / `processTextNode` / `measure` / `newLine` / `pushBlock` / `guessChars` / `bsLineWidth` / `generateBlock`。
- `ITextContentConfig`、`TextContentTyper`、`TextContentParser` 的导出面与签名。
- 既有注释逐字未改；文件保持 CRLF。

## 范围证明

- 修改文件：`packages-user/client-base/src/components/textboxTyper.ts`。
- 新增文件：`.planning/phases/09-minimum-browser-runnable/09-50-SUMMARY.md`。
- 未修改调用点、文档、测试、配置、STATE、ROADMAP 或任何其它文件。
- 未执行 `git add`、`git commit`、`git stash`、`git checkout`、`git reset` 等任何 git 写命令；改动全部留在工作区。
- `textboxTyper.ts` 未执行整文件格式化或重写，只做最小 diff 编辑。

## 验证声明

- 本计划没有可运行的自动验证。
- 未运行测试、构建、浏览器、开发服务器或包管理命令。
- 正确性未在运行时验证；仅按计划做人工源码断言。

## 命名声明

- 未新增公共 / 受保护 / 私有方法、字段、类型或导出符号。
- 未新增导入或依赖。
- 只使用用户指定的标签拼写（`c` / `s` / `f` / `b` / `i` / `w` / `icon`）与既有命名。

## 放行记录

- Task 0 已由用户原话「可以执行」放行，并由 orchestrator 在派发执行器前转达。
- 结构化放行行：`APPROVED: 可以执行 | source: 用户原话 | time: 2026-11-05 20:09:48`（time 为执行器核对时点）
- 账户 / 时间门禁：账户 `13194` 属于需检查名单；执行时本地时间为 2026-11-05 20:09:48，早于 22:00，门禁未触发、未停止。
- 未写入 `%TEMP%/gsd-09-50-approval.txt`：本次执行约束只允许修改 `textboxTyper.ts` 与新增本 SUMMARY。

## 自检

- SUMMARY 的标签映射与方括号规则与源码一致。
- 未把未运行的验证写成已通过。
- 未超出 `files_modified` 的改动。
