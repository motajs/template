<template>
    <container :width="480" :height="320">
        <g-rect
            :x="40"
            :y="40"
            :width="160"
            :height="90"
            :fillStyle="color"
            strokeStyle="#9dc0ff"
            :lineWidth="2"
            @click="onClick"
        />
        <g-circle
            :x="320"
            :y="110"
            :radius="48"
            fillStyle="#e0a42f"
            strokeStyle="#ffe3a3"
            :lineWidth="2"
            @click="onClick"
        />
        <text
            :x="40"
            :y="200"
            :text="'点击次数：' + count"
            fillStyle="#e8f0ff"
        />
        <text
            :x="40"
            :y="240"
            :text="'点击颜色：' + color"
            fillStyle="#8fb6ff"
        />
    </container>
</template>

<script setup lang="ts">
import { ref } from 'vue';

/** 点击次数 */
const count = ref<number>(0);
/** 矩形当前的填充色，点击后轮换 */
const color = ref<string>('#2f6fed');

/** 点击图形时更新计数与颜色 */
function onClick(): void {
    count.value++;
    color.value = color.value === '#2f6fed' ? '#2fbf71' : '#2f6fed';
}
</script>
