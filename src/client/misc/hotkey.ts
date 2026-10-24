import { HotkeyEmitMode, KeyCode } from '@motajs/system';
import { IClientCore } from '@user/client-modules';

export function initializeHotkey(state: IClientCore) {
    const hotkey = state.hotkey;
    const system = hotkey.system;

    system.excitedBy(state.rafExcitation);

    //#region 通用按键

    hotkey.setGroup('common', '通用按键', [
        system.addCommand('@common/confirm', '确认', {
            defaults: [[KeyCode.Enter], [KeyCode.Space], [KeyCode.KeyC]],
            priority: 0
        }),
        system.addCommand('@common/exit', '退出/返回上一级', {
            defaults: [[KeyCode.Escape], [KeyCode.KeyX]],
            priority: 0
        }),
        system.addCommand('@common/select-up', '上移选择光标', {
            defaults: [[KeyCode.UpArrow]],
            priority: 0
        }),
        system.addCommand('@common/select-down', '下移选择光标', {
            defaults: [[KeyCode.DownArrow]],
            priority: 0
        }),
        system.addCommand('@common/select-left', '左移选择光标', {
            defaults: [[KeyCode.LeftArrow]],
            priority: 0
        }),
        system.addCommand('@common/select-right', '右移选择光标', {
            defaults: [[KeyCode.RightArrow]],
            priority: 0
        })
    ]);

    //#endregion

    //#region 游戏按键

    hotkey.setGroup('game', '游戏按键', [
        system.addCommand('@game/up', '向上移动', {
            defaults: [[KeyCode.UpArrow]],
            mode: HotkeyEmitMode.Continuous
        }),
        system.addCommand('@game/right', '向右移动', {
            defaults: [[KeyCode.RightArrow]],
            mode: HotkeyEmitMode.Continuous
        }),
        system.addCommand('@game/down', '向下移动', {
            defaults: [[KeyCode.DownArrow]],
            mode: HotkeyEmitMode.Continuous
        }),
        system.addCommand('@game/left', '向左移动', {
            defaults: [[KeyCode.LeftArrow]],
            mode: HotkeyEmitMode.Continuous
        }),
        system.addCommand('@game/turn', '勇士转向', {
            defaults: [[KeyCode.KeyZ]]
        }),
        system.addCommand('@game/undo', '回退', {
            defaults: [[KeyCode.KeyA]]
        }),
        system.addCommand('@game/redo', '恢复', {
            defaults: [[KeyCode.KeyW]]
        }),
        system.addCommand('@game/get-next', '轻按', {
            defaults: [[KeyCode.Space], [KeyCode.Digit7]]
        }),
        system.addCommand('@game/quick-equip', '切换/保存套装', {
            defaults: [
                [KeyCode.Alt, KeyCode.Digit1],
                [KeyCode.Alt, KeyCode.Digit2],
                [KeyCode.Alt, KeyCode.Digit3],
                [KeyCode.Alt, KeyCode.Digit4],
                [KeyCode.Alt, KeyCode.Digit5],
                [KeyCode.Alt, KeyCode.Digit6],
                [KeyCode.Alt, KeyCode.Digit7],
                [KeyCode.Alt, KeyCode.Digit8],
                [KeyCode.Alt, KeyCode.Digit9],
                [KeyCode.Alt, KeyCode.Digit0]
            ]
        })
    ]);

    //#endregion

    //#region UI 界面

    hotkey.setGroup('ui', 'UI 界面', [
        system.addCommand('@ui/book', '怪物手册', {
            defaults: [[KeyCode.KeyX]]
        }),
        system.addCommand('@ui/save', '存档界面', {
            defaults: [[KeyCode.KeyS]]
        }),
        system.addCommand('@ui/load', '读档界面', {
            defaults: [[KeyCode.KeyD]]
        }),
        system.addCommand('@ui/fly', '楼层传送', {
            defaults: [[KeyCode.KeyG]]
        }),
        system.addCommand('@ui/menu', '游戏菜单', {
            defaults: [[KeyCode.Escape]]
        }),
        system.addCommand('@ui/view-map', '浏览地图', {
            defaults: [[KeyCode.PageDown], [KeyCode.PageUp]]
        }),
        system.addCommand('@ui/toolbox', '道具界面', {
            defaults: [[KeyCode.KeyT]]
        }),
        system.addCommand('@ui/command', '装备界面', {
            defaults: [[KeyCode.KeyQ]]
        }),
        system.addCommand('@ui/replay', '回放菜单', {
            defaults: [[KeyCode.KeyR]]
        }),
        system.addCommand('@ui/shop', '快捷商店', {
            defaults: [[KeyCode.KeyV]]
        }),
        system.addCommand('@ui/statistics', '数据统计', {
            defaults: [[KeyCode.Ctrl, KeyCode.KeyB]]
        })
    ]);

    //#endregion

    //#region 系统按键

    hotkey.setGroup('system', '系统按键', [
        system.addCommand('@system/restart', '回到开始界面', {
            defaults: [[KeyCode.KeyN]]
        }),
        system.addCommand('@system/comment', '评论区', {
            defaults: [[KeyCode.KeyP]]
        }),
        system.addCommand('@system/debug', '调试模式', {
            defaults: [[KeyCode.F8]]
        })
    ]);

    //#endregion

    //#region 开始界面

    hotkey.setGroup('@ui/start', '开始界面', [
        system.addCommand('@ui/start-up', '上移光标', {
            defaults: [[KeyCode.UpArrow]],
            mode: HotkeyEmitMode.Once
        }),
        system.addCommand('@ui/start-down', '下移光标', {
            defaults: [[KeyCode.DownArrow]],
            mode: HotkeyEmitMode.Once
        })
    ]);

    //#endregion

    //#region 怪物手册

    hotkey.setGroup('@ui/book', '怪物手册', [
        system.addCommand('@ui/book-up', '上移光标', {
            defaults: [[KeyCode.UpArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/book-down', '下移光标', {
            defaults: [[KeyCode.DownArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/book-page-up', '上移五个怪物', {
            defaults: [[KeyCode.LeftArrow], [KeyCode.PageUp]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/book-page-down', '下移五个怪物', {
            defaults: [[KeyCode.RightArrow], [KeyCode.PageDown]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        })
    ]);

    //#endregion

    //#region 常规楼层传送

    hotkey.setGroup('@ui/fly', '常规楼层传送', [
        system.addCommand('@ui/fly-prev', '上一张地图', {
            defaults: [[KeyCode.DownArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/fly-next', '下一张地图', {
            defaults: [[KeyCode.UpArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/fly-prev-10', '前十张地图', {
            defaults: [[KeyCode.LeftArrow], [KeyCode.PageDown]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/fly-next-10', '后十张地图', {
            defaults: [[KeyCode.RightArrow], [KeyCode.PageUp]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        })
    ]);

    //#endregion

    //#region 平面楼层传送

    hotkey.setGroup('@ui/plane-fly', '平面楼层传送', [
        system.addCommand('@ui/plane-fly-up', '上移地图', {
            defaults: [[KeyCode.UpArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/plane-fly-right', '右移地图', {
            defaults: [[KeyCode.RightArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/plane-fly-down', '下移地图', {
            defaults: [[KeyCode.DownArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/plane-fly-left', '左移地图', {
            defaults: [[KeyCode.LeftArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/plane-fly-prev', '上一张地图', {
            defaults: [[KeyCode.PageDown]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/plane-fly-next', '下一张地图', {
            defaults: [[KeyCode.PageUp]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/plane-fly-prev-10', '前十张地图', {
            defaults: [
                [KeyCode.Ctrl, KeyCode.PageDown],
                [KeyCode.Ctrl, KeyCode.LeftArrow]
            ],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/plane-fly-next-10', '后十张地图', {
            defaults: [
                [KeyCode.Ctrl, KeyCode.PageUp],
                [KeyCode.Ctrl, KeyCode.RightArrow]
            ],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        })
    ]);

    //#endregion

    //#region 存档界面

    hotkey.setGroup('@ui/save', '存档界面', [
        system.addCommand('@ui/save-up', '选择框向上', {
            defaults: [[KeyCode.UpArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/save-up', '选择框向右', {
            defaults: [[KeyCode.RightArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/save-up', '选择框向下', {
            defaults: [[KeyCode.DownArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/save-up', '选择框向左', {
            defaults: [[KeyCode.LeftArrow]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/save-page-prev', '向前翻页', {
            defaults: [[KeyCode.PageUp]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/save-page-next', '向后翻页', {
            defaults: [[KeyCode.PageDown]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/save-page-prev', '向前十页', {
            defaults: [[KeyCode.Ctrl, KeyCode.PageUp]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/save-page-next', '向后十页', {
            defaults: [[KeyCode.Ctrl, KeyCode.PageDown]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        })
    ]);

    //#endregion

    //#region 浏览地图

    hotkey.setGroup('@ui/view-map', '浏览地图', [
        system.addCommand('@ui/view-map-prev', '上一张地图', {
            defaults: [[KeyCode.DownArrow], [KeyCode.PageDown]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/view-map-next', '下一张地图', {
            defaults: [[KeyCode.UpArrow], [KeyCode.PageUp]],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/view-map-prev-10', '前十张地图', {
            defaults: [
                [KeyCode.Ctrl, KeyCode.DownArrow],
                [KeyCode.Ctrl, KeyCode.PageDown]
            ],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/view-map-next-10', '后十张地图', {
            defaults: [
                [KeyCode.Ctrl, KeyCode.UpArrow],
                [KeyCode.Ctrl, KeyCode.PageUp]
            ],
            mode: HotkeyEmitMode.Continuous,
            interval: 500
        }),
        system.addCommand('@ui/view-map-book', '怪物手册', {
            defaults: [[KeyCode.KeyX]],
            priority: 10
        }),
        system.addCommand('@ui/view-map-fly', '传送至', {
            defaults: [[KeyCode.KeyG]],
            priority: 10
        }),
        system.addCommand('@ui/view-map-reset', '重置视角', {
            defaults: [[KeyCode.KeyR]],
            priority: 10
        })
    ]);

    //#endregion
}
