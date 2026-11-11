import { ReservedProps } from 'vue';
import {
    AnimatedProps,
    BezierProps,
    CirclesProps,
    CommentProps,
    ConatinerCustomProps,
    ContainerProps,
    CustomProps,
    EllipseProps,
    ImageProps,
    LineProps,
    PathProps,
    QuadraticProps,
    RectProps,
    RectRProps,
    ShaderProps,
    TextProps
} from './props';
import { IRenderItemBaseHooks } from '@motajs/render';

export type TagDefine<T extends object, H extends IRenderItemBaseHooks> = T & {
    [K in keyof H]?: H[K];
} & ReservedProps;

declare module 'vue/jsx-runtime' {
    namespace JSX {
        export interface IntrinsicElements {
            container: TagDefine<ContainerProps, IRenderItemBaseHooks>;
            'container-custom': TagDefine<
                ConatinerCustomProps,
                IRenderItemBaseHooks
            >;
            shader: TagDefine<ShaderProps, IRenderItemBaseHooks>;
            text: TagDefine<TextProps, IRenderItemBaseHooks>;
            image: TagDefine<ImageProps, IRenderItemBaseHooks>;
            animated: TagDefine<AnimatedProps, IRenderItemBaseHooks>;
            comment: TagDefine<CommentProps, IRenderItemBaseHooks>;
            custom: TagDefine<CustomProps, IRenderItemBaseHooks>;
            'g-rect': TagDefine<RectProps, IRenderItemBaseHooks>;
            'g-circle': TagDefine<CirclesProps, IRenderItemBaseHooks>;
            'g-ellipse': TagDefine<EllipseProps, IRenderItemBaseHooks>;
            'g-line': TagDefine<LineProps, IRenderItemBaseHooks>;
            'g-bezier': TagDefine<BezierProps, IRenderItemBaseHooks>;
            'g-quad': TagDefine<QuadraticProps, IRenderItemBaseHooks>;
            'g-path': TagDefine<PathProps, IRenderItemBaseHooks>;
            'g-rectr': TagDefine<RectRProps, IRenderItemBaseHooks>;
        }
    }
}
