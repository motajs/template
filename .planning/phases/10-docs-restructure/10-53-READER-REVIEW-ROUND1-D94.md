# Round 1（D-94）· 单读者

读者身份：刚读完中级教程、想给自己的魔塔做一套自定义界面的作者；只掌握基础 TS/JS（函数、对象、数组、少量模板语法），没写过 UI，不知道 canvas 是什么，也不会 Vue 组件写法；只能看这套文档，不能看源码，也没有人可以问。

## 阅读范围

### 先读的非目标文档（按 D-94 顺序）

说明：全部篇目都按顺序过了一遍标题与各级小节；标 ★ 的是逐段通读的篇目，其余为标题 + 开头正文通读（受 21:55 时限约束，未逐字读完全部数据端战斗细节）。

- `docs/intermediate/`
  - ★ `code-basics.md`
  - ★ `data-vs-render.md`
  - ★ `src-tour.md`
  - ★ `data-state-overview.md`
  - ★ `data-plugins.md`
  - ★ `map-structure.md`
  - ★ `map-tiles.md`
  - ★ `tile-store.md`
  - ★ `hero-items.md`
  - ★ `hero-equipment.md`
  - ★ `hero-attribute.md`
  - ★ `hooks.md`
  - ★ `events.md`
  - `flags.md`、`hero-location.md`、`replay-commands.md`
  - `combat-overview.md`
  - `enemy-aura.md`、`enemy-calculator.md`、`enemy-combat-script.md`、`enemy-final.md`、`enemy-map-damage.md`、`enemy-query.md`、`enemy-specials.md`、`enemy-status-hooks.md`
- ★ `docs/advanced/index.md`
- `docs/advanced/i/`
  - ★ `index.md`
  - `declarative-vs-imperative.md`、`plugin-system.md`、`saveable-content.md`、`replay-consistency.md`、`data-stores.md`、`hooks-in-depth.md`、`mover.md`、`face-handler.md`
- `docs/advanced/ii/`
  - ★ `index.md`
  - `static-vs-dynamic-tiles.md`、`point-and-tile-events.md`、`pathfinding.md`、`equipment-system.md`、`custom-replay-command.md`、`custom-range.md`、`adding-hero-attribute.md`、`adding-enemy-attribute.md`、`enemy-context-and-combat.md`
- `docs/advanced/iii/`
  - ★ `index.md`
  - `core-state.md`、`plugin-internals.md`、`event-system.md`、`passability-and-pathfinding.md`、`replay-internals.md`、`loading-system.md`
- 其它 `docs/`
  - ★ `docs/poc/render-demo.md`

### 再读的目标 25 篇（按顺序）

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

## 逐篇提问

| 篇目 | 位置 | 我已经从文档知道什么 | 我还缺什么 | 我照着做会预期什么 |
| --- | --- | --- | --- | --- |
| 1 ui-template | 「一个最小 UI」 | UI 分四部分：Props 类型、props 列表、组件、`GameUI` 注册；三个基础 props 是 `controller`/`instance`/`state`；界面写在 render 返回的 TSX 里 | 我照抄这四段之后，第一步到底该在哪个文件里写 `open`、写哪一行，才能看见这个面板？文档只说「加入统一出口」，没有给我一条从新建文件到屏幕上出现的完整最短路径 | 新建 `src/client/ui/my-panel.tsx` 并导出后，能在游戏里打开并看到 480×320 的深色面板 |
| 1 ui-template | 「props 列表」与「边界」 | 少写 `controller`/`instance`/`state` 不报错但拿不到；基类要 `IGameUIPropsBase` 配 `DefaultProps` | 我只会基础 TS，看不懂 `satisfies SetupComponentOptions<MyPanelProps>` 需要写几个泛型；也不知道这三个 import 分别来自哪个包时我文件顶部是否已经存在 | 照抄后编辑器不报「找不到名称」，`props.state.sceneController` 能用 |
| 1 ui-template | 「运行效果」 | 文档站里有可点的 demo | 我自己的工程里这块画布在哪、`bootstrap.ts` 要不要动、TSX 编译是不是真的已经配好 | 不改任何构建配置就能跑起来 |
| 2 container-and-coordinates | 「坐标基准与画布」 | `loc` 的 480×320 是设计坐标，不是窗口像素；`renderer.width/height` 是设计尺寸；不要用 `innerWidth` | 我项目里画布的设计尺寸具体是多少？中级文档说 `src/constant.ts` 有 `RENDER_WIDTH`/`RENDER_HEIGHT` 但「一般不动」，我该读它还是读 `renderer.width` | 能按画布设计尺寸把面板居中，且不写死 480 |
| 2 container-and-coordinates | 「渲染树：根、容器与子元素」 | 树是「画布根 → UI 容器（控制器创建）→ 面板根（作者写）→ 元素」 | UI 容器自己占多大、放在画布哪里？面板根的 `[0,0]` 是相对 UI 容器，可我不知道 UI 容器是否铺满画布 | 面板根写 `[0,0,720,480]` 时正好从画布左上角开始 |
| 2 container-and-coordinates | 「容器三个职责」 | 容器给子元素局部坐标、做事件捕获单位、是缓存边界；容器不裁剪绘制但命中受矩形限制 | 我要做全屏背包，可画布只有 480×320 而设计稿 720×480；除了改坐标，是否允许把面板根设为画布尺寸再由画布整体缩放 | 面板不被裁掉一半，也不需要为每种窗口写一套坐标 |
| 3 basic-shapes | 「填充、描边与命中」 | `fill`/`stroke`/`strokeAndFill` 是模式开关，颜色在 `fillStyle`/`strokeStyle`；`actionStroke` 只按描边命中 | 我想做「只有边框可点」的按钮：是 `stroke` 加 `actionStroke`，还是 `fill`+`alpha=0`？两种做法在命中上的差别我复述不清 | 点击按钮内部能触发，而不是只有 1px 边框能点中 |
| 3 basic-shapes | 「图形作为界面零件」 | 槽位底板用 `g-rectr` 填充 + 一条内描边 | 表格里「内描边」没给写法：我不知道第二条 `g-rectr` 的 `loc` 要 inset 多少、圆角要不要同步减 | 能画出一圈不压住内容的选中边框 |
| 3 basic-shapes | 「边界与注意」 | `g-rect` 没有圆角，圆角用 `g-rectr`；默认颜色是浅灰 | 除了纯色，能不能给图形做渐变或贴图？文档只说「要显示图标用 image」 | 背景能用渐变或图片，而不是拼很多矩形 |
| 4 curves-and-paths | 「路径」 | `Path2D` 用元素局部坐标；只构造一次，不要在渲染函数里反复 new | 放在组件里时是放 `setup` 顶层、模块顶层，还是 render 外？如果形状要随 props 变化，什么时候重建 | 路径不重复创建，也不会因重渲染而缓存失效 |
| 4 curves-and-paths | 「圆角矩形」 | `circle` 1–4 项的映射；`ellipse` 每两项一组，长度只能 2/4/6/8 | `ellipse` 的 8 项到底哪一组对应哪个角，我复述不出来；「与 circle 相同」对我来说不够 | 能写出「左上、右下圆角，右上、左下直角」 |
| 4 curves-and-paths | 「三次贝塞尔」 | `curve` 数组顺序是起点 → cp1 → cp2 → 终点；长度写错不报错 | 贝塞尔没有 `loc`，那虚线、端点样式、`actionStroke` 这些还能不能照常写在它上面 | 能画一条虚线曲线，并且点不中空白区域 |
| 5 text | 「字体」 | `Font` 构造是位置参数 `(family, size, unit, weight, italic)`；默认 Verdana/16/400 | 我想用自己的字体文件或中文字体，`family` 该填什么？字体文件要放哪、要不要登记 | 面板里的中文能按我指定的字体显示 |
| 5 text | 「尺寸与居中」 | 文字宽高由测量决定；`anchorY=0.5` 用上升部/下降部居中；`width` 不裁剪 | 我想把文字在 66×66 的格子里垂直居中，但不知道测量出来的高度从哪个接口读，只能靠试 | 名称和数量在格子里居中，不靠手调 y |
| 5 text | 「为什么文字默认不缓存」 | 会变的文字不要开 `cache`；静态标题可以开 | 血量、金币这种每帧可能变的数字，是每帧都重新测量吗？我会不会把整块面板拖慢 | 高频数字不拖慢面板 |
| 6 image-and-texture | 「加载一张 PNG」 | 先 `new Image()`，`onload` 后再 `new Texture(image)`；加载期间用 `null` 占位 | 我的图片该放在哪个目录、`src` 写什么？示例给的是 `/assets/icons/potion.png`，但项目结构里没有讲素材目录 | 能把我自己的 PNG 显示出来 |
| 6 image-and-texture | 「从素材管理器取纹理」 | `props.state.materials.getImageByAlias('potion-red')` 返回 `ITexture \| null` | 别名是「素材配置、由编辑器维护」的，我不会用编辑器，能不能手写登记？写在哪个文件 | 不用编辑器也能登记并取到自己的图标 |
| 6 image-and-texture | 「像素图与高清缓存」 | `noanti` 关抗锯齿，像素图按整数倍放大；`hd` 只对开缓存的元素生效 | 我的图标 48×48 想显示 64×64，不是整数倍，除了改尺寸还有别的办法吗 | 图标放大后边缘仍然清晰 |
| 7 layer-transform-performance | 「缓存与脏更新」 | `container`/`custom` 默认缓存，`text`/`image`/`g-*` 默认不缓存；`nocache` 优先级更高 | 我的背包根容器里有一块每秒变的倒计时，是给根加 `nocache`，还是只把倒计时拆出去？我不知道哪种更省 | 倒计时变化不会重画整块面板 |
| 7 layer-transform-performance | 「显示开关」 | `hidden` 保留状态，三元销毁并重置；没有 DOM 布局流 | 隐藏的子树到底还参不参与命中遍历？本篇说 `noevent` 才是「退出遍历」，可 `hidden` 又「不参与命中」，我分不清性能差别 | 大量 hidden 面板时鼠标移动不卡 |
| 7 layer-transform-performance | 「filter 与 composite」 | 两者都存在，影响绘制不改布局与命中 | 具体能写哪些值？我只知道「模糊或灰度」，不知道字符串格式是 `blur(4px)` 还是别的 | 能给面板背后的地图做一层模糊 |
| 8 reactivity | 「ref：带 value 的盒子」 | TSX 里要写 `.value`；模板才自动解包；`reactive` 不能整体替换、解构会丢响应式 | 文档有的例子是 `defineComponent(() => ...)`，有的直接 `defineComponent(props => ...)` 用 `props.controller`，可我没看到 props 从哪声明；我该抄哪种 | 不声明 props 也能跑，或者能明确知道必须在哪声明 |
| 8 reactivity | 「什么时候会重渲染」 | 只有被渲染函数读过的响应式值变化才重渲染；普通数组不会 | 我的道具来自数据端的 `iterateItems()`（返回迭代器/Map），它不是 Vue 响应式；我该怎么把它变成 `ref` 并让界面跟着变 | 数据端加/减道具时网格自动刷新 |
| 8 reactivity | 「响应式与元素生命周期的边界」 | `hidden` 保留、三元卸载、`key` 变化视为新节点 | 这里举例提到 `v-if` 为 false 会卸载，但第 11 篇说 TSX 没有模板指令；我到底能不能写 `v-if` | 不误用导致状态意外丢失 |
| 9 events | 「事件名」 | `onClick`/`onDown`/`onUp`/`onMove`/`onEnter`/`onLeave`/`onWheel`，以及 `Capture` 版本 | `onMove` 写的是「在元素上移动」——指针在子元素上移动时，父容器的 `onMove` 会不会触发？做拖拽时我需要知道这一点 | 拖动面板时父容器能持续收到移动事件 |
| 9 events | 「事件对象」 | `offsetX/offsetY` 是元素局部坐标，`absoluteX/absoluteY` 是画布坐标；`type` 与 `buttons` 区分 | 触摸设备上 `onDown/onUp/onMove` 与鼠标是否同一套？我需不需要自己阻止页面滚动 | 手机上也能点击、拖动 |
| 9 events | 「cursor」 | `cursor` 跟随命中，`noevent`/`hidden` 时失效 | 能不能自定义光标图片，或者隐藏光标（做拖拽时） | 拖拽时换成抓取样式 |
| 10 hotkey-in-ui | 「注册新指令与分组」 | `addCommand`、`setGroup`、`KeyCode`、`HotkeyEmitMode`；`group` 只影响设置界面 | 内置指令的完整 id 列表在哪？默认表只给了 10 条，我想知道有没有「打开背包」这类现成指令 | 不重复注册、不撞 id |
| 10 hotkey-in-ui | 「按键与 UI 栈的关系」 | 按键走一条全局作用域栈，只有栈顶实现生效；`hidden` 不离开作用域 | 如果面板里有 `Input` 正在输入，按 Esc/方向键会不会被面板快捷键抢走？我该怎么让输入优先 | 输入文字时不会误关面板 |
| 10 hotkey-in-ui | 「useKey」 | 必须在 `setup` 中同步调用，返回作用域对象 | 我只会模板语法，不知道 `setup` 在 `defineComponent` 里对应哪一段；写在 `return () => ...` 之前就算 setup 吗 | 能拿到 `key` 并 `implement` |
| 11 conditional-and-list-rendering | 「key」 | 会增删/重排/带状态才需要 `key`；组件把 `key` 写在组件标签上 | 示例（四）里 `ItemGrid` 返回行数组，`key` 到底写行容器上还是写 `<ItemGrid>` 上？我不知道滚动重排时哪个才对 | 滚动/删除后列表项身份不错位 |
| 11 conditional-and-list-rendering | 「hidden 与三元」 | `hidden` 不绘制不命中但保留；三元真正卸载 | 大量长期 hidden 的面板仍占内存、仍被父级遍历——「仍被遍历」具体会不会让命中变慢，和第 19 篇的说法我串不起来 | 频繁开关的面板不卡 |
| 11 conditional-and-list-rendering | 「数据怎么变才会更新列表」 | `ref` 数组的 `push/splice/整体替换` 都会触发；`shallowRef` 只认整体替换 | 我的数组来自游戏状态而不是组件内部，我没有 `ref` 可 push；我该在数据端变化时怎么通知界面 | 数据端加道具后界面自动更新 |
| 12 props | 「组件怎么拿参数」 | Props 接口 + `props` 数组 + `emits`；`props` 数组列全才收得到 | 能不能给 props 写默认值？文档一律用 `props.x ?? 默认`，我不知道 `props` 数组里能不能写 `{ size: { default: 64 } }` | 不传 `size` 时格子是 64，且不写 `??` 也行 |
| 12 props | 「UI 的基础 props 是控制器注入的」 | `controller`/`instance`/`state` 由控制器注入；`open` 第二参是自己的 props | 我自己的 UI 想从外面传 `loc`、`title`，除了把键加进 `props` 数组，`open` 调用处还要写什么？`loc` 是不是也要自己列 | `props.loc` 在面板里拿得到 |
| 12 props | 「泛型顺序」 | Props、Emits、事件名联合、Slots；第二第三要配套 | 我用 `satisfies SetupComponentOptions<...>` 时，示例有时只给一个泛型、有时给三个；少写会不会让 `emit` 失效 | `emit('select', id)` 有类型检查 |
| 13 component-tsx | 「组件如何映射成一棵子树」 | 组件不产生节点，根元素才是父树里的挂载点；多个根会成为同父级多个子元素 | 多根组件时 `attrs` 自动透传到哪个根？又该怎么安排坐标？文档只说「自己安排 `loc` 与 `zIndex`」 | 多根组件不会叠在一起或丢属性 |
| 13 component-tsx | 「生命周期与渲染树」 | `onMounted` 在挂载后、`onUnmounted` 在卸载后；必须在 setup 内同步调用 | 我要在面板打开时从数据端读勇士背包，应该放 `setup`、`onMounted` 还是 `watch`？文档只给了定时器例子 | 打开面板时拿到的是最新数据，不是空数组 |
| 13 component-tsx | 「expose、emit 与父组件拿子组件」 | `ref<CardExpose>()` 拿子组件暴露的方法，挂载前是 `undefined` | 普通容器用 `ref<Container>()`、组件用 `ref<CardExpose>()`，两种 `ref` 的 import 来源不同，我很容易混；有没有统一的判断方法 | 类型写对，调用前判空 |
| 14 slots-and-attrs | 「slot 解决什么问题」 | slot 在 TSX 里是函数，要 `slots.title?.()`；具名 slot 用对象传 | 用 `SetupComponentOptions` 时 `slots` 字段怎么写？示例为了演示改用了手写 `PanelOptions`，我不知道该抄哪一种 | 具名 slot 有类型检查，不写 `?.()` 会报错 |
| 14 slots-and-attrs | 「attrs」 | 未声明为 props/emits 的进 `attrs`；`inheritAttrs:false` 后手动 `{...attrs}` | 我给子组件传 `loc`，它自动落到根元素上时，`loc` 这种数组属性会自动生效吗？根是 `container` 时我需不需要再手动拆 | 子组件根容器的位置被父级传的 `loc` 改变 |
| 14 slots-and-attrs | 「组件边界上的事件与属性」 | 在 `emits` 里声明了 `click`，父级 `onClick` 就不再透传，必须子组件 `emit` | 我只想额外加一个 `onEnter`、不打算声明 emits，它会作为 attrs 透传到根元素并生效吗 | 悬停事件能透传到内部根元素 |
| 15 builtin-text-and-input | 「文本组件的用法与组合」 | `TextContent` 的 `width` 必填，`loc` 第三项会被覆盖；`autoHeight` 与固定高度二选一；`lineHeight` 是行间距不是行高 | `TextContent` 的字体、字号、颜色、行高怎么传？示例只给了 `fillStyle` 和 `lineHeight`，我不知道完整属性名 | 能调出和面板一致的正文样式 |
| 15 builtin-text-and-input | 「输入组件的受控边界」 | `v-model:value`，真实输入框覆盖在画布上，失焦后移除；`hide` 不会让它失焦 | 输入框聚焦时，面板的 Esc 快捷键会不会把面板关掉？我该怎么处理「输入优先」 | 输入名字时按 Esc 只取消输入，不关面板 |
| 15 builtin-text-and-input | 「特殊组件 InputBox」 | `getInput/getInputNumber` 返回 Promise；取消时 `getInput` 给 `''`、数字给 `NaN` | 我在普通子组件（只有 props，没有 `controller`）里想弹确认/输入框，怎么拿到 controller？文档示例都是在 UI 组件里 | 子组件也能弹一次输入框 |
| 16 builtin-list-and-containers | 「List：可选中的列表」 | 组件内部有选中值，初始取第一项；挂载后改 `selected` 不会让列表改选 | 我想在「切换分类」后用代码把选中重置到第一项（或指定项），该怎么做？文档说改绑定不行 | 换分类后左侧高亮同步 |
| 16 builtin-list-and-containers | 「ListPage」 | 左侧 `List` 自带 `Scroll`；右侧 slot 收到选中 id；`close` 只发事件 | 右侧详情内容长了要滚动时，是我自己在 slot 里塞 `Scroll`，还是 `ListPage` 已经给了？和「不要在 Scroll 里套 ListPage」怎么共存 | 右侧详情能独立滚动 |
| 16 builtin-list-and-containers | 「Scroll」 | 只对直接子元素做虚拟滚动；总长度取直接子元素最大底边 + `padEnd` | 如果每行高度不固定（描述长短不一），`Scroll` 还能正确算总长度吗？行高变化时我要通知它吗 | 动态行高下列表仍能滚到底 |
| 16 builtin-list-and-containers | 「弹窗与一次性提示」 | `getConfirm`/`getChoice` 通过 UI 栈打开，弹窗 `alwaysShow` | 弹窗打开时，面板的按键作用域和弹窗谁在上？按 Esc 会关弹窗还是关面板？文档只说按键走作用域栈，没说弹窗是否压作用域 | Esc 只关最上层弹窗 |
| 17 ui-controller-and-stack | 「场景 UI 与主 UI」 | 两个控制器都从 `props.state` 取，文档明确写「没有全局 `client`」 | 但第 1 篇「打开与关闭」写的是 `client.sceneController.open(...)`（在 `src/bootstrap.ts`），那里到底有没有 `client`？我在组件外启动时该用哪个 | 在 `bootstrap.ts` 里能打开场景 UI，不报 `client` undefined |
| 17 ui-controller-and-stack | 「栈策略」 | `lastOnly` 默认、`showAll`；栈模式下 `close` 会连带关闭上层 | 打开背包 → 打开设置 → 按 Esc 关设置后，背包会自动回来吗？默认策略下我需要自己再 `open` 一次吗 | 关设置后看到背包，而不是空画面 |
| 17 ui-controller-and-stack | 「背景的四个名字」 | `showBack`/`showingBack()` 读最终结果，`showBackground`/`hideBackground` 写用户设置，`setBackground` 换背景 UI | 我想给自己的面板加一层半透明黑底，是该用 `setBackground`，还是在面板里画一个 `g-rect`？两者在栈与点击上的差别我不知道 | 背景正确显示，切面板不闪，点击不被背景吞掉 |
| 17 ui-controller-and-stack | 「事件归属与生命周期」 | `setPropsBaseCreator` 每个实例每次渲染都调用，必须带回 `state` | 默认情况下游戏是不是已经设好了 creator？什么时候需要我自己设？我不知道正常项目里这行在哪 | 不改也能拿到 `props.state`；要改时知道放哪 |
| 18 replace-builtin-ui | 「替换步骤」 | 替换点只有两个：打开处与包装层；改 `openSettings` 入口会影响所有调用方 | 我要改 `src/client/ui/settings.tsx` 里 `openSettings` 的内部，这算不算文档反复警告的「改内置」？「内置 UI」与「内置包 packages」的界线我没分清 | 能安全替换设置界面，升级时不丢改动 |
| 18 replace-builtin-ui | 「可以替换哪些、分别影响什么」 | 存档类必须保留索引/自动存档/mode/校验回调/关闭后的 Promise 结果 | `mode`、`validate` 这些具体约定在哪篇讲？文档只说「必须保留」，我不知道原语义是什么 | 换掉存档界面后仍能存到正确槽位 |
| 18 replace-builtin-ui | 「替换步骤 第二步」 | 包装层要转发全部 props、attrs、slots 与 emits | 包装组件怎么写才能把所有 slots 原样转发？示例没有给包装层代码 | 包装后原界面的行为与事件都一致 |
| 18 replace-builtin-ui | 「风险与边界」 | 不要改 `packages`/`packages-user` 里的内置实现；一次只换一个界面 | 表格给了内置 UI 的文件名，但没有目录树；我连 `src/client/ui` 下有哪些文件、`index.ts` 长什么样都要现猜 | 能按表找到文件并只改打开处 |
| 19 ui-performance | 「性能问题先定位在哪一层」 | 六层症状表；先做减法再看差异 | 文档站没有真实游戏，我在自己的工程里怎么「录一段」？看浏览器哪个面板、录什么操作 | 能定位是缓存、命中还是重渲染的问题 |
| 19 ui-performance | 「缓存」 | 结构复杂、内容稳定才缓存；过大的子树不该缓存 | 我的背包面板 720×480 接近全屏，开缓存算不算「过大」？文档没有给可判断的阈值 | 不会因为开缓存反而更卡 |
| 19 ui-performance | 「命中与事件」 | 装饰层加 `noevent`，减少全屏遮罩；每个遮罩都会参与命中遍历 | 我的面板底图是一张全屏 `image`，加 `noevent` 后点击落到哪？面板根没有 `onClick`，会不会穿透到地图触发移动 | 点面板空白处不会让勇士走路 |
| 19 ui-performance | 「观测与验证」 | 一次只改一个开关；用最坏数据测 | 「长帧」多少毫秒算长？目标帧率是多少？我不知道该拿什么标准判断有没有问题 | 能判断优化是否真的有效 |
| 20 inventory-1-skeleton | 「骨架在渲染树里的位置」 | 设计稿 720×480；面板主体 `[30,30,660,420]`；左右区域与操作条坐标 | 文档站画布是 480×320，720×480 会超出不可见；如果我的游戏画布也是 480×320，我该整体缩小坐标还是缩放面板根 | 打开后能看到完整面板，而不是只看到左上角 |
| 20 inventory-1-skeleton | 「组件与文件怎么分」 | 五个文件与各自 props；只有 `InventoryPanel` 被 `GameUI` 注册 | 我不知道现在的 `src/client/ui/index.ts` 里有什么；加一行 `export *` 会不会和已有导出重名 | 加导出后不覆盖、不冲突 |
| 20 inventory-1-skeleton | 「打开它」 | 三个入口：场景、当前控制器、主 UI 栈 | 示例只说「从某处打开」，没说我游戏里第一下该点哪里。我要加工具栏按钮还是快捷键？对应文件没给 | 能在游戏里真正触发打开 |
| 21 inventory-2-grid | 「ItemCell」 | 格子无内部状态，`selected` 由父传，点击只 `emit('select', id)` | 示例格子用 `g-rectr` + 文字，没有图标。我想加真实道具图标，`image` 该放在描边下还是上、要不要 `noevent` | 图标显示正确，点击仍由格子底板接收 |
| 21 inventory-2-grid | 「ItemGrid」 | 根容器 `400×280`；`cellSize=66`、`gap=8`；定位容器与格子同尺寸 | 如果道具数量不是 5 的倍数，最后一行不足 5 个，定位容器会不会用默认 200×200 盖住？示例（二）里行容器还没出现 | 最后一行不遮挡、不越界 |
| 21 inventory-2-grid | 「数据如何进入网格」 | 面板持有 `items: ref<Item[]>`，子组件收 `items.value` | 这是假数据；真实背包是 `state.hero.items.iterateItems()`，我不知道怎么从迭代器映射成 `Item[]`、怎么保持响应式 | 网格显示真实道具和数量 |
| 21 inventory-2-grid | 「点击如何上报」 | 三层 `emit`；`ItemCell → ItemGrid → InventoryPanel` | 表格里写 `onSelect` 是 props，正文又说 `emits: ['select']`；父级到底写 `onSelect` 还是 `@select`，我按哪个抄 | 事件链能编译、点击能选中 |
| 22 inventory-3-detail | 「详情区的树结构」 | 详情根 `196×280`；两个 `hidden` 容器切换提示与内容；描述用 `TextContent` | 两个 `hidden` 容器没写 `loc`，默认 200×200。显示时它会不会盖住下面 `[16,236,164,28]` 的「取消选择」按钮并吞掉点击 | 取消选择按钮始终可点 |
| 22 inventory-3-detail | 「ItemDetail」 | `item: Item \| null`；`TextContent` 的 `width=164`、`autoHeight` | 描述变长时 `TextContent` 高度会增，但按钮是绝对坐标 `y=236`，不会自动让位。怎么让按钮跟着下移，或者怎么限制描述区高度 | 长描述不压住按钮 |
| 22 inventory-3-detail | 「空态与边界」 | 三种空态；选中项被删除要把 `selectedId` 写回 `null` | 「删除道具」的入口在示例里没有（示例五只减数量），我不知道删除后 `selectedId` 该在哪一步清 | 删除后右侧回到「请选择道具」 |
| 23 inventory-4-scroll | 「Scroll 在渲染树里的位置」 | 视口 `372×244`；左侧区域 400 宽，右侧 28 是滚动条与内边距；行距 74 | 滚动条宽度是固定的 28 吗？换主题、换缩放或不同 DPI 后，我还按 372 算吗 | 内容不被滚动条压住，换设备也不偏 |
| 23 inventory-4-scroll | 「数据与选中态如何穿过滚动层」 | 组件不产生节点，`ItemGrid` 返回行数组，行数组成为 `Scroll` 的直接子元素 | `<Scroll><ItemGrid/></Scroll>` 里 `Scroll` 怎么知道拿到的是 5 个行容器而不是一个组件节点？我理解「组件不是节点」，但不确定 `Scroll` 是否会先看到组件边界 | 虚拟滚动真的按行生效 |
| 23 inventory-4-scroll | 「滚动与事件」 | `Scroll` 在捕获阶段把滚动偏移加回事件坐标；滚轮由 `Scroll` 处理 | 滚轮在格子上滚动时，会不会同时触发格子的 `onWheel` 或面板其它滚动容器 | 只滚左侧列表，不会带动别处 |
| 23 inventory-4-scroll | 「为什么不用 ListPage」 | `ListPage` 是单列文本列表，装不下 5 列网格 | 那我如果想让「左网格 + 右详情」按窗口宽度自适应（比如窄屏上下排），有没有现成组件？没有的话分栏比例要自己算吗 | 自己的分栏在缩放时稳定 |
| 24 inventory-5-state | 「状态放在 InventoryPanel」 | 面板持有 `items/selectedId/equippedId/hint`；派生用 `computed`，副作用用 `watch` | 这些全是假数据。我要把「装备」接到真实勇士（`state.hero.equip.equip(uid, slot)`）该写在哪？示例没提真实数据 | 点「装备」真的改变游戏里的装备槽 |
| 24 inventory-5-state | 「使用」 | `item.count -= 1`；数量为 0 时 `canUse` 失效 | 真实使用道具要走 `state.hero.items.useItem(...)`，还会触发道具效果；示例手改 `count`，我不知道该照哪个 | 点「使用」会消耗道具并触发效果 |
| 24 inventory-5-state | 「已装备的格子」 | 接口、`props` 数组、渲染三处一起改；`equippedId` 是单个 id | `equippedId` 是面板本地状态；面板关闭再打开就从 `null` 开始，读档后也不会恢复。它应该存哪、要不要进存档 | 重开面板后仍显示已装备 |
| 24 inventory-5-state | 「键盘收口」 | `useKey` 在 setup 调用；`@common/exit` 默认 Esc/X；三条关闭路径统一 | 面板里有 `Input` 正在输入时，Esc 会不会先被 `@common/exit` 拿走？示例没有输入框，我不知道怎么避免 | 输入时 Esc 只退出编辑 |
| 25 inventory-6-animation-and-register | 「动画作用在树的哪一层」 | 用 `requestAnimationFrame` 改 `alpha`，`onUnmounted` 里 `cancelAnimationFrame`；描边加 `noevent` | 文档说仓库有 `transitioned`/`transitionedColor`，返回值可空、要判空，但不给签名与用法。我不知道什么时候该用它、什么时候像本篇手写 raf | 能做渐变动画，且不用猜 API |
| 25 inventory-6-animation-and-register | 「最终组装与契约核对」 | 外层画布根 + 面板根，两层 `loc` 相同；「实际代码用 `hidden` 控制开合」 | 这个 `hidden` 变量是谁设的？面板组件自己持有，还是控制器根据实例隐藏状态注入？示例骨架里没有它 | 打开/关闭时显隐正确，不手写重复状态 |
| 25 inventory-6-animation-and-register | 「注册与打开」 | `new GameUI('inventory-panel', InventoryPanel)`；`index.ts` 统一导出；`mainUIController.open(InventoryUI, {})` | 注册只是声明 UI。我想给背包加一个工具栏按钮、再绑一个快捷键（比如 T），还要改哪几个地方？文档没有把这条链路串起来 | 能按按钮或按键打开背包 |
| 25 inventory-6-animation-and-register | 「最终验证清单」 | 8 项验证；「再次打开回到初始状态：未选中、滚动在顶部」 | 但第 23 篇说 `hide` 会保留滚动位置、只有 `close` 才回到顶部。我该用 `hide` 还是 `close` 来「再次打开」？两种行为的预期不同 | 我选的方式对应清单里的预期，不会互相矛盾 |

## D-93 复述检查（渲染树 / 事件 / 组件）

### 渲染树

我能复述的部分：

- 一棵树：画布根 → UI 容器（控制器创建）→ 面板根（作者写）→ 区域容器 → 叶子元素；每多一层，坐标系重新平移一次。
- 组件不产生节点；组件的根元素才是父树里的挂载点，多个根就是同父级的多个子元素。
- 容器有三个职责：局部坐标系（子元素 x/y 相对父容器左上角）、事件捕获单位（命中从根向里、父容器先接）、排序与缓存边界（兄弟按 `zIndex` 排序，容器默认缓存）。
- `zIndex` 只在同一父级兄弟间比较；绘制从小到大，命中从大到小。
- `hidden` 不绘制不命中但保留实例与状态；`noevent` 仍绘制但整棵子树跳过命中；容器不裁剪绘制但命中受自身矩形限制。
- 重渲染是组件级、patch 是元素级；三元/`key` 变化才会销毁重建。

我复述不出的地方：

- UI 容器自己的位置与尺寸是谁定的、是否铺满画布；面板根的 `[0,0]` 相对 UI 容器，但 UI 容器的 `loc` 全套文档没有给。
- 背景实例在树上的具体落点（只说 `zIndex 0`、`alwaysShow`，没说它在 UI 容器的哪个位置、和背景 UI 的根元素关系）。
- `template`、`custom`、`container-custom` 三者各自的节点语义与尺寸来源：只知道 `custom` 自绘、`template` 是内部容器标签，但不知道作者什么时候会看到它们。
- 「容器默认缓存」与「文字默认不缓存」同时成立时，父容器缓存里嵌文字，脏标记如何只在文字变化时避免重画整块——机制我背得出，但实际代码里怎么判断「这块该 nocache」我复述不出操作步骤。

### 事件

我能复述的部分：

- 命中：从画布根开始，每一层按 `zIndex` 从大到小检查子元素；同值后加入的先检查；图形按几何轮廓（`actionStroke` 只按描边）；命中即停，不会分叉到同级其它元素。
- 捕获：根 → 命中元素，父容器先收到 `onClickCapture`；冒泡：命中元素 → 根，子元素先收到 `onClick`。
- 完整顺序：根捕获 → 父捕获 → 命中元素捕获 → 命中元素冒泡 → 父冒泡 → 根冒泡；同级其它元素不出现。
- `stopPropagation()` 在捕获阶段会同时截断内层捕获与整段冒泡，在冒泡阶段只截断向外；它不阻止同一元素上同事件名的其它监听器，也不阻止浏览器默认行为。
- `enter`/`leave` 不走普通冒泡，由根维护的悬停集合做差集：先 `leave` 后 `enter`；父容器在子元素间移动时一直留在集合里，所以不闪。
- `offsetX/offsetY` 是当前元素局部坐标，经过变换会反算；`absoluteX/absoluteY` 是画布坐标；同一元素捕获与冒泡复用同一事件对象，不同层各自计算。
- `noevent` 作用于整棵子树；`hidden` 连绘制一起跳过；`cursor` 跟随命中。

我复述不出的地方：

- `onMove` 的触发范围：只在指针位于该元素自身几何内时触发，还是位于其子树内也算？拖拽时父容器能不能一直收到 `onMove`。
- 滚动容器（`Scroll`）在捕获阶段补滚动偏移——这算事件系统的一部分还是组件自己的事？如果我自己写滚动，需不需要也做同样的换算。
- 多指触摸时 `identifier` 与 `onClick` 的关系：文档说「按下与抬起标识对不上就不产生点击」，但没说两根手指分别操作两个元素时各自的目标怎么确定。
- UI 栈里多个面板同时可见（`showAll`）时，事件是否严格按渲染树兄弟层级命中，还是按栈顺序额外排序——文档说「按渲染树规则」，但栈的 `zIndex = i*5` 与面板内部 `zIndex` 的叠加关系我没有完全复述清楚。

### 组件（props / slots / attrs 与内置组件）

我能复述的部分：

- props 管线：父组件写属性 → 子组件 VNode props → 子组件 `props` 数组挑键 → 进 `setup` 的 `props`；没挑中的进 `attrs`，默认透传到根元素。
- `props` 数组漏写键 = 收不到，且不报错；键名必须 camelCase；`v-model:xxx` 对应 `xxx` + `onUpdate:xxx`，真正 props 名是 `xxx`。
- props 是响应式的，不能解构；默认值用 `props.x ?? 默认`，用 `computed` 才能跟随变化；不要给 props 赋值。
- `emits` 声明后，父级对应的 `onXxx` 不再透传，必须子组件 `emit`；`expose` 暴露方法，父级用 `ref` 拿，挂载前是 `undefined`。
- slot 在 TSX 里是函数，用 `slots.xxx?.()` 调用；具名 slot 用对象传；`SlotsType` 决定类型；slot 只决定结构，不决定数据。
- `attrs` 是响应式的；`inheritAttrs:false` 只关闭自动落根，仍可手动 `{...attrs}`；多根组件应设 `false` 并手动分配。
- UI = 能被 `GameUI` 打开、由 UI 栈管理：Props 同时继承 `IGameUIPropsBase` 与 `DefaultProps`，`props` 数组至少含 `controller`/`instance`/`state`，组件被 `new GameUI(...)` 注册；普通组件只需 `DefaultProps`。
- 内置组件：`TextContent`（按 `width` 折行、逐字、`autoHeight`）、`Textbox`（背景/标题/内边距）、`Input`（覆盖真实输入框、`v-model:value`）、`InputBox`/`getInput`；`List`（内部选中、`v-model:selected`）、`ListPage`（左列表右详情）、`Page`（页码从 0）、`Scroll`（直接子元素虚拟滚动）、`Selection`（只画框不接事件）、`ConfirmBox`/`Choices`。

我复述不出的地方：

- `DefaultProps` 对普通组件到底是「必须」还是「推荐」：第 12 篇写「普通组件只需继承 `DefaultProps`」，第 18 篇又说第 1 篇的「配 `DefaultProps`」是推荐写法、不是运行要求。我不知道不继承会失去什么。
- `SetupComponentOptions` 的 `slots` 字段与第四个泛型 `SlotsType` 怎么配合；示例为了演示 slots 改用 `PanelOptions`，我不知道正式写法。
- 内置组件的 `emits` 全名：`List` 同时发 `update` 与 `update:selected`，`Page` 发 `pageChange` 还有 `update:page`，哪些该用 `v-model`、哪些该手监听，我背不全。
- `TextContent` / `Textbox` / `Input` 的完整属性表：只给了常用子集，字体、颜色、行距、内边距的具体键名我无法确定。
- `attrs` 透传与元素属性名的对应：`loc` 是数组、`fillStyle` 是颜色，展开到内部元素时哪些会自动生效、哪些需要手动拆，我没法从文档推出统一规则。

## 跨篇问题（仅读者困惑，不写「前后不一致/写错了」）

1. **真实数据接不进来。** 25 篇的背包示例从头到尾用 `ref<Item[]>` 假数据，我读完了仍不知道：`state.hero.items.iterateItems()` 返回的 Map 怎么变成 `Item[]`，装备怎么接到 `state.hero.equip`，使用道具怎么走 `useItem`。作为刚开始做自定义界面的作者，这是我最大的空白。
2. **素材怎么登记。** 文档反复说 `winskin`、`icon`、素材别名「由编辑器维护」，但我没有编辑器知识；除了文档站自带的 demo，我不知道自己的一张 PNG 要放在哪、怎么变成 `getImageByAlias` 能取到的别名。
3. **组件外到底有没有 `client`。** 第 1 篇写 `client.sceneController.open(...)`（`src/bootstrap.ts`），第 17 篇明确说「没有全局 client，两个控制器都从 `props.state` 取」。我在组件外启动时该用哪一个，作为读者只能二选一，不敢猜。
4. **`v-if` 能不能用。** 第 8 篇与第 13 篇都拿 `v-if` 举例说明卸载，第 11 篇却说 TSX 里没有模板指令、条件用 `hidden`/三元。我只会一点点模板语法，看到 `v-if` 会本能想写。
5. **`IGameUIPropsBase` + `DefaultProps` 是硬要求吗。** 第 1 篇与第 13 篇说「必须/判定条件」，第 18 篇说「推荐、不是运行要求」。我不知道照哪个标准检查我的组件算不算 UI。
6. **画布尺寸我该按哪个数。** 文档站 480×320、背包示例 720×480、正文说以 `renderer.width/height` 为准、中级又提到 `src/constant.ts` 的 `RENDER_WIDTH/RENDER_HEIGHT`。作为新手，我不知道自己项目该把设计稿定成多少、以及在哪里读这个值。
7. **普通子组件拿不到 `controller`。** 文档建议子组件不要接收 `controller`，需要关闭就 `emit`；但 `getInput`/`getConfirm`/`getChoice` 都要 controller。我在「详情里点使用前确认」这种场景下，不知道该由面板统一弹窗再把结果传下去，还是子组件自己想办法拿 controller。
8. **`hidden` 的成本口径。** 第 7/11 篇说 `hidden` 保留状态、仍占内存、仍被父级遍历，第 19 篇把 `hidden` 当成性能首选；我不确定「大量 hidden 面板」到底会不会拖慢鼠标移动，还是只有 `noevent` 才能减少命中遍历。
9. **默认值处处是坑。** 元素默认 200×200、`loc` 可省宽高、`container` 默认缓存、`image` 默认不缓存、`Font` 默认 Verdana、`List` 的 `lineHeight` 默认 18、`TextContent` 的 `lineHeight` 是行间距默认 0。作为读者我记不住这么多默认值，也不知道哪些会直接影响命中或排版。
10. **`@user/client-base` 与 `@motajs/*` 的 import 该不该写。** 模板篇说「文件顶部通常已有这些引入，不用再粘」，中级代码基础也说片段省略 import、缺了再补；但我新建文件时并不知道哪个文件「顶部通常已有」，只能一个个试。

## 声明

未读源码：是

未修改任何文档：是

未读上一轮审阅记录：是

live 目视验证：未执行
