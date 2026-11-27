import type { CustomContainerRenderFn } from '@motajs/render';
import { defineComponent } from 'vue';

// 同一组 3 个子元素：左侧普通 container 原样绘制，右侧 container-custom 逐个设置递增模糊
const rows = [
    { fillStyle: '#2f6fed', textFillStyle: '#e8f0ff', label: '第一行' },
    { fillStyle: '#7aa7ff', textFillStyle: '#141a22', label: '第二行' },
    { fillStyle: '#f2b84b', textFillStyle: '#141a22', label: '第三行' }
];

export default defineComponent(() => {
    // render 接管子元素绘制：按 index 给每个子元素设置递增的 blur，再逐个绘制
    const render: CustomContainerRenderFn = (canvas, children, transform) => {
        children.forEach((child, index) => {
            if (child.hidden) return;
            child.setFilter(`blur(${index * 2}px)`);
            child.renderContent(canvas);
        });
    };

    // 两侧使用相同结构的三行内容
    const renderRows = () =>
        rows.map((row, index) => (
            <container loc={[0, index * 52, 180, 44]}>
                <g-rect loc={[0, 0, 180, 44]} fillStyle={row.fillStyle} />
                <text
                    loc={[14, 12]}
                    text={row.label}
                    fillStyle={row.textFillStyle}
                />
            </container>
        ));

    return () => (
        <container loc={[0, 0, 480, 320]}>
            <g-rect loc={[0, 0, 480, 320]} fillStyle="#141a22" />

            <text
                loc={[24, 20]}
                text="<container-custom> 逐个设置递增 blur"
                fillStyle="#cfe0ff"
            />

            <g-rect loc={[40, 72, 180, 160]} fillStyle="#1d2430" />
            <g-rect loc={[260, 72, 180, 160]} fillStyle="#1d2430" />

            <text
                loc={[40, 48]}
                text="container：原样绘制"
                fillStyle="#8b98a8"
            />
            <container loc={[40, 72, 180, 160]}>{renderRows()}</container>

            <text
                loc={[260, 48]}
                text="custom：递增 blur"
                fillStyle="#8b98a8"
            />
            <container-custom loc={[260, 72, 180, 160]} render={render}>
                {renderRows()}
            </container-custom>

            <text
                loc={[40, 272]}
                text="同一组子元素：右侧按顺序设置 blur(0 / 2 / 4px)"
                fillStyle="#8b98a8"
            />
        </container>
    );
});
