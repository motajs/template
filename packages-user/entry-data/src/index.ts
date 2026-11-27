import { createMota } from './mota';
import { create } from './create';
import { logger } from '@motajs/common';

export function createData() {
    createMota();
    create();

    if (main.replayChecking) {
        logger.log(
            `如果需要调试录像验证，请在 script/build-game.ts 中将 DEBUG_REPLAY 设为 true，` +
                `此时录像验证中可以看到完整正确的报错栈。调试完毕后，记得将它重新设为 false`
        );
    }
}

export * from './mota';
