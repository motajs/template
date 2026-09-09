# 寻路系统接口草案（已拍板）

> **状态：已拍板（2026-09-09）** —— 六项决策全部经用户拍板，结论逐字记录于文末「拍板记录」节；02-02/02-03 以本文档 + 拍板记录为执行依据（D-07）。
> **接口事实源：`packages-user/data-system/src/pathfinding/types.ts` 由用户亲自编写（user-owned）——02-02 与 02-03 不得创建或重写该文件，所有实现以用户编写的 types.ts 为准。**
> 依据：02-CONTEXT.md 决策 D-01…D-11、02-RESEARCH.md、02-PATTERNS.md；绑定面接口逐字引用既有代码，未做任何修改。
> 草案产出：2026-09-09（02-01 Task 1）。拍板完成：2026-09-09（02-01 Task 3，用户逐项拍板）。

## 0. 范围声明（D-11）

本阶段**只交付数据端移动入口**：寻路系统提供供渲染端后续调用的寻路 / 移动 API，全部逻辑可在 Node 环境独立验证。渲染端点击接线（点击拾取、不可达格点击反馈等 UI 行为）属 **Phase 4 渲染适配**，本阶段不做任何接线（D-11）。

## 1. 接口签名草案

> **拍板结论**：本节签名为草案参考；**最终接口签名以用户亲自编写的 `packages-user/data-system/src/pathfinding/types.ts` 为准（user-owned）**，02-02/02-03 不得创建或重写该文件。
> 以下类型与命名沿用草案形态，命名以用户 types.ts 实际内容为准。绑定面直接引用既有接口
> （`IObjectMovable`、`IMapLayer`、`ITileLocator`、`ObjectMoveStep`、`EventTrigger`），不重定义。
> 命名 / 注释 / 类型遵循 dev.md：接口 `I` 前缀大驼峰、函数类型单独 `type`、
> 对象类型单独 `interface`、jsDoc 中文注释、接口方法间空行。

```typescript
import { ITileLocator } from '@motajs/common';
import { IHeroMoveTopHandler, IMapLayer, IMapState } from '@user/data-base';
import { FaceDirection, IObjectMovable } from '@user/data-common';

/**
 * 寻路损失函数类型（已拍板，签名以用户 types.ts 为准）
 * 计算从一格移动至相邻一格的损失，默认实现为每格损失 1（D-01）
 * @param from 移动起点坐标
 * @param to 移动终点坐标
 * @returns 非负有限损失值，非法值按守卫规则处理（见第 7 节）
 */
type IPathfindingCostFunction = (from: ITileLocator, to: ITileLocator) => number;

/**
 * 通行性谓词函数类型（已拍板，签名以用户 types.ts 为准）
 * 判定在指定楼层从一格向指定方向移动一格是否可通行，
 * 语义须与 DefaultHeroMoveTopImpl.canPass 一致（事件层永远参与判定，
 * 其余层仅当 pass.onlyEvents 为真时参与）。L2 不 import L3，
 * 该谓词由 L3 接线时注入，L2 只持有此函数类型槽位
 * @param handler 通行性检查对象，与 IHeroMoveTopImpl.canPass 入参一致
 */
type IPathfindingPassPredicate = (handler: IHeroMoveTopHandler) => boolean;

/**
 * 瞬移回退策略函数类型（已拍板，签名以用户 types.ts 为准）
 * 由该函数决策瞬移是否回退为逐步寻路（D-05）
 * @param path 完整路径坐标序列，含起点
 * @param arrivals 瞬移逐步兑现时每一步会到达的位置
 * @returns `true` 表示需要回退为逐步寻路
 */
type IPathfindingFallbackPolicy = (
    path: Readonly<ITileLocator[]>,
    arrivals: Readonly<ITileLocator[]>
) => boolean;

export interface IPathfindingSystem {
    /**
     * 绑定寻路所用的地图状态对象（已拍板，签名以用户 types.ts 为准）
     * 用于按楼层 id 获取楼层与事件层；未绑定时寻路告警并返回空路径
     * @param maps 地图状态对象，传入 `null` 解绑
     */
    useMapState(maps: IMapState | null): void;

    /**
     * 绑定构建有向图所用的地图图层（已拍板，签名以用户 types.ts 为准，D-03）
     * 通常绑定事件层；图仅包含从当前位置可达的位置（D-02）
     * @param layer 地图图层对象，传入 `null` 解绑
     */
    useMapLayer(layer: IMapLayer | null): void;

    /**
     * 绑定寻路移动对象（已拍板，签名以用户 types.ts 为准，D-03）
     * 可绑定勇士位置或任意 `IObjectMovable`（如动态图块、跟随者）
     * @param movable 移动对象，传入 `null` 解绑
     */
    useMovable(movable: IObjectMovable | null): void;

    /**
     * 注入自定义损失函数（已拍板，签名以用户 types.ts 为准，D-01）
     * 未注入时使用默认实现：每格损失 1
     * @param cost 损失函数，传入 `null` 恢复默认
     */
    useCostFunction(cost: IPathfindingCostFunction | null): void;

    /**
     * 注入通行性谓词（已拍板，签名以用户 types.ts 为准）
     * 未注入时使用 PassBit 掩码默认判定（不含多层 onlyEvents 语义）；
     * 推荐由 L3 注入与 DefaultHeroMoveTopImpl.canPass 同源的谓词，
     * 保证图边判定与逐步移动判定单一事实源
     * @param predicate 通行性谓词，传入 `null` 恢复默认
     */
    usePassPredicate(predicate: IPathfindingPassPredicate | null): void;

    /**
     * 注入瞬移回退策略（已拍板，签名以用户 types.ts 为准，D-05）
     * 未注入时使用默认实现：路径上存在事件即回退为逐步寻路
     * （事件可能改变状态，瞬移会跳过副作用）
     * @param policy 回退策略函数，传入 `null` 恢复默认
     */
    useFallbackPolicy(policy: IPathfindingFallbackPolicy | null): void;

    /**
     * 仅获取从当前位置至目标位置的最小损失路径（已拍板，签名以用户 types.ts 为准，D-06）
     * 不产生任何移动
     * @param target 目标坐标
     * @returns 路径坐标序列（含起点与终点）；
     *          不可达或输入非法时为空数组（D-08 情况 2）
     */
    getPath(target: ITileLocator): Readonly<ITileLocator[]>;

    /**
     * 逐步寻路至目标位置（已拍板，签名以用户 types.ts 为准，D-04 / D-09）
     * 复用现有 hero mover 逐步执行，每步走 enter/leave/hit 钩子，
     * 途经事件自然触发；有向图上逐步搜索即自然避障（D-02）
     * @param target 目标坐标
     * @returns 移动控制器；无法寻路、无路径或已有移动进行中时返回 `null`
     */
    moveTo(target: ITileLocator): Readonly<IMoverController> | null;

    /**
     * 瞬移至目标位置（已拍板，签名以用户 types.ts 为准，D-04）
     * 瞬移前经回退策略判定，判定需要回退则自动退为逐步寻路
     * @param target 目标坐标
     * @returns 移动控制器；无法寻路、无路径或已有移动进行中时返回 `null`
     */
    teleportTo(target: ITileLocator): Readonly<IMoverController> | null;

    /**
     * 打断当前自动寻路（已拍板，签名以用户 types.ts 为准，D-10）
     * 新的方向输入或新的寻路调用可随时打断并接管；
     * 兑现时序已拍板：选项 1（见第 5 节）
     */
    interrupt(): Promise<void>;
}
```

**语义补充说明（已拍板）：**

- **不可达目标双语义（D-08）**：目标本身为 no-pass 类图块且四周有可达相邻格 → 移动至该相邻格、勇士面朝目标、触发目标 OnTouch（派发方案见第 3 节）；其他情况 → 忽略本次寻路移动，`getPath` 返回空数组、`moveTo`/`teleportTo` 返回 `null`。
- **有向图（D-02）**：图仅包含从当前位置可到达的位置；每条边 = 从 A 向方向 d 走一步，需 A 的 `outPass` 含 d 位且 B 的 `inPass` 含 opposite(d) 位（掩码语义见 02-RESEARCH Pattern 2），单向通行由掩码不对称天然产生。
- **逐步执行（D-09）**：路径翻译为 `ObjectMoveType.Dir` 步骤队列，复用 `HeroMover` + `DefaultHeroMoveTopImpl`（Phase 1 source-aware 事件链）；`ObjectMoveStep` 直接引用既有类型，不重定义。
- **打断入口（D-10）**：`interrupt()` 暴露给玩家输入接管；寻路系统内部同时持有当前 `IMoverController` 引用以识别"移动已自然终止"（`HeroMover.onStepEnd` 在 CannotMove/Stop/Hit 时自行 stop）。
- **图构建时机**：默认每次寻路动态构建、不缓存（数据端状态可变——敌人/门/道具），此为 AI 自主裁量项（CONTEXT「agent's Discretion」），如用户有缓存需求请在拍板时说明。

## 2. 文件归属提案（已拍板：按草案原样，types.ts 除外）

> **拍板结论**：文件归属按草案原样（L2 `packages-user/data-system/src/pathfinding/` 的 graph/system/index + L3 `packages-user/data-state/src/pathfinding/heroPathfinding.ts`）；**唯一例外：`types.ts` 由用户提供**（见拍板记录第 1 项），02-02/02-03 不得创建或重写。

依据 02-RESEARCH 分层论证（L2 禁 import L3，防循环依赖；`IMapLayer` 在 L1、`IObjectMovable` 在 L0，L2 可同时引用二者）：

| 层级 | 文件 | 内容 |
| --- | --- | --- |
| L2 `packages-user/data-system/src/pathfinding/` | `types.ts` | `IPathfindingSystem`、损失 / 回退 / 谓词函数类型 |
| | `graph.ts` | `IMapLayer` → 有向图构建（含边界守卫，见第 7 节） |
| | `system.ts` | 寻路系统实现（绑定 / 最小损失搜索 / 移动方式决策） |
| | `index.ts` | barrel 导出 |
| L3 `packages-user/data-state/src/pathfinding/` | `heroPathfinding.ts` | hero 接线：注入默认通行性谓词与回退策略、OnTouch 派发执行、打断接管 |
| 测试 | `packages-user/data-system/src/pathfinding/*.test.ts`、`packages-user/data-state/src/heroPathfinding.test.ts` | 覆盖 PATH-01 各行为（Wave 0 计划内补齐） |
| 配置 | `packages/common/src/logger.json` | 集中登记新日志码（error ≥65、warn ≥173） |

修改面：`data-system/src/index.ts` 追加 pathfinding barrel 导出；`data-state/src/index.ts` 追加寻路接线导出；`data-state/src/core.ts` 在 `useTopImplementation` 接线点之后追加寻路系统初始化。**用户可调整以上归属**（例如将默认回退策略实现放在 L2 或 L3），拍板时注明即可。

## 3. D-08 OnTouch 派发两方案（已拍板：触发语义由用户指定，见拍板记录第 4 项）

> **拍板结论（用户原话）**："如果是由 CannotIn 或 CannotOut 导致无法从一格到另一格，无论目标是不是 no pass，都不应该触发 hit，只有 CannotIn 和 CannotOut 允许到达，且目标位置是 no pass 时才触发。" —— 即 **hit/OnTouch 的触发条件 = 通行掩码（CannotIn/CannotOut）允许到达 且 目标位置为 no-pass；掩码导致的不可达一律不触发**。实现机制（直接派发 OnTouch 或撞击步）必须与该触发条件语义一致。

目标场景：目标格本身是 no-pass 类图块且四周存在可达相邻格（D-08 情况 1）——移动到相邻格后面朝目标，并触发目标位置的 OnTouch 触发器（走 Phase 1 事件链路）。

### 方案 A：到达相邻格后直接派发 OnTouch（推荐）

- **流程**：寻路至相邻格 → 勇士面朝目标（`ObjectMoveType.Face` 步或 `mover.setFaceDir`）→ 构造 `IGameEventInvocation`（`trigger = EventTrigger.OnTouch`、`heroLocator = 相邻格`、`triggerLocator = 目标格`）→ 调 `executor.execute`。
- **env 构造**：逐字复刻 `moverImpl.ts:206-222` `commonTrigger` 形态——收集目标格点事件（`event.getPointEvent`）与静态 / 动态图块事件（`tileEvent().get()`），按 priority 降序排序，逐个构造 `IBlockEventEnv` 后一次 `execute` 调用。
- **优点**：语义直给，OnTouch 与「触碰」语义精确对应；不依赖 mover 撞击路径；`inPass=0` 的真 no-pass 格同样能触发 OnTouch。
- **缺点**：绕开 mover 链路，派发时序由寻路系统自行负责（需保证在移动完全结束后派发）。

### 方案 B：追加朝向目标的撞击步，复用 hit 链

- **流程**：路径终点后追加一步朝向目标的 `Dir` 步 → mover 链路 `canPass=false` → `HeroMoveCode.CannotMove` → `topImpl.cannotEnter()`。
- **P2 结论（对方案 B 不生效的原因）**：撞击触发（`Hit` → `topImpl.hit()` → OnTouch 派发）只在 `canPass=true` 且 `eventPass=false` 的格上发生（`data-base/hero/mover.ts:183-190` 判定顺序 + `moverImpl.ts:127-141` `shouldHit`）；`inPass=0` 的真 no-pass 格走 `CannotMove → cannotEnter()`，而 `cannotEnter` 当前为空实现（`moverImpl.ts:259-263`「新事件触发器没有无法进入的对应项，保留空实现以满足移动接口」）→ **方案 B 对 D-08 的目标场景（no-pass 目标格）不生效**。
- **若坚持选 B**：须同时修改 `cannotEnter` 语义（新增 OnTouch 派发或等价行为），影响面扩至 L0/L3 移动链路，且「走入可通行格」与「触碰 no-pass 格」的触发条件需重新对齐。

**推荐：方案 A**。~~由用户拍板（D-08）~~ → **已拍板**：用户指定触发语义（掩码允许到达 + 目标 no-pass 才触发；掩码不可达一律不触发），实现机制须与该语义一致——方案 A 直派 OnTouch 与该语义一致，可按 A 落地；方案 B 的 hit 链（`inPass=0` 走 CannotMove）不得作为掩码不可达时的触发路径。

## 4. P1 缺陷调查：mover.ts:651 坐标回写条件（`&&` 疑为 `||`）

> **拍板结论：go** —— 用户确认 `&&` 为缺陷，授权 02-02 将 651 行条件改为 `||` 语义，并翻绿 mover.test.ts 的 4 个回归用例（见拍板记录第 3 项）。

**逐字引用**（`packages-user/data-common/src/common/mover.ts:648-654`，条件位于 **651 行**）：

```typescript
const loc = await this.onStepEnd(code, step, this.tile, controller);
const before: ITileLocator = { x: this.tile.x, y: this.tile.y };
const curr: ITileLocator = { x: loc.x, y: loc.y };
if (this.tile.x !== loc.x && this.tile.y !== loc.y) {   // ← 651 行：&& 疑为 ||
    this.tile.setPos(loc.x, loc.y);
}
```

**推理链**：

1. 逐步寻路（D-09）产生的每一步都是 `ObjectMoveType.Dir` 正交步，只改变 x 或 y 其中一轴。
2. 正交步后 `loc` 仅一轴与 `this.tile` 不同 → `this.tile.x !== loc.x && this.tile.y !== loc.y` **恒为 false**。
3. `setPos` 不被调用 → `this.tile.x/y` 永不更新（渲染端现走 legacy mover，新 mover 尚无多步消费者，故此缺陷未被现有功能暴露）。
4. 多步寻路自第二步起，以**陈旧原点**计算 nextLoc（每步的移动结果基于上一步回写失败后的旧坐标），整条路径走崩。
5. `onStepSettled` 收到的 `before`/`curr` 与实际位置不符，leave/enter 事件派发坐标错误。

**修复提案**：651 行 `&&` → `||`（任一轴变化即回写坐标）。斜向步与传送步双轴均变化，`||` 下行为与现状一致；正交步新增回写，属缺陷修复而非行为变更（回归用例已铺设于 `mover.test.ts`，skip 状态，修复后翻绿）。

**go/no-go 问题**：

- **go**——确认 `&&` 为手误，授权 02-02 将该行改为 `||` 并翻绿回归用例；
- **no-go**——若该条件属有意设计（如「仅双轴同时变化才回写」），请用户给出**替代坐标回写语义**；否则逐步寻路无法成立（每多走一步，位置误差累积一格）。

## 5. 打断时序两选项（D-10，已拍板：选项 1）

> **拍板结论**：选项 1 —— `stop()` 后 await 兑现，再查新位置起新寻路（无竞态，最多延迟一步）。

**既有机制约束（逐字）**：

- `mover.start()` 在移动中返回 `null`（`mover.ts:669-670` `if (this.moving) return null;`）→ 打断接管必须先 stop 旧移动再 start 新移动。
- `IMoverController.stop()` 在**当前步完成后**才兑现（`mover.ts:695-698`，置 `shouldStop` 并返回 `onEnd`）。
- `HeroMover.onStepEnd` 在 CannotMove/Stop/Hit 时自行 `controller.stop()`，且该处不能 await（`data-base/hero/mover.ts:223-243` 注释明示会卡死）。

### 选项 1：`stop()` 后 await 兑现，再查新位置起新寻路（推荐）

- **流程**：持有当前 controller → `controller.stop()` → `await` 兑现 → 读取移动对象最新位置 → 以新位置起算新寻路 → `start`。
- **优点**：新寻路必然以兑现后的真实坐标起算，无竞态、无双移动并存、无回调重入问题。
- **缺点**：新寻路启动最多延迟一个步时长；await 期间到达的新输入需合并或丢弃（按「最新意图优先」处理）。

### 选项 2：`onEnd` 回调驱动

- **流程**：`controller.stop()` 不 await → `controller.onEnd.then(() => 起新寻路)`。
- **优点**：响应更快，不阻塞调用方。
- **缺点**：需自行处理回调竞态——多次接管时旧回调作废、回调执行期间再次打断的重入、回调与自然终止（CannotMove/Stop/Hit）的重复触发，实现复杂度显著更高。

**推荐：选项 1**（时序正确性优先；一步时延在魔塔节奏下可接受）。**已拍板：选项 1**。

## 6. 图方向性选项（已拍板：仅 4 正交向）

> **拍板结论**：仅 4 正交向（与 PassBit 四位掩码一致；不含斜向）。

### 选项 1：仅 4 正交向（推荐）

- 与 `PassBit` 四位掩码（Up/Right/Down/Left，`store/types.ts:27-36`）完全一致，边判定无需新掩码语义。
- `DefaultHeroMoveTopImpl.canPass` 对四个斜向**直接放行不做掩码判定**（`moverImpl.ts:67-75`）→ 若建斜向边，图边语义与移动链路判定语义冲突（斜向 Dir 步 `canPass` 直接放行等于斜向穿墙）。
- 逐步寻路每步翻译为 `Dir` 步，4 向与既有 `Dir` 步语义完全一致，无需改动移动链路。
- **缺点**：斜向相邻目标点路径更长（曼哈顿折线）。

### 选项 2：含 8 向

- 斜向直达，路径更短，视觉上更自然。
- **代价**：需为斜向定义 `outPass`/`inPass` 掩码语义（`PassBit` 仅 4 位，需扩展枚举与图块数据结构）；须修改 `canPass` 对斜向的直接放行行为，影响 L0/L1/L3 多处判定语义与既有存档数据；影响面大，建议不纳入本阶段。

**推荐：仅 4 正交向**。**已拍板：仅 4 正交向**。

## 7. 边界守卫与损失值守卫要求（威胁缓解 T-02-01 / T-02-02）

落点为本草案声明的接口行为，实现于 02-02/02-03：

- **图构建与搜索入口（T-02-01）**：`IMapLayer.inMap` 边界守卫 + `isNil` 判空（楼层 id、图层、事件层）；非法输入（越界坐标、缺失楼层、畸形掩码）→ `logger.warn(新数字码)` 后返回空路径，不抛异常、不死循环。
- **损失值守卫（T-02-02）**：自定义损失函数返回非有限数（NaN/Infinity）或负数 → `logger.warn(新数字码)` 并按默认损失 1 处理，保证 Dijkstra 非负权不变式。
- 新日志码在 `packages/common/src/logger.json` 集中登记：**新 error 码从 65 起、新 warn 码从 173 起**（本阶段一次性登记，避免撞码）。

## 拍板记录（2026-09-09，用户逐项拍板，原话忠实整理）

> 以下为用户对六项决策的逐项结论（原话整理，忠实记录）；执行者已按结论同步标注上文各节。**02-02/02-03 以本记录为执行依据。**

1. **接口签名清单**（主接口命名、方法签名、注入槽位命名、损失 / 回退 / 谓词函数类型签名）：**用户将亲自编写 `packages-user/data-system/src/pathfinding/types.ts` —— 该文件是接口事实源（user-owned）。02-02 与 02-03 不得创建或重写该文件；所有实现以用户编写的 types.ts 为准。**
2. **文件归属层**（L2/L3 文件放置提案或调整）：**按草案原样**（L2 `packages-user/data-system/src/pathfinding/` 的 graph/system/index + L3 `packages-user/data-state/src/pathfinding/heroPathfinding.ts`），但 **types.ts 由用户提供**（见第 1 项）。
3. **P1 修复 go/no-go**（mover.ts:651 条件是否确认为缺陷并授权改为 `||`）：**go** —— 授权 02-02 将 `packages-user/data-common/src/common/mover.ts:651` 的条件 `this.tile.x !== loc.x && this.tile.y !== loc.y` 修复为 `||` 语义，并翻绿 mover.test.ts 的 4 个回归用例。
4. **D-08 OnTouch 派发**（方案 A 直派 executor / 方案 B 撞击步）——**用户原话**："如果是由 CannotIn 或 CannotOut 导致无法从一格到另一格，无论目标是不是 no pass，都不应该触发 hit，只有 CannotIn 和 CannotOut 允许到达，且目标位置是 no pass 时才触发。" —— 即：hit/OnTouch 的触发条件 = 通行掩码（CannotIn/CannotOut）允许到达 且 目标位置为 no-pass；**掩码导致的不可达一律不触发**。实现机制（直接派发 OnTouch 或撞击步）必须与该触发条件语义一致。
5. **打断时序**（选项 1 stop 后 await 兑现 / 选项 2 onEnd 回调驱动）：**选项 1** —— `stop()` 后 await 兑现，再查新位置起新寻路（无竞态，最多延迟一步）。
6. **图方向性**（仅 4 正交向 / 含 8 向）：**仅 4 正交向**（与 PassBit 四位掩码一致；不含斜向）。
