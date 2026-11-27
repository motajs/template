import { defineComponent, markRaw } from 'vue';
import { TextContent } from '../../../../../packages-user/client-base/src/components/textbox';
import { TextContentTyper } from '../../../../../packages-user/client-base/src/components/textboxTyper';
import { demoMaterials } from './text-demo-materials';

const TYPER = markRaw(
    new TextContentTyper({
        lineHeight: 8,
        fillStyle: '#e8f0ff'
    })
);

const TEXT =
    '[icon=1] 图标与文字并排，[icon=demo_star] 也可以用别名\n' +
    '[c=#f2b84b]外层黄色 [c=#7ee787]内层绿色[/c] 回到外层黄色[/c]\n' +
    '[f=Georgia]Georgia [f=Verdana]Verdana 内层[/f] 回到 Georgia[/f]\n' +
    '[s=20]20 号字[/s] 普通字号，[b]粗体[b] 回到常规，[i]斜体[i] 回到常规\n' +
    '[[[[方括号]]]] 显示为 [[方括号]]，[[ 与 ]] 显示为单个方括号\n' +
    '[c=#8aa0b8][s=13]小字注释[/s][/c]';

// 文本标记：嵌套颜色与字体关闭后恢复之前的值，粗体、斜体是切换，图标取自 materials
export default defineComponent(() => {
    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[40, 24]}
                text="嵌套标记、切换标记与图标"
                fillStyle="#cfe0ff"
            />

            <g-rect loc={[24, 56, 432, 222]} fillStyle="#101820" />
            <TextContent
                loc={[40, 72, 400, 190]}
                autoHeight
                typer={TYPER}
                materials={demoMaterials}
                text={TEXT}
            />
        </container>
    );
});
