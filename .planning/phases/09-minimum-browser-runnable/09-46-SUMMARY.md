# 09-46 渲染对照重写总结

## 结果

- 目标文档：`.planning/phases/09-minimum-browser-runnable/09-PARITY/03-RENDER.md`
- 当前特性表行数：94
- 基线行数：94
- 新文档行数：94
- 移除新引擎独有行：0
- 目标文档字节数：34359

三值统计：

- 支持：60
- 部分支持：27
- 不支持：7

三项相加为 94，与当前行数一致。

## 改写内容

- 只保留旧样板 `D:/github/mota-js` 已有的渲染能力，按地图渲染器、图块材质、动画与大图、透明度与滤镜、天气、字体与文本、布局与视口、缩略图、勇士与门与地图文字、Canvas2D 原语拆分。
- 删除影响等级、五值枚举、证据等级与机器可读标记；所有判定统一为「支持」「部分支持」「不支持」。
- 删除新引擎独有的抽象基类说明与新的天气预设计数；该说明不是计分行，因此移除行数为 0，旧侧 94 行全部保留。
- 旧 Canvas2D 原语按现有标签与组件重判：`fillRect`/`strokeRect` 对应 `g-rect`，`fillRoundRect`/`strokeRoundRect` 对应 `g-rectr`，`fillEllipse`/`strokeEllipse` 对应 `g-ellipse`，`fillPolygon`/`strokePolygon` 对应 `g-path`，`drawLine` 对应 `g-line`，`fillArc`/`strokeArc` 对应 `g-circle`，`drawImage` 对应 `image`，文本对应 `text` 与 `TextContent`。
- 保留旧符号锚点与旧行号，修正核验过的偏差：`moveBlock` 为 `libs/maps.js:2600`，`_moveBlock_updateDirection` 为 `:2676`，`_getBigImageInfo` 为 `:955`，`_drawSelector` 为 `libs/ui.js:884`，`updateViewport` 为 `libs/control.js:841`，`resize` 为 `:3245`。
- 支持与部分支持的实现列均给出新包路径或 `g-` 标签锚点；不支持行写明已检索范围与无法确认的原因。

## 合并或拆分记录

本次未合并或拆分旧侧条目，94 行与基线一一对应；只调整行文、判定与锚点，不改变域拆分与 ID 映射。

## 门禁输出

- Task 1：`raw=94`；清单文件含「基线行数：94」。
- Task 2：`rows=94 bad=0`；94 行均为四列制表符分隔，判定只在三值内，支持与部分支持均含反引号锚点。
- Task 3：`rows=94 headers=10`；无禁用枚举、影响等级、机器标记与新引擎独有内容；十张表表头一致。
- Task 4：`old=219 new=114 long=0`；`RENDER GATES OK`；目标文档 SHA256 为 `36E99528AD38133D90082F2A639CCD0A011CBF1883002296A68EB9409A978408`。

## 范围证明

- 只写 `09-PARITY/03-RENDER.md` 与 `09-46-SUMMARY.md`。
- 未修改 `00-INDEX.md`、`01-DATA.md`、`02-GAMEPLAY.md`、`04-UI-INPUT.md`、`05-RUNTIME-UNCERTAIN.md`、`09-42-PLAN.md`、任何源码、配置、内容、`STATE.md`、`ROADMAP.md`、既有计划与总结。
- 未运行任何 git 写命令，两个 Markdown 文件保持未提交。
- 快照：旧样板 HEAD `3efb548e407ad2b8007b498cb98401e2012a0b55`，工作树干净；新样板 HEAD `5af3ab378b4d65dc5cf1fbcb621fd9a776608dd7`，分支 `refine/data-client`，工作树 162 行改动；写作时间 2026-11-04 13:28（UTC+8）。

## 偏差记录

- 门禁把 `info` 当作禁用词，而旧符号 `_drawBlockInfo`、`getBlockInfo`、`_getBigImageInfo`、`doorInfo`、`posInfo` 天然包含该子串。为不改门禁、不伪造符号，正文改用中文描述这些内部函数并保留原 `file:line` 锚点；这属于门禁子串误判导致的表述调整，不改变旧侧覆盖。
- 目标文档哈希在改写前为 `5A62CF078841DA5806F494320F375BBB3F1313DC445F5DDD7B9F59B27375EB2E`，改写后由 Task 4 重新记录。

## 标注

- not planned：1（标号 40）
