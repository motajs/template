# 需求综述

动态图块移动功能完成后，发现 `FaceDirection` 朝向相关操作（位移、反方向、旋转方向、降级）分散在独立工具函数中（`getFaceMovement`、`nextFaceDirection`、`degradeFace` 等），缺乏统一抽象，导致调用点分散、扩展性不足（例如：四方向与八方向切换时需要手动处理，不同移动场景难以共享同一套逻辑）。

目标是设计一套统一的朝向管理接口：`IFaceHandler<T>` 代表一组朝向并提供相应操作，`IFaceManager` 作为注册中心管理多个 handler，同时内置两个 handler 分别对应四方向和八方向。新接口位于 `@user/data-base/src/common/`，与 `FaceDirection` 同包，同时取代现有的 `DirectionMapper`。

# 实现思路

## 1. 设计 IFaceHandler 接口

`IFaceHandler<T extends number>` 代表**一组朝向**，泛型 `T` 表示本组的朝向类型（通常为 `FaceDirection`，也可以是自定义枚举以支持拓展）。内部隐含一个该组支持的方向集合，通过 `directions` 成员暴露。对于不在集合内的输入方向，通过 `degrade` 方法将其映射到集合内最合适的方向，其余操作方法在调用时**均先执行 degrade**。

`mapDirection` 同时取代 `DirectionMapper.map()` 的功能，不再需要单独维护 `DirectionMapper`。

主要成员与方法：

- `degrade(dir: number): T`：将任意朝向值（含其他枚举类型或 `FaceDirection`）降级为本组支持的方向。对于无法合理降级的方向（包括 `Unknown`），返回 `FaceDirection.Unknown`（数值 `0`，兼容所有 `T`）。

- `movement(dir: number): IFaceDescriptor`：获取指定方向的坐标偏移量，输入先经过 `degrade`，`Unknown` 返回 `{ x: 0, y: 0 }`。

- `move(dir: number, count: number): IFaceDescriptor`：获取指定方向走 `count` 步的坐标偏移量，等价于 `movement * count`。`count` 允许为负数，表示反向位移。输入先经过 `degrade`。

- `opposite(dir: number): T`：获取本组内的反方向，输入先经过 `degrade`，`Unknown` 返回 `Unknown`。

- `next(dir: number, anticlockwise?: boolean): T`：在本组方向集合内，顺时针（默认）或逆时针旋转一步，输入先经过 `degrade`，`Unknown` 返回 `Unknown`。

- `mapDirection(): Iterable<T>`：迭代本组支持的所有朝向，包含 `Unknown`（其与其他方向一视同仁，不作特例处理）。

- `mapMovement(): Iterable<[T, IFaceDescriptor]>`：迭代本组所有朝向及其对应的坐标描述器，包含 `Unknown`（对应 `{ x: 0, y: 0 }`）。

## 2. 设计 IFaceManager 接口

`IFaceManager` 是 handler 的注册中心，同时支持数字 key 与字符串 id 两种注册与查找方式。数字 key 适合内置组的高频调用，字符串 id 适合使用频率较低的自定义场景：

- `register(group: number, handler: IFaceHandler<number>): void`：以数字 key 注册一个 handler。
- `registerById(id: string, handler: IFaceHandler<number>): void`：以字符串 id 注册一个 handler。
- `get<T extends number>(group: number): IFaceHandler<T> | null`：按数字 key 查找 handler，未找到返回 `null`。
- `getById<T extends number>(id: string): IFaceHandler<T> | null`：按字符串 id 查找 handler，未找到返回 `null`。

内置的数字 key 组用新增的 `InternalFaceGroup` 枚举标识（与现有的 `InternalDirectionGroup` 风格一致）。

## 3. 内置 Handler 实现

### Dir8FaceHandler（八方向）

- `directions`：包含全部八个有效方向与 `Unknown`，共九个成员。
- `degrade`：直接返回输入（转为 `T`），无需降级。
- `next`：`Unknown` 返回 `Unknown`；按 45° 步进，顺时针顺序：Up → RightUp → Right → RightDown → Down → LeftDown → Left → LeftUp → Up。
- `opposite`：`Unknown` 返回 `Unknown`；Up↔Down，Left↔Right，LeftUp↔RightDown，RightUp↔LeftDown。
- `movement`：与现有 `getFaceMovement` 一致。

### Dir4FaceHandler（四方向）

- `directions`：包含 Up、Down、Left、Right 四个方向与 `Unknown`，共五个成员。
- `degrade`：四方向不变；斜向降级为水平分量（LeftUp/LeftDown → Left，RightUp/RightDown → Right）；`Unknown` → `Unknown`。与现有 `degradeFace` 行为一致。
- `next`：先 degrade，`Unknown` 返回 `Unknown`；再按 90° 步进，顺时针：Up → Right → Down → Left → Up。
- `opposite`：先 degrade，`Unknown` 返回 `Unknown`；Up↔Down，Left↔Right。
- `movement`：先 degrade，再返回偏移量。

## 4. 实现 FaceManager 类

实现 `IFaceManager`，不导出全局单例，应将实例挂载到游戏实例下。两个内置 handler（`Dir8FaceHandler` 与 `Dir4FaceHandler`）不在构造时注册，而在游戏实例初始化阶段注册，key 分别为 `InternalFaceGroup.Dir8` 和 `InternalFaceGroup.Dir4`。

## 5. 现有代码处理

- 现有 `getFaceMovement`、`nextFaceDirection`、`degradeFace`、`fromDirectionString` 等工具函数**暂时保留**，不做删改；新代码直接使用新接口，旧代码的迁移视后续情况另行处理。
- `@motajs/common` 中的 `DirectionMapper` 及 `IDirectionMapper` 接口将被废弃，其调用方（如 `range.ts`）的迁移视后续情况另行处理。

# 涉及文件

## 需要修改的文件

### `@user/data-base/src/common/faceManager.ts`（新增文件）

- [ ] 新增 `InternalFaceGroup` 枚举：包含 `Dir4` 与 `Dir8` 两个成员，作为 `IFaceManager` 的内置数字 key
- [ ] 新增 `IFaceDescriptor` 接口：描述一个方向的坐标增量，包含 `x` 与 `y` 两个只读成员
- [ ] 新增 `IFaceHandler<T extends number>` 接口：包含 `degrade`、`movement`、`move`、`opposite`、`next`、`mapDirection`、`mapMovement` 七个成员
- [ ] 新增 `IFaceManager` 接口：包含 `register`、`registerById`、`get`、`getById` 四个方法
- [ ] 实现 `Dir8FaceHandler` 类（`implements IFaceHandler<FaceDirection>`）
- [ ] 实现 `Dir4FaceHandler` 类（`implements IFaceHandler<FaceDirection>`）
- [ ] 实现 `FaceManager` 类（`implements IFaceManager`）

### `@user/data-base/src/common/index.ts`

- [ ] 导出新增的枚举、接口与类
