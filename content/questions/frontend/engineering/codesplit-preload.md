---
title: "路由懒加载、preload 和 prefetch 怎么配合？会不会反而更慢？"
category: frontend
topic: engineering
section: 性能优化
difficulty: medium
order: 2
tags: [code splitting, preload, prefetch]
sources:
  - title: "Preload, prefetch and other <link> tags - web.dev"
    url: "https://web.dev/articles/preload-critical-assets"
    lang: en
  - title: "Lazy-loading components - React"
    url: "https://react.dev/reference/react/lazy"
    lang: en
createdAt: "2026-09-06"
---

一句话：**首屏用不上的路由和重组件用动态 `import()` 切开；马上要用的关键资源 `preload`，下一页大概率要用的 `prefetch`。** 乱 preload 会和 LCP 抢带宽，比不切块更慢。

## 怎么切

```ts
const Editor = lazy(() => import("./Editor"));
```

按路由、按「点开才需要的编辑器 / 图表」。SSR 要用能配合的框架（Next 的动态导入），否则首屏闪 fallback。切太碎会变多请求瀑布，相关模块应打进同一 chunk。

`rel=preload` 提高优先级，适合当前页的字体、LCP 图、关键 JS。`prefetch` 低优先级，适合鼠标悬停在「下一页」或空闲时。`preconnect` 只建连接，适合第三方源。`modulepreload` 给 ESM。

## 实践取舍

先看覆盖率：一个 5KB 组件不必切。分析器里看重复依赖是否该抽 `manualChunks`。面试讲「切块是为了推迟下载，资源提示是为了提前下载」，两者方向相反，要成对设计。

## 可能的追问

- prefetch 在省流模式？浏览器可能忽略，功能不能依赖它已完成。
- React.lazy 的错误边界？网络失败要 fallback，不能只写一个 spinner。
