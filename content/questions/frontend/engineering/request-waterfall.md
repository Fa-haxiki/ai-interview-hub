---
title: "请求瀑布是怎么产生的？客户端数据获取为什么容易串行变慢？"
category: frontend
topic: engineering
section: 性能优化
difficulty: medium
order: 5
tags: [瀑布, 数据获取, 性能]
sources:
  - title: "Learn Performance - request waterfalls"
    url: "https://web.dev/articles/async-javascript"
    lang: en
  - title: "Data fetching patterns - Next.js"
    url: "https://nextjs.org/docs/app/building-your-application/data-fetching/fetching"
    lang: en
createdAt: "2026-09-06"
---

一句话：**必须等 A 的响应才能知道 B 的 URL，就会串成瀑布。** 组件树里每个 `useEffect` 各自请求，父完才挂子、子再请求，首屏会变成「JS → 用户 → 帖子 → 评论」四段串行。

## 拆法

能并行的 `Promise.all`。能预知的提前发（preload / Server 里并行 fetch）。把数据提升到路由级一次拿齐，或用 RSC 在服务器并行。GraphQL / BFF 聚合减少往返。

客户端瀑布的经典：瀑布式 React Query，`enabled: !!id`。能接受就用；能在父级一起拉就一起拉。CSS/字体/JS 也会瀑布：`import()` 里再 `import()`，用模块图和 modulepreload 打断。

## 实践取舍

Network 面板看是下载还是排队。面试画时间线比说「用缓存」具体。

## 可能的追问

- 和 HTTP 队头阻塞？H1 连接内排队；H2 多路复用后仍有应用层瀑布。
- SSR 会消除瀑布吗？服务器并行可以，若服务端也 await 一层层，只是把瀑布挪到 TTFB。
