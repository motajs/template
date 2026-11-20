# 09 期静态可运行性审计

## 结论

先回答能否运行：不能。当前快照**不能**在浏览器完成启动，也**不能**进入可玩状态。问题不是某一层还差功能，而是入口模块图存在多处相对导入断链、ClientCore 构造期存在字段未初始化崩溃、顶层 load 从未被调用，且 UI 仍依赖运行时未赋值的全局 main 与 core。

- 最小阻断集：P0-1、P0-2、P0-3、P0-4、P0-5、P0-6。
- P0 数量：6
- P1 数量：7
- 判断依据：静态导入解析、构造调用顺序、入口调用图与一次时间点类型检查；未运行游戏、浏览器、dev 服务器或测试。

## P0 阻断

- **P0-1 client-modules 渲染层相对导入断链**：renderer.ts 从 ../shared 导入 MAIN_WIDTH 等常量，但 client-modules/src 下没有 shared.ts 或 shared/。证据：`packages-user/client-modules/src/render/renderer.ts:9`。影响：bootstrap 导入 @user/client-modules 时，index→render→renderer 的导出链在解析阶段失败，模块图无法建立。
- **P0-2 client-base 两处相对导入断链**：elements/index.ts 从 ../renderer 导入 mainRenderer 与 tagManager，但 client-base/src/renderer.ts 不存在；floorSelect.tsx 从 ../../shared 导入常量，实际共享文件是 client-base/src/shared.ts。证据：`packages-user/client-base/src/elements/index.ts:4`、`packages-user/client-base/src/components/floorSelect.tsx:11`。影响：@user/client-base 被入口链依赖，任一断链都会让启动链在解析阶段失败。
- **P0-3 基类构造期调用派生类 awake，派生字段尚未初始化**：CoreState 构造器末尾执行 this.awake()，ClientCore.awake 随即读取 this.orderedClientPlugins，而该字段在 super 之后才赋值；tsconfig 开启 useDefineForClassFields，派生字段在 super 期间不存在。证据：`packages-user/data-state/src/core.ts:155`、`packages-user/client-modules/src/client.ts:150`。影响：new ClientCore 在 super 内抛 TypeError，整局无法完成实例化。
- **P0-4 顶层 load 从未被调用**：bootstrap 只打开 LoadSceneUI，LoadScene 直接迭代 loader.start()；CoreState.load() 负责的 initialize 与 afterLoad 没有任何调用点。证据：`src/bootstrap.ts:16`、`src/client/ui/load.tsx:74`。影响：插件 initialize/afterLoad 不执行，勇士创建与存档初始化不会发生，跨层 wiring 断开。
- **P0-5 UI 依赖运行时未赋值的全局 main 与 core**：core.d.ts 只做类型声明，运行期仅 bootstrap 赋值 window.mainClient。证据：`src/client/ui/title.tsx:131`、`src/client/ui/main.tsx:64`。影响：加载完成进入标题或主场景时立即访问 main.levelChoose 与 core.status，抛 ReferenceError。
- **P0-6 save.tsx 导入不存在的命名导出**：save.tsx 从 client-modules 导入 getSave 与 SaveData，但该包导出面没有这两个名字。证据：`src/client/ui/save.tsx:23`。影响：title.tsx 静态导入 ./save，加载场景时浏览器 ESM 链接阶段报缺少导出。

## P1 集成缺口

- **P1-1 客户端内容钩子未注册**：RenderLoaderHooks 负责注册 texture/audio/animation/font 清单，但没有任何 addHook 调用它。证据：`packages-user/client-modules/src/loader/hook.ts:5`。影响：即使启动成功，客户端素材清单也不会被加载。
- **P1-2 自定义元素注册未调用**：client-modules 导出 create()，其内部 createRender() 调用 createElements() 注册 icon/winskin/map-render 标签，但 src 下没有 create() 调用点。证据：`packages-user/client-modules/src/index.ts:3`。影响：主场景使用 map-render 等标签时会因未注册而失败。
- **P1-3 数据内容只下载不落地**：map-list/enemy/item/tile 配置被注册为额外配置，但没有消费者把它们转换为地图、怪物、道具、图块数据，后续钩子仍是空壳。证据：`src/data/loader/hook.ts:16`、`src/data/hook/loader.ts:10`。影响：即使启动成功，样例地图与数据不会进入数据层。
- **P1-4 渲染扩展导入不存在的 state 导出**：hero 扩展从 @user/data-state 导入 state 单例，但该包没有此导出。证据：`packages-user/client-base/src/map/extension/hero.ts:20`。影响：地图勇士扩展无法建立。
- **P1-5 循环引用检查脚本指向不存在的入口**：check:circular 使用 madge --circular src/main.ts，但仓库只有 src/bootstrap.ts。证据：`package.json:31`。影响：构建与检查链中的该脚本必然失败，但不影响 dev 启动本身。
- **P1-6 元素缓存与图标依赖旧全局 Mota**：createCache 与图标设置调用 Mota.require，运行期没有 Mota。证据：`packages-user/client-base/src/elements/cache.ts:491`、`packages-user/client-base/src/elements/misc.ts:89`。影响：元素注册接通后会在缓存或图标设置时抛 ReferenceError。
- **P1-7 客户端内容资源缺失或清单不一致**：client.jsonc 声明的 titleImage/heroImage/titleBGM 在 src/content 下不存在；animation 清单列出 test 但无资源；font 清单列出 testFont.ttf 但无字体；主场景文本框使用 winskin.png，贴图目录也没有该文件。证据：`src/content/client.jsonc:4`、`src/content/animation/.list.jsonc:3`、`src/client/ui/main.tsx:47`。影响：内容钩子接通后会出现 404 或空素材。

## 预期中（不计为新缺陷）

- 用户正在并发编辑 UI 与 setting 接口，settings.tsx、shop.tsx、main.tsx、scroll.tsx、status.ts、factories.ts 的类型错误属于接口未适配，按预期中处理，不作为新增阻断。
- 测试夹具与新接口不一致导致的类型错误（enemy/hero/map 的 required 字段变化）属于测试未同步，不计为新缺陷。
- map/renderer.ts 的 getLayerByAlias 缺失属于 data-base 与 client-base 接口未对齐，且该文件正在并发修改，按预期中处理。
- 浏览器对个别 ESNext 内置方法的具体支持程度无法在本环境静态确认，未据此判定阻断。

## 最小可运行路径

1. 修复 P0-1：把 client-modules/src/render/renderer.ts 的 ../shared 改为实际存在的模块（如 @user/client-base 的 shared 或新建 shared.ts）。
2. 修复 P0-2：把 client-base/src/elements/index.ts 的 ../renderer 改为实际渲染器入口；把 components/floorSelect.tsx 的 ../../shared 改为 ../shared。
3. 修复 P0-3：不要在 CoreState 构造器里调用可被派生类覆写的 awake；把 ClientCore 的插件唤醒移到构造器字段就绪之后，或改为显式初始化方法。
4. 接入 P0-4：让入口在合适时机调用 client.load()（或至少调用 state.initialize/afterLoad），而不是只在 LoadScene 里调用 loader.start()。
5. 修复 P0-5 与 P0-6：移除 title/main/toolbar/settings 对 main、core、state 全局的依赖，改用 props.state；补齐或删除 save.tsx 对 getSave/SaveData 的导入。
6. 接入 P1-1 与 P1-2：注册 RenderLoaderHooks，并在启动时调用一次 createElements()。
7. 补齐 P1-3：实现 map-list/enemy/item/tile 的转换钩子，把配置写入对应 store。
8. 处理 P1-4 至 P1-7：修正 hero 扩展的 state 导入、check:circular 入口、Mota 依赖与缺失素材，再进行真实浏览器验证。

## 覆盖清单

- 入口与导入：index.html 到 bootstrap 到 client/data entry 的主链存在，但存在 P0-1、P0-2、P0-6 三处断链。
- core/main 残留：core.d.ts 仍声明 main、core、flags、hero、Mota；UI 仍在使用，运行期未赋值，见 P0-5、P1-6。
- 内容加载：core/client 配置路径存在且可解析；数据配置只下载不落地，客户端素材清单未接入且缺资源，见 P1-1、P1-3、P1-7。
- 渲染/UI：LoadScene、Title、MainScene 的打开链存在；被 P0-1、P0-2、P0-5 截断，自定义元素未注册，见 P1-2。
- 事件：createEventRegistrations 已注入，GameEventSystem 构造已接，静态类型通过；未运行验证。
- 战斗：initializeEnemy、战斗钩子与数据系统已接，静态类型通过；未运行验证。
- 寻路：DefaultPassPredicateImpl、finder.useMapLayer、useMover 已接，静态类型通过；未运行验证。
- 存档：addSaveableContent 与 save.init 代码存在，但依赖 afterLoad；当前入口不触发，见 P0-4。
- 构建：vite base 与别名配置可用；check:circular 指向不存在的 src/main.ts，见 P1-5。
- 工作区依赖：pnpm-workspace 覆盖 packages、packages-user、src；src/package.json 与各子包 workspace 依赖齐全；未安装或构建。
- 系统级集成：插件注册顺序与构造顺序存在缺陷，客户端钩子与元素注册未接入，见 P0-3、P0-4、P1-1、P1-2。

## 证据与快照

- git HEAD：5b1f8664093f8f9687499ec092e3f3150a507f9f
- 脏文件数：79（采集瞬间，含用户并发编辑）
- 采集时间：2026-11-05 18:46:50（基线）；类型检查 2026-11-05 18:47:19 至 18:47:24
- tsc 命令：pnpm check:type（等价 vue-tsc --noEmit，经 pnpm.cmd 执行）；退出码 2；错误行 258 条，其中非测试源 92 条；错误集中在测试夹具与并发编辑中的 UI/setting 接口。
- 执行结束时 HEAD：b950c53f98804587058a9549a0178761efb4b89b（用户于 18:51:26 外部提交，属外部漂移，不归因于本执行器）。
- 并发说明：用户正在同一工作树并发编辑接口，以上内容只代表采集瞬间；退出码非零属预期，不计为本执行器引入的新缺陷。
- 环境说明：首次以 pnpm.ps1 调用被 PowerShell 执行策略拦截，改用 pnpm.cmd 后得到结果，这属于环境限制。

## 范围与并发说明

- 本执行器只写入 09-RUNNABILITY-AUDIT.md 与 09-49-SUMMARY.md 两个文档。
- 未修改代码、配置、内容、STATE.md、ROADMAP.md 或其它既有计划与摘要；未提交。
- 若发现基线之外的路径漂移，属于用户并发编辑造成的外部漂移，不归因于本执行器。
- 两个目标文档的 .bak、.tmp 等后缀变体一律未写入。
