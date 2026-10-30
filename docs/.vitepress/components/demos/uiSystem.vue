<template>
    <container :width="480" :height="320">
        <text :x="40" :y="24" text="打开 UI" fillStyle="#e8f0ff" />
        <g-rect
            :x="40"
            :y="40"
            :width="150"
            :height="56"
            fillStyle="#2f6fed"
            strokeStyle="#9dc0ff"
            :lineWidth="2"
            @click="openUi"
        />
        <text :x="240" :y="24" text="关闭 UI" fillStyle="#e8f0ff" />
        <g-rect
            :x="240"
            :y="40"
            :width="150"
            :height="56"
            fillStyle="#3a2f5f"
            strokeStyle="#b09dff"
            :lineWidth="2"
            @click="closeUi"
        />
        <text
            :x="40"
            :y="140"
            :text="'栈长度：' + stackSize"
            fillStyle="#8fb6ff"
        />
        <text
            :x="40"
            :y="180"
            :text="active ? '已打开' : '未打开'"
            fillStyle="#8fb6ff"
        />
        <UIRenderer />
    </container>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onUnmounted } from 'vue';
import {
    UIController,
    GameUI,
    IUIDefaultPropsBase,
    IUIInstance
} from '@motajs/system';

const controller = new UIController<IUIDefaultPropsBase>();
controller.setPropsBaseCreator((instance, ctrl) => ({
    instance,
    controller: ctrl
}));

/** 当前打开的 UI 实例，打开与关闭必须复用同一个变量 */
let instance: IUIInstance | null = null;

/** 最小 UI 组件，用渲染函数构造，不依赖运行时模板编译器 */
const DemoPanel = defineComponent({
    name: 'PocDemoPanel',
    setup() {
        return () =>
            h('container', { x: 240, y: 140, width: 220, height: 150 }, [
                h('g-rect', {
                    x: 0,
                    y: 0,
                    width: 220,
                    height: 150,
                    fillStyle: '#1d2b45',
                    strokeStyle: '#7aa2ff',
                    lineWidth: 2
                }),
                h('text', {
                    x: 16,
                    y: 40,
                    text: '这是一个最小 UI',
                    fillStyle: '#e8f0ff'
                }),
                h('text', {
                    x: 16,
                    y: 80,
                    text: '由 UIController 打开',
                    fillStyle: '#8fb6ff'
                })
            ]);
    }
});

const ui = new GameUI('poc-minimal-ui', DemoPanel);

/** 把 controller.render() 挂进同一棵渲染树 */
const UIRenderer = defineComponent({
    name: 'PocUIRenderer',
    setup() {
        return () => controller.render();
    }
});

const active = computed<boolean>(() => controller.active.value);
const stackSize = computed<number>(() => controller.stack.length);

/** 打开最小 UI，已打开时不重复入栈 */
function openUi(): void {
    if (instance) return;
    instance = controller.open(ui, {});
}

/** 关闭最小 UI，复用打开时保存的实例 */
function closeUi(): void {
    if (instance) {
        controller.close(instance);
        instance = null;
    }
}

onUnmounted(() => {
    controller.closeAll();
});
</script>
