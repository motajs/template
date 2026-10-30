# 渲染器内嵌演示（临时技术验证）

本页是「文档内嵌可运行示例」的**临时技术验证页**，不进入导航；POC 通过后再由用户决定是否保留。

## 覆盖范围

- 渲染基础：容器、矩形、圆、文字，以及点击图形后计数与颜色的变化。
- UISystem：`UIController` 打开 / 关闭一个最小 UI，页面上的栈长度与打开状态随之变化。

两个示例都只在浏览器中挂载；构建期预渲染会跳过它们，因此不会触碰 `document`。

<ClientOnly>
  <RenderDemo :loader="basicLoader" :width="480" :height="320" />
  <RenderDemo :loader="uiLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

<script setup>
import RenderDemo from '../.vitepress/components/renderDemo.vue';

const basicLoader = () =>
    import('../.vitepress/components/demos/basicRender.vue');
const uiLoader = () => import('../.vitepress/components/demos/uiSystem.vue');
</script>
