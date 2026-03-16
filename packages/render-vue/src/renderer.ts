import { logger } from '@motajs/common';
import {
    RenderItem,
    Text,
    Comment,
    IRenderItem,
    IRenderTreeRoot
} from '@motajs/render';
import {
    ComponentInternalInstance,
    CreateAppFunction,
    createRenderer,
    ElementNamespace,
    RootRenderFunction,
    VNodeProps
} from 'vue';
import { IRenderTagManager } from './types';
import { RenderTagManager } from './tag';

export interface RendererData {
    render: RootRenderFunction<IRenderItem>;
    createApp: CreateAppFunction<IRenderItem>;
    tagManager: IRenderTagManager;
}

export function createRendererFor(renderer: IRenderTreeRoot) {
    const tagManager = new RenderTagManager(renderer);

    const { createApp, render } = createRenderer<IRenderItem, IRenderItem>({
        patchProp: function (
            el: RenderItem,
            key: string,
            prevValue: any,
            nextValue: any,
            namespace?: ElementNamespace,
            parentComponent?: ComponentInternalInstance | null
        ): void {
            el.patchProp(key, prevValue, nextValue, namespace, parentComponent);
        },

        insert: function (
            el: IRenderItem,
            parent: RenderItem,
            _anchor?: IRenderItem | null
        ): void {
            parent.appendChild(el);
        },

        remove: function (el: IRenderItem): void {
            el.destroy();
        },

        createElement: function (
            type: string,
            _namespace?: ElementNamespace,
            _isCustomizedBuiltIn?: string,
            vnodeProps?: (VNodeProps & { [key: string]: any }) | null
        ): IRenderItem {
            const tag = tagManager.getTag(type);
            if (!tag) {
                logger.error(20, type);
                throw new Error(`Cannot create element '${type}'`);
            }
            return tag.onCreate(vnodeProps);
        },

        createText: function (text: string): IRenderItem {
            if (/^\s*$/.test(text)) {
                return new Comment();
            } else {
                logger.warn(38);
            }
            return new Text(text);
        },

        createComment: function (text: string): IRenderItem {
            return renderer.createElement('comment', text);
        },

        setText: function (node: IRenderItem, text: string): void {
            if (node instanceof Text) {
                node.setText(text);
            } else {
                logger.warn(39);
            }
        },

        setElementText: function (node: IRenderItem, text: string): void {
            if (node instanceof Text) {
                node.setText(text);
            } else {
                logger.warn(39);
            }
        },

        parentNode: function (node: IRenderItem): IRenderItem | null {
            return node.parent ?? null;
        },

        nextSibling: function (node: IRenderItem): IRenderItem | null {
            if (!node) return null;
            if (!node.parent) {
                return null;
            } else {
                const parent = node.parent;
                const list = [...parent.children];
                const index = list.indexOf(node);
                return list[index] ?? null;
            }
        }
    });

    return { tagManager, createApp, render };
}
