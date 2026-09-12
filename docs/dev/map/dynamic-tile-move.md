# 动态图块移动系统

> 本文档为 [动态图块系统](./dynamic-tile.md) 的移动子系统设计文档，
> 重点描述双方向模型、`IDynamicMover` 计划式移动接口及执行流程。
> 本文档中新增的类型与接口同样需要添加至 `@user/data-base/src/map/types.ts`。

---

# 背景与动机

`IDynamicLayer.moveDynamicStep` / `moveDynamicWith` 是命令式简单接口，适用于
一次性的简单移动，但对以下场景力不从心：

- **后退移动**：角色面朝上、向下移动时，朝向不变但位移反向，
  单一 `FaceDirection` 参数无法同时描述朝向和移动方向；
- **连续路径中途动态追加步骤**：命令式接口执行后无法继续追加；
- **移动速度切换**：路径中途需要变速，命令式接口不支持；
- **复杂动画编排**：需要按序执行多段计划时，纯 `Promise` 链表达不够直观。

因此引入以图块为粒度绑定的 `IDynamicMover`，采用**先建计划、再执行**的设计理念，
参考 `@motajs/animate/types.ts` 的链式计划构建模式，
以及 `@user/data-state/legacy/move.ts` 中 `ObjectMoverBase` 的双方向与队列设计。

---

# 实现思路

## 1. 双方向模型

每个动态图块维护两个方向字段：

| 字段            | 含义                         | 影响                                    |
| --------------- | ---------------------------- | --------------------------------------- |
| `faceDirection` | **朝向**，视觉上「面朝哪里」 | 通过 `IRoleFaceBinder` 决定渲染图块数字 |
| `moveDirection` | **移动方向**，「向哪边走」   | 结合 `getFaceMovement` 计算位移         |

两者分离后可以表达：

- **后退**：`moveDirection = Up`，执行 `backward()` 步，
  `moveDirection = Down`，`faceDirection = Down`，位移向下，朝向同步翻转。
- **横向移动不转身**：使用 `stepFace(move, face)` 单独指定朝向，
  `moveDirection` 与 `faceDirection` 独立设置。

绝对方向步骤（传入 `FaceDirection`）默认将两者同时更新；
`forward()` 沿当前 `moveDirection` 移动并对齐 `faceDirection`；
`backward()` 将 `moveDirection` 取反并同步 `faceDirection`。

## 2. 方向步语义

绝对方向步（`IDynamicMoveStepDir` / `IDynamicMoveStepDirFace`）直接传入 `FaceDirection`：

- `step(dir, count?: number)`：追加 `count`（默认 1）个绝对方向步，`moveDirection` 和 `faceDirection` 均更新为 `dir`；
- `stepFace(move, face, count?: number)`：追加 `count`（默认 1）个绝对方向步，`moveDirection` 更新为 `move`，
  `faceDirection` 更新为 `face`——用于移动方向与朝向不一致的场景（如斜切移动保持正向）。

相对方向步（`IDynamicMoveStepSpecial`）通过独立方法构建：

- `forward(count?)`：沿当前 `tile.moveDirection` 移动，`moveDirection` 不变，
  `faceDirection` 对齐为 `moveDirection`；
- `backward(count?)`：沿 `opposite(tile.moveDirection)` 移动，`moveDirection` 取反，
  `faceDirection` 同步更新为新的 `moveDirection`，自动使用逆向动画。

## 3. DynamicMoveStep 类型

步骤类型通过 `const enum` 区分，避免字符串比较。
前进/后退方向用独立的 `DynamicSpecialStep` 枚举表示；
动画播放方向用独立的 `DynamicAnimDirection` 枚举表示，两者互不依赖：

```ts
const enum DynamicMoveStepType {
    /** 绝对方向步，同步更新 moveDirection 和 faceDirection */
    Dir,
    /** 绝对方向步，单独指定 faceDirection */
    DirFace,
    /** 速度步 */
    Speed,
    /** 纯转向步，不产生位移 */
    Face,
    /** 特殊步（前进或后退） */
    Special,
    /** 动画方向步，不影响 moveDirection/faceDirection */
    AnimDir
}

/** 特殊步方向：前进或后退 */
const enum DynamicSpecialStep {
    Forward,
    Backward
}

/** 动画播放方向：正向或逆向 */
const enum DynamicAnimDirection {
    Forward,
    Backward
}

/** 绝对方向步：move 方向既是移动方向也是朝向 */
interface IDynamicMoveStepDir {
    type: DynamicMoveStepType.Dir;
    move: FaceDirection;
}

/** 绝对方向步：move 是移动方向，face 是显式指定的朝向 */
interface IDynamicMoveStepDirFace {
    type: DynamicMoveStepType.DirFace;
    move: FaceDirection;
    face: FaceDirection;
}

/** 速度步：修改后续移动的每格耗时（单位 ms，越小越快） */
interface IDynamicMoveStepSpeed {
    type: DynamicMoveStepType.Speed;
    value: number;
}

/** 转向步：仅更新 faceDirection，不产生位移，等待渲染动画完成 */
interface IDynamicMoveStepFace {
    type: DynamicMoveStepType.Face;
    value: FaceDirection;
}

/** 特殊步：前进（Forward）或后退（Backward）。`forward(n)`/`backward(n)` 构建时 n>1 会 push n 个相同步骤 */
interface IDynamicMoveStepSpecial {
    type: DynamicMoveStepType.Special;
    direction: DynamicSpecialStep;
}

/** 动画方向步：指定后续步骤动画正向播放（Forward）还是逆向播放（Backward） */
interface IDynamicMoveAnimDir {
    type: DynamicMoveStepType.AnimDir;
    dir: DynamicAnimDirection;
}

type DynamicMoveStep =
    | IDynamicMoveStepDir
    | IDynamicMoveStepDirFace
    | IDynamicMoveStepSpeed
    | IDynamicMoveStepFace
    | IDynamicMoveStepSpecial
    | IDynamicMoveAnimDir;
```

## 4. IMoverController 接口

`IDynamicMover.start()` 返回 `IMoverController`，用于控制进行中的移动。

```ts
interface IMoverController {
    /** 本次移动是否已全部完成 */
    readonly done: boolean;
    /** 当本次移动全部步骤完成时兑现 */
    readonly onEnd: Promise<void>;
    /**
     * 向当前队列末尾追加步骤（仅在移动进行中有效，完成后追加无效）
     */
    push(...steps: DynamicMoveStep[]): void;
    /**
     * 停止移动，等待当前步骤完成后停止，返回的 Promise 在停止后兑现
     */
    stop(): Promise<void>;
}
```

## 5. IDynamicMover 接口

每个 `IDynamicTile` 持有一个**绑定**的 `IDynamicMover` 实例（`tile.mover`），
无需单独创建或管理生命周期。

### 5.1 状态读取

```ts
// 以下状态属性来自 IObjectMover<IDynamicTile>，IDynamicMover 全部继承
interface IObjectMover<T extends IObjectMovable> {
    /** 是否正在移动 */
    readonly moving: boolean;
    /** 当前朝向（与 tile.faceDirection 同步） */
    readonly faceDirection: FaceDirection;
    /** 当前移动方向（与 tile.moveDirection 同步） */
    readonly moveDirection: FaceDirection;
    /** 所属的可移动对象 */
    readonly tile: T;
    // ...
}
```

### 5.2 计划构建（链式）

所有构建方法均返回 `this`，支持链式调用。
计划在调用 `start()` 前不执行，仅追加到内部队列。

```ts
interface IDynamicMover {
    // ...
    /** 追加 count（默认 1）个绝对方向步，同步更新 moveDirection 和 faceDirection */
    step(dir: FaceDirection, count?: number): this;
    /** 追加 count（默认 1）个绝对方向步，单独指定 faceDirection（用于移动方向与朝向不一致的场景） */
    stepFace(move: FaceDirection, face: FaceDirection, count?: number): this;
    /** 追加前进步，沿当前 moveDirection 移动，faceDirection 对齐为 moveDirection */
    forward(count?: number): this;
    /** 追加后退步，moveDirection 取反，faceDirection 同步更新，自动使用逆向动画 */
    backward(count?: number): this;
    /** 追加一个速度步，改变后续移动的每格耗时（ms） */
    speed(value: number): this;
    /** 追加一个纯转向步，仅更新 faceDirection，不产生位移 */
    face(dir: FaceDirection): this;
    /** 追加一个动画方向步，控制后续步骤的动画播放方向（Forward 正向 / Backward 逆向） */
    animDir(dir: DynamicAnimDirection): this;
    /** 清空尚未执行的计划队列 */
    clear(): this;
    // ...
}
```

**用法示例**：

```ts
// 先向下走 2 步，切换为半速，再向右走 1 步
tile.mover
    .step(FaceDirection.Down, 2)
    .speed(200)
    .step(FaceDirection.Right)
    .start();

// 后退 3 步（moveDirection/faceDirection 翻转，逆向动画）
tile.mover.backward(3).start();

// 向右移动但保持朝下（如横向滑步）
tile.mover.stepFace(FaceDirection.Right, FaceDirection.Down, 2).start();
```

### 5.3 执行控制

```ts
interface IDynamicMover {
    // ...
    /**
     * 开始执行计划队列，返回控制对象。
     * 若已在移动则返回 null（不中断当前移动）。
     */
    start(): IMoverController | null;
}
```

## 6. 移动执行流程

每次 `start()` 启动后，执行器按以下总流程处理队列：

触发 `onMoveStart` → 循环每步：[
`abstract onStepStart(step, tile, mover)` 执行并返回 `code: number`（子类计算本步场景）→
触发 `IObjectMoverHooks.onStepStart(code, step, tile, mover)` 钩子（渲染预处理，此时 `tile.x/y` 为**移动前坐标**）→
等待所有 Promise →
`abstract onStepEnd(code, step, tile, mover)` 执行**逻辑效果**（子类根据 code 决定如何执行）→
触发 `IObjectMoverHooks.onStepEnd(code, step, tile, mover)` 钩子（此时 `tile.x/y` 为**移动后坐标**）
] → 触发 `onMoveEnd`。

### 6.1 绝对方向步（`DynamicMoveStepType.Dir`）

**onStepStart 阶段**（`tile.x/y` 为原始坐标）：

1. `abstract onStepStart(step, tile, mover)` 执行，子类计算本步 `code`（正常移动、碰墙等）并返回 `Promise<number>`。
2. 父类拿到 `code`，触发 `IObjectMoverHooks.onStepStart(code, step, tile, mover)` 钩子——渲染端在此阶段播放移动动画，
   可由 `step.move` 与当前 `tile.x/y` 推算目标位置。
3. `await Promise.all(promises)`——等待全部动画完成。

**onStepEnd 阶段**（逻辑效果）：

1. `abstract onStepEnd(code, step, tile, mover)` 执行——子类依据 `code` 决定本步实际效果：
   更新 `tile.moveDirection = step.move`。
2. 计算 `{dx, dy} = getFaceMovement(step.move)`，**立即**更新 `tile.x += dx`、`tile.y += dy`。
3. 同步更新 `posMap`。
4. 执行转向逻辑（见 [dynamic-tile.md §8](./dynamic-tile.md#8-转向逻辑)），
   更新 `tile.faceDirection` 与 `tile.num`。
5. 子类返回后，父类触发 `IObjectMoverHooks.onStepEnd(code, step, tile, mover)` 钩子，此时 `tile.x/y` 已为新坐标。

### 6.1.1 含显式朝向的绝对方向步（`DynamicMoveStepType.DirFace`）

与 `Dir` 步骤相同，但步骤 5 改为直接将 `tile.faceDirection` 设为 `step.face`，
并通过 `getFaceOf(tile.num, step.face)` 更新 `tile.num`，不经过 `degradeFace` 降级。

### 6.2 速度步（`DynamicMoveStepType.Speed`）

更新内部速度状态，立即生效，无位移，无需等待。

### 6.3 纯转向步（`DynamicMoveStepType.Face`）

经由 `onStepStart` 触发钩子（`tile.x/y` 不变，`step.type === DynamicMoveStepType.Face` 供渲染端区分）；
等待渲染端动画完成后，`onStepEnd` 阶段执行转向逻辑，更新 `faceDirection` 与 `tile.num`，
触发 `onStepEnd` 钩子。

### 6.4 特殊步（`DynamicMoveStepType.Special`）

**语义说明**：`forward`/`backward` 以**上一步的移动方向**（即当前 `tile.moveDirection`）为基准；
若无上一步，则回退到当前 `faceDirection`；若图块无朝向绑定，则抛出错误。

**Forward**（`DynamicSpecialStep.Forward`）：

1. `actualDir = tile.moveDirection`（不改变 moveDirection）；
2. 执行与 `Dir` 步骤相同的位移流程；
3. 步骤 2：跳过（`moveDirection` 保持不变）；
4. 步骤 5：执行转向逻辑，以 `actualDir` 更新 `tile.faceDirection` 与 `tile.num`。

**Backward**（`DynamicSpecialStep.Backward`）：

1. `actualDir = opposite(tile.moveDirection)`；
2. 在执行前临时将逆向动画标志设为开启（步骤完成后恢复）；
3. 执行与 `Dir` 步骤相同的位移流程；
4. 步骤 2：`tile.moveDirection = actualDir`；
5. 步骤 5：执行转向逻辑，以 `actualDir` 更新 `tile.faceDirection` 与 `tile.num`。

### 6.5 动画方向步（`DynamicMoveStepType.AnimDir`）

指定后续步骤动画是**正向播放**（`DynamicAnimDirection.Forward`）还是**逆向播放**（`DynamicAnimDirection.Backward`），
与图块朝向无关（朝向始终由 `faceDirection` 决定）。
修改 mover 内部的 `currentAnimDir` 状态。
渲染端在 `onStepStart` 收到 `AnimDir` 步骤时读取并更新本地动画方向状态，后续步骤的 `onStepStart` 触发时依据此状态决定播放方向。
`onStepEnd` 阶段无逻辑操作，立即完成，不影响坐标与方向。

## 7. onStepStart / onStepEnd 钩子返回值

`IObjectMoverHooks.onStepStart` 与 `onStepEnd` 均为可选钩子（`?`），返回类型为 `Promise<void>`，
执行器始终通过 `Promise.all` 等待所有订阅方完成后再继续。

关键时序：`onStepStart` 所有 Promise 兑现后，才执行逻辑效果（abstract onStepEnd）；
`onStepEnd` 全部兑现后，才进入下一步。
多个订阅方通过 `Promise.all` 并行等待，与 `forEachHook` 返回所有值的设计天然契合——
`const promises = forEachHook(hook => hook.onStepStart?.(code, step, tile, mover));`
`await Promise.all(promises);`

## 8. 与 IDynamicLayer / IDynamicTile 接口的关系

`IDynamicLayer` 和 `IDynamicTile` **仅保留 `step(dir)` 单步便捷接口**
（等价于 `tile.mover.step(dir).start()`），不再提供 `moveDynamicWith` / `moveWith` 等批量接口。
复杂移动能力（`forward`/`backward`/`animDir` 等）通过 `tile.mover` 访问。

**渲染端订阅移动事件的流程**：

1. 订阅 `IDynamicLayer.onCreateDynamicTile`；
2. 创建图块时获取 `tile.mover` 引用，直接向其添加钩子；
3. 移动事件从 `tile.mover` 触发，无需经过 `IDynamicLayer` 转发。

为此，`IDynamicMover` 扩展为可订阅对象，
实现 `IHookable<IObjectMoverHooks<IDynamicTile>>`（见接口定义汇总）。

---

# 涉及文件

## 需要修改的文件

### `@user/data-base/src/map/types.ts`

修改现有接口（移动相关新增类型已移至 `move/types.ts`）：

- [ ] `IDynamicTile` 新增 `readonly mover: IDynamicMover`
- [ ] `IDynamicTile` 已有 `readonly faceDirection: FaceDirection` 与
      `readonly moveDirection: FaceDirection`（已在主文档确认）
- [ ] `IObjectMovable` 接口（`x`、`y`、`moveDirection`、`faceDirection` 只读属性 +
      `setPos`/`setMoveDirection`/`setFaceDirection`，定义在 `dynamic-tile.md`）
- [ ] `IDynamicLayer` / `IDynamicTile` 仅保留 `step(dir)` 便捷接口，
      移除 `moveDynamicWith` / `moveDynamicStep` / `moveWith` / `moveStep`
      （主文档接口汇总需同步更新）

#### `@user/data-base/src/map/types.ts`

- [ ] `DynamicMoveStepType` `const enum`：
      含 `Dir`/`DirFace`/`Speed`/`Face`/`Special`/`AnimDir` 六个成员
- [ ] `DynamicSpecialStep` `const enum`：含 `Forward`/`Backward` 两个成员
- [ ] `DynamicAnimDirection` `const enum`：含 `Forward`/`Backward` 两个成员
- [ ] `IDynamicMoveStepDir` 接口（`type: DynamicMoveStepType.Dir`，`move: FaceDirection`）
- [ ] `IDynamicMoveStepDirFace` 接口（`type: DynamicMoveStepType.DirFace`，`move`/`face: FaceDirection`）
- [ ] `IDynamicMoveStepSpeed` 接口（`type: DynamicMoveStepType.Speed`）
- [ ] `IDynamicMoveStepFace` 接口（`type: DynamicMoveStepType.Face`）
- [ ] `IDynamicMoveStepSpecial` 接口（`type: Special`，`direction: DynamicSpecialStep`；无 `count` 字段，`forward(n)`/`backward(n)` 改为 push n 个步骤对象）
- [ ] `IDynamicMoveAnimDir` 接口（`type: DynamicMoveStepType.AnimDir`，`dir: DynamicAnimDirection`）
- [ ] `DynamicMoveStep` 联合类型（含以上六种步骤）
- [ ] `IMoverController` 接口
- [ ] `IObjectMoverHooks<T extends IObjectMovable>` 接口（含 `onMoveStart`/`onMoveEnd`/`onStepStart`/`onStepEnd`；
      `onStepStart`/`onStepEnd` 参数顺序为 `(code, step, tile, mover)`，按使用频率排列）
- [ ] `IObjectMover<T extends IObjectMovable>` 接口（含 `faceDirection`/`moveDirection` 只读属性及全部计划构建方法；`step`/`stepFace` 含 `count?` 参数）
- [ ] `IDynamicMover extends IObjectMover<IDynamicTile>`（无额外成员，继承基类全部能力；`IDynamicMoverHooks` 已移除，直接使用 `IObjectMoverHooks<IDynamicTile>`）

#### `@user/data-base/src/map/mover.ts`

- [ ] `abstract class ObjectMover<T extends IObjectMovable>` 抽象基类：
    - 实现 `IObjectMover<T>`，在此提供全部**计划构建方法**（`step`/`stepFace`/`forward`/
      `backward`/`speed`/`face`/`animDir`/`clear`/`start`）及队列执行调度逻辑；
    - 含四个**抽象方法**，子类必须实现，组成移动核心控制流：
        - `abstract onMoveStart(tile, mover): Promise<void>`: 整次移动开始时调用
        - `abstract onMoveEnd(tile, mover): Promise<void>`: 整次移动结束时调用
        - `abstract onStepStart(step, tile, mover): Promise<number>`: 单步逻辑执行前调用，
          子类计算并**返回** `code`；父类将 `code` 传给 `IObjectMoverHooks.onStepStart` 钩子后等待
        - `abstract onStepEnd(code, step, tile, mover): Promise<void>`: 单步钩子等待完成后调用，子类依据 `code` 执行本步实际逻辑效果
- [ ] `class DynamicMover extends ObjectMover<IDynamicTile> implements IDynamicMover`：
      持有 `tile: IDynamicTile` 引用，维护 `moveQueue`、`moving`、
      `faceDirection`、`moveDirection` 状态；实现四个抽象方法（含 posMap 更新、转向逻辑等）
- [ ] `DynamicTile` 类新增 `readonly mover: DynamicMover`，
      在构造时以 `this` 为参数创建

---

# 接口定义汇总

```ts
const enum DynamicMoveStepType {
    Dir,
    DirFace,
    Speed,
    Face,
    Special,
    AnimDir
}

const enum DynamicSpecialStep {
    Forward,
    Backward
}

const enum DynamicAnimDirection {
    Forward,
    Backward
}

interface IDynamicMoveStepDir {
    type: DynamicMoveStepType.Dir;
    move: FaceDirection;
}

interface IDynamicMoveStepDirFace {
    type: DynamicMoveStepType.DirFace;
    move: FaceDirection;
    face: FaceDirection;
}

interface IDynamicMoveStepSpeed {
    type: DynamicMoveStepType.Speed;
    value: number;
}

interface IDynamicMoveStepFace {
    type: DynamicMoveStepType.Face;
    value: FaceDirection;
}

/** forward(n)/backward(n) 构建时 n>1 会 push n 个相同步骤，步骤对象本身不携带 count */
interface IDynamicMoveStepSpecial {
    type: DynamicMoveStepType.Special;
    direction: DynamicSpecialStep;
}

interface IDynamicMoveAnimDir {
    type: DynamicMoveStepType.AnimDir;
    dir: DynamicAnimDirection;
}

type DynamicMoveStep =
    | IDynamicMoveStepDir
    | IDynamicMoveStepDirFace
    | IDynamicMoveStepSpeed
    | IDynamicMoveStepFace
    | IDynamicMoveStepSpecial
    | IDynamicMoveAnimDir;

interface IMoverController {
    readonly done: boolean;
    readonly onEnd: Promise<void>;
    push(...steps: DynamicMoveStep[]): void;
    stop(): Promise<void>;
}

interface IObjectMoverHooks<T extends IObjectMovable> extends IHookBase {
    onMoveStart(mover: IObjectMover<T>, tile: T): Promise<void>;
    onMoveEnd(mover: IObjectMover<T>, tile: T): Promise<void>;
    /** 触发时 tile.x/y 为移动前坐标，适合渲染端在此播放动画 */
    onStepStart?(
        code: number,
        step: DynamicMoveStep,
        tile: T,
        mover: IObjectMover<T>
    ): Promise<void>;
    /** 触发时 tile.x/y 已更新为移动后坐标 */
    onStepEnd?(
        code: number,
        step: DynamicMoveStep,
        tile: T,
        mover: IObjectMover<T>
    ): Promise<void>;
}

interface IObjectMover<T extends IObjectMovable> extends IHookable<
    IObjectMoverHooks<T>
> {
    readonly moving: boolean;
    readonly tile: T;
    readonly faceDirection: FaceDirection;
    readonly moveDirection: FaceDirection;

    step(dir: FaceDirection, count?: number): this;
    stepFace(move: FaceDirection, face: FaceDirection, count?: number): this;
    forward(count?: number): this;
    backward(count?: number): this;
    speed(value: number): this;
    face(dir: FaceDirection): this;
    animDir(dir: DynamicAnimDirection): this;
    clear(): this;
    start(): IMoverController | null;
}

// 这里的 onStepStart 不再接受 code 作为参数，因为这应当是其返回值 `Promise<number>`，
// 具体来说，这四个方法是整个移动的核心方法而非钩子，它应当提供接口让子类实现，
// 子类应当真正执行移动效果，并进行一定的控制。显然子类是没办法知道 onStepStart 中的信息的，
// 所以才提供了一个 code，用于子类向 ObjectMover 提供信息，然后父类再传递给子类，
// 从而子类了解到 onStepStart 中的信息，再进一步决定这一步真正应该如何执行。
// 而对于钩子，实际上是在子类的 onStepStart 执行完毕后进行的，所以是知道 code 的，所以才是参数。
// 你应该好好想一想这之间的关系。
// 以及子类是要求必须实现的，所以不应该会有返回 `void` 的场景，四个方法都应该返回 `Promise<void>`。
// 总的来说，父类是一个“系统级”的流程控制器，它通过这四个接口来实现真正的移动控制，
// 就像 legacy ObjectMoverBase 中的 startMove 一样。
abstract class ObjectMover<
    T extends IObjectMovable
> implements IObjectMover<T> {
    abstract onMoveStart(tile: T, mover: IObjectMover<T>): Promise<void>;
    abstract onMoveEnd(tile: T, mover: IObjectMover<T>): Promise<void>;
    /** 子类计算并返回本步 code；父类取得 code 后再触发 IObjectMoverHooks.onStepStart 钩子 */
    abstract onStepStart(
        step: DynamicMoveStep,
        tile: T,
        mover: IObjectMover<T>
    ): Promise<number>;
    /** 子类依据 code 执行本步实际逻辑效果；父类在此之后触发 IObjectMoverHooks.onStepEnd 钩子 */
    abstract onStepEnd(
        code: number,
        step: DynamicMoveStep,
        tile: T,
        mover: IObjectMover<T>
    ): Promise<void>;
    // 计划构建方法（step/stepFace/forward/backward/speed/face/animDir/clear/start）在此实现
}

// faceDirection/moveDirection 已提升至 IObjectMover，IDynamicMover 无需额外声明
// IDynamicMoverHooks 已移除，直接使用 IObjectMoverHooks<IDynamicTile>
interface IDynamicMover extends IObjectMover<IDynamicTile> {
    // 继承自 IObjectMover：moving, faceDirection, moveDirection, tile, 全部计划构建方法及钩子
}
```

---

# 问题

1. **`backward()` 的移动方向基准** ✅ 已确定

    `backward()` 以 `opposite(tile.moveDirection)` 作为移动方向（基于 `moveDirection` 取反，非 `faceDirection`）。
    `moveDirection` 更新为反向，`faceDirection` 通过转向逻辑跟随同步更新。

2. **`forward()` 是否更新 faceDirection** ✅ 已确定

    `forward()` 沿当前 `moveDirection` 移动，`moveDirection` 不变，
    `faceDirection` 通过转向逻辑对齐为 `moveDirection`。

3. **转向步触发钩子方式** ✅ 已确定

    统一经由 `onStepStart(code, step, tile, mover)` 钩子处理，在步骤逻辑执行前触发。
    渲染端通过 `step.type === DynamicMoveStepType.Face` 区分纯转向步与位移步；
    `onStepStart` 触发时 `tile.x/y` 为原始坐标，渲染端可直接读取，无需反推。
    转向逻辑（`faceDirection`/`num` 更新）在 `onStepEnd` 阶段执行。

4. **`animDir` 与渲染钩子集成** ✅ 已确定

    `onStepStart` 统一接收所有步骤，`IDynamicMoveAnimDir` 步骤本身即为信息载体。
    渲染端在 `onStepStart` 收到 `AnimDir` 步骤时更新本地动画方向状态；
    后续方向步的 `onStepStart` 触发时，渲染端依据本地状态决定动画播放方向。

5. **玩家移动与图块移动的复用** ✅ 已确定

    玩家（勇士）移动逻辑与 `IDynamicMover` 高度一致，共同抽象为
    `IObjectMover<T extends IObjectMovable>`（参考 legacy `ObjectMoverBase`，适配新 API）；
    核心抽象类为 `abstract class ObjectMover<T>`，含四个抽象方法组成控制流：
    - **计划构建方法**（`step`/`stepFace`/`forward`/`backward`/
      `speed`/`face`/`animDir`/`clear`/`start`）全部在 `ObjectMover` 基类实现，子类无需重复声明。
    - **移动流程钩子**（`IObjectMoverHooks<T>`，实现 `IHookable<IObjectMoverHooks<T>>`）：
        - `onMoveStart(mover, tile)`：整次移动队列开始时触发；
        - `onMoveEnd(mover, tile)`：整次移动队列结束时触发；
        - `onStepStart(code, step, tile, mover)`：单步开始前触发（`tile.x/y` 为移动前坐标）；
        - `onStepEnd(code, step, tile, mover)`：单步完成后触发（`tile.x/y` 已更新）；
          其中 `code: number` 标识移动场景（如碰墙、遇敌、循环地图等），由具体实现层设置。
    - **四个抽象方法**（`onMoveStart`/`onMoveEnd`/`onStepStart`/`onStepEnd`）：子类（`DynamicMover`/`HeroMover`）
      通过实现这四个方法完全控制移动行为，执行流程由 `ObjectMover` 基类统一调度。
      关键：`onStepStart` 返回 `Promise<number>`（code），父类将此 code 传给钩子后再调用 `onStepEnd(code, ...)`，
      子类在 `onStepEnd` 中依据 code 执行实际状态变更。四个方法均返回 `Promise`，无 `void` 选项。
    - **泛型参数** `T extends IObjectMovable`：`IObjectMovable` 是可移动对象的最小接口
      （`x`、`y`、`moveDirection`、`faceDirection` 只读属性 +
      `setPos`/`setMoveDirection`/`setFaceDirection` 方法），定义在 `dynamic-tile.md`；
      `IDynamicTile extends IObjectMovable`，玩家侧使用 `IHeroMovable extends IObjectMovable`。
    - **`IDynamicMover extends IObjectMover<IDynamicTile>`**：
      无额外成员，直接继承基类全部能力（含 `faceDirection`/`moveDirection` 及 `IObjectMoverHooks`）。
