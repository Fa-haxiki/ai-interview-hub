---
title: "SSR 水合（hydration）在做什么？为什么会 mismatch？"
category: frontend
topic: react
section: 渲染机制
difficulty: hard
order: 5
tags: [hydration, SSR, mismatch]
sources:
  - title: "react-dom/client hydrateRoot"
    url: "https://zh-hans.react.dev/reference/react-dom/client/hydrateRoot"
    lang: zh
  - title: "Server and Client Components - Next.js"
    url: "https://nextjs.org/docs/app/getting-started/server-and-client-components"
    lang: en
createdAt: "2026-09-06"
---

一句话：**服务端先吐 HTML，客户端用同一棵树在现有 DOM 上挂事件，而不是推倒重画。** 两端第一次渲染的文本、属性、节点结构必须一致，否则 React 会警告并可能丢掉服务端 DOM 重渲，省下的 TTFB 优势就浪费了。

## 常见不一致

`Date.now()`、`Math.random()`、`window`、`localStorage` 主题、按客户端语言分支。修：这些读放到 `useEffect` 之后，或用框架的 `suppressHydrationWarning` 仅限极小文本（时间戳）。Invalid HTML（`<p>` 里套 `<div>`）也会让浏览器改 DOM，对不上虚拟树。

React 18 流式 SSR + Selective Hydration：先水合用户点到的部分。代价是包更大、心智更复杂。Next App Router 的 Server Component 默认不发到客户端，Client Component 才水合——边界要用 `'use client'` 画清。

## 实践取舍

能 Server Component 就别整页 `'use client'`。必须客户端的岛（编辑器、图表）单独划。面试能区分「SSR 出 HTML」和「CSR 空壳」，以及 mismatch 的修复顺序。

## 可能的追问

- `hydrateRoot` 和 `createRoot`？后者会清掉容器再画，SEO 的 HTML 就没了。
- 为什么开发有双渲染？Strict Mode，不是 hydration 本身。
