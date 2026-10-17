# src 导览

想在游戏里加点自己的东西，第一件事往往是：我该改哪个文件？游戏的入口代码都在 `src` 下，而中级教程绝大多数时候只会碰到其中几个目录。本篇带你走一遍 `src`——先弄清每个目录在做什么，最后用一张表回答「它到底该不该改」。

如果还不清楚数据端与渲染端的分工，先看一眼[数据端与渲染端](./data-vs-render.md)。

## 包从哪来：src、packages-user 与 packages

本项目的代码分三层，示例里 `import` 语句用的包名与这三层一一对应：

- `src/`：你的**游戏本体**，入口代码与游戏内容都放这里。它对应的包名是 `@user/main`，但教程几乎不会在 `import` 里写出它；
- `packages-user/`：**用户工程包**，包名以 `@user/` 开头（如 `@user/data-base`、`@user/data-system`）。它是引擎面向游戏的二次封装，改动这里相当于扩展引擎；
- `packages/`：**核心引擎包**，包名以 `@motajs/` 开头（如 `@motajs/common`；[自定义事件](./events.md)里 `BuiltInFunction` 来自的 `@motajs/anon-tokyo` 也在这一层，它负责解释执行事件脚本）。它由引擎作者维护，一般不需要改。

依赖方向是单向的：`src` → `packages-user` → `packages`。也就是说，`src` 可以引用 `@user/*` 与 `@motajs/*`，`packages-user` 只能引用 `@motajs/*`，反过来不行。所以看到示例里 `import ... from '@user/xxx'` 或 `'@motajs/xxx'`，照抄即可——这些包都已随项目安装好，不需要你手动创建。

## src/data：数据端

凡是「游戏世界里发生了什么」——勇士剩多少血、怪物怎么被打、地图如何读取——都由 `src/data` 里的代码决定。它是本教程后续的重点，常见子目录：

- `src/data/enemy/`：怪物相关逻辑，如特殊属性（`special.ts`）、光环（`aura.ts`）、伤害计算（`calculator.ts`）等；
- `src/data/event/`：地图事件的内建函数；
- `src/data/hero/`：勇士移动、通行性等实现；
- `src/data/hook/`：数据端内置钩子的实现与注册（见[钩子](./hooks.md)）；
- `src/data/loader/`、`src/data/plugin/`、`src/data/replay/`：加载、数据端插件、录像指令等。

数据端的入口是 `entry.ts`，它负责装配并创建数据端主对象 `state`；`initialize.ts` 中的 `MainDataPlugin` 则承担主要的初始化工作。你通常不需要改这两个文件，但值得知道「一切是从这里搭起来的」。

## src/client：渲染端

凡是「玩家看到什么、点了什么」——画面、动画、界面——都由 `src/client` 负责。它的构成与数据端一一对应：

- `src/client/entry.ts`：渲染端入口，创建渲染端主对象；
- `src/client/initialize.ts`：渲染端主插件；
- `src/client/plugin/`：渲染端插件；
- `src/client/ui/`：界面相关代码。

两侧如何分工、各自负责什么，见[数据端与渲染端](./data-vs-render.md)。

## src/content：内容层

游戏内容与代码逻辑分开存放，大多以 `.jsonc` 形式存在。想调数值、换贴图、改地图，就来这里找：

- `core.jsonc`：核心配置，如勇士初始属性与初始位置；
- `enemy.jsonc`、`item.jsonc`、`tile.jsonc`：怪物、道具、图块定义；
- `maps/`：游戏地图；
- `item.ts`：道具效果的代码实现——内容层可以写少量代码，用来描述「使用某个道具会发生什么」。

## src/constant.ts：常量

游戏的底层核心常量都集中在这个文件，例如数据端核心配置 `CORE_URL`、勇士默认朝向组 `HERO_FACE`、渲染画布 `RENDER_CANVAS`、渲染宽高 `RENDER_WIDTH` 与 `RENDER_HEIGHT` 等。文件里已注明「不懂的话千万不要动」，一般不需要修改。

## 其余文件（通常不用改）

下面这些文件各有职责，但绝大多数需求都碰不到它们，知道它们在哪、干什么就够了：

- `src/data.ts`：数据端入口，仅在录像验证时运行；
- `src/bootstrap.ts`：启动入口，创建渲染端主对象并打开加载界面；
- `src/package.json`：入口包的依赖声明；
- `src/styles.less`：全局样式。

## 该不该改

把上面几节收成一张表，动手前对照一下：

| 路径               | 用途             | 是否通常需要改动       |
| ------------------ | ---------------- | ---------------------- |
| `src/data/`        | 数据端逻辑与结果 | 是，本教程重点         |
| `src/client/`      | 渲染端画面与交互 | 视需求，交互类需求会改 |
| `src/content/`     | 游戏内容数据     | 是，配置与内容         |
| `src/constant.ts`  | 底层核心常量     | 否，一般不动           |
| `src/data.ts`      | 数据端入口       | 否，一般不动           |
| `src/bootstrap.ts` | 启动入口         | 否，一般不动           |
| `src/package.json` | 入口包依赖声明   | 否，一般不动           |
| `src/styles.less`  | 全局样式         | 否，一般不动           |

想先补齐读写这些文件所需的语法与类型知识，见[代码基础](./code-basics.md)。
