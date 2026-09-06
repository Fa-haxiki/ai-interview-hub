---
title: "图片怎么优化才对 LCP 有用？srcset、WebP、懒加载各管什么？"
category: frontend
topic: engineering
section: 性能优化
difficulty: medium
order: 3
tags: [图片, srcset, LCP]
sources:
  - title: "Responsive images - MDN"
    url: "https://developer.mozilla.org/zh-CN/docs/Web/HTML/Guides/Responsive_images"
    lang: zh
  - title: "Image performance - web.dev"
    url: "https://web.dev/explore/fast#optimize-your-images"
    lang: en
createdAt: "2026-09-06"
---

一句话：**格式、尺寸、优先级三件事。** 现代格式（AVIF/WebP）减小体积；`srcset` + `sizes` 别给手机下 4000px 图；LCP 图不要 `loading="lazy"`，还要占位尺寸防 CLS。

## 清单

```html
<img
  src="/hero-1200.avif"
  srcset="/hero-800.avif 800w, /hero-1200.avif 1200w"
  sizes="(max-width: 640px) 100vw, 720px"
  width="1200"
  height="630"
  fetchpriority="high"
  alt=""
/>
```

装饰图才 lazy。背景 CSS 图不好做 srcset，尽量内容图用 `img`。CDN 按 `Accept` 自动协商格式。精灵图和 icon 用 SVG；大插画才用栅格。

不要用 JS 自己算懒加载代替原生，除非要复杂占位。`decoding="async"` 减少解码挡渲染。

## 可能的追问

- `picture` 和 srcset？艺术指导（裁切不同）用 `picture`；同图不同分辨率用 srcset。
- 为什么 LCP 是图片还很大？没 preload、被 CSS 挡住、或下了过大的那一档。
