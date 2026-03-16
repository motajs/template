import {
    BezierCurve,
    Circle,
    Comment,
    Container,
    CustomContainer,
    CustomRenderItem,
    Ellipse,
    Image,
    IRenderItem,
    IRenderTreeRoot,
    Line,
    Path,
    QuadraticCurve,
    Rect,
    RectR,
    Shader,
    Text
} from '@motajs/render';
import { IRenderTagInfo, IRenderTagManager, TagCreateFunction } from './types';
import { logger } from '@motajs/common';

export class RenderTagManager implements IRenderTagManager {
    /** 标签注册映射 */
    private readonly tagRegistry: Map<string, IRenderTagInfo> = new Map();
    /** 空图片 */
    private readonly emptyImg: HTMLCanvasElement;

    constructor(readonly renderer: IRenderTreeRoot) {
        const emptyImage = document.createElement('canvas');
        emptyImage.width = 1;
        emptyImage.height = 1;
        this.emptyImg = emptyImage;

        this.resgiterIntrinsicTags();
    }

    /**
     * 注册所有的内置标签
     */
    private resgiterIntrinsicTags() {
        this.registerTag(
            'container',
            this.createStandardElement(true, Container)
        );
        this.registerTag(
            'custom',
            this.createStandardElement(true, CustomRenderItem)
        );
        this.registerTag('text', props => {
            if (!props) return this.renderer.createElement(Text, '', false);
            const { text = '', nocache = true, cache = false } = props;
            return this.renderer.createElement(Text, text, cache && !nocache);
        });
        this.registerTag('image', props => {
            if (!props) {
                return this.renderer.createElement(Image, this.emptyImg, false);
            }
            const {
                image = this.emptyImg,
                nocache = true,
                cache = false
            } = props;
            return this.renderer.createElement(Image, image, cache && !nocache);
        });
        this.registerTag('shader', this.createNoParamElement(Shader));
        this.registerTag('comment', props => {
            if (!props) return this.renderer.createElement(Comment);
            else return this.renderer.createElement(Comment, props.text ?? '');
        });
        this.registerTag(
            'template',
            this.createStandardElement(false, Container)
        );
        this.registerTag(
            'custom-container',
            this.createStandardElement(true, CustomContainer)
        );
        this.registerTag('g-rect', this.createStandardElement(false, Rect));
        this.registerTag('g-circle', this.createStandardElement(false, Circle));
        this.registerTag(
            'g-ellipse',
            this.createStandardElement(false, Ellipse)
        );
        this.registerTag('g-line', this.createStandardElement(false, Line));
        this.registerTag(
            'g-bezier',
            this.createStandardElement(false, BezierCurve)
        );
        this.registerTag(
            'g-quad',
            this.createStandardElement(false, QuadraticCurve)
        );
        this.registerTag('g-path', this.createStandardElement(false, Path));
        this.registerTag('g-rectr', this.createStandardElement(false, RectR));
    }

    registerTag(tag: string, onCreate: TagCreateFunction): void {
        if (this.tagRegistry.has(tag)) {
            logger.error(14, tag);
            return;
        }
        const info: IRenderTagInfo = { onCreate };
        this.tagRegistry.set(tag, info);
    }

    getTag(tag: string): IRenderTagInfo | null {
        return this.tagRegistry.get(tag) ?? null;
    }

    createStandardElement(
        cache: boolean,
        Cons: new (enableCache?: boolean) => IRenderItem
    ): TagCreateFunction {
        const enable = cache;
        return props => {
            if (!props) {
                return this.renderer.createElement(Cons, enable);
            }
            const { nocache = !enable, cache = enable } = props;
            return this.renderer.createElement(Cons, cache && !nocache);
        };
    }

    createNoParamElement(Cons: new () => IRenderItem): TagCreateFunction {
        return () => this.renderer.createElement(Cons);
    }
}
