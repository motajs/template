# 图片与纹理

`<image>` 用来显示一张纹理。它只负责把纹理按元素矩形铺开，本身不产生像素，也不负责加载。界面里用到的纹理都已经由客户端登记在贴图管理器里，写 UI 时从那里取，不在页面里现场生成。

## 贴图管理器中的纹理

`props.state.materials` 是 `ITextureManager`，客户端启动时把素材登记进去。取图片有两种方法：

- `getImageByAlias(alias)`：按别名取图片，返回 `ITexture | null`。别名来自素材配置，可能带后缀（如 `bg.jpg`），不是文件路径。
- `getImage(index)`：按数字索引取图片，同样返回 `ITexture | null`。索引也来自素材配置。

```tsx
// 按别名取一张已经登记好的图片
const texture = props.state.materials.getImageByAlias('bg.jpg');

<image image={texture} loc={[40, 48, 96, 96]} />;
```

取到后直接交给 `<image>` 的 `image` 属性，不需要额外判断或占位。

下面是 `<image>` 按 `loc` 显示纹理的效果。

<ClientOnly>
  <RenderDemo :loader="imageBasicLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 图片尺寸

`<image>` 的显示矩形由 `loc` 决定：`[x, y, 宽, 高]`。纹理会被拉伸铺满这个矩形，所以同一张纹理放到不同大小会显示成不同尺寸。宽高比和纹理不一致时会变形，按纹理的原始宽高比给尺寸：

```tsx
// 同一张纹理，显示成 64×64
<image image={texture} loc={[40, 40, 64, 64]} />
```

不写 `loc` 时元素默认 200×200。

下面把同一张纹理放进 64×64、96×96 与 128×128 三个矩形，对照显示尺寸的变化。

<ClientOnly>
  <RenderDemo :loader="imageSizesLoader" :width="480" :height="320" />
  <template #fallback>
    渲染示例需要浏览器环境。
  </template>
</ClientOnly>

## 边界与注意

- 别名来自素材配置，可能带后缀（如 `bg.jpg`），不是文件路径；数字索引也来自同一份配置。
- 同一张纹理取一次就够，不要把取图放进频繁执行的渲染逻辑里重复取。
- 不要在 UI 里现场造纹理；界面只使用贴图管理器里已经登记的素材。
- `<image>` 会把纹理拉伸到 `loc` 的宽高，比例不一致会变形；按原图比例给尺寸。

<script setup>
import RenderDemo from '../../../.vitepress/components/renderDemo.vue';

const imageBasicLoader = () =>
    import('../../../.vitepress/components/demos/ui/image-basic.tsx');
const imageSizesLoader = () =>
    import('../../../.vitepress/components/demos/ui/image-sizes.tsx');
</script>
