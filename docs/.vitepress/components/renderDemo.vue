<template>
    <div :style="{ background: props.background, overflow: 'hidden' }">
        <canvas ref="canvasRef"></canvas>
    </div>
</template>

<script setup lang="ts">
import { Component, onMounted, onUnmounted, ref } from 'vue';

/** demo 模块的导出形态，只要求默认导出组件 */
interface DemoModule {
    default: Component;
}

/** 动态导入一个 demo 组件的加载函数 */
type DemoLoader = () => Promise<DemoModule>;

/** 包装组件的外部参数 */
interface RenderDemoProps {
    /** 动态导入 demo 组件的加载函数 */
    loader: DemoLoader;
    /** 逻辑宽度 */
    width?: number;
    /** 逻辑高度 */
    height?: number;
    /** 缩放比例 */
    scale?: number;
    /** 画布容器背景色 */
    background?: string;
}

/** 可清理的 app 引用，仅声明清理所需的 unmount */
interface AppHandle {
    unmount(): void;
}

const props = withDefaults(defineProps<RenderDemoProps>(), {
    width: 480,
    height: 320,
    scale: 1,
    background: '#101418'
});

const canvasRef = ref<HTMLCanvasElement | null>(null);

/** 组件是否已经卸载，用于拦截动态导入完成后的竞态 */
let disposed = false;
/** 渲染器的清理入口，在渲染器创建后、挂载 app 之前赋值 */
let dispose: (() => void) | null = null;

onMounted(async () => {
    const { MotaRenderer } = await import('@motajs/render');
    const { createRendererFor } = await import('@motajs/render-vue');
    const demo = await props.loader();
    if (disposed || !canvasRef.value) return;

    const canvas = canvasRef.value;
    const renderer = new MotaRenderer({
        canvas,
        width: props.width,
        height: props.height
    });
    let appRef: AppHandle | null = null;
    dispose = () => {
        if (appRef) {
            appRef.unmount();
        }
        renderer.destroy();
    };
    if (props.scale !== 1) {
        renderer.setScale(props.scale);
    }
    const app = createRendererFor(renderer).createApp(demo.default);
    appRef = app;
    app.mount(renderer);
    // 一个包装实例只服务一个 demo，loader 变更不触发重挂载
});

onUnmounted(() => {
    disposed = true;
    dispose?.();
    dispose = null;
});
</script>
