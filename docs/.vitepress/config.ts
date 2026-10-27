import { defineConfig } from 'vitepress';
import { MermaidMarkdown, MermaidPlugin } from 'vitepress-plugin-mermaid';
import { join } from 'path';

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
            { text: '高级教程', link: '/advanced/' }
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
                            text: 'Anon-Tokyo 解释器',
                            link: '/advanced/iii/anon-tokyo'
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
    vite: {
        // @ts-expect-error 类型错误
        plugins: [MermaidPlugin()],
        optimizeDeps: {
            include: ['mermaid']
        },
        ssr: {
            noExternal: ['mermaid']
        }
    }
});
