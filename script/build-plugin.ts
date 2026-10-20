import { Plugin } from 'vite';
import { ModuleInfo } from 'rollup';

/** 数据端构建中禁止出现的渲染端模块说明符，第一项为匹配规则，第二项为报错时的命中标记 */
const SPECIFIER_BANS: ReadonlyArray<readonly [RegExp, string]> = [
    [/^@user\/client-/, '@user/client-'],
    [/^@user\/entry-client(?:\/|$)/, '@user/entry-client'],
    [/^@motajs\/render(?:[/-]|$)/, '@motajs/render'],
    [/^@motajs\/client(?:[/-]|$)/, '@motajs/client'],
    [/^@motajs\/system(?:[/-]|$)/, '@motajs/system'],
    [/^@motajs\/audio(?:[/-]|$)/, '@motajs/audio'],
    [/^@motajs\/legacy-/, '@motajs/legacy-'],
    [/^vue(?:\/|$)/, 'vue'],
    [/^@vue\//, '@vue/'],
    [/^ant-design-vue(?:\/|$)/, 'ant-design-vue'],
    [/^@ant-design\/icons-vue(?:\/|$)/, '@ant-design/icons-vue']
];

/** 数据端构建中禁止出现的渲染端模块解析路径，第一项为匹配规则，第二项为报错时的命中标记 */
const PATH_BANS: ReadonlyArray<readonly [RegExp, string]> = [
    [/[/\\]packages-user[/\\]client-/, 'packages-user/client-'],
    [/[/\\]packages[/\\]render(?:[/\\-]|$)/, 'packages/render'],
    [/[/\\]packages[/\\]render-vue(?:[/\\-]|$)/, 'packages/render-vue'],
    [/[/\\]packages[/\\]client(?:[/\\-]|$)/, 'packages/client'],
    [/[/\\]packages[/\\]system(?:[/\\-]|$)/, 'packages/system'],
    [/[/\\]packages[/\\]audio(?:[/\\-]|$)/, 'packages/audio'],
    [/[/\\]packages[/\\]legacy-/, 'packages/legacy-'],
    [/[/\\]src[/\\]client(?:[/\\]|$)/, 'src/client'],
    [
        /[/\\]node_modules[/\\](?:vue|@vue|ant-design-vue|@ant-design)(?:[/\\]|$)/,
        'node_modules'
    ]
];

/**
 * 在禁令集合中查找命中的规则
 * @param bans 禁令集合
 * @param value 待匹配的模块说明符或解析路径
 */
function findBan(
    bans: ReadonlyArray<readonly [RegExp, string]>,
    value: string
) {
    return bans.find(ban => ban[0].test(value));
}

/**
 * 创建数据端构建的隔离检查插件，禁止数据端模块图引用任何渲染端模块。
 * 说明符经 `resolveId` 拦截，别名解析后的真实路径经 `moduleParsed` 兜底。
 */
export function dataIsolationPlugin(): Plugin {
    return {
        name: 'mota-data-isolation',
        enforce: 'pre',
        apply: 'build',
        resolveId(source, importer) {
            const ban = findBan(SPECIFIER_BANS, source);
            if (ban) {
                this.error(
                    `[mota-data-isolation] data-side build must not depend on render-side module "${source}" ` +
                        `(matched: ${ban[1]}). Importer: ${importer ?? '<entry>'}`
                );
            }
            return null;
        },
        moduleParsed(info: ModuleInfo) {
            const ban = findBan(PATH_BANS, info.id);
            if (!ban) return;
            const importers = this.getModuleInfo(info.id)!.importers;
            this.error(
                `[mota-data-isolation] data-side build must not depend on render-side module "${info.id}" ` +
                    `(matched: ${ban[1]}). Importers: ${
                        importers.length > 0 ? importers.join(', ') : '<entry>'
                    }`
            );
        }
    };
}
