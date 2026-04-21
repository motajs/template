import { logger } from '@motajs/common';
import { hook } from '@user/data-base';
import { ICoreState } from '@user/data-state';

export function patchHero(state: ICoreState) {
    hook.on('resetHero', hero => {
        // patch 旧样板的 core.status.hero，主要是为编辑器服务的
        const attr = state.hero.getModifiableAttribute();
        const proxy = new Proxy(hero, {
            set(target, p, newValue) {
                logger.warn(56, 'core.status.hero', 'state.hero');
                target[p] = newValue;
                // @ts-expect-error 旧样板无法处理此类型
                attr.setBaseAttribute(p, newValue);
                return true;
            },
            get(_, p) {
                logger.warn(56, 'core.status.hero', 'state.hero');
                // @ts-expect-error 旧样板无法处理此类型
                return attr.getBaseAttribute(p);
            }
        });
        core.status.hero = proxy;

        // 不允许再使用旧样板的 flags 接口
        const flagsProxy = new Proxy(core.status.hero.flags, {
            set() {
                logger.error(54, 'flags', 'state.flags');
                return false;
            },
            get() {
                logger.error(54, 'flags', 'state.flags');
                return undefined;
            }
        });
        core.status.hero.flags = flagsProxy;
        window.flags = flagsProxy;
    });
}
