import { ReservedProps } from 'vue';
import EventEmitter from 'eventemitter3';
import {
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
import { ERenderItemEvent } from '@motajs/render';

export type WrapEventEmitterEvents<T extends EventEmitter.ValidEventTypes> =
    T extends string | symbol
        ? T
        : {
              [P in keyof T]: T[P] extends any[]
                  ? (...args: T[P]) => void
                  : (...args: any[]) => void;
          };

type MappingEvent<E extends ERenderItemEvent> = {
    [P in keyof WrapEventEmitterEvents<E> as P extends string
        ? `on${Capitalize<P>}`
        : never]?: WrapEventEmitterEvents<E>[P];
};

export type TagDefine<T extends object, E extends ERenderItemEvent> = T &
    MappingEvent<E> &
    ReservedProps;

declare module 'vue/jsx-runtime' {
    namespace JSX {
        export interface IntrinsicElements {
            container: TagDefine<ContainerProps, ERenderItemEvent>;
            'container-custom': TagDefine<
                ConatinerCustomProps,
                ERenderItemEvent
            >;
            shader: TagDefine<ShaderProps, ERenderItemEvent>;
            text: TagDefine<TextProps, ERenderItemEvent>;
            image: TagDefine<ImageProps, ERenderItemEvent>;
            comment: TagDefine<CommentProps, ERenderItemEvent>;
            custom: TagDefine<CustomProps, ERenderItemEvent>;
            'g-rect': TagDefine<RectProps, ERenderItemEvent>;
            'g-circle': TagDefine<CirclesProps, ERenderItemEvent>;
            'g-ellipse': TagDefine<EllipseProps, ERenderItemEvent>;
            'g-line': TagDefine<LineProps, ERenderItemEvent>;
            'g-bezier': TagDefine<BezierProps, ERenderItemEvent>;
            'g-quad': TagDefine<QuadraticProps, ERenderItemEvent>;
            'g-path': TagDefine<PathProps, ERenderItemEvent>;
            'g-rectr': TagDefine<RectRProps, ERenderItemEvent>;
        }
    }
}
