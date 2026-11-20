/**
 * 切换全屏状态
 * @param full 是否全屏
 */
export async function triggerFullscreen(full: boolean) {
    if (document.fullscreenElement && !full) {
        if (window.jsinterface) {
            window.jsinterface.requestPortrait();
            return;
        }
        await document.exitFullscreen();
    }
    if (full && !document.fullscreenElement) {
        if (window.jsinterface) {
            window.jsinterface.requestLandscape();
            return;
        }
        await document.body.requestFullscreen();
    }
}
