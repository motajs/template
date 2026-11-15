# UI 性能

多数简单 UI 不需要特别的性能优化。渲染系统会按需更新，缓存也默认开在合适的元素上；按常规方式写，性能通常已经足够。下面是一组日常习惯，用来减少不必要的绘制与内存占用，按需采用即可。

## 元素平铺与分组

同一层里堆很多兄弟元素，会让一次更新牵动整层。更新会沿父链标脏，父容器需要重新遍历并绘制受影响的部分；兄弟越多，重复的工作越明显。按更新频率分组：把一起变化、且不常变的元素放进同一个 `container`，把频繁变化的元素单独放。不要为了分组嵌得太深，层级越深，布局、绘制与命中遍历的递归也越深。

不推荐把静态内容与频繁变化的内容全部平铺在同一层：

```tsx
<container loc={FULL_LOC}>
    <text loc={[12, 12]} text="标题" />
    <g-rect loc={[12, 40, 160, 32]} fillStyle="#2f6fed" />
    <text loc={[12, 80]} text="说明" />
    <text loc={[12, 280]} text={score.value.toString()} />
</container>
```

推荐把不常变的内容收进一个容器，把变化的文字单独放：

```tsx
<container loc={FULL_LOC}>
    <container loc={[0, 0, 240, 120]}>
        <text loc={[12, 12]} text="标题" />
        <g-rect loc={[12, 40, 160, 32]} fillStyle="#2f6fed" />
        <text loc={[12, 80]} text="说明" />
    </container>
    <container loc={[0, 260, 240, 32]}>
        <text loc={[12, 0]} text={score.value.toString()} />
    </container>
</container>
```

## 长列表：Scroll 与 Page

不得不平铺一长串元素时，用 `Scroll` 或 `Page`。`Scroll` 按**直接子元素**的包围盒计算总长度，并把视口外的直接子元素隐藏：不绘制、不命中，元素与状态仍保留。因此每一行都要直接挂在 `Scroll` 下，不要先用一个大容器把全部内容包起来，否则 `Scroll` 只能看到一整块内容。

`Scroll` 适合需要连续滚动、行高不固定的列表。`Page` 只渲染当前页，适合页数固定、单页内容复杂或总条目更多的情况；代价是翻页而不是滚动。简单列表先用 `Scroll`，更大或更复杂的列表再考虑 `Page`。

```tsx
<Scroll loc={[40, 40, 280, 200]}>
    {rows.map(row => (
        <container key={row.id} loc={[0, row.y, 280, 32]}>
            <text loc={[8, 8]} text={row.label} fillStyle="#e8f0ff" />
        </container>
    ))}
</Scroll>
```

```tsx
<Page pages={pageCount} loc={[40, 40, 280, 220]}>
    {page => {
        return rowsOfPage(page).map(row => (
            <text
                key={row.id}
                loc={[8, 8 + row.y]}
                text={row.label}
                fillStyle="#e8f0ff"
            />
        ));
    }}
</Page>
```

`Scroll` 与 `Page` 的参数见[内置组件：布局](./builtin-layout.md)。

## 渲染函数中的自我更新

不要在元素的渲染函数里调用它自己的更新方法。渲染函数已经在绘制这个元素，再次触发更新会形成递归；开发环境会输出警告，指出元素类型与 `uid`。需要随时间变化的内容，改由响应式状态或外部的定时逻辑驱动，让渲染函数只读取当前值。

不推荐在渲染函数里更新自身：

```tsx
const render = () => {
    element.value?.update();
};

<custom ref={element} render={render} />;
```

## cache 与 nocache

`container`、`container-custom` 与 `custom` 默认缓存；`text`、`image` 与全部 `g-*` 默认不缓存。缓存适合结构复杂、内容稳定、重复绘制成本高的子树；一行文字、一个矩形，或者每帧都在变的进度与动画，直接绘制通常更便宜。

默认缓存的容器如果只装一行简单文字，可以加 `nocache` 省掉离屏画布与贴回。默认不缓存的元素如果内容复杂且很少变化，可以加 `cache` 复用绘制结果。`nocache` 优先于 `cache`；两者都可以随 props 动态修改，切换时会按新状态启用或清理缓存。没有必要每帧反复切换，但不要把它们当成创建后不可改的固定值。

```tsx
<container loc={[40, 40, 240, 80]} nocache>
    <text loc={[12, 12]} text="简单内容" fillStyle="#e8f0ff" />
</container>
```

```tsx
<g-path path={badge} cache fillStyle="#7ee787" />
```

缓存的默认值与开关语义见[层级、变换与性能](./layer-transform-performance.md#缓存与脏更新)。

## 像素风：抗锯齿与高清

抗锯齿控制缩放时的插值。像素图的边缘本来就是硬边，插值会把边缘变成半透明过渡，放大后容易发虚；因此像素图应使用 `noanti`。`hd` 只对开启缓存的元素有效：缓存的本来就是 1x 像素数据时，按设备像素比放大不会增加信息，可以配 `hd={false}` 减少缓存开销。

```tsx
<image image={texture} loc={[40, 40, 160, 160]} noanti />

<container loc={[40, 40, 160, 160]} cache hd={false}>
    <image image={texture} loc={[0, 0, 160, 160]} noanti />
</container>
```

`hd` 与 `anti` / `noanti` 的完整说明见[通用参数](./common-props.md)。

## 显隐：hidden 与条件渲染

需要显示或隐藏一块内容时，优先用 `hidden`。它只跳过绘制与命中，元素、组件状态、事件监听与按键作用域都还在；再次显示时直接恢复，不需要重新创建。不要用条件表达式卸载元素，也不要把它移到画面外或把颜色调成透明：前两种会改变树结构或布局，后一种仍然参与绘制与命中。

不推荐用条件表达式切换显隐：

```tsx
{
    open.value ? <Panel /> : null;
}
```

推荐用 `hidden`：

```tsx
<container loc={[40, 40, 240, 160]} hidden={!open.value}>
    <g-rect loc={[0, 0, 240, 160]} fillStyle="#26364d" />
    <text loc={[16, 16]} text="面板内容" fillStyle="#e8f0ff" />
</container>
```

只有确认一块长期不用、体积又大的子树需要释放时，才用条件渲染卸载。更多条件与列表写法见[条件渲染与循环渲染](./conditional-and-list-rendering.md)。
