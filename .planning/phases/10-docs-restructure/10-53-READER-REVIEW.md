# 10-53 独立读者循环记录（第 2/3 轮）

Round 1 见 `10-49-READER-REVIEW.md`，本文件只记录 Round 2/3，不复制 Round 1 内容；记录不交给用户。

### 第 2 轮

派发状态：见 Task 2

用户更正（2026-11-01）：Round 2/3 改为一个读者读完全部 25 篇，不是 4 组读者；4 组临时结果作废。本文件按单读者结构记录。

#### 读者

单读者，人格逐字如下：

> 你是一位刚读完中级教程、想给自己的魔塔做一套自定义界面的作者。你完全没写过 UI，不知道 canvas 是什么，也不会 Vue 的组件写法；你只掌握了基础 TS/JS、函数、对象、数组和一点点模板语法。你手里只有这套文档，不能看源码，也没有人可以问。你的任务不是评价文档好坏，而是老老实实按顺序读，读到哪里卡住就记下：我在哪一段卡住、我从文档里已经知道什么、我还缺什么才能继续往下做。

阅读范围（25 篇，按顺序）：

1. `docs/advanced/ii/ui/ui-template.md`
2. `docs/advanced/ii/ui/container-and-coordinates.md`
3. `docs/advanced/ii/ui/basic-shapes.md`
4. `docs/advanced/ii/ui/curves-and-paths.md`
5. `docs/advanced/ii/ui/text.md`
6. `docs/advanced/ii/ui/image-and-texture.md`
7. `docs/advanced/ii/ui/layer-transform-performance.md`
8. `docs/advanced/ii/ui/reactivity.md`
9. `docs/advanced/ii/ui/events.md`
10. `docs/advanced/ii/ui/hotkey-in-ui.md`
11. `docs/advanced/ii/ui/conditional-and-list-rendering.md`
12. `docs/advanced/ii/ui/props.md`
13. `docs/advanced/ii/ui/component-tsx.md`
14. `docs/advanced/ii/ui/slots-and-attrs.md`
15. `docs/advanced/ii/ui/builtin-text-and-input.md`
16. `docs/advanced/ii/ui/builtin-list-and-containers.md`
17. `docs/advanced/ii/ui/ui-controller-and-stack.md`
18. `docs/advanced/ii/ui/replace-builtin-ui.md`
19. `docs/advanced/ii/ui/ui-performance.md`
20. `docs/advanced/ii/ui/inventory-example-1-skeleton.md`
21. `docs/advanced/ii/ui/inventory-example-2-grid.md`
22. `docs/advanced/ii/ui/inventory-example-3-detail.md`
23. `docs/advanced/ii/ui/inventory-example-4-scroll.md`
24. `docs/advanced/ii/ui/inventory-example-5-state.md`
25. `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md`

#### 逐篇提问

| 篇目 | 位置 | 我已经从文档知道什么 | 我还缺什么 | 我照着做会预期什么 |
| --- | --- | --- | --- | --- |
| `docs/advanced/ii/ui/ui-template.md` | 「一个最小 UI」代码块 | 组件由 Props 类型 + props 列表 + `defineComponent` + `GameUI` 四段组成，结构写在 render 返回的标签里 | 这些 import（`@motajs/system`、`@user/client-base`、`@motajs/render-vue`）分别是什么包、TSX 靠什么编译（jsx 配置）、我新建的 `src/client/ui/my-panel.tsx` 在什么条件下才会被编译进来 | 把这段贴进文件就能显示面板，不用再做别的配置 |
| `docs/advanced/ii/ui/ui-template.md` | 「打开与关闭」 | 知道三个打开入口，分别开在场景控制器、当前控制器、主 UI 栈上 | 这行 `open` 到底写在哪个文件；模板里没有任何地方调用 open，我不在组件里却拿不到 `props`，那主入口那一行应该长什么样 | 照抄 `props.state.sceneController.open(MyPanelUI, {})` 就能打开 |
| `docs/advanced/ii/ui/ui-template.md` | 「三个基础 props」 | 知道 `controller` / `instance` / `state` 是注入的，props 列表少写不报错、只是拿不到 | `IGameUIPropsBase` 与 `DefaultProps` 里到底有什么字段；我能不能往 props 列表里加自己的键而不改接口；`state` 上有哪些成员（这里只说「场景控制器、主 UI 控制器、素材管理器、渲染根等」） | 只要写全三个键，就能在组件里随意读 `props.state.xxx` |
| `docs/advanced/ii/ui/container-and-coordinates.md` | 「loc 与锚点」 | 知道六元组顺序、后两项可省略、默认锚点 0、圆默认 0.5、`anc` 是简写 | `zIndex` 的默认值是多少（全文第一次要判断遮挡，这里没给）；「省略宽高时沿用元素当前尺寸（默认 200×200）」——首次挂载时「当前尺寸」指什么 | 不写宽高就是 200×200，之后也不会变 |
| `docs/advanced/ii/ui/container-and-coordinates.md` | 「坐标基准与画布」 | 知道 `props.state.renderer.width/height` 是设计尺寸，居中要自己算 | 我们这游戏的画布设计尺寸具体是多少、面板根会不会被控制器摆到某个位置；我以为 `[0,0,480,320]` 会出现在左上角，但没有一处确认 | 按 `renderer.width` 算出的 x/y 就是面板左上角 |
| `docs/advanced/ii/ui/basic-shapes.md` | 「填充、描边与命中」下表 | 知道三个开关的组合结果、默认色 `#ddd`、`g-line` 默认描边 | 怎么做出「完全看不见但能点」的矩形：表里「否/否」结果仍是填充；没有一处说透明怎么表达（`rgba(...,0)`？`alpha={0}`？），而「像边框下面垫一个透明的填充矩形」这句就建立在这个没解释的写法上 | 写 `alpha={0}` 或 `fillStyle="transparent"` 就得到透明热区 |
| `docs/advanced/ii/ui/basic-shapes.md` | 「图形作为界面零件」表 | 知道分隔线可加 `noevent`、遮罩可用 `alpha` + `noevent` | 表格里 `g-rectr` 的圆角写法这里没展开、按钮底与文字的命中关系这里只有一句 | 按表格拼按钮，点击一定落在按钮底 |
| `docs/advanced/ii/ui/curves-and-paths.md` | 「路径与曲线的坐标基准」 | 知道贝塞尔的点写在父容器坐标、`g-path` 的点是元素局部坐标、不写 `x/y` 时从父容器原点开始 | 两种基准混在一棵子树里时，我怎么一眼分辨；想把路径整体平移只能给元素写 `x/y`，贝塞尔却只能包容器，我不确定能不能用同一套布局手法 | 同一容器里贝塞尔与 path 的坐标基准一致，可以互换写法 |
| `docs/advanced/ii/ui/curves-and-paths.md` | 「路径」代码块后 | 知道路径要在渲染函数外构造一次、每次新建会让缓存失效 | 「渲染函数外」指 setup 顶层还是模块顶层；放模块顶层时多个面板实例共享一个 `Path2D` 会不会有问题（文档没说） | 写在任何地方都只创建一次且互不影响 |
| `docs/advanced/ii/ui/text.md` | 「字体」 | 知道 `Font` 构造是位置参数、`Font.defaults()` / `Font.clone` / `Font.setDefaults` | `addFallback` 是静态方法还是实例方法（没有任何代码）；默认字体五项各自类型；`Font` 与 `Text` 一起从 `@motajs/render` 导入是否够 | 能写出 `font.addFallback('宋体')` |
| `docs/advanced/ii/ui/text.md` | 「尺寸与居中」 | 知道 `width` / `height` 不给裁剪、下次测量会覆盖 | 那 `loc` 里写高度有什么意义；只讲了 `anchorX` 右对齐，纵向靠底怎么对齐；颜色会不会从父容器继承（父容器设了 `fillStyle`，子 `<text>` 不写是不是白） | `loc` 能固定文字框，颜色会继承 |
| `docs/advanced/ii/ui/image-and-texture.md` | 「加载一张 PNG」 | 知道 `Texture` 接 `HTMLImageElement`、要等 `onload`、用 `null` 表示还没加载 | `/assets/icons/potion.png` 在我项目里指向哪里、打包时怎么处理；`getImageByAlias` 返回的 `ITexture \| null` 和 `new Texture(...)` 是不是同一个类型，能不能直接传给 `image` | 抄这段就能显示我自己的图标 |
| `docs/advanced/ii/ui/image-and-texture.md` | 「像素图与高清缓存」 | 知道 `noanti` 是主开关、`hd` 只对开缓存的元素有效 | 开了 `cache` 之后 `hd` 的默认值是什么、我什么时候该显式写 `hd={false}` | 只写 `noanti` 就够，`hd` 可以不管 |
| `docs/advanced/ii/ui/layer-transform-performance.md` | 「变换：scale、rotate 与 alpha」 | 知道 `scale` 必须数组、`rotate` 用弧度、锚点是变换中心 | `filter` / `composite` 只写「再查对应取值」，没有列表也没有链接，我不知道模糊、灰度该写什么字符串；父级 `nocache` 时父级 `alpha` 怎么作用 | 能直接写 `filter="blur(4px)"` 并生效 |
| `docs/advanced/ii/ui/layer-transform-performance.md` | 「缓存与脏更新」 | 知道默认缓存/不缓存清单、`nocache` 优先 | 旋转后的缓存按什么分辨率生成、会不会糊（只说 `hd` 管高清）；缓存与 `alpha` 同时用时是先缓存再整体乘 alpha 吗 | 旋转 + 缓存的画面和直接画一样清晰 |
| `docs/advanced/ii/ui/reactivity.md` | 「响应式作为界面零件」 | 知道状态归属跟着「共同读取者」走 | 283 行写「用 `v-model:open` 或 `:open` + `@toggle` 传下去」，这是模板写法；在 TSX 里这两种到底长什么样（`v-model:open={open.value}`？），本篇没给例子 | 照这行字能写出双向绑定的开关 |
| `docs/advanced/ii/ui/reactivity.md` | 「ref：带 value 的盒子」 | 知道 TSX 里必须写 `.value`、`ref` 包对象也是深层响应 | 事件回调里改 `count.value` 触发重渲染是同步还是微任务（后面讲了合并，但「点一下按钮文字什么时候变」没有直接说） | 改完下一帧就变 |
| `docs/advanced/ii/ui/events.md` | 「事件对象」 | 知道 `target` 是「当前正在处理事件的元素」，不是最初命中的元素 | 那我判断「点到了谁」到底看什么字段；有没有 `currentTarget`；为什么要这样设计（和常见的 DOM 经验冲突，而我没有 DOM 经验反而更没法校准） | 父级 `onClick` 里 `ev.target` 是父容器 |
| `docs/advanced/ii/ui/events.md` | 「事件名：on 加事件名」表 | 知道 `onClick` / `onDown` / `onUp` / `onMove` / `onEnter` / `onLeave` / `onWheel` | 右键、双击、长按有没有事件名；`touch` 字段有了，但没有触摸专用事件名 | 右键菜单能用某个 `onXxx` 接 |
| `docs/advanced/ii/ui/events.md` | 「enter 与 leave」 | 知道由根节点比较悬停集合、先 leave 后 enter | 「每次指针移动」与「每帧比较」两种说法同时出现（`container-and-coordinates` 说每帧、这里说每次移动），快速划过时到底触发几次 | 同一帧内划过一个元素一定会触发 enter/leave |
| `docs/advanced/ii/ui/hotkey-in-ui.md` | 「useKey」与「注册新指令」 | 知道 `useKey` 在 setup 同步调用、作用域随卸载离开、`implement` 覆盖并告警 | `props.state.hotkey` 与 `props.state.hotkey.system` 是什么关系：`addCommand` 在 `system` 上、`setGroup` 在 `hotkey` 上，我要在哪存住 `system`；`KeyCode` 与 `HotkeyEmitMode` 都从 `@motajs/system` 导入吗 | 两处能混着写，`state.hotkey` 就是 system |
| `docs/advanced/ii/ui/hotkey-in-ui.md` | 「方向键移动选中项」 | 知道用 `ref` 存选中、画面由响应式更新 | 如果列表换成第 16 篇的内置 `List`（选中在组件内部），这个例子还成立吗 | 改 `selected.value` 就能让列表换行高亮 |
| `docs/advanced/ii/ui/conditional-and-list-rendering.md` | 「循环：用 map 生成元素」 | 知道 `.map()` 放父容器里、返回数组成为子元素、无状态定长不用 `key` | 数组里能不能混 `null`（条件项）；`{cond && <X/>}` 这种写法在这里等价于什么 | 列表里某些项 `return null` 会被跳过 |
| `docs/advanced/ii/ui/conditional-and-list-rendering.md` | 「数据怎么变才会更新列表」表 | 知道 `ref` 数组深层响应、`shallowRef` 只认整体替换、`reactive` 不能整体替换 | 表里没有「改数组某一项的字段」这一行（`items.value[i].count -= 1`），而这种写法在第 24 篇用到了 | 改内部字段不会触发更新 |
| `docs/advanced/ii/ui/props.md` | 「props 的完整管线」 | 知道四环、数组漏写落到 attrs、默认值用 `??` | 布尔 prop 怎么写：`<ItemCell selected />` 算不算 `true`；props 数组只有字符串没有类型，数字属性传进去会不会变字符串 | 不写值的属性就是 `true` |
| `docs/advanced/ii/ui/props.md` | 「泛型顺序」 | 知道 Props / Emits / 事件名联合 / Slots 四位，第二第三要配套 | 只写 Props 时 `emit` 是「没有约束」还是报错；`satisfies SetupComponentOptions<Props>` 省略后两个泛型在示例里是合法的，我加 `emits` 时会不会类型错位 | 少写泛型也能跑，只是少了类型检查 |
| `docs/advanced/ii/ui/component-tsx.md` | 「组件如何映射成一棵子树」 | 知道组件不产生节点、根元素是挂载点、多根成为同一父级的多个子元素 | 多根组件被父级当作一个子元素使用时，父级怎么给它一个 `loc`（第 23 篇 `ItemGrid` 返回行数组，行自带坐标；如果父级只想整体摆它呢） | 多根组件能像单个元素一样被父级定位 |
| `docs/advanced/ii/ui/component-tsx.md` | 「生命周期与渲染树」 | 知道创建/挂载/更新/卸载四段，两个钩子必须同步调用 | 有没有 `onUpdated` / `onBeforeUnmount`；更新阶段能不能拿到「这次 patch 了什么」 | 只有 `onMounted` / `onUnmounted` 两个钩子可用 |
| `docs/advanced/ii/ui/slots-and-attrs.md` | 「slot 解决什么问题」 | 知道 TSX 里 slot 是函数、`?.()` 不能省、具名用对象、作用域 slot 靠 `SlotsType` 对齐 | 用 `SetupComponentOptions` 时第四个泛型与 `slots` 字段怎么写：本篇两个完整例子都用手写 `PanelOptions`，而 12/13 篇又说新组件优先用 `SetupComponentOptions` | 把 `SlotsType` 塞进 `SetupComponentOptions` 第四个泛型就能编译 |
| `docs/advanced/ii/ui/slots-and-attrs.md` | 「attrs：没声明的属性」 | 知道 `inheritAttrs: false` + `{...attrs}`、属性名不改大小写、数组属性按值比较 | `attrs` 里带 `onClick` 展开到 `<text>` 时的绑定时机与内部同名监听冲突时谁生效（只说「注意不要重复」） | 透传的事件会绑上且不会重复 |
| `docs/advanced/ii/ui/builtin-text-and-input.md` | 「TextContent」 | 知道 `width` 必填、`interval` 毫秒、三个事件三个方法、根是 `custom` | 完整属性表在哪：`lineHeight` 只出现过一次（示例写 `lineHeight={4}`），是行距还是行高；`fill` / `fillStyle` 在文本组件上是否与图形语义一致 | `lineHeight={4}` 是行距 4 像素 |
| `docs/advanced/ii/ui/builtin-text-and-input.md` | 「Input」与「InputBox」 | 知道 `v-model:value`、失焦移除真实输入框、取消返回空串、`getInputNumber` 对空串得 `NaN` | `multiline` 的高度怎么定（没有例子）；`loc` 六元组里为什么写 `void 0` 而不是省略；`getInput` 的 `width` 与 `loc` 的宽度谁生效 | 多行输入框会按内容长高 |
| `docs/advanced/ii/ui/builtin-list-and-containers.md` | 「List」 | 知道行结构、内部选中值、点击后发 `update:selected`、父级初值要等于第一项 | 「挂载之后再改 `selected` 绑定，不会让列表改选另一行」——那我要用方向键换选中、删除当前项后选下一项，该怎么驱动列表？全文没给办法 | 改父级 `selected` 就能换高亮（与 `Page` 的行为相反） |
| `docs/advanced/ii/ui/builtin-list-and-containers.md` | 「Scroll」 | 知道总长度取直接子元素最大底边、`scrollTo` 用像素、`padEnd` 补尾 | 子元素宽度写多少：示例视口 220、子元素 200，横向会不会出滚动条；`hor` 没有任何例子 | 写 200 宽的子元素在 220 视口里不会横向滚动 |
| `docs/advanced/ii/ui/ui-controller-and-stack.md` | 「控制器、实例与栈」 | 知道四层职责、`zIndex = i * 5`、背景固定在 0、`hide/show` 不卸载、`active`/`showBack` 要 `.value` | `keep()` / `unload()` / `safelyUnload()` 在本篇完全没有；它们第一次出现在第 18/19 篇的「关一个、开一个不闪背景」，我回头找不到定义 | 这篇能查到切面板不闪背景该怎么写 |
| `docs/advanced/ii/ui/ui-controller-and-stack.md` | 「背景的四个名字」 | 知道 `showBack` 是合成结果、`setBackground` 产生 `alwaysShow` 背景实例 | `hide(instance)` 隐藏最后一个面板后，`active` 会不会变假、背景还在不在；`keep` 期间这三个值分别是什么 | 隐藏最后一个面板就等于没开 UI |
| `docs/advanced/ii/ui/replace-builtin-ui.md` | 「替换步骤」第二步代码 | 知道替换只有打开处与包装层两个点、入口函数影响所有调用方 | 这里的 `MySettingsProps extends IGameUIPropsBase` 没有 `DefaultProps`，而第 1 篇说「只能用 `IGameUIPropsBase` 配 `DefaultProps`」；少了 `DefaultProps` 会丢什么，我不知道该按哪个 | 照抄这段，组件既能关闭又不会丢通用属性 |
| `docs/advanced/ii/ui/replace-builtin-ui.md` | 「做法一」代码块 | 知道要保留 `openSettings(controller, loc)` 的签名 | `IUIController<IGameUIPropsBase>` 从哪 import、泛型参数写什么；和我自己 `props.controller` 的类型是不是一致 | 抄这个签名就能通过类型检查 |
| `docs/advanced/ii/ui/ui-performance.md` | 「症状与排查」表 | 知道六个层次、先做减法、`hidden` 的子树仍占内存 | 「切页闪烁 → 用 `keep` 包住切换」里的 `keep` 仍然没有解释；`keep` 是控制器方法、还是返回一个对象 | 能照这一行写出不闪的切换 |
| `docs/advanced/ii/ui/ui-performance.md` | 「基础 props」 | 知道 `setPropsBaseCreator` 与 `createPropsBase` 的分工、creator 每次渲染都调用 | 我调用 `setPropsBaseCreator` 会不会覆盖客户端创建时设好的那个（第 17 篇说游戏设过），默认 creator 长什么样、要不要手动合并 | 只要把 `state` 带回就不影响原行为 |
| `docs/advanced/ii/ui/inventory-example-1-skeleton.md` | 「骨架在渲染树里的位置」 | 知道 720×480 逻辑尺寸、三个区域坐标、不会为窗口写几套 | 720×480 与第 2 篇说的「画布设计尺寸」是不是一回事；如果客户端画布只有 480×320，这块面板是会被缩放、裁掉还是居中 | 打开后正好铺满可见区域 |
| `docs/advanced/ii/ui/inventory-example-1-skeleton.md` | 「组件与文件怎么分」表 | 知道五个文件的职责与最终 props、只有 `InventoryPanel` 被 `GameUI` 注册 | 表里 `ItemGrid` 的 props 有 `onSelect`、`ActionBar` 有「三个回调」，但这些在接口里写成 `emits`；我该按表里的回调名写 props，还是按 `emits` 写 | 表里的 props 名可以直接照抄 |
| `docs/advanced/ii/ui/inventory-example-2-grid.md` | 「ItemGrid：按行列排列」 | 知道列宽/间距公式、`key=item.id`、点击三层上报 | `ItemGrid` 根容器写死 `[0,0,400,280]`，但正文说「网格跟着左侧区域走」；左侧区域尺寸变了要改哪里（props 里没有尺寸） | 只改外层容器尺寸，网格就自适应 |
| `docs/advanced/ii/ui/inventory-example-2-grid.md` | 「数据如何进入网格」 | 知道 `items` 由面板持有、传 `items.value`、派生只在面板做一次 | `props.items` 里某一项的 `count` 变化时，`ItemGrid` 会不会重算（数组引用没变，只有内部字段变） | 数量变化会让格子文字更新 |
| `docs/advanced/ii/ui/inventory-example-3-detail.md` | 「详情区的树结构」 | 知道四块区域、`hidden` 双块、`TextContent` 的 `width` 必填 | 描述区放不下时「在详情内部再套一个 `Scroll`」只有一句，`Scroll` 的 `loc` 与内部 `TextContent` 的 `width` 怎么配合没有例子 | 加一个 `Scroll` 就能滚长描述 |
| `docs/advanced/ii/ui/inventory-example-3-detail.md` | 「空态与边界」 | 知道三种空情况、删除道具时要同时清 `selectedId` | 删除入口本身在示例里没出现（第 20–25 篇没有真正删道具的按钮），我不知道该在哪一步加、加了之后网格和详情会怎么连锁更新 | 照这段文字就能实现删除 |
| `docs/advanced/ii/ui/inventory-example-4-scroll.md` | 「item-grid.tsx：根节点从单个 container 改成行容器数组」 | 知道组件可以返回行数组、行 `key` 用行号、格子 `key` 用 `item.id` | 行的宽度写死 362，视口 372；换列数或格子尺寸时这 362 要不要跟着算（文档只在示例（二）算过一次总宽） | 改 `columns` 后行宽会自动跟着变 |
| `docs/advanced/ii/ui/inventory-example-4-scroll.md` | 「滚动与事件」 | 知道捕获阶段补滚动偏移、拖动超过阈值才算拖动、可点元素要避开右侧滚动条 | 阈值是多少；拖动结束时如果位移刚好回到起点，会不会同时触发格子的 `onClick` | 拖动时不会误触选中 |
| `docs/advanced/ii/ui/inventory-example-5-state.md` | 「状态放在 InventoryPanel」 | 知道 `equippedId` 是单个 id、`canUse` 是派生值、`watch` 只做副作用 | `watch(() => selectedItem.value?.count ?? 0)` 在切换道具时也会触发（文档承认）；「改成 `selectedId` 加 `count` 的组合」没有代码，我不知道怎么写 | 照写的 watch 只在数量变化时提示 |
| `docs/advanced/ii/ui/inventory-example-5-state.md` | 「键盘收口」 | 知道 `useKey` 在 setup、三条关闭路径最终都走 `close(props.instance)` | 示例面板里 `const key = useKey(...)` 写在 `defineComponent` 的 setup 里，但文档没说这和 `key.implement` 重复调用、以及和 `props.state.hotkey` 取 system 是否要缓存 | 重复调用 `useKey` 不会出问题 |
| `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` | 「动画作用在树的哪一层」 | 知道 `raf` + `onUnmounted` 停止、只改 `alpha`、动画节点加 `noevent`、不要进子组件 props 链 | 这段代码是片段，`pulse` / `hintAlpha` / `lastHintAt` 的声明位置没有；`watch(hint, ...)` 依赖第 24 篇的 `hint`，我不知道放同一个 setup 里会不会重复 | 抄两段就能动起来 |
| `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` | 「最终组装的骨架」 | 知道契约表九条、九条里第 6 条给了左侧/右侧/操作条的布局坐标，并说「以本表为准」 | 我照这段写：外层已经是 `container loc={[30,30,660,420]}`，里面又放了 `loc={[30,30,660,420]}` 的呼吸描边和 `loc={[54,52]}` 的标题；按局部坐标它们会再偏移一次，我不知道标题最终在 `(54,52)` 还是 `(84,82)` | 标题在 `(54,52)`，描边与面板主体重合 |
| `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` | 「注册与打开」 | 知道 `GameUI` 是对象、`index.ts` 统一导出、不要按名字查 | 这里又写「用 `props.controller.keep()` 包住切换，用完调用 `safelyUnload()`」——这是第三次出现，我仍没找到它的定义与返回值 | 能在第 17 篇查到 `keep` 的用法 |

#### D-93 复述检查

**渲染树模型**

- 能复述：画布根 → UI 容器（控制器负责）→ 面板根容器 → 区域容器 → 元素；面板根上方还有 UI 容器，面板之间靠栈顺序递增 `zIndex`，面板内部 `zIndex` 只管兄弟；子元素坐标相对父容器左上角，父级的平移/缩放/旋转复合到整棵子树，锚点同时是变换中心；绘制按 `zIndex` 从小到大、命中从大到小，同值按插入顺序（但见跨篇第 1 条）；`hidden` 不绘制不命中但保留实例与状态，三元销毁并重置；容器默认缓存、文字/图片/图形默认不缓存，属性变化把脏标记沿父链上传，`custom` 自绘要自己触发更新；`close` 卸载、`hide` 只切换可见性。
- 不能复述：默认 `zIndex` 是多少；`alpha=0` 的元素是否仍参与绘制/命中；缓存与 `alpha`/`rotate` 叠加时离屏画布的分辨率；`filter` / `composite` 的可用取值；`hidden` 子树里发生的按键作用域是否仍在（这条在 10/17 篇有答案，但和「隐藏的子树不参与命中」放在一起时我要想很久才能分开）；多根组件被父级定位的规则。
- 缺什么：一份「元素默认值总表」（尺寸、锚点、颜色、`zIndex`、是否缓存），让我不用在五篇里拼。

**事件模型**

- 能复述：从画布根按 `zIndex` 从大到小找第一个命中元素，命中即停、同级其它元素不参与；捕获从根向内（父先收到 `onClickCapture`），冒泡从命中元素向外（子先收到 `onClick`）；`stopPropagation` 只在当前阶段截断传播、不影响同一元素上的其它监听器，也不阻止默认行为；`onClick` 需要按下与抬起都发生在同一元素，`onUp` 先于 `onClick`；`enter` / `leave` 由根节点比较前后悬停集合触发，先 leave 后 enter，父容器不会因为指针移进子元素而 leave；`noevent` 整个子树跳过命中但仍绘制，`hidden` 连绘制一起跳过；`actionStroke` 只按描边命中、宽度等于 `lineWidth`；`offsetX/Y` 是当前元素局部坐标（会做变换逆运算），`absoluteX/Y` 是画布坐标；事件对象有 `type`（本次触发的键）与 `buttons`（当前按住的键），点击判断用 `type`。
- 不能复述：`target` 为什么等于「当前处理事件的元素」、这和我原先对「事件目标」的理解怎么对应；有没有右键/双击/长按事件；`cursor` 除了 `pointer`/`text`/`default` 还有哪些值；拖动内建在 `Scroll` 里的阈值；`onEnter`/`onLeave` 在快速移动/一帧多次移动时的触发次数。
- 缺什么：一张「事件名 → 触发条件 → 有没有捕获版」的完整表；以及 `target` / `offset` 在嵌套与变换下的一个总例子。

**组件**

- 能复述：组件不产生额外节点，根元素才是挂载点，多根就是多个兄弟；props 走「父写属性 → VNode props → 子组件 props 数组 → setup 的 props」四环，没声明的进 `attrs`，默认 `inheritAttrs` 展开到根元素；`emits` 声明后 `onXxx` 不再透传、必须 `emit`；默认值用 `??`、props 不解构；拆组件的依据是复用/状态隔离/渲染范围/数据边界；普通组件只需 `DefaultProps`，UI 还要 `IGameUIPropsBase` 且 props 数组至少含三项三个键；`expose` 只暴露必要方法，父级用 `ref` 在挂载后拿到；内置组件里 `TextContent` / `Textbox` / `Input` / `List` / `ListPage` / `Page` / `Scroll` / `Selection` / `ConfirmBox` / `Choices` 各自的最小用法与 `width` 必填、`Scroll` 只认直接子元素。
- 不能复述：布尔 prop 怎么声明才能用裸属性；用 `SetupComponentOptions` 写 slot（第四个泛型 + `slots` 字段）的完整写法；`List` 的内部选中如何被外部驱动；`keep` / `unload` / `safelyUnload` 的语义与返回值；`props.loc` 是控制器注入还是某个入口函数自己加的参数；`ITexture` 与 `Texture` 的关系；`Font.addFallback` 的调用形式。
- 缺什么：一份「组件属性默认值 / 必填项」的索引，尤其内置组件；以及一份「控制器额外注入的 props 有哪些」的清单。

#### 跨篇问题

只有连续读完全部 25 篇才会遇到的读者困惑。下面每一条都是「我在 A 篇以为是 X，在 B 篇看到 Y，不知道按哪个做」。

1. **同 `zIndex` 时谁在上。** 第 2 篇说「后绘制的先接事件」，第 7、9 篇明确写「同值时后加入的在上层」，第 21 篇的网格直接靠「每格不重叠」绕开它；但第 3 篇说「`zIndex` 相同时按插入顺序，后插入的与先插入的谁在上并不由图形自己决定，需要稳定层叠时显式给 `zIndex`」。我读第 3 篇时以为插入顺序不可依赖，读第 7 篇时又以为可以依赖。最终我不知道该不该在每次 `.map()` 之后显式给 `zIndex`。
2. **`zIndex` 默认值从头到尾没有给。** 第 2 篇第一次讲层级就要求我判断遮挡；第 25 篇又说「遮罩放在第一个子节点、面板主体之前，`zIndex` 不需要额外设置」。我读第 25 篇时默认所有元素 `zIndex` 都是 0，但我从来没有在文档里读到这个数，只能从例子里反推。
3. **布尔属性怎么写，前后两套。** 第 2–7、15 篇大量使用裸属性（`fill`、`stroke`、`cache`、`autoHeight`、`noevent`）；第 12、13 篇讲 props 时只说「props 数组写键名字符串」，没有一处说布尔 prop 怎么声明才能让裸属性等于 `true`，也没有说数字属性传进去会不会变字符串。我读前面时以为属性写不写值都行，读 props 篇时又怀疑组件上的裸属性是不是根本没生效。
4. **`keep` 一直在被推荐，却从没被介绍。** 第 18 篇「替换步骤」第四步、第 19 篇症状表与「UI 栈」、第 25 篇「注册与打开」都要求「用 `keep` 包住切换，用完调用 `safelyUnload()` / `unload()`」；但专门讲栈的第 17 篇里没有这三个名字。我按第 17 篇做切换时不会闪，读到后面又被告知要 `keep`，却找不到它挂在哪、返回什么。
5. **`List` 的选中是内部的，和我学到的一切相反。** 第 12、13 篇反复讲「父组件持有状态、子组件只读 props」，第 10 篇的方向键例子用 `ref` 存选中，第 21–25 篇的背包也用父级 `selectedId` 驱动高亮；但第 16 篇说 `List`「挂载之后再改 `selected` 绑定，不会让列表改选另一行」，要用户点击才动。我在第 16 篇之前以为所有组件都能被父级数据驱动。
6. **UI 的 Props 基类到底几件套。** 第 1 篇说「Props 基类只能用 `IGameUIPropsBase` 配 `DefaultProps`」，第 13 篇把这句话写成判定 UI 的三个条件之一；但第 18 篇给出的替换示例 `interface MySettingsProps extends IGameUIPropsBase` 只有前者，还多了一个 `loc: ElementLocator`。我读第 1 篇时以为是硬性要求，读第 18 篇时又以为 `DefaultProps` 可省。
7. **slot 的「标准写法」只在手写选项里出现。** 第 14 篇两次示范 slot，都用自己手写的 `PanelOptions`（`props: (keyof PanelProps)[]`），并在旁边说「新组件优先用 `SetupComponentOptions`」；第 12、13 篇把 `SetupComponentOptions` 当作唯一推荐，第四个泛型只提了一句 `SlotsType<...>`。我读第 12 篇时以为有第四个泛型就够了，读第 14 篇时发现所有能跑的 slot 例子都绕开了它。
8. **默认颜色/样式会不会继承，没有一处说。** 第 3 篇说图形默认色 `#ddd`，第 5 篇说文字默认白；第 12 篇的槽位底板示例给 `g-rectr` 写了 `fillStyle`，但第 2 篇的父容器也写过 `fillStyle`。我读第 5 篇时以为子元素会继承父容器颜色（因为父容器能设 `fillStyle`），读第 3 篇时又以为每个元素各用各的默认值。到底要不要给每个 `text` 都写 `fillStyle`，我无法确定。
9. **图片素材从哪来，文档把我推回编辑器。** 第 6 篇说「加载与解码由你或素材管理器完成」，给了 `loadTexture('/assets/icons/potion.png')` 和 `props.state.materials.getImageByAlias('potion-red')`；但 `advanced/ii/index.md` 明确说编辑器相关内容不在本层，素材别名「由编辑器维护」。我读第 6 篇时以为两种路子都能走，读导览时发现其中一条被划到本层之外。
10. **`Texture` 与 `ITexture` 是不是同一个东西。** 第 6 篇先 `new Texture(canvas)` 传给 `image image={...}`，后面又说 `getImageByAlias` 返回 `ITexture \| null`、取到后「用法与上一节完全一样」。我读前半段时把 `image` 的属性类型理解成 `Texture`，读后半段时又怀疑它接受的是 `ITexture`，两者能不能互换没有一句说明。
11. **面板会出现在屏幕哪里，三篇三种说法。** 第 1 篇说面板根 `[0,0]` 相对 UI 容器、窗口缩放不影响设计坐标；第 2 篇说画布比面板大就占左上角一块、要居中得自己用 `renderer.width` 算；第 20 篇直接给 720×480 并说「UI 被缩放显示时会按逻辑坐标整体变换」。我读第 2 篇时准备自己写居中，读第 20 篇时又以为不用管。
12. **「透明热区」的写法在四篇里被推荐，却没有一篇给写法。** 第 3 篇说细边框可以「在边框下面垫一个透明的填充矩形专门接收点击」，第 7、9、19 篇说遮罩要能挡点击就给一块「铺满的、明确接收事件的背景」，第 25 篇的遮罩又用 `alpha={0.35}` + `noevent`。我读第 3 篇时以为存在一个「透明但命中」的固定写法，读第 25 篇时又以为透明元素本来就会挡住点击。`alpha=0` 到底命中不命中，我到最后也没有依据。
13. **按键系统的两个对象没对齐。** 第 10 篇里 `addCommand` / `deleteCommand` 在 `props.state.hotkey.system` 上，`setGroup` 在 `props.state.hotkey` 上；第 16 篇又出现过 `props.state.hotkey.system` 被直接 `useKey(...)`。我读第 10 篇时把 `hotkey` 当成 system 的容器，读第 24 篇时发现两处都能取，但不知道哪个才是「系统」。
14. **最终组装与骨架的坐标对不上。** 第 20 篇骨架的标题是 `[54, 52]`、面板主体 `[30,30,660,420]`，全部相对根容器；第 25 篇的最终组装先套了一层 `container loc={[30,30,660,420]}`，里面又出现 `loc={[30,30,660,420]}` 的呼吸描边与 `loc={[54,52]}` 的标题，同时还说「以本表为准、前面坐标若不同按这里替换」。我读第 20 篇时已经记住了标题在 `(54,52)`，读第 25 篇时无法判断这层容器到底是「面板主体」还是「根容器」。
15. **UI 的 `loc` 是注入的还是入口函数自己传的。** 第 1、20 篇的 UI 组件根容器写死数字 `loc`，props 数组只有三项三个键；第 17 篇「打开与关闭的完整例子」与第 18 篇的替换示例里，组件写 `loc={props.loc}`，由 `openSettings(controller, loc)` 传进来，props 数组里也多了 `loc`。我读第 1 篇时以为 UI 的位置由自己写死，读第 17 篇时以为位置一律由打开方给。
16. **「打开处」是我自己工程的哪个文件。** 第 1 篇给了三个打开入口并说「第一次验证模板时先用场景控制器」，第 20 篇说「从示例（六）开始统一用主 UI 栈」；但整组文档都没有说主入口文件叫什么、`props` 在组件外从哪来。我读第 1 篇时以为打开代码写在面板文件里，读到第 20 篇时才意识到它必须在别的地方，却仍然不知道在哪。

#### 第 2 轮分诊

| 编号 | 篇目/章节 | 问题摘要 | 是否阻断 | 理由 | 处理 |
| --- | --- | --- | --- | --- | --- |
| R2-01 | `docs/advanced/ii/ui/ui-template.md`「一个最小 UI」 | import 来自哪些包、TSX 如何编译、新文件如何进入工程 | 是 | 缺前置：照抄无法确定文件接入方式 | 修 |
| R2-02 | `docs/advanced/ii/ui/ui-template.md`「打开与关闭」 | open 写在哪个文件、组件外的 props 从哪来 | 是 | 缺入口：核心流程断点 | 修 |
| R2-03 | `docs/advanced/ii/ui/ui-template.md`「三个基础 props」 | 基类字段、state 成员、能否加自定义键 | 否 | 接口索引属额外深度，不影响继续 | 不修 |
| R2-04 | `docs/advanced/ii/ui/container-and-coordinates.md`「loc 与锚点」 | `zIndex` 默认值、首次挂载的当前尺寸 | 是 | 术语默认值未给，且与同值顺序矛盾（跨篇 1/2） | 修 |
| R2-05 | `docs/advanced/ii/ui/container-and-coordinates.md`「坐标基准与画布」 | 画布设计尺寸具体值、面板根落点 | 是 | 缺前置 + 跨篇三种说法（跨篇 11） | 修 |
| R2-06 | `docs/advanced/ii/ui/basic-shapes.md`「填充、描边与命中」 | 透明热区的具体写法、`alpha=0` 是否命中 | 是 | 缺写法：推荐了做法没给语法（跨篇 12） | 修 |
| R2-07 | `docs/advanced/ii/ui/basic-shapes.md`「图形作为界面零件」 | `g-rectr` 圆角写法、按钮底与文字命中 | 否 | 额外深度，可用简化写法继续 | 不修 |
| R2-08 | `docs/advanced/ii/ui/curves-and-paths.md`「坐标基准」 | 贝塞尔与 path 两种基准如何分辨 | 否 | 设计取舍与组织方式 | 不修 |
| R2-09 | `docs/advanced/ii/ui/curves-and-paths.md`「路径」 | `Path2D` 放 setup 还是模块顶层、能否共享 | 否 | 实现细节，两种写法都可继续 | 不修 |
| R2-10 | `docs/advanced/ii/ui/text.md`「字体」 | `addFallback` 静态还是实例、默认字体字段 | 否 | 可选 API 的补充说明 | 不修 |
| R2-11 | `docs/advanced/ii/ui/text.md`「尺寸与居中」 | `loc` 高度的意义、纵向对齐、颜色继承 | 否 | 前两项额外深度；颜色继承由跨篇 8 单独修 | 不修 |
| R2-12 | `docs/advanced/ii/ui/image-and-texture.md`「加载一张 PNG」 | 素材路径与打包、`ITexture` 与 `Texture` 关系 | 否 | 文档已给两条路径与返回类型；打包属项目范围 | 不修 |
| R2-13 | `docs/advanced/ii/ui/image-and-texture.md`「像素图与高清缓存」 | 开缓存后 `hd` 默认值 | 否 | 额外深度 | 不修 |
| R2-14 | `docs/advanced/ii/ui/layer-transform-performance.md`「变换」 | `filter` / `composite` 的可用取值 | 否 | 文档已明确指向 canvas 对应取值 | 不修 |
| R2-15 | `docs/advanced/ii/ui/layer-transform-performance.md`「缓存与脏更新」 | 旋转缓存分辨率、缓存与 alpha 顺序 | 否 | 实现细节 | 不修 |
| R2-16 | `docs/advanced/ii/ui/reactivity.md`「响应式作为界面零件」 | TSX 里双向绑定到底怎么写 | 是 | 步骤缺失：照字面写不出 | 修 |
| R2-17 | `docs/advanced/ii/ui/reactivity.md`「ref：带 value 的盒子」 | 更新是同步还是微任务 | 否 | 额外深度 | 不修 |
| R2-18 | `docs/advanced/ii/ui/events.md`「事件对象」 | `target` 为当前元素时如何判断点到谁 | 否 | 模型已讲清，处理器可挂在具体元素上 | 不修 |
| R2-19 | `docs/advanced/ii/ui/events.md`「事件名」表 | 右键、双击、长按事件名 | 否 | 额外 API，不影响主流程 | 不修 |
| R2-20 | `docs/advanced/ii/ui/events.md`「enter 与 leave」 | 「每帧」与「每次指针移动」矛盾 | 是 | 明确矛盾 | 修 |
| R2-21 | `docs/advanced/ii/ui/hotkey-in-ui.md`「注册新指令」 | `hotkey` 与 `hotkey.system` 的关系与导入 | 是 | 术语未定义：核心对象未说明（跨篇 13） | 修 |
| R2-22 | `docs/advanced/ii/ui/hotkey-in-ui.md`「方向键移动选中项」 | 与内置 `List` 的选中如何配合 | 否 | 跨篇延伸，不影响本篇示例 | 不修 |
| R2-23 | `docs/advanced/ii/ui/conditional-and-list-rendering.md`「循环」 | 数组能否混 `null`、`cond && <X/>` 的含义 | 否 | 可由现有例子推断 | 不修 |
| R2-24 | `docs/advanced/ii/ui/conditional-and-list-rendering.md`「数据怎么变」表 | 缺「改数组某一项字段」一行 | 否 | `ref` 数组深层响应已覆盖该语义 | 不修 |
| R2-25 | `docs/advanced/ii/ui/props.md`「props 的完整管线」 | 布尔裸属性、数字是否变字符串 | 是 | 缺写法：布尔 prop 无法正确传（跨篇 3） | 修 |
| R2-26 | `docs/advanced/ii/ui/props.md`「泛型顺序」 | 省略泛型时的类型行为 | 否 | 类型层细节 | 不修 |
| R2-27 | `docs/advanced/ii/ui/component-tsx.md`「组件映射成子树」 | 多根组件如何被父级整体定位 | 否 | 设计取舍 | 不修 |
| R2-28 | `docs/advanced/ii/ui/component-tsx.md`「生命周期」 | 是否还有其它生命周期钩子 | 否 | 额外 API | 不修 |
| R2-29 | `docs/advanced/ii/ui/slots-and-attrs.md`「slot 解决什么问题」 | `SetupComponentOptions` 第四泛型与 `slots` 字段写法 | 否 | 手写 `PanelOptions` 的完整例子可照抄 | 不修 |
| R2-30 | `docs/advanced/ii/ui/slots-and-attrs.md`「attrs」 | 透传 `onClick` 与内部同名监听谁生效 | 否 | 边界情况 | 不修 |
| R2-31 | `docs/advanced/ii/ui/builtin-text-and-input.md`「TextContent」 | `lineHeight` 是行距还是行高 | 是 | 术语未定义，示例正在使用 | 修 |
| R2-32 | `docs/advanced/ii/ui/builtin-text-and-input.md`「Input」 | `multiline` 高度、`void 0`、`getInput` 宽度 | 否 | 示例可照抄 | 不修 |
| R2-33 | `docs/advanced/ii/ui/builtin-list-and-containers.md`「List」 | 外部如何驱动 `List` 的选中 | 否 | 文档明确的组件限制（设计取舍） | 不修 |
| R2-34 | `docs/advanced/ii/ui/builtin-list-and-containers.md`「Scroll」 | 子元素宽度与横向滚动、`hor` 例子 | 否 | 额外深度 | 不修 |
| R2-35 | `docs/advanced/ii/ui/ui-controller-and-stack.md`「控制器、实例与栈」 | `keep` / `unload` / `safelyUnload` 无定义 | 是 | 缺前置：后续三篇都在用（跨篇 4） | 修 |
| R2-36 | `docs/advanced/ii/ui/ui-controller-and-stack.md`「背景的四个名字」 | `hide` 最后一个面板后的 `active` 与背景 | 否 | 语义细节，可避开 | 不修 |
| R2-37 | `docs/advanced/ii/ui/replace-builtin-ui.md`「替换步骤」 | 示例未并 `DefaultProps`，与第 1 篇说法冲突 | 是 | 明确矛盾（跨篇 6） | 修 |
| R2-38 | `docs/advanced/ii/ui/replace-builtin-ui.md`「做法一」 | `IUIController` 的 import 与泛型 | 否 | 代码块已给出 import 与泛型 | 不修 |
| R2-39 | `docs/advanced/ii/ui/ui-performance.md`「症状与排查」 | `keep` 仍未解释 | 是 | 同 R2-35（跨篇 4） | 修 |
| R2-40 | `docs/advanced/ii/ui/ui-performance.md`「基础 props」 | `setPropsBaseCreator` 是否覆盖客户端设置 | 否 | 高级配置，非自定义 UI 必需 | 不修 |
| R2-41 | `docs/advanced/ii/ui/inventory-example-1-skeleton.md`「骨架在渲染树里的位置」 | 720×480 与 480×320 画布的关系 | 是 | 跨篇矛盾（跨篇 11） | 修 |
| R2-42 | `docs/advanced/ii/ui/inventory-example-1-skeleton.md`「组件与文件怎么分」 | 表里 props 与 `emits` 该按哪个写 | 是 | 明确矛盾：表与声明方式不一致 | 修 |
| R2-43 | `docs/advanced/ii/ui/inventory-example-2-grid.md`「按行列排列」 | 根容器写死尺寸、外层变化如何联动 | 否 | 维护性偏好 | 不修 |
| R2-44 | `docs/advanced/ii/ui/inventory-example-2-grid.md`「数据如何进入网格」 | 内部字段变化是否触发重算 | 否 | 第 11/24 篇已覆盖深层响应 | 不修 |
| R2-45 | `docs/advanced/ii/ui/inventory-example-3-detail.md`「详情区的树结构」 | 详情内再套 `Scroll` 的写法 | 否 | 额外深度 | 不修 |
| R2-46 | `docs/advanced/ii/ui/inventory-example-3-detail.md`「空态与边界」 | 删除入口不在示例中 | 否 | 示例范围 | 不修 |
| R2-47 | `docs/advanced/ii/ui/inventory-example-4-scroll.md`「行容器数组」 | 行宽 362 是否随列数变化 | 否 | 额外深度 | 不修 |
| R2-48 | `docs/advanced/ii/ui/inventory-example-4-scroll.md`「滚动与事件」 | 拖动阈值、回原位是否误触点击 | 否 | `Scroll` 内部实现 | 不修 |
| R2-49 | `docs/advanced/ii/ui/inventory-example-5-state.md`「状态放在 InventoryPanel」 | `selectedId` + `count` 组合没有代码 | 否 | 文档已给出组合思路，可按需实现 | 不修 |
| R2-50 | `docs/advanced/ii/ui/inventory-example-5-state.md`「键盘收口」 | 重复 `useKey` 与缓存 `system` | 否 | 与 R2-21 同根因，修 R2-21 即可 | 不修 |
| R2-51 | `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md`「动画作用在树的哪一层」 | 片段缺 `pulse` / `hintAlpha` / `lastHintAt` 声明 | 否 | 文档同一代码块已声明 | 不修 |
| R2-52 | `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md`「最终组装的骨架」 | 外层容器与内部坐标重复偏移 | 是 | 明确矛盾（跨篇 14） | 修 |
| R2-53 | `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md`「注册与打开」 | `keep` 第三次出现仍无定义 | 是 | 同 R2-35（跨篇 4） | 修 |

#### 跨篇问题分诊

| 编号 | 篇目/章节 | 问题摘要 | 是否阻断 | 理由 | 处理 |
| --- | --- | --- | --- | --- | --- |
| R2-54 | 跨篇 1：`basic-shapes` / `layer-transform-performance` / `events` | 同 `zIndex` 时谁在上，三篇说法不同 | 是 | 明确矛盾 | 修 |
| R2-55 | 跨篇 2：`container-and-coordinates` / `inventory-example-6` | `zIndex` 默认值从未给出 | 是 | 术语默认值未定义 | 修 |
| R2-56 | 跨篇 3：`props` / `component-tsx` | 布尔裸属性与数字传参前后两套说法 | 是 | 缺写法 | 修 |
| R2-57 | 跨篇 4：`ui-controller-and-stack` / `ui-performance` / `inventory-example-6` | `keep` 被反复推荐但无定义 | 是 | 缺前置 | 修 |
| R2-58 | 跨篇 5：`builtin-list-and-containers` | `List` 选中由内部持有，与父级驱动相反 | 否 | 组件限制（设计取舍） | 不修 |
| R2-59 | 跨篇 6：`ui-template` / `replace-builtin-ui` | UI Props 基类是否必须并 `DefaultProps` | 是 | 明确矛盾 | 修 |
| R2-60 | 跨篇 7：`slots-and-attrs` / `props` / `component-tsx` | slot 的推荐写法只在手写选项里出现 | 否 | 手写示例可运行 | 不修 |
| R2-61 | 跨篇 8：`text` / `basic-shapes` | 颜色与样式是否从父容器继承 | 是 | D-93 模型未讲清 | 修 |
| R2-62 | 跨篇 9：`image-and-texture` / `advanced/ii/index.md` | 素材别名与编辑器边界 | 否 | 编辑器边界，文档已说明 | 不修 |
| R2-63 | 跨篇 10：`image-and-texture` | `Texture` 与 `ITexture` 是否可互换 | 否 | 文档已给返回类型与用法 | 不修 |
| R2-64 | 跨篇 11：`ui-template` / `container-and-coordinates` / `inventory-example-1` | 面板落点三篇三种说法 | 是 | 明确矛盾 | 修 |
| R2-65 | 跨篇 12：`basic-shapes` / `layer-transform-performance` / `events` | 透明热区被推荐但无写法、`alpha=0` 是否命中 | 是 | 缺写法 | 修 |
| R2-66 | 跨篇 13：`hotkey-in-ui` | `hotkey` 与 `hotkey.system` 两个对象未对齐 | 是 | 术语未定义 | 修 |
| R2-67 | 跨篇 14：`inventory-example-6` | 最终组装与骨架坐标对不上 | 是 | 明确矛盾 | 修 |
| R2-68 | 跨篇 15：`ui-template` / `ui-controller-and-stack` / `replace-builtin-ui` | UI 的 `loc` 是注入还是打开方传入 | 是 | 缺前置 | 修 |
| R2-69 | 跨篇 16：`ui-template` / `inventory-example-1` | 打开处到底在哪个工程文件 | 是 | 缺入口 | 修 |

第 2 轮阻断数：29
第 2 轮非阻断数：40

概率继承：Round 1 的 178 行分节概率继续有效；本轮新增/重写章节需补该节概率。

状态：已汇总

以下按轮追加；历史轮次逐字保留，不得覆盖、合并或改写。

#### 第 2 轮修订

R2-01：已修 → `docs/advanced/ii/ui/ui-template.md#一个最小 UI`：补三个 import 包来源、TSX 编译与文件接入说明。
R2-02：已修 → `docs/advanced/ii/ui/ui-template.md#文件放在哪里、怎么被用到`：补 `src/bootstrap.ts` 组件外打开示例，并说明 `loc` 不是控制器注入。
R2-04：已修 → `docs/advanced/ii/ui/container-and-coordinates.md#loc 与锚点`、`docs/advanced/ii/ui/basic-shapes.md#绘制顺序`：补 `zIndex` 默认值 `0`，统一同值按插入顺序、后加入在上层且先被命中。
R2-05：已修 → `docs/advanced/ii/ui/container-and-coordinates.md#坐标基准与画布`：补示例画布 480×320 与面板根落点说明。
R2-06：已修 → `docs/advanced/ii/ui/basic-shapes.md#actionStroke`：补透明热区写法 `alpha={0}`，说明命中按几何范围、不看透明度。
R2-16：已修 → `docs/advanced/ii/ui/reactivity.md#响应式作为界面零件`：补 TSX 中 `open` + `onUpdate:open` / `onToggle` 的写法。
R2-20：已修 → `docs/advanced/ii/ui/container-and-coordinates.md#enter 与 leave`：把「每帧比较」改为「每次指针移动后比较」。
R2-21：已修 → `docs/advanced/ii/ui/hotkey-in-ui.md#注册新指令与分组`：补 `hotkey` 门面与 `hotkey.system` 的关系及导入来源。
R2-25：已修 → `docs/advanced/ii/ui/props.md#props 的完整管线`：补裸属性为 `true`、数字表达式不变字符串。
R2-31：已修 → `docs/advanced/ii/ui/builtin-text-and-input.md#TextContent`：补 `lineHeight` 是行间距（默认 0），与 `List` 的行高不同。
R2-35：已修 → `docs/advanced/ii/ui/ui-controller-and-stack.md#keep`：新增小节，给出 `keep()` / `safelyUnload()` / `unload()` 的签名与语义。
R2-37：已修 → `docs/advanced/ii/ui/replace-builtin-ui.md#替换步骤`：说明 `DefaultProps` 是类型提示的推荐写法，不是运行要求。
R2-39：已修 → 同 R2-35：第 17 篇新增 `keep` 定义，第 19 篇的引用已可达。
R2-41：已修 → `docs/advanced/ii/ui/inventory-example-1-skeleton.md#骨架在渲染树里的位置`：补 720×480 与 `renderer.width/height` 的层级关系。
R2-42：已修 → `docs/advanced/ii/ui/inventory-example-1-skeleton.md#组件与文件怎么分`：说明表中 `onSelect` / `onClear` 是父级监听器名，子组件用 `emits` 声明。
R2-52：已修 → `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md#最终组装的骨架`：外层容器改为 `[0, 0, 720, 480]`，面板底改为 `[30, 30, 660, 420]`，并补坐标基准说明。
R2-53：已修 → 同 R2-35：第 17 篇新增 `keep` 定义，第 25 篇的引用已可达。
R2-54：已修 → 同 R2-04（`basic-shapes` 同值顺序）。
R2-55：已修 → 同 R2-04（`container-and-coordinates` 默认值）。
R2-56：已修 → 同 R2-25（`props` 布尔/数字）。
R2-57：已修 → 同 R2-35（`keep` 定义）。
R2-59：已修 → 同 R2-37（`DefaultProps` 口径）。
R2-61：已修 → `docs/advanced/ii/ui/text.md#尺寸与居中`：补颜色与样式不从父容器继承。
R2-64：已修 → 同 R2-05 / R2-41（画布与面板落点）。
R2-65：已修 → 同 R2-06（透明热区写法）。
R2-66：已修 → 同 R2-21（`hotkey` 与 `system`）。
R2-67：已修 → 同 R2-52（最终组装坐标）。
R2-68：已修 → 同 R2-02（`loc` 非注入）。
R2-69：已修 → 同 R2-02（组件外打开处）。

第 2 轮修订完成：阻断 29 条，已修 29 条，未修 0 条。

### 第 3 轮

用户更正（2026-11-01）：Round 3 仍为一个读者读完全部 25 篇；读者使用新上下文，未看前两轮问题清单。

#### 读者

单读者，人格与 Round 2 相同：

> 你是一位刚读完中级教程、想给自己的魔塔做一套自定义界面的作者。你完全没写过 UI，不知道 canvas 是什么，也不会 Vue 的组件写法；你只掌握了基础 TS/JS、函数、对象、数组和一点点模板语法。你手里只有这套文档，不能看源码，也没有人可以问。你的任务不是评价文档好坏，而是老老实实按顺序读，读到哪里卡住就记下：我在哪一段卡住、我从文档里已经知道什么、我还缺什么才能继续往下做。

阅读范围（25 篇，按顺序）：

1. `docs/advanced/ii/ui/ui-template.md`
2. `docs/advanced/ii/ui/container-and-coordinates.md`
3. `docs/advanced/ii/ui/basic-shapes.md`
4. `docs/advanced/ii/ui/curves-and-paths.md`
5. `docs/advanced/ii/ui/text.md`
6. `docs/advanced/ii/ui/image-and-texture.md`
7. `docs/advanced/ii/ui/layer-transform-performance.md`
8. `docs/advanced/ii/ui/reactivity.md`
9. `docs/advanced/ii/ui/events.md`
10. `docs/advanced/ii/ui/hotkey-in-ui.md`
11. `docs/advanced/ii/ui/conditional-and-list-rendering.md`
12. `docs/advanced/ii/ui/props.md`
13. `docs/advanced/ii/ui/component-tsx.md`
14. `docs/advanced/ii/ui/slots-and-attrs.md`
15. `docs/advanced/ii/ui/builtin-text-and-input.md`
16. `docs/advanced/ii/ui/builtin-list-and-containers.md`
17. `docs/advanced/ii/ui/ui-controller-and-stack.md`
18. `docs/advanced/ii/ui/replace-builtin-ui.md`
19. `docs/advanced/ii/ui/ui-performance.md`
20. `docs/advanced/ii/ui/inventory-example-1-skeleton.md`
21. `docs/advanced/ii/ui/inventory-example-2-grid.md`
22. `docs/advanced/ii/ui/inventory-example-3-detail.md`
23. `docs/advanced/ii/ui/inventory-example-4-scroll.md`
24. `docs/advanced/ii/ui/inventory-example-5-state.md`
25. `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md`

#### 逐篇提问

| 篇目 | 位置 | 我已经从文档知道什么 | 我还缺什么 | 我照着做会预期什么 |
| --- | --- | --- | --- | --- |
| `docs/advanced/ii/ui/ui-template.md` | 「一个最小 UI」 | 四段结构：Props 类型、props 列表、组件、`GameUI`；三个包各给什么；三个注入值 | 我不知道 `satisfies` 是什么语法；也不知道「模板工程已经配置好 TSX 编译」里的模板工程在哪、拿到后用什么命令跑起来 | 我会把这段抄成一个 `.tsx`，但下一步是编译、预览还是直接放进游戏，我判断不了 |
| `docs/advanced/ii/ui/ui-template.md` | 「文件放在哪里、怎么被用到」 | 文件放 `src/client/ui/<name>.tsx`，加入 `index.ts` 统一出口；没有目录扫描 | `@motajs/system`、`@motajs/render-vue`、`@user/client-base` 这些别名实际指向哪个目录；`src` 是仓库里的哪个根 | 我会去建文件、写 export，但找不到验证「它真的被加载」的办法 |
| `docs/advanced/ii/ui/ui-template.md` | 「这份模板在渲染树里的位置」 | Vue 组件树 → 元素渲染树 → 画布根；UI 容器在面板根之上 | 画布根和 UI 容器由谁创建；如果我不走 `GameUI`、想自己挂一棵树，入口是什么；`custom` 元素是什么 | 我能复述三层，但只会通过 `open` 间接用它们，不能自己搭根 |
| `docs/advanced/ii/ui/container-and-coordinates.md` | 「坐标从哪里来」「loc 与锚点」 | 子元素坐标相对父容器；`loc` 是六元组；锚点决定哪个点落在 x/y；默认尺寸 200×200 | 只写 `x`/`y` 时「沿用当前尺寸」，初始当前尺寸到底是多少；前两篇元素层示例里的 `Container`、`Rect` 没写 import，我不知道从哪来 | 照抄嵌套位置是对的；某个漏写尺寸的容器会变成 200×200，可能盖住邻居 |
| `docs/advanced/ii/ui/container-and-coordinates.md` | 「层级」「事件在嵌套容器中的路径」 | zIndex 只在同父级比较；绘制从小到大、命中从大到小；`hidden`/`noevent` 差别 | 这里出现的 `absoluteX`/`absoluteY` 只被提到没定义；`stopPropagation` 的完整边界被推到第 9 篇 | 调父级 zIndex 能盖住旁支；细节要等第 9 篇才敢用 |
| `docs/advanced/ii/ui/basic-shapes.md` | 「填充、描边与命中」的代码块 | `fill`/`stroke` 是模式开关；颜色在 `fillStyle`/`strokeStyle`；`strokeAndFill` 优先 | 示例里 `{/* ... */}` 与行尾 `;` 穿插，我不知道整段是放进 render 的一次性演示，还是可以在组件里逐条写 | 我照搬会得到语法错误，或者只画出一个图形 |
| `docs/advanced/ii/ui/basic-shapes.md` | 「图形作为界面零件」表 | 按钮底、分隔线、半透明遮罩的常用组合；文字默认会接事件 | `g-rectr` 的 `circle` 在这里只出现 `[16]`，完整四角/椭圆规则在第 4 篇；我现在只会单值圆角 | 简单底板能画，想做不同角要翻到下一篇 |
| `docs/advanced/ii/ui/curves-and-paths.md` | 「路径」「圆角矩形」 | `Path2D` 是浏览器全局；贝塞尔点相对父容器；`circle` 1–4 项、`ellipse` 2/4/6/8 项的映射表 | 我不知道 TS 里用 `Path2D` 要开什么编译配置；三项圆角「右上与左下共用第 2 项」我在几何上还原不出来 | 单值圆角和折线能画；三项圆角可能画成不是我想要的样子 |
| `docs/advanced/ii/ui/text.md` | 「字体」的 `addFallback` | `Font` 构造是位置参数；`Font.clone/defaults/setDefaults` 的用法 | `addFallback` 是静态方法还是实例方法、参数是什么、返回值是什么，全文没有示例 | 想加后备字体时卡住，只能先跳过 |
| `docs/advanced/ii/ui/text.md` | 「尺寸与居中」 | 文字宽高由测量决定；给 `width`/`height` 不裁剪；居中用锚点 0.5 | 测量发生在首帧前还是挂载后；我在 setup 里读不到尺寸时，该用 `onMounted` 还是等事件，没有说明 | 居中能对；「先量尺寸再排版」的场景不知道怎么接 |
| `docs/advanced/ii/ui/image-and-texture.md` | 「从素材管理器取纹理」 | `props.state.materials.getImageByAlias` 返回 `ITexture \| null`；取不到先走占位 | 第 13 篇说普通子组件不要接 `state`，那抽成深层图标组件后怎么拿 materials？只能层层传 prop 吗；`ITexture` 能不能直接给 `image` 属性 | 顶层 UI 能取图，拆成子组件后我不知道图从哪来 |
| `docs/advanced/ii/ui/image-and-texture.md` | 「边界与注意」末条 | 纹理不要在组件卸载后继续被引用 | 「按纹理自身的生命周期处理」没有给释放方法名或时机 | 小图我不管；长期反复开关的面板可能泄漏，但我不会判断 |
| `docs/advanced/ii/ui/layer-transform-performance.md` | 「缓存与脏更新」「filter 与 composite」 | 默认缓存/不缓存表；`nocache` 优先；脏标记沿父链上传 | `custom` 自定义绘制里「主动触发一次更新」的方法名没给；`container-custom`、`template` 两个默认缓存项全文没定义；filter/composite 说「再查对应取值」但没有入口 | 普通属性变化能自动重画；自定义绘制、滤镜、`template` 只能停在概念 |
| `docs/advanced/ii/ui/reactivity.md` | 「什么时候会重渲染」 | 依赖收集、组件级重跑、元素级 patch、`nextTick`、解构丢响应式 | `shallowRef` 的适用场景我还不会判断；`watch` 的 deep/immediate 没讲，我要监听对象内部时不确定 | 计数器能跑；监听对象内部字段可能漏更新 |
| `docs/advanced/ii/ui/events.md` | 「事件对象」 | `target/touch/type/buttons/identifier/offsetX/absoluteX/stopPropagation` 的含义 | `MouseType` 只出现 `Left`、`None`；右键/中键/滚轮的完整取值、`wheelType` 的单位枚举都没列；`onMove` 是否只在指针位于元素上时触发也没说 | 左键点击没问题；右键、中键、滚轮单位要靠试 |
| `docs/advanced/ii/ui/events.md` | 「stopPropagation」表 | 在捕获/冒泡各位置调用的日志结果；它不阻止同元素同事件的其它监听器 | 同一元素怎么挂两个 `onClick`、执行顺序如何，文档只说「都会执行完」 | 单监听器行为清楚；多监听器只能猜 |
| `docs/advanced/ii/ui/hotkey-in-ui.md` | 「触发方式：HotkeyEmitMode」 | 三种模式；`timeout`/`interval`/`dt` 都是最小间隔不是精确计时 | 「激励源」是什么没定义；`Continuous` 的「按住后按激励源持续触发」我无法映射到代码 | `Once`/`KeyUp` 能用；`Continuous` 不敢开 |
| `docs/advanced/ii/ui/hotkey-in-ui.md` | 「注册新指令与分组」 | `addCommand`/`defaults`/`setGroup`/`deleteCommand`；组合键组内最后一个是主键 | `KeyCode` 没有完整键名表，只有几个例子；三键组合怎么写没有示例 | 常用键能注册；冷门键要猜名字，三键组合要试 |
| `docs/advanced/ii/ui/conditional-and-list-rendering.md` | 「循环：用 map 生成元素」 | `map` 返回数组成为父容器子元素；固定顺序可不加 `key` | 返回数组是否需要 Fragment 或外层容器；组件返回多根的写法还没给 | 单个容器内的 `map` 能跑 |
| `docs/advanced/ii/ui/conditional-and-list-rendering.md` | 「key：只在需要保留身份时加」 | `key` 只在同父级兄弟间唯一；组件标签上写；不要用下标 | `key` 加错位置的具体症状我只有一句结论，没有可对照的反例 | 我会加 `key`，但不确认加错时看到什么 |
| `docs/advanced/ii/ui/props.md` | 「组件怎么拿参数」「属性名用 camelCase」 | 四环管线；`props` 数组；`emits`；camelCase；默认值用 `??` | 第 1 篇说「模板指令不适用」，这里 `v-model:selected` 又作为 TSX 写法出现；我无法判断哪些 `v-` 前缀在 TSX 能用 | 普通 props 能通；抄 `v-model` 可能编译不过或语义不对 |
| `docs/advanced/ii/ui/props.md` | 「泛型顺序」 | 四个泛型；第二三要配套；只写 Props 时 `emit` 无约束 | `SetupComponentOptions` 的 `satisfies` 与 `defineComponent` 的两处泛型必须手抄一致，我没有类型报错时的排查方法 | 照抄能过；改一个事件名可能整片飘红，我不知道先改哪 |
| `docs/advanced/ii/ui/component-tsx.md` | 「组件如何映射成一棵子树」 | 组件不产生节点；根元素是挂载点；多根成为同父级多个子元素 | 多根在 TSX 里具体返回数组还是 Fragment，示例没给；根元素尺寸为 0 会让点击落空只在第 14 篇提到 | 单根组件没问题；多根要试 |
| `docs/advanced/ii/ui/component-tsx.md` | 「expose、emit 与父组件拿子组件」 | `ref` 拿实例；`expose` 只暴露必要方法；挂载前 `undefined` | `ref<CardExpose>()` 的泛型为什么写成 expose 类型而不是组件类型；没有 `expose` 时父组件拿到什么类型 | 照抄 `expose` 可用；不 expose 的情况不敢依赖 |
| `docs/advanced/ii/ui/slots-and-attrs.md` | 「具名 slot」「attrs」 | TSX 里 slot 是函数；具名 slot 用对象；`{...attrs}`；`inheritAttrs` | 手写 `PanelOptions` 与 `SetupComponentOptions` 的兼容边界；`attrs` 里混入事件监听时的类型 | 默认 slot 能显示；具名对象形式容易漏 `default` |
| `docs/advanced/ii/ui/slots-and-attrs.md` | 「组件边界上的事件与属性」 | `emits` 声明后 `onXxx` 被消费、不再透传；四条「点了没反应」原因 | 「包装组件要转发全部 props、attrs、slots、emits」没有给完整骨架 | 做包装层时会漏，漏了只看到没反应 |
| `docs/advanced/ii/ui/builtin-text-and-input.md` | 「特殊组件 InputBox」 | `getInput`/`getInputNumber` 返回 Promise；`loc`/`width` 语义；取消返回空串/NaN | 参数里的 `void 0` 占位我不熟；`props?` 能传什么没列；弹窗被外部关闭时 Promise 不结束，我要怎么兜底取消 | 正常确认/取消可用；异常关闭会挂住 |
| `docs/advanced/ii/ui/builtin-text-and-input.md` | 「事件与渲染树」 | `TextContent` 根是 `custom`；`Input` 根是 `container`；`Textbox` 根是 `container` | `custom` 元素本身全文没定义（第 7 篇也出现过），我不知道它和 `container` 的差别 | 点击冒泡能工作；`custom` 的行为只能靠试 |
| `docs/advanced/ii/ui/builtin-list-and-containers.md` | 「List：可选中的列表」 | `list`/`selected`；初值取第一项；点击更新内部值并 `emit` | 父级代码怎么主动改选中？文档说挂载后改绑定不会改选，又没给方法；对比 `Page` 可以外部改 `page`，我不知道 `List` 的受控边界 | 用户点击正常；程序化选中做不到 |
| `docs/advanced/ii/ui/builtin-list-and-containers.md` | 「弹窗与一次性提示」 | `getConfirm`/`getChoice`；返回语义；弹窗压在栈顶 | `Tip` 被提到但从未介绍；`getChoice` 没有取消分支，外部关闭时怎么收尾没给 | 确认框可用；`Tip` 不知道是什么 |
| `docs/advanced/ii/ui/ui-controller-and-stack.md` | 「场景 UI 与主 UI」 | 两个控制器；主 UI 容器在 `active` 假时整体隐藏 | `mainUIController.render()` 要放进哪个容器、放在主场景组件哪里，我没有主场景代码可对照 | 能 `open`；不知道怎么接到自己的游戏画面 |
| `docs/advanced/ii/ui/ui-controller-and-stack.md` | 「事件归属与生命周期」 | 第 i 层 zIndex 是 i*5；`hide` 不卸载；`close` 卸载并清缓存 | `setPropsBaseCreator` 我作为 UI 作者要不要调用、调用时机；文档说游戏创建客户端时设置，但我找不到那一步 | 默认注入能用；自定义 creator 不敢动 |
| `docs/advanced/ii/ui/replace-builtin-ui.md` | 「替换步骤」第二步 | 保留入口函数/换对象；包装层；组件要接 `controller`/`instance`/`state`/`loc` | `loc` 到底由谁传（`open` 的 vBind 还是控制器）我仍不确定；第 17 篇只说容器渲染实例，没说 `loc` 注入 | 照抄能打开；不传 `loc` 时面板位置不明 |
| `docs/advanced/ii/ui/replace-builtin-ui.md` | 「一个最小替换示例」末段 | 保留 Esc 要 `useKey`；按键属于作用域 | 「注册与内置面板相同的指令」——`@common/exit` 已存在，我该 `implement` 还是 `addCommand`？用词让我不确定 | 可能重复注册，或者根本没接上 |
| `docs/advanced/ii/ui/ui-performance.md` | 「观测与验证」 | 六层症状表；先做减法；录性能面板；一次只改一个开关 | 「在渲染函数里临时计数」怎么写、帧时间在哪看；文档不给毫秒数，我需要一个可执行的判断阈值 | 知道方向，但无法量化「改前改后」 |
| `docs/advanced/ii/ui/inventory-example-1-skeleton.md` | 「骨架代码」「打开它」 | 720×480 根、各区域坐标、关闭路径、三个打开入口 | 没有「把文件放进工程后如何编译/预览」的步骤；画布 480×320 与面板 720×480 的溢出只被说明、没给适配做法 | 代码能写；实际画面可能只看到左上角一块 |
| `docs/advanced/ii/ui/inventory-example-1-skeleton.md` | 「组件与文件怎么分」表 | 五个文件职责与最终 props；`InventoryPanel` 是唯一 `GameUI` | 表里把 `onSelect`/`onClear` 写成 props，正文又说内部是 `emits`；我照父级用法可以，但自己建文件时不确定类型接口要不要包含回调 | 父级调用对；子组件声明容易漏 |
| `docs/advanced/ii/ui/inventory-example-2-grid.md` | 「数据模型：Item 只定义一次」 | `Item` 四字段；`id` 稳定；`items` 用 `ref` | `Item` 定义在哪个文件、其它四个文件怎么 import，没给 export 语句和路径 | 复制到多文件时类型对不上 |
| `docs/advanced/ii/ui/inventory-example-2-grid.md` | 「ItemGrid：按行列排列」 | 列/行计算；`key` 用 `item.id`；定位容器与格子同尺寸 | 根容器尺寸写死 400×280，与 props 无关；区域尺寸变了怎么传进去没讲 | 网格能排；改区域尺寸要手改常量 |
| `docs/advanced/ii/ui/inventory-example-3-detail.md` | 「详情区的树结构」 | 四块；两个 `hidden` 分支；`TextContent` 的 `width` 必填 | 两个 `container hidden` 没写 `loc`，按第 2 篇默认 200×200；我不确定这是有意还是会被默认尺寸影响命中 | 视觉可能对；点击与遮挡要试 |
| `docs/advanced/ii/ui/inventory-example-3-detail.md` | 「空态与边界」 | `null` 收口；删除时清理 `selectedId`；三种空态 | 删除道具的函数第 5 篇才出现，这里只说「要在面板层处理」 | 空态能显示；删除流程要等第 5 篇 |
| `docs/advanced/ii/ui/inventory-example-4-scroll.md` | 「数据与选中态如何穿过滚动层」 | `ItemGrid` 根从单容器改成行容器数组；行 `key` 用行号，格子 `key` 用 id | `Scroll` 的「直接子元素」是否跨越组件边界——`ItemGrid` 是组件，返回数组后这些行算不算 `Scroll` 的直接子元素？这是虚拟滚动能否成立的关键，文档只给结论没给判定方法 | 照抄可能滚不动，因为行其实在组件子树下 |
| `docs/advanced/ii/ui/inventory-example-4-scroll.md` | 「面板里怎么接」 | `padEnd`、`scrollTo`、`getScrollLength`、`ScrollExpose` | `scrollTo(y, time)` 的 `time` 单位没写（毫秒？帧？）；`padEnd` 是像素还是比例 | 滚动能滚；动画时长和补长只能试 |
| `docs/advanced/ii/ui/inventory-example-5-state.md` | 「状态放在 InventoryPanel」 | `computed`/`watch` 分工；`item.count -= 1` 会触发重渲染；`equippedId` 只存 id | 「只在同一道具数量变化时提示」只给了一句文字，没有代码；现在的 `watch` 来源会因切换选中而误触发 | 提示会误触发，需要自己补判断 |
| `docs/advanced/ii/ui/inventory-example-5-state.md` | 「已装备的格子：三处一起改」 | 接口、`props` 数组、渲染三处必须同步；描边优先级 | 这里又用了 `ItemCellEmits`，但没重新给出定义；我要确认它还是第 2 篇那个 | 照抄能过；跨文件类型要回翻 |
| `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` | 「动画作用在树的哪一层」 | `requestAnimationFrame` 循环；`onUnmounted` 取消；只改 `alpha` | `requestAnimationFrame`/`performance.now()` 在目标环境是否可用；`transitioned`/`transitionedColor` 被提到但没有文档入口 | 动画能跑；想用渐变工具找不到用法 |
| `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` | 「最终组装与契约核对」 | 九条契约；最终骨架；坐标相对 720×480 根容器 | 最终骨架比第 1 篇多了一层 `container [0,0,720,480]` 包住主体与按钮，我不知道这层是不是必须、以后加内容该往哪层放 | 照抄能显示；扩展时层级容易放错 |

#### D-93 复述检查

**渲染树**

能复述：画布根 → UI 容器 → 面板根容器 → 区域容器 → 叶子元素。父子关系只有 TSX 嵌套和 `appendChild` 两种建立方式。子元素坐标相对父容器，父级的平移/缩放/旋转复合到子级，锚点是变换中心。`zIndex` 只在同父级兄弟间比较，绘制从小到大，命中从大到小，同值按插入顺序（后插入在上）。生命周期上，`hidden` 保留实例与状态只跳过绘制与命中，三元/`key` 变化会卸载重建。缓存默认按标签区分（container/custom/container-custom 默认开，text/image/template/g-* 默认不开），脏标记沿父链上传。

不能复述 / 缺什么：

- 不经过 `GameUI` 时，画布根和 UI 容器由谁创建、我能不能自己挂一棵树，这条链路没有可执行入口。
- `custom`、`container-custom`、`template` 三个元素名字反复出现在缓存表里，但没有一处像第 3 篇介绍四个图形那样介绍它们。
- 在 `custom` 里改外部数据后「主动触发一次更新」的方法名缺失，我不知道缓存脏标记怎么手动打。
- 组件边界不算节点（第 13 篇），但 `Scroll` 又要求「直接子元素」（第 16/23 篇）；多根组件返回的数组是否算 `Scroll` 的直接子元素，我没有判定依据。
- 画布适配：第 2 篇说按 `renderer.width`/`height` 算，第 20 篇又直接写 720×480 压在 480×320 上；我复述不出「实际运行时到底以哪个为准」。

**事件**

能复述：指针从画布根开始，每层按 `zIndex` 从大到小找第一个命中元素；命中后捕获从根向内、冒泡从命中元素向外，完整顺序是「父捕获 → 子捕获 → 子冒泡 → 父冒泡」。图形按几何轮廓命中，`actionStroke` 只算描边。`stopPropagation` 只停止继续传播，不阻止同元素同事件名的其它监听器。`enter`/`leave` 不走冒泡，由根维护悬停集合做差集，先 leave 后 enter。`noevent` 仍绘制但整棵子树跳过命中，事件下穿；`hidden` 连绘制一起跳过。`offsetX/Y` 是当前元素局部坐标，经过变换反算；`absoluteX/Y` 是画布坐标。

不能复述 / 缺什么：

- `MouseType`/`WheelType`/`KeyCode` 都只出现零散取值，没有完整枚举表；右键、中键、滚轮单位我复述不出。
- 同一元素多个同事件监听器的写法与顺序，只有一句「都会执行完」。
- 组件根元素在命中里的角色：根容器尺寸为 0 时点击落空只在第 14 篇一句带过；多根组件哪个是命中入口没有说。
- 触摸多指只讲了 `identifier` 用来串起按下/移动/抬起，具体事件序列与浏览器默认行为的关系没有展开。

**组件**

能复述：普通组件继承 `DefaultProps`，UI 必须同时继承 `IGameUIPropsBase` 与 `DefaultProps`，且 `props` 数组至少含 `controller`/`instance`/`state`。props 走「父写属性 → VNode props → 声明数组挑键 → setup」四环，没声明的进 `attrs`，默认透传到根元素，`inheritAttrs: false` 可关。默认值用 `??`，不要解构。事件用 `emits` 声明，`v-model:xxx` 对应 `xxx` + `onUpdate:xxx`。slot 在 TSX 里是函数，具名 slot 用对象传。拆分依据是复用、状态隔离、渲染范围、数据边界。

不能复述 / 缺什么：

- `defineComponent` / `SetupComponentOptions` / `SlotsType` 的完整类型骨架我只能照抄，不能自己从零写对。
- 「模板指令不适用」与 `v-model:`、`v-if`、`v-model:value` 的关系我复述不出统一规则。
- 普通子组件不接 `state`，但 `state.materials`、`state.hotkey` 又要用；深层组件怎么拿到这些，我复述不出标准做法。
- 内置组件的受控模型不统一：`Input` 跟外部值、`Page` 跟外部页、`List` 挂载后不跟外部选中；我复述不出一个通用判断。
- `GameUI` 只是「名字 + 组件」的容器、不注册；但「谁在什么时机调用 `open`」这一环，在 25 篇里始终没有落到一个具体入口。

#### 跨篇问题

1. **读完 25 篇仍然没有「从零跑起来」的入口。** 每篇都给代码和文档站 live，但没有一处给出：模板工程怎么拿、文件放进哪个根、用什么命令编译或预览、别名 `@motajs/*`/`@user/*` 指向哪里。作为只读 Markdown 的读者，我能写出代码，但无法开始第一次验证。这不是某一篇缺，而是连续读完才暴露的整链缺口。
2. **TSX 里到底哪些模板语法可用，跨篇没有统一答案。** 第 1 篇说「不要用单文件组件的写法，模板指令不适用」；第 8 篇把 `v-if` 列为状态丢失原因；第 12 篇用 `v-model:selected`；第 15 篇用 `v-model:value`；第 16 篇还提到 `v-model:page`。我能从上下文推断这些是 TSX 支持的写法，但无法形成一条规则去判断下一个 `v-` 前缀能不能用。
3. **`state` 的可见范围跨篇对不上。** UI 组件通过 `props.state` 拿到 ClientCore；第 13 篇明确说普通子组件不要接收 `controller`/`instance`/`state`；但第 6 篇的素材获取写成 `props.state.materials`，第 15/24 篇的按键又依赖 `props.state.hotkey`。抽成子组件后，这些能力是只能靠 prop 层层传，还是另有入口，连续读完仍不明确。
4. **「组件边界不是节点」与「`Scroll` 只认直接子元素」是两条跨篇规则，合起来会产生一个我没法验证的问题。** 第 13、14 篇反复说组件不产生额外节点、多根成为同父级子元素；第 16、23 篇又要求 `Scroll` 的子元素必须平铺、不能包容器。第 23 篇让 `ItemGrid` 返回行数组塞进 `Scroll`，但 `ItemGrid` 本身是组件；这些行算不算 `Scroll` 的直接子元素，文档没有给出可操作判定。这是连续读到示例（四）才会冒出来的问题。
5. **内置组件的「受控 / 半受控」没有统一模型。** `Input` 用 `v-model:value` 跟随外部；`Page` 说外部改 `page` 也会跟随；`List` 却说挂载后改 `selected` 绑定不会改选，只能靠用户点击。单看每一篇都能接受，连起来读我无法预测下一个内置组件属于哪一类，也找不到「如何程序化设置 `List` 选中」的出口。
6. **单位与取值表散落在多篇，没有汇总。** 旋转是弧度（第 7 篇）、`alpha` 是 0–1、`interval` 是毫秒（第 15 篇）、`scrollTo(y, time)` 的 `time` 单位没写（第 23 篇）、`padEnd` 单位没写、`MouseType`/`WheelType`/`KeyCode` 只有零散枚举。连续读完我仍拼不出一张「数值参数都什么单位」的表。
7. **静默失败是跨篇反复出现的现象，但没有一篇给出统一的诊断入口。** 属性名写成连字符不报错、`props` 数组漏键不报错、`fill` 写成颜色不生效、`emits` 声明了却忘了 `emit`、`g-rect` 写 `radius` 不生效——这些分别在第 1、3、9、12、14 篇出现。作为新手，我需要的是「先检查哪几项」的一张总表，而不是每篇各说一句。
8. **画布与面板尺寸的关系连续读完仍有两套读法。** 第 2 篇说面板 `loc` 相对 UI 容器、按 `renderer.width`/`height` 适配、控制器不会居中；第 20 篇又把 720×480 的面板放在示例站 480×320 的画布上，并说逻辑尺寸会整体缩放。我在「按画布设计尺寸设计」与「按面板自己的设计尺寸设计」之间无法确定默认应该选哪个。
9. **一批术语在多篇复用却始终没有定义。** `custom`、`container-custom`、`template`（第 7 篇缓存表）、`Tip`（第 16 篇）、`激励源`（第 10 篇）、`transitioned`/`transitionedColor`（第 25 篇）、`ITexture` 与 `Texture` 的关系（第 6 篇）。单篇里都能绕过，连续读完会发现这些词一直在挡路。

#### 第 3 轮分诊

| 编号 | 篇目/章节 | 问题摘要 | 是否阻断 | 理由 | 处理 |
| --- | --- | --- | --- | --- | --- |
| R3-01 | `docs/advanced/ii/ui/ui-template.md`「一个最小 UI」 | 模板工程在哪、用什么命令跑、`satisfies` 是什么 | 是 | 缺前置：无法开始第一次验证 | 修 |
| R3-02 | `docs/advanced/ii/ui/ui-template.md`「文件放在哪里」 | 三个别名指向哪个目录、如何验证被加载 | 是 | 缺入口：别名与预览方式未给 | 修 |
| R3-03 | `docs/advanced/ii/ui/ui-template.md`「渲染树位置」 | 画布根/UI 容器谁创建、能否自己挂树、`custom` 是什么 | 否 | 架构深度；通过 `open` 已可继续 | 不修 |
| R3-04 | `docs/advanced/ii/ui/container-and-coordinates.md`「坐标从哪里来」 | 初始当前尺寸、元素层 `Container`/`Rect` 未 import | 是 | 缺 import + 默认值未说明 | 修 |
| R3-05 | `docs/advanced/ii/ui/container-and-coordinates.md`「层级」「事件路径」 | `absoluteX/Y` 未定义、`stopPropagation` 推到第 9 篇 | 否 | 后续篇已覆盖 | 不修 |
| R3-06 | `docs/advanced/ii/ui/basic-shapes.md`「填充、描边与命中」 | 示例把注释对象与 JSX 混排，照搬会语法错误 | 是 | 步骤缺失：示例不可直接使用 | 修 |
| R3-07 | `docs/advanced/ii/ui/basic-shapes.md`「图形作为界面零件」 | `g-rectr` 只给单值圆角 | 否 | 第 4 篇有完整规则 | 不修 |
| R3-08 | `docs/advanced/ii/ui/curves-and-paths.md`「路径」「圆角矩形」 | `Path2D` 编译配置、三项圆角几何 | 否 | 额外深度 | 不修 |
| R3-09 | `docs/advanced/ii/ui/text.md`「字体」 | `addFallback` 的签名 | 否 | 可选 API 的补充 | 不修 |
| R3-10 | `docs/advanced/ii/ui/text.md`「尺寸与居中」 | 测量时机、`onMounted` 与事件的选择 | 否 | 额外深度 | 不修 |
| R3-11 | `docs/advanced/ii/ui/image-and-texture.md`「从素材管理器取纹理」 | 子组件如何拿 materials、`ITexture` 能否直接给 `image` | 是 | 缺前置：`state` 可见范围未讲清 | 修 |
| R3-12 | `docs/advanced/ii/ui/image-and-texture.md`「边界与注意」 | 纹理释放方法名与时机 | 否 | 额外深度 | 不修 |
| R3-13 | `docs/advanced/ii/ui/layer-transform-performance.md`「缓存与脏更新」 | `custom` 主动更新方法、`template`/`container-custom` 定义、filter 入口 | 否 | 额外 API 索引；`custom` 由 R3-28 定义 | 不修 |
| R3-14 | `docs/advanced/ii/ui/reactivity.md`「什么时候会重渲染」 | `shallowRef` 场景、`watch` deep/immediate | 否 | 额外深度 | 不修 |
| R3-15 | `docs/advanced/ii/ui/events.md`「事件对象」 | `MouseType`/`WheelType` 枚举、`onMove` 条件 | 否 | 额外 API 表 | 不修 |
| R3-16 | `docs/advanced/ii/ui/events.md`「stopPropagation」 | 同一元素多个同事件监听器的顺序 | 否 | 边界情况 | 不修 |
| R3-17 | `docs/advanced/ii/ui/hotkey-in-ui.md`「HotkeyEmitMode」 | 「激励源」未定义、`Continuous` 无法映射 | 是 | 术语未定义 | 修 |
| R3-18 | `docs/advanced/ii/ui/hotkey-in-ui.md`「注册新指令与分组」 | `KeyCode` 完整表、三键组合 | 否 | 外部枚举；组合规则已给 | 不修 |
| R3-19 | `docs/advanced/ii/ui/conditional-and-list-rendering.md`「循环」 | 返回数组是否要 Fragment/外层容器 | 否 | 第 13 篇已覆盖 | 不修 |
| R3-20 | `docs/advanced/ii/ui/conditional-and-list-rendering.md`「key」 | `key` 加错的具体症状 | 否 | 额外深度 | 不修 |
| R3-21 | `docs/advanced/ii/ui/props.md`「组件怎么拿参数」 | 第 1 篇说模板指令不适用，这里又出现 `v-model:selected` | 是 | 明确矛盾 | 修 |
| R3-22 | `docs/advanced/ii/ui/props.md`「泛型顺序」 | 泛型不一致时的排查方法 | 否 | 类型层细节 | 不修 |
| R3-23 | `docs/advanced/ii/ui/component-tsx.md`「映射成子树」 | 多根返回数组还是 Fragment | 否 | 第 23 篇示例已给 | 不修 |
| R3-24 | `docs/advanced/ii/ui/component-tsx.md`「expose/emit」 | `ref<CardExpose>` 的泛型选择 | 否 | 额外深度 | 不修 |
| R3-25 | `docs/advanced/ii/ui/slots-and-attrs.md`「具名 slot」 | `PanelOptions` 与 `SetupComponentOptions` 兼容边界 | 否 | 额外深度 | 不修 |
| R3-26 | `docs/advanced/ii/ui/slots-and-attrs.md`「边界上的事件与属性」 | 包装组件转发骨架 | 否 | 额外深度 | 不修 |
| R3-27 | `docs/advanced/ii/ui/builtin-text-and-input.md`「InputBox」 | `void 0` 占位、`props?`、Promise 兜底 | 否 | 示例可照抄 | 不修 |
| R3-28 | `docs/advanced/ii/ui/builtin-text-and-input.md`「事件与渲染树」 | `custom` 元素全文未定义 | 是 | 术语未定义（核心元素类型） | 修 |
| R3-29 | `docs/advanced/ii/ui/builtin-list-and-containers.md`「List」 | 父级如何主动改选中 | 否 | 文档明确的组件限制（设计取舍） | 不修 |
| R3-30 | `docs/advanced/ii/ui/builtin-list-and-containers.md`「弹窗与一次性提示」 | `Tip` 未介绍、`getChoice` 取消分支 | 否 | 额外 API | 不修 |
| R3-31 | `docs/advanced/ii/ui/ui-controller-and-stack.md`「场景 UI 与主 UI」 | `mainUIController.render()` 放在主场景哪里 | 是 | 缺入口：主场景接入未落到文件 | 修 |
| R3-32 | `docs/advanced/ii/ui/ui-controller-and-stack.md`「事件归属与生命周期」 | UI 作者是否要调用 `setPropsBaseCreator` | 否 | 高级配置 | 不修 |
| R3-33 | `docs/advanced/ii/ui/replace-builtin-ui.md`「替换步骤」 | `loc` 由 vBind 还是控制器传 | 是 | 缺前置：注入范围未讲清 | 修 |
| R3-34 | `docs/advanced/ii/ui/replace-builtin-ui.md`「最小替换示例」 | 内置指令该 `implement` 还是 `addCommand` | 是 | 缺步骤：写法未区分 | 修 |
| R3-35 | `docs/advanced/ii/ui/ui-performance.md`「观测与验证」 | 临时计数写法与帧时间阈值 | 否 | 额外深度 | 不修 |
| R3-36 | `docs/advanced/ii/ui/inventory-example-1-skeleton.md`「骨架代码」 | 编译/预览步骤、720×480 溢出适配 | 是 | 缺前置 + 适配分工不清 | 修 |
| R3-37 | `docs/advanced/ii/ui/inventory-example-1-skeleton.md`「组件与文件怎么分」 | 类型接口是否包含回调 | 否 | 父级用法已明确 | 不修 |
| R3-38 | `docs/advanced/ii/ui/inventory-example-2-grid.md`「数据模型」 | `Item` 定义在哪个文件、如何 import | 是 | 缺 import/入口 | 修 |
| R3-39 | `docs/advanced/ii/ui/inventory-example-2-grid.md`「按行列排列」 | 根容器尺寸写死 | 否 | 维护性偏好 | 不修 |
| R3-40 | `docs/advanced/ii/ui/inventory-example-3-detail.md`「详情区的树结构」 | 两个 `container hidden` 未写 `loc` | 否 | 布局细节 | 不修 |
| R3-41 | `docs/advanced/ii/ui/inventory-example-3-detail.md`「空态与边界」 | 删除函数在后面才出现 | 否 | 示例顺序 | 不修 |
| R3-42 | `docs/advanced/ii/ui/inventory-example-4-scroll.md`「数据与选中态穿过滚动层」 | 组件返回的数组是否算 `Scroll` 直接子元素 | 是 | D-93 模型未讲清 | 修 |
| R3-43 | `docs/advanced/ii/ui/inventory-example-4-scroll.md`「面板里怎么接」 | `scrollTo` 的 `time`、`padEnd` 单位 | 是 | 术语未定义（单位） | 修 |
| R3-44 | `docs/advanced/ii/ui/inventory-example-5-state.md`「状态放在 InventoryPanel」 | 同道具数量变化的 watch 组合没有代码 | 否 | 文档已给思路，可按需实现 | 不修 |
| R3-45 | `docs/advanced/ii/ui/inventory-example-5-state.md`「已装备的格子」 | `ItemCellEmits` 未重复定义 | 否 | 第 2 篇已有定义 | 不修 |
| R3-46 | `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md`「动画」 | rAF 可用性、`transitioned` 无入口 | 否 | 额外 API | 不修 |
| R3-47 | `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md`「最终组装」 | 多一层同尺寸 `container` 是否必须、内容放哪层 | 是 | 缺前置：层级职责未说明 | 修 |

#### 跨篇问题分诊

| 编号 | 篇目/章节 | 问题摘要 | 是否阻断 | 理由 | 处理 |
| --- | --- | --- | --- | --- | --- |
| R3-48 | 跨篇 1：`ui-template` / `inventory-example-1` | 25 篇没有「从零跑起来」的入口（工程、命令、别名） | 是 | 缺前置/入口 | 修 |
| R3-49 | 跨篇 2：`ui-template` / `props` | TSX 里哪些 `v-` 前缀可用没有统一规则 | 是 | 明确矛盾 | 修 |
| R3-50 | 跨篇 3：`image-and-texture` / `component-tsx` | 普通子组件不接 `state`，但素材/按键又要用 | 是 | 缺前置：可见范围未讲清 | 修 |
| R3-51 | 跨篇 4：`component-tsx` / `inventory-example-4` | 组件边界不算节点，但 `Scroll` 只认直接子元素 | 是 | D-93 模型未讲清 | 修 |
| R3-52 | 跨篇 5：`builtin-list-and-containers` | 内置组件受控/半受控模型不统一 | 否 | 各组件限制（设计取舍） | 不修 |
| R3-53 | 跨篇 6：`events` / `inventory-example-4` | 单位与枚举散落，`scrollTo`/`padEnd` 单位缺失 | 是 | 术语未定义（单位）；枚举表属额外 | 修 |
| R3-54 | 跨篇 7：`ui-template` / `props` / `slots-and-attrs` 等 | 静默失败没有统一诊断入口 | 否 | 额外综合，不阻碍继续 | 不修 |
| R3-55 | 跨篇 8：`container-and-coordinates` / `inventory-example-1` | 按画布设计还是按面板设计尺寸写坐标 | 是 | 缺前置：两者分工未说清 | 修 |
| R3-56 | 跨篇 9：`layer-transform-performance` / `builtin-list-and-containers` 等 | `custom`/`template`/`Tip`/`激励源` 等术语未定义 | 否 | 单篇可绕过；`custom`/`激励源` 已由 R3-28/R3-17 修 | 不修 |

第 3 轮阻断数：22
第 3 轮非阻断数：34

概率继承：Round 1 的 178 行分节概率继续有效；本轮新增/重写章节需补该节概率。

状态：已汇总

#### 第 3 轮修订

R3-01：已修 → `docs/advanced/ii/ui/ui-template.md#工程与命令`：补仓库根目录、`pnpm install` / `pnpm dev` / `pnpm docs:dev`。
R3-02：已修 → `docs/advanced/ii/ui/ui-template.md#工程与命令`：补 `@motajs/*` → `packages/*/src`、`@user/*` → `packages-user/*/src`。
R3-04：已修 → `docs/advanced/ii/ui/container-and-coordinates.md#元素层`：补 `import { Container, Rect } from '@motajs/render'` 与默认 200×200 说明。
R3-06：已修 → `docs/advanced/ii/ui/basic-shapes.md#填充、描边与命中`：把三个示例收进同一个 `container`，去掉裸 JSX 与注释对象混排。
R3-11：已修 → `docs/advanced/ii/ui/image-and-texture.md#从素材管理器取纹理`：补「顶层取纹理、作为 prop 传给子组件」。
R3-17：已修 → `docs/advanced/ii/ui/hotkey-in-ui.md#触发方式`：补「激励源」是渲染循环的每帧时间激励，`Continuous` 按帧累计。
R3-21：已修 → `docs/advanced/ii/ui/ui-template.md#边界与注意`：澄清 `.vue` 模板指令不适用，但 TSX 里 `v-model:xxx` 是 `xxx` + `onUpdate:xxx` 的简写。
R3-28：已修 → `docs/advanced/ii/ui/layer-transform-performance.md#缓存与脏更新`：补 `custom` / `container-custom` / `template` 的定义与差别。
R3-31：已修 → `docs/advanced/ii/ui/ui-controller-and-stack.md#场景 UI 与主 UI`：补主场景根容器渲染 `props.state.mainUIController.render()`（见 `src/client/ui/main.tsx`）。
R3-33：已修 → `docs/advanced/ii/ui/replace-builtin-ui.md#替换步骤`：补 `loc` 来自打开方 vBind，控制器只注入 `controller`/`instance`/`state`。
R3-34：已修 → `docs/advanced/ii/ui/replace-builtin-ui.md#最小替换示例`：补 `@common/exit` 用 `key.implement` 覆盖，`addCommand` 只用于新 id。
R3-36：已修 → `docs/advanced/ii/ui/inventory-example-1-skeleton.md#骨架在渲染树里的位置`：补工程命令、画布与面板分工、720×480 溢出行为。
R3-38：已修 → `docs/advanced/ii/ui/inventory-example-2-grid.md#数据模型`：补 `Item` 与 `ItemGrid` 同文件导出、其它文件 `import type`。
R3-42：已修 → `docs/advanced/ii/ui/inventory-example-4-scroll.md#数据与选中态穿过滚动层`：补组件返回数组会平铺为 `Scroll` 直接子元素。
R3-43：已修 → `docs/advanced/ii/ui/inventory-example-4-scroll.md#面板里怎么接`：补 `scrollTo` 的 `time` 是毫秒、`padEnd` 是像素。
R3-47：已修 → `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md#最终组装与契约核对`：补外层画布根与内层面板根的职责、新内容加在哪层。
R3-48：已修 → 同 R3-01 / R3-02 / R3-36（工程、命令、别名）。
R3-49：已修 → 同 R3-21（TSX 的 `v-model` 规则）。
R3-50：已修 → 同 R3-11（顶层取 `state`、子组件收 prop）。
R3-51：已修 → 同 R3-42（组件边界与 `Scroll` 直接子元素）。
R3-53：已修 → 同 R3-43（`scrollTo` / `padEnd` 单位）。
R3-55：已修 → 同 R3-36（面板设计尺寸与画布尺寸的分工）。

第 3 轮修订完成：阻断 22 条，已修 22 条，未修 0 条。
读者循环：已完成（第 3 轮修订后无阻断）。

## 旧轮次作废标记（D-94）

- 旧的 Round 1（`10-49-READER-REVIEW.md`）、Round 2、Round 3 均**未按 D-94** 执行：读者没有先完整读完目标文档之外的全部文档，因此不满足 D-94 第 1/5/6 条。
- 上述三轮记录**作废，仅保留为历史**；不删除、不复制、不作为本轮结论；旧的分诊与修订数不再计入本批读者循环。
- 本文件从下面的「重跑 Round 1（D-94）」开始按 D-94 重新计数。

### 重跑 Round 1（D-94）

#### 读者

单读者（用户已把 D-91 的多读者改为单读者）。人格：刚读完中级教程、想给自己的魔塔做一套自定义界面的作者；只掌握基础 TS/JS，没写过 UI，不知道 canvas，不会 Vue 组件写法；只能看这套文档，不能看源码，也没有人可以问。

阅读范围按 D-94：先完整读非目标文档（`docs/intermediate/` 全部、`docs/advanced/index.md`、高级 I 全部、高级 II 现有数据端、高级 III 全部、`docs/poc/render-demo.md`），再按 Part 0→5 读 25 篇目标文档。原始记录见 `10-53-READER-REVIEW-ROUND1-D94.md`（83 条逐篇提问 + 10 条跨篇问题）。

#### 逐篇提问

完整逐条原问保留在 `10-53-READER-REVIEW-ROUND1-D94.md`；下表把 25 篇的目标路径归一化，并汇总每篇的提问位置。

| 篇目 | 提问位置 | 缺什么（汇总） |
| --- | --- | --- |
| `docs/advanced/ii/ui/ui-template.md` | 最小 UI / props 列表 / 运行效果 | open 写在哪个文件、`client` 从哪来、import 与 TSX 编译前提 |
| `docs/advanced/ii/ui/container-and-coordinates.md` | 坐标基准 / 渲染树 / 容器职责 | 画布设计尺寸读哪个值、UI 容器自身 loc、720×480 与 480×320 的缩放 |
| `docs/advanced/ii/ui/basic-shapes.md` | 填充描边命中 / 图形零件 / 边界 | 透明热区写法、内描边写法、渐变/贴图 |
| `docs/advanced/ii/ui/curves-and-paths.md` | 路径 / 圆角矩形 / 三次贝塞尔 | Path2D 放哪、ellipse 8 项映射、贝塞尔上的描边/命中属性 |
| `docs/advanced/ii/ui/text.md` | 字体 / 尺寸居中 / 缓存 | 自定义字体文件、测量高度的接口、高频数字成本 |
| `docs/advanced/ii/ui/image-and-texture.md` | 加载 PNG / 素材管理器 / 像素图 | 素材目录与 src、不用编辑器怎么登记别名、非整数倍放大 |
| `docs/advanced/ii/ui/layer-transform-performance.md` | 缓存 / 显示开关 / filter | 局部 nocache 选择、hidden 与 noevent 的遍历差别、filter 取值 |
| `docs/advanced/ii/ui/reactivity.md` | ref / 重渲染 / 生命周期边界 | `defineComponent` 的 props 写法、数据端迭代器怎么变 ref、`v-if` 能否用 |
| `docs/advanced/ii/ui/events.md` | 事件名 / 事件对象 / cursor | 父容器 onMove 是否覆盖子树、触摸是否同一套、自定义/隐藏光标 |
| `docs/advanced/ii/ui/hotkey-in-ui.md` | 注册指令 / 按键与栈 / useKey | 内置指令 id 全表、Input 聚焦时 Esc 优先级、setup 对应哪一段 |
| `docs/advanced/ii/ui/conditional-and-list-rendering.md` | key / hidden 与三元 / 数据更新 | key 写在哪一层、hidden 的命中成本、数据端变化怎么通知界面 |
| `docs/advanced/ii/ui/props.md` | 组件拿参数 / 基础 props / 泛型 | props 数组能否写默认值、`open` 第二参与 loc、泛型少写是否报错 |
| `docs/advanced/ii/ui/component-tsx.md` | 组件映射 / 生命周期 / expose | 多根组件的 attrs 与定位、setup/onMounted/watch 的取数时机、两种 ref 的 import |
| `docs/advanced/ii/ui/slots-and-attrs.md` | slot / attrs / 组件边界事件 | `SetupComponentOptions` 的 slots 写法、loc 数组是否自动生效、onEnter 能否透传 |
| `docs/advanced/ii/ui/builtin-text-and-input.md` | TextContent / Input / InputBox | TextContent 完整样式键、Input 聚焦时 Esc、普通子组件怎么弹输入框 |
| `docs/advanced/ii/ui/builtin-list-and-containers.md` | List / ListPage / Scroll / 弹窗 | 外部重置 List 选中、右侧 slot 谁负责滚动、动态行高、弹窗与面板的 Esc 归属 |
| `docs/advanced/ii/ui/ui-controller-and-stack.md` | 场景/主 UI / 栈策略 / 背景 / 生命周期 | 组件外有没有 client、关上层后下层是否自动回来、背景四名怎么选、creator 默认值 |
| `docs/advanced/ii/ui/replace-builtin-ui.md` | 替换步骤 / 可替换项 / 包装层 / 风险 | 改 `settings.tsx` 算不算改内置、mode/validate 约定在哪、包装层怎么写、目录树 |
| `docs/advanced/ii/ui/ui-performance.md` | 定位 / 缓存 / 命中 / 观测 | 怎么录、缓存阈值、全屏 image 的点击穿透、长帧标准 |
| `docs/advanced/ii/ui/inventory-example-1-skeleton.md` | 树位置 / 文件拆分 / 打开 | 720×480 与画布关系、index.ts 冲突、第一下从哪触发 |
| `docs/advanced/ii/ui/inventory-example-2-grid.md` | ItemCell / ItemGrid / 数据 / 点击 | 图标层序、末行不足时的定位容器、真实背包映射、onSelect 与 emits |
| `docs/advanced/ii/ui/inventory-example-3-detail.md` | 详情树 / ItemDetail / 空态 | hidden 默认 200×200 是否挡按钮、长描述怎么让位、删除时清 selectedId |
| `docs/advanced/ii/ui/inventory-example-4-scroll.md` | Scroll 位置 / 数据穿层 / 滚动事件 / 为何不用 ListPage | 滚动条宽度是否固定、组件边界与直接子元素、滚轮是否冒泡、响应式分栏 |
| `docs/advanced/ii/ui/inventory-example-5-state.md` | 状态 / 使用 / 已装备 / 键盘 | 真实装备与 useItem、equippedId 是否进存档、Input 聚焦时 Esc |
| `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` | 动画 / 最终组装 / 注册打开 / 验证清单 | transitioned 签名、`hidden` 变量谁设、工具栏+快捷键链路、hide 与 close 的清单差异 |

#### D-93 复述检查

- **渲染树**：能复述根 → UI 容器 → 面板根 → 区域/叶子的层级、局部坐标与变换继承、`zIndex` 兄弟排序、`hidden`/三元/`key` 的差别、容器缓存边界与脏标记上冒。复述不出的仍在「UI 容器自身 loc 与尺寸」「hidden 与 noevent 的命中成本口径」——后者已在第 7 篇补一句澄清。
- **事件**：能复述命中从根按 `zIndex` 向内、捕获父先、冒泡子先、`enter/leave` 集合差、`offset` 与 `absolute` 的坐标差、`noevent`/`actionStroke` 对命中的影响。复述不出的在「父容器 `onMove` 是否覆盖子树」与「Input 聚焦时键盘作用域谁在上」。
- **组件**：能复述组件不产生节点、props 四环与 attrs 分叉、`emits` 声明后不再透传、slot 是函数、`inheritAttrs`、UI 与普通组件的基类区别、`expose` + `ref`。复述不出的在「`SetupComponentOptions` 的 slots 字段完整写法」与「多根组件的父级定位」。

#### 跨篇问题

1. 真实数据接不进来：`iterateItems()` 的 Map 怎么变成 `Item[]`，装备/使用怎么接 `state.hero`。
2. 素材怎么登记：没有编辑器时，自己的 PNG 放哪、怎么变成 `getImageByAlias` 的别名。
3. 组件外到底有没有 `client`：第 1 篇写 `client.sceneController`，第 17 篇说没有全局 `client`。
4. `v-if` 能不能用：第 8/13 篇拿 `v-if` 举例，第 11 篇说 TSX 没有模板指令。
5. `IGameUIPropsBase` + `DefaultProps` 是硬要求吗：第 1/13 篇说必须，第 18 篇说推荐。
6. 画布尺寸该按哪个数：480×320、720×480、`renderer.width/height`、`RENDER_WIDTH` 四者关系。
7. 普通子组件拿不到 `controller`：`getInput`/`getConfirm` 需要 controller，子组件怎么办。
8. `hidden` 的成本口径：第 7/11 篇说仍被父级遍历，第 19 篇把 hidden 当性能首选。
9. 默认值处处是坑：200×200、缓存开关、Font、lineHeight 等记不住。
10. `@user/client-base` 与 `@motajs/*` 的 import 该不该写：新建文件时不知道谁「顶部已有」。

#### 第 1 轮分诊

| 编号 | 篇目/章节 | 问题摘要 | 是否阻断 | 理由（D-91） | 处理 |
| --- | --- | --- | --- | --- | --- |
| R1-01 | ui-template / 组件外打开 | 组件外 `client` 从哪来、组件内是否也能写 | 阻断 | 缺前置 / 明确矛盾 | 修 |
| R1-02 | container / 渲染树 | UI 容器自身 loc 与尺寸未知 | 阻断 | D-93 渲染树模型没讲清 | 交用户 |
| R1-03 | container / 坐标基准 | 画布尺寸读哪个 | 非阻断 | 文档已答（以 `renderer.width/height` 为准） | 不修 |
| R1-04 | basic-shapes / 命中 | 透明热区怎么写 | 非阻断 | 文档已答（`alpha={0}`） | 不修 |
| R1-05 | basic-shapes / 图形零件 | 内描边写法、渐变/贴图 | 非阻断 | 额外深度 / 设计取舍 | 不修 |
| R1-06 | curves / 路径 | Path2D 放模块还是 setup | 非阻断 | 写法选择，不影响照做 | 不修 |
| R1-07 | curves / 圆角与贝塞尔 | ellipse 8 项映射、贝塞尔属性 | 非阻断 | 额外深度 | 不修 |
| R1-08 | text / 字体与尺寸 | 自定义字体、测量接口、高频数字 | 非阻断 | 额外深度 | 不修 |
| R1-09 | image / 素材 | 素材目录、别名登记 | 非阻断 | 设计取舍（正文只负责使用已登记素材） | 交用户 |
| R1-10 | layer / 显示开关 | hidden 与 noevent 的遍历口径 | 非阻断 | 文档已答（两者都跳过命中） | 不修 |
| R1-11 | layer / filter | filter/composite 取值 | 非阻断 | 明确不属入门必须内容 | 不修 |
| R1-12 | reactivity / 生命周期边界 | `v-if` 能否用 | 阻断 | 明确矛盾（TSX 无模板指令） | 修 |
| R1-13 | reactivity / 数据更新 | 数据端迭代器怎么变 ref | 阻断 | 缺前置（跨数据端） | 交用户 |
| R1-14 | events / onMove | 父容器是否持续收到子树移动 | 非阻断 | 额外边界，按需再查 | 不修 |
| R1-15 | hotkey / 按键与栈 | Input 聚焦时 Esc 优先级 | 阻断 | 步骤/优先级未定义 | 交用户 |
| R1-16 | conditional / 列表更新 | 数据端变化怎么通知界面 | 阻断 | 缺前置（同 R1-13） | 交用户 |
| R1-17 | props / 默认值 | props 数组能否写 default | 非阻断 | 文档已答（用 `props.x ?? 默认`） | 不修 |
| R1-18 | props / open 参数 | `open` 第二参与 loc | 非阻断 | 文档已答（ui-template 已说明） | 不修 |
| R1-19 | component / 多根与 ref | 多根 attrs、两种 ref import | 非阻断 | 文档已给 import 与规则 | 不修 |
| R1-20 | slots / SetupComponentOptions | slots 字段完整写法 | 非阻断 | 文档已给 `SlotsType` 与示例 | 不修 |
| R1-21 | builtin-text / InputBox | 普通子组件怎么弹输入框 | 阻断 | 缺入口（子组件无 controller） | 修 |
| R1-22 | builtin-text / Input | Input 聚焦时 Esc | 阻断 | 同 R1-15 | 交用户 |
| R1-23 | builtin-list / 弹窗 | 弹窗与面板的 Esc 归属 | 阻断 | 同 R1-15 | 交用户 |
| R1-24 | controller / 场景与主 UI | 组件外 `client` 矛盾 | 阻断 | 明确矛盾 | 修 |
| R1-25 | replace / 可替换项 | mode/validate 约定在哪 | 阻断 | 缺前置（存档语义） | 交用户 |
| R1-26 | perf / 命中 | 全屏 image 加 noevent 后点击落点 | 非阻断 | 文档已答（透明遮罩需 noevent） | 不修 |
| R1-27 | inv2 / 真实数据 | 真实背包映射、onSelect 与 emits | 阻断 | 缺前置（跨数据端） | 交用户 |
| R1-28 | inv5 / 使用与装备 | 真实 equip/useItem | 阻断 | 缺前置（跨数据端） | 交用户 |
| R1-29 | inv6 / 最终组装 | `hidden` 变量谁设 | 阻断 | 步骤缺失 | 交用户 |
| R1-30 | inv6 / 验证清单 | hide 与 close 的「再次打开」矛盾 | 阻断 | 明确矛盾 | 修 |

统计：**第 1 轮（D-94）阻断 16 条，非阻断 14 条（按篇汇总计）；阻断中已修 5 条、交用户 11 条。**

概率继承：旧轮次的 178 行分节概率不再作为有效输入（旧轮次作废）；本轮新增/重写章节概率由读者在 D-94 记录中标注为「高（组件外 client、真实数据接入、Input 焦点与按键优先级、素材登记）、中（UI 容器 loc、hidden 成本、过渡 API）、低（filter 取值、ellipse 映射、自定义字体）」。

状态：已汇总

#### 重跑 Round 1 修订

- R1-01：已修 → `docs/advanced/ii/ui/ui-template.md#文件放在哪里、怎么被用到`：说明 `client` 是 `src/bootstrap.ts` 已有的客户端实例、不是全局变量；组件内只能用 `props.controller` / `props.state.sceneController`。
- R1-12：已修 → `docs/advanced/ii/ui/reactivity.md#响应式与元素生命周期的边界`与`#边界与注意`：把两处 `v-if` 例子改为 TSX 的三元/`&&` 条件渲染，并明确「TSX 里不要写 `v-if`」。
- R1-21：已修 → `docs/advanced/ii/ui/builtin-text-and-input.md#特殊组件 InputBox：单次输入`：补充普通子组件弹输入/确认框的两种写法（把 `controller` 当普通 prop 传，或 emit 给顶层面板）。
- R1-24：已修 → 同 R1-01；并在 `#边界与注意` 把基类要求改写为「UI 组件用 `IGameUIPropsBase` + `DefaultProps`；普通子组件只需 `DefaultProps`」，消除与第 18 篇的措辞冲突。
- R1-30：已修 → `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md#最终验证清单`：注明清单按 `close` 写；改用 `hide` 时滚动位置保留，预期要相应改写。
- R1-10（附带澄清）：已修 → `docs/advanced/ii/ui/layer-transform-performance.md#事件坐标与 noevent`：明确 `hidden`/`noevent` 子树跳过命中遍历，不增加鼠标移动成本，但仍占内存与渲染树。
- R1-02、R1-09、R1-13、R1-15、R1-16、R1-22、R1-23、R1-25、R1-27、R1-28、R1-29：交用户（涉及 UI 容器实现、素材登记流程、数据端接口、存档语义或 Input 焦点/按键实现，无法仅凭文档在本次范围内确定）。

重跑 Round 1 修订完成：阻断 16 条，已修 5 条，交用户 11 条，未修 0 条。
本轮停止点：已完成汇总、分诊与阻断修订；未开始 Round 2；未跑最终门禁（到 22:05 停止）。

### 重跑 Round 2（D-94）

#### 读者

单读者（D-91 单读者口径）。人格：刚读完中级教程、想给自己的魔塔做一套自定义界面的作者；只掌握基础 TS/JS，没写过 UI，不知道 canvas，不会 Vue 组件写法；只能看这套文档，不能看源码，也没有人可以问。

阅读范围按 D-94：

- 先完整读非目标文档：`docs/intermediate/` 全部（`code-basics.md`、`combat-overview.md`、`data-plugins.md`、`data-state-overview.md`、`data-vs-render.md`、`enemy-aura.md`、`enemy-calculator.md`、`enemy-combat-script.md`、`enemy-final.md`、`enemy-map-damage.md`、`enemy-query.md`、`enemy-specials.md`、`enemy-status-hooks.md`、`events.md`、`flags.md`、`hero-attribute.md`、`hero-equipment.md`、`hero-items.md`、`hero-location.md`、`hooks.md`、`map-structure.md`、`map-tiles.md`、`replay-commands.md`、`src-tour.md`、`tile-store.md`）、`docs/advanced/index.md`、`docs/advanced/i/` 全部、`docs/advanced/ii/` 现有数据端（排除 `ui/`）、`docs/advanced/iii/` 全部、`docs/poc/render-demo.md`。
- 再按顺序读 25 篇目标文档（见下表），单读者一次读完。

原始记录见 `10-53-READER-REVIEW-ROUND2-D94.md`（25 条逐篇提问、8 条跨篇问题）。本节编号 `R2-01…R2-33` 为**本次重跑独立编号**，与上方已作废的第 2 轮 `R2-01…R2-69` 无关。

#### 逐篇提问

| 篇目 | 位置 | 我已经从文档知道什么 | 我还缺什么 | 我照着做会预期什么 |
| --- | --- | --- | --- | --- |
| `docs/advanced/ii/ui/ui-template.md` | 「一个最小 UI」「打开与关闭」「边界与注意」 | UI 由 Props、props 列表、组件、`GameUI` 四部分组成；面板根 `[0,0]` 相对 UI 容器；`controller`/`instance`/`state` 必须写进 props 列表；打开时传 `GameUI` 对象 | 独立文件里没有 `props`，`bootstrap.ts` 的 `client` 又只在启动文件；缺「此刻我人在哪里、该用哪个入口」的判断 | 可能选错控制器，或拿不到 `props` 打不开 |
| `docs/advanced/ii/ui/container-and-coordinates.md` | 「渲染树」「坐标与变换」「loc 与锚点」「边界与注意」 | 画布根 → UI 容器（控制器创建）→ 面板根 → 元素；子元素相对父容器；锚点决定落点；`zIndex` 同父级比较；容器不裁剪绘制但命中受父矩形限制 | UI 容器自身在哪里、多大、是否等于画布根、是否铺满 | 面板出现在左上角；画布小于 480×320 时被裁，大时也不自动居中 |
| `docs/advanced/ii/ui/basic-shapes.md` | 「填充、描边与命中」组合表 | `g-rect`/`g-circle`/`g-ellipse`/`g-line` 几何参数；`fill`/`stroke`/`strokeAndFill` 是模式开关；颜色在 `fillStyle`/`strokeStyle`；`actionStroke` 跟 `lineWidth` | `fill={false}` 且 `stroke={false}` 仍是填充；做「不可见但可点」或「不可见且不挡事件」该用哪个组合 | 想关填充时可能仍看到填充，只能改用透明色或包一层 |
| `docs/advanced/ii/ui/curves-and-paths.md` | 「路径与曲线的坐标基准」「路径在渲染树与命中中的位置」 | 贝塞尔无 `loc`、点相对父容器；`g-path` 的 `Path2D` 是元素局部坐标；自动取包围盒；路径按几何轮廓命中；`Path2D` 不能进存档 | 数据变化时何时重建 `Path2D`；旋转/缩放围绕哪个点，未与锚点一起说明 | 动态路径可能每次渲染重建，或建一次后永不更新；旋转中心可能不符预期 |
| `docs/advanced/ii/ui/text.md` | 「尺寸与居中」「loc 与锚点」 | `text` 只画一行，宽高由测量决定；`fillStyle` 默认白色；`anchorX={1}` 右对齐；文字默认不缓存 | 示例在 `loc` 后两项写 `0.5,0.5` 又同时写 `anchorX`/`anchorY`，正文说只写一种；固定占位该包什么尺寸的容器 | 复制示例可能依赖属性处理顺序；固定占位要反复试外层容器 |
| `docs/advanced/ii/ui/image-and-texture.md` | 「纹理从哪里来」「从素材管理器取纹理」「像素图与高清缓存」 | `image` 把纹理铺满 `loc`；`Texture` 接受 canvas/ImageBitmap/Image；素材管理器返回 `ITexture \| null`；像素图用 `noanti`；`hd` 只对缓存元素生效 | `<image>` 接受 `Texture` 还是 `ITexture`、两者是否同一类型；纹理生命周期要调用什么；`ImageBitmap` 是否要 `close()` | 自己生成的纹理能画；从素材管理器取图时类型对不上，不知是否要转换 |
| `docs/advanced/ii/ui/layer-transform-performance.md` | 「变换」「缓存与脏更新」「边界与注意」 | `scale` 是 `[x,y]`、`rotate` 弧度、`alpha` 0–1；`zIndex` 同父级；`hidden` 保留状态、三元销毁；`container` 默认缓存、`nocache` 优先；`custom` 改外部数据要手动触发更新 | 整块 720×480 面板适配不同画布时，该改根 `loc` 与布局还是加根 `scale`；`custom` 主动更新的 API 名 | 单元素缩放能做；整块适配可能算错坐标或缩掉命中；`custom` 可能不重绘 |
| `docs/advanced/ii/ui/reactivity.md` | 「ref」「什么时候会重渲染」「shallowRef 与 markRaw」「nextTick」 | TSX 里 `ref` 写 `.value`；`reactive` 不能整体替换；`computed` 惰性缓存；`watch` 做副作用；`nextTick` 只保证更新处理完 | 想等「浏览器真正画完这一帧」时的具体 API；`shallowRef` 装大数组时列表 `key`、滚动位置与子组件状态是否保持 | 可能只等到 `nextTick`；大列表优化后状态可能重置 |
| `docs/advanced/ii/ui/events.md` | 「事件对象」「stopPropagation」「enter 与 leave」「命中测试」 | 命中从根开始、`zIndex` 大优先、同值后加入优先；捕获父→子、冒泡子→父；`stopPropagation` 不阻止同元素同事件其它监听器；`enter/leave` 由 hover 集合做差集；`offsetX/Y` 局部、`absoluteX/Y` 画布 | 父容器冒泡回调里想知道「最初点中的子元素」，但 `target` 是当前元素；`MouseType.Left` 的数值 | 点击换色/顺序能跑；最初目标与左键判断可能写错 |
| `docs/advanced/ii/ui/hotkey-in-ui.md` | 「注册新指令与分组」「优先级与阻断」「默认按键」「按键与 UI 栈」 | `useKey` 必须 setup 同步调用；`implement` 接回调；`addCommand` 注册默认键；`HotkeyEmitMode` 三种；`priority`/`block` 只对抬起有效；只有栈顶作用域实现会执行 | 默认表里 `@common/exit` 与 `@ui/menu` 都默认 Escape，缺「按 Esc 到底关面板还是开菜单」的判断 | 面板可能关了又弹出菜单，或两条都执行 |
| `docs/advanced/ii/ui/conditional-and-list-rendering.md` | 「hidden 与三元」「key」「列表项的事件与状态」 | `hidden` 保留实例/状态/监听，三元销毁；`.map()` 生成元素数组；`key` 同父级唯一；`ref` 数组 `push/splice` 触发，`shallowRef` 整体替换；列表项回调用闭包拿当前项 | 组件返回「行数组」时行容器与格子的 `key` 分别写哪层；`hidden` 面板里的 `Input` 与按键作用域是否仍活跃 | 组件数组的 `key` 可能放错层；隐藏面板可能仍占 Esc |
| `docs/advanced/ii/ui/props.md` | 「props 的完整管线」「默认值」「props 是响应式的」 | `props` 数组是运行时白名单，未声明进 `attrs`；默认值用 `props.x ?? 默认`；`props` 响应式、不要解构；UI 的 `controller/instance/state` 由控制器注入 | 父级改 `item.count` 时，子组件读 `props.item.count` 是否自动更新；对象型 prop 内部字段是否仍被追踪 | 简单值会更新；嵌套对象的 `count` 可能不同步 |
| `docs/advanced/ii/ui/component-tsx.md` | 「组件如何映射成一棵子树」「生命周期」 | 组件不产生节点、根元素是挂载点；多根成为同一父级多个子元素；`setup` 返回 render；`onMounted/onUnmounted` 同步调用；`expose` 只暴露必要方法 | 数组根组件（如 `ItemGrid`）被父级传 `loc`/`onClick` 时，未声明属性落到哪 | 单根组件正常；数组根组件的 `loc` 可能丢或落到第一个节点 |
| `docs/advanced/ii/ui/slots-and-attrs.md` | 「具名 slot」「slot 在渲染树里的位置」「attrs」 | TSX 里 slot 是函数；具名 slot 用对象；slot 内容在父作用域求值、插入子组件根下；未声明属性进 `attrs`；声明 `emits` 的 `onClick` 不透传 | 子组件根容器的尺寸/位置如何影响 slot 内容布局；`Field` 透传 `onClick` 与内部同名监听是否叠加 | slot 内容位置受根容器影响；事件归属可能变成内部 `text` |
| `docs/advanced/ii/ui/builtin-text-and-input.md` | 「Textbox」「Input 的受控边界」「InputBox」 | `TextContent` 的 `width` 必填、`loc` 第三项被覆盖；`autoHeight` 跟内容；`Textbox` 有标题/背景/内边距；`Input` 用 `v-model:value`；失焦只移除真实输入框；取消返回空串/`NaN` | `Textbox` 宽高来自 `width/height` 还是 `loc` 第三、四项；只写 `loc`、不写 `width` 时正文有没有排版宽度；`hidden` 容器里的 `TextContent` 是否仍测量 | 长文能折行、输入受控；`Textbox` 尺寸可能不按 `loc` 生效 |
| `docs/advanced/ii/ui/builtin-list-and-containers.md` | 「List」「Scroll」「ListPage」「Page」 | `List` 内部有自己的选中值、初值取第一项、点击发 `update:selected`；`ListPage` 左列表右详情；`Page` 页码从 0；`Scroll` 只对直接子元素虚拟滚动；弹窗一次性 | 打开面板时如何程序化选中某一项；`Scroll` 的直接子元素按渲染元素还是 VNode children 判断 | 用户点击能选中；初始选中不是第一项时高亮与详情不一致，且不知怎么用代码修正 |
| `docs/advanced/ii/ui/ui-controller-and-stack.md` | 「控制器、实例与栈」「背景」「栈策略」 | `open` 返回实例、`close` 卸载、`hide/show` 只改可见性；`alwaysShow` 不被 `hide`；`keep` 防闪；`lastOnly`/`showAll`；`zIndex` 是 `i*5`；`active`/`showBack` 是引用值 | `mainUIController.render()` 要放进主场景哪个容器、该容器在画布上的 `loc` 与尺寸；面板根相对谁定位、会不会被裁 | 面板可能出现在主场景容器左上角，尺寸/位置与画布不匹配 |
| `docs/advanced/ii/ui/replace-builtin-ui.md` | 「替换步骤」第二步、「风险与边界」 | 替换点是打开处或包装层；`openSettings` 是工具栏/快捷键/插件共用入口；`loc` 由调用方在 `vBind` 传；`@common/exit` 已注册，直接 `implement` 覆盖；存档返回值语义必须保留 | 第 1 篇说要同时继承 `IGameUIPropsBase` 与 `DefaultProps`，本篇最小示例只继承前者；只读文档无法搜索所有 `openSettings` 调用方 | 基类可能少写；只改一个入口时其它入口仍开旧设置 |
| `docs/advanced/ii/ui/ui-performance.md` | 「显示开关」「UI 栈」「缓存」「症状与排查」 | 缓存适合结构复杂、内容稳定的子树；`hidden` 保留元素/状态/监听/按键作用域，三元卸载；大量列表用 `Scroll`；装饰层加 `noevent`；先测再改 | 「关闭背包」该用 `close` 卸载还是 `hide` 保留；第 17 篇说能 `hide` 就不重建，本篇说长期不用的大子树应卸载 | 用 `hide` 保留滚动位置但按键作用域与内存还在；用 `close` 又每次重建 |
| `docs/advanced/ii/ui/inventory-example-1-skeleton.md` | 「骨架在渲染树里的位置」「打开它」 | 最终面板 720×480；根下背景、主体、标题、关闭按钮、左右占位；关闭归 `InventoryPanel`；状态归面板；`InventoryUI` 用 `GameUI` 注册；三个打开入口 | 示例站画布 480×320，720×480 会超出；缩放由谁做、怎么居中、打开时 `loc` 传什么；第一次验证用哪个控制器 | 照抄后只看到左上角；不知该改根 `loc`、改内部布局还是加 `scale` |
| `docs/advanced/ii/ui/inventory-example-2-grid.md` | 「ItemGrid」「数据如何进入网格」 | `Item` 只在 `item-grid.tsx` 定义一次；5 列、`cellSize=66`、`gap=8`；`ItemCell` 只收 `item/selected/size`；`ItemGrid` 用 `computed` 算列数/尺寸；点击三层上报；`key=item.id` | 窗口适配、列数或格子尺寸变化时，`ItemCell` 在 setup 里读一次的 `size` 不会跟着变；缺「哪些 props 要改成 computed/render 读取」的清单 | 缩放或改 `cellSize` 后，格子容器变了而 `ItemCell` 内部仍按旧尺寸画 |
| `docs/advanced/ii/ui/inventory-example-3-detail.md` | 「详情区的树结构」「空态与边界」 | `selectedId` 用 `ref<string \| null>(null)`；`selectedItem` 用 `computed` + `?? null`；提示/详情用 `hidden` 切换；`TextContent width=164`、`autoHeight`；`clear` 只上报 | 提示容器与详情容器都没写 `loc` 尺寸，默认 200×200，而详情区宽 196；内部容器是否需要尺寸、是否影响命中；隐藏的 `TextContent` 是否仍测量 | 选中/取消能切换；内部容器命中范围可能比详情区宽；隐藏文本可能撑出高度 |
| `docs/advanced/ii/ui/inventory-example-4-scroll.md` | 「Scroll 在渲染树里的位置」「数据与选中态如何穿过滚动层」 | `Scroll` 只对直接子元素虚拟滚动；`ItemGrid` 根从单容器改成行数组；行 `key=row`、格子 `key=item.id`；`scrollTo` 收内容像素；`getScrollLength` 是总长减视口；`padEnd` 像素 | `Scroll` 判断「直接子元素」看渲染后元素还是 VNode children；`<ItemGrid>` 是组件 VNode，会不会只看到一个组件 | 40 件道具能滚；若按 VNode children 判断，虚拟滚动可能退化成整块 |
| `docs/advanced/ii/ui/inventory-example-5-state.md` | 「状态放在 InventoryPanel」「已装备的格子」「遮罩与 noevent」 | 面板持有 `items/selectedId/equippedId/hint`；`canEquip/canUse/isEquipped` 是 `computed`；`use` 直接改 `item.count`；`watch` 只更新提示；`ActionBar` 只发 `equip/use/close`；遮罩用 `noevent` | `use` 改的是 `selectedItem.value.count`，`ItemGrid`/`ItemCell`/`ItemDetail` 收到的是对象；通过 prop 传下去的对象内部字段是否被追踪 | 数量减一、按钮变淡；若内部字段未追踪，可能提示更新了而格子/详情不刷新 |
| `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` | 「动画作用在树的哪一层」「最终组装与契约核对」「注册与打开」 | 动画只改 `pulse`/`hintAlpha`，`onUnmounted` 里 `cancelAnimationFrame`；最终拆五个文件；`InventoryUI` 在面板文件导出、`index.ts` 再导出；从 `mainUIController` 打开；验证清单覆盖选中/滚动/装备/使用/关闭/再次打开 | 最终骨架有两层同尺寸 `container [0,0,720,480]`：外层放背景/遮罩、内层放内容；哪层接收 `hidden`/`zIndex` attrs、哪层是 UI 实例根 | 动画与面板能跑；根层级多一层时 `hidden`/`zIndex` 可能落到错误容器 |

#### D-93 复述检查

- **渲染树**：画布根下是控制器创建的 UI 容器，再往下是面板根容器、区域容器与叶子。组件本身不产生节点，组件的根元素才是父树的挂载点；返回多个根就是同一父级下多个子元素。容器决定子元素局部坐标系、同父级兄弟的 `zIndex` 排序与缓存边界；容器不裁剪绘制，但命中受父容器矩形限制。`hidden` 保留元素与状态，只跳过绘制和命中；`noevent` 仍绘制但整棵子树跳过命中。
- **事件捕获/冒泡**：指针落下后从根开始按 `zIndex` 从大到小命中，同值取后加入的；图形按几何轮廓命中。命中后先捕获（根 → 命中元素），再冒泡（命中元素 → 根）。`stopPropagation` 在任一阶段截断传播，但不阻止同一元素同事件的其它监听器。`onEnter/onLeave` 不走普通冒泡，由根维护的 hover 集合做差集触发。`offsetX/Y` 是当前元素局部坐标，`absoluteX/Y` 是画布坐标。
- **组件 props/slots/attrs**：父组件写的属性先进入子组件 VNode props；只有子组件 `props` 数组里列出的键才进入 `setup(props)`，没列出的进入 `attrs`。`attrs` 默认透传到根元素，`inheritAttrs: false` 可关闭自动透传后再手动 `{...attrs}`。slot 在 TSX 里是函数，子组件用 `slots.default?.()` / `slots.title?.()` 调用；具名 slot 用对象传入。UI 的 `controller/instance/state` 由控制器注入，必须写进 props 数组。
- **内置组件**：`TextContent` 负责按 `width` 折行、测量、打字机与 `showAll/retype/getHeight`；`Textbox` 在文本外加背景/标题/内边距/图标；`Input` 用真实 DOM 输入框覆盖画布，`v-model:value` 受控；`InputBox/getInput/getInputNumber` 是一次性弹窗，取消时 `getInput` 返回空串、`getInputNumber` 返回 `NaN`；`List` 管行布局、点击选中、选中光标与滚动，内部选中初值取第一项；`ListPage` 是左列表右详情；`Page` 管页码与箭头，索引从 0；`Scroll` 只对直接子元素做虚拟滚动；`ConfirmBox/Choices` 通过 `getConfirm/getChoice` 返回结果。

#### 跨篇问题（8 条原意）

1. **UI 的 Props 基类到底要不要 `DefaultProps`**：第 1 篇说 UI 必须同时继承 `IGameUIPropsBase` 与 `DefaultProps`；第 18 篇的最小示例只继承前者，并说 `DefaultProps` 只是类型提示。
2. **720×480 面板与 480×320 画布**：骨架篇和最终篇都按 720×480 写坐标，示例站画布是 480×320；文档说「先按画布调根或整体缩放」，但没说缩放由控制器、面板根还是打开处负责，也没给主 UI 容器的 `loc`。
3. **关闭背包用 `close` 还是 `hide`**：UI 栈篇说能 `hide/show` 就不重建，性能篇说长期不用的大子树应卸载；按键篇说 `hidden` 不离开按键作用域，输入篇说 `hide` 不会让输入框失焦。
4. **`Scroll` 与「组件返回行数组」**：示例（四）依赖「组件本身不是节点、返回的行会成为 `Scroll` 直接子元素」；但无法确认 `Scroll` 按渲染后元素还是 VNode children 判断「直接子元素」。
5. **`Textbox` 的尺寸来源**：文本与输入篇一处说宽高来自 `width/height` 或 `loc` 第三、四项，示例又同时写 `width` 与 `loc` 宽高；`TextContent` 则是 `width` 必填、`loc` 第三项被覆盖。
6. **`props` 传对象后内部字段的响应式**：props 篇说 props 是响应式的，响应式篇说 `ref` 数组内部是深层响应式；示例（五）通过 `items.value` 把数组传给 `ItemGrid`，再逐项传给 `ItemCell`，不确定父级改 `item.count` 时子组件是否都更新。
7. **默认按键的重叠**：按键篇的默认按键表里 `@common/exit` 和 `@ui/menu` 都是 Escape；`priority`/`block` 只对抬起触发有效，但没有给这两条默认指令的优先级。
8. **事件的最初目标**：事件篇说每个元素拿到的事件对象里 `target` 都是它自己；父容器冒泡时想判断「最初点中的是哪个子元素」该读什么，文档没有给字段或替代做法。

#### 第 2 轮（D-94）分诊

| 编号 | 篇目/章节 | 问题摘要 | 是否阻断 | 理由（D-91） | 处理 |
| --- | --- | --- | --- | --- | --- |
| R2-01 | `docs/advanced/ii/ui/ui-template.md`「一个最小 UI」「打开与关闭」 | 文件放好后从哪打开、三个入口怎么选 | 否 | 文档已给三个入口与 `src/bootstrap.ts` 示例，并注明首次验证用 `sceneController` | 不修 |
| R2-02 | `docs/advanced/ii/ui/container-and-coordinates.md`「渲染树」 | UI 容器自身 loc/尺寸未知 | 是 | 缺前置 + D-93 渲染树模型；由引擎创建，文档无法给出 | 交用户 |
| R2-03 | `docs/advanced/ii/ui/basic-shapes.md`「填充、描边与命中」 | 透明热区与 `noevent` 的组合 | 否 | 文档已给 `alpha={0}` 与 `noevent` 写法 | 不修 |
| R2-04 | `docs/advanced/ii/ui/curves-and-paths.md`「路径与曲线的坐标基准」 | 动态 `Path2D` 重建时机、旋转中心 | 否 | 实现细节 / 额外深度 | 不修 |
| R2-05 | `docs/advanced/ii/ui/text.md`「尺寸与居中」 | `loc` 后两项与 `anchorX`/`anchorY` 重复 | 否 | 文档已明确「同一处只写一种」，示例仅示对应关系 | 不修 |
| R2-06 | `docs/advanced/ii/ui/image-and-texture.md`「从素材管理器取纹理」 | `Texture` 与 `ITexture` 是否同一类型 | 否 | 文档已给返回类型与「用法与上一节完全一样」 | 不修 |
| R2-07 | `docs/advanced/ii/ui/layer-transform-performance.md`「变换」「缓存」 | 整块面板缩放做法、`custom` 更新 API 名 | 否 | 额外深度；`custom` 不在示例主流程 | 不修 |
| R2-08 | `docs/advanced/ii/ui/reactivity.md`「ref」「nextTick」 | 等浏览器真正画完的 API、`shallowRef` 列表状态 | 否 | 额外深度 | 不修 |
| R2-09 | `docs/advanced/ii/ui/events.md`「事件对象」 | 父容器如何拿「最初目标」、`MouseType.Left` 数值 | 否 | 文档已给「看哪个元素回调被触发 / 用 absolute 坐标比较」；枚举值属额外 | 不修 |
| R2-10 | `docs/advanced/ii/ui/hotkey-in-ui.md`「默认按键」「按键与 UI 栈」 | `@common/exit` 与 `@ui/menu` 同为 Escape | 否 | 作用域栈已说明「只有栈顶作用域实现会执行」 | 不修 |
| R2-11 | `docs/advanced/ii/ui/conditional-and-list-rendering.md`「key」 | 行数组的 `key` 放哪层、`hidden` 里 Input/按键是否活跃 | 否 | 第 10 篇已说明 `hidden` 不离开按键作用域；`key` 属细节 | 不修 |
| R2-12 | `docs/advanced/ii/ui/props.md`「props 是响应式的，不要解构」 | 对象型 prop 的内部字段是否被追踪 | 是 | D-93 模型未讲清：只说了 props 响应式，未说内部字段的追踪条件 | 修 |
| R2-13 | `docs/advanced/ii/ui/component-tsx.md`「映射成一棵子树」 | 数组根组件的未声明属性落点 | 否 | 设计取舍；文档已说多根需自行安排 `loc`/`zIndex` | 不修 |
| R2-14 | `docs/advanced/ii/ui/slots-and-attrs.md`「slot 在渲染树里的位置」 | 子组件根尺寸对 slot 的影响、两个 `onClick` | 否 | 边界情况 | 不修 |
| R2-15 | `docs/advanced/ii/ui/builtin-text-and-input.md`「Textbox」 | `Textbox` 宽高来自 `width/height` 还是 `loc` | 是 | 明确矛盾：与 `width` 必填的实现/前文说法冲突 | 修 |
| R2-16 | `docs/advanced/ii/ui/builtin-list-and-containers.md`「List」「Scroll」 | 程序化选中、`Scroll` 直接子元素判定 | 否 | `List` 为组件限制（设计取舍）；`Scroll` 已在示例（四）说明 | 不修 |
| R2-17 | `docs/advanced/ii/ui/ui-controller-and-stack.md`「场景 UI 与主 UI」 | `mainUIController.render()` 挂到哪个容器 | 是 | 缺入口；与 R2-02 同根因，依赖引擎/主场景实现 | 交用户 |
| R2-18 | `docs/advanced/ii/ui/replace-builtin-ui.md`「替换步骤」 | `DefaultProps` 是否必须、入口清单 | 否 | 文档已澄清 `DefaultProps` 为推荐写法；入口已给搜索起点 | 不修 |
| R2-19 | `docs/advanced/ii/ui/ui-performance.md`「显示开关」 | 关闭背包用 `close` 还是 `hide` | 否 | 设计取舍（内存 vs 状态保留） | 不修 |
| R2-20 | `docs/advanced/ii/ui/inventory-example-1-skeleton.md`「骨架在渲染树里的位置」 | 720×480 与 480×320 的缩放/居中/`loc` | 是 | 缺步骤：只说两种做法，未给首次验证的具体做法 | 修 |
| R2-21 | `docs/advanced/ii/ui/inventory-example-2-grid.md`「按行列排列」 | 根尺寸写死、尺寸变化联动 | 否 | 维护性偏好；响应式部分同 R2-12 | 不修 |
| R2-22 | `docs/advanced/ii/ui/inventory-example-3-detail.md`「详情区的树结构」 | 内部容器默认 200×200、隐藏文本测量 | 否 | 布局细节；默认尺寸已写 | 不修 |
| R2-23 | `docs/advanced/ii/ui/inventory-example-4-scroll.md`「数据与选中态穿过滚动层」 | 行数组是否算 `Scroll` 直接子元素 | 否 | 示例（四）已明确行会平铺为直接子元素 | 不修 |
| R2-24 | `docs/advanced/ii/ui/inventory-example-5-state.md`「状态放在 InventoryPanel」 | 通过 prop 传对象后内部字段是否追踪 | 是 | 同 R2-12 | 修 |
| R2-25 | `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md`「最终组装」 | 两层同尺寸容器谁接 `hidden`/`zIndex` | 否 | 文档已说明外层画布根/内层面板根；attrs 落根见第 12 篇 | 不修 |
| R2-26 | 跨篇 1：`ui-template` / `replace-builtin-ui` | `DefaultProps` 是否硬要求 | 否 | 与 R2-18 同，已澄清 | 不修 |
| R2-27 | 跨篇 2：`inventory-example-1` / `container-and-coordinates` | 720×480 与 480×320 的两套读法 | 是 | 同 R2-20 | 修 |
| R2-28 | 跨篇 3：`ui-controller-and-stack` / `ui-performance` | `close` 与 `hide` 的选型 | 否 | 设计取舍 | 不修 |
| R2-29 | 跨篇 4：`inventory-example-4` / `component-tsx` | `Scroll` 与组件边界 | 否 | 示例（四）已给结论 | 不修 |
| R2-30 | 跨篇 5：`builtin-text-and-input` | `Textbox` 尺寸来源 | 是 | 同 R2-15 | 修 |
| R2-31 | 跨篇 6：`props` / `reactivity` / `inventory-example-5` | props 传对象的内部字段响应式 | 是 | 同 R2-12 | 修 |
| R2-32 | 跨篇 7：`hotkey-in-ui` | 默认按键重叠 | 否 | 作用域栈已答；优先级只对同次匹配生效 | 不修 |
| R2-33 | 跨篇 8：`events` | 事件的最初目标 | 否 | 文档已给替代做法 | 不修 |

第 2 轮（D-94）阻断数：9（R2-02、R2-12、R2-15、R2-17、R2-20、R2-24、R2-27、R2-30、R2-31）。
第 2 轮（D-94）非阻断数：24。

概率继承：Round 1（D-94）的分节概率继续有效；本轮新增/重写章节需补该节概率。读者在 D-94 记录中标注的高频困惑集中在「UI 容器落点」「对象型 prop 的内部字段」「Textbox 尺寸来源」「720×480 与画布适配」。

状态：已汇总

#### 重跑 Round 2 修订

R2-12：已修 → `docs/advanced/ii/ui/props.md#props 是响应式的，不要解构`：补对象型 prop 的内部字段追踪条件（父级传 `ref`/`reactive` 中的对象则内部字段被追踪；普通对象字面量不会）。
R2-15：已修 → `docs/advanced/ii/ui/builtin-text-and-input.md#文本组件的用法与组合`：把「宽高来自 `width`/`height` 或 `loc`」改为 `width` 必填、正文宽度只取 `width`，正文区高度取 `loc` 第四项、未写按 `200` 兜底。
R2-20：已修 → `docs/advanced/ii/ui/inventory-example-1-skeleton.md#骨架在渲染树里的位置`：补示例站 480×320 的首次验证做法（面板根 `scale={[2/3,2/3]}`、`loc` 不变），并说明正式适配时改根 `loc` 与内部布局、不要同时加缩放。
R2-24：已修 → 同 R2-12；`inventory-example-5` 的 `item.count` 场景由 props 篇补齐追踪条件。
R2-27：已修 → 同 R2-20。
R2-30：已修 → 同 R2-15。
R2-31：已修 → 同 R2-12。
R2-02、R2-17：交用户（UI 容器自身 loc/尺寸与主 UI 容器挂载由引擎/主场景实现决定，仅凭文档无法给出；与 Round 1 的 R1-02 同根因）。

第 2 轮（D-94）修订统计：阻断 9 条，已修 7 条（落在 3 处正文：`props.md`、`builtin-text-and-input.md`、`inventory-example-1-skeleton.md`），交用户 2 条，未修 0 条。

### 重跑 Round 3（D-94）

#### 读者

单读者（D-91 单读者口径）。人格：刚读完中级教程、想给自己的魔塔做一套自定义界面的作者；只掌握基础 TS/JS，没写过 UI，不知道 canvas，不会 Vue 组件写法；只能看这套文档，不能看源码，也没有人可以问。

阅读范围按 D-94：先完整读完非目标文档（`docs/intermediate/` 全部、`docs/advanced/index.md`、`docs/advanced/i/` 全部、`docs/advanced/ii/` 除 `ui/` 外全部、`docs/advanced/iii/` 全部、`docs/poc/render-demo.md`），再按顺序读完 25 篇目标文档。原始记录见 `10-53-READER-REVIEW-ROUND3-D94.md`（124 条逐篇提问、14 条跨篇问题）；本轮为第 3 轮，也是循环的最后一轮。

#### 逐篇提问

原始记录按篇逐条列出 124 条；下表把 25 篇的目标路径归一化为完整路径，并汇总每篇的提问位置与缺口。

| 篇目（完整路径） | 涉及位置 | 缺什么（汇总） | 条数 |
| --- | --- | --- | --- |
| `docs/advanced/ii/ui/ui-template.md` | 最小 UI / 文件放在哪里 / GameUI 对象 / open 第二参数 / 两条写法 | `defineComponent` 各段职责与能否省略；第一次 open 写在哪个已有文件；实例 `key` 的读取示例；子组件能否反写 props；元素层 `root` 由谁挂载 | 5 |
| `docs/advanced/ii/ui/container-and-coordinates.md` | loc 与锚点 / 坐标与变换 / 渲染树 / 坐标基准 / 嵌套示例 | 只写 `x`/`y` 是否合法；命中是否按变换逆算；父容器命中矩形是变换前还是后；`renderer` 实际宽高与 480×320；元素层 `root` 的挂载入口 | 5 |
| `docs/advanced/ii/ui/basic-shapes.md` | 四个图形 / 填充描边命中 / actionStroke / 图形零件 | `g-circle` 能否用 `loc`；`strokeAndFill` 与 `fill`+`stroke` 同时写的优先级；`actionStroke` 对 `g-rectr`；文字「可命中」是否等于「绑了监听」 | 5 |
| `docs/advanced/ii/ui/curves-and-paths.md` | 路径坐标基准 / 路径 / 圆角矩形 / 路径在渲染树与命中中的位置 | 自动取包围盒后 `x`/`y`/`w`/`h` 是否可读；props 变化时 `Path2D` 何时重建；`ellipse` 的 0 组是否表示直角；路径超出父容器时命中谁优先 | 4 |
| `docs/advanced/ii/ui/text.md` | 尺寸与居中 / 字体 / 一行文字 / 缓存 / 不自动换行 | `loc` 后两项与 `anchorX`/`anchorY` 重复写法；`addFallback` 的调用形式；元素层文字描边宽度；缓存键包含哪些属性；`TextContent` 的 `width` 与 `loc` 第三项 | 5 |
| `docs/advanced/ii/ui/image-and-texture.md` | 图片元素与纹理 / 纹理来源 / 加载 PNG / 素材管理器 / 像素图 | `image` 接收 `Texture` 还是 `ITexture`；`ITexture` 从哪导入；卸载后是否要取消加载；`ITexture` 的公开成员；`anti`/`noanti` 的默认值 | 5 |
| `docs/advanced/ii/ui/layer-transform-performance.md` | 遮挡 zIndex / 变换 / 缓存与脏更新 / filter 与 composite / 事件坐标与 noevent | `zIndex` 不写时的默认值；能否绕任意点变换；缓存分辨率与 `hd` 默认值；`filter`/`composite` 的可取值；父级 `noevent` 后子元素能否恢复命中 | 5 |
| `docs/advanced/ii/ui/reactivity.md` | 数据变化 / ref / reactive / shallowRef 与 markRaw / watch | 元素不重建是否代表普通变量保留；项目是否已装 vue；`toRefs` 的写法；`markRaw` 与 `shallowRef` 的组合；`watch` 默认深浅 | 5 |
| `docs/advanced/ii/ui/events.md` | 命中测试 / 事件名 / 事件对象 / MouseType / enter 与 leave | 同 `zIndex` 的稳定性；按下与抬起跨元素的 click 归属；最初命中的元素怎么取；`MouseType.Left` 能否当位掩码；`noevent` 容器的子元素是否还有 enter/leave | 5 |
| `docs/advanced/ii/ui/hotkey-in-ui.md` | useKey / 注册指令 / 优先级与阻断 / 默认按键 / 按键与 UI 栈 | 普通子组件怎么拿 `props.state.hotkey.system`；`addCommand` 返回类型与 `setGroup` 入参；`priority`/`block` 对 Once/Continuous 是否生效；`@common/exit` 与 `@ui/menu` 同为 Esc；`useKey(false)` 的继承是复制还是引用 | 5 |
| `docs/advanced/ii/ui/conditional-and-list-rendering.md` | hidden 与三元 / map / key / 数据更新 / 列表项事件 | `hidden` 能否写在组件标签上；组件根能否返回数组；组件标签上的 `key` 落点；`reactive` 数组整体替换是编译错误还是静默；删除选中项后详情如何收口 | 5 |
| `docs/advanced/ii/ui/props.md` | props 管线 / 组件拿参数 / 泛型顺序 / 默认值 / 基础 props | 运行时类型错误是否报错；`DefaultProps` 具体包含哪些键；省略第二个参数后 props 从哪来；`computed` 是否跟随对象字面量；`loc` 是否算注入 | 5 |
| `docs/advanced/ii/ui/component-tsx.md` | 组件映射 / 完整组件结构 / 生命周期 / expose / 组件与 UI 的区别 | 多根组件的 attrs 落点；`setup` 为何返回函数；`onMounted` 里普通元素 `ref` 的类型；`expose` 的类型标注；`GameUI` 是否还需额外登记 | 5 |
| `docs/advanced/ii/ui/slots-and-attrs.md` | slot / 具名 slot / 作用域 slot / attrs / 组件边界事件 | slot 返回值为什么是 `VNode`、返回数组类型不匹配怎么办；传 slot 的双层花括号是什么语法；`attrs` 是否包含 `onClick`；多根组件未关 `inheritAttrs` 时事件落点；slot 坐标按哪一层计算 | 5 |
| `docs/advanced/ii/ui/builtin-text-and-input.md` | TextContent / Textbox / 长说明 / Input / InputBox | `TextContent` 的 `width` 与 `loc` 第三项；`Textbox` 的 `loc` 第四项与 `height` 谁生效；Input 失焦与 click 的先后；`InputBox` 示例里的 `void 0`；`Textbox` 的宽高来源 | 5 |
| `docs/advanced/ii/ui/builtin-list-and-containers.md` | List / List 行结构 / ListPage / Page / 弹窗 | 列表数据整体替换后内部选中是否重置；List 的 id 能否是数字；`ListPage` 的 `closeLoc` 相对谁；`pages` 变小时 `page` 是否夹紧；`getChoice` 的 key 能否是字符串 | 6 |
| `docs/advanced/ii/ui/ui-controller-and-stack.md` | 控制器实例与栈 / keep / 栈策略 / 场景 UI 与主 UI / 注入链 | `stack` 是否公开可读；`keep`「一次 close 清标记」与「close 到空栈不关背景」如何并存；`lastOnly` 从该实例起的方向；`mainUIController.render()` 返回什么、挂到哪；自定义 creator 的 `state` 从哪来 | 4 |
| `docs/advanced/ii/ui/replace-builtin-ui.md` | 替换入口 / 可替换项 / 替换步骤 / 风险与边界 | 内置入口函数的完整签名；`ElementLocator` 是否就是 `loc` 的数组类型；保留入口时原函数还做了哪些事；存档返回值的具体语义；包装组件如何转发 slots/attrs | 5 |
| `docs/advanced/ii/ui/ui-performance.md` | 定位 / 缓存 / 纹理与文字 / 观测 / UI 栈 | 浏览器性能面板怎么开；缓存「过大」的阈值；`image` 何时会有离屏缓存；长帧的判定标准；栈深成本是线性还是指数 | 5 |
| `docs/advanced/ii/ui/inventory-example-1-skeleton.md` | 树位置 / 骨架代码 / 打开它 / 运行效果 / 边界 | 720×480 与 UI 容器、画布的关系；骨架缺哪些 import；第一次打开放在哪个文件；live 的 720×480 与正文 480×320；没有素材时图标怎么画 | 5 |
| `docs/advanced/ii/ui/inventory-example-2-grid.md` | Item 数据模型 / ItemCell / ItemGrid / 数据进入 / 边界 | `import type` 是否造成运行时循环；`ItemCell` 的 `size` 只读一次；普通数组是否响应式；子组件改 props 对象字段；网格超出区域是否盖住详情 | 5 |
| `docs/advanced/ii/ui/inventory-example-3-detail.md` | 详情状态 / 树结构 / ItemDetail / 空态 / 运行效果 | `selectedId` 为 null 时的比较；两个未写尺寸的 `hidden` 容器是否互挡；空文本是否仍创建元素；外部替换 `items` 时如何清选中；live 与正文文字不一致 | 5 |
| `docs/advanced/ii/ui/inventory-example-4-scroll.md` | 为什么换滚动 / Scroll 位置 / 行容器数组 / 面板接入 / 滚动与事件 | 组件返回数组根是否被支持；滚动条宽度是否就是 28；`rows` 空数组的类型推断；`getScrollLength` 为负时如何；拖动阈值是多少 | 5 |
| `docs/advanced/ii/ui/inventory-example-5-state.md` | 操作条 / 面板状态 / 状态反映 / 关闭路径 / 遮罩 | 禁用按钮早返回是否吃掉点击；改 props 对象里的 `count` 是否算改 props；`watch` 在数量相同时不触发；Esc 实现放在 setup 哪一段；遮罩在内层还是外层 | 5 |
| `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` | 动画层 / 最终组装 / 注册与打开 / 验证清单 / 边界 | rAF 每帧写 `pulse` 是否重渲染整块；内层面板根为何存在、`hidden` 写哪层；打开代码的宿主；真实游戏里如何再次打开；live 失败时怎么排查 | 5 |

#### D-93 复述检查

- **渲染树**：能复述画布根 → UI 容器 → 面板根 → 区域/叶子的层级、局部坐标与变换继承、`zIndex` 兄弟排序、`hidden`/三元/`key` 的差别、容器默认缓存与脏标记上冒、组件不产生节点且多根成为同父级多个子元素。复述不出的在「组件根返回数组」「多根时 attrs 落点」「UI 容器自身尺寸」「`mainUIController.render()` 返回什么」。
- **事件**：能复述命中从根按 `zIndex` 向内、捕获父先、冒泡子先、`enter/leave` 集合差、`offset` 与 `absolute` 的坐标差、`noevent`/`actionStroke` 对命中的影响。复述不出的在「最初命中的元素怎么取」「`MouseType` 与 `buttons` 的位定义」「按下与抬起跨元素时 click 归属」「Scroll 拖动阈值」。
- **组件与内置组件**：能复述 props 四环与 attrs 分叉、`emits` 声明后不再透传、slot 是函数、`inheritAttrs`、UI 与普通组件的基类区别、`expose` + `ref`；能复述 `TextContent` 折行、`Textbox` 组成、`Input` 受控、`InputBox` 返回值、`List`/`ListPage`/`Page`/`Scroll` 的分工。复述不出的在「`DefaultProps` 具体键」「`Texture` 与 `ITexture` 的关系」「普通子组件拿按键 system」「slot 返回 `VNode` 与数组的差别」「包装组件转发 slots」。
- 结论：D-93 的三块模型（渲染树、事件、组件）都能复述主干，缺口集中在跨篇接口与少数默认值；没有出现「完全讲不出模型」的段落。

#### 跨篇问题（14 条原意）

1. **第一次 open 写在哪**：模板篇说去 `bootstrap` 或某个已有面板，但没有一篇给出「从零新建文件后，在哪个已有文件的哪一行调用 open」的完整片段。
2. **loc 的注入**：第 1 篇说只注入 `controller`、`instance`、`state`，第 18 篇说替换内置 UI 时组件必须接收 `loc` 且 `loc` 由打开方传；需要一份「UI 组件该声明哪些 props、分别由谁传」的清单。
3. **组件根能不能是数组**：第 11 篇说 map 必须放在有父容器的元素树里，第 23 篇说 `ItemGrid` 返回行数组直接作为 `Scroll` 的子元素。
4. **hidden 写在组件标签上**：第 11 篇只示范元素，第 12/14 篇说基础属性走 attrs 落到根元素；不确定给 `ItemDetail` 加 `hidden` 是否等价于给根容器加。
5. **keep 的清除语义**：第 17 篇一边说 close 到空栈不关背景，一边说一次 close 就清掉 keep 标记；不知道关旧面板那一下背景会不会闪。
6. **Texture 与 ITexture**：第 6 篇示例用 `new Texture`，素材管理器返回 `ITexture`，第 8 篇又建议 `markRaw` 纹理；不知道取到的对象能不能直接给 `image`。
7. **text.md 的居中示例**：既在 `loc` 后两项写 0.5，又写 `anchorX`/`anchorY` 为 0.5，正文却说只写一种。
8. **MouseType 与 buttons**：第 9 篇示例把 `MouseType.Left` 当位掩码和 `buttons` 做位与，但同一篇说 `MouseType` 是按键种类；不知道 `buttons` 的位定义在哪里。
9. **Scroll 的直接子元素跨组件边界**：第 16 篇说 `Scroll` 只检查直接子元素，第 23 篇说组件返回的行数组会成为直接子元素；不知道组件边界算不算一层节点。
10. **设计尺寸 480×320 与 720×480**：第 2 篇说画布设计尺寸来自 `renderer`，第 20 篇 live 用 720×480，正文又说示例站是 480×320；不知道验证时按哪个尺寸。
11. **useKey 在普通子组件**：第 10 篇说在组件 setup 里调用，示例都默认有 `props.state`；不知道子组件该由父级传 `system`，还是也能自己拿。
12. **List 的选中同步**：第 16 篇说父级初值要与第一项一致，挂载后再改 `selected` 不会改选；不知道列表数据整体替换时内部选中会不会重置。
13. **内置入口函数的完整签名**：第 18 篇表格只给 `openSettings`、`openReplay`、`saveSave` 等名字与参数轮廓，需要完整签名和返回值语义才能安全替换。
14. **image 的缓存**：第 6 篇说 `image` 默认不缓存，第 19 篇说每个元素仍可能有自己的离屏缓存；不知道什么时候会有。

#### 第 3 轮（D-94）分诊

判定口径按 D-91：只把缺前置、术语/类型未定义、步骤缺失导致无法继续、明确矛盾、缺 import/入口视为阻断；设计取舍、风格、详略、额外深度不算阻断。

本节编号 `R3-01…R3-43` 为 D-94 重跑的独立编号，与上方已作废的第 3 轮 `R3-01…R3-56` 无关。

| 编号 | 篇目/章节 | 问题摘要 | 是否阻断 | 理由（D-91） | 处理 |
| --- | --- | --- | --- | --- | --- |
| R3-01 | `docs/advanced/ii/ui/ui-template.md` | 模板各段职责、第一次 open、实例 key、子组件反写、元素层挂载 | 否 | 文档已给四段结构与 `bootstrap`/面板内两种入口；props 只读见第 12 篇；元素层示例是等价示意，挂载属控制器职责 | 不修 |
| R3-02 | `docs/advanced/ii/ui/container-and-coordinates.md`「loc 与锚点」 | loc 两两一组/只写 `[x, y]`；命中逆算、父容器矩形、画布尺寸、元素层挂载 | 是 | 明确矛盾：既说宽高可省，又说「两两一组要么都写、要么都不写」；其余项文档已答（第 9 篇/`renderer`/示例只讲嵌套） | 修 |
| R3-03 | `docs/advanced/ii/ui/basic-shapes.md` | g-circle 用 loc、描边组合、actionStroke、文字命中 | 否 | 「可命中」与「绑监听」是两件事，第 9 篇已答；其余属额外深度 | 不修 |
| R3-04 | `docs/advanced/ii/ui/curves-and-paths.md` | 包围盒后可读性、Path2D 重建、ellipse 0 组、父容器命中 | 否 | 额外深度与边界；动态 Path2D 属写法选择 | 不修 |
| R3-05 | `docs/advanced/ii/ui/text.md` | 居中重复写法、addFallback、元素层描边、缓存键、TextContent 宽度 | 否 | 正文已明确「同一处只写一种」，示例用于展示对应关系；其余属额外深度 | 不修 |
| R3-06 | `docs/advanced/ii/ui/image-and-texture.md`「从素材管理器取纹理」 | `Texture`/`ITexture` 类型与导入路径 | 是 | 缺 import + 类型未定义：按素材管理器取到的 `ITexture` 写 `ref<Texture>` 会对不上 | 修 |
| R3-07 | `docs/advanced/ii/ui/layer-transform-performance.md` | zIndex/hd/anti 默认、任意点变换、filter 取值、noevent 子元素 | 否 | 默认值可显式指定；filter 明确不在入门范围；noevent 已说整棵子树 | 不修 |
| R3-08 | `docs/advanced/ii/ui/reactivity.md` | 普通变量、vue 依赖、toRefs、markRaw 组合、watch 深浅 | 否 | 额外深度与工程前提，不影响照主流程写 | 不修 |
| R3-09 | `docs/advanced/ii/ui/events.md` | 同 zIndex、跨元素 click、最初目标、MouseType、noevent 悬停 | 否 | 同 zIndex 与 click 已答；`MouseType.Left` 确为第 0 位（1<<0），示例可照抄；最初目标属额外边界 | 不修 |
| R3-10 | `docs/advanced/ii/ui/hotkey-in-ui.md`「useKey」 | 普通子组件拿不到 `props.state.hotkey.system` | 是 | 缺入口：子组件没有 `props.state`，照示例写不出 `useKey` | 修 |
| R3-11 | `docs/advanced/ii/ui/conditional-and-list-rendering.md` | hidden 组件标签、数组根、key 落点、reactive 替换、删除选中 | 否 | 数组根由第 13/23 篇回答；hidden 走 attrs 第 14 篇；其余边界 | 不修 |
| R3-12 | `docs/advanced/ii/ui/props.md` | 运行时类型、DefaultProps 键、省略第二参数、computed、loc 注入 | 否 | 管线与「只写 Props 仍要传 propsOptions」已写明；loc 注入第 1 篇已澄清 | 不修 |
| R3-13 | `docs/advanced/ii/ui/component-tsx.md` | 多根 attrs、setup 返回函数、ref 类型、expose 类型、注册 | 否 | 多根见第 14 篇；其余属额外深度 | 不修 |
| R3-14 | `docs/advanced/ii/ui/slots-and-attrs.md` | slot 返回 VNode/数组、双括号、attrs 事件、多根、slot 坐标 | 否 | 文档已给 `SlotsType` 与单节点示例；多节点可先包容器；其余边界 | 不修 |
| R3-15 | `docs/advanced/ii/ui/builtin-text-and-input.md`「标题加正文的说明框」 | `Textbox` 的 `loc` 第四项与 `height` 谁生效 | 是 | 明确矛盾：正文说高度取 `loc` 第四项，示例又写 `height`，且 `height` 未声明为 props | 修 |
| R3-16 | `docs/advanced/ii/ui/builtin-list-and-containers.md` | List 选中重置、数字 id、ListPage closeLoc、Page 夹紧、getChoice key | 否 | 设计取舍与边界；初值约定已写明 | 不修 |
| R3-17 | `docs/advanced/ii/ui/ui-controller-and-stack.md`「keep」 | keep 标记与「close 到空栈不关背景」的顺序 | 是 | 明确矛盾：既说一次 close 清标记，又说该次 close 不关背景；缺执行顺序 | 修 |
| R3-18 | `docs/advanced/ii/ui/ui-controller-and-stack.md`「栈策略」 | lastOnly「从该实例起」的方向 | 否 | 同节已解释为「它之后打开的实例是否一起关闭」 | 不修 |
| R3-19 | `docs/advanced/ii/ui/ui-controller-and-stack.md`「场景 UI 与主 UI」 | `mainUIController.render()` 返回什么、挂到哪 | 是 | 缺入口：主 UI 容器由引擎/主场景实现决定，文档无法给出 | 交用户（沿用 R2-17） |
| R3-20 | `docs/advanced/ii/ui/ui-controller-and-stack.md`「基础 props 的注入链」 | 自定义 creator 的 `state` 从哪来 | 否 | 额外深度：只有自定义控制器才需要，主流程不涉及 | 不修 |
| R3-21 | `docs/advanced/ii/ui/replace-builtin-ui.md`「替换步骤」 | `openSettings` 示例签名少了 `props` | 是 | 明确矛盾：正文要求保留签名，示例却只收两个参数 | 修 |
| R3-22 | `docs/advanced/ii/ui/replace-builtin-ui.md` | 入口全签名、loc 类型、原入口额外行为、存档语义、包装转发 | 否 | 推荐路径是保留入口函数，无需重写签名；存档返回语义 R1-25 已交用户 | 不修 |
| R3-23 | `docs/advanced/ii/ui/ui-performance.md` | 性能面板、缓存阈值、image 离屏缓存、长帧标准、栈深成本 | 否 | 文档明确先测再改、不给绝对阈值；属额外深度 | 不修 |
| R3-24 | `docs/advanced/ii/ui/inventory-example-1-skeleton.md` | 720×480 与画布、import、第一次打开、live、素材 | 否 | 第 37 行已给 480×320 的 `scale` 验证法（R2-20 已修）；其余属额外 | 不修 |
| R3-25 | `docs/advanced/ii/ui/inventory-example-2-grid.md` | import type、size 只读、响应式、改 props、盖住详情 | 否 | 维护性与边界；对象字段追踪见第 12 篇（R2-12 已修） | 不修 |
| R3-26 | `docs/advanced/ii/ui/inventory-example-3-detail.md` | selectedId 比较、hidden 200×200、空文本、外部替换、live | 否 | 布局与边界细节，不影响主流程 | 不修 |
| R3-27 | `docs/advanced/ii/ui/inventory-example-4-scroll.md` | 数组根、滚动条宽度、rows 类型、负数、拖动阈值 | 否 | 第 23 篇已答数组根；其余为数值/边界 | 不修 |
| R3-28 | `docs/advanced/ii/ui/inventory-example-5-state.md` | 禁用按钮、改 count、watch、Esc 位置、遮罩层级 | 否 | 行为与详略；count 追踪 R2-12 已修 | 不修 |
| R3-29 | `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` | rAF、内层根与 hidden、打开宿主、再次打开、live 排查 | 否 | 性能与验证细节；内层根 R2-25 已答 | 不修 |
| R3-30 | 跨篇 1：`ui-template` / `inventory-example-1` | 第一次 open 的宿主 | 否 | 第 1 篇已给 `bootstrap` 与面板内两种入口 | 不修 |
| R3-31 | 跨篇 2：`ui-template` / `replace-builtin-ui` | `loc` 是否注入 | 否 | 第 1 篇第 147 行已明确只注入三个，`loc` 由打开方传 | 不修 |
| R3-32 | 跨篇 3：`conditional-and-list-rendering` / `inventory-example-4` | 组件根能否返回数组 | 否 | 第 13 篇允许多根、第 23 篇给行数组；第 11 篇讲的是元素树内 map 的父容器要求，不冲突 | 不修 |
| R3-33 | 跨篇 4：`conditional` / `slots-and-attrs` | 组件标签上的 hidden | 否 | 第 12/14 篇的 attrs 规则已覆盖 | 不修 |
| R3-34 | 跨篇 5：`ui-controller-and-stack` | keep 清除语义 | 是 | 同 R3-17（不重复计数） | 修 |
| R3-35 | 跨篇 6：`image-and-texture` / `reactivity` | Texture 与 ITexture | 是 | 同 R3-06（不重复计数） | 修 |
| R3-36 | 跨篇 7：`text` | 居中示例重复写法 | 否 | 同 R3-05 | 不修 |
| R3-37 | 跨篇 8：`events` | MouseType 与 buttons | 否 | 同 R3-09；位定义为第 0 位，示例正确 | 不修 |
| R3-38 | 跨篇 9：`builtin-list-and-containers` / `inventory-example-4` | Scroll 的直接子元素跨组件边界 | 否 | 第 23 篇第 17 行已说明行会平铺为直接子元素 | 不修 |
| R3-39 | 跨篇 10：`container` / `inventory-example-1` | 480×320 与 720×480 | 否 | 第 20 篇第 37 行已给首次验证的缩放做法 | 不修 |
| R3-40 | 跨篇 11：`hotkey-in-ui` | 普通子组件 useKey | 是 | 同 R3-10（不重复计数） | 修 |
| R3-41 | 跨篇 12：`builtin-list-and-containers` | List 选中同步 | 否 | 设计取舍/边界 | 不修 |
| R3-42 | 跨篇 13：`replace-builtin-ui` | 内置入口完整签名 | 否 | 推荐保留入口；`openSettings` 示例已按 R3-21 修正 | 不修 |
| R3-43 | 跨篇 14：`image-and-texture` / `ui-performance` | image 的离屏缓存 | 否 | 默认不缓存；显式开 `cache` 或在缓存容器内才可能有 | 不修 |

第 3 轮（D-94）阻断数：7（R3-02、R3-06、R3-10、R3-15、R3-17、R3-19、R3-21；跨篇 R3-34/35/40 为同项重复，不重复计数）。
其中已修 6 条，交用户 1 条（R3-19，沿用 R2-17），未修 0 条。

概率继承：Round 2（D-94）的分节概率继续有效。Round 3 记录只列逐篇问题、未单列每节使用概率（D-78 的分节概率以 Round 2 记录为准）；本轮修改的 6 处按同章继承：`container-and-coordinates.md#loc-与锚点` 高、`image-and-texture.md#从素材管理器取纹理` 高、`hotkey-in-ui.md#usekey拿到当前组件的作用域` 高、`builtin-text-and-input.md#标题加正文的说明框` 高、`ui-controller-and-stack.md#keep切换面板时不闪背景` 中、`replace-builtin-ui.md#替换步骤` 中。

状态：已汇总

#### 重跑 Round 3 修订

修订者同时收到 D-93 摘要与本轮分诊结论；只改阻断项对应的篇目/章节，不改页面结构、不新增或删除页面、不改 demo、不改源码。

- R3-02：已修 → `docs/advanced/ii/ui/container-and-coordinates.md#loc-与锚点`：把「两两一组要么都写、要么都不写」改为「每一对要么都写、要么整对省略」，并明确只写 `[x, y]` 合法、宽高沿用默认值。
- R3-06：已修 → `docs/advanced/ii/ui/image-and-texture.md#从素材管理器取纹理`：补充 `ITexture` 与 `Texture` 都从 `@motajs/render` 导入、`Texture` 是 `ITexture` 的实现、`image` 接收 `ITexture | null`，素材管理器返回的对象可直接传给 `image`。
- R3-10：已修 → `docs/advanced/ii/ui/hotkey-in-ui.md#usekey拿到当前组件的作用域`：补充普通子组件把父级的 `props.state.hotkey.system` 当普通 prop 传下来（类型 `IHotkeySystem` 从 `@motajs/system` 导入），或把按键处理留在能拿到 `props.state` 的父级面板。
- R3-15：已修 → `docs/advanced/ii/ui/builtin-text-and-input.md#标题加正文的说明框`：明确正文高度只取 `loc` 第四项、`height` 未声明为 props（只会按 attrs 落到根容器），并删掉示例里无效的 `height={200}`。
- R3-17：已修 → `docs/advanced/ii/ui/ui-controller-and-stack.md#keep切换面板时不闪背景`：补充 `close` 先按 keep 标记判断本次是否关背景、再清除标记的顺序。
- R3-21：已修 → `docs/advanced/ii/ui/replace-builtin-ui.md#替换步骤`：`openSettings` 示例补回 `props?: MainSettingsProps` 并展开，保持与表格/正文一致的签名。
- R3-19：交用户 → `docs/advanced/ii/ui/ui-controller-and-stack.md#场景-UI-与主-UI`：`mainUIController.render()` 的返回类型与主场景挂载容器由引擎/主场景实现决定，文档无法单方面补全（沿用 R2-17）。

第 3 轮（D-94）修订统计：阻断 7 条，已修 6 条（落在 6 处正文：`container-and-coordinates.md`、`image-and-texture.md`、`hotkey-in-ui.md`、`builtin-text-and-input.md`、`ui-controller-and-stack.md`、`replace-builtin-ui.md`），交用户 1 条，未修 0 条。
循环结论：3 轮读者循环结束；第 3 轮修订后仍有 1 条交用户项（主 UI 挂载），不是文档内可解决的阻断。
