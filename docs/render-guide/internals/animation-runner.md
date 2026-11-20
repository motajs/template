# 动画执行器

动画执行器 `Animater` 实现 `IAnimater`，负责把多个动画对象的多个步骤组织成一条时间线。它关心的是「谁在第几步动、下一步什么时候开始」，而不是单个数值的平滑过渡；一个数从当前值靠近目标值，用[渐变执行器](./animation-transition.md)。

## 前置知识

阅读本篇前，建议先读完：

- [动画曲线](./animation-curves.md)
- [动画激励](./animation-excitation.md)
- [动画](../advanced/animation.md)
- [响应式](../advanced/reactivity.md)

## 获取执行器与激励接入

执行器自己不产生时间：它只接收外部传来的时间戳，再据此推进计划。推动它的对象叫**激励源**：例如 `RafExcitation` 每帧把当前时间戳推给执行器一次。没有接上激励源时，计划可以写好，但一步都不会执行。所以动手编排之前，先要知道执行器从哪里来、怎样接上时间。

### 组件内获取

组件里通常不自己创建执行器：手写 `new` 既要记得绑定激励源，又容易在组件卸载后继续持有。`useAnimater(anim?, excitation?)` 返回 `IAnimater | null`，只能在组件的 `setup` 或生命周期钩子中调用；它默认把执行器接到根渲染器的激励源上，根渲染器变化时重新绑定，组件卸载时解除绑定。

不传执行器时，它内部新建一个，并在卸载时一并销毁；传入已有执行器时，只负责绑定与解绑，执行器仍由调用方持有。需要显式指定激励源时，传第二个参数。使用 `useAnimater` 时，不需要自己调用 `destroy()`。

```ts
import { ref } from 'vue';
import { useAnimater } from '@motajs/render-vue';

const x = ref(0);

// 只能在组件 setup 或生命周期钩子中调用；
// 它绑定根渲染器的激励源，并在组件卸载时自动解绑。
const animater = useAnimater()!; // 尚无当前对象；尚无步骤；取得执行器
```

### 手动创建

不在组件里时，`useAnimater` 会返回 `null`，这时可以自己 `new Animater()`。它可以在普通 JavaScript 允许的任何位置创建；但执行器不会自己找时间，必须由你调用 `bindExcitation(excitation)` 把它接到一个数字激励源上。之后用 `unbindExcitation()` 解除绑定，也可以再接到别的源。

手动创建的执行器由调用方负责生命周期。需要停止并重置时调用 `destroy()`：它会解绑激励源，并清掉已定义与正在执行的计划。这个清理是手动创建的场景才需要的；使用 `useAnimater` 时，卸载清理已经由它完成。

```ts
import { Animater, RafExcitation } from '@motajs/animate';

const excitation = new RafExcitation(); // 尚无当前对象；尚无步骤；创建激励源
// 可在普通 JS 中创建；执行器不会自己找时间。
const animater = new Animater(); // 尚无当前对象；尚无步骤；创建执行器

// 必须自己绑定激励源；不绑定就不会推进。
animater.bindExcitation(excitation); // 尚无当前对象；尚无步骤；绑定执行器自己的激励源

// 不再需要推进时解绑；之后可以重新绑定。
animater.unbindExcitation(); // 尚无当前对象；尚无步骤；解绑激励源
```

两种方式绑定的不是同一个激励源：`useAnimater` 默认绑根渲染器的激励源；`new Animater` 绑你传给 `bindExcitation` 的那个源。重复绑定同一个源不会重复登记。

## 计划模型

动画是某个可写数值从当前值走向目标值的一段过程。一次动画至少要回答三件事：哪个数值、走向哪个目标、用多久；曲线决定这段时间里快慢怎么变。

定义动画就是把这几项信息写进一条时间线：先确定动画对象，再确定曲线，然后写步骤。步骤只记录意图，不会立刻修改对象的数值；提交整组之前，数值保持原样。

每个步骤都有开始与结束两个时刻，后续步骤可以挂在其中一个时刻上，再等待若干毫秒。挂在开始时刻上的称为**开始触发**，挂在结束时刻上的称为**结束触发**；触发点上可以继续挂步骤，于是形成顺序、延迟与重叠。

- **并行**：同一组里没有挂到任何触发点上的步骤，会随组开始一起启动。
- **顺序**：把后一段挂到前一段的结束触发上；前一段结束、等待一段时间后，后一段才开始。
- **延迟与重叠**：把后一段挂到前一段的开始触发上；前一段开始、等待一段时间后，后一段就启动。结束触发等待 `0` 表示紧接着开始，开始触发等待 `0` 表示同时开始。
- **计划组**：一次提交的步骤集合是一组。组与组之间串行：后一组要等前一组的全部步骤、以及这些步骤上的触发点都结束，再经过组后等待，才真正开始。组内可以并行，组间不重叠。
- **等待点**：每个步骤结束时会兑现一个完成信号；也可以按组内编号查到某个步骤的目标值、时长、曲线和完成信号，再等待它。完成信号只代表这个步骤结束，不代表整组结束。

下面的 live 用真实执行器播放一组计划：上方是对象 A 与 B 的当前值，下方色块是步骤段，竖线是播放头。播放头本身也是一条同组同时长的步骤，不是页面定时器。

<ClientOnly>
  <RenderDemo :loader="timelineLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 动画对象的选择

为了让动画系统知道它该如何执行动画、将当前值写入哪个对象，就必须先使用 `animate` 接口来绑定动画对象。`animate(content: IAnimatable): this` 选中的对象必须满足 `IAnimatable`：一个带可写 `value` 的对象；Vue 的 `ref<number>` 就满足这个形状。执行器只改这个字段，不负责把值画到画布。

`animate` 只改变「之后的操作作用在谁身上」，本身不新增步骤，也不移动任何值。同一个对象在一个计划组里可以多次出现，它的步骤编号会继续累加。没有先选对象就调用 `to` 时，执行器不会添加任何步骤——计划看起来写了，实际不会动，所以选择对象要放在写步骤之前。

```ts
import { ref } from 'vue';
import { useAnimater } from '@motajs/render-vue';

const x = ref(0);
const animater = useAnimater()!;

animater.animate(x); // 当前对象：x；尚无步骤；选择 x 作为动画对象
```

## 曲线

一条步骤只知道从当前值走向目标值、用多久；如果不再说明过程中的快慢，系统只能用匀速。`curve(curve: ExcitationCurve): this` 就是为此设置速率曲线的。`ExcitationCurve` 是 `(progress: number) => number`，把 `0`–`1` 的时间进度映射成一个数；不设置时使用线性曲线。

时间进度从 `0` 走到 `1`。曲线在当前进度下的返回值表示此时刻动画的完成度：为 `0` 时动画处于起点，为 `1` 时刚好执行到目标值，中间按曲线返回的比例推进。曲线返回值超出 `0` 到 `1` 时，值会越过目标或朝反方向走。

曲线在定义步骤时记入步骤，之后再改 `curve` 不会影响已经定义好的步骤。它会一直作用于后续步骤，直到再次调用 `curve`；`planEnd` 不会把它恢复成线性。

```ts
import { sin } from '@motajs/animate';

const x = ref(0);

animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .curve(sin()) // 当前对象：x；尚无步骤；设置当前曲线
    .to(1, 400) // 当前对象：x；新增索引 1；写入步骤
    .planEnd(); // 当前对象：x；索引 1；结束本组，当前对象清空
```

## 步骤与终值

计划模型与选好的对象还只是准备，要真正让某个值动起来，必须追加一条具体步骤：从当前值走到哪个目标值、用多久。`to(value: number, time: number, end: EndRelation = EndRelation.Target): this` 就是用来追加这条步骤的。不调用 `to`，再完整的模型也不会产生动画。

`value` 是目标值，`time` 是时长（毫秒），`end` 是结束参考方式。调用 `to` 只把步骤写进当前组，不会立刻修改动画对象的值；要等组开始并执行到这一步时才生效。如果当前正挂着开始触发或结束触发，这条步骤会挂到触发点，而不是随组开始；没有触发点时，它才是组启动步骤。

`EndRelation` 决定动画结束时把值写成什么：

| 结尾参考             | 动画结束时的值                                     |
| -------------------- | -------------------------------------------------- |
| `EndRelation.Target` | 直接写成传入的目标值                               |
| `EndRelation.Curve`  | 停在曲线终点；不一定等于目标值                     |
| `EndRelation.Self`   | 正常结束时同 `Curve`；提前结束时停在接管那一刻的值 |

默认是 `EndRelation.Target`。使用 `Curve` 时，如果曲线在终点不回到目标值，对象最终会停在另一个值；终点由曲线在 `1` 处的输出决定。

```ts
import { sin } from '@motajs/animate';

const x = ref(0);

animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .curve(sin()) // 当前对象：x；尚无步骤；设置当前曲线
    .to(100, 400, EndRelation.Curve) // 当前对象：x；新增索引 1；写入步骤，结尾按曲线终点
    .planEnd(); // 当前对象：x；索引 1；结束本组，当前对象清空
```

## 结束触发

组内步骤默认一起开始；如果希望后一段等前一段真正结束再开始，就需要把后一段挂到前一段的结束时刻上。`after(time = 0): this` 做这件事：它把后续步骤挂到上一次定义的步骤结束之后，再等待 `time` 毫秒。没有它，两段只能并行，或者靠猜时长来凑先后。

`after` 锚定的是上一次定义的步骤，不是当前 `animate` 选中的对象；如果还没有任何步骤，它不会建立关联。把 `after` 直接写在它要锚定的 `to` 后面，再选下一个对象，读起来就是「这段结束后，再让谁动」：

```ts
const x = ref(0);
const y = ref(0);

animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .to(1, 400) // 当前对象：x；新增索引 1；写入步骤
    .after(120) // 当前对象：x；索引 1；把后续步骤挂到索引 1 结束之后，等待 120ms
    .animate(y) // 当前对象：y；尚无步骤；选择 y
    .to(1, 150) // 当前对象：y；新增索引 1；写入步骤（挂到 x 索引 1 结束之后）
    .planEnd(); // 当前对象：y；索引 1；结束本组，当前对象清空
```

`after` 只能锚定上一条定义的步骤；要挂在组里其它对象、其它编号的步骤之后，就需要按对象与编号指定。`afterPlan(content: IAnimatable, index: number, time = 0): this` 就是为此把后续步骤挂到当前计划组里指定对象、指定索引的步骤结束之后。`index` 从 `1` 开始；找不到对应步骤时不会建立这个关联，若之前已经挂过触发，基准保持原样，否则后续步骤随组开始。

```ts
animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .to(100, 200) // 当前对象：x；新增索引 1；写入步骤
    .afterPlan(x, 1, 50) // 当前对象：x；索引 1；把后续步骤挂到 x 索引 1 结束之后，等待 50ms
    .animate(y) // 当前对象：y；尚无步骤；选择 y
    .to(50, 150) // 当前对象：y；新增索引 1；写入步骤（挂到 x 索引 1 结束之后）
    .planEnd(); // 当前对象：y；索引 1；结束本组，当前对象清空
```

调用 `after` 或 `afterPlan` 之后，后续的步骤会继续挂到同一个基准上，直到下一次 `after`、`when` 或 `planEnd` 改变它。两者都只能引用当前正在定义的组；已经封口的组不能再被挂触发点。

## 开始触发

结束触发只能让两段首尾相接；若希望后一段在前一段开始后某个时刻就启动，让两段重叠，就需要以开始时刻为基准。`when(time = 0): this` 把后续步骤挂到上一次定义的步骤开始时刻之后，再等待 `time` 毫秒。没有它，两段要么完全同时开始，要么等前一段结束。

```ts
animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .to(1, 400) // 当前对象：x；新增索引 1；写入步骤
    .when(100) // 当前对象：x；索引 1；把后续步骤挂到索引 1 开始之后，等待 100ms
    .animate(y) // 当前对象：y；尚无步骤；选择 y
    .to(1, 150) // 当前对象：y；新增索引 1；写入步骤（挂到 x 索引 1 开始之后）
    .planEnd(); // 当前对象：y；索引 1；结束本组，当前对象清空
```

`when` 也只能锚定上一条定义的步骤；要以后面组里任意一条已有步骤的开始时刻为基准，就需要按对象与编号指定。`whenPlan(content: IAnimatable, index: number, time = 0): this` 就是为此以当前计划组里指定对象、指定索引的步骤为基准，从它开始执行的时刻起等待 `time` 毫秒。写法与 `afterPlan` 相同，只是基准从「步骤结束」改为「步骤开始」。

```ts
animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .to(1, 500) // 当前对象：x；新增索引 1；写入步骤
    .whenPlan(x, 1, 200) // 当前对象：x；索引 1；把后续步骤挂到 x 索引 1 开始之后，等待 200ms
    .animate(y) // 当前对象：y；尚无步骤；选择 y
    .to(1, 200) // 当前对象：y；新增索引 1；写入步骤（挂到 x 索引 1 开始之后）
    .planEnd(); // 当前对象：y；索引 1；结束本组，当前对象清空
```

`when` 与 `after` 都锚定上一次定义的步骤，所以调用顺序会影响挂载点：先 `animate(y)` 不会改变锚点，紧接着的 `when` 或 `after` 仍然挂在 `x` 的上一条步骤上。把触发写在锚点步骤之后，可以少一次回头确认。

## 查询与等待

计划提交后，代码有时需要读出某一步的目标值与时长。`query(content: IAnimatable, index: number, plan?: number): IAnimationPlan | null` 就是为此查询步骤的；没有它，只能自己记住定义时写了什么，或者等整组结束后再回头找。

另一些时候，代码只想等某一步完成再继续，而不想等整组结束。`wait(content: IAnimatable, index: number, plan?: number): Promise<void>` 就是为此等待单个步骤的；没有它，只能猜时长，或者在组尾统一处理。

`index` 是该对象在本计划组里的步骤编号，从 `1` 开始；`plan` 是计划组索引，由 `planEnd` 返回。省略 `plan` 时，`query` 查询当前正在定义中的组；`planEnd` 之后当前组已经封口，要查已定义的组必须显式传入组索引。`wait` 省略 `plan` 时先找当前正在执行的组；没有执行中的组时，按当前正在定义中的组查找。步骤不存在时立即兑现，步骤存在时只等这一条结束，不等整组。步骤被后续步骤接管时，它的完成信号也会兑现。

`IAnimationPlan` 的常用成员：

| 成员          | 含义                             |
| ------------- | -------------------------------- |
| `identifier`  | 动画对象与组内步骤编号           |
| `curve`       | 这个步骤的速率曲线               |
| `targetValue` | 目标值                           |
| `time`        | 动画时长                         |
| `promise`     | 这个步骤执行完毕后兑现的 Promise |

```ts
const x = ref(0);

const group = animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .to(100, 300) // 当前对象：x；新增索引 1；写入步骤
    .after(100) // 当前对象：x；索引 1；把后续步骤挂到索引 1 结束之后，等待 100ms
    .to(200, 200) // 当前对象：x；新增索引 2；写入步骤（挂到索引 1 结束之后）
    .planEnd(); // 当前对象：x；索引 2；结束本组，当前对象清空

const second = animater.query(x, 2, group); // 当前对象：无；组 group 索引 2；读取 x 的步骤
// second?.targetValue 为 200

await animater.wait(x, 2, group); // 当前对象：无；组 group 索引 2；等待 x
```

`query` 与 `wait` 的默认范围不同：`query` 默认查当前正在定义的组，`wait` 默认查当前正在执行的组。定义完计划后要查询该组，通常显式传入 `planEnd` 的返回值。

## 计划组收尾

写步骤时，系统需要一个明确边界知道「这一组到这里定义完毕」，并据此决定什么时候开始执行、组前与组后各等多久、下一组怎样排队；`planEnd(preTime = 0, postTime = 0): number` 就是这条边界。不调用它，当前组不会提交，后续步骤会继续累积在同一组里，也不会开始执行。

`planEnd` 什么时候调用由你决定：在关闭它之前，当前组一直保持「定义中」，可以继续用 `to` 往里加步骤。它不需要在写完第一条步骤后立刻调用；但组只有在 `planEnd` 之后才会被排队执行。

`planEnd` 返回组索引，从 `1` 开始；没有定义任何步骤时返回 `-1`。

- `preTime` 是组执行前的等待时长（毫秒），等待结束后才开始组内第一批步骤。
- `postTime` 是组执行后的等待时长（毫秒），组内步骤、开始触发与结束触发全部结束后再等待这么久，计划组才真正结束。
- 后一个计划组会等前一个计划组全部结束之后才开始，因此组与组之间不会重叠。

```ts
const x = ref(0);
const y = ref(0);

// 第一个计划组：x 与 y 同时走向各自目标
animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .to(100, 300) // 当前对象：x；新增索引 1；写入步骤
    .animate(y) // 当前对象：y；尚无步骤；选择 y
    .to(50, 300) // 当前对象：y；新增索引 1；写入步骤（随组开始，与 x 并行）
    .planEnd(); // 当前对象：y；索引 1；结束组 1，当前对象清空

// 第二个计划组：等第一个组全部结束后，x 再回到 0
animater
    .animate(x) // 当前对象：x；新组重新计数，尚无步骤；选择 x
    .to(0, 200) // 当前对象：x；新增索引 1；写入步骤
    .planEnd(); // 当前对象：x；索引 1；结束组 2，当前对象清空
```

## 执行器状态与读取规则

把上面的操作放在一起看，`Animater` 是一台按状态工作的执行器：它记住当前选中的对象、当前曲线、触发基准，以及正在定义或执行的计划组。每个接口只读写其中一部分状态；理解这一点，才能判断一行代码在看谁、写谁。

| 操作                               | 读取的状态                                     | 改变的状态                             |
| ---------------------------------- | ---------------------------------------------- | -------------------------------------- |
| `animate(content)`                 | 无                                             | 当前对象，以及该对象的步骤容器         |
| `curve(curve)`                     | 无                                             | 当前曲线，供后续 `to` 记录             |
| `to(value, time, end)`             | 当前对象、当前曲线、当前触发基准               | 向当前计划组写入一条步骤，步骤编号加一 |
| `after(time)` / `when(time)`       | 上一个定义的步骤                               | 触发基准与等待时长                     |
| `afterPlan(...)` / `whenPlan(...)` | 当前计划组中指定对象、指定编号的步骤           | 触发基准与等待时长                     |
| `planEnd(...)`                     | 当前计划组                                     | 关闭并排队该组，返回组编号             |
| `query(...)`                       | 默认读取当前正在定义的组                       | 无                                     |
| `wait(...)`                        | 默认读取当前正在执行的组；没有时读正在定义的组 | 无                                     |
| `destroy()`                        | 无                                             | 解绑激励源，清空计划与执行状态         |

其中最容易看错的是 `to`：它同时依赖选中的对象、当前曲线与当前触发基准。没有先用 `animate` 选中对象时，`to` 不写入任何步骤，计划看起来写了，实际不会动。

`after` 与 `when` 改的是触发基准，不是当前对象。之后即使换了对象，基准也会保持，直到下一次触发设置或 `planEnd`。

`query` 与 `wait` 的默认范围不同：`query` 默认读当前正在定义的组；`wait` 默认读当前正在执行的组，没有执行中的组时读当前正在定义的组。

## 组合与编排示例

下面每个示例前都先说明它表示的动画；示例里的 `x`、`y` 是已经声明好的动画对象，`animater` 由 `useAnimater()` 取得，`linear()` 来自 `@motajs/animate`。每个示例后配两个 live：一个看时间轴，一个看数值播放；两者都由真实执行器推进。

### 顺序执行

这个示例表示：`x` 先走完，`y` 才开始。

```ts
// x 走完，y 才开始
animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .curve(linear()) // 当前对象：x；尚无步骤；设置当前曲线
    .to(1, 700) // 当前对象：x；新增索引 1；写入步骤
    .after() // 当前对象：x；索引 1；把后续步骤挂到索引 1 结束之后
    .animate(y) // 当前对象：y；尚无步骤；选择 y
    .to(1, 450) // 当前对象：y；新增索引 1；写入步骤（挂到 x 索引 1 结束之后）
    .planEnd(); // 当前对象：y；索引 1；结束本组，当前对象清空
```

`after()` 不等待额外时间，所以 `y` 在 `x` 结束的同一刻启动。

时间轴视图：色块是步骤段，竖线是播放头。

<ClientOnly>
  <RenderDemo :loader="sequentialTimelineLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

播放视图：两个圆点分别表示 `x` 与 `y` 的当前值。

<ClientOnly>
  <RenderDemo :loader="sequentialPlaybackLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 并行执行

这个示例表示：`x` 与 `y` 同时开始，各自走向自己的目标。

```ts
// x、y 同时开始，各自走向自己的目标
animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .curve(linear()) // 当前对象：x；尚无步骤；设置当前曲线
    .to(1, 900) // 当前对象：x；新增索引 1；写入步骤（随组开始）
    .animate(y) // 当前对象：y；尚无步骤；选择 y
    .curve(linear()) // 当前对象：y；尚无步骤；设置当前曲线
    .to(0.5, 900) // 当前对象：y；新增索引 1；写入步骤（随组开始，与 x 并行）
    .planEnd(); // 当前对象：y；索引 1；结束本组，当前对象清空
```

两条步骤都没有挂触发点，所以都会随组开始；它们只共享开始时刻，不共享目标、时长或曲线。

时间轴视图：两条步骤段从同一刻开始。

<ClientOnly>
  <RenderDemo :loader="parallelTimelineLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

播放视图：两个值同时变化。

<ClientOnly>
  <RenderDemo :loader="parallelPlaybackLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 延迟与重叠

这个示例表示：`x` 先开始，`y` 在 `x` 开始 300ms 后启动，两者重叠 600ms。

```ts
// x 先走 1000ms，y 在 x 开始 300ms 后启动，两者重叠 600ms
animater
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .curve(linear()) // 当前对象：x；尚无步骤；设置当前曲线
    .to(1, 1000) // 当前对象：x；新增索引 1；写入步骤
    .when(300) // 当前对象：x；索引 1；把后续步骤挂到索引 1 开始之后，等待 300ms
    .animate(y) // 当前对象：y；尚无步骤；选择 y
    .to(1, 600) // 当前对象：y；新增索引 1；写入步骤（挂到 x 索引 1 开始之后）
    .planEnd(); // 当前对象：y；索引 1；结束本组，当前对象清空
```

`when(300)` 以 `x` 的开始为基准，所以 `y` 在 `x` 走了 300ms 时启动，而不是等 `x` 结束。

时间轴视图：`y` 的步骤段从 `x` 中段开始。

<ClientOnly>
  <RenderDemo :loader="delayedTimelineLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

播放视图：`x` 先动，`y` 稍后启动。

<ClientOnly>
  <RenderDemo :loader="delayedPlaybackLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 两个计划组

这个示例表示：组 1 的 `x` 全部结束后，组 2 的 `y` 才开始；组间不需要额外写等待。

```ts
// 组 2 会等组 1 全部结束；不需要额外写等待
const first = animater // 当前对象：无；尚无步骤；开始定义组 1
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .curve(linear()) // 当前对象：x；尚无步骤；设置当前曲线
    .to(1, 600) // 当前对象：x；新增索引 1；写入步骤
    .planEnd(); // 当前对象：x；索引 1；结束组 1，当前对象清空

const second = animater // 当前对象：无；新组；开始定义组 2
    .animate(y) // 当前对象：y；新组重新计数，尚无步骤；选择 y
    .curve(linear()) // 当前对象：y；尚无步骤；设置当前曲线
    .to(1, 600) // 当前对象：y；新增索引 1；写入步骤
    .planEnd(); // 当前对象：y；索引 1；结束组 2，当前对象清空

// 等组 1 的 x 步骤，或等组 2 的 y 步骤，都可以
await animater.wait(x, 1, first); // 当前对象：无；组 first 索引 1；等待 x
await animater.wait(y, 1, second); // 当前对象：无；组 second 索引 1；等待 y
```

时间轴视图：两组首尾相接，中间没有重叠。

<ClientOnly>
  <RenderDemo :loader="relayTimelineLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

播放视图：`x` 完成后，`y` 才从 0 开始。

<ClientOnly>
  <RenderDemo :loader="relayPlaybackLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 查询与等待指定步骤

这个示例表示：先读出 `y` 这条步骤的目标与时长，再只等待 `y` 结束。

```ts
const group = animater // 当前对象：无；尚无步骤；开始定义一组
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .curve(linear()) // 当前对象：x；尚无步骤；设置当前曲线
    .to(1, 300) // 当前对象：x；新增索引 1；写入步骤
    .when(100) // 当前对象：x；索引 1；把后续步骤挂到索引 1 开始之后，等待 100ms
    .animate(y) // 当前对象：y；尚无步骤；选择 y
    .curve(linear()) // 当前对象：y；尚无步骤；设置当前曲线
    .to(1, 200) // 当前对象：y；新增索引 1；写入步骤（挂到 x 索引 1 开始之后）
    .planEnd(); // 当前对象：y；索引 1；结束本组，当前对象清空

const yStep = animater.query(y, 1, group); // 当前对象：无；组 group 索引 1；读取 y 的步骤
// yStep?.targetValue 为 1，yStep?.time 为 200

// 只等 y 这一条步骤，不等待整组
await animater.wait(y, 1, group); // 当前对象：无；组 group 索引 1；等待 y
```

这里的 `query` 与 `wait` 都显式传入了 `planEnd` 返回的组索引，所以查的是已封口的组，而不是之后还在定义的组。

时间轴视图：`x` 与 `y` 重叠，等待只针对 `y` 那一段。

<ClientOnly>
  <RenderDemo :loader="queryTimelineLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

播放视图：先显示查到的 `y` 目标与时长，再播放数值。

<ClientOnly>
  <RenderDemo :loader="queryPlaybackLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

### 中途改道

这个示例表示：`x` 的第一段走到 700ms 时被第二段接管，改为走回 0；`y` 仍按自己的节奏走完。

```ts
const group = animater // 当前对象：无；尚无步骤；开始定义一组
    .animate(x) // 当前对象：x；尚无步骤；选择 x
    .curve(linear()) // 当前对象：x；尚无步骤；设置当前曲线
    .to(1, 1200, EndRelation.Self) // 当前对象：x；新增索引 1；写入步骤，结尾保留改道时的值
    .animate(y) // 当前对象：y；尚无步骤；选择 y
    .curve(linear()) // 当前对象：y；尚无步骤；设置当前曲线
    .to(1, 1500) // 当前对象：y；新增索引 1；写入步骤
    .whenPlan(x, 1, 700) // 当前对象：y；索引 1；把触发基准改为 x 索引 1 开始后 700ms
    .animate(x) // 当前对象：x；已有索引 1；重新选择 x
    .curve(linear()) // 当前对象：x；已有索引 1；设置当前曲线
    .to(0, 500) // 当前对象：x；新增索引 2；写入步骤（挂到 x 索引 1 开始后 700ms）
    .planEnd(); // 当前对象：x；索引 2；结束本组，当前对象清空

await animater.wait(x, 1, group); // 当前对象：无；组 group 索引 1；等待 x 第 1 段（改道时兑现）
await animater.wait(x, 2, group); // 当前对象：无；组 group 索引 2；等待 x 第 2 段
```

第一段使用 `EndRelation.Self`，接管时会停在改道时刻的值；如果使用默认的 `Target`，它会先跳到原来的目标值，再被新步骤拉回。被接管的那一段不会触发它挂的结束触发点。

时间轴视图：`x` 的第一段在 700ms 处截断，第二段从那里接上。

<ClientOnly>
  <RenderDemo :loader="retargetTimelineLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

播放视图：`x` 在改道后从当前值走回 0，`y` 继续走完。

<ClientOnly>
  <RenderDemo :loader="retargetPlaybackLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 与渐变执行器的分工

`Animater` 负责多个对象、多个步骤的编排；只是让单个数值连续靠近目标值时，用[渐变执行器](./animation-transition.md)。

## 边界与注意

- 同一个对象在同一时刻只能开始一条步骤：两条步骤同时启动会报错并跳过后一条；启动时刻更晚时，前一条会立刻结束再开始新的。
- `after` 与 `when` 锚定上一次定义的步骤，与当前 `animate` 选中的对象无关；中间换了对象，锚点也不会跟着换。
- 被接管的那一段不会触发它挂的结束触发点；需要停在接管时刻的值时用 `EndRelation.Self`，默认的 `Target` 会先跳到原目标值再被拉回。

<script setup>
import RenderDemo from '../../.vitepress/components/renderDemo.vue';

const timelineLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-timeline.tsx');
const sequentialTimelineLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-sequential-timeline.tsx');
const sequentialPlaybackLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-sequential-playback.tsx');
const parallelTimelineLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-parallel-timeline.tsx');
const parallelPlaybackLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-parallel-playback.tsx');
const delayedTimelineLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-delayed-timeline.tsx');
const delayedPlaybackLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-delayed-playback.tsx');
const relayTimelineLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-relay-timeline.tsx');
const relayPlaybackLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-relay-playback.tsx');
const queryTimelineLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-query-timeline.tsx');
const queryPlaybackLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-query-playback.tsx');
const retargetTimelineLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-retarget-timeline.tsx');
const retargetPlaybackLoader = () =>
    import('../../.vitepress/components/demos/ui/animater-retarget-playback.tsx');
</script>
