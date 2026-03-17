import { Patch, PatchClass } from '@motajs/legacy-common';
import { audioContext, bgmPlayer, soundPlayer } from '@user/client-base';
import { mainSetting } from '@motajs/legacy-ui';
import { sleep } from '@motajs/common';
import { isNil } from 'lodash-es';

// todo: 添加弃用警告 logger.warn(56)

export function patchAudio() {
    const patch = new Patch(PatchClass.Control);

    const play = (bgm: BgmIds, when?: number) => {
        bgmPlayer.play(bgm, when);
    };
    const pause = () => {
        bgmPlayer.pause();
    };

    patch.add('playBgm', function (bgm, startTime) {
        play(bgm, startTime);
    });
    patch.add('pauseBgm', function () {
        pause();
    });
    patch.add('resumeBgm', function () {
        bgmPlayer.resume();
    });
    patch.add('checkBgm', function () {
        if (bgmPlayer.playing) return;
        if (mainSetting.getValue('audio.bgmEnabled')) {
            if (bgmPlayer.playingBgm) {
                bgmPlayer.play(bgmPlayer.playingBgm);
            } else {
                play(main.startBgm, 0);
            }
        } else {
            pause();
        }
    });
    patch.add('triggerBgm', function () {
        if (bgmPlayer.playing) bgmPlayer.pause();
        else bgmPlayer.resume();
    });

    patch.add(
        'playSound',
        function (sound, _pitch, callback, position, orientation) {
            const name = core.getMappedName(sound) as SoundIds;
            const num = soundPlayer.play(name, position, orientation);
            const route = audioContext.getRoute(`sounds.${num}`);
            if (!route) {
                callback?.();
                return -1;
            } else {
                sleep(route.duration).then(() => callback?.());
                return num;
            }
        }
    );
    patch.add('stopSound', function (id) {
        if (isNil(id)) {
            soundPlayer.stopAllSounds();
        } else {
            soundPlayer.stop(id);
        }
    });
    patch.add('getPlayingSounds', function () {
        return [...soundPlayer.playing];
    });
}
