import {
    EVENT_KEY_CODE_MAP,
    GameUI,
    IHotkeyCommand,
    KeyCode,
    KeyCodeUtils,
    SetupComponentOptions
} from '@motajs/system';
import { Font } from '@motajs/render';
import { computed, defineComponent, onUnmounted, ref, shallowRef } from 'vue';
import { IGameUIPropsBase, Scroll, Selection, useKey } from '@user/client-base';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '@/client/uiConstant';

/** 界面左侧与顶部的内边距 */
const LEFT_PAD = 16;
const TOP_PAD = 16;
/** 左侧分组列表的宽度 */
const GROUP_WIDTH = 180;
/** 左侧每一行分组的高度 */
const GROUP_ROW_HEIGHT = 24;
/** 左侧列表区域的起始纵坐标 */
const LIST_TOP = TOP_PAD + 32;
/** 右侧指令区域的起始横坐标 */
const RIGHT_LEFT = GROUP_WIDTH + LEFT_PAD * 2;
/** 右侧指令区域的宽度 */
const RIGHT_WIDTH = MAIN_WIDTH - RIGHT_LEFT - LEFT_PAD;
/** 左右两栏列表区域的高度，底部留出返回按钮的空间 */
const LIST_HEIGHT = MAIN_HEIGHT - LIST_TOP - 48;
/** 单个按键框的宽度 */
const KEY_BOX_WIDTH = 180;
/** 单个按键框的高度 */
const KEY_BOX_HEIGHT = 24;
/** 指令之间的纵向间隔 */
const COMMAND_GAP = 12;
/** 界面内所有文本共用的字体 */
const CONTENT_FONT = Font.defaults({ size: 13 });

export interface HotkeySettingsProps extends IGameUIPropsBase {}

/** 热键设置组件的 props 声明 */
const hotkeySettingsProps = {
    props: ['controller', 'instance', 'state']
} satisfies SetupComponentOptions<HotkeySettingsProps>;

/** 热键设置界面，左栏切换分组，右栏为每条指令的每个按键组合显示一个可点击框 */
export const HotkeySettings = defineComponent<HotkeySettingsProps>(props => {
    const hotkey = props.state.hotkey;
    const groups = Array.from(hotkey.iterateGroups());
    const selectedGroup = ref(groups.length > 0 ? groups[0][0] : '');
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

    /** 计算一条指令占用的高度，同一指令的多个组合纵向堆叠 */
    const getCommandHeight = (command: IHotkeyCommand): number => {
        return Math.max(command.length, 1) * KEY_BOX_HEIGHT + COMMAND_GAP;
    };

    /** 计算第 index 条指令的顶部纵坐标 */
    const getCommandTop = (index: number): number => {
        let top = 0;
        for (let i = 0; i < index; i++) {
            top += getCommandHeight(commands.value[i]);
        }
        return top;
    };

    /** 计算当前分组全部指令占用的总高度，作为滚动区域的内容高度 */
    const getContentHeight = (): number => {
        let height = 0;
        for (const command of commands.value) {
            height += getCommandHeight(command);
        }
        return height;
    };

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

    return () => (
        <container loc={FULL_LOC}>
            <text
                text="返回"
                loc={[LEFT_PAD, TOP_PAD]}
                cursor="pointer"
                onClick={close}
                font={CONTENT_FONT}
                fillStyle="#ffffff"
            />
            <Scroll loc={[LEFT_PAD, LIST_TOP, GROUP_WIDTH, LIST_HEIGHT]}>
                <container
                    loc={[
                        0,
                        0,
                        GROUP_WIDTH,
                        Math.max(groups.length, 1) * GROUP_ROW_HEIGHT
                    ]}
                >
                    {groups.map(([id, group], groupIndex) => {
                        const isSelected = id === selectedGroup.value;
                        return (
                            <container
                                key={id}
                                loc={[
                                    0,
                                    groupIndex * GROUP_ROW_HEIGHT,
                                    GROUP_WIDTH,
                                    GROUP_ROW_HEIGHT
                                ]}
                                cursor="pointer"
                                onClick={() => selectGroup(id)}
                            >
                                {isSelected && (
                                    <Selection
                                        loc={[
                                            0,
                                            0,
                                            GROUP_WIDTH,
                                            GROUP_ROW_HEIGHT
                                        ]}
                                        border="gold"
                                        noevent
                                    />
                                )}
                                <text
                                    text={group.name}
                                    loc={[8, GROUP_ROW_HEIGHT / 2]}
                                    anc={[0, 0.5]}
                                    font={CONTENT_FONT}
                                    fillStyle={isSelected ? 'gold' : '#ffffff'}
                                />
                            </container>
                        );
                    })}
                </container>
            </Scroll>
            <Scroll loc={[RIGHT_LEFT, LIST_TOP, RIGHT_WIDTH, LIST_HEIGHT]}>
                <container loc={[0, 0, RIGHT_WIDTH, getContentHeight()]}>
                    {commands.value.map((command, commandIndex) => {
                        const list = combinationLists.value[commandIndex] ?? [];
                        return (
                            <container
                                key={command.command}
                                loc={[
                                    0,
                                    getCommandTop(commandIndex),
                                    RIGHT_WIDTH,
                                    getCommandHeight(command)
                                ]}
                            >
                                <text
                                    text={command.name}
                                    loc={[8, 12]}
                                    anc={[0, 0]}
                                    font={CONTENT_FONT}
                                    fillStyle="#ffffff"
                                />
                                <container
                                    loc={[
                                        RIGHT_WIDTH - KEY_BOX_WIDTH - LEFT_PAD,
                                        0,
                                        KEY_BOX_WIDTH,
                                        list.length * KEY_BOX_HEIGHT
                                    ]}
                                >
                                    {list.map((keys, index) => {
                                        const isSelected =
                                            selectedCommand.value === command &&
                                            selectedIndex.value === index;
                                        const showing =
                                            isSelected &&
                                            heldKeys.value.length > 0
                                                ? heldKeys.value
                                                : keys;
                                        return (
                                            <container
                                                key={index}
                                                loc={[
                                                    0,
                                                    index * KEY_BOX_HEIGHT,
                                                    KEY_BOX_WIDTH,
                                                    KEY_BOX_HEIGHT
                                                ]}
                                                cursor="pointer"
                                                onClick={() =>
                                                    selectKey(command, index)
                                                }
                                            >
                                                <g-rectr
                                                    loc={[
                                                        0,
                                                        0,
                                                        KEY_BOX_WIDTH,
                                                        KEY_BOX_HEIGHT - 4
                                                    ]}
                                                    circle={[4]}
                                                    fill
                                                    fillStyle="rgba(255, 255, 255, 0.08)"
                                                />
                                                {isSelected && (
                                                    <Selection
                                                        loc={[
                                                            0,
                                                            0,
                                                            KEY_BOX_WIDTH,
                                                            KEY_BOX_HEIGHT - 4
                                                        ]}
                                                        border="gold"
                                                        noevent
                                                    />
                                                )}
                                                <text
                                                    text={formatCombination(
                                                        showing
                                                    )}
                                                    loc={[
                                                        KEY_BOX_WIDTH / 2,
                                                        (KEY_BOX_HEIGHT - 4) / 2
                                                    ]}
                                                    anc={[0.5, 0.5]}
                                                    font={CONTENT_FONT}
                                                    fillStyle={
                                                        isSelected
                                                            ? 'gold'
                                                            : '#ffffff'
                                                    }
                                                />
                                            </container>
                                        );
                                    })}
                                </container>
                            </container>
                        );
                    })}
                </container>
            </Scroll>
        </container>
    );
}, hotkeySettingsProps);

/** 热键设置界面的 UI 控制器 */
export const HotkeySettingsUI = new GameUI('hotkey-settings', HotkeySettings);
