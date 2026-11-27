# Phase 09 Plan 49: 静态可运行性审计 Summary

## 结论

已完成只读静态审计，产出 09-RUNNABILITY-AUDIT.md。当前快照不能完成浏览器启动，最小阻断集由 6 条 P0 与 7 条 P1 组成。未改代码、配置、内容、STATE、ROADMAP；未提交。

## 基线

- 基线 HEAD：5b1f8664093f8f9687499ec092e3f3150a507f9f
- 基线脏文件数：79
- 采集时间：2026-11-05 18:46:50
- 类型检查时间：2026-11-05 18:47:19 至 18:47:24
- 当前 HEAD：b950c53f98804587058a9549a0178761efb4b89b（外部漂移，见下）

## 计数

- P0 数量：6
- P1 数量：7
- 预期中：4 条（并发编辑接口未适配、测试夹具未同步、类型层未对齐、浏览器 ESNext 支持无法静态确认）
- 最小可运行路径：8 步

## 类型检查证据

- 命令：pnpm check:type（等价 vue-tsc --noEmit，经 pnpm.cmd 执行）
- 退出码：2
- 错误行总数：258
- 非测试源错误行：92
- 说明：用户并发编辑接口，退出码非零属预期；只作时间点证据，不计为本执行器引入的新缺陷。
- 环境偏差：pnpm.ps1 被 PowerShell 执行策略拦截，改用 pnpm.cmd；属环境限制。

## 八类覆盖

- 入口与导入：主链存在，但 P0-1、P0-2、P0-6 造成解析或链接失败。
- core/main 残留：core.d.ts 仍声明 main、core、Mota，UI 仍在使用且运行期未赋值（P0-5、P1-6）。
- 内容加载：配置路径可解析；数据配置只下载不落地，客户端清单未接入且缺资源（P1-1、P1-3、P1-7）。
- 渲染/UI：场景打开链存在，被 P0-1、P0-2、P0-5 截断，元素未注册（P1-2）。
- 事件：createEventRegistrations 与 GameEventSystem 已接，静态类型通过；未运行。
- 战斗：initializeEnemy 与战斗钩子已接，静态类型通过；未运行。
- 寻路：DefaultPassPredicateImpl、finder.useMapLayer 与 useMover 已接，静态类型通过；未运行。
- 存档：addSaveableContent 与 save.init 代码存在，但依赖 afterLoad；当前入口不触发（P0-4）。
- 构建：vite 配置可用；check:circular 指向不存在的 src/main.ts（P1-5）。
- 工作区依赖：pnpm-workspace 覆盖 packages、packages-user、src；workspace 依赖齐全；未安装或构建。
- 系统级集成：插件构造顺序、顶层 load、客户端钩子与元素注册存在缺环（P0-3、P0-4、P1-1、P1-2）。

## 门禁结果

- Task 0 结构化放行：通过（APPROVED 行已写入，账户/时间门禁未触发）。
- Task 1 证据文件与命令白名单：通过（task1-gate-ok）。
- Task 2 启动链分析：通过（task2-gate-ok）。
- Task 3 子系统分析：通过（task3-gate-ok）。
- Task 4 文档门禁：见下方「Task 4 门禁实况」。

## 范围证明

- 执行器写入范围外：无
- 两个目标文档的 .bak、.tmp 等后缀变体均未写入。
- 代码、配置、内容、STATE.md、ROADMAP.md、既有计划与摘要均未修改。
- 未创建分支或工作树；未运行游戏、浏览器、dev 服务器、构建或测试（仅一次 pnpm check:type 作为证据）。

## 外部漂移

- 外部漂移数量：1
- 明细：HEAD 由 5b1f8664093f8f9687499ec092e3f3150a507f9f 变为 b950c53f98804587058a9549a0178761efb4b89b，新提交 b950c53 的时间为 2026-11-05 18:51:26 +0800，提交信息为 feat: IHotkeyUsing 补充 when 方法。
- 归因：该变化由用户并发提交造成，不是本执行器写入；本执行器未执行任何 git 写命令，未回滚或删除用户改动。
- 文件级漂移：与基线 porcelain 比对，新增项只有本执行器的 09-RUNNABILITY-AUDIT.md，未发现其它新增或删除路径。

## 未提交声明

- 两个 Markdown 文档均未提交，保持未跟踪状态。
- 未执行 git add、git commit、git push 或任何其它写命令。

## 并发说明

- 用户在同一工作树并发编辑接口并提交，审计内容只代表 2026-11-05 18:46:50 至 18:47:24 的采集瞬间。
- 预期中的类型错误不当作新阻断；若外部漂移导致后续证据变化，以重新采集为准。
- Task 4 门禁中的 HEAD 校验会因上述外部提交而报 head-changed；这是外部漂移的真实结果，未通过修改基线或放宽门禁规避。

## Task 4 门禁实况

- 文档存在与 CRLF：通过。
- 标题、分类、file:line、最小路径、八类覆盖、无 parity：通过。
- HEAD 未变：未通过（head-changed，外部用户提交导致）。
- 备注：该失败不由本执行器的写入造成，记录为外部漂移，不修改基线、不放宽门禁。
