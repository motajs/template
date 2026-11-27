# 04 UI 与输入对照

> 范围：旧样板的屏幕与面板、状态栏与工具栏、键盘与鼠标与触摸与长按、设置与存读档界面、图鉴与装备栏与道具箱与商店与地图查看与飞行、文本与选择与输入与等待，以及疑似缺口专项检索。
> 判定只用「支持」「部分支持」「不支持」三值，口径见 `09-PARITY/00-INDEX.md`。
> 旧样板：`D:/github/mota-js`（只读）；新样板：`D:/github/template`（源码只读，只写本文档与摘要）。
> 写作时间：2026-11-04 14:05（UTC+8）；编码 UTF-8。

## 0. 快照

| 项 | 值 |
| --- | --- |
| 旧样板根目录 / 分支 | `D:/github/mota-js` / `master` |
| 旧样板 HEAD | `3efb548e407ad2b8007b498cb98401e2012a0b55` |
| 旧样板工作树 | 干净（0 行） |
| 新样板根目录 / 分支 | `D:/github/template` / `refine/data-client` |
| 新样板 HEAD | `5af3ab378b4d65dc5cf1fbcb621fd9a776608dd7` |
| 新样板工作树 | 163 行改动 |
| 采样时间 | `2026-11-04 14:00`（UTC+8） |

- 采样命令：`git -C D:/github/mota-js rev-parse HEAD`、`git -C D:/github/mota-js status --porcelain -uall`、`git rev-parse HEAD`、`git rev-parse --abbrev-ref HEAD`、`git status --porcelain -uall`。
- 写作期间工作树仍有并发改动（`src/client/ui`、`client-base/src/setting` 等），本文件只对上述快照时刻的源码负责，不回滚、不修改任何外部改动。
- 旧仓库在本次写作前后两次检查均为 0 行改动；旧样板是条目清单的唯一来源。

## 1. 判定口径与覆盖

### 1.1 三值标准

- 支持：可用现有新样板接口、标签或组件，以组合、配置或简单映射实现，不需要复杂逻辑或算法，也不需要直接调用底层接口。
- 部分支持：核心能力已存在，但需要适配，或只覆盖旧样板行为的一部分。
- 不支持：没有等价能力，或需要自行实现复杂逻辑与算法。
- 现有接口无法确认可以简单实现时记「不支持」，并在「差异 / 说明」列写明已检索的范围与原因。
- 只调用旧全局门面的行不判「支持」：实现列只写新包内的组件、接口或标签，旧调用放在差异列叙述。

### 1.2 双记录：libs 默认与样板覆写

旧样板的实际行为等于 `libs/*.js` 默认实现加上 `project/functions.js` 覆写层。UI 与输入受覆写影响的 7 个符号必须同时给出两处锚点。

| 覆写符号 | libs 默认 | 样板覆写 | 对本文件的影响 |
| --- | --- | --- | --- |
| `onKeyUp` | `libs/actions.js:178` 抬起后按注册动作分发 | `project/functions.js:806` 按按键码分派全部快捷键 | 快捷键以样板覆写为准，`## 4` 逐条对照新命令表 |
| `onStatusBarClick` | `libs/actions.js:888` 计算画布坐标后交给注册动作 | `project/functions.js:957` 保留空实现与自定义区域示例 | 新无画布像素回调，`## 3.1` 与 `## 8` 记录该能力 |
| `getToolboxItems` | `libs/ui.js:2695` 按隐藏标记过滤并排序 | `project/functions.js:1584` 按隐藏标记过滤并按编号升序 | 道具栏取项与排序差异见 `## 6` |
| `drawStatusBar` | `libs/ui.js:3168` 委托样板数据自绘 | `project/functions.js:1594` 横屏、竖屏、隐藏三分支自绘 | 状态栏布局与开关见 `## 3.1` |
| `drawStatistics` | `libs/ui.js:3173` 构建统计并取参与统计的道具 | `project/functions.js:1665` 返回统计道具编号白名单 | 统计面板只作背景，见 `## 3.2` 与 `## 5` |
| `drawAbout` | `libs/ui.js:3346` 委托样板数据自绘 | `project/functions.js:1681` 自绘关于面板并设置私有标识 | 旧 29 个标识不含关于面板，`## 2` 与 `## 8` 只作备注 |
| `updateStatusBar` | `libs/control.js:3049` 按动画帧调度后委托 | `project/functions.js:1169` 直接刷新状态栏各字段 | 状态栏刷新差异见 `## 3.1` |

### 1.3 覆盖与检索范围

- 旧侧条目按可观察能力拆分，不按文件名或方法名拆分；同一能力有多个入口时合并为一条。
- 旧侧条目共 114 行：面板与事件标识 29、状态栏 13、工具栏 14、输入动作 12、设置与存读档 12、图鉴与装备栏与道具箱与商店与地图查看与飞行 7、文本交互 10、疑似缺口 17。
- 新侧检索根目录：`src/client`、`packages/system/src`、`packages-user/client-base/src`、`packages/render/src`；忽略 `node_modules`、`dist`、`__test__`。
- 新侧锚点只写组件、接口或标签；统计数据、绘制与存档后端等跨分册内容只作交叉引用。

## 2. 面板与事件标识（29）

- 旧侧枚举：在 `libs/ui.js`、`libs/control.js`、`libs/actions.js`、`libs/events.js` 上检索事件标识赋值，去重后共 29 个。
- 样板另有私有标识「关于」，写在 `project/functions.js:1685`，不计入 29，只在 `## 1.2` 与 `## 8` 备注。
- 新侧面板统一由界面控制器打开，组件清单见 `src/client/ui` 与 `src/client/plugin/shop`。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 1 | 事件执行态 | 进入事件执行中状态，挂起输入并保存事件栈，不是可视面板（`libs/events.js:980`） | 不支持 | 无对应界面状态；事件执行在数据层执行器中完成，界面层没有等价标记 | 旧用全局事件标识表示执行态，新界面层检索不到同名状态；执行语义归 P3 |
| 2 | 怪物手册 | 打开怪物手册列表，按楼层索引分页，点击进入详情（`libs/control.js:1530`） | 部分支持 | `BookUI`（`src/client/ui/book.tsx:267`）用 `Scroll`（`packages-user/client-base/src/components/scroll.tsx:109`）列出当前楼层怪物并可点开详情 | 有列表与详情入口，缺旧的多楼层索引与分页；伤害列取自新伤害系统 |
| 3 | 怪物详情 | 绘制怪物完整属性、特殊属性说明与临界表（`libs/ui.js:2353`） | 支持 | `BookDetailUI`（`src/client/ui/bookDetail.tsx:353`）用 `TextContent` 与 `Scroll` 组合基础与计算属性模式及临界表 | 新增模式切换与临界滚动，旧为单屏文本块 |
| 4 | 中心对称飞行器 | 全屏缩略图显示飞行目标格，确认后传送（`libs/ui.js:2560`） | 部分支持 | `Thumbnail`（`packages-user/client-base/src/components/thumbnail.tsx:43`）与 `ConfirmBox`（`src/client/ui/choices.tsx:103`）可组合缩略图与确认，目标格用 `Selection` 标记 | 缩略图组件未暴露飞行模式与中心对称大图布局，传送动作仍走旧接口；道具效果归 P3 |
| 5 | 确认框 | 模态确认框，左右选择确认或取消并回调（`libs/ui.js:1866`） | 支持 | `ConfirmBox`（`src/client/ui/choices.tsx:103`）与 `getConfirm`（`src/client/ui/choices.tsx:603`）组合按钮文案、默认项与回调 | 新为 Vue 组件，默认按钮由参数决定；录像写入走路由确认函数 |
| 6 | 寻路光标 | 自动寻路在界面画布上画 32×32 选择框（`libs/ui.js:2089`） | 部分支持 | `Selection`（`packages-user/client-base/src/components/misc.tsx:302`）可画 32×32 高亮框 | 选择框组件存在，光标位置与寻路状态归 P3，界面层无该面板 |
| 7 | 装备栏 | 显示当前装备槽与拥有装备，点击穿脱（`libs/ui.js:2804`） | 部分支持 | `EquipBoxUI`（`src/client/ui/equipbox.tsx:543`）用 `Scroll` 与图标组合槽位、拥有列表、拖拽与增减预览 | 有拖拽与点击选中，无旧式分页；穿脱走新英雄装备数据 |
| 8 | 游戏信息 | 游戏信息菜单 7 项，含操作帮助与关于游戏（`libs/ui.js:2062`） | 部分支持 | `Choices`（`src/client/ui/choices.tsx:325`）在 `src/client/ui/settings.tsx:263` 组装 6 项 | 缺关于游戏项，操作帮助分支为空（`src/client/ui/settings.tsx:322`），数据统计仍读旧对象 |
| 9 | 操作帮助 | 有键盘素材时全屏显示帮助图，否则走文本页（`libs/ui.js:3351`） | 部分支持 | `TextContent`（`packages-user/client-base/src/components/textbox.tsx:117`）与 `Textbox`（`packages-user/client-base/src/components/textbox.tsx:310`）可组合帮助文本页 | 文本页可组合，键盘图片素材与入口缺失，旧分支在 `src/client/ui/settings.tsx:322` 仍为空 |
| 10 | 虚拟键盘 | 游戏内虚拟键盘，绘制功能键、数字、字母并用光标点按（`libs/ui.js:3122`） | 部分支持 | `HotkeySystem.down` 与 `HotkeySystem.up`（`packages/system/src/hotkey/system.ts:365`、`packages/system/src/hotkey/system.ts:392`）配合 `g-rectr` 与 `text` 标签可组合按键网格 | 触发接口已具备，键盘布局需自行搭建；工具栏同名处理函数当前为空 |
| 11 | 本地读档子菜单 | 从本地文件读档的子菜单 3 项（`libs/ui.js:2038`） | 部分支持 | `DownloadSaveSelect`（`src/client/ui/settings.tsx:479`）用 `Choices` 组合下载全部、当前与返回 | 新实现下载方向，旧读档方向在 `src/client/ui/settings.tsx:393` 仍为待办 |
| 12 | 存档笔记 | 新增、查看、编辑、删除存档笔记（`libs/ui.js:2001`） | 不支持 | 无笔记数据字段与面板，检索只命中类型声明 | 新数据层无笔记字段，菜单该项已被录像回放替换 |
| 13 | 录像回放 | 录像回放菜单 7 项，含接续、剩余、选择文件与下载（`libs/ui.js:2053`） | 支持 | `ReplaySettings`（`src/client/ui/settings.tsx:142`）用 `Choices` 列出 7 项，`saveWithExist`（`src/client/ui/save.tsx:580`）承接存档选择 | 文案一致，流程改为通用存档选择器加读档模式参数 |
| 14 | 从存档开始回放 | 进入从存档开始回放的读档选择态（`libs/actions.js:2916`） | 部分支持 | `saveWithExist`（`src/client/ui/save.tsx:580`）后按读档模式打开 `SaveUI` | 无独立面板与状态标记，流程合并到回放菜单 |
| 15 | 接续播放 | 接续播放两步选档，先选起点再选终点（`libs/actions.js:2925`） | 部分支持 | 两次 `saveWithExist`（`src/client/ui/save.tsx:580`）加 `getConfirm`（`src/client/ui/choices.tsx:603`）串接 | 无独立状态标记，提示文案保留 |
| 16 | 播放剩余录像 | 选一个带剩余录像的存档并播放（`libs/actions.js:2941`） | 部分支持 | `saveWithExist` 选择存档后按剩余录像模式读档 | 无独立面板，旧的两段说明未迁移 |
| 17 | 存档面板 | 10 格分页、自动存档、缩略图与删除（`libs/control.js:1501`） | 支持 | `SaveUI`（`src/client/ui/save.tsx:450`）用 `Page`、`Thumbnail` 与 `Selection` 组合网格、翻页、缩略图与删除 | 新为大页码网格替代旧两行五列，保存动作仍经旧存档接口 |
| 18 | 快捷商店列表 | 按文本列出商店并标灰未访问项（`libs/ui.js:2011`） | 部分支持 | `ShopUI`（`src/client/plugin/shop/shop.tsx:491`）提供商店内容页，列表可用 `List`（`packages-user/client-base/src/components/list.tsx:54`）组合 | 缺快捷商店选择列表，商店数据仍取旧对象，买卖语义归 P3 |
| 19 | 系统菜单 | 系统菜单 8 项，画布选择框（`libs/ui.js:1993`） | 部分支持 | 主设置界面（`src/client/ui/settings.tsx:47`）用 `Choices` 列出 8 项并打开子界面 | 第 4 项由存档笔记换成录像回放，系统设置仍走旧菜单入口 |
| 20 | 清空存档 | 清空本地存档的二级确认菜单 3 项（`libs/ui.js:2046`） | 支持 | `ClearSaveSelect`（`src/client/ui/settings.tsx:553`）用 `Choices`、`getConfirm` 与 `waitbox` 组合二次确认 | 选项与确认流程对齐，清理动作仍调旧存储接口 |
| 21 | 系统设置一级菜单 | 音效、显示、操作与返回主菜单 4 项（`libs/ui.js:1939`） | 部分支持 | `SettingPage`（`src/client/ui/setting.tsx:82`）用 `ListPage` 与 `Scroll` 呈现分组与设置行 | 通用设置页已具备，旧 4 个分组实体与入口仍待接线 |
| 22 | 操作设置 | 步时、转场、血瓶绕路、单击瞬移与左手模式（`libs/ui.js:1978`） | 部分支持 | `createNumberSettingControl` 与 `createBooleanSettingControl`（`packages-user/client-base/src/setting/controls.tsx:48`、`packages-user/client-base/src/setting/controls.tsx:123`）可组合各项 | 控件具备，5 个操作设置项未定义，左手模式无对应开关 |
| 23 | 显示设置 | 放缩、高清、定点怪显、显伤等 8 项（`libs/ui.js:1962`） | 部分支持 | `createRangeSettingControl` 与 `createBooleanSettingControl`（`packages-user/client-base/src/setting/controls.tsx:167`、`packages-user/client-base/src/setting/controls.tsx:123`）可组合数值与开关 | 控件具备，8 个显示项未定义，显示效果归 P4 |
| 24 | 音效设置 | 音乐与音效开关、音量（`libs/ui.js:1950`） | 部分支持 | `createBooleanSettingControl` 与 `createRangeSettingControl`（`packages-user/client-base/src/setting/controls.tsx:123`、`packages-user/client-base/src/setting/controls.tsx:167`）可组合开关与音量 | 控件具备，3 个音频项未定义，音频后端归 P6 |
| 25 | 同步存档菜单 | 同步存档一级菜单 7 项（`libs/ui.js:2022`） | 支持 | 同步存档界面（`src/client/ui/settings.tsx:359`）用 `Choices` 列出 6 项并打开范围、下载与清理子界面 | 7 项能力齐备，回放和下载录像移入录像回放菜单，服务端同步仍走旧接口 |
| 26 | 同步范围选择 | 同步全部、当前与返回 3 项（`libs/ui.js:2030`） | 支持 | 同步范围界面（`src/client/ui/settings.tsx:421`）用 `Choices` 与 `getConfirm` 组合 | 文案改为同步全部与当前，确认后调旧同步接口 |
| 27 | 道具箱 | 消耗与永久两列分页、说明与再点使用（`libs/ui.js:2667`） | 部分支持 | `ToolBoxUI`（`src/client/ui/toolbox.tsx:272`）用 `Scroll` 与图标组合三列与再点使用 | 三列布局与数量降序，旧式分页缺失，取项按隐藏标记过滤 |
| 28 | 浏览地图 | 楼层缩略图、统计、跳跃与打开手册（`libs/ui.js:2579`） | 部分支持 | `ViewMapUI`（`src/client/ui/viewmap.tsx:543`）用 `FloorSelector`（`packages-user/client-base/src/components/floorSelect.tsx:46`）与 `Tip` 组合 | 楼层选择与快捷键可用，地图画布与统计仍被注释，传送走旧接口 |
| 29 | 等待文本 | 居中显示一段等待文本，无进度、无取消（`libs/ui.js:1925`） | 支持 | `WaitBoxUI`（`src/client/ui/waitBox.tsx:189`）用 `TextContent` 与 Promise 兑现自动关闭 | 新等待框绑定 Promise 并支持手动结束 |
## 3. 状态栏与工具栏（27）

- 旧状态栏清单锚点：`project/data.js:741` 起共 12 项；绘制与刷新受样板覆写（`project/functions.js:1594`、`project/functions.js:1169`），见 `## 1.2`。
- 新侧读取旧清单后逐项分支渲染（`src/client/ui/statusBar.tsx:227`），数值多数来自新英雄属性系统。
- 旧工具栏图像键共 29 个（`main.js:121`）：13 个显示项、8 个功能按钮、8 个手机按钮；点击处理从 `main.js:717` 起。

### 3.1 状态栏项（13）

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 30 | 楼层名 | 控制左侧状态栏是否显示楼层名，点击可浏览地图（`project/data.js:742`、`main.js:814`） | 部分支持 | 状态栏恒显示楼层名（`src/client/ui/statusBar.tsx:454`），点击交给 `openViewMap`（`src/client/ui/viewmap.tsx:545`） | 点击行为保留，旧开关未实现，楼层名始终显示 |
| 31 | 等级 | 显示等级名（`project/data.js:743`） | 部分支持 | 分支读取等级开关（`src/client/ui/statusBar.tsx:230`），等级名在 `src/client/ui/statusBar.tsx:183` 生成 | 分支存在，等级名仍由旧全局接口生成，新数据层无同名实现 |
| 32 | 生命 | 显示生命值（`project/data.js:744`） | 支持 | 分支（`src/client/ui/statusBar.tsx:240`）读取新英雄属性并格式化显示 | 数值来自新属性系统，格式化沿用旧大数函数 |
| 33 | 生命上限 | 控制生命是否显示当前与上限（`project/functions.js:1176`） | 支持 | 与生命分支组合输出当前与上限（`src/client/ui/statusBar.tsx:241`） | 旧数据默认清单无此项，样板覆写按此开关显示血限 |
| 34 | 魔力 | 显示魔力（`project/data.js:745`） | 支持 | 分支（`src/client/ui/statusBar.tsx:265`）在上限大于零时显示当前与上限 | 旧只显示魔力，新额外显示上限 |
| 35 | 攻击 | 显示攻击（`project/data.js:746`） | 支持 | 分支（`src/client/ui/statusBar.tsx:285`）读取新属性并格式化 | 无行为差异 |
| 36 | 防御 | 显示防御（`project/data.js:747`） | 支持 | 分支（`src/client/ui/statusBar.tsx:295`）读取新属性并格式化 | 无行为差异 |
| 37 | 魔防 | 显示魔防或护盾（`project/data.js:748`） | 部分支持 | 分支判断小写开关（`src/client/ui/statusBar.tsx:305`） | 旧数据写大写结尾，按旧配置迁移会静默不显示魔防 |
| 38 | 金币 | 显示金币（`project/data.js:749`） | 支持 | 分支（`src/client/ui/statusBar.tsx:315`）读取新属性并格式化 | 无行为差异 |
| 39 | 经验 | 显示经验（`project/data.js:750`） | 支持 | 分支（`src/client/ui/statusBar.tsx:325`）显示经验，升级模式改显示剩余 | 剩余升级值来源未接线，基础经验显示正常 |
| 40 | 钥匙 | 显示黄、蓝、红钥匙两位数字（`project/data.js:751`） | 部分支持 | 分支（`src/client/ui/statusBar.tsx:346`）用 `KeyLikeItem` 组合三色钥匙两位数字 | 布局具备，钥匙计数尚未接新道具数据，初始恒为零 |
| 41 | 破炸飞 | 显示破、炸、飞数量（`project/data.js:752`） | 部分支持 | 分支（`src/client/ui/statusBar.tsx:378`）用文本行组合三项计数 | 布局具备，数值来源未接线 |
| 42 | 技能 | 显示技能项（`project/data.js:753`） | 不支持 | 状态栏支持清单无该项，也没有技能数据来源 | 技能系统本身在 P3 亦无实现 |

### 3.2 工具栏按钮（14）

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 43 | 怪物手册按钮 | 点击打开怪物手册，录像中触发回放（`main.js:727`） | 部分支持 | `PlayingToolbar`（`src/client/ui/toolbar.tsx:84`）按钮打开手册，界面为 `BookUI`（`src/client/ui/book.tsx:267`） | 按钮与界面都在，点击仍经旧全局入口 |
| 44 | 楼层传送与装备栏按钮 | 装备栏开关决定飞行或装备栏（`main.js:739`） | 部分支持 | 工具栏拆成飞行与装备两个按钮（`src/client/ui/toolbar.tsx:86`、`src/client/ui/toolbar.tsx:93`），装备界面为 `EquipBoxUI` | 失去开关切换语义，两个入口分别调用旧接口 |
| 45 | 道具栏按钮 | 打开道具栏，双击切装备栏（`main.js:758`） | 部分支持 | 按钮（`src/client/ui/toolbar.tsx:85`）打开道具栏，界面为 `ToolBoxUI`（`src/client/ui/toolbox.tsx:272`） | 无双击切装备栏 |
| 46 | 虚拟键盘按钮 | 打开游戏内虚拟键盘（`main.js:783`） | 部分支持 | 按钮（`src/client/ui/toolbar.tsx:95`）当前为空，键盘可用 `HotkeySystem.down` 与 `HotkeySystem.up`（`packages/system/src/hotkey/system.ts:365`、`packages/system/src/hotkey/system.ts:392`）组合 | 触发接口具备，键盘界面尚未实现，菜单同名项也为空 |
| 47 | 快捷商店按钮 | 打开快捷商店列表（`main.js:795`） | 部分支持 | 按钮（`src/client/ui/toolbar.tsx:94`）打开商店，界面为 `ShopUI`（`src/client/plugin/shop/shop.tsx:491`） | 商店内容页存在，快捷商店列表缺失，按钮仍调旧接口 |
| 48 | 金币点击商店 | 点击金币也可打开快捷商店（`main.js:807`） | 部分支持 | 金币文本（`src/client/ui/statusBar.tsx:315`）可补点击处理并复用工具栏商店入口 | 新状态栏金币没有点击处理器 |
| 49 | 点击楼层名浏览地图 | 满足条件时打开浏览地图（`main.js:814`） | 支持 | 楼层名点击（`src/client/ui/statusBar.tsx:448`）打开 `ViewMapUI`（`src/client/ui/viewmap.tsx:543`） | 新走界面栈打开，不调用旧画布面板 |
| 50 | 存档按钮 | 打开存档面板（`main.js:828`） | 部分支持 | 按钮（`src/client/ui/toolbar.tsx:87`）调用 `saveSave`（`src/client/ui/save.tsx:532`）打开存档界面 | 面板为新组件，保存动作仍经旧存档接口 |
| 51 | 读档按钮 | 打开读档面板（`main.js:840`） | 部分支持 | 按钮（`src/client/ui/toolbar.tsx:90`）调用 `saveLoad`（`src/client/ui/save.tsx:556`）以读档模式打开存档界面 | 同上，读档动作仍经旧接口 |
| 52 | 系统菜单按钮 | 打开系统菜单（`main.js:852`） | 支持 | 按钮（`src/client/ui/toolbar.tsx:116`）调用 `openSettings`（`src/client/ui/settings.tsx:688`）打开主设置界面 | 菜单为 Vue 组件，子项动作多数仍调旧接口 |
| 53 | 手机按钮 1 至 7 | 模拟按键 1 至 7，按住辅助键时带修饰键（`main.js:869`） | 部分支持 | `NumpadToolbar`（`src/client/ui/toolbar.tsx:244`）画出数字与修饰键，`HotkeySystem.down` 与 `HotkeySystem.up` 可发射按键 | 数字键点击处理当前被注释，只高亮修饰键 |
| 54 | 手机按钮 8 | 切换辅助键模式并改按钮滤镜（`main.js:925`） | 部分支持 | `clickAlt`（`src/client/ui/toolbar.tsx:293`）切换本地高亮，可与组合键发送配合 | 不写入旧辅助键状态，也不发射组合键 |
| 55 | 工具栏显隐 | 点击按钮切换工具栏（`main.js:864`） | 部分支持 | `MixedToolbar`（`src/client/ui/toolbar.tsx:382`）可用 `hidden` 属性组合显隐 | 无现成开关，需自行加一个布尔状态 |
| 56 | 回放工具条 | 播放、暂停、停止、变速、回退与单步（`main.js:939`） | 部分支持 | `ReplayingToolbar`（`src/client/ui/toolbar.tsx:166`）用图标与 `Progress` 组合全部按钮 | 布局齐全，动作全部调旧回放接口 |

## 4. 键盘、鼠标、触摸与长按（12）

- 旧 12 个输入动作注册于 `libs/actions.js:21` 至 `libs/actions.js:56`；分发入口在 `libs/actions.js:155`、`libs/actions.js:178`、`libs/actions.js:888`。
- 旧左手模式是按键重映射（`libs/actions.js:127`），仅在样板开关为真时生效；新侧没有对应开关。
- 新侧事件模型：`ActionType`（`packages/render/src/core/event.ts:28`）与动作事件接口（`packages/render/src/core/event.ts:52`）；按键模型为 `packages/system/src/hotkey`。
- 两套模型不是同名映射：旧动作是全局注册表，新按键是命令表加组件事件。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 57 | 键盘按下 | 按下时先查录像，再处理按住键与移动（`libs/actions.js:21`） | 支持 | `HotkeySystem` 的按下匹配（`packages/system/src/hotkey/system.ts:229` 注册、`packages/system/src/hotkey/system.ts:365` 发射）按命令表分发 | 新以命令组合匹配，不暴露同名全局钩子 |
| 58 | 键盘抬起 | 抬起时查录像、做左手映射并执行快捷键（`libs/actions.js:178`） | 支持 | `HotkeyEmitMode.KeyUp`（`packages/system/src/hotkey/types.ts:11`）在抬起后按超时触发 | 抬起触发具备，左手映射无对应开关 |
| 59 | 单次按键 | 按下即触发并可去重（`libs/actions.js:27`） | 支持 | `HotkeyEmitMode.Once`（`packages/system/src/hotkey/types.ts:13`）与 `once`（`packages/system/src/hotkey/types.ts:136`）组合 | 超时默认零，语义与旧单次触发一致 |
| 60 | 按住键 | 按住后连续触发移动或转向（`libs/actions.js:30`） | 支持 | `HotkeyEmitMode.Continuous`（`packages/system/src/hotkey/types.ts:15`）与 `continuous`（`packages/system/src/hotkey/types.ts:145`）按激励源触发 | 连续触发由渲染激励源驱动，旧靠按住键集合与主循环 |
| 61 | 抬起收尾 | 抬起后的收尾动作（`libs/actions.js:34`） | 支持 | `HotkeyEmitMode.KeyUp` 与 `keyUp`（`packages/system/src/hotkey/types.ts:130`）组合 | 新可延迟触发，旧为即时收尾 |
| 62 | 指针按下 | 鼠标或触摸按下时统一计算点击、面板与拖拽（`libs/actions.js:38`） | 支持 | `ActionType.Down`（`packages/render/src/core/event.ts:28`）与组件按下处理组合 | 新由渲染层命中测试分发到组件，触摸与鼠标同模型 |
| 63 | 指针移动 | 指针移动用于拖拽地图与长按判定（`libs/actions.js:42`） | 支持 | `ActionType.Move`（`packages/render/src/core/event.ts:28`）与组件移动处理组合 | 新由组件自行处理，无全局移动钩子 |
| 64 | 指针抬起 | 指针抬起结束拖拽或点击（`libs/actions.js:46`） | 支持 | `ActionType.Up`（`packages/render/src/core/event.ts:28`）与组件抬起处理组合 | 新由组件自行处理，无全局抬起钩子 |
| 65 | 滚轮 | 滚轮翻页、缩放与切换楼层（`libs/actions.js:50`） | 支持 | `ActionType.Wheel` 与 `IWheelEvent`（`packages/render/src/core/event.ts:98`）组合，横向、纵向与缩放信息可用 | 新信息更丰富，具体行为由组件决定 |
| 66 | 控制键按下 | 控制键按下时的独立动作（`libs/actions.js:52`） | 部分支持 | 组合键（`packages/system/src/hotkey/types.ts:64`）与触发上下文修饰位（`packages/system/src/hotkey/types.ts:31`）可组合 | 无独立控制键回调，需在命令表登记组合键 |
| 67 | 长按 | 长按有独立动作与优先级（`libs/actions.js:54`） | 部分支持 | `ActionType.Down` 与 `ActionType.Up`（`packages/render/src/core/event.ts:28`）加组件内定时器可组合长按判定 | 无全局长按判定器，需组件自行计时并在移动或抬起时取消 |
| 68 | 状态栏点击 | 自绘状态栏的像素坐标点击（`libs/actions.js:56`） | 部分支持 | 状态栏各文本与图标自带点击处理（`src/client/ui/statusBar.tsx:448`）可组合区域点击 | 无画布像素回调，旧自定义区域能力需逐元素绑定 |

## 5. 设置与存读档面板（12）

- 旧设置四页：`libs/ui.js:1939` 至 `libs/ui.js:1990`；存读档、同步与回放：`libs/ui.js:2022` 至 `libs/ui.js:2055`，以及 `libs/ui.js:2964` 的存档面板。
- 新侧设置系统在 `packages-user/client-base/src/setting`，设置页在 `src/client/ui/setting.tsx`，菜单与子界面在 `src/client/ui/settings.tsx`。
- 新侧存读档界面在 `src/client/ui/save.tsx`；存档选择以 `saveWithExist` 与读档模式参数复用。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 69 | 系统设置一级 | 音效、显示、操作与返回主菜单 4 项（`libs/ui.js:1939`） | 部分支持 | `SettingPage`（`src/client/ui/setting.tsx:82`）用 `ListPage` 呈现分组列表 | 页面与控件具备，旧音效、显示与操作分组实体未定义，入口仍走旧菜单 |
| 70 | 音效设置页 | 音乐与音效开关、音量（`libs/ui.js:1950`） | 部分支持 | 设置系统（`packages-user/client-base/src/setting/system.ts:11`）加布尔与范围控件可组合 | 3 个音频设置项未定义 |
| 71 | 显示设置页 | 放缩、高清、定点怪显、显伤等 8 项（`libs/ui.js:1962`） | 部分支持 | 设置系统与范围、布尔控件（`packages-user/client-base/src/setting/controls.tsx:167`）可组合各项 | 8 个显示项未定义，显示效果归 P4 |
| 72 | 操作设置页 | 步时、转场、血瓶绕路、单击瞬移与左手模式（`libs/ui.js:1978`） | 部分支持 | 数值与布尔控件（`packages-user/client-base/src/setting/controls.tsx:48`、`packages-user/client-base/src/setting/controls.tsx:123`）可组合 | 5 个操作项未定义，左手模式无对应开关 |
| 73 | 存档笔记 | 存档笔记增删改查（`libs/ui.js:2001`） | 不支持 | 无笔记数据字段与面板 | 菜单项已被录像回放替换 |
| 74 | 存档面板 | 10 格分页、自动存档、缩略图与删除（`libs/control.js:1501`） | 支持 | `SaveUI`（`src/client/ui/save.tsx:450`）用 `Page`、`Thumbnail` 与 `Selection` 组合 | 网格与大页码替代旧两行五列，保存动作仍经旧接口 |
| 75 | 同步存档菜单 | 同步存档 7 项（`libs/ui.js:2022`） | 支持 | 同步存档界面（`src/client/ui/settings.tsx:359`）用 `Choices` 组合 6 项与子界面 | 回放和下载录像移入录像回放菜单，服务端动作仍调旧接口 |
| 76 | 同步范围选择 | 同步全部、当前与返回 3 项（`libs/ui.js:2030`） | 支持 | 同步范围界面（`src/client/ui/settings.tsx:421`）用 `Choices` 与确认框组合 | 文案调整，调用参数保持全部与当前两种 |
| 77 | 本地存档子菜单 | 从本地文件读档子菜单 3 项（`libs/ui.js:2038`） | 部分支持 | `DownloadSaveSelect`（`src/client/ui/settings.tsx:479`）用 `Choices` 与 `waitbox` 组合下载 | 下载方向可用，读档方向仍待办 |
| 78 | 清空存档 | 清空本地存档二级确认 3 项（`libs/ui.js:2046`） | 支持 | `ClearSaveSelect`（`src/client/ui/settings.tsx:553`）用 `Choices`、`getConfirm` 与 `waitbox` 组合 | 清理范围沿用旧存储接口 |
| 79 | 录像回放菜单 | 录像回放 7 项（`libs/ui.js:2053`） | 支持 | `ReplaySettings`（`src/client/ui/settings.tsx:142`）用 `Choices` 与存档选择组合 | 选项一致，流程改为通用存档选择器 |
| 80 | 回放读档状态 | 从存档开始、接续播放与剩余录像各自选档（`libs/actions.js:2917`、`libs/actions.js:2933`、`libs/actions.js:2950`） | 部分支持 | `saveWithExist`（`src/client/ui/save.tsx:580`）与 `getConfirm`（`src/client/ui/choices.tsx:603`）组合三步流程 | 无独立面板与状态标记，以模式参数替代 |
## 6. 图鉴与装备栏与道具箱与商店与地图查看与飞行（7）

- 旧入口集中在 `libs/control.js` 的面板打开函数与 `libs/ui.js` 的绘制函数；道具栏取项受样板覆写（`project/functions.js:1584`），见 `## 1.2`。
- 新侧对应界面均在 `src/client/ui`，商店在 `src/client/plugin/shop`；通用组件来自 `packages-user/client-base/src/components`。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 81 | 怪物手册列表 | 按楼层索引与分页展示怪物（`libs/ui.js:2103`） | 部分支持 | `BookUI`（`src/client/ui/book.tsx:267`）用 `Scroll`（`packages-user/client-base/src/components/scroll.tsx:109`）列出当前楼层怪物并可点开详情 | 无多楼层索引与旧式分页 |
| 82 | 怪物详情 | 一次绘制全部属性与特殊属性说明（`libs/ui.js:2353`） | 支持 | `BookDetailUI`（`src/client/ui/bookDetail.tsx:353`）用 `TextContent` 与 `Scroll` 呈现基础与计算属性、临界表 | 新增模式切换与临界滚动 |
| 83 | 装备栏 | 当前装备与拥有装备两栏，点击穿脱（`libs/ui.js:2804`） | 部分支持 | `EquipBoxUI`（`src/client/ui/equipbox.tsx:543`）用 `Scroll` 与图标组合槽位、拥有列表与拖拽 | 无旧式分页，拖拽为新增交互 |
| 84 | 道具箱 | 消耗与永久两栏、说明与再点使用（`libs/ui.js:2667`） | 部分支持 | `ToolBoxUI`（`src/client/ui/toolbox.tsx:272`）用 `Scroll` 与图标组合三列 | 无分页，排序改为数量降序 |
| 85 | 商店 | 快捷商店列表与商店内事件选项（`libs/ui.js:2011`） | 部分支持 | `ShopUI`（`src/client/plugin/shop/shop.tsx:491`）用列表与按钮组合库存与买卖价 | 无快捷商店列表，商店语义与旧事件选项不同，价格归 P3 |
| 86 | 浏览地图 | 缩略图浏览、楼层切换、统计与传送（`libs/ui.js:2579`） | 部分支持 | `ViewMapUI`（`src/client/ui/viewmap.tsx:543`）用 `FloorSelector` 与 `Tip` 组合楼层选择与提示 | 地图画布与统计仍被注释，统计值恒为空 |
| 87 | 飞行 | 楼层跳跃列表与中心对称飞行器（`libs/ui.js:2518`、`libs/ui.js:2560`） | 部分支持 | `FloorSelector`（`packages-user/client-base/src/components/floorSelect.tsx:46`）可组合楼层跳跃列表，`Selection` 可标记目标 | 列表组件已具备，传送动作仍走旧接口，中心对称全屏布局缺失 |

## 7. 文本与选择与输入与等待（10）

- 旧组件是画布绘制函数：提示 `libs/ui.js:695`、选择 `libs/ui.js:1723`、确认 `libs/ui.js:1866`、输入与文本框 `libs/ui.js:1441`、等待 `libs/ui.js:1925`、滚动字幕 `libs/ui.js:1675`、文本队列 `libs/ui.js:738`。
- 新侧对应通用组件集中在 `packages-user/client-base/src/components`，界面包装在 `src/client/ui`；输入框与等待框返回 Promise。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 88 | 浮动提示 | 在数据画布绘制带图标与淡入的提示（`libs/ui.js:695`） | 支持 | `Tip` 与 `TipStore`（`packages-user/client-base/src/components/tip.tsx:41`、`packages-user/client-base/src/components/tip.tsx:148`）组合图标与淡入淡出 | 新为 Vue 组件，需显式传图标或文本 |
| 89 | 选择框 | 标题、选项、分页与方向键选择（`libs/ui.js:1723`） | 支持 | `Choices`（`src/client/ui/choices.tsx:325`）用 `Page` 与 `Selection` 组合选项分页与高亮 | 新统一选项数组，并支持鼠标点击 |
| 90 | 确认框 | 左右选择确认或取消并回调（`libs/ui.js:1866`） | 支持 | `ConfirmBox`（`src/client/ui/choices.tsx:103`）与 `getConfirm`（`src/client/ui/choices.tsx:603`）组合按钮与回调 | 默认选中可配，录像写入走路由确认 |
| 91 | 文本输入 | 画布文本框的输入态（`libs/ui.js:1441`） | 支持 | `InputBox`（`src/client/ui/inputBox.tsx:112`）用 `Input`（`packages-user/client-base/src/components/input.tsx:88`）与确认、取消按钮组合 | 新用原生输入元素并返回 Promise |
| 92 | 等待框 | 静态等待文本（`libs/ui.js:1925`） | 支持 | `WaitBox`（`src/client/ui/waitBox.tsx:66`）用 `TextContent` 与 Promise 组合 | 兑现后自动关闭并支持手动结束 |
| 93 | 文本框 | 标题、图标、多行自动换行、翻页与打字机（`libs/ui.js:1441`） | 支持 | `Textbox`、`TextContent` 与 `TextboxStore`（`packages-user/client-base/src/components/textbox.tsx:310`、`packages-user/client-base/src/components/textbox.tsx:117`、`packages-user/client-base/src/components/textbox.tsx:579`）组合 | 拆成渲染、打字机与队列三层 |
| 94 | 滚动字幕 | 从下往上滚动，受录像速度影响（`libs/ui.js:1675`） | 支持 | `ScrollText`（`packages-user/client-base/src/components/misc.tsx:210`）组合 `Scroll` 与速度控制 | 速度可暂停与恢复，旧录像倍速耦合未逐项对齐 |
| 95 | 文本队列 | 逐页显示文本并在结束后回调（`libs/ui.js:738`） | 支持 | `TextboxStore`（`packages-user/client-base/src/components/textbox.tsx:579`）与 `Textbox` 组合队列与回调 | 队列由存储对象管理，旧线性回调链未逐字对照 |
| 96 | 键盘索引与翻页 | 回车、空格或 C 确认，方向键移动，左右翻页（`libs/actions.js:1268`） | 支持 | `@common/confirm` 与方向选择命令（`src/client/misc/hotkey.ts:13`）配合 `Page` 组合 | 新确认键默认回车、空格与 C，翻页由页码组件计算 |
| 97 | 超时与自动关闭 | 实时游玩无超时自动关闭（`libs/ui.js:1925`） | 支持 | `routedConfirm`（`src/client/ui/choices.tsx:715`）只在录像路径加入超时，实时游玩保持手动关闭 | 新实时行为与旧一致，录像路径额外支持超时 |

## 8. 疑似缺口专项（17）

- 本节对旧样板中疑似的缺口逐条复核，检索根目录同 `## 1.3`，检索模式包含旧符号原名、短横与下划线变体、中文关键词、常量名与旧调用点。
- 本节条目与正文前几节重复，按计划独立计数；两处判定保持一致，「差异 / 说明」写检索范围与缺口原因。

| 序号 | 旧样板功能 | 旧样板行为 | 新样板判定 | 新样板如何实现 | 差异 / 说明 |
| --- | --- | --- | --- | --- | --- |
| 98 | 飞行 | 楼层跳跃列表与中心对称飞行器（`libs/ui.js:2518`、`libs/ui.js:2560`） | 部分支持 | `FloorSelector`（`packages-user/client-base/src/components/floorSelect.tsx:46`）可组合楼层列表，`Selection` 标记目标 | 检索飞行、传送与使用飞行器标识，只命中旧调用与工具栏入口，传送动作仍在旧接口 |
| 99 | 游戏内虚拟键盘 | 绘制功能键、数字、字母并用光标点按（`libs/ui.js:3122`） | 部分支持 | `HotkeySystem.down` 与 `HotkeySystem.up`（`packages/system/src/hotkey/system.ts:365`、`packages/system/src/hotkey/system.ts:392`）配合 `g-rectr` 可组合按键网格 | 检索虚拟键盘与改键标识，只命中改键设置界面与空的工具栏处理函数 |
| 100 | 游戏信息菜单 | 7 项游戏信息菜单，含操作帮助与关于游戏（`libs/ui.js:2062`） | 部分支持 | `Choices`（`src/client/ui/choices.tsx:325`）在 `src/client/ui/settings.tsx:263` 组装 6 项 | 检索游戏信息与数据统计标识，操作帮助为空分支，关于游戏缺失 |
| 101 | 操作帮助 | 有键盘素材时显示帮助图，否则文本页（`libs/ui.js:3351`） | 部分支持 | `Textbox`（`packages-user/client-base/src/components/textbox.tsx:310`）可组合帮助文本页 | 检索帮助与键盘素材标识，只命中空分支，素材路径无对应 |
| 102 | 存档笔记 | 存档笔记增删改查（`libs/ui.js:2001`） | 不支持 | 无笔记数据字段与面板 | 检索笔记标识，只命中类型声明，新数据层无该字段 |
| 103 | 同步存档菜单 | 同步存档 7 项（`libs/ui.js:2022`） | 支持 | 同步存档界面（`src/client/ui/settings.tsx:359`）用 `Choices` 组合 6 项与子界面 | 检索同步标识，能力齐备，回放和下载录像移至回放菜单，服务端仍走旧接口 |
| 104 | 同步范围选择 | 同步全部、当前与返回 3 项（`libs/ui.js:2030`） | 支持 | 同步范围界面（`src/client/ui/settings.tsx:421`）用 `Choices` 与 `getConfirm` 组合 | 检索同步范围标识，选项与确认流程对齐 |
| 105 | 本地存档子菜单 | 从本地文件读档子菜单 3 项（`libs/ui.js:2038`） | 部分支持 | `DownloadSaveSelect`（`src/client/ui/settings.tsx:479`）用 `Choices` 与 `waitbox` 组合下载 | 检索本地存档标识，下载方向已实现，读档方向仍待办 |
| 106 | 录像回放菜单 | 录像回放 7 项（`libs/ui.js:2053`） | 支持 | `ReplaySettings`（`src/client/ui/settings.tsx:142`）用 `Choices` 与存档选择组合 | 检索回放标识，文案一致，流程改为通用存档选择器 |
| 107 | 从存档开始回放 | 读档选择态后开始回放（`libs/actions.js:2916`） | 部分支持 | `saveWithExist`（`src/client/ui/save.tsx:580`）后按读档模式打开 `SaveUI` | 检索回放读档标识，无独立面板与状态标记 |
| 108 | 接续播放 | 两步选档后接续播放（`libs/actions.js:2925`） | 部分支持 | 两次 `saveWithExist`（`src/client/ui/save.tsx:580`）加 `getConfirm`（`src/client/ui/choices.tsx:603`）串接 | 检索接续播放标识，流程合并，提示文案保留 |
| 109 | 播放剩余录像 | 选择带剩余录像的存档并播放（`libs/actions.js:2941`） | 部分支持 | `saveWithExist` 选择存档后按剩余录像模式读档 | 检索剩余录像标识，无独立面板，旧说明未迁移 |
| 110 | 清空存档 | 清空本地存档二级确认 3 项（`libs/ui.js:2046`） | 支持 | `ClearSaveSelect`（`src/client/ui/settings.tsx:553`）用 `Choices`、`getConfirm` 与 `waitbox` 组合 | 检索清空存档标识，选项与确认流程对齐 |
| 111 | 快捷商店列表 | 按文本列出商店并标灰未访问项（`libs/ui.js:2011`） | 部分支持 | `ShopUI`（`src/client/plugin/shop/shop.tsx:491`）提供内容页，列表可用 `List`（`packages-user/client-base/src/components/list.tsx:54`）组合 | 检索快捷商店与列表标识，只有商店内容页与旧入口 |
| 112 | 中心对称飞行器 | 全屏缩略图显示目标格并确认传送（`libs/ui.js:2560`） | 部分支持 | `Thumbnail`（`packages-user/client-base/src/components/thumbnail.tsx:43`）与 `ConfirmBox`（`src/client/ui/choices.tsx:103`）可组合缩略图与确认 | 检索中心对称与飞行器标识，只命中状态栏道具计数，无全屏确认界面 |
| 113 | 寻路光标 | 自动寻路在界面画布画 32×32 选择框（`libs/ui.js:2089`） | 部分支持 | `Selection`（`packages-user/client-base/src/components/misc.tsx:302`）可画 32×32 高亮框 | 检索寻路与光标标识，只命中样式指针，无寻路光标面板 |
| 114 | 系统设置分组 | 音效、显示、操作与返回主菜单 4 项（`libs/ui.js:1939`） | 部分支持 | `SettingPage`（`src/client/ui/setting.tsx:82`）用 `ListPage` 与 `Scroll` 呈现分组与设置行 | 检索设置分组标识，页面与控件具备，具体分组实体未定义 |

## 9. 计数与范围

### 9.1 三值统计

| 分节 | 条目 | 支持 | 部分支持 | 不支持 |
| --- | --- | --- | --- | --- |
| 面板与事件标识 | 29 | 8 | 19 | 2 |
| 状态栏项 | 13 | 7 | 5 | 1 |
| 工具栏按钮 | 14 | 2 | 12 | 0 |
| 输入动作 | 12 | 9 | 3 | 0 |
| 设置与存读档面板 | 12 | 5 | 6 | 1 |
| 图鉴与装备栏与道具箱与商店与地图查看与飞行 | 7 | 1 | 6 | 0 |
| 文本与选择与输入与等待 | 10 | 10 | 0 | 0 |
| 疑似缺口专项 | 17 | 4 | 12 | 1 |
| 合计 | 114 | 46 | 63 | 5 |

### 9.2 合并与拆分记录

- 新侧原有的 11 条热键分组行已整表移除，旧按键模型改为 `## 4` 的短段落说明；12 个输入动作仍逐条保留。
- 旧样板的三条回放读档状态在 `## 5` 合并为第 80 条，在 `## 8` 仍拆为三条专项记录，属于专项复核，不额外增加正文条目。
- 手机按钮 1 至 7 合并为第 53 条，手机按钮 8 单列为第 54 条，与旧 `main.js` 的处理函数边界一致。
- 除上述四组外没有其它合并或拆分；114 行与旧侧条目逐项对应。

### 9.3 未做的事

- 不判定数据字段、战斗与事件执行数值、绘制原语与运行时扩展；相关内容只写交叉引用。
- 不写修复建议与迁移方案，不运行游戏，不做人工验收。
- 不修改 `00-INDEX.md`、`01-DATA.md`、`02-GAMEPLAY.md`、`03-RENDER.md`、05 运行时分册、任何源码、配置、计划、摘要、`STATE.md` 与 `ROADMAP.md`。

