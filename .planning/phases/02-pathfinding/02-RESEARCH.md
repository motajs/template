# Phase 2: 寻路系统 (Pathfinding) - Research

**Researched:** 2026-09-09
**Domain:** 数据端寻路系统 — 有向图最小损失寻路 + 逐步/瞬移移动驱动（mota-ts 引擎, pnpm monorepo, TypeScript ESNext）
**Confidence:** HIGH（代码接缝全部本会话实地读取；外部依赖为零）

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** 寻路目标是两点之间**损失最小**的路径；系统允许调用方自定义损失函数，默认实现为每格损失 1
- **D-02:** 算法流程：(1) 将地图转换为**有向图**——仅包含从当前位置可以到达的位置，由于存在单向通行位置，图必须是有向的；(2) 对图中每个图块用自定义损失函数计算损失；(3) 用算法找出损失最少的路径并返回
- **D-03:** 寻路系统具备足够扩展性，允许绑定 `IMapLayer`（地图）与 `IObjectMovable`（移动对象）两类对象
- **D-04:** 系统提供**两种移动方式**：逐步寻路至目标点；瞬移至目标点。瞬移前经回退策略判定，判定需要回退则自动退为逐步寻路
- **D-05:** 提供**回退决策接口**：接收一个策略函数，函数入参为寻路路径及每步会到达的位置，由该函数决策是否回退移动方式。默认策略实现为"路径上存在事件即回退"（事件可能改变状态，瞬移会跳过副作用）
- **D-06:** 提供**仅获取寻路路径**的方法（不移动，只返回路径）
- **D-07:** 接口设计流程：AI 先按现有接口设计理念起草接口草案，**经用户修改拍板后才进入实现**——planner 必须内置该 review 关卡（接口经用户确认前不得开始实现任务）
- **D-08:** 寻路至不可达位置时分两种情况：(1) 目标本身是 no-pass 类图块且四周有坐标可以到达——移动到该相邻格，触发目标位置的 **OnTouch** 触发器（走 Phase 1 事件链路），勇士面朝目标位置；(2) 其他情况——忽略本次寻路移动，路径为空数组
- **D-09:** 逐步寻路的执行**复用现有 hero mover**（`DefaultHeroMoveTopImpl`），每步走 enter/leave/hit hooks，途经事件自然触发（与 Phase 1 source-aware 事件派发一致）
- **D-10:** 自动寻路途中**可被玩家输入打断**：新的方向键输入或新的点击立即打断并接管（魔塔惯例）
- **D-11:** 本阶段仅关注数据端系统；玩家点击交互是渲染端内容，PATH-02 的点击触发接线延迟到 Phase 4 渲染适配

### the agent's Discretion

- 图的构建时机与缓存策略（每次寻路动态构建 vs 缓存）——数据端状态可变（敌人/门/道具），默认建议动态构建
- 具体算法选型（满足"最小损失 + 有向图"语义即可，AI 决定）
- 接口命名、签名与文件归属层的细节——在**接口草案**中提出，最终由用户拍板

### Deferred Ideas (OUT OF SCOPE)

- 移动端点击地图触发寻路的**渲染端接线**（点击拾取、不可达格点击反馈等 UI 行为）——属 Phase 4 渲染适配

## Project Constraints (from AGENTS.md → dev.md)

AGENTS.md 指向 `dev.md`（本会话已完整读取）。硬性规范，planner 任务必须遵守：

- **模块原则**：模块无顶层副作用；初始化用 `createXxx()` 工厂；不转发导出；**禁循环引用**；禁 `import type`（全部普通引入）
- **类型规范**：禁非必要 `any`；类成员显式类型；**尽量不用 `as`，绝对禁止连续 `as`**；对象类型单独开 `interface`；成员用接口类型而非类类型
- **命名**：接口 `I` 前缀 + 大驼峰；文件名小驼峰；私有成员不用下划线开头；不变常量全大写下划线分隔
- **日志**：错误/警告用 `logger.error(数字码)` / `logger.warn(数字码)`，码集中注册于 `packages/common/src/logger.json`（`error` 已用 1–64，`warn` 已用 1–172 → **新 error 码从 65 起，新 warn 码从 173 起**）[VERIFIED: packages/common/src/logger.json — 本会话以 node 脚本枚举全部键位确认]
- **其他**：禁字符串作键/标识符（用枚举）；尽量不用 `?.`（仅副作用调用与 Required 化两场景）；不写 getter/setter；CRLF；jsDoc 中文注释 40–60 字符换行；测试文件每个 `it` 前必须有单行注释说明覆盖内容
- **双端分离**：数据端可在 Node 独立运行、可直接录像验证；数据端调用渲染端必须 `Mota.r()` 包裹（本阶段不应需要）

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PATH-01 | 引擎支持自动寻路 | 本文件给出完整实现接缝：图构建数据来源（`IMapLayer` 通行性掩码）、算法选型（Dijkstra 有向图）、移动执行复用（`HeroMover` + `DefaultHeroMoveTopImpl`）、瞬移/回退策略、不可达语义、打断机制 |
| PATH-02 | 移动端点击地图触发自动寻路移动 | **本阶段仅交付数据端移动入口**（供渲染端 Phase 4 调用的寻路/移动 API）；点击拾取与接线为渲染端内容，本阶段只保证入口存在且可在 Node 下验证 |

## Summary

本阶段在数据端（L0–L3 分层包内）新建一个寻路系统：把 `IMapLayer` 的通行性掩码转换成**有向图**（每条边 = 从 A 向方向 d 走一步，需 A 的 `outPass` 含 d 且 B 的 `inPass` 含 opposite(d)），在图上跑**最小损失算法**（推荐 Dijkstra，地图均为小网格，无需外部依赖），产出坐标路径。路径有两种消费方式：逐步执行（把路径翻译成 `ObjectMoveType.Dir` 步骤队列，复用 `HeroMover` + `DefaultHeroMoveTopImpl` 的 enter/leave/hit 事件链）与瞬移（`mover.tp()`，执行前经可注入的回退策略判定，默认"路径上有事件即回退为逐步"）。不可达目标按 D-08 双语义处理。寻路过程可被打断（新寻路调用或显式 interrupt 入口），复用 `IMoverController.stop()`。

**研究中最关键的发现**：L0 基类 `ObjectMover.moveProgress` 中步后坐标回写条件疑似存在缺陷（`&&` 应为 `||`，见 Common Pitfalls P1），正交单步移动后 `setPos` 永远不会被调用——当前渲染端尚走旧 legacy mover（`client-modules` 引用的 `@user/data-state` 的 `HeroMover` 在新数据端 barrel 中已无此导出），所以此缺陷未被现有功能暴露；而 D-09 逐步寻路是第一个串联多步 `Dir` 步骤的新消费者，会立刻踩中。planner 必须把"向用户确认并修复该 L0 缺陷"作为实现前置任务。

**Primary recommendation:** 接口草案先行（D-07 review 关卡置顶）→ 修复 L0 `&&` 缺陷（用户确认后）→ 纯寻路核心（L2，可注入通行性谓词与回退策略，默认策略复用 `DefaultHeroMoveTopImpl` 的判定语义）→ L3 hero 接线与 vitest 全覆盖。

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 有向图构建（通行性掩码 → 邻接） | data-system (L2) | — | 纯数据变换，不存档，只读 L1 的 `IMapLayer` |
| 最小损失算法 + 仅取路径 API (D-01/D-02/D-06) | data-system (L2) | — | 纯算法，Node 可验证，无状态 |
| 回退策略接口与默认实现 (D-05) | data-system (L2) | data-state (L3) | 策略函数注入到 L2 系统；默认策略读取路径上事件（L1 数据），瞬移回退执行在 L3 |
| 逐步寻路执行 (D-09) | data-state (L3) | data-common (L0) | 复用 `HeroMover`（L0 队列机制）+ `DefaultHeroMoveTopImpl`（L3 判定与事件派发） |
| 瞬移执行 (D-04) | data-state (L3) | data-common (L0) | `mover.tp()` 步骤类型已存在（`ObjectMoveType.Teleport`） |
| 不可达目标 OnTouch (D-08) | data-state (L3) | data-system (L2) | 走 Phase 1 source-aware 派发链（`IGameEventExecutor.execute`），env 构造复用 moverImpl 模式 |
| 打断/接管 (D-10) | data-common (L0) | data-system (L2) | `IMoverController.stop()` 已存在；寻路控制器封装"停旧起新" |
| 渲染端点击接线 (PATH-02 UI) | client-modules (渲染端) | — | **Phase 4**，本阶段只提供数据端入口 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript (repo ESNext) | 已有 | 实现语言 | 项目既有，无新依赖 |
| Dijkstra（自写，~40 行） | — | 有向图最小损失搜索 | 非负自定义损失下保证最小损失；魔塔楼层 ≤ 数百格，O(V²) 简单实现足够 [ASSUMED：算法通识，未外部验证——但符合 D-01/D-02 语义，风险极低] |
| vitest | 4.0.18（已装） | 单元测试 | 项目既有测试栈，co-located `*.test.ts` [VERIFIED: 根目录 `npx vitest --version` → 4.0.18；既有 6 个测试文件] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lodash-es `isNil` | 已有 | 判空（`DefaultHeroMoveTopImpl` 同款） | 边界/楼层数据判空 |
| `@motajs/common` logger | 已有 | 数字错误码日志 | 新码 error≥65 / warn≥173 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dijkstra | A*（曼哈顿启发） | 大图更快，但引入启发函数设计复杂度；魔塔网格小，Dijkstra 实现更简单且严格满足"最小损失"语义。**不采用** |
| BFS | — | 仅当损失恒为 1 时正确；自定义损失函数下不保证最小损失。**不采用** |
| 外部寻路库（如 pathfinding/astar-typescript） | — | 数据端包不引第三方运行时依赖（现有 data-* 包仅依赖 workspace 内部 + lodash-es），且需支持有向图与自定义损失。**不采用** |

**Installation:** 无新依赖。不执行任何安装。

## Package Legitimacy Audit

**本阶段不安装任何外部包**（纯内部代码 + 既有 vitest），无 legitimacy 检查对象。

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
渲染端(Phase 4) ──点击/方向输入──▶ 数据端寻路入口 (L3 wiring)
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │  PathfindingSystem (L2)       │
                        │  - 绑定 IMapLayer             │
                        │  - 绑定 IObjectMovable        │
                        └───────────────────────────────┘
                              │               ▲
                 (1) 构建有向图│               │(4) 注入
                              ▼               │
   ┌──────────────────────────────────┐   ┌─────────────────────────┐
   │ IMapLayer.getLocationData(x,y)   │   │ 通行性谓词(可注入)        │
   │  .static.raw() → pass:           │   │ 默认复用 PassBit 掩码语义 │
   │    outPass/inPass (方向位掩码)     │   │ (=DefaultHeroMoveTopImpl │
   │    eventPass (撞击终止格)          │   │  .canPass 判定)          │
   └──────────────────────────────────┘   └─────────────────────────┘
                              │
                 (2) 最小损失搜索 (Dijkstra, 自定义损失函数, 默认每格 1)
                              ▼
                        路径: ITileLocator[]
                              │
              (3) 移动方式决策 ─┴─▶ D-06 仅返回路径（结束）
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
             回退策略(可注入)          回退策略判定"需回退"
             = false → 瞬移            → 逐步寻路
                    │                    │
                    ▼                    ▼
            mover.tp(x,y)          逐步翻译为 ObjectMoveType.Dir 队列
                    │                    │
                    └─────────┬──────────┘
                              ▼
                  HeroMover.start() → IObjectMoverController
                              │
              每步: onStepStart(canPass/shouldHit判定)
                   → onStepEnd(hit→OnTouch派发/stop)
                   → onStepSettled(leave→enter 派发)
                              │
                              ▼
                 完成回调 / 被新输入打断(controller.stop)
```

不可达分支（D-08）：目标 no-pass 且存在可达相邻格 → 路径截断至相邻格 + 面朝目标 + OnTouch 派发（走 `IGameEventExecutor.execute`，构造 `IBlockEventEnv`，trigger=`EventTrigger.OnTouch`）；否则返回空数组且不移动。

### Recommended Project Structure

```
packages-user/data-system/src/
└── pathfinding/
    ├── types.ts        # 接口定义（草案经用户拍板后落定）
    ├── graph.ts        # IMapLayer → 有向图构建
    ├── system.ts       # PathfindingSystem（绑定/搜索/移动方式决策）
    └── index.ts
packages-user/data-state/src/
└── pathfinding/
    └── heroPathfinding.ts   # L3 接线：绑定 hero mover + 默认通行性谓词(复用 DefaultHeroMoveTopImpl 语义)
packages-user/data-system/src/pathfinding/xxx.test.ts   # co-located 测试
packages-user/data-state/src/heroPathfinding.test.ts
```

（文件归属层是草案内容，最终由用户拍板——见 D-07；上表为研究建议。）

**分层归属论证（防循环依赖）** [VERIFIED: packages-user/data-state/package.json、data-system/package.json 依赖声明 + data-system/src/types.ts:6-11]：
- `data-common`(L0) → 无依赖；`data-base`(L1) → L0；`data-system`(L2) → L0+L1；`data-state`(L3) → L0+L1+L2
- `IMapLayer` 定义在 **data-base**（L1），`IObjectMovable` 定义在 **data-common**（L0）→ L2 可同时引用二者，寻路核心放 **data-system 合法**
- `DefaultHeroMoveTopImpl`（通行性/事件判定）在 **data-state**（L3）；L2 系统若直接 import 会反向依赖 L3 → **不可行**。解法：L2 接受可注入谓词/策略函数（与项目既有 `useTopImplementation` / `useSorter` / `useCalculator` / `useStore` 注入惯例完全一致），L3 接线时注入

### Pattern 1: 可注入策略（项目既有惯例）

**What:** 系统持有策略槽位，`useXxx()` 注入；不注入时使用内建默认或空实现。
**When to use:** 通行性谓词、回退策略（D-05）。
**Example**（既有代码，逐字）:

```typescript
// Source: packages-user/data-base/src/hero/mover.ts:72-74（同款惯例还有
// data-system/event/system.ts useStore、combat useCalculator/useReducer/useSorter）
useTopImplementation(impl: IHeroMoveTopImpl | null): void {
    this.topImpl = impl;
}
```

### Pattern 2: 有向边判定（PassBit 掩码语义）

**What:** 从 A 向方向 d 的边成立 = A 可离开（`outPass` 含 d 位）且 B 可进入（`inPass` 含 opposite(d) 位）。单向通行天然由掩码不对称产生。
**Example**（既有判定逻辑，逐字摘自 DefaultHeroMoveTopImpl）:

```typescript
// Source: packages-user/data-state/src/hero/moverImpl.ts:85-104
const opposite = face.opposite(direction);
const leaveMask = this.directionToPassBit(direction);
const enterMask = this.directionToPassBit(opposite);

let canLeave = true;
let canEnter = true;

// 判断事件层
const curr = event.getLocationData(x, y);
const next = event.getLocationData(nx, ny);
const currRaw = curr?.static.raw();
const nextRaw = next?.static.raw();
if (currRaw) {
    canLeave = !!(leaveMask & currRaw.pass.outPass);
}
if (nextRaw) {
    canEnter = !!(enterMask & nextRaw.pass.inPass);
}
```

注意 `canPass` 还包含**多层逻辑**：事件层永远参与判定；其余层仅当该格 `pass.onlyEvents` 为真时参与（moverImpl.ts:107-122）。图构建必须完整复刻该语义，或（推荐）通过注入谓词直接复用同一实现。

### Pattern 3: 移动队列与打断（L0 既有机制）

```typescript
// Source: packages-user/data-common/src/common/mover.ts:142-164（接口节选，逐字）
export interface IMoverController {
    /** 本次移动是否已经全部完成 */
    done: boolean;
    /** 当本次移动结束时兑现 */
    onEnd: Promise<void>;

    /**
     * 向当前移动队列末尾追加步骤
     * @param steps 要追加的步骤列表
     */
    push(...steps: Readonly<ObjectMoveStep>[]): void;

    /**
     * 停止当前移动，在当前步骤完成后兑现
     */
    stop(): Promise<void>;
}
```

- `mover.start()` 已在移动中时返回 `null`（mover.ts:669-670 `if (this.moving) return null;`）→ 打断接管必须先 stop 旧移动再 start 新移动 [VERIFIED]
- `stop()` 在当前步完成后兑现 → "立即打断"语义 = 调 stop 后**不 await** 再开新寻路（新寻路从新位置起算会与正在完成的步冲突时，应 await 或在 `onEnd` 后启动；接口草案中定夺）

### Anti-Patterns to Avoid

- **在 L2 import L3**（data-system → data-state）：造成循环依赖，违反 dev.md；用注入解耦
- **在步骤钩子里 `await controller.onEnd`**：`HeroMover.onStepEnd` 既有注释明示会卡死（"这里不能 await，因为其 Promise 会在当前步结束后兑现，如果 await 就会卡住"，mover.ts data-base:227-228）
- **把图缓存为长期结构**：数据端状态可变（门/敌人/动态图块），CONTEXT 已建议默认动态构建
- **`as` 断言 / 字符串键 / 顶层副作用**：dev.md 硬禁
- **在数据端写 DOM/渲染逻辑**：双端分离，Node 回放必须可跑

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 逐步移动执行 | 新写移动循环 | `HeroMover`（data-base）+ `ObjectMover` 队列（data-common） | 队列/stop/hit 语义已完备，D-09 明锁复用 |
| 通行性判定 | 重写一套掩码逻辑 | 注入 `DefaultHeroMoveTopImpl` 同款谓词（或抽公共判定） | 多层 onlyEvents 语义易漏 |
| 事件派发（OnTouch/OnEnter/OnLeave） | 直接调 executor 之外的新链路 | 复用 `IHeroMoveTopImpl.enter/leave/hit`（内部走 `commonTrigger` → `executor.execute`） | Phase 1 已验证 source-aware 顺序 |
| 朝向→坐标增量 | 手写 switch | `IFaceHandler.movement(dir)` / `opposite(dir)` | Dir4/Dir8 已注册于 FaceManager |
| 朝向→PassBit 映射 | 新写映射 | 复用 moverImpl `directionToPassBit` 语义（或抽公共） | 单一事实源 |
| 日志 | console.* | `logger.warn/error(数字码)` + logger.json 注册 | 项目规范 |

**Key insight:** 本阶段约 80% 的"难点"（移动、事件、打断）已由 Phase 1 与 L0 mover 完成；寻路系统的增量主要是**图构建 + 最小损失搜索 + 方式决策**三块纯逻辑。手写新移动循环是最大的返工风险。

## Key Code Seams (verified this session)

以下离散值与接缝全部为本会话 `Read` 逐字读取，供 planner 直接引用：

**PassBit（方向位掩码，有向图的边权基础）** [VERIFIED: packages-user/data-common/src/store/types.ts:27-36]

```typescript
export const enum PassBit {
    /** 上方向掩码 */
    Up = 0b0001,
    /** 右方向掩码 */
    Right = 0b0010,
    /** 下方向掩码 */
    Down = 0b0100,
    /** 左方向掩码 */
    Left = 0b1000
}
```

**FaceDirection（含 4 斜向；斜向在 canPass 中直接放行）** [VERIFIED: packages-user/data-common/src/common/types.ts:1-11]

```typescript
export const enum FaceDirection {
    Unknown,
    Left,
    Up,
    Right,
    Down,
    LeftUp,
    RightUp,
    LeftDown,
    RightDown
}
```

**HeroMoveCode（单步判定结果，逐步寻路复用）** [VERIFIED: packages-user/data-base/src/hero/types.ts:278-287]

```typescript
export const enum HeroMoveCode {
    /** 正常移动 */
    Step,
    /** 移动被停止 */
    Stop,
    /** 不能移动，并触发目标格撞击触发器 */
    Hit,
    /** 不能移动，并触发目标格无法进入触发器 */
    CannotMove
}
```

**ObjectMoveType（寻路翻译目标步骤类型；逐步→`Dir`，瞬移→`Teleport`）** [VERIFIED: packages-user/data-common/src/common/mover.ts:14-31]

```typescript
export const enum ObjectMoveType {
    /** 绝对方向步，同步更新移动方向与朝向 */
    Dir,
    /** 绝对方向步，显式指定朝向 */
    DirFace,
    /** 速度步 */
    Speed,
    /** 纯转向步 */
    Face,
    /** 特殊步，如前进或后退 */
    Special,
    /** 动画方向步 */
    AnimDir,
    /** 传送步 */
    Teleport,
    /** 跳跃步 */
    Jump
}
```

**EventTrigger.OnTouch（D-08 派发所用触发器）** [VERIFIED: packages-user/data-common/src/event/types.ts:7-17] — `OnTouch` 枚举值为 `1`（`None=0`，`OnEnter=2`，`OnLeave=3`），注释明确"当玩家触碰指定图块时触发，如果直接走入则不触发"。

**shouldHit / eventPass 语义** [VERIFIED: packages-user/data-state/src/hero/moverImpl.ts:127-141]

```typescript
shouldHit(handler: IHeroMoveTopHandler): boolean {
    // …取 eventLayer.getLocationData(nx, ny)?.static.raw()
    if (!nextRaw) return false;
    return !nextRaw.eventPass;
}
```

配合 `ITileRawData.eventPass` 注释（"当为 `false` 时，玩家会通过撞击触发图块的触发器，当为 `true` 时，玩家会通过走上去触发图块的触发器。类似于旧样板的 `noPass`"）[VERIFIED: packages-user/data-common/src/store/types.ts:58-62]。**执行顺序**：`HeroMover.onStepStart` 先 `canPass`，通过后才 `shouldHit`（data-base/hero/mover.ts:183-190）→ 撞击触发（Hit→OnTouch）只在"可通行但 eventPass=false"的格上发生；`inPass=0` 的真 no-pass 格走 `CannotMove → cannotEnter()`，而 `cannotEnter` 当前为**空实现**（moverImpl.ts:259-263）。这是 D-08 的关键语义缺口（见 Pitfalls P2）。

**IBlockEventEnv（D-08 直派 OnTouch 时需要构造的环境）** [VERIFIED: packages-user/data-base/src/map/types.ts:40-62]

```typescript
export interface IBlockEventEnv extends IDataCommonExtended {
    /** 事件类型 */
    readonly type: BlockEventType;
    /** 本次事件的触发器类型 */
    readonly trigger: EventTrigger;
    /** 触发事件时玩家的位置 */
    readonly heroLocator: Readonly<ITileLocator>;
    /** 触发事件时触发者的位置，有可能不存在 */
    readonly triggerLocator: Readonly<ITileLocator> | null;
    /** 触发事件的图块，有可能不存在 */
    readonly tile: IReadonlyTileBase | null;
    /** 触发事件的图层，有可能不存在 */
    readonly layer: IMapLayer | null;
    /** 触发事件的地图，有可能不存在 */
    readonly map: IGameMap | null;
}

export interface IGameEventInvocation {
    /** 事件在 `IGameEventStore` 中的 id */
    readonly id: string;
    /** 此次调用对应的真实来源环境 */
    readonly env: IBlockEventEnv;
}
```

`BlockEventType` 逐字值：`CommonEvent=0, PointEvent=1, TileEvent=2` [VERIFIED: packages-user/data-base/src/map/types.ts:26-33]。

**图构建数据入口** [VERIFIED: packages-user/data-base/src/map/types.ts:514-612（IMapLayer）、249-258（ILayerLocation）]
- `IMapLayer.getLocationData(x, y): ILayerLocation | null`；`ILayerLocation = { locator, tile, dynamics, static: IStaticTile }`
- `IReadonlyTileBase.raw(): ITileRawData | null`（含 `pass.outPass/inPass/onlyEvents`、`eventPass`、事件视图）
- `IMapLayer.inMap(x, y)`、`width/height`、`map.eventLayer`、`map.layerList`、`map.getLayerByAlias(alias)`

**IObjectMovable 绑定面** [VERIFIED: packages-user/data-common/src/common/mover.ts:47-64]

```typescript
export interface IObjectMovable {
    /** 当前横坐标 */
    readonly x: number;
    /** 当前纵坐标 */
    readonly y: number;

    /**
     * 设置对象位置
     * @param x 横坐标
     * @param y 纵坐标
     */
    setPos(x: number, y: number): void;

    /**
     * 获取当前朝向
     */
    getCurrentFaceDirection(): FaceDirection;
}
```

`IDynamicTile` 同样 `extends ITileBase, IObjectMovable` 且带 `mover: IObjectMover<IDynamicTile>` [VERIFIED: data-base/map/types.ts:200-209] → D-03 绑定 `IObjectMovable` 可同时服务勇士与动态图块（如跟随者/NPC）。

**L3 现有接线点（寻路系统照此接入 CoreState）** [VERIFIED: packages-user/data-state/src/core.ts:235-238]

```typescript
// 勇士顶层初始化
const heroMoveTopImpl = new DefaultHeroMoveTopImpl(this);
this.hero.location.mover.useTopImplementation(heroMoveTopImpl);
```

**D-08 面朝目标**：`mover.face(dir)`（纯转向步，`ObjectMoveType.Face`）或 `mover.setFaceDir(dir)`；IHeroState 另有 `getLocation(): IFacedTileLocator` [VERIFIED: data-base/hero/types.ts:835]。

## Common Pitfalls

### Pitfall 1（阻断级）: L0 `ObjectMover` 步后坐标回写条件疑似错误（`&&` 应为 `||`）

**What goes wrong:** `moveProgress` 中，单步结束后仅当 **x 与 y 同时**变化才回写坐标 [VERIFIED: packages-user/data-common/src/common/mover.ts:648-654]：

```typescript
const loc = await this.onStepEnd(code, step, this.tile, controller);
const before: ITileLocator = { x: this.tile.x, y: this.tile.y };
const curr: ITileLocator = { x: loc.x, y: loc.y };
if (this.tile.x !== loc.x && this.tile.y !== loc.y) {
    this.tile.setPos(loc.x, loc.y);
}
```

正交步（上下左右，逐步寻路唯一会产生的步骤类型）只改变一轴 → 条件恒 false → `setPos` 不调用 → `tile.x/y` 永不更新。逐步寻路第 2 步起 `createHandler` 以**陈旧原点**计算 nextLoc，整条路径走崩；`onStepSettled` 的 leave/enter 事件坐标也与实际不符。
**Why it happens:** 疑为手误（意图应为"任一轴变化即回写"，即 `||`）。
**How to avoid:** planner 必须把"用户确认 + 修复该行 + L0 回归单测（正交/斜向/传送步的 setPos 回写）"列为**实现前置任务**（属 L0 共享代码 + D-07 用户拍板文化，不可静默修复）。
**Warning signs:** 单测里 hero 连走两步后坐标不动；事件 env 中 heroLocator 与 step 计划不一致。
**为何现在才暴露：** 渲染端现走 legacy mover——`client-modules/src/action/move.ts` `import { HeroMover, IMoveController } from '@user/data-state'`，而 data-state barrel 已不导出这两个名字 [VERIFIED: data-state/src/index.ts 仅有 enemy/hero(moverImpl)/core/ins/shared/types；该 import 处于失效状态，与 STATE.md 记录的"仓库级类型门禁存在既有诊断"一致]。新 `HeroMover`（data-base）尚无消费者串联多步 Dir，故未踩中。

### Pitfall 2: D-08 的 OnTouch 与现有 Hit/CannotMove 语义不衔接

**What goes wrong:** D-08 要求"移动到相邻格 + 触发目标 OnTouch"。但现有 mover 链路中：`Hit`（→`topImpl.hit()`→OnTouch 派发）只在 `canPass=true` 且 `eventPass=false` 时发生；`inPass=0` 的真 no-pass 格走 `CannotMove → cannotEnter()`，而 `cannotEnter` 是空实现（"新事件触发器没有无法进入的对应项，保留空实现以满足移动接口"）[VERIFIED: moverImpl.ts:259-263]。
**How to avoid:** 两种方案进接口草案由用户拍板：(a) 寻路系统在到达相邻格后**直接构造 `IGameEventInvocation`（trigger=OnTouch, heroLocator=相邻格, triggerLocator=目标格）调 `executor.execute`**——绕开 mover 撞击路径，语义直给；(b) 追加一个朝向目标的"撞击步"复用 hit 链——但真 no-pass 格会走 CannotMove 而非 Hit，方案 (b) 对 inPass=0 目标不生效。**推荐 (a)**。
**Warning signs:** 单测里撞墙 OnTouch 不触发。

### Pitfall 3: eventPass=false 的格子是"终点格"而非"途经格"

**What goes wrong:** `canPass` 通过但 `shouldHit` 为真的格（eventPass=false），走进去会 Hit 并 stop——图构建时若把它当普通可通行节点，路径会"穿过"它而实际移动在半路停止。
**How to avoid:** 图构建时把此类格标记为**终端节点**：路径可以以它结尾，不允许作为中间节点。与 D-08 case (1) 的 no-pass 目标语义统一处理。

### Pitfall 4: 单向通行的方向性遗漏

**What goes wrong:** 只查目标格 `inPass` 或只查当前格 `outPass`，会把单向门当双向。
**How to avoid:** 每条边同时验证 `outPass(source) & dirBit` 与 `inPass(dest) & oppositeBit`（Pattern 2 逐字语义）；单测必须有"A→B 可行、B→A 不可行"的用例（D-02 明示存在单向通行位置）。

### Pitfall 5: 打断竞态

**What goes wrong:** `mover.start()` 移动中返回 `null`；`stop()` 在当前步完成后才兑现。若"打断后立即 start"不处理时序，新移动可能被旧队列污染（`start()` 返回 null 静默失败）。
**How to avoid:** 寻路系统持有当前 controller 引用；接管流程 = `clear()` 新队列 + `stop()` 旧移动 → 等待兑现（或 `onEnd.then`）→ 查询新位置 → 计算并启动新路径。注意 `HeroMover.onStepEnd` 内部在 `CannotMove/Stop/Hit` 时也自行 `controller.stop()`——寻路控制器要能识别"移动已自然终止"。

### Pitfall 6: 测试环境桩

**What goes wrong:** `@motajs/common` logger 模块加载时有 DOM 代码（`document.createElement`），由 `main.replayChecking` 守卫。
**How to avoid:** 沿用既有测试桩模式：`vi.stubGlobal('main', { replayChecking: true })` + `Map.prototype.getOrInsertComputed` polyfill + 动态 import [VERIFIED: eventPath.test.ts:18-40、eventDispatch.test.ts:19-33 逐字同款]。

### Pitfall 7: 日志码冲突

**What goes wrong:** logger.json 码是顺序分配的全局注册表；撞码会覆盖语义。
**How to avoid:** 新 warn 从 173、新 error 从 65 起 [VERIFIED: node 枚举 logger.json 全键]；建议本阶段统一在一个 PR/任务里登记。

## Code Examples

### 路径 → 移动步骤翻译（草案示意，命名待用户拍板）

```typescript
// Source: 接缝组合自 packages-user/data-common/src/common/mover.ts (IObjectMover API)
// 伪代码——接口签名与命名须经 D-07 用户拍板后才实现
function translatePath(
    path: Readonly<ITileLocator[]>,
    face: IFaceHandler<FaceDirection>
): ObjectMoveStep[] {
    const steps: ObjectMoveStep[] = [];
    for (let i = 1; i < path.length; i++) {
        const dx = path[i].x - path[i - 1].x;
        const dy = path[i].y - path[i - 1].y;
        // face.mapMovement() 返回 [FaceDirection, IFaceDescriptor]，
        // 找到 (x,y) 增量匹配的方向；每次一步保证 canPass 逐格判定
        steps.push({ type: ObjectMoveType.Dir, move: dirOf(dx, dy) });
    }
    return steps;
}
// 执行：mover.push(...steps); const c = mover.start();  // c 为 IMoverController | null
```

### 逐步寻路接线（L3，示意）

```typescript
// Source: 模式复刻自 packages-user/data-state/src/core.ts:236-237 与
// packages-user/data-base/src/hero/mover.ts (HeroMover.onStepStart 判定顺序)
// hero.location.mover 已绑定 DefaultHeroMoveTopImpl：
//   step → canPass ? (shouldHit ? Hit : Step) : CannotMove
//   Hit   → topImpl.hit()  → OnTouch 派发 → stop
//   Step  → onStepSettled → leave → enter → 途经事件自然触发
```

### D-08 直派 OnTouch（示意）

```typescript
// Source: env 构造逐字复刻 packages-user/data-state/src/hero/moverImpl.ts:206-222 (commonTrigger)
const env: IBlockEventEnv = {
    state: handler.state,
    type: BlockEventType.PointEvent, // 或 TileEvent，按目标格事件来源
    trigger: EventTrigger.OnTouch,
    heroLocator: adjacentLoc,        // 相邻格（勇士实际所在）
    triggerLocator: targetLoc,       // 目标格
    tile: targetStaticTile,          // 目标为 no-pass 类图块时的 static 引用
    layer: eventLayer,
    map
};
await executor.execute<void>([{ id, env }], { custom: {} });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| legacy 路线系统（`core.status.route` / `stopAutomaticRoute` / `clearContinueAutomaticRoute`，见 data-state/src/legacy/move.ts 对旧 core 的调用） | 新数据端寻路系统（本阶段）：有向图 + 可注入策略 + `IMoverController.stop` 打断 | Phase 2（本阶段） | Phase 5 LEGACY 移植时删除旧 route 逻辑；新系统不依赖 legacy |
| 旧 mover（data-state/src/legacy/move.ts `HeroMover extends ObjectMoverBase`，渲染端 action 仍在引用） | 新 HeroMover（data-base/hero/mover.ts，topImpl 驱动，Phase 1 事件化） | Phase 1 | 渲染端 action 的旧 import 已失效，Phase 4 重接；本阶段不动渲染端 |

**Deprecated/outdated:**
- 渲染端 `client-modules/src/action/move.ts` 对 `@user/data-state` 的 `HeroMover/IMoveController` import：barrel 已无此导出 [VERIFIED]——Phase 4 范畴，本阶段仅记录。

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Dijkstra 满足 D-01/D-02 且网格规模下 O(V²) 足够（魔塔楼层典型 13×13） | Standard Stack | 极低；若超大地图需 A*，接口不变仅换内部算法 |
| A2 | D-08 OnTouch 采用"直派 executor"方案（而非复用 mover 撞击步）为推荐方案 | Pitfalls P2 / Code Examples | 中；语义由用户拍板定夺，草案阶段必须显式列出两方案 |
| A3 | mover.ts:651 `&&` 为手误，意图为 `||` | Pitfalls P1 | 高；若属有意设计则需用户提供替代的坐标回写路径——**必须用户确认后才能改** |
| A4 | 打断接管采用"stop 旧移动 → 等待兑现 → 起新寻路"时序 | Architecture Patterns | 低；接口草案中定夺是否 await |
| A5 | 寻路核心放 data-system(L2)、hero 接线放 data-state(L3) | Project Structure | 低；归属层是 D-07 草案内容，用户可改 |

## Open Questions

1. **D-08 OnTouch 派发路径**
   - What we know: mover 的 Hit 链对 `inPass=0` 真墙格不生效（cannotEnter 为空实现）
   - What's unclear: 用户期望的 OnTouch 派发语义（直派 executor vs 改 hit 语义）
   - Recommendation: 接口草案中两方案并列，用户拍板（D-07 关卡内解决）
2. **L0 `&&` 缺陷修复**
   - What we know: 逐字引用与推理链完整（Pitfall 1）
   - What's unclear: 是否属有意设计；是否允许本阶段修 L0
   - Recommendation: planner 首个任务设 `checkpoint:human-verify`，用户确认后修 + 回归测试
3. **打断时序**：stop 后 await 兑现再起新寻路，还是 onEnd 回调驱动——接口草案定夺
4. **斜向（Dir8）寻路**：`FaceDirection` 含 4 斜向且 canPass 对斜向直接放行（moverImpl.ts:67-75），但 PassBit 只有 4 位。图是否含斜向边（默认建议：仅 4 正交向，与 PassBit 掩码语义一致）——接口草案定夺

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | 数据端运行/测试 | ✓ | v22.18.0（满足 ^20 \|\| >=22） | — |
| pnpm | 包管理 | ✓ | 10.15.0（满足 >=10） | — |
| vitest | 单元测试 | ✓ | 4.0.18 | — |
| vue-tsc | `pnpm check:type` | ✓（script 存在） | — | 仓库级存在既有诊断（STATE.md 延迟项），只对计划内文件收口 |
| eslint | `pnpm lint:user` | ✓（script 存在） | — | — |
| madge | `pnpm check:circular` | ✓（script 存在，入口 src/main.ts） | — | — |

**Missing dependencies with no fallback:** 无
**Missing dependencies with fallback:** 无

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18（根 vite.config.ts 无 test 配置段 → vitest 默认发现 co-located `*.test.ts`） |
| Config file | none（沿用根 vite.config.ts alias：`@user/*` → `packages-user/*/src`） |
| Quick run command | `npx vitest run packages-user/data-system/src/pathfinding packages-user/data-state/src` |
| Full suite command | `npx vitest run`（注意：`pnpm test` 为 watch 模式，CI 用 `vitest run`） |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PATH-01-a | 有向图构建正确（单向边、掩码方向性） | unit | `npx vitest run packages-user/data-system/src/pathfinding` | ❌ Wave 0 |
| PATH-01-b | 最小损失 + 自定义损失函数（默认每格 1） | unit | 同上 | ❌ Wave 0 |
| PATH-01-c | D-06 仅取路径 API（不移动） | unit | 同上 | ❌ Wave 0 |
| PATH-01-d | D-04/D-05 瞬移 + 回退策略（默认"路径有事件即回退"；注入自定义策略） | unit | 同上 | ❌ Wave 0 |
| PATH-01-e | D-09 逐步执行：复用 HeroMover+topImpl，途经 OnEnter/OnLeave/OnTouch 派发 | unit（fixture 复刻 eventDispatch.test.ts 模式） | 同上 | ❌ Wave 0 |
| PATH-01-f | D-08 双语义：相邻格+OnTouch+面朝 / 空数组忽略 | unit | 同上 | ❌ Wave 0 |
| PATH-01-g | D-10 打断接管（stop 旧移动、新寻路起算） | unit | 同上 | ❌ Wave 0 |
| PATH-02 | 数据端移动入口存在且 Node 可验证（渲染端接线 Phase 4） | unit（入口冒烟） | 同上 | ❌ Wave 0 |
| （前置）L0 修复回归 | 正交/斜向/传送步 setPos 回写 | unit | `npx vitest run packages-user/data-common` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** 该任务的 vitest 文件（quick run command）
- **Per wave merge:** `npx vitest run` 全量 + `pnpm check:circular`
- **Phase gate:** 全量测试绿 + lint:user 无新错后 `/gsd-verify-work`（含 D-07 接口草案人工拍板确认项）

### Node 回放验证（双端分离约束）

- 数据端测试全部无 DOM：stub `main.replayChecking: true`；`Map.prototype.getOrInsertComputed` polyfill（既有 6 个测试文件同款）[VERIFIED]
- 成功标准 1/3（自动寻路、避障）可完全在 Node 下以 fixture 地图验证；成功标准 2（移动端点击）属 Phase 4，本阶段以"数据端入口冒烟测试"等效验证

### Wave 0 Gaps

- [ ] `packages-user/data-system/src/pathfinding/*.test.ts` — 覆盖 PATH-01-a..d、PATH-02
- [ ] `packages-user/data-state/src/heroPathfinding.test.ts` — 覆盖 PATH-01-e..g（L3 接线 + 事件派发 + 打断）
- [ ] `packages-user/data-common` L0 mover 回归测试 — Pitfall 1 修复的前置/伴随
- [ ] 测试 fixture 工厂：`MapState.fromRaw` + `TileStore.addTile` + `FaceManager.register(Dir8)` 组合（直接照抄 eventDispatch.test.ts:105-146 既有模式，无需新框架）

## Security Domain

security_enforcement 已启用（config 默认）。

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 数据端单机引擎，无身份体系 |
| V3 Session Management | no | 无会话 |
| V4 Access Control | no | 无多用户边界 |
| V5 Input Validation | yes | 寻路入口对坐标/楼层 id 做边界校验（inMap、isNil floorId），非法输入走 logger 告警 + 空路径返回（沿用 moverImpl `isNil` 判空模式） |
| V6 Cryptography | no | 无加密需求 |

### Known Threat Patterns for 数据端寻路

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 越界/负数坐标导致死循环或越界读 | Tampering/DoS | 图构建与搜索入口统一 `inMap` 守卫（IMapLayer 已提供）+ 目标格校验 |
| 自定义损失函数返回 NaN/负数破坏 Dijkstra 不变式 | Tampering | 损失值守卫（非有限数/负数 → logger 告警并按默认损失 1 或拒绝） |
| 恶意超大地图/损失函数导致主线程阻塞 | DoS | 图为网格受 width×height 上限约束；可加迭代上限（可选，草案提出） |

## Sources

### Primary (HIGH confidence)

- 本会话逐字读取的仓库源文件（全部带行号引用，见文中 VERIFIED 标签）：
  - `packages-user/data-common/src/common/mover.ts`（IObjectMovable / ObjectMoveType / IMoverController / ObjectMover.moveProgress）
  - `packages-user/data-common/src/store/types.ts`（PassBit / ITileRawData.pass / eventPass）
  - `packages-user/data-common/src/common/types.ts`（FaceDirection）、`common/faceManager.ts`（IFaceHandler）
  - `packages-user/data-common/src/event/types.ts`（EventTrigger）
  - `packages-user/data-base/src/hero/types.ts`（IHeroMoveTopImpl / HeroMoveCode / IHeroMover）
  - `packages-user/data-base/src/hero/mover.ts`（HeroMover 判定顺序）、`hero/location.ts`
  - `packages-user/data-state/src/hero/moverImpl.ts`（DefaultHeroMoveTopImpl / canPass / shouldHit / commonTrigger）
  - `packages-user/data-base/src/map/mapLayer.ts`、`map/types.ts`（IMapLayer / IGameMap / ILayerLocation / IBlockEventEnv）
  - `packages-user/data-system/src/types.ts`、`event/types.ts`、`event/system.ts`
  - `packages-user/data-state/src/core.ts`（CoreState 接线点）、`index.ts`、`ins.ts`
  - `packages/common/src/logger.ts`、`logger.json`（码位枚举）
  - `dev.md`、测试文件 ×3（eventPath / eventDispatch / mapLifecycle 模式）
- 运行时探测：`node --version`、`pnpm --version`、`npx vitest --version`、logger.json 键位枚举脚本

### Secondary (MEDIUM confidence)

- 无（外部搜索提供方全部关闭且本阶段无外部依赖问题）

### Tertiary (LOW confidence)

- Dijkstra/网格算法通识（ASSUMED A1，风险极低）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — 零新依赖，全部仓库内既有
- Architecture: HIGH — 所有关键接缝逐字读取，分层依赖由 package.json 证实
- Pitfalls: HIGH — P1 有逐字代码佐证；P2 语义链完整；P3–P7 均有源码依据

**Research date:** 2026-09-09
**Valid until:** 2026-10-09（纯仓库内研究，30 天内稳定；mover.ts 若被他人改动需复查 P1）
