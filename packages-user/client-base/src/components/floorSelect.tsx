import { DefaultProps, lwh } from '@motajs/render-vue';
import { SetupComponentOptions } from '@motajs/system';
import { clamp, isNil } from 'lodash-es';
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { Scroll, ScrollExpose } from './scroll';
import { MotaOffscreenCanvas2D, Font } from '@motajs/render';

export interface FloorSelectorProps extends DefaultProps {
    /** 楼层列表，顺序排列，键表示楼层 id，值表示这一楼层的显示名称 */
    floors?: [string, string][];
    /** 当前选中的楼层 */
    now?: number;
    /** 每行的行高，默认 24 */
    interval?: number;
    /** 文字和竖直线是否靠右对齐 */
    alignRight?: boolean;
    /** 每行的文字使用的字体，默认使用默认字体家族，字体尺寸为行高的一半 */
    font?: Font;
}

export type FloorSelectorEmits = {
    /**
     * 当选中的楼层改变时触发
     * @param floor 楼层索引
     * @param floorId 楼层 id
     */
    update: (floor: number, floorId: string) => void;

    'update:now': (value: number) => void;
};

const floorSelectorProps = {
    props: ['floors', 'now', 'loc', 'x', 'y', 'width', 'height'],
    emits: ['update', 'update:now']
} satisfies SetupComponentOptions<
    FloorSelectorProps,
    FloorSelectorEmits,
    keyof FloorSelectorEmits
>;

export const FloorSelector = defineComponent<
    FloorSelectorProps,
    FloorSelectorEmits,
    keyof FloorSelectorEmits
>((props, { emit }) => {
    /** 当前鼠标选中楼层，反向 */
    const selList = ref(0);

    const scrollRef = ref<ScrollExpose>();

    const [loc, width, height] = lwh(props);

    /** 所有楼层的信息 */
    const floors = computed<[string, string][]>(
        () => props.floors?.toReversed() ?? [['unknown', '未知']]
    );
    /** 当前选中项的信息 */
    const current = computed(
        () => floors.value[floors.value.length - now.value - 1]
    );
    /** 每行的行高 */
    const lh = computed(() => props.interval ?? 24);
    /** 竖线的横坐标 */
    const lx = computed(() => (props.alignRight ? width.value - 4 : 4));
    /** 竖线与文字边缘的距离 */
    const pad = computed(() => (props.alignRight ? -16 : 16));
    /** 每行选项使用的字体 */
    const listFont = computed(
        () => props.font ?? Font.defaults({ size: lh.value / 2 })
    );

    /** 当前选中楼层，不反向 */
    const now = ref(clamp(props.now ?? 0, 0, floors.value.length - 1));

    /** 蒙版渐变对象 */
    let gradient: CanvasGradient | null = null;

    watch(
        () => props.now,
        value => {
            if (!isNil(value)) {
                changeTo(value);
            }
        }
    );

    watch(loc, () => {
        // 更新定位后，需要重新更新渐变对象
        gradient = null;
    });

    /** 获取蒙版渐变对象 */
    const getGradient = (ctx: CanvasRenderingContext2D) => {
        if (gradient) return gradient;
        gradient = ctx.createLinearGradient(0, 0, 0, height.value);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.8, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        return gradient;
    };

    /** 渲染蒙版渐变对象 */
    const renderMask = (canvas: MotaOffscreenCanvas2D) => {
        const { ctx } = canvas;
        const gradient = getGradient(ctx);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width.value, height.value);
    };

    /** 切换至指定楼层 */
    const changeTo = (index: number, time: number = 500) => {
        // 取反是为了符合 2.x 的操作习惯
        const res = clamp(index, 0, floors.value.length - 1);
        const reversed = floors.value.length - res - 1;
        now.value = res;
        selList.value = reversed;
        const y = reversed * lh.value;
        scrollRef.value?.scrollTo(y, time);
        emit('update', now.value, current.value[0]);
        emit('update:now', now.value);
    };

    const enterList = (index: number) => {
        selList.value = index;
    };

    onMounted(() => {
        changeTo(now.value, 0);
    });

    return () => (
        <container loc={loc.value} nocache>
            <Scroll
                ref={scrollRef}
                loc={[0, 0, width.value, height.value]}
                noscroll
                zIndex={10}
                padEnd={height.value / 2 - lh.value / 2}
            >
                {floors.value.map(([, title], i, a) => {
                    const reversed = a.length - i - 1;
                    const nowFloor = a.length - now.value - 1;
                    const highlight = nowFloor === i || selList.value === i;
                    const color = highlight ? '#fff' : '#aaa';
                    const fill = highlight ? '#fff' : '#000';
                    const y = (i - 0.5) * lh.value + height.value / 2;
                    return (
                        <container
                            nocache
                            loc={[0, y, width.value, lh.value]}
                            onEnter={() => enterList(i)}
                            onLeave={() => enterList(nowFloor)}
                            onClick={() => changeTo(reversed)}
                        >
                            <text
                                cursor="pointer"
                                text={title}
                                loc={[lx.value + pad.value, lh.value / 2]}
                                anc={[props.alignRight ? 1 : 0, 0.5]}
                                font={listFont.value}
                                fillStyle={color}
                            />
                            <g-circle
                                stroke
                                fill
                                lineWidth={1}
                                circle={[lx.value + pad.value, lh.value / 2, 3]}
                                strokeStyle={color}
                                fillStyle={nowFloor === i ? fill : '#000'}
                            />
                        </container>
                    );
                })}
            </Scroll>
            <g-line
                line={[lx.value, 0, lx.value, height.value]}
                zIndex={5}
                lineWidth={1}
                strokeStyle="#aaa"
            />
            <custom
                zIndex={20}
                loc={[0, 0, width.value, height.value]}
                nocache
                noevent
                render={renderMask}
                composite="destination-in"
                bindings={[loc.value]}
            />
        </container>
    );
}, floorSelectorProps);
