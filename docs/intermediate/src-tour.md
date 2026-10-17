# src 导览

`src` 是游戏的入口代码，也是中级教程涉及最多的地方。本篇带你认识它的主要目录，并说明哪些地方通常需要改、哪些通常不用动。两端的分工见 [数据端与渲染端](./data-vs-render.md)。

## src/data：数据端

数据端代码。游戏的逻辑与结果都在这里定义，是本教程后续的重点。常见子目录：

- `src/data/enemy/`：怪物相关逻辑，如特殊属性（`special.ts`）、光环（`aura.ts`）、伤害计算（`calculator.ts`）等；
- `src/data/event/`：地图事件的内建函数；
- `src/data/hero/`：勇士移动、通行性等实现；
- `src/data/hook/`：数据端内置钩子的实现与注册（见 [钩子](./hooks.md)）；
- `src/data/loader/`、`src/data/plugin/`、`src/data/replay/`：加载、数据端插件、录像指令等。

数据端的入口是 `entry.ts`，它负责装配并创建数据端主对象 `state`；`initialize.ts` 中的 `MainDataPlugin` 则承担主要的初始化工作。

## src/client：渲染端

渲染端代码，负责画面与交互。其构成与数据端一一对应：

- `src/client/entry.ts`：渲染端入口，创建渲染端主对象；
- `src/client/initialize.ts`：渲染端主插件；
- `src/client/plugin/`：渲染端插件；
- `src/client/ui/`：界面相关代码。

## src/content：内容层

游戏内容数据，与代码逻辑分开存放，大多以 `.jsonc` 形式存在：

- `core.jsonc`：核心配置，如勇士初始属性与初始位置；
- `enemy.jsonc`、`item.jsonc`、`tile.jsonc`：怪物、道具、图块定义；
- `maps/`：游戏地图；
- `item.ts`：道具效果的代码实现——内容层可以写少量代码，用来描述「使用某个道具会发生什么」。

## src/constant.ts：常量

游戏的底层核心常量，例如数据端核心配置 `CORE_URL`、勇士默认朝向组 `HERO_FACE`、渲染画布 `RENDER_CANVAS`、渲染宽高 `RENDER_WIDTH` 与 `RENDER_HEIGHT` 等。文件内已注明「不懂的话千万不要动」，一般不需要修改。

## 其余文件（通常不用改）

- `src/data.ts`：数据端入口，仅在录像验证时运行；
- `src/bootstrap.ts`：启动入口，创建渲染端主对象并打开加载界面；
- `src/package.json`：入口包的依赖声明；
- `src/styles.less`：全局样式。

## 该不该改

| 路径 | 用途 | 是否通常需要改动 |
| --- | --- | --- |
| `src/data/` | 数据端逻辑与结果 | 是，本教程重点 |
| `src/client/` | 渲染端画面与交互 | 视需求，交互类需求会改 |
| `src/content/` | 游戏内容数据 | 是，配置与内容 |
| `src/constant.ts` | 底层核心常量 | 否，一般不动 |
| `src/data.ts` | 数据端入口 | 否，一般不动 |
| `src/bootstrap.ts` | 启动入口 | 否，一般不动 |
| `src/package.json` | 入口包依赖声明 | 否，一般不动 |
| `src/styles.less` | 全局样式 | 否，一般不动 |

想先补齐读写这些文件所需的语法与类型知识，见 [代码基础](./code-basics.md)。
