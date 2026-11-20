# Round 2（D-94）· 单读者

## 阅读范围

### 先读的非目标文档（按顺序）

- `docs/intermediate/`：`code-basics.md`、`combat-overview.md`、`data-plugins.md`、`data-state-overview.md`、`data-vs-render.md`、`enemy-aura.md`、`enemy-calculator.md`、`enemy-combat-script.md`、`enemy-final.md`、`enemy-map-damage.md`、`enemy-query.md`、`enemy-specials.md`、`enemy-status-hooks.md`、`events.md`、`flags.md`、`hero-attribute.md`、`hero-equipment.md`、`hero-items.md`、`hero-location.md`、`hooks.md`、`map-structure.md`、`map-tiles.md`、`replay-commands.md`、`src-tour.md`、`tile-store.md`
- `docs/advanced/index.md`
- `docs/advanced/i/`：`index.md`、`declarative-vs-imperative.md`、`plugin-system.md`、`saveable-content.md`、`replay-consistency.md`、`data-stores.md`、`hooks-in-depth.md`、`mover.md`、`face-handler.md`
- `docs/advanced/ii/`：`index.md`、`custom-range.md`、`static-vs-dynamic-tiles.md`、`point-and-tile-events.md`、`equipment-system.md`、`custom-replay-command.md`、`pathfinding.md`、`adding-hero-attribute.md`、`adding-enemy-attribute.md`、`enemy-context-and-combat.md`（均排除 `ui/`）
- `docs/advanced/iii/`：`index.md`、`core-state.md`、`plugin-internals.md`、`event-system.md`、`passability-and-pathfinding.md`、`replay-internals.md`、`loading-system.md`
- 其它：`docs/poc/render-demo.md`

### 后读的 25 篇目标文档（按顺序）

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
| 1 UI 通用模板 | 「一个最小 UI」「打开与关闭」「边界与注意」 | 一个 UI 由 Props 类型、props 列表、组件、`GameUI` 四部分组成；面板根 `container` 的 `[0,0]` 相对 UI 容器；`controller`、`instance`、`state` 必须写进 props 列表；打开时传 `GameUI` 对象而不是名字。 | 我第一次把模板放进 `src/client/ui/my-panel.tsx` 后，应该从哪里打开它？文档给了 `sceneController`、`mainUIController`、`props.controller` 三个入口，但独立文件里没有 `props`；`bootstrap.ts` 里的 `client` 又只存在于启动文件。我缺一个「此刻我人在哪里、该用哪个入口」的判断。 | 我会先在 `src/client/ui` 建文件并在 `index.ts` 导出；打开时可能选错控制器，看到面板开在场景层而不是主 UI 栈，或者因为拿不到 `props` 而无法打开。 |
| 2 容器与坐标 | 「渲染树」「坐标与变换」「loc 与锚点」「边界与注意」 | 画布根 → UI 容器（控制器创建）→ 面板根（作者写）→ 元素；子元素坐标相对父容器；锚点决定元素哪个点落在 `x/y`；`zIndex` 只在同一父级比较；容器不裁剪绘制，但命中受父容器矩形限制。 | 面板根写 `[0,0,480,320]` 时，它相对 UI 容器；但 UI 容器本身在哪里、多大、是否等于画布根、是否铺满，我在文档里没有拿到。没有这个尺寸，我无法判断面板会不会被画布裁掉，也无法自己算居中。 | 面板会出现在左上角一块；如果画布比 480×320 小，超出部分看不见；如果画布更大，它也不会自动居中。 |
| 3 基础图形 | 「填充、描边与命中」的组合表；「边界与注意」 | `g-rect`、`g-circle`、`g-ellipse`、`g-line` 的几何参数；`fill` / `stroke` / `strokeAndFill` 是模式开关，颜色在 `fillStyle` / `strokeStyle`；图形按几何轮廓命中；`actionStroke` 的命中宽度跟 `lineWidth`。 | 表里同时写 `fill={false}`、`stroke={false}` 时结果仍是「填充」；我想让矩形“完全不画但保留一个可点热区”或“完全不可见且不挡事件”时，不确定该用 `alpha={0}`、`noevent` 还是别的组合。 | 我会先画出填充矩形；想关闭填充时按表写 `fill={false}` 可能仍然看到填充，只能改用透明色或额外包一层。 |
| 4 曲线与路径 | 「路径与曲线的坐标基准」「路径在渲染树与命中中的位置」「圆角矩形」 | 贝塞尔没有 `loc`，点坐标相对父容器；`g-path` 的 `Path2D` 是元素局部坐标；元素自动取包围盒；路径按几何轮廓命中；`Path2D` 不能序列化进存档。 | 如果曲线/路径要随数据变化（例如选中项改变形状），应该在什么时机重建 `Path2D`？文档只说“不要在渲染函数里每次新建”，但没有给“数据变了以后怎么更新一个已有路径”的写法。旋转/缩放时，曲线围绕哪个点变换，也没有和锚点一起说明。 | 静态曲线能画出来；动态路径我可能每次渲染都重建，或者建了一次却永远不更新；旋转时的视觉中心也可能和我想的不一样。 |
| 5 文字 | 「尺寸与居中」「loc 与锚点」「边界与注意」 | `text` 只画一行，宽高由字体测量决定；`fillStyle` 默认白色；`Font` 构造参数顺序是 family/size/unit/weight；`anchorX={1}` 可右对齐数值；文字默认不缓存。 | 「尺寸与居中」的示例在 `loc` 里写了后两项 `0.5, 0.5`，又同时写了 `anchorX={0.5}` / `anchorY={0.5}`；正文说两种写法只写一种。我照抄时该删哪一处？另外，`width/height` 不会裁剪文字，我要固定占位、避免文字压住下面元素时，应该包一层什么尺寸的容器？ | 我能让文字居中/右对齐；但复制示例可能依赖属性处理顺序，结果不稳定；固定占位时可能要反复试外层容器尺寸。 |
| 6 图片与最小纹理 | 「纹理从哪里来」「从素材管理器取纹理」「像素图与高清缓存」 | `image` 把纹理铺满自己的 `loc`；`Texture` 接受 canvas / ImageBitmap / Image；素材管理器 `getImageByAlias` / `getImage` 返回 `ITexture \| null`；像素图用 `noanti`；`hd` 只对开了缓存的元素生效。 | 示例里 `createCheckerTexture` 返回 `Texture`，素材管理器返回的是 `ITexture`；`<image image={...}>` 到底接受哪一个，两者是不是同一个类型？纹理“按自身生命周期处理”具体要调用什么；`ImageBitmap` 需不需要主动 `close()`，文档没有给。 | 我能画自己用 canvas 生成的纹理；从素材管理器取图时如果类型对不上，我不知道该不该转换；卸载后纹理是否释放也不确定。 |
| 7 层级、变换与性能 | 「变换」「缓存与脏更新」「边界与注意」 | `scale` 是 `[x,y]` 数组，`rotate` 用弧度，`alpha` 是 0–1；`zIndex` 同父级比较；`hidden` 保留状态，三元销毁；`container` 默认缓存，`nocache` 优先；`custom` 自绘改外部数据要手动触发更新。 | 我想让整个 720×480 面板适配不同画布尺寸时，应该改面板根的 `loc` 与内部布局，还是给根容器加 `scale`？文档只说不要用子元素 `scale` 去抵消父级，但没有给“整体缩放面板”的推荐做法。`custom` 自绘“主动触发一次更新”的 API 名字也没有出现。 | 我能做单个元素的缩放/旋转；整块面板适配时可能算错坐标或把命中一起缩掉；`custom` 改了外部数据后可能不重绘。 |
| 8 响应式 | 「ref」「什么时候会重渲染」「shallowRef 与 markRaw」「nextTick」 | TSX 里 `ref` 要写 `.value`；`reactive` 不能整体替换、解构会丢响应式；`computed` 惰性且缓存；`watch` 用于副作用；`nextTick` 只保证这一轮更新处理完，不保证画布已经绘制。 | 我想等“浏览器真正画完这一帧”再做后续动作时，文档说“再配合一帧的回调”，但没有给具体 API 或写法。用 `shallowRef` 装一个大数组时，每次都要替换 `.value`；那列表项的 `key`、`Scroll` 的滚动位置和子组件内部状态还能不能保持？ | 计数器能正常更新；需要等画面时可能只等到 `nextTick` 而不是绘制完成；大列表优化后可能因为整体替换导致列表状态重置。 |
| 9 事件与交互 | 「事件对象」「stopPropagation」「enter 与 leave」「命中测试」 | 命中从根开始、`zIndex` 大优先、同值后加入的优先；捕获父 → 子，冒泡子 → 父；`stopPropagation` 不阻止同一元素同事件的其它监听器；`onEnter/onLeave` 由 hover 集合做差集；`offsetX/Y` 是元素局部，`absoluteX/Y` 是画布坐标。 | 我在父容器的冒泡回调里想知道“最初点中的是哪个子元素”，但文档说每个元素拿到的事件对象里 `target` 都是它自己，不是最初命中的元素。那我该读哪个字段才能拿到最初目标？另外，`MouseType.Left` 的数值是多少，`(ev.buttons & MouseType.Left) !== 0` 这种写法我无法从文档确认左键位是否成立。 | 点击换色、日志顺序能按文档跑；但“谁是最初目标”和左键判断我可能会写错，只能靠打印事件对象试。 |
| 10 按键与快捷键 | 「注册新指令与分组」「优先级与阻断」「默认按键」「按键与 UI 栈」 | `useKey` 必须在 setup 同步调用；`implement` 把指令接到回调；`addCommand` 注册默认键；`HotkeyEmitMode` 有 KeyUp/Once/Continuous；`priority`/`block` 只对抬起触发有效；只有栈顶作用域的实现会执行。 | 默认按键表里 `@common/exit` 和 `@ui/menu` 都默认 Escape。我按 Esc 时，同一次按键会匹配到两条指令；文档说 `priority` 与 `block` 比较的是同一次按键匹配到的多条指令，但没说这两条默认指令各自的优先级。我缺一个“按 Esc 到底关面板还是开菜单”的判断。 | 我在面板里 `implement('@common/exit', close)`，按 Esc 可能关闭面板，也可能同时触发菜单；如果两条都执行，我会看到面板关了又弹出菜单。 |
| 11 条件渲染与循环渲染 | 「hidden 与三元」「key」「数据怎么变才会更新列表」「列表项的事件与状态」 | `hidden` 保留实例/状态/监听，三元销毁并重置；`.map()` 生成元素数组；`key` 只在同一父级兄弟间唯一；`ref` 数组 `push/splice` 会触发，`shallowRef` 必须整体替换；列表项回调用闭包拿当前项。 | 列表项是组件时 `key` 写在组件标签上；但 `ItemGrid` 这种组件返回“行数组”时，行容器的 `key` 和格子的 `key` 分别写在哪一层？另外，用 `hidden` 保留面板时，里面的 `Input` 真实输入框和按键作用域是否仍然活跃（文档在按键篇说 `hidden` 不离开作用域，这一篇没提）？ | 普通列表能增删/高亮；组件数组的 `key` 可能放错层；隐藏面板里可能仍然占着 Esc，输入框也可能没有失焦。 |
| 12 props | 「props 的完整管线」「默认值」「props 是响应式的」「UI 的基础 props」 | `props` 数组是运行时白名单，没声明的进 `attrs`；默认值用 `props.x ?? 默认`；`props` 是响应式的，不要解构；`computed` 里的默认值会跟着更新；UI 的 `controller/instance/state` 由控制器注入。 | 我把 `items.value` 作为 `items` prop 传给 `ItemGrid`，子组件拿到的是数组；父级改 `item.count -= 1` 时，子组件读 `props.item.count` 会自动更新吗？文档说 props 是响应式的，但没有明确“通过 prop 传下去的对象内部字段”是否仍被追踪。 | 简单值（`size`、`selected`）会更新；嵌套对象的 `count` 可能只在父级重新渲染时更新，详情/格子可能出现不同步。 |
| 13 组件（TSX） | 「组件如何映射成一棵子树」「一个完整组件的结构」「生命周期」「组件与 UI 的区别」 | 组件本身不产生节点，根元素才是父树里的挂载点；多个根节点会成为同一父级的多个子元素；`setup` 返回 render 函数；`onMounted/onUnmounted` 必须在 setup 同步调用；`expose` 只暴露必要方法；UI 要同时满足三个条件。 | 组件返回数组（如 `ItemGrid` 的行数组）时，父级传的未声明属性（`loc`、`onClick`）会落到哪？文档说多根节点应设 `inheritAttrs: false` 并手动决定落点，但 `ItemGrid` 这种“没有单一根元素”的组件，外层定位应该由谁接收？ | 单根组件能正常挂载；数组根组件如果父级传 `loc`，可能没有唯一根元素可落，属性会丢或落到第一个节点。 |
| 14 slots 与 attrs | 「具名 slot」「slot 在渲染树里的位置」「attrs」「inheritAttrs」 | TSX 里 slot 是函数，要写 `slots.title?.()`；具名 slot 用对象传入，默认 slot 也写在对象里；slot 内容在父作用域求值，插入子组件根下；未声明属性进 `attrs`；声明了 `emits` 的 `onClick` 不再透传。 | slot 内容最终坐标相对子组件容器；但子组件根容器的尺寸/位置如何影响 slot 内容的布局？另外，`Field` 把 `attrs` 展开到内部 `<text>` 时，父级传的 `onClick` 会绑到 `text`；如果 `Field` 自己也想处理点击，两个 `onClick` 会不会叠加/如何区分？ | 面板标题/内容能插入；slot 内容的位置可能受子组件根容器影响；事件归属可能变成内部 `text` 而不是 `Field`。 |
| 15 内置组件：文本与输入 | 「这些组件替你决定了什么」「Textbox」「Input 的受控边界」「InputBox」 | `TextContent` 的 `width` 必填，`loc` 第三项会被覆盖；`autoHeight` 跟内容；`Textbox` 有标题/背景/内边距；`Input` 用 `v-model:value`，失焦只移除真实输入框不移除值；`getInput` 取消返回空串，`getInputNumber` 返回 `NaN`。 | `Textbox` 的宽高到底来自 `width/height` 还是 `loc` 第三、四项？文档一处说“来自 width / height 或 loc 的第三、四项”，另一处示例又同时写 `width` 与 `loc` 宽高；我不知道只写 `loc`、不写 `width` 时正文会不会没有排版宽度。`hidden` 容器里的 `TextContent` 是否仍然测量/触发 `updateHeight`，也没有说明。 | 我能让长文折行、输入框受控；`Textbox` 尺寸可能不按我给的 `loc` 生效；隐藏的文本可能仍在后台测量。 |
| 16 内置组件：列表与容器 | 「List」「Scroll」「ListPage」「Page」「弹窗与一次性提示」 | `List` 内部有自己的选中值，初始取第一项；点击行会发 `update:selected`；`ListPage` 左列表右详情；`Page` 页码从 0 开始；`Scroll` 只对直接子元素做虚拟滚动；`ConfirmBox/Choices/InputBox` 是一次性弹窗。 | 我想在打开面板时程序化选中 `List` 的某一项（初始 `selectedId` 不是第一项），该用哪个接口？文档说挂载后改 `selected` 不会让列表改选，只能“让用户点击，或改用能驱动列表的交互”，但没有给具体写法。 | 我能让用户点击选中；如果初始选中不是第一项，左侧高亮和右侧详情会不一致，且我不知道怎么用代码修正。 |
| 17 UIController 与 UI 栈 | 「控制器、实例与栈」「背景」「栈策略」「事件归属与生命周期」 | `open` 返回实例，`close` 卸载，`hide/show` 只改可见性；`alwaysShow` 不被 `hide` 隐藏；`keep` 防止切换时背景闪；`lastOnly`/`showAll` 决定栈策略；`zIndex` 是 `i*5`；`active`、`showBack` 是引用值。 | `mainUIController.render()` 要放进主场景的哪个容器、那个容器在画布上的 `loc` 和尺寸是多少？文档说主 UI 不会自己找画布位置、面板位置由 `open` 参数决定，但我只看到 `InventoryPanel` 的 720×480 根容器，不知道它相对谁定位、会不会被主场景容器裁掉。 | 我能打开/关闭面板；但面板可能出现在主场景容器的左上角，尺寸/位置与画布不匹配，`hide` 后按键作用域还会保留。 |
| 18 修改 / 替换内置 UI | 「替换步骤」第二步、「风险与边界」 | 替换点是打开处或包装层；`openSettings` 是工具栏/快捷键/插件共用的入口；`loc` 由调用方在 `vBind` 里传；`@common/exit` 已注册，直接 `implement` 覆盖；存档界面返回值语义必须保留。 | 第 1 篇说 UI 的 Props 必须同时继承 `IGameUIPropsBase` 与 `DefaultProps`；这一篇的最小示例只继承 `IGameUIPropsBase`，并说 `DefaultProps` 只是类型提示、不是运行要求。我照哪一份写才能既通过类型检查，又让 `loc`、`hidden`、`zIndex` 正常？另外，我只读文档、不能看源码，无法搜索当前项目里所有 `openSettings` 调用方，缺一个入口清单。 | 我能替换设置面板；但 Props 基类可能少写；只改工具栏调用点时，快捷键/插件入口仍打开旧设置。 |
| 19 UI 系统性能与注意事项 | 「显示开关」「UI 栈」「缓存」「症状与排查」 | 缓存适合结构复杂、内容稳定的子树；`hidden` 保留元素/状态/监听/按键作用域，三元卸载；大量列表用 `Scroll` 平铺；装饰层加 `noevent`；性能要先测再改。 | 背包这种“关闭面板”动作，应该用 `close` 卸载，还是用 `hide` 保留？第 17 篇说“能 `hide/show` 就不重建”，这一篇说“长期不用、体积又大的子树用卸载”，我缺一个按“关闭背包”这个具体动作的选型。 | 我能按症状排查；关闭背包时可能为了保留滚动位置用 `hide`，但按键作用域和内存都还在；用 `close` 又可能每次重新创建。 |
| 20 示例（一）目标与骨架 | 「骨架在渲染树里的位置」「打开它」「边界与注意」 | 最终面板 720×480；根 `container` 下有背景、面板主体、标题、关闭按钮、左右占位；关闭归 `InventoryPanel`；状态归面板；`InventoryUI` 用 `GameUI` 注册；三个打开入口。 | 示例站画布是 480×320，720×480 面板会超出；文档说“先按画布尺寸调面板根，或整体缩放”，但没有说缩放由谁做、怎么居中、打开时 `loc` 传什么。我第一次验证应该用 `sceneController` 还是 `mainUIController`，也没有针对骨架的明确建议。 | 照抄 720×480 根容器后，在 480×320 画布里只能看到左上角一部分；我会不知道应该改根 `loc`、改内部布局，还是加 `scale`。 |
| 21 示例（二）道具网格 | 「ItemCell」「ItemGrid」「数据如何进入网格」「边界与注意」 | `Item` 只在 `item-grid.tsx` 定义一次；5 列、`cellSize=66`、`gap=8`；`ItemCell` 只接收 `item/selected/size`；`ItemGrid` 用 `computed` 算列数/尺寸；点击三层上报；`key=item.id`。 | `ItemCell` 的 `size` 是在 setup 里读一次 `props.size ?? 66`；文档说尺寸在面板生命周期内不变，若变化再改 `computed`。但我如果做窗口适配、列数或格子尺寸变化，`ItemCell` 不会跟着变。我缺一个“尺寸变化时哪些 props 要改成 computed/render 读取”的清单。 | 10 件道具能排出网格；缩放或改 `cellSize` 后，格子容器尺寸可能变了而 `ItemCell` 内部仍按旧尺寸画。 |
| 22 示例（三）详情区 | 「详情区的树结构」「ItemDetail」「空态与边界」 | `selectedId` 用 `ref<string \| null>(null)`；`selectedItem` 用 `computed` + `?? null`；提示和详情两块都用 `hidden` 切换；`TextContent width=164`、`autoHeight`；`clear` 只上报，父级写回 `null`。 | `ItemDetail` 里的提示容器和详情容器都没有写 `loc` 尺寸，只有子元素定位；它们默认 200×200，而详情区宽 196。文档没有解释这两个内部容器是否需要尺寸、默认尺寸会不会影响命中或布局。隐藏的 `TextContent` 是否仍然测量、会不会触发 `updateHeight`，也没有说明。 | 选中/取消能切换；内部容器的命中范围可能比详情区宽；隐藏文本可能仍然参与测量，长描述可能撑出高度。 |
| 23 示例（四）滚动与列表 | 「Scroll 在渲染树里的位置」「数据与选中态如何穿过滚动层」「滚动与事件」 | `Scroll` 只对直接子元素做虚拟滚动；`ItemGrid` 的根从单个 `container` 改成行数组，行成为 `Scroll` 的直接子元素；行 `key=row`，格子 `key=item.id`；`scrollTo` 收内容像素；`getScrollLength` 是内容总长减视口；`padEnd` 是像素。 | `Scroll` 判断“直接子元素”时，看的是渲染后的元素，还是它自己的 VNode children？`<ItemGrid>` 是一个组件 VNode，虽然文档说组件不产生节点，但我无法确认 `Scroll` 会不会只看到一个组件 VNode 而无法按行虚拟化。如果 `ItemGrid` 里再包一个根容器就会失效，那“组件返回数组”是唯一可行写法吗？ | 40 件道具能滚动；如果 `Scroll` 读到的是组件 VNode 而不是行元素，虚拟滚动可能退化成整块；滚动条和行隐藏可能不工作。 |
| 24 示例（五）交互与状态 | 「状态放在 InventoryPanel」「状态变化如何反映到画面」「已装备的格子」「遮罩与 noevent」 | 面板持有 `items/selectedId/equippedId/hint`；`canEquip/canUse/isEquipped` 都是 `computed`；`use` 直接改 `item.count`；`watch` 只更新提示；`ActionBar` 只发 `equip/use/close`；`equipped` 是“当前选中是否已装备”；遮罩用 `noevent`。 | `use` 改的是 `selectedItem.value.count`，而 `ItemGrid` 收到的是 `items.value`、`ItemCell`/`ItemDetail` 收到的是 `item` 对象。文档说 `ref` 数组内部是深层响应式，但没有明确“通过 prop 传下去的对象内部字段”是否都被追踪。我担心详情和格子不会同时刷新。 | 使用后数量减一、按钮变淡；如果对象内部字段没有被追踪，可能出现提示更新了但格子数量没变，或者详情不刷新。 |
| 25 示例（六）动画、拆分与注册 | 「动画作用在树的哪一层」「最终组装与契约核对」「注册与打开」 | 动画只改 `pulse`/`hintAlpha` 两个响应式值，`onUnmounted` 里 `cancelAnimationFrame`；最终拆成五个文件；`InventoryUI` 在 `inventory-panel.tsx` 导出，`index.ts` 再导出；从 `mainUIController` 打开；验证清单覆盖选中/滚动/装备/使用/关闭/再次打开。 | 最终骨架里有两层同尺寸的 `container [0,0,720,480]`：外层放背景/遮罩，内层放面板内容。文档说“外层是画布根、里层是面板根”，但 `InventoryPanel` 组件返回的最外层应该就是面板根；我不确定哪一层接收 `hidden`/`zIndex` attrs，哪一层是 UI 实例的根。照抄多套一层会不会让坐标或栈出错？ | 动画和面板能跑；但根层级可能多一层，`hidden`/`zIndex` 可能落到错误的容器，关闭/再次打开时状态和坐标可能不对。 |

## D-93 复述检查

- **渲染树**：画布根下是控制器创建的 UI 容器，再往下是作者写的面板根容器，面板根下才是各个元素。组件本身不产生节点，组件的根元素才是父树里的挂载点；返回多个根就是同一父级下多个子元素。容器决定子元素的局部坐标系、同父级兄弟的 `zIndex` 排序与缓存边界；容器不裁剪绘制，但命中受父容器矩形限制。`hidden` 保留元素与状态，只跳过绘制和命中；`noevent` 仍绘制但整棵子树跳过命中。
- **事件捕获/冒泡**：指针落下后从根开始按 `zIndex` 从大到小命中，同值取后加入的；图形按几何轮廓命中。命中后先捕获（根 → 命中元素），再冒泡（命中元素 → 根）。`stopPropagation` 在任一阶段截断传播，但不阻止同一元素同事件的其它监听器。`onEnter/onLeave` 不走普通冒泡，由根维护的 hover 集合做差集触发。`offsetX/Y` 是当前元素局部坐标，`absoluteX/Y` 是画布坐标。
- **组件 props/slots/attrs**：父组件写的属性先进入子组件 VNode props；只有子组件 `props` 数组里列出的键才进入 `setup(props)`，没列出的进入 `attrs`。`attrs` 默认透传到根元素，`inheritAttrs: false` 可关闭自动透传后再手动 `{...attrs}`。slot 在 TSX 里是函数，子组件用 `slots.default?.()` / `slots.title?.()` 调用；具名 slot 用对象传入，作用域 slot 由子组件把数据作为函数参数传给父组件的 slot 函数。UI 的 `controller/instance/state` 由控制器注入，必须写进 props 数组。
- **内置组件**：`TextContent` 负责按 `width` 折行、测量、打字机与 `showAll/retype/getHeight`；`Textbox` 在文本外加背景/标题/内边距/图标；`Input` 用真实 DOM 输入框覆盖画布，`v-model:value` 受控，失焦只移除输入框不移除值；`InputBox/getInput/getInputNumber` 是一次性弹窗，取消时 `getInput` 返回空串、`getInputNumber` 返回 `NaN`；`List` 管行布局、点击选中、选中光标与滚动，内部选中初值取第一项；`ListPage` 是左列表右详情；`Page` 管页码与箭头，索引从 0 开始；`Scroll` 只对直接子元素做虚拟滚动；`Selection` 只画选中框不接事件；`ConfirmBox/Choices` 通过 `getConfirm/getChoice` 返回结果，`getChoice` 没有内建取消分支。

## 跨篇问题（仅读者困惑）

1. **UI 的 Props 基类到底要不要 `DefaultProps`**：第 1 篇说 UI 必须同时继承 `IGameUIPropsBase` 与 `DefaultProps`；第 18 篇的最小示例只继承 `IGameUIPropsBase`，并说 `DefaultProps` 只是类型提示。我作为第一次写 UI 的人，不知道照哪一份写才不会让 `loc`、`hidden`、`zIndex` 的类型或 attrs 落点出问题。
2. **720×480 面板与 480×320 画布**：骨架篇和最终篇都按 720×480 写坐标，示例站画布是 480×320；文档说“先按画布调根或整体缩放”，但没有说缩放由控制器、面板根还是打开处负责，也没有给主 UI 容器的 `loc`。我无法判断面板是会被裁、被居中，还是应该自己算。
3. **关闭背包用 `close` 还是 `hide`**：UI 栈篇说能 `hide/show` 就不重建，性能篇说长期不用的大子树应卸载；按键篇说 `hidden` 不离开按键作用域，输入篇说 `hide` 不会让输入框失焦。我不知道“关闭背包”这个动作应该选哪一种，以及选完后滚动位置、按键、输入框分别是什么状态。
4. **`Scroll` 与“组件返回行数组”**：示例（四）依赖“组件本身不是节点、返回的行会成为 `Scroll` 直接子元素”。但我只读文档，无法确认 `Scroll` 是按渲染后的元素子节点还是按 VNode children 判断“直接子元素”；如果按后者，`<ItemGrid>` 这个组件标签会不会让它只看到一个组件 VNode。
5. **`Textbox` 的尺寸来源**：文本与输入篇一处说 `Textbox` 的宽高来自 `width/height` 或 `loc` 第三、四项，示例又同时写 `width` 与 `loc` 宽高；`TextContent` 则是 `width` 必填、`loc` 第三项被覆盖。我不确定只写 `loc` 时 `Textbox` 正文有没有排版宽度。
6. **`props` 传对象后内部字段的响应式**：props 篇说 props 是响应式的，响应式篇说 `ref` 数组内部是深层响应式；示例（五）又通过 `items.value` 把数组传给 `ItemGrid`，再逐项传给 `ItemCell`。我不确定在父级直接改 `item.count` 时，所有读过 `props.item.count` 的子组件是否都会更新，还是只有父级重新渲染时才更新。
7. **默认按键的重叠**：按键篇的默认按键表里 `@common/exit` 和 `@ui/menu` 都是 Escape；`priority`/`block` 只对抬起触发有效，但没有给这两条默认指令的优先级。我不知道按 Esc 时是只关面板、只开菜单，还是两条都执行。
8. **事件的最初目标**：事件篇说每个元素拿到的事件对象里 `target` 都是它自己，不是最初命中的元素；那父容器冒泡时想判断“最初点中的是哪个子元素”该读什么？文档没有给这个字段或替代做法。

## 声明

未读源码：是

未修改任何文档：是

未读上一轮审阅记录：是

live 目视验证：未执行
