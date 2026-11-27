import { GameUI, SetupComponentOptions } from '@motajs/system';
import { defineComponent, ref } from 'vue';
import { ElementLocator, Font } from '@motajs/render';
import {
    IGameUIPropsBase,
    ISettingItem,
    ISettingSystem,
    ListPage,
    Scroll,
    TextContent,
    useKey
} from '@user/client-base';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '@/client/uiConstant';
import { DefaultProps } from '@motajs/render-vue';

/** 界面左侧与顶部的内边距 */
const LEFT_PAD = 16;
const TOP_PAD = 16;
/** 左侧分组列表的宽度 */
const GROUP_WIDTH = 180;
/** 左侧分组列表占整个界面的宽度比例，交给 ListPage 决定列表区宽度 */
const GROUP_BASIS = GROUP_WIDTH / MAIN_WIDTH;
/** ListPage 内容区的宽度，即界面总宽减去左栏所占的比例 */
const CONTENT_WIDTH = MAIN_WIDTH * (1 - GROUP_BASIS);
/** 左侧列表区域的起始纵坐标 */
const LIST_TOP = TOP_PAD + 32;
/** 左右两栏列表区域的高度，底部留出关闭文本的空间 */
const LIST_HEIGHT = MAIN_HEIGHT - LIST_TOP - 48;
/** 左侧每一行分组的高度 */
const GROUP_ROW_HEIGHT = 24;
/** 单个设置行的高度 */
const ROW_HEIGHT = 64;
/** 设置行之间的纵向间隔 */
const ROW_GAP = 12;
/** 设置行的宽度 */
const ROW_WIDTH = CONTENT_WIDTH - LEFT_PAD * 3;
/** 设置行内文本的宽度，右侧留出固定控件区 */
const ROW_TEXT_WIDTH = ROW_WIDTH - LEFT_PAD * 2 - 180;
/** 设置行内描述文本的纵坐标 */
const DESCRIPTION_TOP = 20;
/** 设置行内预览文本的纵坐标 */
const PREVIEW_TOP = 44;
/** 设置行内控件区的纵坐标 */
const CONTROL_TOP = 20;
/** 右栏内容区的定位，叠加内容区原点后与原有绝对位置一致 */
const CONTENT_SCROLL_LOC: ElementLocator = [
    LEFT_PAD * 2,
    LIST_TOP,
    CONTENT_WIDTH - LEFT_PAD * 3,
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
/** 设置行右侧固定控件区的定位，与控件自身的 180×24 区域一致 */
const CONTROL_AREA_LOC: ElementLocator = [
    ROW_WIDTH - LEFT_PAD - 180,
    CONTROL_TOP,
    180,
    24
];
/** 界面内所有文本共用的字体 */
const CONTENT_FONT = Font.defaults({ size: 13 });

export interface SettingPageProps extends IGameUIPropsBase, DefaultProps {
    // 当前界面显示的设置系统
    readonly system: ISettingSystem;
}

/** 设置界面组件的 props 声明 */
const settingPageProps = {
    props: ['controller', 'instance', 'state', 'system']
} satisfies SetupComponentOptions<SettingPageProps>;

/** 通用设置界面，左栏切换分组，右栏平铺当前分组的设置行 */
export const SettingPage = defineComponent<SettingPageProps>(props => {
    // 分组列表的显示项，第一项为分组 id，第二项为分组名称
    const groupItems: [string, string][] = Array.from(
        props.system.iterateGroups()
    ).map(([id, group]) => [id, group.name]);
    // 当前选中的分组 id，默认取第一个分组
    const selectedGroup = ref<string>(
        groupItems.length > 0 ? groupItems[0][0] : ''
    );

    // 切换当前选中的分组
    const selectGroup = (id: string): void => {
        selectedGroup.value = id;
    };

    // 关闭界面，关闭文本由 ListPage 内置渲染
    const exit = (): void => {
        props.controller.close(props.instance);
    };

    // 渲染单个设置行，包含名称、描述、预览与控件
    const renderRow = (item: ISettingItem, index: number) => {
        const rowTop = index * (ROW_HEIGHT + ROW_GAP);
        const rowLoc: ElementLocator = [0, rowTop, ROW_WIDTH, ROW_HEIGHT];
        const nameLoc: ElementLocator = [LEFT_PAD, 0];
        const descriptionLoc: ElementLocator = [LEFT_PAD, DESCRIPTION_TOP];
        const previewLoc: ElementLocator = [LEFT_PAD, PREVIEW_TOP];
        const Control = item.getSettingComponent();
        return (
            <container loc={rowLoc}>
                <text
                    text={item.name}
                    loc={nameLoc}
                    font={CONTENT_FONT}
                    fillStyle="#ffffff"
                    noevent
                />
                <TextContent
                    text={item.description}
                    loc={descriptionLoc}
                    width={ROW_TEXT_WIDTH}
                    autoHeight
                    font={CONTENT_FONT}
                    noevent
                />
                <text
                    text={item.getPreviewString()}
                    loc={previewLoc}
                    font={CONTENT_FONT}
                    fillStyle="gold"
                    noevent
                />
                {/* 行内右侧的固定控件区，控件只通过设置项与控制器交互 */}
                <container loc={CONTROL_AREA_LOC}>
                    <Control setting={item} controller={props.controller} />
                </container>
            </container>
        );
    };

    // 渲染指定分组的设置行，作为 ListPage 默认插槽的内容
    const renderGroup = (key: string) => {
        const group = props.system.getGroup(key);
        if (!group) return [];
        return (
            <Scroll loc={CONTENT_SCROLL_LOC}>
                {group.items.map(renderRow)}
            </Scroll>
        );
    };

    // 渲染整个页面，空系统时只渲染一个空滚动区占位
    const renderPage = () => {
        if (groupItems.length === 0) {
            return <Scroll loc={CONTENT_SCROLL_LOC} />;
        }
        return (
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
                onClose={exit}
            >
                {{ default: renderGroup }}
            </ListPage>
        );
    };

    const key = useKey(props.state.hotkey.system)!;
    key.implement('@common/exit', exit);

    return () => renderPage();
}, settingPageProps);

/** @see {@link SettingPage} */
export const SettingPageUI = new GameUI('setting-page', SettingPage);
