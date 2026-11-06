import { GameUI, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, ref } from 'vue';
import { isNil } from 'lodash-es';
import { Font } from '@motajs/render';
import { ElementLocator, IActionEvent } from '@motajs/render';
import { Scroll, TextContent, useKey } from '@user/client-base';
import { EquipStatus, IEquipmentState, IHeroState } from '@user/data-base';
import { IHeroAttr } from '@user/data-common';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '@/client';
import { IGameUIPropsBase } from '@user/client-base';
import { ToolBoxUI } from './toolbox';

interface IHeroAttrItem {
    /** 勇士属性的键名 */
    readonly id: keyof IHeroAttr;
    /** 该属性在状态区域显示的中文名 */
    readonly name: string;
}

export interface EquipBoxProps extends IGameUIPropsBase {
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
/** 描述列表区域的顶部纵坐标，装备名与装备孔占用其上方的 56 像素 */
const DESC_LIST_TOP = DESC_TOP + 56;
/** 描述列表区域的高度 */
const DESC_LIST_HEIGHT = DESC_HEIGHT - 56;
/** 拥有装备列表区域的顶部纵坐标，标题占用其上方的空间 */
const OWNED_LIST_TOP = OWNED_TOP + OWNED_HEADER;
/** 拥有装备列表区域的高度 */
const OWNED_LIST_HEIGHT = OWNED_HEIGHT - OWNED_HEADER;
/** 状态区滚动区域的外接矩形，只由既有布局常量组成 */
const STATUS_SCROLL_LOC: ElementLocator = [
    0,
    STATUS_HEADER,
    STATUS_WIDTH,
    MAIN_HEIGHT - STATUS_HEADER
];
/** 描述区滚动区域的外接矩形，只由既有布局常量组成 */
const DESC_SCROLL_LOC: ElementLocator = [
    RIGHT_LEFT,
    DESC_LIST_TOP,
    RIGHT_WIDTH,
    DESC_LIST_HEIGHT
];
/** 装备槽区滚动区域的外接矩形，只由既有布局常量组成 */
const SLOT_SCROLL_LOC: ElementLocator = [
    RIGHT_LEFT,
    SLOT_TOP,
    RIGHT_WIDTH,
    SLOT_HEIGHT
];
/** 拥有装备区滚动区域的外接矩形，只由既有布局常量组成 */
const OWNED_SCROLL_LOC: ElementLocator = [
    RIGHT_LEFT,
    OWNED_LIST_TOP,
    RIGHT_WIDTH,
    OWNED_LIST_HEIGHT
];
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
            // 拖拽已装备的装备：目标槽有效且可装备则换装，否则卸下
            if (
                target >= 0 &&
                target !== fromSlot &&
                hero.equip.canEquipTo(uid, target) !== EquipStatus.CannotEquip
            ) {
                hero.equip.equip(uid, target, true);
            } else {
                hero.equip.unequip(fromSlot);
            }
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

    /** 打开道具栏界面 */
    const toTool = () => {
        props.controller.keep();
        props.controller.close(props.instance);
        props.controller.open(ToolBoxUI, {
            heroState: props.heroState,
            attributes: props.attributes
        });
    };

    const key = useKey(props.state.hotkey.system)!;
    key.implement('@common/exit', exit).implement('@ui/command', exit);

    /** 把指针移动转发给拖拽跟踪，组件需要的是无参事件处理器 */
    const onMove = (ev: IActionEvent) => {
        movePress(ev.absoluteX, ev.absoluteY);
    };

    /** 生成装备槽的悬停处理器，指针进入时记录当前槽位 */
    const getSlotEnter = (slot: number) => () => {
        hoverSlot.value = slot;
    };

    /** 生成装备槽的离开处理器，仅在仍悬停该槽时清除悬停态 */
    const getSlotLeave = (slot: number) => () => {
        if (hoverSlot.value === slot) hoverSlot.value = -1;
    };

    /** 生成装备槽图标的按下处理器，按下时以槽位来源开始跟踪 */
    const getSlotDown =
        (equip: IEquipmentState<IHeroAttr> | null, slot: number) =>
        (ev: IActionEvent) => {
            if (!equip) return;
            startPress(equip.uid, slot, ev.absoluteX, ev.absoluteY);
        };

    /** 生成拥有装备行的按下处理器，按下时以拥有装备来源开始跟踪 */
    const getOwnedDown = (uid: number) => (ev: IActionEvent) => {
        startPress(uid, -1, ev.absoluteX, ev.absoluteY);
    };

    return () => {
        const equip = selectedEquip.value;
        const d = diff.value;
        const dragLoc: ElementLocator = [
            dragX.value - DRAG_ICON_SIZE / 2,
            dragY.value - DRAG_ICON_SIZE / 2,
            DRAG_ICON_SIZE,
            DRAG_ICON_SIZE
        ];
        return (
            <container loc={FULL_LOC} onMove={onMove} onUp={endPress}>
                {/* 右上角跳到道具栏 */}
                <text
                    text="道具栏 →"
                    loc={[MAIN_WIDTH - 8, 8]}
                    anc={[1, 0]}
                    font={titleFont}
                    cursor="pointer"
                    fillStyle="gold"
                    onClick={toTool}
                />
                {/* 状态区 */}
                <text
                    text="状态"
                    loc={[8, 8]}
                    anc={[0, 0]}
                    font={titleFont}
                    fillStyle="gold"
                />
                <Scroll noscroll loc={STATUS_SCROLL_LOC}>
                    {/* 每行属性名、数值与增减值，直接作为 Scroll 子项 */}
                    {props.attributes.map((attr, i) => {
                        const value = hero.attribute.getFinalAttribute(attr.id);
                        let delta = 0;
                        if (d) {
                            const raw = d[attr.id];
                            if (typeof raw === 'number') delta = raw;
                        }
                        const valueX =
                            delta === 0 ? STATUS_WIDTH - 8 : STATUS_WIDTH - 60;
                        const y = i * STATUS_ROW_HEIGHT;
                        const deltaLoc: ElementLocator = [
                            STATUS_WIDTH - 8,
                            y + STATUS_ROW_HEIGHT / 2
                        ];
                        return [
                            <text
                                text={attr.name}
                                loc={[8, y + STATUS_ROW_HEIGHT / 2]}
                                anc={[0, 0.5]}
                                font={labelFont}
                                fillStyle="#dddddd"
                            />,
                            <text
                                text={String(value)}
                                loc={[valueX, y + STATUS_ROW_HEIGHT / 2]}
                                anc={[1, 0.5]}
                                font={labelFont}
                                fillStyle="#ffffff"
                            />,
                            // Scroll 会覆盖直接子元素的 hidden，增减值为 0 时改用空文本
                            <text
                                text={
                                    delta === 0
                                        ? ''
                                        : `(${delta > 0 ? '+' : ''}${delta})`
                                }
                                loc={deltaLoc}
                                anc={[1, 0.5]}
                                font={labelFont}
                                fillStyle={delta > 0 ? '#57ff78' : '#ff5a5a'}
                            />
                        ];
                    })}
                </Scroll>

                {/* 描述区 */}
                <text
                    text="未选择装备"
                    loc={[RIGHT_LEFT + 8, DESC_TOP + 12]}
                    anc={[0, 0]}
                    font={labelFont}
                    fillStyle="#888888"
                    hidden={!!equip}
                />
                <text
                    text={equip ? equip.item.name : ''}
                    loc={[RIGHT_LEFT + 8, DESC_TOP + 12]}
                    anc={[0, 0]}
                    font={titleFont}
                    fillStyle="gold"
                    hidden={!equip}
                />
                <text
                    text={
                        equip
                            ? `装备孔：${equip.item.equip.slots.join(' / ')}`
                            : ''
                    }
                    loc={[RIGHT_LEFT + 8, DESC_TOP + 36]}
                    anc={[0, 0]}
                    font={labelFont}
                    fillStyle="#bbbbbb"
                    hidden={!equip}
                />
                <Scroll noscroll loc={DESC_SCROLL_LOC}>
                    <TextContent
                        text={equip ? equip.item.text : ''}
                        width={RIGHT_WIDTH - 16}
                        loc={[8, 4, RIGHT_WIDTH - 16, DESC_HEIGHT - 60]}
                        font={labelFont}
                        fillStyle="#dddddd"
                    />
                </Scroll>

                {/* 装备槽区 */}
                <Scroll hor noscroll loc={SLOT_SCROLL_LOC}>
                    {/* 每格槽底、图标与槽名，直接作为 Scroll 子项 */}
                    {hero.equip.slots.map((name, i) => {
                        const slotEquip = equippedList.value[i];
                        const isSelected =
                            !!slotEquip && slotEquip.uid === selected.value;
                        const cellX = i * SLOT_CELL_WIDTH;
                        const slotCellLoc: ElementLocator = [
                            cellX + 4,
                            4,
                            SLOT_CELL_WIDTH - 8,
                            SLOT_HEIGHT - 8
                        ];
                        const slotIconLoc: ElementLocator = [
                            cellX + (SLOT_CELL_WIDTH - SLOT_ICON_SIZE) / 2,
                            14,
                            SLOT_ICON_SIZE,
                            SLOT_ICON_SIZE
                        ];
                        const slotNameLoc: ElementLocator = [
                            cellX + SLOT_CELL_WIDTH / 2,
                            SLOT_HEIGHT - 12
                        ];
                        return [
                            <g-rectr
                                loc={slotCellLoc}
                                circle={[6]}
                                fill
                                stroke
                                fillStyle="rgba(255, 255, 255, 0.08)"
                                strokeStyle={isSelected ? 'gold' : '#666666'}
                                lineWidth={isSelected ? 2 : 1}
                                cursor="pointer"
                                onEnter={getSlotEnter(i)}
                                onLeave={getSlotLeave(i)}
                            />,
                            // 拖动起手仍只在图标上，整格只负责悬停判定
                            <icon
                                icon={slotEquip ? slotEquip.item.num : 0}
                                loc={slotIconLoc}
                                cursor="pointer"
                                onEnter={getSlotEnter(i)}
                                onLeave={getSlotLeave(i)}
                                onDown={getSlotDown(slotEquip, i)}
                            />,
                            <text
                                text={name}
                                loc={slotNameLoc}
                                anc={[0.5, 0.5]}
                                font={labelFont}
                                fillStyle="#cccccc"
                                noevent
                            />
                        ];
                    })}
                </Scroll>

                {/* 拥有装备区 */}
                <text
                    text="拥有装备"
                    loc={[RIGHT_LEFT + 8, OWNED_TOP + 2]}
                    anc={[0, 0]}
                    font={titleFont}
                    fillStyle="gold"
                />
                <Scroll noscroll loc={OWNED_SCROLL_LOC}>
                    {/* 每行行底、图标与名称，直接作为 Scroll 子项 */}
                    {owned.value.map((item, i) => {
                        const isSelected = item.uid === selected.value;
                        const y = i * OWNED_ROW_HEIGHT;
                        const ownedCellLoc: ElementLocator = [
                            4,
                            y + 2,
                            RIGHT_WIDTH - 8,
                            OWNED_ROW_HEIGHT - 4
                        ];
                        const ownedIconLoc: ElementLocator = [
                            10,
                            y + 6,
                            OWNED_ICON_SIZE,
                            OWNED_ICON_SIZE
                        ];
                        return [
                            <g-rectr
                                loc={ownedCellLoc}
                                circle={[4]}
                                fill
                                fillStyle={
                                    isSelected
                                        ? 'rgba(255, 204, 0, 0.28)'
                                        : 'rgba(255, 255, 255, 0.05)'
                                }
                                cursor="pointer"
                                onDown={getOwnedDown(item.uid)}
                            />,
                            <icon
                                icon={item.item.num}
                                loc={ownedIconLoc}
                                noevent
                            />,
                            <text
                                text={item.item.name}
                                loc={[58, y + OWNED_ROW_HEIGHT / 2]}
                                anc={[0, 0.5]}
                                font={labelFont}
                                fillStyle="#eeeeee"
                                noevent
                            />
                        ];
                    })}
                </Scroll>

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
                <icon
                    icon={dragNum.value > 0 ? dragNum.value : 0}
                    loc={dragLoc}
                    noevent
                    zIndex={100}
                    hidden={!dragging.value}
                />
            </container>
        );
    };
}, equipBoxProps);

/** 装备界面的 UI 控制器 */
export const EquipBoxUI = new GameUI('equipbox', EquipBox);
