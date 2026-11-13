import { logger } from '@motajs/common';
import {
    RenderItem,
    Text,
    Comment,
    IRenderItem,
    IRenderTreeRoot
} from '@motajs/render';
import { createRenderer } from 'vue';

export function createRendererFor(renderer: IRenderTreeRoot) {
    return createRenderer<IRenderItem, IRenderItem>({
        patchProp: function (
            el: RenderItem,
            key: string,
            prevValue: any,
            nextValue: any
        ): void {
            el.patchProp(key, prevValue, nextValue);
        },

        insert: function (
            el: IRenderItem,
            parent: RenderItem,
            anchor?: IRenderItem | null
        ): void {
            if (anchor) {
                parent.appendChild(el, anchor);
            } else {
                parent.appendChild(el);
            }
        },

        remove: function (el: IRenderItem): void {
            el.remove();
        },

        createElement: function (type: string): IRenderItem {
            const el = renderer.createElement(type) as RenderItem;
            if (!el) return renderer.createElement('container');
            return el;
        },

        createText: function (text: string): IRenderItem {
            if (/^\s*$/.test(text)) {
                return new Comment();
            } else {
                logger.warn(38);
            }
            return new Text();
        },

        createComment: function (): IRenderItem {
            return renderer.createElement('comment');
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
            return node.parent;
        },

        nextSibling: function (node: IRenderItem): IRenderItem | null {
            if (!node.parent) {
                return null;
            } else {
                const list = node.parent.children;
                const index = list.indexOf(node);
                return list[index + 1] ?? null;
            }
        }
    });
}
