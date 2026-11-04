# 02 玩法系统对照

> 本文件只对照旧样板的玩法与行为：伤害管线、临界、光环与支援、地图伤害、减益与状态、事件语句、预编译与系统触发器、事件值表达式、寻路与楼层切换、商店升级统计、回放命令与路线编码。数据字段归 `01-DATA.md`，渲染归 `03-RENDER.md`，界面与输入归 `04-UI-INPUT.md`，运行时归 `05-RUNTIME-UNCERTAIN.md`。
> 判定口径来自 `00-INDEX.md`：支持表示可由现有接口、标签或组件以简单组合实现；部分支持表示核心能力已存在但需要适配，或只覆盖一部分行为；不支持表示需要新增语句类型、写复杂逻辑或直接调用底层接口。
> 旧样板是唯一清单来源；新样板只作实现依据，不以全局旧对象或类型声明作为实现证据。

## 0. 快照

| 项 | 值 |
| --- | --- |
| 旧样板根目录 / 分支 | `D:/github/mota-js` / `master` |
| 旧样板 HEAD | `3efb548e407ad2b8007b498cb98401e2012a0b55` |
| 旧样板工作树 | 0 行 |
| 新样板根目录 / 分支 | `D:/github/template` / `refine/data-client` |
| 新样板 HEAD | `5af3ab378b4d65dc5cf1fbcb621fd9a776608dd7` |
| 新样板工作树 | 161 行（采样时） |
| 采样时间 | 2026-11-03 21:59:43（UTC+8） |
| 条目基线 | 当前 283 行，移除 11 行，旧侧 272 行 |

- 快照只用于定位本文档对应的版本；工作树会持续变动，后续重采样不沿用本行数值。
- 本文件不回滚、不触碰任何用户改动。

## 1. 阅读口径

- 双记录：旧有效行为等于 `libs/*` 默认实现加上 `project/functions.js` 覆写。两者不一致时同一行同时给两处锚点，或写明样板有效行为所在行。
- 玩法相关覆写分布在事件、怪物、动作、控制和界面五个分区，共 29 个函数；本文件只在受影响行引用对应锚点，界面布局判定归界面分册。
- 六列固定为序号、旧样板功能、旧样板行为、新样板判定、新样板如何实现、差异 / 说明。每格一到两句，单元格内不出现竖线。
- 事件语句按能力判定：可由现有语句种类、内建函数、标签或组件简单组合实现时判支持或部分支持；必须新增语句类型、写复杂调度或直接调用底层接口时判不支持。
- 现有接口无法确认可以简单实现时一律判不支持，并在说明列写已检索的范围。

## 2. 伤害管线（18）

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 勇士实际属性与怪物有效属性 | project/functions.js:657 先取勇士实际属性，再取已含坚固/模仿/光环的怪物属性 | 部分支持 | `packages-user/data-base/src/hero/attribute.ts` 的 base/final 双视图 + `src/data/enemy/calculator.ts:21` 主计算器 | 新拆成 base/final/modifier 三层链，光环在最终效果之前执行，顺序与旧不同 |
| 2 | 二倍斩技能翻倍 | project/functions.js:680 技能 1 开启时勇士攻击翻倍后再参与后续计算 | 不支持 | 无等价能力 | 检索 skill、二倍斩、doubleSlash 未命中运行时注册点，新无技能开关层 |
| 3 | 无敌怪不可战斗 | project/functions.js:685 无敌且未持十字架时返回 null | 部分支持 | `src/data/enemy/calculator.ts:31` 用 Infinity 伤害与 0 回合表示不可战斗 | 旧返回 null，新需按 Infinity 判定，调用方要适配 |
| 4 | 吸血 | project/functions.js:692 按 enemy.vampire 比例吸血并计入战前伤害 | 部分支持 | `src/data/enemy/calculator.ts:52` + `src/data/enemy/special.ts:17` 特殊码 9 对象值 | 新为百分比对象值，取整时机在最终输出 |
| 5 | 每回合伤害 | project/functions.js:708 怪物攻击减勇士防御，负值归 0 | 支持 | `src/data/enemy/calculator.ts:63` 同一公式与魔攻分支 | 夹紧与连击倍率先后不同但数学等价 |
| 6 | 连击 | project/functions.js:715 特殊码 4/5/6 分别 2/3/n 连击 | 部分支持 | `src/data/enemy/calculator.ts:70` + `src/data/enemy/special.ts:143` 新码 4 的 n 连击 | 旧三个码合并为一个码，旧码 5、6 的内容需迁移 |
| 7 | 反击 | project/functions.js:720 按勇士攻击比例反击并按回合计入 | 部分支持 | `src/data/enemy/calculator.ts:111` 特殊码 6 百分比并入每回合伤害 | 默认值由全局改为 0，计入次数由 turn 改为 turn-1 |
| 8 | 先攻 | project/functions.js:725 战前额外承受一回合伤害 | 支持 | `src/data/enemy/calculator.ts:100` 战前一次性加一回合伤害 | 都在扣护盾之前，行为一致 |
| 9 | 破甲 | project/functions.js:728 按勇士防御比例造成战前伤害，缺省取全局 | 部分支持 | `src/data/enemy/calculator.ts:105` + `src/data/enemy/special.ts:153` 特殊码 5 | 新为百分比对象值且无全局缺省，迁移需乘 100 |
| 10 | 净化 | project/functions.js:732 按护盾倍率造成战前伤害 | 部分支持 | `src/data/enemy/calculator.ts:118` + `src/data/enemy/special.ts:175` 特殊码 7 | 语义接近，新缺省 0 且无全局回退 |
| 11 | 未破防不可战斗 | project/functions.js:736 勇士每回合伤害不大于 0 时返回 null | 部分支持 | `src/data/enemy/calculator.ts:46` 用 Infinity 表示不可战斗 | 与第 3 行同源，旧 null 需按 Infinity 适配 |
| 12 | 回合数 | project/functions.js:742 怪物生命除以每回合伤害并向上取整 | 支持 | `src/data/enemy/calculator.ts:77` 同一公式与取整方向 | 新在支援递归之前计算 |
| 13 | 支援递归与回合 | project/functions.js:744 默认当前怪先打，支援怪回合不并入当前怪 | 部分支持 | `src/data/enemy/calculator.ts:79` + `src/data/enemy/aura.ts:142` | 新无条件并入支援怪回合，结果按更多回合放大 |
| 14 | 总伤害 | project/functions.js:777 初始伤害加回合伤害加反击 | 部分支持 | `src/data/enemy/calculator.ts:124` 反击并入每回合伤害后统一乘 turn-1 | 旧反击单独乘 turn，数值可能不同 |
| 15 | 扣护盾 | project/functions.js:779 总伤害统一扣一次护盾 | 支持 | `src/data/enemy/calculator.ts:127` 支援递归把支援怪护盾置 0 | 护盾只扣一次，与旧注释意图一致 |
| 16 | 负伤开关 | project/functions.js:781 关闭负伤时伤害夹到 0 | 支持 | `src/data/enemy/calculator.ts:129` 读取 enableNegativeDamage 后夹紧 | 默认关闭，行为一致 |
| 17 | 仇恨与固伤追加 | project/functions.js:786 护盾后追加仇恨 flag 与怪物固伤 | 部分支持 | `src/data/enemy/calculator.ts:140` 特殊码 20 固伤与仇恨值 | 数据来源改为特殊值，顺序互换但加法可交换 |
| 18 | 伤害结果字段 | project/functions.js:793 返回 8 个字段并逐字段取整 | 部分支持 | `src/data/enemy/calculator.ts:156` + `packages-user/data-system/src/combat/types.ts:377` | 新只返回伤害与回合，攻防等字段需另取 |

旧有效实现是 `project/functions.js:646` 起的样板覆写，新实现是 `src/data/enemy/calculator.ts:17` 的主计算器、`src/data/enemy/final.ts:10` 的最终效果与 `src/data/enemy/aura.ts` 的光环支援。18 个阶段与旧划分一一对应。

## 3. 临界算法（9）

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 19 | 坚固与模仿临界短路 | libs/enemys.js:276 坚固或模仿直接返回空临界表 | 部分支持 | `src/data/enemy/calculator.ts:162` getCriticalLimit 对坚固返回 Infinity | 模仿未短路，仍会进入二分 |
| 20 | 未破防临界 | libs/enemys.js:257 未破防时二分找最小破防攻击 | 部分支持 | `packages-user/data-system/src/combat/damage.ts:147` findNextCritical | 新无独立破防分支，用上界提前返回 |
| 21 | 线性扫描临界 | libs/enemys.js:282 useLoop 时线性扫描攻击值 | 不支持 | 无等价能力 | 检索 useLoop、criticalUseLoop 未命中，新固定二分 |
| 22 | 二分临界 | libs/enemys.js:304 二分求伤害首次下降点 | 支持 | `packages-user/data-system/src/combat/damage.ts:147` 二分与精度上限 | 收敛条件不同但同为二分 |
| 23 | 回合反推临界 | libs/enemys.js:341 按回合数反推攻击临界 | 不支持 | 无等价能力 | 检索 useTurn、nextCriticals 未命中 |
| 24 | useLoop 总开关 | libs/enemys.js:243 决定线性、二分或回合反推三种算法 | 不支持 | 无等价能力 | 新固定二分，无运行时开关 |
| 25 | 临界上界 | libs/enemys.js:272 未破防时以生命加防御为上界 | 支持 | `src/data/enemy/calculator.ts:162` getCriticalLimit 按属性给上界 | 新对攻击以外的属性用勇士最终属性 |
| 26 | 单次二分 | libs/enemys.js:304 内层二分试探攻击值 | 支持 | `packages-user/data-system/src/combat/damage.ts:147` findNextCritical 改写属性后重算 | 新通过修改属性试探并依赖可修改副本 |
| 27 | 伤害归零终止 | libs/enemys.js:239 伤害归零且未开负伤时结束临界表 | 部分支持 | `packages-user/data-system/src/combat/damage.ts:243` 外层循环以边界终止 | 新无显式归零终止，负伤只在计算器内夹紧 |

旧入口是 `libs/enemys.js:222` 的临界计算与五个分支，新入口是 `packages-user/data-system/src/combat/damage.ts:147` 的二分与 `src/data/enemy/calculator.ts:162` 的上界。旧返回攻击增量列表，新产出临界对象。

## 4. 光环与支援（8）

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 28 | 光环范围与形状 | project/functions.js:583 haloRange 为空表示全楼层，否则十字或九宫格 | 支持 | `src/data/enemy/aura.ts:63` 以 range 小于等于 0 表示全楼层 | 旧用 null 表示全体，新用 0，字段由顶层改为对象值 |
| 29 | 光环叠加 | project/functions.js:592 同范围百分比求和后一次乘算，默认按 id 去重 | 部分支持 | `src/data/enemy/aura.ts:93` 每个光环各自取整后相加 | 新逐光环取整且不按 id 去重 |
| 30 | 光环与坚固模仿顺序 | project/functions.js:546 先坚固或模仿再乘光环百分比 | 部分支持 | `packages-user/data-system/src/combat/context.ts:649` 先光环后最终效果 | 与旧顺序相反，同时存在时数值不同 |
| 31 | 支援范围 | project/functions.js:599 周围八格内的其它支援怪加入 guards | 支持 | `src/data/enemy/aura.ts:125` 3×3 矩形范围并排除自身 | 都是八邻格，语义一致 |
| 32 | 支援不二级递归 | project/functions.js:754 递归不传坐标以跳过支援扫描 | 支持 | `src/data/enemy/calculator.ts:79` 用 inGuard 标记阻止二级支援 | 效果一致 |
| 33 | 支援回合并入 | project/functions.js:747 支援怪伤害累加但回合不并入 | 部分支持 | `src/data/enemy/calculator.ts:79` 无条件累加支援怪回合 | 回合直接相加，总伤害偏大 |
| 34 | 光环缓存 | project/functions.js:561 按坐标与楼层缓存全图扫描结果 | 支持 | `packages-user/data-system/src/combat/context.ts:83` 脏标记与增量重算 | 失效粒度不同，能力等价 |
| 35 | 光环扩展点 | project/functions.js:592 只能改样板函数新增光环类型 | 支持 | `packages-user/data-system/src/combat/context.ts:123` 四个注册点 | 新按优先级注册，可追加转换器与最终效果 |

旧侧没有光环抽象，光环与支援都在 `project/functions.js:523` 的怪物信息函数里靠全图扫描实现；新侧是转换器、优先级与扫描范围架构，入口在 `packages-user/data-system/src/combat/context.ts:399`。

## 5. 地图伤害（9）

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 36 | 领域 | project/functions.js:1290 范围内每格加 zone 伤害，square 切换形状 | 支持 | `src/data/enemy/mapDamage.ts:84` MapDamageType.Zone | 数学范围一致，字段改为对象值，关闭开关无对应 |
| 37 | 阻击 | project/functions.js:1315 邻格造成 repulse 伤害并后退一格 | 支持 | `src/data/enemy/mapDamage.ts:121` + `src/data/enemy/hook.ts:100` | 新固定十字邻格，后退判定改用勇士反向与空格检查 |
| 38 | 激光 | project/functions.js:1342 整行整列加 laser 伤害 | 支持 | `src/data/enemy/mapDamage.ts:155` MapDamageType.Layer 与同行同列 | 新参数来自对象值，可随朝向改变 |
| 39 | 捕捉 | project/functions.js:1363 邻格打捕捉标记，踩上强制战斗 | 部分支持 | `src/data/enemy/mapDamage.ts:257` 用 extra.catch 与 Unknown 类型 | 新固定曼哈顿邻居，无独立捕捉类型 |
| 40 | 夹击 | project/functions.js:1379 两只同 id 夹击怪之间扣半血 | 部分支持 | `src/data/enemy/mapDamage.ts:186` MapDamageType.Between | 新不要求同 id，半血基准改为当前生命 |
| 41 | 血网 | project/functions.js:1283 图块 id 为 lavaNet 且无护身符时扣血 | 不支持 | 无等价能力 | 检索 lavaNet、lavaDamage 只命中内容与类型声明 |
| 42 | 地图伤害扣血与统计 | libs/control.js:1123 扣血、提示、统计与死亡判定 | 部分支持 | `src/data/enemy/hook.ts:74` 扣血与提示，位移由阻击和捕捉处理 | 新无额外伤害统计与商店访问重置 |
| 43 | 护盾抵御地图伤害 | project/functions.js:1446 减免段被注释，地图伤害不扣护盾 | 支持 | `src/data/enemy/mapDamage.ts:331` 归约器只求和 | 新旧都不扣护盾 |
| 44 | 关闭开关 | project/functions.js:1290 no_zone 等五个 flag 可关闭对应伤害 | 不支持 | 无等价能力 | 检索五个 flag 未命中，新只能禁用对应转换器 |

旧地图伤害在 `project/functions.js:1252` 的检查图块覆写里计算，扣血在 `libs/control.js:1123`；新实现是 `src/data/enemy/mapDamage.ts` 的视图与归约器，扣血与位移在 `src/data/enemy/hook.ts:74`。

## 6. 减益与状态（8）

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 45 | 中毒 | project/functions.js:1119 poison flag 每步扣全局毒伤 | 支持 | `src/data/enemy/hook.ts:45` 每步与寻路扣血，`src/data/enemy/hook.ts:226` 战后设置 | 新把 flag 与毒伤合并为数值，无 poisonDamage 统计 |
| 46 | 衰弱 | project/functions.js:1123 weakValue 大于等于 1 扣点数，否则扣比例 | 部分支持 | `src/data/enemy/hook.ts:188` PercentageModifier | 新只有百分比修饰器，无点数分支 |
| 47 | 诅咒 | project/functions.js:1136 战后置 curse flag 并清空金币经验 | 支持 | `src/data/enemy/hook.ts:242` + `src/data/enemy/script.ts:51` | 新同样按 flag 跳过奖励 |
| 48 | 仇恨累计 | project/functions.js:346 战后仇恨减半，所有怪累加全局仇恨 | 部分支持 | `src/data/enemy/hook.ts:247` 仇恨与当前仇恨拆分 | 新缺省为 1，旧取全局配置 |
| 49 | 退化 | project/functions.js:355 战后永久扣攻防并夹到 0 | 支持 | `src/data/enemy/hook.ts:256` 通过属性层扣减 | 新是否允许负值由属性层决定 |
| 50 | 重生 | project/functions.js:350 击败后记录，换层时放回 | 支持 | `src/data/enemy/hook.ts:264` + `src/data/enemy/hook.ts:283` | 新用 rebirth flag 存楼层与坐标 |
| 51 | 属性设置与读取 | libs/control.js:2402 读写勇士属性并提供实际与裸装视图 | 部分支持 | `packages-user/data-base/src/hero/attribute.ts` + `packages-user/data-base/src/hero/modifier.ts` | 新无直接加减基础属性与裸装属性等价物 |
| 52 | 状态栏减益展示 | project/functions.js:1594 状态栏展示毒、衰、咒标记 | 部分支持 | `src/client/ui/statusBar.tsx:63` 读取 flag 并显示标记 | 展示存在，数据仍走 flag 层，布局归 UI 分册 |

旧状态接口在 `libs/control.js:2402`，样板毒、衰、咒覆写在 `project/functions.js:1112`；新侧战后钩子在 `src/data/enemy/hook.ts:188`，属性修饰器在 `packages-user/data-base/src/hero/modifier.ts`。

## 7. 事件语句（129）

旧事件是 JSON 语句数组，由 `libs/events.js:945` 按语句名分派；新事件是 anon-tokyo 脚本树，由 `packages/anon-tokyo/src/interpreter.ts` 编译并由 `packages-user/data-system/src/event/executor.ts` 驱动。下表按能力分组，129 个旧语句全部保留。

### 7.1 文本与对话

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 53 | `text` | libs/events.js:1379 显示文本面板并推进脚本 | 部分支持 | `packages-user/client-base/src/components/textbox.tsx` + `packages-user/data-system/src/event/types.ts:99` 注册内建函数 | 文本面板已存在，事件层需注册内建函数适配 |
| 54 | `moveTextBox` | libs/events.js:1401 移动文本面板到指定位置 | 部分支持 | `packages-user/client-base/src/components/textbox.tsx` 的位置属性 | 面板位置可改，无同名语句 |
| 55 | `clearTextBox` | libs/events.js:1407 清空文本面板内容 | 部分支持 | `packages-user/client-base/src/components/textbox.tsx` 的内容属性 | 清空能力存在，需事件层适配 |
| 56 | `autoText` | libs/events.js:1412 文本按队列自动播放 | 部分支持 | `packages-user/client-base/src/components/textboxTyper.ts:247` 打字机 | 打字机能力存在，队列语句需适配 |
| 57 | `scrollText` | libs/events.js:1419 滚动文本 | 不支持 | 无等价能力 | 检索滚动文本、scrollText 未命中 |
| 58 | `comment` | libs/events.js:1425 注释语句，无运行时行为 | 支持 | `packages/anon-tokyo/src/type.ts:23` Block 可留空 | 旧语句无行为，新空块等价 |
| 59 | `_label` | libs/events.js:1429 标签与跳转 | 支持 | `packages/anon-tokyo/src/type.ts:23` Block 与 `packages/anon-tokyo/src/type.ts:82` ExitStatement | 新用结构化块与出口，无 goto |
| 60 | `setText` | libs/events.js:1433 设置文本变量并刷新 | 部分支持 | `packages-user/client-base/src/components/textbox.tsx` + `packages/anon-tokyo/src/type.ts:25` Expression | 可用表达式改状态后刷新面板 |
| 61 | `tip` | libs/events.js:1438 显示浮动提示 | 支持 | `src/data/enemy/hook.ts:85` emitTip + `packages-user/client-base/src/components/tip.tsx` | 提示通道存在，事件层可用表达式调用 |

### 7.2 图块与地图对象

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 62 | `show` | libs/events.js:1443 重新显示被隐藏的图块 | 部分支持 | `packages-user/data-base/src/map/mapLayer.ts` 动态图块增删 | 新无重新显示隐藏图块的状态 |
| 63 | `hide` | libs/events.js:1456 隐藏或删除图块 | 支持 | `src/data/event/map.ts:61` EventRemoveBlock | 旧支持隐藏与删除，新只保留删除 |
| 64 | `setBlock` | libs/events.js:1470 在坐标放置图块 | 支持 | `src/data/event/map.ts:12` EventSetBlock | 新参数为 x、y、tile，无动画时长 |
| 65 | `setBlockOpacity` | libs/events.js:1484 设置图块透明度 | 部分支持 | `packages/render-vue/src/tag.ts:71` 图块渲染标签的透明度属性 | 渲染能力存在，事件层需适配 |
| 66 | `setBlockFilter` | libs/events.js:1497 设置图块滤镜 | 部分支持 | `packages/render-vue/src/tag.ts:71` 标签滤镜属性 | 渲染能力存在，事件层需适配 |
| 67 | `turnBlock` | libs/events.js:1505 改变图块朝向 | 部分支持 | `packages-user/data-base/src/map/tile.ts:56` setFaceDirection | 数据层可改朝向，无同名语句 |
| 68 | `showFloorImg` | libs/events.js:1513 显示楼层图片 | 部分支持 | `packages-user/client-modules/src/render/scene.ts` 场景图 | 渲染层可挂楼层图，事件层需适配 |
| 69 | `hideFloorImg` | libs/events.js:1517 隐藏楼层图片 | 部分支持 | `packages-user/client-modules/src/render/scene.ts` 场景图 | 同上，需事件层适配 |
| 70 | `showBgFgMap` | libs/events.js:1521 显示背景或前景地图 | 部分支持 | `src/client/ui/background.tsx` | 背景组件存在，无同名语句 |
| 71 | `hideBgFgMap` | libs/events.js:1525 隐藏背景或前景地图 | 部分支持 | `src/client/ui/background.tsx` | 同上，需事件层适配 |
| 72 | `setBgFgBlock` | libs/events.js:1529 设置背景或前景图块 | 部分支持 | `packages-user/client-modules/src/render/scene.ts` + `src/client/ui/background.tsx` | 两层可组合，无声明式语句 |
| 73 | `follow` | libs/events.js:1537 增加跟随者 | 支持 | `packages-user/data-base/src/hero/follower.ts:131` addFollower | 数据层可直接加跟随者 |
| 74 | `unfollow` | libs/events.js:1542 移除跟随者 | 支持 | `packages-user/data-base/src/hero/follower.ts:176` getFollower | 可取出后移除，能力一致 |

### 7.3 动画与视口

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 75 | `animate` | libs/events.js:1547 播放地图或图块动画 | 部分支持 | `packages-user/client-modules/src/render/fx/base.ts` + `packages/animate` | 动画运行时存在，事件层需注册内建函数 |
| 76 | `stopAnimate` | libs/events.js:1556 停止动画 | 部分支持 | `packages-user/client-modules/src/render/fx/base.ts` | 停止能力存在，需事件层适配 |
| 77 | `setViewport` | libs/events.js:1561 设置视口位置与范围 | 部分支持 | `packages-user/client-base/src/map/viewport.ts:13` + `packages-user/client-base/src/map/renderer.ts:412` | 视口控制存在，数据侧需桥接 |
| 78 | `lockViewport` | libs/events.js:1572 锁定视口 | 部分支持 | `packages-user/client-modules/src/render/scene.ts` | 锁定可由场景层实现，无同名语句 |

### 7.4 移动、跳跃与楼层

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 79 | `move` | libs/events.js:1577 移动图块若干格 | 支持 | `src/data/event/map.ts:34` EventMoveBlock | 新有 steps、keepEvent、safe，无动画时长 |
| 80 | `moveAction` | libs/events.js:1582 勇士前进一格并检查事件 | 支持 | `src/data/event/hero.ts:24` EventStepHero | 新只前进一格，事件检查交给移动钩子 |
| 81 | `moveHero` | libs/events.js:1603 勇士移动若干格 | 支持 | `src/data/event/hero.ts:5` EventMoveHero | 新参数为步数，执行期间会暂停录像 |
| 82 | `jump` | libs/events.js:1607 图块跳跃到目标点 | 部分支持 | `packages-user/data-base/src/map/mover.ts:62` ObjectMoveType.Jump | 移动器支持跳跃，事件层无语句 |
| 83 | `jumpHero` | libs/events.js:1624 勇士跳跃到目标点 | 部分支持 | `packages-user/data-base/src/hero/mover.ts:99` ObjectMoveType.Jump | 同上，需事件层适配 |
| 84 | `changeFloor` | libs/events.js:1634 切换楼层并支持楼层糖 | 支持 | `packages-user/data-base/src/hero/location.ts:55` setFloor + `EventTrigger.OnBeforeChangeFloor` | 新无楼层糖，目标需明确 |
| 85 | `changePos` | libs/events.js:1640 设置勇士坐标 | 支持 | `packages-user/data-base/src/hero/location.ts:62` setPos | 目标坐标可直接设置 |

### 7.5 图像、立绘与特效

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 86 | `showImage` | libs/events.js:1656 显示图片或立绘 | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` | 图像特效存在，事件层需注册内建函数 |
| 87 | `showTextImage` | libs/events.js:1668 显示带文字的图片 | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` + `packages-user/client-base/src/components/textbox.tsx` | 图层与文本可组合，需适配 |
| 88 | `hideImage` | libs/events.js:1679 隐藏图片 | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` | 隐藏能力存在，需事件层适配 |
| 89 | `showGif` | libs/events.js:1684 显示 GIF | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` + `packages/render/src/assets/animater.ts:6` 纹理动画 | 动画纹理可组合，无同名语句 |
| 90 | `moveImage` | libs/events.js:1690 移动图片 | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` + `packages/animate` | 位移动画可组合，需适配 |
| 91 | `rotateImage` | libs/events.js:1700 旋转图片 | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` 变换属性 | 变换能力存在，事件层需适配 |
| 92 | `scaleImage` | libs/events.js:1710 缩放图片 | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` 变换属性 | 同上，需事件层适配 |
| 93 | `setCurtain` | libs/events.js:1720 设置幕布 | 部分支持 | `src/client/ui/background.tsx` | 遮罩组件存在，无同名语句 |
| 94 | `screenFlash` | libs/events.js:1734 闪屏 | 部分支持 | `packages-user/client-modules/src/render/fx/base.ts` | 特效运行时存在，需事件层适配 |
| 95 | `setWeather` | libs/events.js:1738 切换天气 | 部分支持 | `packages-user/client-modules/src/render/weather/controller.ts` + `packages-user/client-modules/src/render/weather/presets/index.ts` | 天气预设存在，事件层需适配 |

### 7.6 门、道具、商店、战斗与插入

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 96 | `openDoor` | libs/events.js:1746 打开门 | 支持 | `packages-user/client-base/src/map/door.ts:11` + `EventTrigger.OnAfterOpenDoor` | 门渲染与触发器存在，可组合 |
| 97 | `closeDoor` | libs/events.js:1758 关门 | 部分支持 | `packages-user/client-base/src/map/door.ts:11` MapDoorRenderer | 门状态可改，无同名语句 |
| 98 | `useItem` | libs/events.js:1763 使用道具 | 支持 | `packages-user/data-base/src/hero/items.ts:89` useItem | 数据层公开方法可直接调用 |
| 99 | `loadEquip` | libs/events.js:1775 装备道具 | 支持 | `packages-user/data-base/src/hero/equipment.ts:154` equip | 按实例与槽位装备 |
| 100 | `unloadEquip` | libs/events.js:1780 卸下装备 | 支持 | `packages-user/data-base/src/hero/equipment.ts:202` unequip | 按槽位卸下 |
| 101 | `openShop` | libs/events.js:1785 打开商店 | 支持 | `src/data/plugin/shop/system.ts` openShop | 商店系统提供打开入口 |
| 102 | `disableShop` | libs/events.js:1791 禁用商店 | 支持 | `src/data/plugin/shop/manager.ts` disableShop | 管理器提供禁用入口 |
| 103 | `battle` | libs/events.js:1796 强制战斗 | 支持 | `packages-user/data-system/src/combat/damage.ts:73` 战斗分派 | 战斗流程公开，可组合 |
| 104 | `trigger` | libs/events.js:1810 按坐标触发该点事件 | 部分支持 | `src/data/event/event.ts:43` EventInsertEvent 按 id 执行 | 新只能按事件 id，不能按坐标触发 |
| 105 | `insert` | libs/events.js:1815 插入并执行事件 | 支持 | `src/data/event/event.ts:10` EventInsertEvents + `src/data/event/event.ts:43` | 支持按 id 列表与原始语句块插入 |

### 7.7 音频

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 106 | `playBgm` | libs/events.js:1839 播放背景音乐 | 部分支持 | `packages/audio/src/bgm.ts` | 音频运行时存在，事件层需注册内建函数 |
| 107 | `pauseBgm` | libs/events.js:1845 暂停背景音乐 | 部分支持 | `packages/audio/src/bgm.ts` | 暂停能力存在，需事件层适配 |
| 108 | `resumeBgm` | libs/events.js:1850 恢复背景音乐 | 部分支持 | `packages/audio/src/bgm.ts` | 恢复能力存在，需事件层适配 |
| 109 | `loadBgm` | libs/events.js:1855 预载背景音乐 | 部分支持 | `packages/audio/src/bgm.ts` | 预载能力存在，需事件层适配 |
| 110 | `freeBgm` | libs/events.js:1860 释放背景音乐 | 部分支持 | `packages/audio/src/bgm.ts` | 释放能力存在，需事件层适配 |
| 111 | `playSound` | libs/events.js:1865 播放音效 | 部分支持 | `packages/audio/src/sound.ts` | 音效通道存在，事件层需适配 |
| 112 | `stopSound` | libs/events.js:1875 停止音效 | 部分支持 | `packages/audio/src/sound.ts` | 停止能力存在，需事件层适配 |
| 113 | `setVolume` | libs/events.js:1880 设置音量 | 部分支持 | `packages/audio/src/context.ts:77` setVolume | 音量接口存在，事件层需适配 |
| 114 | `setBgmSpeed` | libs/events.js:1886 设置背景音乐速度 | 不支持 | 无等价能力 | 检索播放速率未命中，音频层没有变速接口 |

### 7.8 值与实体设置

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 115 | `setValue` | libs/events.js:1891 设置数值变量 | 支持 | `packages/anon-tokyo/src/type.ts:25` StatementType.Expression | 表达式可直接赋值 |
| 116 | `addValue` | libs/events.js:1905 对数值变量做加减 | 支持 | `packages/anon-tokyo/src/type.ts:25` StatementType.Expression | 表达式可用复合赋值 |
| 117 | `setEnemy` | libs/events.js:1910 修改怪物模板 | 支持 | `packages-user/data-base/src/enemy/manager.ts:53` createEnemy + addPrefab | 怪物管理器可建模板 |
| 118 | `setEnemyOnPoint` | libs/events.js:1915 在点放置怪物 | 不支持 | 无等价能力 | 新以事件层图块表达怪物，无点怪物概念 |
| 119 | `resetEnemyOnPoint` | libs/events.js:1923 重置点怪物 | 不支持 | 无等价能力 | 同上，新无点怪物概念 |
| 120 | `moveEnemyOnPoint` | libs/events.js:1938 移动点怪物 | 不支持 | 无等价能力 | 同上，新无点怪物概念 |
| 121 | `setEquip` | libs/events.js:1949 设置装备属性 | 支持 | `packages-user/data-base/src/hero/equipment.ts:154` equip | 装备数据可写 |
| 122 | `setFloor` | libs/events.js:1954 设置楼层属性 | 支持 | `packages-user/data-base/src/hero/location.ts:55` setFloor | 楼层可写 |
| 123 | `setGlobalAttribute` | libs/events.js:1959 设置全局属性 | 不支持 | 无等价能力 | 新无全局属性存储 |
| 124 | `setGlobalValue` | libs/events.js:1964 设置全局数值 | 支持 | `packages-user/data-base/src/flag/types.ts:101` setFieldValue | flag 字段可存全局数值 |
| 125 | `setGlobalFlag` | libs/events.js:1969 设置全局开关 | 支持 | `packages-user/data-base/src/flag/types.ts:101` setFieldValue | flag 字段可存布尔值 |
| 126 | `setNameMap` | libs/events.js:1974 设置名称映射 | 不支持 | 无等价能力 | 新无名称映射表，内容表归数据分册 |
| 127 | `setHeroIcon` | libs/events.js:1979 设置勇士图标 | 部分支持 | `packages-user/client-base/src/components/misc.tsx:13` Icon + `packages-user/data-base/src/hero/rendering.ts:11` | 图标组件与渲染数据可组合 |

### 7.9 交互与流程控制

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 128 | `input` | libs/events.js:1984 弹出数字输入框 | 部分支持 | `src/client/ui/inputBox.tsx:112` InputBox + `src/client/ui/inputBox.tsx:287` getInput | 输入框组件存在，事件层需适配 |
| 129 | `input2` | libs/events.js:1993 弹出文本输入框 | 部分支持 | `src/client/ui/inputBox.tsx:112` InputBox | 同上，需事件层适配 |
| 130 | `if` | libs/events.js:2026 条件分支 | 支持 | `packages/anon-tokyo/src/type.ts:50` StatementType.If | 新支持多分支与否则 |
| 131 | `switch` | libs/events.js:2041 多分支匹配 | 支持 | `packages/anon-tokyo/src/type.ts:56` StatementType.Switch | 新有 pattern、branches、otherwise |
| 132 | `choices` | libs/events.js:2066 显示选项面板 | 部分支持 | `src/client/ui/choices.tsx` | 选项组件存在，事件层需适配 |
| 133 | `confirm` | libs/events.js:2159 显示确认框 | 部分支持 | `src/client/ui/choices.tsx:103` ConfirmBox | 确认组件存在，事件层需适配 |
| 134 | `for` | libs/events.js:2215 三表达式循环 | 支持 | `packages/anon-tokyo/src/type.ts:63` StatementType.Loop | 新用初始化、条件、迭代表达 |
| 135 | `forEach` | libs/events.js:2262 遍历数组 | 部分支持 | `packages/anon-tokyo/src/type.ts:63` StatementType.Loop + `packages/anon-tokyo/src/type.ts:25` Expression | 无专用语句，需手写遍历 |
| 136 | `while` | libs/events.js:2284 条件循环 | 支持 | `packages/anon-tokyo/src/type.ts:63` StatementType.Loop | 只填条件即 while |
| 137 | `dowhile` | libs/events.js:2302 先执行后判断循环 | 支持 | `packages/anon-tokyo/src/type.ts:63` StatementType.Loop | skipInitialCheck 对应 do-while |
| 138 | `break` | libs/events.js:2318 跳出循环 | 支持 | `packages/anon-tokyo/src/type.ts:73` StatementType.Break | 支持循环标签 |
| 139 | `continue` | libs/events.js:2327 进入下一轮循环 | 支持 | `packages/anon-tokyo/src/type.ts:78` StatementType.Continue | 无标签 |
| 140 | `win` | libs/events.js:2344 触发胜利流程 | 不支持 | 无等价能力 | 检索 win、胜利、victory 未命中，样板覆写在 project/functions.js:55 |
| 141 | `lose` | libs/events.js:2348 触发失败流程 | 不支持 | 无等价能力 | 检索 lose、失败、defeat 未命中，样板覆写在 project/functions.js:84 |
| 142 | `restart` | libs/events.js:2352 重新开始游戏 | 不支持 | 无等价能力 | 检索 restart、重新开始 未命中，归运行时流程 |
| 143 | `function` | libs/events.js:2356 定义并执行函数 | 支持 | `packages/anon-tokyo/src/type.ts:16` FunctionDeclare + `packages/anon-tokyo/src/interpreter.ts:143` | 新为语法级函数声明，能力更强 |
| 144 | `update` | libs/events.js:2369 立即刷新状态栏 | 不支持 | 无等价能力 | 新无事件队列刷新语义 |

### 7.10 状态栏、外观与异步

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 145 | `showStatusBar` | libs/events.js:2374 显示状态栏 | 部分支持 | `src/client/ui/statusBar.tsx` | 状态栏组件存在，事件层需适配 |
| 146 | `hideStatusBar` | libs/events.js:2379 隐藏状态栏 | 部分支持 | `src/client/ui/statusBar.tsx` | 同上，需事件层适配 |
| 147 | `showHero` | libs/events.js:2384 显示勇士 | 部分支持 | `packages-user/data-base/src/hero/rendering.ts:11` HeroRendering | 渲染数据可控制显隐 |
| 148 | `hideHero` | libs/events.js:2389 隐藏勇士 | 部分支持 | `packages-user/data-base/src/hero/rendering.ts:11` HeroRendering | 同上，需事件层适配 |
| 149 | `setHeroOpacity` | libs/events.js:2394 设置勇士透明度 | 支持 | `packages-user/data-base/src/hero/rendering.ts:29` setAlpha | 透明度接口可直接调用 |
| 150 | `vibrate` | libs/events.js:2406 屏幕震动 | 部分支持 | `packages-user/client-modules/src/render/scene.ts` 场景变换 | 场景可做位移，无同名语句 |
| 151 | `sleep` | libs/events.js:2410 延时若干毫秒 | 部分支持 | `packages-user/data-system/src/event/types.ts:99` 注册异步内建函数 | 可写异步内建函数包装定时器 |
| 152 | `wait` | libs/events.js:2417 等待输入并带超时 | 部分支持 | `src/client/ui/waitBox.tsx` | 等待面板存在，事件层需适配 |
| 153 | `waitAsync` | libs/events.js:2536 等待异步动画或音效结束 | 支持 | `packages/anon-tokyo/src/type.ts:25` 异步表达式与 await | 内建函数可为异步并由 await 汇合 |
| 154 | `stopAsync` | libs/events.js:2547 停止异步任务 | 不支持 | 无等价能力 | 新无异步取消原语 |

### 7.11 存读档、退出与预览

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 155 | `callBook` | libs/events.js:2552 打开怪物手册 | 部分支持 | `src/client/ui/book.tsx` | 手册组件存在，事件层需适配 |
| 156 | `callSave` | libs/events.js:2564 打开存档界面 | 支持 | `packages-user/client-base/src/save/system.ts` | 存档系统提供界面入口 |
| 157 | `autoSave` | libs/events.js:2580 自动存档 | 支持 | `packages-user/client-base/src/save/system.ts` | 存档系统提供自动存档 |
| 158 | `forbidSave` | libs/events.js:2588 禁止存档 | 部分支持 | `packages-user/client-base/src/save/system.ts` | 可拦截存档，无声明式语句 |
| 159 | `callLoad` | libs/events.js:2593 打开读档界面 | 支持 | `packages-user/client-base/src/save/system.ts` | 存档系统提供读档入口 |
| 160 | `exit` | libs/events.js:2601 退出游戏 | 不支持 | 无等价能力 | 检索 exit、退出 未命中，归运行时流程 |
| 161 | `previewUI` | libs/events.js:2606 预览界面 | 不支持 | 无等价能力 | 新无界面预览运行时 |

### 7.12 画布绘制原语

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 162 | `clearMap` | libs/events.js:2636 清空画布 | 部分支持 | `packages/render-vue/src/tag.ts:45` container 标签 | 容器可替换内容，无同名语句 |
| 163 | `fillText` | libs/events.js:2640 填充文本 | 支持 | `packages/render-vue/src/tag.ts:52` text 标签 | 文本标签可直接绘制 |
| 164 | `fillBoldText` | libs/events.js:2645 填充粗体文本 | 部分支持 | `packages/render-vue/src/tag.ts:52` text 标签的字重属性 | 字重属性可组合，无专用语句 |
| 165 | `fillRect` | libs/events.js:2650 填充矩形 | 支持 | `packages/render-vue/src/tag.ts:71` g-rect 标签 | 位置与尺寸属性即可 |
| 166 | `fillPolygon` | libs/events.js:2654 填充多边形 | 部分支持 | `packages/render-vue/src/tag.ts:86` g-path 标签 | 路径标签可画多边形，无专用语句 |
| 167 | `strokeRect` | libs/events.js:2663 描边矩形 | 支持 | `packages/render-vue/src/tag.ts:71` g-rect 标签的描边属性 | 描边属性可直接设置 |
| 168 | `strokePolygon` | libs/events.js:2667 描边多边形 | 部分支持 | `packages/render-vue/src/tag.ts:86` g-path 标签的描边属性 | 路径标签可描边，无专用语句 |
| 169 | `fillEllipse` | libs/events.js:2676 填充椭圆 | 支持 | `packages/render-vue/src/tag.ts:74` g-ellipse 标签 | 椭圆标签可直接绘制 |
| 170 | `strokeEllipse` | libs/events.js:2680 描边椭圆 | 支持 | `packages/render-vue/src/tag.ts:74` g-ellipse 标签的描边属性 | 描边属性可直接设置 |
| 171 | `fillArc` | libs/events.js:2684 填充扇形 | 部分支持 | `packages/render-vue/src/tag.ts:72` g-circle 标签 + `packages/render-vue/src/tag.ts:86` g-path | 圆与路径可组合，无专用语句 |
| 172 | `strokeArc` | libs/events.js:2688 描边扇形 | 部分支持 | `packages/render-vue/src/tag.ts:72` g-circle 标签 + `packages/render-vue/src/tag.ts:86` g-path | 同上，需组合 |
| 173 | `drawLine` | libs/events.js:2692 画线 | 支持 | `packages/render-vue/src/tag.ts:77` g-line 标签 | 线段标签可直接绘制 |
| 174 | `drawArrow` | libs/events.js:2696 画箭头 | 部分支持 | `packages/render-vue/src/tag.ts:77` g-line 标签 + `packages/render-vue/src/tag.ts:86` g-path | 线与路径可组合，无专用语句 |
| 175 | `setAttribute` | libs/events.js:2700 设置画布属性 | 部分支持 | `packages/render-vue/src/tag.ts:45` container 标签属性 | 标签属性可替代，无同名语句 |
| 176 | `setFilter` | libs/events.js:2704 设置画布滤镜 | 部分支持 | `packages/render-vue/src/tag.ts:45` container 标签滤镜属性 | 容器滤镜可组合 |
| 177 | `drawImage` | libs/events.js:2708 绘制图片 | 支持 | `packages/render-vue/src/tag.ts:57` image 标签 | 图片标签可直接绘制 |
| 178 | `drawIcon` | libs/events.js:2712 绘制图标 | 部分支持 | `packages-user/client-base/src/components/misc.tsx:13` Icon | 图标组件存在，需渲染层适配 |
| 179 | `drawSelector` | libs/events.js:2716 绘制选择框 | 部分支持 | `packages/render-vue/src/tag.ts:87` g-rectr 标签 | 圆角矩形可组合，无专用语句 |
| 180 | `drawBackground` | libs/events.js:2720 绘制背景 | 部分支持 | `src/client/ui/background.tsx` | 背景组件存在，无同名语句 |
| 181 | `drawTextContent` | libs/events.js:2724 绘制文本内容 | 部分支持 | `packages-user/client-base/src/components/textboxTyper.ts:247` TextContentTyper | 文本排版组件存在，需渲染层适配 |

## 8. 预编译与系统触发器（26）

### 8.1 旧 18 个预编译

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 182 | `jump` 预编译 | libs/events.js:1617 把 from、to、dxy 预编译为坐标数组 | 支持 | `src/data/event/map.ts:34` EventMoveBlock 参数可为表达式 | 新无逐语句预编译钩子，编译期统一处理 |
| 183 | `showImage` 预编译 | libs/events.js:1662 预编译图片参数 | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` | 图片参数可写表达式，事件层需适配 |
| 184 | `moveImage` 预编译 | libs/events.js:1695 预编译移动路径 | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` + `packages/animate` | 路径可由表达式与动画组合 |
| 185 | `rotateImage` 预编译 | libs/events.js:1705 预编译旋转参数 | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` 变换属性 | 旋转参数可写表达式，需适配 |
| 186 | `scaleImage` 预编译 | libs/events.js:1715 预编译缩放参数 | 部分支持 | `packages-user/client-modules/src/render/fx/image3d.ts` 变换属性 | 缩放参数可写表达式，需适配 |
| 187 | `moveEnemyOnPoint` 预编译 | libs/events.js:1931 预编译点怪物移动路径 | 不支持 | 无等价能力 | 新无点怪物概念，也无对应预编译 |
| 188 | `if` 预编译 | libs/events.js:1254 预编译条件表达式 | 支持 | `packages/anon-tokyo/src/interpreter.ts:197` 一次性编译整段脚本 | 新由编译期统一处理条件 |
| 189 | `switch` 预编译 | libs/events.js:1254 预编译分支表达式 | 支持 | `packages/anon-tokyo/src/interpreter.ts:197` 一次性编译整段脚本 | 同上 |
| 190 | `choices` 预编译 | libs/events.js:1254 预编译选项数组 | 部分支持 | `src/client/ui/choices.tsx` | 选项组件存在，编译期无专用钩子 |
| 191 | `confirm` 预编译 | libs/events.js:1254 预编译确认框参数 | 部分支持 | `src/client/ui/choices.tsx:103` ConfirmBox | 确认组件存在，需事件层适配 |
| 192 | `for` 预编译 | libs/events.js:1254 预编译三表达式 | 支持 | `packages/anon-tokyo/src/interpreter.ts:197` 一次性编译整段脚本 | 三表达式由 Loop 语句表达 |
| 193 | `forEach` 预编译 | libs/events.js:1254 预编译遍历表达式 | 部分支持 | `packages/anon-tokyo/src/type.ts:63` StatementType.Loop | 无专用语句，需手写遍历 |
| 194 | `while` 预编译 | libs/events.js:1254 预编译条件 | 支持 | `packages/anon-tokyo/src/interpreter.ts:197` 一次性编译整段脚本 | 条件由 Loop 语句表达 |
| 195 | `dowhile` 预编译 | libs/events.js:1254 预编译条件 | 支持 | `packages/anon-tokyo/src/interpreter.ts:197` 一次性编译整段脚本 | skipInitialCheck 对应 do-while |
| 196 | `wait` 预编译 | libs/events.js:1254 预编译超时与输入类型 | 部分支持 | `src/client/ui/waitBox.tsx` | 等待面板存在，需事件层适配 |
| 197 | `previewUI` 预编译 | libs/events.js:1254 预编译预览参数 | 不支持 | 无等价能力 | 新无界面预览运行时 |
| 198 | `fillPolygon` 预编译 | libs/events.js:1254 预编译点集 | 部分支持 | `packages/render-vue/src/tag.ts:86` g-path 标签 | 路径标签可画多边形，无专用钩子 |
| 199 | `strokePolygon` 预编译 | libs/events.js:1254 预编译点集 | 部分支持 | `packages/render-vue/src/tag.ts:86` g-path 标签的描边属性 | 路径标签可描边，无专用钩子 |

新引擎没有逐语句预编译钩子，改为每个事件一次性编译为可执行对象；下表只对照旧预编译承担的参数整理能力。

### 8.2 旧 8 个系统触发器

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 200 | `battle` 触发器 | libs/events.js:295 注册战前与战后共用的系统触发器 | 支持 | `packages-user/data-common/src/event/types.ts:7` EventTrigger.OnBeforeBattle 与 OnAfterBattle | 新按前后拆成两个触发器 |
| 201 | `openDoor` 触发器 | libs/events.js:295 注册开门系统触发器 | 支持 | `packages-user/data-common/src/event/types.ts:7` EventTrigger.OnBeforeOpenDoor 与 OnAfterOpenDoor | 新按前后拆分 |
| 202 | `getItem` 触发器 | libs/events.js:295 注册拾取系统触发器 | 支持 | `packages-user/data-common/src/event/types.ts:7` EventTrigger.OnAfterGetItem | 新只保留拾取之后 |
| 203 | `changeFloor` 触发器 | libs/events.js:295 注册换层系统触发器 | 支持 | `packages-user/data-common/src/event/types.ts:7` EventTrigger.OnBeforeChangeFloor 与 OnAfterChangeFloor | 新按前后拆分并支持阻止切换 |
| 204 | `pushBox` 触发器 | libs/events.js:295 注册推箱子系统触发器 | 不支持 | 无等价能力 | 新无推箱子系统 |
| 205 | `ski` 触发器 | libs/events.js:295 注册滑冰系统触发器 | 不支持 | 无等价能力 | 新无滑冰系统 |
| 206 | `action` 触发器 | libs/events.js:295 注册点击或交互触发器 | 部分支持 | `packages-user/data-common/src/event/types.ts:7` EventTrigger.OnTouch + `src/data/event/event.ts:43` | 新触摸语义不等价，需自行接交互事件 |
| 207 | `custom` 触发器 | libs/events.js:295 注册任意自定义触发器 | 不支持 | 无等价能力 | 新触发器为固定枚举，不能注册新触发器 |

新触发器是固定枚举，入口在 `packages-user/data-common/src/event/types.ts:7`；旧触发器注册表在 `libs/events.js:295`。新引擎另有手动、触碰、进入、离开等触发点，但旧侧没有对应条目，不计入本表。

## 9. 事件值表达式（5）

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 208 | 内联求值 | libs/utils.js:20 文本中的花括号表达式求值后拼回字符串 | 部分支持 | `packages/anon-tokyo/src/type.ts:19` Literal 与 Expression + `packages-user/client-base/src/components/textbox.tsx` | 新无文本模板语法，插值需写成表达式或函数调用 |
| 209 | 前缀替换 | libs/utils.js:50 把 status、buff、item 等前缀改写为属性访问 | 不支持 | 无等价能力 | 检索 replaceValue、前缀替换未命中，需自行实现解析 |
| 210 | 任意表达式求值 | libs/utils.js:81 对替换后的字符串直接求值 | 部分支持 | `packages/anon-tokyo/src/compile.ts` + `packages/anon-tokyo/src/type.ts:19` Expression | 新为编译期表达式闭包，不能执行任意语句字符串 |
| 211 | 变量与作用域 | libs/events.js:2101 用 flag 与地块前缀拼出局部变量 | 支持 | `packages/anon-tokyo/src/type.ts:210` Scope 的 args、local、env | 新有真正的三层作用域 |
| 212 | 文本前缀 | project/data.js:549 文本中的制表符加方括号前缀由文本渲染器解析 | 不支持 | 无等价能力 | 检索文本前缀解析未命中，现有接口无法确认可简单实现 |

旧侧只有字符串替换与求值，入口在 `libs/utils.js:20`、`libs/utils.js:50`、`libs/utils.js:81`；新侧是编译期表达式闭包，类型定义在 `packages/anon-tokyo/src/type.ts:19`。

## 10. 寻路、移动与楼层切换（9）

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 213 | 单步移动与连续移动 | libs/control.js:716 按方向逐格移动，按住时定时轮询 | 支持 | `packages-user/data-base/src/hero/mover.ts` + `packages-user/data-base/src/hero/location.ts` | 新用移动器与步骤队列，速度来自移动器配置 |
| 214 | 每步结算流程 | project/functions.js:1463 一步内依次处理步数、中毒、自动事件、地图伤害与目标事件 | 部分支持 | `src/data/enemy/hook.ts:135` onStepEnd | 新只把中毒与地图伤害放进步末钩子，其余分散在各层 |
| 215 | 瞬移 | project/functions.js:1526 瞬移扣毒伤、记录像并累加统计 | 支持 | `packages-user/data-system/src/path/system.ts:105` moveTo 与 teleportTo | 新先寻路再按回退策略决定是否瞬移，录像记二进制步 |
| 216 | 寻路算法 | libs/control.js 自动寻路按可达数组逐格生成方向序列 | 支持 | `packages-user/data-system/src/path/finder.ts:96` PathFinder.find | 新为显式图搜索并返回状态枚举 |
| 217 | 跳跃 | libs/events.js:1607 图块或勇士从 A 点跳到 B 点 | 部分支持 | `packages-user/data-base/src/map/mover.ts:62` ObjectMoveType.Jump | 移动器支持跳跃，无事件语句 |
| 218 | 楼层切换 | libs/events.js:696 支持楼层糖与楼梯对称糖 | 支持 | `packages-user/data-base/src/hero/location.ts:55` setFloor + `packages-user/data-base/src/hero/state.ts:106` | 新只接受明确目标与坐标，无糖语法 |
| 219 | 换层事件顺序 | project/functions.js:97 换层前跑覆写函数，换层后跑另一覆写 | 支持 | `packages-user/data-base/src/hero/state.ts:106` onBeforeChangeFloor 与 onAfterChangeFloor | 新顺序固定，同组钩子并行执行 |
| 220 | 滑冰 | project/functions.js:1516 踩到滑冰图块后自动再走一步 | 不支持 | 无等价能力 | 检索 onSki、滑冰 未命中，新无滑冰图块行为 |
| 221 | 自动事件 | project/functions.js:1494 每步后检查并循环执行自动事件 | 部分支持 | `packages-user/data-system/src/event/system.ts:44` collectEvent + `src/data/enemy/hook.ts:135` | 新无每步轮询机制，需在步末钩子里自行收集 |

旧移动入口是 `libs/control.js:716`，单步流程覆写在 `project/functions.js:1463`；新移动器在 `packages-user/data-base/src/hero/mover.ts`，寻路在 `packages-user/data-system/src/path/finder.ts:96`。

## 11. 商店、升级与统计（11）

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 222 | 商店定义与启用 | project/data.js:559 shops 数组声明商店与启用条件 | 支持 | `src/data/plugin/shop/state.ts:6` IShopState 与 enable、disable | 新为运行时对象，无声明式内容表 |
| 223 | 选项条件与动作 | project/data.js:566 每个选项用 need 判断并执行任意事件动作 | 部分支持 | `src/data/plugin/shop/system.ts` + `packages-user/data-system/src/event/system.ts:44` | 新为标准交易模型，任意动作需转成事件 |
| 224 | 道具商店 | project/data.js:658 item 商店按数量、买价、卖价批量交易 | 支持 | `src/data/plugin/shop/types.ts:18` items、buyPrice、sellPrice | 新交易模型正好覆盖三张表 |
| 225 | 事件商店 | project/data.js:672 整店交给公共事件处理 | 部分支持 | `src/data/plugin/shop/system.ts` + `src/data/event/event.ts:43` | 可把整店写成事件，但无声明式委托字段 |
| 226 | 商店访问状态 | project/functions.js:1146 受伤时清空所有商店的已访问标记 | 不支持 | 无等价能力 | 新只有启用与禁用，无已访问概念 |
| 227 | 升级表与触发 | project/data.js:679 按等级表取所需经验并执行升级动作 | 不支持 | 无等价能力 | 检索 levelUp、checkLvUp、升级 未命中运行时实现 |
| 228 | 等级名称 | libs/control.js:2517 取等级表的 title 作为等级名 | 不支持 | 无等价能力 | 检索 getLvName、等级名 只命中展示层与类型声明 |
| 229 | 下级所需经验 | libs/control.js:2524 取下一级所需经验并支持距离模式 | 不支持 | 无等价能力 | 检索 getNextLvUpNeed、距升级 未命中运行时实现 |
| 230 | 战斗与步数统计字段 | project/functions.js:300 在 statistics 上累加战斗、毒伤、步数等字段 | 部分支持 | `src/client/ui/statistics.tsx:36` StatisticsData + `packages-user/data-base/src/hero/state.ts` | 新只有展示用聚合，无逐项累加器 |
| 231 | 统计计算数据来源 | project/functions.js:1665 统计面板整体由样板覆写绘制与计算 | 部分支持 | `src/client/ui/statistics.tsx:137` calculateStatistics | 计算仍读旧全局对象，数据源需适配 |
| 232 | 统计展示 | libs/ui.js 统计面板绘制 | 支持 | `src/client/ui/statistics.tsx:50` Statistics 组件 | 展示组件由外部数据注入 |

旧商店与升级表在 `project/data.js:559` 与 `project/data.js:679`；新商店系统在 `src/data/plugin/shop`，统计展示在 `src/client/ui/statistics.tsx`。

## 12. 回放命令与路线编码（40）

### 12.1 旧 15 个回放动作

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 233 | `move` 回放动作 | libs/control.js:1720 参数为 up、down、left、right 之一 | 支持 | `src/data/replay/initialize.ts:18` ReplayCode.Up、Right、Down、Left | 旧一个动作拆成四个指令码，参数为空 |
| 234 | `item` 回放动作 | libs/control.js:1726 参数为道具 id 字符串 | 支持 | `src/data/replay/commands.ts:148` ReplayUseItem | 新参数为道具数字，无工具箱动画分支 |
| 235 | `equip` 回放动作 | libs/control.js:1754 参数为装备 id 字符串 | 支持 | `src/data/replay/commands.ts:171` ReplayEquip | 新需显式实例与槽位，并多自动卸装布尔 |
| 236 | `unEquip` 回放动作 | libs/control.js:1789 参数为槽位索引 | 支持 | `src/data/replay/commands.ts:204` ReplayUnequip | 参数语义一致，旧多一次装备箱动画 |
| 237 | `saveEquip` 回放动作 | libs/control.js:1820 按套装索引快速保存装备 | 不支持 | 无等价能力 | 新无套装快速保存概念与指令码 |
| 238 | `loadEquip` 回放动作 | libs/control.js:1827 按套装索引快速读取装备 | 不支持 | 无等价能力 | 同上，新无套装快速换装 |
| 239 | `fly` 回放动作 | libs/control.js:1834 飞行到指定楼层 | 不支持 | 无等价能力 | 新无飞行到楼层的指令，换层只能走事件 |
| 240 | `shop` 回放动作 | libs/control.js:1852 打开指定商店 | 不支持 | 无等价能力 | 商店系统存在，但录像枚举没有打开商店指令 |
| 241 | `turn` 回放动作 | libs/control.js:1864 顺时针转向或转向指定方向 | 不支持 | 无等价能力 | 新录像无转向指令，朝向只作为副产物 |
| 242 | `getNext` 回放动作 | libs/control.js:1872 拾取最近的下一件道具 | 不支持 | 无等价能力 | 新无拾取最近道具的指令 |
| 243 | `moveDirectly` 回放动作 | libs/control.js:1879 瞬移到指定坐标 | 支持 | `src/data/replay/commands.ts:120` ReplayTeleport | 新先寻路再按回退策略决定是否瞬移 |
| 244 | `key` 回放动作 | libs/control.js:1912 模拟按键 | 不支持 | 无等价能力 | 新录像无模拟按键指令，输入路由归 UI 分册 |
| 245 | `click` 回放动作 | libs/control.js:1919 模拟点击状态栏 | 不支持 | 无等价能力 | 新无模拟点击指令 |
| 246 | `ignoreInput` 回放动作 | libs/control.js:1928 忽略输入、选项与随机前缀并继续 | 支持 | `packages-user/data-common/src/replay/array.ts` 只按指令码推进 | 新录像不产生这类步，能力上等价于不产生 |
| 247 | `no` 回放动作 | libs/control.js:1937 空步占位并继续 | 支持 | `packages-user/data-common/src/replay/array.ts` 按索引推进 | 新二进制数组无需占位步 |

旧动作注册表在 `libs/control.js:38`，实现同在 `libs/control.js:1720` 起；新指令枚举在 `packages-user/data-common/src/replay/types.ts:5`，注册在 `src/data/replay/initialize.ts:15`，命令实现在 `src/data/replay/commands.ts`。

### 12.2 旧 24 个路线字母

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 248 | `U` 路线字母 | libs/utils.js:528 向上移动，后接次数 | 支持 | `src/data/replay/initialize.ts:18` ReplayCode.Up | 无字符串等价，逐格映射 |
| 249 | `D` 路线字母 | libs/utils.js:528 向下移动，后接次数 | 支持 | `src/data/replay/initialize.ts:18` ReplayCode.Down | 无字符串等价，逐格映射 |
| 250 | `L` 路线字母 | libs/utils.js:528 向左移动，后接次数 | 支持 | `src/data/replay/initialize.ts:18` ReplayCode.Left | 无字符串等价，逐格映射 |
| 251 | `R` 路线字母 | libs/utils.js:528 向右移动，后接次数 | 支持 | `src/data/replay/initialize.ts:18` ReplayCode.Right | 无字符串等价，逐格映射 |
| 252 | `I` 路线字母 | libs/utils.js:559 使用道具，id 数字化 | 支持 | `src/data/replay/commands.ts:148` ReplayUseItem | 参数类型相同 |
| 253 | `u` 路线字母 | libs/utils.js:561 按槽位卸下装备 | 支持 | `src/data/replay/commands.ts:204` ReplayUnequip | 参数类型相同 |
| 254 | `e` 路线字母 | libs/utils.js:563 装备道具，id 数字化 | 支持 | `src/data/replay/commands.ts:171` ReplayEquip | 新需实例与槽位参数 |
| 255 | `s` 路线字母 | libs/utils.js:565 保存装备套装 | 不支持 | 无等价能力 | 新无套装保存指令 |
| 256 | `l` 路线字母 | libs/utils.js:567 读取装备套装 | 不支持 | 无等价能力 | 新无套装读取指令 |
| 257 | `F` 路线字母 | libs/utils.js:569 飞行到指定楼层 | 不支持 | 无等价能力 | 新无飞行指令 |
| 258 | `c` 路线字母 | libs/utils.js:571 选项为空 | 不支持 | 无等价能力 | 新录像不产生选项步 |
| 259 | `C` 路线字母 | libs/utils.js:573 选择指定选项 | 不支持 | 无等价能力 | 新录像不产生选项步 |
| 260 | `S` 路线字母 | libs/utils.js:575 打开指定商店 | 不支持 | 无等价能力 | 新录像无打开商店指令 |
| 261 | `T` 路线字母 | libs/utils.js:577 顺时针转向 | 不支持 | 无等价能力 | 新录像无转向指令 |
| 262 | `t` 路线字母 | libs/utils.js:579 转向指定方向 | 不支持 | 无等价能力 | 新录像无转向指令 |
| 263 | `G` 路线字母 | libs/utils.js:581 拾取最近的下一件道具 | 不支持 | 无等价能力 | 新无拾取最近道具指令 |
| 264 | `p` 路线字母 | libs/utils.js:583 输入为空 | 不支持 | 无等价能力 | 新录像不产生输入步 |
| 265 | `P` 路线字母 | libs/utils.js:585 输入指定值 | 不支持 | 无等价能力 | 新录像不产生输入步 |
| 266 | `Q` 路线字母 | libs/utils.js:587 文本输入指定值 | 不支持 | 无等价能力 | 新录像不产生文本输入步 |
| 267 | `N` 路线字母 | libs/utils.js:589 空步占位 | 支持 | `packages-user/data-common/src/replay/array.ts` 按索引推进 | 新二进制数组无需占位步 |
| 268 | `M` 路线字母 | libs/utils.js:591 瞬移到指定坐标 | 支持 | `src/data/replay/commands.ts:120` ReplayTeleport | 参数语义一致 |
| 269 | `K` 路线字母 | libs/utils.js:593 模拟按键 | 不支持 | 无等价能力 | 新录像无模拟按键指令 |
| 270 | `k` 路线字母 | libs/utils.js:595 模拟点击 | 不支持 | 无等价能力 | 新录像无模拟点击指令 |
| 271 | `X` 路线字母 | libs/utils.js:597 随机值 | 不支持 | 无等价能力 | 新录像不产生随机步 |

旧路线是字符串加单字母编码再压缩，编码表在 `libs/utils.js:558`；新路线是二进制数组，每一步是一组指令与参数。24 个字母逐个保留，不重复计入能力数。

### 12.3 兜底形式

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 272 | 自定义步兜底 | libs/utils.js:599 未识别的自定义步原样包裹 | 不支持 | 无等价能力 | 新枚举不接受未注册指令，参数按类型强校验 |

## 13. 覆盖与统计

- 旧侧条目 272：伤害 18、临界 9、光环与支援 8、地图伤害 9、减益与状态 8、事件语句 129、预编译与系统触发器 26、事件值表达式 5、寻路与楼层 9、商店升级统计 11、回放 40。
- 旧事件语句覆盖 129 / 129；预编译覆盖 18 / 18；系统触发器覆盖 8 / 8；回放动作覆盖 15 / 15；路线字母覆盖 24 / 24；兜底形式覆盖 1 / 1。
- 三值计数只统计主表条目，相加等于 272；具体数值写在 `09-45-SUMMARY.md`。
- 合并记录：旧三个连击码合并为新码 4；旧坚固与模仿共用临界短路，新只对坚固短路；旧支援回合并入差异写在对应行。
- 拆分记录：旧 move 回放动作在新拆成四个方向指令，仍按一个旧动作计数；24 个路线字母逐个保留，不当作独立能力重复计数。

## 14. 未决与转交

- 文本前缀、统计计算数据源等无法确认的条目已按不支持记录，并在说明列写明检索范围。
- 数据字段与内容表归 `01-DATA.md`；渲染表现归 `03-RENDER.md`；界面与输入归 `04-UI-INPUT.md`；运行时、存档与音频归 `05-RUNTIME-UNCERTAIN.md`。
- 本文件未改源码、配置、STATE、ROADMAP，未提交。
