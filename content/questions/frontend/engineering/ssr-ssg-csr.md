---
title: "CSR、SSR、SSG、ISR 怎么选？对 SEO 和 TTFB 各有什么影响？"
category: frontend
topic: engineering
section: 构建与模块化
difficulty: medium
order: 3
tags: [SSR, SSG, CSR, ISR]
sources:
  - title: "Rendering - Next.js"
    url: "https://nextjs.org/docs/app/getting-started/caching"
    lang: en
  - title: "Rendering on the Web - web.dev"
    url: "https://web.dev/articles/rendering-on-the-web"
    lang: en
createdAt: "2026-09-06"
---

一句话：**CSR 空壳快发、首屏等 JS；SSR 每次请求在服务器出 HTML，TTFB 受后端拖；SSG 构建时出静态页，CDN 最快；ISR 静态再按 TTL 回源重建。** 本站这种笔记用 SSG/`output: 'export'` 就对了。

## 怎么选

后台管理系统、登录后的重交互：CSR 或 SSR 混合。营销页、文档、博客：SSG。个性化首页又要 SEO：SSR 或边缘 SSR。数据几分钟一变：ISR 或客户端再拉。

SEO：爬虫能执行 JS，但 SSR/SSG 更稳、分享卡片也有内容。水合成本是 SSR 的代价，见 React hydration 题。

## 实践取舍

不要「全站 SSR 才高级」。按路由选渲染模式。面试讲清「谁在何时生成 HTML」和缓存键（cookie 会让 CDN 不可缓存）。

## 可能的追问

- RSC 算 SSR 吗？服务端组件在服务器跑，可以是静态或动态，比传统 SSR 少发客户端 JS。
- 预渲染和 SSG？同类：构建期出 HTML。
