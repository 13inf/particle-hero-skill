# 接入自己的页面

## React / Next.js

组件只使用 React Hooks 与浏览器原生绘制、观察器 API。无需额外粒子库；附带组件的样式使用 Tailwind CSS 工具类。

1. 复制 `assets/react/hero-particle-art.tsx` 到项目组件目录。Next.js 保留 `"use client"`。
2. 将 `assets/lineart/particle-bag.webp` 复制到项目 `public/images/hero/particle-bag.webp`。
3. 组件必须位于有尺寸的 `section` 内；外层使用 `relative` 与 `overflow-hidden`。
4. 中央内容使用 `.text-center`，供组件计算椭圆避让区；内容放在 `z-10`，按钮保持正常点击。

```tsx
import HeroParticleArt from "./hero-particle-art";

export default function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#0a100e] px-5 py-24">
      <HeroParticleArt composition="diagonal" />
      <div className="relative z-10 text-center text-white">
        <h1 className="text-5xl font-bold">你的标题</h1>
        <p className="mt-6">你的说明</p>
      </div>
    </section>
  );
}
```

没有 Tailwind CSS 时，将组件的定位、画布尺寸和回退图样式改写成普通 CSS。不要只删掉类名，否则绘制层可能不覆盖父容器。

组件默认读取父级的 `--color-accent-light`，不存在时回退 `#9bb8fe`。修改素材路径时，同时修改正常图片加载与失败回退图片地址。部署使用 URL 前缀时，`/images/...` 需要配合前缀调整。

## 普通 HTML 或其他框架

`assets/demos/particle-mobile.html` 已包含最终绘制逻辑，可作为独立示例。迁移时保留相应的 DOM 尺寸、观察器、事件清理与素材采样，不要引入 React 才能运行这个 HTML。

要重新生成它，修改 React 组件或线稿后，在仓库根目录运行 `npm ci` 和 `npm run build`。输出仍为内嵌图片的单文件。

## 可观察状态

```js
const art = document.querySelector("section canvas");
console.table({
  mode: art?.dataset.mode,
  points: art?.dataset.particles,
  animating: art?.dataset.animating,
  overflow: document.documentElement.scrollWidth > innerWidth
});
```

- 桌面鼠标设备：`interactive`。
- 窄屏、粗指针或无悬停：`auto-scan`。
- 减少动态效果：`static`，绘制稳定后停止。

将组件嵌入长页时，离屏或页面隐藏应停止动画；恢复时继续。单独的首页演示没有附加说明区，因此无法靠滚动到下一段触发离屏检查。
