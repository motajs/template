import { defineConfig } from 'vitepress';
import { MermaidMarkdown, MermaidPlugin } from 'vitepress-plugin-mermaid';
import vuejsx from '@vitejs/plugin-vue-jsx';
import { join } from 'path';

/** 文档站内的自定义渲染标签，与主站 vite.config.ts 保持一致 */
const custom = [
    'container',
    'custom',
    'text',
    'image',
    'shader',
    'comment',
    'custom-container',
    'container-custom',
    'map-render',
    'animate',
    'damage',
    'graphics',
    'icon',
    'winskin'
];

/** 判断一个标签是否为自定义渲染标签 */
function isCustomElement(tag: string): boolean {
    return custom.includes(tag) || tag.startsWith('g-');
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: 'HTML5 魔塔样板 V2.B',
    description: 'HTML5 魔塔样板 V2.B 帮助文档',
    base: '/_docs/',
    markdown: {
        math: true,
        config(md) {
            md.use(MermaidMarkdown);
        }
    },
    outDir: join(process.cwd(), 'public', '_docs'),
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        outline: [2, 3],
        nav: [
            { text: '中级教程', link: '/intermediate/data-vs-render' },
            { text: '高级教程', link: '/advanced/' },
            { text: '渲染指南', link: '/render-guide/' }
        ],
        sidebar: {
            '/intermediate/': [
                {
                    text: '中级教程',
                    collapsed: false,
                    items: [
                        {
                            text: '概念与导航',
                            collapsed: false,
                            items: [
                                {
                                    text: '数据端与渲染端',
                                    link: '/intermediate/data-vs-render'
                                },
                                {
                                    text: 'src 导览',
                                    link: '/intermediate/src-tour'
                                },
                                {
                                    text: '代码基础',
                                    link: '/intermediate/code-basics'
                                },
                                { text: '钩子', link: '/intermediate/hooks' }
                            ]
                        },
                        {
                            text: '基础接口',
                            collapsed: false,
                            items: [
                                {
                                    text: '数据端总览',
                                    link: '/intermediate/data-state-overview'
                                },
                                {
                                    text: '勇士属性',
                                    link: '/intermediate/hero-attribute'
                                },
                                {
                                    text: '勇士道具',
                                    link: '/intermediate/hero-items'
                                },
                                {
                                    text: '勇士装备',
                                    link: '/intermediate/hero-equipment'
                                },
                                {
                                    text: '勇士位置',
                                    link: '/intermediate/hero-location'
                                },
                                {
                                    text: '地图结构',
                                    link: '/intermediate/map-structure'
                                },
                                {
                                    text: '地图图块',
                                    link: '/intermediate/map-tiles'
                                },
                                {
                                    text: '图块存储',
                                    link: '/intermediate/tile-store'
                                },
                                {
                                    text: 'Flag 变量',
                                    link: '/intermediate/flags'
                                }
                            ]
                        },
                        {
                            text: '战斗',
                            collapsed: false,
                            items: [
                                {
                                    text: '战斗总览',
                                    link: '/intermediate/combat-overview'
                                },
                                {
                                    text: '怪物特殊属性',
                                    link: '/intermediate/enemy-specials'
                                },
                                {
                                    text: '光环',
                                    link: '/intermediate/enemy-aura'
                                },
                                {
                                    text: '查询效果',
                                    link: '/intermediate/enemy-query'
                                },
                                {
                                    text: '最终属性',
                                    link: '/intermediate/enemy-final'
                                },
                                {
                                    text: '伤害计算',
                                    link: '/intermediate/enemy-calculator'
                                },
                                {
                                    text: '地图伤害',
                                    link: '/intermediate/enemy-map-damage'
                                },
                                {
                                    text: '战斗脚本',
                                    link: '/intermediate/enemy-combat-script'
                                },
                                {
                                    text: '状态钩子',
                                    link: '/intermediate/enemy-status-hooks'
                                }
                            ]
                        },
                        {
                            text: '其他',
                            collapsed: false,
                            items: [
                                {
                                    text: '自定义事件',
                                    link: '/intermediate/events'
                                },
                                {
                                    text: '录像指令',
                                    link: '/intermediate/replay-commands'
                                },
                                {
                                    text: '数据插件',
                                    link: '/intermediate/data-plugins'
                                }
                            ]
                        }
                    ]
                }
            ],
            '/advanced/': [
                { text: '高级教程总导览', link: '/advanced/' },
                {
                    text: '高级 I · 扩展基础',
                    collapsed: false,
                    items: [
                        { text: '高级 I 导览', link: '/advanced/i/' },
                        {
                            text: '声明式 vs 命令式接口',
                            link: '/advanced/i/declarative-vs-imperative'
                        },
                        {
                            text: '插件系统',
                            link: '/advanced/i/plugin-system'
                        },
                        {
                            text: '可存档内容',
                            link: '/advanced/i/saveable-content'
                        },
                        {
                            text: '录像一致性',
                            link: '/advanced/i/replay-consistency'
                        },
                        {
                            text: 'data-common 的 Store',
                            link: '/advanced/i/data-stores'
                        },
                        {
                            text: '钩子深入',
                            link: '/advanced/i/hooks-in-depth'
                        },
                        { text: '移动 Mover', link: '/advanced/i/mover' },
                        {
                            text: 'FaceHandler 系列',
                            link: '/advanced/i/face-handler'
                        }
                    ]
                },
                {
                    text: '高级 II · 深入定制',
                    collapsed: false,
                    items: [
                        { text: '高级 II 导览', link: '/advanced/ii/' },
                        {
                            text: '自定义范围对象',
                            link: '/advanced/ii/custom-range'
                        },
                        {
                            text: '静态图块与动态图块',
                            link: '/advanced/ii/static-vs-dynamic-tiles'
                        },
                        {
                            text: '点事件与图块事件',
                            link: '/advanced/ii/point-and-tile-events'
                        },
                        {
                            text: '勇士的装备系统',
                            link: '/advanced/ii/equipment-system'
                        },
                        {
                            text: '自定义录像指令',
                            link: '/advanced/ii/custom-replay-command'
                        },
                        {
                            text: '自动寻路',
                            link: '/advanced/ii/pathfinding'
                        },
                        {
                            text: '新增勇士属性',
                            link: '/advanced/ii/adding-hero-attribute'
                        },
                        {
                            text: '新增怪物属性',
                            link: '/advanced/ii/adding-enemy-attribute'
                        },
                        {
                            text: '怪物上下文与战斗深入',
                            link: '/advanced/ii/enemy-context-and-combat'
                        }
                    ]
                },
                {
                    text: '高级 III · 原理与架构',
                    collapsed: false,
                    items: [
                        { text: '高级 III 导览', link: '/advanced/iii/' },
                        {
                            text: '加载系统',
                            link: '/advanced/iii/loading-system'
                        },
                        {
                            text: '录像系统底层',
                            link: '/advanced/iii/replay-internals'
                        },
                        {
                            text: '事件系统',
                            link: '/advanced/iii/event-system'
                        },
                        {
                            text: '通行性谓词与寻路原理',
                            link: '/advanced/iii/passability-and-pathfinding'
                        },
                        {
                            text: 'CoreState 组装与初始化',
                            link: '/advanced/iii/core-state'
                        },
                        {
                            text: '插件内部机制',
                            link: '/advanced/iii/plugin-internals'
                        }
                    ]
                }
            ],
            '/render-guide/': [
                {
                    text: '渲染基础',
                    collapsed: false,
                    items: [
                        {
                            text: 'UI 通用模板（TSX）',
                            link: '/render-guide/basics/ui-template'
                        },
                        {
                            text: 'UI 入门',
                            link: '/render-guide/basics/ui-basics'
                        },
                        {
                            text: '第一个静态界面',
                            link: '/render-guide/basics/first-static-ui'
                        },
                        {
                            text: '容器与坐标',
                            link: '/render-guide/basics/container-and-coordinates'
                        },
                        {
                            text: '基础图形',
                            link: '/render-guide/basics/basic-shapes'
                        },
                        {
                            text: '文字',
                            link: '/render-guide/basics/text'
                        },
                        {
                            text: '图片与纹理',
                            link: '/render-guide/basics/image-and-texture'
                        },
                        {
                            text: '自绘元素与自定义容器',
                            link: '/render-guide/basics/custom-and-container-custom'
                        },
                        {
                            text: '通用参数',
                            link: '/render-guide/basics/common-props'
                        },
                        {
                            text: '层级、变换与性能',
                            link: '/render-guide/basics/layer-transform-performance'
                        }
                    ]
                },
                {
                    text: '渲染进阶',
                    collapsed: false,
                    items: [
                        {
                            text: '响应式',
                            link: '/render-guide/advanced/reactivity'
                        },
                        {
                            text: '事件与交互',
                            link: '/render-guide/advanced/events'
                        },
                        {
                            text: '条件渲染与循环渲染',
                            link: '/render-guide/advanced/conditional-and-list-rendering'
                        },
                        {
                            text: '按键与快捷键',
                            link: '/render-guide/advanced/hotkey-in-ui'
                        },
                        {
                            text: '什么是组件',
                            link: '/render-guide/advanced/what-is-component'
                        },
                        {
                            text: '内置组件：基础',
                            link: '/render-guide/advanced/builtin-basic'
                        },
                        {
                            text: '内置组件：布局',
                            link: '/render-guide/advanced/builtin-layout'
                        },
                        {
                            text: '内置组件：文本',
                            link: '/render-guide/advanced/builtin-text'
                        },
                        {
                            text: '自定义组件',
                            link: '/render-guide/advanced/custom-components'
                        },
                        {
                            text: '动画',
                            link: '/render-guide/advanced/animation'
                        },
                        {
                            text: 'UI 系统',
                            link: '/render-guide/advanced/ui-system'
                        },
                        {
                            text: 'UI 性能',
                            link: '/render-guide/advanced/ui-performance'
                        },
                        {
                            text: '示例（一）目标与骨架',
                            link: '/render-guide/advanced/inventory-example-1-skeleton'
                        },
                        {
                            text: '示例（二）道具网格',
                            link: '/render-guide/advanced/inventory-example-2-grid'
                        },
                        {
                            text: '示例（三）详情区',
                            link: '/render-guide/advanced/inventory-example-3-detail'
                        },
                        {
                            text: '示例（四）滚动与列表',
                            link: '/render-guide/advanced/inventory-example-4-scroll'
                        },
                        {
                            text: '示例（五）交互与状态',
                            link: '/render-guide/advanced/inventory-example-5-state'
                        },
                        {
                            text: '示例（六）动画、拆分与注册',
                            link: '/render-guide/advanced/inventory-example-6-animation-and-register'
                        }
                    ]
                },
                {
                    text: '渲染底层',
                    collapsed: false,
                    items: [
                        {
                            text: '动画曲线',
                            link: '/render-guide/internals/animation-curves'
                        },
                        {
                            text: '动画激励',
                            link: '/render-guide/internals/animation-excitation'
                        },
                        {
                            text: '动画执行器',
                            link: '/render-guide/internals/animation-runner'
                        },
                        {
                            text: '渐变执行器',
                            link: '/render-guide/internals/animation-transition'
                        }
                    ]
                }
            ]
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/unanmed/HumanBreak' }
        ],
        search: {
            provider: 'local',
            options: {
                locales: {
                    zh: {
                        translations: {
                            button: {
                                buttonText: '搜索文档',
                                buttonAriaLabel: '搜索文档'
                            },
                            modal: {
                                noResultsText: '无法找到相关结果',
                                resetButtonTitle: '清除查询条件',
                                footer: {
                                    selectText: '选择',
                                    navigateText: '切换'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    locales: {
        root: {
            lang: 'zh',
            label: '中文'
        }
    },
    vue: {
        template: {
            compilerOptions: {
                isCustomElement
            }
        }
    },
    vite: {
        // @ts-expect-error 类型错误
        plugins: [MermaidPlugin(), vuejsx({ isCustomElement })],
        resolve: {
            alias: [
                {
                    find: /^@motajs\/(.+)$/,
                    replacement: `${process.cwd()}/packages/$1/src`
                },
                {
                    find: /^@user\/(.+)$/,
                    replacement: `${process.cwd()}/packages-user/$1/src`
                }
            ],
            dedupe: ['vue']
        },
        optimizeDeps: {
            include: ['mermaid']
        },
        ssr: {
            noExternal: ['mermaid']
        }
    }
});
