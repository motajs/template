import { GameUI, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, ref } from 'vue';
import { isNil } from 'lodash-es';
import { Font } from '@motajs/render';
import { Scroll, TextContent } from '@user/client-base';
import { EquipStatus, IHeroState } from '@user/data-base';
import { IHeroAttr } from '@user/data-common';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from './constant';
import { IUIPropsBase } from '@user/client-modules';

interface IHeroAttrItem {
    /** 勇士属性的键名 */
    readonly id: keyof IHeroAttr;
    /** 该属性在状态区域显示的中文名 */
    readonly name: string;
}

export interface EquipBoxProps extends IUIPropsBase {
    /** 勇士状态对象 */
    heroState: IHeroState<IHeroAttr>;
    /** 状态区域要列举的属性，按数组顺序自上而下展示 */
    attributes: readonly IHeroAttrItem[];
}

/** 装备界面组件的 props 声明 */
const equipBoxProps = {
    props: ['controller', 'instance', 'state', 'heroState', 'attributes']
} satisfies SetupComponentOptions<EquipBoxProps>;

/** 左侧状态区域宽度 */
const STATUS_WIDTH = 180;
/** 左侧状态区域标题占用的高度 */
const STATUS_HEADER = 28;
/** 左侧状态区域每一行的高度 */
const STATUS_ROW_HEIGHT = 26;
/** 右侧区域起始横坐标 */
const RIGHT_LEFT = STATUS_WIDTH;
/** 右侧区域宽度 */
const RIGHT_WIDTH = MAIN_WIDTH - RIGHT_LEFT;
/** 装备描述区域顶部纵坐标 */
const DESC_TOP = 8;
/** 装备描述区域高度 */
const DESC_HEIGHT = 100;
/** 装备槽区域顶部纵坐标 */
const SLOT_TOP = DESC_TOP + DESC_HEIGHT;
/** 装备槽区域高度 */
const SLOT_HEIGHT = 112;
/** 单个装备槽的宽度 */
const SLOT_CELL_WIDTH = 76;
/** 装备槽内图标的尺寸 */
const SLOT_ICON_SIZE = 40;
/** 拥有装备区域顶部纵坐标 */
const OWNED_TOP = SLOT_TOP + SLOT_HEIGHT;
/** 拥有装备区域高度，底部为退出按钮留出空间 */
const OWNED_HEIGHT = MAIN_HEIGHT - OWNED_TOP - 32;
/** 拥有装备区域标题占用的高度 */
const OWNED_HEADER = 22;
/** 拥有装备每一行的高度 */
const OWNED_ROW_HEIGHT = 50;
/** 拥有装备行内图标的尺寸 */
const OWNED_ICON_SIZE = 40;
/** 拖拽浮层图标的尺寸 */
const DRAG_ICON_SIZE = 44;
/** 判定为拖拽所需的最小移动距离（像素） */
const DRAG_THRESHOLD = 8;

/** 区域标题字体 */
const titleFont = Font.defaults({ size: 15, weight: 700 });
/** 属性名与描述文本字体 */
const labelFont = Font.defaults({ size: 13 });

/** 装备界面组件 */
export const EquipBox = defineComponent<EquipBoxProps>(props => {
    /** 勇士状态对象 */
    const hero = props.heroState;

    /** 当前选中的装备实例 uid，-1 表示未选中 */
    const selected = ref(-1);
    /** 被拖拽的装备实例 uid，-1 表示当前没有拖拽 */
    const dragUid = ref(-1);
    /** 拖拽来源的装备槽索引，-1 表示来自拥有装备列表 */
    const dragFromSlot = ref(-1);
    /** 拖拽起点的绝对横坐标 */
    const dragStartX = ref(0);
    /** 拖拽起点的绝对纵坐标 */
    const dragStartY = ref(0);
    /** 指针当前的绝对横坐标 */
    const dragX = ref(0);
    /** 指针当前的绝对纵坐标 */
    const dragY = ref(0);
    /** 本次按下是否已越过阈值进入拖拽 */
    const dragging = ref(false);
    /** 指针当前悬停的装备槽索引，-1 表示未悬停在任何槽 */
    const hoverSlot = ref(-1);

    /**
     * 获取装备可装备至的同类型第一个槽位索引，找不到时返回 -1
     * @param uid 装备实例 uid
     */
    const getTargetSlot = (uid: number) => {
        for (let i = 0; i < hero.equip.slots.length; i++) {
            if (hero.equip.canEquipTo(uid, i) !== EquipStatus.CannotEquip) {
                return i;
            }
        }
        return -1;
    };

    /** 拥有装备列表，按装备道具图块数字升序排列 */
    const owned = computed(() => {
        const list = hero.items.equipment.instances();
        return list.slice().sort((a, b) => a.item.num - b.item.num);
    });

    /** 各装备槽当前所装备的实例，未装备的槽为 null */
    const equippedList = computed(() => {
        return hero.equip.slots.map((_, i) => {
            const uid = hero.equip.getEquipped(i);
            if (isNil(uid)) return null;
            return hero.items.equipment.get(uid);
        });
    });

    /** 当前选中的装备实例，未选中时为 null */
    const selectedEquip = computed(() => {
        if (selected.value < 0) return null;
        return hero.items.equipment.get(selected.value);
    });

    /** 选中装备所处的装备槽索引，未装备时为 -1 */
    const selectedSlot = computed(() => {
        if (selected.value < 0) return -1;
        for (let i = 0; i < hero.equip.slots.length; i++) {
            if (hero.equip.getEquipped(i) === selected.value) return i;
        }
        return -1;
    });

    // 未装备的装备与同类型第一个槽位对比；已装备的装备仅展示卸下带来的增减
    const diff = computed<Readonly<Partial<IHeroAttr>> | null>(() => {
        if (selected.value < 0) return null;
        const equippedSlot = selectedSlot.value;
        if (equippedSlot >= 0) {
            return hero.equip.compareEquip(-1, selected.value, equippedSlot);
        }
        const target = getTargetSlot(selected.value);
        if (target < 0) return null;
        const existing = hero.equip.getEquipped(target);
        const another = isNil(existing) ? -1 : existing;
        return hero.equip.compareEquip(selected.value, another, target);
    });

    /** 被拖拽装备的图块数字，未拖拽时为 -1 */
    const dragNum = computed(() => {
        if (dragUid.value < 0) return -1;
        const equip = hero.items.equipment.get(dragUid.value);
        return equip ? equip.item.num : -1;
    });

    /**
     * 开始跟踪一次装备按下，记录起点并按来源区分装备槽与拥有装备
     * @param uid 装备实例 uid
     * @param fromSlot 装备所处的装备槽索引，来自拥有装备列表时为 -1
     * @param x 按下点的绝对横坐标
     * @param y 按下点的绝对纵坐标
     */
    const startPress = (
        uid: number,
        fromSlot: number,
        x: number,
        y: number
    ) => {
        dragUid.value = uid;
        dragFromSlot.value = fromSlot;
        dragStartX.value = x;
        dragStartY.value = y;
        dragX.value = x;
        dragY.value = y;
        dragging.value = false;
        hoverSlot.value = -1;
    };

    /**
     * 跟踪指针移动，越过阈值后进入拖拽态并更新浮层位置
     * @param x 指针当前的绝对横坐标
     * @param y 指针当前的绝对纵坐标
     */
    const movePress = (x: number, y: number) => {
        if (dragUid.value < 0) return;
        dragX.value = x;
        dragY.value = y;
        const dx = x - dragStartX.value;
        const dy = y - dragStartY.value;
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
            dragging.value = true;
        }
    };

    // 释放指针：未越过阈值视为点击选中；越过阈值则按来源执行穿脱
    const endPress = () => {
        if (dragUid.value < 0) return;
        const uid = dragUid.value;
        const fromSlot = dragFromSlot.value;
        const target = hoverSlot.value;
        const wasDragging = dragging.value;
        dragUid.value = -1;
        dragFromSlot.value = -1;
        dragging.value = false;
        hoverSlot.value = -1;
        if (!wasDragging) {
            // 再次点击同一件未装备的装备，将它穿到同类型第一个槽位
            if (fromSlot < 0 && selected.value === uid) {
                const slot = getTargetSlot(uid);
                if (slot >= 0) hero.equip.equip(uid, slot, true);
            }
            selected.value = uid;
            return;
        }
        if (fromSlot >= 0) {
            // 拖拽已装备的装备，释放时卸下
            hero.equip.unequip(fromSlot);
            return;
        }
        if (
            target >= 0 &&
            hero.equip.canEquipTo(uid, target) !== EquipStatus.CannotEquip
        ) {
            hero.equip.equip(uid, target, true);
        }
    };

    /** 关闭当前装备界面 */
    const exit = () => props.controller.close(props.instance);

    return () => {
        const equip = selectedEquip.value;
        const d = diff.value;
        return (
            <container
                loc={FULL_LOC}
                onMove={ev => movePress(ev.absoluteX, ev.absoluteY)}
                onUp={endPress}
            >
                {/* 状态区 */}
                <text
                    text="状态"
                    loc={[8, 8]}
                    anc={[0, 0]}
                    font={titleFont}
                    fillStyle="gold"
                />
                <Scroll
                    noscroll
                    loc={[
                        0,
                        STATUS_HEADER,
                        STATUS_WIDTH,
                        MAIN_HEIGHT - STATUS_HEADER
                    ]}
                >
                    {props.attributes.map((attr, i) => {
                        const value = hero.attribute.getFinalAttribute(attr.id);
                        let delta = 0;
                        if (d) {
                            const raw = d[attr.id];
                            if (typeof raw === 'number') delta = raw;
                        }
                        const valueX =
                            delta === 0 ? STATUS_WIDTH - 8 : STATUS_WIDTH - 60;
                        return (
                            <container
                                key={attr.id}
                                loc={[
                                    0,
                                    i * STATUS_ROW_HEIGHT,
                                    STATUS_WIDTH,
                                    STATUS_ROW_HEIGHT
                                ]}
                            >
                                <text
                                    text={attr.name}
                                    loc={[8, STATUS_ROW_HEIGHT / 2]}
                                    anc={[0, 0.5]}
                                    font={labelFont}
                                    fillStyle="#dddddd"
                                />
                                <text
                                    text={String(value)}
                                    loc={[valueX, STATUS_ROW_HEIGHT / 2]}
                                    anc={[1, 0.5]}
                                    font={labelFont}
                                    fillStyle="#ffffff"
                                />
                                {delta !== 0 && (
                                    <text
                                        text={`(${delta > 0 ? '+' : ''}${delta})`}
                                        loc={[
                                            STATUS_WIDTH - 8,
                                            STATUS_ROW_HEIGHT / 2
                                        ]}
                                        anc={[1, 0.5]}
                                        font={labelFont}
                                        fillStyle={
                                            delta > 0 ? '#57ff78' : '#ff5a5a'
                                        }
                                    />
                                )}
                            </container>
                        );
                    })}
                </Scroll>

                {/* 描述区 */}
                <container
                    loc={[RIGHT_LEFT, DESC_TOP, RIGHT_WIDTH, DESC_HEIGHT]}
                >
                    {!equip && (
                        <text
                            text="未选择装备"
                            loc={[8, 12]}
                            anc={[0, 0]}
                            font={labelFont}
                            fillStyle="#888888"
                        />
                    )}
                    {equip && (
                        <text
                            text={equip.item.name}
                            loc={[8, 12]}
                            anc={[0, 0]}
                            font={titleFont}
                            fillStyle="gold"
                        />
                    )}
                    {equip && (
                        <text
                            text={`装备孔：${equip.item.equip.slots.join(' / ')}`}
                            loc={[8, 36]}
                            anc={[0, 0]}
                            font={labelFont}
                            fillStyle="#bbbbbb"
                        />
                    )}
                    {equip && (
                        <Scroll
                            noscroll
                            loc={[0, 56, RIGHT_WIDTH, DESC_HEIGHT - 56]}
                        >
                            <TextContent
                                text={equip.item.text}
                                width={RIGHT_WIDTH - 16}
                                loc={[8, 4, RIGHT_WIDTH - 16, DESC_HEIGHT - 60]}
                                font={labelFont}
                                fillStyle="#dddddd"
                            />
                        </Scroll>
                    )}
                </container>

                {/* 装备槽区 */}
                <container
                    loc={[RIGHT_LEFT, SLOT_TOP, RIGHT_WIDTH, SLOT_HEIGHT]}
                >
                    <Scroll hor noscroll loc={[0, 0, RIGHT_WIDTH, SLOT_HEIGHT]}>
                        {hero.equip.slots.map((name, i) => {
                            const slotEquip = equippedList.value[i];
                            const isSelected =
                                !!slotEquip && slotEquip.uid === selected.value;
                            return (
                                <container
                                    key={i}
                                    loc={[
                                        i * SLOT_CELL_WIDTH,
                                        0,
                                        SLOT_CELL_WIDTH,
                                        SLOT_HEIGHT
                                    ]}
                                    cursor="pointer"
                                    onEnter={() => {
                                        hoverSlot.value = i;
                                    }}
                                    onLeave={() => {
                                        if (hoverSlot.value === i) {
                                            hoverSlot.value = -1;
                                        }
                                    }}
                                >
                                    <g-rectr
                                        loc={[
                                            4,
                                            4,
                                            SLOT_CELL_WIDTH - 8,
                                            SLOT_HEIGHT - 8
                                        ]}
                                        circle={[6]}
                                        fill
                                        stroke
                                        fillStyle="rgba(255, 255, 255, 0.08)"
                                        strokeStyle={
                                            isSelected ? 'gold' : '#666666'
                                        }
                                        lineWidth={isSelected ? 2 : 1}
                                    />
                                    {slotEquip && (
                                        <icon
                                            icon={slotEquip.item.num}
                                            loc={[
                                                (SLOT_CELL_WIDTH -
                                                    SLOT_ICON_SIZE) /
                                                    2,
                                                14,
                                                SLOT_ICON_SIZE,
                                                SLOT_ICON_SIZE
                                            ]}
                                            cursor="pointer"
                                            onDown={ev =>
                                                startPress(
                                                    slotEquip.uid,
                                                    i,
                                                    ev.absoluteX,
                                                    ev.absoluteY
                                                )
                                            }
                                        />
                                    )}
                                    <text
                                        text={name}
                                        loc={[
                                            SLOT_CELL_WIDTH / 2,
                                            SLOT_HEIGHT - 12
                                        ]}
                                        anc={[0.5, 0.5]}
                                        font={labelFont}
                                        fillStyle="#cccccc"
                                    />
                                </container>
                            );
                        })}
                    </Scroll>
                </container>

                {/* 拥有装备区 */}
                <container
                    loc={[RIGHT_LEFT, OWNED_TOP, RIGHT_WIDTH, OWNED_HEIGHT]}
                >
                    <text
                        text="拥有装备"
                        loc={[8, 2]}
                        anc={[0, 0]}
                        font={titleFont}
                        fillStyle="gold"
                    />
                    <Scroll
                        noscroll
                        loc={[
                            0,
                            OWNED_HEADER,
                            RIGHT_WIDTH,
                            OWNED_HEIGHT - OWNED_HEADER
                        ]}
                    >
                        {owned.value.map((item, i) => {
                            const isSelected = item.uid === selected.value;
                            return (
                                <container
                                    key={item.uid}
                                    loc={[
                                        0,
                                        i * OWNED_ROW_HEIGHT,
                                        RIGHT_WIDTH,
                                        OWNED_ROW_HEIGHT
                                    ]}
                                    cursor="pointer"
                                    onDown={ev =>
                                        startPress(
                                            item.uid,
                                            -1,
                                            ev.absoluteX,
                                            ev.absoluteY
                                        )
                                    }
                                >
                                    <g-rectr
                                        loc={[
                                            4,
                                            2,
                                            RIGHT_WIDTH - 8,
                                            OWNED_ROW_HEIGHT - 4
                                        ]}
                                        circle={[4]}
                                        fill
                                        fillStyle={
                                            isSelected
                                                ? 'rgba(255, 204, 0, 0.28)'
                                                : 'rgba(255, 255, 255, 0.05)'
                                        }
                                    />
                                    <icon
                                        icon={item.item.num}
                                        loc={[
                                            10,
                                            6,
                                            OWNED_ICON_SIZE,
                                            OWNED_ICON_SIZE
                                        ]}
                                    />
                                    <text
                                        text={item.item.name}
                                        loc={[58, OWNED_ROW_HEIGHT / 2]}
                                        anc={[0, 0.5]}
                                        font={labelFont}
                                        fillStyle="#eeeeee"
                                    />
                                </container>
                            );
                        })}
                    </Scroll>
                </container>

                {/* 右下角退出按钮 */}
                <text
                    text="退出"
                    loc={[MAIN_WIDTH - 12, MAIN_HEIGHT - 10]}
                    anc={[1, 1]}
                    font={titleFont}
                    cursor="pointer"
                    fillStyle="#ffffff"
                    onClick={exit}
                />

                {/* 拖拽浮层 */}
                {dragging.value && (
                    <icon
                        icon={dragNum.value}
                        loc={[
                            dragX.value - DRAG_ICON_SIZE / 2,
                            dragY.value - DRAG_ICON_SIZE / 2,
                            DRAG_ICON_SIZE,
                            DRAG_ICON_SIZE
                        ]}
                        noevent
                        zIndex={100}
                    />
                )}
            </container>
        );
    };
}, equipBoxProps);

/** 装备界面的 UI 控制器 */
export const EquipBoxUI = new GameUI('equipbox', EquipBox);
