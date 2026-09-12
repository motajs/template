# 需求综述

对勇士跟随者相关接口进行结构性重构。核心动机是让跟随者复用勇士已有的位置与渲染接口（`IHeroLocation`、`IHeroRendering`），而非为跟随者定义独立的位置/渲染类型。这样跟随者与勇士共享同一套移动与渲染模型，简化接口层级，避免重复定义。

重构四个接口：`IHeroLocation`、`IHeroRendering`、`IHeroFollower`、`IHeroFollowersController`。前两者是勇士与跟随者共用的基础接口，后两者专属于跟随者管理。同时需要将旧的 `HeroMoveController` 类拆分为 `HeroLocation`、`HeroRendering`、`HeroFollowersController` 三个独立类，`HeroFollower` 为新实现类，并修改 `HeroState` 适配新接口。

# 接口设计分析

## IHeroLocation

### 接口综述

勇士位置接口，代表一个可移动对象在游戏世界中的坐标与朝向，并挂载移动器负责移动控制。该接口继承 `ISaveableContent<IHeroLocationSave>` 实现存档读档，继承 `IObjectMovable` 获得基础位置读写能力。存档格式为 `IFacedTileLocator`（包含 `x`、`y`、`direction`）。移动能力由 `IObjectMover<this>` 提供，支持行走、跳跃、瞬移、朝向控制等全部需求。

### 接口分析

- `IHeroLocation.mover`：预期频率**高频**。几乎所有移动操作都经由 `mover` 进行，在剧情演出与逻辑中频繁出现。典型使用场景：演出中让角色沿指定路线移动。

## IHeroRendering

### 接口综述

勇士渲染信息接口，存在于数据端，存放无需进入渲染端即可管理的渲染相关数据。当前仅包含透明度（`alpha`），后续可能扩展。继承 `ISaveableContent<IHeroRenderingSave>` 实现存档读档，继承 `IHookable<IHeroRenderingHooks>` 支持透明度变化时触发回调。旧实现中的 `image` 作为纯渲染端概念被移除。

### 接口分析

- `IHeroRendering.alpha`：预期频率**低频**。直接读取透明度值的需求极少。
- `IHeroRendering.setAlpha`：预期频率**低频**。设置透明度仅在特殊效果中出现，一座塔中调用次数有限。

## IHeroFollower

### 接口综述

跟随者接口，包含跟随者的渲染信息与位置信息。直接复用 `IHeroRendering` 和 `IHeroLocation`，使跟随者拥有与勇士完全一致的移动与渲染能力。存档格式 `IHeroFollowerSave` 嵌套包含 `IHeroRenderingSave` 和 `IHeroLocationSave`。对比旧 `IHeroFollower = { num, identifier, alpha }` 的纯数据结构，新接口让跟随者从静态数据升级为拥有完整移动能力的独立对象。

### 接口分析

- `IHeroFollower.rendering`：预期频率**低频**。
- `IHeroFollower.location`：预期频率**低频**。

> 跟随者本身就是一个使用场景极低的需求，大多数游戏中都不会使用到一两次，所以几乎所有跟随者相关接口都应该是低频。

## IHeroFollowersController

### 接口综述

跟随者控制器接口，负责跟随者的增删查改与聚集操作。继承 `IHookable<IHeroFollowersControllerHooks>`，提供添加、移除、聚集三个事件的钩子支持。对比旧实现：索引取代 `identifier` 作为查找方式，`setFollowerAlpha` 移除（改为通过 `follower.rendering.setAlpha` 操作），`addFollower` 的 `num` 参数合并了旧的图块数字与标识符。

### 接口分析

- `IHeroFollowersController.addFollower`：预期频率**低频**。
- `IHeroFollowersController.getFollower`：预期频率**低频**。
- `IHeroFollowersController.getFollowersById`：预期频率**低频**。
- `IHeroFollowersController.getAllFollowers`：预期频率**低频**。
- `IHeroFollowersController.removeFollower`：预期频率**低频**。
- `IHeroFollowersController.removeAllFollowers`：预期频率**低频**。
- `IHeroFollowersController.gatherFollowers`：预期频率**低频**。
- `IHeroFollowersController.gatherFollowersSync`：预期频率**低频**。

### 预期体量

预期代码体量合计约 250–300 行。分析如下：

- `HeroLocation`：需实现 `IObjectMovable` 和 `ISaveableContent`，并创建内部 `ObjectMover` 子类，预计 70–90 行。
- `HeroRendering`：仅管理 `alpha` 的存取和钩子触发，预计 25–35 行。
- `HeroFollower`：组合 `HeroRendering` 和 `HeroLocation` 并实现存档读档，预计 35–45 行。
- `HeroFollowersController`：维护跟随者列表和增删查改聚集操作，预计 120–150 行。

# 涉及文件

## 需要修改的文件

### `@user/data-base/hero/types.ts`

- [x] 重构 `IHeroLocation` 接口：改为继承 `ISaveableContent<IHeroLocationSave>` 与 `IObjectMovable`，仅保留 `mover` 成员。
- [x] 新增 `IHeroLocationSave` 类型别名。
- [x] 重构 `IHeroRendering` 接口：新增继承 `ISaveableContent<IHeroRenderingSave>` 与 `IHookable<IHeroRenderingHooks>`。
- [x] 新增 `IHeroRenderingSave` 接口。
- [x] 新增 `IHeroRenderingHooks` 接口。
- [x] 新增 `IHeroFollowerSave` 接口。
- [x] 重构 `IHeroFollower` 接口：改为组合 `rendering` 与 `location`，继承 `ISaveableContent<IHeroFollowerSave>`。
- [x] 重构 `IHeroFollowersController` 接口：修改为上文中的新设计。
- [x] 新增 `IHeroFollowersControllerHooks` 接口。
- [x] 修改 `IHeroState` 接口：新增 `location`、`rendering`、`followers` 成员，移除旧的 `mover`、`attachMover`、`getHeroMover`。
- [x] 修改 `IHeroStateSave`：`locator` 类型改为 `IHeroLocationSave`，`followers` 类型改为 `readonly IHeroFollowerSave[]`。
- [ ] 删除旧的 `IHeroMoveController`、`IHeroMoveControllerHooks` 接口及旧 `IHeroFollower`、`HeroAnimateDirection` 枚举。

### `@user/data-base/hero/mover.ts`

删除此文件，内容拆分至 `location.ts`、`rendering.ts`、`followersController.ts`。

### `@user/data-base/hero/location.ts`

新建文件。

- [ ] 实现 `HeroLocation` 类：基于新 `IHeroLocation` 接口。
- [ ] 内部创建 `ObjectMover<this>` 子类实例，挂载为 `mover`。

### `@user/data-base/hero/rendering.ts`

新建文件。

- [ ] 实现 `HeroRendering` 类：基于新 `IHeroRendering` 接口。
- [ ] 实现 `setAlpha`：更新值并触发 `onSetAlpha` 钩子。

### `@user/data-base/hero/follower.ts`

新建文件。

- [ ] 实现 `HeroFollower` 类：组合 `HeroRendering` 与 `HeroLocation` 实例，实现新 `IHeroFollower` 接口。
- [ ] 内部保存 `num`，供 `getFollowersById` 查询匹配。

### `@user/data-base/hero/followersController.ts`

新建文件。

- [ ] 实现 `HeroFollowersController` 类：基于新 `IHeroFollowersController` 接口。
- [ ] 内部持有勇士 `IHeroLocation` 引用，供聚集操作使用。
- [ ] 实现 `addFollower(num)`：创建 `HeroFollower`，加入列表，触发 `onAddFollower` 钩子。
- [ ] 实现 `getFollower(index)`：按索引返回跟随者，越界返回 `null`。
- [ ] 实现 `getFollowersById(num)`：返回匹配 `num` 的 `[index, follower]` 迭代器。
- [ ] 实现 `getAllFollowers()`：返回跟随者列表。
- [ ] 实现 `removeFollower(index)`：按索引移除跟随者，触发 `onRemoveFollower` 钩子，动画结束后兑现。
- [ ] 实现 `removeAllFollowers()`：清空跟随者列表，触发钩子，动画结束后兑现。
- [ ] 实现 `gatherFollowers()`：将所有跟随者移动至勇士位置并同步朝向，动画结束后兑现。
- [ ] 实现 `gatherFollowersSync()`：立即将所有跟随者瞬移至勇士位置并同步朝向。

### `@user/data-base/hero/state.ts`

修改 `HeroState` 类。

- [ ] 修改构造函数参数并新增 `location`、`rendering`、`followers` 成员，替代旧的 `mover`。
- [ ] 删除 `attachMover`、`getHeroMover` 方法。
- [ ] 修改 `saveState`：通过 `location.saveState`、`rendering.saveState` 及各跟随者的 `saveState` 获取存档数据。
- [ ] 修改 `loadState`：通过 `location.loadState`、`rendering.loadState` 恢复位置与渲染，重建跟随者列表。

### `@user/data-base/hero/index.ts`

- [ ] 新增导出 `location.ts`、`rendering.ts`、`follower.ts`、`followersController.ts`。
- [ ] 移除 `mover.ts` 的导出。
