import {
    EVENT_KEY_CODE_MAP,
    GameUI,
    IHotkeyCommand,
    KeyCode,
    KeyCodeUtils,
    SetupComponentOptions
} from '@motajs/system';
import { ElementLocator, Font } from '@motajs/render';
import { computed, defineComponent, onUnmounted, ref, shallowRef } from 'vue';
import { IGameUIPropsBase, ListPage, Scroll, useKey } from '@user/client-base';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '@/client/uiConstant';

/** 界面左侧与顶部的内边距 */
const LEFT_PAD = 16;
const TOP_PAD = 16;
/** 左侧分组列表的宽度 */
const GROUP_WIDTH = 180;
/** 左侧分组列表占整个界面的宽度比例，交给 ListPage 决定列表区宽度 */
const GROUP_BASIS = GROUP_WIDTH / MAIN_WIDTH;
/** ListPage 内容区的宽度，即界面总宽减去左栏所占的比例 */
const CONTENT_WIDTH = MAIN_WIDTH * (1 - GROUP_BASIS);
/** 右栏指令区域的宽度，左右各留出一份内边距 */
const COMMAND_WIDTH = CONTENT_WIDTH - LEFT_PAD * 3;
/** 左侧每一行分组的高度 */
const GROUP_ROW_HEIGHT = 24;
/** 左侧列表区域的起始纵坐标 */
const LIST_TOP = TOP_PAD + 32;
/** 左右两栏列表区域的高度，底部留出返回按钮的空间 */
const LIST_HEIGHT = MAIN_HEIGHT - LIST_TOP - 48;
/** 右栏指令区域在 ListPage 内容区内的定位，叠加内容区原点后与原有绝对位置一致 */
const COMMAND_SCROLL_LOC: ElementLocator = [
    LEFT_PAD * 2,
    LIST_TOP,
    COMMAND_WIDTH,
    LIST_HEIGHT
];
/** 关闭按钮的定位，放在界面左下角，文本由 ListPage 内置渲染 */
const CLOSE_LOC: ElementLocator = [
    LEFT_PAD,
    MAIN_HEIGHT - LEFT_PAD,
    void 0,
    void 0,
    0,
    1
];
/** 单个按键框的宽度 */
const KEY_BOX_WIDTH = 180;
/** 单个按键框的高度 */
const KEY_BOX_HEIGHT = 24;
/** 指令之间的纵向间隔 */
const COMMAND_GAP = 12;
/** 按键框左边缘的横坐标 */
const BOX_LEFT = COMMAND_WIDTH - KEY_BOX_WIDTH - LEFT_PAD;
/** 按键框命中矩形的高度，比整框少 4 像素以保留边框间隙 */
const BOX_FILL_HEIGHT = KEY_BOX_HEIGHT - 4;
/** 指令名的文本起始横坐标 */
const COMMAND_TEXT_LEFT = 8;
/** 指令名相对所在行顶部的纵向偏移 */
const COMMAND_TEXT_TOP = 12;
/** 界面内所有文本共用的字体 */
const CONTENT_FONT = Font.defaults({ size: 13 });

export interface HotkeySettingsProps extends IGameUIPropsBase {}

/** 热键设置组件的 props 声明 */
const hotkeySettingsProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<HotkeySettingsProps>;

interface ICommandRow {
    /** 该行对应的指令 */
    readonly command: IHotkeyCommand;
    /** 该行顶部纵坐标 */
    readonly top: number;
}

/** 热键设置界面，左栏切换分组，右栏为每条指令的每个按键组合显示一个可点击框 */
export const HotkeySettings = defineComponent<HotkeySettingsProps>(props => {
    const hotkey = props.state.hotkey;
    const groups = Array.from(hotkey.iterateGroups());
    const selectedGroup = ref(groups.length > 0 ? groups[0][0] : '');
    /** 分组列表的显示项，第一项为分组 id，第二项为分组名称 */
    const groupItems: [string, string][] = groups.map(([id, group]) => [
        id,
        group.name
    ]);
    const commands = computed(() => {
        const group = hotkey.getGroup(selectedGroup.value);
        return group ? group.commands : [];
    });
    const selectedCommand = shallowRef<IHotkeyCommand | null>(null);
    const selectedIndex = ref(-1);
    const heldKeys = ref<KeyCode[]>([]);
    const combinationLists = ref<KeyCode[][][]>([]);

    /** 将按键组合格式化为显示文本，空组合显示为未设置 */
    const formatCombination = (keys: readonly KeyCode[]): string => {
        if (keys.length === 0) return '未设置';
        return keys.map(key => KeyCodeUtils.toString(key)).join(' + ');
    };

    /** 重建按键组合快照，指令实例不是响应式的，不重建会让写回后的界面仍显示旧组合 */
    const refreshCombinations = (): void => {
        const lists: KeyCode[][][] = [];
        for (const command of commands.value) {
            const keys: KeyCode[][] = [];
            for (const pair of command.iterateKeyCombinations()) {
                keys.push(pair[1].slice());
            }
            lists.push(keys);
        }
        combinationLists.value = lists;
    };

    // 一次遍历预计算每条指令的顶部纵坐标，避免逐行求和
    const commandRows = computed<ICommandRow[]>(() => {
        const rows: ICommandRow[] = [];
        let top = 0;
        for (const command of commands.value) {
            const height =
                Math.max(command.length, 1) * KEY_BOX_HEIGHT + COMMAND_GAP;
            rows.push({ command, top });
            top += height;
        }
        return rows;
    });

    /** 移除文档上的按键监听 */
    const removeCapture = (): void => {
        document.removeEventListener('keydown', onKeyDown, true);
        document.removeEventListener('keyup', onKeyUp, true);
    };

    /** 取消捕获并清空选中态 */
    const cancelCapture = (): void => {
        removeCapture();
        selectedCommand.value = null;
        selectedIndex.value = -1;
        heldKeys.value = [];
    };

    /** 切换分组后右栏指令随之切换，并取消当前捕获 */
    const selectGroup = (id: string): void => {
        cancelCapture();
        selectedGroup.value = id;
        refreshCombinations();
    };

    /** 选中一个按键框，并以捕获阶段监听文档按键事件 */
    const selectKey = (command: IHotkeyCommand, index: number): void => {
        cancelCapture();
        selectedCommand.value = command;
        selectedIndex.value = index;
        document.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('keyup', onKeyUp, true);
    };

    /** 生成按键框的点击处理器，捕获该框对应的指令与组合下标 */
    const getKeyClick = (command: IHotkeyCommand, index: number) => () => {
        selectKey(command, index);
    };

    /** 捕获阶段处理按下事件，忽略重复与无法映射的按键 */
    const onKeyDown = (event: KeyboardEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (event.repeat) return;
        const code = EVENT_KEY_CODE_MAP[event.keyCode];
        if (code === KeyCode.Unknown || !code) return;
        if (!heldKeys.value.includes(code)) heldKeys.value.push(code);
    };

    /** 捕获阶段处理抬起事件，首次抬起结束捕获并以抬起键作为主键 */
    const onKeyUp = (event: KeyboardEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const code = EVENT_KEY_CODE_MAP[event.keyCode];
        if (code === KeyCode.Unknown || !code) return;
        const command = selectedCommand.value;
        if (!command) {
            cancelCapture();
            return;
        }
        const combination = heldKeys.value.filter(key => key !== code);
        combination.push(code);
        command.setKeyCombination(selectedIndex.value, combination);
        refreshCombinations();
        cancelCapture();
    };

    onUnmounted(cancelCapture);
    refreshCombinations();

    const key = useKey(props.state.hotkey.system)!;
    key.implement('@common/exit', () => {
        if (selectedCommand.value) return;
        props.controller.close(props.instance);
    });

    /** 关闭界面，返回文本是实际的关闭路径 */
    const close = (): void => {
        cancelCapture();
        props.controller.close(props.instance);
    };

    /** 渲染右栏指令区，作为 ListPage 默认插槽的内容 */
    const renderCommands = () => (
        <Scroll loc={COMMAND_SCROLL_LOC}>
            {/* 每条指令名与它的每个按键框、组合文本，展开为同级子项 */}
            {commandRows.value.map((row, i) => {
                const list = combinationLists.value[i] ?? [];
                const nameLoc: ElementLocator = [
                    COMMAND_TEXT_LEFT,
                    row.top + COMMAND_TEXT_TOP
                ];
                return [
                    <text
                        text={row.command.name}
                        loc={nameLoc}
                        anc={[0, 0]}
                        font={CONTENT_FONT}
                        fillStyle="#ffffff"
                        noevent
                    />,
                    ...list.map((keys, j) => {
                        const boxTop = row.top + j * KEY_BOX_HEIGHT;
                        const isSelected =
                            selectedCommand.value === row.command &&
                            selectedIndex.value === j;
                        const showing =
                            isSelected && heldKeys.value.length > 0
                                ? heldKeys.value
                                : keys;
                        const boxLoc: ElementLocator = [
                            BOX_LEFT,
                            boxTop,
                            KEY_BOX_WIDTH,
                            BOX_FILL_HEIGHT
                        ];
                        const textLoc: ElementLocator = [
                            BOX_LEFT + KEY_BOX_WIDTH / 2,
                            boxTop + BOX_FILL_HEIGHT / 2
                        ];
                        // 每个组合展开为按键框与文本两个同级子项
                        return [
                            // 选中按键框同样只切换这个既有矩形的描边
                            <g-rectr
                                loc={boxLoc}
                                circle={[4]}
                                fill
                                stroke
                                fillStyle="rgba(255, 255, 255, 0.08)"
                                strokeStyle={
                                    isSelected ? 'gold' : 'transparent'
                                }
                                lineWidth={isSelected ? 2 : 1}
                                cursor="pointer"
                                onClick={getKeyClick(row.command, j)}
                            />,
                            <text
                                text={formatCombination(showing)}
                                loc={textLoc}
                                anc={[0.5, 0.5]}
                                font={CONTENT_FONT}
                                fillStyle={isSelected ? 'gold' : '#ffffff'}
                                noevent
                            />
                        ];
                    })
                ];
            })}
        </Scroll>
    );

    return () => (
        <ListPage
            loc={FULL_LOC}
            basis={GROUP_BASIS}
            list={groupItems}
            selected={selectedGroup.value}
            lineHeight={GROUP_ROW_HEIGHT}
            font={CONTENT_FONT}
            close
            closeLoc={CLOSE_LOC}
            onUpdate={selectGroup}
            onClose={close}
            nocache
        >
            {{ default: () => renderCommands() }}
        </ListPage>
    );
}, hotkeySettingsProps);

/** 热键设置界面的 UI 控制器 */
export const HotkeySettingsUI = new GameUI('hotkey-settings', HotkeySettings);
