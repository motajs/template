import { GameUI, SetupComponentOptions } from '@motajs/system';
import {
    computed,
    defineComponent,
    markRaw,
    ref,
    shallowRef,
    watch
} from 'vue';
import { Font } from '@motajs/render';
import { Scroll, useKey } from '@user/client-base';
import { IReadonlyEnemyContext } from '@user/data-system';
import { IReadonlyEnemy } from '@user/data-base';
import { IEnemyAttr, IHeroAttr } from '@user/data-common';
import { BookDetailUI } from './bookDetail';
import { FULL_LOC, MAIN_HEIGHT, MAIN_WIDTH } from '@/client';
import { IGameUIPropsBase } from '@user/client-base';
import { DefaultProps } from '@motajs/render-vue';
import { EnemyOne } from './enemyOne';

export interface BookProps extends IGameUIPropsBase, DefaultProps {
    /** 指定怪物手册使用的怪物上下文，如果不指定，那么会使用 `state.enemyContext` 作为上下文 */
    context: IReadonlyEnemyContext<IEnemyAttr, IHeroAttr>;
}

/** 怪物手册组件的 props 声明 */
const bookProps = {
    props: ['controller', 'instance', 'state', 'context']
} satisfies SetupComponentOptions<BookProps>;

/** 列表中每一行的高度 */
const ROW_HEIGHT = 72;
/** 列表区域的宽度 */
const LIST_WIDTH = MAIN_WIDTH;
/** 列表区域的高度，底部留出退出按钮的空间 */
const LIST_HEIGHT = MAIN_HEIGHT - 36;

/** 怪物名称字体 */
const nameFont = Font.defaults({ size: 15, weight: 700 });
/** 当前层没有怪物时显示的文字字体 */
const noEnemyFont = Font.defaults({ size: 48 });

/** 怪物手册列表组件 */
export const Book = defineComponent<BookProps>(props => {
    /** 当前地图的怪物上下文 */
    const ctx = shallowRef(props.context ?? props.state.enemyContext);
    /** 当前选中的怪物行 */
    const selected = ref(-1);

    watch(
        () => props.context,
        value => {
            ctx.value = value ?? props.state.enemyContext;
        }
    );

    // 按怪物图块数字去重，每个数字保留一个代表视图
    const enemies = computed<IReadonlyEnemy<IEnemyAttr>[]>(() => {
        const codes = new Set<number>();
        for (const [, view] of ctx.value.iterateEnemy()) {
            codes.add(view.getBaseEnemy().code);
        }
        const manager = props.state.enemyManager;
        return [...codes].map(code => {
            return manager.createEnemy(code)!;
        });
    });

    const showDetail = (enemy: IReadonlyEnemy<IEnemyAttr>) => {
        props.controller.open(BookDetailUI, { enemy, context: ctx.value });
    };

    /** 关闭当前怪物手册界面 */
    const exit = () => props.controller.close(props.instance);

    const key = useKey(props.state.hotkey.system)!;
    key.implement('@common/confirm', () => {
        const enemy = enemies.value[selected.value];
        if (enemy) showDetail(enemy);
    })
        .implement('@common/exit', close)
        .implement('@ui/book-up', () => {
            if (selected.value > 1) {
                selected.value--;
            }
        })
        .implement('@ui/book-down', () => {
            if (selected.value < enemies.value.length - 1) {
                selected.value++;
            }
        })
        .implement('@ui/book-page-up', () => {
            const next = selected.value - 5;
            selected.value = Math.max(next, 0);
        })
        .implement('@ui/book-page-down', () => {
            const next = selected.value + 5;
            selected.value = Math.min(next, enemies.value.length - 1);
        });

    return () => (
        <container loc={FULL_LOC} nocache>
            <text
                text="本层无怪物"
                hidden={enemies.value.length !== 0}
                loc={[MAIN_WIDTH / 2, MAIN_HEIGHT / 2]}
                anc={[0.5, 0.5]}
                font={noEnemyFont}
            />
            <Scroll loc={[0, 0, LIST_WIDTH, LIST_HEIGHT]}>
                {enemies.value.map((base, i) => {
                    return (
                        <EnemyOne
                            loc={[0, i * ROW_HEIGHT, LIST_WIDTH, LIST_HEIGHT]}
                            context={markRaw(ctx.value)}
                            enemy={markRaw(base)}
                            selected={selected.value === i}
                            onClick={() => showDetail(base)}
                            onEnter={() => void (selected.value = i)}
                        />
                    );
                })}
            </Scroll>
            <text
                text="退出"
                loc={[MAIN_WIDTH - 16, MAIN_HEIGHT - 16]}
                anc={[1, 1]}
                font={nameFont}
                cursor="pointer"
                fillStyle="#ffffff"
                onClick={exit}
            />
        </container>
    );
}, bookProps);

/** 怪物手册列表的 UI 控制器 */
export const BookUI = new GameUI('book', Book);
