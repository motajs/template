import { GameUI, SetupComponentOptions } from '@motajs/system';
import { computed, defineComponent, ref } from 'vue';
import { Font } from '@motajs/render';
import { Scroll } from '@user/client-base';
import { EquipStatus, IHeroState } from '@user/data-base';
import { IHeroAttr } from '@user/data-common';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '../shared';
import { IUIPropsBase } from './types';

export interface IHeroAttrItem {
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

/** 区域标题字体 */
const titleFont = Font.defaults({ size: 15, weight: 700 });
/** 属性名与描述文本字体 */
const labelFont = Font.defaults({ size: 13 });

export const EquipBox = defineComponent<EquipBoxProps>(props => {
    const hero = props.heroState;

    /** 当前选中的装备实例 uid，-1 表示未选中 */
    const selected = ref(-1);

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
            if (uid === undefined) return null;
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
        const another = existing === undefined ? -1 : existing;
        return hero.equip.compareEquip(selected.value, another, target);
    });

    return () => {
        const equip = selectedEquip.value;
        const d = diff.value;
        return (
            <container loc={FULL_LOC}>
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

                <container
                    loc={[RIGHT_LEFT, DESC_TOP, RIGHT_WIDTH, DESC_HEIGHT]}
                >
                    {equip === null && (
                        <text
                            text="未选择装备"
                            loc={[8, 12]}
                            anc={[0, 0]}
                            font={labelFont}
                            fillStyle="#888888"
                        />
                    )}
                    {equip !== null && (
                        <text
                            text={equip.item.name}
                            loc={[8, 12]}
                            anc={[0, 0]}
                            font={titleFont}
                            fillStyle="gold"
                        />
                    )}
                    {equip !== null && (
                        <text
                            text={`装备孔：${equip.item.equip.slots.join(' / ')}`}
                            loc={[8, 36]}
                            anc={[0, 0]}
                            font={labelFont}
                            fillStyle="#bbbbbb"
                        />
                    )}
                    {equip !== null && (
                        <Scroll
                            noscroll
                            loc={[0, 56, RIGHT_WIDTH, DESC_HEIGHT - 56]}
                        >
                            <text
                                text={equip.item.text}
                                loc={[8, 4]}
                                anc={[0, 0]}
                                font={labelFont}
                                fillStyle="#dddddd"
                            />
                        </Scroll>
                    )}
                </container>

                <container
                    loc={[RIGHT_LEFT, SLOT_TOP, RIGHT_WIDTH, SLOT_HEIGHT]}
                >
                    <Scroll
                        hor
                        noscroll
                        loc={[0, 0, RIGHT_WIDTH, SLOT_HEIGHT]}
                    >
                        {hero.equip.slots.map((name, i) => {
                            const slotEquip = equippedList.value[i];
                            const isSelected =
                                slotEquip !== null &&
                                slotEquip.uid === selected.value;
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
                                    {slotEquip !== null && (
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
                                        loc={[
                                            58,
                                            OWNED_ROW_HEIGHT / 2
                                        ]}
                                        anc={[0, 0.5]}
                                        font={labelFont}
                                        fillStyle="#eeeeee"
                                    />
                                </container>
                            );
                        })}
                    </Scroll>
                </container>

                <text
                    text="退出"
                    loc={[MAIN_WIDTH - 12, MAIN_HEIGHT - 10]}
                    anc={[1, 1]}
                    font={titleFont}
                    cursor="pointer"
                    fillStyle="#ffffff"
                />
            </container>
        );
    };
}, equipBoxProps);

export const EquipBoxUI = new GameUI('equipbox', EquipBox);
