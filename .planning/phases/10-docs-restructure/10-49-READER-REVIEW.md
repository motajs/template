# 高级 II · UI 25 篇独立读者审阅记录（10-49）

独立读者按 Part 0→5 顺序只读 25 篇的提问记录，未修改任何文档。

## 读者人格（逐字）

你是一位刚读完中级教程、想给自己的魔塔做一套自定义界面的作者。你完全没写过 UI，不知道 canvas 是什么，也不会 Vue 的组件写法；你只掌握了基础 TS/JS、函数、对象、数组和一点点模板语法。你手里只有这套文档，不能看源码，也没有人可以问。你的任务不是评价文档好坏，而是老老实实按顺序读，读到哪里卡住就记下：我在哪一段卡住、我从文档里已经知道什么、我还缺什么才能继续往下做。

## 阅读范围

- `docs/advanced/ii/ui/ui-template.md` — 进入前提：会写 TS 函数和对象，想先让一个面板显示出来；不知道 canvas 与 DOM 的区别。
- `docs/advanced/ii/ui/container-and-coordinates.md` — 进入前提：已有一个能显示的 `container`、`g-rect`、`text`，想弄清楚 `loc` 六元组和嵌套坐标。
- `docs/advanced/ii/ui/basic-shapes.md` — 进入前提：已会摆容器，想画色块、边框、分隔线。
- `docs/advanced/ii/ui/curves-and-paths.md` — 进入前提：已会矩形、圆和直线，想画曲线、路径、圆角。
- `docs/advanced/ii/ui/text.md` — 进入前提：已会图形，想显示单行文字、字体和居中。
- `docs/advanced/ii/ui/image-and-texture.md` — 进入前提：已会文字和图形，想显示图标、贴图、像素画。
- `docs/advanced/ii/ui/layer-transform-performance.md` — 进入前提：已会摆元素，想处理遮挡、缩放旋转、显示开关和缓存。
- `docs/advanced/ii/ui/reactivity.md` — 进入前提：已能写静态界面，想让数据变化自动更新画面。
- `docs/advanced/ii/ui/events.md` — 进入前提：已会响应式，想接点击、悬停、滚轮。
- `docs/advanced/ii/ui/hotkey-in-ui.md` — 进入前提：已会点击事件，想接 Esc、Enter 这类按键。
- `docs/advanced/ii/ui/conditional-and-list-rendering.md` — 进入前提：已会事件和响应式，想按条件显示、循环生成列表。
- `docs/advanced/ii/ui/props.md` — 进入前提：已会写单个组件，想拆父子组件传数据。
- `docs/advanced/ii/ui/component-tsx.md` — 进入前提：已会 props，想写完整组件、生命周期和 `expose`。
- `docs/advanced/ii/ui/slots-and-attrs.md` — 进入前提：已会组件，想让父组件塞内容、透传属性。
- `docs/advanced/ii/ui/builtin-text-and-input.md` — 进入前提：已会自己拼组件，想用现成的换行文本、说明框、输入框。
- `docs/advanced/ii/ui/builtin-list-and-containers.md` — 进入前提：已用过文本与输入组件，想用现成的列表、分页、滚动、一次性弹窗。
- `docs/advanced/ii/ui/ui-controller-and-stack.md` — 进入前提：已能打开一个面板，想管多个面板的叠放、背景和主 UI。
- `docs/advanced/ii/ui/replace-builtin-ui.md` — 进入前提：已会 UI 栈，想把设置、存档、工具栏换成自己的。
- `docs/advanced/ii/ui/ui-performance.md` — 进入前提：已能搭面板和栈，想知道哪里会卡、哪些开关能省。
- `docs/advanced/ii/ui/inventory-example-1-skeleton.md` — 进入前提：已学完零件（模板、元素、响应式、事件、组件、内置组件、栈），但没把它们装成一个面板；本篇给目标与骨架。
- `docs/advanced/ii/ui/inventory-example-2-grid.md` — 进入前提：已有 720×480 骨架和左右两个占位区，但不知道道具数据、格子和网格怎么填。
- `docs/advanced/ii/ui/inventory-example-3-detail.md` — 进入前提：已有可点击选中的 5 列网格，但右侧仍是占位，不知道详情怎么接选中项。
- `docs/advanced/ii/ui/inventory-example-4-scroll.md` — 进入前提：网格与详情能用，但道具一多左侧放不下。
- `docs/advanced/ii/ui/inventory-example-5-state.md` — 进入前提：面板能看能选，但还不能装备、使用、关闭。
- `docs/advanced/ii/ui/inventory-example-6-animation-and-register.md` — 进入前提：功能基本齐了，要做动画、落回五个文件、注册成 UI。

## 逐篇提问

| 篇目 | 位置 | 我已经从文档知道什么 | 我还缺什么 | 我照着做会预期什么 |
| --- | --- | --- | --- | --- |
| docs/advanced/ii/ui/ui-template.md | ## 一个最小 UI（开头两段与完整模板代码块） | 界面是画布上的框架元素，不是 DOM；TSX 写结构、Vue 管组件与响应式；模板由 Props 类型、Props 列表、组件、`GameUI` 注册四部分组成；四个 import 分别来自 `vue`、`@motajs/system`、`@motajs/render-vue`、`@user/client-base`；注册名是 `'my-panel'`。 | 这个 `.tsx` 文件该放在哪个目录、文件名有没有约束、构建或游戏如何发现它；`export const MyPanelUI` 之后是否还要在别处被 import 或登记；这四个包别名在我的项目里是否已存在、要不要配置。 | 新建一个文件、原样粘进去保存，游戏里就应该能出现面板——但不知道保存后去哪里看，也不知道要不要重启、重新构建或额外注册。 |
| docs/advanced/ii/ui/ui-template.md | ## 一个最小 UI（`defineComponent` 与 `satisfies` 那一段） | `props` 列表至少含 `controller`、`instance`、`state`；setup 返回 render 函数；组件用 `defineComponent` 包起来；Props 接口同时继承 `IGameUIPropsBase` 与 `DefaultProps`。 | `defineComponent` 的两个参数各是什么、外层那个 `props` 参数从哪里来、为什么里面还要 `return () =>` 再包一层；`satisfies` 与泛型在这里起什么作用；JSX 里 `{/* */}` 注释、`<g-rect fill />` 只有属性名的写法是什么语法；想加自己的字段时改接口还是改列表。 | 原样复制能跑；一旦想改结构或加字段就可能写错，而且按文档提醒属性名写错不报错，我不知道该怎么自查。 |
| docs/advanced/ii/ui/ui-template.md | ## 一个最小 UI（三个元素的说明与 `loc`） | `loc` 前两项是左上角坐标、后两项是宽高；`g-rect` 要 `fill` 才有填充、`fillStyle` 才是颜色；`text` 的内容放 `text` 属性；`container` 是布局单位也是事件捕获单位。 | 坐标原点在哪、单位是不是像素、`loc` 相对父容器还是相对画布；`480×320` 与游戏画布或窗口是什么关系；面板会出现在屏幕的哪个位置；`g-` 前缀是什么意思；窗口变化后会不会被拉伸或裁掉。 | 按示例填 `480×320` 界面能显示，但不知道会不会超出可视区、换个尺寸该按什么基准算，也不知道面板默认落点在左上还是居中。 |
| docs/advanced/ii/ui/ui-template.md | ## 一个最小 UI（等价的原生元素代码块） | 同一画面可以用 `Container`、`Rect`、`Text` 手动 `pos`/`size`/`setFillStyle`/`setText`，再 `appendChild` 挂到根容器上。 | 这些类从哪个包 import（上一段只 import 了 `defineComponent`、`GameUI`、`SetupComponentOptions`、`DefaultProps`、`IGameUIPropsBase`）；`root` 创建后挂到哪里才可见、是否必须写在某个 `GameUI` 的 render 里；这条路线还需要 `GameUI` 注册吗；两条路线该选哪条、能否混用。 | 直接抄这段会得到一份能编译、但不知道如何让它显示、也不知道缺哪些 import 的代码；也不确定它是不是「不写 Vue 的正式方案」。 |
| docs/advanced/ii/ui/ui-template.md | ## 只改哪几行 与 ## 打开与关闭 | 打开有三处：场景 UI 用 `props.state.sceneController.open(MyPanelUI, {})`、另一个 UI 内用 `props.controller.open(...)`、关闭自己用 `props.controller.close(props.instance)`；主 UI 栈用 `props.state.mainUIController.open(...)`，细节留到后面；没有全局 `client`。 | 第一次让面板出现该挑哪一个；表格写的「主入口 / 另一个 UI 内 / 主 UI 栈」与下一节三个代码段（场景 UI / 另一个 UI / 关闭自己）怎么对应；`open` 第二个参数 `{}` 里能放什么、放进去后怎么在面板里取到；`instance` 是什么、为什么 `close` 要传它；`sceneController` 与 `mainUIController` 从哪来、有什么区别。 | 会在场景 UI 与主 UI 栈之间犹豫，可能先抄场景那条；但不知道面板出现后是否被主界面盖住、是否与主界面同时存在，也不知道怎么把自己的参数带进面板。 |
| docs/advanced/ii/ui/container-and-coordinates.md | 坐标从哪里来 | 根容器左上角是原点，向右为正 x、向下为正 y；子元素相对父容器，每层重新平移 | 这个“根容器”是不是就是游戏画面？我写的 `[0, 0, 480, 320]` 和游戏窗口是什么关系，会不会被缩放 | 把根容器贴到左上角，界面就出现在画面左上角 |
| docs/advanced/ii/ui/container-and-coordinates.md | loc 与锚点 | `loc` 是 x、y、width、height、anchorX、anchorY 六元组，后三项可省略；`anc` 是简写；默认尺寸 200×200 | “后三项可以省略”到底指 height、anchorX、anchorY 三项，还是只指两个锚点？如果我省略宽高，是不是就变成 200×200 | 省略锚点后元素仍在左上角；省略宽高后元素是 200×200 |
| docs/advanced/ii/ui/container-and-coordinates.md | 一个嵌套示例 | 两段等价写法，一段 TSX、一段 `appendChild`；子坐标相对父容器 | 这段 TSX 应该放在哪里？第 1 篇的模板里有 `return () => (...)`，这里却是裸露的标签；`container`、`g-rect` 是全局可用还是要 import | 把嵌套示例整段塞进 render 函数就能看到两个区域 |
| docs/advanced/ii/ui/container-and-coordinates.md | 层级 | `zIndex` 越大越靠上，也影响命中；不改变坐标 | 两个不同父容器里的子元素，`zIndex` 还能互相比较吗？我想让 A 容器里的提示框盖住 B 容器，只给提示框大 `zIndex` 够不够 | 给提示框加大 `zIndex` 就能盖住旁边的容器 |
| docs/advanced/ii/ui/basic-shapes.md | 四个图形 | `g-rect`、`g-circle`、`g-ellipse`、`g-line` 及各自几何属性；元素层对应 `Rect`、`Circle`、`Ellipse`、`Line` | 元素层的这些类从哪里 import？TSX 里的标签又从哪里来？文档只给了类名，没有 import 行 | 照抄类名就能 new 出来并挂到容器上 |
| docs/advanced/ii/ui/basic-shapes.md | 填充与描边 | `fill`、`stroke`、`strokeAndFill` 是模式开关，颜色在 `fillStyle`、`strokeStyle`；线宽、虚线、端点、连接样式 | 如果我同时写 `fill` 和 `stroke` 两个开关，而不是 `strokeAndFill`，会得到什么？文档没说冲突时谁优先 | 同时写两个开关也能得到填充加描边 |
| docs/advanced/ii/ui/basic-shapes.md | 圆角与命中 | 圆和椭圆用 `radius`、`radiusX`、`radiusY`；`actionStroke` 只让描边响应点击 | 这节标题叫“圆角与命中”，可我真正想找的是“矩形圆角”，这里没有；我会以为 `g-rect` 也能给圆角 | 给 `g-rect` 加 radius 想得到圆角矩形，结果文档没这条属性 |
| docs/advanced/ii/ui/curves-and-paths.md | 三次贝塞尔 / 二次贝塞尔 | `g-bezier` 八元数组、`g-quad` 六元数组，顺序固定，长度错不报错但画错 | 这两个元素没有 `loc`，那曲线画在哪个坐标系？我想把整条曲线挪个位置，是改所有点，还是外面包一层容器 | 曲线坐标相对父容器原点，想移动就包容器 |
| docs/advanced/ii/ui/curves-and-paths.md | 路径 | `g-path` 的 `path` 必须是 `Path2D`，不能传字符串；用 `moveTo`、`lineTo` 组路径 | `Path2D` 从哪里来？是浏览器全局对象还是要 import？我的 TS 环境里直接写 `new Path2D()` 会不会报找不到名字？路径能不能用 `loc` 平移 | 直接 `new Path2D()` 就能用，路径从父容器原点开始画 |
| docs/advanced/ii/ui/curves-and-paths.md | 圆角矩形 | `g-rectr` 用 `circle` 或 `ellipse` 指定圆角；`circle` 支持 1 到 4 项，`ellipse` 支持 2、4、6、8 项 | `circle` 三项时“按顺序细分”具体是三口角各一个、第四个跟着谁？`ellipse` 每两个值对应哪个角？我无法从文字推出角与值的映射 | 三项圆角能猜到顺序，但实际四角效果只能试 |
| docs/advanced/ii/ui/text.md | 一行文字 | `text` 属性放内容，`fillStyle` 默认白色；描边用 `strokeStyle` 与 `strokeWidth`，描边计入尺寸 | `Text`、`Font` 从哪个包 import？TSX 里能不能直接写字号，还是一定要造 `Font` 实例 | 照抄 `new Text()` 和 `new Font()` 就能用，但 import 行要自己猜 |
| docs/advanced/ii/ui/text.md | 字体 | `Font` 构造参数顺序 `(family, size, sizeUnit, weight, italic)`；默认值用 `Font.defaults()`，改少量用 `Font.clone` | 怎么设置全局默认字体？`Font.defaultFamily` 这些静态默认值可不可以直接赋值？我只能每个文字都 clone 一遍 | 改静态默认值就能全局生效，或者只能逐个传 `font` |
| docs/advanced/ii/ui/text.md | 尺寸与居中 | 文字宽高由测量决定，给 `width`、`height` 不裁剪；锚点 0.5 让 x、y 落在中心 | 示例同时写了 `loc` 里的两个锚点和外面的 `anchorX`、`anchorY`，重复时以哪个为准？垂直居中算不算行高和描边 | 两种写法结果一样；但如果不一样我也不知道该信哪个 |
| docs/advanced/ii/ui/image-and-texture.md | 图片元素需要什么 | `image` 属性接收纹理对象，`loc` 决定画多大，纹理会被拉伸铺满 | 我只有一张 PNG 图标文件，怎么把它变成纹理对象？文档只教了用 canvas 现画一张，没有讲加载文件 | 我能显示文档里画的棋盘，但放不进自己的图标 |
| docs/advanced/ii/ui/image-and-texture.md | 造一张最小纹理 | `Texture` 来自 `@motajs/render`，接受 `HTMLCanvasElement`、`ImageBitmap`、`HTMLImageElement`；用 `document.createElement('canvas')` 画棋盘 | 我不知道 canvas 是什么，`getContext('2d')`、`fillRect` 只是照抄；文档还提到 `onMounted`，但没介绍它是什么、在哪里写 | 复制这段代码能出棋盘，但换图片源时卡住 |
| docs/advanced/ii/ui/image-and-texture.md | 像素图设置 | `noanti` 关抗锯齿且优先于 `anti`，`hd={false}` 关高清缓存，两者一起关才有硬边 | “高清缓存 / 逻辑像素”是什么意思？如果我的 UI 整体被缩放，`hd={false}` 会不会反而糊 | 像素图按文档设置后边缘变硬 |
| docs/advanced/ii/ui/image-and-texture.md | 应用层素材标签 | 存在 `icon`、`winskin`、`map-render` 三个标签，分别用于图标、窗口皮肤、地图渲染 | 它们“按应用层素材约定使用”，可约定在哪？没有链接也没有示例；我正想做物品图标，却无法从这里继续 | 想用 `icon` 显示物品图标，但不知道标签怎么写、素材放哪 |
| docs/advanced/ii/ui/layer-transform-performance.md | 遮挡：zIndex | `zIndex` 大者后绘制、先命中；不改变坐标与父布局 | 跨容器时是否同一套层叠？父容器没设 `zIndex`，子元素的大 `zIndex` 能不能压过另一个后绘制的容器 | 提示框放在列表容器里也能盖住外层其他区域 |
| docs/advanced/ii/ui/layer-transform-performance.md | 变换：scale、rotate 与 alpha | `scale` 必须两元数组，`rotate` 用弧度，`alpha` 为 0 到 1，绕锚点变换 | 缩放容器时子元素和命中区域会一起缩放吗？旋转后点击区域还是原来的矩形吗 | 缩放容器后里面文字和按钮都跟着缩，点击位置也对 |
| docs/advanced/ii/ui/layer-transform-performance.md | 显示开关：优先 hidden | `hidden` 不显示不交互但保留状态；三元会卸载并重置状态；给了选用场景清单 | `const open = ref(true)` 里的 `ref` 从哪来？这一篇在第 8 篇之前就用了响应式和 `onClick`，我照抄会不知道缺什么 | 照抄开关示例就能点开面板，但实际会因没引入 `ref` 卡住 |
| docs/advanced/ii/ui/layer-transform-performance.md | 缓存：cache 与 nocache | 默认缓存 `container`、`custom`、`container-custom`；默认不缓存 `text`、`image`、`template` 和全部 `g-*`；`nocache` 优先 | 缓存后“让元素知道自己脏了才会重绘”，可怎么让它知道？改文字、换颜色、滚动列表后要不要手动标脏 | 给静态面板开缓存会变快，但动态内容可能停在旧画面且我不知道怎么修 |
| docs/advanced/ii/ui/layer-transform-performance.md | `noevent：可见但不接收交互`；`filter 与 composite` | `noevent` 继续绘制但跳过命中，事件下穿，`cursor` 失效；`filter` 与 `composite` 两个属性存在，接受滤镜字符串与混合模式，取值很多、入门不必记 | 把 `noevent` 加在容器上，是整棵子树都不接收，还是只容器自身？遮罩里的子元素还能点吗；具体有哪些可用值？文档明确说再查，但没说去哪里查 | 弹窗遮罩加 `noevent` 后，下面所有按钮恢复可点；做暗色遮罩用 `alpha` 就够，暂时不用这两个 |
| docs/advanced/ii/ui/reactivity.md | `## ref：带 value 的盒子`（第 15–35 行示例） | `ref` 读写要写 `.value`；点击改 `count.value`，渲染函数里读它就记录依赖；`defineComponent` 返回 render 函数 | 第 1 篇说 UI 组件必须继承 `IGameUIPropsBase` 配 `DefaultProps`、props 列表要有 controller/instance/state、还要 `new GameUI(...)` 注册；这里的 `defineComponent(() => ...)` 既没有 props 参数也没有第二参数和注册。我不知道它算不算一个能打开的 UI | 直接把这段当面板用，发现没有可打开的入口；套回第 1 篇模板后，又不知道 `ref` 该写在 setup 的哪一步、结构怎么并进原来那份 TSX |
| docs/advanced/ii/ui/reactivity.md | `## reactive：一整块对象`（第 50–71 行） | `reactive` 返回代理，字段读写不用 `.value`；不能整体替换；解构丢响应式，要逐字段赋值 | 这段 `const panel = reactive(...)` 写在哪一层？模块顶层、`setup` 内、还是渲染函数外？写模块顶层时，打开两个面板会不会共用同一份 `panel` | 放在模块顶层后，开两个面板改一个另一个跟着变；或者放在组件内却每次重渲染都被重建，两种结果我都不知道哪个才是文档意图 |
| docs/advanced/ii/ui/reactivity.md | `## watch：副作用`（第 103–117 行） | `watch(源, (next, prev) => ...)`，数据变化后执行回调，适合日志/同步/一次性动作 | 组件卸载时 watch 要不要手动停？文档只对快捷键作用域说了自动清理，对 watch 一句没提 | 反复开关面板后旧回调还在跑、越积越多；我不知道该不该把返回的停止函数存起来 |
| docs/advanced/ii/ui/reactivity.md | `## 什么时候用 shallowRef 与 markRaw`（第 119–126 行） | 大对象整体替换用 `shallowRef`；外部实例用 `markRaw`；不确定就先用 `ref`/`reactive` | 第 6 篇的 `Texture`、画布这类对象算不算「外部实例」，要不要 `markRaw` 包一层再塞进组件？两篇之间没有一句话把它们接起来 | 把纹理放进 `ref` 后不确定会不会被 Vue 深层代理、会不会变慢或行为异常，只能先不管 |
| docs/advanced/ii/ui/reactivity.md | `## props 不要解构`（第 128–140 行） | 不要解构 `props`，直接读 `props.title`；完整写法在第 12 篇 | 本篇所有示例都没出现 props 参数，我不知道在 `defineComponent(() => ...)` 里 `props` 从哪来、要不要先声明 props 列表才收得到 `title` | 照着写 `props.title` 会拿不到值或类型报错，只能先跳过这段、等第 12 篇 |
| docs/advanced/ii/ui/events.md | `## 事件对象`（第 32–59 行） | `offsetX/offsetY` 相对触发元素，`absoluteX/absoluteY` 相对画布；`identifier` 区分多指；`type` 是按键种类；`buttons` 是位组合，判断左键要用位运算 | `type` 的可选值到底是什么（数字、字符串还是枚举）？判断左键该写 `ev.type === ?`？`buttons` 的左键位掩码是多少？文档只说「用位运算」，没给常量 | 想实现「只响应左键」时无从下手，只能先对所有按键都响应，或者去猜魔法数字 |
| docs/advanced/ii/ui/events.md | `## 捕获与冒泡`（第 61–77 行） | 捕获从外层向内、冒泡从内向外；`stopPropagation()` 分阶段阻止且不阻止同一元素其它监听器；示例给了父 `onClickCapture` + 子 `onClick` | 示例里父容器的捕获和子元素的冒泡到底谁先执行？正文那句「子元素先捕获、父元素后冒泡」让我拿不准顺序；同一元素上 `onClick` 与 `onClickCapture` 的相对顺序也没说 | 照抄写日志时，最后显示的值和我以为的执行顺序相反，我却判断不出是自己理解错还是写法有问题 |
| docs/advanced/ii/ui/events.md | `## 一组完整的交互`（第 116–154 行） | 用 `ref` 驱动颜色、光标、滚轮累计；事件回调只改 `ref`，画面由渲染函数按当前值生成 | 这段同样是裸 `defineComponent`，没有 props、没有 GameUI 注册，我不知道它作为「完整交互」能不能直接挂进游戏；也不知道 `onWheel` 在子元素铺满父容器时还能不能触发 | 放进文档 demo 能跑，搬进真实面板后整块打不开，或者滚轮完全没反应 |
| docs/advanced/ii/ui/events.md | `## enter 与 leave 不走普通冒泡`（第 79–81 行） | enter/leave 由根节点悬停集合统一触发，不按普通冒泡传递；父级要感知就自己在父级挂 | 鼠标从父容器移到它的子元素上，会不会触发父级 leave 再 enter？父子之间的悬停边界怎么算？文档没给判定 | 做悬停高亮时，鼠标扫过子元素导致父级反复 enter/leave，画面闪烁，我不知道该怎么规避 |
| docs/advanced/ii/ui/events.md | `## actionStroke：只把描边算作命中`（第 112–114 行） | 加 `actionStroke` 后只有描边算命中，内部区域下穿 | 描边只有 1px 时，命中区是不是也只有 1px、有没有最小命中宽度？第 3 篇说它不改绘制，但没说命中宽度是否跟 `lineWidth` 走 | 细边框几乎点不中；我不知道该不该配合加大 `lineWidth`，加大又会让视觉变粗 |
| docs/advanced/ii/ui/hotkey-in-ui.md | `## useKey：拿到当前组件的作用域`（第 21–28 行） | `useKey` 必须在 `setup` 中同步调用，返回当前组件的按键实现对象；组件卸载自动离开；可以直接用非空断言 `!` | `useKey` 从哪个包 import？这段没有 import；`props.state.hotkey.system` 这条路径也没解释（第 1 篇只说 `props.state` 是 ClientCore）；这段该放在 `defineComponent` 的哪个位置也没说 | 复制后编译报 `useKey` 未定义，或者 `props` 在该作用域根本不存在 |
| docs/advanced/ii/ui/hotkey-in-ui.md | `## implement：把指令接到回调`（第 32–46 行） | `implement` 可连续调用、返回对象本身；同一次挂载对同一指令重复 implement 会覆盖 | 指令 id 拼错、或指令还没注册就 implement，会发生什么（报错还是静默）？文档没说 | 写了 `@common/exit` 按 Esc 没反应，我分不清是 id 错、作用域没挂上，还是被上层界面抢先处理了 |
| docs/advanced/ii/ui/hotkey-in-ui.md | `## 触发方式：HotkeyEmitMode`（第 74–82 行） | 三种模式：默认 `KeyUp` 抬起、`Once` 按下一次、`Continuous` 按住持续并配合 `interval` 控制最小间隔 | `interval` 写在哪个字段、单位是毫秒还是帧、默认多少？`addCommand` 的完整配置项也没列全（目前只见过 defaults/mode/priority/block） | 想做「按住连续翻页」时不知道 `interval` 怎么填，只能反复试数字 |
| docs/advanced/ii/ui/hotkey-in-ui.md | `## 优先级与阻断`（第 84–95 行） | `priority` 越高越先执行，目前只对抬起触发有效；`block` 阻断更低优先级；同优先级全部执行、不互相阻断 | 同时挂着多个界面（主界面 + 弹出面板）时，它们的按键作用域怎么排序？`priority` 是全局比较还是只在同一作用域内比较？文档没说 | 面板打开时按 Esc，可能同时关掉面板和下层界面，或者关掉的根本不是我以为的那一层 |
| docs/advanced/ii/ui/hotkey-in-ui.md | `## 注册新指令与分组`（第 48–72 行） | `addCommand(id, 显示名, { defaults, mode })`；`setGroup(id, 显示名, [指令])`；`defaults` 是二维数组，组内最后一个是主按键，前面的要先按住；不分组也能用 | 组合键的实际写法没有示例（例如 Ctrl+S）；`KeyCode` 还有哪些值、能不能用字符串代替也没说 | 想加 Ctrl 组合键时不知道数组该怎么排，只能先只做单键 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | `## 循环：用 map 生成元素`（第 50–65 行） | TSX 没有循环指令，用 `labels.map(...)` 返回元素数组；固定顺序、无内部状态的列表不需要 key | 这段 `{ labels.map(...) }` 应放在渲染函数的哪个位置、外面要不要包 `container`？示例是游离表达式，不是完整 return；map 出来的元素是否必须有父容器也没说 | 直接贴进 render 会结构不对，或者元素没有父容器导致定位异常 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | `## key：只在需要保留身份时加`（第 67–96 行） | 会增删、重排且需要保留身份时用稳定 id 作 key；不要用数组下标代替会变化的身份；无状态固定列表不加 | 怎么在 `ref` 数组上做增删（push / splice / 整体替换）才会触发更新？文档只给了初始 `ref<Row[]>([...])` 和渲染，没有修改示例 | 往 `rows.value` 里 push 一项后界面不刷新，或刷新行为和预期不同，只能猜哪种改法有效 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | `## 三种写法怎么选`（第 98–105 行） | 四种组合的条件与结果对照：hidden 保留状态、三元重置、固定列表 map 不要 key、动态列表 map + key | 列表项如果是自定义组件（不是 `text` / `g-rect`），key 写在哪一层、是否和普通元素一样？表格没覆盖组件项 | 给组件列表加 key 时不确定加在组件标签上还是外层容器上，可能加错层级导致状态仍然错位 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | `## 条件：优先 hidden`（第 5–25 行） | `hidden` 不显示、不交互但保留元素与状态；频繁开关的面板用它 | `hidden` 的元素还占不占布局位置、会不会影响兄弟元素定位？第 2 篇说坐标相对父容器，我猜不影响，但这一篇没有确认 | 隐藏上方区域后，不确定下面的元素会不会上移；如果会，我就得改用三元 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | `## 边界与注意`（第 125–130 行） | hidden 元素仍在树里；三元成本在初始化与状态重置；map 每项结构要稳定；key 不是性能开关也不是修重挂载的手段 | 「不要在同一处混用不同标签却不给 key」和前文「固定顺序无状态不需 key」的边界在哪？什么算「混用不同标签」 | 列表里同时有 `text` 与 `g-rect` 时，不确定要不要补 key，加了又怕违背「无状态不要加」 |
| docs/advanced/ii/ui/props.md | L35–L48：`SetupComponentOptions<ItemCellProps, ItemCellEmits, keyof ItemCellEmits>` 与 `defineComponent<...>` 的三个泛型 | 第 1 篇的模板只写了一个泛型 `defineComponent<MyPanelProps>(props => ..., propsList)`；第 12 篇说要先声明 Props 接口，再把用到的键列进 `props` 数组。 | 第二个泛型 `ItemCellEmits` 和第三个 `keyof ItemCellEmits` 分别代表什么；`keyof` 在这里为什么能当第三个参数；什么时候必须写满三个、什么时候一个就够。文档没有一处把泛型顺序讲成一句话。 | 照抄 `ItemCell` 能跑；但自己新建一个组件时不知道该复制几个泛型，可能只写一个泛型、把 `emits` 漏掉，或把 `keyof` 写错位置。 |
| docs/advanced/ii/ui/props.md | L91–L93 与 L175–L182：父组件写 `v-model:selected={pickedA.value}` / `v-model:open={open.value}` | 第 1、11、13 篇都反复说“TSX 里没有模板指令”；第 12 篇说 `update:xxx` 只通过 `v-model:xxx` 消费，等价于“传入值并在子组件发出 `update:xxx` 时写回”。 | 既然 TSX 里没有模板指令，`v-model:selected` 这串东西在 JSX 属性位置到底怎么被识别；它写回的是 `pickedA.value` 还是 `pickedA`；为什么同篇又说“属性名必须 camelCase”，而这里 `v-model:selected` 带冒号。 | 照写后不确定 `v-model:selected` 会真正建立双向绑定，还是被当成一个普通属性透传下去；可能退回去手写 `selected` 加 `onUpdate:selected`，又和文档“不要写成手动监听”冲突。 |
| docs/advanced/ii/ui/props.md | L233：边界与注意里的“属性会落到 `attrs` 而不是 `props`” | 第 1 篇说 props 数组少写一个键就拿不到值；第 12 篇说漏写键名等于没传。 | `attrs` 是什么、在哪个对象上、是不是自动生效；这一篇只提了一句，定义要到第 14 篇才出现。 | 传了 `size` 却没生效时，不知道该先查 `props` 数组、`attrs`，还是属性名大小写；照抄时容易把“漏写键名”误判成组件没渲染。 |
| docs/advanced/ii/ui/props.md | L112–L129：`const size = props.size ?? 64` 与 `computed(() => props.size ?? 64)` 的差别 | 知道默认值用 `??`，不能给 props 赋值；setup 顶部读一次只保留挂载时的值，`computed` 会跟着 props 更新。 | 示例里的 `size` 正好是“不会变的基础尺寸”，但父组件示例又给三个格子传了不同的 `size`；如果父组件之后改 `size`，哪个写法会重画、哪个不会，需要自己从“读一次”推断。 | 照抄 `const size = props.size ?? 64` 并把 `size` 用在 `loc` 里，父组件后续改 `size` 时格子不变化，容易当成渲染失败。 |
| docs/advanced/ii/ui/props.md | L78–L94：父组件直接写 `<ItemCell ... />`，但没有 import 片段 | 知道 TSX 里元素标签是小写的 `g-rect`/`text`；知道父组件准备数据、子组件通过 props 接收。 | 大小写标签的规则没有被明确说出；`ItemCell` 从哪里 import、组件和普通元素在 TSX 里靠什么区分；父组件这段代码是否要放进 render 函数。 | 复制父组件片段时会缺 import，或把 `<ItemCell>` 当普通元素理解，导致不知道该怎么在页面里注册/引入子组件。 |
| docs/advanced/ii/ui/component-tsx.md | L31–L44 与 L111–L133：有的 `defineComponent` 带第二个参数，有的不带 | 第 12 篇的 `ItemCell` 和本篇的 `ItemCell`/`Card` 都传了第二个参数 `itemCellProps`/`cardProps`；本篇 `Ticker` 写的是 `defineComponent(() => {...})`，没有第二个参数。 | 第二个参数在什么时候可以省略；没有 props 的组件是否必须写一个空 options；省略后还会不会生成 props 数组、`emit` 还能不能用。文档只展示了两种写法，没有给判断规则。 | 自己写一个无 props 的小组件时，可能完全不写第二个参数；一旦以后要加 prop，又不知道是该补 options 还是靠别的方式声明。 |
| docs/advanced/ii/ui/component-tsx.md | L157–L212：`expose` 与父组件 `const card = ref<CardExpose>()`、`<Card ref={card} ... />` | 知道 `emit` 是子发父、`expose` 是父调子；知道第 8 篇的 `ref` 是带 `.value` 的响应式盒子。 | `ref<CardExpose>()` 什么时候被赋值、由谁赋值；`expose` 暴露的对象和 `ref` 之间是谁绑定的；父组件片段只 import 了 `ref`，`CardExpose`/`Card` 从哪来；`ref={card}` 在 TSX 里是不是普通属性。 | 照抄后点按钮调用 `card.value?.focus()` 可能一直是 `undefined`，或 `card.value` 拿到的是整个组件实例而不是 `{ focus }`；不知道要不要等 `onMounted`。 |
| docs/advanced/ii/ui/component-tsx.md | L104–L141：`onMounted` / `onUnmounted` 与 `window.setInterval` | 知道生命周期钩子要在 setup 体内同步调用；在 `onMounted` 里建监听/定时器，在 `onUnmounted` 里清；第 6 篇也提过纹理放 `onMounted`。 | “同步调用”具体指不能放在 `await` 之后还是不能放在回调里；`window.setInterval` 返回的 `number` 与浏览器/Node 类型差异；示例的 `let timer: number \| undefined` 为什么不用 `null`。 | 照抄定时器能跑；但把 `onMounted` 写进一个 `async` 函数或事件回调时，会静默不生效，读者不知道是自己写错还是环境问题。 |
| docs/advanced/ii/ui/component-tsx.md | L216–L230：组件与 UI 的区别表 | 知道普通组件只需继承 `DefaultProps`，UI 必须同时继承 `IGameUIPropsBase` 与 `DefaultProps`，且 props 数组包含 `controller`/`instance`/`state`；知道 UI 由 `GameUI` 注册。 | 把面板拆成普通组件后，`controller`/`instance`/`state` 要不要作为 props 往下传；普通组件如果需要关闭面板，应该自己发 emit 还是接收 controller。 | 按“普通组件不需要这三个值”去拆背包面板，拆到一半发现子组件里的关闭按钮拿不到 `controller`，再回头改 props 接口。 |
| docs/advanced/ii/ui/slots-and-attrs.md | L24–L37：`SlotsType`、`defineComponent<PanelProps, {}, string, PanelSlots>` 的四个泛型 | 第 12/13 篇已经见过一个泛型和三个泛型；知道 props 接口、emits 接口。 | 第二个泛型 `{}`、第三个 `string`、第四个 `PanelSlots` 各对应什么；为什么这里没有 emits 却要写 `string`；四个泛型的顺序从哪来。文档没有解释 `string`，也没有解释 `SlotsType` 与第四个泛型的关系。 | 照抄 `Panel` 能编译；自己写一个同时有 emits 和 slots 的组件时，不知道 `emits` 该放第二个还是第三个泛型，容易把类型放错位置导致 props/emit 推断全错。 |
| docs/advanced/ii/ui/slots-and-attrs.md | L29–L35 与 L113–L122：手写 `PanelOptions` / `FieldOptions` 代替 `SetupComponentOptions` | 第 12 篇明确说第二个参数由 `SetupComponentOptions` 约束，`props` 数组和 `emits` 数组都在这里声明；第 13 篇也照这个写法。 | 为什么第 14 篇改成自己声明 `interface PanelOptions { props: (keyof PanelProps)[] }` 和 `interface FieldOptions { props: ...; inheritAttrs: boolean }`；两套写法是否等价、能不能混用；`props: []` 空数组是否合法。 | 照抄 `Panel` 后，再写下一个组件时不知道应该用 `SetupComponentOptions` 还是手写 options；可能两套都写，或漏掉 `emits` 的类型约束。 |
| docs/advanced/ii/ui/slots-and-attrs.md | L61–L90：默认 slot 用标签之间内容，具名 slot 用子节点位置上的对象 `{{ title: ..., default: ... }}` | 知道 slot 在 TSX 里是函数；子组件用 `slots.default?.()`、`slots.title?.(...)` 调用；知道 `?.` 不能省。 | 父组件把具名 slot 写成“标签之间的一个对象”依据是什么；这个对象会被当成普通子节点、还是被 Vue 识别成 slots；默认 slot 的 `<text>` 与具名 slot 的对象能否同时出现、顺序有没有要求。 | 照抄具名 slot 时可能把对象当成普通 children 传下去，结果 Panel 里什么都不显示；或者默认内容与具名对象混写后只有一个生效。 |
| docs/advanced/ii/ui/slots-and-attrs.md | L106–L137：`attrs` 与 `{...attrs}` 透传、`inheritAttrs: false` | 知道没有被 props 声明、也没有被 emits 消费的属性会进入 `attrs`；可以 `{...attrs}` 原样交给内部元素；属性名仍然是 camelCase，透传不做转换。 | `attrs` 是不是响应式、父组件后续改属性时内部 `<text>` 会不会更新；`loc` 这种数组属性展开后是否原样可用；`inheritAttrs` 默认行为下属性会不会“既落根元素又落 text”两份；示例里的 `Font` 没有 import。 | 写 `<Field loc={...} fillStyle={...} />` 后，不确定属性最终落在 `Field` 的根元素还是内部 `text`，可能看到重复定位或样式不生效。 |
| docs/advanced/ii/ui/slots-and-attrs.md | L98–L102：作用域 slot 的数据由子组件传入 | 知道子组件调用 `slots.default?.({ count: 3 })`，父组件函数参数里拿到 `data`；知道 slot 类型写成 `(data: PanelData) => VNode`。 | 父组件函数参数的类型如何与子组件的 `PanelData` 对齐；如果父组件不写类型、或子组件改了传参结构，TS 会不会报错、运行时会不会静默变成 `undefined`。 | 照抄后能显示；但把 `count` 改名或加字段时，父组件可能仍按旧字段读，画面显示 `undefined` 而不知道是类型没接上。 |
| docs/advanced/ii/ui/builtin-text-and-input.md | `## TextContent：会换行的文字` 中 `loc={[40, 40]}` 与 `width={360}` | 知道 `width` 是必填的最大宽度，`autoHeight` 让高度跟内容走，`loc` 负责定位 | 不知道 `loc` 里的宽高和 `width` 是什么关系；`autoHeight` 时 `loc` 的 height 还要不要写；不写 height 会不会落到默认 200 | 照抄后能看到文字，但一旦想把它放进固定高度的区域，就不知道该改 `loc` 还是改 `width`，也不知道最终高度由谁决定 |
| docs/advanced/ii/ui/builtin-text-and-input.md | `## TextContent` 中 `interval={40}` | 知道 `interval` 是逐字显示的间隔，省略或为 0 时直接显示全部 | 不知道单位是毫秒还是别的；40 是快还是慢；也不知道能不能中途改速度 | 复制后只能凭感觉调数字；想做“快进/慢速”时没有依据 |
| docs/advanced/ii/ui/builtin-text-and-input.md | `## Textbox：带背景与标题的说明框` 中 `TextboxStore.get('task-box')` | 知道组件内部为每个文本框建了 `TextboxStore`，可按 id 取回控制器并 `setText` | 不知道在哪里给 `Textbox` 设置这个 id；示例里的 `Textbox` 没有 `id`、`name` 或类似属性 | 照抄 `TextboxStore.get('task-box')` 会拿不到东西，因为我不知道该把 `'task-box'` 写在哪 |
| docs/advanced/ii/ui/builtin-text-and-input.md | `## Input：在画布上输入` 的“点击位置创建真实的输入框并对齐到画布，失焦后收起” | 知道 `Input` 用 `v-model:value`，有 `multiline`、`placeholder`、`border` 等属性 | 不知道“收起”后画布上还显示什么；值还在不在；如果一个表单有五个字段，点第二个时第一个会不会消失 | 以为 `Input` 是常驻输入框，实际点别处就看不到，可能做出“字段消失”的界面而不知道为什么 |
| docs/advanced/ii/ui/builtin-text-and-input.md | `## 特殊组件 InputBox：单次输入` 与 `## 边界与注意` | 知道 `getInput` 返回 `Promise<string>`，`getInputNumber` 返回 `Promise<number>`，确认后 `await` 拿结果；边界说面板提前关掉要自己处理“没有结果” | 不知道取消或关闭弹窗时 Promise 是 resolve 空串、resolve undefined，还是 reject；也不知道 `getInputNumber` 解析失败时返回什么 | 写 `const name = await getInput(...)` 后无法区分“用户没输入”和“用户输了个空串”，`try/catch` 也不知道该不该写 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | `## List：可选中的列表` 的“初始选中项以列表第一项为准” | 知道 `list` 是 `[id, 文本]`，`v-model:selected` 绑定选中 id；点击行会切换；初始以第一项为准，挂载后改绑定不会重选 | 不知道示例里 `ref('weapon')` 到底有没有作用；如果我从存档恢复 `'armor'`，该走什么“列表自己的交互”；父组件怎么知道实际选中了第一项 | 设 `selected.value = 'armor'` 后界面仍选第一项，父组件拿到的是 `'armor'` 还是 `'weapon'` 无法确定 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | `## ListPage：左列表、右详情` 的 `close`、`closeLoc` | 知道 `close` 显示关闭按钮，`closeLoc` 调整按钮位置，`right` 把列表放右边，`basis` 是左侧比例 | 不知道 `closeLoc` 的取值格式和坐标系：是相对 `ListPage` 的四元组，还是绝对画布坐标；也没有示例 | 想移动关闭按钮时不知道写什么，只能不动或反复试 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | `## Page：分页` 的默认 slot 写法 | 知道页码从 0 开始，`pages` 是总页数，默认 slot 收到页码索引；14 篇学过默认 slot 内容写在标签之间、具名 slot 用对象 | 不知道这里为什么把函数直接当 children（`{(index) => ...}`），而 `ListPage` 用 `{{ default: fn }}`；两种写法分别什么时候用 | 照 `Page` 写函数、照 `ListPage` 写对象，混用时可能什么都不显示，也不知道该改哪边 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | `## Scroll：只对直接子元素做虚拟滚动` 的“只渲染视口附近的直接子元素” | 知道子元素要平铺，不能用一个容器包住全部；每个子元素有自己的 `loc`；暴露 `scrollTo` 与 `getScrollLength` | 不知道 `Scroll` 怎么得到总高度和行高：是靠子元素 `loc` 推出来，还是要额外给高度；变高行怎么办；`scrollTo(y)` 的 y 是内容像素还是行号 | 平铺 30 行能滚，但想“跳到第 20 行”时不知道 y 该算成 `20 * 28` 还是别的；滚动条长度也无法预期 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | `## 特殊组件 ConfirmBox 与 Choices` | 知道 `getConfirm` 返回 `Promise<boolean>`，`getChoice` 返回选中 key；`maxHeight` 超了会分页；`selected` 是默认索引 | 不知道用户直接关掉弹窗时返回什么；`getChoice` 取消时是 undefined 还是 reject；`getConfirm` 的完整参数顺序也没有单独列出来 | `if (yes)` 可能永远等不到结果，或 `choice` 类型对不上；不敢把一次性弹窗接到关键流程里 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | `## 打开与关闭` 与 `## 背景` 的 `showBack` / `showingBack()` / `showBackground` / `hideBackground` | 知道 `active` 和 `showBack` 是引用值，TSX 里读 `.value`；`showingBack()` 返回背景最终是否显示；`hideBackground` / `showBackground` 是用户设置 | 不知道 `showBack.value` 和 `showingBack()` 什么时候会不同；想显示“背景现在可见吗”到底读哪个；四个名字太像，分不清谁改用户设置、谁读系统状态 | 在文字里写 `props.controller.showBack.value`，可能读到的是用户开关而不是最终结果，背景明明没显示却显示“已显示” |
| docs/advanced/ii/ui/ui-controller-and-stack.md | `## 显示策略` 的 `showCustom(new MyStrategy())` | 知道默认 `lastOnly`，`showAll` 全部显示，`showCustom` 接收自定义策略；关闭时是否连带关闭由策略决定 | 不知道 `MyStrategy` 要实现什么接口、有哪些方法、返回什么；文档没有给最小自定义策略示例 | 需要“只叠两层、第三层替换第二层”这类特殊叠放时无法下手，只能退回 `lastOnly` 或 `showAll` |
| docs/advanced/ii/ui/ui-controller-and-stack.md | `## 基础 props 注入` 的 `setPropsBaseCreator` | 知道控制器通过它给每个实例注入基础参数；示例返回 `{ instance, controller }`；UI 的 props 数组必须有 `controller`、`instance`、`state` | 不知道 `state` 是系统另外注入，还是也要 creator 返回；自定义 creator 会不会把 `state` 弄丢；`state` 到底从哪来 | 照示例写 creator 后，所有 `props.state.sceneController.open(...)` 都可能变成 undefined，但文档没有提示这一点 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | `## 当前没有全局注册 / 覆盖入口` 与第 1 篇的 `new GameUI('my-panel', ...)` | 知道 `GameUI` 把名字和组件绑在一起；打开时靠传进去的对象；当前构造 `GameUI` 不会自动登记，所以不能按名字取回内置 UI | 不知道名字现在还有什么用；重名会不会冲突；是否必须唯一；调试时能不能靠名字找到实例 | 以为名字可以用来按名打开或覆盖，结果发现只能持有对象；如果两个 UI 同名，我不知道会不会出问题 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | `## keep：切换时不闪背景` | 知道 `keep()` 在 close 与 open 的间隙保持背景，`safelyUnload()` 栈空才关，`unload()` 无条件关 | 不知道如果中间 `open` 抛错、提前 return 或用户取消，需不需要 `try/finally` 保证 unload；keep 对象能不能重复使用 | 切换流程一旦失败，背景可能一直留着；我不知道该怎么恢复，只能刷新整个界面 |
| docs/advanced/ii/ui/replace-builtin-ui.md | `## 改法一：在打开处替换` | 知道内置 UI 指 `src/client/ui` 的应用层界面，例如设置、存档、工具栏；替换就是找到 `open` 那一行，把 `SaveUI` 换成 `MySaveUI` | 不知道 `SaveUI` 从哪个模块 import、导出名是什么；文档只给名字，没有给路径；我也不能读源码 | 想替换存档界面，却找不到可以 import 的 `SaveUI`；只能猜路径，猜错就编译失败 |
| docs/advanced/ii/ui/replace-builtin-ui.md | `## 改法二：包装组件` 的 `defineComponent<MyPanelProps>((props, { attrs, slots, emit }) => ...)` | 知道包装要转发 props、attrs、slots、emits，对外契约不变；`OriginalPanel` 是原组件 | 不知道包装组件没有 `props` 数组时，父组件传的值到底进 `props` 还是 `attrs`；`{...props}` 与 `{...attrs}` 会不会重复；没有声明 `emits` 能不能 `emit('change')` | 照抄后父组件的某些设置不生效，或 `change` 事件不触发；我不知道该补 `SetupComponentOptions` 还是该改展开顺序 |
| docs/advanced/ii/ui/replace-builtin-ui.md | `## 改法二` 的 `interface MyPanelProps extends OriginalPanelProps {}` | 知道要保留原契约，所以包装的 Props 继承原 Props | 不知道 `OriginalPanelProps` 从哪里来；如果原 UI 是用 `GameUI` 注册的，包装的是里面的组件还是 `GameUI` 本身；原组件的 props 类型有没有导出 | 写不出 `extends OriginalPanelProps`，也不知道该不该自己重写一份 Props；包装方案卡在第一步 |
| docs/advanced/ii/ui/replace-builtin-ui.md | `## 改法三：改显示策略或背景` | 知道 `showAll()` 让栈里 UI 同时显示，`setBackground` 换稳定背景；这些是控制器接口 | 不知道这些调用应该写在哪一层：主入口、场景 UI、还是某个面板里；如果我只想改内置设置面板的叠放，而不改它的组件，代码放哪里才会影响它 | 把 `showAll()` 写在自己面板里，可能只影响当前控制器；不确定是否影响内置 UI 所在的栈 |
| docs/advanced/ii/ui/replace-builtin-ui.md | `## 运行效果` | 知道示例并排对比 `lastOnly` 与 `showAll` 的叠放效果 | 示例没有演示“替换”本身：看不到 `MySaveUI` 替换 `SaveUI`，也看不到包装组件转发 props 的效果 | 看完仍无法确认自己的替换是否成功，只能等真正接到客户端里试 |
| docs/advanced/ii/ui/ui-performance.md | `## 症状与排查` 与 `## 边界与注意` 的“先测再改” | 知道卡顿先查大子树和缓存，切页闪烁查背景和 keep，频繁重建查 open/close，列表掉帧查是否平铺 | 不知道怎么测：没有 FPS、帧耗时、绘制次数、日志或性能面板的用法；也没有“改前/改后”怎么对比 | 只能凭感觉改，改完不知道是真的更快还是心理作用；症状表给了方向但没法验证 |
| docs/advanced/ii/ui/ui-performance.md | `## 缓存：cache 与 nocache` | 知道 `container`、`custom`、`container-custom` 默认缓存；`text`、`image`、`g-*` 默认不缓存；`nocache` 优先 | 不知道如果 `container` 里有每帧变化的 `text`，父容器的默认缓存会不会让整块不更新；要不要给父 `container` 加 `nocache`；脏标记会不会传到缓存的父级 | 做动画文字时可能文字不刷新；不知道该关父容器缓存还是把文字拆出去 |
| docs/advanced/ii/ui/ui-performance.md | `## 列表与分页` 的“规则见 `dev.md`” | 知道大量列表优先 `Scroll`、分页优先 `Page`；`key` 只在会重排、插入、删除且需要保留身份时加；11 篇也讲过类似规则 | 不知道 `dev.md` 是什么、在哪里；我手里只有这套 UI 文档；`Scroll` 示例又给每行加了 `key={index}` | 读到“见 dev.md”会停一下；不确定该按 11 篇的规则还是按 `Scroll` 示例写 `key` |
| docs/advanced/ii/ui/ui-performance.md | `## 基础 props` 的“自定义 `createPropsBase`” | 知道每个实例渲染都会走一次基础参数创建，creator 里不要做重活；读状态、算大数组、创建对象放到别处 | 不知道 `createPropsBase` 和 17 篇的 `setPropsBaseCreator` 是不是同一个东西；自定义时方法名到底写哪个；怎么把“现成的值”装进去也没有示例 | 按 19 篇的名字去找方法找不到，或写错名字不生效；也不知道该在哪里预先算好值 |
| docs/advanced/ii/ui/ui-performance.md | `## UI 栈` 的“`keep` 用完必须卸载” | 知道能 `hide`/`show` 就不重建；稳定背景用 `setBackground` 移出栈；`keep` 只在关一个开一个的间隙用，用完 `safelyUnload()` 或 `unload()` | 不知道异常路径怎么保证卸载；如果中间 `open` 失败，`keep` 是否还在；要不要 `try/finally` | 和 17 篇一样，切换失败后背景一直留着，不知道怎么恢复 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | `## 先把文件拆好`（五个文件的表格 + “其余四个文件先留空或放占位组件”） | 最终拆成 5 个文件；`InventoryPanel` 是唯一被 `GameUI` 注册的组件，其余四个是普通子组件；本篇只写 `inventory-panel.tsx`。 | 这 5 个文件该放在项目的哪个目录、文件名和路径有什么约定、其它四个占位文件最小要写成什么样才能通过编译；全篇没有出现任何 `import` 路径或目录说明。 | 我会在自己项目里新建一个目录放这 5 个文件，但不知道构建会不会自动找到它们；四个空文件可能直接编译失败，连骨架都跑不起来。 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | `## 骨架代码`（`<g-rectr ... fill ... stroke ...>`） | `fill` / `stroke` / `strokeAndFill` 是模式开关，颜色由 `fillStyle` / `strokeStyle` 给；`g-rectr` 默认填充；圆角用 `circle`。 | 同时写 `fill` 和 `stroke`（而不是写 `strokeAndFill`）时，到底是“填充+描边”还是其中一个盖过另一个；文档分别讲过三种模式，却没讲两个开关同时出现。 | 我会照抄得到一块带蓝色描边的深色圆角面板；如果两个开关不能并存，我可能只得到填充或只得到描边，而且不会报错，很难判断哪里不对。 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | `## 骨架代码`（根 `<container loc={[0, 0, 720, 480]}>`）与 `## 运行效果` | `loc` 前两项是左上角、后两项是宽高；默认尺寸 200×200；live 按 720×480 展示。 | 720×480 是 UI 自己的逻辑尺寸，还是必须等于游戏画布尺寸；UI 比画布大或小时会不会被裁剪或缩放；我自己的魔塔画布不是 720×480 时该怎么定尺寸。 | 我会直接把根容器写成 720×480，但在自己游戏里可能只看到左上角一块，或者整块被拉伸；文档没有告诉我该按画布还是按面板设计尺寸。 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | `## 打开它` | 场景 UI 用 `props.state.sceneController.open`；另一个 UI 内用 `props.controller.open`；主 UI 栈用 `props.state.mainUIController.open`；没有全局 `client`。 | 如果我不在 UI 组件里（比如游戏主入口、场景脚本），手上没有 `props`，该从哪里拿 `sceneController` / `mainUIController`；文档只说“在主入口你持有的客户端核心实例上调用”，没给主入口长什么样，也没说客户端核心实例怎么获得。 | 我写完骨架后不知道把打开代码贴到哪里；在 UI 组件外写 `props.state` 会直接报错，我只能回头猜或去翻别的章节。 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | `## 先把文件拆好`（“留空或放占位组件”） | 四个子组件后续逐篇补全；`InventoryPanel` 负责组合它们。 | 占位组件最小要满足什么（要不要 `defineComponent`、要不要声明 `props`）才能被 `import` 又不报错；文档没有给占位写法。 | 我可能建四个空 `.tsx`，一 `import` 就编译失败；或者随便写个组件但 `props` 对不上，后面替换时还要回头改骨架。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | `## ItemGrid：按行列排列`（外层 `<container loc={[0, 0, 0, 0]}>`） | `container` 的 `loc` 是 x/y/w/h；不写尺寸默认 200×200；`container` 是布局单位与事件捕获单位；子元素坐标相对父容器。 | 宽高为 0 的容器会不会裁剪子元素、会不会让子元素无法命中；文档从没说过 `container` 是否裁剪溢出内容。 | 我照抄一个 0×0 容器包住网格；如果容器裁剪，我会看到一片空白，点击也没反应；如果它只是布局壳，则一切正常。我无法从文档判断是哪一种。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | `## ItemGrid：按行列排列`（每个格子外包 `<container loc={[x, y]}>`，没给宽高） | 不写宽高默认 200×200；`container` 参与命中；`zIndex` 决定遮挡与命中先后。 | 这个 200×200 的外壳会不会盖住相邻格子、把点击算到错误的格子上；命中区域是按容器自身矩形，还是只按可见子元素。 | 我的格子间距只有 8，外壳 200×200 会互相重叠；点第二格可能被第一格的外壳接住，选中项乱跳。文档没有说明该不该给外壳补 `size`。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | `## 放回面板`（`items.find(...)`；对照下一篇的 `items.value.find(...)`） | 选中项用 `computed` 从 `items` 与 `selectedId` 派生；`find` 找不到返回 `undefined`。 | `items` 在最终代码里到底是普通数组还是 `ref`；本篇写 `items.find`，下一篇写 `items.value.find`，我不知道假数据该定义成哪一种、`computed` 里该不该写 `.value`。 | 我照本篇写可能得到“`items.find` 不是函数”或响应式不更新；照下一篇写又要改数据定义。我只能二选一赌一个。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | `## ItemCell：一个格子`（`const size = props.size ?? 66;`） | `props` 是响应式的、不能解构；随数据变化的派生值应放 `computed`；尺寸这类不变的基础值可以在 setup 读一次。 | `cellSize` 会不会在运行时变（`边界与注意` 提到“网格区域尺寸变化时重新算列数”，暗示会变）；如果父组件改 `cellSize`，`ItemCell` 里只读一次的 `size` 会不会保持旧值。 | 我先照抄；窗口或区域变化后只有列数变了，格子尺寸不跟着变，出现重叠或留白。我不确定是否该主动改成 `computed`。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | `## 放回面板` + `## 边界与注意`（选中与未选中） | `selectedId` 初始为 `'potion-red'`；点击只会上报有效 id；详情篇要用 `undefined` 表示未选中。 | 在这个面板里怎样才会进入“没有选中”的状态；本篇没有任何清除选中的入口，文档也没说后面会加。 | 我会以为点空白处或再点一次可以取消，但代码里没有；到了详情篇看到“请选择道具”的提示，我不知道它何时会出现，也不知道要不要自己补一个取消按钮。 |
| docs/advanced/ii/ui/inventory-example-3-detail.md | `## 选中项由父组件派生`（`items.value.find`） | `selectedItem` 是 `computed`；`ItemDetail` 的 `item` 可选；`find` 返回 `undefined` 时显示提示。 | `items` 的数据形态。我在上一篇刚看到 `items.find`，这一篇变成 `items.value.find`；我不知道最终 `InventoryPanel` 里 `items` 是 `ref` 还是普通数组，也不知道假数据该放哪。 | 我按这一篇把 `items` 写成 `ref`，上一篇的 `items={items}` 就要改成 `items.value`；改动会牵连 grid 段代码，而文档没有给合并后的完整版本。 |
| docs/advanced/ii/ui/inventory-example-3-detail.md | `## ItemDetail：右侧面板`（两个没有 `loc` 的 `<container hidden=...>`） | `container` 不写 `loc` 时默认 200×200；`ItemDetail` 外框是 196×330；`hidden` 只切换显示与交互。 | 这两个内层容器没有给尺寸，默认 200×200 会不会超出 196 宽的详情区、会不会裁剪或挡住右侧边缘；`TextContent` 的 `autoHeight` 超过 200 高时，是被容器裁掉还是继续撑开。 | 长描述会画到容器外，或者被裁掉；我不知道该不该给内层容器补 `loc={[0, 0, 196, 330]}`，文档没说 `container` 默认是否裁剪。 |
| docs/advanced/ii/ui/inventory-example-3-detail.md | `## ItemDetail：右侧面板`（`TextContent` 的 `autoHeight` 与 `loc`） | `TextContent` 的 `width` 必填；`autoHeight` 让高度跟内容走；`TextContent` 需要完整客户端才能跑。 | `autoHeight` 时元素高度由谁决定、会不会和父容器 200×200 的默认高度冲突；我在只读文档、没有完整客户端的情况下怎么确认它没被裁。 | 我照抄后描述可能只显示一部分，而且 live 里用的是 `text` 等价实现，看不出真实 `TextContent` 的效果；我无法验证。 |
| docs/advanced/ii/ui/inventory-example-3-detail.md | `## 运行效果`（“点「取消选择」可以看到没有选中时的提示”） | live 会演示未选中提示；live 用元素层 `text` 等价展示，正文代码块才给 `TextContent` 真实写法。 | 正文代码里没有“取消选择”按钮，也没有把 `selectedId` 设为 `undefined` 的逻辑；我不知道这个按钮是 demo 专用，还是我该在面板里实现。 | 我照正文搭完面板，永远看不到“请选择道具”；要么以为漏抄了，要么自己加一个文档没要求的按钮。 |
| docs/advanced/ii/ui/inventory-example-3-detail.md | `## ItemDetail：右侧面板`（`hidden={!!props.item}` 与 `hidden={!props.item}` 两块都渲染） | `hidden` 保留元素与状态；两块都渲染、用 `hidden` 切换；边界提到注意 `zIndex` 与遮挡。 | 两块容器都在 (0,0) 且默认 200×200，重叠时谁在上、会不会互相拦截点击；文档只提醒“注意”，没给判断方法或推荐写法。 | 我照抄后可能点不到详情里的内容，或者提示层挡住详情；我只能靠猜 `zIndex`。 |
| docs/advanced/ii/ui/inventory-example-4-scroll.md | `## 方案一：Scroll 平铺（推荐）` 的 `ItemGridScroll` 代码块与「`items` 与 `selectedId` 仍然来自 `InventoryPanel`」一句 | 第 21 篇把 `selectedId` 放在 `InventoryPanel`，用 `selectedId={selectedId.value}` 作为 prop 传给 `ItemGrid`；第 12 篇说 `props` 数组必须把用到的键列全，漏了就收不到 | 这个新组件没有 `props` 声明、没有 `SetupComponentOptions`，却直接用 `items` 和 `selectedId.value`。它们到底是父组件通过 prop 传进来的，还是同文件里的模块级变量，还是闭包？文档没说要从哪里拿、也没说 `InventoryPanel` 那一侧要怎么改 | 把代码复制进 `item-grid.tsx` 后 `items`、`selectedId` 会提示未定义；我分不清是该加 import、加 props，还是干脆写在同一个文件里 |
| docs/advanced/ii/ui/inventory-example-4-scroll.md | 同段 `const scroll = ref<ScrollExpose>()` 与 `import { Scroll, ScrollExpose } from '@user/client-base'` | 第 16 篇说 `Scroll` 暴露 `scrollTo(y, time?)` 与 `getScrollLength()`；第 15 篇见过 `TextContentExpose` 这种「用 ref 接方法」的类型 | 正文从没提过 `ScrollExpose` 是什么、为什么 `ref` 的泛型要填它；也没说 `Scroll` 在 TSX 上写 `ref={scroll}` 时，暴露对象是组件实例还是必须用这个类型 | 能照抄，但换一个内置组件（例如 `ListPage`、`Page`）时就不知道对应的 `XxxExpose` 名字，也不知道该不该一律用 `ref<SomeExpose>()` |
| docs/advanced/ii/ui/inventory-example-4-scroll.md | `## 方案一` 每个子元素写成 `loc={[0, row * 74, 362, 66]}`，`Scroll` 高 294、`padEnd={16}`；以及全篇没有「放回面板」一节 | 第 16 篇说 `Scroll` 只对视口附近的直接子元素做虚拟滚动、子元素要平铺；第 21 篇专门有「放回面板」，给出把 `ItemGrid` 塞回 `InventoryPanel` 的完整写法 | 子元素的 `y` 是否必须是「从 0 开始累加的绝对坐标」？`Scroll` 靠什么算出 `getScrollLength()`，是最后一个子元素的 `y + height`，还是要自己声明总长度？最后一行要不要另外留高度？另外 `items` 从 10 个变 40 个、`InventoryPanel` 里把 `<ItemGrid>` 换成 `<ItemGridScroll>` 这两步，本篇没有写 | 抄完组件能滚，但换行高或换两列布局后总滚动长度会算错；并且不知道六个文件该怎么最终拼起来，因为缺少把滚动版塞回面板的这一步 |
| docs/advanced/ii/ui/inventory-example-4-scroll.md | `## 方案二：ListPage 左列表右详情` 的 `const list = items.map(...)`、`onClose={() => (selected.value = '')}` 与 `default: key => items.find(...)` | `ListPage` 的 `list` 属性是「每一项 `[id, 显示文本]`」；本篇正文说 `items` 来自 `InventoryPanel`；第 22 篇开头 `items` 是普通 `const` 数组，第 22 篇「选中项由父组件派生」又写成 `items.value.find(...)`；第 16 篇说 `ListPage` 的关闭按钮只发 `close` 事件、真正关闭动作由调用方处理；第 22 篇说 `ItemDetail` 在没有选中时显示「请选择道具」 | 这里 `items` 到底是普通数组还是 `ref`？照这里的写法不写 `.value`，可第 22 篇同系列的另一段又写 `.value`。另外 `list` 的类型是 `[string, string][]`，`.map` 推出来的是 `string[][]`，直接传会不会报类型错误、要不要断言；点「关闭」之后，按这里只是把选中清空，面板本身没有关。那这个关闭按钮的语义是「清空选中」还是「关面板」？如果我想真的关，应该调 `props.controller.close(props.instance)`，但这里是 slot 里的组件，拿不拿得到 `props.controller`？ | 要么运行时 `items` 为 undefined 直接崩，要么 TypeScript 报「`string[][]` 不能赋给 `[string, string][]`」，我卡在类型上；点关闭后面板还在，只是右侧变成「请选择道具」，我会以为关闭功能坏了，或者以为要自己另外接控制器 |
| docs/advanced/ii/ui/inventory-example-4-scroll.md | `## 什么时候用 Scroll、ListPage、Page` 表格与 `## 边界与注意` 的 `container-custom` 一条 | 第 16 篇提过「滚动区域内部使用容器自定义标签 `container-custom`，是组件实现细节，作者不需要手动写」 | 第 16 篇说「不需要手动写」，本篇又写「只写 `container-custom`」，我不确定这句话是在禁止我写，还是在告诉我万一要写时只能这么写；也不知道「容器自定义标签」和普通 `custom` 标签是不是一回事 | 读到这里会犹豫要不要在 `Scroll` 里手写这个标签，怕写了反而破坏虚拟滚动 |
| docs/advanced/ii/ui/inventory-example-5-state.md | `## 已装备的格子` 的 `interface ItemCellProps` 扩展与 `<g-rectr ... strokeStyle={...} />` | 第 21 篇 `ItemCell` 的 `props` 数组是 `['item','selected','size']`；第 12 篇明确说「`props` 数组必须把用到的键写全，没写就收不到」，属性写错不报错、只是 `undefined` | 本篇只加了接口字段和描边表达式，没有给新的 `props` 数组（要不要把 `'equipped'` 加进去），也没有给 `ItemGrid` 怎么把 `equippedId` 传到每一格（`ItemGrid` 的接口和 `props` 数组是不是都要加？）。而第 21 篇的 `ItemGrid` 是显式逐个传 `item / selected / size` 的 | 只照着加接口字段，运行后 `props.equipped` 永远是 `undefined`，装备描边不出现，而且不报错，我会以为是颜色写错了 |
| docs/advanced/ii/ui/inventory-example-5-state.md | `## 状态放在 InventoryPanel` 的 `watch(() => selectedItem.value?.count ?? 0, (next, prev) => ...)` | 第 8 篇 `watch` 的例子是 `watch(count, cb)`，源是一个 `ref`，回调拿到新值与旧值；同篇也说 `computed` 只算值、副作用用 `watch` | `watch` 的第一个参数在这里是箭头函数而不是 `ref`，这是合法写法吗？`selectedItem` 是 `computed`，从 A 道具切到 B 道具时 `count` 也会变，这条 `watch` 会不会把我「换了个道具」误报成「数量变化」？另外要不要 `.value`、要不要 `{ immediate: true }` 都没说 | 能跑，但切换道具时提示会莫名其妙变成「数量：3 → 1」；我不知道这是设计如此还是我抄错了 |
| docs/advanced/ii/ui/inventory-example-5-state.md | `## 组装` 的 `<ActionBar ... onClose={() => (hint.value = '已请求关闭')} />` | 第 20 篇骨架里关闭按钮是 `props.controller.close(props.instance)`，而且边界注意里强调「关闭按钮必须在骨架阶段就能用」；本篇 `ActionBar` 只负责 `emit('close')`，由父组件决定 | 最终「关闭」到底该不该真的关面板？这里把 `close` 换成只改提示，和「面板能关闭」的目标不一致。如果我要保留真关闭，是不是写 `onClose={() => props.controller.close(props.instance)}`？那 `hint` 那句还要不要？ | 照抄后点「关闭」不关面板、只改了提示文字；可是本篇「运行效果」又说 live 能关闭，我会对不上 |
| docs/advanced/ii/ui/inventory-example-5-state.md | `## 遮罩与 noevent` 的 `<g-rect loc={[0,0,720,480]} ... noevent />` 与边界注意「遮罩要盖在画面之上、面板之下」 | 第 7、9 篇说 `noevent` 仍然绘制、跳过命中、事件下穿；第 24 篇说遮罩负责压暗、不挡点击 | 这个遮罩放进组件树的哪个位置？写在面板容器前面还是后面？「面板之下」是指 `zIndex` 更小、还是源码顺序更靠前？如果遮罩在面板下方，点击面板外的遮罩区域会直接下穿到场景，这算不算预期？遮罩尺寸该用整块 720×480 还是面板外框？ | 放错层时要么把整个面板也压暗，要么点击遮罩没有任何反应；我只能反复挪位置试 |
| docs/advanced/ii/ui/inventory-example-5-state.md | `## ActionBar：底部按钮` 的 `props.equipped ? '已装备' : '装备'` 与组装处 `equipped={!!equippedId.value}` | props 只读、不要解构；组件根据 props 渲染；装备状态只保存 id | `ActionBar` 的 `equipped` 看字面是「当前选中道具是否已装备」，但组装处传的是面板级的「有没有任何一个道具被装备」。两者语义不同。另外 `makeButton` 是在 `setup` 里定义并直接返回 JSX 的函数，它是否必须在 render 函数里调用才会随 props 更新？文档没说 | 选中一个没装备的道具，按钮仍然显示「已装备」；或者担心 `makeButton` 提前把 JSX 固定住，切换选中后按钮不刷新 |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | `## 动画：只改 alpha 与 scale` 整段，尤其 `const InventoryPanel = defineComponent(() => { ... })` | 第 20 篇 `InventoryPanel` 是同时继承 `IGameUIPropsBase` 与 `DefaultProps`、`props` 数组含 `controller/instance/state` 的 UI；第 13 篇说 `setup` 返回 render、`onMounted` 起、`onUnmounted` 清 | 这段把 `InventoryPanel` 整个重新定义了一遍，里面只有一块描边，没有 props、没有网格、详情、按钮。它是「替换原文件」还是「只把 `pulse` 那段并进已有 `InventoryPanel`」？合并进已有文件时，`defineComponent` 的泛型与 `props` 数组怎么办？`pulse` 要传给哪个子组件？ | 直接当新 `InventoryPanel` 用，整个背包面板会被一个边框取代；保守一点就停在半路，不知道代码该贴到哪里 |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | 同段注释「只改 `alpha` 与 `scale`」与 `loc={[30,30,660,420]}` 的 `<g-rectr>`；标题又说「让选中态动起来」 | 第 21 篇的选中态是 `ItemCell` 里那一圈描边（`selected ? '#f2b84b' : '#33465f'`）；第 7 篇说 `scale` / `rotate` 以锚点为中心、锚点改变会连视觉位置一起变 | 代码动画的是整块面板外框（30,30,660,420），不是选中的格子；到底要动的是哪个？如果真是格子描边，`ItemCell` 里怎么拿到 `pulse`（父传子 prop？还是各自起一份）？`g-rectr` 默认锚点是 0，`scale` 放大时会不会往右下跑、和 `loc` 的 30,30 对不上？ | 照抄后是面板边框在呼吸，不是选中格子在呼吸；或者缩放后边框往外偏，看起来像位移 bug |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | 同段末尾 `transitioned(0, 300, linear())`、`if (!fade) return;`、`fade.set(100)` | 本篇说它的返回值是 `ITransitionedController<...> \| null`，使用前必须判空；也说本篇 live 不依赖它 | `transitioned` 和 `linear` 从哪个包 import？`0, 300` 是「起始值、时长」还是「两个端点」？`fade.set(100)` 的 100 是目标值还是时间？控制器还有哪些方法、怎么「开始/停止/回调」？文档只给了三行，读者没有源码可看 | 抄不下来；只能用回手写 `requestAnimationFrame`，这三行等于只留了个名字 |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | `## 注册与打开` 的两段注释：`props.state.mainUIController.open(...)` 标「游戏内主 UI 栈」，`props.controller.open(...)` 标「场景 UI」 | 第 1 篇把 `props.state.sceneController.open` 归为「场景 UI」、把 `props.controller.open` 归为「在另一个 UI 内打开、面板跳面板」；第 17 篇说场景 UI 与主 UI 是两个控制器；第 20 篇已经写过 `export const InventoryUI = new GameUI('inventory-panel', InventoryPanel)` | 这里把 `props.controller.open` 注释成「场景 UI」，和前面两篇对不上；从主菜单或主场景打开背包，到底该用 `sceneController`、`mainUIController` 还是当前 `controller`？另外 `InventoryUI` 第 20 篇已经 `new` 过一次，这里再 `new` 一次是重复注册还是替代？同名会不会冲突？ | 选错控制器时背包出现在错误层级或压根打不开；重复 `new` 时不知道以哪个为准，怕一改就两个入口都坏 |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | `## 性能自查` 表格的「列表 / key」两行，以及 `## 边界与注意` 的「不要只停一次」 | 第 19 篇的性能口径；第 21 篇说固定顺序列表不加 `key`、第 23 篇 `Scroll` 版又写了 `key={item.id}`；第 25 篇开头说动画卸载后必须停 | 表格说「通过：网格平铺在 `Scroll` 的直接子元素下」，但第 21 篇最终放回面板的是普通 `container` 网格，第 23 篇只给了独立 `Scroll` 组件，读者不知道最终 `inventory-panel.tsx` 里到底是哪一个。另外「不要只停一次」是什么意思——`cancelAnimationFrame` 到底要调用一次还是循环调用？我只知道要调一次 | 按第 21 篇做就没有 `Scroll`，按第 23 篇做又没有回填步骤；动画清理那句读不懂，怕少写或多写 |

## 跨篇问题

1. **文件落地与拼装。** 我读完第 1 篇只知道要 `export` 一个 `GameUI` 对象，不知道 `.tsx` 放哪个目录、构建如何发现、注册时机；到第 20 篇拿到五个文件职责表，仍没有目录、`import` 路径与「谁 import 谁」的完整示意，第 21、22 篇只给局部代码块，我手上没有一份把五个文件拼起来的可运行版本；第 21 篇定义 `interface Item`、第 22 篇直接用 `Item` 却没给 import、第 24 篇又各自重写 `ItemCellProps`，我也无法确定共享类型该放在哪个文件。
2. **组件骨架哪几段可以省。** 第 1 篇给的是带 Props 基类、props 列表、`GameUI` 注册的完整外壳，第 2–7 篇的 TSX 却是裸露标签；第 8、9、11、15、16 篇又大量用 `defineComponent(() => ...)`。我不知道这些片段该放进 `return () => (...)`、能否单独成文件、多个片段如何合成一个界面，也不知道省略外壳后父组件传的值会进 `props` 还是 `attrs`。
3. **`defineComponent` 的泛型与第二参数一路在变。** 第 1 篇一个泛型，第 12/13 篇三个（Props、Emits、`keyof Emits`），第 14 篇四个（还多 `string` 与 `SlotsType`）；第二个参数有时是 `SetupComponentOptions`，有时是手写 `PanelOptions`/`FieldOptions`，`Ticker` 又完全不写。我不知道第几个参数是什么、哪些可以省、无 props 组件是否必须写空 options、省略后还能不能用 `emit`。
4. **import 来源散落。** `container`、`g-rect`、`text`、`image`、`g-path` 以及 `Container`、`Rect`、`Text`、`Font`、`Texture`、`Path2D` 从第 1 篇到第 7 篇都没有 import 行或「全局可用」说明；第 10 篇 `useKey` 没 import，第 23 篇又写 `import { useKey } from '@user/client-base'`；`DefaultProps`、`SetupComponentOptions`、`IGameUIPropsBase`、`SlotsType`、`VNode`、`Font` 的来源散落各篇，我要拼完整文件时得自己汇总。
5. **打开入口与控制器归属。** 第 1 篇把打开分成场景 UI、另一个 UI 内、主 UI 栈三处；第 20 篇说不在 UI 组件里时要在「主入口持有的客户端核心实例」上调用，却没给主入口长什么样；第 25 篇又把 `props.controller.open` 注释成「场景 UI」，而第 1、17 篇里它指「面板里面板」。我不知道第一次打开该挑哪个、从主菜单或主场景打开背包该用 `sceneController`、`mainUIController` 还是当前 `controller`，也不知道同时打开时谁在上面。
6. **`open` 的第二个参数与 `props.instance`。** 第 1 篇只出现 `open(..., {})`，我不知道第二个参数是什么类型、里面能放什么、放进去后怎么在面板里取到；`props.instance` 只被要求出现在 props 列表并在关闭时原样传回，我没能形成「它是什么、为什么关闭要凭它」的概念。
7. **坐标基准与面板尺寸。** 第 1、2 篇都用 480×320，第 20 篇直接定 720×480，但都没有说这是不是游戏画布分辨率、UI 会不会被整体缩放或裁剪、坐标原点与单位是「屏幕像素」还是「设计像素」；我自己的魔塔画布不是这个尺寸时，不知道该按画布还是按面板设计尺寸，后面网格列数与详情宽度都会跟着错。
8. **事件坐标与变换没有串起来。** 第 2 篇的嵌套坐标、第 7 篇的 `scale`/`rotate`、第 9 篇的 `offsetX`/`offsetY` 之间没有接上；元素被缩放或旋转后，事件里的相对坐标是变换前还是变换后的，我推不出来。
9. **`ref` 的两种样子。** 第 7 篇在响应式篇之前就用了 `ref`、`open.value`、`onClick`；第 8 篇的 `ref(0)` 是响应式值，第 13 篇的 `ref<CardExpose>()` 是拿子组件实例，两者 import 相同、写法相同，我容易把「组件 ref」也当成需要 `.value` 的普通响应式值，或反过来。
10. **`hidden` 与布局流。** `hidden` 在第 7、8、11 篇反复出现，却没有一处说明它是否影响布局流；我做「隐藏一块、下面跟着动/不动」时只能猜。
11. **列表数据怎么变。** 第 8 篇的 `ref` 与第 11 篇的 `ref` 数组之间缺一座桥，第 11 篇只讲怎么渲染列表，不讲 `push`/`splice`/整体替换哪种会触发更新；后面做背包格子恰恰从「数据如何变化」开始。
12. **`items` 是普通数组还是 `ref`。** 第 21 篇写 `const items: Item[]`、用 `items.find`，第 22 篇同一段派生逻辑写 `items.value.find`，第 23 篇 `Scroll` 版与 `ListPage` 版又直接 `items.map`，第 24 篇变成 `const items = ref<Item[]>(...)`。我不知道最终该定义成哪一种、传给子组件时写 `items` 还是 `items.value`、`computed` 里该不该写 `.value`。
13. **子组件怎么拿父组件选中态。** 第 21 篇是标准 props 逐层传（`selectedId`、`onSelect`），第 23 篇的 `ItemGridScroll` 没有 props 声明却直接引用 `items` 与 `selectedId.value`。我不知道它们是父组件传进来的、模块级变量还是闭包，也不知道 `InventoryPanel` 那一侧要怎么改，更不知道该学哪一种写法。
14. **`props` 与 `attrs` 的边界。** 第 12 篇末尾才说「漏写的键会落到 `attrs`」，`attrs` 的完整解释在第 14 篇；同一句「属性名用 camelCase」可能指元素属性、props 键或透传的 `attrs`。我在第 12 篇调试「传了没生效」时，手上没有 `attrs` 的概念，只能反复检查 props 数组。
15. **新增一个 prop 要改哪些地方。** 第 12 篇反复强调 `props` 数组漏键就收不到、而且不报错；第 24 篇给 `ItemCell` 加 `equipped` 时只改了接口和描边，没给新数组，也没给 `ItemGrid` 的传递链。我怕「照文档改完不生效」，又怕自己多改反而错。
16. **「TSX 里没有模板指令」与 `v-model:xxx`。** 第 1、11、13 篇都强调没有模板指令，第 12 篇却在 TSX 里写 `v-model:selected` / `v-model:open`。我无法判断哪些「模板写法」在 TSX 里其实可用、哪些必须换普通属性，也不知道 `v-model` 写回的是 `ref.value` 还是别的变量。
17. **slot 的两种写法。** 第 14 篇教的是默认 slot 内容写在标签之间、具名 slot 用对象；第 16 篇 `Page` 却把函数直接当 children，`ListPage` 又用 `{{ default: fn }}`。我不知道判断标准是什么，混用时担心「什么都不显示」。
18. **`props.state` 与 `state` 从哪来。** 第 1 篇说 `props.state` 是 ClientCore，第 10 篇直接写 `props.state.hotkey.system`，始终没有一处总览它里面有什么；第 17 篇 `setPropsBaseCreator` 示例只返回 `instance` 和 `controller`，但所有打开入口都靠 `props.state`。如果我自己写 creator，是不是要把 `state` 也装进去、不装会不会把已有的 `state` 覆盖掉，文档没有把这条链路讲透。
19. **背景的四个名字。** `showBack`、`showingBack()`、`showBackground`、`hideBackground` 名字太接近，我不知道「现在背景是否可见」该读引用值还是调用方法，也不知道哪个是用户设置、哪个是系统最终结果。
20. **`GameUI` 的名字还有什么用。** 第 1 篇说名字用于打开时识别，第 17 篇又说没有全局注册、打开只认对象；我不知道名字是否还必须唯一、重名会怎样、调试时能不能靠名字找到实例，第 25 篇再 `new` 一次 `InventoryUI` 时也不知道是重复注册还是替代。
21. **`width` 与 `loc` 里的宽高谁说话。** 第 2 篇说 `loc` 后两项是宽高，第 15 篇 `TextContent` 又单独要求 `width`。当两者都写时，我不知道哪个生效，也不知道 `autoHeight` 会不会改掉 `loc` 的高度。
22. **`List` 的 `v-model` 与「初始以第一项为准」。** 第 12 篇说 `v-model:xxx` 是双向绑定，第 16 篇说挂载后再改绑定不会重新选中。我想从存档恢复选中时，不知道该改绑定、改列表数据，还是调用某个「列表自己的交互」。
23. **`key` 的规则。** 第 11 篇说顺序固定的无状态列表不需要 `key`、也不要用下标代替会变化的身份；第 16、19、23 篇的 `Scroll` 示例又给每行 `key={index}` 或 `key={item.id}`，第 19 篇还让我「规则见 `dev.md`」，而我不知道 `dev.md` 是什么、在哪里。我不知道这是 `Scroll` 的特殊要求，还是只是示例写法。
24. **live 与正文不是同一段代码。** 第 15、16、22、23 篇都写明 live 是「等价元素」，真实组件要在完整客户端里跑；第 20 篇的关闭按钮在 live 里只显示提示，第 22 篇 live 用 `text` 等价实现多行说明、还多一个正文没有的「取消选择」按钮。我按正文写完后，无法用 live 对照自己的实现；当 live 和正文表现不同时，我不知道该以哪个为准。
25. **「内置组件」与「内置 UI」。** 第 15、16 篇标题都是「内置组件」，第 18 篇开头才把「内置组件」和「内置 UI」分开；我读第 15、16 篇时以为第 18 篇要改的就是这些组件，到第 18 篇才发现不是。
26. **图片与纹理。** 我真正要做的是物品栏，需要显示物品图标；第 6 篇只教了用 canvas 现画纹理，没有讲如何加载 PNG、如何从素材表取一帧，末尾提到的 `icon` 也没有可照抄的写法。
27. **canvas 相关术语。** 我不懂 canvas，但文档反复使用 canvas、`Path2D`、`getContext`、抗锯齿、高清缓存这些词。第 4、6、7 篇都假设我知道它们大概是什么，我只能照抄，无法判断出错时是代码问题还是理解问题。
28. **缓存与标脏。** 第 7 篇说 `container` 默认开缓存，又说「频繁变化的元素开缓存反而更慢」，却没给「如何标脏」；第 19 篇也没说父容器默认缓存会不会让内部变化的 `text` 不更新、脏标记会不会传到缓存的父级。我不确定默认缓存对会变化的物品栏容器是不是陷阱。
29. **「没有选中」这个状态从哪来。** 第 21 篇把 `selectedId` 初始化成有效 id，点击也只会上报有效 id；第 22 篇却依赖 `undefined` 来显示「请选择道具」，live 里还有一个正文没有的「取消选择」按钮。我想不出用户做什么操作会进入未选中状态，也不知道这个交互该由谁补。
30. **容器是否裁剪、命中怎么算。** 第 21 篇用 0×0 容器包网格、用默认 200×200 的容器包每个格子，第 22 篇用默认 200×200 的容器包详情内容；我反复遇到「容器不写尺寸」的写法，却始终不知道容器会不会裁剪超出部分、命中是按容器矩形还是子元素矩形、重叠时点击算谁的。
31. **「关闭」到底归谁。** 第 20 篇骨架关闭按钮直接 `props.controller.close(props.instance)`，第 24 篇组装时 `onClose` 只改提示文字，第 24 篇 live 描述又说能关闭；第 23 篇 `ListPage` 的关闭按钮只清空选中。我不确定最终面板的关闭按钮该调控制器、交给父组件再决定，还是只清空选中，也不知道 slot 里的组件拿不拿得到 `props.controller`。
32. **最终背包左侧是什么。** 第 21 篇放回面板的是普通容器网格，第 23 篇给了 `Scroll` 与 `ListPage` 两个独立方案，第 25 篇性能表却按「已平铺在 `Scroll` 下」判定通过。三篇拼起来，我不知道 `inventory-panel.tsx` 最终的左侧到底是普通网格、`Scroll` 还是 `ListPage`。
33. **布局最后会不会压住。** 第 20 篇左侧网格占位是 `[54,110,400,330]`（底边到 440），第 24 篇 `ActionBar` 放在 `[54,392,304,32]`（392–424），第 23 篇 `Scroll` 高又是 294。我不确定按钮是故意压在网格上方，还是网格应该缩短，也不知道最终各区域的真实坐标该以哪篇为准。
34. **「只要基础 TS/JS」与样板语法。** 第 1 篇说「只要基础 TS/JS」，但模板里出现了 `defineComponent`、`satisfies`、JSX 注释与无值属性；我不确定这些是必须现场学会，还是可以当作固定样板不动。

## 分节使用概率

| 篇目 | 章节 | 使用概率（高/中/低） | 理由 |
| --- | --- | --- | --- |
| docs/advanced/ii/ui/ui-template.md | 一个最小 UI | 高 | 这是唯一的起点，我会反复回来对照复制、逐行替换，两个代码块都会被打开看。 |
| docs/advanced/ii/ui/ui-template.md | 只改哪几行 | 高 | 它直接对应我的目标「把模板改成自己的面板」，是我改动时的操作清单。 |
| docs/advanced/ii/ui/ui-template.md | 打开与关闭 | 高 | 写完必须打开才能验证，也要能关闭回到上一界面；但我会在同一节里反复卡在选择入口上。 |
| docs/advanced/ii/ui/ui-template.md | 运行效果 | 低 | 这是文档站的演示，`templateLoader` 指向 `.vitepress` 内部路径，我在自己项目里没法照搬，只能看个样子。 |
| docs/advanced/ii/ui/ui-template.md | 边界与注意 | 中 | 四条都是踩坑提示，但第一遍读时「单文件组件」「camelCase 与连字符」还没有具体对照物，容易读过即忘，多半等出错后回来查。 |
| docs/advanced/ii/ui/container-and-coordinates.md | 坐标从哪里来 | 高 | 我没有任何 UI 经验，先要弄清坐标原点和父子相对关系，否则什么都摆不对 |
| docs/advanced/ii/ui/container-and-coordinates.md | loc 与锚点 | 高 | 每个元素都要写 `loc`，锚点直接决定“位置对了没” |
| docs/advanced/ii/ui/container-and-coordinates.md | 一个嵌套示例 | 高 | 我需要照着嵌套出“外框 + 内容区”，这是物品栏的基本结构 |
| docs/advanced/ii/ui/container-and-coordinates.md | 层级 | 中 | 做物品栏会用到提示框或浮层，但一开始不一定需要跨容器层叠 |
| docs/advanced/ii/ui/container-and-coordinates.md | 运行效果 | 中 | 我需要一个视觉对照，确认自己摆出来的区域和文档一致 |
| docs/advanced/ii/ui/container-and-coordinates.md | 边界与注意 | 高 | 默认 200×200 和锚点差异是我最可能踩的坑 |
| docs/advanced/ii/ui/basic-shapes.md | 四个图形 | 高 | 色块、边框、分隔线是物品栏最基础的组成 |
| docs/advanced/ii/ui/basic-shapes.md | 填充与描边 | 高 | 我要区分“填充的格子”和“只有边框的槽位”，必须会开关模式 |
| docs/advanced/ii/ui/basic-shapes.md | 圆角与命中 | 中 | 圆角矩形更常用，但命中区域和 `actionStroke` 在按钮上会用到 |
| docs/advanced/ii/ui/basic-shapes.md | 运行效果 | 中 | 需要看四个图形的默认效果，避免颜色混在一起 |
| docs/advanced/ii/ui/basic-shapes.md | 边界与注意 | 高 | 默认浅灰、`fill` 不是颜色、圆和矩形锚点不同，都是我会写错的地方 |
| docs/advanced/ii/ui/curves-and-paths.md | 三次贝塞尔 | 低 | 物品栏以矩形和图片为主，装饰性曲线暂时用不上 |
| docs/advanced/ii/ui/curves-and-paths.md | 二次贝塞尔 | 低 | 同上，不是第一批需要的能力 |
| docs/advanced/ii/ui/curves-and-paths.md | 路径 | 中 | 想画自定义边框或异形底板时会用，但先要解决 `Path2D` 从哪来 |
| docs/advanced/ii/ui/curves-and-paths.md | 圆角矩形 | 高 | 面板、按钮、物品槽都想要圆角，这是最可能直接使用的元素 |
| docs/advanced/ii/ui/curves-and-paths.md | 默认绘制方式 | 中 | 圆角矩形默认填充、路径默认填充，能少写属性，但需要记住表格 |
| docs/advanced/ii/ui/curves-and-paths.md | 运行效果 | 低 | 我更关心 `g-rectr`，曲线示例对当前目标帮助有限 |
| docs/advanced/ii/ui/curves-and-paths.md | 边界与注意 | 中 | 圆角命中区域和 `Path2D` 类型限制会影响交互，需要回看 |
| docs/advanced/ii/ui/text.md | 一行文字 | 高 | 物品名、数量、标题都要写字 |
| docs/advanced/ii/ui/text.md | 字体 | 中 | 我想让标题和正文有区分，会用到 `Font`，但不知道 import |
| docs/advanced/ii/ui/text.md | 尺寸与居中 | 高 | 文字居中在槽位里非常常见，锚点是主要手段 |
| docs/advanced/ii/ui/text.md | 不会自动换行 | 中 | 物品描述会很长，我必须知道什么时候该换内置文本组件 |
| docs/advanced/ii/ui/text.md | 运行效果 | 中 | 需要对照字号与颜色，确认文字没有和背景混在一起 |
| docs/advanced/ii/ui/text.md | 边界与注意 | 高 | 白字、描边过细、`width` 不裁剪，都是我容易误判的点 |
| docs/advanced/ii/ui/image-and-texture.md | 图片元素需要什么 | 高 | 物品栏的核心就是图标，必须让 `image` 显示出来 |
| docs/advanced/ii/ui/image-and-texture.md | 造一张最小纹理 | 中 | 我只想验证元素能显示；真正图标要加载文件，这一节只能算过渡 |
| docs/advanced/ii/ui/image-and-texture.md | 像素图设置 | 中 | 魔塔素材多是像素图，放大发虚是常见问题 |
| docs/advanced/ii/ui/image-and-texture.md | 应用层素材标签 | 低 | 文档明确说超出最小范围且没有用法，我暂时接不上 |
| docs/advanced/ii/ui/image-and-texture.md | 运行效果 | 中 | 需要看默认插值和 `noanti hd={false}` 的差别 |
| docs/advanced/ii/ui/image-and-texture.md | 边界与注意 | 高 | 纹理创建成本、拉伸变形、默认 200×200 都会直接影响我 |
| docs/advanced/ii/ui/layer-transform-performance.md | 遮挡：zIndex | 高 | 物品提示框、下拉层、选中高亮都需要压在别的元素上面 |
| docs/advanced/ii/ui/layer-transform-performance.md | 变换：scale、rotate 与 alpha | 中 | 悬浮放大、遮罩变暗会用，但不是第一版必需 |
| docs/advanced/ii/ui/layer-transform-performance.md | 显示开关：优先 hidden | 高 | 打开/关闭物品栏、详情面板是最常见的交互 |
| docs/advanced/ii/ui/layer-transform-performance.md | 缓存：cache 与 nocache | 中 | 物品栏可能有几十个格子，会考虑性能，但先要会标脏 |
| docs/advanced/ii/ui/layer-transform-performance.md | noevent：可见但不接收交互 | 中 | 弹窗遮罩需要“压暗但可点下面”，这一节正好对应 |
| docs/advanced/ii/ui/layer-transform-performance.md | filter 与 composite | 低 | 特殊视觉效果，当前目标用不到，文档也说先不记 |
| docs/advanced/ii/ui/layer-transform-performance.md | 什么时候用 hidden、什么时候用三元 | 高 | 我需要明确开关面板时状态会不会丢，这张表能直接指导选择 |
| docs/advanced/ii/ui/layer-transform-performance.md | 运行效果 | 中 | 需要看遮挡切换与隐藏、缩放的实际表现 |
| docs/advanced/ii/ui/layer-transform-performance.md | 边界与注意 | 中 | 弧度、`scale` 数组、缓存标脏都会影响后续，但部分问题这篇没答完 |
| docs/advanced/ii/ui/reactivity.md | ref：带 value 的盒子 | 高 | 计数器、面板开关、输入回显都靠它，是最先会照抄的一段 |
| docs/advanced/ii/ui/reactivity.md | reactive：一整块对象 | 中 | 面板一组字段可能用它，但也可以全用 ref 绕开 |
| docs/advanced/ii/ui/reactivity.md | computed：派生值 | 高 | 背包的总重、可否装备、按钮是否可点这类派生值会频繁用到 |
| docs/advanced/ii/ui/reactivity.md | watch：副作用 | 中 | 只在要同步外部或打日志时用，日常界面不一定需要 |
| docs/advanced/ii/ui/reactivity.md | 什么时候用 shallowRef 与 markRaw | 低 | 先把界面跑起来，性能优化阶段才会回头看 |
| docs/advanced/ii/ui/reactivity.md | props 不要解构 | 高 | 一旦开始写组件几乎必踩，属于高频回查点 |
| docs/advanced/ii/ui/reactivity.md | 运行效果 | 低 | 只是看演示，不参与写代码 |
| docs/advanced/ii/ui/reactivity.md | 边界与注意 | 中 | 出现「点了不变」时回来排查 |
| docs/advanced/ii/ui/events.md | 命中测试：事件先找最上层元素 | 中 | 只有做遮罩、穿透、重叠按钮时才需要深究 |
| docs/advanced/ii/ui/events.md | 事件名：on 加事件名 | 高 | 每个可点元素都要查事件名，最常翻的一张表 |
| docs/advanced/ii/ui/events.md | 事件对象 | 高 | 坐标、按键判断、修饰键几乎每次交互都会碰 |
| docs/advanced/ii/ui/events.md | 捕获与冒泡 | 中 | 嵌套面板或阻止点击穿透时才用得上 |
| docs/advanced/ii/ui/events.md | enter 与 leave 不走普通冒泡 | 中 | 做悬停高亮时会遇到，但不是每个界面都有 |
| docs/advanced/ii/ui/events.md | noevent：可见但不接收交互 | 中 | 做半透明遮罩、压暗层时直接用 |
| docs/advanced/ii/ui/events.md | cursor：悬停时的鼠标样式 | 中 | 可点元素的提示常用，但属于锦上添花 |
| docs/advanced/ii/ui/events.md | actionStroke：只把描边算作命中 | 低 | 只有「看起来只有边框可点」的特殊界面才会用 |
| docs/advanced/ii/ui/events.md | 一组完整的交互 | 高 | 最接近可整体抄用的整合示例，起步阶段会反复对照 |
| docs/advanced/ii/ui/events.md | 运行效果 | 低 | 只是看演示 |
| docs/advanced/ii/ui/events.md | 边界与注意 | 中 | 事件不触发时回来核对命名与 hidden/noevent |
| docs/advanced/ii/ui/hotkey-in-ui.md | 最小模型：指令、作用域、实现 | 中 | 先建立概念，写代码时不常回头 |
| docs/advanced/ii/ui/hotkey-in-ui.md | useKey：拿到当前组件的作用域 | 高 | 任何要快捷键的面板第一步都是它 |
| docs/advanced/ii/ui/hotkey-in-ui.md | implement：把指令接到回调 | 高 | 绑 Esc 关闭、Enter 确认必用 |
| docs/advanced/ii/ui/hotkey-in-ui.md | 注册新指令与分组 | 中 | 内置指令不够用时才需要自己注册 |
| docs/advanced/ii/ui/hotkey-in-ui.md | 触发方式：HotkeyEmitMode | 中 | 默认抬起触发够用，只有连发时才细看 |
| docs/advanced/ii/ui/hotkey-in-ui.md | 优先级与阻断 | 低 | 按键冲突、需要压过下层时才用 |
| docs/advanced/ii/ui/hotkey-in-ui.md | UI 相关默认按键 | 高 | 想知道某个功能该用哪个指令 id 时直接查表 |
| docs/advanced/ii/ui/hotkey-in-ui.md | 为什么没有可运行示例 | 低 | 一次性说明，读完就不再看 |
| docs/advanced/ii/ui/hotkey-in-ui.md | 边界与注意 | 中 | 按键无反应时回来核对 setup 与覆盖规则 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | 条件：优先 hidden | 高 | 面板、提示层开关几乎每处都用 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | 三元：真正移除节点 | 中 | 需要每次打开重置状态时才切换到这个写法 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | 循环：用 map 生成元素 | 高 | 背包格子、属性行、按钮组都靠它 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | key：只在需要保留身份时加 | 高 | 只要是会增删的列表就得判断要不要 key |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | 三种写法怎么选 | 中 | 决策时查一次表，平时按习惯写 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | 运行效果 | 低 | 只是看演示 |
| docs/advanced/ii/ui/conditional-and-list-rendering.md | 边界与注意 | 中 | 列表状态错位时回来核对 key 与结构 |
| docs/advanced/ii/ui/props.md | 组件怎么拿参数 | 高 | 拆父子组件时第一件要做的事，必须知道 Props 接口和 props 数组怎么写。 |
| docs/advanced/ii/ui/props.md | 属性名用 camelCase | 高 | 传参不生效最常见的原因，做背包格子时会反复踩。 |
| docs/advanced/ii/ui/props.md | 默认值用 props.x ?? 默认 | 高 | 尺寸、开关这类可选 prop 几乎每个组件都会用到。 |
| docs/advanced/ii/ui/props.md | props 是响应式的，不要解构 | 高 | 父组件更新后子组件不刷新时，首先要排查的写法。 |
| docs/advanced/ii/ui/props.md | emits 与 v-model | 高 | 选中态、开关、输入值这类双向交互都要用。 |
| docs/advanced/ii/ui/props.md | props 与 hidden / 三元 | 中 | 只在“由父组件控制子组件显隐”的面板里用，属于特定模式。 |
| docs/advanced/ii/ui/props.md | 运行效果 | 中 | 用于对照三个格子的交互，但不运行文档站时只能看代码。 |
| docs/advanced/ii/ui/props.md | 边界与注意 | 中 | 作为排查清单有用，不是每次写组件都逐条对照。 |
| docs/advanced/ii/ui/component-tsx.md | 一个完整组件的结构 | 高 | 新建每个组件都要照着六段结构写。 |
| docs/advanced/ii/ui/component-tsx.md | 生命周期：onMounted 与 onUnmounted | 中 | 做动画、定时刷新、纹理创建时才会用到。 |
| docs/advanced/ii/ui/component-tsx.md | emit 与 expose | 中 | 需要父组件主动调用子组件方法（聚焦、滚动到某格）时才会用。 |
| docs/advanced/ii/ui/component-tsx.md | 组件与 UI 的区别 | 高 | 决定“这块该写成普通组件还是 UI”，拆面板前必须先判断。 |
| docs/advanced/ii/ui/component-tsx.md | 运行效果 | 低 | 主要是演示，写代码时不会反复回看。 |
| docs/advanced/ii/ui/component-tsx.md | 边界与注意 | 中 | 泛型、options、生命周期同步调用这些坑需要当检查表。 |
| docs/advanced/ii/ui/slots-and-attrs.md | slot 解决什么问题 | 高 | 做可复用外框（面板、卡片、列表容器）时先要理解这个模型。 |
| docs/advanced/ii/ui/slots-and-attrs.md | 默认 slot | 高 | 最常见的内容填充方式，几乎每个容器组件都会用。 |
| docs/advanced/ii/ui/slots-and-attrs.md | 具名 slot | 中 | 有标题/页脚/操作区多个插槽时才需要。 |
| docs/advanced/ii/ui/slots-and-attrs.md | 作用域 slot | 中 | 列表项、分页器这类“结构父定、数据子给”的场景才会用。 |
| docs/advanced/ii/ui/slots-and-attrs.md | attrs：没声明的属性 | 高 | 写包装组件（把 `loc`/`fillStyle` 透传给内部元素）时必用。 |
| docs/advanced/ii/ui/slots-and-attrs.md | inheritAttrs 什么时候用 | 中 | 只在属性落错位置、需要关掉自动继承时才查。 |
| docs/advanced/ii/ui/slots-and-attrs.md | 什么时候用 slot、props、attrs | 高 | 拆组件时用来判断该选哪一种传值方式。 |
| docs/advanced/ii/ui/slots-and-attrs.md | 运行效果 | 低 | 演示性质，实际写代码时回看频率低。 |
| docs/advanced/ii/ui/slots-and-attrs.md | 边界与注意 | 中 | `?.`、camelCase、`inheritAttrs` 几条容易忘，适合当清单。 |
| docs/advanced/ii/ui/builtin-text-and-input.md | TextContent：会换行的文字 | 高 | 背包说明、任务文本都要换行，几乎每个面板都会用到。 |
| docs/advanced/ii/ui/builtin-text-and-input.md | Textbox：带背景与标题的说明框 | 中 | 说明框常见，但可以用 `TextContent` 加自己画的背景替代，不是必需。 |
| docs/advanced/ii/ui/builtin-text-and-input.md | Input：在画布上输入 | 高 | 改名、数量、搜索都要输入，是面板常见需求。 |
| docs/advanced/ii/ui/builtin-text-and-input.md | 特殊组件 InputBox：单次输入 | 中 | 单次输入在命名、数量确认里会用，但不是每个面板都需要。 |
| docs/advanced/ii/ui/builtin-text-and-input.md | 运行效果 | 中 | 想看效果，但明说是等价元素，不能验证真实组件的失焦与打字机行为。 |
| docs/advanced/ii/ui/builtin-text-and-input.md | 边界与注意 | 高 | `width` 必填、`v-model:value`、Promise 取消分支都是实际会踩的坑。 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | List：可选中的列表 | 高 | 背包分类、设置菜单的基础结构。 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | ListPage：左列表、右详情 | 高 | 左列表右详情正是背包和设置面板的主结构。 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | Page：分页 | 中 | 物品多时才需要，简单列表用不上。 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | Scroll：只对直接子元素做虚拟滚动 | 高 | 大量物品必须虚拟滚动，平铺规则也很关键。 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | Selection：不接收事件的选中光标 | 低 | 列表已经内置，只有完全自定义列表时才单独用。 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | 特殊组件 ConfirmBox 与 Choices | 中 | 确认和选项弹窗会用，但也可以自己拼面板替代。 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | 运行效果 | 中 | 能看布局对照，但不能验证真实列表的选中与滚动。 |
| docs/advanced/ii/ui/builtin-list-and-containers.md | 边界与注意 | 高 | 平铺、初始选中、0 基页码、Promise 悬着都是关键风险。 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | 四层模型 | 中 | 帮助理解系统，但写代码时不直接操作这四层。 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | 打开与关闭 | 高 | 每个多面板 UI 都要用，是最基础的接口。 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | 显示策略 | 高 | 决定叠放和关闭行为，做背包、设置切换时必用。 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | 背景 | 中 | 有背景需求才用，但切换闪背景时一定会查。 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | keep：切换时不闪背景 | 中 | 只在“关一个、开一个”的切换场景里用。 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | 场景 UI 与主 UI | 高 | 决定面板开在哪个栈，是入口处必须做的选择。 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | 基础 props 注入 | 中 | 普通作者用默认即可，只有自定义 creator 才需要。 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | 当前没有全局注册 / 覆盖入口 | 中 | 影响替换思路，但不影响日常打开面板。 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | 运行效果 | 中 | 最小控制器能看栈长度和激活状态，但不覆盖背景与策略细节。 |
| docs/advanced/ii/ui/ui-controller-and-stack.md | 边界与注意 | 高 | 连带关闭、`alwaysShow`、`.value`、重建成本都需要注意。 |
| docs/advanced/ii/ui/replace-builtin-ui.md | 改法一：在打开处替换 | 高 | 最直接、最可靠的替换方式，应该优先考虑。 |
| docs/advanced/ii/ui/replace-builtin-ui.md | 改法二：包装组件 | 中 | 只改一小部分时才用，转发 props、slots、emits 的成本高。 |
| docs/advanced/ii/ui/replace-builtin-ui.md | 改法三：改显示策略或背景 | 中 | 界面不变、只改叠放或背景时才用。 |
| docs/advanced/ii/ui/replace-builtin-ui.md | 三种改法怎么选 | 中 | 决策时看，但不是每次替换都要重新读。 |
| docs/advanced/ii/ui/replace-builtin-ui.md | 不要改内置实现 | 高 | 避免升级丢改动的关键警告，应该先看。 |
| docs/advanced/ii/ui/replace-builtin-ui.md | 运行效果 | 低 | 只对比策略，不演示替换本身，对实际替换帮助有限。 |
| docs/advanced/ii/ui/replace-builtin-ui.md | 边界与注意 | 高 | 转发漏项、emit 改名、keep 配对都是实际操作风险。 |
| docs/advanced/ii/ui/ui-performance.md | 显示开关：优先 hidden | 高 | `hidden` 与三元的取舍是每个面板都会遇到的。 |
| docs/advanced/ii/ui/ui-performance.md | 缓存：cache 与 nocache | 中 | 只有复杂稳定子树才需要，但默认值容易被误解。 |
| docs/advanced/ii/ui/ui-performance.md | 画面质量：hd、anti 与 noanti | 中 | 像素图才需要，普通 UI 用默认即可。 |
| docs/advanced/ii/ui/ui-performance.md | 列表与分页 | 高 | 大量列表的性能入口，和背包直接相关。 |
| docs/advanced/ii/ui/ui-performance.md | 组件粒度 | 中 | 拆分原则有用，但没有量化标准，容易凭感觉。 |
| docs/advanced/ii/ui/ui-performance.md | UI 栈 | 中 | 多面板时用，单面板可以跳过。 |
| docs/advanced/ii/ui/ui-performance.md | 基础 props | 低 | 多数作者不需要自定义基础参数创建函数。 |
| docs/advanced/ii/ui/ui-performance.md | 症状与排查 | 高 | 出问题时按表排查最实用。 |
| docs/advanced/ii/ui/ui-performance.md | 运行效果 | 中 | 能看 `hidden` 与 `cache` 开关，但不能真正测性能。 |
| docs/advanced/ii/ui/ui-performance.md | 边界与注意 | 高 | 缓存不是越多越好、`keep` 必须卸载、先测再改，都是收口建议。 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | 最终要做成什么 | 高 | 我动手前会先确认目标范围和最终布局，这一节是唯一的总目标说明。 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | 先把文件拆好 | 高 | 我会照着拆文件、定职责；但实际落地时缺目录和 import 信息，会反复回来找。 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | 骨架代码 | 高 | 这是我要复制并逐步替换的基础代码，几乎每次开工都会打开。 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | 打开它 | 高 | 不打开就看不到面板；我会反复回来确认场景 UI、面板内、主 UI 栈三种入口。 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | 运行效果 | 中 | 我会看一眼目标样子，但 live 不能真的关闭，参考价值有限。 |
| docs/advanced/ii/ui/inventory-example-1-skeleton.md | 边界与注意 | 中 | 收尾自查时会看，尤其是“关闭按钮必须能用”和“Props 基类”两条。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | 数据模型 | 高 | 我要把自己的存档数据映射成 `Item`，会反复对照字段。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | ItemCell：一个格子 | 高 | 格子是最常改的部分（颜色、选中描边、名称数量位置），会反复翻。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | ItemGrid：按行列排列 | 高 | 列数、格子尺寸、间距的算法在这里，布局不合适就要回来改。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | 放回面板 | 高 | 选中状态归谁、网格怎么上报，是我接父子组件时最需要确认的一段。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | 运行效果 | 中 | 用来看选中效果，但 live 与正文的代码组织不同，不能直接对照。 |
| docs/advanced/ii/ui/inventory-example-2-grid.md | 边界与注意 | 中 | 做自适应和后续增删道具时会回来核对列数、id、`key` 的提醒。 |
| docs/advanced/ii/ui/inventory-example-3-detail.md | 选中项由父组件派生 | 高 | 详情、按钮都要共用同一份选中数据，这段派生逻辑我会反复引用。 |
| docs/advanced/ii/ui/inventory-example-3-detail.md | ItemDetail：右侧面板 | 高 | 详情区的名称、数量、描述和空状态都在这，是最常改的一块。 |
| docs/advanced/ii/ui/inventory-example-3-detail.md | 运行效果 | 中 | 我会看空状态和详情切换，但 live 用等价元素，真实 `TextContent` 效果看不到。 |
| docs/advanced/ii/ui/inventory-example-3-detail.md | 边界与注意 | 中 | `undefined` 处理、`TextContent` 宽度、`zIndex` 遮挡这几条会作为自查清单。 |
| docs/advanced/ii/ui/inventory-example-4-scroll.md | 方案一：Scroll 平铺（推荐） | 高 | 道具一多就必然要滚动，这是本篇主路径；`padEnd`、`scrollTo`、「子元素平铺」都是当场要用的。 |
| docs/advanced/ii/ui/inventory-example-4-scroll.md | 方案二：ListPage 左列表右详情 | 中 | 只有打算把背包改成「左列表右详情」才会用；已有网格布局的人多半只当备选参考。 |
| docs/advanced/ii/ui/inventory-example-4-scroll.md | 什么时候用 Scroll、ListPage、Page | 中 | 设计阶段选方案时看一次；实现时不太会回头查。 |
| docs/advanced/ii/ui/inventory-example-4-scroll.md | 运行效果 | 低 | 只能目视，live 又是元素层等价实现，抄不到代码。 |
| docs/advanced/ii/ui/inventory-example-4-scroll.md | 边界与注意 | 中 | 「包一层就失效」「key 对不上」「padEnd 要调」都是踩坑时回来核对的内容。 |
| docs/advanced/ii/ui/inventory-example-5-state.md | ActionBar：底部按钮 | 高 | 可复用的按钮写法，禁用=弱化+早返回这条口径会直接用。 |
| docs/advanced/ii/ui/inventory-example-5-state.md | 状态放在 InventoryPanel | 高 | `computed` + `watch` + 状态上提是这一篇的核心，写业务时反复对照。 |
| docs/advanced/ii/ui/inventory-example-5-state.md | 已装备的格子 | 中 | 只有要做装备态时才用，而且给出的代码不完整，仍需自己补传递链。 |
| docs/advanced/ii/ui/inventory-example-5-state.md | 键盘收口 | 中 | 只有要 Esc 关闭面板时才需要，三行代码，用过一次就够。 |
| docs/advanced/ii/ui/inventory-example-5-state.md | 遮罩与 noevent | 中 | 加遮罩是常见需求，但放置层级说不清，实际会边试边查。 |
| docs/advanced/ii/ui/inventory-example-5-state.md | 组装 | 高 | 这是唯一把按钮、状态、回调接起来的地方，组装时必须看。 |
| docs/advanced/ii/ui/inventory-example-5-state.md | 运行效果 | 低 | 目视对照，无法复用代码。 |
| docs/advanced/ii/ui/inventory-example-5-state.md | 边界与注意 | 中 | 「watch 别自循环」「别用 hidden 当禁用」这类提醒会在出错时回来查。 |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | 动画：只改 alpha 与 scale | 中 | 手写 RAF 的骨架有用，但示例没有并进真实面板，很多人会跳过或只抄清理逻辑。 |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | 拆分回顾 | 低 | 只是目录树复述，第 20 篇已给过，读过一次不会再看。 |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | 注册与打开 | 高 | 把面板变成可打开 UI 的最后一步，`GameUI` 与打开入口必须照做。 |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | 性能自查 | 低 | 一次性对号入座清单，读一遍就过；实现时不会反复查。 |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | 运行效果 | 低 | 最终成品的目视确认，不产生可复用代码。 |
| docs/advanced/ii/ui/inventory-example-6-animation-and-register.md | 边界与注意 | 中 | 动画必须清、注册不写全局表、props 逐层传，这几条会在收尾时核对。 |

## 声明

未读源码：是
未修改任何文档：是
live 目视验证：未执行（留到 10-50）

以上仅为读者视角的提问与使用概率判断，不构成对错判定，也不含修改方案；是否构成问题由用户在 10-50 裁决。
