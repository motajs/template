# 条件渲染与循环渲染

TSX 里没有模板指令。要不要显示一块内容、要不要重复一组元素，都是普通表达式：条件用 `hidden` 或三元，循环用 `.map()`。

绝大多数情况用 `hidden` 更划算：它只跳过绘制与命中，元素、状态和事件监听都还在。虽然会多占一点内存，但一般影响很小；TSX 也更平整，不需要为条件分支多套一层缩进。

## 条件渲染与 hidden

大多数情况推荐 `hidden`，不推荐三元：它只多占一点内存，一般影响很小，TSX 也更平整。

`hidden` 不会把节点从树上拿走，只是不绘制、不参与命中。实例、内部状态、子元素和事件监听都保留，再次显示时直接接上。

坐标是相对父容器的绝对定位，不参与布局流。所以 `hidden` 不会让下面的兄弟元素上移，也不会留下一个「空格」。

```tsx
// hidden 只切换显示与交互，面板状态不会被重置
import { ref } from 'vue';

// setup
const open = ref(true);

const togglePanel = () => {
    open.value = !open.value;
};

// 组件内容
<container loc={FULL_LOC}>
    <container loc={[40, 32, 180, 36]} onClick={togglePanel}>
        <g-rect loc={[0, 0, 180, 36]} fill fillStyle="#2f6fed" />
        <text loc={[12, 10]} text="隐藏 / 显示面板" fillStyle="#e8f0ff" />
    </container>
    <container loc={[40, 100, 240, 160]} hidden={!open.value}>
        <g-rect loc={[0, 0, 240, 160]} fill fillStyle="#26364d" />
        <text loc={[16, 16]} text="面板内容" fillStyle="#e8f0ff" />
    </container>
</container>;
```

<ClientOnly>
  <RenderDemo :loader="conditionalHiddenLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

面板隐藏 / 显示，面板内部的计数状态保留。

## 三元与节点卸载

三元不推荐作为默认方案。三元为假时返回 `null`，节点从树上移除：组件卸载，状态重置，下次显示时重新创建。只有元素必须真正不存在（不能留下占位或命中区域），或者每次打开都要从初始状态开始时，才用三元。

```tsx
// 三元为 false 时面板被卸载，再显示时重新创建
// setup
const open = ref(true);

const togglePanel = () => {
    open.value = !open.value;
};

// 组件内容
<container loc={FULL_LOC}>
    <container loc={[40, 32, 180, 36]} onClick={togglePanel}>
        <g-rect loc={[0, 0, 180, 36]} fill fillStyle="#2f6fed" />
        <text loc={[12, 10]} text="隐藏 / 显示面板" fillStyle="#e8f0ff" />
    </container>
    {open.value ? (
        <container loc={[40, 100, 240, 160]}>
            <g-rect loc={[0, 0, 240, 160]} fill fillStyle="#26364d" />
            <text loc={[16, 16]} text="面板内容" fillStyle="#e8f0ff" />
        </container>
    ) : null}
</container>;
```

<ClientOnly>
  <RenderDemo :loader="conditionalTernaryLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

面板用三元切换，重新显示时内部计数从 0 开始。

## 循环与 map

TSX 里没有循环指令，直接把数组映射成元素数组：

```tsx
// 固定顺序、无内部状态的列表不需要 key
const labels = ['攻击', '防御', '生命'];

<container loc={[0, 0, 480, 320]}>
    {labels.map((label, index) => (
        <text loc={[40, 60 + index * 32]} text={label} fillStyle="#ffffff" />
    ))}
</container>;
```

这个列表顺序固定、每一项都没有内部状态，所以不需要 `key`。加 `key` 反而多了一层身份管理，没有收益。`.map()` 必须放在渲染函数返回的元素树里，外层要有父容器；返回的数组会成为父容器的子元素列表。

如果列表项会增删、重排，或者列表项本身是有状态的组件，就需要 `key`。下一节说明原因。

## key 与元素身份

`key` 的作用是让 Vue 认出「这一项还是原来那一项」。列表 diff 时，Vue 按 `key` 匹配新旧节点：匹配上就复用，匹配不上就卸载旧的、挂载新的。

```tsx
// 会增删或重排的列表用稳定 id 作为 key
// 每一项都带 id，重排后 Vue 能认回原来那一项
interface Row {
    id: number;
    label: string;
}

// setup
const rows = ref<Row[]>([
    { id: 1, label: '第一项' },
    { id: 2, label: '第二项' }
]);

// 组件内容
<container loc={FULL_LOC}>
    {rows.value.map((row, index) => (
        <text
            key={row.id}
            loc={[40, 40 + index * 28]}
            text={row.label}
            fillStyle="#7ee787"
        />
    ))}
</container>;
```

`key` 取稳定且唯一的值，通常来自数据自己的 id。不要用数组下标代替会变化的身份：在下标 0 处插入一项后，原来的第一项变成第二项，下标全变，Vue 会以为每一项都换了人，状态跟着错位。

实用规则：

- 会增删、重排的列表，用稳定的 `row.id` 作为 `key`。
- 不要用会变化的数组下标当身份。
- 静态固定列表可以不用 `key`。

<ClientOnly>
  <RenderDemo :loader="conditionalKeyLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

左右两份列表轮流切换顺序：左边用 `key=id`，计数跟着项走；右边用 `key=index`，计数留在原位置。

## 列表数据的更新

列表用 `ref` 保存，渲染时读 `rows.value`。`push`、`splice`、改某一项的字段、整体替换 `rows.value`，都会自动更新画面。

```tsx
// 列表放在 ref 里，渲染时读 rows.value
interface Row {
    id: number;
    label: string;
}

// setup
const rows = ref<Row[]>([
    { id: 1, label: '红药水' },
    { id: 2, label: '蓝药水' }
]);

// 组件内容
<container loc={FULL_LOC}>
    {rows.value.map((row, index) => (
        <text
            key={row.id}
            loc={[40, 40 + index * 28]}
            text={row.label}
            fillStyle="#ffffff"
        />
    ))}
</container>;
```

`shallowRef` 只认整体替换 `rows.value = [...]`，`rows.value.push(...)` 不会触发更新；普通数组怎么改都不会触发；`reactive` 数组可以用 `push` / `splice`，但不要把变量整体替换成新数组。

过滤、排序这类派生列表用 `computed`，渲染时读 `computed.value`：

```tsx
// setup：过滤后的列表用 computed 派生，依赖变化时自动重算
import { computed, ref } from 'vue';

const keyword = ref('');
const rows = ref<Row[]>([
    { id: 1, label: '红药水' },
    { id: 2, label: '蓝药水' }
]);

const visibleRows = computed(() =>
    rows.value.filter(row => row.label.includes(keyword.value))
);

// 组件内容：渲染时读 visibleRows.value
{
    visibleRows.value.map((row, index) => (
        <text
            key={row.id}
            loc={[40, 40 + index * 28]}
            text={row.label}
            fillStyle="#ffffff"
        />
    ));
}
```

改了数据但画面没动，先确认渲染函数里读的是响应式变量本身（或它的 `.value`），不是普通数组或副本。

## 条件/列表的树形示意

把开关、列表和右侧详情放进同一棵树：面板用 `hidden` 控制显隐，列表用 `.map()` 生成，详情也用 `hidden` 控制。整段代码使用与模板页一致的标准 UI 模板。

```tsx
// 面板开关只切换 hidden；列表颜色与右侧详情都由选中态派生
import { computed, defineComponent, ref } from 'vue';
import { GameUI, SetupComponentOptions } from '@motajs/system';
import { DefaultProps } from '@motajs/render-vue';
import { IGameUIPropsBase } from '@user/client-base';
import { FULL_LOC } from '@/client';

interface MyPanelProps extends IGameUIPropsBase, DefaultProps {}

interface Row {
    id: number;
    label: string;
}

const myPanelProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<MyPanelProps>;

const MyPanel = defineComponent<MyPanelProps>(props => {
    const open = ref(true);
    const rows = ref<Row[]>([
        { id: 1, label: '红药水' },
        { id: 2, label: '蓝药水' }
    ]);
    const selectedId = ref<number | null>(null);

    // 选中项从列表里派生，右侧详情只读结果
    const selected = computed(
        () => rows.value.find(row => row.id === selectedId.value) ?? null
    );

    // 每行颜色在 setup 里算好，属性里只读结果
    const fillById = computed(() => {
        const map = new Map<number, string>();
        for (const row of rows.value) {
            let color = '#26364d';
            if (row.id === selectedId.value) {
                color = '#2f6fed';
            }
            map.set(row.id, color);
        }
        return map;
    });

    const togglePanel = () => {
        open.value = !open.value;
    };

    // 事件交给命名函数，用 row.id 定位
    const selectRow = (id: number) => {
        selectedId.value = id;
    };

    return () => (
        <container loc={FULL_LOC}>
            <container loc={[40, 32, 160, 32]} onClick={togglePanel}>
                <g-rect loc={[0, 0, 160, 32]} fillStyle="#2f6fed" />
                <text loc={[12, 8]} text="隐藏 / 显示" fillStyle="#e8f0ff" />
            </container>
            {/* 开关只改 hidden，面板和里面的状态都留在树上 */}
            <container loc={[40, 88, 400, 160]} hidden={!open.value}>
                {rows.value.map((row, index) => (
                    <container
                        key={row.id}
                        loc={[0, index * 36, 180, 32]}
                        onClick={() => selectRow(row.id)}
                    >
                        <g-rect
                            loc={[0, 0, 180, 32]}
                            fillStyle={fillById.value.get(row.id) ?? '#26364d'}
                        />
                        <text
                            loc={[12, 8]}
                            text={row.label}
                            fillStyle="#e8f0ff"
                        />
                    </container>
                ))}
                {/* 右侧详情也用 hidden 控制显隐，不需要三元 */}
                <container
                    loc={[220, 0, 180, 120]}
                    hidden={selected.value === null}
                >
                    <g-rect loc={[0, 0, 180, 120]} fillStyle="#1c2633" />
                    <text loc={[12, 12]} text="已选中" fillStyle="#8b98a8" />
                    <text
                        loc={[12, 44]}
                        text={selected.value?.label ?? ''}
                        fillStyle="#e8f0ff"
                    />
                </container>
            </container>
        </container>
    );
}, myPanelProps);

export const MyPanelUI = new GameUI('my-panel', MyPanel);
```

这段树里：

- 开关按钮点击只改 `open`，`hidden={!open.value}` 只切换面板是否绘制，面板、列表项和详情都不卸载。
- 点击列表项时，`selectRow(row.id)` 只改 `selectedId`；`fillById` 重新算出每行颜色，列表颜色跟着更新。
- 右侧详情的显隐由 `hidden={selected.value === null}` 控制，选中项变化时只切显示，不会重建。
- 整个过程没有三元分支，也没有因为显隐而卸载或重建任何节点。

## 三种写法的选择

| 需求                       | 写法                  | 结果                                 |
| -------------------------- | --------------------- | ------------------------------------ |
| 绝大多数情况，需要保留状态 | `hidden={!open}`      | 推荐：不显示、不交互，元素与状态仍在 |
| 必须不存在，或每次都要重置 | `open ? <A /> : null` | 不推荐作为默认：卸载与重建，状态重置 |
| 固定顺序、无状态列表       | `.map()`              | 每次渲染生成一组元素，不需要身份     |
| 会增删、重排、带状态的列表 | `.map()` + `key`      | 保留元素身份，状态跟着正确的项走     |

<script setup>
import RenderDemo from '../../../.vitepress/components/renderDemo.vue';

const conditionalHiddenLoader = () =>
    import('../../../.vitepress/components/demos/ui/conditional-hidden-demo.tsx');
const conditionalTernaryLoader = () =>
    import('../../../.vitepress/components/demos/ui/conditional-ternary-demo.tsx');
const conditionalKeyLoader = () =>
    import('../../../.vitepress/components/demos/ui/conditional-key-demo.tsx');
</script>

## 边界与注意

- `hidden` 的元素仍在树里，数量和层级照旧，也不影响兄弟元素的坐标。大量长期不用的重子树应该用三元释放。
- 三元反复切换会反复重建，成本在组件初始化与状态重置，不在绘制本身。
- `.map()` 返回的每一项都要有稳定结构。列表项是组件时，`key` 写在组件标签上。
- `key` 只在同一父级的兄弟之间比较，不需要全局唯一；嵌套列表各用各的。
- `ref` 数组的 `push` / `splice` / 整体替换都会触发；`shallowRef` 只认整体替换；普通数组不会触发。
- 「改了数组但画面没动」先查数据是不是响应式、改的是不是副本，不要先怀疑渲染器。
- `key` 不是性能开关，也不是修复重挂载问题的手段；它只表达「这是同一项」。
