# Round 3（D-94）· 单读者

读者身份：刚读完中级教程、想给自己的魔塔做一套自定义界面的作者。没写过 UI，不知道 canvas 是什么，不会 Vue 组件写法；只会基础 TS/JS、函数、对象、数组和一点模板语法。手里只有这套文档，不看源码，也没有人可以问。

## 阅读范围

### 非目标文档（先读，按顺序）

- `docs/intermediate/` 全部 `.md`：`code-basics.md`、`src-tour.md`、`data-vs-render.md`、`data-state-overview.md`、`data-plugins.md`、`map-structure.md`、`map-tiles.md`、`tile-store.md`、`combat-overview.md`、`enemy-aura.md`、`enemy-calculator.md`、`enemy-combat-script.md`、`enemy-final.md`、`enemy-map-damage.md`、`enemy-query.md`、`enemy-specials.md`、`enemy-status-hooks.md`、`events.md`、`flags.md`、`hooks.md`、`hero-attribute.md`、`hero-equipment.md`、`hero-items.md`、`hero-location.md`、`replay-commands.md`
- `docs/advanced/index.md`
- `docs/advanced/i/` 全部 `.md`：`index.md`、`declarative-vs-imperative.md`、`data-stores.md`、`hooks-in-depth.md`、`plugin-system.md`、`face-handler.md`、`mover.md`、`saveable-content.md`、`replay-consistency.md`
- `docs/advanced/ii/index.md`
- `docs/advanced/ii/` 下除 `ui/` 外的全部 `.md`：`custom-range.md`、`static-vs-dynamic-tiles.md`、`point-and-tile-events.md`、`pathfinding.md`、`equipment-system.md`、`custom-replay-command.md`、`adding-hero-attribute.md`、`adding-enemy-attribute.md`、`enemy-context-and-combat.md`
- `docs/advanced/iii/` 全部 `.md`：`index.md`、`core-state.md`、`event-system.md`、`loading-system.md`、`passability-and-pathfinding.md`、`plugin-internals.md`、`replay-internals.md`
- 其它：`docs/poc/render-demo.md`

### 目标文档（后读，25 篇，按顺序）

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
| 1 `ui-template.md` | 「一个最小 UI」模板 | 四段：Props 类型、Props 列表（必须含 controller/instance/state）、defineComponent 里返回 render 函数、new GameUI 注册；container/g-rect/text 的用途 | 这一串 defineComponent（props 再返回函数）里，泛型、setup 参数、render 各段分别在做什么；哪一段能省、哪一段不能动，文档只给成品没拆开 | 原样抄进 `src/client/ui/my-panel.tsx` 并在 index 导出后，我以为就能在游戏里看到 480×320 深蓝面板；但下一步由谁调用 open，文档没给可照抄的入口 |
| 1 `ui-template.md` | 「文件放在哪里、怎么被用到」 | 文件放 `src/client/ui/<name>.tsx`、加入 `index.ts`；从 `bootstrap.ts` 或别的面板调用 open；client 不是全局变量 | 工程里 `src/client/ui/index.ts` 现在长什么样，以及第一次验证该把 open 写进哪个已有文件、哪一行；我没有源码，无法确认手里有没有那个变量 | 我预期复制文件、加导出一行、在某个已有文件 open 就能看到面板；找不到那个「某个已有文件」时会卡住 |
| 1 `ui-template.md` | 「GameUI 是一个对象，不是名字」 | open 传对象、名字不参与查找、重名不合并、用实例 key 区分多次打开 | key 在哪里读、长什么样；文档说用实例的 key 但没给读取示例，我不知道调试时怎么区分两次打开 | 我预期打开两次得到两个独立面板，但不知道在代码里怎么确认这是第一次那个 |
| 1 `ui-template.md` | 「三个基础 props」/「open 的第二个参数」 | controller/instance/state 由系统注入；第二个参数只放自己的 props，会被包装成响应式，父组件改它面板会更新 | 子组件能不能改 props.xxx 反向写回打开方；文档只说父改子更新，没说子改父 | 我预期 props 是只读的；如果可写，我担心误改打开方数据，但文档没有正面回答 |
| 1 `ui-template.md` | 「两条写法怎么选」 | TSX 由 Vue 管节点，元素层自己 appendChild/销毁，二者落到同一棵渲染树 | 元素层创建的 root 最后挂到哪里才算显示；示例只写到 appendChild，没有把 root 交给谁的那一步 | 我预期元素层写法也能显示，但走到最后一步会发现没有入口把 root 挂进 UI 容器 |
| 2 `container-and-coordinates.md` | 「loc 与锚点」 | loc 六元组顺序 x、y、w、h、anchorX、anchorY；宽高可省，默认 200×200；锚点决定元素哪个点落在 x/y 上 | 文档说两两一组要么都写、要么都不写，又说宽高可省；只写 x、y 两项是否合法，还是必须写全四项或六项 | 我预期只写两项会得到 200×200、左上角在坐标处的容器；但不确定默认尺寸会不会盖住邻居 |
| 2 `container-and-coordinates.md` | 「坐标与变换如何沿树传递」 | 父级平移/缩放/旋转复合到子级，锚点是变换中心；不要手算累加屏幕坐标 | 命中测试是否也按变换逆算；父容器放大 2 倍后，点视觉上的子元素位置，事件会不会正确落到子元素 | 我预期放大后仍能命中；但这一篇只讲绘制与坐标，命中要到第 9 篇才讲 |
| 2 `container-and-coordinates.md` | 「容器不裁剪绘制…」 | 容器不裁剪绘制、但命中受父容器矩形限制；0×0 容器会看得见点不到 | 父容器矩形是变换前的局部矩形还是变换后的屏幕矩形；父容器旋转后命中边界怎么算 | 我预期 0×0 容器点不到；但旋转父容器下的子元素命中是否仍按轴对齐矩形，我不确定 |
| 2 `container-and-coordinates.md` | 「坐标基准与画布」 | loc 是画布设计坐标，不是 CSS 像素；renderer.width/height 是设计尺寸，窗口缩放由客户端处理 | 真实项目里 renderer.width/height 是多少、示例站 480×320 与真实画布是否一致；文档只给了示例站数值 | 我预期按 renderer.width 居中就能适配；如果真实画布不是 480×320，我不知道该以哪个数值写死 |
| 2 `container-and-coordinates.md` | 「一个嵌套示例」元素层部分 | 元素层用 new Container、pos、size、appendChild 建立父子关系 | root 创建后由谁挂到画布；示例没有 mount 或 addChild 到渲染根的那一步 | 我预期这段代码能跑，但复制后只能得到一堆未挂载的对象 |
| 3 `basic-shapes.md` | 「四个图形」 | g-rect/g-circle/g-ellipse/g-line 的几何参数；圆默认中心锚点，矩形默认左上；线用端点而不是 loc | 圆和椭圆能不能也用 loc 定位；文档只示范 x/y/radius，我想统一用 loc 时不知道该不该这么写 | 我预期 g-circle 写 loc 不生效或语义不同；文档没有明确禁止，我不敢确定 |
| 3 `basic-shapes.md` | 「填充、描边与命中」 | fill/stroke/strokeAndFill 是模式开关，颜色在 fillStyle/strokeStyle；默认矩形填充、线描边、默认色 #ddd | strokeAndFill 与 fill 加 stroke 同时写时谁赢；表格说 strokeAndFill 优先，但漏写它只写 fill 和 stroke 时边框在内还是外 | 我预期按表格组合能得到确定结果；但三个开关照抄时容易记混顺序 |
| 3 `basic-shapes.md` | 「actionStroke」 | 只让描边命中、内部下穿，命中宽度等于 lineWidth，没有最小热区 | actionStroke 对 g-rectr 圆角矩形是否也按圆角描边命中，还是按普通矩形；这一篇只举了 g-rect | 我预期圆角矩形加 actionStroke 后点圆角外侧不命中；但圆角部分要到第 4 篇才讲 |
| 3 `basic-shapes.md` | 「图形作为界面零件」表 | 文字盖在按钮上会先命中文字，给文字 noevent 可让点击落到按钮底 | 文字默认会接事件是否意味着文字元素自带 onClick 才会接，还是只要在矩形里就会被命中；我没写过 UI，分不清可命中与绑了监听 | 我预期点文字时事件会冒泡到按钮底；如果文字没绑监听，事件是否还会以文字为目标，文档没说 |
| 3 `basic-shapes.md` | 「为什么矩形没有圆角」 | 圆角用 g-rectr，g-rect 加 radius 不生效也不报错 | g-rectr 的 circle 数组长度与角映射；这一篇只说第 4 篇讲，我照着写 circle 一个数时不知道它是半径还是别的 | 我预期一个数就是四角同半径；但不确定单位和上限 |
| 4 `curves-and-paths.md` | 「路径与曲线的坐标基准」 | 贝塞尔没有 loc、点坐标相对父容器、元素自动取包围盒；g-path 的 Path2D 坐标是元素局部坐标 | 自动取包围盒之后，元素的 x/y/w/h 还能不能读、能不能用来做锚点定位；文档说不要用 loc 挪它，但没说我怎么知道它占多大 | 我预期曲线画在父容器坐标处；但没法像矩形那样用 loc 精确对齐下一条线 |
| 4 `curves-and-paths.md` | 「路径」 | g-path 的 path 必须是 Path2D，moveTo/lineTo 组路径，路径只构造一次 | 在会随 props 变化的组件里，路径点变了要怎么重建 Path2D；文档只说渲染函数外构造一次，但我的点来自 props | 我预期 props 变了路径也要变；照文档放在渲染函数外则不会更新，我不知道该放哪 |
| 4 `curves-and-paths.md` | 「圆角矩形」 | circle 支持 1/2/3/4 项、ellipse 支持 2/4/6/8 项，角顺序左上、右上、右下、左下 | ellipse 的 0 值组怎么写才算直角；示例给两组 20 和两组 0，但我不确定 0 组是半径 0 还是不设圆角 | 我预期写 0 就是直角；但和 circle 的四项写法对照时容易混 |
| 4 `curves-and-paths.md` | 「路径在渲染树与命中中的位置」 | 路径按几何轮廓命中，画到 200×200 外仍可点，元素宽高只影响锚点与变换中心 | 路径超出父容器时，父容器命中矩形会不会把它挡住；文档说容器不裁剪绘制但命中受父容器矩形限制 | 我预期路径画到父容器外仍可见但点不到；这与路径画到元素默认 200×200 外仍可点是两层，我不确定哪层优先 |
| 5 `text.md` | 「尺寸与居中」 | 文字宽高由测量决定，给 width/height 不会裁剪；居中用 anchor 0.5；右对齐用 anchorX=1 | loc 的后两项写 0.5 与再写 anchorX/anchorY 0.5 两处都写时以哪个为准；这一篇自己又说只写一种，示例却两处都写 | 我照着示例抄会得到居中文字，但不知道删掉哪一处仍然正确；文档没有给出只写 loc 后两项或只写属性的单独版本 |
| 5 `text.md` | 「字体」 | new Font(family, size, unit, weight, italic) 是位置参数；Font.defaults/Font.clone 是对象形式；setDefaults 改全局默认 | addFallback 是实例方法还是静态方法，后备字体挂在哪个 Font 上；文档只说用 addFallback | 我预期能给一个 Font 加后备字体；但不知道调用形式，写不出来 |
| 5 `text.md` | 「一行文字」元素层部分 | new Text、pos、setText、setStyle（颜色、描边色）、setFont | 元素层怎么设描边宽度；TSX 有 strokeWidth，元素层只看到 setStyle 第二个参数是描边颜色，没有宽度入口 | 我预期元素层也能画带宽度描边的文字；但照现有 API 只能设颜色 |
| 5 `text.md` | 「为什么文字默认不缓存」 | 文字默认不缓存，静态标题可显式 cache，nocache 优先级更高 | 文字内容不变的判断标准是字符串不变还是测量结果不变；字号或字体变了但文字没变时缓存会不会失效 | 我预期改字体后缓存会重画；但文档没有说明缓存键包含哪些属性 |
| 5 `text.md` | 「不会自动换行」 | 单行 text 不换行，长文本用 TextContent，width 必填 | TextContent 的 width 与 loc 第三项冲突时以哪个为准；这一篇说具体在第 15 篇，我读到这里时还没有答案 | 我预期先读完第 15 篇才能决定；在此之前只能用多个 text 硬排 |
| 6 `image-and-texture.md` | 「图片元素与纹理」 | image 接收纹理对象，loc 决定显示大小；纹理被拉伸铺满；透明像素也算命中；图片是叶子元素 | image 的 image 属性类型是 Texture 还是 ITexture；素材管理器返回 ITexture，示例里 Texture 是类，两者能不能直接互换 | 我预期从 materials.getImageByAlias 取到的东西能直接传给 image；但类型对不上时不知道该不该 new Texture |
| 6 `image-and-texture.md` | 「纹理从哪里来」 | 可以用 canvas 构造 new Texture，纹理尺寸取图像源宽高；不要在渲染函数里重复创建 | Texture 从 @motajs/render 导入，但 ITexture 从哪导入、和 Texture 什么关系；文档没有给 ITexture 的导入路径 | 我预期写 ref 里装 Texture 或 null；如果素材管理器给的是 ITexture，这个 ref 类型就接不住 |
| 6 `image-and-texture.md` | 「加载一张 PNG」 | 先 new Image、等 onload 再 new Texture，用 null 表示未加载，加载完成写 ref | onMounted 里发起的加载在组件卸载后是否要取消；文档说不需要手动停止，如果 URL 很慢，卸载后 ref 还会不会被写 | 我预期卸载后写 ref 不报错也不重新显示；但文档只给了一句不会让已销毁的组件重新出现，我无法确认是否会泄漏请求 |
| 6 `image-and-texture.md` | 「从素材管理器取纹理」 | materials.getImageByAlias 返回 ITexture 或 null，取不到先走占位；普通子组件不要读 props.state，应在顶层取好再传 | ITexture 的公开成员有哪些（宽高？能否直接给 image？）；文档没有列，只说用法与上一节完全一样 | 我预期把 ITexture 传下去就能画；但上一节的 Texture 是可构造类，我不确定两者是否同一类 |
| 6 `image-and-texture.md` | 「像素图与高清缓存」 | noanti 关抗锯齿、anti 开、hd 只对开了缓存的元素生效；像素图尽量整数倍放大 | anti 和 noanti 都不写时的默认值；文档只说 noanti 优先级高，但没给默认 | 我预期默认是抗锯齿；如果不是，我的像素图会先糊一次，需要知道默认才知道要不要显式写 |
| 7 `layer-transform-performance.md` | 「遮挡：zIndex」 | 同一父级按 zIndex 从小到大绘制、从大到小命中；同值按插入顺序；跨父级不能直接比 | zIndex 不写时的默认值；文档一直说值大的在上，但没给默认，多个元素都不写时我只能猜是 0 | 我预期都不写时按插入顺序；如果有默认非 0，我的层叠会与预期不同 |
| 7 `layer-transform-performance.md` | 「变换：scale、rotate 与 alpha」 | scale 必须是两个数的数组、rotate 用弧度、alpha 0 到 1，锚点是变换中心 | 能不能绕任意点旋转或缩放；只能改 anchor，但 anchor 是元素自身比例，不能设成任意像素点 | 我预期把按钮绕左上角旋转就设 anchor 0；想绕元素外一个点旋转时，文档没有入口 |
| 7 `layer-transform-performance.md` | 「缓存与脏更新」 | container 和 custom 默认缓存，text/image/template 与全部图形默认不缓存；nocache 优先；属性变化自动标脏沿父链上冒 | 缓存画布的默认分辨率与 hd 默认值；文档说 hd 控制高清，但没说默认是开还是关 | 我预期默认缓存是普通分辨率；如果默认高清，内存会比我预想大 |
| 7 `layer-transform-performance.md` | 「filter 与 composite」 | 它们接收画布滤镜字符串与混合模式，影响绘制不影响布局与命中 | 允许的取值列表；文档说取值很多、需要时再查对应取值，但没有链接或枚举名，我无法照抄一个可用的值 | 我预期写 CSS 风格的值能生效；但文档没有确认语法，我不敢写 |
| 7 `layer-transform-performance.md` | 「事件坐标与 noevent」 | offsetX/Y 是当前元素局部坐标、absoluteX/Y 是画布坐标，缩放旋转后会反算；noevent 跳过整个子树命中 | 父级 noevent 时，子元素自己再写 noevent 为 false 能不能恢复命中；文档说整个子树不参与命中 | 我预期不能恢复；但不知道有没有反向开关，照文档只能给每个子元素单独处理 |
| 8 `reactivity.md` | 「数据变化如何走到渲染树」 | 数据到组件渲染函数到新 VNode，再只 patch 变化的元素属性，下一帧重绘；重渲染是组件级，patch 是元素级 | 元素实例不重建是否意味着我放在模块顶层或 setup 里的普通变量会一直保留；文档举了滚动位置，但没说普通对象变量 | 我预期重渲染不会重置普通变量；如果是 setup 内每次执行都重新声明，我就分不清哪些会重置 |
| 8 `reactivity.md` | 「ref：带 value 的盒子」 | TSX 里读写都要 .value，忘记写会得到 object Object 且不更新；ref 可以包对象 | ref 从 vue 导入，但项目里是否已经装好 vue、新建文件时要不要改 package.json；文档默认模板工程已配置 | 我预期直接 import ref 就能用；如果项目没有显式依赖，我会在编辑器里看到找不到模块 |
| 8 `reactivity.md` | 「reactive：一整块对象」 | reactive 不能整体替换、解构会丢响应式、应逐字段改或用 toRefs | toRefs 的具体写法与返回类型；文档只说改用 toRefs，没给一行示例 | 我预期解构后还能用；但不知道 toRefs 之后是不是 ref、要不要 .value |
| 8 `reactivity.md` | 「什么时候用 shallowRef 与 markRaw」 | 大对象整体替换用 shallowRef、外部实例用 markRaw；纹理放进普通 ref 会被深层代理 | markRaw 与 shallowRef 一起用时先包哪个；素材管理器返回的纹理，我该 markRaw 还是 shallowRef | 我预期两种都能减少代理；但文档没有给组合写法，我怕包错导致不更新 |
| 8 `reactivity.md` | 「watch：副作用」 | watch 回调拿新值旧值、setup 内创建会自动停止、只读派生用 computed | watch 默认是浅层还是深层；监听一个 ref 内部对象的 count 时，该写 getter 还是直接传对象 | 我预期监听对象内部字段要写成 getter；文档示例只监听 ref 的 count，没有对象字段的例子 |

| 9 `events.md` | 「命中测试」 | 从根开始按 zIndex 大到小找第一个命中，同值后加入的先；容器按矩形、图形按几何；命中就停，不进兄弟 | 后加入在同 zIndex 时是否稳定，列表重排后会不会改变命中；文档说同值按插入顺序，但没说不写 zIndex 时列表重排的影响 | 我预期重叠按钮点最上面；如果两个都没写 zIndex，重排列表后可能点错，我不知道该不该显式给 zIndex |
| 9 `events.md` | 「事件名：on 加事件名」 | onClick/onDown/onUp/onMove/onEnter/onLeave/onWheel，捕获加 Capture；点击要求按下与抬起在同一元素 | 按下在子元素、抬起在父元素时，click 会不会在共同祖先上触发；文档只说同一元素才会产生 click | 我预期不会产生 click；如果同一元素指事件目标链上的共同元素，我就理解错了 |
| 9 `events.md` | 「事件对象」 | target 是当前处理事件的元素（每个元素拿到的是自己），offset 是局部坐标，absolute 是画布坐标，type 与 buttons 不同 | 最初命中的元素怎么拿；target 每个元素都是自己，那我在父容器里怎么知道点到的是哪个子元素 | 我预期用 ev.target 能拿到起点；按文档它会被改写，我需要另一个字段或方法，文档没给 |
| 9 `events.md` | 「事件对象」MouseType 示例 | type 是本次触发按键、buttons 是当前按住的所有键，判断左键点击看 type | MouseType.Left 能不能直接当位掩码用；示例写 buttons 与 MouseType.Left 做位与，但 MouseType 是按键种类枚举，不是位标志 | 我预期这段位运算能判断按住左键；如果枚举值不是 1、2、4，结果会错，我需要知道 buttons 的位定义 |
| 9 `events.md` | 「enter 与 leave 不走普通冒泡」 | enter/leave 由根维护的 hover 集合做差集，先 leave 后 enter；父容器在指针下时也在集合里 | noevent 的容器不进集合，那它的子元素即使能命中，enter/leave 还触发吗；文档说 noevent 整个子树不参与命中 | 我预期 noevent 容器及其子元素都没有 enter/leave；cursor 也失效，我不确定是否所有悬停效果都失效 |
| 10 `hotkey-in-ui.md` | 「useKey：拿到当前组件的作用域」 | useKey 必须在 setup 同步调用，返回当前组件的作用域，组件卸载自动移除；第二个参数 clearImpl 默认 true | 普通子组件（不是 UI）里怎么拿到 props.state.hotkey.system；文档说 useKey 在组件里用，但示例都默认有 props.state | 我预期子组件也能接按键；但子组件没有 props.state，我需要知道该由父级传 system 还是另有入口 |
| 10 `hotkey-in-ui.md` | 「注册新指令与分组」 | system.addCommand（id、name、选项）、props.state.hotkey.setGroup、key.implement；id 带命名空间 | addCommand 返回的对象类型是什么、setGroup 要的指令对象数组是不是就是这些返回值；文档只写把 refresh 放进去 | 我预期把 refresh 直接放进 setGroup 就能在设置界面看到；如果它返回的不是指令对象，我会传错 |
| 10 `hotkey-in-ui.md` | 「优先级与阻断」 | priority 越高越先执行、block 阻断更低优先级、同优先级都执行；只比较同一次按键匹配到的多条指令 | priority 和 block 对 Once 与 Continuous 是否也生效；文档说目前只对抬起触发的指令生效，那按住连发的冲突怎么解决 | 我预期所有模式都能排序；按文档只有 KeyUp 有效，我需要知道 Once 与 Continuous 的冲突规则 |
| 10 `hotkey-in-ui.md` | 「默认按键」 | @common/exit 默认 Escape 与 X，@ui/menu 默认 Escape，两者都可能匹配 Esc | 同一次 Esc 同时匹配两条指令时谁先执行、会不会都执行；文档只说作用域栈顶实现执行，但两条指令都在栈顶面板里实现时呢 | 我预期 Esc 只关当前面板；如果两个指令都实现，可能一次触发两个动作，我需要知道匹配与阻断规则 |
| 10 `hotkey-in-ui.md` | 「按键与 UI 栈的关系」 | 按键作用域是一条全局栈，只有栈顶作用域的实现执行；hidden 不移除作用域，close 卸载才移除 | useKey 传 false 继承下层实现后，下层实现是被复制还是引用；如果下层后来改了实现，上层会跟着变吗 | 我预期继承的是当时的实现快照；但文档说复制到新作用域里继续生效，复制的深浅不明 |
| 11 `conditional-and-list-rendering.md` | 「条件渲染改的是树，不是样式」 | hidden 保留元素与状态只跳过绘制和命中；三元返回 null 会卸载、状态重置；坐标是绝对定位，hidden 不会让兄弟上移 | hidden 能不能写在组件标签上（例如给 ItemDetail 加 hidden）；这一篇的 hidden 都写在元素上 | 我预期写在组件上会作为 attrs 落到根元素；这一篇没说，要到第 14 篇才确认 |
| 11 `conditional-and-list-rendering.md` | 「循环：用 map 生成元素」 | map 返回元素数组，外层要有父容器，数组会成为父容器的子元素列表；固定顺序无状态列表不需要 key | 组件能不能直接返回一个数组作为根（第 23 篇的 ItemGrid 这么做了）；这一篇说必须放在渲染函数返回的元素树里、外层要有父容器 | 我预期组件根必须是单个元素；读到第 23 篇时会怀疑两种说法能不能同时成立 |
| 11 `conditional-and-list-rendering.md` | 「key」 | key 只在同一父级兄弟间唯一，列表项是组件时 key 写在组件标签上，重排增删或有状态才需要 | key 写在组件标签上时，组件内部的根元素还需不需要 key；文档说写在内部根元素上没有用 | 我预期只写外层就够；但 map 直接返回组件数组时，key 到底落在 VNode 还是元素上，我不确定 |
| 11 `conditional-and-list-rendering.md` | 「数据怎么变才会更新列表」 | ref 数组 push、splice、整体替换都触发，shallowRef 只认整体替换，reactive 数组不能整体替换，普通数组不触发 | reactive 数组整体替换是编译错误还是运行时静默不更新；文档说变量指向新数组、代理丢失，但没说是哪一类错误 | 我预期会静默不更新；如果是编译错误，我就能在编辑器里发现，处理方式不同 |
| 11 `conditional-and-list-rendering.md` | 「列表项的事件与状态」 | 回调要闭包当前 row，用 row.id 不用 index 反查；删除时要处理选中态 | selectedId 被删除后如果不清空，详情区会怎样；这一篇只说列表，详情在第 22 篇，我读到这里还没有闭环 | 我预期详情会显示旧数据或空；需要读到后面才知道该在面板层清 selectedId |
| 12 `props.md` | 「props 的完整管线」 | 父写属性、VNode props、子组件 props 数组挑键、setup 的 props；没声明的进 attrs，默认透传根元素 | props 数组只列键名、不做类型转换，运行时如果我传错类型（string 传给 number），会不会报错；类型只在编译期检查 | 我预期传错类型会静默通过；但文档说类型由 Props 接口约束，我不确定运行时有没有兜底 |
| 12 `props.md` | 「组件怎么拿参数」 | 普通组件继承 DefaultProps、必须在 props 数组列全、emits 数组声明事件、emit 交回父级 | DefaultProps 具体包含哪些键；文档说它提供元素通用字段与事件类型，但我需要知道 loc、hidden、onClick 是否都在里面 | 我预期继承 DefaultProps 就能写 props.loc；如果不包含，我会在类型上或运行时拿不到 |
| 12 `props.md` | 「泛型顺序」 | 四个泛型是 Props、Emits、事件名联合、Slots，第二第三要配套；没有 props 可省略第二参数 | 只写 defineComponent 的 Props 泛型而省略第二个参数时，props 数组从哪来；文档说第二参数可以省略，但省略后没有 props 声明 | 我预期省略第二参数后 props 全进 attrs；但示例又显示只写泛型不传 options 的情况，我不确定能不能既声明 Props 又省略数组 |
| 12 `props.md` | 「默认值用 props.x ?? 默认」 | 用空值合并而不是逻辑或，不要给 props 赋值；会变的派生值用 computed，挂载后不变的读一次 | computed 里读 props 时，props 更新是否一定触发；文档说会跟随，但如果 props 是普通对象字面量呢 | 我预期 computed 会跟随 props 引用变化；对象内部字段变化是否触发，要看父级是否用响应式容器 |
| 12 `props.md` | 「UI 的基础 props 是控制器注入的」 | controller/instance/state 由控制器注入，open 第二个参数作为自己的 props；hidden 和 zIndex 通常走 attrs | props.loc 到底算不算注入；这一篇没提 loc，第 18 篇说 loc 由打开方传，我需要把两篇拼起来才敢写 | 我预期 UI 组件要额外声明 loc 并在 open 时传；但模板篇的 props 数组只有三项，我照着写会拿不到 loc |
| 13 `component-tsx.md` | 「组件如何映射成一棵子树」 | 组件不产生额外节点，根元素挂到父树；组件树与元素树是两层；多个根节点会成为同一父级的多个子元素 | 多个根节点时 attrs 自动透传落到哪；文档说没有唯一根元素，要到第 14 篇才知道要关掉 inheritAttrs | 我预期多根组件能正常显示；但父级传的 onClick 和 fillStyle 不知道该落哪个根，我读到这里没有答案 |
| 13 `component-tsx.md` | 「一个完整组件的结构」 | 六段：import、Props 接口、SetupComponentOptions、defineComponent、render、导出；setup 返回 render 函数 | defineComponent 里为什么 setup 要返回函数而不是直接返回 JSX；这是 Vue 的 render 约定吗 | 我预期按此结构写就能更新；但我不理解 setup 只执行一次、render 每次执行的边界，写错会把状态放到 render 里 |
| 13 `component-tsx.md` | 「生命周期与渲染树」 | 创建、挂载、更新、卸载；onMounted 拿真实元素，onUnmounted 清理；setup 内 watch 自动停止，定时器要手动清 | onMounted 里拿到的元素引用是什么类型；文档示例用 Container 的 ref，但普通元素如 g-rect 该用什么类型 | 我预期 Container 的 ref 只对 container 有效；要拿 Rect 或自定义元素时我不知道对应类名 |
| 13 `component-tsx.md` | 「expose、emit 与父组件拿子组件」 | expose 暴露方法、父组件 ref 拿到后调用，挂载前是 undefined；emit 与回调 prop 二选一 | expose 暴露的方法在父组件 ref 上的类型怎么标注；文档只给 CardExpose，但那是手写接口，我要不要每个组件都手写 | 我预期可以手写 Expose 接口；如果组件没写 expose，父组件拿到的是组件实例，其类型是什么，文档没有说 |
| 13 `component-tsx.md` | 「组件与 UI 的区别」 | UI 要同时继承 IGameUIPropsBase 与 DefaultProps、props 数组含三项、被 GameUI 注册；普通组件只继承 DefaultProps | 组件被 new GameUI 注册是否只要求导出 GameUI 对象，还是还要在某个列表里登记；文档说 GameUI 不写全局注册表 | 我预期只要 new GameUI 就能 open；但打开处怎么拿到这个对象，仍要 import，我不知道工程里有没有统一出口 |
| 14 `slots-and-attrs.md` | 「slot 解决什么问题」 | TSX 里 slot 是函数不是标签；子组件用 slots 对象调用；默认 slot 用 slots.default 加可选调用，具名同理 | SlotsType 里每个 slot 的返回值为什么必须是 VNode；如果我返回数组（多个节点）类型对不上怎么办 | 我预期 slot 可以返回多个元素；类型写 VNode 时我只能包一层 container，这与组件不产生额外节点的说法有冲突感 |
| 14 `slots-and-attrs.md` | 「具名 slot」 | 具名 slot 用对象传入，键名就是 slot 名；用对象时默认 slot 也要写在 default 键里，不能与普通子元素混写 | 传 slot 时的双层花括号为什么存在；作为没写过 Vue 的人，我不知道这是对象字面量还是某种特殊语法 | 我预期照抄能工作；但如果不理解双括号，我改结构时很容易少写一层 |
| 14 `slots-and-attrs.md` | 「attrs：没声明的属性」 | 未声明为 props 也未消费的属性进 attrs；展开 attrs 原样传给内部元素；inheritAttrs 为 false 关闭自动落根 | attrs 里会不会包含 onClick 这类事件；文档说会，但如果同时声明了 emits，onClick 就被消费不再透传 | 我预期不声明 click 时 onClick 自动落到根元素；声明后必须自己 emit，我需要记住这个分叉 |
| 14 `slots-and-attrs.md` | 「组件边界上的事件与属性」 | 父组件写 onClick 落在哪取决于子组件是否声明 click；声明了就消费，不声明就透传 | 子组件有多个根节点、又没关 inheritAttrs 时，onClick 会落到哪；文档只说没有唯一根元素时应关掉 | 我预期会警告或不生效；具体行为没有写，我排错时没有依据 |
| 14 `slots-and-attrs.md` | 「slots/attrs 在渲染树里的完整例子」 | slot 内容最终成为子组件根元素下的普通子元素，坐标相对子组件容器；attrs 只改属性 | slot 内容的坐标是在父组件作用域算还是子组件容器算；文档说坐标相对子组件容器，但内容是在父组件渲染的 | 我预期写的 loc 是相对 Panel 容器；如果不是，我的布局会整体偏移，这句话我需要确认 |
| 15 `builtin-text-and-input.md` | 「这些组件替你决定了什么」 | TextContent 按 width 折行、autoHeight、逐字显示；Textbox 加背景标题内边距；Input 点开真实输入框；InputBox 一次性弹窗 | TextContent 的 width 与 loc 第三项冲突时到底哪个赢；表里说 loc 第三项会被 width 覆盖，但示例仍写 loc 不写宽，我需要确认写法 | 我预期只传 width 就够；如果我习惯性在 loc 里写第三项，文档说会被覆盖，我不确定是否要删掉 |
| 15 `builtin-text-and-input.md` | 「多行说明」 | interval 毫秒、省略或 0 直接显示全部；showAll、retype、getHeight 通过 ref 调用；事件 onTypeEnd、onTypeStart、onUpdateHeight | TextContent 的根是 custom 元素，点击要放外层 container；但如果外层 container 没写尺寸（默认 200×200），它会不会只覆盖一部分文字 | 我预期把 onClick 放外层就能点整块；但文字高度是测量出来的，外层容器尺寸不会自动跟着变，我不知道该不该用 autoHeight 同步 |
| 15 `builtin-text-and-input.md` | 「标题加正文的说明框」 | Textbox 的 width 必填、正文宽度等于 width 减左右 padding（有图标再减图标宽）、正文高度取 loc 第四项未写按 200；hide 不销毁 | Textbox 同时写 loc 的第四项与 height 属性时哪个生效；示例两处都写了 | 我预期以某一处为准；文档没有说优先级，我照抄时不知道删哪个 |
| 15 `builtin-text-and-input.md` | 「输入组件的受控边界」 | Input 用 v-model:value（即 value 加 update:value），失焦移除真实输入框但值保留；多字段各管各的 | 点击提交按钮时，Input 先失焦再触发 click 还是 click 先；如果先失焦，值会不会刚好在 click 前更新 | 我预期点提交能拿到最新值；但 DOM 输入框与画布事件的先后文档没有说明，我担心拿到旧值 |
| 15 `builtin-text-and-input.md` | 「特殊组件 InputBox」 | getInput（controller、text、loc、width、props）返回字符串 Promise；getInputNumber 返回数字；取消时是空串或 NaN；弹窗在 UI 栈上 | loc 六元组里写 void 0 是什么意思；示例用了两个 void 0，我没见过这种写法，不知道能不能省略 | 我预期照抄能居中；但如果不理解 void 0，我改成 undefined 或删掉后可能位置不对 |
| 16 `builtin-list-and-containers.md` | 「List：可选中的列表」 | List 接收 id 与文本的二元数组、v-model:selected、内部默认选第一项；父级初值要与第一项一致 | 如果 list 数据整体替换（例如换分类），List 的内部选中值会不会跟着变成新列表第一项；文档只说挂载后再改 selected 不会改选 | 我预期换列表后选中会重置；如果不是，我需要知道怎么让它同步，文档没有给方法 |
| 16 `builtin-list-and-containers.md` | 「List」行结构 | List 内部是 Scroll 加每行 container 加 Selection，行宽取 loc 第三项，行高 lineHeight；不要外面给 key | List 的 list 项 id 能不能是数字；文档示例都是字符串，但我的道具 id 可能是数字 | 我预期数字也支持；但类型没写，我不敢传，怕 v-model 类型不匹配 |
| 16 `builtin-list-and-containers.md` | 「ListPage」 | ListPage 左列表右详情、basis 比例、close 只发事件、右侧可按 id 具名 slot 或默认 slot | closeLoc 是相对 ListPage 还是相对右侧内容；文档说相对 ListPage，但示例在 400 宽里靠右，我需要确认它是绝对坐标还是偏移 | 我预期按 ListPage 左上角定位；如果它是相对右栏，我的关闭按钮会跑位 |
| 16 `builtin-list-and-containers.md` | 「Page」 | pages 是总页数、page 从 0 开始、hideIfSingle、changePage、movePage、now、pageChange 事件 | pages 变小且当前 page 超出时会不会自动夹紧；文档说 changePage 会夹，但外部直接改 page 绑定或 pages 变化时没说 | 我预期会自动夹到最后一页；如果不夹，内容区会空白，我需要自己 watch，但文档没提示 |
| 16 `builtin-list-and-containers.md` | 「弹窗与一次性提示」 | ConfirmBox、Choices、InputBox 压 UI 栈；getConfirm 返回布尔、getChoice 返回 key、getInput 返回字符串；getChoice 没有取消分支 | getChoice 的 choices 里 key 是否可以是任意类型；示例用数字，但签名只写 key 与文本，我需要知道能不能用字符串 id | 我预期 key 类型跟数组走；如果不支持字符串，我的分类 id 就得改成数字，文档没有说明 |
| 17 `ui-controller-and-stack.md` | 「控制器、实例与栈」 | 一个 UIController 管一条栈、背景、显示策略；open 产生 UIInstance 压栈；stack 按打开顺序，第 i 层 zIndex 为 i 乘 5 | stack 是不是公开可读的数组、类型是什么；文档多次说栈，但没有给读栈的示例，我只能靠 open 返回值持有实例 | 我预期能读 controller.stack 来调试；如果它不公开，我就只能自己记录实例 |
| 17 `ui-controller-and-stack.md` | 「keep：切换面板时不闪背景」 | keep 返回控制器，close 到空栈不关背景、active 保持真；最后 safelyUnload 或 unload；标记是布尔值不是计数，一次 close 就清掉 | 一次 close 就清掉与 close 到空栈不关背景怎么同时成立；如果 close 清掉 keep，那关旧面板的瞬间背景不就关了吗 | 我预期 keep 期间 close 不会关背景；但这句话让我怀疑 keep 只能挡住栈空那一次判断，我需要知道 close 内部到底先清还是先判断 |
| 17 `ui-controller-and-stack.md` | 「栈策略」 | lastOnly 默认、showAll 可叠加、showCustom 自定义；lastOnly 关闭时从该实例起全部移除，showAll 默认只移除该实例 | 从该实例起是向栈顶方向还是向栈底方向；如果是向栈顶，关中间一个会连带上面；如果是向栈底，会连带下面，语义完全不同 | 我预期关上层弹窗不影响下层；但按从该实例起我无法判断，示例又只给了逐层关闭的情况 |
| 17 `ui-controller-and-stack.md` | 「场景 UI 与主 UI」 | sceneController 管加载、标题、主场景，mainUIController 管背包、设置等；主场景把 mainUIController.render 放进容器，active 为假整体隐藏 | render 返回的是什么（VNode、元素还是组件），也不知道该放在 JSX 的哪个位置；文档只说放进一个容器 | 我预期写 controller.render 就能显示主 UI；如果不返回可渲染节点，我会在类型上报错 |
| 17 `ui-controller-and-stack.md` | 「基础 props 的注入链」 | setPropsBaseCreator 每个实例每次渲染调用一次，返回 controller、instance、state 注入；自定义 creator 必须带回 state | 自定义 creator 里的 state 从哪来；示例只返回 instance 和 controller，文档说接到真实客户端要带回，但没给获取方式 | 我预期在创建客户端时闭包拿到 state；但我没有客户端源码，不知道那个变量叫什么、在哪一层 |

| 18 `replace-builtin-ui.md` | 「替换的是入口，不是实现」 | 每个内置 UI 导出 GameUI 常量，替换点只有打开处与包装层；修改打开入口会影响所有调用方，改单个调用点只影响一处 | 这些内置入口函数（openSettings、openReplay、saveSave 等）现在的完整签名；表里只给名字与参数轮廓，我要替换时不知道该保留哪些参数 | 我预期保留同名同签名只换内部 GameUI；如果签名比我看到的多个参数，我会漏传，文档没有给完整签名 |
| 18 `replace-builtin-ui.md` | 「替换步骤」第二步 | 新组件要接收 controller、instance、state 与 loc，props 数组列全；loc 由打开方传，不由控制器注入 | loc 的类型 ElementLocator 的六元组含义是否与 loc 属性一致；示例直接把 props.loc 传给 container，但我没确认它是不是数组 | 我预期直接把 props.loc 传给根 container；如果类型是对象而非数组，我就写错 |
| 18 `replace-builtin-ui.md` | 「替换步骤」第三步 | 两种做法：保留入口函数换内部 UI，或只改工具栏一个调用点；做法一影响所有调用方 | 保留入口函数时，原函数是否还做了 loc 默认值、背景、keep 等额外工作；文档示例只写了 controller.open，我担心漏掉原逻辑 | 我预期只换 GameUI 对象就等价；如果原入口还处理了别的事，我会丢行为，文档没有列出原函数完整实现 |
| 18 `replace-builtin-ui.md` | 「可以替换哪些、分别影响什么」存档行 | 存档界面替换后必须保留索引、自动存档槽位、mode 语义、校验回调返回值、关闭后的 Promise 结果；返回值语义不能变 | 这些返回值的具体约定（例如 -2 代表什么、Promise resolve 什么）；文档只说必须一致，没有给可照抄的语义表 | 我预期换外观后存档仍能读写；但不知道返回值，我会写错槽位 |
| 18 `replace-builtin-ui.md` | 「风险与边界」包装漏转发 | 包装组件要转发全部 props、attrs、slots、emits；漏一个就出问题 | attrs 与 props 一起转发时会不会重复；也不知道 slots 要怎么原样转发（v-slots？对象？） | 我预期包装能透明；但文档没有给一个完整的包装组件示例，我不知道 slots 的转发语法 |
| 19 `ui-performance.md` | 「性能问题先定位在哪一层」 | 六个层：绘制缓存、命中遍历、组件重渲染、列表滚动、纹理文字、UI 栈背景；先做减法看差异 | 在文档站或游戏内怎么打开浏览器性能面板、怎么录帧；文档假设我会用开发者工具 | 我预期按表定位；但我连帧时间在哪里看都不确定，第一步就卡住 |
| 19 `ui-performance.md` | 「缓存：什么时候有用、什么时候有害」 | 缓存适合结构复杂内容稳定的子树，不适合简单内容、频繁变化、过大子树；容器默认缓存，文字高频变化时应拆出去 | 过大的阈值；文档说不给毫秒数，但也没给内存或尺寸的参考，我无法判断我的面板算不算过大 | 我预期小面板不用管；但 720×480 全屏缓存算不算过大，我没有依据 |
| 19 `ui-performance.md` | 「纹理与文字」 | 大图按纹理尺寸占内存、同图共享纹理、不要在渲染函数里建纹理；文字变化要重新测量排版 | 每个元素仍可能有自己的离屏缓存与第 6 篇 image 默认不缓存怎么合起来理解；image 到底默认有没有离屏缓存 | 我预期 image 默认不缓存；但这句话说可能有，我不知道什么时候会有 |
| 19 `ui-performance.md` | 「观测与验证」 | 固定最坏场景、录几秒、做减法、一次只改一个开关、回到真实数据 | 长帧的具体判定标准；文档说不给毫秒数，那我看到 30fps 算不算问题 | 我预期只能相对比较；但没有基线，我不知道优化到什么程度算够 |
| 19 `ui-performance.md` | 「UI 栈」 | 能 hide 和 show 就不 open 和 close；稳定背景用 setBackground；keep 用完卸载；栈越深越贵 | 栈越深越贵是线性还是指数；如果我要同时开 5 个面板，是否应该合并成一个 | 我预期 5 层还能接受；但没有量级，我无法决定要不要改结构 |
| 20 `inventory-example-1-skeleton.md` | 「骨架在渲染树里的位置」 | 根 container 720×480，面板主体 [30,30,660,420]，左 [54,100,400,280]，右 [470,100,196,280]，底 [54,392,304,32]；坐标相对根 | 这个 720×480 的根容器与 UI 容器、画布的关系；文档说 UI 容器由控制器创建，但没给 UI 容器的尺寸，我不知道面板会不会被裁 | 我预期打开后在画布上看到完整 720×480；如果画布只有 480×320，我看到的是被裁掉的面板，需要按文档加 scale |
| 20 `inventory-example-1-skeleton.md` | 「骨架代码」 | 完整骨架代码，包括背景、主体、标题、关闭按钮、两个占位；props 数组三项；GameUI 导出 | 这段代码里 IGameUIPropsBase 与 DefaultProps 的导入路径是否都可用；模板篇说来自 client-base 与 render-vue，这里没重复 import | 我预期照抄能编译；缺 import 时我会看到找不到名称，需要回到代码基础补，文档没有列全 import |
| 20 `inventory-example-1-skeleton.md` | 「打开它」 | 三个打开入口：sceneController、props.controller、mainUIController；区别在哪个栈 | 第一次打开这段代码放在哪；示例是在某个已有组件里用 props.state，但我还没有任何已打开的 UI 来提供 props | 我预期从 bootstrap 或主场景打开；但文档说 bootstrap 持有 client，我没有它的源码，找不到变量名 |
| 20 `inventory-example-1-skeleton.md` | 「运行效果」 | live 用 720×480，关闭按钮只显示提示，文档站没有真实 UI 栈 | live 的 720×480 与正文说的示例站画布 480×320 是什么关系；两个尺寸同时出现，我不知道该按哪个设计 | 我预期 live 能看到完整面板；但正文又说示例站是 480×320，我不确定自己的验证环境是哪一个 |
| 20 `inventory-example-1-skeleton.md` | 「边界与注意」 | 不要用真实素材、关闭按钮要先能用、Props 三件套、占位区尺寸 | 不用真实素材时图标怎么画；文档说用矩形加文字，但我的道具没有图标字段，我不知道格子该显示什么 | 我预期用纯色块加名称数量就够；视觉上怎么区分不同道具，文档没有给最小图形方案 |
| 21 `inventory-example-2-grid.md` | 「数据模型：Item 只定义一次」 | Item 有 id、name、count、desc，id 稳定唯一；Item 与 ItemGrid 同文件 export，其他文件用 import type | import type 在 ItemCell 文件里会不会造成循环依赖；文档说类型导入编译后擦除，但我还是不确定运行时是否安全 | 我预期安全；但如果 ItemGrid 又 import ItemCell，两个文件互相 import，我需要知道类型导入是否真的不生成 require |
| 21 `inventory-example-2-grid.md` | 「ItemCell：一个格子」 | ItemCell 无状态，props 有 item、selected、size，点击 emit select(id)；描边选中与未选中保持尺寸一致 | size 只读一次，如果父级之后改 cellSize，格子不会跟着变；文档注释说若尺寸会随窗口变化再改成 computed | 我预期父级改尺寸时格子会更新；按示例不会，我需要知道什么时候必须用 computed |
| 21 `inventory-example-2-grid.md` | 「ItemGrid：按行列排列」 | columns、cellSize、gap 用 computed 派生，坐标按列乘间距；key 用 item.id；定位容器与格子同尺寸 | props.items 直接 map 时，如果 items 是普通数组（非响应式），父级改数组会不会重渲染；文档说 items 由面板 ref 持有，传给网格的是 items.value | 我预期父级 ref 变化会传新数组并重渲染；如果子组件拿到的是普通数组，我担心它不会追踪内部变化 |
| 21 `inventory-example-2-grid.md` | 「数据如何进入网格」 | 数据只有一条路：面板持有 items，传解包后的数组；selectedItem 在面板 computed；网格只上报 | items.value 传给子组件后，子组件改 props.items 里的对象字段（例如 count）会不会影响父级；文档说对象是响应式代理，但没说子组件能不能改 | 我预期子组件不应改 props；但示例（五）的使用是在面板改，我需要确认网格只读 |
| 21 `inventory-example-2-grid.md` | 「这一步的边界」 | 本步网格不滚动，超出的格子仍渲染在区域外；示例（四）换成 Scroll，props 与事件链不变 | 普通网格超出的格子仍渲染时，会不会盖住右侧详情区；左侧容器没有裁剪，格子画到 x 大于 400 会进入右侧 | 我预期不会盖住；但文档说容器不裁剪绘制，我需要知道右侧详情的 zIndex 或绘制顺序是否能盖住它 |
| 22 `inventory-example-3-detail.md` | 「详情区接的是哪个状态」 | selectedId 用可空字符串 ref，初始 null；selectedItem 用 computed 加空值合并收口成 null；不要用 undefined 或空串 | selectedId 为 null 时 items 的 find 比较逻辑；item.id 等于 null 永远 false，所以返回 undefined，我能推出来，但文档没有明确写 | 我预期未选中时 selectedItem 为 null；按空值合并确实如此，但我需要自己推一遍才确定 |
| 22 `inventory-example-3-detail.md` | 「详情区的树结构」 | 根 196×280，背景、标题、两块 hidden 容器、取消按钮；描述用 TextContent，width 为 164，autoHeight | 两个 hidden 容器都没写 loc 和 size 时默认 200×200 会不会互相遮挡；它们都在详情根里，200 宽超过 196，200 高到 y 为 200，而取消按钮在 236 | 我预期不会遮挡按钮；但默认尺寸超过容器宽，我不确定会不会盖住右边或影响命中 |
| 22 `inventory-example-3-detail.md` | 「ItemDetail：右侧面板」 | props.item 允许 null，两块用 hidden 切换都渲染；取消选择只 emit clear；按钮最后放所以盖在内容上 | 详情块的文本在 item 为 null 时仍会被求值并显示空串；描述 TextContent 仍会创建并测量空文本 | 我预期空文本不占高度；但 TextContent autoHeight 测出 0 时，是否仍会创建 custom 元素，我不确定 |
| 22 `inventory-example-3-detail.md` | 「空态与边界」 | 三种空态：未选中、选中项被删除、items 为空；删除时要在面板层把 selectedId 写回 null | 选中项被删除时，如果不是通过面板的删除函数，而是 items 被外部整体替换，selectedId 不会自动清；文档只说要手动检查 | 我预期外部替换 items 后详情显示旧 id 或空；我需要知道有没有统一的 watch 入口，文档没有给 |
| 22 `inventory-example-3-detail.md` | 「运行效果」 | live 用元素层文字等价展示多行，正文才是 TextContent；两者不是同一段代码 | live 与正文不一致时，我该以哪个为准；文档说两者不是同一段代码，但没说明 live 的视觉是否与真实 TextContent 一致 | 我预期 live 只用于看布局；但文字高度和换行可能不同，我无法用 live 验证真实排版 |
| 23 `inventory-example-4-scroll.md` | 「为什么要换滚动」 | Scroll 只检查直接子元素，内容不能先包大容器；组件本身不是节点，ItemGrid 返回行数组，行会平铺成 Scroll 的直接子元素 | 组件返回数组作为根是否被渲染器支持；这一篇直接说返回行数组，但第 11 篇说 map 必须放在有父容器的元素树里 | 我预期按本篇写能滚动；但按第 11 篇的理解，我会以为组件根必须是单个元素，两种说法我需要确认 |
| 23 `inventory-example-4-scroll.md` | 「Scroll 在渲染树里的位置」 | 左侧容器 [54,100,400,280]，Scroll [0,0,372,244]，行容器从 y 为 0、每行 74，按钮在 y 为 252；滚动条在视口右侧 | Scroll 的视口宽 372 与左侧 400 之间 28 像素，是否就是滚动条宽度；文档说右边留出的 28 像素是滚动条与内边距，但没给滚动条具体宽度 | 我预期可点击元素避开 x 为 372 附近就安全；如果滚动条更宽，我会压到它，文档没有精确值 |
| 23 `inventory-example-4-scroll.md` | 「ItemGrid 改为行容器数组」 | 行容器 key 用行号、格子 key 用 item.id；行高必须包住整行；返回 rows 数组 | rows 用空数组声明时 TypeScript 会不会推断成 any 数组；文档没有给类型，我照抄可能在严格模式下报错 | 我预期能编译；如果 noImplicitAny 开启，我需要自己标注类型，文档没提 |
| 23 `inventory-example-4-scroll.md` | 「面板里怎么接」 | Scroll 包 ItemGrid，scrollTo 回顶、scrollTo 传入 getScrollLength 到底；padEnd 给 16；hide 保留滚动位置、close 重置 | getScrollLength 在内容不足一屏时返回 0 或负数，scrollTo 负值会怎样；文档说会被夹到 0，但没说负数输入是否告警 | 我预期滚到底按钮在内容少时不动；按夹紧逻辑确实不动，但我需要确认不会报错 |
| 23 `inventory-example-4-scroll.md` | 「滚动与事件」 | Scroll 在捕获阶段补滚动偏移，格子拿到局部坐标；拖动超过阈值才算拖动，否则算点击；不要在内容上再套滚动手势 | 拖动阈值是多少；如果我的格子很小，轻微移动会不会被当成拖动而不选中 | 我预期轻点能选中；但阈值未知，触屏或手抖时可能选不中，文档没有给数值或可配置项 |
| 24 `inventory-example-5-state.md` | 「操作条的树与事件流」 | ActionBar 三个按钮横排，点击 emit equip、use、close；禁用只视觉弱化加早返回 | makeButton 在 enabled 为 false 时，容器仍然接收点击并早返回，那它会不会挡住下面同位置的元素；按钮之间没有重叠，所以暂时没事，但我不确定设计意图 | 我预期禁用按钮点不动但也不会穿透；如果是早返回，点击被吃掉，不会落到面板背景，文档没有说这是否预期 |
| 24 `inventory-example-5-state.md` | 「状态放在 InventoryPanel」 | items、selectedId、equippedId、hint；selectedItem、canEquip、canUse、isEquipped 都是 computed；使用减 count 用 watch 更新 hint | 直接改 props 传下来的对象里的 count 算不算改 props；这个 item 来自 items.value，面板持有，网格只读，但 ItemDetail 也拿到同一个对象 | 我预期面板改 count 会触发网格与详情更新；如果对象被 markRaw 或 shallowRef 包过就不会，文档警告过不要用 shallowRef，我需要确认 |
| 24 `inventory-example-5-state.md` | 「状态变化如何反映到画面」 | 装备改 equippedId、isEquipped、ItemGrid 的 equippedId、ItemCell 描边绿；使用改 count、数量文本与 canUse；提示改 hint 文本 | 监听 selectedItem 的 count 时，切换选中但 count 相同不会触发；文档说这是预期，但如果我想每次切换都提示，需要另写 watch | 我预期切换选中会刷新提示；按当前写法同数量不刷新，我需要知道这是否是我要的行为 |
| 24 `inventory-example-5-state.md` | 「关闭的完整路径」 | 三个关闭入口最终都走 controller.close(instance)；ActionBar 只 emit close；Esc 用 useKey 实现 @common/exit | Esc 的实现要放在哪个 setup 阶段、和 useKey 的调用顺序有没有关系；文档说 setup 里调一次，但没给完整组件片段 | 我预期放在 setup 顶部即可；如果放在 return 之后或事件里就不生效，我需要看到完整位置才敢写 |
| 24 `inventory-example-5-state.md` | 「遮罩与 noevent」 | 遮罩放根容器第一个子节点、面板主体之前，先绘制所以面板盖住它；noevent 让点击下穿 | 遮罩铺满 720×480、面板主体只占 660×420 时，面板外的遮罩是否真的能压暗画布；如果根容器本身不绘制，遮罩就是唯一覆盖层 | 我预期面板外变暗；但最终组装里又套了一层同尺寸 container，我不确定遮罩是在内层还是外层，效果是否一样 |
| 25 `inventory-example-6-animation-and-register.md` | 「动画作用在树的哪一层」 | 只改 alpha，不重建组件；呼吸描边加 noevent，提示文字改 hintAlpha；rAF 在 onMounted 启动、onUnmounted cancel | requestAnimationFrame 每帧写 pulse 会不会导致整个面板组件重渲染；文档说只驱动响应式值、不重建组件，但响应式是组件级重渲染，元素只 patch alpha | 我预期每帧都会重跑渲染函数、只 patch alpha；如果面板很大，这可能就是性能问题，文档没有说明是否要拆成子组件 |
| 25 `inventory-example-6-animation-and-register.md` | 「最终组装与契约核对」 | 九条契约、最终骨架、坐标以本篇为准；外层画布根加内层面板根，内层实际用 hidden 控制开合 | 内层面板根为什么需要，以及 hidden 写在哪一层；文档说实际代码用 hidden 控制开合，但骨架里没给 hidden 的位置 | 我预期 hidden 写在面板根上；如果外层根也 hidden，两者区别是什么，文档没有说 |
| 25 `inventory-example-6-animation-and-register.md` | 「注册与打开」 | InventoryUI 在 inventory-panel.tsx 导出，index.ts 再导出；打开用 mainUIController.open（InventoryUI、空对象） | 这段打开代码具体放在哪个组件或文件里；文档说从主 UI 栈打开，但没有给一个宿主组件的完整片段 | 我预期在工具栏或主场景里调用；但我没有主场景源码，不知道 props.state 在那一层是否可用 |
| 25 `inventory-example-6-animation-and-register.md` | 「最终验证清单」 | 打开、选中、取消、滚动、装备、使用、关闭、再次打开的预期与对应路径；再次打开应回到初始状态 | 再次打开在文档站 live 里怎么做到；live 有重新打开按钮，但真实游戏里没有这个按钮，我需要知道关闭后从哪里再打开 | 我预期从原入口再 open；关闭后入口是否还在（工具栏是否被遮住）文档没有说 |
| 25 `inventory-example-6-animation-and-register.md` | 「边界与注意」 | 动画卸载必须停、动画节点不进子组件 props 链、拆分后逐层传 props、注册不写名字表、性能先测再改 | 最终 live 如果跑不起来、保留代码与说明是什么意思；作为读者我遇到 live 不跑时，不知道是我的环境问题还是文档问题，也不知道该检查哪些依赖 | 我预期按清单能自查；但 live 失败时没有排查步骤，我只能停在这里 |

## D-93 复述检查

### 渲染树

我现在的理解是：

- 一棵固定的树：画布根、UI 容器（控制器创建）、面板根容器（作者写）、区域容器、元素；后两层由作者控制。`container-and-coordinates.md` 说这张图是全站渲染树的权威。
- 组件不是节点：组件执行 setup 返回 render，render 返回 VNode，渲染器把 VNode 变成元素挂到父元素下；组件树与元素树是两层，组件边界不可见。若组件返回多个根，它们会成为同一父级的多个子元素。
- 容器有三个职责：局部坐标系（子元素 x、y 相对父容器）、事件捕获单位、排序与缓存边界。子元素按兄弟 zIndex 排序绘制。
- 坐标是绝对坐标，没有 DOM 布局流；hidden 不会让兄弟上移。容器不裁剪绘制，但命中受父容器矩形限制（0×0 容器看得见点不到）。
- hidden 保留实例与状态、跳过绘制与命中；三元或 key 变化会销毁重建。容器默认缓存，text、image、全部图形默认不缓存。
- UI 栈里每个打开实例是 UI 容器下的兄弟，第 i 层 zIndex 为 i 乘 5；背景在 zIndex 0。

我复述时仍不确定的：组件直接返回数组作为根是否被支持（第 11 篇与第 23 篇的读法不同）；多个根时 attrs 落到哪；UI 容器的尺寸由谁定、mainUIController.render 返回什么。

### 事件捕获与冒泡

我现在的理解是：

- 命中：从画布根开始，每一层按子元素 zIndex 从大到小找第一个命中的；同值后加入的先；容器按矩形、图形按几何轮廓；命中就停，不检查同级其它元素。hidden 不绘制也不命中；noevent 仍绘制但整个子树不参与命中。
- 捕获：根到命中元素，父容器先收到 onXxxCapture。冒泡：命中元素到根，子元素先收到 onXxx。完整顺序是根捕获、各级捕获、目标捕获、目标冒泡、各级冒泡、根冒泡。
- stopPropagation 截断传播：捕获阶段调用会同时取消内层捕获与整段冒泡；冒泡阶段调用则外层不再收到。它不阻止同一元素同名监听器，也不阻止浏览器默认行为。
- onEnter 与 onLeave 不走普通冒泡：根维护 hover 集合，每次 move 后做差集，先 leave 后 enter；父容器在指针下时也在集合里，所以从父移到子不会触发 leave 或 enter。
- 事件对象：target 是当前处理事件的元素（每个元素拿到自己）；offsetX 与 offsetY 是当前元素局部坐标（变换会反算）；absoluteX 与 absoluteY 是画布坐标；type 是本次触发按键，buttons 是当前按住的所有键。
- actionStroke 只让描边命中，命中宽度等于 lineWidth。

我复述时仍不确定的：最初命中的元素怎么取（target 被改写后）；MouseType 与 buttons 的位定义是否同一套；按下与抬起落在不同元素时 click 的归属；拖动阈值。

### 组件 props、slots、attrs 与内置组件

我现在的理解是：

- props 的管线：父组件写属性，进入 VNode props，子组件 props 数组挑出键，setup 的 props 拿到；没声明的进 attrs，默认透传到根元素。props 数组漏写等于没传，组件里读到 undefined。
- props 是只读、响应式的，不要解构；默认值用空值合并；会变的派生值用 computed。UI 额外由控制器注入 controller、instance、state；open 的第二个参数是界面自己的 props。
- attrs 是未声明属性的集合，可展开给内部元素；inheritAttrs 为 false 关掉自动落根。子组件声明了 emits 里的 click 后，父组件的 onClick 被消费，必须由子组件 emit。
- slots 在 TSX 里是函数不是标签；子组件用 slots 对象调用，默认 slot 用 slots.default 可选调用，具名 slot 用对象传入；slot 内容成为子组件根元素下的普通子元素，坐标相对子组件容器。
- 内置组件是普通组件：TextContent 负责按 width 折行、测量高度、逐字显示；Textbox 在文字外加背景标题内边距；Input 在画布上覆盖真实输入框；InputBox 通过 UI 栈弹一次拿结果；List 管行布局与选中；ListPage 管左右分栏；Page 管页码；Scroll 只管视口且只对直接子元素做虚拟滚动；Selection 只画选中框；ConfirmBox 与 Choices 是一次性弹窗。
- 内置组件的共同边界：TextContent 与 Textbox 的 width 必填且覆盖 loc 第三项；Input 的绑定是 v-model:value；Scroll 的子元素必须平铺；List 的选中由点击驱动、父级初值取第一项。

我复述时仍不确定的：DefaultProps 到底包含哪些键；Texture 与 ITexture 是否同一类型；普通子组件怎么拿按键 system；slot 返回 VNode 与返回数组的差别；包装组件怎么原样转发 slots。

## 跨篇问题（仅读者困惑）

1. 第一次 open 到底写在哪：模板篇说去 bootstrap 或某个已有面板，但没有一篇给出「从零新建文件后，在哪个已有文件的哪一行调用 open」的完整片段。我读到第 20、25 篇仍然不知道宿主是谁。
2. loc 的注入：第 1 篇说只注入 controller、instance、state，第 18 篇说替换内置 UI 时组件必须接收 loc 且 loc 由打开方传。我需要一份「UI 组件到底该声明哪些 props、分别由谁传」的清单。
3. 组件根能不能是数组：第 11 篇说 map 必须放在有父容器的元素树里，第 23 篇说 ItemGrid 返回行数组直接作为 Scroll 的子元素。我不知道该按哪句写。
4. hidden 写在组件标签上：第 11 篇只示范元素，第 12、14 篇说基础属性走 attrs 落到根元素。我不确定给 ItemDetail 加 hidden 是否等价于给它的根容器加 hidden。
5. keep 的清除语义：第 17 篇一边说 close 到空栈不关背景，一边说一次 close 就清掉 keep 标记。我不知道关旧面板那一下背景会不会闪。
6. Texture 与 ITexture：第 6 篇的示例用 new Texture，素材管理器返回 ITexture，第 8 篇又建议 markRaw 纹理。我不知道从素材管理器取到的对象能不能直接给 image。
7. text.md 的居中示例：既在 loc 后两项写 0.5，又写 anchorX 和 anchorY 为 0.5，正文却说只写一种。我不知道哪个是最终写法。
8. MouseType 与 buttons：第 9 篇示例把 MouseType.Left 当位掩码和 buttons 做位与，但同一篇说 MouseType 是按键种类。我不知道 buttons 的位定义在哪里。
9. Scroll 的直接子元素跨组件边界：第 16 篇说 Scroll 只检查直接子元素，第 23 篇说组件返回的行数组会成为直接子元素。我不知道组件边界算不算一层节点。
10. 设计尺寸 480×320 与 720×480：第 2 篇说画布设计尺寸来自 renderer，第 20 篇 live 用 720×480，正文又说示例站是 480×320。我不知道自己在验证时该按哪个尺寸。
11. useKey 在普通子组件：第 10 篇说在组件 setup 里调用，示例都默认有 props.state；第 25 篇在面板里用。我不知道子组件该由父级传 system，还是也能自己拿。
12. List 的选中同步：第 16 篇说父级初值要与第一项一致，挂载后再改 selected 不会改选。我不知道列表数据整体替换时内部选中会不会重置，以及该怎么同步。
13. 内置入口函数的完整签名：第 18 篇表格只给 openSettings、openReplay、saveSave 等名字与参数轮廓，我需要完整签名和返回值语义才能安全替换。
14. image 的缓存：第 6 篇说 image 默认不缓存，第 19 篇说每个元素仍可能有自己的离屏缓存。我不知道什么时候 image 会有离屏缓存。

## 声明

未读源码：是

未修改任何文档：是

未读上一轮审阅记录：是

live 目视验证：未执行

